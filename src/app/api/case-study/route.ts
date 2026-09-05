/**
 * POST /api/case-study — submit a case study from a pilot coop.
 *
 * Body: { coopId, story, results, quotes, photos }
 * Auth: must be the admin of the coop.
 *
 * Stored as caseStudyRequested=true + caseStudySubmittedAt=now on the coop.
 * The actual story content is emailed to the team (or stored for v2 review).
 */

import { NextResponse } from 'next/server';
import { getFarmerFromRequest } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { trackServerEvent } from '@/lib/telemetry';
import { z } from 'zod';

const Body = z.object({
  coopId: z.string().cuid(),
  story: z.string().min(50).max(5000),
  results: z.string().max(2000).optional(),
  quotes: z.string().max(1000).optional(),
  contactForFollowup: z.boolean().default(true),
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
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { coopId, story, results, quotes, contactForFollowup } = parsed.data;

  try {
    // Verify the farmer is the admin of this coop
    const coop = await db.cooperative.findUnique({
      where: { id: coopId },
      select: { id: true, name: true, adminFarmerId: true, isPilot: true },
    });
    if (!coop) {
      return NextResponse.json({ error: 'Cooperative not found' }, { status: 404 });
    }
    if (coop.adminFarmerId !== farmer.id) {
      return NextResponse.json({ error: 'Only the coop admin can submit a case study' }, { status: 403 });
    }

    // Mark case study as submitted
    await db.cooperative.update({
      where: { id: coopId },
      data: {
        caseStudyRequested: true,
        caseStudySubmittedAt: new Date(),
      },
    });

    // Track the submission
    await trackServerEvent(farmer.id, 'case_study_submitted', {
      coopId,
      coopName: coop.name,
      isPilot: coop.isPilot,
      storyLength: story.length,
      hasResults: Boolean(results),
      hasQuotes: Boolean(quotes),
      contactForFollowup,
    });

    // TODO: in production, email the story to case-studies@formulaatlas.dz
    // or store in a CaseStudy table (deferred until we have enough volume)
    console.log(`[case-study] Submitted by ${farmer.phoneE164} for coop ${coop.name}: ${story.slice(0, 100)}...`);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[case-study]', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
