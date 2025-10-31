import { test, expect } from '@playwright/test';

test.describe('IMDB Data Access - AC 1', () => {
  const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

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
