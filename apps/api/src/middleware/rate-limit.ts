import type { Elysia } from 'elysia';
import type { ApiResponse } from '../types';
import config from '../config';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

const cleanupStore = () => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    const record = store[key];
    if (record && record.resetTime < now) {
      delete store[key];
    }
  });
};

// Clean up expired entries every 5 minutes
setInterval(cleanupStore, 5 * 60 * 1000);

export const rateLimiter = (app: Elysia) =>
  app.onRequest(({ request, set }) => {
    const key =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    const now = Date.now();
    const record = store[key];

    if (!record || now > record.resetTime) {
      store[key] = {
        count: 1,
        resetTime: now + config.rateLimit.windowMs,
      };
      return;
    }

    if (record.count >= config.rateLimit.max) {
      set.status = 429;
      set.headers['Retry-After'] = Math.ceil((record.resetTime - now) / 1000).toString();

      throw new Error('Too many requests');
    }

    record.count++;
  });
