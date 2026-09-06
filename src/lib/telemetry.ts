/**
 * Telemetry helpers — thin wrapper around PostHog.
 *
 * All functions are no-ops if PostHog is not initialized (no key set).
 * This means existing code can call trackEvent() unconditionally —
 * in Foundation mode it does nothing, when the key is set it tracks.
 *
 * Server-side: uses posthog-node (for cron job events, payment webhooks, etc.)
 * Client-side: uses posthog-js (for UI interactions)
 */

import posthog from 'posthog-js';

// ---------------------------------------------------------------------------
// Client-side (browser)
// ---------------------------------------------------------------------------

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

/**
 * Track a custom event.
 * Safe to call anywhere — no-op if PostHog is not initialized.
 */
export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  if (!POSTHOG_KEY || typeof window === 'undefined') return;
  if (typeof posthog === 'undefined') return;
  try {
    posthog.capture(event, properties);
  } catch {
    // Never let telemetry break the app
  }
}

/**
 * Identify the current user (call after login).
 * Properties are stored on the user profile in PostHog.
 */
export function identifyUser(distinctId: string, properties?: Record<string, unknown>): void {
  if (!POSTHOG_KEY || typeof window === 'undefined') return;
  try {
    posthog.identify(distinctId, properties);
  } catch { /* ignore */ }
}

/**
 * Reset the current user (call on logout).
 */
export function resetUser(): void {
  if (!POSTHOG_KEY || typeof window === 'undefined') return;
  try {
    posthog.reset();
  } catch { /* ignore */ }
}

/**
 * Set a feature flag override (for testing).
 */
export function setFeatureFlag(key: string, value: string | boolean): void {
  if (!POSTHOG_KEY || typeof window === 'undefined') return;
  try {
    posthog.featureFlags.override({ [key]: value });
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Server-side (Node.js — for API routes, cron, webhooks)
// ---------------------------------------------------------------------------

let serverClient: import('posthog-node').PostHog | null = null;

async function getServerClient() {
  if (serverClient) return serverClient;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;
  const { PostHog } = await import('posthog-node');
  serverClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
  });
  return serverClient;
}

/**
 * Track a server-side event (from API routes, cron, webhooks).
 */
export async function trackServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  const client = await getServerClient();
  if (!client) return;
  try {
    client.capture({ distinctId, event, properties });
  } catch { /* ignore */ }
}

/**
 * Identify a user server-side (e.g., after auth, after payment).
 */
export async function identifyServerUser(
  distinctId: string,
  properties: Record<string, unknown>,
): Promise<void> {
  const client = await getServerClient();
  if (!client) return;
  try {
    client.identify({ distinctId, properties });
  } catch { /* ignore */ }
}
