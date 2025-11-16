/**
 * Honeypot Field Detection
 * 
 * Invisible fields yang hanya akan diisi oleh bots
 * untuk mendeteksi automated form submissions
 */

import { Request } from "express";

export interface HoneypotConfig {
  fieldNames: string[];      // Nama fields yang digunakan sebagai honeypot
  strictMode: boolean;       // Strict mode langsung reject
  logOnly: boolean;          // Hanya log tanpa blocking
  scoreWeight: number;       // Weight untuk risk score (0-100)
}

export const DEFAULT_HONEYPOT_CONFIG: HoneypotConfig = {
  fieldNames: [
    'email_confirm',        // Common honeypot field
    'phone_verify',         // Phone verification honeypot
    'website',              // URL honeypot
    'company_name',         // Company honeypot
    'full_address',         // Address honeypot
    'social_security',      // SSN honeypot (never use in real forms!)
  ],
  strictMode: false,
  logOnly: false,
  scoreWeight: 50,  // Medium-high weight
};

export interface HoneypotCheckResult {
  isBot: boolean;
  triggeredFields: string[];
  confidence: number;  // 0-100
  riskScore: number;   // 0-100
  shouldBlock: boolean;
}

/**
 * Check for honeypot field triggers
 */
export function checkHoneypot(
  req: Request,
  config: HoneypotConfig = DEFAULT_HONEYPOT_CONFIG
): HoneypotCheckResult {
  const triggeredFields: string[] = [];
  
  // Check request body
  if (req.body) {
    for (const fieldName of config.fieldNames) {
      const value = req.body[fieldName];
      
      // Field exists and has value = bot detected
      if (value !== undefined && value !== null && value !== '') {
        triggeredFields.push(fieldName);
      }
    }
  }
  
  const isBot = triggeredFields.length > 0;
  const confidence = isBot ? Math.min(triggeredFields.length * 50, 100) : 0;
  const riskScore = isBot ? config.scoreWeight : 0;
  const shouldBlock = isBot && !config.logOnly;
  
  return {
    isBot,
    triggeredFields,
    confidence,
    riskScore,
    shouldBlock,
  };
}

/**
 * Generate honeypot HTML fields untuk injection ke forms
 */
export function generateHoneypotFields(
  fieldNames: string[] = DEFAULT_HONEYPOT_CONFIG.fieldNames
): string {
  return fieldNames.map(name => `
    <input 
      type="text" 
      name="${name}" 
      id="${name}"
      value=""
      tabindex="-1"
      autocomplete="off"
      aria-hidden="true"
      style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;"
    />
  `).join('\n');
}

/**
 * Middleware untuk auto-detect honeypot
 */
export function honeypotMiddleware(config: HoneypotConfig = DEFAULT_HONEYPOT_CONFIG) {
  return (req: Request, res: any, next: any) => {
    const result = checkHoneypot(req, config);
    
    if (result.isBot) {
      console.log(`[HONEYPOT] Bot detected: ${result.triggeredFields.join(', ')} from IP ${req.socket.remoteAddress}`);
      
      if (result.shouldBlock) {
        return res.status(403).json({
          success: false,
          error: 'Bot detected',
          message: 'Automated form submission detected',
        });
      }
    }
    
    // Attach result to request for logging
    (req as any).honeypotCheck = result;
    next();
  };
}

/**
 * Time-based honeypot - detect forms submitted too quickly
 */
export interface TimeBasedHoneypotConfig {
  minimumFormTime: number;  // Minimum waktu dalam ms
  maximumFormTime: number;  // Maximum waktu dalam ms (suspect if too long)
  strictMode: boolean;
}

export const DEFAULT_TIME_HONEYPOT_CONFIG: TimeBasedHoneypotConfig = {
  minimumFormTime: 3000,    // 3 detik minimum
  maximumFormTime: 3600000, // 1 jam maksimum
  strictMode: false,
};

