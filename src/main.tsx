import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { router } from './routes';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { setupErrorHandlers } from './utils/errorHandling';

// Set up global error handlers before rendering the app
setupErrorHandlers();

// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Preload critical images to avoid layout shifts
const preloadCriticalImages = () => {
  // List of critical images to preload
  const criticalImages = [
    '/images/empty-inbox.svg',
    'https://ssl.gstatic.com/classroom/empty_states_v2/streams.svg',
    // Add other critical images here
  ];

  criticalImages.forEach(src => {
    const img = new Image();
    img.src = src;
  });
};

// Run preloading
preloadCriticalImages();

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>
);

// Only register service worker in production
if (process.env.NODE_ENV === 'production') {
  // Register service worker with simpler configuration
  serviceWorkerRegistration.register({
    onUpdate: registration => {
      if (registration && registration.waiting) {
        // When there's an update, prompt the user to refresh
        if (window.confirm('New version available! Reload to update?')) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      }
    }
  });
} else {
  // In development, make sure to unregister any existing service worker
  serviceWorkerRegistration.unregister();
}
