use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::types::BigDecimal;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct SearchHistory {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub location_name: Option<String>,
    pub risk_score: Option<i32>,
    pub search_data: Option<Value>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub latitude: Option<BigDecimal>,
    pub longitude: Option<BigDecimal>,
    pub city: Option<String>,
    pub state: Option<String>,
}
