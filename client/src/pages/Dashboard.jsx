import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { DollarSign, TrendingUp, PieChart, Wallet, ArrowUpRight, Trash2, Building2, Plus, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
    const { portfolio, removeFromPortfolio, getPortfolioSummary, addToPortfolio } = usePortfolio();
    const summary = getPortfolioSummary();
    const displayCurrency = portfolio.length > 0 ? (portfolio[0].currency || '$') : '$';

    // Convert portfolio to chart data
    const chartData = portfolio.map((item, index) => ({
        name: `Inv ${index + 1}`,
        value: Number(item.monthly_cash_flow) || Number(item.monthlyCashFlow) || 0
    })).reverse(); // Oldest first?

    const [isModalOpen, setIsModalOpen] = useState(false);

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
                        <h3 className="font-bold text-text-primary text-lg">Cash Flow Trend</h3>
                        <div className="flex gap-2">
                            <span className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">Yearly View</span>
                        </div>
                    </div>
                    <div className="h-[350px] w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData.length > 0 ? chartData : [{ name: 'Start', value: 0 }, { name: 'Now', value: 0 }]}>
                                <defs>
                                    <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#ffffff', fontSize: 11, fontWeight: '600' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#ffffff', fontSize: 11, fontWeight: '600' }} tickFormatter={(val) => `${displayCurrency}${val}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', background: 'var(--surface)' }}
                                    itemStyle={{ color: 'var(--brand-primary)', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="var(--brand-primary)" fill="url(#colorFlow)" strokeWidth={3} animationDuration={1500} />
                            </AreaChart>
                        </ResponsiveContainer>
                        {chartData.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <p className="text-text-secondary opacity-40 font-bold">Add investments to see trends</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Saved Investments List */}
                <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm flex flex-col h-[500px]">
                    <h3 className="font-bold text-text-primary mb-6 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-brand-secondary" /> Portfolio Assets
                    </h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                        {portfolio.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-3">
                                <Building2 className="h-12 w-12 text-text-secondary" />
                                <p className="text-sm font-medium text-text-secondary">Your portfolio is empty.</p>
                                <button onClick={() => setIsModalOpen(true)} className="text-xs font-bold text-brand-primary hover:underline">Add First Asset</button>
                            </div>
                        ) : (
                            portfolio.map(item => (
                                <div key={item.id} className="group flex items-center justify-between p-4 rounded-2xl bg-surface-elevated hover:bg-gradient-to-r hover:from-brand-primary/5 hover:to-transparent transition-all border border-transparent hover:border-brand-primary/10">
                                    <div className="overflow-hidden">
                                        <h4 className="font-bold text-text-primary truncate">{item.location || item.property_name || "Asset"}</h4>
                                        <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
                                            <span className="text-green-600 font-bold">{item.currency || '$'}{Number(item.monthly_cash_flow || item.monthlyCashFlow).toLocaleString()}/mo</span>
                                            <span className="opacity-30">|</span>
                                            <span>Val: {item.currency || '$'}{Number(item.purchase_price || item.purchasePrice).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFromPortfolio(item.id)}
                                        className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 transform group-hover:scale-110"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))
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
                        <label className="text-xs font-bold text-text-secondary ml-1">Asset Name / Location</label>
                        <input
                            required
                            type="text"
                            className="w-full p-3 bg-surface-elevated border border-border rounded-xl font-bold outline-none focus:border-brand-primary"
                            placeholder="e.g. Downtown Apartment"
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-text-secondary ml-1">Asset Value</label>
                            <input
                                required
                                type="number"
                                className="w-full p-3 bg-surface-elevated border border-border rounded-xl font-bold outline-none focus:border-brand-primary"
                                placeholder="500000"
                                value={formData.purchasePrice}
                                onChange={e => setFormData({ ...formData, purchasePrice: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-text-secondary ml-1">Monthly Expenses</label>
                            <input
                                required
                                type="number"
                                className="w-full p-3 bg-surface-elevated border border-border rounded-xl font-bold outline-none focus:border-brand-primary"
                                placeholder="1000"
                                value={formData.monthlyCost}
                                onChange={e => setFormData({ ...formData, monthlyCost: e.target.value })}
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

export default Dashboard;
