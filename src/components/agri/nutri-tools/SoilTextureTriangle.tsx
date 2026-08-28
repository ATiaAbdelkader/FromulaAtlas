'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Mountain, Layers, Droplets, Sprout, Download,
} from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { ToolExplainerDialog } from '../ToolExplainerDialog';

// ============================================================================
// Classification systems
// ============================================================================

type System = 'usda' | 'ssew' | 'intl';

const SYSTEM_LABELS: Record<System, string> = {
  usda: 'USDA (USA)',
  ssew: 'SSEW (UK/International)',
  intl: 'International (WRB)',
};
const SYSTEM_AR: Record<System, string> = { usda: 'USDA (الولايات المتحدة)', ssew: 'SSEW (المملكة المتحدة/دولي)', intl: 'دولي (WRB)' };
const TEXTURE_AR: Record<string, string> = {
  Clay: 'طين', 'Sandy Clay': 'طين رملي', 'Sandy Clay Loam': 'طمي طيني رملي', 'Sandy Loam': 'طمي رملي',
  'Loamy Sand': 'رمل طميي', Sand: 'رمل', 'Clay Loam': 'طمي طيني', Loam: 'طمي', 'Silt Loam': 'طمي غريني',
  'Silty Clay': 'طين غريني', 'Silty Clay Loam': 'طمي طيني غريني', Silt: 'غرين', 'Heavy Clay': 'طين ثقيل', 'Sandy Silt Loam': 'طمي غريني رملي',
};
const DRAINAGE_AR: Record<string, string> = { Excessive: 'مفرط', 'Well-drained': 'جيد الصرف', 'Moderately well': 'جيد بشكل متوسط', 'Somewhat poor': 'ضعيف نسبياً', Poor: 'ضعيف' };
const PROPERTY_AR: Record<string, string> = {
  'High OM retention': 'احتفاظ مرتفع بالمادة العضوية', 'Medium OM retention': 'احتفاظ متوسط بالمادة العضوية', 'Low OM retention': 'احتفاظ منخفض بالمادة العضوية',
  'Difficult — sticky when wet, hard when dry': 'صعب — لزج عند البلل وقاسٍ عند الجفاف', 'Moderate — plow when moisture is right': 'متوسط — احرث عند مستوى الرطوبة المناسب',
  'Easy but dries fast': 'سهل لكنه يجف بسرعة', 'Good workability': 'قابلية تشغيل جيدة', 'High wind erosion risk': 'خطر مرتفع للتعرية بالرياح',
  'High water erosion risk (runoff)': 'خطر مرتفع للتعرية المائية (الجريان السطحي)', 'Moderate water erosion': 'تعرية مائية متوسطة', 'Low erosion risk': 'خطر تعرية منخفض',
  'High compaction risk — avoid wet traffic': 'خطر مرتفع للانضغاط — تجنب المرور عند البلل', 'Moderate — compacts under heavy loads': 'متوسط — ينضغط تحت الأحمال الثقيلة', 'Low compaction risk': 'خطر انضغاط منخفض',
  'Drip or sprinkler — avoid flood (leaching)': 'تنقيط أو رش — تجنب الغمر (خطر الغسل)', 'All systems suitable': 'جميع الأنظمة مناسبة', 'Sprinkler or drip — avoid flood': 'رش أو تنقيط — تجنب الغمر', 'Drip only — very slow infiltration': 'تنقيط فقط — تسرب بطيء جداً',
};
const RECOMMENDATION_AR: Record<string, string> = {
  'Add gypsum (1-2 t/ha) to improve structure + drainage': 'أضف الجبس (1–2 طن/هكتار) لتحسين البناء والصرف',
  'Add compost/manure (20-40 t/ha) to improve water holding + CEC': 'أضف الكمبوست أو السماد العضوي (20–40 طن/هكتار) لتحسين الاحتفاظ بالماء وCEC',
  'Protect from crusting — maintain cover crop or mulch': 'احمِ التربة من تكوّن القشرة — حافظ على محصول تغطية أو غطاء عضوي',
  'Low CEC — split fertilizer applications (leaching risk)': 'CEC منخفض — قسّم تطبيقات السماد (خطر الغسل)',
  'Low water holding — irrigate frequently with small doses': 'احتفاظ منخفض بالماء — اروِ بتكرار وبجرعات صغيرة',
  'High water holding — can irrigate less frequently with larger doses': 'احتفاظ مرتفع بالماء — يمكن الري بتكرار أقل وجرعات أكبر',
  'Ideal texture for most crops — good balance of drainage + retention': 'قوام مثالي لمعظم المحاصيل — توازن جيد بين الصرف والاحتفاظ',
};
type UiLanguage = Parameters<typeof copyFor>[0];
const soilCopy = (language: UiLanguage, text: string, arabic: Record<string, string>) => copyFor(language, text, arabic[text] || text);

