'use client';

import { useState, useMemo } from 'react';
import {
  CloudHail,
  AlertTriangle,
  CheckCircle2,
  Copy,
  RotateCcw,
} from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import {
  CalculatorShell,
  type TrilingualString,
  type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

// ---------------------------------------------------------------------------
// Trilingual content
// ---------------------------------------------------------------------------

const TITLE: TrilingualString = {
  en: 'Hail Damage Estimator',
  ar: 'مقدّر أضرار البَرَد',
  fr: 'Estimateur de dégâts de grêle',
};

const DESCRIPTION: TrilingualString = {
  en: 'Crop stage × hail size × defoliation → estimated yield loss using USDA crop insurance tables.',
  ar: 'مرحلة المحصول × حجم البَرَد × إزالة الأوراق → فقد المحصول المقدّر وفق جداول تأمين المحاصيل الأمريكية.',
  fr: "Stade cultural × taille de grêle × défoliation → perte de rendement estimée (tables USDA).",
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Silking/flowering stage is most vulnerable. Early vegetative stages can recover from significant defoliation. Document damage within 72 hr for insurance claims.',
  ar: 'مرحلة ظهور الحرير/الإزهار هي الأكثر تعرضاً للخطر. يمكن للمراحل الخضرية المبكرة التعافي من إزالة أوراق كبيرة. وثّق الضرر خلال 72 ساعة لمطالبات التأمين.',
  fr: "Le stade floraison/épiaison est le plus vulnérable. Les stades végétatifs précoces peuvent se remettre d'une défoliation importante. Documentez les dégâts sous 72 h pour l'assurance.",
};

const CROP_LABELS: Record<string, TrilingualString> = {
  corn: { en: 'Corn', ar: 'الذرة', fr: 'Maïs' },
  soybean: { en: 'Soybean', ar: 'فول الصويا', fr: 'Soja' },
  wheat: { en: 'Wheat', ar: 'القمح', fr: 'Blé' },
};

const CROP_PILLS: CalculatorPill[] = [
  { key: 'corn', label: '🌽 Corn', emoji: '🌽' },
  { key: 'soybean', label: '🫘 Soybean', emoji: '🫘' },
  { key: 'wheat', label: '🌾 Wheat', emoji: '🌾' },
];

const STAGE_LABELS: Record<string, TrilingualString> = {
  seedling: { en: 'Seedling', ar: 'بادرة', fr: 'Plantule' },
  v6: { en: 'V6 (vegetative)', ar: 'V6 (نمو خضري)', fr: 'V6 (végétatif)' },
  v10: { en: 'V10', ar: 'V10', fr: 'V10' },
  tassel: { en: 'Tasseling', ar: 'ظهور النورات', fr: 'Floraison mâle' },
  silking: { en: 'Silking', ar: 'ظهور الحرير', fr: 'Soies' },
  milk: { en: 'Milk', ar: 'طور الحليب', fr: 'Lactux' },
  dough: { en: 'Dough', ar: 'طور العجين', fr: 'Pâteux' },
  dent: { en: 'Dent', ar: 'طور التسنين', fr: 'Denté' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HailDamageEstimator() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [crop, setCrop] = useState('corn');
  const [stage, setStage] = useState('v6');
  const [hailSize, setHailSize] = useState('20');
  const [defoliation, setDefoliation] = useState('30');
  const [copied, setCopied] = useState(false);

  // Simplified yield loss tables (USDA crop insurance) — UNCHANGED
  const result = useMemo(() => {
    const hs = parseFloat(hailSize), df = parseFloat(defoliation);
    if (!Number.isFinite(hs)) return null;
    // Base loss from defoliation by stage
    const stageFactor: Record<string, number> = { seedling: 0.2, v6: 0.3, v10: 0.5, tassel: 0.9, silking: 1.0, milk: 0.7, dough: 0.4, dent: 0.2 };
    const sf = stageFactor[stage] ?? 0.5;
    const defolLoss = df * sf * 0.01;
    // Additional loss from stalk/stem bruising by hail size
    const stalkLoss = hs > 30 ? 0.15 : hs > 20 ? 0.08 : hs > 10 ? 0.03 : 0;
    const totalLoss = Math.min(0.95, defolLoss + stalkLoss);
    return { totalLoss: totalLoss * 100, defolLoss: defolLoss * 100, stalkLoss: stalkLoss * 100 };
  }, [crop, stage, hailSize, defoliation]);

  const handleReset = () => {
    setCrop('corn');
    setStage('v6');
    setHailSize('20');
    setDefoliation('30');
    toast({
      title: tr('Reset to Defaults', 'تمت استعادة القيم الافتراضية', 'Valeurs par défaut rétablies'),
    });
  };

  const handleCopySummary = () => {
    if (!result) return;
    const cropName = tr(CROP_LABELS[crop].en, CROP_LABELS[crop].ar, CROP_LABELS[crop].fr);
    const stageName = tr(STAGE_LABELS[stage].en, STAGE_LABELS[stage].ar, STAGE_LABELS[stage].fr);
    const text = `=== HAIL DAMAGE ESTIMATE ===
Crop: ${cropName}
Stage: ${stageName}
Hail size: ${hailSize} mm
Defoliation: ${defoliation}%

Estimated Yield Loss: ${result.totalLoss.toFixed(0)}%
  - Defoliation loss: ${result.defolLoss.toFixed(0)}%
  - Stalk bruising: ${result.stalkLoss.toFixed(0)}%
${result.totalLoss > 30 ? 'SEVERE damage — contact insurance within 72 hr.' : result.totalLoss > 10 ? 'MODERATE damage — monitor recovery.' : 'MINIMAL damage — full recovery expected.'}
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: tr('Summary Copied!', 'تم نسخ التقرير!', 'Résumé copié !'),
      description: tr('Hail damage report copied to clipboard.', 'تم نسخ تقرير أضرار البَرَد إلى الحافظة.', 'Rapport copié dans le presse-papiers.'),
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const actions = [
    {
      icon: Copy,
      label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
      onClick: handleCopySummary,
      variant: 'primary' as const,
      showCheck: copied,
    },
    {
      icon: RotateCcw,
      label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
      onClick: handleReset,
      variant: 'ghost' as const,
    },
  ];

  return (
    <CalculatorShell
      icon={CloudHail}
      title={TITLE}
      description={DESCRIPTION}
      badge="USDA"
      accent="sky"
      actions={actions}
      pills={CROP_PILLS}
      activePill={crop}
      onPillClick={setCrop}
      pillLabel={{ en: 'Select Crop:', ar: 'اختر المحصول:', fr: 'Culture :' }}
      protocolNote={PROTOCOL_NOTE}
    >
      {/* ---------------- Inputs column ---------------- */}
      <CalculatorShell.Inputs>
        <CalculatorShell.InputField
          label={tr('Hail size (mm)', 'حجم البَرَد (ملم)', 'Taille de grêle (mm)')}
          value={hailSize}
          onChange={setHailSize}
          step="5"
          helper={tr('Largest stone diameter', 'قطر أكبر حجارة', 'Diamètre du plus gros grêlon')}
        />

        <CalculatorShell.InputField
          label={tr('Defoliation (%)', 'إزالة الأوراق (%)', 'Défoliation (%)')}
          value={defoliation}
          onChange={setDefoliation}
          step="5"
          helper={tr('0–100% leaf area destroyed', '0–100% من مساحة الأوراق المتضررة', '0–100% surface foliaire détruite')}
        />

        {/* Stage select (kept as dropdown — too many options for pills) */}
        <div className="p-3 rounded-xl border bg-card space-y-1">
          <Label className="text-xs font-bold text-foreground">
            {tr('Growth Stage', 'مرحلة النمو', 'Stade de croissance')}
          </Label>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            aria-label={tr('Growth stage', 'مرحلة النمو', 'Stade de croissance')}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-mono font-bold"
          >
            {Object.entries(STAGE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{tr(v.en, v.ar, v.fr)}</option>
            ))}
          </select>
          <div className="text-[10px] text-muted-foreground">
            {tr('Silking/tasseling is most vulnerable', 'ظهور الحرير/النورات هو الأكثر حساسية', 'Floraison = stade le plus sensible')}
          </div>
        </div>
      </CalculatorShell.Inputs>

      {/* ---------------- Results column ---------------- */}
      <CalculatorShell.Results>
        {result && (
          <>
            <CalculatorShell.MetricTile
              label={tr('Estimated Yield Loss', 'فقد المحصول المقدّر', 'Perte de rendement estimée')}
              value={`${result.totalLoss.toFixed(0)}%`}
              color={result.totalLoss > 30 ? 'rose' : result.totalLoss > 10 ? 'amber' : 'emerald'}
            />

            <div className="grid grid-cols-2 gap-3">
              <CalculatorShell.MetricTile
                label={tr('Defoliation Loss', 'فقد إزالة الأوراق', 'Perte par défoliation')}
                value={`${result.defolLoss.toFixed(0)}%`}
                color="sky"
              />
              <CalculatorShell.MetricTile
                label={tr('Stalk Bruising', 'كدمات الساق', 'Meurtrissure tige')}
                value={`${result.stalkLoss.toFixed(0)}%`}
                color="amber"
              />
            </div>

            {/* Status banner — Severe / Moderate / Minimal */}
            {result.totalLoss > 30 ? (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-sm leading-relaxed text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong>{tr('Severe damage.', 'ضرر شديد.', 'Dégâts sévères.')}</strong>{' '}
                  {tr(
                    'Contact crop insurance within 72 hr. Document with photos. Consider replanting if <30 days left in season.',
                    'تواصل مع تأمين المحاصيل خلال 72 ساعة. وثّق الضرر بالصور. فكّر في إعادة الزراعة إذا بقي أقل من 30 يوماً في الموسم.',
                    "Contactez l'assurance sous 72 h. Documentez par photos. Envisagez un resemis si <30 jours restent."
                  )}
                </span>
              </div>
            ) : result.totalLoss > 10 ? (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm leading-relaxed text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong>{tr('Moderate damage.', 'ضرر متوسط.', 'Dégâts modérés.')}</strong>{' '}
                  {tr(
                    'Monitor recovery. Crop may compensate if enough growing season remains.',
                    'راقب التعافي. قد يعوّض المحصول الضرر إذا بقي وقت كافٍ من موسم النمو.',
                    'Surveillez la récupération. La culture peut compenser si la saison le permet.'
                  )}
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-sm leading-relaxed text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong>{tr('Minimal damage.', 'ضرر محدود.', 'Dégâts mineurs.')}</strong>{' '}
                  {tr(
                    'Crop should recover fully. Scout for secondary disease entry through bruised tissue.',
                    'ينبغي أن يتعافى المحصول بالكامل. افحص احتمال دخول أمراض ثانوية عبر الأنسجة المتضررة.',
                    "Récupération totale prévue. Surveillez l'entrée de maladies secondaires via les tissus meurtris."
                  )}
                </span>
              </div>
            )}
          </>
        )}
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
