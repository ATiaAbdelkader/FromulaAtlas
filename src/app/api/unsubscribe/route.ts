/**
 * POST /api/unsubscribe
 *
 * Public endpoint (no auth required) — called from the /unsubscribe page.
 * The farmer clicks a link in their WhatsApp brief, which contains a signed
 * token identifying their subscription.
 *
 * Body: { token: string, reason?: string }
 * Response: { success: boolean, error?: string }
 *
 * On success: sets Subscription.enabled=false + unsubscribedAt=now + reason.
 * Sends unsubscribe_confirmation_v1 template (live mode only).
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getWhatsAppClient } from '@/lib/whatsapp-client';
import { verifyUnsubscribeToken } from '@/lib/unsubscribe-token';
import { z } from 'zod';

const Body = z.object({
  token: z.string().min(1).max(500),
  reason: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { token, reason } = parsed.data;

  // Verify the token
  const verifyResult = verifyUnsubscribeToken(token);
  if (!verifyResult.valid || !verifyResult.farmerId) {
    const status =
      verifyResult.reason === 'expired' ? 410 :  // Gone
      verifyResult.reason === 'bad_signature' ? 403 :  // Forbidden
      400;  // Bad request
    return NextResponse.json(
      { error: `Invalid token: ${verifyResult.reason}` },
      { status },
    );
  }

  try {
    const sub = await db.subscription.findUnique({
      where: { farmerId: verifyResult.farmerId },
    });
    if (!sub) {
      // No subscription to unsubscribe — still return success so the page
      // shows a friendly message (don't leak whether the farmer ID exists)
      return NextResponse.json({ success: true, alreadyUnsubscribed: true });
    }

    if (sub.unsubscribedAt) {
      // Already unsubscribed
      return NextResponse.json({ success: true, alreadyUnsubscribed: true });
    }

    // Update subscription
    await db.subscription.update({
      where: { farmerId: verifyResult.farmerId },
      data: {
        enabled: false,
        unsubscribedAt: new Date(),
        unsubscribeReason: reason ?? 'user_clicked_link',
        nextSendAt: null,
      },
    });

    // Send confirmation (live mode only)
    const farmer = await db.farmer.findUnique({
      where: { id: verifyResult.farmerId },
      select: { phoneE164: true, language: true },
    });
    if (farmer) {
      const client = getWhatsAppClient();
      if (client.mode === 'live') {
        await client.sendTemplate({
          to: farmer.phoneE164,
          templateName: 'unsubscribe_confirmation_v1',
          languageCode: farmer.language.toLowerCase() as 'en' | 'fr' | 'ar',
        });
      } else {
        console.log(`[unsubscribe:stub] Would send confirmation to ${farmer.phoneE164}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[unsubscribe POST]', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
