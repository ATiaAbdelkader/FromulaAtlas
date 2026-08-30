'use client';

import { useState, useMemo } from 'react';
import {
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Copy,
  RotateCcw,
} from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
  type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

// ---------------------------------------------------------------------------
// Trilingual content
// ---------------------------------------------------------------------------

const TITLE: TrilingualString = {
  en: 'Yield Monitor Calibrator',
  ar: 'معاير مراقب الإنتاجية',
  fr: 'Calibreur de moniteur de rendement',
};

const DESCRIPTION: TrilingualString = {
  en: 'Moisture correction · flow calibration · test weight assessment for combine yield monitors.',
  ar: 'تصحيح الرطوبة · معايرة التدفق · تقييم الوزن الاختباري لمراقبات الإنتاجية في الحصادات.',
  fr: 'Correction humidité · calibrage débit · évaluation du poids spécifique.',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Calibrate per crop + moisture range. Low test weight indicates immature or damaged grain — may affect pricing.',
  ar: 'عاير كل محصول ولكل نطاق رطوبة. يشير الوزن الاختباري المنخفض إلى حبوب غير ناضجة أو متضررة — وقد يؤثر ذلك في التسعير.',
  fr: "Calibrez par culture et par gamme d'humidité. Un poids spécifique bas indique un grain immature ou endommagé — peut impacter le prix.",
};

