export function detectClientAutomation(): string[] {
  const detections: string[] = [];
  
  try {
    // Check for webdriver - HIGH CONFIDENCE
    if (navigator.webdriver === true) {
      detections.push('webdriver');
    }
    
    // Check for automation flags - HIGH CONFIDENCE
    if (document.documentElement.getAttribute('webdriver')) {
      detections.push('webdriver-attribute');
    }
    
    // Check for missing critical window properties - HIGH CONFIDENCE
    if (!window.localStorage || !window.sessionStorage) {
      detections.push('missing-storage');
    }
    
    // Check for languages mismatch - MEDIUM CONFIDENCE
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
    
    for (const varName of automationVars) {
      if ((window as any)[varName] || (document as any)[varName]) {
        detections.push(`automation-var-${varName}`);
      }
    }
    
    // Check for Puppeteer-specific properties
    if ((window as any)._phantom || (window as any).callPhantom) {
      detections.push('phantom');
    }
    
    // Check for CDP (Chrome DevTools Protocol)
    if ((window as any).__playwright || (window as any).__pw_manual) {
      detections.push('playwright');
    }
    
    // Check for inconsistencies in navigator
    if (navigator.platform === '') {
      detections.push('empty-platform');
    }
    
    // Check for touch support inconsistency
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!hasTouch && navigator.userAgent.includes('Mobile')) {
      detections.push('touch-mismatch');
    }
    
  } catch (error) {
    console.error('Error detecting automation:', error);
  }
  
  return detections;
}
