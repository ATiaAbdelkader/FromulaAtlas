// Guided workflow definitions.

import type { Formula } from '@/lib/types';

export interface WorkflowStep {
  formulaCode: string;
  label: string;
  prompt: string;
  why?: string;
  carryForward?: Record<string, string>;
}

export interface Workflow {
  id: string;
  title: string;
  icon: string;
  domain: 'crop' | 'animal' | 'cross-cutting';
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  summary: string;
  outcome: string;
  steps: WorkflowStep[];
}

export const workflows: Workflow[] = [
  {
    id: 'plant-maize-field',
    title: 'Plant a Maize Field',
    icon: 'Sprout',
    domain: 'crop',
    duration: '~6 min',
    difficulty: 'beginner',
    summary: 'Plan your maize planting from spacing to seed purchase quantity.',
    outcome: 'You will know exactly how much seed and fertilizer to buy for your maize field.',
    steps: [
      { formulaCode: '2.1', label: 'Plant Population', prompt: 'Choose your row and plant spacing to find the target population per hectare.', why: 'Plant population drives your seed purchase and fertilizer plan.' },
      { formulaCode: '2.2', label: 'Seed Rate', prompt: 'Calculate how many kg of seed to buy based on the population from step 1.', why: 'Translates target population into kg of seed.', carryForward: { targetPop: 'prev.result.value' } },
      { formulaCode: '4.1', label: 'Fertilizer Requirement', prompt: 'Determine how much fertilizer product to apply for your target N rate.', why: 'Converts the recommended nutrient rate into the actual kg of fertilizer product.' },
    ],
  },
  {
    id: 'diagnose-low-milk-yield',
    title: 'Diagnose Low Milk Yield',
    icon: 'PawPrint',
    domain: 'animal',
    duration: '~8 min',
    difficulty: 'intermediate',
    summary: 'Systematically investigate why a dairy cow is underperforming.',
    outcome: 'A shortlist of likely causes for low yield and which management lever to pull first.',
    steps: [
      { formulaCode: '10.9', label: 'Energy-Corrected Milk', prompt: 'Standardize today\'s milk yield to 4% fat / 3.2% protein.', why: 'ECM lets you compare cows and days on a level playing field.' },
      { formulaCode: '13.6', label: 'Persistency Index', prompt: 'Compare today\'s yield to peak yield.', why: 'A persistency below 70% suggests the cow is dropping faster than expected.' },
      { formulaCode: '13.8', label: 'Somatic Cell Score', prompt: 'Check the latest SCC to rule out subclinical mastitis.', why: 'High SCC indicates mastitis, which silently depresses milk yield.' },
      { formulaCode: '37.1', label: 'Temperature-Humidity Index', prompt: 'Check today\'s heat stress level.', why: 'THI > 72 reduces feed intake and milk yield by 10-25%.' },
    ],
  },
  {
    id: 'plan-irrigation',
    title: 'Plan Irrigation',
    icon: 'Droplets',
    domain: 'crop',
    duration: '~5 min',
    difficulty: 'beginner',
    summary: 'Calculate how much irrigation water your crop needs, then check water use efficiency.',
    outcome: 'The mm of water to apply and a benchmark for how efficiently your crop uses water.',
    steps: [
      { formulaCode: '6.1', label: 'Net Irrigation Requirement', prompt: 'Subtract effective rainfall from crop evapotranspiration.', why: 'Tells you how much water the crop actually needs from irrigation.' },
      { formulaCode: '6.2', label: 'Gross Irrigation Requirement', prompt: 'Account for your system\'s application efficiency.', why: 'You must pump more than the crop needs due to system losses.', carryForward: { nir: 'prev.result.value' } },
      { formulaCode: '6.4', label: 'Water Use Efficiency', prompt: 'Benchmark your yield against water used.', why: 'WUE > 15 kg/mm is excellent; < 5 suggests drought stress.' },
    ],
  },
  {
    id: 'assess-soil-health',
    title: 'Assess Soil Health',
    icon: 'Leaf',
    domain: 'cross-cutting',
    duration: '~7 min',
    difficulty: 'intermediate',
    summary: 'Run a quick soil health check using bulk density, porosity, and organic carbon stock.',
    outcome: 'A soil health snapshot flagging compaction risk, poor aeration, or low carbon.',
    steps: [
      { formulaCode: '7.1', label: 'Bulk Density', prompt: 'Measure soil compaction from an undisturbed core sample.', why: 'BD > 1.6 g/cm³ means roots struggle to penetrate.' },
      { formulaCode: '7.3', label: 'Porosity', prompt: 'Calculate pore space from bulk density.', why: 'Porosity < 40% means poor aeration.', carryForward: { bd: 'prev.result.value' } },
      { formulaCode: '41.1', label: 'Soil Carbon Stock', prompt: 'Estimate total carbon stored in your topsoil.', why: 'SCS < 30 t C/ha indicates depleted soil.' },
    ],
  },
  {
    id: 'evaluate-drought-tolerance',
    title: 'Evaluate Drought Tolerance',
    icon: 'Sun',
    domain: 'cross-cutting',
    duration: '~6 min',
    difficulty: 'advanced',
    summary: 'Compare varieties under stress using the Drought Tolerance Index, then check RUE and runoff.',
    outcome: 'A ranked verdict on which variety to plant in drought-prone fields.',
    steps: [
      { formulaCode: '69.3', label: 'Drought Tolerance Index', prompt: 'Compare stressed and potential yields.', why: 'DTI > 0.5 means a variety yields well under both stress and good conditions.' },
      { formulaCode: '69.1', label: 'Rainfall Use Efficiency', prompt: 'Check how efficiently your crop converts rainfall into grain.', why: 'RUE < 5 suggests drought stress.' },
      { formulaCode: '69.4', label: 'Runoff Coefficient', prompt: 'Measure how much rain runs off rather than infiltrating.', why: 'RC > 0.3 means you\'re losing a third of your rainfall.' },
    ],
  },
  {
    id: 'broiler-profitability',
    title: 'Broiler Profitability Check',
    icon: 'Calculator',
    domain: 'animal',
    duration: '~5 min',
    difficulty: 'beginner',
    summary: 'Quick health check on a broiler flock: EBI, break-even, and gross margin.',
    outcome: 'A clear verdict on whether your current flock is profitable.',
    steps: [
      { formulaCode: '14.5', label: 'Broiler Performance Efficiency (EBI)', prompt: 'Combine livability, body weight, age, and FCR into a single index.', why: 'EBI > 300 is good, > 400 is excellent.' },
      { formulaCode: '63.3', label: 'Break-even Yield', prompt: 'Find the minimum output needed to cover variable costs.', why: 'If actual output is below break-even, you\'re losing money.' },
      { formulaCode: '17.2', label: 'Gross Margin', prompt: 'Subtract variable costs from revenue.', why: 'Positive gross margin = the flock is covering its direct costs.' },
    ],
  },
  {
    id: 'design-drip-system',
    title: 'Design a Drip System',
    icon: 'Droplets',
    domain: 'crop',
    duration: '~8 min',
    difficulty: 'intermediate',
    summary: 'Design a drip irrigation system from crop water need to pipe sizing to uniformity check to scheduling.',
    outcome: 'A complete drip system design: pipe diameter, emitter spec, uniformity verdict, and irrigation schedule.',
    steps: [
      { formulaCode: 'IRR-10.4', label: 'Crop Water Need (ETc)', prompt: 'Calculate daily crop water use from reference ET and your crop coefficient.', why: 'ETc is the starting point for every design decision.' },
      { formulaCode: 'IRR-10.6', label: 'Gross Irrigation Requirement', prompt: 'Convert net crop water need to gross volume to pump, accounting for drip efficiency (~90%).', why: 'Drip is 85–95% efficient, so you must pump ~10% more.', carryForward: { nir: 'prev.result.value' } },
      { formulaCode: 'IRR-7.1', label: 'Emitter Discharge', prompt: 'Select emitter type and pressure to determine discharge per emitter (target 2–4 L/h).', why: 'Emitter discharge × number of emitters = total system flow.' },
      { formulaCode: 'IRR-15.6', label: 'Pipe Sizing', prompt: 'Size the main/lateral pipes for the total flow at a target velocity of 1–2 m/s.', why: 'Correct pipe diameter balances cost against friction loss.' },
      { formulaCode: 'IRR-7.3', label: 'Uniformity Check', prompt: 'Verify the design achieves acceptable Distribution Uniformity (DU > 85%).', why: 'DU > 85% means every plant gets a similar amount of water.' },
      { formulaCode: 'IRR-9.3', label: 'Irrigation Interval', prompt: 'Determine how often to irrigate based on readily available water and daily ETc.', why: 'Drip systems typically irrigate every 1–3 days.', carryForward: { etc: 'prev.result.value' } },
    ],
  },
  // NEW: Design a Sprinkler System
  {
    id: 'design-sprinkler-system',
    title: 'Design a Sprinkler System',
    icon: 'CloudRain',
    domain: 'crop',
    duration: '~7 min',
    difficulty: 'intermediate',
    summary: 'Design a sprinkler irrigation system: crop water need → sprinkler selection → spacing → precipitation rate → uniformity → pump sizing.',
    outcome: 'A complete sprinkler system design: sprinkler type, spacing, precipitation rate, uniformity target, and pump specification.',
    steps: [
      { formulaCode: 'IRR-10.4', label: 'Crop Water Need (ETc)', prompt: 'Calculate daily crop water use from reference ET and crop coefficient.', why: 'ETc determines how much water the sprinkler system must deliver per day.' },
      { formulaCode: 'IRR-8.4', label: 'Precipitation Rate', prompt: 'Calculate the precipitation rate from sprinkler flow and spacing. Match to soil intake rate.', why: 'Precipitation rate must not exceed soil infiltration — otherwise runoff. Clay <8 mm/h, loam 8–15, sand 15–25.' },
      { formulaCode: 'IRR-8.1', label: 'Christiansen Uniformity', prompt: 'Estimate the Christiansen Uniformity coefficient. Target CU > 84%.', why: 'CU > 84% ensures every part of the field gets a similar amount of water. Below 70% is unacceptable.' },
      { formulaCode: 'IRR-3.3', label: 'Total Dynamic Head', prompt: 'Calculate the TDH the pump must overcome: static lift + friction + sprinkler operating pressure (25–40 m).', why: 'Sprinklers need higher pressure than drip — TDH determines pump selection.' },
      { formulaCode: 'IRR-5.7', label: 'Brake Power', prompt: 'Calculate the required motor power from flow, head, and pump efficiency.', why: 'Sizes the motor/engine needed to drive the pump. Add 10–15% safety margin.' },
    ],
  },
  // NEW: Audit an Existing Irrigation System
  {
    id: 'audit-irrigation-system',
    title: 'Audit an Existing System',
    icon: 'ClipboardCheck',
    domain: 'crop',
    duration: '~6 min',
    difficulty: 'intermediate',
    summary: 'Audit an existing irrigation system for performance: measure uniformity, calculate efficiency, check water quality, and benchmark WUE.',
    outcome: 'A performance scorecard showing uniformity, efficiency, water quality risk, and water use efficiency with specific improvement recommendations.',
    steps: [
      { formulaCode: 'IRR-7.3', label: 'Distribution Uniformity (Drip)', prompt: 'Measure the low-quarter average vs overall average emitter discharge. DU > 85% is the target.', why: 'DU is the single most important drip system performance metric. Below 80% means some plants are under-irrigated.' },
      { formulaCode: 'IRR-8.1', label: 'Christiansen Uniformity (Sprinkler)', prompt: 'Catch-can test: measure the mean absolute deviation from mean application. CU > 84% is the target.', why: 'CU tells you how evenly the sprinklers distribute water. Low CU wastes water and reduces yield.' },
      { formulaCode: 'IRR-12.1', label: 'Water Quality (SAR)', prompt: 'Test irrigation water for sodium, calcium, and magnesium. Calculate SAR to check sodicity risk.', why: 'SAR > 13 degrades soil structure over time. Even a well-designed system will fail if water quality is poor.' },
      { formulaCode: '6.4', label: 'Water Use Efficiency', prompt: 'Calculate yield per unit of water used. Compare to benchmarks.', why: 'WUE ties irrigation performance to crop productivity. Low WUE means water is being wasted.' },
    ],
  },
];

export function resolveCarryForward(
  source: string,
  prevData: { result?: { value: string }; inputs?: Record<string, number> } | null
): number | null {
  if (!prevData) return null;
  if (source === 'prev.result.value') {
    if (!prevData.result?.value) return null;
    const cleaned = prevData.result.value.replace(/[,\s]/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
  }
  if (source.startsWith('prev.inputs.')) {
    const key = source.replace('prev.inputs.', '');
    const v = prevData.inputs?.[key];
    return typeof v === 'number' ? v : null;
  }
  return null;
}
