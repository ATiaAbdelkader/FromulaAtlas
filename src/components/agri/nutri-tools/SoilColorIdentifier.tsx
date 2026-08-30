'use client';

import { useState, useMemo } from 'react';
import {
  Droplets, Mountain, Search, AlertTriangle, CheckCircle2,
  Copy, RotateCcw,
} from 'lucide-react';
import {
  SOIL_MINERALS, MUNSELL_COLORS, US_STATE_SOILS,
  type SoilMineral,
} from '@/lib/agri-ref-data';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

const HUES = ['N', '10YR', '7.5YR', '5YR', '2.5YR', '10R', '5R', '5Y', '5B'];

const DRAINAGE_META: Record<string, { label: string; color: string; emoji: string }> = {
  well: { label: 'Well-drained', color: '#10b981', emoji: '✅' },
  moderate: { label: 'Moderately drained', color: '#eab308', emoji: '⚡' },
  poor: { label: 'Poorly drained', color: '#f97316', emoji: '⚠️' },
  very_poor: { label: 'Very poorly drained', color: '#dc2626', emoji: '🚨' },
};
const DRAINAGE_AR: Record<string, string> = { well: 'جيدة الصرف', moderate: 'متوسطة الصرف', poor: 'ضعيفة الصرف', very_poor: 'ضعيفة الصرف جداً' };
const DRAINAGE_FR: Record<string, string> = { well: 'Bien drainé', moderate: 'Drainage modéré', poor: 'Mal drainé', very_poor: 'Très mal drainé' };

const IRON_META: Record<string, { label: string; color: string }> = {
  high: { label: 'Iron-rich', color: '#dc2626' },
  moderate: { label: 'Moderate iron', color: '#eab308' },
  low: { label: 'Low iron', color: '#0891b2' },
  depleted: { label: 'Iron-depleted (reduced)', color: '#6366f1' },
};
const IRON_AR: Record<string, string> = { high: 'غني بالحديد', moderate: 'حديد متوسط', low: 'حديد منخفض', depleted: 'مستنفد الحديد (مختزل)' };
const IRON_FR: Record<string, string> = { high: 'Riche en fer', moderate: 'Fer modéré', low: 'Fer faible', depleted: 'Fer épuisé (réduit)' };
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
const TRADITIONAL_FR: Record<string, string> = {
  black: 'noir', 'very dark gray/brown': 'gris/marron très foncé', 'dark grayish brown': 'brun grisâtre foncé', brown: 'brun',
  'yellowish brown': 'brun jaunâtre', 'pale brown': 'brun pâle', 'very pale brown/white': 'brun très pâle/blanc',
};

type UiLanguage = Parameters<typeof copyFor>[0];
const dynamicLabel = (language: UiLanguage, text: string, arabic: Record<string, string>) => copyFor(language, text, arabic[text] || text);

const TITLE: TrilingualString = {
  en: 'Soil Color Identifier',
  ar: 'مُعرّف لون التربة',
  fr: 'Identifiant de Couleur du Sol',
};

const DESC: TrilingualString = {
  en: 'Munsell color → mineral + drainage + iron status · US state soils · from agridatasets-py (aqp R package)',
  ar: 'لون مونسل ← المعدن + الصرف + حالة الحديد · ترب الولايات المتحدة · من agridatasets-py (حزمة aqp بلغة R)',
  fr: 'Couleur Munsell → minéral + drainage + état du fer · Sols d\'États US · depuis agridatasets-py (paquet aqp R)',
};

const PILL_LABEL: TrilingualString = { en: 'Mode:', ar: 'الوضع:', fr: 'Mode :' };

type Tab = 'identifier' | 'states';