// USDA polygon vertices (clay, sand, silt, label, x, y)
// x and y are ternary coordinates for the SVG triangle
const USDA_POLYGONS: { label: string; pts: [number, number][] }[] = [
  { label: 'Clay', pts: [[50,100],[27.5,55],[35,40],[60,40],[70,60]] },
  { label: 'Sandy Clay', pts: [[27.5,55],[17.5,35],[37.5,35]] },
  { label: 'Sandy Clay Loam', pts: [[17.5,35],[10,20],[37.5,20],[41.25,27.5],[37.5,35]] },
  { label: 'Sandy Loam', pts: [[10,20],[7.5,15],[30,0],[50,0],[52.5,5],[45,5],[37.5,20]] },
  { label: 'Loamy Sand', pts: [[7.5,15],[5,10],[15,0],[30,0]] },
  { label: 'Sand', pts: [[5,10],[0,0],[15,0]] },
  { label: 'Clay Loam', pts: [[35,40],[41.25,27.5],[66.25,27.5],[60,40]] },
  { label: 'Loam', pts: [[41.25,27.5],[37.5,20],[45,5],[52.5,5],[63.75,27.5]] },
  { label: 'Silt Loam', pts: [[63.75,27.5],[50,0],[80,0],[86.25,12.5],[93.75,12.5],[86.25,27.5]] },
  { label: 'Silty Clay', pts: [[70,60],[60,40],[80,40]] },
  { label: 'Silty Clay Loam', pts: [[60,40],[66.25,27.5],[86.25,27.5],[80,40]] },
  { label: 'Silt', pts: [[86.25,12.5],[80,0],[100,0],[93.75,12.5]] },
];

// USDA classification thresholds
function classifyUSDA(clay: number, sand: number, silt: number): string {
  if (clay >= 40 && sand <= 45) return 'Clay';
  if (clay >= 40 && silt >= 40) return 'Silty Clay';
  if (clay >= 27.5 && silt >= 50) return 'Silty Clay Loam';
  if (clay >= 27.5 && sand >= 20 && silt >= 27.5 && clay < 40) return 'Clay Loam';
  if (clay >= 20 && sand >= 52.5 && silt <= 27.5) return 'Sandy Clay Loam';
  if (clay >= 35 && sand >= 45) return 'Sandy Clay';
  if (clay >= 7.5 && sand <= 50 && silt >= 50) return 'Silt Loam';
  if (silt >= 80 && sand <= 12.5) return 'Silt';
  if (clay >= 7.5 && clay < 27.5 && sand < 52.5 && silt < 50) return 'Loam';
  if (clay < 10 && sand >= 85) return 'Sand';
  if (clay < 15 && sand >= 70) return 'Loamy Sand';
  if (clay < 20 && sand >= 50) return 'Sandy Loam';
  return 'Loam';
}

// SSEW (UK) classification
function classifySSEW(clay: number, sand: number, silt: number): string {
  if (clay >= 35 && sand >= 45) return 'Sandy Clay';
  if (clay >= 35 && silt >= 45) return 'Silty Clay';
  if (clay >= 35) return 'Clay';
  if (clay >= 18 && sand >= 50) return 'Sandy Clay Loam';
  if (clay >= 18 && silt >= 50) return 'Silty Clay Loam';
  if (clay >= 18 && sand < 50 && silt < 50) return 'Clay Loam';
  if (clay < 18 && sand >= 70) return 'Sandy Loam';
  if (clay < 18 && silt >= 50) return 'Sandy Silt Loam';
  if (clay < 18 && sand < 50 && silt < 50) return 'Silt Loam';
  if (clay < 10 && sand >= 85) return 'Sand';
  if (clay < 15 && sand >= 70) return 'Loamy Sand';
  return 'Sandy Loam';
}

