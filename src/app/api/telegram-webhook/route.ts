import { NextRequest, NextResponse } from 'next/server';
import { processMessage, type TelegramMessage } from '@/lib/telegram-bot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Telegram webhook endpoint.
 *
 * Setup:
 *   1. Create a bot via @BotFather → get the token
 *   2. Set TELEGRAM_BOT_TOKEN in .env
 *   3. Deploy to a public URL (e.g. Vercel)
 *   4. Set webhook: POST /api/telegram-webhook?action=set&url=https://yourapp.com/api/telegram-webhook
 *   5. Telegram will call this endpoint for every message
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(req: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not set in environment' }, { status: 500 });
  }

  try {
    const update: TelegramMessage = await req.json();

    if (update.message) {
      // Process asynchronously so Telegram gets a 200 OK quickly
      // (they require a response within 60 seconds or they retry)
      processMessage(BOT_TOKEN, update.message).catch(err => {
        console.error('[telegram-webhook] Error processing message:', err);
      });
    }

    // Always return 200 OK immediately
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[telegram-webhook] Error:', error);
    return NextResponse.json({ error: 'Invalid update' }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (!BOT_TOKEN) {
    return NextResponse.json({
      connected: false,
      error: 'TELEGRAM_BOT_TOKEN not set. Create a bot via @BotFather on Telegram, then add the token to your .env file.',
      setup: 'https://t.me/BotFather',
    });
  }

  if (action === 'set') {
    const url = searchParams.get('url');
    if (!url) {
      return NextResponse.json({ error: 'url parameter required for set action' }, { status: 400 });
    }
    const { setWebhook } = await import('@/lib/telegram-bot');
    const ok = await setWebhook(BOT_TOKEN, url);
    return NextResponse.json({ ok, webhookUrl: url });
  }

  if (action === 'delete') {
    const { deleteWebhook } = await import('@/lib/telegram-bot');
    const ok = await deleteWebhook(BOT_TOKEN);
    return NextResponse.json({ ok });
  }

  if (action === 'info') {
    const { getBotInfo } = await import('@/lib/telegram-bot');
    const info = await getBotInfo(BOT_TOKEN);
    return NextResponse.json(info);
  }

  // Default: return status
  const { getBotInfo } = await import('@/lib/telegram-bot');
  const info = await getBotInfo(BOT_TOKEN);
  return NextResponse.json({
    connected: info?.ok || false,
    bot: info?.ok ? { username: info.username, name: info.first_name } : null,
    webhookUrl: req.url,
    message: info?.ok
      ? `Bot @${info.username} is active. Set the webhook to: ${req.url}`
      : 'Invalid token or bot not found.',
  });
}
