'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  PackageCheck,
  HardHat,
  Warehouse,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';
import {
  CalculatorShell,
  type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import { CROP_LIFECYCLES } from '@/lib/crop-lifecycle';
import { calculateHarvestForecast } from '@/lib/harvest-forecast';

const CROP_AR: Record<string, string> = {
  maize: 'ذرة',
  wheat: 'قمح',
  rice: 'أرز',
  soybean: 'فول الصويا',
  cotton: 'قطن',
  tomato: 'طماطم',
  potato: 'بطاطس',
  lettuce: 'خس',
  onion: 'بصل',
  alfalfa: 'برسيم',
  coffee: 'قهوة',
  apple: 'تفاح',
  sunflower: 'عباد الشمس',
  citrus: 'حمضيات',
  sorghum: 'سورغم',
  barley: 'شعير',
  canola: 'كانولا',
  'bell-pepper': 'فلفل حلو',
  cucumber: 'خيار',
  grapes: 'عنب',
};
const CROP_FR: Record<string, string> = {
  maize: 'Maïs',
  wheat: 'Blé',
  rice: 'Riz',
  soybean: 'Soja',
  cotton: 'Coton',
  tomato: 'Tomate',
  potato: 'Pomme de terre',
  lettuce: 'Laitue',
  onion: 'Oignon',
  alfalfa: 'Luzerne',
  coffee: 'Café',
  apple: 'Pomme',
  sunflower: 'Tournesol',
  citrus: 'Agrumes',
  sorghum: 'Sorgho',
  barley: 'Orge',
  canola: 'Colza',
  'bell-pepper': 'Poivron',
  cucumber: 'Concombre',
  grapes: 'Raisin',
};
const STAGE_AR: Record<string, string> = {
  Harvest: 'الحصاد',
  Maturation: 'النضج',
  Production: 'الإنتاج',
  Establishment: 'التأسيس',
  Fruiting: 'الإثمار',
  Flowering: 'الإزهار',
  Vegetative: 'النمو الخضري',
};
const STAGE_FR: Record<string, string> = {
  Harvest: 'Récolte',
  Maturation: 'Maturation',
  Production: 'Production',
  Establishment: 'Établissement',
  Fruiting: 'Fructification',
  Flowering: 'Floraison',
  Vegetative: 'Végétatif',
};
const SKILL_AR: Record<string, string> = {
  basic: 'أساسي',
  trained: 'مدرّب',
  specialist: 'متخصص',
};
const SKILL_FR: Record<string, string> = {
  basic: 'base',
  trained: 'qualifié',
  specialist: 'spécialiste',
};
const PRIORITY_AR: Record<string, string> = {
  critical: 'حرج',
  recommended: 'موصى به',
  optional: 'اختياري',
};
const PRIORITY_FR: Record<string, string> = {
  critical: 'critique',
  recommended: 'recommandé',
  optional: 'optionnel',
};

type UiLanguage = Parameters<typeof copyFor>[0];
const cropLabel = (language: UiLanguage, id: string, name: string) =>
  copyFor(language, name, CROP_AR[id] || name, CROP_FR[id] || name);
const stageLabel = (language: UiLanguage, stage: string) =>
  copyFor(language, stage, STAGE_AR[stage] || stage, STAGE_FR[stage] || stage);
const skillLabel = (language: UiLanguage, skill: string) =>
  copyFor(language, skill, SKILL_AR[skill] || skill, SKILL_FR[skill] || skill);
const priorityLabel = (language: UiLanguage, priority: string) =>
  copyFor(
    language,
    priority,
    PRIORITY_AR[priority] || priority,
    PRIORITY_FR[priority] || priority,
  );
const formatDate = (language: UiLanguage, value: string) =>
  new Intl.DateTimeFormat(
    language === 'ar' ? 'ar' : language === 'fr' ? 'fr-FR' : 'en-US',
    { dateStyle: 'medium' },
  ).format(new Date(`${value}T00:00:00`));

const WARNING_TR: Record<
  string,
  { en: string; ar: string; fr: string }
> = {
  'Harvest moisture is high; plan drying before storage.': {
    en: 'Harvest moisture is high; plan drying before storage.',
    ar: 'رطوبة الحصاد مرتفعة؛ خطط للتجفيف قبل التخزين.',
    fr: 'L’humidité de récolte est élevée; prévoyez un séchage avant stockage.',
  },
  'Expected moisture exceeds typical long-term grain storage targets; confirm crop-specific limits.': {
    en: 'Expected moisture exceeds typical long-term grain storage targets; confirm crop-specific limits.',
    ar: 'الرطوبة المتوقعة تتجاوز أهداف التخزين طويل الأمد المعتادة للحبوب؛ تحقق من حدود المحصول المحددة.',
    fr: 'L’humidité prévue dépasse les objectifs habituels de stockage à long terme; vérifiez les limites propres à la culture.',
  },
  'Expected production exceeds available storage after current inventory.': {
    en: 'Expected production exceeds available storage after current inventory.',
    ar: 'الإنتاج المتوقع يتجاوز سعة التخزين المتاحة بعد احتساب المخزون الحالي.',
    fr: 'La production prévue dépasse la capacité disponible après prise en compte du stock actuel.',
  },
};

export function HarvestForecastPlanner() {
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [cropId, setCropId] = useState('maize');
  const [plantingDate, setPlantingDate] = useState(() =>
    new Date(Date.now() - 45 * 86_400_000).toISOString().slice(0, 10),
  );
  const [areaHa, setAreaHa] = useState(5);
  const [yieldTPerHa, setYieldTPerHa] = useState(7);
  const [moisture, setMoisture] = useState(16);
  const [storageCapacity, setStorageCapacity] = useState(40);
  const [currentInventory, setCurrentInventory] = useState(10);
  const [copied, setCopied] = useState(false);

  const result = useMemo(
    () =>
      calculateHarvestForecast({
        cropId,
        plantingDate,
        areaHa,
        expectedYieldTPerHa: yieldTPerHa,
        expectedMoisturePct: moisture,
        storageCapacityT: storageCapacity,
        currentInventoryT: currentInventory,
      }),
    [
      cropId,
      plantingDate,
      areaHa,
      yieldTPerHa,
      moisture,
      storageCapacity,
      currentInventory,
    ],
  );
  const numberValue = (value: string) =>
    Number.isFinite(Number(value)) ? Number(value) : 0;

  const handleReset = () => {
    setCropId('maize');
    setPlantingDate(
      new Date(Date.now() - 45 * 86_400_000).toISOString().slice(0, 10),
    );
    setAreaHa(5);
    setYieldTPerHa(7);
    setMoisture(16);
    setStorageCapacity(40);
    setCurrentInventory(10);
    toast({
      title: tr(
        'Reset to Defaults',
        'تمت استعادة القيم الافتراضية',
        'Valeurs réinitialisées',
      ),
    });
  };

  const handleCopy = () => {
    if (!result) return;
    const lines = result.lots.map(
      lot =>
        `  • ${stageLabel(language, lot.operation.stage)} — ${formatDate(language, lot.startDate)} → ${formatDate(language, lot.endDate)} | ${lot.expectedVolumeT.toFixed(1)} t | ${lot.laborDays.toFixed(1)} ${tr('days', 'يوم', 'jours')}`,
    );
    const text = `
=== HARVEST FORECAST ===
Crop: ${CROP_LIFECYCLES.find(c => c.id === cropId)?.emoji ?? ''} ${cropLabel(language, cropId, CROP_LIFECYCLES.find(c => c.id === cropId)?.name ?? cropId)}
Planting date: ${plantingDate}
Field area: ${areaHa} ha | Expected yield: ${yieldTPerHa} t/ha

Harvest window: ${formatDate(language, result.harvestStartDate)} → ${formatDate(language, result.harvestEndDate)}
Expected volume: ${result.totalExpectedVolumeT.toFixed(1)} t
Labor: ${result.totalHarvestLaborDays.toFixed(1)} ${tr('person-days', 'يوم عمل', 'jours-personne')}
Storage: ${result.storageStatus === 'fits' ? tr('Fits', 'مناسب', 'Compatible') : result.storageStatus === 'tight' ? tr('Tight', 'ضيق', 'Serré') : tr('Over capacity', 'تجاوز السعة', 'Capacité dépassée')} (${result.storageAvailableT.toFixed(1)} t available, ${result.storageRemainingT.toFixed(1)} t remaining)
Days until harvest: ${result.daysUntilHarvest}

Lots:
${lines.join('\n')}
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: tr('Summary Copied!', 'تم نسخ التقرير!', 'Résumé copié !'),
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const pills: CalculatorPill[] = CROP_LIFECYCLES.map(crop => ({
    key: crop.id,
    label: cropLabel(language, crop.id, crop.name),
    emoji: crop.emoji,
  }));

  return (
    <CalculatorShell
      icon={TrendingUp}
      accent="amber"
      title={{
        en: 'Harvest Forecast & Lot Planner',
        ar: 'مخطّط توقع الحصاد والدفعات',
        fr: 'Prévision de récolte et lots',
      }}
      description={{
        en: 'Estimate harvest windows, volume, labor, and storage fit from the canonical crop lifecycle.',
        ar: 'قدّر نوافذ الحصاد والإنتاج والعمالة وملاءمة التخزين اعتماداً على دورة حياة المحصول المعتمدة.',
        fr: 'Estimez les fenêtres de récolte, le volume, la main-d’œuvre et le stockage à partir du cycle cultural de référence.',
      }}
      badge="Lifecycle-based"
      pills={pills}
      activePill={cropId}
      onPillClick={setCropId}
      pillLabel={{ en: 'Select Crop:', ar: 'اختر المحصول:', fr: 'Culture :' }}
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
          onClick: handleCopy,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      protocolNote={{
        en: 'This is a planning estimate based on the selected crop lifecycle, yield, and dates. Confirm field maturity, weather, contracts, moisture, quality, labor, transport, and storage conditions before harvest decisions.',
        ar: 'هذا تقدير تخطيطي مبني على دورة حياة المحصول والإنتاج والتواريخ المحددة. تحقق من نضج الحقل والطقس والعقود والرطوبة والجودة والعمالة والنقل والتخزين قبل قرارات الحصاد.',
        fr: 'Il s’agit d’une estimation basée sur le cycle cultural, le rendement et les dates sélectionnés. Confirmez maturité, météo, contrats, humidité, qualité, main-d’œuvre, transport et stockage avant toute décision.',
      }}
    >
      <CalculatorShell.Inputs>
        <div className="p-3 rounded-xl border bg-card space-y-1">
          <Label className="text-xs font-bold text-foreground">
            {tr('Planting date', 'تاريخ الزراعة', 'Date de plantation')}
          </Label>
          <Input
            aria-label={tr('Planting date', 'تاريخ الزراعة', 'Date de plantation')}
            type="date"
            value={plantingDate}
            onChange={e => setPlantingDate(e.target.value)}
            className="h-9 text-xs font-mono font-bold"
          />
          <div className="text-[10px] text-muted-foreground">
            {tr(
              'Day 1 of the crop lifecycle',
              'اليوم الأول من دورة حياة المحصول',
              'Jour 1 du cycle cultural',
            )}
          </div>
        </div>
        <CalculatorShell.InputField
          label={tr('Field area (ha)', 'مساحة الحقل (هـ)', 'Surface (ha)')}
          value={String(areaHa)}
          onChange={v => setAreaHa(numberValue(v))}
          step="0.1"
          helper={tr(
            'Total planted surface',
            'المساحة المزروعة الإجمالية',
            'Surface totale plantée',
          )}
        />
        <CalculatorShell.InputField
          label={tr(
            'Expected yield (t/ha)',
            'الإنتاج المتوقع (طن/هـ)',
            'Rendement prévu (t/ha)',
          )}
          value={String(yieldTPerHa)}
          onChange={v => setYieldTPerHa(numberValue(v))}
          step="0.1"
          helper={tr(
            'Average expected yield per hectare',
            'متوسط الإنتاج المتوقع لكل هكتار',
            'Rendement moyen attendu par hectare',
          )}
        />
        <CalculatorShell.InputField
          label={tr(
            'Expected harvest moisture (%)',
            'رطوبة الحصاد المتوقعة (%)',
            'Humidité prévue à la récolte (%)',
          )}
          value={String(moisture)}
          onChange={v => setMoisture(numberValue(v))}
          step="0.5"
          helper={tr(
            'Affects drying + storage decisions',
            'تؤثر على قرارات التجفيف والتخزين',
            'Affecte séchage + stockage',
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CalculatorShell.InputField
            label={tr(
              'Storage capacity (t)',
              'سعة التخزين (طن)',
              'Capacité de stockage (t)',
            )}
            value={String(storageCapacity)}
            onChange={v => setStorageCapacity(numberValue(v))}
            step="1"
          />
          <CalculatorShell.InputField
            label={tr(
              'Current inventory (t)',
              'المخزون الحالي (طن)',
              'Stock actuel (t)',
            )}
            value={String(currentInventory)}
            onChange={v => setCurrentInventory(numberValue(v))}
            step="1"
          />
        </div>
      </CalculatorShell.Inputs>
      <CalculatorShell.Results>
        {!result && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300"
          >
            {tr(
              'Enter a valid crop, planting date, positive area, and non-negative yield.',
              'أدخل محصولاً صالحاً وتاريخ زراعة ومساحة موجبة وإنتاجاً غير سالب.',
              'Saisissez une culture valide, une date, une surface positive et un rendement non négatif.',
            )}
          </div>
        )}
        {result && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <CalculatorShell.MetricTile
                label={tr(
                  'Harvest window',
                  'نافذة الحصاد',
                  'Fenêtre de récolte',
                )}
                value={`${formatDate(language, result.harvestStartDate)}`}
                helper={`→ ${formatDate(language, result.harvestEndDate)}`}
                color="amber"
              />
              <CalculatorShell.MetricTile
                label={tr('Expected volume', 'الإنتاج المتوقع', 'Volume prévu')}
                value={result.totalExpectedVolumeT.toFixed(1)}
                unit="t"
                color="amber"
              />
              <CalculatorShell.MetricTile
                label={tr(
                  'Harvest labor',
                  'عمالة الحصاد',
                  'Main-d’œuvre récolte',
                )}
                value={result.totalHarvestLaborDays.toFixed(1)}
                unit={tr('days', 'يوم', 'jours')}
                color="default"
              />
              <CalculatorShell.MetricTile
                label={tr('Storage fit', 'ملاءمة التخزين', 'Adéquation stockage')}
                value={
                  result.storageStatus === 'fits'
                    ? tr('Fits', 'مناسب', 'Compatible')
                    : result.storageStatus === 'tight'
                      ? tr('Tight', 'ضيق', 'Serré')
                      : tr('Over capacity', 'تجاوز السعة', 'Capacité dépassée')
                }
                color={
                  result.storageStatus === 'fits'
                    ? 'emerald'
                    : result.storageStatus === 'tight'
                      ? 'amber'
                      : 'rose'
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {tr('Season timing', 'توقيت الموسم', 'Calendrier de saison')}
                  </span>
                  <Badge variant="secondary">
                    {result.daysUntilHarvest === 0
                      ? tr('Ready / due', 'حان أو جاهز', 'À faire / prêt')
                      : `${result.daysUntilHarvest} ${tr('days', 'يوماً', 'jours')}`}
                  </Badge>
                </div>
                <div className="mt-2 text-sm font-semibold">
                  {formatDate(language, result.harvestStartDate)} —{' '}
                  {formatDate(language, result.harvestEndDate)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {tr('Season end estimate:', 'تقدير نهاية الموسم:', 'Fin de saison estimée:')}{' '}
                  {formatDate(language, result.seasonEndDate)}
                </div>
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4 dark:border-sky-900 dark:bg-sky-950/20">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {tr('Storage balance', 'رصيد التخزين', 'Bilan du stockage')}
                </div>
                <div className="mt-2 text-sm font-semibold">
                  {result.storageAvailableT.toFixed(1)} t{' '}
                  {tr(
                    'available before harvest',
                    'متاحة قبل الحصاد',
                    'disponibles avant récolte',
                  )}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {tr(
                    'After expected production:',
                    'بعد الإنتاج المتوقع:',
                    'Après production prévue:',
                  )}{' '}
                  {result.storageRemainingT.toFixed(1)} t{' '}
                  {tr('remaining', 'متبقية', 'restantes')}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5 text-amber-600" />
                {tr(
                  'Harvest lots and operations',
                  'دفعات وعمليات الحصاد',
                  'Lots et opérations de récolte',
                )}
              </div>
              {result.lots.map(lot => (
                <div
                  key={lot.id}
                  className="rounded-xl border bg-background/70 p-3 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">
                        {tr('Harvest operation', 'عملية حصاد', 'Opération de récolte')} ·{' '}
                        {stageLabel(language, lot.operation.stage)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatDate(language, lot.startDate)}
                        {lot.endDate !== lot.startDate
                          ? ` — ${formatDate(language, lot.endDate)}`
                          : ''}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Badge variant="outline">
                        {priorityLabel(language, lot.operation.priority)}
                      </Badge>
                      <Badge variant="secondary">
                        {skillLabel(language, lot.operation.skill)}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <div>
                      <div className="text-muted-foreground">
                        {tr('Volume', 'الإنتاج', 'Volume')}
                      </div>
                      <div className="font-semibold">
                        {lot.expectedVolumeT.toFixed(1)} t
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">
                        {tr('Dry matter', 'المادة الجافة', 'Matière sèche')}
                      </div>
                      <div className="font-semibold">
                        {lot.expectedDryVolumeT.toFixed(1)} t
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">
                        {tr('Labor', 'العمالة', 'Main-d’œuvre')}
                      </div>
                      <div className="font-semibold">
                        {lot.laborDays.toFixed(1)} {tr('days', 'يوم', 'jours')}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">
                        {tr('Equipment', 'المعدات', 'Équipement')}
                      </div>
                      <div className="font-semibold">
                        {lot.operation.equipment ||
                          tr(
                            'Standard harvest crew',
                            'فريق حصاد قياسي',
                            'Équipe de récolte standard',
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {result.warnings.length > 0 && (
              <div className="space-y-2">
                {result.warnings.map((warning, index) => {
                  const lookup = WARNING_TR[warning];
                  const text = lookup
                    ? tr(lookup.en, lookup.ar, lookup.fr)
                    : tr(warning, warning, warning);
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200"
                    >
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                      <span>{text}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
