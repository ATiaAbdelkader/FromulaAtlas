'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Beef, CheckCircle2, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';

const INGREDIENT_AR: Record<string, string> = { 'Corn grain': 'حبوب الذرة', 'Alfalfa hay': 'دريس البرسيم الحجازي', 'Soybean meal': 'كسب فول الصويا', 'Corn silage': 'سيلاج الذرة', 'Wheat straw': 'قش القمح', 'Barley grain': 'حبوب الشعير', 'Cottonseed meal': 'كسب بذور القطن', 'Mineral mix': 'خليط معدني' };

interface FeedIngredient { id: string; name: string; dm: number; cp: number; tdn: number; ca: number; p: number; weight: number; }
const INGREDIENTS = [
  { name: 'Corn grain', dm: 88, cp: 9.0, tdn: 88, ca: 0.02, p: 0.30 },
  { name: 'Alfalfa hay', dm: 90, cp: 18, tdn: 58, ca: 1.40, p: 0.25 },
  { name: 'Soybean meal', dm: 90, cp: 50, tdn: 84, ca: 0.35, p: 0.70 },
  { name: 'Corn silage', dm: 35, cp: 8.0, tdn: 70, ca: 0.25, p: 0.22 },
  { name: 'Wheat straw', dm: 90, cp: 3.5, tdn: 40, ca: 0.30, p: 0.08 },
  { name: 'Barley grain', dm: 89, cp: 12, tdn: 83, ca: 0.05, p: 0.35 },
  { name: 'Cottonseed meal', dm: 92, cp: 44, tdn: 77, ca: 0.20, p: 1.20 },
  { name: 'Mineral mix', dm: 98, cp: 0, tdn: 0, ca: 18, p: 12 },
];

