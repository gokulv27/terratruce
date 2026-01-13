import { geocodeAddress, getLocationContext } from './geocoding';
import { supabase } from './supabase';

const normalizeKey = (str) => str.toLowerCase().trim().replace(/\s+/g, ' ');

const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY;

/**
 * Comprehensive 10-Point Property Risk Analysis
 * Analyzes location for buying/renting risks, environmental factors, and growth potential
 */
const PROXY_URL = '/api/perplexity';

/**
 * Extracts a property address from raw OCR text using Perplexity.
 */
export const extractAddressFromOCR = async (text) => {
  // English: "Extract the primary property address... Return ONLY the address string."
  const prompt = `
    从以下OCR文本中提取主要房产地址。
    如果发现多个地址，请选择作为文档主题的那个（例如，正在出售或租赁的房产）。
    
    仅返回地址字符串。不要包含其他文本。
    如果未找到地址，返回 "No address found"。

    文档文本:
    """
    ${text}
    """
  `;

  try {
    const isProd = import.meta.env.PROD;
    // const isProd = true ; // Force proxy usage for testing backend connection
    const url = isProd ? PROXY_URL : 'https://api.perplexity.ai/chat/completions';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: isProd ? undefined : `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: "精确提取助手。仅输出地址或 'No address found'。" },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
      }),
    });

    const data = await response.json();
    const content = data.choices
      ? data.choices[0].message.content
      : data.error || 'No address found';
    return content.trim();
  } catch (error) {
    console.error('Error extracting address:', error);
    return 'No address found';
  }
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 Hours

// Helper to generate unique cache keys (combining type + normalized location)
const getCacheKey = (location, type) => `${type}:${normalizeKey(location)}`;

const checkCache = async (key, type) => {
  try {
    const { data, error } = await supabase
      .from('cache_entries')
      .select('data, expires_at')
      .eq('key', key)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) {
      if (error.code !== 'PGRST116') console.warn('Cache check error:', error);
      return null;
    }
    if (!data) return null;

    console.log(`✅ Cache HIT for [${key}]`);
    return data.data;
  } catch (err) {
    console.warn('Cache check failed', err);
    return null;
  }
};

const saveCache = async (key, type, data) => {
  try {
    const expiresAt = new Date(Date.now() + CACHE_DURATION).toISOString();
    console.log(`💾 Saving to Cache [${key}]`);

    const { error } = await supabase.from('cache_entries').upsert({
      key,
      type,
      data,
      expires_at: expiresAt,
    });

    if (error) {
      console.error('❌ Cache Save Error (Supabase):', error);
    } else {
      console.log('✅ Cache Saved Successfully');
    }
  } catch (err) {
    console.warn('Cache save failed', err);
  }
};

export const analyzePropertyRisk = async (location) => {
  const cacheKey = getCacheKey(location, 'analysis');

  const cached = await checkCache(cacheKey, 'analysis');
  if (cached) {
    return cached;
  }

  console.log(`🌐 Cache MISS for [${cacheKey}], fetching fresh data...`);

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

  // English meaning: "You are a senior real estate analyst. Comprehensively analyze: {context}. Provide detailed JSON response (strict structure, English values only)."
  const prompt = `
你是资深房地产分析师。全面分析此房产位置:
${locationContext}

请提供详细的JSON响应（严禁markdown，仅纯JSON），严格遵循以下结构（所有内容必须用英文输出）:

{
  "location_info": {
    "formatted_address": "Full formatted address",
    "coordinates": { "lat": number, "lng": number },
    "region": "State/Province",
    "country": "Country name",
    "jurisdiction": "Legal jurisdiction"
  },
  
  "risk_analysis": {
    "overall_score": number (0-100, 100=最高风险),
    
    "buying_risk": {
      "score": number (0-100),
      "status": "High" | "Medium" | "Low",
      "factors": ["factor 1", "factor 2"]
    },
    
    "renting_risk": {
      "score": number (0-100),
      "status": "High" | "Medium" | "Low",
      "factors": ["factor 1", "factor 2"]
    },
    
    "flood_risk": {
      "score": number (0-100),
      "level": "Extreme" | "High" | "Moderate" | "Low" | "Minimal",
      "zones": ["zone info"],
      "description": "Risk explanation"
    },
    
    "crime_rate": {
      "score": number (0-100, 低=安全),
      "rate_per_1000": number,
      "trend": "Increasing" | "Stable" | "Decreasing",
      "types": ["common crime types"]
    },
    
    "air_quality": {
      "aqi": number (0-500),
      "score": number (0-100, 高=好),
      "rating": "Good" | "Moderate" | "Unhealthy" | "Hazardous",
      "pollutants": ["pollutants"]
    },

    "growth_potential": {
      "score": number (0-100),
      "outlook": "Positive" | "Neutral" | "Negative",
      "factors": ["factor"]
    },

    "environmental_hazards": {
      "score": number (0-100),
      "risks": ["Landslide", "Earthquake", "Heatwave"],
      "details": "description"
    },

    "neighbourhood": {
      "score": number (0-100),
      "vibe": "Family-friendly" | "Busy" | "Quiet",
      "highlights": ["highlights"]
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
              "name": "Name",
              "distance": "X km",
              "rating": number (1-5),
              "quality": "Excellent|Good|Poor",
              "type": "Public|Private",
              "highlights": ["highlights"]
            }
          ]
        },
        { 
          "type": "Hospitals", 
          "count": number, 
          "closest_distance": "X km",
          "facilities": [
            {
              "name": "Name",
              "distance": "X km",
              "rating": number (1-5),
              "quality": "Excellent|Good|Poor",
              "specialty": "General|Specialty",
              "highlights": ["features"]
            }
          ]
        },
        { 
          "type": "Shopping", 
          "count": number, 
          "closest_distance": "X km",
          "facilities": [
            {
              "name": "Name",
              "distance": "X km",
              "type": "Mall|Market"
            }
          ]
        },
        { 
          "type": "Parks", 
          "count": number, 
          "closest_distance": "X km",
          "facilities": [
            {
              "name": "Name",
              "distance": "X km",
              "size": "Large|Small"
            }
          ]
        }
      ]
    },
    
    "transportation": {
      "score": number (0-100),
      "transit_options": ["Bus", "Metro", "Train"],
      "commute_time": "Time to center",
      "walkability_index": number (0-100)
    },
    
    "neighbourhood": {
      "score": number (0-100),
      "rating": "Excellent" | "Good" | "Average" | "Poor",
      "character": "Description",
      "demographics": {
        "median_age": number,
        "population_density": "High|Medium|Low"
      }
    },
    
    "environmental_hazards": {
      "score": number (0-100, 低=好),
      "hazards": ["hazards list"],
      "severity": "High" | "Medium" | "Low" | "None"
    },
    
    "growth_potential": {
      "score": number (0-100),
      "forecast": "Strong Growth" | "Moderate Growth" | "Stable" | "Declining",
      "drivers": ["growth factors"],
      "outlook_5yr": "5-year outlook"
    },
    
    "political_stability": {
      "score": number (0-100, 高=稳定),
      "status": "Very Stable" | "Stable" | "Unstable",
      "factors": ["political factors"],
      "recent_events": ["events"],
      "policy_environment": "Policy overview"
    },
    
    "trade_economy": {
      "gdp_growth": number (%),
      "gdp_trend": "Growing" | "Stable" | "Declining",
      "inflation_rate": number (%),
      "unemployment_rate": number (%),
      "trade_balance": "Surplus" | "Deficit",
      "economic_outlook": "Strong" | "Moderate" | "Weak",
      "major_industries": ["industries"],
      "trade_relations": {
        "status": "Excellent" | "Good" | "Poor",
        "key_partners": ["partners"],
        "impact_on_property": "Impact description"
      }
    },

    "soil_analysis": {
      "type": "Clay|Sandy|Loamy|Rocky",
      "stability": "High" | "Moderate" | "Low",
      "liquefaction_risk": "High" | "Moderate" | "Low" | "None",
      "foundation_concerns": "Foundation risks"
    },

    "noise_data": {
      "score": number (0-100, 低=安静),
      "level": "Very Quiet" | "Quiet" | "Moderate" | "Noisy",
      "db_avg": number (dB),
      "sources": ["Traffic", "Construction", "Airport"]
    },

    "light_pollution": {
      "score": number (0-100, 低=暗/好),
      "bortle_scale": number (1-9),
      "brightness": "Dark Sky" | "Good" | "Moderate" | "Bright",
      "impact": "Visibility impact "
    },

    "additional_info": {
      "solar_potential": "Excellent" | "Good" | "Fair" | "Poor",
      "weather_summary": "Weather summary",
      "climate_risks": ["risks"],
      "insurance_considerations": "Insurance note"
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
      { "year": 2020, "major_events": ["event"] },
      { "year": 2021, "major_events": ["event"] },
      { "year": 2022, "major_events": ["event"] },
      { "year": 2023, "major_events": ["event"] },
      { "year": 2024, "major_events": ["event"] }
    ]
  },
  
  "market_intelligence": {
    "current_trend": "Up" | "Down" | "Stable",
    "prediction_6mo": "6-month forecast",
    "prediction_1yr": "1-year forecast",
    "ai_summary": "Summary of outlook, risks, opportunities",
    "recent_listings": [
      {
        "address": "Address",
        "price": "Formatted price",
        "type": "Apartment|House|Land",
        "bedrooms": number,
        "sqft": number,
        "date": "Listed date",
        "coordinates": { "lat": number, "lng": number }
      }
    ],
    "news": [
      {
        "headline": "Headline",
        "summary": "Summary",
        "date": "Date",
        "source": "Source",
        "relevance": "High" | "Medium" | "Low"
      }
    ]
  },
  
  "legal_resources": {
    "jurisdiction": "Jurisdiction",
    "property_law_system": "Common Law | Civil Law",
    "key_statutes": [
      { "name": "Name", "description": "Description" }
    ],
    "dispute_process": "Process overview",
    "typical_timeline": "Timeline",
    "resources": [
      { "name": "Name", "type": "Type", "description": "Description" }
    ]
  }
}

