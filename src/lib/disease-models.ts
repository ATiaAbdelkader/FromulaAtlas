/**
 * Disease models for predictive alerting.
 *
 * Each model takes weather forecast data (temperature, humidity, rain, leaf wetness)
 * and computes a risk score (0-1) + recommended action.
 *
 * Sources:
 * - Late blight: Smith Period (UK Met Office / BAMF)
 * - Early blight: FAST model (Madden et al. 1978)
 * - Powdery mildew: threshold model (Pérez-Fortea et al. 2013)
 * - Botrytis: Botrytis Decision Support System (Shtienberg & Elad 1997)
 * - Blossom-end rot: VPD-based Ca transport model (Saure 2001, Marcelis & Ho 1999)
 */

export interface DailyWeather {
  date: string;           // ISO date
  tMin: number;           // °C
  tMax: number;           // °C
  tMean: number;          // °C
  rhMin: number;          // %
  rhMax: number;          // %
  rhMean: number;         // %
  rain: number;           // mm
  leafWetnessHours: number; // hours/day
  solarRadiation: number; // W/m² mean
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface DiseaseRisk {
  disease: string;
  crop: string[];
  riskLevel: RiskLevel;
  riskScore: number;      // 0-1
  explanation: string;
  recommendation: string;
  forecastDays: number;   // how many days ahead the risk peaks
}

function levelFromScore(score: number): RiskLevel {
  if (score >= 0.75) return 'critical';
  if (score >= 0.5) return 'high';
  if (score >= 0.25) return 'moderate';
  return 'low';
}

// ---- 1. Late Blight (Phytophthora infestans) — tomato, potato ----
// Smith Period: 2 consecutive days with min T ≥ 10°C and RH ≥ 90% for ≥ 11 hours.
// We approximate "RH ≥ 90% for 11h" using rhMax ≥ 90% and leafWetnessHours ≥ 10.
export function lateBlightRisk(days: DailyWeather[]): DiseaseRisk {
  let consecutiveSmithDays = 0;
  let maxConsecutive = 0;
  let peakDay = 0;

  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    const isSmithDay = d.tMin >= 10 && d.rhMax >= 88 && d.leafWetnessHours >= 10;
    if (isSmithDay) {
      consecutiveSmithDays++;
      if (consecutiveSmithDays > maxConsecutive) {
        maxConsecutive = consecutiveSmithDays;
        peakDay = i;
      }
    } else {
      consecutiveSmithDays = 0;
    }
  }

  // Score: 2 consecutive Smith days = 1.0; 1 day = 0.5; 0 = 0
  const score = Math.min(1, maxConsecutive * 0.5);
  const level = levelFromScore(score);

  return {
    disease: 'Late Blight (Phytophthora infestans)',
    crop: ['tomato', 'potato'],
    riskLevel: level,
    riskScore: score,
    explanation: maxConsecutive >= 2
      ? `${maxConsecutive} consecutive Smith Period days detected (min T ≥ 10°C, RH ≥ 90%, leaf wetness ≥ 10h). Spores will germinate and infect rapidly.`
      : maxConsecutive === 1
        ? '1 Smith Period day detected — conditions are borderline. Monitor closely.'
        : 'No Smith Period conditions in the 7-day forecast.',
    recommendation: level === 'critical' || level === 'high'
      ? 'Apply preventive fungicide (copper or mancozeb) within 24h. Ensure complete canopy coverage. Repeat in 7 days if conditions persist.'
      : level === 'moderate'
        ? 'Prepare fungicide application. Monitor forecast daily. Remove infected plant material.'
        : 'No action needed. Continue routine scouting.',
    forecastDays: peakDay,
  };
}

