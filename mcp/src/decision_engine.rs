use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use serde_json::{json, Value};
use std::sync::Arc;
use std::env;

use crate::{AppState, models::{AnalyzeRequest, ChatRequest, EnsembledResponse, ProviderResponse}};
use crate::cache::CacheManager;
use crate::providers::ProviderRegistry;

pub struct DecisionEngine {
    cache: Arc<CacheManager>,
    provider_registry: Arc<ProviderRegistry>,
}

impl DecisionEngine {
    pub fn new(cache: Arc<CacheManager>, provider_registry: Arc<ProviderRegistry>) -> Self {
        Self {
            cache,
            provider_registry,
        }
    }

    /// Main decision logic for property analysis
    pub async fn plan_and_execute(&self, req: &AnalyzeRequest) -> Result<EnsembledResponse, Box<dyn std::error::Error>> {
        let start_time = std::time::Instant::now();
        
        // 1. Generate canonical cache key
        let params = req.params.clone().unwrap_or_default();
        let params_value = serde_json::to_value(params)?;
        let cache_key = self.cache.generate_key(&req.location, &params_value);

        // 2. Check cache (Redis → PostgreSQL)
        if let Some(cached_value) = {
            let mut cache_clone = CacheManager::new(
                self.cache.redis.clone(),
                self.cache.postgres.clone()
            );
            cache_clone.get(&cache_key).await?
        } {
            tracing::info!("🎯 Cache HIT - returning cached result");
            return Ok(EnsembledResponse {
                final_content: cached_value,
                confidence: 1.0,
                providers_used: vec!["cache".to_string()],
                total_cost_usd: 0.0,
                cache_hit: true,
                provenance: vec![],
            });
        }

        tracing::info!("🔍 Cache MISS - executing decision pipeline");

        // 3. Vector similarity search (if embedder available)
        let vector_similarity = self.check_vector_similarity(&req.location).await?;
        
        if vector_similarity > 0.88 {
            tracing::info!("✅ High vector similarity ({}) - using cached summary", vector_similarity);
            // TODO: Retrieve and synthesize from vector DB
        }

        // 4. Decide provider based on policy
        let provider_type = self.select_provider(req).await;
        
        tracing::info!("🎯 Selected provider: {:?}", provider_type);

        // 5. Execute provider calls
        let mut responses: Vec<ProviderResponse> = Vec::new();

        // Try local first (if available)
        if let Ok(local_response) = self.call_local_provider(req).await {
            responses.push(local_response);
        }

        // Call external provider based on policy
        match provider_type {
            crate::models::ProviderType::Perplexity => {
                if let Ok(response) = self.provider_registry.call_perplexity(req).await {
                    responses.push(response);
                }
            }
            crate::models::ProviderType::Gemini => {
                if let Ok(response) = self.provider_registry.call_gemini(req).await {
                    responses.push(response);
                }
            }
            crate::models::ProviderType::OpenAI => {
                if let Ok(response) = self.provider_registry.call_openai(req).await {
                    responses.push(response);
                }
            }
            _ => {}
        }

        // 6. Ensemble responses
        let ensembled = self.ensemble_responses(responses).await?;

        // 7. Store in cache
        let ttl_short = env::var("CACHE_TTL_SHORT")
            .unwrap_or_else(|_| "3600".to_string())
            .parse::<u64>()
            .unwrap_or(3600);
        
        let ttl_long = env::var("CACHE_TTL_LONG")
            .unwrap_or_else(|_| "86400".to_string())
            .parse::<i64>()
            .unwrap_or(86400);

        let mut cache_store = CacheManager::new(
            self.cache.redis.clone(),
            self.cache.postgres.clone()
        );
        cache_store.set(&cache_key, &ensembled.final_content, ttl_short, ttl_long).await?;

        let elapsed = start_time.elapsed();
        tracing::info!("⏱️  Total execution time: {:?}", elapsed);

        Ok(ensembled)
    }

    async fn check_vector_similarity(&self, _location: &str) -> Result<f32, Box<dyn std::error::Error>> {
        // TODO: Implement vector DB query
        Ok(0.0)
    }

    async fn select_provider(&self, req: &AnalyzeRequest) -> crate::models::ProviderType {
        // Policy-based provider selection
        if req.analysis_type.as_deref() == Some("web_grounded") {
            crate::models::ProviderType::Perplexity
        } else if req.analysis_type.as_deref() == Some("agentic") {
            crate::models::ProviderType::Gemini
        } else if req.analysis_type.as_deref() == Some("conversational") {
            crate::models::ProviderType::OpenAI
        } else {
            crate::models::ProviderType::Local
        }
    }

    async fn call_local_provider(&self, req: &AnalyzeRequest) -> Result<ProviderResponse, Box<dyn std::error::Error>> {
        // Call xbooster service
        let xbooster_url = env::var("XBOOSTER_URL")
            .unwrap_or_else(|_| "http://localhost:8002".to_string());

        let client = reqwest::Client::new();
        let start = std::time::Instant::now();
        
        let response = client
            .post(format!("{}/analyze", xbooster_url))
            .json(req)
            .timeout(std::time::Duration::from_secs(10))
            .send()
            .await?;

        let content: Value = response.json().await?;
        let latency = start.elapsed().as_millis() as u64;

        Ok(ProviderResponse {
            provider: "local".to_string(),
            content,
            confidence: 0.7,
            latency_ms: latency,
            tokens_used: None,
            cost_usd: Some(0.0),
        })
    }

    async fn ensemble_responses(&self, responses: Vec<ProviderResponse>) -> Result<EnsembledResponse, Box<dyn std::error::Error>> {
        if responses.is_empty() {
            return Err("No provider responses available".into());
        }

        // Simple strategy: use highest confidence response
        let best = responses.iter()
            .max_by(|a, b| a.confidence.partial_cmp(&b.confidence).unwrap())
            .unwrap();

        let total_cost: f32 = responses.iter()
            .filter_map(|r| r.cost_usd)
            .sum();

        let providers_used: Vec<String> = responses.iter()
            .map(|r| r.provider.clone())
            .collect();

        Ok(EnsembledResponse {
            final_content: best.content.clone(),
            confidence: best.confidence,
            providers_used,
            total_cost_usd: total_cost,
            cache_hit: false,
            provenance: responses,
        })
    }
}

/// HTTP handler for analyze endpoint
pub async fn analyze_handler(
    State(state): State<AppState>,
    Json(req): Json<AnalyzeRequest>,
) -> Result<Json<EnsembledResponse>, StatusCode> {
    match state.decision_engine.plan_and_execute(&req).await {
        Ok(response) => Ok(Json(response)),
        Err(e) => {
            tracing::error!("Analysis error: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// HTTP handler for chat endpoint
pub async fn chat_handler(
    State(_state): State<AppState>,
    Json(_req): Json<ChatRequest>,
) -> Result<Json<Value>, StatusCode> {
    // TODO: Implement chat logic
    Ok(Json(json!({"message": "Chat endpoint not yet implemented"})))
}
