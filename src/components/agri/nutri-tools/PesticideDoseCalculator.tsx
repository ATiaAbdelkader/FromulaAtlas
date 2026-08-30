'use client';

import { useState, useMemo } from 'react';
import { FlaskRound, Copy, Check, RotateCcw, Clock, Wind, AlertTriangle } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString, type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

// Simplified herbicide database — AI%, rainfast, PHI by crop
const HERBICIDES: Record<string, { ai: string; ai_ar: string; ai_fr: string; aiPct: number; unit: 'g/L' | '%'; rainfast: number; phi: Record<string, number> }> = {
  glyphosate:  { ai: 'Glyphosate',  ai_ar: 'غليفوسات',   ai_fr: 'Glyphosate',  aiPct: 480, unit: 'g/L', rainfast: 4,   phi: { maize: 7, wheat: 7, soybean: 14 } },
  '2,4-d':     { ai: '2,4-D',       ai_ar: '2,4-D',      ai_fr: '2,4-D',       aiPct: 470, unit: 'g/L', rainfast: 1,   phi: { maize: 45, wheat: 7, pasture: 7 } },
  atrazine:    { ai: 'Atrazine',    ai_ar: 'أترازين',    ai_fr: 'Atrazine',    aiPct: 50,  unit: '%',   rainfast: 2,   phi: { maize: 60, sorghum: 60 } },
  paraquat:    { ai: 'Paraquat',    ai_ar: 'باراكوات',   ai_fr: 'Paraquat',    aiPct: 200, unit: 'g/L', rainfast: 0.5, phi: { maize: 0, soybean: 0, fallow: 0 } },
  glufosinate: { ai: 'Glufosinate', ai_ar: 'غلوفوسينات', ai_fr: 'Glufosinate', aiPct: 200, unit: 'g/L', rainfast: 4,   phi: { maize: 60, soybean: 14 } },
};

const CROPS: Record<string, { en: string; ar: string; fr: string }> = {
  maize:    { en: 'Maize',    ar: 'ذرة',         fr: 'Maïs' },
  wheat:    { en: 'Wheat',    ar: 'قمح',         fr: 'Blé' },
  soybean:  { en: 'Soybean',  ar: 'فول الصويا',  fr: 'Soja' },
  sorghum:  { en: 'Sorghum',  ar: 'ذرة رفيعة',   fr: 'Sorgho' },
  pasture:  { en: 'Pasture',  ar: 'مرعى',        fr: 'Pâturage' },
  fallow:   { en: 'Fallow',   ar: 'أرض بور',     fr: 'Jachère' },
};

const TITLE: TrilingualString = {
  en: 'Pesticide Dose + PHI Calculator',
  ar: 'حاسبة جرعة المبيد وفترة ما قبل الحصاد',
  fr: 'Calculateur de Dose + Délai avant Récolte',
};

const DESC: TrilingualString = {
  en: 'AI rate → product rate · tank mix · rainfast · pre-harvest interval countdown',
  ar: 'معدل المادة الفعالة ← معدل المنتج · خلط الخزان · ثبات المطر · عدّاد فترة ما قبل الحصاد',
  fr: 'Dose MA → dose produit · bouillie · pluie · délai avant récolte',
};

const PILL_LABEL: TrilingualString = { en: 'Select Herbicide:', ar: 'اختر مبيد الأعشاب:', fr: 'Herbicide :' };

