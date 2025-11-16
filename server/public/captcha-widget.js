/**
 * ProofCaptcha Widget - Standalone JavaScript Library
 * Similar to reCAPTCHA v2 API
 */

(function(window) {
  'use strict';

  // Detect API base URL from the script tag source
  function getApiBase() {
    // Try to find the script tag that loaded this file
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src;
      if (src && src.includes('/api/captcha.js')) {
        // Extract origin from script src
        try {
          const url = new URL(src);
          return url.origin;
        } catch (e) {
          console.error('ProofCaptcha: Failed to parse script URL', e);
        }
      }
    }
    
    // Fallback to current origin (for self-hosted scenarios)
    return window.location.origin;
  }

  const API_BASE = getApiBase();
  const WIDGET_CLASS = 'proof-captcha';
  const widgets = new Map();
  let widgetCounter = 0;

  // Utility function to detect automation
  function detectClientAutomation() {
    const detections = {
      webdriver: navigator.webdriver === true,
      headless: /headless/i.test(navigator.userAgent),
      phantom: !!window.callPhantom || !!window._phantom,
      selenium: !!window.document.$cdc_asdjflasutopfhvcZLmcfl_,
      chromeDriver: !!window.document.documentElement.getAttribute('webdriver'),
      plugins: navigator.plugins.length === 0,
      languages: navigator.languages.length === 0,
      platform: /Linux/.test(navigator.platform) && !/Android/.test(navigator.userAgent),
    };
    return detections;
  }

  // Proof of Work Solver
  async function solveProofOfWork(challenge, onProgress) {
    const { prefix, difficulty } = challenge;
    let nonce = 0;
    const maxAttempts = 1000000;

    return new Promise((resolve, reject) => {
      const worker = () => {
        const batchSize = 1000;
        
        for (let i = 0; i < batchSize && nonce < maxAttempts; i++, nonce++) {
          const solution = `${prefix}:${nonce}`;
          const hash = simpleHash(solution);
          
          if (onProgress && nonce % 100 === 0) {
            onProgress(hash, nonce);
          }
          
          if (hash.startsWith('0'.repeat(difficulty))) {
            resolve(solution);
            return;
          }
        }
        
        if (nonce >= maxAttempts) {
          reject(new Error('Max attempts reached'));
          return;
        }
        
        setTimeout(worker, 0);
      };
      
      worker();
    });
  }

  // Simple hash function (for demo - in production use crypto API)
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  // Create widget HTML structure
  function createWidgetHTML() {
    const html = `
      <div class="proof-captcha-container" style="
        border: 2px solid #d3d3d3;
        border-radius: 8px;
        padding: 12px;
        background: linear-gradient(to right, #f8f9fa, #f1f3f5);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        max-width: 320px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      ">
        <div class="proof-captcha-main" style="display: flex; align-items: center; gap: 12px;">
          <div class="proof-captcha-checkbox" style="
            width: 32px;
            height: 32px;
            border: 2px solid #9ca3af;
            border-radius: 4px;
            background: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          " role="button" tabindex="0">
            <span class="proof-captcha-checkmark" style="display: none; color: #10b981; font-size: 20px;">✓</span>
            <span class="proof-captcha-loader" style="display: none; border: 2px solid #f3f3f3; border-top: 2px solid #3b82f6; border-radius: 50%; width: 16px; height: 16px; animation: spin 1s linear infinite;"></span>
            <svg class="proof-captcha-warning-icon" style="display: none; width: 20px; height: 20px; color: #ef4444;" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <svg class="proof-captcha-blocked-icon" style="display: none; width: 20px; height: 20px; color: #f59e0b;" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="proof-captcha-text" style="flex: 1;">
            <span class="proof-captcha-label" style="font-size: 14px; color: #374151;">I'm not a robot</span>
            <span class="proof-captcha-success" style="display: none; font-size: 14px; color: #10b981; font-weight: 500;">Verified!</span>
            <div class="proof-captcha-error" style="display: none;">
              <div style="display: flex; align-items: flex-start; gap: 6px; margin-top: 4px;">
                <svg style="width: 14px; height: 14px; color: #ef4444; flex-shrink: 0; margin-top: 2px;" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                <span class="proof-captcha-error-text" style="font-size: 12px; color: #ef4444; line-height: 1.4;"></span>
              </div>
            </div>
            <div class="proof-captcha-blocked" style="display: none;">
              <div style="display: flex; align-items: flex-start; gap: 6px; margin-top: 4px;">
                <svg style="width: 14px; height: 14px; color: #f59e0b; flex-shrink: 0; margin-top: 2px;" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clip-rule="evenodd"/>
                </svg>
                <span class="proof-captcha-blocked-text" style="font-size: 12px; color: #f59e0b; line-height: 1.4;"></span>
              </div>
            </div>
          </div>
        </div>
        <div class="proof-captcha-overlay" style="display: none; margin-top: 12px; padding: 16px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
          <div class="proof-captcha-overlay-content"></div>
        </div>
        <div class="proof-captcha-footer" style="margin-top: 8px; display: flex; align-items: center; gap: 4px; font-size: 10px; color: #9ca3af;">
          <svg style="width: 12px; height: 12px;" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
          </svg>
          <span>ProofCaptcha</span>
        </div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    return html;
  }

  // Widget class
  class ProofCaptchaWidget {
    constructor(element, options) {
      this.element = element;
      this.options = {
        sitekey: options.sitekey || element.dataset.sitekey,
        callback: options.callback || element.dataset.callback,
        errorCallback: options['error-callback'] || element.dataset.errorCallback,
        expiredCallback: options['expired-callback'] || element.dataset.expiredCallback,
        type: options.type || element.dataset.type || 'random',
        theme: options.theme || element.dataset.theme || 'light',
      };

      this.state = {
        status: 'idle', // idle, loading, solving, success, error, blocked
        token: null,
        challenge: null,
        expiresAt: null,
      };

      this.render();
      this.attachEventListeners();
    }

    render() {
      this.element.innerHTML = createWidgetHTML();
      this.elements = {
        checkbox: this.element.querySelector('.proof-captcha-checkbox'),
        checkmark: this.element.querySelector('.proof-captcha-checkmark'),
        loader: this.element.querySelector('.proof-captcha-loader'),
        warningIcon: this.element.querySelector('.proof-captcha-warning-icon'),
        blockedIcon: this.element.querySelector('.proof-captcha-blocked-icon'),
        label: this.element.querySelector('.proof-captcha-label'),
        success: this.element.querySelector('.proof-captcha-success'),
        error: this.element.querySelector('.proof-captcha-error'),
        errorText: this.element.querySelector('.proof-captcha-error-text'),
        blocked: this.element.querySelector('.proof-captcha-blocked'),
        blockedText: this.element.querySelector('.proof-captcha-blocked-text'),
        overlay: this.element.querySelector('.proof-captcha-overlay'),
        overlayContent: this.element.querySelector('.proof-captcha-overlay-content'),
      };
    }

    attachEventListeners() {
      this.elements.checkbox.addEventListener('click', () => this.handleCheckboxClick());
      this.elements.checkbox.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleCheckboxClick();
        }
      });
    }

    async handleCheckboxClick() {
      if (this.state.status !== 'idle' && this.state.status !== 'error') return;

      // Validate sitekey
      if (!this.options.sitekey) {
        this.setState('error');
        this.showError('Invalid sitekey: Sitekey is required');
        this.triggerCallback('errorCallback', 'Invalid sitekey');
        return;
      }

      this.setState('loading');
      this.showLoader();

      try {
        const clientDetections = detectClientAutomation();
        
        const response = await fetch(`${API_BASE}/api/captcha/challenge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            publicKey: this.options.sitekey, 
            type: this.options.type,
            clientDetections 
          }),
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 429 && data.error === 'IP blocked') {
            this.handleBlocked(data);
            return;
          }
          
          // Handle specific error cases
          let errorMessage = data.message || data.error || 'Failed to generate challenge';
          
          // Check for invalid sitekey
          if (response.status === 401 || response.status === 404 || errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('not found')) {
            errorMessage = 'Invalid sitekey: ' + errorMessage;
          }
          
          throw new Error(errorMessage);
        }

        this.state.challenge = data.challenge;
        this.state.token = data.token;

        // Auto-solve the challenge
        await this.solveChallenge();

      } catch (error) {
        console.error('Challenge generation error:', error);
        this.setState('error');
        this.showError(error.message || 'Network error occurred');
        this.triggerCallback('errorCallback', error.message);
      }
    }

    async solveChallenge() {
      this.setState('solving');

      try {
        const solution = await solveProofOfWork(
          this.state.challenge,
          (hash, attempts) => {
            // Progress callback
          }
        );

        const clientDetections = detectClientAutomation();

        const response = await fetch(`${API_BASE}/api/captcha/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: this.state.token,
            solution,
            clientDetections,
          }),
          credentials: 'include',
        });

        const result = await response.json();

        if (result.blocked && result.message) {
          this.handleBlocked(result);
          return;
        }

        if (result.success) {
          this.setState('success');
          this.showSuccess();
          this.triggerCallback('callback', this.state.token);
          
          // Set expiration timer (typically 2 minutes)
          this.state.expiresAt = Date.now() + (2 * 60 * 1000);
          setTimeout(() => this.handleExpired(), 2 * 60 * 1000);
        } else {
          // Handle specific error cases
          let errorMessage = result.error || result.message || 'Verification failed';
          
          // Check for token expired
          if (errorMessage.toLowerCase().includes('expired') || errorMessage.toLowerCase().includes('invalid token')) {
            errorMessage = 'Token expired: ' + errorMessage;
          }
          
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error('Verification error:', error);
        this.setState('error');
        this.showError(error.message || 'Verification failed');
        this.triggerCallback('errorCallback', error.message);
      }
    }

    handleBlocked(data) {
      this.setState('blocked');
      const message = data.message || 'IP blocked due to too many failed attempts';
      this.showBlocked(message);
      this.triggerCallback('errorCallback', message);
    }

    handleExpired() {
      if (this.state.status === 'success') {
        this.setState('error');
        this.showError('Token expired: Please verify again');
        this.triggerCallback('expiredCallback');
      }
    }

    setState(status) {
      this.state.status = status;
    }

    showLoader() {
      this.elements.label.style.display = 'none';
      this.elements.checkmark.style.display = 'none';
      this.elements.warningIcon.style.display = 'none';
      this.elements.blockedIcon.style.display = 'none';
      this.elements.loader.style.display = 'block';
      this.elements.success.style.display = 'none';
      this.elements.error.style.display = 'none';
      this.elements.blocked.style.display = 'none';
      this.elements.checkbox.style.borderColor = '#9ca3af';
      this.elements.checkbox.style.background = 'white';
      this.elements.checkbox.style.cursor = 'pointer';
    }

    showSuccess() {
      this.elements.label.style.display = 'none';
      this.elements.checkmark.style.display = 'block';
      this.elements.warningIcon.style.display = 'none';
      this.elements.blockedIcon.style.display = 'none';
      this.elements.loader.style.display = 'none';
      this.elements.success.style.display = 'block';
      this.elements.error.style.display = 'none';
      this.elements.blocked.style.display = 'none';
      this.elements.checkbox.style.borderColor = '#10b981';
      this.elements.checkbox.style.background = '#f0fdf4';
    }

    showError(message) {
      this.elements.label.style.display = 'block';
      this.elements.checkmark.style.display = 'none';
      this.elements.warningIcon.style.display = 'block';
      this.elements.blockedIcon.style.display = 'none';
      this.elements.loader.style.display = 'none';
      this.elements.success.style.display = 'none';
      this.elements.error.style.display = 'block';
      this.elements.errorText.textContent = message;
      this.elements.blocked.style.display = 'none';
      this.elements.checkbox.style.borderColor = '#ef4444';
      this.elements.checkbox.style.background = '#fef2f2';
      this.elements.checkbox.style.cursor = 'pointer';
    }

    showBlocked(message) {
      this.elements.label.style.display = 'none';
      this.elements.checkmark.style.display = 'none';
      this.elements.warningIcon.style.display = 'none';
      this.elements.blockedIcon.style.display = 'block';
      this.elements.loader.style.display = 'none';
      this.elements.success.style.display = 'none';
      this.elements.error.style.display = 'none';
      this.elements.blocked.style.display = 'block';
      this.elements.blockedText.textContent = message;
      this.elements.checkbox.style.borderColor = '#f59e0b';
      this.elements.checkbox.style.background = '#fffbeb';
      this.elements.checkbox.style.cursor = 'not-allowed';
    }

    triggerCallback(callbackName, value) {
      const callbackFn = this.options[callbackName];
      if (callbackFn) {
        if (typeof callbackFn === 'string') {
          // Call global function by name
          if (typeof window[callbackFn] === 'function') {
            window[callbackFn](value);
          }
        } else if (typeof callbackFn === 'function') {
          callbackFn(value);
        }
      }
    }

    getResponse() {
      return this.state.status === 'success' ? this.state.token : null;
    }

    reset() {
      this.state = {
        status: 'idle',
        token: null,
        challenge: null,
        expiresAt: null,
      };
      
      this.elements.label.style.display = 'block';
      this.elements.checkmark.style.display = 'none';
      this.elements.warningIcon.style.display = 'none';
      this.elements.blockedIcon.style.display = 'none';
      this.elements.loader.style.display = 'none';
      this.elements.success.style.display = 'none';
      this.elements.error.style.display = 'none';
      this.elements.blocked.style.display = 'none';
      this.elements.checkbox.style.borderColor = '#9ca3af';
      this.elements.checkbox.style.background = 'white';
      this.elements.checkbox.style.cursor = 'pointer';
    }
  }

  // Global ProofCaptcha API object (similar to grecaptcha)
  window.ProofCaptcha = {
    /**
     * Render a widget
     * @param {string|HTMLElement} container - Element or element ID
     * @param {object} parameters - Widget configuration
     * @returns {number} Widget ID
     */
    render: function(container, parameters) {
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

    /**
     * Reset a widget
     * @param {number} widgetId - Optional widget ID (resets first widget if not specified)
     */
    reset: function(widgetId) {
      if (widgetId === undefined) {
        // Reset first widget
        const firstWidget = widgets.values().next().value;
        if (firstWidget) firstWidget.reset();
      } else {
        const widget = widgets.get(widgetId);
        if (widget) widget.reset();
      }
    },

    /**
     * Get response token from a widget
     * @param {number} widgetId - Optional widget ID
     * @returns {string|null} Response token
     */
    getResponse: function(widgetId) {
      if (widgetId === undefined) {
        const firstWidget = widgets.values().next().value;
        return firstWidget ? firstWidget.getResponse() : null;
      } else {
        const widget = widgets.get(widgetId);
        return widget ? widget.getResponse() : null;
      }
    },

    /**
     * Execute callback when API is ready
     * @param {function} callback - Callback function
     */
    ready: function(callback) {
      if (typeof callback === 'function') {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', callback);
        } else {
          callback();
        }
      }
    },
  };

  // Auto-render widgets with class 'proof-captcha'
  function autoRenderWidgets() {
    const elements = document.querySelectorAll(`.${WIDGET_CLASS}`);
    elements.forEach((element) => {
      if (!element.dataset.widgetId) {
        const widgetId = ProofCaptcha.render(element);
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
          if (node.nodeType === 1) { // Element node
            if (node.classList && node.classList.contains(WIDGET_CLASS)) {
              if (!node.dataset.widgetId) {
                const widgetId = ProofCaptcha.render(node);
                node.dataset.widgetId = widgetId;
              }
            }
            // Check children
            const children = node.querySelectorAll && node.querySelectorAll(`.${WIDGET_CLASS}`);
            if (children) {
              children.forEach((child) => {
                if (!child.dataset.widgetId) {
                  const widgetId = ProofCaptcha.render(child);
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
