import { Elysia } from 'elysia';
import type { ApiResponse, LoginRequest, RegisterRequest, AuthResponse } from '../../types';

const authRoutes = new Elysia({ prefix: '/auth' })
  .post('/register', async ({ body }) => {
    const { email, password } = body as RegisterRequest;

    // Mock implementation for now - will be connected to database in future stories
    const { hashPassword, generateAccessToken, generateRefreshToken } = await import(
      '../../utils/auth'
    );
    const passwordHash = await hashPassword(password);

    // Mock user creation
    const mockUser = {
      id: 'mock-user-id',
      email: email,
      password_hash: passwordHash,
    };

    const token = generateAccessToken({ sub: mockUser.id, email: mockUser.email });
    const refreshToken = generateRefreshToken();

    return {
      success: true,
      data: {
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
        token,
        refreshToken,
      },
    } as ApiResponse<AuthResponse>;
  })
  .post('/login', async ({ body }) => {
    const { email, password } = body as LoginRequest;

    // Mock implementation for now - will be connected to database in future stories
    const { verifyPassword, generateAccessToken, generateRefreshToken } = await import(
      '../../utils/auth'
    );

    // Mock user lookup
    const mockUser = {
      id: 'mock-user-id',
      email: email,
      password_hash: await (await import('../../utils/auth')).hashPassword('mockpassword'),
    };

    const isPasswordValid = await verifyPassword(password, mockUser.password_hash);

    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Invalid credentials',
      } as ApiResponse;
    }

    const token = generateAccessToken({ sub: mockUser.id, email: mockUser.email });
    const refreshToken = generateRefreshToken();

    return {
      success: true,
      data: {
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
        token,
        refreshToken,
      },
    } as ApiResponse<AuthResponse>;
  })
  .post('/refresh', async ({ body }) => {
    const { generateAccessToken, generateRefreshToken } = await import('../../utils/auth');
    const { userId, email } = body as any;

    const token = generateAccessToken({ sub: userId, email });
    const refreshToken = generateRefreshToken();

    return {
      success: true,
      data: {
        token,
        refreshToken,
      },
    } as ApiResponse;
  });

export default authRoutes;
