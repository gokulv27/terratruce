import { z } from 'zod';
import { supabase, isDatabaseAvailable } from '../config/database.js';
import { getCached, setCached } from '../config/redis.js';

// =====================================================
// TOOL 1: Get Parcel Details
// =====================================================

export const GetParcelDetailsSchema = z.object({
  parcel_id: z.string().describe('Unique parcel identifier (e.g., MUM-2024-001)')
});

export async function getParcelDetails(args: z.infer<typeof GetParcelDetailsSchema>) {
  const cacheKey = `parcel:${args.parcel_id}`;
  
  // Check cache first
  const cached = await getCached(cacheKey);
  if (cached) {
    console.log(`[GeoTools] Cache hit for ${args.parcel_id}`);
    return cached;
  }

  // Query database
  const { data, error } = await supabase!
    .from('geo_core.parcels')
    .select('*')
    .eq('parcel_id', args.parcel_id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch parcel: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Parcel ${args.parcel_id} not found`);
  }

  const result = {
    parcel_id: data.parcel_id,
    address: data.address,
    city: data.city,
    state: data.state,
    zip_code: data.zip_code,
    area_sqm: data.area_sqm,
    assessed_value: data.assessed_value,
    owner_name: data.owner_name,
    geometry: data.geometry // GeoJSON
  };

  // Cache for 7 days
  await setCached(cacheKey, result);
  
  return result;
}

// =====================================================
// TOOL 2: Assess Flood Risk
// =====================================================

export const AssessFloodRiskSchema = z.object({
  parcel_id: z.string().describe('Parcel ID to assess flood risk for')
});

export async function assessFloodRisk(args: z.infer<typeof AssessFloodRiskSchema>) {
  const cacheKey = `flood_risk:${args.parcel_id}`;
  
  // Check cache
  const cached = await getCached(cacheKey);
  if (cached) {
    console.log(`[GeoTools] Cache hit for flood risk ${args.parcel_id}`);
    return cached;
  }

  // Get parcel geometry
  const { data: parcel, error: parcelError } = await supabase!
    .from('geo_core.parcels')
    .select('geometry')
    .eq('parcel_id', args.parcel_id)
    .single();

  if (parcelError || !parcel) {
    throw new Error(`Parcel ${args.parcel_id} not found`);
  }

  // Use PostGIS function to calculate flood risk
  const { data: risks, error: riskError } = await supabase!
    .rpc('geo_core.calculate_flood_risk', { parcel_geom: parcel.geometry });

  if (riskError) {
    throw new Error(`Flood risk calculation failed: ${riskError.message}`);
  }

  const result = {
    parcel_id: args.parcel_id,
    flood_zones: risks || [],
    overall_risk: risks && risks.length > 0 ? risks[0].risk_level : 'NONE',
    assessment_date: new Date().toISOString()
  };

  // Cache for 7 days
  await setCached(cacheKey, result);
  
  return result;
}

// =====================================================
// TOOL 3: Search Parcels by Location
// =====================================================

export const SearchParcelsSchema = z.object({
  city: z.string().optional().describe('City name to search'),
  state: z.string().optional().describe('State name to search'),
  limit: z.number().default(10).describe('Maximum results to return')
});

export async function searchParcels(args: z.infer<typeof SearchParcelsSchema>) {
  let query = supabase!
    .from('geo_core.parcels')
    .select('parcel_id, address, city, state, area_sqm, assessed_value')
    .limit(args.limit);

  if (args.city) {
    query = query.ilike('city', `%${args.city}%`);
  }

  if (args.state) {
    query = query.ilike('state', `%${args.state}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Search failed: ${error.message}`);
  }

  return {
    count: data?.length || 0,
    parcels: data || []
  };
}
