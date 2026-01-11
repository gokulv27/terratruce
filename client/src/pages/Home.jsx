import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  TrendingUp,
  Search,
  Map,
  ArrowRight,
  BarChart2,
  Calculator,
  Flame,
  Clock,
  MapPin,
  ChevronRight,
  Activity,
  Zap,
  Layers,
  Globe,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAnalysis } from '../context/AnalysisContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

gsap.registerPlugin(ScrollTrigger);

const SYNTHETIC_HOT_SEARCHES = {
  'Tamil Nadu': [
    { name: 'Ambattur, Chennai', growth: '+12%' },
    { name: 'Velachery, Chennai', growth: '+8%' },
    { name: 'OMR, Chennai', growth: '+15%' },
    { name: 'Coimbatore', growth: '+5%' },
  ],
  India: [
    { name: 'Mumbai, MH', growth: '+12%' },
    { name: 'Bangalore, KA', growth: '+15%' },
    { name: 'Hyderabad, TS', growth: '+10%' },
    { name: 'Gurgaon, HR', growth: '+14%' },
  ],
  Default: [
    { name: 'Mumbai', growth: '+12%' },
    { name: 'Bangalore', growth: '+15%' },
    { name: 'Hyderabad', growth: '+10%' },
    { name: 'Chennai', growth: '+8%' },
  ],
};

const HottestSearchesTable = ({ items, onSearch, region }) => (
  <div className="col-span-1 bg-surface/80 backdrop-blur-xl border border-brand-primary/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden h-full flex flex-col">
    <div className="flex items-center justify-between mb-6 relative z-10">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl text-white shadow-lg shadow-teal-500/20">
          <Flame className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-black text-lg text-text-primary tracking-tight leading-none">
            Trending Markets
          </h3>
          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mt-1">
            {region || 'Global'} Top 5
          </p>
        </div>
      </div>
    </div>

    <div className="flex-1 overflow-y-auto pr-1 space-y-1 relative z-10 custom-scrollbar">
      <div className="grid grid-cols-12 text-[10px] font-bold text-text-secondary uppercase tracking-widest px-3 mb-2 opacity-70">
        <div className="col-span-1">#</div>
        <div className="col-span-8">Location</div>
        <div className="col-span-3 text-right">Growth</div>
      </div>
      {items.map((item, idx) => (
        <button
          key={idx}
          onClick={() => onSearch(item.name)}
          className="w-full grid grid-cols-12 items-center p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-brand-primary/20 transition-all group text-left"
        >
          <div className="col-span-1 font-black text-xs text-text-secondary/50 group-hover:text-brand-primary">
            {idx + 1}
          </div>
          <div className="col-span-8 font-bold text-sm text-text-primary truncate pr-2">
            {item.name}
          </div>
          <div className="col-span-3 flex items-center justify-end gap-1">
            <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-600 text-xs font-black">
              {item.growth}
            </span>
          </div>
        </button>
      ))}
    </div>

    {/* Soft fade at bottom */}
    <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-surface to-transparent pointer-events-none z-20" />
  </div>
);

const MarketStatCard = () => (
  <div className="bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 dark:from-brand-primary dark:to-brand-secondary rounded-3xl p-6 shadow-xl shadow-emerald-500/30 dark:shadow-brand-primary/20 text-white relative overflow-hidden group hover:scale-[1.02] transition-transform">
    <div className="absolute top-0 right-0 p-4 opacity-10">
      <TrendingUp className="h-24 w-24 -mr-6 -mt-6 rotate-12" />
    </div>
    <div className="relative z-10">
      <div className="text-xs font-bold text-white/90 uppercase tracking-wider mb-2">
        Highest Yield
      </div>
      <div className="text-4xl font-black mb-1">+14.2%</div>
      <div className="text-xs font-medium text-white/90">Sector 42, Gurgaon</div>
    </div>
  </div>
);

