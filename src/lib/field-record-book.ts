import { readSavedFields, type SavedFieldRecord } from '@/lib/farm-digital-twin';
import { loadScoutEntries, type ScoutEntry, type ScoutSeverity } from '@/lib/scouting-store';
import { getSoilTests, type SoilTestEntry } from '@/lib/soil-history-store';
import { readSatelliteHealthRecords, type SatelliteHealthLevel, type SatelliteHealthRecord } from '@/lib/satellite-health';

export const FIELD_RECORD_BOOK_STORAGE_KEY = 'formula-atlas-field-record-book-v1';
export const FIELD_RECORD_BOOK_CHANGED_EVENT = 'formula-atlas-field-record-book-changed';

export type FieldRecordSource = 'manual' | 'demo' | 'field-profile' | 'scouting' | 'soil-test' | 'satellite';
export type FieldRecordKind = 'observation' | 'decision' | 'input' | 'irrigation' | 'harvest' | 'note';

export interface FieldRecord {
  id: string;
  fieldId?: string;
  fieldName: string;
  crop?: string;
  timestamp: number;
  source: FieldRecordSource;
  kind: FieldRecordKind;
  title: string;
  summary: string;
  severity?: ScoutSeverity;
  amountDzd?: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface ManualFieldRecordInput {
  fieldId?: string;
  fieldName: string;
  crop?: string;
  date: string;
  kind: FieldRecordKind;
  title: string;
  summary: string;
  amountDzd?: number;
}

export interface FieldRecordBookOptions {
  fields?: SavedFieldRecord[];
  scoutEntries?: ScoutEntry[];
  soilTests?: SoilTestEntry[];
  satelliteRecords?: SatelliteHealthRecord[];
  manualRecords?: FieldRecord[];
  now?: number;
}

export interface FieldRecordBookStats {
  total: number;
  fields: number;
  observations: number;
  actions: number;
  critical: number;
  linkedSources: number;
  totalAmountDzd: number;
}

function safeNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeFieldName(value: string): string {
  return value.trim().toLocaleLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function dateTimestamp(value: string, fallback = Date.now()): number {
  const raw = clean(value);
  if (!raw) return fallback;
  const parsed = new Date(`${raw.slice(0, 10)}T12:00:00`).getTime();
  return Number.isFinite(parsed) ? parsed : fallback;
}

function cropLabel(value: string): string | undefined {
  const crop = clean(value);
  return crop || undefined;
}

function normalizeRecord(value: unknown, index = 0): FieldRecord | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<FieldRecord>;
  const fieldName = clean(raw.fieldName);
  const title = clean(raw.title);
  const summary = clean(raw.summary);
  if (!fieldName || !title || !summary) return null;
  const source: FieldRecordSource = raw.source === 'demo' || raw.source === 'field-profile' || raw.source === 'scouting' || raw.source === 'soil-test' || raw.source === 'satellite'
    ? raw.source
    : 'manual';
  const kind: FieldRecordKind = raw.kind === 'decision' || raw.kind === 'input' || raw.kind === 'irrigation' || raw.kind === 'harvest' || raw.kind === 'note'
    ? raw.kind
    : 'observation';
  const severity: ScoutSeverity | undefined = raw.severity === 'warning' || raw.severity === 'critical' ? raw.severity : raw.severity === 'info' ? 'info' : undefined;
  const metadata = raw.metadata && typeof raw.metadata === 'object'
    ? Object.fromEntries(Object.entries(raw.metadata).filter(([, entry]) => ['string', 'number', 'boolean'].includes(typeof entry))) as Record<string, string | number | boolean>
    : undefined;
  return {
    id: clean(raw.id) || `field-record-${index + 1}`,
    fieldId: clean(raw.fieldId) || undefined,
    fieldName,
    crop: cropLabel(clean(raw.crop)),
    timestamp: Math.max(0, safeNumber(raw.timestamp, Date.now())),
    source,
    kind,
    title,
    summary,
    severity,
    amountDzd: raw.amountDzd == null ? undefined : Math.max(0, safeNumber(raw.amountDzd)),
    metadata,
  };
}

export function loadManualFieldRecords(): FieldRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FIELD_RECORD_BOOK_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((entry, index) => normalizeRecord(entry, index)).filter((entry): entry is FieldRecord => Boolean(entry))
      : [];
  } catch {
    return [];
  }
}

