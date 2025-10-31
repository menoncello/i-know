/**
 * Test Data Cleanup Utilities
 * Provides cleanup functionality for test data to prevent state pollution
 */

import { TEST_CONFIG } from '../config/test-config';
import type { User } from '../fixtures/factories/auth-factory';

// Track created resources during test execution
const createdUsers = new Set<string>();
const createdTokens = new Set<string>();
const cleanupTasks: Array<() => Promise<void>> = [];

/**
 * Register a user for cleanup
 */
export const registerUserForCleanup = (user: User): void => {
  createdUsers.add(user.id);
};

/**
 * Register a token for cleanup
 */
export const registerTokenForCleanup = (token: string): void => {
  createdTokens.add(token);
};

/**
 * Register a cleanup task
 */
export const registerCleanupTask = (task: () => Promise<void>): void => {
  cleanupTasks.push(task);
};

/**
 * Clean up all registered users
 */
export const cleanupUsers = async (request: any): Promise<void> => {
  if (!TEST_CONFIG.ENABLE_CLEANUP) {
    console.log('Cleanup disabled - skipping user cleanup');
    return;
  }

  const batchSize = TEST_CONFIG.CLEANUP_BATCH_SIZE;
  const users = Array.from(createdUsers);

  console.log(`Cleaning up ${users.length} users...`);

  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);

    await Promise.allSettled(
      batch.map(async userId => {
        try {
          // Attempt to delete user via API (will fail until implemented)
          const response = await request.delete(`/api/v1/users/${userId}`);
          if (response.status() === 200 || response.status() === 404) {
            console.log(`✅ Cleaned up user: ${userId}`);
          } else {
            console.log(`⚠️ Could not clean up user ${userId}: ${response.status()}`);
          }
        } catch (error) {
          console.log(`❌ Failed to clean up user ${userId}:`, error);
        }
      }),
    );
  }

  createdUsers.clear();
};

/**
 * Clean up all registered tokens
 */
export const cleanupTokens = async (request: any): Promise<void> => {
  if (!TEST_CONFIG.ENABLE_CLEANUP) {
    console.log('Cleanup disabled - skipping token cleanup');
    return;
  }

  console.log(`Cleaning up ${createdTokens.size} tokens...`);

  for (const token of createdTokens) {
    try {
      // Attempt to revoke token via API (will fail until implemented)
      const response = await request.post('/api/v1/auth/revoke', {
        data: { token },
      });

      if (response.status() === 200 || response.status() === 404) {
        console.log(`✅ Cleaned up token: ${token.substring(0, 10)}...`);
      }
    } catch (error) {
      console.log('❌ Failed to clean up token:', error);
    }
  }

  createdTokens.clear();
};

/**
 * Execute all registered cleanup tasks
 */
export const executeCleanupTasks = async (): Promise<void> => {
  if (!TEST_CONFIG.ENABLE_CLEANUP) {
    console.log('Cleanup disabled - skipping cleanup tasks');
    return;
  }

  console.log(`Executing ${cleanupTasks.length} cleanup tasks...`);

  for (const task of cleanupTasks) {
    try {
      await task();
    } catch (error) {
      console.log('❌ Cleanup task failed:', error);
    }
  }

  cleanupTasks.length = 0; // Clear the array
};

/**
 * Comprehensive cleanup - runs all cleanup operations
 */
export const cleanupAll = async (request: any): Promise<void> => {
  console.log('🧹 Starting comprehensive test cleanup...');

  const startTime = Date.now();

  try {
    // Execute custom cleanup tasks first
    await executeCleanupTasks();

    // Clean up tokens
    await cleanupTokens(request);

    // Clean up users
    await cleanupUsers(request);

    const duration = Date.now() - startTime;
    console.log(`✅ Comprehensive cleanup completed in ${duration}ms`);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ Cleanup failed after ${duration}ms:`, error);
  }
};

/**
 * Get cleanup statistics
 */
export const getCleanupStats = () => ({
  usersCount: createdUsers.size,
  tokensCount: createdTokens.size,
  tasksCount: cleanupTasks.length,
  cleanupEnabled: TEST_CONFIG.ENABLE_CLEANUP,
});

/**
 * Reset all cleanup tracking (useful for test isolation)
 */
export const resetCleanupTracking = (): void => {
  createdUsers.clear();
  createdTokens.clear();
  cleanupTasks.length = 0;
  console.log('🔄 Cleanup tracking reset');
};
