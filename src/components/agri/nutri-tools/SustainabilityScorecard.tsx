'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Leaf, Download, AlertTriangle } from 'lucide-react';

type Traffic = 'red' | 'yellow' | 'green';

const TRAFFIC_COLORS: Record<Traffic, { bg: string; border: string; text: string; label: string }> = {
  red:    { bg: '#fee2e2', border: '#dc2626', text: '#991b1b', label: 'Red' },
  yellow: { bg: '#fef3c7', border: '#d97706', text: '#92400e', label: 'Yellow' },
  green:  { bg: '#dcfce7', border: '#16a34a', text: '#15803d', label: 'Green' },
};

interface MetricResult { score: number; traffic: Traffic; note: string; }

function nueScore(v: number): MetricResult {
  if (v < 40) return { score: 30, traffic: 'red', note: 'Low NUE — N losses likely. Improve 4R: right source, rate, time, placement.' };
  if (v < 60) return { score: 55, traffic: 'yellow', note: 'Average NUE — split applications and use cover crops to capture residual N.' };
  if (v <= 90) return { score: 90, traffic: 'green', note: 'Excellent NUE — maintain balance to protect soil N and profitability.' };
  return { score: 60, traffic: 'yellow', note: 'Very high NUE may indicate soil N mining — monitor soil organic N over time.' };
}
function waterScore(v: number): MetricResult {
  if (v < 0.8) return { score: 30, traffic: 'red', note: 'Low water productivity — reduce losses via mulching, drip, and ET-based scheduling.' };
  if (v <= 1.2) return { score: 60, traffic: 'yellow', note: 'Moderate — tune irrigation timing and explore regulated deficit strategies.' };
  return { score: 90, traffic: 'green', note: 'High water productivity — exemplary; maintain current practices.' };
}
function carbonScore(v: number): MetricResult {
  if (v < 0.5) return { score: 90, traffic: 'green', note: 'Low carbon footprint — efficient production system.' };
  if (v <= 2) return { score: 60, traffic: 'yellow', note: 'Moderate footprint — reduce N fertiliser rate and fuel use; add cover crops.' };
  return { score: 30, traffic: 'red', note: 'High footprint — review N source, tillage intensity, and energy use.' };
}
function soilScore(v: number): MetricResult {
  if (v < 40) return { score: 30, traffic: 'red', note: 'Degraded soil — add organic amendments, cover crops, and reduce tillage.' };
  if (v <= 60) return { score: 60, traffic: 'yellow', note: 'Improvable — diversify rotation and build organic matter.' };
  return { score: 90, traffic: 'green', note: 'Healthy soil — sustain with regenerative practices.' };
}
function pesticideScore(v: number): MetricResult {
  if (v < 20) return { score: 90, traffic: 'green', note: 'Low pesticide risk — strong IPM program in place.' };
  if (v <= 50) return { score: 60, traffic: 'yellow', note: 'Moderate risk — adopt scouting, thresholds, and biocontrol.' };
  return { score: 30, traffic: 'red', note: 'High pesticide risk — overhaul IPM and reduce reliance on high-risk actives.' };
}

function grade(score: number): { grade: string; color: string } {
  if (score > 80) return { grade: 'A', color: '#16a34a' };
  if (score > 60) return { grade: 'B', color: '#65a30d' };
  if (score > 40) return { grade: 'C', color: '#d97706' };
  return { grade: 'D', color: '#dc2626' };
}

