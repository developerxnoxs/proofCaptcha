(function() {
  'use strict';

  const API_BASE = window.location.origin;
  let widgetCounter = 0;
  const widgets = new Map();

  class ProofCaptcha {
    constructor(containerId, options = {}) {
      this.id = widgetCounter++;
      this.containerId = containerId;
      this.sitekey = options.sitekey || options['data-sitekey'];
      this.callback = options.callback || options['data-callback'];
      this.expiredCallback = options['expired-callback'] || options['data-expired-callback'];
      this.errorCallback = options['error-callback'] || options['data-error-callback'];
      this.theme = options.theme || options['data-theme'] || 'light';
      this.size = options.size || options['data-size'] || 'normal';
      
      this.token = null;
      this.challengeData = null;
      this.isVerified = false;
      this.startTime = null;
      
      if (!this.sitekey) {
        console.error('ProofCaptcha: sitekey is required');
        return;
      }
      
      this.render();
    }

    async render() {
      const container = typeof this.containerId === 'string' 
        ? document.getElementById(this.containerId) 
        : this.containerId;
      
      if (!container) {
        console.error('ProofCaptcha: container not found');
        return;
      }

      container.innerHTML = `
        <div class="proofcaptcha-widget" data-theme="${this.theme}" data-size="${this.size}">
          <div class="proofcaptcha-checkbox">
            <input type="checkbox" id="proofcaptcha-checkbox-${this.id}" class="proofcaptcha-input">
            <label for="proofcaptcha-checkbox-${this.id}" class="proofcaptcha-label">
              <span class="proofcaptcha-checkmark"></span>
              <span class="proofcaptcha-text">I'm not a robot</span>
            </label>
            <div class="proofcaptcha-spinner" style="display: none;"></div>
            <div class="proofcaptcha-success" style="display: none;">✓</div>
          </div>
          <div class="proofcaptcha-logo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>ProofCaptcha</span>
          </div>
        </div>
      `;

      this.addStyles();
      this.attachListeners();
    }

    addStyles() {
      if (document.getElementById('proofcaptcha-styles')) return;
      
      const styles = document.createElement('style');
      styles.id = 'proofcaptcha-styles';
      styles.textContent = `
        .proofcaptcha-widget {
          border: 1px solid #d3d3d3;
          border-radius: 3px;
          background: #f9f9f9;
          padding: 12px;
          width: 304px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .proofcaptcha-widget[data-theme="dark"] {
          background: #1a1a1a;
          border-color: #333;
          color: #fff;
        }
        .proofcaptcha-checkbox {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .proofcaptcha-input {
          display: none;
        }
        .proofcaptcha-label {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          user-select: none;
        }
        .proofcaptcha-checkmark {
          width: 28px;
          height: 28px;
          border: 2px solid #d3d3d3;
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          transition: all 0.2s;
        }
        .proofcaptcha-widget[data-theme="dark"] .proofcaptcha-checkmark {
          background: #2a2a2a;
          border-color: #444;
        }
        .proofcaptcha-text {
          font-size: 14px;
          color: #333;
        }
        .proofcaptcha-widget[data-theme="dark"] .proofcaptcha-text {
          color: #fff;
        }
        .proofcaptcha-spinner {
          width: 20px;
          height: 20px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3498db;
          border-radius: 50%;
          animation: proofcaptcha-spin 1s linear infinite;
        }
        .proofcaptcha-success {
          color: #4caf50;
          font-size: 24px;
          font-weight: bold;
        }
        @keyframes proofcaptcha-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .proofcaptcha-logo {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #666;
        }
        .proofcaptcha-widget[data-theme="dark"] .proofcaptcha-logo {
          color: #999;
        }
        .proofcaptcha-logo svg {
          width: 14px;
          height: 14px;
        }
      `;
      document.head.appendChild(styles);
    }

    attachListeners() {
      const checkbox = document.getElementById(`proofcaptcha-checkbox-${this.id}`);
      const label = checkbox.nextElementSibling;
      
      label.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!this.isVerified && !this.startTime) {
          await this.verify();
        }
      });
    }

    async verify() {
      this.startTime = Date.now();
      this.showLoading();

      try {
        const response = await fetch(`${API_BASE}/api/challenge/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sitekey: this.sitekey,
            type: 'checkbox'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create challenge');
        }

        const data = await response.json();
        this.challengeData = data.challenge;
        
        const solution = await this.solveChallenge(data.challenge);
        
        const verifyResponse = await fetch(`${API_BASE}/api/challenge/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: data.challenge.token,
            solution: solution,
            timeToSolve: Date.now() - this.startTime
          })
        });

        if (!verifyResponse.ok) {
          throw new Error('Verification failed');
        }

        const verifyData = await verifyResponse.json();
        
        if (verifyData.success) {
          this.token = verifyData.verificationToken;
          this.isVerified = true;
          this.showSuccess();
          
          if (this.callback) {
            if (typeof this.callback === 'string') {
              window[this.callback](this.token);
            } else {
              this.callback(this.token);
            }
          }

          setTimeout(() => {
            this.expire();
          }, 120000);
        } else {
          throw new Error('Verification failed');
        }
      } catch (error) {
        console.error('ProofCaptcha error:', error);
        this.showError();
        
        if (this.errorCallback) {
          if (typeof this.errorCallback === 'string') {
            window[this.errorCallback]();
          } else {
            this.errorCallback();
          }
        }
      }
    }

    async solveChallenge(challenge) {
      const { nonce, timestamp, difficulty } = challenge;
      let solution = 0;
      
      while (true) {
        const hash = await this.sha256(nonce + timestamp + solution);
        if (hash.startsWith('0'.repeat(difficulty))) {
          return solution.toString();
        }
        solution++;
        
        if (solution % 1000 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }

    async sha256(message) {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    showLoading() {
      const container = document.querySelector(`[for="proofcaptcha-checkbox-${this.id}"]`).parentElement;
      container.querySelector('.proofcaptcha-checkmark').style.display = 'none';
      container.querySelector('.proofcaptcha-text').style.display = 'none';
      container.querySelector('.proofcaptcha-spinner').style.display = 'block';
    }

    showSuccess() {
      const container = document.querySelector(`[for="proofcaptcha-checkbox-${this.id}"]`).parentElement;
      container.querySelector('.proofcaptcha-spinner').style.display = 'none';
      container.querySelector('.proofcaptcha-success').style.display = 'block';
      container.querySelector('.proofcaptcha-checkmark').style.background = '#4caf50';
      container.querySelector('.proofcaptcha-checkmark').style.borderColor = '#4caf50';
      container.querySelector('.proofcaptcha-text').textContent = 'Verified';
      container.querySelector('.proofcaptcha-text').style.display = 'block';
    }

    showError() {
      const container = document.querySelector(`[for="proofcaptcha-checkbox-${this.id}"]`).parentElement;
      container.querySelector('.proofcaptcha-spinner').style.display = 'none';
      container.querySelector('.proofcaptcha-checkmark').style.display = 'block';
      container.querySelector('.proofcaptcha-text').style.display = 'block';
      container.querySelector('.proofcaptcha-checkmark').style.borderColor = '#f44336';
      this.startTime = null;
    }

    expire() {
      this.token = null;
      this.isVerified = false;
      this.startTime = null;
      this.reset();
      
      if (this.expiredCallback) {
        if (typeof this.expiredCallback === 'string') {
          window[this.expiredCallback]();
        } else {
          this.expiredCallback();
        }
      }
    }

    reset() {
      const container = document.querySelector(`[for="proofcaptcha-checkbox-${this.id}"]`).parentElement;
      container.querySelector('.proofcaptcha-checkmark').style.display = 'block';
      container.querySelector('.proofcaptcha-text').style.display = 'block';
      container.querySelector('.proofcaptcha-spinner').style.display = 'none';
      container.querySelector('.proofcaptcha-success').style.display = 'none';
      container.querySelector('.proofcaptcha-checkmark').style.background = 'white';
      container.querySelector('.proofcaptcha-checkmark').style.borderColor = '#d3d3d3';
      container.querySelector('.proofcaptcha-text').textContent = "I'm not a robot";
    }

    getResponse() {
      return this.token;
    }
  }

  window.proofcaptcha = {
    render: function(container, options) {
      const widget = new ProofCaptcha(container, options);
      widgets.set(widget.id, widget);
      return widget.id;
    },
    reset: function(widgetId) {
      const widget = widgets.get(widgetId);
      if (widget) widget.reset();
    },
    getResponse: function(widgetId) {
      const widget = widgets.get(widgetId);
      return widget ? widget.getResponse() : null;
    }
  };

  function autoRender() {
    const containers = document.querySelectorAll('.proofcaptcha');
    containers.forEach(container => {
      if (container.dataset.rendered) return;
      
      const options = {
        sitekey: container.dataset.sitekey,
        callback: container.dataset.callback,
        'expired-callback': container.dataset.expiredCallback,
        'error-callback': container.dataset.errorCallback,
        theme: container.dataset.theme,
        size: container.dataset.size
      };
      
      new ProofCaptcha(container, options);
      container.dataset.rendered = 'true';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoRender);
  } else {
    autoRender();
  }
})();
