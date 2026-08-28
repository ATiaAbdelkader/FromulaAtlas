/**
 * NutriPlant PRO — Crop-specific presets for 4 free tools
 *
 * Each crop entry bundles defaults for:
 *   - Hydroponic Solution Designer   (meq/L targets, Steiner/Hoagland/Resh style)
 *   - Nutrient Distribution by Stage  (kg/ha totals + 5-stage % splits)
 *   - Irrigation Balance              (FAO-56 four-stage Kc + days)
 *   - Amendment Balance by CEC        (target base-saturation % of Ca/Mg/K)
 *
 * Values are research-backed approximations rounded for usability. Sources:
 *   - FAO-56 (Allen et al., 1998) Annex 12 Kc table
 *   - Steiner (1961, 1984) universal nutrient solution; Hoagland & Arnon (1950)
 *   - Resh, H.M. (2013) Hydroponic Food Production
 *   - University extension service recommendations (UC Davis, UF IFAS, NC State, etc.)
 *   - Fertilizers Europe / IFA crop-specific recommendation documents
 */

export interface CropPreset {
  id: string;          // 'tomato', 'strawberry', etc.
  name: string;        // 'Tomato'
  emoji: string;       // '🍅' (for quick visual ID in dropdown)
  category: 'fruit' | 'vegetable' | 'berry' | 'cereal' | 'industrial';

  /** Hydroponic Solution Designer — meq/L targets for the 8 core nutrients. */
  hydroSolution: {
    N_NO3: number;
    N_NH4: number;
    P: number;
    S: number;
    K: number;
    Ca: number;
    Mg: number;
    Cl: number;
    notes: string;
  };

  /** Nutrient Distribution by Stage — kg/ha totals + 5-stage % splits. */
  nutrientDistribution: {
    totals: {
      n: number; p: number; k: number; ca: number; mg: number;
      s?: number; fe?: number; mn?: number; b?: number; zn?: number;
    };
    stages: string[];
    pct: Record<string, number[]>;
    notes: string;
  };

  /** Irrigation Balance — FAO-56 four-stage Kc values. */
  irrigation: {
    stages: { name: string; kc: number; days: number }[];
    notes: string;
  };

  /** Amendment Balance by CEC — ideal target base-saturation %. */
  amendment: {
    targetPct: { k: number; ca: number; mg: number; };
    notes: string;
  };
}

