/**
 * POST /api/auth/otp/send
 *
 * Body: { phoneE164: string }
 * Response: { success: boolean, expiresInMs: number, otp?: string, reason?: string }
 *
 * In stub mode (default), the OTP is returned in the response so the dev
 * can see it without checking logs. When WHATSAPP_SEND_MODE=live, the OTP
 * is sent via WhatsApp template `otp_verify_v1` and not returned.
 *
 * Rate limited: 3 OTPs per phone per 10 minutes.
 */

import { NextResponse } from 'next/server';
import { normalizeAlgerianPhone } from '@/lib/phone-utils';
import { generateOtp } from '@/lib/otp-store';
import { getWhatsAppClient } from '@/lib/whatsapp-client';

export async function POST(req: Request) {
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
      languageCode: 'ar',  // TODO: localize based on Accept-Language header
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
