use axum::{
    extract::{State, Json},
    response::IntoResponse,
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::env;

use crate::routes::search::AppState;

#[derive(Debug, Deserialize)]
pub struct PropertySearchRequest {
    pub location: String,
    pub property_type: Option<String>, // "land", "house", "apartment", etc.
    pub max_results: Option<usize>,
    pub min_budget: Option<String>, // "₹50L", "$100K", etc.
    pub max_budget: Option<String>, // "₹2Cr", "$500K", etc.
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PropertyListing {
    pub title: String,
    pub price: String,
    pub location: String,
    pub area: Option<String>,
    pub description: String,
    pub image_url: Option<String>,
    pub listing_url: String,
    pub source: String,
    pub posted_date: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PropertySearchResponse {
    pub listings: Vec<PropertyListing>,
    pub total_found: usize,
    pub search_location: String,
}

pub async fn search_properties(
    State(_state): State<AppState>,
    Json(payload): Json<PropertySearchRequest>,
) -> impl IntoResponse {
    let api_key = match env::var("PERPLEXITY_API_KEY") {
        Ok(key) if !key.is_empty() => key,
        _ => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "PERPLEXITY_API_KEY not configured"}))
            ).into_response();
        }
    };

    let property_type = payload.property_type.unwrap_or_else(|| "land".to_string());
    let max_results = payload.max_results.unwrap_or(10);

    // Build budget filter string
    let budget_filter = match (&payload.min_budget, &payload.max_budget) {
        (Some(min), Some(max)) => format!("Price range: {} to {}", min, max),
        (Some(min), None) => format!("Minimum price: {}", min),
        (None, Some(max)) => format!("Maximum price: {}", max),
        (None, None) => "Any budget".to_string(),
    };

    // Construct a detailed prompt for Perplexity to find real property listings
    let prompt = format!(
        r#"Find the top {} real {} listings currently available for sale in {}. 
        
Budget Filter: {}

For each property, provide:
1. Title/Name of the property
2. Price (in local currency)
3. Exact location/address
4. Area/size (in sqft, acres, or sqm)
5. Brief description
6. **IMPORTANT: Include a direct image URL from the property listing website** (look for property photos in the listing)
7. Direct URL to the listing (from MagicBricks, 99acres, Housing.com, Zillow, Realtor.com, or similar real estate sites)
8. Source website name
9. Posted date if available

Return ONLY a valid JSON array with this exact structure (no markdown, no explanations):
[
  {{
    "title": "Property title",
    "price": "$250,000 or ₹2.5 Cr",
    "location": "Specific address or area",
    "area": "2000 sqft or 5 acres",
    "description": "Brief property description",
    "image_url": "https://direct-image-url-from-listing.jpg",
    "listing_url": "https://actual-listing-url.com/property/123",
    "source": "MagicBricks or 99acres or Housing.com",
    "posted_date": "2024-01-10 or null"
  }}
]

CRITICAL REQUIREMENTS: 
- Use REAL, CURRENT listings with actual URLs
- Prioritize listings from major real estate platforms
- **MUST include direct image URLs from the property listings** (check the listing page for property photos)
- Include direct links to the property pages
- Filter by the specified budget range
- Return exactly {} listings"#,
        max_results, property_type, payload.location, budget_filter, max_results
    );

    let client = reqwest::Client::new();
    let perplexity_url = "https://api.perplexity.ai/chat/completions";

    tracing::info!("Searching for properties in: {}", payload.location);

    let request_body = json!({
        "model": "sonar-pro",
        "messages": [
            {
                "role": "system",
                "content": "You are a real estate search assistant. Return ONLY valid JSON arrays with real property listings. No markdown formatting, no explanations, just the JSON array."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.1,
        "max_tokens": 4000,
    });

    match client
        .post(perplexity_url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
    {
        Ok(response) => {
            if !response.status().is_success() {
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                tracing::error!("Perplexity API error: {}", error_text);
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to fetch property listings", "details": error_text}))
                ).into_response();
            }

            match response.json::<Value>().await {
                Ok(data) => {
                    let content = data["choices"][0]["message"]["content"]
                        .as_str()
                        .unwrap_or("");

                    // Clean up the response (remove markdown if present)
                    let cleaned_content = content
                        .replace("```json\n", "")
                        .replace("```\n", "")
                        .replace("```", "")
                        .trim()
                        .to_string();

                    tracing::debug!("Cleaned AI response: {}", cleaned_content);

                    // Parse the JSON array
                    match serde_json::from_str::<Vec<PropertyListing>>(&cleaned_content) {
                        Ok(listings) => {
                            let response = PropertySearchResponse {
                                total_found: listings.len(),
                                search_location: payload.location.clone(),
                                listings,
                            };
                            (StatusCode::OK, Json(json!(response))).into_response()
                        }
                        Err(e) => {
                            tracing::error!("Failed to parse property listings JSON: {:?}", e);
                            tracing::error!("Raw content: {}", cleaned_content);
                            
                            // Return a fallback response with the error
                            (
                                StatusCode::OK,
                                Json(json!({
                                    "listings": [],
                                    "total_found": 0,
                                    "search_location": payload.location,
                                    "error": "Failed to parse AI response",
                                    "raw_response": cleaned_content
                                }))
                            ).into_response()
                        }
                    }
                }
                Err(e) => {
                    tracing::error!("Failed to parse Perplexity response: {:?}", e);
                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(json!({"error": "Invalid response from AI service"}))
                    ).into_response()
                }
            }
        }
        Err(e) => {
            tracing::error!("Failed to reach Perplexity API: {:?}", e);
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"error": "Failed to reach AI service", "details": e.to_string()}))
            ).into_response()
        }
    }
}
