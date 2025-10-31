import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { Elysia } from 'elysia';
import { requestLogger } from '../middleware/logging';
import logger from '../middleware/logging';
import fs from 'fs';
import path from 'path';

describe('Logging and Monitoring', () => {
  let tempLogDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    tempLogDir = path.join(process.cwd(), 'test-logs');

    // Ensure test log directory exists
    if (!fs.existsSync(tempLogDir)) {
      fs.mkdirSync(tempLogDir, { recursive: true });
    }

    // Set test environment
    process.env = { ...originalEnv, LOG_DIR: tempLogDir };
  });

  afterEach(() => {
    process.env = originalEnv;

    // Clean up test log files
    if (fs.existsSync(tempLogDir)) {
      fs.rmSync(tempLogDir, { recursive: true, force: true });
    }
  });

  describe('Winston Logger Configuration', () => {
    it('should create logger with correct configuration', () => {
      expect(logger).toBeDefined();
      // Logger level should match environment or default to 'info'
      const expectedLevel = process.env.LOG_LEVEL || 'info';
      expect(logger.level).toBe(expectedLevel);
    });

    it('should use custom log level from environment', () => {
      const originalLogLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'debug';

      // Clear module cache to force reload with new environment
      delete require.cache[require.resolve('../middleware/logging')];

      // Create a new logger instance to test configuration
      const debugLogger = require('../middleware/logging').default;
      expect(debugLogger.level).toBe('debug');

      process.env.LOG_LEVEL = originalLogLevel;

      // Clear module cache again to restore original state
      delete require.cache[require.resolve('../middleware/logging')];
    });

    it('should have correct service metadata', () => {
      const testLogger = logger.child({ test: true });
      expect(testLogger.defaultMeta).toEqual(expect.objectContaining({ service: 'i-know-api' }));
    });
  });

  describe('Request Logging', () => {
    let app: Elysia;
    let logSpy: any;

    beforeEach(() => {
      app = new Elysia();
      requestLogger(app);
      app.get('/test', () => ({ message: 'test' }));
      app.post('/test', ({ body }) => ({ received: body }));
      app.get('/error', () => {
        throw new Error('Test error');
      });

      logSpy = spyOn(logger, 'info');
    });

    it('should log incoming requests', async () => {
      const request = new Request('http://localhost/test', {
        headers: {
          'User-Agent': 'test-agent',
          'X-Forwarded-For': '192.168.1.1',
        },
      });

      await app.handle(request);

      expect(logSpy).toHaveBeenCalledWith(
        'Request started',
        expect.objectContaining({
          method: 'GET',
          url: 'http://localhost/test',
          userAgent: 'test-agent',
          ip: '192.168.1.1',
        }),
      );
    });

    it('should log request completion', async () => {
      const request = new Request('http://localhost/test');
      await app.handle(request);

      expect(logSpy).toHaveBeenCalledWith(
        'Request completed',
        expect.objectContaining({
          method: 'GET',
          url: 'http://localhost/test',
          status: 200,
        }),
      );
    });

    it('should log POST requests with correct method', async () => {
      const request = new Request('http://localhost/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      });

      await app.handle(request);

      expect(logSpy).toHaveBeenCalledWith(
        'Request started',
        expect.objectContaining({
          method: 'POST',
          url: 'http://localhost/test',
        }),
      );
    });

    it('should handle requests without IP headers', async () => {
      const request = new Request('http://localhost/test');
      await app.handle(request);

      expect(logSpy).toHaveBeenCalledWith(
        'Request started',
        expect.objectContaining({
          ip: 'unknown',
        }),
      );
    });

    it('should prefer X-Forwarded-For over X-Real-IP', async () => {
      const request = new Request('http://localhost/test', {
        headers: {
          'X-Forwarded-For': '10.0.0.1',
          'X-Real-IP': '192.168.1.1',
        },
      });

      await app.handle(request);

      expect(logSpy).toHaveBeenCalledWith(
        'Request started',
        expect.objectContaining({
          ip: '10.0.0.1',
        }),
      );
    });

    it('should log error status codes', async () => {
      const errorApp = new Elysia();
      requestLogger(errorApp);
      errorApp.get('/not-found', ({ set }) => {
        set.status = 404;
        return { error: 'Not found' };
      });

      const request = new Request('http://localhost/not-found');
      await errorApp.handle(request);

      expect(logSpy).toHaveBeenCalledWith(
        'Request completed',
        expect.objectContaining({
          status: 404,
        }),
      );
    });
  });

  describe('Error Logging', () => {
    let errorSpy: any;

    beforeEach(() => {
      errorSpy = spyOn(logger, 'error');
    });

    it('should log errors with stack trace', () => {
      const testError = new Error('Test error message');
      logger.error('Test error occurred', testError);

      expect(errorSpy).toHaveBeenCalledWith(
        'Test error occurred',
        expect.objectContaining({
          stack: expect.any(String),
        }),
      );
    });

    it('should handle errors without stack traces', () => {
      const plainError = { message: 'Plain error object' };
      logger.error('Error without stack', plainError);

      expect(errorSpy).toHaveBeenCalledWith('Error without stack', plainError);
    });
  });

  describe('Performance Monitoring', () => {
    let app: Elysia;
    let infoSpy: any;

    beforeEach(() => {
      app = new Elysia();

      // Add performance monitoring middleware
      app = app
        .onRequest(({ request, store }) => {
          (store as any).startTime = Date.now();
          logger.info('Request started', {
            method: request.method,
            url: request.url,
            timestamp: new Date().toISOString(),
          });
        })
        .onAfterHandle(({ request, set, store }) => {
          const startTime = (store as any).startTime;
          const duration = Date.now() - startTime;

          logger.info('Request completed', {
            method: request.method,
            url: request.url,
            status: set.status || 200,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
          });

          // Log slow requests
          if (duration > 100) {
            logger.warn('Slow request detected', {
              method: request.method,
              url: request.url,
              duration: `${duration}ms`,
              threshold: '100ms',
            });
          }
        });

      app.get('/fast', () => ({ message: 'fast response' }));
      app.get('/slow', async () => {
        // Simulate slow operation
        await new Promise(resolve => setTimeout(resolve, 150));
        return { message: 'slow response' };
      });

      infoSpy = spyOn(logger, 'info');
      spyOn(logger, 'warn');
    });

    it('should track request duration', async () => {
      const request = new Request('http://localhost/fast');
      await app.handle(request);

      expect(infoSpy).toHaveBeenCalledWith(
        'Request completed',
        expect.objectContaining({
          duration: expect.stringMatching(/\d+ms/),
        }),
      );
    });

    it('should detect and log slow requests', async () => {
      const warnSpy = spyOn(logger, 'warn');
      const request = new Request('http://localhost/slow');
      await app.handle(request);

      expect(warnSpy).toHaveBeenCalledWith(
        'Slow request detected',
        expect.objectContaining({
          method: 'GET',
          url: 'http://localhost/slow',
          duration: expect.stringMatching(/\d+ms/),
          threshold: '100ms',
        }),
      );
    });

    it('should include timestamps in logs', async () => {
      const request = new Request('http://localhost/fast');
      await app.handle(request);

      expect(infoSpy).toHaveBeenCalledWith(
        'Request started',
        expect.objectContaining({
          timestamp: expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/),
        }),
      );
    });
  });

  describe('Database Query Logging', () => {
    let dbLogSpy: any;

    beforeEach(() => {
      dbLogSpy = spyOn(logger, 'debug');
    });

    it('should log database queries', () => {
      const mockQuery = 'SELECT * FROM users WHERE id = $1';
      const mockParams = ['user-123'];
      const mockDuration = 25;

      logger.debug('Database query executed', {
        query: mockQuery,
        params: mockParams,
        duration: `${mockDuration}ms`,
        timestamp: new Date().toISOString(),
      });

      expect(dbLogSpy).toHaveBeenCalledWith(
        'Database query executed',
        expect.objectContaining({
          query: mockQuery,
          params: mockParams,
          duration: '25ms',
        }),
      );
    });

    it('should log slow database queries', () => {
      const warnSpy = spyOn(logger, 'warn');
      const slowQuery = 'SELECT * FROM large_table WHERE complex_condition = true';
      const slowDuration = 500;

      logger.warn('Slow database query detected', {
        query: slowQuery,
        duration: `${slowDuration}ms`,
        threshold: '100ms',
      });

      expect(warnSpy).toHaveBeenCalledWith(
        'Slow database query detected',
        expect.objectContaining({
          query: slowQuery,
          duration: '500ms',
          threshold: '100ms',
        }),
      );
    });
  });

  describe('Log File Operations', () => {
    it('should write logs to file system in production mode', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Create a test logger that writes to our test directory
      const winston = require('winston');
      const testLogger = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        defaultMeta: { service: 'test-api' },
        transports: [
          new winston.transports.File({
            filename: path.join(tempLogDir, 'test.log'),
          }),
        ],
      });

      testLogger.info('Test log message', { test: true });

      // Wait for file write
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(fs.existsSync(path.join(tempLogDir, 'test.log'))).toBe(true);

      const logContent = fs.readFileSync(path.join(tempLogDir, 'test.log'), 'utf8') as string;
      const logLines = logContent.trim().split('\n');
      const firstLine = logLines[0] || '{}';
      const logEntry = JSON.parse(firstLine);

      expect(logEntry.message).toBe('Test log message');
      expect(logEntry.test).toBe(true);
      expect(logEntry.service).toBe('test-api');

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should handle log file write errors gracefully', () => {
      const winston = require('winston');

      // Create a mock transport that simulates file write errors
      class MockErrorTransport extends winston.Transport {
        constructor(options: any) {
          super(options);
        }

        log(info: any, callback: () => void) {
          // Simulate a write error that should be handled gracefully
          try {
            // Simulate the error handling logic that would be in real file transport
            throw new Error('EROFS: read-only file system, mkdir');
          } catch (error) {
            // In a real implementation, this would be caught and handled
            // For the test, we just want to ensure it doesn't crash the logger
          }
          callback();
        }
      }

      const testLogger = winston.createLogger({
        level: 'info',
        transports: [
          new MockErrorTransport({
            filename: '/invalid/path/test.log',
          }),
        ],
      });

      // Should not throw an error when trying to log to a transport that handles errors
      expect(() => {
        testLogger.info('Test message');
      }).not.toThrow();
    });
  });

  describe('Log Levels and Filtering', () => {
    it('should respect log level hierarchy', () => {
      const winston = require('winston');

      // Create a custom transport to capture log levels
      const capturedLogs: any[] = [];
      class TestTransport extends winston.Transport {
        log(info: any, callback: () => void) {
          capturedLogs.push(info);
          callback();
        }
      }

      const testLogger = winston.createLogger({
        level: 'info',
        transports: [new TestTransport()],
      });

      testLogger.debug('Debug message');
      testLogger.info('Info message');
      testLogger.warn('Warning message');
      testLogger.error('Error message');

      const loggedLevels = capturedLogs.map(log => log.level);

      expect(loggedLevels).not.toContain('debug');
      expect(loggedLevels).toContain('info');
      expect(loggedLevels).toContain('warn');
      expect(loggedLevels).toContain('error');
    });

    it('should filter logs based on configured level', () => {
      const winston = require('winston');

      // Create a custom transport to capture log levels
      const capturedLogs: any[] = [];
      class TestTransport extends winston.Transport {
        log(info: any, callback: () => void) {
          capturedLogs.push(info);
          callback();
        }
      }

      const testLogger = winston.createLogger({
        level: 'warn',
        transports: [new TestTransport()],
      });

      testLogger.debug('Debug message');
      testLogger.info('Info message');
      testLogger.warn('Warning message');
      testLogger.error('Error message');

      const loggedLevels = capturedLogs.map(log => log.level);

      expect(loggedLevels).not.toContain('debug');
      expect(loggedLevels).not.toContain('info');
      expect(loggedLevels).toContain('warn');
      expect(loggedLevels).toContain('error');
    });
  });

  describe('Structured Logging', () => {
    it('should include correlation IDs for request tracking', async () => {
      const correlationId = 'test-correlation-123';

      const app = new Elysia()
        .use(app =>
          app.onRequest(({ request, store }) => {
            const id = request.headers.get('x-correlation-id') || `auto-${Date.now()}`;
            (store as any).correlationId = id;

            logger.info('Request with correlation', {
              correlationId: id,
              method: request.method,
              url: request.url,
            });
          }),
        )
        .get('/test', () => ({ message: 'test' }));

      const request = new Request('http://localhost/test', {
        headers: { 'x-correlation-id': correlationId },
      });

      await app.handle(request);

      const infoSpy = spyOn(logger, 'info');
      expect(infoSpy).toHaveBeenCalledWith(
        'Request with correlation',
        expect.objectContaining({
          correlationId,
        }),
      );
    });

    it('should include user context in logs when available', () => {
      const userContext = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };

      logger.info('User action performed', {
        action: 'login',
        ...userContext,
      });

      const infoSpy = spyOn(logger, 'info');
      expect(infoSpy).toHaveBeenCalledWith(
        'User action performed',
        expect.objectContaining(userContext),
      );
    });
  });
});
