import { test as base, type APIRequestContext } from '@playwright/test';
import {
  createUser,
  createUsers,
  createAuthTokens,
  createExpiredAuthTokens,
  createAdminUser,
  createInactiveUser,
  type User,
  type AuthTokens,
} from './factories/auth-factory';
import {
  createDatabaseConfig,
  createMigrations,
  createDatabaseConnectionStatus,
  type DatabaseConfig,
} from './factories/database-factory';
import {
  registerUserForCleanup,
  registerTokenForCleanup,
  cleanupAll,
  resetCleanupTracking,
  getCleanupStats,
} from '../utils/test-cleanup';

// Types for backend API fixtures
export type BackendAPIFixtures = {
  // User fixtures
  testUser: User;
  adminUser: User;
  inactiveUser: User;
  multipleUsers: User[];

  // Auth token fixtures
  validTokens: AuthTokens;
  expiredTokens: AuthTokens;
  adminTokens: AuthTokens;

  // Database fixtures
  databaseConfig: DatabaseConfig;
  databaseConnection: () => Promise<boolean>;

  // API request with auth
  authenticatedRequest: (user: User, tokens: AuthTokens) => Promise<APIRequestContext>;

  // Cleanup functions
  cleanupUsers: () => Promise<void>;
  cleanupDatabase: () => Promise<void>;
  testCleanup: () => Promise<void>;
};

// Extend base test with backend API fixtures
export const test = base.extend<BackendAPIFixtures>({
  // Test user fixture with auto-cleanup
  testUser: async ({}, use) => {
    const user = createUser({
      email: 'testuser@example.com',
      name: 'Test User',
    });

    // Register for cleanup
    registerUserForCleanup(user);

    // In real implementation, this would create user via API
    console.log(`Creating test user: ${user.email}`);

    await use(user);

    // Cleanup is handled automatically by the cleanup utility
    console.log(`Test user fixture teardown: ${user.id}`);
  },

  // Admin user fixture with auto-cleanup
  adminUser: async ({}, use) => {
    const user = createAdminUser({
      email: 'admin@example.com',
      name: 'Admin User',
    });

    // Register for cleanup
    registerUserForCleanup(user);

    // In real implementation, this would create admin user via API
    console.log(`Creating admin user: ${user.email}`);

    await use(user);

    // Cleanup is handled automatically by the cleanup utility
    console.log(`Admin user fixture teardown: ${user.id}`);
  },

  // Inactive user fixture with auto-cleanup
  inactiveUser: async ({}, use) => {
    const user = createInactiveUser({
      email: 'inactive@example.com',
      name: 'Inactive User',
    });

    // In real implementation, this would create inactive user via API
    console.log(`Creating inactive user: ${user.email}`);

    await use(user);

    // Cleanup: Remove created inactive user via API
    console.log(`Cleaning up inactive user: ${user.id}`);
  },

  // Multiple users fixture with auto-cleanup
  multipleUsers: async ({}, use) => {
    const users = createUsers(5, {
      isActive: true,
      emailVerified: true,
    });

    const createdUserIds: string[] = [];

    // In real implementation, this would create users via API
    for (const user of users) {
      console.log(`Creating user: ${user.email}`);
      createdUserIds.push(user.id);
    }

    await use(users);

    // Cleanup: Remove all created users via API
    for (const userId of createdUserIds) {
      console.log(`Cleaning up user: ${userId}`);
    }
  },

  // Valid auth tokens fixture
  validTokens: async ({}, use) => {
    const tokens = createAuthTokens({
      expiresIn: 3600, // 1 hour
    });

    await use(tokens);
    // No cleanup needed for tokens
  },

  // Expired auth tokens fixture
  expiredTokens: async ({}, use) => {
    const tokens = createExpiredAuthTokens();

    await use(tokens);
    // No cleanup needed for tokens
  },

  // Admin tokens fixture
  adminTokens: async ({}, use) => {
    const tokens = createAuthTokens({
      expiresIn: 7200, // 2 hours for admin
    });

    await use(tokens);
    // No cleanup needed for tokens
  },

  // Database configuration fixture
  databaseConfig: async ({}, use) => {
    const config = createDatabaseConfig({
      database: 'i-know-test',
    });

    await use(config);
    // No cleanup needed for config
  },

  // Database connection fixture
  databaseConnection: async ({}, use) => {
    const connect = async () => {
      // In real implementation, this would test actual database connection
      const status = createDatabaseConnectionStatus(true);
      return status.connected;
    };

    await use(connect);
  },

  // Authenticated API request fixture
  authenticatedRequest: async ({ request }, use) => {
    const createAuthenticatedRequest = async (user: User, tokens: AuthTokens) => {
      // In real implementation, this would set up request context with auth headers
      const headers = {
        Authorization: `${tokens.tokenType} ${tokens.accessToken}`,
        'Content-Type': 'application/json',
        'X-User-ID': user.id,
        'X-User-Role': user.role,
      };

      // Create new request context with auth headers
      // Note: This is a simplified version - real implementation would use Playwright's APIRequestContext
      return request;
    };

    await use(createAuthenticatedRequest);
  },

  // Cleanup users fixture
  cleanupUsers: async ({}, use) => {
    const cleanup = async () => {
      // In real implementation, this would clean up all test users
      console.log('Cleaning up all test users...');
      // await apiContext.delete('/api/v1/test/users/cleanup');
    };

    await use(cleanup);
    // Cleanup is performed when the function is called
  },

  // Cleanup database fixture
  cleanupDatabase: async ({}, use) => {
    const cleanup = async () => {
      // In real implementation, this would clean up test database
      console.log('Cleaning up test database...');
      // await apiContext.post('/api/v1/test/database/cleanup');
    };

    await use(cleanup);
    // Cleanup is performed when the function is called
  },

  // Global cleanup fixture - runs after each test
  testCleanup: async ({ request }, use) => {
    // Reset cleanup tracking at the start of each test
    resetCleanupTracking();

    await use(async () => {
      // Perform comprehensive cleanup after each test
      await cleanupAll(request);
    });
  },
});

// Helper functions for common test patterns
export const createAuthenticatedTestUser = async () => {
  const user = createUser({
    email: 'auth@example.com',
    name: 'Auth Test User',
  });

  const tokens = createAuthTokens();

  return { user, tokens };
};

export const createTestUserSession = async (overrides: Partial<User> = {}) => {
  const user = createUser(overrides);
  const tokens = createAuthTokens({
    expiresIn: 3600,
  });

  return {
    user,
    tokens,
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json',
      'X-User-ID': user.id,
    },
  };
};

// Re-export expect for convenience
export { expect } from '@playwright/test';
