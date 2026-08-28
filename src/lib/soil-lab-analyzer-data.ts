// Soil Lab CSV Analyzer Engine & Formula Mapping
// Connects soil lab test data (pH, CEC, OM, P, K, Ca, Mg, Na, EC, NO3, Micros)
// to Formula Atlas canonical formulas (SH.4, 49.2, 7.10, SH.1, 4.1, 49.1, etc.)

export interface SoilLabSample {
  id: string;
  sampleId: string;
  fieldName: string;
  zone?: string;
  depthCm: number;
  ph: number;
  bufferPh?: number;
  omPercent: number; // Organic matter %
  cec: number; // meq/100g or cmol(+)/kg
  pPpm: number; // Soil test P (ppm)
  pMethod: 'olsen' | 'bray1' | 'mehlich3' | 'morgan';
  kPpm: number; // Soil test K (ppm)
  caPpm: number; // Soil test Ca (ppm)
  mgPpm: number; // Soil test Mg (ppm)
  naPpm: number; // Soil test Na (ppm)
  ecDsM: number; // Electrical conductivity (dS/m)
  no3NPpm: number; // Nitrate-N (ppm)
  so4SPpm?: number; // Sulfate-S (ppm)
  znPpm?: number; // Zinc (ppm)
  fePpm?: number; // Iron (ppm)
  mnPpm?: number; // Manganese (ppm)
  cuPpm?: number; // Copper (ppm)
  bPpm?: number; // Boron (ppm)
  freeLimePercent?: number; // CaCO3 %
  bulkDensity?: number; // g/cm³
  texture?: string;
}

export interface CationBalance {
  caMeq: number;
  mgMeq: number;
  kMeq: number;
  naMeq: number;
  effectiveCec: number;
  caSatPercent: number;
  mgSatPercent: number;
  kSatPercent: number;
  naSatPercent: number; // ESP
  caMgRatio: number;
  mgKRatio: number;
  sar: number; // Sodium Adsorption Ratio (Formula 7.10)
}

export interface SamplePrescription {
  sample: SoilLabSample;
  cationBalance: CationBalance;
  
  // Soil Health & Carbon (Formula SH.1 / CF.1)
  socStockTonnesHa: number;
  nMineralizationCreditKgHa: number;
  
  // pH & Lime/Sulfur (Formula SH.4)
  phStatus: 'strongly_acidic' | 'moderately_acidic' | 'optimal' | 'slightly_alkaline' | 'calcareous' | 'sodic';
  limeRequirementTonnesHa: number;
  elementalSulfurKgHa: number;
  
  // Salinity & Sodicity (Formula 49.2, 49.1)
  salinityClass: 'non_saline' | 'slightly_saline' | 'moderately_saline' | 'strongly_saline';
  sodicityClass: 'normal' | 'slight_sodicity' | 'sodic' | 'severe_sodic';
  gypsumRequirementTonnesHa: number; // Formula 49.2
  leachingRequirementPercent: number; // Formula 49.1
  
  // Crop Nutrient Requirements (Formula 4.1 & calibrated agronomic curves)
  nReqKgHa: number;
  p2o5ReqKgHa: number;
  k2oReqKgHa: number;
  mgoReqKgHa: number;
  sReqKgHa: number;
  znReqKgHa: number;
  bReqKgHa: number;
  feReqGramsHa: number;

  // Commercial Products Recommendation (Formula 4.1)
  fertilizerProducts: {
    productName: string;
    productName_ar: string;
    productName_fr: string;
    grade: string;
    rateKgHa: number;
    timing: string;
    timing_ar: string;
    timing_fr: string;
    purposeFormula: string;
  }[];

  // Matched Formula Atlas Codes
  appliedFormulas: {
    code: string;
    name: string;
    formula: string;
    calculationSteps: string;
  }[];

  // Automated Formula Atlas Smart Suggestions
  automatedSuggestions: AutomatedCalculatorSuggestion[];
}

export interface AutomatedCalculatorSuggestion {
  id: string;
  nutrientOrCondition: string;
  nutrientOrCondition_ar: string;
  nutrientOrCondition_fr: string;
  category: 'deficiency' | 'soil_health' | 'salinity_sodicity' | 'fertigation_blend';
  severity: 'critical' | 'warning' | 'optimal';
  detectedValue: string;
  benchmark: string;
  benchmark_ar: string;
  benchmark_fr: string;
  triggerReason: string;
  triggerReason_ar: string;
  triggerReason_fr: string;

  // Suggested Formula Atlas Tool & Calculator details
  targetToolId: string;
  targetTab: 'farm' | 'tools' | 'formulas' | 'insights';
  storageKey?: string;
  calculatorName: string;
  calculatorName_ar: string;
  calculatorName_fr: string;
  formulaAtlasCodes: string[];
  formulaNames: string[];
  formulaNames_ar: string[];
  formulaNames_fr: string[];

  // Recommended agronomic action
  actionRecommendation: string;
  actionRecommendation_ar: string;
  actionRecommendation_fr: string;

  // Bridge parameters for inter-tool pre-filling
  bridgePayload?: Record<string, number | string>;

  // Mathematical Formula Proof Summary
  formulaProofFormula: string;
  formulaProofSteps: string;
}

export interface TargetCropProfile {
  id: string;
  name: string;
  name_ar: string;
  name_fr: string;
  category: 'cereal' | 'vegetable' | 'fruit' | 'legume' | 'industrial';
  defaultYieldTonnesHa: number;
  unit: string;
  optimumPhMin: number;
  optimumPhMax: number;
  ecThresholdDsM: number;
  // Nutrient removal per tonne of yield
  nRemovalPerTonne: number; // kg N / tonne
  p2o5RemovalPerTonne: number; // kg P2O5 / tonne
  k2oRemovalPerTonne: number; // kg K2O / tonne
  // Critical soil test thresholds (ppm)
  criticalPOlsenPpm: number;
  criticalPM3Ppm: number;
  criticalKPpm: number;
  criticalMgPpm: number;
  criticalZnPpm: number;
  criticalBPpm: number;
}

export const TARGET_CROPS_DATABASE: TargetCropProfile[] = [
  {
    id: 'wheat',
    name: 'Durum / Bread Wheat',
    name_ar: 'القمح الصلب واللين',
    name_fr: 'Blé dur / tendre',
    category: 'cereal',
    defaultYieldTonnesHa: 6.0,
    unit: 't/ha',
    optimumPhMin: 6.0,
    optimumPhMax: 7.5,
    ecThresholdDsM: 6.0,
    nRemovalPerTonne: 28.0,
    p2o5RemovalPerTonne: 11.0,
    k2oRemovalPerTonne: 20.0,
    criticalPOlsenPpm: 15.0,
    criticalPM3Ppm: 25.0,
    criticalKPpm: 140.0,
    criticalMgPpm: 60.0,
    criticalZnPpm: 0.8,
    criticalBPpm: 0.5,
  },
  {
    id: 'barley',
    name: 'Barley (Malting / Feed)',
    name_ar: 'الشعير',
    name_fr: 'Orge',
    category: 'cereal',
    defaultYieldTonnesHa: 5.0,
    unit: 't/ha',
    optimumPhMin: 6.2,
    optimumPhMax: 8.0,
    ecThresholdDsM: 8.0,
    nRemovalPerTonne: 22.0,
    p2o5RemovalPerTonne: 9.0,
    k2oRemovalPerTonne: 18.0,
    criticalPOlsenPpm: 12.0,
    criticalPM3Ppm: 20.0,
    criticalKPpm: 120.0,
    criticalMgPpm: 50.0,
    criticalZnPpm: 0.7,
    criticalBPpm: 0.4,
  },
  {
    id: 'corn_maize',
    name: 'Grain Corn (Maize)',
    name_ar: 'الذرة الصفراء الحبيّة',
    name_fr: 'Maïs grain',
    category: 'cereal',
    defaultYieldTonnesHa: 10.0,
    unit: 't/ha',
    optimumPhMin: 5.8,
    optimumPhMax: 7.0,
    ecThresholdDsM: 1.7,
    nRemovalPerTonne: 22.0,
    p2o5RemovalPerTonne: 10.0,
    k2oRemovalPerTonne: 22.0,
    criticalPOlsenPpm: 18.0,
    criticalPM3Ppm: 30.0,
    criticalKPpm: 160.0,
    criticalMgPpm: 70.0,
    criticalZnPpm: 1.0,
    criticalBPpm: 0.6,
  },
  {
    id: 'tomato',
    name: 'Processing & Fresh Tomato',
    name_ar: 'الطماطم الصناعية والطازجة',
    name_fr: 'Tomate industrielle & fraîche',
    category: 'vegetable',
    defaultYieldTonnesHa: 80.0,
    unit: 't/ha',
    optimumPhMin: 6.0,
    optimumPhMax: 7.0,
    ecThresholdDsM: 2.5,
    nRemovalPerTonne: 2.8,
    p2o5RemovalPerTonne: 0.9,
    k2oRemovalPerTonne: 4.8,
    criticalPOlsenPpm: 25.0,
    criticalPM3Ppm: 45.0,
    criticalKPpm: 200.0,
    criticalMgPpm: 100.0,
    criticalZnPpm: 1.2,
    criticalBPpm: 0.8,
  },
  {
    id: 'potato',
    name: 'Potato (Tubers)',
    name_ar: 'البطاطا',
    name_fr: 'Pomme de terre',
    category: 'vegetable',
    defaultYieldTonnesHa: 40.0,
    unit: 't/ha',
    optimumPhMin: 5.2,
    optimumPhMax: 6.5,
    ecThresholdDsM: 1.7,
    nRemovalPerTonne: 4.5,
    p2o5RemovalPerTonne: 1.6,
    k2oRemovalPerTonne: 7.2,
    criticalPOlsenPpm: 30.0,
    criticalPM3Ppm: 50.0,
    criticalKPpm: 220.0,
    criticalMgPpm: 80.0,
    criticalZnPpm: 1.1,
    criticalBPpm: 0.6,
  },
  {
    id: 'olive',
    name: 'Olive Orchard (Oil & Table)',
    name_ar: 'الزيتون (زيت ومائدة)',
    name_fr: 'Olivier (huile & table)',
    category: 'fruit',
    defaultYieldTonnesHa: 8.0,
    unit: 't/ha',
    optimumPhMin: 6.5,
    optimumPhMax: 8.4,
    ecThresholdDsM: 4.0,
    nRemovalPerTonne: 15.0,
    p2o5RemovalPerTonne: 3.5,
    k2oRemovalPerTonne: 18.0,
    criticalPOlsenPpm: 14.0,
    criticalPM3Ppm: 22.0,
    criticalKPpm: 150.0,
    criticalMgPpm: 70.0,
    criticalZnPpm: 0.9,
    criticalBPpm: 1.0,
  },
  {
    id: 'citrus',
    name: 'Citrus (Orange & Clementine)',
    name_ar: 'الحمضيات (برتقال ويوسفي)',
    name_fr: 'Agrumes (orange & clémentine)',
    category: 'fruit',
    defaultYieldTonnesHa: 35.0,
    unit: 't/ha',
    optimumPhMin: 6.0,
    optimumPhMax: 7.2,
    ecThresholdDsM: 1.7,
    nRemovalPerTonne: 4.0,
    p2o5RemovalPerTonne: 1.1,
    k2oRemovalPerTonne: 5.2,
    criticalPOlsenPpm: 20.0,
    criticalPM3Ppm: 35.0,
    criticalKPpm: 180.0,
    criticalMgPpm: 90.0,
    criticalZnPpm: 1.5,
    criticalBPpm: 0.7,
  },
  {
    id: 'date_palm',
    name: 'Date Palm (Deglet Nour)',
    name_ar: 'نخيل التمر (دقلة نور)',
    name_fr: 'Palmier Dattier (Deglet Nour)',
    category: 'fruit',
    defaultYieldTonnesHa: 10.0,
    unit: 't/ha',
    optimumPhMin: 6.8,
    optimumPhMax: 8.5,
    ecThresholdDsM: 4.0,
    nRemovalPerTonne: 18.0,
    p2o5RemovalPerTonne: 4.5,
    k2oRemovalPerTonne: 24.0,
    criticalPOlsenPpm: 15.0,
    criticalPM3Ppm: 25.0,
    criticalKPpm: 160.0,
    criticalMgPpm: 80.0,
    criticalZnPpm: 1.0,
    criticalBPpm: 1.2,
  },
  {
    id: 'alfalfa',
    name: 'Alfalfa (Lucerne Hay)',
    name_ar: 'البرسيم الحجازي (الفصة)',
    name_fr: 'Luzerne (foin)',
    category: 'legume',
    defaultYieldTonnesHa: 14.0,
    unit: 't/ha',
    optimumPhMin: 6.5,
    optimumPhMax: 7.5,
    ecThresholdDsM: 2.0,
    nRemovalPerTonne: 0.0, // Fixed by Rhizobium (Formula 50.1)
    p2o5RemovalPerTonne: 6.5,
    k2oRemovalPerTonne: 28.0,
    criticalPOlsenPpm: 22.0,
    criticalPM3Ppm: 38.0,
    criticalKPpm: 220.0,
    criticalMgPpm: 100.0,
    criticalZnPpm: 0.9,
    criticalBPpm: 1.2,
  },
  {
    id: 'onion',
    name: 'Dry Bulb Onion',
    name_ar: 'البصل الجاف',
    name_fr: 'Oignon sec',
    category: 'vegetable',
    defaultYieldTonnesHa: 45.0,
    unit: 't/ha',
    optimumPhMin: 6.0,
    optimumPhMax: 7.2,
    ecThresholdDsM: 1.2,
    nRemovalPerTonne: 3.2,
    p2o5RemovalPerTonne: 1.4,
    k2oRemovalPerTonne: 3.6,
    criticalPOlsenPpm: 28.0,
    criticalPM3Ppm: 45.0,
    criticalKPpm: 180.0,
    criticalMgPpm: 75.0,
    criticalZnPpm: 1.3,
    criticalBPpm: 0.7,
  },
];

