import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Analyze from './pages/Analyze';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';
import Calendar from './pages/Calendar';
import DashboardLayout from './components/Layout/DashboardLayout';
import InvestmentCalculator from './components/Analytics/InvestmentCalculator';
import ErrorBoundary from './components/UI/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { ComparisonProvider } from './context/ComparisonContext';
import { AuthProvider } from './context/AuthContext';
import { AnalysisProvider, useAnalysis } from './context/AnalysisContext';
import { PortfolioProvider } from './context/PortfolioContext';
import Dashboard from './pages/Dashboard';

// Wrap authenticated pages in layout
const MainLayoutWrapper = ({ children }) => {
  return <DashboardLayout>{children}</DashboardLayout>;
};

function AppContent() {
  const { updateAnalysis } = useAnalysis();

  // Geolocation & System Theme Init
  React.useEffect(() => {
    // 1. System Theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e) => {
      if (e.matches) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    };

    // Initial check
    handleThemeChange(mediaQuery);
    mediaQuery.addEventListener('change', handleThemeChange);

    // 2. Geolocation Request
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // Reverse geocode could go here to get state, but storing lat/lng is enough for context for now.
          // We'll update the global context so Chatbot knows "User Location".
          // We might need to fetch address for "Personalized Hot Searches".
          updateAnalysis({ userLocation: { lat: latitude, lng: longitude } });
        },
        (error) => {
          console.warn('Location permission denied. Using default location (NYC).');
          // Fallback to NYC
          updateAnalysis({ userLocation: { lat: 40.7128, lng: -74.006 } });
        }
      );
    }

    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  return (
    <>
      <ErrorBoundary>
        <Routes>
          {/* Public Authentication Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected/App Pages */}
          <Route
            path="/"
            element={
              <MainLayoutWrapper>
                <Home />
              </MainLayoutWrapper>
            }
          />
          <Route
            path="/analyze"
            element={
              <MainLayoutWrapper>
                <Analyze />
              </MainLayoutWrapper>
            }
          />
          <Route
            path="/market"
            element={
              <MainLayoutWrapper>
                <div className="h-full overflow-y-auto custom-scrollbar p-2">
                  <InvestmentCalculator />
                </div>
              </MainLayoutWrapper>
            }
          />
          <Route
            path="/dashboard"
            element={
              <MainLayoutWrapper>
                <Dashboard />
              </MainLayoutWrapper>
            }
          />
          <Route
            path="/calendar"
            element={
              <MainLayoutWrapper>
                 <div className="h-full overflow-y-auto custom-scrollbar p-6">
                    <Calendar />
                 </div>
              </MainLayoutWrapper>
            }
          />

          {/* 404 Catch-all Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ComparisonProvider>
          <PortfolioProvider>
            <AnalysisProvider>
              <Router>
                <AppContent />
              </Router>
            </AnalysisProvider>
          </PortfolioProvider>
        </ComparisonProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
