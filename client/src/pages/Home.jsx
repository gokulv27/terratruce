import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, TrendingUp, MapPin, Sparkles, ArrowRight, BarChart3, Search, Layers, Clock, Flame, Info, AlertTriangle, Trash2, PlusCircle, User, Zap, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useComparison } from '../context/ComparisonContext';
import { analyzePropertyRisk } from '../services/api';

const FeatureCard = ({ icon: Icon, title, desc, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay }}
        className="p-6 rounded-2xl bg-surface border border-border hover:border-brand-primary/50 shadow-sm hover:shadow-lg transition-all"
    >
        <div className="w-12 h-12 bg-surface-elevated rounded-xl flex items-center justify-center mb-4 text-brand-primary">
            <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
        <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
    </motion.div>
);

const SearchItem = ({ item, popular = false, isHistory = false, onDelete, onCompare }) => {
    const label = popular ? item.location_name || item.location : item.location_name;
    const date = popular ? null : new Date(item.searched_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const count = popular ? item.search_count || item.count : null;

    return (
        <div className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated/50 hover:bg-surface-elevated transition-colors border border-border group">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className={`p-2 rounded-lg shrink-0 ${popular ? 'bg-orange-500/10 text-orange-500' : 'bg-brand-primary/10 text-brand-primary'}`}>
                    {popular ? <Flame className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                    <div className="font-semibold text-text-primary text-sm truncate">{label}</div>
                    {!popular && <div className="text-xs text-text-secondary">{date}</div>}
                    {popular && <div className="text-xs text-text-secondary">{count} Searches</div>}
                </div>
            </div>

            <div className={`flex items-center gap-1 ${isHistory ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                {isHistory && (
                    <>
                        <button
                            onClick={() => onCompare(item)}
                            className="p-1.5 hover:bg-brand-primary/10 text-text-secondary hover:text-brand-primary rounded-lg transition-colors"
                            title="Add to Compare"
                        >
                            <PlusCircle className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => onDelete(item.id)}
                            className="p-1.5 hover:bg-red-500/10 text-text-secondary hover:text-red-500 rounded-lg transition-colors"
                            title="Delete from History"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </>
                )}

                <Link to="/analyze" className="p-1.5 bg-background rounded-lg text-text-primary shadow-sm transition-all hover:scale-110 ml-1">
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </div>
    );
};

const Home = () => {
    const { user } = useAuth();
    const { addToCompare } = useComparison();

    // Global Feed
    const [recentSearches, setRecentSearches] = useState([]);
    const [popularSearches, setPopularSearches] = useState([]);
    const [globalLoading, setGlobalLoading] = useState(true);

    // Private History
    const [myHistory, setMyHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('global'); // 'global' | 'mine'

    // Fetch Global Data
    const fetchGlobalData = async () => {
        try {
            // Recent (Public Feed - maybe limit to anon or all)
            const { data: recentData } = await supabase
                .from('search_history')
                .select('id, location_name, searched_at')
                .order('searched_at', { ascending: false })
                .limit(4);

            if (recentData) setRecentSearches(recentData);

            // Popular searches view might not exist or be empty, handled gracefully?
            const { data: popularData, error } = await supabase
                .from('popular_searches')
                .select('location_name, search_count')
                .limit(4);

            if (popularData) setPopularSearches(popularData);

            // Fallback if view query failed or empty (optional, keeping it simple)
            if (!popularData || popularData.length === 0) {
                // basic mock or fallback
            }

        } catch (err) {
            console.error(err);
        } finally {
            setGlobalLoading(false);
        }
    };

    // Fetch My History
    const fetchMyHistory = async () => {
        if (!user) return;
        try {
            const { data } = await supabase
                .from('search_history')
                .select('*')
                .eq('user_id', user.id)
                .order('searched_at', { ascending: false })
                .limit(10);

            if (data) setMyHistory(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchGlobalData();
        if (user) fetchMyHistory();

        // Real-time subscription
        const subscription = supabase
            .channel('public:search_history')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'search_history' }, () => {
                fetchGlobalData();
                if (user) fetchMyHistory();
            })
            .subscribe();

        return () => { subscription.unsubscribe(); };
    }, [user]);

    // Handlers
    const handleDelete = async (id) => {
        try {
            const { error } = await supabase.from('search_history').delete().eq('id', id);
            if (error) throw error;
            setMyHistory(prev => prev.filter(i => i.id !== id));
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Failed to delete history item. Check RLS policies.");
        }
    };

    const handleCompare = async (item) => {
        try {
            // Re-fetch logic or mock
            const data = await analyzePropertyRisk(item.location_name);
            if (data) {
                addToCompare(data);
                // alert(`Added ${item.location_name} to comparison!`); 
                // Don't alert, just do it. Maybe toast?
            }
        } catch (e) {
            alert("Could not retrieve details for comparison.");
        }
    };

    return (
        <div className="min-h-full pb-20 flex flex-col gap-12">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-10 px-4 md:px-0">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-elevated border border-border text-sm font-bold text-brand-primary mb-8 shadow-sm"
                        >
                            <Sparkles className="h-4 w-4" />
                            Terra Truce Intelligence Platform
                        </motion.div>

                        <h1 className="text-5xl md:text-6xl font-black text-text-primary tracking-tight mb-6 leading-tight">
                            Advanced Property <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">Risk Analysis</span>
                        </h1>

                        <p className="text-lg text-text-secondary mb-8 leading-relaxed max-w-lg">
                            Leveraging AI, Satellite Data, and Government Records to provide the most comprehensive 10-point risk assessment available.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <Link
                                to="/analyze"
                                className="bg-text-primary text-background hover:bg-brand-primary px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                            >
                                <Search className="h-5 w-5" />
                                Start Analysis
                            </Link>
                        </div>
                    </div>

                    {/* Search Data Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-surface border border-border rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col h-[500px]"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <MapPin className="h-48 w-48 rotate-12" />
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-2 p-1 bg-surface-elevated rounded-xl mb-6 relative z-10 shrink-0">
                            <button
                                onClick={() => setActiveTab('global')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'global' ? 'bg-brand-primary text-white shadow-md' : 'text-text-secondary hover:bg-surface'}`}
                            >
                                <Globe className="h-4 w-4" />
                                Live Feed
                            </button>
                            <button
                                onClick={() => setActiveTab('mine')}
                                disabled={!user}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'mine' ? 'bg-brand-primary text-white shadow-md' : 'text-text-secondary hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed'}`}
                                title={!user ? "Login to view history" : ""}
                            >
                                <User className="h-4 w-4" />
                                My History
                            </button>
                        </div>

                        <div className="relative z-10 flex-1 overflow-auto custom-scrollbar pr-2">
                            {activeTab === 'global' ? (
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key="global"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="space-y-6"
                                    >
                                        <div>
                                            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2 sticky top-0 bg-surface py-2 z-10">
                                                <Clock className="h-3 w-3" />
                                                Recent Activity
                                            </h3>
                                            <div className="space-y-3">
                                                {recentSearches.map((s, i) => (
                                                    <SearchItem key={s.id || i} item={s} />
                                                ))}
                                                {recentSearches.length === 0 && !globalLoading && <div className="text-xs text-text-secondary italic">No recent searches yet.</div>}
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-border">
                                            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2 sticky top-0 bg-surface py-2 z-10">
                                                <Flame className="h-3 w-3" />
                                                Trending Now
                                            </h3>
                                            <div className="grid grid-cols-1 gap-3">
                                                {popularSearches.map((s, i) => (
                                                    <SearchItem key={i} item={s} popular />
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            ) : (
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key="mine"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="space-y-3"
                                    >
                                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2 sticky top-0 bg-surface py-2 z-10">
                                            <User className="h-3 w-3" />
                                            Your Search History
                                        </h3>
                                        {myHistory.length > 0 ? (
                                            myHistory.map((item) => (
                                                <SearchItem
                                                    key={item.id}
                                                    item={item}
                                                    isHistory
                                                    onDelete={handleDelete}
                                                    onCompare={handleCompare}
                                                />
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                                <div className="p-3 bg-surface-elevated rounded-full mb-3">
                                                    <Search className="h-6 w-6 text-text-secondary" />
                                                </div>
                                                <p className="text-sm font-medium text-text-primary">No history yet</p>
                                                <p className="text-xs text-text-secondary mt-1">Run an analysis to save it here</p>
                                                <Link to="/analyze" className="mt-4 text-xs font-bold text-brand-primary hover:underline">
                                                    Start Analyzing
                                                </Link>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Detailed Project Breakdown */}
            <section className="bg-surface border-y border-border py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-text-primary mb-4">Comprehensive Risk Intelligence</h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">
                            Our platform aggregates data from over 10 distinct sources to compute a weighted risk score.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Shield}
                            title="Safety & Crime"
                            desc="Real-time precinct data analysis covering violent crime, property theft, and emergency response times for the exact neighborhood."
                            delay={0.1}
                        />
                        <FeatureCard
                            icon={AlertTriangle}
                            title="Environmental"
                            desc="FEMA-grade flood mapping, air quality indexing (AQI), and proximity to industrial hazards or superfund sites."
                            delay={0.2}
                        />
                        <FeatureCard
                            icon={TrendingUp}
                            title="Economic Growth"
                            desc="Predictive modeling on property value appreciation, gentrification indicators, and local business development."
                            delay={0.3}
                        />
                        <FeatureCard
                            icon={MapPin}
                            title="Lifestyle & Amenities"
                            desc="Walk-score calculation including distance to top-rated schools, hospitals, grocery stores, and public transit."
                            delay={0.4}
                        />
                        <FeatureCard
                            icon={Layers}
                            title="Comparative Logic"
                            desc="Side-by-side analysis allowing you to weigh pros and cons of multiple properties directly against each other."
                            delay={0.5}
                        />
                        <FeatureCard
                            icon={Info}
                            title="Legal & Zoning"
                            desc="Jurisdiction-specific tenant rights, zoning restrictions, and short-term rental regulations."
                            delay={0.6}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
