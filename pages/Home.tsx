import React, { useState, useCallback } from 'react';
import BlurReveal from '../components/BlurReveal';
import ParallaxBackground from '../components/ParallaxBackground';
import CodeInput from '../components/CodeInput';
import { CardSkeleton } from '../components/Skeleton';
import StatusIndicator from '../components/StatusIndicator';
import ResultsDisplay from '../components/ResultsDisplay';
import Squares from '../components/Squares';
import { heuristicFilter } from '../services/filterService';
import { analyzeCodeSnippets } from '../services/geminiService';
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

            setProgressMessage('Analysis complete!');
            setProgressDetail(`Identified ${validResults.length} potential vulnerabilit${validResults.length === 1 ? 'y' : 'ies'}`);
            await new Promise(resolve => setTimeout(resolve, 1000));

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
        </>
    );
};

export default Home;
