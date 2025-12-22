import { geocodeAddress, getLocationContext } from './geocoding';
import { supabase } from './supabase';
// User has 'crypto-js' usually? If not, I'll use a simple string hash function to avoid dependency if possible.
// Actually, I can just use the location string as key if I sanitize it, but hash is safer for length.
// Let's assume I can install it or use a simple hash.
// Better: Just use the location string directly if it's < text limit. Locations are short.
// But user requested "if some other user asks for the same query".
// I'll stick to a simple string normalization + hash if needed, or just normalize string.
// Let's use specific helper for hashing if crypto-js isn't there.
// I'll assume standard Web Crypto API or just string key.
// Let's use `btoa` base64 of normalized string as a poor man's hash or just the string if likely unique.
// "key text primary key"
// I will just use `normalizeLocation(location)` as the key.
const normalizeKey = (str) => str.toLowerCase().trim().replace(/\s+/g, ' ');

const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY;

/**
 * Comprehensive 10-Point Property Risk Analysis
 * Analyzes location for buying/renting risks, environmental factors, and growth potential
 */
// In production (Vercel), we call our own /api/perplexity to keep keys hidden.
// In development, we can fallback to direct call if needed, but /api/perplexity is preferred.
const PROXY_URL = '/api/perplexity';

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
    const isProd = import.meta.env.PROD;
    const url = isProd ? PROXY_URL : 'https://api.perplexity.ai/chat/completions';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': isProd ? undefined : `Bearer ${PERPLEXITY_API_KEY}`,
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

    // Handle proxy response vs direct response
    const content = data.choices ? data.choices[0].message.content : (data.error || "No address found");
    return content.trim();
  } catch (error) {
    console.error("Error extracting address:", error);
    return "No address found";
  }
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 Hours

// Helper to generate unique cache keys (combining type + normalized location)
const getCacheKey = (location, type) => `${type}:${normalizeKey(location)}`;

const checkCache = async (key, type) => {
  try {
    // We query by the composite key string directly
    const { data, error } = await supabase
      .from('cache_entries')
      .select('data, expires_at')
      .eq('key', key)
      // .eq('type', type) // Redundant if key is composite, but harmless.
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) {
      // Silent fail for no rows
      if (error.code !== 'PGRST116') console.warn("Cache check error:", error);
      return null;
    }
    if (!data) return null;

    console.log(`✅ Cache HIT for [${key}]`);
    return data.data;
  } catch (err) {
    console.warn("Cache check failed", err);
    return null;
  }
};

const saveCache = async (key, type, data) => {
  try {
    const expiresAt = new Date(Date.now() + CACHE_DURATION).toISOString();
    console.log(`💾 Saving to Cache [${key}]`);

    const { error } = await supabase.from('cache_entries').upsert({
      key, // This is now 'analysis:location'
      type,
      data,
      expires_at: expiresAt
    });

    if (error) {
      console.error("❌ Cache Save Error (Supabase):", error);
    } else {
      console.log("✅ Cache Saved Successfully");
    }
  } catch (err) {
    console.warn("Cache save failed", err);
  }
};

