import React, { useState, useEffect, useCallback } from 'react';
import { GlobeAltIcon, ArrowRightIcon, XMarkIcon, CodeBracketIcon as CodeIcon, ShieldCheckIcon as ShieldIcon } from '@heroicons/react/24/outline';
import RippleButton from './RippleButton';

interface CodeInputProps {
    onAnalyze: (url: string) => void;
    onClear: () => void;
    initialCode: string; // Prop name kept for minimalism, but it holds a URL
    disabled: boolean;
}

const CodeInput: React.FC<CodeInputProps> = ({ onAnalyze, onClear, initialCode, disabled }) => {
    const [url, setUrl] = useState(initialCode);

    useEffect(() => {
        setUrl(initialCode);
    }, [initialCode]);

    const handleAnalyzeClick = useCallback(() => {
        onAnalyze(url);
    }, [url, onAnalyze]);

    const handleClearClick = useCallback(() => {
        setUrl('');
        onClear();
    }, [onClear]);

    const isValidUrl = (urlString: string): boolean => {
        if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
            return false;
        }
        try {
            new URL(urlString);
            return true;
        } catch (e) {
            return false;
        }
    };

    return (
        <div className="bg-brand-gray/30 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="flex items-center text-gray-300 mb-3 relative z-10">
                <CodeIcon className="w-5 h-5 mr-2 text-white" />
                <label htmlFor="urlInput" className="font-semibold tracking-wide">Target URL to Analyze</label>
            </div>
            <input
                type="url"
                id="urlInput"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-black/20 border border-white/10 rounded-lg p-4 font-mono text-sm text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-white/20 focus:border-white/30 focus:outline-none transition-all backdrop-blur-sm relative z-10"
                disabled={disabled}
            />
            <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 relative z-10">
                <button
                    onClick={handleAnalyzeClick}
                    disabled={disabled || !url.trim() || !isValidUrl(url)}
                    className="flex-grow inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-white disabled:bg-gray-600/50 disabled:cursor-not-allowed transition-all hover:shadow-white/10 hover:scale-[1.02] active:scale-[0.98]"
                >
                    <ShieldIcon className="w-5 h-5 mr-2" />
                    Analyze Target
                </button>
                <button
                    onClick={handleClearClick}
                    disabled={disabled}
                    className="flex-grow inline-flex items-center justify-center px-6 py-3 border border-white/10 text-base font-medium rounded-lg text-gray-300 bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-gray-500 disabled:opacity-50 transition-all hover:backdrop-blur-md"
                >
                    Clear
                </button>
            </div>
        </div>
    );
};

export default CodeInput;