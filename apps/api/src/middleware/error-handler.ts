import type { Elysia } from 'elysia';
import type { ApiResponse } from '../types';

export const errorHandler = (app: Elysia) =>
  app.onError(({ code, error, set }) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('API Error:', {
      code,
      message: errorMessage,
      stack: errorStack,
    });

    switch (code) {
      case 'VALIDATION':
        set.status = 400;
        return {
          success: false,
          error: 'Validation failed',
          details: 'all' in error ? error.all : undefined,
        } as ApiResponse;

      case 'NOT_FOUND':
        set.status = 404;
        return {
          success: false,
          error: 'Resource not found',
        } as ApiResponse;

      case 'INTERNAL_SERVER_ERROR':
        set.status = 500;
        return {
          success: false,
          error: 'Internal server error',
        } as ApiResponse;

      default:
        set.status = 500;
        return {
          success: false,
          error: 'An unexpected error occurred',
        } as ApiResponse;
    }
  });
