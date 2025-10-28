import { test, expect, selectors, testUserData, testChatMessages } from './utils/test-helpers.js';

test.describe('Main User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/chat', async (route) => {
      const postData = await route.request().postData();
      const { message } = JSON.parse(postData || '{}');
      
      // Simulate different responses based on message content
      let responseText = 'Спасибо за ваш вопрос! Наш специалист свяжется с вами в ближайшее время для детальной консультации.';
      
      if (message && message.includes('аудит')) {
        responseText = 'Цифровой аудит - это комплексный анализ вашей IT-инфраструктуры и бизнес-процессов. Мы выявляем узкие места и предлагаем решения для повышения эффективности.';
      } else if (message && (message.includes('AI') || message.includes('ассистент'))) {
        responseText = 'AI-ассистент 24/7 - это интеллектуальный чат-бот, который обрабатывает до 80% рутинных запросов клиентов, экономя ваше время и ресурсы.';
      } else if (message && message.includes('сайт')) {
        responseText = 'Создаем современные сайты любой сложности: от лендингов до корпоративных порталов. Используем React, Node.js и современные фреймворки.';
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ response: responseText })
      });
    });
    
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

  test('complete user journey: hero -> chat -> contact form', async ({ page, checkConsoleErrors }) => {
    // Step 1: Check hero section loads without errors
    await expect(page.locator(selectors.hero.section)).toBeVisible();
    await expect(page.locator(selectors.hero.title)).toContainText('Ваш цифровой прорыв');
    
    // Check for console errors after page load
    const initialErrors = await checkConsoleErrors();
    expect(initialErrors).toHaveLength(0);
    
    // Step 2: Interact with hero CTA
    await page.click(selectors.hero.ctaButton);
    await page.waitForTimeout(1000); // Wait for smooth scroll
    
    // Step 3: Open and test AI chat
    await page.click(selectors.chat.floatingButton);
    await expect(page.locator(selectors.chat.chatWindow)).toBeVisible();
    
    // Send a message via quick action
    await page.click(selectors.chat.quickActions.first());
    await expect(page.locator(selectors.chat.loadingIndicator)).toBeVisible();
    await expect(page.locator(selectors.chat.loadingIndicator)).not.toBeVisible();
    
    // Verify AI response
    const chatMessages = page.locator(selectors.chat.messages);
    await expect(chatMessages).toHaveCount(3);
    await expect(chatMessages.nth(2)).toContainText('Цифровой аудит');
    
    // Close chat
    await page.click(selectors.chat.closeButton);
    await expect(page.locator(selectors.chat.chatWindow)).not.toBeVisible();
    
    // Step 4: Scroll to and test contact form
    await page.locator(selectors.contact.section).scrollIntoViewIfNeeded();
    await expect(page.locator(selectors.contact.section)).toBeVisible();
    
    // Fill contact form
    await page.fill(selectors.contact.nameInput, testUserData.name);
    await page.fill(selectors.contact.contactInput, testUserData.contact);
    await page.click(selectors.contact.serviceSelect);
    await page.click('[data-value="Цифровой аудит"]');
    await page.fill(selectors.contact.messageTextarea, testUserData.message);
    
    // Submit form
    await page.click(selectors.contact.submitButton);
    await expect(page.locator(selectors.contact.loadingSpinner)).toBeVisible();
    await expect(page.locator(selectors.contact.loadingSpinner)).not.toBeVisible();
    
    // Check success notification
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toContainText('Спасибо! Мы свяжемся с вами');
    
    // Step 5: Final check for console errors
    const finalErrors = await checkConsoleErrors();
    expect(finalErrors).toHaveLength(0);
  });

  test('user flow with API failures', async ({ page }) => {
    // Mock API failures
    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Chat service unavailable' })
      });
    });
    
    await page.route('**/api/contact', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Contact service unavailable' })
      });
    });
    
    // Step 1: Test chat with API failure
    await page.click(selectors.chat.floatingButton);
    await expect(page.locator(selectors.chat.chatWindow)).toBeVisible();
    
    // Try to send message
    await page.fill(selectors.chat.messageInput, testChatMessages[0]);
    await page.click(selectors.chat.sendButton);
    
    // Check error handling
    await expect(page.locator(selectors.chat.loadingIndicator)).not.toBeVisible();
    const chatMessages = page.locator(selectors.chat.messages);
    await expect(chatMessages).toHaveCount(3);
    await expect(chatMessages.nth(2)).toContainText('Извините, возникла ошибка');
    
    // Close chat
    await page.click(selectors.chat.closeButton);
    
    // Step 2: Test contact form with API failure
    await page.locator(selectors.contact.section).scrollIntoViewIfNeeded();
    await page.fill(selectors.contact.nameInput, testUserData.name);
    await page.fill(selectors.contact.contactInput, testUserData.contact);
    await page.click(selectors.contact.serviceSelect);
    await page.click('[data-value="Цифровой аудит"]');
    
    // Submit form
    await page.click(selectors.contact.submitButton);
    await expect(page.locator(selectors.contact.loadingSpinner)).not.toBeVisible();
    
    // Check error handling
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toContainText('Ошибка. Попробуйте ещё раз');
    
    // Form should retain data after error
    await expect(page.locator(selectors.contact.nameInput)).toHaveValue(testUserData.name);
  });

  test('mobile user flow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Step 1: Check hero on mobile
    await expect(page.locator(selectors.hero.section)).toBeVisible();
    
    // Step 2: Test chat on mobile
    await page.click(selectors.chat.floatingButton);
    await expect(page.locator(selectors.chat.chatWindow)).toBeVisible();
    
    // Chat should take full screen on mobile
    const chatWindow = page.locator(selectors.chat.chatWindow);
    const boundingBox = await chatWindow.boundingBox();
    expect(boundingBox.width).toBeGreaterThan(350);
    
    // Test chat functionality
    await page.fill(selectors.chat.messageInput, testChatMessages[1]);
    await page.click(selectors.chat.sendButton);
    await expect(page.locator(selectors.chat.loadingIndicator)).not.toBeVisible();
    
    // Close chat
    await page.click(selectors.chat.closeButton);
    
    // Step 3: Test contact form on mobile
    await page.locator(selectors.contact.section).scrollIntoViewIfNeeded();
    await expect(page.locator(selectors.contact.section)).toBeVisible();
    
    // Fill and submit form
    await page.fill(selectors.contact.nameInput, testUserData.name);
    await page.fill(selectors.contact.contactInput, testUserData.contact);
    await page.click(selectors.contact.serviceSelect);
    await page.click('[data-value="AI-ассистент 24/7"]');
    
    await page.click(selectors.contact.submitButton);
    await expect(page.locator(selectors.contact.loadingSpinner)).not.toBeVisible();
    
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toContainText('Спасибо! Мы свяжемся с вами');
  });

  test('accessibility and keyboard navigation', async ({ page }) => {
    // Test keyboard navigation through main elements
    
    // Focus on hero CTA button
    await page.keyboard.press('Tab');
    await expect(page.locator(selectors.hero.ctaButton)).toBeFocused();
    
    // Press Enter to navigate
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    // Test chat keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(selectors.chat.floatingButton)).toBeFocused();
    await page.keyboard.press('Enter');
    
    await expect(page.locator(selectors.chat.chatWindow)).toBeVisible();
    
    // Test chat input with keyboard
    await page.fill(selectors.chat.messageInput, testChatMessages[2]);
    await page.keyboard.press('Enter');
    
    await expect(page.locator(selectors.chat.loadingIndicator)).toBeVisible();
    await expect(page.locator(selectors.chat.loadingIndicator)).not.toBeVisible();
    
    // Close chat with Escape key
    await page.keyboard.press('Escape');
    await expect(page.locator(selectors.chat.chatWindow)).not.toBeVisible();
    
    // Navigate to contact form
    await page.locator(selectors.contact.section).scrollIntoViewIfNeeded();
    await page.focus(selectors.contact.nameInput);
    
    // Fill form with keyboard
    await page.keyboard.type(testUserData.name);
    await page.keyboard.press('Tab');
    await page.keyboard.type(testUserData.contact);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Open select
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter'); // Select first option
    await page.keyboard.press('Tab');
    await page.keyboard.type(testUserData.message);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Submit form
    
    await expect(page.locator(selectors.contact.loadingSpinner)).not.toBeVisible();
  });

  test('performance and loading states', async ({ page }) => {
    // Monitor performance during user flow
    const performanceMetrics = [];
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        performanceMetrics.push({
          url: response.url(),
          status: response.status(),
          timing: Date.now()
        });
      }
    });
    
    // Test loading states
    await page.click(selectors.chat.floatingButton);
    await page.fill(selectors.chat.messageInput, testChatMessages[0]);
    await page.click(selectors.chat.sendButton);
    
    // Check loading indicator appears immediately
    await expect(page.locator(selectors.chat.loadingIndicator)).toBeVisible();
    
    // Wait for response
    await expect(page.locator(selectors.chat.loadingIndicator)).not.toBeVisible();
    
    // Check API call was made
    const chatApiCall = performanceMetrics.find(m => m.url.includes('/api/chat'));
    expect(chatApiCall).toBeTruthy();
    expect(chatApiCall.status).toBe(200);
    
    // Test contact form loading
    await page.locator(selectors.contact.section).scrollIntoViewIfNeeded();
    await page.fill(selectors.contact.nameInput, testUserData.name);
    await page.fill(selectors.contact.contactInput, testUserData.contact);
    await page.click(selectors.contact.serviceSelect);
    await page.click('[data-value="Цифровой аудит"]');
    
    await page.click(selectors.contact.submitButton);
    await expect(page.locator(selectors.contact.loadingSpinner)).toBeVisible();
    await expect(page.locator(selectors.contact.loadingSpinner)).not.toBeVisible();
    
    // Check contact API call was made
    const contactApiCall = performanceMetrics.find(m => m.url.includes('/api/contact'));
    expect(contactApiCall).toBeTruthy();
    expect(contactApiCall.status).toBe(200);
  });
});