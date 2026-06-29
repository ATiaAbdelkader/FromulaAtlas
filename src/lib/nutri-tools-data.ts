/**
 * NutriPlant PRO — Free Tools shared data & engines
 *
 * Reimplemented natively (TypeScript / React) from
 * https://nutriplantpro.com/login.html free-tools modal.
 *
 * This file aggregates the constants, lookup tables, and pure-function
 * engines shared across the 18 free tools:
 *   1.  Conversion Calculator (oxide ↔ elemental)
 *   2.  Nutrient Units Converter (ppm / mmol / meq)
 *   3.  Measure Units Converter (length, area, volume, mass, temp, …)
 *   4.  Hydroponic Solution Designer
 *   5.  Water Hardness Diagnostic
 *   6.  VPD Estimator
 *   7.  Amendment Balance by CEC
 *   8.  Granular Mix Formulation
 *   9.  Fertilizer Composition (% from chemical formula)
 *   10. Nutrient Distribution by Stage (%)
 *   11. Periodic Table of Essential Plant Nutrients
 *   12. Fertilizer Compatibility Matrix
 *   13. Nutrient Interactions & Mobility
 *   14. Mineralizable N Estimation
 *   15. Soil Water & Texture (USDA triangle)
 *   16. Irrigation Sheet & Water Balance
 *   17. Solubility & Salt Index
 *   18. Fertilizer Carbon Footprint
 */

// ============================================================================
// 1. CONVERSION CALCULATOR — Oxide ↔ Elemental factors
// ============================================================================

export interface ConversionPair {
  key: string;
  oxide: string;
  elemental: string;
  oxideToElement: number;
  elementToOxide: number;
}

/** Each row: from oxide → element uses factor `oxideToElement`; reverse uses `elementToOxide`. */
export const OXIDE_CONVERSIONS: ConversionPair[] = [
  { key: 'ca',  oxide: 'CaO',   elemental: 'Ca',   oxideToElement: 0.715, elementToOxide: 1.399 },
  { key: 'k',   oxide: 'K₂O',   elemental: 'K',    oxideToElement: 0.830, elementToOxide: 1.205 },
  { key: 'p',   oxide: 'P₂O₅',  elemental: 'P',    oxideToElement: 0.436, elementToOxide: 2.291 },
  { key: 'mg',  oxide: 'MgO',   elemental: 'Mg',   oxideToElement: 0.603, elementToOxide: 1.658 },
  { key: 'n-no3', oxide: 'NO₃', elemental: 'N',    oxideToElement: 0.226, elementToOxide: 4.429 },
  { key: 'n-nh4', oxide: 'NH₄', elemental: 'N',    oxideToElement: 0.778, elementToOxide: 1.286 },
  { key: 's-so4', oxide: 'SO₄', elemental: 'S',    oxideToElement: 0.333, elementToOxide: 3.000 },
  { key: 's-so3', oxide: 'SO₃', elemental: 'S',    oxideToElement: 0.400, elementToOxide: 2.497 },
  { key: 'zn',  oxide: 'ZnO',   elemental: 'Zn',   oxideToElement: 0.803, elementToOxide: 1.245 },
  { key: 'fe',  oxide: 'Fe₂O₃', elemental: 'Fe',   oxideToElement: 0.699, elementToOxide: 1.430 },
  { key: 'mn',  oxide: 'MnO',   elemental: 'Mn',   oxideToElement: 0.775, elementToOxide: 1.291 },
  { key: 'b',   oxide: 'B₂O₃',  elemental: 'B',    oxideToElement: 0.311, elementToOxide: 3.220 },
  { key: 'cu',  oxide: 'CuO',   elemental: 'Cu',   oxideToElement: 0.799, elementToOxide: 1.252 },
  { key: 'si',  oxide: 'SiO₂',  elemental: 'Si',   oxideToElement: 0.467, elementToOxide: 2.139 },
  { key: 'mo',  oxide: 'MoO₃',  elemental: 'Mo',   oxideToElement: 0.667, elementToOxide: 1.500 },
];

// ============================================================================
// 2. NUTRIENT UNITS CONVERTER — ppm ↔ mmol ↔ meq
// ============================================================================

export interface NutrientData {
  key: string;
  label: string;
  mw: number;       // molecular weight (g/mol)
  valence: number;  // charge magnitude
  useUmol?: boolean; // micros use µmol instead of mmol
}

export const NUTRIENT_DATA: NutrientData[] = [
  { key: 'n',     label: 'N',     mw: 14.01,  valence: 1 },
  { key: 'p',     label: 'P',     mw: 30.97,  valence: 1 },
  { key: 'k',     label: 'K',     mw: 39.10,  valence: 1 },
  { key: 'ca',    label: 'Ca',    mw: 40.08,  valence: 2 },
  { key: 'mg',    label: 'Mg',    mw: 24.31,  valence: 2 },
  { key: 's',     label: 'S',     mw: 32.07,  valence: 2 },
  { key: 'fe',    label: 'Fe',    mw: 55.85,  valence: 2, useUmol: true },
  { key: 'mn',    label: 'Mn',    mw: 54.94,  valence: 2, useUmol: true },
  { key: 'zn',    label: 'Zn',    mw: 65.38,  valence: 2, useUmol: true },
  { key: 'b',     label: 'B',     mw: 10.81,  valence: 1, useUmol: true },
  { key: 'cu',    label: 'Cu',    mw: 63.55,  valence: 2, useUmol: true },
  { key: 'mo',    label: 'Mo',    mw: 95.95,  valence: 2, useUmol: true },
  { key: 'hco3',  label: 'HCO₃',  mw: 61.02,  valence: 1 },
  { key: 'co3',   label: 'CO₃',   mw: 60.01,  valence: 2 },
  { key: 'h2po4', label: 'H₂PO₄', mw: 96.99,  valence: 1 },
  { key: 'hpo4',  label: 'HPO₄',  mw: 95.98,  valence: 2 },
  { key: 'h3po4', label: 'H₃PO₄', mw: 97.99,  valence: 1 },
  { key: 'hno3',  label: 'HNO₃',  mw: 63.01,  valence: 1 },
  { key: 'h2so4', label: 'H₂SO₄', mw: 98.08,  valence: 2 },
  { key: 'so4',   label: 'SO₄',   mw: 96.06,  valence: 2 },
  { key: 'no3',   label: 'NO₃',   mw: 62.00,  valence: 1 },
  { key: 'nh4',   label: 'NH₄',   mw: 18.04,  valence: 1 },
];

// ============================================================================
// 3. MEASURE UNITS CONVERTER
// ============================================================================

export interface UnitDef {
  id: string;
  name: string;
  toBase: number;
  isTemp?: boolean;
  group?: 'solution' | 'soil';
}

export const MEASURE_UNITS: Record<string, UnitDef[]> = {
  length: [
    { id: 'm',  name: 'm (meter)',      toBase: 1 },
    { id: 'km', name: 'km',             toBase: 1000 },
    { id: 'cm', name: 'cm',             toBase: 0.01 },
    { id: 'ft', name: 'ft (foot)',      toBase: 0.3048 },
    { id: 'in', name: 'in (inch)',      toBase: 0.0254 },
    { id: 'yd', name: 'yd (yard)',      toBase: 0.9144 },
    { id: 'mi', name: 'mi (mile)',      toBase: 1609.344 },
  ],
  area: [
    { id: 'm2',   name: 'm²',           toBase: 1 },
    { id: 'ha',   name: 'ha (hectare)', toBase: 10000 },
    { id: 'acre', name: 'acre',         toBase: 4046.86 },
    { id: 'ft2',  name: 'ft²',          toBase: 0.092903 },
    { id: 'km2',  name: 'km²',          toBase: 1e6 },
  ],
  volume: [
    { id: 'L',      name: 'L (liter)',  toBase: 1 },
    { id: 'mL',     name: 'mL',         toBase: 0.001 },
    { id: 'm3',     name: 'm³',         toBase: 1000 },
    { id: 'galUS',  name: 'gal (US)',   toBase: 3.78541 },
    { id: 'galUK',  name: 'gal (UK)',   toBase: 4.54609 },
    { id: 'ft3',    name: 'ft³',        toBase: 28.3168 },
    { id: 'flozUS', name: 'fl oz (US)', toBase: 0.0295735 },
  ],
  weight: [
    { id: 'kg', name: 'kg',             toBase: 1 },
    { id: 'g',  name: 'g',              toBase: 0.001 },
    { id: 'mg', name: 'mg',             toBase: 0.000001 },
    { id: 't',  name: 't (tonne)',      toBase: 1000 },
    { id: 'lb', name: 'lb (pound)',     toBase: 0.453592 },
    { id: 'oz', name: 'oz (ounce)',     toBase: 0.0283495 },
  ],
  temperature: [
    { id: 'C', name: '°C', toBase: 1, isTemp: true },
    { id: 'F', name: '°F', toBase: 1, isTemp: true },
    { id: 'K', name: 'K',  toBase: 1, isTemp: true },
  ],
  pressure: [
    { id: 'kPa',  name: 'kPa',  toBase: 1 },
    { id: 'psi',  name: 'psi',  toBase: 6.89476 },
    { id: 'bar',  name: 'bar',  toBase: 100 },
    { id: 'atm',  name: 'atm',  toBase: 101.325 },
    { id: 'mmHg', name: 'mmHg', toBase: 0.133322 },
  ],
  concentration: [
    { id: 'mgL',        name: 'mg/L',                                 toBase: 1 },
    { id: 'ppm',        name: 'ppm (≈ mg/L, dilute water)',           toBase: 1 },
    { id: 'ugL',        name: 'µg/L (ppb)',                           toBase: 0.001 },
    { id: 'gm3',        name: 'g/m³ (= mg/L)',                        toBase: 1 },
    { id: 'mgm3',       name: 'mg/m³',                                toBase: 0.001 },
    { id: 'gL',         name: 'g/L',                                  toBase: 1000 },
    { id: 'kgm3',       name: 'kg/m³',                                toBase: 1000 },
    { id: 'lbMgalUS',   name: 'lb / million US gal',                  toBase: 0.1198264273 },
    { id: 'lb100galUS', name: 'lb / 100 US gal',                      toBase: 1198.264273 },
    { id: 'ozGalUSmass',name: 'oz mass / US gal',                     toBase: 7489.086034 },
  ],
  ionic: [
    { id: 'meqL',    name: 'meq/L (solution)',                toBase: 1,    group: 'solution' },
    { id: 'cmolL',   name: 'cmol(+)/L (solution)',            toBase: 10,   group: 'solution' },
    { id: 'mmolL',   name: 'mmol/L (monovalent)',             toBase: 1,    group: 'solution' },
    { id: 'umolL',   name: 'µmol/L (monovalent)',             toBase: 0.001,group: 'solution' },
    { id: 'meq100g', name: 'meq/100 g (soil, CEC)',           toBase: 1,    group: 'soil' },
    { id: 'cmolKg',  name: 'cmolc/kg (soil)',                 toBase: 1,    group: 'soil' },
  ],
};

export const MEASURE_CATEGORIES = [
  { id: 'length',        label: 'Length' },
  { id: 'area',          label: 'Area' },
  { id: 'volume',        label: 'Volume' },
  { id: 'weight',        label: 'Mass / Weight' },
  { id: 'temperature',   label: 'Temperature' },
  { id: 'pressure',      label: 'Pressure' },
  { id: 'concentration', label: 'Concentration' },
  { id: 'ionic',         label: 'Ionic (soil / solution)' },
];

/** Convert between measure units. Returns null when conversion is blocked (e.g. soil↔solution). */
export function convertMeasure(
  value: number,
  from: UnitDef,
  to: UnitDef,
  category: string
): number | null {
  if (category === 'temperature') {
    let c: number;
    if (from.id === 'F') c = (value - 32) * 5 / 9;
    else if (from.id === 'K') c = value - 273.15;
    else c = value;
    if (to.id === 'F') return c * 9 / 5 + 32;
    if (to.id === 'K') return c + 273.15;
    return c;
  }
  if (from.group && to.group && from.group !== to.group) return null;
  const base = value * from.toBase;
  return base / to.toBase;
}

// ============================================================================
// 4. HYDROPONIC SOLUTION — equivalent weights & equilibrium polygons
// ============================================================================

export const HYDRO_EQ_WEIGHTS: Record<string, number> = {
  N_NO3: 14.0,
  N_NH4: 14.0,
  P: 31.0,
  K: 39.1,
  Ca: 20.04,
  Mg: 12.15,
  S: 16.03,
  Cl: 35.45,
};

export const HYDRO_MEQ_NUTRIENTS = ['N_NO3', 'P', 'S', 'Cl', 'K', 'Ca', 'Mg', 'N_NH4'];

