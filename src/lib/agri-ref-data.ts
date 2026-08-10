/**
 * Agricultural reference data — extracted from agridatasets-py
 * (https://github.com/lightbluetitan/agridatasets-py)
 *
 * Sources: curated R packages on CRAN (gpk, AgroR, ALUES, aqp)
 * License: MIT (the Python package) / GPL (original R packages — data is factual)
 */

// ============================================================================
// Soil Munsell Colors → Traditional Names
// Source: aqp R package (v2.3.2) — soil_munsell_colors.csv
// ============================================================================

export interface MunsellColor {
  munsell: string;
  traditionalName: string;
}

export const MUNSELL_COLORS: MunsellColor[] = [
  { munsell: 'N 2.5/', traditionalName: 'black' },
  { munsell: 'N 2.5/0', traditionalName: 'black' },
  { munsell: 'N 2/', traditionalName: 'black' },
  { munsell: 'N 2/0', traditionalName: 'black' },
  { munsell: 'N 3/', traditionalName: 'very dark gray' },
  { munsell: 'N 3/0', traditionalName: 'very dark gray' },
  { munsell: 'N 4/', traditionalName: 'dark gray' },
  { munsell: 'N 4/0', traditionalName: 'dark gray' },
  { munsell: 'N 5/', traditionalName: 'gray' },
  { munsell: 'N 5/0', traditionalName: 'gray' },
  { munsell: 'N 6/', traditionalName: 'gray' },
  { munsell: 'N 6/0', traditionalName: 'gray' },
  { munsell: 'N 7/', traditionalName: 'light gray' },
  { munsell: 'N 7/0', traditionalName: 'light gray' },
  { munsell: 'N 8/', traditionalName: 'white' },
  { munsell: 'N 8/0', traditionalName: 'white' },
  { munsell: '10YR 2/1', traditionalName: 'black' },
  { munsell: '10YR 3/1', traditionalName: 'very dark gray' },
  { munsell: '10YR 3/2', traditionalName: 'very dark grayish brown' },
  { munsell: '10YR 4/2', traditionalName: 'dark grayish brown' },
  { munsell: '10YR 5/2', traditionalName: 'grayish brown' },
  { munsell: '10YR 6/2', traditionalName: 'light brownish gray' },
  { munsell: '10YR 7/2', traditionalName: 'light gray' },
  { munsell: '10YR 8/2', traditionalName: 'white' },
  { munsell: '10YR 3/3', traditionalName: 'dark brown' },
  { munsell: '10YR 4/3', traditionalName: 'brown' },
  { munsell: '10YR 5/3', traditionalName: 'brown' },
  { munsell: '10YR 6/3', traditionalName: 'pale brown' },
  { munsell: '10YR 7/3', traditionalName: 'very pale brown' },
  { munsell: '10YR 8/3', traditionalName: 'very pale brown' },
  { munsell: '10YR 4/4', traditionalName: 'dark yellowish brown' },
  { munsell: '10YR 5/4', traditionalName: 'yellowish brown' },
  { munsell: '10YR 6/4', traditionalName: 'light yellowish brown' },
  { munsell: '10YR 7/4', traditionalName: 'very pale brown' },
  { munsell: '10YR 8/4', traditionalName: 'very pale brown' },
  { munsell: '10YR 5/6', traditionalName: 'yellowish brown' },
  { munsell: '10YR 6/6', traditionalName: 'brownish yellow' },
  { munsell: '10YR 7/6', traditionalName: 'yellow' },
  { munsell: '10YR 8/6', traditionalName: 'yellow' },
];

// ============================================================================
// Soil Munsell Minerals → Mineral + Hue + Value + Chroma
// Source: aqp R package (v2.3.2) — soil_munsell_minerals.csv
// ============================================================================

export interface SoilMineral {
  mineral: string;
  color: string;       // Munsell notation
  hue: string;         // e.g. "10YR"
  value: number;       // 0-10
  chroma: number;      // 0-10
  interpretation: string;
  drainage: 'well' | 'moderate' | 'poor' | 'very_poor';
  ironStatus: 'high' | 'moderate' | 'low' | 'depleted';
}

