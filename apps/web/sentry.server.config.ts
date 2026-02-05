import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring sample rate
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Profile sample rate
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Environment tag
  environment: process.env.NODE_ENV,

  // Filter out known non-critical errors
  ignoreErrors: [
    // Database connection retries
    'Connection terminated unexpectedly',
    // Rate limiting
    'Too many requests',
    // Expected auth failures
    'Invalid token',
    'Token expired',
    'Unauthorized',
  ],

  // Don't capture too much data from errors
  maxValueLength: 1000,

  // Add request data to events
  integrations: [
    Sentry.requestDataIntegration({
      include: {
        cookies: false, // Don't include cookies for privacy
        data: true,
        headers: true,
        ip: false, // Don't include IP for privacy
        query_string: true,
        url: true,
      },
    }),
  ],

  // Customize events before sending
  beforeSend(event, hint) {
    // Don't send events with specific messages
    const message = event.message || '';
    if (
      message.includes('BETTER_AUTH_SECRET') ||
      message.includes('default secret')
    ) {
      return null;
    }

    // Scrub sensitive data from exceptions
    if (event.exception?.values) {
      for (const exception of event.exception.values) {
        if (exception.value) {
          // Remove potential secrets from error messages
          exception.value = exception.value
            .replace(/Bearer\s+[\w-]+/gi, 'Bearer [REDACTED]')
            .replace(/sk_[a-zA-Z0-9_]+/g, '[STRIPE_KEY_REDACTED]')
            .replace(/password[=:]["']?[^"'\s&]+/gi, 'password=[REDACTED]');
        }
      }
    }

    return event;
  },
});
