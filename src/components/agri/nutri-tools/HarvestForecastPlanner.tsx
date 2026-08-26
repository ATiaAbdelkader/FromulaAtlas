'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, Download, HardHat, PackageCheck, Warehouse } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { copyFor, useTranslation } from '@/lib/language-store';
import { CROP_LIFECYCLES } from '@/lib/crop-lifecycle';
import { calculateHarvestForecast } from '@/lib/harvest-forecast';

const CROP_AR: Record<string, string> = {
  maize: 'ذرة', wheat: 'قمح', rice: 'أرز', soybean: 'فول الصويا', cotton: 'قطن', tomato: 'طماطم', potato: 'بطاطس', lettuce: 'خس', onion: 'بصل',
  alfalfa: 'برسيم', coffee: 'قهوة', apple: 'تفاح', sunflower: 'عباد الشمس', citrus: 'حمضيات', sorghum: 'سورغم', barley: 'شعير', canola: 'كانولا', 'bell-pepper': 'فلفل حلو', cucumber: 'خيار', grapes: 'عنب',
};
const STAGE_AR: Record<string, string> = { Harvest: 'الحصاد', Maturation: 'النضج', Production: 'الإنتاج', Establishment: 'التأسيس', Fruiting: 'الإثمار', Flowering: 'الإزهار', Vegetative: 'النمو الخضري' };
const SKILL_AR: Record<string, string> = { basic: 'أساسي', trained: 'مدرّب', specialist: 'متخصص' };
const PRIORITY_AR: Record<string, string> = { critical: 'حرج', recommended: 'موصى به', optional: 'اختياري' };

