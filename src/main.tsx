import React, { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { router } from './routes';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { setupErrorHandlers } from './utils/errorHandling';
import { StudentDataProvider } from './contexts/StudentDataContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useAuthStore } from './stores/useAuthStore';
import RoleToggle from './components/RoleToggle';
import NotificationTester from './components/NotificationTester';

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

// Auth initialization component
const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const loadUser = useAuthStore(state => state.loadUser);

  useEffect(() => {
    // Load authenticated user on app startup
    loadUser();
  }, [loadUser]);

  return <>{children}</>;
};

// App component
const App: React.FC = () => {
  return (
    <>
      <RouterProvider router={router} />
      <RoleToggle />
      <NotificationTester />
    </>
  );
};

// Ensure we only create the root once
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Check if root is already created (for hot reload scenarios)
let root: any;
if (!(rootElement as any)._reactRootContainer) {
  root = createRoot(rootElement);
  (rootElement as any)._reactRootContainer = root;
} else {
  root = (rootElement as any)._reactRootContainer;
}

root.render(
  <QueryClientProvider client={queryClient}>
    <AuthInitializer>
      <NotificationProvider>
        <StudentDataProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </StudentDataProvider>
      </NotificationProvider>
    </AuthInitializer>
  </QueryClientProvider>
);

// Service worker management
try {
  // Only register service worker in production
  if (process.env.NODE_ENV === 'production') {
    // Register service worker with simpler configuration
    serviceWorkerRegistration.register({
      onUpdate: registration => {
        if (registration && registration.waiting) {
          // When there's an update, prompt the user to refresh
          if (window.confirm('New version available! Reload to update?')) {
            try {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            } catch (error) {
              console.debug('Error while updating service worker:', error);
              // Force reload anyway
              window.location.reload();
            }
          }
        }
      }
    });
  } else {
    // In development, aggressively unregister any existing service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
          registration.unregister().then(() => {
            console.debug('Service worker unregistered in development mode');
          });
        }
      });
    }
    serviceWorkerRegistration.unregister();
  }
} catch (error) {
  console.debug('Error during service worker management:', error);
}
