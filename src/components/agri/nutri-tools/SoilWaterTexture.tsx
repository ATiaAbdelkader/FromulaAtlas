'use client';

import { useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, RotateCcw, Mountain } from 'lucide-react';
import { USDA_REGIONS } from '@/lib/nutri-tools-data';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import { SendToMenu } from './SendToMenu';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

const SVG_W = 240, SVG_H = 220, PAD = 10;
const TRI_TOP: [number, number] = [SVG_W / 2, PAD];
const TRI_LEFT: [number, number] = [PAD, SVG_H - PAD];
const TRI_RIGHT: [number, number] = [SVG_W - PAD, SVG_H - PAD];

const TITLE: TrilingualString = {
  en: 'Soil Water & Texture',
  ar: 'مياه التربة والقوام',
  fr: 'Eau du sol & texture',
};

const DESC: TrilingualString = {
  en: 'USDA 12-class texture triangle (click to set) + available water calculator.',
  ar: 'مثلث قوام التربة الأمريكي بـ 12 صنفاً (اضغط للتعيين) + حاسبة المياه المتاحة.',
  fr: 'Triangle de texture USDA à 12 classes (clic pour définir) + calculateur d\'eau disponible.',
};

/** Convert (clay%, silt%, sand%) to SVG x,y. clay=top, silt=left, sand=right. */
function fracToSvg(clay: number, silt: number, sand: number): [number, number] {
  const a = clay / 100, b = silt / 100, c = sand / 100;
  const x = TRI_TOP[0] * a + TRI_LEFT[0] * b + TRI_RIGHT[0] * c;
  const y = TRI_TOP[1] * a + TRI_LEFT[1] * b + TRI_RIGHT[1] * c;
  return [x, y];
}

