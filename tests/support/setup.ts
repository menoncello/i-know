/**
 * Test Setup Configuration
 * Configures global test settings and fixtures
 */

import { chromium, type FullConfig } from '@playwright/test';
import { expect } from '@playwright/test';
import { TEST_CONFIG } from './config/test-config';

// Configure test timeout
export const testTimeout = TEST_CONFIG.TEST_TIMEOUT;

// Global test configuration
export const testConfig = {
  // Test timeout in milliseconds
  timeout: TEST_CONFIG.TEST_TIMEOUT,

  // Retry failed tests (for flaky test detection)
  retries: process.env.CI ? 1 : 0,

  // Use test isolation
  fullyParallel: true,

  // Global test timeout
  globalTimeout: 10 * 60 * 1000, // 10 minutes

  // Workers for parallel execution
  workers: process.env.CI ? 2 : undefined,
};

// Custom matchers for better assertions
expect.extend({
  // Add custom matchers if needed
});

// Global setup for test environment
export const setupTestEnvironment = async () => {
  console.log('🚀 Setting up test environment...');
  console.log(`API Base URL: ${TEST_CONFIG.API_BASE_URL}`);
  console.log(`Cleanup Enabled: ${TEST_CONFIG.ENABLE_CLEANUP}`);
  console.log(`Test Timeout: ${TEST_CONFIG.TEST_TIMEOUT}ms`);
};

// Global teardown for test environment
export const teardownTestEnvironment = async () => {
  console.log('🏁 Tearing down test environment...');
};

// Global setup for Playwright tests
async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...');

  const baseURL = config.webServer?.url || process.env.BASE_URL || 'http://localhost:4321';

  // Check if server is already running
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log(`🔍 Checking if server is running at ${baseURL}...`);
    const response = await page.goto(baseURL, { timeout: 5000 });

    if (response && response.status() === 200) {
      console.log('✅ Server is already running');
    } else {
      console.log('⚠️ Server is not running or not accessible');
      console.log('ℹ️ To run tests that require a server, start the web application first:');
      console.log('   bun run dev:web');
    }
  } catch (error) {
    console.log('⚠️ Server is not running or not accessible');
    console.log('ℹ️ To run tests that require a server, start the web application first:');
    console.log('   bun run dev:web');
  } finally {
    await browser.close();
  }

  console.log('✅ E2E test setup complete');
}

export default globalSetup;

// Export commonly used test utilities
export * from './config/test-config';
export * from './utils/test-cleanup';
