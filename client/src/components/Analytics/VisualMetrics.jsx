import React from 'react';
import { Shield, TrendingUp, Activity, Target, Award } from 'lucide-react';

/**
 * Advanced Visual Metrics Component - Dark Theme
 * Super fancy analytics cards with animated progress bars and gradients
 */
const VisualMetrics = ({ data }) => {
    if (!data || !data.risk_analysis) return null;

    const { risk_analysis } = data;

    // Calculate overall health score (inverse of risk)
    const healthScore = 100 - (risk_analysis.overall_score || 50);

    // Advanced metrics to display
    const metrics = [
        {
            label: 'Property Health',
            value: healthScore,
            icon: Shield,
            gradient: 'from-emerald-500 to-teal-500',
            lightBg: 'from-emerald-900/30 to-teal-900/30',
            glowColor: '34, 197, 94' // RGB for emerald-500
        },
        {
            label: 'Growth Potential',
            value: risk_analysis.growth_potential?.score || 50,
            icon: TrendingUp,
            gradient: 'from-blue-500 to-indigo-500',
            lightBg: 'from-blue-900/30 to-indigo-900/30',
            glowColor: '59, 130, 246' // RGB for blue-500
        },
        {
            label: 'Political Stability',
            value: risk_analysis.political_stability?.score || 50,
            icon: Target,
            gradient: 'from-purple-500 to-pink-500',
            lightBg: 'from-purple-900/30 to-pink-900/30',
            glowColor: '168, 85, 247' // RGB for purple-500
        },
        {
            label: 'Livability Score',
            value: risk_analysis.neighbourhood?.score || 50,
            icon: Award,
            gradient: 'from-orange-500 to-red-500',
            lightBg: 'from-orange-900/30 to-red-900/30',
            glowColor: '249, 115, 22' // RGB for orange-500
        }
    ];

    return (
        <div className="grid grid-cols-2 gap-4">
            {metrics.map((metric, idx) => {
                const Icon = metric.icon;
                const percentage = metric.value;

                return (
                    <div
                        key={idx}
                        className={`relative overflow-hidden rounded-2xl bg-surface border border-border hover:border-brand-primary/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] dark:bg-gradient-to-br dark:${metric.lightBg} dark:border-white/10`}
                    >
                        {/* Background Pattern (Dark only) */}
                        <div className="absolute inset-0 opacity-0 dark:opacity-10 pointer-events-none">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                        </div>

                        {/* Content */}
                        <div className="relative p-5">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2.5 rounded-xl shadow-md bg-gradient-to-br ${metric.gradient}`}>
                                    <Icon className="h-5 w-5 text-white" />
                                </div>
                                <div className="text-right">
                                    <div className={`text-3xl font-black bg-gradient-to-br ${metric.gradient} bg-clip-text text-transparent`}>
                                        {percentage}
                                    </div>
                                </div>
                            </div>

                            {/* Label */}
                            <h4 className="text-sm font-bold text-text-primary dark:text-gray-100 mb-3">{metric.label}</h4>

                            {/* Animated Progress Bar */}
                            <div className="relative h-3 bg-surface-elevated dark:bg-gray-700/50 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${metric.gradient} rounded-full transition-all duration-1000 ease-out shadow-lg`}
                                    style={{
                                        width: `${percentage}%`,
                                        animation: 'slideIn 1.5s ease-out'
                                    }}
                                >
                                    {/* Shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                                </div>
                            </div>

                            {/* Status Text */}
                            <div className="mt-2 text-xs font-semibold text-text-secondary dark:text-gray-400">
                                {percentage >= 75 ? 'Excellent' : percentage >= 50 ? 'Good' : percentage >= 25 ? 'Fair' : 'Poor'}
                            </div>
                        </div>
                    </div>
                );
            })}

            <style jsx="true">{`
        @keyframes slideIn {
          from {
            width: 0%;
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
        </div>
    );
};

export default VisualMetrics;
