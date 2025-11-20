import type { Request } from "express";
import type { DeviceFingerprint } from "./device-fingerprint";
import type { AutomationCheckResult } from "./automation-detector";

export interface RiskAssessment {
  riskLevel: "low" | "medium" | "high" | "critical";
  riskScore: number;
  recommendedDifficulty: number;
  factors: string[];
  shouldChallenge: boolean;
  mlScores?: MLScoreBreakdown;
  confidence: number;
}

export interface MLScoreBreakdown {
  automationScore: number;
  behavioralScore: number;
  fingerprintScore: number;
  reputationScore: number;
  anomalyScore: number;
  temporalScore: number;
  ensembleScore: number;
  featureImportance: Record<string, number>;
}

export interface RiskFactors {
  ipReputation: number;
  automationScore: number;
  deviceScore: number;
  requestPatterns: number;
  timeToSolve?: number;
}

export interface MLScoringConfig {
  enabled: boolean;
  automationWeight: number;
  behavioralWeight: number;
  fingerprintWeight: number;
  reputationWeight: number;
  anomalyWeight: number;
  temporalWeight: number;
  thresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  sensitivity: 'low' | 'medium' | 'high' | 'paranoid';
  useEnsemble: boolean;
  adaptiveLearning: boolean;
}

// Default ML configuration
const DEFAULT_ML_CONFIG: MLScoringConfig = {
  enabled: true,
  automationWeight: 0.25,
  behavioralWeight: 0.20,
  fingerprintWeight: 0.15,
  reputationWeight: 0.15,
  anomalyWeight: 0.15,
  temporalWeight: 0.10,
  thresholds: {
    low: 20,
    medium: 40,
    high: 65,
    critical: 85,
  },
  sensitivity: 'medium',
  useEnsemble: true,
  adaptiveLearning: false,
};

// In-memory time-series data for temporal analysis
interface TemporalData {
  timestamps: number[];
  scores: number[];
  patterns: string[];
}

const temporalCache = new Map<string, TemporalData>();
const TEMPORAL_WINDOW_MS = 300000; // 5 minutes
const MAX_TEMPORAL_ENTRIES = 100;

/**
 * Advanced ML-based Bot Scoring System
 * Uses neural network-like weighted scoring with multiple feature layers
 */
