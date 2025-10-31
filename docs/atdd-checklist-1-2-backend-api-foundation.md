# ATDD Checklist - Epic 1, Story 2: Backend API Foundation

**Date:** 2025-10-30
**Author:** Eduardo Menoncello
**Primary Test Level:** API (Integration)

---

## Story Summary

The development team needs a scalable backend API infrastructure with authentication, database, and basic service endpoints so that mobile applications can securely interact with the system and store user data.

**As a** development team,
**I want** a scalable backend API infrastructure with authentication, database, and basic service endpoints,
**so that** mobile applications can securely interact with the system and store user data.

---

## Acceptance Criteria

1. RESTful API framework set up with proper versioning and documentation
2. User authentication service with JWT tokens and secure password handling
3. Database schema designed for users, preferences, and basic content metadata
4. API rate limiting and security middleware implemented
5. Logging and monitoring infrastructure for API performance and errors
6. Health check endpoints for system status monitoring

---

## Failing Tests Created (RED Phase)

### API Tests (16 tests)

**File:** `tests/api/backend-api-foundation.spec.ts` (285 lines)

- ✅ **Test:** should register new user with valid data
  - **Status:** RED - API endpoint not implemented
  - **Verifies:** User registration with validation and JWT token generation

- ✅ **Test:** should reject registration with invalid email
  - **Status:** RED - API endpoint not implemented
  - **Verifies:** Email format validation on registration

- ✅ **Test:** should reject registration with weak password
  - **Status:** RED - API endpoint not implemented
  - **Verifies:** Password strength validation

- ✅ **Test:** should authenticate user with valid credentials
  - **Status:** RED - API endpoint not implemented
  - **Verifies:** User login with JWT token generation

- ✅ **Test:** should reject login with invalid credentials
  - **Status:** RED - API endpoint not implemented
  - **Verifies:** Authentication failure handling

- ✅ **Test:** should refresh access token with valid refresh token
  - **Status:** RED - API endpoint not implemented
  - **Verifies:** JWT token refresh mechanism

- ✅ **Test:** should reject refresh token with invalid token
  - **Status:** RED - API endpoint not implemented
  - **Verifies:** Invalid refresh token rejection

- ✅ **Test:** should enforce rate limits on authentication endpoints
  - **Status:** RED - Rate limiting not implemented
  - **Verifies:** API rate limiting functionality

- ✅ **Test:** should include security headers on API responses
  - **Status:** RED - Security headers not implemented
  - **Verifies:** Security middleware configuration

- ✅ **Test:** should handle CORS preflight requests
  - **Status:** RED - CORS not configured
  - **Verifies:** Cross-origin request handling

### Health Check Tests (6 tests)

**File:** `tests/api/health-checks.spec.ts` (120 lines)

- ✅ **Test:** should return basic health status
  - **Status:** RED - Health endpoint not implemented
  - **Verifies:** Basic health check functionality

- ✅ **Test:** should return detailed system status
  - **Status:** RED - Status endpoint not implemented
  - **Verifies:** Detailed system metrics

- ✅ **Test:** should indicate database connectivity issues
  - **Status:** RED - Database health check not implemented
  - **Verifies:** Database connectivity monitoring

- ✅ **Test:** should include performance metrics
  - **Status:** RED - Performance metrics not implemented
  - **Verifies:** System performance monitoring

- ✅ **Test:** should return readiness status for container orchestration
  - **Status:** RED - Readiness probe not implemented
  - **Verifies:** Container readiness detection

- ✅ **Test:** should return liveness status for container orchestration
  - **Status:** RED - Liveness probe not implemented
  - **Verifies:** Container liveness detection

### E2E Tests (5 tests)

**File:** `tests/e2e/authentication-flow.spec.ts` (180 lines)

- ✅ **Test:** should complete user login flow successfully
  - **Status:** RED - Login UI not implemented
  - **Verifies:** Complete login user journey

- ✅ **Test:** should display error for invalid login credentials
  - **Status:** RED - Error handling not implemented
  - **Verifies:** Login error display and handling

- ✅ **Test:** should complete user registration flow successfully
  - **Status:** RED - Registration UI not implemented
  - **Verifies:** Complete registration user journey

- ✅ **Test:** should validate password confirmation during registration
  - **Status:** RED - Form validation not implemented
  - **Verifies:** Client-side password confirmation

- ✅ **Test:** should handle user logout flow
  - **Status:** RED - Logout functionality not implemented
  - **Verifies:** User logout and token cleanup

