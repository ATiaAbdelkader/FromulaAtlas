/**
 * Crop Rotation Planner — multi-year rotation with N credit tracking,
 * disease break calculation, and cover crop integration.
 *
 * Data sources:
 * - N fixation rates: USDA-NRCS Technical Note, FAO (2018)
 * - Disease break periods: University Extension disease management guides
 * - Cover crop N credits: SARE (Sustainable Agriculture Research & Education)
 * - Crop nutrient extraction: IPNI, Marschner (2012)
 */

export interface RotationCrop {
  id: string;
  name: string;
  emoji: string;
  type: 'cereal' | 'legume' | 'root' | 'fruit' | 'leafy' | 'industrial' | 'cover';
  nDemand: number;        // kg N/ha typical
  nCreditNext: number;    // kg N/ha left for next crop (legumes fix N)
  nCreditAfter2yr: number; // residual N credit 2 years later
  diseaseBreak: Record<string, number>; // disease → years of break needed
  diseaseHost: string[]; // diseases this crop is a host for
  soilBenefit: string;
  soilCost: string;
  rootDepth: number;      // cm — deep roots break compaction
  omContribution: number; // t/ha organic matter added per season
}

export const ROTATION_CROPS: RotationCrop[] = [
  // Cereals
  { id: 'maize', name: 'Maize', emoji: '🌽', type: 'cereal', nDemand: 200, nCreditNext: 0, nCreditAfter2yr: 0,
    diseaseBreak: { 'Fusarium': 2, 'Root_rot': 1 }, diseaseHost: ['Fusarium', 'Root_rot'],
    soilBenefit: 'Deep roots (150cm) break compaction', soilCost: 'High N demand depletes soil',
    rootDepth: 150, omContribution: 2.5 },
  { id: 'wheat', name: 'Wheat', emoji: '🌾', type: 'cereal', nDemand: 150, nCreditNext: 0, nCreditAfter2yr: 0,
    diseaseBreak: { 'Take_all': 2, 'Eyespot': 2, 'Fusarium': 2 }, diseaseHost: ['Take_all', 'Eyespot', 'Fusarium'],
    soilBenefit: 'Fibrous roots improve aggregation', soilCost: 'Moderate N demand',
    rootDepth: 100, omContribution: 2.0 },
  { id: 'rice', name: 'Rice', emoji: '🍚', type: 'cereal', nDemand: 120, nCreditNext: 0, nCreditAfter2yr: 0,
    diseaseBreak: { 'Rice_blast': 1, 'Sheath_blight': 2 }, diseaseHost: ['Rice_blast', 'Sheath_blight'],
    soilBenefit: 'Flooded conditions suppress some weeds', soilCost: 'Depletes K and Si',
    rootDepth: 60, omContribution: 1.5 },
  { id: 'barley', name: 'Barley', emoji: '🌾', type: 'cereal', nDemand: 110, nCreditNext: 0, nCreditAfter2yr: 0,
    diseaseBreak: { 'Net_blotch': 2, 'Scald': 2 }, diseaseHost: ['Net_blotch', 'Scald'],
    soilBenefit: 'Early maturity allows cover crop establishment', soilCost: 'Moderate N demand',
    rootDepth: 90, omContribution: 1.8 },

  // Legumes (N-fixing)
  { id: 'soybean', name: 'Soybean', emoji: '🫘', type: 'legume', nDemand: 50, nCreditNext: 60, nCreditAfter2yr: 20,
    diseaseBreak: { 'Soybean_cyst_nematode': 3, 'White_mold': 2 }, diseaseHost: ['Soybean_cyst_nematode', 'White_mold'],
    soilBenefit: 'Fixes 60-120 kg N/ha; deep roots (120cm)', soilCost: 'Depletes K and P',
    rootDepth: 120, omContribution: 1.5 },
  { id: 'chickpea', name: 'Chickpea', emoji: '🫘', type: 'legume', nDemand: 20, nCreditNext: 40, nCreditAfter2yr: 15,
    diseaseBreak: { 'Ascochyta': 3, 'Fusarium_wilt': 4 }, diseaseHost: ['Ascochyta', 'Fusarium_wilt'],
    soilBenefit: 'Fixes 40-80 kg N/ha; drought-tolerant', soilCost: 'Low nutrient demand',
    rootDepth: 100, omContribution: 1.2 },
  { id: 'lentil', name: 'Lentil', emoji: '🫘', type: 'legume', nDemand: 20, nCreditNext: 45, nCreditAfter2yr: 18,
    diseaseBreak: { 'Anthracnose': 3, 'Sclerotinia': 2 }, diseaseHost: ['Anthracnose', 'Sclerotinia'],
    soilBenefit: 'Fixes 45-90 kg N/ha', soilCost: 'Low nutrient demand',
    rootDepth: 80, omContribution: 1.0 },
  { id: 'pea', name: 'Pea', emoji: '🫛', type: 'legume', nDemand: 25, nCreditNext: 50, nCreditAfter2yr: 20,
    diseaseBreak: { 'Pea_root_rot': 4, 'Mycosphaerella': 2 }, diseaseHost: ['Pea_root_rot', 'Mycosphaerella'],
    soilBenefit: 'Fixes 50-100 kg N/ha; early harvest allows double crop', soilCost: 'Susceptible to root rot',
    rootDepth: 70, omContribution: 1.0 },
  { id: 'groundnut', name: 'Groundnut', emoji: '🥜', type: 'legume', nDemand: 30, nCreditNext: 55, nCreditAfter2yr: 22,
    diseaseBreak: { 'Aflatoxin_risk': 1, 'Cercospora': 2 }, diseaseHost: ['Cercospora'],
    soilBenefit: 'Fixes 55-110 kg N/ha', soilCost: 'Depletes Ca',
    rootDepth: 90, omContribution: 1.3 },

  // Root crops
  { id: 'potato', name: 'Potato', emoji: '🥔', type: 'root', nDemand: 180, nCreditNext: 0, nCreditAfter2yr: 0,
    diseaseBreak: { 'Potato_cyst_nematode': 7, 'Late_blight': 1, 'Common_scab': 3 }, diseaseHost: ['Potato_cyst_nematode', 'Common_scab'],
    soilBenefit: 'Deep tillage for hills improves aeration', soilCost: 'High N+K demand; soil structure damage',
    rootDepth: 50, omContribution: 0.8 },
  { id: 'sugarbeet', name: 'Sugar Beet', emoji: '🫛', type: 'root', nDemand: 160, nCreditNext: 0, nCreditAfter2yr: 0,
    diseaseBreak: { 'Rhizomania': 4, 'Cyst_nematode': 4 }, diseaseHost: ['Rhizomania', 'Cyst_nematode'],
    soilBenefit: 'Deep taproot (200cm) breaks compaction', soilCost: 'High K and Na demand',
    rootDepth: 200, omContribution: 1.0 },
  { id: 'carrot', name: 'Carrot', emoji: '🥕', type: 'root', nDemand: 100, nCreditNext: 0, nCreditAfter2yr: 0,
    diseaseBreak: { 'Carrot_fly': 2, 'Sclerotinia': 3 }, diseaseHost: ['Carrot_fly'],
    soilBenefit: 'Deep taproot opens soil', soilCost: 'Low OM contribution',
    rootDepth: 100, omContribution: 0.5 },

  // Industrial
  { id: 'cotton', name: 'Cotton', emoji: '🌱', type: 'industrial', nDemand: 180, nCreditNext: 0, nCreditAfter2yr: 0,
    diseaseBreak: { 'Verticillium': 4, 'Fusarium_wilt': 5, 'Nematodes': 3 }, diseaseHost: ['Verticillium', 'Fusarium_wilt'],
    soilBenefit: 'Deep taproot (180cm)', soilCost: 'Heavy N+K demand; depletes OM',
    rootDepth: 180, omContribution: 1.5 },
  { id: 'sunflower', name: 'Sunflower', emoji: '🌻', type: 'industrial', nDemand: 100, nCreditNext: 0, nCreditAfter2yr: 0,
    diseaseBreak: { 'Sclerotinia': 4, 'Phomopsis': 2 }, diseaseHost: ['Sclerotinia', 'Phomopsis'],
    soilBenefit: 'Very deep roots (200cm+) mine nutrients', soilCost: 'Depletes K deeply',
    rootDepth: 250, omContribution: 2.0 },
  { id: 'canola', name: 'Canola', emoji: '🌼', type: 'industrial', nDemand: 120, nCreditNext: 20, nCreditAfter2yr: 10,
    diseaseBreak: { 'Blackleg': 3, 'Sclerotinia': 3 }, diseaseHost: ['Blackleg', 'Sclerotinia'],
    soilBenefit: 'Biofumigation (glucosinolates suppress nematodes); N credit 20-40 kg', soilCost: 'High S demand',
    rootDepth: 120, omContribution: 1.8 },

  // Leafy
  { id: 'lettuce', name: 'Lettuce', emoji: '🥬', type: 'leafy', nDemand: 80, nCreditNext: 0, nCreditAfter2yr: 0,
    diseaseBreak: { 'Sclerotinia': 3, 'Bottom_rot': 2 }, diseaseHost: ['Sclerotinia', 'Bottom_rot'],
    soilBenefit: 'Short cycle allows 2-3 crops/year', soilCost: 'Low OM; high residue pesticide risk',
    rootDepth: 40, omContribution: 0.3 },
  { id: 'tomato', name: 'Tomato', emoji: '🍅', type: 'fruit', nDemand: 170, nCreditNext: 0, nCreditAfter2yr: 0,
    diseaseBreak: { 'Bacterial_wilt': 4, 'Root_knot_nematode': 3, 'Fusarium': 3 }, diseaseHost: ['Bacterial_wilt', 'Root_knot_nematode'],
    soilBenefit: 'High residue returns OM', soilCost: 'High N+K demand; disease-prone',
    rootDepth: 80, omContribution: 2.0 },

  // Cover crops
  { id: 'vetch', name: 'Hairy Vetch (cover)', emoji: '🌱', type: 'cover', nDemand: 0, nCreditNext: 80, nCreditAfter2yr: 30,
    diseaseBreak: {}, diseaseHost: [],
    soilBenefit: 'Fixes 80-130 kg N/ha; suppresses weeds; erosion control', soilCost: 'None',
    rootDepth: 90, omContribution: 3.0 },
  { id: 'clover', name: 'Red Clover (cover)', emoji: '🍀', type: 'cover', nDemand: 0, nCreditNext: 70, nCreditAfter2yr: 25,
    diseaseBreak: {}, diseaseHost: [],
    soilBenefit: 'Fixes 70-120 kg N/ha; attracts pollinators', soilCost: 'None',
    rootDepth: 60, omContribution: 2.5 },
  { id: 'rye', name: 'Winter Rye (cover)', emoji: '🌾', type: 'cover', nDemand: 0, nCreditNext: 15, nCreditAfter2yr: 5,
    diseaseBreak: {}, diseaseHost: [],
    soilBenefit: 'Scavenges residual N; deep roots; weed suppression (allelopathy)', soilCost: 'Can deplete spring soil moisture',
    rootDepth: 150, omContribution: 3.5 },
  { id: 'mustard', name: 'Mustard (biofumigant)', emoji: '🌼', type: 'cover', nDemand: 0, nCreditNext: 20, nCreditAfter2yr: 8,
    diseaseBreak: {}, diseaseHost: [],
    soilBenefit: 'Glucosinolates suppress nematodes + soil pathogens; fast biomass', soilCost: 'None',
    rootDepth: 80, omContribution: 2.8 },
  { id: 'oats', name: 'Oats (cover)', emoji: '🌾', type: 'cover', nDemand: 0, nCreditNext: 15, nCreditAfter2yr: 5,
    diseaseBreak: {}, diseaseHost: [],
    soilBenefit: 'Scavenges N; winterkills (no spring termination); builds OM', soilCost: 'None',
    rootDepth: 90, omContribution: 2.2 },
];

