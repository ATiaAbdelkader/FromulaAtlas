'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Database,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useUserStore, type CalcHistoryEntry } from '@/lib/user-store';
import { useFarmStore, type Farm, type FarmCalcEntry } from '@/lib/farm-store';
import {
  loadScoutEntries,
  saveScoutEntries,
  SCOUT_ENTRIES_CHANGED_EVENT,
  type ScoutEntry,
  type ScoutSeverity,
} from '@/lib/scouting-store';
import { getPinnedToolIds, setPinnedToolIds } from '@/lib/tool-registry';
import {
  loadOnboarding,
  saveOnboarding,
  type OnboardingState,
  type UserRole,
} from '@/lib/onboarding-store';
import { cn } from '@/lib/utils';

interface DataExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FarmProfileBackup {
  name?: string;
  lat?: string;
  lng?: string;
  crop?: string;
  plantingDate?: string;
  area?: number;
  setupCompleted?: boolean;
}

interface BackupPayload {
  backupType: 'formula-atlas';
  exportedAt: string;
  version: 2;
  user: {
    favorites: string[];
    notes: Record<string, string>;
    calcHistory: CalcHistoryEntry[];
  };
  farm: {
    profile: FarmProfileBackup | null;
    farms: Farm[];
    activeFarmId: string | null;
    farmCalcs: FarmCalcEntry[];
  };
  scouting: ScoutEntry[];
  pinnedToolIds: string[];
  onboarding: OnboardingState;
}

type ImportCounts = {
  favorites: number;
  notes: number;
  history: number;
  farms: number;
  farmCalcs: number;
  observations: number;
  pinned: number;
  profile: number;
  onboarding: number;
};

type ImportResult =
  | { ok: true; counts: ImportCounts }
  | { ok: false; error: string }
  | null;

const FARM_PROFILE_KEY = 'farm_profile_v1';
const ET_TRACKER_LOC_KEY = 'et_tracker_last_loc_v1';
const MAX_HISTORY = 100;
const VALID_SEVERITIES: ScoutSeverity[] = ['info', 'warning', 'critical'];
const VALID_ROLES: Array<UserRole | null> = ['grower', 'agronomist', 'student', 'consultant', 'other', null];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => typeof item === 'string'),
  ) as Record<string, string>;
}

function numberRecord(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => finiteNumber(item) !== null),
  ) as Record<string, number>;
}

function normalizeCalcHistory(value: unknown): CalcHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const result = isRecord(item.result) ? item.result : null;
    const inputLabels = Array.isArray(item.inputLabels)
      ? item.inputLabels.flatMap((label) => {
          if (!isRecord(label) || typeof label.key !== 'string' || typeof label.label !== 'string') return [];
          const numericValue = finiteNumber(label.value);
          return numericValue === null
            ? []
            : [{ key: label.key, label: label.label, value: numericValue, unit: typeof label.unit === 'string' ? label.unit : undefined }];
        })
      : [];
    if (
      typeof item.id !== 'string' ||
      typeof item.timestamp !== 'number' ||
      typeof item.formulaCode !== 'string' ||
      typeof item.formulaName !== 'string' ||
      typeof item.formulaPart !== 'string' ||
      !result ||
      typeof result.value !== 'string' ||
      typeof result.label !== 'string'
    ) return [];
    return [{
      id: item.id,
      timestamp: Number.isFinite(item.timestamp) ? item.timestamp : Date.now(),
      formulaCode: item.formulaCode,
      formulaName: item.formulaName,
      formulaPart: item.formulaPart,
      inputs: numberRecord(item.inputs),
      inputLabels,
      result: {
        value: result.value,
        label: result.label,
        interpretation: typeof result.interpretation === 'string' ? result.interpretation : undefined,
      },
    }];
  });
}

function normalizeFarms(value: unknown): Farm[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    if (
      typeof item.id !== 'string' ||
      typeof item.name !== 'string' ||
      finiteNumber(item.area) === null ||
      typeof item.crop !== 'string' ||
      typeof item.soilType !== 'string' ||
      typeof item.irrigationType !== 'string'
    ) return [];
    return [{
      id: item.id,
      name: item.name,
      area: finiteNumber(item.area) ?? 0,
      crop: item.crop,
      soilType: item.soilType,
      irrigationType: item.irrigationType,
      plantingDate: typeof item.plantingDate === 'string' ? item.plantingDate : undefined,
      notes: typeof item.notes === 'string' ? item.notes : undefined,
      createdAt: finiteNumber(item.createdAt) ?? Date.now(),
    }];
  });
}

