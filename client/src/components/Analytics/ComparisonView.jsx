import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2, Trash2, ArrowRight, Shield, TrendingUp, AlertTriangle, Zap, MapPin } from 'lucide-react';
import { useComparison } from '../../context/ComparisonContext';

const MetricRow = ({ label, icon: Icon, data, formatValue, highlightBest = false, lowerIsBetter = false, index }) => {
    // Determine winner if highlighting is enabled
    let bestIndex = -1;
    if (highlightBest && data.length > 1) {
        const values = data.map(d => typeof d.value === 'number' ? d.value : -1);
        if (values.every(v => v !== -1)) {
            if (lowerIsBetter) {
                const min = Math.min(...values);
                bestIndex = values.indexOf(min);
            } else {
                const max = Math.max(...values);
                bestIndex = values.indexOf(max);
            }
        }
    }

    return (
        <div className={`grid grid-cols-[200px_1fr] border-b border-border transition-colors ${index % 2 === 0 ? 'bg-surface' : 'bg-surface-elevated/10'} hover:bg-surface-elevated/30`}>
            <div className="p-4 flex items-center gap-3 font-semibold text-text-secondary border-r border-border">
                {Icon && <Icon className="h-4 w-4 text-brand-primary/80" />}
                {label}
            </div>
            <div className="flex overflow-visible">
                {data.map((item, idx) => (
                    <div
                        key={idx}
                        className={`flex-1 min-w-[200px] p-4 border-r border-border last:border-r-0 flex items-center justify-center font-medium transition-colors
                            ${bestIndex === idx
                                ? 'bg-emerald-500/5 text-emerald-500 font-bold shadow-[inset_0_0_15px_rgba(16,185,129,0.05)]'
                                : 'text-text-primary'}
                        `}
                    >
                        {formatValue ? formatValue(item.value) : item.value}
                        {bestIndex === idx && (
                            <span className="ml-2 flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500 text-white text-[10px] shadow-sm animate-in fade-in zoom-in duration-300">
                                ✓
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const ComparisonView = () => {
    const { comparedProperties, removeFromCompare, clearComparison, isCompareVisible, setIsCompareVisible } = useComparison();
    const [isMaximized, setIsMaximized] = useState(false);

    // Helper to extract metric safe
    const getMetric = (property, path) => {
        const parts = path.split('.');
        let val = property;
        for (const p of parts) val = val?.[p];
        return val;
    };

    // Metrics Configuration
    const metrics = [
        { label: 'Risk Score', icon: Shield, path: 'risk_analysis.overall_score', format: v => `${v}/100`, highlight: true, lowerIsBetter: false },
        { label: 'Buying Risk', icon: TrendingUp, path: 'risk_analysis.buying_risk.score', format: v => `${v}/100`, highlight: true, lowerIsBetter: true },
        { label: 'Renting Risk', icon: TrendingUp, path: 'risk_analysis.renting_risk.score', format: v => `${v}/100`, highlight: true, lowerIsBetter: true },
        { label: 'Crime Safety', icon: AlertTriangle, path: 'risk_analysis.crime_rate.score', format: v => `${v}/100`, highlight: true, lowerIsBetter: false },
        { label: 'Appreciation', icon: Zap, path: 'risk_analysis.growth_potential.score', format: v => `${v}%`, highlight: true, lowerIsBetter: false },
        { label: 'Walk Score', icon: MapPin, path: 'risk_analysis.amenities.score', format: v => v, highlight: true, lowerIsBetter: false },
    ];

    const toggleMaximize = () => setIsMaximized(!isMaximized);
    const close = () => setIsCompareVisible(false);

    return (
        <AnimatePresence>
            {isCompareVisible && (
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className={`fixed z-50 bg-background border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.3)] flex flex-col
                        ${isMaximized ? "inset-0" : "bottom-0 left-0 right-0 max-h-[60vh]"}
                    `}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border bg-surface shrink-0 z-20 relative">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 rounded-lg border border-brand-primary/20">
                                <Shield className="h-5 w-5 text-brand-primary" />
                                <span className="font-bold text-brand-primary">Comparison Analysis</span>
                                <span className="bg-brand-primary text-white text-xs px-2 py-0.5 rounded-full shadow-sm">{comparedProperties.length}</span>
                            </div>
                            {comparedProperties.length > 0 && (
                                <button onClick={clearComparison} className="text-xs text-text-secondary hover:text-red-500 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-red-500/10">
                                    <Trash2 className="h-3 w-3" /> Clear All
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={toggleMaximize} className="p-2 hover:bg-surface-elevated rounded-lg text-text-secondary transition-colors" title={isMaximized ? "Minimize" : "Full Screen"}>
                                {isMaximized ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                            </button>
                            <button onClick={close} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-text-secondary transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content - Horizontal Scrollable Area */}
                    <div className="flex-1 overflow-auto bg-background custom-scrollbar">
                        {comparedProperties.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-text-secondary">
                                <p>No properties selected for comparison.</p>
                                <button onClick={close} className="mt-4 text-brand-primary font-bold hover:underline">Close</button>
                            </div>
                        ) : (
                            <div className="min-w-fit">
                                {/* Header Row (Locations) */}
                                <div className="grid grid-cols-[200px_1fr] sticky top-0 z-10 bg-surface shadow-sm border-b border-border">
                                    <div className="p-5 font-bold text-text-primary flex items-center border-r border-border bg-surface shadow-[4px_0_10px_rgba(0,0,0,0.02)] z-20">
                                        Property / Metric
                                    </div>
                                    <div className="flex">
                                        {comparedProperties.map((prop, idx) => (
                                            <div key={idx} className="flex-1 min-w-[200px] p-5 border-r border-border last:border-r-0 relative group bg-surface hover:bg-surface-elevated/20 transition-colors">
                                                <div className="font-bold text-lg text-text-primary mb-1 line-clamp-1 flex items-center gap-2" title={prop.location_info.formatted_address}>
                                                    <div className="h-2 w-2 rounded-full bg-brand-primary"></div>
                                                    {prop.location_info.region || prop.location_info.formatted_address.split(',')[0]}
                                                </div>
                                                <div className="text-xs text-text-secondary mb-3 line-clamp-1 pl-4">{prop.location_info.formatted_address}</div>

                                                <button
                                                    onClick={() => removeFromCompare(prop.location_info.formatted_address)}
                                                    className="absolute top-3 right-3 text-text-secondary hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>

                                                {/* Color Bar at bottom of header cell */}
                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-primary/0 via-brand-primary/50 to-brand-primary/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Metric Rows */}
                                <div className="bg-surface">
                                    {metrics.map((metric, idx) => {
                                        const rowData = comparedProperties.map(p => ({ value: getMetric(p, metric.path) }));
                                        return (
                                            <MetricRow
                                                key={idx}
                                                index={idx}
                                                label={metric.label}
                                                icon={metric.icon}
                                                data={rowData}
                                                formatValue={metric.format}
                                                highlightBest={metric.highlight}
                                                lowerIsBetter={metric.lowerIsBetter}
                                            />
                                        );
                                    })}
                                </div>

                                {/* Summary / Action Row */}
                                <div className="grid grid-cols-[200px_1fr] border-b border-border bg-surface-elevated/5">
                                    <div className="p-4 font-bold text-text-secondary border-r border-border flex items-center">
                                        Action
                                    </div>
                                    <div className="flex">
                                        {comparedProperties.map((prop, idx) => (
                                            <div key={idx} className="flex-1 min-w-[200px] p-4 border-r border-border last:border-r-0 flex justify-center">
                                                <button className="text-sm font-bold text-white bg-brand-primary hover:bg-brand-secondary px-6 py-2 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 transform active:scale-95">
                                                    Full Report <ArrowRight className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ComparisonView;
