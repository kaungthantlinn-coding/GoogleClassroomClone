/**
 * Error handling utilities for the application
 * Helps manage Sentry error reporting and prevents rate limiting issues
 */

// Keep track of error counts to avoid overwhelming Sentry
let errorCount = 0;
const MAX_ERRORS = 10; // Maximum errors to report in a session
const ERROR_RESET_TIME = 60000; // Reset error count after 1 minute

// Tracks when we got rate limited
let rateLimitedUntil = 0;

/**
 * Reports an error to the console and optionally to Sentry
 * with built-in rate limiting protection
 */
export const reportError = (error: Error, context?: Record<string, any>): void => {
  const now = Date.now();
  
  // Log to console regardless of rate limiting
  console.error('[Error]', error.message, context);
  
  // Don't send to Sentry if we're currently rate limited
  if (now < rateLimitedUntil) {
    console.warn('Error reporting is currently rate limited. Skipping Sentry report.');
    return;
  }
  
  // Don't send too many errors
  if (errorCount >= MAX_ERRORS) {
    console.warn(`Maximum error reporting limit (${MAX_ERRORS}) reached. Skipping Sentry report.`);
    return;
  }
  
  // Increment error count
  errorCount++;
  
  // Reset error count after the specified time
  setTimeout(() => {
    errorCount = Math.max(0, errorCount - 1);
  }, ERROR_RESET_TIME);
  
  // Monitor for rate limiting responses and adjust accordingly
  // This would be where Sentry SDK would be called if integrated
  try {
    // Example of where a Sentry SDK call would go
    // Sentry.captureException(error, { extra: context });
    
    // If window._sentryRateLimited is set (we'd set this in our global error handler)
    if (window._sentryRateLimited) {
      console.warn('Sentry rate limit detected. Pausing reports for 5 minutes.');
      rateLimitedUntil = now + 5 * 60 * 1000; // 5 minutes
      window._sentryRateLimited = false;
    }
  } catch (e) {
    console.error('Error while reporting to error service:', e);
  }
};

// Extend Window interface to add our property
declare global {
  interface Window {
    _sentryRateLimited?: boolean;
  }
}

// Set up global error handlers to catch uncaught errors
export const setupErrorHandlers = (): void => {
  // Handle uncaught promises
  window.addEventListener('unhandledrejection', (event) => {
    reportError(new Error(`Unhandled Promise Rejection: ${event.reason}`));
  });
  
  // Handle fetch errors related to Sentry rate limiting
  const originalFetch = window.fetch;
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    
    // If this is a Sentry request
    if (url.includes('sentry.io')) {
      try {
        const response = await originalFetch(input, init);
        
        // Check for rate limiting
        if (response.status === 429) {
          window._sentryRateLimited = true;
          console.warn('Received 429 from Sentry API. Rate limiting error reporting.');
        }
        
        return response;
      } catch (error) {
        console.warn('Error during Sentry API request:', error);
        // Return a mock response to prevent app crashes
        return new Response('{}', { status: 200 });
      }
    }
    
    // Regular fetch for non-Sentry requests
    return originalFetch(input, init);
  };
  
  // Handle image loading errors
  document.addEventListener('error', (event) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'IMG') {
      // Only report if it's not already handled by component error handlers
      if (!target.hasAttribute('data-error-handled')) {
        console.warn('Image failed to load:', (target as HTMLImageElement).src);
      }
    }
  }, true);
};

export default {
  reportError,
  setupErrorHandlers
}; 