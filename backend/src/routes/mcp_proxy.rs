use axum::{
    extract::{State, Json},
    http::StatusCode,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::env;

use super::search::AppState;

#[derive(Debug, Deserialize)]
pub struct McpAnalyzeRequest {
    pub location: String,
    pub analysis_type: Option<String>,
    pub params: Option<Value>,
}

#[derive(Debug, Serialize)]
pub struct McpResponse {
    pub final_content: Value,
    pub confidence: f32,
    pub providers_used: Vec<String>,
    pub total_cost_usd: f32,
    pub cache_hit: bool,
}

/// POST /api/mcp/analyze - Proxy to MCP service for intelligent analysis
pub async fn mcp_analyze(
    State(_state): State<AppState>,
    Json(payload): Json<McpAnalyzeRequest>,
) -> impl IntoResponse {
    let mcp_url = env::var("MCP_URL")
        .unwrap_or_else(|_| "http://localhost:3001".to_string());

    tracing::info!("🎯 Proxying analysis request to MCP: {}", payload.location);

    let client = reqwest::Client::new();
    
    match client
        .post(format!("{}/api/mcp/analyze", mcp_url))
        .json(&payload)
        .timeout(std::time::Duration::from_secs(60))
        .send()
        .await
    {
        Ok(response) => {
            let status = response.status();
            
            if !status.is_success() {
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                tracing::error!("❌ MCP error ({}): {}", status, error_text);
                
                return (
                    StatusCode::from_u16(status.as_u16()).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR),
                    Json(serde_json::json!({
                        "error": "MCP service error",
                        "details": error_text
                    }))
                ).into_response();
            }

            match response.json::<Value>().await {
                Ok(data) => {
                    tracing::info!("✅ MCP analysis successful");
                    (StatusCode::OK, Json(data)).into_response()
                }
                Err(e) => {
                    tracing::error!("❌ Failed to parse MCP response: {:?}", e);
                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(serde_json::json!({
                            "error": "Failed to parse MCP response",
                            "details": e.to_string()
                        }))
                    ).into_response()
                }
            }
        }
        Err(e) => {
            tracing::error!("❌ Failed to reach MCP service: {:?}", e);
            
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(serde_json::json!({
                    "error": "MCP service unavailable",
                    "details": format!("Could not connect to MCP at {}: {}", mcp_url, e),
                    "fallback": "Using direct API calls"
                }))
            ).into_response()
        }
    }
}

/// GET /api/mcp/metrics - Get MCP metrics
pub async fn mcp_metrics(
    State(_state): State<AppState>,
) -> impl IntoResponse {
    let mcp_url = env::var("MCP_URL")
        .unwrap_or_else(|_| "http://localhost:3001".to_string());

    let client = reqwest::Client::new();
    
    match client
        .get(format!("{}/api/mcp/metrics", mcp_url))
        .send()
        .await
    {
        Ok(response) => {
            match response.json::<Value>().await {
                Ok(data) => (StatusCode::OK, Json(data)).into_response(),
                Err(_) => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({"error": "Failed to parse metrics"}))
                ).into_response()
            }
        }
        Err(_) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(serde_json::json!({"error": "MCP service unavailable"}))
        ).into_response()
    }
}

/// GET /api/mcp/model-card - Get provider model card
pub async fn mcp_model_card(
    State(_state): State<AppState>,
) -> impl IntoResponse {
    let mcp_url = env::var("MCP_URL")
        .unwrap_or_else(|_| "http://localhost:3001".to_string());

    let client = reqwest::Client::new();
    
    match client
        .get(format!("{}/api/mcp/model-card", mcp_url))
        .send()
        .await
    {
        Ok(response) => {
            match response.json::<Value>().await {
                Ok(data) => (StatusCode::OK, Json(data)).into_response(),
                Err(_) => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({"error": "Failed to parse model card"}))
                ).into_response()
            }
        }
        Err(_) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(serde_json::json!({"error": "MCP service unavailable"}))
        ).into_response()
    }
}