// ---- 2. Early Blight (Alternaria solani) — tomato, potato ----
// FAST model simplified: temperature 18-28°C + leaf wetness ≥ 12h → high risk.
// Also: consecutive days with optimal temp accumulate risk.
export function earlyBlightRisk(days: DailyWeather[]): DiseaseRisk {
  let optimalDays = 0;
  let peakDay = 0;
  let maxScore = 0;

  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    const tempOptimal = d.tMean >= 18 && d.tMean <= 28;
    const wetnessOk = d.leafWetnessHours >= 10;
    if (tempOptimal && wetnessOk) {
      optimalDays++;
      const score = Math.min(1, optimalDays * 0.35);
      if (score > maxScore) { maxScore = score; peakDay = i; }
    } else {
      optimalDays = Math.max(0, optimalDays - 1);
    }
  }

  const score = maxScore;
  const level = levelFromScore(score);

  return {
    disease: 'Early Blight (Alternaria solani)',
    crop: ['tomato', 'potato'],
    riskLevel: level,
    riskScore: score,
    explanation: score >= 0.5
      ? `${optimalDays} days with optimal conditions (18-28°C + leaf wetness ≥ 10h). Alternaria sporulates rapidly under these conditions.`
      : 'Conditions not optimal for Alternaria in the 7-day forecast.',
    recommendation: level === 'high' || level === 'critical'
      ? 'Apply fungicide (chlorothalonil or azoxystrobin). Remove lower infected leaves. Improve airflow.'
      : level === 'moderate'
        ? 'Monitor lower leaves for target-spot lesions. Prepare fungicide.'
        : 'No action needed. Continue scouting.',
    forecastDays: peakDay,
  };
}

// ---- 3. Powdery Mildew — cucumber, strawberry, grape, rose ----
// Optimal: 15-30°C + RH 50-90% (NOT free water — powdery mildew germinates without leaf wetness).
// High risk when warm days + moderate humidity persist for 3+ days.
export function powderyMildewRisk(days: DailyWeather[]): DiseaseRisk {
  let favorableDays = 0;
  let peakDay = 0;
  let maxScore = 0;

  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    const tempOk = d.tMean >= 15 && d.tMean <= 30;
    const rhOk = d.rhMean >= 40 && d.rhMean <= 90;
    const noHeavyRain = d.rain < 10;  // heavy rain washes spores
    if (tempOk && rhOk && noHeavyRain) {
      favorableDays++;
      const score = Math.min(1, favorableDays * 0.3);
      if (score > maxScore) { maxScore = score; peakDay = i; }
    } else {
      favorableDays = Math.max(0, favorableDays - 1);
    }
  }

  const score = maxScore;
  const level = levelFromScore(score);

  return {
    disease: 'Powdery Mildew',
    crop: ['cucumber', 'strawberry', 'grape', 'rose', 'pepper'],
    riskLevel: level,
    riskScore: score,
    explanation: score >= 0.5
      ? `${favorableDays} days with favorable conditions (15-30°C, RH 40-90%, no heavy rain). Powdery mildew spreads rapidly without leaf wetness.`
      : 'Conditions not favorable for powdery mildew in the 7-day forecast.',
    recommendation: level === 'high' || level === 'critical'
      ? 'Apply fungicide (sulfur, potassium bicarbonate, or triazole). Remove infected leaves. Improve ventilation in greenhouses.'
      : level === 'moderate'
        ? 'Monitor for white patches on upper leaf surfaces. Prepare fungicide.'
        : 'No action needed.',
    forecastDays: peakDay,
  };
}

// ---- 4. Botrytis (Grey Mould) — strawberry, grape, tomato, cannabis ----
// Optimal: 15-25°C + RH > 90% + free moisture (rain or heavy dew) for 12h+.
export function botrytisRisk(days: DailyWeather[]): DiseaseRisk {
  let favorableDays = 0;
  let peakDay = 0;
  let maxScore = 0;

  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    const tempOk = d.tMean >= 15 && d.tMean <= 25;
    const humidityOk = d.rhMax >= 90;
    const moistureOk = d.rain > 1 || d.leafWetnessHours >= 12;
    if (tempOk && humidityOk && moistureOk) {
      favorableDays++;
      const score = Math.min(1, favorableDays * 0.4);
      if (score > maxScore) { maxScore = score; peakDay = i; }
    } else {
      favorableDays = Math.max(0, favorableDays - 1);
    }
  }

  const score = maxScore;
  const level = levelFromScore(score);

  return {
    disease: 'Botrytis Grey Mould',
    crop: ['strawberry', 'grape', 'tomato', 'cannabis', 'pepper'],
    riskLevel: level,
    riskScore: score,
    explanation: score >= 0.5
      ? `${favorableDays} days with favorable conditions (15-25°C, RH > 90%, free moisture ≥ 12h). Botrytis infects flowers and wounded tissue.`
      : 'Conditions not favorable for Botrytis in the 7-day forecast.',
    recommendation: level === 'high' || level === 'critical'
      ? 'Apply fungicide (fenhexamid, cyprodinil, orSwitch). Remove dead/infected tissue. Reduce humidity in greenhouses. Avoid overhead irrigation.'
      : level === 'moderate'
        ? 'Monitor flowers and wounded tissue for grey fuzz. Prepare fungicide.'
        : 'No action needed.',
    forecastDays: peakDay,
  };
}

