use async_trait::async_trait;
use reqwest::Client;
use serde_json::{json, Value};
use std::env;

use crate::models::{AnalyzeRequest, ProviderResponse};
use super::Provider;

pub struct OpenAIClient {
    client: Client,
    api_key: String,
}

impl OpenAIClient {
    pub fn new() -> Self {
        let api_key = env::var("OPENAI_API_KEY")
            .unwrap_or_else(|_| "".to_string());

        Self {
            client: Client::new(),
            api_key,
        }
    }
}

#[async_trait]
impl Provider for OpenAIClient {
    async fn call(&self, req: &AnalyzeRequest) -> Result<ProviderResponse, Box<dyn std::error::Error>> {
        if self.api_key.is_empty() {
            return Err("OpenAI API key not configured".into());
        }

        let start = std::time::Instant::now();
        
        let payload = json!({
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a real estate analyst. Provide analysis in JSON format."
                },
                {
                    "role": "user",
                    "content": format!("Analyze property location: {}. Provide comprehensive risk analysis.", req.location)
                }
            ],
            "temperature": 0.1,
            "max_tokens": 4000,
            "response_format": { "type": "json_object" }
        });

        let response = self.client
            .post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .timeout(std::time::Duration::from_secs(30))
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(format!("OpenAI API error: {}", error_text).into());
        }

        let data: Value = response.json().await?;
        let content_str = data["choices"][0]["message"]["content"]
            .as_str()
            .ok_or("No content in response")?;

        let content: Value = serde_json::from_str(content_str)?;
        
        let tokens_used = data["usage"]["total_tokens"]
            .as_u64()
            .unwrap_or(0) as u32;

        let cost = (tokens_used as f32 / 1000.0) * self.cost_per_1k_tokens();
        let latency = start.elapsed().as_millis() as u64;

        Ok(ProviderResponse {
            provider: "openai".to_string(),
            content,
            confidence: 0.88,
            latency_ms: latency,
            tokens_used: Some(tokens_used),
            cost_usd: Some(cost),
        })
    }

    fn name(&self) -> &str {
        "openai"
    }

    fn cost_per_1k_tokens(&self) -> f32 {
        0.00015 // $0.00015 per 1K tokens for GPT-4o-mini
    }
}
