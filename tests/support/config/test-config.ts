/**
 * Test Configuration
 * Centralized configuration for test environment settings
 */

export const TEST_CONFIG = {
  // API Configuration
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  API_VERSION: 'v1',

  // Test Configuration
  TEST_TIMEOUT: 30000, // 30 seconds
  CLEANUP_TIMEOUT: 10000, // 10 seconds for cleanup operations

  // Rate Limiting Test Configuration
  RATE_LIMIT_THRESHOLD: 5, // requests per minute
  RATE_LIMIT_TEST_COUNT: 10, // total requests to send

  // User Test Data
  DEFAULT_USER_PASSWORD: 'SecurePass123!',
  ADMIN_EMAIL: 'admin@example.com',

  // Database Configuration
  TEST_DATABASE: 'i-know-test',

  // Cleanup Configuration
  ENABLE_CLEANUP: process.env.ENABLE_TEST_CLEANUP !== 'false',
  CLEANUP_BATCH_SIZE: 50, // max records to delete at once
} as const;

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = TEST_CONFIG.API_BASE_URL.replace(/\/$/, ''); // Remove trailing slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}/api/${TEST_CONFIG.API_VERSION}${cleanEndpoint}`;
};

// Helper function to build health check URLs
export const buildHealthUrl = (endpoint: string): string => {
  const baseUrl = TEST_CONFIG.API_BASE_URL.replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};
