import type { WhyItMatters } from '@/components/agri/nutri-tools/WhyItMattersPanel';

/**
 * Educational content for each of the 18 free tools.
 * Used by the <WhyItMattersPanel> shown below each tool in the dialog.
 */
export const WHY_IT_MATTERS: Record<string, WhyItMatters> = {
  'oxide-conversion': {
    example: 'A soil lab reports P as 45 ppm P₂O₅, but your hydroponic recipe uses elemental P in meq/L. Without conversion, you\'d apply 2.3× too much phosphorus.',
    science: 'Fertilizer guarantees are legally expressed as oxide forms (P₂O₅, K₂O) for historical reasons dating to 19th-century gravimetric analysis. Soil and plant tissue labs increasingly report elemental forms. The conversion factors are stoichiometric: P₂O₅ contains 43.6% P by mass, K₂O contains 83.0% K, CaO contains 71.5% Ca.',
    mistakes: [
      'Mixing oxide and elemental values in the same calculation without converting.',
      'Assuming "P" on a fertilizer label means elemental P (it usually means P₂O₅).',
      'Forgetting that CaO ↔ Ca uses a different factor than CaCO₃ ↔ Ca.',
    ],
    references: [
      { label: 'AOAC Official Method 955.06', url: 'https://www.aoac.org/' },
      { label: 'FAO Fertilizer Definitions', url: 'https://www.fao.org/3/y4111e/y4111e00.htm' },
    ],
  },

  'nutrient-units': {
    example: 'A hydroponic lettuce grower follows a Steiner recipe stating "12 meq/L N-NO₃". Their lab report shows "168 ppm N". These are the same value — but only if you convert correctly.',
    science: 'ppm (mg/L) is a mass concentration. mmol/L is a molar concentration (molecules per litre). meq/L is an equivalent concentration (charge per litre). To convert: mmol = ppm ÷ molecular weight; meq = mmol × valence. For Ca²⁺ (MW 40.08, valence 2): 400 ppm = 10 mmol/L = 20 meq/L.',
    mistakes: [
      'Treating µmol/L and mmol/L as the same (1000× difference).',
      'Using mmol/L for divalent ions when the recipe specifies meq/L.',
      'Forgetting that micros (Fe, Mn, Zn, B, Cu, Mo) conventionally use µmol/L, not mmol/L.',
    ],
    references: [
      { label: 'Resh, H.M. (2013) Hydroponic Food Production', url: 'https://www.sciencedirect.com/book/9780124228905/hydroponic-food-production' },
      { label: 'Sonnewald & Koshiba (2013) Plant Nutrient Concepts', url: 'https://doi.org/10.1016/B978-0-12-384905-2.00001-0' },
    ],
  },

  'measure-units': {
    example: 'A US consultant reads "2 lb/100 gal" on a pesticide label and needs to prepare 200 L of spray. Without the right conversion, the dose is wrong by a factor of 12.',
    science: 'The US uses imperial units (lb, gal, oz) for agrichemical labels; most of the world uses SI (kg, L, g). Concentration conversions are particularly error-prone because "ppm" can mean mg/L (in water) or mg/kg (in soil) — a 1.0× vs 1.0× equivalence that breaks down at high densities.',
    mistakes: [
      'Using mg/L and ppm interchangeably in soil (density ≠ 1.0 g/cm³).',
      'Confusing US gallon (3.785 L) with imperial gallon (4.546 L).',
      'Mixing acre and hectare in the same NPK calculation.',
    ],
    references: [
      { label: 'NIST Handbook 44 — Unit Conversion', url: 'https://www.nist.gov/pml/owm/metric-si/si-units' },
      { label: 'USDA Unit Conversion Tables', url: 'https://www.nrcs.usda.gov/' },
    ],
  },

  'hydro-solution': {
    example: 'A tomato grower in Almería was losing 15% of his crop to blossom-end rot. Reviewing his solution with the Steiner diagram revealed his Ca²⁺ was only 18% of cations (should be 35-50%). After correction, BER dropped below 2%.',
    science: 'The Steiner universal nutrient solution (1984) defines an equilibrium zone where the anion split (NO₃:H₂PO₄:SO₄) and cation split (K:Ca:Mg) are balanced for maximum uptake efficiency. Deviations cause antagonism — e.g. high K⁺ blocks Ca²⁺ uptake, high NO₃⁻ competes with H₂PO₄⁻. The ternary diagram visualises these ratios as a single point.',
    mistakes: [
      'Focusing on total ppm without checking the meq/L ratios.',
      'Ignoring the cation equilibrium — Ca²⁺ and Mg²⁺ are easy to under-supply.',
      'Forgetting that NH₄⁺ is not part of the K-Ca-Mg triangle (it\'s separate).',
    ],
    references: [
      { label: 'Steiner (1984) The Universal Nutrient Solution', url: 'https://doi.org/10.1016/0304-4238(84)90028-3' },
      { label: 'Resh (2013) Chapter 7 — Solution Formulation', url: 'https://www.sciencedirect.com/book/9780124228905/hydroponic-food-production' },
    ],
  },

  'water-hardness': {
    example: 'A blueberry grower in Huelva was injecting 100% of his HCO₃⁻ with nitric acid — and his pH kept climbing back to 8.2 within 24h. He needed to leave a 0.5 meq/L residual buffer to keep pH stable.',
    science: 'Bicarbonate (HCO₃⁻) acts as a base buffer in irrigation water. At concentrations above 1.5 meq/L, it raises pH around plant roots, locks up iron (causing chlorosis in acid-loving crops like blueberry and citrus), and precipitates Ca²⁺ as CaCO₃ in drip lines. Acid neutralization converts HCO₃⁻ to CO₂ + H₂O, but you must leave a residual buffer (typically 0.3-0.7 meq/L) to prevent pH swings.',
    mistakes: [
      'Neutralizing to 100% — causes pH instability and over-acidification.',
      'Using phosphoric acid when Ca²⁺ is high (precipitates Ca-phosphate).',
      'Forgetting that 1 meq/L of H₂SO₄ is a different mL volume than 1 meq/L of HNO₃ (different normalities).',
    ],
    references: [
      { label: 'FAO Irrigation Water Quality (29 Rev.1)', url: 'https://www.fao.org/3/T0234E/T0234E00.htm' },
      { label: 'Sonnewald & Koshiba — Acidification', url: 'https://doi.org/10.1016/B978-0-12-384905-2.00001-0' },
    ],
  },

  'vpd': {
    example: 'A cannabis grower in Colorado was running VPD 0.3 kPa (too low) in veg — plants had weak stems and powdery mildew. Raising VPD to 1.0 kPa (by dropping humidity from 80% to 65%) eliminated mildew within 5 days and increased stem caliper by 20%.',
    science: 'VPD = saturation vapor pressure − actual vapor pressure. It\'s the "pull" that drives transpiration. Low VPD (<0.5 kPa) → low transpiration → low Ca transport (Ca moves only in the transpiration stream) → tip burn and BER. High VPD (>1.5 kPa) → stomata close → photosynthesis drops → heat stress. The optimal band is 0.8-1.2 kPa for most crops.',
    mistakes: [
      'Using relative humidity alone — VPD captures the temperature effect.',
      'Forgetting that leaf temp differs from air temp (sunlit leaves are 2-4°C warmer).',
      'Targeting high VPD during establishment (seedlings need 0.4-0.8 kPa).',
    ],
    references: [
      { label: 'Murray (1967) Tetens Equation', url: 'https://doi.org/10.1175/1520-0450(1967)006<0203:AAMTSO>2.0.CO;2' },
      { label: 'Prenger & Ling (2001) Greenhouse VPD', url: 'https://www.farm-energy.extension.org/' },
    ],
  },

  'amendment-balance': {
    example: 'An avocado grower in Michoacán had a CEC of 18 meq/100g with Ca at 55%, Mg at 8%, K at 4%. After applying 1.2 t/ha gypsum + 0.4 t/ha SOP, his Ca rose to 68%, K to 6% — and Phytophthora incidence dropped 40% the following season.',
    science: 'Cation Exchange Capacity (CEC) is the soil\'s capacity to hold positively charged nutrients. Ideal base saturation (Albrecht method): Ca 65-75%, Mg 10-15%, K 3-7%, Na <1%, H <10%. Amendments work by displacing cations on the exchange complex — gypsum (CaSO₄) adds Ca²⁺ and SO₄²⁻ without raising pH; lime (CaCO₃) adds Ca²⁺ and raises pH; dolomite adds both Ca²⁺ and Mg²⁺.',
    mistakes: [
      'Applying gypsum to fix Ca without checking that Mg isn\'t already low (gypsum can leach Mg).',
      'Using lime on alkaline soils (pH > 7.5) — it makes the problem worse.',
      'Forgetting the root-reach factor: only the soil volume actually explored by roots benefits from the amendment.',
    ],
    references: [
      { label: 'Albrecht (1975) Soil Fertility & Animal Health', url: 'https://www.soilhealth.com/' },
      { label: 'USDA NRCS Soil Quality Agronomy', url: 'https://www.nrcs.usda.gov/' },
    ],
  },

  'granular-mix': {
    example: 'A coffee cooperative in Colombia was buying 19-19-19 blend at $850/t. Building their own blend from urea + DAP + KCl gave them 17-17-17 at $620/t — a 27% cost reduction with almost identical nutrient delivery.',
    science: 'A granular blend is a physical mixture of fertilizer materials. The resulting NPK analysis is the weighted average of each component\'s nutrient content × its proportion in the mix. The NPK ratio (e.g. 1:1:1 for 19-19-19) is independent of total analysis — a 10-10-10 and a 20-20-20 have the same ratio but different application rates.',
    mistakes: [
      'Not checking blend compatibility — some materials (e.g. urea + ammonium nitrate) are hygroscopic together.',
      'Forgetting secondary nutrients (Ca, Mg, S) and micros when the blend replaces a complete complex fertilizer.',
      'Calculating kg/ha based on the blend analysis instead of the crop requirement.',
    ],
    references: [
      { label: 'IPNI Fertilizer Use & Blending', url: 'https://www.ipni.net/' },
      { label: 'TFC Fertilizer Blending Manual', url: 'https://www.tfi.org/' },
    ],
  },

  'fertilizer-composition': {
    example: 'A grower buying "calcium nitrate" was paying for Ca(NO₃)₂·4H₂O (MW 236.15, 17% Ca) but the supplier shipped the double salt 5Ca(NO₃)₂+NH₄NO₃+10H₂O (MW 980.8, 14% Ca + 1% N as NH₄). His Ca application was 18% lower than expected.',
    science: 'Chemical formulas encode the exact elemental composition via atomic weights. Hydrates (·nH₂O) add water mass without nutrients — Ca(NO₃)₂·4H₂O is 31% water by mass. Double salts (joined by +) are physically combined but chemically distinct. The parser handles all three forms plus parentheses for groups like Ca(NO₃)₂.',
    mistakes: [
      'Ignoring hydrate water — leads to under-dosing by 15-30%.',
      'Confusing the N-NO₃ vs N-NH₄ split in double salts like calcium ammonium nitrate.',
      'Using oxide form (P₂O₅, K₂O) when the recipe specifies elemental (P, K).',
    ],
    references: [
      { label: 'IUPAC Nomenclature of Inorganic Chemistry', url: 'https://iupac.org/' },
      { label: 'IPNI Plant Nutrition Manual', url: 'https://www.ipni.net/' },
    ],
  },

  'nutrient-distribution': {
    example: 'A strawberry grower in Huelva was applying 30% of his N in the vegetative stage and only 10% in flowering. After redistributing to 15%/35%/30%/15%/5% across (establishment/vegetative/flowering/filling/ripening), fruit size increased 12% and Brix rose 0.8°.',
    science: 'Crop nutrient demand follows a sigmoid curve — low during establishment, steep during vegetative and reproductive stages, then decline during maturation. The % distribution per stage must match this curve. Stage-specific extraction data comes from whole-plant analysis at known phenological points (e.g. strawberry per Marschner 2012).',
    mistakes: [
      'Applying a flat rate monthly instead of matching the curve.',
      'Front-loading N (causes excessive vegetative growth at the expense of fruit).',
      'Forgetting that K demand spikes during fruit filling (often 35-40% of total K).',
    ],
    references: [
      { label: 'Marschner (2012) Mineral Nutrition of Higher Plants', url: 'https://www.sciencedirect.com/book/9780123849052/mineral-nutrition-of-higher-plants' },
      { label: 'FAO Fertilizer Use by Crop', url: 'https://www.fao.org/' },
    ],
  },

  'fertilizer-compatibility': {
    example: 'A greenhouse in Almería mixed calcium nitrate and MKP in the same stock tank — within 4 hours, the tank was milky white and every dripper was clogged with calcium phosphate. Cleanup cost: €2,800 in labor + lost crop.',
    science: 'Compatibility is governed by precipitation chemistry. Ca²⁺ + HPO₄²⁻ → CaHPO₄↓ (insoluble above ~10 mM). Ca²⁺ + SO₄²⁻ → CaSO₄·2H₂O↓ (gypsum, less soluble in cold stock). The C/R/I codes encode whether a precipitate forms at typical stock-solution concentrations (100-1000× the final solution).',
    mistakes: [
      'Co-dissolving Ca²⁺ sources with phosphate or sulfate in the same concentrated tank.',
      'Mixing strong acids (HNO₃ + H₂SO₄) without dilution — heat and spatter.',
      'Assuming "if it dissolves, it\'s fine" — some precipitates take hours to form.',
    ],
    references: [
      { label: 'Fertilizers Europe — Compatibility Tables', url: 'https://www.fertilizerseurope.com/' },
      { label: 'FAO Fertigation Manual', url: 'https://www.fao.org/3/s4954e/s4954e00.htm' },
    ],
  },

  'solubility-salt-index': {
    example: 'A corn grower applied 200 kg/ha of KCl (salt index 116.3) in-furrow next to the seed. Germination dropped 30% due to osmotic stress. Switching to K₂SO₄ (SI 46) at the same K rate restored normal germination.',
    science: 'Solubility (g/L at 20°C) determines whether a fertilizer can be used in fertigation (need >100 g/L) or only as a soil application. Salt index measures the osmotic pressure a fertilizer exerts in soil solution relative to NaNO₃ (=100). High-SI fertilizers (>80) placed near seeds or roots cause "salt burn" — water moves out of the seed/root to dilute the salt.',
    mistakes: [
      'In-furrow placement of high-SI fertilizers (KCl, NH₄NO₃) at high rates.',
      'Stock-tank concentrations above the solubility limit — causes crystallization in lines.',
      'Using gypsum or calcite in fertigation — they\'re amendments, not soluble.',
    ],
    references: [
      { label: 'TFC Salt Index Reference', url: 'https://www.tfi.org/' },
      { label: 'IPNI Plant Nutrition Manual — Solubility', url: 'https://www.ipni.net/' },
    ],
  },

  'fertilizer-carbon': {
    example: 'A potato grower in Idaho switched from urea (1.58 kg CO₂e/kg) to a 50:50 urea + UAN blend with a nitrification inhibitor. Per-hectare emissions dropped from 1,420 to 920 kg CO₂e/ha — a 35% reduction with no yield loss.',
    science: 'Fertilizer carbon footprint has 3 components: (1) Manufacturing (energy to fix N₂ → NH₃ via Haber-Bosch, then convert to urea/nitrate/etc.); (2) Transport (plant → port → field, road vs sea); (3) Field N₂O emission (0.01 × kg N applied × 298 GWP). Manufacturing dominates for N fertilizers; transport is significant for imported K and P.',
    mistakes: [
      'Counting only manufacturing — field N₂O is 30-50% of total for N fertilizers.',
      'Using global-average factors when local grid intensity differs (e.g. Norway 30 g/kWh vs China 600 g/kWh).',
      'Forgetting transport legs — sea freight is 7× less carbon-intensive than road per tonne-km.',
    ],
    references: [
      { label: 'Fertilizers Europe (2020) Carbon Footprint', url: 'https://www.fertilizerseurope.com/' },
      { label: 'IPCC 2019 Refinement — N₂O', url: 'https://www.ipcc.ch/' },
    ],
  },

  'n-mineralizable': {
    example: 'A maize grower in Iowa with 3% OM and 1.3 g/cm³ bulk density was applying 200 kg N/ha. The tool showed his soil mineralizes ~95 kg N/ha/year. He cut synthetic N to 110 kg/ha — yield unchanged, $70/ha saved.',
    science: 'Soil organic matter contains ~5% N. Each year, 1-3% of that organic N is mineralized to plant-available NO₃⁻/NH₄⁺ by soil microbes. The rate (T_min) depends on temperature, moisture, aeration, and microbial activity. The calculation: N_min = (soil mass in root zone) × OM% × N-in-OM% × T_min%.',
    mistakes: [
      'Using the top 15 cm when roots actually explore 30-60 cm.',
      'Assuming T_min = 3% in cold climates (should be 1%).',
      'Forgetting to subtract mineralized N from the fertilizer recommendation.',
    ],
    references: [
      { label: 'USDA NRCS Soil Organic Matter', url: 'https://www.nrcs.usda.gov/' },
      { label: 'Cornell Soil Health Manual', url: 'https://soilhealth.cals.cornell.edu/' },
    ],
  },

  'soil-water-texture': {
    example: 'A vineyard in Mendoza planted on sandy loam (12% CC, 5% PMP) was irrigating every 3 days for 4 hours. The tool showed available water was only 84 m³/ha in the top 60 cm — he needed daily 1-hour irrigation instead.',
    science: 'USDA texture triangle classifies soil by clay/silt/sand %. Available water = (field capacity − permanent wilting point) × depth × bulk density × area. Sandy soils hold 8-15% water; clays 30-45%. The "available" portion (between PMP and CC) is what plants can extract.',
    mistakes: [
      'Using lab CC/PMP values without adjusting for stone content (>15% gravel reduces effective water).',
      'Irrigating the full area when only a strip is wetted (drip) — use the root-reach factor.',
      'Forgetting that compaction reduces CC and increases runoff.',
    ],
    references: [
      { label: 'USDA NRCS Soil Texture Triangle', url: 'https://www.nrcs.usda.gov/' },
      { label: 'FAO Irrigation & Drainage Paper 56', url: 'https://www.fao.org/3/x0490e/x0490e00.htm' },
    ],
  },

  'irrigation-balance': {
    example: 'An almond grower in California was applying 100% of ETc every day. After switching to a 7-day balance (irrigate only when cumulative deficit > 25 mm), he cut water use 18% with no yield loss — and reduced pump electricity by $420/ha.',
    science: 'FAO-56: ETc = Kc × ETo. Kc is crop-specific and stage-dependent (low at establishment, peak at mid-season). The water balance = irrigation + rain − ETc. Positive = surplus (drainage); negative = deficit (stress). A 7-day balance smooths daily variability and lets you irrigate less frequently but more deeply.',
    mistakes: [
      'Using a single annual Kc instead of stage-specific values.',
      'Forgetting effective rain (heavy storms runoff; only ~60-80% of rain enters the soil).',
      'Irrigating the crop area but calculating volume on the wetted area (drip).',
    ],
    references: [
      { label: 'FAO-56 Crop Evapotranspiration', url: 'https://www.fao.org/3/x0490e/x0490e00.htm' },
      { label: 'UC Davis Drought Management', url: 'https://ucdrought.ucdavis.edu/' },
    ],
  },

  'periodic-table': {
    example: 'A student confused Mn (manganese, essential micronutrient) with Mg (magnesium, essential macronutrient). The interactive table + agronomic role card made the distinction immediate — and the MW calculator confirmed MnSO₄ (151 g/mol) vs MgSO₄ (120 g/mol).',
    science: '17 elements are essential for higher plants: 9 macronutrients (C, H, O, N, P, K, Ca, Mg, S) and 8 micronutrients (Fe, Mn, Zn, Cu, B, Mo, Cl, Ni). 7 more are beneficial (Si, Na, Co, Se, V, Ti, Al). The periodic table highlights these with colors; the detail card gives atomic weight, valence, electronegativity, and the agronomic role.',
    mistakes: [
      'Confusing Mn and Mg — different roles, different deficiency symptoms.',
      'Forgetting Ni (essential since 1987, but rarely deficient).',
      'Treating Si as essential (it\'s beneficial — strong evidence for grasses, less for dicots).',
    ],
    references: [
      { label: 'Marschner (2012) Chapter 1 — Essential Elements', url: 'https://www.sciencedirect.com/book/9780123849052/mineral-nutrition-of-higher-plants' },
      { label: 'IPNI Plant Nutrition Manual', url: 'https://www.ipni.net/' },
    ],
  },

  'nutrient-interactions': {
    example: 'A citrus grower had high P soil (45 ppm Olsen) and chronic Zn deficiency. Reducing P fertilization for 2 seasons raised Zn leaf levels from 14 to 22 ppm — the "P-induced Zn deficiency" was the real problem, not low soil Zn.',
    science: 'The Mulder diagram (1953) maps ionic antagonisms (red) and synergies (blue). Antagonism = competition for uptake sites or precipitation (e.g. high K⁺ blocks Mg²⁺, high H₂PO₄⁻ precipitates Fe³⁺). Synergy = co-transport or metabolic coupling (e.g. K⁺ + NO₃⁻ are co-transported across the root). Mobility (mobile/immobile/very-immobile) determines which leaves show deficiency first.',
    mistakes: [
      'Diagnosing "low Mg" when the real issue is high K — check the ratio, not the absolute value.',
      'Adding more Fe when the soil pH is 8.2 — the Fe is there, just precipitated.',
      'Forgetting that B mobility varies by species (polyol-transporting species like apple re-translocate B).',
    ],
    references: [
      { label: 'Mulder (1953) Ion Antagonisms', url: 'https://doi.org/10.1007/BF02203430' },
      { label: 'Marschner (2012) Chapter 3 — Nutrient Interactions', url: 'https://www.sciencedirect.com/book/9780123849052/mineral-nutrition-of-higher-plants' },
    ],
  },
};