/** Point-in-polygon test (ray-casting). */
function pointInPolygon(px: number, py: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect = (yi > py) !== (yj > py) &&
      px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function classifyTexture(clay: number, silt: number, sand: number): string {
  const [px, py] = fracToSvg(clay, silt, sand);
  for (const r of USDA_REGIONS) {
    const poly: [number, number][] = r.clay.map((c, i) =>
      fracToSvg(c, r.silt[i], r.sand[i]),
    );
    if (pointInPolygon(px, py, poly)) return r.name;
  }
  // fallback: nearest centroid
  let best = 'Unknown';
  let bestD = Infinity;
  for (const r of USDA_REGIONS) {
    let cx = 0, cy = 0;
    for (let i = 0; i < r.clay.length; i++) {
      const [x, y] = fracToSvg(r.clay[i], r.silt[i], r.sand[i]);
      cx += x; cy += y;
    }
    cx /= r.clay.length; cy /= r.clay.length;
    const d = (cx - px) ** 2 + (cy - py) ** 2;
    if (d < bestD) { bestD = d; best = r.name; }
  }
  return best;
}

/**
 * Tool 15 — Soil Water & Texture (USDA triangle)
 */
export function SoilWaterTexture() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [clay, setClay] = useState('20');
  const [silt, setSilt] = useState('40');
  // sand is derived
  const [cc, setCc] = useState('32');
  const [pmp, setPmp] = useState('14');
  const [depth, setDepth] = useState('30');
  const [bd, setBd] = useState('1.3');
  const [area, setArea] = useState('1');
  const [rootEff, setRootEff] = useState('80');
  const [copied, setCopied] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);

  const clayN = Math.max(0, Math.min(100, parseFloat(clay) || 0));
  const siltN = Math.max(0, Math.min(100, parseFloat(silt) || 0));
  const sandN = Math.max(0, 100 - clayN - siltN);
  const ccN = Math.max(0, Math.min(100, parseFloat(cc) || 0));
  const pmpN = Math.max(0, Math.min(ccN, parseFloat(pmp) || 0));
  const depthN = Math.max(0, parseFloat(depth) || 0);
  const bdN = Math.max(0.1, parseFloat(bd) || 1);
  const areaN = Math.max(0, parseFloat(area) || 0);
  const rootEffN = Math.max(0, Math.min(100, parseFloat(rootEff) || 0));

  const texture = useMemo(() => classifyTexture(clayN, siltN, sandN), [clayN, siltN, sandN]);
  const [mx, my] = fracToSvg(clayN, siltN, sandN);

  // Auto-balance: if user types clay and silt, sand is implied. If they edit only one
  // of clay/silt such that sum > 100, we clamp the other down.
  const setClayBal = (v: string) => {
    const n = Math.max(0, Math.min(100, parseFloat(v) || 0));
    const siltCur = parseFloat(silt) || 0;
    if (n + siltCur > 100) setSilt(String(100 - n));
    setClay(String(n));
  };
  const setSiltBal = (v: string) => {
    const n = Math.max(0, Math.min(100, parseFloat(v) || 0));
    const clayCur = parseFloat(clay) || 0;
    if (clayCur + n > 100) setClay(String(100 - n));
    setSilt(String(n));
  };

  // Soil-water calcs
  const soilVolumeM3 = areaN * 10000 * (depthN / 100); // m³
  const awVolM3 = ((ccN - pmpN) / 100) * soilVolumeM3;
  const awMm = (ccN - pmpN) * depthN / 10; // mm to reach CC from PMP
  const activeM3 = awVolM3 * (rootEffN / 100);
  const mmOverCrop = areaN > 0 ? activeM3 / (areaN * 10) : 0;

  // Click-to-set on SVG (simpler than drag; supports pointer drag too via mousedown+move)
  const svgToFraction = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const sx = ((clientX - rect.left) / rect.width) * SVG_W;
    const sy = ((clientY - rect.top) / rect.height) * SVG_H;
    // Invert: from SVG (x, y), solve for (clay, silt, sand).
    // Using barycentric in triangle (TOP, LEFT, RIGHT):
    // x = a*TX + b*LX + c*RX, y = a*TY + b*LY + c*RY, a+b+c=1
    const denom = (TRI_LEFT[1] - TRI_RIGHT[1]) * (TRI_TOP[0] - TRI_RIGHT[0])
                + (TRI_RIGHT[0] - TRI_LEFT[0]) * (TRI_TOP[1] - TRI_RIGHT[1]);
    const a = ((TRI_LEFT[1] - TRI_RIGHT[1]) * (sx - TRI_RIGHT[0])
            + (TRI_RIGHT[0] - TRI_LEFT[0]) * (sy - TRI_RIGHT[1])) / denom;
    const b = ((TRI_RIGHT[1] - TRI_TOP[1]) * (sx - TRI_RIGHT[0])
            + (TRI_TOP[0] - TRI_RIGHT[0]) * (sy - TRI_RIGHT[1])) / denom;
    const c = 1 - a - b;
    if (a < -0.01 || b < -0.01 || c < -0.01) return null;
    return { clay: Math.round(Math.max(0, a) * 100), silt: Math.round(Math.max(0, b) * 100) };
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const f = svgToFraction(e.clientX, e.clientY);
    if (f) { setClay(String(f.clay)); setSilt(String(f.silt)); }
  };

  const reset = () => {
    setClay('20'); setSilt('40'); setCc('32'); setPmp('14');
    setDepth('30'); setBd('1.3'); setArea('1'); setRootEff('80');
    toast({ title: tr('Reset to defaults', 'تمت استعادة الافتراضي', 'Réinitialisé') });
  };

  const handleCopy = () => {
    const lines: string[] = [];
    lines.push('=== SOIL WATER & TEXTURE ===');
    lines.push(`Texture: ${texture}`);
    lines.push(`Fractions: clay ${clayN.toFixed(0)}% · silt ${siltN.toFixed(0)}% · sand ${sandN.toFixed(0)}%`);
    lines.push(`Bulk density: ${bdN} g/cm³ · depth: ${depthN} cm · area: ${areaN} ha`);
    lines.push(`Field capacity: ${ccN}% · Wilting point: ${pmpN}% · Root eff: ${rootEffN}%`);
    lines.push('');
    lines.push(`Soil volume: ${soilVolumeM3.toLocaleString('en-US', { maximumFractionDigits: 0 })} m³`);
    lines.push(`Available water: ${awVolM3.toLocaleString('en-US', { maximumFractionDigits: 0 })} m³`);
    lines.push(`Irrig to reach CC: ${awMm.toFixed(1)} mm`);
    lines.push(`Active volume: ${activeM3.toLocaleString('en-US', { maximumFractionDigits: 0 })} m³`);
    lines.push(`mm over crop area: ${mmOverCrop.toFixed(1)} mm`);
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <CalculatorShell
      icon={Mountain}
      title={TITLE}
      description={DESC}
      accent="amber"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ الملخص', fr: 'Copier le résumé' },
          onClick: handleCopy,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: reset,
        },
      ]}
    >
      <CalculatorShell.Inputs>
        {/* Triangle */}
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold flex items-center gap-2">
              <Mountain className="h-4 w-4 text-amber-600" />
              {tr('USDA Texture Triangle', 'مثلث قوام التربة الأمريكي', 'Triangle de texture USDA')}
            </span>
            {awVolM3 > 0 && (
              <SendToMenu
                sourceToolId="soil-water-texture"
                targets={[
                  {
                    toolId: 'irrigation-balance',
                    label: 'Irrigation Balance',
                    values: {
                      irrigationM3: Number(awVolM3.toFixed(1)),
                      irrigatedAreaHa: Number(areaN.toFixed(2)),
                    },
                    description: `${awVolM3.toLocaleString('en-US', { maximumFractionDigits: 0 })} m³ · ${areaN.toFixed(1)} ha`,
                  },
                ]}
              />
            )}
          </div>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full h-auto cursor-crosshair border border-border/60 rounded-lg"
            onClick={handleSvgClick}
          >
            {/* regions */}
            {USDA_REGIONS.map((r, i) => {
              const pts = r.clay.map((c, j) => {
                const [x, y] = fracToSvg(c, r.silt[j], r.sand[j]);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              }).join(' ');
              return (
                <polygon
                  key={i}
                  points={pts}
                  fill={r.color}
                  fillOpacity={0.45}
                  stroke="#475569"
                  strokeWidth="0.4"
                />
              );
            })}
            {/* triangle outline */}
            <polygon
              points={`${TRI_TOP[0]},${TRI_TOP[1]} ${TRI_LEFT[0]},${TRI_LEFT[1]} ${TRI_RIGHT[0]},${TRI_RIGHT[1]}`}
              fill="none"
              stroke="#1e293b"
              strokeWidth="1.2"
            />
            {/* marker */}
            <circle cx={mx} cy={my} r="5" fill="#dc2626" stroke="#fff" strokeWidth="1.5" />
            {/* axis labels */}
            <text x={TRI_TOP[0]} y={TRI_TOP[1] - 3} textAnchor="middle" fontSize="9" fill="#334155">{tr('Clay', 'طين', 'Argile')}</text>
            <text x={TRI_LEFT[0] - 2} y={TRI_LEFT[1] + 12} textAnchor="start" fontSize="9" fill="#334155">{tr('Silt', 'طمي', 'Limon')}</text>
            <text x={TRI_RIGHT[0] + 2} y={TRI_RIGHT[1] + 12} textAnchor="end" fontSize="9" fill="#334155">{tr('Sand', 'رمل', 'Sable')}</text>
          </svg>
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-center">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{tr('Texture class', 'صنف القوام', 'Classe de texture')}</div>
            <div className="text-lg font-bold text-amber-700 dark:text-amber-300">{texture}</div>
          </div>

          {/* Texture fractions */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{tr('Texture fractions (%)', 'نسب القوام (%)', 'Fractions de texture (%)')}</div>
            <div className="grid grid-cols-3 gap-2">
              <CalculatorShell.InputField label={tr('Clay', 'طين', 'Argile')} value={clay} onChange={setClayBal} step="1" helper="%" />
              <CalculatorShell.InputField label={tr('Silt', 'طمي', 'Limon')} value={silt} onChange={setSiltBal} step="1" helper="%" />
              <div>
                <Label className="text-xs font-bold text-foreground">{tr('Sand', 'رمل', 'Sable')}</Label>
                <Input value={sandN.toFixed(0)} readOnly className="h-9 mt-1 bg-muted/40 tabular-nums font-mono font-bold text-xs" />
                <div className="text-[10px] text-muted-foreground mt-1">{tr('derived', 'مشتق', 'dérivé')}</div>
              </div>
            </div>
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-3 h-full">
          <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-amber-50 via-transparent to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
            <span className="text-base font-bold flex items-center gap-2">
              💧 {tr('Soil Water Balance', 'ميزان مياه التربة', 'Bilan d\'eau du sol')}
            </span>
            <span className="font-mono text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 rounded-lg px-2 py-0.5">
              {awVolM3.toLocaleString('en-US', { maximumFractionDigits: 0 })} m³
            </span>
          </div>

          {/* Soil water inputs */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{tr('Soil water parameters', 'معاملات مياه التربة', 'Paramètres eau du sol')}</div>
            <div className="grid grid-cols-2 gap-2">
              <CalculatorShell.InputField label={tr('Field capacity CC (%)', 'السعة الحقلية CC (%)', 'Capacité au champ CC (%)')} value={cc} onChange={setCc} step="0.1" />
              <CalculatorShell.InputField label={tr('Wilting point PMP (%)', 'نقطة الذبول PMP (%)', 'Point de flétrissement PMP (%)')} value={pmp} onChange={setPmp} step="0.1" />
              <CalculatorShell.InputField label={tr('Depth (cm)', 'العمق (سم)', 'Profondeur (cm)')} value={depth} onChange={setDepth} step="1" />
              <CalculatorShell.InputField label={tr('Bulk density (g/cm³)', 'الكثافة الظاهرية (غ/سم³)', 'Densité apparente (g/cm³)')} value={bd} onChange={setBd} step="0.01" />
              <CalculatorShell.InputField label={tr('Area (ha)', 'المساحة (هكتار)', 'Surface (ha)')} value={area} onChange={setArea} step="0.1" />
              <CalculatorShell.InputField label={tr('Root efficiency (%)', 'كفاءة الجذور (%)', 'Efficacité racinaire (%)')} value={rootEff} onChange={setRootEff} step="1" />
            </div>
          </div>

          {/* Water outputs */}
          <div className="grid grid-cols-2 gap-2">
            <CalculatorShell.MetricTile
              label={tr('Soil volume', 'حجم التربة', 'Volume sol')}
              value={soilVolumeM3.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              unit="m³"
              color="amber"
            />
            <CalculatorShell.MetricTile
              label={tr('Available water', 'المياه المتاحة', 'Eau disponible')}
              value={awVolM3.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              unit="m³"
              color="emerald"
            />
            <CalculatorShell.MetricTile
              label={tr('Irrig. to reach CC', 'الري للوصول إلى CC', 'Irrig. pour CC')}
              value={awMm.toFixed(1)}
              unit="mm"
              color="sky"
            />
            <CalculatorShell.MetricTile
              label={tr('Active volume', 'الحجم الفعال', 'Volume actif')}
              value={activeM3.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              unit="m³"
              color="teal"
            />
            <CalculatorShell.MetricTile
              label={tr('mm over crop area', 'ملم فوق مساحة المحصول', 'mm sur culture')}
              value={mmOverCrop.toFixed(1)}
              unit="mm"
              color="rose"
              helper={tr('per irrigation cycle', 'لكل دورة ري', 'par cycle d\'irrigation')}
            />
            <CalculatorShell.MetricTile
              label={tr('AW fraction', 'نسبة المياه المتاحة', 'Fraction eau dispo.')}
              value={(ccN - pmpN).toFixed(1)}
              unit="%"
              color="default"
              helper={tr('CC − PMP', 'CC − PMP', 'CC − PMP')}
            />
          </div>

          {/* Stacked water bar */}
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
              {tr('Volumetric water content (% of soil volume)', 'محتوى المياه الحجمي (% من حجم التربة)', 'Teneur en eau volumétrique (% du volume)')}
            </div>
            <div className="flex h-6 rounded-md overflow-hidden border border-border/60">
              <div style={{ width: `${pmpN}%`, background: '#dc2626' }} title={`PMP ${pmpN}%`} />
              <div style={{ width: `${ccN - pmpN}%`, background: '#0ea5e9' }} title={`Available ${ccN - pmpN}%`} />
              <div style={{ width: `${100 - ccN}%`, background: '#e2e8f0' }} title={`Air/drain ${100 - ccN}%`} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span><span className="inline-block w-2 h-2 rounded-sm bg-red-600 align-middle mr-1" />{tr('PMP', 'PMP', 'PMP')} {pmpN.toFixed(0)}%</span>
              <span><span className="inline-block w-2 h-2 rounded-sm bg-sky-500 align-middle mr-1" />{tr('Available', 'متاح', 'Dispo')} {(ccN - pmpN).toFixed(0)}%</span>
              <span><span className="inline-block w-2 h-2 rounded-sm bg-slate-200 align-middle mr-1" />{tr('Air/drain', 'هواء/تصريف', 'Air/drains')} {(100 - ccN).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
