mod decision_engine;
mod providers;
mod cache;
mod models;
mod email;

use axum::{
    routing::{get, post},
    Router,
    extract::Query,
    Json,
};
use dotenvy::dotenv;
use serde::Deserialize;
use sqlx::postgres::PgPoolOptions;
use std::env;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::cache::CacheManager;
use crate::decision_engine::DecisionEngine;
use crate::providers::ProviderRegistry;
use crate::email::EmailService;

#[derive(Clone)]
pub struct AppState {
    pub cache: Arc<CacheManager>,
    pub decision_engine: Arc<DecisionEngine>,
    pub provider_registry: Arc<ProviderRegistry>,
    pub email_service: Option<Arc<EmailService>>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables
    dotenv().ok();

    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "mcp=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("🚀 Starting MCP (Model Control Proxy) Service");

    // Database connection
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://postgres:password@localhost:5432/terratruce".to_string());

    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
        .await?;

    tracing::info!("✅ Connected to PostgreSQL");

    // Redis connection
    let redis_url = env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string());
    
    let redis_client = redis::Client::open(redis_url)?;
    let redis_conn = redis_client.get_connection_manager().await?;

    tracing::info!("✅ Connected to Redis");

    // Initialize email service
    let email_service = match EmailService::new() {
        Ok(service) => {
            if service.is_configured() {
                tracing::info!("✅ Email service configured");
                Some(Arc::new(service))
            } else {
                tracing::warn!("⚠️  Email service not configured (missing credentials)");
                None
            }
        }
        Err(e) => {
            tracing::warn!("⚠️  Email service initialization failed: {}", e);
            None
        }
    };

    // Initialize components
    let cache = Arc::new(CacheManager::new(redis_conn, pool.clone()));
    let provider_registry = Arc::new(ProviderRegistry::new());
    let decision_engine = Arc::new(DecisionEngine::new(
        cache.clone(),
        provider_registry.clone(),
    ));

    let state = AppState {
        cache,
        decision_engine,
        provider_registry,
        email_service,
    };

    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/mcp/analyze", post(decision_engine::analyze_handler))
        .route("/api/mcp/chat", post(decision_engine::chat_handler))
        .route("/api/mcp/metrics", get(metrics_handler))
        .route("/api/mcp/model-card", get(model_card_handler))
        .route("/api/mcp/email/test", get(test_email_handler))
        .route("/api/mcp/email/health", get(email_health_handler))
        .layer(CorsLayer::permissive())
        .with_state(state);

    // Start server
    let port: u16 = env::var("MCP_PORT")
        .unwrap_or_else(|_| "3001".to_string())
        .parse()
        .unwrap_or(3001);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("🎯 MCP listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> &'static str {
    "MCP Service: OK"
}

async fn metrics_handler(
    axum::extract::State(state): axum::extract::State<AppState>,
) -> axum::Json<serde_json::Value> {
    let metrics = state.provider_registry.get_metrics().await;
    axum::Json(metrics)
}

async fn model_card_handler(
    axum::extract::State(state): axum::extract::State<AppState>,
) -> axum::Json<serde_json::Value> {
    let model_card = state.provider_registry.get_model_card().await;
    axum::Json(model_card)
}

#[derive(Deserialize)]
struct EmailTestQuery {
    to: Option<String>,
}

async fn test_email_handler(
    axum::extract::State(state): axum::extract::State<AppState>,
    Query(params): Query<EmailTestQuery>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    let email_service = state.email_service
        .ok_or(axum::http::StatusCode::SERVICE_UNAVAILABLE)?;

    let to_email = params.to.unwrap_or_else(|| 
        env::var("SMTP_USERNAME").unwrap_or_else(|_| "test@example.com".to_string())
    );

    match email_service.send_test_email(&to_email).await {
        Ok(_) => Ok(Json(serde_json::json!({
            "success": true,
            "message": format!("Test email sent to {}", to_email)
        }))),
        Err(e) => {
            tracing::error!("Failed to send test email: {}", e);
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn email_health_handler(
    axum::extract::State(state): axum::extract::State<AppState>,
) -> Json<serde_json::Value> {
    let configured = state.email_service.is_some();
    
    Json(serde_json::json!({
        "email_service": {
            "configured": configured,
            "smtp_host": env::var("SMTP_HOST").unwrap_or_else(|_| "not_set".to_string()),
            "smtp_port": env::var("SMTP_PORT").unwrap_or_else(|_| "not_set".to_string()),
            "from_email": env::var("SMTP_FROM_EMAIL").unwrap_or_else(|_| "not_set".to_string()),
        }
    }))
}
