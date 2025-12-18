const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY;

/**
 * Extracts a property address from raw OCR text using Perplexity.
 */
export const extractAddressFromOCR = async (text) => {
  const prompt = `
    Extract the primary property address from the following OCR text. 
    If multiple addresses are found, pick the one that seems to be the subject of the document (e.g., the property being sold or leased).
    
    Return ONLY the address string. No other text.
    If no address is found, return "No address found".

    Document Text:
    """
    ${text}
    """
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
          { role: "system", content: "You are a precise extraction assistant. Output only the requested address or 'No address found'." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1
      })
    });

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error extracting address:", error);
    return "No address found";
  }
};

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
      "air_quality_text": "Short description",
      "solar_potential": "Excellent" | "Good" | "Fair" | "Poor",
      "weather_summary": "Short annual summary",
      "transport_score": number (0-100),
      "amenities_score": number (0-100),
      "neighbourhood_score": number (0-100),
      "growth_potential_score": number (0-100),
      "market_trend": "Up" | "Down" | "Stable",
      "ai_summary": "1-2 sentence insights",
      "coordinates": { "lat": number, "lng": number },
      "news": [{ "headline": "Headline", "summary": "Summary", "date": "Date", "source": "Source" }],
      "recent_listings": [{ "address": "Address", "price": "₹Price", "type": "Type", "date": "Date", "coordinates": { "lat": number, "lng": number } }],
      "nearby_hospitals": [{ "name": "Hospital Name", "coordinates": { "lat": number, "lng": number }, "distance": "distance in km" }],
      "nearby_schools": [{ "name": "School Name", "coordinates": { "lat": number, "lng": number }, "distance": "distance in km" }]
    }
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
    return null;
  }
};
