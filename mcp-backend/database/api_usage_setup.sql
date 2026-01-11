-- =====================================================
-- API USAGE TRACKING (Persistent Rotation)
-- =====================================================

-- Create table in private schema to avoid public access
CREATE TABLE IF NOT EXISTS private.api_usage (
    key_id TEXT PRIMARY KEY, -- e.g., 'primary', 'backup-0'
    request_count INTEGER DEFAULT 0,
    daily_requests INTEGER DEFAULT 0,
    token_count BIGINT DEFAULT 0,
    last_reset TIMESTAMPTZ DEFAULT NOW(),       -- For minute rate limits
    last_daily_reset TIMESTAMPTZ DEFAULT NOW(), -- For daily quotas
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_api_usage_key_id ON private.api_usage(key_id);

-- Grants
-- Backend connects as anon or service_role. 
-- Assuming anon for now based on other files, or authenticated if signed in.
-- But the backend server generally uses the SUPABASE_URL/KEY from .env which behaves as a client.
-- If the backend uses the SERVICE_ROLE_KEY, it bypasses RLS.
-- If it uses ANON_KEY, we need RLS or Grants.
GRANT SELECT, INSERT, UPDATE ON private.api_usage TO anon, authenticated, service_role;

-- Function to upsert usage stats
CREATE OR REPLACE FUNCTION private.update_api_usage(
    p_key_id TEXT,
    p_request_count INTEGER,
    p_daily_requests INTEGER,
    p_token_count BIGINT,
    p_last_reset TIMESTAMPTZ,
    p_last_daily_reset TIMESTAMPTZ
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO private.api_usage (
        key_id, request_count, daily_requests, token_count, last_reset, last_daily_reset, updated_at
    ) VALUES (
        p_key_id, p_request_count, p_daily_requests, p_token_count, p_last_reset, p_last_daily_reset, NOW()
    )
    ON CONFLICT (key_id) DO UPDATE SET
        request_count = EXCLUDED.request_count,
        daily_requests = EXCLUDED.daily_requests,
        token_count = EXCLUDED.token_count,
        last_reset = EXCLUDED.last_reset,
        last_daily_reset = EXCLUDED.last_daily_reset,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
