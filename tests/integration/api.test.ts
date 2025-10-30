import { test, expect, beforeAll, afterAll } from 'bun:test';

let apiProcess: any;

beforeAll(async () => {
  // Start API server in background
  apiProcess = Bun.spawn(['bun', 'apps/api/src/index.ts'], {
    env: { ...process.env, NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));
});

afterAll(async () => {
  // Cleanup
  if (apiProcess) {
    process.kill(apiProcess.pid);
  }
});

test('API health endpoint', async () => {
  const response = await fetch('http://localhost:3001/health');
  expect(response.ok).toBe(true);

  const data = await response.json();
  expect(data.status).toBe('ok');
  expect(data.service).toBe('i-know-api');
});

test('API actors endpoint', async () => {
  const response = await fetch('http://localhost:3001/api/v1/actors');
  expect(response.ok).toBe(true);

  const data = await response.json();
  expect(data).toHaveProperty('actors');
  expect(data).toHaveProperty('total');
  expect(data).toHaveProperty('page');
  expect(data).toHaveProperty('limit');
});
