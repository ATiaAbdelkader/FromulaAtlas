/**
 * Phenology alert generator — produces crop-stage-based alerts
 * (fertigation switches, sampling windows, irrigation checks, stage transitions).
 */

export type GrowthStage = 'establishment' | 'vegetative' | 'flowering' | 'filling' | 'maturation';

export interface PhenologyAlert {
  type: 'stage_transition' | 'fertigation_switch' | 'sampling_window' | 'irrigation_check' | 'nutrient_focus';
  priority: 'info' | 'warning' | 'action';
  title: string;
  message: string;
  action?: string;
}

const STAGE_INFO: Record<GrowthStage, { label: string; fertigation: string; nutrientFocus: string; sampling?: string }> = {
  establishment: {
    label: 'Establishment',
    fertigation: 'Starter formula (high P, e.g. 10-30-10) at low rate',
    nutrientFocus: 'Phosphorus for root development',
    sampling: 'Soil test (pre-plant)',
  },
  vegetative: {
    label: 'Vegetative',
    fertigation: 'Grow formula (balanced N-K, e.g. 20-10-20) at moderate rate',
    nutrientFocus: 'Nitrogen for canopy expansion',
    sampling: 'Petiole nitrate test',
  },
  flowering: {
    label: 'Flowering',
    fertigation: 'Bloom formula (high K, e.g. 15-15-30) at moderate rate',
    nutrientFocus: 'Potassium + micronutrients (B, Mo) for pollination',
    sampling: 'Leaf analysis (full panel)',
  },
  filling: {
    label: 'Fruit/Grain Fill',
    fertigation: 'Finish formula (high K, low N, e.g. 12-4-26) at peak rate',
    nutrientFocus: 'Potassium + Ca for fruit quality',
    sampling: 'Petiole K test',
  },
  maturation: {
    label: 'Maturation',
    fertigation: 'Reduce or stop (water only or low-rate finish)',
    nutrientFocus: 'Reduce N, maintain Ca',
  },
};

export function getPhenologyAlerts(
  crop: string,
  plantingDate: string,
  currentWeek: number,
  totalWeeks: number
): PhenologyAlert[] {
  const alerts: PhenologyAlert[] = [];

  // Determine current stage from crop params
  const cropLower = crop.toLowerCase();
  const stageBoundaries = getStageBoundaries(cropLower, totalWeeks);
  const currentStage = getStageFromWeek(currentWeek, stageBoundaries);
  const stageInfo = STAGE_INFO[currentStage];

  // 1. Stage transition alert
  const stageStartWeek = stageBoundaries[currentStage];
  if (currentWeek === stageStartWeek || currentWeek === stageStartWeek + 1) {
    alerts.push({
      type: 'stage_transition',
      priority: 'action',
      title: `${stageInfo.label} stage started`,
      message: `Your ${crop} is entering the ${stageInfo.label} stage (week ${currentWeek} of ${totalWeeks}). Key focus: ${stageInfo.nutrientFocus}.`,
      action: stageInfo.fertigation,
    });
  }

  // 2. Fertigation switch reminder (every week during active stages)
  if (currentStage !== 'maturation' && currentWeek > 1) {
    alerts.push({
      type: 'fertigation_switch',
      priority: 'info',
      title: `Fertigation recipe: ${stageInfo.label}`,
      message: `Current recipe: ${stageInfo.fertigation}`,
    });
  }

  // 3. Sampling window
  if (stageInfo.sampling) {
    const samplingWeek = stageStartWeek + Math.floor((stageBoundaries[nextStage(currentStage)] - stageStartWeek) / 2);
    if (currentWeek === samplingWeek || currentWeek === samplingWeek + 1) {
      alerts.push({
        type: 'sampling_window',
        priority: 'warning',
        title: `Time to sample: ${stageInfo.sampling}`,
        message: `Mid-${currentStage} is the optimal window for ${stageInfo.sampling}. Results guide the next fertigation adjustment.`,
        action: `Collect ${stageInfo.sampling.toLowerCase()} this week`,
      });
    }
  }

  // 4. Irrigation check during filling (peak water demand)
  if (currentStage === 'filling') {
    alerts.push({
      type: 'irrigation_check',
      priority: 'warning',
      title: 'Peak water demand — verify irrigation',
      message: `${stageInfo.label} stage has the highest ETc. Check that irrigation is keeping up with the forecast demand.`,
      action: 'Use the Irrigation Balance tool with this week\'s ETo',
    });
  }

  // 5. Maturation: reduce N
  if (currentStage === 'maturation') {
    alerts.push({
      type: 'nutrient_focus',
      priority: 'action',
      title: 'Reduce N, prepare for harvest',
      message: 'In maturation, excess N delays ripening and reduces quality. Cut N to near-zero. Maintain Ca for fruit firmness.',
      action: 'Switch to water-only or low-K finish formula',
    });
  }

  return alerts;
}

