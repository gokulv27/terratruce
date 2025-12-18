import React from 'react';
import { Home, Building, Waves, Siren, Wind, Train, Coffee, MapPin, TrendingUp, AlertTriangle, Leaf, Factory, Users, Scale, Newspaper, DollarSign, Globe, Activity } from 'lucide-react';
import RiskGauge from './RiskGauge';
import RiskMetricCard from './RiskMetricCard';
import HistoricalCharts from '../Charts/HistoricalCharts';
import FacilitiesDisplay from './FacilitiesDisplay';
import EconomicDashboard from '../Analytics/EconomicDashboard';
import VisualMetrics from '../Analytics/VisualMetrics';

const InsightsPanel = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-900 border-t-purple-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Activity className="h-6 w-6 text-purple-500" />
                    </div>
                </div>
                <p className="mt-4 text-sm font-medium text-gray-300">Analyzing property...</p>
                <p className="mt-1 text-xs text-gray-500">Fetching comprehensive 10-point analysis</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30">
                    <Activity className="h-12 w-12 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Ready to Analyze</h3>
                <p className="text-gray-400 max-w-xs">Enter a location in the search bar above to get instant AI-powered 10-point risk analysis with historical trends.</p>
            </div>
        );
    }

    const riskAnalysis = data.risk_analysis || {};
    const marketIntel = data.market_intelligence || {};
    const legalResources = data.legal_resources || {};
    const additionalInfo = data.additional_info || {};

    return (
        <div className="p-6 h-full overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 custom-scrollbar">
            {/* Section 1: Overall Risk Score with Gauge */}
            <div className="mb-10 p-7 rounded-3xl bg-gradient-to-br from-gray-800/80 via-purple-900/20 to-pink-900/20 border-2 border-purple-500/30 shadow-2xl backdrop-blur-sm">
                <h2 className="text-lg font-bold text-white mb-5 text-center flex items-center justify-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-purple-400" />
                    Overall Risk Assessment
                </h2>
                <div className="flex justify-center mb-5">
                    <RiskGauge score={riskAnalysis.overall_score || 50} />
                </div>
                {data.location_info?.formatted_address && (
                    <div className="mt-5 text-center p-4 bg-gray-800/60 rounded-xl border border-purple-500/20">
                        <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Location</p>
                        <p className="text-sm font-semibold text-white">{data.location_info.formatted_address}</p>
                        {data.location_info.jurisdiction && (
                            <p className="text-xs text-gray-500 mt-1">{data.location_info.jurisdiction}</p>
                        )}
                    </div>
                )}
            </div>

            {/* Section 2: 10-Point Risk Breakdown */}
            <div className="mb-10">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b-2 border-gray-700/50">
                    <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg shadow-md">
                        <AlertTriangle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">10-Point Risk Analysis</h3>
                        <p className="text-xs text-gray-400">Comprehensive property evaluation</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {/* Buying Risk */}
                    {riskAnalysis.buying_risk && (
                        <RiskMetricCard
                            icon={Home}
                            title="Buying Risk"
                            score={riskAnalysis.buying_risk.score}
                            status={riskAnalysis.buying_risk.status}
                            factors={riskAnalysis.buying_risk.factors}
                            description="Risk assessment for property purchase"
                        />
                    )}

                    {/* Renting Risk */}
                    {riskAnalysis.renting_risk && (
                        <RiskMetricCard
                            icon={Building}
                            title="Renting Risk"
                            score={riskAnalysis.renting_risk.score}
                            status={riskAnalysis.renting_risk.status}
                            factors={riskAnalysis.renting_risk.factors}
                            description="Risk assessment for rental investment"
                        />
                    )}

                    {/* Flood Risk */}
                    {riskAnalysis.flood_risk && (
                        <RiskMetricCard
                            icon={Waves}
                            title="Flood Risk"
                            score={riskAnalysis.flood_risk.score}
                            status={riskAnalysis.flood_risk.level}
                            factors={riskAnalysis.flood_risk.zones}
                            description={riskAnalysis.flood_risk.description}
                        />
                    )}

                    {/* Crime Rate */}
                    {riskAnalysis.crime_rate && (
                        <RiskMetricCard
                            icon={Siren}
                            title="Crime Rate"
                            score={riskAnalysis.crime_rate.score}
                            status={`${riskAnalysis.crime_rate.rate_per_1000}/1000 • ${riskAnalysis.crime_rate.trend}`}
                            factors={riskAnalysis.crime_rate.types}
                            description="Safety and crime statistics"
                        />
                    )}

                    {/* Air Quality */}
                    {riskAnalysis.air_quality && (
                        <RiskMetricCard
                            icon={Wind}
                            title="Air Quality"
                            score={riskAnalysis.air_quality.score}
                            status={`AQI ${riskAnalysis.air_quality.aqi} • ${riskAnalysis.air_quality.rating}`}
                            factors={riskAnalysis.air_quality.pollutants}
                            description="Environmental air quality index"
                        />
                    )}

                    {/* Amenities - Using Premium Facilities Display */}
                    {riskAnalysis.amenities && (
                        <div>
                            <div className="mb-4 p-4 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 rounded-xl border border-indigo-500/30">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                            <Coffee className="h-4 w-4 text-indigo-400" />
                                            Proximity to Amenities
                                        </h4>
                                        <p className="text-xs text-gray-400 mt-0.5">Quality-rated facilities nearby</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-purple-400">
                                            {riskAnalysis.amenities.score}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            Walk: {riskAnalysis.amenities.walkability}/100
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <FacilitiesDisplay amenities={riskAnalysis.amenities} />
                        </div>
                    )}

                    {/* Transportation */}
                    {riskAnalysis.transportation && (
                        <RiskMetricCard
                            icon={Train}
                            title="Transportation Score"
                            score={riskAnalysis.transportation.score}
                            status={riskAnalysis.transportation.commute_time}
                            factors={riskAnalysis.transportation.transit_options}
                            description="Public transit and commute quality"
                        />
                    )}

                    {/* Neighbourhood */}
                    {riskAnalysis.neighbourhood && (
                        <RiskMetricCard
                            icon={Users}
                            title="Neighbourhood Rating"
                            score={riskAnalysis.neighbourhood.score}
                            status={riskAnalysis.neighbourhood.rating}
                            factors={[
                                riskAnalysis.neighbourhood.character,
                                `Median Age: ${riskAnalysis.neighbourhood.demographics?.median_age || 'N/A'}`,
                                `Density: ${riskAnalysis.neighbourhood.demographics?.population_density || 'N/A'}`
                            ]}
                            description="Community livability assessment"
                        />
                    )}

                    {/* Environmental Hazards */}
                    {riskAnalysis.environmental_hazards && (
                        <RiskMetricCard
                            icon={Factory}
                            title="Environmental Hazards"
                            score={riskAnalysis.environmental_hazards.score}
                            status={riskAnalysis.environmental_hazards.severity}
                            factors={riskAnalysis.environmental_hazards.hazards}
                            description="Contamination and pollution risks"
                        />
                    )}

                    {/* Growth Potential */}
                    {riskAnalysis.growth_potential && (
                        <RiskMetricCard
                            icon={TrendingUp}
                            title="Economic Growth Potential"
                            score={riskAnalysis.growth_potential.score}
                            status={riskAnalysis.growth_potential.forecast}
                            factors={riskAnalysis.growth_potential.drivers}
                            description={riskAnalysis.growth_potential.outlook_5yr}
                        />
                    )}
                </div>
            </div>

            {/* Section 3: Historical Trends */}
            {data.historical_trends && (
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-5 pb-3 border-b-2 border-gray-700/50">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-md">
                            <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">Historical Trends (2019-2024)</h3>
                            <p className="text-xs text-gray-400">Market analysis over time</p>
                        </div>
                    </div>
                    <HistoricalCharts data={data} />
                </div>
            )}

            {/* Section 3.5: Advanced Visual Metrics */}
            <div className="mb-10">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b-2 border-gray-700/50">
                    <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg shadow-md">
                        <Activity className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">Key Performance Metrics</h3>
                        <p className="text-xs text-gray-400">Advanced analytics dashboard</p>
                    </div>
                </div>
                <VisualMetrics data={data} />
            </div>

            {/* Section 3.6: Political & Economic Analysis */}
            <div className="mb-10">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b-2 border-gray-700/50">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-md">
                        <Globe className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">Political & Economic Analysis</h3>
                        <p className="text-xs text-gray-400">Macro factors affecting property value</p>
                    </div>
                </div>
                <EconomicDashboard data={data} />
            </div>

            {/* Section 4: Market Intelligence & AI Summary */}
            {marketIntel.ai_summary && (
                <div className="mb-10">
                    <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 p-5 rounded-2xl border-2 border-blue-500/30 shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
                                <span className="text-xs text-white font-bold">AI</span>
                            </div>
                            <h3 className="text-base font-bold text-blue-300">AI Market Intelligence</h3>
                        </div>
                        <p className="text-sm text-gray-200 leading-relaxed mb-4 font-medium">
                            "{marketIntel.ai_summary}"
                        </p>

                        {/* Market Predictions */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            {marketIntel.prediction_6mo && (
                                <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-blue-500/20">
                                    <p className="text-xs text-gray-400 mb-1">6-Month Outlook</p>
                                    <p className="text-xs font-semibold text-blue-300">{marketIntel.prediction_6mo}</p>
            {/* Section 6: Nearby Infrastructure */}
            <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Nearby Infrastructure</h3>
                <div className="space-y-6">
                    {/* Hospitals */}
                    <div>
                        <h4 className="text-xs font-bold text-red-600 uppercase mb-3 flex items-center gap-2">
                            <Siren className="h-4 w-4" /> Nearby Hospitals
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            {data.nearby_hospitals?.length > 0 ? data.nearby_hospitals.map((h, i) => (
                                <div key={i} className="bg-red-50/50 p-3 rounded-xl border border-red-100 flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-900">{h.name}</span>
                                    <span className="text-xs font-medium text-red-600">{h.distance}</span>
                                </div>
                            )) : <p className="text-xs text-gray-400 italic">No hospitals identified nearby.</p>}
                        </div>
                    </div>

                    {/* Schools */}
                    <div>
                        <h4 className="text-xs font-bold text-green-600 uppercase mb-3 flex items-center gap-2">
                            <Building className="h-4 w-4" /> Nearby Schools
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            {data.nearby_schools?.length > 0 ? data.nearby_schools.map((s, i) => (
                                <div key={i} className="bg-green-50/50 p-3 rounded-xl border border-green-100 flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-900">{s.name}</span>
                                    <span className="text-xs font-medium text-green-600">{s.distance}</span>
                                </div>
                            )) : <p className="text-xs text-gray-400 italic">No schools identified nearby.</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 7: Recently Posted Properties */}
            {data.recent_listings && data.recent_listings.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Recently Posted Nearby</h3>
                    <div className="space-y-3">
                        {data.recent_listings.map((item, idx) => (
                            <div key={idx} className="flex flex-col p-3 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Home className="h-4 w-4 text-blue-500" />
                                            <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.address}</p>
                                        </div>
                                        <div className="flex items-center gap-2 ml-5">
                                            <p className="text-xs text-gray-500">{item.type}</p>
                                            {item.date && (
                                                <span className="text-xs text-gray-400">• {item.date}</span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-primary whitespace-nowrap bg-blue-50 text-blue-700 px-2 py-1 rounded-md">{item.price}</span>
                                </div>
                            )}
                            {marketIntel.prediction_1yr && (
                                <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-blue-500/20">
                                    <p className="text-xs text-gray-400 mb-1">1-Year Outlook</p>
                                    <p className="text-xs font-semibold text-blue-300">{marketIntel.prediction_1yr}</p>
                                </div>
                            )}
                        </div>

                        {/* Current Trend */}
                        {marketIntel.current_trend && (
                            <div className="flex items-center gap-2 text-sm font-semibold bg-gray-800/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-blue-500/20">
                                <span className="text-gray-300">Market Direction:</span>
                                <span className={`${marketIntel.current_trend === 'Up' ? 'text-green-400' : marketIntel.current_trend === 'Down' ? 'text-red-400' : 'text-gray-400'} flex items-center gap-1`}>
                                    {marketIntel.current_trend === 'Up' ? <TrendingUp className="h-4 w-4" /> : marketIntel.current_trend === 'Down' ? <TrendingUp className="h-4 w-4 rotate-180" /> : '→'}
                                    {marketIntel.current_trend}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Section 8: Safety & Accuracy Disclaimer */}
            <div className="mt-8 p-4 bg-slate-100 rounded-xl border border-slate-200 flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-slate-700 uppercase">AI Safety Notice</p>
                    <p className="text-[10px] text-slate-500 leading-normal">
                        This risk assessment is automatically generated by AI and is intended for informational purposes only. It does not constitute a legal guarantee, engineering certification, or professional real estate advice. Always verify critical data points with official government records.
                    </p>
                </div>
            </div>
        </div>
    );
};

            {/* Additional sections remain in next part due to length... */}

            <style jsx="true">{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(31, 41, 55, 0.5);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, rgba(168, 85, 247, 0.6), rgba(236, 72, 153, 0.6));
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(180deg, rgba(168, 85, 247, 0.9), rgba(236, 72, 153, 0.9));
                }
            `}</style>
        </div>
    );
};

export default InsightsPanel;