// International (WRB/FAO) — simplified
function classifyIntl(clay: number, sand: number, silt: number): string {
  if (clay >= 60) return 'Heavy Clay';
  if (clay >= 35) return 'Clay';
  if (clay >= 25 && sand >= 50) return 'Sandy Clay Loam';
  if (clay >= 25 && silt >= 50) return 'Silty Clay Loam';
  if (clay >= 25) return 'Clay Loam';
  if (clay >= 10 && sand >= 70) return 'Sandy Loam';
  if (clay >= 10 && silt >= 70) return 'Silt Loam';
  if (clay >= 10) return 'Loam';
  if (sand >= 85) return 'Sand';
  if (sand >= 70) return 'Loamy Sand';
  if (silt >= 80) return 'Silt';
  return 'Loamy Sand';
}

// ============================================================================
// Soil property calculations
// ============================================================================

interface SoilProperties {
  texture: string;
  availableWater: { fc: number; pwp: number; taw: number };  // mm/m
  infiltrationRate: number;  // mm/hr
  drainageClass: string;
  cationExchangeCapacity: number;  // meq/100g (estimated)
  bulkDensity: number;  // g/cm³ (estimated)
  organicMatterHolding: string;
  workability: string;
  erosionRisk: string;
  compactionRisk: string;
  irrigationSuitability: string;
  recommendations: string[];
}

function computeProperties(clay: number, sand: number, silt: number, system: System): SoilProperties {
  const texture = system === 'usda' ? classifyUSDA(clay, sand, silt)
    : system === 'ssew' ? classifySSEW(clay, sand, silt)
    : classifyIntl(clay, sand, silt);

  // Saxton-Rawls pedotransfer functions (simplified)
  const fc = 257.6 - 2.0 * sand + 3.4 * clay; // % at -33 kPa
  const pwp = 0.5 + 0.8 * clay; // % at -1500 kPa
  const taw = Math.max(0, fc - pwp) * 10; // mm per meter depth

  // Infiltration rate (approximate by texture)
  const infRates: Record<string, number> = {
    'Sand': 50, 'Loamy Sand': 30, 'Sandy Loam': 15, 'Loam': 8,
    'Silt Loam': 6, 'Silt': 5, 'Sandy Clay Loam': 4, 'Clay Loam': 3,
    'Silty Clay Loam': 2, 'Sandy Clay': 2, 'Silty Clay': 1, 'Clay': 1,
  };
  const infiltration = infRates[texture] ?? 5;

  // Drainage
  const drainage = infiltration > 15 ? 'Excessive' : infiltration > 8 ? 'Well-drained'
    : infiltration > 4 ? 'Moderately well' : infiltration > 2 ? 'Somewhat poor' : 'Poor';

  // CEC (estimated from clay + OM)
  const cec = clay * 0.5 + 10; // simplified: ~0.5 meq per 1% clay + 10 from OM

  // Bulk density
  const bd = 1.65 - clay * 0.005;

  // Properties
  const omHolding = clay > 30 ? 'High OM retention' : clay > 15 ? 'Medium OM retention' : 'Low OM retention';
  const workability = clay > 40 ? 'Difficult — sticky when wet, hard when dry'
    : clay > 25 ? 'Moderate — plow when moisture is right'
    : sand > 70 ? 'Easy but dries fast' : 'Good workability';
  const erosion = sand > 60 ? 'High wind erosion risk' : clay > 40 ? 'High water erosion risk (runoff)' : silt > 50 ? 'Moderate water erosion' : 'Low erosion risk';
  const compaction = clay > 30 ? 'High compaction risk — avoid wet traffic' : sand > 70 ? 'Moderate — compacts under heavy loads' : 'Low compaction risk';
  const irrigation = infiltration > 15 ? 'Drip or sprinkler — avoid flood (leaching)'
    : infiltration > 5 ? 'All systems suitable' : infiltration > 2 ? 'Sprinkler or drip — avoid flood' : 'Drip only — very slow infiltration';

  const recs: string[] = [];
  if (clay > 35) recs.push('Add gypsum (1-2 t/ha) to improve structure + drainage');
  if (sand > 60) recs.push('Add compost/manure (20-40 t/ha) to improve water holding + CEC');
  if (silt > 50) recs.push('Protect from crusting — maintain cover crop or mulch');
  if (cec < 15) recs.push('Low CEC — split fertilizer applications (leaching risk)');
  if (taw < 80) recs.push('Low water holding — irrigate frequently with small doses');
  if (taw > 150) recs.push('High water holding — can irrigate less frequently with larger doses');
  if (clay > 25 && clay < 40) recs.push('Ideal texture for most crops — good balance of drainage + retention');

  return {
    texture, availableWater: { fc, pwp, taw },
    infiltrationRate: infiltration, drainageClass: drainage,
    cationExchangeCapacity: cec, bulkDensity: bd,
    organicMatterHolding: omHolding, workability, erosionRisk: erosion,
    compactionRisk: compaction, irrigationSuitability: irrigation,
    recommendations: recs,
  };
}

