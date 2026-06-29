/**
 * Telegram Bot core for Formula Atlas.
 *
 * Routes incoming Telegram messages to the right AI endpoint:
 *   - text  → /api/agronomist-chat (AI Agronomist)
 *   - photo → /api/parse-lab-report (vision extraction)
 *   - voice → transcribe (future) → /api/agronomist-chat
 *
 * Supports commands: /start, /help, /tools, /plan, /scan, /reset
 *
 * Two modes:
 *   1. Webhook mode (production): Telegram calls POST /api/telegram-webhook
 *   2. Long-polling mode (local dev): scripts/telegram-bot-runner.ts polls getUpdates
 */

import ZAI from 'z-ai-web-dev-sdk';

export interface TelegramMessage {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; first_name: string; username?: string };
    chat: { id: number; type: 'private' | 'group' | 'supergroup' };
    date: number;
    text?: string;
    photo?: Array<{ file_id: string; file_size: number; width: number; height: number }>;
    voice?: { file_id: string; duration: number; mime_type: string };
    caption?: string;
  };
}

export interface BotContext {
  chatId: number;
  userId: number;
  firstName: string;
  username?: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// In-memory conversation history per chat (resets on server restart)
// For production, replace with Redis or a database.
const chatHistories = new Map<number, Array<{ role: 'user' | 'assistant'; content: string }>>();
const MAX_HISTORY = 10;

function getHistory(chatId: number): BotContext['history'] {
  return chatHistories.get(chatId) || [];
}

function addToHistory(chatId: number, role: 'user' | 'assistant', content: string) {
  const hist = getHistory(chatId);
  hist.push({ role, content });
  // Keep only the last MAX_HISTORY messages to stay within token limits
  if (hist.length > MAX_HISTORY) {
    hist.splice(0, hist.length - MAX_HISTORY);
  }
  chatHistories.set(chatId, hist);
}

function clearHistory(chatId: number) {
  chatHistories.delete(chatId);
}

// ---- Telegram API helpers ----

const TELEGRAM_API = (token: string) => `https://api.telegram.org/bot${token}`;

export async function sendMessage(token: string, chatId: number, text: string, replyTo?: number): Promise<void> {
  // Telegram message limit is 4096 chars; split if needed
  const chunks = text.match(/[\s\S]{1,4000}/g) || [text];
  for (const chunk of chunks) {
    await fetch(`${TELEGRAM_API(token)}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: chunk,
        parse_mode: 'Markdown',
        reply_to_message_id: replyTo,
      }),
    });
  }
}

export async function sendPhoto(token: string, chatId: number, photoUrl: string, caption?: string): Promise<void> {
  await fetch(`${TELEGRAM_API(token)}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption }),
  });
}

