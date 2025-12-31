import { z } from 'zod';
import { geminiManager } from '../services/geminiManager.js';

// =====================================================
// TOOL: Analyze Satellite Vision
// =====================================================

export const AnalyzeSatelliteVisionSchema = z.object({
  latitude: z.number().describe('Latitude of location'),
  longitude: z.number().describe('Longitude of location'),
  zoom: z.number().default(18).describe('Zoom level (1-20, higher = closer)'),
  analysis_type: z.enum(['infrastructure', 'vegetation', 'development', 'general'])
    .default('general')
    .describe('Type of analysis to perform')
});

export async function analyzeSatelliteVision(args: z.infer<typeof AnalyzeSatelliteVisionSchema>) {
  const { latitude, longitude, zoom, analysis_type } = args;
  
  // Construct Google Maps Static API URL
  const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!mapsApiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY not configured');
  }

  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?` +
    `center=${latitude},${longitude}` +
    `&zoom=${zoom}` +
    `&size=640x640` +
    `&maptype=satellite` +
    `&key=${mapsApiKey}`;

  // Fetch satellite image
  const response = await fetch(mapUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch satellite image: ${response.statusText}`);
  }

  const imageBuffer = await response.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString('base64');

  // Construct analysis prompt based on type
  const prompts: Record<string, string> = {
    infrastructure: `Analyze this satellite image and identify:
- Roads and transportation infrastructure
- Buildings and structures
- Utilities (power lines, water features)
- Proximity to major infrastructure
Return as JSON: { "roads": [], "buildings": number, "infrastructure_score": 1-10 }`,

    vegetation: `Analyze vegetation and green cover in this satellite image:
- Tree coverage percentage
- Green spaces and parks
- Agricultural land
- Environmental quality indicators
Return as JSON: { "tree_coverage_pct": number, "green_spaces": [], "environmental_score": 1-10 }`,

    development: `Assess development level and urban density:
- Building density (low/medium/high)
- Development stage (undeveloped/developing/developed)
- Commercial vs residential indicators
- Growth potential
Return as JSON: { "density": string, "development_stage": string, "growth_potential": 1-10 }`,

    general: `Provide comprehensive analysis of this satellite image:
- Overall land use
- Notable features
- Development level
- Environmental characteristics
- Investment considerations
Return as JSON with relevant fields.`
  };

  const prompt = prompts[analysis_type];

  // Use Gemini Vision (always uses backup keys to preserve primary)
  const analysisText = await geminiManager.analyzeImage(base64Image, prompt, 'image/jpeg');

  // Parse JSON response
  try {
    const analysis = JSON.parse(analysisText);
    return {
      location: { latitude, longitude },
      analysis_type,
      timestamp: new Date().toISOString(),
      ...analysis
    };
  } catch (error) {
    // If JSON parsing fails, return raw text
    return {
      location: { latitude, longitude },
      analysis_type,
      timestamp: new Date().toISOString(),
      raw_analysis: analysisText
    };
  }
}