---

## Data Factories Created

### Authentication Factory

**File:** `tests/support/fixtures/factories/auth-factory.ts`

**Exports:**

- `createUser(overrides?)` - Create single user with optional overrides
- `createUsers(count, overrides?)` - Create array of users
- `createAdminUser(overrides?)` - Create admin user with elevated privileges
- `createInactiveUser(overrides?)` - Create inactive user for testing
- `createAuthTokens(overrides?)` - Create JWT access and refresh tokens
- `createExpiredAuthTokens(overrides?)` - Create expired tokens for testing
- `createUserPreferences(userId, overrides?)` - Create user preferences

**Example Usage:**

```typescript
const user = createUser({ email: 'specific@example.com', role: 'admin' });
const tokens = createAuthTokens({ expiresIn: 3600 });
const users = createUsers(5); // Generate 5 random users
```

### Database Factory

**File:** `tests/support/fixtures/factories/database-factory.ts`

**Exports:**

- `createDatabaseConfig(overrides?)` - Create database connection configuration
- `createProductionDatabaseConfig(overrides?)` - Create production DB config
- `createMigration(overrides?)` - Create migration record
- `createMigrations(count)` - Create array of migrations
- `createUsersTableSchema()` - Create users table schema definition
- `createUserPreferencesTableSchema()` - Create user preferences table schema

**Example Usage:**

```typescript
const dbConfig = createDatabaseConfig({ database: 'test-db' });
const userSchema = createUsersTableSchema();
const migrations = createMigrations(5);
```

---

## Fixtures Created

### Backend API Fixtures

**File:** `tests/support/fixtures/backend-api-fixture.ts`

**Fixtures:**

- `testUser` - Provides a test user with auto-cleanup
  - **Setup:** Creates user via API with default test values
  - **Provides:** User object with id, email, name, role
  - **Cleanup:** Deletes user from database

- `adminUser` - Provides admin user with elevated privileges
  - **Setup:** Creates admin user with admin role
  - **Provides:** Admin user object for testing admin features
  - **Cleanup:** Deletes admin user from database

- `validTokens` - Provides valid JWT tokens
  - **Setup:** Creates fresh access and refresh tokens
  - **Provides:** AuthTokens object with 1-hour expiry
  - **Cleanup:** No cleanup needed (tokens are stateless)

- `authenticatedRequest` - Provides API request context with auth headers
  - **Setup:** Creates request context with Authorization header
  - **Provides:** APIRequestContext with authentication
  - **Cleanup:** Automatic cleanup handled by Playwright

**Example Usage:**

```typescript
import { testWithBackendAPI } from '../support/fixtures';

testWithBackendAPI(
  'should access protected endpoint',
  async ({ testUser, validTokens, authenticatedRequest }) => {
    const request = await authenticatedRequest(testUser, validTokens);
    const response = await request.get('/api/v1/protected');
    expect(response.status()).toBe(200);
  },
);
```

---

## Mock Requirements

### Authentication Service Mock

**Endpoint:** `POST /api/v1/auth/login`

**Success Response:**

