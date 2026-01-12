mod perplexity;
mod gemini;
mod openai;

use async_trait::async_trait;
use serde_json::Value;
use std::sync::Arc;
use tokio::sync::RwLock;
use std::collections::HashMap;

use crate::models::{AnalyzeRequest, ProviderResponse};

pub use perplexity::PerplexityClient;
pub use gemini::GeminiClient;
pub use openai::OpenAIClient;

#[async_trait]
pub trait Provider: Send + Sync {
    async fn call(&self, req: &AnalyzeRequest) -> Result<ProviderResponse, Box<dyn std::error::Error>>;
    fn name(&self) -> &str;
    fn cost_per_1k_tokens(&self) -> f32;
}

pub struct ProviderRegistry {
    providers: Arc<RwLock<HashMap<String, Arc<dyn Provider>>>>,
    metrics: Arc<RwLock<HashMap<String, ProviderMetrics>>>,
}

#[derive(Debug, Clone, Default, serde::Serialize)]
pub struct ProviderMetrics {
    pub total_requests: u64,
    pub successful_requests: u64,
    pub failed_requests: u64,
    pub total_latency_ms: u64,
    pub total_tokens: u64,
    pub total_cost_usd: f32,
}

impl ProviderRegistry {
    pub fn new() -> Self {
        let mut providers: HashMap<String, Arc<dyn Provider>> = HashMap::new();
        
        // Register providers
        providers.insert("perplexity".to_string(), Arc::new(PerplexityClient::new()));
        providers.insert("gemini".to_string(), Arc::new(GeminiClient::new()));
        providers.insert("openai".to_string(), Arc::new(OpenAIClient::new()));

        Self {
            providers: Arc::new(RwLock::new(providers)),
            metrics: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn call_perplexity(&self, req: &AnalyzeRequest) -> Result<ProviderResponse, Box<dyn std::error::Error>> {
        self.call_provider("perplexity", req).await
    }

    pub async fn call_gemini(&self, req: &AnalyzeRequest) -> Result<ProviderResponse, Box<dyn std::error::Error>> {
        self.call_provider("gemini", req).await
    }

    pub async fn call_openai(&self, req: &AnalyzeRequest) -> Result<ProviderResponse, Box<dyn std::error::Error>> {
        self.call_provider("openai", req).await
    }

    async fn call_provider(&self, name: &str, req: &AnalyzeRequest) -> Result<ProviderResponse, Box<dyn std::error::Error>> {
        let providers = self.providers.read().await;
        let provider = providers.get(name)
            .ok_or_else(|| format!("Provider {} not found", name))?;

        let start = std::time::Instant::now();
        let result = provider.call(req).await;
        let latency = start.elapsed().as_millis() as u64;

        // Update metrics
        let mut metrics = self.metrics.write().await;
        let provider_metrics = metrics.entry(name.to_string()).or_insert_with(Default::default);
        
        provider_metrics.total_requests += 1;
        provider_metrics.total_latency_ms += latency;

        match &result {
            Ok(response) => {
                provider_metrics.successful_requests += 1;
                if let Some(tokens) = response.tokens_used {
                    provider_metrics.total_tokens += tokens as u64;
                }
                if let Some(cost) = response.cost_usd {
                    provider_metrics.total_cost_usd += cost;
                }
            }
            Err(_) => {
                provider_metrics.failed_requests += 1;
            }
        }

        result
    }

    pub async fn get_metrics(&self) -> Value {
        let metrics = self.metrics.read().await;
        serde_json::to_value(&*metrics).unwrap_or_default()
    }

    pub async fn get_model_card(&self) -> Value {
        let metrics = self.metrics.read().await;
        let providers = self.providers.read().await;

        let mut cards = Vec::new();
        for (name, provider) in providers.iter() {
            let provider_metrics = metrics.get(name).cloned().unwrap_or_default();
            
            cards.push(serde_json::json!({
                "name": name,
                "cost_per_1k_tokens": provider.cost_per_1k_tokens(),
                "total_requests": provider_metrics.total_requests,
                "success_rate": if provider_metrics.total_requests > 0 {
                    provider_metrics.successful_requests as f32 / provider_metrics.total_requests as f32
                } else {
                    0.0
                },
                "avg_latency_ms": if provider_metrics.total_requests > 0 {
                    provider_metrics.total_latency_ms / provider_metrics.total_requests
                } else {
                    0
                },
                "total_cost_usd": provider_metrics.total_cost_usd,
            }));
        }

        serde_json::json!({
            "providers": cards,
            "timestamp": chrono::Utc::now().to_rfc3339(),
        })
    }
}
