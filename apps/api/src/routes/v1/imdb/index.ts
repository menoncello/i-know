/**
 * IMDB Data Pipeline API Routes
 * Provides REST endpoints for accessing IMDB actor and content data
 * with sub-500ms response times through high-performance caching
 */

import { Elysia } from 'elysia';
import { RevolutionaryIMDBService } from '../../../../../scraper/src/services/imdb-service';
import { getDatabase } from '../../../../../../packages/database/src/index';
import type {
  ActorSearchRequest,
  ActorSearchResponse,
  ActorProfileRequest,
  ActorProfileResponse,
} from '../../../../../../packages/types/src/imdb';
import { IMDBError, ValidationError } from '../../../../../../packages/types/src/imdb';

// Initialize IMDB service with database connection
const db = getDatabase();
const imdbService = new RevolutionaryIMDBService(db);

const imdbRoutes = new Elysia({ prefix: '/imdb' })
  .get('/health', async () => {
    try {
      const cacheStats = await imdbService.getCacheStats();
      return {
        success: true,
        data: {
          status: 'healthy',
          service: 'imdb-data-pipeline',
          timestamp: new Date().toISOString(),
          cache: cacheStats,
        },
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  })

  .get(
    '/actors/search',
    async ({ query }: { query: Record<string, string> }) => {
      const startTime = Date.now();

      try {
        // Validate input
        const searchQuery = query.q || query.query;
        if (!searchQuery || searchQuery.trim().length < 2) {
          throw new ValidationError('Search query must be at least 2 characters long');
        }

        const limit = Math.min(parseInt(query.limit || '20'), 100); // Max 100 results
        const offset = Math.max(parseInt(query.offset || '0'), 0);
        const includeFilmography = query.includeFilmography === 'true';

        const searchOptions: ActorSearchRequest = {
          query: searchQuery.trim(),
          limit,
          offset,
          includeFilmography,
        };

        // Search actors using revolutionary fast retrieval
        const actors = await imdbService.searchActors(searchOptions.query, searchOptions);

        const responseTime = Date.now() - startTime;

        const response: ActorSearchResponse = {
          success: true,
          data: {
            actors,
            total: actors.length,
            query: searchOptions.query,
            took: responseTime,
          },
          metadata: {
            source: 'imdb',
            timestamp: new Date().toISOString(),
            cached: responseTime < 50, // Assume cached if under 50ms
          },
        };

        return response;
      } catch (error: unknown) {
        if (error instanceof ValidationError || error instanceof IMDBError) {
          return {
            success: false,
            error: (error as ValidationError | IMDBError).message,
            data: {
              actors: [],
              total: 0,
              query: query.q || query.query || '',
              took: Date.now() - startTime,
            },
          };
        }

        return {
          success: false,
          error: 'Internal server error during actor search',
          data: {
            actors: [],
            total: 0,
            query: query.q || query.query || '',
            took: Date.now() - startTime,
          },
        };
      }
    },
    {
      detail: {
        tags: ['IMDB'],
        summary: 'Search for actors by name',
        description: 'Search actors using revolutionary fast retrieval with intelligent caching',
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            schema: { type: 'string', minLength: 2 },
            description: 'Search query for actor names',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            description: 'Maximum number of results to return',
          },
          {
            name: 'offset',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 0, default: 0 },
            description: 'Number of results to skip',
          },
          {
            name: 'includeFilmography',
            in: 'query',
            required: false,
            schema: { type: 'boolean', default: false },
            description: 'Include filmography information',
          },
        ],
        responses: {
          200: {
            description: 'Successful actor search',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        actors: { type: 'array', items: { $ref: '#/components/schemas/Actor' } },
                        total: { type: 'integer' },
                        query: { type: 'string' },
                        took: { type: 'integer' },
                      },
                    },
                    metadata: {
                      type: 'object',
                      properties: {
                        source: { type: 'string' },
                        timestamp: { type: 'string' },
                        cached: { type: 'boolean' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Bad request - invalid search parameters',
          },
          500: {
            description: 'Internal server error',
          },
        },
      },
    },
  )

  .get(
    '/actors/:actorId',
    async ({ params, query }: { params: { actorId: string }; query: Record<string, string> }) => {
      const startTime = Date.now();

      try {
        // Validate input
        if (!params.actorId) {
          throw new ValidationError('Actor ID is required');
        }

        const includeContent = query.includeContent === 'true';
        const contentLimit = Math.min(parseInt(query.contentLimit || '10'), 50);

        const profileOptions: ActorProfileRequest = {
          actorId: params.actorId,
          includeContent,
          contentLimit,
        };

        // Get actor profile using revolutionary fast retrieval
        const actor = await imdbService.getActorProfile(params.actorId, profileOptions);

        const responseTime = Date.now() - startTime;

        const response: ActorProfileResponse = {
          success: true,
          data: {
            actor,
            filmographyCount: actor.filmographyCount || 0,
          },
          metadata: {
            source: 'imdb',
            timestamp: new Date().toISOString(),
            cached: responseTime < 50,
            responseTime,
          },
        };

        return response;
      } catch (error: unknown) {
        if (error instanceof ValidationError || error instanceof IMDBError) {
          return {
            success: false,
            error: (error as ValidationError | IMDBError).message,
            data: {
              actor: null,
              filmographyCount: 0,
            },
          };
        }

        return {
          success: false,
          error: 'Internal server error while fetching actor profile',
          data: {
            actor: null,
            filmographyCount: 0,
          },
        };
      }
    },
    {
      detail: {
        tags: ['IMDB'],
        summary: 'Get actor profile by ID',
        description: 'Retrieve detailed actor information with filmography',
        parameters: [
          {
            name: 'actorId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Unique identifier for the actor',
          },
          {
            name: 'includeContent',
            in: 'query',
            required: false,
            schema: { type: 'boolean', default: false },
            description: 'Include related content information',
          },
          {
            name: 'contentLimit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
            description: 'Maximum number of content items to include',
          },
        ],
        responses: {
          200: {
            description: 'Successful actor profile retrieval',
          },
          404: {
            description: 'Actor not found',
          },
          500: {
            description: 'Internal server error',
          },
        },
      },
    },
  )

  .get(
    '/cache/stats',
    async () => {
      try {
        const stats = await imdbService.getCacheStats();
        return {
          success: true,
          data: {
            cache: stats,
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error: unknown) {
        return {
          success: false,
          error: 'Failed to retrieve cache statistics',
          details: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    {
      detail: {
        tags: ['IMDB', 'Cache'],
        summary: 'Get cache performance statistics',
        description: 'Retrieve cache hit rates, memory usage, and other performance metrics',
      },
    },
  )

  .delete(
    '/cache',
    async ({ query }: { query: Record<string, string> }) => {
      try {
        const pattern = query.pattern;
        const deletedCount = await imdbService.clearCache(pattern);

        return {
          success: true,
          data: {
            deletedEntries: deletedCount,
            pattern: pattern || 'all',
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error: unknown) {
        return {
          success: false,
          error: 'Failed to clear cache',
          details: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    {
      detail: {
        tags: ['IMDB', 'Cache'],
        summary: 'Clear cache entries',
        description: 'Clear cache entries optionally filtered by pattern',
        parameters: [
          {
            name: 'pattern',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Regex pattern to filter cache keys (optional)',
          },
        ],
        responses: {
          200: {
            description: 'Cache cleared successfully',
          },
          500: {
            description: 'Failed to clear cache',
          },
        },
      },
    },
  )

  // Error handling for all IMDB routes
  .error({
    // Custom error handling for IMDB-specific errors
    IMDBError: ({ error }: { error: IMDBError }) => ({
      success: false,
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    }),
    ValidationError: ({ error }: { error: ValidationError }) => ({
      success: false,
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    }),
  });

export default imdbRoutes;
