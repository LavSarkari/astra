import React from 'react';
import type { LoadingState } from '../types';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface StatusIndicatorProps {
    state: LoadingState;
    message?: string;
    detail?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ state, message, detail }) => {
    if (state === 'idle' || state === 'done') return null;

    const defaultMessages: Record<string, string> = {
        scraping: 'Scraping JavaScript from target URL...',
        filtering: 'Applying heuristic pre-filter to identified code...',
        analyzing: 'Performing deep semantic analysis with Gemini AI...',
    };

    const displayMessage = message || defaultMessages[state] || 'Processing...';

    return (
        <div className="mt-6 p-6 bg-brand-gray/30 backdrop-blur-md border border-white/10 rounded-xl shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 animate-pulse pointer-events-none"></div>
            <div className="flex items-start relative z-10">
                <SpinnerIcon className="w-6 h-6 mr-3 text-white flex-shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                <div className="flex-1">
                    <p className="text-gray-200 font-medium tracking-wide">{displayMessage}</p>
                    {detail && (
                        <p className="text-gray-400 text-sm mt-2 font-mono animate-pulse">
                            → {detail}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatusIndicator;