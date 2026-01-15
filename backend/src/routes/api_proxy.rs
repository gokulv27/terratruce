use axum::{
    extract::{State, Json, Query},
    response::IntoResponse,
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::env;

use super::search::AppState;

// ============ Google Maps Proxy ============

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct MapsConfigRequest {
    // Empty - just returns the API key
}

/// GET /api/maps/config - Returns Google Maps configuration
pub async fn get_maps_config(
    State(_state): State<AppState>,
) -> impl IntoResponse {
    let api_key = match env::var("GOOGLE_MAPS_API_KEY") {
        Ok(key) => {
            if key.is_empty() {
                tracing::error!("GOOGLE_MAPS_API_KEY is empty");
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({
                        "error": "Google Maps API key is not configured",
                        "message": "The GOOGLE_MAPS_API_KEY environment variable is empty. Please add a valid API key to the backend .env file.",
                        "code": "MAPS_KEY_EMPTY"
                    }))
                ).into_response();
            }
            key
        },
        Err(_) => {
            tracing::error!("GOOGLE_MAPS_API_KEY not found in environment");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "error": "Google Maps API key is missing",
                    "message": "The GOOGLE_MAPS_API_KEY environment variable is not set. Please add it to the backend .env file.",
                    "code": "MAPS_KEY_MISSING"
                }))
            ).into_response();
        }
    };

    tracing::info!("Successfully retrieved Google Maps API key");
    (StatusCode::OK, Json(json!({"apiKey": api_key}))).into_response()
}

// ============ OpenCage Geocoding Proxy ============

#[derive(Debug, Deserialize)]
pub struct GeocodeRequest {
    pub q: String,  // Query (address or coordinates)
    pub limit: Option<u32>,
    pub language: Option<String>,
}

/// GET /api/geocode - Proxy for OpenCage geocoding
pub async fn geocode_address(
    State(_state): State<AppState>,
    Query(params): Query<GeocodeRequest>,
) -> impl IntoResponse {
    // Validate query parameter
    if params.q.trim().is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "Invalid request",
                "message": "The 'q' parameter (location query) cannot be empty",
                "code": "INVALID_QUERY"
            }))
        ).into_response();
    }

    let api_key = match env::var("OPENCAGE_API_KEY") {
        Ok(key) => {
            if key.is_empty() {
                tracing::error!("OPENCAGE_API_KEY is empty");
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({
                        "error": "Geocoding API key is not configured",
                        "message": "The OPENCAGE_API_KEY environment variable is empty. Please add a valid API key to the backend .env file.",
                        "code": "GEOCODE_KEY_EMPTY"
                    }))
                ).into_response();
            }
            key
        },
        Err(_) => {
            tracing::error!("OPENCAGE_API_KEY not found in environment");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "error": "Geocoding API key is missing",
                    "message": "The OPENCAGE_API_KEY environment variable is not set. Please add it to the backend .env file.",
                    "code": "GEOCODE_KEY_MISSING"
                }))
            ).into_response();
        }
    };

    let client = reqwest::Client::new();
    
    let mut url = format!(
        "https://api.opencagedata.com/geocode/v1/json?q={}&key={}",
        urlencoding::encode(&params.q),
        api_key
    );

    if let Some(limit) = params.limit {
        url.push_str(&format!("&limit={}", limit));
    }

    if let Some(language) = params.language {
        url.push_str(&format!("&language={}", language));
    }

    tracing::info!("Proxying geocoding request for: {}", params.q);

    match client.get(&url).send().await {
        Ok(response) => {
            let status = response.status();
            
            if !status.is_success() {
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                tracing::error!("Geocoding API error ({}): {}", status, error_text);
                
                let (error_msg, code) = match status.as_u16() {
                    401 => ("Invalid or expired OpenCage API key", "GEOCODE_UNAUTHORIZED"),
                    402 => ("OpenCage API quota exceeded", "GEOCODE_QUOTA_EXCEEDED"),
                    403 => ("OpenCage API access forbidden", "GEOCODE_FORBIDDEN"),
                    429 => ("Too many geocoding requests. Please try again later", "GEOCODE_RATE_LIMIT"),
                    _ => ("Geocoding service error", "GEOCODE_ERROR"),
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
                    tracing::info!("Successfully proxied geocoding request");
                    (StatusCode::OK, Json(data)).into_response()
                }
                Err(e) => {
                    tracing::error!("Failed to parse geocoding response: {:?}", e);
                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(json!({
                            "error": "Failed to parse geocoding response",
                            "message": "The geocoding service returned an invalid response format",
                            "code": "GEOCODE_PARSE_ERROR"
                        }))
                    ).into_response()
                }
            }
        }
        Err(e) => {
            tracing::error!("Failed to call geocoding service: {:?}", e);
            
            let (error_msg, code) = if e.is_timeout() {
                ("Geocoding request timed out", "GEOCODE_TIMEOUT")
            } else if e.is_connect() {
                ("Cannot connect to geocoding service", "GEOCODE_CONNECTION_ERROR")
            } else {
                ("Geocoding service unavailable", "GEOCODE_SERVICE_ERROR")
            };
            
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "error": error_msg,
                    "message": format!("Failed to reach OpenCage API: {}", e),
                    "code": code
                }))
            ).into_response()
        }
    }
}

// ============ Gemini AI Proxy ============

