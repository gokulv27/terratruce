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
    console.log(`💾 Saving Cache Entry [${key}]...`);

    // Use UPSERT to handle both insert and update (on conflict do update)
    const { error } = await supabase.from('cache_entries').upsert({
      key,
      type,
      data,
      expires_at: expiresAt,
      created_at: createdAt,
    }, { onConflict: 'key' }); // Ensure we strictly update based on primary key 'key'

    if (error) {
      console.error('❌ Cache Upsert Failed:', error);
      console.error('Details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Cache Saved Successfully into DB', { key, expiresAt });
    }
  } catch (err) {
    console.warn('Cache save exception:', err);
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

请提供详细的JSON响应（严禁markdown，仅纯JSON），严格遵循以下结构（所有内容必须用英文输出）。
注意：
1. 数组（Arrays）最多包含2个项目。
2. 历史趋势（Historical Trends）仅提供 2022, 2023, 2024 年的数据。
3. 描述（Descriptions）必须极简（<15 words）。
4. 确保JSON完整且有效，不要截断。
5. 必须根据实际位置数据给出真实估算，严禁使用固定模板。

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
      { "year": 2022, "median_price": number, "change_pct": number },
      { "year": 2023, "median_price": number, "change_pct": number },
      { "year": 2024, "median_price": number, "change_pct": number }
    ],
    "crime_trends": [
      { "year": 2022, "incidents_per_1000": number, "change_pct": number },
      { "year": 2023, "incidents_per_1000": number, "change_pct": number },
      { "year": 2024, "incidents_per_1000": number, "change_pct": number }
    ],
    "population": [
      { "year": 2022, "count": number, "change_pct": number },
      { "year": 2023, "count": number, "change_pct": number },
      { "year": 2024, "count": number, "change_pct": number }
    ],
    "development_timeline": [
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
    const isProd = import.meta.env.PROD;
    // Standardize to use the direct API in dev if key is present, or proxy if preferred. 
    // We'll stick to a consistent approach.
    const url = isProd ? PROXY_URL : '/api/perplexity';

    const headers = { 'Content-Type': 'application/json' };

    if (PERPLEXITY_API_KEY) {
      headers['Authorization'] = `Bearer ${PERPLEXITY_API_KEY}`;
    }

    console.log(`🌐 Calling Perplexity API [Proxy: ${url}]`);

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: '房地产分析专家。严禁markdown。仅输出有效的英文JSON。保持所有描述极为简练（Telegraphic style, <15 words）。列表项最多2个。历史数据仅需最近3年 (2022-2024)。',
          },
          { role: 'user', content: prompt },
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

    const data = await response.json();
    let content = data.choices[0].message.content;

    // Robust JSON extraction: look for strictly the first '{' and last '}'
    const startIndex = content.indexOf('{');
    const endIndex = content.lastIndexOf('}');

    if (startIndex !== -1 && endIndex !== -1) {
      content = content.substring(startIndex, endIndex + 1);
    }

    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch (parseErr) {
      console.error('JSON Parse Error:', parseErr);
      console.log('Raw content:', content);
      throw parseErr; // This will be caught by the outer catch block
    }

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
    return parsedData;
  } catch (error) {
    console.error('❌ Critical Error analyzing property:', error);
    console.error('Stack:', error.stack);

    // Check if it's an API failure or code error
    if (error.message && error.message.includes('API request failed')) {
      console.warn('ℹ️ Perplexity API failed. This is likely why the result is not cached.');
      console.warn('Check: 1. API Key validity 2. Proxy settings 3. Rate limits');
    }

    // STRICT MODE: NO MOCK DATA. Return null to indicate failure.
    // The UI should handle this by showing an error state.
    alert("Unable to fetch real-time analysis data. Please try again later.");
    return null;
  }
};

/**
 */
/**
 * Generate comprehensive fallback data when API fails
 * DEPRECATED: User requested STRICT real-time data only.
 */
function getFallbackData(location, locationData) {
  // STRICT MODE: No fallback data.
  return null;
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
