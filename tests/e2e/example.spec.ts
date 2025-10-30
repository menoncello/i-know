import { test, expect } from '../support/fixtures';

test.describe('P1: Core User Journey', () => {
  test('1.1-E2E-001 should load homepage', async ({ page }) => {
    // Given: User is not authenticated
    // When: User navigates to the homepage
    const pageLoadPromise = page.waitForLoadState('networkidle');
    await page.goto('/');
    await pageLoadPromise;

    // Then: Homepage should be displayed with correct title
    await expect(page).toHaveTitle(/Home/i);
  });

  test('1.1-E2E-002 should login with valid credentials', async ({ page, userFactory }) => {
    // Given: User has valid credentials
    const user = await userFactory.createUser();

    // When: User navigates to login and submits credentials
    const loginResponsePromise = page.waitForResponse(
      resp => resp.url().includes('/api/auth/login') && resp.status() === 200,
    );

    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', user.password);
    await page.click('[data-testid="login-button"]');

    // Wait for actual login completion
    await loginResponsePromise;

    // Then: User should be logged in successfully
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
});
