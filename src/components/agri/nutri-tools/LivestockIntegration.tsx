'use client';

import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Beef, Wheat, Recycle, Calendar, Plus, Trash2, CheckCircle2,
  DollarSign, Milk, Copy, RotateCcw,
} from 'lucide-react';
import {
  FEED_INGREDIENTS, computeRation, pastureCapacity, manureValue, grazingPlan, MANURE_TYPES,
  type RationLine,
} from '@/lib/livestock-data';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString, type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

type UiLanguage = Parameters<typeof copyFor>[0];
const FEED_AR: Record<string, string> = { corn_silage: 'سيلاج الذرة', alfalfa_hay: 'دريس البرسيم الحجازي', grass_hay: 'دريس الأعشاب', corn_grain: 'حبوب الذرة', soybean_meal: 'كسب فول الصويا', barley_grain: 'حبوب الشعير', wheat_bran: 'نخالة القمح', molasses: 'دبس السكر', mineral_mix: 'خليط معدني' };
const ANIMAL_AR: Record<string, string> = { dairy_lactating: 'أبقار حلوب', dairy_dry: 'أبقار جافة', beef_growing: 'أبقار لحمية نامية', beef_finishing: 'أبقار لحمية للتسمين' };
const MANURE_AR: Record<string, string> = { dairy_solid: 'روث صلب للأبقار الحلوب', dairy_liquid: 'روث سائل للأبقار الحلوب', beef_solid: 'روث صلب للأبقار اللحمية', poultry_litter: 'فرشة دواجن', swine_solid: 'روث خنازير صلب', sheep_solid: 'روث أغنام صلب', horse_solid: 'روث خيول صلب', compost: 'كمبوست' };

function livestockWarning(language: UiLanguage, message: string): string {
  if (language !== 'ar') return message;
  return message
    .replace(/⚠️ Energy low: (.+) Mcal\/kg DM vs (.+) required — add corn grain or fat\./, '⚠️ الطاقة منخفضة: $1 ميغاكالوري/كغ مادة جافة مقابل $2 مطلوب. أضف حبوب الذرة أو الدهون.')
    .replace(/⚠️ Protein low: (.+)% CP vs (.+)% required — add soybean meal\./, '⚠️ البروتين منخفض: $1% بروتين خام مقابل $2% مطلوب. أضف كسب فول الصويا.')
    .replace(/⚠️ Fiber high: (.+)% NDF vs max (.+)% — reduce forage, increase grain\./, '⚠️ الألياف مرتفعة: $1% NDF مقابل حد أقصى $2%. قلل العلف الخشن وزد الحبوب.')
    .replace('⚠️ Calcium low — add mineral mix or limestone.', '⚠️ الكالسيوم منخفض — أضف خليطاً معدنياً أو الحجر الجيري.')
    .replace('⚠️ Phosphorus low — add mineral mix or dicalcium phosphate.', '⚠️ الفوسفور منخفض — أضف خليطاً معدنياً أو فوسفات ثنائي الكالسيوم.')
    .replace('⚠️ Utilization >60% risks overgrazing and pasture degradation.', '⚠️ الاستغلال فوق 60% يعرّض المرعى للرعي الجائر والتدهور.')
    .replace(/Low carrying capacity \((.+) AU\/ha\) — consider improving forage quality or reducing stock\./, 'قدرة استيعاب منخفضة ($1 وحدة حيوانية/هكتار) — حسّن جودة العلف أو قلل عدد الحيوانات.')
    .replace('High carrying capacity — ensure rotational grazing to prevent selective overgrazing.', 'قدرة استيعاب مرتفعة — طبّق الرعي الدوراني لمنع الرعي الجائر الانتقائي.');
}

