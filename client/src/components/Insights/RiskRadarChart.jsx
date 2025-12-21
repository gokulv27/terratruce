import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingUp, Home } from 'lucide-react';

const RiskRadarChart = ({ riskAnalysis }) => {
    if (!riskAnalysis) return null;

    // Investment-focused metrics
    const investmentData = [
        {
            metric: 'Buying Safety',
            current: 100 - (riskAnalysis.buying_risk?.score || 50),
            average: 65,
            ideal: 85,
        },
        {
            metric: 'Flood Safety',
            current: 100 - (riskAnalysis.flood_risk?.score || 50),
            average: 70,
            ideal: 90,
        },
        {
            metric: 'Growth Potential',
            current: riskAnalysis.growth_potential?.score || 50,
            average: 55,
            ideal: 75,
        },
        {
            metric: 'Amenities Access',
            current: riskAnalysis.amenities?.score || 50,
            average: 60,
            ideal: 80,
        },
        {
            metric: 'Environmental',
            current: 100 - (riskAnalysis.environmental_hazards?.score || 50),
            average: 75,
            ideal: 90,
        }
    ];

    // Livability-focused metrics
    const livabilityData = [
        {
            metric: 'Renting Viability',
            current: 100 - (riskAnalysis.renting_risk?.score || 50),
            average: 62,
            ideal: 85,
        },
        {
            metric: 'Safety & Crime',
            current: 100 - (riskAnalysis.crime_rate?.score || 50),
            average: 60,
            ideal: 85,
        },
        {
            metric: 'Air Quality',
            current: riskAnalysis.air_quality?.score || 50,
            average: 55,
            ideal: 80,
        },
        {
            metric: 'Transportation',
            current: riskAnalysis.transportation?.score || 50,
            average: 58,
            ideal: 75,
        },
        {
            metric: 'Neighbourhood',
            current: riskAnalysis.neighbourhood?.score || 50,
            average: 65,
            ideal: 80,
        }
    ];

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-surface border-2 border-brand-primary rounded-xl p-4 shadow-2xl backdrop-blur-sm">
                    <p className="text-sm font-bold text-text-primary mb-2">{data.metric}</p>
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-teal-500 shadow-sm"></div>
                                <span className="text-xs text-text-secondary font-medium">Current:</span>
                            </div>
                            <span className="text-sm font-bold text-teal-600">{data.current.toFixed(0)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
                                <span className="text-xs text-text-secondary font-medium">Average:</span>
                            </div>
                            <span className="text-sm font-bold text-blue-600">{data.average}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                                <span className="text-xs text-text-secondary font-medium">Ideal:</span>
                            </div>
                            <span className="text-sm font-bold text-green-600">{data.ideal}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const RadarChartComponent = ({ data, title, subtitle, icon: Icon, gradientFrom, gradientTo }) => (
        <div className={`w-full bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-2xl p-6 border-2 border-border shadow-2xl hover:shadow-3xl transition-shadow duration-300`}>
            <div className="mb-4 flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-text-primary">{title}</h3>
                    <p className="text-xs text-text-secondary">{subtitle}</p>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={380}>
                <RadarChart data={data}>
                    <PolarGrid
                        stroke="rgb(var(--border))"
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                        gridType="polygon"
                    />

                    <PolarAngleAxis
                        dataKey="metric"
                        tick={{
                            fill: 'rgb(var(--text-primary))',
                            fontSize: 12,
                            fontWeight: 700
                        }}
                        tickLine={false}
                    />

                    <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{
                            fill: 'rgb(var(--text-secondary))',
                            fontSize: 10,
                            fontWeight: 600
                        }}
                        tickCount={6}
                        axisLine={{ stroke: 'rgb(var(--border))', strokeWidth: 2 }}
                    />

                    {/* Layer 3: Ideal Target */}
                    <Radar
                        name="Ideal"
                        dataKey="ideal"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.12}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        animationDuration={2000}
                        animationBegin={400}
                    />

                    {/* Layer 2: Market Average */}
                    <Radar
                        name="Average"
                        dataKey="average"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.22}
                        strokeWidth={2.5}
                        dot={{
                            r: 3,
                            fill: '#3b82f6',
                            stroke: '#fff',
                            strokeWidth: 1.5
                        }}
                        animationDuration={1800}
                        animationBegin={200}
                    />

                    {/* Layer 1: Current Score */}
                    <Radar
                        name="Current"
                        dataKey="current"
                        stroke="#14b8a6"
                        fill="#14b8a6"
                        fillOpacity={0.45}
                        strokeWidth={3.5}
                        dot={{
                            r: 6,
                            fill: '#14b8a6',
                            stroke: '#fff',
                            strokeWidth: 2.5
                        }}
                        animationDuration={1500}
                        animationBegin={0}
                    />

                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{
                            paddingTop: '16px',
                            fontSize: '12px',
                            fontWeight: 700
                        }}
                        iconType="circle"
                    />
                </RadarChart>
            </ResponsiveContainer>

            {/* Compact Legend */}
            <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-1 p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                    <div className="w-3 h-3 rounded-full bg-teal-500 shadow-md"></div>
                    <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300">Current</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-md"></div>
                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">Average</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="w-3 h-3 rounded-full bg-green-500 shadow-md"></div>
                    <span className="text-[10px] font-bold text-green-700 dark:text-green-300">Ideal</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Investment Metrics Chart */}
            <RadarChartComponent
                data={investmentData}
                title="Investment Risk Analysis"
                subtitle="Financial viability & long-term value metrics"
                icon={TrendingUp}
                gradientFrom="from-teal-50/50"
                gradientTo="to-cyan-50/50 dark:from-teal-900/10 dark:to-cyan-900/10"
            />

            {/* Livability Metrics Chart */}
            <RadarChartComponent
                data={livabilityData}
                title="Livability & Quality of Life"
                subtitle="Daily living comfort & community wellness metrics"
                icon={Home}
                gradientFrom="from-blue-50/50"
                gradientTo="to-cyan-50/50 dark:from-blue-900/10 dark:to-cyan-900/10"
            />

            {/* Overall Score Interpretation */}
            <div className="bg-surface-elevated rounded-xl p-4 border border-border">
                <h4 className="text-sm font-bold text-text-primary mb-3">Score Interpretation Guide</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-text-secondary font-semibold">80-100: Excellent</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-text-secondary font-semibold">60-79: Good</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span className="text-text-secondary font-semibold">40-59: Average</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-text-secondary font-semibold">0-39: Needs Attention</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiskRadarChart;
