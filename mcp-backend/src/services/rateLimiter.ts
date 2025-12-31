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
  // If database unavailable, allow all requests (degraded mode)
  if (!isDatabaseAvailable()) {
    return true;
  }

  const config = RATE_LIMITS[endpoint] || { maxRequests: 60, windowMinutes: 1 };
  const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000);

  try {
    // Count requests in current window
    const { data, error } = await supabase!
      .from('private.rate_limits')
      .select('request_count, window_start')
      .eq('ip_address', ipAddress)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('[RateLimit] Query error:', error);
      return true; // Allow on error
    }

    if (data && data.request_count >= config.maxRequests) {
      console.warn(`[RateLimit] Blocked ${ipAddress} on ${endpoint} (${data.request_count}/${config.maxRequests})`);
      return false;
    }

    // Increment or create record
    await supabase!.from('private.rate_limits').upsert({
      ip_address: ipAddress,
      endpoint,
      request_count: (data?.request_count || 0) + 1,
      window_start: data ? data.window_start : new Date().toISOString()
    });

    return true;

  } catch (error) {
    console.error('[RateLimit] Error:', error);
    return true; // Fail open
  }
}
