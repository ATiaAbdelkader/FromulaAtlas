/**
 * Long-polling runner for the Formula Atlas Telegram bot.
 *
 * Use this for local development when you don't have a public webhook URL.
 * It polls Telegram's getUpdates endpoint and processes messages.
 *
 * Usage:
 *   1. Create a bot via @BotFather → get the token
 *   2. Add TELEGRAM_BOT_TOKEN=your_token to .env
 *   3. Run: npx tsx scripts/telegram-bot-runner.ts
 *
 * In production, use the webhook endpoint instead (POST /api/telegram-webhook).
 */

import 'dotenv/config';
import { startLongPolling, getBotInfo } from '../src/lib/telegram-bot';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not set in .env');
  console.error('   1. Open Telegram and message @BotFather');
  console.error('   2. Send /newbot and follow the prompts');
  console.error('   3. Copy the bot token');
  console.error('   4. Add TELEGRAM_BOT_TOKEN=your_token to .env');
  console.error('   5. Run this script again');
  process.exit(1);
}

async function main() {
  const token: string = TOKEN!;  // safe — we checked above
  // Verify the token
  const info = await getBotInfo(token);
  if (!info?.ok) {
    console.error('❌ Invalid bot token. Check TELEGRAM_BOT_TOKEN in .env');
    process.exit(1);
  }

  console.log(`✅ Bot connected: @${info.username} (${info.first_name})`);
  console.log(`📡 Starting long-polling... (Ctrl+C to stop)`);
  console.log(`💬 Send a message to @${info.username} on Telegram to test\n`);

  await startLongPolling(token);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
