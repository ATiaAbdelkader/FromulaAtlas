import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, Grid3X3, Leaf, Mountain, ShieldCheck, Sprout } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { copyFor, useTranslation } from '@/lib/language-store';
import { getRotationCropOptions, calculateSoilHealthPlan, type SoilTexture, type TillagePractice, type SupportPractice } from '@/lib/soil-health-planner';
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

  const plan = useMemo(() => calculateSoilHealthPlan({ areaHa, texture, slopePct, slopeLengthM, omPercent, pH, tillage, supportPractice, rotation }), [areaHa, texture, slopePct, slopeLengthM, omPercent, pH, tillage, supportPractice, rotation]);
  const updateCrop = (index: number, cropId: string) => setRotation(previous => previous.map((year, yearIndex) => yearIndex === index ? { ...year, cropId, isCoverCrop: cropOptions.find(crop => crop.id === cropId)?.type === 'cover' } : year));
  const printSummary = () => window.print();
  const riskTone = (risk: string) => risk === 'low' ? 'emerald' : risk === 'moderate' ? 'amber' : 'rose';
  const toneClass = (tone: string) => tone === 'emerald' ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100' : tone === 'amber' ? 'border-amber-200 bg-amber-50/50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100' : 'border-rose-200 bg-rose-50/50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-100';

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sub-Navigation Tabs */}
      <div className="flex items-center justify-between gap-2 border-b pb-3">
        <div className="inline-flex rounded-lg border bg-muted/50 p-1 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('heatmap')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              viewMode === 'heatmap'
                ? 'bg-background text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Grid3X3 className="h-3.5 w-3.5 text-emerald-600" />
            <span>{tr(language, 'D3 Spatial Nutrient Heatmap', 'خريطة المغذيات المكانية (D3)', 'Cartographie Spatiale D3')}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('planner')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              viewMode === 'planner'
                ? 'bg-background text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Mountain className="h-3.5 w-3.5 text-emerald-600" />
            <span>{tr(language, 'Erosion & Scenario Planner', 'مخطّط سيناريوهات التعرية والصحة', 'Scénarios & Érosion')}</span>
          </button>
        </div>

        <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
          {viewMode === 'heatmap' ? 'D3.js Inverse Distance Weighting' : 'RUSLE & Soil Health Index'}
        </Badge>
      </div>

      {viewMode === 'heatmap' ? (
        <SoilNutrientHeatmap />
      ) : (
        <Card className="overflow-hidden border-emerald-200/70 shadow-sm dark:border-emerald-900/60">
          <CardHeader className="border-b bg-gradient-to-r from-emerald-50 via-background to-amber-50/40 pb-4 dark:from-emerald-950/25 dark:via-background dark:to-amber-950/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base"><Mountain className="h-4 w-4 text-emerald-600" />{tr(language, 'Soil Health & Erosion Scenario Planner', 'مخطّط صحة التربة وسيناريوهات التعرية', 'Planificateur de santé des sols et d’érosion')}</CardTitle>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{tr(language, 'Compare current practice with a practical conservation scenario using rotation, organic matter, slope, and support practices.', 'قارن الممارسة الحالية بسيناريو حفظ عملي باستخدام الدورة والمادة العضوية والانحدار والممارسات الداعمة.', 'Comparez la pratique actuelle à un scénario de conservation fondé sur la rotation, la matière organique, la pente et les pratiques de soutien.')}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={printSummary} className="shrink-0 gap-1.5"><Download className="h-3.5 w-3.5" />{tr(language, 'Print', 'طباعة', 'Imprimer')}</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/30 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/10 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={tr(language, 'Area (ha)', 'المساحة (هـ)', 'Surface (ha)')}><Input type="number" min="0.1" step="0.1" value={areaHa} onChange={e => setAreaHa(numberValue(e.target.value))} aria-label={tr(language, 'Field area in hectares', 'مساحة الحقل بالهكتار', 'Surface du champ en hectares')} /></Field>
          <Field label={tr(language, 'Soil texture', 'قوام التربة', 'Texture du sol')}><select value={texture} onChange={e => setTexture(e.target.value as SoilTexture)} aria-label={tr(language, 'Soil texture', 'قوام التربة', 'Texture du sol')} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{(['sand', 'loam', 'clay'] as SoilTexture[]).map(value => <option key={value} value={value}>{textureLabel(language, value)}</option>)}</select></Field>
          <Field label={tr(language, 'Slope (%)', 'الانحدار (%)', 'Pente (%)')}><Input type="number" min="0.1" max="60" step="0.5" value={slopePct} onChange={e => setSlopePct(numberValue(e.target.value))} aria-label={tr(language, 'Slope percentage', 'نسبة الانحدار', 'Pourcentage de pente')} /></Field>
          <Field label={tr(language, 'Slope length (m)', 'طول المنحدر (م)', 'Longueur de pente (m)')}><Input type="number" min="1" step="1" value={slopeLengthM} onChange={e => setSlopeLengthM(numberValue(e.target.value))} aria-label={tr(language, 'Slope length in metres', 'طول المنحدر بالمتر', 'Longueur de pente en mètres')} /></Field>
          <Field label={tr(language, 'Organic matter (%)', 'المادة العضوية (%)', 'Matière organique (%)')}><Input type="number" min="0" max="12" step="0.1" value={omPercent} onChange={e => setOmPercent(numberValue(e.target.value))} aria-label={tr(language, 'Soil organic matter percentage', 'نسبة المادة العضوية في التربة', 'Pourcentage de matière organique')} /></Field>
          <Field label={tr(language, 'Soil pH', 'درجة حموضة التربة', 'pH du sol')}><Input type="number" min="3" max="11" step="0.1" value={pH} onChange={e => setPH(numberValue(e.target.value))} aria-label={tr(language, 'Soil pH', 'درجة حموضة التربة', 'pH du sol')} /></Field>
          <Field label={tr(language, 'Tillage', 'الحراثة', 'Travail du sol')}><select value={tillage} onChange={e => setTillage(e.target.value as TillagePractice)} aria-label={tr(language, 'Tillage practice', 'ممارسة الحراثة', 'Pratique de travail du sol')} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{(['conventional', 'reduced', 'no-till'] as TillagePractice[]).map(value => <option key={value} value={value}>{tillageLabel(language, value)}</option>)}</select></Field>
          <Field label={tr(language, 'Support practice', 'الممارسة الداعمة', 'Pratique de soutien')}><select value={supportPractice} onChange={e => setSupportPractice(e.target.value as SupportPractice)} aria-label={tr(language, 'Erosion support practice', 'ممارسة دعم مقاومة التعرية', 'Pratique de soutien contre l’érosion')} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{(['none', 'contour', 'strip-crop', 'terrace'] as SupportPractice[]).map(value => <option key={value} value={value}>{supportLabel(language, value)}</option>)}</select></Field>
        </div>

        <div className="rounded-xl border border-sky-200/70 bg-sky-50/30 p-3 dark:border-sky-900/60 dark:bg-sky-950/10">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Sprout className="h-3.5 w-3.5 text-sky-600" />{tr(language, 'Rotation sequence', 'تسلسل الدورة الزراعية', 'Séquence de rotation')}</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">{rotation.map((year, index) => { const selected = cropOptions.find(crop => crop.id === year.cropId); return <label key={year.year} className="text-xs font-medium text-muted-foreground">{tr(language, `Year ${year.year}`, `السنة ${year.year}`, `Année ${year.year}`)}<select value={year.cropId} onChange={e => updateCrop(index, e.target.value)} aria-label={tr(language, `Rotation year ${year.year}`, `محصول السنة ${year.year}`, `Culture de l’année ${year.year}`)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">{cropOptions.map(crop => <option key={crop.id} value={crop.id}>{crop.emoji} {cropLabel(language, crop.id, crop.name)} · {typeLabel(language, crop.type)}</option>)}</select>{selected?.type === 'cover' && <span className="mt-1 block text-[10px] text-emerald-600">{tr(language, 'Cover crop', 'محصول تغطية', 'Culture de couverture')}</span>}</label>; })}</div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric icon={ShieldCheck} label={tr(language, 'Current soil score', 'درجة التربة الحالية', 'Score actuel du sol')} value={`${plan.current.soilHealthScore}/100`} tone={riskTone(plan.current.erosionRisk)} />
          <Metric icon={Mountain} label={tr(language, 'Current erosion', 'التعرية الحالية', 'Érosion actuelle')} value={`${plan.current.erosionLossTonsPerHa.toFixed(1)} t/ha`} tone={riskTone(plan.current.erosionRisk)} />
          <Metric icon={Leaf} label={tr(language, 'Scenario soil score', 'درجة السيناريو', 'Score du scénario')} value={`${plan.recommended.soilHealthScore}/100`} tone="emerald" />
          <Metric icon={Sprout} label={tr(language, 'Erosion reduction', 'خفض التعرية', 'Réduction de l’érosion')} value={`${plan.erosionReductionPercent}%`} tone="emerald" />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <ScenarioCard language={language} scenario={plan.current} title={tr(language, 'Current practice', 'الممارسة الحالية', 'Pratique actuelle')} tone={riskTone(plan.current.erosionRisk)} />
          <ScenarioCard language={language} scenario={plan.recommended} title={tr(language, 'Soil-health scenario', 'سيناريو صحة التربة', 'Scénario santé du sol')} tone="emerald" recommended />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />{tr(language, 'Priority actions', 'الإجراءات ذات الأولوية', 'Actions prioritaires')}</div>
          {plan.current.recommendations.length === 0 ? <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100">{tr(language, 'Current inputs already meet the main scenario guardrails.', 'المدخلات الحالية تحقق بالفعل أهم ضوابط السيناريو.', 'Les données actuelles respectent déjà les principaux garde-fous du scénario.')}</div> : <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{plan.current.recommendations.map(key => <div key={key} className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100"><span className="font-semibold">{tr(language, key.replace('-', ' '), REC_AR[key] || key, key === 'cover-crop' ? 'Culture de couverture' : key === 'reduced-tillage' ? 'Travail du sol réduit' : key === 'support-practice' ? 'Pratique de soutien' : key === 'rotation-diversity' ? 'Diversité de rotation' : key === 'soil-test' ? 'Analyse de sol' : 'Équilibre du pH')}</span><div className="mt-1">{language === 'ar' ? REC_AR[key] : key === 'cover-crop' ? tr(language, 'Add a cover crop between cash crops to reduce erosion and build organic matter.', '', 'Ajoutez une culture de couverture entre les cultures de rente pour réduire l’érosion et renforcer la matière organique.') : key === 'reduced-tillage' ? tr(language, 'Reduce tillage intensity or transition toward no-till to protect soil structure.', '', 'Réduisez l’intensité du travail du sol ou passez progressivement au semis direct pour protéger la structure.') : key === 'support-practice' ? tr(language, 'Add contour, strip-cropping, or terrace support on sloping land.', '', 'Ajoutez des courbes de niveau, des bandes ou des terrasses sur les parcelles en pente.') : key === 'rotation-diversity' ? tr(language, 'Add legumes and cover crops to spread nutrient demand and break disease cycles.', '', 'Ajoutez des légumineuses et des couverts pour répartir les besoins et casser les cycles de maladies.') : key === 'soil-test' ? tr(language, 'Refresh soil testing before changing inputs or adopting a long-term plan.', '', 'Actualisez l’analyse du sol avant de modifier les intrants ou d’adopter un plan à long terme.') : tr(language, 'Confirm a laboratory recommendation before applying lime or sulfur.', '', 'Confirmez une recommandation de laboratoire avant d’appliquer de la chaux ou du soufre.')}</div></div>)}</div>}
        </div>

        {(plan.current.erosionRisk === 'high' || plan.current.erosionRisk === 'moderate' || pH < 5.5 || pH > 8.2) && <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" /><span>{tr(language, 'Planning estimate only: confirm erosion tolerance, soil-test interpretation, and conservation measures with a qualified local adviser before making field changes.', 'هذا تقدير تخطيطي فقط: أكد تحمل التعرية وتفسير تحليل التربة وتدابير الحفظ مع مستشار محلي مؤهل قبل تغيير الممارسات الحقلية.', 'Estimation de planification uniquement : confirmez la tolérance à l’érosion, l’analyse du sol et les mesures de conservation avec un conseiller local qualifié avant toute modification.')}</span></div>}
        <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-3 text-xs leading-relaxed text-sky-900 dark:border-sky-900 dark:bg-sky-950/20 dark:text-sky-100"><strong>{tr(language, 'Method note:', 'ملاحظة المنهجية:', 'Note méthodologique :')}</strong> {tr(language, 'Erosion values are simplified scenario estimates using slope, length, texture, tillage, and support factors. Soil tests and local conservation standards take priority.', 'قيم التعرية تقديرات مبسطة للسيناريو باستخدام الانحدار والطول والقوام والحراثة وعوامل الدعم. تحليل التربة ومعايير الحفظ المحلية لها الأولوية.', 'Les valeurs d’érosion sont des estimations simplifiées selon la pente, la longueur, la texture, le travail du sol et les pratiques de soutien. Les analyses et normes locales prévalent.')}</div>
      </CardContent>
    </Card>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-xs font-medium text-muted-foreground">{label}{children}</label>;
}

