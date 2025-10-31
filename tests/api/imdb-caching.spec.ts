import { test, expect } from '@playwright/test';

test.describe('Data Caching Layer - AC 2', () => {
  const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

  test('should cache frequent searches for improved performance', async ({ request }) => {
    const searchQuery = 'Tom Hanks';

    // First search - should be slower (cache miss)
    const firstSearchStart = Date.now();
    const firstResponse = await request.get(
      `${BASE_URL}/api/v1/imdb/actors/search?q=${encodeURIComponent(searchQuery)}`,
    );
    const firstSearchTime = Date.now() - firstSearchStart;

    expect(firstResponse.status()).toBe(200);

    // Second search - should be faster (cache hit)
    const secondSearchStart = Date.now();
    const secondResponse = await request.get(
      `${BASE_URL}/api/v1/imdb/actors/search?q=${encodeURIComponent(searchQuery)}`,
    );
    const secondSearchTime = Date.now() - secondSearchStart;

    expect(secondResponse.status()).toBe(200);

    // Second search should be faster (cached)
    expect(secondSearchTime).toBeLessThanOrEqual(firstSearchTime);

    const firstData = await firstResponse.json();
    const secondData = await secondResponse.json();

    // Results should be identical
    expect(JSON.stringify(firstData.data)).toBe(JSON.stringify(secondData.data));
  });

  test('should provide cache statistics and management', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/imdb/cache/stats`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.cache).toBeDefined();
    expect(data.data.cache.hitRate).toBeDefined();
    expect(data.data.cache.totalEntries).toBeDefined();
    expect(data.data.cache.size).toBeDefined();
  });

  test('should support cache clearing functionality', async ({ request }) => {
    // First search to populate cache
    await request.get(`${BASE_URL}/api/v1/imdb/actors/search?q=test`);

    // Clear cache
    const clearResponse = await request.delete(`${BASE_URL}/api/v1/imdb/cache`);

    expect(clearResponse.status()).toBe(200);

    const clearData = await clearResponse.json();
    expect(clearData.success).toBe(true);
    expect(clearData.data.deletedEntries).toBeDefined();
    expect(typeof clearData.data.deletedEntries).toBe('number');
  });
});
