/**
 * Token generation + verification for the unsubscribe link.
 *
 * The unsubscribe link in WhatsApp briefs looks like:
 *   https://formulaatlas.dz/unsubscribe?token=...
 *
 * The token is a base64url-encoded JSON containing the farmerId + an HMAC
 * signature. This lets us identify the farmer without requiring them to
 * log in (they may be clicking from a phone that isn't their auth device).
 *
 * The HMAC uses NEXTAUTH_SECRET as the key — same secret as the auth JWT,
 * so if the secret rotates, old unsubscribe links become invalid (which
 * is the safe failure mode).
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

const FARMER_ID_REGEX = /^[a-z0-9]{20,30}$/i;  // cuid format

interface UnsubscribeTokenPayload {
  farmerId: string;
  /** ISO date when the token expires (7 days from generation). */
  exp: string;
}

/**
 * Generate an unsubscribe token for a farmer.
 * Valid for 7 days — briefs are daily, so the latest token is always fresh.
 */
export function generateUnsubscribeToken(farmerId: string): string {
  const payload: UnsubscribeTokenPayload = {
    farmerId,
    exp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json, 'utf8').toString('base64url');
  const sig = sign(`${b64}.${payload.exp}`);
  return `${b64}.${sig}`;
}

export interface VerifyResult {
  valid: boolean;
  farmerId?: string;
  reason?: 'invalid_format' | 'bad_signature' | 'expired' | 'invalid_farmer_id';
}

export function verifyUnsubscribeToken(token: string): VerifyResult {
  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, reason: 'invalid_format' };
  }
  const [b64, sig] = parts;

  let payload: UnsubscribeTokenPayload;
  try {
    const json = Buffer.from(b64, 'base64url').toString('utf8');
    payload = JSON.parse(json);
  } catch {
    return { valid: false, reason: 'invalid_format' };
  }

  if (!payload.farmerId || !payload.exp) {
    return { valid: false, reason: 'invalid_format' };
  }
  if (!FARMER_ID_REGEX.test(payload.farmerId)) {
    return { valid: false, reason: 'invalid_farmer_id' };
  }

  // Verify signature
  const expectedSig = sign(`${b64}.${payload.exp}`);
  if (!safeCompare(sig, expectedSig)) {
    return { valid: false, reason: 'bad_signature' };
  }

  // Check expiry
  const expDate = new Date(payload.exp);
  if (Number.isNaN(expDate.getTime()) || expDate.getTime() < Date.now()) {
    return { valid: false, reason: 'expired' };
  }

  return { valid: true, farmerId: payload.farmerId };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function sign(data: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? 'dev-only-secret';
  return createHmac('sha256', secret).update(data).digest('base64url');
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