export function saveManualFieldRecords(records: FieldRecord[]): FieldRecord[] {
  const normalized = records.map((entry, index) => normalizeRecord(entry, index)).filter((entry): entry is FieldRecord => Boolean(entry));
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(FIELD_RECORD_BOOK_STORAGE_KEY, JSON.stringify(normalized));
      window.dispatchEvent(new Event(FIELD_RECORD_BOOK_CHANGED_EVENT));
    } catch {
      // Keep the in-memory experience usable when browser storage is unavailable.
    }
  }
  return normalized;
}

export function createManualFieldRecord(input: ManualFieldRecordInput, now = Date.now()): FieldRecord {
  const timestamp = dateTimestamp(input.date, now);
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? `manual-${crypto.randomUUID()}`
    : `manual-${timestamp}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    fieldId: clean(input.fieldId) || undefined,
    fieldName: clean(input.fieldName),
    crop: cropLabel(clean(input.crop)),
    timestamp,
    source: 'manual',
    kind: input.kind,
    title: clean(input.title),
    summary: clean(input.summary),
    amountDzd: input.amountDzd == null ? undefined : Math.max(0, safeNumber(input.amountDzd)),
  };
}

export function appendManualFieldRecord(input: ManualFieldRecordInput, now = Date.now()): FieldRecord[] {
  return saveManualFieldRecords([createManualFieldRecord(input, now), ...loadManualFieldRecords()]);
}

export function removeManualFieldRecord(id: string): FieldRecord[] {
  return saveManualFieldRecords(loadManualFieldRecords().filter((entry) => entry.id !== id));
}

function fieldProfileRecords(fields: SavedFieldRecord[]): FieldRecord[] {
  return fields.map((field) => ({
    id: `field-profile-${field.id}`,
    fieldId: field.id,
    fieldName: field.name,
    crop: field.crop,
    timestamp: dateTimestamp(field.plantingDate),
    source: 'field-profile' as const,
    kind: 'note' as const,
    title: 'Field profile',
    summary: `${field.areaHa} ha · ${field.crop} · planted ${field.plantingDate}`,
    metadata: { areaHa: field.areaHa, planted: field.plantingDate },
  }));
}

function scoutingRecords(entries: ScoutEntry[]): FieldRecord[] {
  return entries.map((entry) => ({
    id: `scouting-${entry.id}`,
    fieldName: entry.fieldName,
    crop: entry.crop,
    timestamp: entry.timestamp,
    source: 'scouting' as const,
    kind: 'observation' as const,
    title: entry.diagnosis?.problemName ? `Photo diagnosis: ${entry.diagnosis.problemName}` : `${entry.severity[0].toUpperCase()}${entry.severity.slice(1)} scouting observation`,
    summary: entry.note || (entry.photo ? 'Photo-based scouting observation' : 'Field scouting observation'),
    severity: entry.severity,
    metadata: {
      status: entry.status ?? 'monitoring',
      ...(entry.location ? { latitude: entry.location.lat, longitude: entry.location.lng } : {}),
      ...(entry.followUpDate ? { followUpDate: new Date(entry.followUpDate).toISOString().slice(0, 10) } : {}),
      ...(entry.diagnosis ? {
        diagnosisConfidence: entry.diagnosis.confidence,
        verificationStatus: entry.diagnosis.verificationStatus,
        referenceIds: entry.diagnosis.referenceMatches.map((match) => match.diseaseRefId).join(', '),
        referenceDatasets: entry.diagnosis.referenceMatches.map((match) => match.sourceDataset).filter((value, index, values) => values.indexOf(value) === index).join(', '),
        secondPhotoRequired: entry.diagnosis.needsSecondPhoto,
      } : {}),
    },
  }));
}

function soilRecords(entries: SoilTestEntry[]): FieldRecord[] {
  return entries.map((entry) => ({
    id: `soil-test-${entry.id}`,
    fieldName: entry.fieldName,
    timestamp: dateTimestamp(entry.date),
    source: 'soil-test' as const,
    kind: 'observation' as const,
    title: 'Soil test recorded',
    summary: `pH ${entry.ph} · OM ${entry.om}% · CEC ${entry.cec} meq/100g${entry.notes ? ` · ${entry.notes}` : ''}`,
    metadata: { pH: entry.ph, organicMatter: entry.om, cec: entry.cec, phosphorus: entry.p, sodium: entry.na },
  }));
}

const SATELLITE_TITLES: Record<SatelliteHealthLevel, string> = {
  excellent: 'Satellite health check: excellent',
  watch: 'Satellite health check: watch',
  stressed: 'Satellite health check: stressed',
  critical: 'Satellite health check: critical',
};

function satelliteRecords(records: SatelliteHealthRecord[]): FieldRecord[] {
  return records.map((entry) => ({
    id: `satellite-${entry.fieldId}-${entry.date}`,
    fieldId: entry.fieldId,
    fieldName: entry.fieldName,
    crop: entry.crop,
    timestamp: dateTimestamp(entry.date, entry.updatedAt),
    source: 'satellite' as const,
    kind: 'observation' as const,
    title: SATELLITE_TITLES[entry.level],
    summary: `NDVI ${entry.averageNdvi.toFixed(2)} · ${entry.stressedAreaPct.toFixed(1)}% stressed area · ${entry.source}`,
    severity: entry.level === 'critical' ? 'critical' : entry.level === 'stressed' ? 'warning' : 'info',
    metadata: { ndvi: entry.averageNdvi, stressedAreaPct: entry.stressedAreaPct, stressedAreaHa: entry.stressedAreaHa, cloudCover: entry.cloudCover, zones: entry.zoneCount },
  }));
}

export function buildFieldRecordTimeline(options: FieldRecordBookOptions = {}): FieldRecord[] {
  const manualRecords = options.manualRecords ?? (typeof window === 'undefined' ? [] : loadManualFieldRecords());
  const fields = options.fields ?? (typeof window === 'undefined' ? [] : readSavedFields());
  const scoutEntries = options.scoutEntries ?? (typeof window === 'undefined' ? [] : loadScoutEntries());
  const soilTests = options.soilTests ?? (typeof window === 'undefined' ? [] : getSoilTests());
  const satellite = options.satelliteRecords ?? (typeof window === 'undefined' ? [] : readSatelliteHealthRecords());
  return [
    ...manualRecords,
    ...fieldProfileRecords(fields),
    ...scoutingRecords(scoutEntries),
    ...soilRecords(soilTests),
    ...satelliteRecords(satellite),
  ].sort((a, b) => b.timestamp - a.timestamp || a.id.localeCompare(b.id));
}

export function getFieldRecordBookStats(records: FieldRecord[]): FieldRecordBookStats {
  const uniqueFields = new Set(records.map((record) => normalizeFieldName(record.fieldName)).filter(Boolean));
  return {
    total: records.length,
    fields: uniqueFields.size,
    observations: records.filter((record) => record.kind === 'observation').length,
    actions: records.filter((record) => ['decision', 'input', 'irrigation', 'harvest'].includes(record.kind)).length,
    critical: records.filter((record) => record.severity === 'critical').length,
    linkedSources: records.filter((record) => record.source !== 'manual' && record.source !== 'demo').length,
    totalAmountDzd: records.reduce((sum, record) => sum + (record.amountDzd ?? 0), 0),
  };
}
