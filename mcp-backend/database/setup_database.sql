-- =====================================================
-- Tera Truce: PostGIS Database Setup
-- =====================================================

-- Enable PostGIS extension in dedicated schema
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS geo_core;
CREATE SCHEMA IF NOT EXISTS private;

-- =====================================================
-- GEO_CORE: Spatial Data Tables
-- =====================================================

-- Parcels table with MULTIPOLYGON geometry
CREATE TABLE IF NOT EXISTS geo_core.parcels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id VARCHAR(50) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    area_sqm DECIMAL(12, 2),
    geometry GEOGRAPHY(MULTIPOLYGON, 4326) NOT NULL,
    owner_name VARCHAR(255),
    assessed_value DECIMAL(15, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flood zones table with POLYGON geometry
CREATE TABLE IF NOT EXISTS geo_core.flood_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id VARCHAR(50) UNIQUE NOT NULL,
    zone_type VARCHAR(50) NOT NULL, -- e.g., '100-year', '500-year', 'coastal'
    risk_level VARCHAR(20) NOT NULL, -- 'HIGH', 'MODERATE', 'LOW'
    geometry GEOGRAPHY(POLYGON, 4326) NOT NULL,
    source VARCHAR(100), -- e.g., 'FEMA', 'Local Authority'
    effective_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SPATIAL INDEXES (GIST)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_parcels_geometry 
    ON geo_core.parcels USING GIST(geometry);

CREATE INDEX IF NOT EXISTS idx_flood_zones_geometry 
    ON geo_core.flood_zones USING GIST(geometry);

-- Additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_parcels_parcel_id 
    ON geo_core.parcels(parcel_id);

CREATE INDEX IF NOT EXISTS idx_parcels_city 
    ON geo_core.parcels(city);

-- =====================================================
-- PRIVATE: Rate Limiting & Security
-- =====================================================

CREATE TABLE IF NOT EXISTS private.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
    ON private.rate_limits(ip_address, endpoint, window_start);

-- Auto-cleanup old rate limit records (older than 1 hour)
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup 
    ON private.rate_limits(window_start);

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample parcel (Mumbai example)
INSERT INTO geo_core.parcels (parcel_id, address, city, state, zip_code, area_sqm, geometry, assessed_value)
VALUES (
    'MUM-2024-001',
    'Marine Drive, Nariman Point',
    'Mumbai',
    'Maharashtra',
    '400021',
    500.00,
    ST_GeogFromText('MULTIPOLYGON(((72.8234 18.9220, 72.8244 18.9220, 72.8244 18.9210, 72.8234 18.9210, 72.8234 18.9220)))'),
    50000000.00
)
ON CONFLICT (parcel_id) DO NOTHING;

-- Insert sample flood zone
INSERT INTO geo_core.flood_zones (zone_id, zone_type, risk_level, geometry, source)
VALUES (
    'FZ-MUM-001',
    'coastal',
    'HIGH',
    ST_GeogFromText('POLYGON((72.8200 18.9200, 72.8300 18.9200, 72.8300 18.9100, 72.8200 18.9100, 72.8200 18.9200))'),
    'Municipal Corporation'
)
ON CONFLICT (zone_id) DO NOTHING;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate flood risk for a parcel
CREATE OR REPLACE FUNCTION geo_core.calculate_flood_risk(parcel_geom GEOGRAPHY)
RETURNS TABLE(zone_type VARCHAR, risk_level VARCHAR, overlap_area_sqm DECIMAL) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fz.zone_type,
        fz.risk_level,
        ST_Area(ST_Intersection(parcel_geom, fz.geometry))::DECIMAL(12, 2) as overlap_area_sqm
    FROM geo_core.flood_zones fz
    WHERE ST_Intersects(parcel_geom, fz.geometry)
    ORDER BY 
        CASE fz.risk_level
            WHEN 'HIGH' THEN 1
            WHEN 'MODERATE' THEN 2
            WHEN 'LOW' THEN 3
        END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANTS (Adjust based on your Supabase roles)
-- =====================================================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA geo_core TO authenticated, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

-- Grant select on tables
GRANT SELECT ON geo_core.parcels TO authenticated, anon;
GRANT SELECT ON geo_core.flood_zones TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON private.rate_limits TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION geo_core.calculate_flood_risk TO authenticated, anon;