async function getFileUrl(token: string, fileId: string): Promise<string | null> {
  try {
    const res = await fetch(`${TELEGRAM_API(token)}/getFile?file_id=${fileId}`);
    const data = await res.json();
    if (data.ok && data.result?.file_path) {
      return `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
    }
  } catch {
    // ignore
  }
  return null;
}

async function downloadFileAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

// ---- Command handlers ----

const WELCOME_MESSAGE = `🌾 *Welcome to Formula Atlas!*

I'm your AI agronomy assistant. I can help you with:

• _Diagnose crop problems_ — describe a symptom and I'll tell you which tool to use
• _Parse lab reports_ — send a photo of your soil/water test and I'll extract the values
• _Recommend amendments_ — share your CEC + cations and I'll compute doses
• _Plan your season_ — type /plan for a 52-week NPK + irrigation plan

*Commands:*
/help — see what I can do
/tools — list all 18 calculators
/plan — generate a season plan
/scan — how to scan a lab report
/reset — clear conversation history

Just type your question or send a photo to get started! 🌱`;

const HELP_MESSAGE = `*How to use me*

*1. Ask a question (text)*
"My tomato leaves are yellowing at the bottom, what should I do?"

*2. Send a lab report (photo)*
Snap a photo of your soil test, water analysis, or fertilizer bag label. I'll extract all the numbers and tell you which tool to open.

*3. Quick commands*
/tools — list all 18 calculators
/plan — generate a 52-week season plan
/scan — step-by-step scan guide
/reset — clear my memory of this conversation

*I remember context* — you can ask follow-up questions without repeating yourself. Use /reset to start fresh.

*Tip:* For best results, include your crop, soil type, and any lab values you have. The more specific you are, the better my recommendations.`;

const TOOLS_MESSAGE = `*18 Agronomic Tools Available*

*Converters:*
1. Oxide ↔ Elemental Converter
2. Nutrient Units Converter (ppm/mmol/meq)
3. Physical Units Converter

*Solution & Water:*
4. Hydroponic Solution Designer
5. Water Hardness Diagnostic
6. VPD Estimator

*Fertilizers:*
7. Amendment Balance by CEC
8. Granular Mix Formulation
9. Fertilizer Composition (from formula)
10. Nutrient Distribution by Stage
11. Fertilizer Compatibility Matrix
12. Solubility & Salt Index
13. Fertilizer Carbon Footprint

*Soil & Irrigation:*
14. Mineralizable N Estimation
15. Soil Water & Texture (USDA)
16. Irrigation Sheet & Water Balance

*Reference:*
17. Periodic Table of Plant Nutrients
18. Nutrient Interactions & Mobility

Open them at: ${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.com'}`;

const SCAN_MESSAGE = `*How to scan a lab report*

1. Take a clear, well-lit photo of your:
   • Soil test report (lab sheet with pH, OM, CEC, Ca, Mg, K, etc.)
   • Water analysis (hardness, HCO₃⁻, EC, ions)
   • Fertilizer bag label (N-P-K grade, formula)

2. Send the photo here (as a photo, not a file)

3. I'll extract all the numbers and tell you:
   • What type of report I detected
   • Confidence level
   • All extracted values
   • Which tool to open with those values pre-filled

*Tips for best results:*
• Fill the frame with the document
• Avoid glare/shadows
• Make sure text is readable
• One report per photo`;

// ---- Main message processor ----

export async function processMessage(token: string, msg: TelegramMessage['message']): Promise<void> {
  if (!msg) return;

  const chatId = msg.chat.id;
  const userId = msg.from?.id || 0;
  const firstName = msg.from?.first_name || 'there';
  const username = msg.from?.username;

  // Handle commands
  const text = msg.text || '';
  if (text.startsWith('/')) {
    const cmd = text.split(' ')[0].toLowerCase().split('@')[0];
    switch (cmd) {
      case '/start':
        await sendMessage(token, chatId, WELCOME_MESSAGE, msg.message_id);
        return;
      case '/help':
        await sendMessage(token, chatId, HELP_MESSAGE, msg.message_id);
        return;
      case '/tools':
        await sendMessage(token, chatId, TOOLS_MESSAGE, msg.message_id);
        return;
      case '/scan':
        await sendMessage(token, chatId, SCAN_MESSAGE, msg.message_id);
        return;
      case '/reset':
        clearHistory(chatId);
        await sendMessage(token, chatId, '✅ Conversation history cleared. Ask me anything!', msg.message_id);
        return;
      case '/plan':
        await sendMessage(
          token,
          chatId,
          `📅 *Season Plan Generator*\n\nTo generate a 52-week plan, send me:\n\n• Crop (e.g. "tomato")\n• Planting date (e.g. "2026-03-15")\n• Field area in hectares\n• Target yield (e.g. "80 t/ha")\n• Soil: pH, OM%, CEC, texture\n• Water: pH, EC, HCO₃⁻\n\nOr use the web app: ${process.env.NEXT_PUBLIC_APP_URL || ''}/tools`,
          msg.message_id
        );
        return;
    }
  }

  // Handle photo (lab report scan)
  if (msg.photo && msg.photo.length > 0) {
    await sendMessage(token, chatId, '🔍 Analyzing your image...', msg.message_id);

    // Get the highest-resolution photo
    const largestPhoto = msg.photo[msg.photo.length - 1];
    const fileUrl = await getFileUrl(token, largestPhoto.file_id);
    if (!fileUrl) {
      await sendMessage(token, chatId, '⚠️ Could not download the photo. Please try again.', msg.message_id);
      return;
    }

    const dataUrl = await downloadFileAsDataUrl(fileUrl);
    if (!dataUrl) {
      await sendMessage(token, chatId, '⚠️ Could not process the photo. Please try again.', msg.message_id);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/parse-lab-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });

      if (!res.ok) {
        await sendMessage(token, chatId, '⚠️ Could not analyze the image. Please try a clearer photo.', msg.message_id);
        return;
      }

      const parsed = await res.json();
      const typeLabels: Record<string, string> = {
        soil: '🟣 Soil report',
        water: '🔵 Water analysis',
        fertilizer_bag: '🟢 Fertilizer label',
        lab_report: '📊 Lab report',
        unknown: '❓ Not recognized',
      };

      const typeLabel = typeLabels[parsed.type] || 'Report';
      const confidence = Math.round((parsed.confidence || 0) * 100);

      let response = `${typeLabel}\nConfidence: ${confidence}%\n\n`;

      const values = Object.entries(parsed.values || {}).filter(([, v]: [string, unknown]) => v !== '' && v !== 0);
      if (values.length > 0) {
        response += '*Extracted values:*\n';
        for (const [k, v] of values) {
          response += `  ${k}: \`${v}\`\n`;
        }
      } else {
        response += 'No values could be extracted.\n';
      }

      if (parsed.notes) {
        response += `\n_${parsed.notes}_\n`;
      }

      if (parsed.suggestedTool && parsed.suggestedTool !== 'unknown') {
        response += `\n👉 *Suggested tool:* ${parsed.suggestedTool.replace(/-/g, ' ')}`;
        response += `\nOpen at: ${process.env.NEXT_PUBLIC_APP_URL || ''}/tools`;
      }

      await sendMessage(token, chatId, response, msg.message_id);

      // Also feed the parsed values to the AI for a recommendation
      if (values.length > 0) {
        const aiQuery = `I just scanned a ${typeLabel} with these values: ${JSON.stringify(parsed.values)}. What should I do with them?`;
        addToHistory(chatId, 'user', aiQuery);
        const aiResponse = await callAgronomistChat(chatId, aiQuery);
        if (aiResponse) {
          await sendMessage(token, chatId, `💡 *AI recommendation:*\n\n${aiResponse}`);
        }
      }
    } catch (err) {
      await sendMessage(token, chatId, '⚠️ Error analyzing image. Please try again.', msg.message_id);
    }
    return;
  }

  // Handle text message → AI Agronomist
  if (text) {
    addToHistory(chatId, 'user', text);
    await sendMessage(token, chatId, '🤔 Thinking...', msg.message_id);

    const response = await callAgronomistChat(chatId, text);
    if (response) {
      addToHistory(chatId, 'assistant', response);
      await sendMessage(token, chatId, response, msg.message_id);
    } else {
      await sendMessage(token, chatId, '⚠️ I could not process your request. Please try again or use /help.', msg.message_id);
    }
    return;
  }

  // Unknown message type
  await sendMessage(token, chatId, 'I can handle text and photos. Type /help to see what I can do.', msg.message_id);
}

async function callAgronomistChat(chatId: number, userMessage: string): Promise<string | null> {
  try {
    const history = getHistory(chatId);
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/agronomist-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...history, { role: 'user', content: userMessage }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.response || null;
  } catch {
    return null;
  }
}

// ---- Webhook setup ----

export async function setWebhook(token: string, webhookUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${TELEGRAM_API(token)}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

export async function deleteWebhook(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${TELEGRAM_API(token)}/deleteWebhook`, { method: 'POST' });
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

export async function getBotInfo(token: string): Promise<{ ok: boolean; username?: string; first_name?: string } | null> {
  try {
    const res = await fetch(`${TELEGRAM_API(token)}/getMe`);
    return await res.json();
  } catch {
    return null;
  }
}

// ---- Long-polling for local dev ----

let polling = false;
let lastUpdateId = 0;

export async function startLongPolling(token: string, onMessage?: (msg: TelegramMessage) => void): Promise<void> {
  if (polling) return;
  polling = true;

  // Delete any existing webhook so polling works
  await deleteWebhook(token);

  console.log('[telegram-bot] Starting long-polling...');

  while (polling) {
    try {
      const url = `${TELEGRAM_API(token)}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.ok) {
        console.error('[telegram-bot] getUpdates error:', data.description);
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }

      for (const update of data.result || []) {
        lastUpdateId = update.update_id;
        if (update.message) {
          console.log(`[telegram-bot] Message from ${update.message.from?.first_name} (${update.message.from?.id}): ${update.message.text || '[photo]'}`);
          if (onMessage) {
            onMessage(update);
          } else {
            await processMessage(token, update.message);
          }
        }
      }
    } catch (err) {
      console.error('[telegram-bot] Polling error:', err);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log('[telegram-bot] Long-polling stopped.');
}

export function stopLongPolling(): void {
  polling = false;
}

export function isPolling(): boolean {
  return polling;
}

// Suppress unused import warning — ZAI is used by the API routes this bot calls
void ZAI;
