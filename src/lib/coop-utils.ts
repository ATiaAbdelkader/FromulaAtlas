/**
 * Coop utilities — join code generation + role checks.
 */

import { randomBytes } from 'node:crypto';

/**
 * Generate a 6-character join code (uppercase letters + digits).
 * Excludes ambiguous chars (0/O, 1/I) for readability.
 * ~1.8 billion possible codes — collision risk is negligible for v1.
 */
export function generateJoinCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  // no 0/O/1/I
  const bytes = randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return code;
}

/**
 * Check if a farmer has admin/agronomist privileges in a coop.
 */
export function canViewAllFarms(role: 'ADMIN' | 'AGRONOMIST' | 'MEMBER'): boolean {
  return role === 'ADMIN' || role === 'AGRONOMIST';
}

export function canManageMembers(role: 'ADMIN' | 'AGRONOMIST' | 'MEMBER'): boolean {
  return role === 'ADMIN';
}
