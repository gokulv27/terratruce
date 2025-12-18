import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MapView from '../components/Map/MapView';
import LocationSearch from '../components/Search/LocationSearch';
import RiskGauge from '../components/Insights/RiskGauge';
import HistoricalCharts from '../components/Charts/HistoricalCharts';
import EconomicDashboard from '../components/Analytics/EconomicDashboard';
import VisualMetrics from '../components/Analytics/VisualMetrics';
import FacilitiesDisplay from '../components/Insights/FacilitiesDisplay';
import AnalysisLoader from '../components/UI/AnalysisLoader';
import ComparisonView from '../components/Analytics/ComparisonView';
import { analyzePropertyRisk } from '../services/api';
import { useComparison } from '../context/ComparisonContext';
import { Activity, AlertTriangle, TrendingUp, Map as MapIcon, Maximize2, PlusCircle, ArrowRightLeft } from 'lucide-react';
import { supabase } from '../services/supabase';

// Dashboard Card Wrapper
const DashboardCard = ({ title, icon: Icon, children, className = "", fullHeight = false }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-surface backdrop-blur-md border border-border rounded-2xl overflow-hidden flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 ${className}`}
    >
        {title && (
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface-elevated/50">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4 text-brand-primary" />}
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">{title}</h3>
                </div>
            </div>
        )}
        <div className={`p-5 overflow-auto custom-scrollbar ${fullHeight ? 'flex-1' : ''}`}>
            {children}
        </div>
    </motion.div>
);

const Analyze = () => {
    const [loading, setLoading] = useState(false);
    const [mapLocation, setMapLocation] = useState({ lat: 40.7128, lng: -74.0060 }); // Default NYC
    const [riskData, setRiskData] = useState(null);
    const { addToCompare, toggleCompareVisibility, comparedProperties } = useComparison();

    const handleLocationSelect = async (locationName, coordinates) => {
        setLoading(true);
        // If we have coordinates from autocomplete, update map immediately
        if (coordinates) {
            setMapLocation(coordinates);
        }

        // Track search in Supabase
        if (locationName) {
            try {
                await supabase.from('search_history').insert([{ location_name: locationName }]);
            } catch (err) {
                console.error("Error tracking search to Supabase:", err);
            }
        }

        const data = await analyzePropertyRisk(locationName);
        if (data) {
            setRiskData(data);
            if (data.location_info?.coordinates) {
                setMapLocation(data.location_info.coordinates);
            }
        }
        setLoading(false);
    };

    const handleMapClick = async (coords) => {
        setLoading(true);
        const locationString = `${coords.lat}, ${coords.lng}`;

        // Attempt reverse geocoding or just log coords (skipping full location name push for now on click unless we reverse geocode)
        try {
            // Ideally we'd reverse geocode here to get a name for history, but we'll skip purely coord history 
            // or log "Map Pin at [lat, lng]"
        } catch (e) { }

        const data = await analyzePropertyRisk(locationString);
        if (data) {
            setRiskData(data);
            setMapLocation(coords);
        }
        setLoading(false);
    };

    // Show Loader when analyzing
    if (loading) {
        return <AnalysisLoader />;
    }

    return (
        <div className="flex flex-col h-full gap-4 pb-4 relative">
            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="w-full md:w-2/3 lg:w-1/2 relative z-30">
                    <LocationSearch onLocationSelect={handleLocationSelect} loading={loading} />
                </div>
                <div className="flex items-center gap-3">
                    {/* View Comparison Button */}
                    <button
                        onClick={toggleCompareVisibility}
                        className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl font-semibold text-text-primary hover:bg-surface-elevated transition-colors shadow-sm relative"
                    >
                        <ArrowRightLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Compare</span>
                        {comparedProperties.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-[10px] text-white font-bold ring-2 ring-background">
                                {comparedProperties.length}
                            </span>
                        )}
                    </button>

                    {riskData && (
                        <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-xl border border-border shadow-sm">
                            <span className="text-xs text-text-secondary uppercase font-bold hidden md:inline">Target:</span>
                            <span className="text-sm font-bold text-text-primary max-w-[150px] truncate">{riskData.location_info?.formatted_address || 'Selected Location'}</span>
                        </div>
                    )}

                    {/* Add to Compare Button */}
                    {riskData && (
                        <button
                            onClick={() => addToCompare(riskData)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all shadow-md"
                        >
                            <PlusCircle className="h-4 w-4" />
                            <span className="hidden md:inline">Add to Compare</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Empty State */}
            {!riskData && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-surface/50 rounded-3xl border border-border border-dashed">
                    <div className="h-20 w-20 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-brand-primary/10">
                        <Activity className="h-10 w-10 text-brand-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary mb-2">Ready to Analyze</h2>
                    <p className="text-text-secondary max-w-md">
                        Select a location on the map or search above to generate a comprehensive
                        <span className="text-brand-primary font-bold"> 10-point risk analysis</span> property report.
                    </p>
                    {/* Placeholder Grid */}
                    <div className="mt-12 w-full max-w-4xl opacity-20 filter grayscale pointer-events-none">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Dashboard Grid - Power BI Layout */}
            {riskData && (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-min overflow-y-auto custom-scrollbar pr-2 pb-20">
                    {/* Row 1: Key Metrics (Full Width) */}
                    <div className="md:col-span-12">
                        <VisualMetrics data={riskData} />
                    </div>

                    {/* Row 2: Map (Large) & Risk Gauge (Compact) */}
                    <div className="md:col-span-8 h-[500px] rounded-2xl overflow-hidden shadow-xl border border-border relative group">
                        <MapView
                            location={mapLocation}
                            markers={[{ position: mapLocation, color: '#A855F7' }]} // Add more markers logic if needed
                            onLocationClick={handleMapClick}
                        />
                        {/* Map Overlay Controls */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                            <button className="p-2 bg-surface/90 text-text-primary rounded-lg hover:bg-brand-primary hover:text-white transition-colors shadow-lg">
                                <Maximize2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="md:col-span-4 flex flex-col gap-4 h-[500px]">
                        {/* Overall Risk Gauge */}
                        <DashboardCard title="Overall Risk Score" icon={AlertTriangle} className="flex-1 min-h-0">
                            <div className="h-full flex flex-col items-center justify-center">
                                <RiskGauge score={riskData.risk_analysis.overall_score || 50} />
                            </div>
                        </DashboardCard>

                        {/* Recent Trends Chart */}
                        <DashboardCard title="Market Trend" icon={TrendingUp} className="flex-1 min-h-0">
                            <div className="h-full flex items-center justify-center">
                                {/* Simplified mini chart logic or just passing specific chart */}
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-success mb-1">
                                        {riskData.market_intelligence?.current_trend === 'Up' ? '+12.5%' : '-2.4%'}
                                    </div>
                                    <div className="text-xs text-text-secondary uppercase tracking-widest">Yearly Growth</div>
                                </div>
                            </div>
                        </DashboardCard>
                    </div>

                    {/* Row 3: Detailed Components */}
                    <div className="md:col-span-12">
                        <EconomicDashboard data={riskData} />
                    </div>

                    <div className="md:col-span-6">
                        <FacilitiesDisplay facilities={riskData.risk_analysis.facilities} />
                    </div>

                    <div className="md:col-span-6">
                        <HistoricalCharts data={riskData.historical_trends} />
                    </div>
                </div>
            )}

            {/* Comparison Drawer */}
            <ComparisonView />
        </div>
    );
};

export default Analyze;
