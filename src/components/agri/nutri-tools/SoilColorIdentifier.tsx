'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Droplets, Mountain, Search, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import {
  SOIL_MINERALS, MUNSELL_COLORS, US_STATE_SOILS,
  type SoilMineral,
} from '@/lib/agri-ref-data';
import { copyFor, useTranslation } from '@/lib/language-store';

const HUES = ['N', '10YR', '7.5YR', '5YR', '2.5YR', '10R', '5R', '5Y', '5B'];

const DRAINAGE_META: Record<string, { label: string; color: string; emoji: string }> = {
  well: { label: 'Well-drained', color: '#10b981', emoji: '✅' },
  moderate: { label: 'Moderately drained', color: '#eab308', emoji: '⚡' },
  poor: { label: 'Poorly drained', color: '#f97316', emoji: '⚠️' },
  very_poor: { label: 'Very poorly drained', color: '#dc2626', emoji: '🚨' },
};
const DRAINAGE_AR: Record<string, string> = { well: 'جيدة الصرف', moderate: 'متوسطة الصرف', poor: 'ضعيفة الصرف', very_poor: 'ضعيفة الصرف جداً' };

const IRON_META: Record<string, { label: string; color: string }> = {
  high: { label: 'Iron-rich', color: '#dc2626' },
  moderate: { label: 'Moderate iron', color: '#eab308' },
  low: { label: 'Low iron', color: '#0891b2' },
  depleted: { label: 'Iron-depleted (reduced)', color: '#6366f1' },
};
const IRON_AR: Record<string, string> = { high: 'غني بالحديد', moderate: 'حديد متوسط', low: 'حديد منخفض', depleted: 'مستنفد الحديد (مختزل)' };
const MINERAL_AR: Record<string, string> = {
  'goethite-coarse': 'غوثيت خشن', 'goethite-fine': 'غوثيت ناعم', 'hematite-coarse': 'هيماتيت خشن', 'hematite-fine': 'هيماتيت ناعم',
  ferrihydrite: 'فيريهيدريت', lepidocrocite: 'ليبيدوكروسيت', siderite: 'سيديريت', pyrite: 'بيريت', vivianite: 'فيفيانيت',
  'manganese-oxide': 'أكسيد المنغنيز', calcite: 'كالسيت', gypsum: 'جبس', 'organic-matter': 'مادة عضوية',
};
const INTERPRETATION_AR: Record<string, string> = {
  'Iron oxide (goethite) — well-drained, oxidized soil. Common in mature tropical/temperate soils.': 'أكسيد الحديد (الغوثيت) — تربة جيدة الصرف ومؤكسدة. شائع في الترب المدارية والمعتدلة الناضجة.',
  'Fine goethite — yellowish-brown, well-drained. Iron is oxidized + stable.': 'غوثيت ناعم — بني مصفر وجيد الصرف. الحديد مؤكسد ومستقر.',
  'Iron oxide (hematite) — red soil, highly oxidized. Tropical Oxisols/Ultisols. Good drainage.': 'أكسيد الحديد (الهيماتيت) — تربة حمراء عالية الأكسدة. يوجد في الأوكسيسولات والألتيسولات المدارية. صرف جيد.',
  'Fine hematite — bright red, well-oxidized. Common in Mediterranean + tropical red soils.': 'هيماتيت ناعم — أحمر زاهٍ ومؤكسد جيداً. شائع في الترب الحمراء المتوسطية والمدارية.',
  'Amorphous iron — young soil, recently drained. Transitional oxidation state.': 'حديد غير متبلور — تربة فتية صُرفت حديثاً. حالة أكسدة انتقالية.',
  'Iron oxyhydroxide — seasonally saturated soil. Alternating wet/dry conditions.': 'أوكسي هيدروكسيد الحديد — تربة مشبعة موسمياً. تتناوب فيها ظروف البلل والجفاف.',
  'Iron carbonate — waterlogged, reducing conditions. Poor drainage, anaerobic.': 'كربونات الحديد — تربة مغمورة وظروف اختزال. صرف ضعيف وبيئة لاهوائية.',
  'Iron sulfide — permanently waterlogged. Acid sulfate risk if drained. Very poor drainage.': 'كبريتيد الحديد — تربة مغمورة دائماً. خطر تكوّن الكبريتات الحمضية عند الصرف. صرف ضعيف جداً.',
  'Iron phosphate — highly reduced, waterlogged. Phosphorus release on drainage.': 'فوسفات الحديد — مختزل بدرجة عالية ومغمور بالماء. قد يتحرر الفوسفور عند الصرف.',
  'Manganese oxide — black coatings/mottles. Common in poorly drained soils with Mn toxicity risk.': 'أكسيد المنغنيز — أغلفة أو تبقعات سوداء. شائع في الترب ضعيفة الصرف مع خطر سمية المنغنيز.',
  'Calcium carbonate — white/very pale. Calcareous soil, high pH (7.5-8.5). May cause Fe/Zn deficiency.': 'كربونات الكالسيوم — بيضاء أو شاحبة جداً. تربة كلسية ذات pH مرتفع (7.5–8.5)، وقد تسبب نقص الحديد والزنك.',
  'Calcium sulfate — white. Saline-sodic soil reclamation. Common in arid regions.': 'كبريتات الكالسيوم — بيضاء. تُستخدم لاستصلاح الترب الملحية والصودية، وشائعة في المناطق الجافة.',
  'Organic matter accumulation — dark black. High biological activity, good fertility.': 'تراكم المادة العضوية — لون أسود داكن. نشاط حيوي مرتفع وخصوبة جيدة.',
};
const TRADITIONAL_AR: Record<string, string> = {
  black: 'أسود', 'very dark gray/brown': 'رمادي داكن جداً/بني', 'dark grayish brown': 'بني رمادي داكن', brown: 'بني',
  'yellowish brown': 'بني مصفر', 'pale brown': 'بني شاحب', 'very pale brown/white': 'بني شاحب جداً/أبيض',
};
type UiLanguage = Parameters<typeof copyFor>[0];
const dynamicLabel = (language: UiLanguage, text: string, arabic: Record<string, string>) => copyFor(language, text, arabic[text] || text);

