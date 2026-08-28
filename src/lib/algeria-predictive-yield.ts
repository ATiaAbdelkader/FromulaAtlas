/**
 * Formula Atlas - Algerian Regional Historical Yield Engine & Predictive Estimator
 *
 * Grounded in Algerian agricultural statistics (MADR, DSA wilaya reports,
 * ITGC Cereal Technical Institute, ITDAS Saharan Agriculture Institute, INRAA).
 */

export interface AlgeriaRegionBenchmark {
  id: string;
  wilayas: string[];
  name: { en: string; ar: string; fr: string };
  climateZone: { en: string; ar: string; fr: string };
  defaultRainfallMm: number;
  defaultSoilType: 'clay_loam' | 'sandy_dune' | 'calciferous_loam' | 'alluvial_silt' | 'sandy_loam';
  defaultSalinityDsm: number;
  defaultWaterSource: 'rainfed' | 'borehole_albian' | 'dam_irrigation' | 'shallow_well';
  frostRisk: 'low' | 'moderate' | 'high' | 'severe';
  heatSiroccoRisk: 'low' | 'moderate' | 'high' | 'extreme';
  cropBaselines: Record<string, {
    historicalMeanYieldTonsHa: number; // 10-year statistical average
    historicalLowYieldTonsHa: number;  // Drought/unfavorable season (10th percentile)
    historicalHighYieldTonsHa: number; // Top technical farmer / optimal season (90th percentile)
    potentialBioclimaticCeilingTonsHa: number; // Maximum theoretical yield under non-limiting inputs
    stdDevYieldTonsHa: number;
    recommendedPlantingWindow: { startMonth: number; startDay: number; endMonth: number; endDay: number };
    typicalIrrigationReqM3Ha: number;
    nitrogenReqKgPerTon: number;
  }>;
}

