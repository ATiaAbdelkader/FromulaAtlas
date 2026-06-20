// Calculator configurations for agricultural formulas.
// Each entry maps a formula code to a set of input fields and a compute function.

export interface CalcField {
  key: string;
  label: string;
  unit?: string;
  defaultValue: number;
  step?: number;
  min?: number;
  max?: number;
}

export interface CalcResult {
  value: string;
  label: string;
  interpretation?: string;
}

export interface CalcConfig {
  fields: CalcField[];
  compute: (vals: Record<string, number>) => CalcResult;
}

// Helper formatting functions
const fmt = (n: number, digits = 2) =>
  n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: 0 });

const fmt0 = (n: number) => fmt(n, 0);
const fmt1 = (n: number) => fmt(n, 1);
const fmt2 = (n: number) => fmt(n, 2);
const fmt3 = (n: number) => fmt(n, 3);

// Interpretation helper for value-in-range checks
function rangeInterp(value: number, ranges: [number, number, string][]): string {
  for (const [low, high, msg] of ranges) {
    if (value >= low && value < high) return msg;
  }
  return ranges[ranges.length - 1][2];
}

export const calculators: Record<string, CalcConfig> = {
  // ============= PART II: CROP PRODUCTION =============

  // 2.1 Plant Population
  '2.1': {
    fields: [
      { key: 'area', label: 'Area', unit: 'm²', defaultValue: 10000, step: 100 },
      { key: 'rowSpacing', label: 'Row Spacing', unit: 'cm', defaultValue: 75, step: 1 },
      { key: 'plantSpacing', label: 'Plant Spacing', unit: 'cm', defaultValue: 25, step: 1 },
    ],
    compute: (v) => {
      const pp = (v.area * 10000) / (v.rowSpacing * v.plantSpacing);
      const interp = rangeInterp(pp, [
        [0, 30000, 'Low density — consider tighter spacing for full canopy closure.'],
        [30000, 80000, 'Within optimal range for most cereal crops.'],
        [80000, Infinity, 'High density — ensure adequate fertility and watch for lodging.'],
      ]);
      return { value: fmt0(pp), label: 'plants/ha', interpretation: interp };
    },
  },

  // 2.2 Seed Rate
  '2.2': {
    fields: [
      { key: 'targetPop', label: 'Target Population', unit: 'plants/ha', defaultValue: 350000, step: 1000 },
      { key: 'testWeight', label: 'Test Weight', unit: 'g/1000 seeds', defaultValue: 35, step: 1 },
      { key: 'germination', label: 'Germination', unit: '%', defaultValue: 90, step: 1 },
      { key: 'purity', label: 'Purity', unit: '%', defaultValue: 98, step: 1 },
    ],
    compute: (v) => {
      const sr = (v.targetPop * v.testWeight) / (1000 * 100 * (v.germination / 100) * (v.purity / 100));
      return { value: fmt1(sr), label: 'kg/ha', interpretation: `Order ~${fmt1(sr * 1.1)} kg/ha to include 10% extra for field losses.` };
    },
  },

  // 2.3 Real Value of Seed
  '2.3': {
    fields: [
      { key: 'purity', label: 'Purity', unit: '%', defaultValue: 98, step: 1 },
      { key: 'germination', label: 'Germination', unit: '%', defaultValue: 90, step: 1 },
    ],
    compute: (v) => {
      const rvs = (v.purity * v.germination) / 100;
      const interp = rangeInterp(rvs, [
        [0, 75, 'Below acceptable seed quality threshold — consider re-sourcing.'],
        [75, 90, 'Acceptable commercial seed quality.'],
        [90, Infinity, 'Excellent seed quality.'],
      ]);
      return { value: fmt1(rvs), label: '%', interpretation: interp };
    },
  },

  // 3.1 Cropping Intensity
  '3.1': {
    fields: [
      { key: 'grossArea', label: 'Gross Cropped Area', unit: 'ha', defaultValue: 200, step: 5 },
      { key: 'netArea', label: 'Net Cultivable Area', unit: 'ha', defaultValue: 100, step: 5 },
    ],
    compute: (v) => {
      const ci = (v.grossArea / v.netArea) * 100;
      const interp = ci > 100
        ? `Multiple cropping practiced — land is used ${fmt(ci / 100, 1)}× per year.`
        : 'Single cropping — land used once per year or less.';
      return { value: fmt0(ci), label: '%', interpretation: interp };
    },
  },

  // 3.9 Land Equivalent Ratio
  '3.9': {
    fields: [
      { key: 'yia', label: 'Intercrop yield species A', unit: 't/ha', defaultValue: 4.5, step: 0.1 },
      { key: 'ysa', label: 'Sole crop yield species A', unit: 't/ha', defaultValue: 5, step: 0.1 },
      { key: 'yib', label: 'Intercrop yield species B', unit: 't/ha', defaultValue: 1.8, step: 0.1 },
      { key: 'ysb', label: 'Sole crop yield species B', unit: 't/ha', defaultValue: 1.5, step: 0.1 },
    ],
    compute: (v) => {
      const ler = (v.yia / v.ysa) + (v.yib / v.ysb);
      const interp = ler > 1
        ? `${fmt((ler - 1) * 100, 0)}% land advantage vs monoculture — intercropping is beneficial.`
        : `${fmt((1 - ler) * 100, 0)}% land disadvantage — monoculture is more productive.`;
      return { value: fmt2(ler), label: 'LER', interpretation: interp };
    },
  },

  // 3.14 Monetary Advantage Index
  '3.14': {
    fields: [
      { key: 'ler', label: 'LER', unit: 'ratio', defaultValue: 1.35, step: 0.01 },
      { key: 'tmv', label: 'Total Monetary Value', unit: '$/ha', defaultValue: 2000, step: 50 },
    ],
    compute: (v) => {
      const mai = ((v.ler - 1) / v.ler) * v.tmv;
      const interp = mai > 0
        ? `Intercropping is financially advantageous by $${fmt0(mai)}/ha.`
        : 'Intercropping has a financial disadvantage vs monoculture.';
      return { value: fmt0(mai), label: '$/ha', interpretation: interp };
    },
  },

  // 4.1 Fertilizer Requirement
  '4.1': {
    fields: [
      { key: 'rate', label: 'Recommended Rate (N, P, or K)', unit: 'kg/ha', defaultValue: 120, step: 5 },
      { key: 'nutrientPct', label: 'Nutrient % in product', unit: '%', defaultValue: 46, step: 1 },
    ],
    compute: (v) => {
      const qty = (100 * v.rate) / v.nutrientPct;
      return { value: fmt1(qty), label: 'kg product/ha', interpretation: `Apply ${fmt1(qty)} kg of the fertilizer product per hectare to deliver ${v.rate} kg of nutrient.` };
    },
  },

  // 4.8a Agronomic Efficiency
  '4.8a': {
    fields: [
      { key: 'yf', label: 'Yield with fertilizer (Yf)', unit: 't/ha', defaultValue: 5, step: 0.1 },
      { key: 'yu', label: 'Yield without fertilizer (Yu)', unit: 't/ha', defaultValue: 3, step: 0.1 },
      { key: 'n', label: 'Nutrient applied (N)', unit: 'kg/ha', defaultValue: 100, step: 5 },
    ],
    compute: (v) => {
      const ae = ((v.yf - v.yu) * 1000) / v.n;
      const interp = rangeInterp(ae, [
        [0, 10, 'Low AE — fertilizer not translating well to yield.'],
        [10, 25, 'Moderate AE — typical of well-managed cereals.'],
        [25, Infinity, 'High AE — efficient fertilizer use.'],
      ]);
      return { value: fmt1(ae), label: 'kg grain/kg nutrient', interpretation: interp };
    },
  },

  // 4.8b Apparent Nutrient Recovery
  '4.8b': {
    fields: [
      { key: 'nuf', label: 'Nutrient uptake with fertilizer (NUf)', unit: 'kg/ha', defaultValue: 120, step: 5 },
      { key: 'nuu', label: 'Nutrient uptake without fertilizer (NUu)', unit: 'kg/ha', defaultValue: 60, step: 5 },
      { key: 'n', label: 'Nutrient applied', unit: 'kg/ha', defaultValue: 100, step: 5 },
    ],
    compute: (v) => {
      const anr = ((v.nuf - v.nuu) / v.n) * 100;
      const interp = rangeInterp(anr, [
        [0, 30, 'Low recovery — significant losses likely.'],
        [30, 60, 'Moderate recovery — typical for cereals.'],
        [60, Infinity, 'High recovery — excellent management.'],
      ]);
      return { value: fmt1(anr), label: '%', interpretation: interp };
    },
  },

  // 4.8c Partial Factor Productivity
  '4.8c': {
    fields: [
      { key: 'y', label: 'Total Yield (Y)', unit: 't/ha', defaultValue: 5, step: 0.1 },
      { key: 'n', label: 'Nutrient applied', unit: 'kg/ha', defaultValue: 100, step: 5 },
    ],
    compute: (v) => {
      const pfp = (v.y * 1000) / v.n;
      const interp = rangeInterp(pfp, [
        [0, 30, 'Low PFP — high input relative to yield.'],
        [30, 60, 'Moderate PFP.'],
        [60, Infinity, 'High PFP — efficient system.'],
      ]);
      return { value: fmt1(pfp), label: 'kg/kg', interpretation: interp };
    },
  },

  // 5.1 Weed Control Efficiency
  '5.1': {
    fields: [
      { key: 'wdc', label: 'Weed dry weight - control (WDc)', unit: 'g/m²', defaultValue: 500, step: 10 },
      { key: 'wdt', label: 'Weed dry weight - treatment (WDt)', unit: 'g/m²', defaultValue: 150, step: 10 },
    ],
    compute: (v) => {
      const wce = ((v.wdc - v.wdt) / v.wdc) * 100;
      const interp = rangeInterp(wce, [
        [0, 50, 'Poor weed control.'],
        [50, 80, 'Moderate weed control.'],
        [80, Infinity, 'Excellent weed control.'],
      ]);
      return { value: fmt1(wce), label: '%', interpretation: interp };
    },
  },

  // 5.7 Economic Threshold Level
  '5.7': {
    fields: [
      { key: 'c', label: 'Cost of control (C)', unit: '$/ha', defaultValue: 30, step: 1 },
      { key: 'v', label: 'Crop market value (V)', unit: '$/unit', defaultValue: 0.2, step: 0.01 },
      { key: 'i', label: 'Injury per pest (I)', unit: 'damage/pest', defaultValue: 0.01, step: 0.001 },
      { key: 'd', label: 'Pest density (D)', unit: 'pests/unit', defaultValue: 1, step: 0.1 },
      { key: 'k', label: 'Damage avoided (K)', unit: 'decimal 0-1', defaultValue: 0.8, step: 0.05 },
    ],
    compute: (v) => {
      const etl = v.c / (v.v * v.i * v.d * v.k);
      return { value: fmt2(etl), label: 'pests/unit', interpretation: `Spray only when pest density exceeds ${fmt2(etl)} pests per unit.` };
    },
  },

  // 6.1 Net Irrigation Requirement
  '6.1': {
    fields: [
      { key: 'etc', label: 'Crop Evapotranspiration (ETc)', unit: 'mm', defaultValue: 450, step: 10 },
      { key: 'pe', label: 'Effective Rainfall', unit: 'mm', defaultValue: 120, step: 10 },
    ],
    compute: (v) => {
      const nir = v.etc - v.pe;
      return { value: fmt0(nir), label: 'mm', interpretation: `Crop needs ${fmt0(nir)} mm of irrigation water (≈ ${fmt0(nir * 10)} m³/ha).` };
    },
  },

  // 6.2 Gross Irrigation Requirement
  '6.2': {
    fields: [
      { key: 'nir', label: 'Net Irrigation Requirement', unit: 'mm', defaultValue: 330, step: 10 },
      { key: 'ea', label: 'Application Efficiency', unit: 'decimal (0-1)', defaultValue: 0.75, step: 0.05 },
    ],
    compute: (v) => {
      const gir = v.nir / v.ea;
      return { value: fmt0(gir), label: 'mm', interpretation: `Apply ${fmt0(gir)} mm at the field level to deliver ${v.nir} mm to the root zone.` };
    },
  },

  // 6.4 Water Use Efficiency
  '6.4': {
    fields: [
      { key: 'yield', label: 'Yield', unit: 'kg/ha', defaultValue: 5000, step: 100 },
      { key: 'water', label: 'Water Used', unit: 'mm (or m³/ha ÷ 10)', defaultValue: 450, step: 10 },
    ],
    compute: (v) => {
      const wue = v.yield / v.water;
      const interp = rangeInterp(wue, [
        [0, 5, 'Low WUE — investigate drought stress, evaporation losses, or low-yielding variety.'],
        [5, 15, 'Moderate WUE — typical of rainfed or surface-irrigated systems.'],
        [15, Infinity, 'Excellent WUE — typical of well-managed drip-irrigated systems.'],
      ]);
      return { value: fmt2(wue), label: 'kg/mm', interpretation: interp };
    },
  },

  // 7.1 Bulk Density
  '7.1': {
    fields: [
      { key: 'mass', label: 'Oven-dry Soil Mass', unit: 'g', defaultValue: 130, step: 1 },
      { key: 'volume', label: 'Total Soil Volume', unit: 'cm³', defaultValue: 100, step: 1 },
    ],
    compute: (v) => {
      const bd = v.mass / v.volume;
      const interp = rangeInterp(bd, [
        [0, 1.1, 'Very loose soil — possibly high OM or sandy.'],
        [1.1, 1.6, 'Normal range for mineral soils.'],
        [1.6, Infinity, 'Compacted — root growth likely restricted.'],
      ]);
      return { value: fmt2(bd), label: 'g/cm³', interpretation: interp };
    },
  },

  // 7.3 Porosity
  '7.3': {
    fields: [
      { key: 'bd', label: 'Bulk Density', unit: 'g/cm³', defaultValue: 1.3, step: 0.05 },
      { key: 'pd', label: 'Particle Density', unit: 'g/cm³', defaultValue: 2.65, step: 0.05 },
    ],
    compute: (v) => {
      const n = (1 - v.bd / v.pd) * 100;
      const interp = rangeInterp(n, [
        [0, 40, 'Low porosity — poor aeration and root penetration.'],
        [40, 55, 'Healthy porosity range for crop growth.'],
        [55, Infinity, 'High porosity — good aeration but possibly low water retention.'],
      ]);
      return { value: fmt1(n), label: '%', interpretation: interp };
    },
  },

  // 7.10 SAR
  '7.10': {
    fields: [
      { key: 'na', label: 'Sodium (Na⁺)', unit: 'mmol/L', defaultValue: 12, step: 0.5 },
      { key: 'ca', label: 'Calcium (Ca²⁺)', unit: 'mmol/L', defaultValue: 4, step: 0.5 },
      { key: 'mg', label: 'Magnesium (Mg²⁺)', unit: 'mmol/L', defaultValue: 2, step: 0.5 },
    ],
    compute: (v) => {
      const sar = v.na / Math.sqrt((v.ca + v.mg) / 2);
      const interp = rangeInterp(sar, [
        [0, 13, 'Safe — no sodicity hazard.'],
        [13, 25, 'Moderate sodicity risk — monitor soil structure.'],
        [25, Infinity, 'High sodicity — gypsum amendment recommended.'],
      ]);
      return { value: fmt2(sar), label: '(mmol/L)^0.5', interpretation: interp };
    },
  },

  // 8.1 Absolute Growth Rate
  '8.1': {
    fields: [
      { key: 'w1', label: 'Initial weight (W₁)', unit: 'g', defaultValue: 10, step: 0.5 },
      { key: 'w2', label: 'Final weight (W₂)', unit: 'g', defaultValue: 40, step: 0.5 },
      { key: 't1', label: 'Initial time (t₁)', unit: 'days', defaultValue: 20, step: 1 },
      { key: 't2', label: 'Final time (t₂)', unit: 'days', defaultValue: 40, step: 1 },
    ],
    compute: (v) => {
      const agr = (v.w2 - v.w1) / (v.t2 - v.t1);
      return { value: fmt2(agr), label: 'g/day', interpretation: `Plant is gaining ${fmt2(agr)} g per day over this period.` };
    },
  },

  // 8.9 Harvest Index
  '8.9': {
    fields: [
      { key: 'economic', label: 'Economic Yield', unit: 'kg/ha', defaultValue: 5000, step: 100 },
      { key: 'biological', label: 'Biological Yield', unit: 'kg/ha', defaultValue: 12000, step: 100 },
    ],
    compute: (v) => {
      const hi = (v.economic / v.biological) * 100;
      const interp = rangeInterp(hi, [
        [0, 30, 'Low HI — poor partitioning, possibly lodging or stress.'],
        [30, 50, 'Typical range (30–50%) for cereals.'],
        [50, Infinity, 'Excellent partitioning.'],
      ]);
      return { value: fmt1(hi), label: '%', interpretation: interp };
    },
  },

  // 8.12 GDD
  '8.12': {
    fields: [
      { key: 'tmax', label: 'Max Temperature', unit: '°C', defaultValue: 28, step: 0.5 },
      { key: 'tmin', label: 'Min Temperature', unit: '°C', defaultValue: 16, step: 0.5 },
      { key: 'tbase', label: 'Base Temperature', unit: '°C', defaultValue: 10, step: 0.5 },
    ],
    compute: (v) => {
      const gdd = Math.max(0, ((v.tmax + v.tmin) / 2) - v.tbase);
      return { value: fmt1(gdd), label: '°Cd / day', interpretation: `Daily heat unit accumulation. Sum across growing season to predict phenology.` };
    },
  },

  // 9.1 NDVI
  '9.1': {
    fields: [
      { key: 'nir', label: 'NIR reflectance', unit: '0-1', defaultValue: 0.5, step: 0.01 },
      { key: 'red', label: 'Red reflectance', unit: '0-1', defaultValue: 0.1, step: 0.01 },
    ],
    compute: (v) => {
      const ndvi = (v.nir - v.red) / (v.nir + v.red);
      const interp = rangeInterp(ndvi, [
        [-1, 0.2, 'Bare soil, water, or stressed vegetation.'],
        [0.2, 0.5, 'Sparse or unhealthy vegetation.'],
        [0.5, 0.8, 'Healthy, dense vegetation.'],
        [0.8, 1, 'Very dense, vigorous vegetation.'],
      ]);
      return { value: fmt3(ndvi), label: 'NDVI', interpretation: interp };
    },
  },

  // 9.2 SAVI
  '9.2': {
    fields: [
      { key: 'nir', label: 'NIR reflectance', unit: '0-1', defaultValue: 0.5, step: 0.01 },
      { key: 'red', label: 'Red reflectance', unit: '0-1', defaultValue: 0.1, step: 0.01 },
      { key: 'L', label: 'Soil brightness L', unit: '0-1', defaultValue: 0.5, step: 0.1 },
    ],
    compute: (v) => {
      const savi = ((v.nir - v.red) * (1 + v.L)) / (v.nir + v.red + v.L);
      return { value: fmt3(savi), label: 'SAVI', interpretation: 'Soil-adjusted vegetation index — useful for sparse canopy where soil background is visible.' };
    },
  },

  // 9.5 VHI
  '9.5': {
    fields: [
      { key: 'vci', label: 'Vegetation Condition Index (VCI)', unit: '0-100', defaultValue: 60, step: 1 },
      { key: 'tci', label: 'Temperature Condition Index (TCI)', unit: '0-100', defaultValue: 50, step: 1 },
      { key: 'a', label: 'Weight (a) for VCI', unit: '0-1', defaultValue: 0.5, step: 0.05 },
    ],
    compute: (v) => {
      const vhi = v.a * v.vci + (1 - v.a) * v.tci;
      const interp = rangeInterp(vhi, [
        [0, 25, 'Severe vegetation stress / drought.'],
        [25, 50, 'Moderate stress.'],
        [50, 75, 'Mild stress.'],
        [75, 101, 'Healthy vegetation.'],
      ]);
      return { value: fmt1(vhi), label: 'VHI', interpretation: interp };
    },
  },

  // ============= PART III: ANIMAL PRODUCTION =============

  // 10.1 Dry Matter Intake
  '10.1': {
    fields: [
      { key: 'offered', label: 'Feed offered', unit: 'kg/day', defaultValue: 25, step: 0.5 },
      { key: 'refused', label: 'Feed refused', unit: 'kg/day', defaultValue: 3, step: 0.5 },
    ],
    compute: (v) => {
      const dmi = v.offered - v.refused;
      return { value: fmt1(dmi), label: 'kg/day', interpretation: `Animal is consuming ${fmt1(dmi)} kg dry matter per day.` };
    },
  },

  // 10.6 FCR (general animal)
  '10.6': {
    fields: [
      { key: 'feed', label: 'Feed intake (DM)', unit: 'kg', defaultValue: 600, step: 10 },
      { key: 'gain', label: 'Weight gain', unit: 'kg', defaultValue: 200, step: 5 },
    ],
    compute: (v) => {
      const fcr = v.feed / v.gain;
      const interp = rangeInterp(fcr, [
        [0, 2, 'Excellent FCR — typical of poultry.'],
        [2, 5, 'Moderate FCR — typical of pigs or fast-growing beef.'],
        [5, 10, 'High FCR — typical of slow-growing ruminants.'],
        [10, Infinity, 'Very high FCR — investigate nutrition or health.'],
      ]);
      return { value: fmt2(fcr), label: 'kg feed/kg gain', interpretation: interp };
    },
  },

  // 10.9 Energy-Corrected Milk
  '10.9': {
    fields: [
      { key: 'milk', label: 'Milk Yield', unit: 'kg/day', defaultValue: 30, step: 0.5 },
      { key: 'fat', label: 'Fat %', unit: '%', defaultValue: 3.8, step: 0.1 },
      { key: 'protein', label: 'Protein %', unit: '%', defaultValue: 3.2, step: 0.1 },
    ],
    compute: (v) => {
      const ecm = 0.327 * v.milk + 12.95 * v.milk * (v.fat / 100) + 7.2 * v.milk * (v.protein / 100);
      return { value: fmt1(ecm), label: 'kg ECM/day', interpretation: 'Energy-corrected milk standardizes yield to 4% fat, 3.2% protein for fair comparison.' };
    },
  },

  // 11.1 ADG
  '11.1': {
    fields: [
      { key: 'finalWt', label: 'Final Weight', unit: 'kg', defaultValue: 450, step: 5 },
      { key: 'initialWt', label: 'Initial Weight', unit: 'kg', defaultValue: 350, step: 5 },
      { key: 'days', label: 'Days on Feed', unit: 'days', defaultValue: 100, step: 1 },
    ],
    compute: (v) => {
      const adg = (v.finalWt - v.initialWt) / v.days;
      const interp = rangeInterp(adg, [
        [0, 0.5, 'Low ADG — investigate nutrition, health, or stress.'],
        [0.5, 1.5, 'Normal ADG for growing cattle.'],
        [1.5, Infinity, 'Excellent ADG — typical of feedlot cattle.'],
      ]);
      return { value: fmt3(adg), label: 'kg/day', interpretation: interp };
    },
  },

  // 11.4 Kleiber Ratio
  '11.4': {
    fields: [
      { key: 'adg', label: 'ADG', unit: 'kg/day', defaultValue: 1, step: 0.05 },
      { key: 'bw', label: 'Body Weight', unit: 'kg', defaultValue: 300, step: 5 },
    ],
    compute: (v) => {
      const mw = Math.pow(v.bw, 0.75);
      const kr = v.adg / mw;
      return { value: fmt4(kr), label: 'kg/day/kg^0.75', interpretation: `Metabolic weight = ${fmt1(mw)} kg^0.75. Higher KR = better growth efficiency for size.` };
    },
  },

  // 12.1 Conception Rate
  '12.1': {
    fields: [
      { key: 'conceived', label: 'Animals conceived', unit: 'count', defaultValue: 80, step: 1 },
      { key: 'inseminated', label: 'Animals inseminated', unit: 'count', defaultValue: 100, step: 1 },
    ],
    compute: (v) => {
      const cr = (v.conceived / v.inseminated) * 100;
      const interp = rangeInterp(cr, [
        [0, 50, 'Poor conception rate — investigate fertility, nutrition, or AI technique.'],
        [50, 70, 'Moderate conception rate.'],
        [70, Infinity, 'Good conception rate.'],
      ]);
      return { value: fmt1(cr), label: '%', interpretation: interp };
    },
  },

  // 12.6 Calving Interval
  '12.6': {
    fields: [
      { key: 'gestation', label: 'Gestation length', unit: 'days', defaultValue: 280, step: 1 },
      { key: 'daysOpen', label: 'Days open', unit: 'days', defaultValue: 85, step: 1 },
    ],
    compute: (v) => {
      const ci = v.gestation + v.daysOpen;
      const interp = rangeInterp(ci, [
        [0, 365, 'Excellent — calving every 12 months.'],
        [365, 400, 'Acceptable — 12–13 month interval.'],
        [400, 450, 'Long interval — review reproduction program.'],
        [450, Infinity, 'Problematic — significant reproductive inefficiency.'],
      ]);
      return { value: fmt0(ci), label: 'days', interpretation: interp };
    },
  },

  // 13.2 Fat-Corrected Milk (4%)
  '13.2': {
    fields: [
      { key: 'milk', label: 'Milk Yield', unit: 'kg/day', defaultValue: 30, step: 0.5 },
      { key: 'fat', label: 'Fat %', unit: '%', defaultValue: 3.8, step: 0.1 },
    ],
    compute: (v) => {
      const fcm = 0.4 * v.milk + 15 * v.milk * (v.fat / 100);
      return { value: fmt1(fcm), label: 'kg FCM/day', interpretation: '4%-fat-corrected milk — used to compare yields across different fat levels.' };
    },
  },

  // 13.6 Persistency Index
  '13.6': {
    fields: [
      { key: 'laterYield', label: 'Milk yield (later month)', unit: 'kg/day', defaultValue: 28, step: 0.5 },
      { key: 'peakYield', label: 'Peak milk yield', unit: 'kg/day', defaultValue: 35, step: 0.5 },
    ],
    compute: (v) => {
      const pi = (v.laterYield / v.peakYield) * 100;
      const interp = rangeInterp(pi, [
        [0, 70, 'Low persistency — yield dropping fast.'],
        [70, 90, 'Moderate persistency.'],
        [90, Infinity, 'Excellent persistency — flat lactation curve.'],
      ]);
      return { value: fmt1(pi), label: '%', interpretation: interp };
    },
  },

  // 13.8 Somatic Cell Score
  '13.8': {
    fields: [
      { key: 'scc', label: 'Somatic Cell Count (SCC)', unit: 'cells/mL', defaultValue: 200000, step: 10000 },
    ],
    compute: (v) => {
      const scs = Math.log2(v.scc / 100000) + 3;
      const interp = rangeInterp(v.scc, [
        [0, 100000, 'Excellent udder health (SCS < 4).'],
        [100000, 200000, 'Good udder health (SCS 4-5).'],
        [200000, 400000, 'Subclinical mastitis suspected (SCS 5-6).'],
        [400000, Infinity, 'Mastitis — investigate (SCS > 6).'],
      ]);
      return { value: fmt1(scs), label: 'SCS', interpretation: interp };
    },
  },

  // 14.1 Dressing Percentage
  '14.1': {
    fields: [
      { key: 'carcass', label: 'Hot Carcass Weight', unit: 'kg', defaultValue: 320, step: 5 },
      { key: 'liveWt', label: 'Live Weight', unit: 'kg', defaultValue: 500, step: 5 },
    ],
    compute: (v) => {
      const dp = (v.carcass / v.liveWt) * 100;
      const interp = rangeInterp(dp, [
        [0, 50, 'Low dressing % — check for excess fat trim or gut fill.'],
        [50, 60, 'Typical dressing % range for cattle (50–60%).'],
        [60, Infinity, 'High dressing % — typical of well-finished grain-fed cattle.'],
      ]);
      return { value: fmt1(dp), label: '%', interpretation: interp };
    },
  },

  // 14.5 BPEF/EBI Broiler
  '14.5': {
    fields: [
      { key: 'livability', label: 'Livability %', unit: '%', defaultValue: 96, step: 0.5 },
      { key: 'bw', label: 'Body Weight', unit: 'kg', defaultValue: 2.5, step: 0.05 },
      { key: 'age', label: 'Age at harvest', unit: 'days', defaultValue: 42, step: 1 },
      { key: 'fcr', label: 'FCR', unit: 'kg/kg', defaultValue: 1.7, step: 0.05 },
    ],
    compute: (v) => {
      const ebi = ((v.livability * v.bw) / (v.age * v.fcr)) * 100;
      const interp = rangeInterp(ebi, [
        [0, 200, 'Below average broiler performance.'],
        [200, 300, 'Average broiler performance.'],
        [300, 400, 'Good broiler performance.'],
        [400, Infinity, 'Excellent broiler performance.'],
      ]);
      return { value: fmt0(ebi), label: 'EBI', interpretation: interp };
    },
  },

  // 15.1 Hen-Day Egg Production
  '15.1': {
    fields: [
      { key: 'eggs', label: 'Eggs produced', unit: 'count/day', defaultValue: 280, step: 1 },
      { key: 'hens', label: 'Hens present', unit: 'count', defaultValue: 300, step: 1 },
    ],
    compute: (v) => {
      const hdep = (v.eggs / v.hens) * 100;
      const interp = rangeInterp(hdep, [
        [0, 60, 'Low production — investigate nutrition, disease, or stress.'],
        [60, 80, 'Moderate production.'],
        [80, 95, 'Good production.'],
        [95, Infinity, 'Excellent production.'],
      ]);
      return { value: fmt1(hdep), label: '%', interpretation: interp };
    },
  },

  // 15.8 Haugh Unit
  '15.8': {
    fields: [
      { key: 'height', label: 'Albumen height (H)', unit: 'mm', defaultValue: 7, step: 0.1 },
      { key: 'weight', label: 'Egg weight (W)', unit: 'g', defaultValue: 60, step: 1 },
    ],
    compute: (v) => {
      const hu = 100 * Math.log10(v.height - 1.7 * Math.pow(v.weight, 0.37) + 7.6);
      const interp = rangeInterp(hu, [
        [0, 60, 'Low quality (Grade C).'],
        [60, 72, 'Acceptable quality (Grade B).'],
        [72, 90, 'Good quality (Grade A).'],
        [90, Infinity, 'Excellent quality (Grade AA).'],
      ]);
      return { value: fmt1(hu), label: 'HU', interpretation: interp };
    },
  },

  // ============= PART IV: SUSTAINABILITY & ECONOMICS =============

  // 16.1 Aridity Index
  '16.1': {
    fields: [
      { key: 'p', label: 'Annual precipitation (P)', unit: 'mm', defaultValue: 400, step: 10 },
      { key: 'pet', label: 'Potential evapotranspiration (PET)', unit: 'mm', defaultValue: 1500, step: 10 },
    ],
    compute: (v) => {
      const ai = v.p / v.pet;
      const interp = rangeInterp(ai, [
        [0, 0.03, 'Hyper-arid.'],
        [0.03, 0.2, 'Arid.'],
        [0.2, 0.5, 'Semi-arid.'],
        [0.5, 0.65, 'Dry sub-humid.'],
        [0.65, Infinity, 'Humid.'],
      ]);
      return { value: fmt3(ai), label: 'AI', interpretation: interp };
    },
  },

  // 16.2 Moisture Deficit Index
  '16.2': {
    fields: [
      { key: 'pet', label: 'PET', unit: 'mm', defaultValue: 1500, step: 10 },
      { key: 'p', label: 'Precipitation (P)', unit: 'mm', defaultValue: 400, step: 10 },
    ],
    compute: (v) => {
      const mdi = (v.pet - v.p) / v.pet;
      const interp = mdi > 0.5
        ? 'Severe moisture deficit.'
        : mdi > 0.2 ? 'Moderate moisture deficit.' : 'Mild or no moisture deficit.';
      return { value: fmt2(mdi), label: 'MDI', interpretation: interp };
    },
  },

  // 17.1 Benefit-Cost Ratio
  '17.1': {
    fields: [
      { key: 'returns', label: 'Total gross returns', unit: '$/ha', defaultValue: 3000, step: 50 },
      { key: 'costs', label: 'Total costs', unit: '$/ha', defaultValue: 2200, step: 50 },
    ],
    compute: (v) => {
      const bc = v.returns / v.costs;
      const interp = bc > 1
        ? `Profitable — each $1 of cost returns $${fmt2(bc)}.`
        : `Not profitable — each $1 of cost returns only $${fmt2(bc)}.`;
      return { value: fmt2(bc), label: 'B:C ratio', interpretation: interp };
    },
  },

  // 17.2 Gross Margin
  '17.2': {
    fields: [
      { key: 'revenue', label: 'Gross Revenue', unit: '$/ha', defaultValue: 3000, step: 50 },
      { key: 'variableCosts', label: 'Variable Costs', unit: '$/ha', defaultValue: 1800, step: 50 },
    ],
    compute: (v) => {
      const gm = v.revenue - v.variableCosts;
      const interp = gm < 0
        ? 'Negative gross margin — variable costs exceed revenue. Urgent review needed.'
        : gm > 1500 ? 'Strong gross margin — healthy profitability.' : 'Moderate gross margin — review for cost optimization opportunities.';
      return { value: fmt0(gm), label: '$/ha', interpretation: interp };
    },
  },

  // 17.3 NPV (simplified single-period cashflow projection)
  '17.3': {
    fields: [
      { key: 'cf1', label: 'Year 1 cash flow', unit: '$', defaultValue: 5000, step: 100 },
      { key: 'cf2', label: 'Year 2 cash flow', unit: '$', defaultValue: 6000, step: 100 },
      { key: 'cf3', label: 'Year 3 cash flow', unit: '$', defaultValue: 7000, step: 100 },
      { key: 'r', label: 'Discount rate (r)', unit: 'decimal', defaultValue: 0.1, step: 0.01 },
      { key: 'initial', label: 'Initial investment', unit: '$', defaultValue: 12000, step: 500 },
    ],
    compute: (v) => {
      const npv = v.cf1 / Math.pow(1 + v.r, 1) + v.cf2 / Math.pow(1 + v.r, 2) + v.cf3 / Math.pow(1 + v.r, 3) - v.initial;
      const interp = npv > 0
        ? `Positive NPV — investment is financially viable (adds $${fmt0(npv)} in present value).`
        : `Negative NPV — investment not financially viable at this discount rate.`;
      return { value: fmt0(npv), label: '$ NPV', interpretation: interp };
    },
  },

  // 22.1 Shannon Diversity Index
  '22.1': {
    fields: [
      { key: 'p1', label: 'Proportion species 1 (p₁)', unit: 'decimal', defaultValue: 0.4, step: 0.05 },
      { key: 'p2', label: 'Proportion species 2 (p₂)', unit: 'decimal', defaultValue: 0.3, step: 0.05 },
      { key: 'p3', label: 'Proportion species 3 (p₃)', unit: 'decimal', defaultValue: 0.2, step: 0.05 },
      { key: 'p4', label: 'Proportion species 4 (p₄)', unit: 'decimal', defaultValue: 0.1, step: 0.05 },
    ],
    compute: (v) => {
      const ps = [v.p1, v.p2, v.p3, v.p4].filter(p => p > 0);
      const h = -ps.reduce((sum, p) => sum + p * Math.log(p), 0);
      const hmax = Math.log(ps.length);
      const evenness = hmax > 0 ? h / hmax : 0;
      const interp = h > 1.5
        ? `High diversity. Evenness (H/Hmax) = ${fmt2(evenness)}.`
        : h > 0.8 ? `Moderate diversity. Evenness = ${fmt2(evenness)}.` : `Low diversity. Evenness = ${fmt2(evenness)}.`;
      return { value: fmt2(h), label: "H'", interpretation: interp };
    },
  },

  // ============= PART VII: ADVANCED CROP SCIENCE =============

  // 29.1 Microbial Biomass Carbon
  '29.1': {
    fields: [
      { key: 'cf', label: 'C fumigated', unit: 'mg C/kg', defaultValue: 350, step: 5 },
      { key: 'cc', label: 'C control', unit: 'mg C/kg', defaultValue: 150, step: 5 },
      { key: 'kec', label: 'kEC (extraction efficiency)', unit: 'decimal', defaultValue: 0.45, step: 0.01 },
    ],
    compute: (v) => {
      const mbc = (v.cf - v.cc) / v.kec;
      const interp = rangeInterp(mbc, [
        [0, 100, 'Low microbial biomass — degraded or stressed soil.'],
        [100, 250, 'Moderate microbial biomass.'],
        [250, 600, 'Good microbial biomass.'],
        [600, Infinity, 'Excellent microbial biomass.'],
      ]);
      return { value: fmt0(mbc), label: 'mg C/kg soil', interpretation: interp };
    },
  },

  // 30.2 Leaf Appearance Rate
  '30.2': {
    fields: [
      { key: 'leaves', label: 'Number of leaves', unit: 'count', defaultValue: 5, step: 1 },
      { key: 'thermalTime', label: 'Thermal time elapsed', unit: '°Cd', defaultValue: 400, step: 10 },
    ],
    compute: (v) => {
      const lar = v.leaves / v.thermalTime;
      return { value: fmt4(lar), label: 'leaves/°Cd', interpretation: `Predicts leaf development rate at given thermal time.` };
    },
  },

  // 30.3 Phyllochron
  '30.3': {
    fields: [
      { key: 'thermalTime', label: 'Thermal time between leaves', unit: '°Cd', defaultValue: 80, step: 5 },
    ],
    compute: (v) => {
      const phyllochron = v.thermalTime;
      const interp = phyllochron < 70
        ? 'Fast leaf development — warm conditions.'
        : phyllochron > 120 ? 'Slow leaf development — cool conditions.' : 'Typical phyllochron for cereals.';
      return { value: fmt0(phyllochron), label: '°Cd/leaf', interpretation: interp };
    },
  },

  // 31.1 Daily Light Integral
  '31.1': {
    fields: [
      { key: 'ppfd', label: 'PPFD', unit: 'µmol/m²/s', defaultValue: 500, step: 10 },
      { key: 'hours', label: 'Photoperiod', unit: 'hours', defaultValue: 14, step: 0.5 },
    ],
    compute: (v) => {
      const dli = (v.ppfd * 3600 * v.hours) / 1000000;
      const interp = rangeInterp(dli, [
        [0, 5, 'Low light — minimal growth.'],
        [5, 15, 'Moderate light — winter greenhouse.'],
        [15, 25, 'Good light — most crops productive.'],
        [25, Infinity, 'High light — optimal for fruiting crops.'],
      ]);
      return { value: fmt1(dli), label: 'mol/m²/day', interpretation: interp };
    },
  },

  // 31.2 Vapor Pressure Deficit
  '31.2': {
    fields: [
      { key: 't', label: 'Temperature (T)', unit: '°C', defaultValue: 25, step: 0.5 },
      { key: 'rh', label: 'Relative Humidity (RH)', unit: '%', defaultValue: 60, step: 1 },
    ],
    compute: (v) => {
      const svp = 0.6108 * Math.exp((17.27 * v.t) / (v.t + 237.3));
      const vpd = svp * (1 - v.rh / 100);
      const interp = rangeInterp(vpd, [
        [0, 0.4, 'Low VPD — high humidity, disease risk.'],
        [0.4, 1.2, 'Optimal VPD for most crops.'],
        [1.2, 2.0, 'High VPD — increased transpiration.'],
        [2.0, Infinity, 'Very high VPD — stomatal closure likely.'],
      ]);
      return { value: fmt2(vpd), label: 'kPa', interpretation: interp };
    },
  },

  // 32.1 Shade Equivalency Ratio
  '32.1': {
    fields: [
      { key: 'yAgroforestry', label: 'Yield under agroforestry', unit: 't/ha', defaultValue: 3.5, step: 0.1 },
      { key: 'yOpen', label: 'Yield in open field', unit: 't/ha', defaultValue: 4, step: 0.1 },
    ],
    compute: (v) => {
      const ser = v.yAgroforestry / v.yOpen;
      const interp = ser > 0.9
        ? 'Minimal shade penalty — agroforestry competitive.'
        : ser > 0.7 ? 'Moderate shade penalty — offset by tree products.' : 'Significant shade penalty — consider tree pruning.';
      return { value: fmt2(ser), label: 'SER', interpretation: interp };
    },
  },

  // 32.2 Agroforestry LER
  '32.2': {
    fields: [
      { key: 'ytree', label: 'Tree yield (Ytree)', unit: 't/ha', defaultValue: 2, step: 0.1 },
      { key: 'stree', label: 'Sole tree yield', unit: 't/ha', defaultValue: 3, step: 0.1 },
      { key: 'ycrop', label: 'Crop yield (Ycrop)', unit: 't/ha', defaultValue: 3, step: 0.1 },
      { key: 'scrop', label: 'Sole crop yield', unit: 't/ha', defaultValue: 4, step: 0.1 },
    ],
    compute: (v) => {
      const afler = v.ytree / v.stree + v.ycrop / v.scrop;
      const interp = afler > 1
        ? `${fmt((afler - 1) * 100, 0)}% land advantage — agroforestry beneficial.`
        : 'No land advantage — monoculture preferred.';
      return { value: fmt2(afler), label: 'AF-LER', interpretation: interp };
    },
  },

  // 33.1 Weight Loss Percentage
  '33.1': {
    fields: [
      { key: 'initialWt', label: 'Initial weight', unit: 'kg', defaultValue: 100, step: 1 },
      { key: 'finalWt', label: 'Final weight', unit: 'kg', defaultValue: 92, step: 1 },
    ],
    compute: (v) => {
      const wl = ((v.initialWt - v.finalWt) / v.initialWt) * 100;
      const interp = wl < 5 ? 'Acceptable storage loss.' : wl < 10 ? 'Moderate loss — review storage.' : 'High loss — improve storage conditions.';
      return { value: fmt1(wl), label: '%', interpretation: interp };
    },
  },

  // 33.2 Respiration Rate (post-harvest)
  '33.2': {
    fields: [
      { key: 'co2', label: 'CO₂ evolved', unit: 'mg', defaultValue: 50, step: 1 },
      { key: 'weight', label: 'Produce weight', unit: 'kg', defaultValue: 1, step: 0.1 },
      { key: 'time', label: 'Time', unit: 'hours', defaultValue: 1, step: 0.1 },
    ],
    compute: (v) => {
      const rr = v.co2 / (v.weight * v.time);
      const interp = rangeInterp(rr, [
        [0, 10, 'Low respiration — slow-ripening produce (onions, potatoes).'],
        [10, 30, 'Moderate respiration.'],
        [30, Infinity, 'High respiration — rapid-ripening produce (leafy greens, broccoli).'],
      ]);
      return { value: fmt1(rr), label: 'mg CO₂/kg/h', interpretation: interp };
    },
  },

  // 33.3 Q10 Temperature Coefficient
  '33.3': {
    fields: [
      { key: 'rrT', label: 'Respiration rate at T', unit: 'mg/kg/h', defaultValue: 20, step: 1 },
      { key: 'rrT10', label: 'Respiration rate at T+10', unit: 'mg/kg/h', defaultValue: 40, step: 1 },
    ],
    compute: (v) => {
      const q10 = v.rrT10 / v.rrT;
      const interp = rangeInterp(q10, [
        [0, 1.5, 'Low temperature sensitivity.'],
        [1.5, 2.5, 'Normal biological Q10 (~2).'],
        [2.5, 4, 'High temperature sensitivity.'],
        [4, Infinity, 'Very high — rapid spoilage with temperature abuse.'],
      ]);
      return { value: fmt2(q10), label: 'Q₁₀', interpretation: interp };
    },
  },

  // 33.5 Cold Chain Energy Efficiency
  '33.5': {
    fields: [
      { key: 'tonnes', label: 'Tonnes stored', unit: 't', defaultValue: 50, step: 1 },
      { key: 'days', label: 'Storage days', unit: 'days', defaultValue: 30, step: 1 },
      { key: 'energy', label: 'Energy consumed', unit: 'kWh', defaultValue: 3000, step: 100 },
    ],
    compute: (v) => {
      const ccee = (v.tonnes * v.days) / v.energy;
      const interp = ccee > 1 ? 'Efficient cold chain operation.' : ccee > 0.5 ? 'Moderate efficiency.' : 'Inefficient — review insulation and equipment.';
      return { value: fmt2(ccee), label: 't·days/kWh', interpretation: interp };
    },
  },

  // ============= PART VIII: ADVANCED ANIMAL SCIENCE =============

  // 34.1 Specific Growth Rate (aquaculture)
  '34.1': {
    fields: [
      { key: 'w1', label: 'Initial weight (W₁)', unit: 'g', defaultValue: 10, step: 1 },
      { key: 'w2', label: 'Final weight (W₂)', unit: 'g', defaultValue: 100, step: 5 },
      { key: 'days', label: 'Days', unit: 'days', defaultValue: 60, step: 1 },
    ],
    compute: (v) => {
      const sgr = ((Math.log(v.w2) - Math.log(v.w1)) / v.days) * 100;
      const interp = sgr > 3 ? 'Excellent growth rate.' : sgr > 1 ? 'Normal growth rate.' : 'Low growth — investigate.';
      return { value: fmt2(sgr), label: '%/day', interpretation: interp };
    },
  },

  // 34.2 FCR Aquaculture
  '34.2': {
    fields: [
      { key: 'feed', label: 'Feed fed (dry)', unit: 'kg', defaultValue: 1500, step: 50 },
      { key: 'gain', label: 'Wet weight gain', unit: 'kg', defaultValue: 1000, step: 50 },
    ],
    compute: (v) => {
      const fcr = v.feed / v.gain;
      const interp = rangeInterp(fcr, [
        [0, 1.2, 'Excellent — typical of modern salmon farming.'],
        [1.2, 1.8, 'Good — typical of intensive shrimp.'],
        [1.8, 2.5, 'Moderate — typical of tilapia/catfish.'],
        [2.5, Infinity, 'High — investigate feeding practice.'],
      ]);
      return { value: fmt2(fcr), label: 'kg feed/kg fish', interpretation: interp };
    },
  },

  // 34.3 Survival Rate (aquaculture)
  '34.3': {
    fields: [
      { key: 'harvested', label: 'Number harvested', unit: 'count', defaultValue: 9000, step: 100 },
      { key: 'stocked', label: 'Number stocked', unit: 'count', defaultValue: 10000, step: 100 },
    ],
    compute: (v) => {
      const sr = (v.harvested / v.stocked) * 100;
      const interp = rangeInterp(sr, [
        [0, 60, 'Poor survival — investigate disease, predation, water quality.'],
        [60, 80, 'Acceptable survival.'],
        [80, 95, 'Good survival.'],
        [95, Infinity, 'Excellent survival.'],
      ]);
      return { value: fmt1(sr), label: '%', interpretation: interp };
    },
  },

  // 34.4 Stocking Density & Biomass
  '34.4': {
    fields: [
      { key: 'n', label: 'Number of fish', unit: 'count', defaultValue: 500, step: 10 },
      { key: 'avgWt', label: 'Average weight', unit: 'kg', defaultValue: 0.2, step: 0.01 },
      { key: 'volume', label: 'Water volume', unit: 'm³', defaultValue: 50, step: 1 },
    ],
    compute: (v) => {
      const biomass = (v.n * v.avgWt) / v.volume;
      const interp = rangeInterp(biomass, [
        [0, 20, 'Low density — underutilized system.'],
        [20, 60, 'Moderate density.'],
        [60, 120, 'High density — monitor water quality closely.'],
        [120, Infinity, 'Very high density — requires aeration and water exchange.'],
      ]);
      return { value: fmt1(biomass), label: 'kg/m³', interpretation: interp };
    },
  },

  // 35.1 Carrying Capacity
  '35.1': {
    fields: [
      { key: 'forage', label: 'Forage available', unit: 'kg DM/ha', defaultValue: 3000, step: 100 },
      { key: 'req', label: 'Animal requirement', unit: 'kg DM/day', defaultValue: 12, step: 0.5 },
      { key: 'days', label: 'Grazing days', unit: 'days', defaultValue: 100, step: 5 },
    ],
    compute: (v) => {
      const cc = v.forage / (v.req * v.days);
      return { value: fmt1(cc), label: 'AU/ha', interpretation: `Carrying capacity: ${fmt1(cc)} animal units per hectare for ${v.days} days.` };
    },
  },

  // 35.2 Pasture Growth Rate
  '35.2': {
    fields: [
      { key: 'endDm', label: 'DM at end', unit: 'kg DM/ha', defaultValue: 2800, step: 50 },
      { key: 'startDm', label: 'DM at start', unit: 'kg DM/ha', defaultValue: 1200, step: 50 },
      { key: 'days', label: 'Days', unit: 'days', defaultValue: 21, step: 1 },
    ],
    compute: (v) => {
      const pgr = (v.endDm - v.startDm) / v.days;
      const interp = rangeInterp(pgr, [
        [0, 20, 'Slow growth — drought or winter.'],
        [20, 60, 'Moderate growth.'],
        [60, 100, 'Good growth — spring conditions.'],
        [100, Infinity, 'Excellent growth — peak season.'],
      ]);
      return { value: fmt1(pgr), label: 'kg DM/ha/day', interpretation: interp };
    },
  },

  // 35.3 Stocking Rate
  '35.3': {
    fields: [
      { key: 'au', label: 'Animal units', unit: 'AU', defaultValue: 50, step: 1 },
      { key: 'days', label: 'Days grazed', unit: 'days', defaultValue: 30, step: 1 },
      { key: 'ha', label: 'Hectares grazed', unit: 'ha', defaultValue: 10, step: 0.5 },
    ],
    compute: (v) => {
      const sr = (v.au * v.days) / v.ha;
      return { value: fmt0(sr), label: 'AU-days/ha', interpretation: `Stocking pressure: ${fmt0(sr)} AU-days per hectare.` };
    },
  },

  // 35.5 Forage Utilization Efficiency
  '35.5': {
    fields: [
      { key: 'consumed', label: 'Forage consumed', unit: 'kg DM/ha', defaultValue: 2000, step: 50 },
      { key: 'grown', label: 'Forage grown', unit: 'kg DM/ha', defaultValue: 3000, step: 50 },
    ],
    compute: (v) => {
      const fue = (v.consumed / v.grown) * 100;
      const interp = rangeInterp(fue, [
        [0, 40, 'Under-utilization — wasteful, pasture quality may decline.'],
        [40, 60, 'Optimal utilization.'],
        [60, 75, 'Heavy utilization — monitor recovery.'],
        [75, Infinity, 'Over-grazing — long-term pasture damage likely.'],
      ]);
      return { value: fmt1(fue), label: '%', interpretation: interp };
    },
  },

  // 36.2 Varroa Mite Infestation
  '36.2': {
    fields: [
      { key: 'mites', label: 'Mites counted', unit: 'count', defaultValue: 15, step: 1 },
      { key: 'bees', label: 'Bees sampled', unit: 'count', defaultValue: 300, step: 10 },
    ],
    compute: (v) => {
      const vir = (v.mites / v.bees) * 100;
      const interp = rangeInterp(vir, [
        [0, 1, 'Low — below treatment threshold.'],
        [1, 3, 'Moderate — monitor closely.'],
        [3, 5, 'High — treatment recommended.'],
        [5, Infinity, 'Severe — treat immediately.'],
      ]);
      return { value: fmt2(vir), label: '%', interpretation: interp };
    },
  },

  // 36.3 Honey Yield per Colony
  '36.3': {
    fields: [
      { key: 'honey', label: 'Total honey harvested', unit: 'kg', defaultValue: 180, step: 5 },
      { key: 'colonies', label: 'Number of colonies', unit: 'count', defaultValue: 12, step: 1 },
    ],
    compute: (v) => {
      const hy = v.honey / v.colonies;
      const interp = rangeInterp(hy, [
        [0, 10, 'Low yield — investigate colony health or nectar flow.'],
        [10, 25, 'Moderate yield.'],
        [25, 50, 'Good yield.'],
        [50, Infinity, 'Excellent yield — commercial-grade production.'],
      ]);
      return { value: fmt1(hy), label: 'kg/colony', interpretation: interp };
    },
  },

  // 37.1 Temperature-Humidity Index
  '37.1': {
    fields: [
      { key: 't', label: 'Temperature (T)', unit: '°C', defaultValue: 30, step: 0.5 },
      { key: 'rh', label: 'Relative Humidity (RH)', unit: '%', defaultValue: 70, step: 1 },
    ],
    compute: (v) => {
      const thi = (1.8 * v.t + 32) - (0.55 - 0.0055 * v.rh) * (1.8 * v.t - 26);
      const interp = rangeInterp(thi, [
        [0, 68, 'Comfortable — no heat stress.'],
        [68, 72, 'Mild heat stress — milk yield may decline slightly.'],
        [72, 80, 'Moderate stress — provide shade and ventilation.'],
        [80, 90, 'Severe stress — production losses likely.'],
        [90, Infinity, 'Extreme stress — animal welfare risk.'],
      ]);
      return { value: fmt1(thi), label: 'THI', interpretation: interp };
    },
  },

  // ============= PART IX: DIGITAL AGRICULTURE =============

  // 38.2 Mean Absolute Error
  '38.2': {
    fields: [
      { key: 'p1', label: 'Predicted 1', unit: '', defaultValue: 5.2, step: 0.1 },
      { key: 'o1', label: 'Observed 1', unit: '', defaultValue: 5.0, step: 0.1 },
      { key: 'p2', label: 'Predicted 2', unit: '', defaultValue: 4.8, step: 0.1 },
      { key: 'o2', label: 'Observed 2', unit: '', defaultValue: 4.5, step: 0.1 },
      { key: 'p3', label: 'Predicted 3', unit: '', defaultValue: 6.1, step: 0.1 },
      { key: 'o3', label: 'Observed 3', unit: '', defaultValue: 5.8, step: 0.1 },
    ],
    compute: (v) => {
      const errors = [Math.abs(v.p1 - v.o1), Math.abs(v.p2 - v.o2), Math.abs(v.p3 - v.o3)];
      const mae = errors.reduce((a, b) => a + b, 0) / errors.length;
      return { value: fmt3(mae), label: 'MAE', interpretation: `Average absolute prediction error of ${fmt3(mae)} units.` };
    },
  },

  // 38.4 R²
  '38.4': {
    fields: [
      { key: 'ssRes', label: 'SS residual', unit: '', defaultValue: 5.2, step: 0.1 },
      { key: 'ssTot', label: 'SS total', unit: '', defaultValue: 18.7, step: 0.1 },
    ],
    compute: (v) => {
      const r2 = 1 - v.ssRes / v.ssTot;
      const interp = rangeInterp(r2, [
        [0, 0.3, 'Poor model fit.'],
        [0.3, 0.6, 'Moderate fit.'],
        [0.6, 0.85, 'Good fit.'],
        [0.85, 1, 'Excellent fit.'],
      ]);
      return { value: fmt3(r2), label: 'R²', interpretation: interp };
    },
  },

  // 39.1 Ground Sampling Distance
  '39.1': {
    fields: [
      { key: 'alt', label: 'Altitude', unit: 'm', defaultValue: 100, step: 5 },
      { key: 'sensorWidth', label: 'Sensor width', unit: 'mm', defaultValue: 13.2, step: 0.1 },
      { key: 'focal', label: 'Focal length', unit: 'mm', defaultValue: 8, step: 0.5 },
      { key: 'imgWidth', label: 'Image width', unit: 'px', defaultValue: 5472, step: 100 },
    ],
    compute: (v) => {
      const gsd = (v.alt * v.sensorWidth * 100) / (v.focal * v.imgWidth);
      const interp = gsd < 2 ? 'High resolution — suitable for detailed crop scouting.' :
                    gsd < 5 ? 'Medium resolution — suitable for general field mapping.' : 'Coarse resolution — suitable for overview imagery.';
      return { value: fmt2(gsd), label: 'cm/px', interpretation: interp };
    },
  },

  // 39.2 Flight Coverage Rate
  '39.2': {
    fields: [
      { key: 'speed', label: 'Speed', unit: 'm/s', defaultValue: 15, step: 1 },
      { key: 'swath', label: 'Swath width', unit: 'm', defaultValue: 100, step: 5 },
    ],
    compute: (v) => {
      const cov = (v.speed * v.swath * 3600) / 10000;
      const interp = cov > 50 ? 'High coverage rate — suitable for large farms.' : cov > 20 ? 'Moderate coverage rate.' : 'Low coverage — suitable for small plots.';
      return { value: fmt1(cov), label: 'ha/hour', interpretation: interp };
    },
  },

  // 39.3 Spray Drone Application Rate
  '39.3': {
    fields: [
      { key: 'flow', label: 'Flow rate', unit: 'L/min', defaultValue: 4, step: 0.5 },
      { key: 'speed', label: 'Speed', unit: 'm/s', defaultValue: 5, step: 0.5 },
      { key: 'swath', label: 'Swath', unit: 'm', defaultValue: 4, step: 0.5 },
    ],
    compute: (v) => {
      const rate = (v.flow * 60) / (v.speed * v.swath * 0.36);
      const interp = rangeInterp(rate, [
        [0, 15, 'Low volume — ULV application.'],
        [15, 40, 'Standard application rate.'],
        [40, 80, 'High volume application.'],
        [80, Infinity, 'Very high volume — risk of runoff.'],
      ]);
      return { value: fmt1(rate), label: 'L/ha', interpretation: interp };
    },
  },

  // 40.2 Data Completeness Index
  '40.2': {
    fields: [
      { key: 'received', label: 'Records received', unit: 'count', defaultValue: 9500, step: 50 },
      { key: 'expected', label: 'Expected records', unit: 'count', defaultValue: 10000, step: 50 },
    ],
    compute: (v) => {
      const dci = (v.received / v.expected) * 100;
      const interp = dci > 95 ? 'Excellent data completeness.' : dci > 80 ? 'Acceptable completeness.' : 'Poor completeness — check sensor health.';
      return { value: fmt1(dci), label: '%', interpretation: interp };
    },
  },

  // 40.3 Alert Z-score
  '40.3': {
    fields: [
      { key: 'obs', label: 'Observation', unit: '', defaultValue: 28, step: 0.5 },
      { key: 'mean', label: 'Rolling mean', unit: '', defaultValue: 22, step: 0.5 },
      { key: 'sd', label: 'Rolling SD', unit: '', defaultValue: 2, step: 0.1 },
    ],
    compute: (v) => {
      const z = (v.obs - v.mean) / v.sd;
      const interp = rangeInterp(Math.abs(z), [
        [0, 2, 'Normal range.'],
        [2, 3, 'Elevated — investigate.'],
        [3, 4, 'Anomaly — likely alert.'],
        [4, Infinity, 'Critical anomaly — investigate immediately.'],
      ]);
      return { value: fmt2(z), label: 'Z-score', interpretation: interp };
    },
  },

  // 41.1 Soil Carbon Stock
  '41.1': {
    fields: [
      { key: 'soc', label: 'Soil Organic Carbon (SOC)', unit: '%', defaultValue: 1.5, step: 0.1 },
      { key: 'bd', label: 'Bulk Density', unit: 'g/cm³', defaultValue: 1.3, step: 0.05 },
      { key: 'depth', label: 'Depth', unit: 'cm', defaultValue: 30, step: 1 },
    ],
    compute: (v) => {
      const scs = (v.soc * v.bd * v.depth * 100) / 100;
      const interp = rangeInterp(scs, [
        [0, 30, 'Low carbon stock — depleted soil.'],
        [30, 60, 'Moderate carbon stock.'],
        [60, 100, 'Good carbon stock.'],
        [100, Infinity, 'High carbon stock — healthy soil.'],
      ]);
      return { value: fmt1(scs), label: 't C/ha', interpretation: interp };
    },
  },

  // 41.2 Annual Soil Carbon Change
  '41.2': {
    fields: [
      { key: 'scsMonitor', label: 'SCS (monitoring year)', unit: 't C/ha', defaultValue: 65, step: 1 },
      { key: 'scsBaseline', label: 'SCS (baseline)', unit: 't C/ha', defaultValue: 55, step: 1 },
      { key: 'years', label: 'Years between', unit: 'years', defaultValue: 5, step: 1 },
    ],
    compute: (v) => {
      const dc = ((v.scsMonitor - v.scsBaseline) / v.years) * 3.67;
      const interp = dc > 0
        ? `Carbon gain of ${fmt2(dc)} t CO₂-eq/ha/yr — qualifies for carbon credits.`
        : `Carbon loss of ${fmt2(Math.abs(dc))} t CO₂-eq/ha/yr — concerning.`;
      return { value: fmt2(dc), label: 't CO₂-eq/ha/yr', interpretation: interp };
    },
  },

  // 41.3 N2O Emissions (IPCC Tier 1)
  '41.3': {
    fields: [
      { key: 'n', label: 'N applied', unit: 'kg N/ha', defaultValue: 120, step: 5 },
      { key: 'ef1', label: 'Emission factor EF1', unit: 'decimal', defaultValue: 0.01, step: 0.001 },
    ],
    compute: (v) => {
      const n2o = v.n * v.ef1;
      const co2eq = n2o * 298; // GWP of N2O over 100 years
      return { value: fmt2(n2o), label: 'kg N as N₂O/ha', interpretation: `≈ ${fmt0(co2eq)} kg CO₂-eq/ha (using GWP100 = 298).` };
    },
  },

  // ============= PART X: ADVANCED FARM ECONOMICS =============

  // 42.1 Marketing Margin
  '42.1': {
    fields: [
      { key: 'consumer', label: 'Consumer price', unit: '$/unit', defaultValue: 3.5, step: 0.1 },
      { key: 'farmgate', label: 'Farm-gate price', unit: '$/unit', defaultValue: 1.5, step: 0.1 },
    ],
    compute: (v) => {
      const mm = v.consumer - v.farmgate;
      const mmPct = (mm / v.consumer) * 100;
      return { value: fmt2(mm), label: '$/unit', interpretation: `Marketing margin = ${fmt2(mm)} (${fmt0(mmPct)}% of consumer price).` };
    },
  },

  // 42.2 Farm-Gate Price Ratio
  '42.2': {
    fields: [
      { key: 'fg', label: 'Farm-gate price', unit: '$/unit', defaultValue: 200, step: 5 },
      { key: 'ref', label: 'Reference (world) price', unit: '$/unit', defaultValue: 250, step: 5 },
    ],
    compute: (v) => {
      const fgpr = v.fg / v.ref;
      const interp = fgpr > 0.9 ? 'Close to world price — competitive market.' : fgpr > 0.6 ? 'Moderate price gap — market inefficiencies.' : 'Large price gap — investigate value chain.';
      return { value: fmt2(fgpr), label: 'ratio', interpretation: interp };
    },
  },

  // 43.1 Coefficient of Variation
  '43.1': {
    fields: [
      { key: 'sd', label: 'Standard deviation', unit: '', defaultValue: 0.8, step: 0.05 },
      { key: 'mean', label: 'Mean', unit: '', defaultValue: 4.5, step: 0.1 },
    ],
    compute: (v) => {
      const cv = (v.sd / v.mean) * 100;
      const interp = rangeInterp(cv, [
        [0, 15, 'Low variability — stable system.'],
        [15, 30, 'Moderate variability.'],
        [30, 50, 'High variability — significant risk.'],
        [50, Infinity, 'Very high variability — unstable system.'],
      ]);
      return { value: fmt1(cv), label: '%', interpretation: interp };
    },
  },

  // 43.2 Value at Risk (95%)
  '43.2': {
    fields: [
      { key: 'mean', label: 'Mean yield', unit: 't/ha', defaultValue: 5, step: 0.1 },
      { key: 'sd', label: 'Standard deviation', unit: 't/ha', defaultValue: 0.8, step: 0.05 },
    ],
    compute: (v) => {
      const var95 = v.mean - 1.645 * v.sd;
      const interp = var95 < 0
        ? 'Significant risk of complete crop failure in worst 5% of years.'
        : `In the worst 5% of years, yield is expected to fall below ${fmt2(var95)} t/ha.`;
      return { value: fmt2(var95), label: 't/ha (95% VaR)', interpretation: interp };
    },
  },

  // 43.3 Insurance Premium Rate
  '43.3': {
    fields: [
      { key: 'expectedLoss', label: 'Expected loss', unit: '$/ha', defaultValue: 100, step: 5 },
      { key: 'sumInsured', label: 'Sum insured', unit: '$/ha', defaultValue: 1000, step: 50 },
      { key: 'loading', label: 'Loading factor', unit: 'decimal', defaultValue: 1.3, step: 0.05 },
    ],
    compute: (v) => {
      const rate = (v.expectedLoss / v.sumInsured) * v.loading * 100;
      const premium = v.sumInsured * (rate / 100);
      return { value: fmt2(rate), label: '% premium rate', interpretation: `Premium amount: $${fmt2(premium)}/ha.` };
    },
  },

  // 44.1 Economic Water Productivity
  '44.1': {
    fields: [
      { key: 'value', label: 'Gross value of production', unit: '$/ha', defaultValue: 3000, step: 50 },
      { key: 'water', label: 'Water consumed', unit: 'm³/ha', defaultValue: 4500, step: 100 },
    ],
    compute: (v) => {
      const ewp = v.value / v.water;
      const interp = ewp > 1 ? 'High economic water productivity.' : ewp > 0.3 ? 'Moderate productivity.' : 'Low productivity — review water management.';
      return { value: fmt2(ewp), label: '$/m³', interpretation: interp };
    },
  },

  // 44.3 Groundwater Depletion Rate
  '44.3': {
    fields: [
      { key: 'extract', label: 'Extraction rate', unit: 'mm/yr', defaultValue: 350, step: 10 },
      { key: 'recharge', label: 'Recharge rate', unit: 'mm/yr', defaultValue: 100, step: 10 },
    ],
    compute: (v) => {
      const gdr = v.extract - v.recharge;
      const interp = gdr > 0
        ? `Depleting at ${fmt0(gdr)} mm/yr — unsustainable.`
        : `Sustainable — recharge exceeds extraction by ${fmt0(-gdr)} mm/yr.`;
      return { value: fmt0(gdr), label: 'mm/yr', interpretation: interp };
    },
  },

  // 45.2 Labor Productivity
  '45.2': {
    fields: [
      { key: 'output', label: 'Gross output value', unit: '$', defaultValue: 50000, step: 1000 },
      { key: 'hours', label: 'Total labor hours', unit: 'hours', defaultValue: 2000, step: 50 },
    ],
    compute: (v) => {
      const lp = v.output / v.hours;
      const interp = lp > 50 ? 'High labor productivity.' : lp > 20 ? 'Moderate labor productivity.' : 'Low labor productivity — review labor allocation.';
      return { value: fmt2(lp), label: '$/hour', interpretation: interp };
    },
  },

  // ============= PART XII: SOIL & CROP ADVANCED =============

  // 49.1 Leaching Requirement (Salinity)
  '49.1': {
    fields: [
      { key: 'eciw', label: 'EC irrigation water (ECiw)', unit: 'dS/m', defaultValue: 2, step: 0.1 },
      { key: 'eceThreshold', label: 'ECe threshold (crop)', unit: 'dS/m', defaultValue: 6, step: 0.5 },
    ],
    compute: (v) => {
      const lr = v.eciw / (5 * v.eceThreshold - v.eciw);
      const interp = lr > 0.3 ? 'High leaching requirement — salt buildup risk.' : lr > 0.1 ? 'Moderate leaching needed.' : 'Low leaching requirement.';
      return { value: fmt2(lr), label: 'LR (fraction)', interpretation: interp };
    },
  },

  // 49.3 Relative Yield under Salinity
  '49.3': {
    fields: [
      { key: 'b', label: 'Slope (b)', unit: '%/dS·m⁻¹', defaultValue: 12, step: 1 },
      { key: 'ece', label: 'ECe actual', unit: 'dS/m', defaultValue: 8, step: 0.5 },
      { key: 'threshold', label: 'ECe threshold', unit: 'dS/m', defaultValue: 6, step: 0.5 },
    ],
    compute: (v) => {
      const ry = Math.max(0, 100 - v.b * (v.ece - v.threshold));
      return { value: fmt1(ry), label: '%', interpretation: `Relative yield expected: ${fmt1(ry)}% of potential.` };
    },
  },

  // 50.1 Nitrogen Fixation Credit
  '50.1': {
    fields: [
      { key: 'biomass', label: 'Biomass DM', unit: 'kg/ha', defaultValue: 5000, step: 100 },
      { key: 'nPct', label: 'N content', unit: '%', defaultValue: 3, step: 0.1 },
      { key: 'ndfa', label: 'Ndfa fraction', unit: 'decimal 0-1', defaultValue: 0.7, step: 0.05 },
    ],
    compute: (v) => {
      const nfc = v.biomass * (v.nPct / 100) * v.ndfa;
      return { value: fmt0(nfc), label: 'kg N/ha', interpretation: `Cover crop contributes ${fmt0(nfc)} kg N/ha to next crop.` };
    },
  },

  // 50.2 Biomass Production Index
  '50.2': {
    fields: [
      { key: 'dm', label: 'Cover crop DM', unit: 'kg/ha', defaultValue: 5000, step: 100 },
      { key: 'days', label: 'Days of growth', unit: 'days', defaultValue: 90, step: 5 },
    ],
    compute: (v) => {
      const bpi = v.dm / v.days;
      const interp = bpi > 80 ? 'Excellent biomass accumulation.' : bpi > 40 ? 'Moderate biomass.' : 'Low biomass — investigate establishment.';
      return { value: fmt1(bpi), label: 'kg DM/ha/day', interpretation: interp };
    },
  },

  // 50.3 Rotation Diversity Index
  '50.3': {
    fields: [
      { key: 'p1', label: 'Proportion crop 1', unit: 'decimal', defaultValue: 0.5, step: 0.05 },
      { key: 'p2', label: 'Proportion crop 2', unit: 'decimal', defaultValue: 0.3, step: 0.05 },
      { key: 'p3', label: 'Proportion crop 3', unit: 'decimal', defaultValue: 0.2, step: 0.05 },
    ],
    compute: (v) => {
      const ps = [v.p1, v.p2, v.p3].filter(p => p > 0);
      const rdi = 1 - ps.reduce((sum, p) => sum + p * p, 0);
      const interp = rdi > 0.7 ? 'High diversity.' : rdi > 0.5 ? 'Moderate diversity.' : 'Low diversity.';
      return { value: fmt3(rdi), label: 'RDI', interpretation: interp };
    },
  },

  // 50.4 Soil Cover Percentage
  '50.4': {
    fields: [
      { key: 'covered', label: 'Covered area', unit: '%', defaultValue: 70, step: 5 },
      { key: 'total', label: 'Total area', unit: '%', defaultValue: 100, step: 5 },
    ],
    compute: (v) => {
      const scp = (v.covered / v.total) * 100;
      const interp = scp > 80 ? 'Excellent soil cover — low erosion risk.' : scp > 50 ? 'Moderate cover.' : 'Poor cover — high erosion risk.';
      return { value: fmt0(scp), label: '%', interpretation: interp };
    },
  },

  // 51.1 Germination Index
  '51.1': {
    fields: [
      { key: 'g1', label: 'Germinated day 1', unit: 'seeds', defaultValue: 5, step: 1 },
      { key: 'd1', label: 'Day 1', unit: 'days', defaultValue: 3, step: 1 },
      { key: 'g2', label: 'Germinated day 2', unit: 'seeds', defaultValue: 15, step: 1 },
      { key: 'd2', label: 'Day 2', unit: 'days', defaultValue: 5, step: 1 },
      { key: 'g3', label: 'Germinated day 3', unit: 'seeds', defaultValue: 30, step: 1 },
      { key: 'd3', label: 'Day 3', unit: 'days', defaultValue: 7, step: 1 },
    ],
    compute: (v) => {
      const gi = (v.g1 / v.d1) + (v.g2 / v.d2) + (v.g3 / v.d3);
      return { value: fmt1(gi), label: 'GI', interpretation: 'Higher GI = faster and more uniform germination.' };
    },
  },

  // 51.2 Seedling Vigour Index
  '51.2': {
    fields: [
      { key: 'shoot', label: 'Shoot length', unit: 'mm', defaultValue: 60, step: 5 },
      { key: 'root', label: 'Root length', unit: 'mm', defaultValue: 80, step: 5 },
      { key: 'germ', label: 'Germination %', unit: '%', defaultValue: 90, step: 1 },
    ],
    compute: (v) => {
      const svi = ((v.shoot + v.root) * v.germ) / 100;
      const interp = svi > 1500 ? 'High seedling vigour.' : svi > 1000 ? 'Moderate vigour.' : 'Low vigour — investigate seed lot.';
      return { value: fmt0(svi), label: 'SVI', interpretation: interp };
    },
  },

  // 51.3 Mean Germination Time
  '51.3': {
    fields: [
      { key: 'n1', label: 'Seeds germinated day 3', unit: 'count', defaultValue: 10, step: 1 },
      { key: 'n2', label: 'Seeds germinated day 5', unit: 'count', defaultValue: 20, step: 1 },
      { key: 'n3', label: 'Seeds germinated day 7', unit: 'count', defaultValue: 30, step: 1 },
    ],
    compute: (v) => {
      const mgt = (3 * v.n1 + 5 * v.n2 + 7 * v.n3) / (v.n1 + v.n2 + v.n3);
      const interp = mgt < 5 ? 'Fast germination.' : mgt < 7 ? 'Moderate germination speed.' : 'Slow germination — check seed quality.';
      return { value: fmt2(mgt), label: 'days', interpretation: interp };
    },
  },

  // 52.1 Radiation Use Efficiency
  '52.1': {
    fields: [
      { key: 'biomass', label: 'Aboveground biomass', unit: 'kg DM/ha', defaultValue: 12000, step: 100 },
      { key: 'par', label: 'Intercepted PAR', unit: 'MJ/m²', defaultValue: 800, step: 10 },
    ],
    compute: (v) => {
      const biomass_g = v.biomass * 1000; // convert kg/ha to g/ha
      const par_m2 = v.par * 10000; // convert MJ/m² to MJ/ha
      const rue = biomass_g / par_m2;
      const interp = rangeInterp(rue, [
        [0, 1.2, 'Low RUE — light not efficiently converted.'],
        [1.2, 2.5, 'Moderate RUE — typical of C3 crops.'],
        [2.5, 4, 'Good RUE — typical of healthy C4 crops.'],
        [4, Infinity, 'Excellent RUE.'],
      ]);
      return { value: fmt2(rue), label: 'g DM/MJ', interpretation: interp };
    },
  },

  // 52.3 Yield Gap
  '52.3': {
    fields: [
      { key: 'potential', label: 'Potential yield', unit: 't/ha', defaultValue: 10, step: 0.5 },
      { key: 'actual', label: 'Actual yield', unit: 't/ha', defaultValue: 5, step: 0.5 },
    ],
    compute: (v) => {
      const gap = v.potential - v.actual;
      const gapPct = (gap / v.potential) * 100;
      return { value: fmt2(gap), label: 't/ha', interpretation: `Yield gap = ${fmt2(gap)} t/ha (${fmt0(gapPct)}% of potential unrealized).` };
    },
  },

  // 53.3 Mycorrhizal Dependency
  '53.3': {
    fields: [
      { key: 'yWith', label: 'Yield with AMF', unit: 't/ha', defaultValue: 5, step: 0.1 },
      { key: 'yWithout', label: 'Yield without AMF', unit: 't/ha', defaultValue: 3.5, step: 0.1 },
    ],
    compute: (v) => {
      const md = ((v.yWith - v.yWithout) / v.yWith) * 100;
      const interp = md > 30 ? 'High mycorrhizal dependency — inoculation recommended.' : md > 10 ? 'Moderate dependency.' : 'Low dependency — crop not strongly mycotrophic.';
      return { value: fmt1(md), label: '%', interpretation: interp };
    },
  },

  // ============= PART XIII: ANIMAL SPECIALIST =============

  // 54.1 Acetate:Propionate Ratio
  '54.1': {
    fields: [
      { key: 'acetate', label: 'Acetate (molar %)', unit: '%', defaultValue: 65, step: 1 },
      { key: 'propionate', label: 'Propionate (molar %)', unit: '%', defaultValue: 20, step: 1 },
    ],
    compute: (v) => {
      const ap = v.acetate / v.propionate;
      const interp = rangeInterp(ap, [
        [0, 2, 'Grain-heavy diet — risk of acidosis.'],
        [2, 3.5, 'Balanced diet — optimal for production.'],
        [3.5, 5, 'High-forage diet — higher milk fat.'],
        [5, Infinity, 'Very high forage — energy may be limiting.'],
      ]);
      return { value: fmt2(ap), label: 'A:P ratio', interpretation: interp };
    },
  },

  // 54.2 Effective NDF
  '54.2': {
    fields: [
      { key: 'ndfPct', label: 'NDF %', unit: '% of DM', defaultValue: 35, step: 1 },
      { key: 'pef', label: 'Physical effectiveness (pef)', unit: '0-1', defaultValue: 0.8, step: 0.05 },
    ],
    compute: (v) => {
      const endf = v.ndfPct * v.pef;
      const interp = rangeInterp(endf, [
        [0, 15, 'Low eNDF — rumen health risk.'],
        [15, 22, 'Adequate eNDF for high-producing cows.'],
        [22, 30, 'Good eNDF — supports rumination.'],
        [30, Infinity, 'High eNDF — may limit intake.'],
      ]);
      return { value: fmt1(endf), label: '% of DM', interpretation: interp };
    },
  },

  // 54.3 NDFD
  '54.3': {
    fields: [
      { key: 'consumed', label: 'NDF consumed', unit: 'kg', defaultValue: 10, step: 0.5 },
      { key: 'feces', label: 'NDF in feces', unit: 'kg', defaultValue: 3, step: 0.5 },
    ],
    compute: (v) => {
      const ndfd = ((v.consumed - v.feces) / v.consumed) * 100;
      const interp = rangeInterp(ndfd, [
        [0, 40, 'Low digestibility — poor quality forage.'],
        [40, 55, 'Moderate digestibility.'],
        [55, 70, 'Good digestibility.'],
        [70, Infinity, 'Excellent digestibility — high-quality forage.'],
      ]);
      return { value: fmt1(ndfd), label: '%', interpretation: interp };
    },
  },

  // 55.1 Litter Size Index
  '55.1': {
    fields: [
      { key: 'lambs', label: 'Total lambs/kids born alive', unit: 'count', defaultValue: 180, step: 5 },
      { key: 'ewes', label: 'Ewes/does that lambed', unit: 'count', defaultValue: 100, step: 5 },
    ],
    compute: (v) => {
      const lsi = v.lambs / v.ewes;
      const interp = rangeInterp(lsi, [
        [0, 1.2, 'Low prolificacy.'],
        [1.2, 1.6, 'Moderate prolificacy.'],
        [1.6, 2.2, 'Good prolificacy.'],
        [2.2, Infinity, 'High prolificacy — triplets common.'],
      ]);
      return { value: fmt2(lsi), label: 'lambs/ewe', interpretation: interp };
    },
  },

  // 55.3 Milk-to-Liveweight Ratio (Dairy Goats)
  '55.3': {
    fields: [
      { key: 'milk', label: 'Daily milk yield', unit: 'kg/day', defaultValue: 3, step: 0.1 },
      { key: 'bw', label: 'Doe body weight', unit: 'kg', defaultValue: 60, step: 1 },
    ],
    compute: (v) => {
      const mlr = v.milk / v.bw;
      const interp = rangeInterp(mlr, [
        [0, 0.04, 'Low production.'],
        [0.04, 0.06, 'Moderate production.'],
        [0.06, 0.1, 'Good production.'],
        [0.1, Infinity, 'High production dairy goat.'],
      ]);
      return { value: fmt3(mlr), label: 'kg milk/kg BW', interpretation: interp };
    },
  },

  // 56.1 Substrate Conversion Efficiency (insects)
  '56.1': {
    fields: [
      { key: 'gain', label: 'Larval fresh weight gained', unit: 'kg', defaultValue: 5, step: 0.5 },
      { key: 'substrate', label: 'Substrate DM offered', unit: 'kg', defaultValue: 15, step: 0.5 },
    ],
    compute: (v) => {
      const sce = (v.gain / v.substrate) * 100;
      const interp = rangeInterp(sce, [
        [0, 20, 'Low conversion — review substrate quality.'],
        [20, 35, 'Moderate conversion.'],
        [35, 50, 'Good conversion.'],
        [50, Infinity, 'Excellent conversion.'],
      ]);
      return { value: fmt1(sce), label: '%', interpretation: interp };
    },
  },

  // 56.2 Insect FCR
  '56.2': {
    fields: [
      { key: 'feed', label: 'Feed DM consumed', unit: 'kg', defaultValue: 15, step: 0.5 },
      { key: 'gain', label: 'Insect DM gained', unit: 'kg', defaultValue: 3, step: 0.1 },
    ],
    compute: (v) => {
      const fcr = v.feed / v.gain;
      const interp = fcr < 3 ? 'Excellent FCR — BSF or mealworm typical.' : fcr < 5 ? 'Good FCR.' : 'High FCR — investigate.';
      return { value: fmt2(fcr), label: 'kg feed/kg DM', interpretation: interp };
    },
  },

  // 57.1 Heart Rate Recovery Index
  '57.1': {
    fields: [
      { key: 'resting', label: 'Resting HR', unit: 'bpm', defaultValue: 35, step: 1 },
      { key: 'post10', label: 'HR at 10 min post-exercise', unit: 'bpm', defaultValue: 50, step: 1 },
    ],
    compute: (v) => {
      const hrr = (v.resting / v.post10) * 100;
      const interp = rangeInterp(hrr, [
        [0, 60, 'Slow recovery — poor fitness or stress.'],
        [60, 80, 'Moderate recovery.'],
        [80, 100, 'Good recovery — fit animal.'],
        [100, Infinity, 'Excellent recovery.'],
      ]);
      return { value: fmt1(hrr), label: '%', interpretation: interp };
    },
  },

  // 57.2 Stride Length & Frequency
  '57.2': {
    fields: [
      { key: 'length', label: 'Stride length', unit: 'm', defaultValue: 6, step: 0.1 },
      { key: 'freq', label: 'Stride frequency', unit: 'strides/s', defaultValue: 2.2, step: 0.1 },
    ],
    compute: (v) => {
      const speed = v.length * v.freq;
      return { value: fmt2(speed), label: 'm/s', interpretation: `Speed = ${fmt2(speed)} m/s (${fmt2(speed * 3.6)} km/h).` };
    },
  },

  // ============= PART XIV: TECH & TRACEABILITY =============

  // 58.1 Red Edge Position
  '58.1': {
    fields: [
      { key: 'r700', label: 'Reflectance at 700nm', unit: '0-1', defaultValue: 0.25, step: 0.01 },
      { key: 'r740', label: 'Reflectance at 740nm', unit: '0-1', defaultValue: 0.5, step: 0.01 },
    ],
    compute: (v) => {
      const rep = 700 + 40 * (((v.r700 + v.r740) / 2 - v.r700) / (v.r740 - v.r700));
      const interp = rep > 725 ? 'High REP — healthy, chlorophyll-rich vegetation.' : rep > 715 ? 'Moderate chlorophyll.' : 'Low REP — stressed vegetation.';
      return { value: fmt1(rep), label: 'nm', interpretation: interp };
    },
  },

  // 58.2 Anthocyanin Reflectance Index
  '58.2': {
    fields: [
      { key: 'r550', label: 'Reflectance at 550nm', unit: '0-1', defaultValue: 0.08, step: 0.01 },
      { key: 'r700', label: 'Reflectance at 700nm', unit: '0-1', defaultValue: 0.25, step: 0.01 },
    ],
    compute: (v) => {
      const ari = (1 / v.r550) - (1 / v.r700);
      const interp = ari > 5 ? 'High anthocyanin — stress or senescence.' : ari > 2 ? 'Moderate anthocyanin.' : 'Low anthocyanin — healthy green canopy.';
      return { value: fmt2(ari), label: 'ARI', interpretation: interp };
    },
  },

  // 59.1 Cost of Production per Hectare
  '59.1': {
    fields: [
      { key: 'fixed', label: 'Fixed costs', unit: '$', defaultValue: 50000, step: 1000 },
      { key: 'variable', label: 'Variable costs', unit: '$', defaultValue: 80000, step: 1000 },
      { key: 'hectares', label: 'Hectares farmed', unit: 'ha', defaultValue: 100, step: 5 },
    ],
    compute: (v) => {
      const cop = (v.fixed + v.variable) / v.hectares;
      return { value: fmt0(cop), label: '$/ha', interpretation: `Total cost of production: $${fmt0(cop)}/ha.` };
    },
  },

  // 59.2 Input Use Efficiency Score
  '59.2': {
    fields: [
      { key: 'achieved', label: 'Yield achieved', unit: 't/ha', defaultValue: 5, step: 0.1 },
      { key: 'expected', label: 'Yield expected (given inputs)', unit: 't/ha', defaultValue: 6, step: 0.1 },
    ],
    compute: (v) => {
      const iues = v.achieved / v.expected;
      const interp = iues > 0.95 ? 'Excellent input use efficiency.' : iues > 0.8 ? 'Good efficiency.' : 'Low efficiency — inputs not translating to yield.';
      return { value: fmt2(iues), label: 'ratio', interpretation: interp };
    },
  },

  // 60.1 Traceability Completeness
  '60.1': {
    fields: [
      { key: 'traced', label: 'Attributes traced', unit: 'count', defaultValue: 18, step: 1 },
      { key: 'required', label: 'Required attributes', unit: 'count', defaultValue: 20, step: 1 },
    ],
    compute: (v) => {
      const tci = (v.traced / v.required) * 100;
      const interp = tci > 95 ? 'Excellent traceability.' : tci > 80 ? 'Good traceability.' : 'Gaps in traceability — review.';
      return { value: fmt1(tci), label: '%', interpretation: interp };
    },
  },

  // 61.1 Field Efficiency Index
  '61.1': {
    fields: [
      { key: 'effective', label: 'Effective field capacity', unit: 'ha/h', defaultValue: 4, step: 0.1 },
      { key: 'theoretical', label: 'Theoretical field capacity', unit: 'ha/h', defaultValue: 5, step: 0.1 },
    ],
    compute: (v) => {
      const fei = (v.effective / v.theoretical) * 100;
      const interp = rangeInterp(fei, [
        [0, 70, 'Low field efficiency — many turns/idle time.'],
        [70, 85, 'Moderate efficiency.'],
        [85, 100, 'High efficiency.'],
      ]);
      return { value: fmt1(fei), label: '%', interpretation: interp };
    },
  },

  // 61.3 Automation ROI
  '61.3': {
    fields: [
      { key: 'labourSavings', label: 'Annual labour savings', unit: '$', defaultValue: 30000, step: 1000 },
      { key: 'yieldImprovement', label: 'Annual yield improvement value', unit: '$', defaultValue: 15000, step: 1000 },
      { key: 'systemCost', label: 'System cost (annualized)', unit: '$', defaultValue: 25000, step: 1000 },
    ],
    compute: (v) => {
      const roi = ((v.labourSavings + v.yieldImprovement - v.systemCost) / v.systemCost) * 100;
      const interp = roi > 50 ? 'Strong ROI — automation justified.' : roi > 0 ? 'Positive ROI — modest return.' : 'Negative ROI — not financially viable yet.';
      return { value: fmt0(roi), label: '% ROI', interpretation: interp };
    },
  },

  // ============= PART XV: ADVANCED FARM ECONOMICS & POLICY =============

  // 63.1 Partial Budget Analysis
  '63.1': {
    fields: [
      { key: 'addedReturns', label: 'Added returns', unit: '$', defaultValue: 5000, step: 100 },
      { key: 'reducedCosts', label: 'Reduced costs', unit: '$', defaultValue: 1000, step: 100 },
      { key: 'addedCosts', label: 'Added costs', unit: '$', defaultValue: 3000, step: 100 },
      { key: 'reducedReturns', label: 'Reduced returns', unit: '$', defaultValue: 500, step: 100 },
    ],
    compute: (v) => {
      const net = (v.addedReturns + v.reducedCosts) - (v.addedCosts + v.reducedReturns);
      const interp = net > 0 ? `Profitable change — net benefit of $${fmt0(net)}.` : `Net cost of $${fmt0(-net)} — change not justified.`;
      return { value: fmt0(net), label: '$ net', interpretation: interp };
    },
  },

  // 63.2 Return to Family Labour
  '63.2': {
    fields: [
      { key: 'income', label: 'Net farm income', unit: '$', defaultValue: 45000, step: 1000 },
      { key: 'days', label: 'Family labour days', unit: 'days', defaultValue: 300, step: 10 },
    ],
    compute: (v) => {
      const rfl = v.income / v.days;
      const interp = rfl > 100 ? 'Good return to family labour.' : rfl > 50 ? 'Moderate return.' : 'Low return — labour could earn more elsewhere.';
      return { value: fmt0(rfl), label: '$/day', interpretation: interp };
    },
  },

  // 63.3 Break-even Yield
  '63.3': {
    fields: [
      { key: 'costs', label: 'Total variable costs', unit: '$/ha', defaultValue: 1500, step: 50 },
      { key: 'price', label: 'Crop price', unit: '$/t', defaultValue: 250, step: 10 },
    ],
    compute: (v) => {
      const bey = v.costs / v.price;
      return { value: fmt2(bey), label: 't/ha', interpretation: `Must produce at least ${fmt2(bey)} t/ha to cover variable costs.` };
    },
  },

  // 64.1 Land Rent Capitalization Rate
  '64.1': {
    fields: [
      { key: 'rent', label: 'Annual net rent', unit: '$/ha', defaultValue: 300, step: 10 },
      { key: 'capRate', label: 'Capitalization rate', unit: 'decimal', defaultValue: 0.05, step: 0.005 },
    ],
    compute: (v) => {
      const value = v.rent / v.capRate;
      return { value: fmt0(value), label: '$/ha', interpretation: `Estimated land value: $${fmt0(value)}/ha.` };
    },
  },

  // 65.1 Nutrient Recycling Efficiency
  '65.1': {
    fields: [
      { key: 'returned', label: 'Nutrients returned to soil', unit: 'kg/ha', defaultValue: 80, step: 5 },
      { key: 'harvested', label: 'Nutrients harvested', unit: 'kg/ha', defaultValue: 150, step: 5 },
    ],
    compute: (v) => {
      const nre = (v.returned / v.harvested) * 100;
      const interp = nre > 70 ? 'High recycling — closed nutrient loop.' : nre > 40 ? 'Moderate recycling.' : 'Low recycling — external inputs needed.';
      return { value: fmt1(nre), label: '%', interpretation: interp };
    },
  },

  // 65.3 Energy Self-Sufficiency Ratio
  '65.3': {
    fields: [
      { key: 'produced', label: 'On-farm energy production', unit: 'kWh', defaultValue: 30000, step: 1000 },
      { key: 'consumed', label: 'Total energy consumption', unit: 'kWh', defaultValue: 50000, step: 1000 },
    ],
    compute: (v) => {
      const esr = v.produced / v.consumed;
      const interp = esr > 0.8 ? 'Near self-sufficient.' : esr > 0.5 ? 'Moderate self-sufficiency.' : 'Low self-sufficiency — depends on external energy.';
      return { value: fmt2(esr), label: 'ratio', interpretation: interp };
    },
  },

  // 65.4 Crop Residue Utilization Rate
  '65.4': {
    fields: [
      { key: 'used', label: 'Residue used productively', unit: 't/ha', defaultValue: 3, step: 0.1 },
      { key: 'produced', label: 'Total residue produced', unit: 't/ha', defaultValue: 5, step: 0.1 },
    ],
    compute: (v) => {
      const crur = (v.used / v.produced) * 100;
      const interp = crur > 70 ? 'High utilization — careful residue management.' : crur > 40 ? 'Moderate utilization.' : 'Low utilization — consider mulching or grazing.';
      return { value: fmt1(crur), label: '%', interpretation: interp };
    },
  },

  // ============= PART XVI: VISUAL GUIDES & GLOBAL =============

  // 68.1 Cassava Harvest Index
  '68.1': {
    fields: [
      { key: 'root', label: 'Fresh root weight', unit: 't/ha', defaultValue: 30, step: 1 },
      { key: 'total', label: 'Total fresh plant weight', unit: 't/ha', defaultValue: 50, step: 1 },
    ],
    compute: (v) => {
      const hi = (v.root / v.total) * 100;
      const interp = hi > 60 ? 'Excellent HI for cassava.' : hi > 50 ? 'Good HI.' : 'Low HI — investigate partitioning.';
      return { value: fmt1(hi), label: '%', interpretation: interp };
    },
  },

  // 68.2 Cacao Pod Value Index
  '68.2': {
    fields: [
      { key: 'beans', label: 'Bean weight per pod', unit: 'g', defaultValue: 100, step: 5 },
      { key: 'pod', label: 'Pod fresh weight', unit: 'g', defaultValue: 800, step: 25 },
    ],
    compute: (v) => {
      const pvi = (v.beans / v.pod) * 100;
      const interp = pvi > 10 ? 'Excellent pod value index.' : pvi > 7 ? 'Moderate PVI.' : 'Low PVI — investigate variety or pollination.';
      return { value: fmt2(pvi), label: '%', interpretation: interp };
    },
  },

  // 68.3 Banana Bunch Weight Index
  '68.3': {
    fields: [
      { key: 'bunch', label: 'Bunch weight', unit: 'kg', defaultValue: 40, step: 1 },
      { key: 'hands', label: 'Number of hands', unit: 'count', defaultValue: 9, step: 1 },
      { key: 'fingers', label: 'Number of fingers', unit: 'count', defaultValue: 180, step: 5 },
    ],
    compute: (v) => {
      const bwi = v.bunch / v.hands / v.fingers;
      return { value: fmt3(bwi), label: 'kg/hand/finger', interpretation: `Average finger weight: ${fmt2(bwi * 1000)} g.` };
    },
  },

  // 69.1 Rainfall Use Efficiency
  '69.1': {
    fields: [
      { key: 'yield', label: 'Yield', unit: 'kg/ha', defaultValue: 2800, step: 50 },
      { key: 'rainfall', label: 'Growing season rainfall', unit: 'mm', defaultValue: 380, step: 10 },
    ],
    compute: (v) => {
      const rue = v.yield / v.rainfall;
      const interp = rangeInterp(rue, [
        [0, 5, 'Low RUE — typical of unfertilized rainfed cereals.'],
        [5, 10, 'Moderate RUE — typical of smallholder Africa.'],
        [10, 20, 'Good RUE — improved varieties + inputs.'],
        [20, Infinity, 'Excellent RUE.'],
      ]);
      return { value: fmt2(rue), label: 'kg/ha/mm', interpretation: interp };
    },
  },

  // 69.2 Water Harvest Index
  '69.2': {
    fields: [
      { key: 'yield', label: 'Grain yield', unit: 'kg/ha', defaultValue: 2400, step: 50 },
      { key: 'rain', label: 'Rainfall', unit: 'mm', defaultValue: 280, step: 10 },
      { key: 'soilWater', label: 'Stored soil water used', unit: 'mm', defaultValue: 60, step: 5 },
    ],
    compute: (v) => {
      const whi = v.yield / (v.rain + v.soilWater);
      const interp = whi > 10 ? 'Excellent water harvest.' : whi > 5 ? 'Moderate water harvest.' : 'Low — water not efficiently converted to grain.';
      return { value: fmt2(whi), label: 'kg/ha/mm', interpretation: interp };
    },
  },

  // 69.3 Drought Tolerance Index
  '69.3': {
    fields: [
      { key: 'ys', label: 'Stressed yield (Ys)', unit: 't/ha', defaultValue: 3.5, step: 0.1 },
      { key: 'yd', label: 'Drought yield (Yd)', unit: 't/ha', defaultValue: 2.1, step: 0.1 },
      { key: 'yp', label: 'Potential yield (Yp)', unit: 't/ha', defaultValue: 4, step: 0.1 },
    ],
    compute: (v) => {
      const dti = (v.ys * v.yd) / Math.pow(v.yp, 2);
      const interp = dti > 0.5 ? 'High drought tolerance — variety good in both environments.' : dti > 0.3 ? 'Moderate tolerance.' : 'Low tolerance — variety not adapted.';
      return { value: fmt3(dti), label: 'DTI', interpretation: interp };
    },
  },

  // 69.4 Runoff Coefficient
  '69.4': {
    fields: [
      { key: 'runoff', label: 'Runoff volume', unit: 'mm', defaultValue: 18, step: 1 },
      { key: 'rainfall', label: 'Rainfall volume', unit: 'mm', defaultValue: 50, step: 1 },
    ],
    compute: (v) => {
      const rc = v.runoff / v.rainfall;
      const interp = rangeInterp(rc, [
        [0, 0.15, 'Excellent infiltration — good cover.'],
        [0.15, 0.3, 'Moderate runoff.'],
        [0.3, 0.5, 'High runoff — conservation needed.'],
        [0.5, Infinity, 'Very high runoff — bare soil or steep slope.'],
      ]);
      return { value: fmt2(rc), label: 'RC', interpretation: interp };
    },
  },

  // 70.1 Nutrient Density per Hectare
  '70.1': {
    fields: [
      { key: 'yield', label: 'Yield', unit: 'kg/ha', defaultValue: 1200, step: 50 },
      { key: 'nutrient', label: 'Nutrient content', unit: 'g/kg', defaultValue: 215, step: 5 },
      { key: 'req', label: 'Daily requirement', unit: 'g/day', defaultValue: 50, step: 5 },
    ],
    compute: (v) => {
      const nutridens = (v.yield * v.nutrient) / v.req;
      return { value: fmt0(nutridens), label: 'person-days/ha', interpretation: `One hectare can supply protein for ${fmt0(nutridens)} person-days.` };
    },
  },
};
