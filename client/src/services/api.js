const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY;

export const analyzePropertyRisk = async (location) => {
  const prompt = `
    Act as a real estate risk analyst. 
    Analyze the location: "${location}".
    
    Provide a JSON response ONLY with no markdown formatting. The JSON must have this exact structure:
    {
      "overall_score": number (0-100, where 100 is high risk),
      "buying_risk": "High" | "Medium" | "Low",
      "renting_risk": "High" | "Medium" | "Low",
      "flood_risk_score": number (0-100),
      "crime_score": number (0-100),
      "air_quality_score": number (0-100),
      "air_quality_text": "Short description (e.g., 'Good', 'Moderate')",
      "solar_potential": "Excellent" | "Good" | "Fair" | "Poor",
      "weather_summary": "Short annual weather summary (e.g., 'Sunny with mild winters')",
      "transport_score": number (0-100),
      "amenities_score": number (0-100),
      "neighbourhood_score": number (0-100),
      "growth_potential_score": number (0-100),
      "market_trend": "Up" | "Down" | "Stable",
      "ai_summary": "1-2 sentence insights about risks and future value.",
      "coordinates": { "lat": number, "lng": number } (Approximate lat/lng for this location),
      "news": [
        { 
            "headline": "Headline",
            "summary": "One sentence summary",
            "date": "Relative date (e.g. '2 days ago')",
            "source": "Source Name"
        }
      ],
      "recent_listings": [
        { 
          "address": "Address", 
          "price": "₹Price (in INR)", 
          "type": "Apartment/House",
          "date": "Date posting (e.g. '2 days ago')",
          "coordinates": { "lat": number, "lng": number }
        }
      ]
    }
    
    IMPORTANT: 
    1. For "recent_listings", ONLY include listings from the **last 30 days**.
    2. Prices MUST be in **Indian Rupees (INR)** formatted like "₹1.5 Cr" or "₹85 Lacs".
  `;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: "You are a helpful and precise real estate AI assistant that outputs only valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("API Error Response:", errText);
      throw new Error(`API request failed: ${response.status} - ${errText}`);
    }

    const data = await response.json();

    // Parse the content string into JSON
    let content = data.choices[0].message.content;

    // Clean up if markdown code blocks are present
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(content);
  } catch (error) {
    console.error("Error analyzing property:", error);
    console.log("Using Mock Data due to API Error");
    // Return mock data fallback if API fails
    return {
      overall_score: 75,
      buying_risk: "High",
      renting_risk: "Medium",
      flood_risk_score: 65,
      crime_score: 58,
      market_trend: "Up",
      ai_summary: "Error fetching live data. Showing fallback estimates.",
      news: ["Keep an eye on interest rates."],
      recent_listings: []
    };
  }
};
