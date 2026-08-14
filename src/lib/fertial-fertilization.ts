/**
 * Fertial — Manuel d'utilisation des engrais
 *
 * Source-backed planning guidance extracted from the user-provided manual:
 * https://www.fertial-dz.com/fiches/Manuel-utilisation-des-engrais.pdf
 *
 * These records preserve the manual's ranges, units, season windows, and
 * agronomic qualifiers. They are planning references, not prescriptions.
 * Existing FormulaAtlas soil-credit and crop-lifecycle calculations remain
 * authoritative for the numeric planner output.
 */

export type FertialPhase = 'foundation' | 'maintenance' | 'split' | 'seasonal' | 'context' | 'organic';
export type FertialMethod = 'broadcast' | 'band' | 'localized' | 'incorporated' | 'fertigation' | 'foliar' | 'organic' | 'side_dress';
export type FertialNutrientUnit = 'U/ha' | 'kg/ha' | 't/ha' | 'kg/palm';

export interface FertialRange {
  min: number;
  max?: number;
  unit: FertialNutrientUnit;
}

export interface FertialAmounts {
  n?: FertialRange;
  p2o5?: FertialRange;
  k2o?: FertialRange;
  s?: FertialRange;
  manure?: FertialRange;
}

export interface FertialApplication {
  phase: FertialPhase;
  timing: string;
  amounts: FertialAmounts;
  method: FertialMethod;
  note: string;
}

export interface FertialFormulaCard {
  id: string;
  title: string;
  formula: string;
  variables: string;
  use: string;
}

export interface FertialCropGuidance {
  id: string;
  aliases: string[];
  name: string;
  nameFr: string;
  nameAr: string;
  category: string;
  summary: string;
  context: string[];
  applications: FertialApplication[];
  formulas: FertialFormulaCard[];
  cautions: string[];
  source: {
    document: string;
    url: string;
    pages: string;
  };
}

export const FERTIAL_MANUAL_SOURCE = {
  document: "Manuel d'utilisation des engrais",
  url: 'https://www.fertial-dz.com/fiches/Manuel-utilisation-des-engrais.pdf',
  publisher: 'Fertial',
  language: 'fr',
} as const;

const commonFormulas: FertialFormulaCard[] = [
  {
    id: 'fertial-nutrient-from-product',
    title: 'Nutrient supplied by a fertilizer product',
    formula: 'Nutrient supplied (kg/ha) = product rate (kg/ha) × analysis (%) ÷ 100',
    variables: 'Use the N, P₂O₅, K₂O, or S percentage printed on the product label.',
    use: 'Translate a product dose into nutrient units before comparing it with a crop target.',
  },
  {
    id: 'fertial-product-rate',
    title: 'Product rate from a nutrient target',
    formula: 'Product rate (kg/ha) = nutrient target (kg/ha) ÷ analysis fraction',
    variables: 'Analysis fraction = label percentage ÷ 100; for example, 46% N = 0.46.',
    use: 'Convert a nutrient plan into a product quantity only after confirming the label and soil plan.',
  },
  {
    id: 'fertial-split-n',
    title: 'Split nitrogen application',
    formula: 'Stage N (U/ha) = seasonal N (U/ha) × stage share (%) ÷ 100',
    variables: 'Stage shares come from the crop, rainfall zone, irrigation mode, and growth stage.',
    use: 'Keep nitrogen close to crop demand and reduce loss risk; never treat the share as universal.',
  },
  {
    id: 'fertial-season-total',
    title: 'Seasonal nutrient total',
    formula: 'Season total = foundation + maintenance applications',
    variables: 'Sum each nutrient separately: N, P₂O₅, K₂O, and S.',
    use: 'Check that calendar stages reconcile with the source-backed seasonal range.',
  },
  {
    id: 'fertial-manure-n',
    title: 'First-year available manure nitrogen',
    formula: 'Available N = manure rate × total manure N × first-year availability factor',
    variables: 'The factor depends on material analysis and incorporation timing; FormulaAtlas keeps this as a separate soil-credit calculation.',
    use: 'Avoid double-counting organic nitrogen when balancing mineral fertilizer.',
  },
];

const range = (min: number, unit: FertialNutrientUnit, max?: number): FertialRange => ({ min, max, unit });

function guidance(input: Omit<FertialCropGuidance, 'formulas' | 'source' | 'cautions'> & { pages: string; cautions?: string[] }): FertialCropGuidance {
  return {
    ...input,
    cautions: input.cautions ?? [],
    formulas: commonFormulas,
    source: { ...FERTIAL_MANUAL_SOURCE, pages: input.pages },
  };
}