// ---- 5. Blossom-End Rot Risk — tomato, pepper ----
// Caused by Ca transport failure. Triggered by:
//   - Low VPD (< 0.4 kPa) → low transpiration → Ca doesn't reach fruit
//   - High VPD (> 1.8 kPa) → stomata close → transpiration stops → Ca stalls
//   - Rapid growth stage (flowering → early filling) → demand exceeds supply
//   - Water stress (alternating wet/dry)
export function blossomEndRotRisk(days: DailyWeather[], growthStage: 'establishment' | 'vegetative' | 'flowering' | 'filling' | 'maturation'): DiseaseRisk {
  let riskDays = 0;
  let peakDay = 0;

  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    // Approximate VPD from T and RH
    const svp = 0.6108 * Math.exp((17.27 * d.tMean) / (d.tMean + 237.3));
    const vpd = svp * (1 - d.rhMean / 100);
    const lowVpd = vpd < 0.4;
    const highVpd = vpd > 1.8;
    const waterStress = d.rain === 0 && d.tMax > 30;  // dry + hot
    if ((lowVpd || highVpd || waterStress) && (growthStage === 'flowering' || growthStage === 'filling')) {
      riskDays++;
      if (riskDays >= 2) peakDay = i;
    }
  }

  const stageMultiplier = (growthStage === 'flowering' || growthStage === 'filling') ? 1 : 0.3;
  const score = Math.min(1, (riskDays * 0.35) * stageMultiplier);
  const level = levelFromScore(score);

  return {
    disease: 'Blossom-End Rot Risk (Ca transport)',
    crop: ['tomato', 'pepper'],
    riskLevel: level,
    riskScore: score,
    explanation: score >= 0.5
      ? `${riskDays} days with Ca-transport stress (VPD < 0.4 or > 1.8 kPa, or hot/dry) during ${growthStage} stage. Fruit Ca uptake is compromised.`
      : `Low Ca-transport stress in the 7-day forecast during ${growthStage} stage.`,
    recommendation: level === 'high' || level === 'critical'
      ? 'Apply foliar Ca (CaCl₂ or Ca(NO₃)₂ at 0.5% solution) targeting fruit. Ensure consistent irrigation (avoid wet-dry swings). Consider VPD management in greenhouses (target 0.8-1.2 kPa).'
      : level === 'moderate'
        ? 'Monitor fruit for early BER symptoms. Maintain consistent irrigation. Have foliar Ca ready.'
        : 'No action needed. Continue routine Ca monitoring.',
    forecastDays: peakDay,
  };
}

// ---- Run all applicable models for a crop ----
export function runAllDiseaseModels(days: DailyWeather[], crop: string, growthStage: 'establishment' | 'vegetative' | 'flowering' | 'filling' | 'maturation'): DiseaseRisk[] {
  const cropLower = crop.toLowerCase();
  const allModels: Array<() => DiseaseRisk> = [];

  if (cropLower.includes('tomato') || cropLower.includes('potato')) {
    allModels.push(() => lateBlightRisk(days));
    allModels.push(() => earlyBlightRisk(days));
  }
  if (['cucumber', 'strawberry', 'grape', 'rose', 'pepper'].some(c => cropLower.includes(c))) {
    allModels.push(() => powderyMildewRisk(days));
  }
  if (['strawberry', 'grape', 'tomato', 'cannabis', 'pepper'].some(c => cropLower.includes(c))) {
    allModels.push(() => botrytisRisk(days));
  }
  if (cropLower.includes('tomato') || cropLower.includes('pepper')) {
    allModels.push(() => blossomEndRotRisk(days, growthStage));
  }

  return allModels.map(fn => fn()).sort((a, b) => b.riskScore - a.riskScore);
}