export interface RotationYear {
  year: number;
  cropId: string;
  isCoverCrop: boolean;
}

export interface RotationAnalysis {
  totalNCredit: number;          // total N credited over rotation
  totalOmAdded: number;          // total OM added (t/ha)
  diseaseWarnings: string[];
  diseaseBreaksMet: boolean;
  soilHealthScore: number;       // 0-100
  nFertilizerSaved: number;      // kg N/ha saved vs continuous cereal
  recommendations: string[];
  cashCropYears: number;
  coverCropYears: number;
  legumeYears: number;
}

/** Analyze a multi-year rotation plan. */
export function analyzeRotation(rotation: RotationYear[]): RotationAnalysis {
  let totalNCredit = 0;
  let totalOmAdded = 0;
  let legumeYears = 0;
  let coverCropYears = 0;
  let cashCropYears = 0;
  const diseaseWarnings: string[] = [];
  const recommendations: string[] = [];

  // Track N credits (1yr and 2yr residual)
  const nCreditsByYear: number[] = new Array(rotation.length).fill(0);

  for (let i = 0; i < rotation.length; i++) {
    const crop = ROTATION_CROPS.find(c => c.id === rotation[i].cropId);
    if (!crop) continue;

    totalOmAdded += crop.omContribution;

    if (crop.type === 'legume' || crop.type === 'cover') {
      legumeYears++;
      // Credit N to next year
      if (i + 1 < rotation.length) nCreditsByYear[i + 1] += crop.nCreditNext;
      if (i + 2 < rotation.length) nCreditsByYear[i + 2] += crop.nCreditAfter2yr;
      totalNCredit += crop.nCreditNext + crop.nCreditAfter2yr;
    }

    if (crop.type === 'cover') coverCropYears++;
    else cashCropYears++;

    // Check disease breaks
    for (const disease of crop.diseaseHost) {
      // Find last occurrence of a host crop for this disease
      let lastHost = -1;
      for (let j = i - 1; j >= 0; j--) {
        const prevCrop = ROTATION_CROPS.find(c => c.id === rotation[j].cropId);
        if (prevCrop?.diseaseHost.includes(disease)) {
          lastHost = j;
          break;
        }
      }
      if (lastHost >= 0) {
        const gap = i - lastHost;
        const required = crop.diseaseBreak[disease] || 1;
        if (gap < required) {
          diseaseWarnings.push(`⚠️ Year ${i + 1}: ${crop.name} planted only ${gap} year(s) after last ${disease} host. Need ${required} year break — high ${disease.replace(/_/g, ' ')} risk.`);
        }
      }
    }
  }

  // N fertilizer saved vs continuous cereal (200 kg N/ha/yr)
  const continuousN = rotation.length * 200;
  const rotationN = rotation.reduce((sum, ry) => {
    const crop = ROTATION_CROPS.find(c => c.id === ry.cropId);
    return sum + (crop?.nDemand || 0);
  }, 0) - totalNCredit;
  const nFertilizerSaved = Math.max(0, continuousN - rotationN);

  // Soil health score (0-100)
  let soilScore = 50; // baseline
  soilScore += totalOmAdded * 3;  // OM contribution
  soilScore += legumeYears * 5;   // legume years
  soilScore += coverCropYears * 4; // cover crops
  soilScore -= diseaseWarnings.length * 8; // disease risk
  // Penalize continuous cereals
  const cerealCount = rotation.filter(ry => {
    const c = ROTATION_CROPS.find(c => c.id === ry.cropId);
    return c?.type === 'cereal';
  }).length;
  if (cerealCount > rotation.length / 2) soilScore -= 10;
  soilScore = Math.max(0, Math.min(100, Math.round(soilScore)));

  // Recommendations
  if (legumeYears === 0) recommendations.push('❌ No legumes in rotation — add soybean, pea, or lentil to fix atmospheric N (saves 50-100 kg N/ha).');
  if (coverCropYears === 0) recommendations.push('❌ No cover crops — add winter rye or vetch between cash crops to prevent erosion and build OM.');
  if (diseaseWarnings.length > 0) recommendations.push(`⚠️ ${diseaseWarnings.length} disease break violation(s) detected — consider extending the rotation.`);
  if (soilScore >= 75) recommendations.push('✅ Excellent rotation diversity — soil health and disease management are well addressed.');
  else if (soilScore >= 50) recommendations.push('🟡 Moderate rotation — consider adding more legumes or cover crops.');
  else recommendations.push('🔴 Poor rotation — high disease risk and soil degradation. Restructure with legumes + cover crops.');
  if (nFertilizerSaved > 100) recommendations.push(`💰 This rotation saves ~${nFertilizerSaved} kg N/ha vs continuous cereal — worth ~$${Math.round(nFertilizerSaved * 0.8)}/ha in fertilizer.`);

  return {
    totalNCredit: Math.round(totalNCredit),
    totalOmAdded: Math.round(totalOmAdded * 10) / 10,
    diseaseWarnings,
    diseaseBreaksMet: diseaseWarnings.length === 0,
    soilHealthScore: soilScore,
    nFertilizerSaved: Math.round(nFertilizerSaved),
    recommendations,
    cashCropYears,
    coverCropYears,
    legumeYears,
  };
}

/** Suggest a rotation given a primary cash crop + number of years. */
export function suggestRotation(primaryCrop: string, years: number): RotationYear[] {
  const rotation: RotationYear[] = [];
  const primary = ROTATION_CROPS.find(c => c.id === primaryCrop);
  if (!primary) return rotation;

  // Pattern: legume → primary → cover → primary → legume → primary
  const legumeOptions = ['soybean', 'pea', 'chickpea', 'lentil'].filter(l => l !== primaryCrop);
  const coverOptions = ['vetch', 'rye', 'clover'];

  for (let y = 0; y < years; y++) {
    const phase = y % 3;
    if (phase === 0 && y > 0) {
      // Legume year (N credit for next)
      rotation.push({ year: y + 1, cropId: legumeOptions[y % legumeOptions.length], isCoverCrop: false });
    } else if (phase === 2 && y < years - 1) {
      // Cover crop year
      rotation.push({ year: y + 1, cropId: coverOptions[y % coverOptions.length], isCoverCrop: true });
    } else {
      rotation.push({ year: y + 1, cropId: primaryCrop, isCoverCrop: false });
    }
  }

  return rotation;
}
