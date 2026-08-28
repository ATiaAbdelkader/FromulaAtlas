'use client';

import { useEffect } from 'react';

/**
 * Registers /sw.js when running in a production build. In development the
 * service worker is intentionally skipped to avoid caching stale assets.
 *
 * Renders nothing — it's a pure side-effect component.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // Only register in production.
    if (process.env.NODE_ENV !== 'production') return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch (err) {
        console.warn('Service worker registration failed:', err);
      }
    };

    // Wait until the page has fully loaded to avoid competing with first paint.
    if (document.readyState === 'complete') {
      void register();
    } else {
      window.addEventListener('load', register, { once: true });
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}

export default ServiceWorkerRegister;