const VisualMapCard = () => (
  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900 backdrop-blur-xl border-2 border-blue-200 dark:border-white/10 rounded-3xl p-1 shadow-xl shadow-blue-500/20 dark:shadow-sky-500/10 relative overflow-hidden group hover:border-indigo-300 dark:hover:border-brand-primary/30 transition-all">
    <div className="h-full w-full bg-gradient-to-br from-blue-100/50 to-indigo-100/50 dark:from-brand-secondary/5 dark:to-transparent rounded-[20px] flex items-center justify-center relative overflow-hidden">
      {/* Abstract Map Dots */}
      <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-2 p-4 opacity-30 dark:opacity-20">
        {[...Array(36)].map((_, i) => (
          <div
            key={i}
            className="bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-brand-primary dark:to-brand-primary rounded-full w-1 h-1"
          />
        ))}
      </div>
      {/* Pulse */}
      <div className="relative z-10">
        <span className="relative flex h-8 w-8">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-brand-primary dark:to-brand-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-8 w-8 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-brand-primary dark:to-brand-primary border-4 border-white dark:border-slate-800 flex items-center justify-center shadow-lg">
            <Map className="h-3 w-3 text-white" />
          </span>
        </span>
      </div>
      <div className="absolute bottom-3 left-0 w-full text-center">
        <span className="text-[10px] font-bold bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-brand-primary dark:to-brand-primary bg-clip-text text-transparent bg-white/90 dark:bg-white/80 px-2 py-1 rounded-full backdrop-blur shadow-md">
          Live Risk Map
        </span>
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
  const [hotSearches, setHotSearches] = useState(SYNTHETIC_HOT_SEARCHES['Default']);
  const [recentSearches, setRecentSearches] = useState([]);

  // 1. Detect User State for Personalization
  useEffect(() => {
    const detectState = async () => {
      if (analysisState?.userLocation) {
        // Determine region based on state
        // This is a mock; in real app we'd map states to keys
        if (typeof analysisState.userLocation === 'string' && analysisState.userLocation.includes('Tamil Nadu')) {
          setHotSearches(SYNTHETIC_HOT_SEARCHES['Tamil Nadu']);
          setUserState('Tamil Nadu');
        } else {
          setHotSearches(SYNTHETIC_HOT_SEARCHES['India']);
          setUserState('India');
        }
      } else {
        setHotSearches(SYNTHETIC_HOT_SEARCHES['India']);
        setUserState('India');
      }
    };
    detectState();
  }, [analysisState?.userLocation]);

  // 2. Fetch Recent History
  useEffect(() => {
    if (user) {
      const fetchHistory = async () => {
        const { data } = await supabase
          .from('search_history')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(4);
        if (data) setRecentSearches(data);
      };
      fetchHistory();
    }
  }, [user]);

  const handleSearchClick = (query) => {
    navigate('/analyze', { state: { query } });
  };

  // Animations
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.hero-content', { y: 30, opacity: 0, duration: 1, stagger: 0.1 }).from(
        '.hero-cards > div',
        { y: 40, opacity: 0, duration: 0.8, stagger: 0.1 },
        '-=0.6'
      );
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto custom-scrollbar bg-background text-text-primary overflow-x-hidden font-sans"
    >
      {/* Hero Section */}
      <div
        ref={heroRef}
        className="relative pt-12 pb-12 px-6 lg:px-12 overflow-hidden min-h-screen flex items-center"
      >
        {/* Background Gradients - Aesthetic Blue */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-[120px] -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-secondary/5 rounded-full blur-[100px] translate-y-1/4 -translate-x-1/4 pointer-events-none" />

        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10 w-full">
          {/* Left: Content */}
          <div className="space-y-8 pt-4 text-left">
            <div className="hero-content inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-brand-primary/20 text-brand-primary text-xs font-bold uppercase tracking-wider shadow-sm">
              <Shield className="h-3 w-3" />
              Smart Real Estate Intelligence
            </div>

            <h1 className="hero-content text-5xl lg:text-7xl font-black tracking-tighter leading-[1.1] text-text-primary">
              Invest with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent">
                Clarity & Style.
              </span>
            </h1>

            <p className="hero-content text-xl text-text-secondary max-w-lg leading-relaxed font-medium">
              The most aesthetic way to analyze property risk, estimate ROI, and discover high-yield
              opportunities in India.
            </p>

            <div className="hero-content flex flex-wrap gap-4">
              <Link
                id="search"
                to="/analyze"
                className="px-8 py-4 bg-brand-primary text-white rounded-2xl font-bold hover:bg-brand-primary/90 hover:scale-105 transition-all shadow-xl shadow-brand-primary/20 flex items-center gap-2"
              >
                Start Analysis <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                id="calculator"
                to="/market"
                className="px-8 py-4 bg-white border border-border text-brand-primary rounded-2xl font-bold hover:border-brand-primary hover:bg-brand-primary/5 transition-all flex items-center gap-2"
              >
                <Calculator className="h-5 w-5" /> Calculator
              </Link>
            </div>
          </div>

          {/* Right: 3 Aesthetic Cards - Reconfigured for Table Layout */}
          <div className="hero-cards relative grid grid-cols-1 lg:grid-cols-2 gap-5 w-full max-w-2xl mx-auto lg:mr-0 mt-12 lg:mt-0 z-20">
            {/* Hottest Searches Table */}
            <HottestSearchesTable
              items={hotSearches}
              onSearch={handleSearchClick}
              region={userState}
            />

            {/* Right Column: Stats & Map */}
            <div className="flex flex-col gap-5">
              <MarketStatCard />
              <VisualMapCard />
            </div>

            {/* Abstract Decor */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/20 blur-3xl rounded-full" />
          </div>
        </div>
      </div>

      {/* Features Preview */}
      <div className="py-24 px-6 container mx-auto">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-brand-primary">
            Designed for the Modern Investor
          </h2>
          <p className="text-text-secondary">Beautiful tools for serious financial decisions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={Search}
            title="Smart Search"
            desc="Type less, find more with predictive location search."
          />
          <FeatureCard
            id="analyze"
            icon={Shield}
            title="Risk Radar"
            desc="Visualize flood zones and crime heatmaps instantly."
          />
          <FeatureCard
            icon={Calculator}
            title="ROI Projection"
            desc="Customizable 30-year cash flow forecasts."
          />
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, id }) => (
  <div id={id} className="premium-card p-8 group">
    <div className="h-14 w-14 bg-brand-primary/5 rounded-2xl flex items-center justify-center mb-6 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors duration-300">
      <Icon className="h-7 w-7" />
    </div>
    <h3 className="text-xl font-bold mb-3 text-text-primary">{title}</h3>
    <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
  </div>
);

export default Home;