export const SOIL_MINERALS: SoilMineral[] = [
  { mineral: 'goethite-coarse', color: '10YR 8/6', hue: '10YR', value: 8, chroma: 6, interpretation: 'Iron oxide (goethite) — well-drained, oxidized soil. Common in mature tropical/temperate soils.', drainage: 'well', ironStatus: 'high' },
  { mineral: 'goethite-fine', color: '7.5YR 5/6', hue: '7.5YR', value: 5, chroma: 6, interpretation: 'Fine goethite — yellowish-brown, well-drained. Iron is oxidized + stable.', drainage: 'well', ironStatus: 'high' },
  { mineral: 'hematite-coarse', color: '5R 3/6', hue: '5R', value: 3, chroma: 6, interpretation: 'Iron oxide (hematite) — red soil, highly oxidized. Tropical Oxisols/Ultisols. Good drainage.', drainage: 'well', ironStatus: 'high' },
  { mineral: 'hematite-fine', color: '10R 4/8', hue: '10R', value: 4, chroma: 8, interpretation: 'Fine hematite — bright red, well-oxidized. Common in Mediterranean + tropical red soils.', drainage: 'well', ironStatus: 'high' },
  { mineral: 'ferrihydrite', color: '7.5YR 4/4', hue: '7.5YR', value: 4, chroma: 4, interpretation: 'Amorphous iron — young soil, recently drained. Transitional oxidation state.', drainage: 'moderate', ironStatus: 'moderate' },
  { mineral: 'lepidocrocite', color: '5YR 5/6', hue: '5YR', value: 5, chroma: 6, interpretation: 'Iron oxyhydroxide — seasonally saturated soil. Alternating wet/dry conditions.', drainage: 'moderate', ironStatus: 'moderate' },
  { mineral: 'siderite', color: '5Y 5/1', hue: '5Y', value: 5, chroma: 1, interpretation: 'Iron carbonate — waterlogged, reducing conditions. Poor drainage, anaerobic.', drainage: 'poor', ironStatus: 'low' },
  { mineral: 'pyrite', color: 'N 4/', hue: 'N', value: 4, chroma: 0, interpretation: 'Iron sulfide — permanently waterlogged. Acid sulfate risk if drained. Very poor drainage.', drainage: 'very_poor', ironStatus: 'depleted' },
  { mineral: 'vivianite', color: '5B 6/1', hue: '5B', value: 6, chroma: 1, interpretation: 'Iron phosphate — highly reduced, waterlogged. Phosphorus release on drainage.', drainage: 'very_poor', ironStatus: 'depleted' },
  { mineral: 'manganese-oxide', color: 'N 2.5/', hue: 'N', value: 2.5, chroma: 0, interpretation: 'Manganese oxide — black coatings/mottles. Common in poorly drained soils with Mn toxicity risk.', drainage: 'poor', ironStatus: 'low' },
  { mineral: 'calcite', color: '10YR 8/2', hue: '10YR', value: 8, chroma: 2, interpretation: 'Calcium carbonate — white/very pale. Calcareous soil, high pH (7.5-8.5). May cause Fe/Zn deficiency.', drainage: 'well', ironStatus: 'low' },
  { mineral: 'gypsum', color: '10YR 8/1', hue: '10YR', value: 8, chroma: 1, interpretation: 'Calcium sulfate — white. Saline-sodic soil reclamation. Common in arid regions.', drainage: 'well', ironStatus: 'low' },
  { mineral: 'organic-matter', color: '10YR 2/1', hue: '10YR', value: 2, chroma: 1, interpretation: 'Organic matter accumulation — dark black. High biological activity, good fertility.', drainage: 'well', ironStatus: 'moderate' },
];

// ============================================================================
// US State Soils
// Source: aqp R package (v2.3.2) — us_state_soils.csv
// ============================================================================

export interface StateSoil {
  state: string;
  abbreviation: string;
  series: string;
}