export const FERTIAL_CROP_GUIDANCE: FertialCropGuidance[] = [
  guidance({
    id: 'oats', aliases: ['oat', 'avoine'], name: 'Oats', nameFr: 'Avoine', nameAr: 'الشوفان', category: 'Cereal',
    summary: 'Foundation P₂O₅ and K₂O depend on rainfall zone; N is reduced or split in semi-arid conditions.',
    context: ['Favorable Littoral/Sublittoral zones use the higher P range.', 'Below 400 mm rainfall, use the lower P and N pattern and omit later N under drought risk.'],
    applications: [
      { phase: 'foundation', timing: 'September foundation', amounts: { p2o5: range(46, 'U/ha', 70), k2o: range(50, 'U/ha') }, method: 'incorporated', note: 'Use 70 P₂O₅ in favorable zones and 46 P₂O₅ in semi-arid High Plateaux conditions.' },
      { phase: 'split', timing: 'October sowing; January tillering in favorable zones', amounts: { n: range(15, 'U/ha', 46) }, method: 'broadcast', note: 'The manual gives 15 N at sowing plus about 30 N at tillering in favorable zones; semi-arid crops may receive only the sowing portion.' },
    ], pages: '41–42; extracted lines 1172–1193',
  }),
  guidance({
    id: 'barley', aliases: ['orge', 'orge de printemps'], name: 'Barley', nameFr: 'Orge', nameAr: 'الشعير', category: 'Cereal',
    summary: 'Rainfall-zone schedule with a drought-sensitive tillering application.',
    context: ['Use 400–600 mm and below-400 mm rainfall patterns separately.', 'Green barley may need additional N after each cut or grazing.'],
    applications: [
      { phase: 'foundation', timing: 'September before sowing', amounts: { p2o5: range(46, 'U/ha', 70), k2o: range(50, 'U/ha') }, method: 'incorporated', note: '70 P₂O₅ in 400–600 mm zones; 46 P₂O₅ below 400 mm.' },
      { phase: 'split', timing: 'September sowing + December tillering', amounts: { n: range(46, 'U/ha', 70) }, method: 'broadcast', note: 'Split about 30 + 40 N in wetter zones or 15 + 30 N below 400 mm; omit the second tranche under drought.' },
      { phase: 'maintenance', timing: 'After each green-barley cut or grazing', amounts: { n: range(0, 'U/ha') }, method: 'broadcast', note: 'Reassess crop demand and recovery after each cut; the manual indicates additional N may be needed.' },
    ], pages: '41–44; extracted lines 1198–1235',
  }),
  guidance({
    id: 'triticale', aliases: ['triticale'], name: 'Triticale', nameFr: 'Triticale', nameAr: 'التريتيكال', category: 'Cereal',
    summary: 'P/K foundation and N depend strongly on rainfall, with N potentially omitted in very dry zones.',
    context: ['Above 450 mm, the higher P foundation is used; below 400 mm, the lower P pattern applies.', 'At 200–250 mm rainfall, the manual allows N to be omitted.'],
    applications: [
      { phase: 'foundation', timing: 'September foundation', amounts: { p2o5: range(46, 'U/ha', 92), k2o: range(50, 'U/ha') }, method: 'incorporated', note: 'Select the rainfall-zone pattern before generating the calendar.' },
      { phase: 'split', timing: 'Sowing and tillering according to rainfall', amounts: { n: range(0, 'U/ha', 92) }, method: 'broadcast', note: 'Use source-specific single or split applications; do not assume a fixed N dose.' },
    ], pages: '44–46; extracted lines 1237–1278',
  }),
  guidance({
    id: 'wheat', aliases: ['durum wheat', 'soft wheat', 'blé dur', 'blé tendre', 'قمح'], name: 'Wheat', nameFr: 'Blé', nameAr: 'القمح', category: 'Cereal',
    summary: 'Durum and soft wheat use autumn P/K foundation and rainfall-zone N splits around sowing and tillering.',
    context: ['Durum wheat above 600 mm uses the higher P/N pattern; 400–600 mm uses the lower pattern.', 'Soft wheat uses an above-450 mm versus below-450 mm pattern.', 'PK is placed before ploughing or first harrowing; N is commonly split.'],
    applications: [
      { phase: 'foundation', timing: 'Autumn, before ploughing or first harrowing', amounts: { p2o5: range(46, 'U/ha', 92), k2o: range(50, 'U/ha') }, method: 'incorporated', note: 'Use 92 P₂O₅ in the wetter durum/soft-wheat zones and 46 P₂O₅ in the lower-rainfall patterns.' },
      { phase: 'split', timing: 'October sowing + January–February tillering', amounts: { n: range(46, 'U/ha', 92) }, method: 'broadcast', note: 'About 33 + 60 N in the higher-rainfall durum pattern; about 15 + 30 N in the 400–600 mm pattern.' },
      { phase: 'maintenance', timing: 'About 15 days after weeding when conditions support it', amounts: { n: range(0, 'U/ha') }, method: 'broadcast', note: 'The general cereal guidance allows a second N application after weeding; weather and soil depth must control the decision.' },
    ], pages: '41–49; extracted lines 1158–1168 and 1280–1344',
  }),
  guidance({
    id: 'alfalfa', aliases: ['luzerne', 'lucerne', 'برسيم'], name: 'Alfalfa', nameFr: 'Luzerne', nameAr: 'الفصفصة', category: 'Forage',
    summary: 'High P/K foundation in the first year with modest establishment N and season-dependent sowing windows.',
    context: ['First-year P/K is the main mineral foundation.', 'A small establishment N dose supports the crop before biological N fixation is fully functional.'],
    applications: [
      { phase: 'foundation', timing: 'September in coastal/subcoastal zones or December–January in High Plateaux/plains', amounts: { p2o5: range(140, 'U/ha'), k2o: range(100, 'U/ha') }, method: 'incorporated', note: 'First-year foundation schedule from the manual.' },
      { phase: 'maintenance', timing: 'At sowing / establishment', amounts: { n: range(10, 'U/ha') }, method: 'broadcast', note: 'Use only as an establishment aid; do not treat it as a blanket annual mineral-N requirement.' },
    ], pages: '50–53; extracted lines 1369–1404',
  }),
  guidance({
    id: 'fodder-sorghum', aliases: ['sorghum', 'sorgho fourrager', 'ذرة رفيعة علفية'], name: 'Fodder sorghum', nameFr: 'Sorgho fourrager', nameAr: 'الذرة الرفيعة العلفية', category: 'Forage',
    summary: 'Autumn P/K foundation with N split between sowing and the first cut.',
    context: ['First-cut timing is about 6–8 weeks after sowing.', 'Reassess after cuts rather than applying a fixed annual total blindly.'],
    applications: [
      { phase: 'foundation', timing: 'September–October ploughing', amounts: { p2o5: range(92, 'U/ha'), k2o: range(100, 'U/ha') }, method: 'incorporated', note: 'Foundation before the forage season.' },
      { phase: 'split', timing: 'Late March–early May sowing + first cut 6–8 weeks later', amounts: { n: range(92, 'U/ha') }, method: 'broadcast', note: 'About 33 N at sowing and 60 N after the first cut.' },
    ], pages: '50–54; extracted lines 1405–1424',
  }),
  guidance({
    id: 'fodder-maize', aliases: ['maize forage', 'maïs fourrager', 'ذرة علفية'], name: 'Fodder maize', nameFr: 'Maïs fourrager', nameAr: 'الذرة العلفية', category: 'Forage',
    summary: 'September–October P/K foundation with N split between spring sowing and first-cut recovery.',
    context: ['First-cut timing is about 8–10 weeks after sowing.', 'Use the existing maize lifecycle for irrigation and phenology; this profile supplies the Fertial nutrient context.'],
    applications: [
      { phase: 'foundation', timing: 'September–October ploughing', amounts: { p2o5: range(100, 'U/ha'), k2o: range(100, 'U/ha') }, method: 'incorporated', note: 'Foundation before the forage season.' },
      { phase: 'split', timing: 'March–April sowing + first cut 8–10 weeks later', amounts: { n: range(92, 'U/ha') }, method: 'broadcast', note: 'About 33 N at sowing and 60 N after the first cut.' },
    ], pages: '50–54; extracted lines 1425–1444',
  }),
  guidance({
    id: 'italian-ryegrass', aliases: ['ray-grass italien', 'ray grass', 'راي غراس'], name: 'Italian ryegrass', nameFr: 'Ray-grass italien', nameAr: 'الراي غراس الإيطالي', category: 'Forage',
    summary: 'Autumn P/K foundation, sowing N, and small N recovery applications after cuts.',
    context: ['The manual places recovery N after cuts in late January, February, and March.', 'Use cut history in the Field Record Book to avoid duplicate applications.'],
    applications: [
      { phase: 'foundation', timing: 'September–October ploughing', amounts: { p2o5: range(90, 'U/ha'), k2o: range(100, 'U/ha') }, method: 'incorporated', note: 'Foundation before sowing.' },
      { phase: 'split', timing: 'October sowing, then after each cut in late January–February–March', amounts: { n: range(30, 'U/ha', 92) }, method: 'broadcast', note: 'About 92 N at sowing and 30 N after each cut.' },
    ], pages: '53–54; extracted lines 1445–1467',
  }),
  guidance({
    id: 'chickpea', aliases: ['pois chiche', 'pois-chiche', 'حمص'], name: 'Chickpea', nameFr: 'Pois chiche', nameAr: 'الحمص', category: 'Legume',
    summary: 'P/K foundation with little or no N after nodulation; a small establishment dose is optional.',
    context: ['Winter chickpea foundation is mid-November to mid-December.', 'Spring chickpea foundation is mid-February to mid-March.', 'The manual’s low-N guidance is not a blanket zero-N rule before nodulation is functional.'],
    applications: [
      { phase: 'foundation', timing: 'Mid-November–mid-December winter crop or mid-February–mid-March spring crop', amounts: { p2o5: range(92, 'U/ha'), k2o: range(50, 'U/ha') }, method: 'incorporated', note: 'Apply at ploughing.' },
      { phase: 'maintenance', timing: 'Three-leaf stage, about six weeks after sowing', amounts: { n: range(20, 'U/ha') }, method: 'broadcast', note: 'Optional establishment support before nodulation is functional; reassess crop and soil.' },
    ], pages: '56–57; extracted lines 1493–1525',
  }),
  guidance({
    id: 'lentil', aliases: ['lentille', 'عدس'], name: 'Lentil', nameFr: 'Lentille', nameAr: 'العدس', category: 'Legume',
    summary: 'P/K foundation with low-N establishment guidance and altitude-sensitive timing.',
    context: ['N is generally not required after nodulation; a small sowing dose may support establishment.', 'Use the calendar’s inoculation/nodulation note instead of forcing a zero-N output.'],
    applications: [
      { phase: 'foundation', timing: 'Ploughing or before sowing; generally mid-November–mid-December', amounts: { p2o5: range(92, 'U/ha'), k2o: range(50, 'U/ha') }, method: 'incorporated', note: 'Adjust timing for altitude and local crop calendar.' },
      { phase: 'maintenance', timing: 'At sowing if establishment is weak', amounts: { n: range(20, 'U/ha') }, method: 'broadcast', note: 'Optional establishment dose; do not treat as a routine late-season N requirement.' },
    ], pages: '57; extracted lines 1527–1555',
  }),
  guidance({
    id: 'sunflower', aliases: ['tournesol', 'دوار الشمس'], name: 'Sunflower', nameFr: 'Tournesol', nameAr: 'دوّار الشمس', category: 'Oilseed',
    summary: 'Autumn P/K foundation with N split between sowing and hoeing.',
    context: ['Use the hoeing stage when rows are visible for the second N tranche.', 'The existing crop lifecycle remains responsible for phenology and irrigation.'],
    applications: [
      { phase: 'foundation', timing: 'September autumn ploughing', amounts: { p2o5: range(46, 'U/ha'), k2o: range(100, 'U/ha') }, method: 'incorporated', note: 'Foundation before the crop.' },
      { phase: 'split', timing: 'February–early March sowing + March hoeing when rows are visible', amounts: { n: range(92, 'U/ha') }, method: 'broadcast', note: 'About 33 N at sowing and 60 N at hoeing.' },
    ], pages: '58–59; extracted lines 1580–1603',
  }),
  guidance({
    id: 'rapeseed', aliases: ['canola', 'colza', 'rapeseed', 'colza oléagineux', 'كانولا'], name: 'Rapeseed', nameFr: 'Colza', nameAr: 'الكانولا', category: 'Oilseed',
    summary: 'Higher K demand during stem elongation, with S needed for yield and a two-stage N split.',
    context: ['The manual describes rapeseed as more demanding in K than P.', 'Use 150 K₂O in K-poor soils versus about 100 K₂O in medium-K soils.', 'S is a separate nutrient and must not be hidden inside K totals.'],
    applications: [
      { phase: 'foundation', timing: 'At sowing, October–early November', amounts: { n: range(40, 'U/ha'), p2o5: range(90, 'U/ha'), k2o: range(100, 'U/ha', 150) }, method: 'incorporated', note: 'Use the higher K range for K-poor soils.' },
      { phase: 'split', timing: 'February–March stem elongation', amounts: { n: range(80, 'U/ha'), s: range(50, 'U/ha') }, method: 'broadcast', note: 'Stem elongation is the key K/S and second-N decision stage.' },
    ], pages: '59–60; extracted lines 1604–1626',
  }),
  guidance({
    id: 'citrus', aliases: ['agrumes', 'orange', 'mandarin', 'حمضيات'], name: 'Citrus', nameFr: 'Agrumes', nameAr: 'الحمضيات', category: 'Orchard',
    summary: 'Tree-age and production-stage guidance with autumn P/K, organic matter, optional green manure, and split N.',
    context: ['Do not collapse young orchard and full-production schedules.', 'Green manure options listed by the manual include faba bean, vetch, and mustard.', 'Use root-zone placement and orchard age as separate inputs.'],
    applications: [
      { phase: 'foundation', timing: 'Establishment, June–August', amounts: { p2o5: range(450, 'U/ha', 500), k2o: range(600, 'U/ha', 700) }, method: 'incorporated', note: 'Young-orchard installation foundation.' },
      { phase: 'maintenance', timing: 'Young orchard first year, June + July + August', amounts: { n: range(30, 'U/ha') }, method: 'localized', note: 'Split 15 + 7.5 + 7.5 N.' },
      { phase: 'foundation', timing: 'Full production, September–October', amounts: { p2o5: range(100, 'U/ha', 120), k2o: range(100, 'U/ha', 160) }, method: 'localized', note: 'Combine with organic matter; optional green manure is incorporated in February before flowering.' },
      { phase: 'split', timing: 'February–March before flowering; May–June fruit set; August–September autumn growth', amounts: { n: range(250, 'U/ha', 300) }, method: 'localized', note: 'Full-production N is split across the three seasonal demand periods.' },
    ], pages: '64–69; extracted lines 1662–1751',
  }),
  guidance({
    id: 'pome-fruit', aliases: ['apple', 'pear', 'quince', 'pomme', 'poire', 'pommier', 'تفاح', 'كمثرى'], name: 'Pome fruit', nameFr: 'Pomme / poire / cognassier', nameAr: 'الفواكه التفاحية', category: 'Orchard',
    summary: 'Separate young-tree and mature-tree schedules with autumn P/K and split N across flowering, fruit growth, and late season.',
    context: ['The manual gives separate species patterns; this grouped profile is a planning index, not a single prescription.', 'Tree age, species, irrigation mode, and soil analysis must be collected before application.'],
    applications: [
      { phase: 'foundation', timing: 'Establishment, June–August', amounts: { p2o5: range(400, 'U/ha', 500), k2o: range(500, 'U/ha', 600) }, method: 'incorporated', note: 'Installation foundation.' },
      { phase: 'maintenance', timing: 'Young trees, each plantation year', amounts: { n: range(20, 'U/ha') }, method: 'localized', note: 'Split by species and stage.' },
      { phase: 'foundation', timing: 'Mature trees, autumn', amounts: { p2o5: range(80, 'U/ha', 120), k2o: range(120, 'U/ha', 160) }, method: 'localized', note: 'The mature ranges vary by apple, pear, quince, and related species.' },
      { phase: 'split', timing: 'Bud break/flowering + shoot/fruit growth + late season', amounts: { n: range(160, 'U/ha', 200) }, method: 'localized', note: 'Use species and irrigation mode to allocate the seasonal N.' },
    ], pages: '70–80; extracted lines 1766–2045',
  }),
  guidance({
    id: 'stone-fruit', aliases: ['apricot', 'peach', 'plum', 'cherry', 'abricot', 'pêche', 'prune', 'cerise', 'مشمش', 'خوخ', 'برقوق', 'كرز'], name: 'Stone fruit', nameFr: 'Fruits à noyau', nameAr: 'الفواكه ذات النواة', category: 'Orchard',
    summary: 'Establishment P/K and young-tree N differ from mature autumn P/K and seasonal N splits.',
    context: ['Apricot, peach, plum, and cherry must remain separate in a production plan.', 'Rainfed and irrigated variants differ, especially for apricot.', 'Cherry mature N is split around February, May, and July.'],
    applications: [
      { phase: 'foundation', timing: 'Establishment, June–August', amounts: { p2o5: range(400, 'U/ha', 500), k2o: range(500, 'U/ha', 600) }, method: 'incorporated', note: 'Installation foundation.' },
      { phase: 'maintenance', timing: 'Young trees, plantation year', amounts: { n: range(20, 'U/ha') }, method: 'localized', note: 'Use the species-specific split.' },
      { phase: 'foundation', timing: 'Mature trees, September–October', amounts: { p2o5: range(60, 'U/ha', 80), k2o: range(100, 'U/ha', 120) }, method: 'localized', note: 'Mature autumn P/K range.' },
      { phase: 'split', timing: 'February + spring growth/fruit development + July', amounts: { n: range(140, 'U/ha', 180) }, method: 'localized', note: 'Use crop, tree age, and irrigation mode to assign the split.' },
      { phase: 'split', timing: 'Cherry: February + April–May + July', amounts: { n: range(140, 'U/ha', 180) }, method: 'localized', note: 'Cherry young trees use about 4 + 12 + 4 N; mature trees use the higher seasonal range.' },
    ], pages: '80–92; extracted lines 2062–2349',
  }),
  guidance({
    id: 'almond', aliases: ['amandier', 'amande', 'لوز'], name: 'Almond', nameFr: 'Amandier', nameAr: 'اللوز', category: 'Orchard',
    summary: 'Young almonds receive a small January N dose; mature trees receive autumn P/K and January N.',
    context: ['Keep tree age explicit.', 'Use local soil and rainfed/irrigated context before selecting a mature-tree range.'],
    applications: [
      { phase: 'maintenance', timing: 'Young trees, January', amounts: { n: range(20, 'U/ha') }, method: 'localized', note: 'Single young-tree N application in the manual.' },
      { phase: 'foundation', timing: 'Mature trees, autumn', amounts: { p2o5: range(60, 'U/ha', 80), k2o: range(100, 'U/ha', 120) }, method: 'localized', note: 'Autumn P/K.' },
      { phase: 'split', timing: 'Mature trees, January', amounts: { n: range(90, 'U/ha') }, method: 'localized', note: 'Mature-tree N guidance.' },
    ], pages: '92–94; extracted lines 2353–2398',
  }),
  guidance({
    id: 'olive', aliases: ['olivier', 'olivaie', 'زيتون'], name: 'Olive', nameFr: 'Olivier', nameAr: 'الزيتون', category: 'Orchard',
    summary: 'Olive guidance changes by tree age and rainfed/irrigated system, with band placement below the canopy.',
    context: ['Establishment at 800 trees/ha uses a distinct P/K foundation.', 'Young N is split October–February–April when rainfed or February–April–June when irrigated.', 'Mature irrigated olive N is higher than mature rainfed N.', 'P/K is localized 20–25 cm deep in September–October.'],
    applications: [
      { phase: 'foundation', timing: 'Establishment, June–August; 800 trees/ha', amounts: { p2o5: range(300, 'U/ha'), k2o: range(300, 'U/ha') }, method: 'incorporated', note: 'Installation foundation.' },
      { phase: 'split', timing: 'Young rainfed: October + February + April; young irrigated: February + April + June', amounts: { n: range(40, 'U/ha') }, method: 'band', note: 'Apply on a 2–3 m band below the canopy.' },
      { phase: 'split', timing: 'Mature rainfed: October + February + April', amounts: { n: range(50, 'U/ha', 80) }, method: 'band', note: 'Mature rainfed seasonal range.' },
      { phase: 'split', timing: 'Mature irrigated: February + April + June', amounts: { n: range(110, 'U/ha', 150) }, method: 'band', note: 'Mature irrigated seasonal range.' },
      { phase: 'foundation', timing: 'Mature trees, September–October', amounts: { p2o5: range(60, 'U/ha', 80), k2o: range(100, 'U/ha', 120) }, method: 'localized', note: 'The manual also cites an approximate P≈N/3 and K≈2N/3 relationship as a planning guide.' },
    ], pages: '95–98; extracted lines 2416–2496',
  }),
  guidance({
    id: 'grapes', aliases: ['grape', 'vigne', 'raisin', 'عنب'], name: 'Table and wine grapes', nameFr: 'Vigne de table et de cuve', nameAr: 'عنب المائدة والنبيذ', category: 'Vineyard',
    summary: 'Vineyard installation uses summer P/K; mature table and wine grapes have separate autumn and spring schedules.',
    context: ['Keep table grapes and wine grapes as separate production profiles.', 'Spring N is split before bud break and before flowering.'],
    applications: [
      { phase: 'foundation', timing: 'Vineyard establishment, June–August; about 2,200 plants/ha', amounts: { p2o5: range(200, 'U/ha', 300), k2o: range(300, 'U/ha') }, method: 'incorporated', note: 'Installation foundation.' },
      { phase: 'foundation', timing: 'Mature table grapes, October–December', amounts: { p2o5: range(80, 'U/ha'), k2o: range(100, 'U/ha') }, method: 'localized', note: 'Autumn table-grape P/K.' },
      { phase: 'split', timing: 'Table grapes: February before bud break + April before flowering', amounts: { n: range(140, 'U/ha') }, method: 'localized', note: 'Split 70 + 70 N.' },
      { phase: 'foundation', timing: 'Mature wine grapes, October–December', amounts: { p2o5: range(40, 'U/ha'), k2o: range(50, 'U/ha') }, method: 'localized', note: 'Autumn wine-grape P/K.' },
      { phase: 'split', timing: 'Wine grapes: February + April', amounts: { n: range(92, 'U/ha') }, method: 'localized', note: 'Split 46 + 46 N.' },
    ], pages: '98–100; extracted lines 2512–2559',
  }),
  guidance({
    id: 'date-palm', aliases: ['palmier dattier', 'date palm', 'نخيل'], name: 'Date palm', nameFr: 'Palmier dattier', nameAr: 'نخيل التمر', category: 'Oasis orchard',
    summary: 'Arid-oasis guidance prioritizes organic matter and warns against excessive mineral P/K that can increase salinity/EC.',
    context: ['Keep organic matter and salinity/EC visible in the plan.', 'N is localized in a one-sided trench.', 'The printed source contains an apparent unit inconsistency between the annual U/ha estimate and the per-palm example.'],
    applications: [
      { phase: 'organic', timing: 'First three years', amounts: { manure: range(20, 'kg/palm') }, method: 'organic', note: 'About 20 kg manure/palm/year.' },
      { phase: 'organic', timing: 'Trees over ten years', amounts: { manure: range(100, 'kg/palm') }, method: 'organic', note: 'About 100 kg manure/palm/year.' },
      { phase: 'split', timing: 'Flowering February + fruit set May + fruit enlargement June', amounts: { n: range(400, 'U/ha', 600) }, method: 'localized', note: 'The manual also prints 1 U/palm at each event; preserve both values and require agronomist review before application.' },
    ], pages: '101–102; extracted lines 2575–2613',
  }),
  guidance({
    id: 'potato', aliases: ['pomme de terre', 'بطاطا'], name: 'Potato', nameFr: 'Pomme de terre', nameAr: 'البطاطا', category: 'Vegetable',
    summary: 'Foundation manure and N/P/K vary by primeur, seasonal, or late-season planting; maintenance N/K is placed at hilling or hoeing.',
    context: ['Planting window changes the maintenance month: January for primeur, April–May for seasonal, September–October for late-season.', 'Use the existing potato lifecycle for stage dates and this profile for source-backed ranges.'],
    applications: [
      { phase: 'foundation', timing: 'Before planting; primeur Nov–Dec, seasonal Feb–Mar, late Aug–Sep', amounts: { manure: range(30, 't/ha', 40), n: range(80, 'U/ha', 100), p2o5: range(100, 'U/ha', 120), k2o: range(200, 'U/ha', 240) }, method: 'incorporated', note: 'Foundation dose from the manual.' },
      { phase: 'maintenance', timing: 'At hilling/hoeing; Jan primeur, Apr–May seasonal, Sep–Oct late season', amounts: { n: range(70, 'U/ha'), k2o: range(90, 'U/ha') }, method: 'side_dress', note: 'Place close to the active root zone and avoid runoff before rainfall.' },
    ], pages: '104–105; extracted lines 2646–2674',
  }),
  guidance({
    id: 'tomato', aliases: ['tomate', 'طماطم'], name: 'Tomato', nameFr: 'Tomate', nameAr: 'الطماطم', category: 'Vegetable',
    summary: 'High foundation manure/N/P/K with five maintenance applications emphasizing fruit development.',
    context: ['The schedule is for fresh/field tomato; industrial tomato is stored separately.', 'The manual’s application totals should be reconciled with soil analysis and the existing nutrient-budget credits.'],
    applications: [
      { phase: 'foundation', timing: 'Before planting', amounts: { manure: range(30, 't/ha', 40), n: range(180, 'U/ha'), p2o5: range(70, 'U/ha'), k2o: range(200, 'U/ha', 250) }, method: 'incorporated', note: 'Foundation dose.' },
      { phase: 'split', timing: 'Five maintenance applications from establishment through fruiting', amounts: { n: range(180, 'U/ha'), k2o: range(280, 'U/ha') }, method: 'fertigation', note: 'The printed split is 60 N + 50 K in applications 1–2, then 20 N + 60 K in applications 3–5.' },
    ], pages: '105–106; extracted lines 2676–2705',
  }),
  guidance({
    id: 'industrial-tomato', aliases: ['tomate industrielle', 'tomato processing', 'طماطم صناعية'], name: 'Industrial tomato', nameFr: 'Tomate industrielle', nameAr: 'الطماطم الصناعية', category: 'Industrial crop',
    summary: 'Irrigated and rainfed industrial tomato have separate foundation and two-stage N schedules.',
    context: ['Do not merge irrigated and rainfed schedules.', 'The second N stage is fruit set; use the existing crop calendar for local date translation.'],
    applications: [
      { phase: 'foundation', timing: 'Irrigated, before planting', amounts: { manure: range(30, 't/ha', 40), n: range(90, 'U/ha', 120), p2o5: range(120, 'U/ha'), k2o: range(120, 'U/ha') }, method: 'incorporated', note: 'Foundation for irrigated industrial tomato.' },
      { phase: 'split', timing: 'Irrigated: one month after planting + fruit set', amounts: { n: range(140, 'U/ha', 180) }, method: 'side_dress', note: 'Split into the two source-defined stages.' },
      { phase: 'foundation', timing: 'Rainfed, before planting', amounts: { manure: range(30, 't/ha', 40), n: range(70, 'U/ha', 90), p2o5: range(90, 'U/ha'), k2o: range(90, 'U/ha') }, method: 'incorporated', note: 'Foundation for rainfed industrial tomato.' },
      { phase: 'split', timing: 'Rainfed: one month after planting + fruit set', amounts: { n: range(92, 'U/ha') }, method: 'side_dress', note: 'Split 46 + 46 N.' },
    ], pages: '128–130; extracted lines 3258–3293',
  }),
  guidance({
    id: 'pepper', aliases: ['bell pepper', 'poivron', 'فلفل'], name: 'Pepper', nameFr: 'Poivron', nameAr: 'الفلفل', category: 'Vegetable',
    summary: 'Foundation manure/N/P/K followed by four maintenance stages from pre-flowering to after first harvest.',
    context: ['Keep pre-flowering, fruit set, fruiting, and post-first-harvest stages distinct.', 'The existing bell-pepper lifecycle can provide the relative stage dates.'],
    applications: [
      { phase: 'foundation', timing: 'Before planting', amounts: { manure: range(30, 't/ha', 35), n: range(180, 'U/ha', 200), p2o5: range(80, 'U/ha', 100), k2o: range(200, 'U/ha', 250) }, method: 'incorporated', note: 'Foundation dose.' },
      { phase: 'split', timing: 'Pre-flowering + fruit set + fruiting + after first harvest', amounts: { n: range(130, 'U/ha'), k2o: range(210, 'U/ha') }, method: 'fertigation', note: 'Four stage-based maintenance applications.' },
    ], pages: '106–107; extracted lines 2711–2740',
  }),
  guidance({
    id: 'eggplant', aliases: ['aubergine', 'aubergine', 'باذنجان'], name: 'Eggplant', nameFr: 'Aubergine', nameAr: 'الباذنجان', category: 'Vegetable',
    summary: 'Pepper-like foundation with three N maintenance applications and a final fruit-enlargement K dose.',
    context: ['Do not substitute the pepper schedule: eggplant has its own foundation and maintenance ranges.', 'Use fruit enlargement as the final K checkpoint.'],
    applications: [
      { phase: 'foundation', timing: 'Before planting', amounts: { manure: range(30, 't/ha', 40), n: range(100, 'U/ha'), p2o5: range(150, 'U/ha'), k2o: range(200, 'U/ha') }, method: 'incorporated', note: 'Foundation dose.' },
      { phase: 'split', timing: 'Three maintenance applications through fruit enlargement', amounts: { n: range(120, 'U/ha'), k2o: range(100, 'U/ha') }, method: 'fertigation', note: 'Three 40-N applications; 100 K₂O is included in the third fruit-enlargement application.' },
    ], pages: '107; extracted lines 2742–2769',
  }),
  guidance({
    id: 'cabbage', aliases: ['chou', 'chou pommé', 'ملفوف'], name: 'Cabbage', nameFr: 'Chou', nameAr: 'الملفوف', category: 'Vegetable',
    summary: 'September foundation with transplant and three-week follow-up applications.',
    context: ['Keep transplant and three-week follow-up events in the calendar.', 'Confirm crop stage and soil analysis before applying additional P.'],
    applications: [
      { phase: 'foundation', timing: 'September', amounts: { manure: range(40, 't/ha'), n: range(70, 'U/ha'), p2o5: range(130, 'U/ha'), k2o: range(80, 'U/ha') }, method: 'incorporated', note: 'Foundation before the crop.' },
      { phase: 'split', timing: 'At transplant + three weeks later', amounts: { n: range(60, 'U/ha'), p2o5: range(40, 'U/ha'), k2o: range(30, 'U/ha') }, method: 'side_dress', note: '30 N at transplant, then 30 N + 40 P₂O₅ + 30 K₂O three weeks later.' },
    ], pages: '109–110; extracted lines 2791–2810',
  }),
  guidance({
    id: 'cauliflower', aliases: ['chou-fleur', 'قرنبيط'], name: 'Cauliflower', nameFr: 'Chou-fleur', nameAr: 'القرنبيط', category: 'Vegetable',
    summary: 'July foundation with small N follow-up applications at transplant and three weeks later.',
    context: ['Use the shorter maintenance schedule rather than cabbage’s P/K follow-up.'],
    applications: [
      { phase: 'foundation', timing: 'July', amounts: { manure: range(40, 't/ha'), n: range(100, 'U/ha', 150), p2o5: range(80, 'U/ha', 100), k2o: range(150, 'U/ha', 200) }, method: 'incorporated', note: 'Foundation before the crop.' },
      { phase: 'split', timing: 'At transplant + three weeks later', amounts: { n: range(40, 'U/ha') }, method: 'side_dress', note: '20 N at transplant and 20 N three weeks later.' },
    ], pages: '110; extracted lines 2811–2827',
  }),
  guidance({
    id: 'garlic', aliases: ['ail', 'ثوم'], name: 'Garlic', nameFr: 'Ail', nameAr: 'الثوم', category: 'Vegetable',
    summary: 'One foundation application for irrigated October or April culture.',
    context: ['Select the planting window before generating the calendar.', 'Keep K in the total and verify salinity-sensitive conditions.'],
    applications: [
      { phase: 'foundation', timing: 'October or April irrigated culture', amounts: { n: range(80, 'U/ha'), p2o5: range(50, 'U/ha'), k2o: range(150, 'U/ha') }, method: 'incorporated', note: 'One foundation application.' },
    ], pages: '111; extracted lines 2848–2860',
  }),
  guidance({
    id: 'leek', aliases: ['poireau', 'كراث'], name: 'Leek', nameFr: 'Poireau', nameAr: 'الكراث', category: 'Vegetable',
    summary: 'January foundation followed by three maintenance N applications.',
    context: ['Use three post-foundation maintenance events in the crop calendar.'],
    applications: [
      { phase: 'foundation', timing: 'January', amounts: { n: range(160, 'U/ha'), p2o5: range(150, 'U/ha'), k2o: range(200, 'U/ha') }, method: 'incorporated', note: 'Foundation.' },
      { phase: 'maintenance', timing: 'Three follow-up applications', amounts: { n: range(60, 'U/ha', 80) }, method: 'side_dress', note: 'Three 60–80 N applications.' },
    ], pages: '111–112; extracted lines 2861–2880',
  }),
  guidance({
    id: 'onion', aliases: ['dry onion', 'oignon', 'بصل'], name: 'Dry onion', nameFr: 'Oignon sec', nameAr: 'البصل الجاف', category: 'Vegetable',
    summary: 'January foundation with one February N/K maintenance application.',
    context: ['Keep dry onion separate from green onion or leek.'],
    applications: [
      { phase: 'foundation', timing: 'January', amounts: { n: range(60, 'U/ha', 80), p2o5: range(100, 'U/ha', 120), k2o: range(180, 'U/ha', 200) }, method: 'incorporated', note: 'Foundation.' },
      { phase: 'maintenance', timing: 'February', amounts: { n: range(45, 'U/ha'), k2o: range(50, 'U/ha') }, method: 'side_dress', note: 'One maintenance application.' },
    ], pages: '112; extracted lines 2881–2919',
  }),
  guidance({
    id: 'artichoke', aliases: ['artichaut', 'خرشوف'], name: 'Artichoke', nameFr: 'Artichaut', nameAr: 'الخرشوف', category: 'Vegetable',
    summary: 'May foundation for June–July new plantations with four N stages through harvest.',
    context: ['Year 1 establishment and year 2 production both use the four-stage N maintenance pattern.', 'Capitulum formation and harvest stages should be visible in the calendar.'],
    applications: [
      { phase: 'foundation', timing: 'May foundation for June–July new plantation', amounts: { manure: range(30, 't/ha'), n: range(150, 'U/ha'), p2o5: range(150, 'U/ha'), k2o: range(350, 'U/ha') }, method: 'incorporated', note: 'Foundation.' },
      { phase: 'split', timing: '2–3 leaves + capitulum formation + first harvest + mid-harvest', amounts: { n: range(200, 'U/ha') }, method: 'side_dress', note: 'Four 50-N applications; the production-year schedule repeats the four maintenance stages.' },
    ], pages: '113–114; extracted lines 2940–2977',
  }),
  guidance({
    id: 'carrot', aliases: ['carotte', 'جزر'], name: 'Carrot', nameFr: 'Carotte', nameAr: 'الجزر', category: 'Vegetable',
    summary: 'Winter foundation before sowing with a small true-leaf follow-up.',
    context: ['Avoid excessive N close to harvest; keep the 4–5 true leaf checkpoint visible.'],
    applications: [
      { phase: 'foundation', timing: 'January–February before sowing', amounts: { n: range(70, 'U/ha', 80), p2o5: range(80, 'U/ha', 120), k2o: range(200, 'U/ha', 300) }, method: 'incorporated', note: 'Foundation.' },
      { phase: 'maintenance', timing: '4–5 true leaves', amounts: { n: range(30, 'U/ha') }, method: 'side_dress', note: 'One early follow-up.' },
    ], pages: '114; extracted lines 2997–3014',
  }),
  guidance({
    id: 'fennel', aliases: ['fenouil de Florence', 'fenouil', 'شمر'], name: 'Florence fennel', nameFr: 'Fenouil de Florence', nameAr: 'الشمر الإيطالي', category: 'Vegetable',
    summary: 'One late-August–September foundation application.',
    context: ['Keep the seasonal foundation window explicit.'],
    applications: [
      { phase: 'foundation', timing: 'Late August–September', amounts: { n: range(80, 'U/ha'), p2o5: range(110, 'U/ha'), k2o: range(120, 'U/ha') }, method: 'incorporated', note: 'One foundation application.' },
    ], pages: '114; extracted lines 3015–3038',
  }),
  guidance({
    id: 'cucumber', aliases: ['concombre', 'خيار'], name: 'Cucumber', nameFr: 'Concombre', nameAr: 'الخيار', category: 'Vegetable',
    summary: 'Greenhouse and open-field cucumber use separate foundation totals and three flowering-to-fruit stages.',
    context: ['Keep greenhouse and open-field schedules separate.', 'Open-field maintenance repeats every three weeks until harvest after the initial stages.'],
    applications: [
      { phase: 'foundation', timing: 'Greenhouse October', amounts: { n: range(170, 'U/ha', 200), p2o5: range(100, 'U/ha', 150), k2o: range(200, 'U/ha', 250) }, method: 'incorporated', note: 'Greenhouse foundation.' },
      { phase: 'split', timing: 'Greenhouse: flowering + 3 weeks later + fruit enlargement', amounts: { n: range(160, 'U/ha'), k2o: range(150, 'U/ha') }, method: 'fertigation', note: 'Three greenhouse stages.' },
      { phase: 'foundation', timing: 'Open field April', amounts: { n: range(120, 'U/ha'), p2o5: range(100, 'U/ha'), k2o: range(200, 'U/ha') }, method: 'incorporated', note: 'Open-field foundation.' },
      { phase: 'split', timing: 'Open field: flowering + 3 weeks later + fruit enlargement, then every 3 weeks until harvest', amounts: { n: range(90, 'U/ha'), k2o: range(150, 'U/ha') }, method: 'fertigation', note: 'Three 30-N + 50-K applications.' },
    ], pages: '116–119; extracted lines 3061–3109',
  }),
  guidance({
    id: 'zucchini', aliases: ['courgette', 'كوسة'], name: 'Zucchini', nameFr: 'Courgette', nameAr: 'الكوسة', category: 'Vegetable',
    summary: 'Planting application followed by small two-week N/K feeds from flowering to harvest.',
    context: ['Use a recurring two-week calendar event until harvest.'],
    applications: [
      { phase: 'foundation', timing: 'At planting or localized band', amounts: { n: range(120, 'U/ha'), p2o5: range(60, 'U/ha'), k2o: range(100, 'U/ha') }, method: 'band', note: 'Planting or localized band application.' },
      { phase: 'maintenance', timing: 'Every two weeks from beginning flowering until harvest', amounts: { n: range(30, 'U/ha'), k2o: range(30, 'U/ha') }, method: 'fertigation', note: 'Repeat according to harvest duration and crop condition.' },
    ], pages: '119; extracted lines 3110–3130',
  }),
  guidance({
    id: 'melon-watermelon', aliases: ['melon', 'watermelon', 'melons', 'pastèque', 'بطيخ', 'شمام'], name: 'Melon and watermelon', nameFr: 'Melon et pastèque', nameAr: 'الشمام والبطيخ', category: 'Vegetable',
    summary: 'March–April foundation followed by three flowering, fruit-set, and fruit-enlargement applications.',
    context: ['Use the same structure for melon and watermelon, then adapt planting date and crop duration.', 'Keep K in the fruit-enlargement checkpoint.'],
    applications: [
      { phase: 'foundation', timing: 'March–April', amounts: { n: range(170, 'U/ha', 200), p2o5: range(100, 'U/ha', 150), k2o: range(200, 'U/ha', 250) }, method: 'incorporated', note: 'Foundation.' },
      { phase: 'split', timing: 'Beginning flowering + 3 weeks later + fruit enlargement', amounts: { n: range(120, 'U/ha'), k2o: range(150, 'U/ha') }, method: 'fertigation', note: 'Three 40-N + 50-K applications.' },
    ], pages: '119–121; extracted lines 3131–3174',
  }),
  guidance({
    id: 'broad-bean', aliases: ['fève', 'faba bean', 'فول'], name: 'Broad bean', nameFr: 'Fève', nameAr: 'الفول', category: 'Legume',
    summary: 'One foundation application with different sowing windows for coastal versus High Plateaux/south conditions.',
    context: ['End of September on the coast; October in High Plateaux/south.', 'Keep the low-N legume principle visible.'],
    applications: [
      { phase: 'foundation', timing: 'End September coast or October High Plateaux/south', amounts: { n: range(20, 'U/ha'), p2o5: range(60, 'U/ha', 70), k2o: range(80, 'U/ha', 90) }, method: 'incorporated', note: 'One foundation application.' },
    ], pages: '122; extracted lines 3194–3210',
  }),
  guidance({
    id: 'green-bean', aliases: ['haricot vert', 'haricot', 'فاصوليا خضراء'], name: 'Green bean', nameFr: 'Haricot vert', nameAr: 'الفاصوليا الخضراء', category: 'Legume',
    summary: 'One pre-sowing foundation application with moderate N and higher P/K.',
    context: ['Use the existing crop calendar for repeated harvest operations.'],
    applications: [
      { phase: 'foundation', timing: 'Before sowing', amounts: { n: range(30, 'U/ha'), p2o5: range(90, 'U/ha'), k2o: range(120, 'U/ha') }, method: 'incorporated', note: 'One foundation application.' },
    ], pages: '122; extracted lines 3211–3225',
  }),
  guidance({
    id: 'pea', aliases: ['pois', 'petit pois', 'بازلاء'], name: 'Pea', nameFr: 'Pois', nameAr: 'البازلاء', category: 'Legume',
    summary: 'One pre-sowing foundation application.',
    context: ['Keep inoculation/nodulation and low-N checks visible in the calendar.'],
    applications: [
      { phase: 'foundation', timing: 'Before sowing', amounts: { n: range(30, 'U/ha'), p2o5: range(90, 'U/ha'), k2o: range(120, 'U/ha') }, method: 'incorporated', note: 'One foundation application.' },
    ], pages: '122; extracted lines 3226–3239',
  }),
  guidance({
    id: 'tobacco', aliases: ['tabac', 'تبغ'], name: 'Tobacco', nameFr: 'Tabac', nameAr: 'التبغ', category: 'Industrial crop',
    summary: 'January foundation; the manual warns against saline or high-chlorine soils.',
    context: ['Salinity and chloride risk must be checked before fertilizer selection.', 'Product source compatibility is essential for tobacco quality.'],
    applications: [
      { phase: 'foundation', timing: 'January', amounts: { n: range(100, 'U/ha'), p2o5: range(60, 'U/ha'), k2o: range(100, 'U/ha') }, method: 'incorporated', note: 'Foundation application.' },
    ], pages: '130; extracted lines 3294–3320',
  }),
];