// SAMPLE LAB CSV DATASETS
export const SAMPLE_LAB_CSVS: { name: string; description: string; csv: string }[] = [
  {
    name: 'Midwest Agricultural Testing Lab (Multi-Field)',
    description: 'Standard 5-field soil analysis report with CEC, base saturation cations, Bray P, K, OM, and micronutrients.',
    csv: `Sample ID,Field,Zone,Depth_cm,pH,Buffer_pH,OM_pct,CEC_meq,P_Bray1_ppm,K_ppm,Ca_ppm,Mg_ppm,Na_ppm,ECe_dSm,NO3_N_ppm,Zn_ppm,B_ppm
S-101,North Valley,Zone-A,20,6.2,6.7,2.8,16.5,14,135,2100,240,45,0.8,18,0.7,0.4
S-102,North Valley,Zone-B,20,5.4,6.2,2.1,14.0,9,95,1450,160,35,0.6,12,0.5,0.3
S-103,South Ridge,Piv-1,20,6.8,6.9,3.4,22.0,26,210,3400,420,55,1.1,24,1.4,0.7
S-104,West Bottoms,Saline-Swale,20,8.4,,1.8,28.5,11,180,4800,850,780,4.6,15,0.6,1.4
S-105,East Prairie,Block-4,20,7.1,7.0,2.9,18.2,32,175,2600,310,40,0.9,20,1.1,0.6`,
  },
  {
    name: 'Mediterranean Calcareous & Arid Soil Lab (Olsen P)',
    description: 'North African / Mediterranean alkaline soil lab testing active lime CaCO3, Olsen P, salinity, and high Ca saturation.',
    csv: `ID,Field_Name,Soil_pH,Active_CaCO3_pct,OM_pct,CEC_cmol,P_Olsen_ppm,K_avail_ppm,Ca_ppm,Mg_ppm,Na_ppm,EC_1to5_dSm,N_NO3_ppm,Fe_DTPA_ppm,Zn_DTPA_ppm
MED-01,Mitidja Plot 1,7.8,14.5,1.9,24.0,9.5,145,4600,340,65,1.2,14.0,3.2,0.6
MED-02,Mitidja Plot 2,7.9,18.2,1.4,21.5,6.2,110,4300,290,50,0.9,10.5,2.4,0.4
MED-03,Biskra Oasis North,8.3,24.0,0.8,18.0,4.8,190,5200,610,340,3.8,16.0,1.8,0.5
MED-04,Biskra Oasis South,8.6,28.5,0.6,19.5,3.5,210,5100,720,590,5.4,12.0,1.5,0.4
MED-05,Mascara Vineyards,7.4,8.0,2.6,26.0,18.0,230,4100,410,45,0.7,22.0,5.8,1.2`,
  },
  {
    name: 'Comprehensive Soil Health & Micronutrient Audit (Mehlich-3)',
    description: 'Complete soil fertility suite with Mehlich-3 extraction, sulfur, zinc, copper, manganese, and boron.',
    csv: `Sample_Name,Field,Depth,pH,OM_pct,CEC,P_M3_ppm,K_ppm,Ca_ppm,Mg_ppm,Na_ppm,ECe,NO3_ppm,SO4_S_ppm,Zn_ppm,Mn_ppm,Cu_ppm,B_ppm
LAB-201,Orchard Alpha,15,6.5,3.2,19.0,38,195,2750,320,30,0.7,22,14,1.6,18,0.8,0.9
LAB-202,Orchard Beta,15,5.8,2.4,15.5,18,125,1800,210,25,0.5,14,9,0.7,12,0.5,0.4
LAB-203,Vegetable Tunnel 1,20,6.9,4.5,24.0,65,310,3600,450,60,1.8,42,28,2.4,24,1.2,1.3
LAB-204,Vegetable Tunnel 2,20,7.3,3.8,22.5,42,260,3400,390,75,1.4,31,21,1.9,20,1.0,1.0`,
  },
];

// COLUMN DETECTION PATTERNS
export const COLUMN_ALIAS_MAP: Record<keyof SoilLabSample, RegExp> = {
  id: /^(id|sample_?id|sample_?num|lab_?no|num)/i,
  sampleId: /^(sample_?id|sample_?code|sample_?name|sample|id|no)/i,
  fieldName: /^(field_?name|field|plot|zone|parcelle|champ|location)/i,
  zone: /^(zone|sub_?plot|block|secteur|pivot)/i,
  depthCm: /^(depth_?cm|depth|profondeur|horizon)/i,
  ph: /^(ph|soil_?ph|ph_?water|ph_?h2o|ph_?1:1|ph_?1:2.5|ph_?sol)/i,
  bufferPh: /^(buffer_?ph|b_?ph|smp_?ph|smp|adams_?evans|woodruff|ph_?tampon)/i,
  omPercent: /^(om_?pct|om%?|om|organic_?matter|som%?|matiere_?organique|mo%?)/i,
  cec: /^(cec_?meq|cec|ecec|cec_?cmol|capacite_?echange|cat_?exch)/i,
  pPpm: /^(p_?ppm|p_?bray1?_?ppm|p_?olsen_?ppm|p_?m3_?ppm|phosphor|phosphore|p_?avail|p2o5)/i,
  pMethod: /^(p_?method|extraction|methode_?p)/i,
  kPpm: /^(k_?ppm|k_?avail|potassium|k_?m3|k_?exchangeable|k2o)/i,
  caPpm: /^(ca_?ppm|calcium|ca_?avail|ca_?exchangeable)/i,
  mgPpm: /^(mg_?ppm|magnesium|mg_?avail|mg_?exchangeable)/i,
  naPpm: /^(na_?ppm|sodium|na_?avail|na_?exchangeable)/i,
  ecDsM: /^(ece_?dsm|ece|ec_?dsm|ec_?1to5|ec|salinity|conductivite|ce)/i,
  no3NPpm: /^(no3_?n_?ppm|no3_?ppm|n_?no3_?ppm|nitrate|n_?nitrique|no3)/i,
  so4SPpm: /^(so4_?s_?ppm|so4_?ppm|s_?ppm|sulfate|soufre|s_?avail)/i,
  znPpm: /^(zn_?ppm|zn_?dtpa|zinc|zn)/i,
  fePpm: /^(fe_?ppm|fe_?dtpa|iron|fer|fe)/i,
  mnPpm: /^(mn_?ppm|mn_?dtpa|manganese|mn)/i,
  cuPpm: /^(cu_?ppm|cu_?dtpa|copper|cuivre|cu)/i,
  bPpm: /^(b_?ppm|b_?hot_?water|boron|bore|b)/i,
  freeLimePercent: /^(active_?caco3_?pct|caco3%?|free_?lime|calcaire_?actif|calcaire_?total|caco3)/i,
  bulkDensity: /^(bulk_?density|bd|densite_?apparente|da)/i,
  texture: /^(texture|soil_?texture|soil_?type|classe_?texturale)/i,
};

// CSV PARSING & CLEANING HELPER
export function parseSoilLabCsv(csvText: string): {
  headers: string[];
  rawRows: Record<string, string>[];
  detectedColumnMap: Partial<Record<keyof SoilLabSample, string>>;
} {
  const lines = csvText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { headers: [], rawRows: [], detectedColumnMap: {} };
  }

  // Detect delimiter (comma, semicolon, or tab)
  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';') && (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) delimiter = ';';

  // Split line with quote handling
  const splitLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(cur.trim().replace(/^"|"$/g, ''));
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const headers = splitLine(lines[0]);
  const rawRows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i]);
    if (values.length < 2) continue;
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] !== undefined ? values[idx] : '';
    });
    rawRows.push(rowObj);
  }

  // Auto-detect columns
  const detectedColumnMap: Partial<Record<keyof SoilLabSample, string>> = {};
  const keys = Object.keys(COLUMN_ALIAS_MAP) as (keyof SoilLabSample)[];

  keys.forEach((key) => {
    const regex = COLUMN_ALIAS_MAP[key];
    const match = headers.find((h) => regex.test(h.trim()));
    if (match) {
      detectedColumnMap[key] = match;
    }
  });

  return { headers, rawRows, detectedColumnMap };
}

