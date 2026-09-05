/**
 * POST /api/coop/pilot — mark a cooperative as a pilot (admin only).
 *
 * Auth: requires x-admin-secret header matching ADMIN_SECRET env var.
 * Body: { coopId: string, days?: number (default 60) }
 *
 * Sets isPilot=true, pilotStartedAt=now, pilotExpiresAt=now+days.
 * All members of the coop get free Pro access during the pilot period.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { trackServerEvent } from '@/lib/telemetry';
import { checkSecretHeader } from '@/lib/security-utils';
import { z } from 'zod';

function checkAdminSecret(req: Request): boolean {
  return checkSecretHeader(req, 'ADMIN_SECRET');
}

const Body = z.object({
  coopId: z.string().cuid(),
  days: z.number().int().min(1).max(365).default(60),
});

export async function POST(req: Request) {
  if (!checkAdminSecret(req)) {
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
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }

  const { coopId, days } = parsed.data;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  try {
    const coop = await db.cooperative.update({
      where: { id: coopId },
      data: {
        isPilot: true,
        pilotStartedAt: now,
        pilotExpiresAt: expiresAt,
      },
      include: {
        members: { select: { farmerId: true } },
      },
    });

    // Track pilot start for each member
    for (const member of coop.members) {
      await trackServerEvent(member.farmerId, 'pilot_started', {
        coopId,
        coopName: coop.name,
        days,
        expiresAt: expiresAt.toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      cooperative: {
        id: coop.id,
        name: coop.name,
        isPilot: coop.isPilot,
        pilotStartedAt: coop.pilotStartedAt,
        pilotExpiresAt: coop.pilotExpiresAt,
        memberCount: coop.members.length,
      },
    });
  } catch (e) {
    console.error('[coop/pilot]', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

/**
 * DELETE /api/coop/pilot — end a pilot early (admin only).
 * Body: { coopId: string }
 */
export async function DELETE(req: Request) {
  if (!checkAdminSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const coopId = (body as { coopId?: string })?.coopId;
  if (!coopId || typeof coopId !== 'string') {
    return NextResponse.json({ error: 'coopId required' }, { status: 400 });
  }

  try {
    await db.cooperative.update({
      where: { id: coopId },
      data: {
        isPilot: false,
        pilotExpiresAt: new Date(),  // expire immediately
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[coop/pilot DELETE]', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
