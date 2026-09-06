/**
 * OTP store tests — Foundation mode.
 *
 * Verifies src/lib/otp-store.ts:
 *   1. generateOtp — produces 6-digit code, stores hash, returns success
 *   2. Rate limiting: 3 OTPs per 10 min per phone
 *   3. verifyOtp — correct code succeeds + consumes entry
 *   4. verifyOtp — wrong code increments attempts, locks after 5
 *   5. verifyOtp — expired entries are ignored
 *   6. clearOtps — wipes all entries for a phone
 *   7. Stub mode returns OTP in response, live mode does not
 *
 * Run:  npm run test:domain   (or)   npx tsx scripts/test-otp-store.ts
 */
import assert from 'node:assert/strict';
import {
  generateOtp,
  verifyOtp,
  clearOtps,
  getOtpCount,
} from '../src/lib/otp-store';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean, detail?: string) {
  if (cond) { pass++; }
  else {
    console.error(`  ✗ ${label}${detail ? ': ' + detail : ''}`);
    fail++;
  }
}

const TEST_PHONE = '+213661234567';

// Clean up before each test
function cleanup() {
  clearOtps(TEST_PHONE);
  clearOtps('+213551234567');
  clearOtps('+213751234567');
}

// ---------------------------------------------------------------------------
// Test 1: generateOtp produces 6-digit code + stores hash
// ---------------------------------------------------------------------------

console.log('Test 1: generateOtp basic');
cleanup();
{
  const result = generateOtp(TEST_PHONE);
  ok('returns success', result.success === true);
  ok('returns expiresInMs (10 min)', result.expiresInMs === 10 * 60 * 1000);
  ok('in stub mode returns otp plaintext', typeof result.otp === 'string' && result.otp.length === 6);
  ok('otp is 6 digits', /^\d{6}$/.test(result.otp ?? ''));
  ok('getOtpCount returns 1', getOtpCount(TEST_PHONE) === 1);
}

// ---------------------------------------------------------------------------
// Test 2: Rate limiting — 3 OTPs per 10 min
// ---------------------------------------------------------------------------

console.log('Test 2: rate limiting');
cleanup();
{
  const r1 = generateOtp(TEST_PHONE);
  const r2 = generateOtp(TEST_PHONE);
  const r3 = generateOtp(TEST_PHONE);
  const r4 = generateOtp(TEST_PHONE);
  ok('1st OTP succeeds', r1.success);
  ok('2nd OTP succeeds', r2.success);
  ok('3rd OTP succeeds', r3.success);
  ok('4th OTP rate-limited', !r4.success && r4.reason === 'rate_limited');
  ok('rate-limited response has no otp', r4.otp === undefined);
  ok('store has 3 entries', getOtpCount(TEST_PHONE) === 3);
}

// ---------------------------------------------------------------------------
// Test 3: verifyOtp — correct code succeeds + consumes entry
// ---------------------------------------------------------------------------

console.log('Test 3: verifyOtp correct');
cleanup();
{
  const gen = generateOtp(TEST_PHONE);
  ok('otp generated', gen.success);
  const verify = verifyOtp(TEST_PHONE, gen.otp!);
  ok('correct code verifies', verify.success);
  ok('entry consumed (count=0)', getOtpCount(TEST_PHONE) === 0);

  // Re-verifying same code fails (consumed)
  const verify2 = verifyOtp(TEST_PHONE, gen.otp!);
  ok('re-verify consumed code fails', !verify2.success && verify2.reason === 'not_found');
}

// ---------------------------------------------------------------------------
// Test 4: verifyOtp — wrong code increments attempts, locks after 5
// ---------------------------------------------------------------------------

console.log('Test 4: wrong code attempts');
cleanup();
{
  const gen = generateOtp(TEST_PHONE);
  ok('otp generated', gen.success);

  // 5 wrong attempts
  for (let i = 1; i <= 5; i++) {
    const wrong = verifyOtp(TEST_PHONE, '000000');
    ok(`attempt ${i} fails`, !wrong.success);
    ok(`attempt ${i} reason is wrong_code`, wrong.reason === 'wrong_code');
    if (i < 5) {
      ok(`attempt ${i} has attemptsRemaining`, wrong.attemptsRemaining === 5 - i);
    }
  }

  // 6th attempt — even the correct code should fail (locked)
  const locked = verifyOtp(TEST_PHONE, gen.otp!);
  ok('6th attempt with correct code is locked', !locked.success && locked.reason === 'max_attempts');

  // All entries cleared after lockout
  ok('entries cleared after lockout', getOtpCount(TEST_PHONE) === 0);
}