export const ALGERIA_REGIONAL_BENCHMARKS: AlgeriaRegionBenchmark[] = [
  {
    id: 'high_plateaus_east',
    wilayas: ['Sétif', 'Bordj Bou Arreridj', 'Batna', 'Oum El Bouaghi', 'Mila'],
    name: {
      en: 'Eastern High Plateaus (Sétif / Batna / BBA)',
      ar: 'الهضاب العليا الشرقية (سطيف / باتنة / برج بوعريريج)',
      fr: 'Hauts Plateaux Est (Sétif / Batna / BBA)',
    },
    climateZone: {
      en: 'Continental Semi-Arid (Cold winters, spring frost risk)',
      ar: 'شبه جاف قاري (شتاء بارد، خطر صقيع ربيعي)',
      fr: 'Semi-aride continental (Hivers froids, gelées printanières)',
    },
    defaultRainfallMm: 380,
    defaultSoilType: 'calciferous_loam',
    defaultSalinityDsm: 0.8,
    defaultWaterSource: 'rainfed',
    frostRisk: 'high',
    heatSiroccoRisk: 'moderate',
    cropBaselines: {
      wheat: {
        historicalMeanYieldTonsHa: 2.8,
        historicalLowYieldTonsHa: 1.4,
        historicalHighYieldTonsHa: 5.5,
        potentialBioclimaticCeilingTonsHa: 7.2,
        stdDevYieldTonsHa: 0.9,
        recommendedPlantingWindow: { startMonth: 10, startDay: 20, endMonth: 12, endDay: 10 },
        typicalIrrigationReqM3Ha: 1600, // Supplemental
        nitrogenReqKgPerTon: 28,
      },
      barley: {
        historicalMeanYieldTonsHa: 2.3,
        historicalLowYieldTonsHa: 1.1,
        historicalHighYieldTonsHa: 4.2,
        potentialBioclimaticCeilingTonsHa: 5.5,
        stdDevYieldTonsHa: 0.7,
        recommendedPlantingWindow: { startMonth: 10, startDay: 15, endMonth: 11, endDay: 30 },
        typicalIrrigationReqM3Ha: 1100,
        nitrogenReqKgPerTon: 22,
      },
      potato: {
        historicalMeanYieldTonsHa: 26,
        historicalLowYieldTonsHa: 18,
        historicalHighYieldTonsHa: 40,
        potentialBioclimaticCeilingTonsHa: 52,
        stdDevYieldTonsHa: 4.5,
        recommendedPlantingWindow: { startMonth: 3, startDay: 1, endMonth: 4, endDay: 15 },
        typicalIrrigationReqM3Ha: 4800,
        nitrogenReqKgPerTon: 5.5,
      },
      tomato: {
        historicalMeanYieldTonsHa: 42,
        historicalLowYieldTonsHa: 25,
        historicalHighYieldTonsHa: 68,
        potentialBioclimaticCeilingTonsHa: 85,
        stdDevYieldTonsHa: 8.0,
        recommendedPlantingWindow: { startMonth: 4, startDay: 10, endMonth: 5, endDay: 20 },
        typicalIrrigationReqM3Ha: 5500,
        nitrogenReqKgPerTon: 3.2,
      },
      onion: {
        historicalMeanYieldTonsHa: 28,
        historicalLowYieldTonsHa: 18,
        historicalHighYieldTonsHa: 45,
        potentialBioclimaticCeilingTonsHa: 58,
        stdDevYieldTonsHa: 5.2,
        recommendedPlantingWindow: { startMonth: 2, startDay: 15, endMonth: 3, endDay: 30 },
        typicalIrrigationReqM3Ha: 4200,
        nitrogenReqKgPerTon: 4.0,
      },
      canola: {
        historicalMeanYieldTonsHa: 1.6,
        historicalLowYieldTonsHa: 0.8,
        historicalHighYieldTonsHa: 2.8,
        potentialBioclimaticCeilingTonsHa: 3.6,
        stdDevYieldTonsHa: 0.45,
        recommendedPlantingWindow: { startMonth: 10, startDay: 15, endMonth: 11, endDay: 20 },
        typicalIrrigationReqM3Ha: 1400,
        nitrogenReqKgPerTon: 45,
      },
      sunflower: {
        historicalMeanYieldTonsHa: 1.5,
        historicalLowYieldTonsHa: 0.9,
        historicalHighYieldTonsHa: 2.5,
        potentialBioclimaticCeilingTonsHa: 3.2,
        stdDevYieldTonsHa: 0.35,
        recommendedPlantingWindow: { startMonth: 3, startDay: 15, endMonth: 4, endDay: 30 },
        typicalIrrigationReqM3Ha: 2200,
        nitrogenReqKgPerTon: 38,
      },
    },
  },
  {
    id: 'sahara_biskra_ziban',
    wilayas: ['Biskra', 'Ouled Djellal', 'El M’Ghair'],
    name: {
      en: 'Ziban Oasis & Foothills (Biskra / Tolga / Sidi Okba)',
      ar: 'واحات الزيبان (بسكرة / طولقة / سيدي عقبة)',
      fr: 'Oasis des Ziban (Biskra / Tolga / Sidi Okba)',
    },
    climateZone: {
      en: 'Arid Warm Oasis (High winter sunlight, dry air, early season market)',
      ar: 'واحات قاحلة دافئة (إشعاع شمسي شتوي عال، جفاف، بواكير مبكرة)',
      fr: 'Aride oasien chaud (Ensoleillement hivernal intense, primeurs)',
    },
    defaultRainfallMm: 140,
    defaultSoilType: 'sandy_loam',
    defaultSalinityDsm: 2.6,
    defaultWaterSource: 'shallow_well',
    frostRisk: 'low',
    heatSiroccoRisk: 'high',
    cropBaselines: {
      tomato: {
        historicalMeanYieldTonsHa: 88, // Greenhouse protected
        historicalLowYieldTonsHa: 60,
        historicalHighYieldTonsHa: 135,
        potentialBioclimaticCeilingTonsHa: 160,
        stdDevYieldTonsHa: 14.0,
        recommendedPlantingWindow: { startMonth: 9, startDay: 15, endMonth: 10, endDay: 30 },
        typicalIrrigationReqM3Ha: 7500,
        nitrogenReqKgPerTon: 3.0,
      },
      potato: {
        historicalMeanYieldTonsHa: 32,
        historicalLowYieldTonsHa: 22,
        historicalHighYieldTonsHa: 46,
        potentialBioclimaticCeilingTonsHa: 56,
        stdDevYieldTonsHa: 5.0,
        recommendedPlantingWindow: { startMonth: 10, startDay: 1, endMonth: 11, endDay: 15 },
        typicalIrrigationReqM3Ha: 5200,
        nitrogenReqKgPerTon: 5.2,
      },
      onion: {
        historicalMeanYieldTonsHa: 35,
        historicalLowYieldTonsHa: 24,
        historicalHighYieldTonsHa: 52,
        potentialBioclimaticCeilingTonsHa: 65,
        stdDevYieldTonsHa: 6.0,
        recommendedPlantingWindow: { startMonth: 10, startDay: 1, endMonth: 11, endDay: 15 },
        typicalIrrigationReqM3Ha: 4800,
        nitrogenReqKgPerTon: 3.8,
      },
      wheat: {
        historicalMeanYieldTonsHa: 4.8, // Irrigated pivot
        historicalLowYieldTonsHa: 3.2,
        historicalHighYieldTonsHa: 7.2,
        potentialBioclimaticCeilingTonsHa: 8.5,
        stdDevYieldTonsHa: 0.85,
        recommendedPlantingWindow: { startMonth: 11, startDay: 15, endMonth: 12, endDay: 20 },
        typicalIrrigationReqM3Ha: 4500,
        nitrogenReqKgPerTon: 26,
      },
      barley: {
        historicalMeanYieldTonsHa: 4.0,
        historicalLowYieldTonsHa: 2.8,
        historicalHighYieldTonsHa: 6.0,
        potentialBioclimaticCeilingTonsHa: 7.0,
        stdDevYieldTonsHa: 0.7,
        recommendedPlantingWindow: { startMonth: 11, startDay: 10, endMonth: 12, endDay: 15 },
        typicalIrrigationReqM3Ha: 3800,
        nitrogenReqKgPerTon: 20,
      },
    },
  },
  {
    id: 'desert_erg_el_oued',
    wilayas: ['El Oued', 'Touggourt', 'Ouargla', 'Ghardaïa', 'Adrar', 'Timimoun'],
    name: {
      en: 'Grand Erg Dunes & Sahara Basins (El Oued / Adrar / Touggourt)',
      ar: 'العرق الشرقي وأحواض الصحراء (الوادي / أدرار / تقرت)',
      fr: 'Grand Erg & Bassins Sahariens (El Oued / Adrar / Touggourt)',
    },
    climateZone: {
      en: 'Hyper-Arid Sand Dunes (Center-pivot Albian deep water, intense solar radiation)',
      ar: 'صحراوي رملي فائق الجفاف (ري محوري مياه الألبيان، إشعاع شمسي مكثف)',
      fr: 'Hyper-aride sur sables (Pivots albien, fort rayonnement)',
    },
    defaultRainfallMm: 60,
    defaultSoilType: 'sandy_dune',
    defaultSalinityDsm: 1.8,
    defaultWaterSource: 'borehole_albian',
    frostRisk: 'low',
    heatSiroccoRisk: 'extreme',
    cropBaselines: {
      potato: {
        historicalMeanYieldTonsHa: 36,
        historicalLowYieldTonsHa: 24,
        historicalHighYieldTonsHa: 52,
        potentialBioclimaticCeilingTonsHa: 62,
        stdDevYieldTonsHa: 5.8,
        recommendedPlantingWindow: { startMonth: 10, startDay: 10, endMonth: 11, endDay: 25 },
        typicalIrrigationReqM3Ha: 6200,
        nitrogenReqKgPerTon: 5.8,
      },
      wheat: {
        historicalMeanYieldTonsHa: 5.2, // Intensive pivot
        historicalLowYieldTonsHa: 3.5,
        historicalHighYieldTonsHa: 8.0,
        potentialBioclimaticCeilingTonsHa: 9.2,
        stdDevYieldTonsHa: 0.95,
        recommendedPlantingWindow: { startMonth: 11, startDay: 20, endMonth: 12, endDay: 25 },
        typicalIrrigationReqM3Ha: 5800,
        nitrogenReqKgPerTon: 26,
      },
      maize: {
        historicalMeanYieldTonsHa: 7.8,
        historicalLowYieldTonsHa: 4.8,
        historicalHighYieldTonsHa: 11.5,
        potentialBioclimaticCeilingTonsHa: 13.5,
        stdDevYieldTonsHa: 1.4,
        recommendedPlantingWindow: { startMonth: 7, startDay: 1, endMonth: 7, endDay: 30 },
        typicalIrrigationReqM3Ha: 8500,
        nitrogenReqKgPerTon: 24,
      },
      alfalfa: {
        historicalMeanYieldTonsHa: 16.0, // 6-8 cuts/year
        historicalLowYieldTonsHa: 10.0,
        historicalHighYieldTonsHa: 24.0,
        potentialBioclimaticCeilingTonsHa: 28.0,
        stdDevYieldTonsHa: 2.6,
        recommendedPlantingWindow: { startMonth: 9, startDay: 15, endMonth: 10, endDay: 30 },
        typicalIrrigationReqM3Ha: 14000,
        nitrogenReqKgPerTon: 1.5,
      },
      tomato: {
        historicalMeanYieldTonsHa: 75,
        historicalLowYieldTonsHa: 50,
        historicalHighYieldTonsHa: 110,
        potentialBioclimaticCeilingTonsHa: 130,
        stdDevYieldTonsHa: 12.0,
        recommendedPlantingWindow: { startMonth: 9, startDay: 20, endMonth: 10, endDay: 30 },
        typicalIrrigationReqM3Ha: 8000,
        nitrogenReqKgPerTon: 3.2,
      },
      onion: {
        historicalMeanYieldTonsHa: 38,
        historicalLowYieldTonsHa: 25,
        historicalHighYieldTonsHa: 58,
        potentialBioclimaticCeilingTonsHa: 68,
        stdDevYieldTonsHa: 6.5,
        recommendedPlantingWindow: { startMonth: 10, startDay: 1, endMonth: 11, endDay: 10 },
        typicalIrrigationReqM3Ha: 5500,
        nitrogenReqKgPerTon: 4.0,
      },
    },
  },
  {
    id: 'coastal_mitidja_plains',
    wilayas: ['Blida', 'Algiers', 'Boumerdès', 'Tipaza', 'Chlef', 'Ain Defla'],
    name: {
      en: 'Mitidja & Coastal Plains (Blida / Tipaza / Ain Defla)',
      ar: 'سهل متيجة والسهول الساحلية (البليدة / تيبازة / عين الدفلى)',
      fr: 'Plaine de la Mitidja & Littoral (Blida / Tipaza / Aïn Defla)',
    },
    climateZone: {
      en: 'Sub-Humid / Mediterranean Maritime (Fertile alluvium, mild winter)',
      ar: 'شبه رطب / متوسطي ساحلي (تربة رسوبية خصبة، شتاء معتدل)',
      fr: 'Subhumide / Maritime méditerranéen (Alluvions fertiles)',
    },
    defaultRainfallMm: 620,
    defaultSoilType: 'alluvial_silt',
    defaultSalinityDsm: 0.6,
    defaultWaterSource: 'dam_irrigation',
    frostRisk: 'low',
    heatSiroccoRisk: 'low',
    cropBaselines: {
      potato: {
        historicalMeanYieldTonsHa: 31,
        historicalLowYieldTonsHa: 20,
        historicalHighYieldTonsHa: 48,
        potentialBioclimaticCeilingTonsHa: 58,
        stdDevYieldTonsHa: 5.2,
        recommendedPlantingWindow: { startMonth: 11, startDay: 1, endMonth: 12, endDay: 15 },
        typicalIrrigationReqM3Ha: 3400,
        nitrogenReqKgPerTon: 5.4,
      },
      tomato: {
        historicalMeanYieldTonsHa: 58,
        historicalLowYieldTonsHa: 35,
        historicalHighYieldTonsHa: 88,
        potentialBioclimaticCeilingTonsHa: 105,
        stdDevYieldTonsHa: 9.5,
        recommendedPlantingWindow: { startMonth: 3, startDay: 15, endMonth: 4, endDay: 30 },
        typicalIrrigationReqM3Ha: 4600,
        nitrogenReqKgPerTon: 3.3,
      },
      wheat: {
        historicalMeanYieldTonsHa: 3.6,
        historicalLowYieldTonsHa: 2.2,
        historicalHighYieldTonsHa: 6.5,
        potentialBioclimaticCeilingTonsHa: 8.0,
        stdDevYieldTonsHa: 0.8,
        recommendedPlantingWindow: { startMonth: 11, startDay: 1, endMonth: 12, endDay: 15 },
        typicalIrrigationReqM3Ha: 1200,
        nitrogenReqKgPerTon: 27,
      },
      onion: {
        historicalMeanYieldTonsHa: 32,
        historicalLowYieldTonsHa: 20,
        historicalHighYieldTonsHa: 48,
        potentialBioclimaticCeilingTonsHa: 60,
        stdDevYieldTonsHa: 5.0,
        recommendedPlantingWindow: { startMonth: 1, startDay: 15, endMonth: 2, endDay: 28 },
        typicalIrrigationReqM3Ha: 3600,
        nitrogenReqKgPerTon: 3.9,
      },
      citrus: {
        historicalMeanYieldTonsHa: 24,
        historicalLowYieldTonsHa: 15,
        historicalHighYieldTonsHa: 38,
        potentialBioclimaticCeilingTonsHa: 48,
        stdDevYieldTonsHa: 4.2,
        recommendedPlantingWindow: { startMonth: 2, startDay: 1, endMonth: 3, endDay: 30 },
        typicalIrrigationReqM3Ha: 6000,
        nitrogenReqKgPerTon: 6.0,
      },
    },
  },
  {
    id: 'north_west_mascara_hills',
    wilayas: ['Mascara', 'Relizane', 'Mostaganem', 'Sidi Bel Abbès', 'Tlemcen'],
    name: {
      en: 'North-West Hills & Valleys (Mascara / Relizane / Mostaganem)',
      ar: 'الهضاب والوديان الشمالية الغربية (معسكر / غليزان / مستغانم)',
      fr: 'Collines & Vallées Nord-Ouest (Mascara / Relizane / Mostaganem)',
    },
    climateZone: {
      en: 'Semi-Arid Western Basin (Habra/Mina valleys, intense market garden & arboriculture)',
      ar: 'شبه جاف غربي (سهول هبرة ومينا، خضروات مكثفة وأشجار مثمرة)',
      fr: 'Semi-aride Ouest (Plaines Habra/Mina, arboriculture & maraîchage)',
    },
    defaultRainfallMm: 340,
    defaultSoilType: 'clay_loam',
    defaultSalinityDsm: 2.1,
    defaultWaterSource: 'dam_irrigation',
    frostRisk: 'moderate',
    heatSiroccoRisk: 'high',
    cropBaselines: {
      potato: {
        historicalMeanYieldTonsHa: 28,
        historicalLowYieldTonsHa: 18,
        historicalHighYieldTonsHa: 44,
        potentialBioclimaticCeilingTonsHa: 54,
        stdDevYieldTonsHa: 4.8,
        recommendedPlantingWindow: { startMonth: 8, startDay: 15, endMonth: 9, endDay: 30 },
        typicalIrrigationReqM3Ha: 4200,
        nitrogenReqKgPerTon: 5.5,
      },
      onion: {
        historicalMeanYieldTonsHa: 30,
        historicalLowYieldTonsHa: 19,
        historicalHighYieldTonsHa: 48,
        potentialBioclimaticCeilingTonsHa: 58,
        stdDevYieldTonsHa: 5.0,
        recommendedPlantingWindow: { startMonth: 12, startDay: 1, endMonth: 1, endDay: 20 },
        typicalIrrigationReqM3Ha: 4000,
        nitrogenReqKgPerTon: 4.0,
      },
      wheat: {
        historicalMeanYieldTonsHa: 2.6,
        historicalLowYieldTonsHa: 1.3,
        historicalHighYieldTonsHa: 5.0,
        potentialBioclimaticCeilingTonsHa: 6.8,
        stdDevYieldTonsHa: 0.75,
        recommendedPlantingWindow: { startMonth: 11, startDay: 1, endMonth: 12, endDay: 10 },
        typicalIrrigationReqM3Ha: 1500,
        nitrogenReqKgPerTon: 28,
      },
      tomato: {
        historicalMeanYieldTonsHa: 50,
        historicalLowYieldTonsHa: 30,
        historicalHighYieldTonsHa: 76,
        potentialBioclimaticCeilingTonsHa: 95,
        stdDevYieldTonsHa: 8.2,
        recommendedPlantingWindow: { startMonth: 3, startDay: 20, endMonth: 5, endDay: 10 },
        typicalIrrigationReqM3Ha: 5200,
        nitrogenReqKgPerTon: 3.2,
      },
      grapes: {
        historicalMeanYieldTonsHa: 14,
        historicalLowYieldTonsHa: 8,
        historicalHighYieldTonsHa: 22,
        potentialBioclimaticCeilingTonsHa: 28,
        stdDevYieldTonsHa: 2.8,
        recommendedPlantingWindow: { startMonth: 2, startDay: 1, endMonth: 3, endDay: 15 },
        typicalIrrigationReqM3Ha: 3200,
        nitrogenReqKgPerTon: 4.5,
      },
    },
  },
];