仅输出有效的英文JSON格式。不要使用markdown代码块。
  `.trim();

  try {
    const url = '/api/perplexity';
    console.log(`🌐 Calling Perplexity API [Proxy: ${url}]`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content:
              'You are a senior real estate analyst. Output strictly valid JSON. Use double quotes for all keys. No markdown. No comments. Be concise.',
          },
          { role: 'user', content: prompt + ' Ensure the response is complete and not truncated.' },
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Perplexity API FAILED:', response.status, response.statusText);
      throw new Error(`API request failed: ${response.status} - ${errText}`);
    }

    console.log('✅ Perplexity API Response received');
    const data = await response.json();
    console.log('📦 Raw API data:', data);

    let content = data.choices?.[0]?.message?.content;
    console.log('📝 Extracted content:', content);

    if (!content) {
      console.error('❌ No content in Perplexity response!');
      throw new Error('No content from Perplexity');
    }

    content = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    console.log('🧹 Cleaned content:', content.substring(0, 200) + '...');

    const parsedData = JSON.parse(content);
    console.log('✅ Successfully parsed JSON:', parsedData);

    if (locationData) {
      parsedData.location_info = {
        ...parsedData.location_info,
        formatted_address: locationData.formatted_address,
        coordinates: locationData.coordinates,
        country: locationData.location_details.country,
        region: locationData.location_details.state || locationData.location_details.county,
      };
    }

    await saveCache(cacheKey, 'analysis', parsedData);
    console.log('🎉 Returning REAL data from Perplexity!');
    return parsedData;
  } catch (error) {
    console.error('❌ ERROR in analyzePropertyRisk:', error);
    console.error('❌ Error stack:', error.stack);
    console.warn('⚠️ Falling back to mock data due to error above');
    return getFallbackData(location, locationData);
  }
};

/**
 * Generate comprehensive fallback data when API fails
 */
function getFallbackData(location, locationData) {
  const coords = locationData?.coordinates || { lat: 40.7128, lng: -74.006 };

  return {
    location_info: {
      formatted_address: locationData?.formatted_address || location,
      coordinates: coords,
      region: locationData?.location_details?.state || 'Unknown Region',
      country: locationData?.location_details?.country || 'Unknown',
      jurisdiction: 'Data unavailable - using estimates',
    },
    risk_analysis: {
      overall_score: 55,
      buying_risk: {
        score: 52,
        status: 'Medium',
        factors: ['Limited data available', 'Market volatility'],
      },
      renting_risk: { score: 48, status: 'Medium', factors: ['Average market conditions'] },
      flood_risk: {
        score: 30,
        level: 'Low',
        zones: [],
        history: ['No recent major flooding events'],
        nearby_water: ['Small creek 2km away'],
        erosion_risk: 'Low',
        description: 'Estimated low flood risk with stable soil conditions.',
      },
      soil_analysis: {
        type: 'Loamy',
        stability: 'High',
        liquefaction_risk: 'None',
        foundation_concerns: 'Standard foundation recommended',
      },
      noise_data: {
        score: 35,
        level: 'Quiet',
        db_avg: 45,
        sources: ['Local traffic'],
      },
      light_pollution: {
        score: 40,
        bortle_scale: 4,
        brightness: 'Moderate',
        impact: 'Suburban sky visibility',
      },
      crime_rate: {
        score: 45,
        rate_per_1000: 25,
        trend: 'Stable',
        types: ['Property crime', 'Theft'],
      },
      air_quality: { aqi: 75, score: 70, rating: 'Moderate', pollutants: ['PM2.5'] },
      amenities: {
        score: 65,
        walkability: 60,
        nearby: [
          { type: 'Schools', count: 3, closest_distance: '1.2 km' },
          { type: 'Hospitals', count: 2, closest_distance: '2.5 km' },
        ],
      },
      transportation: {
        score: 60,
        transit_options: ['Bus'],
        commute_time: '30-45 min',
        walkability_index: 55,
      },
      neighbourhood: {
        score: 65,
        rating: 'Average',
        character: 'Mixed residential area',
        demographics: { median_age: 35, population_density: 'Medium' },
      },
      environmental_hazards: { score: 20, hazards: [], severity: 'Low' },
      growth_potential: {
        score: 60,
        forecast: 'Moderate Growth',
        drivers: ['Economic development'],
        outlook_5yr: 'Steady appreciation expected',
      },
    },
    historical_trends: {
      property_values: [
        { year: 2019, median_price: 250000, change_pct: 0 },
        { year: 2020, median_price: 265000, change_pct: 6 },
        { year: 2021, median_price: 295000, change_pct: 11.3 },
        { year: 2022, median_price: 320000, change_pct: 8.5 },
        { year: 2023, median_price: 335000, change_pct: 4.7 },
        { year: 2024, median_price: 350000, change_pct: 4.5 },
      ],
      crime_trends: [
        { year: 2019, incidents_per_1000: 28, change_pct: 0 },
        { year: 2020, incidents_per_1000: 26, change_pct: -7.1 },
        { year: 2021, incidents_per_1000: 27, change_pct: 3.8 },
        { year: 2022, incidents_per_1000: 25, change_pct: -7.4 },
        { year: 2023, incidents_per_1000: 24, change_pct: -4 },
        { year: 2024, incidents_per_1000: 25, change_pct: 4.2 },
      ],
      population: [
        { year: 2019, count: 50000, change_pct: 0 },
        { year: 2020, count: 51000, change_pct: 2 },
        { year: 2021, count: 52500, change_pct: 2.9 },
        { year: 2022, count: 54000, change_pct: 2.9 },
        { year: 2023, count: 55500, change_pct: 2.8 },
        { year: 2024, count: 57000, change_pct: 2.7 },
      ],
      development_timeline: [
        { year: 2020, events: ['New transit line approved'] },
        { year: 2022, events: ['Shopping center opened'] },
        { year: 2023, events: ['School expansion completed'] },
        { year: 2024, events: ['Park renovation'] },
      ],
    },
    market_intelligence: {
      current_trend: 'Up',
      prediction_6mo: 'Moderate appreciation expected',
      prediction_1yr: 'Continued steady growth likely',
      ai_summary: 'Estimated data due to API limits. Research recommended.',
      recent_listings: [],
      news: [
        {
          headline: 'Data unavailable',
          summary: 'Unable to fetch recent news.',
          date: 'N/A',
          source: 'System',
          relevance: 'Low',
        },
      ],
    },
    legal_resources: {
      jurisdiction: 'Data unavailable',
      property_law_system: 'Unknown',
      key_statutes: [],
      dispute_process: 'Consult local legal resources.',
      typical_timeline: 'Varies',
      resources: [],
    },
    additional_info: {
      solar_potential: 'Good',
      weather_summary: 'Data unavailable',
      climate_risks: [],
      insurance_considerations: 'Standard insurance recommended',
    },
  };
}

/**
 * Send a message to the AI Chatbot (Perplexity)
 * @param {Array} messages - Chat history [{role: 'user'|'assistant', content: '...'}]
 * @param {Object} context - Current application context (location, risk data)
 * @returns {Promise<string>} - The AI's response
 */
/**
 * Send the risk analysis report via email
 */
export const sendRiskReportEmail = async (email, location, analysisData) => {
  try {
    const response = await fetch('/api/report/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        location,
        overall_score: analysisData.risk_analysis?.overall_score || 0,
        summary: JSON.stringify(analysisData.risk_analysis, null, 2),
        details: analysisData,
      }),
    });
    if (!response.ok) throw new Error('Failed to send email');
    return await response.json();
  } catch (error) {
    console.error('Email report failed:', error);
    return null; // Don't block UI
  }
};

export const sendChatMessage = async (messages, context = {}) => {
  const contextString = `
    Current Location Context: ${context.location || 'Not specified'}.
    User Geolocation: ${context.userLocation ? `${context.userLocation.lat}, ${context.userLocation.lng}` : 'Unknown'}.
    Risk Data Available: ${!!context.riskSummary}.
  `;

  const systemPrompt = `You are Terra Truce Assistant.
