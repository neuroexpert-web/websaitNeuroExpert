import * as Sentry from '@sentry/react';

const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN;
const SENTRY_ENABLED = process.env.REACT_APP_SENTRY_ENABLED === 'true';
const ENVIRONMENT = process.env.REACT_APP_ENVIRONMENT || process.env.NODE_ENV || 'development';
const RELEASE = process.env.REACT_APP_SENTRY_RELEASE || process.env.REACT_APP_VERSION || 'unknown';
const TRACES_SAMPLE_RATE = parseFloat(process.env.REACT_APP_SENTRY_TRACES_SAMPLE_RATE || '0.1');

let sentryInitialized = false;

/**
 * Filter PII from Sentry events before sending
 */
function beforeSend(event) {
  // Remove PII from user input
  if (event.request && event.request.data) {
    const data = event.request.data;
    if (typeof data === 'object') {
      ['name', 'contact', 'email', 'phone', 'message'].forEach(key => {
        if (data[key]) {
          data[key] = '[FILTERED]';
        }
      });
    }
  }

  // Remove PII from breadcrumbs
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
      if (breadcrumb.data) {
        ['name', 'contact', 'email', 'phone'].forEach(key => {
          if (breadcrumb.data[key]) {
            breadcrumb.data[key] = '[FILTERED]';
          }
        });
      }
      return breadcrumb;
    });
  }

  // Remove PII from extra context
  if (event.extra) {
    Object.keys(event.extra).forEach(key => {
      if (/name|contact|email|phone|message/i.test(key)) {
        event.extra[key] = '[FILTERED]';
      }
    });
  }

  // Remove user PII
  if (event.user) {
    event.user = {
      id: event.user.id || '[FILTERED]',
    };
  }

  return event;
}

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initSentry() {
  // Only initialize if DSN is provided and Sentry is explicitly enabled
  // OR if in production-like environment (staging, production)
  const shouldInit = 
    SENTRY_DSN && 
    (SENTRY_ENABLED || ['production', 'staging'].includes(ENVIRONMENT));

  if (!shouldInit) {
    console.log(
      `[Sentry] Disabled (dsn: ${!!SENTRY_DSN}, enabled: ${SENTRY_ENABLED}, env: ${ENVIRONMENT})`
    );
    return;
  }

  try {
    const integrations = [
      Sentry.browserTracingIntegration({
        tracePropagationTargets: ['localhost', /^\//],
      }),
    ];

    const supportsReplay = typeof Sentry.replayIntegration === 'function';
    if (supportsReplay) {
      integrations.push(
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      );
    }

    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENVIRONMENT,
      release: RELEASE,
      integrations,
      tracesSampleRate: TRACES_SAMPLE_RATE,
      beforeSend,
      sendDefaultPii: false,
      ignoreErrors: [
        'top.GLOBALS',
        'chrome-extension://',
        'moz-extension://',
        'fb_xd_fragment',
        'NetworkError',
        'Network request failed',
        'Failed to fetch',
        'Load failed',
        'AbortError',
        'The user aborted a request',
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
      ],
      normalizeDepth: 3,
      ...(supportsReplay
        ? {
            replaysSessionSampleRate: 0.0,
            replaysOnErrorSampleRate: 1.0,
          }
        : {}),
    });

    sentryInitialized = true;

    Sentry.setTag('app.name', 'neuroexpert-frontend');
    Sentry.setTag('deployment', ENVIRONMENT);
    Sentry.setTag('replay.enabled', supportsReplay ? 'true' : 'false');

    // Set user context (without PII)
    Sentry.setUser({
      id: `visitor-${Math.random().toString(36).slice(2, 10)}`,
    });

    console.log(`[Sentry] ✅ Initialized: ${ENVIRONMENT} [${RELEASE}]`);
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
  }
}

/**
 * Capture an exception to Sentry
 */
export function captureException(error, context = {}) {
  if (sentryInitialized) {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('[Sentry] Exception (not initialized):', error, context);
  }
}

/**
 * Capture a message to Sentry
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (sentryInitialized) {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  } else {
    console.log(`[Sentry] Message (not initialized) [${level.toUpperCase()}] ${message}`, context);
  }
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addBreadcrumb(message, category = 'user-action', data = {}) {
  if (sentryInitialized) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }
}

export { Sentry };
