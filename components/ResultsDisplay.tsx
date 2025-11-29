import React, { useState, useMemo, useEffect } from 'react';
import type { VulnerabilityReport } from '../types';
import { exportReportAsJSON, exportReportAsHTML, getDomainStats } from '../services/reportService';
import { calculateRiskScore, getTopCriticalIssues, copyToClipboard } from '../services/riskCalculator';
import CircularGauge from './CircularGauge';
import QuickSummary from './QuickSummary';
import MarkdownRenderer from './MarkdownRenderer';
import SpotlightCard from './SpotlightCard';
import RippleButton from './RippleButton';
import BlurReveal from './BlurReveal';

interface ResultsDisplayProps {
    reports: VulnerabilityReport[];
    targetDomain: string;
}

interface VulnReviewState {
    reviewed: boolean;
    notes: string;
    flagged: boolean;
}

type FilterType = 'all' | 'Critical' | 'High' | 'Medium' | 'Low';
type SortType = 'severity' | 'confidence' | 'cvss';
type VulnTab = 'overview' | 'reproduction' | 'fix' | 'impact';

interface EnhancedVulnCardProps {
    report: VulnerabilityReport;
    index: number;
    activeTab: Record<number, VulnTab>;
    setActiveTab: React.Dispatch<React.SetStateAction<Record<number, VulnTab>>>;
    reviewStates: Record<number, VulnReviewState>;
    toggleReviewed: (index: number) => void;
    toggleFlagged: (index: number) => void;
    setNotes: (index: number, notes: string) => void;
}

