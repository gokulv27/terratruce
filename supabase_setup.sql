-- TerraTruce Supabase Database Setup
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. SEARCH HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    location TEXT NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    risk_score INTEGER,
    analysis_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_location ON public.search_history(location);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON public.search_history(created_at DESC);

-- RLS Policies
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own search history"
    ON public.search_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history"
    ON public.search_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history"
    ON public.search_history FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- 2. PORTFOLIO TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.portfolio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    location TEXT NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    risk_score INTEGER,
    analysis_data JSONB,
    notes TEXT,
    tags TEXT[],
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON public.portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_created_at ON public.portfolio(created_at DESC);

-- RLS Policies
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own portfolio"
    ON public.portfolio FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================
-- 3. CACHE ENTRIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cache_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    hit_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cache_entries_key ON public.cache_entries(key);
CREATE INDEX IF NOT EXISTS idx_cache_entries_expires_at ON public.cache_entries(expires_at);

-- RLS Policies (shared cache for all authenticated users)
ALTER TABLE public.cache_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read cache"
    ON public.cache_entries FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can write cache"
    ON public.cache_entries FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 4. PROVIDER METRICS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.provider_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_name TEXT NOT NULL,
    request_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    total_latency_ms BIGINT DEFAULT 0,
    total_tokens BIGINT DEFAULT 0,
    total_cost_usd NUMERIC(10, 4) DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_name, date)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_provider_metrics_date ON public.provider_metrics(date DESC);

-- RLS (read-only for authenticated users)
ALTER TABLE public.provider_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view metrics"
    ON public.provider_metrics FOR SELECT
    USING (auth.role() = 'authenticated');

-- ============================================================
-- 5. API QUOTAS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.api_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_limit INTEGER DEFAULT 100,
    monthly_limit INTEGER DEFAULT 3000,
    current_daily_usage INTEGER DEFAULT 0,
    current_monthly_usage INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.api_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quotas"
    ON public.api_quotas FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_search_history_updated_at 
    BEFORE UPDATE ON public.search_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_updated_at 
    BEFORE UPDATE ON public.portfolio
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cache_entries_updated_at 
    BEFORE UPDATE ON public.cache_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cleanup expired cache function
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM public.cache_entries WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Reset daily quotas function
CREATE OR REPLACE FUNCTION reset_daily_quotas()
RETURNS void AS $$
BEGIN
    UPDATE public.api_quotas 
    SET current_daily_usage = 0, 
        last_reset_date = CURRENT_DATE
    WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- DONE! Tables created successfully
-- ============================================================
