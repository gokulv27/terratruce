import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Risk Metric Card Component - Dark Theme
 * Shows individual risk metrics with expandable details
 */
const RiskMetricCard = ({ icon: Icon, title, score, status, factors, description }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Determine color based on score
    const getColorScheme = (score) => {
        if (score >= 70) return {
            bg: 'from-red-900/40 to-pink-900/40',
            border: 'border-red-500/30',
            icon: 'from-red-500 to-pink-500',
            text: 'text-red-400',
            badge: 'bg-red-900/40 text-red-300 border-red-500/30'
        };
        if (score >= 40) return {
            bg: 'from-yellow-900/40 to-orange-900/40',
            border: 'border-yellow-500/30',
            icon: 'from-yellow-500 to-orange-500',
            text: 'text-yellow-400',
            badge: 'bg-yellow-900/40 text-yellow-300 border-yellow-500/30'
        };
        return {
            bg: 'from-green-900/40 to-emerald-900/40',
            border: 'border-green-500/30',
            icon: 'from-green-500 to-emerald-500',
            text: 'text-green-400',
            badge: 'bg-green-900/40 text-green-300 border-green-500/30'
        };
    };

    const colors = getColorScheme(score);
    const hasFactors = factors && factors.length > 0;

    return (
        <div className={`rounded-xl bg-gradient-to-br ${colors.bg} border ${colors.border} overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10`}>
            {/* Header */}
            <div
                className={`p-4 ${hasFactors ? 'cursor-pointer hover:bg-gray-800/30' : ''}`}
                onClick={() => hasFactors && setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2.5 bg-gradient-to-br ${colors.icon} rounded-xl shadow-lg`}>
                            <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-white mb-1">{title}</h4>
                            <p className="text-xs text-gray-400">{description}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className={`text-2xl font-bold ${colors.text}`}>{score}</div>
                            {status && <div className="text-xs text-gray-400 mt-0.5">{status}</div>}
                        </div>
                        {hasFactors && (
                            <button className="p-1.5 hover:bg-gray-700/50 rounded-lg transition-colors">
                                {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-gray-400" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Factors */}
            {isExpanded && hasFactors && (
                <div className="px-4 pb-4 space-y-2 bg-gray-900/40 border-t border-gray-700/30">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-3">Contributing Factors</p>
                    {factors.map((factor, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 bg-gray-800/40 rounded-lg border border-gray-700/30">
                            <div className="mt-1">
                                <div className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${colors.icon}`}></div>
                            </div>
                            <span className="text-xs text-gray-300">{factor}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RiskMetricCard;
