/**
 * Next.js API route handler for NextAuth.
 *
 * Mounts NextAuth at /api/auth/* — handles /signin, /signout, /session,
 * /csrf, /verify, etc.
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