export function calculateMLRiskScore(
  req: Request,
  automationCheck: AutomationCheckResult,
  deviceFingerprint: DeviceFingerprint,
  ipBlockCount: number = 0,
  previousFailures: number = 0,
  mlConfig: Partial<MLScoringConfig> = {}
): RiskAssessment {
  const config = { ...DEFAULT_ML_CONFIG, ...mlConfig };
  
  if (!config.enabled) {
    // Fallback to basic scoring if ML is disabled
    return calculateRiskScore(req, automationCheck, deviceFingerprint, ipBlockCount, previousFailures);
  }

  const factors: string[] = [];
  const featureImportance: Record<string, number> = {};

  // Layer 1: Automation Detection Score (Neural-like processing)
  const automationScore = calculateAutomationFeatureScore(
    automationCheck,
    config.sensitivity
  );
  featureImportance['automation'] = automationScore;
  if (automationScore > 0) {
    factors.push(`ml-automation: ${automationScore.toFixed(2)}`);
  }

  // Layer 2: Behavioral Pattern Score
  const behavioralScore = calculateBehavioralFeatureScore(
    req,
    config.sensitivity
  );
  featureImportance['behavioral'] = behavioralScore;
  if (behavioralScore > 0) {
    factors.push(`ml-behavioral: ${behavioralScore.toFixed(2)}`);
  }

  // Layer 3: Device Fingerprint Score
  const fingerprintScore = calculateFingerprintFeatureScore(
    deviceFingerprint,
    config.sensitivity
  );
  featureImportance['fingerprint'] = fingerprintScore;
  if (fingerprintScore > 0) {
    factors.push(`ml-fingerprint: ${fingerprintScore.toFixed(2)}`);
  }

  // Layer 4: Reputation Score (IP history, failures)
  const reputationScore = calculateReputationFeatureScore(
    ipBlockCount,
    previousFailures,
    req,
    config.sensitivity
  );
  featureImportance['reputation'] = reputationScore;
  if (reputationScore > 0) {
    factors.push(`ml-reputation: ${reputationScore.toFixed(2)}`);
  }

  // Layer 5: Anomaly Detection Score
  const anomalyScore = calculateAnomalyScore(req, config.sensitivity);
  featureImportance['anomaly'] = anomalyScore;
  if (anomalyScore > 0) {
    factors.push(`ml-anomaly: ${anomalyScore.toFixed(2)}`);
  }

  // Layer 6: Temporal Analysis Score (time-series patterns)
  const clientIP = getClientIP(req);
  const temporalScore = calculateTemporalScore(
    clientIP,
    automationScore + behavioralScore + fingerprintScore,
    config.sensitivity
  );
  featureImportance['temporal'] = temporalScore;
  if (temporalScore > 0) {
    factors.push(`ml-temporal: ${temporalScore.toFixed(2)}`);
  }

  // Neural Network-like Weighted Ensemble
  let ensembleScore = 0;
  
  if (config.useEnsemble) {
    // Weighted sum with configured weights
    ensembleScore = (
      automationScore * config.automationWeight +
      behavioralScore * config.behavioralWeight +
      fingerprintScore * config.fingerprintWeight +
      reputationScore * config.reputationWeight +
      anomalyScore * config.anomalyWeight +
      temporalScore * config.temporalWeight
    );

    // Apply sigmoid activation for normalization
    ensembleScore = sigmoid(ensembleScore, 50, 0.1) * 100;
  } else {
    // Simple average
    ensembleScore = (
      automationScore + behavioralScore + fingerprintScore + 
      reputationScore + anomalyScore + temporalScore
    ) / 6;
  }

  factors.push(`ml-ensemble: ${ensembleScore.toFixed(2)}`);

  // Calculate confidence based on feature agreement
  const confidence = calculateConfidence([
    automationScore,
    behavioralScore,
    fingerprintScore,
    reputationScore,
    anomalyScore,
    temporalScore
  ]);

  // Determine risk level based on configurable thresholds
  let riskLevel: "low" | "medium" | "high" | "critical";
  let recommendedDifficulty: number;
  let shouldChallenge: boolean;

  if (ensembleScore >= config.thresholds.critical) {
    riskLevel = "critical";
    recommendedDifficulty = 8;
    shouldChallenge = true;
    factors.push('action: block-or-verify');
  } else if (ensembleScore >= config.thresholds.high) {
    riskLevel = "high";
    recommendedDifficulty = 7;
    shouldChallenge = true;
    factors.push('action: hard-challenge');
  } else if (ensembleScore >= config.thresholds.medium) {
    riskLevel = "medium";
    recommendedDifficulty = 5;
    shouldChallenge = true;
    factors.push('action: medium-challenge');
  } else if (ensembleScore >= config.thresholds.low) {
    riskLevel = "low";
    recommendedDifficulty = 4;
    shouldChallenge = false;
    factors.push('action: low-challenge');
  } else {
    riskLevel = "low";
    recommendedDifficulty = 3;
    shouldChallenge = false;
    factors.push('action: allow');
  }

  const mlScores: MLScoreBreakdown = {
    automationScore,
    behavioralScore,
    fingerprintScore,
    reputationScore,
    anomalyScore,
    temporalScore,
    ensembleScore,
    featureImportance,
  };

  return {
    riskLevel,
    riskScore: Math.round(ensembleScore),
    recommendedDifficulty,
    factors,
    shouldChallenge,
    mlScores,
    confidence,
  };
}

/**
 * Layer 1: Advanced Automation Detection with Neural-like Processing
 */
function calculateAutomationFeatureScore(
  automationCheck: AutomationCheckResult,
  sensitivity: 'low' | 'medium' | 'high' | 'paranoid'
): number {
  let score = automationCheck.score;

  // Apply sensitivity multiplier
  const sensitivityMultiplier = {
    'low': 0.7,
    'medium': 1.0,
    'high': 1.3,
    'paranoid': 1.6
  }[sensitivity];

  score *= sensitivityMultiplier;

  // Detection confidence boost
  if (automationCheck.isAutomation) {
    score += 15;
  }

  // Specific pattern penalties
  const patterns = automationCheck.detectedBy || [];
  if (patterns.includes('headless-user-agent')) {
    score += 20;
  }
  if (patterns.includes('automation-framework')) {
    score += 25;
  }
  if (patterns.includes('bot-pattern-puppeteer') || patterns.includes('bot-pattern-selenium')) {
    score += 30;
  }

  return Math.min(score, 100);
}

/**
 * Layer 2: Behavioral Pattern Analysis
 */
