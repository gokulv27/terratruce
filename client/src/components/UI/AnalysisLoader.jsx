import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Activity, Shield, TrendingUp, Search, Globe } from 'lucide-react';

const loadingSteps = [
    { text: "Establishing satellite connection...", icon: Globe },
    { text: "Scanning regional data sources...", icon: Search },
    { text: "Analyzing crime and safety reports...", icon: Shield },
    { text: "Computing market trends (2019-2024)...", icon: TrendingUp },
    { text: "Finalizing risk assessment metrics...", icon: Activity }
];

const AnalysisLoader = () => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Reduced interval to 800ms to feel more responsive/accurate to "wait time"
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
        }, 800);

        return () => clearInterval(interval);
    }, []);

    const StepIcon = loadingSteps[currentStep].icon;

    return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
            <div className="relative mb-8">
                {/* Spinning Rings */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-4 border-t-brand-primary border-r-transparent border-b-brand-secondary border-l-transparent w-24 h-24"
                />
                <motion.div
                    animate={{ rotate: -180 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-2 rounded-full border-4 border-t-brand-secondary/50 border-r-transparent border-b-brand-primary/50 border-l-transparent w-20 h-20"
                />

                {/* Center Icon */}
                <div className="w-24 h-24 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                        >
                            <StepIcon className="h-8 w-8 text-brand-primary" />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Text Animation */}
            <h3 className="text-xl font-bold text-text-primary mb-2">Analyzing Location</h3>
            <div className="h-6 overflow-hidden relative w-full text-center">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={currentStep}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="text-text-secondary font-medium"
                    >
                        {loadingSteps[currentStep].text}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* Progress Bar */}
            <div className="w-64 h-1 bg-surface-elevated rounded-full mt-8 overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((currentStep + 1) / loadingSteps.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>
        </div>
    );
};

export default AnalysisLoader;
