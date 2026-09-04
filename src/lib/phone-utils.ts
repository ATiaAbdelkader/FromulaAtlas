/**
 * Phone number utilities — E.164 normalization for Algerian numbers.
 *
 * Algeria country code: +213
 * Local mobile numbers: 5XX-XXX-XXX, 6XX-XXX-XXX, 7XX-XXX-XXX (9 digits)
 * Local landline: 0XX-XXX-XXX (some 9, some 10 digits)
 *
 * Examples accepted:
 *   "0661234567"      → "+213661234567"
 *   "213661234567"    → "+213661234567"
 *   "+213661234567"   → "+213661234567"
 *   "0661 23 45 67"   → "+213661234567"
 *   "0661.23.45.67"   → "+213661234567"
 *   "00213661234567"  → "+213661234567"
 *
 * Returns null if the number is not a valid Algerian mobile.
 *
 * Foundation mode: we validate FORMAT only. Actual phone ownership
 * verification happens via WhatsApp OTP once WHATSAPP_SEND_MODE=live.
 */

const ALGERIA_COUNTRY_CODE = '213';

/**
 * Normalize any reasonable Algerian phone input to E.164 format.
 * Returns null if invalid.
 */
export function normalizeAlgerianPhone(input: string): string | null {
  if (!input) return null;
  // Strip everything except digits and leading +
  let s = input.trim().replace(/[^\d+]/g, '');

  // Handle leading +
  if (s.startsWith('+')) {
    if (s.startsWith(`+${ALGERIA_COUNTRY_CODE}`)) {
      s = s.slice(1); // drop +
    } else if (s.startsWith('+213')) {
      s = s.slice(1);
    } else {
      // Other country code — not supported in v1
      return null;
    }
  } else if (s.startsWith('00' + ALGERIA_COUNTRY_CODE)) {
    // 00213XXXXXXXXX
    s = s.slice(2);
  } else if (s.startsWith(ALGERIA_COUNTRY_CODE)) {
    // 213XXXXXXXXX
    // keep as is
  } else if (s.startsWith('0')) {
    // 0XXXXXXXXX — local format, replace leading 0 with 213
    s = ALGERIA_COUNTRY_CODE + s.slice(1);
  } else if (s.length === 9) {
    // 9 digits, no prefix — assume local
    s = ALGERIA_COUNTRY_CODE + s;
  } else {
    return null;
  }

  // Now s should be "213" + 9 digits = 12 chars total
  if (!/^213\d{9}$/.test(s)) return null;

  // First digit of the 9-digit local part must be 5, 6, or 7 (mobile)
  const localFirst = s.charAt(3);
  if (!['5', '6', '7'].includes(localFirst)) return null;

  return '+' + s;
}

/**
 * Pretty-print an E.164 Algerian number for UI display.
 * "+213661234567" → "0661 23 45 67"
 */
export function prettyAlgerianPhone(e164: string): string {
  if (!e164.startsWith('+213')) return e164;
  const local = e164.slice(4); // remove "+213"
  if (local.length !== 9) return e164;
  // 0661 23 45 67
  return `0${local.slice(0, 3)} ${local.slice(3, 5)} ${local.slice(5, 7)} ${local.slice(7, 9)}`;
}

/**
 * Mask a phone for display in logs / UI where the farmer shouldn't see
 * the full number (e.g., admin lists).
 * "+213661234567" → "+213 ••• •• 45 67"
 */
export function maskAlgerianPhone(e164: string): string {
  if (!e164.startsWith('+213')) return e164;
  const local = e164.slice(4);
  if (local.length !== 9) return e164;
  return `+213 ••• •• ${local.slice(5, 7)} ${local.slice(7, 9)}`;
}
