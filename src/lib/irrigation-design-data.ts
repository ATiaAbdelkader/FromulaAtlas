// ====================================================================
// Irrigation System Designer — Design Data
// Extracted from a professional irrigation-design Excel sheet.
// All flow rates are in US gallons per minute (GPM) unless noted.
// ====================================================================

// Arc angles supported by every nozzle (degrees)
export const ARC_ANGLES = [45, 90, 120, 180, 240] as const;
export type ArcAngle = (typeof ARC_ANGLES)[number];

// --------------------------------------------------------------------
// Sprinkler nozzle catalogue
//   radius_ft: throw radius (feet) at recommended pressure
//   flows:     GPM indexed by arc angle
// --------------------------------------------------------------------
export interface NozzleSpec {
  code: string;
  radius_ft: number;
  flows: Record<number, number>; // arc angle (°) → GPM
}

export const NOZZLES: NozzleSpec[] = [
  { code: '4A',  radius_ft: 4,  flows: { 45: 0.13, 90: 0.28, 120: 0.34, 180: 0.45, 240: 0.68 } },
  { code: '6A',  radius_ft: 6,  flows: { 45: 0.18, 90: 0.37, 120: 0.44, 180: 0.60, 240: 0.88 } },
  { code: '8A',  radius_ft: 8,  flows: { 45: 0.15, 90: 0.29, 120: 0.39, 180: 0.58, 240: 0.78 } },
  { code: '10A', radius_ft: 10, flows: { 45: 0.25, 90: 0.49, 120: 0.65, 180: 0.98, 240: 1.31 } },
  { code: '12A', radius_ft: 12, flows: { 45: 0.32, 90: 0.63, 120: 0.84, 180: 1.26, 240: 1.68 } },
  { code: '15A', radius_ft: 15, flows: { 45: 0.47, 90: 0.93, 120: 1.24, 180: 1.86, 240: 2.48 } },
  { code: '17A', radius_ft: 17, flows: { 45: 0.60, 90: 1.20, 120: 1.60, 180: 2.40, 240: 3.20 } },
];

export function getNozzle(code: string): NozzleSpec | undefined {
  return NOZZLES.find(n => n.code === code);
}

// --------------------------------------------------------------------
// Valve recommendation — based on total zone flow (GPM)
// --------------------------------------------------------------------
export interface ValveRecommendation {
  model: string;
  size: string;
}

export function recommendValve(gpm: number): ValveRecommendation {
  if (gpm <= 40)  return { model: 'SRV Valve',        size: '2"' };
  if (gpm <= 80)  return { model: 'PGV Valve',        size: '2"' };
  if (gpm <= 150) return { model: 'PGV Jar-Top',      size: '3"' };
  return { model: 'ICZ-101', size: '4"' };
}

// --------------------------------------------------------------------
// Lateral / mainline pipe recommendation — based on flow (GPM)
// --------------------------------------------------------------------
export function recommendPipeSize(gpm: number): string {
  if (gpm <= 10)  return '0.75"';
  if (gpm <= 20)  return '1"';
  if (gpm <= 40)  return '1.5"';
  if (gpm <= 80)  return '2"';
  if (gpm <= 150) return '3"';
  return '4"';
}

// --------------------------------------------------------------------
// Plant water needs — gallons per plant per week (typical, arid climate)
// --------------------------------------------------------------------
export const PLANT_WATER_NEEDS: Record<string, number> = {
  'Small Shrubs':    9,
  'Large Shrubs':   14,
  'Small Tree':     24,
  'Large Tree':     48,
  'Palm Tree':      32,
  'Evergreen':      16,
  'Ground Cover':    1,
  'Bedding Plants':  1,
  'Container Small': 0.2,
  'Container Large': 0.3,
};

// --------------------------------------------------------------------
// Drip-line defaults
// --------------------------------------------------------------------
export const DRIP_DEFAULTS = {
  flowPerEmitter_gph: 1,      // gallons per hour per emitter
  emitterSpacing_inch: 24,    // spacing between emitters along the line
  lineLength_ft: 100,         // default line length
} as const;

// --------------------------------------------------------------------
// Pump sizing
//   frictionLoss = maxDistance_m * 0.5 / 100   (5 m head loss per 100 m)
//   totalHead    = 1.2 * (staticHead + frictionLoss)
//   pressure_psi = totalHead_m * 1.422
//   pumpFlow     = maxStationFlow / dutyPumps
//   pumpPower_hp = (pumpFlow_gpm * head_ft) / (3960 * 0.65)
//   head_ft      = totalHead_m * 3.281
// --------------------------------------------------------------------
export interface PumpInput {
  maxStationFlow_gpm: number;
  staticHead_m: number;
  maxDistance_m: number;
  numberOfDutyPumps: number;
  numberOfStandbyPumps: number;
}

export interface PumpResult {
  totalHead_m: number;
  pressure_psi: number;
  pumpFlow_gpm: number;
  pumpPower_hp: number;
  maxOperatingTime_h: number;
}

export function sizePump(input: PumpInput): PumpResult {
  const duty = Math.max(1, input.numberOfDutyPumps || 1);
  const frictionLoss = (input.maxDistance_m || 0) * 0.5 / 100;
  const totalHead_m = 1.2 * ((input.staticHead_m || 0) + frictionLoss);
  const pressure_psi = totalHead_m * 1.422;
  const pumpFlow_gpm = (input.maxStationFlow_gpm || 0) / duty;
  const head_ft = totalHead_m * 3.281;
  const pumpPower_hp = (pumpFlow_gpm * head_ft) / (3960 * 0.65);
  // Operating time estimate: assume 1500 m³ weekly budget delivered by N duty pumps
  // 1 m³ = 264.172 gal ;  weekly_gal = 1500 * 264.172
  const weeklyGal = 1500 * 264.172;
  const maxOperatingTime_h = pumpFlow_gpm > 0 ? weeklyGal / (pumpFlow_gpm * duty * 60) : 0;
  return {
    totalHead_m,
    pressure_psi,
    pumpFlow_gpm,
    pumpPower_hp: isFinite(pumpPower_hp) ? pumpPower_hp : 0,
    maxOperatingTime_h: isFinite(maxOperatingTime_h) ? maxOperatingTime_h : 0,
  };
}

// --------------------------------------------------------------------
// Hydraulics helpers
// --------------------------------------------------------------------
// Precipitation rate (in/h) for sprinklers: PR = 96.3 * GPM / area_ft²
export function precipitationRate(totalGPM: number, area_ft2: number): number {
  if (area_ft2 <= 0) return 0;
  return (96.3 * totalGPM) / area_ft2;
}

// Irrigation run-time (minutes) to apply a target ET depth (inches)
// given a precipitation rate (in/h)
export function irrigationTimeMinutes(et_in: number, pr_inh: number): number {
  if (pr_inh <= 0) return 0;
  return (60 * et_in) / pr_inh;
}

// --------------------------------------------------------------------
// Unit converters
// --------------------------------------------------------------------
export const gpmToLpm  = (gpm: number) => gpm * 3.78541;
export const gpmToM3h  = (gpm: number) => gpm * 0.227125;
export const psiToBar  = (psi: number) => psi * 0.0689476;
export const psiToKpa  = (psi: number) => psi * 6.89476;
export const inchToMm  = (inch: number) => inch * 25.4;
export const ftToM     = (ft: number) => ft * 0.3048;
export const hpToKw    = (hp: number) => hp * 0.7457;
