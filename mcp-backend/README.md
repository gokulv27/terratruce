# Tera Truce MCP Backend

**Advanced Geospatial AI Microservice for Real Estate Intelligence**

Combines Supabase (PostGIS), Google Gemini AI, Google Calendar, and Resend into a unified Model Context Protocol (MCP) server.

## 🚀 Features

- **Geospatial Intelligence**: Flood risk analysis & parcel data (PostGIS).
- **AI Vision**: Satellite imagery analysis via Gemini 2.0.
- **Web Intelligence**: Real-time web search & deep research.
- **Scheduling**: Automated Google Calendar invites & site visits.
- **Notifications**: Branded HTML emails via Resend.
- **Resiliency**: Intelligent API key rotation & rate limiting.

## 🛠️ Setup Guide

### 1. Prerequisites

- Node.js v20+
- Supabase Project (PostgreSQL + PostGIS)
- Google Cloud Project (Maps, Search, Calendar API)
- Resend Account

### 2. Installation

```bash
git clone <repo>
cd mcp-backend
npm install
```

### 3. Database Setup

Run the SQL script in your Supabase SQL Editor:
`database/setup_database.sql`

## 🔑 API Key Management & Rationing

This system uses a robust **Round-Robin Key Rotation** strategy ("Rationing") to maximize free tier usage and prevent downtime.

### How to Store Keys

Create a `.env` file based on `.env.example`.

#### 1. Gemini AI Keys (The "Rationing" Strategy)

Instead of one key, we use a pool of keys. The system automatically rotates through them when one hits a rate limit (429) or quota limit (403).

```bash
# PRIMARY KEY
# Reserved for high-priority, low-cost tasks (like chat)
GEMINI_PRIMARY_KEY=AIzaSyPrimary...|rpm:15|rpd:1500

# BACKUP POOL
# Used for heavy tasks (Vision) or when Primary is exhausted
# Format: key1,key2,key3
GEMINI_BACKUP_KEYS=\
AIzaSyBackup1...|rpm:15|rpd:1500,\
AIzaSyBackup2...|rpm:1000,\
AIzaSyBackup3...
```

**Custom Limits Syntax**: `key|rpm:X|tpm:Y|rpd:Z`

- `rpm`: Requests Per Minute
- `tpm`: Tokens Per Minute
- `rpd`: Requests Per Day

#### 2. Communication Keys

Sensitive keys for external services.

```bash
# Email (Resend)
RESEND_API_KEY=re_123...

# Calendar (Google Service Account)
GOOGLE_SERVICE_ACCOUNT_EMAIL=bot@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### Security Best Practices

1.  **Never commit .env**: It is already in `.gitignore`.
2.  **Use Secrets Manager**: In production (AWS/GCP), inject these as environment variables.
3.  **Least Privilege**: Give the Google Service Account only "Calendar API" access.

## 📅 Tool Usage

### `schedule_site_visit`

Orchestrates the full visiting flow:

1.  **Database**: Logs visit in `geo_core.visits`.
2.  **Calendar**: Creates Google Calendar event + Invites User.
3.  **Email**: Sends HTML confirmation receipt via Resend.

**Input**:

```json
{
  "property_address": "123 Ocean Dr, Mumbai",
  "user_email": "client@example.com",
  "date_time": "2024-05-20T10:00:00Z"
}
```

## 📊 Monitoring (Dev Mode)

Run with `NODE_ENV=development` to unlock the `get_api_usage_stats` tool.

- Tracks requests per key.
- Shows failing keys.
- Resets daily quotas automatically.

---

built with ❤️ for Tera Truce
