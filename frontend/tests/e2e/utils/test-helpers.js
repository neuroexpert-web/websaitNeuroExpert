import { test as base, expect } from '@playwright/test';

// Custom test fixture with common utilities
export const test = base.extend({
  // Helper to wait for animations to complete
  waitForAnimations: async ({ page }, use) => {
    await use(async () => {
      await page.waitForFunction(() => {
        const animations = document.getAnimations();
        return animations.length === 0 || animations.every(animation => 
          animation.playState === 'idle' || animation.currentTime > 0
        );
      });
    });
  },
  
  // Helper to check for console errors
  checkConsoleErrors: async ({ page }, use) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await use(() => {
      return errors;
    });
  }
});

export { expect };

// Common test data
export const testUserData = {
  name: 'Иван Петров',
  contact: '+7 (999) 123-45-67',
  service: 'Цифровой аудит',
  message: 'Интересует аудит нашего проекта'
};

export const testChatMessages = [
  'Расскажите про цифровой аудит',
  'Интересует AI‑ассистент 24/7',
  'Хочу заказать сайт под ключ'
];

// Common selectors
export const selectors = {
  // Hero section
  hero: {
    section: '[data-testid="hero-section"]',
    title: '[data-testid="hero-title"]',
    subtitle: '[data-testid="hero-subtitle"]',
    ctaButton: '[data-testid="hero-cta-button"]',
    video: 'video',
    videoPoster: 'video[poster]'
  },
  
  // AI Chat
  chat: {
    floatingButton: '[data-testid="chat-float-button"]',
    chatWindow: '[data-testid="chat-window"]',
    closeButton: '[data-testid="chat-close-button"]',
    messageInput: '[data-testid="chat-message-input"]',
    sendButton: '[data-testid="chat-send-button"]',
    quickActions: 'button:has-text("💎"), button:has-text("🤖"), button:has-text("🚀"), button:has-text("🛡️")',
    messages: '.max-w-\\[80\\%\\]',
    loadingIndicator: '.animate-spin'
  },
  
  // Contact Form
  contact: {
    section: '[data-testid="contact-section"]',
    nameInput: '[data-testid="contact-name-input"]',
    contactInput: '[data-testid="contact-phone-input"]',
    serviceSelect: '[data-testid="contact-service-select"]',
    messageTextarea: '[data-testid="contact-message-textarea"]',
    submitButton: '[data-testid="contact-submit-button"]',
    loadingSpinner: '.animate-spin'
  }
};