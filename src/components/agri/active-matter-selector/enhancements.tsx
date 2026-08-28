'use client';

/**
 * Active Matter Selector Enhancements — 10 features that upgrade the
 * existing tool from a static catalog lookup to a season-long
 * decision and management platform.
 *
 * Features:
 *   1. Real-time weather spray window (72h timeline)
 *   2. Resistance rotation planner (group tracking)
 *   3. Side-by-side product comparison
 *   4. Cost-per-hectare DZD calculator
 *   5. Bee & pollinator safety traffic light
 *   6. AI natural language problem description
 *   7. Treatment history timeline with DAR countdown
 *   8. Tank mix compatibility checker
 *   9. QR code treatment sharing
 *  10. Season-long preventive treatment calendar
 *
 * Each feature is a self-contained component that can be embedded
 * inside the ActiveMatterSelector's tab panels.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Droplets, Wind, Thermometer, CloudRain, Sun, Clock, CheckCircle2,
  AlertTriangle, Loader2, Calendar, Bug, Leaf, Shield, RotateCcw,
  DollarSign, QrCode, Copy, Check, ChevronRight, Sparkles, FlaskConical,
  X, Plus, Minus, Trash2, Printer, Share2, Activity,
} from 'lucide-react';
import { getForecast, wmoDescription, type ForecastResult } from '@/lib/open-meteo';
import {
  ALGERIAN_ACTIVE_MATTERS, ACTIVE_MATTER_BY_ID, PLANT_PROBLEMS, PROBLEM_BY_ID,
  CROP_BY_ID, problemTypeEmoji, problemTypeLabel,
  type ActiveMatter, type PlantProblem,
} from '@/lib/algeria-phyto-data';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY_TREATMENTS = 'phyto_treatments_v1';
const STORAGE_KEY_PRICES = 'phyto_prices_v1';
const STORAGE_KEY_MIX = 'phyto_tank_mix_v1';

interface SavedTreatment {
  problemId: string;
  problemName: string;
  matterId: string;
  matterName: string;
  date: string;
  dar: number;
  harvestDate: string;
  crop?: string;
  resistanceGroup?: string;
}

function loadTreatments(): SavedTreatment[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_TREATMENTS) || '[]'); }
  catch { return []; }
}

function saveTreatment(t: SavedTreatment) {
  const list = loadTreatments();
  list.push(t);
  localStorage.setItem(STORAGE_KEY_TREATMENTS, JSON.stringify(list));
}

function loadPrices(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_PRICES) || '{}'); }
  catch { return {}; }
}

function savePrices(prices: Record<string, number>) {
  localStorage.setItem(STORAGE_KEY_PRICES, JSON.stringify(prices));
}

/** Parse application rate string to extract a numeric rate per ha.
 *  Handles patterns like "1.5 L/ha", "750 g/ha", "0.5 kg/ha". */
function parseRatePerHa(rateStr: string): number | null {
  const match = rateStr.match(/([\d.]+)\s*(L|l|kg|g)\/ha/);
  if (!match) return null;
  const val = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === 'g') return val / 1000; // convert g to kg
  return val;
}

// ---------------------------------------------------------------------------
// 1. Real-Time Weather Spray Window
// ---------------------------------------------------------------------------

interface SprayHour {
  hour: number;
  temp: number;
  humidity: number;
  wind: number;
  rain: number;
  score: 'good' | 'caution' | 'bad';
  label: string;
}

