import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import { getCookie, setCookie } from '../../utils/cookieUtils';

const steps = [
    {
        target: 'body', // General intro
        title: "Welcome to Terra Truce",
        content: "Your AI-powered assistant for property risk analysis and investment planning. Let's show you around!",
        position: 'center'
    },
    {
        target: '[href="/"]', // Overview link in sidebar
        title: "Executive Overview",
        content: "Start here to get a bird's eye view of property risks and trends.",
        position: 'right'
    },
    {
        target: '[href="/analyze"]', // Analyze link
        title: "AI Risk Analysis",
        content: "Deep dive into property data. Get safety scores, flood risks, and more instantly.",
        position: 'right'
    },
    {
        target: '[href="/market"]', // Investment Calc
        title: "Investment Calculator",
        content: "Project your ROI, cash flow, and equity growth with our advanced calculator.",
        position: 'right'
    },
    {
        target: '[href="/dashboard"]',
        title: "Your Dashboard",
        content: "Track your portfolio performance and saved searches here.",
        position: 'right'
    }
];

const Tutorial = () => {
    const { user, loading } = useAuth();
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [styles, setStyles] = useState({});

    useEffect(() => {
        const checkVisibility = () => {
            // Wait for auth to initialize
            if (loading) return;

            // 1. Completion check (Global)
            const isCompleted = localStorage.getItem('terra_truce_tutorial_completed');
            if (isCompleted) return;

            // 2. Session check
            const hasSeenSession = getCookie('terra_truce_tutorial_session');

            // MEMORY TRANSFER: If user is logged in and has a valid session cookie, 
            // ensure their permanent flag is set so they don't see it when cookie expires.
            if (user && hasSeenSession) {
                const hasSeenPermanently = localStorage.getItem(`tutorial_seen_${user.id}`);
                if (!hasSeenPermanently) {
                    localStorage.setItem(`tutorial_seen_${user.id}`, 'true');
                }
            }

            if (hasSeenSession) return;

            if (!user) {
                // Guest: Show if no session cookie
                setTimeout(() => setIsVisible(true), 1500);
            } else {
                // User: Check permanent flag
                const hasSeenPermanently = localStorage.getItem(`tutorial_seen_${user.id}`);
                if (!hasSeenPermanently) {
                    setTimeout(() => setIsVisible(true), 1500);
                }
            }
        };
        checkVisibility();
    }, [user, loading]);

    const updateHighlight = () => {
        const step = steps[currentStep];
        if (step.target === 'body') {
            setStyles({});
            return;
        }

        const element = document.querySelector(step.target);
        if (element) {
            const rect = element.getBoundingClientRect();
            setStyles({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            });
        } else {
            setStyles({});
        }
    };

    useEffect(() => {
        if (isVisible) {
            updateHighlight();
            setTimeout(updateHighlight, 500);
            window.addEventListener('resize', updateHighlight);
            return () => window.removeEventListener('resize', updateHighlight);
        }
    }, [isVisible, currentStep]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            // COMPLETION: Set permanent flag
            localStorage.setItem('terra_truce_tutorial_completed', 'true');
            handleClose();
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        // DISMISSAL/SUCCESS: Always set session cookie to prevent re-show in same session
        setCookie('terra_truce_tutorial_session', 'true', 1);

        if (user) {
            localStorage.setItem(`tutorial_seen_${user.id}`, 'true');
        }
    };

    if (!isVisible) return null;

    // Helper to determine if we are in "fallback" mode (effective target is body)
    const effectiveTargetIsBody = steps[currentStep].target === 'body' || !document.querySelector(steps[currentStep].target);

    return (
        <div className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden font-sans">
            {/* Spotlight Impl */}
            {!effectiveTargetIsBody && (
                <motion.div
                    className="absolute rounded-xl transition-all duration-300 ease-out"
                    style={{
                        top: styles.top,
                        left: styles.left,
                        width: styles.width,
                        height: styles.height,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)'
                    }}
                    initial={false}
                    animate={{
                        top: styles.top,
                        left: styles.left,
                        width: styles.width,
                        height: styles.height
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 25
                    }}
                />
            )}

            {/* Fallback full dark overlay if effective target is body */}
            {effectiveTargetIsBody && (
                <div className="absolute inset-0 bg-black/60 transition-opacity duration-500" />
            )}

            {/* Card Information */}
            <AnimatePresence mode='wait'>
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute pointer-events-auto bg-surface border border-brand-primary/20 rounded-2xl shadow-2xl p-6 w-[340px]"
                    style={{
                        top: effectiveTargetIsBody ? '50%' :
                            steps[currentStep].position === 'bottom' ? `calc(${styles.top}px + ${styles.height}px + 24px)` :
                                steps[currentStep].position === 'right' ? `calc(${styles.top}px)` :
                                    `calc(${styles.top}px + 24px)`,

                        left: effectiveTargetIsBody ? '50%' :
                            steps[currentStep].position === 'right' ? `calc(${styles.left}px + ${styles.width}px + 24px)` :
                                `calc(${styles.left}px)`,

                        transform: effectiveTargetIsBody ? 'translate(-50%, -50%)' : 'none'
                    }}
                >
                    <div className="absolute -top-4 -left-4 h-12 w-12 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg border-4 border-surface">
                        {currentStep + 1}
                    </div>

                    <button onClick={handleClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary p-1 hover:bg-black/5 rounded-full transition-colors">
                        <X className="h-4 w-4" />
                    </button>

                    <h3 className="font-bold text-xl text-text-primary mt-3 mb-2">{steps[currentStep].title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed mb-6 font-medium">{steps[currentStep].content}</p>

                    <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                            {steps.map((_, i) => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-brand-primary' : 'w-1.5 bg-border'}`} />
                            ))}
                        </div>
                        <button
                            onClick={handleNext}
                            className="bg-brand-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-brand-secondary transition-colors shadow-lg shadow-brand-primary/30 active:scale-95"
                        >
                            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                            {currentStep === steps.length - 1 ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default Tutorial;