function nextStage(stage: GrowthStage): GrowthStage {
  const order: GrowthStage[] = ['establishment', 'vegetative', 'flowering', 'filling', 'maturation'];
  const idx = order.indexOf(stage);
  return order[Math.min(idx + 1, order.length - 1)];
}

function getStageBoundaries(crop: string, totalWeeks: number): Record<GrowthStage, number> {
  // Default ratios; crop-specific overrides come from crop-presets if available
  const ratios: Record<string, Record<GrowthStage, number>> = {
    tomato:     { establishment: 1, vegetative: 4, flowering: 11, filling: 16, maturation: 26 },
    strawberry: { establishment: 1, vegetative: 5, flowering: 11, filling: 17, maturation: 31 },
    avocado:    { establishment: 1, vegetative: 5, flowering: 17, filling: 23, maturation: 45 },
    lettuce:    { establishment: 1, vegetative: 3, flowering: 8,  filling: 10, maturation: 12 },
    pepper:     { establishment: 1, vegetative: 5, flowering: 12, filling: 17, maturation: 27 },
    cucumber:   { establishment: 1, vegetative: 4, flowering: 9,  filling: 13, maturation: 21 },
    citrus:     { establishment: 1, vegetative: 3, flowering: 13, filling: 19, maturation: 43 },
    coffee:     { establishment: 1, vegetative: 5, flowering: 19, filling: 23, maturation: 45 },
    maize:      { establishment: 1, vegetative: 4, flowering: 11, filling: 14, maturation: 20 },
  };

  for (const [key, bounds] of Object.entries(ratios)) {
    if (crop.includes(key)) {
      // Scale to totalWeeks
      const scale = totalWeeks / 28;  // default season length
      return {
        establishment: 1,
        vegetative: Math.round(bounds.vegetative * scale),
        flowering: Math.round(bounds.flowering * scale),
        filling: Math.round(bounds.filling * scale),
        maturation: Math.round(bounds.maturation * scale),
      };
    }
  }

  // Default
  return {
    establishment: 1,
    vegetative: Math.round(totalWeeks * 0.15),
    flowering: Math.round(totalWeeks * 0.35),
    filling: Math.round(totalWeeks * 0.55),
    maturation: Math.round(totalWeeks * 0.85),
  };
}

function getStageFromWeek(week: number, boundaries: Record<GrowthStage, number>): GrowthStage {
  if (week >= boundaries.maturation) return 'maturation';
  if (week >= boundaries.filling) return 'filling';
  if (week >= boundaries.flowering) return 'flowering';
  if (week >= boundaries.vegetative) return 'vegetative';
  return 'establishment';
}

export function getCurrentStage(crop: string, currentWeek: number, totalWeeks: number): GrowthStage {
  const boundaries = getStageBoundaries(crop.toLowerCase(), totalWeeks);
  return getStageFromWeek(currentWeek, boundaries);
}
