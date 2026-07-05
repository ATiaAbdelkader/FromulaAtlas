'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  FlaskConical, Plus, Trash2, TrendingUp, TrendingDown, Minus,
  AlertTriangle, CheckCircle2, Download, MapPin, Calendar,
} from 'lucide-react';
import {
  getSoilTests, saveSoilTest, deleteSoilTest, computeTrends, getFieldNames, getLatestTest,
  type SoilTestEntry, type SoilTrend,
} from '@/lib/soil-history-store';

const TREND_COLORS: Record<SoilTrend['direction'], string> = {
  improving: '#16a34a',
  declining: '#dc2626',
  stable: '#64748b',
};
const STATUS_COLORS: Record<SoilTrend['status'], string> = {
  low: '#ea580c',
  optimal: '#16a34a',
  high: '#7c3aed',
};

export function SoilTestHistoryTracker() {
  const [entries, setEntries] = useState<SoilTestEntry[]>([]);
  const [selectedField, setSelectedField] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [newEntry, setNewEntry] = useState<Record<string, any>>({
    date: new Date().toISOString().slice(0, 10), fieldName: 'Field A',
    ph: 6.5, om: 2.5, cec: 15, ca: 8, mg: 1.2, k: 0.4, na: 0.2, p: 25,
    sand: 40, silt: 35, clay: 25, notes: '',
  });

  useEffect(() => { setEntries(getSoilTests()); }, []);

  const fieldNames = useMemo(() => getFieldNames(entries), [entries]);
  const filtered = useMemo(() => selectedField === 'all' ? entries : entries.filter(e => e.fieldName === selectedField), [entries, selectedField]);
  const trends = useMemo(() => computeTrends(filtered), [filtered]);
  const latest = useMemo(() => getLatestTest(filtered), [filtered]);

  const handleAdd = () => {
    const entry: SoilTestEntry = {
      id: `soil-${Date.now()}`,
      date: newEntry.date || new Date().toISOString().slice(0, 10),
      fieldName: newEntry.fieldName || 'Unknown',
      ph: Number(newEntry.ph) || 0, om: Number(newEntry.om) || 0, cec: Number(newEntry.cec) || 0,
      ca: Number(newEntry.ca) || 0, mg: Number(newEntry.mg) || 0, k: Number(newEntry.k) || 0,
      na: Number(newEntry.na) || 0, p: Number(newEntry.p) || 0,
      sand: Number(newEntry.sand) || 0, silt: Number(newEntry.silt) || 0, clay: Number(newEntry.clay) || 0,
      notes: newEntry.notes || '',
    };
    setEntries(saveSoilTest(entry));
    setShowForm(false);
  };

  const handleDelete = (id: string) => setEntries(deleteSoilTest(id));

  const exportPdf = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const trendRows = trends.map(t => `<tr><td>${t.label}</td><td style="text-align:right">${t.current} ${t.unit}</td><td style="text-align:right">${t.change > 0 ? '+' : ''}${t.change} (${t.changePct > 0 ? '+' : ''}${t.changePct}%)</td><td style="text-transform:capitalize">${t.direction}</td><td style="text-transform:capitalize">${t.status}</td><td>${t.recommendation}</td></tr>`).join('');
    const entryRows = filtered.map(e => `<tr><td>${e.date}</td><td>${e.fieldName}</td><td style="text-align:center">${e.ph}</td><td style="text-align:center">${e.om}%</td><td style="text-align:center">${e.cec}</td><td style="text-align:center">${e.ca}</td><td style="text-align:center">${e.mg}</td><td style="text-align:center">${e.k}</td><td style="text-align:center">${e.p}</td></tr>`).join('');
    win.document.write(`<!DOCTYPE html><html><head><title>Soil Test History Report</title><style>
      body{font-family:system-ui,sans-serif;margin:24px;color:#0f172a} h1{color:#16a34a;font-size:20px}
      .meta{color:#475569;font-size:12px;margin-bottom:16px} table{width:100%;border-collapse:collapse;font-size:10px;margin-bottom:16px}
      th{background:#ecfdf5;color:#047857;padding:6px;border:1px solid #a7f3d0;text-align:left} td{padding:4px 6px;border:1px solid #d1fae5}
      @page{size:landscape;margin:12mm}
    </style></head><body>
      <h1>📊 Soil Test History Report</h1>
      <div class="meta">Field: ${selectedField === 'all' ? 'All fields' : selectedField} · ${filtered.length} tests · Generated: ${new Date().toLocaleString()}</div>
      <h2>Parameter Trends & Recommendations</h2>
      <table><thead><tr><th>Parameter</th><th>Current</th><th>Change</th><th>Trend</th><th>Status</th><th>Recommendation</th></tr></thead><tbody>${trendRows}</tbody></table>
      <h2>Test History</h2>
      <table><thead><tr><th>Date</th><th>Field</th><th>pH</th><th>OM%</th><th>CEC</th><th>Ca</th><th>Mg</th><th>K</th><th>P</th></tr></thead><tbody>${entryRows}</tbody></table>
    </body></html>`);
    win.document.close(); setTimeout(() => win.print(), 300);
  };

  return (
    <div className="space-y-4">
      {/* Field selector + actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={selectedField} onValueChange={setSelectedField}>
          <SelectTrigger className="h-8 text-xs w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fields</SelectItem>
            {fieldNames.map(f => <SelectItem key={f} value={f}><MapPin className="h-3 w-3 inline mr-1" />{f}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} className="gap-1.5 text-xs h-8">
          <Plus className="h-3.5 w-3.5" /> Add Test
        </Button>
        <Button size="sm" variant="ghost" onClick={exportPdf} className="gap-1.5 text-xs h-8 ml-auto">
          <Download className="h-3.5 w-3.5" /> PDF
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-lg border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10 p-3 space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div><Label className="text-[10px]">Date</Label><Input type="date" value={newEntry.date} onChange={e => setNewEntry({ ...newEntry, date: e.target.value })} className="h-8 text-xs mt-0.5" /></div>
            <div><Label className="text-[10px]">Field name</Label><Input value={newEntry.fieldName} onChange={e => setNewEntry({ ...newEntry, fieldName: e.target.value })} className="h-8 text-xs mt-0.5" /></div>
            <div><Label className="text-[10px]">pH</Label><Input type="number" step="0.1" value={newEntry.ph as any} onChange={e => setNewEntry({ ...newEntry, ph: e.target.value })} className="h-8 text-xs mt-0.5" /></div>
            <div><Label className="text-[10px]">OM (%)</Label><Input type="number" step="0.1" value={newEntry.om as any} onChange={e => setNewEntry({ ...newEntry, om: e.target.value })} className="h-8 text-xs mt-0.5" /></div>
            <div><Label className="text-[10px]">CEC (meq/100g)</Label><Input type="number" step="0.1" value={newEntry.cec as any} onChange={e => setNewEntry({ ...newEntry, cec: e.target.value })} className="h-8 text-xs mt-0.5" /></div>
            <div><Label className="text-[10px]">Ca (meq/100g)</Label><Input type="number" step="0.1" value={newEntry.ca as any} onChange={e => setNewEntry({ ...newEntry, ca: e.target.value })} className="h-8 text-xs mt-0.5" /></div>
            <div><Label className="text-[10px]">Mg (meq/100g)</Label><Input type="number" step="0.1" value={newEntry.mg as any} onChange={e => setNewEntry({ ...newEntry, mg: e.target.value })} className="h-8 text-xs mt-0.5" /></div>
            <div><Label className="text-[10px]">K (meq/100g)</Label><Input type="number" step="0.1" value={newEntry.k as any} onChange={e => setNewEntry({ ...newEntry, k: e.target.value })} className="h-8 text-xs mt-0.5" /></div>
            <div><Label className="text-[10px]">Na (meq/100g)</Label><Input type="number" step="0.1" value={newEntry.na as any} onChange={e => setNewEntry({ ...newEntry, na: e.target.value })} className="h-8 text-xs mt-0.5" /></div>
            <div><Label className="text-[10px]">P (ppm)</Label><Input type="number" value={newEntry.p as any} onChange={e => setNewEntry({ ...newEntry, p: e.target.value })} className="h-8 text-xs mt-0.5" /></div>
            <div><Label className="text-[10px]">Sand (%)</Label><Input type="number" value={newEntry.sand as any} onChange={e => setNewEntry({ ...newEntry, sand: e.target.value })} className="h-8 text-xs mt-0.5" /></div>
            <div><Label className="text-[10px]">Silt (%)</Label><Input type="number" value={newEntry.silt as any} onChange={e => setNewEntry({ ...newEntry, silt: e.target.value })} className="h-8 text-xs mt-0.5" /></div>
          </div>
          <Textarea value={newEntry.notes} onChange={e => setNewEntry({ ...newEntry, notes: e.target.value })} placeholder="Notes..." className="text-xs min-h-[40px]" />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} className="gap-1"><Plus className="h-3 w-3" /> Save Test</Button>
          </div>
        </div>
      )}

      {/* Latest test summary */}
      {latest && (
        <div className="rounded-lg p-3 border border-border bg-muted/20">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-semibold">Latest Test: {latest.date} · {latest.fieldName}</span>
            <Badge variant="outline" className="text-[9px]">{filtered.length} tests on record</Badge>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
            {[
              { l: 'pH', v: latest.ph }, { l: 'OM%', v: latest.om }, { l: 'CEC', v: latest.cec },
              { l: 'Ca', v: latest.ca }, { l: 'Mg', v: latest.mg }, { l: 'K', v: latest.k },
              { l: 'Na', v: latest.na }, { l: 'P', v: latest.p },
            ].map(s => (
              <div key={s.l} className="text-center rounded p-1.5 bg-background/60 border">
                <div className="text-[8px] text-muted-foreground uppercase">{s.l}</div>
                <div className="text-sm font-bold">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend charts */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Parameter Trends</div>
        {trends.map(trend => (
          <div key={trend.param} className="rounded-lg border border-border p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">{trend.label}</span>
                <span className="text-[10px] text-muted-foreground">{trend.unit}</span>
                <Badge variant="outline" className="text-[8px]" style={{ color: STATUS_COLORS[trend.status], borderColor: STATUS_COLORS[trend.status] + '60' }}>
                  {trend.status}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="font-mono font-bold">{trend.current}</span>
                {trend.direction === 'improving' && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                {trend.direction === 'declining' && <TrendingDown className="h-3 w-3 text-red-500" />}
                {trend.direction === 'stable' && <Minus className="h-3 w-3 text-muted-foreground" />}
                <span style={{ color: TREND_COLORS[trend.direction] }}>
                  {trend.change > 0 ? '+' : ''}{trend.change} ({trend.changePct > 0 ? '+' : ''}{trend.changePct}%)
                </span>
              </div>
            </div>
            {/* Mini line chart */}
            {trend.values.length > 1 && <MiniChart trend={trend} />}
            {/* Optimal range bar */}
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground mt-1">
              <span>Optimal: {trend.optimal[0]}-{trend.optimal[1]}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden relative">
                <div className="absolute h-full bg-emerald-300/40" style={{
                  left: `${Math.max(0, Math.min(100, (trend.optimal[0] / (trend.optimal[1] * 1.5)) * 100))}%`,
                  width: `${Math.max(5, Math.min(100, ((trend.optimal[1] - trend.optimal[0]) / (trend.optimal[1] * 1.5)) * 100))}%`,
                }} />
                <div className="absolute top-0 bottom-0 w-0.5 bg-foreground" style={{
                  left: `${Math.max(0, Math.min(100, (trend.current / (trend.optimal[1] * 1.5)) * 100))}%`,
                }} />
              </div>
            </div>
            {/* Recommendation */}
            <div className="text-[10px] text-muted-foreground mt-1 flex items-start gap-1">
              {trend.status === 'optimal' ? <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="h-2.5 w-2.5 text-amber-500 flex-shrink-0 mt-0.5" />}
              {trend.recommendation}
            </div>
          </div>
        ))}
      </div>

      {/* Test history table */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Test History ({filtered.length})</div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr className="text-left text-[10px] text-muted-foreground">
                <th className="px-2 py-1.5">Date</th><th className="px-2 py-1.5">Field</th>
                <th className="px-2 py-1.5 text-center">pH</th><th className="px-2 py-1.5 text-center">OM</th>
                <th className="px-2 py-1.5 text-center">CEC</th><th className="px-2 py-1.5 text-center">Ca</th>
                <th className="px-2 py-1.5 text-center">Mg</th><th className="px-2 py-1.5 text-center">K</th>
                <th className="px-2 py-1.5 text-center">P</th><th></th>
              </tr>
            </thead>
            <tbody>
              {[...filtered].reverse().map(e => (
                <tr key={e.id} className="border-t border-border/40">
                  <td className="px-2 py-1.5 font-mono text-[10px]">{e.date}</td>
                  <td className="px-2 py-1.5">{e.fieldName}</td>
                  <td className="px-2 py-1.5 text-center font-mono">{e.ph}</td>
                  <td className="px-2 py-1.5 text-center font-mono">{e.om}%</td>
                  <td className="px-2 py-1.5 text-center font-mono">{e.cec}</td>
                  <td className="px-2 py-1.5 text-center font-mono">{e.ca}</td>
                  <td className="px-2 py-1.5 text-center font-mono">{e.mg}</td>
                  <td className="px-2 py-1.5 text-center font-mono">{e.k}</td>
                  <td className="px-2 py-1.5 text-center font-mono">{e.p}</td>
                  <td className="px-2 py-1.5"><button onClick={() => handleDelete(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** Mini SVG line chart for a soil parameter trend. */
function MiniChart({ trend }: { trend: SoilTrend }) {
  const w = 300, h = 40, pad = 4;
  const values = trend.values;
  const allVals = [...values.map(v => v.value), ...trend.optimal];
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const range = max - min || 1;

  const x = (i: number) => pad + (i / (values.length - 1)) * (w - 2 * pad);
  const y = (v: number) => h - pad - ((v - min) / range) * (h - 2 * pad);

  const points = values.map((v, i) => `${x(i)},${y(v.value)}`).join(' ');
  const color = TREND_COLORS[trend.direction];
  const optTop = y(trend.optimal[1]);
  const optBot = y(trend.optimal[0]);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10">
      {/* Optimal zone */}
      <rect x={pad} y={optTop} width={w - 2 * pad} height={Math.max(1, optBot - optTop)} fill="#16a34a20" />
      {/* Line */}
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
      {/* Points */}
      {values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v.value)} r="2.5" fill={color} />)}
      {/* Date labels */}
      {values.map((v, i) => (
        <text key={i} x={x(i)} y={h - 1} textAnchor="middle" fontSize="6" fill="#94a3b8">{v.date.slice(2, 7)}</text>
      ))}
    </svg>
  );
}
