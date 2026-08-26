/**
 * Soil test history store — track soil test results over time,
 * detect multi-year drawdown trends, calculate Soil Health Index,
 * and estimate soil organic carbon sequestration.
 */

const KEY = 'nutriplant_soil_history_v1';

export interface SoilTestEntry {
  id: string;
  date: string; // ISO date YYYY-MM-DD
  fieldName: string;
  ph: number;
  om: number; // organic matter %
  cec: number; // meq/100g
  ca: number; // meq/100g
  mg: number; // meq/100g
  k: number; // meq/100g
  na: number; // meq/100g
  p: number; // ppm (Olsen or Bray)
  sand: number; // %
  silt: number; // %
  clay: number; // %
  ec_ds_m?: number; // Salinity dS/m
  cropGrown?: string;
  yieldAchieved?: number; // t/ha
  notes?: string;
}

export interface SoilTrend {
  param: string;
  label: string;
  label_ar: string;
  label_fr: string;
  unit: string;
  values: { date: string; value: number }[];
  direction: 'improving' | 'declining' | 'stable';
  change: number; // absolute change from first to last
  changePct: number; // % change
  current: number;
  optimal: [number, number];
  status: 'low' | 'optimal' | 'high';
  recommendation: string;
  recommendation_ar: string;
  drawdownWarning?: boolean;
}

export interface FieldHealthScore {
  fieldName: string;
  overallScore: number; // 0 - 100
  omScore: number;
  phScore: number;
  fertilityScore: number;
  structureScore: number;
  carbonStockTonPerHa: number;
  carbonDeltaTonPerHa: number;
  co2eSequesteredTonPerHa: number;
  testsCount: number;
  latestDate: string;
}

export function getSoilTests(): SoilTestEntry[] {
  if (typeof window === 'undefined') return SEED_TESTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(SEED_TESTS));
      return SEED_TESTS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_TESTS;
  }
}

export function saveSoilTest(entry: SoilTestEntry): SoilTestEntry[] {
  const all = getSoilTests();
  all.push(entry);
  all.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
  return all;
}