const CROP_PILLS: CalculatorPill[] = [
  { key: 'wheat', label: '🌾 Wheat', emoji: '🌾' },
  { key: 'corn', label: '🌽 Corn', emoji: '🌽' },
  { key: 'soybean', label: '🫘 Soybean', emoji: '🫘' },
  { key: 'barley', label: '🌾 Barley', emoji: '🌾' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function YieldMonitorCalibrator() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [crop, setCrop] = useState('wheat');
  const [monitorWeight, setMonitorWeight] = useState('2500');
  const [actualWeight, setActualWeight] = useState('2400');
  const [monitorMoisture, setMonitorMoisture] = useState('14');
  const [standardMoisture, setStandardMoisture] = useState('13');
  const [testWeight, setTestWeight] = useState('75');
  const [copied, setCopied] = useState(false);

  // Calculation — UNCHANGED
  const result = useMemo(() => {
    const mw = parseFloat(monitorWeight), aw = parseFloat(actualWeight);
    const mm = parseFloat(monitorMoisture), sm = parseFloat(standardMoisture);
    const tw = parseFloat(testWeight);
    if (!Number.isFinite(mw) || !Number.isFinite(aw)) return null;
    const cfMoisture = (100 - mm) / (100 - sm);
    const cfFlow = aw / mw;
    const correctedYield = mw * cfMoisture * cfFlow / 1000; // t/ha simplified
    const twStatus = crop === 'wheat' ? (tw >= 76 ? 'good' : tw >= 72 ? 'fair' : 'poor') : crop === 'corn' ? (tw >= 70 ? 'good' : tw >= 65 ? 'fair' : 'poor') : 'check';
    return { cfMoisture, cfFlow, correctedYield, twStatus };
  }, [crop, monitorWeight, actualWeight, monitorMoisture, standardMoisture, testWeight]);

  const handleReset = () => {
    setCrop('wheat');
    setMonitorWeight('2500');
    setActualWeight('2400');
    setMonitorMoisture('14');
    setStandardMoisture('13');
    setTestWeight('75');
    toast({
      title: tr('Reset to Defaults', 'تمت استعادة القيم الافتراضية', 'Valeurs par défaut rétablies'),
    });
  };

  const handleCopySummary = () => {
    if (!result) return;
    const text = `=== YIELD MONITOR CALIBRATION ===
Crop: ${crop}
Monitor weight: ${monitorWeight} kg | Actual weight: ${actualWeight} kg
Moisture: monitor ${monitorMoisture}% | standard ${standardMoisture}%
Test weight: ${testWeight} kg/hL

Calibration factors:
  Moisture CF: ${result.cfMoisture.toFixed(3)}
  Flow CF:     ${result.cfFlow.toFixed(3)}
  Corrected yield: ${result.correctedYield.toFixed(2)} t/ha
  Test weight status: ${result.twStatus}
${Math.abs(result.cfFlow - 1) < 0.05 ? 'Monitor is accurate (±5%).' : `Monitor off by ${((result.cfFlow - 1) * 100).toFixed(1)}% — recalibrate with 6–8 loads.`}
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: tr('Summary Copied!', 'تم نسخ التقرير!', 'Résumé copié !'),
      description: tr('Calibration report copied to clipboard.', 'تم نسخ تقرير المعايرة إلى الحافظة.', 'Rapport copié dans le presse-papiers.'),
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

  const twStatusLabel = result
    ? tr(
        result.twStatus,
        result.twStatus === 'good' ? 'جيد' : result.twStatus === 'fair' ? 'مقبول' : result.twStatus === 'poor' ? 'ضعيف' : 'تحقق',
        result.twStatus === 'good' ? 'Bon' : result.twStatus === 'fair' ? 'Acceptable' : result.twStatus === 'poor' ? 'Faible' : 'Vérifier',
      )
    : '';

  const twColor = result?.twStatus === 'good' ? 'emerald' : result?.twStatus === 'fair' ? 'amber' : 'rose';

  return (
    <CalculatorShell
      icon={Gauge}
      title={TITLE}
      description={DESCRIPTION}
      badge="Precision Ag"
      accent="emerald"
      actions={actions}
      pills={CROP_PILLS}
      activePill={crop}
      onPillClick={setCrop}
      pillLabel={{ en: 'Select Crop:', ar: 'اختر المحصول:', fr: 'Culture :' }}
      protocolNote={PROTOCOL_NOTE}
    >
      {/* ---------------- Inputs column ---------------- */}
      <CalculatorShell.Inputs>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CalculatorShell.InputField
            label={tr('Monitor weight (kg)', 'وزن المراقب (كغ)', 'Poids moniteur (kg)')}
            value={monitorWeight}
            onChange={setMonitorWeight}
            step="10"
            helper={tr('Mass recorded by monitor', 'الكتلة المسجلة بواسطة المراقب', 'Masse enregistrée')}
          />
          <CalculatorShell.InputField
            label={tr('Actual weight (kg)', 'الوزن الفعلي (كغ)', 'Poids réel (kg)')}
            value={actualWeight}
            onChange={setActualWeight}
            step="10"
            helper={tr('Calibrated scale weight', 'وزن الميزان المعاير', 'Poids balance calibrée')}
          />
          <CalculatorShell.InputField
            label={tr('Monitor moisture (%)', 'رطوبة المراقب (%)', 'Humidité moniteur (%)')}
            value={monitorMoisture}
            onChange={setMonitorMoisture}
            step="0.5"
            helper={tr('As-measured moisture', 'الرطوبة المقاسة', 'Humidité mesurée')}
          />
          <CalculatorShell.InputField
            label={tr('Standard moisture (%)', 'الرطوبة القياسية (%)', 'Humidité standard (%)')}
            value={standardMoisture}
            onChange={setStandardMoisture}
            step="0.5"
            helper={tr('Trade standard (e.g. 13%)', 'القياس التجاري (مثال 13%)', 'Standard commercial (ex. 13 %)')}
          />
        </div>

        <CalculatorShell.InputField
          label={tr('Test weight (kg/hL)', 'الوزن الاختباري (كغ/هكتولتر)', 'Poids spécifique (kg/hL)')}
          value={testWeight}
          onChange={setTestWeight}
          step="0.5"
          helper={tr('Bulk density of grain', 'الكثافة الظاهرية للحبوب', 'Densité apparente du grain')}
        />
      </CalculatorShell.Inputs>

      {/* ---------------- Results column ---------------- */}
      <CalculatorShell.Results>
        {result && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <CalculatorShell.MetricTile
                label={tr('Moisture CF', 'معامل تصحيح الرطوبة', 'Facteur humidité')}
                value={result.cfMoisture.toFixed(3)}
                color="emerald"
              />
              <CalculatorShell.MetricTile
                label={tr('Flow CF', 'معامل تصحيح التدفق', 'Facteur débit')}
                value={result.cfFlow.toFixed(3)}
                color={Math.abs(result.cfFlow - 1) < 0.05 ? 'emerald' : 'amber'}
              />
              <CalculatorShell.MetricTile
                label={tr('Test Weight', 'الوزن الاختباري', 'Poids spécifique')}
                value={twStatusLabel}
                color={twColor}
              />
            </div>

            <CalculatorShell.MetricTile
              label={tr('Corrected Yield', 'الإنتاجية المصححة', 'Rendement corrigé')}
              value={result.correctedYield.toFixed(2)}
              unit="t/ha"
              color="emerald"
              helper={tr('After moisture + flow calibration', 'بعد تصحيح الرطوبة والتدفق', 'Après correction humidité + débit')}
            />

            {/* Accuracy status banner */}
            {Math.abs(result.cfFlow - 1) < 0.05 ? (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-sm leading-relaxed text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong>{tr('Monitor is accurate (±5%).', 'المراقب دقيق (±5%).', 'Moniteur précis (±5 %).')}</strong>
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm leading-relaxed text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong>
                    {tr(
                      `Monitor is off by ${((result.cfFlow - 1) * 100).toFixed(1)}%. Recalibrate with 6-8 loads spanning expected flow rates.`,
                      `يختلف المراقب بنسبة ${((result.cfFlow - 1) * 100).toFixed(1)}%. أعد المعايرة باستخدام 6–8 حمولات تغطي معدلات التدفق المتوقعة.`,
                      `Moniteur décalé de ${((result.cfFlow - 1) * 100).toFixed(1)}%. Recalibrez avec 6–8 charges couvrant les débits attendus.`,
                    )}
                  </strong>
                </span>
              </div>
            )}
          </>
        )}
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
