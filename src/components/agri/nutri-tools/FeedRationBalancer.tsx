'use client';

import { useState, useMemo } from 'react';
import { Beef, Calculator, Sparkles, Copy, RotateCcw, CheckCircle2, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  CalculatorShell,
  type TrilingualString,
  type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

const TITLE: TrilingualString = {
  en: 'Feed Ration Balancer (NRC 2021)',
  ar: 'موازن علقة التغذية (NRC 2021)',
  fr: 'Équilibreur de Ration (NRC 2021)',
};

const DESC: TrilingualString = {
  en: 'DMI · CP · TDN · Ca · P balancing — 8 common ingredients · 4 animal types',
  ar: 'موازنة DMI · CP · TDN · Ca · P — 8 مكونات شائعة · 4 أنواع من الحيوانات',
  fr: 'Équilibre DMI · CP · TDN · Ca · P — 8 ingrédients courants · 4 types d’animaux',
};

const PILL_LABEL: TrilingualString = {
  en: 'Animal type:',
  ar: 'نوع الحيوان:',
  fr: 'Type d’animal :',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'NRC 2021 Nutrient Requirements of Beef Cattle. Values are guidelines — adjust for breed, environment, and forage quality. Always provide ad libitum mineral and clean water.',
  ar: 'متطلبات المغذيات NRC 2021 للأبقار اللحمية. القيم إرشادية — عدّلها حسب السلالة والبيئة وجودة الأعلاف. وفّر دائماً الملح المعدني والماء النظيف بإطلاق.',
  fr: 'NRC 2021 — Besoins nutritionnels des bovins viande. Valeurs indicatives — ajuster selon race, environnement et qualité du fourrage. Apport libre en minéral et eau propre.',
};

const INGREDIENT_AR: Record<string, string> = { 'Corn grain': 'حبوب الذرة', 'Alfalfa hay': 'دريس البرسيم الحجازي', 'Soybean meal': 'كسب فول الصويا', 'Corn silage': 'سيلاج الذرة', 'Wheat straw': 'قش القمح', 'Barley grain': 'حبوب الشعير', 'Cottonseed meal': 'كسب بذور القطن', 'Mineral mix': 'خليط معدني' };
const INGREDIENT_FR: Record<string, string> = { 'Corn grain': 'Grain de maïs', 'Alfalfa hay': 'Foin de luzerne', 'Soybean meal': 'Tourteau de soja', 'Corn silage': 'Ensilage maïs', 'Wheat straw': 'Paille de blé', 'Barley grain': 'Grain d’orge', 'Cottonseed meal': 'Tourteau coton', 'Mineral mix': 'Mélange minéral' };

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

const ANIMAL_LABELS: Record<string, TrilingualString> = {
  beef_growing: { en: 'Beef growing (400 kg, 1.2 kg ADG)', ar: 'أبقار لحمية نامية (400 كغ، 1.2 كغ ADG)', fr: 'Bovin viande croissance (400 kg, 1.2 kg GMQ)' },
  beef_maint:   { en: 'Beef maintenance (500 kg)',         ar: 'أبقار لحمية للصيانة (500 كغ)',         fr: 'Bovin viande entretien (500 kg)' },
  dairy_lact:   { en: 'Dairy lactating (600 kg, 25 L)',    ar: 'أبقار حلوب (600 كغ، 25 لتر)',         fr: 'Bovin laitier lactation (600 kg, 25 L)' },
  dairy_dry:    { en: 'Dairy dry (600 kg)',                ar: 'أبقار جافة (600 كغ)',                 fr: 'Bovin laitier tarie (600 kg)' },
};

const REQUIREMENTS: Record<string, { dmi: number; cp: number; tdn: number; ca: number; p: number }> = {
  beef_growing: { dmi: 2.5, cp: 12, tdn: 68, ca: 0.4, p: 0.2 },
  beef_maint:   { dmi: 2.0, cp: 8,  tdn: 55, ca: 0.25, p: 0.15 },
  dairy_lact:   { dmi: 3.5, cp: 16, tdn: 70, ca: 0.6, p: 0.35 },
  dairy_dry:    { dmi: 2.0, cp: 11, tdn: 55, ca: 0.4, p: 0.2 },
};

export function FeedRationBalancer() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [animalType, setAnimalType] = useState('beef_growing');
  const [bw, setBw] = useState('400');
  const [adg, setAdg] = useState('1.2');
  const [ingredients, setIngredients] = useState<FeedIngredient[]>([
    { id: '1', ...INGREDIENTS[0], weight: 4 },
    { id: '2', ...INGREDIENTS[1], weight: 3 },
    { id: '3', ...INGREDIENTS[3], weight: 8 },
  ]);
  const [copied, setCopied] = useState<boolean>(false);

  const result = useMemo(() => {
    const bodyWt = parseFloat(bw);
    const req = REQUIREMENTS[animalType];
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

  const handleReset = () => {
    setAnimalType('beef_growing');
    setBw('400');
    setAdg('1.2');
    setIngredients([
      { id: '1', ...INGREDIENTS[0], weight: 4 },
      { id: '2', ...INGREDIENTS[1], weight: 3 },
      { id: '3', ...INGREDIENTS[3], weight: 8 },
    ]);
    toast({
      title: tr('Reset to Defaults', 'تمت استعادة القيم الافتراضية', 'Valeurs par défaut rétablies'),
    });
  };

  const handleCopySummary = () => {
    if (!result) return;
    const animalLabel = ANIMAL_LABELS[animalType];
    const text = `
=== FEED RATION BALANCE (NRC 2021) ===
Animal: ${tr(animalLabel.en, animalLabel.ar, animalLabel.fr)}
Body weight: ${bw} kg · ADG: ${adg} kg/d

Ingredients (as-fed kg):
${ingredients.map(i => `• ${tr(i.name, INGREDIENT_AR[i.name], INGREDIENT_FR[i.name])} — ${i.weight} kg`).join('\n')}

Nutrient Balance:
• DMI: ${result.totalDM.toFixed(1)} / ${result.dmiTarget.toFixed(1)} kg ${result.dmiMet ? '✓' : '✗'}
• CP:  ${result.cpPct.toFixed(1)} / ${result.req.cp.toFixed(1)} % ${result.cpMet ? '✓' : '✗'}
• TDN: ${result.tdnPct.toFixed(1)} / ${result.req.tdn.toFixed(1)} % ${result.tdnMet ? '✓' : '✗'}
• Ca:  ${result.caPct.toFixed(2)} / ${result.req.ca.toFixed(2)} % ${result.caMet ? '✓' : '✗'}
• P:   ${result.pPct.toFixed(2)} / ${result.req.p.toFixed(2)} % ${result.pMet ? '✓' : '✗'}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: tr('Summary Copied!', 'تم نسخ التقرير!', 'Résumé copié !'),
      description: tr('Feed ration balance copied to clipboard.', 'تم نسخ تقرير موازنة العلقة إلى الحافظة.', 'Rapport copié dans le presse-papiers.'),
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const pills: CalculatorPill[] = Object.entries(ANIMAL_LABELS).map(([k, label]) => ({
    key: k,
    label: tr(label.en, label.ar, label.fr),
  }));

  const activeAnimalLabel = ANIMAL_LABELS[animalType];

  return (
    <CalculatorShell
      icon={Beef}
      title={TITLE}
      description={DESC}
      badge="Livestock"
      accent="amber"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
          onClick: handleCopySummary,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset Defaults', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      pills={pills}
      activePill={animalType}
      onPillClick={(k) => setAnimalType(k)}
      pillLabel={PILL_LABEL}
      protocolNote={PROTOCOL_NOTE}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-amber-600" />
              {tr('Ration Ingredients', 'مكونات العلقة', 'Ingrédients de la ration')}
            </span>
            <span className="text-xs font-bold bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 rounded-lg px-2 py-0.5">
              {tr(activeAnimalLabel.en, activeAnimalLabel.ar, activeAnimalLabel.fr)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CalculatorShell.InputField
              label={tr('Body weight (kg)', 'وزن الجسم (كغ)', 'Poids vif (kg)')}
              value={bw}
              onChange={setBw}
              step="10"
              helper={tr('Live weight of the animal', 'الوزن الحي للحيوان', 'Poids vif de l’animal')}
            />
            <CalculatorShell.InputField
              label={tr('ADG (kg/day)', 'الزيادة اليومية (كغ/يوم)', 'GMQ (kg/j)')}
              value={adg}
              onChange={setAdg}
              step="0.1"
              helper={tr('Average daily gain target', 'متوسط الزيادة اليومية المستهدفة', 'Gain moyen quotidien cible')}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                {tr('Ingredients', 'المكونات', 'Ingrédients')}
              </span>
              <span className="text-xs text-muted-foreground">
                {ingredients.length} {tr('items', 'عنصر', 'ingrédients')}
              </span>
            </div>
            {ingredients.map(i => (
              <div key={i.id} className="flex flex-col gap-2 rounded-xl border bg-background/70 p-3 shadow-sm sm:grid sm:grid-cols-[minmax(0,1fr)_120px_auto] sm:items-end">
                <div>
                  <Label className="text-[11px] font-medium">{tr('Ingredient', 'المكوّن', 'Ingrédient')}</Label>
                  <select
                    aria-label={tr(`Ingredient ${ingredients.indexOf(i) + 1}`, `المكوّن ${ingredients.indexOf(i) + 1}`, `Ingrédient ${ingredients.indexOf(i) + 1}`)}
                    value={i.name}
                    onChange={e => { const ing = INGREDIENTS.find(x => x.name === e.target.value); if (ing) update(i.id, { ...ing }); }}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                  >
                    {INGREDIENTS.map(x => <option key={x.name} value={x.name}>{tr(x.name, INGREDIENT_AR[x.name], INGREDIENT_FR[x.name])}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-[11px] font-medium">{tr('As-fed (kg)', 'العلف المقدم (كغ)', 'Brut (kg)')}</Label>
                  <Input
                    aria-label={tr(`As-fed kilograms for ingredient ${ingredients.indexOf(i) + 1}`, `كيلوغرامات العلف المقدم للمكوّن ${ingredients.indexOf(i) + 1}`, `Quantité brute ingrédient ${ingredients.indexOf(i) + 1}`)}
                    value={i.weight}
                    onChange={e => update(i.id, { weight: parseFloat(e.target.value) || 0 })}
                    type="number"
                    step="0.5"
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <button
                  type="button"
                  aria-label={tr(`Remove ${i.name}`, `إزالة ${INGREDIENT_AR[i.name] || i.name}`, `Retirer ${INGREDIENT_FR[i.name] || i.name}`)}
                  onClick={() => remove(i.id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addIngredient}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50"
            >
              <Plus className="h-4 w-4" /> {tr('Add ingredient', 'إضافة مكوّن', 'Ajouter un ingrédient')}
            </button>
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
          <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-amber-50 via-transparent to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
            <span className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              {tr('Nutrient Balance', 'موازنة المغذيات', 'Équilibre nutritionnel')}
            </span>
            {result && (
              <span className="font-mono text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 rounded-lg px-2 py-0.5">
                {result.totalDM.toFixed(1)} kg DM
              </span>
            )}
          </div>

          {result && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <NutrientBar
                  label={tr('DMI', 'مدخول المادة الجافة', 'DMI')}
                  actual={result.totalDM.toFixed(1)}
                  target={result.dmiTarget.toFixed(1)}
                  unit="kg"
                  met={result.dmiMet}
                />
                <NutrientBar
                  label={tr('CP', 'البروتين الخام', 'PB')}
                  actual={result.cpPct.toFixed(1)}
                  target={result.req.cp.toFixed(1)}
                  unit="%"
                  met={result.cpMet}
                />
                <NutrientBar
                  label={tr('TDN', 'المغذيات الكلية', 'TDN')}
                  actual={result.tdnPct.toFixed(1)}
                  target={result.req.tdn.toFixed(1)}
                  unit="%"
                  met={result.tdnMet}
                />
                <NutrientBar
                  label={tr('Ca', 'الكالسيوم', 'Ca')}
                  actual={result.caPct.toFixed(2)}
                  target={result.req.ca.toFixed(2)}
                  unit="%"
                  met={result.caMet}
                />
                <NutrientBar
                  label={tr('P', 'الفوسفور', 'P')}
                  actual={result.pPct.toFixed(2)}
                  target={result.req.p.toFixed(2)}
                  unit="%"
                  met={result.pMet}
                />
              </div>

              {!result.dmiMet || !result.cpMet || !result.tdnMet ? (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    <strong>{tr('Deficient:', 'ناقص:', 'Déficient :')}</strong>{' '}
                    {!result.dmiMet && ` ${tr('DMI', 'مدخول المادة الجافة', 'DMI')}`}
                    {!result.cpMet && ` ${tr('CP', 'البروتين الخام', 'PB')}`}
                    {!result.tdnMet && ` ${tr('TDN', 'المغذيات الكلية', 'TDN')}`}
                    {!result.caMet && ` ${tr('Ca', 'الكالسيوم', 'Ca')}`}
                    {!result.pMet && ` ${tr('P', 'الفوسفور', 'P')}`}.{' '}
                    {tr('Add ingredients to meet requirements.', 'أضف مكونات لاستيفاء المتطلبات.', 'Ajoutez des ingrédients pour atteindre les besoins.')}
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs leading-relaxed text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    <strong>{tr('Ration balanced.', 'العليقة متوازنة.', 'Ration équilibrée.')}</strong>{' '}
                    {tr(
                      `All nutrients meet ${tr(activeAnimalLabel.en, activeAnimalLabel.ar, activeAnimalLabel.fr)} requirements.`,
                      `جميع المغذيات تستوفي متطلبات ${tr(activeAnimalLabel.en, activeAnimalLabel.ar, activeAnimalLabel.fr)}.`,
                      `Tous les nutriments couvrent les besoins ${tr(activeAnimalLabel.en, activeAnimalLabel.ar, activeAnimalLabel.fr)}.`,
                    )}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}

function NutrientBar({ label, actual, target, unit, met }: { label: string; actual: string; target: string; unit: string; met: boolean }) {
  return (
    <div className={`p-4 rounded-xl border space-y-1 ${met ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30' : 'border-rose-200 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/30'}`}>
      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-black font-mono ${met ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
        {actual}
        <span className="text-sm font-normal text-muted-foreground ms-1">{unit}</span>
      </div>
      <div className="text-[10px] text-muted-foreground">
        {met ? '✓' : '✗'} /{target}{unit}
      </div>
    </div>
  );
}
