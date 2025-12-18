import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Analyze from './pages/Analyze';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardLayout from './components/Layout/DashboardLayout';
import { ThemeProvider } from './context/ThemeContext';
import { ComparisonProvider } from './context/ComparisonContext';
import { AuthProvider } from './context/AuthContext';

// Wrap authenticated pages in layout
const MainLayoutWrapper = ({ children }) => {
  return <DashboardLayout>{children}</DashboardLayout>;
};

function AppContent() {
  return (
    <Routes>
      {/* Public Authentication Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected/App Pages */}
      <Route path="/" element={
        <MainLayoutWrapper>
          <Home />
        </MainLayoutWrapper>
      } />
      <Route path="/analyze" element={
        <MainLayoutWrapper>
          <Analyze />
        </MainLayoutWrapper>
      } />
      <Route path="/market" element={
        <MainLayoutWrapper>
          <Analyze />
        </MainLayoutWrapper>
      } />
      {/* Settings removed as requested */}
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ComparisonProvider>
          <Router>
            <AppContent />
          </Router>
        </ComparisonProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
