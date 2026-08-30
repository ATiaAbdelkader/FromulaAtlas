'use client';

import { useState, useMemo } from 'react';
import { Sprout, Copy, Check, RotateCcw } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString, type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

const CROP_SEEDS: Record<string, { name: string; name_ar: string; name_fr: string; emoji: string; tgw: number; germination: number; targetPop: number; rowSpacing: number }> = {
  wheat:   { name: 'Wheat',   name_ar: 'قمح',         name_fr: 'Blé',    emoji: '🌾', tgw: 40,  germination: 90, targetPop: 400, rowSpacing: 15 },
  barley:  { name: 'Barley',  name_ar: 'شعير',        name_fr: 'Orge',   emoji: '🌾', tgw: 42,  germination: 90, targetPop: 350, rowSpacing: 15 },
  corn:    { name: 'Corn',    name_ar: 'ذرة',         name_fr: 'Maïs',   emoji: '🌽', tgw: 300, germination: 92, targetPop: 8,   rowSpacing: 75 },
  soybean: { name: 'Soybean', name_ar: 'فول الصويا',  name_fr: 'Soja',   emoji: '🫘', tgw: 180, germination: 90, targetPop: 40,  rowSpacing: 45 },
  rice:    { name: 'Rice',    name_ar: 'أرز',         name_fr: 'Riz',    emoji: '🍚', tgw: 25,  germination: 88, targetPop: 500, rowSpacing: 20 },
  canola:  { name: 'Canola',  name_ar: 'كانولا',      name_fr: 'Colza',  emoji: '🌼', tgw: 4,   germination: 90, targetPop: 800, rowSpacing: 15 },
};

const TITLE: TrilingualString = {
  en: 'Seed Rate Calculator',
  ar: 'حاسبة معدل البذور',
  fr: 'Calculateur de Dose de Semence',
};

const DESC: TrilingualString = {
  en: 'Target population × TGW × germination × field loss → kg seed/ha · 6 crops',
  ar: 'الكثافة المستهدفة × وزن ألف حبة × الإنبات × فاقد الحقل → كغ بذور/هكتار · 6 محاصيل',
  fr: 'Population cible × PMG × germination × pertes → kg semence/ha · 6 cultures',
};

const PILL_LABEL: TrilingualString = { en: 'Select Crop:', ar: 'اختر المحصول:', fr: 'Culture :' };