function livestockRecommendation(language: UiLanguage, message: string): string {
  if (language !== 'ar') return message;
  return message
    .replace(/💰 Your manure is worth \$(.+)\/year — significant fertilizer savings!/, '💰 قيمة الروث $1$/سنة — وفر كبير في تكاليف الأسمدة!')
    .replace('Apply manure to fields with low P and K soil test levels for maximum value.', 'طبّق الروث في الحقول ذات المستويات المنخفضة من P وK في اختبار التربة لتحقيق أعلى قيمة.')
    .replace('Incorporate within 24h to reduce N volatilization (saves 20-30% of N).', 'ادمج الروث خلال 24 ساعة لتقليل تطاير N (يوفر 20–30% من N).')
    .replace('Poultry litter has high P — apply at P-based rate, supplement N with urea.', 'فرشة الدواجن غنية بـ P — طبّقها وفق معدل قائم على P واستكمل N باليوريا.')
    .replace(/Consider more paddocks \(8-12\) for better rest and forage utilization\./, 'فكّر في زيادة عدد الحواشِ (8–12) لتحسين الراحة واستغلال العلف.')
    .replace(/Grazing (.+) days per paddock — animals may re-graze regrowth\. Reduce paddock size or increase paddock count\./, 'الرعي $1 أيام لكل حوش — قد تعاود الحيوانات رعي النمو الجديد. قلل مساحة الحوش أو زد عدد الحواشي.')
    .replace(/Only (.+) grazing cycles — consider increasing fertility or reducing herd size\./, 'فقط $1 دورات رعي — فكّر في زيادة الخصوبة أو تقليل حجم القطيع.')
    .replace(/Move animals every (.+) day\(s\)\. Each paddock rests (.+) days between grazings\./, 'انقل الحيوانات كل $1 يوم. تستريح كل حوشة $2 يوماً بين فترات الرعي.')
    .replace(/Target: (.+) complete cycles per (.+)-day season\./, 'الهدف: $1 دورات كاملة في موسم مدته $2 يوماً.');
}

const TITLE: TrilingualString = {
  en: 'Livestock Management Suite',
  ar: 'إدارة الثروة الحيوانية',
  fr: 'Gestion du Bétail',
};

const DESC: TrilingualString = {
  en: 'Feed ration balancing (NRC), pasture carrying capacity, manure nutrient value, and rotational grazing scheduling. 4 tools in one.',
  ar: 'موازنة عليقة التغذية (NRC)، قدرة استيعاب المرعى، قيمة مغذيات الروث، وجدولة الرعي الدوراني. 4 أدوات في واحدة.',
  fr: 'Équilibrage de ration (NRC), capacité de charge du pâturage, valeur nutritive du fumier et planification du pâturage tournant. 4 outils.',
};

const PILL_LABEL: TrilingualString = { en: 'Tool:', ar: 'الأداة:', fr: 'Outil :' };

type Tab = 'ration' | 'pasture' | 'manure' | 'grazing';

