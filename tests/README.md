# Test Suite Documentation

## Overview

This test suite uses Playwright for end-to-end testing of the I Know entertainment intelligence platform. The architecture follows modern testing patterns with fixtures, data factories, and comprehensive configuration.

## Setup Instructions

### Prerequisites

- Node.js 20.11.0+ (defined in `.nvmrc`)
- Bun runtime (project uses Bun for package management)

### Installation

1. Install dependencies:

```bash
bun install
```

2. Copy environment configuration:

```bash
cp .env.example .env
```

3. Update `.env` with your local configuration:

```bash
BASE_URL=http://localhost:4321
API_URL=http://localhost:3000/api
```

## Running Tests

### Local Development

```bash
# Run all tests
bun run test:e2e

# Run tests headed (visible browser)
bun run test:e2e --headed

# Run tests with UI (interactive mode)
bun run test:e2e --ui

# Run specific test file
bun run test:e2e tests/e2e/example.spec.ts

# Run tests in debug mode
bun run test:e2e --debug
```

### CI/CD

Tests run automatically in CI with the following configuration:

- Chromium, Firefox, and WebKit browsers
- Retry on failure (2 attempts in CI)
- Parallel execution with single worker in CI
- Reports: HTML and JUnit XML

## Architecture Overview

### Directory Structure

```
tests/
├── e2e/                    # End-to-end test files
│   └── example.spec.ts     # Example test demonstrating patterns
├── support/                # Test infrastructure
│   ├── fixtures/           # Test fixtures and data factories
│   │   ├── index.ts        # Main fixture export
│   │   └── factories/      # Data factories for test data
│   │       └── user-factory.ts
│   ├── helpers/            # Utility functions
│   └── page-objects/       # Page object models (if needed)
└── README.md               # This documentation
```

### Fixture Architecture

The fixture system provides reusable test setup with automatic cleanup:

```typescript
import { test, expect } from '../support/fixtures';

test('example test', async ({ page, userFactory }) => {
  // userFactory provides automatic cleanup
  const user = await userFactory.createUser();
  // Test implementation
});
```

### Data Factories

Data factories generate realistic test data using Faker.js:

```typescript
const user = await userFactory.createUser({
  name: 'Custom Name', // Override default values
  email: 'test@example.com',
});
```

## Best Practices

### Selector Strategy

Always use `data-testid` attributes for test selectors:

```typescript
// Good
page.locator('[data-testid="submit-button"]');

// Avoid
page.locator('button.btn-primary');
```

### Test Isolation

- Each test should be independent
- Use fixtures for automatic cleanup
- Avoid shared state between tests

### Assertions

- Use explicit assertions with meaningful messages
- Wait for elements using built-in Playwright waiting
- Avoid hard-coded waits (`sleep`)

### Given-When-Then Structure

Organize tests using the Given-When-Then pattern:

```typescript
test('should login successfully', async ({ page, userFactory }) => {
  // Given
  const user = await userFactory.createUser();
  await page.goto('/login');

  // When
  await page.fill('[data-testid="email-input"]', user.email);
  await page.fill('[data-testid="password-input"]', user.password);
  await page.click('[data-testid="login-button"]');

  // Then
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
});
```

## CI Integration

### GitHub Actions

Tests run in CI with the following workflow:

```yaml
- name: Install dependencies
  run: bun install

- name: Install Playwright browsers
  run: bunx playwright install --with-deps

- name: Run tests
  run: bun run test:e2e
```

### Artifacts

- **HTML Report**: `test-results/html/report.html`
- **JUnit XML**: `test-results/junit.xml`
- **Screenshots**: On failure only
- **Videos**: On failure only
- **Traces**: On failure only

## Environment Configuration

### Required Environment Variables

```bash
TEST_ENV=local                    # Test environment
BASE_URL=http://localhost:4321   # Frontend URL
API_URL=http://localhost:3000/api # Backend API URL
```

### Optional Environment Variables

```bash
TEST_USER_EMAIL=test@example.com # Test user email
TEST_USER_PASSWORD=              # Test user password
FEATURE_FLAG_NEW_UI=true         # Feature flags
TEST_API_KEY=                    # API keys for testing
```

## Troubleshooting

### Common Issues

**Tests fail with "No element found"**

- Check that the application is running at `BASE_URL`
- Verify `data-testid` attributes exist in the code
- Use `--headed` mode to visually debug

**Factory cleanup fails**

- Ensure API endpoints are accessible
- Check network connectivity in test environment
- Verify database connection for cleanup operations

**Time-related failures**

- Increase timeout in `playwright.config.ts`
- Check for race conditions in test setup
- Use explicit waits instead of hard-coded delays

### Debugging

1. **Visual Debugging**:

```bash
bun run test:e2e --headed --debug
```

2. **Trace Viewer**:

```bash
bunx playwright show-trace test-results/trace.zip
```

3. **Interactive Mode**:

```bash
bun run test:e2e --ui
```

## Knowledge Base References

This test architecture incorporates best practices from the following knowledge fragments:

- **Fixture Architecture**: Pure function → fixture → mergeTests composition with auto-cleanup
- **Data Factories**: Faker-based factories with overrides, nested factories, API seeding, auto-cleanup
- **Network-First Testing**: Intercept before navigate, HAR capture, deterministic waiting
- **Playwright Configuration**: Environment-based config, timeout standards, artifact output, parallelization
- **Test Quality**: Deterministic tests, isolation with cleanup, explicit assertions, length/time limits

## Extending the Test Suite

### Adding New Tests

1. Create test files in `tests/e2e/` with `.spec.ts` extension
2. Use the fixture pattern from `tests/support/fixtures/`
3. Follow the Given-When-Then structure
4. Include proper assertions and cleanup

### Adding New Fixtures

1. Update `tests/support/fixtures/index.ts` to add new fixture types
2. Create corresponding factories in `tests/support/fixtures/factories/`
3. Ensure automatic cleanup is implemented

### Adding Helper Functions

Create utility functions in `tests/support/helpers/` for common operations:

- API client helpers
- Authentication helpers
- Navigation helpers
- Data validation helpers

---

**Framework**: Playwright
**Version**: 1.48.0+
**Last Updated**: 2025-10-30
