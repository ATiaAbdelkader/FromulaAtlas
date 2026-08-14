import type { NextRequest } from 'next/server';

export const AI_MAX_MESSAGES = 12;
export const AI_MAX_MESSAGE_CHARS = 4_000;
export const AI_MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const AI_RATE_LIMIT_WINDOW_MS = 60_000;
export const AI_RATE_LIMIT_MAX_REQUESTS = 20;

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export interface GovernedChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function getClientKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'anonymous';
}

export function consumeAiRateLimit(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const current = rateLimitStore.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + AI_RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= AI_RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function parseGovernedChatMessages(input: unknown):
  | { ok: true; messages: GovernedChatMessage[] }
  | { ok: false; error: string } {
  if (!Array.isArray(input) || input.length === 0) {
    return { ok: false, error: 'messages array required' };
  }

  const messages = input
    .filter((message): message is { role: string; content: unknown } => Boolean(message) && typeof message === 'object')
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      role: message.role as 'user' | 'assistant',
      content: typeof message.content === 'string' ? message.content.trim() : '',
    }))
    .filter((message) => message.content.length > 0)
    .map((message) => ({
      ...message,
      content: message.content.slice(0, AI_MAX_MESSAGE_CHARS),
    }))
    .slice(-AI_MAX_MESSAGES);

  if (messages.length === 0 || messages[messages.length - 1]?.role !== 'user') {
    return { ok: false, error: 'the final message must be a non-empty user message' };
  }

  return { ok: true, messages };
}

export function validateImageDataUrl(image: unknown):
  | { ok: true; value: string; byteLength: number }
  | { ok: false; error: string } {
  if (typeof image !== 'string' || !image.startsWith('data:image/')) {
    return { ok: false, error: 'image must be a base64 image data URL' };
  }

  const match = image.match(/^data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!match) {
    return { ok: false, error: 'image must be a supported PNG, JPG, WEBP, or GIF base64 data URL' };
  }

  const byteLength = Math.floor((match[2].replace(/\s/g, '').length * 3) / 4) - (match[2].endsWith('==') ? 2 : match[2].endsWith('=') ? 1 : 0);
  if (byteLength <= 0) {
    return { ok: false, error: 'image data is empty' };
  }
  if (byteLength > AI_MAX_IMAGE_BYTES) {
    return { ok: false, error: 'image must be smaller than 8 MB' };
  }

  return { ok: true, value: image, byteLength };
}

export function clampConfidence(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, numeric));
}

type AiErrorLanguage = 'en' | 'fr' | 'ar';

export function publicAiError(error: unknown, language: AiErrorLanguage = 'en'): string {
  const errorCode = error instanceof Error && 'code' in error ? error.code : undefined;
  if (errorCode === 'AI_PROVIDER_NOT_CONFIGURED') {
    if (language === 'ar') {
      return 'خدمة الذكاء الاصطناعي غير مهيأة في بيئة النشر. يجب على مالك التطبيق إعداد مزود الذكاء الاصطناعي ثم إعادة المحاولة.';
    }
    if (language === 'fr') {
      return "Le service d'IA n'est pas configuré dans l'environnement de déploiement. Le propriétaire de l'application doit configurer un fournisseur d'IA avant de réessayer.";
    }
    return 'The AI service is not configured for this deployment. The app owner must configure an AI provider before trying again.';
  }
  if (error instanceof Error && /timeout|timed out|abort/i.test(error.message)) {
    if (language === 'ar') {
      return 'انتهت مهلة خدمة الذكاء الاصطناعي. حاول مرة أخرى بسؤال أقصر.';
    }
    if (language === 'fr') {
      return "Le service d'IA a dépassé le délai d'attente. Réessayez avec une demande plus courte.";
    }
    return 'The AI service timed out. Please retry with a shorter request.';
  }
  if (language === 'ar') {
    return 'خدمة الذكاء الاصطناعي غير متاحة مؤقتًا. حاول مرة أخرى بعد قليل.';
  }
  if (language === 'fr') {
    return "Le service d'IA est temporairement indisponible. Veuillez réessayer dans un instant.";
  }
  return 'The AI service is temporarily unavailable. Please retry shortly.';
}
