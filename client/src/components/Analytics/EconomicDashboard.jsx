import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Briefcase, Globe, Scale as ScaleIcon, AlertCircle, Activity } from 'lucide-react';

/**
 * Premium Economic Dashboard Component
 * Displays political stability, trade relations, and economic indicators
 * with advanced visualizations
 */
const EconomicDashboard = ({ data }) => {
    if (!data) return null;

    const politicalStability = data.risk_analysis?.political_stability;
    const tradeEconomy = data.risk_analysis?.trade_economy;

    if (!politicalStability && !tradeEconomy) return null;

    // Helper to get color based on score
    const getScoreColor = (score) => {
        if (score >= 75) return { bg: 'from-emerald-500 to-green-500', text: 'text-emerald-700', light: 'bg-emerald-50' };
        if (score >= 50) return { bg: 'from-blue-500 to-cyan-500', text: 'text-blue-700', light: 'bg-blue-50' };
        if (score >= 25) return { bg: 'from-yellow-500 to-orange-500', text: 'text-yellow-700', light: 'bg-yellow-50' };
        return { bg: 'from-red-500 to-pink-500', text: 'text-red-700', light: 'bg-red-50' };
    };

    const getStatusColor = (status) => {
        const colors = {
            'Very Stable': 'bg-emerald-100 text-emerald-700 border-emerald-300',
            'Stable': 'bg-green-100 text-green-700 border-green-300',
            'Moderate': 'bg-yellow-100 text-yellow-700 border-yellow-300',
            'Unstable': 'bg-orange-100 text-orange-700 border-orange-300',
            'Volatile': 'bg-red-100 text-red-700 border-red-300',
            'Excellent': 'bg-emerald-100 text-emerald-700 border-emerald-300',
            'Good': 'bg-blue-100 text-blue-700 border-blue-300',
            'Fair': 'bg-yellow-100 text-yellow-700 border-yellow-300',
            'Poor': 'bg-red-100 text-red-700 border-red-300',
            'Strong': 'bg-emerald-100 text-emerald-700 border-emerald-300',
            'Weak': 'bg-red-100 text-red-700 border-red-300'
        };
        return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
    };

    return (
        <div className="space-y-6">
            {/* Political Stability Section */}
            {politicalStability && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 border-2 border-purple-200 shadow-xl">
                    {/* Header with Score */}
                    <div className="p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                                    <ScaleIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Political Stability</h3>
                                    <p className="text-xs text-gray-600">Impact on property market</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-purple-600">{politicalStability.score}</div>
                                <div className="text-xs text-gray-600">Stability Score</div>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(politicalStability.status)}`}>
                                <Activity className="h-4 w-4" />
                                {politicalStability.status}
                            </span>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="p-6 bg-white/60 backdrop-blur-sm space-y-4">
                        {/* Policy Environment */}
                        {politicalStability.policy_environment && (
                            <div className="p-4 bg-white rounded-xl border border-purple-100 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-purple-600" />
                                    Policy Environment
                                </h4>
                                <p className="text-sm text-gray-700">{politicalStability.policy_environment}</p>
                            </div>
                        )}

                        {/* Stability Factors */}
                        {politicalStability.factors && politicalStability.factors.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Key Factors</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {politicalStability.factors.map((factor, idx) => (
                                        <div key={idx} className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
                                            <div className="mt-0.5">
                                                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                                            </div>
                                            <span className="text-sm text-gray-700">{factor}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Events */}
                        {politicalStability.recent_events && politicalStability.recent_events.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Recent Political Events
                                </h4>
                                <div className="space-y-2">
                                    {politicalStability.recent_events.map((event, idx) => (
                                        <div key={idx} className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                                            <p className="text-xs text-gray-700">{event}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Economic & Trade Analysis */}
            {tradeEconomy && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 border-2 border-blue-200 shadow-xl">
                    {/* Header */}
                    <div className="p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                                <Briefcase className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Economic & Trade Analysis</h3>
                                <p className="text-xs text-gray-600">Macro-economic indicators</p>
                            </div>
                        </div>

                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* GDP Growth */}
                            <div className="p-4 bg-white/80 rounded-xl border border-blue-100 shadow-sm backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    {tradeEconomy.gdp_trend === 'Growing' ? (
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                    ) : tradeEconomy.gdp_trend === 'Declining' ? (
                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                    ) : (
                                        <Activity className="h-4 w-4 text-blue-600" />
                                    )}
                                    <span className="text-xs font-semibold text-gray-600 uppercase">GDP Growth</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{tradeEconomy.gdp_growth}%</div>
                                <div className="text-xs text-gray-500 mt-0.5">{tradeEconomy.gdp_trend}</div>
                            </div>

                            {/* Inflation */}
                            <div className="p-4 bg-white/80 rounded-xl border border-blue-100 shadow-sm backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <DollarSign className="h-4 w-4 text-orange-600" />
                                    <span className="text-xs font-semibold text-gray-600 uppercase">Inflation</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{tradeEconomy.inflation_rate}%</div>
                                <div className="text-xs text-gray-500 mt-0.5">Annual Rate</div>
                            </div>

                            {/* Unemployment */}
                            <div className="p-4 bg-white/80 rounded-xl border border-blue-100 shadow-sm backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <Briefcase className="h-4 w-4 text-purple-600" />
                                    <span className="text-xs font-semibold text-gray-600 uppercase">Unemployment</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{tradeEconomy.unemployment_rate}%</div>
                                <div className="text-xs text-gray-500 mt-0.5">Current Rate</div>
                            </div>

                            {/* Economic Outlook */}
                            <div className="p-4 bg-white/80 rounded-xl border border-blue-100 shadow-sm backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <Activity className="h-4 w-4 text-cyan-600" />
                                    <span className="text-xs font-semibold text-gray-600 uppercase">Outlook</span>
                                </div>
                                <div className={`inline-flex px-2 py-1 rounded-full text-sm font-bold border ${getStatusColor(tradeEconomy.economic_outlook)}`}>
                                    {tradeEconomy.economic_outlook}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">{tradeEconomy.trade_balance} Trade</div>
                            </div>
                        </div>
                    </div>

                    {/* Trade Relations & Industries */}
                    <div className="p-6 bg-white/60 backdrop-blur-sm space-y-4">
                        {/* Trade Relations */}
                        {tradeEconomy.trade_relations && (
                            <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-200 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-teal-600" />
                                        Trade Relations
                                    </h4>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(tradeEconomy.trade_relations.status)}`}>
                                        {tradeEconomy.trade_relations.status}
                                    </span>
                                </div>

                                {tradeEconomy.trade_relations.key_partners && tradeEconomy.trade_relations.key_partners.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-xs font-semibold text-gray-600 mb-2">Key Trade Partners:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {tradeEconomy.trade_relations.key_partners.map((partner, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-white rounded-md text-xs font-medium text-gray-700 border border-teal-200">
                                                    {partner}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {tradeEconomy.trade_relations.impact_on_property && (
                                    <p className="text-sm text-gray-700 italic">{tradeEconomy.trade_relations.impact_on_property}</p>
                                )}
                            </div>
                        )}

                        {/* Major Industries */}
                        {tradeEconomy.major_industries && tradeEconomy.major_industries.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Major Industries</h4>
                                <div className="flex flex-wrap gap-2">
                                    {tradeEconomy.major_industries.map((industry, idx) => (
                                        <span key={idx} className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md">
                                            {industry}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EconomicDashboard;
