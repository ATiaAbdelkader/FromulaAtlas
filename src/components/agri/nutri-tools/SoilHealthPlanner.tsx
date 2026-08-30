'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, Copy, Grid3X3, Leaf, Mountain, RotateCcw, ShieldCheck, Sprout,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
  type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';
import {
  getRotationCropOptions, calculateSoilHealthPlan, type SoilTexture, type TillagePractice, type SupportPractice,
} from '@/lib/soil-health-planner';
import { suggestRotation } from '@/lib/rotation-data';
import { SoilNutrientHeatmap } from './SoilNutrientHeatmap';

const CROP_AR: Record<string, string> = {
  maize: 'ذرة', wheat: 'قمح', rice: 'أرز', barley: 'شعير', soybean: 'فول الصويا', chickpea: 'حمص', lentil: 'عدس', pea: 'بازلاء', groundnut: 'فول سوداني',
  potato: 'بطاطس', sugarbeet: 'شمندر سكري', carrot: 'جزر', cotton: 'قطن', sunflower: 'عباد الشمس', canola: 'كانولا', lettuce: 'خس', tomato: 'طماطم',
  vetch: 'بيقية شعرية', clover: 'برسيم أحمر', rye: 'شيلم شتوي', mustard: 'خردل', oats: 'شوفان',
};
const TYPE_AR: Record<string, string> = { cereal: 'حبوب', legume: 'بقوليات', root: 'جذور', fruit: 'فاكهة', leafy: 'ورقي', industrial: 'صناعي', cover: 'غطاء نباتي' };
const TEXTURE_AR: Record<SoilTexture, string> = { sand: 'رملية', loam: 'طميية', clay: 'طينية' };
const TILLAGE_AR: Record<TillagePractice, string> = { conventional: 'حراثة تقليدية', reduced: 'حراثة مخفّضة', 'no-till': 'زراعة بدون حراثة' };
const SUPPORT_AR: Record<SupportPractice, string> = { none: 'بدون ممارسة داعمة', contour: 'حراثة كنتورية', 'strip-crop': 'زراعة شريطية', terrace: 'مصاطب' };
const RISK_AR: Record<string, string> = { low: 'منخفض', moderate: 'متوسط', high: 'مرتفع' };
const REC_AR: Record<string, string> = {
  'cover-crop': 'أضف محصول تغطية بين المحاصيل النقدية لتقليل التعرية وبناء المادة العضوية.',
  'reduced-tillage': 'خفّض شدة الحراثة أو انتقل تدريجياً إلى الزراعة بدون حراثة لحماية بنية التربة.',
  'support-practice': 'أضف ممارسة داعمة مثل الحراثة الكنتورية أو الزراعة الشريطية على المنحدر.',
  'rotation-diversity': 'نوّع الدورة بإضافة بقوليات ومحاصيل تغطية لتوزيع الطلب الغذائي وكسر دورات الأمراض.',
  'soil-test': 'حدّث تحليل التربة قبل تعديل المدخلات أو اعتماد برنامج طويل الأجل.',
  'pH-balance': 'تحقق من توصية مخبرية لتصحيح pH قبل إضافة الجير أو الكبريت.',
};

type UiLanguage = Parameters<typeof copyFor>[0];
const tr = (language: UiLanguage, english: string, arabic: string, french?: string) => copyFor(language, english, arabic, french);
const cropLabel = (language: UiLanguage, id: string, name: string) => copyFor(language, name, CROP_AR[id] || name);
const typeLabel = (language: UiLanguage, type: string) => copyFor(language, type, TYPE_AR[type] || type);
const textureLabel = (language: UiLanguage, value: SoilTexture) => copyFor(language, value, TEXTURE_AR[value]);
const tillageLabel = (language: UiLanguage, value: TillagePractice) => copyFor(language, TILLAGE_AR[value], TILLAGE_AR[value], value === 'no-till' ? 'Semis direct' : value === 'reduced' ? 'Travail du sol réduit' : 'Travail du sol conventionnel');
const supportLabel = (language: UiLanguage, value: SupportPractice) => copyFor(language, value, SUPPORT_AR[value], value === 'none' ? 'Aucune pratique de soutien' : value === 'contour' ? 'Travail en courbes de niveau' : value === 'strip-crop' ? 'Culture en bandes' : 'Terrasse');

const numberValue = (value: string) => Number.isFinite(Number(value)) ? Number(value) : 0;

