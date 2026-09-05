/**
 * POST /api/checkout/create — create a Chargily checkout session.
 *
 * Body: { plan: 'pro_monthly' | 'pro_annual' | 'coop_monthly' }
 * Response: { checkoutUrl: string, mode: 'stub' | 'live' }
 *
 * Auth required (farmer must be logged in).
 * Creates a ProSubscription row with status=PENDING, then creates a
 * Chargily checkout session and returns the URL.
 *
 * Foundation mode (no CHARGILY_SECRET_KEY): returns a local stub URL.
 */

import { NextResponse } from 'next/server';
import { getFarmerFromRequest } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { createCheckoutSession, getChargilyMode } from '@/lib/chargily-client';
import { trackServerEvent } from '@/lib/telemetry';
import { z } from 'zod';

const PLANS: Record<string, { amountDzd: number; description: string; durationDays: number | null }> = {
  pro_monthly:  { amountDzd: 1500,  description: 'FormulaAtlas Pro — 1 month',  durationDays: 30 },
  pro_annual:   { amountDzd: 15000, description: 'FormulaAtlas Pro — 1 year',   durationDays: 365 },
  coop_monthly: { amountDzd: 15000, description: 'FormulaAtlas Cooperative — 1 month', durationDays: 30 },
};

const Body = z.object({
  plan: z.enum(['pro_monthly', 'pro_annual', 'coop_monthly']),
});

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

  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const plan = parsed.data.plan;
  const planConfig = PLANS[plan];

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://formulaatlas.dz';

  // Create ProSubscription row (PENDING)
  const proSub = await db.proSubscription.upsert({
    where: { farmerId: farmer.id },
    create: {
      farmerId: farmer.id,
      status: 'PENDING',
      plan,
      amountDzd: planConfig.amountDzd,
    },
    update: {
      status: 'PENDING',
      plan,
      amountDzd: planConfig.amountDzd,
      // Clear previous checkout info
      checkoutId: null,
      checkoutUrl: null,
      paidAt: null,
      expiresAt: null,
    },
  });

  // Create Chargily checkout session
  const checkout = await createCheckoutSession({
    items: [{
      price: planConfig.amountDzd,
      quantity: 1,
      description: planConfig.description,
    }],
    successUrl: `${baseUrl}/payment-success?sub=${proSub.id}`,
    failureUrl: `${baseUrl}/payment-pending?sub=${proSub.id}&status=failed`,
    webhookUrl: `${baseUrl}/api/chargily/webhook`,
    locale: farmer.language.toLowerCase() as 'en' | 'fr' | 'ar',
    metadata: {
      farmerId: farmer.id,
      proSubId: proSub.id,
      plan,
    },
  });

  if (!checkout.success) {
    return NextResponse.json({ error: checkout.error ?? 'Checkout failed' }, { status: 502 });
  }

  // Store checkout ID + URL
  await db.proSubscription.update({
    where: { id: proSub.id },
    data: {
      checkoutId: checkout.checkoutId ?? null,
      checkoutUrl: checkout.checkoutUrl ?? null,
    },
  });

  // Track checkout started
  await trackServerEvent(farmer.id, 'checkout_started', {
    plan,
    amountDzd: planConfig.amountDzd,
    mode: checkout.mode,
  });

  return NextResponse.json({
    checkoutUrl: checkout.checkoutUrl,
    mode: checkout.mode,
  });
}
