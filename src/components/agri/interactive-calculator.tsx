'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Formula } from '@/lib/types';

interface InteractiveCalculatorProps {
  formula: Formula;
}

interface CalcField {
  key: string;
  label: string;
  unit?: string;
  defaultValue: number;
  step?: number;
}

interface CalcConfig {
  fields: CalcField[];
  compute: (vals: Record<string, number>) => { value: string; label: string; interpretation?: string };
}

// Calculator configurations for selected formulas
const calculators: Record<string, CalcConfig> = {
  // 2.1 Plant Population
  '2.1': {
    fields: [
      { key: 'area', label: 'Area', unit: 'm²', defaultValue: 10000, step: 100 },
      { key: 'rowSpacing', label: 'Row Spacing', unit: 'cm', defaultValue: 75, step: 1 },
      { key: 'plantSpacing', label: 'Plant Spacing', unit: 'cm', defaultValue: 25, step: 1 },
    ],
    compute: (v) => {
      const pp = (v.area * 10000) / (v.rowSpacing * v.plantSpacing);
      let interp = '';
      if (pp < 30000) interp = 'Low density — consider tighter spacing for full canopy closure.';
      else if (pp > 80000) interp = 'High density — ensure adequate fertility and watch for lodging.';
      else interp = 'Within optimal range for most cereal crops.';
      return { value: pp.toLocaleString(undefined, { maximumFractionDigits: 0 }), label: 'plants/ha', interpretation: interp };
    },
  },
  // 2.2 Seed Rate
  '2.2': {
    fields: [
      { key: 'targetPop', label: 'Target Population', unit: 'plants/ha', defaultValue: 350000, step: 1000 },
      { key: 'testWeight', label: 'Test Weight', unit: 'g/1000 seeds', defaultValue: 35, step: 1 },
      { key: 'germination', label: 'Germination', unit: '%', defaultValue: 90, step: 1 },
      { key: 'purity', label: 'Purity', unit: '%', defaultValue: 98, step: 1 },
    ],
    compute: (v) => {
      const sr = (v.targetPop * v.testWeight) / (1000 * 100 * (v.germination / 100) * (v.purity / 100));
      return { value: sr.toFixed(1), label: 'kg/ha', interpretation: `Order ~${(sr * 1.1).toFixed(1)} kg/ha to include 10% extra for field losses.` };
    },
  },
  // 2.3 Real Value of Seed
  '2.3': {
    fields: [
      { key: 'purity', label: 'Purity', unit: '%', defaultValue: 98, step: 1 },
      { key: 'germination', label: 'Germination', unit: '%', defaultValue: 90, step: 1 },
    ],
    compute: (v) => {
      const rvs = (v.purity * v.germination) / 100;
      let interp = '';
      if (rvs < 75) interp = 'Below acceptable seed quality threshold — consider re-sourcing.';
      else if (rvs > 90) interp = 'Excellent seed quality.';
      else interp = 'Acceptable commercial seed quality.';
      return { value: rvs.toFixed(1), label: '%', interpretation: interp };
    },
  },
  // 4.1 Fertilizer Requirement
  '4.1': {
    fields: [
      { key: 'rate', label: 'Recommended Rate (N, P, or K)', unit: 'kg/ha', defaultValue: 120, step: 5 },
      { key: 'nutrientPct', label: 'Nutrient % in product', unit: '%', defaultValue: 46, step: 1 },
    ],
    compute: (v) => {
      const qty = (100 * v.rate) / v.nutrientPct;
      return { value: qty.toFixed(1), label: 'kg product/ha', interpretation: `Apply ${qty.toFixed(1)} kg of the fertilizer product per hectare to deliver ${v.rate} kg of nutrient.` };
    },
  },
  // 6.1 Net Irrigation Requirement
  '6.1': {
    fields: [
      { key: 'etc', label: 'Crop Evapotranspiration (ETc)', unit: 'mm', defaultValue: 450, step: 10 },
      { key: 'pe', label: 'Effective Rainfall', unit: 'mm', defaultValue: 120, step: 10 },
    ],
    compute: (v) => {
      const nir = v.etc - v.pe;
      return { value: nir.toFixed(0), label: 'mm', interpretation: `Crop needs ${nir.toFixed(0)} mm of irrigation water (≈ ${(nir * 10).toFixed(0)} m³/ha).` };
    },
  },
  // 6.2 Gross Irrigation Requirement
  '6.2': {
    fields: [
      { key: 'nir', label: 'Net Irrigation Requirement', unit: 'mm', defaultValue: 330, step: 10 },
      { key: 'ea', label: 'Application Efficiency', unit: 'decimal (0-1)', defaultValue: 0.75, step: 0.05 },
    ],
    compute: (v) => {
      const gir = v.nir / v.ea;
      return { value: gir.toFixed(0), label: 'mm', interpretation: `Apply ${gir.toFixed(0)} mm at the field level to deliver ${v.nir} mm to the root zone.` };
    },
  },
  // 6.4 Water Use Efficiency
  '6.4': {
    fields: [
      { key: 'yield', label: 'Yield', unit: 'kg/ha', defaultValue: 5000, step: 100 },
      { key: 'water', label: 'Water Used', unit: 'mm (or m³/ha ÷ 10)', defaultValue: 450, step: 10 },
    ],
    compute: (v) => {
      const wue = v.yield / v.water;
      let interp = '';
      if (wue < 5) interp = 'Low WUE — investigate drought stress, evaporation losses, or low-yielding variety.';
      else if (wue > 15) interp = 'Excellent WUE — typical of well-managed drip-irrigated systems.';
      else interp = 'Moderate WUE — typical of rainfed or surface-irrigated systems.';
      return { value: wue.toFixed(2), label: 'kg/mm', interpretation: interp };
    },
  },
  // 7.1 Bulk Density
  '7.1': {
    fields: [
      { key: 'mass', label: 'Oven-dry Soil Mass', unit: 'g', defaultValue: 130, step: 1 },
      { key: 'volume', label: 'Total Soil Volume', unit: 'cm³', defaultValue: 100, step: 1 },
    ],
    compute: (v) => {
      const bd = v.mass / v.volume;
      let interp = '';
      if (bd < 1.1) interp = 'Very loose soil — possibly high OM or sandy.';
      else if (bd > 1.6) interp = 'Compacted — root growth likely restricted.';
      else interp = 'Normal range for mineral soils.';
      return { value: bd.toFixed(2), label: 'g/cm³', interpretation: interp };
    },
  },
  // 7.3 Porosity
  '7.3': {
    fields: [
      { key: 'bd', label: 'Bulk Density', unit: 'g/cm³', defaultValue: 1.3, step: 0.05 },
      { key: 'pd', label: 'Particle Density', unit: 'g/cm³', defaultValue: 2.65, step: 0.05 },
    ],
    compute: (v) => {
      const n = (1 - v.bd / v.pd) * 100;
      let interp = '';
      if (n < 40) interp = 'Low porosity — poor aeration and root penetration.';
      else if (n > 55) interp = 'High porosity — good aeration but possibly low water retention.';
      else interp = 'Healthy porosity range for crop growth.';
      return { value: n.toFixed(1), label: '%', interpretation: interp };
    },
  },
  // 8.9 Harvest Index
  '8.9': {
    fields: [
      { key: 'economic', label: 'Economic Yield', unit: 'kg/ha', defaultValue: 5000, step: 100 },
      { key: 'biological', label: 'Biological Yield', unit: 'kg/ha', defaultValue: 12000, step: 100 },
    ],
    compute: (v) => {
      const hi = (v.economic / v.biological) * 100;
      let interp = '';
      if (hi < 30) interp = 'Low HI — poor partitioning, possibly lodging or stress.';
      else if (hi > 50) interp = 'Excellent partitioning.';
      else interp = 'Typical range (30–50%) for cereals.';
      return { value: hi.toFixed(1), label: '%', interpretation: interp };
    },
  },
  // 8.12 Growing Degree Days
  '8.12': {
    fields: [
      { key: 'tmax', label: 'Max Temperature', unit: '°C', defaultValue: 28, step: 0.5 },
      { key: 'tmin', label: 'Min Temperature', unit: '°C', defaultValue: 16, step: 0.5 },
      { key: 'tbase', label: 'Base Temperature', unit: '°C', defaultValue: 10, step: 0.5 },
    ],
    compute: (v) => {
      const gdd = Math.max(0, ((v.tmax + v.tmin) / 2) - v.tbase);
      return { value: gdd.toFixed(1), label: '°Cd / day', interpretation: `Daily heat unit accumulation. Sum across growing season to predict phenology.` };
    },
  },
  // 11.1 ADG
  '11.1': {
    fields: [
      { key: 'finalWt', label: 'Final Weight', unit: 'kg', defaultValue: 450, step: 5 },
      { key: 'initialWt', label: 'Initial Weight', unit: 'kg', defaultValue: 350, step: 5 },
      { key: 'days', label: 'Days on Feed', unit: 'days', defaultValue: 100, step: 1 },
    ],
    compute: (v) => {
      const adg = (v.finalWt - v.initialWt) / v.days;
      let interp = '';
      if (adg < 0.5) interp = 'Low ADG — investigate nutrition, health, or stress.';
      else if (adg > 1.5) interp = 'Excellent ADG — typical of feedlot cattle.';
      else interp = 'Normal ADG for growing cattle.';
      return { value: adg.toFixed(3), label: 'kg/day', interpretation: interp };
    },
  },
  // 13.1 ECM (6% fat, 4% protein correction — placeholder for 13.x)
  '13.1': {
    fields: [
      { key: 'milk', label: 'Milk Yield', unit: 'kg/day', defaultValue: 30, step: 0.5 },
      { key: 'fatPct', label: 'Fat %', unit: '%', defaultValue: 3.8, step: 0.1 },
      { key: 'proteinPct', label: 'Protein %', unit: '%', defaultValue: 3.2, step: 0.1 },
    ],
    compute: (v) => {
      const ecm = (0.327 * v.milk) + (12.95 * v.milk * (v.fatPct / 100)) + (7.2 * v.milk * (v.proteinPct / 100));
      return { value: ecm.toFixed(1), label: 'kg ECM/day', interpretation: 'Energy-corrected milk standardizes yield to 4% fat, 3.2% protein for fair comparison.' };
    },
  },
  // 14.1 Dressing Percentage
  '14.1': {
    fields: [
      { key: 'carcass', label: 'Hot Carcass Weight', unit: 'kg', defaultValue: 320, step: 5 },
      { key: 'liveWt', label: 'Live Weight', unit: 'kg', defaultValue: 500, step: 5 },
    ],
    compute: (v) => {
      const dp = (v.carcass / v.liveWt) * 100;
      let interp = '';
      if (dp < 50) interp = 'Low dressing % — check for excess fat trim or gut fill.';
      else if (dp > 60) interp = 'High dressing % — typical of well-finished grain-fed cattle.';
      else interp = 'Typical dressing % range for cattle (50–60%).';
      return { value: dp.toFixed(1), label: '%', interpretation: interp };
    },
  },
  // 15.1 FCR (Feed Conversion Ratio)
  '15.1': {
    fields: [
      { key: 'feed', label: 'Feed Consumed', unit: 'kg', defaultValue: 3500, step: 50 },
      { key: 'gain', label: 'Weight Gain', unit: 'kg', defaultValue: 2000, step: 50 },
    ],
    compute: (v) => {
      const fcr = v.feed / v.gain;
      let interp = '';
      if (fcr < 1.5) interp = 'Excellent FCR — typical of modern broilers.';
      else if (fcr > 3) interp = 'High FCR — investigate nutrition, environment, or genetics.';
      else interp = 'Moderate FCR — varies by species and production system.';
      return { value: fcr.toFixed(2), label: 'kg feed / kg gain', interpretation: interp };
    },
  },
  // 17.1 Gross Margin (placeholder — using formula from ch 17)
  '17.1': {
    fields: [
      { key: 'revenue', label: 'Gross Revenue', unit: '$/ha', defaultValue: 3000, step: 50 },
      { key: 'variableCosts', label: 'Variable Costs', unit: '$/ha', defaultValue: 1800, step: 50 },
    ],
    compute: (v) => {
      const gm = v.revenue - v.variableCosts;
      let interp = '';
      if (gm < 0) interp = 'Negative gross margin — variable costs exceed revenue. Urgent review needed.';
      else if (gm > 1500) interp = 'Strong gross margin — healthy profitability.';
      else interp = 'Moderate gross margin — review for cost optimization opportunities.';
      return { value: gm.toFixed(0), label: '$/ha', interpretation: interp };
    },
  },
};

