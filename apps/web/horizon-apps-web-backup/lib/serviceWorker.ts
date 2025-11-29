// Service Worker registration and management

export const isServiceWorkerSupported = () => {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
};

export const registerServiceWorker = async () => {
  if (!isServiceWorkerSupported()) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    console.log('Registering Service Worker...');
    
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered successfully:', registration);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('New Service Worker available');
          
          // Optionally show update notification
          if (window.confirm('New version available! Reload to update?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      });
    });

    // Listen for controlling service worker changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker controller changed');
      window.location.reload();
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

export const unregisterServiceWorker = async () => {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const unregistered = await registration.unregister();
      console.log('Service Worker unregistered:', unregistered);
      return unregistered;
    }
    return false;
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
    return false;
  }
};

export const clearServiceWorkerCaches = async () => {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration && registration.active) {
      registration.active.postMessage({ type: 'CLEAR_CACHE' });
      console.log('Service Worker cache clear requested');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to clear Service Worker caches:', error);
    return false;
  }
};

// Utility to check if app is running offline
export const useOfflineStatus = () => {
  const [isOffline, setIsOffline] = React.useState(
    typeof window !== 'undefined' ? !navigator.onLine : false
  );

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOffline;
};

// Network-aware data fetching
export const createNetworkAwareFetch = (fallbackData?: any) => {
  return async (url: string, options?: RequestInit) => {
    try {
      const response = await fetch(url, {
        ...options,
        // Add cache headers for better caching
        headers: {
          'Cache-Control': 'max-age=300', // 5 minutes
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      console.warn('Network request failed, checking cache...', error);
      
      // Try to get from cache via service worker
      const cache = await caches.open('sonic-dynamic-v1');
      const cachedResponse = await cache.match(url);
      
      if (cachedResponse) {
        console.log('Serving from cache:', url);
        return cachedResponse;
      }
      
      if (fallbackData) {
        console.log('Using fallback data for:', url);
        return new Response(JSON.stringify(fallbackData), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      throw error;
    }
  };
};

// Preload critical resources
export const preloadCriticalResources = () => {
  const criticalUrls = [
    '/markets',
    '/api/markets',
    // Add other critical resources
  ];

  criticalUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
};

// React import
import React from 'react';
