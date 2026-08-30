'use client';

import { useState, useMemo } from 'react';
import { Shield, Calculator, Sparkles, Copy, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
  type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

const TITLE: TrilingualString = {
  en: 'Buffer Strip Designer',
  ar: 'مصمم الأحزمة النباتية الواقية',
  fr: 'Concepteur de Bande Végétale',
};

const DESC: TrilingualString = {
  en: 'Width × vegetation type → sediment / N / P trapping efficiency',
  ar: 'العرض × نوع الغطاء النباتي → كفاءة احتجاز الرواسب والنيتروجين والفوسفور',
  fr: 'Largeur × type de végétation → piègeage des sédiments / N / P',
};

const PILL_LABEL: TrilingualString = {
  en: 'Vegetation:',
  ar: 'الغطاء النباتي:',
  fr: 'Végétation :',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'NRCS standard: minimum 10 m grass buffer for 3-5% slope. Double width for every 5% slope increase. Forest buffers best for riparian zones.',
  ar: 'معيار NRCS: حزام عشبي بحد أدنى 10 أمتار لمنحدر 3–5%. ضاعف العرض لكل زيادة 5% في الميل. الأحزمة الحرجية الأفضل للمناطق النهرية.',
  fr: 'Norme NRCS : minimum 10 m de bande enherbée pour 3–5% de pente. Doubler la largeur par tranche de 5% de pente. Bandes forestières idéales en zone riveraine.',
};

const VEG_LABELS: Record<string, TrilingualString> = {
  grass: { en: 'Grass filter strip', ar: 'حزام عشبي مرشح', fr: 'Bande enherbée' },
  grass_trees: { en: 'Grass + trees/shrubs', ar: 'عشب + أشجار/شجيرات', fr: 'Herbe + arbres/arbustes' },
  native: { en: 'Native prairie mix', ar: 'خليط مراعي محلي', fr: 'Mélange prairie indigène' },
  forest: { en: 'Forest buffer (riparian)', ar: 'حزام حرجي (نهري)', fr: 'Bande forestière (riveraine)' },
};

export function BufferStripDesigner() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [width, setWidth] = useState('10');
  const [vegetation, setVegetation] = useState('grass');
  const [slope, setSlope] = useState('3');
  const [length, setLength] = useState('200');
  const [copied, setCopied] = useState<boolean>(false);

  const result = useMemo(() => {
    const W = parseFloat(width), S = parseFloat(slope), L = parseFloat(length);
    if (!Number.isFinite(W)) return null;

    const vegFactor: Record<string, { name: string; k: number; n: number; p: number; sed: number }> = {
      grass: { name: 'Grass filter strip', k: 0.10, n: 0.55, p: 0.50, sed: 0.75 },
      grass_trees: { name: 'Grass + trees/shrubs', k: 0.08, n: 0.70, p: 0.65, sed: 0.85 },
      native: { name: 'Native prairie mix', k: 0.06, n: 0.65, p: 0.60, sed: 0.80 },
      forest: { name: 'Forest buffer (riparian)', k: 0.05, n: 0.80, p: 0.75, sed: 0.90 },
    };
    const v = vegFactor[vegetation];

    // Trapping efficiency: T = (1 - exp(-k × W × V)) × 100
    const V = S < 3 ? 1.2 : S < 8 ? 1.0 : 0.7; // density factor decreases with slope
    const sedimentTrapping = (1 - Math.exp(-v.k * W * V)) * 100;
    const nRemoval = Math.min(95, v.n * (W / 10) * 100);
    const pRemoval = Math.min(90, v.p * (W / 10) * 100);
    const sedimentRemoval = Math.min(98, v.sed * (W / 10) * 100);

    // Area of buffer
    const bufferArea = W * L / 10000; // ha

    return { sedimentTrapping, nRemoval, pRemoval, sedimentRemoval, bufferArea, vegName: v.name };
  }, [width, vegetation, slope, length]);

  const handleReset = () => {
    setWidth('10');
    setVegetation('grass');
    setSlope('3');
    setLength('200');
    toast({
      title: tr('Reset to Defaults', 'تمت استعادة القيم الافتراضية', 'Valeurs par défaut rétablies'),
    });
  };

  const handleCopySummary = () => {
    if (!result) return;
    const vegLabel = VEG_LABELS[vegetation];
    const text = `
=== BUFFER STRIP DESIGN ===
Vegetation: ${tr(vegLabel.en, vegLabel.ar, vegLabel.fr)}
Width: ${parseFloat(width)} m · Length: ${parseFloat(length)} m · Slope: ${parseFloat(slope)}%

Trapping Efficiency:
• Sediment: ${result.sedimentRemoval.toFixed(0)}%
• Nitrogen: ${result.nRemoval.toFixed(0)}%
• Phosphorus: ${result.pRemoval.toFixed(0)}%

Sizing:
• Buffer area: ${result.bufferArea.toFixed(2)} ha
• Vegetation type: ${result.vegName}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: tr('Summary Copied!', 'تم نسخ التقرير!', 'Résumé copié !'),
      description: tr('Buffer strip design report copied to clipboard.', 'تم نسخ تقرير تصميم الحزام الواقي إلى الحافظة.', 'Rapport copié dans le presse-papiers.'),
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const pills: CalculatorPill[] = Object.entries(VEG_LABELS).map(([k, label]) => ({
    key: k,
    label: tr(label.en, label.ar, label.fr),
  }));

  const activeVegLabel = VEG_LABELS[vegetation];

  return (
    <CalculatorShell
      icon={Shield}
      title={TITLE}
      description={DESC}
      badge="Conservation"
      accent="teal"
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
      activePill={vegetation}
      onPillClick={(k) => setVegetation(k)}
      pillLabel={PILL_LABEL}
      protocolNote={PROTOCOL_NOTE}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-teal-600" />
              {tr('Buffer Geometry & Layout', 'أبعاد وتخطيط الحزام', 'Géométrie de la bande')}
            </span>
            <span className="text-xs font-bold bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border border-teal-300 rounded-lg px-2 py-0.5">
              {tr(activeVegLabel.en, activeVegLabel.ar, activeVegLabel.fr)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CalculatorShell.InputField
              label={tr('Buffer width (m)', 'عرض الحزام (م)', 'Largeur de la bande (m)')}
              value={width}
              onChange={setWidth}
              step="1"
              helper={tr('Perpendicular to runoff flow', 'عمودي على اتجاه الجريان السطحي', 'Perpendiculaire au ruissellement')}
            />
            <CalculatorShell.InputField
              label={tr('Slope (%)', 'الميل (%)', 'Pente (%)')}
              value={slope}
              onChange={setSlope}
              step="0.5"
              helper={tr('Field slope above the buffer', 'ميل الحقل أعلى الحزام', 'Pente du champ au-dessus de la bande')}
            />
            <CalculatorShell.InputField
              label={tr('Buffer length (m)', 'طول الحزام (م)', 'Longueur de la bande (m)')}
              value={length}
              onChange={setLength}
              step="10"
              helper={tr('Along the field edge', 'على طول حافة الحقل', 'Le long de la bordure du champ')}
            />
            <CalculatorShell.InputField
              label={tr('Vegetation type', 'نوع الغطاء النباتي', 'Type de végétation')}
              value={tr(activeVegLabel.en, activeVegLabel.ar, activeVegLabel.fr)}
              onChange={() => {}}
              type="text"
              helper={tr('Switch via the pill bar above', 'بدّل عبر شريط الخيارات أعلاه', 'Changer via la barre ci-dessus')}
            />
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
          <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-teal-50 via-transparent to-cyan-50/50 dark:from-teal-950/30 dark:to-cyan-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
            <span className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-600" />
              {tr('Trapping Efficiency', 'كفاءة الاحتجاز', 'Efficacité de piègeage')}
            </span>
            {result && (
              <span className="font-mono text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 rounded-lg px-2 py-0.5">
                {result.sedimentRemoval.toFixed(0)}% sed
              </span>
            )}
          </div>

          {result && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <ProgressBarTile
                  label={tr('Sediment', 'الرواسب', 'Sédiments')}
                  value={result.sedimentRemoval}
                  color="teal"
                />
                <ProgressBarTile
                  label={tr('Nitrogen', 'النيتروجين', 'Azote')}
                  value={result.nRemoval}
                  color="amber"
                />
                <ProgressBarTile
                  label={tr('Phosphorus', 'الفوسفور', 'Phosphore')}
                  value={result.pRemoval}
                  color="rose"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <CalculatorShell.MetricTile
                  label={tr('Buffer Area', 'مساحة الحزام', 'Surface de la bande')}
                  value={result.bufferArea.toFixed(2)}
                  unit="ha"
                  color="default"
                />
                <CalculatorShell.MetricTile
                  label={tr('Vegetation', 'الغطاء النباتي', 'Végétation')}
                  value={tr(activeVegLabel.en, activeVegLabel.ar, activeVegLabel.fr)}
                  color="default"
                />
              </div>

              {result.sedimentRemoval >= 70 ? (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs leading-relaxed text-emerald-700 dark:border-emerald-900 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    <strong>{tr('Excellent buffer design.', 'تصميم حزام ممتاز.', 'Conception excellente.')}</strong>{' '}
                    {tr(
                      `Removes ${result.sedimentRemoval.toFixed(0)}% sediment + ${result.nRemoval.toFixed(0)}% N. Meets most water quality standards.`,
                      `يزيل ${result.sedimentRemoval.toFixed(0)}% من الرواسب + ${result.nRemoval.toFixed(0)}% من النيتروجين. يستوفي معظم معايير جودة المياه.`,
                      `Élimine ${result.sedimentRemoval.toFixed(0)}% sédiments + ${result.nRemoval.toFixed(0)}% N. Conforme aux normes de qualité d'eau.`,
                    )}
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-700 dark:border-amber-900 dark:text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    <strong>{tr('Increase width to 15-20 m', 'زد العرض إلى 15–20 م', 'Élargir à 15–20 m')}</strong>{' '}
                    {tr(
                      'for >75% sediment removal. Native prairie + trees outperform grass alone by 15-20%.',
                      'لأكثر من 75% إزالة للرواسب. المراعي المحلية + الأشجار تتفوق على العشب وحده بنسبة 15–20%.',
                      'pour >75% de piègeage. Prairie indigène + arbres surpassent l’herbe seule de 15–20%.',
                    )}
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

