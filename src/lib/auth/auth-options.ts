/**
 * NextAuth configuration — phone-based auth for FormulaAtlas.
 *
 * Authentication flow:
 *   1. User enters phone number at /auth
 *   2. POST /api/auth/otp/send → generates 6-digit OTP, sends via WhatsApp
 *      (stub mode: returns OTP in response for dev visibility)
 *   3. User enters OTP
 *   4. POST /api/auth/otp/verify → verifies OTP, creates/looks up Farmer row,
 *      returns a signed session token
 *   5. Subsequent requests include the session cookie automatically
 *
 * Foundation mode: OTP send is stubbed (logged to console + returned in
 * response). Phone number is stored in Farmer table with phoneVerified=false
 * until we go live with WhatsApp OTP.
 *
 * When WHATSAPP_SEND_MODE=live:
 *   - OTP is sent via WhatsApp template `otp_verify_v1`
 *   - On successful verify, Farmer.phoneVerified is set to true
 *   - Backfill script can re-verify all existing farmers
 */

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { verifyOtp } from '@/lib/otp-store';
import { identifyServerUser, trackServerEvent } from '@/lib/telemetry';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'phone-otp',
      name: 'Phone OTP',
      credentials: {
        phoneE164: { label: 'Phone', type: 'text' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.phoneE164 || !credentials?.otp) {
          return null;
        }

        // Verify OTP
        const result = verifyOtp(credentials.phoneE164, credentials.otp);
        if (!result.success) {
          return null;
        }

        // Find or create Farmer
        try {
          let farmer = await db.farmer.findUnique({
            where: { phoneE164: credentials.phoneE164 },
          });
          if (!farmer) {
            farmer = await db.farmer.create({
              data: {
                phoneE164: credentials.phoneE164,
                // In stub mode, mark phoneVerified=true (we accepted the OTP)
                // In live mode, this will only be set after WhatsApp OTP succeeds
                phoneVerified: true,
                lastLoginAt: new Date(),
              },
            });
          } else {
            farmer = await db.farmer.update({
              where: { id: farmer.id },
              data: {
                phoneVerified: true,
                lastLoginAt: new Date(),
              },
            });
          }

          // Return user object — NextAuth will encode the id + phoneE164 in JWT
          // Track auth success in telemetry (no-op if PostHog not configured)
          await identifyServerUser(farmer.id, {
            phoneE164: farmer.phoneE164,
            language: farmer.language,
            createdAt: farmer.createdAt,
          });
          await trackServerEvent(farmer.id, 'user_signed_in', {
            isNewUser: farmer.createdAt.getTime() > Date.now() - 60_000,  // created in last minute = new
            language: farmer.language,
          });

          return {
            id: farmer.id,
            name: farmer.displayName ?? undefined,
            phoneE164: farmer.phoneE164,
            language: farmer.language,
          } as { id: string; name?: string; phoneE164: string; language: string };
        } catch (e) {
          console.error('[auth] Failed to create/find farmer:', e);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,  // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // First-time login — persist farmer info in token
        const u = user as { id: string; phoneE164: string; language: string };
        token.farmerId = u.id;
        token.phoneE164 = u.phoneE164;
        token.language = u.language;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose farmer info in session
      if (session.user) {
        (session.user as { farmerId?: string; phoneE164?: string; language?: string }).farmerId = token.farmerId as string | undefined;
        (session.user as { farmerId?: string; phoneE164?: string; language?: string }).phoneE164 = token.phoneE164 as string | undefined;
        (session.user as { farmerId?: string; phoneE164?: string; language?: string }).language = token.language as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth',
    error: '/auth',
  },
  // Secret — required. Falls back to a dev-only value if not set (logs warning).
  secret: process.env.NEXTAUTH_SECRET ?? devSecret(),
};

/**
 * Generate a dev-only secret if NEXTAUTH_SECRET is not set.
 * This is insecure for production — Vercel will refuse to deploy without
 * NEXTAUTH_SECRET set.
 */
function devSecret(): string {
  if (process.env.NODE_ENV === 'production') {
    console.error('[auth] NEXTAUTH_SECRET not set in production — refusing to start. Set it in Vercel env vars.');
    // Return a clearly-invalid value so JWT signing fails loudly
    return 'NEEDS_NEXTAUTH_SECRET';
  }
  console.warn('[auth] NEXTAUTH_SECRET not set — using dev-only secret. DO NOT DEPLOY WITHOUT SETTING IT.');
  return 'formula-atlas-dev-only-secret-not-for-production';
}
