'use client';

import { useState, useMemo } from 'react';
import { Flame, Calculator, Sparkles, Copy, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
  type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

const TITLE: TrilingualString = {
  en: 'Biogas Digester Calculator',
  ar: 'حاسبة هاضم الغاز الحيوي',
  fr: 'Calculateur de Digesteur Biogaz',
};

const DESC: TrilingualString = {
  en: 'Biogas yield · digester sizing · energy + revenue · 5 substrates',
  ar: 'إنتاج الغاز الحيوي · تحديد حجم الهاضم · الطاقة + الإيرادات · 5 مواد أولية',
  fr: 'Production de biogaz · dimensionnement · énergie + revenus · 5 substrats',
};

const PILL_LABEL: TrilingualString = {
  en: 'Substrate:',
  ar: 'المادة الأولية:',
  fr: 'Substrat :',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Use CHP (combined heat + power) for 85% efficiency: 35% electricity + 50% heat. Digestate is excellent organic fertilizer — NPK retains 80-90% of feed value.',
  ar: 'استخدم التوليد المشترك للحرارة والكهرباء (CHP) بكفاءة 85%: كهرباء 35% + حرارة 50%. المخلفات السائلة للهضم سماد عضوي ممتاز — يحتفظ NPK بنسبة 80–90% من قيمة التغذية.',
  fr: 'Utilisez la cogénération (CHP) pour 85% d’efficacité : 35% électricité + 50% chaleur. Le digestat est un excellent engrais organique — la NPK y est conservée à 80–90%.',
};

const SUBSTRATES: Record<string, { name: string; emoji: string; vs: number; bmp: number; cn: number }> = {
  dairy_manure: { name: 'Dairy manure', emoji: '🐄', vs: 80, bmp: 250, cn: 18 },
  poultry_manure: { name: 'Poultry manure', emoji: '🐔', vs: 75, bmp: 350, cn: 10 },
  food_waste: { name: 'Food waste', emoji: '🍽️', vs: 90, bmp: 500, cn: 15 },
  crop_residue: { name: 'Crop residue (straw)', emoji: '🌾', vs: 85, bmp: 300, cn: 60 },
  grass: { name: 'Grass clippings', emoji: '🌿', vs: 85, bmp: 400, cn: 15 },
};

const SUBSTRATE_LABELS: Record<string, TrilingualString> = {
  dairy_manure: { en: 'Dairy manure', ar: 'روث الأبقار الحلوب', fr: 'Fumier bovin laitier' },
  poultry_manure: { en: 'Poultry manure', ar: 'روث الدواجن', fr: 'Fiente de volaille' },
  food_waste: { en: 'Food waste', ar: 'مخلفات الطعام', fr: 'Déchets alimentaires' },
  crop_residue: { en: 'Crop residue (straw)', ar: 'مخلفات المحاصيل (قش)', fr: 'Résidus de culture (paille)' },
  grass: { en: 'Grass clippings', ar: 'قصاصات الأعشاب', fr: 'Tonture de gazon' },
};

export function BiogasDigesterCalculator() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [substrate, setSubstrate] = useState('dairy_manure');
  const [dailyFeed, setDailyFeed] = useState('50');
  const [hrt, setHrt] = useState('25');
  const [methanePct, setMethanePct] = useState('60');
  const [electricityPrice, setElectricityPrice] = useState('0.12');
  const [copied, setCopied] = useState<boolean>(false);

  const result = useMemo(() => {
    const sub = SUBSTRATES[substrate];
    const feed = parseFloat(dailyFeed);
    const h = parseFloat(hrt);
    const ch4 = parseFloat(methanePct) / 100;
    const ep = parseFloat(electricityPrice);
    if (!Number.isFinite(feed) || !Number.isFinite(h)) return null;

    const vsPerDay = feed * sub.vs / 100; // kg VS/day
    const biogasPerDay = vsPerDay * sub.bmp * 0.7 / 1000; // m³/day (70% of BMP realistic)
    const ch4PerDay = biogasPerDay * ch4;
    const energyPerDay = ch4PerDay * 9.94; // kWh/day
    const electricityPerDay = energyPerDay * 0.35; // 35% generator efficiency
    const dailyRevenue = electricityPerDay * ep;
    const digesterVolume = (feed * 0.1) * h; // assume 10% solids → 10× dilution = volume m³
    const annualBiogas = biogasPerDay * 365;
    const annualRevenue = dailyRevenue * 365;
    const cn = sub.cn;

    return { sub, vsPerDay, biogasPerDay, ch4PerDay, energyPerDay, electricityPerDay, dailyRevenue, digesterVolume, annualBiogas, annualRevenue, cn };
  }, [substrate, dailyFeed, hrt, methanePct, electricityPrice]);

  const handleReset = () => {
    setSubstrate('dairy_manure');
    setDailyFeed('50');
    setHrt('25');
    setMethanePct('60');
    setElectricityPrice('0.12');
    toast({
      title: tr('Reset to Defaults', 'تمت استعادة القيم الافتراضية', 'Valeurs par défaut rétablies'),
    });
  };

  const handleCopySummary = () => {
    if (!result) return;
    const text = `
=== BIOGAS DIGESTER ANALYSIS ===
Substrate: ${result.sub.emoji} ${tr(SUBSTRATE_LABELS[substrate].en, SUBSTRATE_LABELS[substrate].ar, SUBSTRATE_LABELS[substrate].fr)}

Feedstock:
• Daily feed: ${parseFloat(dailyFeed)} kg/day
• HRT: ${parseFloat(hrt)} days
• CH₄ content: ${parseFloat(methanePct)}%
• Electricity price: $${parseFloat(electricityPrice)}/kWh

Daily Output:
• Biogas: ${result.biogasPerDay.toFixed(1)} m³/day
• CH₄ energy: ${result.energyPerDay.toFixed(1)} kWh/day
• Electricity (35% eff.): ${result.electricityPerDay.toFixed(1)} kWh/day
• Daily revenue: $${result.dailyRevenue.toFixed(2)}

Sizing:
• Digester volume: ${result.digesterVolume.toFixed(1)} m³
• Annual revenue: $${result.annualRevenue.toFixed(0)}
• C:N ratio: ${result.cn}:1
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: tr('Summary Copied!', 'تم نسخ التقرير!', 'Résumé copié !'),
      description: tr('Biogas analysis report copied to clipboard.', 'تم نسخ تقرير تحليل الغاز الحيوي إلى الحافظة.', 'Rapport copié dans le presse-papiers.'),
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const pills: CalculatorPill[] = Object.entries(SUBSTRATES).map(([k, v]) => {
    const labels = SUBSTRATE_LABELS[k];
    return {
      key: k,
      emoji: v.emoji,
      label: tr(labels.en, labels.ar, labels.fr),
    };
  });

  const activeLabel = SUBSTRATE_LABELS[substrate];

  return (
    <CalculatorShell
      icon={Flame}
      title={TITLE}
      description={DESC}
      badge="Renewable Energy"
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
      activePill={substrate}
      onPillClick={(k) => setSubstrate(k)}
      pillLabel={PILL_LABEL}
      protocolNote={PROTOCOL_NOTE}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-amber-600" />
              {tr('Digester Operating Parameters', 'مدخلات تشغيل الهاضم', 'Paramètres de fonctionnement du digesteur')}
            </span>
            <span className="text-xs font-bold bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 rounded-lg px-2 py-0.5">
              {SUBSTRATES[substrate].emoji} {tr(activeLabel.en, activeLabel.ar, activeLabel.fr)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CalculatorShell.InputField
              label={tr('Daily feed (kg/day)', 'التغذية اليومية (كغ/يوم)', 'Alimentation quotidienne (kg/j)')}
              value={dailyFeed}
              onChange={setDailyFeed}
              step="5"
              helper={tr('Organic substrate mass fed per day', 'كتلة المادة العضوية المُدخلة يومياً', 'Masse de substrat apportée par jour')}
            />
            <CalculatorShell.InputField
              label={tr('HRT (days)', 'زمن الاحتجز الهيدروليكي (يوم)', 'Temps de rétention (jours)')}
              value={hrt}
              onChange={setHrt}
              step="5"
              helper={tr('Hydraulic retention time', 'زمن الاحتجاز الهيدروليكي', 'Temps de séjour hydraulique')}
            />
            <CalculatorShell.InputField
              label={tr('CH₄ content (%)', 'محتوى الميثان (%)', 'Teneur CH₄ (%)')}
              value={methanePct}
              onChange={setMethanePct}
              step="5"
              helper={tr('Methane fraction in biogas', 'نسبة الميثان في الغاز الحيوي', 'Fraction de méthane dans le biogaz')}
            />
            <CalculatorShell.InputField
              label={tr('Electricity ($/kWh)', 'الكهرباء (دولار/ك.و.س)', 'Électricité ($/kWh)')}
              value={electricityPrice}
              onChange={setElectricityPrice}
              step="0.01"
              helper={tr('Sale tariff for electricity', 'تعريفة بيع الكهرباء', 'Tarif de vente de l’électricité')}
            />
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
          <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-amber-50 via-transparent to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
            <span className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              {tr('Energy & Revenue Output', 'مخرجات الطاقة والإيرادات', 'Production d’énergie et revenus')}
            </span>
            {result && (
              <span className="font-mono text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 rounded-lg px-2 py-0.5">
                {result.biogasPerDay.toFixed(1)} m³/d
              </span>
            )}
          </div>

          {result && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <CalculatorShell.MetricTile
                  label={tr('Daily Biogas', 'الغاز الحيوي اليومي', 'Biogaz quotidien')}
                  value={result.biogasPerDay.toFixed(1)}
                  unit="m³/d"
                  color="amber"
                />
                <CalculatorShell.MetricTile
                  label={tr('CH₄ Energy', 'طاقة CH₄', 'Énergie CH₄')}
                  value={result.energyPerDay.toFixed(1)}
                  unit="kWh/d"
                  color="amber"
                />
                <CalculatorShell.MetricTile
                  label={tr('Electricity', 'الكهرباء', 'Électricité')}
                  value={result.electricityPerDay.toFixed(1)}
                  unit="kWh/d"
                  color="emerald"
                />
                <CalculatorShell.MetricTile
                  label={tr('Daily Revenue', 'الإيراد اليومي', 'Revenu quotidien')}
                  value={`$${result.dailyRevenue.toFixed(2)}`}
                  color="emerald"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <CalculatorShell.MetricTile
                  label={tr('Digester Volume', 'حجم الهاضم', 'Volume du digesteur')}
                  value={result.digesterVolume.toFixed(1)}
                  unit="m³"
                  color="default"
                />
                <CalculatorShell.MetricTile
                  label={tr('Annual Revenue', 'الإيراد السنوي', 'Revenu annuel')}
                  value={`$${result.annualRevenue.toFixed(0)}`}
                  unit="/yr"
                  color="emerald"
                />
              </div>

              {result.cn < 15 ? (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-700 dark:border-amber-900 dark:text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    <strong>{tr(`C:N = ${result.cn}:1 — too low.`, `C:N = ${result.cn}:1 — منخفض جداً.`, `C:N = ${result.cn}:1 — trop bas.`)}</strong>{' '}
                    {tr('Add carbon-rich co-substrate (straw, crop residue) to reach 20-30:1 for optimal digestion.', 'أضف مادة مساعدة غنية بالكربون (القش أو مخلفات المحاصيل) للوصول إلى 20–30:1 وتحقيق الهضم الأمثل.', 'Ajoutez un co-substrat riche en carbone (paille, résidus) pour atteindre 20–30:1.')}
                  </span>
                </div>
              ) : result.cn > 35 ? (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-700 dark:border-amber-900 dark:text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    <strong>{tr(`C:N = ${result.cn}:1 — too high.`, `C:N = ${result.cn}:1 — مرتفع جداً.`, `C:N = ${result.cn}:1 — trop élevé.`)}</strong>{' '}
                    {tr('Add nitrogen-rich co-substrate (manure, food waste) to reach 20-30:1.', 'أضف مادة مساعدة غنية بالنيتروجين (الروث أو مخلفات الطعام) للوصول إلى 20–30:1.', 'Ajoutez un co-substrat riche en azote (fumier, déchets alimentaires) pour atteindre 20–30:1.')}
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs leading-relaxed text-emerald-700 dark:border-emerald-900 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    <strong>{tr(`C:N = ${result.cn}:1 — optimal.`, `C:N = ${result.cn}:1 — مثالي.`, `C:N = ${result.cn}:1 — optimal.`)}</strong>{' '}
                    {tr(`Mesophilic digester (35°C) with ${result.digesterVolume.toFixed(0)} m³ working volume.`, `هاضم متوسط الحرارة (35°م) بحجم تشغيل ${result.digesterVolume.toFixed(0)} م³.`, `Digesteur mésophile (35°C) — volume utile ${result.digesterVolume.toFixed(0)} m³.`)}
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
