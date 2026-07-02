'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, LayoutDashboard, Sprout, Droplets, Calendar } from 'lucide-react';
import { CROP_PRESETS, getCropPreset } from '@/lib/crop-presets';

const STORAGE_KEY = 'nutriplant_fields_v1';

interface SoilSummary { ph: string; om: string; cec: string; texture: string; }
interface Field {
  id: string; name: string; crop: string; areaHa: number; plantingDate: string;
  soil: SoilSummary; lastYield: number; notes: string;
}

const emptyField = (): Field => ({
  id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
  name: '', crop: 'tomato', areaHa: 1,
  plantingDate: new Date().toISOString().slice(0, 10),
  soil: { ph: '6.5', om: '2.5', cec: '15', texture: 'loam' },
  lastYield: 0, notes: '',
});

// Approx benchmark yields (t/ha) — extends crop-presets with the 8 FAO global crops.
const BENCHMARK_YIELD: Record<string, number> = {
  tomato: 80, strawberry: 50, avocado: 15, blueberry: 12, lettuce: 40, 'bell-pepper': 60,
  cucumber: 60, citrus: 40, coffee: 2, maize: 12, wheat: 6, rice: 8, potato: 40, soybean: 3, cassava: 30, banana: 50,
};

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 0 : Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

function currentStage(cropId: string, days: number): string {
  const p = getCropPreset(cropId);
  if (!p) return '—';
  let acc = 0;
  for (const s of p.irrigation.stages) { acc += s.days; if (days <= acc) return s.name; }
  return p.irrigation.stages[p.irrigation.stages.length - 1].name;
}

function irrigationDemand(cropId: string, days: number): string {
  const p = getCropPreset(cropId);
  if (!p) return '—';
  let acc = 0, kc = 0;
  for (const s of p.irrigation.stages) { acc += s.days; kc = s.kc; if (days <= acc) break; }
  const mm = (kc * 5).toFixed(1);
  if (kc < 0.5) return `Low (~${mm} mm/day)`;
  if (kc < 0.9) return `Medium (~${mm} mm/day)`;
  return `High (~${mm} mm/day)`;
}