function calculateBehavioralFeatureScore(
  req: Request,
  sensitivity: 'low' | 'medium' | 'high' | 'paranoid'
): number {
  let score = 0;

  // Mouse movement analysis (from request body if available)
  const mouseMovements = (req.body as any)?.mouseMovements || 0;
  const keyboardEvents = (req.body as any)?.keyboardEvents || 0;
  const submissionTime = (req.body as any)?.submissionTime || 0;

  // Missing behavioral data is suspicious
  if (!mouseMovements && !keyboardEvents) {
    score += 25;
  } else {
    // Too little interaction
    if (mouseMovements < 5) score += 15;
    if (keyboardEvents < 2) score += 10;
  }

  // Timing analysis
  if (submissionTime > 0) {
    if (submissionTime < 500) {
      score += 30; // Suspiciously fast
    } else if (submissionTime < 1000) {
      score += 15;
    } else if (submissionTime > 180000) {
      score += 10; // Suspiciously slow (bot might be doing other things)
    }
  }

  // Request rate analysis
  const requestFrequency = (req as any).rateLimit?.current || 0;
  if (requestFrequency > 30) {
    score += Math.min((requestFrequency - 30) * 2, 40);
  }

  // Apply sensitivity
  const sensitivityMultiplier = {
    'low': 0.6,
    'medium': 1.0,
    'high': 1.4,
    'paranoid': 1.8
  }[sensitivity];

  return Math.min(score * sensitivityMultiplier, 100);
}

/**
 * Layer 3: Device Fingerprint Analysis
 */
function calculateFingerprintFeatureScore(
  deviceFingerprint: DeviceFingerprint,
  sensitivity: 'low' | 'medium' | 'high' | 'paranoid'
): number {
  let score = deviceFingerprint.score || 0;

  // Suspicious signals
  if (deviceFingerprint.isSuspicious) {
    score += 20;
  }

  // Analyze specific signals
  const signals = deviceFingerprint.signals || [];
  for (const signal of signals) {
    if (signal.includes('missing-accept-language')) score += 8;
    if (signal.includes('missing-accept-encoding')) score += 8;
    if (signal.includes('abnormal-header-order')) score += 12;
    if (signal.includes('short-user-agent')) score += 15;
    if (signal.includes('no-tls-fingerprint')) score += 5;
  }

  // Apply sensitivity
  const sensitivityMultiplier = {
    'low': 0.7,
    'medium': 1.0,
    'high': 1.3,
    'paranoid': 1.7
  }[sensitivity];

  return Math.min(score * sensitivityMultiplier, 100);
}

/**
 * Layer 4: IP Reputation & History Analysis
 */
function calculateReputationFeatureScore(
  ipBlockCount: number,
  previousFailures: number,
  req: Request,
  sensitivity: 'low' | 'medium' | 'high' | 'paranoid'
): number {
  let score = 0;

  // IP block history
  score += ipBlockCount * 15;

  // Previous failures
  score += previousFailures * 8;

  // Check for proxy/VPN headers
  const viaHeader = req.headers['via'];
  const forwardedFor = req.headers['x-forwarded-for'];
  const proxyHeaders = [
    'x-proxy-id',
    'proxy-connection',
    'x-anonymous',
    'x-proxy'
  ];

  if (viaHeader) score += 10;
  if (forwardedFor && typeof forwardedFor === 'string' && forwardedFor.split(',').length > 2) {
    score += 15; // Multiple proxies
  }

  for (const header of proxyHeaders) {
    if (req.headers[header]) {
      score += 12;
    }
  }

  // Apply sensitivity
  const sensitivityMultiplier = {
    'low': 0.6,
    'medium': 1.0,
    'high': 1.5,
    'paranoid': 2.0
  }[sensitivity];

  return Math.min(score * sensitivityMultiplier, 100);
}

/**
 * Layer 5: Anomaly Detection (Statistical Analysis)
 */