export function SoilColorIdentifier() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [tab, setTab] = useState<Tab>('identifier');
  const [copied, setCopied] = useState(false);

  // Identifier tab state (lifted so the hero Copy/Reset can reach it)
  const [hue, setHue] = useState('10YR');
  const [value, setValue] = useState('5');
  const [chroma, setChroma] = useState('6');

  // States tab state
  const [search, setSearch] = useState('');

  // ---- Identifier tab derived values (calculation logic unchanged) ----
  const match = useMemo(() => {
    const v = parseInt(value), c = parseInt(chroma);
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

  const colorSwatch = useMemo(() => {
    const hueMap: Record<string, [number, number, number]> = {
      'N': [parseInt(value) * 25, parseInt(value) * 25, parseInt(value) * 25],
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

  // ---- States tab derived values ----
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return US_STATE_SOILS;
    return US_STATE_SOILS.filter(s =>
      s.state.toLowerCase().includes(q) ||
      s.abbreviation.toLowerCase().includes(q) ||
      s.series.toLowerCase().includes(q)
    );
  }, [search]);

  // ---- Hero actions ----
  const handleReset = () => {
    if (tab === 'identifier') {
      setHue('10YR'); setValue('5'); setChroma('6');
      toast({ title: tr('Reset to defaults', 'تمت إعادة التعيين', 'Réinitialisé') });
    } else {
      setSearch('');
      toast({ title: tr('Search cleared', 'تم مسح البحث', 'Recherche effacée') });
    }
  };

  const handleCopy = () => {
    let text: string;
    if (tab === 'identifier') {
      const lines = [
        '=== SOIL COLOR IDENTIFIER ===',
        `Munsell: ${munsellNotation}`,
        `Traditional name: ${traditionalName}`,
      ];
      if (match) {
        lines.push(`Closest mineral: ${match.mineral.mineral} (match distance: ${match.dist})`);
        lines.push(`Drainage: ${DRAINAGE_META[match.mineral.drainage].label}`);
        lines.push(`Iron status: ${IRON_META[match.mineral.ironStatus].label}`);
        lines.push('', `Interpretation: ${match.mineral.interpretation}`);
      } else {
        lines.push('No close mineral match.');
      }
      text = lines.join('\n');
    } else {
      const lines = ['=== US STATE SOILS ==='];
      filtered.forEach(s => lines.push(`${s.state} (${s.abbreviation}): ${s.series}`));
      lines.push('', `${filtered.length} results`);
      text = lines.join('\n');
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <CalculatorShell
      icon={Mountain}
      title={TITLE}
      description={DESC}
      badge={tr('Munsell System', 'نظام مونسل', 'Système Munsell')}
      accent="amber"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ الملخص', fr: 'Copier' },
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
      pills={[
        { key: 'identifier', label: tr('Color → Mineral', 'اللون ← المعدن', 'Couleur → Minéral') },
        { key: 'states', label: tr('US State Soils', 'ترب الولايات', 'Sols d\'États US') },
      ]}
      activePill={tab}
      onPillClick={(k) => setTab(k as Tab)}
      pillLabel={PILL_LABEL}
    >
      {tab === 'identifier' ? (
        <>
          <CalculatorShell.Inputs>
            {/* Hue / Value / Chroma inputs */}
            <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-base font-bold flex items-center gap-2">
                  <Mountain className="h-4 w-4 text-amber-600" />
                  {tr('Munsell Coordinates', 'إحداثيات مونسل', 'Coordonnées Munsell')}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <CalculatorShell.InputField
                  label={tr('Hue', 'درجة اللون', 'Teinte')}
                  value={hue}
                  onChange={setHue}
                  type="text"
                  helper={tr('YR = yellow-red', 'YR = أصفر-أحمر', 'YR = jaune-rouge')}
                />
                <CalculatorShell.InputField
                  label={tr('Value (1-8)', 'القيمة (1–8)', 'Valeur (1-8)')}
                  value={value}
                  onChange={setValue}
                  step="1"
                  helper={tr('Lightness', 'الفاتحية', 'Luminosité')}
                />
                <CalculatorShell.InputField
                  label={tr('Chroma (0-8)', 'شدة اللون (0–8)', 'Chroma (0-8)')}
                  value={chroma}
                  onChange={setChroma}
                  step="1"
                  helper={tr('Intensity', 'الكثافة', 'Intensité')}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {HUES.slice(0, 9).map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHue(h)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors ${hue === h ? 'bg-amber-500 text-white shadow-md' : 'bg-muted hover:bg-muted/70 text-muted-foreground'}`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Munsell note */}
            <div className="p-3 rounded-xl bg-muted/40 border text-xs text-muted-foreground leading-relaxed">
              💡 {tr('Munsell color is the universal soil color system. Hue = color family (YR=yellow-red), Value = lightness (0=black, 10=white), Chroma = intensity (0=gray, 8=vivid). Compare with a Munsell soil color book in the field.', 'لون مونسل هو النظام العالمي لألوان التربة. درجة اللون = عائلة اللون (YR=أصفر-أحمر)، والقيمة = الفاتحية (0=أسود، 10=أبيض)، وشدة اللون = الكثافة (0=رمادي، 8=زاهٍ). قارنه بكتاب ألوان تربة مونسل في الحقل.', 'La couleur Munsell est le système universel de couleur du sol. Teinte = famille de couleur (YR=jaune-rouge), Valeur = luminosité (0=noir, 10=blanc), Chroma = intensité (0=gris, 8=vif). Comparez avec un livre de couleurs Munsell sur le terrain.')}
            </div>
          </CalculatorShell.Inputs>

          <CalculatorShell.Results>
            {/* Color swatch + Munsell notation */}
            <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-amber-50 via-transparent to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
                <span className="text-base font-bold flex items-center gap-2">
                  🎨 {tr('Color Match', 'مطابقة اللون', 'Correspondance de Couleur')}
                </span>
                <span className="font-mono text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 rounded-lg px-2 py-0.5">
                  {munsellNotation}
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-xl border bg-background p-3">
                <div className="h-16 w-16 shrink-0 rounded-xl border-2 border-background shadow-inner ring-1 ring-border" aria-label={tr(`Approximate soil color swatch for ${munsellNotation}`, `عينة لون التربة التقريبية لـ ${munsellNotation}`, `Échantillon de couleur de sol approximatif pour ${munsellNotation}`)} style={{ backgroundColor: colorSwatch }} />
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{tr('Munsell notation', 'ترميز مونسل', 'Notation Munsell')}</div>
                  <div className="font-mono text-xl font-bold">{munsellNotation}</div>
                  <div className="text-xs text-muted-foreground capitalize">{tr(traditionalName, TRADITIONAL_AR[traditionalName] || traditionalName, TRADITIONAL_FR[traditionalName] || traditionalName)}</div>
                </div>
              </div>

              {match ? (
                <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-800 dark:bg-amber-950/20">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{tr('Closest mineral interpretation', 'أقرب تفسير معدني', 'Interprétation minérale la plus proche')}</p>
                      <span className="text-base font-bold">{dynamicLabel(language, match.mineral.mineral, MINERAL_AR)}</span>
                    </div>
                    <span className="text-[10px] font-mono bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-full px-2 py-0.5">
                      {tr('distance', 'مسافة', 'distance')}: {match.dist}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{dynamicLabel(language, match.mineral.interpretation, INTERPRETATION_AR)}</p>

                  <div className="grid grid-cols-2 gap-2">
                    {drainageMeta && (
                      <div className="rounded-md border p-2" style={{ borderColor: drainageMeta.color + '60', backgroundColor: drainageMeta.color + '15' }}>
                        <div className="text-[9px] text-muted-foreground uppercase">{tr('Drainage', 'الصرف', 'Drainage')}</div>
                        <div className="text-sm font-semibold" style={{ color: drainageMeta.color }}>{drainageMeta.emoji} {tr(drainageMeta.label, DRAINAGE_AR[match.mineral.drainage] || drainageMeta.label, DRAINAGE_FR[match.mineral.drainage] || drainageMeta.label)}</div>
                      </div>
                    )}
                    {ironMeta && (
                      <div className="rounded-md border p-2" style={{ borderColor: ironMeta.color + '60', backgroundColor: ironMeta.color + '15' }}>
                        <div className="text-[9px] text-muted-foreground uppercase">{tr('Iron Status', 'حالة الحديد', 'État du fer')}</div>
                        <div className="text-sm font-semibold" style={{ color: ironMeta.color }}>{tr(ironMeta.label, IRON_AR[match.mineral.ironStatus] || ironMeta.label, IRON_FR[match.mineral.ironStatus] || ironMeta.label)}</div>
                      </div>
                    )}
                  </div>

                  {match.mineral.drainage === 'very_poor' && (
                    <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20 p-2 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span><strong>{tr('Very poor drainage.', 'صرف ضعيف جداً.', 'Très mauvais drainage.')}</strong> {tr('Waterlogged, anaerobic. Install drainage OR plant water-tolerant crops (rice). If drained: acid sulfate risk (pyrite) or P release (vivianite).', 'تربة مغمورة ولاهوائية. أنشئ نظام صرف أو ازرع محاصيل تتحمل الماء مثل الأرز. عند الصرف: خطر الكبريتات الحمضية (البيريت) أو تحرر الفوسفور (الفيفيانيت).', 'Sol inondé, anaérobie. Installez un drainage OU plantez des cultures tolérantes à l\'eau (riz). Si drainé : risque de sulfates acides (pyrite) ou libération de P (vivianite).')}</span>
                    </div>
                  )}
                  {match.mineral.mineral === 'calcite' && (
                    <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-2 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span><strong>{tr('Calcareous soil (high CaCO₃).', 'تربة كلسية (مرتفعة CaCO₃).', 'Sol calcaire (CaCO₃ élevé).')}</strong> {tr('pH 7.5-8.5. Iron + zinc deficiency likely. Apply chelated Fe/Zn or acid-forming amendments (sulfur, ammonium sulfate).', 'درجة الحموضة 7.5–8.5. يُحتمل نقص الحديد والزنك. طبّق Fe/Zn مخلّباً أو محسنات مكوّنة للأحماض مثل الكبريت وكبريتات الأمونيوم.', 'pH 7.5-8.5. Carence en fer + zinc probable. Appliquez Fe/Zn chélatés ou amendements acidifiants (soufre, sulfate d\'ammonium).')}</span>
                    </div>
                  )}
                  {match.mineral.drainage === 'well' && match.mineral.ironStatus === 'high' && (
                    <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span><strong>{tr('Healthy, well-drained soil.', 'تربة صحية وجيدة الصرف.', 'Sol sain, bien drainé.')}</strong> {tr('Iron is oxidized + stable. Good root environment. Maintain OM + avoid compaction.', 'الحديد مؤكسد ومستقر. بيئة جيدة للجذور. حافظ على المادة العضوية وتجنب الانضغاط.', 'Le fer est oxydé + stable. Bon environnement racinaire. Maintenir la MO + éviter le compactage.')}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-muted-foreground rounded-xl border border-dashed">
                  {tr('No close mineral match. Try different hue/value/chroma combination.', 'لا توجد مطابقة معدنية قريبة. جرّب تركيبة مختلفة من درجة اللون والقيمة وشدة اللون.', 'Aucune correspondance minérale proche. Essayez une autre combinaison teinte/valeur/chroma.')}
                </div>
              )}

              {/* All minerals reference */}
              <details className="text-xs">
                <summary className="min-h-11 cursor-pointer rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground">📋 {tr('View all', 'عرض جميع', 'Voir tous les')} {SOIL_MINERALS.length} {tr('soil minerals', 'معادن التربة', 'minéraux du sol')}</summary>
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
            </div>
          </CalculatorShell.Results>
        </>
      ) : (
        <>
          <CalculatorShell.Inputs>
            <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-base font-bold flex items-center gap-2">
                  <Search className="h-4 w-4 text-amber-600" />
                  {tr('Search State Soils', 'ابحث عن ترب الولايات', 'Rechercher sols d\'États')}
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  aria-label={tr('Search state or soil series', 'البحث عن ولاية أو سلسلة تربة', 'Rechercher État ou série de sol')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={tr('Search state or soil series…', 'ابحث عن ولاية أو سلسلة تربة…', 'Rechercher État ou série…')}
                  className="h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{tr('Reference soils by state', 'ترب مرجعية حسب الولاية', 'Sols de référence par État')}</p>
                  <p className="text-xs text-muted-foreground">{tr('Use the series name as a starting point for local verification.', 'استخدم اسم السلسلة كنقطة بداية للتحقق المحلي.', 'Utilisez le nom de la série comme point de départ pour la vérification locale.')}</p>
                </div>
                <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 rounded-full px-2 py-0.5">{filtered.length} {tr(filtered.length === 1 ? 'result' : 'results', filtered.length === 1 ? 'نتيجة' : 'نتائج', filtered.length === 1 ? 'résultat' : 'résultats')}</span>
              </div>
              <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                💡 {tr('State soils are representative soil series designated by USDA-NRCS for each US state. They reflect the dominant agricultural soil and its management challenges. Source: aqp R package.', 'ترب الولايات هي سلاسل تربة ممثلة يحددها USDA-NRCS لكل ولاية أمريكية. تعكس التربة الزراعية السائدة وتحديات إدارتها. المصدر: حزمة aqp بلغة R.', 'Les sols d\'État sont des séries de sol représentatives désignées par l\'USDA-NRCS pour chaque État américain. Ils reflètent le sol agricole dominant. Source : paquet aqp R.')}
              </div>
            </div>
          </CalculatorShell.Inputs>

          <CalculatorShell.Results>
            <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-amber-50 via-transparent to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
                <span className="text-base font-bold flex items-center gap-2">
                  🗺️ {tr('State Soil Series', 'سلاسل ترب الولايات', 'Séries de sols d\'États')}
                </span>
                <Droplets className="h-4 w-4 text-amber-600" />
              </div>
              {filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{tr(`No state soils match “${search}”. Try a state abbreviation or soil-series name.`, `لا تطابق أي تربة ولاية «${search}». جرّب اختصار الولاية أو اسم سلسلة التربة.`, `Aucun sol d'État ne correspond à « ${search} ». Essayez une abréviation d'État ou un nom de série.`)}</div>
              ) : (
                <div className="grid max-h-[400px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                  {filtered.map(s => (
                    <div key={s.abbreviation} className="rounded-xl border bg-card p-3 transition-shadow hover:shadow-sm">
                      <div className="text-[10px] font-semibold">{s.state}</div>
                      <div className="text-[9px] text-muted-foreground">{s.abbreviation}</div>
                      <div className="mt-1 text-[10px]">
                        <span className="text-muted-foreground">{tr('Series:', 'السلسلة:', 'Série :')}</span>{' '}
                        <span className="font-medium">{s.series}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CalculatorShell.Results>
        </>
      )}
    </CalculatorShell>
  );
}
