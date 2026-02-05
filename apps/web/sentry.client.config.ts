import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // Adjust this value in production to balance data collection and performance.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Set profilesSampleRate to capture profiling data
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Only enable in production to avoid noise during development
  enabled: process.env.NODE_ENV === 'production',

  // Environment tag
  environment: process.env.NODE_ENV,

  // Capture errors during page navigation
  replaysOnErrorSampleRate: 1.0,

  // Capture replay sessions (for debugging user issues)
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

  // Integration for replay
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Filter out known non-critical errors
  ignoreErrors: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    // Network errors that users experience
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    // Common cancelled requests
    'AbortError',
    'The operation was aborted',
    // Script errors from third-party scripts
    'Script error.',
    // Resize observer spam
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
  ],

  // Don't send events for certain URLs
  denyUrls: [
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    // Firefox extensions
    /^moz-extension:\/\//i,
    // Safari extensions
    /^safari-extension:\/\//i,
  ],

  // Additional context
  beforeSend(event) {
    // Don't send events from localhost in production build
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return null;
    }
    return event;
  },
});
