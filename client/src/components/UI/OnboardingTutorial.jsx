import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const OnboardingTutorial = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    const { user } = useAuth();
    const [highlightedElement, setHighlightedElement] = useState(null);

    useEffect(() => {
        // Display Logic:
        // 1. Guest: Show if not seen as guest
        // 2. User: Show if not seen as user
        const checkTutorialStatus = () => {
            const guestSeen = localStorage.getItem('terra-truce-guest-tutorial-seen');

            if (user) {
                const userSeen = localStorage.getItem(`terra-truce-user-tutorial-seen-${user.id}`);
                if (!userSeen) {
                    setTimeout(() => setIsVisible(true), 1500);
                }
            } else {
                // Not logged in
                if (!guestSeen) {
                    setTimeout(() => setIsVisible(true), 1500);
                }
            }
        };
        checkTutorialStatus();
    }, [user]);

    // Handle Highlighting
    useEffect(() => {
        if (!isVisible) return;

        const step = steps[currentStep];

        // Cleanup previous highlight
        if (highlightedElement) {
            highlightedElement.classList.remove('z-[102]', 'relative', 'ring-4', 'ring-purple-500', 'bg-white', 'dark:bg-slate-900', 'rounded-xl');
            setHighlightedElement(null);
        }

        if (step.highlight) {
            const el = document.getElementById(step.highlight) || document.querySelector(step.highlight);
            if (el) {
                el.classList.add('z-[102]', 'relative', 'ring-4', 'ring-purple-500', 'bg-white', 'dark:bg-slate-900', 'rounded-xl');
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setHighlightedElement(el);
            }
        }
    }, [currentStep, isVisible]);

    const steps = [
        {
            title: "Welcome to Terra Truce! 🎉",
            description: "Your AI-powered property risk analysis platform. Let's take a quick tour!",
            position: "center",
            highlight: null
        },
        {
            title: "Search Properties 🔍",
            description: "Use our intelligent search to find any property in India. Get instant risk scores!",
            position: "top",
            highlight: "search" // ID or class to highlight
        },
        {
            title: "Analyze Risks 📊",
            description: "View comprehensive 10-point risk analysis including flood zones, crime rates, and market trends.",
            position: "center",
            highlight: "analyze"
        },
        {
            title: "Calculate ROI 💰",
            description: "Project your investment returns with our advanced calculator. Simulate 30-year forecasts!",
            position: "center",
            highlight: "calculator"
        },
        {
            title: "AI Assistant 🤖",
            description: "Chat with our AI to get personalized property recommendations and insights.",
            position: "bottom-right",
            highlight: "chatbot"
        }
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = () => {
        if (user) {
            localStorage.setItem(`terra-truce-user-tutorial-seen-${user.id}`, 'true');
        } else {
            localStorage.setItem('terra-truce-guest-tutorial-seen', 'true');
        }

        // Cleanup highlight on exit
        if (highlightedElement) {
            highlightedElement.classList.remove('z-[102]', 'relative', 'ring-4', 'ring-purple-500', 'bg-white', 'dark:bg-slate-900', 'rounded-xl');
        }

        setIsVisible(false);
        if (onComplete) onComplete();
    };

    if (!isVisible) return null;

    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        onClick={handleSkip}
                    />

                    {/* Tutorial Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={`fixed z-[101] ${getPositionClasses(step.position)}`}
                    >
                        <div className="bg-white dark:bg-surface rounded-2xl shadow-2xl border-2 border-purple-500/50 dark:border-purple-500/30 p-6 max-w-md">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
                                        {step.title}
                                    </h3>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                                <button
                                    onClick={handleSkip}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>

                            {/* Progress Dots */}
                            <div className="flex items-center gap-2 mb-6">
                                {steps.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep
                                            ? 'w-8 bg-gradient-to-r from-purple-500 to-pink-500'
                                            : idx < currentStep
                                                ? 'w-1.5 bg-green-500'
                                                : 'w-1.5 bg-gray-300 dark:bg-gray-600'
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between gap-3">
                                <button
                                    onClick={handleSkip}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                                >
                                    Skip Tour
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                                >
                                    {isLastStep ? (
                                        <>
                                            <Check className="h-4 w-4" />
                                            Get Started
                                        </>
                                    ) : (
                                        <>
                                            Next
                                            <ChevronRight className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Step Counter */}
                            <div className="mt-4 text-center">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Step {currentStep + 1} of {steps.length}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

const getPositionClasses = (position) => {
    switch (position) {
        case 'center':
            return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
        case 'top':
            return 'top-24 left-1/2 -translate-x-1/2';
        case 'bottom-right':
            return 'bottom-24 right-8';
        default:
            return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    }
};

export default OnboardingTutorial;
