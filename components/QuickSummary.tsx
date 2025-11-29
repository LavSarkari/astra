import React from 'react';
import type { VulnerabilityReport } from '../types';

interface QuickSummaryProps {
    topIssues: VulnerabilityReport[];
    totalIssues: number;
    riskGrade: string;
}

const QuickSummary: React.FC<QuickSummaryProps> = ({ topIssues, totalIssues, riskGrade }) => {
    if (topIssues.length === 0) {
        return (
            <div className="mb-6 p-6 bg-brand-green/10 border border-brand-green rounded-lg">
                <div className="flex items-center gap-3">
                    <div className="text-3xl">✓</div>
                    <div>
                        <h2 className="text-xl font-bold text-brand-green">All Clear!</h2>
                        <p className="text-gray-400 text-sm mt-1">No high-priority vulnerabilities detected</p>
                    </div>
                </div>
            </div>
        );
    }

    const criticalCount = topIssues.filter(i => i.severity === 'Critical').length;
    const highCount = topIssues.filter(i => i.severity === 'High').length;

    return (
        <div className="mb-6 p-6 bg-brand-red/10 border border-brand-red rounded-lg">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="text-3xl">⚠️</div>
                    <div>
                        <h2 className="text-xl font-bold text-brand-red">Action Required</h2>
                        <p className="text-gray-400 text-sm mt-1">
                            {totalIssues} vulnerabilit{totalIssues === 1 ? 'y' : 'ies'} found
                            {criticalCount > 0 && ` • ${criticalCount} Critical`}
                            {highCount > 0 && ` • ${highCount} High`}
                        </p>
                    </div>
                </div>
                <div className="px-4 py-2 bg-brand-dark border border-brand-red rounded-lg">
                    <div className="text-sm text-gray-400">Overall Grade</div>
                    <div className="text-3xl font-bold text-brand-red text-center">{riskGrade}</div>
                </div>
            </div>

            <div>
                <h3 className="text-sm uppercase tracking-wider text-gray-400 font-bold mb-3">🎯 Fix These First:</h3>
                <div className="space-y-2">
                    {topIssues.map((issue, index) => (
                        <a
                            key={index}
                            href={`#vuln-${index}`}
                            className="block p-3 bg-brand-dark border border-brand-light-gray rounded-lg hover:border-brand-cyan transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-200">{index + 1}.</span>
                                        <span className="text-gray-200 font-medium">{issue.vulnerabilityType}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${issue.severity === 'Critical' ? 'bg-brand-red/20 text-brand-red' :
                                                issue.severity === 'High' ? 'bg-orange-500/20 text-orange-500' :
                                                    issue.severity === 'Medium' ? 'bg-brand-yellow/20 text-brand-yellow' :
                                                        'bg-brand-blue/20 text-brand-blue'
                                            }`}>
                                            {issue.severity}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-1 line-clamp-1">{issue.shortExplanation}</p>
                                </div>
                                <div className="flex items-center gap-3 ml-4">
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500">CVSS</div>
                                        <div className="text-sm font-bold text-gray-300">{issue.cvssScore.toFixed(1)}</div>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuickSummary;
