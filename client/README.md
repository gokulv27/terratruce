# Tera Truce - AI-Powered Real Estate Risk Intelligence

Tera Truce is a next-generation property intelligence platform that uses AI to analyze location risks, calculate financial appreciation, and provide legal insights for real estate investments in India.

## Key Features

### 1. 🛡️ AI Risk Analysis
- **Comprehensive Reports**: Generates detailed risk profiles including flood zones, crime heatmaps, environmental hazards, and rapid urban growth metrics.
- **Smart Insights**: Uses LLM-powered context to explain *why* a location is risky or promising.
- **Document Scanning**: Upload property documents (PDF/Images) to automatically extract addresses and flag potential legal red flags (OCR + PII Redaction).

### 2. 📊 Personal Dashboard
- **Portfolio Tracking**: Monitor your real estate assets, monthly revenue, and overall portfolio performance.
- **Saved Investments**: Easily save and revisit properties of interest for future analysis.

### 3. 🧮 Smart Investment Calculator
- **ROI Projector**: Calculate Cash-on-Cash Return, Monthly Cash Flow, and Equity Buildup.
- **Auto-Estimation**: Automatically correlates Location Risk Score to Appreciation Rates and Interest Rates (e.g., Higher Risk = Higher projected rates).
- **Customizable Forecasts**: Adjust projection timelines (5-30 years) and visualize property equity growth with interactive charts.
- **Direct Search**: Search for new locations directly within the calculator for instant analysis.

### 3. 🌐 Aesthetic & Interactive UI
- **Dual-Theme Design**: 
    - **Light Mode**: "Aesthetic Blue" (Sky/Cyan/Ocean) for a fresh, professional look.
    - **Dark Mode**: "Premium Cyber" (Slate/Violet) for a sleek, high-contrast night experience.
- **Interactive Home Page**: Features live "Trending Searches", a visual "Market Ticker", and an abstract "Risk Pulse" map.
- **Micro-Interactions**: Smooth GSAP animations for cards, graphs, and page transitions.

### 4. 📜 Search History & Comparison
- **Smart History**: Automatically logs searches with their calculated Risk Scores.
- **Sidebar Access**: "Recent History" is always accessible for quick navigation.
- **Quick Actions**: 
    - **Compare**: Re-analyze a past location instantly.
    - **Calc ROI**: Port a past location's data directly to the Investment Calculator.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS
- **Visualization**: Recharts, GSAP (Animations)
- **AI & Data**: OpenCage (Geocoding), Supabase (Database & Auth), Perplexity API (Chatbot/Context)
- **Icons**: Lucide React

## Getting Started

1.  **Install Dependencies**: `npm install`
2.  **Environment Setup**: Create a `.env` file with:
    - `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`
    - `VITE_OPENCAGE_API_KEY`
    - `VITE_PERPLEXITY_API_KEY`
3.  **Run Development Server**: `npm run dev`

## Recent Updates
- **Overhauled Home Page**: Replaced standard widgets with a "Command Card" layout.
- **Blue Theme**: Introduced a vibrant "Sky Blue" palette for better aesthetics.
- **Risk-to-ROI Pipeline**: Seamlessly move from analyzing risk to calculating profit.
