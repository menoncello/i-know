import winston from 'winston';
import type { Elysia } from 'elysia';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'i-know-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  );
}

export const requestLogger = (app: Elysia) =>
  app
    .onRequest(({ request }) => {
      logger.info('Request started', {
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      });
    })
    .onAfterHandle(({ request, set }) => {
      logger.info('Request completed', {
        method: request.method,
        url: request.url,
        status: set.status || 200,
      });
    });

export default logger;
