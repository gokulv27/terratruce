use async_trait::async_trait;
use reqwest::Client;
use serde_json::{json, Value};
use std::env;

use crate::models::{AnalyzeRequest, ProviderResponse};
use super::Provider;

pub struct GeminiClient {
    client: Client,
    api_key: String,
}

impl GeminiClient {
    pub fn new() -> Self {
        let api_key = env::var("GEMINI_API_KEY")
            .unwrap_or_else(|_| "".to_string());

        Self {
            client: Client::new(),
            api_key,
        }
    }
}

#[async_trait]
impl Provider for GeminiClient {
    async fn call(&self, req: &AnalyzeRequest) -> Result<ProviderResponse, Box<dyn std::error::Error>> {
        if self.api_key.is_empty() {
            return Err("Gemini API key not configured".into());
        }

        let start = std::time::Instant::now();
        
        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={}",
            self.api_key
        );

        let payload = json!({
            "contents": [{
                "role": "user",
                "parts": [{
                    "text": format!("Analyze property location: {}. Provide comprehensive risk analysis in JSON format.", req.location)
                }]
            }],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 4000,
                "responseMimeType": "application/json"
            }
        });

        let response = self.client
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&payload)
            .timeout(std::time::Duration::from_secs(30))
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(format!("Gemini API error: {}", error_text).into());
        }

        let data: Value = response.json().await?;
        let content_str = data["candidates"][0]["content"]["parts"][0]["text"]
            .as_str()
            .ok_or("No content in response")?;

        let content: Value = serde_json::from_str(content_str)?;
        
        let tokens_used = data["usageMetadata"]["totalTokenCount"]
            .as_u64()
            .unwrap_or(0) as u32;

        let cost = (tokens_used as f32 / 1000.0) * self.cost_per_1k_tokens();
        let latency = start.elapsed().as_millis() as u64;

        Ok(ProviderResponse {
            provider: "gemini".to_string(),
            content,
            confidence: 0.85,
            latency_ms: latency,
            tokens_used: Some(tokens_used),
            cost_usd: Some(cost),
        })
    }

    fn name(&self) -> &str {
        "gemini"
    }

    fn cost_per_1k_tokens(&self) -> f32 {
        0.00025 // $0.00025 per 1K tokens for Gemini 2.0 Flash
    }
}
