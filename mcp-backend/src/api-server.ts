// Load environment variables
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import { geminiManager } from './services/geminiManager.js';
import { supabase, isDatabaseAvailable } from './config/database.js';
import { scheduleSiteVisit } from './tools/scheduleTool.js';
import { analyzeSatelliteVision } from './tools/visionTools.js';
import { searchWeb, researchTopic } from './tools/searchTools.js';

const app = express();
const PORT = process.env.API_PORT || 3001;
const CORS_ORIGIN = process.env.API_CORS_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: isDatabaseAvailable(),
      gemini: !!process.env.GEMINI_PRIMARY_KEY,
      maps: !!process.env.GOOGLE_MAPS_API_KEY,
    },
  });
});

// Property Analysis Endpoint
app.post('/api/analyze-property', async (req, res) => {
  try {
    const { location } = req.body;

    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    console.log(`[API] Analyzing property: ${location}`);

    // Use Gemini AI for comprehensive analysis
    const prompt = `Analyze this property location comprehensively: ${location}

Provide a detailed JSON response with:
1. Location information (address, coordinates, region)
2. Risk analysis (overall score, buying risk, renting risk, flood risk)
3. Crime rate and safety
4. Air quality
5. Amenities (schools, hospitals, shopping, parks)
6. Transportation and walkability
7. Neighborhood quality
8. Environmental hazards
9. Growth potential
10. Market intelligence

Return ONLY valid JSON, no markdown.`;

    const analysis = await geminiManager.generateText(prompt, true);

    // Parse JSON response
    let parsedData;
    try {
      const cleanedContent = analysis.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('[API] Failed to parse Gemini response:', parseError);
      return res.status(500).json({ error: 'Failed to parse analysis' });
    }

    res.json({ success: true, data: parsedData });
  } catch (error) {
    console.error('[API] Error analyzing property:', error);
    const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
    res.status(500).json({ error: errorMessage });
  }
});

// AI Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    console.log(`[API] Chat request with ${messages.length} messages`);

    // Build context string
    const contextString = `
Location Context: ${context?.location || 'Not specified'}
User Location: ${context?.userLocation ? `${context.userLocation.lat}, ${context.userLocation.lng}` : 'Unknown'}
Risk Data Available: ${!!context?.riskSummary}
    `.trim();

    // System prompt for property recommendations
    const systemPrompt = `You are Terra Truce AI Assistant.

Provide property recommendations with:
1. At least 5 specific property suggestions
2. Each with name, price, location, reasoning, and search link
3. Overall risk score (0-100)
4. Confident, helpful tone

Output JSON format:
{
  "answer": "Detailed recommendations...",
  "risk_score": number
}

Context: ${contextString}`;

    // Convert messages to Gemini format
    const geminiMessages = messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    // Add system prompt to first user message
    if (geminiMessages.length > 0 && geminiMessages[0].role === 'user') {
      geminiMessages[0].parts[0].text = `${systemPrompt}\n\nUser: ${geminiMessages[0].parts[0].text}`;
    }

    const response = await geminiManager.generateText(
      geminiMessages.map((m) => m.parts[0].text).join('\n\n'),
      true
    );

    // Try to parse JSON response
    let finalResponse = response;
    try {
      const parsed = JSON.parse(response);
      if (parsed.answer) {
        finalResponse = parsed.answer;
        if (parsed.risk_score !== undefined) {
          finalResponse += `\n\n**Overall Risk Score:** ${parsed.risk_score}/100`;
        }
      }
    } catch (e) {
      // Not JSON, use as-is
    }

    res.json({ success: true, response: finalResponse });
  } catch (error) {
    console.error('[API] Error in chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Chat failed';
    res.status(500).json({ error: errorMessage });
  }
});

