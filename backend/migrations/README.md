# Database Migrations Guide

## Overview

This directory contains SQL migration files that define the database structure for TerraTruce.

## Migration Files

### 0001_create_tables.sql

Creates the core database structure:

- `search_history` - Property search history
- `cache_entries` - MCP cache layer
- `provider_metrics` - AI provider usage tracking
- `email_reports` - Email report logs
- `mcp_request_logs` - MCP request monitoring

### 0002_add_mcp_protection.sql

Adds MCP protection and auto-correction features:

- `mcp_protection_rules` - Protection rule configuration
- `mcp_auto_corrections` - Auto-correction logs
- `api_quotas` - API usage limits
- `security_audit_log` - Security event tracking

## Running Migrations

### First Time Setup

```bash
cd backend
sqlx migrate run
```

### Check Migration Status

```bash
sqlx migrate info
```

### Revert Last Migration

```bash
sqlx migrate revert
```

## Adding New Migrations

1. Create new file with incremented number:

   ```bash
   touch migrations/0003_add_new_feature.sql
   ```

2. Write SQL:

   ```sql
   -- Migration 0003: Add new feature
   CREATE TABLE new_table (...);
   ```

3. Run migration:
   ```bash
   sqlx migrate run
   ```

## Best Practices

✅ **DO:**

- Use descriptive migration names
- Include comments explaining changes
- Add indexes for performance
- Use transactions when needed
- Test migrations locally first

❌ **DON'T:**

- Modify existing migrations after deployment
- Skip version numbers
- Delete old migrations
- Run migrations manually in production

## Migration Workflow

```
Local Dev → Test → Staging → Production
   ↓          ↓        ↓          ↓
migrate   migrate  migrate   migrate
  run       run      run       run
```

## Troubleshooting

### Migration Failed

```bash
# Check error
sqlx migrate info

# Revert if needed
sqlx migrate revert

# Fix SQL and retry
sqlx migrate run
```

### Reset Database (DEV ONLY)

```bash
# Drop all tables
sqlx database drop

# Recreate
sqlx database create

# Run all migrations
sqlx migrate run
```

## Integration with MCP

The MCP service uses these tables for:

- **Caching**: `cache_entries` table
- **Metrics**: `provider_metrics` table
- **Protection**: `mcp_protection_rules` table
- **Auto-correction**: `mcp_auto_corrections` table
- **Monitoring**: `mcp_request_logs` table

## Docker Integration

Migrations run automatically in Docker:

```yaml
# docker-compose.yml
backend:
  command: sh -c "sqlx migrate run && ./backend"
```
