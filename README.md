<div align="center">

# 🏡 Terra Truce ✨

### AI-Powered Real Estate Risk Intelligence Platform

*Next-generation property intelligence leveraging concurrent Rust microservices, AI Model Context Protocol (MCP), and specialized ML services for real-time location risk analysis, legal red-flag detection, and financial forecasting.*

[![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)](https://github.com)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Rust](https://img.shields.io/badge/Rust-2024-orange?style=for-the-badge&logo=rust)](https://www.rust-lang.org)
[![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-AGPL--3.0-blue?style=for-the-badge)](LICENSE)

[Features](#-core-features) • [Architecture](#️-system-architecture) • [Setup](#-quick-start) • [Documentation](#-project-structure) • [Contributing](#-contributing)

</div>

---

## 🎯 Overview

**Terra Truce** transforms complex real estate data into actionable intelligence. Our platform combines:

- 🛡️ **Real-time Risk Analysis** - Multi-factor location assessment (flood zones, crime, pollution, infrastructure)
- 🧮 **Financial Forecasting** - 30-year ROI projections using XGBoost ML models
- ⚖️ **Legal Intelligence** - AI-powered red-flag detection in property documents
- 📊 **Portfolio Management** - Real-time tracking with currency-aware analytics

Built for **extreme concurrency** and **memory safety**, Terra Truce leverages Rust's performance guarantees alongside cutting-edge AI orchestration.

---

## 🏗️ System Architecture

Terra Truce employs a **high-availability microservices architecture** designed for scalability and resilience:

```mermaid
graph TB
    subgraph "Client Layer"
        A[React 19 SPA<br/>Vite + Tailwind]
    end
    
    subgraph "Gateway Layer"
        B[Rust Backend<br/>Axum API Gateway]
    end
    
    subgraph "AI Orchestration"
        C[AI-MCP<br/>Rust Orchestrator]
        D[MCP Backend<br/>Node.js Services]
    end
    
    subgraph "AI Services"
        E[Embedder<br/>Python Vector DB]
        F[Ensembler<br/>Node.js Aggregator]
        G[XBooster<br/>Python ML Forecaster]
    end
    
    subgraph "External AI"
        H[Gemini 3 Pro]
        I[Perplexity API]
    end
    
    subgraph "Data Layer"
        K[(Supabase<br/>PostgreSQL)]
        L[(Redis Cache)]
    end
    
    A -->|REST/WebSocket| B
    B --> C
    C --> D
    C --> H & I & J
    D --> E & F & G
    B --> K
    C --> L
    
    style A fill:#61dafb,stroke:#333,stroke-width:2px,color:#000
    style B fill:#f74c00,stroke:#333,stroke-width:2px
    style C fill:#f74c00,stroke:#333,stroke-width:2px
    style D fill:#68a063,stroke:#333,stroke-width:2px
    style E fill:#3776ab,stroke:#333,stroke-width:2px
    style F fill:#68a063,stroke:#333,stroke-width:2px
    style G fill:#3776ab,stroke:#333,stroke-width:2px
```

### 🔧 Technology Stack

<table>
<tr>
<td width="50%">

#### **Frontend**
| Technology | Version | Purpose |
|:-----------|:--------|:--------|
| **React** | 19.2.0 | Concurrent rendering & Server Components |
| **Vite** | 7.2.4 | Lightning-fast HMR & optimized builds |
| **Tailwind CSS** | 3.4.17 | Utility-first styling with glassmorphism |
| **GSAP** | 3.14.2 | High-performance timeline animations |
| **Framer Motion** | 12.23.26 | Declarative layout transitions |
| **Recharts** | 3.6.0 | Composable financial data visualization |

</td>
<td width="50%">

#### **Backend & AI**
| Technology | Version | Purpose |
|:-----------|:--------|:--------|
| **Rust (Backend)** | 2024 | High-concurrency API gateway (Axum) |
| **Rust (AI-MCP)** | 2021 | Multi-provider AI orchestration |
| **Node.js (MCP)** | - | Service coordination & email |
| **Python** | 3.10+ | ML models (XGBoost, embeddings) |
| **Supabase** | v2 | PostgreSQL + Auth + Realtime |
| **Redis** | 0.24 | Response caching & rate limiting |

</td>
</tr>
</table>

#### **AI & Intelligence Layer**

| Service | Technology | Role |
|:--------|:-----------|:-----|
| **AI-MCP** | Rust (Axum) | High-concurrency provider management with built-in caching |
| **Gemini 3 Pro** | Google AI | Multi-modal synthesis & legal red-flag analysis |
| **Perplexity API** | Live Web Crawl | Real-time local news & emerging risk factors |
| **XBooster** | Python (XGBoost) | Precision 30-year property appreciation forecasting |
| **Embedder** | Python | Vector embeddings for semantic property search |
| **Ensembler** | Node.js | Data synthesis & logic aggregation |

---

## 📂 Project Structure

```
Terra-Truce/
├── 📱 client/                    # React 19 Frontend (Primary App)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Analytics/        # Investment Calculator, ROI Charts
│   │   │   ├── Map/              # Google Maps Risk Overlays
│   │   │   ├── Onboarding/       # User Tutorials & Walkthroughs
│   │   │   └── Layout/           # Dashboard Shell & Navigation
│   │   ├── context/              # React Context (Auth, Theme, Portfolio)
│   │   ├── pages/                # Route Components (Home, Dashboard, Analyze)
│   │   ├── services/             # API Wrappers (Supabase, AI, Geocoding)
│   │   └── styles/               # Global CSS & Map Themes
│   ├── .env                      # Environment Variables (gitignored)
│   └── package.json              # Dependencies & Scripts
│
├── 🦀 backend/                   # Rust API Gateway
│   ├── src/
│   │   ├── routes/               # api_proxy.rs, ai_chat.rs
│   │   ├── models/               # Database schemas
│   │   └── main.rs               # Axum server entry point
│   └── Cargo.toml                # Rust dependencies
│
├── 🤖 ai-mcp/                    # AI Model Context Protocol (Rust)
│   ├── src/
│   │   ├── providers/            # gemini.rs, perplexity.rs, openai.rs
│   │   ├── cache.rs              # Redis-backed response caching
│   │   └── email.rs              # Alert & notification services
│   └── Cargo.toml
│
├── 🧠 ai-services/               # Specialized AI Workers
│   ├── embedder/                 # Python - Vector embeddings
│   ├── ensembler/                # Node.js - Data aggregation
│   └── xbooster/                 # Python - Financial ML forecasting
│
├── 🔌 mcp-backend/               # MCP Node.js Backend
│   ├── src/                      # Service orchestration
│   └── package.json
│
├── 📄 requirements.txt           # Python dependencies
├── 📜 LICENSE                    # AGPL-3.0 License
└── 📖 README.md                  # This file
```

---

## ⚡ Core Features

### 1. 🛡️ Multi-Factor Risk Engine

- **Comprehensive Analysis**: Aggregates flood zones, crime statistics, air quality, and infrastructure development
- **AI-Powered Insights**: Gemini 3 Pro processes raw data into human-readable risk narratives
- **Real-time Updates**: Perplexity API crawls current local news for emerging risk factors
- **Interactive Maps**: Google Maps integration with custom risk heat overlays

### 2. 🧮 Investment Intelligence

- **Financial Modeling**: Calculates ROI, Cash-on-Cash Return, Net Operating Income (NOI)
- **30-Year Projections**: XGBoost ML models trained on historical appreciation data
- **Dynamic Scenarios**: Adjustable variables (appreciation rate, inflation, rental yield)
- **Interactive Charts**: Recharts-powered visualizations with drill-down capabilities

### 3. 📊 Smart Portfolio Dashboard

- **Real-time Tracking**: Live updates via Supabase real-time subscriptions
- **Multi-Currency Support**: Auto-detection with manual override (INR/USD/EUR/GBP)
- **Dark Mode**: Fully responsive, theme-aware UI (System/Light/Dark)
- **Export & Reporting**: PDF generation for investment reports

### 4. ⚖️ Legal Red-Flag Detection

- **Document Analysis**: AI-powered scanning of property documents
- **PII Protection**: Advanced privacy safeguards that redact personal information (names, IDs, financial data) and extract only location-relevant data from OCR documents
- **Compliance Checks**: Automated verification against local regulations
- **Risk Scoring**: Weighted assessment of legal vulnerabilities

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:

- **Node.js** v18+ ([Download](https://nodejs.org))
- **Rust** (Latest Stable) ([Install](https://rustup.rs))
- **Python** 3.10+ ([Download](https://python.org))
- **Docker** (for AI services) ([Install](https://docker.com))

### Installation

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/gokulv27/terratruce.git
cd terratruce
```

#### 2️⃣ Start AI Services (Docker)

```bash
cd ai-services
docker-compose up --build -d
```

This launches:
- **Embedder** (Python) on port `5001`
- **Ensembler** (Node.js) on port `5002`
- **XBooster** (Python) on port `5003`

#### 3️⃣ Start AI-MCP Orchestrator (Rust)

```bash
cd ../ai-mcp
cargo run --release
```

Runs on `http://localhost:8001`

#### 4️⃣ Start Backend Gateway (Rust)

```bash
cd ../backend
cargo run --release
```

Runs on `http://localhost:8000`

#### 5️⃣ Start MCP Backend (Node.js)

```bash
cd ../mcp-backend
npm install
npm start
```

Runs on `http://localhost:3001`

#### 6️⃣ Start Frontend (React)

```bash
cd ../client
npm install
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser 🎉

### Environment Configuration

Create `.env` files in the respective directories:

#### **client/.env**

```env
# Supabase (Database & Auth)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google Cloud (Maps & AI)
VITE_GOOGLE_MAPS_API_KEY=your_maps_key
VITE_GEMINI_API_KEY=your_gemini_key
```

#### **backend/.env**

```env
DATABASE_URL=postgresql://user:password@localhost:5432/terratruce
RUST_LOG=info
```

#### **ai-mcp/.env**

```env
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_gemini_key
PERPLEXITY_API_KEY=your_perplexity_key
```

#### **mcp-backend/.env**

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 📜 Available Scripts

### Frontend (client/)

| Command | Description |
|:--------|:------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Production build (optimized bundle) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint code quality checks |
| `npm run format` | Format code with Prettier |

### Backend (backend/ & ai-mcp/)

| Command | Description |
|:--------|:------------|
| `cargo run` | Start development server |
| `cargo run --release` | Start optimized production server |
| `cargo build` | Compile project |
| `cargo test` | Run test suite |

### AI Services (ai-services/)

| Command | Description |
|:--------|:------------|
| `docker-compose up` | Start all AI services |
| `docker-compose down` | Stop all services |
| `docker-compose logs -f` | View live logs |

---

## ❓ Troubleshooting

<details>
<summary><b>Map not loading (Gray/Blank box)</b></summary>

**Solution**: 
1. Verify `VITE_GOOGLE_MAPS_API_KEY` in `client/.env`
2. Enable "Maps JavaScript API" in Google Cloud Console
3. Check browser console for API key errors
</details>

<details>
<summary><b>ReferenceError or White Screen</b></summary>

**Solution**:
1. Ensure Node.js v18+ is installed: `node --version`
2. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
</details>

<details>
<summary><b>Charts broken in Dark Mode</b></summary>

**Solution**: 
- Refresh the page. Charts use CSS variables (`--text-primary`) for theme adaptation
- Clear browser cache if issue persists
</details>

<details>
<summary><b>Rust compilation errors</b></summary>

**Solution**:
1. Update Rust: `rustup update`
2. Clean build artifacts: `cargo clean`
3. Rebuild: `cargo build --release`
</details>

<details>
<summary><b>AI services not responding</b></summary>

**Solution**:
1. Check Docker containers: `docker ps`
2. View logs: `docker-compose logs -f`
3. Restart services: `docker-compose restart`
</details>

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch:
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit** your changes:
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push** to the branch:
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style (ESLint/Prettier for JS, `rustfmt` for Rust)
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

---

## ⚖️ License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

> Permissions of this strongest copyleft license are conditioned on making available complete source code of licensed works and modifications, which include larger works using a licensed work, under the same license. Copyright and license notices must be preserved. Contributors provide an express grant of patent rights. **When a modified version is used to provide a service over a network, the complete source code of the modified version must be made available.**

See [LICENSE](LICENSE) for full details.

---

## 🙏 Acknowledgments

- **Google Gemini** for advanced AI capabilities
- **Perplexity AI** for real-time web intelligence
- **Supabase** for seamless backend infrastructure
- **Rust Community** for exceptional tooling and support

---

<div align="center">

### Built with ❤️ by the Terra Truce Team

**[Documentation](#)** • **[Report Bug](https://github.com/yourusername/terra-truce/issues)** • **[Request Feature](https://github.com/yourusername/terra-truce/issues)**

⭐ **Star us on GitHub** if you find this project useful!

</div>