type UiLanguage = Parameters<typeof copyFor>[0];
const tr = (language: UiLanguage, english: string, arabic: string, french?: string) => copyFor(language, english, arabic, french);
const cropLabel = (language: UiLanguage, id: string, name: string) => copyFor(language, name, CROP_AR[id] || name);
const stageLabel = (language: UiLanguage, stage: string) => copyFor(language, stage, STAGE_AR[stage] || stage);
const skillLabel = (language: UiLanguage, skill: string) => copyFor(language, skill, SKILL_AR[skill] || skill);
const priorityLabel = (language: UiLanguage, priority: string) => copyFor(language, priority, PRIORITY_AR[priority] || priority);
const formatDate = (language: UiLanguage, value: string) => new Intl.DateTimeFormat(language === 'ar' ? 'ar' : language === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`));

export function HarvestForecastPlanner() {
  const { language, isRTL } = useTranslation();
  const [cropId, setCropId] = useState('maize');
  const [plantingDate, setPlantingDate] = useState(() => new Date(Date.now() - 45 * 86_400_000).toISOString().slice(0, 10));
  const [areaHa, setAreaHa] = useState(5);
  const [yieldTPerHa, setYieldTPerHa] = useState(7);
  const [moisture, setMoisture] = useState(16);
  const [storageCapacity, setStorageCapacity] = useState(40);
  const [currentInventory, setCurrentInventory] = useState(10);

  const result = useMemo(() => calculateHarvestForecast({ cropId, plantingDate, areaHa, expectedYieldTPerHa: yieldTPerHa, expectedMoisturePct: moisture, storageCapacityT: storageCapacity, currentInventoryT: currentInventory }), [cropId, plantingDate, areaHa, yieldTPerHa, moisture, storageCapacity, currentInventory]);
  const numberValue = (value: string) => Number.isFinite(Number(value)) ? Number(value) : 0;
  const printSummary = () => window.print();

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'} className="overflow-hidden border-emerald-200/70 shadow-sm dark:border-emerald-900/60">
      <CardHeader className="border-b bg-gradient-to-r from-emerald-50 via-background to-amber-50/40 pb-4 dark:from-emerald-950/25 dark:via-background dark:to-amber-950/20">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4 text-emerald-600" />{tr(language, 'Harvest Forecast & Lot Planner', 'مخطّط توقع الحصاد والدفعات', 'Prévision de récolte et lots')}</CardTitle>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{tr(language, 'Estimate harvest windows, volume, labor, and storage fit from the canonical crop lifecycle.', 'قدّر نوافذ الحصاد والإنتاج والعمالة وملاءمة التخزين اعتماداً على دورة حياة المحصول المعتمدة.', 'Estimez les fenêtres de récolte, le volume, la main-d’œuvre et le stockage à partir du cycle cultural de référence.')}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={printSummary} className="shrink-0 gap-1.5"><Download className="h-3.5 w-3.5" />{tr(language, 'Print', 'طباعة', 'Imprimer')}</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/30 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/10 sm:grid-cols-2 lg:grid-cols-3">
          <FieldLabel label={tr(language, 'Crop', 'المحصول', 'Culture')}><select aria-label={tr(language, 'Crop', 'المحصول', 'Culture')} value={cropId} onChange={e => setCropId(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{CROP_LIFECYCLES.map(crop => <option key={crop.id} value={crop.id}>{crop.emoji} {cropLabel(language, crop.id, crop.name)}</option>)}</select></FieldLabel>
          <FieldLabel label={tr(language, 'Planting date', 'تاريخ الزراعة', 'Date de plantation')}><Input aria-label={tr(language, 'Planting date', 'تاريخ الزراعة', 'Date de plantation')} type="date" value={plantingDate} onChange={e => setPlantingDate(e.target.value)} className="mt-1 h-10 text-sm" /></FieldLabel>
          <FieldLabel label={tr(language, 'Field area (ha)', 'مساحة الحقل (هـ)', 'Surface (ha)')}><Input aria-label={tr(language, 'Field area in hectares', 'مساحة الحقل بالهكتار', 'Surface en hectares')} type="number" min="0" step="0.1" value={areaHa} onChange={e => setAreaHa(numberValue(e.target.value))} className="mt-1 h-10 text-sm" /></FieldLabel>
          <FieldLabel label={tr(language, 'Expected yield (t/ha)', 'الإنتاج المتوقع (طن/هـ)', 'Rendement prévu (t/ha)')}><Input aria-label={tr(language, 'Expected yield per hectare', 'الإنتاج المتوقع لكل هكتار', 'Rendement prévu par hectare')} type="number" min="0" step="0.1" value={yieldTPerHa} onChange={e => setYieldTPerHa(numberValue(e.target.value))} className="mt-1 h-10 text-sm" /></FieldLabel>
          <FieldLabel label={tr(language, 'Expected harvest moisture (%)', 'رطوبة الحصاد المتوقعة (%)', 'Humidité prévue à la récolte (%)')}><Input aria-label={tr(language, 'Expected harvest moisture', 'رطوبة الحصاد المتوقعة', 'Humidité prévue à la récolte')} type="number" min="0" max="100" step="0.5" value={moisture} onChange={e => setMoisture(numberValue(e.target.value))} className="mt-1 h-10 text-sm" /></FieldLabel>
          <FieldLabel label={tr(language, 'Storage capacity (t)', 'سعة التخزين (طن)', 'Capacité de stockage (t)')}><Input aria-label={tr(language, 'Storage capacity in tonnes', 'سعة التخزين بالطن', 'Capacité en tonnes')} type="number" min="0" step="1" value={storageCapacity} onChange={e => setStorageCapacity(numberValue(e.target.value))} className="mt-1 h-10 text-sm" /></FieldLabel>
          <FieldLabel label={tr(language, 'Current inventory (t)', 'المخزون الحالي (طن)', 'Stock actuel (t)')}><Input aria-label={tr(language, 'Current stored inventory', 'المخزون المخزن حالياً', 'Stock actuellement entreposé')} type="number" min="0" step="1" value={currentInventory} onChange={e => setCurrentInventory(numberValue(e.target.value))} className="mt-1 h-10 text-sm" /></FieldLabel>
        </div>

        {!result && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300">{tr(language, 'Enter a valid crop, planting date, positive area, and non-negative yield.', 'أدخل محصولاً صالحاً وتاريخ زراعة ومساحة موجبة وإنتاجاً غير سالب.', 'Saisissez une culture valide, une date, une surface positive et un rendement non négatif.')}</div>}

        {result && <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric icon={CalendarDays} label={tr(language, 'Harvest window', 'نافذة الحصاد', 'Fenêtre de récolte')} value={`${formatDate(language, result.harvestStartDate)} – ${formatDate(language, result.harvestEndDate)}`} />
            <Metric icon={PackageCheck} label={tr(language, 'Expected volume', 'الإنتاج المتوقع', 'Volume prévu')} value={`${result.totalExpectedVolumeT.toFixed(1)} t`} />
            <Metric icon={HardHat} label={tr(language, 'Harvest labor', 'عمالة الحصاد', 'Main-d’œuvre récolte')} value={`${result.totalHarvestLaborDays.toFixed(1)} ${tr(language, 'person-days', 'يوم عمل', 'jours-personne')}`} />
            <Metric icon={Warehouse} label={tr(language, 'Storage fit', 'ملاءمة التخزين', 'Adéquation stockage')} value={result.storageStatus === 'fits' ? tr(language, 'Fits', 'مناسب', 'Compatible') : result.storageStatus === 'tight' ? tr(language, 'Tight', 'ضيق', 'Serré') : tr(language, 'Over capacity', 'تجاوز السعة', 'Capacité dépassée')} tone={result.storageStatus === 'fits' ? 'emerald' : result.storageStatus === 'tight' ? 'amber' : 'rose'} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{tr(language, 'Season timing', 'توقيت الموسم', 'Calendrier de saison')}</span><Badge variant="secondary">{result.daysUntilHarvest === 0 ? tr(language, 'Ready / due', 'حان أو جاهز', 'À faire / prêt') : `${result.daysUntilHarvest} ${tr(language, 'days', 'يوماً', 'jours')}`}</Badge></div>
              <div className="mt-2 text-sm font-semibold">{formatDate(language, result.harvestStartDate)} — {formatDate(language, result.harvestEndDate)}</div>
              <div className="mt-1 text-xs text-muted-foreground">{tr(language, 'Season end estimate:', 'تقدير نهاية الموسم:', 'Fin de saison estimée:')} {formatDate(language, result.seasonEndDate)}</div>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4 dark:border-sky-900 dark:bg-sky-950/20">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{tr(language, 'Storage balance', 'رصيد التخزين', 'Bilan du stockage')}</div>
              <div className="mt-2 text-sm font-semibold">{result.storageAvailableT.toFixed(1)} t {tr(language, 'available before harvest', 'متاحة قبل الحصاد', 'disponibles avant récolte')}</div>
              <div className="mt-1 text-xs text-muted-foreground">{tr(language, 'After expected production:', 'بعد الإنتاج المتوقع:', 'Après production prévue:')} {result.storageRemainingT.toFixed(1)} t {tr(language, 'remaining', 'متبقية', 'restantes')}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Clock3 className="h-3.5 w-3.5 text-emerald-600" />{tr(language, 'Harvest lots and operations', 'دفعات وعمليات الحصاد', 'Lots et opérations de récolte')}</div>
            {result.lots.map(lot => <div key={lot.id} className="rounded-xl border bg-background/70 p-3 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="text-sm font-semibold">{tr(language, 'Harvest operation', 'عملية حصاد', 'Opération de récolte')} · {stageLabel(language, lot.operation.stage)}</div><div className="mt-1 text-xs text-muted-foreground">{formatDate(language, lot.startDate)}{lot.endDate !== lot.startDate ? ` — ${formatDate(language, lot.endDate)}` : ''}</div></div><div className="flex gap-1.5"><Badge variant="outline">{priorityLabel(language, lot.operation.priority)}</Badge><Badge variant="secondary">{skillLabel(language, lot.operation.skill)}</Badge></div></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4"><div><div className="text-muted-foreground">{tr(language, 'Volume', 'الإنتاج', 'Volume')}</div><div className="font-semibold">{lot.expectedVolumeT.toFixed(1)} t</div></div><div><div className="text-muted-foreground">{tr(language, 'Dry matter', 'المادة الجافة', 'Matière sèche')}</div><div className="font-semibold">{lot.expectedDryVolumeT.toFixed(1)} t</div></div><div><div className="text-muted-foreground">{tr(language, 'Labor', 'العمالة', 'Main-d’œuvre')}</div><div className="font-semibold">{lot.laborDays.toFixed(1)} {tr(language, 'days', 'يوم', 'jours')}</div></div><div><div className="text-muted-foreground">{tr(language, 'Equipment', 'المعدات', 'Équipement')}</div><div className="font-semibold">{lot.operation.equipment || tr(language, 'Standard harvest crew', 'فريق حصاد قياسي', 'Équipe de récolte standard')}</div></div></div></div>)}
          </div>

          {result.warnings.length > 0 && <div className="space-y-2">{result.warnings.map((warning, index) => <div key={index} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" /><span>{warning === 'Harvest moisture is high; plan drying before storage.' ? tr(language, warning, 'رطوبة الحصاد مرتفعة؛ خطط للتجفيف قبل التخزين.', 'L’humidité de récolte est élevée; prévoyez un séchage avant stockage.') : warning === 'Expected moisture exceeds typical long-term grain storage targets; confirm crop-specific limits.' ? tr(language, warning, 'الرطوبة المتوقعة تتجاوز أهداف التخزين طويل الأمد المعتادة للحبوب؛ تحقق من حدود المحصول المحددة.', 'L’humidité prévue dépasse les objectifs habituels de stockage à long terme; vérifiez les limites propres à la culture.') : warning === 'Expected production exceeds available storage after current inventory.' ? tr(language, warning, 'الإنتاج المتوقع يتجاوز سعة التخزين المتاحة بعد احتساب المخزون الحالي.', 'La production prévue dépasse la capacité disponible après prise en compte du stock actuel.') : tr(language, warning, 'الحصاد عملية متعددة الأيام أو المراحل؛ احجز العمالة والنقل طوال النافذة.', 'La récolte s’étale sur plusieurs jours ou passages; réservez la main-d’œuvre et le transport sur toute la fenêtre.')}</span></div>)}</div>}

          <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-3 text-xs leading-relaxed text-sky-900 dark:border-sky-900 dark:bg-sky-950/20 dark:text-sky-100"><strong>{tr(language, 'Planning note:', 'ملاحظة تخطيطية:', 'Note de planification:')}</strong> {tr(language, 'This is a planning estimate based on the selected crop lifecycle, yield, and dates. Confirm field maturity, weather, contracts, moisture, quality, labor, transport, and storage conditions before harvest decisions.', 'هذا تقدير تخطيطي مبني على دورة حياة المحصول والإنتاج والتواريخ المحددة. تحقق من نضج الحقل والطقس والعقود والرطوبة والجودة والعمالة والنقل والتخزين قبل قرارات الحصاد.', 'Il s’agit d’une estimation basée sur le cycle cultural, le rendement et les dates sélectionnés. Confirmez maturité, météo, contrats, humidité, qualité, main-d’œuvre, transport et stockage avant toute décision.')}</div>
        </>}
      </CardContent>
    </Card>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) { return <div><Label className="text-[10px] font-medium">{label}</Label>{children}</div>; }
function Metric({ icon: Icon, label, value, tone = 'emerald' }: { icon: typeof CalendarDays; label: string; value: string; tone?: 'emerald' | 'amber' | 'rose' }) { const styles = { emerald: 'border-emerald-200 bg-emerald-50/40 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200', amber: 'border-amber-200 bg-amber-50/40 text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200', rose: 'border-rose-200 bg-rose-50/40 text-rose-800 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-200' }; return <div className={`rounded-xl border p-3 ${styles[tone]}`}><Icon className="mb-2 h-4 w-4" /><div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 break-words text-sm font-bold">{value}</div></div>; }
