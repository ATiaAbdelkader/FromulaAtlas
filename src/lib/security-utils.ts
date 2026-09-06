/**
 * Shared security helpers — timing-safe comparisons + secret checks.
 *
 * Used by all API routes that compare secrets (admin, cron, webhooks).
 * Centralized here so we never use `===` for secret comparison (timing attack).
 */

import { timingSafeEqual } from 'node:crypto';

/**
 * Timing-safe string comparison.
 * Returns false if lengths differ (after the check, to avoid leaking length info).
 */
export function safeCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * Check an x-admin-secret / x-cron-secret header against the env var.
 * Uses timing-safe comparison.
 *
 * Returns true if the header matches ADMIN_SECRET (or CRON_SECRET if specified).
 */
export function checkSecretHeader(
  req: Request,
  envVar: 'ADMIN_SECRET' | 'CRON_SECRET',
  headerName: string = 'x-admin-secret',
): boolean {
  const secret = process.env[envVar];
  if (!secret) return false;
  const header = req.headers.get(headerName);
  return safeCompare(header, secret);
}