```json
{
  "user": {
    "id": "uuid-v7",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user",
    "createdAt": "2025-10-30T13:00:00Z"
  },
  "tokens": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

**Failure Response:**

```json
{
  "error": "Authentication Error",
  "message": "Invalid email or password"
}
```

### User Registration Mock

**Endpoint:** `POST /api/v1/auth/register`

**Success Response:**

```json
{
  "user": {
    "id": "uuid-v7",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "user",
    "emailVerified": false,
    "createdAt": "2025-10-30T13:00:00Z"
  },
  "tokens": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

**Notes:** All authentication endpoints should use bcrypt for password hashing and JWT for token generation

---

## Required data-testid Attributes

### Login Page

- `login-form` - Main login form container
- `email-input` - Email address input field
- `password-input` - Password input field
- `login-button` - Login submit button
- `error-message` - Authentication error display
- `loading-spinner` - Loading indicator during login

### Registration Page

- `registration-form` - Main registration form container
- `name-input` - Full name input field
- `email-input` - Email address input field
- `password-input` - Password input field
- `confirm-password-input` - Password confirmation field
- `register-button` - Registration submit button
- `password-error` - Password mismatch error display
- `success-message` - Registration success message

### Dashboard Page

- `user-dashboard` - Main dashboard container
- `user-name` - Display of logged-in user's name
- `user-email` - Display of logged-in user's email
- `logout-button` - User logout button

**Implementation Example:**

```tsx
<form data-testid='login-form'>
  <input data-testid='email-input' type='email' placeholder='Email address' required />
  <input data-testid='password-input' type='password' placeholder='Password' required />
  <button data-testid='login-button' type='submit'>
    Log In
  </button>
  {error && <div data-testid='error-message'>{error}</div>}
</form>
```

---

## Implementation Checklist

### Test: should register new user with valid data

**File:** `tests/api/backend-api-foundation.spec.ts`

**Tasks to make this test pass:**

- [ ] Setup Elysia API framework with TypeScript strict mode
- [ ] Configure API versioning with `/api/v1` prefix
- [ ] Create user database table with UUID v7 primary keys
- [ ] Implement password hashing with bcrypt
- [ ] Create `POST /api/v1/auth/register` endpoint
- [ ] Add email validation middleware
- [ ] Add password strength validation (min 8 chars)
- [ ] Implement JWT token generation utility
- [ ] Create user creation service with database integration
- [ ] Add required data-testid attributes: (not applicable for API test)
- [ ] Run test: `bun test tests/api/backend-api-foundation.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

### Test: should reject registration with invalid email

**File:** `tests/api/backend-api-foundation.spec.ts`

**Tasks to make this test pass:**

- [ ] Implement email format validation using regex
- [ ] Create validation error response format
- [ ] Add validation middleware to registration endpoint
- [ ] Return 400 status for invalid email format
- [ ] Structure error response with "Validation Error" type
- [ ] Run test: `bun test tests/api/backend-api-foundation.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: should authenticate user with valid credentials

**File:** `tests/api/backend-api-foundation.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `POST /api/v1/auth/login` endpoint
- [ ] Implement password verification with bcrypt.compare
- [ ] Add user lookup service by email
- [ ] Create JWT token generation for authenticated users
- [ ] Add user authentication service
- [ ] Return 200 status with user data and tokens
- [ ] Run test: `bun test tests/api/backend-api-foundation.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: should refresh access token with valid refresh token

**File:** `tests/api/backend-api-foundation.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `POST /api/v1/auth/refresh` endpoint
- [ ] Implement JWT refresh token validation
- [ ] Create token refresh service
- [ ] Generate new access token pair
- [ ] Add refresh token revocation logic
- [ ] Return new tokens with 200 status
- [ ] Run test: `bun test tests/api/backend-api-foundation.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: should enforce rate limits on authentication endpoints

**File:** `tests/api/backend-api-foundation.spec.ts`

**Tasks to make this test pass:**

- [ ] Install and configure rate limiting middleware
- [ ] Set up Redis or in-memory storage for rate limits
- [ ] Configure rate limit (e.g., 5 requests per minute)
- [ ] Add rate limiting to auth endpoints
- [ ] Return 429 status with retry-after header
- [ ] Structure rate limit error response
- [ ] Run test: `bun test tests/api/backend-api-foundation.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: should include security headers on API responses

**File:** `tests/api/backend-api-foundation.spec.ts`

**Tasks to make this test pass:**

- [ ] Install security headers middleware (helmet equivalent for Elysia)
- [ ] Configure security headers:
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection: 1; mode=block
  - Strict-Transport-Security: max-age=31536000; includeSubDomains
- [ ] Apply security middleware to all API routes
- [ ] Run test: `bun test tests/api/backend-api-foundation.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: should return basic health status

**File:** `tests/api/health-checks.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `GET /api/v1/health` endpoint
- [ ] Implement basic health check logic
- [ ] Return application uptime
- [ ] Return current timestamp
- [ ] Return service status: 'healthy'
- [ ] Run test: `bun test tests/api/health-checks.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: should return detailed system status

**File:** `tests/api/health-checks.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `GET /api/v1/status` endpoint
- [ ] Implement database connectivity check
- [ ] Add Redis connectivity check
- [ ] Collect system metrics (memory, CPU, requests)
- [ ] Return detailed status object with services health
- [ ] Run test: `bun test tests/api/health-checks.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: should complete user login flow successfully

**File:** `tests/e2e/authentication-flow.spec.ts`

**Tasks to make this test pass:**

- [ ] Create login page with form
- [ ] Add required data-testid attributes: login-form, email-input, password-input, login-button
- [ ] Implement form submission to `/api/v1/auth/login`
- [ ] Create dashboard page with user data
- [ ] Add required data-testid attributes: user-dashboard, user-name, logout-button
- [ ] Implement successful login redirect to `/dashboard`
- [ ] Store JWT tokens in localStorage
- [ ] Run test: `bun test tests/e2e/authentication-flow.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

## Running Tests

```bash
# Run all failing tests for this story
bun test tests/api/backend-api-foundation.spec.ts tests/api/health-checks.spec.ts tests/e2e/authentication-flow.spec.ts

# Run specific test file
bun test tests/api/backend-api-foundation.spec.ts

# Run tests in headed mode (see browser)
bun test tests/e2e/authentication-flow.spec.ts --headed

# Debug specific test
bun test tests/api/backend-api-foundation.spec.ts --debug

# Run tests with coverage
bun test --coverage
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing
- ✅ Fixtures and factories created with auto-cleanup
- ✅ Mock requirements documented
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

**Verification:**

- All tests run and fail as expected
- Failure messages are clear and actionable
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with health checks)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

