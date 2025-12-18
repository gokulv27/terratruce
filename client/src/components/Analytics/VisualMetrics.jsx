import React, { useEffect, useRef } from 'react';
import { Shield, CloudRain, Users, TrendingUp, AlertTriangle, Wind, Info } from 'lucide-react';
import { staggerList, hoverScale } from '../../utils/designUtils';

const VisualMetrics = ({ data }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current) {
            staggerList(containerRef.current.children, 0.2);
        }
    }, [data]);

    if (!data || !data.risk_analysis) return null;

    const risk = data.risk_analysis;

    const metrics = [
        {
            label: "Flood Risk",
            value: risk.flood_risk.score,
            icon: CloudRain,
            color: risk.flood_risk.score > 50 ? "text-red-500" : "text-emerald-500",
            bg: risk.flood_risk.score > 50 ? "bg-red-500/10" : "bg-emerald-500/10",
            lightBg: risk.flood_risk.score > 50 ? "from-red-50 to-red-100" : "from-emerald-50 to-emerald-100",
            text: risk.flood_risk.level,
            direction: "Lower is better"
        },
        {
            label: "Crime Rate",
            value: risk.crime_rate.score,
            icon: Shield,
            color: risk.crime_rate.score > 50 ? "text-red-500" : "text-emerald-500",
            bg: risk.crime_rate.score > 50 ? "bg-red-500/10" : "bg-emerald-500/10",
            lightBg: risk.crime_rate.score > 50 ? "from-red-50 to-red-100" : "from-emerald-50 to-emerald-100",
            text: `${risk.crime_rate.rate_per_1000}/1k Residents`,
            direction: "Lower is better"
        },
        {
            label: "Air Quality",
            value: risk.air_quality.score,
            icon: Wind,
            color: risk.air_quality.score < 50 ? "text-orange-500" : "text-emerald-500",
            bg: risk.air_quality.score < 50 ? "bg-orange-500/10" : "bg-emerald-500/10",
            lightBg: risk.air_quality.score < 50 ? "from-orange-50 to-orange-100" : "from-emerald-50 to-emerald-100",
            text: `AQI ${risk.air_quality.aqi}`,
            direction: "Higher is better"
        },
        {
            label: "Growth Potential",
            value: risk.growth_potential.score,
            icon: TrendingUp,
            color: "text-brand-primary",
            bg: "bg-brand-primary/10",
            lightBg: "from-purple-50 to-purple-100",
            text: risk.growth_potential.forecast,
            direction: "Higher is better"
        }
    ];

    return (
        <div className="space-y-6">
            <div
                ref={containerRef}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
                {metrics.map((metric, idx) => (
                    <div
                        key={idx}
                        onMouseEnter={(e) => hoverScale(e.currentTarget)}
                        className={`relative overflow-hidden rounded-2xl bg-surface border border-border hover:border-brand-primary/50 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-gradient-to-br dark:${metric.lightBg} dark:border-white/10`}
                    >
                        {/* Light Mode Gradient Background */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${metric.lightBg} opacity-50 dark:opacity-0 pointer-events-none`} />

                        <div className="relative p-5 flex flex-col items-center text-center space-y-3">
                            <div className={`p-3 rounded-xl ${metric.bg} ${metric.color} shadow-sm ring-1 ring-inset ring-black/5`}>
                                <metric.icon className="h-6 w-6" />
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-text-primary mb-1">{metric.label}</h4>
                                <div className="text-xs text-text-secondary font-medium tracking-wide uppercase">{metric.direction}</div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-2xl font-black text-text-primary tracking-tight">
                                    {metric.value}<span className="text-sm font-medium text-text-secondary ml-0.5">/100</span>
                                </div>
                                <div className={`text-xs font-bold px-2 py-1 rounded-full ${metric.bg} ${metric.color} inline-block`}>
                                    {metric.text}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Aesthetic Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 p-4 bg-surface-elevated/50 rounded-xl border border-border/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                    <Info className="h-3.5 w-3.5" />
                    <span>Score Guide:</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    <span className="text-xs text-text-secondary">Safe/Excellent</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
                    <span className="text-xs text-text-secondary">Moderate/Warning</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                    <span className="text-xs text-text-secondary">High Risk/Poor</span>
                </div>
            </div>
        </div>
    );
};

export default VisualMetrics;
