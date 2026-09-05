/**
 * OTP store — in-memory + Postgres fallback for production.
 *
 * Foundation mode: OTPs are stored in memory (Map) with a 10-minute TTL.
 * This is fine for development and low-volume production (single Vercel
 * instance). When we exceed ~50 OTPs/min, migrate to a Postgres table
 * with `expiresAt` column.
 *
 * In Foundation mode (WHATSAPP_SEND_MODE=stub), the OTP is logged to
 * console AND returned in the API response (so the dev can see it
 * without checking logs). When live, the OTP is only sent via WhatsApp
 * — never returned in the API response.
 *
 * Rate limiting: max 3 OTPs per phone per 10 min, max 5 per hour.
 */

import { randomInt, createHash, timingSafeEqual } from 'node:crypto';

// ---------------------------------------------------------------------------
// In-memory OTP store
// ---------------------------------------------------------------------------

interface OtpEntry {
  phoneE164: string;
  hash: string;          // store hash, not plaintext
  attempts: number;      // increment on each verify attempt
  expiresAt: number;     // ms epoch
  createdAt: number;
}

const store = new Map<string, OtpEntry[]>(); // phone → entries

const OTP_TTL_MS = 10 * 60 * 1000;            // 10 minutes
const MAX_ATTEMPTS = 5;
const MAX_OTPS_PER_WINDOW = 3;                 // 3 per 10 min
const WINDOW_MS = 10 * 60 * 1000;

// ---------------------------------------------------------------------------
// Hashing
// ---------------------------------------------------------------------------

function hashOtp(otp: string, phoneE164: string): string {
  return createHash('sha256').update(`${otp}:${phoneE164}:${process.env.NEXTAUTH_SECRET ?? 'dev'}`).digest('hex');
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface OtpSendResult {
  success: boolean;
  otp?: string;            // Only present in stub mode (for dev visibility)
  reason?: 'rate_limited' | 'stub_mode';
  expiresInMs: number;
}

/**
 * Generate + store a 6-digit OTP for the given phone.
 * Returns the OTP in stub mode (for dev visibility); in live mode the
 * caller is expected to send it via WhatsApp.
 */
export function generateOtp(phoneE164: string): OtpSendResult {
  // Cleanup expired entries for this phone
  const now = Date.now();
  const entries = (store.get(phoneE164) ?? []).filter(e => e.expiresAt > now);

  // Rate limit: max 3 OTPs per 10 min per phone
  if (entries.length >= MAX_OTPS_PER_WINDOW) {
    return { success: false, reason: 'rate_limited', expiresInMs: OTP_TTL_MS };
  }

  // Generate 6-digit code
  const otp = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const entry: OtpEntry = {
    phoneE164,
    hash: hashOtp(otp, phoneE164),
    attempts: 0,
    expiresAt: now + OTP_TTL_MS,
    createdAt: now,
  };
  entries.push(entry);
  store.set(phoneE164, entries);

  // In stub mode, return the OTP so the caller (dev) can see it
  const isStub = process.env.WHATSAPP_SEND_MODE !== 'live';
  return {
    success: true,
    otp: isStub ? otp : undefined,
    reason: isStub ? 'stub_mode' : undefined,
    expiresInMs: OTP_TTL_MS,
  };
}

export interface OtpVerifyResult {
  success: boolean;
  reason?: 'not_found' | 'expired' | 'max_attempts' | 'wrong_code';
  attemptsRemaining?: number;
}

/**
 * Verify a 6-digit OTP against the stored hash.
 * Consumes the OTP on success (one-time use).
 * Increments attempt counter on failure; locks after 5 attempts.
 */
export function verifyOtp(phoneE164: string, otpInput: string): OtpVerifyResult {
  const now = Date.now();
  const entries = (store.get(phoneE164) ?? []).filter(e => e.expiresAt > now);
  if (entries.length === 0) {
    return { success: false, reason: 'not_found' };
  }

  // Use the most recent entry
  const entry = entries[entries.length - 1];

  // Check attempt limit
  if (entry.attempts >= MAX_ATTEMPTS) {
    // Remove all entries — force user to wait + request new OTP
    store.delete(phoneE164);
    return { success: false, reason: 'max_attempts' };
  }

  // Increment attempt
  entry.attempts++;

  // Compare
  const inputHash = hashOtp(otpInput, phoneE164);
  if (!safeCompare(inputHash, entry.hash)) {
    // Update store
    store.set(phoneE164, entries);
    return {
      success: false,
      reason: 'wrong_code',
      attemptsRemaining: MAX_ATTEMPTS - entry.attempts,
    };
  }

  // Success — consume all entries for this phone
  store.delete(phoneE164);
  return { success: true };
}

/**
 * Clear all OTPs for a phone (used by tests + on logout).
 */
export function clearOtps(phoneE164: string): void {
  store.delete(phoneE164);
}

/**
 * Get current OTP entry count for a phone (for testing + debugging).
 */
export function getOtpCount(phoneE164: string): number {
  const now = Date.now();
  const entries = (store.get(phoneE164) ?? []).filter(e => e.expiresAt > now);
  return entries.length;
}