export const US_STATE_SOILS: StateSoil[] = [
  { state: 'Alabama', abbreviation: 'AL', series: 'Bama' },
  { state: 'Alaska', abbreviation: 'AK', series: 'Tanana' },
  { state: 'Arizona', abbreviation: 'AZ', series: 'Casa Grande' },
  { state: 'Arkansas', abbreviation: 'AR', series: 'Stuttgart' },
  { state: 'California', abbreviation: 'CA', series: 'San Joaquin' },
  { state: 'Colorado', abbreviation: 'CO', series: 'Seitz' },
  { state: 'Connecticut', abbreviation: 'CT', series: 'Windsor' },
  { state: 'Delaware', abbreviation: 'DE', series: 'Greenwich' },
  { state: 'Florida', abbreviation: 'FL', series: 'Myakka' },
  { state: 'Georgia', abbreviation: 'GA', series: 'Tifton' },
  { state: 'Hawaii', abbreviation: 'HI', series: 'Hilo' },
  { state: 'Idaho', abbreviation: 'ID', series: 'Threebear' },
  { state: 'Illinois', abbreviation: 'IL', series: 'Drummer' },
  { state: 'Indiana', abbreviation: 'IN', series: 'Miami' },
  { state: 'Iowa', abbreviation: 'IA', series: 'Tama' },
  { state: 'Kansas', abbreviation: 'KS', series: 'Harney' },
  { state: 'Kentucky', abbreviation: 'KY', series: 'Crider' },
  { state: 'Louisiana', abbreviation: 'LA', series: 'Ruston' },
  { state: 'Maine', abbreviation: 'ME', series: 'Chesuncook' },
  { state: 'Maryland', abbreviation: 'MD', series: 'Sassafras' },
  { state: 'Massachusetts', abbreviation: 'MA', series: 'Paxton' },
  { state: 'Michigan', abbreviation: 'MI', series: 'Kalkaska' },
  { state: 'Minnesota', abbreviation: 'MN', series: 'Lester' },
  { state: 'Mississippi', abbreviation: 'MS', series: 'Natchez' },
  { state: 'Missouri', abbreviation: 'MO', series: 'Menfro' },
  { state: 'Montana', abbreviation: 'MT', series: 'Scobey' },
  { state: 'Nebraska', abbreviation: 'NE', series: 'Holdrege' },
  { state: 'Nevada', abbreviation: 'NV', series: 'Orovada' },
  { state: 'New Hampshire', abbreviation: 'NH', series: 'Marlow' },
  { state: 'New Jersey', abbreviation: 'NJ', series: 'Downer' },
  { state: 'New Mexico', abbreviation: 'NM', series: 'Penistaja' },
  { state: 'New York', abbreviation: 'NY', series: 'Honeoye' },
  { state: 'North Carolina', abbreviation: 'NC', series: 'Cecil' },
  { state: 'North Dakota', abbreviation: 'ND', series: 'Williams' },
  { state: 'Ohio', abbreviation: 'OH', series: 'Miamian' },
  { state: 'Oklahoma', abbreviation: 'OK', series: 'Port' },
  { state: 'Oregon', abbreviation: 'OR', series: 'Jory' },
  { state: 'Pennsylvania', abbreviation: 'PA', series: 'Hazleton' },
  { state: 'Rhode Island', abbreviation: 'RI', series: 'Narragansett' },
  { state: 'South Carolina', abbreviation: 'SC', series: 'Lynchburg' },
  { state: 'South Dakota', abbreviation: 'SD', series: 'Houdek' },
  { state: 'Tennessee', abbreviation: 'TN', series: 'Dickson' },
  { state: 'Texas', abbreviation: 'TX', series: 'Houston Black' },
  { state: 'Utah', abbreviation: 'UT', series: 'Mivida' },
  { state: 'Vermont', abbreviation: 'VT', series: 'Tunbridge' },
  { state: 'Virginia', abbreviation: 'VA', series: 'Pamunkey' },
  { state: 'Washington', abbreviation: 'WA', series: 'Tokul' },
  { state: 'West Virginia', abbreviation: 'WV', series: 'Monongahela' },
  { state: 'Wisconsin', abbreviation: 'WI', series: 'Antigo' },
  { state: 'Wyoming', abbreviation: 'WY', series: 'Fordhook' },
];