export function deleteSoilTest(id: string): SoilTestEntry[] {
  const all = getSoilTests().filter((e) => e.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
  return all;
}

/** Compute trends for each soil parameter across test entries. */
export function computeTrends(entries: SoilTestEntry[]): SoilTrend[] {
  if (entries.length === 0) return [];
  const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const params: {
    key: keyof SoilTestEntry;
    label: string;
    label_ar: string;
    label_fr: string;
    unit: string;
    optimal: [number, number];
  }[] = [
    { key: 'ph', label: 'Soil pH', label_ar: 'حموضة التربة (pH)', label_fr: 'pH du Sol', unit: '', optimal: [6.2, 7.3] },
    { key: 'om', label: 'Organic Matter (OM)', label_ar: 'المادة العضوية (OM)', label_fr: 'Matière Organique', unit: '%', optimal: [2.5, 4.5] },
    { key: 'p', label: 'Available Phosphorus (P)', label_ar: 'الفوسفور المتاح (P)', label_fr: 'Phosphore Assimilable', unit: 'ppm', optimal: [25, 50] },
    { key: 'k', label: 'Exchangeable Potassium (K)', label_ar: 'البوتاسيوم التبادلي (K)', label_fr: 'Potassium Échangeable', unit: 'meq/100g', optimal: [0.4, 0.9] },
    { key: 'ca', label: 'Calcium (Ca)', label_ar: 'الكالسيوم التبادلي (Ca)', label_fr: 'Calcium Échangeable', unit: 'meq/100g', optimal: [7, 16] },
    { key: 'mg', label: 'Magnesium (Mg)', label_ar: 'المغنيسيوم التبادلي (Mg)', label_fr: 'Magnésium Échangeable', unit: 'meq/100g', optimal: [1.2, 3.5] },
    { key: 'cec', label: 'Cation Exchange Capacity (CEC)', label_ar: 'السعة التبادلية الكاتيونية (CEC)', label_fr: 'Capacité d’Échange Cationique', unit: 'meq/100g', optimal: [12, 28] },
    { key: 'na', label: 'Sodium (Na)', label_ar: 'الصوديوم (Na)', label_fr: 'Sodium Échangeable', unit: 'meq/100g', optimal: [0, 0.4] },
  ];

  return params
    .map((p) => {
      const values = sorted
        .map((e) => ({ date: e.date, value: e[p.key] as number }))
        .filter((v) => v.value != null && !isNaN(v.value));
      if (values.length === 0) return null;

      const first = values[0].value;
      const last = values[values.length - 1].value;
      const change = last - first;
      const changePct = first !== 0 ? (change / Math.abs(first)) * 100 : 0;

      const [lo, hi] = p.optimal;
      let status: SoilTrend['status'] = 'optimal';
      if (last < lo) status = 'low';
      else if (last > hi) status = 'high';

      let direction: SoilTrend['direction'] = 'stable';
      if (Math.abs(changePct) > 4) {
        if (last < lo) direction = change > 0 ? 'improving' : 'declining';
        else if (last > hi) direction = change < 0 ? 'improving' : 'declining';
        else direction = 'stable';
      }

      // Detect critical nutrient drawdown (declining by >15% over multi-year records)
      const drawdownWarning = (p.key === 'p' || p.key === 'k' || p.key === 'om') && changePct < -15;

      let recEn = '';
      let recAr = '';

      if (p.key === 'ph') {
        if (last < 6.0) {
          recEn = `Apply ${(Math.ceil((6.5 - last) * 1.5 * 10) / 10)} t/ha agricultural lime to correct acidity.`;
          recAr = `أضف ${(Math.ceil((6.5 - last) * 1.5 * 10) / 10)} طن/هكتار من الجير الزراعي لرفع درجة الحموضة إلى 6.5.`;
        } else if (last > 7.8) {
          recEn = `High pH soil: Apply elemental sulfur (250-400 kg/ha) or use acidic fertigation (H3PO4/HNO3).`;
          recAr = `تربة قلوية: طبق الكبريت الزراعي (250-400 كغ/هكتار) واعتمد التسميد المحمض بالأحماض.`;
        } else {
          recEn = 'pH is in optimal agronomic range — maintain balanced fertigation.';
          recAr = 'درجة الحموضة في النطاق المثالي — حافظ على برامج التسميد المتوازنة.';
        }
      } else if (p.key === 'om') {
        if (last < 2.0) {
          recEn = 'Critical OM deficit: Apply 15-25 t/ha mature compost and plant multi-species winter cover crops.';
          recAr = 'عجز حاد في المادة العضوية: أضف 15-25 طن/هكتار كمبوست متخمر وازرع محاصيل تغطية شتوية.';
        } else {
          recEn = 'Organic matter building positively — continue residue retention and organic amendments.';
          recAr = 'المادة العضوية في تحسن مستمر — واصل تدوير المخلفات وإضافة الأسمدة العضوية.';
        }
      } else if (p.key === 'k') {
        if (last < 0.4) {
          recEn = `Nutrient Drawdown: Potassium reserve depleted. Apply ${(Math.ceil((0.6 - last) * 400))} kg K2O/ha (SOP or MOP).`;
          recAr = `استنزاف بوتاسي حاد: المخزون منخفض. أضف ${(Math.ceil((0.6 - last) * 400))} كغ K2O/هكتار من سلفات البوتاسيوم.`;
        } else {
          recEn = 'Potassium reserve adequate for target crop yields.';
          recAr = 'مخزون البوتاسيوم كافٍ ويدعم الإنتاجية المستهدفة.';
        }
      } else if (p.key === 'p') {
        if (last < 20) {
          recEn = 'Phosphorus drawdown detected. Apply 50-80 kg P2O5/ha as localized starter MAP/DAP.';
          recAr = 'استنزاف فوسفاتي مرصود: أضف 50-80 كغ P2O5/هكتار كسماد تأسيس مركز بجوار البذور (MAP/DAP).';
        } else if (last > 60) {
          recEn = 'High soil P: Skip phosphorus applications to prevent runoff and micronutrient lock-up.';
          recAr = 'فوسفور التربة مرتفع جداً: أوقف التسميد الفوسفاتي لتجنب تثبيت الزنك والحديد.';
        } else {
          recEn = 'Optimal soil P status — apply maintenance replacement rates.';
          recAr = 'مستوى الفوسفور مثالي — التزم بالتسميد الاستعواضي للصيانة.';
        }
      } else {
        recEn = `${p.label} level is ${status}. Monitor during next seasonal cycle.`;
        recAr = `مستوى ${p.label_ar} في حالة ${status === 'optimal' ? 'مثالية' : status === 'low' ? 'منخفضة' : 'مرتفعة'}.`;
      }

      return {
        param: p.key as string,
        label: p.label,
        label_ar: p.label_ar,
        label_fr: p.label_fr,
        unit: p.unit,
        values,
        direction,
        change: Math.round(change * 100) / 100,
        changePct: Math.round(changePct * 10) / 10,
        current: last,
        optimal: p.optimal,
        status,
        recommendation: recEn,
        recommendation_ar: recAr,
        drawdownWarning,
      } as SoilTrend;
    })
    .filter((t): t is SoilTrend => t !== null);
}

/** Calculate Soil Health Index (0-100) and Carbon Stock for a field */
export function computeFieldHealthScore(entries: SoilTestEntry[], fieldName: string): FieldHealthScore {
  const fieldTests = entries
    .filter((e) => e.fieldName === fieldName)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (fieldTests.length === 0) {
    return {
      fieldName,
      overallScore: 50,
      omScore: 50,
      phScore: 50,
      fertilityScore: 50,
      structureScore: 50,
      carbonStockTonPerHa: 0,
      carbonDeltaTonPerHa: 0,
      co2eSequesteredTonPerHa: 0,
      testsCount: 0,
      latestDate: '',
    };
  }

  const latest = fieldTests[fieldTests.length - 1];
  const earliest = fieldTests[0];

  // 1. OM Score (Optimal: 3.5% = 100, 1.0% = 30)
  const omScore = Math.min(100, Math.max(10, Math.round((latest.om / 3.5) * 100)));

  // 2. pH Score (Optimal 6.5-7.0 = 100, <5.5 or >8.2 penalized)
  let phScore = 100;
  if (latest.ph < 6.5) phScore = Math.max(20, Math.round(100 - (6.5 - latest.ph) * 50));
  else if (latest.ph > 7.3) phScore = Math.max(20, Math.round(100 - (latest.ph - 7.3) * 45));

  // 3. Fertility Score (P & K & Base Saturation)
  const pScore = Math.min(100, Math.max(20, (latest.p / 35) * 100));
  const kScore = Math.min(100, Math.max(20, (latest.k / 0.6) * 100));
  const fertilityScore = Math.round((pScore + kScore) / 2);

  // 4. Structure / Texture Score
  const structureScore = latest.sand + latest.clay > 0 ? 80 : 65;

  const overallScore = Math.round(omScore * 0.35 + phScore * 0.25 + fertilityScore * 0.25 + structureScore * 0.15);

  // Soil Organic Carbon (SOC) Stock Calculation (IPCC Tier 1 formula):
  // SOC Stock (t C/ha) = OM % / 1.724 (van Bemmelen factor) * Bulk Density (approx 1.35 g/cm3) * Soil Depth (0.30 m) * 100
  const socLatest = (latest.om / 1.724) * 1.35 * 30; // t C/ha in top 30cm
  const socEarliest = (earliest.om / 1.724) * 1.35 * 30;
  const carbonDelta = socLatest - socEarliest;
  const co2eSequestered = carbonDelta * 3.67; // 1 t C = 3.67 t CO2e

  return {
    fieldName,
    overallScore,
    omScore,
    phScore,
    fertilityScore,
    structureScore,
    carbonStockTonPerHa: Math.round(socLatest * 10) / 10,
    carbonDeltaTonPerHa: Math.round(carbonDelta * 10) / 10,
    co2eSequesteredTonPerHa: Math.round(co2eSequestered * 10) / 10,
    testsCount: fieldTests.length,
    latestDate: latest.date,
  };
}

export function getLatestTest(entries: SoilTestEntry[], fieldName?: string): SoilTestEntry | null {
  const filtered = fieldName && fieldName !== 'all' ? entries.filter((e) => e.fieldName === fieldName) : entries;
  if (filtered.length === 0) return null;
  return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
}

export function getFieldNames(entries: SoilTestEntry[]): string[] {
  return [...new Set(entries.map((e) => e.fieldName))].sort();
}

// 5-Year Seed Data showing continuous regeneration & parcel history
const SEED_TESTS: SoilTestEntry[] = [
  {
    id: 's1',
    date: '2021-03-15',
    fieldName: 'Pivot 1 - North Valley',
    ph: 5.8,
    om: 1.6,
    cec: 12,
    ca: 5.5,
    mg: 0.8,
    k: 0.22,
    na: 0.3,
    p: 12,
    sand: 45,
    silt: 35,
    clay: 20,
    cropGrown: 'Wheat / Maize',
    notes: 'Baseline baseline analysis. Low pH, degraded organic matter.',
  },
  {
    id: 's2',
    date: '2022-03-10',
    fieldName: 'Pivot 1 - North Valley',
    ph: 6.1,
    om: 1.9,
    cec: 13,
    ca: 6.8,
    mg: 1.0,
    k: 0.31,
    na: 0.2,
    p: 18,
    sand: 45,
    silt: 35,
    clay: 20,
    cropGrown: 'Legume Cover + Potato',
    notes: 'After 1.5 t/ha lime application + winter vetch cover crop.',
  },
  {
    id: 's3',
    date: '2023-03-12',
    fieldName: 'Pivot 1 - North Valley',
    ph: 6.4,
    om: 2.3,
    cec: 14,
    ca: 8.0,
    mg: 1.2,
    k: 0.42,
    na: 0.2,
    p: 26,
    sand: 45,
    silt: 35,
    clay: 20,
    cropGrown: 'Silage Corn',
    notes: 'Organic matter steadily improving. Biological activity active.',
  },
  {
    id: 's4',
    date: '2024-03-08',
    fieldName: 'Pivot 1 - North Valley',
    ph: 6.6,
    om: 2.7,
    cec: 15,
    ca: 9.2,
    mg: 1.4,
    k: 0.52,
    na: 0.2,
    p: 32,
    sand: 45,
    silt: 35,
    clay: 20,
    cropGrown: 'Processing Tomato',
    notes: 'All parameters in optimal zone. Water holding capacity noticeably higher.',
  },
  {
    id: 's5',
    date: '2025-03-05',
    fieldName: 'Pivot 1 - North Valley',
    ph: 6.7,
    om: 3.1,
    cec: 16,
    ca: 9.8,
    mg: 1.6,
    k: 0.61,
    na: 0.2,
    p: 36,
    sand: 45,
    silt: 35,
    clay: 20,
    cropGrown: 'Durum Wheat',
    notes: 'Top tier soil health index. Sequestered >20 t CO2e/ha since 2021.',
  },
  {
    id: 's6',
    date: '2023-04-15',
    fieldName: 'Sector B - Olive Grove',
    ph: 7.9,
    om: 1.4,
    cec: 18,
    ca: 12.0,
    mg: 0.7,
    k: 0.35,
    na: 1.1,
    p: 45,
    sand: 30,
    silt: 40,
    clay: 30,
    cropGrown: 'Olive (Chemlal)',
    notes: 'Calcareous sodic soil risk. High Na and low Mg.',
  },
  {
    id: 's7',
    date: '2025-02-20',
    fieldName: 'Sector B - Olive Grove',
    ph: 7.5,
    om: 1.8,
    cec: 19,
    ca: 13.5,
    mg: 0.9,
    k: 0.45,
    na: 0.6,
    p: 38,
    sand: 30,
    silt: 40,
    clay: 30,
    cropGrown: 'Olive (Chemlal)',
    notes: 'After phosphogypsum application and drip acid flush. Sodium displaced.',
  },
];
