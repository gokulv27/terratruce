import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Activity, Shield, TrendingUp, Search, Globe, FileText, Database } from 'lucide-react';

const loadingSteps = [
    { text: "Establishing secure connection...", icon: Globe, threshold: 0 },
    { text: "Scanning regional databases...", icon: Database, threshold: 20 },
    { text: "Analyzing crime & safety records...", icon: Shield, threshold: 40 },
    { text: "Processing market trends (2019-2024)...", icon: TrendingUp, threshold: 60 },
    { text: "Finalizing 10-point risk report...", icon: FileText, threshold: 80 }
];

const AnalysisLoader = () => {
    const [progress, setProgress] = useState(0);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    useEffect(() => {
        // Smart progress simulation
        const interval = setInterval(() => {
            setProgress(prev => {
                let increment = 0;
                // Fast start
                if (prev < 30) {
                    increment = Math.random() * 2 + 1;
                }
                // Steady middle
                else if (prev < 70) {
                    increment = Math.random() * 0.5 + 0.2;
                }
                // Slow crawl at the end (Zeno's paradox)
                else if (prev < 95) {
                    increment = Math.random() * 0.1;
                }
                // Stop at 95%
                else {
                    return prev;
                }

                return Math.min(prev + increment, 95);
            });
        }, 100);

        return () => clearInterval(interval);
    }, []);

    // Update text based on progress thresholds
    useEffect(() => {
        const stepIndex = loadingSteps.findIndex((step, idx) => {
            const nextStep = loadingSteps[idx + 1];
            return progress >= step.threshold && (!nextStep || progress < nextStep.threshold);
        });
        if (stepIndex !== -1) setCurrentStepIndex(stepIndex);
    }, [progress]);

    const currentStep = loadingSteps[currentStepIndex];
    const StepIcon = currentStep.icon;

    return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
            <div className="relative mb-8">
                {/* Spinning Rings */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-4 border-t-brand-primary border-r-transparent border-b-brand-secondary border-l-transparent w-24 h-24"
                />
                <motion.div
                    animate={{ rotate: -180 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-2 rounded-full border-4 border-t-brand-secondary/50 border-r-transparent border-b-brand-primary/50 border-l-transparent w-20 h-20"
                />

                {/* Center Icon */}
                <div className="w-24 h-24 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStepIndex}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ duration: 0.3 }}
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
                        key={currentStepIndex}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="text-text-secondary font-medium"
                    >
                        {currentStep.text}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* Progress Bar */}
            <div className="w-64 h-1.5 bg-surface-elevated rounded-full mt-8 overflow-hidden relative">
                <motion.div
                    className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-brand-primary to-brand-secondary shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0.1, ease: "linear" }}
                />
            </div>
            <p className="mt-2 text-xs text-text-secondary font-mono">{Math.floor(progress)}%</p>
        </div>
    );
};

export default AnalysisLoader;