function Metric({ icon: Icon, label, value, tone = 'emerald' }: { icon: typeof ShieldCheck; label: string; value: string; tone?: string }) {
  const classes = tone === 'rose' ? 'border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/20' : tone === 'amber' ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20' : 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20';
  return <div className={`rounded-xl border p-3 ${classes}`}><Icon className="h-4 w-4 text-emerald-600" /><div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 text-sm font-bold">{value}</div></div>;
}

function ScenarioCard({ language, scenario, title, tone, recommended = false }: { language: UiLanguage; scenario: ReturnType<typeof calculateSoilHealthPlan>['current']; title: string; tone: string; recommended?: boolean }) {
  const toneClass = tone === 'emerald' ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20' : tone === 'amber' ? 'border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20' : 'border-rose-200 bg-rose-50/40 dark:border-rose-900 dark:bg-rose-950/20';
  return <div className={`rounded-xl border p-4 ${toneClass}`}><div className="flex items-center justify-between gap-2"><div className="text-sm font-semibold">{title}</div>{recommended && <Badge variant="secondary">{copyFor(language, 'Recommended', 'موصى به', 'Recommandé')}</Badge>}</div><div className="mt-3 grid grid-cols-2 gap-3 text-xs"><Stat label={copyFor(language, 'Erosion', 'التعرية', 'Érosion')} value={`${scenario.erosionLossTonsPerHa.toFixed(1)} t/ha`} /><Stat label={copyFor(language, 'Risk', 'الخطر', 'Risque')} value={copyFor(language, scenario.erosionRisk, RISK_AR[scenario.erosionRisk], scenario.erosionRisk === 'low' ? 'Faible' : scenario.erosionRisk === 'moderate' ? 'Modéré' : 'Élevé')} /><Stat label={copyFor(language, 'Organic matter added', 'المادة العضوية المضافة', 'Matière organique ajoutée')} value={`${scenario.organicMatterAddedTonsPerHa.toFixed(1)} t/ha`} /><Stat label={copyFor(language, 'N credit', 'رصيد النيتروجين', 'Crédit d’azote')} value={`${scenario.nitrogenCreditKgPerHa} kg/ha`} /></div><div className="mt-3 text-xs text-muted-foreground">{copyFor(language, `${scenario.coverCropYears} cover-crop year(s) · ${scenario.diseaseBreaksMet ? 'disease breaks met' : 'disease break warnings'}`, `${scenario.coverCropYears} سنة محصول تغطية · ${scenario.diseaseBreaksMet ? 'فواصل الأمراض مستوفاة' : 'تحذيرات فواصل الأمراض'}`, `${scenario.coverCropYears} année(s) de couvert · ${scenario.diseaseBreaksMet ? 'pauses sanitaires respectées' : 'alertes de rotation sanitaire'}`)}</div></div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div><div className="text-muted-foreground">{label}</div><div className="mt-1 font-semibold">{value}</div></div>;
}
