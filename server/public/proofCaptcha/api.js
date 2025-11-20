/**
 * ProofCaptcha Widget Library - Unified API
 * Standalone JavaScript matching React/Tailwind styling from CaptchaWidget.tsx
 * 
 * Features:
 * - Multiple challenge types (grid, jigsaw, gesture, upside_down, audio)
 * - Proof of Work security system
 * - Auto-render support with data attributes
 * - Global API (render, reset, getResponse, ready)
 * - Theme customization (light/dark/auto)
 * - Responsive design
 * - Automation detection
 * - Multi-layered Anti-Debugger Protection:
 *   • Debugger traps with randomized intervals
 *   • Viewport and window size monitoring
 *   • Timing-based detection
 *   • Function integrity checks
 *   • toString() traps for DevTools inspection
 *   • Performance monitoring
 *   • Console protection
 * 
 * Anti-Debugger API:
 * - ProofCaptcha.antiDebug.enable() - Enable anti-debugger protection
 * - ProofCaptcha.antiDebug.disable() - Disable anti-debugger (development only)
 * - ProofCaptcha.antiDebug.getStatus() - Get current protection status
 * 
 * @version 3.3.0
 */
(function(window) {
  'use strict';

  // ==========================================
  // CONFIGURATION
  // ==========================================
  
  // Detect API base URL from the script tag source
  function getApiBase() {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src;
      if (src && (src.includes('/api.js') || src.includes('/captcha.js'))) {
        try {
          const url = new URL(src);
          // FIXED BUG #5: Validate origin to prevent XSS
          // Only allow http:// and https:// protocols
          if (url.protocol === 'http:' || url.protocol === 'https:') {
            return url.origin;
          }
          console.warn('ProofCaptcha: Invalid protocol in script URL, using fallback');
        } catch (e) {
          console.error('ProofCaptcha: Failed to parse script URL', e);
        }
      }
    }
    return window.location.origin;
  }

  const API_BASE_URL = getApiBase();
  const MAX_POW_ATTEMPTS = 10000000;
  const PROGRESS_UPDATE_INTERVAL = 1000;
  const WIDGET_CLASS = 'proof-captcha';
  
  // Widget management
  const widgets = new Map();
  let widgetCounter = 0;
  let cssLoaded = false;

  // ==========================================
  // ANTI-DEBUGGER PROTECTION
  // ==========================================
  
  /**
   * Multi-layered anti-debugger protection system
   * Detects and prevents DevTools usage
   */
  const AntiDebugger = {
    enabled: false, // Default to disabled, will be enabled based on API key settings
    devtoolsOpen: false,
    initialized: false,
    
    /**
     * Initialize all anti-debugging protection layers
     */
    init: function() {
      if (!this.enabled || this.initialized) return;
      
      this.initialized = true;
      this.startDebuggerTraps();
      this.startViewportMonitoring();
      this.startTimingChecks();
      this.startFunctionIntegrityChecks();
      this.startToStringTraps();
      this.startPerformanceMonitoring();
      this.protectConsole();
      console.log('[ANTI-DEBUGGER] Protection layers initialized');
    },
    
    /**
     * Enable anti-debugger protection
     */
    enable: function() {
      this.enabled = true;
      if (!this.initialized) {
        this.init();
      }
      console.log('[ANTI-DEBUGGER] Protection enabled');
    },
    
    /**
     * Layer 1: Debugger traps with randomized intervals
     */
    startDebuggerTraps: function() {
      const trap1 = () => {
        (function() {return false;})['constructor']('debugger')['call']();
      };
      
      const trap2 = () => {
        const code = Function.prototype.constructor;
        code('debugger')();
      };
      
      setInterval(() => {
        try {
          trap1();
        } catch(e) {}
      }, Math.random() * 800 + 200);
      
      setInterval(() => {
        try {
          trap2();
        } catch(e) {}
      }, Math.random() * 1200 + 300);
      
      const self = this;
      setInterval(() => {
        const check = /./;
        check.toString = function() {
          self.devtoolsOpen = true;
          return 'check';
        };
        try {
          (function(){}).constructor("debugger")();
        } catch(e) {}
      }, 500);
    },
    
    /**
     * Layer 2: Viewport and window size monitoring
     */
    startViewportMonitoring: function() {
      const checkViewport = () => {
        const widthThreshold = window.outerWidth - window.innerWidth > 160;
        const heightThreshold = window.outerHeight - window.innerHeight > 160;
        const orientation = window.screen && window.screen.orientation;
        
        if (widthThreshold || heightThreshold) {
          this.devtoolsOpen = true;
          this.triggerProtection('viewport');
        }
      };
      
      setInterval(checkViewport, 1000);
      window.addEventListener('resize', checkViewport);
    },
    
    /**
     * Layer 3: Timing-based detection
     */
    startTimingChecks: function() {
      const timingSelf = this;
      setInterval(() => {
        const start = performance.now();
        (function(){}).constructor("debugger")();
        const end = performance.now();
        
        if (end - start > 100) {
          timingSelf.devtoolsOpen = true;
          timingSelf.triggerProtection('timing');
        }
      }, 2000);
    },
    
    /**
     * Layer 4: Function integrity checks
     */
    startFunctionIntegrityChecks: function() {
      const originalLog = console.log.toString();
      const originalWarn = console.warn.toString();
      const originalError = console.error.toString();
      
      setInterval(() => {
        if (console.log.toString() !== originalLog ||
            console.warn.toString() !== originalWarn ||
            console.error.toString() !== originalError) {
          this.triggerProtection('integrity');
        }
      }, 3000);
    },
    
    /**
     * Layer 5: toString() traps
     */
    startToStringTraps: function() {
      const detectObject = {};
      let consoleDetected = false;
      
      Object.defineProperty(detectObject, 'toString', {
        get: function() {
          consoleDetected = true;
          this.devtoolsOpen = true;
          this.triggerProtection('toString');
          return '';
        }.bind(this)
      });
      
      setInterval(() => {
        console.log('%c', detectObject);
      }, 5000);
      
      const element = document.createElement('div');
      Object.defineProperty(element, 'id', {
        get: function() {
          this.devtoolsOpen = true;
          this.triggerProtection('element-inspect');
          return 'captcha-element';
        }.bind(this)
      });
      
      setInterval(() => {
        console.log(element);
      }, 4000);
    },
    
    /**
     * Layer 6: Performance monitoring
     */
    startPerformanceMonitoring: function() {
      let lastTime = performance.now();
      
      const perfSelf = this;
      setInterval(() => {
        const currentTime = performance.now();
        const delta = currentTime - lastTime;
        
        if (delta > 2000) {
          perfSelf.devtoolsOpen = true;
          perfSelf.triggerProtection('performance');
        }
        
        lastTime = currentTime;
      }, 1000);
    },
    
    /**
     * Console protection and redirection
     */
    protectConsole: function() {
      const noop = function() {};
      const methods = ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace', 'dir', 'group', 'groupEnd', 'clear'];
      
      if (typeof window !== 'undefined' && window.console) {
        methods.forEach(method => {
          const original = console[method];
          console[method] = function(...args) {
            if (args.length > 0 && typeof args[0] === 'string') {
              if (args[0].includes('[ENCRYPTION]') || 
                  args[0].includes('ProofCaptcha') ||
                  args[0] === '%c') {
                return;
              }
            }
            try {
              original.apply(console, args);
            } catch(e) {}
          };
        });
      }
    },
    
    /**
     * Trigger protection response - Show CHEATERS warning with police animation
     */
    triggerProtection: function(reason) {
      if (!this.enabled || !this.devtoolsOpen) return;
      
      const actions = [
        () => {
          // Hide overlay if open
          document.querySelectorAll('.proofcaptcha-overlay').forEach(el => {
            if (el) el.style.display = 'none';
          });
        },
        () => {
          // Change widget to "cheater mode" - Premium visual transformation
          document.querySelectorAll('.proofcaptcha-widget').forEach(widget => {
            if (!widget) return;
            
            // Remove blur if any
            widget.style.filter = 'none';
            
            const logo = widget.querySelector('.proofcaptcha-logo');
            const text = widget.querySelector('.proofcaptcha-text');
            const checkboxContainer = widget.querySelector('.proofcaptcha-checkbox-container');
            
            if (logo) {
              // Anti-cheater image
              logo.className = 'proofcaptcha-logo cheater';
              logo.innerHTML = `
                <img src="${API_BASE_URL}/assets/crack.png" 
                     alt="No Cheating" 
                     style="
                       width: 80px; 
                       height: 80px; 
                       object-fit: contain;
                       animation: pc-pulse-intense 0.8s ease-in-out infinite;
                       filter: drop-shadow(0 0 20px rgba(220, 38, 38, 0.6));
                     "
                     onerror="console.error('Failed to load anti-cheater image'); this.style.display='none';" />
              `;
            }
            
            if (text) {
              // CHEATERS!! text with gradient animation
              text.innerHTML = `
                <div class="proofcaptcha-cheater-text">CHEATERS!!</div>
                <div class="proofcaptcha-cheater-subtitle">Debugging Detected</div>
              `;
            }
            
            if (checkboxContainer) {
              // Replace checkbox with animated warning icon
              checkboxContainer.innerHTML = `
                <div class="proofcaptcha-icon-container cheater">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
              `;
              
              // Add click handler for police animation
              const iconContainer = checkboxContainer.querySelector('.proofcaptcha-icon-container');
              if (iconContainer && !iconContainer.hasAttribute('data-police-handler')) {
                iconContainer.setAttribute('data-police-handler', 'true');
                
                iconContainer.addEventListener('click', () => {
                  this.showPoliceAnimation(widget);
                });
              }
            }
            
            // Change footer to cheater warning message
            const footer = widget.querySelector('.proofcaptcha-footer');
            if (footer) {
              footer.innerHTML = `
                <span class="proofcaptcha-footer-message" style="text-align: center; width: 100%; display: block;">⚠️ Cheating detected? Your activity is being monitored.</span>
              `;
            }
            
            // Add cheater mode class to widget for premium styling
            widget.classList.add('proofcaptcha-cheater-mode');
          });
        },
        () => {
          // Dispatch tamper event
          const evt = new Event('captcha_tamper_detected');
          document.dispatchEvent(evt);
        }
      ];
      
      actions.forEach(action => {
        try {
          action();
        } catch(e) {}
      });
    },
    
    /**
     * Show premium police catching attacker animation
     */
    showPoliceAnimation: function(widget) {
      // FIXED BUG #4 (REGRESSION FIX): Clear timers AND remove existing overlay to prevent DOM leak
      // This prevents stacked overlays when animation is re-triggered rapidly
      if (widget._policeAnimationTimer1) {
        clearTimeout(widget._policeAnimationTimer1);
        widget._policeAnimationTimer1 = null;
      }
      if (widget._policeAnimationTimer2) {
        clearTimeout(widget._policeAnimationTimer2);
        widget._policeAnimationTimer2 = null;
      }
      
      // Remove any existing police overlay to prevent stacking
      const existingOverlay = widget.querySelector('.proofcaptcha-police-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }
      
      // Create overlay with CSS class
      const animationOverlay = document.createElement('div');
      animationOverlay.className = 'proofcaptcha-police-overlay';
      
      // Animation content dengan positioning yang jelas
      animationOverlay.innerHTML = `
        <div style="
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div class="police-car">🚔👮‍♂️</div>
          <div class="attacker-icon">
            <div style="position: relative; display: inline-block;">
              <span style="font-size: 32px;">🧑‍💻</span>
              <span style="
                position: absolute;
                top: -5px;
                right: -5px;
                font-size: 20px;
                animation: pc-pulse-scale 0.5s ease-in-out infinite;
              ">🚫</span>
            </div>
          </div>
          <div class="stop-sign">🛑</div>
        </div>
      `;
      
      widget.style.position = 'relative';
      widget.appendChild(animationOverlay);
      
      // FIXED BUG #4: Store timer IDs to prevent memory leak
      // These can be cleared when widget is destroyed
      widget._policeAnimationTimer1 = setTimeout(() => {
        animationOverlay.style.opacity = '0';
        animationOverlay.style.transition = 'opacity 0.3s ease-out';
        widget._policeAnimationTimer2 = setTimeout(() => {
          animationOverlay.remove();
          widget._policeAnimationTimer1 = null;
          widget._policeAnimationTimer2 = null;
        }, 300);
      }, 2000);
    },
    
    /**
     * Clear police animation timers from widget AND remove overlay
     */
    clearPoliceAnimationTimers: function(widget) {
      // Clear timers
      if (widget._policeAnimationTimer1) {
        clearTimeout(widget._policeAnimationTimer1);
        widget._policeAnimationTimer1 = null;
      }
      if (widget._policeAnimationTimer2) {
        clearTimeout(widget._policeAnimationTimer2);
        widget._policeAnimationTimer2 = null;
      }
      
      // Remove overlay DOM element to prevent orphaned nodes
      const existingOverlay = widget.querySelector('.proofcaptcha-police-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }
    },
    
    /**
     * Disable anti-debugger (for development only)
     */
    disable: function() {
      this.enabled = false;
      this.devtoolsOpen = false;
      console.log('[ANTI-DEBUGGER] Protection disabled');
    },
    
    /**
     * Get current protection status
     */
    getStatus: function() {
      return {
        enabled: this.enabled,
        initialized: this.initialized,
        devtoolsOpen: this.devtoolsOpen
      };
    }
  };
  
  // DO NOT auto-initialize - wait for security config from server
  // AntiDebugger will be enabled based on API key settings

  // ==========================================
  // CSS LOADING
  // ==========================================
  
  function loadCSS() {
    if (cssLoaded) return;
    
    // Check if CSS is already loaded
    const existingLink = document.querySelector('link[href*="proofcaptcha-widget.css"]');
    if (existingLink) {
      cssLoaded = true;
      return;
    }
    
    // Create and append link element
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${API_BASE_URL}/proofCaptcha/proofcaptcha-widget.css`;
    document.head.appendChild(link);
    cssLoaded = true;
  }

  // ==========================================
  // ENCRYPTION MODULE
  // ==========================================

  /**
   * End-to-end encryption using ECDH + HKDF + AES-GCM
   * Provides progressive enhancement - falls back to plaintext if unavailable
   */
  const EncryptionManager = {
    currentSession: null,

    /**
     * Check if Web Crypto API is available
     */
    isAvailable: function() {
      return typeof crypto !== 'undefined' && 
             typeof crypto.subtle !== 'undefined' &&
             typeof crypto.getRandomValues !== 'undefined';
    },

    /**
     * Utility: ArrayBuffer to Base64
     */
    arrayBufferToBase64: function(buffer) {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    },

    /**
     * Utility: Base64 to ArrayBuffer
     */
    base64ToArrayBuffer: function(base64) {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    },

    /**
     * Generate client ECDH key pair (P-256)
     */
    generateKeyPair: async function() {
      return await crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveKey', 'deriveBits']
      );
    },

    /**
     * Export public key to raw format
     */
    exportPublicKey: async function(publicKey) {
      return await crypto.subtle.exportKey('raw', publicKey);
    },

    /**
     * Import server public key from raw format
     */
    importServerPublicKey: async function(rawKey) {
      return await crypto.subtle.importKey(
        'raw',
        rawKey,
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        []
      );
    },

    /**
     * Derive shared secret using ECDH
     */
    deriveSharedSecret: async function(clientPrivateKey, serverPublicKey) {
      return await crypto.subtle.deriveBits(
        { name: 'ECDH', public: serverPublicKey },
        clientPrivateKey,
        256
      );
    },

    /**
     * Derive master session key from ECDH shared secret using HKDF
     */
    deriveMasterKey: async function(sharedSecret, serverPublicKey, serverNonce) {
      const encoder = new TextEncoder();
      const nonceBytes = encoder.encode(serverNonce);
      const salt = new Uint8Array(serverPublicKey.byteLength + nonceBytes.length);
      salt.set(new Uint8Array(serverPublicKey), 0);
      salt.set(nonceBytes, serverPublicKey.byteLength);

      const baseKey = await crypto.subtle.importKey(
        'raw',
        sharedSecret,
        'HKDF',
        false,
        ['deriveKey']
      );

      return await crypto.subtle.deriveKey(
        {
          name: 'HKDF',
          hash: 'SHA-256',
          salt: salt,
          info: encoder.encode('captcha-session-v1'),
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        true, // MUST be extractable for child key derivation
        ['encrypt', 'decrypt']
      );
    },

    /**
     * Derive child key for per-challenge encryption
     */
    deriveChildKey: async function(masterKey, challengeId, direction) {
      const encoder = new TextEncoder();
      
      // Hash the challenge ID to ensure it's always short (64 hex chars)
      // This prevents HKDF info parameter from exceeding 1024 byte limit
      const challengeIdBuffer = encoder.encode(challengeId);
      const hashBuffer = await crypto.subtle.digest('SHA-256', challengeIdBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const challengeIdHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const info = `captcha-challenge-v1:${direction}:${challengeIdHash}`;

      const masterKeyBits = await crypto.subtle.exportKey('raw', masterKey);
      const hkdfKey = await crypto.subtle.importKey(
        'raw',
        masterKeyBits,
        'HKDF',
        false,
        ['deriveKey']
      );

      return await crypto.subtle.deriveKey(
        {
          name: 'HKDF',
          hash: 'SHA-256',
          salt: new Uint8Array(0),
          info: encoder.encode(info),
        },
        hkdfKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    },

    /**
     * Encrypt payload using AES-256-GCM
     */
    encryptPayload: async function(plaintext, key, additionalData) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      const plaintextBuffer = typeof plaintext === 'string' 
        ? encoder.encode(plaintext)
        : new Uint8Array(plaintext);

      const algorithm = { name: 'AES-GCM', iv: iv, tagLength: 128 };
      if (additionalData) {
        algorithm.additionalData = encoder.encode(additionalData);
      }

      const ciphertext = await crypto.subtle.encrypt(algorithm, key, plaintextBuffer);
      const ciphertextArray = new Uint8Array(ciphertext);
      const ciphertextOnly = ciphertextArray.slice(0, -16);
      const tag = ciphertextArray.slice(-16);

      return {
        ciphertext: this.arrayBufferToBase64(ciphertextOnly),
        iv: this.arrayBufferToBase64(iv),
        tag: this.arrayBufferToBase64(tag),
      };
    },

    /**
     * Decrypt payload using AES-256-GCM
     */
    decryptPayload: async function(encrypted, key, additionalData) {
      try {
        if (!encrypted || !encrypted.iv || !encrypted.ciphertext || !encrypted.tag) {
          console.error('[ENCRYPTION] Invalid encrypted payload structure:', encrypted);
          return null;
        }
        
        const iv = this.base64ToArrayBuffer(encrypted.iv);
        const ciphertext = this.base64ToArrayBuffer(encrypted.ciphertext);
        const tag = this.base64ToArrayBuffer(encrypted.tag);

        const combined = new Uint8Array(ciphertext.byteLength + tag.byteLength);
        combined.set(new Uint8Array(ciphertext), 0);
        combined.set(new Uint8Array(tag), ciphertext.byteLength);

        const encoder = new TextEncoder();
        const algorithm = { name: 'AES-GCM', iv: iv, tagLength: 128 };
        if (additionalData) {
          algorithm.additionalData = encoder.encode(additionalData);
        }

        const plaintext = await crypto.subtle.decrypt(algorithm, key, combined);
        return plaintext;
      } catch (error) {
        console.error('[ENCRYPTION] Decryption failed:', error);
        console.error('[ENCRYPTION] Error details:', error.message, error.stack);
        console.error('[ENCRYPTION] Payload structure:', {
          hasIv: !!encrypted?.iv,
          hasCiphertext: !!encrypted?.ciphertext,
          hasTag: !!encrypted?.tag,
          additionalData: additionalData
        });
        return null;
      }
    },

    /**
     * Perform handshake with server
     */
    performHandshake: async function(publicKey) {
      if (!this.isAvailable()) {
        return null;
      }

      try {
        const clientKeyPair = await this.generateKeyPair();
        const clientPublicKeyRaw = await this.exportPublicKey(clientKeyPair.publicKey);

        const response = await fetch(`${API_BASE_URL}/api/captcha/handshake`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publicKey: publicKey,
            clientPublicKey: this.arrayBufferToBase64(clientPublicKeyRaw),
          }),
          credentials: 'include',
        });

        // FIXED BUG #3: Enhanced error handling with detailed logging
        if (!response.ok) {
          let errorMessage = 'Unknown error';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = response.statusText || errorMessage;
          }
          console.error(`[ENCRYPTION] Handshake failed: HTTP ${response.status} - ${errorMessage}`);
          return null;
        }

        const handshakeData = await response.json();
        const serverPublicKeyRaw = this.base64ToArrayBuffer(handshakeData.serverPublicKey);
        const serverPublicKey = await this.importServerPublicKey(serverPublicKeyRaw);

        const sharedSecret = await this.deriveSharedSecret(
          clientKeyPair.privateKey,
          serverPublicKey
        );

        const masterKey = await this.deriveMasterKey(
          sharedSecret,
          serverPublicKeyRaw,
          handshakeData.nonce
        );

        const session = {
          masterKey: masterKey,
          clientPublicKey: this.arrayBufferToBase64(clientPublicKeyRaw),
          timestamp: handshakeData.timestamp,
          expiresAt: Date.now() + (handshakeData.expiresIn * 1000),
          nonce: handshakeData.nonce,
        };

        this.currentSession = session;
        console.log('[ENCRYPTION] Session established');
        return session;
      } catch (error) {
        console.error('[ENCRYPTION] Handshake error:', error);
        return null;
      }
    },

    /**
     * Get or create session
     */
    ensureSession: async function(publicKey) {
      if (this.currentSession && Date.now() < this.currentSession.expiresAt) {
        return this.currentSession;
      }
      return await this.performHandshake(publicKey);
    },

    /**
     * Decrypt challenge data
     */
    decryptChallenge: async function(encrypted, challengeId, publicKey) {
      // Ensure session is valid before decryption
      const session = await this.ensureSession(publicKey);
      if (!session) {
        console.error('[ENCRYPTION] No valid session for decryption');
        return null;
      }

      const childKey = await this.deriveChildKey(
        session.masterKey,
        challengeId,
        'encrypt'
      );
      
      const plaintext = await this.decryptPayload(encrypted, childKey, challengeId);

      if (!plaintext) {
        console.error('[ENCRYPTION] Decryption failed - invalid payload or key');
        return null;
      }

      try {
        const decoder = new TextDecoder();
        const decoded = JSON.parse(decoder.decode(plaintext));
        console.log('[ENCRYPTION] Challenge decrypted successfully');
        return decoded;
      } catch (error) {
        console.error('[ENCRYPTION] Failed to parse decrypted data:', error);
        return null;
      }
    },

    /**
     * Decrypt security config data
     * Uses dedicated 'config' direction for key separation
     */
    decryptSecurityConfig: async function(encrypted, challengeId, publicKey) {
      // Ensure session is valid before decryption
      const session = await this.ensureSession(publicKey);
      if (!session) {
        console.error('[ENCRYPTION] No valid session for security config decryption');
        return null;
      }

      const childKey = await this.deriveChildKey(
        session.masterKey,
        challengeId,
        'config'
      );
      
      const plaintext = await this.decryptPayload(encrypted, childKey, challengeId);

      if (!plaintext) {
        console.error('[ENCRYPTION] Security config decryption failed - invalid payload or key');
        return null;
      }

      try {
        const decoder = new TextDecoder();
        const decoded = JSON.parse(decoder.decode(plaintext));
        console.log('[ENCRYPTION] Security config decrypted successfully');
        return decoded;
      } catch (error) {
        console.error('[ENCRYPTION] Failed to parse decrypted security config:', error);
        return null;
      }
    },

    /**
     * Encrypt solution data
     */
    encryptSolution: async function(solutionData, challengeId) {
      if (!this.currentSession) return null;

      const childKey = await this.deriveChildKey(
        this.currentSession.masterKey,
        challengeId,
        'decrypt'
      );
      const plaintext = JSON.stringify(solutionData);

      return await this.encryptPayload(plaintext, childKey, challengeId);
    },

    /**
     * Encrypt verification metadata (clientDetections, fingerprint, behavioral data)
     */
    encryptVerificationMetadata: async function(metadataObj, challengeId) {
      if (!this.currentSession) return null;

      const childKey = await this.deriveChildKey(
        this.currentSession.masterKey,
        challengeId,
        'metadata'
      );
      const plaintext = JSON.stringify(metadataObj);

      return await this.encryptPayload(plaintext, childKey, challengeId);
    },

    /**
     * Clear session
     */
    clearSession: function() {
      this.currentSession = null;
    },
  };

  // ==========================================
  // ADVANCED FINGERPRINT COLLECTOR
  // ==========================================

  /**
   * Comprehensive browser fingerprinting using Canvas, WebGL, Audio, Fonts, and more
   * This provides robust device identification for security purposes
   */
  const FingerprintCollector = {
    cachedFingerprint: null,
    cacheExpiry: 0,
    CACHE_DURATION: 60000, // 1 minute cache

    /**
     * Collect complete browser fingerprint
     */
    async collect() {
      // Return cached fingerprint if still valid
      if (this.cachedFingerprint && Date.now() < this.cacheExpiry) {
        return this.cachedFingerprint;
      }

      const fingerprint = {};

      try {
        // Canvas Fingerprinting - highly unique per device/browser
        fingerprint.canvasHash = await this.getCanvasFingerprint();
      } catch (e) {
        fingerprint.canvasHash = 'error';
      }

      try {
        // WebGL Fingerprinting - GPU and graphics driver information
        fingerprint.webglHash = await this.getWebGLFingerprint();
      } catch (e) {
        fingerprint.webglHash = 'error';
      }

      try {
        // Audio Fingerprinting - audio processing variations
        fingerprint.audioHash = await this.getAudioFingerprint();
      } catch (e) {
        fingerprint.audioHash = 'error';
      }

      try {
        // Font Detection - installed system fonts
        fingerprint.fonts = await this.detectFonts();
      } catch (e) {
        fingerprint.fonts = [];
      }

      try {
        // Screen Fingerprint - display characteristics
        fingerprint.screenFingerprint = this.getScreenFingerprint();
      } catch (e) {
        fingerprint.screenFingerprint = 'error';
      }

      try {
        // Browser Plugins
        fingerprint.plugins = this.getPlugins();
      } catch (e) {
        fingerprint.plugins = [];
      }

      try {
        // Timezone
        fingerprint.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch (e) {
        fingerprint.timezone = 'unknown';
      }

      try {
        // Platform
        fingerprint.platform = navigator.platform;
      } catch (e) {
        fingerprint.platform = 'unknown';
      }

      try {
        // Hardware Concurrency (CPU cores)
        fingerprint.hardwareConcurrency = navigator.hardwareConcurrency;
      } catch (e) {
        fingerprint.hardwareConcurrency = 0;
      }

      try {
        // Device Memory (GB)
        fingerprint.deviceMemory = navigator.deviceMemory;
      } catch (e) {
        fingerprint.deviceMemory = 0;
      }

      try {
        // Color Depth
        fingerprint.colorDepth = screen.colorDepth;
      } catch (e) {
        fingerprint.colorDepth = 0;
      }

      try {
        // Pixel Ratio
        fingerprint.pixelRatio = window.devicePixelRatio;
      } catch (e) {
        fingerprint.pixelRatio = 1;
      }

      // Cache the result
      this.cachedFingerprint = fingerprint;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;

      return fingerprint;
    },

    /**
     * Canvas Fingerprinting
     * Draws text and shapes to canvas and extracts unique rendering signature
     */
    getCanvasFingerprint() {
      return new Promise((resolve) => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 240;
          canvas.height = 60;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            resolve('no-context');
            return;
          }

          // Draw colorful background
          ctx.fillStyle = '#f60';
          ctx.fillRect(125, 1, 62, 20);
          
          // Draw text with specific styling
          ctx.textBaseline = 'alphabetic';
          ctx.font = '14px "Arial"';
          ctx.fillStyle = '#069';
          ctx.fillText('ProofCaptcha 🔒🛡️', 2, 15);
          
          // Add semi-transparent overlay
          ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
          ctx.fillText('ProofCaptcha 🔒🛡️', 4, 17);
          
          // Draw shapes
          ctx.beginPath();
          ctx.arc(50, 30, 20, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
          ctx.fill();
          
          // Get canvas data URL and extract signature
          const dataURL = canvas.toDataURL();
          // Use last 120 characters for uniqueness
          const signature = dataURL.slice(-120);
          resolve(signature);
        } catch (e) {
          resolve('error');
        }
      });
    },

    /**
     * WebGL Fingerprinting
     * Extracts GPU and graphics driver information
     */
    getWebGLFingerprint() {
      return new Promise((resolve) => {
        try {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          
          if (!gl) {
            resolve('no-webgl');
            return;
          }

          // Get WebGL parameters
          const params = {
            vendor: gl.getParameter(gl.VENDOR),
            renderer: gl.getParameter(gl.RENDERER),
            version: gl.getParameter(gl.VERSION),
            shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
          };

          // Get unmasked vendor and renderer (more detailed GPU info)
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            params.unmaskedVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            params.unmaskedRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          }

          // Get supported extensions
          const extensions = gl.getSupportedExtensions();
          params.extensions = extensions ? extensions.join(',') : '';

          // Create hash from params
          const hash = JSON.stringify(params);
          resolve(hash.slice(0, 100));
        } catch (e) {
          resolve('error');
        }
      });
    },

    /**
     * Audio Fingerprinting
     * Uses AudioContext to detect audio processing differences
     */
    getAudioFingerprint() {
      return new Promise((resolve) => {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          
          if (!AudioContext) {
            resolve('no-audio');
            return;
          }

          const context = new AudioContext();
          const oscillator = context.createOscillator();
          const analyser = context.createAnalyser();
          const gainNode = context.createGain();
          const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

          // Set gain to 0 (silent)
          gainNode.gain.value = 0;
          
          // Configure oscillator
          oscillator.type = 'triangle';
          oscillator.frequency.value = 10000;
          
          // Connect nodes
          oscillator.connect(analyser);
          analyser.connect(scriptProcessor);
          scriptProcessor.connect(gainNode);
          gainNode.connect(context.destination);

          // Start oscillator
          oscillator.start(0);
          
          let fingerprint = '';
          
          scriptProcessor.onaudioprocess = function(event) {
            const output = event.outputBuffer.getChannelData(0);
            
            // Calculate fingerprint from audio samples
            let sum = 0;
            for (let i = 0; i < output.length && i < 30; i++) {
              sum += Math.abs(output[i]);
            }
            
            fingerprint = sum.toString().slice(0, 20);
            
            // Cleanup
            oscillator.stop();
            scriptProcessor.disconnect();
            gainNode.disconnect();
            analyser.disconnect();
            context.close();
            
            resolve(fingerprint || 'silent');
          };
          
          // Timeout after 100ms
          setTimeout(() => {
            if (!fingerprint) {
              try {
                oscillator.stop();
                context.close();
              } catch (e) {}
              resolve('timeout');
            }
          }, 100);
        } catch (e) {
          resolve('error');
        }
      });
    },

    /**
     * Font Detection
     * Detects installed fonts by measuring text width differences
     */
    detectFonts() {
      return new Promise((resolve) => {
        try {
          const baseFonts = ['monospace', 'sans-serif', 'serif'];
          const testFonts = [
            'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
            'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS',
            'Impact', 'Lucida Console', 'Tahoma', 'Helvetica', 'Calibri',
            'Cambria', 'Consolas', 'Monaco', 'Copperplate', 'Papyrus'
          ];
          
          const testString = 'mmmmmmmmmmlli';
          const testSize = '72px';
          const detectedFonts = [];
          
          const span = document.createElement('span');
          span.style.fontSize = testSize;
          span.style.position = 'absolute';
          span.style.left = '-9999px';
          span.style.top = '-9999px';
          span.textContent = testString;
          document.body.appendChild(span);
          
          // Get baseline widths
          const baselineWidths = {};
          for (const baseFont of baseFonts) {
            span.style.fontFamily = baseFont;
            baselineWidths[baseFont] = span.offsetWidth;
          }
          
          // Test each font
          for (const testFont of testFonts) {
            let detected = false;
            
            for (const baseFont of baseFonts) {
              span.style.fontFamily = `"${testFont}", ${baseFont}`;
              const width = span.offsetWidth;
              
              if (width !== baselineWidths[baseFont]) {
                detected = true;
                break;
              }
            }
            
            if (detected) {
              detectedFonts.push(testFont);
            }
          }
          
          document.body.removeChild(span);
          resolve(detectedFonts);
        } catch (e) {
          resolve([]);
        }
      });
    },

    /**
     * Screen Fingerprint
     * Collects screen and display information
     */
    getScreenFingerprint() {
      try {
        return [
          screen.width,
          screen.height,
          screen.availWidth,
          screen.availHeight,
          screen.colorDepth,
          screen.pixelDepth,
          window.devicePixelRatio
        ].join('x');
      } catch (e) {
        return 'error';
      }
    },

    /**
     * Get Browser Plugins
     */
    getPlugins() {
      try {
        const plugins = [];
        for (let i = 0; i < navigator.plugins.length && i < 10; i++) {
          plugins.push(navigator.plugins[i].name);
        }
        return plugins;
      } catch (e) {
        return [];
      }
    },

    /**
     * Clear cached fingerprint
     */
    clearCache() {
      this.cachedFingerprint = null;
      this.cacheExpiry = 0;
    }
  };

  // ==========================================
  // BEHAVIORAL TRACKER & HONEYPOT SYSTEM
  // ==========================================

  /**
   * Tracks user behavioral patterns for bot detection
   * Monitors mouse movements, keyboard interactions, timing, and interaction patterns
   */
  const BehavioralTracker = {
    startTime: 0,
    mouseMovements: 0,
    keyboardEvents: 0,
    clickEvents: 0,
    scrollEvents: 0,
    lastMouseTime: 0,
    lastKeyboardTime: 0,
    mouseVelocity: [],
    interactionTimings: [],
    listenersAttached: false,

    /**
     * Initialize behavioral tracking
     */
    init() {
      if (this.listenersAttached) return;
      
      this.startTime = Date.now();
      
      // Track mouse movements
      document.addEventListener('mousemove', (e) => {
        this.mouseMovements++;
        
        // Calculate mouse velocity for natural movement detection
        const now = Date.now();
        if (this.lastMouseTime > 0) {
          const timeDelta = now - this.lastMouseTime;
          if (timeDelta > 0) {
            this.mouseVelocity.push(timeDelta);
            if (this.mouseVelocity.length > 10) {
              this.mouseVelocity.shift();
            }
          }
        }
        this.lastMouseTime = now;
      }, { passive: true });
      
      // Track keyboard events
      document.addEventListener('keydown', () => {
        this.keyboardEvents++;
        
        const now = Date.now();
        if (this.lastKeyboardTime > 0) {
          const timeDelta = now - this.lastKeyboardTime;
          this.interactionTimings.push(timeDelta);
          if (this.interactionTimings.length > 10) {
            this.interactionTimings.shift();
          }
        }
        this.lastKeyboardTime = now;
      }, { passive: true });
      
      // Track clicks
      document.addEventListener('click', () => {
        this.clickEvents++;
      }, { passive: true });
      
      // Track scrolls
      document.addEventListener('scroll', () => {
        this.scrollEvents++;
      }, { passive: true });
      
      this.listenersAttached = true;
    },

    /**
     * Get current behavioral data
     */
    getData() {
      const submissionTime = Date.now() - this.startTime;
      
      // Calculate average mouse velocity
      const avgMouseVelocity = this.mouseVelocity.length > 0
        ? this.mouseVelocity.reduce((a, b) => a + b, 0) / this.mouseVelocity.length
        : 0;
      
      // Detect suspiciously consistent timing (bot-like)
      const hasConsistentTiming = this.interactionTimings.length > 3 &&
        this.interactionTimings.every((t, i, arr) => 
          i === 0 || Math.abs(t - arr[i-1]) < 50
        );
      
      return {
        mouseMovements: this.mouseMovements,
        keyboardEvents: this.keyboardEvents,
        clickEvents: this.clickEvents,
        scrollEvents: this.scrollEvents,
        submissionTime,
        avgMouseVelocity: Math.round(avgMouseVelocity),
        hasConsistentTiming,
        interactionCount: this.mouseMovements + this.keyboardEvents + this.clickEvents
      };
    },

    /**
     * Reset tracking data
     */
    reset() {
      this.startTime = Date.now();
      this.mouseMovements = 0;
      this.keyboardEvents = 0;
      this.clickEvents = 0;
      this.scrollEvents = 0;
      this.lastMouseTime = 0;
      this.lastKeyboardTime = 0;
      this.mouseVelocity = [];
      this.interactionTimings = [];
    }
  };

  // Initialize behavioral tracker on load
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => BehavioralTracker.init());
    } else {
      BehavioralTracker.init();
    }
  }

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================
  
  /**
   * Detect client-side automation tools
   */
  function detectClientAutomation() {
    return {
      webdriver: navigator.webdriver === true,
      headless: /headless/i.test(navigator.userAgent),
      phantom: !!window.callPhantom || !!window._phantom,
      selenium: !!window.document.$cdc_asdjflasutopfhvcZLmcfl_,
      chromeDriver: !!window.document.documentElement.getAttribute('webdriver'),
      plugins: navigator.plugins.length === 0,
      languages: navigator.languages.length === 0,
      platform: /Linux/.test(navigator.platform) && !/Android/.test(navigator.userAgent),
    };
  }

  /**
   * Reusable TextEncoder instance for performance
   */
  const textEncoder = new TextEncoder();

  /**
   * Generate SHA-256 hash of a message
   */
  async function sha256(message) {
    const msgBuffer = textEncoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Convert hash buffer to hex string (optimized)
   * Faster than Array.from + map + join approach
   */
  function bufferToHex(buffer) {
    const hashArray = new Uint8Array(buffer);
    let hex = '';
    for (let i = 0; i < hashArray.length; i++) {
      const h = hashArray[i].toString(16);
      hex += h.length === 1 ? '0' + h : h;
    }
    return hex;
  }

  /**
   * Solve ALTCHA-style POW using Web Workers (parallel processing)
   * OPTIMIZED: Uses up to 16 workers for maximum parallelization
   * ALTCHA approach: Find number N where SHA256(salt + N) = challengeHash
   * Much faster than traditional prefix-based POW
   */
  async function solveProofOfWorkWithWorkers(challenge, onProgress) {
    const { salt, challengeHash, maxNumber } = challenge;
    
    return new Promise((resolve, reject) => {
      // Use up to 16 workers for maximum speed (or all available CPU cores)
      const workerCount = Math.min(navigator.hardwareConcurrency || 8, 16);
      // Increased batch size for better throughput
      const batchSize = 10000;
      const workers = [];
      let currentNumber = 0;
      let totalAttempts = 0;
      let found = false;
      let activeWorkers = 0;
      
      // Create inline worker to avoid CORS issues
      const workerCode = `
        function bufferToHex(buffer) {
          const hashArray = new Uint8Array(buffer);
          let hex = '';
          for (let i = 0; i < hashArray.length; i++) {
            const h = hashArray[i].toString(16);
            hex += h.length === 1 ? '0' + h : h;
          }
          return hex;
        }
        
        self.onmessage = async function(e) {
          const { type, data } = e.data;
          
          if (type === 'solve') {
            const { salt, challengeHash, startNumber, batchSize } = data;
            const textEncoder = new TextEncoder();
            let lastReportedAttempt = 0;
            
            for (let i = 0; i < batchSize; i++) {
              const number = startNumber + i;
              const hashData = salt + number.toString();
              const msgBuffer = textEncoder.encode(hashData);
              const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
              const hash = bufferToHex(hashBuffer);
              
              if (i > 0 && i % 500 === 0) {
                const incrementalAttempts = i - lastReportedAttempt;
                self.postMessage({
                  type: 'progress',
                  data: {
                    attempts: incrementalAttempts,
                    hash: hash,
                    currentNumber: number
                  }
                });
                lastReportedAttempt = i;
              }
              
              if (hash === challengeHash) {
                const incrementalAttempts = (i + 1) - lastReportedAttempt;
                self.postMessage({
                  type: 'found',
                  data: {
                    solution: number,
                    attempts: incrementalAttempts,
                    hash: hash
                  }
                });
                return;
              }
            }
            
            const incrementalAttempts = batchSize - lastReportedAttempt;
            self.postMessage({
              type: 'complete',
              data: {
                attempts: incrementalAttempts
              }
            });
          }
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      
      function cleanup() {
        workers.forEach(w => w.terminate());
        workers.length = 0;
        URL.revokeObjectURL(workerUrl);
      }
      
      function assignWork(worker) {
        if (found || currentNumber >= maxNumber) {
          return false;
        }
        
        const startNumber = currentNumber;
        currentNumber += batchSize;
        activeWorkers++;
        
        worker.postMessage({
          type: 'solve',
          data: {
            salt,
            challengeHash,
            startNumber,
            batchSize: Math.min(batchSize, maxNumber - startNumber)
          }
        });
        
        return true;
      }
      
      try {
        for (let i = 0; i < workerCount; i++) {
          const worker = new Worker(workerUrl);
          
          worker.onmessage = function(e) {
            const { type, data } = e.data;
            
            if (type === 'found') {
              if (!found) {
                found = true;
                cleanup();
                resolve(data.solution);
              }
            } else if (type === 'progress') {
              totalAttempts += data.attempts;
              if (onProgress) {
                onProgress(data.hash, totalAttempts);
              }
            } else if (type === 'complete') {
              activeWorkers--;
              totalAttempts += data.attempts;
              
              if (!assignWork(worker)) {
                worker.terminate();
                
                if (activeWorkers === 0 && !found) {
                  cleanup();
                  reject(new Error('Max number reached without solution'));
                }
              }
            }
          };
          
          worker.onerror = function(error) {
            activeWorkers--;
            worker.terminate();
            
            if (activeWorkers === 0 && !found) {
              cleanup();
              reject(error);
            }
          };
          
          workers.push(worker);
          assignWork(worker);
        }
      } catch (error) {
        cleanup();
        reject(error);
      }
    });
  }

  /**
   * Solve ALTCHA-style POW sequentially (fallback when workers unavailable)
   * Find number N where SHA256(salt + N) = challengeHash
   */
  async function solveProofOfWorkSequential(challenge, onProgress) {
    const { salt, challengeHash, maxNumber } = challenge;
    let attempts = 0;

    for (let number = 0; number < maxNumber; number++) {
      // ALTCHA: hash(salt + number) - looking for exact match
      const data = salt + number.toString();
      const msgBuffer = textEncoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hash = bufferToHex(hashBuffer);
      
      attempts++;
      
      if (onProgress && attempts % PROGRESS_UPDATE_INTERVAL === 0) {
        onProgress(hash, attempts);
      }

      // ALTCHA: Check for exact match
      if (hash === challengeHash) {
        return number;
      }
    }

    throw new Error('Max number reached without solution');
  }

  /**
   * Solve ALTCHA Proof of Work challenge - OPTIMIZED WITH WEB WORKERS
   * Uses parallel processing via Web Workers for 5-10x speedup
   * Falls back to sequential processing if workers unavailable
   * ALTCHA approach is much faster than traditional prefix-based POW
   */
  async function solveProofOfWork(challenge, onProgress) {
    const supportsWorkers = typeof Worker !== 'undefined';
    
    if (supportsWorkers) {
      try {
        return await solveProofOfWorkWithWorkers(challenge, onProgress);
      } catch (error) {
        console.warn('Worker-based ALTCHA failed, falling back to sequential:', error);
        return await solveProofOfWorkSequential(challenge, onProgress);
      }
    } else {
      return await solveProofOfWorkSequential(challenge, onProgress);
    }
  }

  /**
   * Seeded random number generator for deterministic puzzle generation
   */
  function seededRandom(seed) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Generate jigsaw puzzle path for SVG
   */
  function generateJigsawPath(seed, size) {
    const baseSize = size;
    const nubSize = baseSize * 0.25;
    const nubDepth = baseSize * 0.15;
    
    const rng = (offset) => seededRandom(seed + offset);
    
    const topNubDir = rng(1) > 0.5 ? 1 : -1;
    const rightNubDir = rng(2) > 0.5 ? 1 : -1;
    
    const topStart = baseSize * 0.35;
    const topEnd = baseSize * 0.65;
    const topMid = (topStart + topEnd) / 2;
    
    const rightStart = baseSize * 0.35;
    const rightEnd = baseSize * 0.65;
    const rightMid = (rightStart + rightEnd) / 2;
    
    let path = `M 0 0`;
    path += ` L ${topStart} 0`;
    path += ` Q ${topStart} ${-nubDepth * topNubDir * 0.3} ${topMid - nubSize / 2} ${-nubDepth * topNubDir}`;
    path += ` Q ${topMid} ${-nubDepth * topNubDir * 1.2} ${topMid + nubSize / 2} ${-nubDepth * topNubDir}`;
    path += ` Q ${topEnd} ${-nubDepth * topNubDir * 0.3} ${topEnd} 0`;
    path += ` L ${baseSize} 0`;
    path += ` L ${baseSize} ${rightStart}`;
    path += ` Q ${baseSize + nubDepth * rightNubDir * 0.3} ${rightStart} ${baseSize + nubDepth * rightNubDir} ${rightMid - nubSize / 2}`;
    path += ` Q ${baseSize + nubDepth * rightNubDir * 1.2} ${rightMid} ${baseSize + nubDepth * rightNubDir} ${rightMid + nubSize / 2}`;
    path += ` Q ${baseSize + nubDepth * rightNubDir * 0.3} ${rightEnd} ${baseSize} ${rightEnd}`;
    path += ` L ${baseSize} ${baseSize}`;
    path += ` L 0 ${baseSize}`;
    path += ` Z`;
    
    return path;
  }

  // ==========================================
  // SVG ICONS (matching Lucide icons)
  // ==========================================
  
  const Icons = {
    bot: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`,
    userCheck: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>`,
    checkCircle: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
    xCircle: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
    alertTriangle: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    shield: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`,
    close: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    refresh: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>`,
    loader: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,
    clock: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    volume2: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`
  };

  // ==========================================
  // SECURITY: SANITIZATION UTILITIES
  // ==========================================
  
  /**
   * Escape HTML special characters to prevent XSS attacks
   * Used for all user-provided content (custom messages, branding text, etc.)
   */
  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  /**
   * Sanitize URL to prevent javascript: protocol and other XSS vectors
   * Only allows http:, https:, and relative URLs
   */
  function sanitizeUrl(url) {
    if (!url) return '';
    const trimmed = String(url).trim();
    
    // Allow relative URLs
    if (trimmed.startsWith('/')) {
      return trimmed;
    }
    
    // Validate absolute URLs
    try {
      const parsed = new URL(trimmed);
      // Only allow http and https protocols
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return trimmed;
      }
    } catch (e) {
      // Invalid URL, return empty string
      console.warn('[SECURITY] Invalid URL blocked:', trimmed);
      return '';
    }
    
    // Block javascript:, data:, and other dangerous protocols
    console.warn('[SECURITY] Dangerous URL protocol blocked:', trimmed);
    return '';
  }

  // ==========================================
  // WIDGET CLASS
  // ==========================================
  
  /**
   * ProofCaptcha Widget Class
   */
  class ProofCaptchaWidget {
    constructor(container, options) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      this.publicKey = options.publicKey || options['site-key'] || options.sitekey;
      this.callback = options.callback;
      this.errorCallback = options['error-callback'] || options['expired-callback'];
      this.theme = options.theme || 'light';
      this.type = options.type || 'random';
      this.language = options.language || options.lang || 'en'; // Support both 'en' and 'id' (Indonesian)
      this.privacyUrl = options.privacyUrl || options['privacy-url'] || `${API_BASE_URL}/privacy`;
      this.termsUrl = options.termsUrl || options['terms-url'] || `${API_BASE_URL}/terms`;
      
      this.status = 'idle';
      this.challenge = null;
      this.token = null;
      this.widgetId = Math.random().toString(36).substring(2);
      this.actualType = null;
      this.selectedCells = [];
      this.jigsawPieces = [];
      this.dragPosition = { x: 0, y: 0 };
      this.isDragging = false;
      this.upsideDownClicks = [];
      this.audioClicks = [];
      this.attempts = 0;
      this.blockExpiresAt = null;
      this.remainingTime = '';
      this.countdownInterval = null;
      
      // Timeout management
      this.challengeTimeoutId = null;
      this.resetTimeoutId = null;
      this.tokenExpiryTimeoutId = null;
      this.errorMessage = '';
      
      // Animation reload flag to prevent double slide animations
      this.isReloading = false;
      
      // Security settings (loaded from server per API key)
      this.challengeTimeoutMs = 60000; // Default 1 minute
      this.tokenExpiryMs = 60000; // Default 1 minute
      this.advancedFingerprintingEnabled = true; // Default enabled
      
      // Widget customization settings (loaded from server)
      this.widgetSize = 'normal'; // Default size
      this.animationsEnabled = true; // Default enabled
      this.animationSpeed = 'normal'; // Default speed
      this.customLogoUrl = null;
      this.customBrandText = null;
      this.showBranding = true;
      
      // User feedback settings (loaded from server)
      this.customMessages = {};
      this.customSuccessMessage = null;
      this.showComputationCount = true;
      this.customLoadingMessage = null;
      this.showProgressBar = false;
      
      // PHASE 3: Challenge behavior settings (loaded from server)
      this.autoRetryOnFail = true; // Default: auto-retry enabled
      this.maxAutoRetries = 3; // Default: max 3 retries
      this.retryDelayMs = 800; // Default: 800ms delay
      this.currentRetryCount = 0; // Track current retry count
      this.challengeSelectionMode = 'random'; // Default: random selection
      this.preferredChallengeType = null; // Default: no preference
      this.enableDifficultyProgression = false; // Default: disabled
      this.maxDifficultyLevel = 7; // Default: max level 7
      this.allowSkipForTrustedFingerprints = false; // Default: disabled
      this.trustThresholdDays = 30; // Default: 30 days
      
      // PHASE 4: Performance settings (loaded from server)
      this.preloadChallenges = false; // Default: disabled
      this.prefetchAssets = false; // Default: disabled
      this.cacheValidTokens = false; // Default: disabled
      this.tokenCacheDurationMs = 300000; // Default: 5 minutes
      this.enableCompression = false; // Default: disabled
      this.useCDN = false; // Default: disabled
      this.cdnUrl = null; // Default: no CDN
      this.maxWorkerThreads = 2; // Default: 2 threads
      this.workerFallbackEnabled = true; // Default: enabled
      
      // PHASE 5: Privacy settings (loaded from server)
      this.enableGDPRMode = false; // Default: disabled
      this.requireExplicitConsent = false; // Default: disabled
      this.minimalDataMode = false; // Default: disabled
      this.showPrivacyLink = true; // Default: show privacy link
      this.customPrivacyUrl = null; // Default: no custom URL
      this.customTermsUrl = null; // Default: no custom URL
      
      // PHASE 5: Accessibility settings (loaded from server)
      this.enableAriaLabels = true; // Default: enabled
      this.enableKeyboardNavigation = true; // Default: enabled
      this.enableHighContrastMode = false; // Default: disabled
      this.alwaysShowAudioChallenge = false; // Default: disabled
      this.enableTextBasedChallenge = false; // Default: disabled
      
      // Security config loading state
      this.securityConfigLoaded = false;
      this.configLoadPromise = null;
      
      // SECURITY: Load encrypted security config before rendering widget
      // This prevents client-side manipulation of security settings
      this.initializeWithSecurityConfig();
    }

    /**
     * Get translations dictionary
     * Returns all UI text translations for supported languages
     */
    getTranslations() {
      return {
        en: {
          notARobot: "I'm not a robot",
          verified: "✓ Verified!",
          verificationFailed: "Verification failed",
          tryAgain: "Try again",
          loading: "Loading challenge...",
          blockedCountry: "Blocked Country",
          accessDenied: "Access denied from your region",
          computations: "computations",
          rateLimited: "Too Many Attempts",
          pleaseWait: "Please wait",
          ipLocked: "IP Locked",
          selectAll: "Select all",
          verify: "Verify",
          selectImages: "Select all images with",
          selectSquares: "Select all squares with",
          newChallenge: "Get a new challenge",
          audioChallenge: "Get an audio challenge",
          helpLink: "Help",
          privacyLink: "Privacy",
          termsLink: "Terms",
          close: "Close",
          submit: "Submit",
          cancel: "Cancel",
          refresh: "Refresh",
          skip: "Skip",
          next: "Next",
          previous: "Previous",
          finish: "Finish"
        },
        id: {
          notARobot: "Saya bukan robot",
          verified: "✓ Terverifikasi!",
          verificationFailed: "Verifikasi gagal",
          tryAgain: "Coba lagi",
          loading: "Memuat tantangan...",
          blockedCountry: "Negara Diblokir",
          accessDenied: "Akses ditolak dari wilayah Anda",
          computations: "komputasi",
          rateLimited: "Terlalu Banyak Percobaan",
          pleaseWait: "Mohon tunggu",
          ipLocked: "IP Terkunci",
          selectAll: "Pilih semua",
          verify: "Verifikasi",
          selectImages: "Pilih semua gambar dengan",
          selectSquares: "Pilih semua kotak dengan",
          newChallenge: "Dapatkan tantangan baru",
          audioChallenge: "Dapatkan tantangan audio",
          helpLink: "Bantuan",
          privacyLink: "Privasi",
          termsLink: "Ketentuan",
          close: "Tutup",
          submit: "Kirim",
          cancel: "Batal",
          refresh: "Segarkan",
          skip: "Lewati",
          next: "Berikutnya",
          previous: "Sebelumnya",
          finish: "Selesai"
        }
      };
    }

    /**
     * Get translated text with custom message override support
     * Priority: customKey (from server) > translation > fallback
     * 
     * @param {string} key - Translation key (e.g., 'notARobot', 'verified')
     * @param {string} customKey - Custom message key (e.g., 'failed', 'success')
     * @param {string} fallback - Fallback text if no translation found
     * @returns {string} Translated or custom text
     */
    getText(key, customKey = null, fallback = '') {
      // Priority 1: Custom message from server (if customKey provided)
      if (customKey && this.customMessages[customKey]) {
        return this.customMessages[customKey];
      }
      
      // Priority 2: Translation based on current language
      const translations = this.getTranslations();
      const lang = this.language || 'en';
      const langDict = translations[lang] || translations['en'];
      
      if (langDict[key]) {
        return langDict[key];
      }
      
      // Priority 3: Fallback text
      return fallback || translations['en'][key] || '';
    }

    /**
     * Initialize widget with encrypted security config
     * SECURITY: Requests encrypted config from server to prevent manipulation
     * 
     * SECURITY IMPROVEMENTS:
     * 1. Generates cryptographic nonce for replay protection
     * 2. Sends client timestamp for freshness validation
     * 3. Validates nonce match after decryption
     * 4. Waits for config before rendering widget
     * 5. Applies safe defaults if config loading fails
     */
    async initializeWithSecurityConfig() {
      try {
        console.log('[SECURITY-CONFIG] Loading encrypted security configuration...');
        
        // First, establish encryption handshake if not already done
        if (!EncryptionManager.currentSession) {
          console.log('[SECURITY-CONFIG] Establishing encryption handshake...');
          await EncryptionManager.performHandshake(this.publicKey);
        }
        
        // SECURITY FIX: Generate cryptographic nonce for replay protection
        const nonceArray = new Uint8Array(16);
        crypto.getRandomValues(nonceArray);
        const nonce = Array.from(nonceArray, byte => byte.toString(16).padStart(2, '0')).join('');
        
        // SECURITY FIX: Get client timestamp for freshness validation
        const clientTimestamp = Date.now();
        
        console.log(`[SECURITY-CONFIG] Requesting config with nonce: ${nonce.substring(0, 8)}...`);
        
        // Get clientPublicKey from current session
        const sessionClientPublicKey = EncryptionManager.currentSession?.clientPublicKey;
        if (!sessionClientPublicKey) {
          console.error('[SECURITY-CONFIG] No client public key in session');
          this.applyDefaultSecuritySettings();
          this.securityConfigLoaded = false;
          this.render();
          return;
        }
        
        // Request encrypted security config from server with nonce and timestamp
        const response = await fetch(`${API_BASE_URL}/api/captcha/security-config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sitekey: this.publicKey,
            clientPublicKey: sessionClientPublicKey,
            clientTimestamp: clientTimestamp,
            nonce: nonce
          }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.warn(`[SECURITY-CONFIG] Failed to load config: ${errorData.error || 'Unknown'}, using defaults`);
          
          // SECURITY FIX: Apply safe defaults explicitly
          this.applyDefaultSecuritySettings();
          this.securityConfigLoaded = false;
          this.render();
          return;
        }
        
        const data = await response.json();
        
        // Decrypt security config
        const decryptedConfig = await EncryptionManager.decryptSecurityConfig(
          data.encrypted,
          data.configId,
          this.publicKey
        );
        
        if (!decryptedConfig) {
          console.warn('[SECURITY-CONFIG] Failed to decrypt config, using defaults');
          this.applyDefaultSecuritySettings();
          this.securityConfigLoaded = false;
          this.render();
          return;
        }
        
        // SECURITY FIX: Validate nonce match (prevent replay attacks)
        if (decryptedConfig.nonce !== nonce) {
          console.error('[SECURITY-CONFIG] Nonce mismatch! Possible replay attack detected');
          this.applyDefaultSecuritySettings();
          this.securityConfigLoaded = false;
          this.render();
          return;
        }
        
        // SECURITY FIX: Validate server timestamp freshness
        const serverTime = decryptedConfig.serverTimestamp;
        const responseTime = Date.now();
        const roundTripTime = responseTime - clientTimestamp;
        const estimatedServerTime = clientTimestamp + (roundTripTime / 2);
        const timeDiff = Math.abs(serverTime - estimatedServerTime);
        
        // Allow max 5 seconds difference (accounting for network latency)
        if (timeDiff > 5000) {
          console.warn(`[SECURITY-CONFIG] Server timestamp suspicious (diff: ${timeDiff}ms), using defaults`);
          this.applyDefaultSecuritySettings();
          this.securityConfigLoaded = false;
          this.render();
          return;
        }
        
        console.log('[SECURITY-CONFIG] Config decrypted and validated successfully, applying settings...');
        
        // Anti-debugger control
        if (decryptedConfig.antiDebugger === true) {
          console.log('[SECURITY-CONFIG] Enabling anti-debugger protection');
          AntiDebugger.enable();
        } else if (decryptedConfig.antiDebugger === false) {
          console.log('[SECURITY-CONFIG] Anti-debugger protection disabled by server config');
          AntiDebugger.disable();
        }
        
        // Challenge timeout control (in milliseconds)
        if (decryptedConfig.challengeTimeoutMs) {
          this.challengeTimeoutMs = decryptedConfig.challengeTimeoutMs;
          console.log('[SECURITY-CONFIG] Challenge timeout set to:', this.challengeTimeoutMs + 'ms');
        }
        
        // Token expiry control (in milliseconds)
        if (decryptedConfig.tokenExpiryMs) {
          this.tokenExpiryMs = decryptedConfig.tokenExpiryMs;
          console.log('[SECURITY-CONFIG] Token expiry set to:', this.tokenExpiryMs + 'ms');
        }
        
        // Advanced fingerprinting control
        if (decryptedConfig.advancedFingerprinting !== undefined) {
          this.advancedFingerprintingEnabled = decryptedConfig.advancedFingerprinting;
          console.log('[SECURITY-CONFIG] Advanced fingerprinting:', this.advancedFingerprintingEnabled);
        }
        
        // PHASE 1: Widget Customization Settings
        if (decryptedConfig.widgetCustomization) {
          const custom = decryptedConfig.widgetCustomization;
          console.log('[WIDGET CUSTOMIZATION] Applying settings:', custom);
          
          // Language control
          if (custom.autoDetectLanguage !== false) {
            // Auto-detect language from browser
            const browserLang = navigator.language || navigator.userLanguage || 'en';
            // Check if it's Indonesian (id, id-ID, etc.)
            if (browserLang.toLowerCase().startsWith('id')) {
              this.language = 'id';
            } else {
              // Use defaultLanguage as fallback if browser language is not supported
              this.language = custom.defaultLanguage || 'en';
            }
            console.log('[WIDGET CUSTOMIZATION] Language auto-detected:', this.language, '(browser:', browserLang + ')');
          } else {
            // Auto-detect disabled, use default language from settings
            this.language = custom.defaultLanguage || 'en';
            console.log('[WIDGET CUSTOMIZATION] Language set to:', this.language);
          }
          
          // Theme control
          if (custom.forceTheme) {
            this.theme = custom.forceTheme;
            console.log('[WIDGET CUSTOMIZATION] Theme forced to:', this.theme);
          }
          
          // Size control
          if (custom.widgetSize) {
            this.widgetSize = custom.widgetSize;
            console.log('[WIDGET CUSTOMIZATION] Widget size set to:', this.widgetSize);
          }
          
          // Animation control
          if (custom.disableAnimations !== undefined) {
            this.animationsEnabled = !custom.disableAnimations;
            console.log('[WIDGET CUSTOMIZATION] Animations enabled:', this.animationsEnabled);
          }
          if (custom.animationSpeed) {
            this.animationSpeed = custom.animationSpeed;
            console.log('[WIDGET CUSTOMIZATION] Animation speed set to:', this.animationSpeed);
          }
          
          // Branding control
          if (custom.customLogoUrl) {
            this.customLogoUrl = custom.customLogoUrl;
            console.log('[WIDGET CUSTOMIZATION] Custom logo URL:', this.customLogoUrl);
          }
          if (custom.customBrandText) {
            this.customBrandText = custom.customBrandText;
            console.log('[WIDGET CUSTOMIZATION] Custom brand text:', this.customBrandText);
          }
          if (custom.showBranding !== undefined) {
            this.showBranding = custom.showBranding;
            console.log('[WIDGET CUSTOMIZATION] Show branding:', this.showBranding);
          }
        }
        
        // PHASE 2: User Feedback Settings
        if (decryptedConfig.userFeedback) {
          const feedback = decryptedConfig.userFeedback;
          console.log('[USER FEEDBACK] Applying settings:', feedback);
          
          // Custom error messages
          if (feedback.customErrorMessages) {
            this.customMessages = feedback.customErrorMessages;
            console.log('[USER FEEDBACK] Custom error messages loaded');
          }
          
          // Custom success message
          if (feedback.customSuccessMessage) {
            this.customSuccessMessage = feedback.customSuccessMessage;
            console.log('[USER FEEDBACK] Custom success message:', this.customSuccessMessage);
          }
          
          // Show computation count
          if (feedback.showComputationCount !== undefined) {
            this.showComputationCount = feedback.showComputationCount;
            console.log('[USER FEEDBACK] Show computation count:', this.showComputationCount);
          }
          
          // Custom loading message
          if (feedback.customLoadingMessage) {
            this.customLoadingMessage = feedback.customLoadingMessage;
            console.log('[USER FEEDBACK] Custom loading message:', this.customLoadingMessage);
          }
          
          // Show progress bar
          if (feedback.showProgressBar !== undefined) {
            this.showProgressBar = feedback.showProgressBar;
            console.log('[USER FEEDBACK] Show progress bar:', this.showProgressBar);
          }
        }
        
        // PHASE 3: Challenge Behavior Settings
        if (decryptedConfig.challengeBehavior) {
          const behavior = decryptedConfig.challengeBehavior;
          console.log('[CHALLENGE BEHAVIOR] Applying settings:', behavior);
          
          // Auto-retry configuration
          if (behavior.autoRetryOnFail !== undefined) {
            this.autoRetryOnFail = behavior.autoRetryOnFail;
            this.maxAutoRetries = behavior.maxAutoRetries || 3;
            this.retryDelayMs = behavior.retryDelayMs || 800;
            console.log('[CHALLENGE BEHAVIOR] Auto-retry enabled:', this.autoRetryOnFail, 
                       'Max retries:', this.maxAutoRetries, 'Delay:', this.retryDelayMs);
          }
          
          // Challenge selection mode
          if (behavior.challengeSelectionMode) {
            this.challengeSelectionMode = behavior.challengeSelectionMode;
            console.log('[CHALLENGE BEHAVIOR] Challenge selection mode:', this.challengeSelectionMode);
          }
          
          // Preferred challenge type
          if (behavior.preferredChallengeType) {
            this.preferredChallengeType = behavior.preferredChallengeType;
            console.log('[CHALLENGE BEHAVIOR] Preferred challenge type:', this.preferredChallengeType);
          }
          
          // Difficulty progression
          if (behavior.enableDifficultyProgression !== undefined) {
            this.enableDifficultyProgression = behavior.enableDifficultyProgression;
            this.maxDifficultyLevel = behavior.maxDifficultyLevel || 7;
            console.log('[CHALLENGE BEHAVIOR] Difficulty progression enabled:', this.enableDifficultyProgression,
                       'Max level:', this.maxDifficultyLevel);
          }
          
          // Trusted user bypass
          if (behavior.allowSkipForTrustedFingerprints !== undefined) {
            this.allowSkipForTrustedFingerprints = behavior.allowSkipForTrustedFingerprints;
            this.trustThresholdDays = behavior.trustThresholdDays || 30;
            console.log('[CHALLENGE BEHAVIOR] Skip for trusted enabled:', this.allowSkipForTrustedFingerprints,
                       'Threshold:', this.trustThresholdDays, 'days');
          }
        }
        
        // PHASE 4: Performance & Optimization Settings
        if (decryptedConfig.performance) {
          const perf = decryptedConfig.performance;
          console.log('[PERFORMANCE] Applying settings:', perf);
          
          // Preloading
          if (perf.preloadChallenges !== undefined) {
            this.preloadChallenges = perf.preloadChallenges;
            console.log('[PERFORMANCE] Preload challenges:', this.preloadChallenges);
          }
          if (perf.prefetchAssets !== undefined) {
            this.prefetchAssets = perf.prefetchAssets;
            console.log('[PERFORMANCE] Prefetch assets:', this.prefetchAssets);
          }
          
          // Token caching
          if (perf.cacheValidTokens !== undefined) {
            this.cacheValidTokens = perf.cacheValidTokens;
            this.tokenCacheDurationMs = perf.tokenCacheDurationMs || 300000;
            console.log('[PERFORMANCE] Cache valid tokens:', this.cacheValidTokens,
                       'Duration:', this.tokenCacheDurationMs);
          }
          
          // Network optimization
          if (perf.enableCompression !== undefined) {
            this.enableCompression = perf.enableCompression;
            console.log('[PERFORMANCE] Compression enabled:', this.enableCompression);
          }
          if (perf.useCDN && perf.cdnUrl) {
            this.useCDN = perf.useCDN;
            this.cdnUrl = perf.cdnUrl;
            console.log('[PERFORMANCE] CDN enabled:', this.useCDN, 'URL:', this.cdnUrl);
          }
          
          // Web workers
          if (perf.maxWorkerThreads) {
            this.maxWorkerThreads = perf.maxWorkerThreads;
            console.log('[PERFORMANCE] Max worker threads:', this.maxWorkerThreads);
          }
          if (perf.workerFallbackEnabled !== undefined) {
            this.workerFallbackEnabled = perf.workerFallbackEnabled;
            console.log('[PERFORMANCE] Worker fallback enabled:', this.workerFallbackEnabled);
          }
        }
        
        // PHASE 5: Privacy & Compliance Settings
        if (decryptedConfig.privacy) {
          const privacy = decryptedConfig.privacy;
          console.log('[PRIVACY] Applying settings:', privacy);
          
          // GDPR mode
          if (privacy.enableGDPRMode !== undefined) {
            this.enableGDPRMode = privacy.enableGDPRMode;
            console.log('[PRIVACY] GDPR mode enabled:', this.enableGDPRMode);
          }
          if (privacy.requireExplicitConsent !== undefined) {
            this.requireExplicitConsent = privacy.requireExplicitConsent;
            console.log('[PRIVACY] Require explicit consent:', this.requireExplicitConsent);
          }
          if (privacy.minimalDataMode !== undefined) {
            this.minimalDataMode = privacy.minimalDataMode;
            console.log('[PRIVACY] Minimal data mode:', this.minimalDataMode);
          }
          
          // Privacy links
          if (privacy.showPrivacyLink !== undefined) {
            this.showPrivacyLink = privacy.showPrivacyLink;
            console.log('[PRIVACY] Show privacy link:', this.showPrivacyLink);
          }
          if (privacy.customPrivacyUrl) {
            this.customPrivacyUrl = privacy.customPrivacyUrl;
            console.log('[PRIVACY] Custom privacy URL:', this.customPrivacyUrl);
          }
          if (privacy.customTermsUrl) {
            this.customTermsUrl = privacy.customTermsUrl;
            console.log('[PRIVACY] Custom terms URL:', this.customTermsUrl);
          }
        }
        
        // PHASE 5: Accessibility Settings
        if (decryptedConfig.accessibility) {
          const access = decryptedConfig.accessibility;
          console.log('[ACCESSIBILITY] Applying settings:', access);
          
          // Screen reader support
          if (access.enableAriaLabels !== undefined) {
            this.enableAriaLabels = access.enableAriaLabels;
            console.log('[ACCESSIBILITY] ARIA labels enabled:', this.enableAriaLabels);
          }
          
          // Keyboard navigation
          if (access.enableKeyboardNavigation !== undefined) {
            this.enableKeyboardNavigation = access.enableKeyboardNavigation;
            console.log('[ACCESSIBILITY] Keyboard navigation enabled:', this.enableKeyboardNavigation);
          }
          
          // Visual accessibility
          if (access.enableHighContrastMode !== undefined) {
            this.enableHighContrastMode = access.enableHighContrastMode;
            console.log('[ACCESSIBILITY] High contrast mode enabled:', this.enableHighContrastMode);
          }
          
          // Alternative challenges
          if (access.alwaysShowAudioChallenge !== undefined) {
            this.alwaysShowAudioChallenge = access.alwaysShowAudioChallenge;
            console.log('[ACCESSIBILITY] Always show audio challenge:', this.alwaysShowAudioChallenge);
          }
          if (access.enableTextBasedChallenge !== undefined) {
            this.enableTextBasedChallenge = access.enableTextBasedChallenge;
            console.log('[ACCESSIBILITY] Text-based challenge enabled:', this.enableTextBasedChallenge);
          }
        }
        
        // Mark config as loaded
        this.securityConfigLoaded = true;
        console.log('[SECURITY-CONFIG] All settings applied successfully, rendering widget...');
        
        // SECURITY FIX: Render widget only after config successfully loaded and applied
        this.render();
        
      } catch (error) {
        console.error('[SECURITY-CONFIG] Error loading security config:', error);
        
        // SECURITY FIX: Apply safe defaults on error
        this.applyDefaultSecuritySettings();
        this.securityConfigLoaded = false;
        
        // Render with defaults on error
        this.render();
      }
    }

    /**
     * Apply default security settings (safe fallback)
     * Called when config loading fails or is compromised
     */
    applyDefaultSecuritySettings() {
      console.log('[SECURITY-CONFIG] Applying safe default security settings');
      
      // Apply conservative defaults
      this.theme = 'light'; // Safe default theme
      this.advancedFingerprintingEnabled = true; // Enable by default for security
      
      // Do NOT enable anti-debugger by default (could interfere with legitimate development)
      // Let server explicitly enable it via config
      
      // Use default widget settings
      this.widgetSize = 'normal';
      this.animationsEnabled = true;
      this.animationSpeed = 'normal';
    }

    /**
     * Validate domain before allowing user interaction
     * This checks if the sitekey is valid for the current domain
     */
    async validateDomain() {
      try {
        // Make a lightweight request to check domain validation
        const response = await fetch(`${API_BASE_URL}/api/captcha/challenge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            publicKey: this.publicKey,
            fingerprint: {
              userAgent: navigator.userAgent,
              language: navigator.language
            },
            challengeType: 'grid'
          })
        });

        const data = await response.json();

        // Check for domain validation error
        if (!response.ok) {
          if (response.status === 403 && data.error === 'Domain validation failed') {
            // Domain validation failed - show error immediately
            this.status = 'error';
            this.errorMessage = data.message || 'Invalid domain';
            this.updateWidgetState();
            this.triggerCallback('errorCallback', this.errorMessage);
            console.error('[DOMAIN VALIDATION] Failed:', data.message);
          } else if (response.status === 401) {
            // Invalid sitekey
            this.status = 'error';
            this.errorMessage = 'Invalid sitekey';
            this.updateWidgetState();
            this.triggerCallback('errorCallback', this.errorMessage);
            console.error('[DOMAIN VALIDATION] Invalid sitekey');
          } else if (response.status === 403 && data.vpnDetected) {
            // VPN detected
            this.status = 'vpn_detected';
            this.errorMessage = 'Disable your VPN / Matikan VPN anda';
            this.updateWidgetState();
            this.triggerCallback('errorCallback', this.errorMessage);
            console.error('[VPN DETECTION] VPN/Proxy detected:', data.message);
          } else if (response.status === 403 && data.error === 'Access denied') {
            // Country blocked
            this.status = 'country_blocked';
            this.errorMessage = data.message || 'Access denied from your country';
            this.updateWidgetState();
            this.triggerCallback('errorCallback', this.errorMessage);
            console.error('[DOMAIN VALIDATION] Country blocked:', data.message);
          }
        } else {
          // Validation passed - widget remains in idle state
          console.log('[DOMAIN VALIDATION] Passed successfully');
        }
      } catch (error) {
        console.error('[DOMAIN VALIDATION] Error:', error);
        // Don't show error for network issues - let user try clicking checkbox
      }
    }

    /**
     * Collect device fingerprint (conditional based on API key settings)
     * @returns {Promise<Object>} Fingerprint data or minimal data if disabled
     */
    async collectFingerprint() {
      if (this.advancedFingerprintingEnabled) {
        // Full advanced fingerprinting enabled
        const fingerprint = await FingerprintCollector.collect();
        console.log('[FINGERPRINT] Advanced fingerprinting enabled - collected', Object.keys(fingerprint).length, 'components');
        return fingerprint;
      } else {
        // Advanced fingerprinting disabled - send minimal data only
        console.log('[FINGERPRINT] Advanced fingerprinting disabled - sending minimal data');
        return {
          userAgent: navigator.userAgent,
          language: navigator.language,
          screenResolution: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
      }
    }

    /**
     * Get ARIA attributes if enabled
     * @param {Object} attrs - ARIA attributes object (e.g., {label: "text", role: "button"})
     * @returns {string} - HTML string with ARIA attributes or empty string
     */
    getAriaAttributes(attrs = {}) {
      if (!this.enableAriaLabels) return '';
      
      const ariaStr = Object.entries(attrs)
        .map(([key, value]) => {
          // Convert camelCase to kebab-case (e.g., ariaLabel -> aria-label)
          const attrName = key === 'role' ? 'role' : `aria-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
          return `${attrName}="${escapeHtml(value)}"`;
        })
        .join(' ');
      
      return ariaStr ? ` ${ariaStr}` : '';
    }

    /**
     * Render the main widget UI
     */
    render() {
      // Theme detection: support 'light', 'dark', and 'auto'
      let themeClass = '';
      if (this.theme === 'dark') {
        themeClass = 'dark';
      } else if (this.theme === 'auto') {
        // Auto-detect system preference
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        themeClass = prefersDark ? 'dark' : '';
      }
      // else theme === 'light', themeClass remains ''
      
      const sizeClass = this.widgetSize || 'normal';
      const animationClass = !this.animationsEnabled ? 'no-animations' : '';
      const speedClass = this.animationSpeed ? `speed-${this.animationSpeed}` : '';
      
      // Render widget WITHOUT overlay (overlay will be separate)
      this.container.innerHTML = `
        <div class="proofcaptcha-root ${themeClass}" data-widget-id="${this.widgetId}"${this.getAriaAttributes({role: 'group', label: 'ProofCaptcha verification widget'})}>
          <div class="proofcaptcha-widget ${sizeClass} ${animationClass} ${speedClass}" data-testid="card-captcha-widget">
            <div class="proofcaptcha-content">
              <div class="proofcaptcha-inner">
                <div class="proofcaptcha-checkbox-container">
                  <input 
                    type="checkbox" 
                    class="proofcaptcha-checkbox"${this.getAriaAttributes({label: 'I am not a robot', describedby: 'proofcaptcha-text-' + this.widgetId})}
                  />
                </div>
                
                <div class="proofcaptcha-text" id="proofcaptcha-text-${this.widgetId}">
                  ${this.getText('notARobot')}
                </div>
                
                <div class="proofcaptcha-logo"${this.getAriaAttributes({hidden: 'true'})}>
                  ${Icons.bot}
                </div>
              </div>
            </div>
            
            ${this.showBranding ? `
            <div class="proofcaptcha-footer">
              ${this.showPrivacyLink ? `<a href="${sanitizeUrl(this.customPrivacyUrl || this.privacyUrl)}" target="_blank" rel="noopener noreferrer" data-testid="link-privacy"${this.getAriaAttributes({label: 'Privacy Policy'})}>Privacy</a>` : ''}
              ${this.customLogoUrl ? `<img src="${sanitizeUrl(this.customLogoUrl)}" alt="Logo" style="height: 14px; object-fit: contain;" />` : ''}
              <span class="proofcaptcha-footer-brand"${this.getAriaAttributes({hidden: 'true'})}>${escapeHtml(this.customBrandText || 'ProofCaptcha')}</span>
              <a href="${sanitizeUrl(this.customTermsUrl || this.termsUrl)}" target="_blank" rel="noopener noreferrer" data-testid="link-terms"${this.getAriaAttributes({label: 'Terms of Service'})}>Terms</a>
            </div>
            ` : ''}
          </div>
        </div>
      `;

      // Create overlay separately and append to document.body (OUTSIDE the form!)
      // Remove old overlay if exists
      if (this.overlayElement && this.overlayElement.parentNode) {
        this.overlayElement.parentNode.removeChild(this.overlayElement);
      }
      
      this.overlayElement = document.createElement('div');
      this.overlayElement.className = `proofcaptcha-overlay ${themeClass}`;
      this.overlayElement.setAttribute('data-widget-id', this.widgetId);
      
      // Add ARIA attributes for accessibility (conditional)
      if (this.enableAriaLabels) {
        this.overlayElement.setAttribute('role', 'dialog');
        this.overlayElement.setAttribute('aria-modal', 'true');
        this.overlayElement.setAttribute('aria-label', 'CAPTCHA Challenge');
        this.overlayElement.setAttribute('aria-describedby', 'proofcaptcha-challenge-description-' + this.widgetId);
      }
      
      this.overlayElement.innerHTML = `
        <div class="proofcaptcha-modal"></div>
      `;
      document.body.appendChild(this.overlayElement);

      // Note: checkbox event listener is attached in updateWidgetState() 
      // to ensure it's always attached to the current checkbox element
      this.updateWidgetState();
      
      // Validate domain on initialization
      this.validateDomain();
    }

    /**
     * Update widget visual state
     */
    updateWidgetState() {
      const widget = this.container.querySelector('.proofcaptcha-widget');
      const inner = widget.querySelector('.proofcaptcha-inner');
      const logo = widget.querySelector('.proofcaptcha-logo');
      const text = widget.querySelector('.proofcaptcha-text');
      const checkboxContainer = inner.querySelector('.proofcaptcha-checkbox-container');
      
      // Reset logo classes
      logo.className = 'proofcaptcha-logo';
      
      if (this.status === 'success') {
        logo.classList.add('success');
        logo.innerHTML = Icons.userCheck;
        
        checkboxContainer.innerHTML = `
          <div class="proofcaptcha-icon-container success" style="animation: proofcaptcha-scale-in 0.3s ease-out;">
            ${Icons.checkCircle}
          </div>
        `;
        
        // Use custom success message if available (sanitized)
        const successMessage = escapeHtml(this.customSuccessMessage || this.getText('verified'));
        const showAttempts = this.showComputationCount && this.attempts > 0;
        
        text.innerHTML = `
          <div style="animation: proofcaptcha-fade-in 0.4s ease-out;"${this.getAriaAttributes({live: 'polite', atomic: 'true'})}>
            <div class="proofcaptcha-text-status" data-testid="text-status" style="
              font-weight: 600;
              background: linear-gradient(135deg, hsl(142 76% 36%), hsl(142 76% 46%));
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            ">${successMessage}</div>
            ${showAttempts ? `<div class="proofcaptcha-text-attempts" data-testid="text-attempts" style="
              font-size: 11px;
              opacity: 0.8;
              margin-top: 2px;
            "${this.getAriaAttributes({hidden: 'true'})}>${this.attempts.toLocaleString()} ${this.getText('computations')}</div>` : ''}
          </div>
        `;
      } else if (this.status === 'error') {
        // Show warning icon for errors
        logo.classList.add('warning');
        logo.innerHTML = Icons.alertTriangle;
        
        checkboxContainer.innerHTML = `
          <div class="proofcaptcha-icon-container warning">
            ${Icons.alertTriangle}
          </div>
        `;
        
        // Use custom error message if available (sanitized)
        const defaultMessage = this.errorMessage || this.getText('verificationFailed');
        const displayMessage = escapeHtml(this.getText('verificationFailed', 'failed', defaultMessage));
        
        text.innerHTML = `
          <div${this.getAriaAttributes({live: 'assertive', atomic: 'true'})}>
            <div class="proofcaptcha-text-status" style="color: hsl(38 92% 50%);">${displayMessage}</div>
            <button style="
              background: none;
              border: none;
              color: #3b82f6;
              font-size: 12px;
              cursor: pointer;
              padding: 0;
              text-decoration: underline;
              font-weight: 500;
            " data-retry${this.getAriaAttributes({label: 'Try verification again'})}>${this.getText('tryAgain')}</button>
          </div>
        `;
        
        const retryBtn = text.querySelector('[data-retry]');
        retryBtn.addEventListener('click', () => {
          this.status = 'idle';
          this.errorMessage = '';
          this.clearChallengeTimers();
          this.updateWidgetState();
        });
      } else if (this.status === 'blocked') {
        logo.classList.add('warning');
        logo.innerHTML = Icons.shield;
        
        checkboxContainer.innerHTML = `
          <div class="proofcaptcha-icon-container warning">
            ${Icons.shield}
          </div>
        `;
        
        const blockedMessage = escapeHtml(this.getText('ipLocked', 'blocked'));
        
        text.innerHTML = `
          <div${this.getAriaAttributes({live: 'assertive', atomic: 'true'})}>
            <div class="proofcaptcha-text-status" style="color: hsl(38 92% 50%);">${blockedMessage}</div>
            <div style="display: flex; align-items: center; gap: 4px; font-size: 12px; color: hsl(38 92% 50%); margin-top: 2px;">
              ${Icons.clock}
              <span${this.getAriaAttributes({live: 'polite'})}>${this.remainingTime || this.getText('pleaseWait')}</span>
            </div>
          </div>
        `;
      } else if (this.status === 'vpn_detected') {
        logo.classList.add('error');
        logo.innerHTML = Icons.shield;
        
        // Replace "I'm not a robot" text with VPN warning
        text.innerHTML = `
          <div${this.getAriaAttributes({live: 'assertive', atomic: 'true'})}>
            <div class="proofcaptcha-text-status" style="color: hsl(0 84% 60%);">
              ${escapeHtml(this.errorMessage || 'Disable your VPN / Matikan VPN anda')}
            </div>
          </div>
        `;
        
        checkboxContainer.innerHTML = `
          <div class="proofcaptcha-icon-container error">
            ${Icons.xCircle}
          </div>
        `;
      } else if (this.status === 'country_blocked') {
        logo.classList.add('error');
        logo.innerHTML = Icons.xCircle;
        
        checkboxContainer.innerHTML = `
          <div class="proofcaptcha-icon-container error">
            ${Icons.xCircle}
          </div>
        `;
        
        const countryBlockedMessage = escapeHtml(this.getText('blockedCountry', 'countryBlocked'));
        const countryBlockedDetail = escapeHtml(this.errorMessage || this.getText('accessDenied'));
        
        text.innerHTML = `
          <div${this.getAriaAttributes({live: 'assertive', atomic: 'true'})}>
            <div class="proofcaptcha-text-status" style="color: hsl(0 84% 60%);">${countryBlockedMessage}</div>
            <div style="font-size: 11px; color: hsl(0 84% 60%); margin-top: 2px; opacity: 0.9;">
              ${countryBlockedDetail}
            </div>
          </div>
        `;
      } else if (this.status === 'loading') {
        logo.innerHTML = `<div class="proofcaptcha-spin"${this.getAriaAttributes({hidden: 'true'})}>${Icons.loader}</div>`;
        
        // Use custom loading message if available (sanitized)
        const loadingMessage = escapeHtml(this.customLoadingMessage || this.getText('loading'));
        text.innerHTML = `<div${this.getAriaAttributes({live: 'polite', busy: 'true'})}>${loadingMessage}</div>`;
        
        checkboxContainer.innerHTML = `
          <div class="proofcaptcha-icon-container loading"${this.getAriaAttributes({hidden: 'true'})}>
            <div class="proofcaptcha-spin" style="
              width: 20px;
              height: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              ${Icons.loader}
            </div>
          </div>
        `;
      } else {
        // Idle state
        logo.innerHTML = Icons.bot;
        text.textContent = this.getText('notARobot');
        
        checkboxContainer.innerHTML = `
          <input 
            type="checkbox" 
            class="proofcaptcha-checkbox"
          />
        `;
        
        // Re-attach event listener after re-rendering checkbox
        const checkbox = checkboxContainer.querySelector('.proofcaptcha-checkbox');
        if (checkbox) {
          checkbox.addEventListener('change', async (e) => {
            if (e.target.checked && (this.status === 'idle' || this.status === 'error')) {
              e.target.checked = false;
              await this.handleCheckboxClick();
            }
          });
        }
      }
    }

    /**
     * Update countdown for blocked status
     */
    updateBlockedCountdown() {
      if (this.status !== 'blocked' || !this.blockExpiresAt) {
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
          this.countdownInterval = null;
        }
        return;
      }

      const updateTime = () => {
        const now = Date.now();
        const remaining = this.blockExpiresAt - now;

        if (remaining <= 0) {
          this.status = 'idle';
          this.blockExpiresAt = null;
          this.remainingTime = '';
          if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
          }
          this.updateWidgetState();
          return;
        }

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        if (hours > 0) {
          this.remainingTime = `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
          this.remainingTime = `${minutes}m ${seconds}s`;
        } else {
          this.remainingTime = `${seconds}s`;
        }
        
        // Update the display
        const timeDisplay = this.container.querySelector('.proofcaptcha-text span');
        if (timeDisplay) {
          timeDisplay.textContent = this.remainingTime;
        }
      };

      updateTime();
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
      this.countdownInterval = setInterval(updateTime, 1000);
    }

    /**
     * Clear all challenge timeout timers
     */
    clearChallengeTimers() {
      if (this.challengeTimeoutId) {
        clearTimeout(this.challengeTimeoutId);
        this.challengeTimeoutId = null;
      }
      if (this.resetTimeoutId) {
        clearTimeout(this.resetTimeoutId);
        this.resetTimeoutId = null;
      }
      if (this.tokenExpiryTimeoutId) {
        clearTimeout(this.tokenExpiryTimeoutId);
        this.tokenExpiryTimeoutId = null;
      }
    }

    /**
     * Start challenge countdown timer (configurable timeout from API key settings)
     */
    startChallengeCountdown() {
      // Clear any existing timers first
      this.clearChallengeTimers();
      
      // Start timeout using configured value from API key settings
      this.challengeTimeoutId = setTimeout(() => {
        this.handleChallengeTimeout();
      }, this.challengeTimeoutMs);
      
      console.log('[TIMEOUT] Challenge timeout set to:', this.challengeTimeoutMs + 'ms');
    }

    /**
     * Handle challenge timeout - user failed to complete challenge in time
     */
    handleChallengeTimeout() {
      // Double-check widget is still in active challenge state
      if (this.status === 'success' || this.status === 'blocked' || !this.challenge) {
        return;
      }
      
      // Clear the timeout timer
      this.challengeTimeoutId = null;
      
      // Set error state with timeout message (use custom message if available)
      this.status = 'error';
      this.errorMessage = this.customMessages.timeout || "Solve timeout";
      
      // Clear current challenge data
      this.selectedCells = [];
      this.jigsawPieces = [];
      this.dragPosition = { x: 0, y: 0 };
      this.isDragging = false;
      this.upsideDownClicks = [];
      
      // Load new challenge with slide animation after short delay
      setTimeout(() => {
        this.status = 'idle';
        this.errorMessage = '';
        this.loadNewChallengeWithAnimation();
      }, 800);
    }

    /**
     * Handle token expiry - token not used within 1 minute after success
     */
    handleTokenExpiry() {
      // Only expire if still in success state
      if (this.status !== 'success') {
        return;
      }
      
      // Clear the token expiry timer
      this.tokenExpiryTimeoutId = null;
      
      // Set error state with token expired message (use custom message if available)
      this.status = 'error';
      this.errorMessage = this.customMessages.expired || "Token expired!!";
      
      // Clear the verification token
      this.verificationToken = null;
      this.token = null;
      
      // Update widget to show error
      this.updateWidgetState();
      
      // Trigger error callback if provided
      this.triggerCallback('errorCallback', this.errorMessage);
      
      // Schedule automatic reset after 5 seconds
      this.resetTimeoutId = setTimeout(() => {
        this.resetTimeoutId = null;
        
        // Reset to idle state
        this.status = 'idle';
        this.errorMessage = '';
        this.challenge = null;
        this.token = null;
        this.selectedCells = [];
        this.jigsawPieces = [];
        
        // Update widget back to initial state
        this.updateWidgetState();
      }, 5000);
    }

    /**
     * Start token expiry timer (configurable from API key settings)
     */
    startTokenExpiryTimer() {
      // Clear any existing token expiry timer
      if (this.tokenExpiryTimeoutId) {
        clearTimeout(this.tokenExpiryTimeoutId);
        this.tokenExpiryTimeoutId = null;
      }
      
      // Start token expiry countdown using configured value from API key settings
      this.tokenExpiryTimeoutId = setTimeout(() => {
        this.handleTokenExpiry();
      }, this.tokenExpiryMs);
      
      console.log('[TIMEOUT] Token expiry set to:', this.tokenExpiryMs + 'ms');
    }

    /**
     * Handle failed challenge with auto-retry logic
     * Uses autoRetryOnFail setting to determine whether to retry
     * @param {string} errorMessage - Error message to display if retry limit exceeded
     * @param {Function} cleanupFn - Function to clean up challenge state before retry
     */
    async handleFailedChallenge(errorMessage = 'Try again', cleanupFn = null) {
      // Always clear challenge timers on failure
      this.clearChallengeTimers();
      
      // Check if auto-retry is enabled AND we haven't exceeded max retries
      if (this.autoRetryOnFail && this.currentRetryCount < this.maxAutoRetries) {
        this.currentRetryCount++;
        console.log(`[AUTO-RETRY] Attempt ${this.currentRetryCount}/${this.maxAutoRetries} after ${this.retryDelayMs}ms delay`);
        
        // Clean up challenge-specific state BEFORE retry
        if (cleanupFn) cleanupFn();
        
        // Set status to idle immediately (don't show error during retry)
        this.status = 'idle';
        this.errorMessage = '';
        
        // Auto-retry after configured delay
        setTimeout(async () => {
          await this.loadNewChallengeWithAnimation();
        }, this.retryDelayMs);
      } else {
        // Retry limit exceeded or auto-retry disabled
        this.status = 'error';
        
        if (this.autoRetryOnFail) {
          console.log('[AUTO-RETRY] Max retries exceeded, showing error');
          this.errorMessage = 'Too many attempts';
        } else {
          console.log('[AUTO-RETRY] Auto-retry disabled, showing error');
          this.errorMessage = errorMessage;
        }
        
        // Clean up challenge-specific state
        if (cleanupFn) cleanupFn();
        
        // Update widget to show error state
        this.updateWidgetState();
        this.hideOverlay();
        
        // Trigger error callback
        this.triggerCallback('errorCallback', this.errorMessage);
      }
    }
    
    /**
     * Load new challenge with slide animation
     * Triggers slide-out animation, then loads new challenge with slide-in
     */
    async loadNewChallengeWithAnimation() {
      if (!this.overlayElement) return;
      
      const modal = this.overlayElement.querySelector('.proofcaptcha-modal');
      if (modal) {
        // FIXED BUG #2: Clear content BEFORE animation to prevent old content flash
        // This prevents race condition where old captcha is visible during slide-out
        modal.innerHTML = '';
        
        // Add slide-out animation class for smooth transition
        modal.classList.add('proofcaptcha-slide-out');
        
        // Wait for slide-out animation to complete (400ms)
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Remove slide-out class
        modal.classList.remove('proofcaptcha-slide-out');
      }
      
      // Set reload flag to prevent double renderChallenge call
      this.isReloading = true;
      
      // Reset click tracking for all challenge types
      this.selectedCells = [];
      this.jigsawPieces = [];
      this.dragPosition = { x: 0, y: 0 };
      this.isDragging = false;
      this.upsideDownClicks = [];
      this.audioClicks = [];
      
      // Load new challenge (will NOT trigger renderChallenge due to isReloading flag)
      await this.handleCheckboxClick(true);
      
      // Manually call renderChallenge to trigger single slide-in animation
      this.renderChallenge();
      
      // Clear reload flag
      this.isReloading = false;
    }

    /**
     * Handle checkbox click
     */
    async handleCheckboxClick(isRefresh = false) {
      if (this.status === 'blocked' || this.status === 'country_blocked' || this.status === 'vpn_detected') return;
      
      this.status = 'loading';
      this.updateWidgetState();
      
      // PERBAIKAN BUG 1: Hanya tampilkan overlay jika bukan refresh (checkbox pertama kali diklik)
      // Jika refresh, overlay sudah ditampilkan sebelumnya
      if (!isRefresh) {
        // PERBAIKAN BUG 2: Hapus konten modal lama sebelum menampilkan overlay
        // Ini mencegah captcha lama muncul sebentar saat loading challenge baru
        if (this.overlayElement) {
          const modal = this.overlayElement.querySelector('.proofcaptcha-modal');
          if (modal) {
            modal.innerHTML = '';
          }
        }
        this.showOverlay();
      }
      
      try {
        // Establish encryption session if not already available
        await EncryptionManager.ensureSession(this.publicKey);
        
        const clientDetections = detectClientAutomation();
        
        // Collect browser fingerprint (conditional based on API key settings)
        const fingerprint = await this.collectFingerprint();
        
        // Get behavioral tracking data
        const behavioralData = BehavioralTracker.getData();
        console.log('[BEHAVIORAL] Mouse:', behavioralData.mouseMovements, 'Keyboard:', behavioralData.keyboardEvents, 'Time:', behavioralData.submissionTime + 'ms');
        
        // SECURITY: Encrypt sensitive client data to prevent manipulation
        let requestBody = {
          publicKey: this.publicKey,
          type: this.type,
          isRefresh: isRefresh,
        };
        
        // Generate unique nonce for this request (used as challengeId for encryption)
        const requestNonce = Date.now().toString(36) + Math.random().toString(36).substring(2);
        
        // Encrypt clientDetections and fingerprint data if encryption is available
        if (EncryptionManager.isAvailable() && EncryptionManager.currentSession) {
          console.log('[ENCRYPTION] Encrypting client detection and fingerprint data...');
          
          try {
            // Prepare sensitive data payload
            const sensitiveData = {
              clientDetections,
              fingerprint: {
                canvasHash: fingerprint.canvasHash,
                webglHash: fingerprint.webglHash,
                audioHash: fingerprint.audioHash,
                fonts: fingerprint.fonts,
                screenFingerprint: fingerprint.screenFingerprint,
                plugins: fingerprint.plugins,
                timezone: fingerprint.timezone,
                platform: fingerprint.platform,
                hardwareConcurrency: fingerprint.hardwareConcurrency,
                deviceMemory: fingerprint.deviceMemory,
                colorDepth: fingerprint.colorDepth,
                pixelRatio: fingerprint.pixelRatio,
              },
              behavioral: {
                mouseMovements: behavioralData.mouseMovements,
                keyboardEvents: behavioralData.keyboardEvents,
                submissionTime: behavioralData.submissionTime
              }
            };
            
            // Encrypt using session key
            const encrypted = await EncryptionManager.encryptSolution(sensitiveData, requestNonce);
            
            if (encrypted) {
              requestBody.encryptedClientData = encrypted;
              requestBody.requestNonce = requestNonce;
              requestBody.protocol = 'encrypted-v1';
              console.log('[ENCRYPTION] Client data encrypted successfully');
            } else {
              throw new Error('Encryption failed');
            }
          } catch (encError) {
            console.warn('[ENCRYPTION] Failed to encrypt client data, falling back to plaintext:', encError);
            // Fallback to plaintext if encryption fails
            requestBody.clientDetections = clientDetections;
            requestBody.canvasHash = fingerprint.canvasHash;
            requestBody.webglHash = fingerprint.webglHash;
            requestBody.audioHash = fingerprint.audioHash;
            requestBody.fonts = fingerprint.fonts;
            requestBody.screenFingerprint = fingerprint.screenFingerprint;
            requestBody.plugins = fingerprint.plugins;
            requestBody.timezone = fingerprint.timezone;
            requestBody.platform = fingerprint.platform;
            requestBody.hardwareConcurrency = fingerprint.hardwareConcurrency;
            requestBody.deviceMemory = fingerprint.deviceMemory;
            requestBody.colorDepth = fingerprint.colorDepth;
            requestBody.pixelRatio = fingerprint.pixelRatio;
            requestBody.mouseMovements = behavioralData.mouseMovements;
            requestBody.keyboardEvents = behavioralData.keyboardEvents;
            requestBody.submissionTime = behavioralData.submissionTime;
          }
        } else {
          // No encryption available - send plaintext (fallback for old browsers)
          console.log('[ENCRYPTION] Encryption not available, sending plaintext data');
          requestBody.clientDetections = clientDetections;
          requestBody.canvasHash = fingerprint.canvasHash;
          requestBody.webglHash = fingerprint.webglHash;
          requestBody.audioHash = fingerprint.audioHash;
          requestBody.fonts = fingerprint.fonts;
          requestBody.screenFingerprint = fingerprint.screenFingerprint;
          requestBody.plugins = fingerprint.plugins;
          requestBody.timezone = fingerprint.timezone;
          requestBody.platform = fingerprint.platform;
          requestBody.hardwareConcurrency = fingerprint.hardwareConcurrency;
          requestBody.deviceMemory = fingerprint.deviceMemory;
          requestBody.colorDepth = fingerprint.colorDepth;
          requestBody.pixelRatio = fingerprint.pixelRatio;
          requestBody.mouseMovements = behavioralData.mouseMovements;
          requestBody.keyboardEvents = behavioralData.keyboardEvents;
          requestBody.submissionTime = behavioralData.submissionTime;
        }
        
        // Encode request body
        const jsonString = JSON.stringify(requestBody);
        const encodedBody = btoa(jsonString);
        
        const response = await fetch(`${API_BASE_URL}/api/captcha/challenge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: encodedBody }),
          credentials: 'include'
        });

        // Decode response
        const rawData = await response.json();
        let data;
        
        if (rawData.data) {
          try {
            const decodedString = atob(rawData.data);
            data = JSON.parse(decodedString);
            console.log('[REQUEST] Decoded response');
          } catch (decodeError) {
            console.error('[REQUEST] Failed to decode response:', decodeError);
            throw new Error('Failed to decode server response');
          }
        } else {
          data = rawData;
        }

        if (!response.ok) {
          if (response.status === 429 && data.error === 'IP blocked') {
            const remainingMinutes = data.remainingTime || 0;
            const expiresAt = Date.now() + (remainingMinutes * 60 * 1000);
            this.blockExpiresAt = expiresAt;
            this.status = 'blocked';
            this.hideOverlay();
            this.updateWidgetState();
            this.updateBlockedCountdown();
            this.triggerCallback('errorCallback', data.message || 'IP blocked');
            return;
          }
          
          // Handle VPN detection (status 403 with "VPN detected")
          if (response.status === 403 && data.vpnDetected) {
            this.status = 'vpn_detected';
            this.errorMessage = 'Disable your VPN / Matikan VPN anda';
            this.hideOverlay();
            this.updateWidgetState();
            this.triggerCallback('errorCallback', this.errorMessage);
            return;
          }
          
          // Handle country blocking (status 403 with "Access denied")
          if (response.status === 403 && data.error === 'Access denied') {
            this.status = 'country_blocked';
            this.errorMessage = data.message || 'Access denied from your country';
            this.hideOverlay();
            this.updateWidgetState();
            this.triggerCallback('errorCallback', this.errorMessage);
            return;
          }
          
          // Set specific error message based on response
          let errorMsg = 'Failed to generate challenge';
          if (response.status === 401) {
            errorMsg = 'Invalid sitekey';
          } else if (response.status === 403) {
            errorMsg = 'Access denied';
          } else if (response.status === 400) {
            errorMsg = data.message || data.error || 'Bad request';
          } else if (data.message) {
            errorMsg = data.message;
          } else if (data.error) {
            errorMsg = data.error;
          }
          
          throw new Error(errorMsg);
        }
        
        // Decrypt challenge if encrypted
        let challengeData;
        if (data.protocol === 'encrypted-v1' && data.encrypted) {
          console.log('[ENCRYPTION] Received encrypted challenge, decrypting...');
          challengeData = await EncryptionManager.decryptChallenge(data.encrypted, data.token, this.publicKey);
          if (!challengeData) {
            throw new Error('Failed to decrypt challenge');
          }
        } else {
          challengeData = data.challenge;
          console.log('[ENCRYPTION] Using plaintext challenge');
        }
        
        this.challenge = challengeData;
        this.token = data.token;
        this.actualType = data.type;
        this.status = 'idle';
        
        // OPTIMIZATION: Security config is NO LONGER sent with challenge response
        // Security config is loaded once during widget initialization via initializeWithSecurityConfig()
        // This eliminates duplicate data transfer and improves performance
        // All security settings have already been applied when widget was first rendered
        console.log('[SECURITY-CONFIG] Using config loaded at initialization (not from challenge response)');
        
        // Only render challenge if not in reload mode (to prevent double animation)
        if (!this.isReloading) {
          this.renderChallenge();
        }
      } catch (error) {
        console.error('Challenge generation error:', error);
        this.status = 'error';
        // Shorten error messages
        let shortMsg = 'Load failed';
        if (error.message.includes('Invalid sitekey') || error.message.includes('sitekey')) {
          shortMsg = 'Invalid key';
        } else if (error.message.includes('token') || error.message.includes('expired')) {
          shortMsg = 'Token expired';
        } else if (error.message.includes('Bad request')) {
          shortMsg = 'Bad request';
        }
        this.errorMessage = shortMsg;
        this.clearChallengeTimers();
        this.updateWidgetState();
        this.hideOverlay();
        this.triggerCallback('errorCallback', error.message);
      }
    }

    /**
     * Show overlay
     */
    showOverlay() {
      if (!this.overlayElement) return;
      
      const overlay = this.overlayElement;
      
      // Explicitly set pointer events to block all interactions
      overlay.style.pointerEvents = 'auto';
      
      // Lock body scrolling and touch to prevent background interaction
      const previousOverflow = document.body.style.overflow;
      const previousTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none'; // Prevent all touch gestures
      this._previousBodyOverflow = previousOverflow;
      this._previousBodyTouchAction = previousTouchAction;
      
      // Add comprehensive event blocking
      const blockTouchEvents = (e) => {
        // Only prevent if touching the overlay background, not the modal content
        if (e.target === overlay) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      
      const blockAllTouchEvents = (e) => {
        // Only block touch events on overlay background, allow modal content to receive events
        if (e.target === overlay) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      
      const blockWheel = (e) => {
        // Only prevent wheel on overlay background
        if (e.target === overlay) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      
      const blockPointerEvents = (e) => {
        // Only block pointer events on overlay background, allow modal content (including gesture area)
        if (e.target === overlay) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      
      // Store handlers for cleanup
      this._touchstartHandler = blockAllTouchEvents;
      this._touchmoveHandler = blockTouchEvents;
      this._clickHandler = blockTouchEvents;
      this._wheelHandler = blockWheel;
      this._pointerdownHandler = blockPointerEvents;
      
      // Add event listeners with passive:false to allow preventDefault
      overlay.addEventListener('touchstart', this._touchstartHandler, { passive: false, capture: true });
      overlay.addEventListener('touchmove', this._touchmoveHandler, { passive: false, capture: true });
      overlay.addEventListener('click', this._clickHandler, { capture: true });
      overlay.addEventListener('wheel', this._wheelHandler, { passive: false, capture: true });
      overlay.addEventListener('pointerdown', this._pointerdownHandler, { passive: false, capture: true });
      
      // Show overlay
      overlay.classList.add('active');
    }

    /**
     * Hide overlay
     */
    hideOverlay() {
      if (!this.overlayElement) return;
      
      const overlay = this.overlayElement;
      
      // Remove event listeners
      if (this._touchstartHandler) {
        overlay.removeEventListener('touchstart', this._touchstartHandler, { capture: true });
        overlay.removeEventListener('touchmove', this._touchmoveHandler, { capture: true });
        overlay.removeEventListener('click', this._clickHandler, { capture: true });
        overlay.removeEventListener('wheel', this._wheelHandler, { capture: true });
        overlay.removeEventListener('pointerdown', this._pointerdownHandler, { capture: true });
        this._touchstartHandler = null;
        this._touchmoveHandler = null;
        this._clickHandler = null;
        this._wheelHandler = null;
        this._pointerdownHandler = null;
      }
      
      // Restore body scrolling and touch action
      if (this._previousBodyOverflow !== undefined) {
        document.body.style.overflow = this._previousBodyOverflow;
        this._previousBodyOverflow = undefined;
      }
      if (this._previousBodyTouchAction !== undefined) {
        document.body.style.touchAction = this._previousBodyTouchAction;
        this._previousBodyTouchAction = undefined;
      }
      
      // Hide overlay
      overlay.classList.remove('active');
      this.selectedCells = [];
      this.jigsawPieces = [];
    }

    /**
     * Cancel challenge and reset widget state
     */
    cancelChallenge() {
      // Clear any active challenge timers
      this.clearChallengeTimers();
      
      // Reset status to idle if not already success or blocked
      if (this.status !== 'success' && this.status !== 'blocked') {
        this.status = 'idle';
      }
      
      // Hide overlay
      this.hideOverlay();
      
      // Update widget to show checkbox again
      this.updateWidgetState();
    }

    /**
     * Destroy widget and cleanup
     */
    destroy() {
      // Clear challenge timers
      this.clearChallengeTimers();
      
      // FIXED BUG #4: Clear police animation timers to prevent memory leak
      if (this.container) {
        const widgets = this.container.querySelectorAll('.proofcaptcha-widget');
        widgets.forEach(widget => {
          AntiDebugger.clearPoliceAnimationTimers(widget);
        });
      }
      
      // Hide overlay first
      this.hideOverlay();
      
      // Remove overlay from DOM
      if (this.overlayElement && this.overlayElement.parentNode) {
        this.overlayElement.parentNode.removeChild(this.overlayElement);
        this.overlayElement = null;
      }
      
      // Clear any intervals
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
      
      // Clear container
      if (this.container) {
        this.container.innerHTML = '';
      }
    }

    /**
     * Render challenge based on type
     */
    renderChallenge() {
      if (!this.overlayElement) return;
      
      const modal = this.overlayElement.querySelector('.proofcaptcha-modal');
      if (!modal) return;
      
      // Add slide-in animation class for smooth transition
      modal.classList.add('proofcaptcha-slide-in');
      
      // Remove animation class after animation completes
      setTimeout(() => {
        modal.classList.remove('proofcaptcha-slide-in');
      }, 400);
      
      // Start challenge timeout countdown (1 minute)
      this.startChallengeCountdown();
      
      if (this.actualType === 'grid') {
        this.renderGridChallenge(modal);
      } else if (this.actualType === 'jigsaw') {
        this.renderJigsawChallenge(modal);
      } else if (this.actualType === 'gesture') {
        this.renderGestureChallenge(modal);
      } else if (this.actualType === 'upside_down') {
        this.renderUpsideDownChallenge(modal);
      } else if (this.actualType === 'audio') {
        this.renderAudioChallenge(modal);
      }
    }


    /**
     * Render grid challenge
     */
    renderGridChallenge(modal) {
      const gridSize = this.challenge.gridSize || 3;
      const gridEmojis = this.challenge.gridEmojis || [];
      const targetEmojis = this.challenge.targetEmojis || ['🍎'];
      
      let gridCells = '';
      for (let i = 0; i < gridSize * gridSize; i++) {
        const emoji = gridEmojis[i] || '❓';
        gridCells += `
          <button class="proofcaptcha-grid-cell" data-cell-index="${i}"${this.getAriaAttributes({label: `Grid cell ${i + 1} with ${emoji}`, pressed: 'false'})}>
            <span class="proofcaptcha-grid-emoji"${this.getAriaAttributes({hidden: 'true'})}>${emoji}</span>
          </button>
        `;
      }
      
      modal.innerHTML = `
        <div class="proofcaptcha-p-6">
          <div class="proofcaptcha-challenge-header">
            <div>
              <h3 class="proofcaptcha-challenge-title" id="proofcaptcha-challenge-description-${this.widgetId}">Grid Challenge</h3>
              <p class="proofcaptcha-challenge-description">
                Select these: ${targetEmojis.map(e => `<span style="font-size: 20px;">${e}</span>`).join(' ')}
              </p>
            </div>
            <div class="proofcaptcha-challenge-actions">
              <button class="proofcaptcha-btn proofcaptcha-btn-ghost proofcaptcha-btn-icon" data-refresh title="New Challenge"${this.getAriaAttributes({label: 'Load new challenge'})}>
                ${Icons.refresh}
              </button>
              <button class="proofcaptcha-btn proofcaptcha-btn-ghost proofcaptcha-btn-icon" data-close${this.getAriaAttributes({label: 'Close challenge'})}>
                ${Icons.close}
              </button>
            </div>
          </div>
          
          <div class="proofcaptcha-grid-container" style="grid-template-columns: repeat(${gridSize}, 1fr);"${this.getAriaAttributes({role: 'group', label: 'Grid cells for selection'})}>
            ${gridCells}
          </div>

          <p class="proofcaptcha-info-text" data-selected-count${this.getAriaAttributes({live: 'polite', atomic: 'true'})}>
            0 cells selected
          </p>

          <div class="proofcaptcha-button-grid">
            <button class="proofcaptcha-btn proofcaptcha-btn-outline proofcaptcha-btn-lg" data-skip${this.getAriaAttributes({label: 'Skip this challenge'})}>
              Skip
            </button>
            <button class="proofcaptcha-btn proofcaptcha-btn-primary proofcaptcha-btn-lg" data-verify disabled${this.getAriaAttributes({label: 'Verify selection'})}>
              Verify
            </button>
          </div>

          <div class="proofcaptcha-progress proofcaptcha-hidden" data-progress-container${this.getAriaAttributes({hidden: 'true'})}>
            <div class="proofcaptcha-progress-bar" data-progress-bar style="width: 0%"></div>
          </div>
        </div>
      `;
      
      modal.querySelector('[data-close]').addEventListener('click', () => this.cancelChallenge());
      modal.querySelector('[data-refresh]').addEventListener('click', () => this.loadNewChallengeWithAnimation());
      modal.querySelector('[data-skip]').addEventListener('click', () => this.cancelChallenge());
      modal.querySelector('[data-verify]').addEventListener('click', () => this.verifyGrid());
      
      modal.querySelectorAll('[data-cell-index]').forEach(cell => {
        cell.addEventListener('click', () => {
          const index = parseInt(cell.dataset.cellIndex);
          this.handleGridCellClick(index, cell);
        });
      });
    }

    /**
     * Handle grid cell click
     */
    handleGridCellClick(index, cellElement) {
      if (this.status === 'solving') return;
      
      if (this.selectedCells.includes(index)) {
        this.selectedCells = this.selectedCells.filter(i => i !== index);
        cellElement.classList.remove('selected');
        const check = cellElement.querySelector('.proofcaptcha-grid-check');
        if (check) check.remove();
        // Update aria-pressed state
        if (this.enableAriaLabels) {
          cellElement.setAttribute('aria-pressed', 'false');
        }
      } else {
        this.selectedCells.push(index);
        this.selectedCells.sort((a, b) => a - b);
        cellElement.classList.add('selected');
        cellElement.innerHTML += `
          <div class="proofcaptcha-grid-check">
            ${Icons.checkCircle}
          </div>
        `;
        // Update aria-pressed state
        if (this.enableAriaLabels) {
          cellElement.setAttribute('aria-pressed', 'true');
        }
      }
      
      if (!this.overlayElement) return;
      const modal = this.overlayElement.querySelector('.proofcaptcha-modal');
      if (!modal) return;
      
      const countText = modal.querySelector('[data-selected-count]');
      const verifyBtn = modal.querySelector('[data-verify]');
      
      if (countText) countText.textContent = `${this.selectedCells.length} cells selected`;
      if (verifyBtn) verifyBtn.disabled = this.selectedCells.length === 0;
    }

    /**
     * Render jigsaw challenge
     */
    renderJigsawChallenge(modal) {
      const pieces = this.challenge.pieces || [0, 1, 2, 3];
      const pieceEmojis = ['🔴', '🔵', '🟢', '🟡'];
      const pieceColors = ['Red', 'Blue', 'Green', 'Yellow'];
      
      let piecesHtml = '';
      pieces.forEach((piece, idx) => {
        piecesHtml += `
          <button class="proofcaptcha-jigsaw-piece color-${piece}" data-piece="${piece}"${this.getAriaAttributes({label: `${pieceColors[piece]} piece ${pieceEmojis[piece]}`, pressed: 'false'})}>
            <span class="proofcaptcha-jigsaw-emoji"${this.getAriaAttributes({hidden: 'true'})}>${pieceEmojis[piece]}</span>
          </button>
        `;
      });
      
      modal.innerHTML = `
        <div class="proofcaptcha-p-6">
          <div class="proofcaptcha-challenge-header">
            <div>
              <h3 class="proofcaptcha-challenge-title" id="proofcaptcha-challenge-description-${this.widgetId}">Jigsaw Challenge</h3>
              <p class="proofcaptcha-challenge-description">
                Click pieces in order: 🔴 🔵 🟢 🟡
              </p>
            </div>
            <div class="proofcaptcha-challenge-actions">
              <button class="proofcaptcha-btn proofcaptcha-btn-ghost proofcaptcha-btn-icon" data-refresh title="New Challenge"${this.getAriaAttributes({label: 'Load new challenge'})}>
                ${Icons.refresh}
              </button>
              <button class="proofcaptcha-btn proofcaptcha-btn-ghost proofcaptcha-btn-icon" data-close${this.getAriaAttributes({label: 'Close challenge'})}>
                ${Icons.close}
              </button>
            </div>
          </div>
          
          <div class="proofcaptcha-jigsaw-container"${this.getAriaAttributes({role: 'group', label: 'Jigsaw pieces for arrangement'})}>
            ${piecesHtml}
          </div>

          <p class="proofcaptcha-info-text" data-selected-count${this.getAriaAttributes({live: 'polite', atomic: 'true'})}>
            0/4 pieces arranged
          </p>

          <div class="proofcaptcha-button-grid">
            <button class="proofcaptcha-btn proofcaptcha-btn-outline proofcaptcha-btn-lg" data-skip${this.getAriaAttributes({label: 'Skip this challenge'})}>
              Skip
            </button>
            <button class="proofcaptcha-btn proofcaptcha-btn-primary proofcaptcha-btn-lg" data-verify disabled${this.getAriaAttributes({label: 'Verify arrangement'})}>
              Verify
            </button>
          </div>

          <div class="proofcaptcha-progress proofcaptcha-hidden" data-progress-container${this.getAriaAttributes({hidden: 'true'})}>
            <div class="proofcaptcha-progress-bar" data-progress-bar style="width: 0%"></div>
          </div>
        </div>
      `;
      
      modal.querySelector('[data-close]').addEventListener('click', () => this.cancelChallenge());
      modal.querySelector('[data-refresh]').addEventListener('click', () => this.loadNewChallengeWithAnimation());
      modal.querySelector('[data-skip]').addEventListener('click', () => this.cancelChallenge());
      modal.querySelector('[data-verify]').addEventListener('click', () => this.verifyJigsaw());
      
      modal.querySelectorAll('[data-piece]').forEach(pieceEl => {
        pieceEl.addEventListener('click', () => {
          const piece = parseInt(pieceEl.dataset.piece);
          this.handleJigsawPieceClick(piece, pieceEl);
        });
      });
    }

    /**
     * Handle jigsaw piece click
     */
    handleJigsawPieceClick(piece, pieceElement) {
      if (this.status === 'solving') return;
      
      if (this.jigsawPieces.includes(piece)) {
        this.jigsawPieces = this.jigsawPieces.filter(p => p !== piece);
        pieceElement.classList.remove('selected');
        const order = pieceElement.querySelector('.proofcaptcha-jigsaw-order');
        if (order) order.remove();
        // Update aria-pressed state
        if (this.enableAriaLabels) {
          pieceElement.setAttribute('aria-pressed', 'false');
        }
      } else {
        this.jigsawPieces.push(piece);
        pieceElement.classList.add('selected');
        const orderNum = this.jigsawPieces.length;
        pieceElement.innerHTML += `
          <div class="proofcaptcha-jigsaw-order">${orderNum}</div>
        `;
        // Update aria-pressed state
        if (this.enableAriaLabels) {
          pieceElement.setAttribute('aria-pressed', 'true');
        }
      }
      
      if (!this.overlayElement) return;
      const modal = this.overlayElement.querySelector('.proofcaptcha-modal');
      if (!modal) return;
      
      const countText = modal.querySelector('[data-selected-count]');
      const verifyBtn = modal.querySelector('[data-verify]');
      
      if (countText) countText.textContent = `${this.jigsawPieces.length}/4 pieces arranged`;
      if (verifyBtn) verifyBtn.disabled = this.jigsawPieces.length !== 4;
    }


    /**
     * Render gesture challenge
     */
    renderGestureChallenge(modal) {
      const gridSize = this.challenge.gridSize || { width: 300, height: 300 };
      const target = this.challenge.target || { x: 150, y: 150 };
      const tolerance = this.challenge.tolerance || 15;
      const puzzleSeed = this.challenge.puzzleSeed || 1234;
      const puzzleImageUrl = this.challenge.puzzleImageUrl || 'https://picsum.photos/seed/default/400/400';
      
      // Initialize drag position to starting point (top-left area)
      this.dragPosition = { x: 50, y: 50 };
      this.isDragging = false;
      
      const puzzleSize = 60;
      const puzzlePath = generateJigsawPath(puzzleSeed, puzzleSize);
      
      modal.innerHTML = `
        <div class="proofcaptcha-p-6">
          <div class="proofcaptcha-challenge-header">
            <div>
              <h3 class="proofcaptcha-challenge-title" id="proofcaptcha-challenge-description-${this.widgetId}">Puzzle Challenge</h3>
              <p class="proofcaptcha-challenge-description">
                Drag the puzzle piece to fit the hole
              </p>
            </div>
            <div class="proofcaptcha-challenge-actions">
              <button class="proofcaptcha-btn proofcaptcha-btn-ghost proofcaptcha-btn-icon" data-refresh title="New Challenge"${this.getAriaAttributes({label: 'Load new challenge'})}>
                ${Icons.refresh}
              </button>
              <button class="proofcaptcha-btn proofcaptcha-btn-ghost proofcaptcha-btn-icon" data-close${this.getAriaAttributes({label: 'Close challenge'})}>
                ${Icons.close}
              </button>
            </div>
          </div>
          
          <div 
            style="position: relative; width: ${gridSize.width}px; height: ${gridSize.height}px; margin: 0 auto 16px; border-radius: 12px; overflow: hidden; border: 2px solid hsl(var(--pc-border)); user-select: none; touch-action: none;" 
            data-gesture-area${this.getAriaAttributes({label: 'Drag area to move puzzle piece', role: 'application'})}
          >
            <!-- SVG layer for background image and hole -->
            <svg 
              style="position: absolute; inset: 0; pointer-events: none;"
              width="${gridSize.width}" 
              height="${gridSize.height}"
            >
              <defs>
                <!-- Pattern for background image -->
                <pattern id="puzzleBackgroundImage-${this.widgetId}" x="0" y="0" width="1" height="1">
                  <image 
                    href="${puzzleImageUrl}" 
                    x="0" 
                    y="0" 
                    width="${gridSize.width}" 
                    height="${gridSize.height}"
                    preserveAspectRatio="xMidYMid slice"
                  />
                </pattern>
                
                <!-- Mask for all area except hole -->
                <mask id="puzzleHoleMask-${this.widgetId}">
                  <rect width="${gridSize.width}" height="${gridSize.height}" fill="white" />
                  <path 
                    d="${puzzlePath}" 
                    transform="translate(${target.x - puzzleSize/2}, ${target.y - puzzleSize/2})"
                    fill="black"
                  />
                </mask>
              </defs>
              
              <!-- Background image with mask (not visible in hole) -->
              <rect 
                width="${gridSize.width}" 
                height="${gridSize.height}" 
                fill="url(#puzzleBackgroundImage-${this.widgetId})"
                mask="url(#puzzleHoleMask-${this.widgetId})"
              />
              
              <!-- Hole area - black solid -->
              <path 
                d="${puzzlePath}" 
                transform="translate(${target.x - puzzleSize/2}, ${target.y - puzzleSize/2})"
                fill="rgba(0, 0, 0, 0.85)"
              />
              
              <!-- Hole border - subtle -->
              <path 
                data-hole-border
                d="${puzzlePath}" 
                transform="translate(${target.x - puzzleSize/2}, ${target.y - puzzleSize/2})"
                fill="none"
                stroke="rgba(255, 255, 255, 0.3)"
                stroke-width="1.5"
                opacity="0.5"
              />
            </svg>
            
            <!-- Draggable puzzle piece -->
            <div
              style="position: absolute; left: ${this.dragPosition.x}px; top: ${this.dragPosition.y}px; transform: translate(-50%, -50%); z-index: 2; transition: filter 0.1s; cursor: grab;"
              data-puzzle-piece
            >
              <svg 
                width="${puzzleSize + 20}" 
                height="${puzzleSize + 20}" 
                viewBox="-10 -10 ${puzzleSize + 20} ${puzzleSize + 20}"
                style="transition: transform 0.1s; filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.5));"
                data-puzzle-svg
              >
                <defs>
                  <clipPath id="puzzlePieceClip-${this.widgetId}">
                    <path d="${puzzlePath}" />
                  </clipPath>
                </defs>
                
                <!-- Puzzle piece with offset image - always show part from target -->
                <g clip-path="url(#puzzlePieceClip-${this.widgetId})">
                  <image 
                    href="${puzzleImageUrl}" 
                    x="${-target.x + puzzleSize/2}" 
                    y="${-target.y + puzzleSize/2}"
                    width="${gridSize.width}" 
                    height="${gridSize.height}"
                    preserveAspectRatio="xMidYMid slice"
                  />
                </g>
                
                <!-- Puzzle piece border -->
                <path 
                  data-piece-border
                  d="${puzzlePath}" 
                  fill="none"
                  stroke="#ffffff"
                  stroke-width="2.5"
                  opacity="0.95"
                />
                
                <!-- Inner highlight for 3D effect -->
                <path 
                  d="${puzzlePath}" 
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.5)"
                  stroke-width="1"
                />
              </svg>
              
              <!-- Distance indicator when near target -->
              <div data-distance-indicator style="position: absolute; bottom: -32px; left: 50%; transform: translateX(-50%); white-space: nowrap; display: none;">
                <div style="background: #10b981; color: white; font-size: 12px; padding: 4px 8px; border-radius: 9999px; font-weight: 600; animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;">
                  <span data-distance-text>0px away</span>
                </div>
              </div>
            </div>
          </div>

          <p style="text-align: center; font-size: 14px; color: hsl(var(--pc-muted-foreground)); margin-bottom: 16px;" data-feedback-text${this.getAriaAttributes({live: 'polite', atomic: 'true'})}>
            Drag the jigsaw piece to complete the puzzle
          </p>

          <div class="proofcaptcha-button-grid">
            <button class="proofcaptcha-btn proofcaptcha-btn-outline proofcaptcha-btn-lg" data-skip${this.getAriaAttributes({label: 'Skip this challenge'})}>
              Skip
            </button>
            <button class="proofcaptcha-btn proofcaptcha-btn-primary proofcaptcha-btn-lg" data-verify${this.getAriaAttributes({label: 'Verify puzzle position'})}>
              Verify
            </button>
          </div>

          <div class="proofcaptcha-progress proofcaptcha-hidden" data-progress-container${this.getAriaAttributes({hidden: 'true'})}>
            <div class="proofcaptcha-progress-bar" data-progress-bar style="width: 0%"></div>
          </div>
        </div>
      `;
      
      modal.querySelector('[data-close]').addEventListener('click', () => this.cancelChallenge());
      modal.querySelector('[data-refresh]').addEventListener('click', () => this.loadNewChallengeWithAnimation());
      modal.querySelector('[data-skip]').addEventListener('click', () => this.cancelChallenge());
      modal.querySelector('[data-verify]').addEventListener('click', () => this.verifyGesture());
      
      // Setup drag handlers
      const gestureArea = modal.querySelector('[data-gesture-area]');
      const puzzlePiece = modal.querySelector('[data-puzzle-piece]');
      const distanceIndicator = modal.querySelector('[data-distance-indicator]');
      const distanceText = modal.querySelector('[data-distance-text]');
      
      const updatePuzzlePiecePosition = () => {
        puzzlePiece.style.left = `${this.dragPosition.x}px`;
        puzzlePiece.style.top = `${this.dragPosition.y}px`;
        
        // Check proximity to target
        const dx = this.dragPosition.x - target.x;
        const dy = this.dragPosition.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const isNear = distance <= tolerance * 1.5;
        
        if (distanceIndicator) {
          distanceIndicator.style.display = isNear ? 'block' : 'none';
          if (distanceText && isNear) {
            distanceText.textContent = `${Math.round(distance)}px away`;
          }
        }
      };
      
      const handlePointerDown = (e) => {
        if (this.status !== 'idle') return;
        this.isDragging = true;
        puzzlePiece.style.cursor = 'grabbing';
        puzzlePiece.style.filter = 'drop-shadow(0 12px 20px rgba(0, 0, 0, 0.6))';
        gestureArea.setPointerCapture(e.pointerId);
        e.preventDefault();
      };
      
      const handlePointerMove = (e) => {
        if (!this.isDragging || this.status !== 'idle') return;
        
        const rect = gestureArea.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, gridSize.width));
        const y = Math.max(0, Math.min(e.clientY - rect.top, gridSize.height));
        
        this.dragPosition = { x, y };
        updatePuzzlePiecePosition();
        e.preventDefault();
      };
      
      const handlePointerUp = (e) => {
        if (this.isDragging) {
          this.isDragging = false;
          puzzlePiece.style.cursor = 'grab';
          puzzlePiece.style.filter = 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.5))';
          gestureArea.releasePointerCapture(e.pointerId);
          e.preventDefault();
        }
      };
      
      gestureArea.addEventListener('pointerdown', handlePointerDown);
      gestureArea.addEventListener('pointermove', handlePointerMove);
      gestureArea.addEventListener('pointerup', handlePointerUp);
      gestureArea.addEventListener('pointercancel', handlePointerUp);
    }

    /**
     * Render upside down challenge
     */
    renderUpsideDownChallenge(modal) {
      const canvasWidth = this.challenge.canvasWidth || 600;
      const canvasHeight = this.challenge.canvasHeight || 400;
      const animals = this.challenge.animals || [];
      const backgroundUrl = this.challenge.backgroundUrl;
      const backgroundIndex = this.challenge.backgroundIndex || 0;
      
      modal.innerHTML = `
        <div class="proofcaptcha-p-6">
          <div class="proofcaptcha-challenge-header">
            <div>
              <h3 class="proofcaptcha-challenge-title" id="proofcaptcha-challenge-description-${this.widgetId}">Animal Challenge</h3>
              <p class="proofcaptcha-challenge-description">
                Click on all upside-down animals
              </p>
            </div>
            <div class="proofcaptcha-challenge-actions">
              <button class="proofcaptcha-btn proofcaptcha-btn-ghost proofcaptcha-btn-icon" data-refresh title="New Challenge"${this.getAriaAttributes({label: 'Load new challenge'})}>
                ${Icons.refresh}
              </button>
              <button class="proofcaptcha-btn proofcaptcha-btn-ghost proofcaptcha-btn-icon" data-close${this.getAriaAttributes({label: 'Close challenge'})}>
                ${Icons.close}
              </button>
            </div>
          </div>
          
          <div style="position: relative; margin-bottom: 16px;">
            <canvas 
              data-upside-canvas
              width="${canvasWidth}" 
              height="${canvasHeight}"
              style="
                width: 100%; 
                max-width: ${canvasWidth}px;
                height: auto;
                border: 2px solid hsl(var(--pc-border));
                border-radius: 8px;
                cursor: crosshair;
                display: block;
              "${this.getAriaAttributes({label: 'Click on upside-down animals in the canvas', role: 'img'})}
            ></canvas>
          </div>

          <p class="proofcaptcha-info-text" data-clicks-count${this.getAriaAttributes({live: 'polite', atomic: 'true'})}>
            Clicks: 0
          </p>

          <div class="proofcaptcha-button-grid">
            <button class="proofcaptcha-btn proofcaptcha-btn-outline proofcaptcha-btn-lg" data-reset${this.getAriaAttributes({label: 'Reset all clicks'})}>
              Reset
            </button>
            <button class="proofcaptcha-btn proofcaptcha-btn-primary proofcaptcha-btn-lg" data-verify disabled${this.getAriaAttributes({label: 'Verify selection'})}>
              Verify
            </button>
          </div>

          <div class="proofcaptcha-progress proofcaptcha-hidden" data-progress-container${this.getAriaAttributes({hidden: 'true'})}>
            <div class="proofcaptcha-progress-bar" data-progress-bar style="width: 0%"></div>
          </div>
        </div>
      `;
      
      modal.querySelector('[data-close]').addEventListener('click', () => this.cancelChallenge());
      modal.querySelector('[data-refresh]').addEventListener('click', () => this.loadNewChallengeWithAnimation());
      modal.querySelector('[data-reset]').addEventListener('click', () => this.handleUpsideDownReset(modal));
      modal.querySelector('[data-verify]').addEventListener('click', () => this.verifyUpsideDown());
      
      const canvas = modal.querySelector('[data-upside-canvas]');
      const ctx = canvas.getContext('2d');
      
      const imageCache = new Map();
      let imagesLoaded = false;
      
      const animalImages = {
        cat: `${API_BASE_URL}/assets/generated_images/cat_3d_cute_orange.webp`,
      };
      
      const backgrounds = [
        `${API_BASE_URL}/assets/stock_images/floral_pattern_green_a3b1b488.jpg`,
        `${API_BASE_URL}/assets/stock_images/floral_pattern_green_7eb03bb9.jpg`,
      ];
      
      const loadImages = async () => {
        const promises = [];
        
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        promises.push(new Promise((resolve, reject) => {
          bgImg.onload = () => {
            imageCache.set('background', bgImg);
            resolve();
          };
          bgImg.onerror = reject;
          bgImg.src = backgroundUrl || backgrounds[backgroundIndex];
        }));
        
        const uniqueAnimalPaths = [...new Set(animals.map(a => a.path))];
        uniqueAnimalPaths.forEach(path => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          promises.push(new Promise((resolve, reject) => {
            img.onload = () => {
              imageCache.set(path, img);
              resolve();
            };
            img.onerror = reject;
            img.src = path;
          }));
        });
        
        try {
          await Promise.all(promises);
          imagesLoaded = true;
          drawCanvas();
        } catch (error) {
          console.error('Failed to load upside-down images:', error);
        }
      };
      
      const drawCanvas = () => {
        if (!imagesLoaded) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const bgImg = imageCache.get('background');
        if (bgImg) {
          ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        }
        
        animals.forEach(animal => {
          const img = imageCache.get(animal.path);
          if (!img) return;
          
          const size = 80;
          const rotation = animal.rotation !== undefined ? animal.rotation : 0;
          
          ctx.save();
          ctx.translate(animal.x, animal.y);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.drawImage(img, -size / 2, -size / 2, size, size);
          ctx.restore();
        });
        
        this.upsideDownClicks.forEach((click, index) => {
          ctx.fillStyle = 'rgba(255, 50, 50, 0.3)';
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(click.x, click.y, 20, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
          
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((index + 1).toString(), click.x, click.y);
        });
      };
      
      canvas.addEventListener('click', (e) => {
        if (this.status === 'solving') return;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = Math.round((e.clientX - rect.left) * scaleX);
        const y = Math.round((e.clientY - rect.top) * scaleY);
        
        this.upsideDownClicks.push({ x, y });
        
        const clicksCountEl = modal.querySelector('[data-clicks-count]');
        const verifyBtn = modal.querySelector('[data-verify]');
        
        if (clicksCountEl) clicksCountEl.textContent = `Clicks: ${this.upsideDownClicks.length}`;
        if (verifyBtn) verifyBtn.disabled = this.upsideDownClicks.length === 0;
        
        drawCanvas();
      });
      
      loadImages();
    }

    /**
     * Handle upside down reset
     */
    handleUpsideDownReset(modal) {
      this.upsideDownClicks = [];
      
      const clicksCountEl = modal.querySelector('[data-clicks-count]');
      const verifyBtn = modal.querySelector('[data-verify]');
      const canvas = modal.querySelector('[data-upside-canvas]');
      
      if (clicksCountEl) clicksCountEl.textContent = 'Clicks: 0';
      if (verifyBtn) verifyBtn.disabled = true;
      
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const canvasWidth = this.challenge.canvasWidth || 600;
        const canvasHeight = this.challenge.canvasHeight || 400;
        const animals = this.challenge.animals || [];
        const backgroundIndex = this.challenge.backgroundIndex || 0;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.renderUpsideDownChallenge(modal);
      }
    }

    /**
     * Render audio challenge
     */
    renderAudioChallenge(modal) {
      const canvasWidth = this.challenge.canvasWidth || 600;
      const canvasHeight = this.challenge.canvasHeight || 400;
      const animals = this.challenge.animals || [];
      const backgroundUrl = this.challenge.backgroundUrl;
      
      // Animal name translations from English to Indonesian
      const animalTranslations = {
        'cat': 'kucing',
        'dog': 'anjing',
        'elephant': 'gajah',
        'giraffe': 'jerapah',
        'raccoon': 'rakun',
        'bear': 'beruang',
        'bird': 'burung',
        'cow': 'sapi',
        'tiger': 'harimau',
        'monkey': 'monyet',
        'rabbit': 'kelinci',
        'duck': 'bebek',
        'fox': 'rubah',
        'lion': 'singa',
        'chicken': 'ayam'
      };
      
      // Get audio instruction (comma-separated animal names)
      const audioInstruction = this.challenge.audioInstruction || '';
      
      // Initialize audio language based on widget language setting
      if (!this.audioLanguage) {
        this.audioLanguage = this.language === 'id' ? 'id-ID' : 'en-US';
      }
      
      // Indonesian translation is always available since we have the dictionary
      const hasIndonesianTranslation = true;
      
      // Determine which button should be active based on current audioLanguage
      const isEnglishActive = this.audioLanguage === 'en-US';
      const isIndonesianActive = this.audioLanguage === 'id-ID';
      
      modal.innerHTML = `
        <div class="proofcaptcha-p-6">
          <div class="proofcaptcha-challenge-header">
            <div>
              <h3 class="proofcaptcha-challenge-title" id="proofcaptcha-challenge-description-${this.widgetId}">Audio Challenge</h3>
              <p class="proofcaptcha-challenge-description">
                Listen and click the animals mentioned
              </p>
            </div>
            <div class="proofcaptcha-challenge-actions">
              <button class="proofcaptcha-btn proofcaptcha-btn-ghost proofcaptcha-btn-icon" data-refresh title="New Challenge"${this.getAriaAttributes({label: 'Load new challenge'})}>
                ${Icons.refresh}
              </button>
              <button class="proofcaptcha-btn proofcaptcha-btn-ghost proofcaptcha-btn-icon" data-close${this.getAriaAttributes({label: 'Close challenge'})}>
                ${Icons.close}
              </button>
            </div>
          </div>
          
          <div style="margin-bottom: 12px; display: flex; gap: 8px; align-items: center;"${this.getAriaAttributes({role: 'group', label: 'Audio language selection'})}>
            <span style="font-size: 0.875rem; font-weight: 600; color: hsl(var(--pc-muted-foreground));"${this.getAriaAttributes({hidden: 'true'})}>Language:</span>
            <button 
              class="proofcaptcha-btn proofcaptcha-btn-sm ${isEnglishActive ? 'proofcaptcha-btn-primary' : 'proofcaptcha-btn-outline'}" 
              data-lang-en
              style="flex: 1;"${this.getAriaAttributes({label: 'Select English language', pressed: isEnglishActive ? 'true' : 'false'})}
            >
              English
            </button>
            <button 
              class="proofcaptcha-btn proofcaptcha-btn-sm ${isIndonesianActive ? 'proofcaptcha-btn-primary' : 'proofcaptcha-btn-outline'}" 
              data-lang-id
              style="flex: 1;"
              ${!hasIndonesianTranslation ? 'disabled' : ''}${this.getAriaAttributes({label: 'Select Indonesian language', pressed: isIndonesianActive ? 'true' : 'false'})}
            >
              Indonesia
            </button>
          </div>
          
          <div style="margin-bottom: 16px;">
            <button 
              class="proofcaptcha-btn proofcaptcha-btn-outline" 
              data-play-audio
              style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;"${this.getAriaAttributes({label: 'Play audio instruction to hear which animals to select'})}
            >
              ${Icons.volume2}
              <span>Play Audio Instruction</span>
            </button>
          </div>
          
          <div style="position: relative; margin-bottom: 16px;">
            <canvas 
              data-audio-canvas
              width="${canvasWidth}" 
              height="${canvasHeight}"
              style="
                width: 100%; 
                max-width: ${canvasWidth}px;
                height: auto;
                border: 2px solid hsl(var(--pc-border));
                border-radius: 8px;
                cursor: crosshair;
                display: block;
              "${this.getAriaAttributes({label: 'Click on animals mentioned in audio instruction', role: 'img'})}
            ></canvas>
          </div>

          <p class="proofcaptcha-info-text" data-clicks-count${this.getAriaAttributes({live: 'polite', atomic: 'true'})}>
            Clicks: 0
          </p>

          <div class="proofcaptcha-button-grid">
            <button class="proofcaptcha-btn proofcaptcha-btn-outline proofcaptcha-btn-lg" data-reset${this.getAriaAttributes({label: 'Reset all clicks'})}>
              Reset
            </button>
            <button class="proofcaptcha-btn proofcaptcha-btn-primary proofcaptcha-btn-lg" data-verify disabled${this.getAriaAttributes({label: 'Verify selection'})}>
              Verify
            </button>
          </div>

          <div class="proofcaptcha-progress proofcaptcha-hidden" data-progress-container${this.getAriaAttributes({hidden: 'true'})}>
            <div class="proofcaptcha-progress-bar" data-progress-bar style="width: 0%"></div>
          </div>
        </div>
      `;
      
      modal.querySelector('[data-close]').addEventListener('click', () => this.cancelChallenge());
      modal.querySelector('[data-refresh]').addEventListener('click', () => this.loadNewChallengeWithAnimation());
      modal.querySelector('[data-reset]').addEventListener('click', () => this.handleAudioReset(modal));
      modal.querySelector('[data-verify]').addEventListener('click', () => this.verifyAudio());
      
      // Language selection buttons
      const langEnBtn = modal.querySelector('[data-lang-en]');
      const langIdBtn = modal.querySelector('[data-lang-id]');
      
      langEnBtn.addEventListener('click', () => {
        this.audioLanguage = 'en-US';
        // Toggle button styles using classList instead of overwriting className
        langEnBtn.classList.remove('proofcaptcha-btn-outline');
        langEnBtn.classList.add('proofcaptcha-btn-primary');
        langIdBtn.classList.remove('proofcaptcha-btn-primary');
        langIdBtn.classList.add('proofcaptcha-btn-outline');
        // Update aria-pressed states
        if (this.enableAriaLabels) {
          langEnBtn.setAttribute('aria-pressed', 'true');
          langIdBtn.setAttribute('aria-pressed', 'false');
        }
      });
      
      langIdBtn.addEventListener('click', () => {
        this.audioLanguage = 'id-ID';
        // Toggle button styles using classList instead of overwriting className
        langIdBtn.classList.remove('proofcaptcha-btn-outline');
        langIdBtn.classList.add('proofcaptcha-btn-primary');
        langEnBtn.classList.remove('proofcaptcha-btn-primary');
        langEnBtn.classList.add('proofcaptcha-btn-outline');
        // Update aria-pressed states
        if (this.enableAriaLabels) {
          langIdBtn.setAttribute('aria-pressed', 'true');
          langEnBtn.setAttribute('aria-pressed', 'false');
        }
      });
      
      // Play audio button
      const playAudioBtn = modal.querySelector('[data-play-audio]');
      playAudioBtn.addEventListener('click', () => {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          
          // Get animal names from audioInstruction
          const animalNames = audioInstruction.split(',').map(name => name.trim());
          
          // Translate to Indonesian if needed
          let textToSpeak;
          if (this.audioLanguage === 'id-ID') {
            const translatedNames = animalNames.map(name => animalTranslations[name] || name);
            textToSpeak = translatedNames.join(', ');
          } else {
            textToSpeak = animalNames.join(', ');
          }
          
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.lang = this.audioLanguage;
          utterance.rate = 0.9;
          window.speechSynthesis.speak(utterance);
        } else {
          alert('Audio not supported in this browser');
        }
      });
      
      const canvas = modal.querySelector('[data-audio-canvas]');
      const ctx = canvas.getContext('2d');
      
      const imageCache = new Map();
      let imagesLoaded = false;
      
      const loadImages = async () => {
        const promises = [];
        
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        promises.push(new Promise((resolve, reject) => {
          bgImg.onload = () => {
            imageCache.set('background', bgImg);
            resolve();
          };
          bgImg.onerror = reject;
          bgImg.src = backgroundUrl;
        }));
        
        const uniqueAnimalPaths = [...new Set(animals.map(a => a.path))];
        uniqueAnimalPaths.forEach(path => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          promises.push(new Promise((resolve, reject) => {
            img.onload = () => {
              imageCache.set(path, img);
              resolve();
            };
            img.onerror = reject;
            img.src = path;
          }));
        });
        
        try {
          await Promise.all(promises);
          imagesLoaded = true;
          drawCanvas();
        } catch (error) {
          console.error('Failed to load audio challenge images:', error);
        }
      };
      
      const drawCanvas = () => {
        if (!imagesLoaded) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const bgImg = imageCache.get('background');
        if (bgImg) {
          ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        }
        
        animals.forEach(animal => {
          const img = imageCache.get(animal.path);
          if (!img) return;
          
          const size = 80;
          
          ctx.save();
          ctx.translate(animal.x, animal.y);
          ctx.drawImage(img, -size / 2, -size / 2, size, size);
          ctx.restore();
        });
        
        this.audioClicks.forEach((click, index) => {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(click.x, click.y, 20, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
          
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((index + 1).toString(), click.x, click.y);
        });
      };
      
      canvas.addEventListener('click', (e) => {
        if (this.status === 'solving') return;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = Math.round((e.clientX - rect.left) * scaleX);
        const y = Math.round((e.clientY - rect.top) * scaleY);
        
        this.audioClicks.push({ x, y });
        
        const clicksCountEl = modal.querySelector('[data-clicks-count]');
        const verifyBtn = modal.querySelector('[data-verify]');
        
        if (clicksCountEl) clicksCountEl.textContent = `Clicks: ${this.audioClicks.length}`;
        if (verifyBtn) verifyBtn.disabled = this.audioClicks.length === 0;
        
        drawCanvas();
      });
      
      loadImages();
    }

    /**
     * Handle audio reset
     */
    handleAudioReset(modal) {
      this.audioClicks = [];
      
      const clicksCountEl = modal.querySelector('[data-clicks-count]');
      const verifyBtn = modal.querySelector('[data-verify]');
      
      if (clicksCountEl) clicksCountEl.textContent = 'Clicks: 0';
      if (verifyBtn) verifyBtn.disabled = true;
      
      const canvas = modal.querySelector('[data-audio-canvas]');
      if (canvas) {
        this.renderAudioChallenge(modal);
      }
    }


    /**
     * Verify grid challenge
     */
    async verifyGrid() {
      if (!this.challenge || !this.token || this.selectedCells.length === 0) return;

      this.status = 'solving';
      
      if (!this.overlayElement) return;
      const modal = this.overlayElement.querySelector('.proofcaptcha-modal');
      if (!modal) return;
      
      const progressContainer = modal.querySelector('[data-progress-container]');
      const progressBar = modal.querySelector('[data-progress-bar]');
      const verifyBtn = modal.querySelector('[data-verify]');
      
      if (progressContainer) progressContainer.classList.remove('proofcaptcha-hidden');
      if (progressBar) progressBar.style.width = '50%';
      if (verifyBtn) verifyBtn.disabled = true;

      try {
        // SECURITY: Solve ALTCHA proof-of-work to prevent ML-based automated solvers
        const powSolution = await solveProofOfWork(
          {
            salt: this.challenge.salt,
            challengeHash: this.challenge.challengeHash,
            maxNumber: this.challenge.maxNumber,
          },
          (hash, attempts) => {
            const powProgress = Math.min(50 + (attempts / 1000) * 25, 75);
            if (progressBar) progressBar.style.width = `${powProgress}%`;
          }
        );

        if (progressBar) progressBar.style.width = '80%';

        // Create solution payload: {answer: [...], powSolution: "..."}
        const solutionPayload = {
          answer: this.selectedCells,
          powSolution,
        };
        const solution = JSON.stringify(solutionPayload);
        const clientDetections = detectClientAutomation();
        
        // Collect browser fingerprint for verification (conditional based on API key settings)
        const fingerprint = await this.collectFingerprint();
        
        // Get behavioral data
        const behavioralData = BehavioralTracker.getData();

        // Prepare metadata object for encryption
        const metadata = {
          clientDetections,
          canvasHash: fingerprint.canvasHash,
          webglHash: fingerprint.webglHash,
          audioHash: fingerprint.audioHash,
          fonts: fingerprint.fonts,
          screenFingerprint: fingerprint.screenFingerprint,
          plugins: fingerprint.plugins,
          timezone: fingerprint.timezone,
          platform: fingerprint.platform,
          hardwareConcurrency: fingerprint.hardwareConcurrency,
          deviceMemory: fingerprint.deviceMemory,
          colorDepth: fingerprint.colorDepth,
          pixelRatio: fingerprint.pixelRatio,
          mouseMovements: behavioralData.mouseMovements,
          keyboardEvents: behavioralData.keyboardEvents,
          submissionTime: behavioralData.submissionTime
        };

        // Encrypt solution and metadata if encryption is available
        let requestBody = { token: this.token };
        
        if (EncryptionManager.currentSession) {
          const encryptedSolution = await EncryptionManager.encryptSolution(solution, this.token);
          const encryptedMetadata = await EncryptionManager.encryptVerificationMetadata(metadata, this.token);
          
          if (encryptedSolution && encryptedMetadata) {
            requestBody.encrypted = encryptedSolution;
            requestBody.encryptedMetadata = encryptedMetadata;
            requestBody.publicKey = this.publicKey;
          } else {
            requestBody.solution = solution;
            Object.assign(requestBody, metadata);
          }
        } else {
          requestBody.solution = solution;
          Object.assign(requestBody, metadata);
        }

        const response = await fetch(`${API_BASE_URL}/api/captcha/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
          progressBar.style.width = '100%';
          this.status = 'success';
          
          // Reset retry counter on success
          this.currentRetryCount = 0;
          console.log('[AUTO-RETRY] Challenge solved successfully, retry counter reset');
          
          // Clear challenge timers on success
          this.clearChallengeTimers();
          
          // Start token expiry timer (1 minute)
          this.startTokenExpiryTimer();
          
          modal.innerHTML = `
            <div class="proofcaptcha-p-6">
              <div class="proofcaptcha-success-celebration">
                <div class="proofcaptcha-success-sparkles">
                  <div class="sparkle sparkle-1">✨</div>
                  <div class="sparkle sparkle-2">⭐</div>
                  <div class="sparkle sparkle-3">✨</div>
                  <div class="sparkle sparkle-4">⭐</div>
                  <div class="sparkle sparkle-5">✨</div>
                  <div class="sparkle sparkle-6">⭐</div>
                </div>
                <div class="proofcaptcha-success-icon-wrapper">
                  <div class="proofcaptcha-success-icon">
                    ${Icons.checkCircle}
                  </div>
                  <div class="proofcaptcha-success-ring"></div>
                  <div class="proofcaptcha-success-ring-2"></div>
                </div>
                <div class="proofcaptcha-success-content">
                  <h3 class="proofcaptcha-success-title">Success!</h3>
                  <p class="proofcaptcha-success-message">Puzzle solved successfully</p>
                </div>
              </div>
            </div>
          `;
          
          // IMPORTANT: Always use verification token for siteverify
          // Fallback to challenge token only for legacy auth flows
          this.verificationToken = result.verificationToken;
          if (!this.verificationToken) {
            console.warn('ProofCaptcha: No verificationToken in response, using challenge token');
            this.verificationToken = this.token;
          }
          
          setTimeout(() => {
            this.hideOverlay();
            this.updateWidgetState();
            // Send verification token (not challenge token) to callback
            this.triggerCallback('callback', this.verificationToken);
          }, 1000);
        } else {
          // Use auto-retry logic based on settings
          await this.handleFailedChallenge('Try again', () => {
            this.selectedCells = [];
          });
        }
      } catch (error) {
        console.error('Verification error:', error);
        // Use auto-retry logic based on settings
        await this.handleFailedChallenge('Error occurred', () => {
          this.selectedCells = [];
        });
      }
    }

    /**
     * Verify jigsaw challenge
     */
    async verifyJigsaw() {
      if (!this.challenge || !this.token || this.jigsawPieces.length !== 4) return;

      this.status = 'solving';
      
      if (!this.overlayElement) return;
      const modal = this.overlayElement.querySelector('.proofcaptcha-modal');
      if (!modal) return;
      
      const progressContainer = modal.querySelector('[data-progress-container]');
      const progressBar = modal.querySelector('[data-progress-bar]');
      const verifyBtn = modal.querySelector('[data-verify]');
      
      if (progressContainer) progressContainer.classList.remove('proofcaptcha-hidden');
      if (progressBar) progressBar.style.width = '50%';
      if (verifyBtn) verifyBtn.disabled = true;

      try {
        // SECURITY: Solve ALTCHA proof-of-work to prevent ML-based automated solvers
        const powSolution = await solveProofOfWork(
          {
            salt: this.challenge.salt,
            challengeHash: this.challenge.challengeHash,
            maxNumber: this.challenge.maxNumber,
          },
          (hash, attempts) => {
            const powProgress = Math.min(50 + (attempts / 1000) * 25, 75);
            if (progressBar) progressBar.style.width = `${powProgress}%`;
          }
        );

        if (progressBar) progressBar.style.width = '80%';

        // Create solution payload: {answer: [...], powSolution: "..."}
        const solutionPayload = {
          answer: this.jigsawPieces,
          powSolution,
        };
        const solution = JSON.stringify(solutionPayload);
        const clientDetections = detectClientAutomation();
        
        // Collect browser fingerprint for verification (conditional based on API key settings)
        const fingerprint = await this.collectFingerprint();
        
        // Get behavioral data
        const behavioralData = BehavioralTracker.getData();

        // Prepare metadata object for encryption
        const metadata = {
          clientDetections,
          canvasHash: fingerprint.canvasHash,
          webglHash: fingerprint.webglHash,
          audioHash: fingerprint.audioHash,
          fonts: fingerprint.fonts,
          screenFingerprint: fingerprint.screenFingerprint,
          plugins: fingerprint.plugins,
          timezone: fingerprint.timezone,
          platform: fingerprint.platform,
          hardwareConcurrency: fingerprint.hardwareConcurrency,
          deviceMemory: fingerprint.deviceMemory,
          colorDepth: fingerprint.colorDepth,
          pixelRatio: fingerprint.pixelRatio,
          mouseMovements: behavioralData.mouseMovements,
          keyboardEvents: behavioralData.keyboardEvents,
          submissionTime: behavioralData.submissionTime
        };

        // Encrypt solution and metadata if encryption is available
        let requestBody = { token: this.token };
        
        if (EncryptionManager.currentSession) {
          const encryptedSolution = await EncryptionManager.encryptSolution(solution, this.token);
          const encryptedMetadata = await EncryptionManager.encryptVerificationMetadata(metadata, this.token);
          
          if (encryptedSolution && encryptedMetadata) {
            requestBody.encrypted = encryptedSolution;
            requestBody.encryptedMetadata = encryptedMetadata;
            requestBody.publicKey = this.publicKey;
          } else {
            requestBody.solution = solution;
            Object.assign(requestBody, metadata);
          }
        } else {
          requestBody.solution = solution;
          Object.assign(requestBody, metadata);
        }

        const response = await fetch(`${API_BASE_URL}/api/captcha/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
          progressBar.style.width = '100%';
          this.status = 'success';
          
          // Reset retry counter on success
          this.currentRetryCount = 0;
          console.log('[AUTO-RETRY] Challenge solved successfully, retry counter reset');
          
          // Clear challenge timers on success
          this.clearChallengeTimers();
          
          // Start token expiry timer (1 minute)
          this.startTokenExpiryTimer();
          
          modal.innerHTML = `
            <div class="proofcaptcha-p-6">
              <div class="proofcaptcha-success-celebration">
                <div class="proofcaptcha-success-sparkles">
                  <div class="sparkle sparkle-1">✨</div>
                  <div class="sparkle sparkle-2">⭐</div>
                  <div class="sparkle sparkle-3">✨</div>
                  <div class="sparkle sparkle-4">⭐</div>
                  <div class="sparkle sparkle-5">✨</div>
                  <div class="sparkle sparkle-6">⭐</div>
                </div>
                <div class="proofcaptcha-success-icon-wrapper">
                  <div class="proofcaptcha-success-icon">
                    ${Icons.checkCircle}
                  </div>
                  <div class="proofcaptcha-success-ring"></div>
                  <div class="proofcaptcha-success-ring-2"></div>
                </div>
                <div class="proofcaptcha-success-content">
                  <h3 class="proofcaptcha-success-title">Success!</h3>
                  <p class="proofcaptcha-success-message">Jigsaw completed!</p>
                </div>
              </div>
            </div>
          `;
          
          // IMPORTANT: Always use verification token for siteverify
          // Fallback to challenge token only for legacy auth flows
          this.verificationToken = result.verificationToken;
          if (!this.verificationToken) {
            console.warn('ProofCaptcha: No verificationToken in response, using challenge token');
            this.verificationToken = this.token;
          }
          
          setTimeout(() => {
            this.hideOverlay();
            this.updateWidgetState();
            // Send verification token (not challenge token) to callback
            this.triggerCallback('callback', this.verificationToken);
          }, 1000);
        } else {
          // Use auto-retry logic based on settings
          await this.handleFailedChallenge('Try again', () => {
            this.jigsawPieces = [];
          });
        }
      } catch (error) {
        console.error('Verification error:', error);
        // Use auto-retry logic based on settings
        await this.handleFailedChallenge('Error occurred', () => {
          this.jigsawPieces = [];
        });
      }
    }


    /**
     * Verify gesture challenge
     */
    async verifyGesture() {
      if (!this.challenge || !this.token) return;

      this.status = 'solving';
      
      if (!this.overlayElement) return;
      const modal = this.overlayElement.querySelector('.proofcaptcha-modal');
      if (!modal) return;
      
      const progressContainer = modal.querySelector('[data-progress-container]');
      const progressBar = modal.querySelector('[data-progress-bar]');
      const verifyBtn = modal.querySelector('[data-verify]');
      
      if (progressContainer) progressContainer.classList.remove('proofcaptcha-hidden');
      if (progressBar) progressBar.style.width = '50%';
      if (verifyBtn) verifyBtn.disabled = true;

      try {
        // SECURITY: Solve ALTCHA proof-of-work to prevent ML-based automated solvers
        const powSolution = await solveProofOfWork(
          {
            salt: this.challenge.salt,
            challengeHash: this.challenge.challengeHash,
            maxNumber: this.challenge.maxNumber,
          },
          (hash, attempts) => {
            const powProgress = Math.min(50 + (attempts / 1000) * 25, 75);
            if (progressBar) progressBar.style.width = `${powProgress}%`;
          }
        );

        if (progressBar) progressBar.style.width = '80%';

        // Create solution payload: {answer: {...}, powSolution: "..."}
        const solutionPayload = {
          answer: this.dragPosition,
          powSolution,
        };
        const solution = JSON.stringify(solutionPayload);
        const clientDetections = detectClientAutomation();
        
        // Collect browser fingerprint for verification (conditional based on API key settings)
        const fingerprint = await this.collectFingerprint();
        
        // Get behavioral data
        const behavioralData = BehavioralTracker.getData();

        // Prepare metadata object for encryption
        const metadata = {
          clientDetections,
          canvasHash: fingerprint.canvasHash,
          webglHash: fingerprint.webglHash,
          audioHash: fingerprint.audioHash,
          fonts: fingerprint.fonts,
          screenFingerprint: fingerprint.screenFingerprint,
          plugins: fingerprint.plugins,
          timezone: fingerprint.timezone,
          platform: fingerprint.platform,
          hardwareConcurrency: fingerprint.hardwareConcurrency,
          deviceMemory: fingerprint.deviceMemory,
          colorDepth: fingerprint.colorDepth,
          pixelRatio: fingerprint.pixelRatio,
          mouseMovements: behavioralData.mouseMovements,
          keyboardEvents: behavioralData.keyboardEvents,
          submissionTime: behavioralData.submissionTime
        };

        // Encrypt solution and metadata if encryption is available
        let requestBody = { token: this.token };
        
        if (EncryptionManager.currentSession) {
          const encryptedSolution = await EncryptionManager.encryptSolution(solution, this.token);
          const encryptedMetadata = await EncryptionManager.encryptVerificationMetadata(metadata, this.token);
          
          if (encryptedSolution && encryptedMetadata) {
            requestBody.encrypted = encryptedSolution;
            requestBody.encryptedMetadata = encryptedMetadata;
            requestBody.publicKey = this.publicKey;
          } else {
            requestBody.solution = solution;
            Object.assign(requestBody, metadata);
          }
        } else {
          requestBody.solution = solution;
          Object.assign(requestBody, metadata);
        }

        const response = await fetch(`${API_BASE_URL}/api/captcha/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
          progressBar.style.width = '100%';
          this.status = 'success';
          
          // Reset retry counter on success
          this.currentRetryCount = 0;
          console.log('[AUTO-RETRY] Challenge solved successfully, retry counter reset');
          
          // Clear challenge timers on success
          this.clearChallengeTimers();
          
          // Start token expiry timer (1 minute)
          this.startTokenExpiryTimer();
          
          modal.innerHTML = `
            <div class="proofcaptcha-p-6">
              <div class="proofcaptcha-success-celebration">
                <div class="proofcaptcha-success-sparkles">
                  <div class="sparkle sparkle-1">✨</div>
                  <div class="sparkle sparkle-2">⭐</div>
                  <div class="sparkle sparkle-3">✨</div>
                  <div class="sparkle sparkle-4">⭐</div>
                  <div class="sparkle sparkle-5">✨</div>
                  <div class="sparkle sparkle-6">⭐</div>
                </div>
                <div class="proofcaptcha-success-icon-wrapper">
                  <div class="proofcaptcha-success-icon">
                    ${Icons.checkCircle}
                  </div>
                  <div class="proofcaptcha-success-ring"></div>
                  <div class="proofcaptcha-success-ring-2"></div>
                </div>
                <div class="proofcaptcha-success-content">
                  <h3 class="proofcaptcha-success-title">Success!</h3>
                  <p class="proofcaptcha-success-message">Puzzle solved successfully</p>
                </div>
              </div>
            </div>
          `;
          
          // IMPORTANT: Always use verification token for siteverify
          // Fallback to challenge token only for legacy auth flows
          this.verificationToken = result.verificationToken;
          if (!this.verificationToken) {
            console.warn('ProofCaptcha: No verificationToken in response, using challenge token');
            this.verificationToken = this.token;
          }
          
          setTimeout(() => {
            this.hideOverlay();
            this.updateWidgetState();
            // Send verification token (not challenge token) to callback
            this.triggerCallback('callback', this.verificationToken);
          }, 1000);
        } else {
          // Use auto-retry logic based on settings
          await this.handleFailedChallenge('Try again', () => {
            this.dragPosition = { x: 0, y: 0 };
            this.isDragging = false;
          });
        }
      } catch (error) {
        console.error('Verification error:', error);
        // Use auto-retry logic based on settings
        await this.handleFailedChallenge('Error occurred', () => {
          this.dragPosition = { x: 0, y: 0 };
          this.isDragging = false;
        });
      }
    }

    /**
     * Verify upside down challenge
     */
    async verifyUpsideDown() {
      if (!this.challenge || !this.token || this.upsideDownClicks.length === 0) return;

      this.status = 'solving';
      
      if (!this.overlayElement) return;
      const modal = this.overlayElement.querySelector('.proofcaptcha-modal');
      if (!modal) return;
      
      const progressContainer = modal.querySelector('[data-progress-container]');
      const progressBar = modal.querySelector('[data-progress-bar]');
      const verifyBtn = modal.querySelector('[data-verify]');
      
      if (progressContainer) progressContainer.classList.remove('proofcaptcha-hidden');
      if (progressBar) progressBar.style.width = '50%';
      if (verifyBtn) verifyBtn.disabled = true;

      try {
        // SECURITY: Solve ALTCHA proof-of-work to prevent ML-based automated solvers
        const powSolution = await solveProofOfWork(
          {
            salt: this.challenge.salt,
            challengeHash: this.challenge.challengeHash,
            maxNumber: this.challenge.maxNumber,
          },
          (hash, attempts) => {
            const powProgress = Math.min(50 + (attempts / 1000) * 25, 75);
            if (progressBar) progressBar.style.width = `${powProgress}%`;
          }
        );

        if (progressBar) progressBar.style.width = '80%';

        // Create solution payload: {answer: {...}, powSolution: "..."}
        const solutionPayload = {
          answer: { clicks: this.upsideDownClicks },
          powSolution,
        };
        const solution = JSON.stringify(solutionPayload);
        const clientDetections = detectClientAutomation();
        
        // Collect browser fingerprint for verification (conditional based on API key settings)
        const fingerprint = await this.collectFingerprint();
        
        // Get behavioral data
        const behavioralData = BehavioralTracker.getData();

        // Prepare metadata object for encryption
        const metadata = {
          clientDetections,
          canvasHash: fingerprint.canvasHash,
          webglHash: fingerprint.webglHash,
          audioHash: fingerprint.audioHash,
          fonts: fingerprint.fonts,
          screenFingerprint: fingerprint.screenFingerprint,
          plugins: fingerprint.plugins,
          timezone: fingerprint.timezone,
          platform: fingerprint.platform,
          hardwareConcurrency: fingerprint.hardwareConcurrency,
          deviceMemory: fingerprint.deviceMemory,
          colorDepth: fingerprint.colorDepth,
          pixelRatio: fingerprint.pixelRatio,
          mouseMovements: behavioralData.mouseMovements,
          keyboardEvents: behavioralData.keyboardEvents,
          submissionTime: behavioralData.submissionTime
        };

        // Encrypt solution and metadata if encryption is available
        let requestBody = { token: this.token };
        
        if (EncryptionManager.currentSession) {
          const encryptedSolution = await EncryptionManager.encryptSolution(solution, this.token);
          const encryptedMetadata = await EncryptionManager.encryptVerificationMetadata(metadata, this.token);
          
          if (encryptedSolution && encryptedMetadata) {
            requestBody.encrypted = encryptedSolution;
            requestBody.encryptedMetadata = encryptedMetadata;
            requestBody.publicKey = this.publicKey;
          } else {
            requestBody.solution = solution;
            Object.assign(requestBody, metadata);
          }
        } else {
          requestBody.solution = solution;
          Object.assign(requestBody, metadata);
        }

        const response = await fetch(`${API_BASE_URL}/api/captcha/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
          progressBar.style.width = '100%';
          this.status = 'success';
          
          // Reset retry counter on success
          this.currentRetryCount = 0;
          console.log('[AUTO-RETRY] Challenge solved successfully, retry counter reset');
          
          // Clear challenge timers on success
          this.clearChallengeTimers();
          
          // Start token expiry timer (1 minute)
          this.startTokenExpiryTimer();
          
          modal.innerHTML = `
            <div class="proofcaptcha-p-6">
              <div class="proofcaptcha-success-celebration">
                <div class="proofcaptcha-success-sparkles">
                  <div class="sparkle sparkle-1">✨</div>
                  <div class="sparkle sparkle-2">⭐</div>
                  <div class="sparkle sparkle-3">✨</div>
                  <div class="sparkle sparkle-4">⭐</div>
                  <div class="sparkle sparkle-5">✨</div>
                  <div class="sparkle sparkle-6">⭐</div>
                </div>
                <div class="proofcaptcha-success-icon-wrapper">
                  <div class="proofcaptcha-success-icon">
                    ${Icons.checkCircle}
                  </div>
                  <div class="proofcaptcha-success-ring"></div>
                  <div class="proofcaptcha-success-ring-2"></div>
                </div>
                <div class="proofcaptcha-success-content">
                  <h3 class="proofcaptcha-success-title">Success!</h3>
                  <p class="proofcaptcha-success-message">All images identified!</p>
                </div>
              </div>
            </div>
          `;
          
          // IMPORTANT: Always use verification token for siteverify
          // Fallback to challenge token only for legacy auth flows
          this.verificationToken = result.verificationToken;
          if (!this.verificationToken) {
            console.warn('ProofCaptcha: No verificationToken in response, using challenge token');
            this.verificationToken = this.token;
          }
          
          setTimeout(() => {
            this.hideOverlay();
            this.updateWidgetState();
            // Send verification token (not challenge token) to callback
            this.triggerCallback('callback', this.verificationToken);
          }, 1000);
        } else {
          // Use auto-retry logic based on settings
          await this.handleFailedChallenge('Try again', () => {
            this.upsideDownClicks = [];
          });
        }
      } catch (error) {
        console.error('Verification error:', error);
        // Use auto-retry logic based on settings
        await this.handleFailedChallenge('Error occurred', () => {
          this.upsideDownClicks = [];
        });
      }
    }

    /**
     * Verify audio challenge
     */
    async verifyAudio() {
      if (!this.challenge || !this.token || this.audioClicks.length === 0) return;

      this.status = 'solving';
      
      if (!this.overlayElement) return;
      const modal = this.overlayElement.querySelector('.proofcaptcha-modal');
      if (!modal) return;
      
      const progressContainer = modal.querySelector('[data-progress-container]');
      const progressBar = modal.querySelector('[data-progress-bar]');
      const verifyBtn = modal.querySelector('[data-verify]');
      
      if (progressContainer) progressContainer.classList.remove('proofcaptcha-hidden');
      if (progressBar) progressBar.style.width = '50%';
      if (verifyBtn) verifyBtn.disabled = true;

      try {
        // SECURITY: Solve ALTCHA proof-of-work to prevent ML-based automated solvers
        const powSolution = await solveProofOfWork(
          {
            salt: this.challenge.salt,
            challengeHash: this.challenge.challengeHash,
            maxNumber: this.challenge.maxNumber,
          },
          (hash, attempts) => {
            const powProgress = Math.min(50 + (attempts / 1000) * 25, 75);
            if (progressBar) progressBar.style.width = `${powProgress}%`;
          }
        );

        if (progressBar) progressBar.style.width = '80%';

        // Create solution payload: {answer: {...}, powSolution: "..."}
        const solutionPayload = {
          answer: { clicks: this.audioClicks },
          powSolution,
        };
        const solution = JSON.stringify(solutionPayload);
        const clientDetections = detectClientAutomation();
        
        // Collect browser fingerprint for verification (conditional based on API key settings)
        const fingerprint = await this.collectFingerprint();
        
        // Get behavioral data
        const behavioralData = BehavioralTracker.getData();

        // Prepare metadata object for encryption
        const metadata = {
          clientDetections,
          canvasHash: fingerprint.canvasHash,
          webglHash: fingerprint.webglHash,
          audioHash: fingerprint.audioHash,
          fonts: fingerprint.fonts,
          screenFingerprint: fingerprint.screenFingerprint,
          plugins: fingerprint.plugins,
          timezone: fingerprint.timezone,
          platform: fingerprint.platform,
          hardwareConcurrency: fingerprint.hardwareConcurrency,
          deviceMemory: fingerprint.deviceMemory,
          colorDepth: fingerprint.colorDepth,
          pixelRatio: fingerprint.pixelRatio,
          mouseMovements: behavioralData.mouseMovements,
          keyboardEvents: behavioralData.keyboardEvents,
          submissionTime: behavioralData.submissionTime
        };

        // Encrypt solution and metadata if encryption is available
        let requestBody = { token: this.token };
        
        if (EncryptionManager.currentSession) {
          const encryptedSolution = await EncryptionManager.encryptSolution(solution, this.token);
          const encryptedMetadata = await EncryptionManager.encryptVerificationMetadata(metadata, this.token);
          
          if (encryptedSolution && encryptedMetadata) {
            requestBody.encrypted = encryptedSolution;
            requestBody.encryptedMetadata = encryptedMetadata;
            requestBody.publicKey = this.publicKey;
          } else {
            requestBody.solution = solution;
            Object.assign(requestBody, metadata);
          }
        } else {
          requestBody.solution = solution;
          Object.assign(requestBody, metadata);
        }

        const response = await fetch(`${API_BASE_URL}/api/captcha/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
          progressBar.style.width = '100%';
          this.status = 'success';
          
          // Reset retry counter on success
          this.currentRetryCount = 0;
          console.log('[AUTO-RETRY] Challenge solved successfully, retry counter reset');
          
          // Clear challenge timers on success
          this.clearChallengeTimers();
          
          // Start token expiry timer (1 minute)
          this.startTokenExpiryTimer();
          
          modal.innerHTML = `
            <div class="proofcaptcha-p-6">
              <div class="proofcaptcha-success-celebration">
                <div class="proofcaptcha-success-sparkles">
                  <div class="sparkle sparkle-1">✨</div>
                  <div class="sparkle sparkle-2">⭐</div>
                  <div class="sparkle sparkle-3">✨</div>
                  <div class="sparkle sparkle-4">⭐</div>
                  <div class="sparkle sparkle-5">✨</div>
                  <div class="sparkle sparkle-6">⭐</div>
                </div>
                <div class="proofcaptcha-success-icon-wrapper">
                  <div class="proofcaptcha-success-icon">
                    ${Icons.checkCircle}
                  </div>
                  <div class="proofcaptcha-success-ring"></div>
                  <div class="proofcaptcha-success-ring-2"></div>
                </div>
                <div class="proofcaptcha-success-content">
                  <h3 class="proofcaptcha-success-title">Success!</h3>
                  <p class="proofcaptcha-success-message">Audio challenge passed!</p>
                </div>
              </div>
            </div>
          `;
          
          // IMPORTANT: Always use verification token for siteverify
          // Fallback to challenge token only for legacy auth flows
          this.verificationToken = result.verificationToken;
          if (!this.verificationToken) {
            console.warn('ProofCaptcha: No verificationToken in response, using challenge token');
            this.verificationToken = this.token;
          }
          
          setTimeout(() => {
            this.hideOverlay();
            this.updateWidgetState();
            // Send verification token (not challenge token) to callback
            this.triggerCallback('callback', this.verificationToken);
          }, 1000);
        } else {
          // Use auto-retry logic based on settings
          await this.handleFailedChallenge('Try again', () => {
            this.audioClicks = [];
          });
        }
      } catch (error) {
        console.error('Verification error:', error);
        // Use auto-retry logic based on settings
        await this.handleFailedChallenge('Error occurred', () => {
          this.audioClicks = [];
        });
      }
    }

    /**
     * Trigger callback
     */
    triggerCallback(callbackName, value) {
      const callbackFn = this[callbackName];
      if (callbackFn) {
        if (typeof callbackFn === 'string') {
          if (typeof window[callbackFn] === 'function') {
            window[callbackFn](value);
          }
        } else if (typeof callbackFn === 'function') {
          callbackFn(value);
        }
      }
    }

    /**
     * Get response token
     * Returns verificationToken (not challenge token) for siteverify
     */
    getResponse() {
      return this.status === 'success' ? this.verificationToken : null;
    }

    /**
     * Reset widget
     */
    reset() {
      this.status = 'idle';
      this.challenge = null;
      this.token = null;
      this.verificationToken = null; // FIXED BUG #1: Clear verification token on reset
      this.actualType = null;
      this.selectedCells = [];
      this.jigsawPieces = [];
      this.dragPosition = { x: 0, y: 0 };
      this.isDragging = false;
      this.upsideDownClicks = [];
      this.audioClicks = [];
      this.attempts = 0;
      this.blockExpiresAt = null;
      this.remainingTime = '';
      this.errorMessage = ''; // Also clear error message
      
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
      
      // FIXED BUG #6: Clear fingerprint cache to ensure fresh fingerprint on next challenge
      FingerprintCollector.clearCache();
      
      this.hideOverlay();
      this.updateWidgetState();
    }
  }

  // ==========================================
  // GLOBAL API
  // ==========================================
  
  window.ProofCaptcha = {
    render: function(container, parameters) {
      loadCSS();
      
      const element = typeof container === 'string' 
        ? document.getElementById(container) 
        : container;

      if (!element) {
        console.error('ProofCaptcha: Container element not found');
        return -1;
      }

      const widgetId = widgetCounter++;
      const widget = new ProofCaptchaWidget(element, parameters || {});
      widgets.set(widgetId, widget);

      return widgetId;
    },

    reset: function(widgetId) {
      if (widgetId === undefined) {
        const firstWidget = widgets.values().next().value;
        if (firstWidget) firstWidget.reset();
      } else {
        const widget = widgets.get(widgetId);
        if (widget) widget.reset();
      }
    },

    getResponse: function(widgetId) {
      if (widgetId === undefined) {
        const firstWidget = widgets.values().next().value;
        return firstWidget ? firstWidget.getResponse() : null;
      } else {
        const widget = widgets.get(widgetId);
        return widget ? widget.getResponse() : null;
      }
    },

    ready: function(callback) {
      if (typeof callback === 'function') {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', callback);
        } else {
          callback();
        }
      }
    },
    
    antiDebug: {
      enable: function() {
        AntiDebugger.enabled = true;
        AntiDebugger.init();
      },
      
      disable: function() {
        AntiDebugger.disable();
      },
      
      getStatus: function() {
        return {
          enabled: AntiDebugger.enabled,
          devtoolsDetected: AntiDebugger.devtoolsOpen
        };
      }
    }
  };

  // ==========================================
  // AUTO-RENDER
  // ==========================================
  
  function autoRenderWidgets() {
    loadCSS();
    
    const elements = document.querySelectorAll(`.${WIDGET_CLASS}`);
    elements.forEach((element) => {
      if (!element.dataset.widgetId) {
        const widgetId = ProofCaptcha.render(element, {
          sitekey: element.dataset.sitekey,
          callback: element.dataset.callback,
          'error-callback': element.dataset.errorCallback,
          theme: element.dataset.theme,
          type: element.dataset.type
        });
        element.dataset.widgetId = widgetId;
      }
    });
  }

  // Auto-render on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoRenderWidgets);
  } else {
    autoRenderWidgets();
  }

  // Watch for dynamically added widgets
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.classList && node.classList.contains(WIDGET_CLASS)) {
              if (!node.dataset.widgetId) {
                loadCSS();
                const widgetId = ProofCaptcha.render(node, {
                  sitekey: node.dataset.sitekey,
                  callback: node.dataset.callback,
                  'error-callback': node.dataset.errorCallback,
                  theme: node.dataset.theme,
                  type: node.dataset.type
                });
                node.dataset.widgetId = widgetId;
              }
            }
            const children = node.querySelectorAll && node.querySelectorAll(`.${WIDGET_CLASS}`);
            if (children) {
              children.forEach((child) => {
                if (!child.dataset.widgetId) {
                  loadCSS();
                  const widgetId = ProofCaptcha.render(child, {
                    sitekey: child.dataset.sitekey,
                    callback: child.dataset.callback,
                    'error-callback': child.dataset.errorCallback,
                    theme: child.dataset.theme,
                    type: child.dataset.type
                  });
                  child.dataset.widgetId = widgetId;
                }
              });
            }
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

})(window);