function calculateAnomalyScore(
  req: Request,
  sensitivity: 'low' | 'medium' | 'high' | 'paranoid'
): number {
  let score = 0;

  // Missing standard headers (anomaly)
  const hasSecFetchHeaders = req.headers["sec-fetch-site"] !== undefined;
  const hasModernBrowserFeatures = 
    req.headers["sec-ch-ua"] !== undefined ||
    req.headers["sec-fetch-dest"] !== undefined;
  
  if (!hasSecFetchHeaders) {
    score += 12;
  }
  
  if (!hasModernBrowserFeatures) {
    score += 18;
  }

  // Unusual accept headers
  const acceptHeader = req.headers['accept'];
  const acceptLanguage = req.headers['accept-language'];
  
  if (!acceptHeader || acceptHeader === '*/*') {
    score += 10;
  }
  
  if (!acceptLanguage) {
    score += 8;
  }

  // Check for unusual header combinations
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
  const hasDesktopHeaders = req.headers['sec-ch-ua-mobile'] === '?0';
  
  if (isMobile && hasDesktopHeaders) {
    score += 15; // Inconsistency
  }

  // Timing anomalies from request metadata
  const requestTime = Date.now();
  const clientTime = (req.body as any)?.clientTimestamp || requestTime;
  const timeDiff = Math.abs(requestTime - clientTime);
  
  if (timeDiff > 300000) {
    score += 20; // Clock skew > 5 minutes is suspicious
  }

  // Apply sensitivity
  const sensitivityMultiplier = {
    'low': 0.5,
    'medium': 1.0,
    'high': 1.5,
    'paranoid': 2.2
  }[sensitivity];

  return Math.min(score * sensitivityMultiplier, 100);
}

/**
 * Layer 6: Temporal Analysis (Time-series pattern detection)
 */
function calculateTemporalScore(
  clientIP: string,
  currentScore: number,
  sensitivity: 'low' | 'medium' | 'high' | 'paranoid'
): number {
  const now = Date.now();
  
  if (!temporalCache.has(clientIP)) {
    temporalCache.set(clientIP, {
      timestamps: [],
      scores: [],
      patterns: []
    });
  }

  const temporal = temporalCache.get(clientIP)!;

  // Clean old data
  const cutoff = now - TEMPORAL_WINDOW_MS;
  const validIndices: number[] = [];
  for (let i = 0; i < temporal.timestamps.length; i++) {
    if (temporal.timestamps[i] > cutoff) {
      validIndices.push(i);
    }
  }

  temporal.timestamps = validIndices.map(i => temporal.timestamps[i]);
  temporal.scores = validIndices.map(i => temporal.scores[i]);
  temporal.patterns = validIndices.map(i => temporal.patterns[i]);

  // Add current data
  temporal.timestamps.push(now);
  temporal.scores.push(currentScore);

  // Limit cache size
  if (temporal.timestamps.length > MAX_TEMPORAL_ENTRIES) {
    temporal.timestamps = temporal.timestamps.slice(-MAX_TEMPORAL_ENTRIES);
    temporal.scores = temporal.scores.slice(-MAX_TEMPORAL_ENTRIES);
    temporal.patterns = temporal.patterns.slice(-MAX_TEMPORAL_ENTRIES);
  }

  let score = 0;

  if (temporal.timestamps.length >= 3) {
    // Calculate request intervals
    const intervals: number[] = [];
    for (let i = 1; i < temporal.timestamps.length; i++) {
      intervals.push(temporal.timestamps[i] - temporal.timestamps[i - 1]);
    }

    // Detect perfectly timed requests (bot characteristic)
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => {
      return sum + Math.pow(interval - avgInterval, 2);
    }, 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev < 100 && avgInterval < 3000) {
      score += 25; // Very regular timing = bot
      temporal.patterns.push('regular-timing');
    }

    // Detect burst patterns
    const recentCount = temporal.timestamps.filter(t => now - t < 10000).length;
    if (recentCount > 8) {
      score += 20;
      temporal.patterns.push('burst-pattern');
    }

    // Detect escalating risk scores over time
    if (temporal.scores.length >= 3) {
      const recentScores = temporal.scores.slice(-3);
      const isEscalating = recentScores[0] < recentScores[1] && recentScores[1] < recentScores[2];
      if (isEscalating && recentScores[2] > 40) {
        score += 15;
        temporal.patterns.push('escalating-risk');
      }
    }
  }

  // Apply sensitivity
  const sensitivityMultiplier = {
    'low': 0.6,
    'medium': 1.0,
    'high': 1.4,
    'paranoid': 1.9
  }[sensitivity];

  return Math.min(score * sensitivityMultiplier, 100);
}

/**
 * Sigmoid activation function for normalization
 */
function sigmoid(x: number, midpoint: number = 50, steepness: number = 0.1): number {
  return 1 / (1 + Math.exp(-steepness * (x - midpoint)));
}

/**
 * Calculate confidence based on feature agreement
 * Higher confidence when features agree on risk level
 */