export function PesticideDoseCalculator() {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const isFr = language === 'fr';
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [herbicide, setHerbicide] = useState('glyphosate');
  const [aiRate, setAiRate] = useState('1.0');
  const [area, setArea] = useState('10');
  const [crop, setCrop] = useState('maize');
  const [sprayVolume, setSprayVolume] = useState('100');
  const [copied, setCopied] = useState(false);

  const herbInfo = HERBICIDES[herbicide] || HERBICIDES.glyphosate;

  const result = useMemo(() => {
    const ai = parseFloat(aiRate);
    const a = parseFloat(area);
    const sv = parseFloat(sprayVolume);
    if (!Number.isFinite(ai) || !Number.isFinite(a)) return null;

    const aiPctNumeric = herbInfo.unit === 'g/L' ? herbInfo.aiPct / 10 : herbInfo.aiPct;
    const productRatePerHa = (ai * 100) / aiPctNumeric;
    const productTotal = productRatePerHa * a;
    const phi = herbInfo.phi[crop] ?? null;
    const phiDate = new Date();
    phiDate.setDate(phiDate.getDate() + (typeof phi === 'number' ? phi : 0));
    const productPerTank = (productRatePerHa / sv) * 200;

    return { productRatePerHa, productTotal, productPerTank, rainfast: herbInfo.rainfast, phi, phiDate };
  }, [herbicide, aiRate, area, crop, sprayVolume, herbInfo]);

  const handleReset = () => {
    setAiRate('1.0'); setArea('10'); setSprayVolume('100');
    toast({ title: tr('Reset', 'إعادة', 'Réinitialiser') });
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `=== PESTICIDE DOSE ===\nHerbicide: ${herbInfo.ai} (${herbInfo.aiPct}${herbInfo.unit})\nCrop: ${CROPS[crop].en}\nAI rate: ${aiRate} kg/ha\nArea: ${area} ha\nSpray vol: ${sprayVolume} L/ha\n\nProduct rate: ${result.productRatePerHa.toFixed(2)} L/ha\nTotal: ${result.productTotal.toFixed(1)} L\nPer 200L tank: ${result.productPerTank.toFixed(2)} L\nRainfast: ${result.rainfast} hr\nPHI: ${result.phi ?? 'Check label'} days`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  const pills: CalculatorPill[] = Object.entries(HERBICIDES).map(([k, v]) => ({
    key: k,
    label: `${isAr ? v.ai_ar : isFr ? v.ai_fr : v.ai} (${v.aiPct}${v.unit})`,
  }));

  return (
    <CalculatorShell
      icon={FlaskRound}
      title={TITLE}
      description={DESC}
      badge="Safety Critical"
      accent="rose"
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
          label: { en: 'Reset', ar: 'إعادة', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      pills={pills}
      activePill={herbicide}
      onPillClick={(k) => { setHerbicide(k); }}
      pillLabel={PILL_LABEL}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <FlaskRound className="h-4 w-4 text-rose-600" />
              {tr('Application Parameters', 'مدخلات التطبيق', 'Paramètres d\'application')}
            </span>
            <span className="text-xs font-bold bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300 rounded-lg px-2 py-0.5">
              {isAr ? herbInfo.ai_ar : isFr ? herbInfo.ai_fr : herbInfo.ai}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Crop selector */}
            <div className="p-3 rounded-xl border bg-card space-y-1">
              <span className="text-xs font-bold text-foreground">{tr('Crop', 'المحصول', 'Culture')}</span>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
              >
                {Object.entries(CROPS).map(([k, v]) => (
                  <option key={k} value={k}>{isAr ? v.ar : isFr ? v.fr : v.en}</option>
                ))}
              </select>
              <div className="text-[10px] text-muted-foreground">
                {tr('Determines PHI', 'يحدد فترة ما قبل الحصاد', 'Détermine le DAR')}
              </div>
            </div>

            <CalculatorShell.InputField
              label={tr('AI rate (kg/ha)', 'معدل المادة الفعالة (كغ/هكتار)', 'Dose MA (kg/ha)')}
              value={aiRate}
              onChange={setAiRate}
              step="0.1"
              helper={tr('Active ingredient rate', 'معدل المادة الفعالة', 'Dose matière active')}
            />
            <CalculatorShell.InputField
              label={tr('Area (ha)', 'المساحة (هكتار)', 'Surface (ha)')}
              value={area}
              onChange={setArea}
              step="0.5"
              helper={tr('Total spray area', 'مساحة الرش الإجمالية', 'Surface totale')}
            />
            <CalculatorShell.InputField
              label={tr('Spray volume (L/ha)', 'حجم الرش (لتر/هكتار)', 'Volume bouillie (L/ha)')}
              value={sprayVolume}
              onChange={setSprayVolume}
              step="10"
              helper={tr('Water carrier volume', 'حجم الماء الحامل', 'Volume d\'eau')}
            />
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        {result && (
          <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
            <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-rose-50 via-transparent to-amber-50/50 dark:from-rose-950/30 dark:to-amber-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
              <span className="text-base font-bold flex items-center gap-2">
                ✨ {tr('Calculated Dose & Safety', 'الجرعة المحسوبة والسلامة', 'Dose & Sécurité')}
              </span>
              <span className="font-mono text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 rounded-lg px-2 py-0.5">
                {result.productRatePerHa.toFixed(2)} L/ha
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CalculatorShell.MetricTile
                label={tr('Product Rate', 'معدل المنتج', 'Dose produit')}
                value={result.productRatePerHa.toFixed(2)}
                unit="L/ha"
                color="rose"
              />
              <CalculatorShell.MetricTile
                label={tr('Total Needed', 'الإجمالي المطلوب', 'Quantité totale')}
                value={result.productTotal.toFixed(1)}
                unit="L"
                color="amber"
              />
              <CalculatorShell.MetricTile
                label={tr('Per 200L Tank', 'لكل خزان 200 لتر', 'Par cuve 200L')}
                value={result.productPerTank.toFixed(2)}
                unit="L"
                color="sky"
              />
              <CalculatorShell.MetricTile
                label={tr('Rainfast', 'ثبات المطر', 'Résistance pluie')}
                value={result.rainfast}
                unit={tr('hours', 'ساعات', 'heures')}
                color="amber"
              />
            </div>

            {/* PHI countdown */}
            <div className={`p-3.5 rounded-xl border space-y-1 ${typeof result.phi === 'number' && result.phi > 14 ? 'border-rose-300 bg-rose-50/60 dark:bg-rose-950/20' : 'border-sky-300 bg-sky-50/60 dark:bg-sky-950/20'}`}>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-semibold">{tr('Pre-Harvest Interval (PHI)', 'فترة ما قبل الحصاد (PHI)', 'Délai avant récolte (DAR)')}</span>
              </div>
              {typeof result.phi === 'number' ? (
                <div className="text-sm">
                  <strong className="text-lg">{result.phi} {tr('days', 'يوماً', 'jours')}</strong> {tr('until safe harvest.', 'حتى الحصاد الآمن.', 'avant récolte sécurisée.')}
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {tr('Earliest harvest:', 'أقرب موعد للحصاد:', 'Récolte au plus tôt:')}{' '}
                    <strong className="font-mono">{result.phiDate.toLocaleDateString(isAr ? 'ar-SA' : isFr ? 'fr-FR' : 'en-US')}</strong>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-amber-700 dark:text-amber-400">
                  {tr(`Check product label for ${CROPS[crop].en} PHI.`, `راجع ملصق المنتج لمعرفة فترة ما قبل الحصاد لمحصول ${CROPS[crop].ar}.`, `Vérifiez l'étiquette pour le DAR de ${CROPS[crop].fr}.`)}
                </div>
              )}
            </div>

            {/* Rainfast warning */}
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm leading-relaxed text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
              <Wind className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                <strong>{tr(`Rainfast: ${result.rainfast} hr.`, `ثبات المطر: ${result.rainfast} ساعة.`, `Résistant pluie: ${result.rainfast}h.`)}</strong>{' '}
                {tr("Don't spray if rain expected within this window. Spray after dew dries (mid-morning).", 'لا ترش إذا كان المطر متوقعاً خلال هذه الفترة. رش بعد جفاف الندى (منتصف الصباح).', 'Ne pas traiter si pluie prévue dans cette fenêtre. Traiter après séchage de la rosée.')}
              </span>
            </div>

            {/* Safety disclaimer */}
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/40 p-3 text-xs leading-relaxed text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                {tr(
                  'Always read product label. This calculator is a guide — local regulations + label rates override. Wear PPE. Avoid bee-toxic products during bloom.',
                  'اقرأ دائماً ملصق المنتج. هذه الحاسبة إرشادية — تتقدّم اللوائح المحلية ومعدلات الملصق عليها. ارتدِ معدات الوقاية الشخصية. تجنّب المنتجات السامة للنحل أثناء الإزهار.',
                  'Lisez toujours l\'étiquette. Ce calculateur est indicatif — les réglementations locales et doses étiquette priment. Portez les EPI. Évitez les produits toxiques pour les abeilles pendant la floraison.'
                )}
              </span>
            </div>
          </div>
        )}
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
