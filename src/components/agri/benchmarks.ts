// Benchmark ranges for calculator results.
// Each entry defines typical low/high bounds and zone labels so the calculator
// can show a visual indicator of where the user's result falls.
//
// Keep ranges generous — they represent "typical practice", not theoretical limits.

export interface BenchmarkZone {
  /** upper bound of this zone (exclusive); use Infinity for the top zone */
  max: number;
  /** label shown in the visualization, e.g. "Low", "Typical", "High" */
  label: string;
  /** tailwind color classes for the zone bar */
  color: string;
}

export interface Benchmark {
  /** zones, ordered from lowest to highest */
  zones: BenchmarkZone[];
  /** optional unit override for display (defaults to the calculator's result unit) */
  unit?: string;
  /** short description shown under the visualization */
  description?: string;
}

export const benchmarks: Record<string, Benchmark> = {
  // Plant Population — plants/ha
  '2.1': {
    zones: [
      { max: 20000, label: 'Very low', color: 'bg-red-400' },
      { max: 40000, label: 'Low', color: 'bg-amber-400' },
      { max: 70000, label: 'Typical', color: 'bg-emerald-500' },
      { max: 90000, label: 'High', color: 'bg-cyan-400' },
      { max: Infinity, label: 'Very high', color: 'bg-violet-400' },
    ],
    description: 'Typical cereals: 40,000–80,000 plants/ha',
  },

  // Seed Rate — kg/ha
  '2.2': {
    zones: [
      { max: 20, label: 'Low', color: 'bg-amber-400' },
      { max: 100, label: 'Typical', color: 'bg-emerald-500' },
      { max: 200, label: 'High', color: 'bg-cyan-400' },
      { max: Infinity, label: 'Very high', color: 'bg-violet-400' },
    ],
    description: 'Most field crops: 20–100 kg seed/ha',
  },

  // Real Value of Seed — %
  '2.3': {
    zones: [
      { max: 70, label: 'Poor', color: 'bg-red-400' },
      { max: 85, label: 'Acceptable', color: 'bg-amber-400' },
      { max: 95, label: 'Good', color: 'bg-emerald-500' },
      { max: Infinity, label: 'Excellent', color: 'bg-emerald-600' },
    ],
    description: 'Commercial seed standard: >80%',
  },

  // Cropping Intensity — %
  '2.1_unused': { zones: [] }, // placeholder to keep structure

  // LER
  '3.9': {
    zones: [
      { max: 0.8, label: 'Disadvantage', color: 'bg-red-400' },
      { max: 1.0, label: 'Break-even', color: 'bg-amber-400' },
      { max: 1.3, label: 'Beneficial', color: 'bg-emerald-500' },
      { max: Infinity, label: 'Strong advantage', color: 'bg-emerald-600' },
    ],
    description: 'LER > 1.0 means intercropping uses land more efficiently than monoculture',
  },

  // Fertilizer Requirement — kg product/ha
  '4.1': {
    zones: [
      { max: 50, label: 'Low', color: 'bg-amber-400' },
      { max: 300, label: 'Typical', color: 'bg-emerald-500' },
      { max: 600, label: 'High', color: 'bg-cyan-400' },
      { max: Infinity, label: 'Very high', color: 'bg-violet-400' },
    ],
    description: 'Most crops: 50–300 kg fertilizer product/ha',
  },

  // Agronomic Efficiency — kg grain/kg nutrient
  '4.8a': {
    zones: [
      { max: 10, label: 'Low', color: 'bg-red-400' },
      { max: 25, label: 'Typical', color: 'bg-emerald-500' },
      { max: Infinity, label: 'High', color: 'bg-emerald-600' },
    ],
    description: 'Cereals typically: 10–25 kg grain per kg N',
  },

  // Apparent Nutrient Recovery — %
  '4.8b': {
    zones: [
      { max: 30, label: 'Low', color: 'bg-red-400' },
      { max: 60, label: 'Typical', color: 'bg-emerald-500' },
      { max: Infinity, label: 'High', color: 'bg-emerald-600' },
    ],
    description: 'Cereals typically recover 30–60% of applied N',
  },

  // Partial Factor Productivity — kg/kg
  '4.8c': {
    zones: [
      { max: 30, label: 'Low', color: 'bg-red-400' },
      { max: 60, label: 'Typical', color: 'bg-emerald-500' },
      { max: Infinity, label: 'High', color: 'bg-emerald-600' },
    ],
    description: 'World average cereal PFP: ~40 kg/kg',
  },

  // Weed Control Efficiency — %
  '5.1': {
    zones: [
      { max: 50, label: 'Poor', color: 'bg-red-400' },
      { max: 80, label: 'Moderate', color: 'bg-amber-400' },
      { max: Infinity, label: 'Excellent', color: 'bg-emerald-500' },
    ],
    description: 'Good weed control: >80% reduction in weed biomass',
  },

  // NIR — mm
  '6.1': {
    zones: [
      { max: 100, label: 'Low demand', color: 'bg-emerald-500' },
      { max: 400, label: 'Typical', color: 'bg-amber-400' },
      { max: 700, label: 'High demand', color: 'bg-orange-400' },
      { max: Infinity, label: 'Very high', color: 'bg-red-400' },
    ],
    description: 'Most irrigated crops need 300–600 mm/season',
  },

  // GIR — mm
  '6.2': {
    zones: [
      { max: 200, label: 'Low', color: 'bg-emerald-500' },
      { max: 600, label: 'Typical', color: 'bg-amber-400' },
      { max: 1000, label: 'High', color: 'bg-orange-400' },
      { max: Infinity, label: 'Very high', color: 'bg-red-400' },
    ],
    description: 'Accounts for system efficiency losses',
  },

  // WUE — kg/mm
  '6.4': {
    zones: [
      { max: 5, label: 'Low', color: 'bg-red-400' },
      { max: 15, label: 'Typical', color: 'bg-emerald-500' },
      { max: Infinity, label: 'Excellent', color: 'bg-emerald-600' },
    ],
    description: 'Rainfed cereals: 5–15 kg/mm; drip irrigated: >15',
  },

  // Bulk Density — g/cm³
  '7.1': {
    zones: [
      { max: 1.1, label: 'Very loose', color: 'bg-amber-400' },
      { max: 1.6, label: 'Normal', color: 'bg-emerald-500' },
      { max: Infinity, label: 'Compacted', color: 'bg-red-400' },
    ],
    description: 'Mineral soils: 1.1–1.6 g/cm³; >1.6 restricts roots',
  },

  // Porosity — %
  '7.3': {
    zones: [
      { max: 40, label: 'Low', color: 'bg-red-400' },
      { max: 55, label: 'Healthy', color: 'bg-emerald-500' },
      { max: Infinity, label: 'High', color: 'bg-cyan-400' },
    ],
    description: 'Ideal crop porosity: 40–55%',
  },

  // SAR
  '7.10': {
    zones: [
      { max: 13, label: 'Safe', color: 'bg-emerald-500' },
      { max: 25, label: 'Moderate risk', color: 'bg-amber-400' },
      { max: Infinity, label: 'High sodicity', color: 'bg-red-400' },
    ],
    description: 'SAR > 13 = sodicity hazard; gypsum may be needed',
  },

  // Harvest Index — %
  '8.9': {
    zones: [
      { max: 30, label: 'Low', color: 'bg-red-400' },
      { max: 50, label: 'Typical', color: 'bg-emerald-500' },
      { max: Infinity, label: 'Excellent', color: 'bg-emerald-600' },
    ],
    description: 'Modern cereals: 40–55%; below 30% indicates stress',
  },

  // GDD — °Cd/day
  '8.12': {
    zones: [
      { max: 5, label: 'Slow', color: 'bg-cyan-400' },
      { max: 15, label: 'Typical', color: 'bg-emerald-500' },
      { max: 25, label: 'Fast', color: 'bg-amber-400' },
      { max: Infinity, label: 'Very fast', color: 'bg-orange-400' },
    ],
    description: 'Maize base 10°C: typical 10–20 °Cd/day in season',
  },

  // NDVI
  '9.1': {
    zones: [
      { max: 0.2, label: 'Bare/sparse', color: 'bg-red-400' },
      { max: 0.5, label: 'Stressed', color: 'bg-amber-400' },
      { max: 0.8, label: 'Healthy', color: 'bg-emerald-500' },
      { max: 1, label: 'Dense', color: 'bg-emerald-600' },
    ],
    description: 'NDVI range: -1 to +1; healthy crops 0.5–0.8',
  },

  // ECM — kg/day
  '10.9': {
    zones: [
      { max: 15, label: 'Low', color: 'bg-red-400' },
      { max: 30, label: 'Typical', color: 'bg-emerald-500' },
      { max: 45, label: 'High', color: 'bg-emerald-600' },
      { max: Infinity, label: 'Exceptional', color: 'bg-violet-400' },
    ],
    description: 'Holstein average: ~30 kg ECM/day; >40 is excellent',
  },

  // FCR (general)
  '10.6': {
    zones: [
      { max: 2, label: 'Excellent', color: 'bg-emerald-600' },
      { max: 5, label: 'Good', color: 'bg-emerald-500' },
      { max: 10, label: 'High', color: 'bg-amber-400' },
      { max: Infinity, label: 'Very high', color: 'bg-red-400' },
    ],
    description: 'Poultry ~1.5; pigs ~2.5; beef ~6; lower is better',
  },

  // ADG — kg/day
  '11.1': {
    zones: [
      { max: 0.5, label: 'Low', color: 'bg-red-400' },
      { max: 1.5, label: 'Normal', color: 'bg-emerald-500' },
      { max: Infinity, label: 'Excellent', color: 'bg-emerald-600' },
    ],
    description: 'Feedlot cattle: 1.0–1.8 kg/day; cows: 0.3–0.7',
  },

  // Conception Rate — %
  '12.1': {
    zones: [
      { max: 50, label: 'Poor', color: 'bg-red-400' },
      { max: 70, label: 'Moderate', color: 'bg-amber-400' },
      { max: Infinity, label: 'Good', color: 'bg-emerald-500' },
    ],
    description: 'Good AI conception: >70%',
  },

  // Calving Interval — days
  '12.6': {
    zones: [
      { max: 365, label: 'Excellent', color: 'bg-emerald-600' },
      { max: 400, label: 'Acceptable', color: 'bg-emerald-500' },
      { max: 450, label: 'Long', color: 'bg-amber-400' },
      { max: Infinity, label: 'Problematic', color: 'bg-red-400' },
    ],
    description: 'Target: 365 days (annual calving)',
  },

  // FCM — kg/day
  '13.2': {
    zones: [
      { max: 15, label: 'Low', color: 'bg-red-400' },
      { max: 30, label: 'Typical', color: 'bg-emerald-500' },
      { max: Infinity, label: 'High', color: 'bg-emerald-600' },
    ],
    description: 'Standardized to 4% fat',
  },

  // Persistency Index — %
  '13.6': {
    zones: [
      { max: 70, label: 'Low', color: 'bg-red-400' },
      { max: 90, label: 'Moderate', color: 'bg-amber-400' },
      { max: Infinity, label: 'Excellent', color: 'bg-emerald-500' },
    ],
    description: 'Good persistency: >90% (flat lactation curve)',
  },

  // SCS
  '13.8': {
    zones: [
      { max: 4, label: 'Excellent', color: 'bg-emerald-600' },
      { max: 5, label: 'Good', color: 'bg-emerald-500' },
      { max: 6, label: 'Subclinical', color: 'bg-amber-400' },
      { max: Infinity, label: 'Mastitis', color: 'bg-red-400' },
    ],
    description: 'SCS < 4 = healthy; >6 = clinical mastitis risk',
  },

  // Dressing % — %
  '14.1': {
    zones: [
      { max: 50, label: 'Low', color: 'bg-amber-400' },
      { max: 60, label: 'Typical', color: 'bg-emerald-500' },
      { max: Infinity, label: 'High', color: 'bg-emerald-600' },
    ],
    description: 'Cattle: 50–60%; pigs: 70–75%; poultry: 70–75%',
  },

  // BPEF/EBI
  '14.5': {
    zones: [
      { max: 200, label: 'Below average', color: 'bg-red-400' },
      { max: 300, label: 'Average', color: 'bg-amber-400' },
      { max: 400, label: 'Good', color: 'bg-emerald-500' },
      { max: Infinity, label: 'Excellent', color: 'bg-emerald-600' },
    ],
    description: 'Commercial broiler target: >300',
  },

  // HDEP — %
  '15.1': {
    zones: [
      { max: 60, label: 'Low', color: 'bg-red-400' },
      { max: 80, label: 'Moderate', color: 'bg-amber-400' },
      { max: 95, label: 'Good', color: 'bg-emerald-500' },
      { max: Infinity, label: 'Excellent', color: 'bg-emerald-600' },
    ],
    description: 'Commercial layers: 90–95% peak',
  },

  // Haugh Unit
  '15.8': {
    zones: [
      { max: 60, label: 'Grade C', color: 'bg-red-400' },
      { max: 72, label: 'Grade B', color: 'bg-amber-400' },
      { max: 90, label: 'Grade A', color: 'bg-emerald-500' },
      { max: Infinity, label: 'Grade AA', color: 'bg-emerald-600' },
    ],
    description: 'Egg quality: AA > 90; A 72–90; B 60–72',
  },

  // Aridity Index
  '16.1': {
    zones: [
      { max: 0.03, label: 'Hyper-arid', color: 'bg-red-400' },
      { max: 0.2, label: 'Arid', color: 'bg-orange-400' },
      { max: 0.5, label: 'Semi-arid', color: 'bg-amber-400' },
      { max: 0.65, label: 'Dry sub-humid', color: 'bg-emerald-500' },
      { max: Infinity, label: 'Humid', color: 'bg-emerald-600' },
    ],
    description: 'UNEP classification; <0.5 = water-limited',
  },

  // Benefit-Cost Ratio
  '17.1': {
    zones: [
      { max: 1, label: 'Not profitable', color: 'bg-red-400' },
      { max: 1.5, label: 'Marginal', color: 'bg-amber-400' },
      { max: 2.5, label: 'Profitable', color: 'bg-emerald-500' },
      { max: Infinity, label: 'Very profitable', color: 'bg-emerald-600' },
    ],
    description: 'B:C > 1 = profitable; >2 = strong',
  },

  // Gross Margin — $/ha
  '17.2': {
    zones: [
      { max: 0, label: 'Loss', color: 'bg-red-400' },
      { max: 1000, label: 'Moderate', color: 'bg-amber-400' },
      { max: 2000, label: 'Good', color: 'bg-emerald-500' },
      { max: Infinity, label: 'Strong', color: 'bg-emerald-600' },
    ],
    description: 'Per hectare; varies widely by crop and region',
  },

  // THI
  '37.1': {
    zones: [
      { max: 68, label: 'Comfortable', color: 'bg-emerald-600' },
      { max: 72, label: 'Mild stress', color: 'bg-emerald-500' },
      { max: 80, label: 'Moderate', color: 'bg-amber-400' },
      { max: 90, label: 'Severe', color: 'bg-orange-400' },
      { max: Infinity, label: 'Extreme', color: 'bg-red-400' },
    ],
    description: 'Dairy cattle: >72 reduces milk yield; >80 severe',
  },

  // Soil Carbon Stock — t C/ha
  '41.1': {
    zones: [
      { max: 30, label: 'Low', color: 'bg-red-400' },
      { max: 60, label: 'Moderate', color: 'bg-amber-400' },
      { max: 100, label: 'Good', color: 'bg-emerald-500' },
      { max: Infinity, label: 'High', color: 'bg-emerald-600' },
    ],
    description: '0–30cm; >60 t C/ha may qualify for carbon credits',
  },

  // Break-even Yield — t/ha
  '63.3': {
    zones: [
      { max: 2, label: 'Low break-even', color: 'bg-emerald-600' },
      { max: 5, label: 'Typical', color: 'bg-emerald-500' },
      { max: 8, label: 'High', color: 'bg-amber-400' },
      { max: Infinity, label: 'Very high', color: 'bg-red-400' },
    ],
    description: 'Lower is better — easier to profit',
  },

  // RUE (rainfall) — kg/ha/mm
  '69.1': {
    zones: [
      { max: 5, label: 'Low', color: 'bg-red-400' },
      { max: 10, label: 'Moderate', color: 'bg-amber-400' },
      { max: 20, label: 'Good', color: 'bg-emerald-500' },
      { max: Infinity, label: 'Excellent', color: 'bg-emerald-600' },
    ],
    description: 'Rainfed Africa: 5–10; improved systems: 12–20',
  },

  // Runoff Coefficient
  '69.4': {
    zones: [
      { max: 0.15, label: 'Excellent', color: 'bg-emerald-600' },
      { max: 0.3, label: 'Moderate', color: 'bg-amber-400' },
      { max: 0.5, label: 'High', color: 'bg-orange-400' },
      { max: Infinity, label: 'Very high', color: 'bg-red-400' },
    ],
    description: 'Lower is better; <0.15 = good infiltration',
  },

  // ============= IRRIGATION ENGINEERING (Part XVIII) =============

  // IRR-1.1 Continuity Equation — Q (m³/s)
  'IRR-1.1': {
    zones: [
      { max: 0.01, label: 'Small', color: 'bg-cyan-400' },
      { max: 0.1, label: 'Medium', color: 'bg-emerald-500' },
      { max: 1, label: 'Large', color: 'bg-amber-400' },
      { max: Infinity, label: 'Very large', color: 'bg-orange-400' },
    ],
    description: 'Farm laterals: 0.005–0.05; main lines: 0.05–0.5 m³/s',
  },

  // IRR-1.3 Reynolds Number
  'IRR-1.3': {
    zones: [
      { max: 2300, label: 'Laminar', color: 'bg-cyan-400' },
      { max: 4000, label: 'Transitional', color: 'bg-amber-400' },
      { max: Infinity, label: 'Turbulent', color: 'bg-emerald-500' },
    ],
    description: 'Irrigation pipes are almost always turbulent (Re > 4000)',
  },

  // IRR-2.1 Darcy-Weisbach head loss — m per 100m
  'IRR-2.1': {
    zones: [
      { max: 1, label: 'Low loss', color: 'bg-emerald-600' },
      { max: 3, label: 'Acceptable', color: 'bg-emerald-500' },
      { max: 6, label: 'High', color: 'bg-amber-400' },
      { max: Infinity, label: 'Excessive', color: 'bg-red-400' },
    ],
    description: 'Target <2 m/100m for mainlines; <5 for laterals',
  },

  // IRR-2.3 Pipe Velocity — m/s
  'IRR-2.3': {
    zones: [
      { max: 0.3, label: 'Too slow', color: 'bg-red-400' },
      { max: 1.0, label: 'Low', color: 'bg-amber-400' },
      { max: 2.0, label: 'Optimal', color: 'bg-emerald-500' },
      { max: 3.0, label: 'High', color: 'bg-amber-400' },
      { max: Infinity, label: 'Water hammer risk', color: 'bg-red-400' },
    ],
    description: 'Optimal 1–2 m/s; >2.5 risks water hammer; <0.3 risks sediment',
  },

  // IRR-3.3 Total Dynamic Head — m
  'IRR-3.3': {
    zones: [
      { max: 20, label: 'Low head', color: 'bg-emerald-600' },
      { max: 50, label: 'Medium', color: 'bg-emerald-500' },
      { max: 100, label: 'High', color: 'bg-amber-400' },
      { max: Infinity, label: 'Very high', color: 'bg-red-400' },
    ],
    description: 'Surface irrigation: 10–30m; sprinkler: 30–60m; drip: 10–30m',
  },

  // IRR-4.1 Manning Equation — Q (m³/s)
  'IRR-4.1': {
    zones: [
      { max: 0.1, label: 'Small channel', color: 'bg-cyan-400' },
      { max: 1, label: 'Medium', color: 'bg-emerald-500' },
      { max: 10, label: 'Large', color: 'bg-amber-400' },
      { max: Infinity, label: 'Very large', color: 'bg-orange-400' },
    ],
    description: 'Farm canal: 0.05–0.5; main canal: 1–10 m³/s',
  },

  // IRR-5.1 Hydraulic Power — kW
  'IRR-5.1': {
    zones: [
      { max: 2, label: 'Small', color: 'bg-cyan-400' },
      { max: 10, label: 'Medium', color: 'bg-emerald-500' },
      { max: 50, label: 'Large', color: 'bg-amber-400' },
      { max: Infinity, label: 'Very large', color: 'bg-orange-400' },
    ],
    description: 'Small farm: 1–5 kW; medium: 5–20; large: 20–100 kW',
  },

  // IRR-5.2 Pump Efficiency — %
  'IRR-5.2': {
    zones: [
      { max: 50, label: 'Poor', color: 'bg-red-400' },
      { max: 65, label: 'Below average', color: 'bg-amber-400' },
      { max: 75, label: 'Good', color: 'bg-emerald-500' },
      { max: 85, label: 'Very good', color: 'bg-emerald-600' },
      { max: Infinity, label: 'Excellent', color: 'bg-emerald-700' },
    ],
    description: 'Centrifugal pumps: 60–85%; new pumps should exceed 75%',
  },

  // IRR-5.7 Brake Power — kW
  'IRR-5.7': {
    zones: [
      { max: 3, label: 'Small', color: 'bg-cyan-400' },
      { max: 15, label: 'Medium', color: 'bg-emerald-500' },
      { max: 75, label: 'Large', color: 'bg-amber-400' },
      { max: Infinity, label: 'Very large', color: 'bg-orange-400' },
    ],
    description: 'Account for motor efficiency (typically 85–92%)',
  },

  // IRR-6.3 Specific Capacity — m³/day/m
  'IRR-6.3': {
    zones: [
      { max: 10, label: 'Low yield', color: 'bg-red-400' },
      { max: 50, label: 'Moderate', color: 'bg-amber-400' },
      { max: 200, label: 'Good', color: 'bg-emerald-500' },
      { max: Infinity, label: 'High yield', color: 'bg-emerald-600' },
    ],
    description: 'Well yield benchmark; >100 = high-yield well',
  },

  // IRR-7.1 Emitter Discharge — L/h
  'IRR-7.1': {
    zones: [
      { max: 1, label: 'Very low', color: 'bg-cyan-400' },
      { max: 2, label: 'Low', color: 'bg-emerald-500' },
      { max: 4, label: 'Standard', color: 'bg-emerald-600' },
      { max: 8, label: 'High', color: 'bg-amber-400' },
      { max: Infinity, label: 'Very high', color: 'bg-orange-400' },
    ],
    description: 'Drip emitters: 1–8 L/h; standard 2–4 L/h',
  },

  // IRR-7.3 Distribution Uniformity — %
  'IRR-7.3': {
    zones: [
      { max: 70, label: 'Unacceptable', color: 'bg-red-400' },
      { max: 80, label: 'Acceptable', color: 'bg-amber-400' },
      { max: 90, label: 'Good', color: 'bg-emerald-500' },
      { max: Infinity, label: 'Excellent', color: 'bg-emerald-600' },
    ],
    description: 'Drip DU >85% target; >90% excellent',
  },

  // IRR-8.1 Christiansen Uniformity — %
  'IRR-8.1': {
    zones: [
      { max: 70, label: 'Poor', color: 'bg-red-400' },
      { max: 80, label: 'Fair', color: 'bg-amber-400' },
      { max: 87, label: 'Good', color: 'bg-emerald-500' },
      { max: Infinity, label: 'Excellent', color: 'bg-emerald-600' },
    ],
    description: 'Sprinkler CU >84% target; NRAES standard',
  },

  // IRR-8.4 Precipitation Rate — mm/h
  'IRR-8.4': {
    zones: [
      { max: 3, label: 'Very low', color: 'bg-cyan-400' },
      { max: 8, label: 'Low (clay)', color: 'bg-emerald-500' },
      { max: 15, label: 'Moderate (loam)', color: 'bg-emerald-600' },
      { max: 25, label: 'High (sand)', color: 'bg-amber-400' },
      { max: Infinity, label: 'Runoff risk', color: 'bg-red-400' },
    ],
    description: 'Match soil intake rate: clay <8; loam 8–15; sand 15–25 mm/h',
  },

  // IRR-9.3 Irrigation Interval — days
  'IRR-9.3': {
    zones: [
      { max: 2, label: 'Very frequent', color: 'bg-cyan-400' },
      { max: 5, label: 'Frequent', color: 'bg-emerald-500' },
      { max: 10, label: 'Moderate', color: 'bg-emerald-600' },
      { max: 21, label: 'Long', color: 'bg-amber-400' },
      { max: Infinity, label: 'Very long', color: 'bg-red-400' },
    ],
    description: 'Drip: 1–3 days; sprinkler: 5–10; surface: 10–21',
  },

  // IRR-9.4 Leaching Requirement — fraction
  'IRR-9.4': {
    zones: [
      { max: 0.1, label: 'Low', color: 'bg-emerald-600' },
      { max: 0.2, label: 'Moderate', color: 'bg-emerald-500' },
      { max: 0.3, label: 'High', color: 'bg-amber-400' },
      { max: Infinity, label: 'Very high', color: 'bg-red-400' },
    ],
    description: 'LR >0.3 means significant water waste to salt leaching',
  },

  // IRR-10.4 Actual Crop ET — mm/day
  'IRR-10.4': {
    zones: [
      { max: 3, label: 'Low demand', color: 'bg-cyan-400' },
      { max: 5, label: 'Moderate', color: 'bg-emerald-500' },
      { max: 8, label: 'High', color: 'bg-amber-400' },
      { max: Infinity, label: 'Very high', color: 'bg-red-400' },
    ],
    description: 'Cool season: 3–5; hot/dry: 6–10 mm/day',
  },

  // IRR-10.6 Gross Irrigation Req — mm
  'IRR-10.6': {
    zones: [
      { max: 25, label: 'Light', color: 'bg-cyan-400' },
      { max: 50, label: 'Moderate', color: 'bg-emerald-500' },
      { max: 100, label: 'Heavy', color: 'bg-amber-400' },
      { max: Infinity, label: 'Very heavy', color: 'bg-red-400' },
    ],
    description: 'Typical drip: 10–30mm; sprinkler: 30–60; surface: 50–100+',
  },

  // IRR-11.1 Bulk Density — g/cm³ (same as 7.1)
  'IRR-11.1': {
    zones: [
      { max: 1.1, label: 'Very loose', color: 'bg-amber-400' },
      { max: 1.6, label: 'Normal', color: 'bg-emerald-500' },
      { max: Infinity, label: 'Compacted', color: 'bg-red-400' },
    ],
    description: 'Mineral soils: 1.1–1.6 g/cm³; >1.6 restricts roots',
  },

  // IRR-11.3 Soil Porosity — %
  'IRR-11.3': {
    zones: [
      { max: 40, label: 'Low', color: 'bg-red-400' },
      { max: 55, label: 'Healthy', color: 'bg-emerald-500' },
      { max: Infinity, label: 'High', color: 'bg-cyan-400' },
    ],
    description: 'Ideal crop porosity: 40–55%',
  },

  // IRR-11.8 Available Water — %
  'IRR-11.8': {
    zones: [
      { max: 8, label: 'Low (sand)', color: 'bg-amber-400' },
      { max: 15, label: 'Moderate (sandy loam)', color: 'bg-emerald-500' },
      { max: 25, label: 'Good (loam)', color: 'bg-emerald-600' },
      { max: Infinity, label: 'High (clay/peat)', color: 'bg-cyan-400' },
    ],
    description: 'Sand ~5%; sandy loam ~12%; loam ~18%; clay ~22%',
  },

  // IRR-11.9 Total Available Water — mm
  'IRR-11.9': {
    zones: [
      { max: 50, label: 'Low', color: 'bg-red-400' },
      { max: 100, label: 'Moderate', color: 'bg-amber-400' },
      { max: 150, label: 'Good', color: 'bg-emerald-500' },
      { max: Infinity, label: 'High', color: 'bg-emerald-600' },
    ],
    description: 'Root zone water; typical 60–150mm depending on crop & soil',
  },

  // IRR-12.1 Sodium Adsorption Ratio
  'IRR-12.1': {
    zones: [
      { max: 3, label: 'Safe', color: 'bg-emerald-600' },
      { max: 6, label: 'Slight risk', color: 'bg-emerald-500' },
      { max: 13, label: 'Moderate', color: 'bg-amber-400' },
      { max: Infinity, label: 'High sodicity', color: 'bg-red-400' },
    ],
    description: 'SAR <3 safe for all; >13 = sodicity hazard for most soils',
  },

  // IRR-13.2 Fertilizer Concentration — kg/m³
  'IRR-13.2': {
    zones: [
      { max: 0.5, label: 'Dilute', color: 'bg-cyan-400' },
      { max: 2, label: 'Standard', color: 'bg-emerald-500' },
      { max: 5, label: 'Concentrated', color: 'bg-amber-400' },
      { max: Infinity, label: 'Very concentrated', color: 'bg-red-400' },
    ],
    description: 'Most fertigation: 0.5–2 kg/m³; stock solutions: 5–20',
  },

  // IRR-14.1 Storage Volume — m³
  'IRR-14.1': {
    zones: [
      { max: 100, label: 'Small', color: 'bg-cyan-400' },
      { max: 1000, label: 'Medium', color: 'bg-emerald-500' },
      { max: 10000, label: 'Large', color: 'bg-amber-400' },
      { max: Infinity, label: 'Very large', color: 'bg-orange-400' },
    ],
    description: 'Farm pond: 500–5000 m³; seasonal storage: 10000+',
  },

  // IRR-14.2 Cylindrical Tank Volume — m³
  'IRR-14.2': {
    zones: [
      { max: 5, label: 'Small', color: 'bg-cyan-400' },
      { max: 50, label: 'Medium', color: 'bg-emerald-500' },
      { max: 200, label: 'Large', color: 'bg-amber-400' },
      { max: Infinity, label: 'Very large', color: 'bg-orange-400' },
    ],
    description: 'Storage tanks: 1–200 m³ typical range',
  },

  // IRR-14.3 Detention Time — hours
  'IRR-14.3': {
    zones: [
      { max: 1, label: 'Very short', color: 'bg-amber-400' },
      { max: 6, label: 'Short', color: 'bg-emerald-500' },
      { max: 24, label: 'Moderate', color: 'bg-emerald-600' },
      { max: Infinity, label: 'Long', color: 'bg-cyan-400' },
    ],
    description: 'Sedimentation: 2–6h; storage buffer: 24h+',
  },

  // IRR-15.6 Pipe Sizing Design — m (diameter)
  'IRR-15.6': {
    zones: [
      { max: 0.025, label: 'Small (1\")', color: 'bg-cyan-400' },
      { max: 0.075, label: 'Medium (3\")', color: 'bg-emerald-500' },
      { max: 0.15, label: 'Large (6\")', color: 'bg-amber-400' },
      { max: Infinity, label: 'Main line (6\"+)', color: 'bg-orange-400' },
    ],
    description: 'Laterals: 13–32mm; submain: 50–90mm; main: 90–250mm',
  },
};
