'use client';

/**
 * NextAuth SessionProvider wrapper.
 *
 * Mounted in the root layout so that useSession() works everywhere.
 * The provider is no-op when no session exists — doesn't add overhead
 * to public pages.
 */

import { SessionProvider } from 'next-auth/react';
import { type ReactNode } from 'react';

export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
