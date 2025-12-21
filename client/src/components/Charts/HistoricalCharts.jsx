import React, { useState } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

/**
 * Historical Charts Component - Dark Theme
 * Displays property trends using Recharts
 */
const HistoricalCharts = ({ data }) => {
    const [activeChart, setActiveChart] = useState('property');

    if (!data || !data.historical_trends) return null;

    const { historical_trends } = data;

    // Custom Tooltip - Dark Theme
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-surface backdrop-blur-sm border border-brand-primary/30 rounded-lg p-3 shadow-xl dark:bg-gray-800/95 dark:border-teal-500/30">
                    <p className="text-text-primary font-semibold text-sm mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-xs" style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const chartTabs = [
        { key: 'property', label: 'Property Values', icon: TrendingUp },
        { key: 'crime', label: 'Crime Trends', icon: Activity },
        { key: 'population', label: 'Population', icon: TrendingUp }
    ];

    return (
        <div className="bg-white border border-border rounded-xl p-5 dark:bg-gray-800/40 dark:border-gray-700/30">
            {/* Chart Tabs */}
            <div className="flex gap-2 mb-5 flex-wrap">
                {chartTabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveChart(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeChart === tab.key
                                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg'
                                : 'bg-surface-elevated text-text-secondary hover:bg-surface-elevated/80 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Property Values Chart */}
            {activeChart === 'property' && historical_trends.property_values && (
                <div>
                    <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-teal-500" />
                        Median Property Values
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={historical_trends.property_values}>
                            <defs>
                                <linearGradient id="propertyGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" opacity={0.3} />
                            <XAxis dataKey="year" stroke="rgb(var(--text-secondary))" style={{ fontSize: '12px' }} />
                            <YAxis stroke="rgb(var(--text-secondary))" style={{ fontSize: '12px' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="median_price"
                                stroke="#14B8A6"
                                strokeWidth={3}
                                fill="url(#propertyGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Crime Trends Chart */}
            {activeChart === 'crime' && historical_trends.crime_trends && (
                <div>
                    <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-red-500" />
                        Crime Rate Per 1,000 Residents
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={historical_trends.crime_trends}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" opacity={0.3} />
                            <XAxis dataKey="year" stroke="rgb(var(--text-secondary))" style={{ fontSize: '12px' }} />
                            <YAxis stroke="rgb(var(--text-secondary))" style={{ fontSize: '12px' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="incidents_per_1000"
                                stroke="#EF4444"
                                strokeWidth={3}
                                dot={{ fill: '#EF4444', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Population Chart */}
            {activeChart === 'population' && historical_trends.population && (
                <div>
                    <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        Population Growth
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={historical_trends.population}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" opacity={0.3} />
                            <XAxis dataKey="year" stroke="rgb(var(--text-secondary))" style={{ fontSize: '12px' }} />
                            <YAxis stroke="rgb(var(--text-secondary))" style={{ fontSize: '12px' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Development Timeline */}
            {historical_trends.development_timeline && historical_trends.development_timeline.length > 0 && (
                <div className="mt-6 pt-5 border-t border-border dark:border-gray-700/30">
                    <h4 className="text-sm font-bold text-text-primary mb-3">Development Timeline</h4>
                    <div className="space-y-2">
                        {historical_trends.development_timeline.map((event, idx) => (
                            <div key={idx} className="flex gap-3 items-start">
                                <div className="flex-shrink-0 w-16 text-xs font-semibold text-teal-600 dark:text-teal-400 mt-1">
                                    {event.year}
                                </div>
                                <div className="flex-1 bg-surface-elevated rounded-lg p-2 border border-border dark:bg-gray-700/30 dark:border-gray-600/30">
                                    {event.major_events && event.major_events.map((evt, eIdx) => (
                                        <p key={eIdx} className="text system-xs text-text-secondary">• {evt}</p>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoricalCharts;
