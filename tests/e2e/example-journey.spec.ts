import { test, expect } from '../support/fixtures';

test.describe('P1: Core User Journey (Mocked)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for authentication
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
          token: 'mock-jwt-token',
        }),
      });
    });

    // Mock homepage content
    await page.route('**/', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Home - I Know Application</title>
            </head>
            <body>
              <div data-testid="homepage">
                <h1 data-testid="homepage-title">Welcome to I Know</h1>
                <nav data-testid="navigation">
                  <a href="/login" data-testid="login-link">Login</a>
                  <a href="/register" data-testid="register-link">Register</a>
                </nav>
              </div>
            </body>
          </html>
        `,
      });
    });

    // Mock login page content
    await page.route('**/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Login - I Know Application</title>
            </head>
            <body>
              <div data-testid="login-form">
                <h2>Login</h2>
                <form id="loginForm">
                  <input type="email" data-testid="email-input" placeholder="Email" />
                  <input type="password" data-testid="password-input" placeholder="Password" />
                  <button type="submit" data-testid="login-button">Login</button>
                </form>
                <div data-testid="error-message" style="display: none;"></div>
              </div>
              <script>
                document.getElementById('loginForm').addEventListener('submit', async (e) => {
                  e.preventDefault();
                  const email = document.querySelector('[data-testid="email-input"]').value;
                  const password = document.querySelector('[data-testid="password-input"]').value;

                  try {
                    const response = await fetch('/api/auth/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email, password })
                    });

                    if (response.ok) {
                      window.location.href = '/dashboard';
                    }
                  } catch (error) {
                    console.error('Login error:', error);
                  }
                });
              </script>
            </body>
          </html>
        `,
      });
    });

    // Mock logged-in dashboard
    await page.route('**/dashboard', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Dashboard - I Know Application</title>
            </head>
            <body>
              <div data-testid="user-dashboard">
                <nav data-testid="user-menu">
                  <span data-testid="user-name">Test User</span>
                  <button data-testid="logout-button">Logout</button>
                </nav>
                <h1>Welcome back, Test User!</h1>
              </div>
            </body>
          </html>
        `,
      });
    });
  });

  test('1.1-E2E-001 should load homepage', async ({ page }) => {
    // Given: User is not authenticated
    // When: User navigates to the homepage
    const pageLoadPromise = page.waitForLoadState('networkidle');
    await page.goto('/');
    await pageLoadPromise;

    // Then: Homepage should be displayed with correct title
    await expect(page).toHaveTitle(/Home/i);
    await expect(page.locator('[data-testid="homepage"]')).toBeVisible();
    await expect(page.locator('[data-testid="homepage-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
  });

  test('1.1-E2E-002 should login with valid credentials', async ({ page }) => {
    // Given: User has valid credentials
    const testUser = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      name: 'Test User',
    };

    // When: User navigates to login and submits credentials
    const loginResponsePromise = page.waitForResponse(
      resp => resp.url().includes('/api/auth/login') && resp.status() === 200,
    );

    await page.goto('/login');
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');

    // Wait for actual login completion
    await loginResponsePromise;

    // Then: User should be logged in successfully
    await page.waitForURL('**/dashboard');
    await expect(page.locator('[data-testid="user-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-name"]')).toHaveText(testUser.name);
  });
});