const EnhancedVulnCard: React.FC<EnhancedVulnCardProps> = ({
    report,
    index,
    activeTab,
    setActiveTab,
    reviewStates,
    toggleReviewed,
    toggleFlagged,
    setNotes
}) => {
    const [expanded, setExpanded] = useState(false); // Default to collapsed for cleaner initial view
    const tab = activeTab[index] || 'overview';
    const review = reviewStates[index] || { reviewed: false, notes: '', flagged: false };

    const severityConfig = {
        'Critical': { color: 'text-brand-red', bg: 'bg-brand-red/10', border: 'border-brand-red/20', icon: '⚡' },
        'High': { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: '🔥' },
        'Medium': { color: 'text-brand-yellow', bg: 'bg-brand-yellow/10', border: 'border-brand-yellow/20', icon: '⚠️' },
        'Low': { color: 'text-brand-blue', bg: 'bg-brand-blue/10', border: 'border-brand-blue/20', icon: 'ℹ️' },
    };

    const config = severityConfig[report.severity];

    return (
        <div className={`mb-4 group transition-all duration-300 ${expanded ? 'scale-[1.01]' : 'hover:scale-[1.005]'}`}>
            <div className={`
                relative overflow-hidden rounded-xl border backdrop-blur-sm transition-all duration-300
                ${expanded
                    ? 'bg-brand-gray/95 border-brand-light-gray/30 shadow-2xl'
                    : 'bg-brand-gray/80 border-white/5 hover:border-white/10 hover:bg-brand-gray/90'
                }
            `}>
                {/* Severity Stripe */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.bg.replace('/10', '')} transition-all`} />

                {/* Header - Always Visible */}
                <div
                    onClick={() => setExpanded(!expanded)}
                    className="p-5 pl-7 cursor-pointer flex items-start gap-4 relative z-10"
                >
                    {/* Icon Box */}
                    <div className={`
                        flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg
                        ${config.bg} ${config.color} border ${config.border}
                    `}>
                        {config.icon}
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                            <h3 className="text-lg font-bold text-gray-100 truncate pr-4">
                                {report.vulnerabilityType}
                            </h3>
                            <div className="flex items-center gap-2">
                                {review.reviewed && (
                                    <span className="px-2 py-0.5 bg-brand-green/10 text-brand-green text-[10px] uppercase font-bold tracking-wider rounded border border-brand-green/20">
                                        Reviewed
                                    </span>
                                )}
                                {review.flagged && (
                                    <span className="px-2 py-0.5 bg-brand-yellow/10 text-brand-yellow text-[10px] uppercase font-bold tracking-wider rounded border border-brand-yellow/20">
                                        Flagged
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 font-medium">
                            <span className={`${config.color} font-bold uppercase tracking-wider`}>
                                {report.severity}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-gray-600" />
                                CVSS {report.cvssScore.toFixed(1)}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-gray-600" />
                                {Math.round(report.confidence * 100)}% Confidence
                            </span>
                        </div>
                    </div>

                    {/* Chevron */}
                    <div className={`flex-shrink-0 text-gray-500 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                {/* Expanded Content */}
                <div className={`grid transition-all duration-300 ease-in-out ${expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                        <div className="px-7 pb-7 pt-2">
                            {/* Tabs */}
                            <div className="flex p-1 bg-black/40 rounded-lg mb-6 w-fit border border-white/5">
                                {(['overview', 'reproduction', 'fix', 'impact'] as VulnTab[]).map(t => (
                                    <button
                                        key={t}
                                        onClick={(e) => { e.stopPropagation(); setActiveTab(prev => ({ ...prev, [index]: t })); }}
                                        className={`
                                            px-4 py-1.5 text-xs font-medium rounded-md transition-all
                                            ${tab === t
                                                ? 'bg-brand-gray text-white shadow-sm border border-white/10'
                                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                            }
                                        `}
                                    >
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="min-h-[150px] text-sm text-gray-300 leading-relaxed pl-1">
                                {tab === 'overview' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <MarkdownRenderer content={report.shortExplanation} />
                                    </div>
                                )}
                                {tab === 'reproduction' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <MarkdownRenderer content={report.reproductionSteps} />
                                    </div>
                                )}
                                {tab === 'fix' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <MarkdownRenderer content={report.remediationExplanation} />
                                    </div>
                                )}
                                {tab === 'impact' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <MarkdownRenderer content={report.impactDescription} />
                                        <div className="mt-4 p-3 bg-brand-dark/50 rounded-lg border border-white/5 font-mono text-xs text-brand-blue break-all">
                                            {report.resourceUrl}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Bar */}
                            <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleReviewed(index); }}
                                        className={`
                                            flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                                            ${review.reviewed
                                                ? 'bg-brand-green/10 text-brand-green border-brand-green/20'
                                                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-gray-200'
                                            }
                                        `}
                                    >
                                        {review.reviewed ? '✓ Reviewed' : 'Mark Reviewed'}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleFlagged(index); }}
                                        className={`
                                            flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                                            ${review.flagged
                                                ? 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20'
                                                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-gray-200'
                                            }
                                        `}
                                    >
                                        {review.flagged ? '⚑ Flagged' : 'Flag Issue'}
                                    </button>
                                </div>

                                {/* Notes Input */}
                                <div className="flex-1 max-w-md">
                                    <input
                                        type="text"
                                        value={review.notes}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => setNotes(index, e.target.value)}
                                        placeholder="Add personal notes..."
                                        className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-brand-cyan/30 focus:ring-1 focus:ring-brand-cyan/30 transition-all placeholder-gray-600"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ reports, targetDomain }) => {
    const [filter, setFilter] = useState<FilterType>('all');
    const [sort, setSort] = useState<SortType>('severity');
    const [showStats, setShowStats] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [domainStats, setDomainStats] = useState({ totalScans: 0, lastScan: null as number | null });
    const [reviewStates, setReviewStates] = useState<Record<number, VulnReviewState>>({});
    const [copiedText, setCopiedText] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Record<number, VulnTab>>({});

    // Load domain stats and review states
    useEffect(() => {
        const stats = getDomainStats(targetDomain);
        setDomainStats(stats);

        const stored = localStorage.getItem(`astra_reviews_${targetDomain}`);
        if (stored) {
            try {
                setReviewStates(JSON.parse(stored));
            } catch (e) {
                console.warn('Failed to load review states');
            }
        }
    }, [targetDomain]);

    // Save review states
    useEffect(() => {
        if (Object.keys(reviewStates).length > 0) {
            localStorage.setItem(`astra_reviews_${targetDomain}`, JSON.stringify(reviewStates));
        }
    }, [reviewStates, targetDomain]);

    const handleCopy = async (text: string, label: string) => {
        const success = await copyToClipboard(text);
        if (success) {
            setCopiedText(label);
            setTimeout(() => setCopiedText(null), 2000);
        }
    };

    const toggleReviewed = (index: number) => {
        setReviewStates(prev => ({
            ...prev,
            [index]: {
                ...prev[index],
                reviewed: !prev[index]?.reviewed,
                notes: prev[index]?.notes || '',
                flagged: prev[index]?.flagged || false,
            }
        }));
    };

    const setNotes = (index: number, notes: string) => {
        setReviewStates(prev => ({
            ...prev,
            [index]: {
                ...(prev[index] || { reviewed: false, flagged: false }),
                notes,
            }
        }));
    };

    const toggleFlagged = (index: number) => {
        setReviewStates(prev => ({
            ...prev,
            [index]: {
                ...prev[index],
                flagged: !prev[index]?.flagged,
                reviewed: prev[index]?.reviewed || false,
                notes: prev[index]?.notes || '',
            }
        }));
    };

    const handleExportJSON = () => {
        exportReportAsJSON({
            domain: targetDomain,
            scanDate: new Date().toISOString(),
            vulnerabilities: reports,
            summary: stats,
        });
    };

    const handleExportHTML = () => {
        exportReportAsHTML({
            domain: targetDomain,
            scanDate: new Date().toLocaleString(),
            vulnerabilities: reports,
            summary: stats,
        });
    };

    if (!reports || reports.length === 0) {
        return (
            <div className="mt-8 text-center p-6 bg-brand-gray border border-brand-light-gray rounded-lg">
                <p className="text-brand-green font-semibold">✓ Scan Complete: No high-confidence vulnerabilities found.</p>
            </div>
        );
    }

    // Calculate statistics
    const stats = useMemo(() => {
        const severityCounts = {
            Critical: reports.filter(r => r.severity === 'Critical').length,
            High: reports.filter(r => r.severity === 'High').length,
            Medium: reports.filter(r => r.severity === 'Medium').length,
            Low: reports.filter(r => r.severity === 'Low').length,
        };

        const vulnerabilityTypes = reports.reduce((acc, r) => {
            const type = r.vulnerabilityType.toLowerCase();
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const avgConfidence = reports.reduce((sum, r) => sum + r.confidence, 0) / reports.length;
        const avgCVSS = reports.reduce((sum, r) => sum + r.cvssScore, 0) / reports.length;

        return {
            total: reports.length,
            severityCounts,
            vulnerabilityTypes,
            avgConfidence: (avgConfidence * 100).toFixed(1),
            avgCVSS: avgCVSS.toFixed(1),
        };
    }, [reports]);

    const riskScore = useMemo(() => calculateRiskScore(reports), [reports]);
    const topIssues = useMemo(() => getTopCriticalIssues(reports, 3), [reports]);

    // Filter and sort
    const filteredReports = useMemo(() => {
        let filtered = filter === 'all' ? reports : reports.filter(r => r.severity === filter);

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(r =>
                r.vulnerabilityType.toLowerCase().includes(query) ||
                r.shortExplanation.toLowerCase().includes(query) ||
                r.resourceUrl.toLowerCase().includes(query)
            );
        }

        return filtered.sort((a, b) => {
            if (sort === 'severity') {
                const severityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
                return severityOrder[b.severity] - severityOrder[a.severity];
            } else if (sort === 'confidence') {
                return b.confidence - a.confidence;
            } else {
                return b.cvssScore - a.cvssScore;
            }
        });
    }, [reports, filter, sort, searchQuery]);

    const CopyButton: React.FC<{ text: string; label: string }> = ({ text, label }) => (
        <button
            onClick={() => handleCopy(text, label)}
            className="px-2 py-1 bg-brand-dark border border-brand-light-gray rounded hover:border-brand-cyan transition-colors text-xs flex items-center gap-1"
            title={`Copy ${label}`}
        >
            {copiedText === label ? (
                <>
                    <svg className="w-3 h-3 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-brand-green">Copied!</span>
                </>
            ) : (
                <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy</span>
                </>
            )}
        </button>
    );

    return (
        <div className="mt-8">
            {/* Quick Summary */}
            <BlurReveal delay={0.1}>
                <QuickSummary topIssues={topIssues} totalIssues={reports.length} riskGrade={riskScore.grade} />
            </BlurReveal>

            {/* Main Dashboard - Enhanced with gradients */}
            {showStats && (
                <BlurReveal delay={0.2}>
                    <div className="mb-6 p-6 bg-brand-gray/95 border border-brand-light-gray/20 rounded-2xl shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-200">Security Analysis Dashboard</h2>
                            <button
                                onClick={() => setShowStats(!showStats)}
                                className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
                            >
                                Hide Dashboard
                            </button>
                        </div>

                        {/* Risk Gauge + Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Risk Gauge */}
                            <div className="flex flex-col items-center justify-center bg-brand-dark/50 p-6 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none"></div>
                                <h3 className="text-sm uppercase tracking-wider text-gray-300 font-bold mb-4 relative z-10">Overall Security Score</h3>
                                <div className="relative z-10">
                                    <CircularGauge
                                        score={riskScore.score}
                                        grade={riskScore.grade}
                                        level={riskScore.level}
                                        color={riskScore.color}
                                        size={180}
                                    />
                                </div>
                                <p className="text-center text-gray-400 text-sm mt-4 relative z-10">
                                    {riskScore.score === 0 ? 'No vulnerabilities detected' : `${riskScore.score}/100 Risk Score`}
                                </p>
                            </div>

                            {/* Summary Cards with gradients */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-brand-dark/50 p-4 rounded-2xl border border-white/10 shadow-lg hover:bg-brand-dark/70 transition-all">
                                    <div className="text-gray-400 text-sm mb-1">Total Findings</div>
                                    <div className="text-3xl font-bold text-gray-100">{stats.total}</div>
                                </div>
                                <div className="bg-brand-dark/50 p-4 rounded-2xl border border-white/10 shadow-lg hover:bg-brand-dark/70 transition-all">
                                    <div className="text-gray-400 text-sm mb-1">Avg Confidence</div>
                                    <div className="text-3xl font-bold text-white">{stats.avgConfidence}%</div>
                                </div>
                                <div className="bg-brand-dark/50 p-4 rounded-2xl border border-white/10 shadow-lg hover:bg-brand-dark/70 transition-all">
                                    <div className="text-gray-400 text-sm mb-1">Avg CVSS</div>
                                    <div className="text-3xl font-bold text-white">{stats.avgCVSS}</div>
                                </div>
                                <div className="bg-brand-dark/50 p-4 rounded-2xl border border-white/10 shadow-lg hover:bg-brand-dark/70 transition-all">
                                    <div className="text-gray-400 text-sm mb-1">Unique Types</div>
                                    <div className="text-3xl font-bold text-white">{Object.keys(stats.vulnerabilityTypes).length}</div>
                                </div>
                            </div>
                        </div>

                        {/* Export Buttons */}
                        <div className="flex gap-3">
                            <RippleButton
                                onClick={handleExportJSON}
                                className="px-4 py-2 bg-white text-black rounded-xl hover:bg-gray-200 hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 font-medium"
                                rippleColor="rgba(0,0,0,0.1)"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                JSON
                            </RippleButton>
                            <RippleButton
                                onClick={handleExportHTML}
                                className="px-4 py-2 bg-gradient-to-r from-brand-green to-brand-green/80 text-white rounded-xl hover:scale-105 transition-all flex items-center gap-2"
                                rippleColor="rgba(255,255,255,0.2)"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                HTML
                            </RippleButton>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm uppercase tracking-wider text-gray-400 font-bold mb-3">Scan History</h3>
                        <div className="bg-brand-dark/50 p-3 rounded-xl border border-brand-light-gray/20 shadow-sm">
                            <div className="flex items-center gap-4 text-sm">
                                <div>
                                    <span className="text-gray-400">Total: </span>
                                    <span className="font-bold text-brand-cyan">{domainStats.totalScans}</span>
                                </div>
                                {domainStats.lastScan && (
                                    <div>
                                        <span className="text-gray-400">Last: </span>
                                        <span className="font-mono text-gray-300 text-xs">
                                            {new Date(domainStats.lastScan).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </BlurReveal>
            )}

            {
                !showStats && (
                    <BlurReveal delay={0.2}>
                        <button
                            onClick={() => setShowStats(true)}
                            className="mb-4 text-sm text-brand-blue hover:text-brand-cyan transition-colors"
                        >
                            Show Analytics Dashboard
                        </button>
                    </BlurReveal>
                )
            }

            {/* Search & Filters with softer styling */}
            <BlurReveal delay={0.3}>
                <div className="mb-6 p-4 bg-brand-gray/95 border border-brand-light-gray/20 rounded-2xl shadow-lg">
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        {/* Search Box */}
                        <div className="flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search vulnerabilities..."
                                    className="w-full px-4 py-2.5 pl-11 bg-brand-dark/50 text-gray-300 border border-brand-light-gray/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/50 transition-all placeholder-gray-500"
                                />
                                <svg className="w-5 h-5 text-gray-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Sort */}
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortType)}
                            className="px-3 py-2.5 bg-brand-dark/50 text-gray-300 border border-brand-light-gray/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/50 transition-all"
                        >
                            <option value="severity">Sort by Severity</option>
                            <option value="confidence">Sort by Confidence</option>
                            <option value="cvss">Sort by CVSS</option>
                        </select>
                    </div>

                    {/* Severity Filters with softer rounded corners */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-xl border transition-all ${filter === 'all'
                                ? 'border-brand-cyan/50 text-brand-cyan bg-brand-cyan/10 shadow-md'
                                : 'border-gray-600/30 text-gray-400 hover:border-gray-500/50'
                                }`}
                        >
                            All ({stats.total})
                        </button>
                        {(['Critical', 'High', 'Medium', 'Low'] as const).map(severity => {
                            const count = stats.severityCounts[severity];
                            if (count === 0) return null;

                            const colors = {
                                Critical: 'border-brand-red/50 text-brand-red bg-brand-red/10 hover:bg-brand-red/20',
                                High: 'border-orange-500/50 text-orange-500 bg-orange-500/10 hover:bg-orange-500/20',
                                Medium: 'border-brand-yellow/50 text-brand-yellow bg-brand-yellow/10 hover:bg-brand-yellow/20',
                                Low: 'border-brand-blue/50 text-brand-blue bg-brand-blue/10 hover:bg-brand-blue/20',
                            };

                            return (
                                <button
                                    key={severity}
                                    onClick={() => setFilter(severity)}
                                    className={`px-4 py-2 rounded-xl border transition-all ${colors[severity]} ${filter === severity ? 'ring-2 ring-current/30 shadow-md' : ''
                                        }`}
                                >
                                    {severity} ({count})
                                </button>
                            );
                        })}
                    </div>
                </div>
            </BlurReveal>

            {/* Results Header */}
            <BlurReveal delay={0.4}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-200">
                        {filter === 'all' ? 'All Vulnerabilities' : `${filter} Severity Vulnerabilities`}
                        <span className="text-gray-500 ml-2">({filteredReports.length})</span>
                    </h2>
                </div>
            </BlurReveal>

            {/* Vulnerability Cards */}
            {
                filteredReports.length === 0 ? (
                    <BlurReveal delay={0.5}>
                        <div className="text-center p-6 bg-gradient-to-br from-brand-gray/60 to-brand-dark/40 border border-brand-light-gray/20 rounded-2xl shadow-lg">
                            <p className="text-gray-400">No vulnerabilities match your search/filter criteria.</p>
                        </div>
                    </BlurReveal>
                ) : (
                    <div>
                        {filteredReports.map((report, index) => (
                            <BlurReveal key={index} delay={0.1 * (index % 5)}>
                                <EnhancedVulnCard
                                    report={report}
                                    index={index}
                                    activeTab={activeTab}
                                    setActiveTab={setActiveTab}
                                    reviewStates={reviewStates}
                                    toggleReviewed={toggleReviewed}
                                    toggleFlagged={toggleFlagged}
                                    setNotes={setNotes}
                                />
                            </BlurReveal>
                        ))}
                    </div>
                )
            }
        </div >
    );
};

export default ResultsDisplay;
