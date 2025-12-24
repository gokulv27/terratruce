import React, { useEffect, useRef } from 'react';
import { Shield, CloudRain, TrendingUp, Wind, Info, Volume2, Sun, Layers, Waves } from 'lucide-react';
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

    // Helper for soil color
    const getSoilColor = (stability) => {
        if (stability === 'High') return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', lightBg: 'from-emerald-50 to-emerald-100' };
        if (stability === 'Moderate') return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', lightBg: 'from-yellow-50 to-yellow-100' };
        return { color: 'text-red-500', bg: 'bg-red-500/10', lightBg: 'from-red-50 to-red-100' };
    };

    const soilColors = getSoilColor(risk.soil_analysis?.stability || 'Moderate');

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
            label: "Noise Level",
            value: risk.noise_data?.score || 50,
            icon: Volume2,
            color: (risk.noise_data?.score || 50) > 50 ? "text-orange-500" : "text-emerald-500",
            bg: (risk.noise_data?.score || 50) > 50 ? "bg-orange-500/10" : "bg-emerald-500/10",
            lightBg: (risk.noise_data?.score || 50) > 50 ? "from-orange-50 to-orange-100" : "from-emerald-50 to-emerald-100",
            text: risk.noise_data?.level || "Moderate",
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
            label: "Soil Stability",
            value: risk.soil_analysis?.stability === 'High' ? 100 : risk.soil_analysis?.stability === 'Moderate' ? 50 : 20, // Visual score
            icon: Layers,
            color: soilColors.color,
            bg: soilColors.bg,
            lightBg: soilColors.lightBg,
            text: risk.soil_analysis?.type || "Unknown",
            direction: "Stability"
        },
        {
            label: "Light Pollution",
            value: risk.light_pollution?.score || 50,
            icon: Sun,
            color: (risk.light_pollution?.score || 50) > 50 ? "text-yellow-600" : "text-indigo-500", // Bright vs Dark
            bg: (risk.light_pollution?.score || 50) > 50 ? "bg-yellow-500/10" : "bg-indigo-500/10",
            lightBg: (risk.light_pollution?.score || 50) > 50 ? "from-yellow-50 to-yellow-100" : "from-indigo-50 to-indigo-100",
            text: `Bortle ${risk.light_pollution?.bortle_scale || '-'}`,
            direction: "Lower is Darker"
        },
        {
            label: "Crime Rate",
            value: risk.crime_rate.score,
            icon: Shield,
            color: risk.crime_rate.score > 50 ? "text-red-500" : "text-emerald-500",
            bg: risk.crime_rate.score > 50 ? "bg-red-500/10" : "bg-emerald-500/10",
            lightBg: risk.crime_rate.score > 50 ? "from-red-50 to-red-100" : "from-emerald-50 to-emerald-100",
            text: risk.crime_rate.trend,
            direction: "Lower is better"
        },
        {
            label: "Growth Potential",
            value: risk.growth_potential.score,
            icon: TrendingUp,
            color: "text-brand-primary",
            bg: "bg-brand-primary/10",
            lightBg: "from-teal-50 to-cyan-100",
            text: risk.growth_potential.forecast,
            direction: "Higher is better"
        }
    ];

    return (
        <div className="space-y-8">
            <div
                ref={containerRef}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
                {metrics.map((metric, idx) => (
                    <div
                        key={idx}
                        onMouseEnter={(e) => hoverScale(e.currentTarget)}
                        className={`relative overflow-hidden rounded-2xl bg-surface border border-border hover:border-brand-primary/50 shadow-lg hover:shadow-xl transition-all duration-300 group dark:bg-gradient-to-br dark:${metric.lightBg} dark:border-white/10`}
                    >
                        {/* Light Mode Gradient Background */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${metric.lightBg} opacity-50 dark:opacity-0 pointer-events-none group-hover:opacity-70 transition-opacity`} />

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
                                <div className={`text-xs font-bold px-3 py-1 rounded-full ${metric.bg} ${metric.color} inline-block shadow-sm`}>
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

            {/* Environmental Detailed Report */}
            {risk.flood_risk && (
                <div className="premium-card p-6 bg-surface overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary" />
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                            <Waves className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-text-primary">Environmental Report</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Flood History</h4>
                                <ul className="list-disc list-inside text-sm text-text-primary space-y-1 marker:text-brand-primary">
                                    {risk.flood_risk.history?.length > 0
                                        ? risk.flood_risk.history.map((h, i) => <li key={i}>{h}</li>)
                                        : <li>No major recent flood events recorded.</li>
                                    }
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Soil & Foundation</h4>
                                <p className="text-sm text-text-primary bg-surface-elevated p-3 rounded-lg border border-border">
                                    <span className="font-bold text-brand-primary">Type:</span> {risk.soil_analysis?.type} <br />
                                    <span className="font-bold text-brand-primary">Concerns:</span> {risk.soil_analysis?.foundation_concerns || "Standard precautions."}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Nearby Water Bodies</h4>
                                <div className="space-y-2">
                                    {risk.flood_risk.nearby_water?.length > 0
                                        ? risk.flood_risk.nearby_water.map((w, i) => (
                                            <div key={i} className="flex items-center justify-between text-sm p-2 bg-surface-elevated rounded-lg">
                                                <span className="text-text-primary font-medium">{w.split(':')[0]}</span>
                                                <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded font-bold">{w.split(':')[1]?.trim() || "Nearby"}</span>
                                            </div>
                                        ))
                                        : <p className="text-sm text-text-secondary italic">No significant water bodies detected nearby.</p>
                                    }
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Pollution Impact</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-3 bg-surface-elevated rounded-lg text-center">
                                        <div className="text-xs text-text-secondary mb-1">Noise Sources</div>
                                        <div className="text-sm font-bold text-text-primary truncate">
                                            {risk.noise_data?.sources?.[0] || "None"}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-surface-elevated rounded-lg text-center">
                                        <div className="text-xs text-text-secondary mb-1">Erosion Risk</div>
                                        <div className={`text-sm font-bold ${risk.flood_risk.erosion_risk === 'High' ? 'text-red-500' : 'text-green-500'}`}>
                                            {risk.flood_risk.erosion_risk || "Low"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisualMetrics;
