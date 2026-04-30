import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load and display hero content', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Check for hero heading
    await expect(page.getByText(/Your TCG Destination/i)).toBeVisible({ timeout: 10000 });
    
    // Check for "Shop Now" button
    const shopNowBtn = page.getByRole('link', { name: /Shop Now/i }).first();
    await expect(shopNowBtn).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to products page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const shopNowBtn = page.getByRole('link', { name: /Shop Now/i }).first();
    await shopNowBtn.click();

    // Check URL
    await expect(page).toHaveURL(/\/products/);
  });
});
