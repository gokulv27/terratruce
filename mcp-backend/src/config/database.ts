import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '⚠️  [Database] SUPABASE_URL or SUPABASE_ANON_KEY missing - Database features disabled'
  );
  console.warn('   MCP will operate in degraded mode using cache only');
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
    });
    console.log('✅ [Database] Supabase client initialized');
  } catch (error) {
    console.error('❌ [Database] Failed to initialize Supabase:', error);
    console.warn('   MCP will operate in degraded mode using cache only');
  }
}

// Export with null check helper
export { supabase };

export function isDatabaseAvailable(): boolean {
  return supabase !== null;
}

export function requireDatabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Database is not available. Check SUPABASE_URL and SUPABASE_ANON_KEY.');
  }
  return supabase;
}
