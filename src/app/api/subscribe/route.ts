/**
 * GET /api/subscribe — get the current farmer's subscription status.
 * POST /api/subscribe — create or update subscription (consent flow).
 * DELETE /api/subscribe — unsubscribe (set unsubscribedAt, keep record for audit).
 *
 * All endpoints require authentication. The farmer's id comes from the
 * session, NOT from the request body (prevents IDOR).
 *
 * Foundation mode: in stub mode, the subscription is created but no
 * WhatsApp message is sent. When live, a welcome template is sent on
 * first subscription.
 */

import { NextResponse } from 'next/server';
import { getFarmerFromRequest } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { getWhatsAppClient } from '@/lib/whatsapp-client';
import { trackServerEvent } from '@/lib/telemetry';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const SubscribeBody = z.object({
  enabled: z.boolean().default(true),
  preferredTime: z.string().regex(/^\d{2}:\d{2}$/, 'preferredTime must be HH:MM').default('06:00'),
  consentAccepted: z.literal(true),  // must be explicitly true
  consentVersion: z.string().default('1.0'),
});

const UnsubscribeBody = z.object({
  reason: z.string().max(200).optional(),
});

// ---------------------------------------------------------------------------
// GET — current subscription
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  const farmer = await getFarmerFromRequest(req);
  if (!farmer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sub = await db.subscription.findUnique({
      where: { farmerId: farmer.id },
      select: {
        enabled: true,
        preferredTime: true,
        consentedAt: true,
        consentVersion: true,
        unsubscribedAt: true,
        nextSendAt: true,
      },
    });

    return NextResponse.json({
      farmer: {
        phoneE164: farmer.phoneE164,
        language: farmer.language,
        displayName: farmer.displayName,
      },
      subscription: sub ?? null,
    });
  } catch (e) {
    console.error('[subscribe GET]', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — subscribe (or update subscription)
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  const farmer = await getFarmerFromRequest(req);
  if (!farmer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = SubscribeBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { enabled, preferredTime, consentAccepted, consentVersion } = parsed.data;

  // Extract IP for audit (consentIp)
  const consentIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  // Validate preferredTime is a real time
  const [h, m] = preferredTime.split(':').map((s) => parseInt(s, 10));
  if (h < 0 || h > 23 || m < 0 || m > 59) {
    return NextResponse.json({ error: 'Invalid preferredTime' }, { status: 400 });
  }

  try {
    // Compute nextSendAt — next occurrence of preferredTime in Africa/Algiers
    // Algeria is UTC+1, no DST.
    const nextSendAt = computeNextSendAt(preferredTime);

    // Upsert subscription (1:1 with farmer)
    const sub = await db.subscription.upsert({
      where: { farmerId: farmer.id },
      create: {
        farmerId: farmer.id,
        enabled,
        preferredTime,
        consentedAt: new Date(),
        consentIp,
        consentVersion,
        nextSendAt,
      },
      update: {
        enabled,
        preferredTime,
        // Re-consenting — update timestamp + version
        consentedAt: new Date(),
        consentIp,
        consentVersion,
        unsubscribedAt: null,  // resubscribe clears unsubscribe
        nextSendAt,
      },
    });

    // Send welcome template if this is a new subscription AND we're in live mode
    const wasUnsubscribed = !sub.createdAt || sub.createdAt.getTime() === sub.updatedAt.getTime();
    if (enabled && wasUnsubscribed) {
      const client = getWhatsAppClient();
      if (client.mode === 'live') {
        await client.sendTemplate({
          to: farmer.phoneE164,
          templateName: 'welcome_v1',
          languageCode: farmer.language.toLowerCase() as 'en' | 'fr' | 'ar',
          components: {
            body: {
              parameters: [
                { type: 'text', text: farmer.displayName ?? 'Farmer' },
                { type: 'text', text: preferredTime },
              ],
            },
          },
        });
      } else {
        console.log(`[subscribe:stub] Would send welcome_v1 to ${farmer.phoneE164}`);
      }
    }

    // Track subscription event
    await trackServerEvent(farmer.id, 'subscription_created', {
      preferredTime,
      language: farmer.language,
      wasResubscribing: sub.unsubscribedAt !== null,
    });

    return NextResponse.json({ success: true, subscription: sub });
  } catch (e) {
    console.error('[subscribe POST]', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — unsubscribe
// ---------------------------------------------------------------------------

export async function DELETE(req: Request) {
  const farmer = await getFarmerFromRequest(req);
  if (!farmer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // Empty body is OK
  }
  const parsed = UnsubscribeBody.safeParse(body);
  const reason = parsed.success ? parsed.data.reason : undefined;

  try {
    const sub = await db.subscription.findUnique({ where: { farmerId: farmer.id } });
    if (!sub) {
      return NextResponse.json({ error: 'No subscription to unsubscribe' }, { status: 404 });
    }

    await db.subscription.update({
      where: { farmerId: farmer.id },
      data: {
        enabled: false,
        unsubscribedAt: new Date(),
        unsubscribeReason: reason ?? 'user_api_call',
        nextSendAt: null,
      },
    });

    // Send unsubscribe confirmation (live mode only)
    const client = getWhatsAppClient();
    if (client.mode === 'live') {
      await client.sendTemplate({
        to: farmer.phoneE164,
        templateName: 'unsubscribe_confirmation_v1',
        languageCode: farmer.language.toLowerCase() as 'en' | 'fr' | 'ar',
      });
    } else {
      console.log(`[subscribe:stub] Would send unsubscribe_confirmation_v1 to ${farmer.phoneE164}`);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[subscribe DELETE]', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute the next occurrence of `HH:MM` in Africa/Algiers timezone,
 * returned as a UTC Date. If the time has already passed today (in Algeria),
 * returns tomorrow at that time.
 *
 * Algeria is UTC+1 year-round (no DST).
 */
function computeNextSendAt(preferredTime: string): Date {
  const [h, m] = preferredTime.split(':').map((s) => parseInt(s, 10));
  const now = new Date();
  // Current time in Algeria = UTC + 1
  const nowInAlgeria = new Date(now.getTime() + 60 * 60 * 1000);
  // Today at preferredTime in Algeria
  const todayInAlgeria = new Date(nowInAlgeria);
  todayInAlgeria.setUTCHours(h, m, 0, 0);
  // If today's slot has passed, use tomorrow
  const target = todayInAlgeria <= nowInAlgeria
    ? new Date(todayInAlgeria.getTime() + 24 * 60 * 60 * 1000)
    : todayInAlgeria;
  // Convert back to UTC
  return new Date(target.getTime() - 60 * 60 * 1000);
}
