/**
 * WhatsApp Business Cloud API webhook handler.
 *
 * Meta calls this endpoint for:
 *   1. Inbound messages (farmer replies "STOP", "START", or free text)
 *   2. Message status updates (sent → delivered → read)
 *
 * Setup (when WHATSAPP_SEND_MODE=live):
 *   1. Go to Meta Business Manager → WhatsApp Manager → Configuration
 *   2. Set webhook URL: https://yourapp.com/api/whatsapp/webhook
 *   3. Set verify token (any string) — must match WHATSAPP_WEBHOOK_VERIFY_TOKEN env var
 *   4. Subscribe to: messages, message_status, message_delivered, message_read
 *
 * Auth:
 *   - GET (verification): Meta sends hub.challenge, we echo it back after
 *     matching hub.verify_token against WHATSAPP_WEBHOOK_VERIFY_TOKEN.
 *   - POST (events): Meta signs each request with X-Hub-Signature-256
 *     (HMAC-SHA256 of the body using the App Secret). We verify the signature
 *     to ensure the request really came from Meta (not an attacker).
 *
 * Foundation mode: webhook endpoint works but receives no events (because
 * we're not sending messages). When live, it receives delivery receipts
 * for every brief we send + any STOP replies from farmers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';
import { db } from '@/lib/db';
import { safeCompare } from '@/lib/security-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ---------------------------------------------------------------------------
// GET — webhook verification (Meta calls this once during setup)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (!expectedToken) {
    console.error('[whatsapp:webhook] WHATSAPP_WEBHOOK_VERIFY_TOKEN not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  if (mode === 'subscribe' && safeCompare(token, expectedToken)) {
    console.log('[whatsapp:webhook] Verification successful');
    return new NextResponse(challenge ?? '', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  console.warn('[whatsapp:webhook] Verification failed', { mode, token: token ? '(set)' : '(missing)' });
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// ---------------------------------------------------------------------------
// POST — event delivery (messages + status updates)
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-hub-signature-256');
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!appSecret) {
    // In stub mode, we don't have an App Secret — skip verification
    if (process.env.WHATSAPP_SEND_MODE !== 'live') {
      return NextResponse.json({ ok: true, mode: 'stub' });
    }
    console.error('[whatsapp:webhook] WHATSAPP_APP_SECRET not set in live mode — refusing');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const bodyText = await req.text();
  if (!verifySignature(bodyText, signature, appSecret)) {
    console.warn('[whatsapp:webhook] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  let body: WhatsAppWebhookEvent;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Process asynchronously (return 200 fast — Meta retries on timeout)
  processEvent(body).catch(err => {
    console.error('[whatsapp:webhook] Error processing event:', err);
  });

  return NextResponse.json({ ok: true });
}

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------

function verifySignature(bodyText: string, signature: string | null, appSecret: string): boolean {
  if (!signature || !signature.startsWith('sha256=')) {
    return false;
  }
  const expected = signature.slice(7);
  const computed = createHmac('sha256', appSecret).update(bodyText).digest('hex');
  return safeCompare(expected, computed);
}

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

interface WhatsAppWebhookEvent {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: { phone_number_id: string; display_phone_number: string };
        messages?: Array<{
          id: string;
          from: string;
          type: string;
          text?: { body: string };
          timestamp: string;
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
          errors?: Array<{ code: string; title: string; message: string }>;
        }>;
        contacts?: Array<{ profile: { name?: string }; wa_id: string }>;
      };
      field: string;
    }>;
  }>;
}

// ---------------------------------------------------------------------------
// Event processing
// ---------------------------------------------------------------------------

async function processEvent(event: WhatsAppWebhookEvent): Promise<void> {
  if (event.object !== 'whatsapp_business_account') return;

  for (const entry of event.entry) {
    for (const change of entry.changes) {
      const value = change.value;
      if (value.messages?.length) {
        for (const msg of value.messages) {
          await handleInboundMessage(msg);
        }
      }
      if (value.statuses?.length) {
        for (const status of value.statuses) {
          await handleStatusUpdate(status);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Inbound message — STOP / START / free text
// ---------------------------------------------------------------------------

async function handleInboundMessage(
  msg: NonNullable<WhatsAppWebhookEvent['entry'][0]['changes'][0]['value']['messages']>[0],
): Promise<void> {
  const phoneE164 = '+' + msg.from;
  const text = msg.text?.body?.trim() ?? '';
  const lower = text.toLowerCase();

  console.log(`[whatsapp:webhook] Inbound from ${phoneE164}: "${text}"`);

  const farmer = await db.farmer.findUnique({
    where: { phoneE164 },
    select: { id: true, phoneE164: true, language: true },
  });
  if (!farmer) {
    console.log(`[whatsapp:webhook] Unknown farmer ${phoneE164} — ignoring`);
    return;
  }

  if (matchesStopKeyword(lower)) {
    await unsubscribeFarmer(farmer.id, 'user_replied_stop');
    console.log(`[whatsapp:webhook] Unsubscribed ${phoneE164} (STOP reply)`);
    return;
  }

  if (matchesStartKeyword(lower)) {
    await resubscribeFarmer(farmer.id);
    console.log(`[whatsapp:webhook] Re-subscribed ${phoneE164} (START reply)`);
    return;
  }

  console.log(`[whatsapp:webhook] Free text from ${phoneE164}: "${text}" (not handled in v1)`);
}

/** STOP keywords in EN/FR/AR. */
export function matchesStopKeyword(text: string): boolean {
  const stopWords = [
    // English
    'stop', 'unsubscribe', 'unsub', 'cancel',
    // French (with + without accents — phone users often skip accents)
    'arrêt', 'arret', 'désabonner', 'desabonner', 'désabonnement', 'desabonnement',
    // Arabic
    'إيقاف', 'إلغاء', 'إلغاء الاشتراك', 'وقف', 'توقف',
  ];
  return stopWords.some(w => text === w || text.startsWith(w));
}

