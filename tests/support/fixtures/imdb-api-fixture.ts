import { test as base, type APIRequestContext } from '@playwright/test';
import {
  createActor,
  createContent,
  createActorSearchResponse,
  createContentSearchResponse,
  createApiErrorResponse,
} from './factories/imdb-factory';
import type { Actor, Content, SearchResult } from './factories/imdb-factory';

type IMDBApiFixture = {
  seedActor: (overrides?: Partial<Actor>) => Promise<Actor>;
  seedContent: (overrides?: Partial<Content>) => Promise<Content>;
  searchActors: (query: string, count?: number) => Promise<SearchResult[]>;
  searchContent: (query: string, count?: number) => Promise<SearchResult[]>;
  simulateApiFailure: (errorType?: string) => Promise<void>;
  simulateSlowResponse: (delayMs: number) => Promise<void>;
  getApiResponseTime: (endpoint: string) => Promise<number>;
  getCacheStatus: (endpoint: string) => Promise<string>;
};

export const test = base.extend<IMDBApiFixture>({
  // Seed actor data via API
  seedActor: async ({ request }, use) => {
    const createdActors: Actor[] = [];

    const seedActor = async (overrides: Partial<Actor> = {}): Promise<Actor> => {
      const actor = createActor(overrides);

      // Mock seeding since IMDB API doesn't have create endpoints
      // In real implementation, this would call actual APIs or database seeding
      const response = await request.post('/api/test/seed/actor', {
        data: actor,
      });

      if (!response.ok()) {
        throw new Error(`Failed to seed actor: ${response.status()}`);
      }

      const created = (await response.json()) as Actor;
      createdActors.push(created);
      return created;
    };

    await use(seedActor);

    // Cleanup: Remove all created actors
    for (const actor of createdActors) {
      try {
        await request.delete(`/api/test/cleanup/actor/${actor.id}`);
      } catch (error) {
        console.warn(`Failed to cleanup actor ${actor.id}:`, error);
      }
    }
  },

  // Seed content data via API
  seedContent: async ({ request }, use) => {
    const createdContent: Content[] = [];

    const seedContent = async (overrides: Partial<Content> = {}): Promise<Content> => {
      const content = createContent(overrides);

      const response = await request.post('/api/test/seed/content', {
        data: content,
      });

      if (!response.ok()) {
        throw new Error(`Failed to seed content: ${response.status()}`);
      }

      const created = (await response.json()) as Content;
      createdContent.push(created);
      return created;
    };

    await use(seedContent);

    // Cleanup: Remove all created content
    for (const content of createdContent) {
      try {
        await request.delete(`/api/test/cleanup/content/${content.id}`);
      } catch (error) {
        console.warn(`Failed to cleanup content ${content.id}:`, error);
      }
    }
  },

  // Search actors with caching simulation
  searchActors: async ({ request }, use) => {
    const searchActors = async (query: string, count: number = 10): Promise<SearchResult[]> => {
      const response = await request.get('/api/imdb/search', {
        params: {
          query,
          type: 'actor',
          limit: count.toString(),
        },
      });

      if (!response.ok()) {
        throw new Error(`Actor search failed: ${response.status()}`);
      }

      const searchResult = await response.json();
      return searchResult.results;
    };

    await use(searchActors);
  },

  // Search content with caching simulation
  searchContent: async ({ request }, use) => {
    const searchContent = async (query: string, count: number = 10): Promise<SearchResult[]> => {
      const response = await request.get('/api/imdb/search', {
        params: {
          query,
          type: 'content',
          limit: count.toString(),
        },
      });

      if (!response.ok()) {
        throw new Error(`Content search failed: ${response.status()}`);
      }

      const searchResult = await response.json();
      return searchResult.results;
    };

    await use(searchContent);
  },

  // Simulate API failures for testing error handling
  simulateApiFailure: async ({ request }, use) => {
    const simulateApiFailure = async (errorType: string = 'NETWORK_ERROR'): Promise<void> => {
      const response = await request.post('/api/test/simulate-failure', {
        data: { errorType },
      });

      if (!response.ok()) {
        throw new Error(`Failed to simulate API failure: ${response.status()}`);
      }
    };

    await use(simulateApiFailure);
  },

  // Simulate slow responses for testing performance
  simulateSlowResponse: async ({ request }, use) => {
    const simulateSlowResponse = async (delayMs: number): Promise<void> => {
      const response = await request.post('/api/test/simulate-delay', {
        data: { delayMs },
      });

      if (!response.ok()) {
        throw new Error(`Failed to simulate slow response: ${response.status()}`);
      }
    };

    await use(simulateSlowResponse);
  },

  // Get API response time metrics
  getApiResponseTime: async ({ request }, use) => {
    const getApiResponseTime = async (endpoint: string): Promise<number> => {
      const startTime = Date.now();
      const response = await request.get(endpoint);
      const endTime = Date.now();

      if (!response.ok()) {
        throw new Error(`Failed to get response time for ${endpoint}: ${response.status()}`);
      }

      // Return both actual and reported response time
      const reportedTime = parseFloat(response.headers()['x-response-time'] || '0');
      const actualTime = endTime - startTime;

      return Math.max(reportedTime, actualTime);
    };

    await use(getApiResponseTime);
  },

  // Get cache status for endpoints
  getCacheStatus: async ({ request }, use) => {
    const getCacheStatus = async (endpoint: string): Promise<string> => {
      const response = await request.get(endpoint);

      if (!response.ok()) {
        throw new Error(`Failed to get cache status for ${endpoint}: ${response.status()}`);
      }

      return response.headers()['x-cache-status'] || 'UNKNOWN';
    };

    await use(getCacheStatus);
  },
});

// Helper functions for common test scenarios
export const createPerformanceTestScenarios = () => {
  return {
    // Test sub-500ms response time requirement
    testSub500msResponse: async (endpoint: string, request: APIRequestContext) => {
      const responseTime = await request
        .get(endpoint)
        .then(r => parseFloat(r.headers()['x-response-time'] || '0'));
      return responseTime < 500;
    },

    // Test cache hit performance
    testCachePerformance: async (endpoint: string, request: APIRequestContext) => {
      // First request (cache miss)
      const missResponse = await request.get(endpoint);
      const missTime = parseFloat(missResponse.headers()['x-response-time'] || '0');

      // Second request (should be cache hit)
      const hitResponse = await request.get(endpoint);
      const hitTime = parseFloat(hitResponse.headers()['x-response-time'] || '0');

      return {
        missTime,
        hitTime,
        cacheImprovement: missTime - hitTime,
        cacheStatus: hitResponse.headers()['x-cache-status'],
      };
    },

    // Test error recovery
    testErrorRecovery: async (endpoint: string, request: APIRequestContext) => {
      // Simulate failure
      await request.post('/api/test/simulate-failure', {
        data: { errorType: 'NETWORK_ERROR', duration: 5000 },
      });

      // Test retry mechanism
      const retryResponse = await request.get(endpoint, {
        headers: { 'x-test-retry': 'true' },
      });

      return {
        status: retryResponse.status(),
        retryCount: retryResponse.headers()['x-retry-count'],
        recovered: retryResponse.ok(),
      };
    },
  };
};

export { expect } from '@playwright/test';
