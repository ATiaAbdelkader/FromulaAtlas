'use client';

/**
 * PostHog telemetry provider — optional, no-op without key.
 *
 * Set NEXT_PUBLIC_POSTHOG_KEY + NEXT_PUBLIC_POSTHOG_HOST in env to enable.
 * Without these, the provider is a no-op (no events tracked, no network calls).
 *
 * Privacy:
 *   - Respects Do Not Track (navigator.doNotTrack)
 *   - Anonymizes IP addresses (PostHog setting)
 *   - No cookies without consent (uses localStorage instead — can be upgraded
 *     to cookie-based with a consent banner when GDPR/Algerian law 18-07
 *     requires it)
 *
 * Usage:
 *   import { PostHogProvider } from '@/components/posthog-provider';
 *   // Wrap your app in <PostHogProvider>...
 *
 *   // Track events anywhere:
 *   import { trackEvent } from '@/lib/telemetry';
 *   trackEvent('today_card_task_completed', { taskId: 'today_irrigation' });
 */

import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react';
import { useEffect, type ReactNode } from 'react';
import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com';

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Only initialize if key is set
    if (!POSTHOG_KEY) return;

    // Respect Do Not Track
    if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') {
      return;
    }

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      // Privacy settings
      capture_pageview: true,  // auto-track page views
      capture_pageleave: true, // track time on page
      persistence: 'localStorage',  // no cookies without consent
      ip: false,  // don't capture IP
      // Performance
      autocapture: false,  // we track events explicitly (less noise)
      disable_session_recording: false,  // enable session replay (useful for UX debugging)
      // Opt-out
      opt_out_capturing_by_default: false,  // opt-in via UI when we add a consent banner
    });
  }, []);

  // If no key, just render children without the provider
  if (!POSTHOG_KEY) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

/**
 * Hook to access PostHog client (for identify, feature flags, etc.)
 * Returns null if PostHog is not initialized.
 */
export function useTelemetry() {
  return usePostHog();
}
