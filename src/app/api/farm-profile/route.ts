/**
 * GET /api/farm-profile — get the current farmer's saved farm profile.
 * POST /api/farm-profile — upsert (sync from localStorage to Postgres).
 *
 * The cron job reads from Postgres, NOT localStorage (localStorage isn't
 * accessible from the server). So when a logged-in farmer saves their
 * farm profile in the UI, we need to sync it to Postgres.
 *
 * POST body: { name?, lat, lng, crop, plantingDate, areaHa?, plan? }
 *   - plan is optional FarmPilotPlan object (will be JSON.stringified)
 *
 * Foundation mode: works in both stub and live — just persists data.
 */

import { NextResponse } from 'next/server';
import { getFarmerFromRequest } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { normalizeAlgerianPhone } from '@/lib/phone-utils';
import type { FarmPilotPlan } from '@/lib/farmpilot-data';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const FarmProfileBody = z.object({
  name: z.string().max(200).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  crop: z.string().min(1).max(50),
  plantingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'plantingDate must be YYYY-MM-DD'),
  areaHa: z.number().min(0).max(10000).optional(),
  // Strict FarmPilotPlan schema — prevents mass assignment + caps size
  plan: z.object({
    cropId: z.string().max(50).optional(),
    plantingDate: z.string().max(20).optional(),
    areaHa: z.number().min(0).max(10000).optional(),
    productionSystem: z.string().max(30).optional(),
    irrigationSystem: z.string().max(30).optional(),
    irrigationFlowLph: z.number().min(0).max(100000).optional(),
    targetYieldTonsHa: z.number().min(0).max(1000).optional(),
    fertilizerProduct: z.string().max(100).optional(),
    notes: z.string().max(2000).optional(),
    createdAt: z.number().optional(),
    updatedAt: z.number().optional(),
  }).optional(),
});

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  const farmer = await getFarmerFromRequest(req);
  if (!farmer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profile = await db.farmProfile.findUnique({
      where: { farmerId: farmer.id },
    });

    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    let plan: FarmPilotPlan | null = null;
    try {
      if (profile.planJson) {
        plan = JSON.parse(profile.planJson) as FarmPilotPlan;
      }
    } catch {
      // Corrupt planJson — ignore
    }

    return NextResponse.json({
      profile: {
        name: profile.name,
        lat: profile.lat,
        lng: profile.lng,
        crop: profile.crop,
        plantingDate: profile.plantingDate,
        areaHa: profile.areaHa,
        plan,
        updatedAt: profile.updatedAt,
      },
    });
  } catch (e) {
    console.error('[farm-profile GET]', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — upsert
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

  const parsed = FarmProfileBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { name, lat, lng, crop, plantingDate, areaHa, plan } = parsed.data;

  try {
    const profile = await db.farmProfile.upsert({
      where: { farmerId: farmer.id },
      create: {
        farmerId: farmer.id,
        name,
        lat,
        lng,
        crop,
        plantingDate,
        areaHa,
        planJson: plan ? JSON.stringify(plan) : null,
      },
      update: {
        name,
        lat,
        lng,
        crop,
        plantingDate,
        areaHa,
        planJson: plan ? JSON.stringify(plan) : null,
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (e) {
    console.error('[farm-profile POST]', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
