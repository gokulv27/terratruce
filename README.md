# TerraTruce - Real Estate Risk Intelligence Platform

## 🏗️ Project Structure

```
terratruce/
├── frontend/          # React frontend (Vite + Tailwind)
├── backend/           # Rust backend (Axum + PostgreSQL)
├── ai-mcp/            # AI Model Control Proxy (Rust)
├── ai-services/       # AI microservices
│   ├── embedder/      # Text embeddings (Python)
│   ├── xbooster/      # Local LLM (Python)
│   └── ensembler/     # Response aggregation (Node.js)
└── docker-compose.yml # All services orchestration
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- Rust 1.75+ (for backend development)
- Python 3.11+ (for AI services development)

### 1. Clone Repository

```bash
git clone <repository-url>
cd terratruce
```

### 2. Environment Setup

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# AI-MCP
cp ai-mcp/.env.example ai-mcp/.env
# Edit ai-mcp/.env with API keys
```

### 3. Start All Services

```bash
docker-compose up -d
```

### 4. Run Migrations

```bash
cd backend
sqlx migrate run
```

### 5. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **AI-MCP**: http://localhost:3001
- **Embedder**: http://localhost:8001
- **XBooster**: http://localhost:8002
- **Ensembler**: http://localhost:3002

## 📦 Components

### Frontend (React)

- **Location**: `frontend/`
- **Tech**: React, Vite, Tailwind CSS, Leaflet
- **Port**: 5173

### Backend (Rust)

- **Location**: `backend/`
- **Tech**: Axum, SQLx, PostgreSQL
- **Port**: 3000
- **Features**: API routes, database, email reports

### AI-MCP (Model Control Proxy)

- **Location**: `ai-mcp/`
- **Tech**: Rust, Axum, Redis
- **Port**: 3001
- **Features**:
  - Decision engine
  - Two-tier caching
  - Provider orchestration
  - Cost tracking

### AI Services

- **Embedder** (Port 8001): Text embeddings using sentence-transformers
- **XBooster** (Port 8002): Local LLM fallback
- **Ensembler** (Port 3002): Response aggregation

## 🗄️ Database

### PostgreSQL Tables

- `search_history` - Property searches
- `cache_entries` - MCP cache
- `provider_metrics` - AI usage tracking
- `email_reports` - Email logs
- `mcp_request_logs` - Request monitoring
- `mcp_protection_rules` - Protection config
- `mcp_auto_corrections` - Auto-fix logs
- `api_quotas` - Usage limits
- `security_audit_log` - Security events

### Redis

- Short-term cache (1 hour TTL)
- Rate limiting
- Session management

### Qdrant

- Vector database for semantic search
- Embedding storage

## 🔧 Development

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Backend Development

```bash
cd backend
cargo run
```

### AI-MCP Development

```bash
cd ai-mcp
cargo run
```

### AI Services Development

```bash
# Embedder
cd ai-services/embedder
pip install -r requirements.txt
python main.py

# XBooster
cd ai-services/xbooster
pip install -r requirements.txt
python main.py

# Ensembler
cd ai-services/ensembler
npm install
npm start
```

## 📊 API Endpoints

### Backend

- `GET /health` - Health check
- `POST /api/search` - Create search
- `GET /api/search` - Get search history
- `POST /api/chat` - AI chat
- `POST /api/report/email` - Send email report

### AI-MCP

- `POST /api/mcp/analyze` - Property analysis (direct)
- `POST /api/protected/analyze` - Protected analysis (with auto-correction)
- `GET /api/mcp/metrics` - Provider metrics
- `GET /api/mcp/model-card` - Model performance

## 🛡️ MCP Protection Features

- ✅ Input validation (3-500 chars)
- ✅ Auto-correction (whitespace, formatting)
- ✅ Rate limiting
- ✅ Cost tracking
- ✅ Security auditing

## 📧 Email Service

Configured with Gmail SMTP:

- Test: `python3 test_email.py`
- See `EMAIL_TESTING.md` for details

## 🐳 Docker Services

| Service    | Port | Purpose     |
| ---------- | ---- | ----------- |
| Frontend   | 5173 | React UI    |
| Backend    | 3000 | API server  |
| AI-MCP     | 3001 | Model proxy |
| Embedder   | 8001 | Embeddings  |
| XBooster   | 8002 | Local LLM   |
| Ensembler  | 3002 | Aggregation |
| PostgreSQL | 5432 | Database    |
| Redis      | 6379 | Cache       |
| Qdrant     | 6333 | Vector DB   |

## 🔐 Environment Variables

### Backend (.env)

```env
DATABASE_URL=postgresql://...
SMTP_HOST=smtp.gmail.com
SMTP_USERNAME=your-email
SMTP_PASSWORD=your-app-password
```

### AI-MCP (.env)

```env
PERPLEXITY_API_KEY=...
GEMINI_API_KEY=...
OPENAI_API_KEY=...
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

## 📝 Documentation

- `backend/migrations/README.md` - Database migrations
- `EMAIL_TESTING.md` - Email testing guide
- `MCP_README.md` - MCP architecture
- `DEPLOYMENT_SUMMARY.md` - Deployment guide

## 🧪 Testing

```bash
# Test email service
python3 test_email.py

# Test AI-MCP
curl http://localhost:3001/health

# Test protected endpoint
curl -X POST http://localhost:3000/api/protected/analyze \
  -H "Content-Type: application/json" \
  -d '{"location": "San Francisco"}'
```

## 🚀 Deployment

1. Set environment variables
2. Run migrations: `cd backend && sqlx migrate run`
3. Start services: `docker-compose up -d`
4. Verify: Check all health endpoints

## 📄 License

MIT License

---

**Built with ❤️ for intelligent real estate analysis**
