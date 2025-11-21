interface SecurityEvent {
  timestamp: number;
  type: "challenge_request" | "verification_success" | "verification_failure" | "threat_blocked" | "replay_attack";
  ip: string;
  riskLevel?: string;
  riskScore?: number;
  details?: Record<string, any>;
}

interface SecurityMetrics {
  totalRequests: number;
  threatsBlocked: number;
  verificationSuccess: number;
  verificationFailure: number;
  replayAttacks: number;
  averageRiskScore: number;
  highRiskRequests: number;
  criticalRiskRequests: number;
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private readonly MAX_EVENTS = 10000;
  private readonly RETENTION_PERIOD_MS = 24 * 60 * 60 * 1000;

  constructor() {
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  logEvent(event: Omit<SecurityEvent, "timestamp">): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now(),
    };

    this.events.push(fullEvent);

    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    if (event.type === "threat_blocked") {
      console.log(`[SECURITY ALERT] Threat blocked from ${event.ip}: ${JSON.stringify(event.details)}`);
    } else if (event.type === "replay_attack") {
      console.log(`[SECURITY ALERT] Replay attack detected from ${event.ip}`);
    }
  }

  getMetrics(timeWindowMs: number = 3600000): SecurityMetrics {
    const now = Date.now();
    const recentEvents = this.events.filter(e => now - e.timestamp < timeWindowMs);

    const challengeRequests = recentEvents.filter(e => e.type === "challenge_request");
    const riskScores = challengeRequests
      .filter(e => e.riskScore !== undefined)
      .map(e => e.riskScore!);

    return {
      totalRequests: challengeRequests.length,
      threatsBlocked: recentEvents.filter(e => e.type === "threat_blocked").length,
      verificationSuccess: recentEvents.filter(e => e.type === "verification_success").length,
      verificationFailure: recentEvents.filter(e => e.type === "verification_failure").length,
      replayAttacks: recentEvents.filter(e => e.type === "replay_attack").length,
      averageRiskScore: riskScores.length > 0 ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length : 0,
      highRiskRequests: challengeRequests.filter(e => e.riskLevel === "high").length,
      criticalRiskRequests: challengeRequests.filter(e => e.riskLevel === "critical").length,
    };
  }

  getRecentThreats(limit: number = 50): SecurityEvent[] {
    return this.events
      .filter(e => e.type === "threat_blocked" || e.type === "replay_attack")
      .slice(-limit)
      .reverse();
  }

  getTopThreatIPs(limit: number = 10, timeWindowMs: number = 3600000): Array<{ip: string; count: number}> {
    const now = Date.now();
    const recentThreats = this.events.filter(
      e => (e.type === "threat_blocked" || e.type === "replay_attack") && now - e.timestamp < timeWindowMs
    );

    const ipCounts = new Map<string, number>();
    for (const event of recentThreats) {
      ipCounts.set(event.ip, (ipCounts.get(event.ip) || 0) + 1);
    }

    return Array.from(ipCounts.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private cleanup(): void {
    const now = Date.now();
    const before = this.events.length;
    this.events = this.events.filter(e => now - e.timestamp < this.RETENTION_PERIOD_MS);
    const removed = before - this.events.length;

    if (removed > 0) {
      console.log(`[SECURITY MONITOR] Cleaned up ${removed} old security events`);
    }
  }

  exportEvents(timeWindowMs: number = 3600000): SecurityEvent[] {
    const now = Date.now();
    return this.events.filter(e => now - e.timestamp < timeWindowMs);
  }
}

export const securityMonitor = new SecurityMonitor();