function normalizeFarmCalcs(value: unknown): FarmCalcEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item) || !isRecord(item.result) || !Array.isArray(item.inputLabels)) return [];
    const result = item.result;
    if (
      typeof item.id !== 'string' ||
      typeof item.farmId !== 'string' ||
      typeof item.formulaCode !== 'string' ||
      typeof item.formulaName !== 'string' ||
      typeof result.value !== 'string' ||
      typeof result.label !== 'string'
    ) return [];
    const inputLabels = item.inputLabels.flatMap((label) => {
      if (!isRecord(label) || typeof label.key !== 'string' || typeof label.label !== 'string') return [];
      const valueNumber = finiteNumber(label.value);
      return valueNumber === null ? [] : [{ key: label.key, label: label.label, value: valueNumber, unit: typeof label.unit === 'string' ? label.unit : undefined }];
    });
    return [{
      id: item.id,
      farmId: item.farmId,
      timestamp: finiteNumber(item.timestamp) ?? Date.now(),
      formulaCode: item.formulaCode,
      formulaName: item.formulaName,
      inputs: numberRecord(item.inputs),
      inputLabels,
      result: {
        value: result.value,
        label: result.label,
        interpretation: typeof result.interpretation === 'string' ? result.interpretation : undefined,
      },
    }];
  });
}

function normalizeScoutEntries(value: unknown): ScoutEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.fieldName !== 'string' || typeof item.crop !== 'string' || typeof item.note !== 'string' || !VALID_SEVERITIES.includes(item.severity as ScoutSeverity)) return [];
    const location = isRecord(item.location) && finiteNumber(item.location.lat) !== null && finiteNumber(item.location.lng) !== null
      ? { lat: finiteNumber(item.location.lat) ?? 0, lng: finiteNumber(item.location.lng) ?? 0 }
      : undefined;
    return [{
      id: item.id,
      timestamp: finiteNumber(item.timestamp) ?? Date.now(),
      fieldName: item.fieldName,
      crop: item.crop,
      location,
      note: item.note,
      severity: item.severity as ScoutSeverity,
      photo: typeof item.photo === 'string' ? item.photo : undefined,
      voiceTranscript: typeof item.voiceTranscript === 'string' ? item.voiceTranscript : undefined,
    }];
  });
}

function normalizeFarmProfile(value: unknown): FarmProfileBackup | null {
  if (!isRecord(value)) return null;
  const profile: FarmProfileBackup = {};
  for (const key of ['name', 'lat', 'lng', 'crop', 'plantingDate'] as const) {
    if (typeof value[key] === 'string') profile[key] = value[key];
  }
  if (finiteNumber(value.area) !== null) profile.area = finiteNumber(value.area) ?? undefined;
  if (typeof value.setupCompleted === 'boolean') profile.setupCompleted = value.setupCompleted;
  return Object.keys(profile).length > 0 ? profile : null;
}

function normalizeOnboarding(value: unknown): OnboardingState | null {
  if (!isRecord(value)) return null;
  const role = VALID_ROLES.includes(value.role as UserRole | null) ? value.role as UserRole | null : null;
  return {
    completed: value.completed === true,
    role,
    crop: typeof value.crop === 'string' ? value.crop : null,
    completedAt: finiteNumber(value.completedAt),
    skippedAt: finiteNumber(value.skippedAt),
  };
}

function normalizeBackup(raw: unknown): BackupPayload {
  if (!isRecord(raw)) throw new Error('Backup file is not a valid JSON object.');

  // Version 1 files were limited to user favorites, notes, and history.
  if (raw.version === 1) {
    return {
      backupType: 'formula-atlas',
      exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : new Date().toISOString(),
      version: 2,
      user: {
        favorites: Array.isArray(raw.favorites) ? raw.favorites.filter((item): item is string => typeof item === 'string') : [],
        notes: stringRecord(raw.notes),
        calcHistory: normalizeCalcHistory(raw.calcHistory),
      },
      farm: { profile: null, farms: [], activeFarmId: null, farmCalcs: [] },
      scouting: [],
      pinnedToolIds: [],
      onboarding: loadOnboarding(),
    };
  }

  if (raw.backupType !== 'formula-atlas' || raw.version !== 2) {
    throw new Error('Unsupported backup format. Export a new backup from Formula Atlas and try again.');
  }

  const user = isRecord(raw.user) ? raw.user : {};
  const farm = isRecord(raw.farm) ? raw.farm : {};
  const normalizedOnboarding = normalizeOnboarding(raw.onboarding);
  return {
    backupType: 'formula-atlas',
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : new Date().toISOString(),
    version: 2,
    user: {
      favorites: Array.isArray(user.favorites) ? user.favorites.filter((item): item is string => typeof item === 'string') : [],
      notes: stringRecord(user.notes),
      calcHistory: normalizeCalcHistory(user.calcHistory),
    },
    farm: {
      profile: normalizeFarmProfile(farm.profile),
      farms: normalizeFarms(farm.farms),
      activeFarmId: typeof farm.activeFarmId === 'string' ? farm.activeFarmId : null,
      farmCalcs: normalizeFarmCalcs(farm.farmCalcs),
    },
    scouting: normalizeScoutEntries(raw.scouting),
    pinnedToolIds: Array.isArray(raw.pinnedToolIds) ? raw.pinnedToolIds.filter((item): item is string => typeof item === 'string') : [],
    onboarding: normalizedOnboarding ?? loadOnboarding(),
  };
}

