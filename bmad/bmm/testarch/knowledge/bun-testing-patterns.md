# Bun Testing Patterns

## Principle

Use Bun Test for unit and integration tests with TypeScript strict mode compliance. Leverage Bun's built-in test runner for optimal performance and zero-config setup.

## Test Structure

### Basic Test Pattern

```typescript
import { test, expect } from 'bun:test';

test('should create user with valid data', async () => {
  // Given
  const userData = {
    email: 'test@example.com',
    name: 'Test User',
  };

  // When
  const user = await createUser(userData);

  // Then
  expect(user.id).toBeDefined();
  expect(user.email).toBe(userData.email);
  expect(user.name).toBe(userData.name);
});
```

### Test Suite Organization

```typescript
import { describe, test, expect } from 'bun:test';

describe('UserService', () => {
  describe('createUser', () => {
    test('should create user with valid data', async () => {
      // Given
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      // When
      const user = await createUser(userData);

      // Then
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
    });

    test('should throw error for duplicate email', async () => {
      // Given
      const existingEmail = 'existing@example.com';
      await createUser({ email: existingEmail, name: 'Existing User' });

      // When/Then
      await expect(createUser({ email: existingEmail, name: 'New User' })).toThrow(
        'Email already exists',
      );
    });
  });
});
```

## Best Practices

### 1. Given-When-Then Structure

Always use Given-When-Then comments for test clarity:

```typescript
test('should authenticate user with valid credentials', async () => {
  // Given
  const user = await createTestUser({
    email: 'user@example.com',
    password: 'password123',
  });

  // When
  const result = await authenticateUser(user.email, 'password123');

  // Then
  expect(result.success).toBe(true);
  expect(result.user.id).toBe(user.id);
});
```

### 2. Test Data Management

Use factory functions for test data:

```typescript
// test-factories.ts
export function createTestUser(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    ...overrides,
  };
}

// test file
import { createTestUser } from '../test-factories';

test('should update user profile', async () => {
  // Given
  const user = createTestUser();
  const updateData = { name: 'Updated Name' };

  // When
  const updatedUser = await updateUser(user.id, updateData);

  // Then
  expect(updatedUser.name).toBe(updateData.name);
});
```

### 3. Async Testing

Handle async operations correctly:

```typescript
test('should handle async database operations', async () => {
  // Given
  const userId = 'user-123';

  // When
  const user = await getUserById(userId);
  const preferences = await getUserPreferences(userId);

  // Then
  expect(user).toBeDefined();
  expect(preferences).toBeDefined();
  expect(preferences.userId).toBe(userId);
});
```

### 4. Error Testing

Test error scenarios properly:

```typescript
test('should throw validation error for invalid data', async () => {
  // Given
  const invalidData = {
    email: 'invalid-email',
    name: '', // Empty name
  };

  // When/Then
  await expect(createUser(invalidData)).toThrow(new ValidationError('Invalid email format'));
});
```

### 5. Mocking and Spying

Use Bun's mocking capabilities:

```typescript
import { beforeEach, afterEach, mock } from 'bun:test';

const mockEmailService = mock(() => ({
  sendEmail: async (to: string, subject: string) => {
    return { success: true, messageId: 'msg-123' };
  },
}));

beforeEach(() => {
  // Setup mocks
  mockEmailService.mockClear();
});

test('should send welcome email after user registration', async () => {
  // Given
  const emailService = mockEmailService();
  const userService = new UserService(emailService);

  // When
  await userService.registerUser({
    email: 'newuser@example.com',
    name: 'New User',
  });

  // Then
  expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
  expect(emailService.sendEmail).toHaveBeenCalledWith('newuser@example.com', 'Welcome to I Know!');
});
```

## Integration Testing

### Database Integration

```typescript
test('should create and retrieve user from database', async () => {
  // Given
  const userData = {
    email: 'integration@example.com',
    name: 'Integration Test User',
  };

  // When
  const createdUser = await userService.createUser(userData);
  const retrievedUser = await userService.getUserById(createdUser.id);

  // Then
  expect(retrievedUser).toEqual(createdUser);
  expect(retrievedUser.email).toBe(userData.email);
});
```

### API Integration

```typescript
test('should handle user registration API endpoint', async () => {
  // Given
  const app = createApp();
  const userData = {
    email: 'api@example.com',
    name: 'API Test User',
  };

  // When
  const response = await app.handle(
    new Request('http://localhost/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }),
  );

  // Then
  expect(response.status).toBe(201);
  const result = await response.json();
  expect(result.data.email).toBe(userData.email);
});
```

## Quality Gates Compliance

### TypeScript Strict Mode

All tests must pass TypeScript strict mode:

```typescript
// ✅ Good - Proper typing
test('should handle typed user data', async () => {
  const userData: CreateUserData = {
    email: 'test@example.com',
    name: 'Test User',
  };

  const user: User = await createUser(userData);
  expect(user.id).toBeDefined();
});

// ❌ Bad - Using 'any'
test('should handle typed user data', async () => {
  const userData: any = {
    /* ... */
  }; // AVOID
});
```

### ESLint Compliance

Tests must pass ESLint validation:

```typescript
// ✅ Good - No unused variables
test('should create user', async () => {
  const userData = { email: 'test@example.com', name: 'Test' };
  const user = await createUser(userData);
  expect(user.id).toBeDefined();
});

// ❌ Bad - Unused variables
test('should create user', async () => {
  const userData = { email: 'test@example.com', name: 'Test' };
  const unused = 'variable'; // ESLint error
  const user = await createUser(userData);
  expect(user.id).toBeDefined();
});
```

## File Organization

```
tests/
├── unit/
│   ├── services/
│   │   ├── user-service.test.ts
│   │   └── actor-service.test.ts
│   ├── utils/
│   │   └── validation.test.ts
│   └── test-factories.ts
├── integration/
│   ├── api/
│   │   └── user-api.test.ts
│   └── database/
│       └── user-repository.test.ts
└── e2e/
    └── user-workflow.test.ts
```

## Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/unit/services/user-service.test.ts

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

## Common Patterns

### 1. Test Setup/Teardown

```typescript
import { beforeEach, afterEach } from 'bun:test';

describe('UserService', () => {
  let userService: UserService;
  let testDb: TestDatabase;

  beforeEach(async () => {
    testDb = new TestDatabase();
    await testDb.setup();
    userService = new UserService(testDb.connection);
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  test('should work with clean database', async () => {
    // Test implementation
  });
});
```

### 2. Parameterized Tests

```typescript
test.each([
  { email: 'valid@example.com', expected: true },
  { email: 'invalid-email', expected: false },
  { email: '', expected: false },
])('should validate email: $email', ({ email, expected }) => {
  expect(validateEmail(email)).toBe(expected);
});
```

### 3. Environment-Specific Tests

```typescript
test.skip(process.env.NODE_ENV === 'production', 'should run development-only tests', () => {
  // Development-specific test logic
});
```

---

This pattern guide ensures all Bun tests in the I Know project follow consistent, maintainable practices that comply with the project's strict quality standards.