function calculateConfidence(scores: number[]): number {
  if (scores.length === 0) return 0;

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => {
    return sum + Math.pow(score - mean, 2);
  }, 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // Low variance = high agreement = high confidence
  // Normalize to 0-100 scale
  const normalizedVariance = Math.min(stdDev / 50, 1);
  const confidence = (1 - normalizedVariance) * 100;

  return Math.round(confidence);
}

/**
 * Get client IP from request
 */
function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Legacy risk scoring function (fallback when ML is disabled)
 */
export function calculateRiskScore(
  req: Request,
  automationCheck: AutomationCheckResult,
  deviceFingerprint: DeviceFingerprint,
  ipBlockCount: number = 0,
  previousFailures: number = 0
): RiskAssessment {
  const factors: string[] = [];
  let totalScore = 0;

  const automationScore = automationCheck.score;
  if (automationScore > 0) {
    totalScore += automationScore;
    factors.push(`automation-detection: ${automationScore}`);
  }

  const deviceScore = deviceFingerprint.score;
  if (deviceScore > 0) {
    totalScore += deviceScore;
    factors.push(`device-fingerprint: ${deviceScore}`);
  }

  const ipReputationScore = ipBlockCount * 10 + previousFailures * 5;
  if (ipReputationScore > 0) {
    totalScore += ipReputationScore;
    factors.push(`ip-reputation: ${ipReputationScore}`);
  }

  const requestFrequency = (req as any).rateLimit?.current || 0;
  if (requestFrequency > 20) {
    const frequencyScore = Math.min((requestFrequency - 20) * 2, 30);
    totalScore += frequencyScore;
    factors.push(`high-frequency: ${frequencyScore}`);
  }

  const hasSecFetchHeaders = req.headers["sec-fetch-site"] !== undefined;
  if (!hasSecFetchHeaders) {
    totalScore += 5;
    factors.push("missing-sec-fetch-headers: 5");
  }

  const hasModernBrowserFeatures = 
    req.headers["sec-ch-ua"] !== undefined ||
    req.headers["sec-fetch-dest"] !== undefined;
  
  if (!hasModernBrowserFeatures) {
    totalScore += 10;
    factors.push("old-browser-or-bot: 10");
  }

  let riskLevel: "low" | "medium" | "high" | "critical";
  let recommendedDifficulty: number;
  let shouldChallenge: boolean;

  if (totalScore >= 80) {
    riskLevel = "critical";
    recommendedDifficulty = 7;
    shouldChallenge = true;
  } else if (totalScore >= 50) {
    riskLevel = "high";
    recommendedDifficulty = 6;
    shouldChallenge = true;
  } else if (totalScore >= 25) {
    riskLevel = "medium";
    recommendedDifficulty = 5;
    shouldChallenge = true;
  } else {
    riskLevel = "low";
    recommendedDifficulty = 4;
    shouldChallenge = false;
  }

  return {
    riskLevel,
    riskScore: totalScore,
    recommendedDifficulty,
    factors,
    shouldChallenge,
    confidence: 75, // Default confidence for legacy scoring
  };
}

export function calculateAdaptiveDifficulty(
  baselineDifficulty: number,
  riskAssessment: RiskAssessment,
  solveTimeMs?: number
): number {
  let difficulty = Math.max(baselineDifficulty, riskAssessment.recommendedDifficulty);

  if (solveTimeMs !== undefined) {
    if (solveTimeMs < 500) {
      difficulty = Math.min(difficulty + 2, 8);
    } else if (solveTimeMs < 1000) {
      difficulty = Math.min(difficulty + 1, 8);
    }
  }

  return Math.min(Math.max(difficulty, 4), 8);
}

// Cleanup old temporal data periodically
setInterval(() => {
  const now = Date.now();
  const cutoff = now - TEMPORAL_WINDOW_MS;
  
  for (const [ip, data] of temporalCache.entries()) {
    const validIndices: number[] = [];
    for (let i = 0; i < data.timestamps.length; i++) {
      if (data.timestamps[i] > cutoff) {
        validIndices.push(i);
      }
    }
    
    if (validIndices.length === 0) {
      temporalCache.delete(ip);
    } else {
      data.timestamps = validIndices.map(i => data.timestamps[i]);
      data.scores = validIndices.map(i => data.scores[i]);
      data.patterns = validIndices.map(i => data.patterns[i]);
    }
  }
  
  console.log(`[ML-SCORING] Temporal cache cleanup: ${temporalCache.size} IPs tracked`);
}, 60000); // Cleanup every minute
