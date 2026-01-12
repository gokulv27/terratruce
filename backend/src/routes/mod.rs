mod health;
mod search;
mod ai_chat;
mod api_proxy;
mod test_utils;
pub mod report;
mod mcp_proxy;
mod mcp_protection;

use axum::{
    routing::{get, post},
    Router,
};
use sqlx::{PgPool, Pool, Postgres};
use tower_http::cors::CorsLayer;

use self::search::AppState;

pub fn create_router(pool: Pool<Postgres>) -> Router {
    let state = AppState { pool };

    Router::new()
        .route("/health", get(health::health_check))
        .route("/api/search", get(search::get_recent_searches).post(search::create_search_history))
        .route("/api/chat", post(ai_chat::chat_handler))
        .route("/api/maps/config", get(api_proxy::get_maps_config))
        .route("/api/geocode", get(api_proxy::geocode_address))
        .route("/api/gemini", post(api_proxy::gemini_generate))
        .route("/api/perplexity", post(api_proxy::perplexity_chat))
        .route("/api/report/email", post(report::email_report))
        .route("/api/test-email", get(test_utils::test_email_handler))
        .route("/api/test-gemini", get(test_utils::test_gemini_handler))
        // MCP routes (direct)
        .route("/api/mcp/analyze", post(mcp_proxy::mcp_analyze))
        .route("/api/mcp/metrics", get(mcp_proxy::mcp_metrics))
        .route("/api/mcp/model-card", get(mcp_proxy::mcp_model_card))
        // Protected MCP routes (with auto-correction and validation)
        .route("/api/protected/analyze", post(mcp_protection::protected_analyze))
        .route("/api/protected/health", get(mcp_protection::protection_health))
        .layer(CorsLayer::permissive())
        .with_state(state)
}
