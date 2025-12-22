import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { convertCurrency, formatLargeCurrency } from '../utils/currencyUtils';
import { DollarSign, TrendingUp, PieChart, Wallet, ArrowUpRight, Trash2, Building2, Plus, X, Edit2, Check, Calendar, FileText, MapPin } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, BarChart, Bar, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import LocationSearch from '../components/Search/LocationSearch';

const Dashboard = () => {
    const { portfolio, removeFromPortfolio, getPortfolioSummary, addToPortfolio, renameInPortfolio, updateVisitData, globalCurrency, setGlobalCurrency } = usePortfolio();
    const summary = getPortfolioSummary();
    const displayCurrency = globalCurrency || '$';
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [visitModalOpen, setVisitModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');

    // Data Engineering: Generate 5-Year Wealth Projection
    // Start with current totals and project growth (Asset: 4%, Income: 2%)
    const chartData = Array.from({ length: 6 }, (_, i) => {
        const year = new Date().getFullYear() + i;
        const projectedAssets = summary.totalAssets * Math.pow(1.04, i);
        // Annualize cash flow for scale
        const projectedIncome = (summary.monthlyCashFlow * 12) * Math.pow(1.02, i);

        return {
            name: `${year}`,
            assets: Math.round(projectedAssets),
            income: Math.round(projectedIncome),
            rawAssets: projectedAssets // Keep raw for tooltip precision if needed
        };
    });

    // Performance Matrix Data: Value (X) vs Yield (Y) vs Cash Flow (Z)
    const bubbleData = portfolio.map(item => {
        const price = convertCurrency(Number(item.purchase_price || item.purchasePrice) || 0, item.currency || '$', globalCurrency);
        const monthly = convertCurrency(Number(item.monthly_cash_flow || item.monthlyCashFlow) || 0, item.currency || '$', globalCurrency);
        const annualYield = price > 0 ? ((monthly * 12) / price) * 100 : 0;

        return {
            name: item.property_name || item.location, // Prefer Name
            location: item.location,
            x: price, // Value
            y: Number(annualYield.toFixed(2)), // ROI
            z: monthly, // Size
            // Mock market score 0-100 for color (Green > 60)
            score: Math.floor(Math.random() * 40) + 60
        };
    });

    // Data Engineering: Cash Flow Efficiency (Revenue vs Expenses)
    const flowData = portfolio.map(item => {
        const cashFlow = convertCurrency(Number(item.monthly_cash_flow || item.monthlyCashFlow) || 0, item.currency || '$', globalCurrency);
        const cost = convertCurrency(Number(item.monthly_cost || item.monthlyCost) || 0, item.currency || '$', globalCurrency);
        // Assuming "Monthly Cash Flow" input was NET. So Gross = Net + Cost.
        // If input was Gross, then Net = Input - Cost.
        // Label in Modal says "Est. Net Monthly Cash Flow". So Input is NET.
        // Gross Revenue = Net + Cost.

        return {
            name: item.property_name || item.location || `Inv ${item.id}`,
            Net: cashFlow,
            Expenses: cost,
            Revenue: cashFlow + cost
        };
    }).sort((a, b) => b.Revenue - a.Revenue); // All items by Volume

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-sans pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary tracking-tight">Financial Dashboard</h1>
                    <p className="text-text-secondary font-medium mt-1">Track your net worth and portfolio performance.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-surface-elevated px-4 py-2 rounded-xl shadow-sm border border-border">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-bold text-text-secondary uppercase">Live</span>
                    </div>

                    <div className="flex items-center gap-1 bg-surface-elevated p-1 rounded-xl shadow-sm border border-border">
                        {['$', '₹', '€', '£'].map(c => (
                            <button
                                key={c}
                                onClick={() => setGlobalCurrency(c)}
                                className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${globalCurrency === c
                                    ? 'bg-brand-primary text-white shadow-md'
                                    : 'text-text-secondary hover:bg-brand-primary/10'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-primary/20 hover:scale-105 transition-transform"
                    >
                        <Plus className="h-5 w-5" /> Add Investment
                    </button>
                </div>
            </div>

            {/* Hottest Searches Section */}
            <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-text-primary text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-brand-primary" />
                        Trending Markets
                        <span className="text-xs font-medium text-text-secondary bg-surface-elevated px-2 py-1 rounded-full border border-border">
                            {Intl.DateTimeFormat().resolvedOptions().timeZone.includes("Calcutta") || Intl.DateTimeFormat().resolvedOptions().timeZone.includes("Kolkata") ? "India" : "Global"} Top Picks
                        </span>
                    </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {(Intl.DateTimeFormat().resolvedOptions().timeZone.includes("Calcutta") || Intl.DateTimeFormat().resolvedOptions().timeZone.includes("Kolkata") ?
                        ['Mumbai, Bandra', 'Bangalore, Indiranagar', 'Delhi, Cyber Hub', 'Pune, Koregaon Park', 'Hyderabad, Jubilee Hills', 'Goa, Assagao'] :
                        ['New York, Manhattan', 'London, Soho', 'Dubai, Marina', 'Singapore, Orchard', 'Toronto, Downtown', 'Berlin, Mitte']
                    ).map((city, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-3 bg-surface-elevated rounded-xl border border-transparent hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all cursor-pointer group">
                            <div className="h-2 w-2 rounded-full bg-brand-secondary animate-pulse" />
                            <span className="text-xs font-bold text-text-secondary group-hover:text-brand-primary truncate">{city}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard
                    icon={Wallet}
                    title="Net Worth"
                    value={`${displayCurrency}${summary.totalAssets.toLocaleString()}`}
                    trend="+12.5%"
                    gradient="from-blue-500 to-cyan-500"
                />
                <SummaryCard
                    icon={TrendingUp}
                    title="Monthly Revenue"
                    value={`${displayCurrency}${summary.monthlyCashFlow.toLocaleString()}`}
                    trend="+8.2%"
                    gradient="from-emerald-500 to-teal-500"
                />
                <SummaryCard
                    icon={PieChart}
                    title="Monthly Expenses"
                    value={`${displayCurrency}${summary.monthlyCost.toLocaleString()}`}
                    trend="-2.1%"
                    gradient="from-rose-500 to-pink-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-surface border border-border rounded-3xl p-8 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-brand-secondary opacity-50" />
                    <div className="mb-8 flex justify-between items-center relative z-10">
                        <div>
                            <h3 className="font-bold text-text-primary text-lg">Wealth Forecast</h3>
                            <p className="text-xs text-text-secondary font-medium">Projected Net Worth Growth (5 Years)</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                <span className="text-[10px] font-bold text-blue-600">Assets (+4%)</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[350px] w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={summary.totalAssets > 0 ? chartData : []}>
                                <defs>
                                    <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.5} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--border))" opacity={0.3} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgb(var(--text-primary))', fontSize: 11, fontWeight: '600' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgb(var(--text-primary))', fontSize: 11, fontWeight: '600' }}
                                    tickFormatter={(val) => formatLargeCurrency(val, displayCurrency)}
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip
                                    cursor={{ stroke: 'rgb(var(--border))', strokeWidth: 1 }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-surface border border-border p-4 rounded-2xl shadow-xl">
                                                    <p className="text-xs font-bold text-text-secondary mb-2">{label}</p>
                                                    <div className="space-y-2">
                                                        <div>
                                                            <p className="text-[10px] uppercase font-bold text-blue-500">Net Worth</p>
                                                            <p className="text-lg font-black text-text-primary">
                                                                {displayCurrency}{payload[0].value.toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <div className="pt-2 border-t border-border">
                                                            <p className="text-[10px] uppercase font-bold text-emerald-500">Est. Annual Income</p>
                                                            <p className="text-sm font-bold text-text-primary">
                                                                {displayCurrency}{payload[0].payload.income.toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="assets"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    fill="url(#colorAssets)"
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                        {summary.totalAssets === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <PieChart className="h-10 w-10 text-text-secondary opacity-30 mx-auto mb-2" />
                                    <p className="text-text-secondary opacity-40 font-bold">Add investments to start forecasting</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Saved Investments List (Moved Up) */}
                <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm flex flex-col h-[400px]">
                    <h3 className="font-bold text-text-primary mb-6 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-brand-secondary" /> Portfolio Assets
                    </h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                        {portfolio.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-3">
                                <Building2 className="h-12 w-12 text-text-secondary" />
                                <p className="text-sm font-medium text-text-secondary">No assets found.</p>
                                <button onClick={() => setIsModalOpen(true)} className="text-xs font-bold text-brand-primary hover:underline">Add Asset</button>
                            </div>
                        ) : (
                            portfolio.map(item => (
                                <div key={item.id} className="group flex items-center justify-between p-3 rounded-2xl bg-surface-elevated hover:bg-gradient-to-r hover:from-brand-primary/5 hover:to-transparent transition-all border border-transparent hover:border-brand-primary/10">
                                    <div className="flex-1 overflow-hidden">
                                        {/* Simplified List Item for Compact View */}
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="overflow-hidden">
                                                <h4 className="font-bold text-text-primary truncate text-sm">{item.property_name || item.location}</h4>
                                                <p className="text-[10px] text-text-secondary truncate">{item.location}</p>
                                            </div>
                                            <span className="text-xs font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full ml-2 whitespace-nowrap">
                                                {globalCurrency}{Math.round(convertCurrency(Number(item.monthly_cash_flow), item.currency, globalCurrency)).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-text-secondary mt-1">
                                            <span>Val: {globalCurrency}{Math.round(convertCurrency(Number(item.purchase_price), item.currency, globalCurrency)).toLocaleString()}</span>
                                            {item.last_visited && <span className="text-brand-primary">• Visited: {new Date(item.last_visited).toLocaleDateString()}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                        <button
                                            onClick={() => {
                                                setSelectedAsset(item);
                                                setVisitModalOpen(true);
                                            }}
                                            className="p-1.5 text-text-secondary hover:text-brand-primary bg-surface border border-border rounded-lg"
                                        >
                                            <MapPin className="h-3 w-3" />
                                        </button>
                                        <button
                                            onClick={() => removeFromPortfolio(item.id)}
                                            className="p-1.5 text-text-secondary hover:text-red-500 bg-surface border border-border rounded-lg"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Performance Matrix (Risk/Reward) - Expanded */}
                <div className="lg:col-span-2 bg-surface border border-border rounded-3xl p-6 shadow-sm flex flex-col relative overflow-hidden h-[350px]">
                    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-emerald-500 to-teal-500 opacity-50" />
                    <div className="mb-6 flex justify-between items-end">
                        <div>
                            <h3 className="font-bold text-text-primary text-lg">Performance Matrix</h3>
                            <p className="text-xs text-text-secondary font-medium">Asset Scale vs. Yield Efficiency</p>
                        </div>
                        <div className="text-xs font-bold text-text-secondary bg-surface-elevated px-3 py-1 rounded-full border border-border">
                            Bubble Size = Cash Flow
                        </div>
                    </div>

                    <div className="flex-1 w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" opacity={0.3} />
                                <XAxis
                                    type="number"
                                    dataKey="x"
                                    name="Value"
                                    tick={{ fill: 'rgb(var(--text-secondary))', fontSize: 10 }}
                                    tickFormatter={(val) => formatLargeCurrency(val, displayCurrency)}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="y"
                                    name="Yield"
                                    unit="%"
                                    tick={{ fill: 'rgb(var(--text-secondary))', fontSize: 10 }}
                                />
                                <ZAxis type="number" dataKey="z" range={[100, 1000]} name="Cash Flow" />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-surface border border-border p-3 rounded-xl shadow-lg z-50">
                                                    <p className="font-bold text-sm text-text-primary mb-1">{data.name}</p>
                                                    <div className="space-y-1 text-xs text-text-secondary">
                                                        <p>Value: <span className="text-text-primary font-bold">{displayCurrency}{data.x.toLocaleString()}</span></p>
                                                        <p>Yield: <span className="text-emerald-500 font-bold">{data.y}%</span></p>
                                                        <p>Flow: <span className="text-blue-500 font-bold">{displayCurrency}{data.z.toLocaleString()}/mo</span></p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Scatter name="Assets" data={bubbleData} fill="#10B981" />
                            </ScatterChart>
                        </ResponsiveContainer>
                        {bubbleData.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <p className="text-text-secondary opacity-40 font-bold">Add assets to compare</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Operating Margins (Bar Chart) - Replaces Exposure */}
                <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm flex flex-col h-[350px]">
                    <div className="mb-4">
                        <h3 className="font-bold text-text-primary text-lg">Operating Margins</h3>
                        <p className="text-xs text-text-secondary font-medium">Revenue Breakdown (Top 5 Assets)</p>
                    </div>

                    <div className="flex-1 w-full min-h-0 relative overflow-x-auto custom-scrollbar">
                        <div style={{ width: Math.max(100, flowData.length * 20) + '%', height: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={flowData} margin={{ top: 30, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--border))" opacity={0.3} />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fill: 'rgb(var(--text-secondary))', fontSize: 10, fontWeight: 600 }}
                                        tickFormatter={(val) => val.length > 8 ? val.slice(0, 8) + '...' : val}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                        interval={0}
                                    />
                                    <YAxis
                                        tick={{ fill: 'rgb(var(--text-secondary))', fontSize: 10 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(val) => formatLargeCurrency(val, displayCurrency)}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-surface border border-border p-3 rounded-xl shadow-lg z-50">
                                                        <p className="font-bold text-sm text-text-primary mb-2">{label}</p>
                                                        <div className="space-y-1 text-xs">
                                                            <p className="text-emerald-500 font-bold flex justify-between gap-4">
                                                                <span>Net:</span>
                                                                <span>{displayCurrency}{payload[0].value.toLocaleString()}</span>
                                                            </p>
                                                            <p className="text-red-500 font-bold flex justify-between gap-4">
                                                                <span>Exp:</span>
                                                                <span>{displayCurrency}{payload[1].value.toLocaleString()}</span>
                                                            </p>
                                                            <div className="border-t border-border pt-1 mt-1 text-text-primary font-black flex justify-between gap-4">
                                                                <span>Gross:</span>
                                                                <span>{displayCurrency}{(payload[0].value + payload[1].value).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend
                                        align="right"
                                        verticalAlign="top"
                                        iconType="circle"
                                        wrapperStyle={{ fontSize: '10px', top: 0 }}
                                    />
                                    <Bar dataKey="Net" name="Profit" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} barSize={32} minPointSize={5} />
                                    <Bar dataKey="Expenses" name="Cost" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={32} minPointSize={5} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        {flowData.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <p className="text-text-secondary opacity-40 font-bold text-xs">No data available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Investment Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <AddInvestmentModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onAdd={addToPortfolio}
                    />
                )}
            </AnimatePresence>

            {/* Visit Tracking Modal */}
            <AnimatePresence>
                {visitModalOpen && selectedAsset && (
                    <VisitModal
                        isOpen={visitModalOpen}
                        onClose={() => setVisitModalOpen(false)}
                        asset={selectedAsset}
                        onSave={updateVisitData}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const SummaryCard = ({ icon: Icon, title, value, trend, gradient }) => (
    <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:opacity-20 transition-opacity`} />

        <div className="flex justify-between items-start mb-6 relative z-10">
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
                <Icon className="h-6 w-6" />
            </div>
            <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent text-xs font-black px-2 py-1 rounded-full flex items-center gap-1`}>
                <ArrowUpRight className={`h-3 w-3 text-${gradient.split('-')[1]}-500`} /> {trend}
            </span>
        </div>
        <div className="relative z-10">
            <p className="text-sm font-bold text-text-secondary opacity-70 mb-1 uppercase tracking-wider">{title}</p>
            <h2 className="text-3xl font-black tracking-tight text-text-primary">{value}</h2>
        </div>
    </div>
);

const AddInvestmentModal = ({ isOpen, onClose, onAdd }) => {
    const [formData, setFormData] = useState({
        propertyName: '',
        location: '',
        purchasePrice: '',
        monthlyCashFlow: '',
        monthlyCost: '',
        currency: '$'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onAdd(formData);
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-surface border border-border rounded-3xl p-8 w-full max-w-md shadow-2xl relative"
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-surface-elevated rounded-full transition-colors">
                    <X className="h-5 w-5 text-text-secondary" />
                </button>

                <h2 className="text-2xl font-black text-text-primary mb-6">Add Asset</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-text-secondary ml-1">Asset Name</label>
                        <input
                            required
                            type="text"
                            className="w-full p-3 bg-surface-elevated border border-border rounded-xl font-bold outline-none focus:border-brand-primary"
                            placeholder="e.g. Dream Villa"
                            value={formData.propertyName}
                            onChange={e => setFormData({ ...formData, propertyName: e.target.value })}
                        />
                    </div>

                    <div className="relative z-50">
                        <label className="text-xs font-bold text-text-secondary ml-1">Location</label>
                        <div className="border border-border rounded-xl overflow-hidden focus-within:border-brand-primary transition-all">
                            <LocationSearch
                                placeholder="Search location (e.g. Bandra West)"
                                onSearch={(loc) => setFormData({ ...formData, location: loc })}
                                small
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-text-secondary ml-1">Asset Value</label>
                            <input
                                required
                                min="0"
                                type="number"
                                className="w-full p-3 bg-surface-elevated border border-border rounded-xl font-bold outline-none focus:border-brand-primary"
                                placeholder="500000"
                                value={formData.purchasePrice}
                                onChange={e => setFormData({ ...formData, purchasePrice: Math.max(0, e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-text-secondary ml-1">Monthly Expenses</label>
                            <input
                                required
                                min="0"
                                type="number"
                                className="w-full p-3 bg-surface-elevated border border-border rounded-xl font-bold outline-none focus:border-brand-primary"
                                placeholder="1000"
                                value={formData.monthlyCost}
                                onChange={e => setFormData({ ...formData, monthlyCost: Math.max(0, e.target.value) })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-text-secondary ml-1">Est. Net Monthly Cash Flow</label>
                            <input
                                required
                                type="number"
                                className="w-full p-3 bg-surface-elevated border border-border rounded-xl font-bold outline-none focus:border-brand-primary"
                                placeholder="2000"
                                value={formData.monthlyCashFlow}
                                onChange={e => setFormData({ ...formData, monthlyCashFlow: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-text-secondary ml-1">Currency</label>
                        <div className="flex gap-2 mt-1">
                            {['$', '₹', '€', '£'].map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, currency: c })}
                                    className={`h-10 w-10 rounded-xl font-black transition-all ${formData.currency === c ? 'bg-brand-primary text-white shadow-lg' : 'bg-surface-elevated text-text-secondary hover:bg-brand-primary/10'}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-transform mt-4"
                    >
                        Add to Portfolio
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
};

const VisitModal = ({ isOpen, onClose, asset, onSave }) => {
    const [date, setDate] = useState(asset.last_visited ? new Date(asset.last_visited).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState(asset.visit_notes || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(asset.id, date, notes);
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-surface border border-border rounded-3xl p-8 w-full max-w-md shadow-2xl relative"
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-surface-elevated rounded-full transition-colors">
                    <X className="h-5 w-5 text-text-secondary" />
                </button>

                <h2 className="text-2xl font-black text-text-primary mb-2">Track Visit</h2>
                <p className="text-sm text-text-secondary mb-6 font-medium">Log your physical visit to {asset.location || "Asset"}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-text-secondary ml-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Visit Date
                        </label>
                        <input
                            required
                            type="date"
                            className="w-full p-3 bg-surface-elevated border border-border rounded-xl font-bold outline-none focus:border-brand-primary text-text-primary mt-1"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-text-secondary ml-1 flex items-center gap-1">
                            <FileText className="h-3 w-3" /> Notes / Observations
                        </label>
                        <textarea
                            rows="4"
                            className="w-full p-3 bg-surface-elevated border border-border rounded-xl font-medium outline-none focus:border-brand-primary text-text-primary mt-1 resize-none"
                            placeholder="e.g. Roof looks good, tenant requested painting..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-transform mt-4"
                    >
                        Save Record
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default Dashboard;
