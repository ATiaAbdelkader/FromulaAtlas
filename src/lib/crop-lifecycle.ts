/**
 * Crop lifecycle database — phenology stages, fertilization schedule, and
 * labor operations for the major agricultural crops.
 *
 * Each crop has:
 *   - 4–6 phenology stages with day ranges and crop-coefficient (Kc) values
 *     (FAO-56 Table 12 + extension service refinements)
 *   - Per-stage fertilization plan: N, P, K, plus key micronutrients, in
 *     kg/ha (or kg/acre in the UI layer via conversion)
 *   - Per-stage labor operations with task name, type, est. labor-days/ha,
 *     and skill level
 *
 * Sources:
 *   - FAO-56 (Allen et al., 1998) — Kc values, stage durations
 *   - Fertilizers Europe — "Crop-specific recommendations" (2014–2020)
 *   - IFA — "Fertilizer Use by Crop" (5th ed., 2017)
 *   - UC Davis Extension, UF IFAS, NC State Extension, CIMMYT, IRRI
 *   - University of Wisconsin A3646 "Corn fertilization" (2021)
 *
 * All values are research-backed approximations suitable for planning. Local
 * soil tests should always override these defaults.
 */

export type CropCategory =
  | 'cereal' | 'vegetable' | 'fruit' | 'legume' | 'root'
  | 'industrial' | 'berry' | 'orchard' | 'forage';

export type LaborType =
  | 'land_prep'    // tillage, bed shaping, ripping
  | 'planting'     // seeding, transplanting
  | 'fertilization'// broadcasting, side-dress, fertigation, foliar
  | 'irrigation'   // system checks, schedule adjustments
  | 'pest'         // scouting, pesticide application
  | 'weed'         // cultivation, herbicide
  | 'pruning'      // training, suckering, canopy management
  | 'harvest'      // picking, digging, cutting
  | 'post_harvest' // curing, drying, packing, storage
  | 'monitoring';  // soil tests, growth stage notes, records

export type SkillLevel = 'basic' | 'trained' | 'specialist';

export interface LifecycleStage {
  /** Stage name (e.g. "Establishment", "Flowering"). */
  name: string;
  /** Day-of-season start (1-indexed). */
  startDay: number;
  /** Day-of-season end (1-indexed). */
  endDay: number;
  /** FAO-56 Kc midpoint for this stage. */
  kc: number;
  /** Short description of what the plant is doing. */
  description: string;
  /** Visual indicator — emoji used in the UI. */
  emoji: string;
}

export interface FertilizationPlan {
  /** Total seasonal nutrient requirement, kg/ha. */
  totals: {
    n: number; p: number; k: number;
    ca?: number; mg?: number; s?: number;
    /** Micronutrients — g/ha (not kg) */
    fe?: number; mn?: number; b?: number; zn?: number; cu?: number;
  };
  /** Per-stage application schedule. Each entry = one application event. */
  applications: FertilizationApplication[];
}

export interface FertilizationApplication {
  /** Day-of-season when this application should happen. */
  day: number;
  /** Stage at time of application (for context). */
  stage: string;
  /** Application method. */
  method: 'broadcast' | 'band' | 'side_dress' | 'fertigation' | 'foliar' | 'seed_treatment';
  /** Nutrient amounts in kg/ha (micros in g/ha). */
  n: number; p: number; k: number;
  ca?: number; mg?: number; s?: number;
  fe?: number; mn?: number; b?: number; zn?: number; cu?: number;
  /** Recommended source materials (one per nutrient). */
  sources: { nutrient: string; material: string; rate: string }[];
  /** Notes on timing, placement, or cautions. */
  notes: string;
}

export interface LaborOperation {
  /** Day-of-season when this operation should happen (window start). */
  day: number;
  /** Duration in days (how long the operation takes). */
  durationDays: number;
  /** Stage at time of operation (for context). */
  stage: string;
  /** Operation type. */
  type: LaborType;
  /** Human-readable task description. */
  task: string;
  /** Estimated labor requirement in person-days per hectare. */
  laborDaysPerHa: number;
  /** Skill level required. */
  skill: SkillLevel;
  /** Equipment needed (optional, comma-separated). */
  equipment?: string;
  /** Critical vs. recommended timing. */
  priority: 'critical' | 'recommended' | 'optional';
  /** Notes — best practices, cautions. */
  notes?: string;
}

export interface CropLifecycle {
  id: string;
  name: string;
  emoji: string;
  category: CropCategory;
  /** Total season length, days. */
  seasonLength: number;
  /** Suitable climate zones. */
  climate: string;
  /** Phenology stages, in chronological order. */
  stages: LifecycleStage[];
  /** Full fertilization schedule for the season. */
  fertilization: FertilizationPlan;
  /** Labor operations throughout the season. */
  labor: LaborOperation[];
  /** General notes. */
  notes: string;
}

// ============================================================================
// Crop lifecycle database — 20 crops
// ============================================================================