const TITLE: TrilingualString = {
  en: 'Soil Health & Erosion Scenario Planner',
  ar: 'مخطّط صحة التربة وسيناريوهات التعرية',
  fr: 'Planificateur de santé des sols et d’érosion',
};

const DESC: TrilingualString = {
  en: 'Compare current practice with a practical conservation scenario using rotation, organic matter, slope, and support practices.',
  ar: 'قارن الممارسة الحالية بسيناريو حفظ عملي باستخدام الدورة والمادة العضوية والانحدار والممارسات الداعمة.',
  fr: 'Comparez la pratique actuelle à un scénario de conservation fondé sur la rotation, la matière organique, la pente et les pratiques de soutien.',
};

const PILL_LABEL: TrilingualString = {
  en: 'View:',
  ar: 'العرض:',
  fr: 'Vue :',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Erosion values are simplified scenario estimates using slope, length, texture, tillage, and support factors. Soil tests and local conservation standards take priority.',
  ar: 'قيم التعرية تقديرات مبسطة للسيناريو باستخدام الانحدار والطول والقوام والحراثة وعوامل الدعم. تحليل التربة ومعايير الحفظ المحلية لها الأولوية.',
  fr: 'Les valeurs d’érosion sont des estimations simplifiées selon la pente, la longueur, la texture, le travail du sol et les pratiques de soutien. Les analyses et normes locales prévalent.',
};

