/**
 * Server-side auth helpers — get the current farmer from a Next.js request.
 *
 * Usage in API routes:
 *   import { getFarmerFromRequest } from '@/lib/auth/server';
 *   const farmer = await getFarmerFromRequest(req);
 *   if (!farmer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   // farmer.id, farmer.phoneE164, farmer.language
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db';

export interface AuthenticatedFarmer {
  id: string;
  phoneE164: string;
  language: 'EN' | 'FR' | 'AR';
  displayName: string | null;
  phoneVerified: boolean;
}

/**
 * Get the authenticated farmer from a Next.js Request.
 * Returns null if not authenticated, or if the session's farmerId no longer
 * exists in the DB (e.g., account was deleted).
 */
export async function getFarmerFromRequest(req: Request): Promise<AuthenticatedFarmer | null> {
  // getServerSession needs the headers from the request
  const headers = new Headers(req.headers);
  const session = await getServerSession({ req: { headers } as any, ...authOptions });

  const farmerId = (session?.user as { farmerId?: string } | undefined)?.farmerId;
  if (!farmerId) return null;

  try {
    const farmer = await db.farmer.findUnique({
      where: { id: farmerId },
      select: {
        id: true,
        phoneE164: true,
        language: true,
        displayName: true,
        phoneVerified: true,
      },
    });
    return farmer as AuthenticatedFarmer | null;
  } catch {
    return null;
  }
}
