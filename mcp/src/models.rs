use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyzeRequest {
    pub location: String,
    pub analysis_type: Option<String>,
    pub params: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatRequest {
    pub messages: Vec<ChatMessage>,
    pub context: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderResponse {
    pub provider: String,
    pub content: serde_json::Value,
    pub confidence: f32,
    pub latency_ms: u64,
    pub tokens_used: Option<u32>,
    pub cost_usd: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnsembledResponse {
    pub final_content: serde_json::Value,
    pub confidence: f32,
    pub providers_used: Vec<String>,
    pub total_cost_usd: f32,
    pub cache_hit: bool,
    pub provenance: Vec<ProviderResponse>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheEntry {
    pub key: String,
    pub value: serde_json::Value,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub expires_at: chrono::DateTime<chrono::Utc>,
    pub hit_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorSearchResult {
    pub doc_id: String,
    pub similarity: f32,
    pub content: serde_json::Value,
}

#[derive(Debug, Clone)]
pub enum ProviderType {
    Local,
    Perplexity,
    Gemini,
    OpenAI,
}

impl ProviderType {
    pub fn as_str(&self) -> &str {
        match self {
            ProviderType::Local => "local",
            ProviderType::Perplexity => "perplexity",
            ProviderType::Gemini => "gemini",
            ProviderType::OpenAI => "openai",
        }
    }
}