export function SoilHealthPlanner() {
  const { language, isRTL } = useTranslation();
  const [viewMode, setViewMode] = useState<'planner' | 'heatmap'>('heatmap');
  const cropOptions = useMemo(() => getRotationCropOptions(), []);
  const [areaHa, setAreaHa] = useState(5);
  const [texture, setTexture] = useState<SoilTexture>('loam');
  const [slopePct, setSlopePct] = useState(5);
  const [slopeLengthM, setSlopeLengthM] = useState(100);
  const [omPercent, setOmPercent] = useState(2.5);
  const [pH, setPH] = useState(6.8);
  const [tillage, setTillage] = useState<TillagePractice>('conventional');
  const [supportPractice, setSupportPractice] = useState<SupportPractice>('none');
  const [rotation, setRotation] = useState(() => suggestRotation('maize', 4));
  const [copied, setCopied] = useState(false);

  const plan = useMemo(() => calculateSoilHealthPlan({ areaHa, texture, slopePct, slopeLengthM, omPercent, pH, tillage, supportPractice, rotation }), [areaHa, texture, slopePct, slopeLengthM, omPercent, pH, tillage, supportPractice, rotation]);
  const updateCrop = (index: number, cropId: string) => setRotation(previous => previous.map((year, yearIndex) => yearIndex === index ? { ...year, cropId, isCoverCrop: cropOptions.find(crop => crop.id === cropId)?.type === 'cover' } : year));
  const riskTone = (risk: string) => risk === 'low' ? 'emerald' : risk === 'moderate' ? 'amber' : 'rose';

  const pills: CalculatorPill[] = [
    { key: 'heatmap', label: tr(language, 'D3 Spatial Heatmap', 'خريطة مكانية D3', 'Cartographie D3'), emoji: '🗺️' },
    { key: 'planner', label: tr(language, 'Erosion Planner', 'مخطّط التعرية', 'Planificateur érosion'), emoji: '⛰️' },
  ];

  const handleReset = () => {
    setAreaHa(5); setTexture('loam'); setSlopePct(5); setSlopeLengthM(100);
    setOmPercent(2.5); setPH(6.8); setTillage('conventional'); setSupportPractice('none');
    setRotation(suggestRotation('maize', 4));
    toast({ title: tr(language, 'Reset', 'إعادة', 'Réinitialiser') });
  };

  const handleCopy = () => {
    const lines = [
      '=== SOIL HEALTH & EROSION PLANNER ===',
      `Area: ${areaHa} ha · Texture: ${texture} · Slope: ${slopePct}% × ${slopeLengthM}m`,
      `OM: ${omPercent}% · pH: ${pH} · Tillage: ${tillage} · Support: ${supportPractice}`,
      `Rotation: ${rotation.map(y => y.cropId).join(' → ')}`,
      '',
      `-- Current --`,
      `Soil score: ${plan.current.soilHealthScore}/100`,
      `Erosion: ${plan.current.erosionLossTonsPerHa.toFixed(1)} t/ha (${plan.current.erosionRisk})`,
      `OM added: ${plan.current.organicMatterAddedTonsPerHa.toFixed(1)} t/ha`,
      `N credit: ${plan.current.nitrogenCreditKgPerHa} kg/ha`,
      '',
      `-- Soil-health scenario --`,
      `Soil score: ${plan.recommended.soilHealthScore}/100`,
      `Erosion: ${plan.recommended.erosionLossTonsPerHa.toFixed(1)} t/ha (${plan.recommended.erosionRisk})`,
      `Erosion reduction: ${plan.erosionReductionPercent}%`,
      `OM added: ${plan.recommended.organicMatterAddedTonsPerHa.toFixed(1)} t/ha`,
      `N credit: ${plan.recommended.nitrogenCreditKgPerHa} kg/ha`,
      '',
      `-- Recommendations --`,
      ...plan.current.recommendations,
    ];
    navigator.clipboard?.writeText(lines.join('\n'));
    setCopied(true);
    toast({ title: tr(language, 'Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  if (viewMode === 'heatmap') {
    return (
      <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between gap-2 border-b pb-3">
          <div className="inline-flex rounded-lg border bg-muted/50 p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('heatmap')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all bg-background text-foreground shadow-xs"
            >
              <Grid3X3 className="h-3.5 w-3.5 text-emerald-600" />
              <span>{tr(language, 'D3 Spatial Nutrient Heatmap', 'خريطة المغذيات المكانية (D3)', 'Cartographie Spatiale D3')}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('planner')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all text-muted-foreground hover:text-foreground"
            >
              <Mountain className="h-3.5 w-3.5 text-emerald-600" />
              <span>{tr(language, 'Erosion & Scenario Planner', 'مخطّط سيناريوهات التعرية والصحة', 'Scénarios & Érosion')}</span>
            </button>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
            D3.js Inverse Distance Weighting
          </Badge>
        </div>
        <SoilNutrientHeatmap />
      </div>
    );
  }

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between gap-2 border-b pb-3">
        <div className="inline-flex rounded-lg border bg-muted/50 p-1 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('heatmap')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all text-muted-foreground hover:text-foreground"
          >
            <Grid3X3 className="h-3.5 w-3.5 text-emerald-600" />
            <span>{tr(language, 'D3 Spatial Nutrient Heatmap', 'خريطة المغذيات المكانية (D3)', 'Cartographie Spatiale D3')}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('planner')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all bg-background text-foreground shadow-xs"
          >
            <Mountain className="h-3.5 w-3.5 text-emerald-600" />
            <span>{tr(language, 'Erosion & Scenario Planner', 'مخطّط سيناريوهات التعرية والصحة', 'Scénarios & Érosion')}</span>
          </button>
        </div>
        <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
          RUSLE & Soil Health Index
        </Badge>
      </div>

      <CalculatorShell
        icon={Mountain}
        title={TITLE}
        description={DESC}
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
            label: { en: 'Reset', ar: 'إعادة', fr: 'Réinitialiser' },
            onClick: handleReset,
          },
        ]}
        pills={pills}
        activePill={viewMode}
        onPillClick={(k) => setViewMode(k as 'planner' | 'heatmap')}
        pillLabel={PILL_LABEL}
        protocolNote={PROTOCOL_NOTE}
      >
        <CalculatorShell.Inputs>
          <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-base font-bold flex items-center gap-2">
                <Mountain className="h-4 w-4 text-emerald-600" />
                {tr(language, 'Field Parameters', 'مدخلات الحقل', 'Paramètres du champ')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CalculatorShell.InputField
                label={tr(language, 'Area (ha)', 'المساحة (هـ)', 'Surface (ha)')}
                value={String(areaHa)}
                onChange={(v) => setAreaHa(numberValue(v))}
                step="0.1"
              />
              <div className="p-3 rounded-xl border bg-card space-y-1">
                <span className="text-xs font-bold text-foreground">{tr(language, 'Soil texture', 'قوام التربة', 'Texture du sol')}</span>
                <select value={texture} onChange={e => setTexture(e.target.value as SoilTexture)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm font-mono font-bold">
                  {(['sand', 'loam', 'clay'] as SoilTexture[]).map(value => <option key={value} value={value}>{textureLabel(language, value)}</option>)}
                </select>
              </div>
              <CalculatorShell.InputField
                label={tr(language, 'Slope (%)', 'الانحدار (%)', 'Pente (%)')}
                value={String(slopePct)}
                onChange={(v) => setSlopePct(numberValue(v))}
                step="0.5"
              />
              <CalculatorShell.InputField
                label={tr(language, 'Slope length (m)', 'طول المنحدر (م)', 'Longueur de pente (m)')}
                value={String(slopeLengthM)}
                onChange={(v) => setSlopeLengthM(numberValue(v))}
              />
              <CalculatorShell.InputField
                label={tr(language, 'Organic matter (%)', 'المادة العضوية (%)', 'Matière organique (%)')}
                value={String(omPercent)}
                onChange={(v) => setOmPercent(numberValue(v))}
                step="0.1"
              />
              <CalculatorShell.InputField
                label={tr(language, 'Soil pH', 'درجة حموضة التربة', 'pH du sol')}
                value={String(pH)}
                onChange={(v) => setPH(numberValue(v))}
                step="0.1"
              />
              <div className="p-3 rounded-xl border bg-card space-y-1">
                <span className="text-xs font-bold text-foreground">{tr(language, 'Tillage', 'الحراثة', 'Travail du sol')}</span>
                <select value={tillage} onChange={e => setTillage(e.target.value as TillagePractice)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm font-mono font-bold">
                  {(['conventional', 'reduced', 'no-till'] as TillagePractice[]).map(value => <option key={value} value={value}>{tillageLabel(language, value)}</option>)}
                </select>
              </div>
              <div className="p-3 rounded-xl border bg-card space-y-1">
                <span className="text-xs font-bold text-foreground">{tr(language, 'Support practice', 'الممارسة الداعمة', 'Pratique de soutien')}</span>
                <select value={supportPractice} onChange={e => setSupportPractice(e.target.value as SupportPractice)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm font-mono font-bold">
                  {(['none', 'contour', 'strip-crop', 'terrace'] as SupportPractice[]).map(value => <option key={value} value={value}>{supportLabel(language, value)}</option>)}
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-sky-200/70 bg-sky-50/30 p-3 dark:border-sky-900/60 dark:bg-sky-950/10">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Sprout className="h-3.5 w-3.5 text-sky-600" />
                {tr(language, 'Rotation sequence', 'تسلسل الدورة الزراعية', 'Séquence de rotation')}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {rotation.map((year, index) => {
                  const selected = cropOptions.find(crop => crop.id === year.cropId);
                  return (
                    <label key={year.year} className="text-xs font-medium text-muted-foreground">
                      {tr(language, `Year ${year.year}`, `السنة ${year.year}`, `Année ${year.year}`)}
                      <select value={year.cropId} onChange={e => updateCrop(index, e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
                        {cropOptions.map(crop => <option key={crop.id} value={crop.id}>{crop.emoji} {cropLabel(language, crop.id, crop.name)} · {typeLabel(language, crop.type)}</option>)}
                      </select>
                      {selected?.type === 'cover' && <span className="mt-1 block text-[10px] text-emerald-600">{tr(language, 'Cover crop', 'محصول تغطية', 'Culture de couverture')}</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </CalculatorShell.Inputs>

        <CalculatorShell.Results>
          <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-base font-bold flex items-center gap-2">
                ✨ {tr(language, 'Soil Health Outcomes', 'نتائج صحة التربة', 'Résultats de santé du sol')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <CalculatorShell.MetricTile
                label={tr(language, 'Current soil score', 'درجة التربة الحالية', 'Score actuel')}
                value={`${plan.current.soilHealthScore}/100`}
                color={riskTone(plan.current.erosionRisk) as 'emerald' | 'amber' | 'rose'}
              />
              <CalculatorShell.MetricTile
                label={tr(language, 'Current erosion', 'التعرية الحالية', 'Érosion actuelle')}
                value={plan.current.erosionLossTonsPerHa.toFixed(1)}
                unit="t/ha"
                color={riskTone(plan.current.erosionRisk) as 'emerald' | 'amber' | 'rose'}
              />
              <CalculatorShell.MetricTile
                label={tr(language, 'Scenario soil score', 'درجة السيناريو', 'Score scénario')}
                value={`${plan.recommended.soilHealthScore}/100`}
                color="emerald"
              />
              <CalculatorShell.MetricTile
                label={tr(language, 'Erosion reduction', 'خفض التعرية', 'Réduction érosion')}
                value={`${plan.erosionReductionPercent}%`}
                color="emerald"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <ScenarioCard language={language} scenario={plan.current} title={tr(language, 'Current practice', 'الممارسة الحالية', 'Pratique actuelle')} tone={riskTone(plan.current.erosionRisk)} />
              <ScenarioCard language={language} scenario={plan.recommended} title={tr(language, 'Soil-health scenario', 'سيناريو صحة التربة', 'Scénario santé du sol')} tone="emerald" recommended />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {tr(language, 'Priority actions', 'الإجراءات ذات الأولوية', 'Actions prioritaires')}
              </div>
              {plan.current.recommendations.length === 0 ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100">
                  {tr(language, 'Current inputs already meet the main scenario guardrails.', 'المدخلات الحالية تحقق بالفعل أهم ضوابط السيناريو.', 'Les données actuelles respectent déjà les principaux garde-fous du scénario.')}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {plan.current.recommendations.map(key => (
                    <div key={key} className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
                      <span className="font-semibold">{tr(language, key.replace('-', ' '), REC_AR[key] || key, key === 'cover-crop' ? 'Culture de couverture' : key === 'reduced-tillage' ? 'Travail du sol réduit' : key === 'support-practice' ? 'Pratique de soutien' : key === 'rotation-diversity' ? 'Diversité de rotation' : key === 'soil-test' ? 'Analyse de sol' : 'Équilibre du pH')}</span>
                      <div className="mt-1">{REC_AR[key] || tr(language, key, REC_AR[key], key)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(plan.current.erosionRisk === 'high' || plan.current.erosionRisk === 'moderate' || pH < 5.5 || pH > 8.2) && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>{tr(language, 'Planning estimate only: confirm erosion tolerance, soil-test interpretation, and conservation measures with a qualified local adviser before making field changes.', 'هذا تقدير تخطيطي فقط: أكد تحمل التعرية وتفسير تحليل التربة وتدابير الحفظ مع مستشار محلي مؤهل قبل تغيير الممارسات الحقلية.', 'Estimation de planification uniquement : confirmez la tolérance à l’érosion, l’analyse du sol et les mesures de conservation avec un conseiller local qualifié avant toute modification.')}</span>
              </div>
            )}
          </div>
        </CalculatorShell.Results>
      </CalculatorShell>
    </div>
  );
}

function ScenarioCard({ language, scenario, title, tone, recommended = false }: { language: UiLanguage; scenario: ReturnType<typeof calculateSoilHealthPlan>['current']; title: string; tone: string; recommended?: boolean }) {
  const toneClass = tone === 'emerald' ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20' : tone === 'amber' ? 'border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20' : 'border-rose-200 bg-rose-50/40 dark:border-rose-900 dark:bg-rose-950/20';
  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">{title}</div>
        {recommended && <Badge variant="secondary">{copyFor(language, 'Recommended', 'موصى به', 'Recommandé')}</Badge>}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <Stat label={copyFor(language, 'Erosion', 'التعرية', 'Érosion')} value={`${scenario.erosionLossTonsPerHa.toFixed(1)} t/ha`} />
        <Stat label={copyFor(language, 'Risk', 'الخطر', 'Risque')} value={copyFor(language, scenario.erosionRisk, RISK_AR[scenario.erosionRisk], scenario.erosionRisk === 'low' ? 'Faible' : scenario.erosionRisk === 'moderate' ? 'Modéré' : 'Élevé')} />
        <Stat label={copyFor(language, 'Organic matter added', 'المادة العضوية المضافة', 'Matière organique ajoutée')} value={`${scenario.organicMatterAddedTonsPerHa.toFixed(1)} t/ha`} />
        <Stat label={copyFor(language, 'N credit', 'رصيد النيتروجين', 'Crédit d’azote')} value={`${scenario.nitrogenCreditKgPerHa} kg/ha`} />
      </div>
      <div className="mt-3 text-xs text-muted-foreground">
        {copyFor(language, `${scenario.coverCropYears} cover-crop year(s) · ${scenario.diseaseBreaksMet ? 'disease breaks met' : 'disease break warnings'}`, `${scenario.coverCropYears} سنة محصول تغطية · ${scenario.diseaseBreaksMet ? 'فواصل الأمراض مستوفاة' : 'تحذيرات فواصل الأمراض'}`, `${scenario.coverCropYears} année(s) de couvert · ${scenario.diseaseBreaksMet ? 'pauses sanitaires respectées' : 'alertes de rotation sanitaire'}`)}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
