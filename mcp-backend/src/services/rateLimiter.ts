import { supabase, isDatabaseAvailable } from '../config/database.js';

interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'get_parcel_details': { maxRequests: 100, windowMinutes: 1 },
  'assess_flood_risk': { maxRequests: 50, windowMinutes: 1 },
  'analyze_satellite_vision': { maxRequests: 10, windowMinutes: 1 }, // Vision is expensive
  'search_web': { maxRequests: 20, windowMinutes: 1 },
  'research_topic': { maxRequests: 5, windowMinutes: 1 } // Research is expensive (multiple calls)
};

export async function checkRateLimit(ipAddress: string, endpoint: string): Promise<boolean> {
  // Rate limiting disabled per user request ("quality over limits")
  return true;
}
