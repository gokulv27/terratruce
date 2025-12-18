
import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, Globe, Shield, Sun, Moon, LogOut, User, Calculator, Clock, ArrowRightLeft, TrendingUp, Search, RefreshCw } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Chatbot from '../Chat/Chatbot';
import { useAnalysis } from '../../context/AnalysisContext';

const SidebarItem = ({ icon: Icon, label, to, active }) => (
    <Link
        to={to}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${active
            ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg shadow-brand-primary/20'
            : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/10 hover:text-text-primary'
            } `}
    >
        <Icon className={`h-5 w-5 relative z-10 ${active ? 'text-white' : 'text-text-secondary group-hover:text-text-primary'} `} />
        <span className="font-medium text-sm relative z-10">{label}</span>
    </Link>
);

const DashboardLayout = ({ children }) => {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const { history, clearHistory, fetchHistory } = useAnalysis();

    const handleClearHistory = async () => {
        if (!user) return;
        if (!window.confirm('Clear your search history?')) return;
        await clearHistory();
    };

    const handleRefreshHistory = () => {
        fetchHistory();
    };

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <div className="flex h-screen bg-background text-text-primary overflow-hidden font-sans transition-colors duration-300">
            {/* Tutorial Overlay */}
            <Tutorial />

            {/* Sidebar - Power BI Style */}
            <div className="w-64 bg-surface border-r border-border flex flex-col z-20 shadow-2xl transition-colors duration-300">
                {/* Brand */}
                <div className="p-6 pb-8 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary tracking-tight">
                                TERRA TRUCE
                            </h1>
                            <p className="text-[10px] text-text-secondary font-bold tracking-widest uppercase">Property Intelligence</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
                    <div className="px-4 mb-2 text-xs font-bold text-text-secondary uppercase tracking-widest">Analytics</div>
                    <SidebarItem
                        icon={LayoutDashboard}
                        label="Overview"
                        to="/"
                        active={location.pathname === '/'}
                    />
                    <SidebarItem
                        icon={LayoutDashboard}
                        label="Dashboard"
                        to="/dashboard"
                        active={location.pathname === '/dashboard'}
                    />
                    <SidebarItem
                        icon={Activity}
                        label="Risk Analysis"
                        to="/analyze"
                        active={location.pathname === '/analyze'}
                    />
                    <SidebarItem
                        icon={Calculator}
                        label="Investment Calc"
                        to="/market"
                        active={location.pathname === '/market'}
                    />

                    {/* Recent History Section - Requested Feature */}
                    {/* Recent History Section - Gemini Style */}
                    <div className="mt-8">
                        <div className="px-4 mb-4 text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center justify-between group/total">
                            <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" /> Recent Searches
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleRefreshHistory}
                                    className="p-1 hover:bg-surface-elevated rounded-md transition-colors text-text-secondary hover:text-brand-primary"
                                    title="Refresh History"
                                >
                                    <RefreshCw className="h-3 w-3" />
                                </button>
                                {history.length > 0 && (
                                    <button
                                        onClick={handleClearHistory}
                                        className="opacity-0 group-hover/total:opacity-100 hover:text-red-500 transition-all text-[10px]"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {history.length > 0 ? (
                            <div className="space-y-1.5 px-2">
                                <AnimatePresence mode='popLayout'>
                                    {history.map((item, idx) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="group relative"
                                        >
                                            <button
                                                onClick={() => navigate('/analyze', { state: { query: item.location_name } })}
                                                className="w-full flex flex-col gap-0.5 px-3 py-2.5 rounded-xl hover:bg-surface-elevated transition-all text-left group"
                                            >
                                                <div className="flex items-center justify-between gap-2 overflow-hidden">
                                                    <span
                                                        className="text-xs font-bold text-text-primary group-hover:text-brand-primary truncate transition-colors"
                                                        title={item.location_name}
                                                    >
                                                        {item.location_name}
                                                    </span>
                                                    {item.risk_score !== null && (
                                                        <span className={`text-[10px] font-black shrink-0 ${item.risk_score > 70 ? 'text-red-500' :
                                                            item.risk_score > 40 ? 'text-yellow-500' : 'text-green-500'
                                                            }`}>
                                                            {item.risk_score}%
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] text-text-secondary font-medium">
                                                        {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Search className="h-2.5 w-2.5 text-brand-primary" />
                                                    </div>
                                                </div>
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="px-4 py-6 text-center bg-surface-elevated/20 rounded-xl border border-dashed border-border mx-2">
                                <p className="text-[10px] text-text-secondary font-medium opacity-60 italic">No recent searches</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* User Profile / Footer */}
                <div className="p-4 border-t border-border bg-surface-elevated/50">
                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-surface border border-border mb-3">
                        <div className="flex items-center gap-2 max-w-[140px]">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                {user ? (user.user_metadata?.full_name?.[0] || user.email?.substring(0, 1).toUpperCase()) : <User className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-text-primary truncate" title={user?.email}>
                                    {user ? (user.user_metadata?.full_name || user.email.split('@')[0]) : 'Guest'}
                                </p>
                                <p className="text-xs text-text-secondary truncate">
                                    {user ? 'Pro License' : 'Login Required'}
                                </p>
                            </div>
                        </div>

                        {user ? (
                            <button onClick={handleLogout} className="text-text-secondary hover:text-error transition-colors p-1" title="Sign Out">
                                <LogOut className="h-4 w-4" />
                            </button>
                        ) : (
                            <Link to="/login" className="text-brand-primary hover:text-brand-secondary text-xs font-bold p-1">
                                Login
                            </Link>
                        )}

                    </div>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-background border border-border text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-brand-primary transition-all"
                    >
                        {theme === 'dark' ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
                        <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-background">
                {/* Top Header - Glassmorphism */}
                <header className="h-16 bg-glass border-b border-border flex items-center justify-between px-6 z-10 sticky top-0">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold text-text-primary">
                            {location.pathname === '/' ? 'Executive Overview' :
                                location.pathname === '/analyze' ? 'Risk Intelligence Dashboard' :
                                    location.pathname === '/market' ? 'Investment ROI Calculator' : 'Dashboard'}
                        </h2>
                        <div className="h-4 w-px bg-border"></div>
                        <span className="text-xs text-brand-primary font-medium px-2 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20">
                            Live Data
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-text-secondary font-mono">
                            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </header>

                {/* Animated Page Content */}
                <main className="flex-1 overflow-y-auto relative p-4 scroll-smooth custom-scrollbar">
                    {children}
                    <Chatbot />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
