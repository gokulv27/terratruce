use axum::{
    extract::Json,
    response::IntoResponse,
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use crate::email::send_email;

#[derive(Deserialize)]
pub struct ReportRequest {
    pub email: String,
    pub location: String,
    pub overall_score: i32,
    pub summary: String,
    pub details: serde_json::Value,
}

#[derive(Serialize)]
pub struct ReportResponse {
    pub message: String,
}

pub async fn email_report(
    Json(payload): Json<ReportRequest>,
) -> impl IntoResponse {
    let subject = format!("Terra Truce Risk Report: {}", payload.location);
    
    let body = format!(
        "Risk Analysis Report for {}\n\n\
        Overall Risk Score: {}/100\n\n\
        Summary:\n{}\n\n\
        You can view the full details in the dashboard.\n\n\
        --\nTerra Truce AI",
        payload.location,
        payload.overall_score,
        payload.summary
    );

    // Send to the requested email
    match send_email(&payload.email, &subject, &body).await {
        Ok(_) => {
            tracing::info!("Report emailed to {}", payload.email);
            (StatusCode::OK, Json(ReportResponse { message: "Email sent".to_string() }))
        },
        Err(e) => {
            tracing::error!("Failed to email report: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ReportResponse { message: "Failed to send email".to_string() }))
        }
    }
}
