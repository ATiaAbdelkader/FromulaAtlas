import type { NdviResult } from '@/lib/satellite-service';

export const SATELLITE_HEALTH_STORAGE_KEY = 'formula-atlas-satellite-health-v1';
export const SATELLITE_HEALTH_CHANGED_EVENT = 'formula-atlas-satellite-health-changed';

export type SatelliteHealthLevel = 'excellent' | 'watch' | 'stressed' | 'critical';
export type SatelliteHealthSource = 'simulated' | 'sentinel-2';

export interface SatelliteHealthRecord {
  fieldId: string;
  fieldName: string;
  crop: string;
  source: SatelliteHealthSource;
  date: string;
  averageNdvi: number;
  minNdvi: number;
  maxNdvi: number;
  stressedAreaPct: number;
  stressedAreaHa: number;
  cloudCover: number;
  zoneCount: number;
  level: SatelliteHealthLevel;
  recommendations: string[];
  updatedAt: number;
}

function safeNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function classifySatelliteHealth(averageNdvi: number, stressedAreaPct: number): SatelliteHealthLevel {
  if (averageNdvi < 0.3 || stressedAreaPct >= 35) return 'critical';
  if (averageNdvi < 0.45 || stressedAreaPct >= 20) return 'stressed';
  if (averageNdvi < 0.6 || stressedAreaPct >= 10) return 'watch';
  return 'excellent';
}

export function createSatelliteHealthRecord(
  fieldId: string,
  fieldName: string,
  crop: string,
  areaHa: number,
  result: NdviResult,
  source: SatelliteHealthSource = 'simulated',
  updatedAt = Date.now(),
): SatelliteHealthRecord {
  const stressedAreaPct = clamp(safeNumber(result.stressedAreaPct), 0, 100);
  return {
    fieldId,
    fieldName,
    crop,
    source,
    date: result.date,
    averageNdvi: clamp(safeNumber(result.averageNdvi), 0, 1),
    minNdvi: clamp(safeNumber(result.minNdvi), 0, 1),
    maxNdvi: clamp(safeNumber(result.maxNdvi), 0, 1),
    stressedAreaPct,
    stressedAreaHa: Math.round(Math.max(0, areaHa) * stressedAreaPct / 100 * 100) / 100,
    cloudCover: clamp(safeNumber(result.cloudCover), 0, 100),
    zoneCount: result.zones.length,
    level: classifySatelliteHealth(safeNumber(result.averageNdvi), stressedAreaPct),
    recommendations: result.recommendations.slice(0, 6),
    updatedAt,
  };
}

function normalizeRecord(value: unknown): SatelliteHealthRecord | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<SatelliteHealthRecord>;
  const fieldId = String(raw.fieldId ?? '').trim();
  const fieldName = String(raw.fieldName ?? '').trim();
  if (!fieldId || !fieldName) return null;
  const stressedAreaPct = clamp(safeNumber(raw.stressedAreaPct), 0, 100);
  const averageNdvi = clamp(safeNumber(raw.averageNdvi), 0, 1);
  const level = raw.level === 'critical' || raw.level === 'stressed' || raw.level === 'watch' ? raw.level : classifySatelliteHealth(averageNdvi, stressedAreaPct);
  return {
    fieldId,
    fieldName,
    crop: String(raw.crop ?? 'unknown'),
    source: raw.source === 'sentinel-2' ? 'sentinel-2' : 'simulated',
    date: String(raw.date ?? new Date().toISOString().slice(0, 10)),
    averageNdvi,
    minNdvi: clamp(safeNumber(raw.minNdvi), 0, 1),
    maxNdvi: clamp(safeNumber(raw.maxNdvi), 0, 1),
    stressedAreaPct,
    stressedAreaHa: Math.max(0, safeNumber(raw.stressedAreaHa)),
    cloudCover: clamp(safeNumber(raw.cloudCover), 0, 100),
    zoneCount: Math.max(0, Math.round(safeNumber(raw.zoneCount))),
    level,
    recommendations: Array.isArray(raw.recommendations) ? raw.recommendations.map(String).slice(0, 6) : [],
    updatedAt: Math.max(0, safeNumber(raw.updatedAt, Date.now())),
  };
}

export function readSatelliteHealthRecords(): SatelliteHealthRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SATELLITE_HEALTH_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeRecord).filter((record): record is SatelliteHealthRecord => Boolean(record));
  } catch {
    return [];
  }
}

export function getSatelliteHealthForField(fieldId: string, records = readSatelliteHealthRecords()): SatelliteHealthRecord | null {
  return records.filter((record) => record.fieldId === fieldId).sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
}

export function saveSatelliteHealthRecord(record: SatelliteHealthRecord): SatelliteHealthRecord {
  if (typeof window === 'undefined') return record;
  const records = readSatelliteHealthRecords().filter((entry) => entry.fieldId !== record.fieldId);
  try {
    window.localStorage.setItem(SATELLITE_HEALTH_STORAGE_KEY, JSON.stringify([...records, record]));
    window.dispatchEvent(new Event(SATELLITE_HEALTH_CHANGED_EVENT));
  } catch {
    // Keep the in-memory result usable when browser storage is unavailable.
  }
  return record;
}

export function satelliteHealthNeedsAction(record: SatelliteHealthRecord | null): boolean {
  return Boolean(record && (record.level === 'stressed' || record.level === 'critical'));
}
