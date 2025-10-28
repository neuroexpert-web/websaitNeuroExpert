# E2E Tests with Playwright

This directory contains end-to-end tests for the NeuroExpert application using Playwright.

## Test Coverage

### Hero Section Tests (`hero.spec.js`)
- ✅ Hero section loads without console errors
- ✅ Hero content displays correctly
- ✅ Video loading and fallback handling
- ✅ CTA button navigation
- ✅ Mobile responsiveness

### AI Chat Tests (`chat.spec.js`)
- ✅ Chat window open/close functionality
- ✅ Message sending and AI responses
- ✅ Quick action buttons
- ✅ API error handling
- ✅ Empty message validation
- ✅ Conversation history
- ✅ Mobile responsiveness
- ✅ Keyboard navigation (Enter key)

### Contact Form Tests (`contact-form.spec.js`)
- ✅ Form display and validation
- ✅ Successful form submission
- ✅ Required field validation
- ✅ API error handling
- ✅ Different service selections
- ✅ Optional message field
- ✅ Long message handling
- ✅ Mobile responsiveness
- ✅ Social media links

### Main User Flow Tests (`main-user-flow.spec.js`)
- ✅ Complete user journey (hero → chat → contact)
- ✅ User flow with API failures
- ✅ Mobile user flow
- ✅ Accessibility and keyboard navigation
- ✅ Performance and loading states

## Setup

### Prerequisites
- Node.js 19+
- npm or yarn

### Installation
```bash
cd frontend
npm install
npm run test:e2e:install
```

### Running Tests

#### Run all tests
```bash
npm run test:e2e
```

#### Run tests with UI (recommended for development)
```bash
npm run test:e2e:ui
```

#### Run tests in headed mode (visible browser)
```bash
npm run test:e2e:headed
```

#### Debug tests
```bash
npm run test:e2e:debug
```

#### Run specific test file
```bash
npx playwright test tests/e2e/hero.spec.js
```

#### Run tests on specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

#### Run mobile tests
```bash
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

### Test Reports

#### View HTML report
```bash
npm run test:e2e:report
```

Reports are generated in `playwright-report/index.html`

### Mock Server

Tests use MSW (Mock Service Worker) to mock API responses:
- **Chat API**: `/api/chat` - Returns contextual AI responses
- **Contact API**: `/api/contact` - Handles form submission
- **Error scenarios**: Mocks 500 errors for testing error handling

### Test Data

Common test data is defined in `utils/test-helpers.js`:
- `testUserData`: Sample contact form data
- `testChatMessages`: Sample chat messages for testing
- `selectors`: Centralized element selectors using test IDs

### Test IDs

Components are instrumented with `data-testid` attributes for reliable test selection:
- Hero: `[data-testid="hero-section"]`, `[data-testid="hero-title"]`, etc.
- Chat: `[data-testid="chat-float-button"]`, `[data-testid="chat-window"]`, etc.
- Contact: `[data-testid="contact-section"]`, `[data-testid="contact-name-input"]`, etc.

## CI/CD Integration

E2E tests run automatically in GitHub Actions on:
- Push to `master` branch
- Pull requests to `master`
- Push to `feat-e2e-playwright-key-flows` branch

### Workflow Jobs
1. **E2E Tests**: Full test suite on desktop browsers
2. **E2E Tests Mobile**: Mobile viewport tests
3. **E2E Tests Cross Browser**: Individual browser tests (Chromium, Firefox, WebKit)

### Artifacts
- **Test reports**: HTML and JSON reports
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: On failure

## Best Practices

### Test Organization
- Tests are organized by feature/component
- Common utilities are shared in `utils/`
- Mocks are centralized in `mocks/`

### Selectors
- Use `data-testid` attributes for reliable test selection
- Avoid CSS selectors that can change with styling
- Centralize selectors in `utils/test-helpers.js`

### Error Handling
- Test both success and failure scenarios
- Mock API errors to test error handling
- Verify loading states and user feedback

### Accessibility
- Test keyboard navigation
- Verify mobile responsiveness
- Check screen reader compatibility

### Performance
- Monitor API response times
- Test loading states
- Verify smooth animations

## Debugging

### Debug Mode
```bash
npm run test:e2e:debug
```

### VS Code Integration
Install Playwright VS Code extension for:
- Test discovery
- Debugging
- Code completion

### Trace Viewer
```bash
npx playwright show-trace test-results/trace.zip
```

## Contributing

When adding new tests:
1. Add `data-testid` attributes to components
2. Update selectors in `utils/test-helpers.js`
3. Add tests to appropriate spec file
4. Test on multiple browsers and viewports
5. Update this README if needed

## Troubleshooting

### Common Issues
- **Browser not found**: Run `npx playwright install`
- **Timeouts**: Increase wait times or add better selectors
- **Flaky tests**: Use proper waits and avoid race conditions
- **Mock failures**: Check mock server setup and handlers

### Getting Help
- Check Playwright documentation: https://playwright.dev/
- Review test logs and traces
- Use debug mode for step-by-step execution