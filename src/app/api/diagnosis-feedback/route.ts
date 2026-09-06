/**
 * POST /api/diagnosis-feedback — submit farmer feedback on an AI diagnosis.
 *
 * Body: {
 *   diagnosisId: string,      // client-generated UUID
 *   problemType: string,
 *   problemName: string,
 *   confidence: number,
 *   wasCorrect: boolean,
 *   correctDiagnosis?: string, // if wasCorrect=false
 *   crop?: string,
 *   imageUrl?: string,
 *   notes?: string,
 * }
 *
 * Auth: optional. If logged in, farmerId is recorded. Anonymous feedback
 * is accepted (the diagnosis is still valuable for retraining).
 *
 * Returns: { success: boolean }
 */

import { NextResponse } from 'next/server';
import { getFarmerFromRequest } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { trackServerEvent } from '@/lib/telemetry';
import { z } from 'zod';

const Body = z.object({
  diagnosisId: z.string().min(1).max(100),
  problemType: z.string().max(50),
  problemName: z.string().max(200),
  confidence: z.number().min(0).max(1),
  wasCorrect: z.boolean(),
  correctDiagnosis: z.string().max(200).optional(),
  crop: z.string().max(80).optional(),
  imageUrl: z.string().url().max(2000).optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  // Optional auth — feedback accepted anonymously
  const farmer = await getFarmerFromRequest(req).catch(() => null);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { diagnosisId, problemType, problemName, confidence, wasCorrect, correctDiagnosis, crop, imageUrl, notes } = parsed.data;

  try {
    await db.diagnosisFeedback.create({
      data: {
        farmerId: farmer?.id ?? null,
        diagnosisId,
        problemType,
        problemName,
        confidence,
        wasCorrect,
        correctDiagnosis: wasCorrect ? null : correctDiagnosis,
        crop,
        imageUrl,
        notes,
      },
    });

    // Track in telemetry
    if (farmer) {
      await trackServerEvent(farmer.id, 'diagnosis_feedback_submitted', {
        wasCorrect,
        problemType,
        problemName,
        confidence,
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[diagnosis-feedback]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * GET /api/diagnosis-feedback/stats — admin stats on feedback.
 * Requires x-admin-secret header.
 */
export async function GET(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers.get('x-admin-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const total = await db.diagnosisFeedback.count();
    const correct = await db.diagnosisFeedback.count({ where: { wasCorrect: true } });
    const incorrect = await db.diagnosisFeedback.count({ where: { wasCorrect: false } });

    // Accuracy by problem type
    const byType = await db.diagnosisFeedback.groupBy({
      by: ['problemType'],
      _count: true,
      where: { wasCorrect: true },
    });

    // Most-reported incorrect diagnoses (top 10 — what the model gets wrong)
    const topIncorrect = await db.diagnosisFeedback.groupBy({
      by: ['problemName'],
      _count: true,
      where: { wasCorrect: false },
      orderBy: { _count: { problemName: 'desc' } },
      take: 10,
    });

    return NextResponse.json({
      total,
      correct,
      incorrect,
      accuracy: total > 0 ? Math.round((correct / total) * 100) / 100 : null,
      byType: byType.map(t => ({ type: t.problemType, count: t._count })),
      topIncorrect: topIncorrect.map(t => ({ problem: t.problemName, count: t._count })),
    });
  } catch (e) {
    console.error('[diagnosis-feedback stats]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
