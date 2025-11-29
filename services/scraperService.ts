import type { ScrapedScript } from '../types';

// Multiple CORS proxies as fallbacks
const PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
];

/**
 * Fetches content from a URL with timeout support
 */
const fetchWithTimeout = async (url: string, timeout = 10000): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
};

/**
 * Fetches content from a URL, bypassing CORS using multiple proxy fallbacks.
 * @param url The URL to fetch.
 * @returns The content of the URL as a string.
 */
const fetchWithProxy = async (url: string): Promise<string> => {
    let lastError: Error | null = null;

    // Try each proxy in sequence
    for (let i = 0; i < PROXIES.length; i++) {
        const proxy = PROXIES[i];
        try {
            const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
            console.log(`Attempting to fetch via proxy ${i + 1}/${PROXIES.length}: ${proxy}`);

            const response = await fetchWithTimeout(proxyUrl, 15000);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const text = await response.text();

            // Check if proxy returned an error in JSON format
            try {
                const data = JSON.parse(text);
                if (data.error || (data.contents === null && data.status)) {
                    throw new Error(`Proxy returned error: ${data.error || 'Invalid response'}`);
                }
            } catch (e) {
                // Not JSON or our specific error - this is expected for valid responses
                if (e instanceof Error && e.message.startsWith('Proxy returned error')) {
                    throw e;
                }
            }

            console.log(`✓ Successfully fetched via proxy ${i + 1}`);
            return text;

        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            console.warn(`✗ Proxy ${i + 1} failed:`, lastError.message);

            // If not the last proxy, continue to next one
            if (i < PROXIES.length - 1) {
                continue;
            }
        }
    }

    // All proxies failed
    throw new Error(`Failed to fetch ${url}. All proxies failed. Last error: ${lastError?.message || 'Unknown error'}`);
};

/**
 * Checks if a URL belongs to the same domain or subdomain
 */
const isSameDomainOrSubdomain = (scriptUrl: string, targetUrl: string): boolean => {
    try {
        const scriptDomain = new URL(scriptUrl).hostname;
        const targetDomain = new URL(targetUrl).hostname;

        // Exact match
        if (scriptDomain === targetDomain) return true;

        // Check if it's a subdomain
        // e.g., api.lavsarkari.me is subdomain of lavsarkari.me
        const targetParts = targetDomain.split('.');
        const scriptParts = scriptDomain.split('.');

        // Get base domain (last 2 parts, e.g., lavsarkari.me)
        const targetBase = targetParts.slice(-2).join('.');
        const scriptBase = scriptParts.slice(-2).join('.');

        return targetBase === scriptBase;
    } catch {
        return false;
    }
};

/**
 * Scrapes all inline and external JavaScript from a given URL.
 * Only includes scripts from the same domain and subdomains.
 * @param targetUrl The URL of the website to scrape.
 * @returns An array of ScrapedScript objects, each containing code and its source URL.
 */
export const scrapeJavaScriptFromUrl = async (targetUrl: string): Promise<ScrapedScript[]> => {
    const html = await fetchWithProxy(targetUrl);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const scripts = Array.from(doc.querySelectorAll('script'));

    const scrapedScripts: ScrapedScript[] = [];

    // 1. Extract inline scripts (always from same domain)
    const inlineScripts = scripts.filter(s => !s.src && s.textContent);
    for (const script of inlineScripts) {
        if (script.textContent) {
            scrapedScripts.push({
                code: script.textContent,
                url: targetUrl
            });
        }
    }

    // 2. Extract and fetch external scripts (with domain filtering)
    const externalScriptUrls = scripts
        .filter(s => s.src)
        .map(s => {
            try {
                return new URL(s.getAttribute('src')!, targetUrl).href;
            } catch {
                return null;
            }
        })
        .filter((url): url is string => url !== null)
        .filter(url => isSameDomainOrSubdomain(url, targetUrl)); // Domain filter

    console.log(`Found ${externalScriptUrls.length} external scripts from same domain/subdomains`);

    const externalScriptPromises = externalScriptUrls.map(async (url) => {
        try {
            const code = await fetchWithProxy(url);
            return { code, url };
        } catch (err) {
            console.warn(`Could not fetch script ${url}:`, err instanceof Error ? err.message : String(err));
            return null; // Return null on failure to not break the entire scrape
        }
    });

    const externalScripts = (await Promise.all(externalScriptPromises))
        .filter((s): s is ScrapedScript => s !== null);

    console.log(`Successfully fetched ${externalScripts.length} external scripts`);
    return [...scrapedScripts, ...externalScripts];
};