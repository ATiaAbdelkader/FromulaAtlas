import assert from 'node:assert/strict';
import { matchDiseaseReferences } from '../src/lib/disease-reference-matcher';

const tomatoBlight = matchDiseaseReferences({
  crop: 'Tomate',
  problemType: 'disease',
  problemName: 'Early Blight (Alternaria solani)',
  symptomsObserved: ['dark brown concentric rings', 'yellowing on older leaves'],
});
assert.equal(tomatoBlight.matches[0]?.diseaseRefId, 'tom-early-blight');
assert.equal(tomatoBlight.matches[0]?.source.dataset, 'PlantVillage');
assert.ok(tomatoBlight.matches[0]?.source.url.startsWith('https://'));
assert.ok(tomatoBlight.matches[0]?.verificationQuestions.length);

const potatoLateBlight = matchDiseaseReferences({
  crop: 'Potato',
  problemType: 'disease',
  problemName: 'Late Blight',
  symptomsObserved: ['water-soaked dark lesions', 'white sporulation on leaf underside'],
});
assert.equal(potatoLateBlight.matches[0]?.diseaseRefId, 'pot-late-blight');
assert.equal(potatoLateBlight.nextPhotoTarget, 'leaf_underside');

const cropMismatch = matchDiseaseReferences({
  crop: 'Wheat',
  problemType: 'disease',
  problemName: 'Early Blight',
  symptomsObserved: ['concentric rings'],
});
assert.equal(cropMismatch.matches.length, 0);

const weedInsideCrop = matchDiseaseReferences({
  crop: 'Wheat',
  problemType: 'weed',
  problemName: 'Lantana',
  symptomsObserved: ['rough leaves', 'clusters of colorful flowers'],
});
assert.equal(weedInsideCrop.matches[0]?.diseaseRefId, 'weed-lantana');
assert.equal(weedInsideCrop.nextPhotoTarget, 'whole_plant');

const unknown = matchDiseaseReferences({ crop: 'Tomato', problemType: 'unknown', problemName: 'Unknown' });
assert.deepEqual(unknown, { matches: [] });

console.log('Disease reference matcher tests passed: crop-aware matches, source metadata, weed handling, and verification targets.');