export function MultiFieldDashboard() {
  const [fields, setFields] = useState<Field[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Field | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setFields(JSON.parse(raw));
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fields)); } catch { /* ignore */ }
  }, [fields, hydrated]);

  const openAdd = () => { setDraft(emptyField()); setOpen(true); };
  const openEdit = (f: Field) => { setDraft({ ...f }); setOpen(true); };
  const remove = (id: string) => setFields(fs => fs.filter(f => f.id !== id));
  const isEditing = draft ? fields.some(f => f.id === draft.id) : false;
  const save = () => {
    if (!draft || !draft.name.trim()) return;
    setFields(fs => {
      const idx = fs.findIndex(f => f.id === draft.id);
      if (idx === -1) return [...fs, draft];
      const copy = [...fs]; copy[idx] = draft; return copy;
    });
    setOpen(false); setDraft(null);
  };

  const chartData = useMemo(() => fields.map(f => ({
    name: f.name || 'Unnamed', actual: f.lastYield, benchmark: BENCHMARK_YIELD[f.crop] ?? 0,
  })), [fields]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <LayoutDashboard className="h-4 w-4 text-emerald-600" />
              Multi-Field Dashboard
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Track multiple fields, compare yields vs benchmarks, and view per-field quick stats.
            </CardDescription>
          </div>
          <Button size="sm" onClick={openAdd} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Add field
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
            <Sprout className="h-10 w-10 text-emerald-500 mb-2" />
            <p className="text-sm font-medium">No fields yet</p>
            <p className="text-xs text-muted-foreground mb-3">Add your first field to start tracking.</p>
            <Button size="sm" onClick={openAdd} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Add field
            </Button>
          </div>
        ) : (
          <>
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2 flex items-center justify-between">
                <span>Yield vs benchmark (t/ha)</span>
                <span className="flex items-center gap-2">
                  <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500" />Actual</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-slate-400" />Benchmark</span>
                </span>
              </div>
              <ComparisonChart data={chartData} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {fields.map(f => {
                const preset = getCropPreset(f.crop);
                const days = daysSince(f.plantingDate);
                const bench = BENCHMARK_YIELD[f.crop] ?? 0;
                const stage = currentStage(f.crop, days);
                const irr = irrigationDemand(f.crop, days);
                const ratio = bench ? Math.min(100, (f.lastYield / bench) * 100) : 0;
                return (
                  <div key={f.id} className="rounded-lg border bg-card p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-2xl" aria-hidden>{preset?.emoji ?? '🌱'}</span>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm truncate">{f.name || 'Unnamed'}</div>
                          <div className="text-[11px] text-muted-foreground">{preset?.name ?? f.crop} · {f.areaHa} ha</div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(f)} aria-label="Edit field"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => remove(f.id)} aria-label="Delete field"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <Badge variant="outline" className="text-[10px]">{stage}</Badge>
                      <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="h-3 w-3" />{days}d</span>
                      <span className="flex items-center gap-1 text-muted-foreground"><Droplets className="h-3 w-3 text-blue-500" />{irr}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${ratio}%` }} /></div>
                      <span className="text-muted-foreground whitespace-nowrap">{f.lastYield}/{bench} t/ha</span>
                    </div>
                    {f.notes && <p className="text-[11px] text-muted-foreground italic line-clamp-2">{f.notes}</p>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit field' : 'Add field'}</DialogTitle>
            <DialogDescription className="text-xs">Enter field details. Saved to local storage on this device.</DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              <div className="col-span-2">
                <Label className="text-xs">Field name *</Label>
                <Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} className="h-9 mt-1" placeholder="e.g. North 40" />
              </div>
              <div>
                <Label className="text-xs">Crop</Label>
                <Select value={draft.crop} onValueChange={v => setDraft({ ...draft, crop: v })}>
                  <SelectTrigger className="h-9 mt-1 w-full text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CROP_PRESETS.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.emoji} {c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Area (ha)</Label><Input type="number" value={draft.areaHa} onChange={e => setDraft({ ...draft, areaHa: parseFloat(e.target.value) || 0 })} className="h-9 mt-1" /></div>
              <div><Label className="text-xs">Planting date</Label><Input type="date" value={draft.plantingDate} onChange={e => setDraft({ ...draft, plantingDate: e.target.value })} className="h-9 mt-1" /></div>
              <div><Label className="text-xs">Last yield (t/ha)</Label><Input type="number" value={draft.lastYield} onChange={e => setDraft({ ...draft, lastYield: parseFloat(e.target.value) || 0 })} className="h-9 mt-1" /></div>
              <div><Label className="text-xs">Soil pH</Label><Input value={draft.soil.ph} onChange={e => setDraft({ ...draft, soil: { ...draft.soil, ph: e.target.value } })} className="h-9 mt-1" /></div>
              <div><Label className="text-xs">OM %</Label><Input value={draft.soil.om} onChange={e => setDraft({ ...draft, soil: { ...draft.soil, om: e.target.value } })} className="h-9 mt-1" /></div>
              <div><Label className="text-xs">CEC (meq/100g)</Label><Input value={draft.soil.cec} onChange={e => setDraft({ ...draft, soil: { ...draft.soil, cec: e.target.value } })} className="h-9 mt-1" /></div>
              <div><Label className="text-xs">Texture</Label><Input value={draft.soil.texture} onChange={e => setDraft({ ...draft, soil: { ...draft.soil, texture: e.target.value } })} className="h-9 mt-1" /></div>
              <div className="col-span-2">
                <Label className="text-xs">Notes</Label>
                <Textarea value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} rows={2} className="mt-1 text-xs" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!draft?.name.trim()} className="bg-emerald-600 hover:bg-emerald-700">Save field</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ComparisonChart({ data }: { data: { name: string; actual: number; benchmark: number }[] }) {
  const max = Math.max(1, ...data.flatMap(d => [d.actual, d.benchmark]));
  const barW = 16, groupGap = 10, groupW = barW * 2 + 4;
  const chartW = data.length * groupW + (data.length - 1) * groupGap + 40;
  const plotH = 80, baseY = 20 + plotH;
  return (
    <svg viewBox={`0 0 ${chartW} 110`} className="w-full h-[110px]" preserveAspectRatio="xMidYMid meet">
      <line x1="20" y1="20" x2="20" y2={baseY} stroke="currentColor" className="text-border" strokeWidth="1" />
      <line x1="20" y1={baseY} x2={chartW - 5} y2={baseY} stroke="currentColor" className="text-border" strokeWidth="1" />
      {data.map((d, i) => {
        const gx = 25 + i * (groupW + groupGap);
        const aH = (d.actual / max) * plotH;
        const bH = (d.benchmark / max) * plotH;
        const label = d.name.length > 8 ? d.name.slice(0, 8) + '…' : d.name;
        return (
          <g key={i}>
            <rect x={gx} y={baseY - aH} width={barW} height={aH} fill="#10b981" rx="2" />
            <rect x={gx + barW + 4} y={baseY - bH} width={barW} height={bH} fill="#94a3b8" rx="2" />
            <text x={gx + barW + 2} y={baseY + 14} textAnchor="middle" className="fill-muted-foreground" fontSize="9">{label}</text>
          </g>
        );
      })}
    </svg>
  );
}
