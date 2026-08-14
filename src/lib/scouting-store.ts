export type ScoutSeverity = 'info' | 'warning' | 'critical';
export type ScoutStatus = 'open' | 'monitoring' | 'resolved';
export type DiagnosisVerificationStatus = 'pending' | 'reviewed' | 'confirmed';

export interface ScoutDiagnosis {
  problemType: string;
  problemName: string;
  problemNameAr?: string;
  confidence: number;
  referenceMatches: Array<{
    diseaseRefId: string;
    rank: number;
    matchReason: string;
    sourceDataset: string;
    sourceUrl: string;
    imageCount: number;
  }>;
  needsSecondPhoto: boolean;
  nextPhotoTarget?: string;
  modelProvider?: string;
  verificationStatus: DiagnosisVerificationStatus;
}

export interface ScoutEntry {
  id: string;
  timestamp: number;
  fieldName: string;
  crop: string;
  location?: { lat: number; lng: number };
  note: string;
  severity: ScoutSeverity;
  photo?: string;
  additionalPhotos?: string[];
  voiceTranscript?: string;
  /** Workflow status. Optional for backwards compatibility with v1 entries. */
  status?: ScoutStatus;
  /** Optional follow-up reminder timestamp. */
  followUpDate?: number;
  /** Optional action to complete at the follow-up. */
  followUpTask?: string;
  /** Last time the workflow metadata was changed. */
  updatedAt?: number;
  /** Optional structured AI diagnosis and Gallery evidence. */
  diagnosis?: ScoutDiagnosis;
}

function normalizeDiagnosis(value: unknown): ScoutDiagnosis | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  const matches = Array.isArray(raw.referenceMatches)
    ? raw.referenceMatches.flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return [];
      const match = entry as Record<string, unknown>;
      if (typeof match.diseaseRefId !== 'string' || typeof match.sourceDataset !== 'string' || typeof match.sourceUrl !== 'string') return [];
      return [{
        diseaseRefId: match.diseaseRefId.slice(0, 120),
        rank: Math.max(1, Number(match.rank) || 1),
        matchReason: typeof match.matchReason === 'string' ? match.matchReason.slice(0, 240) : '',
        sourceDataset: match.sourceDataset.slice(0, 120),
        sourceUrl: match.sourceUrl.slice(0, 500),
        imageCount: Math.max(0, Number(match.imageCount) || 0),
      }];
    }).slice(0, 3)
    : [];
  if (typeof raw.problemType !== 'string' || typeof raw.problemName !== 'string') return undefined;
  const verificationStatus = raw.verificationStatus === 'confirmed' || raw.verificationStatus === 'reviewed' ? raw.verificationStatus : 'pending';
  return {
    problemType: raw.problemType.slice(0, 80),
    problemName: raw.problemName.slice(0, 160),
    problemNameAr: typeof raw.problemNameAr === 'string' ? raw.problemNameAr.slice(0, 160) : undefined,
    confidence: Math.max(0, Math.min(1, Number(raw.confidence) || 0)),
    referenceMatches: matches,
    needsSecondPhoto: raw.needsSecondPhoto === true,
    nextPhotoTarget: typeof raw.nextPhotoTarget === 'string' ? raw.nextPhotoTarget.slice(0, 40) : undefined,
    modelProvider: typeof raw.modelProvider === 'string' ? raw.modelProvider.slice(0, 120) : undefined,
    verificationStatus,
  };
}

export const SCOUT_STORAGE_KEY = 'nutriplant_scout_log_v1';
export const SCOUT_ENTRIES_CHANGED_EVENT = 'formula-atlas-scout-entries-changed';

export function getDefaultScoutStatus(severity: ScoutSeverity): ScoutStatus {
  return severity === 'critical' ? 'open' : 'monitoring';
}

export function normalizeScoutEntry(entry: ScoutEntry): ScoutEntry {
  return {
    ...entry,
    status: entry.status ?? getDefaultScoutStatus(entry.severity),
    updatedAt: entry.updatedAt ?? entry.timestamp,
    additionalPhotos: Array.isArray(entry.additionalPhotos) ? entry.additionalPhotos.filter((photo): photo is string => typeof photo === 'string' && photo.startsWith('data:image/')).slice(0, 2) : undefined,
    diagnosis: normalizeDiagnosis(entry.diagnosis),
  };
}

export function loadScoutEntries(): ScoutEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SCOUT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((entry) => normalizeScoutEntry(entry as ScoutEntry)) : [];
  } catch {
    return [];
  }
}

export function saveScoutEntries(entries: ScoutEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SCOUT_STORAGE_KEY, JSON.stringify(entries.map(normalizeScoutEntry)));
    window.dispatchEvent(new Event(SCOUT_ENTRIES_CHANGED_EVENT));
  } catch {
    // Keep the in-memory experience usable when localStorage is unavailable or full.
  }
}

export function appendScoutEntry(entry: ScoutEntry): ScoutEntry[] {
  const next = [normalizeScoutEntry(entry), ...loadScoutEntries()];
  saveScoutEntries(next);
  return next;
}

export function updateScoutEntry(
  id: string,
  patch: Partial<Pick<ScoutEntry, 'status' | 'followUpDate' | 'followUpTask' | 'severity'>>,
): ScoutEntry[] {
  const next = loadScoutEntries().map((entry) =>
    entry.id === id ? normalizeScoutEntry({ ...entry, ...patch, updatedAt: Date.now() }) : entry,
  );
  saveScoutEntries(next);
  return next;
}

export function removeScoutEntry(id: string): ScoutEntry[] {
  const next = loadScoutEntries().filter(entry => entry.id !== id);
  saveScoutEntries(next);
  return next;
}
