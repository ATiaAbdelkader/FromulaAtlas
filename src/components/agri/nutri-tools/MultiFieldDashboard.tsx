'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, LayoutDashboard, Sprout, Droplets, Calendar, BarChart3 } from 'lucide-react';
import { CROP_PRESETS, getCropPreset } from '@/lib/crop-presets';
import { copyFor, type Language, useTranslation } from '@/lib/language-store';

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

const CROP_NAMES_AR: Record<string, string> = {
  tomato: 'طماطم', strawberry: 'فراولة', avocado: 'أفوكادو', blueberry: 'توت أزرق', lettuce: 'خس',
  'bell-pepper': 'فلفل حلو', cucumber: 'خيار', citrus: 'حمضيات', coffee: 'قهوة', maize: 'ذرة',
};

const STAGE_NAMES_AR: Record<string, string> = {
  Initial: 'بداية', Development: 'نمو', Mid: 'منتصف', Late: 'نهاية',
};

const DEMAND_NAMES_AR: Record<string, string> = {
  Low: 'منخفض', Medium: 'متوسط', High: 'مرتفع',
};

function cropLabel(language: Language, cropId: string, english: string): string {
  return copyFor(language, english, CROP_NAMES_AR[cropId] ?? english);
}

function stageLabel(language: Language, stage: string): string {
  return copyFor(language, stage, STAGE_NAMES_AR[stage] ?? stage);
}

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

function irrigationDemand(cropId: string, days: number, language: Language): string {
  const p = getCropPreset(cropId);
  if (!p) return '—';
  let acc = 0, kc = 0;
  for (const s of p.irrigation.stages) { acc += s.days; kc = s.kc; if (days <= acc) break; }
  const mm = (kc * 5).toFixed(1);
  const level = kc < 0.5 ? 'Low' : kc < 0.9 ? 'Medium' : 'High';
  return copyFor(language, `${level} (~${mm} mm/day)`, `${DEMAND_NAMES_AR[level]} (~${mm} ملم/يوم)`);
}

