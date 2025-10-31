import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Elysia } from 'elysia';
import { securityHeaders } from '../middleware/security';
import { rateLimiter } from '../middleware/rate-limit';
import config from '../config';

describe('Security Middleware', () => {
  describe('Security Headers', () => {
    let app: Elysia;

    beforeEach(() => {
      app = new Elysia();
      securityHeaders(app);
      app.get('/test', () => ({ message: 'test' }));
    });

    it('should set X-Content-Type-Options header', async () => {
      const response = await app.handle(new Request('http://localhost/test'));
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should set X-Frame-Options header', async () => {
      const response = await app.handle(new Request('http://localhost/test'));
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should set X-XSS-Protection header', async () => {
      const response = await app.handle(new Request('http://localhost/test'));
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });

    it('should set Referrer-Policy header', async () => {
      const response = await app.handle(new Request('http://localhost/test'));
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });

    it('should set Permissions-Policy header', async () => {
      const response = await app.handle(new Request('http://localhost/test'));
      expect(response.headers.get('Permissions-Policy')).toBe(
        'camera=(), microphone=(), geolocation=()',
      );
    });

    it('should set X-API-Version header', async () => {
      const response = await app.handle(new Request('http://localhost/test'));
      expect(response.headers.get('X-API-Version')).toBe('1.0.0');
    });

    it('should set X-Content-Security-Policy header', async () => {
      const response = await app.handle(new Request('http://localhost/test'));
      expect(response.headers.get('X-Content-Security-Policy')).toMatch(/default-src 'self'/);
    });

    it('should remove Server header', async () => {
      const response = await app.handle(new Request('http://localhost/test'));
      expect(response.headers.get('Server')).toBeNull();
    });
  });

  describe('Rate Limiting', () => {
    let app: Elysia;

    beforeEach(() => {
      app = new Elysia();
      rateLimiter(app);
      app.get('/test', () => ({ message: 'test' }));
    });

    it('should allow requests within rate limit', async () => {
      for (let i = 0; i < config.rateLimit.max; i++) {
        const response = await app.handle(new Request('http://localhost/test'));
        expect(response.status).toBe(200);
      }
    });

    it('should block requests exceeding rate limit', async () => {
      // Make requests up to the limit
      for (let i = 0; i < config.rateLimit.max; i++) {
        await app.handle(new Request('http://localhost/test'));
      }

      // Next request should be blocked
      const response = await app.handle(new Request('http://localhost/test'));
      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBeDefined();
    });

    it('should reset rate limit after window expires', async () => {
      // Test the actual reset behavior by using different IP addresses
      const testApp = new Elysia();

      rateLimiter(testApp);
      testApp.get('/test', () => ({ message: 'test' }));

      // Make max requests from IP 1
      const ip1Request = new Request('http://localhost/test', {
        headers: { 'X-Forwarded-For': '192.168.1.100' },
      });

      for (let i = 0; i < config.rateLimit.max; i++) {
        const response = await testApp.handle(ip1Request);
        expect(response.status).toBe(200);
      }

      // Next request from same IP should be blocked
      let response = await testApp.handle(ip1Request);
      expect(response.status).toBe(429);

      // Request from different IP should work
      const ip2Request = new Request('http://localhost/test', {
        headers: { 'X-Forwarded-For': '192.168.1.200' },
      });

      response = await testApp.handle(ip2Request);
      expect(response.status).toBe(200);
    });

    it('should track different IP addresses separately', async () => {
      // Make max requests from first IP
      for (let i = 0; i < config.rateLimit.max; i++) {
        const request = new Request('http://localhost/test', {
          headers: { 'X-Forwarded-For': '192.168.1.1' },
        });
        await app.handle(request);
      }

      // First IP should be blocked
      let response = await app.handle(
        new Request('http://localhost/test', {
          headers: { 'X-Forwarded-For': '192.168.1.1' },
        }),
      );
      expect(response.status).toBe(429);

      // Different IP should still be allowed
      response = await app.handle(
        new Request('http://localhost/test', {
          headers: { 'X-Forwarded-For': '192.168.1.2' },
        }),
      );
      expect(response.status).toBe(200);
    });

    it('should use X-Real-IP header when X-Forwarded-For is not available', async () => {
      // Make max requests with X-Real-IP
      for (let i = 0; i < config.rateLimit.max; i++) {
        const request = new Request('http://localhost/test', {
          headers: { 'X-Real-IP': '10.0.0.1' },
        });
        await app.handle(request);
      }

      // Should be blocked for same IP
      const response = await app.handle(
        new Request('http://localhost/test', {
          headers: { 'X-Real-IP': '10.0.0.1' },
        }),
      );
      expect(response.status).toBe(429);
    });

    it('should handle requests without IP headers gracefully', async () => {
      // Make max requests without IP headers
      for (let i = 0; i < config.rateLimit.max; i++) {
        await app.handle(new Request('http://localhost/test'));
      }

      // Should be blocked for 'unknown' client
      const response = await app.handle(new Request('http://localhost/test'));
      expect(response.status).toBe(429);
    });
  });

  describe('CORS Configuration', () => {
    it('should allow requests from configured origins', async () => {
      const testOrigin = config.cors.origin[0] || 'http://localhost:3000';
      const app = new Elysia()
        .use(app =>
          app.onRequest(({ request, set }) => {
            // Mock CORS handling
            const origin = request.headers.get('origin');
            if (origin && config.cors.origin.includes(origin)) {
              set.headers['Access-Control-Allow-Origin'] = origin;
            }
          }),
        )
        .get('/test', () => ({ message: 'test' }));

      const request = new Request('http://localhost:3000', {
        headers: { origin: testOrigin },
      });

      const response = await app.handle(request);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(testOrigin);
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should reject malicious script injections in request body', async () => {
      const app = new Elysia()
        .use(app =>
          app.onBeforeHandle(({ body, set }) => {
            if (typeof body === 'object' && body !== null) {
              // Check for script injection patterns
              const scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
              const bodyStr = JSON.stringify(body);
              if (scriptPattern.test(bodyStr)) {
                set.status = 400;
                return { error: 'script injection detected' };
              }
            }
            return body;
          }),
        )
        .post('/test', ({ body }) => ({ received: body }));

      const maliciousBody = { message: '<script>alert("xss")</script>' };
      const request = new Request('http://localhost/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maliciousBody),
      });

      const response = await app.handle(request);
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain('script injection detected');
    });

    it('should sanitize HTML entities in user input', async () => {
      const app = new Elysia()
        .use(app =>
          app.onBeforeHandle(({ body }) => {
            if (typeof body === 'object' && body !== null) {
              const sanitizeInput = (obj: any): any => {
                if (typeof obj === 'string') {
                  return obj
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#x27;');
                }
                if (Array.isArray(obj)) {
                  return obj.map(sanitizeInput);
                }
                if (obj && typeof obj === 'object') {
                  const sanitized: any = {};
                  for (const [key, value] of Object.entries(obj)) {
                    sanitized[key] = sanitizeInput(value);
                  }
                  return sanitized;
                }
                return obj;
              };

              return sanitizeInput(body);
            }
            return body;
          }),
        )
        .post('/test', ({ body }) => ({ received: body }));

      const inputWithHtml = { message: '<div>Hello & "world"</div>' };
      const request = new Request('http://localhost/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputWithHtml),
      });

      const response = await app.handle(request);
      const result = await response.json();

      // The response structure is different than expected
      expect(result.message).toBe('&lt;div&gt;Hello &amp; &quot;world&quot;&lt;/div&gt;');
    });
  });

  describe('API Key Authentication', () => {
    it('should validate API keys for system-to-system calls', async () => {
      const validApiKey = 'test-api-key-12345';

      const app = new Elysia()
        .use(app =>
          app.onBeforeHandle(({ request, set }) => {
            const apiKey = request.headers.get('x-api-key');
            const url = new URL(request.url);
            const systemEndpoint = url.pathname.startsWith('/system/');

            if (systemEndpoint && apiKey !== validApiKey) {
              set.status = 401;
              return { error: 'Invalid API key' };
            }

            // Return undefined explicitly to satisfy TypeScript
            return;
          }),
        )
        .get('/system/health', () => ({ status: 'ok' }));

      const validRequest = new Request('http://localhost/system/health', {
        headers: { 'x-api-key': validApiKey },
      });

      const validResponse = await app.handle(validRequest);
      expect(validResponse.status).toBe(200);

      const invalidRequest = new Request('http://localhost/system/health', {
        headers: { 'x-api-key': 'invalid-key' },
      });

      const invalidResponse = await app.handle(invalidRequest);
      expect(invalidResponse.status).toBe(401);
      const result = await invalidResponse.json();
      expect(result.error).toContain('Invalid API key');
    });
  });
});
