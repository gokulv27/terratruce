import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DollarSign, Percent, TrendingUp, Calculator, PieChart, Info, RefreshCw, Wand2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const InvestmentCalculator = () => {
    const containerRef = useRef(null);
    const location = useLocation();

    // Default States
    const [purchasePrice, setPurchasePrice] = useState(500000);
    const [downPayment, setDownPayment] = useState(100000);
    const [interestRate, setInterestRate] = useState(6.5);
    const [rentalIncome, setRentalIncome] = useState(3500);
    const [expenses, setExpenses] = useState(1000);
    const [appreciation, setAppreciation] = useState(3);
    const [isAutoEstimated, setIsAutoEstimated] = useState(false);

    // Auto-Estimate based on Incoming Risk Data
    useEffect(() => {
        if (location.state?.riskScore || location.state?.location) {
            const score = location.state.riskScore || 50; // Default if only location passed

            // Heuristic Logic:
            // High Risk (>70) = Low Appreciation, High Interest Rate (Simulated Risk Premium)
            // Low Risk (<30) = High Appreciation, Low Interest

            if (score > 70) {
                setAppreciation(2); // Stagnant
                setInterestRate(7.5);
            } else if (score < 30) {
                setAppreciation(6); // Booming
                setInterestRate(5.5);
            } else {
                setAppreciation(4); // Average
                setInterestRate(6.5);
            }
            setIsAutoEstimated(true);

            // Animate notice
            gsap.fromTo(".auto-est-notice",
                { y: -20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, delay: 0.5 }
            );
        }
    }, [location.state]);

    useGSAP(() => {
        gsap.from(".calc-card", {
            y: 20,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out"
        });

        gsap.from(".result-value", {
            textContent: 0,
            duration: 1.5,
            ease: "power1.out",
            snap: { textContent: 1 },
            stagger: 0.2,
        });
    }, { scope: containerRef });

    const calculateMetrics = () => {
        const loanAmount = purchasePrice - downPayment;
        const monthlyInterest = (interestRate / 100) / 12;
        const numberOfPayments = 30 * 12;
        const mortgagePayment = (loanAmount * monthlyInterest * Math.pow(1 + monthlyInterest, numberOfPayments)) / (Math.pow(1 + monthlyInterest, numberOfPayments) - 1);

        const monthlyCashFlow = rentalIncome - expenses - mortgagePayment;
        const annualCashFlow = monthlyCashFlow * 12;
        const cashOnCashReturn = (annualCashFlow / downPayment) * 100;

        // 5 Year Projection
        const projection = [];
        let currentValue = purchasePrice;
        for (let i = 0; i <= 5; i++) {
            projection.push({
                year: `Year ${i}`,
                value: Math.round(currentValue),
                equity: Math.round(downPayment + (currentValue - purchasePrice) + (mortgagePayment * 12 * i * 0.3)) // Rough equity approx
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
        <div ref={containerRef} className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-8 calc-card">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-primary text-white rounded-xl shadow-lg shadow-brand-primary/20">
                        <Calculator className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-text-primary tracking-tight">Investment Projector</h2>
                        <div className="flex items-center gap-2">
                            <p className="text-sm text-text-secondary">Real-time ROI & Equity Forecast</p>
                            {isAutoEstimated && (
                                <span className="auto-est-notice flex items-center gap-1 text-[10px] bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded-full font-bold border border-brand-accent/20">
                                    <Wand2 className="h-3 w-3" /> AI Estimated based on {location.state?.location || "Risk Profile"}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => { setPurchasePrice(500000); setDownPayment(100000); setIsAutoEstimated(false); }}
                    className="p-2 text-text-secondary hover:text-brand-primary hover:bg-surface-elevated rounded-lg transition-colors"
                    title="Reset Defaults"
                >
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left Column: Data Entry */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl space-y-8 calc-card relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 bg-brand-primary h-full" />

                        <div>
                            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-brand-primary" /> Property Details
                            </h3>
                            <div className="space-y-5">
                                <InputGroup label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} icon={DollarSign} prefix="$" />
                                <RangeInput value={downPayment} min={0} max={purchasePrice} onChange={setDownPayment} label="Down Payment" />
                                <InputGroup label="Interest Rate" value={interestRate} onChange={setInterestRate} icon={Percent} suffix="%" />
                                <InputGroup label="Appreciation (Yearly)" value={appreciation} onChange={setAppreciation} icon={TrendingUp} suffix="%" />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-border">
                            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                                <PieChart className="h-4 w-4 text-brand-secondary" /> Income & Expenses
                            </h3>
                            <div className="space-y-5">
                                <InputGroup label="Monthly Rent" value={rentalIncome} onChange={setRentalIncome} icon={DollarSign} prefix="$" />
                                <InputGroup label="Monthly Costs" value={expenses} onChange={setExpenses} icon={DollarSign} prefix="$" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Dashboard (Sticky) */}
                <div className="lg:col-span-8 space-y-6 lg:sticky lg:top-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ResultCard
                            label="Monthly Cash Flow"
                            value={metrics.monthlyCashFlow}
                            subtext="Net Profit/Month"
                            isCurrency
                            isPositive={metrics.monthlyCashFlow > 0}
                        />
                        <ResultCard
                            label="Cash on Cash ROI"
                            value={metrics.cashOnCashReturn}
                            subtext="Annual Return"
                            suffix="%"
                            isPositive={metrics.cashOnCashReturn > 0}
                        />
                        <ResultCard
                            label="Monthly Payment"
                            value={metrics.mortgagePayment}
                            subtext="Principal + Interest"
                            isCurrency
                            neutral
                        />
                    </div>

                    {/* Chart Section */}
                    <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl calc-card min-h-[400px] flex flex-col relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8 z-10">
                            <div>
                                <h3 className="font-bold text-text-primary text-lg">5-Year Value Projection</h3>
                                <p className="text-xs text-text-secondary">Estimated equity buildup over time</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium">
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-brand-primary" /> Property Value</span>
                            </div>
                        </div>

                        <div className="flex-1 w-full min-h-[300px] z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={metrics.projection} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={(value) => `$${value / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--surface)',
                                            borderColor: 'var(--border)',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                        }}
                                        itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                                        formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="var(--brand-primary)"
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                        strokeWidth={3}
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Bg Decoration */}
                        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-brand-primary/5 to-transparent pointer-events-none" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const InputGroup = ({ label, value, onChange, icon: Icon, prefix, suffix }) => (
    <div className="space-y-2 group">
        <label className="text-xs font-semibold text-text-secondary ml-1 group-focus-within:text-brand-primary transition-colors">{label}</label>
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-brand-primary transition-colors">
                <Icon className="h-4 w-4" />
            </div>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full pl-10 pr-8 py-3 bg-surface-elevated border border-border rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:border-brand-primary focus:bg-surface focus:ring-4 focus:ring-brand-primary/10 transition-all shadow-sm"
            />
            {prefix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-secondary font-bold opacity-50">{prefix}</span>}
            {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-secondary font-bold opacity-50">{suffix}</span>}
        </div>
    </div>
);

const RangeInput = ({ value, min, max, onChange, label }) => (
    <div className="space-y-2">
        <div className="flex justify-between">
            <label className="text-xs font-semibold text-text-secondary ml-1">{label}</label>
            <span className="text-xs font-bold text-brand-primary">${value.toLocaleString()}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={1000}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-brand-primary"
        />
    </div>
);

const ResultCard = ({ label, value, subtext, isCurrency, suffix, isPositive, neutral }) => (
    <div className="calc-card bg-surface border border-border rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
        <div className={`absolute right-0 top-0 w-24 h-24 bg-gradient-to-br ${neutral ? 'from-blue-500/10' : isPositive ? 'from-green-500/10' : 'from-red-500/10'} to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`} />

        <div className="relative z-10">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">{label}</p>
            <div className="my-2">
                <span className={`text-3xl font-black tracking-tighter ${neutral ? 'text-text-primary' : isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isCurrency && '$'}<span className="result-value">{value.toLocaleString()}</span>{suffix}
                </span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className={`p-0.5 rounded-full ${isPositive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-text-secondary'}`}>
                    <TrendingUp className="h-3 w-3" />
                </div>
                <span className="text-[10px] font-medium text-text-secondary">{subtext}</span>
            </div>
        </div>
    </div>
);

export default InvestmentCalculator;
