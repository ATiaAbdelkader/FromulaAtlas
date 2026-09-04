/**
 * WhatsApp client + phone utils tests (Foundation mode)
 *
 * Verifies:
 *   1. Phone normalization for Algerian numbers (various input formats)
 *   2. Phone pretty-printing + masking
 *   3. WhatsApp client stub mode (default — zero cost)
 *   4. WhatsApp client live mode falls back to stub without credentials
 *   5. WhatsApp client mode resolution (env var parsing)
 *
 * Run:  npm run test:domain   (or)   npx tsx scripts/test-whatsapp-client.ts
 */
import assert from 'node:assert/strict';
import {
  normalizeAlgerianPhone,
  prettyAlgerianPhone,
  maskAlgerianPhone,
} from '../src/lib/phone-utils';
import {
  getWhatsAppSendMode,
  getWhatsAppClient,
  _resetWhatsAppClient,
} from '../src/lib/whatsapp-client';

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
// Test 1: Phone normalization
// ---------------------------------------------------------------------------

console.log('Test 1: normalizeAlgerianPhone');
{
  const cases: Array<[string, string | null]> = [
    // Local formats
    ['0661234567',   '+213661234567'],
    ['0661 23 45 67', '+213661234567'],
    ['0661.23.45.67', '+213661234567'],
    ['0661-23-45-67', '+213661234567'],
    ['661234567',    '+213661234567'],  // 9 digits no leading 0
    // International formats
    ['213661234567', '+213661234567'],
    ['+213661234567', '+213661234567'],
    ['00213661234567', '+213661234567'],
    // Whitespace + casing
    ['  +213661234567  ', '+213661234567'],
    // Invalid
    ['', null],
    ['123', null],
    ['not-a-number', null],
    ['+33123456789', null],  // French number, not supported in v1
    ['+21391234567', null],  // starts with 9 (landline), not mobile
    ['+21381234567', null],  // starts with 8 (landline)
    ['+21341234567', null],  // starts with 4 (invalid)
    // Valid mobile prefixes: 5, 6, 7
    ['+213551234567', '+213551234567'],
    ['+213751234567', '+213751234567'],
  ];
  for (const [input, expected] of cases) {
    const result = normalizeAlgerianPhone(input);
    ok(`normalize('${input}') = '${expected}'`, result === expected, `got '${result}'`);
  }
}

// ---------------------------------------------------------------------------
// Test 2: prettyAlgerianPhone + maskAlgerianPhone
// ---------------------------------------------------------------------------

console.log('Test 2: pretty + mask');
{
  ok('pretty', prettyAlgerianPhone('+213661234567') === '0661 23 45 67');
  ok('pretty (non-Algerian passes through)', prettyAlgerianPhone('+33123456789') === '+33123456789');
  ok('mask', maskAlgerianPhone('+213661234567') === '+213 ••• •• 45 67');
  ok('mask (non-Algerian passes through)', maskAlgerianPhone('+33123456789') === '+33123456789');
}

// ---------------------------------------------------------------------------
// Test 3: getWhatsAppSendMode — defaults to stub
// ---------------------------------------------------------------------------

console.log('Test 3: mode defaults to stub');
{
  // Clear env vars
  const origMode = process.env.WHATSAPP_SEND_MODE;
  const origToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const origPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  delete process.env.WHATSAPP_SEND_MODE;
  delete process.env.WHATSAPP_ACCESS_TOKEN;
  delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  ok('default mode = stub', getWhatsAppSendMode() === 'stub');

  // Explicit stub
  process.env.WHATSAPP_SEND_MODE = 'stub';
  ok('explicit stub', getWhatsAppSendMode() === 'stub');

  // Live without credentials → falls back to stub
  process.env.WHATSAPP_SEND_MODE = 'live';
  delete process.env.WHATSAPP_ACCESS_TOKEN;
  delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  ok('live without token falls back to stub', getWhatsAppSendMode() === 'stub');

  // Live with credentials → live
  process.env.WHATSAPP_SEND_MODE = 'live';
  process.env.WHATSAPP_ACCESS_TOKEN = 'test-token';
  process.env.WHATSAPP_PHONE_NUMBER_ID = 'test-phone-id';
  ok('live with credentials → live', getWhatsAppSendMode() === 'live');

  // Restore
  if (origMode !== undefined) process.env.WHATSAPP_SEND_MODE = origMode;
  else delete process.env.WHATSAPP_SEND_MODE;
  if (origToken !== undefined) process.env.WHATSAPP_ACCESS_TOKEN = origToken;
  else delete process.env.WHATSAPP_ACCESS_TOKEN;
  if (origPhoneId !== undefined) process.env.WHATSAPP_PHONE_NUMBER_ID = origPhoneId;
  else delete process.env.WHATSAPP_PHONE_NUMBER_ID;
}

// ---------------------------------------------------------------------------
// Test 4: Stub client — sendTemplate logs and returns success
// ---------------------------------------------------------------------------

console.log('Test 4: stub client sendTemplate');
{
  // Force stub mode
  const origMode = process.env.WHATSAPP_SEND_MODE;
  delete process.env.WHATSAPP_SEND_MODE;
  _resetWhatsAppClient();

  const client = getWhatsAppClient();
  ok('client mode = stub', client.mode === 'stub');

  const result = await client.sendTemplate({
    to: '+213661234567',
    templateName: 'daily_brief_v1',
    languageCode: 'ar',
    components: {
      body: {
        parameters: [
          { type: 'text', text: 'أحمد' },
          { type: 'text', text: 'البطاطا' },
          { type: 'text', text: '32°C → 18°C' },
          { type: 'text', text: '60 م³' },
          { type: 'text', text: 'https://formulaatlas.dz/brief?id=abc' },
        ],
      },
    },
  });
  ok('send returns success', result.success === true);
  ok('send returns stub mode', result.mode === 'stub');
  ok('send returns fake message ID', typeof result.messageId === 'string' && result.messageId.startsWith('stub_'));
  ok('no error', result.error === undefined);

  // Restore
  if (origMode !== undefined) process.env.WHATSAPP_SEND_MODE = origMode;
  _resetWhatsAppClient();
}

// ---------------------------------------------------------------------------
// Test 5: Stub client — verifyNumber accepts valid E.164
// ---------------------------------------------------------------------------

console.log('Test 5: stub client verifyNumber');
{
  const origMode = process.env.WHATSAPP_SEND_MODE;
  delete process.env.WHATSAPP_SEND_MODE;
  _resetWhatsAppClient();

  const client = getWhatsAppClient();
  const valid = await client.verifyNumber('+213661234567');
  ok('valid E.164 accepted', valid.valid === true);
  ok('waId returned', valid.waId === '213661234567');

  const invalid = await client.verifyNumber('not-a-number');
  ok('invalid format rejected', invalid.valid === false);

  if (origMode !== undefined) process.env.WHATSAPP_SEND_MODE = origMode;
  _resetWhatsAppClient();
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\nWhatsApp client + phone utils tests: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  process.exit(1);
}
})();

// Wrap async tests in IIFE
