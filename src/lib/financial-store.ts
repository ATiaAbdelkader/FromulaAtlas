/**
 * Farm financial dashboard — costs, revenue, gross margin, break-even, ROI.
 * All data persisted to localStorage.
 */

const KEY = 'nutriplant_financial_dashboard_v1';

export interface FinancialEntry {
  id: string;
  category: 'seed' | 'fertilizer' | 'crop_protection' | 'irrigation' | 'fuel' | 'labor' | 'rent' | 'machinery' | 'other_cost' | 'crop_revenue' | 'subsidy' | 'other_revenue';
  label: string;
  amount: number;  // USD per ha
  fieldId?: string;
}

export interface FinancialSummary {
  totalCosts: number;
  totalRevenue: number;
  grossMargin: number;
  grossMarginPct: number;
  breakEvenYield: number;   // t/ha at current price
  breakEvenPrice: number;   // $/t at current yield
  roi: number;              // % return on costs
  costPerTonne: number;     // $/t produced
  revenuePerHa: number;
  netProfit: number;        // gross margin = same as grossMargin
}

export const CATEGORY_META: Record<FinancialEntry['category'], { label: string; type: 'cost' | 'revenue'; color: string; emoji: string }> = {
  seed:            { label: 'Seed',              type: 'cost',    color: '#f59e0b', emoji: '🌱' },
  fertilizer:      { label: 'Fertilizer',        type: 'cost',    color: '#16a34a', emoji: '🧪' },
  crop_protection: { label: 'Crop Protection',   type: 'cost',    color: '#dc2626', emoji: '🛡️' },
  irrigation:      { label: 'Irrigation',        type: 'cost',    color: '#0ea5e9', emoji: '💧' },
  fuel:            { label: 'Fuel & Energy',     type: 'cost',    color: '#7c3aed', emoji: '⛽' },
  labor:           { label: 'Labor',             type: 'cost',    color: '#0891b2', emoji: '👷' },
  rent:            { label: 'Land Rent',         type: 'cost',    color: '#8b5cf6', emoji: '🗺️' },
  machinery:       { label: 'Machinery',         type: 'cost',    color: '#64748b', emoji: '🚜' },
  other_cost:      { label: 'Other Costs',       type: 'cost',    color: '#94a3b8', emoji: '📦' },
  crop_revenue:    { label: 'Crop Sales',        type: 'revenue', color: '#16a34a', emoji: '💰' },
  subsidy:         { label: 'Subsidies',         type: 'revenue', color: '#3b82f6', emoji: '🏛️' },
  other_revenue:   { label: 'Other Revenue',     type: 'revenue', color: '#06b6d4', emoji: '➕' },
};

export function getEntries(): FinancialEntry[] {
  if (typeof window === 'undefined') return [];
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}

export function saveEntries(entries: FinancialEntry[]): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(KEY, JSON.stringify(entries)); } catch { /* ignore */ }
}

export function addEntry(entry: FinancialEntry): FinancialEntry[] {
  const entries = [...getEntries(), entry];
  saveEntries(entries);
  return entries;
}

export function removeEntry(id: string): FinancialEntry[] {
  const entries = getEntries().filter(e => e.id !== id);
  saveEntries(entries);
  return entries;
}

export function computeSummary(entries: FinancialEntry[], yieldT: number, pricePerT: number): FinancialSummary {
  const costs = entries.filter(e => CATEGORY_META[e.category].type === 'cost');
  const revenues = entries.filter(e => CATEGORY_META[e.category].type === 'revenue');

  const totalCosts = costs.reduce((s, e) => s + e.amount, 0);
  const cropRevenue = revenues.find(e => e.category === 'crop_revenue')?.amount || (yieldT * pricePerT);
  const otherRevenue = revenues.filter(e => e.category !== 'crop_revenue').reduce((s, e) => s + e.amount, 0);
  const totalRevenue = cropRevenue + otherRevenue;

  const grossMargin = totalRevenue - totalCosts;
  const grossMarginPct = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
  const roi = totalCosts > 0 ? (grossMargin / totalCosts) * 100 : 0;
  const costPerTonne = yieldT > 0 ? totalCosts / yieldT : 0;
  const breakEvenYield = pricePerT > 0 ? totalCosts / pricePerT : 0;
  const breakEvenPrice = yieldT > 0 ? totalCosts / yieldT : 0;

  return { totalCosts, totalRevenue, grossMargin, grossMarginPct, breakEvenYield, breakEvenPrice, roi, costPerTonne, revenuePerHa: totalRevenue, netProfit: grossMargin };
}

/** Scenario: what happens if a cost or price changes? */
export function scenarioImpact(entries: FinancialEntry[], yieldT: number, pricePerT: number, changes: { costDeltaPct: number; priceDeltaPct: number; yieldDeltaPct: number }): FinancialSummary {
  const adjustedEntries = entries.map(e => ({
    ...e,
    amount: CATEGORY_META[e.category].type === 'cost'
      ? e.amount * (1 + changes.costDeltaPct / 100)
      : e.amount,
  }));
  const adjYield = yieldT * (1 + changes.yieldDeltaPct / 100);
  const adjPrice = pricePerT * (1 + changes.priceDeltaPct / 100);
  return computeSummary(adjustedEntries, adjYield, adjPrice);
}

/** Default seed entries for a typical maize operation. */
export const SEED_ENTRIES: FinancialEntry[] = [
  { id: 's1', category: 'seed', label: 'Hybrid maize seed', amount: 180 },
  { id: 's2', category: 'fertilizer', label: 'Urea 200kg @ $0.77/kg', amount: 154 },
  { id: 's3', category: 'fertilizer', label: 'DAP 100kg @ $1.04/kg', amount: 104 },
  { id: 's4', category: 'fertilizer', label: 'MOP 80kg @ $0.96/kg', amount: 77 },
  { id: 's5', category: 'crop_protection', label: 'Herbicide + fungicide', amount: 95 },
  { id: 's6', category: 'irrigation', label: 'Pump electricity + maintenance', amount: 120 },
  { id: 's7', category: 'fuel', label: 'Tractor fuel', amount: 85 },
  { id: 's8', category: 'labor', label: 'Planting, weeding, harvest labor', amount: 220 },
  { id: 's9', category: 'machinery', label: 'Tractor hire + equipment depreciation', amount: 150 },
  { id: 's10', category: 'rent', label: 'Land rent', amount: 300 },
  { id: 's11', category: 'crop_revenue', label: 'Maize grain 10 t/ha @ $200/t', amount: 2000 },
  { id: 's12', category: 'subsidy', label: 'Input subsidy', amount: 50 },
];