export const FERTIAL_FORMULA_CARDS = commonFormulas;

const normalized = (value: string): string => value
  .normalize('NFKC')
  .toLocaleLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim();

const cropIndex = new Map<string, FertialCropGuidance>();
for (const record of FERTIAL_CROP_GUIDANCE) {
  for (const key of [record.id, record.name, record.nameFr, record.nameAr, ...record.aliases]) cropIndex.set(normalized(key), record);
}

export function getFertialGuidance(cropIdOrName: string): FertialCropGuidance | undefined {
  const key = normalized(cropIdOrName);
  return cropIndex.get(key) ?? cropIndex.get(normalized(cropIdOrName.replace(/-/g, ' ')));
}

export function getFertialCropOptions(): FertialCropGuidance[] {
  return [...FERTIAL_CROP_GUIDANCE];
}

export function formatFertialRange(value?: FertialRange): string {
  if (!value) return '';
  const amount = value.max === undefined ? `${value.min}` : `${value.min}–${value.max}`;
  return `${amount} ${value.unit}`;
}

export function formatFertialAmounts(amounts: FertialAmounts): string {
  const parts = [
    amounts.n ? `N ${formatFertialRange(amounts.n)}` : '',
    amounts.p2o5 ? `P₂O₅ ${formatFertialRange(amounts.p2o5)}` : '',
    amounts.k2o ? `K₂O ${formatFertialRange(amounts.k2o)}` : '',
    amounts.s ? `S ${formatFertialRange(amounts.s)}` : '',
    amounts.manure ? `manure ${formatFertialRange(amounts.manure)}` : '',
  ].filter(Boolean);
  return parts.join(' · ');
}
