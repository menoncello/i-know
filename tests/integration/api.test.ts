import { test, expect, beforeAll, afterAll, describe } from 'bun:test';

// Test file for integration testing with Bun runtime

// Create a timeout helper that's more compatible
const createTimeoutSignal = (timeoutMs: number) => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
};

let apiProcess: any;
const API_BASE_URL = 'http://localhost';
const TEST_PORT = 3002; // Use different port for tests

// Helper function to wait for server to be ready
async function waitForServer(url: string, maxAttempts = 30, delay = 500): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(url, { signal: createTimeoutSignal(1000) });
      if (response.ok) {
        return;
      }
    } catch (error) {
      // Server not ready yet, try again
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error(`Server not ready at ${url} after ${maxAttempts} attempts`);
}

beforeAll(async () => {
  // Set test environment variables
  const testEnv = {
    ...process.env,
    NODE_ENV: 'test',
    PORT: TEST_PORT.toString(),
    DB_HOST: ':memory:', // Use SQLite for tests
    DB_TYPE: 'sqlite',
  };

  // Start API server in background for testing
  apiProcess = Bun.spawn(['bun', 'apps/api/src/index.ts'], {
    env: testEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });

  try {
    // Wait for server to be ready
    await waitForServer(`${API_BASE_URL}:${TEST_PORT}/api/v1/health`);
    console.log('✅ Test server is ready');
  } catch (error) {
    console.error('❌ Test server failed to start:', error);
    throw error;
  }
});

afterAll(async () => {
  // Cleanup server process
  if (apiProcess) {
    console.log('🛑 Shutting down test server...');
    apiProcess.kill();
    // Give it time to shutdown gracefully
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
});

describe('API Integration Tests', () => {
  const API_URL = `${API_BASE_URL}:${TEST_PORT}`;

  test('API health endpoint', async () => {
    const response = await fetch(`${API_URL}/api/v1/health`);
    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('status');
    expect(data.data).toHaveProperty('service');
    expect(data.data).toHaveProperty('timestamp');
    expect(data.data.service).toBe('i-know-api');
  });

  test('API actors endpoint', async () => {
    const response = await fetch(`${API_URL}/api/v1/actors`);
    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('actors');
    expect(data.data).toHaveProperty('total');
    expect(data.data).toHaveProperty('page');
    expect(data.data).toHaveProperty('limit');
    expect(Array.isArray(data.data.actors)).toBe(true);
    expect(typeof data.data.total).toBe('number');
    expect(typeof data.data.page).toBe('number');
    expect(typeof data.data.limit).toBe('number');
  });

  test('API root endpoint', async () => {
    const response = await fetch(`${API_URL}/`);
    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('message');
    expect(data.data).toHaveProperty('version');
    expect(data.data).toHaveProperty('documentation');
    expect(data.data).toHaveProperty('health');
  });

  test('API status endpoint', async () => {
    const response = await fetch(`${API_URL}/api/v1/status`);
    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('service');
    expect(data.data).toHaveProperty('version');
    expect(data.data).toHaveProperty('environment');
    expect(data.data).toHaveProperty('uptime');
    expect(data.data).toHaveProperty('timestamp');
    expect(data.data.service).toBe('i-know-api');
    expect(data.data.environment).toBe('test');
  });
});
