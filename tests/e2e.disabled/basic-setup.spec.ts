import { test, expect } from '../support/fixtures';

test.describe('Basic E2E Setup', () => {
  test('should have proper test configuration', async ({ page }) => {
    // Test that Playwright is properly configured
    expect(page).toBeDefined();

    // Test basic page functionality without requiring a server
    await page.goto('about:blank');
    expect(await page.title()).toBe('');
  });

  test('should handle network mocking', async ({ page }) => {
    // Test network mocking capabilities by intercepting navigation
    await page.route('**/nonexistent-page', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body><h1 data-testid="mocked-content">Mocked Response</h1></body></html>',
      });
    });

    // Navigate to a non-existent page that will be intercepted
    await page.goto('/nonexistent-page');

    // Verify the mocked content is displayed
    await expect(page.locator('[data-testid="mocked-content"]')).toHaveText('Mocked Response');
  });

  test('should work with test page fixture', async ({ page }) => {
    // Test that basic page fixture is working
    expect(page).toBeDefined();
    expect(page.goto).toBeDefined();
    expect(page.locator).toBeDefined();
  });

  test('should handle basic page interactions', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <div data-testid="test-container">
            <h1 data-testid="title">Test Page</h1>
            <button data-testid="button">Click me</button>
            <div data-testid="result"></div>
          </div>
          <script>
            document.querySelector('[data-testid="button"]').addEventListener('click', () => {
              document.querySelector('[data-testid="result"]').textContent = 'Button clicked!';
            });
          </script>
        </body>
      </html>
    `);

    // Test basic interactions
    await expect(page.locator('[data-testid="title"]')).toHaveText('Test Page');
    await expect(page.locator('[data-testid="button"]')).toBeVisible();

    // Test click interaction
    await page.click('[data-testid="button"]');
    await expect(page.locator('[data-testid="result"]')).toHaveText('Button clicked!');
  });
});
