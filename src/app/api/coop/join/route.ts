/**
 * POST /api/coop/join — join a cooperative via join code.
 *
 * Body: { joinCode: string, consentShareData?: boolean }
 * Response: { cooperative: {...} } or { error: 'Invalid code' | 'Already a member' }
 */

import { NextResponse } from 'next/server';
import { getFarmerFromRequest } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const Body = z.object({
  joinCode: z.string().length(6).toUpperCase(),
  consentShareData: z.boolean().default(false),
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

  // Normalize join code (uppercase, strip whitespace)
  const rawBody = body as { joinCode?: unknown; consentShareData?: unknown };
  const rawCode = typeof rawBody.joinCode === 'string'
    ? rawBody.joinCode.trim().toUpperCase()
    : '';
  const parsed = Body.safeParse({ joinCode: rawCode, consentShareData: rawBody.consentShareData ?? false });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid join code format (6 characters)' },
      { status: 400 },
    );
  }

  try {
    const coop = await db.cooperative.findUnique({
      where: { joinCode: parsed.data.joinCode },
    });
    if (!coop) {
      return NextResponse.json({ error: 'Invalid join code' }, { status: 404 });
    }

    // Check if already a member
    const existing = await db.coopMember.findUnique({
      where: {
        cooperativeId_farmerId: {
          cooperativeId: coop.id,
          farmerId: farmer.id,
        },
      },
    });
    if (existing) {
      return NextResponse.json({ error: 'Already a member' }, { status: 409 });
    }

    // Add as MEMBER
    await db.coopMember.create({
      data: {
        cooperativeId: coop.id,
        farmerId: farmer.id,
        role: 'MEMBER',
        consentShareData: parsed.data.consentShareData,
      },
    });

    return NextResponse.json({
      cooperative: {
        id: coop.id,
        name: coop.name,
        description: coop.description,
      },
    });
  } catch (e) {
    console.error('[coop/join]', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