/** Generic fallback when specific crop is not indexed in that region */
const DEFAULT_CROP_BASELINE = {
  historicalMeanYieldTonsHa: 4.0,
  historicalLowYieldTonsHa: 2.2,
  historicalHighYieldTonsHa: 6.8,
  potentialBioclimaticCeilingTonsHa: 8.5,
  stdDevYieldTonsHa: 0.8,
  recommendedPlantingWindow: { startMonth: 10, startDay: 15, endMonth: 12, endDay: 15 },
  typicalIrrigationReqM3Ha: 3000,
  nitrogenReqKgPerTon: 25,
};

export interface PredictiveYieldInput {
  cropId: string;
  regionId: string;
  plantingDate: string;
  irrigationSystem: 'drip' | 'sprinkler' | 'furrow' | 'rainfed';
  soilSalinityDsm: number;
  soilOrganicMatterPct: number;
  fertilizerIntensity: 'sub_optimal' | 'moderate' | 'optimal' | 'intensive_fertigation';
  appliedNitrogenKgHa: number;
  seedQualityTier: 'farm_saved_untested' | 'standard_commercial' | 'certified_oaic_g1_g2';
  cropProtectionLevel: 'none' | 'curative_minimal' | 'preventive_standard' | 'integrated_ipm';
  plannedWaterM3Ha?: number;
}