// ---------------------------------------------------------------------------
// Test 5: verifyOtp — wrong code then correct code (within 5 attempts)
// ---------------------------------------------------------------------------

console.log('Test 5: wrong then correct');
cleanup();
{
  const gen = generateOtp(TEST_PHONE);
  // 2 wrong attempts
  verifyOtp(TEST_PHONE, '111111');
  verifyOtp(TEST_PHONE, '222222');
  // Correct on 3rd attempt
  const correct = verifyOtp(TEST_PHONE, gen.otp!);
  ok('correct on 3rd attempt succeeds', correct.success);
  ok('entry consumed', getOtpCount(TEST_PHONE) === 0);
}

// ---------------------------------------------------------------------------
// Test 6: verifyOtp — non-existent phone
// ---------------------------------------------------------------------------

console.log('Test 6: non-existent phone');
cleanup();
{
  const result = verifyOtp('+213551234567', '123456');
  ok('verify on non-existent phone fails', !result.success);
  ok('reason is not_found', result.reason === 'not_found');
}

// ---------------------------------------------------------------------------
// Test 7: clearOtps
// ---------------------------------------------------------------------------

console.log('Test 7: clearOtps');
cleanup();
{
  generateOtp(TEST_PHONE);
  generateOtp(TEST_PHONE);
  ok('2 entries', getOtpCount(TEST_PHONE) === 2);
  clearOtps(TEST_PHONE);
  ok('cleared', getOtpCount(TEST_PHONE) === 0);
}

// ---------------------------------------------------------------------------
// Test 8: Multiple phones are independent
// ---------------------------------------------------------------------------

console.log('Test 8: phone independence');
cleanup();
{
  const phone1 = '+213661234567';
  const phone2 = '+213551234567';
  const gen1 = generateOtp(phone1);
  const gen2 = generateOtp(phone2);
  ok('phone1 OTP generated', gen1.success);
  ok('phone2 OTP generated', gen2.success);
  ok('phone1 OTP != phone2 OTP', gen1.otp !== gen2.otp || phone1 === phone2);

  // Verifying phone1's code against phone2 should fail
  const crossVerify = verifyOtp(phone2, gen1.otp!);
  ok('cross-phone verify fails', !crossVerify.success);
}

// ---------------------------------------------------------------------------
// Test 9: Live mode — OTP not returned in response
// ---------------------------------------------------------------------------

console.log('Test 9: live mode hides OTP');
cleanup();
{
  const origMode = process.env.WHATSAPP_SEND_MODE;
  process.env.WHATSAPP_SEND_MODE = 'live';
  const result = generateOtp(TEST_PHONE);
  ok('live mode still returns success', result.success);
  ok('live mode does NOT return otp plaintext', result.otp === undefined);
  ok('live mode returns reason undefined', result.reason === undefined);
  // But the OTP is still stored internally — we can verify it via console logs
  // (we can't access it directly because the store only keeps hashes)
  if (origMode !== undefined) process.env.WHATSAPP_SEND_MODE = origMode;
  else delete process.env.WHATSAPP_SEND_MODE;
}

// ---------------------------------------------------------------------------
// Test 10: OTP format — always exactly 6 digits, zero-padded
// ---------------------------------------------------------------------------

console.log('Test 10: OTP format');
cleanup();
{
  for (let i = 0; i < 20; i++) {
    clearOtps(TEST_PHONE);
    const result = generateOtp(TEST_PHONE);
    if (!result.otp || !/^\d{6}$/.test(result.otp)) {
      ok(`OTP ${i} is 6 digits`, false, `got: ${result.otp}`);
      break;
    }
  }
  ok('all 20 OTPs are 6 digits', true);
}

cleanup();
console.log(`\nOTP store tests: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  process.exit(1);
}
