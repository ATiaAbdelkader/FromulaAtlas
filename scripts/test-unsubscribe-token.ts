/**
 * Unsubscribe token tests
 *
 * Verifies src/lib/unsubscribe-token.ts:
 *   1. generateUnsubscribeToken — produces a valid token with farmerId + exp
 *   2. verifyUnsubscribeToken — round-trips correctly
 *   3. Token expires after 7 days
 *   4. Bad signature is rejected
 *   5. Tampered payload is rejected
 *   6. Invalid farmerId format is rejected
 *   7. Different NEXTAUTH_SECRET invalidates token
 *
 * Run:  npm run test:domain   (or)   npx tsx scripts/test-unsubscribe-token.ts
 */
import assert from 'node:assert/strict';
import {
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
} from '../src/lib/unsubscribe-token';

// Ensure we have a stable secret for tests
process.env.NEXTAUTH_SECRET = 'test-secret-for-unsubscribe-tokens';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean, detail?: string) {
  if (cond) { pass++; }
  else {
    console.error(`  ✗ ${label}${detail ? ': ' + detail : ''}`);
    fail++;
  }
}

(async () => {

// ---------------------------------------------------------------------------
// Test 1: round-trip
// ---------------------------------------------------------------------------

console.log('Test 1: round-trip');
{
  const farmerId = 'clxyz1234567890abcdefghij';
  const token = generateUnsubscribeToken(farmerId);
  ok('token is a string', typeof token === 'string' && token.length > 0);
  ok('token has 2 parts separated by .', token.split('.').length === 2);

  const result = verifyUnsubscribeToken(token);
  ok('verifies as valid', result.valid === true);
  ok('returns farmerId', result.farmerId === farmerId);
  ok('no reason on success', result.reason === undefined);
}

// ---------------------------------------------------------------------------
// Test 2: invalid format
// ---------------------------------------------------------------------------

console.log('Test 2: invalid format');
{
  const cases = ['', 'not-a-token', 'only-one-part', 'a.b.c', 'a.b.c.d'];
  for (const t of cases) {
    const result = verifyUnsubscribeToken(t);
    ok(`rejects "${t}"`, !result.valid && result.reason === 'invalid_format');
  }
}

// ---------------------------------------------------------------------------
// Test 3: bad signature (tampered)
// ---------------------------------------------------------------------------

console.log('Test 3: bad signature');
{
  const token = generateUnsubscribeToken('clxyz1234567890abcdefghij');
  const [b64, sig] = token.split('.');
  // Flip one char in the signature
  const tamperedSig = sig.charAt(0) === 'A' ? 'B' + sig.slice(1) : 'A' + sig.slice(1);
  const tamperedToken = `${b64}.${tamperedSig}`;
  const result = verifyUnsubscribeToken(tamperedToken);
  ok('rejects tampered signature', !result.valid && result.reason === 'bad_signature');
}

// ---------------------------------------------------------------------------
// Test 4: tampered payload (different farmerId)
// ---------------------------------------------------------------------------

console.log('Test 4: tampered payload');
{
  const token1 = generateUnsubscribeToken('clxyz1234567890abcdefghij');
  const token2 = generateUnsubscribeToken('clxyz9999999999zyxwvutsr');
  const [b64_1, sig_1] = token1.split('.');
  const [b64_2, sig_2] = token2.split('.');
  // Use payload from token1 but signature from token2
  const tamperedToken = `${b64_1}.${sig_2}`;
  const result = verifyUnsubscribeToken(tamperedToken);
  ok('rejects payload/signature mismatch', !result.valid && result.reason === 'bad_signature');
}

// ---------------------------------------------------------------------------
// Test 5: expired token
// ---------------------------------------------------------------------------

console.log('Test 5: expired token');
{
  // Generate a token, then manually forge an expired one with a valid signature
  // We can't easily generate an expired token via the public API, so we'll
  // build it manually using the same internal format.
  const crypto = await import('node:crypto');
  const farmerId = 'clxyz1234567890abcdefghij';
  const pastDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(); // 8 days ago
  const payload = JSON.stringify({ farmerId, exp: pastDate });
  const b64 = Buffer.from(payload, 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', process.env.NEXTAUTH_SECRET!).update(`${b64}.${pastDate}`).digest('base64url');
  const expiredToken = `${b64}.${sig}`;

  const result = verifyUnsubscribeToken(expiredToken);
  ok('rejects expired token', !result.valid && result.reason === 'expired');
}

// ---------------------------------------------------------------------------
// Test 6: invalid farmerId format
// ---------------------------------------------------------------------------

console.log('Test 6: invalid farmerId format');
{
  // Manually forge a token with an invalid farmerId (e.g., containing special chars)
  const crypto = await import('node:crypto');
  const invalidIds = [
    'not-a-valid-id',
    '../../../etc/passwd',
    'a'.repeat(5),  // too short
    'a'.repeat(100),  // too long
    '',
  ];
  for (const id of invalidIds) {
    const payload = JSON.stringify({ farmerId: id, exp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() });
    const b64 = Buffer.from(payload, 'utf8').toString('base64url');
    const sig = crypto.createHmac('sha256', process.env.NEXTAUTH_SECRET!).update(`${b64}.${payload}`).digest('base64url');
    // Note: our sign function uses `${b64}.${exp}` — we need to match that
    const expStr = JSON.parse(payload).exp;
    const sig2 = crypto.createHmac('sha256', process.env.NEXTAUTH_SECRET!).update(`${b64}.${expStr}`).digest('base64url');
    const token = `${b64}.${sig2}`;
    const result = verifyUnsubscribeToken(token);
    ok(`rejects invalid farmerId "${id.substring(0, 20)}..."`, !result.valid, `reason: ${result.reason}`);
  }
}

// ---------------------------------------------------------------------------
// Test 7: different NEXTAUTH_SECRET invalidates old tokens
// ---------------------------------------------------------------------------

console.log('Test 7: secret rotation');
{
  // Generate token with current secret
  const token = generateUnsubscribeToken('clxyz1234567890abcdefghij');
  // Rotate secret
  const origSecret = process.env.NEXTAUTH_SECRET;
  process.env.NEXTAUTH_SECRET = 'new-rotated-secret';
  const result = verifyUnsubscribeToken(token);
  ok('old token invalid after secret rotation', !result.valid && result.reason === 'bad_signature');
  // Restore
  process.env.NEXTAUTH_SECRET = origSecret;
}

// ---------------------------------------------------------------------------
// Test 8: token survives 6 days (just under 7-day expiry)
// ---------------------------------------------------------------------------

console.log('Test 8: token valid at 6 days');
{
  const crypto = await import('node:crypto');
  const farmerId = 'clxyz1234567890abcdefghij';
  const futureDate = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(); // 6 days from now
  const payload = JSON.stringify({ farmerId, exp: futureDate });
  const b64 = Buffer.from(payload, 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', process.env.NEXTAUTH_SECRET!).update(`${b64}.${futureDate}`).digest('base64url');
  const token = `${b64}.${sig}`;
  const result = verifyUnsubscribeToken(token);
  ok('token valid at 6 days', result.valid === true);
}

// ---------------------------------------------------------------------------
// Test 9: token uniqueness (different farmers get different tokens)
// ---------------------------------------------------------------------------

console.log('Test 9: token uniqueness');
{
  const farmer1 = 'clxyz1111111111aaaaaaaaaa';
  const farmer2 = 'clxyz2222222222bbbbbbbbbb';
  const token1 = generateUnsubscribeToken(farmer1);
  const token2 = generateUnsubscribeToken(farmer2);
  ok('different farmers get different tokens', token1 !== token2);

  // Verify each returns the correct farmerId
  ok('token1 → farmer1', verifyUnsubscribeToken(token1).farmerId === farmer1);
  ok('token2 → farmer2', verifyUnsubscribeToken(token2).farmerId === farmer2);
}

// ---------------------------------------------------------------------------
// Test 10: same farmer gets different tokens (because exp differs by ms)
// ---------------------------------------------------------------------------

console.log('Test 10: same farmer token generation');
{
  const farmerId = 'clxyz1234567890abcdefghij';
  const token1 = generateUnsubscribeToken(farmerId);
  // Wait a tiny bit
  await new Promise(r => setTimeout(r, 10));
  const token2 = generateUnsubscribeToken(farmerId);
  // Tokens may be the same if generated in the same millisecond — that's OK
  // Both must verify correctly
  ok('token1 verifies', verifyUnsubscribeToken(token1).valid);
  ok('token2 verifies', verifyUnsubscribeToken(token2).valid);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\nUnsubscribe token tests: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  process.exit(1);
}
})();
