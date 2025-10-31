import { cors } from '@elysiajs/cors';
import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';

import config from './config';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/logging';
import { rateLimiter } from './middleware/rate-limit';
import { securityHeaders } from './middleware/security';
import v1Routes from './routes/v1';

// Initialize database connection
import { connectDatabase, runMigrations } from '../../../packages/database/src/index.js';

// Connect to database only if not in test mode with SQLite
let db: any = null;
if (process.env.NODE_ENV === 'test' && process.env.DB_HOST === ':memory:') {
  // For testing, we can skip database connection or use SQLite
  console.log('🧪 Running in test mode - skipping database connection');
} else {
  try {
    // Connect to database
    db = connectDatabase(config.database);

    // Run migrations on startup
    runMigrations().catch(error => {
      console.error('❌ Database migration failed:', error.message);
      // Don't fail startup in development mode
      if (config.env === 'production') {
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error instanceof Error ? error.message : error);
    // Don't fail startup in development mode
    if (config.env === 'production') {
      process.exit(1);
    }
  }
}

const app = new Elysia()
  .decorate('db', db)
  .use(
    swagger({
      documentation: {
        info: {
          title: 'I Know API',
          description: 'RESTful API for I Know application',
          version: '1.0.0',
        },
      },
      path: '/docs',
    }),
  )
  .use(
    cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
    }),
  )
  .use(securityHeaders)
  .use(requestLogger)
  .use(rateLimiter)
  .use(errorHandler)
  .use(v1Routes)
  .get('/', () => ({
    success: true,
    data: {
      message: 'Welcome to I Know API',
      version: '1.0.0',
      documentation: '/docs',
      health: '/health',
    },
  }))
  .listen(config.port);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
console.log(`📚 API Documentation: http://localhost:${config.port}/docs`);
console.log(`🏥 Health Check: http://localhost:${config.port}/health`);
console.log(
  `🗄️ Database connected to ${config.database.host}:${config.database.port}/${config.database.database}`,
);
