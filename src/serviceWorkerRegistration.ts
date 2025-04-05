export function register() {
  if ('serviceWorker' in navigator) {
    // Wait for the page to load
    window.addEventListener('load', () => {
      // Check if we're in development mode
      if (import.meta.env.DEV) {
        console.log('Skipping service worker registration in development mode');
        return;
      }

      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service worker registered successfully');
          
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('New content is available');
                  } else {
                    console.log('Content is cached for offline use');
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Error during service worker registration:', error);
        });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister()
          .then(() => console.log('Service worker unregistered successfully'))
          .catch((error) => console.error('Error unregistering service worker:', error));
      })
      .catch((error) => {
        console.error('Error finding service worker registration:', error);
      });
  }
}