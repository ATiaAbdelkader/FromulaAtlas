/**
 * POST /api/auth/otp/verify
 *
 * Body: { phone: string, otp: string }
 * Response: { success: boolean, error?: string, attemptsRemaining?: number }
 *
 * On success: signs a NextAuth session via the phone-otp credentials provider.
 * The client then calls signIn() directly with the same phone + otp.
 *
 * Why a separate verify endpoint (vs. just calling signIn directly)?
 *   - We want to return structured error responses (attemptsRemaining, etc.)
 *     that NextAuth's signIn() doesn't expose cleanly.
 *   - We can add reCAPTCHA / IP rate limiting here without coupling to NextAuth.
 */

import { NextResponse } from 'next/server';
import { normalizeAlgerianPhone } from '@/lib/phone-utils';
import { verifyOtp } from '@/lib/otp-store';

export async function POST(req: Request) {
  let body: { phone?: string; otp?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const phoneRaw = body?.phone;
  const otpRaw = body?.otp;

  if (typeof phoneRaw !== 'string' || typeof otpRaw !== 'string') {
    return NextResponse.json({ success: false, error: 'Phone and OTP required' }, { status: 400 });
  }

  const phoneE164 = normalizeAlgerianPhone(phoneRaw);
  if (!phoneE164) {
    return NextResponse.json({ success: false, error: 'Invalid phone number' }, { status: 400 });
  }

  // Normalize OTP — strip non-digits, require exactly 6
  const otp = otpRaw.replace(/\D/g, '');
  if (otp.length !== 6) {
    return NextResponse.json({ success: false, error: 'OTP must be 6 digits' }, { status: 400 });
  }

  const result = verifyOtp(phoneE164, otp);
  if (!result.success) {
    const status =
      result.reason === 'max_attempts' ? 429 :
      result.reason === 'not_found' ? 404 :
      400;
    return NextResponse.json(
      {
        success: false,
        error: errorForReason(result.reason),
        reason: result.reason,
        attemptsRemaining: result.attemptsRemaining,
      },
      { status },
    );
  }

  // Success — the client should now call signIn('phone-otp', { phoneE164, otp })
  // We don't sign the session here because NextAuth's signIn must be called
  // client-side to set the cookie properly.
  return NextResponse.json({ success: true, phoneE164 });
}

function errorForReason(reason?: string): string {
  switch (reason) {
    case 'not_found':
      return 'No OTP was sent to this number, or it has expired. Please request a new one.';
    case 'expired':
      return 'OTP has expired. Please request a new one.';
    case 'max_attempts':
      return 'Too many wrong attempts. Please wait 10 minutes and request a new OTP.';
    case 'wrong_code':
      return 'Wrong code. Please try again.';
    default:
      return 'Verification failed.';
  }
}
