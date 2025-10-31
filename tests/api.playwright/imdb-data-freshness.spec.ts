import { test, expect } from '@playwright/test';

test.describe('Data Freshness Monitoring - AC 3', () => {
  const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

  test.describe('Daily Update Process Validation', () => {
    test('GET /api/v1/imdb/freshness/status should return current data freshness status', async ({
      request,
    }) => {
      const response = await request.get(`${BASE_URL}/api/v1/imdb/freshness/status`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.freshness).toBeDefined();
      expect(data.data.lastUpdate).toBeDefined();
      expect(data.data.nextUpdate).toBeDefined();
      expect(typeof data.data.freshness.score).toBe('number');
      expect(data.data.freshness.score).toBeGreaterThanOrEqual(0);
      expect(data.data.freshness.score).toBeLessThanOrEqual(1);
      expect(['excellent', 'good', 'moderate', 'poor', 'stale']).toContain(
        data.data.freshness.status,
      );
    });

    test('GET /api/v1/imdb/freshness/thresholds should return configured freshness thresholds', async ({
      request,
    }) => {
      const response = await request.get(`${BASE_URL}/api/v1/imdb/freshness/thresholds`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.thresholds).toBeDefined();
      expect(typeof data.data.thresholds.optimalAgeHours).toBe('number');
      expect(typeof data.data.thresholds.maxAgeHours).toBe('number');
      expect(typeof data.data.thresholds.criticalAgeHours).toBe('number');
      expect(data.data.thresholds.optimalAgeHours).toBeLessThan(data.data.thresholds.maxAgeHours);
      expect(data.data.thresholds.maxAgeHours).toBeLessThan(data.data.thresholds.criticalAgeHours);
    });

    test('POST /api/v1/imdb/freshness/trigger should trigger manual data refresh', async ({
      request,
    }) => {
      const response = await request.post(`${BASE_URL}/api/v1/imdb/freshness/trigger`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.refreshTriggered).toBe(true);
      expect(data.data.timestamp).toBeDefined();
      expect(data.data.status).toBe('initiated');
      expect(data.data.jobId).toBeDefined();
    });
  });

  test.describe('Data Staleness Detection', () => {
    test('GET /api/v1/imdb/freshness/stale should identify stale data records', async ({
      request,
    }) => {
      const response = await request.get(`${BASE_URL}/api/v1/imdb/freshness/stale`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.staleRecords).toBeDefined();
      expect(Array.isArray(data.data.staleRecords)).toBe(true);

      if (data.data.staleRecords.length > 0) {
        data.data.staleRecords.forEach((record: any) => {
          expect(record.id).toBeDefined();
          expect(record.type).toBeDefined();
          expect(record.lastUpdate).toBeDefined();
          expect(record.ageInHours).toBeDefined();
          expect(typeof record.ageInHours).toBe('number');
          expect(record.ageInHours).toBeGreaterThan(0);
        });
      }
    });

    test('GET /api/v1/imdb/freshness/metrics should provide comprehensive freshness metrics', async ({
      request,
    }) => {
      const response = await request.get(`${BASE_URL}/api/v1/imdb/freshness/metrics`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.metrics).toBeDefined();

      const metrics = data.data.metrics;
      expect(typeof metrics.totalRecords).toBe('number');
      expect(typeof metrics.freshRecords).toBe('number');
      expect(typeof metrics.moderatelyFreshRecords).toBe('number');
      expect(typeof metrics.staleRecords).toBe('number');
      expect(typeof metrics.criticalRecords).toBe('number');

      expect(metrics.totalRecords).toBeGreaterThanOrEqual(0);
      expect(metrics.freshRecords).toBeGreaterThanOrEqual(0);
      expect(metrics.moderatelyFreshRecords).toBeGreaterThanOrEqual(0);
      expect(metrics.staleRecords).toBeGreaterThanOrEqual(0);
      expect(metrics.criticalRecords).toBeGreaterThanOrEqual(0);

      const total =
        metrics.freshRecords +
        metrics.moderatelyFreshRecords +
        metrics.staleRecords +
        metrics.criticalRecords;
      expect(total).toBeLessThanOrEqual(metrics.totalRecords);
    });
  });

  test.describe('Automated Synchronization Workflow', () => {
    test('GET /api/v1/imdb/sync/status should return synchronization workflow status', async ({
      request,
    }) => {
      const response = await request.get(`${BASE_URL}/api/v1/imdb/sync/status`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.sync).toBeDefined();
      expect(typeof data.data.sync.lastSync).toBe('string');
      expect(typeof data.data.sync.nextSync).toBe('string');
      expect(typeof data.data.sync.status).toBe('string');
      expect(['running', 'completed', 'failed', 'scheduled']).toContain(data.data.sync.status);
      expect(typeof data.data.sync.recordsProcessed).toBe('number');
      expect(data.data.sync.recordsProcessed).toBeGreaterThanOrEqual(0);
      expect(typeof data.data.sync.errorMessage).toBe('string');
    });

    test('GET /api/v1/imdb/sync/history should return synchronization history', async ({
      request,
    }) => {
      const response = await request.get(`${BASE_URL}/api/v1/imdb/sync/history?limit=10`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.history).toBeDefined();
      expect(Array.isArray(data.data.history)).toBe(true);
      expect(data.data.history.length).toBeLessThanOrEqual(10);

      if (data.data.history.length > 0) {
        data.data.history.forEach((entry: any) => {
          expect(entry.timestamp).toBeDefined();
          expect(entry.status).toBeDefined();
          expect(['success', 'failed', 'partial']).toContain(entry.status);
          expect(typeof entry.recordsProcessed).toBe('number');
          expect(entry.recordsProcessed).toBeGreaterThanOrEqual(0);
          expect(typeof entry.duration).toBe('number');
          expect(entry.duration).toBeGreaterThanOrEqual(0);
        });
      }
    });

    test('GET /api/v1/imdb/sync/health should verify synchronization system health', async ({
      request,
    }) => {
      const response = await request.get(`${BASE_URL}/api/v1/imdb/sync/health`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.health).toBeDefined();
      expect(typeof data.data.health.overallStatus).toBe('string');
      expect(['healthy', 'warning', 'critical']).toContain(data.data.health.overallStatus);
      expect(typeof data.data.health.lastSuccessfulSync).toBe('string');
      expect(typeof data.data.health.uptime).toBe('number');
      expect(data.data.health.uptime).toBeGreaterThanOrEqual(0);
      expect(typeof data.data.health.activeJobs).toBe('number');
      expect(data.data.health.activeJobs).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Freshness Threshold Testing', () => {
    test('should detect when data exceeds freshness thresholds and trigger alerts', async ({
      request,
    }) => {
      // Test with custom threshold
      const response = await request.post(`${BASE_URL}/api/v1/imdb/freshness/check`, {
        data: {
          lastUpdate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 48 hours ago
          thresholdHours: 24,
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.isStale).toBe(true);
      expect(data.data.ageInHours).toBeGreaterThan(24);
      expect(data.data.actionRequired).toBe(true);
      expect(data.data.recommendedAction).toBe('refresh');
    });

    test('should calculate freshness score for different data ages', async ({ request }) => {
      const testCases = [
        { hoursAgo: 2, expectedScore: 1.0 },
        { hoursAgo: 12, expectedScore: 1.0 },
        { hoursAgo: 24, expectedScore: 0.71 },
        { hoursAgo: 36, expectedScore: 0.43 },
        { hoursAgo: 48, expectedScore: 0.0 },
      ];

      for (const testCase of testCases) {
        const response = await request.post(`${BASE_URL}/api/v1/imdb/freshness/score`, {
          data: {
            lastUpdate: new Date(Date.now() - testCase.hoursAgo * 60 * 60 * 1000).toISOString(),
          },
        });

        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(typeof data.data.freshnessScore).toBe('number');
        expect(data.data.freshnessScore).toBeCloseTo(testCase.expectedScore, 1);
      }
    });
  });
});
