import type { VulnerabilityReport } from '../types';

export interface RiskScore {
    score: number; // 0-100
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    level: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
    color: string;
}

/**
 * Calculate overall risk score based on vulnerabilities
 * Lower score = better security (0 = perfect, 100 = critical)
 */
export const calculateRiskScore = (vulnerabilities: VulnerabilityReport[]): RiskScore => {
    if (vulnerabilities.length === 0) {
        return {
            score: 0,
            grade: 'A',
            level: 'Excellent',
            color: '#3fb950', // green
        };
    }

    // Weight vulnerabilities by severity and confidence
    const severityWeights = {
        Critical: 10,
        High: 7,
        Medium: 4,
        Low: 1,
    };

    let totalRisk = 0;
    vulnerabilities.forEach(vuln => {
        const weight = severityWeights[vuln.severity];
        const confidenceFactor = vuln.confidence; // 0-1
        totalRisk += weight * confidenceFactor;
    });

    // Normalize to 0-100 scale (assuming max ~5 critical vulns = 100)
    const maxPossibleRisk = 50; // 5 critical vulns * 10 weight
    let score = Math.min(100, (totalRisk / maxPossibleRisk) * 100);
    score = Math.round(score);

    // Assign grade and level
    let grade: RiskScore['grade'];
    let level: RiskScore['level'];
    let color: string;

    if (score <= 20) {
        grade = 'A';
        level = 'Excellent';
        color = '#3fb950'; // green
    } else if (score <= 40) {
        grade = 'B';
        level = 'Good';
        color = '#58a6ff'; // blue
    } else if (score <= 60) {
        grade = 'C';
        level = 'Fair';
        color = '#d29922'; // yellow
    } else if (score <= 80) {
        grade = 'D';
        level = 'Poor';
        color = '#fb923c'; // orange
    } else {
        grade = 'F';
        level = 'Critical';
        color = '#f85149'; // red
    }

    return { score, grade, level, color };
};

/**
 * Get top N critical vulnerabilities sorted by severity and confidence
 */
export const getTopCriticalIssues = (
    vulnerabilities: VulnerabilityReport[],
    count: number = 3
): VulnerabilityReport[] => {
    const severityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };

    return [...vulnerabilities]
        .sort((a, b) => {
            // First by severity
            const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
            if (severityDiff !== 0) return severityDiff;

            // Then by CVSS
            const cvssDiff = b.cvssScore - a.cvssScore;
            if (cvssDiff !== 0) return cvssDiff;

            // Finally by confidence
            return b.confidence - a.confidence;
        })
        .slice(0, count);
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        return false;
    }
};

/**
 * Format time duration in seconds to readable format
 */
export const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
        return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
};
