import type { VulnerabilityReport } from '../types';

export interface ScanHistoryEntry {
    domain: string;
    timestamp: number;
    vulnerabilitiesFound: number;
    scanDuration: number;
}

const STORAGE_KEY = 'astra_scan_history';
const MAX_HISTORY = 50;

export const saveScanHistory = (entry: ScanHistoryEntry) => {
    try {
        const history = getScanHistory();
        history.unshift(entry);

        // Keep only last MAX_HISTORY entries
        const trimmed = history.slice(0, MAX_HISTORY);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
        console.warn('Failed to save scan history:', error);
    }
};

export const getScanHistory = (): ScanHistoryEntry[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.warn('Failed to load scan history:', error);
        return [];
    }
};

export const getDomainStats = (domain: string): { totalScans: number; lastScan: number | null } => {
    const history = getScanHistory();
    const domainScans = history.filter(entry => entry.domain === domain);

    return {
        totalScans: domainScans.length,
        lastScan: domainScans.length > 0 ? domainScans[0].timestamp : null,
    };
};

export const exportReportAsJSON = (data: {
    domain: string;
    scanDate: string;
    vulnerabilities: VulnerabilityReport[];
    summary: any;
}) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astra-report-${data.domain.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const exportReportAsHTML = (data: {
    domain: string;
    scanDate: string;
    vulnerabilities: VulnerabilityReport[];
    summary: any;
}) => {
    // CRITICAL: Escape HTML to prevent XSS execution in the report
    const escapeHtml = (unsafe: string): string => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'unsafe-inline'; script-src 'none';">
    <title>ASTRA Security Report - ${escapeHtml(data.domain)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0d1117; color: #c9d1d9; padding: 2rem; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 2rem; margin-bottom: 2rem; }
        .header h1 { color: #58a6ff; font-size: 2rem; margin-bottom: 0.5rem; }
        .warning { background: rgba(248, 81, 73, 0.1); border: 1px solid #f85149; border-radius: 8px; padding: 1rem; margin-bottom: 2rem; color: #f85149; }
        .warning strong { display: block; margin-bottom: 0.5rem; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 2rem 0; }
        .stat-card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1.5rem; }
        .stat-value { font-size: 2rem; font-weight: bold; color: #58a6ff; }
        .stat-label { color: #8b949e; font-size: 0.875rem; margin-top: 0.5rem; }
        .vulnerability { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; }
        .severity { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; }
        .severity-critical { background: rgba(248, 81, 73, 0.1); color: #f85149; border: 1px solid #f85149; }
        .severity-high { background: rgba(251, 146, 60, 0.1); color: #fb923c; border: 1px solid #fb923c; }
        .severity-medium { background: rgba(210, 153, 34, 0.1); color: #d29922; border: 1px solid #d29922; }
        .severity-low { background: rgba(88, 166, 255, 0.1); color: #58a6ff; border: 1px solid #58a6ff; }
        .section { margin: 1rem 0; }
        .section h3 { color: #8b949e; font-size: 0.875rem; text-transform: uppercase; margin-bottom: 0.5rem; }
        pre { background: #0d1117; border: 1px solid #30363d; border-radius: 4px; padding: 1rem; overflow-x: auto; margin: 0.5rem 0; white-space: pre-wrap; word-wrap: break-word; }
        code { font-family: ui-monospace, monospace; font-size: 0.875rem; color: #c9d1d9; }
        .footer { text-align: center; color: #8b949e; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #30363d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="warning">
            <strong>⚠️ SECURITY NOTICE</strong>
            This report contains vulnerability details and exploit payloads that are displayed as text for documentation purposes only. 
            All dangerous code has been sanitized and will not execute. Do not copy-paste payloads into live systems.
        </div>

        <div class="header">
            <h1>🛡️ ASTRA Security Report</h1>
            <p style="color: #8b949e; margin-top: 0.5rem;">AI-Driven Threat Reconnaissance Agent</p>
            <p style="margin-top: 1rem;"><strong>Domain:</strong> ${escapeHtml(data.domain)}</p>
            <p><strong>Scan Date:</strong> ${escapeHtml(data.scanDate)}</p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">${data.summary.total}</div>
                <div class="stat-label">Total Vulnerabilities</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${escapeHtml(data.summary.avgConfidence)}%</div>
                <div class="stat-label">Average Confidence</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${escapeHtml(data.summary.avgCVSS)}</div>
                <div class="stat-label">Average CVSS Score</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Object.keys(data.summary.vulnerabilityTypes).length}</div>
                <div class="stat-label">Unique Vulnerability Types</div>
            </div>
        </div>

        <h2 style="color: #c9d1d9; margin: 2rem 0 1rem;">Detailed Findings</h2>

        ${data.vulnerabilities.map((vuln, index) => `
            <div class="vulnerability">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <h3 style="color: #c9d1d9; font-size: 1.25rem;">${index + 1}. ${escapeHtml(vuln.vulnerabilityType)}</h3>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <span class="severity severity-${vuln.severity.toLowerCase()}">${escapeHtml(vuln.severity)}</span>
                        <span style="background: #0d1117; border: 1px solid #30363d; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.75rem;">CVSS ${vuln.cvssScore.toFixed(1)}</span>
                        <span style="background: #0d1117; border: 1px solid #30363d; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.75rem;">${Math.round(vuln.confidence * 100)}% Confidence</span>
                    </div>
                </div>

                <div class="section">
                    <h3>What We Found</h3>
                    <p style="white-space: pre-wrap;">${escapeHtml(vuln.shortExplanation)}</p>
                </div>

                <div class="section">
                    <h3>Reproduction Steps</h3>
                    <pre><code>${escapeHtml(vuln.reproductionSteps)}</code></pre>
                </div>

                <div class="section">
                    <h3>Remediation</h3>
                    <p style="white-space: pre-wrap;">${escapeHtml(vuln.remediationExplanation)}</p>
                    ${vuln.remediationCode ? `<pre><code>${escapeHtml(vuln.remediationCode)}</code></pre>` : ''}
                </div>

                <div class="section">
                    <h3>Impact</h3>
                    <p style="white-space: pre-wrap;">${escapeHtml(vuln.impactDescription)}</p>
                </div>

                <div class="section">
                    <h3>Resource URL</h3>
                    <p style="word-break: break-all; color: #58a6ff;">${escapeHtml(vuln.resourceUrl)}</p>
                </div>
            </div>
        `).join('')}

        <div class="footer">
            <p>Generated by ASTRA - AI-Driven Threat Reconnaissance Agent</p>
            <p style="margin-top: 0.5rem; font-size: 0.75rem;">This report is for informational purposes only. Please verify all findings before taking action.</p>
            <p style="margin-top: 0.5rem; font-size: 0.75rem; color: #f85149;">⚠️ All exploit payloads have been sanitized. Do not attempt to execute them.</p>
        </div>
    </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astra-report-${data.domain.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
