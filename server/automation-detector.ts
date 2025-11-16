import type { Request } from "express";

export interface AutomationCheckResult {
  isAutomation: boolean;
  detectedBy: string[];
  score: number;
}

export function detectAutomation(req: Request): AutomationCheckResult {
  const detectedBy: string[] = [];
  let score = 0;

  const userAgent = (req.headers["user-agent"] || "").toLowerCase();
  const headers = req.headers;

  // Check for headless browsers
  if (
    userAgent.includes("headless") ||
    userAgent.includes("phantomjs") ||
    userAgent.includes("selenium") ||
    userAgent.includes("webdriver") ||
    userAgent.includes("chromedriver") ||
    userAgent.includes("geckodriver")
  ) {
    detectedBy.push("headless-user-agent");
    score += 50;
  }

  // Check for automation frameworks
  if (
    userAgent.includes("puppeteer") ||
    userAgent.includes("playwright") ||
    userAgent.includes("cypress") ||
    userAgent.includes("nightwatch")
  ) {
    detectedBy.push("automation-framework");
    score += 50;
  }

  // Check for suspicious headers (low confidence - just log)
  if (headers["x-requested-with"] === "XMLHttpRequest" && !headers["referer"]) {
    detectedBy.push("suspicious-ajax");
    score += 5; // Reduced from 10
  }

  // Check for missing common headers (low confidence - just log)
  if (!headers["accept-language"]) {
    detectedBy.push("missing-accept-language");
    score += 5; // Reduced from 15
  }

  if (!headers["accept-encoding"]) {
    detectedBy.push("missing-accept-encoding");
    score += 5; // Reduced from 15
  }

  // Check for automation-specific headers
  if (headers["chrome-lighthouse"]) {
    detectedBy.push("lighthouse");
    score += 30;
  }

  // Check for webdriver headers
  const automationHeaders = [
    "x-devtools-emulate-network-conditions-client-id",
    "sec-ch-ua-platform-version",
  ];

  for (const header of automationHeaders) {
    if (headers[header]) {
      detectedBy.push(`automation-header-${header}`);
      score += 20;
    }
  }

  // Check for bot patterns in user agent
  const botPatterns = [
    "bot",
    "crawler",
    "spider",
    "scraper",
    "curl",
    "wget",
    "python-requests",
    "httpie",
    "postman",
  ];

  for (const pattern of botPatterns) {
    if (userAgent.includes(pattern)) {
      detectedBy.push(`bot-pattern-${pattern}`);
      score += 40;
    }
  }

  // Check for Chrome DevTools Protocol
  if (headers["connection"] === "Upgrade" && headers["upgrade"] === "websocket") {
    const origin = headers["origin"] as string;
    if (origin && origin.includes("devtools")) {
      detectedBy.push("devtools-websocket");
      score += 30;
    }
  }

  return {
    isAutomation: score >= 50, // Increased threshold from 40 to 50
    detectedBy,
    score,
  };
}

export function getClientDetectionScript(): string {
  return `
    (function() {
      const detections = [];
      
      // Check for webdriver
      if (navigator.webdriver) {
        detections.push('webdriver');
      }
      
      // Check for automation properties
      if (window.navigator.plugins.length === 0) {
        detections.push('no-plugins');
      }
      
      // Check for headless Chrome
      if (window.chrome && !window.chrome.runtime) {
        detections.push('headless-chrome');
      }
      
      // Check for automation flags
      if (window.document.documentElement.getAttribute('webdriver')) {
        detections.push('webdriver-attribute');
      }
      
      // Check for missing window properties
      if (!window.localStorage || !window.sessionStorage) {
        detections.push('missing-storage');
      }
      
      // Check for permissions API
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({name: 'notifications'}).then(function(result) {
          if (result.state === 'denied' && Notification.permission === 'default') {
            detections.push('permission-mismatch');
          }
        });
      }
      
      // Check for languages mismatch
      if (navigator.languages && navigator.languages.length === 0) {
        detections.push('no-languages');
      }
      
      // Check for automation variables
      const automationVars = [
        '__webdriver_evaluate',
        '__selenium_evaluate',
        '__webdriver_script_function',
        '__webdriver_script_func',
        '__webdriver_script_fn',
        '__fxdriver_evaluate',
        '__driver_unwrapped',
        '__webdriver_unwrapped',
        '__driver_evaluate',
        '__selenium_unwrapped',
        '__fxdriver_unwrapped',
        '_Selenium_IDE_Recorder',
        '_selenium',
        'calledSelenium',
        '_WEBDRIVER_ELEM_CACHE',
        'ChromeDriverw',
        'driver-evaluate',
        'webdriver-evaluate',
        'selenium-evaluate',
        'webdriverCommand',
        'webdriver-evaluate-response',
        '__webdriverFunc',
        '__webdriver_script_fn',
        '__$webdriverAsyncExecutor',
        'domAutomation',
        'domAutomationController',
        '__nightmare',
        '_phantom',
        'callPhantom',
        '__phantomas'
      ];
      
      for (const v of automationVars) {
        if (window[v] || document[v]) {
          detections.push('automation-var-' + v);
        }
      }
      
      return detections;
    })();
  `;
}
