/**
 * GET /api/coop/stats?id=<coopId>
 *
 * Returns aggregated stats for a cooperative:
 *   - Total members, total area, crop distribution
 *   - For ADMIN/AGRONOMIST: per-member breakdown with farm details
 *   - For MEMBER: anonymized aggregate only (no per-member data)
 *
 * Members who haven't consented (consentShareData=false) are excluded from
 * the agronomist's per-member view but still counted in the aggregate.
 */

import { NextResponse } from 'next/server';
import { getFarmerFromRequest } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { canViewAllFarms } from '@/lib/coop-utils';
import { maskAlgerianPhone } from '@/lib/phone-utils';

export async function GET(req: Request) {
  const farmer = await getFarmerFromRequest(req);
  if (!farmer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const coopId = url.searchParams.get('id');
  if (!coopId) {
    return NextResponse.json({ error: 'Missing coop id' }, { status: 400 });
  }

  try {
    // Verify membership
    const membership = await db.coopMember.findUnique({
      where: {
        cooperativeId_farmerId: {
          cooperativeId: coopId,
          farmerId: farmer.id,
        },
      },
      include: {
        cooperative: {
          select: { id: true, name: true, description: true, adminFarmerId: true, createdAt: true },
        },
      },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    // Get all members with their farm profiles
    const members = await db.coopMember.findMany({
      where: { cooperativeId: coopId },
      include: {
        farmer: {
          select: {
            id: true,
            phoneE164: true,
            displayName: true,
            language: true,
            farmProfile: {
              select: {
                name: true, lat: true, lng: true, crop: true,
                plantingDate: true, areaHa: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    // Aggregate stats
    const consentingMembers = members.filter(m => m.consentShareData || m.role === 'ADMIN');
    const farmsWithData = members
      .filter(m => m.consentShareData || m.role === 'ADMIN')
      .map(m => m.farmer.farmProfile)
      .filter(Boolean);

    const totalArea = farmsWithData.reduce((s, f) => s + (f!.areaHa ?? 0), 0);
    const cropDistribution: Record<string, number> = {};
    for (const f of farmsWithData) {
      if (f!.crop) {
        cropDistribution[f!.crop] = (cropDistribution[f!.crop] ?? 0) + 1;
      }
    }

    const canSeeDetails = canViewAllFarms(membership.role);

    // Build member list (anonymized for MEMBERS)
    const memberList = canSeeDetails
      ? members.map(m => ({
          id: m.farmer.id,
          phone: maskAlgerianPhone(m.farmer.phoneE164),
          name: m.farmer.displayName,
          role: m.role,
          consentShareData: m.consentShareData,
          joinedAt: m.joinedAt,
          hasFarm: Boolean(m.farmer.farmProfile),
          farm: m.consentShareData || m.role === 'ADMIN' ? {
            name: m.farmer.farmProfile?.name,
            crop: m.farmer.farmProfile?.crop,
            areaHa: m.farmer.farmProfile?.areaHa,
            plantingDate: m.farmer.farmProfile?.plantingDate,
          } : null,
        }))
      : undefined;  // members don't see the list

    return NextResponse.json({
      cooperative: membership.cooperative,
      role: membership.role,
      stats: {
        totalMembers: members.length,
        consentingMembers: consentingMembers.length,
        farmsWithData: farmsWithData.length,
        totalAreaHa: Math.round(totalArea * 100) / 100,
        cropDistribution,
      },
      members: memberList,
    });
  } catch (e) {
    console.error('[coop/stats]', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
