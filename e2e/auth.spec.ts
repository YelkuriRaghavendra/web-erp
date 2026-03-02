import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('login-container')).toBeVisible();
    await expect(page.getByTestId('user-login-form')).toBeVisible();

    await page.getByLabel('Email').fill('admin@angelis.com');
    await page.getByLabel('Password').fill('adminPass');

    await page.getByRole('button', { name: /get into|loading/i }).click();

    await page.waitForURL('/', { timeout: 10000 });

    // Verify successful login by checking dashboard elements are present
    await expect(
      page.getByRole('heading', { name: 'Dashboard' })
    ).toBeVisible();
    await expect(page.getByText('Bienvenido al Admin Center')).toBeVisible();

    await expect(page.getByTestId('login-container')).not.toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Password').fill('wrongpassword');

    await page.getByRole('button', { name: /get into|loading/i }).click();
    await expect(page.locator('text=Invalid credentials')).toBeVisible();

    await expect(page.getByTestId('login-container')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /get into|loading/i }).click();

    await expect(page.locator('text=Invalid email')).toBeVisible();
    await expect(
      page.locator('text=Password must be at least 6 chars')
    ).toBeVisible();
  });
});
