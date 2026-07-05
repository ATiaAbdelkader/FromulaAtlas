'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  RefreshCw, Plus, Trash2, Download, Leaf, AlertTriangle, CheckCircle2,
  TrendingUp, Sparkles, ChevronRight,
} from 'lucide-react';
import {
  ROTATION_CROPS, analyzeRotation, suggestRotation, type RotationYear, type RotationAnalysis,
} from '@/lib/rotation-data';

const COLORS: Record<string, string> = {
  cereal: '#f59e0b', legume: '#16a34a', root: '#ea580c', fruit: '#dc2626',
  leafy: '#0891b2', industrial: '#7c3aed', cover: '#0ea5e9',
};

export function CropRotationPlanner() {
  const [rotation, setRotation] = useState<RotationYear[]>([
    { year: 1, cropId: 'soybean', isCoverCrop: false },
    { year: 2, cropId: 'maize', isCoverCrop: false },
    { year: 3, cropId: 'vetch', isCoverCrop: true },
    { year: 4, cropId: 'maize', isCoverCrop: false },
    { year: 5, cropId: 'wheat', isCoverCrop: false },
  ]);

  const analysis = useMemo(() => analyzeRotation(rotation), [rotation]);

  const updateCrop = (index: number, cropId: string) => {
    const crop = ROTATION_CROPS.find(c => c.id === cropId);
    const newRot = [...rotation];
    newRot[index] = { ...newRot[index], cropId, isCoverCrop: crop?.type === 'cover' };
    setRotation(newRot);
  };

  const addYear = () => setRotation([...rotation, { year: rotation.length + 1, cropId: 'rye', isCoverCrop: true }]);
  const removeYear = (i: number) => setRotation(rotation.filter((_, idx) => idx !== i).map((ry, idx) => ({ ...ry, year: idx + 1 })));

  const autoSuggest = (primary: string) => {
    const suggested = suggestRotation(primary, rotation.length || 5);
    if (suggested.length > 0) setRotation(suggested);
  };

  const exportPdf = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const yearRows = rotation.map(ry => {
      const crop = ROTATION_CROPS.find(c => c.id === ry.cropId);
      return `<tr><td style="text-align:center">${ry.year}</td><td>${crop?.emoji} ${crop?.name}</td><td style="text-transform:capitalize">${crop?.type}</td><td style="text-align:right">${crop?.nDemand || 0}</td><td style="text-align:right">${crop?.nCreditNext || 0}</td><td style="text-align:right">${crop?.omContribution || 0}</td></tr>`;
    }).join('');
    const recs = analysis.recommendations.map(r => `<li>${r}</li>`).join('');
    const warnings = analysis.diseaseWarnings.map(w => `<li style="color:#dc2626">${w}</li>`).join('');
    win.document.write(`<!DOCTYPE html><html><head><title>Crop Rotation Plan</title><style>
      body{font-family:system-ui,sans-serif;margin:24px;color:#0f172a} h1{color:#16a34a;font-size:20px}
      .meta{color:#475569;font-size:12px;margin-bottom:16px}
      .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px}
      .stat{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:8px} .stat-label{font-size:10px;color:#16a34a;text-transform:uppercase} .stat-value{font-size:18px;font-weight:bold}
      table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px} th{background:#ecfdf5;color:#047857;padding:6px;border:1px solid #a7f3d0;text-align:left} td{padding:4px 6px;border:1px solid #d1fae5}
      ul{font-size:12px} @page{size:portrait;margin:12mm}
    </style></head><body>
      <h1>🔄 Crop Rotation Plan</h1>
      <div class="meta">${rotation.length}-year rotation · Generated: ${new Date().toLocaleString()}</div>
      <div class="summary">
        <div class="stat"><div class="stat-label">Soil Health Score</div><div class="stat-value">${analysis.soilHealthScore}/100</div></div>
        <div class="stat"><div class="stat-label">N Credit</div><div class="stat-value">${analysis.totalNCredit} kg/ha</div></div>
        <div class="stat"><div class="stat-label">N Fertilizer Saved</div><div class="stat-value">${analysis.nFertilizerSaved} kg/ha</div></div>
        <div class="stat"><div class="stat-label">OM Added</div><div class="stat-value">${analysis.totalOmAdded} t/ha</div></div>
      </div>
      <table><thead><tr><th>Year</th><th>Crop</th><th>Type</th><th>N Demand (kg/ha)</th><th>N Credit Next (kg/ha)</th><th>OM Added (t/ha)</th></tr></thead><tbody>${yearRows}</tbody></table>
      ${warnings ? `<h2>⚠️ Disease Warnings</h2><ul>${warnings}</ul>` : '<p style="color:#16a34a">✅ All disease breaks satisfied.</p>'}
      <h2>Recommendations</h2><ul>${recs}</ul>
    </body></html>`);
    win.document.close(); setTimeout(() => win.print(), 300);
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard label="Soil Health" value={`${analysis.soilHealthScore}/100`} icon={Leaf} color={analysis.soilHealthScore >= 75 ? '#16a34a' : analysis.soilHealthScore >= 50 ? '#f59e0b' : '#dc2626'} />
        <StatCard label="N Credit" value={`${analysis.totalNCredit} kg/ha`} sub="from legumes + covers" icon={TrendingUp} color="#16a34a" />
        <StatCard label="N Saved" value={`${analysis.nFertilizerSaved} kg/ha`} sub={`~$${Math.round(analysis.nFertilizerSaved * 0.8)}/ha`} icon={TrendingUp} color="#0891b2" />
        <StatCard label="OM Added" value={`${analysis.totalOmAdded} t/ha`} sub="over rotation" icon={Leaf} color="#7c3aed" />
      </div>

      {/* Auto-suggest bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Auto-suggest:</span>
        {['maize', 'wheat', 'tomato', 'potato', 'cotton'].map(c => {
          const crop = ROTATION_CROPS.find(cr => cr.id === c);
          return (
            <Button key={c} size="sm" variant="outline" onClick={() => autoSuggest(c)} className="h-7 text-[10px] gap-1">
              <Sparkles className="h-3 w-3" /> {crop?.emoji} {crop?.name}
            </Button>
          );
        })}
        <Button size="sm" variant="ghost" onClick={exportPdf} className="h-7 text-[10px] gap-1 ml-auto"><Download className="h-3 w-3" /> PDF</Button>
      </div>

      {/* Rotation timeline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rotation Timeline ({rotation.length} years)</span>
          <Button size="sm" variant="outline" onClick={addYear} className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" /> Add Year</Button>
        </div>

        {/* Timeline visualization */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {rotation.map((ry, i) => {
            const crop = ROTATION_CROPS.find(c => c.id === ry.cropId);
            if (!crop) return null;
            const color = COLORS[crop.type] || '#64748b';
            const prevCrop = i > 0 ? ROTATION_CROPS.find(c => c.id === rotation[i - 1].cropId) : null;
            const nCredit = prevCrop?.nCreditNext || 0;
            return (
              <div key={i} className="flex items-center gap-1 flex-shrink-0">
                {/* N credit arrow */}
                {nCredit > 0 && (
                  <div className="flex flex-col items-center text-[8px] text-emerald-600 dark:text-emerald-400" title={`+${nCredit} kg N/ha from ${prevCrop?.name}`}>
                    <ChevronRight className="h-3 w-3" />
                    <span className="font-mono">+{nCredit}</span>
                  </div>
                )}
                {/* Year card */}
                <div className="rounded-lg border-2 p-2 text-center min-w-[90px]" style={{ borderColor: `${color}60`, background: `${color}10` }}>
                  <div className="text-[9px] text-muted-foreground font-semibold">Year {ry.year}</div>
                  <div className="text-2xl my-0.5">{crop.emoji}</div>
                  <Select value={ry.cropId} onValueChange={v => updateCrop(i, v)}>
                    <SelectTrigger className="h-6 text-[10px] p-0 border-none bg-transparent"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROTATION_CROPS.map(c => <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Badge variant="outline" className="text-[7px] mt-0.5 capitalize" style={{ color, borderColor: `${color}60` }}>{crop.type}</Badge>
                  <div className="text-[8px] text-muted-foreground mt-0.5">N: {crop.nDemand} → +{crop.nCreditNext}</div>
                  {rotation.length > 1 && <button onClick={() => removeYear(i)} className="text-muted-foreground hover:text-destructive mt-0.5"><Trash2 className="h-2.5 w-2.5" /></button>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Composition badges */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className="text-[10px]">💰 Cash crops: {analysis.cashCropYears}</Badge>
        <Badge variant="outline" className="text-[10px] text-green-700 dark:text-green-400">🫘 Legumes: {analysis.legumeYears}</Badge>
        <Badge variant="outline" className="text-[10px] text-blue-700 dark:text-blue-400">🌱 Cover crops: {analysis.coverCropYears}</Badge>
        <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-400">🌿 OM added: {analysis.totalOmAdded} t/ha</Badge>
      </div>

      {/* Disease warnings */}
      {analysis.diseaseWarnings.length > 0 && (
        <div className="rounded-lg p-3 border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> Disease Break Warnings ({analysis.diseaseWarnings.length})
          </div>
          <ul className="text-xs space-y-1 list-disc pl-4">
            {analysis.diseaseWarnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      <div className="rounded-lg p-3 border border-border bg-muted/30">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> AI Rotation Recommendations
        </div>
        <ul className="text-xs space-y-1 list-disc pl-4">
          {analysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      </div>

      {/* Soil health gauge */}
      <div className="rounded-lg p-3 border border-border">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold">Soil Health Score</span>
          <span className="text-sm font-bold" style={{ color: analysis.soilHealthScore >= 75 ? '#16a34a' : analysis.soilHealthScore >= 50 ? '#f59e0b' : '#dc2626' }}>
            {analysis.soilHealthScore}/100
          </span>
        </div>
        <div className="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 overflow-hidden relative">
          <div className="absolute top-0 bottom-0 w-1 bg-white shadow" style={{ left: `${analysis.soilHealthScore}%` }} />
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
          <span>Poor</span><span>Moderate</span><span>Excellent</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: typeof Leaf; color: string }) {
  return (
    <div className="rounded-lg p-2.5 border bg-muted/20">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-muted-foreground font-semibold"><Icon className="h-2.5 w-2.5" style={{ color }} />{label}</div>
      <div className="text-base font-bold mt-0.5" style={{ color }}>{value}</div>
      {sub && <div className="text-[9px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
