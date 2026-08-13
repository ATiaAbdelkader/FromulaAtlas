export type ScoutSeverity = 'info' | 'warning' | 'critical';

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
}

export const SCOUT_STORAGE_KEY = 'nutriplant_scout_log_v1';
export const SCOUT_ENTRIES_CHANGED_EVENT = 'formula-atlas-scout-entries-changed';

export function loadScoutEntries(): ScoutEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SCOUT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveScoutEntries(entries: ScoutEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SCOUT_STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new Event(SCOUT_ENTRIES_CHANGED_EVENT));
  } catch {
    // Keep the in-memory experience usable when localStorage is unavailable or full.
  }
}

export function appendScoutEntry(entry: ScoutEntry): ScoutEntry[] {
  const next = [entry, ...loadScoutEntries()];
  saveScoutEntries(next);
  return next;
}

export function removeScoutEntry(id: string): ScoutEntry[] {
  const next = loadScoutEntries().filter(entry => entry.id !== id);
  saveScoutEntries(next);
  return next;
}
