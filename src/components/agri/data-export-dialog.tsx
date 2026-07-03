'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { useUserStore } from '@/lib/user-store';
import { cn } from '@/lib/utils';

interface DataExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BackupPayload {
  exportedAt: string;
  version: number;
  favorites: string[];
  notes: Record<string, string>;
  calcHistory: unknown[];
}

export function DataExportDialog({ open, onOpenChange }: DataExportDialogProps) {
  const {
    favorites,
    notes,
    calcHistory,
    clearCalcHistory,
    toggleFavorite,
    setNote,
  } = useUserStore();

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [confirmClear, setConfirmClear] = useState(false);
  const [importResult, setImportResult] = useState<
    { ok: true; counts: { favorites: number; notes: number; history: number } } | { ok: false; error: string } | null
  >(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const payload: BackupPayload = useMemo(
    () => ({
      exportedAt: new Date().toISOString(),
      version: 1,
      favorites,
      notes,
      calcHistory,
    }),
    [favorites, notes, calcHistory],
  );

  const handleExport = () => {
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `agri-atlas-backup-${stamp}.json`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupPayload;
      if (typeof data !== 'object' || data === null) {
        throw new Error('Backup file is not a valid JSON object.');
      }
      // Merge favorites (avoid duplicates).
      let favCount = 0;
      if (Array.isArray(data.favorites)) {
        for (const code of data.favorites) {
          if (typeof code === 'string' && !favorites.includes(code)) {
            toggleFavorite(code);
            favCount++;
          }
        }
      }
      // Merge notes (overwrite only empty slots to avoid clobbering user edits).
      let noteCount = 0;
      if (data.notes && typeof data.notes === 'object') {
        for (const [code, text] of Object.entries(data.notes)) {
          if (typeof text === 'string' && !notes[code]) {
            setNote(code, text);
            noteCount++;
          }
        }
      }
      // History merge is not supported (history is append-only) — just inform.
      const histCount = Array.isArray(data.calcHistory) ? data.calcHistory.length : 0;

      setImportResult({
        ok: true,
        counts: { favorites: favCount, notes: noteCount, history: histCount },
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
            Export your favorites, notes, and calculation history as a JSON
            file you can restore later or move to another device.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'export' | 'import')}
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
                <Stat label="Favorites" value={favorites.length} />
                <Stat label="Notes" value={Object.keys(notes).length} />
                <Stat label="History" value={calcHistory.length} />
              </div>
              <Button
                onClick={handleExport}
                className="w-full gap-1.5"
                disabled={favorites.length === 0 && Object.keys(notes).length === 0 && calcHistory.length === 0}
              >
                <Download className="h-4 w-4" />
                Download backup (.json)
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                The backup contains all favorites, notes, and your last 100
                calculation entries.
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
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImportFile(file);
                  e.target.value = '';
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-lg border-2 border-dashed border-border p-8 text-center hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors"
              >
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm font-medium">
                  Choose a backup file…
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  .json file from a previous export
                </div>
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
                        <div className="font-semibold">Imported successfully</div>
                        <div className="mt-0.5 text-[11px]">
                          +{importResult.counts.favorites} favorites ·{' '}
                          +{importResult.counts.notes} notes ·{' '}
                          {importResult.counts.history} history entries
                          (history is not auto-merged).
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
                <span>
                  Importing is additive — your existing favorites and notes
                  are preserved. Existing entries are skipped to prevent
                  duplicates.
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Danger zone */}
        <div className="p-5 pt-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Danger zone
          </div>
          <div className="flex items-center justify-between gap-2 rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 px-3 py-2">
            <div>
              <div className="text-xs font-medium">Clear calculation history</div>
              <div className="text-[11px] text-muted-foreground">
                Permanently delete all {calcHistory.length} saved calculations.
              </div>
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
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all history?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {calcHistory.length} saved
              calculation entries. This cannot be undone. Make sure you&apos;ve
              exported a backup first if you want to keep these.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClear}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Clear all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-card px-2.5 py-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </div>
      <div className="text-xl font-bold tabular-nums mt-0.5">{value}</div>
    </div>
  );
}

export default DataExportDialog;
