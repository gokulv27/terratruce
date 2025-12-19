# Tera Truce 🏡✨
> **AI-Powered Real Estate Risk Intelligence Platform**

Tera Truce is a next-generation property intelligence dashboard that leverages Artificial Intelligence to analyze location risks, forecast financial appreciation, and provide legal red-flag checks for real estate assets. It bridges the gap between complex market data and actionable investment insights using a modern, reactive stack.

![Status](https://img.shields.io/badge/Status-Active-success)
![Framework](https://img.shields.io/badge/Framework-React%2019-blue)
![Build](https://img.shields.io/badge/Build-Vite%207-purple)
![Database](https://img.shields.io/badge/Database-Supabase-green)

---

## 🏗️ Architecture

Tera Truce is built as a highly optimized **Single Page Application (SPA)**. It prioritizes client-side performance using **Vite** and **React 19**, while offloading complex logic to serverless APIs and AI models.

### Tech Stack Deep Dive

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Core** | **React 19** | `^19.2.0` | Latest React features including Concurrent Mode and Server Components readiness. |
| **Build Tool** | **Vite** | `^7.2.4` | Next-generation frontend tooling for instant HMR and optimized builds. |
| **Design System** | **Tailwind CSS** | `^3.4.17` | Utility-first CSS framework with a custom glassmorphism theme config. |
| **Animation** | **GSAP** & **Framer Motion** | `^3.14` / `^12.23` | High-performance timeline animations (GSAP) and layout transitions (Framer). |
| **Charting** | **Recharts** | `^3.6.0` | Composable React charts for financial data visualization. |
| **Mapping** | **Google Maps (React)** | `^1.7.1` | Interactive risk maps with custom overlays and markers. |
| **AI / Logic** | **Gemini AI SDK** | `^0.24.1` | Generative AI for risk explanation and market insights. |
| **Backend** | **Supabase** | `v2` | Postgres Database, Authentication, and Real-time subscriptions. |

---

## 📂 Project Structure

The codebase is organized for scalability, separating UI components from business logic and state.

```
Tera-Truce/
├── requirements.txt      # System & API prerequisites
├── README.md             # This documentation
└── client/               # Main Application
    ├── src/
    │   ├── components/
    │   │   ├── Analytics/   # Investment Calculator, Financial Charts
    │   │   ├── Map/         # Google Maps Integration
    │   │   ├── Onboarding/  # Tutorials & Walkthroughs
    │   │   └── Layout/      # Dashboard Shell & Navigation
    │   ├── context/         # React Context (Auth, Theme, Portfolio)
    │   ├── pages/           # High-level Routes (Analyze, Dashboard)
    │   ├── services/        # Supabase & AI API wrappers
    │   └── styles/          # Global styles & Map Themes
    ├── .env                 # Secrets (ignored by git)
    └── package.json         # Dependency Manifest
```

---

## 🚀 Core Features

### 1. 🛡️ AI Risk Engine
- **Multi-Factor Analysis**: Aggregates Flood Zones, Crime Rates, Pollution Levels, and Infrastructure Growth data.
- **Contextual Insights**: Uses **Google Gemini** to process raw data into human-readable risk reports (e.g., "High flood risk due to proximity to riverbed").

### 2. 🧮 Investment Projector
- **Financial Modeling**: Calculates **ROI**, **Cash-on-Cash Return**, and **Net Operating Income (NOI)**.
- **Dynamic Charts**: Interactive graphs showing 30-year projections with adjustable variables (Appreciation, Inflation).

### 3. 📊 Smart Dashboard
- **Portfolio Tracking**: Real-time view of all saved assets with aggregated net worth.
- **Currency Support**: Auto-detects region (INR/USD/EUR) but allows manual override.
- **Dark Mode**: Fully responsive, theme-aware UI (System/Light/Dark).

## 🛠️ Setup & Usage

### Prerequisites
- Node.js (v18 or higher)
- NPM (v9 or higher)

### Installation

1.  **Navigate to the Client Directory**:
    ```bash
    cd client
    ```
    > **Important**: The root of the active code is inside the `client` folder.

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Configuration**:
    Create a `.env` file in the `client/` directory. Copy the structure below:
    ```env
    # Supabase (Database & Auth)
    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key

    # Google Cloud (Maps & AI)
    VITE_GOOGLE_MAPS_API_KEY=your_maps_key
    VITE_GEMINI_API_KEY=your_gemini_key
    ```

4.  **Start Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:5173](http://localhost:5173) in your browser.

### Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the local dev server with HMR. |
| `npm run build` | Compiles the app for production (dist folder). |
| `npm run preview` | Locally preview the production build. |
| `npm run lint` | Runs ESLint to check for code quality issues. |

---

## ❓ Troubleshooting

**Q: The Map is not loading (Gray/Blank box).**
*   **A**: Check your `.env` file. Ensure `VITE_GOOGLE_MAPS_API_KEY` is set and has "Maps JavaScript API" enabled in Google Cloud Console.

**Q: "ReferenceError" or White Screen.**
*   **A**: Ensure you are running Node v18+. Delete `node_modules` and run `npm install` again.

**Q: Charts look broken in Dark Mode.**
*   **A**: Refresh the page. The charts listen to system theme changes. We use CSS variables (`--text-primary`) to adapt colors dynamically.

---

## 🤝 Contribution

Contributions are welcome!
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/NewFeature`).
3.  Commit changes (`git commit -m 'Add NewFeature'`).
4.  Push to branch (`git push origin feature/NewFeature`).
5.  Open a Pull Request.

---
*Built with ❤️ by the Tera Truce Team.*
