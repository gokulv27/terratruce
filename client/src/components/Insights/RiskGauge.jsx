import React from 'react';

/**
 * Risk Gauge Component - Dark Theme
 * Circular animated gauge for overall risk score
 */
const RiskGauge = ({ score = 50 }) => {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    // Determine color based on score
    const getColor = () => {
        if (score >= 70) return { stroke: '#EF4444', glow: '#EF4444', text: 'text-red-400' }; // Red
        if (score >= 40) return { stroke: '#FACC15', glow: '#FACC15', text: 'text-yellow-400' }; // Yellow
        return { stroke: '#22C55E', glow: '#22C55E', text: 'text-green-400' }; // Green
    };

    const colors = getColor();

    return (
        <div className="relative inline-flex items-center justify-center">
            {/* SVG Gauge */}
            <svg className="transform -rotate-90" width="180" height="180">
                {/* Background Circle */}
                <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    stroke="rgba(75, 85, 99, 0.3)"
                    strokeWidth="12"
                    fill="none"
                />
                {/* Progress Circle with Glow */}
                <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    stroke={colors.stroke}
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out"
                    style={{
                        filter: `drop-shadow(0 0 8px ${colors.glow})`
                    }}
                />
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-5xl font-black ${colors.text}`}>{score}</span>
                <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Risk Score</span>
            </div>
        </div>
    );
};

export default RiskGauge;
