import { test, expect, selectors, testChatMessages } from './utils/test-helpers.js';

test.describe('AI Chat', () => {
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
    
    await page.goto('/');
    await page.addInitScript(() => {
      // Mock REACT_APP_BACKEND_URL to use relative URLs
      window.localStorage.setItem('REACT_APP_BACKEND_URL', '');
    });
  });

  test('should open and close chat window', async ({ page }) => {
    // Chat should be closed initially
    await expect(page.locator(selectors.chat.chatWindow)).not.toBeVisible();
    
    // Click floating button to open chat
    await page.click(selectors.chat.floatingButton);
    await expect(page.locator(selectors.chat.chatWindow)).toBeVisible();
    
    // Check chat header
    await expect(page.locator('.text-white:has-text("NeuroExpert AI")')).toBeVisible();
    await expect(page.locator('.text-white\\/70:has-text("AI Assistant")')).toBeVisible();
    
    // Check initial message
    await expect(page.locator(selectors.chat.messages)).toContainText('Привет! Я AI‑консультант NeuroExpert');
    
    // Close chat
    await page.click(selectors.chat.closeButton);
    await expect(page.locator(selectors.chat.chatWindow)).not.toBeVisible();
  });

  test('should send message and receive AI response', async ({ page }) => {
    // Open chat
    await page.click(selectors.chat.floatingButton);
    await expect(page.locator(selectors.chat.chatWindow)).toBeVisible();
    
    // Type and send message
    await page.fill(selectors.chat.messageInput, testChatMessages[0]);
    await page.click(selectors.chat.sendButton);
    
    // Check loading state
    await expect(page.locator(selectors.chat.loadingIndicator)).toBeVisible();
    await expect(page.locator(selectors.chat.messageInput)).toBeDisabled();
    await expect(page.locator(selectors.chat.sendButton)).toBeDisabled();
    
    // Wait for response
    await expect(page.locator(selectors.chat.loadingIndicator)).not.toBeVisible();
    
    // Check AI response
    const messages = page.locator(selectors.chat.messages);
    await expect(messages).toHaveCount(3); // Initial + user + AI response
    
    // Check user message
    await expect(messages.nth(1)).toContainText(testChatMessages[0]);
    
    // Check AI response contains relevant content
    await expect(messages.nth(2)).toContainText('Цифровой аудит');
  });

  test('should use quick action buttons', async ({ page }) => {
    // Open chat
    await page.click(selectors.chat.floatingButton);
    await expect(page.locator(selectors.chat.chatWindow)).toBeVisible();
    
    // Click quick action button
    const quickActions = page.locator(selectors.chat.quickActions);
    await quickActions.first().click();
    
    // Check loading state
    await expect(page.locator(selectors.chat.loadingIndicator)).toBeVisible();
    
    // Wait for response
    await expect(page.locator(selectors.chat.loadingIndicator)).not.toBeVisible();
    
    // Check messages
    const messages = page.locator(selectors.chat.messages);
    await expect(messages).toHaveCount(3);
    
    // Check AI response
    await expect(messages.nth(2)).toContainText('Цифровой аудит');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' })
      });
    });
    
    // Open chat
    await page.click(selectors.chat.floatingButton);
    await expect(page.locator(selectors.chat.chatWindow)).toBeVisible();
    
    // Send message
    await page.fill(selectors.chat.messageInput, 'Test message');
    await page.click(selectors.chat.sendButton);
    
    // Wait for error response
    await expect(page.locator(selectors.chat.loadingIndicator)).not.toBeVisible();
    
    // Check error message in chat
    const messages = page.locator(selectors.chat.messages);
    await expect(messages).toHaveCount(3);
    await expect(messages.nth(2)).toContainText('Извините, возникла ошибка');
    
    // Check toast notification (if implemented)
    const toast = page.locator('[data-sonner-toast]');
    if (await toast.count() > 0) {
      await expect(toast).toContainText('ошибка');
    }
  });

  test('should handle empty message input', async ({ page }) => {
    // Open chat
    await page.click(selectors.chat.floatingButton);
    await expect(page.locator(selectors.chat.chatWindow)).toBeVisible();
    
    // Try to send empty message
    await expect(page.locator(selectors.chat.sendButton)).toBeDisabled();
    
    // Type whitespace only
    await page.fill(selectors.chat.messageInput, '   ');
    await expect(page.locator(selectors.chat.sendButton)).toBeDisabled();
    
    // Type actual message
    await page.fill(selectors.chat.messageInput, 'Valid message');
    await expect(page.locator(selectors.chat.sendButton)).toBeEnabled();
  });

  test('should maintain conversation history', async ({ page }) => {
    // Open chat
    await page.click(selectors.chat.floatingButton);
    await expect(page.locator(selectors.chat.chatWindow)).toBeVisible();
    
    // Send multiple messages
    for (const message of testChatMessages.slice(0, 2)) {
      await page.fill(selectors.chat.messageInput, message);
      await page.click(selectors.chat.sendButton);
      
      // Wait for response
      await expect(page.locator(selectors.chat.loadingIndicator)).not.toBeVisible();
    }
    
    // Check conversation history
    const messages = page.locator(selectors.chat.messages);
    await expect(messages).toHaveCount(5); // Initial + 2 user + 2 AI responses
    
    // Verify message order
    await expect(messages.nth(0)).toContainText('Привет! Я AI‑консультант');
    await expect(messages.nth(1)).toContainText(testChatMessages[0]);
    await expect(messages.nth(3)).toContainText(testChatMessages[1]);
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Open chat
    await page.click(selectors.chat.floatingButton);
    await expect(page.locator(selectors.chat.chatWindow)).toBeVisible();
    
    // Check chat takes full screen on mobile
    const chatWindow = page.locator(selectors.chat.chatWindow);
    const boundingBox = await chatWindow.boundingBox();
    expect(boundingBox.width).toBeGreaterThan(350);
    expect(boundingBox.height).toBeGreaterThan(600);
    
    // Test chat functionality on mobile
    await page.fill(selectors.chat.messageInput, testChatMessages[0]);
    await page.click(selectors.chat.sendButton);
    
    await expect(page.locator(selectors.chat.loadingIndicator)).toBeVisible();
    await expect(page.locator(selectors.chat.loadingIndicator)).not.toBeVisible();
    
    const messages = page.locator(selectors.chat.messages);
    await expect(messages).toHaveCount(3);
  });

  test('should handle Enter key to send message', async ({ page }) => {
    // Open chat
    await page.click(selectors.chat.floatingButton);
    await expect(page.locator(selectors.chat.chatWindow)).toBeVisible();
    
    // Type message and press Enter
    await page.fill(selectors.chat.messageInput, testChatMessages[0]);
    await page.press(selectors.chat.messageInput, 'Enter');
    
    // Check message was sent
    await expect(page.locator(selectors.chat.loadingIndicator)).toBeVisible();
    await expect(page.locator(selectors.chat.loadingIndicator)).not.toBeVisible();
    
    const messages = page.locator(selectors.chat.messages);
    await expect(messages).toHaveCount(3);
    await expect(messages.nth(1)).toContainText(testChatMessages[0]);
  });
});