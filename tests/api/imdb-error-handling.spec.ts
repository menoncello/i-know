import { test, expect } from '@playwright/test';

test.describe('Error Handling and Fallback - AC 4', () => {
  const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

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
