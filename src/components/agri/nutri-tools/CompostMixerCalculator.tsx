'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Recycle, Plus, Trash2, CheckCircle2, AlertTriangle, Droplets } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';

interface Feedstock { id: string; name: string; C: number; N: number; moisture: number; weight: number; }

const FEEDSTOCK_AR: Record<string, string> = {
  'Grass clippings': 'قصاصات العشب', 'Leaves (dry)': 'أوراق جافة', 'Food waste': 'مخلفات غذائية', 'Manure (cattle)': 'روث أبقار',
  'Manure (poultry)': 'روث دواجن', Straw: 'قش', 'Wood chips': 'رقائق خشب', 'Coffee grounds': 'تفل القهوة', 'Cardboard (shredded)': 'كرتون ممزق', 'Alfalfa hay': 'دريس البرسيم',
};
type UiLanguage = Parameters<typeof copyFor>[0];
const feedstockLabel = (language: UiLanguage, name: string) => copyFor(language, name, FEEDSTOCK_AR[name] || name);

const COMMON_FEEDSTOCKS = [
  { name: 'Grass clippings', C: 45, N: 3.0, moisture: 80 },
  { name: 'Leaves (dry)', C: 48, N: 0.8, moisture: 15 },
  { name: 'Food waste', C: 45, N: 2.5, moisture: 75 },
  { name: 'Manure (cattle)', C: 40, N: 2.0, moisture: 80 },
  { name: 'Manure (poultry)', C: 35, N: 4.0, moisture: 60 },
  { name: 'Straw', C: 48, N: 0.5, moisture: 10 },
  { name: 'Wood chips', C: 50, N: 0.2, moisture: 20 },
  { name: 'Coffee grounds', C: 50, N: 2.0, moisture: 60 },
  { name: 'Cardboard (shredded)', C: 45, N: 0.1, moisture: 8 },
  { name: 'Alfalfa hay', C: 45, N: 3.0, moisture: 15 },
];