export function SeedRateCalculator() {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const isFr = language === 'fr';
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [crop, setCrop] = useState('wheat');
  const [targetPop, setTargetPop] = useState('');
  const [tgw, setTgw] = useState('');
  const [germination, setGermination] = useState('');
  const [fieldLoss, setFieldLoss] = useState('10');
  const [copied, setCopied] = useState(false);

  const cropInfo = CROP_SEEDS[crop] || CROP_SEEDS.wheat;

  const result = useMemo(() => {
    const tp = parseFloat(targetPop) || cropInfo.targetPop;
    const t = parseFloat(tgw) || cropInfo.tgw;
    const g = (parseFloat(germination) || cropInfo.germination) / 100;
    const fl = parseFloat(fieldLoss) / 100;
    const seedRate = (tp * t) / (g * (1 - fl) * 100);
    const plantSpacing = 10000 / (tp * (cropInfo.rowSpacing / 100));
    return {
      seedRate, plantSpacing,
      effectivePop: tp * g * (1 - fl),
      tp, t, g, fl,
    };
  }, [crop, targetPop, tgw, germination, fieldLoss, cropInfo]);

  const handleReset = () => {
    setTargetPop(''); setTgw(''); setGermination(''); setFieldLoss('10');
    toast({ title: tr('Reset to Crop Defaults', 'تمت استعادة القيم الافتراضية', 'Valeurs par défaut rétablies') });
  };

  const handleCopy = () => {
    const text = `=== SEED RATE CALCULATION ===\nCrop: ${cropInfo.emoji} ${isAr ? cropInfo.name_ar : isFr ? cropInfo.name_fr : cropInfo.name}\nTarget pop: ${result.tp} plants/m²\nTGW: ${result.t} g\nGermination: ${(result.g * 100).toFixed(0)}%\nField loss: ${(result.fl * 100).toFixed(0)}%\n\nResult: ${result.seedRate.toFixed(0)} kg/ha seed\nEffective pop: ${result.effectivePop.toFixed(0)} plants/m²\nIn-row spacing: ${result.plantSpacing.toFixed(1)} cm\nOrder: ${(result.seedRate * 1.1).toFixed(0)} kg/ha (+10% safety)`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  const pills: CalculatorPill[] = Object.entries(CROP_SEEDS).map(([k, v]) => ({
    key: k,
    emoji: v.emoji,
    label: isAr ? v.name_ar : isFr ? v.name_fr : v.name,
  }));

  return (
    <CalculatorShell
      icon={Sprout}
      title={TITLE}
      description={DESC}
      badge="Agronomy Standard"
      accent="emerald"
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
          label: { en: 'Reset Defaults', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      pills={pills}
      activePill={crop}
      onPillClick={(k) => {
        setCrop(k);
        setTargetPop(''); setTgw(''); setGermination('');
      }}
      pillLabel={PILL_LABEL}
      protocolNote={{
        en: `Order ${(result.seedRate * 1.1).toFixed(0)} kg/ha (add 10% safety for calibration error + seed size variation). Calibrate drill per seed lot — TGW varies 20% between varieties.`,
        ar: `اطلب ${(result.seedRate * 1.1).toFixed(0)} كغ/هكتار (أضف هامش أمان 10٪ لأخطاء المعايرة واختلاف حجم البذور). عاير آلة الزراعة لكل دفعة بذور — يختلف وزن ألف حبة بنسبة 20٪ بين الأصناف.`,
        fr: `Commander ${(result.seedRate * 1.1).toFixed(0)} kg/ha (+10% de sécurité pour les erreurs de calibrage). Calibre le semoir par lot — le PMG varie de 20% entre variétés.`,
      }}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <Sprout className="h-4 w-4 text-emerald-600" />
              {tr('Seeding Parameters', 'مدخلات الزراعة', 'Paramètres de semis')}
            </span>
            <span className="text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 rounded-lg px-2 py-0.5">
              {cropInfo.emoji} {isAr ? cropInfo.name_ar : isFr ? cropInfo.name_fr : cropInfo.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CalculatorShell.InputField
              label={tr('Target population (plants/m²)', 'الكثافة المستهدفة (نبات/م²)', 'Population cible (plantes/m²)')}
              value={targetPop || String(result.tp)}
              onChange={setTargetPop}
              placeholder={String(cropInfo.targetPop)}
              step="5"
              helper={tr(`Default: ${cropInfo.targetPop}`, `الافتراضي: ${cropInfo.targetPop}`, `Défaut : ${cropInfo.targetPop}`)}
            />
            <CalculatorShell.InputField
              label={tr('1000-grain weight (g)', 'وزن ألف حبة (غ)', 'PMG (g)')}
              value={tgw || String(result.t)}
              onChange={setTgw}
              placeholder={String(cropInfo.tgw)}
              step="1"
              helper={tr(`Default: ${cropInfo.tgw}g`, `الافتراضي: ${cropInfo.tgw}غ`, `Défaut : ${cropInfo.tgw}g`)}
            />
            <CalculatorShell.InputField
              label={tr('Germination (%)', 'الإنبات (%)', 'Germination (%)')}
              value={germination || String(result.g * 100)}
              onChange={setGermination}
              placeholder={String(cropInfo.germination)}
              step="1"
              helper={tr(`Default: ${cropInfo.germination}%`, `الافتراضي: ${cropInfo.germination}%`, `Défaut : ${cropInfo.germination}%`)}
            />
            <CalculatorShell.InputField
              label={tr('Field loss (%)', 'فاقد الحقل (%)', 'Pertes au champ (%)')}
              value={fieldLoss}
              onChange={setFieldLoss}
              step="1"
              helper={tr('Seed drill calibration loss', 'فقد معايرة آلة الزراعة', 'Pertes de calibrage semoir')}
            />
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
          <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-emerald-50 via-transparent to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
            <span className="text-base font-bold flex items-center gap-2">
              ✨ {tr('Estimated Seed Requirements', 'متطلبات البذور المقدرة', 'Besoins en semence')}
            </span>
            <span className="font-mono text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 rounded-lg px-2 py-0.5">
              {result.seedRate.toFixed(0)} kg/ha
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CalculatorShell.MetricTile
              label={tr('Seed Rate', 'معدل البذور', 'Dose de semence')}
              value={result.seedRate.toFixed(0)}
              unit="kg/ha"
              color="emerald"
            />
            <CalculatorShell.MetricTile
              label={tr('Effective Pop', 'الكثافة الفعلية', 'Pop. effective')}
              value={result.effectivePop.toFixed(0)}
              unit="plants/m²"
              color="teal"
            />
            <CalculatorShell.MetricTile
              label={tr('In-row Spacing', 'التباعد داخل الصف', 'Espacement intra-rang')}
              value={result.plantSpacing.toFixed(1)}
              unit="cm"
              color="amber"
            />
            <CalculatorShell.MetricTile
              label={tr('Order +10% Safety', 'الطلب +10% أمان', 'Commande +10%')}
              value={(result.seedRate * 1.1).toFixed(0)}
              unit="kg/ha"
              color="emerald"
            />
          </div>

          {/* Formula box */}
          <div className="p-3.5 rounded-xl bg-card border space-y-2 text-xs">
            <div className="font-bold flex items-center gap-1.5">
              <span>🧮</span>
              <span>{tr('Formula:', 'المعادلة:', 'Formule :')}</span>
            </div>
            <div className="font-mono text-[11px] p-2.5 rounded-lg bg-muted/50 border leading-relaxed">
              Seed rate = {result.tp} × {result.t}g ÷ ({(result.g * 100).toFixed(0)}% × (1 − {(result.fl * 100).toFixed(0)}%) × 100)
              <br />
              <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                = {result.seedRate.toFixed(0)} kg/ha
              </span>
            </div>
          </div>
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
