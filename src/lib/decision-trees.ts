// Decision trees: guided diagnostic flows from symptom to action.
export interface DecisionNode {
  id: string; question: string; hint?: string;
  action?: { title: string; details: string; relatedFormulas?: string[]; severity: 'info' | 'warning' | 'critical' };
  branches?: { label: string; next: string }[];
}
export interface DecisionTree {
  id: string; title: string; icon: string; domain: 'crop' | 'animal' | 'cross-cutting';
  summary: string; rootNodeId: string; nodes: Record<string, DecisionNode>;
}

export const decisionTrees: DecisionTree[] = [
  {
    id: 'nutrient-deficiency', title: 'Diagnose Nutrient Deficiency', icon: 'Sprout', domain: 'crop',
    summary: 'Walk through visual symptoms to identify which nutrient your crop is lacking.',
    rootNodeId: 'loc',
    nodes: {
      loc: { id: 'loc', question: 'Where are the symptoms appearing?', branches: [
        { label: 'Older / lower leaves', next: 'old' }, { label: 'Younger / upper leaves', next: 'young' }, { label: 'Whole plant', next: 'gen' }] },
      old: { id: 'old', question: 'What color is the discoloration?', branches: [
        { label: 'Yellow (uniform)', next: 'n' }, { label: 'Purple / reddish', next: 'p' }, { label: 'Yellow edges, brown spots', next: 'k' }] },
      n: { id: 'n', question: 'Confirm: uniform yellowing from oldest leaves, stunted?', action: { title: 'Likely Nitrogen Deficiency', details: 'Apply N fertilizer (urea 46% N) at 50–100 kg/ha split into 2 applications.', relatedFormulas: ['4.1', '4.8a'], severity: 'warning' } },
      p: { id: 'p', question: 'Confirm: purpling on older leaves?', action: { title: 'Likely Phosphorus Deficiency', details: 'Apply DAP or TSP. Band placement near seed is effective.', relatedFormulas: ['4.1'], severity: 'warning' } },
      k: { id: 'k', question: 'Confirm: marginal chlorosis, necrotic spots?', action: { title: 'Likely Potassium Deficiency', details: 'Apply Muriate of Potash (60% K₂O) at 50–100 kg/ha.', relatedFormulas: ['4.1'], severity: 'warning' } },
      young: { id: 'young', question: 'What do the symptoms look like?', branches: [
        { label: 'Interveinal chlorosis', next: 'fe' }, { label: 'White stripes', next: 'zn' }] },
      fe: { id: 'fe', question: 'Confirm: interveinal chlorosis on young leaves?', action: { title: 'Likely Iron Deficiency', details: 'Foliar spray 1–2% FeSO₄. Common in high-pH soils.', relatedFormulas: ['7.10'], severity: 'warning' } },
      zn: { id: 'zn', question: 'Confirm: white stripes, shortened internodes?', action: { title: 'Likely Zinc Deficiency', details: 'Apply ZnSO₄ at 25–50 kg/ha or 0.5% foliar spray.', relatedFormulas: ['4.1'], severity: 'warning' } },
      gen: { id: 'gen', question: 'Is the plant stunted with no specific leaf pattern?', branches: [
        { label: 'Yes, stunted + dark green', next: 'water' }, { label: 'Yes, stunted + pale', next: 'n' }] },
      water: { id: 'water', question: 'Is the soil dry or compacted?', branches: [
        { label: 'Yes', next: 'ws' }, { label: 'No', next: 'root' }] },
      ws: { id: 'ws', question: 'Confirm: stunting with dry/compacted soil?', action: { title: 'Water Stress or Compaction', details: 'Check irrigation (NIR, GIR) and bulk density. If BD > 1.6, consider deep tillage.', relatedFormulas: ['6.1', '6.2', '7.1'], severity: 'warning' } },
      root: { id: 'root', question: 'Check roots — discolored, stunted, or galls?', action: { title: 'Possible Root Disease', details: 'Consult a plant pathologist. Send soil + root samples to a lab.', relatedFormulas: [], severity: 'critical' } },
    },
  },
  {
    id: 'irrigation-scheduling', title: 'When to Irrigate', icon: 'Droplets', domain: 'crop',
    summary: 'Decide whether to irrigate today based on soil moisture, crop stage, and weather.',
    rootNodeId: 'sm',
    nodes: {
      sm: { id: 'sm', question: 'What is the current soil moisture?', branches: [
        { label: 'Dry (<50% available)', next: 'stage' }, { label: 'Moderate (50–80%)', next: 'wx' }, { label: 'Wet (>80%)', next: 'hold' }] },
      stage: { id: 'stage', question: 'What growth stage?', branches: [
        { label: 'Critical (flowering/grain fill)', next: 'now' }, { label: 'Vegetative', next: 'wx' }] },
      wx: { id: 'wx', question: 'Is significant rain (>10mm) expected in 2 days?', branches: [
        { label: 'Yes', next: 'wait' }, { label: 'No', next: 'et' }] },
      et: { id: 'et', question: 'Is daily ET > 5mm?', branches: [{ label: 'Yes', next: 'now' }, { label: 'No', next: 'mon' }] },
      now: { id: 'now', question: 'Ready to irrigate?', action: { title: 'Irrigate Today', details: 'Calculate NIR (ETc − rainfall), then GIR = NIR ÷ efficiency. Apply the gross amount.', relatedFormulas: ['6.1', '6.2', '6.4'], severity: 'warning' } },
      wait: { id: 'wait', question: 'Confirm: rain expected?', action: { title: 'Wait for Rain', details: 'Hold irrigation 1–2 days. Monitor after rain — if <10mm actual, irrigate.', relatedFormulas: ['6.1'], severity: 'info' } },
      mon: { id: 'mon', question: 'Confirm: moderate moisture, low ET?', action: { title: 'Monitor Daily', details: 'Check soil moisture daily. Irrigate when below 50% available water.', relatedFormulas: ['6.4'], severity: 'info' } },
      hold: { id: 'hold', question: 'Confirm: soil near field capacity?', action: { title: 'Do Not Irrigate', details: 'Soil has adequate water or crop is drying for harvest.', relatedFormulas: ['6.4'], severity: 'info' } },
    },
  },
  {
    id: 'livestock-health', title: 'Livestock Health Triage', icon: 'PawPrint', domain: 'animal',
    summary: 'Quick triage when an animal looks off — decide whether to call a vet, monitor, or adjust.',
    rootNodeId: 'sym',
    nodes: {
      sym: { id: 'sym', question: 'What is the primary symptom?', branches: [
        { label: 'Off feed / reduced intake', next: 'intake' }, { label: 'Drop in milk/egg/weight', next: 'prod' }, { label: 'Labored breathing', next: 'resp' }] },
      intake: { id: 'intake', question: 'Also lethargic or feverish?', branches: [
        { label: 'Yes', next: 'vet' }, { label: 'No', next: 'feed' }] },
      feed: { id: 'feed', question: 'Has feed changed recently?', branches: [
        { label: 'Yes', next: 'fi' }, { label: 'No', next: 'heat' }] },
      fi: { id: 'fi', question: 'Confirm: reduced intake after feed change?', action: { title: 'Feed Quality Issue', details: 'Inspect for mold/spoilage. Switch to known-good batch. Calculate DMI to quantify the drop.', relatedFormulas: ['10.1', '10.6'], severity: 'warning' } },
      heat: { id: 'heat', question: 'Is THI above 72?', branches: [{ label: 'Yes', next: 'hs' }, { label: 'No', next: 'mon24' }] },
      hs: { id: 'hs', question: 'Confirm: reduced intake during hot weather?', action: { title: 'Heat Stress', details: 'Provide shade, ventilation, water. Feed during cooler hours. Expect 10–25% milk drop at THI>80.', relatedFormulas: ['37.1', '10.9'], severity: 'critical' } },
      prod: { id: 'prod', question: 'What type of production drop?', branches: [
        { label: 'Milk yield down', next: 'milk' }, { label: 'Weight loss', next: 'wl' }] },
      milk: { id: 'milk', question: 'Sudden or gradual?', branches: [{ label: 'Sudden', next: 'smilk' }, { label: 'Gradual', next: 'gmilk' }] },
      smilk: { id: 'smilk', question: 'Confirm: sudden milk drop?', action: { title: 'Investigate Immediate Cause', details: 'Check THI, feed, water, SCC for mastitis. Use Diagnose Low Milk Yield workflow.', relatedFormulas: ['10.9', '13.6', '13.8', '37.1'], severity: 'critical' } },
      gmilk: { id: 'gmilk', question: 'Confirm: gradual decline?', action: { title: 'Check Persistency & Nutrition', details: 'Calculate persistency index. If <70%, review energy balance and BCS.', relatedFormulas: ['13.6', '10.9'], severity: 'warning' } },
      wl: { id: 'wl', question: 'Losing weight despite normal intake?', branches: [{ label: 'Yes', next: 'par' }, { label: 'No', next: 'intake' }] },
      par: { id: 'par', question: 'Confirm: weight loss with normal intake?', action: { title: 'Suspect Parasites', details: 'Check fecal egg count. Consider Johne\'s or coccidiosis. Consult a vet.', relatedFormulas: ['11.1'], severity: 'critical' } },
      resp: { id: 'resp', question: 'Nasal discharge, fever, or multiple animals?', action: { title: 'Call a Veterinarian', details: 'Respiratory signs with fever suggest infectious disease. Isolate affected animals.', relatedFormulas: [], severity: 'critical' } },
      vet: { id: 'vet', question: 'Confirm: serious symptoms?', action: { title: 'Call a Vet Immediately', details: 'These symptoms can indicate life-threatening conditions. Isolate the animal.', relatedFormulas: [], severity: 'critical' } },
      mon24: { id: 'mon24', question: 'Confirm: mild symptom, alert animal?', action: { title: 'Monitor 24 Hours', details: 'Check 2–3 times daily. If no improvement in 24h, call a vet.', relatedFormulas: ['10.1'], severity: 'info' } },
    },
  },
];
