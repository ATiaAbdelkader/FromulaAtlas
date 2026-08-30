'use client';

import { useState, useMemo } from 'react';
import { Beef, Copy, Check, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString, type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

const TITLE: TrilingualString = {
  en: 'Silage Fermentation Predictor',
  ar: 'متنبئ تخمير السيلاج',
  fr: 'Prédicteur de Fermentation Ensilage',
};
const DESC: TrilingualString = {
  en: 'Moisture · sugar · packing density · chop length → fermentation quality score',
  ar: 'الرطوبة · السكر · كثافة الكبس · طول التقطيع ← درجة جودة التخمير',
  fr: 'Humidité · sucre · densité · hachage → score qualité fermentation',
};

const SILAGE_CROPS: CalculatorPill[] = [
  { key: 'corn', emoji: '🌽', label: 'Corn' },
  { key: 'alfalfa', emoji: '🌿', label: 'Alfalfa' },
  { key: 'grass', emoji: '🌾', label: 'Grass' },
  { key: 'sorghum', emoji: '🌾', label: 'Sorghum' },
];

const CROP_IDEAL: Record<string, { idealM: string; idealS: string }> = {
  corn: { idealM: '63-68%', idealS: '3-5%' },
  alfalfa: { idealM: '55-65%', idealS: '4-6%' },
  grass: { idealM: '55-65%', idealS: '3-5%' },
  sorghum: { idealM: '60-70%', idealS: '2-4%' },
};

export function SilageFermentationPredictor() {
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [crop, setCrop] = useState('corn');
  const [moisture, setMoisture] = useState('65');
  const [sugar, setSugar] = useState('3.5');
  const [packingDensity, setPackingDensity] = useState('240');
  const [chopLength, setChopLength] = useState('19');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const M = parseFloat(moisture), S = parseFloat(sugar), PD = parseFloat(packingDensity), CL = parseFloat(chopLength);
    if (!Number.isFinite(M)) return null;

    let score = 0;
    score += M >= 60 && M <= 70 ? 30 : M >= 55 && M <= 75 ? 15 : 0;
    score += S >= 4 ? 25 : S >= 3 ? 18 : S >= 2 ? 8 : 0;
    score += PD >= 240 ? 25 : PD >= 200 ? 15 : PD >= 160 ? 8 : 0;
    score += CL >= 10 && CL <= 25 ? 20 : CL >= 5 && CL <= 35 ? 10 : 0;

    let quality: string, color: string, adviceKey: string;
    if (score >= 85) { quality = tr('Excellent', 'ممتاز', 'Excellent'); color = '#10b981'; adviceKey = 'optimal'; }
    else if (score >= 65) { quality = tr('Good', 'جيد', 'Bon'); color = '#84cc16'; adviceKey = 'adequate'; }
    else if (score >= 40) { quality = tr('Fair', 'مقبول', 'Moyen'); color = '#eab308'; adviceKey = 'risk'; }
    else { quality = tr('Poor', 'ضعيف', 'Faible'); color = '#dc2626'; adviceKey = 'spoilage'; }

    const adviceMap: Record<string, TrilingualString> = {
      optimal: { en: 'Optimal fermentation expected. pH drops to 3.8-4.0 within 3 weeks. Stable 6+ months.', ar: 'التخمير الأمثل متوقع. تنخفض درجة الحموضة إلى 3.8–4.0 خلال 3 أسابيع. تخزين مستقر 6+ أشهر.', fr: 'Fermentation optimale. pH 3.8-4.0 en 3 semaines. Stable 6+ mois.' },
      adequate: { en: 'Adequate fermentation. Monitor pH — target <4.2. Seal bunker immediately after filling.', ar: 'تخمير كافٍ. راقب درجة الحموضة — الهدف أقل من 4.2. أغلق الخندق فوراً بعد الملء.', fr: 'Fermentation adéquate. Surveiller pH < 4.2. Sceller immédiatement.' },
      risk: { en: 'Risk of poor fermentation. Consider inoculant (Lactobacillus). Check moisture + packing.', ar: 'خطر تخمير ضعيف. فكّر في لقاح (Lactobacillus). تحقق من الرطوبة والكبس.', fr: 'Risque de mauvaise fermentation. Inoculant (Lactobacillus). Vérifiez humidité + tassement.' },
      spoilage: { en: 'High risk of spoilage. Adjust moisture/sugar/packing before ensiling. Clostridial risk if too wet.', ar: 'خطر مرتفع للتلف. اضبط الرطوبة والسكر والكبس قبل التخزين. خطر كلوستريديوم إذا كانت الرطوبة مرتفعة.', fr: 'Risque élevé de détérioration. Ajustez humidité/sucre/tassement. Risque clostridien si trop humide.' },
    };

    return { score, quality, color, advice: adviceMap[adviceKey], cropInfo: CROP_IDEAL[crop] };
  }, [crop, moisture, sugar, packingDensity, chopLength, language]);

  const handleReset = () => {
    setMoisture('65'); setSugar('3.5'); setPackingDensity('240'); setChopLength('19');
    toast({ title: tr('Reset', 'إعادة', 'Réinitialiser') });
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `=== SILAGE FERMENTATION ===\nCrop: ${crop}\nMoisture: ${moisture}%\nSugar: ${sugar}%\nPacking density: ${packingDensity} kg DM/m³\nChop length: ${chopLength} mm\n\nQuality: ${result.quality}\nScore: ${result.score}/100`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <CalculatorShell
      icon={Beef}
      title={TITLE}
      description={DESC}
      badge="Forage Science"
      accent="emerald"
      actions={[
        { icon: Copy, label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' }, onClick: handleCopy, variant: 'primary', showCheck: copied },
        { icon: RotateCcw, label: { en: 'Reset', ar: 'إعادة', fr: 'Réinitialiser' }, onClick: handleReset },
      ]}
      pills={SILAGE_CROPS}
      activePill={crop}
      onPillClick={setCrop}
      pillLabel={{ en: 'Select Crop:', ar: 'اختر المحصول:', fr: 'Culture :' }}
      protocolNote={result?.cropInfo ? {
        en: `${crop} ideal: moisture ${result.cropInfo.idealM}, sugar ${result.cropInfo.idealS}. Use homofermentative inoculant (L. plantarum) for low-sugar crops. Pack to ≥240 kg DM/m³.`,
        ar: `القيم المثلى: الرطوبة ${result.cropInfo.idealM}، السكر ${result.cropInfo.idealS}. استخدم لقاحاً متجانس التخمر (L. plantarum) للمحاصيل منخفضة السكر. اكبس إلى ≥240 كغ مادة جافة/م³.`,
        fr: `Idéal: humidité ${result.cropInfo.idealM}, sucre ${result.cropInfo.idealS}. Inoculant homofermentaire (L. plantarum) pour cultures pauvres en sucre. Tassement ≥240 kg MS/m³.`,
      } : undefined}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Beef className="h-4 w-4 text-emerald-600" />
            <span className="text-base font-bold">{tr('Ensiling Parameters', 'مدخلات السيلاج', 'Paramètres d\'ensilage')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CalculatorShell.InputField label={tr('Moisture (%)', 'الرطوبة (%)', 'Humidité (%)')} value={moisture} onChange={setMoisture} step="1" helper={tr('Ideal: 60-70%', 'الأمثل: 60-70%', 'Idéal: 60-70%')} />
            <CalculatorShell.InputField label={tr('Water-soluble sugar (%)', 'السكر القابل للذوبان (%)', 'Sucre soluble (%)')} value={sugar} onChange={setSugar} step="0.1" helper={tr('Need ≥3% for fermentation', 'يحتاج ≥3% للتخمير', '≥3% requis')} />
            <CalculatorShell.InputField label={tr('Packing density (kg DM/m³)', 'كثافة الكبس (كغ مادة جافة/م³)', 'Densité tassement (kg MS/m³)')} value={packingDensity} onChange={setPackingDensity} step="10" helper={tr('Target: ≥240', 'الهدف: ≥240', 'Cible: ≥240')} />
            <CalculatorShell.InputField label={tr('Chop length (mm)', 'طول التقطيع (مم)', 'Hachage (mm)')} value={chopLength} onChange={setChopLength} step="1" helper={tr('Ideal: 10-25 mm', 'الأمثل: 10-25 مم', 'Idéal: 10-25 mm')} />
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        {result && (
          <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
            <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-emerald-50 via-transparent to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
              <span className="text-base font-bold flex items-center gap-2">✨ {tr('Fermentation Quality', 'جودة التخمير', 'Qualité fermentation')}</span>
              <span className="font-mono text-xs font-bold rounded-lg px-2 py-0.5 border" style={{ color: result.color, borderColor: result.color + '60', backgroundColor: result.color + '15' }}>{result.score}/100</span>
            </div>

            {/* Big quality score */}
            <div className="p-6 rounded-xl border text-center" style={{ borderColor: result.color + '60', backgroundColor: result.color + '10' }}>
              <div className="text-3xl font-black" style={{ color: result.color }}>{result.quality}</div>
              <div className="text-sm text-muted-foreground mt-1">{tr('Fermentation Score', 'درجة التخمير', 'Score fermentation')}: {result.score}/100</div>
            </div>

            {/* Advice */}
            <div className="flex items-start gap-2 rounded-xl border p-3 text-xs leading-relaxed" style={{ borderColor: result.color + '40', color: result.color }}>
              {result.score >= 65 ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
              <span>{tr(result.advice.en, result.advice.ar, result.advice.fr)}</span>
            </div>

            {/* Score breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <CalculatorShell.MetricTile label={tr('Moisture Score', 'درجة الرطوبة', 'Score humidité')} value={parseFloat(moisture) >= 60 && parseFloat(moisture) <= 70 ? '30' : parseFloat(moisture) >= 55 && parseFloat(moisture) <= 75 ? '15' : '0'} unit="/30" color="sky" />
              <CalculatorShell.MetricTile label={tr('Sugar Score', 'درجة السكر', 'Score sucre')} value={parseFloat(sugar) >= 4 ? '25' : parseFloat(sugar) >= 3 ? '18' : parseFloat(sugar) >= 2 ? '8' : '0'} unit="/25" color="amber" />
              <CalculatorShell.MetricTile label={tr('Packing Score', 'درجة الكبس', 'Score tassement')} value={parseFloat(packingDensity) >= 240 ? '25' : parseFloat(packingDensity) >= 200 ? '15' : parseFloat(packingDensity) >= 160 ? '8' : '0'} unit="/25" color="emerald" />
              <CalculatorShell.MetricTile label={tr('Chop Score', 'درجة التقطيع', 'Score hachage')} value={parseFloat(chopLength) >= 10 && parseFloat(chopLength) <= 25 ? '20' : parseFloat(chopLength) >= 5 && parseFloat(chopLength) <= 35 ? '10' : '0'} unit="/20" color="teal" />
            </div>
          </div>
        )}
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