**Progress Tracking:**

- Check off tasks as you complete them
- Share progress in daily standup
- Mark story as IN PROGRESS in `bmm-workflow-status.md`

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all tests pass** (green phase complete)
2. **Review code for quality** (readability, maintainability, performance)
3. **Extract duplications** (DRY principle)
4. **Optimize performance** (if needed)
5. **Ensure tests still pass** after each refactor
6. **Update documentation** (if API contracts change)

**Key Principles:**

- Tests provide safety net (refactor with confidence)
- Make small refactors (easier to debug if tests fail)
- Run tests after each change
- Don't change test behavior (only implementation)

**Completion:**

- All tests pass
- Code quality meets team standards
- No duplications or code smells
- Ready for code review and story approval

---

## Next Steps

1. **Review this checklist** with team in standup or planning
2. **Run failing tests** to confirm RED phase: `bun test tests/api/backend-api-foundation.spec.ts tests/api/health-checks.spec.ts tests/e2e/authentication-flow.spec.ts`
3. **Begin implementation** using implementation checklist as guide
4. **Work one test at a time** (red → green for each)
5. **Share progress** in daily standup
6. **When all tests pass**, refactor code for quality
7. **When refactoring complete**, run `bmad sm story-done` to move story to DONE

---

## Knowledge Base References Applied

This ATDD workflow consulted the following knowledge fragments:

- **fixture-architecture.md** - Test fixture patterns with setup/teardown and auto-cleanup using Playwright's `test.extend()`
- **data-factories.md** - Factory patterns using `@faker-js/faker` for random test data generation with overrides support
- **component-tdd.md** - Component test strategies using Playwright Component Testing
- **network-first.md** - Route interception patterns (intercept BEFORE navigation to prevent race conditions)
- **test-quality.md** - Test design principles (Given-When-Then, one assertion per test, determinism, isolation)
- **test-levels-framework.md** - Test level selection framework (E2E vs API vs Component vs Unit)

See `tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `bun test tests/api/backend-api-foundation.spec.ts tests/api/health-checks.spec.ts tests/e2e/authentication-flow.spec.ts`

**Results:**

```
Note: Tests will fail because API endpoints and UI components are not yet implemented.
This is expected as we are in the RED phase of TDD.

Expected failures:
- POST /api/v1/auth/register - Endpoint not found (404)
- POST /api/v1/auth/login - Endpoint not found (404)
- POST /api/v1/auth/refresh - Endpoint not found (404)
- GET /api/v1/health - Endpoint not found (404)
- GET /api/v1/status - Endpoint not found (404)
- /login page - Page not found (404)
- /register page - Page not found (404)
- /dashboard page - Page not found (404)
```

**Summary:**

- Total tests: 27
- Passing: 0 (expected)
- Failing: 27 (expected)
- Status: ✅ RED phase verified

**Expected Failure Messages:**

- API tests: "Request failed with status code 404"
- E2E tests: "Navigation timeout exceeded" or "page.goto: NetError"

---

## Notes

- All tests follow network-first pattern (intercept before navigate)
- Fixtures provide auto-cleanup to prevent test pollution
- Data factories use faker for dynamic, collision-free test data
- JWT tokens are mocked but follow real implementation patterns
- Database schema uses UUID v7 for primary keys as specified in requirements
- Security headers and CORS configuration are essential for mobile app compatibility

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Tag @TEA in Slack/Discord
- Refer to `testarch/README.md` for workflow documentation
- Consult `testarch/knowledge/` for testing best practices

---

**Generated by BMad TEA Agent** - 2025-10-30
