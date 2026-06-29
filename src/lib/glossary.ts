/**
 * NutriPlant PRO — Glossary of agronomic technical terms
 *
 * Used across the 18 free tools to drive tooltip popovers and inline term
 * highlighting. Each entry has a canonical `term`, a list of `aliases` that
 * should also trigger the tooltip (case-insensitive), a one-line plain-language
 * `short` definition (≤120 chars) and a fuller 1–2 sentence `long` explanation.
 *
 * Categories: soil | water | fertilizer | plant | climate | units
 */

export type GlossaryCategory = 'soil' | 'water' | 'fertilizer' | 'plant' | 'climate' | 'units';

export interface GlossaryEntry {
  term: string;
  aliases: string[];
  short: string;
  long: string;
  category: GlossaryCategory;
}

export const GLOSSARY: GlossaryEntry[] = [
  // ===========================================================================
  // SOIL
  // ===========================================================================
  {
    term: 'CEC',
    aliases: ['CIC', 'cation exchange capacity', 'capacidad de intercambio catiónico'],
    category: 'soil',
    short: 'Capacity of soil to hold positively charged nutrients (cations) on exchange sites.',
    long: 'Cation Exchange Capacity. Higher CEC means the soil can retain more Ca²⁺, Mg²⁺, K⁺, NH₄⁺ and resist nutrient leaching. Typically 5–60 meq/100g depending on clay and organic matter.',
  },
  {
    term: 'meq/100g',
    aliases: ['meq/100 g', 'meq per 100g', 'meq/100 g soil'],
    category: 'soil',
    short: 'Milliequivalents per 100 g of soil; traditional unit for CEC and exchangeable cations.',
    long: 'Expresses the quantity of charge per 100 g of dry soil. Still widely used in soil-test reports despite being a non-SI unit; numerically identical to cmolc/kg.',
  },
  {
    term: 'cmolc/kg',
    aliases: ['cmol(+)/kg', 'cmolc kg', 'centimoles of charge per kg'],
    category: 'soil',
    short: 'Centimoles of charge per kg; SI equivalent of meq/100g (1:1 conversion).',
    long: 'Preferred SI unit for CEC and exchangeable cations. One cmolc/kg = one meq/100 g of soil — the conversion is exact.',
  },
  {
    term: 'bulk density',
    aliases: ['DA', 'densidad aparente', 'dry bulk density'],
    category: 'soil',
    short: 'Dry mass of soil per unit volume (g/cm³); indicator of compaction and pore space.',
    long: 'Typical values 1.0–1.6 g/cm³ for mineral soils. Higher bulk density means less pore space, more compaction, and restricted root growth.',
  },
  {
    term: 'field capacity',
    aliases: ['CC', 'capacidad de campo', 'FC'],
    category: 'soil',
    short: 'Water content remaining in soil after gravity drainage, typically 1–3 days after saturation.',
    long: 'Lower bound of the gravitational water range. Often approximated at soil water potential of −33 kPa (−0.33 bar) in loamy soils.',
  },
  {
    term: 'permanent wilting point',
    aliases: ['PMP', 'punto de marchitez permanente', 'PWP', 'wilting point'],
    category: 'soil',
    short: 'Soil water content below which plants wilt and cannot recover in humid air.',
    long: 'Lower limit of plant-available water, typically at −1500 kPa (−15 bar) soil water potential.',
  },
  {
    term: 'available water',
    aliases: ['AU', 'agua útil', 'plant available water', 'PAW'],
    category: 'soil',
    short: 'Water held between field capacity and permanent wilting point, accessible to roots.',
    long: 'Calculated as CC − PMP on a volumetric or gravimetric basis. The objective band in irrigation scheduling is often 40–60% of available water depleted.',
  },
  {
    term: 'soil texture',
    aliases: ['textura de suelo', 'USDA texture'],
    category: 'soil',
    short: 'Proportion of sand, silt and clay particles (≤2 mm) in the mineral soil fraction.',
    long: 'Classified using the USDA triangle into 12 texture classes (sand, loamy sand, sandy loam, … clay). Texture is stable and drives water-holding capacity and CEC.',
  },
  {
    term: 'clay',
    aliases: ['arcilla'],
    category: 'soil',
    short: 'Soil particles <0.002 mm; high surface area, plasticity, CEC and water retention.',
    long: 'Layered aluminosilicates (kaolinite, illite, montmorillonite). Clays hold water tightly (much is unavailable) but contribute most of the soil CEC.',
  },
  {
    term: 'silt',
    aliases: ['limo'],
    category: 'soil',
    short: 'Soil particles 0.002–0.05 mm; smooth flour-like feel, moderate water retention.',
    long: 'Intermediate size fraction; feels smooth when dry and soapy when wet. Susceptible to erosion and crusting.',
  },
  {
    term: 'sand',
    aliases: ['arena'],
    category: 'soil',
    short: 'Soil particles 0.05–2 mm; high drainage, low CEC, low water-holding capacity.',
    long: 'Coarse quartz-rich fraction; gritty feel. Sandy soils drain fast, lose nutrients easily and need frequent irrigation.',
  },
  {
    term: 'pH',
    aliases: ['soil pH', 'acidity', 'alkalinity'],
    category: 'soil',
    short: 'Negative log of H⁺ activity; scale 0–14, measures soil acidity/alkalinity.',
    long: 'Affects nutrient availability, microbial activity and CEC saturation. Most crops prefer 6.0–7.0; acid-loving crops (blueberry, coffee) prefer 4.5–5.5.',
  },
  {
    term: 'organic matter',
    aliases: ['OM', 'MO', 'materia orgánica', 'soil organic matter'],
    category: 'soil',
    short: 'Decomposed plant and animal residues in soil; drives CEC, structure and nutrient cycling.',
    long: 'Humus fraction contributes 200–400 meq/100g of CEC per percent OM. Also improves aggregation, water infiltration and mineralizable N supply.',
  },
  {
    term: 'base saturation',
    aliases: ['saturación de bases', 'BS'],
    category: 'soil',
    short: '% of CEC occupied by base cations (Ca, Mg, K, Na); typical ideal 80–90%.',
    long: 'Reported per-cation (e.g. Ca 65%, Mg 15%, K 5%). Drives the Amendment Balance by CEC tool; targets vary by crop.',
  },
  {
    term: 'rhizosphere',
    aliases: ['rizósfera', 'root zone'],
    category: 'soil',
    short: 'Soil zone (1–2 mm) immediately surrounding roots, enriched by exudates and microbes.',
    long: 'Site of intense biological activity and nutrient uptake. pH, EC and microbial community differ markedly from bulk soil.',
  },

  // ===========================================================================
  // WATER
  // ===========================================================================
  {
    term: 'hardness',
    aliases: ['dureza', 'water hardness', 'total hardness'],
    category: 'water',
    short: 'Sum of Ca²⁺ and Mg²⁺ concentrations in water, expressed as mg/L CaCO₃.',
    long: 'Classified as soft (<60), moderately hard (60–120), hard (120–180) or very hard (>180 mg/L CaCO₃). Causes scale and alters fertilizer solubility.',
  },
  {
    term: 'CaCO₃ equivalent',
    aliases: ['CaCO3 equivalent', 'calcium carbonate equivalent', 'CCE'],
    category: 'water',
    short: 'Standard way to express Ca, Mg or acidity on a common CaCO₃ molar basis (EW = 50 g/eq).',
    long: 'Lets you sum hardness, alkalinity and amendment doses on a single equivalent-weight basis. 1 meq/L = 50 mg/L CaCO₃.',
  },
  {
    term: 'bicarbonate (HCO₃⁻)',
    aliases: ['HCO3', 'bicarbonate', 'bicarbonato'],
    category: 'water',
    short: 'HCO₃⁻ ion; main contributor to water alkalinity at pH 6.3–10.3.',
    long: 'Elevated HCO₃⁻ (>2 meq/L) raises pH in the root zone, precipitates Ca as CaCO₃ and locks up Fe; corrected by acid injection.',
  },
  {
    term: 'carbonate (CO₃²⁻)',
    aliases: ['CO3', 'carbonate', 'carbonato'],
    category: 'water',
    short: 'CO₃²⁻ ion; dominates alkalinity only above pH 10.3.',
    long: 'Rare in irrigation water but appears in sodic/alkaline soils. Combined with bicarbonate gives total alkalinity (mg/L CaCO₃).',
  },
  {
    term: 'alkalinity',
    aliases: ['alcalinidad', 'total alkalinity'],
    category: 'water',
    short: 'Water capacity to neutralize acid; sum of HCO₃⁻ + CO₃²⁻ + OH⁻ as mg/L CaCO₃.',
    long: 'High alkalinity (>100 mg/L CaCO₃) buffers pH upward and demands acid injection; <30 mg/L is unstable and easily acidified.',
  },
  {
    term: 'EC',
    aliases: ['electrical conductivity', 'CE', 'conductividad eléctrica'],
    category: 'water',
    short: 'Electrical conductivity of water or soil solution; proxy for total dissolved salts.',
    long: 'Reported in dS/m or mS/cm. Approximate conversion: 1 dS/m ≈ 640 mg/L TDS (NaCl basis) or ≈ 10 meq/L for typical hydroponic ions.',
  },
  {
    term: 'TDS',
    aliases: ['total dissolved solids', 'sólidos disueltos totales'],
    category: 'water',
    short: 'Total Dissolved Solids; sum of all dissolved ions, mg/L.',
    long: 'Often estimated as EC × 640 (NaCl) or EC × 700 (KCl/4-2-1 hydro mixes). True gravimetric measurement requires evaporation.',
  },
  {
    term: 'acid neutralization',
    aliases: ['neutralización ácida', 'acid demand'],
    category: 'water',
    short: 'Amount of acid required to lower water alkalinity to a target pH (meq/L).',
    long: 'Calculated from total alkalinity and target pH using the carbonate speciation curve. Strong acids (HNO₃, H₂SO₄, H₃PO₄) also contribute nutrients.',
  },
  {
    term: 'residual',
    aliases: ['residual sodium carbonate', 'RSC', 'carbonato residual'],
    category: 'water',
    short: 'Residual Sodium Carbonate = (HCO₃⁻ + CO₃²⁻) − (Ca²⁺ + Mg²⁺), meq/L.',
    long: 'Positive RSC (>2.5 meq/L) indicates water that will precipitate Ca/Mg as carbonates and leave Na⁺ to degrade soil structure.',
  },

  // ===========================================================================
  // FERTILIZER
  // ===========================================================================
  {
    term: 'N-P-K',
    aliases: ['NPK', 'N P K ratio'],
    category: 'fertilizer',
    short: 'Nitrogen, Phosphorus and Potassium; the three primary macronutrients on a fertilizer grade.',
    long: 'Reported as %N-%P₂O₅-%K₂O (oxide form, US convention) or as %N-%P-%K (elemental form, EU convention since 2019).',
  },
  {
    term: 'oxide form',
    aliases: ['forma óxido', 'oxide basis'],
    category: 'fertilizer',
    short: 'Nutrient expressed as the oxide (P₂O₅, K₂O, CaO, MgO); traditional NPK convention.',
    long: 'Historical convention still printed on fertilizer bags in the Americas. Convert oxide→element with stoichiometric factors (e.g. P = P₂O₅ × 0.436).',
  },
  {
    term: 'elemental form',
    aliases: ['forma elemental', 'elemental basis'],
    category: 'fertilizer',
    short: 'Nutrient expressed as the pure element (P, K, Ca, Mg); EU fertilizer labeling convention.',
    long: 'Used in hydroponics and scientific work. Convert P₂O₅→P (×0.436), K₂O→K (×0.830), CaO→Ca (×0.715), MgO→Mg (×0.603).',
  },
  {
    term: 'P₂O₅',
    aliases: ['P2O5', 'phosphorus pentoxide', 'phosphate'],
    category: 'fertilizer',
    short: 'Phosphorus pentoxide; oxide form used on fertilizer labels. 1 P = 2.291 P₂O₅.',
    long: 'Conversion: P × 2.291 = P₂O₅; P₂O₅ × 0.436 = P. Most common P source: MAP (11-52-0) or DAP (18-46-0).',
  },
  {
    term: 'K₂O',
    aliases: ['K2O', 'potassium oxide', 'potash'],
    category: 'fertilizer',
    short: 'Potassium oxide; oxide form used on fertilizer labels. 1 K = 1.205 K₂O.',
    long: 'Conversion: K × 1.205 = K₂O; K₂O × 0.830 = K. Common K sources: MOP (KCl), SOP (K₂SO₄), MKP (KH₂PO₄), potassium nitrate.',
  },
  {
    term: 'CaO',
    aliases: ['CaO', 'calcium oxide', 'lime as CaO'],
    category: 'fertilizer',
    short: 'Calcium oxide; oxide form for Ca in amendments. 1 Ca = 1.399 CaO.',
    long: 'Conversion: Ca × 1.399 = CaO; CaO × 0.715 = Ca. Used for liming equivalence (CaCO₃ has 56% CaO by mass).',
  },
  {
    term: 'MgO',
    aliases: ['MgO', 'magnesium oxide'],
    category: 'fertilizer',
    short: 'Magnesium oxide; oxide form for Mg. 1 Mg = 1.658 MgO.',
    long: 'Conversion: Mg × 1.658 = MgO; MgO × 0.603 = Mg. Dolomite contains ~20% MgO and ~30% CaO.',
  },
  {
    term: 'fertilizer grade',
    aliases: ['grade', 'análisis garantizado', 'guaranteed analysis'],
    category: 'fertilizer',
    short: 'Legally guaranteed nutrient content of a fertilizer, expressed as %N-%P₂O₅-%K₂O.',
    long: 'A 15-15-15 grade guarantees 15% N, 15% P₂O₅ and 15% K₂O by mass; secondary nutrients may be declared in elemental or oxide form.',
  },
  {
    term: 'solubility',
    aliases: ['solubilidad'],
    category: 'fertilizer',
    short: 'Maximum mass of fertilizer dissolvable per litre of water (g/L) at a given temperature.',
    long: 'Drives fertigation stock-solution concentration limits. Reported as cold-water (20°C) and hot-water (40°C) values; hygroscopic fertilizers may have lower practical solubility.',
  },
  {
    term: 'salt index',
    aliases: ['IS', 'índice salino', 'SI'],
    category: 'fertilizer',
    short: 'Osmotic pressure of a fertilizer relative to NaNO₃ (=100); lower = safer near roots.',
    long: 'MOP has IS=116.3 (highest); Ca(NO₃)₂ ≈ 65; DAP ≈ 34; MKP ≈ 14. High IS materials must be banded away from germinating seeds.',
  },
  {
    term: 'hygroscopic',
    aliases: ['higroscópico', 'deliquescent'],
    category: 'fertilizer',
    short: 'Fertilizer that absorbs moisture from air, caking or liquefying above a critical humidity.',
    long: 'Critical relative humidity: urea 73%, ammonium nitrate 59%, calcium nitrate 47%. Hygroscopic fertilizers need sealed storage.',
  },
  {
    term: 'blend',
    aliases: ['mezcla física', 'fertilizer blend', 'bulk blend'],
    category: 'fertilizer',
    short: 'Physical mixture of two or more dry fertilizer materials to reach a target grade.',
    long: 'Unlike compounds, blends can segregate by particle size; raw materials must be size-matched within ±10% to avoid stratification.',
  },
  {
    term: 'amendment',
    aliases: ['enmienda', 'soil amendment'],
    category: 'fertilizer',
    short: 'Material added to soil to modify physical/chemical properties (pH, structure, CEC), not primarily to feed NPK.',
    long: 'Includes liming materials (calcitic lime, dolomite), gypsum, elemental S, organic composts. Distinguished from fertilizers by nutrient content threshold.',
  },
  {
    term: 'gypsum',
    aliases: ['yeso', 'CaSO₄·2H₂O', 'calcium sulfate'],
    category: 'fertilizer',
    short: 'Calcium sulfate dihydrate; Ca 23%, S 19%; amendment for Na-displaced soils.',
    long: 'Does not change pH. Supplies Ca²⁺ to displace Na⁺ from the exchange complex; the soluble Na₂SO₄ is then leached. Typical dose 2–5 t/ha.',
  },
  {
    term: 'lime',
    aliases: ['cal', 'calcitic lime', 'agricultural lime', 'CaCO₃'],
    category: 'fertilizer',
    short: 'Calcium carbonate (CaCO₃); liming amendment that raises soil pH. CCE ≈ 100%.',
    long: 'Reacts with soil acidity: CaCO₃ + 2H⁺ → Ca²⁺ + CO₂ + H₂O. Fineness of grind (60% < 60 mesh) controls reactivity; full effect takes 6–12 months.',
  },
  {
    term: 'dolomite',
    aliases: ['dolomita', 'dolomitic lime', 'CaMg(CO₃)₂'],
    category: 'fertilizer',
    short: 'CaMg(CO₃)₂; liming amendment supplying both Ca (≈22%) and Mg (≈13%).',
    long: 'Preferred when both pH and Mg are low. CCE ≈ 90–108% depending on purity; slower-acting than calcitic lime due to higher Mg content.',
  },
  {
    term: 'SOP',
    aliases: ['sulfato potásico', 'potassium sulfate', 'K₂SO₄'],
    category: 'fertilizer',
    short: 'Sulfate of Potash (K₂SO₄); K 42–44% (≈50% K₂O), S 17–18%; chloride-free.',
    long: 'Preferred for chloride-sensitive crops (potato, tobacco, avocado, strawberry) and high-value hydroponics. Lower solubility (~120 g/L) than MOP.',
  },
  {
    term: 'MOP',
    aliases: ['cloruro potásico', 'potassium chloride', 'KCl', 'muriate of potash'],
    category: 'fertilizer',
    short: 'Muriate of Potash (KCl); K 50–52% (≈60% K₂O); most concentrated K source.',
    long: 'Cheapest K source but contains 47% Cl. Suitable for most field crops but avoided on chloride-sensitive species and in fertigation.',
  },
  {
    term: 'MAP',
    aliases: ['monoammonium phosphate', 'fosfato monoamónico', 'NH₄H₂PO₄'],
    category: 'fertilizer',
    short: 'Monoammonium phosphate (11-52-0); N 11%, P₂O₅ 52%; mildly acidifying.',
    long: 'Water-soluble P source (≈370 g/L) used in fertigation and as a starter fertilizer. pH of 1% solution ≈ 4.5; lowers rhizosphere pH slightly.',
  },
  {
    term: 'DAP',
    aliases: ['diammonium phosphate', 'fosfato diamónico', '(NH₄)₂HPO₄'],
    category: 'fertilizer',
    short: 'Diammonium phosphate (18-46-0); N 18%, P₂O₅ 46%; mildly alkaline.',
    long: 'Highest-P fertilizer in widespread use; pH of 1% solution ≈ 8.0. Solubility ≈ 430 g/L. Temporary ammonia loss risk if banded near germinating seeds.',
  },
  {
    term: 'MKP',
    aliases: ['monopotassium phosphate', 'KH₂PO₄', 'potassium dihydrogen phosphate'],
    category: 'fertilizer',
    short: 'Monopotassium phosphate (0-52-34); fully water-soluble P + K, chloride-free.',
    long: 'Solubility ≈ 230 g/L; pH of 1% solution ≈ 4.5. Used in hydroponics and foliar sprays; incompatible with Ca/Mg concentrates (precipitates as CaHPO₄).',
  },
  {
    term: 'chelate',
    aliases: ['quelato', 'chelated micronutrient'],
    category: 'fertilizer',
    short: 'Organic ligand that binds a metal micronutrient, keeping it soluble across a pH range.',
    long: 'Without chelation, Fe³⁺ precipitates as Fe(OH)₃ above pH 3; chelates extend solubility into the alkaline range and protect against phosphate antagonism.',
  },
  {
    term: 'EDTA',
    aliases: ['ethylenediaminetetraacetic acid'],
    category: 'fertilizer',
    short: 'EDTA chelating agent; effective for Fe, Zn, Cu, Mn at pH 4–6.5.',
    long: 'Cheapest chelate but loses Fe above pH 6.5; not recommended for calcareous soils. Common forms: Fe-EDTA 13%, Zn-EDTA 15%.',
  },
  {
    term: 'DTPA',
    aliases: ['diethylenetriaminepentaacetic acid'],
    category: 'fertilizer',
    short: 'DTPA chelating agent; holds Fe stable up to pH 7.5.',
    long: 'Best for slightly alkaline soils and hydroponics at pH 6.0–7.0. Common form: Fe-DTPA 11%.',
  },
  {
    term: 'EDDHA',
    aliases: ['ethylenediaminedihydroxyphenylacetic acid', 'EDDHA-Fe'],
    category: 'fertilizer',
    short: 'EDDHA chelating agent; holds Fe stable up to pH 11, for calcareous/alkaline soils.',
    long: 'Strongest Fe chelate; small soil applications (1–5 kg/ha) correct Fe chlorosis in citrus, grapevine and olive on calcareous soils. Premium-priced.',
  },
  {
    term: 'fertigation',
    aliases: ['fertirrigación', 'fertirrigation'],
    category: 'fertilizer',
    short: 'Application of dissolved fertilizers through the irrigation system (drip, sprinkler).',
    long: 'Enables split dosing and tight control of root-zone EC and pH. Requires soluble fertilizers and backflow prevention; incompatible fertilizer pairs must be split into separate tanks.',
  },
  {
    term: 'stock solution',
    aliases: ['solución madre', 'concentrate', 'tank concentrate'],
    category: 'fertilizer',
    short: 'Concentrated fertilizer solution, later diluted 1:100 to 1:300 into irrigation water.',
    long: 'Limited by the solubility of the least soluble fertilizer and by precipitation pairs (Ca²⁺ vs SO₄²⁻/PO₄³⁻). Typical concentration 100–300× the final feed.',
  },
  {
    term: 'tank A/B',
    aliases: ['tanque A/B', 'A/B tank', 'twin tank'],
    category: 'fertilizer',
    short: 'Two-tank fertigation setup separating Ca (tank A) from sulfates/phosphates (tank B).',
    long: 'Prevents CaSO₄ and Ca₃(PO₄)₂ precipitation in the concentrate. Tank A holds Ca(NO₃)₂ + micros; tank B holds KNO₃ + MKP + MgSO₄ + ammonium salts.',
  },

  // ===========================================================================
  // PLANT
  // ===========================================================================
  {
    term: 'macronutrient',
    aliases: ['macronutriente', 'macro element'],
    category: 'plant',
    short: 'Essential element required in large amounts (>0.1% dry matter); N, P, K, Ca, Mg, S.',
    long: 'Sometimes split into primary (N-P-K) and secondary (Ca-Mg-S). Concentrations in plant tissue range from 0.1% to 5% of dry matter.',
  },
  {
    term: 'micronutrient',
    aliases: ['micronutriente', 'micro element', 'trace element'],
    category: 'plant',
    short: 'Essential element required in small amounts (<100 mg/kg dry matter); Fe, Mn, Zn, Cu, B, Mo, Cl, Ni.',
    long: 'Deficiency and toxicity ranges are narrow; foliar analysis is critical. Most act as enzyme cofactors (e.g. Fe in cytochromes, Mo in nitrate reductase).',
  },
  {
    term: 'essential element',
    aliases: ['elemento esencial', 'essential nutrient'],
    category: 'plant',
    short: 'Chemical element required for a plant to complete its life cycle (17 elements).',
    long: 'CHOPKINS CaFe MgMnB CuZn MoClNi — Arnon & Stout criteria: specific function, irreplaceable, direct role in metabolism.',
  },
  {
    term: 'beneficial element',
    aliases: ['elemento benéfico', 'beneficial nutrient'],
    category: 'plant',
    short: 'Element not essential to all plants but stimulatory for some (Si, Na, Co, Se, V, Al, Ti).',
    long: 'Si strengthens cell walls in grasses (rice, sugarcane); Co for N-fixing legumes; Se in selenium-accumulator forages.',
  },
  {
    term: 'mobility',
    aliases: ['movilidad', 'nutrient mobility'],
    category: 'plant',
    short: 'Ability of an element to be retranslocated from old to young plant tissue.',
    long: 'Mobile nutrients (N, P, K, Mg, Cl, Mo) show deficiency on old leaves first; immobile nutrients (Ca, B, Fe, Mn, Zn, Cu, S) show on young leaves.',
  },
  {
    term: 'antagonism',
    aliases: ['antagonismo', 'ion antagonism'],
    category: 'plant',
    short: 'Inhibition of one ion uptake by another competing at the root absorption site.',
    long: 'Classic pairs: K⁺↔Mg²⁺, Ca²⁺↔Mg²⁺, Fe²⁺↔Mn²⁺, NH₄⁺↔K⁺, PO₄³⁻↔Zn²⁺. Mapped on the Mulder diagram.',
  },
  {
    term: 'synergy',
    aliases: ['sinergia', 'ion synergy'],
    category: 'plant',
    short: 'Enhancement of one ion uptake by another (e.g. NO₃⁻ improves K⁺ uptake).',
    long: 'NO₃⁻ uptake alkalinizes the rhizosphere and stimulates cation uptake; NH₄⁺ uptake acidifies and improves anion uptake. Mapped as dashed lines on the Mulder diagram.',
  },
  {
    term: 'Mulder diagram',
    aliases: ['diagrama de Mulder', 'Mulder chart'],
    category: 'plant',
    short: '14-ion chart of antagonism (solid) and synergy (dashed) relationships (Mulder, 1953).',
    long: 'Diagnostic reference for nutrient interaction: e.g. high K suppresses Mg → Mg deficiency despite adequate soil Mg. Central in the Nutrient Interactions tool.',
  },
  {
    term: 'mass flow',
    aliases: ['flujo másico', 'mass flow of nutrients'],
    category: 'plant',
    short: 'Nutrient transport to roots dissolved in transpiration-driven water flow.',
    long: 'Dominant mechanism for mobile nutrients (N-NO₃, S-SO₄, Ca, Mg, Cl). Accounts for ~80% of N uptake in maize.',
  },
  {
    term: 'diffusion',
    aliases: ['difusión'],
    category: 'plant',
    short: 'Nutrient movement down a concentration gradient to the depleted root surface.',
    long: 'Dominant mechanism for low-mobility nutrients (P, K, micronutrients). Root uptake lowers local concentration by 100–1000×, creating the gradient.',
  },
  {
    term: 'root interception',
    aliases: ['intercepción radical'],
    category: 'plant',
    short: 'Nutrient uptake by roots physically growing into fresh soil volumes.',
    long: 'Accounts for <10% of total nutrient uptake for most ions, but is significant for Ca in dense-rooted crops. Drives slow nutrient exploitation of bulk soil.',
  },
  {
    term: 'chlorosis',
    aliases: ['clorosis', 'yellowing'],
    category: 'plant',
    short: 'Loss of chlorophyll, leaves turn yellow while veins may remain green.',
    long: 'Most commonly Fe, S, or N deficiency. Interveinal chlorosis (green veins, yellow blade) is the classic signature of Fe, Mn or Zn immobile-element deficiency.',
  },
  {
    term: 'necrosis',
    aliases: ['necrosis', 'tissue death'],
    category: 'plant',
    short: 'Localized death of plant tissue; appears as brown, dry or papery lesions.',
    long: 'Final stage of severe deficiency or toxicity: K deficiency causes leaf-edge necrosis; B toxicity causes tip necrosis; Ca deficiency causes blossom-end rot.',
  },
  {
    term: 'interveinal',
    aliases: ['internervial', 'interveinal chlorosis'],
    category: 'plant',
    short: 'Affecting the tissue between leaf veins, leaving veins themselves green.',
    long: 'Diagnostic pattern for immobile micronutrient deficiencies (Fe, Mn, Zn) and Mg (mobile but translocates from interveinal tissue first).',
  },
  {
    term: 'blossom-end rot',
    aliases: ['BER', 'podredumbre apical', 'blossom end rot'],
    category: 'plant',
    short: 'Dark sunken necrotic lesion at the blossom end of tomato/pepper fruit; Ca deficiency.',
    long: 'Triggered by Ca transport failure during rapid fruit expansion, often under water stress rather than low soil Ca. Manage with consistent irrigation and Ca foliar sprays.',
  },

  // ===========================================================================
  // CLIMATE
  // ===========================================================================
  {
    term: 'VPD',
    aliases: ['vapor pressure deficit', 'déficit de presión de vapor'],
    category: 'climate',
    short: 'Vapor Pressure Deficit; difference between saturation and actual vapor pressure (kPa).',
    long: 'Drives transpiration. Optimum 0.8–1.2 kPa for most greenhouse crops; >1.5 kPa closes stomata and reduces photosynthesis, <0.4 kPa limits transpiration and Ca transport.',
  },
  {
    term: 'SVP',
    aliases: ['saturated vapor pressure', 'presión de vapor saturada', 'es'],
    category: 'climate',
    short: 'Saturation Vapor Pressure; maximum partial pressure of water vapor at a given temperature.',
    long: 'Calculated via Tetens equation: SVP = 0.6108 · exp(17.27·T / (T+237.3)) kPa. At 25°C, SVP ≈ 3.17 kPa.',
  },
  {
    term: 'humidity deficit',
    aliases: ['HD', 'déficit de humedad', 'air humidity deficit'],
    category: 'climate',
    short: 'Mass of water missing from saturated air at the current temperature (g/m³).',
    long: 'HD = saturated absolute humidity − actual absolute humidity. Directly proportional to VPD via the ideal gas law; used in greenhouse control systems.',
  },
  {
    term: 'ETo',
    aliases: ['reference evapotranspiration', 'evapotranspiración de referencia'],
    category: 'climate',
    short: 'Reference evapotranspiration; ET of a well-watered 0.12 m tall grass surface (mm/day).',
    long: 'Computed via FAO-56 Penman-Monteith from temperature, humidity, wind and solar radiation. Serves as the climate-driven baseline for crop ETc.',
  },
  {
    term: 'ETc',
    aliases: ['crop evapotranspiration', 'evapotranspiración del cultivo'],
    category: 'climate',
    short: 'Crop evapotranspiration under standard conditions (mm/day); ETc = Kc × ETo.',
    long: 'Represents water demand of a specific crop at a specific growth stage. Cumulative ETc over the season gives the irrigation requirement net of rainfall.',
  },
  {
    term: 'Kc',
    aliases: ['crop coefficient', 'coeficiente de cultivo'],
    category: 'climate',
    short: 'Crop coefficient; ratio of actual crop ET to reference grass ET at a given stage.',
    long: 'Four FAO-56 stages: initial (Kc_ini), development (rising), mid (Kc_mid, peak), late (Kc_end). Tabulated per crop in FAO-56 Annex 12.',
  },
  {
    term: 'FAO-56',
    aliases: ['FAO 56', 'Allen 1998', 'Penman-Monteith FAO'],
    category: 'climate',
    short: 'FAO Irrigation and Drainage Paper 56; standard reference for crop ET calculation.',
    long: 'Allen et al. (1998). Defines the dual/crop-coefficient approach, Kc tables for ~80 crops, and stress-adjustment equations. Universally adopted in irrigation scheduling software.',
  },
  {
    term: 'transpiration',
    aliases: ['transpiración'],
    category: 'climate',
    short: 'Water loss from plant leaves through stomata, driven by VPD.',
    long: 'Cools the leaf, transports nutrients via mass flow, and maintains turgor. Equal to ETc when soil evaporation is negligible (full canopy cover).',
  },
  {
    term: 'dew point',
    aliases: ['punto de rocío', 'Td'],
    category: 'climate',
    short: 'Temperature at which air becomes saturated (RH=100%) and dew starts to form.',
    long: 'Computed from vapor pressure via the Magnus formula. Difference between air T and Td indicates how close the air is to saturation; equals 0 in fog.',
  },
  {
    term: 'solar radiation',
    aliases: ['radiación solar', 'global radiation', 'Rs'],
    category: 'climate',
    short: 'Total shortwave radiation from the sun reaching a horizontal surface (W/m² or MJ/m²·d).',
    long: 'Drives photosynthesis and ET. Peak ~1000 W/m² at solar noon on a clear day; daily total 5–30 MJ/m²·d depending on latitude and season.',
  },
  {
    term: 'PAR',
    aliases: ['photosynthetically active radiation', 'radiación fotosintéticamente activa'],
    category: 'climate',
    short: 'Photosynthetically Active Radiation; 400–700 nm waveband, ~45% of total solar.',
    long: 'Measured in µmol photons/m²·s. Light-saturation point: ~500 µmol/m²·s for C3 crops, ~1500 for C4. Daily integral 10–50 mol/m²·d for productive canopies.',
  },

  // ===========================================================================
  // UNITS
  // ===========================================================================
  {
    term: 'ppm',
    aliases: ['parts per million', 'mg/kg'],
    category: 'units',
    short: 'Parts per million; 1 mg of solute per kg of solution (≈ mg/L in dilute water).',
    long: 'For irrigation water, 1 ppm = 1 mg/L = 1 g/m³. In concentrated stock solutions, density differs and the conversion is approximate.',
  },
  {
    term: 'mg/L',
    aliases: ['milligrams per litre', 'mg L-1'],
    category: 'units',
    short: 'Milligrams per litre; mass concentration, numerically equal to ppm in dilute water.',
    long: 'Standard water-test unit. For soil extracts (1:5 soil:water), mg/L in the extract × extraction ratio → mg/kg soil.',
  },
  {
    term: 'mmol/L',
    aliases: ['millimolar', 'mM', 'mmol L-1'],
    category: 'units',
    short: 'Millimoles per litre; molar concentration (1 mmol/L = 6.022×10²⁰ ions per litre).',
    long: 'Converts to ppm via molecular weight (1 mmol/L of Ca²⁺ = 40.08 mg/L Ca). Used in hydroponics and water chemistry for charge-balanced comparison.',
  },
  {
    term: 'µmol/L',
    aliases: ['micromolar', 'µM', 'umol/L', 'micromoles per litre'],
    category: 'units',
    short: 'Micromoles per litre; 1/1000 of mmol/L. Standard for micronutrients.',
    long: 'Typical tissue-Si is 100–1000 µmol/L in sap; hydroponic Fe is 5–50 µmol/L (= 0.28–2.8 mg/L Fe). Avoids small decimal values in mmol/L.',
  },
  {
    term: 'meq/L',
    aliases: ['milliequivalents per litre', 'meq L-1', 'miliequivalentes por litro'],
    category: 'units',
    short: 'Milliequivalents per litre; ion concentration weighted by charge. 1 meq/L = mmol/L × valence.',
    long: 'Used to charge-balance hydroponic and irrigation water analyses. Ca²⁺ at 1 meq/L = 0.5 mmol/L = 20 mg/L Ca; K⁺ at 1 meq/L = 1 mmol/L = 39.1 mg/L K.',
  },
  {
    term: 'dS/m',
    aliases: ['decisiemens per metre', 'dS m-1', 'mS/cm'],
    category: 'units',
    short: 'Decisiemens per metre; standard unit of electrical conductivity in soils and water.',
    long: '1 dS/m = 1 mS/cm = 1000 µS/cm. In water, ~640 mg/L TDS (NaCl) or ~10 meq/L of ions. In saturated soil paste, threshold for salinity stress is ~4 dS/m.',
  },
  {
    term: 'kPa',
    aliases: ['kilopascal', 'kPa pressure'],
    category: 'units',
    short: 'Kilopascal; 1000 Pa. Standard unit for vapor pressure and soil water potential.',
    long: 'Field capacity ≈ −33 kPa; permanent wilting point ≈ −1500 kPa. Saturation vapor pressure at 25°C ≈ 3.17 kPa. 1 bar = 100 kPa = 0.987 atm.',
  },
  {
    term: 'W/m²',
    aliases: ['watts per square metre', 'W m-2', 'irradiance'],
    category: 'units',
    short: 'Watts per square metre; instantaneous radiative flux density on a horizontal surface.',
    long: 'Solar noon peak ~1000 W/m² on a clear day. Convert to daily MJ/m²·d by integrating (1 W/m² × 1 h = 3.6 kJ/m²). PAR sensor reads separately in µmol/m²·s.',
  },
  {
    term: 'kg/ha',
    aliases: ['kilograms per hectare', 'kg ha-1'],
    category: 'units',
    short: 'Kilograms per hectare; standard nutrient-application rate. 1 kg/ha = 0.1 g/m².',
    long: 'Fertilizer rates are reported in product kg/ha, nutrient kg/ha, or nutrient kg/ha as oxide (N-P₂O₅-K₂O). 100 kg N/ha on 1 ha of 1.3 g/cm³ soil to 20 cm raises soil N by 38 mg/kg.',
  },
  {
    term: 'm³/ha',
    aliases: ['cubic metres per hectare', 'm3 ha-1', 'volume per hectare'],
    category: 'units',
    short: 'Cubic metres per hectare; irrigation or amendment volume per unit area. 1 m³/ha = 0.1 mm depth.',
    long: 'To convert irrigation depth in mm to volume: m³/ha = mm × 10. So 50 mm irrigation = 500 m³/ha. Used in water-balance calculations and drip-system design.',
  },
];

/**
 * Find a glossary entry by term or alias, case-insensitively.
 * Returns the first matching entry or null.
 */
export function findGlossary(term: string): GlossaryEntry | null {
  const t = term.trim().toLowerCase();
  if (!t) return null;
  for (const e of GLOSSARY) {
    if (e.term.toLowerCase() === t) return e;
    if (e.aliases.some(a => a.toLowerCase() === t)) return e;
  }
  return null;
}

/**
 * All categories in display order.
 */
export const GLOSSARY_CATEGORIES: GlossaryCategory[] = [
  'soil', 'water', 'fertilizer', 'plant', 'climate', 'units',
];

/**
 * Category labels for UI display.
 */
export const GLOSSARY_CATEGORY_LABELS: Record<GlossaryCategory, string> = {
  soil: 'Soil',
  water: 'Water',
  fertilizer: 'Fertilizer',
  plant: 'Plant',
  climate: 'Climate',
  units: 'Units',
};
