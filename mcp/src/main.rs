mod decision_engine;
mod providers;
mod cache;
mod models;

use axum::{
    routing::{get, post},
    Router,
};
use dotenvy::dotenv;
use sqlx::postgres::PgPoolOptions;
use std::env;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::cache::CacheManager;
use crate::decision_engine::DecisionEngine;
use crate::providers::ProviderRegistry;

#[derive(Clone)]
pub struct AppState {
    pub cache: Arc<CacheManager>,
    pub decision_engine: Arc<DecisionEngine>,
    pub provider_registry: Arc<ProviderRegistry>,
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
    };

    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/mcp/analyze", post(decision_engine::analyze_handler))
        .route("/api/mcp/chat", post(decision_engine::chat_handler))
        .route("/api/mcp/metrics", get(metrics_handler))
        .route("/api/mcp/model-card", get(model_card_handler))
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
