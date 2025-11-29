import type { ScrapedScript, SuspiciousSnippet } from '../types';

// A simple simulation of the Heuristic Pre-Filter Module
const SUSPICIOUS_KEYWORDS = [
    'innerHTML', 'document.write', 'dangerouslySetInnerHTML', 'eval',
    'atob', 'btoa', 'encodeURI', 'decodeURI', 'unascape', 'escape',
    'window.location', 'document.cookie', 'localStorage', 'sessionStorage',
    'postMessage', 'createElement', 'appendChild', 'Function('
];

const BENIGN_PATTERNS = [
    /copyright/i, /license/i, /jquery/i, /react/i, /vue/i, /angular/i,
    /@author/i, /\/\*/, /\*\//
];

// Split code into manageable chunks, e.g., by line count
const CHUNK_SIZE = 50; // lines

export const heuristicFilter = (scripts: ScrapedScript[]): SuspiciousSnippet[] => {
    const suspiciousSnippets: SuspiciousSnippet[] = [];

    for (const script of scripts) {
        if (!script.code.trim()) continue;

        const lines = script.code.split('\n');
        for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
            const chunk = lines.slice(i, i + CHUNK_SIZE).join('\n');
            
            if (!chunk.trim()) continue;

            // Basic check to filter out obviously benign chunks like comment blocks
            if (BENIGN_PATTERNS.some(pattern => pattern.test(chunk))) {
                const benignMatches = BENIGN_PATTERNS.reduce((acc, p) => acc + ((chunk.match(p) || []).length), 0);
                if (benignMatches > 2) continue;
            }
            
            // Check for presence of at least one suspicious keyword
            const isSuspicious = SUSPICIOUS_KEYWORDS.some(keyword => chunk.includes(keyword));
            if (isSuspicious) {
                suspiciousSnippets.push({ code: chunk, url: script.url });
            }
        }
    }

    return suspiciousSnippets;
};