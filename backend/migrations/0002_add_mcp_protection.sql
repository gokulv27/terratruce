-- Migration 0002: Add MCP protection and auto-correction features

-- MCP protection rules table
CREATE TABLE IF NOT EXISTS mcp_protection_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name TEXT UNIQUE NOT NULL,
    rule_type TEXT NOT NULL, -- 'rate_limit', 'cost_limit', 'validation', 'auto_correct'
    config JSONB NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MCP auto-correction logs
CREATE TABLE IF NOT EXISTS mcp_auto_corrections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL,
    original_query TEXT NOT NULL,
    corrected_query TEXT NOT NULL,
    correction_type TEXT NOT NULL, -- 'spelling', 'format', 'validation', 'enhancement'
    confidence NUMERIC(3, 2),
    applied BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API usage quotas per user/key
CREATE TABLE IF NOT EXISTS api_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key TEXT UNIQUE NOT NULL,
    daily_limit INTEGER DEFAULT 1000,
    monthly_limit INTEGER DEFAULT 30000,
    current_daily_usage INTEGER DEFAULT 0,
    current_monthly_usage INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security audit log
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL, -- 'blocked_request', 'rate_limit', 'invalid_input', 'suspicious_activity'
    ip_address TEXT,
    user_agent TEXT,
    request_path TEXT,
    details JSONB,
    severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default protection rules
INSERT INTO mcp_protection_rules (rule_name, rule_type, config) VALUES
('rate_limit_per_ip', 'rate_limit', '{"max_requests": 100, "window_seconds": 60}'),
('daily_cost_limit', 'cost_limit', '{"max_cost_usd": 10.0, "period": "daily"}'),
('query_validation', 'validation', '{"min_length": 3, "max_length": 500, "allowed_chars": "alphanumeric_spaces"}'),
('auto_spell_check', 'auto_correct', '{"enabled": true, "confidence_threshold": 0.8}')
ON CONFLICT (rule_name) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_auto_corrections_request_id ON mcp_auto_corrections(request_id);
CREATE INDEX IF NOT EXISTS idx_auto_corrections_created_at ON mcp_auto_corrections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_quotas_key ON api_quotas(api_key);
CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_severity ON security_audit_log(severity);

-- Update triggers
CREATE TRIGGER update_mcp_protection_rules_updated_at BEFORE UPDATE ON mcp_protection_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_quotas_updated_at BEFORE UPDATE ON api_quotas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
