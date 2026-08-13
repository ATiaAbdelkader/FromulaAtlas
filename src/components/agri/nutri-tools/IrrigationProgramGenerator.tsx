'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Droplets, Download, Calendar, Gauge, Waves, Layers } from 'lucide-react';
import {
  CROP_IRRIGATION_DATA,
  DECADAL_MONTHS,
  getCropIrrigation,
  type CropCategory,
} from '@/lib/irrigation-crop-data';

type SystemType = 'drip' | 'sprinkler' | 'furrow';

const SYSTEM_DEFAULT_EFFICIENCY: Record<SystemType, number> = {
  drip: 90,
  sprinkler: 75,
  furrow: 60,
};

const CATEGORY_LABELS: Record<CropCategory, string> = {
  vegetable: 'Vegetables',
  fruit: 'Fruits & Orchards',
  cereal: 'Cereals',
  industrial: 'Industrial Crops',
  forage: 'Forage',
};

const MONTH_SHORT = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const MONTH_LONG = ['April', 'May', 'June', 'July', 'August', 'September'];

export function IrrigationProgramGenerator() {
  const [cropId, setCropId] = useState('field_tomato');
  const [areaHa, setAreaHa] = useState('10');
  const [efficiency, setEfficiency] = useState('90');
  const [systemType, setSystemType] = useState<SystemType>('drip');

  const crop = getCropIrrigation(cropId) ?? CROP_IRRIGATION_DATA[0];
  const area = Math.max(0, parseFloat(areaHa) || 0);
  const eff = Math.min(100, Math.max(1, parseFloat(efficiency) || 0));
  const effFrac = eff / 100;
  const grossAnnual = effFrac > 0 ? crop.annual_irrigation_mm / effFrac : 0;
  const totalVolumeM3 = grossAnnual * area * 10; // 1 mm over 1 ha = 10 m³
  const peakDecadal = Math.max(0, ...crop.decadal_irrigation_mm);
  const peakIdx = crop.decadal_irrigation_mm.indexOf(peakDecadal);
  // Peak daily demand (m³/day) = peak decadal depth (mm/10 d) ÷ 10 (mm/day) × area (ha) × 10 (m³/mm·ha)
  const peakDaily = (peakDecadal / 10) * area * 10;

  const monthlyTotals = useMemo(() => {
    const m = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 18; i++) m[Math.floor(i / 3)] += crop.decadal_irrigation_mm[i];
    return m;
  }, [crop]);
  const maxMonthly = Math.max(...monthlyTotals, 1);

  const cropsByCat = (Object.keys(CATEGORY_LABELS) as CropCategory[]).map((cat) => ({
    cat,
    items: CROP_IRRIGATION_DATA.filter((c) => c.category === cat),
  }));

  const handleExportPdf = () => {
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;
    const rows = monthlyTotals
      .map((m, i) => `<tr><td>${MONTH_LONG[i]}</td><td>${m}</td><td>${(m / effFrac).toFixed(0)}</td><td>${((m / effFrac) * area * 10).toFixed(0)}</td></tr>`)
      .join('');
    w.document.write(`<!doctype html><html><head><title>Irrigation Program — ${crop.name_en}</title>
<style>body{font-family:system-ui;padding:24px;color:#0f172a}h1{color:#15803d;margin:0 0 4px}
table{width:100%;border-collapse:collapse;margin-top:12px}td,th{border:1px solid #cbd5e1;padding:6px 10px;font-size:12px;text-align:left}
.stat{display:inline-block;padding:10px 14px;border:1px solid #cbd5e1;border-radius:8px;margin:4px 4px 0 0;min-width:110px}
.stat .l{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.04em}
.stat .v{font-size:18px;font-weight:700;color:#15803d}</style></head><body>
<h1>Irrigation Program — ${crop.name_en}</h1>
<p style="font-size:11px;color:#64748b;margin:0 0 8px">Generated ${new Date().toLocaleString()}</p>
<div>
<div class="stat"><div class="l">Area</div><div class="v">${area} ha</div></div>
<div class="stat"><div class="l">System</div><div class="v">${systemType}</div></div>
<div class="stat"><div class="l">Efficiency</div><div class="v">${eff}%</div></div>
<div class="stat"><div class="l">Net annual</div><div class="v">${crop.annual_irrigation_mm} mm</div></div>
<div class="stat"><div class="l">Gross annual</div><div class="v">${grossAnnual.toFixed(0)} mm</div></div>
<div class="stat"><div class="l">Total volume</div><div class="v">${totalVolumeM3.toFixed(0)} m³</div></div>
<div class="stat"><div class="l">Peak daily</div><div class="v">${peakDaily.toFixed(1)} m³/d</div></div>
</div>
<h3 style="margin-top:18px;color:#15803d">Monthly schedule</h3>
<table><thead><tr><th>Month</th><th>Net (mm)</th><th>Gross (mm)</th><th>Volume (m³)</th></tr></thead><tbody>${rows}</tbody></table>
<p style="font-size:11px;color:#64748b;margin-top:12px">${crop.notes}</p>
</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const summary = [
    { icon: Droplets, label: 'Net annual', value: `${crop.annual_irrigation_mm}`, unit: 'mm', color: 'text-emerald-700 dark:text-emerald-300' },
    { icon: Waves, label: 'Gross annual', value: grossAnnual.toFixed(0), unit: 'mm', color: 'text-teal-700 dark:text-teal-300' },
    { icon: Gauge, label: 'Total volume', value: totalVolumeM3.toFixed(0), unit: 'm³', color: 'text-cyan-700 dark:text-cyan-300' },
    { icon: Layers, label: 'Peak daily', value: peakDaily.toFixed(1), unit: 'm³/day', color: 'text-sky-700 dark:text-sky-300' },
  ];

  return (
    <Card className="overflow-hidden border-emerald-100 shadow-sm dark:border-emerald-900/60">
      <CardHeader className="border-b border-border/60 bg-emerald-50/50 pb-4 dark:bg-emerald-950/10">
        <CardTitle className="flex items-center gap-2 text-base"><span className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"><Droplets className="h-4 w-4" /></span> Irrigation Program Generator</CardTitle>
        <CardDescription className="mt-1 text-xs leading-relaxed">Decadal (10-day) irrigation schedule from the BRL/COM memento, sized to your field and system.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/30 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Label className="text-xs font-medium">Crop</Label>
            <Select value={cropId} onValueChange={setCropId}>
              <SelectTrigger aria-label="Crop selection" className="mt-1 h-10 w-full text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {cropsByCat.map((g) => (
                  <div key={g.cat}>
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">{CATEGORY_LABELS[g.cat]}</div>
                    {g.items.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">{c.name_en}</SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium">Area (ha)</Label>
            <Input aria-label="Irrigated area in hectares" type="number" min="0" value={areaHa} onChange={(e) => setAreaHa(e.target.value)} className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium">System</Label>
            <Select value={systemType} onValueChange={(v) => {
              setSystemType(v as SystemType);
              setEfficiency(String(SYSTEM_DEFAULT_EFFICIENCY[v as SystemType]));
            }}>
              <SelectTrigger aria-label="Irrigation system type" className="mt-1 h-10 w-full text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="drip" className="text-xs">Drip</SelectItem>
                <SelectItem value="sprinkler" className="text-xs">Sprinkler</SelectItem>
                <SelectItem value="furrow" className="text-xs">Furrow</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <Label className="text-xs font-medium">Efficiency (%)</Label>
            <Input aria-label="Irrigation efficiency percentage" type="number" min="1" max="100" value={efficiency} onChange={(e) => setEfficiency(e.target.value)} className="mt-1 h-10 text-sm" />
          </div>
        </div>

        {/* 4 summary cards */}
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {summary.map((s) => (
            <div key={s.label} className="rounded-xl border border-emerald-200/70 bg-emerald-50/30 p-3 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <s.icon className="h-3 w-3" /> {s.label}
              </div>
              <div className={`mt-1 text-xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.unit}</div>
            </div>
          ))}
        </div>

        {/* Monthly table with visual bars */}
        <div className="rounded-xl border border-border/70 bg-muted/10 p-3">
          <div className="mb-3 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <Calendar className="h-3 w-3" /> Monthly irrigation (net, mm)
          </div>
          <div className="space-y-1.5">
            {MONTH_SHORT.map((m, i) => (
              <div key={m} className="flex items-center gap-2 text-xs">
                <div className="w-9 text-xs font-medium text-muted-foreground">{m}</div>
                <div className="h-4 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-emerald-500" style={{ width: `${(monthlyTotals[i] / maxMonthly) * 100}%` }} />
                </div>
                <div className="w-12 text-right tabular-nums font-medium">{monthlyTotals[i]} mm</div>
              </div>
            ))}
          </div>
        </div>

        {/* 10-day schedule grid */}
        <div className="rounded-xl border border-border/70 bg-muted/10 p-3">
          <div className="mb-3 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <Calendar className="h-3 w-3" /> 10-day (decadal) schedule — mm/decade
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-3 lg:grid-cols-6">
            {DECADAL_MONTHS.map((label, i) => {
              const v = crop.decadal_irrigation_mm[i];
              const isPeak = i === peakIdx && v > 0;
              return (
                <div key={label} className={`rounded-xl border p-2 text-center shadow-sm ${isPeak ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30' : 'border-border bg-card'}`}>
                  <div className="text-[9px] text-muted-foreground">{label}</div>
                  <div className={`font-bold tabular-nums ${isPeak ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{v}</div>
                  {isPeak && <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 mt-0.5 border-amber-400 text-amber-700 dark:text-amber-300">PEAK</Badge>}
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">{crop.notes}</p>
        </div>

        <Button onClick={handleExportPdf} variant="outline" size="sm" className="h-10 w-full">
          <Download className="h-4 w-4 mr-1" /> Export to PDF
        </Button>
      </CardContent>
    </Card>
  );
}
