import type { Elysia } from 'elysia';

export const securityHeaders = (app: Elysia) =>
  app.onAfterHandle(({ set }) => {
    // Security headers
    set.headers['X-Content-Type-Options'] = 'nosniff';
    set.headers['X-Frame-Options'] = 'DENY';
    set.headers['X-XSS-Protection'] = '1; mode=block';
    set.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    set.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()';

    // API-specific headers
    set.headers['X-API-Version'] = '1.0.0';
    set.headers['X-Content-Security-Policy'] = "default-src 'self'";

    // Remove server information
    delete set.headers['Server'];
  });
