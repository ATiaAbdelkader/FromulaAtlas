/**
 * Brief builder service — assembles a BriefContext for a given farmer,
 * suitable for passing to buildBriefMessage().
 *
 * Reads from Postgres (FarmProfile, FarmPilotPlan snapshot) + Open-Meteo
 * (cached). Returns null if the farmer is missing required data (no
 * profile, no crop, etc.) — the caller should log a SKIPPED BriefLog.
 *
 * This module is PURE LOGIC — no WhatsApp sends, no DB writes. Easy to test.
 */

import { db } from '@/lib/db';
import { getCachedForecast, getTodayFromForecast } from '@/lib/brief/weather-cache';
import { computeRainfallAnomaly, anomalyBriefText, type RainfallAnomaly } from '@/lib/rainfall-anomaly';
import {
  getCropById,
  getActiveStage,
  calculateIrrigation,
  generateTodayTasks,
} from '@/lib/farmpilot-engine';
import {
  CROP_STAGE_LABELS,
  type FarmPilotPlan,
  type FarmPilotCrop,
} from '@/lib/farmpilot-data';
import { toFarmPilotId } from '@/lib/crop-id-unified';
import type { ForecastResult, DailyForecast } from '@/lib/open-meteo';
import type { Language } from '@/lib/language-store';
import type {
  WeatherAlert,
  BriefContext,
} from '@/components/agri/whatsapp-daily-brief';
import { detectAlerts } from '@/components/agri/whatsapp-daily-brief';
import type { IrrigationResult, StageProgress, TodayTask } from '@/lib/farmpilot-engine';
import type { FarmProfile as FarmProfileShape } from '@/components/agri/farm-profile-wizard';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface BuildBriefResult {
  /** The assembled BriefContext, or null if missing required data. */
  context: BriefContext | null;
  /** Skip reason if context is null. */
  skipReason?: 'no_farm_profile' | 'no_crop' | 'unsupported_crop' | 'no_planting_date';
  /** Where the weather came from. */
  weatherSource: 'open-meteo' | 'atlas_default';
  /** Rainfall anomaly for this season (null if unavailable). */
  anomaly: RainfallAnomaly | null;
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

/**
 * Build a BriefContext for the given farmer.
 *
 * Steps:
 *   1. Load FarmProfile + planJson from Postgres
 *   2. Resolve crop (canonical → FarmPilot ID → FarmPilotCrop)
 *   3. Compute active stage from planting date
 *   4. Fetch weather (cached per 0.1° grid)
 *   5. Compute irrigation recommendation
 *   6. Generate today's tasks
 *   7. Detect weather alerts
 *
 * Returns null context + skipReason if any required piece is missing.
 */
export async function buildBriefForFarmer(farmerId: string): Promise<BuildBriefResult> {
  // 1. Load farm profile from Postgres
  const farmProfileRow = await db.farmProfile.findUnique({
    where: { farmerId },
  });
  if (!farmProfileRow || !farmProfileRow.crop || !farmProfileRow.lat || !farmProfileRow.lng) {
    return { context: null, skipReason: 'no_farm_profile', weatherSource: 'atlas_default', anomaly: null };
  }

  // 2. Resolve crop
  if (!farmProfileRow.plantingDate) {
    return { context: null, skipReason: 'no_planting_date', weatherSource: 'atlas_default', anomaly: null };
  }
  const farmPilotCropId = toFarmPilotId(farmProfileRow.crop);
  const crop = farmPilotCropId ? getCropById(farmPilotCropId) : undefined;
  if (!crop) {
    return { context: null, skipReason: 'unsupported_crop', weatherSource: 'atlas_default', anomaly: null };
  }

  // 3. Build FarmProfile shape (matches the localStorage format the
  // whatsapp-daily-brief.tsx helpers expect)
  const profile: FarmProfileShape = {
    name: farmProfileRow.name ?? undefined,
    lat: String(farmProfileRow.lat),
    lng: String(farmProfileRow.lng),
    crop: farmProfileRow.crop,
    plantingDate: farmProfileRow.plantingDate,
    area: farmProfileRow.areaHa ?? undefined,
    setupCompleted: true,
  };

  // 4. Build FarmPilotPlan (parse from planJson or fall back to defaults)
  let plan: FarmPilotPlan;
  try {
    if (farmProfileRow.planJson) {
      plan = JSON.parse(farmProfileRow.planJson) as FarmPilotPlan;
    } else {
      throw new Error('no plan');
    }
  } catch {
    // Default plan
    plan = {
      cropId: crop.id,
      plantingDate: farmProfileRow.plantingDate,
      areaHa: farmProfileRow.areaHa ?? 0.5,
      productionSystem: 'open_field',
      irrigationSystem: 'drip',
      irrigationFlowLph: 2000,
      fertilizerProduct: '15-15-15',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  // 5. Compute active stage
  const activeStage: StageProgress | undefined = getActiveStage(crop, farmProfileRow.plantingDate);

  // 6. Fetch weather
  const forecast: ForecastResult | null = await getCachedForecast(farmProfileRow.lat, farmProfileRow.lng);
  const today: DailyForecast | undefined = getTodayFromForecast(forecast);
  const weatherSource: 'open-meteo' | 'atlas_default' = forecast ? 'open-meteo' : 'atlas_default';

  // 7. Compute irrigation
  const etoMmPerDay = today?.et0 ?? 5.0;  // Atlas default
  const rainfallMm = today?.precipitationSum ?? 0;
  let irrigation: IrrigationResult | null = null;
  if (activeStage) {
    try {
      irrigation = calculateIrrigation(crop, activeStage.stage, plan, etoMmPerDay, rainfallMm);
    } catch (e) {
      console.warn(`[brief-builder] irrigation calc failed for farmer ${farmerId}:`, e);
    }
  }

  // 8. Generate tasks
  let tasks: TodayTask[] = [];
  try {
    tasks = generateTodayTasks(crop, plan, activeStage, etoMmPerDay);
  } catch (e) {
    console.warn(`[brief-builder] task gen failed for farmer ${farmerId}:`, e);
  }

  // 9. Detect alerts
  const alerts: WeatherAlert[] = detectAlerts(forecast?.daily);

  const context: BriefContext = {
    profile,
    crop: crop as FarmPilotCrop,
    plan,
    activeStage,
    forecast,
    today,
    irrigation,
    tasks,
    alerts,
  };

  // 10. Compute rainfall anomaly (current season vs 1991-2020 normal)
  const anomaly = await computeRainfallAnomaly(farmProfileRow.lat, farmProfileRow.lng);

  return { context, weatherSource, anomaly };
}