/** START keywords in EN/FR/AR. */
export function matchesStartKeyword(text: string): boolean {
  const startWords = [
    // English
    'start', 'subscribe', 'sub', 'begin',
    // French (with + without accents)
    'commencer', 'abonner',
    // Arabic
    'ابدأ', 'اشترك', 'بدء', 'اشتراك',
  ];
  return startWords.some(w => text === w || text.startsWith(w));
}

async function unsubscribeFarmer(farmerId: string, reason: string): Promise<void> {
  await db.subscription.updateMany({
    where: { farmerId, enabled: true, unsubscribedAt: null },
    data: {
      enabled: false,
      unsubscribedAt: new Date(),
      unsubscribeReason: reason,
      nextSendAt: null,
    },
  });
}

async function resubscribeFarmer(farmerId: string): Promise<void> {
  const sub = await db.subscription.findUnique({ where: { farmerId } });
  if (!sub) return;  // never had a subscription — must go through consent flow
  const nextSendAt = computeNextSendAt(sub.preferredTime);
  await db.subscription.update({
    where: { farmerId },
    data: {
      enabled: true,
      unsubscribedAt: null,
      unsubscribeReason: null,
      nextSendAt,
    },
  });
}

// ---------------------------------------------------------------------------
// Status update — delivery / read receipts
// ---------------------------------------------------------------------------

async function handleStatusUpdate(
  status: NonNullable<WhatsAppWebhookEvent['entry'][0]['changes'][0]['value']['statuses']>[0],
): Promise<void> {
  const briefLog = await db.briefLog.findFirst({
    where: { messageId: status.id },
    select: { id: true, status: true },
  });
  if (!briefLog) {
    console.log(`[whatsapp:webhook] Unknown messageId ${status.id} — ignoring`);
    return;
  }

  const newStatus = mapMetaStatus(status.status);
  if (!newStatus) return;

  // Don't downgrade (READ → DELIVERED shouldn't happen, but be defensive)
  const order = { PENDING: 0, SENT: 1, DELIVERED: 2, READ: 3, FAILED: 4, SKIPPED: 4 };
  const current = briefLog.status as keyof typeof order;
  if (order[current] > order[newStatus]) return;

  await db.briefLog.update({
    where: { id: briefLog.id },
    data: { status: newStatus },
  });

  console.log(`[whatsapp:webhook] BriefLog ${briefLog.id} → ${newStatus}`);
}

function mapMetaStatus(meta: string): 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | null {
  switch (meta) {
    case 'sent': return 'SENT';
    case 'delivered': return 'DELIVERED';
    case 'read': return 'READ';
    case 'failed': return 'FAILED';
    default: return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeNextSendAt(preferredTime: string): Date {
  const [h, m] = preferredTime.split(':').map(s => parseInt(s, 10));
  const now = new Date();
  const nowInAlgeria = new Date(now.getTime() + 60 * 60 * 1000);
  const tomorrow = new Date(nowInAlgeria);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(h, m, 0, 0);
  return new Date(tomorrow.getTime() - 60 * 60 * 1000);
}