export function SustainabilityScorecard() {
  const [nue, setNue] = useState('65');
  const [wp, setWp] = useState('1.5');
  const [carbon, setCarbon] = useState('1.2');
  const [soil, setSoil] = useState('70');
  const [pest, setPest] = useState('25');

  const metrics = useMemo(() => {
    const n = parseFloat(nue) || 0, w = parseFloat(wp) || 0, c = parseFloat(carbon) || 0;
    const s = parseFloat(soil) || 0, p = parseFloat(pest) || 0;
    return [
      { key: 'NUE', label: 'Nitrogen Use Efficiency', value: n, unit: '%',          ...nueScore(n) },
      { key: 'WP',  label: 'Water Productivity',     value: w, unit: 'kg/m³',       ...waterScore(w) },
      { key: 'CF',  label: 'Carbon Footprint',       value: c, unit: 'kg CO₂e/kg',  ...carbonScore(c) },
      { key: 'SH',  label: 'Soil Health Score',      value: s, unit: '/100',        ...soilScore(s) },
      { key: 'PR',  label: 'Pesticide Risk Index',   value: p, unit: '/100',        ...pesticideScore(p) },
    ];
  }, [nue, wp, carbon, soil, pest]);

  const overall = Math.round(metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length);
  const g = grade(overall);

  const downloadPdf = () => {
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;
    const rows = metrics.map(m => `
      <tr>
        <td>${m.label}</td>
        <td>${m.value} ${m.unit}</td>
        <td style="color:${TRAFFIC_COLORS[m.traffic].text};font-weight:bold">${m.score}</td>
        <td>${TRAFFIC_COLORS[m.traffic].label}</td>
        <td>${m.note}</td>
      </tr>`).join('');
    w.document.write(`<!doctype html><html><head><title>Sustainability Scorecard</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:32px;max-width:760px;margin:auto;color:#1f2937}
        h1{color:#15803d;margin-bottom:4px}table{width:100%;border-collapse:collapse;margin-top:16px}
        th,td{border:1px solid #e5e7eb;padding:8px;text-align:left;font-size:13px}
        th{background:#f0fdf4;color:#15803d}.score{font-size:48px;font-weight:800;color:${g.color}}
      </style></head><body>
      <h1>🌱 Farm Sustainability Scorecard</h1>
      <p style="margin-top:0;color:#6b7280">Generated ${new Date().toLocaleString()}</p>
      <div>Overall score: <span class="score">${overall}</span> &nbsp; Grade: <b style="color:${g.color}">${g.grade}</b></div>
      <table><thead><tr><th>Metric</th><th>Value</th><th>Score</th><th>Traffic</th><th>Recommendation</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p style="margin-top:24px;font-size:11px;color:#6b7280">Generated by Formula Atlas — Farm Intelligence Suite.</p>
      </body></html>`);
    w.document.close(); w.focus();
    setTimeout(() => w.print(), 350);
  };

  const weak = metrics.filter(m => m.traffic !== 'green');

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Leaf className="h-4 w-4 text-emerald-600" />
              Sustainability Scorecard
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Five-dimension traffic-light assessment. Enter your values to get an overall grade.
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={downloadPdf} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Download PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <In label="NUE (%)" v={nue} set={setNue} />
          <In label="Water (kg/m³)" v={wp} set={setWp} />
          <In label="Carbon (kg CO₂e/kg)" v={carbon} set={setCarbon} />
          <In label="Soil Health (0-100)" v={soil} set={setSoil} />
          <In label="Pesticide Risk (0-100)" v={pest} set={setPest} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {metrics.map(m => {
            const c = TRAFFIC_COLORS[m.traffic];
            return (
              <div key={m.key} className="rounded-lg p-3 border" style={{ background: c.bg, borderColor: c.border + '50' }}>
                <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: c.text }}>{m.key}</div>
                <div className="text-2xl font-bold mt-0.5" style={{ color: c.text }}>{m.score}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{m.label}</div>
                <div className="text-[10px] mt-1 font-mono">{m.value} {m.unit}</div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border p-4 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950/30 dark:to-green-950/30">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Overall sustainability score</div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold" style={{ color: g.color }}>{overall}</div>
              <div className="text-sm font-semibold" style={{ color: g.color }}>Grade {g.grade}</div>
            </div>
          </div>
          <div className="flex gap-2">
            {(['red', 'yellow', 'green'] as Traffic[]).map(t => {
              const count = metrics.filter(m => m.traffic === t).length;
              return (
                <div key={t} className="text-center">
                  <div className="w-6 h-6 rounded-full mx-auto" style={{ background: TRAFFIC_COLORS[t].border }} />
                  <div className="text-[10px] mt-1 text-muted-foreground">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {weak.length > 0 && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-3">
            <div className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1 mb-2">
              <AlertTriangle className="h-3 w-3" /> Recommendations ({weak.length})
            </div>
            <ul className="space-y-1.5">
              {weak.map(m => (
                <li key={m.key} className="text-xs flex items-start gap-2">
                  <Badge variant="outline" className="text-[10px] flex-shrink-0" style={{ color: TRAFFIC_COLORS[m.traffic].text, borderColor: TRAFFIC_COLORS[m.traffic].border }}>{m.key}</Badge>
                  <span className="text-muted-foreground">{m.note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function In({ label, v, set }: { label: string; v: string; set: (s: string) => void }) {
  return (
    <div>
      <Label className="text-[10px]">{label}</Label>
      <Input type="number" value={v} onChange={e => set(e.target.value)} className="h-9 mt-1 text-xs" />
    </div>
  );
}