interface ProgressBarTileProps {
  label: string;
  value: number;
  color: 'teal' | 'amber' | 'rose' | 'emerald' | 'sky' | 'default';
}

function ProgressBarTile({ label, value, color }: ProgressBarTileProps) {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
    teal: 'bg-teal-50/60 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800',
    sky: 'bg-sky-50/60 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800',
    amber: 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    rose: 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800',
    default: 'bg-card border-border',
  };
  const textColorClasses: Record<string, string> = {
    emerald: 'text-emerald-700 dark:text-emerald-300',
    teal: 'text-teal-700 dark:text-teal-300',
    sky: 'text-sky-700 dark:text-sky-300',
    amber: 'text-amber-700 dark:text-amber-300',
    rose: 'text-rose-700 dark:text-rose-300',
    default: 'text-foreground',
  };
  const barColorClasses: Record<string, string> = {
    emerald: 'bg-emerald-500',
    teal: 'bg-teal-500',
    sky: 'bg-sky-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    default: 'bg-foreground',
  };
  return (
    <div className={`p-4 rounded-xl border space-y-2 ${colorClasses[color]}`}>
      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-black font-mono ${textColorClasses[color]}`}>
        {value.toFixed(0)}
        <span className="text-sm font-normal text-muted-foreground ms-1">%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full transition-all ${barColorClasses[color]}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}
