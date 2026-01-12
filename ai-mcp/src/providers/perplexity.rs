use async_trait::async_trait;
use reqwest::Client;
use serde_json::{json, Value};
use std::env;

use crate::models::{AnalyzeRequest, ProviderResponse};
use super::Provider;

pub struct PerplexityClient {
    client: Client,
    api_key: String,
}

impl PerplexityClient {
    pub fn new() -> Self {
        let api_key = env::var("PERPLEXITY_API_KEY")
            .unwrap_or_else(|_| "".to_string());

        Self {
            client: Client::new(),
            api_key,
        }
    }

    fn build_prompt(&self, req: &AnalyzeRequest) -> String {
        format!(
            r#"You are a senior real estate analyst. Analyze this property location: {}

Provide a comprehensive JSON response with risk analysis including:
- Overall risk score (0-100)
- Buying and renting risk factors
- Environmental factors (flood, crime, air quality)
- Amenities and transportation
- Growth potential
- Market intelligence

Output valid JSON only, no markdown."#,
            req.location
        )
    }
}

#[async_trait]
impl Provider for PerplexityClient {
    async fn call(&self, req: &AnalyzeRequest) -> Result<ProviderResponse, Box<dyn std::error::Error>> {
        if self.api_key.is_empty() {
            return Err("Perplexity API key not configured".into());
        }

        let start = std::time::Instant::now();
        
        let payload = json!({
            "model": "sonar-pro",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a real estate analyst. Output valid JSON only."
                },
                {
                    "role": "user",
                    "content": self.build_prompt(req)
                }
            ],
            "temperature": 0.1,
            "max_tokens": 4000,
        });

        let response = self.client
            .post("https://api.perplexity.ai/chat/completions")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .timeout(std::time::Duration::from_secs(30))
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(format!("Perplexity API error: {}", error_text).into());
        }

        let data: Value = response.json().await?;
        let content_str = data["choices"][0]["message"]["content"]
            .as_str()
            .ok_or("No content in response")?;

        // Clean and parse JSON
        let cleaned = content_str
            .replace("```json\n", "")
            .replace("```", "")
            .trim()
            .to_string();

        let content: Value = serde_json::from_str(&cleaned)?;
        
        let tokens_used = data["usage"]["total_tokens"]
            .as_u64()
            .unwrap_or(0) as u32;

        let cost = (tokens_used as f32 / 1000.0) * self.cost_per_1k_tokens();
        let latency = start.elapsed().as_millis() as u64;

        Ok(ProviderResponse {
            provider: "perplexity".to_string(),
            content,
            confidence: 0.9,
            latency_ms: latency,
            tokens_used: Some(tokens_used),
            cost_usd: Some(cost),
        })
    }

    fn name(&self) -> &str {
        "perplexity"
    }

    fn cost_per_1k_tokens(&self) -> f32 {
        0.005 // $0.005 per 1K tokens for sonar-pro
    }
}
