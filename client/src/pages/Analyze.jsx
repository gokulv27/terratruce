import React, { useState } from 'react';
import MapView from '../components/Map/MapView';
import InsightsPanel from '../components/Insights/InsightsPanel';
import { Search } from 'lucide-react';
import { analyzePropertyRisk } from '../services/api';

const Analyze = () => {
    const [showInsights, setShowInsights] = useState(true);
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [mapLocation, setMapLocation] = useState({ lat: 40.7128, lng: -74.0060 }); // Default NYC
    const [riskData, setRiskData] = useState(null);

    const handleAnalyze = async () => {
        if (!location) return;
        setLoading(true);
        setShowInsights(true);
        const data = await analyzePropertyRisk(location);
        if (data) {
            setRiskData(data);
            if (data.coordinates) {
                setMapLocation(data.coordinates);
            }
        }
        setLoading(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleAnalyze();
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Top Input Bar */}
            <div className="h-20 bg-white/90 backdrop-blur-md border-b border-gray-200 flex items-center px-4 md:px-6 shadow-sm z-10 mt-16">
                <div className="flex items-center flex-1 max-w-4xl mx-auto gap-4">
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm transition-all shadow-sm hover:shadow-md"
                            placeholder="Enter Location (e.g., 'Miami Beach, FL' or '123 Main St, New York')"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            onKeyDown={handleKeyPress}
                        />
                    </div>
                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !location}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 whitespace-nowrap"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Analyzing...
                            </>
                        ) : (
                            'Analyze'
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content - Split Screen */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Map View - 65% on Desktop, 100% on Mobile */}
                <div className="w-full md:w-[65%] h-full relative z-0">
                    <MapView
                        location={mapLocation}
                        markers={riskData ? [
                            {
                                position: mapLocation,
                                color: riskData.overall_score > 70 ? '#EF4444' : riskData.overall_score > 40 ? '#FACC15' : '#22C55E'
                            },
                            ...(riskData.recent_listings?.map(item => ({
                                position: item.coordinates,
                                color: '#3B82F6' // Blue for listings
                            })) || [])
                        ] : []}
                    />
                </div>

                {/* Mobile Toggle Button (Visible only when panel is closed on mobile) */}
                {!showInsights && (
                    <button
                        onClick={() => setShowInsights(true)}
                        className="md:hidden absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-full shadow-xl z-10 font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
                    >
                        <Search className="h-4 w-4" />
                        View Insights
                    </button>
                )}

                {/* Property Insights Panel - 35% on Desktop, Mobile Slide-over */}
                <div className={`
          fixed inset-x-0 bottom-0 h-[65%] md:h-auto md:top-20 md:relative md:inset-auto md:w-[35%] 
          bg-white md:shadow-none border-l border-gray-200 overflow-y-auto 
          transition-transform duration-300 ease-in-out z-20 rounded-t-3xl md:rounded-none shadow-2xl
          ${showInsights ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
        `}>
                    {/* Mobile Handle / Close Button */}
                    <div className="md:hidden sticky top-0 bg-white p-3 flex justify-center border-b border-gray-100 rounded-t-3xl" onClick={() => setShowInsights(!showInsights)}>
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                    </div>
                    <InsightsPanel data={riskData} loading={loading} />
                </div>
            </div>
        </div>
    );
};

export default Analyze;
