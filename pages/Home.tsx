import React, { useState, useCallback, useEffect } from 'react';
import BlurReveal from '../components/BlurReveal';
import ParallaxBackground from '../components/ParallaxBackground';
import CodeInput from '../components/CodeInput';
import { CardSkeleton } from '../components/Skeleton';
import StatusIndicator from '../components/StatusIndicator';
import ResultsDisplay from '../components/ResultsDisplay';
import Squares from '../components/Squares';
import { heuristicFilter } from '../services/filterService';
import { analyzeCodeSnippets, validateApiKey } from '../services/geminiService';
import { scrapeJavaScriptFromUrl } from '../services/scraperService';
import { saveScanHistory } from '../services/reportService';
import type { VulnerabilityReport, LoadingState, ScrapedScript, SuspiciousSnippet } from '../types';

const Home: React.FC = () => {
    const [loadingState, setLoadingState] = useState<LoadingState>('idle');
    const [results, setResults] = useState<VulnerabilityReport[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [url, setUrl] = useState<string>('');
    const [progressMessage, setProgressMessage] = useState<string>('');
    const [progressDetail, setProgressDetail] = useState<string>('');

    // API Key Management State
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const [customApiKey, setCustomApiKey] = useState('');
    const [apiKeyError, setApiKeyError] = useState<string | null>(null);
    const [isValidatingKey, setIsValidatingKey] = useState(false);

    const handleAnalyze = useCallback(async (targetUrl: string) => {
        if (!targetUrl.trim()) {
            setError("Please enter a URL to analyze.");
            return;
        }
        try {
            new URL(targetUrl);
        } catch (e) {
            setError("Please enter a valid URL (e.g., https://example.com).");
            return;
        }

        // Step 0: Validate API Key before starting
        const isKeyValid = await validateApiKey();
        if (!isKeyValid) {
            setShowApiKeyModal(true);
            return;
        }

        setUrl(targetUrl);
        setLoadingState('scraping');
        setResults([]);
        setError(null);
        setProgressMessage('Initiating reconnaissance...');
        setProgressDetail(`Target: ${targetUrl}`);

        const scanStartTime = Date.now();

        try {
            // Stage 1: Scraping
            setProgressMessage('Scraping JavaScript from target URL...');
            setProgressDetail('Fetching page and extracting scripts...');

            const scrapedScripts: ScrapedScript[] = await scrapeJavaScriptFromUrl(targetUrl);

            if (scrapedScripts.length === 0 || scrapedScripts.every(s => !s.code.trim())) {
                setLoadingState('done');
                setProgressMessage('');
                setProgressDetail('');
                return;
            }

            setProgressDetail(`Found ${scrapedScripts.length} script${scrapedScripts.length > 1 ? 's' : ''} to analyze`);
            await new Promise(resolve => setTimeout(resolve, 800)); // Brief pause for UX

            // Stage 2: Filtering
            setLoadingState('filtering');
            setProgressMessage('Applying heuristic pre-filter...');
            setProgressDetail('Scanning for suspicious patterns and dangerous sinks...');

            const suspiciousSnippets: SuspiciousSnippet[] = heuristicFilter(scrapedScripts);

            if (suspiciousSnippets.length === 0) {
                setLoadingState('done');
                setProgressMessage('');
                setProgressDetail('');
                return;
            }

            setProgressDetail(`Detected ${suspiciousSnippets.length} suspicious snippet${suspiciousSnippets.length > 1 ? 's' : ''} requiring deep analysis`);
            await new Promise(resolve => setTimeout(resolve, 800));

            // Stage 3: AI Analysis
            setLoadingState('analyzing');
            setProgressMessage('Performing deep semantic analysis with Gemini AI...');
            setProgressDetail(`Analyzing snippet 1 of ${suspiciousSnippets.length}...`);

            // Wrap analysis to track progress
            const analysisResults: VulnerabilityReport[] = [];
            for (let i = 0; i < suspiciousSnippets.length; i++) {
                setProgressDetail(`Analyzing snippet ${i + 1} of ${suspiciousSnippets.length} • Applying red-team methodology...`);

                // Analyze current snippet
                const result = await analyzeCodeSnippets([suspiciousSnippets[i]]);
                if (result && result.length > 0) {
                    analysisResults.push(...result);

                    // Show found vulnerability
                    const vuln = result[0];
                    if (vuln.vulnerabilityType.toLowerCase() !== 'none') {
                        setProgressDetail(`✓ Found ${vuln.vulnerabilityType} (${(vuln.confidence * 100).toFixed(0)}% confidence) in snippet ${i + 1}`);
                        await new Promise(resolve => setTimeout(resolve, 600));
                    }
                }
            }

            const validResults = analysisResults
                .filter(r => r.vulnerabilityType.toLowerCase() !== 'none')
                .sort((a, b) => b.confidence - a.confidence);

            // If we had suspicious snippets but got 0 results, it likely means the AI failed silently or returned invalid JSON
            if (validResults.length === 0 && suspiciousSnippets.length > 0) {
                // Check if we had any actual failures in the loop (we can't easily track that here without changing the loop, 
                // but empty results after finding suspicious code is a strong indicator of AI trouble or just no vulns found.
                // However, given the user's report, we should be explicit if something went wrong.)

                // Let's rely on the fact that analyzeCodeSnippets returns null on error. 
                // If analysisResults.length is 0 but suspiciousSnippets.length > 0, then ALL failed.
                if (analysisResults.length === 0) {
                    throw new Error("AI Analysis failed to generate any valid reports. Please check your API key and quota.");
                }
            }

            setResults(validResults);

            // Save scan history
            const scanDuration = Date.now() - scanStartTime;
            const domain = new URL(targetUrl).hostname;
            saveScanHistory({
                domain,
                timestamp: Date.now(),
                vulnerabilitiesFound: validResults.length,
                scanDuration: Math.round(scanDuration / 1000), // Convert to seconds
            });

        } catch (err) {
            console.error("Analysis failed:", err);
            let errorMessage = "An error occurred during analysis.";

            if (err instanceof Error) {
                // Provide specific guidance based on error type
                if (err.message.includes('Failed to fetch') || err.message.includes('All proxies failed')) {
                    errorMessage = `Unable to access the target URL. This could be due to:\n• The website blocking automated access\n• CORS proxy rate limits\n• Network connectivity issues\n• Invalid URL or website down\n\nTry:\n• Using a different URL\n• Waiting a few minutes and trying again\n• Testing with a smaller, public website first`;
                } else if (err.message.includes('abort')) {
                    errorMessage = 'Request timed out. The target website is taking too long to respond. Try a faster website or try again later.';
                } else {
                    errorMessage = `Error: ${err.message}`;
                }
            }
            setError(errorMessage);
        } finally {
            setLoadingState('done');
            setProgressMessage('');
            setProgressDetail('');
        }
    }, []);

    const handleClear = useCallback(() => {
        setUrl('');
        setResults([]);
        setError(null);
        setLoadingState('idle');
        setProgressMessage('');
        setProgressDetail('');
    }, []);

    const handleApiKeySubmit = async () => {
        if (!customApiKey.trim()) {
            setApiKeyError("Please enter a valid API Key.");
            return;
        }

        setIsValidatingKey(true);
        setApiKeyError(null);

        const isValid = await validateApiKey(customApiKey);

        if (isValid) {
            localStorage.setItem('astra_gemini_api_key', customApiKey);
            setShowApiKeyModal(false);
            // Optionally auto-restart analysis if URL is present
            if (url) {
                handleAnalyze(url);
            }
        } else {
            setApiKeyError("Invalid API Key. Please check and try again.");
        }
        setIsValidatingKey(false);
    };

    // Only show Squares background if NO results are displayed
    const showBackground = results.length === 0;

    return (
        <>
            {showBackground && (
                <div className="fixed inset-0 z-0">
                    <ParallaxBackground speed={0.2}>
                        <Squares
                            speed={0.5}
                            squareSize={40}
                            direction='diagonal'
                            borderColor='#333'
                            hoverFillColor='#222'
                        />
                    </ParallaxBackground>
                </div>
            )}

            <div className={`flex flex-col items-center p-4 sm:p-6 md:p-8 relative z-10 pt-24 ${results.length === 0 ? 'h-[calc(100vh-5rem)] overflow-hidden' : 'min-h-screen'}`}>
                <div className="w-full max-w-4xl mx-auto flex flex-col flex-grow relative">
                    <main className={`flex-grow flex flex-col ${results.length === 0 ? 'justify-center' : 'mt-8'}`}>
                        <BlurReveal>
                            <CodeInput
                                onAnalyze={handleAnalyze}
                                onClear={handleClear}
                                initialCode={url}
                                disabled={loadingState === 'scraping' || loadingState === 'filtering' || loadingState === 'analyzing'}
                            />
                        </BlurReveal>

                        {error && (
                            <BlurReveal delay={1}>
                                <div className="mt-4 p-4 bg-red-900/50 border border-brand-red rounded-lg text-red-300 whitespace-pre-line backdrop-blur-sm">
                                    {error}
                                </div>
                            </BlurReveal>
                        )}

                        <BlurReveal delay={2}>
                            <StatusIndicator
                                state={loadingState}
                                message={progressMessage}
                                detail={progressDetail}
                            />
                        </BlurReveal>

                        {loadingState === 'analyzing' && (
                            <BlurReveal delay={2.5}>
                                <div className="mt-8">
                                    <CardSkeleton />
                                    <CardSkeleton />
                                </div>
                            </BlurReveal>
                        )}

                        {(loadingState === 'done' || results.length > 0) && (
                            <BlurReveal delay={3}>
                                <ResultsDisplay reports={results} targetDomain={url} />
                            </BlurReveal>
                        )}
                    </main>
                </div>
            </div>

            {/* API Key Modal */}
            {showApiKeyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-brand-gray/95 border border-brand-light-gray/20 rounded-2xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-red to-orange-500"></div>

                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <span className="text-brand-red">⚠️</span> API Key Required
                        </h3>

                        <p className="text-gray-400 text-sm mb-6">
                            The default API key is invalid or has exceeded its quota. Please enter your own Google Gemini API key to continue.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Gemini API Key</label>
                                <input
                                    type="password"
                                    value={customApiKey}
                                    onChange={(e) => setCustomApiKey(e.target.value)}
                                    placeholder="AIzaSy..."
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan/50 transition-all"
                                />
                            </div>

                            {apiKeyError && (
                                <div className="text-red-400 text-xs bg-red-900/20 p-2 rounded border border-red-900/30">
                                    {apiKeyError}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowApiKeyModal(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApiKeySubmit}
                                    disabled={isValidatingKey}
                                    className="px-6 py-2 bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 rounded-lg hover:bg-brand-cyan/20 transition-all text-sm font-bold flex items-center gap-2"
                                >
                                    {isValidatingKey ? (
                                        <>
                                            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                            Validating...
                                        </>
                                    ) : (
                                        'Save & Continue'
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/5 text-center">
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-brand-blue hover:text-brand-cyan hover:underline transition-colors"
                            >
                                Get a free API key from Google AI Studio →
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Home;