export interface YieldFactorImpact {
  id: string;
  label: { en: string; ar: string; fr: string };
  multiplier: number; // 1.0 = baseline, 0.85 = -15% penalty, 1.15 = +15% boost
  deltaTonsHa: number;
  status: 'positive' | 'neutral' | 'penalty' | 'severe_penalty';
  explanation: { en: string; ar: string; fr: string };
}

export interface PredictiveYieldResult {
  region: AlgeriaRegionBenchmark;
  cropId: string;
  predictedYieldTonsHa: number;
  yieldConfidenceRange: {
    min80Pct: number;
    max80Pct: number;
  };
  historicalMeanYieldTonsHa: number;
  historicalLowYieldTonsHa: number;
  historicalHighYieldTonsHa: number;
  potentialCeilingTonsHa: number;
  successProbabilityPct: number; // 0 - 100%
  successRating: 'exceptional' | 'high' | 'moderate' | 'high_risk' | 'critical_failure_risk';
  limitingFactors: YieldFactorImpact[];
  boostingFactors: YieldFactorImpact[];
  allFactors: YieldFactorImpact[];
  waterStressPenaltyPct: number;
  soilLimitationPenaltyPct: number;
  climateTimingPenaltyPct: number;
  nutritionEfficiencyPct: number;
  protectionEfficiencyPct: number;
  actionableRecommendations: Array<{
    category: 'irrigation' | 'nutrition' | 'soil' | 'timing' | 'protection' | 'seed';
    priority: 'high' | 'medium' | 'info';
    action: { en: string; ar: string; fr: string };
    gainPotentialTonsHa: number;
  }>;
}

