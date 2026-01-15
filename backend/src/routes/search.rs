use axum::{
    extract::{State, Json},
    response::IntoResponse,
};
use sqlx::{PgPool, types::BigDecimal};
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::models::search_history::SearchHistory;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
}

#[derive(Debug, Deserialize)]
pub struct CreateSearchHistoryRequest {
    pub location_name: String,
    pub user_id: Option<Uuid>,
    pub risk_score: Option<i32>,
    pub search_data: Option<Value>,
    pub latitude: Option<BigDecimal>,
    pub longitude: Option<BigDecimal>,
    pub city: Option<String>,
    pub state: Option<String>,
}

pub async fn create_search_history(
    State(state): State<AppState>,
    Json(payload): Json<CreateSearchHistoryRequest>,
) -> impl IntoResponse {
    let result = sqlx::query_as::<_, SearchHistory>(
        r#"
        INSERT INTO search_history (
            user_id, location_name, risk_score, search_data, 
            latitude, longitude, city, state, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
        "#
    )
    .bind(payload.user_id)
    .bind(payload.location_name)
    .bind(payload.risk_score)
    .bind(payload.search_data)
    .bind(payload.latitude)
    .bind(payload.longitude)
    .bind(payload.city)
    .bind(payload.state)
    .fetch_one(&state.pool)
    .await;

    match result {
        Ok(record) => (axum::http::StatusCode::CREATED, Json(json!(record))).into_response(),
        Err(e) => {
            tracing::error!("Failed to create search history: {:?}", e);
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Failed to create record"})),
            )
                .into_response()
        }
    }
}

pub async fn get_recent_searches(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let result = sqlx::query_as::<_, SearchHistory>(
        "SELECT * FROM search_history ORDER BY created_at DESC LIMIT 10"
    )
    .fetch_all(&state.pool)
    .await;

    match result {
        Ok(records) => Json(json!(records)).into_response(),
        Err(e) => {
            tracing::error!("Failed to fetch search history: {:?}", e);
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Failed to fetch records"})),
            )
                .into_response()
        }
    }
}
