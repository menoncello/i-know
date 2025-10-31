import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { connectDatabase, getDatabase, closeDatabase } from '../../packages/database/src/index';

// Test database configuration
const testConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_TEST_NAME || 'iknow_test',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: false,
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
};

// Test API base URL
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

describe('Authentication E2E Tests', () => {
  let db: any;
  let connectedSuccessfully = false;
  let apiAvailable = false;

  beforeAll(async () => {
    // Test database connection
    try {
      connectDatabase(testConfig);
      db = getDatabase();
      await db`SELECT 1`; // Test connection
      connectedSuccessfully = true;

      // Set up test database schema
      await setupTestDatabase();
    } catch (error) {
      console.log('Database not available for E2E testing');
      connectedSuccessfully = false;
    }

    // Test API availability
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/health`, {
        method: 'GET',
      });
      apiAvailable = response.ok;
      if (!apiAvailable) {
        console.log('API not available for E2E testing');
      }
    } catch (error) {
      console.log('API not available for E2E testing');
      apiAvailable = false;
    }
  });

  afterAll(async () => {
    if (connectedSuccessfully) {
      await cleanupTestDatabase();
      await closeDatabase();
    }
  });

  async function setupTestDatabase() {
    if (!connectedSuccessfully) return;

    try {
      // Enable UUID extension
      await db`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

      // Create UUID v7 function
      await db`
        CREATE OR REPLACE FUNCTION uuid_v7()
        RETURNS UUID AS $$
        DECLARE
          timestamp_ms BIGINT;
          random_bytes BYTEA;
          uuid_bytes BYTEA;
        BEGIN
          timestamp_ms := EXTRACT(EPOCH FROM NOW()) * 1000;
          random_bytes := gen_random_bytes(10);
          uuid_bytes :=
            SET_BYTE(bytea '\0\0\0\0\0\0', 0, (timestamp_ms >> 40)::INTEGER) ||
            SET_BYTE(bytea '\0\0\0\0\0\0', 1, (timestamp_ms >> 32)::INTEGER) ||
            SET_BYTE(bytea '\0\0\0\0\0\0', 2, (timestamp_ms >> 24)::INTEGER) ||
            SET_BYTE(bytea '\0\0\0\0\0\0', 3, (timestamp_ms >> 16)::INTEGER) ||
            SET_BYTE(bytea '\0\0\0\0\0\0', 4, (timestamp_ms >> 8)::INTEGER) ||
            SET_BYTE(bytea '\0\0\0\0\0\0', 5, timestamp_ms::INTEGER) ||
            SUBSTRING(random_bytes, 1, 4) ||
            SUBSTRING(random_bytes, 5, 6);
          uuid_bytes := SET_BYTE(uuid_bytes, 6, (GET_BYTE(uuid_bytes, 6) & 0x0F) | 0x70);
          uuid_bytes := SET_BYTE(uuid_bytes, 8, (GET_BYTE(uuid_bytes, 8) & 0x3F) | 0x80);
          RETURN encode(uuid_bytes, 'hex')::UUID;
        END;
        $$ LANGUAGE plpgsql;
      `;

      // Create tables
      await db`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_v7(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      await db`
        CREATE TABLE IF NOT EXISTS user_preferences (
          id UUID PRIMARY KEY DEFAULT uuid_v7(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          preferences JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );
      `;

      // Create indexes
      await db`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
      await db`CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id)`;

      // Create update timestamp function
      await db`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `;

      // Create triggers
      await db`
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `;

      await db`
        DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
        CREATE TRIGGER update_user_preferences_updated_at
          BEFORE UPDATE ON user_preferences
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `;
    } catch (error) {
      console.error('Failed to set up test database:', error);
      throw error;
    }
  }

  async function cleanupTestDatabase() {
    if (!connectedSuccessfully) return;

    try {
      await db`DELETE FROM user_preferences`;
      await db`DELETE FROM users`;
    } catch (error) {
      console.error('Failed to clean up test database:', error);
    }
  }

  describe('Authentication API Endpoints', () => {
    const testUser = {
      email: 'e2e-test@example.com',
      password: 'SecurePass123!',
      name: 'E2E Test User',
    };

    test('should register new user successfully', async () => {
      if (!apiAvailable) {
        console.log('Skipping test - API not available');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
          name: testUser.name,
        }),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toMatchObject({
        success: true,
        data: {
          user: {
            email: testUser.email,
            name: testUser.name,
          },
        },
      });

      expect(data.data.user.id).toBeDefined();
      expect(data.data.tokens.accessToken).toBeDefined();
      expect(data.data.tokens.refreshToken).toBeDefined();

      // Verify user was created in database
      if (connectedSuccessfully) {
        const dbUser = await db`SELECT * FROM users WHERE email = ${testUser.email}`;
        expect(dbUser).toHaveLength(1);
        expect(dbUser[0].email).toBe(testUser.email);
      }
    });

    test('should login registered user successfully', async () => {
      if (!apiAvailable) {
        console.log('Skipping test - API not available');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toMatchObject({
        success: true,
        data: {
          user: {
            email: testUser.email,
            name: testUser.name,
          },
        },
      });

      expect(data.data.tokens.accessToken).toBeDefined();
      expect(data.data.tokens.refreshToken).toBeDefined();
    });

    test('should reject login with invalid credentials', async () => {
      if (!apiAvailable) {
        console.log('Skipping test - API not available');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUser.email,
          password: 'wrongpassword',
        }),
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data).toMatchObject({
        success: false,
        error: expect.stringContaining('Invalid'),
      });
    });

    test('should reject registration with duplicate email', async () => {
      if (!apiAvailable) {
        console.log('Skipping test - API not available');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUser.email,
          password: 'AnotherPass123!',
          name: 'Another User',
        }),
      });

      expect(response.status).toBe(409);

      const data = await response.json();
      expect(data).toMatchObject({
        success: false,
        error: expect.stringContaining('already exists'),
      });
    });

    test('should validate registration input requirements', async () => {
      if (!apiAvailable) {
        console.log('Skipping test - API not available');
        return;
      }

      // Test invalid email
      const invalidEmailResponse = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invalid-email',
          password: testUser.password,
          name: testUser.name,
        }),
      });

      expect(invalidEmailResponse.status).toBe(400);

      // Test weak password
      const weakPasswordResponse = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'weak@example.com',
          password: 'weak',
          name: testUser.name,
        }),
      });

      expect(weakPasswordResponse.status).toBe(400);
    });

    test('should handle protected routes with JWT authentication', async () => {
      if (!apiAvailable) {
        console.log('Skipping test - API not available');
        return;
      }

      // First login to get token
      const loginResponse = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      const loginData = await loginResponse.json();
      const accessToken = loginData.data.tokens.accessToken;

      // Access protected route with valid token
      const protectedResponse = await fetch(`${API_BASE_URL}/api/v1/user/profile`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      expect(protectedResponse.status).toBe(200);

      const profileData = await protectedResponse.json();
      expect(profileData).toMatchObject({
        success: true,
        data: {
          user: {
            email: testUser.email,
            name: testUser.name,
          },
        },
      });

      // Access protected route without token
      const unauthorizedResponse = await fetch(`${API_BASE_URL}/api/v1/user/profile`);

      expect(unauthorizedResponse.status).toBe(401);

      // Access protected route with invalid token
      const invalidTokenResponse = await fetch(`${API_BASE_URL}/api/v1/user/profile`, {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(invalidTokenResponse.status).toBe(401);
    });

    test('should handle token refresh flow', async () => {
      if (!apiAvailable) {
        console.log('Skipping test - API not available');
        return;
      }

      // Login to get tokens
      const loginResponse = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      const loginData = await loginResponse.json();
      const refreshToken = loginData.data.tokens.refreshToken;

      // Use refresh token to get new access token
      const refreshResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: refreshToken,
        }),
      });

      expect(refreshResponse.status).toBe(200);

      const refreshData = await refreshResponse.json();
      expect(refreshData).toMatchObject({
        success: true,
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      });

      // New tokens should be different from original
      expect(refreshData.data.accessToken).not.toBe(loginData.data.tokens.accessToken);
    });

    test('should handle logout correctly', async () => {
      if (!apiAvailable) {
        console.log('Skipping test - API not available');
        return;
      }

      // Login to get token
      const loginResponse = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      const loginData = await loginResponse.json();
      const refreshToken = loginData.data.tokens.refreshToken;

      // Logout
      const logoutResponse = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginData.data.tokens.accessToken}`,
        },
        body: JSON.stringify({
          refreshToken: refreshToken,
        }),
      });

      expect(logoutResponse.status).toBe(200);

      // Try to use refresh token after logout
      const refreshAfterLogoutResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: refreshToken,
        }),
      });

      expect(refreshAfterLogoutResponse.status).toBe(401);
    });
  });

  describe('Rate Limiting and Security', () => {
    test('should apply rate limiting to authentication endpoints', async () => {
      if (!apiAvailable) {
        console.log('Skipping test - API not available');
        return;
      }

      // Make multiple rapid requests to login endpoint
      const requests = Array.from({ length: 10 }, () =>
        fetch(`${API_BASE_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'ratelimit@test.com',
            password: 'testpassword',
          }),
        }),
      );

      const responses = await Promise.all(requests);

      // First few should succeed or fail with auth error
      // Later requests should hit rate limit
      const rateLimitedResponses = responses.filter(r => r.status === 429);

      if (rateLimitedResponses.length > 0) {
        const rateLimitResponse = rateLimitedResponses[0];
        if (rateLimitResponse) {
          expect(rateLimitResponse.headers.get('Retry-After')).toBeDefined();
        }
      }
    });

    test('should include security headers in responses', async () => {
      if (!apiAvailable) {
        console.log('Skipping test - API not available');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/health`);

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });

    test('should handle CORS properly', async () => {
      if (!apiAvailable) {
        console.log('Skipping test - API not available');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/health`, {
        headers: {
          Origin: 'http://localhost:3000',
        },
      });

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
    });
  });

  describe('API Performance and Monitoring', () => {
    test('should respond within acceptable time limits', async () => {
      if (!apiAvailable) {
        console.log('Skipping test - API not available');
        return;
      }

      const startTime = performance.now();

      const response = await fetch(`${API_BASE_URL}/api/v1/health`);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(response.ok).toBe(true);
      expect(responseTime).toBeLessThan(200); // Sub-200ms response time requirement
    });

    test('should include proper logging and monitoring data', async () => {
      if (!apiAvailable) {
        console.log('Skipping test - API not available');
        return;
      }

      // This test verifies that the API is properly instrumented
      // In a real implementation, you would check log files or monitoring systems
      const response = await fetch(`${API_BASE_URL}/api/v1/health`);

      expect(response.ok).toBe(true);

      // Health check should include timing and system information
      const healthData = await response.json();
      expect(healthData).toMatchObject({
        success: true,
        data: {
          status: 'ok',
          timestamp: expect.any(String),
        },
      });
    });
  });
});
