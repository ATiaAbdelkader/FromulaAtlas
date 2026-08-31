'use client';

/**
 * WUR Fertigation Calculator
 * --------------------------
 * Multi-tab calculator built on the WUR (Wageningen University) benchmark
 * engine in `@/lib/wur-engine` and `@/lib/wur-leaching`.
 *
 *   Tab 1 — Water Quality & Acid Neutralization (classifyWater + planAcidDosing)
 *   Tab 2 — Crop & Stage Selection (root-zone targets + fertigation targets)
 *   Tab 3 — Root Zone Diagnostics (toReferenceEc + balanceReport + screenAntagonism)
 *   Tab 4 — Irrigation & Leaching (calculateLeachingFraction + washTargetLf)
 *   Tab 5 — A/B Stock Tank Dosing (calculateRecipe + splitAbTanks)
 *
 * Source: Van der Lugt, G. et al. (2020). "Nutrient Solutions for Greenhouse
 * Crops", Version 4. ISBN 9789464021844.
 */

import { useMemo, useState, type ReactNode } from 'react';
import {
  Beaker, Copy, Check, RotateCcw, Droplet, FlaskConical, Microscope, Waves,
  AlertTriangle, ShieldAlert, ChevronDown, Layers,
} from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  // Engine
  ppmToMmol, classifyWater, planAcidDosing, acidGates, calculateRecipe,
  selectIronChelate, checkSafetyGates, balanceReport, toReferenceEc,
  evaluateCorrections, screenAntagonism, emergencyCheck, sortGates,
  // Leaching
  calculateLeachingFraction, checkWashTrigger, calculateExtraIrrigation,
  evaluateLeaching, leachingGates, washTargetLf, detectWashAnomaly,
  // Data
  ATOMIC_WEIGHTS, WATER_QUALITY_LEVELS, WUR_CROPS, CROP_CATEGORIES,
  CROP_CATEGORY_LABELS, GROWTH_STAGE_LABELS, SUBSTRATE_LABELS,
  getCrop, substratesFor, cropsInCategory,
  // Policy
  DEFAULT_POLICY,
  // Types
  type Gate, type Severity, type WURCropMatrix,
  type LeachingResult, type FeChelatePlan, type Finding,
  type AntagonismMatch, type ReferenceEcMeta, type CalculateRecipeOutput,
} from '@/lib/wur-data';

// ---------------------------------------------------------------------------
// Static copy
// ---------------------------------------------------------------------------

const TITLE: TrilingualString = {
  en: 'WUR Fertigation Calculator',
  ar: 'حاسبة التسميد WUR',
  fr: 'Calculateur de Fertigation WUR',
};

const DESC: TrilingualString = {
  en: 'WUR-benchmarked fertigation: water analysis → acid dose → NPK recipe → A/B stock tanks',
  ar: 'حاسبة التسميد المعتمدة على WUR: تحليل الماء ← جرعة الحمض ← وصفة NPK ← خزانات A/B',
  fr: 'Fertigation benchmark WUR : analyse eau → dose acide → recette NPK → cuves A/B',
};

type TabId = 'water' | 'crop' | 'rootzone' | 'irrigation' | 'tanks';

const TABS: { id: TabId; icon: typeof Beaker; label: TrilingualString }[] = [
  { id: 'water', icon: Droplet, label: { en: 'Water & Acid', ar: 'الماء والحمض', fr: 'Eau & Acide' } },
  { id: 'crop', icon: FlaskConical, label: { en: 'Crop & Stage', ar: 'المحصول والمرحلة', fr: 'Culture & Stade' } },
  { id: 'rootzone', icon: Microscope, label: { en: 'Root Zone', ar: 'المنطقة الجذرية', fr: 'Zone Racinaire' } },
  { id: 'irrigation', icon: Waves, label: { en: 'Irrigation & LF', ar: 'الري والتصريف', fr: 'Irrigation & LF' } },
  { id: 'tanks', icon: Beaker, label: { en: 'A/B Stock Tanks', ar: 'خزانات A/B', fr: 'Cuves A/B' } },
];

const SUBSTRATES = ['INERT_SUBSTRATE', 'ORGANIC_MATERIAL', 'SOIL'] as const;
const STAGE_ORDER = ['start', 'vegetative', 'flowering', 'fruit_set', 'end_season'] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number | undefined | null, dp = 2): string {
  if (n === undefined || n === null || !Number.isFinite(n)) return '—';
  return n.toFixed(dp);
}

function num(v: string): number {
  const f = parseFloat(v);
  return Number.isFinite(f) ? f : 0;
}

const SEVERITY_STYLE: Record<Severity, string> = {
  BLOCKING: 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200',
  CRITICAL: 'border-orange-500 bg-orange-50/60 dark:bg-orange-950/40 text-orange-800 dark:text-orange-200',
  WARNING: 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200',
  INFO: 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200',
};

function GateCard({ gate }: { gate: Gate }) {
  return (
    <div className={cn('rounded-lg border p-3 text-xs space-y-1.5', SEVERITY_STYLE[gate.severity])}>
      <div className="flex items-center gap-2 font-bold">
        <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 h-4">
          {gate.severity}
        </Badge>
        <span className="text-[10px] font-mono opacity-70 truncate">{gate.gid}</span>
      </div>
      <div className="font-semibold leading-snug">{gate.title}</div>
      <p className="opacity-90 leading-relaxed">{gate.message}</p>
      {gate.remedy && (
        <p className="italic opacity-80 border-t border-current/20 pt-1 mt-1">
          → {gate.remedy}
        </p>
      )}
    </div>
  );
}

function GateList({ gates }: { gates: Gate[] }) {
  const sorted = sortGates(gates);
  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
        <Check className="h-3.5 w-3.5" />
        <span>No safety gates triggered — all checks pass.</span>
      </div>
    );
  }
  return (
    <div className="space-y-2 max-h-96 overflow-y-auto pe-1">
      {sorted.map((g) => (
        <GateCard key={g.gid} gate={g} />
      ))}
    </div>
  );
}

function Pill({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap',
        active
          ? 'bg-teal-500 text-white shadow-md'
          : 'bg-muted hover:bg-muted/70 text-muted-foreground border',
      )}
    >
      {children}
    </button>
  );
}

function SectionCard({
  title, icon: Icon, children, accent = 'teal',
}: {
  title: string;
  icon: typeof Beaker;
  children: ReactNode;
  accent?: 'teal' | 'emerald' | 'amber' | 'rose' | 'sky';
}) {
  const accents: Record<string, string> = {
    teal: 'text-teal-600 dark:text-teal-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
    sky: 'text-sky-600 dark:text-sky-400',
  };
  return (
    <Card className="p-4 rounded-2xl shadow-xs space-y-3">
      <div className="flex items-center gap-2 border-b pb-2.5">
        <Icon className={cn('h-4 w-4', accents[accent])} />
        <span className="text-sm font-bold">{title}</span>
      </div>
      {children}
    </Card>
  );
}

