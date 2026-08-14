import assert from 'node:assert/strict';
import {
  FERTIAL_CROP_GUIDANCE,
  FERTIAL_MANUAL_SOURCE,
  getFertialCropOptions,
  getFertialGuidance,
} from '../src/lib/fertial-fertilization';

const expectedProfileCount = 39;
assert.equal(FERTIAL_CROP_GUIDANCE.length, expectedProfileCount, 'Every extracted Fertial crop profile must remain in the source module');
assert.equal(getFertialCropOptions().length, expectedProfileCount, 'The selector must expose every Fertial profile');

for (const profile of FERTIAL_CROP_GUIDANCE) {
  assert.ok(profile.id, 'Every profile has an id');
  assert.ok(profile.name && profile.nameFr && profile.nameAr, `${profile.id} has trilingual names`);
  assert.ok(profile.applications.length > 0, `${profile.id} has at least one schedule application`);
  assert.ok(profile.source.url === FERTIAL_MANUAL_SOURCE.url, `${profile.id} points to the original Fertial manual`);
  assert.ok(profile.source.pages.length > 0, `${profile.id} preserves printed source pages`);
  assert.ok(Array.isArray(profile.cautions), `${profile.id} has a normalized cautions array`);
  assert.equal(getFertialGuidance(profile.id)?.id, profile.id, `${profile.id} resolves by canonical id`);
}

assert.equal(getFertialGuidance('colza')?.id, 'rapeseed', 'French oilseed alias resolves to rapeseed');
assert.equal(getFertialGuidance('maïs fourrager')?.id, 'fodder-maize', 'French forage alias resolves to fodder maize');
assert.equal(getFertialGuidance('البطاطا')?.id, 'potato', 'Arabic potato alias resolves to potato');

console.log(`Fertial schedule coverage passed: ${expectedProfileCount} profiles, source pages, applications, cautions, and aliases verified.`);
