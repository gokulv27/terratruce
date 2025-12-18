
import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Home, Activity, Calculator, Settings, Menu, X, LogOut, Clock, Search, Briefcase, User, MessageSquare, LayoutDashboard, Shield, Moon, Sun } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Chatbot from '../Chat/Chatbot';
import Tutorial from '../Onboarding/Tutorial';
// ... imports

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
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (user) {
            const fetchHistory = async () => {
                const { data } = await supabase
                    .from('search_history')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(5);
                if (data) setHistory(data);
            };
            fetchHistory();
        }
    }, [user, location.pathname]);

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

                    {/* Recent History Section */}
                    <div className="mt-8">
                        <div className="px-4 mb-2 text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                            <Clock className="h-3 w-3" /> Recent History
                        </div>
                        {history.length > 0 ? (
                            <div className="space-y-1">
                                {history.map((item, idx) => (
                                    <div key={idx} className="group relative px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${item.risk_score > 70 ? 'bg-red-500' : item.risk_score < 30 ? 'bg-green-500' : 'bg-yellow-500'} `} />
                                            <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary truncate transition-colors max-w-[100px]" title={item.location_name}>
                                                {item.location_name}
                                            </span>
                                        </div>
                                        {/* Quick Actions (Show on Hover) */}
                                        <div className="hidden group-hover:flex items-center gap-1">
                                            <button
                                                onClick={() => navigate('/analyze', { state: { query: item.location_name, compare: true } })}
                                                className="p-1 hover:text-brand-primary transition-colors"
                                                title="Compare / Analyze"
                                            >
                                                <Search className="h-3 w-3" />
                                            </button>
                                            <button
                                                onClick={() => navigate('/market', { state: { location: item.location_name, riskScore: item.risk_score || 50 } })}
                                                className="p-1 hover:text-brand-secondary transition-colors"
                                                title="Calculate ROI"
                                            >
                                                <Calculator className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="px-4 text-[10px] text-text-secondary opacity-50 italic">No recent searches</div>
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
