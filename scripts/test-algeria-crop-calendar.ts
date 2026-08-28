import assert from 'node:assert/strict';
import {
  ALGERIA_CALENDAR_ENTRIES,
  ALGERIA_CALENDAR_MONTHS,
  CALENDAR_CROP_LABELS,
  getCalendarCropKeys,
} from '../src/lib/algeria-crop-calendar';

assert.equal(ALGERIA_CALENDAR_MONTHS.length, 12, 'calendar must contain all twelve months');
assert.deepEqual(
  ALGERIA_CALENDAR_MONTHS.map(month => month.number),
  Array.from({ length: 12 }, (_, index) => index + 1),
  'calendar months must be ordered January through December',
);
assert.equal(
  new Set(ALGERIA_CALENDAR_MONTHS.map(month => month.source.file)).size,
  12,
  'each month must retain a distinct source PDF',
);
assert.ok(ALGERIA_CALENDAR_ENTRIES.length >= 400, 'calendar should retain the detailed source entry set');
assert.equal(
  new Set(ALGERIA_CALENDAR_ENTRIES.map(entry => entry.id)).size,
  ALGERIA_CALENDAR_ENTRIES.length,
  'calendar entry IDs must be unique',
);
assert.ok(ALGERIA_CALENDAR_ENTRIES.every(entry => entry.operations.length > 0), 'each calendar entry needs source operations');
assert.ok(ALGERIA_CALENDAR_ENTRIES.every(entry => entry.source.printedPages.length > 0), 'each calendar entry needs printed page traceability');
assert.ok(ALGERIA_CALENDAR_ENTRIES.every(entry => entry.actionTypes.length > 0), 'each calendar entry needs at least one action type');
assert.ok(getCalendarCropKeys().length >= 35, 'calendar should expose a broad multi-crop filter set');
assert.ok(Object.keys(CALENDAR_CROP_LABELS).length >= getCalendarCropKeys().length, 'every crop key should have localized labels');
assert.ok(ALGERIA_CALENDAR_MONTHS.every(month => month.source.interpretationRule.includes('u')), 'source interpretation rules must preserve u notation');

console.log(`Algeria calendar domain passed: ${ALGERIA_CALENDAR_MONTHS.length} months, ${ALGERIA_CALENDAR_ENTRIES.length} entries, ${getCalendarCropKeys().length} crop filters.`);
