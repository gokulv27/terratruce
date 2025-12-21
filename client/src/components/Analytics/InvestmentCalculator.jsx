import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DollarSign, Percent, TrendingUp, Calculator, PieChart, Info, RefreshCw, Wand2, Search, Calendar, LayoutDashboard, Check, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { motion, AnimatePresence } from 'framer-motion';
import LocationSearch from '../Search/LocationSearch';
import { analyzePropertyRisk } from '../../services/api';
import { usePortfolio } from '../../context/PortfolioContext';

const InvestmentCalculator = () => {
    const containerRef = useRef(null);
    const location = useLocation();

    // Default States
    const [purchasePrice, setPurchasePrice] = useState(500000);
    const [downPayment, setDownPayment] = useState(100000);
    const [interestRate, setInterestRate] = useState(6.5);
    const [rentalIncome, setRentalIncome] = useState(3500);
    const [expenses, setExpenses] = useState(1000);
    const [currency, setCurrency] = useState('$');
    const [isAutoEstimated, setIsAutoEstimated] = useState(false);

    useEffect(() => {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz && tz.includes("Kolkata")) setCurrency('₹');
        else if (tz && tz.includes("London")) setCurrency('£');
        else if (tz && tz.includes("Europe")) setCurrency('€');
    }, []);

    const [appreciation, setAppreciation] = useState(3);
    const [projectionYears, setProjectionYears] = useState(5);
    const [analyzing, setAnalyzing] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(location.state?.location || "");
    const { addToPortfolio } = usePortfolio();
    const [saved, setSaved] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [investmentName, setInvestmentName] = useState('');

    const estimateValues = (score) => {
        if (!score) return;
        if (score > 70) {
            setAppreciation(2);
            setInterestRate(7.5);
        } else if (score < 30) {
            setAppreciation(6);
            setInterestRate(5.5);
        } else {
            setAppreciation(4);
            setInterestRate(6.5);
        }
        setIsAutoEstimated(true);
        gsap.fromTo(".auto-est-notice", { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 });
    };

    useEffect(() => {
        if (location.state?.riskScore) {
            estimateValues(location.state.riskScore);
        }
    }, [location.state]);

    const handleDirectSearch = async (locName) => {
        if (!locName) return;
        setAnalyzing(true);
        setCurrentLocation(locName);
        try {
            const data = await analyzePropertyRisk(locName);
            if (data && data.overall_risk_score) {
                estimateValues(data.overall_risk_score);
            }
        } catch (e) {
            console.error("Auto-calc failed", e);
        }
        setAnalyzing(false);
    };

    useGSAP(() => {
        gsap.from(".calc-card", {
            y: 20, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power2.out"
        });
    }, { scope: containerRef });

    const calculateMetrics = () => {
        const loanAmount = purchasePrice - downPayment;
        const monthlyInterest = (interestRate / 100) / 12;
        const numberOfPayments = 30 * 12;
        const mortgagePayment = loanAmount > 0 ? (loanAmount * monthlyInterest * Math.pow(1 + monthlyInterest, numberOfPayments)) / (Math.pow(1 + monthlyInterest, numberOfPayments) - 1) : 0;

        const monthlyCashFlow = rentalIncome - expenses - mortgagePayment;
        const annualCashFlow = monthlyCashFlow * 12;
        const cashOnCashReturn = downPayment > 0 ? (annualCashFlow / downPayment) * 100 : 0;

        const projection = [];
        let currentValue = purchasePrice;
        let cumulativeEquity = downPayment;

        for (let i = 0; i <= projectionYears; i++) {
            const principalPaydownYearly = (mortgagePayment * 12) * 0.3;
            if (i > 0) cumulativeEquity += principalPaydownYearly + (currentValue * (appreciation / 100));

            projection.push({
                year: `Year ${i}`,
                value: Math.round(currentValue),
                equity: Math.round(cumulativeEquity)
            });
            currentValue = currentValue * (1 + appreciation / 100);
        }

        return {
            mortgagePayment: Math.round(mortgagePayment),
            monthlyCashFlow: Math.round(monthlyCashFlow),
            cashOnCashReturn: cashOnCashReturn.toFixed(2),
            projection
        };
    };

    const metrics = calculateMetrics();

    return (
        <div ref={containerRef} className="space-y-6 max-w-7xl mx-auto p-4 md:p-8 font-sans overflow-y-auto h-full custom-scrollbar">

            {/* Header Card */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 calc-card gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-brand-primary to-brand-secondary text-white rounded-2xl shadow-lg shadow-brand-primary/30">
                        <Calculator className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary tracking-tight">Investment ROI Projector</h2>
                        <div className="flex items-center gap-2 h-6">
                            <p className="text-sm text-text-secondary font-bold">Instant Cash Flow Analysis</p>
                            {isAutoEstimated && (
                                <span className="auto-est-notice flex items-center gap-1 text-[10px] bg-brand-secondary/10 text-brand-secondary px-2 py-0.5 rounded-full font-bold border border-brand-secondary/20">
                                    <Wand2 className="h-3 w-3" /> Auto-Tuned
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 w-full md:w-auto relative z-20">
                    <div className="bg-surface border-2 border-border rounded-2xl shadow-md p-3 md:w-80 focus-within:ring-2 focus-within:ring-brand-primary/30 focus-within:border-brand-primary transition-all">
                        <LocationSearch
                            placeholder="Analyze new location..."
                            small
                            onSearch={(name) => handleDirectSearch(name)}
                        />
                    </div>
                    <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="px-5 py-4 bg-surface-elevated border-2 border-border rounded-2xl font-bold text-text-primary outline-none cursor-pointer hover:border-brand-primary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30 transition-all appearance-none text-center w-full md:w-24 shadow-md"
                    >
                        <option value="$">$ USD</option>
                        <option value="₹">₹ INR</option>
                        <option value="€">€ EUR</option>
                        <option value="£">£ GBP</option>
                    </select>

                    <button
                        onClick={() => {
                            setInvestmentName(currentLocation || 'My Investment');
                            setIsModalOpen(true);
                        }}
                        className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 whitespace-nowrap ${saved ? 'bg-green-500 text-white shadow-green-500/40' : 'bg-gradient-to-r from-surface-elevated to-surface border-2 border-border hover:border-brand-primary hover:text-brand-primary hover:shadow-brand-primary/20'}`}
                    >
                        {saved ? <Check className="h-5 w-5" /> : <LayoutDashboard className="h-5 w-5" />}
                        {saved ? 'Saved!' : 'Add to Dashboard'}
                    </button>
                    {analyzing && <div className="absolute top-full text-xs text-brand-primary font-bold mt-2 ml-1">Analyzing Market Data...</div>}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-4 space-y-6">
                    <div className="premium-card p-6 space-y-8 calc-card relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 bg-gradient-to-b from-brand-primary to-brand-secondary h-full" />
                        <div className="relative z-10">
                            <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="p-1.5 bg-brand-primary/10 rounded-lg text-brand-primary"><DollarSign className="h-3 w-3" /></span>
                                Property Specs
                            </h3>
                            <div className="space-y-5">
                                <InputGroup label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} icon={DollarSign} prefix={currency} />
                                <RangeInput value={downPayment} min={0} max={purchasePrice} onChange={setDownPayment} label="Down Payment" currency={currency} />
                                <InputGroup label="Interest Rate" value={interestRate} onChange={setInterestRate} icon={Percent} suffix="%" />
                                <InputGroup label="Appreciation (Yearly)" value={appreciation} onChange={setAppreciation} icon={TrendingUp} suffix="%" />
                            </div>
                        </div>
                        <div className="pt-6 border-t border-border relative z-10">
                            <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="p-1.5 bg-brand-secondary/10 rounded-lg text-brand-secondary"><PieChart className="h-3 w-3" /></span>
                                Cash Flow
                            </h3>
                            <div className="space-y-5">
                                <InputGroup label="Monthly Rent" value={rentalIncome} onChange={setRentalIncome} icon={DollarSign} prefix={currency} />
                                <InputGroup label="Monthly Expenses" value={expenses} onChange={setExpenses} icon={DollarSign} prefix={currency} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-6 lg:sticky lg:top-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ResultCard label="Monthly Cash Flow" value={metrics.monthlyCashFlow} subtext="Net Profit" isCurrency currency={currency} isPositive={metrics.monthlyCashFlow > 0} gradient="from-emerald-500/10 to-teal-500/5" />
                        <ResultCard label="Cash on Cash ROI" value={metrics.cashOnCashReturn} subtext="Annual Return" suffix="%" isPositive={metrics.cashOnCashReturn > 0} gradient="from-blue-500/10 to-cyan-500/5" />
                        <ResultCard label="Mortgage Payment" value={metrics.mortgagePayment} subtext="Principal + Interest" isCurrency currency={currency} neutral gradient="from-slate-500/10 to-gray-500/5" />
                    </div>

                    <div className="bg-surface rounded-3xl border border-border shadow-xl p-6 calc-card flex flex-col relative z-0">
                        <div className="flex items-center justify-between mb-8 z-10">
                            <div>
                                <h3 className="font-bold text-text-primary text-xl">Projected Growth</h3>
                                <p className="text-xs text-text-secondary font-medium mt-1">{projectionYears}-Year Forecast @ <span className="text-brand-primary">{appreciation}%</span> Appreciation</p>
                            </div>
                            <div className="flex items-center gap-3 bg-surface-elevated p-2 rounded-xl border border-border shadow-sm">
                                <Calendar className="h-4 w-4 text-brand-primary" />
                                <input type="range" min="5" max="30" step="1" value={projectionYears} onChange={(e) => setProjectionYears(Number(e.target.value))} className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-primary" />
                                <span className="text-xs font-bold text-text-primary w-12 text-right">{projectionYears} Yrs</span>
                            </div>
                        </div>

                        <div className="w-full h-[400px] z-10 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={metrics.projection} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--border))" opacity={0.3} />
                                    <XAxis
                                        dataKey="year"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'rgb(var(--text-secondary))', fontSize: 11, fontWeight: '600' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'rgb(var(--text-secondary))', fontSize: 11, fontWeight: '600' }}
                                        tickFormatter={(v) => `${currency}${v / 1000}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))', borderRadius: '12px', color: 'rgb(var(--text-primary))' }}
                                        itemStyle={{ color: '#14B8A6' }}
                                        formatter={(v) => [`${currency}${v.toLocaleString()}`, 'Value']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#14B8A6"
                                        strokeWidth={3}
                                        fill="url(#chartGradient)"
                                        fillOpacity={1}
                                        shapeRendering="geometricPrecision"
                                        dot={{ stroke: '#14B8A6', strokeWidth: 2, fill: 'rgb(var(--surface))', r: 5 }}
                                        activeDot={{ r: 7, strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Investment Name Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-surface border-2 border-border rounded-3xl p-8 w-full max-w-md shadow-2xl relative"
                        >
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 p-2 hover:bg-surface-elevated rounded-xl transition-colors"
                            >
                                <X className="h-5 w-5 text-text-secondary" />
                            </button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl">
                                    <LayoutDashboard className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-text-primary">Name Your Investment</h2>
                                    <p className="text-sm text-text-secondary">Create a widget for your dashboard</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-text-secondary ml-1 mb-2 block">
                                        Investment Name
                                    </label>
                                    <input
                                        type="text"
                                        value={investmentName}
                                        onChange={(e) => setInvestmentName(e.target.value)}
                                        placeholder="e.g., Downtown Apartment, Beach House..."
                                        className="w-full px-4 py-3.5 bg-surface-elevated border-2 border-border rounded-xl text-text-primary font-bold focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 transition-all"
                                        autoFocus
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && investmentName.trim()) {
                                                addToPortfolio({
                                                    location: investmentName.trim(),
                                                    purchasePrice,
                                                    monthlyCashFlow: metrics.monthlyCashFlow,
                                                    monthlyCost: expenses + metrics.mortgagePayment,
                                                    currency,
                                                    date: new Date().toISOString()
                                                });
                                                setSaved(true);
                                                setIsModalOpen(false);
                                                setTimeout(() => setSaved(false), 2000);
                                            }
                                        }}
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-6 py-3.5 bg-surface-elevated border-2 border-border rounded-xl font-bold text-text-secondary hover:border-brand-primary hover:text-brand-primary transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (investmentName.trim()) {
                                                addToPortfolio({
                                                    location: investmentName.trim(),
                                                    purchasePrice,
                                                    monthlyCashFlow: metrics.monthlyCashFlow,
                                                    monthlyCost: expenses + metrics.mortgagePayment,
                                                    currency,
                                                    date: new Date().toISOString()
                                                });
                                                setSaved(true);
                                                setIsModalOpen(false);
                                                setTimeout(() => setSaved(false), 2000);
                                            }
                                        }}
                                        disabled={!investmentName.trim()}
                                        className="flex-1 px-6 py-3.5 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                    >
                                        <Check className="h-5 w-5" />
                                        Save to Dashboard
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