type Tab = 'identifier' | 'states';

export function SoilColorIdentifier() {
  const { language } = useTranslation();
  const [tab, setTab] = useState<Tab>('identifier');

  return (
    <Card className="overflow-hidden border-stone-200 shadow-sm dark:border-stone-800">
      <CardHeader className="border-b border-border/60 bg-stone-50/60 pb-4 dark:bg-stone-950/20">
        <CardTitle className="flex items-center gap-2 text-base"><span className="rounded-lg bg-stone-200 p-2 text-stone-700 dark:bg-stone-800 dark:text-stone-200">
          <Mountain className="h-4 w-4" /></span> {copyFor(language, 'Soil Color Identifier', 'مُعرّف لون التربة')}
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">{copyFor(language, 'Munsell color → mineral + drainage + iron status · US state soils · from agridatasets-py (aqp R package)', 'لون مونسل ← المعدن + الصرف + حالة الحديد · ترب الولايات المتحدة · من agridatasets-py (حزمة aqp بلغة R)')}</p>
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1 dark:bg-stone-900">
          <button type="button" aria-pressed={tab === 'identifier'} onClick={() => setTab('identifier')} className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${tab === 'identifier' ? 'bg-background text-stone-700 shadow-sm dark:text-stone-200' : 'text-muted-foreground hover:text-foreground'}`}>
            <Mountain className="h-4 w-4" /> {copyFor(language, 'Color → Mineral', 'اللون ← المعدن')}
          </button>
          <button type="button" aria-pressed={tab === 'states'} onClick={() => setTab('states')} className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${tab === 'states' ? 'bg-background text-stone-700 shadow-sm dark:text-stone-200' : 'text-muted-foreground hover:text-foreground'}`}>
            <Droplets className="h-4 w-4" /> {copyFor(language, 'US State Soils', 'ترب الولايات المتحدة')}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {tab === 'identifier' && <IdentifierTab language={language} />}
        {tab === 'states' && <StatesTab language={language} />}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Tab 1: Soil Color → Mineral Identifier
// ============================================================================

function IdentifierTab({ language }: { language: UiLanguage }) {
  const [hue, setHue] = useState('10YR');
  const [value, setValue] = useState('5');
  const [chroma, setChroma] = useState('6');

  const match = useMemo(() => {
    const v = parseInt(value), c = parseInt(chroma);
    // Find closest mineral match by hue + approximate value/chroma
    let best: SoilMineral | null = null;
    let bestDist = Infinity;
    for (const m of SOIL_MINERALS) {
      if (m.hue !== hue && !(m.hue === 'N' && hue === 'N')) continue;
      const dist = Math.abs(m.value - v) + Math.abs(m.chroma - c);
      if (dist < bestDist) {
        bestDist = dist;
        best = m;
      }
    }
    if (!best || bestDist > 5) return null;
    return { mineral: best, dist: bestDist };
  }, [hue, value, chroma]);

  const munsellNotation = `${hue} ${value}/${chroma}`;
  const traditionalName = useMemo(() => {
    const found = MUNSELL_COLORS.find(c => c.munsell === munsellNotation);
    if (found) return found.traditionalName;
    // Approximate
    if (parseInt(value) <= 2) return 'black';
    if (parseInt(value) <= 3) return 'very dark gray/brown';
    if (parseInt(value) <= 4) return 'dark grayish brown';
    if (parseInt(value) <= 5) return 'brown';
    if (parseInt(value) <= 6) return 'yellowish brown';
    if (parseInt(value) <= 7) return 'pale brown';
    return 'very pale brown/white';
  }, [munsellNotation]);

  const drainageMeta = match?.mineral ? DRAINAGE_META[match.mineral.drainage] : null;
  const ironMeta = match?.mineral ? IRON_META[match.mineral.ironStatus] : null;

  // Generate visual color swatch
  const colorSwatch = useMemo(() => {
    // Approximate Munsell to RGB
    const hueMap: Record<string, [number, number, number]> = {
      'N': [value as any * 25, value as any * 25, value as any * 25],
      '10YR': [200 - parseInt(value) * 10, 170 - parseInt(value) * 10, 120 - parseInt(value) * 8],
      '7.5YR': [190 - parseInt(value) * 10, 150 - parseInt(value) * 10, 100 - parseInt(value) * 8],
      '5YR': [180 - parseInt(value) * 10, 120 - parseInt(value) * 10, 80 - parseInt(value) * 6],
      '2.5YR': [170 - parseInt(value) * 10, 90 - parseInt(value) * 8, 60 - parseInt(value) * 5],
      '10R': [160 - parseInt(value) * 10, 80 - parseInt(value) * 8, 50 - parseInt(value) * 5],
      '5R': [150 - parseInt(value) * 10, 70 - parseInt(value) * 8, 40 - parseInt(value) * 5],
      '5Y': [180 - parseInt(value) * 10, 180 - parseInt(value) * 10, 100 - parseInt(value) * 8],
      '5B': [100 - parseInt(value) * 8, 150 - parseInt(value) * 10, 180 - parseInt(value) * 10],
    };
    const rgb = hueMap[hue] || [150, 150, 150];
    const c = parseInt(chroma);
    const factor = 0.5 + c * 0.08;
    const r = Math.min(255, Math.max(0, Math.round(rgb[0] * factor)));
    const g = Math.min(255, Math.max(0, Math.round(rgb[1] * factor)));
    const b = Math.min(255, Math.max(0, Math.round(rgb[2] * factor)));
    return `rgb(${r}, ${g}, ${b})`;
  }, [hue, value, chroma]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-stone-200/70 bg-stone-50/40 p-3 sm:grid-cols-3 dark:border-stone-800 dark:bg-stone-950/10">
        <div>
          <Label className="text-[11px] font-medium">{copyFor(language, 'Hue', 'درجة اللون')}</Label>
          <select value={hue} onChange={e => setHue(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {HUES.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-[11px] font-medium">{copyFor(language, 'Value (1-8)', 'القيمة (1–8)')}</Label>
          <Input value={value} onChange={e => setValue(e.target.value)} type="number" min="1" max="8" step="1" className="mt-1 h-10 text-sm" />
        </div>
        <div>
          <Label className="text-[11px] font-medium">{copyFor(language, 'Chroma (0-8)', 'شدة اللون (0–8)')}</Label>
          <Input value={chroma} onChange={e => setChroma(e.target.value)} type="number" min="0" max="8" step="1" className="mt-1 h-10 text-sm" />
        </div>
      </div>

      {/* Color swatch + Munsell notation */}
      <div className="flex items-center gap-3 rounded-xl border border-stone-200/80 bg-background p-3 shadow-sm dark:border-stone-800">
        <div className="h-16 w-16 shrink-0 rounded-xl border-2 border-background shadow-inner ring-1 ring-border" aria-label={copyFor(language, `Approximate soil color swatch for ${munsellNotation}`, `عينة لون التربة التقريبية لـ ${munsellNotation}`)} style={{ backgroundColor: colorSwatch }} />
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Munsell notation', 'ترميز مونسل')}</div>
          <div className="font-mono text-xl font-bold">{munsellNotation}</div>
          <div className="text-xs text-muted-foreground capitalize">{dynamicLabel(language, traditionalName, TRADITIONAL_AR)}</div>
        </div>
      </div>

      {/* Mineral match result */}
      {match ? (
        <div className="space-y-2">
          <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/70 p-4 shadow-sm dark:border-stone-800 dark:bg-stone-950/20">
            <div className="flex items-center gap-2">
              <div><p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Closest mineral interpretation', 'أقرب تفسير معدني')}</p><span className="text-base font-bold">{dynamicLabel(language, match.mineral.mineral, MINERAL_AR)}</span></div>
              <Badge variant="outline" className="text-[9px]">{copyFor(language, 'match distance', 'مسافة المطابقة')}: {match.dist}</Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{dynamicLabel(language, match.mineral.interpretation, INTERPRETATION_AR)}</p>

            <div className="grid grid-cols-2 gap-2">
              {drainageMeta && (
                <div className="rounded-md border p-2" style={{ borderColor: drainageMeta.color + '60', backgroundColor: drainageMeta.color + '15' }}>
                  <div className="text-[9px] text-muted-foreground uppercase">{copyFor(language, 'Drainage', 'الصرف')}</div>
                  <div className="text-sm font-semibold" style={{ color: drainageMeta.color }}>{drainageMeta.emoji} {copyFor(language, drainageMeta.label, DRAINAGE_AR[match.mineral.drainage] || drainageMeta.label)}</div>
                </div>
              )}
              {ironMeta && (
                <div className="rounded-md border p-2" style={{ borderColor: ironMeta.color + '60', backgroundColor: ironMeta.color + '15' }}>
                  <div className="text-[9px] text-muted-foreground uppercase">{copyFor(language, 'Iron Status', 'حالة الحديد')}</div>
                  <div className="text-sm font-semibold" style={{ color: ironMeta.color }}>{copyFor(language, ironMeta.label, IRON_AR[match.mineral.ironStatus] || ironMeta.label)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Management recommendations */}
          {match.mineral.drainage === 'very_poor' && (
            <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20 p-2 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span><strong>{copyFor(language, 'Very poor drainage.', 'صرف ضعيف جداً.')}</strong> {copyFor(language, 'Waterlogged, anaerobic. Install drainage OR plant water-tolerant crops (rice). If drained: acid sulfate risk (pyrite) or P release (vivianite).', 'تربة مغمورة ولاهوائية. أنشئ نظام صرف أو ازرع محاصيل تتحمل الماء مثل الأرز. عند الصرف: خطر الكبريتات الحمضية (البيريت) أو تحرر الفوسفور (الفيفيانيت).')}</span>
            </div>
          )}
          {match.mineral.mineral === 'calcite' && (
            <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-2 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span><strong>{copyFor(language, 'Calcareous soil (high CaCO₃).', 'تربة كلسية (مرتفعة CaCO₃).')}</strong> {copyFor(language, 'pH 7.5-8.5. Iron + zinc deficiency likely. Apply chelated Fe/Zn or acid-forming amendments (sulfur, ammonium sulfate).', 'درجة الحموضة 7.5–8.5. يُحتمل نقص الحديد والزنك. طبّق Fe/Zn مخلّباً أو محسنات مكوّنة للأحماض مثل الكبريت وكبريتات الأمونيوم.')}</span>
            </div>
          )}
          {match.mineral.drainage === 'well' && match.mineral.ironStatus === 'high' && (
            <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span><strong>{copyFor(language, 'Healthy, well-drained soil.', 'تربة صحية وجيدة الصرف.')}</strong> {copyFor(language, 'Iron is oxidized + stable. Good root environment. Maintain OM + avoid compaction.', 'الحديد مؤكسد ومستقر. بيئة جيدة للجذور. حافظ على المادة العضوية وتجنب الانضغاط.')}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-xs text-muted-foreground">
          {copyFor(language, 'No close mineral match. Try different hue/value/chroma combination.', 'لا توجد مطابقة معدنية قريبة. جرّب تركيبة مختلفة من درجة اللون والقيمة وشدة اللون.')}
        </div>
      )}

      {/* All minerals reference */}
      <details className="text-xs">
        <summary className="min-h-11 cursor-pointer rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground">📋 {copyFor(language, 'View all', 'عرض جميع')} {SOIL_MINERALS.length} {copyFor(language, 'soil minerals', 'معادن التربة')}</summary>
        <div className="mt-2 space-y-1 max-h-[200px] overflow-y-auto">
          {SOIL_MINERALS.map(m => (
            <div key={m.mineral} className="flex items-center gap-2 rounded border p-1.5">
              <div className="w-6 h-6 rounded shrink-0" style={{
                backgroundColor: m.hue === 'N' ? `rgb(${m.value * 25}, ${m.value * 25}, ${m.value * 25})` :
                  m.hue === '10YR' ? `rgb(${200 - m.value * 10}, ${170 - m.value * 10}, ${120 - m.value * 8})` :
                  m.hue === '7.5YR' ? `rgb(${190 - m.value * 10}, ${150 - m.value * 10}, ${100 - m.value * 8})` :
                  m.hue === '5YR' ? `rgb(${180 - m.value * 10}, ${120 - m.value * 10}, ${80 - m.value * 6})` :
                  m.hue === '5R' || m.hue === '10R' ? `rgb(${160 - m.value * 10}, ${70 - m.value * 8}, ${40 - m.value * 5})` :
                  m.hue === '5Y' ? `rgb(${180 - m.value * 10}, ${180 - m.value * 10}, ${100 - m.value * 8})` :
                  m.hue === '5B' ? `rgb(${100 - m.value * 8}, ${150 - m.value * 10}, ${180 - m.value * 10})` :
                  'rgb(150,150,150)'
              }} />
              <div className="flex-1 min-w-0">
                <span className="font-mono text-[10px] font-semibold">{dynamicLabel(language, m.mineral, MINERAL_AR)}</span>
                <span className="text-[9px] text-muted-foreground ml-1.5">{m.color}</span>
              </div>
              <span className="text-[9px] text-muted-foreground">{DRAINAGE_META[m.drainage].emoji}</span>
            </div>
          ))}
        </div>
      </details>

      <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
        💡 {copyFor(language, 'Munsell color is the universal soil color system. Hue = color family (YR=yellow-red), Value = lightness (0=black, 10=white), Chroma = intensity (0=gray, 8=vivid). Compare with a Munsell soil color book in the field.', 'لون مونسل هو النظام العالمي لألوان التربة. درجة اللون = عائلة اللون (YR=أصفر-أحمر)، والقيمة = الفاتحية (0=أسود، 10=أبيض)، وشدة اللون = الكثافة (0=رمادي، 8=زاهٍ). قارنه بكتاب ألوان تربة مونسل في الحقل.')}
      </div>
    </div>
  );
}

// ============================================================================
// Tab 2: US State Soils
// ============================================================================

function StatesTab({ language }: { language: UiLanguage }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return US_STATE_SOILS;
    return US_STATE_SOILS.filter(s =>
      s.state.toLowerCase().includes(q) ||
      s.abbreviation.toLowerCase().includes(q) ||
      s.series.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label={copyFor(language, 'Search state or soil series', 'البحث عن ولاية أو سلسلة تربة')} value={search} onChange={e => setSearch(e.target.value)} placeholder={copyFor(language, 'Search state or soil series…', 'ابحث عن ولاية أو سلسلة تربة…')} className="h-11 pl-10 text-sm" />
      </div>

      <div className="flex items-center justify-between gap-2"><div><p className="text-sm font-semibold">{copyFor(language, 'Reference soils by state', 'ترب مرجعية حسب الولاية')}</p><p className="text-xs text-muted-foreground">{copyFor(language, 'Use the series name as a starting point for local verification.', 'استخدم اسم السلسلة كنقطة بداية للتحقق المحلي.')}</p></div><Badge variant="secondary" className="text-[10px]">{filtered.length} {copyFor(language, filtered.length === 1 ? 'result' : 'results', filtered.length === 1 ? 'نتيجة' : 'نتائج')}</Badge></div>

      <div className="grid max-h-[350px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(s => (
          <div key={s.abbreviation} className="rounded-xl border bg-card p-3 transition-shadow hover:shadow-sm">
            <div className="text-[10px] font-semibold">{s.state}</div>
            <div className="text-[9px] text-muted-foreground">{s.abbreviation}</div>
            <div className="mt-1 text-[10px]">
              <span className="text-muted-foreground">{copyFor(language, 'Series:', 'السلسلة:')}</span>{' '}
              <span className="font-medium">{s.series}</span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{copyFor(language, `No state soils match “${search}”. Try a state abbreviation or soil-series name.`, `لا تطابق أي تربة ولاية «${search}». جرّب اختصار الولاية أو اسم سلسلة التربة.`)}</div>}

      <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
        💡 {copyFor(language, 'State soils are representative soil series designated by USDA-NRCS for each US state. They reflect the dominant agricultural soil and its management challenges. Source: aqp R package.', 'ترب الولايات هي سلاسل تربة ممثلة يحددها USDA-NRCS لكل ولاية أمريكية. تعكس التربة الزراعية السائدة وتحديات إدارتها. المصدر: حزمة aqp بلغة R.')}
      </div>
    </div>
  );
}
