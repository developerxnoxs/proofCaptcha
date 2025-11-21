import { Request } from 'express';

export interface EnhancedHoneypotConfig {
  fieldNames: string[];
  timingThreshold: number;
  mouseMovementRequired: boolean;
  keyboardInteractionRequired: boolean;
  strictMode: boolean;
  logOnly: boolean;
}

export const ENHANCED_HONEYPOT_CONFIG: EnhancedHoneypotConfig = {
  fieldNames: [
    'email_confirm',
    'phone_verify',
    'website_url',
    'company_name',
    'full_address',
    'confirm_password',
    'business_phone',
    'fax_number',
    'alternate_email',
    'linkedin_profile',
  ],
  timingThreshold: 2000,
  mouseMovementRequired: true,
  keyboardInteractionRequired: true,
  strictMode: false,
  logOnly: false,
};

export interface EnhancedHoneypotResult {
  isBot: boolean;
  confidence: number;
  riskScore: number;
  triggers: {
    honeypotFields: string[];
    suspiciousTiming: boolean;
    noMouseMovement: boolean;
    noKeyboardInteraction: boolean;
    instantFormFill: boolean;
    patternMatching: boolean;
  };
  shouldBlock: boolean;
  details: string[];
}

export function checkEnhancedHoneypot(
  req: Request,
  config: EnhancedHoneypotConfig = ENHANCED_HONEYPOT_CONFIG
): EnhancedHoneypotResult {
  const triggers = {
    honeypotFields: [] as string[],
    suspiciousTiming: false,
    noMouseMovement: false,
    noKeyboardInteraction: false,
    instantFormFill: false,
    patternMatching: false,
  };

  const details: string[] = [];
  let totalConfidence = 0;
  let riskScore = 0;

  if (req.body) {
    for (const fieldName of config.fieldNames) {
      const value = req.body[fieldName];
      
      if (value !== undefined && value !== null && value !== '') {
        triggers.honeypotFields.push(fieldName);
        details.push(`Honeypot field filled: ${fieldName}`);
        totalConfidence += 30;
        riskScore += 25;
      }
    }
  }

  const submissionTime = req.body?.submissionTime;
  if (submissionTime && typeof submissionTime === 'number') {
    if (submissionTime < config.timingThreshold) {
      triggers.suspiciousTiming = true;
      triggers.instantFormFill = true;
      details.push(`Form submitted too quickly: ${submissionTime}ms`);
      totalConfidence += 25;
      riskScore += 20;
    }
  }

  const mouseMovements = req.body?.mouseMovements;
  if (config.mouseMovementRequired && (!mouseMovements || mouseMovements === 0)) {
    triggers.noMouseMovement = true;
    details.push('No mouse movements detected');
    totalConfidence += 20;
    riskScore += 15;
  }

  const keyboardEvents = req.body?.keyboardEvents;
  if (config.keyboardInteractionRequired && (!keyboardEvents || keyboardEvents === 0)) {
    triggers.noKeyboardInteraction = true;
    details.push('No keyboard interaction detected');
    totalConfidence += 20;
    riskScore += 15;
  }

  if (req.body) {
    const textFields = Object.entries(req.body).filter(([key, value]) =>
      typeof value === 'string' && value.length > 10
    );

    let patternScore = 0;
    for (const [, value] of textFields) {
      const val = value as string;
      
      if (/^[a-z]{10,}$/.test(val)) {
        patternScore += 10;
      }
      
      if (/^(.)\1{5,}/.test(val)) {
        patternScore += 15;
      }
      
      if (val === val.toUpperCase() && val.length > 5) {
        patternScore += 5;
      }
    }

    if (patternScore > 15) {
      triggers.patternMatching = true;
      details.push(`Suspicious pattern in form data (score: ${patternScore})`);
      totalConfidence += 15;
      riskScore += 10;
    }
  }

  const isBot = triggers.honeypotFields.length > 0 ||
    (triggers.instantFormFill && (triggers.noMouseMovement || triggers.noKeyboardInteraction));

  const finalConfidence = Math.min(totalConfidence, 100);
  const finalRiskScore = Math.min(riskScore, 100);

  const shouldBlock = isBot && !config.logOnly && 
    (config.strictMode || finalConfidence > 50);

  return {
    isBot,
    confidence: finalConfidence,
    riskScore: finalRiskScore,
    triggers,
    shouldBlock,
    details,
  };
}

export function generateEnhancedHoneypotHTML(
  fieldNames: string[] = ENHANCED_HONEYPOT_CONFIG.fieldNames
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
      class="honeypot-field"
      style="position:absolute !important;left:-9999px !important;width:1px !important;height:1px !important;opacity:0 !important;pointer-events:none !important;"
    />
  `).join('\n');
}

export const CLIENT_HONEYPOT_TRACKER = `
(function() {
  const tracker = {
    mouseMovements: 0,
    keyboardEvents: 0,
    submissionTime: 0,
    startTime: Date.now()
  };

  document.addEventListener('mousemove', function() {
    tracker.mouseMovements++;
  }, { passive: true });

  document.addEventListener('keydown', function() {
    tracker.keyboardEvents++;
  }, { passive: true });

  const originalSubmit = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function() {
    tracker.submissionTime = Date.now() - tracker.startTime;
    
    const mouseInput = document.createElement('input');
    mouseInput.type = 'hidden';
    mouseInput.name = 'mouseMovements';
    mouseInput.value = String(tracker.mouseMovements);
    this.appendChild(mouseInput);

    const keyInput = document.createElement('input');
    keyInput.type = 'hidden';
    keyInput.name = 'keyboardEvents';
    keyInput.value = String(tracker.keyboardEvents);
    this.appendChild(keyInput);

    const timeInput = document.createElement('input');
    timeInput.type = 'hidden';
    timeInput.name = 'submissionTime';
    timeInput.value = String(tracker.submissionTime);
    this.appendChild(timeInput);

    return originalSubmit.apply(this, arguments);
  };

  window.addEventListener('beforeunload', function() {
    if (window.localStorage) {
      localStorage.setItem('formTracking', JSON.stringify(tracker));
    }
  });

  return tracker;
})();
`;
