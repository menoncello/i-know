import { test, expect } from '@playwright/test';

test.describe('Performance Monitoring - AC 6', () => {
  const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

  test('should maintain sub-500ms response times for all endpoints', async ({ request }) => {
    const endpoints = [
      { path: '/api/imdb/actor/nm0000138', description: 'Actor lookup' },
      { path: '/api/imdb/content/tt0111161', description: 'Content lookup' },
      { path: '/api/imdb/search?query=Tom&limit=10', description: 'Search query' },
    ];

    for (const endpoint of endpoints) {
      // GIVEN: API endpoint
      const startTime = Date.now();

      // WHEN: Making request
      const response = await request.get(`${BASE_URL}${endpoint.path}`);

      // THEN: Should respond within 500ms
      const endTime = Date.now();
      const actualResponseTime = endTime - startTime;

      expect(response.status()).toBe(200);
      expect(actualResponseTime).toBeLessThan(500);

      // Response header should also include timing
      const responseTimeHeader = response.headers()['x-response-time'];
      expect(responseTimeHeader).toBeDefined();
      const headerResponseTime = parseFloat(responseTimeHeader ?? '0');
      expect(headerResponseTime).toBeLessThan(500);
    }
  });

  test('should provide performance metrics in response headers', async ({ request }) => {
    // GIVEN: API request
    const response = await request.get(`${BASE_URL}/api/imdb/actor/nm0000138`);
    expect(response.status()).toBe(200);

    // WHEN: Checking performance headers
    const headers = response.headers();

    // THEN: Should include comprehensive metrics
    expect(headers['x-response-time']).toBeDefined();
    expect(headers['x-cache-status']).toBeDefined();
    expect(headers['x-data-quality-score']).toBeDefined();
    expect(headers['x-imdb-request-time']).toBeDefined();
    expect(headers['x-processing-time']).toBeDefined();

    // Metrics should be valid numbers
    expect(parseFloat(headers['x-response-time'] ?? '0')).toBeGreaterThanOrEqual(0);
    expect(parseFloat(headers['x-imdb-request-time'] ?? '0')).toBeGreaterThanOrEqual(0);
    expect(parseFloat(headers['x-processing-time'] ?? '0')).toBeGreaterThanOrEqual(0);
  });
});
