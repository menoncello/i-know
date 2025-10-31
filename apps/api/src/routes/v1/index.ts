import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import type { ApiResponse } from '../../types';
// Mock database health check for testing
const checkDatabaseHealth = async (): Promise<boolean> => {
  // In test mode, always return healthy
  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  // In non-test mode, try to check actual database health
  try {
    // This will be implemented when we have actual database connection
    // For now, return true (will be replaced with actual health check)
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

const healthRoutes = new Elysia({ prefix: '/health' })
  .get('/', async () => {
    const dbHealthy = await checkDatabaseHealth();

    return {
      success: true,
      data: {
        status: dbHealthy ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        service: 'i-know-api',
        version: '1.0.0',
        checks: {
          database: dbHealthy ? 'healthy' : 'unhealthy',
        },
      },
    } as ApiResponse;
  })
  .get('/readiness', async () => {
    const dbHealthy = await checkDatabaseHealth();

    return {
      success: true,
      data: {
        status: dbHealthy ? 'ready' : 'not-ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: dbHealthy ? 'ready' : 'not-ready',
        },
      },
    } as ApiResponse;
  })
  .get(
    '/liveness',
    () =>
      ({
        success: true,
        data: {
          status: 'alive',
          timestamp: new Date().toISOString(),
        },
      }) as ApiResponse,
  );

const statusRoutes = new Elysia({ prefix: '/status' })
  .get('/', async () => {
    const dbHealthy = await checkDatabaseHealth();

    return {
      success: true,
      data: {
        service: 'i-know-api',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        system: {
          platform: process.platform,
          nodeVersion: process.version,
          pid: process.pid,
        },
        health: {
          database: dbHealthy ? 'healthy' : 'unhealthy',
        },
        performance: {
          cpuUsage: process.cpuUsage(),
          hrtime: process.hrtime(),
        },
      },
    } as ApiResponse;
  })
  .get(
    '/metrics',
    () =>
      ({
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: {
            rss: process.memoryUsage().rss,
            heapTotal: process.memoryUsage().heapTotal,
            heapUsed: process.memoryUsage().heapUsed,
            external: process.memoryUsage().external,
          },
          cpu: process.cpuUsage(),
          performance: process.hrtime(),
        },
      }) as ApiResponse,
  );

import authRoutes from './auth';
import imdbRoutes from './imdb';

const actorsRoutes = new Elysia({ prefix: '/actors' }).get(
  '/',
  () =>
    ({
      success: true,
      data: {
        actors: [],
        total: 0,
        page: 1,
        limit: 20,
      },
    }) as ApiResponse,
);

const v1Routes = new Elysia({ prefix: '/api/v1' })
  .use(
    swagger({
      documentation: {
        info: {
          title: 'I Know API',
          description: 'RESTful API for I Know application',
          version: '1.0.0',
        },
        tags: [
          {
            name: 'Health',
            description: 'Health check endpoints',
          },
          {
            name: 'Status',
            description: 'System status endpoints',
          },
          {
            name: 'Authentication',
            description: 'User authentication endpoints',
          },
          {
            name: 'Actors',
            description: 'Actor-related endpoints',
          },
          {
            name: 'IMDB',
            description: 'IMDB data pipeline endpoints',
          },
        ],
      },
    }),
  )
  .use(healthRoutes)
  .use(statusRoutes)
  .use(authRoutes)
  .use(imdbRoutes)
  .use(actorsRoutes);

export default v1Routes;