export const CROP_LIFECYCLES: CropLifecycle[] = [
  // ========================================================================
  // 1. MAIZE (FIELD CORN)
  // ========================================================================
  {
    id: 'maize',
    name: 'Maize (Field Corn)',
    emoji: '🌽',
    category: 'cereal',
    seasonLength: 120,
    climate: 'Temperate to subtropical; 500–800 mm rainfall',
    stages: [
      { name: 'Establishment',  startDay: 1,   endDay: 15,  kc: 0.30, emoji: '🌱', description: 'Germination to 2-leaf stage' },
      { name: 'Vegetative',     startDay: 16,  endDay: 55,  kc: 0.70, emoji: '🌿', description: 'Stem elongation, leaf area expansion' },
      { name: 'Tasseling/Silking', startDay: 56, endDay: 70, kc: 1.20, emoji: '🌾', description: 'Flowering — critical pollination window' },
      { name: 'Grain Fill',     startDay: 71,  endDay: 105, kc: 1.15, emoji: '🌽', description: 'Kernels filling, dry matter accumulation' },
      { name: 'Maturation',     startDay: 106, endDay: 120, kc: 0.55, emoji: '🍂', description: 'Black layer formation, drydown' },
    ],
    fertilization: {
      totals: { n: 200, p: 80, k: 160, s: 20, zn: 400 },
      applications: [
        { day: 0, stage: 'Pre-plant', method: 'broadcast', n: 30, p: 80, k: 80, s: 20, zn: 400, sources: [
          { nutrient: 'P', material: 'Triple superphosphate (0-46-0)', rate: '174 kg/ha' },
          { nutrient: 'K', material: 'Muriate of potash (0-0-60)', rate: '133 kg/ha' },
          { nutrient: 'Zn', material: 'Zinc sulfate (35% Zn)', rate: '1.1 kg/ha' },
        ], notes: 'Incorporate into top 15 cm. Apply zinc if soil test < 1.5 ppm Zn.' },
        { day: 1, stage: 'At planting', method: 'band', n: 25, p: 0, k: 0, sources: [
          { nutrient: 'N', material: 'Urea (46-0-0)', rate: '54 kg/ha banded 5×5 cm' },
          { nutrient: 'P (starter)', material: 'DAP (18-46-0)', rate: '55 kg/ha in-furrow' },
        ], notes: 'Starter P boosts early vigor in cool soils. Do NOT place urea in contact with seed.' },
        { day: 30, stage: 'V6 (6-leaf)', method: 'side_dress', n: 80, p: 0, k: 40, sources: [
          { nutrient: 'N', material: 'Urea ammonium nitrate (UAN 32%)', rate: '250 L/ha' },
          { nutrient: 'K', material: 'Potash (0-0-60)', rate: '67 kg/ha' },
        ], notes: 'Critical timing — N uptake accelerates after V6. Apply when soil is moist.' },
        { day: 50, stage: 'V10–V12', method: 'side_dress', n: 65, p: 0, k: 40, sources: [
          { nutrient: 'N', material: 'UAN 32%', rate: '203 L/ha' },
          { nutrient: 'K', material: 'Potash (0-0-60)', rate: '67 kg/ha' },
        ], notes: 'Final N split before tasseling. Avoid late N — delays maturity.' },
      ],
    },
    labor: [
      { day: -14, durationDays: 2, stage: 'Pre-plant', type: 'land_prep', task: 'Primary tillage — chisel plow or disk to 20 cm', laborDaysPerHa: 0.5, skill: 'trained', equipment: 'Tractor 75+ HP, chisel plow', priority: 'critical', notes: 'Avoid working wet soil — compaction.' },
      { day: -7, durationDays: 1, stage: 'Pre-plant', type: 'land_prep', task: 'Field cultivation + harrow to prepare seedbed', laborDaysPerHa: 0.3, skill: 'trained', equipment: 'Tractor, field cultivator', priority: 'critical' },
      { day: -3, durationDays: 1, stage: 'Pre-plant', type: 'weed', task: 'Pre-emergent herbicide application', laborDaysPerHa: 0.2, skill: 'specialist', equipment: 'Sprayer 200 L/ha', priority: 'recommended', notes: 'Calibrate sprayer; observe wind speed limits.' },
      { day: 1, durationDays: 2, stage: 'Establishment', type: 'planting', task: 'Plant maize at 75–80 cm row spacing, 5–7 cm depth', laborDaysPerHa: 0.4, skill: 'trained', equipment: 'Tractor + precision planter', priority: 'critical', notes: 'Target 75,000–90,000 plants/ha. Check seed depth every 50 m.' },
      { day: 1, durationDays: 1, stage: 'Establishment', type: 'fertilization', task: 'Apply starter fertilizer (DAP) in-furrow at planting', laborDaysPerHa: 0.2, skill: 'trained', priority: 'recommended' },
      { day: 15, durationDays: 1, stage: 'Vegetative', type: 'monitoring', task: 'Plant stand assessment + replant decision (if needed)', laborDaysPerHa: 0.3, skill: 'trained', priority: 'recommended' },
      { day: 20, durationDays: 1, stage: 'Vegetative', type: 'weed', task: 'Post-emergent herbicide (if weed pressure warrants)', laborDaysPerHa: 0.2, skill: 'specialist', equipment: 'Sprayer', priority: 'recommended' },
      { day: 30, durationDays: 1, stage: 'Vegetative', type: 'fertilization', task: 'Side-dress N + K at V6', laborDaysPerHa: 0.3, skill: 'trained', equipment: 'Tractor + sidedress applicator', priority: 'critical' },
      { day: 35, durationDays: 1, stage: 'Vegetative', type: 'irrigation', task: 'First in-season irrigation (if rainfall deficit)', laborDaysPerHa: 0.2, skill: 'basic', priority: 'recommended' },
      { day: 50, durationDays: 1, stage: 'Vegetative', type: 'fertilization', task: 'Final N side-dress at V10–V12', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical' },
      { day: 56, durationDays: 1, stage: 'Tasseling/Silking', type: 'monitoring', task: 'Check pollination success — silking + pollen shed timing', laborDaysPerHa: 0.2, skill: 'trained', priority: 'critical', notes: 'Heat stress (>35°C) during this window causes kernel abortion.' },
      { day: 60, durationDays: 1, stage: 'Tasseling/Silking', type: 'pest', task: 'Scout for fall armyworm + Western corn rootworm beetle', laborDaysPerHa: 0.2, skill: 'trained', priority: 'recommended' },
      { day: 70, durationDays: 1, stage: 'Grain Fill', type: 'pest', task: 'Scout for corn earworm + aflatoxin risk', laborDaysPerHa: 0.2, skill: 'trained', priority: 'recommended' },
      { day: 105, durationDays: 1, stage: 'Maturation', type: 'monitoring', task: 'Check black layer formation on kernels (~30–35% moisture)', laborDaysPerHa: 0.2, skill: 'trained', priority: 'critical' },
      { day: 115, durationDays: 2, stage: 'Maturation', type: 'harvest', task: 'Combine harvest at 24–28% grain moisture', laborDaysPerHa: 0.5, skill: 'specialist', equipment: 'Combine harvester + grain cart', priority: 'critical' },
      { day: 118, durationDays: 1, stage: 'Maturation', type: 'post_harvest', task: 'Dry grain to 14% moisture for storage', laborDaysPerHa: 0.4, skill: 'trained', equipment: 'Grain dryer', priority: 'critical' },
    ],
    notes: 'Rotating with soybean reduces N requirement by 30–50 kg/ha. Continuous corn needs 220+ kg N/ha.',
  },

  // ========================================================================
  // 2. WHEAT (BREAD WHEAT)
  // ========================================================================
  {
    id: 'wheat',
    name: 'Wheat (Bread)',
    emoji: '🌾',
    category: 'cereal',
    seasonLength: 140,
    climate: 'Temperate; 400–600 mm rainfall, cool ripening period',
    stages: [
      { name: 'Emergence',  startDay: 1,   endDay: 20,  kc: 0.40, emoji: '🌱', description: 'Germination to 3-leaf stage' },
      { name: 'Tillering',  startDay: 21,  endDay: 70,  kc: 0.80, emoji: '🌿', description: 'Crown root system + tiller development' },
      { name: 'Stem Elongation', startDay: 71, endDay: 100, kc: 1.15, emoji: '🌾', description: 'Node formation, internode elongation' },
      { name: 'Heading/Flowering', startDay: 101, endDay: 115, kc: 1.15, emoji: '🌼', description: 'Ear emergence + anthesis' },
      { name: 'Grain Fill', startDay: 116, endDay: 135, kc: 0.70, emoji: '🌾', description: 'Milk → dough → hard dough' },
      { name: 'Maturation', startDay: 136, endDay: 140, kc: 0.25, emoji: '🍂', description: 'Ripening to harvest moisture' },
    ],
    fertilization: {
      totals: { n: 170, p: 60, k: 100, s: 25, mn: 500, cu: 200 },
      applications: [
        { day: 0, stage: 'Pre-plant', method: 'broadcast', n: 30, p: 60, k: 100, s: 25, mn: 500, cu: 200, sources: [
          { nutrient: 'P', material: 'DAP (18-46-0)', rate: '130 kg/ha' },
          { nutrient: 'K', material: 'Muriate of potash', rate: '167 kg/ha' },
          { nutrient: 'S', material: 'Ammonium sulfate (21-0-0-24S)', rate: '104 kg/ha' },
        ], notes: 'Incorporate before drilling. S deficiency common in sandy soils.' },
        { day: 1, stage: 'At planting', method: 'band', n: 25, p: 0, k: 0, sources: [
          { nutrient: 'N', material: 'DAP', rate: 'Already applied above' },
        ], notes: 'Starter N from DAP is sufficient at planting.' },
        { day: 30, stage: 'Tillering', method: 'broadcast', n: 60, p: 0, k: 0, sources: [
          { nutrient: 'N', material: 'Urea (46-0-0)', rate: '130 kg/ha' },
        ], notes: 'First top-dress at Zadoks 25–29. Apply when leaves are dry to avoid burn.' },
        { day: 75, stage: 'Stem elongation', method: 'broadcast', n: 55, p: 0, k: 0, sources: [
          { nutrient: 'N', material: 'Urea', rate: '120 kg/ha' },
        ], notes: 'Critical for grain protein. Apply at Zadoks 30–32 (1st node detectable).' },
      ],
    },
    labor: [
      { day: -10, durationDays: 2, stage: 'Pre-plant', type: 'land_prep', task: 'Disc/chisel to 15 cm, then harrow', laborDaysPerHa: 0.4, skill: 'trained', equipment: 'Tractor 60 HP', priority: 'critical' },
      { day: -5, durationDays: 1, stage: 'Pre-plant', type: 'weed', task: 'Pre-plant herbicide (glyphosate if no-till)', laborDaysPerHa: 0.2, skill: 'specialist', priority: 'recommended' },
      { day: 1, durationDays: 1, stage: 'Emergence', type: 'planting', task: 'Drill wheat at 12–15 cm row spacing, 3–5 cm depth', laborDaysPerHa: 0.3, skill: 'trained', equipment: 'Grain drill', priority: 'critical', notes: 'Target 350–450 plants/m². Calibrate drill for seed size.' },
      { day: 30, durationDays: 1, stage: 'Tillering', type: 'fertilization', task: 'Top-dress N at Zadoks 25', laborDaysPerHa: 0.2, skill: 'trained', equipment: 'Spreader', priority: 'critical' },
      { day: 45, durationDays: 1, stage: 'Tillering', type: 'weed', task: 'Post-emergent broadleaf herbicide', laborDaysPerHa: 0.2, skill: 'specialist', equipment: 'Sprayer 100 L/ha', priority: 'recommended' },
      { day: 75, durationDays: 1, stage: 'Stem elongation', type: 'fertilization', task: 'Top-dress N at Zadoks 30–32', laborDaysPerHa: 0.2, skill: 'trained', priority: 'critical', notes: 'Critical for grain protein (>11%).' },
      { day: 90, durationDays: 1, stage: 'Stem elongation', type: 'pest', task: 'Scout for stripe rust + aphids + Fusarium head blight risk', laborDaysPerHa: 0.2, skill: 'trained', priority: 'recommended' },
      { day: 100, durationDays: 1, stage: 'Heading/Flowering', type: 'pest', task: 'Fungicide application at anthesis (Fusarium control)', laborDaysPerHa: 0.2, skill: 'specialist', equipment: 'Sprayer', priority: 'critical', notes: 'Timing is critical — within 5 days of 50% anthesis.' },
      { day: 110, durationDays: 1, stage: 'Heading/Flowering', type: 'monitoring', task: 'Assess frost/heat damage at anthesis', laborDaysPerHa: 0.2, skill: 'trained', priority: 'recommended' },
      { day: 135, durationDays: 1, stage: 'Maturation', type: 'monitoring', task: 'Check grain moisture (~14% for harvest)', laborDaysPerHa: 0.1, skill: 'basic', priority: 'critical' },
      { day: 138, durationDays: 1, stage: 'Maturation', type: 'harvest', task: 'Combine harvest at 13–15% moisture', laborDaysPerHa: 0.4, skill: 'specialist', equipment: 'Combine', priority: 'critical' },
    ],
    notes: 'Split N application (30% at planting, 35% tillering, 35% stem elongation) maximizes protein + yield.',
  },

  // ========================================================================
  // 3. RICE (LOWLAND IRRIGATED)
  // ========================================================================
  {
    id: 'rice',
    name: 'Rice (Lowland Irrigated)',
    emoji: '🍚',
    category: 'cereal',
    seasonLength: 130,
    climate: 'Tropical to subtropical; flooded paddies',
    stages: [
      { name: 'Nursery',       startDay: 1,   endDay: 25,  kc: 1.05, emoji: '🌱', description: 'Seedling growth in nursery bed' },
      { name: 'Vegetative',    startDay: 26,  endDay: 70,  kc: 1.10, emoji: '🌿', description: 'Transplanting to panicle initiation' },
      { name: 'Reproductive',  startDay: 71,  endDay: 100, kc: 1.20, emoji: '🌾', description: 'Panicle init to heading' },
      { name: 'Ripening',      startDay: 101, endDay: 125, kc: 1.00, emoji: '🌾', description: 'Flowering → milk → dough → yellow ripeness' },
      { name: 'Drainage/Harvest', startDay: 126, endDay: 130, kc: 0.60, emoji: '🍂', description: 'Field drained, harvest moisture reached' },
    ],
    fertilization: {
      totals: { n: 130, p: 50, k: 100, s: 15, zn: 500 },
      applications: [
        { day: -7, stage: 'Pre-transplant (basal)', method: 'broadcast', n: 30, p: 50, k: 80, s: 15, zn: 500, sources: [
          { nutrient: 'P', material: 'SSP (16% P)', rate: '313 kg/ha' },
          { nutrient: 'K', material: 'Muriate of potash', rate: '133 kg/ha' },
          { nutrient: 'Zn', material: 'Zinc sulfate', rate: '1.4 kg/ha' },
        ], notes: 'Incorporate into top 10 cm before flooding. Zn critical in calcareous soils.' },
        { day: 30, stage: 'Vegetative', method: 'broadcast', n: 50, p: 0, k: 20, sources: [
          { nutrient: 'N', material: 'Urea', rate: '109 kg/ha' },
          { nutrient: 'K', material: 'Muriate of potash', rate: '33 kg/ha' },
        ], notes: 'First top-dress at 15–20 DAT (days after transplanting). Apply into flooded water.' },
        { day: 70, stage: 'Panicle initiation', method: 'broadcast', n: 50, p: 0, k: 0, sources: [
          { nutrient: 'N', material: 'Urea', rate: '109 kg/ha' },
        ], notes: 'Critical top-dress at PI — determines spikelet number. Skip if N status high (Leaf Color Chart 4+).' },
      ],
    },
    labor: [
      { day: 1, durationDays: 5, stage: 'Nursery', type: 'planting', task: 'Prepare nursery bed + sow pre-germinated seed', laborDaysPerHa: 1.5, skill: 'trained', priority: 'critical' },
      { day: -7, durationDays: 2, stage: 'Pre-transplant', type: 'land_prep', task: 'Puddle field with 2–3 passes of rotavator under water', laborDaysPerHa: 1.0, skill: 'trained', equipment: 'Tractor + rotavator', priority: 'critical' },
      { day: -7, durationDays: 1, stage: 'Pre-transplant', type: 'fertilization', task: 'Broadcast basal NPK + Zn, then puddle', laborDaysPerHa: 0.4, skill: 'trained', priority: 'critical' },
      { day: 26, durationDays: 4, stage: 'Vegetative', type: 'planting', task: 'Transplant 25-day-old seedlings at 25×25 cm spacing, 2–3 seedlings/hill', laborDaysPerHa: 4.0, skill: 'trained', priority: 'critical', notes: 'Most labor-intensive operation. Mechanical transplanters reduce to 0.5 d/ha.' },
      { day: 30, durationDays: 1, stage: 'Vegetative', type: 'fertilization', task: 'Top-dress N + K at 15 DAT', laborDaysPerHa: 0.3, skill: 'basic', priority: 'critical' },
      { day: 40, durationDays: 2, stage: 'Vegetative', type: 'weed', task: 'Hand weeding or post-emergent herbicide', laborDaysPerHa: 2.0, skill: 'basic', priority: 'critical', notes: 'Critical weed-free window is first 30 DAT.' },
      { day: 60, durationDays: 1, stage: 'Vegetative', type: 'irrigation', task: 'Maintain 2–5 cm flood; check for cracks if drained', laborDaysPerHa: 0.3, skill: 'basic', priority: 'recommended' },
      { day: 70, durationDays: 1, stage: 'Reproductive', type: 'fertilization', task: 'Top-dress N at panicle initiation', laborDaysPerHa: 0.2, skill: 'trained', priority: 'critical' },
      { day: 85, durationDays: 1, stage: 'Reproductive', type: 'pest', task: 'Scout for stem borer + brown planthopper + bacterial blight', laborDaysPerHa: 0.3, skill: 'trained', priority: 'recommended' },
      { day: 100, durationDays: 1, stage: 'Ripening', type: 'irrigation', task: 'Begin drainage at 10–14 days after heading', laborDaysPerHa: 0.2, skill: 'basic', priority: 'critical' },
      { day: 125, durationDays: 2, stage: 'Drainage/Harvest', type: 'harvest', task: 'Harvest at 20–24% grain moisture', laborDaysPerHa: 2.5, skill: 'trained', equipment: 'Combine or sickle', priority: 'critical' },
      { day: 128, durationDays: 2, stage: 'Drainage/Harvest', type: 'post_harvest', task: 'Thresh (if manual) + dry to 13% moisture', laborDaysPerHa: 1.5, skill: 'trained', priority: 'critical' },
    ],
    notes: 'Alternate Wetting and Drying (AWD) reduces water use by 30% with minimal yield loss. Site-Specific Nutrient Management (SSNM) tools improve N timing.',
  },

  // ========================================================================
  // 4. SOYBEAN
  // ========================================================================
  {
    id: 'soybean',
    name: 'Soybean',
    emoji: '🫘',
    category: 'legume',
    seasonLength: 120,
    climate: 'Temperate to subtropical; 500–700 mm rainfall',
    stages: [
      { name: 'Establishment',  startDay: 1,   endDay: 15,  kc: 0.35, emoji: '🌱', description: 'Germination to VC (unifoliate)' },
      { name: 'Vegetative',     startDay: 16,  endDay: 50,  kc: 0.75, emoji: '🌿', description: 'V1 to V6 — trifoliate leaves' },
      { name: 'Flowering',      startDay: 51,  endDay: 70,  kc: 1.10, emoji: '🌼', description: 'R1 (beginning bloom) to R3 (beginning pod)' },
      { name: 'Pod Fill',       startDay: 71,  endDay: 105, kc: 1.15, emoji: '🫘', description: 'R4 (full pod) to R6 (full seed)' },
      { name: 'Maturation',     startDay: 106, endDay: 120, kc: 0.50, emoji: '🍂', description: 'R7 (beginning maturity) to R8 (full maturity)' },
    ],
    fertilization: {
      totals: { n: 30, p: 60, k: 120, s: 20, mn: 1000, fe: 500 },
      applications: [
        { day: 0, stage: 'Pre-plant', method: 'broadcast', n: 0, p: 60, k: 120, s: 20, mn: 1000, sources: [
          { nutrient: 'P', material: 'Triple superphosphate', rate: '130 kg/ha' },
          { nutrient: 'K', material: 'Muriate of potash', rate: '200 kg/ha' },
          { nutrient: 'S', material: 'Gypsum (17% S)', rate: '118 kg/ha' },
        ], notes: 'Soybean fixes its own N — do NOT apply N unless inoculation failed. Apply Mn on high-pH soils.' },
        { day: 1, stage: 'At planting', method: 'seed_treatment', n: 0, p: 0, k: 0, sources: [
          { nutrient: 'Inoculant', material: 'Bradyrhizium japonicum peat-based', rate: '200 g/50 kg seed' },
        ], notes: 'Critical for N fixation. Use fresh inoculant; repeat if seed is treated with fungicide.' },
      ],
    },
    labor: [
      { day: -10, durationDays: 1, stage: 'Pre-plant', type: 'land_prep', task: 'No-till or minimum till (soybean tolerates both)', laborDaysPerHa: 0.2, skill: 'trained', equipment: 'Tractor 60 HP + drill', priority: 'recommended' },
      { day: -2, durationDays: 1, stage: 'Pre-plant', type: 'weed', task: 'Burnd herbicide (if no-till) or pre-emergent', laborDaysPerHa: 0.2, skill: 'specialist', priority: 'recommended' },
      { day: 1, durationDays: 1, stage: 'Establishment', type: 'planting', task: 'Drill soybean at 3–5 cm depth, 30–45 cm rows', laborDaysPerHa: 0.3, skill: 'trained', equipment: 'Grain drill', priority: 'critical', notes: 'Target 350,000–450,000 plants/ha. Do not plant deeper than 5 cm.' },
      { day: 1, durationDays: 1, stage: 'Establishment', type: 'fertilization', task: 'Treat seed with inoculant just before planting', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical' },
      { day: 25, durationDays: 1, stage: 'Vegetative', type: 'monitoring', task: 'Check nodulation — dig 5 plants, count pink nodules', laborDaysPerHa: 0.2, skill: 'trained', priority: 'recommended', notes: 'If <10 nodules/plant or no pink color, N fixation is failing — apply 50 kg N/ha rescue.' },
      { day: 35, durationDays: 1, stage: 'Vegetative', type: 'weed', task: 'Post-emergent herbicide at V2–V3', laborDaysPerHa: 0.2, skill: 'specialist', priority: 'recommended' },
      { day: 55, durationDays: 1, stage: 'Flowering', type: 'pest', task: 'Scout for soybean aphid + whitefly + stink bug', laborDaysPerHa: 0.2, skill: 'trained', priority: 'recommended' },
      { day: 70, durationDays: 1, stage: 'Pod Fill', type: 'pest', task: 'Scout for pod-feeding caterpillars', laborDaysPerHa: 0.2, skill: 'trained', priority: 'recommended' },
      { day: 90, durationDays: 1, stage: 'Pod Fill', type: 'irrigation', task: 'Critical water window — pod fill (R4–R6)', laborDaysPerHa: 0.2, skill: 'basic', priority: 'critical', notes: 'Water stress during R4–R6 is the #1 yield-robber.' },
      { day: 118, durationDays: 1, stage: 'Maturation', type: 'monitoring', task: 'Check 95% pod maturity (R7)', laborDaysPerHa: 0.1, skill: 'basic', priority: 'critical' },
      { day: 120, durationDays: 1, stage: 'Maturation', type: 'harvest', task: 'Combine at 13% moisture', laborDaysPerHa: 0.4, skill: 'specialist', equipment: 'Combine', priority: 'critical' },
    ],
    notes: 'Crop rotation benefit: soybean leaves 30–50 kg/ha residual N for the next crop.',
  },

  // ========================================================================
  // 5. COTTON
  // ========================================================================
  {
    id: 'cotton',
    name: 'Cotton',
    emoji: '☁️',
    category: 'industrial',
    seasonLength: 180,
    climate: 'Subtropical; frost-free 180+ days; 600–900 mm rainfall',
    stages: [
      { name: 'Establishment',  startDay: 1,   endDay: 25,  kc: 0.35, emoji: '🌱', description: 'Emergence to 4-true-leaf' },
      { name: 'Vegetative',     startDay: 26,  endDay: 75,  kc: 0.75, emoji: '🌿', description: 'Stem + canopy growth, squares form' },
      { name: 'Flowering',      startDay: 76,  endDay: 110, kc: 1.15, emoji: '🌼', description: 'First bloom to peak bloom' },
      { name: 'Boll Development', startDay: 111, endDay: 150, kc: 1.10, emoji: '☁️', description: 'Boll fill + fiber elongation' },
      { name: 'Open Boll / Maturation', startDay: 151, endDay: 180, kc: 0.55, emoji: '❄️', description: 'Bolls crack open, defoliation, harvest' },
    ],
    fertilization: {
      totals: { n: 180, p: 60, k: 140, s: 25, b: 1000 },
      applications: [
        { day: 0, stage: 'Pre-plant', method: 'broadcast', n: 30, p: 60, k: 70, s: 25, b: 1000, sources: [
          { nutrient: 'P', material: 'DAP', rate: '130 kg/ha' },
          { nutrient: 'K', material: 'Muriate of potash', rate: '117 kg/ha' },
          { nutrient: 'B', material: 'Borax (11% B)', rate: '9 kg/ha' },
        ], notes: 'Incorporate before planting. B deficiency causes "boll shedding" — apply on sandy/low-OM soils.' },
        { day: 25, stage: 'Establishment', method: 'side_dress', n: 50, p: 0, k: 35, sources: [
          { nutrient: 'N', material: 'Urea', rate: '109 kg/ha' },
          { nutrient: 'K', material: 'Muriate of potash', rate: '58 kg/ha' },
        ], notes: 'Apply at 4-true-leaf stage, 10 cm from row.' },
        { day: 70, stage: 'Vegetative', method: 'side_dress', n: 60, p: 0, k: 35, sources: [
          { nutrient: 'N', material: 'UAN 32%', rate: '188 L/ha' },
          { nutrient: 'K', material: 'Muriate of potash', rate: '58 kg/ha' },
        ], notes: 'Apply at first square. Avoid N after first bloom — delays maturity.' },
        { day: 90, stage: 'Flowering', method: 'fertigation', n: 40, p: 0, k: 0, sources: [
          { nutrient: 'N', material: 'Urea (fertigated)', rate: '87 kg/ha in 4 splits over 14 days' },
        ], notes: 'Final N at peak bloom via fertigation if irrigation available.' },
      ],
    },
    labor: [
      { day: -14, durationDays: 2, stage: 'Pre-plant', type: 'land_prep', task: 'Rip + chisel + bed formation (90–100 cm rows)', laborDaysPerHa: 0.6, skill: 'trained', equipment: 'Tractor 80 HP', priority: 'critical' },
      { day: -3, durationDays: 1, stage: 'Pre-plant', type: 'weed', task: 'Pre-emergent herbicide + incorporate', laborDaysPerHa: 0.3, skill: 'specialist', priority: 'critical' },
      { day: 1, durationDays: 1, stage: 'Establishment', type: 'planting', task: 'Plant cotton seed at 3–5 cm depth on beds', laborDaysPerHa: 0.4, skill: 'trained', equipment: 'Precision planter', priority: 'critical', notes: 'Target 100,000–120,000 plants/ha. Soil temp >18°C required.' },
      { day: 25, durationDays: 1, stage: 'Establishment', type: 'fertilization', task: 'Side-dress N + K at 4-true-leaf', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical' },
      { day: 35, durationDays: 1, stage: 'Vegetative', type: 'weed', task: 'Post-emergent herbicide + hand-weed escapes', laborDaysPerHa: 0.5, skill: 'basic', priority: 'recommended' },
      { day: 50, durationDays: 1, stage: 'Vegetative', type: 'pruning', task: 'Thinning + gap-filling if stand is uneven', laborDaysPerHa: 0.4, skill: 'basic', priority: 'recommended' },
      { day: 70, durationDays: 1, stage: 'Vegetative', type: 'fertilization', task: 'Side-dress N + K at first square', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical' },
      { day: 80, durationDays: 2, stage: 'Flowering', type: 'pest', task: 'Begin weekly scouting: bollworm, whitefly, jassid, aphids', laborDaysPerHa: 0.5, skill: 'trained', priority: 'critical', notes: 'Use economic thresholds (e.g. 2 larvae/m for bollworm) — don\'t spray preventively.' },
      { day: 110, durationDays: 1, stage: 'Boll Development', type: 'pest', task: 'Continue scouting; pink bollworm control if needed', laborDaysPerHa: 0.3, skill: 'trained', priority: 'recommended' },
      { day: 130, durationDays: 1, stage: 'Boll Development', type: 'irrigation', task: 'Last irrigation — terminate to force cutout', laborDaysPerHa: 0.2, skill: 'trained', priority: 'critical' },
      { day: 165, durationDays: 1, stage: 'Open Boll', type: 'pruning', task: 'Apply defoliant (60–70% open bolls)', laborDaysPerHa: 0.3, skill: 'specialist', equipment: 'Sprayer 200 L/ha', priority: 'critical', notes: 'Apply at 60% open bolls; harvest 10–14 days later.' },
      { day: 178, durationDays: 2, stage: 'Open Boll', type: 'harvest', task: 'Spindle-pick harvest (1st pick)', laborDaysPerHa: 0.6, skill: 'specialist', equipment: 'Cotton picker', priority: 'critical' },
      { day: 180, durationDays: 1, stage: 'Open Boll', type: 'post_harvest', task: 'Module building + transport to gin', laborDaysPerHa: 0.4, skill: 'trained', priority: 'critical' },
    ],
    notes: 'Bt cotton reduces insecticide use 60–80%. 2nd pick adds 5–10% to yield but lower quality.',
  },

  // ========================================================================
  // 6. TOMATO (FRESH MARKET)
  // ========================================================================
  {
    id: 'tomato',
    name: 'Tomato (Fresh Market)',
    emoji: '🍅',
    category: 'fruit',
    seasonLength: 110,
    climate: 'Temperate to subtropical; 600–800 mm; frost-free',
    stages: [
      { name: 'Establishment',  startDay: 1,   endDay: 15,  kc: 0.60, emoji: '🌱', description: 'Transplant shock recovery to first flower' },
      { name: 'Vegetative',     startDay: 16,  endDay: 45,  kc: 0.85, emoji: '🌿', description: 'Vine growth + early flower trusses' },
      { name: 'Flowering',      startDay: 46,  endDay: 65,  kc: 1.15, emoji: '🌼', description: 'Full flowering on multiple trusses' },
      { name: 'Fruit Set/Fill', startDay: 66,  endDay: 95,  kc: 1.20, emoji: '🍅', description: 'Fruit sizing + color break' },
      { name: 'Harvest',        startDay: 96,  endDay: 110, kc: 0.80, emoji: '🧺', description: 'Multiple hand-picks at color stages' },
    ],
    fertilization: {
      totals: { n: 220, p: 80, k: 280, ca: 120, mg: 30, s: 30, fe: 1000, b: 500 },
      applications: [
        { day: -7, stage: 'Pre-plant', method: 'broadcast', n: 40, p: 80, k: 100, ca: 120, mg: 30, s: 30, sources: [
          { nutrient: 'P', material: 'DAP', rate: '174 kg/ha' },
          { nutrient: 'K', material: 'Potassium sulfate (0-0-50-18S)', rate: '200 kg/ha' },
          { nutrient: 'Ca', material: 'Gypsum (23% Ca, 18% S)', rate: '522 kg/ha' },
          { nutrient: 'Mg', material: 'Epsom salt (10% Mg)', rate: '300 kg/ha' },
        ], notes: 'Incorporate 2 weeks pre-plant. Ca critical for Blossom-End Rot prevention.' },
        { day: 1, stage: 'At transplant', method: 'fertigation', n: 20, p: 0, k: 20, fe: 1000, sources: [
          { nutrient: 'N+K', material: 'Calcium nitrate + potassium nitrate (starter solution)', rate: '2 g/L each, 200 mL/plant' },
          { nutrient: 'Fe', material: 'Iron chelate (Fe-EDDHA)', rate: '1 kg/ha in transplant water' },
        ], notes: 'Starter solution reduces transplant shock. Iron chelate prevents iron chlorosis in high-pH soils.' },
        { day: 20, stage: 'Vegetative', method: 'fertigation', n: 50, p: 0, k: 60, sources: [
          { nutrient: 'N', material: 'Calcium nitrate (15.5-0-0-19Ca)', rate: '160 kg/ha split weekly' },
          { nutrient: 'K', material: 'Potassium nitrate (13-0-46)', rate: '65 kg/ha' },
        ], notes: 'Begin fertigation at first new growth. Ca from calcium nitrate also feeds Ca.' },
        { day: 50, stage: 'Flowering', method: 'fertigation', n: 50, p: 0, k: 80, b: 500, sources: [
          { nutrient: 'N', material: 'Urea (fertigated)', rate: '54 kg/ha split weekly' },
          { nutrient: 'K', material: 'Potassium nitrate', rate: '87 kg/ha' },
          { nutrient: 'B', material: 'Solubor (20% B) foliar', rate: '2.5 kg/ha in 500 L water' },
        ], notes: 'B foliar at flowering improves fruit set. Avoid high N — causes excessive vegetative growth.' },
        { day: 75, stage: 'Fruit Set/Fill', method: 'fertigation', n: 40, p: 0, k: 100, sources: [
          { nutrient: 'K', material: 'Potassium nitrate', rate: '109 kg/ha (split weekly)' },
          { nutrient: 'N', material: 'Calcium nitrate', rate: '86 kg/ha' },
        ], notes: 'K demand peaks during fruit fill. Maintain Ca supply through harvest.' },
        { day: 95, stage: 'Harvest', method: 'foliar', n: 0, p: 0, k: 20, sources: [
          { nutrient: 'K', material: 'Potassium nitrate foliar', rate: '1% solution, 500 L/ha' },
        ], notes: 'Foliar K at color break improves color + Brix.' },
      ],
    },
    labor: [
      { day: -14, durationDays: 2, stage: 'Pre-plant', type: 'land_prep', task: 'Plow + rotavate + form raised beds (15 cm high, 75–90 cm apart)', laborDaysPerHa: 1.0, skill: 'trained', equipment: 'Tractor + bed shaper', priority: 'critical' },
      { day: -10, durationDays: 1, stage: 'Pre-plant', type: 'irrigation', task: 'Install drip irrigation + lay plastic mulch', laborDaysPerHa: 1.5, skill: 'trained', priority: 'recommended' },
      { day: -7, durationDays: 1, stage: 'Pre-plant', type: 'fertilization', task: 'Broadcast + incorporate basal NPK + Ca + Mg', laborDaysPerHa: 0.4, skill: 'trained', priority: 'critical' },
      { day: 1, durationDays: 3, stage: 'Establishment', type: 'planting', task: 'Transplant seedlings at 50 cm in-row spacing, 75 cm rows', laborDaysPerHa: 5.0, skill: 'trained', priority: 'critical', notes: 'Plant to same depth as nursery tray. Water immediately.' },
      { day: 5, durationDays: 1, stage: 'Establishment', type: 'irrigation', task: 'Daily drip irrigation 30 min (establishment)', laborDaysPerHa: 0.2, skill: 'basic', priority: 'critical' },
      { day: 15, durationDays: 2, stage: 'Establishment', type: 'pruning', task: 'Stake + trellis (Florida weave or cages)', laborDaysPerHa: 3.0, skill: 'trained', priority: 'critical' },
      { day: 20, durationDays: 1, stage: 'Vegetative', type: 'pruning', task: 'Remove suckers below first flower truss', laborDaysPerHa: 1.0, skill: 'trained', priority: 'recommended' },
      { day: 30, durationDays: 1, stage: 'Vegetative', type: 'weed', task: 'Cultivate between rows + hand-weed in-row', laborDaysPerHa: 1.0, skill: 'basic', priority: 'recommended' },
      { day: 50, durationDays: 1, stage: 'Flowering', type: 'pest', task: 'Begin weekly scouting: early blight, whitefly, fruitworm', laborDaysPerHa: 0.5, skill: 'trained', priority: 'critical', notes: 'Use TOM-CAST forecasting if available to time fungicides.' },
      { day: 60, durationDays: 1, stage: 'Flowering', type: 'pruning', task: 'Continue pruning + tie plants as they grow', laborDaysPerHa: 1.0, skill: 'trained', priority: 'recommended' },
      { day: 75, durationDays: 1, stage: 'Fruit Set/Fill', type: 'irrigation', task: 'Increase drip frequency — fruit fill water demand peaks', laborDaysPerHa: 0.2, skill: 'basic', priority: 'critical' },
      { day: 96, durationDays: 5, stage: 'Harvest', type: 'harvest', task: 'Begin hand-harvest at breaker stage (every 3–4 days)', laborDaysPerHa: 8.0, skill: 'trained', priority: 'critical', notes: 'Most labor-intensive operation. 4–6 pickings over 3 weeks.' },
      { day: 100, durationDays: 1, stage: 'Harvest', type: 'post_harvest', task: 'Grade + pack into 20-kg cartons; pre-cool within 2 h', laborDaysPerHa: 3.0, skill: 'trained', priority: 'critical' },
    ],
    notes: 'Blossom-End Rot (BER) is a Ca deficiency — maintain consistent moisture + Ca supply. Drip fertigation increases NUE 30%.',
  },

  // ========================================================================
  // 7. POTATO
  // ========================================================================
  {
    id: 'potato',
    name: 'Potato',
    emoji: '🥔',
    category: 'root',
    seasonLength: 110,
    climate: 'Cool temperate; 500–700 mm; optimum 18–22°C',
    stages: [
      { name: 'Sprouting/Establishment', startDay: 1, endDay: 25, kc: 0.50, emoji: '🌱', description: 'Emergence to 20% canopy' },
      { name: 'Vegetative', startDay: 26, endDay: 50, kc: 0.85, emoji: '🌿', description: 'Canopy expansion, tuber initiation' },
      { name: 'Tuber Bulking', startDay: 51, endDay: 90, kc: 1.15, emoji: '🥔', description: 'Tuber dry matter accumulation' },
      { name: 'Maturation', startDay: 91, endDay: 110, kc: 0.65, emoji: '🍂', description: 'Vine senescence, skin set' },
    ],
    fertilization: {
      totals: { n: 180, p: 80, k: 220, ca: 60, mg: 25, s: 25, mn: 800, b: 500 },
      applications: [
        { day: -5, stage: 'Pre-plant', method: 'broadcast', n: 60, p: 80, k: 120, ca: 60, mg: 25, s: 25, mn: 800, b: 500, sources: [
          { nutrient: 'P', material: 'DAP', rate: '174 kg/ha' },
          { nutrient: 'K', material: 'Muriate of potash', rate: '200 kg/ha' },
          { nutrient: 'Ca+Mg', material: 'Dolomite (15% Ca, 10% Mg)', rate: '400 kg/ha' },
          { nutrient: 'Mn', material: 'Manganese sulfate', rate: '2.3 kg/ha' },
          { nutrient: 'B', material: 'Borax', rate: '4.5 kg/ha' },
        ], notes: 'Incorporate 5 cm deep into hill. Avoid high N at planting — delays tuberization.' },
        { day: 30, stage: 'Vegetative', method: 'side_dress', n: 60, p: 0, k: 50, sources: [
          { nutrient: 'N', material: 'Urea', rate: '130 kg/ha' },
          { nutrient: 'K', material: 'Muriate of potash', rate: '83 kg/ha' },
        ], notes: 'Side-dress at tuber initiation (~30 DAP). Hill soil around plants.' },
        { day: 55, stage: 'Tuber Bulking', method: 'fertigation', n: 60, p: 0, k: 50, sources: [
          { nutrient: 'N', material: 'Urea fertigated', rate: '130 kg/ha split weekly' },
          { nutrient: 'K', material: 'Potassium nitrate', rate: '54 kg/ha' },
        ], notes: 'Critical K window — tuber bulking. Use petiole nitrate testing to fine-tune N.' },
      ],
    },
    labor: [
      { day: -10, durationDays: 2, stage: 'Pre-plant', type: 'land_prep', task: 'Plow 25 cm deep + disc + form ridges 75 cm apart', laborDaysPerHa: 0.8, skill: 'trained', equipment: 'Tractor 80 HP + ridger', priority: 'critical' },
      { day: -5, durationDays: 1, stage: 'Pre-plant', type: 'fertilization', task: 'Broadcast basal NPK + micros, then ridge', laborDaysPerHa: 0.4, skill: 'trained', priority: 'critical' },
      { day: 1, durationDays: 2, stage: 'Sprouting/Establishment', type: 'planting', task: 'Plant seed pieces (40–50 g) at 25 cm spacing, 8–10 cm deep', laborDaysPerHa: 2.5, skill: 'trained', equipment: 'Potato planter', priority: 'critical', notes: 'Use certified disease-free seed. Cut seed should suberize 2–3 days before planting.' },
      { day: 30, durationDays: 1, stage: 'Vegetative', type: 'fertilization', task: 'Side-dress N + K at tuber initiation + re-hill', laborDaysPerHa: 0.5, skill: 'trained', equipment: 'Tractor + hiller', priority: 'critical', notes: 'Hilling prevents greening + controls weeds.' },
      { day: 40, durationDays: 1, stage: 'Vegetative', type: 'weed', task: 'Cultivate between rows (final pass before canopy closes)', laborDaysPerHa: 0.3, skill: 'trained', priority: 'recommended' },
      { day: 50, durationDays: 1, stage: 'Vegetative', type: 'pest', task: 'Begin scouting: late blight (critical!), aphids, Colorado potato beetle', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical', notes: 'Late blight can destroy crop in 5–7 days. Use Blightcast forecasting.' },
      { day: 60, durationDays: 1, stage: 'Tuber Bulking', type: 'irrigation', task: 'Critical water window — keep soil at 60–80% field capacity', laborDaysPerHa: 0.3, skill: 'basic', priority: 'critical' },
      { day: 95, durationDays: 1, stage: 'Maturation', type: 'pruning', task: 'Vine kill (mechanical flail or chemical desiccant)', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical', notes: 'Allow 14–21 days for skin set before harvest.' },
      { day: 110, durationDays: 2, stage: 'Maturation', type: 'harvest', task: 'Harvest with 2-row digger; avoid skin damage', laborDaysPerHa: 1.5, skill: 'specialist', equipment: 'Potato digger + windrower', priority: 'critical' },
      { day: 112, durationDays: 2, stage: 'Maturation', type: 'post_harvest', task: 'Cure at 13–15°C + 95% RH for 10–14 days, then store at 4–7°C', laborDaysPerHa: 1.0, skill: 'trained', priority: 'critical' },
    ],
    notes: 'Late blight (Phytophthora infestans) is the #1 risk — use resistant varieties + preventive fungicide program. Petiole nitrate testing saves 30–50 kg N/ha.',
  },

  // ========================================================================
  // 8. LETTUCE
  // ========================================================================
  {
    id: 'lettuce',
    name: 'Lettuce',
    emoji: '🥬',
    category: 'vegetable',
    seasonLength: 60,
    climate: 'Cool season; 15–20°C optimum; bolt-sensitive above 24°C',
    stages: [
      { name: 'Establishment',  startDay: 1,   endDay: 10,  kc: 0.45, emoji: '🌱', description: 'Transplant recovery + first new leaves' },
      { name: 'Vegetative',     startDay: 11,  endDay: 40,  kc: 0.85, emoji: '🥬', description: 'Head/leaf formation' },
      { name: 'Maturity',       startDay: 41,  endDay: 55,  kc: 1.00, emoji: '🥬', description: 'Harvest window (firm heads)' },
      { name: 'Bolting Risk',   startDay: 56,  endDay: 60,  kc: 0.70, emoji: '🌼', description: 'Quality declines rapidly if not harvested' },
    ],
    fertilization: {
      totals: { n: 110, p: 50, k: 150, ca: 50, mg: 20, s: 15, b: 500, mn: 500 },
      applications: [
        { day: -5, stage: 'Pre-plant', method: 'broadcast', n: 40, p: 50, k: 80, ca: 50, mg: 20, s: 15, b: 500, sources: [
          { nutrient: 'P', material: 'Triple superphosphate', rate: '109 kg/ha' },
          { nutrient: 'K', material: 'Potassium sulfate', rate: '160 kg/ha' },
          { nutrient: 'Ca+Mg', material: 'Dolomite', rate: '333 kg/ha' },
          { nutrient: 'B', material: 'Borax', rate: '4.5 kg/ha' },
        ], notes: 'Incorporate into top 15 cm. Lettuce has shallow roots — keep nutrients in top 15 cm.' },
        { day: 10, stage: 'Establishment', method: 'fertigation', n: 30, p: 0, k: 35, sources: [
          { nutrient: 'N', material: 'Calcium nitrate (fertigated)', rate: '95 kg/ha' },
          { nutrient: 'K', material: 'Potassium nitrate', rate: '38 kg/ha' },
        ], notes: 'Begin fertigation after establishment. Frequent low doses work better than infrequent high doses.' },
        { day: 25, stage: 'Vegetative', method: 'fertigation', n: 30, p: 0, k: 35, mn: 500, sources: [
          { nutrient: 'N', material: 'Urea fertigated', rate: '33 kg/ha' },
          { nutrient: 'K', material: 'Potassium nitrate', rate: '38 kg/ha' },
          { nutrient: 'Mn', material: 'Manganese sulfate foliar', rate: '1.4 kg/ha' },
        ], notes: 'Peak N demand during head formation. Foliar Mn on high-pH soils.' },
        { day: 40, stage: 'Maturity', method: 'fertigation', n: 10, p: 0, k: 0, sources: [
          { nutrient: 'N', material: 'Calcium nitrate (light feed)', rate: '32 kg/ha' },
        ], notes: 'Light feed to maintain color. Avoid high N — causes tipburn + loose heads.' },
      ],
    },
    labor: [
      { day: -7, durationDays: 1, stage: 'Pre-plant', type: 'land_prep', task: 'Rotavate + form raised beds 60–90 cm wide', laborDaysPerHa: 0.5, skill: 'trained', equipment: 'Tractor 40 HP', priority: 'critical' },
      { day: -5, durationDays: 1, stage: 'Pre-plant', type: 'fertilization', task: 'Broadcast + incorporate basal NPK + Ca + B', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical' },
      { day: -3, durationDays: 1, stage: 'Pre-plant', type: 'irrigation', task: 'Install drip irrigation (2 lines per bed)', laborDaysPerHa: 0.8, skill: 'trained', priority: 'recommended' },
      { day: 1, durationDays: 2, stage: 'Establishment', type: 'planting', task: 'Transplant at 30×30 cm spacing (head lettuce)', laborDaysPerHa: 4.0, skill: 'trained', priority: 'critical' },
      { day: 3, durationDays: 1, stage: 'Establishment', type: 'irrigation', task: 'Daily sprinkler 5–10 mm for first week', laborDaysPerHa: 0.3, skill: 'basic', priority: 'critical' },
      { day: 15, durationDays: 1, stage: 'Vegetative', type: 'weed', task: 'Hand-weed + cultivate between beds', laborDaysPerHa: 1.5, skill: 'basic', priority: 'recommended' },
      { day: 20, durationDays: 1, stage: 'Vegetative', type: 'pest', task: 'Scout for aphids + downy mildew + tipburn', laborDaysPerHa: 0.3, skill: 'trained', priority: 'recommended' },
      { day: 45, durationDays: 1, stage: 'Maturity', type: 'monitoring', task: 'Check head firmness + maturity (squeeze test)', laborDaysPerHa: 0.2, skill: 'trained', priority: 'critical' },
      { day: 50, durationDays: 2, stage: 'Maturity', type: 'harvest', task: 'Cut heads early morning; pre-cool within 1 hour', laborDaysPerHa: 4.0, skill: 'trained', priority: 'critical', notes: 'Hydro-cool to 1°C immediately. Shelf life 14 days at 0°C.' },
      { day: 51, durationDays: 1, stage: 'Maturity', type: 'post_harvest', task: 'Pack in waxed cartons; vacuum or plastic-wrap', laborDaysPerHa: 1.5, skill: 'trained', priority: 'critical' },
    ],
    notes: 'Tipburn (Ca deficiency) is #1 quality issue — maintain Ca supply + transpiration (avoid high humidity).',
  },

  // ========================================================================
  // 9. ONION
  // ========================================================================
  {
    id: 'onion',
    name: 'Onion (Dry Bulb)',
    emoji: '🧅',
    category: 'vegetable',
    seasonLength: 150,
    climate: 'Cool vegetative, warm ripening; 400–600 mm',
    stages: [
      { name: 'Establishment',  startDay: 1,   endDay: 30,  kc: 0.50, emoji: '🌱', description: 'Slow early growth — critical weed window' },
      { name: 'Vegetative',     startDay: 31,  endDay: 90,  kc: 0.90, emoji: '🌿', description: 'Bulb initiation + leaf growth' },
      { name: 'Bulbing',        startDay: 91,  endDay: 130, kc: 1.05, emoji: '🧅', description: 'Bulb enlargement — photoperiod-triggered' },
      { name: 'Curing',         startDay: 131, endDay: 150, kc: 0.55, emoji: '🍂', description: 'Top fall + neck softening + harvest' },
    ],
    fertilization: {
      totals: { n: 140, p: 70, k: 130, s: 30, ca: 40, b: 500, cu: 500 },
      applications: [
        { day: -5, stage: 'Pre-plant', method: 'broadcast', n: 30, p: 70, k: 60, s: 30, ca: 40, b: 500, cu: 500, sources: [
          { nutrient: 'P', material: 'DAP', rate: '152 kg/ha' },
          { nutrient: 'K+S', material: 'Potassium sulfate', rate: '167 kg/ha' },
          { nutrient: 'Ca', material: 'Gypsum', rate: '174 kg/ha' },
          { nutrient: 'B', material: 'Borax', rate: '4.5 kg/ha' },
        ], notes: 'Onions are S-responsive — use potassium sulfate, not Muriate. P critical for early root growth.' },
        { day: 30, stage: 'Establishment', method: 'side_dress', n: 40, p: 0, k: 35, sources: [
          { nutrient: 'N', material: 'Urea', rate: '87 kg/ha' },
          { nutrient: 'K', material: 'Potassium nitrate', rate: '38 kg/ha' },
        ], notes: 'Apply at 3 true leaves. Avoid leaf contact — burn risk.' },
        { day: 60, stage: 'Vegetative', method: 'side_dress', n: 40, p: 0, k: 35, sources: [
          { nutrient: 'N', material: 'Urea', rate: '87 kg/ha' },
          { nutrient: 'K', material: 'Potassium nitrate', rate: '38 kg/ha' },
        ], notes: 'At bulb initiation. Sufficient N now determines final bulb size.' },
        { day: 95, stage: 'Bulbing', method: 'fertigation', n: 30, p: 0, k: 0, sources: [
          { nutrient: 'N', material: 'Urea fertigated', rate: '65 kg/ha' },
        ], notes: 'Final N — stop at bulb maturity (when tops begin to fall) to avoid thick necks + storage rot.' },
      ],
    },
    labor: [
      { day: -10, durationDays: 2, stage: 'Pre-plant', type: 'land_prep', task: 'Plow + disc + form raised beds 60 cm wide', laborDaysPerHa: 0.6, skill: 'trained', priority: 'critical' },
      { day: -5, durationDays: 1, stage: 'Pre-plant', type: 'fertilization', task: 'Broadcast + incorporate basal NPK + S + B', laborDaysPerHa: 0.4, skill: 'trained', priority: 'critical' },
      { day: 1, durationDays: 2, stage: 'Establishment', type: 'planting', task: 'Direct seed at 1 cm depth OR transplant seedlings at 10×40 cm', laborDaysPerHa: 3.0, skill: 'trained', equipment: 'Precision seeder', priority: 'critical', notes: 'Use pelleted seed for uniform spacing. Transplants cost more but reduce weed pressure.' },
      { day: 7, durationDays: 1, stage: 'Establishment', type: 'weed', task: 'Critical weed control — onions cannot compete', laborDaysPerHa: 1.5, skill: 'basic', priority: 'critical', notes: 'Weed-free window is first 50 days.' },
      { day: 30, durationDays: 1, stage: 'Establishment', type: 'fertilization', task: 'Side-dress N + K at 3-leaf stage', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical' },
      { day: 35, durationDays: 1, stage: 'Establishment', type: 'irrigation', task: 'Maintain even moisture — fluctuations cause splitting', laborDaysPerHa: 0.2, skill: 'basic', priority: 'recommended' },
      { day: 45, durationDays: 2, stage: 'Establishment', type: 'weed', task: 'Final hand-weed before canopy closes', laborDaysPerHa: 2.0, skill: 'basic', priority: 'recommended' },
      { day: 60, durationDays: 1, stage: 'Vegetative', type: 'fertilization', task: 'Side-dress N + K at bulb initiation', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical' },
      { day: 75, durationDays: 1, stage: 'Vegetative', type: 'pest', task: 'Scout for thrips + Botrytis leaf blight', laborDaysPerHa: 0.3, skill: 'trained', priority: 'recommended' },
      { day: 120, durationDays: 1, stage: 'Bulbing', type: 'irrigation', task: 'Reduce irrigation when 25% tops fallen', laborDaysPerHa: 0.2, skill: 'trained', priority: 'critical' },
      { day: 130, durationDays: 1, stage: 'Curing', type: 'irrigation', task: 'Stop irrigation completely at 50% tops down', laborDaysPerHa: 0.1, skill: 'trained', priority: 'critical' },
      { day: 140, durationDays: 2, stage: 'Curing', type: 'harvest', task: 'Undercut bulbs + windrow 2–3 days for field curing', laborDaysPerHa: 1.5, skill: 'trained', equipment: 'Undercutter + windrower', priority: 'critical' },
      { day: 145, durationDays: 1, stage: 'Curing', type: 'post_harvest', task: 'Continue curing 2–3 weeks at 25–30°C + 65% RH', laborDaysPerHa: 0.5, skill: 'trained', priority: 'critical', notes: 'Curing determines storage life — necks must be dry + tight.' },
      { day: 150, durationDays: 1, stage: 'Curing', type: 'post_harvest', task: 'Grade + store at 0–1°C + 65% RH (4–6 months storage)', laborDaysPerHa: 1.0, skill: 'trained', priority: 'critical' },
    ],
    notes: 'Stop N when tops begin to fall — late N causes thick necks + storage rot. Onions are S-deficient on sandy soils.',
  },

  // ========================================================================
  // 10. ALFALFA (PERENNIAL FORAGE)
  // ========================================================================
  {
    id: 'alfalfa',
    name: 'Alfalfa (Lucerne)',
    emoji: '🌿',
    category: 'forage',
    seasonLength: 365,
    climate: 'Temperate; drought-tolerant once established; pH 6.5–7.5',
    stages: [
      { name: 'Establishment',  startDay: 1,   endDay: 60,  kc: 0.40, emoji: '🌱', description: 'Seedling to first cut' },
      { name: 'Production (Y1)', startDay: 61, endDay: 200, kc: 1.20, emoji: '🌿', description: 'First-season cuts (4–5 cuts)' },
      { name: 'Production (Y2+)', startDay: 201, endDay: 365, kc: 1.20, emoji: '🌿', description: 'Mature stand — peak production years 2–4' },
    ],
    fertilization: {
      totals: { n: 0, p: 80, k: 200, s: 30, b: 1000 },
      applications: [
        { day: 0, stage: 'Pre-plant (year 0)', method: 'broadcast', n: 0, p: 80, k: 200, s: 30, b: 1000, sources: [
          { nutrient: 'P', material: 'Triple superphosphate', rate: '174 kg/ha' },
          { nutrient: 'K', material: 'Potassium sulfate', rate: '400 kg/ha' },
          { nutrient: 'B', material: 'Borax', rate: '9 kg/ha' },
        ], notes: 'Alfalfa fixes its own N — inoculate seed with Sinorhizobium meliloti. High K demand — applies each year.' },
        { day: 1, stage: 'At planting', method: 'seed_treatment', n: 0, p: 0, k: 0, sources: [
          { nutrient: 'Inoculant', material: 'Sinorhizobium meliloti peat', rate: '200 g/25 kg seed' },
        ], notes: 'Essential for N fixation. Use fresh inoculant.' },
        { day: 100, stage: 'Production (annual maintenance)', method: 'broadcast', n: 0, p: 0, k: 150, s: 20, b: 500, sources: [
          { nutrient: 'K', material: 'Potassium sulfate', rate: '300 kg/ha after each cut' },
        ], notes: 'Re-apply K + S + B annually based on soil tests. Alfalfa removes 25 kg K/t forage — huge demand.' },
      ],
    },
    labor: [
      { day: -10, durationDays: 2, stage: 'Pre-plant', type: 'land_prep', task: 'Deep plow 30 cm + disc + firm seedbed (alfalfa needs firm seedbed)', laborDaysPerHa: 0.8, skill: 'trained', equipment: 'Tractor 80 HP', priority: 'critical', notes: 'Firm seedbed essential — should leave only 1–2 cm footprint when walked.' },
      { day: -5, durationDays: 1, stage: 'Pre-plant', type: 'fertilization', task: 'Broadcast basal P + K + B, then incorporate', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical' },
      { day: 1, durationDays: 1, stage: 'Establishment', type: 'planting', task: 'Drill at 1–1.5 cm depth, 15–20 cm rows, 15–20 kg seed/ha', laborDaysPerHa: 0.3, skill: 'trained', equipment: 'Brillion seeder or grain drill', priority: 'critical' },
      { day: 1, durationDays: 1, stage: 'Establishment', type: 'fertilization', task: 'Inoculate seed with Sinorhizobium meliloti', laborDaysPerHa: 0.2, skill: 'trained', priority: 'critical' },
      { day: 30, durationDays: 1, stage: 'Establishment', type: 'weed', task: 'Control weeds (post-emergent grass + broadleaf)', laborDaysPerHa: 0.3, skill: 'specialist', priority: 'critical', notes: 'Weed competition in establishment year is #1 stand loss cause.' },
      { day: 60, durationDays: 1, stage: 'Establishment', type: 'harvest', task: 'First cut at 10% bloom (or 60 days after planting)', laborDaysPerHa: 0.4, skill: 'trained', equipment: 'Mower-conditioner', priority: 'recommended' },
      { day: 90, durationDays: 1, stage: 'Production', type: 'harvest', task: 'Cut #2 at 10% bloom (every 28–35 days)', laborDaysPerHa: 0.4, skill: 'trained', priority: 'critical' },
      { day: 120, durationDays: 1, stage: 'Production', type: 'harvest', task: 'Cut #3', laborDaysPerHa: 0.4, skill: 'trained', priority: 'critical' },
      { day: 150, durationDays: 1, stage: 'Production', type: 'harvest', task: 'Cut #4', laborDaysPerHa: 0.4, skill: 'trained', priority: 'critical' },
      { day: 180, durationDays: 1, stage: 'Production', type: 'harvest', task: 'Cut #5 (last cut 6 weeks before killing frost)', laborDaysPerHa: 0.4, skill: 'trained', priority: 'recommended', notes: 'Late cut reduces winter survival — stop 6 weeks before frost.' },
      { day: 200, durationDays: 1, stage: 'Production', type: 'fertilization', task: 'Annual K + S + B top-dress after last cut', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical' },
      { day: 100, durationDays: 1, stage: 'Production', type: 'pest', task: 'Scout for alfalfa weevil (spring) + potato leafhopper (summer)', laborDaysPerHa: 0.2, skill: 'trained', priority: 'recommended' },
      { day: 250, durationDays: 1, stage: 'Production', type: 'monitoring', task: 'Soil test every 2 years — K + B depletion is rapid', laborDaysPerHa: 0.1, skill: 'basic', priority: 'recommended' },
    ],
    notes: 'Stand life typically 4–6 years. Replant when stand density < 4 plants/ft² (40/m²). High-K demand — apply annually.',
  },

  // ========================================================================
  // 11. COFFEE (ARABICA)
  // ========================================================================
  {
    id: 'coffee',
    name: 'Coffee (Arabica)',
    emoji: '☕',
    category: 'orchard',
    seasonLength: 280,
    climate: 'Tropical highland; 15–24°C; 1500–2500 m elevation',
    stages: [
      { name: 'Vegetative',  startDay: 1,   endDay: 90,  kc: 0.85, emoji: '🌿', description: 'Leaf flush + branch growth (post-harvest)' },
      { name: 'Flower Initiation', startDay: 91, endDay: 140, kc: 0.90, emoji: '🌸', description: 'Flower buds form after rain trigger' },
      { name: 'Flowering',   startDay: 141, endDay: 170, kc: 1.00, emoji: '🌼', description: 'Mass flowering after first rains' },
      { name: 'Berry Development', startDay: 171, endDay: 260, kc: 1.10, emoji: '🍒', description: 'Pinhead → expansion → ripening' },
      { name: 'Harvest',     startDay: 261, endDay: 280, kc: 0.80, emoji: '🧺', description: 'Selective picking of ripe cherries' },
    ],
    fertilization: {
      totals: { n: 250, p: 50, k: 250, ca: 80, mg: 40, s: 30, b: 1000, zn: 1000 },
      applications: [
        { day: 30, stage: 'Vegetative (post-harvest)', method: 'band', n: 80, p: 50, k: 60, ca: 80, mg: 40, s: 30, b: 1000, zn: 1000, sources: [
          { nutrient: 'N+P+K', material: 'NPK 15-15-15', rate: '333 kg/ha' },
          { nutrient: 'Ca+Mg', material: 'Dolomite', rate: '533 kg/ha' },
          { nutrient: 'B+Zn', material: 'Foliar micronutrient mix', rate: '2 kg/ha' },
        ], notes: 'Main application 4–6 weeks after harvest. Apply in band under drip line.' },
        { day: 100, stage: 'Pre-flowering', method: 'band', n: 60, p: 0, k: 80, sources: [
          { nutrient: 'N', material: 'Urea', rate: '130 kg/ha' },
          { nutrient: 'K', material: 'Potassium sulfate', rate: '160 kg/ha' },
        ], notes: 'Apply 6–8 weeks before flowering. K critical for flower bud formation.' },
        { day: 160, stage: 'Flowering', method: 'foliar', n: 0, p: 0, k: 0, b: 500, sources: [
          { nutrient: 'B', material: 'Borax foliar 0.5%', rate: '2.5 kg/ha in 500 L' },
        ], notes: 'B foliar at flowering improves fruit set.' },
        { day: 200, stage: 'Berry Development', method: 'band', n: 70, p: 0, k: 80, sources: [
          { nutrient: 'N', material: 'Urea', rate: '152 kg/ha' },
          { nutrient: 'K', material: 'Potassium nitrate', rate: '87 kg/ha' },
        ], notes: 'Critical K window during berry expansion. N affects bean size.' },
        { day: 240, stage: 'Berry Ripening', method: 'band', n: 40, p: 0, k: 30, sources: [
          { nutrient: 'N+K', material: 'NPK 15-5-20', rate: '200 kg/ha' },
        ], notes: 'Final application 6–8 weeks before harvest. Maintain K for bean quality.' },
      ],
    },
    labor: [
      { day: 30, durationDays: 5, stage: 'Vegetative', type: 'pruning', task: 'Annual pruning — remove old wood + suckers + desuckering', laborDaysPerHa: 4.0, skill: 'specialist', priority: 'critical', notes: 'Critical for next year\'s yield. Train workers — bad pruning reduces yield for 2 years.' },
      { day: 35, durationDays: 1, stage: 'Vegetative', type: 'fertilization', task: 'Apply main NPK + Ca + Mg + micros in band', laborDaysPerHa: 0.5, skill: 'trained', priority: 'critical' },
      { day: 60, durationDays: 3, stage: 'Vegetative', type: 'weed', task: 'Manual weeding under trees + cover crop maintenance', laborDaysPerHa: 2.0, skill: 'basic', priority: 'recommended' },
      { day: 90, durationDays: 1, stage: 'Flower Initiation', type: 'irrigation', task: 'Withhold irrigation 6–8 weeks to induce flowering (if irrigated)', laborDaysPerHa: 0.2, skill: 'trained', priority: 'critical', notes: 'Stress triggers uniform flowering when rains return.' },
      { day: 100, durationDays: 1, stage: 'Pre-flowering', type: 'fertilization', task: 'Apply pre-flowering N + K', laborDaysPerHa: 0.4, skill: 'trained', priority: 'critical' },
      { day: 145, durationDays: 1, stage: 'Flowering', type: 'pest', task: 'Scout for coffee berry borer + leaf rust', laborDaysPerHa: 0.4, skill: 'trained', priority: 'critical', notes: 'Leaf rust (Hemileia vastatrix) can defoliate in 2 weeks — preventive fungicide program.' },
      { day: 200, durationDays: 1, stage: 'Berry Development', type: 'fertilization', task: 'Apply N + K during berry expansion', laborDaysPerHa: 0.4, skill: 'trained', priority: 'critical' },
      { day: 220, durationDays: 1, stage: 'Berry Development', type: 'pest', task: 'Begin CBB (coffee berry borer) monitoring — alcohol traps', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical' },
      { day: 261, durationDays: 15, stage: 'Harvest', type: 'harvest', task: 'Selective hand-picking of ripe cherries (3–5 passes)', laborDaysPerHa: 25.0, skill: 'trained', priority: 'critical', notes: 'Most labor-intensive operation. Selective picking yields 40% more than strip picking.' },
      { day: 275, durationDays: 2, stage: 'Harvest', type: 'post_harvest', task: 'Process (washed / natural / honey) + dry to 11% moisture', laborDaysPerHa: 8.0, skill: 'specialist', priority: 'critical' },
    ],
    notes: 'Shade trees (15–30%) reduce temperature stress + improve quality. Cover crops (Arachis pintoi, Calliandra) add N + reduce erosion.',
  },

  // ========================================================================
  // 12. APPLE (DECIDUOUS ORCHARD)
  // ========================================================================
  {
    id: 'apple',
    name: 'Apple',
    emoji: '🍎',
    category: 'orchard',
    seasonLength: 210,
    climate: 'Temperate; 800–1200 chill hours below 7°C',
    stages: [
      { name: 'Dormancy/Bud Break', startDay: 1, endDay: 30, kc: 0.45, emoji: '💤', description: 'Dormancy → green tip → pink' },
      { name: 'Bloom',     startDay: 31, endDay: 50,  kc: 0.85, emoji: '🌸', description: 'Full bloom — pollination window' },
      { name: 'Fruit Set/Cell Division', startDay: 51, endDay: 90, kc: 0.95, emoji: '🍏', description: 'Fruit set + early cell division (determines final size)' },
      { name: 'Fruit Sizing', startDay: 91, endDay: 170, kc: 1.10, emoji: '🍎', description: 'Cell expansion + sugar accumulation' },
      { name: 'Maturation/Harvest', startDay: 171, endDay: 210, kc: 0.85, emoji: '🧺', description: 'Color development + starch conversion' },
    ],
    fertilization: {
      totals: { n: 90, p: 40, k: 150, ca: 100, mg: 30, s: 20, b: 1000, zn: 1000 },
      applications: [
        { day: 10, stage: 'Bud break', method: 'band', n: 30, p: 40, k: 50, ca: 50, sources: [
          { nutrient: 'N+P+K', material: 'NPK 12-12-17', rate: '250 kg/ha' },
          { nutrient: 'Ca', material: 'Calcium nitrate', rate: '200 kg/ha banded' },
        ], notes: 'Apply at green tip. Ca critical for fruit quality + storage life.' },
        { day: 60, stage: 'Fruit Set', method: 'fertigation', n: 30, p: 0, k: 50, sources: [
          { nutrient: 'N', material: 'Urea fertigated', rate: '33 kg/ha split weekly' },
          { nutrient: 'K', material: 'Potassium nitrate', rate: '54 kg/ha' },
        ], notes: 'Begin fertigation after fruit set. Cell division stage sets final fruit size.' },
        { day: 100, stage: 'Fruit Sizing', method: 'foliar', n: 0, p: 0, k: 0, ca: 50, b: 500, zn: 1000, sources: [
          { nutrient: 'Ca', material: 'Calcium chloride foliar 0.5%', rate: '5 kg/ha in 1000 L (4 sprays, 7-day intervals)' },
          { nutrient: 'Zn', material: 'Zinc sulfate foliar', rate: '2 kg/ha' },
          { nutrient: 'B', material: 'Solubor foliar', rate: '1 kg/ha' },
        ], notes: 'Ca sprays critical — prevents bitter pit + improves storage life. Apply to fruit, not leaves.' },
        { day: 130, stage: 'Fruit Sizing', method: 'fertigation', n: 30, p: 0, k: 50, mg: 30, s: 20, sources: [
          { nutrient: 'N', material: 'Urea fertigated', rate: '33 kg/ha' },
          { nutrient: 'K', material: 'Potassium sulfate', rate: '100 kg/ha' },
          { nutrient: 'Mg', material: 'Epsom salt foliar 2%', rate: '4 kg/ha' },
        ], notes: 'K demand peaks during fruit sizing. Mg + S for photosynthesis.' },
      ],
    },
    labor: [
      { day: 10, durationDays: 10, stage: 'Dormancy/Bud Break', type: 'pruning', task: 'Winter pruning — structure + fruiting wood + open canopy', laborDaysPerHa: 6.0, skill: 'specialist', priority: 'critical', notes: 'Most critical annual operation. Train workers — bad pruning costs yield for 3+ years.' },
      { day: 15, durationDays: 1, stage: 'Dormancy/Bud Break', type: 'fertilization', task: 'Apply NPK + Ca at green tip', laborDaysPerHa: 0.4, skill: 'trained', priority: 'critical' },
      { day: 25, durationDays: 1, stage: 'Dormancy/Bud Break', type: 'pest', task: 'Dormant oil spray (scale + mite control)', laborDaysPerHa: 0.4, skill: 'specialist', equipment: 'Airblast sprayer', priority: 'recommended' },
      { day: 35, durationDays: 3, stage: 'Bloom', type: 'monitoring', task: 'Pollination management — hives in at 10% bloom', laborDaysPerHa: 0.5, skill: 'trained', priority: 'critical', notes: '2–4 hives/ha. Do NOT spray insecticides during bloom.' },
      { day: 50, durationDays: 2, stage: 'Fruit Set', type: 'pruning', task: 'Thinning — hand or chemical (NAA + carbaryl) at 8–12 mm fruit', laborDaysPerHa: 4.0, skill: 'specialist', priority: 'critical', notes: 'Critical — too many fruits = small size + alternate bearing. Target 1 fruit per 8–10 cm.' },
      { day: 60, durationDays: 1, stage: 'Fruit Set', type: 'fertilization', task: 'Begin fertigation (N + K) after fruit set', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical' },
      { day: 80, durationDays: 1, stage: 'Fruit Set', type: 'pest', task: 'Begin IPM scouting — codling moth, apple scab, fire blight', laborDaysPerHa: 0.4, skill: 'trained', priority: 'critical', notes: 'Use degree-day models for codling moth timing.' },
      { day: 100, durationDays: 1, stage: 'Fruit Sizing', type: 'fertilization', task: 'Ca foliar sprays (4 sprays @ 7-day intervals)', laborDaysPerHa: 0.4, skill: 'trained', priority: 'critical' },
      { day: 120, durationDays: 2, stage: 'Fruit Sizing', type: 'pruning', task: 'Summer pruning — water sprouts + suckers', laborDaysPerHa: 2.0, skill: 'trained', priority: 'recommended' },
      { day: 150, durationDays: 1, stage: 'Fruit Sizing', type: 'monitoring', task: 'Estimate crop load + adjust irrigation', laborDaysPerHa: 0.3, skill: 'trained', priority: 'recommended' },
      { day: 175, durationDays: 1, stage: 'Maturation', type: 'monitoring', task: 'Begin maturity testing — starch index + Brix + firmness', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical' },
      { day: 185, durationDays: 5, stage: 'Maturation', type: 'harvest', task: 'Pick by maturity (2–3 picks per variety, 5–7 day intervals)', laborDaysPerHa: 8.0, skill: 'trained', priority: 'critical', notes: 'Pick at correct maturity — too early = poor color + bitter pit, too late = soft + short storage.' },
      { day: 195, durationDays: 1, stage: 'Maturation', type: 'post_harvest', task: 'Pre-cool within 24 h; CA storage at 0–1°C + 2% O2', laborDaysPerHa: 2.0, skill: 'trained', priority: 'critical' },
    ],
    notes: 'Alternate bearing can be reduced by aggressive thinning. Ca sprays are the #1 determinant of storage life.',
  },

  // ========================================================================
  // 13. SUNFLOWER
  // ========================================================================
  {
    id: 'sunflower',
    name: 'Sunflower',
    emoji: '🌻',
    category: 'industrial',
    seasonLength: 110,
    climate: 'Temperate to subtropical; drought-tolerant; 400–600 mm',
    stages: [
      { name: 'Establishment', startDay: 1, endDay: 20, kc: 0.35, emoji: '🌱', description: 'Emergence to 4-leaf' },
      { name: 'Vegetative',    startDay: 21, endDay: 55, kc: 0.75, emoji: '🌿', description: 'Stem elongation + head formation' },
      { name: 'Bud/Flowering', startDay: 56, endDay: 75, kc: 1.10, emoji: '🌼', description: 'Bud visible + ray florets open' },
      { name: 'Seed Fill',     startDay: 76, endDay: 100, kc: 1.05, emoji: '🌻', description: 'OIL + protein accumulation' },
      { name: 'Maturation',    startDay: 101, endDay: 110, kc: 0.40, emoji: '🍂', description: 'Back of head yellow → brown' },
    ],
    fertilization: {
      totals: { n: 120, p: 60, k: 120, s: 25, b: 500 },
      applications: [
        { day: 0, stage: 'Pre-plant', method: 'broadcast', n: 50, p: 60, k: 120, s: 25, b: 500, sources: [
          { nutrient: 'P', material: 'DAP', rate: '130 kg/ha' },
          { nutrient: 'K+S', material: 'Potassium sulfate', rate: '240 kg/ha' },
          { nutrient: 'B', material: 'Borax', rate: '4.5 kg/ha' },
        ], notes: 'Incorporate before planting. S + B critical for oil content.' },
        { day: 30, stage: 'Vegetative', method: 'side_dress', n: 70, p: 0, k: 0, sources: [
          { nutrient: 'N', material: 'Urea', rate: '152 kg/ha' },
        ], notes: 'Side-dress at 4–6 leaf stage. N after bud formation reduces oil content.' },
      ],
    },
    labor: [
      { day: -7, durationDays: 1, stage: 'Pre-plant', type: 'land_prep', task: 'Minimum till + cultivate', laborDaysPerHa: 0.3, skill: 'trained', priority: 'recommended' },
      { day: 1, durationDays: 1, stage: 'Establishment', type: 'planting', task: 'Drill at 4–5 cm depth, 50–70 cm rows, target 60,000 plants/ha', laborDaysPerHa: 0.3, skill: 'trained', equipment: 'Precision planter', priority: 'critical' },
      { day: 20, durationDays: 1, stage: 'Establishment', type: 'weed', task: 'Post-emergent herbicide at 4-leaf', laborDaysPerHa: 0.2, skill: 'specialist', priority: 'recommended' },
      { day: 30, durationDays: 1, stage: 'Vegetative', type: 'fertilization', task: 'Side-dress N at 4–6 leaf', laborDaysPerHa: 0.2, skill: 'trained', priority: 'critical' },
      { day: 60, durationDays: 1, stage: 'Bud/Flowering', type: 'pest', task: 'Scout for sunflower moth + head clipper weevil', laborDaysPerHa: 0.2, skill: 'trained', priority: 'critical', notes: 'Insecticide at 10% bloom if threshold reached.' },
      { day: 75, durationDays: 1, stage: 'Bud/Flowering', type: 'monitoring', task: 'Bee pollination check — 1 hive/ha for confectionery types', laborDaysPerHa: 0.1, skill: 'basic', priority: 'recommended' },
      { day: 105, durationDays: 1, stage: 'Maturation', type: 'monitoring', task: 'Check seed moisture (~12% for harvest)', laborDaysPerHa: 0.1, skill: 'basic', priority: 'critical' },
      { day: 108, durationDays: 1, stage: 'Maturation', type: 'harvest', task: 'Combine harvest with header adjusted for tall plants', laborDaysPerHa: 0.4, skill: 'specialist', equipment: 'Combine + sunflower header', priority: 'critical' },
    ],
    notes: 'Avoid N after bud formation — reduces oil %. S and B deficiencies cut yield + oil quality.',
  },

  // ========================================================================
  // 14. CITRUS (ORANGE)
  // ========================================================================
  {
    id: 'citrus',
    name: 'Citrus (Orange)',
    emoji: '🍊',
    category: 'orchard',
    seasonLength: 365,
    climate: 'Subtropical; frost-free; 1000–1500 mm or irrigated',
    stages: [
      { name: 'Vegetative Flush', startDay: 1, endDay: 90, kc: 0.85, emoji: '🌿', description: 'Spring flush + root growth' },
      { name: 'Flowering/Fruit Set', startDay: 91, endDay: 130, kc: 1.00, emoji: '🌸', description: 'Bloom + fruit set + physiological drop' },
      { name: 'Fruit Sizing', startDay: 131, endDay: 250, kc: 1.05, emoji: '🍊', description: 'Cell expansion + juice sac development' },
      { name: 'Maturation', startDay: 251, endDay: 330, kc: 0.90, emoji: '🍊', description: 'Color break + sugar + acid balance' },
      { name: 'Harvest/Dormancy', startDay: 331, endDay: 365, kc: 0.75, emoji: '🧺', description: 'Harvest + winter semi-dormancy' },
    ],
    fertilization: {
      totals: { n: 180, p: 50, k: 220, ca: 80, mg: 40, s: 25, zn: 2000, mn: 1000, fe: 1000, b: 500 },
      applications: [
        { day: 30, stage: 'Spring flush', method: 'band', n: 70, p: 50, k: 70, ca: 80, mg: 40, s: 25, sources: [
          { nutrient: 'N+P+K', material: 'NPK 15-10-20', rate: '466 kg/ha' },
          { nutrient: 'Ca+Mg', material: 'Dolomite', rate: '533 kg/ha (every 2–3 years)' },
        ], notes: 'Apply 1/3 of annual N+K + all P + Ca + Mg at bud break. Soil pH must be 6.0–6.5.' },
        { day: 100, stage: 'Flowering/Fruit Set', method: 'fertigation', n: 50, p: 0, k: 70, zn: 2000, mn: 1000, fe: 1000, b: 500, sources: [
          { nutrient: 'N+K', material: 'Urea + potassium nitrate fertigated', rate: '108 kg + 87 kg/ha split weekly' },
          { nutrient: 'Micros', material: 'Foliar micronutrient mix', rate: '3 kg/ha in 1000 L' },
        ], notes: 'Foliar Zn + Mn + B at petal fall. Fe chelate via soil if iron chlorosis present.' },
        { day: 180, stage: 'Fruit Sizing', method: 'fertigation', n: 60, p: 0, k: 80, sources: [
          { nutrient: 'N+K', material: 'Urea + potassium nitrate fertigated', rate: '130 kg + 100 kg/ha split weekly' },
        ], notes: 'K demand peaks during fruit sizing. N split into weekly applications.' },
      ],
    },
    labor: [
      { day: 30, durationDays: 5, stage: 'Spring flush', type: 'pruning', task: 'Annual pruning — remove dead wood, water sprouts, open canopy', laborDaysPerHa: 3.0, skill: 'specialist', priority: 'critical' },
      { day: 30, durationDays: 1, stage: 'Spring flush', type: 'fertilization', task: 'Apply main NPK + Ca + Mg under canopy drip line', laborDaysPerHa: 0.5, skill: 'trained', priority: 'critical' },
      { day: 60, durationDays: 1, stage: 'Spring flush', type: 'irrigation', task: 'Begin irrigation cycle — 50–80 mm/week in dry season', laborDaysPerHa: 0.2, skill: 'basic', priority: 'recommended' },
      { day: 95, durationDays: 1, stage: 'Flowering/Fruit Set', type: 'pest', task: 'Begin IPM — Asian citrus psyllid, scale, mites', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical', notes: 'HLB (citrus greening) spread by ACP — monitor + control vectors.' },
      { day: 100, durationDays: 1, stage: 'Flowering/Fruit Set', type: 'fertilization', task: 'Foliar Zn + Mn + B + Fe at petal fall', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical' },
      { day: 110, durationDays: 2, stage: 'Flowering/Fruit Set', type: 'pruning', task: 'Light summer pruning — water sprouts only', laborDaysPerHa: 1.0, skill: 'trained', priority: 'recommended' },
      { day: 150, durationDays: 1, stage: 'Fruit Sizing', type: 'pest', task: 'Scout for fruit fly + citrus rust mite', laborDaysPerHa: 0.3, skill: 'trained', priority: 'recommended' },
      { day: 180, durationDays: 1, stage: 'Fruit Sizing', type: 'fertilization', task: 'Fertigate N + K during fruit expansion', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical' },
      { day: 280, durationDays: 1, stage: 'Maturation', type: 'monitoring', task: 'Begin maturity testing — Brix + acid ratio + color', laborDaysPerHa: 0.2, skill: 'trained', priority: 'critical' },
      { day: 320, durationDays: 10, stage: 'Maturation', type: 'harvest', task: 'Pick by color + maturity (2–3 passes)', laborDaysPerHa: 6.0, skill: 'trained', priority: 'critical', notes: 'Clip (don\'t pull) — avoids rind oil spotting.' },
      { day: 325, durationDays: 2, stage: 'Maturation', type: 'post_harvest', task: 'Wash + wax + grade + pack', laborDaysPerHa: 4.0, skill: 'trained', priority: 'critical' },
    ],
    notes: 'HLB (citrus greening) is the #1 threat worldwide — vector control + nutrition program can extend tree life.',
  },

  // ========================================================================
  // 15. SORGHUM
  // ========================================================================
  {
    id: 'sorghum',
    name: 'Sorghum (Grain)',
    emoji: '🌾',
    category: 'cereal',
    seasonLength: 110,
    climate: 'Semi-arid to subtropical; 350–600 mm; heat-tolerant',
    stages: [
      { name: 'Establishment', startDay: 1, endDay: 20, kc: 0.30, emoji: '🌱', description: 'Emergence to 5-leaf' },
      { name: 'Vegetative',    startDay: 21, endDay: 55, kc: 0.75, emoji: '🌿', description: 'Stem elongation + flag leaf' },
      { name: 'Boot/Flowering', startDay: 56, endDay: 75, kc: 1.10, emoji: '🌾', description: 'Boot + heading + flowering' },
      { name: 'Grain Fill',    startDay: 76, endDay: 100, kc: 1.05, emoji: '🌾', description: 'Soft dough → hard dough' },
      { name: 'Maturation',    startDay: 101, endDay: 110, kc: 0.50, emoji: '🍂', description: 'Black layer' },
    ],
    fertilization: {
      totals: { n: 130, p: 50, k: 100, s: 20, zn: 400 },
      applications: [
        { day: 0, stage: 'Pre-plant', method: 'broadcast', n: 30, p: 50, k: 80, s: 20, zn: 400, sources: [
          { nutrient: 'P+S', material: 'Single superphosphate (8.8% P, 11% S)', rate: '568 kg/ha' },
          { nutrient: 'K', material: 'Muriate of potash', rate: '133 kg/ha' },
          { nutrient: 'Zn', material: 'Zinc sulfate', rate: '1.1 kg/ha' },
        ], notes: 'Sorghum tolerates low rainfall; starter P critical in cool soils.' },
        { day: 25, stage: 'Vegetative', method: 'side_dress', n: 60, p: 0, k: 20, sources: [
          { nutrient: 'N', material: 'Urea', rate: '130 kg/ha' },
          { nutrient: 'K', material: 'Muriate of potash', rate: '33 kg/ha' },
        ], notes: 'Side-dress at 5–6 leaf. N use efficiency drops after boot stage.' },
        { day: 55, stage: 'Boot', method: 'foliar', n: 40, p: 0, k: 0, sources: [
          { nutrient: 'N', material: 'Urea foliar 2%', rate: '4 kg/ha in 200 L' },
        ], notes: 'Foliar N at boot boosts grain protein. Avoid if plants under drought stress.' },
      ],
    },
    labor: [
      { day: -5, durationDays: 1, stage: 'Pre-plant', type: 'land_prep', task: 'Minimum till + cultivate', laborDaysPerHa: 0.3, skill: 'trained', priority: 'recommended' },
      { day: 1, durationDays: 1, stage: 'Establishment', type: 'planting', task: 'Drill at 3–5 cm depth, 50–75 cm rows', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical', notes: 'Target 150,000–250,000 plants/ha. Soil temp >15°C needed.' },
      { day: 25, durationDays: 1, stage: 'Vegetative', type: 'fertilization', task: 'Side-dress N at 5–6 leaf', laborDaysPerHa: 0.2, skill: 'trained', priority: 'critical' },
      { day: 30, durationDays: 1, stage: 'Vegetative', type: 'weed', task: 'Post-emergent herbicide + cultivation', laborDaysPerHa: 0.3, skill: 'specialist', priority: 'recommended' },
      { day: 60, durationDays: 1, stage: 'Boot/Flowering', type: 'pest', task: 'Scout for sorghum midge + head worms', laborDaysPerHa: 0.2, skill: 'trained', priority: 'critical', notes: 'Midge at flowering can destroy crop in 3 days — spray timing critical.' },
      { day: 100, durationDays: 1, stage: 'Maturation', type: 'monitoring', task: 'Check black layer on grain (~20% moisture)', laborDaysPerHa: 0.1, skill: 'basic', priority: 'critical' },
      { day: 105, durationDays: 1, stage: 'Maturation', type: 'harvest', task: 'Combine at 16–20% moisture; dry to 13%', laborDaysPerHa: 0.4, skill: 'specialist', equipment: 'Combine', priority: 'critical' },
    ],
    notes: 'Sorghum is more drought-tolerant than maize — good rotation option in water-limited environments.',
  },

  // ========================================================================
  // 16. BARLEY
  // ========================================================================
  {
    id: 'barley',
    name: 'Barley',
    emoji: '🌾',
    category: 'cereal',
    seasonLength: 110,
    climate: 'Cool temperate; 300–500 mm; shorter season than wheat',
    stages: [
      { name: 'Emergence',  startDay: 1, endDay: 18, kc: 0.30, emoji: '🌱', description: 'Germination to 3-leaf' },
      { name: 'Tillering',  startDay: 19, endDay: 55, kc: 0.75, emoji: '🌿', description: 'Crown roots + tillers' },
      { name: 'Stem Elongation', startDay: 56, endDay: 80, kc: 1.10, emoji: '🌾', description: 'Nodes + internode elongation' },
      { name: 'Heading/Flowering', startDay: 81, endDay: 95, kc: 1.10, emoji: '🌼', description: 'Ear emergence + anthesis' },
      { name: 'Grain Fill/Maturation', startDay: 96, endDay: 110, kc: 0.40, emoji: '🍂', description: 'Milk → dough → harvest' },
    ],
    fertilization: {
      totals: { n: 130, p: 50, k: 90, s: 20, mn: 400 },
      applications: [
        { day: 0, stage: 'Pre-plant', method: 'broadcast', n: 25, p: 50, k: 90, s: 20, mn: 400, sources: [
          { nutrient: 'P', material: 'DAP', rate: '109 kg/ha' },
          { nutrient: 'K+S', material: 'Potassium sulfate', rate: '188 kg/ha' },
          { nutrient: 'Mn', material: 'Manganese sulfate', rate: '1.1 kg/ha' },
        ], notes: 'Incorporate before drilling. Barley is more S-responsive than wheat.' },
        { day: 25, stage: 'Tillering', method: 'broadcast', n: 55, p: 0, k: 0, sources: [
          { nutrient: 'N', material: 'Urea', rate: '120 kg/ha' },
        ], notes: 'Apply at Zadoks 25. Malting barley needs lower N (110 kg total) for low grain protein.' },
        { day: 60, stage: 'Stem elongation', method: 'broadcast', n: 50, p: 0, k: 0, sources: [
          { nutrient: 'N', material: 'Urea', rate: '109 kg/ha' },
        ], notes: 'Final N at Zadoks 30–32. Avoid late N — increases grain protein (bad for malting).' },
      ],
    },
    labor: [
      { day: -7, durationDays: 1, stage: 'Pre-plant', type: 'land_prep', task: 'Disc + harrow or no-till drill', laborDaysPerHa: 0.3, skill: 'trained', priority: 'recommended' },
      { day: 1, durationDays: 1, stage: 'Emergence', type: 'planting', task: 'Drill at 3–5 cm, 12–15 cm rows', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical' },
      { day: 25, durationDays: 1, stage: 'Tillering', type: 'fertilization', task: 'Top-dress N at Zadoks 25', laborDaysPerHa: 0.2, skill: 'trained', priority: 'critical' },
      { day: 35, durationDays: 1, stage: 'Tillering', type: 'weed', task: 'Post-emergent herbicide (broadleaf)', laborDaysPerHa: 0.2, skill: 'specialist', priority: 'recommended' },
      { day: 60, durationDays: 1, stage: 'Stem elongation', type: 'fertilization', task: 'Top-dress N at Zadoks 30', laborDaysPerHa: 0.2, skill: 'trained', priority: 'critical' },
      { day: 85, durationDays: 1, stage: 'Heading/Flowering', type: 'pest', task: 'Scout for net blotch + scald + aphids', laborDaysPerHa: 0.2, skill: 'trained', priority: 'recommended' },
      { day: 100, durationDays: 1, stage: 'Maturation', type: 'monitoring', task: 'Check grain moisture (~14%)', laborDaysPerHa: 0.1, skill: 'basic', priority: 'critical' },
      { day: 105, durationDays: 1, stage: 'Maturation', type: 'harvest', task: 'Combine at 13–15% moisture', laborDaysPerHa: 0.4, skill: 'specialist', equipment: 'Combine', priority: 'critical' },
    ],
    notes: 'Malting barley: target grain protein 10.5–12.5%. Lower N if protein too high.',
  },

  // ========================================================================
  // 17. CANOLA (RAPESEED)
  // ========================================================================
  {
    id: 'canola',
    name: 'Canola (Rapeseed)',
    emoji: '🌼',
    category: 'industrial',
    seasonLength: 180,
    climate: 'Cool temperate; 450–700 mm; frost-tolerant at rosette stage',
    stages: [
      { name: 'Establishment', startDay: 1, endDay: 30, kc: 0.45, emoji: '🌱', description: 'Emergence to 4-leaf' },
      { name: 'Rosette',       startDay: 31, endDay: 120, kc: 0.85, emoji: '🌿', description: 'Rosette growth + winter vernalization' },
      { name: 'Bolting/Bud',   startDay: 121, endDay: 140, kc: 1.10, emoji: '🌿', description: 'Stem elongation + bud formation' },
      { name: 'Flowering',     startDay: 141, endDay: 165, kc: 1.15, emoji: '🌼', description: 'Yellow bloom — 14–21 day window' },
      { name: 'Pod Fill/Maturation', startDay: 166, endDay: 180, kc: 0.55, emoji: '🍂', description: 'Pod fill + ripening' },
    ],
    fertilization: {
      totals: { n: 160, p: 60, k: 120, s: 35, b: 1000 },
      applications: [
        { day: 0, stage: 'Pre-plant', method: 'broadcast', n: 30, p: 60, k: 120, s: 35, b: 1000, sources: [
          { nutrient: 'P+S', material: 'Single superphosphate (8.8% P, 11% S)', rate: '545 kg/ha' },
          { nutrient: 'K', material: 'Muriate of potash', rate: '200 kg/ha' },
          { nutrient: 'B', material: 'Borax', rate: '9 kg/ha' },
        ], notes: 'Incorporate before planting. Canola has high S demand — deficiency cuts yield + oil %.' },
        { day: 100, stage: 'Late rosette (spring green-up)', method: 'broadcast', n: 70, p: 0, k: 0, sources: [
          { nutrient: 'N', material: 'Urea', rate: '152 kg/ha' },
        ], notes: 'Apply at spring green-up. Split N to avoid leaching losses.' },
        { day: 130, stage: 'Bolting', method: 'broadcast', n: 60, p: 0, k: 0, sources: [
          { nutrient: 'N', material: 'Urea', rate: '130 kg/ha' },
        ], notes: 'Apply at bolting — final N split. Critical for yield + oil content.' },
      ],
    },
    labor: [
      { day: -5, durationDays: 1, stage: 'Pre-plant', type: 'land_prep', task: 'Minimum till + firm seedbed (small seed)', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical' },
      { day: 1, durationDays: 1, stage: 'Establishment', type: 'planting', task: 'Drill at 1.5–2.5 cm depth, 15–20 cm rows', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical', notes: 'Small seed — don\'t plant too deep. Target 70–100 plants/m².' },
      { day: 100, durationDays: 1, stage: 'Rosette', type: 'fertilization', task: 'Spring N top-dress at green-up', laborDaysPerHa: 0.2, skill: 'trained', priority: 'critical' },
      { day: 130, durationDays: 1, stage: 'Bolting/Bud', type: 'fertilization', task: 'Final N top-dress at bolting', laborDaysPerHa: 0.2, skill: 'trained', priority: 'critical' },
      { day: 145, durationDays: 1, stage: 'Flowering', type: 'pest', task: 'Scout for sclerotinia + flea beetle + pollen beetle', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical', notes: 'Sclerotinia fungicide at 20–30% bloom if wet conditions.' },
      { day: 170, durationDays: 1, stage: 'Pod Fill', type: 'monitoring', task: 'Check seed color change (~30–40% for swathing)', laborDaysPerHa: 0.2, skill: 'trained', priority: 'critical' },
      { day: 175, durationDays: 1, stage: 'Maturation', type: 'harvest', task: 'Direct cut at 35–40% seed moisture (or swath + dry)', laborDaysPerHa: 0.4, skill: 'specialist', equipment: 'Combine', priority: 'critical' },
    ],
    notes: 'S deficiency cuts yield 30%+. B deficiency reduces flowering. Canola is a good break crop for cereals.',
  },

  // ========================================================================
  // 18. BELL PEPPER
  // ========================================================================
  {
    id: 'bell-pepper',
    name: 'Bell Pepper',
    emoji: '🫑',
    category: 'vegetable',
    seasonLength: 130,
    climate: 'Warm temperate; 18–27°C; frost-sensitive',
    stages: [
      { name: 'Establishment', startDay: 1, endDay: 20, kc: 0.60, emoji: '🌱', description: 'Transplant recovery to first flower' },
      { name: 'Vegetative',    startDay: 21, endDay: 50, kc: 0.85, emoji: '🌿', description: 'Canopy + early flower set' },
      { name: 'Flowering/Fruit Set', startDay: 51, endDay: 80, kc: 1.05, emoji: '🌼', description: 'Continuous flowering + fruit set' },
      { name: 'Fruit Fill',    startDay: 81, endDay: 120, kc: 1.10, emoji: '🫑', description: 'Multiple fruit sizing + color break' },
      { name: 'Harvest',       startDay: 121, endDay: 130, kc: 0.85, emoji: '🧺', description: 'Multiple hand-picks' },
    ],
    fertilization: {
      totals: { n: 200, p: 70, k: 230, ca: 80, mg: 30, s: 25, b: 500 },
      applications: [
        { day: -5, stage: 'Pre-plant', method: 'broadcast', n: 50, p: 70, k: 100, ca: 80, mg: 30, s: 25, sources: [
          { nutrient: 'P', material: 'DAP', rate: '152 kg/ha' },
          { nutrient: 'K+S', material: 'Potassium sulfate', rate: '200 kg/ha' },
          { nutrient: 'Ca+Mg', material: 'Dolomite', rate: '533 kg/ha' },
        ], notes: 'Incorporate into raised beds. Ca critical for fruit quality + Blossom-End Rot.' },
        { day: 15, stage: 'Establishment', method: 'fertigation', n: 30, p: 0, k: 30, sources: [
          { nutrient: 'N', material: 'Calcium nitrate fertigated', rate: '95 kg/ha' },
          { nutrient: 'K', material: 'Potassium nitrate', rate: '32 kg/ha' },
        ], notes: 'Begin fertigation at first new growth.' },
        { day: 40, stage: 'Vegetative', method: 'fertigation', n: 50, p: 0, k: 60, sources: [
          { nutrient: 'N+K', material: 'Calcium nitrate + potassium nitrate', rate: '95 + 65 kg/ha split weekly' },
        ], notes: 'Continuous low-dose N + K via drip.' },
        { day: 70, stage: 'Flowering/Fruit Set', method: 'fertigation', n: 40, p: 0, k: 80, b: 500, sources: [
          { nutrient: 'N', material: 'Urea fertigated', rate: '43 kg/ha' },
          { nutrient: 'K', material: 'Potassium nitrate', rate: '87 kg/ha' },
          { nutrient: 'B', material: 'Solubor foliar', rate: '2.5 kg/ha' },
        ], notes: 'B foliar at flowering improves fruit set. K demand peaks during fruit fill.' },
        { day: 100, stage: 'Fruit Fill', method: 'fertigation', n: 30, p: 0, k: 60, sources: [
          { nutrient: 'N+K', material: 'Calcium nitrate + potassium nitrate', rate: '95 + 65 kg/ha' },
        ], notes: 'Maintain Ca supply through harvest to prevent BER.' },
      ],
    },
    labor: [
      { day: -10, durationDays: 2, stage: 'Pre-plant', type: 'land_prep', task: 'Plow + form raised beds (15 cm) with drip + mulch', laborDaysPerHa: 1.5, skill: 'trained', priority: 'critical' },
      { day: 1, durationDays: 2, stage: 'Establishment', type: 'planting', task: 'Transplant at 50×75 cm, 2 rows per bed', laborDaysPerHa: 5.0, skill: 'trained', priority: 'critical' },
      { day: 20, durationDays: 2, stage: 'Establishment', type: 'pruning', task: 'Stake + trellis (peppers need support when loaded)', laborDaysPerHa: 3.0, skill: 'trained', priority: 'recommended' },
      { day: 30, durationDays: 1, stage: 'Vegetative', type: 'weed', task: 'Cultivate + hand-weed', laborDaysPerHa: 1.0, skill: 'basic', priority: 'recommended' },
      { day: 60, durationDays: 1, stage: 'Flowering/Fruit Set', type: 'pest', task: 'Begin scouting: aphids, thrips, pepper weevil, bacterial spot', laborDaysPerHa: 0.5, skill: 'trained', priority: 'critical' },
      { day: 121, durationDays: 5, stage: 'Harvest', type: 'harvest', task: 'Hand-pick green or color-break (3–5 picks)', laborDaysPerHa: 12.0, skill: 'trained', priority: 'critical', notes: 'Most labor-intensive. Color peppers need 7–10 more days on plant.' },
      { day: 125, durationDays: 1, stage: 'Harvest', type: 'post_harvest', task: 'Pre-cool + grade + pack', laborDaysPerHa: 3.0, skill: 'trained', priority: 'critical' },
    ],
    notes: 'Blossom-End Rot is the #1 quality issue — Ca + consistent moisture essential. Drip fertigation increases NUE 30%.',
  },

  // ========================================================================
  // 19. CUCUMBER
  // ========================================================================
  {
    id: 'cucumber',
    name: 'Cucumber (Fresh Market)',
    emoji: '🥒',
    category: 'vegetable',
    seasonLength: 75,
    climate: 'Warm temperate; 18–30°C; frost-sensitive',
    stages: [
      { name: 'Establishment', startDay: 1, endDay: 12, kc: 0.50, emoji: '🌱', description: 'Emergence to 2-true-leaf' },
      { name: 'Vegetative',    startDay: 13, endDay: 35, kc: 0.85, emoji: '🌿', description: 'Vine growth + first flowers' },
      { name: 'Flowering/Fruit Set', startDay: 36, endDay: 50, kc: 1.00, emoji: '🌼', description: 'Continuous flowering + early fruit' },
      { name: 'Harvest',       startDay: 51, endDay: 75, kc: 1.00, emoji: '🥒', description: 'Continuous harvest (every 1–2 days)' },
    ],
    fertilization: {
      totals: { n: 160, p: 60, k: 200, ca: 60, mg: 25, s: 20 },
      applications: [
        { day: -5, stage: 'Pre-plant', method: 'broadcast', n: 40, p: 60, k: 80, ca: 60, mg: 25, s: 20, sources: [
          { nutrient: 'P', material: 'DAP', rate: '130 kg/ha' },
          { nutrient: 'K+S', material: 'Potassium sulfate', rate: '160 kg/ha' },
          { nutrient: 'Ca+Mg', material: 'Dolomite', rate: '400 kg/ha' },
        ], notes: 'Incorporate before bed formation. Cucumbers are sensitive to high salts — don\'t over-apply at planting.' },
        { day: 15, stage: 'Establishment', method: 'fertigation', n: 30, p: 0, k: 40, sources: [
          { nutrient: 'N+K', material: 'Calcium nitrate + potassium nitrate fertigated', rate: '95 + 43 kg/ha' },
        ], notes: 'Begin fertigation at 2-true-leaf.' },
        { day: 35, stage: 'Vegetative', method: 'fertigation', n: 50, p: 0, k: 80, sources: [
          { nutrient: 'N', material: 'Urea fertigated', rate: '54 kg/ha' },
          { nutrient: 'K', material: 'Potassium nitrate', rate: '87 kg/ha' },
        ], notes: 'K demand peaks during early fruit set.' },
        { day: 55, stage: 'Harvest', method: 'fertigation', n: 40, p: 0, k: 0, sources: [
          { nutrient: 'N', material: 'Calcium nitrate fertigated', rate: '86 kg/ha' },
        ], notes: 'Maintain N through harvest for continuous fruit set.' },
      ],
    },
    labor: [
      { day: -7, durationDays: 2, stage: 'Pre-plant', type: 'land_prep', task: 'Plow + form raised beds + install drip + mulch', laborDaysPerHa: 1.5, skill: 'trained', priority: 'critical' },
      { day: 1, durationDays: 1, stage: 'Establishment', type: 'planting', task: 'Direct seed at 2–3 cm depth OR transplant', laborDaysPerHa: 2.0, skill: 'trained', priority: 'critical', notes: 'Direct seed at 60×30 cm. Soil temp >16°C required.' },
      { day: 15, durationDays: 2, stage: 'Establishment', type: 'pruning', task: 'Trellis (vertical strings) + train vines', laborDaysPerHa: 3.0, skill: 'trained', priority: 'recommended' },
      { day: 25, durationDays: 1, stage: 'Vegetative', type: 'pruning', task: 'Prune laterals below 5th node', laborDaysPerHa: 1.0, skill: 'trained', priority: 'recommended' },
      { day: 35, durationDays: 1, stage: 'Flowering/Fruit Set', type: 'pest', task: 'Begin scouting: powdery mildew, cucumber beetle, aphids', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical' },
      { day: 50, durationDays: 1, stage: 'Harvest', type: 'monitoring', task: 'Begin checking fruit size (every 1–2 days)', laborDaysPerHa: 0.5, skill: 'basic', priority: 'critical' },
      { day: 51, durationDays: 25, stage: 'Harvest', type: 'harvest', task: 'Pick every 1–2 days (missed fruit = bitter + stops new set)', laborDaysPerHa: 6.0, skill: 'trained', priority: 'critical', notes: 'Continuous harvest is essential — old fruit suppresses new fruit set.' },
    ],
    notes: 'Powdery mildew is #1 disease — resistant varieties + drip irrigation (not overhead) reduce pressure.',
  },

  // ========================================================================
  // 20. GRAPES (WINE)
  // ========================================================================
  {
    id: 'grapes',
    name: 'Grapes (Wine)',
    emoji: '🍇',
    category: 'orchard',
    seasonLength: 220,
    climate: 'Temperate; 1500–2500 GDD; dry summer ideal for quality',
    stages: [
      { name: 'Dormancy/Bud Break', startDay: 1, endDay: 30, kc: 0.40, emoji: '💤', description: 'Winter dormancy → bud swell → green tip' },
      { name: 'Vegetative', startDay: 31, endDay: 80, kc: 0.70, emoji: '🌿', description: 'Shoot growth + leaf development' },
      { name: 'Bloom/Fruit Set', startDay: 81, endDay: 110, kc: 0.80, emoji: '🌼', description: 'Flowering + berry set' },
      { name: 'Berry Development', startDay: 111, endDay: 180, kc: 0.85, emoji: '🍇', description: 'Veraison → sugar accumulation' },
      { name: 'Maturation/Harvest', startDay: 181, endDay: 220, kc: 0.65, emoji: '🧺', description: 'Color + flavor + tannin development' },
    ],
    fertilization: {
      totals: { n: 60, p: 30, k: 100, ca: 50, mg: 20, s: 15, b: 500, zn: 500 },
      applications: [
        { day: 15, stage: 'Bud break', method: 'band', n: 20, p: 30, k: 40, ca: 50, sources: [
          { nutrient: 'N+P+K', material: 'NPK 10-15-20', rate: '200 kg/ha' },
          { nutrient: 'Ca', material: 'Calcium nitrate', rate: '167 kg/ha' },
        ], notes: 'Apply at bud break. Wine grapes need low N for quality — excessive N reduces color + tannin.' },
        { day: 60, stage: 'Vegetative', method: 'foliar', n: 0, p: 0, k: 0, b: 500, zn: 500, sources: [
          { nutrient: 'B+Zn', material: 'Foliar mix', rate: '2 kg/ha in 500 L' },
        ], notes: 'B + Zn foliar at pre-bloom improves fruit set.' },
        { day: 130, stage: 'Veraison', method: 'foliar', n: 0, p: 0, k: 30, sources: [
          { nutrient: 'K', material: 'Potassium nitrate foliar 1%', rate: '3 kg/ha in 300 L' },
        ], notes: 'Foliar K at veraison improves color + Brix. Stop N by veraison.' },
      ],
    },
    labor: [
      { day: 10, durationDays: 15, stage: 'Dormancy/Bud Break', type: 'pruning', task: 'Winter pruning — spur or cane, 20–30 buds/vine', laborDaysPerHa: 8.0, skill: 'specialist', priority: 'critical', notes: 'Most critical annual operation. Determines crop load + canopy.' },
      { day: 30, durationDays: 5, stage: 'Bud Break', type: 'pruning', task: 'Suckering + shoot thinning to target shoot density', laborDaysPerHa: 3.0, skill: 'trained', priority: 'critical' },
      { day: 50, durationDays: 1, stage: 'Vegetative', type: 'fertilization', task: 'Apply NPK + Ca under vine row', laborDaysPerHa: 0.3, skill: 'trained', priority: 'recommended' },
      { day: 60, durationDays: 10, stage: 'Vegetative', type: 'pruning', task: 'Shoot positioning + leaf removal (cluster zone)', laborDaysPerHa: 4.0, skill: 'trained', priority: 'recommended', notes: 'Leaf removal improves air flow + reduces disease pressure.' },
      { day: 75, durationDays: 1, stage: 'Vegetative', type: 'pest', task: 'Begin IPM — powdery mildew, botrytis, mites, leafhoppers', laborDaysPerHa: 0.3, skill: 'trained', priority: 'critical', notes: 'Powdery mildew program from bud break to veraison.' },
      { day: 90, durationDays: 2, stage: 'Bloom/Fruit Set', type: 'pruning', task: 'Crop thinning if over-cropped (target 6–8 t/ha for quality)', laborDaysPerHa: 2.0, skill: 'specialist', priority: 'recommended' },
      { day: 120, durationDays: 1, stage: 'Berry Development', type: 'fertilization', task: 'Foliar K at veraison (skip N)', laborDaysPerHa: 0.3, skill: 'trained', priority: 'recommended' },
      { day: 180, durationDays: 2, stage: 'Maturation', type: 'monitoring', task: 'Begin maturity testing — Brix, pH, TA (weekly)', laborDaysPerHa: 0.5, skill: 'trained', priority: 'critical' },
      { day: 200, durationDays: 3, stage: 'Maturation', type: 'harvest', task: 'Hand-pick at target maturity (Brix 22–25 for reds, 20–23 for whites)', laborDaysPerHa: 6.0, skill: 'trained', priority: 'critical', notes: 'Pick at night or early morning to keep fruit cool.' },
      { day: 202, durationDays: 2, stage: 'Maturation', type: 'post_harvest', task: 'Crush + destem + ferment (winery)', laborDaysPerHa: 5.0, skill: 'specialist', priority: 'critical' },
    ],
    notes: 'Wine grape quality = low N + controlled water stress + balanced crop load. Excessive irrigation + N reduce quality.',
  },
];

// ============================================================================
// Lookup helpers
// ============================================================================

export function getCropLifecycle(id: string): CropLifecycle | undefined {
  return CROP_LIFECYCLES.find(c => c.id === id);
}

export function getCropsByCategory(category: CropCategory): CropLifecycle[] {
  return CROP_LIFECYCLES.filter(c => c.category === category);
}

/** Find the lifecycle stage active on a given day-of-season. */
export function stageForDay(crop: CropLifecycle, day: number): LifecycleStage | null {
  return crop.stages.find(s => day >= s.startDay && day <= s.endDay) ?? null;
}

/** Total person-days/ha for the entire season. */
export function totalLaborDays(crop: CropLifecycle): number {
  return crop.labor.reduce((sum, op) => sum + op.laborDaysPerHa, 0);
}

/** Total seasonal N (kg/ha) from the fertilization plan. */
export function totalN(crop: CropLifecycle): number {
  return crop.fertilization.applications.reduce((sum, a) => sum + a.n, 0);
}

/** Peak labor month — month with highest labor demand. */
export function peakLaborWeek(crop: CropLifecycle): { week: number; laborDays: number } {
  // Group by week (7-day buckets)
  const weeks: Record<number, number> = {};
  for (const op of crop.labor) {
    const week = Math.floor(op.day / 7) + 1;
    weeks[week] = (weeks[week] || 0) + op.laborDaysPerHa;
  }
  let peak = { week: 1, laborDays: 0 };
  for (const [week, days] of Object.entries(weeks)) {
    if (days > peak.laborDays) peak = { week: parseInt(week), laborDays: days };
  }
  return peak;
}

/** NPK totals from the applications array (verifies sum matches declared totals). */
export function npkTotalsFromApplications(crop: CropLifecycle): { n: number; p: number; k: number } {
  return crop.fertilization.applications.reduce((acc, a) => ({
    n: acc.n + a.n,
    p: acc.p + a.p,
    k: acc.k + a.k,
  }), { n: 0, p: 0, k: 0 });
}
