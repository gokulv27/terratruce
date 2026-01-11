-- =====================================================
-- VISITS SCHEDULING TABLE
-- =====================================================

CREATE SCHEMA IF NOT EXISTS geo_core;

CREATE TABLE IF NOT EXISTS geo_core.visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_address TEXT NOT NULL,
    user_email TEXT NOT NULL,
    visit_time TIMESTAMPTZ NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying visits by user
CREATE INDEX IF NOT EXISTS idx_visits_user_email ON geo_core.visits(user_email);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON geo_core.visits TO anon, authenticated, service_role;
