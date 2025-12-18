# Tera Truce 🏡✨
> **AI-Powered Real Estate Risk Intelligence Platform**

Tera Truce is a next-generation property intelligence dashboard that leverages Artificial Intelligence to analyze location risks, forecast financial appreciation, and provide legal red-flag checks for real estate assets. It bridges the gap between complex market data and actionable investment insights.

![Status](https://img.shields.io/badge/Status-Active-success)
![Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Supabase-blue)

## 🏗️ Architecture

Tera Truce is built as a modern **Single Page Application (SPA)** using the **Vite + React** ecosystem, focused on speed, interactivity, and modular state management.

### High-Level Overview
- **Frontend Core**: React 18 with Vite for lightning-fast HMR and builds.
- **Styling System**: Tailwind CSS for utility-first styling with a custom "Glassmorphism" design system defined in `tailwind.config.js`.
- **State Management**: React Context API (`/src/context`) is used for global state to avoid prop-drilling:
  - `AuthContext`: Manages Supabase sessions and user profiles.
  - `ThemeContext`: Handles Light/Dark mode transitions.
  - `PortfolioContext`: Manages user investments and optimism UI updates.
  - `AnalysisContext`: Stores active search sessions and risk reports.
- **Routing**: `react-router-dom` v6 with protected routes for the Dashboard.

### Integrations & Services
| Service | Purpose |
| :--- | :--- |
| **Supabase** | Authentication (Email/Magic Link) & PostgreSQL Database for user portfolios. |
| **OpenCage API** | Geocoding services to convert text addresses to Lat/Long coordinates. |
| **Google Gemini / Perplexity** | The "Brain" of the platform. Used to generate summaries, explain risk scores, and answer chat queries. |
| **Recharts** | Rendering complex financial projection charts and risk heatmaps. |

## 📂 Project Structure

```
client/
├── public/              # Static assets (favicons, manifest)
├── src/
│   ├── assets/          # Images and global static files
│   ├── components/      # Reusable UI Components
│   │   ├── Analytics/   # Charts & Calculators
│   │   ├── Layout/      # Sidebar, Navbar, Page Wrappers
│   │   ├── Onboarding/  # Tutorial & Welcome flows
│   │   └── Shared/      # Buttons, Inputs, Cards
│   ├── context/         # Global State Definitions
│   ├── hooks/           # Custom React Hooks
│   ├── pages/           # Main Route Views (Dashboard, Home, Market)
│   ├── services/        # API Service Layers (Supabase, External APIs)
│   └── utils/           # Helper functions (Currency formatting, Date logic)
├── .env                 # Environment secrets (Not committed)
└── package.json         # Dependency manifest
```

## 🚀 Key Features

### 1. 🛡️ AI Risk Engine
- **Multi-Factor Analysis**: Aggregates Flood Zones, Crime Rates, Pollution Levels, and Infrastructure Growth.
- **Contextual Insights**: Uses LLMs to explain *why* a location has a specific score (e.g., "High flood risk due to proximity to Yamuna riverbed").

### 2. 🧮 Investment Projector
- **Financial Modeling**: Calculates ROI, Cash-on-Cash Return, and Net Operating Income.
- **Smart Projections**: Uses linear interpolation models to forecast property value over 5-30 years alongside equity buildup.

### 3. 📊 Interactive Dashboard
- **Portfolio Tracking**: Real-time view of all saved assets with aggregated net worth.
- **Guest Mode**: Allows users to try features (like adding investments) without forcing immediate signup, using local state persistence.

## 🛠️ Setup & Installation

Follow these steps to run Tera Truce locally.

### Prerequisites
- Node.js (v18+)
- NPM or Yarn

### Installation
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/tera-truce.git
    cd tera-truce/client
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment**:
    Create a `.env` file in the `client/` root and add the following keys:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_key
    VITE_OPENCAGE_API_KEY=your_opencage_key
    VITE_GEMINI_API_KEY=your_gemini_key
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:5173`.

## 🤝 Contribution
Contributions are welcome! Please fork the repo and submit a Pull Request. ensure linting passes before submission.

---
*Built with ❤️ by the Tera Truce Team.*
