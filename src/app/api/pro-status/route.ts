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

/**
 * A farmer has Pro access if ANY of:
 *   1. They have an active ProSubscription (status=ACTIVE, not expired)
 *   2. They are a member of a pilot cooperative (isPilot=true, pilotExpiresAt > now)
 *
 * Pilot coops get free Pro for all members during the pilot period.
 */
export async function GET(req: Request) {
  const farmer = await getFarmerFromRequest(req);
  if (!farmer) {
    return NextResponse.json({ isPro: false });
  }

  try {
    // 1. Check direct Pro subscription
    const proSub = await db.proSubscription.findUnique({
      where: { farmerId: farmer.id },
    });

    if (proSub && proSub.status === 'ACTIVE') {
      // Check expiry
      if (proSub.expiresAt && proSub.expiresAt < new Date()) {
        await db.proSubscription.update({
          where: { id: proSub.id },
          data: { status: 'EXPIRED' },
        });
      } else {
        return NextResponse.json({
          isPro: true,
          plan: proSub.plan,
          expiresAt: proSub.expiresAt?.toISOString() ?? null,
          source: 'subscription',
        });
      }
    }

    // 2. Check pilot cooperative membership
    const pilotMembership = await db.coopMember.findFirst({
      where: {
        farmerId: farmer.id,
        cooperative: {
          isPilot: true,
          pilotExpiresAt: { gt: new Date() },
        },
      },
      include: {
        cooperative: {
          select: { id: true, name: true, pilotExpiresAt: true },
        },
      },
    });

    if (pilotMembership) {
      return NextResponse.json({
        isPro: true,
        plan: 'pilot',
        expiresAt: pilotMembership.cooperative.pilotExpiresAt?.toISOString() ?? null,
        source: 'pilot_coop',
        coopName: pilotMembership.cooperative.name,
      });
    }

    return NextResponse.json({ isPro: false });
  } catch (e) {
    console.error('[pro-status]', e);
    return NextResponse.json({ isPro: false });
  }
}
