import type { Request } from "express";
import crypto from "crypto";

export interface DeviceFingerprint {
  id: string;
  score: number;
  signals: string[];
  isSuspicious: boolean;
}

export function generateDeviceFingerprint(req: Request): DeviceFingerprint {
  const signals: string[] = [];
  let suspicionScore = 0;

  const userAgent = req.headers["user-agent"] || "";
  const acceptLanguage = req.headers["accept-language"] || "";
  const acceptEncoding = req.headers["accept-encoding"] || "";
  const accept = req.headers["accept"] || "";
  
  const clientIP = req.headers["x-forwarded-for"] || 
                    req.headers["x-real-ip"] || 
                    req.socket.remoteAddress || "";

  const components = [
    userAgent,
    acceptLanguage,
    acceptEncoding,
    accept,
    clientIP.toString().split(',')[0].trim()
  ];

  const fingerprintHash = crypto
    .createHash("sha256")
    .update(components.join("|"))
    .digest("hex")
    .substring(0, 16);

  if (!acceptLanguage) {
    signals.push("missing-accept-language");
    suspicionScore += 10;
  }

  if (!acceptEncoding) {
    signals.push("missing-accept-encoding");
    suspicionScore += 10;
  }

  const headerOrder = Object.keys(req.headers);
  const normalBrowserHeaders = ["host", "connection", "user-agent", "accept"];
  const hasNormalOrder = normalBrowserHeaders.every(h => headerOrder.includes(h));
  
  if (!hasNormalOrder) {
    signals.push("abnormal-header-order");
    suspicionScore += 15;
  }

  const tls = (req as any).connection?.getCipher?.();
  if (!tls && req.headers["x-forwarded-proto"] !== "https") {
    signals.push("no-tls-fingerprint");
    suspicionScore += 5;
  }

  if (userAgent.length < 50) {
    signals.push("short-user-agent");
    suspicionScore += 20;
  }

  const isSuspicious = suspicionScore >= 30;

  return {
    id: fingerprintHash,
    score: suspicionScore,
    signals,
    isSuspicious,
  };
}

export function trackDeviceFingerprint(fingerprint: DeviceFingerprint): void {
  console.log(`Device fingerprint: ${fingerprint.id} (score: ${fingerprint.score}, suspicious: ${fingerprint.isSuspicious})`);
  if (fingerprint.signals.length > 0) {
    console.log(`  Signals: ${fingerprint.signals.join(", ")}`);
  }
}
