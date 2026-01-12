use axum::{
    extract::{State, Query},
    response::IntoResponse,
    Json,
    http::StatusCode,
};
use serde::Deserialize;
use serde_json::json;
use crate::email;
use super::search::AppState;
use std::env;

#[derive(Debug, Deserialize)]
pub struct EmailTestParams {
    to: Option<String>,
}

pub async fn test_email_handler(
    State(_state): State<AppState>,
    Query(params): Query<EmailTestParams>,
) -> impl IntoResponse {
    let to = params.to.unwrap_or_else(|| "gokulreena3@gmail.com".to_string());
    
    match email::send_email(&to, "Test Email from Terratruce", "This is a test email sent from the Terratruce backend to verify SMTP configuration.").await {
        Ok(_) => (StatusCode::OK, Json(json!({"status": "success", "message": format!("Email sent to {}", to)}))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"status": "error", "message": e}))).into_response(),
    }
}

pub async fn test_gemini_handler(State(_state): State<AppState>) -> impl IntoResponse {
    let api_key = match env::var("GEMINI_API_KEY") {
        Ok(k) => k,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": "GEMINI_API_KEY missing in .env"}))).into_response(),
    };

    let client = reqwest::Client::new();
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={}",
        api_key
    );

    let payload = json!({
        "contents": [{
            "parts": [{"text": "Reply with 'OK' if you receive this."}]
        }]
    });

    match client.post(&url).header("Content-Type", "application/json").json(&payload).send().await {
        Ok(res) => {
             let status = res.status();
             let body = res.text().await.unwrap_or_default();
             (StatusCode::OK, Json(json!({"status_code": status.as_u16(), "response": body}))).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))).into_response()
    }
}