// Satellite Analysis Endpoint
app.post('/api/satellite-analysis', async (req, res) => {
  try {
    const { latitude, longitude, zoom = 18, analysis_type = 'general' } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    console.log(`[API] Satellite analysis: ${latitude}, ${longitude}`);

    const result = await analyzeSatelliteVision({
      latitude,
      longitude,
      zoom,
      analysis_type,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[API] Error in satellite analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
    res.status(500).json({ error: errorMessage });
  }
});

// Schedule Site Visit Endpoint (with Calendar Integration)
app.post('/api/schedule-visit', async (req, res) => {
  try {
    const { property_address, user_email, date_time, notes } = req.body;

    if (!property_address || !user_email || !date_time) {
      return res.status(400).json({
        error: 'Property address, user email, and date_time are required',
      });
    }

    console.log(`[API] Scheduling visit: ${property_address} for ${user_email}`);

    const result = await scheduleSiteVisit({
      property_address,
      user_email,
      date_time,
      notes: notes || '',
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[API] Error scheduling visit:', error);
    const errorMessage = error instanceof Error ? error.message : 'Scheduling failed';
    res.status(500).json({ error: errorMessage });
  }
});

// --- Calendar CRUD Endpoints ---

// LIST Visits
app.get('/api/visits', async (req, res) => {
  try {
    const { user_email } = req.query;
    console.log(`[API] Fetching visits for: ${user_email || 'ALL'}`);

    let query = supabase!.from('geo_core.visits').select('*').order('visit_time', { ascending: true });
    
    // Fallback logic for table name if needed, but for list we try primary first
    // If we really wanted robust fallback we'd need a helper, but assuming geo_core exists from previous tool usage
    if (user_email) {
      query = query.eq('user_email', user_email);
    }

    const { data, error } = await query;

    if (error) {
       // Try fallback to public 'visits'
       if (error.code === '42P01') {
           console.warn('[API] geo_core.visits not found, trying public.visits');
           let fallbackQuery = supabase!.from('visits').select('*').order('visit_time', { ascending: true });
           if (user_email) fallbackQuery = fallbackQuery.eq('user_email', user_email);
           const { data: fallbackData, error: fallbackError } = await fallbackQuery;
           if (fallbackError) throw fallbackError;
           return res.json({ success: true, data: fallbackData });
       }
       throw error;
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('[API] Error fetching visits:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE Visit
app.put('/api/visits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { visit_time, notes, status } = req.body;
    console.log(`[API] Updating visit ${id}`, { visit_time, notes, status });

    const updates: any = {};
    if (visit_time) updates.visit_time = visit_time;
    if (notes !== undefined) updates.notes = notes;
    if (status) updates.status = status;

    // Try geo_core first
    const { data, error } = await supabase!
      .from('geo_core.visits')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
        if (error.code === '42P01') {
            const { data: fallbackData, error: fallbackError } = await supabase!
                .from('visits')
                .update(updates)
                .eq('id', id)
                .select();
            if (fallbackError) throw fallbackError;
            return res.json({ success: true, data: fallbackData });
        }
        throw error;
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('[API] Error updating visit:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE Visit
app.delete('/api/visits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[API] Deleting visit ${id}`);

    // Try geo_core first
    const { error } = await supabase!
      .from('geo_core.visits')
      .delete()
      .eq('id', id);

    if (error) {
        if (error.code === '42P01') {
             const { error: fallbackError } = await supabase!
                .from('visits')
                .delete()
                .eq('id', id);
             if (fallbackError) throw fallbackError;
             return res.json({ success: true, message: 'Visit cancelled (fallback)' });
        }
        throw error;
    }

    res.json({ success: true, message: 'Visit cancelled' });
  } catch (error: any) {
    console.error('[API] Error deleting visit:', error);
    res.status(500).json({ error: error.message });
  }
});

// Web Search Endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { query, num_results = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`[API] Web search: ${query}`);

    const result = await searchWeb({ query, num_results });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[API] Error in search:', error);
    const errorMessage = error instanceof Error ? error.message : 'Search failed';
    res.status(500).json({ error: errorMessage });
  }
});

// Research Topic Endpoint
app.post('/api/research', async (req, res) => {
  try {
    const { topic, depth = 'quick' } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    console.log(`[API] Research: ${topic} (${depth})`);

    const result = await researchTopic({ topic, depth });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[API] Error in research:', error);
    const errorMessage = error instanceof Error ? error.message : 'Research failed';
    res.status(500).json({ error: errorMessage });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🌐 Terra Truce API Server');
  console.log('='.repeat(60));
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔗 CORS enabled for: ${CORS_ORIGIN}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('\n📋 Available Endpoints:');
  console.log('   GET  /api/health');
  console.log('   POST /api/analyze-property');
  console.log('   POST /api/chat');
  console.log('   POST /api/satellite-analysis');
  console.log('   POST /api/schedule-visit (📅 Calendar Integration)');
  console.log('   POST /api/search');
  console.log('   POST /api/research');
  console.log('='.repeat(60) + '\n');
});
