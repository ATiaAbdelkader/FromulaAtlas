/**
 * WhatsApp webhook keyword tests
 *
 * Verifies the STOP/START keyword matching logic in
 * src/app/api/whatsapp/webhook/route.ts:
 *
 *   1. STOP keywords in EN/FR/AR
 *   2. START keywords in EN/FR/AR
 *   3. Case insensitivity
 *   4. Partial matches ("stop please" still triggers)
 *   5. Free text doesn't trigger either
 *   6. Empty string is safe
 *
 * The full webhook handler requires a Postgres database — tested manually
 * by sending a real WhatsApp reply. The keyword matching is the pure-logic
 * piece that's most likely to break with edge cases.
 *
 * Run:  npm run test:domain   (or)   npx tsx scripts/test-whatsapp-webhook-keywords.ts
 */
import assert from 'node:assert/strict';
import { matchesStopKeyword, matchesStartKeyword } from '../src/app/api/whatsapp/webhook/route';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean, detail?: string) {
  if (cond) { pass++; }
  else {
    console.error(`  ✗ ${label}${detail ? ': ' + detail : ''}`);
    fail++;
  }
}

// ---------------------------------------------------------------------------
// Test 1: STOP keywords — English
// ---------------------------------------------------------------------------

console.log('Test 1: STOP keywords EN');
{
  const stopWords = ['stop', 'Stop', 'STOP', 'unsubscribe', 'Unsubscribe', 'unsub', 'cancel', 'Cancel'];
  for (const w of stopWords) {
    ok(`"${w}" matches STOP`, matchesStopKeyword(w.toLowerCase()) === true);
  }
  // Partial matches with extra text
  ok('"stop please" matches', matchesStopKeyword('stop please') === true);
  ok('"unsubscribe me" matches', matchesStopKeyword('unsubscribe me') === true);
}

// ---------------------------------------------------------------------------
// Test 2: STOP keywords — French
// ---------------------------------------------------------------------------

console.log('Test 2: STOP keywords FR');
{
  // Both accented and non-accented (phone users often skip accents)
  const stopWords = ['arrêt', 'arret', 'désabonner', 'desabonner', 'désabonnement', 'desabonnement'];
  for (const w of stopWords) {
    ok(`"${w}" matches STOP`, matchesStopKeyword(w.toLowerCase()) === true);
  }
}

// ---------------------------------------------------------------------------
// Test 3: STOP keywords — Arabic
// ---------------------------------------------------------------------------

console.log('Test 3: STOP keywords AR');
{
  const stopWords = ['إيقاف', 'إلغاء', 'إلغاء الاشتراك', 'وقف', 'توقف'];
  for (const w of stopWords) {
    ok(`"${w}" matches STOP`, matchesStopKeyword(w.toLowerCase()) === true);
  }
}

// ---------------------------------------------------------------------------
// Test 4: START keywords — EN/FR/AR
// ---------------------------------------------------------------------------

console.log('Test 4: START keywords');
{
  const startWords = [
    'start', 'subscribe', 'sub', 'begin',  // EN
    'commencer', 'abonner',  // FR
    'ابدأ', 'اشترك', 'بدء', 'اشتراك',  // AR
  ];
  for (const w of startWords) {
    ok(`"${w}" matches START`, matchesStartKeyword(w.toLowerCase()) === true);
  }
}

// ---------------------------------------------------------------------------
// Test 5: Free text doesn't trigger STOP
// ---------------------------------------------------------------------------

console.log('Test 5: free text doesn\'t trigger');
{
  const freeText = [
    'hello', 'hi', 'merci', 'thank you', 'شكرا', 'مرحبا',
    'how much water today', 'combien d\'eau',
    'the weather is nice', 'il fait beau',
    'random message', 'question about my crop',
  ];
  for (const text of freeText) {
    ok(`"${text}" does NOT match STOP`, matchesStopKeyword(text.toLowerCase()) === false, `text="${text}"`);
    ok(`"${text}" does NOT match START`, matchesStartKeyword(text.toLowerCase()) === false, `text="${text}"`);
  }
}

// ---------------------------------------------------------------------------
// Test 6: Empty / edge cases
// ---------------------------------------------------------------------------

console.log('Test 6: edge cases');
{
  ok('empty string doesn\'t match STOP', matchesStopKeyword('') === false);
  ok('empty string doesn\'t match START', matchesStartKeyword('') === false);
  ok('whitespace-only doesn\'t match', matchesStopKeyword('   ') === false);
  ok('just punctuation doesn\'t match', matchesStopKeyword('!!!') === false);
  ok('numbers don\'t match', matchesStopKeyword('12345') === false);
}

// ---------------------------------------------------------------------------
// Test 7: STOP doesn't match START (and vice versa)
// ---------------------------------------------------------------------------

console.log('Test 7: STOP and START are mutually exclusive');
{
  // "stop" should match STOP but not START
  ok('"stop" matches STOP', matchesStopKeyword('stop') === true);
  ok('"stop" does NOT match START', matchesStartKeyword('stop') === false);
  // "start" should match START but not STOP
  ok('"start" matches START', matchesStartKeyword('start') === true);
  ok('"start" does NOT match STOP', matchesStopKeyword('start') === false);
}

// ---------------------------------------------------------------------------
// Test 8: Case insensitivity
// ---------------------------------------------------------------------------

console.log('Test 8: case insensitivity');
{
  // Note: matchesStopKeyword receives text.toLowerCase(), so we test that
  // the function correctly handles lowercased input
  const cases = ['STOP', 'Stop', 'sToP', 'UNSUBSCRIBE', 'Unsubscribe'];
  for (const c of cases) {
    ok(`"${c}" (lowercased) matches STOP`, matchesStopKeyword(c.toLowerCase()) === true);
  }
}

// ---------------------------------------------------------------------------
// Test 9: Substring prefix matching
// ---------------------------------------------------------------------------

console.log('Test 9: prefix matching');
{
  // "stopping" starts with "stop" → should match
  ok('"stopping" matches STOP (prefix)', matchesStopKeyword('stopping') === true);
  // "started" starts with "start" → should match
  ok('"started" matches START (prefix)', matchesStartKeyword('started') === true);
  // "stopping" should NOT match START
  ok('"stopping" does NOT match START', matchesStartKeyword('stopping') === false);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\nWhatsApp webhook keyword tests: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  process.exit(1);
}