const InputGroup = ({ label, value, onChange, icon: Icon, prefix, suffix }) => (
    <div className="space-y-2 group">
        <label className="text-xs font-bold text-text-secondary ml-1 group-focus-within:text-brand-primary transition-colors">{label}</label>
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-brand-primary">
                <Icon className="h-4 w-4" />
            </div>
            <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full pl-10 pr-8 py-3.5 bg-surface-elevated border border-border rounded-xl text-sm font-bold text-text-primary focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all shadow-sm" />
            {prefix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-secondary font-bold opacity-50">{prefix}</span>}
            {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-secondary font-bold opacity-50">{suffix}</span>}
        </div>
    </div>
);

const RangeInput = ({ value, min, max, onChange, label, currency = '$' }) => (
    <div className="space-y-3">
        <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-text-secondary ml-1">{label}</label>
            <span className="text-xs font-black text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-md">{currency}{value.toLocaleString()}</span>
        </div>
        <input type="range" min={min} max={max} step={1000} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-primary hover:accent-brand-secondary transition-all" />
    </div>
);

const ResultCard = ({ label, value, subtext, isCurrency, suffix, isPositive, neutral, currency = '$', gradient }) => (
    <div className={`premium-card p-5 relative overflow-hidden group border hover:border-brand-primary/30 transition-all duration-300 hover:-translate-y-1`}>
        {gradient && <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-100`}></div>}
        <div className="relative z-10">
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2 opacity-70">{label}</p>
            <div className="my-1">
                <span className={`text-3xl font-black tracking-tight ${neutral ? 'text-text-primary' : isPositive ? 'text-green-600' : 'text-red-500'}`}>
                    {isCurrency && currency}{value.toLocaleString()}{suffix}
                </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
                {isPositive && <TrendingUp className="h-3 w-3 text-green-600" />}
                <span className="text-[10px] font-bold text-text-secondary opacity-80">{subtext}</span>
            </div>
        </div>
    </div>
);

export default InvestmentCalculator;