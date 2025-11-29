import React, { useState } from 'react';

interface CircularGaugeProps {
    score: number; // 0-100
    grade: string;
    level: string;
    color: string;
    size?: number;
}

const CircularGauge: React.FC<CircularGaugeProps> = ({ score, grade, level, color, size = 200 }) => {
    const [showLegend, setShowLegend] = useState(false);
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center relative">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                    {/* Background circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#30363d"
                        strokeWidth="12"
                        fill="none"
                    />
                    {/* Progress circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-5xl font-bold" style={{ color }}>{grade}</div>
                    <div className="text-2xl font-bold text-gray-300 mt-1">{score}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{level}</div>
                </div>
            </div>

            {/* Grade Legend Toggle */}
            <button
                onClick={() => setShowLegend(!showLegend)}
                className="mt-3 text-xs text-gray-400 hover:text-gray-200 underline transition-colors"
            >
                {showLegend ? 'Hide' : 'What does this mean?'}
            </button>

            {/* Grade Legend */}
            {showLegend && (
                <div className="mt-3 p-4 bg-brand-dark border border-brand-light-gray rounded-lg text-xs w-full max-w-sm">
                    <h4 className="font-bold text-gray-200 mb-2">Security Grade Guide</h4>
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-brand-green w-6">A</span>
                            <span className="text-gray-400">Excellent (0-20): Minimal risk, no critical issues</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-brand-blue w-6">B</span>
                            <span className="text-gray-400">Good (21-40): Low risk, mostly minor issues</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-brand-yellow w-6">C</span>
                            <span className="text-gray-400">Fair (41-60): Moderate risk, needs attention</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-orange-500 w-6">D</span>
                            <span className="text-gray-400">Poor (61-80): High risk, urgent fixes needed</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-brand-red w-6">F</span>
                            <span className="text-gray-400">Critical (81-100): Severe vulnerabilities found</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CircularGauge;
