import { cors } from '@elysiajs/cors';
import { Elysia } from 'elysia';

const app = new Elysia()
  .use(cors())
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'i-know-api',
  }))
  .get('/api/v1/actors', () => ({
    actors: [],
    total: 0,
    page: 1,
    limit: 20,
  }))
  .listen(3001);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
