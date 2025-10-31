import { test, expect } from '@playwright/test';

test.describe('Authentication Flow - E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Network-first: Intercept API calls before navigation
    await page.route('**/api/v1/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
          },
        }),
      });
    });

    await page.route('**/api/v1/auth/register', route => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user-456',
            email: 'newuser@example.com',
            name: 'New User',
            createdAt: new Date().toISOString(),
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
          },
        }),
      });
    });
  });

  test('should complete user login flow successfully', async ({ page }) => {
    // GIVEN: User is on login page
    await page.goto('/login');

    // THEN: Login form is displayed
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();

    // WHEN: User enters valid credentials and submits
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'CorrectPass123!');

    // Network-first: Wait for login API response
    const loginResponse = page.waitForResponse(
      resp => resp.url().includes('/api/v1/auth/login') && resp.status() === 200,
    );

    await page.click('[data-testid="login-button"]');
    await loginResponse;

    // THEN: User is redirected to dashboard
    await page.waitForURL('/dashboard');
    await expect(page.locator('[data-testid="user-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-name"]')).toHaveText('Test User');
    await expect(page.locator('[data-testid="logout-button"]')).toBeVisible();
  });

  test('should display error for invalid login credentials', async ({ page }) => {
    // GIVEN: Mock failed login response
    await page.route('**/api/v1/auth/login', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Authentication Error',
          message: 'Invalid email or password',
        }),
      });
    });

    // AND: User is on login page
    await page.goto('/login');

    // WHEN: User enters invalid credentials
    await page.fill('[data-testid="email-input"]', 'wrong@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');

    // Network-first: Wait for login API response
    const loginResponse = page.waitForResponse(
      resp => resp.url().includes('/api/v1/auth/login') && resp.status() === 401,
    );

    await page.click('[data-testid="login-button"]');
    await loginResponse;

    // THEN: Error message is displayed and user stays on login page
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toHaveText(
      'Invalid email or password',
    );
    await expect(page).toHaveURL('/login');

    // AND: Form fields are preserved for correction
    await expect(page.locator('[data-testid="email-input"]')).toHaveValue('wrong@example.com');
    await expect(page.locator('[data-testid="password-input"]')).toHaveValue('wrongpassword');
  });

  test('should complete user registration flow successfully', async ({ page }) => {
    // GIVEN: User is on registration page
    await page.goto('/register');

    // THEN: Registration form is displayed
    await expect(page.locator('[data-testid="registration-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirm-password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="register-button"]')).toBeVisible();

    // WHEN: User fills registration form and submits
    await page.fill('[data-testid="name-input"]', 'New User');
    await page.fill('[data-testid="email-input"]', 'newuser@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!');

    // Network-first: Wait for registration API response
    const registerResponse = page.waitForResponse(
      resp => resp.url().includes('/api/v1/auth/register') && resp.status() === 201,
    );

    await page.click('[data-testid="register-button"]');
    await registerResponse;

    // THEN: User is redirected to dashboard
    await page.waitForURL('/dashboard');
    await expect(page.locator('[data-testid="user-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-name"]')).toHaveText('New User');

    // AND: Success message might be displayed
    const successMessage = page.locator('[data-testid="success-message"]');
    if (await successMessage.isVisible()) {
      await expect(successMessage).toHaveText('Registration successful!');
    }
  });

  test('should validate password confirmation during registration', async ({ page }) => {
    // GIVEN: User is on registration page
    await page.goto('/register');

    // WHEN: User enters mismatched passwords
    await page.fill('[data-testid="name-input"]', 'Test User');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.fill('[data-testid="confirm-password-input"]', 'DifferentPassword123!');

    await page.click('[data-testid="register-button"]');

    // THEN: Validation error is displayed
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toHaveText(
      'Passwords do not match',
    );

    // AND: User stays on registration page
    await expect(page).toHaveURL('/register');
  });

  test('should handle user logout flow', async ({ page }) => {
    // GIVEN: User is logged in
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'CorrectPass123!');

    const loginResponse = page.waitForResponse(
      resp => resp.url().includes('/api/v1/auth/login') && resp.status() === 200,
    );

    await page.click('[data-testid="login-button"]');
    await loginResponse;
    await page.waitForURL('/dashboard');

    // WHEN: User clicks logout
    await page.click('[data-testid="logout-button"]');

    // THEN: User is redirected to login page
    await page.waitForURL('/login');
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    // AND: Auth tokens are cleared (verify via localStorage/cookies)
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'));

    expect(accessToken).toBeNull();
    expect(refreshToken).toBeNull();
  });
});
