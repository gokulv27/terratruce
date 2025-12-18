import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
import MapView from '../components/Map/MapView';
import LocationSearch from '../components/Search/LocationSearch';
import RiskGauge from '../components/Insights/RiskGauge';
import HistoricalCharts from '../components/Charts/HistoricalCharts';
import EconomicDashboard from '../components/Analytics/EconomicDashboard';
import VisualMetrics from '../components/Analytics/VisualMetrics';
import FacilitiesDisplay from '../components/Insights/FacilitiesDisplay';
import AnalysisLoader from '../components/UI/AnalysisLoader';
import ComparisonView from '../components/Analytics/ComparisonView';
import InsightsPanel from '../components/Insights/InsightsPanel';
import { analyzePropertyRisk, extractAddressFromOCR } from '../services/api';
import { extractTextFromFile, redactPII } from '../services/ocrService';
import { useComparison } from '../context/ComparisonContext';
import { Activity, AlertTriangle, TrendingUp, Map as MapIcon, Maximize2, PlusCircle, ArrowRightLeft, Search, FileText, Loader2, Sparkles, Calculator } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useAnalysis } from '../context/AnalysisContext';

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
    const { user } = useAuth();
    const routerLocation = useRouterLocation(); // Hook for router state
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [location, setLocation] = useState('');
    const [mapLocation, setMapLocation] = useState({ lat: 40.7128, lng: -74.0060 }); // Default NYC
    const [riskData, setRiskData] = useState(null);
    const [showInsights, setShowInsights] = useState(false);
    const { addToCompare, toggleCompareVisibility, comparedProperties } = useComparison();
    const { updateAnalysis, triggerChat, history, fetchHistory, addToHistory } = useAnalysis();
    const fileInputRef = useRef(null);

    // Sync context for Chatbot
    useEffect(() => {
        updateAnalysis({ location, riskData, loading });
    }, [location, riskData, loading]);

    // Handle Hot Search Navigation (Auto-Analyze)
    useEffect(() => {
        if (routerLocation.state?.query && !riskData) {
            handleAnalyze(routerLocation.state.query);
        }
    }, [routerLocation.state]);



    const saveSearchHistory = async (locationName, riskScore = null) => {
        await addToHistory(locationName, riskScore);
    };

    const handleLocationSelect = async (locationName, coordinates) => {
        setLoading(true);
        if (locationName) setLocation(locationName);

        // Map Update
        if (coordinates) {
            setMapLocation(coordinates);
        }

        const data = await analyzePropertyRisk(locationName);
        if (data) {
            setRiskData(data);
            setShowInsights(true);
            if (data.location_info?.coordinates) {
                setMapLocation(data.location_info.coordinates);
            }
            // Save History with Risk Score
            await saveSearchHistory(locationName, data.risk_analysis?.overall_score);
        }
        setLoading(false);
    };

    const handleAnalyze = async (searchLocation = location) => {
        if (!searchLocation) return;
        setLoading(true);
        setShowInsights(true);
        // Force update location state if triggered via hot search
        setLocation(searchLocation);

        const data = await analyzePropertyRisk(searchLocation);
        if (data) {
            setRiskData(data);
            if (data.location_info?.coordinates) {
                setMapLocation(data.location_info.coordinates);
            }
            // Save History with Risk Score
            await saveSearchHistory(searchLocation, data.risk_analysis?.overall_score);
        }
        setLoading(false);
    };

    const handleMapClick = async (coords) => {
        setLoading(true);
        const locationString = `${coords.lat}, ${coords.lng}`;

        // Save History logic for map clicks too? Maybe optional.
        // Let's add it for consistency.
        await saveSearchHistory(locationString);

        const data = await analyzePropertyRisk(locationString);
        if (data) {
            setRiskData(data);
            setMapLocation(coords);
            setShowInsights(true);
        }
        setLoading(false);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setScanning(true);
        try {
            // Step 1: OCR
            const text = await extractTextFromFile(file);

            // Step 2: Redact PII (Privacy Measure)
            const safeText = redactPII(text);

            // Step 3: Address Extraction via Perplexity
            const extractedAddress = await extractAddressFromOCR(safeText);

            if (extractedAddress && extractedAddress !== "No address found") {
                setLocation(extractedAddress);
                // handleAnalyze handles saving history now
                handleAnalyze(extractedAddress);
            } else {
                alert("Could not identify a property address in this document.");
            }
        } catch (err) {
            console.error(err);
            alert("Error processing document: " + err.message);
        } finally {
            setScanning(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleAnalyze();
    };

    // Prepare markers: Property, Hospitals, Schools, Listings
    const getMarkers = () => {
        if (!riskData) return [];

        const markers = [];

        // Main property marker
        markers.push({
            position: mapLocation,
            color: riskData.risk_analysis.overall_score > 70 ? '#EF4444' : riskData.risk_analysis.overall_score > 40 ? '#FACC15' : '#22C55E'
        });

        // Listings (Blue)
        riskData.market_intelligence?.recent_listings?.forEach(item => {
            if (item.coordinates) {
                markers.push({ position: item.coordinates, color: '#3B82F6' });
            }
        });

        // Hospitals (Red/Siren)
        riskData.risk_analysis?.amenities?.nearby?.find(a => a.type === 'Hospitals')?.facilities?.forEach(h => {
            // Mock coords if not provided by amenities (amenities usually don't have coords in this struct, but if they did...)
            // Assuming nearby items might imply markers if we had data. 
            // For now, we'll strip this logic if data doesn't exist, to prevent errors.
        });

        return markers;
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
                    <LocationSearch
                        onSearch={(data) => handleLocationSelect(data.name, { lat: data.lat, lng: data.lng })}
                        loading={loading}
                        history={history}
                    />
                </div>
                <div className="flex items-center gap-3">
                    {/* ROI Calculator Button */}
                    <button
                        onClick={() => navigate('/market', { state: { location: location, riskScore: riskData?.overall_risk_score } })}
                        disabled={!riskData}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm ${riskData
                            ? 'bg-brand-secondary text-white hover:bg-brand-secondary/90 shadow-brand-secondary/20'
                            : 'bg-surface border border-border text-text-secondary opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <Calculator className="h-4 w-4" />
                        <span className="hidden sm:inline">Calculate ROI</span>
                    </button>

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

                    {/* Scan Button (Mobile/Desktop) */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl font-semibold text-brand-primary hover:bg-surface-elevated transition-colors shadow-sm"
                        title="Scan Property Document"
                    >
                        {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        <span className="hidden sm:inline">Scan Doc</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg"
                    />
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

            {/* Main Content - Split Screen */}
            {riskData && (
                <div className="flex-1 flex overflow-hidden relative">
                    {/* Map View */}
                    <div className="w-full md:w-[55%] h-full relative z-0">
                        <MapView
                            location={mapLocation}
                            markers={getMarkers()}
                            onLocationClick={handleMapClick}
                        />
                        {/* Map Overlay Controls */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-auto">
                            <button className="p-2 bg-surface/90 text-text-primary rounded-lg hover:bg-brand-primary hover:text-white transition-colors shadow-lg">
                                <Maximize2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Property Insights Panel */}
                    <div className={`
                        fixed inset-x-0 bottom-0 h-[65%] md:h-auto md:top-0 md:relative md:inset-auto md:w-[45%] 
                        bg-surface md:shadow-none border-l border-border overflow-y-auto custom-scrollbar
                        transition-transform duration-300 ease-in-out z-20 rounded-t-3xl md:rounded-none shadow-2xl
                        ${showInsights ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
                    `}>
                        <div className="p-4 md:hidden flex justify-center sticky top-0 bg-surface/95 backdrop-blur z-30 border-b border-border">
                            <div className="w-12 h-1.5 bg-border rounded-full" />
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Mobile Scan/Verify Risk */}
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-text-primary">Risk Report</h2>
                                {riskData && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => triggerChat(`Find top 5 plots for sale in ${location} and rate them based on the risk data.`)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg text-xs font-bold hover:shadow-lg hover:scale-105 transition-all shadow-md"
                                        >
                                            <Sparkles className="h-3 w-3" />
                                            Give Suggestions
                                        </button>
                                        <button
                                            onClick={() => addToCompare(riskData)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-lg text-xs font-bold hover:bg-brand-primary hover:text-white transition-all"
                                        >
                                            <PlusCircle className="h-3 w-3" />
                                            Compare
                                        </button>
                                    </div>
                                )}
                            </div>

                            <InsightsPanel data={riskData} loading={loading} />

                            {/* Safety Disclaimer */}
                            <div className="mt-8 p-4 bg-surface-elevated rounded-xl border border-border flex items-start gap-3">
                                <AlertTriangle className="h-4 w-4 text-text-secondary mt-0.5" />
                                <p className="text-[10px] text-text-secondary leading-normal">
                                    <strong>Disclaimer:</strong> This risk audit is AI-generated and uses crowdsourced data points. It is not a legally binding guarantee of safety or value. We strongly recommend physically visiting the location and consulting a legal professional before finalizing any property transaction.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ComparisonView />
        </div>
    );
};

export default Analyze;
