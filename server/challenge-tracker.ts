interface UsedChallenge {
  token: string;
  usedAt: number;
}

const usedChallenges = new Map<string, UsedChallenge>();
const MAX_TRACKED_CHALLENGES = 10000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const CHALLENGE_TTL_MS = 10 * 60 * 1000;

export function markChallengeAsUsed(token: string): void {
  usedChallenges.set(token, {
    token,
    usedAt: Date.now(),
  });

  if (usedChallenges.size > MAX_TRACKED_CHALLENGES) {
    const sortedEntries = Array.from(usedChallenges.entries())
      .sort((a, b) => a[1].usedAt - b[1].usedAt);
    
    const toRemove = sortedEntries.slice(0, MAX_TRACKED_CHALLENGES / 2);
    toRemove.forEach(([key]) => usedChallenges.delete(key));
  }
}

export function isChallengeUsed(token: string): boolean {
  return usedChallenges.has(token);
}

export function cleanupOldChallenges(): void {
  const now = Date.now();
  const toDelete: string[] = [];

  for (const [token, challenge] of Array.from(usedChallenges.entries())) {
    if (now - challenge.usedAt > CHALLENGE_TTL_MS) {
      toDelete.push(token);
    }
  }

  toDelete.forEach(token => usedChallenges.delete(token));
  
  if (toDelete.length > 0) {
    console.log(`Cleaned up ${toDelete.length} expired challenges from memory`);
  }
}

setInterval(cleanupOldChallenges, CLEANUP_INTERVAL_MS);

export function getChallengeStats() {
  return {
    totalTracked: usedChallenges.size,
    oldestChallenge: Math.min(...Array.from(usedChallenges.values()).map(c => c.usedAt)),
    newestChallenge: Math.max(...Array.from(usedChallenges.values()).map(c => c.usedAt)),
  };
}