export function InteractiveCalculator({ formula }: InteractiveCalculatorProps) {
  const config = calculators[formula.code];

  const [values, setValues] = useState<Record<string, number>>(() => {
    if (!config) return {};
    const initial: Record<string, number> = {};
    config.fields.forEach(f => { initial[f.key] = f.defaultValue; });
    return initial;
  });

  const result = useMemo(() => {
    if (!config) return null;
    try {
      return config.compute(values);
    } catch {
      return null;
    }
  }, [config, values]);

  if (!config) return null;

  const reset = () => {
    const initial: Record<string, number> = {};
    config.fields.forEach(f => { initial[f.key] = f.defaultValue; });
    setValues(initial);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-500">
          <Calculator className="h-4 w-4" />
          Interactive Calculator
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="h-7 text-xs gap-1">
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {config.fields.map(field => (
          <div key={field.key} className="space-y-1">
            <Label htmlFor={field.key} className="text-xs">
              {field.label}{field.unit && <span className="text-muted-foreground ml-1">({field.unit})</span>}
            </Label>
            <Input
              id={field.key}
              type="number"
              step={field.step ?? 1}
              value={values[field.key]}
              onChange={(e) => setValues(prev => ({ ...prev, [field.key]: parseFloat(e.target.value) || 0 }))}
              className="h-9"
            />
          </div>
        ))}
      </div>

      {result && (
        <div className="rounded-lg border-2 border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-1">
          <div className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-500 font-semibold">Result</div>
          <div className="font-mono text-2xl font-bold text-emerald-900 dark:text-emerald-300">
            {result.value} <span className="text-base font-normal text-emerald-700 dark:text-emerald-500">{result.label}</span>
          </div>
          {result.interpretation && (
            <p className="text-xs text-emerald-800 dark:text-emerald-400 leading-relaxed pt-1">
              {result.interpretation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