export function FeedRationBalancer() {
  const { language } = useTranslation();
  const [animalType, setAnimalType] = useState('beef_growing');
  const [bw, setBw] = useState('400');
  const [adg, setAdg] = useState('1.2');
  const [ingredients, setIngredients] = useState<FeedIngredient[]>([
    { id: '1', ...INGREDIENTS[0], weight: 4 },
    { id: '2', ...INGREDIENTS[1], weight: 3 },
    { id: '3', ...INGREDIENTS[3], weight: 8 },
  ]);

  const requirements: Record<string, { dmi: number; cp: number; tdn: number; ca: number; p: number; label: string }> = {
    beef_growing: { dmi: 2.5, cp: 12, tdn: 68, ca: 0.4, p: 0.2, label: copyFor(language, 'Beef growing (400 kg, 1.2 kg ADG)', 'أبقار لحمية نامية (400 كغ، زيادة يومية 1.2 كغ)') },
    beef_maint: { dmi: 2.0, cp: 8, tdn: 55, ca: 0.25, p: 0.15, label: copyFor(language, 'Beef maintenance (500 kg)', 'أبقار لحمية للصيانة (500 كغ)') },
    dairy_lact: { dmi: 3.5, cp: 16, tdn: 70, ca: 0.6, p: 0.35, label: copyFor(language, 'Dairy lactating (600 kg, 25 L)', 'أبقار حلوب (600 كغ، 25 لتر)') },
    dairy_dry: { dmi: 2.0, cp: 11, tdn: 55, ca: 0.4, p: 0.2, label: copyFor(language, 'Dairy dry (600 kg)', 'أبقار جافة (600 كغ)') },
  };

  const result = useMemo(() => {
    const bodyWt = parseFloat(bw);
    const req = requirements[animalType];
    const dmiTarget = bodyWt * req.dmi / 100; // kg DM/day

    const totalWt = ingredients.reduce((s, i) => s + i.weight, 0);
    const totalDM = ingredients.reduce((s, i) => s + i.weight * i.dm / 100, 0);
    const totalCP = ingredients.reduce((s, i) => s + i.weight * i.dm / 100 * i.cp / 100, 0);
    const totalTDN = ingredients.reduce((s, i) => s + i.weight * i.dm / 100 * i.tdn / 100, 0);
    const totalCa = ingredients.reduce((s, i) => s + i.weight * i.dm / 100 * i.ca / 100, 0);
    const totalP = ingredients.reduce((s, i) => s + i.weight * i.dm / 100 * i.p / 100, 0);

    const cpPct = totalDM > 0 ? totalCP / totalDM * 100 : 0;
    const tdnPct = totalDM > 0 ? totalTDN / totalDM * 100 : 0;
    const caPct = totalDM > 0 ? totalCa / totalDM * 100 : 0;
    const pPct = totalDM > 0 ? totalP / totalDM * 100 : 0;

    return {
      dmiTarget, totalWt, totalDM,
      cpPct, tdnPct, caPct, pPct,
      cpMet: cpPct >= req.cp, tdnMet: tdnPct >= req.tdn,
      caMet: caPct >= req.ca, pMet: pPct >= req.p,
      dmiMet: totalDM >= dmiTarget * 0.95,
      req,
    };
  }, [animalType, bw, ingredients]);

  const addIngredient = () => {
    const ing = INGREDIENTS[ingredients.length % INGREDIENTS.length];
    setIngredients([...ingredients, { id: String(Date.now()), ...ing, weight: 1 }]);
  };
  const update = (id: string, patch: Partial<FeedIngredient>) => setIngredients(fs => fs.map(f => f.id === id ? { ...f, ...patch } : f));
  const remove = (id: string) => setIngredients(fs => fs.filter(f => f.id !== id));

  return (
    <Card className="overflow-hidden border-amber-100 shadow-sm dark:border-amber-900/60">
      <CardHeader className="border-b border-border/60 bg-amber-50/50 pb-4 dark:bg-amber-950/10">
        <CardTitle className="flex items-center gap-2 text-base"><span className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"><Beef className="h-4 w-4" /></span> {copyFor(language, 'Feed Ration Balancer (NRC 2021)', 'موازن عليقة التغذية (NRC 2021)')}</CardTitle>
        <p className="text-[10px] text-muted-foreground">{copyFor(language, 'DMI · CP · TDN · Ca · P balancing — 8 common ingredients · 4 animal types', 'موازنة DMI · CP · TDN · Ca · P — 8 مكونات شائعة · 4 أنواع من الحيوانات')}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-amber-200/70 bg-amber-50/30 p-3 sm:grid-cols-3 dark:border-amber-900/60 dark:bg-amber-950/10">
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Animal type', 'نوع الحيوان')}</Label>
            <select aria-label={copyFor(language, 'Animal type', 'نوع الحيوان')} value={animalType} onChange={e => setAnimalType(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              {Object.entries(requirements).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Body weight (kg)', 'وزن الجسم (كغ)')}</Label>
            <Input aria-label={copyFor(language, 'Animal body weight', 'وزن جسم الحيوان')} value={bw} onChange={e => setBw(e.target.value)} type="number" step="10" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'ADG (kg/day)', 'الزيادة اليومية (كغ/يوم)')}</Label>
            <Input aria-label={copyFor(language, 'Average daily gain', 'متوسط الزيادة اليومية')} value={adg} onChange={e => setAdg(e.target.value)} type="number" step="0.1" className="mt-1 h-10 text-sm" />
          </div>
        </div>

        <div className="space-y-1">
          {ingredients.map(i => (
            <div key={i.id} className="flex flex-col gap-2 rounded-xl border bg-background/70 p-3 shadow-sm sm:grid sm:grid-cols-[minmax(0,1fr)_120px_auto] sm:items-end">
              <div><Label className="text-[11px] font-medium">{copyFor(language, 'Ingredient', 'المكوّن')}</Label><select aria-label={copyFor(language, `Ingredient ${ingredients.indexOf(i) + 1}`, `المكوّن ${ingredients.indexOf(i) + 1}`)} value={i.name} onChange={e => { const ing = INGREDIENTS.find(x => x.name === e.target.value); if (ing) update(i.id, { ...ing }); }} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {INGREDIENTS.map(x => <option key={x.name} value={x.name}>{copyFor(language, x.name, INGREDIENT_AR[x.name])}</option>)}
              </select></div>
              <div><Label className="text-[11px] font-medium">{copyFor(language, 'As-fed (kg)', 'العلف المقدم (كغ)')}</Label><Input aria-label={copyFor(language, `As-fed kilograms for ingredient ${ingredients.indexOf(i) + 1}`, `كيلوغرامات العلف المقدم للمكوّن ${ingredients.indexOf(i) + 1}`)} value={i.weight} onChange={e => update(i.id, { weight: parseFloat(e.target.value) || 0 })} type="number" step="0.5" className="mt-1 h-10 text-sm" /></div>
              <button type="button" aria-label={copyFor(language, `Remove ${i.name}`, `إزالة ${INGREDIENT_AR[i.name] || i.name}`)} onClick={() => remove(i.id)} className="inline-flex h-10 w-10 items-center justify-center rounded-md text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addIngredient} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50">
          <Plus className="h-4 w-4" /> {copyFor(language, 'Add ingredient', 'إضافة مكوّن')}
        </button>

        {result && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
              <NutrientBar label={copyFor(language, 'DMI', 'مدخول المادة الجافة')} actual={result.totalDM.toFixed(1)} target={result.dmiTarget.toFixed(1)} unit="kg" met={result.dmiMet} />
              <NutrientBar label={copyFor(language, 'CP', 'البروتين الخام')} actual={result.cpPct.toFixed(1)} target={result.req.cp.toFixed(1)} unit="%" met={result.cpMet} />
              <NutrientBar label={copyFor(language, 'TDN', 'المغذيات الكلية المهضومة')} actual={result.tdnPct.toFixed(1)} target={result.req.tdn.toFixed(1)} unit="%" met={result.tdnMet} />
              <NutrientBar label={copyFor(language, 'Ca', 'الكالسيوم')} actual={result.caPct.toFixed(2)} target={result.req.ca.toFixed(2)} unit="%" met={result.caMet} />
              <NutrientBar label={copyFor(language, 'P', 'الفوسفور')} actual={result.pPct.toFixed(2)} target={result.req.p.toFixed(2)} unit="%" met={result.pMet} />
            </div>

            {!result.dmiMet || !result.cpMet || !result.tdnMet ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
                <strong>{copyFor(language, 'Deficient:', 'ناقص:')}</strong> {!result.dmiMet && ` ${copyFor(language, 'DMI', 'مدخول المادة الجافة')}`} {!result.cpMet && ` ${copyFor(language, 'CP', 'البروتين الخام')}`} {!result.tdnMet && ` ${copyFor(language, 'TDN', 'المغذيات الكلية المهضومة')}`} {!result.caMet && ` ${copyFor(language, 'Ca', 'الكالسيوم')}`} {!result.pMet && ` ${copyFor(language, 'P', 'الفوسفور')}`}. {copyFor(language, 'Add ingredients to meet requirements.', 'أضف مكونات لاستيفاء المتطلبات.')}
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs leading-relaxed text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>{copyFor(language, 'Ration balanced.', 'العليقة متوازنة.')}</strong> {copyFor(language, `All nutrients meet ${result.req.label} requirements.`, `جميع المغذيات تستوفي متطلبات ${result.req.label}.`)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NutrientBar({ label, actual, target, unit, met }: { label: string; actual: string; target: string; unit: string; met: boolean }) {
  return (
      <div className={`rounded-xl border p-3 shadow-sm ${met ? 'border-emerald-300 bg-emerald-50/40' : 'border-rose-300 bg-rose-50/40'}`}>
      <div className="text-[8px] text-muted-foreground uppercase">{label}</div>
      <div className="font-mono text-[11px] font-bold">{actual}</div>
      <div className="text-[8px] text-muted-foreground">/{target}{unit}</div>
      <div className={`text-[8px] ${met ? 'text-emerald-600' : 'text-rose-600'}`}>{met ? '✓' : '✗'}</div>
    </div>
  );
}
