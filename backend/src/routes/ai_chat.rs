use axum::{
    extract::{State, Json},
    response::IntoResponse,
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::env;

use super::search::AppState;

#[derive(Debug, Deserialize)]
pub struct ChatRequest {
    pub model: Option<String>,
    pub messages: Vec<ChatMessage>,
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
    pub top_p: Option<f32>,
    pub stream: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

/// POST /api/chat - Proxy for AI chat completions
pub async fn chat_handler(
    State(_state): State<AppState>,
    Json(payload): Json<ChatRequest>,
) -> impl IntoResponse {
    // Validate request
    if payload.messages.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "Invalid request",
                "message": "The 'messages' array cannot be empty",
                "code": "AI_EMPTY_MESSAGES"
            }))
        ).into_response();
    }

    let api_key = match env::var("AI_SERVICE_API_KEY") {
        Ok(key) => {
            if key.is_empty() {
                tracing::error!("AI_SERVICE_API_KEY is empty");
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({
                        "error": "AI service API key is not configured",
                        "message": "The AI_SERVICE_API_KEY environment variable is empty. Please add a valid API key to the backend .env file.",
                        "code": "AI_KEY_EMPTY"
                    }))
                ).into_response();
            }
            key
        },
        Err(_) => {
            tracing::error!("AI_SERVICE_API_KEY not found in environment");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "error": "AI service API key is missing",
                    "message": "The AI_SERVICE_API_KEY environment variable is not set. Please add it to the backend .env file.",
                    "code": "AI_KEY_MISSING"
                }))
            ).into_response();
        }
    };

    let client = reqwest::Client::new();
    
    // Build the request body
    let mut body = json!({
        "model": payload.model.unwrap_or_else(|| "llama-3.1-sonar-small-128k-online".to_string()),
        "messages": payload.messages,
    });

    if let Some(max_tokens) = payload.max_tokens {
        body["max_tokens"] = json!(max_tokens);
    }
    if let Some(temperature) = payload.temperature {
        body["temperature"] = json!(temperature);
    }
    if let Some(top_p) = payload.top_p {
        body["top_p"] = json!(top_p);
    }
    if let Some(stream) = payload.stream {
        body["stream"] = json!(stream);
    }

    tracing::info!("Proxying request to AI service");

    match client
        .post("https://api.perplexity.ai/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
    {
        Ok(response) => {
            let status = response.status();
            
            if !status.is_success() {
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                tracing::error!("AI service error ({}): {}", status, error_text);
                
                let (error_msg, code) = match status.as_u16() {
                    400 => ("Invalid AI service request", "AI_BAD_REQUEST"),
                    401 => ("Invalid or expired AI service API key", "AI_UNAUTHORIZED"),
                    403 => ("AI service access forbidden", "AI_FORBIDDEN"),
                    429 => ("Too many AI requests. Please try again later", "AI_RATE_LIMIT"),
                    500 => ("AI service internal error", "AI_SERVER_ERROR"),
                    503 => ("AI service temporarily unavailable", "AI_UNAVAILABLE"),
                    _ => ("AI service error", "AI_ERROR"),
                };
                
                return (
                    StatusCode::from_u16(status.as_u16()).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR),
                    Json(json!({
                        "error": error_msg,
                        "message": error_text,
                        "code": code,
                        "status": status.as_u16()
                    }))
                ).into_response();
            }

            match response.json::<Value>().await {
                Ok(data) => {
                    tracing::info!("Successfully proxied AI request");
                    (StatusCode::OK, Json(data)).into_response()
                }
                Err(e) => {
                    tracing::error!("Failed to parse AI response: {:?}", e);
                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(json!({
                            "error": "Failed to parse AI response",
                            "message": "The AI service returned an invalid response format",
                            "code": "AI_PARSE_ERROR"
                        }))
                    ).into_response()
                }
            }
        }
        Err(e) => {
            tracing::error!("Failed to call AI service: {:?}", e);
            
            let (error_msg, code) = if e.is_timeout() {
                ("AI request timed out", "AI_TIMEOUT")
            } else if e.is_connect() {
                ("Cannot connect to AI service", "AI_CONNECTION_ERROR")
            } else {
                ("AI service unavailable", "AI_SERVICE_ERROR")
            };
            
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "error": error_msg,
                    "message": format!("Failed to reach AI service: {}", e),
                    "code": code
                }))
            ).into_response()
        }
    }
}
