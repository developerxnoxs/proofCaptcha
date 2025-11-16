import type { Request } from "express";

export interface BehavioralPattern {
  isBot: boolean;
  confidence: number;
  patterns: string[];
}

interface RequestHistory {
  timestamps: number[];
  userAgents: Set<string>;
  endpoints: string[];
}

const ipHistory = new Map<string, RequestHistory>();

const MAX_HISTORY_SIZE = 100;
const HISTORY_WINDOW_MS = 60 * 60 * 1000;

function getClientIP(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
    (req.headers["x-real-ip"] as string) ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

export function analyzeBehavior(req: Request): BehavioralPattern {
  const patterns: string[] = [];
  let confidence = 0;

  const clientIP = getClientIP(req);
  const now = Date.now();
  const userAgent = req.headers["user-agent"] || "";
  const endpoint = req.path;

  if (!ipHistory.has(clientIP)) {
    ipHistory.set(clientIP, {
      timestamps: [],
      userAgents: new Set(),
      endpoints: [],
    });
  }

  const history = ipHistory.get(clientIP)!;

  history.timestamps = history.timestamps.filter(t => now - t < HISTORY_WINDOW_MS);
  history.timestamps.push(now);
  history.userAgents.add(userAgent);
  history.endpoints.push(endpoint);

  if (history.timestamps.length > MAX_HISTORY_SIZE) {
    history.timestamps = history.timestamps.slice(-MAX_HISTORY_SIZE);
    history.endpoints = history.endpoints.slice(-MAX_HISTORY_SIZE);
  }

  if (history.timestamps.length >= 5) {
    const intervals: number[] = [];
    for (let i = 1; i < history.timestamps.length; i++) {
      intervals.push(history.timestamps[i] - history.timestamps[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => {
      return sum + Math.pow(interval - avgInterval, 2);
    }, 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev < 100 && avgInterval < 2000) {
      patterns.push("perfectly-timed-requests");
      confidence += 30;
    }

    if (avgInterval < 500) {
      patterns.push("too-fast-requests");
      confidence += 25;
    }
  }

  if (history.userAgents.size > 3) {
    patterns.push("multiple-user-agents");
    confidence += 20;
  }

  const recentRequests = history.timestamps.filter(t => now - t < 10000);
  if (recentRequests.length > 10) {
    patterns.push("burst-pattern");
    confidence += 25;
  }

  // Extract behavioral telemetry from request body (sent from frontend)
  const mouseMovements = (req.body as any)?.mouseMovements;
  const keyboardEvents = (req.body as any)?.keyboardEvents;
  const submissionTime = (req.body as any)?.submissionTime;
  
  // Debug logging
  if (endpoint.includes("/challenge") || endpoint.includes("/verify")) {
    console.log(`[BEHAVIORAL DEBUG] Endpoint: ${endpoint}, Mouse: ${mouseMovements}, Keyboard: ${keyboardEvents}, Time: ${submissionTime}`);
  }
  
  // Analyze behavioral data for bot detection
  if (typeof mouseMovements === 'number' && typeof keyboardEvents === 'number' && typeof submissionTime === 'number') {
    // Bot pattern: Too fast submission (< 500ms is suspicious)
    if (submissionTime < 500) {
      patterns.push("suspiciously-fast-submission");
      confidence += 30;
    }
    
    // Bot pattern: No interaction (0 mouse and 0 keyboard)
    if (mouseMovements === 0 && keyboardEvents === 0) {
      patterns.push("no-human-interaction");
      confidence += 40;
    }
    
    // Bot pattern: Very low interaction for the time spent
    const interactionRate = (mouseMovements + keyboardEvents) / (submissionTime / 1000); // interactions per second
    if (interactionRate < 0.5 && submissionTime > 2000) {
      patterns.push("low-interaction-rate");
      confidence += 20;
    }
    
    // Good sign: Natural interaction pattern
    if (mouseMovements > 10 && keyboardEvents > 3 && submissionTime > 1000) {
      confidence = Math.max(0, confidence - 25); // Reduce suspicion
    }
  } else if (endpoint.includes("/verify") || endpoint.includes("/challenge")) {
    // Missing behavioral data is suspicious for verify/challenge endpoints
    patterns.push("missing-behavioral-data");
    confidence += 15;
  }

  const isBot = confidence >= 40;

  return {
    isBot,
    confidence,
    patterns,
  };
}

export function clearOldHistory(): void {
  const now = Date.now();
  for (const [ip, history] of Array.from(ipHistory.entries())) {
    history.timestamps = history.timestamps.filter((t: number) => now - t < HISTORY_WINDOW_MS);
    if (history.timestamps.length === 0) {
      ipHistory.delete(ip);
    }
  }
}

setInterval(clearOldHistory, 5 * 60 * 1000);
