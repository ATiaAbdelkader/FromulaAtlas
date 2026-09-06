/**
 * GET /api/admin/stats — admin dashboard stats for the WhatsApp brief pipeline.
 *
 * Auth: requires x-admin-secret header matching ADMIN_SECRET env var.
 * (Simple shared-secret auth — sufficient for v1. Upgrade to NextAuth
 * role-based auth when we have multiple admin users.)
 *
 * Returns:
 *   - Total farmers, active subscriptions, unsubscribed count
 *   - Today's brief stats (sent, failed, skipped, delivered, read)
 *   - Last 7 days trend (sent per day)
 *   - Recent 20 brief logs with farmer phone (masked) + status + preview
 *   - Current send mode (stub/live)
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { maskAlgerianPhone } from '@/lib/phone-utils';
import { checkSecretHeader } from '@/lib/security-utils';

export const dynamic = 'force-dynamic';

function checkAdminSecret(req: Request): boolean {
  return checkSecretHeader(req, 'ADMIN_SECRET');
}

export async function GET(req: Request) {
  if (!checkAdminSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Farmer + subscription counts
    const [totalFarmers, activeSubs, unsubscribedSubs] = await Promise.all([
      db.farmer.count(),
      db.subscription.count({ where: { enabled: true, unsubscribedAt: null } }),
      db.subscription.count({ where: { unsubscribedAt: { not: null } } }),
    ]);

    // 2. Today's brief stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayBriefs = await db.briefLog.groupBy({
      by: ['status'],
      where: { sentAt: { gte: todayStart, lte: todayEnd } },
      _count: true,
    });

    const todayStats: Record<string, number> = {};
    for (const group of todayBriefs) {
      todayStats[group.status] = group._count;
    }

    // 3. Last 7 days trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentBriefs = await db.briefLog.findMany({
      where: { sentAt: { gte: sevenDaysAgo } },
      select: { sentAt: true, status: true },
    });

    const trend: Array<{ date: string; sent: number; failed: number; skipped: number }> = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(sevenDaysAgo);
      day.setDate(day.getDate() + i);
      const dayStr = day.toISOString().slice(0, 10);
      const dayBriefs = recentBriefs.filter(b => b.sentAt.toISOString().slice(0, 10) === dayStr);
      trend.push({
        date: dayStr,
        sent: dayBriefs.filter(b => b.status === 'SENT' || b.status === 'DELIVERED' || b.status === 'READ').length,
        failed: dayBriefs.filter(b => b.status === 'FAILED').length,
        skipped: dayBriefs.filter(b => b.status === 'SKIPPED').length,
      });
    }

    // 4. Recent 20 brief logs with masked phone
    const recentLogs = await db.briefLog.findMany({
      take: 20,
      orderBy: { sentAt: 'desc' },
      include: {
        farmer: {
          select: { phoneE164: true, displayName: true, language: true },
        },
      },
    });

    const logs = recentLogs.map(l => ({
      id: l.id,
      sentAt: l.sentAt,
      status: l.status,
      sendMode: l.sendMode,
      language: l.language,
      briefLength: l.briefLength,
      weatherSource: l.weatherSource,
      errorMessage: l.errorMessage,
      briefPreview: l.briefPreview.slice(0, 100),
      farmerPhone: maskAlgerianPhone(l.farmer.phoneE164),
      farmerName: l.farmer.displayName,
    }));

    return NextResponse.json({
      sendMode: process.env.WHATSAPP_SEND_MODE ?? 'stub',
      summary: {
        totalFarmers,
        activeSubs,
        unsubscribedSubs,
      },
      today: todayStats,
      trend,
      recentLogs: logs,
    });
  } catch (e) {
    console.error('[admin/stats]', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
