import { test, expect } from '@playwright/test';

test.describe('Shopping Flow', () => {
  test('should allow a user to add a product to cart and see it in the drawer', async ({ page }) => {
    // 1. Visit products page
    await page.goto('/products');
    
    // 2. Find the first product and click it
    console.log('Waiting for products to load...');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await expect(firstProduct).toBeVisible({ timeout: 15000 });
    console.log('Product found!');
    
    const productName = await firstProduct.locator('h3').textContent();
    await firstProduct.click();
    
    // 3. Verify on product detail page
    await expect(page).toHaveURL(/\/products\//);
    if (productName) {
      await expect(page.locator('h1')).toHaveText(productName.trim());
    }
    
    // 4. Add to cart
    const addToCartBtn = page.getByRole('button', { name: /Add to bag/i }).first();
    await addToCartBtn.click();
    
    // 5. Verify cart drawer is open and item is there
    const cartDrawer = page.locator('h2', { hasText: /Your Shopping Cart/i });
    await expect(cartDrawer).toBeVisible();
    
    if (productName) {
      await expect(page.locator('h3', { hasText: productName.trim() }).first()).toBeVisible();
    }
    
    // 6. Navigate to cart page
    const viewCartBtn = page.getByRole('link', { name: /View & Edit Cart/i });
    await viewCartBtn.click();
    await expect(page).toHaveURL(/\/cart/);
    
    // 7. Verify item in cart page
    if (productName) {
      await expect(page.locator('h3', { hasText: productName.trim() }).first()).toBeVisible();
    }
  });
});
