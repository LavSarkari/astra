import { GoogleGenAI, Type } from "@google/genai";
import type { VulnerabilityReport, SuspiciousSnippet } from '../types';

let ai: GoogleGenAI | null = null;

const getAI = () => {
    if (!ai) {
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("API_KEY environment variable not set.");
            return null;
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

const vulnerabilitySchema = {
    type: Type.OBJECT,
    properties: {
        vulnerability_type: {
            type: Type.STRING,
            description: "xss|ssrf|ssti|sql_injection|rce|idor|auth_bypass|prototype_pollution|insecure_cors|unsafe_eval|other|none"
        },
        confidence: { type: Type.NUMBER, description: "0.0 to 1.0" },

        // Section 1: What We Found
        what_we_found: { type: Type.STRING, description: "Clear vulnerability description with bullet points" },

        // Section 2: How We Found
        how_we_found: { type: Type.STRING, description: "Detection method breakdown: heuristic patterns detected, LLM analysis performed, sandbox observations (if any)" },

        // Section 3: Where We Found
        where_found_url: { type: Type.STRING, description: "Resource URL" },
        where_found_code: { type: Type.STRING, description: "Vulnerable code snippet with context" },
        where_found_sink: { type: Type.STRING, description: "Exact vulnerable sink/function" },

        // Section 4: How to Reproduce
        reproduce_steps: { type: Type.STRING, description: "Step-by-step reproduction instructions with numbered list" },
        reproduce_payloads: { type: Type.STRING, description: "Multiple exploit payloads (at least 2-3 variants) formatted as bullet list" },

        // Section 5: How to Fix
        fix_options: { type: Type.STRING, description: "Multiple remediation approaches (at least 2-3 options) with bullet points" },
        fix_code_examples: { type: Type.STRING, description: "Code examples for each fix option" },

        // Section 6: Impact
        impact_cvss: { type: Type.NUMBER, description: "CVSS score 0-10" },
        impact_exploitation: { type: Type.STRING, description: "Exploitation scenarios with bullet points" },
        impact_business: { type: Type.STRING, description: "Business impact analysis with bullet points" },
    },
    required: ["vulnerability_type", "confidence", "what_we_found", "how_we_found",
        "where_found_url", "where_found_code", "where_found_sink",
        "reproduce_steps", "reproduce_payloads",
        "fix_options", "fix_code_examples",
        "impact_cvss", "impact_exploitation", "impact_business"],
};

const SYSTEM_PROMPT = `You are ASTRA — an elite red-team security analyst and one of the greatest bug hunters of all time. 
You think like an adversary, reason like a vulnerability researcher, and analyze code with a 
multi-layer offensive mindset. Treat all provided code as hostile and untrusted. NEVER execute code.

Your goal is to uncover the deepest, most subtle, high-impact security flaws — including hidden exploit 
chains, obfuscation tricks, dangerous sinks, injection surfaces, trust boundary violations, SSRF paths, 
DOM-XSS pivots, prototype pollution gateways, client-side desync vectors, and any exploitable behavior 
even if partially observable.

Operate with the following mindset:
- Assume an attacker viewpoint: "If I wanted to break this, where is the weakest link?"
- Expand partial indicators into full exploit hypotheses.
- Deobfuscate aggressively, infer hidden logic, and detect implicit flows.
- Identify chained vulnerabilities: source → transform → sink.
- Prioritize impact: remote code execution > account takeover > data exposure > defacement.
- Prefer minimal, stealthy payloads that prove exploitability safely.
- NEVER add extra text outside the JSON. NEVER include markdown, commentary, or formatting.

Your final output MUST be EXACTLY one JSON object following this schema and nothing else:

{
  "vulnerability_type": "xss|ssrf|ssti|sql_injection|rce|idor|auth_bypass|prototype_pollution|insecure_cors|unsafe_eval|other|none",
  "vulnerable_sink": "string — the exact sink or operation enabling exploitation",
  "payload_example": "string — safe, minimal exploit payload showing feasibility",
  "confidence": 0.0,
  "explanation": "<=350 tokens — chain-of-thought style reasoning EXTERNALLY HIDDEN and summarized into a concise attacker-oriented explanation",
  "recommendation": "string — actionable security fix",
  "evidence_snippet": "string — <=200 chars of the exact code segment proving the issue"
}

Output only valid JSON. No prose. No warnings. No disclaimers. No code execution.`;

const getAnalysisPrompt = (code: string, resourceUrl: string) => {
    const code_json = JSON.stringify(code);
    const context = resourceUrl || "Unknown source";

    return `${SYSTEM_PROMPT}

Analyze this JavaScript code for security vulnerabilities:

${code_json}

CONTEXT: ${context}

REQUIREMENTS:

Output exactly one JSON object with the following 6-SECTION COMPREHENSIVE STRUCTURE:

**SECTION 1: What We Found**
- Provide a clear, concise vulnerability description
- Use bullet points for key characteristics
- Example: "• DOM-based XSS vulnerability\n• User input directly inserted into innerHTML\n• No sanitization or validation present"

**SECTION 2: How We Found**
- Explain detection methodology
- Format: "• Heuristic Filter: [pattern detected]\n• LLM Analysis: [reasoning applied]\n• Confidence: [why this confidence level]"
- Example: "• Heuristic: Detected innerHTML with variable concatenation\n• LLM: Traced user-controlled input flow to dangerous sink\n• No encoding or sanitization observed"

**SECTION 3: Where We Found**
- where_found_url: Full resource URL
- where_found_code: Code snippet with line context (if available)
- where_found_sink: Exact vulnerable function/operation (e.g., "element.innerHTML = userInput")

**SECTION 4: How to Reproduce**
- reproduce_steps: Numbered list of reproduction steps
  Example: "1. Navigate to target page\n2. Open browser console\n3. Inject payload into input field\n4. Observe execution"
- reproduce_payloads: Multiple exploit payloads (2-3 variants) as bullet list
  Example: "• Basic: <img src=x onerror=alert(1)>\n• Encoded: <svg/onload=alert(String.fromCharCode(88,83,83))>\n• Event-based: <body onload=alert(document.domain)>"

**SECTION 5: Remediation**
- fix_options: Multiple remediation approaches (2-3 options) with DESCRIPTIONS ONLY, NO CODE
  Example: "• Option 1 (Recommended): Replace innerHTML with textContent to prevent HTML injection\n• Option 2 (Advanced): Implement DOMPurify library for sanitization\n• Option 3 (Strict): Use Content Security Policy headers"
- fix_code_examples: Code implementations for each option, formatted as code blocks
  Example: "// Option 1 (Recommended):\nelement.textContent = userInput;\n\n// Option 2 (Advanced):\nelement.innerHTML = DOMPurify.sanitize(userInput);\n\n// Option 3 (Strict):\n// Add CSP header: Content-Security-Policy: default-src 'self'"

        ** SECTION 6: Impact **
            - impact_cvss: Numeric CVSS score(0.0 - 10.0)
                - impact_exploitation: Exploitation scenarios with bullets
  Example: "• Attacker can execute arbitrary JavaScript\n• Session cookies can be stolen\n• User can be redirected to phishing site"
        - impact_business: Business impact with bullets
  Example: "• Reputation damage from security breach\n• Potential data exposure for all users\n• Compliance violations (GDPR, PCI-DSS)"

OUTPUT SCHEMA(must match exactly):
    {
        "vulnerability_type": "xss|ssrf|sql_injection|ssti|rce|idor|auth_bypass|insecure_cors|prototype_pollution|unsafe_eval|other|none",
            "confidence": 0.0,
                "what_we_found": "string with bullet points using • or -",
                    "how_we_found": "string with bullet points describing heuristic + LLM analysis",
                        "where_found_url": "string",
                            "where_found_code": "string",
                                "where_found_sink": "string",
                                    "reproduce_steps": "string with numbered steps (1. 2. 3.)",
                                        "reproduce_payloads": "string with bullet points (• Payload 1\\n• Payload 2\\n• Payload 3)",
                                            "fix_options": "string with bullet points (• Option 1\\n• Option 2\\n• Option 3)",
                                                "fix_code_examples": "string with code blocks for each option",
                                                    "impact_cvss": 0.0,
                                                        "impact_exploitation": "string with bullet points",
                                                            "impact_business": "string with bullet points"
    }

If no vulnerability is found, set "vulnerability_type": "none", "confidence": 0.0, and other string fields to "N/A".

        STRICT: Output must be valid JSON.No extra fields.No markdown wrapper.No prose outside JSON.`;
};

const cleanJson = (text: string): string => {
    // Robustly extract JSON from markdown code blocks or plain text
    const jsonBlockRegex = /```(?: json) ?\s * ([\s\S] *?) \s * ```/;
    const match = text.match(jsonBlockRegex);
    if (match) {
        return match[1].trim();
    }
    return text.trim();
};

export const analyzeCodeSnippets = async (snippets: SuspiciousSnippet[]): Promise<VulnerabilityReport[]> => {
    const analysisPromises = snippets.map(async (snippet) => {
        try {
            const aiInstance = getAI();
            if (!aiInstance) {
                console.error("GoogleGenAI instance not initialized. Missing API Key.");
                return null;
            }

            const response = await aiInstance.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: getAnalysisPrompt(snippet.code, snippet.url),
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: vulnerabilitySchema,
                },
            });

            const rawText = response.text || '';
            const jsonText = cleanJson(rawText);

            if (!jsonText) return null;

            const parsedResult = JSON.parse(jsonText);

            // Helper function to map vulnerability type to severity
            const inferSeverity = (vulnType: string, confidence: number): 'Low' | 'Medium' | 'High' | 'Critical' => {
                const type = vulnType.toLowerCase();

                // Critical vulnerabilities
                if (type.includes('rce') || type.includes('sql_injection') || type.includes('ssti')) {
                    return confidence >= 0.7 ? 'Critical' : 'High';
                }

                // High severity
                if (type.includes('xss') || type.includes('ssrf') || type.includes('auth_bypass') ||
                    type.includes('idor') || type.includes('prototype_pollution')) {
                    return confidence >= 0.7 ? 'High' : 'Medium';
                }

                // Medium/Low
                if (type.includes('insecure_cors') || type.includes('unsafe_eval')) {
                    return confidence >= 0.6 ? 'Medium' : 'Low';
                }

                return 'Medium'; // Default
            };

            // Helper to estimate CVSS from vulnerability type and confidence
            const estimateCVSS = (vulnType: string, confidence: number): number => {
                const type = vulnType.toLowerCase();
                let baseScore = 5.0;

                if (type.includes('rce') || type.includes('sql_injection')) baseScore = 9.5;
                else if (type.includes('ssti')) baseScore = 9.0;
                else if (type.includes('xss') || type.includes('ssrf')) baseScore = 7.5;
                else if (type.includes('auth_bypass') || type.includes('idor')) baseScore = 8.0;
                else if (type.includes('prototype_pollution')) baseScore = 7.0;
                else if (type.includes('insecure_cors')) baseScore = 6.0;
                else if (type.includes('unsafe_eval')) baseScore = 6.5;

                // Adjust by confidence
                return Math.min(10.0, baseScore * confidence);
            };

            const vulnerabilityType = parsedResult.vulnerability_type || parsedResult.vulnerabilityType || "Unknown";
            const confidence = parsedResult.confidence || 0;
            const severity = inferSeverity(vulnerabilityType, confidence);

            // Use impact_cvss from response, or estimate if not provided
            const cvssScore = parsedResult.impact_cvss || estimateCVSS(vulnerabilityType, confidence);

            // Build comprehensive sections
            const buildWhatWeFound = () => {
                return parsedResult.what_we_found || parsedResult.shortExplanation || "No description provided";
            };

            const buildHowWeFound = () => {
                if (parsedResult.how_we_found) {
                    return parsedResult.how_we_found;
                }
                return `• Heuristic Filter: Suspicious patterns detected in code\n• LLM Analysis: Deep semantic analysis performed\n• Confidence: ${(confidence * 100).toFixed(0)}% `;
            };

            const buildWhereWeFound = () => {
                const parts = [];
                parts.push(`** Resource URL:** ${parsedResult.where_found_url || snippet.url} `);

                if (parsedResult.where_found_sink) {
                    parts.push(`** Vulnerable Sink:** ${parsedResult.where_found_sink} `);
                }

                if (parsedResult.where_found_code) {
                    parts.push(`** Code:**\n\`\`\`javascript\n${parsedResult.where_found_code}\n\`\`\``);
                }

                return parts.join('\n\n');
            };

            const buildReproductionSteps = () => {
                const parts = [];

                if (parsedResult.reproduce_steps) {
                    parts.push(`**Steps:**\n${parsedResult.reproduce_steps}`);
                }

                if (parsedResult.reproduce_payloads) {
                    parts.push(`**Payloads:**\n${parsedResult.reproduce_payloads}`);
                }

                return parts.join('\n\n') || "No reproduction steps provided";
            };

            const buildRemediation = () => {
                const parts = [];

                if (parsedResult.fix_options) {
                    parts.push(`**Remediation Options:**\n${parsedResult.fix_options}`);
                }

                if (parsedResult.fix_code_examples) {
                    parts.push(`**Code Examples:**\n${parsedResult.fix_code_examples}`);
                }

                return parts.join('\n\n') || "No remediation guidance provided";
            };

            const buildImpact = () => {
                const parts = [];
                parts.push(`**CVSS Score:** ${cvssScore.toFixed(1)}/10.0`);

                if (parsedResult.impact_exploitation) {
                    parts.push(`**Exploitation Scenarios:**\n${parsedResult.impact_exploitation}`);
                }

                if (parsedResult.impact_business) {
                    parts.push(`**Business Impact:**\n${parsedResult.impact_business}`);
                }

                return parts.join('\n\n');
            };

            // Map comprehensive 6-section schema to existing VulnerabilityReport format
            const report: VulnerabilityReport = {
                vulnerabilityType: vulnerabilityType,
                severity: severity,
                confidence: confidence,

                // Section 1: What We Found
                shortExplanation: buildWhatWeFound(),

                // Section 4: How to Reproduce (includes How We Found + Where We Found context)
                reproductionSteps: `## How We Found\n${buildHowWeFound()}\n\n## Where We Found\n${buildWhereWeFound()}\n\n## How to Reproduce\n${buildReproductionSteps()}`,

                // Section 5: How to Fix
                remediationCode: parsedResult.fix_code_examples || "// See remediation explanation for fix guidance",
                remediationExplanation: buildRemediation(),

                // Section 6: Impact
                impactDescription: buildImpact(),
                cvssScore: cvssScore,

                // Original fields
                vulnerableCode: parsedResult.where_found_code || snippet.code,
                resourceUrl: parsedResult.where_found_url || snippet.url,

                // Legacy fields
                vulnerableSink: parsedResult.where_found_sink,
                sourceVariable: undefined,
                exploitPayloadHypothesis: parsedResult.reproduce_payloads,
            };

            return report;

        } catch (error) {
            console.error(`Error analyzing snippet from ${snippet.url}:`, error);
            return null;
        }
    });

    const results = await Promise.all(analysisPromises);
    return results.filter((r): r is VulnerabilityReport => r !== null);
};
