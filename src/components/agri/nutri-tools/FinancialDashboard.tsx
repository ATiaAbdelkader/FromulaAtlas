'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Download,
  AlertTriangle, CheckCircle2, PiggyBank, Target, Percent, Layers,
} from 'lucide-react';
import {
  getEntries, addEntry, removeEntry, computeSummary, scenarioImpact, SEED_ENTRIES,
  CATEGORY_META, type FinancialEntry, type FinancialSummary,
} from '@/lib/financial-store';

export function FinancialDashboard() {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [yieldT, setYieldT] = useState('10');
  const [pricePerT, setPricePerT] = useState('200');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({ category: 'fertilizer' as FinancialEntry['category'], label: '', amount: '' });
  const [scenario, setScenario] = useState({ costDeltaPct: 0, priceDeltaPct: 0, yieldDeltaPct: 0 });

  useEffect(() => {
    let e = getEntries();
    if (e.length === 0) { e = SEED_ENTRIES; setEntries(e); }
    else setEntries(e);
  }, []);

  const summary = useMemo(() => computeSummary(entries, parseFloat(yieldT) || 0, parseFloat(pricePerT) || 0), [entries, yieldT, pricePerT]);
  const scenarioResult = useMemo(() => scenarioImpact(entries, parseFloat(yieldT) || 0, parseFloat(pricePerT) || 0, scenario), [entries, yieldT, pricePerT, scenario]);

  const handleAdd = () => {
    if (!newEntry.label.trim() || !newEntry.amount) return;
    const entry: FinancialEntry = { id: `e-${Date.now()}`, category: newEntry.category, label: newEntry.label, amount: parseFloat(newEntry.amount) };
    setEntries(addEntry(entry));
    setNewEntry({ category: 'fertilizer', label: '', amount: '' });
    setShowAddForm(false);
  };

  const handleRemove = (id: string) => setEntries(removeEntry(id));

  const loadSeedData = () => { setEntries(SEED_ENTRIES); };
  const clearAll = () => { setEntries([]); };

  const costs = entries.filter(e => CATEGORY_META[e.category].type === 'cost');
  const revenues = entries.filter(e => CATEGORY_META[e.category].type === 'revenue');

  const exportPdf = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const costRows = costs.map((e, i) => `<tr><td>${i+1}</td><td>${CATEGORY_META[e.category].emoji} ${CATEGORY_META[e.category].label}</td><td>${e.label}</td><td style="text-align:right">$${e.amount.toFixed(2)}</td></tr>`).join('');
    const revRows = revenues.map((e, i) => `<tr><td>${i+1}</td><td>${CATEGORY_META[e.category].emoji} ${CATEGORY_META[e.category].label}</td><td>${e.label}</td><td style="text-align:right">$${e.amount.toFixed(2)}</td></tr>`).join('');
    win.document.write(`<!DOCTYPE html><html><head><title>Farm Financial Report</title><style>
      body{font-family:system-ui,sans-serif;margin:24px;color:#0f172a} h1{color:#16a34a;font-size:20px}
      .meta{color:#475569;font-size:12px;margin-bottom:16px}
      .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px}
      .stat{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:8px} .stat-label{font-size:10px;color:#16a34a;text-transform:uppercase} .stat-value{font-size:18px;font-weight:bold}
      .neg{color:#dc2626} .pos{color:#16a34a}
      table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px} th{background:#ecfdf5;color:#047857;padding:6px;border:1px solid #a7f3d0;text-align:left} td{padding:4px 6px;border:1px solid #d1fae5}
      @page{size:landscape;margin:12mm}
    </style></head><body>
      <h1>💰 Farm Financial Report</h1>
      <div class="meta">Yield: ${yieldT} t/ha · Price: $${pricePerT}/t · Generated: ${new Date().toLocaleString()}</div>
      <div class="summary">
        <div class="stat"><div class="stat-label">Total Costs</div><div class="stat-value neg">$${summary.totalCosts.toFixed(0)}</div></div>
        <div class="stat"><div class="stat-label">Total Revenue</div><div class="stat-value pos">$${summary.totalRevenue.toFixed(0)}</div></div>
        <div class="stat"><div class="stat-label">Gross Margin</div><div class="stat-value ${summary.grossMargin >= 0 ? 'pos' : 'neg'}">$${summary.grossMargin.toFixed(0)}</div></div>
        <div class="stat"><div class="stat-label">ROI</div><div class="stat-value ${summary.roi >= 0 ? 'pos' : 'neg'}">${summary.roi.toFixed(1)}%</div></div>
      </div>
      <h2>Costs ($${summary.totalCosts.toFixed(2)}/ha)</h2><table><thead><tr><th>#</th><th>Category</th><th>Description</th><th>Amount ($/ha)</th></tr></thead><tbody>${costRows}</tbody></table>
      <h2>Revenue ($${summary.totalRevenue.toFixed(2)}/ha)</h2><table><thead><tr><th>#</th><th>Category</th><th>Description</th><th>Amount ($/ha)</th></tr></thead><tbody>${revRows}</tbody></table>
      <div class="summary">
        <div class="stat"><div class="stat-label">Break-even yield</div><div class="stat-value">${summary.breakEvenYield.toFixed(2)} t/ha</div></div>
        <div class="stat"><div class="stat-label">Break-even price</div><div class="stat-value">$${summary.breakEvenPrice.toFixed(0)}/t</div></div>
        <div class="stat"><div class="stat-label">Cost per tonne</div><div class="stat-value">$${summary.costPerTonne.toFixed(0)}/t</div></div>
        <div class="stat"><div class="stat-label">Margin %</div><div class="stat-value">${summary.grossMarginPct.toFixed(1)}%</div></div>
      </div>
    </body></html>`);
    win.document.close(); setTimeout(() => win.print(), 300);
  };

  return (
    <div className="space-y-4">
      {/* Yield + price inputs */}
      <div className="grid grid-cols-3 gap-2">
        <div><Label className="text-[10px]">Yield (t/ha)</Label><Input value={yieldT} onChange={e => setYieldT(e.target.value)} type="number" className="h-8 text-xs mt-0.5" /></div>
        <div><Label className="text-[10px]">Price ($/t)</Label><Input value={pricePerT} onChange={e => setPricePerT(e.target.value)} type="number" className="h-8 text-xs mt-0.5" /></div>
        <div className="flex items-end gap-1">
          <Button size="sm" variant="outline" onClick={exportPdf} className="gap-1 text-xs h-8"><Download className="h-3 w-3" /> PDF</Button>
          <Button size="sm" variant="ghost" onClick={loadSeedData} className="text-[10px] h-8" title="Load sample data">Sample</Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard label="Total Costs" value={`$${summary.totalCosts.toFixed(0)}`} sub="/ha" icon={TrendingDown} color="#dc2626" />
        <StatCard label="Total Revenue" value={`$${summary.totalRevenue.toFixed(0)}`} sub="/ha" icon={TrendingUp} color="#16a34a" />
        <StatCard label="Gross Margin" value={`$${summary.grossMargin.toFixed(0)}`} sub={`${summary.grossMarginPct.toFixed(0)}%`} icon={PiggyBank} color={summary.grossMargin >= 0 ? '#16a34a' : '#dc2626'} />
        <StatCard label="ROI" value={`${summary.roi.toFixed(0)}%`} sub="return on costs" icon={Percent} color={summary.roi >= 0 ? '#16a34a' : '#dc2626'} />
      </div>

      {/* Break-even cards */}
      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="Break-even yield" value={`${summary.breakEvenYield.toFixed(2)} t/ha`} icon={Target} good={parseFloat(yieldT) > summary.breakEvenYield} />
        <MiniStat label="Break-even price" value={`$${summary.breakEvenPrice.toFixed(0)}/t`} icon={Target} good={parseFloat(pricePerT) > summary.breakEvenPrice} />
        <MiniStat label="Cost per tonne" value={`$${summary.costPerTonne.toFixed(0)}/t`} icon={Layers} good={summary.costPerTonne < parseFloat(pricePerT)} />
      </div>

      {/* Profitability indicator */}
      <div className={`rounded-lg p-3 border ${summary.grossMargin >= 0 ? 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900' : 'border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900'}`}>
        <div className="flex items-center gap-2">
          {summary.grossMargin >= 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />}
          <span className="text-sm font-bold">{summary.grossMargin >= 0 ? 'Profitable' : 'Operating at a loss'}</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {summary.grossMargin >= 0
              ? `Every $1 invested returns $${(1 + summary.roi / 100).toFixed(2)}`
              : `Losing $${Math.abs(summary.grossMargin).toFixed(0)}/ha — reduce costs or increase yield`}
          </span>
        </div>
      </div>

      {/* Cost breakdown chart */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Cost Breakdown</div>
        <div className="space-y-1">
          {costs.sort((a, b) => b.amount - a.amount).map(e => {
            const pct = summary.totalCosts > 0 ? (e.amount / summary.totalCosts) * 100 : 0;
            return (
              <div key={e.id} className="group flex items-center gap-2">
                <span className="text-sm">{CATEGORY_META[e.category].emoji}</span>
                <span className="text-xs flex-1 truncate">{e.label}</span>
                <div className="w-24 h-3 rounded-full bg-muted/40 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CATEGORY_META[e.category].color }} />
                </div>
                <span className="text-xs font-mono w-12 text-right">${e.amount.toFixed(0)}</span>
                <span className="text-[9px] text-muted-foreground w-8 text-right">{pct.toFixed(0)}%</span>
                <button onClick={() => handleRemove(e.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3 w-3" /></button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add entry form */}
      {showAddForm ? (
        <div className="rounded-lg border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10 p-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <select value={newEntry.category} onChange={e => setNewEntry({ ...newEntry, category: e.target.value as FinancialEntry['category'] })} className="h-8 text-xs rounded-md border border-input bg-background px-2">
              {(Object.keys(CATEGORY_META) as FinancialEntry['category'][]).map(c => <option key={c} value={c}>{CATEGORY_META[c].emoji} {CATEGORY_META[c].label}</option>)}
            </select>
            <Input value={newEntry.label} onChange={e => setNewEntry({ ...newEntry, label: e.target.value })} placeholder="Description" className="h-8 text-xs" />
            <Input value={newEntry.amount} onChange={e => setNewEntry({ ...newEntry, amount: e.target.value })} type="number" placeholder="$ amount/ha" className="h-8 text-xs" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={!newEntry.label.trim() || !newEntry.amount} className="gap-1"><Plus className="h-3 w-3" /> Add</Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)} className="gap-1.5 w-full"><Plus className="h-3.5 w-3.5" /> Add Cost or Revenue Item</Button>
      )}

      {/* Scenario analysis */}
      <div className="rounded-lg p-3 border border-violet-200 dark:border-violet-900 bg-violet-50/50 dark:bg-violet-950/20">
        <div className="text-xs font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wide mb-2 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> What-If Scenario Analysis</div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {[
            { key: 'costDeltaPct', label: 'Costs change %', icon: '📉' },
            { key: 'priceDeltaPct', label: 'Price change %', icon: '💲' },
            { key: 'yieldDeltaPct', label: 'Yield change %', icon: '🌾' },
          ].map(f => (
            <div key={f.key}>
              <Label className="text-[10px]">{f.icon} {f.label}</Label>
              <Input value={scenario[f.key as keyof typeof scenario]} onChange={e => setScenario({ ...scenario, [f.key]: parseFloat(e.target.value) || 0 })} type="number" step="5" className="h-8 text-xs mt-0.5" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="rounded p-2 bg-background/60 border border-border">
            <div className="text-[9px] text-muted-foreground">Scenario margin</div>
            <div className="font-bold" style={{ color: scenarioResult.grossMargin >= 0 ? '#16a34a' : '#dc2626' }}>${scenarioResult.grossMargin.toFixed(0)}</div>
            <div className="text-[9px]" style={{ color: scenarioResult.grossMargin > summary.grossMargin ? '#16a34a' : '#dc2626' }}>
              {scenarioResult.grossMargin > summary.grossMargin ? '▲' : '▼'} ${Math.abs(scenarioResult.grossMargin - summary.grossMargin).toFixed(0)} vs current
            </div>
          </div>
          <div className="rounded p-2 bg-background/60 border border-border">
            <div className="text-[9px] text-muted-foreground">Scenario ROI</div>
            <div className="font-bold" style={{ color: scenarioResult.roi >= 0 ? '#16a34a' : '#dc2626' }}>{scenarioResult.roi.toFixed(0)}%</div>
          </div>
          <div className="rounded p-2 bg-background/60 border border-border">
            <div className="text-[9px] text-muted-foreground">Cost/tonne</div>
            <div className="font-bold">${scenarioResult.costPerTonne.toFixed(0)}</div>
          </div>
          <div className="rounded p-2 bg-background/60 border border-border">
            <div className="text-[9px] text-muted-foreground">Break-even yield</div>
            <div className="font-bold">{scenarioResult.breakEvenYield.toFixed(2)} t/ha</div>
          </div>
        </div>
        <div className="flex gap-1 mt-2">
          <Button size="sm" variant="ghost" onClick={() => setScenario({ costDeltaPct: 20, priceDeltaPct: 0, yieldDeltaPct: 0 })} className="text-[10px] h-7">Costs +20%</Button>
          <Button size="sm" variant="ghost" onClick={() => setScenario({ costDeltaPct: 0, priceDeltaPct: -15, yieldDeltaPct: 0 })} className="text-[10px] h-7">Price -15%</Button>
          <Button size="sm" variant="ghost" onClick={() => setScenario({ costDeltaPct: 0, priceDeltaPct: 0, yieldDeltaPct: 10 })} className="text-[10px] h-7">Yield +10%</Button>
          <Button size="sm" variant="ghost" onClick={() => setScenario({ costDeltaPct: 0, priceDeltaPct: 0, yieldDeltaPct: 0 })} className="text-[10px] h-7">Reset</Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub: string; icon: typeof DollarSign; color: string }) {
  return (
    <div className="rounded-lg p-2.5 border bg-muted/20">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-muted-foreground font-semibold"><Icon className="h-2.5 w-2.5" style={{ color }} />{label}</div>
      <div className="text-lg font-bold mt-0.5" style={{ color }}>{value}</div>
      <div className="text-[9px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, good }: { label: string; value: string; icon: typeof Target; good: boolean }) {
  return (
    <div className={`rounded-lg p-2 border ${good ? 'border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/10' : 'border-amber-200 bg-amber-50/30 dark:bg-amber-950/10'}`}>
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-muted-foreground font-semibold"><Icon className="h-2.5 w-2.5" />{label}</div>
      <div className="text-sm font-bold mt-0.5" style={{ color: good ? '#16a34a' : '#ea580c' }}>{value}</div>
    </div>
  );
}
