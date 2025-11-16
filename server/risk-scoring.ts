import type { Request } from "express";
import type { DeviceFingerprint } from "./device-fingerprint";
import type { AutomationCheckResult } from "./automation-detector";

export interface RiskAssessment {
  riskLevel: "low" | "medium" | "high" | "critical";
  riskScore: number;
  recommendedDifficulty: number;
  factors: string[];
  shouldChallenge: boolean;
}

export interface RiskFactors {
  ipReputation: number;
  automationScore: number;
  deviceScore: number;
  requestPatterns: number;
  timeToSolve?: number;
}

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