Goal: Provide concrete real estate advice with specific listings and links.
Tone: Confident, Direct, Professional.
Format:
1. Provide 3-5 specific recommendations if asked for listings.
2. Use valid links for property sites (MagicBricks, 99acres, Housing.com, Zillow, etc. based on region).
3. If asked about risk, summarize the key factors briefly.

Context:
${contextString.trim()}`;

  // Prepare messages for Perplexity
  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
  ];

  const lastMsg = messages[messages.length - 1].content;
  // Cache key based on last message
  const normalizeKey = (str) => str.toLowerCase().trim().replace(/\s+/g, ' ');
  const cacheKey = normalizeKey(`chat_${lastMsg}_${context.location || ''}`);

  // Check cache (optional, implementation depends on cache system availability)
  // const cached = await checkCache(cacheKey, 'chat');
  // if (cached) return cached + ' ⚡';

  try {
    const url = '/api/perplexity';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: apiMessages,
        temperature: 0.1,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Perplexity API Error: ${errText}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error('No content generated by Perplexity');

    // Attempt JSON parse if the prompt requested JSON (legacy support), else return text
    try {
      // If content looks like JSON, parse it to extract "answer" field if present
      if (content.trim().startsWith('{') && content.includes('"answer"')) {
        const parsed = JSON.parse(content);
        return parsed.answer || content;
      }
    } catch (e) {
      // Not JSON, logical fallthrough
    }

    return content;
  } catch (error) {
    console.error('Chatbot API Error:', error);
    return 'Connection error. Please try again.';
  }
};
