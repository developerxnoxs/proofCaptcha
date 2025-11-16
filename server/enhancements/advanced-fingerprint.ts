import crypto from 'crypto';

export interface CanvasFingerprintData {
  canvasHash?: string;
  webglHash?: string;
  audioHash?: string;
  fonts?: string[];
  screenFingerprint?: string;
}

export interface AdvancedFingerprint {
  hash: string;
  components: {
    canvas?: string;
    webgl?: string;
    audio?: string;
    fonts?: string;
    screen?: string;
    plugins?: string;
    timezone?: string;
    platform?: string;
    hardwareConcurrency?: string;
    deviceMemory?: string;
    colorDepth?: string;
    pixelRatio?: string;
  };
  confidence: number;
  isReliable: boolean;
}

export function generateAdvancedFingerprint(
  clientData: CanvasFingerprintData & {
    plugins?: string[];
    timezone?: string;
    platform?: string;
    hardwareConcurrency?: number;
    deviceMemory?: number;
    colorDepth?: number;
    pixelRatio?: number;
  }
): AdvancedFingerprint {
  const components: AdvancedFingerprint['components'] = {};
  let confidence = 0;

  if (clientData.canvasHash) {
    components.canvas = clientData.canvasHash;
    confidence += 20;
  }

  if (clientData.webglHash) {
    components.webgl = clientData.webglHash;
    confidence += 20;
  }

  if (clientData.audioHash) {
    components.audio = clientData.audioHash;
    confidence += 15;
  }

  if (clientData.fonts && clientData.fonts.length > 0) {
    components.fonts = clientData.fonts.sort().join(',');
    confidence += 10;
  }

  if (clientData.screenFingerprint) {
    components.screen = clientData.screenFingerprint;
    confidence += 10;
  }

  if (clientData.plugins && clientData.plugins.length > 0) {
    components.plugins = clientData.plugins.sort().join(',');
    confidence += 5;
  }

  if (clientData.timezone) {
    components.timezone = clientData.timezone;
    confidence += 5;
  }

  if (clientData.platform) {
    components.platform = clientData.platform;
    confidence += 5;
  }

  if (clientData.hardwareConcurrency !== undefined) {
    components.hardwareConcurrency = String(clientData.hardwareConcurrency);
    confidence += 3;
  }

  if (clientData.deviceMemory !== undefined) {
    components.deviceMemory = String(clientData.deviceMemory);
    confidence += 3;
  }

  if (clientData.colorDepth !== undefined) {
    components.colorDepth = String(clientData.colorDepth);
    confidence += 2;
  }

  if (clientData.pixelRatio !== undefined) {
    components.pixelRatio = String(clientData.pixelRatio);
    confidence += 2;
  }

  const fingerprintString = Object.entries(components)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');

  const hash = crypto
    .createHash('sha256')
    .update(fingerprintString)
    .digest('hex');

  return {
    hash,
    components,
    confidence: Math.min(confidence, 100),
    isReliable: confidence >= 60,
  };
}

export function compareFingerprints(
  fp1: AdvancedFingerprint,
  fp2: AdvancedFingerprint
): { similarity: number; matchedComponents: string[]; mismatchedComponents: string[] } {
  if (fp1.hash === fp2.hash) {
    return {
      similarity: 100,
      matchedComponents: Object.keys(fp1.components),
      mismatchedComponents: [],
    };
  }

  const allKeys = Array.from(new Set([
    ...Object.keys(fp1.components),
    ...Object.keys(fp2.components),
  ]));

  const matchedComponents: string[] = [];
  const mismatchedComponents: string[] = [];

  for (const key of allKeys) {
    const val1 = fp1.components[key as keyof typeof fp1.components];
    const val2 = fp2.components[key as keyof typeof fp2.components];

    if (val1 === val2) {
      matchedComponents.push(key);
    } else {
      mismatchedComponents.push(key);
    }
  }

  const similarity = (matchedComponents.length / allKeys.length) * 100;

  return {
    similarity,
    matchedComponents,
    mismatchedComponents,
  };
}

export const CLIENT_FINGERPRINT_SCRIPT = `
(function() {
  const fingerprint = {};

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 200;
      canvas.height = 50;
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('ProofCaptcha 🔒', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('ProofCaptcha 🔒', 4, 17);
      
      fingerprint.canvasHash = canvas.toDataURL().slice(-100);
    }
  } catch (e) {
    fingerprint.canvasHash = 'error';
  }

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      fingerprint.webglHash = debugInfo ? 
        gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 
        'no-debug-info';
    }
  } catch (e) {
    fingerprint.webglHash = 'error';
  }

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const analyser = context.createAnalyser();
      const gainNode = context.createGain();
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

      gainNode.gain.value = 0;
      oscillator.type = 'triangle';
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start(0);
      
      scriptProcessor.onaudioprocess = function(event) {
        const output = event.outputBuffer.getChannelData(0);
        fingerprint.audioHash = Array.from(output.slice(0, 30))
          .reduce((acc, val) => acc + Math.abs(val), 0)
          .toString()
          .slice(0, 20);
        
        oscillator.stop();
        scriptProcessor.disconnect();
      };
    }
  } catch (e) {
    fingerprint.audioHash = 'error';
  }

  const testFonts = [
    'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
    'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS',
    'Impact', 'Lucida Console', 'Tahoma', 'Helvetica'
  ];
  
  fingerprint.fonts = testFonts.filter(font => {
    const baseline = document.createElement('span');
    baseline.style.fontFamily = 'monospace';
    baseline.textContent = 'mmmmmmmmmmlli';
    document.body.appendChild(baseline);
    const baselineWidth = baseline.offsetWidth;
    baseline.style.fontFamily = font + ', monospace';
    const testWidth = baseline.offsetWidth;
    document.body.removeChild(baseline);
    return testWidth !== baselineWidth;
  });

  fingerprint.screenFingerprint = [
    screen.width,
    screen.height,
    screen.availWidth,
    screen.availHeight,
    screen.colorDepth,
    screen.pixelDepth
  ].join('x');

  fingerprint.plugins = Array.from(navigator.plugins || [])
    .map(p => p.name)
    .slice(0, 10);

  fingerprint.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  fingerprint.platform = navigator.platform;
  fingerprint.hardwareConcurrency = navigator.hardwareConcurrency;
  fingerprint.deviceMemory = navigator.deviceMemory;
  fingerprint.colorDepth = screen.colorDepth;
  fingerprint.pixelRatio = window.devicePixelRatio;

  return fingerprint;
})();
`;