export const analyzePropertyRisk = async (location) => {
  const cacheKey = getCacheKey(location, 'analysis');

  // 1. Check Cache
  const cached = await checkCache(cacheKey, 'analysis');
  if (cached) {
    return cached;
  }

  console.log(`🌐 Cache MISS for [${cacheKey}], fetching fresh data...`);

  // 2. API Call (Proceed with existing logic)

  // 2. API Call (Proceed with existing logic)
  // First, get enriched location data from OpenCage
  let locationData = null;
  let locationContext = `Location: ${location}`;

  try {
    locationData = await geocodeAddress(location);
    if (locationData) {
      locationContext = await getLocationContext(location);
    }
  } catch (error) {
    console.warn('Geocoding failed, proceeding with basic location:', error);
  }

  const prompt = `
You are an expert real estate analyst with deep knowledge of property markets worldwide.

Analyze this property location comprehensively:
${locationContext}

Provide a detailed JSON response (NO markdown formatting, pure JSON only) with this EXACT structure:

{
  "location_info": {
    "formatted_address": "Full formatted address",
    "coordinates": { "lat": number, "lng": number },
    "region": "State/Province",
    "country": "Country name",
    "jurisdiction": "Legal jurisdiction (e.g., 'California, USA' or 'Maharashtra, India')"
  },
  
  "risk_analysis": {
    "overall_score": number (0-100, where 100 = highest risk),
    
    "buying_risk": {
      "score": number (0-100),
      "status": "High" | "Medium" | "Low",
      "factors": ["factor 1", "factor 2", "..."]
    },
    
    "renting_risk": {
      "score": number (0-100),
      "status": "High" | "Medium" | "Low",
      "factors": ["factor 1", "factor 2", "..."]
    },
    
    "flood_risk": {
      "score": number (0-100),
      "level": "Extreme" | "High" | "Moderate" | "Low" | "Minimal",
      "zones": ["zone info if available"],
      "description": "Brief flood risk explanation"
    },
    
    "crime_rate": {
      "score": number (0-100, lower is safer),
      "rate_per_1000": number,
      "trend": "Increasing" | "Stable" | "Decreasing",
      "types": ["most common crime types"]
    },
    
    "air_quality": {
      "aqi": number (0-500 AQI standard),
      "score": number (0-100, higher is better),
      "rating": "Good" | "Moderate" | "Unhealthy" | "Hazardous",
      "pollutants": ["primary pollutants"]
    },
    
    "amenities": {
      "score": number (0-100),
      "walkability": number (0-100),
      "nearby": [
        { 
          "type": "Schools", 
          "count": number, 
          "closest_distance": "X km",
          "facilities": [
            {
              "name": "School Name",
              "distance": "X km",
              "rating": number (1-5 stars),
              "quality": "Excellent|Very Good|Good|Fair|Poor",
              "type": "Public|Private",
              "highlights": ["Academic excellence", "Sports programs", etc.]
            }
          ]
        },
        { 
          "type": "Hospitals", 
          "count": number, 
          "closest_distance": "X km",
          "facilities": [
            {
              "name": "Hospital Name",
              "distance": "X km",
              "rating": number (1-5 stars),
              "quality": "Excellent|Very Good|Good|Fair|Poor",
              "specialty": "General|Specialty",
              "highlights": ["24/7 Emergency", "Advanced ICU", etc.]
            }
          ]
        },
        { 
          "type": "Shopping", 
          "count": number, 
          "closest_distance": "X km",
          "facilities": [
            {
              "name": "Mall/Market Name",
              "distance": "X km",
              "type": "Mall|Supermarket|Local Market"
            }
          ]
        },
        { 
          "type": "Parks", 
          "count": number, 
          "closest_distance": "X km",
          "facilities": [
            {
              "name": "Park Name",
              "distance": "X km",
              "size": "Large|Medium|Small"
            }
          ]
        }
      ]
    },
    
    "transportation": {
      "score": number (0-100),
      "transit_options": ["Bus", "Metro", "Train", etc.],
      "commute_time": "Average to city center",
      "walkability_index": number (0-100)
    },
    
    "neighbourhood": {
      "score": number (0-100),
      "rating": "Excellent" | "Good" | "Average" | "Below Average",
      "character": "Brief description of neighborhood character",
      "demographics": {
        "median_age": number,
        "population_density": "High|Medium|Low"
      }
    },
    
    "environmental_hazards": {
      "score": number (0-100, lower is better),
      "hazards": ["list any superfund sites, industrial pollution, etc."],
      "severity": "High" | "Medium" | "Low" | "None"
    },
    
    "growth_potential": {
      "score": number (0-100),
      "forecast": "Strong Growth" | "Moderate Growth" | "Stable" | "Declining",
      "drivers": ["key growth factors"],
      "outlook_5yr": "Brief 5-year outlook"
    },
    
    "political_stability": {
      "score": number (0-100, higher is more stable),
      "status": "Very Stable" | "Stable" | "Moderate" | "Unstable" | "Volatile",
      "factors": ["key political factors affecting property market"],
      "recent_events": ["major political events impacting real estate"],
      "policy_environment": "Brief overview of current property policies"
    },
    
    "trade_economy": {
      "gdp_growth": number (percentage, e.g., 3.5 for 3.5%),
      "gdp_trend": "Growing" | "Stable" | "Declining",
      "inflation_rate": number (percentage),
      "unemployment_rate": number (percentage),
      "trade_balance": "Surplus" | "Deficit" | "Balanced",
      "economic_outlook": "Strong" | "Moderate" | "Weak",
      "major_industries": ["key industries in the area"],
      "trade_relations": {
        "status": "Excellent" | "Good" | "Fair" | "Poor",
        "key_partners": ["main trade partners"],
        "impact_on_property": "Brief description of how trade affects local real estate"
      }
    }
  },
  
  "historical_trends": {
    "property_values": [
      { "year": 2019, "median_price": number, "change_pct": number },
      { "year": 2020, "median_price": number, "change_pct": number },
      { "year": 2021, "median_price": number, "change_pct": number },
      { "year": 2022, "median_price": number, "change_pct": number },
      { "year": 2023, "median_price": number, "change_pct": number },
      { "year": 2024, "median_price": number, "change_pct": number }
    ],
    
    "crime_trends": [
      { "year": 2019, "incidents_per_1000": number, "change_pct": number },
      { "year": 2020, "incidents_per_1000": number, "change_pct": number },
      { "year": 2021, "incidents_per_1000": number, "change_pct": number },
      { "year": 2022, "incidents_per_1000": number, "change_pct": number },
      { "year": 2023, "incidents_per_1000": number, "change_pct": number },
      { "year": 2024, "incidents_per_1000": number, "change_pct": number }
    ],
    
    "population": [
      { "year": 2019, "count": number, "change_pct": number },
      { "year": 2020, "count": number, "change_pct": number },
      { "year": 2021, "count": number, "change_pct": number },
      { "year": 2022, "count": number, "change_pct": number },
      { "year": 2023, "count": number, "change_pct": number },
      { "year": 2024, "count": number, "change_pct": number }
    ],
    
    "development_timeline": [
      { "year": 2020, "events": ["Major development 1", "..."] },
      { "year": 2021, "events": ["Major development 2", "..."] },
      { "year": 2022, "events": ["..."] },
      { "year": 2023, "events": ["..."] },
      { "year": 2024, "events": ["..."] }
    ]
  },
  
  "market_intelligence": {
    "current_trend": "Up" | "Down" | "Stable",
    "prediction_6mo": "Brief 6-month forecast",
    "prediction_1yr": "Brief 1-year forecast",
    "ai_summary": "2-3 sentences about overall investment outlook, key risks, and opportunities",
    
    "recent_listings": [
      {
        "address": "Property address",
        "price": "Formatted price in local currency",
        "type": "Apartment|House|Condo|Land",
        "bedrooms": number,
        "sqft": number,
        "date": "Listed date (e.g., '3 days ago')",
        "coordinates": { "lat": number, "lng": number }
      }
    ],
    
    "news": [
      {
        "headline": "News headline",
        "summary": "1-2 sentence summary",
        "date": "Relative date (e.g., '1 week ago')",
        "source": "Source name",
        "relevance": "High" | "Medium" | "Low"
      }
    ]
  },
  
  "legal_resources": {
    "jurisdiction": "Full legal jurisdiction",
    "property_law_system": "Common Law | Civil Law | Mixed",
    "key_statutes": [
      { "name": "Statute name", "description": "What it covers" }
    ],
    "dispute_process": "Brief overview of property dispute resolution process",
    "typical_timeline": "Typical case duration",
    "resources": [
      { "name": "Resource name", "type": "Government|Legal Aid|Court", "description": "Brief description" }
    ]
  },
  
  "additional_info": {
    "solar_potential": "Excellent" | "Good" | "Fair" | "Poor",
    "weather_summary": "Brief annual weather summary",
    "climate_risks": ["hurricanes", "earthquakes", "wildfires", etc.],
    "insurance_considerations": "Brief note on insurance costs/requirements"
  }
}

CRITICAL REQUIREMENTS:
1. All scores must be realistic based on actual data for this specific location
2. Historical trends should reflect real market data (2019-2024)
3. Property prices in local currency (USD for US, INR for India, etc.)
4. Recent listings should only be from last 30-60 days
5. Legal resources must be jurisdiction-specific
6. Provide specific, actionable insights - not generic information
7. Output ONLY valid JSON, no markdown code blocks
  `.trim();


  try {
    const isProd = import.meta.env.PROD;
    // Use the Vite proxy path '/api/perplexity' in dev mode to avoid CORS
    const url = isProd ? PROXY_URL : '/api/perplexity';

    const headers = {
      'Content-Type': 'application/json'
    };

    // ROBUST FIX: Always inject the API key from client-side env if available.
    // This bypasses strict reliance on the Vite Proxy to inject headers, which can be flaky with env/mode issues.
    if (PERPLEXITY_API_KEY) {
      headers['Authorization'] = `Bearer ${PERPLEXITY_API_KEY}`;
    }

    console.log(`🌐 Calling Perplexity API [Proxy: ${url}] [Key Present: ${!!PERPLEXITY_API_KEY}]`);

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: "You are a world-class real estate analyst and legal advisor. Provide detailed, accurate, jurisdiction-specific analysis. Always output pure JSON without markdown formatting."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Perplexity API FAILED:", response.status, response.statusText);
      console.error("❌ Error Details:", errText);
      throw new Error(`API request failed: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;

    // Clean up markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsedData = JSON.parse(content);

    // Merge with geocoding data if available
    if (locationData) {
      parsedData.location_info = {
        ...parsedData.location_info,
        formatted_address: locationData.formatted_address,
        coordinates: locationData.coordinates,
        country: locationData.location_details.country,
        region: locationData.location_details.state || locationData.location_details.county
      };
    }

    // Save to Cache
    await saveCache(cacheKey, 'analysis', parsedData);

    return parsedData;

  } catch (error) {
    console.error("Error analyzing property:", error);
    console.warn("Returning comprehensive mock data...");

    // Comprehensive fallback data
    return getFallbackData(location, locationData);
    return null;
  }
};

/**
 * Generate comprehensive fallback data when API fails
 */
function getFallbackData(location, locationData) {
  const coords = locationData?.coordinates || { lat: 40.7128, lng: -74.0060 };

  return {
    location_info: {
      formatted_address: locationData?.formatted_address || location,
      coordinates: coords,
      region: locationData?.location_details?.state || "Unknown Region",
      country: locationData?.location_details?.country || "Unknown",
      jurisdiction: "Data unavailable - using estimates"
    },
    risk_analysis: {
      overall_score: 55,
      buying_risk: { score: 52, status: "Medium", factors: ["Limited data available", "Market volatility"] },
      renting_risk: { score: 48, status: "Medium", factors: ["Average market conditions"] },
      flood_risk: { score: 30, level: "Low", zones: [], description: "Estimated low flood risk" },
      crime_rate: { score: 45, rate_per_1000: 25, trend: "Stable", types: ["Property crime", "Theft"] },
      air_quality: { aqi: 75, score: 70, rating: "Moderate", pollutants: ["PM2.5"] },
      amenities: {
        score: 65,
        walkability: 60,
        nearby: [
          { type: "Schools", count: 3, closest_distance: "1.2 km" },
          { type: "Hospitals", count: 2, closest_distance: "2.5 km" }
        ]
      },
      transportation: { score: 60, transit_options: ["Bus"], commute_time: "30-45 min", walkability_index: 55 },
      neighbourhood: {
        score: 65,
        rating: "Average",
        character: "Mixed residential area",
        demographics: { median_age: 35, population_density: "Medium" }
      },
      environmental_hazards: { score: 20, hazards: [], severity: "Low" },
      growth_potential: {
        score: 60,
        forecast: "Moderate Growth",
        drivers: ["Economic development"],
        outlook_5yr: "Steady appreciation expected"
      }
    },
    historical_trends: {
      property_values: [
        { year: 2019, median_price: 250000, change_pct: 0 },
        { year: 2020, median_price: 265000, change_pct: 6 },
        { year: 2021, median_price: 295000, change_pct: 11.3 },
        { year: 2022, median_price: 320000, change_pct: 8.5 },
        { year: 2023, median_price: 335000, change_pct: 4.7 },
        { year: 2024, median_price: 350000, change_pct: 4.5 }
      ],
      crime_trends: [
        { year: 2019, incidents_per_1000: 28, change_pct: 0 },
        { year: 2020, incidents_per_1000: 26, change_pct: -7.1 },
        { year: 2021, incidents_per_1000: 27, change_pct: 3.8 },
        { year: 2022, incidents_per_1000: 25, change_pct: -7.4 },
        { year: 2023, incidents_per_1000: 24, change_pct: -4 },
        { year: 2024, incidents_per_1000: 25, change_pct: 4.2 }
      ],
      population: [
        { year: 2019, count: 50000, change_pct: 0 },
        { year: 2020, count: 51000, change_pct: 2 },
        { year: 2021, count: 52500, change_pct: 2.9 },
        { year: 2022, count: 54000, change_pct: 2.9 },
        { year: 2023, count: 55500, change_pct: 2.8 },
        { year: 2024, count: 57000, change_pct: 2.7 }
      ],
      development_timeline: [
        { year: 2020, events: ["New transit line approved"] },
        { year: 2022, events: ["Shopping center opened"] },
        { year: 2023, events: ["School expansion completed"] },
        { year: 2024, events: ["Park renovation"] }
      ]
    },
    market_intelligence: {
      current_trend: "Up",
      prediction_6mo: "Moderate appreciation expected",
      prediction_1yr: "Continued steady growth likely",
      ai_summary: "This is estimated data due to API limitations. The location shows moderate risk levels across most categories with steady growth potential. Recommend conducting additional research before making decisions.",
      recent_listings: [],
      news: [
        {
          headline: "Data unavailable",
          summary: "Unable to fetch recent news. Please try again later.",
          date: "N/A",
          source: "System",
          relevance: "Low"
        }
      ]
    },
    legal_resources: {
      jurisdiction: "Data unavailable",
      property_law_system: "Unknown",
      key_statutes: [],
      dispute_process: "Please consult local legal resources for jurisdiction-specific information.",
      typical_timeline: "Varies by jurisdiction",
      resources: []
    },
    additional_info: {
      solar_potential: "Good",
      weather_summary: "Data unavailable",
      climate_risks: [],
      insurance_considerations: "Standard homeowners insurance recommended"
    }
  };
}

/**
 * Send a message to the AI Chatbot (Perplexity)
 * @param {Array} messages - Chat history [{role: 'user'|'assistant', content: '...'}]
 * @param {Object} context - Current application context (location, risk data)
 * @returns {Promise<string>} - The AI's response
 */
export const sendChatMessage = async (messages, context = {}) => {
  const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error("API key not configured");

  const contextString = `
    Current Location Context: ${context.location || "Not specified"}.
    User Geolocation: ${context.userLocation ? `${context.userLocation.lat}, ${context.userLocation.lng}` : "Unknown"}.
    Risk Data Available: ${!!context.riskSummary}.
  `;

  const systemPrompt = `You are the Terra Truce Assistant.
  
  YOUR GOALS:
  1. **REAL ESTATE SEARCH**: 
     - **CRITICAL**: If the user asks to find/search properties but matches no specific location in their query AND 'Current Location Context' is 'Not specified': **YOU MUST ASK** "Where would you like to search?" first. **DO NOT** search for random locations.
     - If the user implies "around me" or "here", use 'User Geolocation' if available. If not available, ask for their city.
     - **DIRECT LINKS**: You MUST provide direct links to the property listing on real estate portals (e.g., Zillow, Realtor.com, MagicBricks, Housing.com, Rightmove, etc.).
     - **NO SEARCH ENGINES**: Do NOT provide links to search engine results (like Google, Bing, etc.). The user wants to land DIRECTLY on the property website.
     - Use your search tools to find the actual listing URL.
     - **DO NOT USE BOLDING** (no asterisks **). Keep text clean.
     - **LINKS**: Provide clickable links using this exact format: [[View Listing on <Site Name>]](URL).
     - **FORMAT**:
       1. Property Name - Price
       2. Location & Size
       3. Risk Rating: (Brief text)
       4. [[View Listing on <Site Name>]](URL)
       
  2. **RISK ANALYSIS**: Explain risks simply without markdown bolding.
  
  3. **SUGGEST ACTIONS**: Suggest 'Compare Properties' or 'Risk Analysis'.
  
  STYLE:
  - Clean, plain text. No markdown formatting like **bold** or *italics* unless necessary for emphasis (use single *).
  - Professional but conversational.
  
  ${contextString.trim()}`;

  const apiMessages = [
    { role: "system", content: systemPrompt },
    ...messages
  ];

  const lastMsg = messages[messages.length - 1].content;
  const cacheKey = normalizeKey(`${lastMsg}_${context.location || ''}`);

  // 1. Check Cache
  const cached = await checkCache(cacheKey, 'chat');
  if (cached) {
    return cached + " ⚡"; // Indicate cached status
  }

  try {
    // Always use proxy endpoint (works in both dev and prod)
    const response = await fetch('/api/perplexity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: apiMessages,
        temperature: 0.2,
        max_tokens: 1000,
        top_p: 0.9,
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Perplexity API Error: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Save to Cache
    await saveCache(cacheKey, 'chat', content);

    return content;
  } catch (error) {
    console.error("Chatbot API Error:", error);
    return "I'm having trouble connecting to the real estate network right now. Please try again in a moment. Debug: " + error.message;
  }
};