export const HYDRO_ANION_LIMITS = { NO3: [20, 80], H2PO4: [1.25, 10], SO4: [10, 70] };
export const HYDRO_CATION_LIMITS = { K: [10, 65], Ca: [22.5, 62.5], Mg: [0.5, 40] };

export const HYDRO_ANION_POLYGON: [number, number, number][] = [
  [20, 10, 70], [28.75, 1.25, 70], [80, 1.25, 18.75], [80, 10, 10],
];

export const HYDRO_CATION_POLYGON: [number, number, number][] = [
  [10, 62.5, 27.5], [32.5, 62.5, 5], [65, 30, 5],
  [65, 22.5, 12.5], [37.5, 22.5, 40], [10, 50, 40],
];

export const HYDRO_NUTRIENT_LABELS: Record<string, { ion: string; name: string }> = {
  N_NO3: { ion: 'N-NO₃⁻', name: 'Nitrate' },
  N_NH4: { ion: 'N-NH₄⁺', name: 'Ammonium' },
  P:     { ion: 'P-H₂PO₄⁻', name: 'Phosphate' },
  S:     { ion: 'S-SO₄²⁻', name: 'Sulfate' },
  Cl:    { ion: 'Cl⁻',     name: 'Chloride' },
  K:     { ion: 'K⁺',      name: 'Potassium' },
  Ca:    { ion: 'Ca²⁺',    name: 'Calcium' },
  Mg:    { ion: 'Mg²⁺',    name: 'Magnesium' },
};

// ============================================================================
// 5. WATER HARDNESS — constants
// ============================================================================

export const EQ_CACO3 = 50.043;
export const PPM_CACO3_PER_PPM_CA = 100.086 / 40.078;
export const PPM_CACO3_PER_PPM_MG = 100.086 / 24.305;
export const PPM_PER_DH = 17.848;
export const PPM_PER_EH = 14.254;
export const PPM_PER_FH = 10.0;

export interface AcidDef {
  id: string;
  name: string;
  meqPerMl: number;
  densityKgL: number;
}

export const ACIDS: AcidDef[] = [
  { id: 'acido_nitrico_55',   name: 'Nitric Acid 55%',    meqPerMl: 11.6, densityKgL: 1.37 },
  { id: 'acido_sulfurico_98', name: 'Sulfuric Acid 98%',  meqPerMl: 36.7, densityKgL: 1.84 },
  { id: 'acido_fosforico_75', name: 'Phosphoric Acid 75%', meqPerMl: 12.0, densityKgL: 1.57 },
  { id: 'acido_fosforico_85', name: 'Phosphoric Acid 85%', meqPerMl: 14.6, densityKgL: 1.69 },
];

export function hardnessClassByPpm(ppm: number): { label: string; color: string } {
  if (ppm < 60)  return { label: 'Soft',             color: '#16a34a' };
  if (ppm < 120) return { label: 'Moderately hard',  color: '#0891b2' };
  if (ppm < 180) return { label: 'Hard',             color: '#ca8a04' };
  return            { label: 'Very hard',          color: '#dc2626' };
}

// ============================================================================
// 6. VPD ESTIMATOR — formulas & classification
// ============================================================================

export function svpFromTemp(t: number): number {
  return 0.6108 * Math.exp((17.27 * t) / (t + 237.3));
}

export function satAbsHum(t: number): number {
  return 5.018 + 0.32321 * t + 0.0081847 * t * t + 0.00031243 * t * t * t;
}

export function leafTempFromRadiation(airTemp: number, solarRad: number): number {
  if (solarRad > 200) return airTemp + (((solarRad - 200) * 0.6) / 100);
  return airTemp;
}

export interface VpdResult {
  vpd: number;  // kPa
  hd: number;   // g/m³
  leafTemp?: number;
}

export function calcVpdSimple(airTemp: number, humidity: number): VpdResult {
  const es = svpFromTemp(airTemp);
  const ea = es * (humidity / 100);
  const vpd = es - ea;
  const hd = satAbsHum(airTemp) * ((100 - humidity) / 100);
  return { vpd: Math.round(vpd * 100) / 100, hd: Math.round(hd * 100) / 100 };
}

export function calcVpdAdvanced(
  airTemp: number,
  humidity: number,
  leafTemp: number
): VpdResult {
  const esLeaf = svpFromTemp(leafTemp);
  const esAir = svpFromTemp(airTemp);
  const ea = esAir * (humidity / 100);
  const vpd = esLeaf - ea;
  const hd = satAbsHum(leafTemp) - satAbsHum(airTemp) * (humidity / 100);
  return {
    vpd: Math.round(vpd * 100) / 100,
    hd: Math.round(hd * 100) / 100,
    leafTemp,
  };
}

export function vpdStatus(vpd: number): { color: string; label: string } {
  if (vpd < 0.5) return { color: '#3b82f6', label: 'Low' };
  if (vpd > 1.5) return { color: '#ef4444', label: 'High' };
  return            { color: '#10b981', label: 'Optimal' };
}

export function hdClass(hd: number): { label: string; message: string; color: string } {
  if (!Number.isFinite(hd)) return { label: 'N/A',  message: 'Not enough data', color: '#64748b' };
  if (hd < 3)  return { label: 'Very low',     message: 'Humid environment; low evaporative demand',      color: '#2563eb' };
  if (hd < 6)  return { label: 'Low-moderate', message: 'Manageable demand',                              color: '#16a34a' };
  if (hd < 10) return { label: 'Moderate',     message: 'Active transpiration; watch sensitive crops',    color: '#ca8a04' };
  if (hd <= 15)return { label: 'High',         message: 'High evaporative demand',                        color: '#ea580c' };
  return            { label: 'Very high',     message: 'Very high demand; validate in field',             color: '#dc2626' };
}

// ============================================================================
// 7. AMENDMENT BALANCE BY CEC
// ============================================================================

export const IDEAL_CATION_RANGES: Record<string, { min: number; max: number }> = {
  k:  { min: 3,  max: 7  },
  ca: { min: 65, max: 75 },
  mg: { min: 10, max: 15 },
  h:  { min: 0,  max: 10 },
  na: { min: 0,  max: 1  },
  al: { min: 0,  max: 1  },
};

export const CATION_LABELS: Record<string, { ion: string; name: string }> = {
  k:  { ion: 'K⁺',   name: 'Potassium' },
  ca: { ion: 'Ca²⁺', name: 'Calcium' },
  mg: { ion: 'Mg²⁺', name: 'Magnesium' },
  h:  { ion: 'H⁺',   name: 'Hydrogen' },
  na: { ion: 'Na⁺',  name: 'Sodium' },
  al: { ion: 'Al³⁺', name: 'Aluminum' },
};

export interface AmendmentDef {
  id: string;
  name: string;
  formula: string;
  ca: number;
  mg: number;
  k: number;
  so4: number;
  co3: number;
  h2o: number;
  si: number;
}

export const BASE_AMENDMENTS: AmendmentDef[] = [
  { id: 'gypsum',       name: 'Gypsum (Agricultural)',        formula: 'CaSO₄·2H₂O',  ca: 23.3, mg: 0,    k: 0,    so4: 55.8, co3: 0,    h2o: 20.9, si: 0 },
  { id: 'lime',         name: 'Lime (Agricultural)',          formula: 'CaCO₃',        ca: 40.0, mg: 0,    k: 0,    so4: 0,    co3: 60,   h2o: 0,    si: 0 },
  { id: 'dolomite',     name: 'Dolomitic Lime',               formula: 'CaCO₃+MgCO₃',  ca: 21.7, mg: 13.2, k: 0,    so4: 0,    co3: 65.2, h2o: 0,    si: 0 },
  { id: 'mgso4-mono',   name: 'Mg Sulfate Monohydrate',       formula: 'MgSO₄·H₂O',    ca: 0,    mg: 17,   k: 0,    so4: 69,   co3: 0,    h2o: 14,   si: 0 },
  { id: 'sop-granular', name: 'Potassium Sulfate (SOP)',      formula: 'K₂SO₄',        ca: 0,    mg: 0,    k: 41.5, so4: 54.1, co3: 0,    h2o: 0,    si: 0 },
];

export const EQUIV_WEIGHTS = { ca: 20.04, mg: 12.15, k: 39.1, na: 23.0 };

export function cationStatus(
  value: number,
  cic: number
): { pct: number; status: 'ok' | 'low' | 'high' | 'none' } {
  if (!Number.isFinite(value) || value === 0 || cic === 0) {
    return { pct: 0, status: 'none' };
  }
  const pct = (value / cic) * 100;
  // Find the matching cation
  return { pct, status: 'ok' };
}

export function phIndicator(ph: number): { label: string; color: string } {
  if (!ph) return { label: 'Enter pH', color: '#64748b' };
  if (ph < 6.5) return { label: 'Acidic',  color: '#dc2626' };
  if (ph <= 7.2) return { label: 'Neutral', color: '#16a34a' };
  return { label: 'Alkaline', color: '#ca8a04' };
}

// ============================================================================
// 8. GRANULAR MIX — base materials library
// ============================================================================

export const GRANULAR_KEYS = ['N','P2O5','K2O','CaO','MgO','SO4','Fe','Mn','B','Zn','Cu','Mo','SiO2'] as const;
export type GranularKey = typeof GRANULAR_KEYS[number];

