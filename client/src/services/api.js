import { geocodeAddress, getLocationContext } from './geocoding';
import { supabase } from './supabase';

const normalizeKey = (str) => str.toLowerCase().trim().replace(/\s+/g, ' ');

const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY;

/**
 * Comprehensive 10-Point Property Risk Analysis
 * Analyzes location for buying/renting risks, environmental factors, and growth potential
 */
const PROXY_URL = '/api/perplexity';

// Initialization Check
if (!supabase) {
  console.warn('⚠️ Supabase client failed to initialize. Cache features will be disabled.');
} else {
  console.log('✅ Supabase client connected');
}

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

const cleanupExpiredCache = async () => {
  try {
    const { error } = await supabase
      .from('cache_entries')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.warn('⚠️ Cache cleanup failed:', error);
    } else {
      console.log('🧹 Expired cache entries cleaned');
    }
  } catch (err) {
    console.warn('Cache cleanup error:', err);
  }
};

const saveCache = async (key, type, data) => {
  try {
    const expiresAt = new Date(Date.now() + CACHE_DURATION).toISOString();
    const createdAt = new Date().toISOString();
    console.log(`💾 Refreshing Cache Entry [${key}]`);

    // 1. Delete existing entry if any
    await supabase.from('cache_entries').delete().eq('key', key);

    // 2. Insert fresh entry with new timestamps
    const { error } = await supabase.from('cache_entries').insert({
      key,
      type,
      data,
      expires_at: expiresAt,
      created_at: createdAt,
    });

    if (error) {
      if (error.code === '42501') {
        console.error('❌ Supabase RLS Policy Violation: "cache_entries" table does not allow updates/deletes for anon role. Please check your RLS policies.');
      } else {
        console.error('❌ Cache Refresh Error (Supabase):', error);
      }
    } else {
      console.log('✅ Cache Refreshed Successfully');
    }
  } catch (err) {
    console.warn('Cache refresh failed', err);
  }
};