export const CROP_PRESETS: CropPreset[] = [
  // ===========================================================================
  // 1. TOMATO
  // ===========================================================================
  {
    id: 'tomato',
    name: 'Tomato',
    emoji: '🍅',
    category: 'fruit',
    hydroSolution: {
      N_NO3: 12, N_NH4: 1, P: 2, S: 3, K: 7, Ca: 9, Mg: 3, Cl: 0,
      notes:
        'Steiner-style target for greenhouse tomato (indeterminate). ' +
        'Slightly lower Ca than pure Steiner to keep fruit firmness; raise K during ripening (K:Ca 1:1 → 1.3:1).',
    },
    nutrientDistribution: {
      totals: { n: 200, p: 50, k: 280, ca: 120, mg: 35, s: 25, fe: 3, b: 0.5 },
      stages: ['Establishment', 'Vegetative', 'Flowering', 'Filling', 'Maturation'],
      pct: {
        n:  [5, 25, 25, 35, 10],
        p:  [10, 20, 30, 25, 15],
        k:  [5, 20, 25, 35, 15],
        ca: [10, 25, 25, 30, 10],
        mg: [10, 25, 25, 25, 15],
        s:  [10, 25, 25, 25, 15],
        fe: [10, 25, 25, 25, 15],
        b:  [10, 25, 25, 25, 15],
      },
      notes:
        'Heavy feeder; K demand peaks during fruit fill. Split N as 25% at transplant, 50% during vegetative + flowering, 25% during fill. Watch blossom-end rot → maintain Ca uptake.',
    },
    irrigation: {
      stages: [
        { name: 'Initial',      kc: 0.6,  days: 30 },
        { name: 'Development',  kc: 0.85, days: 40 },
        { name: 'Mid',          kc: 1.15, days: 50 },
        { name: 'Late',         kc: 0.8,  days: 30 },
      ],
      notes:
        'FAO-56 Table 12 (fresh-market tomato, indeterminate). ' +
        'Total cycle ~150 days. Kc_mid reaches 1.15 under full canopy with frequent drip irrigation.',
    },
    amendment: {
      targetPct: { k: 5,  ca: 68, mg: 15 },
      notes:
        'Ideal base saturation for tomato: Ca 65–70%, Mg 12–18%, K 3–8%. ' +
        'Maintain Ca:Mg ratio ~4:1 to limit blossom-end rot. Slightly acid pH (6.0–6.5) preferred.',
    },
  },

  // ===========================================================================
  // 2. STRAWBERRY
  // ===========================================================================
  {
    id: 'strawberry',
    name: 'Strawberry',
    emoji: '🍓',
    category: 'berry',
    hydroSolution: {
      N_NO3: 9, N_NH4: 0.5, P: 1.5, S: 2.5, K: 5, Ca: 5.5, Mg: 2, Cl: 0,
      notes:
        'Lower EC (1.0–1.4 dS/m) and lower K than tomato to avoid excessive vigor and soft fruit. ' +
        'Small NH₄⁺ fraction (~5%) keeps rhizosphere pH in the 5.8–6.2 optimum. Strictly chloride-free.',
    },
    nutrientDistribution: {
      totals: { n: 120, p: 35, k: 180, ca: 90, mg: 25, s: 20, fe: 2.5, b: 0.6 },
      stages: ['Establishment', 'Vegetative', 'Flowering', 'Filling', 'Maturation'],
      pct: {
        n:  [10, 25, 25, 30, 10],
        p:  [15, 25, 25, 20, 15],
        k:  [5,  20, 25, 35, 15],
        ca: [10, 25, 25, 30, 10],
        mg: [10, 25, 25, 30, 10],
        s:  [10, 25, 25, 25, 15],
        fe: [10, 25, 30, 25, 10],
        b:  [10, 25, 25, 25, 15],
      },
      notes:
        'Strawberry is sensitive to high EC and to chloride. B demand is above-average (deficiency → distorted fruit). ' +
        'Use split fertigation through drip; avoid K excess during fruit set to prevent uneven ripening.',
    },
    irrigation: {
      stages: [
        { name: 'Initial',     kc: 0.4,  days: 20 },
        { name: 'Development', kc: 0.7,  days: 40 },
        { name: 'Mid',         kc: 0.85, days: 60 },
        { name: 'Late',        kc: 0.7,  days: 30 },
      ],
      notes:
        'FAO-56 Table 12 (strawberry). Drip irrigation under plastic mulch; ' +
        'evaporation minimized so Kc values are lower than other vegetables.',
    },
    amendment: {
      targetPct: { k: 6,  ca: 60, mg: 18 },
      notes:
        'Strawberry tolerates slightly acid soils (pH 5.8–6.5). Keep Ca below 65% to leave room for K and Mg uptake; ' +
        'organic matter >3% strongly improves yield and fruit quality.',
    },
  },

  // ===========================================================================
  // 3. AVOCADO
  // ===========================================================================
  {
    id: 'avocado',
    name: 'Avocado',
    emoji: '🥑',
    category: 'fruit',
    hydroSolution: {
      N_NO3: 8, N_NH4: 0, P: 1.5, S: 2.5, K: 5, Ca: 7, Mg: 3, Cl: 0,
      notes:
        'Avocado is extremely chloride-sensitive (<2 meq/L Cl in solution). ' +
        'High Ca proportion supports root health against Phytophthora cinnamomi. ' +
        'EC kept low (1.0–1.5 dS/m) — avocado roots are shallow and salt-sensitive.',
    },
    nutrientDistribution: {
      totals: { n: 140, p: 25, k: 200, ca: 100, mg: 30, s: 25, fe: 3, zn: 1 },
      stages: ['Vegetative flush', 'Flowering', 'Fruit set', 'Fruit fill', 'Maturation'],
      pct: {
        n:  [15, 20, 25, 30, 10],
        p:  [10, 25, 30, 25, 10],
        k:  [10, 15, 20, 40, 15],
        ca: [15, 20, 25, 30, 10],
        mg: [15, 20, 25, 25, 15],
        s:  [15, 20, 25, 25, 15],
        fe: [15, 25, 25, 25, 10],
        zn: [15, 25, 25, 25, 10],
      },
      notes:
        'Perennial tree; N and K split over multiple flushes. Zn is critical (deficiency → "little-leaf" rosette). ' +
        'Avoid chloride and sodium inputs. Acid-forming N sources (urea, ammonium sulfate) preferred on calcareous soils.',
    },
    irrigation: {
      stages: [
        { name: 'Initial',     kc: 0.5,  days: 30 },
        { name: 'Development', kc: 0.8,  days: 60 },
        { name: 'Mid',         kc: 0.85, days: 120 },
        { name: 'Late',        kc: 0.7,  days: 60 },
      ],
      notes:
        'FAO-56 (avocado, Hass). Cycle spans 8–12 months from flowering to harvest. ' +
        'Critical water-stress windows: flowering and fruit set. Drip or micro-sprinkler recommended.',
    },
    amendment: {
      targetPct: { k: 5,  ca: 70, mg: 15 },
      notes:
        'High Ca saturation (≥65%) suppresses Phytophthora root rot. ' +
        'On acidic soils use gypsum rather than lime to avoid raising pH above 6.5 (Hass is sensitive to high pH and Fe chlorosis).',
    },
  },

  // ===========================================================================
  // 4. BLUEBERRY
  // ===========================================================================
  {
    id: 'blueberry',
    name: 'Blueberry',
    emoji: '🫐',
    category: 'berry',
    hydroSolution: {
      N_NO3: 5, N_NH4: 2, P: 1.2, S: 3, K: 3, Ca: 2.5, Mg: 1.5, Cl: 0,
      notes:
        'Acid-loving plant; target solution pH 4.5–5.5. Ammonium (NH₄⁺) dominates N supply ' +
        'because blueberry absorbs NH₄⁺ preferentially and it acidifies the rhizosphere. Keep Ca and bicarbonate low.',
    },
    nutrientDistribution: {
      totals: { n: 90, p: 25, k: 110, ca: 50, mg: 18, s: 18, fe: 2, zn: 0.5 },
      stages: ['Bud break', 'Bloom', 'Fruit set', 'Filling', 'Maturation'],
      pct: {
        n:  [10, 25, 25, 30, 10],
        p:  [15, 25, 25, 20, 15],
        k:  [5,  20, 25, 35, 15],
        ca: [10, 25, 25, 30, 10],
        mg: [10, 25, 25, 25, 15],
        s:  [10, 25, 25, 25, 15],
        fe: [15, 25, 25, 25, 10],
        zn: [15, 25, 25, 25, 10],
      },
      notes:
        'Use ammonium sulfate as primary N source (acidifies soil + supplies S). ' +
        'Avoid nitrate and chloride sources. Mulch with pine bark to maintain pH 4.5–5.5 and soil moisture.',
    },
    irrigation: {
      stages: [
        { name: 'Initial',     kc: 0.4,  days: 30 },
        { name: 'Development', kc: 0.7,  days: 45 },
        { name: 'Mid',         kc: 0.85, days: 60 },
        { name: 'Late',        kc: 0.7,  days: 30 },
      ],
      notes:
        'FAO-56 (highbush blueberry, shrub class). Shallow root system (<40 cm) → frequent light irrigations. ' +
        'Acidic water (pH 5.0–5.5) is critical; alkaline water requires acid injection.',
    },
    amendment: {
      targetPct: { k: 5,  ca: 50, mg: 15 },
      notes:
        'Lower Ca target than most crops because blueberry prefers acid soils (pH 4.5–5.5) ' +
        'where naturally less Ca saturates the exchange complex. Use elemental S to lower pH; ' +
        'do NOT apply dolomitic lime — instead use gypsum if Ca is needed without pH change.',
    },
  },

  // ===========================================================================
  // 5. LETTUCE
  // ===========================================================================
  {
    id: 'lettuce',
    name: 'Lettuce',
    emoji: '🥬',
    category: 'vegetable',
    hydroSolution: {
      N_NO3: 12, N_NH4: 0, P: 1.5, S: 2, K: 6, Ca: 5, Mg: 1.5, Cl: 0,
      notes:
        'Hoagland-style solution at 50–75% strength. High N drives leaf expansion; ' +
        'avoid NH₄⁺ (>2 meq/L causes tipburn). Ca is critical for tipburn prevention — maintain ≥4 meq/L Ca.',
    },
    nutrientDistribution: {
      totals: { n: 130, p: 35, k: 180, ca: 60, mg: 20, s: 15, fe: 2, mn: 0.5 },
      stages: ['Establishment', 'Vegetative', 'Pre-heading', 'Heading', 'Maturation'],
      pct: {
        n:  [10, 30, 25, 25, 10],
        p:  [15, 30, 25, 20, 10],
        k:  [10, 25, 25, 30, 10],
        ca: [10, 25, 25, 30, 10],
        mg: [10, 25, 25, 25, 15],
        s:  [10, 25, 25, 25, 15],
        fe: [15, 30, 25, 20, 10],
        mn: [15, 30, 25, 20, 10],
      },
      notes:
        'Short-cycle crop (50–75 days). Most N and K absorbed in the last 30 days (rapid head expansion). ' +
        'Tipburn is a Ca transport failure → maintain transpiration (low VPD at night, airflow) rather than just adding Ca.',
    },
    irrigation: {
      stages: [
        { name: 'Initial',     kc: 0.4,  days: 10 },
        { name: 'Development', kc: 0.7,  days: 20 },
        { name: 'Mid',         kc: 1.0,  days: 25 },
        { name: 'Late',        kc: 0.9,  days: 10 },
      ],
      notes:
        'FAO-56 Table 12 (lettuce). Short cycle ~65 days. ' +
        'Frequent light irrigations near harvest to keep turgor and avoid bitterness; reduce 5–7 days pre-harvest for firmness.',
    },
    amendment: {
      targetPct: { k: 5,  ca: 65, mg: 15 },
      notes:
        'Standard vegetable base saturation. Maintain pH 6.0–6.8 for Mo availability (Mo deficiency mimics N deficiency in lettuce). ' +
        'Watch Mn excess in acid soils — lettuce is Mn-sensitive.',
    },
  },

  // ===========================================================================
  // 6. BELL PEPPER
  // ===========================================================================
  {
    id: 'bell-pepper',
    name: 'Bell pepper',
    emoji: '🫑',
    category: 'vegetable',
    hydroSolution: {
      N_NO3: 11, N_NH4: 1, P: 1.8, S: 3, K: 6, Ca: 8, Mg: 3, Cl: 0,
      notes:
        'Similar to tomato but slightly lower K (pepper has a less vigorous fruit load). ' +
        'Higher Ca than tomato to prevent blossom-end rot on pepper fruit. EC target 2.0–2.5 dS/m during fruiting.',
    },
    nutrientDistribution: {
      totals: { n: 180, p: 45, k: 220, ca: 100, mg: 30, s: 22, fe: 2.5, b: 0.4 },
      stages: ['Establishment', 'Vegetative', 'Flowering', 'Fruit set', 'Maturation'],
      pct: {
        n:  [5, 25, 25, 35, 10],
        p:  [10, 25, 25, 25, 15],
        k:  [5, 20, 25, 35, 15],
        ca: [10, 25, 25, 30, 10],
        mg: [10, 25, 25, 25, 15],
        s:  [10, 25, 25, 25, 15],
        fe: [10, 25, 25, 30, 10],
        b:  [10, 25, 25, 25, 15],
      },
      notes:
        'Continuous flowering + fruiting habit → steady K and Ca supply through drip. ' +
        'Peppers are Ca-demanding for fruit wall integrity; ensure adequate transpiration to move Ca into fruit.',
    },
    irrigation: {
      stages: [
        { name: 'Initial',     kc: 0.6,  days: 30 },
        { name: 'Development', kc: 0.85, days: 35 },
        { name: 'Mid',         kc: 1.05, days: 40 },
        { name: 'Late',        kc: 0.85, days: 30 },
      ],
      notes:
        'FAO-56 Table 12 (bell pepper). Cycle ~135 days. ' +
        'Sensitive to water stress at flowering (drops flowers). Mulch + drip recommended.',
    },
    amendment: {
      targetPct: { k: 5,  ca: 65, mg: 15 },
      notes:
        'Standard vegetable target. Like tomato, maintain Ca:Mg ~4:1 to limit blossom-end rot. ' +
        'pH 6.0–6.8. Pepper roots are sensitive to compaction — keep bulk density <1.3 g/cm³.',
    },
  },

  // ===========================================================================
  // 7. CUCUMBER
  // ===========================================================================
  {
    id: 'cucumber',
    name: 'Cucumber',
    emoji: '🥒',
    category: 'vegetable',
    hydroSolution: {
      N_NO3: 13, N_NH4: 1, P: 2, S: 3, K: 8, Ca: 9, Mg: 3, Cl: 0,
      notes:
        'High K + high Ca solution for vigorous fruiting. EC 2.0–2.5 dS/m during peak production. ' +
        'Small NH₄⁺ fraction to control vigor and avoid misshapen fruit. Maintain Ca ≥7 meq/L to prevent fruit softening.',
    },
    nutrientDistribution: {
      totals: { n: 180, p: 45, k: 250, ca: 110, mg: 30, s: 22, fe: 2.5 },
      stages: ['Establishment', 'Vegetative', 'Flowering', 'Fruit set', 'Maturation'],
      pct: {
        n:  [5, 25, 25, 35, 10],
        p:  [10, 25, 25, 25, 15],
        k:  [5, 20, 25, 35, 15],
        ca: [10, 25, 25, 30, 10],
        mg: [10, 25, 25, 25, 15],
        s:  [10, 25, 25, 25, 15],
        fe: [10, 25, 25, 30, 10],
      },
      notes:
        'Continuous fruiting — K and Ca demand stays high for 8–10 weeks. ' +
        'Cucumber extracts ~3.5 kg K per tonne of fruit harvested. Maintain Fe availability (pH 5.5–6.0 hydro, 6.0–6.8 soil).',
    },
    irrigation: {
      stages: [
        { name: 'Initial',     kc: 0.6,  days: 25 },
        { name: 'Development', kc: 0.85, days: 35 },
        { name: 'Mid',         kc: 1.0,  days: 40 },
        { name: 'Late',        kc: 0.85, days: 20 },
      ],
      notes:
        'FAO-56 Table 12 (cucumber, fresh market). Cycle ~120 days. ' +
        'Cucumber has high transpiration — daily irrigation during peak production may exceed 6 mm/day.',
    },
    amendment: {
      targetPct: { k: 5,  ca: 65, mg: 15 },
      notes:
        'Standard vegetable target. Cucumber prefers slightly acid soils (pH 6.0–6.8) for micronutrient availability. ' +
        'Watch Mg under high-K fertigation — K:Mg antagonism is the most common deficiency.',
    },
  },

  // ===========================================================================
  // 8. CITRUS (ORANGE)
  // ===========================================================================
  {
    id: 'citrus',
    name: 'Citrus (orange)',
    emoji: '🍊',
    category: 'fruit',
    hydroSolution: {
      N_NO3: 8, N_NH4: 0.5, P: 1.2, S: 2, K: 5, Ca: 6, Mg: 2, Cl: 0,
      notes:
        'Citrus is chloride-sensitive (Cl <2 meq/L in solution). ' +
        'Lower K and Ca than vegetables to match the modest uptake of an evergreen tree. ' +
        'Use a small NH₄⁺ fraction (5%) to maintain slightly acid rhizosphere (pH 6.0–6.5).',
    },
    nutrientDistribution: {
      totals: { n: 150, p: 30, k: 200, ca: 110, mg: 30, s: 25, fe: 3, zn: 1 },
      stages: ['Bud break', 'Flowering', 'Fruit set', 'Filling', 'Maturation'],
      pct: {
        n:  [15, 25, 20, 30, 10],
        p:  [20, 30, 20, 20, 10],
        k:  [10, 15, 20, 40, 15],
        ca: [15, 20, 20, 30, 15],
        mg: [15, 20, 20, 30, 15],
        s:  [15, 20, 20, 30, 15],
        fe: [20, 30, 20, 20, 10],
        zn: [20, 30, 20, 20, 10],
      },
      notes:
        'Perennial tree crop; nutrients split over spring flush, summer fruit fill, and autumn shoot maturation. ' +
        'Zn and Mn are the most common deficiencies on calcareous soils (use foliar sprays). K accumulates strongly in fruit.',
    },
    irrigation: {
      stages: [
        { name: 'Initial',     kc: 0.7,  days: 60 },
        { name: 'Development', kc: 0.85, days: 90 },
        { name: 'Mid',         kc: 0.9,  days: 120 },
        { name: 'Late',        kc: 0.75, days: 60 },
      ],
      notes:
        'FAO-56 Table 12 (citrus, orange). Year-round canopy → Kc values higher than deciduous fruits. ' +
        'Critical water-stress windows: flowering and fruit set. Reduce irrigation 3–4 weeks before harvest to raise Brix.',
    },
    amendment: {
      targetPct: { k: 5,  ca: 65, mg: 12 },
      notes:
        'Citrus tolerates a wide pH (5.5–7.5) but Fe/Zn/Mn availability drops sharply above 7.0. ' +
        'On calcareous soils use elemental S + Fe-EDDHA rather than liming. Maintain Ca:Mg ~5:1 for fruit quality.',
    },
  },

  // ===========================================================================
  // 9. COFFEE
  // ===========================================================================
  {
    id: 'coffee',
    name: 'Coffee',
    emoji: '☕',
    category: 'industrial',
    hydroSolution: {
      N_NO3: 8, N_NH4: 2, P: 1.5, S: 2.5, K: 5, Ca: 5, Mg: 2, Cl: 0,
      notes:
        'Coffee is an acid-loving perennial; small NH₄⁺ fraction (20%) is appropriate. ' +
        'Coffee is rarely grown hydroponically — these values are reference targets for fertigation in substrate or potted nursery plants.',
    },
    nutrientDistribution: {
      totals: { n: 200, p: 30, k: 220, ca: 90, mg: 25, s: 25, fe: 2, zn: 0.5 },
      stages: ['Vegetative', 'Flowering', 'Fruit set', 'Filling', 'Maturation'],
      pct: {
        n:  [15, 25, 20, 30, 10],
        p:  [20, 25, 25, 20, 10],
        k:  [10, 15, 20, 40, 15],
        ca: [15, 20, 20, 30, 15],
        mg: [15, 20, 20, 30, 15],
        s:  [15, 20, 20, 30, 15],
        fe: [20, 25, 25, 20, 10],
        zn: [20, 25, 25, 20, 10],
      },
      notes:
        'Coffee cherry accumulates large K during fill (K is ~40% of dry cherry mass). ' +
        'N split across rainy season: 30% pre-flowering, 40% post-harvest, 30% during fill. ' +
        'Avoid chloride sources; use K₂SO₄ (SOP) instead of KCl (MOP).',
    },
    irrigation: {
      stages: [
        { name: 'Initial',     kc: 0.9,  days: 60 },
        { name: 'Development', kc: 0.95, days: 90 },
        { name: 'Mid',         kc: 1.05, days: 120 },
        { name: 'Late',        kc: 0.95, days: 90 },
      ],
      notes:
        'FAO-56 (coffee, evergreen tree crop). Year-round canopy keeps Kc near 1.0. ' +
        'Most coffee is rain-fed; supplemental irrigation during dry spells raises cherry uniformity and yields by 20–40%.',
    },
    amendment: {
      targetPct: { k: 5,  ca: 55, mg: 12 },
      notes:
        'Coffee prefers acid soils (pH 5.5–6.0). Lower Ca target (50–60%) because high Ca saturation implies alkaline conditions that induce Fe chlorosis. ' +
        'Use ammonium sulfate as primary N source to maintain acidity. Mulch with coffee husk to conserve moisture and feed OM.',
    },
  },

  // ===========================================================================
  // 10. MAIZE / CORN
  // ===========================================================================
  {
    id: 'maize',
    name: 'Maize (corn)',
    emoji: '🌽',
    category: 'cereal',
    hydroSolution: {
      N_NO3: 8, N_NH4: 1, P: 1, S: 1, K: 4, Ca: 4, Mg: 1.5, Cl: 0,
      notes:
        'Maize is a field crop, not hydroponic. These reference meq/L values ' +
        'approximate an N-heavy hydroponic solution for trials only — use soil nutrientDistribution and amendment presets for production.',
    },
    nutrientDistribution: {
      totals: { n: 200, p: 50, k: 180, ca: 40, mg: 25, s: 20, fe: 2, zn: 1 },
      stages: ['Establishment', 'Vegetative', 'Tasseling/silking', 'Grain fill', 'Maturation'],
      pct: {
        n:  [10, 30, 30, 25, 5],
        p:  [25, 30, 25, 15, 5],
        k:  [10, 25, 30, 30, 5],
        ca: [15, 30, 25, 25, 5],
        mg: [15, 30, 25, 25, 5],
        s:  [15, 30, 25, 25, 5],
        fe: [20, 30, 25, 20, 5],
        zn: [25, 30, 25, 15, 5],
      },
      notes:
        'Maize extracts ~200 kg N/ha and ~180 kg K/ha at 12 t/ha grain yield. ' +
        'Critical window: 2 weeks before tasseling to 2 weeks after silking — N and K uptake peaks at 4–5 kg N/ha/day. ' +
        'P and Zn are most effective as starter fertilizer banded near the seed.',
    },
    irrigation: {
      stages: [
        { name: 'Initial',     kc: 0.3,  days: 25 },
        { name: 'Development', kc: 0.7,  days: 40 },
        { name: 'Mid',         kc: 1.15, days: 50 },
        { name: 'Late',        kc: 0.5,  days: 20 },
      ],
      notes:
        'FAO-56 Table 12 (field maize, grain). Cycle ~135 days. ' +
        'Critical water-stress window: tasseling to silking (mid stage) — yield loss up to 50% if stressed. ' +
        'Reduce irrigation during late stage to speed grain dry-down.',
    },
    amendment: {
      targetPct: { k: 5,  ca: 60, mg: 15 },
      notes:
        'Maize tolerates a wide pH (5.5–7.5) but optimizes 6.0–6.8. ' +
        'On acid tropical soils apply dolomitic lime to raise pH and supply Mg. ' +
        'Watch Zn availability on calcareous or recently limed high-pH soils — maize is Zn-sensitive.',
    },
  },
];

/**
 * Look up a crop preset by id (case-insensitive).
 * Returns undefined if not found.
 */
export function getCropPreset(id: string): CropPreset | undefined {
  const t = id.trim().toLowerCase();
  if (!t) return undefined;
  return CROP_PRESETS.find(c => c.id.toLowerCase() === t);
}

/**
 * Crop category labels for UI display.
 */
export const CROP_CATEGORY_LABELS: Record<CropPreset['category'], string> = {
  fruit: 'Fruit',
  vegetable: 'Vegetable',
  berry: 'Berry',
  cereal: 'Cereal',
  industrial: 'Industrial',
};