export const GRANULAR_MATERIALS: Record<string, Record<string, number>> = {
  'Urea':                                { N:46,   P2O5:0,  K2O:0,  CaO:0,    SO4:0,    MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Nitrophosphate 33-03-00':             { N:33,   P2O5:3,  K2O:0,  CaO:0,    SO4:0,    MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Ammonium Sulfate (Granular)':         { N:21,   P2O5:0,  K2O:0,  CaO:0,    SO4:72,   MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'DAP':                                 { N:18,   P2O5:46, K2O:0,  CaO:0,    SO4:0,    MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'MAP':                                 { N:11,   P2O5:52, K2O:0,  CaO:0,    SO4:0,    MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Single Superphosphate':               { N:0,    P2O5:18, K2O:0,  CaO:12,   SO4:12,   MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Triple Superphosphate':               { N:0,    P2O5:45, K2O:0,  CaO:13,   SO4:0,    MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Potassium Sulfate':                   { N:0,    P2O5:0,  K2O:50, CaO:0,    SO4:52,   MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Potassium Chloride (MOP)':            { N:0,    P2O5:0,  K2O:60, CaO:0,    SO4:0,    MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Potassium Nitrate':                   { N:13,   P2O5:0,  K2O:46, CaO:0,    SO4:0,    MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Potassium Silicate':                  { N:0,    P2O5:0,  K2O:23, CaO:0,    SO4:0,    MgO:0,    SiO2:26,   Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Calcium Nitrate':                     { N:15.5, P2O5:0,  K2O:0,  CaO:26,   SO4:0,    MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'K-Mg Sulfate (Langbeinite)':          { N:0,    P2O5:0,  K2O:22, CaO:0,    SO4:68.91,MgO:18,   SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Magnesium Sulfate':                   { N:0,    P2O5:0,  K2O:0,  CaO:0,    SO4:40,   MgO:16,   SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Iron Sulfate':                        { N:0,    P2O5:0,  K2O:0,  CaO:0,    SO4:55,   MgO:0,    SiO2:0,    Zn:0,    Fe:20,  B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Manganese Sulfate':                   { N:0,    P2O5:0,  K2O:0,  CaO:0,    SO4:55,   MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:32,   Cu:0,    Mo:0   },
  'Zinc Sulfate':                        { N:0,    P2O5:0,  K2O:0,  CaO:0,    SO4:52,   MgO:0,    SiO2:0,    Zn:36,   Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Granular Boron':                      { N:0,    P2O5:0,  K2O:0,  CaO:0,    SO4:0,    MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:15,    Mn:0,    Cu:0,    Mo:0   },
  'Copper Sulfate':                      { N:0,    P2O5:0,  K2O:0,  CaO:0,    SO4:37,   MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:25,   Mo:0   },
  'Sodium Molybdate':                    { N:0,    P2O5:0,  K2O:0,  CaO:0,    SO4:0,    MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:39  },
  'Micro Mix':                           { N:0,    P2O5:0,  K2O:0,  CaO:0,    SO4:6.25, MgO:4,    SiO2:0,    Zn:4,    Fe:8,   B:1,     Mn:1,    Cu:0,    Mo:0.06},
  'Complex 12-11-18':                    { N:12,   P2O5:11, K2O:18, CaO:0,    SO4:24,   MgO:2.7,  SiO2:0,    Zn:0.02, Fe:0.2, B:0.015, Mn:0.02, Cu:0,    Mo:0   },
  'Complex 12-12-17':                    { N:12,   P2O5:12, K2O:17, CaO:0,    SO4:24,   MgO:2,    SiO2:0,    Zn:0.01, Fe:0,   B:0.02,  Mn:0,    Cu:0,    Mo:0   },
  'Complex Triple 16':                   { N:16,   P2O5:16, K2O:16, CaO:0,    SO4:0,    MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
};

export const GRANULAR_KEY_LABELS: Record<string, string> = {
  N: 'N', P2O5: 'P₂O₅', K2O: 'K₂O', CaO: 'CaO', MgO: 'MgO',
  SO4: 'SO₄', Fe: 'Fe', Mn: 'Mn', B: 'B', Zn: 'Zn', Cu: 'Cu', Mo: 'Mo', SiO2: 'SiO₂',
};

// ============================================================================
// 9. FERTILIZER COMPOSITION — atomic weights, oxide factors, formula engine
// ============================================================================

export const ATOMIC_WEIGHTS: Record<string, number> = {
  H: 1.008, C: 12.011, N: 14.007, O: 15.999, P: 30.974, K: 39.098,
  Ca: 40.078, Mg: 24.305, S: 32.06, Si: 28.085,
  Zn: 65.38, Fe: 55.845, Mn: 54.938, Cu: 63.546, B: 10.81, Mo: 95.95,
  Cl: 35.45, Na: 22.99,
};

export const OXIDE_FACTORS: Record<string, number> = {
  P2O5: 2.29, K2O: 1.20, CaO: 1.40, MgO: 1.66, SiO2: 2.14,
};

export const SUBSCRIPT_MAP: Record<string, string> = {
  '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9',
  '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9',
  '⁺':'+','⁻':'-',
};

/** Normalize a chemical formula string (handle unicode subscripts, separators, brackets). */
export function normalizeFormula(input: string): string {
  let s = String(input);
  for (const [k, v] of Object.entries(SUBSCRIPT_MAP)) s = s.split(k).join(v);
  s = s.replace(/−/g, '-').replace(/\s+/g, '');
  s = s.replace(/[\{\[]/g, '(').replace(/[\}\]]/g, ')');
  s = s.replace(/:/g, '·');
  s = s.replace(/\)\(/g, ')*(');
  s = s.replace(/([0-9)\]])([\*+])([0-9(A-Z])/g, '$1·$3');
  s = s.replace(/\.+/g, '·');
  return s;
}

type Term =
  | { type: 'element'; symbol: string; count: number }
  | { type: 'group'; terms: Term[]; count: number };

function parseNumber(s: string, i: number): [number, number] {
  let j = i;
  let str = '';
  while (j < s.length && /[0-9.]/.test(s[j])) { str += s[j]; j++; }
  return [str ? parseFloat(str) : 1, j];
}

function parseTerms(s: string, i: number, stop: string | null): [Term[], number] {
  const terms: Term[] = [];
  while (i < s.length) {
    const c = s[i];
    if (stop && c === stop) return [terms, i + 1];
    if (c === '(') {
      const [inner, j] = parseTerms(s, i + 1, ')');
      const [count, k] = parseNumber(s, j);
      terms.push({ type: 'group', terms: inner, count });
      i = k;
    } else if (/[A-Z]/.test(c)) {
      let sym = c;
      let j = i + 1;
      if (j < s.length && /[a-z]/.test(s[j])) { sym += s[j]; j++; }
      const [count, k] = parseNumber(s, j);
      terms.push({ type: 'element', symbol: sym, count });
      i = k;
    } else if (c === '+' || c === '-' || c === '^') {
      i++;
    } else {
      throw new Error(`Invalid char in formula: ${c}`);
    }
  }
  if (stop) throw new Error('Unclosed parenthesis');
  return [terms, i];
}

function collectTerms(terms: Term[], mult: number, out: Record<string, number>) {
  for (const t of terms) {
    if (t.type === 'element') {
      out[t.symbol] = (out[t.symbol] || 0) + t.count * mult;
    } else {
      collectTerms(t.terms, mult * t.count, out);
    }
  }
}

function countMotif(terms: Term[], mult: number, motif: { symbol: string; count: number }[]): number {
  let total = 0;
  for (let i = 0; i + motif.length <= terms.length; i++) {
    let ok = true;
    for (let j = 0; j < motif.length; j++) {
      const t = terms[i + j];
      if (t.type !== 'element' || t.symbol !== motif[j].symbol || Math.abs(t.count - motif[j].count) > 1e-9) {
        ok = false; break;
      }
    }
    if (ok) total += mult;
  }
  for (const t of terms) {
    if (t.type === 'group') total += countMotif(t.terms, mult * t.count, motif);
  }
  return total;
}

export interface CompositionResult {
  ok: boolean;
  mw?: number;
  comp?: Record<string, number>;
  error?: string;
  normalized?: string;
}

/** Compute elemental composition (%) from a chemical formula string. */
export function compFromFormula(input: string): CompositionResult {
  try {
    const normalized = normalizeFormula(input);
    if (!normalized) return { ok: false, error: 'Empty formula' };
    const segments = normalized.split(/[·•.]/).filter(Boolean);
    const atoms: Record<string, number> = {};
    let no3 = 0, nh4 = 0;
    let mw = 0;

    for (const seg of segments) {
      let coef = 1, body = seg;
      const m = seg.match(/^(\d+(?:\.\d+)?)(.*)$/);
      if (m && m[2]) { coef = parseFloat(m[1]); body = m[2]; }
      const [terms] = parseTerms(body, 0, null);
      const segAtoms: Record<string, number> = {};
      collectTerms(terms, coef, segAtoms);
      for (const [sym, cnt] of Object.entries(segAtoms)) {
        atoms[sym] = (atoms[sym] || 0) + cnt;
        if (ATOMIC_WEIGHTS[sym]) mw += cnt * ATOMIC_WEIGHTS[sym];
      }
      no3 += countMotif(terms, coef, [{ symbol: 'N', count: 1 }, { symbol: 'O', count: 3 }]);
      nh4 += countMotif(terms, coef, [{ symbol: 'N', count: 1 }, { symbol: 'H', count: 4 }]);
    }

    if (mw <= 0) return { ok: false, error: 'Could not compute molecular weight' };

    const comp: Record<string, number> = {};
    const nAtoms = atoms['N'] || 0;
    for (const sym of ['N','P','K','Ca','Mg','S','Si','C','H','O','Zn','Fe','Mn','B','Cu','Mo']) {
      if (atoms[sym]) comp[sym] = (atoms[sym] * ATOMIC_WEIGHTS[sym] / mw) * 100;
    }
    // N partition into NO3 / NH4
    if (nAtoms > 0 && (no3 > 0 || nh4 > 0)) {
      let no3Atoms = Math.max(0, no3);
      let nh4Atoms = Math.max(0, nh4);
      const forms = no3Atoms + nh4Atoms;
      if (forms > nAtoms && forms > 0) {
        const k = nAtoms / forms;
        no3Atoms *= k; nh4Atoms *= k;
      }
      comp['N_NO3'] = comp['N'] * (no3Atoms / nAtoms);
      comp['N_NH4'] = comp['N'] * (nh4Atoms / nAtoms);
    }
    // Oxide equivalents
    comp['P2O5'] = (comp['P'] || 0) * OXIDE_FACTORS.P2O5;
    comp['K2O']  = (comp['K']  || 0) * OXIDE_FACTORS.K2O;
    comp['CaO']  = (comp['Ca'] || 0) * OXIDE_FACTORS.CaO;
    comp['MgO']  = (comp['Mg'] || 0) * OXIDE_FACTORS.MgO;
    comp['SiO2'] = (comp['Si'] || 0) * OXIDE_FACTORS.SiO2;

    return { ok: true, mw, comp, normalized };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Parse error' };
  }
}

// ============================================================================
// 10. NUTRIENT DISTRIBUTION BY STAGE — defaults
// ============================================================================

export const STAGE_BASE = [
  { id: 'n',  label: 'N',  total: 180 },
  { id: 'p',  label: 'P',  total: 40  },
  { id: 'k',  label: 'K',  total: 220 },
  { id: 'ca', label: 'Ca', total: 120 },
  { id: 'mg', label: 'Mg', total: 35  },
];

export const STAGE_OPTIONAL = [
  { id: 's',  label: 'S',  total: 25   },
  { id: 'fe', label: 'Fe', total: 3    },
  { id: 'mn', label: 'Mn', total: 2    },
  { id: 'b',  label: 'B',  total: 0.5  },
  { id: 'zn', label: 'Zn', total: 0.3  },
  { id: 'cu', label: 'Cu', total: 0.2  },
  { id: 'mo', label: 'Mo', total: 0.05 },
];

export const STAGE_DEFAULTS = ['Bud break', 'Vegetative', 'Flowering', 'Filling', 'Ripening'];

export const STAGE_DEFAULT_PCT: Record<string, number[]> = {
  n:  [10, 30, 20, 30, 10],
  p:  [15, 25, 25, 20, 15],
  k:  [5,  20, 25, 35, 15],
  ca: [12, 28, 22, 28, 10],
  mg: [12, 28, 22, 28, 10],
};

export const STAGE_COLORS = [
  '#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#0891b2',
  '#ca8a04', '#db2777', '#0d9488', '#4f46e5', '#64748b',
  '#059669', '#b45309', '#be185d',
];

// ============================================================================
// 11. PERIODIC TABLE — elements, atomic weights, details
// ============================================================================

export const ESSENTIAL_ELEMENTS = new Set(['N','P','K','Ca','Mg','S','Fe','Mn','Zn','Cu','B','Mo','Cl','Ni']);
export const BENEFICIAL_ELEMENTS = new Set(['Si','Na','Ti','Al','Co','Se','V']);
export const CHO_ELEMENTS = new Set(['C','H','O']);

export function elementCategory(sym: string): 'cho' | 'essential' | 'beneficial' | 'other' {
  if (CHO_ELEMENTS.has(sym)) return 'cho';
  if (ESSENTIAL_ELEMENTS.has(sym)) return 'essential';
  if (BENEFICIAL_ELEMENTS.has(sym)) return 'beneficial';
  return 'other';
}

export interface PeriodicElement {
  z: number;
  s: string;
  n: string;
  p: number;
  g: number;
}

export const PERIODIC_ELEMENTS: PeriodicElement[] = [
  { z:1,s:'H',n:'Hydrogen',p:1,g:1 }, { z:2,s:'He',n:'Helium',p:1,g:18 },
  { z:3,s:'Li',n:'Lithium',p:2,g:1 }, { z:4,s:'Be',n:'Beryllium',p:2,g:2 }, { z:5,s:'B',n:'Boron',p:2,g:13 }, { z:6,s:'C',n:'Carbon',p:2,g:14 }, { z:7,s:'N',n:'Nitrogen',p:2,g:15 }, { z:8,s:'O',n:'Oxygen',p:2,g:16 }, { z:9,s:'F',n:'Fluorine',p:2,g:17 }, { z:10,s:'Ne',n:'Neon',p:2,g:18 },
  { z:11,s:'Na',n:'Sodium',p:3,g:1 }, { z:12,s:'Mg',n:'Magnesium',p:3,g:2 }, { z:13,s:'Al',n:'Aluminum',p:3,g:13 }, { z:14,s:'Si',n:'Silicon',p:3,g:14 }, { z:15,s:'P',n:'Phosphorus',p:3,g:15 }, { z:16,s:'S',n:'Sulfur',p:3,g:16 }, { z:17,s:'Cl',n:'Chlorine',p:3,g:17 }, { z:18,s:'Ar',n:'Argon',p:3,g:18 },
  { z:19,s:'K',n:'Potassium',p:4,g:1 }, { z:20,s:'Ca',n:'Calcium',p:4,g:2 }, { z:21,s:'Sc',n:'Scandium',p:4,g:3 }, { z:22,s:'Ti',n:'Titanium',p:4,g:4 }, { z:23,s:'V',n:'Vanadium',p:4,g:5 }, { z:24,s:'Cr',n:'Chromium',p:4,g:6 }, { z:25,s:'Mn',n:'Manganese',p:4,g:7 }, { z:26,s:'Fe',n:'Iron',p:4,g:8 }, { z:27,s:'Co',n:'Cobalt',p:4,g:9 }, { z:28,s:'Ni',n:'Nickel',p:4,g:10 }, { z:29,s:'Cu',n:'Copper',p:4,g:11 }, { z:30,s:'Zn',n:'Zinc',p:4,g:12 }, { z:31,s:'Ga',n:'Gallium',p:4,g:13 }, { z:32,s:'Ge',n:'Germanium',p:4,g:14 }, { z:33,s:'As',n:'Arsenic',p:4,g:15 }, { z:34,s:'Se',n:'Selenium',p:4,g:16 }, { z:35,s:'Br',n:'Bromine',p:4,g:17 }, { z:36,s:'Kr',n:'Krypton',p:4,g:18 },
  { z:37,s:'Rb',n:'Rubidium',p:5,g:1 }, { z:38,s:'Sr',n:'Strontium',p:5,g:2 }, { z:39,s:'Y',n:'Yttrium',p:5,g:3 }, { z:40,s:'Zr',n:'Zirconium',p:5,g:4 }, { z:41,s:'Nb',n:'Niobium',p:5,g:5 }, { z:42,s:'Mo',n:'Molybdenum',p:5,g:6 }, { z:43,s:'Tc',n:'Technetium',p:5,g:7 }, { z:44,s:'Ru',n:'Ruthenium',p:5,g:8 }, { z:45,s:'Rh',n:'Rhodium',p:5,g:9 }, { z:46,s:'Pd',n:'Palladium',p:5,g:10 }, { z:47,s:'Ag',n:'Silver',p:5,g:11 }, { z:48,s:'Cd',n:'Cadmium',p:5,g:12 }, { z:49,s:'In',n:'Indium',p:5,g:13 }, { z:50,s:'Sn',n:'Tin',p:5,g:14 }, { z:51,s:'Sb',n:'Antimony',p:5,g:15 }, { z:52,s:'Te',n:'Tellurium',p:5,g:16 }, { z:53,s:'I',n:'Iodine',p:5,g:17 }, { z:54,s:'Xe',n:'Xenon',p:5,g:18 },
  { z:55,s:'Cs',n:'Cesium',p:6,g:1 }, { z:56,s:'Ba',n:'Barium',p:6,g:2 }, { z:57,s:'La',n:'Lanthanum',p:6,g:3 }, { z:72,s:'Hf',n:'Hafnium',p:6,g:4 }, { z:73,s:'Ta',n:'Tantalum',p:6,g:5 }, { z:74,s:'W',n:'Tungsten',p:6,g:6 }, { z:75,s:'Re',n:'Rhenium',p:6,g:7 }, { z:76,s:'Os',n:'Osmium',p:6,g:8 }, { z:77,s:'Ir',n:'Iridium',p:6,g:9 }, { z:78,s:'Pt',n:'Platinum',p:6,g:10 }, { z:79,s:'Au',n:'Gold',p:6,g:11 }, { z:80,s:'Hg',n:'Mercury',p:6,g:12 }, { z:81,s:'Tl',n:'Thallium',p:6,g:13 }, { z:82,s:'Pb',n:'Lead',p:6,g:14 }, { z:83,s:'Bi',n:'Bismuth',p:6,g:15 }, { z:84,s:'Po',n:'Polonium',p:6,g:16 }, { z:85,s:'At',n:'Astatine',p:6,g:17 }, { z:86,s:'Rn',n:'Radon',p:6,g:18 },
  { z:87,s:'Fr',n:'Francium',p:7,g:1 }, { z:88,s:'Ra',n:'Radium',p:7,g:2 }, { z:89,s:'Ac',n:'Actinium',p:7,g:3 }, { z:104,s:'Rf',n:'Rutherfordium',p:7,g:4 }, { z:105,s:'Db',n:'Dubnium',p:7,g:5 }, { z:106,s:'Sg',n:'Seaborgium',p:7,g:6 }, { z:107,s:'Bh',n:'Bohrium',p:7,g:7 }, { z:108,s:'Hs',n:'Hassium',p:7,g:8 }, { z:109,s:'Mt',n:'Meitnerium',p:7,g:9 }, { z:110,s:'Ds',n:'Darmstadtium',p:7,g:10 }, { z:111,s:'Rg',n:'Roentgenium',p:7,g:11 }, { z:112,s:'Cn',n:'Copernicium',p:7,g:12 }, { z:113,s:'Nh',n:'Nihonium',p:7,g:13 }, { z:114,s:'Fl',n:'Flerovium',p:7,g:14 }, { z:115,s:'Mc',n:'Moscovium',p:7,g:15 }, { z:116,s:'Lv',n:'Livermorium',p:7,g:16 }, { z:117,s:'Ts',n:'Tennessine',p:7,g:17 }, { z:118,s:'Og',n:'Oganesson',p:7,g:18 },
  // Lanthanides (period 8)
  { z:58,s:'Ce',n:'Cerium',p:8,g:4 }, { z:59,s:'Pr',n:'Praseodymium',p:8,g:5 }, { z:60,s:'Nd',n:'Neodymium',p:8,g:6 }, { z:61,s:'Pm',n:'Promethium',p:8,g:7 }, { z:62,s:'Sm',n:'Samarium',p:8,g:8 }, { z:63,s:'Eu',n:'Europium',p:8,g:9 }, { z:64,s:'Gd',n:'Gadolinium',p:8,g:10 }, { z:65,s:'Tb',n:'Terbium',p:8,g:11 }, { z:66,s:'Dy',n:'Dysprosium',p:8,g:12 }, { z:67,s:'Ho',n:'Holmium',p:8,g:13 }, { z:68,s:'Er',n:'Erbium',p:8,g:14 }, { z:69,s:'Tm',n:'Thulium',p:8,g:15 }, { z:70,s:'Yb',n:'Ytterbium',p:8,g:16 }, { z:71,s:'Lu',n:'Lutetium',p:8,g:17 },
  // Actinides (period 9)
  { z:90,s:'Th',n:'Thorium',p:9,g:4 }, { z:91,s:'Pa',n:'Protactinium',p:9,g:5 }, { z:92,s:'U',n:'Uranium',p:9,g:6 }, { z:93,s:'Np',n:'Neptunium',p:9,g:7 }, { z:94,s:'Pu',n:'Plutonium',p:9,g:8 }, { z:95,s:'Am',n:'Americium',p:9,g:9 }, { z:96,s:'Cm',n:'Curium',p:9,g:10 }, { z:97,s:'Bk',n:'Berkelium',p:9,g:11 }, { z:98,s:'Cf',n:'Californium',p:9,g:12 }, { z:99,s:'Es',n:'Einsteinium',p:9,g:13 }, { z:100,s:'Fm',n:'Fermium',p:9,g:14 }, { z:101,s:'Md',n:'Mendelevium',p:9,g:15 }, { z:102,s:'No',n:'Nobelium',p:9,g:16 }, { z:103,s:'Lr',n:'Lawrencium',p:9,g:17 },
];

export interface ElementDetail {
  aw: string;
  val: string;
  rad: string;
  en: string;
  role: string;
}

export const ELEMENT_DETAILS: Record<string, ElementDetail> = {
  H:  { aw: '1.008',   val: '+1',             rad: '53 pm',  en: '2.20', role: 'Structural element (CHO). Present in water and organic compounds.' },
  C:  { aw: '12.011',  val: '-4, +2, +4',     rad: '67 pm',  en: '2.55', role: 'Main structural element of plant biomass.' },
  O:  { aw: '15.999',  val: '-2',             rad: '48 pm',  en: '3.44', role: 'Structural element (water, organics, respiration).' },
  N:  { aw: '14.007',  val: '-3, +3, +5',     rad: '56 pm',  en: '3.04', role: 'Essential macronutrient: proteins, chlorophyll, vegetative growth.' },
  P:  { aw: '30.974',  val: '+5, +3',         rad: '98 pm',  en: '2.19', role: 'Essential macronutrient: energy (ATP), roots, flowering.' },
  K:  { aw: '39.098',  val: '+1',             rad: '227 pm', en: '0.82', role: 'Essential macronutrient: osmotic regulation, quality, transport.' },
  Ca: { aw: '40.078',  val: '+2',             rad: '197 pm', en: '1.00', role: 'Essential macronutrient: cell wall, firmness, apical growth.' },
  Mg: { aw: '24.305',  val: '+2',             rad: '145 pm', en: '1.31', role: 'Essential macronutrient: central chlorophyll atom.' },
  S:  { aw: '32.06',   val: '-2, +4, +6',     rad: '88 pm',  en: '2.58', role: 'Essential macronutrient: sulfur amino acids, metabolism.' },
  Fe: { aw: '55.845',  val: '+2, +3',         rad: '126 pm', en: '1.83', role: 'Essential micronutrient: chlorophyll synthesis, redox enzymes.' },
  Mn: { aw: '54.938',  val: '+2, +4, +7',     rad: '127 pm', en: '1.55', role: 'Essential micronutrient: photosynthesis, enzyme activation.' },
  Zn: { aw: '65.38',   val: '+2',             rad: '134 pm', en: '1.65', role: 'Essential micronutrient: hormone regulation, enzymes.' },
  Cu: { aw: '63.546',  val: '+1, +2',         rad: '128 pm', en: '1.90', role: 'Essential micronutrient: enzymes, oxidative metabolism.' },
  B:  { aw: '10.81',   val: '+3',             rad: '85 pm',  en: '2.04', role: 'Essential micronutrient: cell wall, flowering, fruit set.' },
  Mo: { aw: '95.95',   val: '+6, +4',         rad: '139 pm', en: '2.16', role: 'Essential micronutrient: nitrogen metabolism.' },
  Cl: { aw: '35.45',   val: '-1, +1, +5, +7', rad: '79 pm',  en: '3.16', role: 'Essential trace micronutrient: ionic balance, stomata.' },
  Ni: { aw: '58.693',  val: '+2',             rad: '124 pm', en: '1.91', role: 'Essential at low doses: urease, N metabolism.' },
  Si: { aw: '28.085',  val: '+4',             rad: '111 pm', en: '1.90', role: 'Beneficial element: tissue reinforcement, stress tolerance.' },
  Na: { aw: '22.990',  val: '+1',             rad: '186 pm', en: '0.93', role: 'Beneficial in some species; supports osmotic balance.' },
  Ti: { aw: '47.867',  val: '+4, +3',         rad: '147 pm', en: '1.54', role: 'Beneficial element reported in traces (species-dependent).' },
  Al: { aw: '26.982',  val: '+3',             rad: '143 pm', en: '1.61', role: 'Not essential; often toxic in acid soils.' },
  Co: { aw: '58.933',  val: '+2, +3',         rad: '125 pm', en: '1.88', role: 'Beneficial for biological N fixation (legumes).' },
  Se: { aw: '78.971',  val: '-2, +4, +6',     rad: '103 pm', en: '2.55', role: 'Beneficial trace element; excess can be toxic.' },
  V:  { aw: '50.942',  val: '+5, +4, +3',     rad: '134 pm', en: '1.63', role: 'Beneficial element reported under specific conditions.' },
};

// ============================================================================
// 12. FERTILIZER COMPATIBILITY — matrix data
// ============================================================================

export interface FertilizerCompatDef { id: string; name: string; }

export const FERTILIZERS_COMPAT: FertilizerCompatDef[] = [
  { id: 'urea', name: 'Urea' },
  { id: 'nitrato_amonio', name: 'Ammonium Nitrate' },
  { id: 'fosfonitrato_33_03_00', name: 'Nitrophosphate' },
  { id: 'sulfato_amonio_soluble', name: 'Ammonium Sulfate' },
  { id: 'nitrato_calcio_granular', name: 'Calcium Nitrate (granular)' },
  { id: 'nitrato_calcio_cristal', name: 'Calcium Nitrate (crystal)' },
  { id: 'nitrato_magnesio', name: 'Magnesium Nitrate' },
  { id: 'map', name: 'MAP' },
  { id: 'mkp', name: 'MKP' },
  { id: 'nks', name: 'NKS' },
  { id: 'nk_mg', name: 'NK + Mg' },
  { id: 'sop', name: 'Potassium Sulfate (SOP)' },
  { id: 'kcl_soluble', name: 'Potassium Chloride (KCl)' },
  { id: 'cacl2_dihidratado', name: 'Calcium Chloride' },
  { id: 'sulfato_magnesio', name: 'Magnesium Sulfate' },
  { id: 'triple_19_me', name: 'Triple 19 + Me' },
  { id: 'npk_13_04_25_znb', name: '13-4-25 Zn+B' },
  { id: 'mix_micros_edta', name: 'Mix micros EDTA' },
  { id: 'quelato_fe', name: 'Fe EDTA' },
  { id: 'fe_dtpa', name: 'Fe DTPA' },
  { id: 'fe_eddha', name: 'Fe EDDHA' },
  { id: 'quelato_mn', name: 'Mn EDTA' },
  { id: 'quelato_zn', name: 'Zn EDTA' },
  { id: 'quelato_cu', name: 'Cu EDTA' },
  { id: 'acido_borico', name: 'Boric Acid' },
  { id: 'molibdato_sodio', name: 'Sodium Molybdate' },
  { id: 'sulfatos_micros', name: 'Metal-sulfate micros' },
  { id: 'silicio', name: 'Silicon source' },
  { id: 'acido_fosforico_75', name: 'Phosphoric Acid 75%' },
  { id: 'acido_fosforico_85', name: 'Phosphoric Acid 85%' },
  { id: 'acido_nitrico_55', name: 'Nitric Acid 55%' },
  { id: 'acido_sulfurico_98', name: 'Sulfuric Acid 98%' },
];

export const FERTILIZER_TRAITS: Record<string, Record<string, boolean>> = {
  urea: { urea: true },
  nitrato_amonio: { nh4: true, no3: true },
  fosfonitrato_33_03_00: { n: true, p: true, po4: true },
  sulfato_amonio_soluble: { nh4: true, so4: true },
  nitrato_calcio_granular: { ca_no3: true, ca: true },
  nitrato_calcio_cristal: { ca_no3: true, ca: true },
  nitrato_magnesio: { no3: true, mg: true },
  map: { nh4: true, po4: true, p_acid: true },
  mkp: { k: true, po4: true, p_acid: true },
  nks: { no3: true, k: true, so4: true },
  nk_mg: { no3: true, k: true, mg: true },
  sop: { k: true, so4: true },
  kcl_soluble: { k: true, cl: true },
  cacl2_dihidratado: { ca: true, cl: true },
  sulfato_magnesio: { mg: true, so4: true },
  triple_19_me: { npk: true, po4: true, nh4: true, no3: true, k: true, micro: true },
  npk_13_04_25_znb: { npk: true, po4: true, nh4: true, no3: true, k: true, so4: true, micro: true },
  mix_micros_edta: { chelate: true, edta: true, micro: true },
  quelato_fe: { chelate: true, edta: true, fe: true },
  fe_dtpa: { chelate: true, dtpa: true, fe: true },
  fe_eddha: { chelate: true, eddha: true, fe: true },
  quelato_mn: { chelate: true, edta: true, mn: true },
  quelato_zn: { chelate: true, edta: true, zn: true },
  quelato_cu: { chelate: true, edta: true, cu: true },
  acido_borico: { b: true, weak_acid: true },
  molibdato_sodio: { mo: true },
  sulfatos_micros: { metal_sulfate: true, so4: true, micro: true },
  silicio: { si: true },
  acido_fosforico_75: { strong_acid: true, h3po4: true, po4: true },
  acido_fosforico_85: { strong_acid: true, h3po4: true, po4: true },
  acido_nitrico_55: { strong_acid: true, hno3: true, no3: true },
  acido_sulfurico_98: { strong_acid: true, h2so4: true, so4: true },
};

export const COMPAT_OVERRIDE: Record<string, 'C' | 'R' | 'I'> = {
  'mkp|nitrato_calcio_granular': 'I',
  'map|nitrato_calcio_granular': 'I',
  'map|nitrato_calcio_cristal': 'I',
  'mkp|nitrato_calcio_cristal': 'I',
  'sulfato_amonio_soluble|nitrato_calcio_granular': 'I',
  'sulfato_amonio_soluble|nitrato_calcio_cristal': 'I',
  'sulfato_magnesio|nitrato_calcio_granular': 'I',
  'sulfato_magnesio|nitrato_calcio_cristal': 'I',
  'sop|nitrato_calcio_granular': 'I',
  'sop|nitrato_calcio_cristal': 'I',
  'acido_fosforico_75|nitrato_calcio_granular': 'I',
  'acido_fosforico_75|nitrato_calcio_cristal': 'I',
  'acido_fosforico_85|nitrato_calcio_granular': 'I',
  'acido_fosforico_85|nitrato_calcio_cristal': 'I',
  'acido_sulfurico_98|nitrato_calcio_granular': 'I',
  'acido_sulfurico_98|nitrato_calcio_cristal': 'I',
  'nks|sulfato_amonio_soluble': 'R',
  'sop|nks': 'R',
  'map|sulfatos_micros': 'I',
  'mkp|sulfatos_micros': 'I',
  'mix_micros_edta|map': 'R',
  'mix_micros_edta|mkp': 'R',
  'fe_eddha|map': 'R',
  'fe_eddha|mkp': 'R',
  'nitrato_magnesio|mix_micros_edta': 'R',
  'nitrato_magnesio|quelato_fe': 'R',
};

export function inferCompatLevel(aid: string, bid: string): 'C' | 'R' | 'I' {
  if (aid === bid) return 'C';
  const k = aid < bid ? `${aid}|${bid}` : `${bid}|${aid}`;
  if (COMPAT_OVERRIDE[k]) return COMPAT_OVERRIDE[k];
  const A = FERTILIZER_TRAITS[aid] || {};
  const B = FERTILIZER_TRAITS[bid] || {};
  const ca = A.ca_no3 || B.ca_no3;
  const has = (t: string) => !!(A[t] || B[t]);
  const isMap = aid === 'map' || bid === 'map';
  const isMkp = aid === 'mkp' || bid === 'mkp';

  if (ca && (has('po4') || has('p_acid') || (has('npk') && (A.po4 || B.po4)))) {
    if ((A.po4 || B.po4 || A.npk || B.npk) && !has('hno3')) return 'I';
  }
  if (ca && (has('h3po4') || (A.strong_acid && A.h3po4) || (B.strong_acid && B.h3po4))) return 'I';
  if (ca && (has('h2so4') || A.h2so4 || B.h2so4)) return 'I';

  if (ca && has('so4') && (A.so4 || B.so4)) {
    if ((A.nh4 && A.so4) || (B.nh4 && B.so4)) return 'I';
    if ([aid, bid].some(x => ['sop', 'sulfato_magnesio'].includes(x))) return 'I';
    if ([aid, bid].some(x => x === 'nks')) return 'I';
  }

  if (has('metal_sulfate') && (has('po4') || isMap || isMkp)) return 'I';
  if ((A.chelate || B.chelate) && (isMap || isMkp || (has('po4') && (A.npk || B.npk)))) return 'R';
  if ([aid, bid].some(x => ['nks', 'nk_mg'].includes(x)) && (has('nh4') && has('so4'))) return 'R';
  if ([aid, bid].some(x => x === 'nks') && [aid, bid].some(x => x === 'sop')) return 'R';
  if (A.strong_acid && B.strong_acid && aid !== bid) return 'R';

  return 'C';
}

export const COMPAT_LABELS: Record<'C'|'R'|'I', { label: string; color: string; bg: string; title: string }> = {
  C: { label: 'C', color: '#14532d', bg: '#bbf7d0', title: 'Compatible' },
  R: { label: 'R', color: '#713f12', bg: '#fef08a', title: 'Caution' },
  I: { label: 'I', color: '#7f1d1d', bg: '#fecaca', title: 'Incompatible' },
};

// ============================================================================
// 13. NUTRIENT INTERACTIONS — Mulder diagram + mobility + pH curves
// ============================================================================

export interface IonSpec {
  id: string;
  ion: string;
  name: string;
  antagonists: string[];
  synergists: string[];
  functional: string[];
  shortTip: string;
}

export const ION_SPEC: IonSpec[] = [
  { id: 'no3', ion: 'NO₃⁻', name: 'Nitrate',
    antagonists: ['cl'], synergists: ['k','nh4','moo4'],
    functional: ['Protein synthesis (with NH₄⁺)','Anion balance','Cation uptake relation'],
    shortTip: 'Blue synergies = frequent joint management (e.g. KNO₃, NH₄+NO₃, Mo in NO₃ chain). Excess Cl⁻ can compete for transport.' },
  { id: 'nh4', ion: 'NH₄⁺', name: 'Ammonium',
    antagonists: ['k','ca','mg'], synergists: ['h2po4','so4','no3'],
    functional: ['Direct assimilation','Rhizosphere pH effect'],
    shortTip: 'High NH₄⁺ can compete with K⁺, Ca²⁺, Mg²⁺ for transport and alter cation balance.' },
  { id: 'h2po4', ion: 'H₂PO₄⁻', name: 'Phosphate',
    antagonists: ['zn','fe','cu','mn','ca'], synergists: ['nh4','k','mg'],
    functional: ['Energy (ATP/ADP)','Nucleic acids','Root strategy'],
    shortTip: 'High P often antagonizes micros (Zn, Fe, Cu, Mn) and Ca²⁺ (precipitation in calcareous soils).' },
  { id: 'k', ion: 'K⁺', name: 'Potassium',
    antagonists: ['mg','ca','nh4'], synergists: ['no3','h2po4','so4','cl'],
    functional: ['Osmotic regulation','Sugar transport','Stomatal control'],
    shortTip: 'High K can pressure Mg and Ca uptake, especially with unbalanced cation ratio.' },
  { id: 'ca', ion: 'Ca²⁺', name: 'Calcium',
    antagonists: ['mg','k','nh4','h2po4'], synergists: ['so4','no3','moo4'],
    functional: ['Cell wall','Membranes','Signal transmission'],
    shortTip: 'Excess P can reduce Ca²⁺ availability by precipitation; low transpiration affects fruit/young tissue delivery.' },
  { id: 'mg', ion: 'Mg²⁺', name: 'Magnesium',
    antagonists: ['k','ca','nh4'], synergists: ['h2po4','so4','no3'],
    functional: ['Chlorophyll center','Enzyme activation'],
    shortTip: 'Relative excess of K, Ca or NH₄ can affect Mg balance.' },
  { id: 'so4', ion: 'SO₄²⁻', name: 'Sulfate',
    antagonists: ['moo4'], synergists: ['no3','nh4','k'],
    functional: ['Sulfur amino acids','Stress and defense'],
    shortTip: 'Excess sulfate can affect MoO₄²⁻ uptake (anionic competition).' },
  { id: 'fe', ion: 'Fe²⁺/Fe³⁺', name: 'Iron',
    antagonists: ['h2po4','zn','cu','mn'], synergists: ['no3','moo4'],
    functional: ['Chloroplasts','Redox enzymes'],
    shortTip: 'High P, Zn, Cu or Mn (in acid) worsen Fe availability; high pH and carbonates too.' },
  { id: 'mn', ion: 'Mn²⁺', name: 'Manganese',
    antagonists: ['h2po4','fe','zn','cu'], synergists: ['no3'],
    functional: ['Photosynthesis','Enzyme activation'],
    shortTip: 'Interacts with pH and sometimes Fe, Cu, P; with Cu and Zn usually competition dominates.' },
  { id: 'zn', ion: 'Zn²⁺', name: 'Zinc',
    antagonists: ['h2po4','cu','ca','fe','mn'], synergists: [],
    functional: ['Auxins','Enzymes','Membrane integrity'],
    shortTip: 'High P, Fe or Cu excess, and Mn in acid soils can induce relative Zn deficiency.' },
  { id: 'cu', ion: 'Cu²⁺', name: 'Copper',
    antagonists: ['zn','h2po4','fe','mn'], synergists: ['no3'],
    functional: ['Lignification','Photosynthesis'],
    shortTip: 'Excess Zn or interference with Fe/P can modify Cu balance.' },
  { id: 'b', ion: 'H₃BO₃', name: 'Boron',
    antagonists: ['ca'], synergists: ['nh4'],
    functional: ['Cell wall','Cell division','Pollination'],
    shortTip: 'High Ca can reduce B availability; B is sensitive to moisture and leaching.' },
  { id: 'moo4', ion: 'MoO₄²⁻', name: 'Molybdate',
    antagonists: ['so4'], synergists: ['no3','nh4'],
    functional: ['Nitrate reductase','N fixation','Fe cofactors in N chain'],
    shortTip: 'Excess SO₄²⁻ can compete with MoO₄²⁻.' },
  { id: 'cl', ion: 'Cl⁻', name: 'Chloride',
    antagonists: ['no3'], synergists: ['k','nh4'],
    functional: ['Ionic balance','Photosynthesis (PSII)','Osmotic adaptation'],
    shortTip: 'Cl⁻ and NO₃⁻ compete in some conditions.' },
];

export interface ArrivalRow {
  id: string; lab: string; name: string;
  mf: number; dif: number; int: number;
  dom: string; mean: string; dep: string; risk: string;
}

export const ROOT_ARRIVAL: ArrivalRow[] = [
  { id:'no3', lab:'NO₃⁻', name:'Nitrate', mf:78, dif:14, int:8,
    dom:'Mass flow', mean:'Moves well with water toward roots under active transpiration.',
    dep:'Transpiration, soil moisture, root distribution.', risk:'Leaching if supply exceeds demand.' },
  { id:'nh4', lab:'NH₄⁺', name:'Ammonium', mf:38, dif:47, int:15,
    dom:'Diffusion + mass flow', mean:'Largely held on CEC; less mobile than nitrate.',
    dep:'CEC, moisture, temperature, nitrification.', risk:'Ammonium toxicity if accumulated; competition with K⁺, Ca²⁺, Mg²⁺.' },
  { id:'h2po4', lab:'H₂PO₄⁻', name:'Phosphate', mf:8, dif:80, int:12,
    dom:'Diffusion', mean:'Moves slowly toward root; availability ≠ root arrival rate.',
    dep:'Moisture, active root, pH, Ca, Fe, Al, temperature.', risk:'Soil P may exist but not reach root at demand rate.' },
  { id:'k', lab:'K⁺', name:'Potassium', mf:24, dif:66, int:10,
    dom:'Diffusion (strong) + mass flow', mean:'High demand creates depletion zone near root.',
    dep:'CEC, K buffers, moisture, root density, transpiration.', risk:'Imbalance with other cations; leaching in sandy soils.' },
  { id:'ca', lab:'Ca²⁺', name:'Calcium', mf:70, dif:18, int:12,
    dom:'Mass flow + root interception', mean:'Strongly depends on water movement and transpiration.',
    dep:'Moisture, EC, VPD, active root, tissue demand.', risk:'Ca may be in soil but not reach fruit/young tissues.' },
  { id:'mg', lab:'Mg²⁺', name:'Magnesium', mf:62, dif:24, int:14,
    dom:'Mass flow + diffusion', mean:'Less mass-flow dominant than Ca.',
    dep:'CEC, moisture, competition with K⁺/NH₄⁺/Ca²⁺.', risk:'Relative deficiency with high K fertilization.' },
  { id:'so4', lab:'SO₄²⁻', name:'Sulfate', mf:58, dif:30, int:12,
    dom:'Mass flow + diffusion', mean:'Mobile anion; less retained than phosphate.',
    dep:'Moisture, leaching, S foliar/water supply.', risk:'Leaching; interaction with MoO₄²⁻ in excess.' },
  { id:'fe', lab:'Fe²⁺/Fe³⁺', name:'Iron', mf:18, dif:58, int:24,
    dom:'Diffusion + rhizosphere', mean:'Very dilute in solution; mass flow minor vs diffusion + rhizosphere.',
    dep:'pH, carbonates, redox, competition (Cu, Mn, Zn), rhizosphere.', risk:'Iron chlorosis at high pH even with high total Fe.' },
  { id:'mn', lab:'Mn²⁺', name:'Manganese', mf:38, dif:42, int:20,
    dom:'Diffusion + mass flow (pH-dependent)', mean:'Very sensitive to pH and redox.',
    dep:'Low pH increases Mn availability (toxicity risk).', risk:'Toxicity in acid soils; deficiency in alkaline.' },
  { id:'zn', lab:'Zn²⁺', name:'Zinc', mf:36, dif:44, int:20,
    dom:'Diffusion (main)', mean:'Low soil mobility; diffusion to rhizosphere.',
    dep:'pH, P, carbonates, organic matter.', risk:'Relative deficiency with high P.' },
  { id:'cu', lab:'Cu²⁺', name:'Copper', mf:34, dif:46, int:20,
    dom:'Diffusion', mean:'Uptake tied to complexing organic matter and pH.',
    dep:'pH, OM, antagonisms with Zn/Fe.', risk:'Toxicity from accumulated cupric fungicides.' },
  { id:'b', lab:'H₃BO₃', name:'Boron', mf:28, dif:48, int:24,
    dom:'Diffusion + mass flow', mean:'Boric acid diffusion; mass flow with xylem transpiration.',
    dep:'Moisture, texture, leaching, Ca, pH.', risk:'Deficiency bands from moisture lack; toxicity in excess.' },
  { id:'moo4', lab:'MoO₄²⁻', name:'Molybdate', mf:40, dif:45, int:15,
    dom:'Mass flow + diffusion', mean:'Anion competing with sulfate.',
    dep:'SO₄²⁻, pH, organic matter.', risk:'Deficiency in acid soils.' },
  { id:'cl', lab:'Cl⁻', name:'Chloride', mf:75, dif:15, int:10,
    dom:'Mass flow', mean:'Very mobile in solution with water.',
    dep:'Supply (water/fertilizer), drainage, NO₃⁻.', risk:'Varietal Cl⁻ sensitivity; competition with NO₃⁻.' },
];

export interface MobilityInfo {
  mob: string;
  where: string;
  sym: string;
  functions: { text: string; detail: string }[];
  tip: string;
}

export const EL_NAMES: Record<string, string> = {
  N:'Nitrogen', P:'Phosphorus', K:'Potassium', Mg:'Magnesium', Mo:'Molybdenum',
  S:'Sulfur', Fe:'Iron', Mn:'Manganese', Zn:'Zinc', Cu:'Copper', Ca:'Calcium', B:'Boron',
};

export const MOBILITY_INFO: Record<string, MobilityInfo> = {
  N: { mob:'High', where:'Old leaves',
    sym:'General chlorosis / yellowing, lower leaves paler',
    functions: [
      { text:'Protein, enzyme, and N-metabolite synthesis', detail:'N is in amino acids and nitrogenous bases; low intake limits mitosis, budbreak, and filling tissue formation.' },
      { text:'Chlorophyll and photosynthesis', detail:'Chlorophyll contains N in its ring; deficiency pales foliage and drops photosynthetic yield.' },
      { text:'Vegetative growth, branching, leaf area', detail:'New shoots and leaves are active sinks; N mobilizes from old tissue.' },
      { text:'Hormone relations and stress response', detail:'Modulates cytokinin routes and shade/salinity/drought responses.' },
    ],
    tip:'Early deficiency often shows on older leaves when N mobilizes to new tissue.' },
  P: { mob:'High', where:'Old leaves',
    sym:'Darker foliage tones, purpling on veins or stems in some crops; reduced growth',
    functions: [
      { text:'Energy (ATP/ADP) and phosphate transfer', detail:'Without ATP no electrogenic transport, biosynthesis, or gradient maintenance.' },
      { text:'Nucleic acids (DNA/RNA) and cell division', detail:'Meristems, flowers, and seeds are exposed because cellular demand grows fast there.' },
      { text:'Root development, flowering, seed/fruit set', detail:'Root architecture and the flowering→set→filling chain need continuous P pulses.' },
      { text:'Metabolic regulation and phosphorylated compounds', detail:'Many signals transit via phosphorylated states.' },
    ],
    tip:'Cold, P-fixing soils or extreme pH can worsen symptoms even when soil test is "medium".' },
  K: { mob:'High', where:'Old leaves',
    sym:'Marginal chlorosis or darkening; edge necrosis ("burn") in advanced cases',
    functions: [
      { text:'Osmotic regulation and stomatal aperture', detail:'K⁺ accompanies guard cells; controls transpiration, CO₂ entry, and cooling.' },
      { text:'Sugar mobilization and fruit osmotic loading', detail:'Photoassimilate movement to fruit often depends on K osmotic gradients.' },
      { text:'Quality (color, flavor, firmness) and stress tolerance', detail:'Affects pigmentation, firmness, and tissue water balance.' },
      { text:'Enzyme activation and ionic balance with other cations', detail:'Coexists in root solution with Ca²⁺, Mg²⁺, NH₄⁺; leaf K/Mg/Ca ratio clarifies better than isolated soil K.' },
    ],
    tip:'Can be confused with Mg; check leaf K/Mg/Ca and marginal vs interveinal symptoms.' },
  Mg: { mob:'High', where:'Old leaves',
    sym:'Interveinal chlorosis on mature blades, veins often greener',
    functions: [
      { text:'Central atom of chlorophyll molecule', detail:'Without stable Mg no functional Mg-porphyrin ring; interveinal chlorosis on mature blades is a frequent signal.' },
      { text:'Photosynthesis and key enzymes', detail:'Cofactor in energy-transfer reactions; "turns off" photochemical routes if low.' },
      { text:'Carbon metabolism and light response', detail:'Integrated photosynthetic yield depends on chloroplast–cytoplasm coupling.' },
      { text:'Lipid synthesis and membrane stability', detail:'Participates in membrane lipids and phospholipids.' },
    ],
    tip:'Relative excess of K, Ca or NH₄ can alter Mg balance even when total seems sufficient.' },
  Mo: { mob:'High', where:'Old leaves (sometimes confused with N deficiency)',
    sym:'General yellowing or mottling; in legumes tied to nitrate-use efficiency',
    functions: [
      { text:'Nitrate reductase cofactor', detail:'NO₃⁻ → NO₂⁻ stops without Mo; symptom may look like "N lack" with nitrate present.' },
      { text:'Biological N fixation in legumes', detail:'Nitrogenase requires Fe–Mo center; nodules exist but effective contribution drops.' },
      { text:'Nucleic acid and sulfur metabolism', detail:'Links with sulfur compounds in nitrogen-assimilation routes.' },
    ],
    tip:'Interpret with species, N form supplied, and leaf symptoms.' },
  S: { mob:'Intermediate / low', where:'Young leaves',
    sym:'More uniform chlorosis on new tissue; sometimes reddish tones',
    functions: [
      { text:'Disulfide bridges in proteins', detail:'Stabilizes protein folding in chloroplasts and tissues.' },
      { text:'Defense compounds and sulfur secondary metabolites', detail:'Glucosinolates and alliins participate in pest/pathogen defense and aromatic quality.' },
      { text:'Photosynthesis (photosystem protein components)', detail:'Several photosystem proteins contain cysteine.' },
    ],
    tip:'In hydroponics or inert media may appear on young leaves before "classic" patterns.' },
  Fe: { mob:'Low', where:'Young leaves',
    sym:'Interveinal chlorosis with greener veins (typical pattern)',
    functions: [
      { text:'Chloroplast synthesis and maintenance', detail:'Fe intervenes in chlorophyll biosynthesis machinery.' },
      { text:'Electron transport chain in photosynthesis and respiration', detail:'Cytochrome complexes depend on Fe.' },
      { text:'Redox enzymes and N metabolism', detail:'N assimilation/reduction uses Fe-S systems.' },
    ],
    tip:'High pH, bicarbonates or cold roots can induce iron chlorosis with high total Fe in soil.' },
  Mn: { mob:'Low', where:'Young leaves',
    sym:'Mottling, interveinal chlorosis; "bird\'s eyes" in some cases',
    functions: [
      { text:'Photosynthesis (photosystem, photoprotection)', detail:'Water-splitting complex carries Mn center.' },
      { text:'Enzyme activation and oxygen metabolism', detail:'Mn²⁺ activates dozens of hydrolases and decarboxylases.' },
      { text:'Oxidative defense (stress context)', detail:'Under high-light/electron overflow, Mn helps balance radicals.' },
    ],
    tip:'Symptoms may resemble Fe; leaf age and symptom pattern help orient.' },
  Zn: { mob:'Low', where:'Young leaves',
    sym:'Smaller leaves, chlorosis, "rigid" or leathery leaves in sensitive crops',
    functions: [
      { text:'Auxins and leaf morphogenesis', detail:'Regulates effective auxin levels in apices; deficiency shows as small "rosette" leaves.' },
      { text:'Enzyme cofactor', detail:'Carbonic anhydrase, carboxypeptidases, Zn-dependent dehydrogenases couple photosynthesis and photoassimilate use.' },
      { text:'Membrane integrity and meristematic growth', detail:'Apical meristem is sensitive because rapid division uses Zn-dependent synthetic routes.' },
    ],
    tip:'High P, cold or root restriction worsen foliar expression.' },
  Cu: { mob:'Low', where:'Young leaves',
    sym:'Deformation, chlorosis; apices may necrose in strong cases',
    functions: [
      { text:'Lignification and cell wall', detail:'Laccases and Cu oxidases harden vessels and sclerenchyma.' },
      { text:'Photosynthesis (plastocyanin) and oxidative metabolism', detail:'Plastocyanin carries electrons between photosystems.' },
      { text:'Pollen and fertility', detail:'Fertile pollen requires enzymatic integrity and pollen wall adequacy.' },
    ],
    tip:'Watch accumulation from cupric fungicides in intensive programs.' },
  Ca: { mob:'Low (poorly redistributed in phloem)', where:'Young tissues, meristems, fruits',
    sym:'Marginal necrosis on new leaves, deformation, blossom-end rot or other fruit necrosis',
    functions: [
      { text:'Cell wall (pectins) and tissue stability', detail:'Ca²⁺ bridges between pectins give firmness; young low-transpiration tissues are typical failure foci.' },
      { text:'Membranes and signaling (calmodulin)', detail:'Calmodulin transduces cytosolic Ca signals; ties drought/wound responses to membrane integrity.' },
      { text:'Fruit and expanding tissue integrity', detail:'Fast-filling fruit (tomato, peppers, berries) show BER even when soil Ca is "adequate".' },
    ],
    tip:'Adequate soil Ca can still fail in fruit/meristem due to low distribution or low local transpiration.' },
  B: { mob:'Low in most crops (exception: polyol-mobile in some)',
    where:'Shoots, buds, meristems, flowers, fruits',
    sym:'Death of growth points, deformation, irregular flowering or fruit set',
    functions: [
      { text:'Cell wall and membrane stability', detail:'B is in the pectin network; deformed shoots or thickened blades suggest poor tissue assembly.' },
      { text:'Pollination (pollen tube) and floral retention', detail:'Pollen tube needs orderly synthesis; floral abortion or low pollen viability can precede necrosis.' },
      { text:'Sugar transport and expanding meristems', detail:'Linked to photoassiminate mobilization to growth points.' },
      { text:'Fruit quality and lignification', detail:'In avocado, deficit relates to deformed fruit, irregular lignification or aborted fruitlets.' },
    ],
    tip:'In avocado, apple/pear (rosaceae) and pollination-sensitive crops, effective B behavior differs from olive or grape.' },
};

export interface PhNutrient {
  id: string; lab: string; name: string; color: string;
  points: [number, number][];
  tag: string; intro: string; bullets: string[];
}

export const PH_NUTRIENTS: PhNutrient[] = [
  { id:'N', lab:'N', name:'Nitrogen', color:'#15803d',
    points:[[4,0.12],[4.5,0.22],[5,0.48],[5.5,0.78],[6,0.92],[6.5,0.95],[7,0.93],[7.5,0.86],[8,0.68],[8.5,0.48],[9,0.32]],
    tag:'OM, mineralization, N management',
    intro:'Plant-available N integrates organic (mineralization), applications, and losses; not a single pH-fixed number.',
    bullets:[
      'In <strong>very acid pH</strong>, OM mineralization and useful microbial activity usually drop.',
      'In <strong>intermediate pH</strong>, higher microbial activity and N recycling.',
      'In <strong>high pH</strong>, poor urea/ammonia management can favor <strong>NH₃ volatilization</strong>.',
      '<strong>NO₃⁻</strong> is very mobile: can <strong>leach</strong> with excess water.' ] },
  { id:'P', lab:'P', name:'Phosphorus', color:'#18181b',
    points:[[4,0.2],[4.5,0.28],[5,0.42],[5.5,0.62],[6,0.82],[6.5,0.95],[7,0.88],[7.5,0.55],[8,0.28],[8.5,0.22],[9,0.3]],
    tag:'Chemical fixation in soil',
    intro:'Available P drops sharply when fixed to Fe/Al oxides (acid) or precipitated with Ca (calcareous). Curve peaks at moderate pH.',
    bullets:[
      '<strong>Acid soils</strong>: strong adsorption to <strong>Fe/Al</strong>; P can be "in test" but little in solution.',
      '<strong>Calcareous / high pH</strong>: precipitation with <strong>Ca</strong>, low-solubility phosphates.',
      'Illustrative optimum ~ <strong>6.0–6.8</strong> (not universal: clay, OM and ionic balance change everything).' ] },
  { id:'K', lab:'K', name:'Potassium', color:'#404040',
    points:[[4,0.08],[4.5,0.18],[5,0.38],[5.5,0.62],[6,0.82],[6.5,0.9],[7,0.94],[7.5,0.95],[8,0.96],[8.5,0.95],[9,0.92]],
    tag:'Effective CEC and cation balance',
    intro:'K⁺ exchanges on surfaces; raising pH usually increases effective CEC on variable-charge soils and improves exchangeable pool.',
    bullets:[
      'In <strong>low pH</strong>, lower base saturation relative to Al³⁺/H⁺.',
      'As <strong>pH rises</strong>, <strong>CEC</strong> on variable colloids usually increases → more cation retention.',
      'In <strong>saline / very high K</strong> soils, the issue may be ionic balance, not pH.' ] },
  { id:'S', lab:'S', name:'Sulfur', color:'#0f766e',
    points:[[4,0.1],[4.5,0.22],[5,0.45],[5.5,0.72],[6,0.88],[6.5,0.9],[7,0.88],[7.5,0.82],[8,0.7],[8.5,0.52],[9,0.38]],
    tag:'Sulfate and organic S',
    intro:'Available S relates to OM mineralization and SO₄²⁻ in solution; at high pH the anion can be more mobile and leach.',
    bullets:[
      '<strong>OM</strong>: main organic reservoir; mineralization depends on biota and moisture.',
      '<strong>High pH / heavy irrigation</strong>: <strong>SO₄²⁻ leaching</strong> risk in sandy profiles.',
      'Don\'t confuse with <strong>insufficient supply</strong> in depleted soils.' ] },
  { id:'Ca', lab:'Ca', name:'Calcium', color:'#52525b',
    points:[[4,0.05],[4.5,0.12],[5,0.28],[5.5,0.52],[6,0.78],[6.5,0.9],[7,0.94],[7.5,0.93],[8,0.88],[8.5,0.72],[9,0.55]],
    tag:'CEC, bases, balance',
    intro:'Ca²⁺ is part of the adsorbed complex; usually increases with base saturation near neutral pH, but "available Ca" also depends on carbonates, SO₄, Na and ionic strength.',
    bullets:[
      'In <strong>strong acidification</strong>, more Al/Mn toxic and root pressure even with medium total Ca.',
      'In <strong>calcareous</strong>, high "total" Ca but interference from other ions or low rhizosphere activity.',
      '<strong>BER / tip</strong> sometimes is plant transport, not just "soil pH".' ] },
  { id:'Mg', lab:'Mg', name:'Magnesium', color:'#52525b',
    points:[[4,0.06],[4.5,0.15],[5,0.32],[5.5,0.55],[6,0.78],[6.5,0.88],[7,0.9],[7.5,0.88],[8,0.8],[8.5,0.62],[9,0.45]],
    tag:'CEC and cation competition',
    intro:'Mg²⁺ competes with K⁺, NH₄⁺ and Ca²⁺ for adsorption and transport sites. Curve is indicative.',
    bullets:[
      '<strong>Excess K</strong> can push relative Mg deficiency even with "medium" soil Mg.',
      '<strong>Ca/Mg</strong> patterns in the complex are key in many regions.',
      'In <strong>extreme pH</strong>, the issue may be (Al) toxicity rather than chemical Mg low.' ] },
  { id:'Fe', lab:'Fe', name:'Iron', color:'#dc2626',
    points:[[4,0.96],[4.5,0.92],[5,0.82],[5.5,0.62],[6,0.42],[6.5,0.25],[7,0.14],[7.5,0.08],[8,0.04],[8.5,0.02],[9,0.02]],
    tag:'Oxide/hydroxide precipitation',
    intro:'Available Fe drops sharply with pH by precipitation/hydrolysis; hence iron chlorosis is common in calcareous soils or with bicarbonates in irrigation water.',
    bullets:[
      'Plant takes mainly <strong>Fe²⁺</strong> / chelates, not "total soil Fe".',
      'In <strong>high pH</strong>, supply <strong>chelates</strong> or reduce antagonism (HCO₃⁻).',
      '<strong>Foliar</strong> is useful but the underlying issue is usually rhizosphere chemistry.' ] },
  { id:'Mn', lab:'Mn', name:'Manganese', color:'#dc2626',
    points:[[4,0.92],[4.5,0.88],[5,0.78],[5.5,0.6],[6,0.38],[6.5,0.2],[7,0.1],[7.5,0.05],[8,0.03],[8.5,0.02],[9,0.02]],
    tag:'Redox and pH',
    intro:'Mn becomes more available in acid soils; can be toxic; in alkaline drops and resembles Fe deficiency on young leaves.',
    bullets:[
      'In <strong>low pH</strong> watch <strong>toxicity</strong> rather than deficiency.',
      'In <strong>high pH</strong> can compete with Fe in the symptom picture.',
      'Rhizosphere oxygenation (waterlogging) shifts Mn by <strong>redox</strong>.' ] },
  { id:'B', lab:'B', name:'Boron', color:'#ca8a04',
    points:[[4,0.15],[4.5,0.28],[5,0.52],[5.5,0.78],[6,0.9],[6.5,0.92],[7,0.88],[7.5,0.55],[8,0.28],[8.5,0.35],[9,0.42]],
    tag:'Speciation and leaching',
    intro:'Boric acid / borate changes with pH; intermediate range usually best; in alkaline + irrigation can leach or behave "oddly" in clays.',
    bullets:[
      'Fine management window: little margin between <strong>deficiency and toxicity</strong> in many crops.',
      '<strong>High pH + strong leaching</strong> can drop B even in non-extreme soils.',
      'Variety and <strong>B mobility</strong> change plant symptom.' ] },
  { id:'Cu', lab:'Cu', name:'Copper', color:'#dc2626',
    points:[[4,0.9],[4.5,0.85],[5,0.72],[5.5,0.55],[6,0.4],[6.5,0.28],[7,0.2],[7.5,0.14],[8,0.1],[8.5,0.08],[9,0.06]],
    tag:'Adsorption and complexation',
    intro:'Cu and other positive-charge micros adsorb more strongly as pH rises. In acid, more in solution with toxicity risk if cupric fungicide Cu has accumulated.',
    bullets:[
      '<strong>Organic</strong> soils can strongly complex Cu.',
      'Excess <strong>P</strong> or ionic interactions can modify availability.',
      'Toxicity from <strong>cupric fungicides</strong> in intensive programs.' ] },
  { id:'Zn', lab:'Zn', name:'Zinc', color:'#dc2626',
    points:[[4,0.88],[4.5,0.82],[5,0.68],[5.5,0.52],[6,0.38],[6.5,0.25],[7,0.16],[7.5,0.1],[8,0.07],[8.5,0.05],[9,0.04]],
    tag:'Adsorption and pH',
    intro:'Like Fe/Mn/Cu, Zn is more soluble in acid and drops as pH rises; high carbonates and phosphates worsen "functional availability".',
    bullets:[
      '<strong>High P</strong> can induce relative Zn deficiency.',
      'Cold / compacted roots reduce uptake even with soil Zn.',
      'Check <strong>clay matrix</strong> vs texture (CEC and adsorption).' ] },
  { id:'Mo', lab:'Mo', name:'Molybdenum', color:'#2563eb',
    points:[[4,0.08],[4.5,0.12],[5,0.2],[5.5,0.32],[6,0.48],[6.5,0.62],[7,0.8],[7.5,0.9],[8,0.94],[8.5,0.95],[9,0.96]],
    tag:'Anionic / MoO₄²⁻ form',
    intro:'Mo as molybdate behaves as a higher-charge anion at high pH; in very acid soils lower relative availability depending on mineralogy and adsorption.',
    bullets:[
      'In <strong>extreme acid</strong>, sometimes correct pH or apply Mo accordingly.',
      'Interaction with <strong>SO₄²⁻</strong> excess (anionic competition) can appear.',
      'Important for <strong>nitrate reductase</strong> and legumes (fixation).' ] },
  { id:'Cl', lab:'Cl', name:'Chlorine', color:'#2563eb',
    points:[[4,0.18],[4.5,0.25],[5,0.35],[5.5,0.5],[6,0.65],[6.5,0.78],[7,0.88],[7.5,0.92],[8,0.94],[8.5,0.95],[9,0.94]],
    tag:'Very mobile anion',
    intro:'Cl⁻ is a competing solution anion; "curve" illustrates qualitative availability rather than a universal limit — in water quality and fertilization, excess is more common than deficiency.',
    bullets:[
      '<strong>High mobility</strong> with water flow; can accumulate or wash depending on balance.',
      'Varietal sensitivity to Cl⁻ in certain crops.',
      'Integrate with <strong>irrigation water</strong> analysis and nutrient program.' ] },
  { id:'Al', lab:'Al', name:'Aluminum (toxicity)', color:'#a16207',
    points:[[4,0.98],[4.5,0.88],[5,0.42],[5.5,0.08],[6,0.02],[6.5,0.01],[7,0.01],[7.5,0.01],[8,0.01],[8.5,0.01],[9,0.01]],
    tag:'Toxicity · not a nutrient',
    intro:'"Available" here is a risk signal: Al³⁺ is toxic to roots at very low pH. As pH rises it precipitates as hydroxide (not a fertilizer).',
    bullets:[
      'Strongly associated with <strong>pH < ~5.5</strong> and high exchangeable Al.',
      'Precipitates as <strong>Al(OH)₃</strong> on neutralization.',
      'Mitigate with lime/dolomite/gypsum per diagnosis; always validate with tests.' ] },
];

// ============================================================================
// 14. MINERALIZABLE N — T_min presets
// ============================================================================

export interface TMinPreset { tmin: number; label: string; title: string; }

export const TMIN_PRESETS: TMinPreset[] = [
  { tmin: 1, label: 'Conservative · 1%',  title: 'Cold, dry, compacted or low biological activity soil' },
  { tmin: 2, label: 'Medium · 2%',         title: 'Average agricultural condition', },
  { tmin: 3, label: 'High · 3%',           title: 'Warm, moist, aerated, high biological activity soil' },
];

export const ROOT_REACH_BY_SYSTEM = [
  { system: 'Extensive closed crop',           pct: '80 – 100' },
  { system: 'Vegetable on bed or row',         pct: '50 – 80'  },
  { system: 'Berry on bed',                    pct: '40 – 70'  },
  { system: 'Young avocado',                   pct: '20 – 50'  },
  { system: 'Adult avocado',                   pct: '50 – 80'  },
  { system: 'Fruit tree with wide alleys',     pct: '40 – 70'  },
  { system: 'Fruit tree with active cover',    pct: '60 – 90'  },
];

// ============================================================================
// 15. SOIL WATER & TEXTURE — USDA triangle
// ============================================================================

export interface TextureSeries {
  label: string;
  cc: number;   // field capacity (%)
  pmp: number;  // permanent wilting point (%)
  color: string;
}

export const TEXTURE_SERIES: TextureSeries[] = [
  { label: 'Sandy',        cc: 12, pmp: 5,  color: '#fde68a' },
  { label: 'Sandy loam',   cc: 22, pmp: 9,  color: '#fcd34d' },
  { label: 'Loam',         cc: 28, pmp: 12, color: '#84cc16' },
  { label: 'Silt loam',    cc: 32, pmp: 14, color: '#22c55e' },
  { label: 'Clay loam',    cc: 36, pmp: 18, color: '#0891b2' },
  { label: 'Clay',         cc: 42, pmp: 22, color: '#1e40af' },
];

export interface UsdaRegion {
  name: string;
  vertices: [number, number][];  // [x, y] in SVG coords (clay, silt, sand)%
  color: string;
}

// USDA 12-class texture triangle polygons (simplified). Vertices in (clay, silt, sand) %.
export const USDA_REGIONS: { name: string; clay: number[]; silt: number[]; sand: number[]; color: string }[] = [
  // Sand
  { name: 'Sand',            clay: [0,0,0],              silt: [0,0,0],            sand: [100,85,100],   color: '#fde68a' },
  // Loamy sand
  { name: 'Loamy sand',      clay: [0,0,10,10,0],        silt: [0,15,15,0,0],      sand: [100,85,75,90,100], color: '#fcd34d' },
  // Sandy loam
  { name: 'Sandy loam',      clay: [0,0,10,15,20,20,0],  silt: [0,15,30,30,30,0,0],sand: [100,85,60,55,50,80,100], color: '#facc15' },
  // Silt
  { name: 'Silt',            clay: [0,0,10,0],           silt: [70,100,80,80],     sand: [30,0,10,20],   color: '#a3e635' },
  // Silt loam
  { name: 'Silt loam',       clay: [0,0,15,15,0],        silt: [50,80,50,80,50],   sand: [50,20,35,5,50], color: '#84cc16' },
  // Loam
  { name: 'Loam',            clay: [10,10,20,20,10],     silt: [30,45,30,45,30],   sand: [60,45,50,35,60], color: '#65a30d' },
  // Sandy clay loam
  { name: 'Sandy clay loam', clay: [20,20,30,30,20],     silt: [0,20,20,30,30],    sand: [80,60,50,40,50], color: '#ca8a04' },
  // Silty clay loam
  { name: 'Silty clay loam', clay: [30,30,40,40,30],     silt: [50,80,50,60,60],   sand: [20,0,10,0,10], color: '#16a34a' },
  // Clay loam
  { name: 'Clay loam',       clay: [30,30,40,40,30],     silt: [20,50,20,40,40],   sand: [50,20,40,20,30], color: '#15803d' },
  // Sandy clay
  { name: 'Sandy clay',      clay: [30,30,40,40,30],     silt: [0,20,0,20,0],      sand: [70,50,60,40,70], color: '#b45309' },
  // Silty clay
  { name: 'Silty clay',      clay: [40,40,60,60,40],     silt: [40,60,40,60,40],   sand: [20,0,0,0,20],   color: '#166534' },
  // Clay
  { name: 'Clay',            clay: [40,40,60,60,40],     silt: [0,40,0,40,0],      sand: [60,20,40,0,60], color: '#1e40af' },
];

// ============================================================================
// 16. SOLUBILITY & SALT INDEX
// ============================================================================

export interface SolubilityRow {
  name: string;
  formula: string;
  solLo: number;
  solHi: number;
  is: number | null;
  noteIs?: string;
  note?: string;
}

export const SOLUBILITY_ROWS: SolubilityRow[] = [
  { name: 'Ammonium nitrate',        formula: 'NH₄NO₃',     solLo: 1850, solHi: 1950, is: 104.7 },
  { name: 'Magnesium nitrate',       formula: 'Mg(NO₃)₂',   solLo: 1200, solHi: 1300, is: 60.5 },
  { name: 'Calcium nitrate',         formula: 'Ca(NO₃)₂',   solLo: 1150, solHi: 1250, is: 40.7 },
  { name: 'Potassium nitrate',       formula: 'KNO₃',       solLo: 300,  solHi: 330,  is: 73.6 },
  { name: 'Urea',                    formula: 'CH₄N₂O',     solLo: 1000, solHi: 1150, is: 75.4 },
  { name: 'MAP',                     formula: 'NH₄H₂PO₄',   solLo: 350,  solHi: 400,  is: 26.7 },
  { name: 'MKP',                     formula: 'KH₂PO₄',     solLo: 200,  solHi: 240,  is: 8.4 },
  { name: 'Potassium chloride',      formula: 'KCl',        solLo: 320,  solHi: 360,  is: 116.3 },
  { name: 'Ammonium sulfate',        formula: '(NH₄)₂SO₄',  solLo: 720,  solHi: 780,  is: 69.0 },
  { name: 'Magnesium sulfate',       formula: 'MgSO₄',      solLo: 680,  solHi: 740,  is: 44.0 },
  { name: 'Potassium sulfate',       formula: 'K₂SO₄',      solLo: 105,  solHi: 115,  is: 46.0 },
  { name: 'Calcium sulfate (gypsum)',formula: 'CaSO₄',      solLo: 1.5,  solHi: 2.8,  is: 8, noteIs: '~', note: 'Amendment · not soluble in fertigation (reference).' },
  { name: 'Calcium carbonate',       formula: 'CaCO₃',      solLo: 0.01, solHi: 0.03, is: null, noteIs: '—', note: 'Amendment · not soluble in fertigation (reference).' },
];

export function solubilityClass(mid: number): { label: string; color: string } {
  if (mid > 500) return { label: 'High', color: '#2563eb' };
  if (mid >= 100) return { label: 'Medium', color: '#ca8a04' };
  return { label: 'Low', color: '#dc2626' };
}

// ============================================================================
// 17. FERTILIZER CARBON FOOTPRINT — emission factors (IPCC / Fertilizers Europe)
// ============================================================================

export interface CarbonFactorRow {
  id: string;
  name: string;
  formula: string;
  /** kg CO2e per kg product manufactured (Fertilizers Europe 2020 average, cradle-to-gate). */
  mfg: number;
  /** kg N per kg product (for N₂O field emission calc). */
  nContent: number;
}

export const CARBON_FACTORS: CarbonFactorRow[] = [
  { id: 'urea',              name: 'Urea',                  formula: 'CH₄N₂O',    mfg: 1.58, nContent: 0.466 },
  { id: 'ammonium_nitrate',  name: 'Ammonium Nitrate',      formula: 'NH₄NO₃',    mfg: 2.65, nContent: 0.350 },
  { id: 'can',               name: 'Calcium Ammonium Nitrate', formula: '5Ca(NO₃)₂+NH₄NO₃+H₂O', mfg: 2.95, nContent: 0.270 },
  { id: 'ammonium_sulfate',  name: 'Ammonium Sulfate',      formula: '(NH₄)₂SO₄', mfg: 1.40, nContent: 0.212 },
  { id: 'dap',               name: 'DAP',                   formula: '(NH₄)₂HPO₄', mfg: 2.05, nContent: 0.180 },
  { id: 'map',               name: 'MAP',                   formula: 'NH₄H₂PO₄',  mfg: 1.71, nContent: 0.110 },
  { id: 'potassium_nitrate', name: 'Potassium Nitrate',     formula: 'KNO₃',      mfg: 1.91, nContent: 0.138 },
  { id: 'calcium_nitrate',   name: 'Calcium Nitrate',       formula: 'Ca(NO₃)₂',  mfg: 1.69, nContent: 0.155 },
  { id: 'potassium_chloride',name: 'Potassium Chloride',    formula: 'KCl',       mfg: 0.35, nContent: 0 },
  { id: 'potassium_sulfate', name: 'Potassium Sulfate',     formula: 'K₂SO₄',     mfg: 0.85, nContent: 0 },
  { id: 'magnesium_sulfate', name: 'Magnesium Sulfate',     formula: 'MgSO₄',     mfg: 0.65, nContent: 0 },
];

// IPCC 2006 Tier 1: 0.01 kg N2O-N per kg N applied, GWP N2O = 298 (AR5 w/o climate feedback)
export const N2O_EF = 0.01;          // kg N2O-N / kg N
export const N2O_GWP = 298;          // CO2e / N2O
export const N2O_MW_RATIO = 44 / 28; // N2O / N

/** kg CO2e from field N2O per kg product applied */
export function fieldN2oCo2e(nContent: number): number {
  return nContent * N2O_EF * N2O_MW_RATIO * N2O_GWP;
}

export const PICKUP_KG_CO2E_PER_KM = 0.254;

export interface CarbonRow {
  id: string;
  fertilizerId: string;
  rateKgPerHa: number;
  originKm: number;       // road km from plant to port/depot
  seaKm: number;          // sea km
  portKm: number;         // road km from port to field
  mode: 'estimated' | 'custom_per_kg' | 'custom_total_mfg';
  customPerKg?: number;
  customTotalMfg?: number;
}

export interface CarbonResult {
  mfg: number;
  transport: number;
  field: number;
  total: number;
  pickupKm: number;
}

/** Compute emissions for one fertilizer row (kg CO2e / ha). */
export function computeCarbonRow(row: CarbonRow): CarbonResult {
  const factor = CARBON_FACTORS.find(f => f.id === row.fertilizerId);
  let mfg = 0;
  if (row.mode === 'custom_total_mfg' && row.customTotalMfg != null) {
    mfg = row.customTotalMfg;
  } else if (row.mode === 'custom_per_kg' && row.customPerKg != null) {
    mfg = row.customPerKg * row.rateKgPerHa;
  } else if (factor) {
    mfg = factor.mfg * row.rateKgPerHa;
  }
  // Transport: road ~0.107 kg CO2e/t·km, sea ~0.016 kg CO2e/t·km (DEFRA 2024 averages)
  const roadFactor = 0.000107; // kg CO2e per kg·km
  const seaFactor  = 0.000016; // kg CO2e per kg·km
  const transport = (row.originKm + row.portKm) * roadFactor * row.rateKgPerHa
                  + row.seaKm * seaFactor * row.rateKgPerHa;
  // Field N2O
  const field = factor ? fieldN2oCo2e(factor.nContent) * row.rateKgPerHa : 0;
  const total = mfg + transport + field;
  const pickupKm = total / PICKUP_KG_CO2E_PER_KM;
  return { mfg, transport, field, total, pickupKm };
}

// ============================================================================
// 18. IRRIGATION SHEET — basic FAO-56
// ============================================================================

export interface IrrigationResult {
  etc: number;        // mm
  irrigationMm: number;
  rain: number;
  balance: number;    // mm  (positive = surplus, negative = deficit)
  totalVolumeM3: number;
  periodDays: number;
}

export function computeIrrigation(params: {
  et0: number;        // mm (per period)
  kc: number;
  rain: number;       // mm (per period)
  irrigationM3: number;
  irrigatedAreaHa: number;
  cropAreaHa: number;
  periodDays: number;
}): IrrigationResult {
  const etc = params.kc * params.et0;
  const irrigationMm = params.irrigatedAreaHa > 0
    ? params.irrigationM3 / (params.irrigatedAreaHa * 10)
    : 0;
  const balance = irrigationMm + params.rain - etc;
  const totalVolumeM3 = etc * params.cropAreaHa * 10;
  return {
    etc: Math.round(etc * 100) / 100,
    irrigationMm: Math.round(irrigationMm * 100) / 100,
    rain: params.rain,
    balance: Math.round(balance * 100) / 100,
    totalVolumeM3: Math.round(totalVolumeM3),
    periodDays: params.periodDays,
  };
}

// ============================================================================
// Shared helpers
// ============================================================================

export function fmt(n: number | null | undefined, dec = 2): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export function parseNum(v: string | number | null | undefined, fallback = 0): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  if (v == null) return fallback;
  const s = String(v).replace(',', '.').trim();
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : fallback;
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}
