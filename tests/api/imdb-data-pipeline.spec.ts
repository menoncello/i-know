import { test, expect } from '@playwright/test';

test.describe('IMDB Data Pipeline - API Tests', () => {
  const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

  test.describe('IMDB Data Access - AC 1', () => {
    test('GET /api/v1/imdb/actors/search should find actors by name with sub-500ms performance', async ({
      request,
    }) => {
      // GIVEN: Search query for actor name
      const searchQuery = 'Tom Hanks';

      // WHEN: Searching for actors
      const startTime = Date.now();
      const response = await request.get(
        `${BASE_URL}/api/v1/imdb/actors/search?q=${encodeURIComponent(searchQuery)}&limit=10`,
      );
      const responseTime = Date.now() - startTime;

      // THEN: Should return matching actors with sub-500ms performance
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(500);

      const searchResults = await response.json();
      expect(searchResults.success).toBe(true);
      expect(searchResults.data.actors).toBeInstanceOf(Array);
      expect(searchResults.data.query).toBe(searchQuery);
      expect(searchResults.data.took).toBeLessThan(500);
      expect(searchResults.metadata.source).toBe('imdb');
    });

    test('GET /api/v1/imdb/actors/:id should return actor profile with detailed information', async ({
      request,
    }) => {
      // GIVEN: Actor ID exists
      const actorId = 'test-actor-id';

      // WHEN: Requesting actor information
      const startTime = Date.now();
      const response = await request.get(`${BASE_URL}/api/v1/imdb/actors/${actorId}`);
      const responseTime = Date.now() - startTime;

      // THEN: Should return actor data with sub-500ms performance
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(500);

      const actorResponse = await response.json();
      expect(actorResponse.success).toBe(true);
      expect(actorResponse.data.actor).toBeDefined();
      expect(actorResponse.data.actor.id).toBeDefined();
      expect(actorResponse.data.actor.name).toBeTruthy();
      expect(actorResponse.data.filmographyCount).toBeDefined();
      expect(actorResponse.metadata.responseTime).toBeLessThan(500);
    });

    test('should handle search edge cases gracefully', async ({ request }) => {
      // Test empty search
      const emptyResponse = await request.get(`${BASE_URL}/api/v1/imdb/actors/search?q=`);
      expect(emptyResponse.status()).toBe(200);

      const emptyData = await emptyResponse.json();
      expect(emptyData.success).toBe(false);
      expect(emptyData.error).toContain('required');

      // Test short search
      const shortResponse = await request.get(`${BASE_URL}/api/v1/imdb/actors/search?q=a`);
      expect(shortResponse.status()).toBe(200);

      const shortData = await shortResponse.json();
      expect(shortData.success).toBe(false);
      expect(shortData.error).toContain('2 characters');
    });
  });

  test.describe('Data Caching Layer - AC 2', () => {
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

  test.describe('Error Handling and Fallback - AC 4', () => {
    test('should handle IMDB API unavailability gracefully', async ({ request }) => {
      // GIVEN: IMDB API is unavailable
      // Simulate API failure
      const response = await request.get(`${BASE_URL}/api/imdb/actor/invalid-id`, {
        headers: { 'x-simulate-imdb-failure': 'true' },
      });

      // WHEN: IMDB API fails
      // THEN: Should return fallback response
      expect(response.status()).toBe(503);

      const error = await response.json();
      expect(error).toMatchObject({
        error: 'IMDB_SERVICE_UNAVAILABLE',
        message: 'IMDB data service is temporarily unavailable',
        retryAfter: expect.any(Number),
        fallbackData: null,
      });
    });

    test('should handle invalid actor ID with proper error response', async ({ request }) => {
      // GIVEN: Invalid actor ID
      const invalidId = 'invalid-id-format';

      // WHEN: Requesting invalid actor
      const response = await request.get(`${BASE_URL}/api/imdb/actor/${invalidId}`);

      // THEN: Should return validation error
      expect(response.status()).toBe(400);

      const error = await response.json();
      expect(error).toMatchObject({
        error: 'VALIDATION_ERROR',
        message: 'Invalid actor ID format',
        details: {
          field: 'actorId',
          value: invalidId,
          expectedFormat: 'nm########',
        },
      });
    });

    test('should implement retry mechanism for transient failures', async ({ request }) => {
      // GIVEN: Temporary IMDB API failure
      let requestCount = 0;

      // Mock retry behavior
      const response = await request.get(`${BASE_URL}/api/imdb/actor/nm0000138`, {
        headers: {
          'x-simulate-retry-scenario': 'true',
          'x-request-attempt': (++requestCount).toString(),
        },
      });

      // WHEN: Retry mechanism activates
      // THEN: Should eventually succeed after retries
      expect(response.status()).toBe(200);
      expect(response.headers()['x-retry-count']).toBeDefined();
    });
  });

  test.describe('Data Quality Validation - AC 5', () => {
    test('should validate actor data completeness and consistency', async ({ request }) => {
      // GIVEN: Actor data returned from IMDB
      const response = await request.get(`${BASE_URL}/api/imdb/actor/nm0000138`);
      expect(response.status()).toBe(200);

      const actor = await response.json();

      // WHEN: Validating data quality
      // THEN: Should pass all quality checks
      expect(response.headers()['x-data-quality-score']).toBeDefined();
      const qualityScoreHeader = response.headers()['x-data-quality-score'];
      expect(qualityScoreHeader).toBeDefined();
      const qualityScore = parseFloat(qualityScoreHeader ?? '0');
      expect(qualityScore).toBeGreaterThanOrEqual(0.9); // 90% quality threshold

      // Required fields should be present and valid
      expect(actor.name).toBeTruthy();
      expect(actor.name.length).toBeGreaterThan(0);
      expect(actor.id).toMatch(/^nm\d{7}$/); // Proper IMDB ID format

      if (actor.birthDate) {
        expect(actor.birthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
      }
    });

    test('should detect and flag inconsistent data', async ({ request }) => {
      // GIVEN: Actor with inconsistent data
      const response = await request.get(`${BASE_URL}/api/imdb/actor/test-inconsistent-data`, {
        headers: { 'x-test-data-consistency': 'true' },
      });

      // WHEN: Validating inconsistent data
      // THEN: Should flag quality issues
      expect(response.status()).toBe(200); // Still returns data

      const qualityFlags = response.headers()['x-data-quality-flags'];
      expect(qualityFlags).toBeDefined();
      expect(qualityFlags).toContain('MISSING_BIOGRAPHY');

      const body = await response.json();
      expect(body.dataQualityIssues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'MISSING_REQUIRED_FIELD',
            field: 'biography',
            severity: 'WARNING',
          }),
        ]),
      );
    });

    test('should validate content metadata accuracy', async ({ request }) => {
      // GIVEN: Content metadata from IMDB
      const response = await request.get(`${BASE_URL}/api/imdb/content/tt0111161`);
      expect(response.status()).toBe(200);

      const content = await response.json();

      // WHEN: Validating content data
      // THEN: Should ensure data consistency
      expect(content.year).toMatch(/^\d{4}$/);
      expect(content.rating).toBeGreaterThanOrEqual(0);
      expect(content.rating).toBeLessThanOrEqual(10);

      if (content.duration) {
        expect(content.duration).toMatch(/^\d+h\s\d+m$/); // "2h 22m" format
      }

      // Cast should have valid actor IDs
      content.cast.forEach((castMember: any) => {
        expect(castMember.actorId).toMatch(/^nm\d{7}$/);
        expect(castMember.name).toBeTruthy();
      });
    });
  });

  test.describe('Performance Monitoring - AC 6', () => {
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
});
