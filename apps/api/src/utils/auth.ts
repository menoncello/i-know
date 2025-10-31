import bcrypt from 'bcrypt';
import { jwt } from '@elysiajs/jwt';
import type { Elysia } from 'elysia';
import type { ApiResponse } from '../types';
import config from '../config';
import { Buffer } from 'node:buffer';

export interface JWTPayload {
  sub: string; // user id
  email: string;
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
  };
  token: string;
  refreshToken: string;
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: JWTPayload): string {
  const secret = config.jwt.secret;
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 15 * 60; // 15 minutes

  return Buffer.from(
    JSON.stringify({
      ...payload,
      iat: now,
      exp,
    }),
  ).toString('base64url');
}

/**
 * Generate refresh token (longer lived)
 */
export function generateRefreshToken(): string {
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify JWT access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString());

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expired
    }

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Create JWT middleware for route protection
 */
export const createAuthMiddleware = () => {
  return jwt({
    secret: config.jwt.secret,
  });
};

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
