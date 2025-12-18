import React from 'react';
import { Home, Building, Waves, Siren, Wind, Train, Coffee, MapPin, TrendingUp, AlertTriangle, Sun, CloudSun } from 'lucide-react';

const InsightsPanel = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-blue-600" />
                    </div>
                </div>
                <p className="mt-4 text-sm font-medium text-gray-600">Analyzing property...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100">
                    <MapPin className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Analyze</h3>
                <p className="text-gray-600 max-w-xs">Enter a location in the search bar above to get instant AI-powered risk insights.</p>
            </div>
        );
    }

    const getRiskColor = (score) => {
        if (score >= 70) return { color: 'red', label: 'High Risk' };
        if (score >= 40) return { color: 'yellow', label: 'Medium Risk' };
        return { color: 'green', label: 'Low Risk' };
    };

    const overall = getRiskColor(data.overall_score);

    return (
        <div className="p-6 h-full flex flex-col bg-gradient-to-br from-white to-slate-50">
            {/* Section 1: Overall Score */}
            <div className={`mb-8 p-6 rounded-2xl shadow-lg bg-gradient-to-br ${overall.color === 'red' ? 'from-red-50 to-red-100 border-red-200' :
                overall.color === 'yellow' ? 'from-yellow-50 to-yellow-100 border-yellow-200' :
                    'from-green-50 to-green-100 border-green-200'
                } border-2 flex items-center justify-between hover:shadow-xl transition-shadow`}>
                <div>
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">Overall Risk Score</h2>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className={`text-5xl font-bold ${overall.color === 'red' ? 'text-red-600' :
                            overall.color === 'yellow' ? 'text-yellow-600' :
                                'text-green-600'
                            }`}>{data.overall_score}</span>
                        <span className="text-sm text-gray-500">/ 100</span>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold mt-3 ${overall.color === 'red' ? 'bg-red-600 text-white' :
                        overall.color === 'yellow' ? 'bg-yellow-600 text-white' :
                            'bg-green-600 text-white'
                        }`}>
                        {overall.color === 'red' ? '🔴' : overall.color === 'yellow' ? '🟡' : '🟢'} {overall.label}
                    </span>
                </div>
                <div className={`h-20 w-20 rounded-2xl flex items-center justify-center ${overall.color === 'red' ? 'bg-red-200' :
                    overall.color === 'yellow' ? 'bg-yellow-200' :
                        'bg-green-200'
                    }`}>
                    <AlertTriangle className={`h-10 w-10 ${overall.color === 'red' ? 'text-red-700' :
                        overall.color === 'yellow' ? 'text-yellow-700' :
                            'text-green-700'
                        }`} />
                </div>
            </div>

            {/* Section 2: Risk Breakdown */}
            <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Risk Breakdown</h3>
                <div className="space-y-3">
                    <RiskRow icon={Home} label="Buying Risk" status={data.buying_risk} />
                    <RiskRow icon={Building} label="Renting Risk" status={data.renting_risk} />
                    <RiskRow icon={Waves} label="Flood Risk" score={data.flood_risk_score} />
                    <RiskRow icon={Siren} label="Crime Rate" score={data.crime_score} />
                </div>
            </div>

            {/* Section 3: Environmental Factors */}
            <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Environmental Factors</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex flex-col items-center text-center">
                        <Sun className="h-8 w-8 text-yellow-500 mb-2" />
                        <span className="text-xs font-medium text-gray-500 mb-1">Solar Potential</span>
                        <span className="text-lg font-bold text-gray-900">{data.solar_potential || 'N/A'}</span>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center text-center">
                        <CloudSun className="h-8 w-8 text-blue-500 mb-2" />
                        <span className="text-xs font-medium text-gray-500 mb-1">Typical Weather</span>
                        <span className="text-sm font-bold text-gray-900 line-clamp-2">{data.weather_summary || 'N/A'}</span>
                    </div>
                </div>
                <RiskRow icon={Wind} label="Air Quality" score={data.air_quality_score} subtext={data.air_quality_text} />
            </div>

            {/* Section 4: Lifestyle & Growth */}
            <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Lifestyle & Growth</h3>
                <div className="grid grid-cols-2 gap-4">
                    <LifestyleCard icon={Train} label="Transport" score={data.transport_score} />
                    <LifestyleCard icon={Coffee} label="Amenities" score={data.amenities_score} />
                    <LifestyleCard icon={MapPin} label="Neighbourhood" score={data.neighbourhood_score} />
                    <LifestyleCard icon={TrendingUp} label="Growth" score={data.growth_potential_score} />
                </div>
            </div>

            {/* Section 4: AI Summary & Market Trend */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-5 rounded-2xl border-2 border-blue-200 mb-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                        <span className="text-xs text-white font-bold">AI</span>
                    </div>
                    <h3 className="text-base font-bold text-blue-900">AI Insight</h3>
                </div>
                <p className="text-sm text-blue-900 leading-relaxed mb-4 font-medium">
                    "{data.ai_summary}"
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2">
                    <span className="text-blue-900">Market Prediction:</span>
                    <span className={`${data.market_trend === 'Up' ? 'text-green-600' : 'text-red-600'} flex items-center gap-1`}>
                        {data.market_trend === 'Up' ? <TrendingUp className="h-4 w-4" /> : <TrendingUp className="h-4 w-4 rotate-180" />}
                        Will Go {data.market_trend}
                    </span>
                </div>
            </div>

            {/* Section 5: Local News & Developments */}
            {data.news && data.news.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Local News & Developments</h3>
                    <div className="space-y-4">
                        {data.news.map((item, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-sm font-bold text-gray-900 leading-tight">{item.headline}</h4>
                                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full whitespace-nowrap ml-2">{item.source || 'News'}</span>
                                </div>
                                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.summary}</p>
                                <div className="flex items-center text-xs text-gray-400 gap-2">
                                    <span>{item.date}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Section 6: Recently Posted Properties */}
            {data.recent_listings && data.recent_listings.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Recenty Posted Nearby</h3>
                    <div className="space-y-3">
                        {data.recent_listings.map((item, idx) => (
                            <div key={idx} className="flex flex-col p-3 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Home className="h-4 w-4 text-blue-500" />
                                            <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.address}</p>
                                        </div>
                                        <p className="text-xs text-gray-500 ml-5">{item.type}</p>
                                    </div>
                                    <span className="text-sm font-bold text-primary whitespace-nowrap bg-blue-50 text-blue-700 px-2 py-1 rounded-md">{item.price}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper Components
const RiskRow = ({ icon: Icon, label, score, status, subtext }) => {
    let color = 'gray';
    let displayVal = score;

    if (status) {
        if (status === 'High') color = 'red';
        else if (status === 'Medium') color = 'yellow';
        else color = 'green';
        displayVal = status;
    } else {
        if (score >= 70) color = 'red';
        else if (score >= 40) color = 'yellow';
        else color = 'green';
    }

    const getColorClass = (c) => {
        switch (c) {
            case 'red': return 'text-red-500 bg-red-50';
            case 'yellow': return 'text-yellow-500 bg-yellow-50';
            case 'green': return 'text-green-500 bg-green-50';
            default: return 'text-gray-500 bg-gray-50';
        }
    };

    const dotColor = (c) => {
        switch (c) {
            case 'red': return 'bg-red-500';
            case 'yellow': return 'bg-yellow-500';
            case 'green': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    }

    return (
        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getColorClass(color)}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                    <span className="font-medium text-gray-700">{label}</span>
                    {subtext && <span className="text-xs text-gray-400">{subtext}</span>}
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className="font-bold text-gray-900">{displayVal}</span>
                <div className={`h-2.5 w-2.5 rounded-full ${dotColor(color)}`}></div>
            </div>
        </div>
    );
};

const LifestyleCard = ({ icon: Icon, label, score }) => {
    let color = 'green';
    if (score < 50) color = 'grey';
    else if (score < 75) color = 'yellow';

    const colorText = (c) => {
        switch (c) {
            case 'green': return 'text-green-600';
            case 'yellow': return 'text-yellow-600';
            default: return 'text-gray-600';
        }
    };
    return (
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col items-center text-center">
            <Icon className={`h-6 w-6 mb-2 ${colorText(color)}`} />
            <span className="text-xs font-medium text-gray-500">{label}</span>
            <span className="text-lg font-bold text-gray-900">{score}</span>
        </div>
    )
}

export default InsightsPanel;
