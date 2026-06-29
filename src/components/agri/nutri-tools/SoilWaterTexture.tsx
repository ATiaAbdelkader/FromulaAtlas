'use client';

import { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { USDA_REGIONS } from '@/lib/nutri-tools-data';
import { SendToMenu } from './SendToMenu';

const SVG_W = 240, SVG_H = 220, PAD = 10;
const TRI_TOP: [number, number] = [SVG_W / 2, PAD];
const TRI_LEFT: [number, number] = [PAD, SVG_H - PAD];
const TRI_RIGHT: [number, number] = [SVG_W - PAD, SVG_H - PAD];

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
  const [, py] = fracToSvg(clay, silt, sand);
  const [px] = fracToSvg(clay, silt, sand);
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
  const [clay, setClay] = useState('20');
  const [silt, setSilt] = useState('40');
  // sand is derived
  const [cc, setCc] = useState('32');
  const [pmp, setPmp] = useState('14');
  const [depth, setDepth] = useState('30');
  const [bd, setBd] = useState('1.3');
  const [area, setArea] = useState('1');
  const [rootEff, setRootEff] = useState('80');

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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base">Soil Water & Texture</CardTitle>
            <p className="text-xs text-muted-foreground">
              USDA 12-class texture triangle (click to set) + available water calculator.
            </p>
          </div>
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
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Triangle */}
          <div className="space-y-2">
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
              <text x={TRI_TOP[0]} y={TRI_TOP[1] - 3} textAnchor="middle" fontSize="9" fill="#334155">Clay</text>
              <text x={TRI_LEFT[0] - 2} y={TRI_LEFT[1] + 12} textAnchor="start" fontSize="9" fill="#334155">Silt</text>
              <text x={TRI_RIGHT[0] + 2} y={TRI_RIGHT[1] + 12} textAnchor="end" fontSize="9" fill="#334155">Sand</text>
            </svg>
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2 text-center">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Texture class</div>
              <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{texture}</div>
            </div>
          </div>

          {/* Texture + water inputs */}
          <div className="space-y-3">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Texture fractions (%)</div>
              <div className="grid grid-cols-3 gap-2">
                <NumField label="Clay" value={clay} onChange={setClayBal} />
                <NumField label="Silt" value={silt} onChange={setSiltBal} />
                <div>
                  <Label className="text-xs">Sand</Label>
                  <Input value={sandN.toFixed(0)} readOnly className="h-9 mt-1 bg-muted/40 tabular-nums" />
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Soil water</div>
              <div className="grid grid-cols-2 gap-2">
                <NumField label="Field capacity CC (%)" value={cc} onChange={setCc} />
                <NumField label="Wilting point PMP (%)" value={pmp} onChange={setPmp} />
                <NumField label="Depth (cm)" value={depth} onChange={setDepth} />
                <NumField label="Bulk density (g/cm³)" value={bd} onChange={setBd} />
                <NumField label="Area (ha)" value={area} onChange={setArea} />
                <NumField label="Root efficiency (%)" value={rootEff} onChange={setRootEff} />
              </div>
            </div>

            {/* Water outputs */}
            <div className="grid grid-cols-2 gap-2">
              <Out label="Soil volume" value={`${soilVolumeM3.toLocaleString('en-US', { maximumFractionDigits: 0 })} m³`} />
              <Out label="Available water" value={`${awVolM3.toLocaleString('en-US', { maximumFractionDigits: 0 })} m³`} />
              <Out label="Irrig. to reach CC" value={`${awMm.toFixed(1)} mm`} />
              <Out label="Active volume" value={`${activeM3.toLocaleString('en-US', { maximumFractionDigits: 0 })} m³`} />
              <Out label="mm over crop area" value={`${mmOverCrop.toFixed(1)} mm`} className="col-span-2" />
            </div>
          </div>
        </div>

        {/* Stacked water bar */}
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
            Volumetric water content (% of soil volume)
          </div>
          <div className="flex h-6 rounded-md overflow-hidden border border-border/60">
            <div style={{ width: `${pmpN}%`, background: '#dc2626' }} title={`PMP ${pmpN}%`} />
            <div style={{ width: `${ccN - pmpN}%`, background: '#0ea5e9' }} title={`Available ${ccN - pmpN}%`} />
            <div style={{ width: `${100 - ccN}%`, background: '#e2e8f0' }} title={`Air/drain ${100 - ccN}%`} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span><span className="inline-block w-2 h-2 rounded-sm bg-red-600 align-middle mr-1" />PMP {pmpN.toFixed(0)}%</span>
            <span><span className="inline-block w-2 h-2 rounded-sm bg-sky-500 align-middle mr-1" />Available {(ccN - pmpN).toFixed(0)}%</span>
            <span><span className="inline-block w-2 h-2 rounded-sm bg-slate-200 align-middle mr-1" />Air/drain {(100 - ccN).toFixed(0)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NumField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-9 mt-1 tabular-nums"
      />
    </div>
  );
}

function Out({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-lg border border-border/60 bg-muted/20 p-2.5 ${className || ''}`}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-base font-bold tabular-nums">{value}</div>
    </div>
  );
}
