/**
 * Chargily Epay client — Algerian payment gateway (CIB + Edahabia).
 *
 * Chargily is the standard Algerian payment processor. Supports:
 *   - CIB (interbank card via SatimPay)
 *   - Edahabia (Algeria Post card)
 *   - BaridiMob (Algeria Post mobile)
 *
 * API docs: https://docs.chargily.com/
 *
 * Flow:
 *   1. Create a checkout session (server-side) → get checkout_url
 *   2. Redirect user to checkout_url (Chargily-hosted payment page)
 *   3. User pays via CIB/Edahabia
 *   4. Chargily redirects to success_url or failure_url
 *   5. Chargily calls webhook_url with payment status
 *
 * Auth: Bearer CHARGILY_SECRET_KEY in Authorization header.
 *
 * Foundation mode: if CHARGILY_SECRET_KEY is not set, the client returns
 * a stub checkout URL (just a local page explaining payment is not yet live).
 */

export interface ChargilyCheckoutItem {
  price: number;       // amount in DZD (Chargily uses centimes — we multiply by 100)
  quantity: number;
  description?: string;
}

export interface CreateCheckoutParams {
  items: ChargilyCheckoutItem[];
  successUrl: string;
  failureUrl: string;
  webhookUrl: string;
  locale?: 'en' | 'fr' | 'ar';
  metadata?: Record<string, string>;
}

export interface CheckoutResult {
  success: boolean;
  checkoutUrl?: string;
  checkoutId?: string;
  error?: string;
  mode: 'live' | 'stub';
}

// ---------------------------------------------------------------------------
// Mode resolution
// ---------------------------------------------------------------------------

export function getChargilyMode(): 'live' | 'stub' {
  return process.env.CHARGILY_SECRET_KEY ? 'live' : 'stub';
}

// ---------------------------------------------------------------------------
// Live client — real Chargily API
// ---------------------------------------------------------------------------

const CHARGILY_API_BASE = 'https://pay.chargily.com/v1';

export async function createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
  const mode = getChargilyMode();

  if (mode === 'stub') {
    // Foundation mode — return a local "payment not yet live" URL
    const totalAmount = params.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const stubUrl = `/payment-pending?amount=${totalAmount}&mode=stub`;
    return {
      success: true,
      checkoutUrl: stubUrl,
      checkoutId: `stub_${Date.now()}`,
      mode: 'stub',
    };
  }

  const apiKey = process.env.CHARGILY_SECRET_KEY!;
  const totalAmount = params.items.reduce((s, i) => s + i.price * i.quantity, 0);

  // Chargily expects amount in centimes (1 DZD = 100 centimes)
  const body = {
    items: params.items.map(i => ({
      price: i.price * 100,  // convert DZD → centimes
      quantity: i.quantity,
      description: i.description,
    })),
    success_url: params.successUrl,
    failure_url: params.failureUrl,
    webhook_url: params.webhookUrl,
    locale: params.locale ?? 'en',
    metadata: params.metadata,
  };

  try {
    const res = await fetch(`${CHARGILY_API_BASE}/checkout-session/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: `Chargily API ${res.status}: ${data?.message ?? JSON.stringify(data)}`,
        mode: 'live',
      };
    }

    return {
      success: true,
      checkoutUrl: data.checkout_url,
      checkoutId: data.id,
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

// ---------------------------------------------------------------------------
// Webhook signature verification
// ---------------------------------------------------------------------------

import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verify the Chargily webhook signature.
 * Chargily signs webhooks with HMAC-SHA256 using CHARGILY_WEBHOOK_SECRET.
 *
 * The signature is in the `signature` header (lowercase).
 * The body is the raw JSON string.
 */
export function verifyChargilyWebhookSignature(
  body: string,
  signature: string | null,
): boolean {
  const secret = process.env.CHARGILY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const computed = createHmac('sha256', secret).update(body).digest('hex');
  if (computed.length !== signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  } catch {
    return false;
  }
}
