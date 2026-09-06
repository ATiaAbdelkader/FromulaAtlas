/**
 * Date palm density data per Algerian wilaya.
 *
 * Used by the /targeting page to identify high-priority regions for
 * WhatsApp brief marketing. Date palms (Phoenix dactylifera) are Algeria's
 * #1 Saharan crop — ~18 million trees across ~100,000 ha, concentrated in
 * the Saharan wilayas.
 *
 * Data sources:
 *   - Algerian Ministry of Agriculture (2022 statistics)
 *   - FAO date palm production reports
 *   - ITDA (Technical Institute for Date Palm Development)
 *
 * `density` is relative (1-5 scale) — 5 = highest density.
 * `estimatedTrees` is approximate (in thousands).
 * `priority` is our marketing priority (HIGH / MEDIUM / LOW).
 */

export interface DatePalmWilaya {
  code: string;        // wilaya code (01-58)
  nameEn: string;
  nameAr: string;
  nameFr: string;
  density: 1 | 2 | 3 | 4 | 5;  // 5 = highest
  estimatedTreesK: number;     // thousands of trees
  estimatedHa: number;         // hectares
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  mainVarieties: string[];
  notes?: string;
}

export const DATE_PALM_WILAYAS: DatePalmWilaya[] = [
  {
    code: '07',
    nameEn: 'Biskra',
    nameAr: 'بسكرة',
    nameFr: 'Biskra',
    density: 5,
    estimatedTreesK: 5000,
    estimatedHa: 25000,
    priority: 'HIGH',
    mainVarieties: ['Deglet Nour', 'Ghars', 'Tinissine'],
    notes: '#1 date palm region in Algeria — Zibans oasis complex',
  },
  {
    code: '30',
    nameEn: 'Ouargla',
    nameAr: 'ورقلة',
    nameFr: 'Ouargla',
    density: 5,
    estimatedTreesK: 3000,
    estimatedHa: 18000,
    priority: 'HIGH',
    mainVarieties: ['Deglet Nour', 'Tafezouine'],
    notes: 'Major oasis region — Sedrata, Rouissat, N\'Goussa',
  },
  {
    code: '39',
    nameEn: 'El Oued',
    nameAr: 'الوادي',
    nameFr: 'El Oued',
    density: 5,
    estimatedTreesK: 3500,
    estimatedHa: 20000,
    priority: 'HIGH',
    mainVarieties: ['Deglet Nour', 'Ghars'],
    notes: 'Souf region — ghout (traditional sunken gardens)',
  },
  {
    code: '47',
    nameEn: 'Ghardaïa',
    nameAr: 'غرداية',
    nameFr: 'Ghardaïa',
    density: 4,
    estimatedTreesK: 2000,
    estimatedHa: 12000,
    priority: 'HIGH',
    mainVarieties: ['Deglet Nour', 'Mech Degla'],
    notes: 'M\'Zab valley oases',
  },
  {
    code: '11',
    nameEn: 'Tamanrasset',
    nameAr: 'تمنراست',
    nameFr: 'Tamanrasset',
    density: 2,
    estimatedTreesK: 200,
    estimatedHa: 1000,
    priority: 'MEDIUM',
    mainVarieties: ['Local varieties'],
    notes: 'Remote southern oases — Djanet, In Salah',
  },
  {
    code: '01',
    nameEn: 'Adrar',
    nameAr: 'أدرار',
    nameFr: 'Adrar',
    density: 4,
    estimatedTreesK: 1500,
    estimatedHa: 9000,
    priority: 'HIGH',
    mainVarieties: ['Tinissine', 'Hamraya', 'Kentaicha'],
    notes: 'Touat + Gourara oases — traditional foggaras',
  },
  {
    code: '58',
    nameEn: 'El Bayadh',
    nameAr: 'البيض',
    nameFr: 'El Bayadh',
    density: 2,
    estimatedTreesK: 300,
    estimatedHa: 1500,
    priority: 'MEDIUM',
    mainVarieties: ['Deglet Nour'],
    notes: 'Bougtoub + Brezina oases',
  },
  {
    code: '03',
    nameEn: 'Laghouat',
    nameAr: 'الأغواط',
    nameFr: 'Laghouat',
    density: 3,
    estimatedTreesK: 800,
    estimatedHa: 4500,
    priority: 'MEDIUM',
    mainVarieties: ['Deglet Nour', 'Ghars'],
    notes: 'Aflou + Laghouat oases',
  },
  {
    code: '57',
    nameEn: 'El M\'Ghair',
    nameAr: 'المغير',
    nameFr: 'El M\'Ghair',
    density: 4,
    estimatedTreesK: 1200,
    estimatedHa: 7000,
    priority: 'HIGH',
    mainVarieties: ['Deglet Nour'],
    notes: 'New wilaya (2019) — carved from El Oued, high date palm density',
  },
  {
    code: '56',
    nameEn: 'Touggourt',
    nameAr: 'تقرت',
    nameFr: 'Touggourt',
    density: 4,
    estimatedTreesK: 1500,
    estimatedHa: 8000,
    priority: 'HIGH',
    mainVarieties: ['Deglet Nour', 'Tafezouine'],
    notes: 'New wilaya (2019) — carved from Ouargla, major date region',
  },
  {
    code: '17',
    nameEn: 'Djelfa',
    nameAr: 'الجلفة',
    nameFr: 'Djelfa',
    density: 1,
    estimatedTreesK: 100,
    estimatedHa: 500,
    priority: 'LOW',
    mainVarieties: ['Deglet Nour'],
    notes: 'Steppe region — limited date palm',
  },
  {
    code: '32',
    nameEn: 'El Bayadh (Béni Abbès)',
    nameAr: 'بني عباس',
    nameFr: 'Béni Abbès',
    density: 2,
    estimatedTreesK: 200,
    estimatedHa: 1000,
    priority: 'MEDIUM',
    mainVarieties: ['Local varieties'],
    notes: 'Saoura valley oases',
  },
];

/**
 * Total estimated date palm trees in Algeria (thousands).
 */
export const TOTAL_DATE_PALM_TREES_K = DATE_PALM_WILAYAS.reduce((s, w) => s + w.estimatedTreesK, 0);

/**
 * Total estimated date palm area in Algeria (hectares).
 */
export const TOTAL_DATE_PALM_HA = DATE_PALM_WILAYAS.reduce((s, w) => s + w.estimatedHa, 0);

/**
 * Get wilayas sorted by priority (HIGH first) then by density (5 first).
 */
export function getWilayasByPriority(): DatePalmWilaya[] {
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return [...DATE_PALM_WILAYAS].sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return b.density - a.density;
  });
}

/**
 * Density color for UI (red = highest priority).
 */
export function densityColor(density: number): string {
  switch (density) {
    case 5: return '#dc2626';  // red-600
    case 4: return '#ea580c';  // orange-600
    case 3: return '#d97706';  // amber-600
    case 2: return '#ca8a04';  // yellow-600
    case 1: return '#65a30d';  // lime-600
    default: return '#6b7280'; // gray-500
  }
}
