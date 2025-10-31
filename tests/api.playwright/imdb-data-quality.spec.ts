import { test, expect } from '@playwright/test';

test.describe('Data Quality Validation - AC 5', () => {
  const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

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
