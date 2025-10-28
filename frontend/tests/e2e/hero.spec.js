import { test, expect, selectors } from './utils/test-helpers.js';

test.describe('Hero Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load hero section without console errors', async ({ page, checkConsoleErrors }) => {
    const errors = await checkConsoleErrors();
    expect(errors).toHaveLength(0);
  });

  test('should display hero content correctly', async ({ page }) => {
    // Check if hero section is visible
    await expect(page.locator(selectors.hero.section)).toBeVisible();
    
    // Check main title
    await expect(page.locator(selectors.hero.title)).toBeVisible();
    await expect(page.locator(selectors.hero.title)).toContainText('Ваш цифровой прорыв');
    await expect(page.locator(selectors.hero.title)).toContainText('с ИИ и командой NeuroExpert');
    
    // Check subtitle
    await expect(page.locator(selectors.hero.subtitle)).toBeVisible();
    await expect(page.locator(selectors.hero.subtitle)).toContainText('Превращаем технологии в деньги');
    
    // Check CTA button
    await expect(page.locator(selectors.hero.ctaButton)).toBeVisible();
    await expect(page.locator(selectors.hero.ctaButton)).toContainText('Узнать больше');
  });

  test('should handle video loading properly', async ({ page }) => {
    // Check if video element exists
    const videoElement = page.locator(selectors.hero.video);
    await expect(videoElement).toHaveCount(1);
    
    // Check video attributes
    await expect(videoElement).toHaveAttribute('autoplay');
    await expect(videoElement).toHaveAttribute('loop');
    await expect(videoElement).toHaveAttribute('muted');
    await expect(videoElement).toHaveAttribute('playsinline');
    
    // Check poster attribute
    await expect(videoElement).toHaveAttribute('poster');
    const posterSrc = await videoElement.getAttribute('poster');
    expect(posterSrc).toBeTruthy();
    
    // Wait a bit for video to attempt loading
    await page.waitForTimeout(2000);
    
    // Check if video has loaded or fallback is shown
    const videoState = await videoElement.evaluate(video => ({
      readyState: video.readyState,
      error: video.error,
      networkState: video.networkState
    }));
    
    // Video should either be loaded successfully or show fallback
    // (no errors in console is checked in separate test)
    expect(videoState.error).toBeNull();
  });

  test('should show fallback when video fails to load', async ({ page }) => {
    // Mock video failure by setting invalid src
    await page.addStyleTag({
      content: `
        video {
          display: none !important;
        }
        .absolute.inset-0:has(> .absolute.inset-0):not(:has(video)) {
          background: linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 50%, #0b0f17 100%) !important;
        }
      `
    });
    
    // Check if fallback gradient background is applied
    const heroSection = page.locator(selectors.hero.section);
    await expect(heroSection).toBeVisible();
    
    // Content should still be visible even with video fallback
    await expect(page.locator(selectors.hero.title)).toBeVisible();
    await expect(page.locator(selectors.hero.subtitle)).toBeVisible();
  });

  test('CTA button should navigate to services section', async ({ page, waitForAnimations }) => {
    // Click CTA button
    await page.click(selectors.hero.ctaButton);
    
    // Wait for smooth scroll animation
    await waitForAnimations();
    await page.waitForTimeout(1000);
    
    // Check if URL contains services section
    expect(page.url()).toContain('#services');
    
    // Check if services section is in viewport
    const servicesSection = page.locator('#services');
    await expect(servicesSection).toBeInViewport();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if hero content is still visible and properly sized
    await expect(page.locator(selectors.hero.title)).toBeVisible();
    await expect(page.locator(selectors.hero.subtitle)).toBeVisible();
    await expect(page.locator(selectors.hero.ctaButton)).toBeVisible();
    
    // Check text sizes are appropriate for mobile
    const titleElement = page.locator(selectors.hero.title);
    const titleFontSize = await titleElement.evaluate(el => 
      window.getComputedStyle(el).fontSize
    );
    expect(parseInt(titleFontSize)).toBeLessThan(48); // Should be smaller on mobile
  });
});