/**
 * POST /api/auth/otp/send
 *
 * Body: { phone: string }
 * Response: { success: boolean, expiresInMs: number, otp?: string, reason?: string }
 *
 * In stub mode (default), the OTP is returned in the response so the dev
 * can see it without checking logs. When WHATSAPP_SEND_MODE=live, the OTP
 * is sent via WhatsApp template `otp_verify_v1` and not returned.
 *
 * Rate limited:
 *   - Per phone: 3 OTPs per 10 minutes (in otp-store.ts)
 *   - Per IP: 10 OTPs per hour (prevents enumeration attacks)
 */

import { NextResponse, type NextRequest } from 'next/server';
import { normalizeAlgerianPhone } from '@/lib/phone-utils';
import { generateOtp } from '@/lib/otp-store';
import { getWhatsAppClient } from '@/lib/whatsapp-client';
import { getClientKey } from '@/lib/ai-governance';

// Simple IP-based rate limiter for OTP sends
// (separate from AI rate limit — different bucket, different limits)
const OTP_IP_LIMIT = 10;          // max 10 OTPs per IP per hour
const OTP_IP_WINDOW_MS = 60 * 60 * 1000;  // 1 hour
const otpIpStore = new Map<string, { count: number; resetAt: number }>();

function checkOtpIpRateLimit(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const current = otpIpStore.get(ip);
  if (!current || current.resetAt <= now) {
    otpIpStore.set(ip, { count: 1, resetAt: now + OTP_IP_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= OTP_IP_LIMIT) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Detect language from Accept-Language header.
 * Falls back to 'ar' (Algerian default).
 */
function detectLanguageFromRequest(req: NextRequest): 'en' | 'fr' | 'ar' {
  const acceptLang = req.headers.get('accept-language') ?? '';
  if (acceptLang.includes('ar')) return 'ar';
  if (acceptLang.includes('fr')) return 'fr';
  if (acceptLang.includes('en')) return 'en';
  return 'ar';  // default for Algeria
}

export async function POST(req: NextRequest) {
  // IP rate limit — prevents enumeration attacks (attacker requesting OTPs
  // for many different phone numbers from one IP)
  const clientIp = getClientKey(req);
  const ipLimit = checkOtpIpRateLimit(clientIp);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many OTP requests from your IP. Please try again later.', reason: 'ip_rate_limited' },
      { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } },
    );
  }

  let body: { phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const phoneRaw = body?.phone;
  if (typeof phoneRaw !== 'string' || phoneRaw.length === 0) {
    return NextResponse.json({ success: false, error: 'Phone required' }, { status: 400 });
  }

  const phoneE164 = normalizeAlgerianPhone(phoneRaw);
  if (!phoneE164) {
    return NextResponse.json(
      { success: false, error: 'Invalid Algerian phone number. Use format 06XX XXX XXX or +213 6XX XXX XXX.' },
      { status: 400 },
    );
  }

  // Generate + store OTP
  const otpResult = generateOtp(phoneE164);
  if (!otpResult.success) {
    return NextResponse.json(
      { success: false, error: 'Too many OTP requests. Please wait 10 minutes and try again.', reason: otpResult.reason },
      { status: 429 },
    );
  }

  // Send via WhatsApp (stub mode: logs + returns otp in response)
  const client = getWhatsAppClient();
  if (client.mode === 'live' && otpResult.otp) {
    // We have the OTP plaintext here — send it via WhatsApp template
    const sendResult = await client.sendTemplate({
      to: phoneE164,
      templateName: 'otp_verify_v1',
      languageCode: detectLanguageFromRequest(req),
      components: {
        body: {
          parameters: [{ type: 'text', text: otpResult.otp }],
        },
      },
    });
    if (!sendResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to send WhatsApp OTP. Please try again.' },
        { status: 502 },
      );
    }
  } else {
    // Stub mode — log to console for dev visibility
    console.log(`[otp:stub] OTP for ${phoneE164}: ${otpResult.otp}`);
  }

  // Build response
  const response: {
    success: boolean;
    expiresInMs: number;
    otp?: string;
    mode: 'stub' | 'live';
  } = {
    success: true,
    expiresInMs: otpResult.expiresInMs,
    mode: client.mode,
  };

  // Only expose OTP in stub mode (for dev convenience)
  if (client.mode === 'stub' && otpResult.otp) {
    response.otp = otpResult.otp;
  }

  return NextResponse.json(response);
}
