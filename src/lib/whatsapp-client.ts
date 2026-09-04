/**
 * WhatsApp Business Cloud API client — stub + live implementations.
 *
 * Foundation mode (see WHATSAPP-OUTBOUND-SCOPE.md §0):
 *   - WHATSAPP_SEND_MODE=stub (default): logs to console, returns success,
 *     no actual WhatsApp message sent. Zero cost.
 *   - WHATSAPP_SEND_MODE=live: real HTTP call to Meta Graph API. Requires
 *     WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID env vars.
 *
 * The interface is identical for both modes — callers don't need to know
 * which mode is active. The cron job + auth OTP flow use this client
 * unchanged in both modes.
 *
 * Switching from stub to live when funding arrives:
 *   1. Set WHATSAPP_SEND_MODE=live in Vercel env vars
 *   2. Set WHATSAPP_ACCESS_TOKEN (from Meta Business dashboard)
 *   3. Set WHATSAPP_PHONE_NUMBER_ID (from Meta Business dashboard)
 *   4. Redeploy — no code changes needed.
 *
 * SSR-safe: imports are lazy, so this file can be imported from server
 * components without breaking the build.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type WhatsAppSendMode = 'stub' | 'live';

export interface SendTemplateParams {
  /** Recipient phone in E.164 format, e.g. "+213661234567". */
  to: string;
  /** Template name (must be pre-approved in Meta Business Manager). */
  templateName: string;
  /** Language code: "en", "fr", or "ar". */
  languageCode: 'en' | 'fr' | 'ar';
  /** Body parameters — substituted into {{1}}, {{2}}, ... in the template. */
  components?: {
    body?: { parameters: Array<{ type: 'text'; text: string }> };
  };
}

export interface SendResult {
  success: boolean;
  /** Meta's message ID, if success and live mode. Null in stub mode. */
  messageId?: string;
  /** Error message, if failed. */
  error?: string;
  /** What mode we were in when we tried. */
  mode: WhatsAppSendMode;
}

export interface WhatsAppClient {
  sendTemplate(params: SendTemplateParams): Promise<SendResult>;
  /** Verify a phone number is on WhatsApp before storing it. */
  verifyNumber(phoneE164: string): Promise<{ valid: boolean; waId?: string }>;
  /** Current mode — for logging / debugging. */
  readonly mode: WhatsAppSendMode;
}

// ---------------------------------------------------------------------------
// Mode resolution
// ---------------------------------------------------------------------------

export function getWhatsAppSendMode(): WhatsAppSendMode {
  const mode = process.env.WHATSAPP_SEND_MODE?.toLowerCase();
  if (mode === 'live') {
    // Refuse to go live without the required credentials
    if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      console.warn('[whatsapp] WHATSAPP_SEND_MODE=live but WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is missing — falling back to stub');
      return 'stub';
    }
    return 'live';
  }
  return 'stub';
}

// ---------------------------------------------------------------------------
// Stub implementation (zero cost, Foundation mode)
// ---------------------------------------------------------------------------

class StubWhatsAppClient implements WhatsAppClient {
  readonly mode: WhatsAppSendMode = 'stub';

  async sendTemplate(params: SendTemplateParams): Promise<SendResult> {
    // Log what we WOULD have sent — this is the audit trail that lets us
    // verify the pipeline works before going live.
    console.log('[whatsapp:stub] Would send template:', {
      to: params.to,
      template: params.templateName,
      language: params.languageCode,
      bodyParams: params.components?.body?.parameters?.map(p => p.text) ?? [],
      timestamp: new Date().toISOString(),
    });
    // Return success with a fake message ID so callers can log it
    return {
      success: true,
      messageId: `stub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      mode: 'stub',
    };
  }

  async verifyNumber(phoneE164: string): Promise<{ valid: boolean; waId?: string }> {
    // In stub mode, we can't actually verify — accept any well-formed E.164.
    // Real verification happens via OTP once we go live.
    const valid = /^\+\d{6,15}$/.test(phoneE164);
    return { valid, waId: valid ? phoneE164.replace('+', '') : undefined };
  }
}

// ---------------------------------------------------------------------------
// Live implementation (Meta Graph API — used when WHATSAPP_SEND_MODE=live)
// ---------------------------------------------------------------------------

class LiveWhatsAppClient implements WhatsAppClient {
  readonly mode: WhatsAppSendMode = 'live';

  private get token(): string {
    const t = process.env.WHATSAPP_ACCESS_TOKEN;
    if (!t) throw new Error('WHATSAPP_ACCESS_TOKEN not set');
    return t;
  }

  private get phoneNumberId(): string {
    const id = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!id) throw new Error('WHATSAPP_PHONE_NUMBER_ID not set');
    return id;
  }

  private get apiVersion(): string {
    return process.env.WHATSAPP_API_VERSION ?? 'v21.0';
  }

  async sendTemplate(params: SendTemplateParams): Promise<SendResult> {
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    const body = {
      messaging_product: 'whatsapp',
      to: params.to.replace('+', ''),  // Meta wants no "+"
      type: 'template',
      template: {
        name: params.templateName,
        language: { code: params.languageCode },
        ...(params.components ? { components: [params.components] } : {}),
      },
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: `Meta API ${res.status}: ${data?.error?.message ?? JSON.stringify(data)}`,
          mode: 'live',
        };
      }

      return {
        success: true,
        messageId: data?.messages?.[0]?.id,
        mode: 'live',
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e),
        mode: 'live',
      };
    }
  }

  async verifyNumber(phoneE164: string): Promise<{ valid: boolean; waId?: string }> {
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/contacts?phone=${phoneE164.replace('+', '')}`;
    try {
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${this.token}` },
      });
      const data = await res.json();
      const contact = data?.contacts?.[0];
      return {
        valid: contact?.status === 'valid',
        waId: contact?.wa_id,
      };
    } catch {
      return { valid: false };
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton accessor
// ---------------------------------------------------------------------------

let _client: WhatsAppClient | null = null;

export function getWhatsAppClient(): WhatsAppClient {
  if (_client) return _client;
  _client = getWhatsAppSendMode() === 'live'
    ? new LiveWhatsAppClient()
    : new StubWhatsAppClient();
  return _client;
}

/** Reset the singleton — used by tests. */
export function _resetWhatsAppClient(): void {
  _client = null;
}
