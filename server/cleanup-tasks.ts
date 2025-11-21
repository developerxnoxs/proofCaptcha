/**
 * Automated Cleanup Tasks
 * 
 * Periodic cleanup untuk expired challenges dan old security events
 */

import { storage } from './storage';
import { cleanupExpiredChallenges, DEFAULT_EXPIRATION_CONFIG } from './enhancements/token-expiration';

/**
 * Cleanup expired challenges dari database
 */
async function cleanupChallenges() {
  try {
    console.log('[CLEANUP] Starting expired challenges cleanup...');
    
    const deletedCount = await cleanupExpiredChallenges(
      async () => {
        const challenges = await storage.getAllChallenges();
        return challenges.map(c => ({
          id: c.id,
          createdAt: c.createdAt,
        }));
      },
      async (id: string) => {
        await storage.deleteChallenge(id);
      },
      DEFAULT_EXPIRATION_CONFIG
    );
    
    if (deletedCount > 0) {
      console.log(`[CLEANUP] Deleted ${deletedCount} expired challenges`);
    } else {
      console.log('[CLEANUP] No expired challenges to delete');
    }
  } catch (error) {
    console.error('[CLEANUP] Error during challenge cleanup:', error);
  }
}

/**
 * Start all periodic cleanup tasks
 */
export function startCleanupTasks() {
  console.log('[CLEANUP] Starting automated cleanup tasks...');
  
  // Cleanup expired challenges setiap 1 jam
  const cleanupInterval = 60 * 60 * 1000; // 1 hour
  setInterval(cleanupChallenges, cleanupInterval);
  
  // Run cleanup immediately on start
  setTimeout(cleanupChallenges, 5000); // After 5 seconds
  
  console.log('[CLEANUP] Automated cleanup tasks configured:');
  console.log(`  - Challenge cleanup: every ${cleanupInterval / 1000 / 60} minutes`);
}