export function MultiFieldDashboard() {
  const { language, isRTL } = useTranslation();
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
    name: f.name || copyFor(language, 'Unnamed', 'بدون اسم'), actual: f.lastYield, benchmark: BENCHMARK_YIELD[f.crop] ?? 0,
  })), [fields, language]);

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'} className="overflow-hidden border-emerald-100/80 shadow-sm dark:border-emerald-950/60">
      <CardHeader className="border-b border-emerald-100/70 bg-gradient-to-br from-emerald-50/80 via-card to-card pb-4 dark:border-emerald-950/70 dark:from-emerald-950/30">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                <LayoutDashboard className="h-4 w-4" />
              </span>
              <span>{copyFor(language, 'Multi-Field Dashboard', 'لوحة تحكم الحقول المتعددة')}</span>
            </CardTitle>
            <CardDescription className="mt-2 max-w-2xl text-xs leading-relaxed">
              {copyFor(language, 'Track multiple fields, compare yields vs benchmarks, and view per-field quick stats.', 'تتبّع حقولًا متعددة، وقارن الإنتاجية بالمعايير، واطّلع على الإحصاءات السريعة لكل حقل.')}

            </CardDescription>
          </div>
          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50/70 px-2.5 py-1 text-[10px] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              {fields.length} {fields.length === 1 ? copyFor(language, 'field', 'حقل') : copyFor(language, 'fields', 'حقول')}
            </Badge>
            <Button size="sm" onClick={openAdd} className="min-h-9 gap-1.5 bg-emerald-600 px-3 shadow-sm hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> {copyFor(language, 'Add field', 'إضافة حقل')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-5">
        {fields.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-background to-background p-2 dark:border-emerald-900/70 dark:from-emerald-950/30">
            <EmptyState
              icon={Sprout}
              title={copyFor(language, 'No fields yet', 'لا توجد حقول بعد')}
              description={copyFor(language, "Add your first field to start tracking irrigation, fertilization, and scouting. You'll see it here with crop stage, water demand, and progress.", 'أضف حقلك الأول لبدء تتبّع الري والتسميد والكشف الحقلي. ستظهر هنا مرحلة المحصول واحتياج المياه ونسبة التقدم.')}
              color="#16a34a"
              action={{ label: copyFor(language, 'Add your first field', 'أضف حقلك الأول'), onClick: openAdd }}
            />
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <BarChart3 className="h-3.5 w-3.5" />
                  </span>
                  <span>{copyFor(language, 'Yield vs benchmark', 'الإنتاجية مقارنة بالمعيار')} <span className="font-normal text-muted-foreground">(t/ha)</span></span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />{copyFor(language, 'Actual', 'فعلي')}</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-slate-400" />{copyFor(language, 'Benchmark', 'معيار')}</span>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl bg-background/70 px-1 py-2">
                <ComparisonChart data={chartData} language={language} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {fields.map(f => {
                const preset = getCropPreset(f.crop);
                const days = daysSince(f.plantingDate);
                const bench = BENCHMARK_YIELD[f.crop] ?? 0;
                const stage = currentStage(f.crop, days);
                const irr = irrigationDemand(f.crop, days, language);
                const displayName = f.name || copyFor(language, 'Unnamed', 'بدون اسم');
                const ratio = bench ? Math.min(100, (f.lastYield / bench) * 100) : 0;
                return (
                  <article key={f.id} className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:hover:border-emerald-900/70">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl dark:bg-emerald-950/40" aria-hidden>{preset?.emoji ?? '🌱'}</span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{displayName}</div>
                          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{cropLabel(language, f.crop, preset?.name ?? f.crop)} · {f.areaHa} ha</div>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(f)} aria-label={copyFor(language, `Edit ${displayName}`, `تعديل ${displayName}`)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30" onClick={() => remove(f.id)} aria-label={copyFor(language, `Delete ${displayName}`, `حذف ${displayName}`)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-3">
                      <Badge variant="outline" className="justify-center truncate border-emerald-200/80 bg-emerald-50/40 text-[10px] dark:border-emerald-900/70 dark:bg-emerald-950/20">{stageLabel(language, stage)}</Badge>
                      <span className="flex items-center justify-center gap-1 rounded-md bg-muted/50 px-2 py-1 text-muted-foreground"><Calendar className="h-3 w-3" />{days}d</span>
                      <span className="flex items-center justify-center gap-1 rounded-md bg-muted/50 px-2 py-1 text-muted-foreground"><Droplets className="h-3 w-3 text-blue-500" />{irr}</span>
                    </div>
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-medium text-muted-foreground">{copyFor(language, 'Yield progress', 'تقدم الإنتاجية')}</span>
                        <span className="whitespace-nowrap font-mono text-muted-foreground">{f.lastYield}/{bench} t/ha</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={copyFor(language, `${displayName} yield progress`, `تقدم إنتاجية ${displayName}`)} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio)}>
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all" style={{ width: `${ratio}%` }} />
                      </div>
                    </div>
                    {f.notes && <p className="mt-3 line-clamp-2 border-t border-border/60 pt-3 text-[11px] leading-relaxed text-muted-foreground italic">{f.notes}</p>}
                  </article>
                );
              })}
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-[560px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? copyFor(language, 'Edit field', 'تعديل الحقل') : copyFor(language, 'Add field', 'إضافة حقل')}</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">{copyFor(language, 'Enter field details. Saved to local storage on this device.', 'أدخل تفاصيل الحقل. سيتم حفظها في التخزين المحلي على هذا الجهاز.')}</DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="grid grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="text-xs">{copyFor(language, 'Field name', 'اسم الحقل')} *</Label>
                <Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} className="mt-1 h-10" placeholder={copyFor(language, 'e.g. North 40', 'مثال: الحقل الشمالي 40')} />
              </div>
              <div>
                <Label className="text-xs">{copyFor(language, 'Crop', 'المحصول')}</Label>
                <Select value={draft.crop} onValueChange={v => setDraft({ ...draft, crop: v })}>
                  <SelectTrigger className="mt-1 h-10 w-full text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CROP_PRESETS.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.emoji} {cropLabel(language, c.id, c.name)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">{copyFor(language, 'Area (ha)', 'المساحة (هكتار)')}</Label><Input type="number" value={draft.areaHa} onChange={e => setDraft({ ...draft, areaHa: parseFloat(e.target.value) || 0 })} className="mt-1 h-10" /></div>
              <div><Label className="text-xs">{copyFor(language, 'Planting date', 'تاريخ الزراعة')}</Label><Input type="date" value={draft.plantingDate} onChange={e => setDraft({ ...draft, plantingDate: e.target.value })} className="mt-1 h-10" /></div>
              <div><Label className="text-xs">{copyFor(language, 'Last yield (t/ha)', 'آخر إنتاجية (طن/هكتار)')}</Label><Input type="number" value={draft.lastYield} onChange={e => setDraft({ ...draft, lastYield: parseFloat(e.target.value) || 0 })} className="mt-1 h-10" /></div>
              <div><Label className="text-xs">{copyFor(language, 'Soil pH', 'درجة حموضة التربة')}</Label><Input value={draft.soil.ph} onChange={e => setDraft({ ...draft, soil: { ...draft.soil, ph: e.target.value } })} className="mt-1 h-10" /></div>
              <div><Label className="text-xs">{copyFor(language, 'OM %', 'المادة العضوية %')}</Label><Input value={draft.soil.om} onChange={e => setDraft({ ...draft, soil: { ...draft.soil, om: e.target.value } })} className="mt-1 h-10" /></div>
              <div><Label className="text-xs">{copyFor(language, 'CEC (meq/100g)', 'السعة التبادلية الكاتيونية (meq/100g)')}</Label><Input value={draft.soil.cec} onChange={e => setDraft({ ...draft, soil: { ...draft.soil, cec: e.target.value } })} className="mt-1 h-10" /></div>
              <div><Label className="text-xs">{copyFor(language, 'Texture', 'قوام التربة')}</Label><Input value={draft.soil.texture} onChange={e => setDraft({ ...draft, soil: { ...draft.soil, texture: e.target.value } })} className="mt-1 h-10" /></div>
              <div className="sm:col-span-2">
                <Label className="text-xs">{copyFor(language, 'Notes', 'ملاحظات')}</Label>
                <Textarea value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} rows={3} className="mt-1 text-xs" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>{copyFor(language, 'Cancel', 'إلغاء')}</Button>
            <Button onClick={save} disabled={!draft?.name.trim()} className="bg-emerald-600 hover:bg-emerald-700">{copyFor(language, 'Save field', 'حفظ الحقل')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ComparisonChart({ data, language }: { data: { name: string; actual: number; benchmark: number }[]; language: Language }) {
  const max = Math.max(1, ...data.flatMap(d => [d.actual, d.benchmark]));
  const barW = 16, groupGap = 10, groupW = barW * 2 + 4;
  const chartW = data.length * groupW + (data.length - 1) * groupGap + 40;
  const plotH = 80, baseY = 20 + plotH;
  return (
    <svg viewBox={`0 0 ${chartW} 110`} className="h-[110px] min-w-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label={copyFor(language, 'Yield compared with benchmark chart', 'مخطط مقارنة الإنتاجية بالمعيار')}>
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
