'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '../lib/service-worker';
import { preloadComponents } from '../lib/lazy-components';

export function ClientInitializer() {
  useEffect(() => {
    // Register service worker for caching
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker();
    }

    // Preload components that are likely to be used
    preloadComponents();

    // Prefetch critical resources
    const prefetchResources = () => {
      // Prefetch likely navigation targets
      const links = document.querySelectorAll('a[href]');
      links.forEach((link) => {
        const href = (link as HTMLAnchorElement).href;
        if (href && href.startsWith(window.location.origin)) {
          const prefetchLink = document.createElement('link');
          prefetchLink.rel = 'prefetch';
          prefetchLink.href = href;
          document.head.appendChild(prefetchLink);
        }
      });
    };

    // Defer prefetching to avoid blocking initial render
    setTimeout(prefetchResources, 3000);

    // Performance optimization: Remove unused CSS
    const removeUnusedCSS = () => {
      // This is a simplified example - in production you might use a more sophisticated approach
      const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
      stylesheets.forEach((stylesheet) => {
        const link = stylesheet as HTMLLinkElement;
        if (link.href && !link.href.includes('fonts')) {
          // Check if stylesheet is actually being used
          // This is a basic implementation - you might want to use a library like PurgeCSS
        }
      });
    };

    // Run after initial render
    setTimeout(removeUnusedCSS, 5000);

    // Memory cleanup
    return () => {
      // Clean up any event listeners or timers if needed
    };
  }, []);

  return null; // This component doesn't render anything
}

export default ClientInitializer;