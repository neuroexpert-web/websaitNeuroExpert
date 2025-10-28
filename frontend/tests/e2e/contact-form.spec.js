import { test, expect, selectors, testUserData } from './utils/test-helpers.js';

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/contact', async (route) => {
      const postData = await route.request().postData();
      const data = JSON.parse(postData || '{}');
      
      // Validation mock
      if (!data.name || !data.contact || !data.service) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ 
            success: false, 
            message: 'Пожалуйста, заполните обязательные поля' 
          })
        });
        return;
      }
      
      // Success response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Спасибо! Мы свяжемся с вами в течение 15 минут'
        })
      });
    });
    
    await page.goto('/');
    await page.addInitScript(() => {
      // Mock REACT_APP_BACKEND_URL to use relative URLs
      window.localStorage.setItem('REACT_APP_BACKEND_URL', '');
    });
  });

  test('should display contact form correctly', async ({ page }) => {
    // Scroll to contact form
    await page.locator(selectors.contact.section).scrollIntoViewIfNeeded();
    await expect(page.locator(selectors.contact.section)).toBeVisible();
    
    // Check form title
    await expect(page.locator('h2:has-text("Получить консультацию")')).toBeVisible();
    await expect(page.locator('p:has-text("Ответим в течение")')).toBeVisible();
    await expect(page.locator('p:has-text("15 минут")')).toBeVisible();
    
    // Check form fields
    await expect(page.locator(selectors.contact.nameInput)).toBeVisible();
    await expect(page.locator(selectors.contact.contactInput)).toBeVisible();
    await expect(page.locator(selectors.contact.serviceSelect)).toBeVisible();
    await expect(page.locator(selectors.contact.messageTextarea)).toBeVisible();
    await expect(page.locator(selectors.contact.submitButton)).toBeVisible();
  });

  test('should submit form successfully with valid data', async ({ page }) => {
    // Scroll to form
    await page.locator(selectors.contact.section).scrollIntoViewIfNeeded();
    
    // Fill form with valid data
    await page.fill(selectors.contact.nameInput, testUserData.name);
    await page.fill(selectors.contact.contactInput, testUserData.contact);
    await page.click(selectors.contact.serviceSelect);
    await page.click('[data-value="Цифровой аудит"]');
    await page.fill(selectors.contact.messageTextarea, testUserData.message);
    
    // Submit form
    await page.click(selectors.contact.submitButton);
    
    // Check loading state
    await expect(page.locator(selectors.contact.loadingSpinner)).toBeVisible();
    await expect(page.locator(selectors.contact.submitButton)).toBeDisabled();
    
    // Wait for successful submission
    await expect(page.locator(selectors.contact.loadingSpinner)).not.toBeVisible();
    
    // Check success message (toast notification)
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Спасибо! Мы свяжемся с вами');
    
    // Check form is reset
    await expect(page.locator(selectors.contact.nameInput)).toHaveValue('');
    await expect(page.locator(selectors.contact.contactInput)).toHaveValue('');
    await expect(page.locator(selectors.contact.messageTextarea)).toHaveValue('');
  });

  test('should validate required fields', async ({ page }) => {
    // Scroll to form
    await page.locator(selectors.contact.section).scrollIntoViewIfNeeded();
    
    // Try to submit empty form
    await page.click(selectors.contact.submitButton);
    
    // Check validation error
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Пожалуйста, заполните обязательные поля');
  });

  test('should validate partial form submission', async ({ page }) => {
    // Scroll to form
    await page.locator(selectors.contact.section).scrollIntoViewIfNeeded();
    
    // Fill only name field
    await page.fill(selectors.contact.nameInput, testUserData.name);
    
    // Try to submit
    await page.click(selectors.contact.submitButton);
    
    // Check validation error
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Пожалуйста, заполните обязательные поля');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/contact', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: false, 
          message: 'Ошибка сервера. Попробуйте позже' 
        })
      });
    });
    
    // Scroll to form
    await page.locator(selectors.contact.section).scrollIntoViewIfNeeded();
    
    // Fill form with valid data
    await page.fill(selectors.contact.nameInput, testUserData.name);
    await page.fill(selectors.contact.contactInput, testUserData.contact);
    await page.click(selectors.contact.serviceSelect);
    await page.click('[data-value="Цифровой аудит"]');
    
    // Submit form
    await page.click(selectors.contact.submitButton);
    
    // Check loading state
    await expect(page.locator(selectors.contact.loadingSpinner)).toBeVisible();
    await expect(page.locator(selectors.contact.submitButton)).toBeDisabled();
    
    // Wait for error response
    await expect(page.locator(selectors.contact.loadingSpinner)).not.toBeVisible();
    
    // Check error message
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Ошибка. Попробуйте ещё раз');
    
    // Check form is not reset after error
    await expect(page.locator(selectors.contact.nameInput)).toHaveValue(testUserData.name);
    await expect(page.locator(selectors.contact.contactInput)).toHaveValue(testUserData.contact);
  });

  test('should handle different service selections', async ({ page }) => {
    // Scroll to form
    await page.locator(selectors.contact.section).scrollIntoViewIfNeeded();
    
    const services = [
      '🤖 AI-ассистент 24/7',
      '🚀 Сайты под ключ',
      '🛡️ Техподдержка'
    ];
    
    for (const service of services) {
      // Fill form
      await page.fill(selectors.contact.nameInput, testUserData.name);
      await page.fill(selectors.contact.contactInput, testUserData.contact);
      
      // Select service
      await page.click(selectors.contact.serviceSelect);
      await page.click(`[data-value="${service.replace(/[🤖🚀🛡️]\s*/g, '')}"]`);
      
      // Submit form
      await page.click(selectors.contact.submitButton);
      
      // Wait for success
      await expect(page.locator(selectors.contact.loadingSpinner)).not.toBeVisible();
      const toast = page.locator('[data-sonner-toast]');
      await expect(toast).toContainText('Спасибо! Мы свяжемся с вами');
      
      // Wait for toast to disappear before next iteration
      await page.waitForTimeout(1000);
    }
  });

  test('should handle optional message field', async ({ page }) => {
    // Scroll to form
    await page.locator(selectors.contact.section).scrollIntoViewIfNeeded();
    
    // Fill form without optional message
    await page.fill(selectors.contact.nameInput, testUserData.name);
    await page.fill(selectors.contact.contactInput, testUserData.contact);
    await page.click(selectors.contact.serviceSelect);
    await page.click('[data-value="Цифровой аудит"]');
    
    // Submit form
    await page.click(selectors.contact.submitButton);
    
    // Wait for success
    await expect(page.locator(selectors.contact.loadingSpinner)).not.toBeVisible();
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toContainText('Спасибо! Мы свяжемся с вами');
  });

  test('should handle long message content', async ({ page }) => {
    // Scroll to form
    await page.locator(selectors.contact.section).scrollIntoViewIfNeeded();
    
    const longMessage = 'Это очень длинное сообщение '.repeat(20);
    
    // Fill form with long message
    await page.fill(selectors.contact.nameInput, testUserData.name);
    await page.fill(selectors.contact.contactInput, testUserData.contact);
    await page.click(selectors.contact.serviceSelect);
    await page.click('[data-value="Цифровой аудит"]');
    await page.fill(selectors.contact.messageTextarea, longMessage);
    
    // Submit form
    await page.click(selectors.contact.submitButton);
    
    // Wait for success
    await expect(page.locator(selectors.contact.loadingSpinner)).not.toBeVisible();
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toContainText('Спасибо! Мы свяжемся с вами');
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Scroll to form
    await page.locator(selectors.contact.section).scrollIntoViewIfNeeded();
    
    // Check form is properly sized
    await expect(page.locator(selectors.contact.section)).toBeVisible();
    await expect(page.locator(selectors.contact.nameInput)).toBeVisible();
    await expect(page.locator(selectors.contact.contactInput)).toBeVisible();
    await expect(page.locator(selectors.contact.serviceSelect)).toBeVisible();
    await expect(page.locator(selectors.contact.messageTextarea)).toBeVisible();
    await expect(page.locator(selectors.contact.submitButton)).toBeVisible();
    
    // Test form submission on mobile
    await page.fill(selectors.contact.nameInput, testUserData.name);
    await page.fill(selectors.contact.contactInput, testUserData.contact);
    await page.click(selectors.contact.serviceSelect);
    await page.click('[data-value="Цифровой аудит"]');
    
    // Submit form
    await page.click(selectors.contact.submitButton);
    
    // Wait for success
    await expect(page.locator(selectors.contact.loadingSpinner)).not.toBeVisible();
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();
  });

  test('should show social media links', async ({ page }) => {
    // Scroll to form
    await page.locator(selectors.contact.section).scrollIntoViewIfNeeded();
    
    // Check social links
    const telegramLink = page.locator('a[href*="t.me"]');
    const githubLink = page.locator('a[href*="github.com"]');
    const linkedinLink = page.locator('a[href*="linkedin.com"]');
    
    await expect(telegramLink).toBeVisible();
    await expect(githubLink).toBeVisible();
    await expect(linkedinLink).toBeVisible();
    
    // Check links have correct attributes
    await expect(telegramLink).toHaveAttribute('target', '_blank');
    await expect(telegramLink).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(githubLink).toHaveAttribute('target', '_blank');
    await expect(linkedinLink).toHaveAttribute('target', '_blank');
  });
});