import { faker } from '@faker-js/faker';

// Types for authentication entities
export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  passwordHash: string;
  role: 'user' | 'admin' | 'moderator';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface UserPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showLastSeen: boolean;
  };
  customSettings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Factory functions
export const createUser = (overrides: Partial<User> = {}): User => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  password: faker.internet.password({ length: 12, memorable: true }),
  passwordHash: '$2b$10$' + faker.string.alphanumeric(53), // Mock bcrypt hash
  role: 'user',
  isActive: true,
  emailVerified: true,
  createdAt: faker.date.recent().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  lastLoginAt: faker.date.recent().toISOString(),
  ...overrides,
});

export const createUsers = (count: number, overrides: Partial<User> = {}): User[] =>
  Array.from({ length: count }, () => createUser(overrides));

export const createAdminUser = (overrides: Partial<User> = {}): User =>
  createUser({
    role: 'admin',
    email: 'admin@example.com',
    isActive: true,
    ...overrides,
  });

export const createInactiveUser = (overrides: Partial<User> = {}): User =>
  createUser({
    isActive: false,
    emailVerified: false,
    ...overrides,
  });

export const createAuthTokens = (overrides: Partial<AuthTokens> = {}): AuthTokens => ({
  accessToken: faker.string.alphanumeric(256),
  refreshToken: faker.string.alphanumeric(256),
  expiresIn: 3600, // 1 hour
  tokenType: 'Bearer',
  ...overrides,
});

export const createExpiredAuthTokens = (overrides: Partial<AuthTokens> = {}): AuthTokens => ({
  accessToken: faker.string.alphanumeric(256),
  refreshToken: faker.string.alphanumeric(256),
  expiresIn: -3600, // Expired
  tokenType: 'Bearer',
  ...overrides,
});

export const createUserPreferences = (
  userId: string,
  overrides: Partial<UserPreferences> = {},
): UserPreferences => ({
  id: faker.string.uuid(),
  userId,
  theme: 'system',
  language: 'en',
  timezone: 'UTC',
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
  privacy: {
    profileVisibility: 'public',
    showEmail: false,
    showLastSeen: true,
  },
  customSettings: {},
  createdAt: faker.date.recent().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides,
});

// Test data generators
export const generateValidUserData = () => ({
  email: faker.internet.email(),
  password: 'SecurePass123!', // Valid password for testing
  name: faker.person.fullName(),
});

export const generateInvalidUserData = () => ({
  email: 'invalid-email-format',
  password: '123', // Too weak
  name: '', // Empty name
});

export const generateWeakPasswordData = () => ({
  email: faker.internet.email(),
  password: 'weak', // Weak password
  name: faker.person.fullName(),
});

// Mock password hasher for testing
export const mockPasswordHash = (password: string): string => {
  // Simple mock hash - in real implementation, use bcrypt
  return `$2b$10$${Buffer.from(password).toString('base64').padEnd(53, '0').slice(0, 53)}`;
};

// Mock password verifier for testing
export const mockPasswordVerify = (password: string, hash: string): boolean => {
  // Simple mock verification - in real implementation, use bcrypt.compare
  const mockHash = mockPasswordHash(password);
  return hash === mockHash;
};
