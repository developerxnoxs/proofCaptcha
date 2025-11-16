// ALTCHA-style Proof-of-Work solver for CAPTCHA
// Finds the secret number that when hashed with salt equals challengeHash
export async function solveProofOfWork(
  challenge: {
    pow?: {
      salt: string;
      challengeHash: string;
      maxNumber: number;
      signature: string;
    };
    salt?: string;
    challengeHash?: string;
    maxNumber?: number;
    signature?: string;
    difficulty?: number;
    timestamp?: number;
  },
  onProgress?: (hash: string, attempts: number) => void
): Promise<number> {
  // Extract PoW fields from nested pow object or top-level (for backwards compatibility)
  const pow = challenge.pow || challenge;
  const { salt, challengeHash, maxNumber } = pow;
  
  // Validate required fields
  if (!salt || !challengeHash || !maxNumber) {
    throw new Error(`Missing PoW fields: salt=${!!salt}, challengeHash=${!!challengeHash}, maxNumber=${!!maxNumber}`);
  }
  
  return new Promise((resolve, reject) => {
    const worker = async () => {
      // Randomize search order to prevent timing attacks
      const searchOrder: number[] = [];
      for (let i = 0; i <= maxNumber; i++) {
        searchOrder.push(i);
      }
      
      // Fisher-Yates shuffle
      for (let i = searchOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [searchOrder[i], searchOrder[j]] = [searchOrder[j], searchOrder[i]];
      }

      for (let attempts = 0; attempts <= maxNumber; attempts++) {
        const candidate = searchOrder[attempts];
        
        // Calculate SHA256(salt + candidate)
        const encoder = new TextEncoder();
        const data = salt + candidate.toString();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

        if (onProgress && attempts % 100 === 0) {
          onProgress(hashHex, attempts);
        }

        // Check if this candidate's hash matches the challenge hash
        if (hashHex === challengeHash) {
          resolve(candidate);
          return;
        }
      }

      reject(new Error("Solution not found in search space"));
    };

    // Execute worker and handle any errors
    worker().catch(reject);
  });
}
