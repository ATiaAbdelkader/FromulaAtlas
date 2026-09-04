/**
 * GET /api/pro-status — check if the current farmer has active Pro access.
 *
 * Response: { isPro: boolean, plan?: string, expiresAt?: string }
 *
 * A farmer is Pro if they have a ProSubscription where:
 *   - status = ACTIVE
 *   - expiresAt IS NULL (no expiry) OR expiresAt > now()
 */

import { NextResponse } from 'next/server';
import { getFarmerFromRequest } from '@/lib/auth/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const farmer = await getFarmerFromRequest(req);
  if (!farmer) {
    return NextResponse.json({ isPro: false });
  }

  try {
    const proSub = await db.proSubscription.findUnique({
      where: { farmerId: farmer.id },
    });

    if (!proSub || proSub.status !== 'ACTIVE') {
      return NextResponse.json({ isPro: false });
    }

    // Check expiry
    if (proSub.expiresAt && proSub.expiresAt < new Date()) {
      // Expired — update status
      await db.proSubscription.update({
        where: { id: proSub.id },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json({ isPro: false });
    }

    return NextResponse.json({
      isPro: true,
      plan: proSub.plan,
      expiresAt: proSub.expiresAt?.toISOString() ?? null,
    });
  } catch (e) {
    console.error('[pro-status]', e);
    return NextResponse.json({ isPro: false });
  }
}