// ============================================================================
// Livestock Growth Benchmarks
// Source: gpk R package (v1.0) — broiler_growth, pig_weight_gain, cattle_butterfat
// ============================================================================

export interface BroilerBenchmark {
  age: number;        // days
  bodyWeight: number; // grams
  targetBW: number;   // target weight (grams)
  adfi: number;       // average daily feed intake (g)
  adg: number;        // average daily gain (g)
}

export const BROILER_BENCHMARKS: BroilerBenchmark[] = [
  { age: 143, bodyWeight: 2068, targetBW: 2216, adfi: 85, adg: 2.8 },
  { age: 146, bodyWeight: 2132, targetBW: 2278, adfi: 91.7, adg: 21.3 },
  { age: 150, bodyWeight: 2234, targetBW: 2369, adfi: 99.5, adg: 25.5 },
  { age: 153, bodyWeight: 2335, targetBW: 2440, adfi: 105.7, adg: 33.7 },
  { age: 157, bodyWeight: 2440, targetBW: 2530, adfi: 113.4, adg: 26.3 },
  { age: 160, bodyWeight: 2543, targetBW: 2606, adfi: 118.7, adg: 34.3 },
  { age: 164, bodyWeight: 2653, targetBW: 2699, adfi: 126.1, adg: 27.5 },
  { age: 167, bodyWeight: 2754, targetBW: 2775, adfi: 131.5, adg: 33.7 },
  { age: 171, bodyWeight: 2871, targetBW: 2867, adfi: 138.9, adg: 29.3 },
];

export interface PigBenchmark {
  pen: string;
  treatment: string;
  pigId: number;
  sex: 'M' | 'F';
  initialWeight: number;
  finalWeight: number;
  feedIntake: number;
  adg: number;       // average daily gain (kg/day)
  fcr: number;       // feed conversion ratio
}

export const PIG_BENCHMARKS: PigBenchmark[] = [
  { pen: 'P1', treatment: 'A', pigId: 993, sex: 'F', initialWeight: 48.5, finalWeight: 204.5, feedIntake: 542.15, adg: 9.94, fcr: 0.199 },
  { pen: 'P1', treatment: 'B', pigId: 989, sex: 'F', initialWeight: 48, finalWeight: 205.5, feedIntake: 552.3, adg: 10, fcr: 0.146 },
  { pen: 'P2', treatment: 'A', pigId: 996, sex: 'M', initialWeight: 47.5, finalWeight: 210, feedIntake: 558.5, adg: 10.36, fcr: 0.179 },
  { pen: 'P2', treatment: 'B', pigId: 998, sex: 'M', initialWeight: 48, finalWeight: 212, feedIntake: 561.2, adg: 10.45, fcr: 0.178 },
  { pen: 'P3', treatment: 'A', pigId: 994, sex: 'F', initialWeight: 49, finalWeight: 208, feedIntake: 548.9, adg: 10.14, fcr: 0.182 },
  { pen: 'P3', treatment: 'B', pigId: 997, sex: 'F', initialWeight: 48.5, finalWeight: 207, feedIntake: 545.6, adg: 10.1, fcr: 0.185 },
];

export interface CattleButterfatBenchmark {
  butterfat: number;  // %
  breed: string;
  age: string;
}

export const CATTLE_BUTTERFAT_BENCHMARKS: CattleButterfatBenchmark[] = [
  { butterfat: 3.74, breed: 'Ayrshire', age: 'Mature' },
  { butterfat: 4.01, breed: 'Ayrshire', age: '2year' },
  { butterfat: 4.22, breed: 'Guernsey', age: 'Mature' },
  { butterfat: 4.51, breed: 'Guernsey', age: '2year' },
  { butterfat: 3.58, breed: 'Holstein', age: 'Mature' },
  { butterfat: 3.74, breed: 'Holstein', age: '2year' },
  { butterfat: 3.92, breed: 'Jersey', age: 'Mature' },
  { butterfat: 4.21, breed: 'Jersey', age: '2year' },
];