function KV({ k, v, unit }: { k: string; v: string | number; unit?: string }) {
  return (
    <div className="flex justify-between items-baseline gap-2 text-xs py-1 border-b border-dashed border-border/60 last:border-0">
      <span className="text-muted-foreground font-medium">{k}</span>
      <span className="font-mono font-bold">
        {v}
        {unit && <span className="text-[10px] font-normal text-muted-foreground ms-1">{unit}</span>}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function WURFertigationCalculator() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr = en) => copyFor(language, en, ar, fr);

  // === Tab navigation state ===
  const [tab, setTab] = useState<TabId>('water');

  // === Tab 1: Water Quality ===
  const [waterPh, setWaterPh] = useState('7.2');
  const [waterEc, setWaterEc] = useState('0.6');
  const [waterNa, setWaterNa] = useState('15');      // ppm
  const [waterCl, setWaterCl] = useState('30');     // ppm
  const [waterHco3, setWaterHco3] = useState('60'); // ppm
  const [waterCa, setWaterCa] = useState('40');
  const [waterMg, setWaterMg] = useState('10');
  const [waterK, setWaterK] = useState('5');
  const [waterNh4, setWaterNh4] = useState('0');
  const [waterNo3, setWaterNo3] = useState('5');
  const [waterSo4, setWaterSo4] = useState('15');
  const [waterPo4, setWaterPo4] = useState('0');
  const [waterFe, setWaterFe] = useState('0');

  // === Tab 2: Crop & Stage ===
  const [categoryId, setCategoryId] = useState<string>('fruiting_vegetables');
  const [cropId, setCropId] = useState<string>('tomato');
  const [substrate, setSubstrate] = useState<string>('INERT_SUBSTRATE');
  const [stage, setStage] = useState<string>('vegetative');
  const [highWater, setHighWater] = useState(false);

  // === Tab 3: Root Zone ===
  const [rzPh, setRzPh] = useState('5.8');
  const [rzEc, setRzEc] = useState('3.0');
  const [rzNa, setRzNa] = useState('1.5');
  const [rzNh4, setRzNh4] = useState('0.5');
  const [rzK, setRzK] = useState('8.0');
  const [rzCa, setRzCa] = useState('6.0');
  const [rzMg, setRzMg] = useState('3.0');
  const [rzNo3, setRzNo3] = useState('18.0');
  const [rzCl, setRzCl] = useState('6.0');
  const [rzS, setRzS] = useState('3.5');
  const [rzP, setRzP] = useState('0.9');

  // === Tab 4: Irrigation ===
  const [vIrr, setVIrr] = useState('3.8');
  const [vDrain, setVDrain] = useState('1.0');
  const [ecDripper, setEcDripper] = useState('2.5');
  const [ecDrain, setEcDrain] = useState('4.2');

  const [copied, setCopied] = useState(false);

  // === Derived: crop matrix ===
  const cropMatrix = useMemo<WURCropMatrix | null>(
    () => getCrop(cropId, substrate),
    [cropId, substrate],
  );
  const availableSubstrates = useMemo(() => substratesFor(cropId), [cropId]);
  const availableStages = useMemo(
    () => Object.keys(cropMatrix?.growth_stages ?? {}),
    [cropMatrix],
  );

  // === Derived: water analysis in mmol/L ===
  const waterMmol = useMemo(() => {
    const conv = (v: string, ion: string) => ppmToMmol(num(v), ion);
    return {
      Na: conv(waterNa, 'Na'),
      Cl: conv(waterCl, 'Cl'),
      HCO3: conv(waterHco3, 'HCO3'),
      Ca: conv(waterCa, 'Ca'),
      Mg: conv(waterMg, 'Mg'),
      K: conv(waterK, 'K'),
      NH4: conv(waterNh4, 'NH4'),
      NO3: conv(waterNo3, 'NO3'),
      S: conv(waterSo4, 'S'),
      P: conv(waterPo4, 'P'),
    };
  }, [waterNa, waterCl, waterHco3, waterCa, waterMg, waterK, waterNh4, waterNo3, waterSo4, waterPo4]);

  const waterFeUmol = useMemo(
    () => (num(waterFe) * 1000) / ATOMIC_WEIGHTS.Fe,
    [waterFe],
  );

  // === Tab 1: water quality + acid plan ===
  const waterTab = useMemo(() => {
    const ec = num(waterEc);
    const level = classifyWater(ec, waterMmol.Na, waterMmol.Cl);
    const no3Target = cropMatrix?.fertigation.NO3 ?? 0;
    const pTarget = cropMatrix?.fertigation.P ?? 0;
    const no3Headroom = Math.max(0, no3Target - waterMmol.NO3);
    const pHeadroom = Math.max(0, pTarget - waterMmol.P);
    const acidPlan = planAcidDosing(waterMmol.HCO3, no3Headroom, pHeadroom);
    const acidGatesList = acidGates(acidPlan);
    const safetyGates = checkSafetyGates({
      water: {
        ec,
        na: waterMmol.Na,
        cl: waterMmol.Cl,
        recirculating: false,
      },
      hco3: waterMmol.HCO3,
      no3_headroom: no3Headroom,
      p_headroom: pHeadroom,
      fe_umol: waterFeUmol,
      irrigation_type: 'DRIP',
      crop: cropMatrix,
      acid_plan: acidPlan,
    });
    return {
      level,
      acidPlan,
      no3Headroom,
      pHeadroom,
      acidGates: acidGatesList,
      safetyGates,
    };
  }, [waterEc, waterMmol, waterFeUmol, cropMatrix]);

  // === Tab 3: root zone diagnostics ===
  const rzTab = useMemo(() => {
    const ph = num(rzPh);
    const ec = num(rzEc);
    const macro = {
      Na: num(rzNa),
      NH4: num(rzNh4),
      K: num(rzK),
      Ca: num(rzCa),
      Mg: num(rzMg),
      NO3: num(rzNo3),
      Cl: num(rzCl),
      S: num(rzS),
      P: num(rzP),
    };
    if (!cropMatrix) {
      return { ph, ec, macro, ref: null, meta: null, findings: [] as Finding[], antagonism: [] as AntagonismMatch[], balance: null, emergency: null };
    }
    let ref: Record<string, number> | null = null;
    let meta: ReferenceEcMeta | null = null;
    let findings: Finding[] = [];
    try {
      const [r, m] = toReferenceEc(macro, ec, cropMatrix.ec_root_zone, cropMatrix);
      ref = r;
      meta = m;
      const [f] = evaluateCorrections(macro, {}, ec, cropMatrix);
      findings = f;
    } catch {
      // G-EC-NONPOSITIVE — sodium dominates the entire EC
    }
    const antagonism = screenAntagonism(macro, ph, cropMatrix.root_zone_targets);
    const balance = balanceReport(macro);
    const emergency = emergencyCheck(ph, ec, cropMatrix);
    return { ph, ec, macro, ref, meta, findings, antagonism, balance, emergency };
  }, [rzPh, rzEc, rzNa, rzNh4, rzK, rzCa, rzMg, rzNo3, rzCl, rzS, rzP, cropMatrix]);

  // === Tab 4: irrigation & leaching ===
  const irrTab = useMemo(() => {
    const vi = num(vIrr);
    const vd = num(vDrain);
    const ecd = num(ecDripper);
    const ecr = num(ecDrain);
    const lfPct = calculateLeachingFraction(vd, vi);
    const deltaEc = ecr - ecd;
    const washTriggered = checkWashTrigger(ecr, ecd);
    const [targetLf, washCase] = washTargetLf(lfPct);
    const isAnomaly = detectWashAnomaly(lfPct, deltaEc);
    const extraIrr = washTriggered && washCase !== 'ANOMALY'
      ? calculateExtraIrrigation(vi, lfPct / 100, targetLf / 100)
      : 0;
    let leachResult: LeachingResult | null = null;
    let leachGates: Gate[] = [];
    try {
      leachResult = evaluateLeaching(
        vi, vd, ecd, ecr, DEFAULT_POLICY,
        cropId, stage ? [stage] : [],
      );
      leachGates = leachingGates(leachResult);
    } catch {
      // invalid volume combination
    }
    return {
      lfPct, deltaEc, washTriggered, targetLf, washCase, isAnomaly, extraIrr,
      leachResult, leachGates,
    };
  }, [vIrr, vDrain, ecDripper, ecDrain, cropId, stage]);

  // === Tab 5: recipe + tanks ===
  const recipeTab = useMemo<CalculateRecipeOutput | null>(() => {
    if (!cropMatrix) return null;
    const phForFe = rzTab.ph || ((cropMatrix.ph_root_zone[0] + cropMatrix.ph_root_zone[1]) / 2);
    try {
      return calculateRecipe({
        crop_matrix: cropMatrix,
        stage,
        is_high_water_supply: highWater,
        base_water: { ...waterMmol, HCO3: waterMmol.HCO3 },
        acid_plan: waterTab.acidPlan,
        fe_chelate_plan: selectIronChelate(phForFe),
        analysis: rzTab.meta
          ? { macro: rzTab.macro, ec: rzTab.ec }
          : undefined,
      });
    } catch {
      return null;
    }
  }, [cropMatrix, stage, highWater, waterMmol, waterTab.acidPlan, rzTab]);

  // === Reset ===
  const handleReset = () => {
    setWaterPh('7.2'); setWaterEc('0.6');
    setWaterNa('15'); setWaterCl('30'); setWaterHco3('60');
    setWaterCa('40'); setWaterMg('10'); setWaterK('5');
    setWaterNh4('0'); setWaterNo3('5'); setWaterSo4('15');
    setWaterPo4('0'); setWaterFe('0');
    setCategoryId('fruiting_vegetables'); setCropId('tomato');
    setSubstrate('INERT_SUBSTRATE'); setStage('vegetative'); setHighWater(false);
    setRzPh('5.8'); setRzEc('3.0');
    setRzNa('1.5'); setRzNh4('0.5'); setRzK('8.0'); setRzCa('6.0');
    setRzMg('3.0'); setRzNo3('18.0'); setRzCl('6.0'); setRzS('3.5'); setRzP('0.9');
    setVIrr('3.8'); setVDrain('1.0'); setEcDripper('2.5'); setEcDrain('4.2');
    setTab('water');
    toast({ title: tr('Reset to defaults', 'تمت الاستعادة للقيم الافتراضية', 'Réinitialisé') });
  };

  // === Copy Summary ===
  const handleCopy = () => {
    const lines: string[] = [];
    lines.push('=== WUR FERTIGATION CALCULATOR ===');
    lines.push(`Crop: ${cropId} (${substrate}) | Stage: ${stage}${highWater ? ' + high water' : ''}`);
    lines.push('');

    lines.push('--- TAB 1: WATER QUALITY ---');
    lines.push(`pH: ${num(waterPh).toFixed(2)} | EC: ${num(waterEc).toFixed(2)} mS/cm`);
    lines.push(`Na: ${fmt(waterMmol.Na)} | Cl: ${fmt(waterMmol.Cl)} | HCO3: ${fmt(waterMmol.HCO3)} mmol/L`);
    lines.push(`Ca: ${fmt(waterMmol.Ca)} | Mg: ${fmt(waterMmol.Mg)} | K: ${fmt(waterMmol.K)} mmol/L`);
    lines.push(`NH4: ${fmt(waterMmol.NH4)} | NO3: ${fmt(waterMmol.NO3)} | S: ${fmt(waterMmol.S)} | P: ${fmt(waterMmol.P)} mmol/L`);
    lines.push(`Fe: ${fmt(waterFeUmol)} umol/L`);
    lines.push(`Water quality level: ${waterTab.level}`);
    lines.push(`Acid plan: H+ req=${fmt(waterTab.acidPlan.h_required)} | HNO3=${fmt(waterTab.acidPlan.h_from_nitric)} | H3PO4=${fmt(waterTab.acidPlan.h_from_phosphoric)} mmol/L`);
    lines.push(`  Nitric direct: ${fmt(waterTab.acidPlan.nitric_l_direct)} L / ${fmt(waterTab.acidPlan.direct_basis_volume_l, 0)} L water`);
    lines.push(`  Phosphoric direct: ${fmt(waterTab.acidPlan.phosphoric_l_direct)} L / ${fmt(waterTab.acidPlan.direct_basis_volume_l, 0)} L water`);
    lines.push(`  Residual HCO3: ${fmt(waterTab.acidPlan.hco3_residual)} mmol/L | Feasible: ${waterTab.acidPlan.feasible}`);
    lines.push(`Safety gates: ${waterTab.safetyGates.length}`);
    lines.push('');

    if (cropMatrix) {
      lines.push('--- TAB 2: CROP & STAGE ---');
      lines.push(`Root zone pH: ${cropMatrix.ph_root_zone[0]}–${cropMatrix.ph_root_zone[1]} | EC: ${cropMatrix.ec_root_zone} mS/cm`);
      lines.push(`Fertigation pH: ${cropMatrix.ph_fertigation} | EC: ${cropMatrix.ec_fertigation} mS/cm`);
      lines.push(`Na ceiling: ${cropMatrix.na_max_root_zone ?? '—'} | Cl ceiling: ${cropMatrix.cl_max_root_zone ?? '—'} mmol/L`);
      const m = Object.entries(cropMatrix.root_zone_targets).map(([k, v]) => `${k}=${fmt(v)}`).join(', ');
      lines.push(`Root-zone targets: ${m}`);
      const f = Object.entries(cropMatrix.fertigation).map(([k, v]) => `${k}=${fmt(v)}`).join(', ');
      lines.push(`Fertigation: ${f}`);
      lines.push('');
    }

    if (rzTab.meta) {
      lines.push('--- TAB 3: ROOT ZONE ---');
      lines.push(`pH: ${rzTab.ph.toFixed(2)} | EC: ${rzTab.ec.toFixed(2)} mS/cm`);
      lines.push(`Reference EC: ${fmt(rzTab.meta.ec_reference_ms_cm)} | EC_nutrients: ${fmt(rzTab.meta.ec_nutrients_ms_cm)} | factor: ${fmt(rzTab.meta.conversion_factor, 4)}`);
      if (rzTab.balance) {
        lines.push(`Ion balance: cat=${fmt(rzTab.balance.eq_cations_meq_l)} meq/L | an=${fmt(rzTab.balance.eq_anions_meq_l)} meq/L | diff=${fmt(rzTab.balance.difference_pct)}% | balanced=${rzTab.balance.balanced}`);
      }
      if (rzTab.findings.length > 0) {
        lines.push('Findings:');
        for (const fnd of rzTab.findings) {
          lines.push(`  ${fnd.ion}: analysed=${fmt(fnd.analysed)} ref=${fmt(fnd.at_reference_ec)} target=${fmt(fnd.target)} dev=${fmt(fnd.deviation_pct, 1)}% L${fnd.level} ${fnd.band} → adj ${fmt(fnd.adjustment_pct, 1)}%`);
        }
      }
      if (rzTab.antagonism.length > 0) {
        lines.push(`Antagonism: ${rzTab.antagonism.map((a) => a.code).join(', ')}`);
      }
      if (rzTab.emergency) {
        lines.push(`*** EMERGENCY: ${rzTab.emergency.title} ***`);
      }
      lines.push('');
    }

    lines.push('--- TAB 4: IRRIGATION & LEACHING ---');
    lines.push(`V_irrigation: ${num(vIrr).toFixed(2)} L/m² | V_drain: ${num(vDrain).toFixed(2)} L/m²`);
    lines.push(`EC_dripper: ${num(ecDripper).toFixed(2)} | EC_drain: ${num(ecDrain).toFixed(2)} mS/cm`);
    lines.push(`LF: ${fmt(irrTab.lfPct, 1)}% | ΔEC: ${fmt(irrTab.deltaEc)} mS/cm`);
    lines.push(`Wash triggered: ${irrTab.washTriggered} | case: ${irrTab.washCase} | target LF: ${fmt(irrTab.targetLf, 1)}%`);
    lines.push(`Extra irrigation: ${fmt(irrTab.extraIrr)} L/m²`);
    if (irrTab.leachResult) {
      lines.push(`Target irrigation: ${fmt(irrTab.leachResult.target_irrigation_l_m2)} L/m²/day`);
    }
    lines.push('');

    if (recipeTab) {
      lines.push('--- TAB 5: A/B STOCK TANKS ---');
      const macroStr = Object.entries(recipeTab.macro).map(([k, v]) => `${k}=${fmt(v)}`).join(', ');
      lines.push(`Recipe macro: ${macroStr} (mmol/L)`);
      const microStr = Object.entries(recipeTab.micro).map(([k, v]) => `${k}=${fmt(v)}`).join(', ');
      lines.push(`Recipe micro: ${microStr} (umol/L)`);
      lines.push(`Doses (${recipeTab.doses.length} fertilisers):`);
      for (const d of recipeTab.doses) {
        lines.push(`  ${d.fert.name_en}: ${fmt(d.mass_kg)} kg${d.volume_l !== null ? ` / ${fmt(d.volume_l)} L` : ''} [${d.fert.tank}]`);
      }
      lines.push(`Tank A total: ${fmt(recipeTab.tank_split.mass_a_kg)} kg | Tank B total: ${fmt(recipeTab.tank_split.mass_b_kg)} kg`);
      if (recipeTab.fe_chelate_plan) {
        lines.push(`Fe chelate: ${recipeTab.fe_chelate_plan.primary_fid} (${fmt(recipeTab.fe_chelate_plan.primary_share * 100, 0)}%)` +
          (recipeTab.fe_chelate_plan.secondary_fid
            ? ` + ${recipeTab.fe_chelate_plan.secondary_fid} (${fmt(recipeTab.fe_chelate_plan.secondary_share * 100, 0)}%)`
            : ''));
      }
      const tankGates = recipeTab.tank_split.gates;
      if (tankGates.length > 0) {
        lines.push(`Tank separation gates: ${tankGates.map((g) => g.gid).join(', ')}`);
      }
      lines.push(`Total gates: ${recipeTab.gates.length}`);
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    toast({ title: tr('Summary copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  // === Render ===
  return (
    <CalculatorShell
      icon={Beaker}
      title={TITLE}
      description={DESC}
      badge="WUR Benchmark v4"
      accent="teal"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
          onClick: handleCopy,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
    >
      {/* ===== Tab navigation bar (full width) ===== */}
      <div className="lg:col-span-12">
        <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-card border shadow-xs">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all flex-1 min-w-[120px] justify-center',
                  active
                    ? 'bg-teal-500 text-white shadow-md'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                <t.icon className="h-4 w-4" />
                <span>{tr(t.label.en, t.label.ar, t.label.fr)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== TAB 1: Water Quality & Acid Neutralization ===== */}
      {tab === 'water' && (
        <>
          <CalculatorShell.Inputs>
            <SectionCard title={tr('Water Analysis (ppm)', 'تحليل المياه (جزء في المليون)', 'Analyse eau (ppm)')} icon={Droplet}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <CalculatorShell.InputField label={tr('pH', 'pH', 'pH')} value={waterPh} onChange={setWaterPh} step="0.1" helper="0–14" />
                <CalculatorShell.InputField label={tr('EC', 'EC', 'EC')} value={waterEc} onChange={setWaterEc} step="0.1" helper="mS/cm" />
                <CalculatorShell.InputField label="Na" value={waterNa} onChange={setWaterNa} step="1" helper={tr(`${fmt(waterMmol.Na)} mmol/L`, `${fmt(waterMmol.Na)} مليمول/لتر`, `${fmt(waterMmol.Na)} mmol/L`)} />
                <CalculatorShell.InputField label="Cl" value={waterCl} onChange={setWaterCl} step="1" helper={tr(`${fmt(waterMmol.Cl)} mmol/L`, `${fmt(waterMmol.Cl)} مليمول/لتر`, `${fmt(waterMmol.Cl)} mmol/L`)} />
                <CalculatorShell.InputField label="HCO₃⁻" value={waterHco3} onChange={setWaterHco3} step="1" helper={tr(`${fmt(waterMmol.HCO3)} mmol/L`, `${fmt(waterMmol.HCO3)} مليمول/لتر`, `${fmt(waterMmol.HCO3)} mmol/L`)} />
                <CalculatorShell.InputField label="Ca" value={waterCa} onChange={setWaterCa} step="1" helper={tr(`${fmt(waterMmol.Ca)} mmol/L`, `${fmt(waterMmol.Ca)} مليمول/لتر`, `${fmt(waterMmol.Ca)} mmol/L`)} />
                <CalculatorShell.InputField label="Mg" value={waterMg} onChange={setWaterMg} step="1" helper={tr(`${fmt(waterMmol.Mg)} mmol/L`, `${fmt(waterMmol.Mg)} مليمول/لتر`, `${fmt(waterMmol.Mg)} mmol/L`)} />
                <CalculatorShell.InputField label="K" value={waterK} onChange={setWaterK} step="1" helper={tr(`${fmt(waterMmol.K)} mmol/L`, `${fmt(waterMmol.K)} مليمول/لتر`, `${fmt(waterMmol.K)} mmol/L`)} />
                <CalculatorShell.InputField label="NH₄" value={waterNh4} onChange={setWaterNh4} step="0.1" helper={tr(`${fmt(waterMmol.NH4)} mmol/L`, `${fmt(waterMmol.NH4)} مليمول/لتر`, `${fmt(waterMmol.NH4)} mmol/L`)} />
                <CalculatorShell.InputField label="NO₃" value={waterNo3} onChange={setWaterNo3} step="1" helper={tr(`${fmt(waterMmol.NO3)} mmol/L`, `${fmt(waterMmol.NO3)} مليمول/لتر`, `${fmt(waterMmol.NO3)} mmol/L`)} />
                <CalculatorShell.InputField label="SO₄" value={waterSo4} onChange={setWaterSo4} step="1" helper={tr(`${fmt(waterMmol.S)} mmol/L`, `${fmt(waterMmol.S)} مليمول/لتر`, `${fmt(waterMmol.S)} mmol/L`)} />
                <CalculatorShell.InputField label="PO₄" value={waterPo4} onChange={setWaterPo4} step="0.1" helper={tr(`${fmt(waterMmol.P)} mmol/L`, `${fmt(waterMmol.P)} مليمول/لتر`, `${fmt(waterMmol.P)} mmol/L`)} />
                <CalculatorShell.InputField label="Fe" value={waterFe} onChange={setWaterFe} step="0.1" helper={tr(`${fmt(waterFeUmol)} µmol/L`, `${fmt(waterFeUmol)} ميكرومول/لتر`, `${fmt(waterFeUmol)} µmol/L`)} />
              </div>
            </SectionCard>
          </CalculatorShell.Inputs>

          <CalculatorShell.Results>
            <SectionCard title={tr('Classification & Acid Dose', 'التصنيف وجرعة الحمض', 'Classification & dose acide')} icon={Beaker}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <CalculatorShell.MetricTile
                  label={tr('Water Quality', 'جودة المياه', 'Qualité eau')}
                  value={waterTab.level > 3 ? 'Beyond L3' : `Level ${waterTab.level}`}
                  color={waterTab.level <= 1 ? 'emerald' : waterTab.level === 2 ? 'amber' : 'rose'}
                  helper={WATER_QUALITY_LEVELS[Math.min(waterTab.level, 3) - 1]?.suitability_en ?? 'Outside Table 1'}
                />
                <CalculatorShell.MetricTile
                  label={tr('H⁺ Required', 'H⁺ المطلوب', 'H⁺ requis')}
                  value={fmt(waterTab.acidPlan.h_required)}
                  unit="mmol/L"
                  color="teal"
                />
                <CalculatorShell.MetricTile
                  label={tr('Residual HCO₃', 'بقايا HCO₃', 'HCO₃ résiduel')}
                  value={fmt(waterTab.acidPlan.hco3_residual)}
                  unit="mmol/L"
                  color={waterTab.acidPlan.feasible ? 'emerald' : 'rose'}
                  helper={waterTab.acidPlan.feasible ? tr('Feasible', 'ممكن', 'Faisable') : tr('Infeasible', 'غير ممكن', 'Infaisable')}
                />
                <CalculatorShell.MetricTile
                  label="HNO₃ (L/100L)"
                  value={fmt((waterTab.acidPlan.nitric_l_direct / waterTab.acidPlan.direct_basis_volume_l) * 100, 3)}
                  unit="L"
                  color="sky"
                  helper={tr(`Stock: ${fmt(waterTab.acidPlan.nitric_l)} L`, `الخزين: ${fmt(waterTab.acidPlan.nitric_l)} لتر`, `Stock: ${fmt(waterTab.acidPlan.nitric_l)} L`)}
                />
                <CalculatorShell.MetricTile
                  label="H₃PO₄ (L/100L)"
                  value={fmt((waterTab.acidPlan.phosphoric_l_direct / waterTab.acidPlan.direct_basis_volume_l) * 100, 3)}
                  unit="L"
                  color="sky"
                  helper={tr(`Stock: ${fmt(waterTab.acidPlan.phosphoric_l)} L`, `الخزين: ${fmt(waterTab.acidPlan.phosphoric_l)} لتر`, `Stock: ${fmt(waterTab.acidPlan.phosphoric_l)} L`)}
                />
                <CalculatorShell.MetricTile
                  label={tr('Anion Headroom', 'هامش الأنيون', 'Marge anions')}
                  value={`NO₃ ${fmt(waterTab.no3Headroom)}`}
                  color="amber"
                  helper={`PO₄ ${fmt(waterTab.pHeadroom)} mmol/L`}
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">{tr('Water Quality Levels (Table 1, p.11)', 'مستويات جودة المياه', 'Niveaux de qualité')}</div>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-[10px]">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="text-start p-1.5">L</th>
                        <th className="text-start p-1.5">EC max</th>
                        <th className="text-start p-1.5">Ion max</th>
                        <th className="text-start p-1.5">Na ppm</th>
                        <th className="text-start p-1.5">Cl ppm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {WATER_QUALITY_LEVELS.map((l) => (
                        <tr key={l.level} className={cn('border-t', waterTab.level === l.level && 'bg-teal-50 dark:bg-teal-950/40 font-bold')}>
                          <td className="p-1.5">{l.level}</td>
                          <td className="p-1.5">{l.ec_max}</td>
                          <td className="p-1.5">{l.ion_max}</td>
                          <td className="p-1.5">{l.na_ppm}</td>
                          <td className="p-1.5">{l.cl_ppm}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </SectionCard>

            <SectionCard title={tr('Safety Gates', 'بوابات الأمان', 'Portes de sécurité')} icon={ShieldAlert} accent="rose">
              <GateList gates={waterTab.safetyGates} />
            </SectionCard>
          </CalculatorShell.Results>
        </>
      )}

      {/* ===== TAB 2: Crop & Stage Selection ===== */}
      {tab === 'crop' && (
        <>
          <CalculatorShell.Inputs>
            <SectionCard title={tr('Crop & Substrate', 'المحصول والركيزة', 'Culture & substrat')} icon={FlaskConical}>
              <div className="space-y-3">
                <div>
                  <div className="text-[11px] font-bold text-muted-foreground uppercase mb-1.5">{tr('Category', 'الفئة', 'Catégorie')}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {CROP_CATEGORIES.map((c) => {
                      const label = CROP_CATEGORY_LABELS[c] ?? c;
                      return (
                        <Pill key={c} active={categoryId === c} onClick={() => {
                          setCategoryId(c);
                          const firstCrop = cropsInCategory(c)[0];
                          if (firstCrop) {
                            setCropId(firstCrop);
                            const subs = substratesFor(firstCrop);
                            if (!subs.includes(substrate) && subs.length > 0) {
                              setSubstrate(subs[0]);
                            }
                          }
                        }}>
                          {label.split(' (')[0]}
                        </Pill>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-muted-foreground uppercase mb-1.5">{tr('Crop', 'المحصول', 'Culture')} ({cropsInCategory(categoryId).length})</div>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 rounded-lg bg-muted/30 border">
                    {cropsInCategory(categoryId).map((cid) => {
                      const crop = WUR_CROPS[cid];
                      return (
                        <Pill key={cid} active={cropId === cid} onClick={() => {
                          setCropId(cid);
                          const subs = substratesFor(cid);
                          if (!subs.includes(substrate) && subs.length > 0) {
                            setSubstrate(subs[0]);
                          }
                        }}>
                          {crop?.name_en ?? cid}
                        </Pill>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-muted-foreground uppercase mb-1.5">{tr('Substrate', 'الركيزة', 'Substrat')}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {SUBSTRATES.map((s) => {
                      const available = availableSubstrates.includes(s);
                      const label = (SUBSTRATE_LABELS[s] ?? s).split(' (')[0];
                      return (
                        <Pill key={s} active={substrate === s} onClick={() => available && setSubstrate(s)}>
                          <span className={cn(!available && 'opacity-40 line-through')}>{label}</span>
                        </Pill>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-muted-foreground uppercase mb-1.5">{tr('Growth Stage', 'مرحلة النمو', 'Stade')}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {STAGE_ORDER.map((s) => {
                      const available = availableStages.includes(s);
                      const label = GROWTH_STAGE_LABELS[s]?.[0] ?? s;
                      return (
                        <Pill key={s} active={stage === s} onClick={() => available && setStage(s)}>
                          <span className={cn(!available && 'opacity-40')}>{label}</span>
                        </Pill>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg border bg-muted/30">
                  <div>
                    <div className="text-xs font-bold">{tr('High water supply', 'إمدادات مياه عالية', 'Apport eau élevé')}</div>
                    <div className="text-[10px] text-muted-foreground">{tr('>5 L/m²/day adjustment', 'تعديل >5 لتر/م²/يوم', '>5 L/m²/jour')}</div>
                  </div>
                  <Switch checked={highWater} onCheckedChange={setHighWater} />
                </div>
              </div>
            </SectionCard>
          </CalculatorShell.Inputs>

          <CalculatorShell.Results>
            {cropMatrix ? (
              <>
                <SectionCard title={tr('Root Zone Targets', 'أهداف المنطقة الجذرية', 'Cibles zone racinaire')} icon={Microscope} accent="emerald">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <CalculatorShell.MetricTile label="pH" value={`${cropMatrix.ph_root_zone[0]}–${cropMatrix.ph_root_zone[1]}`} color="teal" />
                    <CalculatorShell.MetricTile label={tr('EC (root zone)', 'EC منطقة جذرية', 'EC zone rac.')} value={fmt(cropMatrix.ec_root_zone)} unit="mS/cm" color="emerald" />
                    <CalculatorShell.MetricTile label={tr('pH (fertigation)', 'pH تسميد', 'pH fertigation')} value={fmt(cropMatrix.ph_fertigation)} color="sky" />
                    <CalculatorShell.MetricTile label={tr('EC (fertigation)', 'EC تسميد', 'EC fertigation')} value={fmt(cropMatrix.ec_fertigation)} unit="mS/cm" color="sky" />
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 text-xs">
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{tr('Macro (mmol/L)', 'العناصر الكبرى', 'Macro')}</div>
                      {['NH4', 'K', 'Ca', 'Mg', 'NO3', 'Cl', 'S', 'P'].map((ion) => {
                        const v = cropMatrix.root_zone_targets[ion];
                        if (v === undefined) return null;
                        return <KV key={ion} k={ion} v={fmt(v)} />;
                      })}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{tr('Micro (µmol/L)', 'العناصر الصغرى', 'Micro')}</div>
                      {['Fe', 'Mn', 'Zn', 'B', 'Cu', 'Mo'].map((ion) => {
                        const v = cropMatrix.root_zone_targets[ion];
                        if (v === undefined) return null;
                        return <KV key={ion} k={ion} v={fmt(v)} />;
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t">
                    <KV k={tr('Na ceiling', 'سقف Na', 'Plafond Na')} v={cropMatrix.na_max_root_zone ?? '—'} unit="mmol/L" />
                    <KV k={tr('Cl ceiling', 'سقف Cl', 'Plafond Cl')} v={cropMatrix.cl_max_root_zone ?? '—'} unit="mmol/L" />
                    <KV k={tr('Extract method', 'طريقة الاستخلاص', 'Méthode')} v={cropMatrix.extract_method} />
                    <KV k={tr('Source page', 'الصفحة', 'Page')} v={`p.${cropMatrix.source_page}`} />
                  </div>
                </SectionCard>

                <SectionCard title={tr('Fertigation Recipe (mmol/L)', 'وصفة التسميد', 'Recette fertigation')} icon={Beaker} accent="teal">
                  <div className="grid grid-cols-2 gap-x-3 text-xs">
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{tr('Macro (mmol/L)', 'العناصر الكبرى', 'Macro')}</div>
                      {['NH4', 'K', 'Ca', 'Mg', 'NO3', 'Cl', 'S', 'P'].map((ion) => {
                        const v = cropMatrix.fertigation[ion];
                        if (v === undefined) return null;
                        return <KV key={ion} k={ion} v={fmt(v)} />;
                      })}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{tr('Micro (µmol/L)', 'العناصر الصغرى', 'Micro')}</div>
                      {['Fe', 'Mn', 'Zn', 'B', 'Cu', 'Mo'].map((ion) => {
                        const v = cropMatrix.micro_fertigation[ion];
                        if (v === undefined) return null;
                        return <KV key={ion} k={ion} v={fmt(v)} />;
                      })}
                    </div>
                  </div>
                  {stage && cropMatrix.growth_stages[stage] && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{tr('Stage adjustment', 'تعديل المرحلة', 'Ajustement stade')} ({stage})</div>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(cropMatrix.growth_stages[stage]).map(([k, v]) => (
                          <Badge key={k} variant="outline" className="text-[10px] font-mono">
                            {k} {v >= 0 ? '+' : ''}{fmt(v)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {highWater && cropMatrix.high_water_adjustment && Object.keys(cropMatrix.high_water_adjustment).length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="text-[10px] font-bold text-amber-600 uppercase mb-1">{tr('High water adjustment', 'تعديل المياه العالية', 'Ajustement eau élevée')}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(cropMatrix.high_water_adjustment).map(([k, v]) => (
                          <Badge key={k} variant="outline" className="text-[10px] font-mono border-amber-400">
                            {k} {v >= 0 ? '+' : ''}{fmt(v)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </SectionCard>
              </>
            ) : (
              <SectionCard title={tr('No Matrix', 'لا توجد مصفوفة', 'Pas de matrice')} icon={AlertTriangle} accent="rose">
                <p className="text-xs text-muted-foreground">
                  {tr(
                    `No published WUR matrix for crop "${cropId}" on substrate "${substrate}". Choose a different substrate.`,
                    `لا توجد مصفوفة WUR منشورة للمحصول "${cropId}" على الركيزة "${substrate}". اختر ركيزة أخرى.`,
                    `Aucune matrice WUR publiée pour "${cropId}" sur "${substrate}". Choisissez un autre substrat.`,
                  )}
                </p>
              </SectionCard>
            )}
          </CalculatorShell.Results>
        </>
      )}

      {/* ===== TAB 3: Root Zone Diagnostics ===== */}
      {tab === 'rootzone' && (
        <>
          <CalculatorShell.Inputs>
            <SectionCard title={tr('Analysed Root Zone', 'تحليل المنطقة الجذرية', 'Analyse zone racinaire')} icon={Microscope}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <CalculatorShell.InputField label={tr('pH', 'pH', 'pH')} value={rzPh} onChange={setRzPh} step="0.1" helper={tr('Meltdown floor: 5.2', 'الحد الأدنى: 5.2', 'Seuil critique: 5.2')} />
                <CalculatorShell.InputField label={tr('EC', 'EC', 'EC')} value={rzEc} onChange={setRzEc} step="0.1" helper={tr('Meltdown ceiling: 4.5 mS/cm', 'الحد الأقصى: 4.5', 'Plafond: 4.5 mS/cm')} />
                <CalculatorShell.InputField label="Na" value={rzNa} onChange={setRzNa} step="0.1" helper="mmol/L" />
                <CalculatorShell.InputField label="NH₄" value={rzNh4} onChange={setRzNh4} step="0.1" helper="mmol/L" />
                <CalculatorShell.InputField label="K" value={rzK} onChange={setRzK} step="0.1" helper="mmol/L" />
                <CalculatorShell.InputField label="Ca" value={rzCa} onChange={setRzCa} step="0.1" helper="mmol/L" />
                <CalculatorShell.InputField label="Mg" value={rzMg} onChange={setRzMg} step="0.1" helper="mmol/L" />
                <CalculatorShell.InputField label="NO₃" value={rzNo3} onChange={setRzNo3} step="0.1" helper="mmol/L" />
                <CalculatorShell.InputField label="Cl" value={rzCl} onChange={setRzCl} step="0.1" helper="mmol/L" />
                <CalculatorShell.InputField label="S" value={rzS} onChange={setRzS} step="0.1" helper="mmol/L" />
                <CalculatorShell.InputField label="P" value={rzP} onChange={setRzP} step="0.1" helper="mmol/L" />
              </div>
            </SectionCard>
          </CalculatorShell.Inputs>

          <CalculatorShell.Results>
            <SectionCard title={tr('Reference-EC Normalization', 'تطبيع EC المرجعي', 'Normalisation EC réf.')} icon={Layers} accent="teal">
              {rzTab.meta ? (
                <>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <CalculatorShell.MetricTile label={tr('EC reference', 'EC المرجعي', 'EC réf.')} value={fmt(rzTab.meta.ec_reference_ms_cm)} unit="mS/cm" color="teal" helper={tr('= target − 0.30', '= الهدف − 0.30', '= cible − 0.30')} />
                    <CalculatorShell.MetricTile label={tr('EC nutrients', 'EC العناصر', 'EC nutr.')} value={fmt(rzTab.meta.ec_nutrients_ms_cm)} unit="mS/cm" color="sky" helper={tr('= EC − 0.1·Na', '= EC − 0.1·Na', '= EC − 0.1·Na')} />
                    <CalculatorShell.MetricTile label={tr('Factor', 'المعامل', 'Facteur')} value={fmt(rzTab.meta.conversion_factor, 4)} color="amber" helper={tr('applied to all', 'مطبق على الكل', 'à tous')} />
                  </div>

                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-[10px]">
                      <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                          <th className="text-start p-1.5">Ion</th>
                          <th className="text-end p-1.5">Analysed</th>
                          <th className="text-end p-1.5">@Ref EC</th>
                          <th className="text-end p-1.5">Target</th>
                          <th className="text-end p-1.5">Dev %</th>
                          <th className="text-center p-1.5">Lvl</th>
                          <th className="text-center p-1.5">Band</th>
                          <th className="text-end p-1.5">Adj %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rzTab.findings.map((f) => (
                          <tr key={f.ion} className="border-t hover:bg-muted/30">
                            <td className="p-1.5 font-bold">{f.ion}</td>
                            <td className="p-1.5 text-end font-mono">{fmt(f.analysed)}</td>
                            <td className="p-1.5 text-end font-mono">{fmt(f.at_reference_ec)}</td>
                            <td className="p-1.5 text-end font-mono text-muted-foreground">{fmt(f.target)}</td>
                            <td className={cn('p-1.5 text-end font-mono font-bold', f.band === 'HIGH' ? 'text-amber-600' : f.band === 'LOW' ? 'text-sky-600' : '')}>
                              {fmt(f.deviation_pct, 1)}%
                            </td>
                            <td className="p-1.5 text-center">
                              <Badge variant="outline" className={cn('text-[9px] h-4 px-1', f.level === 0 ? 'border-emerald-400 text-emerald-700' : f.level === 1 ? 'border-amber-400 text-amber-700' : 'border-rose-400 text-rose-700')}>
                                L{f.level}
                              </Badge>
                            </td>
                            <td className="p-1.5 text-center text-[9px]">{f.band}</td>
                            <td className="p-1.5 text-end font-mono">{f.adjustment_pct >= 0 ? '+' : ''}{fmt(f.adjustment_pct, 1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                    {tr(
                      'Correction ladder: L1 (25–50% deviation) → ∓12.5% supply · L2 (>50%) → ∓32.5% supply. Direction is inverse.',
                      'سلم التصحيح: L1 (25–50%) → ∓12.5% · L2 (>50%) → ∓32.5%. الاتجاه معاكس.',
                      'Échelle: L1 (25–50%) → ∓12.5% · L2 (>50%) → ∓32.5%. Direction inverse.',
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {tr(
                    rzTab.ec <= 0 ? 'EC must be positive to compute reference values.' : 'Sodium accounts for the entire EC — cannot normalize.',
                    rzTab.ec <= 0 ? 'يجب أن يكون EC موجباً.' : 'يستهلك الصوديوم كامل EC — تعذّر التطبيع.',
                    rzTab.ec <= 0 ? 'EC doit être positif.' : 'Le sodium absorbe tout l\'EC — normalisation impossible.',
                  )}
                </p>
              )}
            </SectionCard>

            {rzTab.balance && (
              <SectionCard title={tr('Ion Balance (Formulas 1–4)', 'توازن الأيونات', 'Balance ionique')} icon={Layers} accent="amber">
                <div className="grid grid-cols-2 gap-2">
                  <CalculatorShell.MetricTile label={tr('Eq Cations', 'أ مكافئ كاتيونات', 'Éq. cations')} value={fmt(rzTab.balance.eq_cations_meq_l)} unit="meq/L" color="teal" />
                  <CalculatorShell.MetricTile label={tr('Eq Anions', 'أ مكافئ أنيونات', 'Éq. anions')} value={fmt(rzTab.balance.eq_anions_meq_l)} unit="meq/L" color="sky" />
                  <CalculatorShell.MetricTile label={tr('Difference', 'الفرق', 'Différence')} value={fmt(rzTab.balance.difference_pct)} unit="%" color={rzTab.balance.balanced ? 'emerald' : 'rose'} helper={tr(`tolerance ${rzTab.balance.tolerance_pct}%`, `السماحية ${rzTab.balance.tolerance_pct}%`, `tolérance ${rzTab.balance.tolerance_pct}%`)} />
                  <CalculatorShell.MetricTile label={tr('Calc EC', 'EC المحسوب', 'EC calculé')} value={fmt(rzTab.balance.calculated_ec_ms_cm)} unit="mS/cm" color="amber" />
                </div>
              </SectionCard>
            )}

            {rzTab.antagonism.length > 0 && (
              <SectionCard title={tr('Ion Antagonism Warnings', 'تحذيرات تنافر الأيونات', 'Antagonismes ioniques')} icon={AlertTriangle} accent="amber">
                <div className="space-y-1.5">
                  {rzTab.antagonism.map((a) => (
                    <div key={a.code} className="rounded-lg border border-amber-300 bg-amber-50/60 dark:bg-amber-950/40 p-2 text-xs">
                      <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-200">
                        <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 h-4 border-amber-400">{a.code}</Badge>
                        <span>{a.pattern}</span>
                      </div>
                      {Object.keys(a.evidence).length > 0 && (
                        <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                          {Object.entries(a.evidence).map(([k, v]) => `${k}=${fmt(v)}`).join(' · ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {rzTab.emergency && (
              <SectionCard title={tr('EMERGENCY MELTDOWN', 'حالة طوارئ', 'URGENCE CRITIQUE')} icon={ShieldAlert} accent="rose">
                <div className="rounded-lg border-2 border-rose-500 bg-rose-50 dark:bg-rose-950/50 p-3 space-y-2">
                  <div className="font-black text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {rzTab.emergency.title}
                  </div>
                  <p className="text-xs">{rzTab.emergency.reason}</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="font-mono">pH: <span className="font-bold text-rose-700 dark:text-rose-300">{fmt(rzTab.emergency.measured_ph)} / min {fmt(rzTab.emergency.limit_ph_min)}</span></div>
                    <div className="font-mono">EC: <span className="font-bold text-rose-700 dark:text-rose-300">{fmt(rzTab.emergency.measured_ec_ms_cm)} / max {fmt(rzTab.emergency.limit_ec_max)}</span></div>
                  </div>
                  <ol className="list-decimal list-inside text-[11px] space-y-0.5">
                    {rzTab.emergency.instructions.map((s) => (
                      <li key={s.step}>{s.action}</li>
                    ))}
                  </ol>
                </div>
              </SectionCard>
            )}
          </CalculatorShell.Results>
        </>
      )}

      {/* ===== TAB 4: Irrigation & Leaching ===== */}
      {tab === 'irrigation' && (
        <>
          <CalculatorShell.Inputs>
            <SectionCard title={tr('Irrigation Volumes', 'حجوم الري', 'Volumes d\'irrigation')} icon={Waves}>
              <div className="grid grid-cols-2 gap-2">
                <CalculatorShell.InputField label={tr('V irrigation', 'حجم الري', 'V irrigation')} value={vIrr} onChange={setVIrr} step="0.1" helper="L/m²/day" />
                <CalculatorShell.InputField label={tr('V drain', 'حجم التصريف', 'V drain')} value={vDrain} onChange={setVDrain} step="0.1" helper="L/m²/day" />
                <CalculatorShell.InputField label={tr('EC dripper', 'EC النقاط', 'EC goutte')} value={ecDripper} onChange={setEcDripper} step="0.1" helper="mS/cm" />
                <CalculatorShell.InputField label={tr('EC drain', 'EC التصريف', 'EC drain')} value={ecDrain} onChange={setEcDrain} step="0.1" helper="mS/cm" />
              </div>
              <div className="mt-2 p-2.5 rounded-lg bg-muted/40 border text-[10px] text-muted-foreground leading-relaxed">
                {tr(
                  'Wash trigger: ΔEC ≥ 2.0 mS/cm. Standard target LF 32.5%. MODERATE band 30–40%. ANOMALY ≥ 40% with persistent ΔEC — do NOT add water.',
                  'تشغيل الغسيل: فرق EC ≥ 2.0. الهدف القياسي 32.5%. النطاق المعتدل 30–40%. الحالة الشاذة ≥ 40% مع فرق EC مستمر — لا تضف ماءً.',
                  'Déclenchement: ΔEC ≥ 2.0. Cible standard 32.5%. Modéré 30–40%. Anomalie ≥ 40% avec ΔEC persistant — ne pas ajouter d\'eau.',
                )}
              </div>
            </SectionCard>
          </CalculatorShell.Inputs>

          <CalculatorShell.Results>
            <SectionCard title={tr('Leaching Fraction & Wash', 'نسبة التصريف والغسيل', 'LF & lavage')} icon={Waves} accent="teal">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <CalculatorShell.MetricTile
                  label={tr('Leaching Fraction', 'نسبة التصريف', 'Fraction lessivage')}
                  value={fmt(irrTab.lfPct, 1)}
                  unit="%"
                  color={irrTab.lfPct < 10 ? 'amber' : irrTab.lfPct > 40 ? 'rose' : 'emerald'}
                />
                <CalculatorShell.MetricTile
                  label={tr('ΔEC (drain−drip)', 'فرق EC', 'ΔEC')}
                  value={fmt(irrTab.deltaEc)}
                  unit="mS/cm"
                  color={irrTab.washTriggered ? 'rose' : 'emerald'}
                />
                <CalculatorShell.MetricTile
                  label={tr('Wash Trigger', 'تشغيل الغسيل', 'Lavage')}
                  value={irrTab.washTriggered ? 'TRIGGERED' : 'OK'}
                  color={irrTab.washTriggered ? 'rose' : 'emerald'}
                />
                <CalculatorShell.MetricTile
                  label={tr('Target LF', 'الهدف LF', 'LF cible')}
                  value={fmt(irrTab.targetLf, 1)}
                  unit="%"
                  color="sky"
                  helper={tr(`Case: ${irrTab.washCase}`, `الحالة: ${irrTab.washCase}`, `Cas: ${irrTab.washCase}`)}
                />
                <CalculatorShell.MetricTile
                  label={tr('Extra Irrigation', 'ري إضافي', 'Irrigation suppl.')}
                  value={fmt(irrTab.extraIrr)}
                  unit="L/m²"
                  color={irrTab.isAnomaly ? 'rose' : 'amber'}
                  helper={irrTab.isAnomaly ? tr('Anomaly — no add', 'شذوذ — لا تضف', 'Anomalie — non') : undefined}
                />
                <CalculatorShell.MetricTile
                  label={tr('Target Volume', 'الحجم المستهدف', 'Volume cible')}
                  value={fmt(irrTab.leachResult?.target_irrigation_l_m2)}
                  unit="L/m²/d"
                  color="teal"
                />
              </div>

              {irrTab.leachResult && (
                <div className="mt-2 grid grid-cols-2 gap-x-3 text-xs">
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{tr('Water Balance', 'ميزان المياه', 'Bilan eau')}</div>
                    <KV k={tr('Uptake', 'الامتصاص', 'Absorption')} v={fmt(irrTab.leachResult.uptake_l_m2)} unit="L/m²" />
                    <KV k={tr('Drain', 'التصريف', 'Drain')} v={fmt(irrTab.leachResult.drain_l_m2)} unit="L/m²" />
                    <KV k={tr('Used irrigation', 'الري المستخدم', 'Irr. utilisée')} v={fmt(irrTab.leachResult.used_irrigation_l_m2)} unit="L/m²" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{tr('Wash Case', 'حالة الغسيل', 'Cas lavage')}</div>
                    <KV k="Case" v={irrTab.washCase} />
                    <KV k={tr('Band', 'النطاق', 'Bande')} v={irrTab.leachResult.band} />
                    <KV k={tr('Anomaly', 'شذوذ', 'Anomalie')} v={irrTab.isAnomaly ? 'YES' : 'NO'} />
                  </div>
                </div>
              )}

              <div className="mt-3">
                <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{tr('Wash Tier', 'طبقة الغسيل', 'Niveau lavage')}</div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div className={cn('rounded-lg border p-2 text-center text-[10px]', irrTab.washCase === 'STANDARD' ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40' : 'border-border bg-muted/30')}>
                    <div className="font-bold">STANDARD</div>
                    <div className="text-muted-foreground">LF &lt; 30% → 32.5%</div>
                  </div>
                  <div className={cn('rounded-lg border p-2 text-center text-[10px]', irrTab.washCase === 'MODERATE' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40' : 'border-border bg-muted/30')}>
                    <div className="font-bold">MODERATE</div>
                    <div className="text-muted-foreground">30–40% → +10pp</div>
                  </div>
                  <div className={cn('rounded-lg border p-2 text-center text-[10px]', irrTab.washCase === 'ANOMALY' ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : 'border-border bg-muted/30')}>
                    <div className="font-bold">ANOMALY</div>
                    <div className="text-muted-foreground">≥ 40% — no add</div>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title={tr('Leaching Safety Gates', 'بوابات الأمان', 'Portes de sécurité')} icon={ShieldAlert} accent="rose">
              <GateList gates={irrTab.leachGates} />
            </SectionCard>
          </CalculatorShell.Results>
        </>
      )}

      {/* ===== TAB 5: A/B Stock Tank Dosing ===== */}
      {tab === 'tanks' && (
        <>
          <CalculatorShell.Inputs>
            <SectionCard title={tr('Pipeline (7 Steps)', 'خط المعالجة', 'Pipeline')} icon={Layers}>
              <ol className="space-y-1.5 text-xs">
                {[
                  tr('Stage adjustment (M5)', 'تعديل المرحلة', 'Ajustement stade'),
                  tr('Feedback correction (M4)', 'تصحيح التغذية الراجعة', 'Correction retour'),
                  tr('Acid demand (M1b)', 'طلب الحمض', 'Demande acide'),
                  tr('Scale to target EC (M7)', 'التحجيم إلى EC', 'Mise à l\'échelle EC'),
                  tr('Deduct base water (M7)', 'خصم الماء الأساسي', 'Déduction eau de base'),
                  tr('Deduct drain nutrients (M7)', 'خصم العناصر المغذية بالتصريف', 'Déduction drain'),
                  tr('Allocate fertilisers (M7) → A/B split (M6)', 'توزيع الأسمدة → تقسيم A/B', 'Allocation → cuves A/B'),
                ].map((label, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="flex-none w-5 h-5 rounded-full bg-teal-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="leading-snug">{label}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-2 p-2 rounded-lg bg-muted/40 border text-[10px] text-muted-foreground">
                {tr(
                  `Crop: ${WUR_CROPS[cropId]?.name_en ?? cropId} (${substrate}) · Stage: ${stage}${highWater ? ' + high water' : ''}`,
                  `المحصول: ${WUR_CROPS[cropId]?.name_en ?? cropId} (${substrate}) · المرحلة: ${stage}${highWater ? ' + ماء عالي' : ''}`,
                  `Culture: ${WUR_CROPS[cropId]?.name_en ?? cropId} (${substrate}) · Stade: ${stage}${highWater ? ' + eau élevée' : ''}`,
                )}
              </div>
            </SectionCard>

            {recipeTab && (
              <SectionCard title={tr('Final Recipe', 'الوصفة النهائية', 'Recette finale')} icon={FlaskConical} accent="emerald">
                <div className="grid grid-cols-2 gap-x-3 text-xs">
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{tr('Macro (mmol/L)', 'العناصر الكبرى', 'Macro')}</div>
                    {['NH4', 'K', 'Ca', 'Mg', 'NO3', 'Cl', 'S', 'P'].map((ion) => {
                      const v = recipeTab.macro[ion];
                      if (v === undefined) return null;
                      return <KV key={ion} k={ion} v={fmt(v)} />;
                    })}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{tr('Micro (µmol/L)', 'العناصر الصغرى', 'Micro')}</div>
                    {['Fe', 'Mn', 'Zn', 'B', 'Cu', 'Mo'].map((ion) => {
                      const v = recipeTab.micro[ion];
                      if (v === undefined) return null;
                      return <KV key={ion} k={ion} v={fmt(v)} />;
                    })}
                  </div>
                </div>
                {recipeTab.scaling_factors && (
                  <div className="mt-2 pt-2 border-t grid grid-cols-2 gap-2 text-[10px]">
                    <KV k={tr('f (cations)', 'عامل الكاتيونات', 'f cations')} v={fmt(recipeTab.scaling_factors.f_cations, 4)} />
                    <KV k={tr('f (anions)', 'عامل الأنيونات', 'f anions')} v={fmt(recipeTab.scaling_factors.f_anions, 4)} />
                  </div>
                )}
                {recipeTab.balance_report && (
                  <div className="mt-2 pt-2 border-t">
                    <KV k={tr('Ion balance', 'توازن الأيونات', 'Balance')} v={recipeTab.balance_report.balanced_text.split(' (')[0]} />
                    <KV k={tr('Calc EC', 'EC المحسوب', 'EC calc')} v={fmt(recipeTab.balance_report.calculated_ec_ms_cm)} unit="mS/cm" />
                  </div>
                )}
              </SectionCard>
            )}
          </CalculatorShell.Inputs>

          <CalculatorShell.Results>
            {!recipeTab ? (
              <SectionCard title={tr('No Recipe', 'لا توجد وصفة', 'Pas de recette')} icon={AlertTriangle} accent="rose">
                <p className="text-xs text-muted-foreground">
                  {tr(
                    'Recipe computation failed — check that a crop matrix is selected and inputs are valid.',
                    'فشل حساب الوصفة — تحقق من اختيار مصفوفة المحصول وصحة المدخلات.',
                    'Échec du calcul — vérifiez la matrice de culture et les entrées.',
                  )}
                </p>
              </SectionCard>
            ) : (
              <>
                <SectionCard title={tr('A/B Stock Tank Split', 'تقسيم خزان A/B', 'Séparation cuves A/B')} icon={Beaker} accent="teal">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <CalculatorShell.MetricTile
                      label={tr('Tank A total', 'إجمالي A', 'Cuve A total')}
                      value={fmt(recipeTab.tank_split.mass_a_kg)}
                      unit="kg"
                      color="emerald"
                      helper={`${recipeTab.tank_split.tank_a.length} ${tr('ferts', 'أسمدة', 'produits')}`}
                    />
                    <CalculatorShell.MetricTile
                      label={tr('Tank B total', 'إجمالي B', 'Cuve B total')}
                      value={fmt(recipeTab.tank_split.mass_b_kg)}
                      unit="kg"
                      color="teal"
                      helper={`${recipeTab.tank_split.tank_b.length} ${tr('ferts', 'أسمدة', 'produits')}`}
                    />
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto pe-1">
                    <div>
                      <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase mb-1">{tr('Tank A', 'الخزان A', 'Cuve A')} ({fmt(recipeTab.tank_split.mass_a_kg)} kg)</div>
                      <div className="space-y-1">
                        {recipeTab.tank_split.tank_a.map((d, i) => (
                          <div key={`${d.fert.fid}-${i}`} className="flex justify-between items-baseline text-[11px] border-b border-dashed border-border/60 py-0.5">
                            <span className="font-medium">{d.fert.name_en}</span>
                            <span className="font-mono">
                              <span className="font-bold">{fmt(d.mass_kg)}</span>
                              <span className="text-muted-foreground"> kg</span>
                              {d.volume_l !== null && (
                                <span className="text-muted-foreground"> · {fmt(d.volume_l)} L</span>
                              )}
                              {d.is_micro && (
                                <span className="text-[9px] text-amber-600 ms-1">µ{fmt(d.amount_mmol_l)}</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-teal-700 dark:text-teal-300 uppercase mb-1">{tr('Tank B', 'الخزان B', 'Cuve B')} ({fmt(recipeTab.tank_split.mass_b_kg)} kg)</div>
                      <div className="space-y-1">
                        {recipeTab.tank_split.tank_b.map((d, i) => (
                          <div key={`${d.fert.fid}-${i}`} className="flex justify-between items-baseline text-[11px] border-b border-dashed border-border/60 py-0.5">
                            <span className="font-medium">{d.fert.name_en}</span>
                            <span className="font-mono">
                              <span className="font-bold">{fmt(d.mass_kg)}</span>
                              <span className="text-muted-foreground"> kg</span>
                              {d.volume_l !== null && (
                                <span className="text-muted-foreground"> · {fmt(d.volume_l)} L</span>
                              )}
                              {d.is_micro && (
                                <span className="text-[9px] text-amber-600 ms-1">µ{fmt(d.amount_mmol_l)}</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {recipeTab.fe_chelate_plan && (
                  <SectionCard title={tr('Fe Chelate Selection', 'اختيار مخلبات الحديد', 'Sélection chélate Fe')} icon={FlaskConical} accent="amber">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-[10px] font-mono border-amber-400">
                          {recipeTab.fe_chelate_plan.primary_fid} ({fmt(recipeTab.fe_chelate_plan.primary_share * 100, 0)}%)
                        </Badge>
                        {recipeTab.fe_chelate_plan.secondary_fid && (
                          <Badge variant="outline" className="text-[10px] font-mono border-amber-400">
                            {recipeTab.fe_chelate_plan.secondary_fid} ({fmt(recipeTab.fe_chelate_plan.secondary_share * 100, 0)}%)
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{recipeTab.fe_chelate_plan.reason_en}</p>
                      {recipeTab.fe_chelate_plan.require_ortho_ortho && (
                        <div className="text-[10px] text-amber-700 dark:text-amber-300 flex items-center gap-1">
                          <ChevronDown className="h-3 w-3" />
                          {tr('Requires ortho-ortho isomer', 'يتطلب أيزومر ortho-ortho', 'Isomère ortho-ortho requis')}
                        </div>
                      )}
                    </div>
                  </SectionCard>
                )}

                <SectionCard title={tr('Tank Separation & pH Gates', 'بوابات الفصل و pH', 'Portes séparation & pH')} icon={ShieldAlert} accent="rose">
                  <GateList gates={recipeTab.tank_split.gates} />
                  <div className="mt-2">
                    <GateList gates={recipeTab.gates.filter((g) => !recipeTab.tank_split.gates.some((tg) => tg.gid === g.gid))} />
                  </div>
                </SectionCard>
              </>
            )}
          </CalculatorShell.Results>
        </>
      )}
    </CalculatorShell>
  );
}
