/**
 * ALTCHA Worker - Parallel hash computation with exact matching
 * Uses ALTCHA algorithm: finds number N where SHA256(salt + N) = challengeHash
 * Much faster than traditional POW prefix searching
 */

/**
 * Convert hash buffer to hex string (optimized)
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
 * Worker message handler for ALTCHA challenge solving
 */
self.onmessage = async function(e) {
  const { type, data } = e.data;
  
  if (type === 'solve') {
    // ALTCHA approach: find number where SHA256(salt + number) === challengeHash
    const { salt, challengeHash, startNumber, batchSize } = data;
    const textEncoder = new TextEncoder();
    let lastReportedAttempt = 0;
    
    for (let i = 0; i < batchSize; i++) {
      const number = startNumber + i;
      // ALTCHA: hash(salt + number) - looking for exact match
      const hashData = salt + number.toString();
      const msgBuffer = textEncoder.encode(hashData);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hash = bufferToHex(hashBuffer);
      
      // Report progress periodically (incremental count)
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
      
      // Check if solution found - ALTCHA uses exact hash match
      if (hash === challengeHash) {
        const incrementalAttempts = (i + 1) - lastReportedAttempt;
        self.postMessage({
          type: 'found',
          data: {
            solution: number,  // Return the number, not base36 string
            attempts: incrementalAttempts,
            hash: hash
          }
        });
        return;
      }
    }
    
    // Batch completed without finding solution (report remaining attempts)
    const incrementalAttempts = batchSize - lastReportedAttempt;
    self.postMessage({
      type: 'complete',
      data: {
        attempts: incrementalAttempts
      }
    });
  }
};