// ============================================================================
// SVG Triangle rendering
// ============================================================================

const TRI_SIZE = 320;
const TRI_PAD = 30;
const TRI_HEIGHT = TRI_SIZE * Math.sqrt(3) / 2;

// Convert (clay%, sand%, silt%) to SVG (x, y)
function toXY(clay: number, sand: number, silt: number): [number, number] {
  // Ternary: bottom-left = sand(100), bottom-right = silt(100), top = clay(100)
  const x = TRI_PAD + sand / 100 * TRI_SIZE + silt / 100 * TRI_SIZE * 0.5;
  const y = TRI_PAD + TRI_HEIGHT - (silt / 100 + clay / 100 * 0.5) * 0 + clay / 100 * TRI_HEIGHT;
  // Actually: standard ternary
  // x = sand * (full width) + silt * (half width) → no
  // Simple approach: barycentric
  const px = TRI_PAD + (sand * 0 + silt * TRI_SIZE + clay * TRI_SIZE / 2) / 100;
  const py = TRI_PAD + TRI_HEIGHT - (clay * TRI_HEIGHT) / 100;
  return [px, py];
}

// Color by texture class
const TEXTURE_COLORS: Record<string, string> = {
  'Clay': '#c0392b', 'Sandy Clay': '#e67e22', 'Sandy Clay Loam': '#f39c12',
  'Clay Loam': '#d4a373', 'Silty Clay': '#8e44ad', 'Silty Clay Loam': '#9b59b6',
  'Sandy Loam': '#f1c40f', 'Loam': '#27ae60', 'Silt Loam': '#3498db',
  'Silt': '#2980b9', 'Sand': '#f9e79f', 'Loamy Sand': '#fef9e7',
  'Heavy Clay': '#922b21', 'Sandy Silt Loam': '#5dade2',
};