/**
 * Multi-factor Agronomic Yield Prediction Engine for Algeria
 */
export function calculateAlgeriaPredictiveYield(input: PredictiveYieldInput): PredictiveYieldResult {
  const region = ALGERIA_REGIONAL_BENCHMARKS.find((r) => r.id === input.regionId) || ALGERIA_REGIONAL_BENCHMARKS[0];
  const baseline = region.cropBaselines[input.cropId] || DEFAULT_CROP_BASELINE;

  const factors: YieldFactorImpact[] = [];

  // 1. WATER & IRRIGATION SYSTEM FACTOR
  let irrigationMult = 1.0;
  let irrigationExpEn = 'Adequate standard water supply.';
  let irrigationExpAr = 'إمداد مائي قياسي كافٍ.';
  let irrigationExpFr = 'Apport d’eau standard adéquat.';

  if (input.irrigationSystem === 'drip') {
    irrigationMult = 1.18;
    irrigationExpEn = 'Precision drip delivery maximizes water use efficiency (WUE) and root zone aeration.';
    irrigationExpAr = 'الري بالتنقيط الدقيق يرفع كفاءة استخدام المياه (WUE) وتهوية منطقة الجذور.';
    irrigationExpFr = 'Goutte-à-goutte de précision : efficience maximale de l’eau (WUE) et aération racinaire.';
  } else if (input.irrigationSystem === 'sprinkler') {
    irrigationMult = 1.05;
    irrigationExpEn = 'Pivot / Sprinkler uniform distribution with moderate evaporation loss in warm hours.';
    irrigationExpAr = 'توزيع منتظم للرش المحوري مع فواقد تبخر معتدلة في الساعات الحارة.';
    irrigationExpFr = 'Aspersion/Pivot uniforme avec pertes par évaporation modérées.';
  } else if (input.irrigationSystem === 'furrow') {
    irrigationMult = 0.85;
    irrigationExpEn = 'Surface furrow creates uneven infiltration and root waterlogging risks.';
    irrigationExpAr = 'الري السطحي بالغمر يسبب عدم تجانس تسرب المياه ومخاطر اختناق الجذور.';
    irrigationExpFr = 'Gravitaire/Raie : hétérogénéité d’infiltration et risques d’asphyxie racinaire.';
  } else if (input.irrigationSystem === 'rainfed') {
    // Rainfed depends heavily on regional rainfall
    if (region.defaultRainfallMm < 300) {
      irrigationMult = 0.45;
      irrigationExpEn = `Rainfed regime in arid zone (${region.defaultRainfallMm}mm) incurs acute drought deficit.`;
      irrigationExpAr = `النمط المطري في منطقة جافة (${region.defaultRainfallMm} مم) يتعرض لعجز مائي حاد وجفاف.`;
      irrigationExpFr = `Régime pluvial en zone aride (${region.defaultRainfallMm}mm) : déficit hydrique sévère.`;
    } else if (region.defaultRainfallMm < 450) {
      irrigationMult = 0.72;
      irrigationExpEn = `Rainfed semi-arid (${region.defaultRainfallMm}mm) subject to inter-annual spring drought.`;
      irrigationExpAr = `النمط المطري في منطقة شبه جافة (${region.defaultRainfallMm} مم) عرضة للجفاف الربيعي.`;
      irrigationExpFr = `Pluvial semi-aride (${region.defaultRainfallMm}mm) soumis aux aléas des sécheresses printanières.`;
    } else {
      irrigationMult = 0.88;
      irrigationExpEn = `Sub-humid coastal rainfed (${region.defaultRainfallMm}mm) provides good base yield support.`;
      irrigationExpAr = `النمط المطري الساحلي (${region.defaultRainfallMm} مم) يوفر دعماً مائياً جيداً.`;
      irrigationExpFr = `Pluvial subhumide (${region.defaultRainfallMm}mm) assurant une bonne base de rendement.`;
    }
  }

  // 2. SOIL SALINITY & ORGANIC MATTER FACTOR (Maas-Hoffman threshold approach)
  let soilMult = 1.0;
  let soilExpEn = 'Favorable soil salinity and texture balance.';
  let soilExpAr = 'ملوحة وتربة مواتية ومتوازنة.';
  let soilExpFr = 'Salinité et texture du sol favorables.';

  const ec = input.soilSalinityDsm;
  // Maas-Hoffman thresholds: Cereals tolerate ~6-7 dS/m; potato/tomato tolerate ~1.7 - 2.5 dS/m
  let salinityThreshold = 2.0;
  let slopePerDsm = 0.08;
  if (input.cropId === 'barley') {
    salinityThreshold = 6.0;
    slopePerDsm = 0.04;
  } else if (input.cropId === 'wheat') {
    salinityThreshold = 5.0;
    slopePerDsm = 0.05;
  } else if (input.cropId === 'potato' || input.cropId === 'onion') {
    salinityThreshold = 1.7;
    slopePerDsm = 0.11;
  }

  if (ec > salinityThreshold) {
    const penalty = Math.min(0.55, (ec - salinityThreshold) * slopePerDsm);
    soilMult -= penalty;
    soilExpEn = `Salinity stress (EC ${ec.toFixed(1)} dS/m > ${salinityThreshold} dS/m threshold) suppresses root osmotic uptake by -${Math.round(penalty * 100)}%.`;
    soilExpAr = `إجهاد الملوحة (${ec.toFixed(1)} ديسيمنس/م > العتبة ${salinityThreshold}) يقلل الامتصاص الجذري الأسموزي بنسبة -${Math.round(penalty * 100)}%.`;
    soilExpFr = `Stress de salinité (CE ${ec.toFixed(1)} dS/m > seuil ${salinityThreshold}) réduit l’absorption osmotique racinaire de -${Math.round(penalty * 100)}%.`;
  }

  if (input.soilOrganicMatterPct < 1.0) {
    soilMult -= 0.06;
    soilExpEn += ' Very low organic matter (<1.0%) reduces Cation Exchange Capacity (CEC).';
    soilExpAr += ' تدني المادة العضوية (<1%) يقلل السعة التبادلية الكاتيونية والاحتفاظ بالعناصر.';
    soilExpFr += ' Faible taux de matière organique (<1.0%) diminuant la CEC.';
  } else if (input.soilOrganicMatterPct >= 2.5) {
    soilMult += 0.08;
    soilExpEn += ' High organic matter (>2.5%) boosts microbial biology and soil water retention.';
    soilExpAr += ' مادة عضوية غنية (>2.5%) تعزز النشاط الميكروبي والاحتفاظ بالرطوبة.';
    soilExpFr += ' Taux de matière organique élevé (>2.5%) améliorant rétention et fertilité.';
  }

  // 3. FERTILIZATION & NUTRIENT BALANCE
  let fertMult = 1.0;
  let fertExpEn = 'Standard balanced mineral fertilization.';
  let fertExpAr = 'تسميد معدني متوازن قياسي.';
  let fertExpFr = 'Fertilisation minérale équilibrée standard.';

  if (input.fertilizerIntensity === 'sub_optimal') {
    fertMult = 0.76;
    fertExpEn = 'Nutrient deficiency (nitrogen/phosphorus shortage) halts canopy leaf area expansion.';
    fertExpAr = 'نقص التسميد (عجز الآزوت/الفوسفور) يحد من اتساع المسطح الورقي وامتلاء المحصول.';
    fertExpFr = 'Sous-fertilisation (carence N/P) limitant le développement foliaire et le remplissage.';
  } else if (input.fertilizerIntensity === 'moderate') {
    fertMult = 0.95;
    fertExpEn = 'Basic broadcasting covers minimum maintenance needs.';
    fertExpAr = 'التسميد النثري الأساسي يغطي الحد الأدنى فقط.';
    fertExpFr = 'Fertilisation basique couvrant les besoins minimaux d’entretien.';
  } else if (input.fertilizerIntensity === 'optimal') {
    fertMult = 1.10;
    fertExpEn = 'Full targeted N-P-K + secondary Ca/Mg/S split applications matching crop demand.';
    fertExpAr = 'تسميد متكامل N-P-K مع العناصر الثانوية مجزأ حسب مراحل النمو الفينولوجي.';
    fertExpFr = 'Nutrition ciblée N-P-K + oligo-éléments fractionnée selon les stades phénologiques.';
  } else if (input.fertilizerIntensity === 'intensive_fertigation') {
    fertMult = 1.22;
    fertExpEn = 'Continuous automated fertigation with weekly micro-dosing and electrical conductivity (EC) control.';
    fertExpAr = 'تسميد مع الري مؤتمت ومستمر بجرعات دقيقة ومراقبة الناقلية الكهربائية.';
    fertExpFr = 'Fertigation continue automatisée à micro-doses avec régulation de la conductivité (CE).';
  }

  // 4. PLANTING DATE & CLIMATIC TIMING (Frost / Heat Window)
  let timingMult = 1.0;
  let timingExpEn = 'Optimal planting window alignment with regional photoperiod & thermal unit accumulation.';
  let timingExpAr = 'تاريخ الزراعة متطابق تماماً مع نافذة التراكم الحراري والضوئي الإقليمية.';
  let timingExpFr = 'Alignement optimal de la date de semis avec les degrés-jours régionaux.';

  if (input.plantingDate) {
    try {
      const pDate = new Date(input.plantingDate);
      const month = pDate.getMonth() + 1; // 1-12
      const rec = baseline.recommendedPlantingWindow;

      let isInside = false;
      if (rec.startMonth <= rec.endMonth) {
        isInside = month >= rec.startMonth && month <= rec.endMonth;
      } else {
        // Spans new year (e.g. Oct 10 to Jan 15)
        isInside = month >= rec.startMonth || month <= rec.endMonth;
      }

      if (!isInside) {
        timingMult = 0.84;
        timingExpEn = `Off-calendar planting (Month ${month}) exposes crop to extreme heat during grain fill / tuberization or spring frost risk.`;
        timingExpAr = `الزراعة خارج التقويم المثالي (شهر ${month}) تعرض المحصول لضربات الحرارة أو الصقيع الربيعي أثناء الامتلاء.`;
        timingExpFr = `Semis hors créneau recommandé (Mois ${month}) exposant la culture aux gelées tardives ou échaudage estival.`;
      }
    } catch {
      // ignore date parse error
    }
  }

  // 5. SEED GENETICS & VARIETY QUALITY
  let seedMult = 1.0;
  let seedExpEn = 'Standard commercial seed stock.';
  let seedExpAr = 'بذور تجارية قياسية معتمدة.';
  let seedExpFr = 'Semences commerciales standard.';

  if (input.seedQualityTier === 'farm_saved_untested') {
    seedMult = 0.86;
    seedExpEn = 'Farm-saved uncertified seed: lower germination rate (~75%), seed-borne pathogen risk & genetic drift.';
    seedExpAr = 'بذور المزرعة غير المعتمدة: نسبة إنبات منخفضة (~75%)، خطر أمراض بذرية وتدهور وراثي.';
    seedExpFr = 'Semences de ferme non certifiées : faculté germinative réduite (~75%) et risques sanitaires.';
  } else if (input.seedQualityTier === 'certified_oaic_g1_g2') {
    seedMult = 1.12;
    seedExpEn = 'Certified elite genetics (OAIC R1/R2 or certified G1-G2 tubers): >95% vigor, high disease resistance & uniform emergence.';
    seedExpAr = 'بذور معتمدة ممتازة (OAIC R1/R2 أو درنات G1-G2): حيوية إنبات >95% ومقاومة عالية للأمراض وتجانس حاد.';
    seedExpFr = 'Semences certifiées d’élite (OAIC R1/R2 ou tubercules G1-G2) : vigueur >95%, pureté et levée homogène.';
  }

  // 6. CROP PROTECTION & IPM
  let protMult = 1.0;
  let protExpEn = 'Preventive standard phytosanitary protection.';
  let protExpAr = 'حماية وقائية قياسية منتظمة.';
  let protExpFr = 'Protection phytosanitaire préventive standard.';

  if (input.cropProtectionLevel === 'none') {
    protMult = 0.70;
    protExpEn = 'Zero crop protection: uncontrolled fungal blights, weeds, and insect attacks induce heavy yield loss.';
    protExpAr = 'غياب حماية المحصول: الأمراض الفطرية والأعشاب الضارة والحشرات تسبب خسائر فادحة.';
    protExpFr = 'Aucune protection : ravageurs, maladies fongiques et adventices causent d’importantes pertes.';
  } else if (input.cropProtectionLevel === 'curative_minimal') {
    protMult = 0.90;
    protExpEn = 'Late curative spraying after visual damage occurs leaves structural tissue lesions.';
    protExpAr = 'المعالجة العلاجية المتأخرة بعد ظهور الأعراض تترك أضراراً هيكلية على الأنسجة.';
    protExpFr = 'Traitements curatifs tardifs après apparition des symptômes limitant l’efficacité.';
  } else if (input.cropProtectionLevel === 'integrated_ipm') {
    protMult = 1.08;
    protExpEn = 'Integrated Pest Management (IPM) with biological scouting, threshold monitoring, and INPV homologated rotation.';
    protExpAr = 'مكافحة متكاملة (IPM) مع رصد عتبات الضرر وتناوب مبيدات معتمدة من INPV ومكافحة حيوية.';
    protExpFr = 'Protection intégrée (IPM) avec piégeage, seuils d’intervention et rotation de molécules INPV.';
  }

  // Calculate composite multiplier
  const compositeMultiplier = Math.max(0.2, irrigationMult * soilMult * fertMult * timingMult * seedMult * protMult);
  
  // Calculate predicted yield
  const unconstrainedPredicted = baseline.historicalMeanYieldTonsHa * compositeMultiplier;
  // Bound prediction between reasonable physical limits (minimum 25% of low, max 105% of potential ceiling)
  const predictedYieldTonsHa = Math.min(
    baseline.potentialBioclimaticCeilingTonsHa * 1.05,
    Math.max(baseline.historicalLowYieldTonsHa * 0.35, unconstrainedPredicted)
  );

  const deltaTotal = predictedYieldTonsHa - baseline.historicalMeanYieldTonsHa;

  // Compile individual factor objects
  const factorDefinitions: Array<{
    id: string;
    label: { en: string; ar: string; fr: string };
    mult: number;
    exp: { en: string; ar: string; fr: string };
  }> = [
    {
      id: 'irrigation_wue',
      label: { en: 'Irrigation & Water Regime', ar: 'نظام الري والمياه', fr: 'Système d’irrigation & Eau' },
      mult: irrigationMult,
      exp: { en: irrigationExpEn, ar: irrigationExpAr, fr: irrigationExpFr },
    },
    {
      id: 'soil_salinity_om',
      label: { en: 'Soil Chemistry & Salinity', ar: 'كيمياء التربة والملوحة', fr: 'Chimie du sol & Salinité' },
      mult: soilMult,
      exp: { en: soilExpEn, ar: soilExpAr, fr: soilExpFr },
    },
    {
      id: 'fertilization_intensity',
      label: { en: 'Nutrient & Fertilization Efficiency', ar: 'كفاءة التغذية والتسميد', fr: 'Nutrition & Efficience des engrais' },
      mult: fertMult,
      exp: { en: fertExpEn, ar: fertExpAr, fr: fertExpFr },
    },
    {
      id: 'climate_timing',
      label: { en: 'Planting Calendar & Climate Window', ar: 'توقيت الزراعة والنافذة المناخية', fr: 'Calendrier de semis & Climat' },
      mult: timingMult,
      exp: { en: timingExpEn, ar: timingExpAr, fr: timingExpFr },
    },
    {
      id: 'seed_genetics',
      label: { en: 'Seed Quality & Genetics', ar: 'جودة البذور والأصناف', fr: 'Qualité des semences & Génétique' },
      mult: seedMult,
      exp: { en: seedExpEn, ar: seedExpAr, fr: seedExpFr },
    },
    {
      id: 'crop_protection',
      label: { en: 'Crop Health & Phytosanitary Protection', ar: 'صحة المحصول والحماية النباتية', fr: 'Santé de la culture & Protection' },
      mult: protMult,
      exp: { en: protExpEn, ar: protExpAr, fr: protExpFr },
    },
  ];

  factorDefinitions.forEach((f) => {
    const deltaTonsHa = (f.mult - 1.0) * baseline.historicalMeanYieldTonsHa;
    let status: YieldFactorImpact['status'] = 'neutral';
    if (f.mult >= 1.05) status = 'positive';
    else if (f.mult <= 0.75) status = 'severe_penalty';
    else if (f.mult < 0.98) status = 'penalty';

    factors.push({
      id: f.id,
      label: f.label,
      multiplier: f.mult,
      deltaTonsHa: Math.round(deltaTonsHa * 100) / 100,
      status,
      explanation: f.exp,
    });
  });

  const boostingFactors = factors.filter((f) => f.multiplier > 1.02);
  const limitingFactors = factors.filter((f) => f.multiplier < 0.98);

  // Confidence 80% range (+/- 1.28 * stdDev scaled)
  const confidenceMargin = baseline.stdDevYieldTonsHa * (compositeMultiplier > 1 ? 0.9 : 1.2);
  const min80Pct = Math.max(0.2, Math.round((predictedYieldTonsHa - confidenceMargin) * 10) / 10);
  const max80Pct = Math.round((predictedYieldTonsHa + confidenceMargin) * 10) / 10;

  // Calculate Success Probability Score (0 - 100%)
  // Ratio of predicted yield compared to historical mean and ceiling
  let successScore = Math.round(
    ((predictedYieldTonsHa - baseline.historicalLowYieldTonsHa) /
      Math.max(1, baseline.historicalHighYieldTonsHa - baseline.historicalLowYieldTonsHa)) * 80 + 10
  );
  successScore = Math.max(5, Math.min(99, successScore));

  let successRating: PredictiveYieldResult['successRating'] = 'moderate';
  if (successScore >= 88) successRating = 'exceptional';
  else if (successScore >= 72) successRating = 'high';
  else if (successScore >= 50) successRating = 'moderate';
  else if (successScore >= 30) successRating = 'high_risk';
  else successRating = 'critical_failure_risk';

  // Actionable Agronomic Recommendations based on bottlenecks
  const recommendations: PredictiveYieldResult['actionableRecommendations'] = [];

  if (irrigationMult < 1.0) {
    recommendations.push({
      category: 'irrigation',
      priority: 'high',
      action: {
        en: 'Switch from furrow/rainfed to drip fertigation to save 35-45% water and eliminate root hypoxia.',
        ar: 'التحول من الري السطحي/المطري إلى الري بالتنقيط لتوفير 35-45% من المياه وتفادي اختناق الجذور.',
        fr: 'Passer du gravitaire au goutte-à-goutte pour économiser 35-45% d’eau et éliminer l’hypoxie racinaire.',
      },
      gainPotentialTonsHa: Math.round(baseline.historicalMeanYieldTonsHa * 0.25 * 10) / 10,
    });
  }

  if (ec > salinityThreshold) {
    recommendations.push({
      category: 'soil',
      priority: 'high',
      action: {
        en: `Apply gypsum / humic-fulvic acids and install periodic leaching fractions (LF +15%) to mitigate EC ${ec.toFixed(1)} dS/m salinity.`,
        ar: `إضافة الجبس الزراعي والأحماض الهيومية/الفولفية وتطبيق غسيل دوري للأملاح (+15% ماء) لمواجهة الملوحة.`,
        fr: `Apport de gypse/acides humiques et fraction de lessivage (+15%) pour atténuer la salinité CE ${ec.toFixed(1)} dS/m.`,
      },
      gainPotentialTonsHa: Math.round(baseline.historicalMeanYieldTonsHa * 0.18 * 10) / 10,
    });
  }

  if (fertMult < 1.05) {
    recommendations.push({
      category: 'nutrition',
      priority: 'medium',
      action: {
        en: `Split nitrogen into 4 critical phenological fractions (tillering/stem elongation or tuber initiation/bulking) to improve recovery efficiency.`,
        ar: `تجزئة التسميد الآزوتي على 4 دفعات فينولوجية حرجة (التفريع، الاستطالة، أو تكوين الدرنات) لرفع كفاءة الامتصاص.`,
        fr: `Fractionner l’azote en 4 apports aux stades critiques (tallage/montaison ou initiation/grossissement) pour maximiser le coefficient réel d’utilisation.`,
      },
      gainPotentialTonsHa: Math.round(baseline.historicalMeanYieldTonsHa * 0.20 * 10) / 10,
    });
  }

  if (seedMult < 1.0) {
    recommendations.push({
      category: 'seed',
      priority: 'high',
      action: {
        en: 'Adopt certified OAIC R1/R2 seed or certified G1-G2 virus-free tuber generations for vigorous seedling emergence.',
        ar: 'اعتماد بذور معتمدة من OAIC (R1/R2) أو شتلات وبطاطا بذور معتمدة خالية من الفيروسات لضمان تجانس وقوة الإنبات.',
        fr: 'Utiliser des semences certifiées OAIC R1/R2 ou des plants certifiés indemnes de virus pour une levée vigoureuse.',
      },
      gainPotentialTonsHa: Math.round(baseline.historicalMeanYieldTonsHa * 0.15 * 10) / 10,
    });
  }

  if (protMult < 1.0) {
    recommendations.push({
      category: 'protection',
      priority: 'medium',
      action: {
        en: 'Deploy INPV-homologated preventive fungal programs ahead of high humidity windows to prevent leaf area index loss.',
        ar: 'تطبيق برامج وقائية بمبيدات معتمدة من INPV قبيل فترات الرطوبة المرتفعة لحماية المسطح الورقي.',
        fr: 'Mettre en place des traitements préventifs homologués INPV avant les périodes d’humidité pour préserver la surface foliaire.',
      },
      gainPotentialTonsHa: Math.round(baseline.historicalMeanYieldTonsHa * 0.12 * 10) / 10,
    });
  }

  return {
    region,
    cropId: input.cropId,
    predictedYieldTonsHa: Math.round(predictedYieldTonsHa * 100) / 100,
    yieldConfidenceRange: { min80Pct, max80Pct },
    historicalMeanYieldTonsHa: baseline.historicalMeanYieldTonsHa,
    historicalLowYieldTonsHa: baseline.historicalLowYieldTonsHa,
    historicalHighYieldTonsHa: baseline.historicalHighYieldTonsHa,
    potentialCeilingTonsHa: baseline.potentialBioclimaticCeilingTonsHa,
    successProbabilityPct: successScore,
    successRating,
    limitingFactors,
    boostingFactors,
    allFactors: factors,
    waterStressPenaltyPct: Math.round(Math.max(0, 1 - irrigationMult) * 100),
    soilLimitationPenaltyPct: Math.round(Math.max(0, 1 - soilMult) * 100),
    climateTimingPenaltyPct: Math.round(Math.max(0, 1 - timingMult) * 100),
    nutritionEfficiencyPct: Math.round(fertMult * 100),
    protectionEfficiencyPct: Math.round(protMult * 100),
    actionableRecommendations: recommendations,
  };
}
