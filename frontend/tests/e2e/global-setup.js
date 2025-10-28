// Global setup for Playwright tests
async function globalSetup(config) {
  console.log('🚀 Starting Playwright E2E test setup...');
  
  // Additional setup can be added here if needed
  console.log('✅ Global setup complete');
}

module.exports = globalSetup;