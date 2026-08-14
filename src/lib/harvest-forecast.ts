import { getCropLifecycle, type CropLifecycle, type LaborOperation } from './crop-lifecycle';

export interface HarvestForecastInput {
  cropId: string;
  plantingDate: string;
  areaHa: number;
  expectedYieldTPerHa: number;
  expectedMoisturePct: number;
  storageCapacityT: number;
  currentInventoryT: number;
}

export interface HarvestLot {
  id: string;
  operation: LaborOperation;
  startDate: string;
  endDate: string;
  expectedVolumeT: number;
  expectedDryVolumeT: number;
  laborDays: number;
  storageAfterT: number;
}

export interface HarvestForecastResult {
  crop: CropLifecycle;
  harvestStartDate: string;
  harvestEndDate: string;
  seasonEndDate: string;
  daysUntilHarvest: number;
  totalExpectedVolumeT: number;
  totalExpectedDryVolumeT: number;
  totalHarvestLaborDays: number;
  storageAvailableT: number;
  storageRemainingT: number;
  storageStatus: 'fits' | 'tight' | 'overCapacity';
  lots: HarvestLot[];
  warnings: string[];
}

const DAY_MS = 86_400_000;

function parseDate(value: string): Date | null {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function dateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dateDiffInDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

function harvestOperations(crop: CropLifecycle): LaborOperation[] {
  return crop.labor.filter(operation => operation.type === 'harvest');
}

export function calculateHarvestForecast(input: HarvestForecastInput, today = new Date('2026-01-01T00:00:00')): HarvestForecastResult | null {
  const crop = getCropLifecycle(input.cropId);
  const plantingDate = parseDate(input.plantingDate);
  if (!crop || !plantingDate || input.areaHa <= 0 || input.expectedYieldTPerHa < 0) return null;

  const area = input.areaHa;
  const volumePerLot = area * input.expectedYieldTPerHa;
  const operations = harvestOperations(crop);
  const fallback = { day: crop.seasonLength, durationDays: 1, stage: 'Harvest', type: 'harvest' as const, task: 'Harvest crop', laborDaysPerHa: 0, skill: 'trained' as const, priority: 'critical' as const };
  const lots = (operations.length > 0 ? operations : [fallback]).map((operation, index) => {
    const startDate = addDays(plantingDate, Math.max(0, operation.day - 1));
    const endDate = addDays(startDate, Math.max(0, operation.durationDays - 1));
    const share = operations.length > 1 ? 1 / operations.length : 1;
    const expectedVolumeT = volumePerLot * share;
    const expectedDryVolumeT = expectedVolumeT * Math.max(0, (100 - input.expectedMoisturePct) / 87);
    const storageAfterT = input.currentInventoryT + expectedVolumeT;
    return {
      id: `${input.cropId}-${operation.day}-${index}`,
      operation,
      startDate: dateString(startDate),
      endDate: dateString(endDate),
      expectedVolumeT,
      expectedDryVolumeT,
      laborDays: operation.laborDaysPerHa * area,
      storageAfterT,
    };
  });

  let runningStorage = input.currentInventoryT;
  for (const lot of lots) {
    runningStorage += lot.expectedVolumeT;
    lot.storageAfterT = runningStorage;
  }

  const firstHarvest = lots[0];
  const lastHarvest = lots[lots.length - 1];
  const storageAvailableT = Math.max(0, input.storageCapacityT - input.currentInventoryT);
  const storageRemainingT = storageAvailableT - volumePerLot;
  const storageStatus: HarvestForecastResult['storageStatus'] = storageRemainingT < 0 ? 'overCapacity' : storageRemainingT < Math.max(1, volumePerLot * 0.1) ? 'tight' : 'fits';
  const warnings: string[] = [];
  if (input.expectedMoisturePct > 18) warnings.push('Harvest moisture is high; plan drying before storage.');
  if (input.expectedMoisturePct > 14) warnings.push('Expected moisture exceeds typical long-term grain storage targets; confirm crop-specific limits.');
  if (storageStatus === 'overCapacity') warnings.push('Expected production exceeds available storage after current inventory.');
  if (operations.some(operation => operation.durationDays > 1)) warnings.push('Harvest is a multi-day or multi-pass operation; reserve labor and transport across the full window.');

  return {
    crop,
    harvestStartDate: firstHarvest.startDate,
    harvestEndDate: lastHarvest.endDate,
    seasonEndDate: dateString(addDays(plantingDate, crop.seasonLength - 1)),
    daysUntilHarvest: Math.max(0, dateDiffInDays(today, parseDate(firstHarvest.startDate) ?? today)),
    totalExpectedVolumeT: volumePerLot,
    totalExpectedDryVolumeT: lots.reduce((sum, lot) => sum + lot.expectedDryVolumeT, 0),
    totalHarvestLaborDays: lots.reduce((sum, lot) => sum + lot.laborDays, 0),
    storageAvailableT,
    storageRemainingT,
    storageStatus,
    lots,
    warnings,
  };
}

