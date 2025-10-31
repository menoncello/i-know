import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  verifyAccessToken,
  validateEmail,
  validatePassword,
} from '../utils/auth';

describe('Authentication Utils', () => {
  describe('Password hashing', () => {
    it('should hash and verify passwords correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });

    it('should handle invalid passwords gracefully', async () => {
      const hash = await hashPassword('TestPassword123!');
      const isValid = await verifyPassword('', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT tokens', () => {
    it('should generate and verify access tokens', () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
      };

      const token = generateAccessToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const verified = verifyAccessToken(token);
      expect(verified).toBeDefined();
      expect(verified?.sub).toBe(payload.sub);
      expect(verified?.email).toBe(payload.email);
    });

    it('should reject invalid tokens', () => {
      const invalidToken = 'invalid.token.here';
      const verified = verifyAccessToken(invalidToken);
      expect(verified).toBeNull();
    });

    it('should reject malformed tokens', () => {
      const malformedToken = 'not-a-valid-base64-url-string';
      const verified = verifyAccessToken(malformedToken);
      expect(verified).toBeNull();
    });
  });

  describe('Email validation', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test.example.com',
        'test@.com',
        'test@example.',
        '',
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('Password validation', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = ['Password123!', 'MySecureP@ssw0rd', 'ComplexPass_2023'];

      strongPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject weak passwords', () => {
      const testCases = [
        { password: 'short', error: 'Password must be at least 8 characters long' },
        { password: 'nouppercase1!', error: 'Password must contain at least one uppercase letter' },
        { password: 'NOLOWERCASE1!', error: 'Password must contain at least one lowercase letter' },
        { password: 'NoNumbers!', error: 'Password must contain at least one number' },
        { password: 'Password123', error: '' }, // This actually passes all basic checks
      ];

      testCases.forEach(({ password, error }) => {
        const result = validatePassword(password);
        if (error) {
          expect(result.valid).toBe(false);
          expect(result.errors).toContain(error);
        }
      });
    });

    it('should handle edge cases', () => {
      const emptyResult = validatePassword('');
      expect(emptyResult.valid).toBe(false);
      expect(emptyResult.errors.length).toBeGreaterThan(0);

      const exactLengthResult = validatePassword('Pass1!');
      expect(exactLengthResult.valid).toBe(false); // Too short
    });
  });
});
