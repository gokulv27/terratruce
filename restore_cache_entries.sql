-- =====================================================
-- Restore cache_entries Table
-- =====================================================

-- 1. Table Structure
CREATE TABLE IF NOT EXISTS public.cache_entries (
  key text PRIMARY KEY,          -- Hash of query or location
  type text NOT NULL,            -- 'analysis' or 'chat'
  data jsonb NOT NULL,           -- The cached API response
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at timestamp with time zone NOT NULL
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cache_entries_type ON public.cache_entries(type);
CREATE INDEX IF NOT EXISTS idx_cache_entries_expires_at ON public.cache_entries(expires_at);

-- 3. Security Configuration (Row Level Security)
ALTER TABLE public.cache_entries ENABLE ROW LEVEL SECURITY;

-- 4. Access Policies
-- Drop existing policies to avoid "policy already exists" errors
DROP POLICY IF EXISTS "Allow public read access" ON public.cache_entries;
DROP POLICY IF EXISTS "Allow public insert" ON public.cache_entries;
DROP POLICY IF EXISTS "Allow public update" ON public.cache_entries;
DROP POLICY IF EXISTS "Allow public delete" ON public.cache_entries; -- Added for completeness

-- Create policies
CREATE POLICY "Allow public read access" ON public.cache_entries FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.cache_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.cache_entries FOR UPDATE USING (true);
-- Optionally allow delete if you need to clear cache from client, 
-- though usually expiration is better handled by a cron or logic.
-- Adding it here because the previous file had it and it's useful for debugging.
CREATE POLICY "Allow public delete" ON public.cache_entries FOR DELETE USING (true);