// Convert Raw Rows + Column Mapping to Structured Soil Samples
export function convertToSoilSamples(
  rawRows: Record<string, string>[],
  columnMap: Partial<Record<keyof SoilLabSample, string>>,
  defaultPMethod: 'olsen' | 'bray1' | 'mehlich3' = 'olsen'
): SoilLabSample[] {
  return rawRows.map((row, idx) => {
    const getNum = (key: keyof SoilLabSample, fallback = 0): number => {
      const colName = columnMap[key];
      if (!colName || row[colName] === undefined || row[colName] === '') return fallback;
      const parsed = parseFloat(row[colName].replace(/[^\d.-]/g, ''));
      return isNaN(parsed) ? fallback : parsed;
    };

    const getStr = (key: keyof SoilLabSample, fallback = ''): string => {
      const colName = columnMap[key];
      if (!colName || row[colName] === undefined) return fallback;
      return String(row[colName]).trim();
    };

    // Determine P extraction method from header name if possible
    let pMethod = defaultPMethod;
    const pCol = columnMap.pPpm || '';
    if (/olsen/i.test(pCol)) pMethod = 'olsen';
    else if (/bray/i.test(pCol)) pMethod = 'bray1';
    else if (/m3|mehlich/i.test(pCol)) pMethod = 'mehlich3';

    const sampleId = getStr('sampleId', `SMP-${idx + 1}`);
    const fieldName = getStr('fieldName', `Field ${String.fromCharCode(65 + (idx % 26))}`);

    return {
      id: `sample-${idx + 1}-${Date.now()}`,
      sampleId,
      fieldName,
      zone: getStr('zone', undefined),
      depthCm: getNum('depthCm', 20),
      ph: getNum('ph', 7.0),
      bufferPh: getNum('bufferPh', undefined) || undefined,
      omPercent: getNum('omPercent', 2.0),
      cec: getNum('cec', 18.0),
      pPpm: getNum('pPpm', 15.0),
      pMethod,
      kPpm: getNum('kPpm', 150.0),
      caPpm: getNum('caPpm', 2400.0),
      mgPpm: getNum('mgPpm', 300.0),
      naPpm: getNum('naPpm', 40.0),
      ecDsM: getNum('ecDsM', 1.0),
      no3NPpm: getNum('no3NPpm', 15.0),
      so4SPpm: getNum('so4SPpm', undefined) || undefined,
      znPpm: getNum('znPpm', undefined) || undefined,
      fePpm: getNum('fePpm', undefined) || undefined,
      mnPpm: getNum('mnPpm', undefined) || undefined,
      cuPpm: getNum('cuPpm', undefined) || undefined,
      bPpm: getNum('bPpm', undefined) || undefined,
      freeLimePercent: getNum('freeLimePercent', undefined) || undefined,
      bulkDensity: getNum('bulkDensity', 1.35),
      texture: getStr('texture', 'Loam'),
    };
  });
}

// CATION BALANCE & BASE SATURATION ENGINE (FORMULA 7.10 & MEQ CALCULATIONS)
export function computeCationBalance(sample: SoilLabSample): CationBalance {
  // Equivalent weights (mg/meq):
  // Ca²⁺ = 40.08 / 2 = 20.04 mg/meq -> 1 meq/100g = 200.4 ppm
  // Mg²⁺ = 24.31 / 2 = 12.15 mg/meq -> 1 meq/100g = 121.5 ppm
  // K⁺   = 39.10 / 1 = 39.10 mg/meq -> 1 meq/100g = 391.0 ppm
  // Na⁺  = 23.00 / 1 = 23.00 mg/meq -> 1 meq/100g = 230.0 ppm

  const caMeq = sample.caPpm > 0 ? sample.caPpm / 200.4 : 0;
  const mgMeq = sample.mgPpm > 0 ? sample.mgPpm / 121.5 : 0;
  const kMeq = sample.kPpm > 0 ? sample.kPpm / 391.0 : 0;
  const naMeq = sample.naPpm > 0 ? sample.naPpm / 230.0 : 0;

  const sumCations = caMeq + mgMeq + kMeq + naMeq;
  // Effective CEC is either measured CEC or sum of bases if sum > measured
  const effectiveCec = Math.max(sample.cec || 1, sumCations);

  const caSatPercent = (caMeq / effectiveCec) * 100;
  const mgSatPercent = (mgMeq / effectiveCec) * 100;
  const kSatPercent = (kMeq / effectiveCec) * 100;
  const naSatPercent = (naMeq / effectiveCec) * 100; // Exchangeable Sodium Percentage (ESP)

  const caMgRatio = mgMeq > 0 ? caMeq / mgMeq : 0;
  const mgKRatio = kMeq > 0 ? mgMeq / kMeq : 0;

  // Formula 7.10: SAR = [Na⁺] / √(([Ca²⁺]+[Mg²⁺])/2) (in meq/L or mmol/L)
  const divisor = Math.sqrt((caMeq + mgMeq) / 2);
  const sar = divisor > 0 ? naMeq / divisor : 0;

  return {
    caMeq: Number(caMeq.toFixed(2)),
    mgMeq: Number(mgMeq.toFixed(2)),
    kMeq: Number(kMeq.toFixed(2)),
    naMeq: Number(naMeq.toFixed(2)),
    effectiveCec: Number(effectiveCec.toFixed(2)),
    caSatPercent: Number(caSatPercent.toFixed(1)),
    mgSatPercent: Number(mgSatPercent.toFixed(1)),
    kSatPercent: Number(kSatPercent.toFixed(1)),
    naSatPercent: Number(naSatPercent.toFixed(1)),
    caMgRatio: Number(caMgRatio.toFixed(2)),
    mgKRatio: Number(mgKRatio.toFixed(2)),
    sar: Number(sar.toFixed(2)),
  };
}