export function checkTimingHoneypot(
  formLoadTime: number,  // Timestamp ketika form dimuat
  submitTime: number = Date.now(),
  config: TimeBasedHoneypotConfig = DEFAULT_TIME_HONEYPOT_CONFIG
): { isBot: boolean; reason?: string; timeTaken: number } {
  const timeTaken = submitTime - formLoadTime;
  
  // Too fast - likely bot
  if (timeTaken < config.minimumFormTime) {
    return {
      isBot: true,
      reason: `Form submitted too quickly (${timeTaken}ms < ${config.minimumFormTime}ms)`,
      timeTaken,
    };
  }
  
  // Too slow - possibly abandoned or automated long-running script
  if (config.strictMode && timeTaken > config.maximumFormTime) {
    return {
      isBot: true,
      reason: `Form submission took too long (${timeTaken}ms > ${config.maximumFormTime}ms)`,
      timeTaken,
    };
  }
  
  return {
    isBot: false,
    timeTaken,
  };
}

/**
 * Mouse movement honeypot - detect lack of mouse interaction
 * (Requires client-side component to track mouse movements)
 */
export interface MouseHoneypotCheck {
  hasMouseMovement: boolean;
  movementCount: number;
  clickCount: number;
}

export function checkMouseHoneypot(data: MouseHoneypotCheck): {
  isBot: boolean;
  confidence: number;
  reason?: string;
} {
  // No mouse movement at all = high confidence bot
  if (!data.hasMouseMovement || data.movementCount === 0) {
    return {
      isBot: true,
      confidence: 90,
      reason: 'No mouse movement detected',
    };
  }
  
  // Very few movements = medium confidence bot
  if (data.movementCount < 5) {
    return {
      isBot: true,
      confidence: 60,
      reason: 'Insufficient mouse movement',
    };
  }
  
  // No clicks = medium confidence bot
  if (data.clickCount === 0) {
    return {
      isBot: true,
      confidence: 50,
      reason: 'No mouse clicks detected',
    };
  }
  
  return {
    isBot: false,
    confidence: 0,
  };
}

/**
 * Combined honeypot check
 */
export function performComprehensiveHoneypotCheck(
  req: Request,
  formLoadTime?: number,
  mouseData?: MouseHoneypotCheck,
  config: HoneypotConfig = DEFAULT_HONEYPOT_CONFIG
): {
  isBot: boolean;
  confidence: number;
  checks: {
    fieldHoneypot: HoneypotCheckResult;
    timing?: ReturnType<typeof checkTimingHoneypot>;
    mouse?: ReturnType<typeof checkMouseHoneypot>;
  };
  totalRiskScore: number;
} {
  const fieldCheck = checkHoneypot(req, config);
  let totalRiskScore = fieldCheck.riskScore;
  let maxConfidence = fieldCheck.confidence;
  
  const checks: any = { fieldHoneypot: fieldCheck };
  
  // Timing check
  if (formLoadTime !== undefined) {
    const timingCheck = checkTimingHoneypot(formLoadTime);
    checks.timing = timingCheck;
    if (timingCheck.isBot) {
      totalRiskScore += 30;
      maxConfidence = Math.max(maxConfidence, 70);
    }
  }
  
  // Mouse check
  if (mouseData) {
    const mouseCheck = checkMouseHoneypot(mouseData);
    checks.mouse = mouseCheck;
    if (mouseCheck.isBot) {
      totalRiskScore += mouseCheck.confidence * 0.5;
      maxConfidence = Math.max(maxConfidence, mouseCheck.confidence);
    }
  }
  
  const isBot = fieldCheck.isBot || 
                (checks.timing?.isBot) || 
                (checks.mouse?.isBot);
  
  return {
    isBot,
    confidence: maxConfidence,
    checks,
    totalRiskScore: Math.min(totalRiskScore, 100),
  };
}

/**
 * Example usage in HTML form:
 * 
 * <form id="myForm">
 *   <input type="text" name="email" required />
 *   
 *   <!-- Honeypot fields (invisible) -->
 *   ${generateHoneypotFields()}
 *   
 *   <!-- Hidden form load timestamp -->
 *   <input type="hidden" name="form_load_time" value="${Date.now()}" />
 *   
 *   <button type="submit">Submit</button>
 * </form>
 * 
 * Example usage in backend:
 * 
 * app.post('/submit', honeypotMiddleware(), async (req, res) => {
 *   const honeypotResult = (req as any).honeypotCheck;
 *   
 *   if (honeypotResult.isBot) {
 *     // Log or block
 *     console.log('Bot detected via honeypot');
 *   }
 *   
 *   // Process form...
 * });
 */
