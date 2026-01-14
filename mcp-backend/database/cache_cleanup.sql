-- =====================================================
-- CACHE CLEANUP & REFRESH (Fixing "Stale Data" Issues)
-- =====================================================

-- 1. Create a function to delete expired entries
-- This can be called via RPC from the backend or client
CREATE OR REPLACE FUNCTION delete_expired_cache_entries()
RETURNS void AS $$
BEGIN
  DELETE FROM public.cache_entries
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 2. Update RLS Policy to HIDE expired data immediately
-- Even if not deleted yet, users should NOT see it.
DROP POLICY IF EXISTS "Allow public read access" ON public.cache_entries;
CREATE POLICY "Allow public read access" 
ON public.cache_entries FOR SELECT 
USING (expires_at > NOW());

-- 3. Truncate existing cache to force a fresh start (One-time fix)
-- This ensures no bad "55" data lingers.
TRUNCATE TABLE public.cache_entries;

-- 4. Grant execute on the cleanup function
GRANT EXECUTE ON FUNCTION delete_expired_cache_entries() TO anon, authenticated, service_role;