#[derive(Debug, Deserialize, Serialize)]
pub struct GeminiRequest {
    pub contents: Vec<GeminiContent>,
    #[serde(rename = "generationConfig")]
    pub generation_config: Option<GeminiGenerationConfig>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct GeminiContent {
    pub role: String,
    pub parts: Vec<GeminiPart>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct GeminiPart {
    pub text: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct GeminiGenerationConfig {
    pub temperature: Option<f32>,
    #[serde(rename = "maxOutputTokens")]
    pub max_output_tokens: Option<u32>,
    #[serde(rename = "responseMimeType")]
    pub response_mime_type: Option<String>,
}

/// POST /api/gemini - Proxy for Gemini AI
pub async fn gemini_generate(
    State(_state): State<AppState>,
    Json(payload): Json<GeminiRequest>,
) -> impl IntoResponse {
    // Validate request
    if payload.contents.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "Invalid request",
                "message": "The 'contents' array cannot be empty",
                "code": "GEMINI_EMPTY_CONTENTS"
            }))
        ).into_response();
    }

    let api_key = match env::var("GEMINI_API_KEY") {
        Ok(key) => {
            if key.is_empty() {
                tracing::error!("GEMINI_API_KEY is empty");
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({
                        "error": "Gemini API key is not configured",
                        "message": "The GEMINI_API_KEY environment variable is empty. Please add a valid API key to the backend .env file.",
                        "code": "GEMINI_KEY_EMPTY"
                    }))
                ).into_response();
            }
            key
        },
        Err(_) => {
            tracing::error!("GEMINI_API_KEY not found in environment");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "error": "Gemini API key is missing",
                    "message": "The GEMINI_API_KEY environment variable is not set. Please add it to the backend .env file.",
                    "code": "GEMINI_KEY_MISSING"
                }))
            ).into_response();
        }
    };

    let client = reqwest::Client::new();
    
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={}",
        api_key
    );

    tracing::info!("Proxying Gemini AI request");

    match client
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
    {
        Ok(response) => {
            let status = response.status();
            
            if !status.is_success() {
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                tracing::error!("Gemini API error ({}): {}", status, error_text);
                
                let (error_msg, code) = match status.as_u16() {
                    400 => ("Invalid Gemini API request", "GEMINI_BAD_REQUEST"),
                    401 => ("Invalid or expired Gemini API key", "GEMINI_UNAUTHORIZED"),
                    403 => ("Gemini API access forbidden", "GEMINI_FORBIDDEN"),
                    429 => ("Too many AI requests. Please try again later", "GEMINI_RATE_LIMIT"),
                    500 => ("Gemini service internal error", "GEMINI_SERVER_ERROR"),
                    503 => ("Gemini service temporarily unavailable", "GEMINI_UNAVAILABLE"),
                    _ => ("Gemini AI service error", "GEMINI_ERROR"),
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
                    tracing::info!("Successfully proxied Gemini request");
                    (StatusCode::OK, Json(data)).into_response()
                }
                Err(e) => {
                    tracing::error!("Failed to parse Gemini response: {:?}", e);
                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(json!({
                            "error": "Failed to parse Gemini response",
                            "message": "The Gemini API returned an invalid response format",
                            "code": "GEMINI_PARSE_ERROR"
                        }))
                    ).into_response()
                }
            }
        }
        Err(e) => {
            tracing::error!("Failed to call Gemini API: {:?}", e);
            
            let (error_msg, code) = if e.is_timeout() {
                ("Gemini request timed out", "GEMINI_TIMEOUT")
            } else if e.is_connect() {
                ("Cannot connect to Gemini service", "GEMINI_CONNECTION_ERROR")
            } else {
                ("Gemini service unavailable", "GEMINI_SERVICE_ERROR")
            };
            
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "error": error_msg,
                    "message": format!("Failed to reach Gemini API: {}", e),
                    "code": code
                }))
            ).into_response()
        }
    }
}

// ============ Perplexity AI Proxy ============

#[derive(Debug, Deserialize, Serialize)]
pub struct PerplexityRequest {
    pub model: String,
    pub messages: Vec<PerplexityMessage>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
    pub top_p: Option<f32>,
    pub return_citations: Option<bool>,
    pub stream: Option<bool>,
    pub presence_penalty: Option<f32>,
    pub frequency_penalty: Option<f32>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct PerplexityMessage {
    pub role: String,
    pub content: String,
}

/// POST /api/perplexity - Proxy for Perplexity AI
pub async fn perplexity_chat(
    State(_state): State<AppState>,
    Json(payload): Json<PerplexityRequest>,
) -> impl IntoResponse {
    let api_key = match env::var("PERPLEXITY_API_KEY") {
        Ok(key) => {
            if key.is_empty() {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "PERPLEXITY_API_KEY is empty in .env"}))
                ).into_response();
            }
            key
        },
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "PERPLEXITY_API_KEY not found in .env"}))
            ).into_response();
        }
    };

    let client = reqwest::Client::new();
    let url = "https://api.perplexity.ai/chat/completions";

    tracing::info!("Proxying Perplexity AI request (Model: {})", payload.model);

    match client
        .post(url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
    {
        Ok(response) => {
            let status = response.status();
            if !status.is_success() {
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                tracing::error!("Perplexity API error ({}): {}", status, error_text);
                return (
                    StatusCode::from_u16(status.as_u16()).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR),
                    Json(json!({"error": "Perplexity API Error", "details": error_text}))
                ).into_response();
            }
            match response.json::<Value>().await {
                Ok(data) => (StatusCode::OK, Json(data)).into_response(),
                Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": "Failed to parse Perplexity JSON", "details": e.to_string()}))).into_response()
            }
        }
        Err(e) => (StatusCode::SERVICE_UNAVAILABLE, Json(json!({"error": "Failed to reach Perplexity API", "details": e.to_string()}))).into_response()
    }
}
