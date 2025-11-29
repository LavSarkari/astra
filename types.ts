export interface ScrapedScript {
  code: string;
  url: string;
}

export interface SuspiciousSnippet {
  code: string;
  url: string;
}

export interface VulnerabilityReport {
  vulnerabilityType: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number;
  shortExplanation: string; // 1. What We Found

  // 3. Where We Found
  vulnerableCode: string;
  resourceUrl: string;

  // 4. How to Reproduce
  reproductionSteps: string;

  // 5. How to Fix
  remediationCode: string;
  remediationExplanation: string;

  // 6. Impact
  impactDescription: string;
  cvssScore: number;

  // Legacy/Optional fields
  vulnerableSink?: string;
  sourceVariable?: string;
  exploitPayloadHypothesis?: string;
}

export type LoadingState = 'idle' | 'scraping' | 'filtering' | 'analyzing' | 'done' | 'error';

export interface ProgressMessage {
  stage: LoadingState;
  message: string;
  detail?: string;
}
