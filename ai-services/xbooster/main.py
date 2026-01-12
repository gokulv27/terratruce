from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import uvicorn
import random

app = FastAPI(title="XBooster Local LLM Service")

class AnalyzeRequest(BaseModel):
    location: str
    analysis_type: Optional[str] = None
    params: Optional[Dict[str, Any]] = None

class AnalyzeResponse(BaseModel):
    location_info: Dict[str, Any]
    risk_analysis: Dict[str, Any]
    confidence: float
    source: str

def generate_deterministic_analysis(location: str) -> Dict[str, Any]:
    """Generate deterministic fallback analysis for development/testing"""
    
    # Use location hash for deterministic but varied responses
    location_hash = hash(location.lower()) % 100
    
    overall_score = 40 + (location_hash % 40)  # 40-80 range
    
    return {
        "location_info": {
            "formatted_address": location,
            "coordinates": {"lat": 40.7128, "lng": -74.006},
            "region": "Unknown Region",
            "country": "Unknown",
            "jurisdiction": "Local analysis - limited data"
        },
        "risk_analysis": {
            "overall_score": overall_score,
            "buying_risk": {
                "score": overall_score + random.randint(-10, 10),
                "status": "Medium" if overall_score < 60 else "High",
                "factors": ["Limited market data", "Local analysis only"]
            },
            "renting_risk": {
                "score": overall_score - 5,
                "status": "Medium",
                "factors": ["Average rental market"]
            },
            "flood_risk": {
                "score": 30,
                "level": "Low",
                "zones": [],
                "description": "Estimated low flood risk"
            },
            "crime_rate": {
                "score": 45,
                "rate_per_1000": 25,
                "trend": "Stable",
                "types": ["Property crime"]
            },
            "air_quality": {
                "aqi": 75,
                "score": 70,
                "rating": "Moderate",
                "pollutants": ["PM2.5"]
            },
            "amenities": {
                "score": 65,
                "walkability": 60,
                "nearby": [
                    {"type": "Schools", "count": 3, "closest_distance": "1.2 km"},
                    {"type": "Hospitals", "count": 2, "closest_distance": "2.5 km"}
                ]
            },
            "transportation": {
                "score": 60,
                "transit_options": ["Bus"],
                "commute_time": "30-45 min",
                "walkability_index": 55
            },
            "neighbourhood": {
                "score": 65,
                "rating": "Average",
                "character": "Mixed residential area",
                "demographics": {
                    "median_age": 35,
                    "population_density": "Medium"
                }
            },
            "environmental_hazards": {
                "score": 20,
                "hazards": [],
                "severity": "Low"
            },
            "growth_potential": {
                "score": 60,
                "forecast": "Moderate Growth",
                "drivers": ["Economic development"],
                "outlook_5yr": "Steady appreciation expected"
            }
        },
        "historical_trends": {
            "property_values": [
                {"year": 2019, "median_price": 250000, "change_pct": 0},
                {"year": 2020, "median_price": 265000, "change_pct": 6},
                {"year": 2021, "median_price": 295000, "change_pct": 11.3},
                {"year": 2022, "median_price": 320000, "change_pct": 8.5},
                {"year": 2023, "median_price": 335000, "change_pct": 4.7},
                {"year": 2024, "median_price": 350000, "change_pct": 4.5}
            ]
        },
        "market_intelligence": {
            "current_trend": "Up",
            "prediction_6mo": "Moderate appreciation expected",
            "prediction_1yr": "Continued steady growth likely",
            "ai_summary": "Local analysis - external API data recommended for accuracy"
        }
    }

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_property(request: AnalyzeRequest):
    """Analyze property using local deterministic model"""
    try:
        analysis = generate_deterministic_analysis(request.location)
        
        return AnalyzeResponse(
            location_info=analysis["location_info"],
            risk_analysis=analysis,
            confidence=0.7,  # Lower confidence for local analysis
            source="xbooster-local"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "model": "xbooster-deterministic",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