// MAIN PRESCRIPTION ENGINE CONNECTING SOIL LAB DATA TO FORMULA ATLAS
export function generateSamplePrescription(
  sample: SoilLabSample,
  crop: TargetCropProfile,
  targetYieldTonnesHa: number
): SamplePrescription {
  const cationBalance = computeCationBalance(sample);
  const bd = sample.bulkDensity || 1.35;
  const depth = sample.depthCm || 20;

  const appliedFormulas: SamplePrescription['appliedFormulas'] = [];

  // 1. SOIL HEALTH & ORGANIC CARBON STOCK (FORMULA SH.1 / CF.1)
  // SOC_stock (t C/ha) = SOC% × BD × Depth (cm) × 100 (where SOC% ≈ OM% / 1.724)
  const socPercent = sample.omPercent / 1.724;
  const socStockTonnesHa = Number((socPercent * bd * depth).toFixed(1));
  // Annual N mineralization credit: ~15 to 25 kg N/ha per 1% OM in top 20cm
  const nMineralizationCreditKgHa = Math.round(sample.omPercent * 20.0);

  appliedFormulas.push({
    code: 'SH.1',
    name: 'Soil Organic Carbon Stock & N Mineralization Credit',
    formula: 'SOC_stock (t/ha) = (OM% / 1.724) × BD × Depth_cm ; N_credit = OM% × 20 kg N/ha',
    calculationSteps: `SOC = (${sample.omPercent}% / 1.724) × ${bd} g/cm³ × ${depth} cm = ${socStockTonnesHa} t C/ha. N mineralization credit = ${sample.omPercent}% × 20 = ${nMineralizationCreditKgHa} kg N/ha.`,
  });

  // 2. SOIL pH CLASSIFICATION & LIME / SULFUR REQUIREMENT (FORMULA SH.4)
  let phStatus: SamplePrescription['phStatus'] = 'optimal';
  let limeRequirementTonnesHa = 0;
  let elementalSulfurKgHa = 0;

  if (sample.ph < 5.2) phStatus = 'strongly_acidic';
  else if (sample.ph < 6.0) phStatus = 'moderately_acidic';
  else if (sample.ph <= 7.2) phStatus = 'optimal';
  else if (sample.ph <= 7.8) phStatus = 'slightly_alkaline';
  else if (sample.ph <= 8.4) phStatus = 'calcareous';
  else phStatus = 'sodic';

  if (sample.ph < crop.optimumPhMin) {
    const targetPh = crop.optimumPhMin;
    const deltaPh = targetPh - sample.ph;
    // Formula SH.4: Lime = (pH_target - pH_current) × CEC × BD × (Depth/20) × 0.5 (CCE 100%)
    limeRequirementTonnesHa = Number(((deltaPh * sample.cec * bd * (depth / 20) * 0.45)).toFixed(2));
    appliedFormulas.push({
      code: 'SH.4',
      name: 'Soil pH Adjustment (Lime Requirement)',
      formula: 'Lime (t/ha) = (pH_target − pH_current) × CEC × BD × (Depth/20) × 0.45',
      calculationSteps: `Lime = (${targetPh} − ${sample.ph}) × ${sample.cec} × ${bd} × (${depth}/20) × 0.45 = ${limeRequirementTonnesHa} t CaCO₃/ha.`,
    });
  } else if (sample.ph > 7.5) {
    // Soil acidification using Elemental Sulfur (S⁰)
    const deltaPh = sample.ph - 7.0;
    const bufferFactor = sample.cec > 20 ? 400 : 250;
    elementalSulfurKgHa = Math.round(deltaPh * bufferFactor);
    appliedFormulas.push({
      code: 'S.ACID',
      name: 'Elemental Sulfur Acidification Requirement',
      formula: 'Sulfur S⁰ (kg/ha) = (pH_current − 7.0) × CEC_Buffer_Factor',
      calculationSteps: `S⁰ = (${sample.ph} − 7.0) × ${bufferFactor} = ${elementalSulfurKgHa} kg S⁰/ha (broadcast & incorporated).`,
    });
  }

  // 3. SALINITY & SODICITY (FORMULA 49.2 & 49.1)
  let salinityClass: SamplePrescription['salinityClass'] = 'non_saline';
  if (sample.ecDsM >= 8.0) salinityClass = 'strongly_saline';
  else if (sample.ecDsM >= 4.0) salinityClass = 'moderately_saline';
  else if (sample.ecDsM >= 2.0) salinityClass = 'slightly_saline';

  let sodicityClass: SamplePrescription['sodicityClass'] = 'normal';
  if (cationBalance.naSatPercent >= 15 || cationBalance.sar >= 13) sodicityClass = 'severe_sodic';
  else if (cationBalance.naSatPercent >= 10 || cationBalance.sar >= 8) sodicityClass = 'sodic';
  else if (cationBalance.naSatPercent >= 6) sodicityClass = 'slight_sodicity';

  // Formula 49.2: Gypsum Requirement (GR)
  // GR (t/ha) = (ESP_initial − ESP_target) × CEC × BD × depth / (100 × 1.72)
  let gypsumRequirementTonnesHa = 0;
  if (cationBalance.naSatPercent > 5) {
    const targetEsp = 5.0;
    const deltaEsp = cationBalance.naSatPercent - targetEsp;
    gypsumRequirementTonnesHa = Number(((deltaEsp * sample.cec * bd * depth) / (100 * 1.72)).toFixed(2));
    appliedFormulas.push({
      code: '49.2',
      name: 'Gypsum Requirement for Sodic Reclamation (GR)',
      formula: 'GR (t/ha) = (ESP_initial − ESP_target) × CEC × BD × depth / 172',
      calculationSteps: `GR = (${cationBalance.naSatPercent}% − 5.0%) × ${sample.cec} × ${bd} × ${depth} / 172 = ${gypsumRequirementTonnesHa} t Gypsum (CaSO₄·2H₂O)/ha.`,
    });
  }

  // Formula 49.1: Leaching Requirement (LR)
  // LR = ECiw / (5 × ECe_threshold − ECiw) (assuming good water ECiw = 1.0 dS/m)
  const ecThreshold = crop.ecThresholdDsM;
  const ecIw = 1.0;
  const lrFraction = sample.ecDsM > ecThreshold ? ecIw / (5 * ecThreshold - ecIw) : 0.05;
  const leachingRequirementPercent = Math.min(40, Math.round(lrFraction * 100));
  appliedFormulas.push({
    code: '49.1',
    name: 'Leaching Requirement for Salinity Control (LR)',
    formula: 'LR (%) = [EC_water / (5 × ECe_threshold − EC_water)] × 100',
    calculationSteps: `LR = [1.0 / (5 × ${ecThreshold} − 1.0)] × 100 = ${leachingRequirementPercent}% extra irrigation fraction.`,
  });

  // 4. NITROGEN REQUIREMENT
  // N_req = (Target Yield × N Removal) - Soil NO3-N credit (ppm × 4 kg/ha in 20cm) - OM credit
  const nCropDemand = crop.nRemovalPerTonne * targetYieldTonnesHa;
  const soilNo3CreditKgHa = Math.round(sample.no3NPpm * bd * (depth / 10) * 0.4); // approx 2-4 kg N/ha per ppm NO3
  let nReqKgHa = Math.max(0, Math.round(nCropDemand - soilNo3CreditKgHa - nMineralizationCreditKgHa));
  if (crop.category === 'legume') {
    nReqKgHa = Math.min(30, Math.round(nReqKgHa * 0.15)); // Starter N only for legumes (Rhizobium fixation)
  }

  // 5. PHOSPHORUS REQUIREMENT (P2O5)
  // Normalized soil P (Olsen basis)
  let pOlsenEquivalent = sample.pPpm;
  if (sample.pMethod === 'bray1') pOlsenEquivalent = sample.pPpm / 1.5;
  else if (sample.pMethod === 'mehlich3') pOlsenEquivalent = sample.pPpm / 1.8;

  const cropP2o5Removal = crop.p2o5RemovalPerTonne * targetYieldTonnesHa;
  let p2o5ReqKgHa = 0;
  if (pOlsenEquivalent < crop.criticalPOlsenPpm) {
    const pDeficit = crop.criticalPOlsenPpm - pOlsenEquivalent;
    const buildupFactor = sample.ph > 7.8 ? 5.0 : 3.5; // Calcareous soil needs more P for buildup due to Ca-phosphate fixation
    p2o5ReqKgHa = Math.round(cropP2o5Removal + pDeficit * buildupFactor);
  } else if (pOlsenEquivalent <= crop.criticalPOlsenPpm * 1.5) {
    p2o5ReqKgHa = Math.round(cropP2o5Removal * 0.8); // Maintenance rate
  } else {
    p2o5ReqKgHa = 0; // High soil P, drawdown strategy
  }

  // 6. POTASSIUM REQUIREMENT (K2O)
  const cropK2oRemoval = crop.k2oRemovalPerTonne * targetYieldTonnesHa;
  let k2oReqKgHa = 0;
  if (sample.kPpm < crop.criticalKPpm) {
    const kDeficit = crop.criticalKPpm - sample.kPpm;
    k2oReqKgHa = Math.round(cropK2oRemoval + kDeficit * 0.8);
  } else if (sample.kPpm <= crop.criticalKPpm * 1.4) {
    k2oReqKgHa = Math.round(cropK2oRemoval * 0.7);
  } else {
    k2oReqKgHa = 0;
  }

  // 7. SECONDARY & MICRONUTRIENTS
  const mgoReqKgHa = sample.mgPpm < crop.criticalMgPpm ? Math.round((crop.criticalMgPpm - sample.mgPpm) * 0.6) : 0;
  const sReqKgHa = sample.so4SPpm !== undefined && sample.so4SPpm < 12 ? 25 : 15;
  const znReqKgHa = sample.znPpm !== undefined && sample.znPpm < crop.criticalZnPpm ? 5.0 : 0;
  const bReqKgHa = sample.bPpm !== undefined && sample.bPpm < crop.criticalBPpm ? 1.5 : 0;
  const feReqGramsHa = sample.ph > 7.5 && sample.fePpm !== undefined && sample.fePpm < 4.5 ? 5000 : 0;

  // 8. COMMERCIAL FERTILIZER BLEND MAPPING (FORMULA 4.1)
  // Fertilizer (kg/ha) = 100 × Nutrient Rate (kg/ha) / Grade%
  const fertilizerProducts: SamplePrescription['fertilizerProducts'] = [];

  // P Fertilizer (DAP or MAP or TSP)
  let pProductKgHa = 0;
  if (p2o5ReqKgHa > 0) {
    if (sample.ph > 7.2) {
      // MAP (12-61-0 or 12-52-0) is acidic, ideal for alkaline soil
      pProductKgHa = Math.round((p2o5ReqKgHa * 100) / 52);
      fertilizerProducts.push({
        productName: 'Monoammonium Phosphate (MAP 12-52-0)',
        productName_ar: 'فوسفات أحادي الأمونيوم (MAP 12-52-0)',
        productName_fr: 'Phosphate monoammonique (MAP 12-52-0)',
        grade: '12% N, 52% P₂O₅',
        rateKgHa: pProductKgHa,
        timing: 'Basal / Pre-planting incorporation or fertigation',
        timing_ar: 'خلط أساسي قبل الزراعة أو عبر شبكة الري',
        timing_fr: 'Incorporation de fond avant semis ou fertigation',
        purposeFormula: 'Formula 4.1: P₂O₅ supply with acidifying rhizosphere effect',
      });
      // Deduct N supplied by MAP (12%)
      const nFromMap = Math.round((pProductKgHa * 12) / 100);
      nReqKgHa = Math.max(0, nReqKgHa - nFromMap);
    } else {
      // DAP (18-46-0)
      pProductKgHa = Math.round((p2o5ReqKgHa * 100) / 46);
      fertilizerProducts.push({
        productName: 'Diammonium Phosphate (DAP 18-46-0)',
        productName_ar: 'فوسفات ثنائي الأمونيوم (DAP 18-46-0)',
        productName_fr: 'Phosphate diammonique (DAP 18-46-0)',
        grade: '18% N, 46% P₂O₅',
        rateKgHa: pProductKgHa,
        timing: 'Basal incorporation at 10-15 cm depth',
        timing_ar: 'خلط أساسي بالتربة على عمق 10-15 سم',
        timing_fr: 'Incorporation de fond à 10-15 cm',
        purposeFormula: 'Formula 4.1: High P₂O₅ basal starter',
      });
      const nFromDap = Math.round((pProductKgHa * 18) / 100);
      nReqKgHa = Math.max(0, nReqKgHa - nFromDap);
    }
  }

  // K Fertilizer (SOP or MOP)
  if (k2oReqKgHa > 0) {
    if (sample.ecDsM > 1.5 || sample.ph > 7.5 || crop.id === 'potato' || crop.id === 'tomato' || crop.id === 'citrus') {
      // Potassium Sulfate (SOP 0-0-50 + 18% S) - low salt index, chlorine-free
      const sopKgHa = Math.round((k2oReqKgHa * 100) / 50);
      fertilizerProducts.push({
        productName: 'Potassium Sulfate (SOP 0-0-50 + 18% S)',
        productName_ar: 'سلفات البوتاسيوم (SOP 0-0-50 + 18% S)',
        productName_fr: 'Sulfate de potassium (SOP 0-0-50 + 18% S)',
        grade: '50% K₂O, 18% S',
        rateKgHa: sopKgHa,
        timing: 'Split: 40% basal, 60% top-dressing / bulking',
        timing_ar: 'مقسم: 40% عند الخدمة الأساسية، 60% خلال التحجيم',
        timing_fr: 'Fractionné : 40% fond, 60% grossissement',
        purposeFormula: 'Formula 4.1: Sulfur-rich, chloride-safe potassium',
      });
    } else {
      // Potassium Chloride (MOP 0-0-60)
      const mopKgHa = Math.round((k2oReqKgHa * 100) / 60);
      fertilizerProducts.push({
        productName: 'Potassium Chloride (MOP 0-0-60)',
        productName_ar: 'كلوريد البوتاسيوم (MOP 0-0-60)',
        productName_fr: 'Chlorure de potassium (MOP 0-0-60)',
        grade: '60% K₂O',
        rateKgHa: mopKgHa,
        timing: 'Early basal broadcast for tolerant field crops',
        timing_ar: 'نثر أساسي مبكر للمحاصيل الحقلية المتحملة',
        timing_fr: 'Épandage de fond précoce pour grandes cultures',
        purposeFormula: 'Formula 4.1: Cost-effective potassium source',
      });
    }
  }

  // N Fertilizer (Urea 46% or Ammonium Sulfate 21% or CAN 27%)
  if (nReqKgHa > 0) {
    if (sample.ph > 7.6) {
      // Ammonium Sulfate (21-0-0 + 24% S) - physiologically acidic
      const asKgHa = Math.round((nReqKgHa * 100) / 21);
      fertilizerProducts.push({
        productName: 'Ammonium Sulfate [(NH₄)₂SO₄ 21-0-0 + 24% S]',
        productName_ar: 'سلفات الأمونيوم (كبريتات النشادر 21-0-0 + 24% S)',
        productName_fr: 'Sulfate d’ammonium (21-0-0 + 24% S)',
        grade: '21% N, 24% S',
        rateKgHa: asKgHa,
        timing: 'Split across vegetative growth stages',
        timing_ar: 'على دفعات مقسمة خلال مراحل النمو الخضري',
        timing_fr: 'Fractionné selon les stades végétatifs',
        purposeFormula: 'Formula 4.1: Acidifying nitrogen source for alkaline soils',
      });
    } else {
      // Urea (46-0-0)
      const ureaKgHa = Math.round((nReqKgHa * 100) / 46);
      fertilizerProducts.push({
        productName: 'Urea (46-0-0)',
        productName_ar: 'اليوريا (46-0-0)',
        productName_fr: 'Urée (46-0-0)',
        grade: '46% N',
        rateKgHa: ureaKgHa,
        timing: 'Split: 30% tillering/early, 40% peak vegetative, 30% pre-flowering',
        timing_ar: 'مقسم: 30% بداية النمو، 40% ذروة الخضري، 30% قبل التزهير',
        timing_fr: 'Fractionné : 30% démarrage, 40% tallage, 30% montaison',
        purposeFormula: 'Formula 4.1: Concentrated nitrogen top-dress',
      });
    }
  }

  // Micronutrient Products
  if (znReqKgHa > 0) {
    fertilizerProducts.push({
      productName: 'Zinc Sulfate Monohydrate (ZnSO₄·H₂O 35% Zn)',
      productName_ar: 'سلفات الزنك أحادي الهيدرات (35% Zn)',
      productName_fr: 'Sulfate de zinc monohydraté (35% Zn)',
      grade: '35% Zn, 17% S',
      rateKgHa: Math.round((znReqKgHa * 100) / 35),
      timing: 'Pre-plant soil application or foliar spray at 1-2 kg/ha',
      timing_ar: 'تطبيق أرضي قبل الزراعة أو رش ورقي 1-2 كغ/هكتار',
      timing_fr: 'Application sol avant semis ou foliaire à 1-2 kg/ha',
      purposeFormula: 'Formula 4.1: Micronutrient correction for zinc deficiency',
    });
  }

  if (feReqGramsHa > 0) {
    fertilizerProducts.push({
      productName: 'Iron Chelate (Fe-EDDHA 6% o-o ≥ 4.8%)',
      productName_ar: 'شيلات الحديد (Fe-EDDHA 6% أورثو-أورثو)',
      productName_fr: 'Chélate de fer (Fe-EDDHA 6% o-o)',
      grade: '6% Fe (chelated)',
      rateKgHa: Number((feReqGramsHa / 1000 / 0.06).toFixed(1)),
      timing: 'Soil drench or fertigation under root zone',
      timing_ar: 'حقن مع ماء الري في منطقة الجذور النشطة',
      timing_fr: 'Fertigation ou injection au niveau des racines',
      purposeFormula: 'High-pH chelate stability for lime-induced chlorosis',
    });
  }

  appliedFormulas.push({
    code: '4.1',
    name: 'Fertilizer Requirement & Product Conversion',
    formula: 'Fertilizer (kg/ha) = 100 × Recommended Rate (kg/ha) / Nutrient% in product',
    calculationSteps: `Calculated commercial rates for ${fertilizerProducts.map((p) => p.productName.split(' ')[0]).join(', ')} based on active nutrient grades.`,
  });

  const basePrescription = {
    sample,
    cationBalance,
    socStockTonnesHa,
    nMineralizationCreditKgHa,
    phStatus,
    limeRequirementTonnesHa,
    elementalSulfurKgHa,
    salinityClass,
    sodicityClass,
    gypsumRequirementTonnesHa,
    leachingRequirementPercent,
    nReqKgHa,
    p2o5ReqKgHa,
    k2oReqKgHa,
    mgoReqKgHa,
    sReqKgHa,
    znReqKgHa,
    bReqKgHa,
    feReqGramsHa,
    fertilizerProducts,
    appliedFormulas,
  };

  const automatedSuggestions = generateAutomatedSuggestions(sample, crop, targetYieldTonnesHa, basePrescription);

  return {
    ...basePrescription,
    automatedSuggestions,
  };
}

