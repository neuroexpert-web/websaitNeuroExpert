const { test, expect } = require('@playwright/test');

test('simple test', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/NeuroExpert/);
});