export function LivestockIntegration() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);
  const [tab, setTab] = useState<Tab>('ration');
  const [copied, setCopied] = useState(false);

  // Refs let the active sub-calculator expose its summary + reset to the hero buttons.
  const summaryRef = useRef('');
  const resetRef = useRef<(() => void) | null>(null);

  const pills: CalculatorPill[] = [
    { key: 'ration', emoji: '🌾', label: tr('Feed Ration', 'عليقة التغذية', 'Ration') },
    { key: 'pasture', emoji: '🐄', label: tr('Pasture', 'المرعى', 'Pâturage') },
    { key: 'manure', emoji: '♻️', label: tr('Manure Value', 'قيمة الروث', 'Valeur fumier') },
    { key: 'grazing', emoji: '📅', label: tr('Grazing', 'الرعي', 'Rotation') },
  ];

  const handleCopy = () => {
    const text = summaryRef.current;
    if (!text) {
      toast({ title: tr('No results to copy yet.', 'لا توجد نتائج للنسخ.', 'Aucun résultat à copier.') });
      return;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleReset = () => {
    resetRef.current?.();
    toast({ title: tr('Reset to defaults', 'تمت إعادة التعيين', 'Réinitialisé') });
  };

  return (
    <CalculatorShell
      icon={Beef}
      title={TITLE}
      description={DESC}
      badge={tr('NRC-based', 'أساس NRC', 'Basé NRC')}
      accent="amber"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ الملخص', fr: 'Copier' },
          onClick: handleCopy,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      pills={pills}
      activePill={tab}
      onPillClick={(k) => setTab(k as Tab)}
      pillLabel={PILL_LABEL}
    >
      {tab === 'ration' && <FeedRationCalculator language={language} summaryRef={summaryRef} resetRef={resetRef} />}
      {tab === 'pasture' && <PastureCalculator language={language} summaryRef={summaryRef} resetRef={resetRef} />}
      {tab === 'manure' && <ManureCalculator language={language} summaryRef={summaryRef} resetRef={resetRef} />}
      {tab === 'grazing' && <GrazingScheduler language={language} summaryRef={summaryRef} resetRef={resetRef} />}
    </CalculatorShell>
  );
}

// ============================================================================
// 1. FEED RATION CALCULATOR
// ============================================================================

const DEFAULT_RATION_LINES: RationLine[] = [
  { ingredientId: 'corn_silage', kgAsFed: 20 },
  { ingredientId: 'alfalfa_hay', kgAsFed: 5 },
  { ingredientId: 'corn_grain', kgAsFed: 5 },
  { ingredientId: 'soybean_meal', kgAsFed: 3 },
  { ingredientId: 'mineral_mix', kgAsFed: 0.2 },
];

function FeedRationCalculator({ language, summaryRef, resetRef }: { language: UiLanguage; summaryRef: MutableRefObject<string>; resetRef: MutableRefObject<(() => void) | null> }) {
  const tr = (en: string, ar: string) => copyFor(language, en, ar);
  const [lines, setLines] = useState<RationLine[]>(DEFAULT_RATION_LINES.map(l => ({ ...l })));
  const [animalType, setAnimalType] = useState<'dairy_lactating' | 'dairy_dry' | 'beef_growing' | 'beef_finishing'>('dairy_lactating');

  const result = useMemo(() => computeRation(lines, animalType), [lines, animalType]);

  const updateLine = (i: number, field: keyof RationLine, value: string | number) => {
    const newLines = [...lines];
    newLines[i] = { ...newLines[i], [field]: value };
    setLines(newLines);
  };
  const addLine = () => setLines([...lines, { ingredientId: 'corn_grain', kgAsFed: 1 }]);
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));

  // Expose summary + reset to the parent hero buttons.
  summaryRef.current = [
    '=== FEED RATION ===',
    `Animal type: ${tr(animalType.replace(/_/g, ' '), ANIMAL_AR[animalType] || animalType.replace(/_/g, ' '))}`,
    `DM intake: ${result.totalKgDM.toFixed(1)} kg`,
    `NEL: ${result.nel_Mcal_kgDM.toFixed(2)} Mcal/kg`,
    `CP: ${result.cpPctDM.toFixed(1)}% DM`,
    `NDF: ${result.ndfPctDM.toFixed(1)}%`,
    `Ca: ${((result.totalCa_kg / Math.max(result.totalKgDM, 1)) * 100).toFixed(2)}%`,
    `P: ${((result.totalP_kg / Math.max(result.totalKgDM, 1)) * 100).toFixed(2)}%`,
    `Cost/day: $${result.costPerDay.toFixed(2)}`,
    '',
    `Warnings (${result.warnings.length}):`,
    ...result.warnings.map(w => `- ${livestockWarning(language, w)}`),
  ].join('\n');
  resetRef.current = () => {
    setLines(DEFAULT_RATION_LINES.map(l => ({ ...l })));
    setAnimalType('dairy_lactating');
  };

  return (
    <div className="lg:col-span-12 space-y-4">
      <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <span className="text-base font-bold flex items-center gap-2">
            <Wheat className="h-4 w-4 text-amber-600" />
            {tr('Feed Ration', 'عليقة التغذية')}
          </span>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-amber-200/70 bg-amber-50/30 p-3 sm:flex-row sm:items-center dark:border-amber-900/60 dark:bg-amber-950/10">
          <Label className="text-xs font-semibold whitespace-nowrap">{tr('Animal type', 'نوع الحيوان')}</Label>
          <Select value={animalType} onValueChange={v => setAnimalType(v as typeof animalType)}>
            <SelectTrigger className="h-10 w-full text-sm sm:w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="dairy_lactating"><Milk className="h-3 w-3 inline mr-1" />{tr('Dairy Lactating', 'أبقار حلوب')}</SelectItem>
              <SelectItem value="dairy_dry">{tr('Dairy Dry', 'أبقار جافة')}</SelectItem>
              <SelectItem value="beef_growing"><Beef className="h-3 w-3 inline mr-1" />{tr('Beef Growing', 'أبقار لحمية نامية')}</SelectItem>
              <SelectItem value="beef_finishing">{tr('Beef Finishing', 'أبقار لحمية للتسمين')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ingredients */}
        <div className="space-y-1.5">
          {lines.map((line, i) => {
            return (
              <div key={i} className="flex flex-col gap-2 rounded-xl border bg-background/70 p-3 shadow-sm sm:grid sm:grid-cols-[minmax(0,1fr)_110px_auto] sm:items-center">
                <Select value={line.ingredientId} onValueChange={v => updateLine(i, 'ingredientId', v)}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FEED_INGREDIENTS.map(x => <SelectItem key={x.id} value={x.id}>{x.emoji} {tr(x.name, FEED_AR[x.id])}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input aria-label={tr(`Kilograms as fed for ingredient ${i + 1}`, `كيلوغرامات العلف المقدم للمكوّن ${i + 1}`)} type="number" value={line.kgAsFed} onChange={e => updateLine(i, 'kgAsFed', parseFloat(e.target.value) || 0)} step="0.5" className="h-10 text-sm" />
                <button type="button" aria-label={tr('Remove ingredient', 'إزالة المكوّن')} onClick={() => removeLine(i)} className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            );
          })}
          <Button size="sm" variant="outline" onClick={addLine} className="h-10 w-full gap-2 text-sm"><Plus className="h-4 w-4" /> {tr('Add ingredient', 'إضافة مكوّن')}</Button>
        </div>

        {result.warnings.length > 0 && (
          <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50/50 p-3 dark:bg-amber-950/20">
            {result.warnings.map((w, i) => <div key={i} className="text-xs text-amber-700 dark:text-amber-400">{livestockWarning(language, w)}</div>)}
          </div>
        )}
        {result.warnings.length === 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> {tr(`Ration meets all NRC requirements for ${animalType.replace(/_/g, ' ')}.`, `العليقة تستوفي جميع متطلبات NRC لـ${ANIMAL_AR[animalType] || animalType}.`)}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 2. PASTURE CARRYING CAPACITY
// ============================================================================

function PastureCalculator({ language, summaryRef, resetRef }: { language: UiLanguage; summaryRef: MutableRefObject<string>; resetRef: MutableRefObject<(() => void) | null> }) {
  const tr = (en: string, ar: string) => copyFor(language, en, ar);
  const [areaHa, setAreaHa] = useState('50');
  const [forageYield, setForageYield] = useState('5000');
  const [utilization, setUtilization] = useState('50');
  const [animalWeight, setAnimalWeight] = useState('500');
  const [intakePct, setIntakePct] = useState('2.5');
  const [seasonDays, setSeasonDays] = useState('180');

  const result = useMemo(() => pastureCapacity({
    areaHa: parseFloat(areaHa) || 0,
    forageYield_kgDM_ha: parseFloat(forageYield) || 0,
    utilizationRate: parseFloat(utilization) || 50,
    animalWeight_kg: parseFloat(animalWeight) || 500,
    intakePctBW: parseFloat(intakePct) || 2.5,
    grazingSeasonDays: parseFloat(seasonDays) || 180,
  }), [areaHa, forageYield, utilization, animalWeight, intakePct, seasonDays]);

  summaryRef.current = [
    '=== PASTURE CARRYING CAPACITY ===',
    `Area: ${areaHa} ha`,
    `Forage yield: ${forageYield} kg DM/ha`,
    `Utilization: ${utilization}%`,
    `Animal weight: ${animalWeight} kg`,
    `Intake: ${intakePct}% BW`,
    `Season: ${seasonDays} days`,
    '',
    `Carrying capacity: ${result.carryingCapacity} AU/ha`,
    `Total AU: ${result.totalAU}`,
    `Recommended stocking: ${result.recommendedStocking}`,
    `Daily forage demand: ${result.forageConsumed} kg DM`,
    '',
    `Warnings (${result.warnings.length}):`,
    ...result.warnings.map(w => `- ${livestockWarning(language, w)}`),
  ].join('\n');
  resetRef.current = () => {
    setAreaHa('50'); setForageYield('5000'); setUtilization('50');
    setAnimalWeight('500'); setIntakePct('2.5'); setSeasonDays('180');
  };

  return (
    <div className="lg:col-span-12 space-y-4">
      <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <span className="text-base font-bold flex items-center gap-2">
            <Beef className="h-4 w-4 text-amber-600" />
            {tr('Pasture Inputs', 'مدخلات المرعى')}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { label: tr('Pasture area (ha)', 'مساحة المرعى (هكتار)'), val: areaHa, set: setAreaHa },
            { label: tr('Forage yield (kg DM/ha)', 'إنتاجية العلف (كغ مادة جافة/هكتار)'), val: forageYield, set: setForageYield },
            { label: tr('Utilization rate (%)', 'معدل الاستغلال (%)'), val: utilization, set: setUtilization },
            { label: tr('Animal weight (kg)', 'وزن الحيوان (كغ)'), val: animalWeight, set: setAnimalWeight },
            { label: tr('Intake (% BW)', 'المدخول (% من وزن الجسم)'), val: intakePct, set: setIntakePct },
            { label: tr('Grazing season (days)', 'موسم الرعي (يوم)'), val: seasonDays, set: setSeasonDays },
          ].map(f => (
            <CalculatorShell.InputField key={f.label} label={f.label} value={f.val} onChange={f.set} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label={tr('Carrying capacity', 'القدرة الاستيعابية')} value={`${result.carryingCapacity} AU/ha`} icon={Beef} color="#16a34a" />
          <Stat label={tr('Total AU', 'إجمالي الوحدات الحيوانية')} value={`${result.totalAU}`} icon={Beef} color="#0891b2" />
          <Stat label={tr('Recommended head', 'العدد الموصى به')} value={`${result.recommendedStocking}`} icon={Beef} color="#f59e0b" />
          <Stat label={tr('Daily forage demand', 'الاحتياج اليومي من العلف')} value={`${result.forageConsumed} kg DM`} icon={Wheat} color="#7c3aed" />
        </div>

        {result.warnings.map((w, i) => (
          <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-400">{livestockWarning(language, w)}</div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 3. MANURE NUTRIENT VALUE
// ============================================================================

function ManureCalculator({ language, summaryRef, resetRef }: { language: UiLanguage; summaryRef: MutableRefObject<string>; resetRef: MutableRefObject<(() => void) | null> }) {
  const tr = (en: string, ar: string) => copyFor(language, en, ar);
  const [manureType, setManureType] = useState('dairy_solid');
  const [tonnes, setTonnes] = useState('500');

  const result = useMemo(() => manureValue(manureType, parseFloat(tonnes) || 0), [manureType, tonnes]);

  summaryRef.current = [
    '=== MANURE NUTRIENT VALUE ===',
    `Manure type: ${tr(manureType.replace(/_/g, ' '), MANURE_AR[manureType] || manureType.replace(/_/g, ' '))}`,
    `Annual production: ${tonnes} tonnes`,
    '',
    `N value: $${result.nValue} (${result.totalN_kg} kg)`,
    `P value: $${result.pValue} (${result.totalP_kg} kg)`,
    `K value: $${result.kValue} (${result.totalK_kg} kg)`,
    `Total fertilizer value: $${result.totalValue}/year`,
    `Urea equiv.: ${result.ureaEquivalent} kg`,
    `DAP equiv.: ${result.dapEquivalent} kg`,
    `MOP equiv.: ${result.mopEquivalent} kg`,
    '',
    `Recommendations (${result.recommendations.length}):`,
    ...result.recommendations.map(r => `- ${livestockRecommendation(language, r)}`),
  ].join('\n');
  resetRef.current = () => {
    setManureType('dairy_solid'); setTonnes('500');
  };

  return (
    <div className="lg:col-span-12 space-y-4">
      <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <span className="text-base font-bold flex items-center gap-2">
            <Recycle className="h-4 w-4 text-amber-600" />
            {tr('Manure Value', 'قيمة الروث')}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-[10px]">{tr('Manure type', 'نوع الروث')}</Label>
            <Select value={manureType} onValueChange={setManureType}>
              <SelectTrigger className="mt-1 h-10 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(MANURE_TYPES).map(k => <SelectItem key={k} value={k} className="capitalize">{tr(k.replace(/_/g, ' '), MANURE_AR[k] || k.replace(/_/g, ' '))}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <CalculatorShell.InputField label={tr('Annual production (tonnes)', 'الإنتاج السنوي (طن)')} value={tonnes} onChange={setTonnes} />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Stat label={tr('N value', 'قيمة N')} value={`$${result.nValue}`} sub={`${result.totalN_kg} kg`} icon={DollarSign} color="#16a34a" />
          <Stat label={tr('P value', 'قيمة P')} value={`$${result.pValue}`} sub={`${result.totalP_kg} kg`} icon={DollarSign} color="#0891b2" />
          <Stat label={tr('K value', 'قيمة K')} value={`$${result.kValue}`} sub={`${result.totalK_kg} kg`} icon={DollarSign} color="#7c3aed" />
        </div>

        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
          <div className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400 font-semibold">{tr('Total Fertilizer Value', 'إجمالي قيمة الأسمدة')}</div>
          <div className="text-2xl font-bold text-emerald-600">${result.totalValue}<span className="text-sm font-normal text-muted-foreground">/{tr('year', 'سنة')}</span></div>
        </div>

        <div className="grid grid-cols-1 gap-2 text-center sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/30 p-3"><div className="text-[9px] text-muted-foreground">{tr('= Urea equiv.', '= مكافئ اليوريا')}</div><div className="text-sm font-bold">{result.ureaEquivalent} kg</div></div>
          <div className="rounded-lg border bg-muted/30 p-3"><div className="text-[9px] text-muted-foreground">{tr('= DAP equiv.', '= مكافئ DAP')}</div><div className="text-sm font-bold">{result.dapEquivalent} kg</div></div>
          <div className="rounded-lg border bg-muted/30 p-3"><div className="text-[9px] text-muted-foreground">{tr('= MOP equiv.', '= مكافئ MOP')}</div><div className="text-sm font-bold">{result.mopEquivalent} kg</div></div>
        </div>

        {result.recommendations.map((r, i) => (
          <div key={i} className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">{livestockRecommendation(language, r)}</div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 4. ROTATIONAL GRAZING SCHEDULER
// ============================================================================

function GrazingScheduler({ language, summaryRef, resetRef }: { language: UiLanguage; summaryRef: MutableRefObject<string>; resetRef: MutableRefObject<(() => void) | null> }) {
  const tr = (en: string, ar: string) => copyFor(language, en, ar);
  const [herdSize, setHerdSize] = useState('50');
  const [areaHa, setAreaHa] = useState('50');
  const [seasonDays, setSeasonDays] = useState('180');
  const [targetRest, setTargetRest] = useState('30');
  const [growthRate, setGrowthRate] = useState('50');
  const [animalWeight, setAnimalWeight] = useState('500');
  const [intakePct, setIntakePct] = useState('2.5');

  const result = useMemo(() => grazingPlan({
    herdSize: parseFloat(herdSize) || 0,
    areaHa: parseFloat(areaHa) || 0,
    grazingSeasonDays: parseFloat(seasonDays) || 180,
    targetRestDays: parseFloat(targetRest) || 30,
    forageGrowthRate: parseFloat(growthRate) || 50,
    animalWeight_kg: parseFloat(animalWeight) || 500,
    intakePctBW: parseFloat(intakePct) || 2.5,
  }), [herdSize, areaHa, seasonDays, targetRest, growthRate, animalWeight, intakePct]);

  summaryRef.current = [
    '=== ROTATIONAL GRAZING ===',
    `Herd size: ${herdSize} head`,
    `Area: ${areaHa} ha`,
    `Season: ${seasonDays} days`,
    `Target rest: ${targetRest} days`,
    `Growth rate: ${growthRate} kg DM/ha/d`,
    `Animal weight: ${animalWeight} kg`,
    `Intake: ${intakePct}% BW`,
    '',
    `Paddocks: ${result.paddocks}`,
    `Graze/paddock: ${result.grazeDaysPerPaddock} d`,
    `Rest period: ${result.restDays} d`,
    `Cycles/season: ${result.cyclesPerSeason}`,
    '',
    `Recommendations (${result.recommendations.length}):`,
    ...result.recommendations.map(r => `- ${livestockRecommendation(language, r)}`),
  ].join('\n');
  resetRef.current = () => {
    setHerdSize('50'); setAreaHa('50'); setSeasonDays('180'); setTargetRest('30');
    setGrowthRate('50'); setAnimalWeight('500'); setIntakePct('2.5');
  };

  return (
    <div className="lg:col-span-12 space-y-4">
      <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <span className="text-base font-bold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-600" />
            {tr('Grazing Inputs', 'مدخلات الرعي')}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: tr('Herd size (head)', 'حجم القطيع (رأس)'), val: herdSize, set: setHerdSize },
            { label: tr('Pasture area (ha)', 'مساحة المرعى (هكتار)'), val: areaHa, set: setAreaHa },
            { label: tr('Season (days)', 'الموسم (يوم)'), val: seasonDays, set: setSeasonDays },
            { label: tr('Target rest (days)', 'الراحة المستهدفة (يوم)'), val: targetRest, set: setTargetRest },
            { label: tr('Growth rate (kg DM/ha/d)', 'معدل النمو (كغ مادة جافة/هكتار/يوم)'), val: growthRate, set: setGrowthRate },
            { label: tr('Animal weight (kg)', 'وزن الحيوان (كغ)'), val: animalWeight, set: setAnimalWeight },
            { label: tr('Intake (% BW)', 'المدخول (% من وزن الجسم)'), val: intakePct, set: setIntakePct },
          ].map(f => (
            <CalculatorShell.InputField key={f.label} label={f.label} value={f.val} onChange={f.set} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label={tr('Paddocks', 'الحواشي')} value={`${result.paddocks}`} icon={Calendar} color="#16a34a" />
          <Stat label={tr('Graze/paddock', 'أيام الرعي/حوشة')} value={`${result.grazeDaysPerPaddock}d`} icon={Beef} color="#f59e0b" />
          <Stat label={tr('Rest period', 'فترة الراحة')} value={`${result.restDays}d`} icon={Recycle} color="#0891b2" />
          <Stat label={tr('Cycles/season', 'الدورات/الموسم')} value={`${result.cyclesPerSeason}`} icon={Calendar} color="#7c3aed" />
        </div>

        {result.recommendations.map((r, i) => (
          <div key={i} className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">{livestockRecommendation(language, r)}</div>
        ))}
      </div>
    </div>
  );
}

// === Helpers ===
function Stat({ label, value, sub, icon: Icon, color, good }: { label: string; value: string; sub?: string; icon: typeof Beef; color: string; good?: boolean }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3 shadow-sm">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">
        <Icon className="h-2.5 w-2.5" style={{ color }} />{label}
      </div>
      <div className="text-sm font-bold mt-0.5" style={{ color }}>{value}</div>
      {sub && <div className="text-[9px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
