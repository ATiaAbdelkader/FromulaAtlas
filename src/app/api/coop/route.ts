/**
 * /api/coop
 *   GET    — list cooperatives the current farmer is a member of
 *   POST   — create a new cooperative (creator becomes ADMIN)
 *
 * /api/coop/join
 *   POST   — join a cooperative via join code
 *
 * /api/coop/stats?id=<coopId>
 *   GET    — aggregated stats for a cooperative (anonymized for MEMBERS,
 *            full detail for ADMIN/AGRONOMIST)
 */

import { NextResponse } from 'next/server';
import { getFarmerFromRequest } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { generateJoinCode } from '@/lib/coop-utils';
import { z } from 'zod';

const CreateBody = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
});

// ---------------------------------------------------------------------------
// GET — list coops for the current farmer
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  const farmer = await getFarmerFromRequest(req);
  if (!farmer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const memberships = await db.coopMember.findMany({
      where: { farmerId: farmer.id },
      include: {
        cooperative: {
          select: {
            id: true,
            name: true,
            description: true,
            joinCode: true,
            adminFarmerId: true,
            createdAt: true,
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return NextResponse.json({
      cooperatives: memberships.map(m => ({
        id: m.cooperative.id,
        name: m.cooperative.name,
        description: m.cooperative.description,
        joinCode: m.role === 'ADMIN' ? m.cooperative.joinCode : undefined,
        role: m.role,
        consentShareData: m.consentShareData,
        joinedAt: m.joinedAt,
        memberCount: m.cooperative._count.members,
        isAdmin: m.cooperative.adminFarmerId === farmer.id,
      })),
    });
  } catch (e) {
    console.error('[coop/list]', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — create a new cooperative
// ---------------------------------------------------------------------------

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

  const parsed = CreateBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    let joinCode = '';
    for (let i = 0; i < 5; i++) {
      const candidate = generateJoinCode();
      const existing = await db.cooperative.findUnique({ where: { joinCode: candidate } });
      if (!existing) {
        joinCode = candidate;
        break;
      }
    }
    if (!joinCode) {
      return NextResponse.json({ error: 'Failed to generate join code' }, { status: 500 });
    }

    const coop = await db.cooperative.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        joinCode,
        adminFarmerId: farmer.id,
        members: {
          create: {
            farmerId: farmer.id,
            role: 'ADMIN',
            consentShareData: true,
          },
        },
      },
    });

    return NextResponse.json({
      cooperative: {
        id: coop.id,
        name: coop.name,
        description: coop.description,
        joinCode: coop.joinCode,
        createdAt: coop.createdAt,
      },
    });
  } catch (e) {
    console.error('[coop/create]', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