export function SoilTextureTriangle() {
  const { language } = useTranslation();
  const [system, setSystem] = useState<System>('usda');
  const [clay, setClay] = useState('20');
  const [sand, setSand] = useState('40');
  const [silt, setSilt] = useState('40');

  // Auto-normalize to 100%
  const { c, s, si } = useMemo(() => {
    let cl = parseFloat(clay) || 0, sa = parseFloat(sand) || 0, si = parseFloat(silt) || 0;
    const sum = cl + sa + si;
    if (sum > 0 && Math.abs(sum - 100) > 0.5) {
      cl = cl / sum * 100; sa = sa / sum * 100; si = si / sum * 100;
    }
    return { c: cl, s: sa, si };
  }, [clay, sand, silt]);

  const props = useMemo(() => computeProperties(c, s, si, system), [c, s, si, system]);
  const [pointX, pointY] = toXY(c, s, si);

  const polygons = system === 'usda' ? USDA_POLYGONS : USDA_POLYGONS; // SSEW uses same visual layout

  return (
    <Card className="overflow-hidden border-amber-100 shadow-sm dark:border-amber-900/60">
      <CardHeader className="border-b border-border/60 bg-amber-50/50 pb-4 dark:bg-amber-950/10 flex flex-row items-center justify-between gap-2 flex-wrap">
        <div>
          <CardTitle className="flex items-center gap-2 text-base"><span className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"><Mountain className="h-4 w-4" /></span> {copyFor(language, 'Soil Texture Triangle', 'مثلث قوام التربة')}
          </CardTitle>
          <p className="text-[10px] text-muted-foreground">{copyFor(language, 'Interactive ternary diagram · 3 classification systems (USDA/SSEW/International) · soil properties · irrigation + management recommendations', 'مخطط ثلاثي تفاعلي · 3 أنظمة تصنيف (USDA/SSEW/دولي) · خصائص التربة · توصيات الري والإدارة')}</p>
        </div>
        <ToolExplainerDialog category="soil_texture_awc" triggerVariant="outline" />
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Classification system selector */}
        <div className="grid grid-cols-1 gap-1 rounded-xl bg-amber-100/70 p-1 dark:bg-amber-950/30 sm:grid-cols-3">
          {(['usda', 'ssew', 'intl'] as System[]).map(sys => (
            <button type="button" key={sys} aria-pressed={system === sys} onClick={() => setSystem(sys)}
              className={`min-h-11 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${system === sys ? 'bg-background text-amber-700 shadow-sm dark:text-amber-300' : 'text-muted-foreground hover:text-foreground'}`}>
              {copyFor(language, SYSTEM_LABELS[sys], SYSTEM_AR[sys])}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-amber-200/70 bg-amber-50/30 p-3 sm:grid-cols-3 dark:border-amber-900/60 dark:bg-amber-950/10">
          <div>
            <Label className="text-[11px] font-medium">{copyFor(language, 'Clay (%)', 'الطين (%)')}</Label>
            <Input value={clay} onChange={e => setClay(e.target.value)} type="number" min="0" max="100" step="1" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-[11px] font-medium">{copyFor(language, 'Sand (%)', 'الرمل (%)')}</Label>
            <Input value={sand} onChange={e => setSand(e.target.value)} type="number" min="0" max="100" step="1" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-[11px] font-medium">{copyFor(language, 'Silt (%)', 'الغرين (%)')}</Label>
            <Input value={silt} onChange={e => setSilt(e.target.value)} type="number" min="0" max="100" step="1" className="mt-1 h-10 text-sm" />
          </div>
        </div>
        <div className={`rounded-lg px-3 py-2 text-center text-xs ${Math.abs(c + s + si - 100) > 0.5 ? 'border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200' : 'bg-muted/30 text-muted-foreground'}`}>{copyFor(language, 'Composition total', 'إجمالي التركيب')}: <span className="font-mono font-semibold">{(c + s + si).toFixed(1)}%</span> {Math.abs(c + s + si - 100) > 0.5 && `· ${copyFor(language, 'values auto-normalized to 100%', 'تمت موازنة القيم تلقائياً إلى 100%')}`}</div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          {/* SVG Triangle */}
          <div className="rounded-xl border border-amber-200/70 bg-card p-3 shadow-sm dark:border-amber-900/60">
            <svg viewBox={`0 0 ${TRI_SIZE + TRI_PAD * 2} ${TRI_HEIGHT + TRI_PAD * 2}`} className="w-full h-auto">
              {/* Triangle outline */}
              <polygon
                points={`${TRI_PAD},${TRI_PAD + TRI_HEIGHT} ${TRI_PAD + TRI_SIZE},${TRI_PAD + TRI_HEIGHT} ${TRI_PAD + TRI_SIZE / 2},${TRI_PAD}`}
                fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground"
              />

              {/* Classification polygons */}
              {polygons.map((poly, i) => {
                const pts = poly.pts.map(([x, y]) => `${x},${y}`).join(' ');
                const color = TEXTURE_COLORS[poly.label] ?? '#e0e0e0';
                return (
                  <polygon key={i} points={pts}
                    fill={color} fillOpacity="0.3"
                    stroke={color} strokeOpacity="0.6" strokeWidth="0.5"
                  />
                );
              })}

              {/* Grid lines (10% intervals) */}
              {Array.from({ length: 9 }, (_, i) => {
                const pct = (i + 1) * 10;
                // Clay lines (horizontal)
                const [x1, y1] = toXY(pct, 100 - pct, 0);
                const [x2, y2] = toXY(pct, 0, 100 - pct);
                return <line key={`clay-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.3" className="text-muted-foreground/20" />;
              })}
              {Array.from({ length: 9 }, (_, i) => {
                const pct = (i + 1) * 10;
                // Sand lines
                const [x1, y1] = toXY(0, pct, 100 - pct);
                const [x2, y2] = toXY(100 - pct, pct, 0);
                return <line key={`sand-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.3" className="text-muted-foreground/20" />;
              })}
              {Array.from({ length: 9 }, (_, i) => {
                const pct = (i + 1) * 10;
                // Silt lines
                const [x1, y1] = toXY(0, 100 - pct, pct);
                const [x2, y2] = toXY(100 - pct, 0, pct);
                return <line key={`silt-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.3" className="text-muted-foreground/20" />;
              })}

              {/* Axis labels */}
              <text x={TRI_PAD + TRI_SIZE / 2} y={TRI_PAD + TRI_HEIGHT + 20} textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor" className="text-muted-foreground">{copyFor(language, 'Sand (%)', 'الرمل (%)')}</text>
              <text x={TRI_PAD - 8} y={TRI_PAD + TRI_HEIGHT / 2} textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor" className="text-muted-foreground" transform={`rotate(-90 ${TRI_PAD - 8} ${TRI_PAD + TRI_HEIGHT / 2})`}>{copyFor(language, 'Clay (%)', 'الطين (%)')}</text>
              <text x={TRI_PAD + TRI_SIZE + 8} y={TRI_PAD + TRI_HEIGHT / 2} textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor" className="text-muted-foreground" transform={`rotate(90 ${TRI_PAD + TRI_SIZE + 8} ${TRI_PAD + TRI_HEIGHT / 2})`}>{copyFor(language, 'Silt (%)', 'الغرين (%)')}</text>

              {/* Tick marks */}
              {[0, 20, 40, 60, 80, 100].map(pct => (
                <text key={`tick-clay-${pct}`} x={TRI_PAD - 5} y={TRI_PAD + TRI_HEIGHT - (pct / 100) * TRI_HEIGHT + 3} textAnchor="end" fontSize="7" fill="currentColor" className="text-muted-foreground">{pct}</text>
              ))}
              {[0, 20, 40, 60, 80, 100].map(pct => (
                <text key={`tick-sand-${pct}`} x={TRI_PAD + (pct / 100) * TRI_SIZE} y={TRI_PAD + TRI_HEIGHT + 10} textAnchor="middle" fontSize="7" fill="currentColor" className="text-muted-foreground">{pct}</text>
              ))}

              {/* User's soil point */}
              <circle cx={pointX} cy={pointY} r="8" fill="#dc2626" stroke="white" strokeWidth="2" />
              <circle cx={pointX} cy={pointY} r="14" fill="none" stroke="#dc2626" strokeWidth="1" opacity="0.4" />
              <text x={pointX} y={pointY - 14} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#dc2626">{copyFor(language, 'Your soil', 'تربتك')}</text>
            </svg>
          </div>

          {/* Results panel */}
          <div className="space-y-3">
            {/* Texture classification */}
            <div className="rounded-xl border-2 p-4 text-center shadow-sm" style={{ borderColor: TEXTURE_COLORS[props.texture] ?? '#999', backgroundColor: (TEXTURE_COLORS[props.texture] ?? '#999') + '15' }}>
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Classification', 'التصنيف')} · {copyFor(language, SYSTEM_LABELS[system], SYSTEM_AR[system])}</div>
              <div className="mt-1 text-2xl font-bold" style={{ color: TEXTURE_COLORS[props.texture] ?? '#333' }}>{soilCopy(language, props.texture, TEXTURE_AR)}</div>
              <div className="text-[10px] text-muted-foreground">{c.toFixed(0)}% clay · {s.toFixed(0)}% sand · {si.toFixed(0)}% silt</div>
            </div>

            {/* Soil properties grid */}
            <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              <PropCard icon={Droplets} label={copyFor(language, 'Avail. Water', 'الماء المتاح')} value={`${props.availableWater.taw.toFixed(0)} mm/m`} sub={`FC ${props.availableWater.fc.toFixed(0)}% · PWP ${props.availableWater.pwp.toFixed(0)}%`} color="#0891b2" />
              <PropCard icon={Layers} label={copyFor(language, 'Infiltration', 'التسرب')} value={`${props.infiltrationRate} mm/hr`} sub={soilCopy(language, props.drainageClass, DRAINAGE_AR)} color="#0ea5e9" />
              <PropCard icon={Mountain} label={copyFor(language, 'Bulk density', 'الكثافة الظاهرية')} value={`${props.bulkDensity.toFixed(2)} g/cm³`} sub={`CEC ${props.cationExchangeCapacity.toFixed(0)} meq/100g`} color="#78716c" />
              <PropCard icon={Sprout} label={copyFor(language, 'OM holding', 'احتفاظ المادة العضوية')} value={soilCopy(language, props.organicMatterHolding, PROPERTY_AR)} sub={soilCopy(language, props.workability, PROPERTY_AR).split('—')[0].trim()} color="#16a34a" />
            </div>

            {/* Management flags */}
            <div className="space-y-1">
              <div><p className="text-sm font-semibold">{copyFor(language, 'Management cues', 'مؤشرات الإدارة')}</p><p className="text-xs text-muted-foreground">{copyFor(language, 'Use these estimates to guide field checks and irrigation planning.', 'استخدم هذه التقديرات لتوجيه فحوصات الحقل وتخطيط الري.')}</p></div>
              <div className="rounded-lg border bg-background/70 p-2.5 text-xs leading-relaxed"><span className="text-muted-foreground">💧 {copyFor(language, 'Irrigation:', 'الري:')}</span> {soilCopy(language, props.irrigationSuitability, PROPERTY_AR)}</div>
              <div className="rounded-lg border bg-background/70 p-2.5 text-xs leading-relaxed"><span className="text-muted-foreground">⛏️ {copyFor(language, 'Erosion:', 'التعرية:')}</span> {soilCopy(language, props.erosionRisk, PROPERTY_AR)}</div>
              <div className="rounded-lg border bg-background/70 p-2.5 text-xs leading-relaxed"><span className="text-muted-foreground">🚜 {copyFor(language, 'Compaction:', 'الانضغاط:')}</span> {soilCopy(language, props.compactionRisk, PROPERTY_AR)}</div>
              <div className="rounded-lg border bg-background/70 p-2.5 text-xs leading-relaxed"><span className="text-muted-foreground">🔨 {copyFor(language, 'Workability:', 'قابلية التشغيل:')}</span> {soilCopy(language, props.workability, PROPERTY_AR)}</div>
            </div>

            {/* Recommendations */}
            {props.recommendations.length > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-2 dark:border-emerald-900 dark:bg-emerald-950/10">
                <div className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase">{copyFor(language, 'Recommendations', 'التوصيات')}</div>
                {props.recommendations.map((r, i) => (
                  <div key={i} className="text-[10px] text-foreground/80 flex items-start gap-1">
                    <span className="text-emerald-600 mt-0.5">✓</span> {soilCopy(language, r, RECOMMENDATION_AR)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
          💡 {copyFor(language, 'Based on ggsoiltexture R package (Acevedo et al. 2025, SoftwareX). Soil properties estimated via Saxton-Rawls pedotransfer functions + USDA-NRCS interpretation guidelines. Click on the triangle to set texture (coming soon).', 'مبني على حزمة ggsoiltexture بلغة R (Acevedo وآخرون 2025، SoftwareX). قُدّرت خصائص التربة باستخدام دوال النقل Saxton-Rawls وإرشادات تفسير USDA-NRCS. انقر على المثلث لتحديد القوام (قريباً).')}
        </div>
      </CardContent>
    </Card>
  );
}

function PropCard({ icon: Icon, label, value, sub, color }: { icon: typeof Droplets; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-xl border bg-background/70 p-3 shadow-sm">
      <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-2.5 w-2.5" style={{ color }} /> {label}
      </div>
      <div className="font-mono text-sm font-semibold leading-tight">{value}</div>
      {sub && <div className="text-[9px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