export function SprayWindowWidget({ lat, lng }: { lat: number; lng: number }) {
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getForecast(lat, lng, { days: 3 })
      .then(f => { if (alive) { setForecast(f); setError(null); } })
      .catch(e => { if (alive) setError(e?.message || 'Weather unavailable'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [lat, lng]);

  const sprayHours = useMemo<SprayHour[]>(() => {
    if (!forecast?.hourly) return [];
    const result: SprayHour[] = [];
    const now = new Date();
    const hours = forecast.hourly;
    for (let i = 0; i < Math.min(72, hours.length); i++) {
      const time = new Date(hours[i].time);
      if (time.getTime() < now.getTime()) continue;
      const temp = hours[i].temperature ?? 20;
      const humidity = hours[i].relativeHumidity ?? 60;
      const wind = hours[i].windSpeed ?? 5;
      const rain = hours[i].precipitation ?? 0;

      let score: SprayHour['score'] = 'good';
      const labels: string[] = [];
      if (wind > 15) { score = 'bad'; labels.push('Wind too strong'); }
      else if (wind > 8) { score = score === 'good' ? 'caution' : score; labels.push('Wind rising'); }
      if (rain > 2) { score = 'bad'; labels.push('Rain expected'); }
      if (temp > 32) { score = score === 'good' ? 'caution' : score; labels.push('Heat stress'); }
      if (temp < 5) { score = 'bad'; labels.push('Too cold'); }

      result.push({
        hour: time.getHours(),
        temp: Math.round(temp),
        humidity: Math.round(humidity),
        wind: Math.round(wind),
        rain: Math.round(rain * 10) / 10,
        score,
        label: labels.join(', ') || (score === 'good' ? 'Optimal' : 'Caution'),
      });
    }
    return result;
  }, [forecast]);

  const bestWindow = useMemo(() => {
    const goodHours = sprayHours.filter(h => h.score === 'good');
    if (goodHours.length === 0) return null;
    // Find the first contiguous block of good hours
    let bestStart = 0;
    let bestLen = 0;
    let curStart = -1;
    let curLen = 0;
    for (let i = 0; i < sprayHours.length; i++) {
      if (sprayHours[i].score === 'good') {
        if (curStart < 0) curStart = i;
        curLen++;
        if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; }
      } else {
        curStart = -1;
        curLen = 0;
      }
    }
    return { start: bestStart, length: bestLen };
  }, [sprayHours]);

  if (loading) return <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading spray window...</div>;
  if (error) return <div className="text-sm text-amber-600 py-2">{error}</div>;
  if (!forecast || sprayHours.length === 0) return null;

  const today = new Date();
  const scoreColor = { good: '#16a34a', caution: '#f59e0b', bad: '#dc2626' };
  const scoreBg = { good: 'bg-emerald-100 dark:bg-emerald-950/40', caution: 'bg-amber-100 dark:bg-amber-950/40', bad: 'bg-red-100 dark:bg-red-950/40' };

  return (
    <Card className="border-cyan-200 dark:border-cyan-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Wind className="h-4 w-4 text-cyan-600" /> 72-Hour Spray Window
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Best window summary */}
        {bestWindow && bestWindow.length > 0 && (
          <div className="rounded-lg p-3 mb-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Best spray window: {bestWindow.length} hours starting {new Date(today.getTime() + bestWindow.start * 3600000).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )}

        {/* Hourly timeline */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {sprayHours.slice(0, 48).map((h, i) => {
            const time = new Date(today.getTime() + i * 3600000);
            return (
              <div key={i} className="flex-shrink-0 w-12 text-center">
                <div className={cn('h-8 rounded-t-sm flex items-center justify-center text-[8px] font-bold text-white', scoreBg[h.score])} style={{ borderTop: `3px solid ${scoreColor[h.score]}` }}>
                  {h.score === 'good' ? '✓' : h.score === 'caution' ? '!' : '✗'}
                </div>
                <div className="text-[8px] text-muted-foreground mt-1">{time.getHours()}h</div>
                <div className="text-[8px] font-mono">{h.wind}km</div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-300" /> Optimal</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-300" /> Caution</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-300" /> Do not spray</span>
        </div>

        {/* Current conditions */}
        {forecast.current && (
          <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
            <div className="flex items-center gap-1"><Thermometer className="h-3 w-3 text-orange-500" /> {forecast.current.temperature.toFixed(0)}°C</div>
            <div className="flex items-center gap-1"><Droplets className="h-3 w-3 text-cyan-500" /> {forecast.current.relativeHumidity}%</div>
            <div className="flex items-center gap-1"><Wind className="h-3 w-3 text-slate-400" /> {forecast.current.windSpeed10m.toFixed(0)} km/h</div>
            <div className="flex items-center gap-1"><CloudRain className="h-3 w-3 text-blue-500" /> {forecast.daily[0]?.precipitationSum?.toFixed(1) ?? 0}mm</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 2. Resistance Management Rotation Planner
// ---------------------------------------------------------------------------

export function ResistanceRotationPlanner() {
  const [treatments, setTreatments] = useState<SavedTreatment[]>([]);

  useEffect(() => { setTreatments(loadTreatments()); }, []);

  const groupCounts = useMemo(() => {
    const counts: Record<string, { count: number; lastDate: string; products: string[] }> = {};
    for (const t of treatments) {
      const group = t.resistanceGroup || 'Unknown';
      if (!counts[group]) counts[group] = { count: 0, lastDate: t.date, products: [] };
      counts[group].count++;
      counts[group].lastDate = t.date > counts[group].lastDate ? t.date : counts[group].lastDate;
      if (!counts[group].products.includes(t.matterName)) counts[group].products.push(t.matterName);
    }
    return counts;
  }, [treatments]);

  const warnings = useMemo(() => {
    const w: { group: string; count: number; message: string }[] = [];
    for (const [group, data] of Object.entries(groupCounts)) {
      if (data.count >= 3 && group !== 'Unknown') {
        w.push({ group, count: data.count, message: `Group ${group} used ${data.count}× this season. Rotate to a different mode of action to prevent resistance.` });
      } else if (data.count >= 2 && group !== 'Unknown') {
        w.push({ group, count: data.count, message: `Group ${group} used ${data.count}×. Consider alternating with another group.` });
      }
    }
    return w.sort((a, b) => b.count - a.count);
  }, [groupCounts]);

  if (treatments.length === 0) {
    return (
      <Card className="border-violet-200 dark:border-violet-900">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm"><RotateCcw className="h-4 w-4 text-violet-600" /> Resistance Rotation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">No treatments recorded yet. Save a treatment from the decision tab to start tracking resistance groups.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-violet-200 dark:border-violet-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm"><RotateCcw className="h-4 w-4 text-violet-600" /> Resistance Rotation Planner</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((w, i) => (
              <div key={i} className={cn('rounded-lg p-3 text-xs border', w.count >= 3 ? 'border-red-300 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400' : 'border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400')}>
                <div className="flex items-center gap-2 font-semibold">
                  {w.count >= 3 ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                  {w.message}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Groups used this season</div>
          {Object.entries(groupCounts).sort(([, a], [, b]) => b.count - a.count).map(([group, data]) => (
            <div key={group} className="flex items-center gap-2 text-xs py-1.5 border-b border-border/30 last:border-0">
              <Badge variant="outline" className="text-[9px] font-mono font-bold">{group}</Badge>
              <span className="text-muted-foreground flex-1">{data.products.join(', ')}</span>
              <span className={cn('font-mono font-bold', data.count >= 3 ? 'text-red-600' : data.count >= 2 ? 'text-amber-600' : 'text-emerald-600')}>{data.count}×</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 3. Side-by-Side Product Comparison
// ---------------------------------------------------------------------------

export function ProductComparison({ results }: { results: Array<{ matter: ActiveMatter; score: number }> }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : prev.length < 3 ? [...prev, id] : prev);
  };

  const compareItems = selected.map(id => results.find(r => r.matter.id === id)).filter(Boolean) as typeof results;

  const fields: { key: keyof ActiveMatter | 'score'; label: string }[] = [
    { key: 'score', label: 'Confidence' },
    { key: 'applicationRate', label: 'Dose' },
    { key: 'preHarvestInterval', label: 'DAR (days)' },
    { key: 'safetyLevel', label: 'Safety' },
    { key: 'cost', label: 'Cost' },
    { key: 'availability', label: 'Availability' },
    { key: 'resistanceCode', label: 'Group' },
    { key: 'modeOfAction', label: 'Mode of action' },
    { key: 'formulation', label: 'Formulation' },
  ];

  if (results.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm"><Plus className="h-4 w-4 text-emerald-600" /> Compare Products (select up to 3)</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Selection chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {results.slice(0, 8).map(r => (
            <button
              key={r.matter.id}
              onClick={() => toggle(r.matter.id)}
              className={cn('text-[10px] px-2 py-1 rounded-md border transition-all', selected.includes(r.matter.id) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-background border-border hover:border-emerald-300')}
            >
              {r.matter.name}
            </button>
          ))}
        </div>

        {/* Comparison table */}
        {compareItems.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 text-muted-foreground font-medium">Criterion</th>
                  {compareItems.map(r => (
                    <th key={r.matter.id} className="text-left p-2 font-semibold min-w-[120px]">
                      <div>{r.matter.name}</div>
                      <Badge variant="outline" className="text-[8px] mt-0.5">{r.matter.type}</Badge>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.map(field => (
                  <tr key={field.key} className="border-b last:border-0">
                    <td className="p-2 text-muted-foreground font-medium">{field.label}</td>
                    {compareItems.map(r => {
                      const val = field.key === 'score' ? `${Math.round(r.score * 100)}%` : (r.matter[field.key as keyof ActiveMatter] ?? '—');
                      return <td key={r.matter.id} className="p-2">{String(val)}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 4. Cost-per-Hectare DZD Calculator
// ---------------------------------------------------------------------------

export function CostCalculator({ results }: { results: Array<{ matter: ActiveMatter; score: number }> }) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [area, setArea] = useState('1');

  useEffect(() => { setPrices(loadPrices()); }, []);

  const updatePrice = (id: string, price: number) => {
    const next = { ...prices, [id]: price };
    setPrices(next);
    savePrices(next);
  };

  const areaHa = parseFloat(area) || 1;

  return (
    <Card className="border-amber-200 dark:border-amber-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm"><DollarSign className="h-4 w-4 text-amber-600" /> Cost per Hectare (DZD)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs whitespace-nowrap">Field area</Label>
          <Input type="number" value={area} onChange={e => setArea(e.target.value)} className="h-8 w-24 text-xs" step="0.5" />
          <span className="text-xs text-muted-foreground">ha</span>
        </div>

        <div className="space-y-2">
          {results.slice(0, 5).map(r => {
            const rate = parseRatePerHa(r.matter.applicationRate);
            const price = prices[r.matter.id] || 0;
            const costPerHa = rate && price ? rate * price : null;
            const totalCost = costPerHa ? costPerHa * areaHa : null;

            return (
              <div key={r.matter.id} className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{r.matter.name}</div>
                  <div className="text-[9px] text-muted-foreground">{r.matter.applicationRate}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    placeholder="DZD/L"
                    value={price || ''}
                    onChange={e => updatePrice(r.matter.id, parseFloat(e.target.value) || 0)}
                    className="h-7 w-20 text-[10px] text-right"
                  />
                </div>
                <div className="w-24 text-right">
                  {costPerHa ? (
                    <div>
                      <div className="text-xs font-bold text-amber-600">{Math.round(costPerHa).toLocaleString()} DZD/ha</div>
                      {totalCost && areaHa > 1 && <div className="text-[9px] text-muted-foreground">{Math.round(totalCost).toLocaleString()} total</div>}
                    </div>
                  ) : <span className="text-[10px] text-muted-foreground">Enter price</span>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 5. Bee & Pollinator Safety Traffic Light
// ---------------------------------------------------------------------------

/** Heuristic bee toxicity classification based on active substance. */
function getBeeToxicity(matter: ActiveMatter): 'low' | 'medium' | 'high' {
  const sub = matter.activeSubstance.toLowerCase();
  // High toxicity
  if (/deltamethrine|lambda-cyhalothrine|cypermethrine|permethrine|imidaclopride|thiamethoxame|clothianidine|dinotefurane|abamectine|fipronil|chlorpyrifos/.test(sub)) return 'high';
  // Medium toxicity
  if (/dimethoate|methomyl|acephate|spinosad|emamectine/.test(sub)) return 'medium';
  return 'low';
}

const BEE_META = {
  low: { emoji: '🟢', label: 'Low bee toxicity', cls: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
  medium: { emoji: '🟡', label: 'Moderate — spray after sunset', cls: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20' },
  high: { emoji: '🔴', label: 'High — do not spray during flowering', cls: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/20' },
};

export function BeeSafetyBadge({ matter }: { matter: ActiveMatter }) {
  const toxicity = getBeeToxicity(matter);
  const meta = BEE_META[toxicity];
  return (
    <span className={cn('inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded', meta.bg, meta.cls)} title={meta.label}>
      {meta.emoji}
    </span>
  );
}

export function BeeSafetyCard({ results }: { results: Array<{ matter: ActiveMatter; score: number }> }) {
  const beeWarnings = results.filter(r => getBeeToxicity(r.matter) !== 'low').slice(0, 3);

  if (beeWarnings.length === 0) return null;

  return (
    <Card className="border-amber-200 dark:border-amber-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">🐝 Pollinator Safety</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {beeWarnings.map(r => {
            const toxicity = getBeeToxicity(r.matter);
            const meta = BEE_META[toxicity];
            return (
              <div key={r.matter.id} className={cn('rounded-lg p-2 text-xs', meta.bg)}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.matter.name}</span>
                  <BeeSafetyBadge matter={r.matter} />
                </div>
                <p className={cn('text-[10px] mt-0.5', meta.cls)}>{meta.label}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 6. AI Natural Language Problem Description
// ---------------------------------------------------------------------------

export function AiProblemDescription({ onMatch, crop }: { onMatch: (problemId: string, cropId: string) => void; crop?: string }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<Array<{ problem: PlantProblem; confidence: number; reasoning: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    setMatches([]);
    try {
      const systemPrompt = `You are an agricultural diagnostic assistant specialized in Algerian crops. Given a farmer's description of a plant problem, match it to the most likely problems from this database. Return a JSON array of up to 3 matches, each with: problemId (from the list), confidence (0-1), reasoning (1 sentence in the user's language).

Available problems: ${JSON.stringify(PLANT_PROBLEMS.map(p => ({ id: p.id, name: p.name, nameAr: p.nameAr, type: p.type, symptoms: p.symptoms, crops: p.crops })))}

User's crop: ${crop || 'not specified'}
User's description: "${text}"

Return ONLY a JSON array, no markdown.`;

      const res = await fetch('/api/agronomist-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: systemPrompt }],
          agentId: 'agronomist',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const content = data.response || data.message || data.content || '[]';
      // Try to parse JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      const validated = parsed
        .filter((m: any) => PROBLEM_BY_ID[m.problemId])
        .map((m: any) => ({ problem: PROBLEM_BY_ID[m.problemId], confidence: m.confidence || 0.5, reasoning: m.reasoning || '' }))
        .slice(0, 3);
      setMatches(validated);
      if (validated.length === 0) setError('Could not match your description. Try being more specific about symptoms, location on the plant, and when they appeared.');
    } catch (e: any) {
      // Fallback: local symptom matching
      const q = text.toLowerCase();
      const local = PLANT_PROBLEMS.filter(p => {
        const hay = `${p.name} ${p.nameAr || ''} ${p.symptoms.join(' ')}`.toLowerCase();
        return p.symptoms.some(s => q.includes(s.toLowerCase().split(' ')[0])) || hay.includes(q.split(' ')[0]);
      }).slice(0, 3).map(p => ({ problem: p, confidence: 0.6, reasoning: 'Matched by symptom keywords.' }));
      setMatches(local);
      if (local.length === 0) setError('No matches found. Try describing the visible symptoms.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-emerald-200 dark:border-emerald-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm"><Sparkles className="h-4 w-4 text-emerald-600" /> Describe in Your Own Words</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="e.g., My tomato leaves have brown spots with yellow rings, starting from the bottom of the plant..."
          className="text-sm min-h-[80px]"
        />
        <Button onClick={analyze} disabled={loading || !text.trim()} className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? 'Analyzing...' : 'Find Matching Problems'}
        </Button>

        {error && <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded p-2">{error}</div>}

        {matches.length > 0 && (
          <div className="space-y-2">
            {matches.map((m, i) => (
              <button
                key={i}
                onClick={() => {
                  onMatch(m.problem.id, m.problem.crops[0] || crop || '');
                  setText('');
                  setMatches([]);
                }}
                className="w-full text-left rounded-lg border border-border bg-card p-3 hover:border-emerald-400 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{problemTypeEmoji[m.problem.type]}</span>
                  <span className="text-sm font-semibold">{m.problem.name}</span>
                  {m.problem.nameAr && <span className="text-xs text-muted-foreground" dir="rtl">{m.problem.nameAr}</span>}
                  <Badge variant="outline" className="text-[9px] ml-auto">{Math.round(m.confidence * 100)}%</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{m.reasoning}</p>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 7. Treatment History Timeline with DAR Countdown
// ---------------------------------------------------------------------------

export function TreatmentTimeline() {
  const [treatments, setTreatments] = useState<SavedTreatment[]>([]);

  useEffect(() => {
    const load = () => setTreatments(loadTreatments());
    load();
    const interval = setInterval(load, 60000); // refresh countdown every minute
    return () => clearInterval(interval);
  }, []);

  const removeTreatment = (index: number) => {
    const list = loadTreatments();
    list.splice(index, 1);
    localStorage.setItem(STORAGE_KEY_TREATMENTS, JSON.stringify(list));
    setTreatments([...list]);
  };

  if (treatments.length === 0) {
    return (
      <Card className="border-cyan-200 dark:border-cyan-900">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-cyan-600" /> Treatment History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">No treatments recorded. When you save a treatment from the decision tab, it will appear here with a harvest countdown.</p>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();

  return (
    <Card className="border-cyan-200 dark:border-cyan-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-cyan-600" /> Treatment History & DAR Countdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...treatments].reverse().map((t, i) => {
            const treatmentDate = new Date(t.date + 'T00:00:00');
            const harvestDate = new Date(t.harvestDate + 'T00:00:00');
            const daysUntilHarvest = Math.ceil((harvestDate.getTime() - now.getTime()) / 86400000);
            const isSafe = daysUntilHarvest <= 0;
            const daysSinceTreatment = Math.floor((now.getTime() - treatmentDate.getTime()) / 86400000);

            return (
              <div key={i} className="relative rounded-lg border border-border bg-card p-3 pl-4">
                {/* Timeline dot */}
                <div className={cn('absolute left-0 top-3 w-2 h-2 rounded-full', isSafe ? 'bg-emerald-500' : 'bg-amber-500')} />

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">{t.matterName}</div>
                    <div className="text-[10px] text-muted-foreground">{t.problemName} · {t.crop || '—'}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Treated: {treatmentDate.toLocaleDateString()} · DAR: {t.dar} days
                    </div>
                  </div>
                  <button onClick={() => removeTreatment(treatments.length - 1 - i)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* DAR countdown */}
                <div className={cn('mt-2 rounded-md p-2 text-xs', isSafe ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400')}>
                  {isSafe ? (
                    <span className="flex items-center gap-1.5 font-semibold"><CheckCircle2 className="h-3.5 w-3.5" /> Harvest safe since {harvestDate.toLocaleDateString()}</span>
                  ) : (
                    <span className="flex items-center gap-1.5 font-semibold"><Clock className="h-3.5 w-3.5" /> Harvest safe in {daysUntilHarvest} day(s) ({harvestDate.toLocaleDateString()})</span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', isSafe ? 'bg-emerald-500' : 'bg-amber-500')}
                    style={{ width: `${Math.min(100, (daysSinceTreatment / t.dar) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 8. Tank Mix Compatibility Checker
// ---------------------------------------------------------------------------

/** Known incompatible pairs based on chemistry rules. */
const INCOMPATIBLE_PAIRS: Record<string, string[]> = {
  'cuivre': ['abamectine', 'fosetyl-aluminium', 'dimethoate'],
  'soufre': ['huile', 'abamectine', 'neem'],
  'mancozebe': ['huile'],
  'dimethoate': ['cuivre', 'soufre', 'alcalin'],
  'abamectine': ['cuivre', 'soufre', 'huile'],
};

function checkCompatibility(id1: string, id2: string): { compatible: boolean; reason: string } {
  const m1 = ACTIVE_MATTER_BY_ID[id1];
  const m2 = ACTIVE_MATTER_BY_ID[id2];
  if (!m1 || !m2) return { compatible: true, reason: '' };

  const sub1 = m1.activeSubstance.toLowerCase();
  const sub2 = m2.activeSubstance.toLowerCase();

  for (const [key, incompatible] of Object.entries(INCOMPATIBLE_PAIRS)) {
    if (sub1.includes(key) && incompatible.some(i => sub2.includes(i))) {
      return { compatible: false, reason: `${m1.activeSubstance} + ${m2.activeSubstance}: incompatible (${key} reacts)` };
    }
    if (sub2.includes(key) && incompatible.some(i => sub1.includes(i))) {
      return { compatible: false, reason: `${m1.activeSubstance} + ${m2.activeSubstance}: incompatible (${key} reacts)` };
    }
  }

  return { compatible: true, reason: 'No known incompatibility' };
}

export function TankMixChecker({ results }: { results: Array<{ matter: ActiveMatter; score: number }> }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const pairs = useMemo(() => {
    if (selected.length < 2) return [];
    const result: Array<{ id1: string; id2: string; name1: string; name2: string; compatible: boolean; reason: string }> = [];
    for (let i = 0; i < selected.length; i++) {
      for (let j = i + 1; j < selected.length; j++) {
        const check = checkCompatibility(selected[i], selected[j]);
        result.push({
          id1: selected[i],
          id2: selected[j],
          name1: ACTIVE_MATTER_BY_ID[selected[i]]?.name || selected[i],
          name2: ACTIVE_MATTER_BY_ID[selected[j]]?.name || selected[j],
          compatible: check.compatible,
          reason: check.reason,
        });
      }
    }
    return result;
  }, [selected]);

  return (
    <Card className="border-indigo-200 dark:border-indigo-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm"><FlaskConical className="h-4 w-4 text-indigo-600" /> Tank Mix Compatibility</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {results.slice(0, 6).map(r => (
            <button
              key={r.matter.id}
              onClick={() => toggle(r.matter.id)}
              className={cn('text-[10px] px-2 py-1 rounded-md border transition-all', selected.includes(r.matter.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-background border-border hover:border-indigo-300')}
            >
              {r.matter.name}
            </button>
          ))}
        </div>

        {pairs.length > 0 && (
          <div className="space-y-1.5">
            {pairs.map((p, i) => (
              <div key={i} className={cn('rounded-md p-2 text-xs border flex items-center gap-2', p.compatible ? 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10' : 'border-red-200 bg-red-50/50 dark:bg-red-950/10')}>
                {p.compatible ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <AlertTriangle className="h-3.5 w-3.5 text-red-600" />}
                <span className="font-medium">{p.name1} + {p.name2}</span>
                <span className={cn('text-[10px]', p.compatible ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400')}>{p.reason}</span>
              </div>
            ))}
          </div>
        )}

        {selected.length < 2 && <p className="text-xs text-muted-foreground">Select at least 2 products to check compatibility.</p>}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 9. QR Code Treatment Sharing
// ---------------------------------------------------------------------------

export function QrShareButton({ treatment }: { treatment: { crop: string; problem: string; productName: string; dose: string; dar: string; date: string } }) {
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareText = `🌾 Treatment Plan
Crop: ${treatment.crop}
Problem: ${treatment.problem}
Product: ${treatment.productName}
Dose: ${treatment.dose}
DAR: ${treatment.dar} days
Date: ${treatment.date}
— Formula Atlas`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(shareText); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };

  // Generate a QR code using a free API (no library needed)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareText)}`;

  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => setShowQr(!showQr)} className="gap-1.5 text-xs h-8">
        <QrCode className="h-3.5 w-3.5" /> {showQr ? 'Hide' : 'Share'} QR
      </Button>
      {showQr && (
        <div className="mt-2 rounded-lg border border-border bg-card p-3 flex flex-col items-center gap-2">
          <img src={qrUrl} alt="Treatment QR code" className="w-32 h-32" />
          <Button variant="ghost" size="sm" onClick={copy} className="gap-1 text-[10px] h-6">
            {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied!' : 'Copy text'}
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 10. Season-Long Preventive Treatment Calendar
// ---------------------------------------------------------------------------

export function PreventiveCalendar({ cropId }: { cropId: string }) {
  const crop = CROP_BY_ID[cropId];
  const problems = useMemo(() => PLANT_PROBLEMS.filter(p => p.crops.includes(cropId)), [cropId]);

  // Generate a simple week-by-week calendar based on problem types
  const calendar = useMemo(() => {
    if (!crop || problems.length === 0) return [];
    const weeks: Array<{ week: number; label: string; risks: Array<{ problem: PlantProblem; preventiveMatters: ActiveMatter[] }> }> = [];
    for (let w = 1; w <= 26; w++) {
      const risks: Array<{ problem: PlantProblem; preventiveMatters: ActiveMatter[] }> = [];
      for (const p of problems) {
        // Simple heuristic: diseases appear in mid-season, pests early + late
        const isRisk = p.type === 'disease' ? (w >= 6 && w <= 20) : (w <= 4 || w >= 18);
        if (isRisk) {
          const matters = p.actives
            .map(id => ACTIVE_MATTER_BY_ID[id])
            .filter((m): m is ActiveMatter => !!m && m.safetyLevel === 'low')
            .slice(0, 2);
          if (matters.length > 0) risks.push({ problem: p, preventiveMatters: matters });
        }
      }
      if (risks.length > 0) weeks.push({ week: w, label: `Week ${w}`, risks });
    }
    return weeks;
  }, [crop, problems]);

  if (!crop || calendar.length === 0) {
    return (
      <Card className="border-emerald-200 dark:border-emerald-900">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-emerald-600" /> Preventive Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Select a crop to generate a preventive treatment calendar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-emerald-200 dark:border-emerald-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-emerald-600" /> Preventive Calendar — {crop.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {calendar.map(week => (
            <div key={week.week} className="rounded-lg border border-border bg-card p-2">
              <div className="text-xs font-semibold text-muted-foreground mb-1">{week.label}</div>
              {week.risks.map((risk, i) => (
                <div key={i} className="flex items-center gap-2 py-1 text-xs">
                  <span>{problemTypeEmoji[risk.problem.type]}</span>
                  <span className="font-medium flex-1 truncate">{risk.problem.name}</span>
                  <div className="flex gap-1">
                    {risk.preventiveMatters.map(m => (
                      <Badge key={m.id} variant="outline" className="text-[8px]">{m.name}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">⚠️ Preventive calendar is a planning aid based on typical risk windows. Always confirm with field scouting and local advisories before spraying.</p>
      </CardContent>
    </Card>
  );
}
