export type ScoutSeverity = 'info' | 'warning' | 'critical';
export type ScoutStatus = 'open' | 'monitoring' | 'resolved';

export interface ScoutEntry {
  id: string;
  timestamp: number;
  fieldName: string;
  crop: string;
  location?: { lat: number; lng: number };
  note: string;
  severity: ScoutSeverity;
  photo?: string;
  voiceTranscript?: string;
  /** Workflow status. Optional for backwards compatibility with v1 entries. */
  status?: ScoutStatus;
  /** Optional follow-up reminder timestamp. */
  followUpDate?: number;
  /** Optional action to complete at the follow-up. */
  followUpTask?: string;
  /** Last time the workflow metadata was changed. */
  updatedAt?: number;
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