// AUTOMATED SUGGESTION ENGINE: MAPS LAB VALUES TO FORMULA ATLAS CALCULATORS
export function generateAutomatedSuggestions(
  sample: SoilLabSample,
  crop: TargetCropProfile,
  targetYieldTonnesHa: number,
  prescription: Omit<SamplePrescription, 'automatedSuggestions'>
): AutomatedCalculatorSuggestion[] {
  const suggestions: AutomatedCalculatorSuggestion[] = [];

  // Normalized soil P (Olsen basis)
  let pOlsen = sample.pPpm;
  if (sample.pMethod === 'bray1') pOlsen = sample.pPpm / 1.5;
  else if (sample.pMethod === 'mehlich3') pOlsen = sample.pPpm / 1.8;

  // 1. PHOSPHORUS (P) DEFICIENCY OR ELEVATED LEVEL
  if (pOlsen < crop.criticalPOlsenPpm) {
    const isSevere = pOlsen < crop.criticalPOlsenPpm * 0.6;
    suggestions.push({
      id: `p-deficiency-${sample.sampleId}`,
      nutrientOrCondition: 'Phosphorus (P) Deficiency',
      nutrientOrCondition_ar: 'نقص الفوسفور (P)',
      nutrientOrCondition_fr: 'Carence en Phosphore (P)',
      category: 'deficiency',
      severity: isSevere ? 'critical' : 'warning',
      detectedValue: `${sample.pPpm.toFixed(1)} ppm (${sample.pMethod.toUpperCase()}) ≈ ${pOlsen.toFixed(1)} ppm Olsen`,
      benchmark: `Critical Minimum: ${crop.criticalPOlsenPpm} ppm Olsen for ${crop.name}`,
      benchmark_ar: `الحد الحرج الأدنى: ${crop.criticalPOlsenPpm} ppm لمحصـول ${crop.name_ar}`,
      benchmark_fr: `Seuil critique : ${crop.criticalPOlsenPpm} ppm pour ${crop.name_fr}`,
      triggerReason: `Soil available phosphorus (${pOlsen.toFixed(1)} ppm Olsen) is below crop threshold (${crop.criticalPOlsenPpm} ppm). Requires ${prescription.p2o5ReqKgHa} kg P₂O₅/ha.`,
      triggerReason_ar: `الفوسفور المتاح في التربة (${pOlsen.toFixed(1)} ppm) أقل من العتبة الحرجة للمحصول (${crop.criticalPOlsenPpm} ppm). يحتاج ${prescription.p2o5ReqKgHa} كغ P₂O₅/هـ.`,
      triggerReason_fr: `Le phosphore assimilable (${pOlsen.toFixed(1)} ppm) est inférieur au seuil critique (${crop.criticalPOlsenPpm} ppm). Besoin de ${prescription.p2o5ReqKgHa} kg P₂O₅/ha.`,
      targetToolId: 'fertilization',
      targetTab: 'farm',
      storageKey: 'collapse_fertilization',
      calculatorName: 'Fertilization Generator (Crop NPK Demand)',
      calculatorName_ar: 'مولد برامج التسميد (احتياجات NPK)',
      calculatorName_fr: 'Générateur de fertilisation (Besoins NPK)',
      formulaAtlasCodes: ['4.1', '4.2'],
      formulaNames: ['Crop Nutrient Removal & Demand', 'Fertilizer Requirement from Grade'],
      formulaNames_ar: ['استخلاص واحتياج المحصول من العناصر', 'حساب كمية السماد التجاري حسب التركيز'],
      formulaNames_fr: ['Exportations & Besoins de la culture', 'Calcul des doses d’engrais commercial'],
      actionRecommendation: `Formulate starter P₂O₅ application (${prescription.p2o5ReqKgHa} kg/ha) using ${sample.ph > 7.5 ? 'MAP 12-52-0 (acidifying)' : 'DAP 18-46-0'} or custom granular mix.`,
      actionRecommendation_ar: `إضافة تسميد فوسفاتي تأسيسي (${prescription.p2o5ReqKgHa} كغ/هـ) باستخدام ${sample.ph > 7.5 ? 'MAP 12-52-0 الحامضي' : 'DAP 18-46-0'} قبل الزراعة.`,
      actionRecommendation_fr: `Appliquer une fumure de fond phosphorée (${prescription.p2o5ReqKgHa} kg/ha) avec ${sample.ph > 7.5 ? 'MAP 12-52-0' : 'DAP 18-46-0'}.`,
      bridgePayload: {
        crop: crop.id,
        p2o5_req: prescription.p2o5ReqKgHa,
        yield: targetYieldTonnesHa,
        p_ppm: sample.pPpm,
        ph: sample.ph,
      },
      formulaProofFormula: 'P₂O₅_req = (Yield × P₂O₅_Removal) + (P_crit − P_soil) × Fixation_Factor',
      formulaProofSteps: `(${targetYieldTonnesHa} t × ${crop.p2o5RemovalPerTonne}) + (${crop.criticalPOlsenPpm} − ${pOlsen.toFixed(1)}) × ${sample.ph > 7.8 ? 5.0 : 3.5} = ${prescription.p2o5ReqKgHa} kg P₂O₅/ha`,
    });
  }

  // 2. POTASSIUM (K) DEFICIT OR POTASH DEMAND
  if (sample.kPpm < crop.criticalKPpm || prescription.cationBalance.kSatPercent < 3.0) {
    const isSevere = sample.kPpm < crop.criticalKPpm * 0.6 || prescription.cationBalance.kSatPercent < 2.0;
    suggestions.push({
      id: `k-deficiency-${sample.sampleId}`,
      nutrientOrCondition: 'Potassium (K) Deficit & Potash Demand',
      nutrientOrCondition_ar: 'عجز البوتاسيوم (K) واحتياج البوتاس',
      nutrientOrCondition_fr: 'Déficit en Potassium (K) & Besoin Potasse',
      category: 'deficiency',
      severity: isSevere ? 'critical' : 'warning',
      detectedValue: `${sample.kPpm.toFixed(0)} ppm K (${prescription.cationBalance.kSatPercent}% CEC saturation)`,
      benchmark: `Critical Threshold: ${crop.criticalKPpm} ppm K (Ideal Saturation: 3.0 - 5.0%)`,
      benchmark_ar: `العتبة الحرجة: ${crop.criticalKPpm} ppm K (التشبع المثالي: 3.0 - 5.0%)`,
      benchmark_fr: `Seuil critique : ${crop.criticalKPpm} ppm K (Saturation idéale : 3.0 - 5.0%)`,
      triggerReason: `Exchangeable potassium (${sample.kPpm} ppm) is low for target yield of ${targetYieldTonnesHa} ${crop.unit}. Requires ${prescription.k2oReqKgHa} kg K₂O/ha.`,
      triggerReason_ar: `البوتاسيوم المتبادل (${sample.kPpm} ppm) منخفض لإنتاجية ${targetYieldTonnesHa} ${crop.unit}. يحتاج ${prescription.k2oReqKgHa} كغ K₂O/هـ.`,
      triggerReason_fr: `Le potassium échangeable (${sample.kPpm} ppm) est faible pour l'objectif de ${targetYieldTonnesHa} ${crop.unit}. Besoin de ${prescription.k2oReqKgHa} kg K₂O/ha.`,
      targetToolId: 'solubility-salt-index',
      targetTab: 'tools',
      calculatorName: 'Solubility & Salt Index Calculator',
      calculatorName_ar: 'حاسبة الذوبانية ومؤشر الملح',
      calculatorName_fr: 'Calculateur de solubilité et indice de sel',
      formulaAtlasCodes: ['4.1', '5.1'],
      formulaNames: ['Crop Nutrient Removal & Demand', 'Solubility & Salt Index Evaluation'],
      formulaNames_ar: ['استخلاص واحتياج المحصول', 'تقييم الذوبانية ومؤشر الملوحة'],
      formulaNames_fr: ['Exportations & Besoins', 'Évaluation de la solubilité et indice salin'],
      actionRecommendation: `Apply ${sample.ecDsM > 1.5 || sample.ph > 7.5 ? 'Potassium Sulfate (SOP 0-0-50, low salt index 43)' : 'Potassium Chloride (MOP 0-0-60)'} split between basal and fruit-fill.`,
      actionRecommendation_ar: `استخدام ${sample.ecDsM > 1.5 || sample.ph > 7.5 ? 'سلفات البوتاسيوم (SOP 0-0-50 مؤشر ملحي منخفض 43)' : 'كلوريد البوتاسيوم (MOP 0-0-60)'} مجزءاً بين التأسيس والتحجيم.`,
      actionRecommendation_fr: `Appliquer ${sample.ecDsM > 1.5 || sample.ph > 7.5 ? 'du Sulfate de Potassium (SOP 0-0-50, faible indice salin)' : 'du Chlorure de Potassium (MOP 0-0-60)'}.`,
      bridgePayload: {
        crop: crop.id,
        k2o_req: prescription.k2oReqKgHa,
        k_ppm: sample.kPpm,
        ec: sample.ecDsM,
      },
      formulaProofFormula: 'K₂O_req = (Yield × K₂O_Removal) + (K_crit − K_soil) × 0.8',
      formulaProofSteps: `(${targetYieldTonnesHa} t × ${crop.k2oRemovalPerTonne}) + (${crop.criticalKPpm} − ${sample.kPpm}) × 0.8 = ${prescription.k2oReqKgHa} kg K₂O/ha`,
    });
  }

  // 3. SOIL ACIDITY & LIMING REQUIREMENT
  if (sample.ph < crop.optimumPhMin) {
    const isSevere = sample.ph < 5.5;
    suggestions.push({
      id: `soil-acidity-${sample.sampleId}`,
      nutrientOrCondition: 'Soil Acidity & Liming Requirement',
      nutrientOrCondition_ar: 'حموضة التربة واحتياج الجير الزراعي',
      nutrientOrCondition_fr: 'Acidité du sol & Besoin en Chaux',
      category: 'soil_health',
      severity: isSevere ? 'critical' : 'warning',
      detectedValue: `pH ${sample.ph.toFixed(2)} (Strongly acidic, Al/Mn toxicity risk)`,
      benchmark: `Optimum pH: ${crop.optimumPhMin.toFixed(1)} - ${crop.optimumPhMax.toFixed(1)} for ${crop.name}`,
      benchmark_ar: `درجة الحموضة المثالية: ${crop.optimumPhMin.toFixed(1)} - ${crop.optimumPhMax.toFixed(1)} لـ ${crop.name_ar}`,
      benchmark_fr: `pH optimal : ${crop.optimumPhMin.toFixed(1)} - ${crop.optimumPhMax.toFixed(1)} pour ${crop.name_fr}`,
      triggerReason: `Soil pH (${sample.ph.toFixed(1)}) locks out P and base cations while increasing soluble aluminum. Requires ${prescription.limeRequirementTonnesHa} t CaCO₃/ha.`,
      triggerReason_ar: `حموضة التربة (${sample.ph.toFixed(1)}) تثبت الفوسفور وتسبب سمية الألمنيوم. تحتاج ${prescription.limeRequirementTonnesHa} طن جير كلسي/هـ.`,
      triggerReason_fr: `Le pH (${sample.ph.toFixed(1)}) bloque le P et libère l'aluminium toxique. Besoin de ${prescription.limeRequirementTonnesHa} t CaCO₃/ha.`,
      targetToolId: 'soil-ph-nutrients',
      targetTab: 'tools',
      calculatorName: 'Soil pH & Nutrient Availability Master',
      calculatorName_ar: 'ماستر pH التربة وتوفر العناصر',
      calculatorName_fr: 'Maître du pH du sol et disponibilité des nutriments',
      formulaAtlasCodes: ['SH.4', '49.2'],
      formulaNames: ['Soil pH Adjustment & Lime Requirement', 'Liming & Neutralization Index'],
      formulaNames_ar: ['تعديل pH التربة وحساب الجير', 'مؤشر التجيير ومعادلة الحموضة'],
      formulaNames_fr: ['Ajustement du pH du sol & Besoin en chaux', 'Indice de chaulage et neutralisation'],
      actionRecommendation: `Apply agricultural limestone (CaCO₃, CCE 100%) or Dolomitic lime (${prescription.limeRequirementTonnesHa} t/ha) broadcast and incorporated at 15-20 cm depth.`,
      actionRecommendation_ar: `نثر وخلط الجير الزراعي الكلسي أو الدولوميتي بمعدل ${prescription.limeRequirementTonnesHa} طن/هكتار على عمق 15-20 سم قبل الزراعة بشهرين.`,
      actionRecommendation_fr: `Épandre et incorporer ${prescription.limeRequirementTonnesHa} t/ha de calcaire agricole (CaCO₃) ou dolomie à 15-20 cm de profondeur.`,
      bridgePayload: {
        ph_current: sample.ph,
        ph_target: crop.optimumPhMin,
        cec: sample.cec,
        lime_req: prescription.limeRequirementTonnesHa,
      },
      formulaProofFormula: 'Lime (t/ha) = (pH_target − pH_current) × CEC × BD × (Depth/20) × 0.45',
      formulaProofSteps: `(${crop.optimumPhMin} − ${sample.ph}) × ${sample.cec} × ${sample.bulkDensity || 1.35} × (${sample.depthCm || 20}/20) × 0.45 = ${prescription.limeRequirementTonnesHa} t CaCO₃/ha`,
    });
  }

  // 4. SOIL ALKALINITY & CALCAREOUS FIXATION
  if (sample.ph > 7.8 || (sample.freeLimePercent !== undefined && sample.freeLimePercent > 5.0)) {
    suggestions.push({
      id: `soil-alkalinity-${sample.sampleId}`,
      nutrientOrCondition: 'High Soil Alkalinity & Calcareous Fixation Risk',
      nutrientOrCondition_ar: 'قلوية التربة وتثبيت الفوسفور الكلسي',
      nutrientOrCondition_fr: 'Alcalinité & Fixation Calcaire',
      category: 'soil_health',
      severity: 'warning',
      detectedValue: `pH ${sample.ph.toFixed(2)}${sample.freeLimePercent ? ` · Free Lime: ${sample.freeLimePercent}%` : ''}`,
      benchmark: `Optimal: pH 6.2 - 7.5 (Troug curves show P, Fe, Zn, Mn lockout > pH 7.8)`,
      benchmark_ar: `المثالي: pH 6.2 - 7.5 (منحنيات تروج تثبت الفوسفور والحديد والزنك > 7.8)`,
      benchmark_fr: `Optimum : pH 6.2 - 7.5 (Blocage du P, Fe, Zn, Mn au-dessus de 7.8)`,
      triggerReason: `High pH precipitates phosphorus as insoluble tricalcium phosphate and induces lime chlorosis. Requires elemental sulfur (${prescription.elementalSulfurKgHa} kg/ha) or acid fertigation.`,
      triggerReason_ar: `ارتفاع الـ pH يرسب الفوسفور كفوسفات ثلاثي الكالسيوم ويحجب الحديد. يحتاج كبريت زراعي (${prescription.elementalSulfurKgHa} كغ/هـ) أو أحماض الري.`,
      triggerReason_fr: `Le pH élevé précipite le phosphore et induit la chlorose ferrique. Besoin de soufre élémentaire (${prescription.elementalSulfurKgHa} kg/ha).`,
      targetToolId: 'soil-ph-nutrients',
      targetTab: 'tools',
      calculatorName: 'Soil pH & Nutrient Availability Master',
      calculatorName_ar: 'ماستر pH التربة وتوفر العناصر',
      calculatorName_fr: 'Maître du pH du sol et disponibilité des nutriments',
      formulaAtlasCodes: ['SH.4', 'S.ACID'],
      formulaNames: ['Elemental Sulfur Acidification Requirement', 'Troug Nutrient Solubility Master'],
      formulaNames_ar: ['حساب الكبريت الزراعي للتحميض', 'منحنيات تروج لذوبانية وتيسر العناصر'],
      formulaNames_fr: ['Besoins en soufre pour acidification', 'Courbes de solubilité de Troug'],
      actionRecommendation: `Apply broadcast Elemental Sulfur (${prescription.elementalSulfurKgHa} kg S⁰/ha) and use acidic fertilizers (MAP 12-52-0, Ammonium Sulfate, Fe-EDDHA).`,
      actionRecommendation_ar: `إضافة كبريت زراعي ناعم (${prescription.elementalSulfurKgHa} كغ S⁰/هـ) مع استخدام أسمدة حامضية وشيلات Fe-EDDHA.`,
      actionRecommendation_fr: `Appliquer du soufre élémentaire (${prescription.elementalSulfurKgHa} kg S⁰/ha) et privilégier des engrais acidifiants (MAP, sulfate d'ammonium, Fe-EDDHA).`,
      bridgePayload: {
        ph_current: sample.ph,
        ph_target: 7.0,
        cec: sample.cec,
        sulfur_req: prescription.elementalSulfurKgHa,
      },
      formulaProofFormula: 'S⁰ (kg/ha) = (pH_current − 7.0) × CEC_Buffer_Factor',
      formulaProofSteps: `(${sample.ph} − 7.0) × ${sample.cec > 20 ? 400 : 250} = ${prescription.elementalSulfurKgHa} kg S⁰/ha`,
    });
  }

  // 5. SODICITY (ESP / SAR) & DISPERSION HAZARD
  if (prescription.cationBalance.naSatPercent > 5.0 || prescription.cationBalance.sar >= 6.0) {
    const isSevere = prescription.cationBalance.naSatPercent >= 10.0 || prescription.cationBalance.sar >= 10.0;
    suggestions.push({
      id: `sodicity-reclamation-${sample.sampleId}`,
      nutrientOrCondition: 'Sodic Soil & Soil Dispersion Hazard',
      nutrientOrCondition_ar: 'صودية التربة وخطر التشتت وانسداد المسام',
      nutrientOrCondition_fr: 'Sodicité du sol & Risque de dispersion',
      category: 'salinity_sodicity',
      severity: isSevere ? 'critical' : 'warning',
      detectedValue: `ESP: ${prescription.cationBalance.naSatPercent}% Na saturation · SAR: ${prescription.cationBalance.sar}`,
      benchmark: `Safe ESP: < 3.0% (Severe structural degradation & crusting > 6.0%)`,
      benchmark_ar: `الحد الآمن لـ ESP: < 3.0% (تدهور بناء التربة والقشور > 6.0%)`,
      benchmark_fr: `ESP sécuritaire : < 3.0% (Dégradation structurale > 6.0%)`,
      triggerReason: `High exchangeable sodium fraction (${prescription.cationBalance.naSatPercent}%) destroys soil aggregates and infiltration. Requires ${prescription.gypsumRequirementTonnesHa} t Gypsum/ha.`,
      triggerReason_ar: `نسبة الصوديوم المتبادل (${prescription.cationBalance.naSatPercent}%) تدمر حبيبات التربة وتمنع النفاذية. تحتاج ${prescription.gypsumRequirementTonnesHa} طن جبس زراعي/هـ.`,
      triggerReason_fr: `La fraction de sodium échangeable (${prescription.cationBalance.naSatPercent}%) détruit la structure du sol. Besoin de ${prescription.gypsumRequirementTonnesHa} t Gypse/ha.`,
      targetToolId: 'amendment-balance',
      targetTab: 'tools',
      calculatorName: 'Amendment Balance by CEC Calculator',
      calculatorName_ar: 'حاسبة توازن المعدلات حسب CEC',
      calculatorName_fr: 'Calculateur d’amendements par CEC',
      formulaAtlasCodes: ['49.2', '7.10'],
      formulaNames: ['Gypsum Requirement for Sodic Reclamation', 'Sodium Adsorption Ratio (SAR)'],
      formulaNames_ar: ['حساب الجبس الزراعي لاستصلاح الصودية', 'معيار امتزاز الصوديوم (SAR)'],
      formulaNames_fr: ['Besoin en gypse pour sols sodiques', 'Ratio d’adsorption du sodium (SAR)'],
      actionRecommendation: `Apply agricultural gypsum (CaSO₄·2H₂O) at ${prescription.gypsumRequirementTonnesHa} t/ha to displace Na⁺ with Ca²⁺, followed by flushing irrigation.`,
      actionRecommendation_ar: `نثر الجبس الزراعي بمعدل ${prescription.gypsumRequirementTonnesHa} طن/هـ لتبادل الكالسيوم مع الصوديوم ثم الري لغسيل أملاح الصوديوم.`,
      actionRecommendation_fr: `Appliquer ${prescription.gypsumRequirementTonnesHa} t/ha de gypse agricole (CaSO₄·2H₂O) pour déplacer le Na⁺ par le Ca²⁺.`,
      bridgePayload: {
        esp_current: prescription.cationBalance.naSatPercent,
        esp_target: 5.0,
        cec: sample.cec,
        gypsum_req: prescription.gypsumRequirementTonnesHa,
      },
      formulaProofFormula: 'GR (t/ha) = (ESP_initial − ESP_target) × CEC × BD × Depth / 172',
      formulaProofSteps: `(${prescription.cationBalance.naSatPercent}% − 5.0%) × ${sample.cec} × ${sample.bulkDensity || 1.35} × ${sample.depthCm || 20} / 172 = ${prescription.gypsumRequirementTonnesHa} t Gypsum/ha`,
    });
  }

  // 6. SOIL SALINITY (ECe) & LEACHING REQUIREMENT
  if (sample.ecDsM > crop.ecThresholdDsM || sample.ecDsM >= 2.0) {
    const isSevere = sample.ecDsM >= 4.0;
    suggestions.push({
      id: `salinity-control-${sample.sampleId}`,
      nutrientOrCondition: 'Soil Salinity (ECe) & Osmotic Stress',
      nutrientOrCondition_ar: 'ملوحة التربة (ECe) والإجهاد الأسموزي',
      nutrientOrCondition_fr: 'Salinité du sol (ECe) & Stress osmotique',
      category: 'salinity_sodicity',
      severity: isSevere ? 'critical' : 'warning',
      detectedValue: `ECe: ${sample.ecDsM.toFixed(1)} dS/m (Crop threshold: ${crop.ecThresholdDsM} dS/m)`,
      benchmark: `Yield Loss Threshold: ${crop.ecThresholdDsM} dS/m for ${crop.name}`,
      benchmark_ar: `عتبة انخفاض الإنتاج: ${crop.ecThresholdDsM} dS/m لـ ${crop.name_ar}`,
      benchmark_fr: `Seuil de perte de rendement : ${crop.ecThresholdDsM} dS/m pour ${crop.name_fr}`,
      triggerReason: `Soluble salt concentration (${sample.ecDsM} dS/m) exceeds crop tolerance. Requires extra +${prescription.leachingRequirementPercent}% irrigation leaching fraction.`,
      triggerReason_ar: `تركيز الأملاح الذائبة (${sample.ecDsM} dS/m) يتجاوز تحمل المحصول. يحتاج نسبة غسيل إضافية +${prescription.leachingRequirementPercent}% مع ماء الري.`,
      triggerReason_fr: `La salinité (${sample.ecDsM} dS/m) dépasse la tolérance de la culture. Fraction de lessivage requise : +${prescription.leachingRequirementPercent}%.`,
      targetToolId: 'solubility-salt-index',
      targetTab: 'tools',
      calculatorName: 'Solubility & Salt Index Calculator',
      calculatorName_ar: 'حاسبة الذوبانية ومؤشر الملح',
      calculatorName_fr: 'Calculateur de solubilité et indice de sel',
      formulaAtlasCodes: ['49.1', '5.1'],
      formulaNames: ['Salinity Leaching Requirement (LR)', 'Fertilizer Salt Index Risk'],
      formulaNames_ar: ['الاحتياج الغسيلي للملوحة (LR)', 'مؤشر الملوحة للأسمدة'],
      formulaNames_fr: ['Besoin de lessivage des sels (LR)', 'Indice de sel des engrais'],
      actionRecommendation: `Apply +${prescription.leachingRequirementPercent}% leaching water fraction during winter/pre-plant, and avoid high salt-index fertilizers like MOP or standard urea in furrows.`,
      actionRecommendation_ar: `تطبيق رية غسيلية بزيادة +${prescription.leachingRequirementPercent}% وتجنب الأسمدة ذات المؤشر الملحي العالي قرب البذور.`,
      actionRecommendation_fr: `Appliquer une fraction de lessivage de +${prescription.leachingRequirementPercent}% et éviter les engrais à fort indice salin.`,
      bridgePayload: {
        ec_soil: sample.ecDsM,
        ec_threshold: crop.ecThresholdDsM,
        leaching_pct: prescription.leachingRequirementPercent,
      },
      formulaProofFormula: 'LR (%) = [EC_water / (5 × ECe_threshold − EC_water)] × 100',
      formulaProofSteps: `[1.0 / (5 × ${crop.ecThresholdDsM} − 1.0)] × 100 = ${prescription.leachingRequirementPercent}% leaching fraction`,
    });
  }

  // 7. LOW ORGANIC MATTER & CARBON STOCK
  if (sample.omPercent < 1.8) {
    suggestions.push({
      id: `om-carbon-stock-${sample.sampleId}`,
      nutrientOrCondition: 'Low Organic Matter & Soil Carbon Depletion',
      nutrientOrCondition_ar: 'انخفاض المادة العضوية ومخزون الكربون',
      nutrientOrCondition_fr: 'Matière Organique Faible & Stock Carbone',
      category: 'soil_health',
      severity: 'warning',
      detectedValue: `OM: ${sample.omPercent.toFixed(1)}% · SOC Stock: ${prescription.socStockTonnesHa} t C/ha`,
      benchmark: `Healthy Soil Target: ≥ 2.5% OM (SOC Stock > 35 t C/ha)`,
      benchmark_ar: `المستوى الصحي المستهدف: ≥ 2.5% مادة عضوية (مخزون كربون > 35 طن/هـ)`,
      benchmark_fr: `Objectif sol sain : ≥ 2.5% MO (Stock SOC > 35 t C/ha)`,
      triggerReason: `Low organic matter (${sample.omPercent}%) limits natural N release (${prescription.nMineralizationCreditKgHa} kg N/ha) and reduces cation buffering capacity.`,
      triggerReason_ar: `انخفاض المادة العضوية (${sample.omPercent}%) يقلل التيسر الذاتي للنيتروجين (${prescription.nMineralizationCreditKgHa} كغ N/هـ) وسعة التبادل.`,
      triggerReason_fr: `La faible teneur en matière organique (${sample.omPercent}%) limite la minéralisation de l'azote (${prescription.nMineralizationCreditKgHa} kg N/ha).`,
      targetToolId: 'fertilizer-carbon',
      targetTab: 'tools',
      calculatorName: 'Fertilizer Carbon Footprint & Organic Balance',
      calculatorName_ar: 'حاسبة البصمة الكربونية والموازنة العضوية',
      calculatorName_fr: 'Calculateur d’empreinte carbone et bilan organique',
      formulaAtlasCodes: ['SH.1'],
      formulaNames: ['Soil Organic Carbon Stock & Mineralization'],
      formulaNames_ar: ['مخزون الكربون العضوي ومعدل التمعدن'],
      formulaNames_fr: ['Stock de carbone organique et minéralisation'],
      actionRecommendation: `Apply 15 - 25 t/ha well-composted organic manure or integrate legume cover crops to boost soil biological buffering.`,
      actionRecommendation_ar: `إضافة 15 - 25 طن/هكتار من السماد العضوي المتخمر أو زراعة محاصيل تغطية بقولية لتعزيز خصوبة التربة.`,
      actionRecommendation_fr: `Apporter 15 à 25 t/ha de fumier composté ou implanter un couvert végétal de légumineuses.`,
      bridgePayload: {
        om_percent: sample.omPercent,
        soc_stock: prescription.socStockTonnesHa,
        n_credit: prescription.nMineralizationCreditKgHa,
      },
      formulaProofFormula: 'SOC_stock (t/ha) = (OM% / 1.724) × BD × Depth_cm',
      formulaProofSteps: `(${sample.omPercent}% / 1.724) × ${sample.bulkDensity || 1.35} × ${sample.depthCm || 20} = ${prescription.socStockTonnesHa} t C/ha`,
    });
  }

  // 8. HIGH NITROGEN DEMAND & STAGE DISTRIBUTION
  if (prescription.nReqKgHa > 50) {
    suggestions.push({
      id: `n-distribution-${sample.sampleId}`,
      nutrientOrCondition: 'Seasonal Nitrogen Demand & Split Planning',
      nutrientOrCondition_ar: 'الاحتياج النيتروجيني الموسمي والتقسيم المرحلي',
      nutrientOrCondition_fr: 'Besoins en Azote & Fractionnement',
      category: 'fertigation_blend',
      severity: prescription.nReqKgHa > 120 ? 'critical' : 'warning',
      detectedValue: `Net N Demand: ${prescription.nReqKgHa} kg N/ha (Soil NO₃-N: ${sample.no3NPpm} ppm)`,
      benchmark: `Crop Uptake Curve: ${crop.nRemovalPerTonne} kg N/tonne yield for ${crop.name}`,
      benchmark_ar: `منحنى امتصاص المحصول: ${crop.nRemovalPerTonne} كغ N لكل طن إنتاج لـ ${crop.name_ar}`,
      benchmark_fr: `Courbe d’absorption : ${crop.nRemovalPerTonne} kg N/tonne pour ${crop.name_fr}`,
      triggerReason: `Crop requires ${prescription.nReqKgHa} kg pure N/ha after subtracting soil NO₃-N and organic mineralization credits.`,
      triggerReason_ar: `يحتاج المحصول ${prescription.nReqKgHa} كغ نيتروجين صافي/هـ بعد خصم النترات المتبقية والتمعدن العضوي.`,
      triggerReason_fr: `La culture nécessite ${prescription.nReqKgHa} kg N/ha après déduction du reliquat azoté et du crédit organique.`,
      targetToolId: 'nutrient-distribution',
      targetTab: 'tools',
      calculatorName: 'Nutrient Distribution by Stage Calculator',
      calculatorName_ar: 'حاسبة توزيع العناصر حسب المرحلة الفينولوجية',
      calculatorName_fr: 'Calculateur de distribution des nutriments par stade',
      formulaAtlasCodes: ['4.1', '4.2'],
      formulaNames: ['Crop Nitrogen Balance & Split Allocation'],
      formulaNames_ar: ['ميزان النيتروجين وتقسيم الدفعات السمادية'],
      formulaNames_fr: ['Bilan azoté & Fractionnement des apports'],
      actionRecommendation: `Split nitrogen into 3 - 4 phenological applications: 25% establishment/tillering, 45% peak vegetative growth, 30% flowering/grain-fill.`,
      actionRecommendation_ar: `تقسيم النيتروجين على 3-4 دفعات: 25% بداية النمو، 45% ذروة النمو الخضري، 30% مرحلة التزهير وامتلاء الثمار.`,
      actionRecommendation_fr: `Fractionner l’azote en 3 à 4 apports : 25% au démarrage, 45% en plein développement végétatif, 30% à la floraison/grossissement.`,
      bridgePayload: {
        crop: crop.id,
        n_req: prescription.nReqKgHa,
        yield: targetYieldTonnesHa,
      },
      formulaProofFormula: 'N_req = (Yield × N_Removal) − Soil_NO₃_credit − OM_credit',
      formulaProofSteps: `(${targetYieldTonnesHa} t × ${crop.nRemovalPerTonne}) − ${(sample.no3NPpm * (sample.bulkDensity || 1.35) * ((sample.depthCm || 20) / 10) * 0.4).toFixed(0)} − ${prescription.nMineralizationCreditKgHa} = ${prescription.nReqKgHa} kg N/ha`,
    });
  }

  // 9. CATION RATIO ANTAGONISM (Ca:Mg or Mg:K)
  if (
    prescription.cationBalance.caMgRatio < 3.0 ||
    prescription.cationBalance.caMgRatio > 8.0 ||
    prescription.cationBalance.mgKRatio < 1.5 ||
    prescription.cationBalance.mgKRatio > 5.0
  ) {
    suggestions.push({
      id: `cation-imbalance-${sample.sampleId}`,
      nutrientOrCondition: 'Cation Ratio Antagonism (Ca:Mg / Mg:K)',
      nutrientOrCondition_ar: 'تضاد نسب الكاتيونات المتبادلة (Ca:Mg و Mg:K)',
      nutrientOrCondition_fr: 'Antagonisme des Ratios Cationiques (Ca:Mg / Mg:K)',
      category: 'deficiency',
      severity: 'warning',
      detectedValue: `Ca:Mg = ${prescription.cationBalance.caMgRatio} : 1 · Mg:K = ${prescription.cationBalance.mgKRatio} : 1`,
      benchmark: `Ideal Ratios: Ca:Mg (4.0 - 7.0 : 1) · Mg:K (2.0 - 4.0 : 1)`,
      benchmark_ar: `النسب المثالية: Ca:Mg بين 4.0 و 7.0 : 1 · Mg:K بين 2.0 و 4.0 : 1`,
      benchmark_fr: `Ratios idéaux : Ca:Mg (4.0 - 7.0 : 1) · Mg:K (2.0 - 4.0 : 1)`,
      triggerReason: `Cation ratio distortion causes competitive root uptake inhibition between Calcium, Magnesium, and Potassium.`,
      triggerReason_ar: `اختلال توازن الكاتيونات يسبب تنافساً وتثبيطاً لامتصاص الكالسيوم أو المغنيسيوم أو البوتاسيوم في الجذور.`,
      triggerReason_fr: `La distorsion des ratios cationiques crée une inhibition compétitive racinaire entre Ca, Mg et K.`,
      targetToolId: 'amendment-balance',
      targetTab: 'tools',
      calculatorName: 'Amendment Balance by CEC Calculator',
      calculatorName_ar: 'حاسبة توازن المعدلات حسب CEC',
      calculatorName_fr: 'Calculateur d’amendements par CEC',
      formulaAtlasCodes: ['7.10'],
      formulaNames: ['Cation Exchange Balance & Equilibrium'],
      formulaNames_ar: ['توازن التبادل الكاتيوني والاتزان الأيوني'],
      formulaNames_fr: ['Équilibre d’échange cationique'],
      actionRecommendation: `Rebalance base saturation by adjusting ${prescription.cationBalance.caMgRatio < 3.0 ? 'Calcium (Gypsum/Lime)' : prescription.cationBalance.mgKRatio < 1.5 ? 'Magnesium (Epsom salt MgSO₄·7H₂O)' : 'Potassium (SOP)'}.`,
      actionRecommendation_ar: `إعادة توازن تشبع القواعد بإضافة ${prescription.cationBalance.caMgRatio < 3.0 ? 'الكالسيوم (جبس أو جير)' : prescription.cationBalance.mgKRatio < 1.5 ? 'المغنيسيوم (ملح إبسوم MgSO₄·7H₂O)' : 'البوتاسيوم (سلفات البوتاسيوم)'}.`,
      actionRecommendation_fr: `Rééquilibrer la saturation en ajustant ${prescription.cationBalance.caMgRatio < 3.0 ? 'le Calcium (Gypse/Chaux)' : prescription.cationBalance.mgKRatio < 1.5 ? 'le Magnésium (Sulfate de magnésium)' : 'le Potassium (SOP)'}.`,
      bridgePayload: {
        ca_meq: prescription.cationBalance.caMeq,
        mg_meq: prescription.cationBalance.mgMeq,
        k_meq: prescription.cationBalance.kMeq,
        cec: sample.cec,
      },
      formulaProofFormula: 'Ca:Mg Ratio = Ca_meq / Mg_meq ; Mg:K Ratio = Mg_meq / K_meq',
      formulaProofSteps: `${prescription.cationBalance.caMeq} meq Ca / ${prescription.cationBalance.mgMeq} meq Mg = ${prescription.cationBalance.caMgRatio}:1 ; ${prescription.cationBalance.mgMeq} meq Mg / ${prescription.cationBalance.kMeq} meq K = ${prescription.cationBalance.mgKRatio}:1`,
    });
  }

  // 10. MICRONUTRIENT DEFICIENCY (ZINC, IRON, BORON)
  if (
    (sample.znPpm !== undefined && sample.znPpm < crop.criticalZnPpm) ||
    (sample.ph > 7.5 && sample.fePpm !== undefined && sample.fePpm < 4.5) ||
    (sample.bPpm !== undefined && sample.bPpm < crop.criticalBPpm)
  ) {
    suggestions.push({
      id: `micronutrient-correction-${sample.sampleId}`,
      nutrientOrCondition: 'Micronutrient Deficiency (Zn / Fe / B)',
      nutrientOrCondition_ar: 'نقص وتثبيت العناصر الصغرى (Zn / Fe / B)',
      nutrientOrCondition_fr: 'Carence en Oligo-éléments (Zn / Fe / B)',
      category: 'deficiency',
      severity: 'warning',
      detectedValue: `Zn: ${sample.znPpm ?? 'N/A'} ppm · Fe: ${sample.fePpm ?? 'N/A'} ppm · B: ${sample.bPpm ?? 'N/A'} ppm`,
      benchmark: `Critical Thresholds: Zn ≥ ${crop.criticalZnPpm} ppm · B ≥ ${crop.criticalBPpm} ppm`,
      benchmark_ar: `الحدود الحرجة: Zn ≥ ${crop.criticalZnPpm} ppm · B ≥ ${crop.criticalBPpm} ppm`,
      benchmark_fr: `Seuils critiques : Zn ≥ ${crop.criticalZnPpm} ppm · B ≥ ${crop.criticalBPpm} ppm`,
      triggerReason: `Micronutrient levels or high soil pH limit zinc, boron, or bio-available iron uptake.`,
      triggerReason_ar: `مستويات العناصر الصغرى أو قلوية التربة تحجب امتصاص الزنك والبورون والحديد المتاح.`,
      triggerReason_fr: `Les teneurs faibles ou le pH élevé limitent l'assimilation du zinc, bore ou fer.`,
      targetToolId: 'fertilizer-composition',
      targetTab: 'tools',
      calculatorName: 'Fertilizer Composition (%) & Micronutrient Solver',
      calculatorName_ar: 'حاسبة تركيب الأسمدة (%) ومحلل العناصر الصغرى',
      calculatorName_fr: 'Calculateur de composition des engrais & Oligo-éléments',
      formulaAtlasCodes: ['4.1'],
      formulaNames: ['Micronutrient Grade & Chelate Conversion'],
      formulaNames_ar: ['حساب شيلات ومركبات العناصر الصغرى'],
      formulaNames_fr: ['Conversion des grades et chélates d’oligo-éléments'],
      actionRecommendation: `Apply Zinc Sulfate (ZnSO₄·H₂O 35% Zn at 5-10 kg/ha) or high-stability Fe-EDDHA 6% via fertigation to prevent chlorosis.`,
      actionRecommendation_ar: `إضافة سلفات الزنك (35% Zn بمعدل 5-10 كغ/هـ) أو شيلات حديد Fe-EDDHA 6% أورثو-أورثو لتفادي الاصفرار.`,
      actionRecommendation_fr: `Apporter du sulfate de zinc (35% Zn à 5-10 kg/ha) ou du Fe-EDDHA 6% en fertigation pour prévenir la chlorose.`,
      bridgePayload: {
        ph: sample.ph,
        zn_req: prescription.znReqKgHa,
        fe_req: prescription.feReqGramsHa,
      },
      formulaProofFormula: 'Micro_Product (kg/ha) = 100 × Micro_Rate (kg/ha) / Grade%',
      formulaProofSteps: `Applied targeted chelated and salt-form micro corrections based on crop sensitivity.`,
    });
  }

  return suggestions;
}