export function CompostMixerCalculator() {
  const { language } = useTranslation();
  const [feedstocks, setFeedstocks] = useState<Feedstock[]>([
    { id: '1', name: 'Grass clippings', C: 45, N: 3.0, moisture: 80, weight: 50 },
    { id: '2', name: 'Leaves (dry)', C: 48, N: 0.8, moisture: 15, weight: 50 },
  ]);
  const [targetCn, setTargetCn] = useState(30);

  const result = useMemo(() => {
    const totalC = feedstocks.reduce((s, f) => s + f.C * f.weight, 0);
    const totalN = feedstocks.reduce((s, f) => s + f.N * f.weight, 0);
    const totalWeight = feedstocks.reduce((s, f) => s + f.weight, 0);
    const cn = totalN > 0 ? totalC / totalN : 0;
    const avgMoisture = totalWeight > 0 ? feedstocks.reduce((s, f) => s + f.moisture * f.weight, 0) / totalWeight : 0;
    const dryWeight = totalWeight * (1 - avgMoisture / 100);
    const waterToAdd = avgMoisture < 55 ? dryWeight * (0.60 - avgMoisture / 100) / (1 - 0.60) : 0;
    const waterToRemove = avgMoisture > 65 ? totalWeight * (avgMoisture - 0.60) / (1 - 0.60) : 0;
    return { cn, avgMoisture, totalWeight, waterToAdd, waterToRemove, targetMet: cn >= targetCn * 0.85 && cn <= targetCn * 1.15 };
  }, [feedstocks, targetCn]);

  const addFeedstock = () => {
    const f = COMMON_FEEDSTOCKS[feedstocks.length % COMMON_FEEDSTOCKS.length];
    setFeedstocks([...feedstocks, { id: String(Date.now()), ...f, weight: 20 }]);
  };
  const update = (id: string, patch: Partial<Feedstock>) => setFeedstocks(fs => fs.map(f => f.id === id ? { ...f, ...patch } : f));
  const remove = (id: string) => setFeedstocks(fs => fs.filter(f => f.id !== id));

  return (
    <Card className="overflow-hidden border-emerald-100 shadow-sm dark:border-emerald-900/60">
      <CardHeader className="border-b border-border/60 bg-emerald-50/50 pb-4 dark:bg-emerald-950/10">
        <CardTitle className="flex items-center gap-2 text-base"><span className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"><Recycle className="h-4 w-4" /></span> {copyFor(language, 'Compost Mixer Calculator', 'حاسبة خلط الكمبوست')}
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">{copyFor(language, 'C:N ratio · moisture adjustment · 10 common feedstocks · target 30:1', 'نسبة C:N · ضبط الرطوبة · 10 مواد أولية شائعة · الهدف 30:1')}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/30 p-3 sm:flex-row sm:items-center dark:border-emerald-900/60 dark:bg-emerald-950/10">
          <div className="flex items-center gap-2"><Label className="shrink-0 text-xs font-medium">{copyFor(language, 'Target C:N', 'نسبة C:N المستهدفة')}</Label><Input aria-label={copyFor(language, 'Target carbon to nitrogen ratio', 'نسبة الكربون إلى النيتروجين المستهدفة')} value={targetCn} onChange={e => setTargetCn(parseInt(e.target.value) || 30)} type="number" min="15" max="40" className="h-10 w-24 text-sm" /></div>
          <p className="text-xs text-muted-foreground sm:max-w-xs">{copyFor(language, 'Aim for a balanced mix near 30:1 for active decomposition.', 'استهدف خليطاً متوازناً قريباً من 30:1 لتحلل نشط.')}</p>
          <Button size="sm" variant="outline" onClick={addFeedstock} className="h-10 gap-2 px-3 text-sm sm:ml-auto">
            <Plus className="h-4 w-4" /> {copyFor(language, 'Add feedstock', 'إضافة مادة أولية')}
          </Button>
        </div>

        <div className="space-y-1.5">
          {feedstocks.map(f => (
            <div key={f.id} className="flex flex-col gap-2 rounded-xl border bg-background/70 p-3 shadow-sm sm:flex-row sm:items-center">
              <select value={f.name} onChange={e => {
                const preset = COMMON_FEEDSTOCKS.find(c => c.name === e.target.value);
                if (preset) update(f.id, { name: preset.name, C: preset.C, N: preset.N, moisture: preset.moisture });
                else update(f.id, { name: e.target.value });
              }} className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm">
                {COMMON_FEEDSTOCKS.map(c => <option key={c.name} value={c.name}>{feedstockLabel(language, c.name)}</option>)}
              </select>
              <div className="flex items-center gap-2 sm:w-auto"><Input aria-label={copyFor(language, `Weight for ${f.name} in kilograms`, `وزن ${feedstockLabel(language, f.name)} بالكيلوغرام`)} value={f.weight} onChange={e => update(f.id, { weight: parseFloat(e.target.value) || 0 })} type="number" step="1" className="h-10 w-full text-sm sm:w-24" title={copyFor(language, 'Weight (kg)', 'الوزن (كغ)')} /><span className="text-xs text-muted-foreground">{copyFor(language, 'kg', 'كغ')}</span></div>
              <Badge variant="outline" className="w-fit shrink-0 font-mono text-[10px]">{(f.C / f.N).toFixed(0)}:1 C:N</Badge>
              <button type="button" aria-label={copyFor(language, `Remove ${f.name}`, `إزالة ${feedstockLabel(language, f.name)}`)} title={copyFor(language, 'Remove feedstock', 'إزالة المادة الأولية')} onClick={() => remove(f.id)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className={`rounded-xl border p-3 text-center shadow-sm ${result.targetMet ? 'border-emerald-300 bg-emerald-50/40' : 'border-amber-300 bg-amber-50/40'}`}>
            <div className="text-[9px] text-muted-foreground uppercase">{copyFor(language, 'C:N Ratio', 'نسبة C:N')}</div>
            <div className="text-xl font-bold font-mono">{result.cn.toFixed(1)}:1</div>
            <div className="text-[9px] text-muted-foreground">{copyFor(language, 'target', 'الهدف')} {targetCn}:1</div>
          </div>
          <div className="rounded-xl border border-cyan-300 bg-cyan-50/40 p-3 text-center shadow-sm">
            <div className="text-[9px] text-muted-foreground uppercase">{copyFor(language, 'Moisture', 'الرطوبة')}</div>
            <div className="text-xl font-bold font-mono">{result.avgMoisture.toFixed(0)}%</div>
            <div className="text-[9px] text-muted-foreground">{copyFor(language, 'target 55-65%', 'الهدف 55–65%')}</div>
          </div>
          <div className="rounded-xl border border-violet-300 bg-violet-50/40 p-3 text-center shadow-sm">
            <div className="text-[9px] text-muted-foreground uppercase">{copyFor(language, 'Total mass', 'الكتلة الكلية')}</div>
            <div className="text-xl font-bold font-mono">{result.totalWeight.toFixed(0)}</div>
            <div className="text-[9px] text-muted-foreground">{copyFor(language, 'kg', 'كغ')}</div>
          </div>
        </div>

        {/* Recommendations */}
        {result.targetMet ? (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span><strong>{copyFor(language, `C:N ratio is good (${result.cn.toFixed(1)}:1).`, `نسبة C:N جيدة (${result.cn.toFixed(1)}:1).`)}</strong> {copyFor(language, 'Microbes will efficiently decompose. Pile should reach 55-65°C within 3 days.', 'ستحلل الكائنات الدقيقة الخليط بكفاءة. يُفترض أن تصل الكومة إلى 55–65°م خلال 3 أيام.')}</span>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-3 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span><strong>{copyFor(language, 'Adjust feedstock mix.', 'اضبط خليط المواد الأولية.')}</strong> {result.cn > targetCn ? copyFor(language, 'C:N too high — add nitrogen-rich material (grass, manure, food waste).', 'نسبة C:N مرتفعة — أضف مادة غنية بالنيتروجين (العشب أو الروث أو مخلفات الطعام).') : copyFor(language, 'C:N too low — add carbon-rich material (leaves, straw, cardboard).', 'نسبة C:N منخفضة — أضف مادة غنية بالكربون (الأوراق أو القش أو الكرتون).')}</span>
          </div>
        )}

        {result.waterToAdd > 0 && (
          <div className="rounded-xl border border-cyan-200 dark:border-cyan-900 bg-cyan-50/60 dark:bg-cyan-950/20 p-3 text-xs text-cyan-700 dark:text-cyan-300 flex items-start gap-1.5">
            <Droplets className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span><strong>{copyFor(language, `Add ${result.waterToAdd.toFixed(0)} L water`, `أضف ${result.waterToAdd.toFixed(0)} لتر ماء`)}</strong> {copyFor(language, 'to reach 60% moisture. Sprinkle while turning pile for even distribution.', 'للوصول إلى رطوبة 60%. رش الماء أثناء تقليب الكومة لتوزيعه بالتساوي.')}</span>
          </div>
        )}
        {result.waterToRemove > 0 && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-3 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span><strong>{copyFor(language, `Too wet (${result.avgMoisture.toFixed(0)}%).`, `رطبة جداً (${result.avgMoisture.toFixed(0)}%).`)}</strong> {copyFor(language, `Add ${result.waterToRemove.toFixed(0)} kg dry material (straw, cardboard) or turn pile to dry. Anaerobic risk if >70%.`, `أضف ${result.waterToRemove.toFixed(0)} كغ من مادة جافة (القش أو الكرتون) أو قلّب الكومة لتجفيفها. خطر الظروف اللاهوائية إذا تجاوزت الرطوبة 70%.`)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
