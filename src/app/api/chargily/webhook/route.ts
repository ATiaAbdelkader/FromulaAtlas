/**
 * POST /api/chargily/webhook — receive payment confirmations from Chargily.
 *
 * Chargily calls this after a payment is completed (or fails).
 * The body is signed with HMAC-SHA256 using CHARGILY_WEBHOOK_SECRET.
 *
 * On successful payment:
 *   1. Find the ProSubscription by checkoutId (from metadata or webhook body)
 *   2. Set status=ACTIVE, paidAt=now, expiresAt=now+duration
 *   3. Return 200 OK
 *
 * On failed payment:
 *   1. Set status=CANCELLED
 *   2. Return 200 OK (Chargily requires 200 even for failures, or it retries)
 *
 * Foundation mode: no CHARGILY_WEBHOOK_SECRET → acknowledges but does nothing.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyChargilyWebhookSignature } from '@/lib/chargily-client';

export const dynamic = 'force-dynamic';

const PLAN_DURATIONS: Record<string, number | null> = {
  pro_monthly: 30,
  pro_annual: 365,
  coop_monthly: 30,
};

export async function POST(req: Request) {
  const bodyText = await req.text();
  const signature = req.headers.get('signature');

  const webhookSecret = process.env.CHARGILY_WEBHOOK_SECRET;
  const chargilyLive = Boolean(process.env.CHARGILY_SECRET_KEY);

  if (!webhookSecret) {
    // If Chargily is in live mode but webhook secret is missing, REFUSE to
    // process — this is a config error that would cause farmers to pay but
    // never get Pro access (webhook activations silently no-op).
    if (chargilyLive) {
      console.error('[chargily:webhook] CRITICAL: CHARGILY_SECRET_KEY is set but CHARGILY_WEBHOOK_SECRET is missing — refusing to process. Set CHARGILY_WEBHOOK_SECRET in Vercel env vars.');
      return NextResponse.json(
        { error: 'Webhook not configured — CHARGILY_WEBHOOK_SECRET required when CHARGILY_SECRET_KEY is set' },
        { status: 503 },
      );
    }
    // Foundation mode — no Chargily key at all, acknowledge but do nothing
    console.log('[chargily:webhook] No CHARGILY_WEBHOOK_SECRET set — stub mode');
    return NextResponse.json({ ok: true, mode: 'stub' });
  }

  // Verify signature
  if (!verifyChargilyWebhookSignature(bodyText, signature)) {
    console.warn('[chargily:webhook] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  let body: ChargilyWebhookBody;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log('[chargily:webhook] Received:', {
    event: body.event,
    status: body.data?.status,
    checkoutId: body.data?.id,
  });

  // Find the ProSubscription by checkoutId
  const checkoutId = body.data?.id;
  if (!checkoutId) {
    return NextResponse.json({ ok: true });
  }

  const proSub = await db.proSubscription.findFirst({
    where: { checkoutId },
  });
  if (!proSub) {
    console.log(`[chargily:webhook] No ProSubscription for checkout ${checkoutId}`);
    return NextResponse.json({ ok: true });
  }

  // Defense in depth: cross-check that the webhook metadata matches the
  // ProSubscription we found. If Chargily sent metadata.farmerId or
  // metadata.proSubId, verify it matches our record. This prevents an
  // attacker (who somehow bypassed the signature check) from activating
  // another farmer's subscription by guessing checkoutId.
  const metadataFarmerId = body.data?.metadata?.farmerId;
  const metadataProSubId = body.data?.metadata?.proSubId;
  if (metadataProSubId && metadataProSubId !== proSub.id) {
    console.warn(`[chargily:webhook] Metadata mismatch: webhook proSubId=${metadataProSubId} vs DB id=${proSub.id}`);
    return NextResponse.json({ error: 'Metadata mismatch' }, { status: 403 });
  }
  if (metadataFarmerId && metadataFarmerId !== proSub.farmerId) {
    console.warn(`[chargily:webhook] Metadata mismatch: webhook farmerId=${metadataFarmerId} vs DB farmerId=${proSub.farmerId}`);
    return NextResponse.json({ error: 'Metadata mismatch' }, { status: 403 });
  }

  // Handle payment status
  const status = body.data?.status;
  if (status === 'paid') {
    const durationDays = PLAN_DURATIONS[proSub.plan] ?? 30;
    const expiresAt = durationDays
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : null;

    await db.proSubscription.update({
      where: { id: proSub.id },
      data: {
        status: 'ACTIVE',
        paidAt: new Date(),
        expiresAt,
      },
    });
    console.log(`[chargily:webhook] Activated ProSubscription ${proSub.id} for farmer ${proSub.farmerId}`);
  } else if (status === 'failed' || status === 'canceled') {
    await db.proSubscription.update({
      where: { id: proSub.id },
      data: { status: 'CANCELLED' },
    });
    console.log(`[chargily:webhook] Cancelled ProSubscription ${proSub.id}`);
  }

  return NextResponse.json({ ok: true });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChargilyWebhookBody {
  event: string;  // "checkout.session.paid" | "checkout.session.failed" etc.
  data: {
    id: string;           // checkout session ID
    status: 'paid' | 'failed' | 'canceled' | 'pending';
    amount: number;       // in centimes
    currency: string;     // "DZD"
    metadata?: Record<string, string>;
  } | null;
}
