/**
 * POST /api/cron/daily-brief
 *
 * Vercel Cron job — runs daily at 05:30 UTC (06:30 Algeria).
 *
 * Auth: requires `x-cron-secret` header matching CRON_SECRET env var.
 * This prevents public access (otherwise anyone could trigger a send
 * burst and burn our WhatsApp quota).
 *
 * Pipeline:
 *   1. Query subscriptions where nextSendAt <= now() AND enabled=true
 *   2. For each (batched 50 at a time):
 *      a. Build BriefContext via buildBriefForFarmer
 *      b. If skipped (no profile/crop), log SKIPPED + skip
 *      c. Generate brief message via buildBriefMessage (trilingual)
 *      d. Append unsubscribe link to the brief
 *      e. Send via WhatsApp client (stub: log; live: real send)
 *      f. Log to BriefLog table
 *      g. Update Subscription.nextSendAt to tomorrow's preferredTime
 *   3. Return summary { sent, failed, skipped, total }
 *
 * Vercel Cron: 60-second timeout (Hobby) or 300s (Pro).
 * At 50 farmers per batch with ~500ms per farmer, 1000 farmers = ~10s.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getWhatsAppClient } from '@/lib/whatsapp-client';
import { buildBriefForFarmer } from '@/lib/brief/brief-builder';
import { buildBriefMessage } from '@/components/agri/whatsapp-daily-brief';
import { generateUnsubscribeToken } from '@/lib/unsubscribe-token';
import type { Language } from '@/lib/language-store';
// Note: Prisma's Language enum is uppercase (EN/FR/AR); app's Language is lowercase (en/fr/ar).
// Convert via .toLowerCase() when passing to UI helpers.

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Auth check
// ---------------------------------------------------------------------------

function checkCronSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // If no secret configured, refuse to run (don't silently allow public access)
    console.error('[cron] CRON_SECRET not set — refusing to run');
    return false;
  }
  const header = req.headers.get('x-cron-secret');
  return header === secret;
}

// ---------------------------------------------------------------------------
// Main POST handler
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  // 1. Auth check
  if (!checkCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  const summary = {
    sent: 0,
    failed: 0,
    skipped: 0,
    total: 0,
    durationMs: 0,
  };

  try {
    // 2. Query due subscriptions
    const dueSubs = await db.subscription.findMany({
      where: {
        enabled: true,
        unsubscribedAt: null,
        nextSendAt: { lte: new Date() },
      },
      include: {
        farmer: {
          select: {
            id: true,
            phoneE164: true,
            language: true,
            displayName: true,
          },
        },
      },
      orderBy: { nextSendAt: 'asc' },
    });

    summary.total = dueSubs.length;
    console.log(`[cron:daily-brief] Processing ${dueSubs.length} due subscriptions`);

    if (dueSubs.length === 0) {
      summary.durationMs = Date.now() - startedAt;
      return NextResponse.json(summary);
    }

    // 3. Get WhatsApp client (stub or live)
    const whatsapp = getWhatsAppClient();

    // 4. Process each subscription
    for (const sub of dueSubs) {
      try {
        await processSubscription(sub, whatsapp, summary);
      } catch (e) {
        console.error(`[cron:daily-brief] Error processing farmer ${sub.farmerId}:`, e);
        summary.failed++;
        // Log the failure
        await logBrief({
          farmerId: sub.farmerId,
          status: 'FAILED',
          mode: whatsapp.mode === 'live' ? 'LIVE' : 'STUB',
          errorMessage: e instanceof Error ? e.message : String(e),
          briefPreview: '',
          briefLength: 0,
          weatherSource: 'atlas_default',
          language: sub.farmer.language,
        }).catch(() => { /* don't let logging failure break the loop */ });
      } finally {
        // Always advance nextSendAt to tomorrow (so a failure doesn't
        // cause infinite retries today)
        await advanceNextSendAt(sub.id, sub.preferredTime).catch(() => { /* ignore */ });
      }
    }

    summary.durationMs = Date.now() - startedAt;
    console.log(`[cron:daily-brief] Done in ${summary.durationMs}ms:`, summary);
    return NextResponse.json(summary);
  } catch (e) {
    console.error('[cron:daily-brief] Fatal error:', e);
    summary.durationMs = Date.now() - startedAt;
    return NextResponse.json(
      { ...summary, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Per-subscription processing
// ---------------------------------------------------------------------------

interface DueSubscription {
  id: string;
  farmerId: string;
  preferredTime: string;
  farmer: {
    id: string;
    phoneE164: string;
    language: 'EN' | 'FR' | 'AR';  // Prisma enum (uppercase)
    displayName: string | null;
  };
}

async function processSubscription(
  sub: DueSubscription,
  whatsapp: ReturnType<typeof getWhatsAppClient>,
  summary: { sent: number; failed: number; skipped: number; total: number },
): Promise<void> {
  // 1. Build brief context
  const buildResult = await buildBriefForFarmer(sub.farmer.id);

  if (!buildResult.context) {
    // Skipped — log + count
    summary.skipped++;
    await logBrief({
      farmerId: sub.farmerId,
      status: 'SKIPPED',
      mode: whatsapp.mode === 'live' ? 'LIVE' : 'STUB',
      errorMessage: buildResult.skipReason ?? 'unknown',
      briefPreview: '',
      briefLength: 0,
      weatherSource: buildResult.weatherSource,
      language: sub.farmer.language,
    });
    return;
  }

  // 2. Build the message (trilingual) — convert Prisma enum (EN/FR/AR) to app language (en/fr/ar)
  const langCode = sub.farmer.language.toLowerCase() as 'en' | 'fr' | 'ar';
  let message = buildBriefMessage(buildResult.context, langCode);

  // 3. Append unsubscribe link
  const unsubToken = generateUnsubscribeToken(sub.farmer.id);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://formulaatlas.dz';
  const unsubUrl = `${baseUrl}/unsubscribe?token=${unsubToken}`;
  const unsubLine = langCode === 'ar'
    ? `\n\n📨 لإلغاء الاشتراك: ${unsubUrl}`
    : langCode === 'fr'
      ? `\n\n📨 Pour se désabonner: ${unsubUrl}`
      : `\n\n📨 To unsubscribe: ${unsubUrl}`;
  message += unsubLine;

  // 4. Send via WhatsApp
  const sendResult = await whatsapp.sendTemplate({
    to: sub.farmer.phoneE164,
    templateName: 'daily_brief_v1',
    languageCode: langCode,
    components: {
      body: {
        // For v1, we send the full message as a single text parameter.
        // Meta requires a template — we use a simple "message body" template
        // with one {{1}} parameter.
        parameters: [{ type: 'text', text: message }],
      },
    },
  });

  // 5. Log to BriefLog
  await logBrief({
    farmerId: sub.farmerId,
    status: sendResult.success ? 'SENT' : 'FAILED',
    mode: whatsapp.mode === 'live' ? 'LIVE' : 'STUB',
    messageId: sendResult.messageId,
    errorMessage: sendResult.error,
    briefPreview: message.slice(0, 200),
    briefLength: message.length,
    weatherSource: buildResult.weatherSource,
    language: sub.farmer.language,
  });

  if (sendResult.success) {
    summary.sent++;
  } else {
    summary.failed++;
  }
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

async function logBrief(params: {
  farmerId: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'SKIPPED';
  mode: 'STUB' | 'LIVE';
  messageId?: string;
  errorMessage?: string;
  briefPreview: string;
  briefLength: number;
  weatherSource: string;
  language: 'EN' | 'FR' | 'AR';  // Prisma enum
}): Promise<void> {
  await db.briefLog.create({
    data: {
      farmerId: params.farmerId,
      status: params.status,
      sendMode: params.mode,
      messageId: params.messageId,
      errorMessage: params.errorMessage,
      briefPreview: params.briefPreview,
      briefLength: params.briefLength,
      weatherSource: params.weatherSource,
      language: params.language,
    },
  });
}

/**
 * Advance nextSendAt to tomorrow's preferredTime (Africa/Algiers, UTC+1, no DST).
 */
async function advanceNextSendAt(subscriptionId: string, preferredTime: string): Promise<void> {
  const [h, m] = preferredTime.split(':').map(s => parseInt(s, 10));
  const now = new Date();
  // Current time in Algeria (UTC+1)
  const nowInAlgeria = new Date(now.getTime() + 60 * 60 * 1000);
  // Tomorrow at preferredTime in Algeria
  const tomorrow = new Date(nowInAlgeria);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(h, m, 0, 0);
  // Convert back to UTC
  const nextSendAt = new Date(tomorrow.getTime() - 60 * 60 * 1000);

  await db.subscription.update({
    where: { id: subscriptionId },
    data: { nextSendAt },
  });
}

// ---------------------------------------------------------------------------
// GET — health check (also requires auth, useful for debugging)
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  if (!checkCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Return queue size + recent sends
  const dueCount = await db.subscription.count({
    where: {
      enabled: true,
      unsubscribedAt: null,
      nextSendAt: { lte: new Date() },
    },
  });
  const recentSends = await db.briefLog.findMany({
    take: 10,
    orderBy: { sentAt: 'desc' },
    select: {
      sentAt: true,
      status: true,
      sendMode: true,
      errorMessage: true,
      briefPreview: true,
    },
  });

  return NextResponse.json({
    dueCount,
    sendMode: process.env.WHATSAPP_SEND_MODE ?? 'stub',
    recentSends,
  });
}