function readFarmProfile(): FarmProfileBackup | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(FARM_PROFILE_KEY);
    return saved ? normalizeFarmProfile(JSON.parse(saved)) : null;
  } catch {
    return null;
  }
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const merged = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) merged.set(item.id, item);
  return [...merged.values()];
}

export function DataExportDialog({ open, onOpenChange }: DataExportDialogProps) {
  const {
    favorites,
    notes,
    calcHistory,
    clearCalcHistory,
    restoreUserData,
  } = useUserStore();
  const {
    farms,
    activeFarmId,
    farmCalcs,
    replaceFarmData,
  } = useFarmStore();
  const [farmProfile, setFarmProfile] = useState<FarmProfileBackup | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingState>(() => loadOnboarding());
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [confirmClear, setConfirmClear] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setFarmProfile(readFarmProfile());
    setOnboarding(loadOnboarding());
    setImportResult(null);
  }, [open]);

  const scouting = useMemo(() => loadScoutEntries(), [open, importResult]);
  const pinnedToolIds = useMemo(() => getPinnedToolIds(), [open, importResult]);
  const payload: BackupPayload = useMemo(
    () => ({
      backupType: 'formula-atlas',
      exportedAt: new Date().toISOString(),
      version: 2,
      user: { favorites, notes, calcHistory },
      farm: { profile: farmProfile, farms, activeFarmId, farmCalcs },
      scouting,
      pinnedToolIds,
      onboarding,
    }),
    [favorites, notes, calcHistory, farmProfile, farms, activeFarmId, farmCalcs, scouting, pinnedToolIds, onboarding],
  );

  const totalItems = favorites.length + Object.keys(notes).length + calcHistory.length + farms.length + farmCalcs.length + scouting.length + pinnedToolIds.length + (farmProfile ? 1 : 0);

  const handleExport = () => {
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `formula-atlas-backup-${stamp}.json`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleImportFile = async (file: File) => {
    try {
      const imported = normalizeBackup(JSON.parse(await file.text()));
      const mergedFavorites = [...new Set([...favorites, ...imported.user.favorites])];
      const mergedNotes = { ...imported.user.notes, ...notes };
      const mergedHistory = mergeById(calcHistory, imported.user.calcHistory).slice(-MAX_HISTORY);
      const mergedFarms = mergeById(farms, imported.farm.farms);
      const mergedFarmCalcs = mergeById(farmCalcs, imported.farm.farmCalcs);
      const mergedScouting = mergeById(scouting, imported.scouting).sort((a, b) => b.timestamp - a.timestamp);
      const mergedPinned = [...new Set([...pinnedToolIds, ...imported.pinnedToolIds])];

      restoreUserData({ favorites: mergedFavorites, notes: mergedNotes, calcHistory: mergedHistory });
      replaceFarmData({
        farms: mergedFarms,
        activeFarmId: activeFarmId ?? imported.farm.activeFarmId,
        farmCalcs: mergedFarmCalcs,
      });
      saveScoutEntries(mergedScouting);
      setPinnedToolIds(mergedPinned);

      let profileCount = 0;
      if (imported.farm.profile) {
        localStorage.setItem(FARM_PROFILE_KEY, JSON.stringify(imported.farm.profile));
        if (imported.farm.profile.lat && imported.farm.profile.lng) {
          localStorage.setItem(ET_TRACKER_LOC_KEY, JSON.stringify({ lat: imported.farm.profile.lat, lng: imported.farm.profile.lng }));
        }
        setFarmProfile(imported.farm.profile);
        profileCount = 1;
      }

      let onboardingCount = 0;
      if (imported.onboarding.completed && !onboarding.completed) {
        saveOnboarding(imported.onboarding);
        setOnboarding(imported.onboarding);
        onboardingCount = 1;
      }

      window.dispatchEvent(new Event(SCOUT_ENTRIES_CHANGED_EVENT));
      window.dispatchEvent(new Event('formula-atlas-backup-restored'));
      setImportResult({
        ok: true,
        counts: {
          favorites: Math.max(0, mergedFavorites.length - favorites.length),
          notes: Object.keys(mergedNotes).filter((key) => !(key in notes)).length,
          history: Math.max(0, mergedHistory.length - calcHistory.length),
          farms: Math.max(0, mergedFarms.length - farms.length),
          farmCalcs: Math.max(0, mergedFarmCalcs.length - farmCalcs.length),
          observations: Math.max(0, mergedScouting.length - scouting.length),
          pinned: Math.max(0, mergedPinned.length - pinnedToolIds.length),
          profile: profileCount,
          onboarding: onboardingCount,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to parse backup file.';
      setImportResult({ ok: false, error: msg });
    }
  };

  const handleClear = () => {
    clearCalcHistory();
    setConfirmClear(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[92vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-5 pb-4 border-b border-border bg-gradient-to-r from-emerald-50 via-background to-background dark:from-emerald-950/40">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="flex items-center justify-center h-8 w-8 rounded-md bg-gradient-to-br from-emerald-500 to-green-700 text-white">
              <Database className="h-4 w-4" />
            </span>
            Backup &amp; Restore
          </DialogTitle>
          <DialogDescription className="text-xs">
            Move your farm profile, calculations, scouting observations, pinned tools, and preferences between devices.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'export' | 'import')}
          className="px-5 pt-3"
        >
          <TabsList>
            <TabsTrigger value="export" className="text-xs gap-1">
              <Download className="h-3.5 w-3.5" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import" className="text-xs gap-1">
              <Upload className="h-3.5 w-3.5" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="mt-3 pb-2">
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <Stat label="Farm records" value={farms.length} />
                <Stat label="Observations" value={scouting.length} />
                <Stat label="Preferences" value={favorites.length + Object.keys(notes).length + pinnedToolIds.length} />
              </div>
              <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 px-3 py-2 text-[11px] text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
                <ShieldCheck className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>This backup stays on your device until you choose where to store it. Weather forecasts are not included because they can be regenerated from the saved location.</span>
              </div>
              <Button
                onClick={handleExport}
                className="w-full gap-1.5"
                disabled={totalItems === 0}
              >
                <Download className="h-4 w-4" />
                Download backup (.json)
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                Includes {totalItems} saved items in version 2 format. Older version 1 backups remain supported.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="import" className="mt-3 pb-2">
            <div className="space-y-3">
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleImportFile(file);
                  event.target.value = '';
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-lg border-2 border-dashed border-border p-8 text-center hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors"
              >
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm font-medium">Choose a backup file…</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Version 1 or version 2 Formula Atlas JSON backup</div>
              </button>

              {importResult && (
                <div
                  className={cn(
                    'rounded-md border p-3 text-xs',
                    importResult.ok
                      ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                      : 'border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400',
                  )}
                >
                  {importResult.ok ? (
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold">Backup restored safely</div>
                        <div className="mt-0.5 text-[11px] leading-relaxed">
                          +{importResult.counts.favorites} favorites · +{importResult.counts.notes} notes · +{importResult.counts.history} calculations · +{importResult.counts.farms} farms · +{importResult.counts.observations} observations · +{importResult.counts.pinned} pinned tools.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold">Import failed</div>
                        <div className="mt-0.5 text-[11px]">{importResult.error}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>Importing is additive. Existing records, notes, and favorites are preserved; matching IDs are updated from the backup, and malformed records are skipped.</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="p-5 pt-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Danger zone
          </div>
          <div className="flex items-center justify-between gap-2 rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 px-3 py-2">
            <div>
              <div className="text-xs font-medium">Clear calculation history</div>
              <div className="text-[11px] text-muted-foreground">Permanently delete all {calcHistory.length} saved calculations.</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1 text-rose-600 hover:text-rose-700 border-rose-200 dark:border-rose-900"
              onClick={() => setConfirmClear(true)}
              disabled={calcHistory.length === 0}
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </Button>
          </div>
        </div>

        <DialogFooter className="p-3 border-t border-border bg-muted/30 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all history?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {calcHistory.length} saved calculation entries. This cannot be undone. Make sure you&apos;ve exported a backup first if you want to keep these.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear} className="bg-rose-600 hover:bg-rose-700 text-white">Clear all</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-card px-2.5 py-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
      <div className="text-xl font-bold tabular-nums mt-0.5">{value}</div>
    </div>
  );
}

export default DataExportDialog;