export const analyzePropertyRisk = async (location) => {
  const cacheKey = getCacheKey(location, 'analysis');

  const cached = await checkCache(cacheKey, 'analysis');
  if (cached) {
    console.log(`✅ Refreshing cache for [${cacheKey}]...`);
    // Refresh cache expiry on hit (AWAIT this to ensure it completes)
    await saveCache(cacheKey, 'analysis', cached);
    return cached;
  }

  // Cleanup expired entries before fetching new data
  cleanupExpiredCache();

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
      { "year": 2020, "events": ["event"] },
      { "year": 2021, "events": ["event"] },
      { "year": 2022, "events": ["event"] },
      { "year": 2023, "events": ["event"] },
      { "year": 2024, "events": ["event"] }
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
    console.log(`🌐 Calling Backend API [Endpoint: /api/analyze-property] for: ${location}`);

    // Call MCP Backend instead of Perplexity directly
    const response = await fetch('/api/analyze-property', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Backend API FAILED:', response.status, response.statusText, errText);
      throw new Error(`API request failed: ${response.status} - ${errText}`);
    }

    const result = await response.json();

    // Validate response structure
    if (!result.success || !result.data) {
      throw new Error('Invalid response format from backend');
    }

    const parsedData = result.data;

    if (locationData) {
      // Merge geocoded data if available
      parsedData.location_info = {
        ...parsedData.location_info,
        formatted_address: locationData.formatted_address || parsedData.location_info.formatted_address,
        coordinates: locationData.coordinates || parsedData.location_info.coordinates,
        country: locationData.location_details?.country || parsedData.location_info.country,
        region: locationData.location_details?.state || locationData.location_details?.county || parsedData.location_info.region,
      };
    }

    await saveCache(cacheKey, 'analysis', parsedData);
    return parsedData;
    await saveCache(cacheKey, 'analysis', parsedData);
    return parsedData;
  } catch (error) {
    console.error('Error analyzing property:', error);
    // CRITICAL FIX: Do NOT return fallback data for API failures. 
    // We want to see the real error in the UI.
    throw error;
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
export const sendChatMessage = async (messages, context = {}) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('API key not configured');

  const contextString = `
    Current Location Context: ${context.location || 'Not specified'}.
    User Geolocation: ${context.userLocation ? `${context.userLocation.lat}, ${context.userLocation.lng}` : 'Unknown'}.
    Risk Data Available: ${!!context.riskSummary}.
  `;

  // CHATBOT SYSTEM PROMPT (Pure Chinese for Token Optimization)
  // Intent: "Provide 5 specific suggestions with valid Search URLs. Single Risk Score. Confident Tone."
  const systemPrompt = `你是Terra Truce助手。

目标：
1. **推荐房源**：
   - 必须提供至少 **5个具体的地块/房产建议**。
   - 每个建议格式（必须左对齐 / Flush Left）：
     1. [名称] - [价格]
     2. [位置]
     3. • [简短理由]
     4. **[链接]**: (MUST Use strictly these 3 formats ONLY. Rotate between them / 必须使用这3种格式):
       - **MagicBricks**: \`https://www.magicbricks.com/property-for-sale/residential-real-estate?bedroom=&proptype=Residential-Plot&Locality=[Locality]&cityName=[City]&BudgetMin=5-Lacs&areaUnit=12850\`
       - **99acres**: \`https://www.99acres.com/search/property/buy/residential-land?keyword=[Locality]%20[City]&preference=S&property_type=3\`
       - **Housing**: \`https://housing.com/in/buy/[city_lowercase]/plot-[locality_lowercase]\`

2. **风险分析**：
   - 仅提供一个 **综合评分** (0-100)。
   - 不需要细分。

3. **语气**：
   - **自信**。绝对禁止使用“我无法提供”、“仅供参考”、“不确定”等模糊词语。
   - 直接给出建议和分数。

输出格式:
必须输出符合以下结构的严格JSON（值必须为 **英文**）：
{
  "answer": "Here are 5 suggestions...\n\n1. [Name] - [Price]\n[Location]\n• [Reasoning]\n[[Link]](URL)\n\n2. ...",
  "risk_score": number
}

关键规则:
1. **语言**: 所有可见文本（answer）必须为 **英文**。
2. **拒绝模糊**: 不要说“没有实时数据”。
3. **链接**: 每个建议必须包含链接。

上下文:
${contextString.trim()}`;

  const geminiContents = [];
  let isFirstUserMsg = true;

  messages.forEach((msg) => {
    let role = msg.role === 'assistant' ? 'model' : 'user';
    let text = msg.content;

    if (msg.role === 'system') return;

    if (isFirstUserMsg && role === 'user') {
      text = `${systemPrompt}\n\n用户请求: ${text}`;
      isFirstUserMsg = false;
    }

    geminiContents.push({
      role: role,
      parts: [{ text: text }],
    });
  });

  if (geminiContents.length === 0) {
    geminiContents.push({ role: 'user', parts: [{ text: systemPrompt + '\n\nHello' }] });
  }

  const lastMsg = messages[messages.length - 1].content;
  const cacheKey = normalizeKey(`gemini_${lastMsg}_${context.location || ''}`);

  const cached = await checkCache(cacheKey, 'chat');
  if (cached) {
    console.log(`✅ Refreshing cache for chat message [${cacheKey}]...`);
    // Refresh cache expiry on hit (AWAIT this)
    await saveCache(cacheKey, 'chat', cached);
    return cached + ' ⚡';
  }

  // Cleanup expired entries
  cleanupExpiredCache();

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: geminiContents,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 5000,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error: ${errText}`);
    }

    const data = await response.json();
    let content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error('No content generated by Gemini');

    try {
      const parsed = JSON.parse(content);

      let displayString = parsed.answer || '';

      if (parsed.risk_score !== undefined) {
        displayString += `\n\n**Overall Risk Score:** ${parsed.risk_score}/100`;
      }

      content = displayString;
    } catch (e) {
      console.warn('Failed to parse Chatbot JSON, attempting regex extraction', e);
      // Fallback: Try to extract the "answer" field if JSON is broken/truncated
      const answerMatch = content.match(/"answer":\s*"((?:[^"\\]|\\.)*)/);
      if (answerMatch) {
        try {
          content = JSON.parse(`"${answerMatch[1]}"`);
        } catch (parseErr) {
          content = answerMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
        }
      }
    }

    await saveCache(cacheKey, 'chat', content);
    return content;
  } catch (error) {
    console.error('Chatbot API Error:', error);
    return 'Connection error. Please try again.';
  }
};
