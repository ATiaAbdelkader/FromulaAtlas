'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Beef, Wheat, Recycle, Calendar, Plus, Trash2, CheckCircle2, AlertTriangle,
  DollarSign, Milk, PiggyBank,
} from 'lucide-react';
import {
  FEED_INGREDIENTS, computeRation, pastureCapacity, manureValue, grazingPlan, MANURE_TYPES,
  type RationLine,
} from '@/lib/livestock-data';
import { copyFor, useTranslation } from '@/lib/language-store';

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

type Tab = 'ration' | 'pasture' | 'manure' | 'grazing';

export function LivestockIntegration() {
  const { language } = useTranslation();
  const [tab, setTab] = useState<Tab>('ration');

  return (
    <Card className="overflow-hidden border-amber-100 shadow-sm dark:border-amber-900/60">
      <CardHeader className="border-b border-border/60 bg-amber-50/50 pb-4 dark:bg-amber-950/10">
        <CardTitle className="flex items-center gap-2 text-base"><span className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"><Beef className="h-4 w-4" /></span> {copyFor(language, 'Livestock Management', 'إدارة الثروة الحيوانية')}</CardTitle>
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-amber-100/70 p-1 dark:bg-amber-950/30 sm:grid-cols-4">
          <TabBtn active={tab === 'ration'} onClick={() => setTab('ration')} icon={Wheat} label={copyFor(language, 'Feed Ration', 'عليقة التغذية')} />
          <TabBtn active={tab === 'pasture'} onClick={() => setTab('pasture')} icon={Beef} label={copyFor(language, 'Pasture', 'المرعى')} />
          <TabBtn active={tab === 'manure'} onClick={() => setTab('manure')} icon={Recycle} label={copyFor(language, 'Manure Value', 'قيمة الروث')} />
          <TabBtn active={tab === 'grazing'} onClick={() => setTab('grazing')} icon={Calendar} label={copyFor(language, 'Grazing', 'الرعي')} />
        </div>
      </CardHeader>
      <CardContent>
        {tab === 'ration' && <FeedRationCalculator />}
        {tab === 'pasture' && <PastureCalculator />}
        {tab === 'manure' && <ManureCalculator />}
        {tab === 'grazing' && <GrazingScheduler />}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// 1. FEED RATION CALCULATOR
// ============================================================================

function FeedRationCalculator() {
  const { language } = useTranslation();
  const [lines, setLines] = useState<RationLine[]>([
    { ingredientId: 'corn_silage', kgAsFed: 20 },
    { ingredientId: 'alfalfa_hay', kgAsFed: 5 },
    { ingredientId: 'corn_grain', kgAsFed: 5 },
    { ingredientId: 'soybean_meal', kgAsFed: 3 },
    { ingredientId: 'mineral_mix', kgAsFed: 0.2 },
  ]);
  const [animalType, setAnimalType] = useState<'dairy_lactating' | 'dairy_dry' | 'beef_growing' | 'beef_finishing'>('dairy_lactating');

  const result = useMemo(() => computeRation(lines, animalType), [lines, animalType]);

  const updateLine = (i: number, field: keyof RationLine, value: string | number) => {
    const newLines = [...lines];
    newLines[i] = { ...newLines[i], [field]: value };
    setLines(newLines);
  };
  const addLine = () => setLines([...lines, { ingredientId: 'corn_grain', kgAsFed: 1 }]);
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 rounded-xl border border-amber-200/70 bg-amber-50/30 p-3 sm:flex-row sm:items-center dark:border-amber-900/60 dark:bg-amber-950/10">
        <Label className="text-xs font-semibold whitespace-nowrap">{copyFor(language, 'Animal type', 'نوع الحيوان')}</Label>
        <Select value={animalType} onValueChange={v => setAnimalType(v as typeof animalType)}>
          <SelectTrigger className="h-10 w-full text-sm sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="dairy_lactating"><Milk className="h-3 w-3 inline mr-1" />{copyFor(language, 'Dairy Lactating', 'أبقار حلوب')}</SelectItem>
            <SelectItem value="dairy_dry">{copyFor(language, 'Dairy Dry', 'أبقار جافة')}</SelectItem>
            <SelectItem value="beef_growing"><Beef className="h-3 w-3 inline mr-1" />{copyFor(language, 'Beef Growing', 'أبقار لحمية نامية')}</SelectItem>
            <SelectItem value="beef_finishing">{copyFor(language, 'Beef Finishing', 'أبقار لحمية للتسمين')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ingredients */}
      <div className="space-y-1.5">
        {lines.map((line, i) => {
          const ing = FEED_INGREDIENTS.find(x => x.id === line.ingredientId);
          return (
            <div key={i} className="flex flex-col gap-2 rounded-xl border bg-background/70 p-3 shadow-sm sm:grid sm:grid-cols-[minmax(0,1fr)_110px_auto] sm:items-center">
              <Select value={line.ingredientId} onValueChange={v => updateLine(i, 'ingredientId', v)}>
                <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FEED_INGREDIENTS.map(x => <SelectItem key={x.id} value={x.id}>{x.emoji} {copyFor(language, x.name, FEED_AR[x.id])}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input aria-label={copyFor(language, `Kilograms as fed for ingredient ${i + 1}`, `كيلوغرامات العلف المقدم للمكوّن ${i + 1}`)} type="number" value={line.kgAsFed} onChange={e => updateLine(i, 'kgAsFed', parseFloat(e.target.value) || 0)} step="0.5" className="h-10 text-sm" />
              <button type="button" aria-label={copyFor(language, 'Remove ingredient', 'إزالة المكوّن')} onClick={() => removeLine(i)} className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          );
        })}
        <Button size="sm" variant="outline" onClick={addLine} className="h-10 w-full gap-2 text-sm"><Plus className="h-4 w-4" /> {copyFor(language, 'Add ingredient', 'إضافة مكوّن')}</Button>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={copyFor(language, 'DM Intake', 'مدخول المادة الجافة')} value={`${result.totalKgDM.toFixed(1)} kg`} icon={Wheat} color="#f59e0b" />
        <Stat label={copyFor(language, 'NEL', 'الطاقة الصافية للحليب')} value={`${result.nel_Mcal_kgDM.toFixed(2)} Mcal/kg`} icon={Milk} color={result.meetsDairy?.nel ? '#16a34a' : '#dc2626'} good={result.meetsDairy?.nel} />
        <Stat label={copyFor(language, 'CP', 'البروتين الخام')} value={`${result.cpPctDM.toFixed(1)}% DM`} icon={Beef} color={result.meetsDairy?.cp ? '#16a34a' : '#dc2626'} good={result.meetsDairy?.cp} />
        <Stat label={copyFor(language, 'Cost/day', 'التكلفة/اليوم')} value={`$${result.costPerDay.toFixed(2)}`} icon={DollarSign} color="#0891b2" />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Stat label={copyFor(language, 'NDF', 'الألياف المنظفة المتعادلة')} value={`${result.ndfPctDM.toFixed(1)}%`} icon={Wheat} color={result.meetsDairy?.ndf ? '#16a34a' : '#dc2626'} good={result.meetsDairy?.ndf} />
        <Stat label={copyFor(language, 'Ca', 'الكالسيوم')} value={`${((result.totalCa_kg / Math.max(result.totalKgDM, 1)) * 100).toFixed(2)}%`} icon={CheckCircle2} color={result.meetsDairy?.ca ? '#16a34a' : '#dc2626'} good={result.meetsDairy?.ca} />
        <Stat label={copyFor(language, 'P', 'الفوسفور')} value={`${((result.totalP_kg / Math.max(result.totalKgDM, 1)) * 100).toFixed(2)}%`} icon={CheckCircle2} color={result.meetsDairy?.p ? '#16a34a' : '#dc2626'} good={result.meetsDairy?.p} />
      </div>

      {result.warnings.length > 0 && (
        <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50/50 p-3 dark:bg-amber-950/20">
          {result.warnings.map((w, i) => <div key={i} className="text-xs text-amber-700 dark:text-amber-400">{livestockWarning(language, w)}</div>)}
        </div>
      )}
      {result.warnings.length === 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" /> {copyFor(language, `Ration meets all NRC requirements for ${animalType.replace(/_/g, ' ')}.`, `العليقة تستوفي جميع متطلبات NRC لـ${ANIMAL_AR[animalType] || animalType}.`)}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 2. PASTURE CARRYING CAPACITY
// ============================================================================

function PastureCalculator() {
  const { language } = useTranslation();
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

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:grid-cols-3">
        {[
          { label: copyFor(language, 'Pasture area (ha)', 'مساحة المرعى (هكتار)'), val: areaHa, set: setAreaHa },
          { label: copyFor(language, 'Forage yield (kg DM/ha)', 'إنتاجية العلف (كغ مادة جافة/هكتار)'), val: forageYield, set: setForageYield },
          { label: copyFor(language, 'Utilization rate (%)', 'معدل الاستغلال (%)'), val: utilization, set: setUtilization },
          { label: copyFor(language, 'Animal weight (kg)', 'وزن الحيوان (كغ)'), val: animalWeight, set: setAnimalWeight },
          { label: copyFor(language, 'Intake (% BW)', 'المدخول (% من وزن الجسم)'), val: intakePct, set: setIntakePct },
          { label: copyFor(language, 'Grazing season (days)', 'موسم الرعي (يوم)'), val: seasonDays, set: setSeasonDays },
        ].map(f => (
          <div key={f.label}>
            <Label className="text-[10px]">{f.label}</Label>
            <Input type="number" value={f.val} onChange={e => f.set(e.target.value)} className="mt-1 h-10 text-sm" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={copyFor(language, 'Carrying capacity', 'القدرة الاستيعابية')} value={`${result.carryingCapacity} AU/ha`} icon={Beef} color="#16a34a" />
        <Stat label={copyFor(language, 'Total AU', 'إجمالي الوحدات الحيوانية')} value={`${result.totalAU}`} icon={Beef} color="#0891b2" />
        <Stat label={copyFor(language, 'Recommended head', 'العدد الموصى به')} value={`${result.recommendedStocking}`} icon={Beef} color="#f59e0b" />
        <Stat label={copyFor(language, 'Daily forage demand', 'الاحتياج اليومي من العلف')} value={`${result.forageConsumed} kg DM`} icon={Wheat} color="#7c3aed" />
      </div>

      {result.warnings.map((w, i) => (
        <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-400">{livestockWarning(language, w)}</div>
      ))}
    </div>
  );
}

// ============================================================================
// 3. MANURE NUTRIENT VALUE
// ============================================================================

function ManureCalculator() {
  const { language } = useTranslation();
  const [manureType, setManureType] = useState('dairy_solid');
  const [tonnes, setTonnes] = useState('500');

  const result = useMemo(() => manureValue(manureType, parseFloat(tonnes) || 0), [manureType, tonnes]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-[10px]">{copyFor(language, 'Manure type', 'نوع الروث')}</Label>
          <Select value={manureType} onValueChange={setManureType}>
            <SelectTrigger className="mt-1 h-10 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.keys(MANURE_TYPES).map(k => <SelectItem key={k} value={k} className="capitalize">{copyFor(language, k.replace(/_/g, ' '), MANURE_AR[k] || k.replace(/_/g, ' '))}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px]">{copyFor(language, 'Annual production (tonnes)', 'الإنتاج السنوي (طن)')}</Label>
          <Input type="number" value={tonnes} onChange={e => setTonnes(e.target.value)} className="mt-1 h-10 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Stat label={copyFor(language, 'N value', 'قيمة N')} value={`$${result.nValue}`} sub={`${result.totalN_kg} kg`} icon={DollarSign} color="#16a34a" />
        <Stat label={copyFor(language, 'P value', 'قيمة P')} value={`$${result.pValue}`} sub={`${result.totalP_kg} kg`} icon={DollarSign} color="#0891b2" />
        <Stat label={copyFor(language, 'K value', 'قيمة K')} value={`$${result.kValue}`} sub={`${result.totalK_kg} kg`} icon={DollarSign} color="#7c3aed" />
      </div>

      <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
        <div className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400 font-semibold">{copyFor(language, 'Total Fertilizer Value', 'إجمالي قيمة الأسمدة')}</div>
        <div className="text-2xl font-bold text-emerald-600">${result.totalValue}<span className="text-sm font-normal text-muted-foreground">/{copyFor(language, 'year', 'سنة')}</span></div>
      </div>

      <div className="grid grid-cols-1 gap-2 text-center sm:grid-cols-3">
        <div className="rounded-lg border bg-muted/30 p-3"><div className="text-[9px] text-muted-foreground">{copyFor(language, '= Urea equiv.', '= مكافئ اليوريا')}</div><div className="text-sm font-bold">{result.ureaEquivalent} kg</div></div>
        <div className="rounded-lg border bg-muted/30 p-3"><div className="text-[9px] text-muted-foreground">{copyFor(language, '= DAP equiv.', '= مكافئ DAP')}</div><div className="text-sm font-bold">{result.dapEquivalent} kg</div></div>
        <div className="rounded-lg border bg-muted/30 p-3"><div className="text-[9px] text-muted-foreground">{copyFor(language, '= MOP equiv.', '= مكافئ MOP')}</div><div className="text-sm font-bold">{result.mopEquivalent} kg</div></div>
      </div>

      {result.recommendations.map((r, i) => (
        <div key={i} className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">{livestockRecommendation(language, r)}</div>
      ))}
    </div>
  );
}

// ============================================================================
// 4. ROTATIONAL GRAZING SCHEDULER
// ============================================================================

function GrazingScheduler() {
  const { language } = useTranslation();
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

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: copyFor(language, 'Herd size (head)', 'حجم القطيع (رأس)'), val: herdSize, set: setHerdSize },
          { label: copyFor(language, 'Pasture area (ha)', 'مساحة المرعى (هكتار)'), val: areaHa, set: setAreaHa },
          { label: copyFor(language, 'Season (days)', 'الموسم (يوم)'), val: seasonDays, set: setSeasonDays },
          { label: copyFor(language, 'Target rest (days)', 'الراحة المستهدفة (يوم)'), val: targetRest, set: setTargetRest },
          { label: copyFor(language, 'Growth rate (kg DM/ha/d)', 'معدل النمو (كغ مادة جافة/هكتار/يوم)'), val: growthRate, set: setGrowthRate },
          { label: copyFor(language, 'Animal weight (kg)', 'وزن الحيوان (كغ)'), val: animalWeight, set: setAnimalWeight },
          { label: copyFor(language, 'Intake (% BW)', 'المدخول (% من وزن الجسم)'), val: intakePct, set: setIntakePct },
        ].map(f => (
          <div key={f.label}>
            <Label className="text-[10px]">{f.label}</Label>
            <Input type="number" value={f.val} onChange={e => f.set(e.target.value)} className="mt-1 h-10 text-sm" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={copyFor(language, 'Paddocks', 'الحواشي')} value={`${result.paddocks}`} icon={Calendar} color="#16a34a" />
        <Stat label={copyFor(language, 'Graze/paddock', 'أيام الرعي/حوشة')} value={`${result.grazeDaysPerPaddock}d`} icon={Beef} color="#f59e0b" />
        <Stat label={copyFor(language, 'Rest period', 'فترة الراحة')} value={`${result.restDays}d`} icon={Recycle} color="#0891b2" />
        <Stat label={copyFor(language, 'Cycles/season', 'الدورات/الموسم')} value={`${result.cyclesPerSeason}`} icon={Calendar} color="#7c3aed" />
      </div>

      {result.recommendations.map((r, i) => (
        <div key={i} className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">{livestockRecommendation(language, r)}</div>
      ))}
    </div>
  );
}

// === Helpers ===
function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Beef; label: string }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${active ? 'bg-background text-amber-700 shadow-sm dark:text-amber-300' : 'text-muted-foreground hover:text-foreground'}`}>
      <Icon className="h-4 w-4" /><span>{label}</span>
    </button>
  );
}

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
