import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, TrendingUp, Search, Map, ArrowRight, BarChart2, Calculator, Flame, Clock, MapPin, ChevronRight, Activity, Zap, Layers, Globe } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAnalysis } from '../context/AnalysisContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

gsap.registerPlugin(ScrollTrigger);

const SYNTHETIC_HOT_SEARCHES = {
    "Tamil Nadu": [
        { name: "Ambattur, Chennai", growth: "+12%" },
        { name: "Velachery, Chennai", growth: "+8%" },
        { name: "OMR, Chennai", growth: "+15%" },
        { name: "Coimbatore", growth: "+5%" }
    ],
    "Default": [
        { name: "Mumbai", growth: "+12%" },
        { name: "Bangalore", growth: "+15%" },
        { name: "Hyderabad", growth: "+10%" },
        { name: "Chennai", growth: "+8%" }
    ]
};

const CommandCenter = ({ hotSearches, onSearch }) => {
    const [activeTab, setActiveTab] = useState('trends');
    const [price, setPrice] = useState(650000);
    const [rate, setRate] = useState(7.2);

    const payment = Math.round((price - 100000) * ((rate / 100) / 12) * Math.pow(1 + (rate / 100) / 12, 360) / (Math.pow(1 + (rate / 100) / 12, 360) - 1));

    return (
        <div className="w-full max-w-sm mx-auto mr-0 bg-surface/90 backdrop-blur-xl border border-border rounded-3xl shadow-2xl overflow-hidden relative z-20 hover:scale-[1.02] transition-transform duration-500">
            {/* Header / Tabs */}
            <div className="flex border-b border-border bg-surface-elevated/50 p-1">
                {[
                    { id: 'trends', icon: Flame, label: 'Trends' },
                    { id: 'calc', icon: Calculator, label: 'Calc' },
                    { id: 'risk', icon: Activity, label: 'Risk' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                            ? 'bg-surface shadow-sm text-brand-primary'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                            }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="p-6 min-h-[300px]">
                {activeTab === 'trends' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Live Market Heat</h3>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                        </div>
                        <div className="space-y-2">
                            {hotSearches.slice(0, 3).map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onSearch(item.name)}
                                    className="w-full flex items-center justify-between p-3 bg-surface-elevated rounded-xl hover:bg-brand-primary/5 hover:border-brand-primary/20 border border-transparent transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-xs font-bold text-text-secondary group-hover:text-brand-primary">#{idx + 1}</div>
                                        <div className="text-sm font-bold text-text-primary text-left">{item.name}</div>
                                    </div>
                                    <div className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                        {item.growth}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 p-3 bg-brand-accent/5 border border-brand-accent/10 rounded-xl">
                            <div className="flex items-center gap-2 text-brand-accent text-xs font-bold mb-1">
                                <Zap className="h-3 w-3" /> Insider Tip
                            </div>
                            <p className="text-[10px] text-text-secondary leading-tight">
                                Demand in {hotSearches[0]?.name.split(',')[0]} has spiked 40% this week.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'calc' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center">
                            <div className="text-[10px] text-text-secondary font-bold uppercase mb-1">Est. Monthly Payment</div>
                            <div className="text-4xl font-black text-brand-primary tracking-tight">
                                ${payment.toLocaleString()}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-text-secondary">
                                    <span>Price</span>
                                    <span>${price.toLocaleString()}</span>
                                </div>
                                <input
                                    type="range" min="200000" max="1000000" step="10000"
                                    value={price} onChange={(e) => setPrice(Number(e.target.value))}
                                    className="w-full h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-brand-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-text-secondary">
                                    <span>Rate</span>
                                    <span>{rate}%</span>
                                </div>
                                <input
                                    type="range" min="3" max="10" step="0.1"
                                    value={rate} onChange={(e) => setRate(Number(e.target.value))}
                                    className="w-full h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-brand-secondary"
                                />
                            </div>
                        </div>
                        <button className="w-full py-3 bg-brand-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-transform">
                            Full Analysis
                        </button>
                    </div>
                )}

                {activeTab === 'risk' && (
                    <div className="space-y-4 animate-fade-in text-center pt-4">
                        <div className="relative w-32 h-32 mx-auto rounded-full border-8 border-surface-elevated flex items-center justify-center">
                            <svg className="absolute w-full h-full -rotate-90">
                                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-surface-elevated" />
                                <circle cx="64" cy="64" r="56" stroke="url(#gradient)" strokeWidth="8" fill="none" strokeDasharray="351" strokeDashoffset="100" className="text-brand-primary transition-all duration-1000" />
                            </svg>
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="var(--brand-primary)" />
                                    <stop offset="100%" stopColor="var(--brand-secondary)" />
                                </linearGradient>
                            </defs>
                            <div className="text-center">
                                <div className="text-3xl font-black text-text-primary">85</div>
                                <div className="text-[10px] font-bold text-text-secondary uppercase">Safe</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-left">
                            <div className="p-2 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
                                <div className="text-[10px] text-red-600 font-bold">Flood Risk</div>
                                <div className="text-sm font-bold text-text-primary">Low</div>
                            </div>
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20">
                                <div className="text-[10px] text-blue-600 font-bold">Appreciation</div>
                                <div className="text-sm font-bold text-text-primary">+8.5%</div>
                            </div>
                        </div>
                        <p className="text-[10px] text-text-secondary mt-2">
                            Simulated risk profile. Search a location for real data.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

const InteractiveFeatureCard = ({ icon: Icon, title, desc, delay, type }) => (
    <div className={`p-8 bg-surface border border-border rounded-3xl hover:border-brand-primary/30 transition-all hover:-translate-y-2 premium-shadow group relative overflow-hidden animate-fade-in-delay${delay ? `-${delay}` : ''}`}>
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icon className="h-32 w-32 -mr-8 -mt-8 text-brand-primary rotate-12" />
        </div>

        <div className="relative z-10">
            <div className="h-14 w-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-6 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors duration-300 shadow-sm">
                <Icon className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-text-primary">{title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">{desc}</p>

            {/* Micro Interaction Preview */}
            <div className="h-16 w-full bg-surface-elevated rounded-xl border border-border overflow-hidden flex items-center justify-center relative group-hover:border-brand-primary/20 transition-colors">
                {type === 'search' && (
                    <div className="flex items-center gap-2 text-xs font-mono text-text-secondary">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Typing "Bangalore"...
                    </div>
                )}
                {type === 'risk' && (
                    <div className="flex gap-1 items-end h-8">
                        <div className="w-2 bg-red-400 h-4 rounded-t-sm" />
                        <div className="w-2 bg-orange-400 h-6 rounded-t-sm" />
                        <div className="w-2 bg-yellow-400 h-3 rounded-t-sm" />
                        <div className="w-2 bg-green-400 h-8 rounded-t-sm animate-pulse" />
                        <div className="w-2 bg-blue-400 h-5 rounded-t-sm" />
                    </div>
                )}
                {type === 'calc' && (
                    <div className="flex items-center gap-2">
                        <div className="text-lg font-bold text-brand-primary">$5,400</div>
                        <div className="text-[10px] text-text-secondary">/mo</div>
                    </div>
                )}
            </div>
        </div>
    </div>
);

const Home = () => {
    const containerRef = useRef(null);
    const heroRef = useRef(null);
    const trendingRef = useRef(null);
    const navigate = useNavigate();
    const { analysisState } = useAnalysis();
    const { user } = useAuth();

    const [userState, setUserState] = useState(null);
    const [hotSearches, setHotSearches] = useState(SYNTHETIC_HOT_SEARCHES["Default"]);
    const [recentSearches, setRecentSearches] = useState([]);

    // 1. Detect User State for Personalization
    useEffect(() => {
        const detectState = async () => {
            if (analysisState?.userLocation) {
                setHotSearches(SYNTHETIC_HOT_SEARCHES["Tamil Nadu"]);
                setUserState("Tamil Nadu");
            }
        };
        detectState();
    }, [analysisState?.userLocation]);

    // 2. Fetch Recent History
    useEffect(() => {
        if (user) {
            const fetchHistory = async () => {
                const { data } = await supabase.from('search_history').select('*').order('created_at', { ascending: false }).limit(4);
                if (data) setRecentSearches(data);
            };
            fetchHistory();
        }
    }, [user]);

    // Animations
    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.from(".hero-content", { y: 30, opacity: 0, duration: 1, stagger: 0.1 })
            .from(".hero-widgets-container", { x: 40, opacity: 0, duration: 0.8 }, "-=0.6");

        gsap.from(".trending-card", {
            scrollTrigger: { trigger: trendingRef.current, start: "top 80%" },
            y: 40, opacity: 0, duration: 0.6, stagger: 0.1
        });
    }, { scope: containerRef });

    const handleSearchClick = (query) => {
        navigate('/analyze', { state: { query } });
    };

    return (
        <div ref={containerRef} className="bg-background text-text-primary overflow-x-hidden font-sans">

            {/* Hero Section */}
            <div ref={heroRef} className="relative pt-32 pb-20 px-6 lg:px-12 overflow-hidden min-h-[90vh] flex items-center">
                {/* Background Blobs - Improved Colors */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-[120px] -translate-y-1/4 translate-x-1/4 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-secondary/5 rounded-full blur-[100px] translate-y-1/4 -translate-x-1/4 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-brand-accent/5 rounded-full blur-[90px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10 w-full">

                    {/* Left: Content */}
                    <div className="space-y-8 pt-4">
                        <div className="hero-content inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-elevated border border-brand-primary/20 text-brand-primary text-xs font-bold uppercase tracking-wider shadow-sm">
                            <Shield className="h-3 w-3" />
                            AI-Powered Real Estate Intelligence
                        </div>

                        <h1 className="hero-content text-5xl lg:text-7xl font-black tracking-tighter leading-[1.1] text-brand-primary">
                            Invest with <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent">
                                Absolute Confidence.
                            </span>
                        </h1>

                        <p className="hero-content text-xl text-text-secondary max-w-lg leading-relaxed font-medium">
                            Stop guessing. Start analyzing. Get instant risk reports, valuation forecasts, and legal insights for any property in India.
                        </p>

                        <div className="hero-content flex flex-wrap gap-4">
                            <Link to="/analyze" className="px-8 py-4 bg-brand-primary text-white rounded-2xl font-bold hover:bg-brand-primary/90 hover:scale-105 transition-all shadow-xl shadow-brand-primary/20 flex items-center gap-2">
                                Start Free Analysis <ArrowRight className="h-5 w-5" />
                            </Link>
                            <Link to="/market" className="px-8 py-4 bg-white border-2 border-border text-brand-primary rounded-2xl font-bold hover:border-brand-primary hover:bg-brand-primary/5 transition-all flex items-center gap-2">
                                <Calculator className="h-5 w-5" /> ROI Calculator
                            </Link>
                        </div>

                        {/* Recent Activity Mini-Panel */}
                        {(recentSearches.length > 0) && (
                            <div className="hero-content mt-8 p-4 bg-white/60 backdrop-blur border border-white/50 rounded-2xl shadow-sm max-w-md">
                                <h3 className="text-xs font-bold text-text-secondary uppercase mb-3 flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Recent Activity
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {recentSearches.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSearchClick(item.location_name)}
                                            className="text-xs px-3 py-1.5 bg-white border border-border rounded-lg hover:border-brand-primary hover:text-brand-primary transition-colors text-text-primary truncate max-w-[120px]"
                                        >
                                            {item.location_name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Interactive Command Center */}
                    <div className="hero-widgets-container hidden lg:flex items-center justify-center relative">
                        {/* Card Stack Effect */}
                        <div className="absolute top-4 -right-4 w-full h-full bg-brand-primary/5 rounded-3xl -z-10 rotate-3 transition-transform duration-500 hover:rotate-6"></div>
                        <div className="absolute top-8 -right-8 w-full h-full bg-brand-secondary/5 rounded-3xl -z-20 rotate-6 transition-transform duration-500 hover:rotate-12"></div>

                        <CommandCenter hotSearches={hotSearches} onSearch={handleSearchClick} />

                        {/* Floating Badge */}
                        <div className="absolute -left-12 bottom-12 p-4 bg-surface border border-border rounded-2xl shadow-xl animate-blob">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-text-secondary uppercase">Market Growth</div>
                                    <div className="text-lg font-black text-text-primary">+14.2%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hot Searches Section */}
            <div ref={trendingRef} className="py-16 bg-surface-elevated/50 border-y border-border">
                <div className="container mx-auto px-6">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                                <Flame className="h-6 w-6 text-brand-accent fill-brand-accent" />
                                Trending in {userState || "Your Area"}
                            </h2>
                            <p className="text-sm text-text-secondary mt-1">Properties with high search volume today.</p>
                        </div>
                        <button className="text-sm font-bold text-brand-primary flex items-center gap-1 hover:gap-2 transition-all">
                            Global Heatmap <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {hotSearches.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSearchClick(item.name)}
                                className="trending-card group relative p-5 bg-surface border border-border rounded-2xl hover:border-brand-primary/50 hover:shadow-lg transition-all text-left"
                            >
                                <div className="absolute top-4 right-4 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100 dark:bg-green-900/30 dark:border-green-800">
                                    {item.growth}
                                </div>
                                <div className="p-2 w-fit bg-brand-primary/5 rounded-xl text-brand-primary mb-3 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                    <MapPin className="h-5 w-5" />
                                </div>
                                <h3 className="font-bold text-text-primary group-hover:text-brand-primary transition-colors">{item.name}</h3>
                                <p className="text-xs text-text-secondary mt-1">Very High Demand</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Features (Interactive) */}
            <div className="py-24 px-6 container mx-auto">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold mb-4 text-brand-primary">Everything you need to invest safely</h2>
                    <p className="text-text-secondary">Comprehensive tools to analyze location, value, and potential legal pitfalls before you sign.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <InteractiveFeatureCard
                        icon={Search}
                        title="Smart Search"
                        desc="Find specific plots with AI-powered filtering and real listings."
                        type="search"
                        delay=""
                    />
                    <InteractiveFeatureCard
                        icon={Shield}
                        title="Risk Analysis"
                        desc="Assess flood, crime, and environmental risks instantly."
                        type="risk"
                        delay="2"
                    />
                    <InteractiveFeatureCard
                        icon={Calculator}
                        title="ROI Calculator"
                        desc="Project cash flow and appreciation for 5 years."
                        type="calc"
                        delay="2"
                    />
                </div>
            </div>
        </div>
    );
};

export default Home;
