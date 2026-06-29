'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search, X, Sparkles, ArrowRight, Info, BookOpen, Lightbulb, HelpCircle,
  Calculator, FlaskConical, Ruler, Droplets, Waves, Thermometer,
  Tractor, Package, Atom, BarChart3, Grid3x3, Beaker, Globe2,
  Sprout, Mountain, CloudRain, TableProperties, Network,
  Star, Clock, Columns2, Check,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

import { ConversionCalculator } from './ConversionCalculator';
import { NutrientUnitsConverter } from './NutrientUnitsConverter';
import { MeasureUnitsConverter } from './MeasureUnitsConverter';
import { HydroSolutionDesigner } from './HydroSolutionDesigner';
import { WaterHardnessDiagnostic } from './WaterHardnessDiagnostic';
import { VpdEstimator } from './VpdEstimator';
import { AmendmentBalanceCec } from './AmendmentBalanceCec';
import { GranularMixFormulation } from './GranularMixFormulation';
import { FertilizerComposition } from './FertilizerComposition';
import { NutrientDistributionByStage } from './NutrientDistributionByStage';
import { PeriodicTableNutrients } from './PeriodicTableNutrients';
import { FertilizerCompatibility } from './FertilizerCompatibility';
import { NutrientInteractions } from './NutrientInteractions';
import { MineralizableNEstimator } from './MineralizableNEstimator';
import { SoilWaterTexture } from './SoilWaterTexture';
import { IrrigationBalance } from './IrrigationBalance';
import { SolubilitySaltIndex } from './SolubilitySaltIndex';
import { FertilizerCarbonFootprint } from './FertilizerCarbonFootprint';
import { WhyItMattersPanel } from './WhyItMattersPanel';
import { WHY_IT_MATTERS } from '@/lib/why-it-matters-data';
import { ToolExportBar, EXPORT_COPY_EVENT } from './ToolExportBar';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { CompareDialog } from './CompareDialog';
import { SeasonPlanGenerator } from './SeasonPlanGenerator';

type ToolCategory = 'Converters' | 'Solution & Water' | 'Fertilizers' | 'Soil & Irrigation' | 'Reference';

export interface ToolMeta {
  id: string;
  name: string;
  description: string;
  /** Short one-line benefit the user gains from this tool. */
  benefit: string;
  /** 2-3 short steps describing how to use the tool. */
  howToUse: string[];
  category: ToolCategory;
  icon: React.ComponentType<{ className?: string }>;
  Component: React.ComponentType;
}

const TOOLS: ToolMeta[] = [
  // Converters
  {
    id: 'oxide-conversion',
    name: 'Oxide ↔ Elemental Converter',
    description: 'Bidirectional CaO↔Ca, K₂O↔K, P₂O₅↔P, etc. (30+ pairs).',
    benefit: 'Avoids lab-vs-label confusion when comparing soil tests (oxide form) with fertilizer guarantees (elemental form).',
    howToUse: [
      'Type a value into either the oxide or elemental field.',
      'The opposite field updates instantly with the converted value.',
      'Use "Clear all" to reset every row at once.',
    ],
    category: 'Converters', icon: Calculator, Component: ConversionCalculator,
  },
  {
    id: 'nutrient-units',
    name: 'Nutrient Units Converter',
    description: 'ppm ↔ mmol ↔ meq/L for 22 nutrients and ions.',
    benefit: 'Reconciles hydroponic recipes (meq/L) with lab reports (ppm) and scientific literature (mmol/L) in one click.',
    howToUse: [
      'Pick any nutrient row.',
      'Type into ppm, mmol (or µmol for micros), or meq/L — the other two update live.',
      'Equivalent weights and valences are pre-loaded, so conversions are exact.',
    ],
    category: 'Converters', icon: FlaskConical, Component: NutrientUnitsConverter,
  },
  {
    id: 'measure-units',
    name: 'Physical Units Converter',
    description: 'Length, area, volume, mass, temperature, pressure, concentration, ionic.',
    benefit: 'A single converter for the eight physical magnitudes agronomists juggle daily — no more tab-hopping between unit sites.',
    howToUse: [
      'Choose a category (length, area, temperature, ionic, etc.).',
      'Enter the value, pick the source and target units.',
      'Result appears instantly; soil↔solution ionic mismatches are flagged.',
    ],
    category: 'Converters', icon: Ruler, Component: MeasureUnitsConverter,
  },

  // Solution & Water
  {
    id: 'hydro-solution',
    name: 'Hydroponic Solution Designer',
    description: 'Design a nutrient solution via meq/L, ppm, CE, and an anion ternary diagram.',
    benefit: 'Visualises the ionic balance of a hydroponic formula against the Steiner equilibrium zone — spot K/Ca/Mg imbalance before mixing.',
    howToUse: [
      'Edit meq/L for the 8 ions (or use a preset like Steiner / Hoagland).',
      'CE and ppm update automatically; the ternary diagram shows your anion split.',
      'Compare your % distribution against the green equilibrium polygon.',
    ],
    category: 'Solution & Water', icon: Droplets, Component: HydroSolutionDesigner,
  },
  {
    id: 'water-hardness',
    name: 'Water Hardness Diagnostic',
    description: 'Hardness units, Ca+Mg hardness, and acid dose for HCO₃⁻/CO₃²⁻ neutralization.',
    benefit: 'Tells you exactly how much nitric/sulfuric/phosphoric acid to add per m³ to drop HCO₃⁻ to a safe residual — protecting drip emitters and pH stability.',
    howToUse: [
      'Section 1: type any hardness unit; all 5 units + classification update.',
      'Section 2: enter lab Ca and Mg to compute total hardness as CaCO₃.',
      'Section 3: enter HCO₃⁻/CO₃²⁻, residual target, water volume, and acid choice — dose appears.',
    ],
    category: 'Solution & Water', icon: Waves, Component: WaterHardnessDiagnostic,
  },
  {
    id: 'vpd',
    name: 'VPD Estimator',
    description: 'Vapor Pressure Deficit (kPa) and Humidity Deficit (g/m³) from temperature & humidity.',
    benefit: 'Quantifies the real "thirst" of the air — the number that drives transpiration, Ca transport, and stress in greenhouses.',
    howToUse: [
      'Enter air temperature and relative humidity.',
      'Pick leaf-temperature mode (you measured it) or solar-radiation mode (estimated).',
      'Read VPD (kPa) + humidity deficit (g/m³) + status (Low / Optimal / High).',
    ],
    category: 'Solution & Water', icon: Thermometer, Component: VpdEstimator,
  },

  // Fertilizers
  {
    id: 'amendment-balance',
    name: 'Amendment Balance by CEC',
    description: 'Soil cation analysis → amendment doses (gypsum, lime, dolomite, SOP, MgSO₄).',
    benefit: 'Translates a soil-test cation profile into kg/ha of gypsum/lime/dolomite/SOP — closes the gap between lab report and field application.',
    howToUse: [
      'Enter the 6 exchangeable cations (K, Ca, Mg, H, Na, Al) in meq/100g.',
      'Set bulk density, depth, pH, and root-reach %.',
      'Read the recommended amendment strategy with doses already adjusted by root-reach factor.',
    ],
    category: 'Fertilizers', icon: Tractor, Component: AmendmentBalanceCec,
  },
  {
    id: 'granular-mix',
    name: 'Granular Mix Formulation',
    description: 'Build a granular blend from 24 fertilizers → NPK analysis and kg/ha.',
    benefit: 'Previews the NPK + secondary + micro analysis of a custom blend before you commit tonnes — and computes kg/ha of every nutrient at your application rate.',
    howToUse: [
      'Add fertilizers from the 24-product library and enter each one\'s % by tonne.',
      'Set the blend dose (kg/ha).',
      'Read the live blend analysis, NPK ratio, and per-nutrient kg/ha.',
    ],
    category: 'Fertilizers', icon: Package, Component: GranularMixFormulation,
  },
  {
    id: 'fertilizer-composition',
    name: 'Fertilizer Composition (%)',
    description: 'Parse a chemical formula → elemental %, oxide equivalents, MW, N partition.',
    benefit: 'Type any chemical formula (e.g. Ca(NO₃)₂·4H₂O) and instantly see elemental %, oxide equivalents, N-NO₃/N-NH₄ split, and molecular weight — no lookup tables.',
    howToUse: [
      'Type a formula (supports hydrates ·, double salts +, parentheses, unicode subscripts).',
      'Click Calculate (or press Enter).',
      'Read elemental %, oxide %, NPK tag, and MW; click any example chip to try one.',
    ],
    category: 'Fertilizers', icon: Atom, Component: FertilizerComposition,
  },
  {
    id: 'nutrient-distribution',
    name: 'Nutrient Distribution by Stage',
    description: 'Distribute nutrient extraction (kg/ha) across phenological stages with chart.',
    benefit: 'Matches supply to crop demand week-by-week — prevents both mid-cycle deficiency and end-of-season luxury consumption.',
    howToUse: [
      'Set total seasonal extraction (kg/ha) per nutrient.',
      'Adjust the % split across phenological stages (or use defaults).',
      'Read kg/ha per stage per nutrient on the chart and table.',
    ],
    category: 'Fertilizers', icon: BarChart3, Component: NutrientDistributionByStage,
  },
  {
    id: 'fertilizer-compatibility',
    name: 'Fertilizer Compatibility Matrix',
    description: '32×32 lower-triangular matrix of compatibility (C/R/I) for fertigation.',
    benefit: 'Prevents the #1 fertigation mistake — co-dissolving Ca²⁺ with sulfates or phosphates — by showing exactly which pairs precipitate before you mix the tank.',
    howToUse: [
      'Filter the matrix by fertilizer name if needed.',
      'Click any cell to see the chemistry explanation and recommended action.',
      'Green C = compatible · Yellow R = caution · Red I = never in the same stock tank.',
    ],
    category: 'Fertilizers', icon: Grid3x3, Component: FertilizerCompatibility,
  },
  {
    id: 'solubility-salt-index',
    name: 'Solubility & Salt Index',
    description: 'Sortable, filterable table of solubility (g/L) and salt index (NaNO₃=100).',
    benefit: 'Tells you which fertilizers will dissolve in cold stock tanks and which will burn roots — solubility for tank design, salt index for placement safety.',
    howToUse: [
      'Use the search box to filter by name or formula.',
      'Click any column header to sort (default: salt index descending).',
      'Coloured dots classify solubility as High / Medium / Low at a glance.',
    ],
    category: 'Fertilizers', icon: Beaker, Component: SolubilitySaltIndex,
  },
  {
    id: 'fertilizer-carbon',
    name: 'Fertilizer Carbon Footprint',
    description: 'Compare two fertilization programs by manufacturing + transport + N₂O emissions.',
    benefit: 'Quantifies the kg CO₂e/ha difference between Program A and Program B — turns "sustainable" from a slogan into a number you can defend.',
    howToUse: [
      'In each scenario, add up to 5 fertilizers with rate (kg/ha) and transport legs.',
      'Read per-row emissions split into manufacturing, transport, and field N₂O.',
      'Compare totals — the bar shows which program is lower and by how many kg CO₂e/ha.',
    ],
    category: 'Fertilizers', icon: Globe2, Component: FertilizerCarbonFootprint,
  },

  // Soil & Irrigation
  {
    id: 'n-mineralizable',
    name: 'Mineralizable N Estimation',
    description: 'Annual N release (kg N/ha/yr) from soil organic matter with T_min presets.',
    benefit: 'Estimates how much "free" nitrogen your soil will release this season — so you can subtract it from the fertilizer budget and avoid over-application.',
    howToUse: [
      'Enter organic matter %, bulk density, depth, and root-reach %.',
      'Pick a mineralization rate T_min preset (1 % conservative · 2 % medium · 3 % high).',
      'Read annual mineralizable N in kg/ha/yr — orientative, validate in field.',
    ],
    category: 'Soil & Irrigation', icon: Sprout, Component: MineralizableNEstimator,
  },
  {
    id: 'soil-water-texture',
    name: 'Soil Water & Texture (USDA)',
    description: 'USDA texture triangle + available water and irrigation-to-CC calculator.',
    benefit: 'Classifies your soil texture from clay/silt/sand % and computes how much water is available between permanent wilting point and field capacity.',
    howToUse: [
      'Enter any two of clay / silt / sand % — the third auto-balances.',
      'The USDA triangle highlights your texture class.',
      'Set CC, PMP, depth, bulk density, area, and root efficiency to get available water (m³) and irrigation sheet to CC (mm).',
    ],
    category: 'Soil & Irrigation', icon: Mountain, Component: SoilWaterTexture,
  },
  {
    id: 'irrigation-balance',
    name: 'Irrigation Sheet & Water Balance',
    description: 'FAO-56 ETc = Kc × ETo, deficit/surplus, m³ conversions for 1 or 7 day periods.',
    benefit: 'Replaces guesswork with FAO-56 — knows exactly how much water your crop used (ETc) and whether your irrigation + rain covered it.',
    howToUse: [
      'Enter ETo (mm) and Kc for your crop and stage; toggle 1-day or 7-day period.',
      'Enter rain (mm) and applied irrigation (m³) on the irrigated area.',
      'Read ETc, irrigation mm, balance (deficit/surplus), and total volume needed (m³).',
    ],
    category: 'Soil & Irrigation', icon: CloudRain, Component: IrrigationBalance,
  },

  // Reference
  {
    id: 'periodic-table',
    name: 'Periodic Table of Plant Nutrients',
    description: 'Interactive 118-element table with agronomic roles + molecular weight calc.',
    benefit: 'One screen for "which elements are essential / beneficial / structural" plus a molecular-weight calculator — useful for teaching and for quick MW lookups.',
    howToUse: [
      'Click any element to see atomic weight, valence, electronegativity, and agronomic role.',
      'Switch to the Mol-weight tab and type a formula (e.g. KNO₃) to compute MW and elemental %.',
      'Use the "Use in molecular calculator" button to push an element into the formula.',
    ],
    category: 'Reference', icon: TableProperties, Component: PeriodicTableNutrients,
  },
  {
    id: 'nutrient-interactions',
    name: 'Nutrient Interactions & Mobility',
    description: 'Mulder diagram, root-arrival mechanisms, mobility, and pH availability curves.',
    benefit: 'A 4-in-1 reference that explains why high P locks up Zn, why K⁺ competes with Mg²⁺, and how pH moves each nutrient\'s availability — supports diagnosis, not just data.',
    howToUse: [
      'Mulder tab: click any ion to highlight its antagonists (red) and synergists (blue).',
      'Root-arrival tab: click a row to see how each nutrient reaches the root.',
      'Mobility tab: click an element pill for symptom location + functions + tip.',
      'pH tab: click any nutrient to read why availability changes with pH.',
    ],
    category: 'Reference', icon: Network, Component: NutrientInteractions,
  },
];

const CATEGORIES: ToolCategory[] = ['Converters', 'Solution & Water', 'Fertilizers', 'Soil & Irrigation', 'Reference'];

export const CATEGORY_COLORS: Record<ToolCategory, string> = {
  'Converters':         'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-900',
  'Solution & Water':   'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-900',
  'Fertilizers':        'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-900',
  'Soil & Irrigation':  'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-900',
  'Reference':          'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-900',
};

export const CATEGORY_DOT_COLORS: Record<ToolCategory, string> = {
  'Converters':         '#3b82f6',
  'Solution & Water':   '#0891b2',
  'Fertilizers':        '#16a34a',
  'Soil & Irrigation':  '#d97706',
  'Reference':          '#7c3aed',
};

export function FreeToolsSection() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'All'>('All');
  const [openTool, setOpenTool] = useState<ToolMeta | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [seasonPlanOpen, setSeasonPlanOpen] = useState(false);

  // Comparison tray — holds up to 2 tool IDs for side-by-side comparison.
  // Persists across tool-dialog opens/closes but not across page reloads (v1).
  const [compareTray, setCompareTray] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  // Ref to the search input — focused by the Ctrl+K / Cmd+K shortcut.
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Favorites + Recently used (localStorage-persisted)
  const FAV_KEY = 'nutriplant_tools_favorites_v1';
  const REC_KEY = 'nutriplant_tools_recent_v1';
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  // Load persisted favorites + recent on mount; also handle #tool=<id> hash for shareable URLs
  useEffect(() => {
    try {
      const fav = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
      const rec = JSON.parse(localStorage.getItem(REC_KEY) || '[]');
      if (Array.isArray(fav)) setFavorites(fav);
      if (Array.isArray(rec)) setRecent(rec);
    } catch { /* corrupt localStorage — ignore */ }
    // Open tool from URL hash (#tool=<id>) on initial load — supports shared URLs
    if (typeof window !== 'undefined') {
      const m = window.location.hash.match(/#tool=([\w-]+)/);
      if (m) {
        const t = TOOLS.find(x => x.id === m[1]);
        if (t) {
          setOpenTool(t);
          setRecent(prev => [t.id, ...prev.filter(id => id !== t.id)].slice(0, 5));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist favorites
  useEffect(() => {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(favorites)); } catch { /* storage full or blocked */ }
  }, [favorites]);

  // Persist recent
  useEffect(() => {
    try { localStorage.setItem(REC_KEY, JSON.stringify(recent)); } catch { /* storage full or blocked */ }
  }, [recent]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const addRecent = useCallback((id: string) => {
    setRecent(prev => [id, ...prev.filter(x => x !== id)].slice(0, 5));
  }, []);

  const openToolById = useCallback((id: string) => {
    const t = TOOLS.find(x => x.id === id);
    if (!t) return;
    setOpenTool(t);
    addRecent(id);
  }, [addRecent]);

  // Toggle a tool in/out of the comparison tray (max 2). When the tray is full
  // and the tool isn't already in it, show a toast and bail.
  const toggleCompare = useCallback((id: string) => {
    setCompareTray(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 2) {
        toast({
          title: 'Comparison tray is full (max 2)',
          description: 'Clear it first to add a different tool.',
        });
        return prev;
      }
      return [...prev, id];
    });
  }, []);

  const clearCompareTray = useCallback(() => {
    setCompareTray([]);
    setCompareOpen(false);
  }, []);

  // Resolve the two tools currently in the tray (in tray order, not TOOLS order).
  const compareTools = useMemo(
    () => compareTray.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) as ToolMeta[],
    [compareTray],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return TOOLS.filter(t => {
      if (activeCategory !== 'All' && t.category !== activeCategory) return false;
      if (!q) return true;
      return (t.name + ' ' + t.description + ' ' + t.benefit + ' ' + t.category).toLowerCase().includes(q);
    });
  }, [search, activeCategory]);

  // Group filtered tools by category for the landscape grid
  const grouped = useMemo(() => {
    return CATEGORIES.map(c => ({
      category: c,
      tools: filtered.filter(t => t.category === c),
    })).filter(g => g.tools.length > 0);
  }, [filtered]);

  // Global keyboard shortcuts — registered on window. See KeyboardShortcutsHelp
  // for the user-facing list. The handler is re-bound whenever any of its
  // dependencies change so the closures always see fresh state.
  useEffect(() => {
    const isTypingTarget = (el: Element | null) => {
      if (!el) return false;
      if (el instanceof HTMLInputElement) return true;
      if (el instanceof HTMLTextAreaElement) return true;
      if ((el as HTMLElement).isContentEditable) return true;
      return false;
    };

    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      // Ctrl+K / Cmd+K — focus the search input (always, even while typing elsewhere)
      if (mod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // Esc — if a dialog is open, let Radix handle it; otherwise clear search.
      if (e.key === 'Escape') {
        if (openTool || compareOpen) return; // Radix closes the dialog
        if (search) {
          setSearch('');
          searchInputRef.current?.focus();
        }
        return;
      }

      // From here on, don't trigger when the user is typing in an input/textarea.
      if (isTypingTarget(document.activeElement)) return;

      // Ctrl+S / Cmd+S — save-preset placeholder toast (only if a tool dialog is open)
      if (mod && (e.key === 's' || e.key === 'S')) {
        if (openTool) {
          e.preventDefault();
          toast({
            title: 'Save preset',
            description: "Copy this tool's inputs to your notes (full preset persistence coming soon).",
          });
        }
        return;
      }

      // Ctrl+E / Cmd+E — trigger the export bar's Copy action (only if a tool dialog is open)
      if (mod && (e.key === 'e' || e.key === 'E')) {
        if (openTool) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent(EXPORT_COPY_EVENT));
          toast({ title: 'Results copied to clipboard' });
        }
        return;
      }

      // Number keys 1-9 — open the Nth visible tool (no dialog open, search not focused)
      if (!openTool && !compareOpen && /^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const t = filtered[idx];
        if (t) {
          e.preventDefault();
          setOpenTool(t);
          addRecent(t.id);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openTool, compareOpen, search, filtered, addRecent]);

  return (
    <section className="space-y-5">
      {/* Hero header */}
      <div className="rounded-xl p-5 sm:p-6 bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800 text-white">
        <div className="flex items-center gap-2 mb-2 text-emerald-100 text-xs font-medium uppercase tracking-wide">
          <Sparkles className="h-3.5 w-3.5" /> 18 Free Agronomic Tools
        </div>
        <h2 className="text-xl sm:text-2xl font-bold leading-tight mb-1">NutriPlant PRO Free Tools</h2>
        <p className="text-sm text-emerald-100/90 max-w-2xl">
          A native reimplementation of NutriPlant PRO's public free-tools collection —
          converters, solution & water diagnostics, fertilizer calculators, soil & irrigation
          tools, and quick-reference matrices. All calculations run client-side; nothing is sent to a server.
        </p>
        <div className="flex flex-wrap gap-3 mt-3 text-xs">
          {CATEGORIES.map(c => {
            const count = TOOLS.filter(t => t.category === c).length;
            return (
              <div key={c} className="bg-white/10 backdrop-blur rounded px-2 py-1 border border-white/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: CATEGORY_DOT_COLORS[c] }} />
                <span className="text-emerald-100">{c}</span> <span className="font-bold ml-0.5">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Introduction panel — What / How / Why */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <IntroCard
          icon={Info}
          color="#0891b2"
          title="What these tools are"
          body="A curated set of 18 calculators and reference tables covering the day-to-day workflow of agronomists, growers, and consultants: unit conversions, water & nutrient solution diagnostics, fertilizer formulation, soil & irrigation planning, and crop-nutrition reference data."
        />
        <IntroCard
          icon={BookOpen}
          color="#16a34a"
          title="How to use them"
          body="Browse the cards below, filter by category, or search by name. Click any card to open the tool in a dialog — enter your inputs and the result updates live. Each tool's dialog also shows a short benefit and step-by-step usage hint."
        />
        <IntroCard
          icon={Lightbulb}
          color="#d97706"
          title="Why use them"
          body="They replace guesswork with calculation: precise acid doses, exact NPK blends, FAO-56 irrigation sheets, CEC-based amendment plans, and fertilization carbon footprints — turning lab reports and field observations into defensible decisions."
        />
      </div>

      {/* Search & filter */}
      <div className="sticky top-[120px] z-20 bg-background/95 backdrop-blur rounded-lg border border-border p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchInputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tools by name, description, or benefit... (Ctrl+K)"
              className="pl-9 pr-8 h-10"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            <CategoryChip active={activeCategory === 'All'} onClick={() => setActiveCategory('All')} label="All" count={TOOLS.length} />
            {CATEGORIES.map(c => (
              <CategoryChip
                key={c}
                active={activeCategory === c}
                onClick={() => setActiveCategory(c)}
                label={c}
                count={TOOLS.filter(t => t.category === c).length}
              />
            ))}
          </div>
          <KeyboardShortcutsHelp />
        </div>
      </div>

      {/* Favorites + Recently used (auto-hide when empty) */}
      {(favorites.length > 0 || recent.length > 0) && (
        <div className="space-y-3">
          {favorites.length > 0 && (
            <ToolRow
              label="Favorites"
              icon={<Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
              ids={favorites}
              onOpen={openToolById}
            />
          )}
          {recent.length > 0 && (
            <ToolRow
              label="Recently used"
              icon={<Clock className="h-3.5 w-3.5 text-emerald-600" />}
              ids={recent}
              onOpen={openToolById}
            />
          )}
        </div>
      )}

      {/* Season Plan Generator — highlighted Pro feature card (above the tools grid) */}
      <button
        type="button"
        onClick={() => setSeasonPlanOpen(true)}
        className="group relative w-full text-left rounded-xl p-5 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <div className="absolute top-3 right-3">
          <Badge className="bg-amber-400/90 text-amber-950 hover:bg-amber-400 text-[10px] font-bold">✨ Pro feature</Badge>
        </div>
        <div className="flex items-start gap-4 pr-24">
          <div className="flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-lg bg-white/20 backdrop-blur">
            <Sparkles className="h-7 w-7" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="text-lg font-bold leading-tight">Season Plan Generator</h3>
            <p className="text-sm text-emerald-50/90 leading-relaxed">
              Generate a 52-week PDF agronomic plan for your crop — NPK demand, irrigation,
              fertigation recipes, and management notes per week, tailored to your soil &amp; water test.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-50/80 mt-1">
              <span>Powered by AI · covers establishment → vegetative → flowering → filling → maturation</span>
            </div>
          </div>
          <div className="hidden sm:flex flex-shrink-0 self-center items-center justify-center h-8 w-8 rounded-full border border-white/30 group-hover:bg-white/20 transition-all">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </button>

      {/* Tools grouped by category — landscape cards */}
      <div className="space-y-6">
        {grouped.map(group => (
          <div key={group.category} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-6 rounded-sm" style={{ background: CATEGORY_DOT_COLORS[group.category] }} />
              <h3 className="text-base font-bold tracking-tight">{group.category}</h3>
              <Badge variant="secondary" className="text-[10px] font-mono">{group.tools.length}</Badge>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {group.tools.map(tool => (
                <LandscapeToolCard
                  key={tool.id}
                  tool={tool}
                  onOpen={() => { setOpenTool(tool); addRecent(tool.id); }}
                  isFavorite={favorites.includes(tool.id)}
                  onToggleFavorite={() => toggleFavorite(tool.id)}
                  isInCompareTray={compareTray.includes(tool.id)}
                  compareTrayFull={compareTray.length >= 2}
                  onToggleCompare={() => toggleCompare(tool.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="rounded-full bg-muted p-4 inline-flex mb-3">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-1">No tools match</h3>
          <p className="text-sm text-muted-foreground">Try a different search or category.</p>
        </div>
      )}

      {/* Tool dialog — near-fullscreen like NutriPlant PRO: header + full-height tool area */}
      <Dialog open={!!openTool} onOpenChange={open => !open && setOpenTool(null)}>
        <DialogContent className="!max-w-[1600px] w-[98vw] !max-h-[96vh] h-[96vh] overflow-hidden p-0 gap-0 flex flex-col">
          {/* Compact header bar — title + collapsible hints toggle */}
          <DialogHeader className="px-5 py-3 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="flex items-center gap-2 text-base">
                {openTool && (
                  <span
                    className="flex items-center justify-center h-8 w-8 rounded-lg"
                    style={{ background: `${CATEGORY_DOT_COLORS[openTool.category]}20`, color: CATEGORY_DOT_COLORS[openTool.category] }}
                  >
                    <openTool.icon className="h-4 w-4" />
                  </span>
                )}
                {openTool?.name}
                {openTool && (
                  <Badge variant="outline" className={`text-[10px] ml-1 ${CATEGORY_COLORS[openTool.category]}`}>
                    {openTool.category}
                  </Badge>
                )}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => setShowHints(v => !v)}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  {showHints ? 'Hide guide' : 'Show guide'}
                </Button>
              </div>
            </div>
            <DialogDescription className="text-xs mt-1">{openTool?.description}</DialogDescription>

            {/* Collapsible benefit + how-to bar — inline, doesn't steal horizontal space from the tool */}
            {openTool && showHints && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                <div className="rounded-md px-3 py-2 border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300 font-semibold mb-0.5">
                    <Lightbulb className="h-3 w-3" /> Benefit
                  </div>
                  <p className="text-xs leading-snug text-foreground">{openTool.benefit}</p>
                </div>
                <div className="rounded-md px-3 py-2 border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/20">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-blue-700 dark:text-blue-300 font-semibold mb-0.5">
                    <HelpCircle className="h-3 w-3" /> How to use
                  </div>
                  <ol className="text-xs leading-snug text-foreground list-decimal pl-4 space-y-0.5">
                    {openTool.howToUse.map((step, i) => <li key={i}>{step}</li>)}
                  </ol>
                </div>
              </div>
            )}
          </DialogHeader>

          {/* Full-height tool area — gets 100% of remaining viewport height */}
          <div className="flex-1 min-h-0 overflow-y-auto p-5">
            {openTool && <ToolExportBar tool={openTool} />}
            <div className={openTool ? 'mt-3' : ''}>
              {openTool && <openTool.Component />}
            </div>
            {/* Why this matters — collapsible educational panel */}
            {openTool && WHY_IT_MATTERS[openTool.id] && (
              <div className="mt-4">
                <WhyItMattersPanel content={WHY_IT_MATTERS[openTool.id]} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Comparison tray — sticky bottom bar (visible when ≥1 tool selected) */}
      {compareTray.length > 0 && (
        <CompareTrayBar
          tools={compareTools}
          onClear={clearCompareTray}
          onOpenCompare={() => setCompareOpen(true)}
        />
      )}

      {/* Side-by-side comparison dialog */}
      {compareTools.length === 2 && (
        <CompareDialog
          tools={[compareTools[0], compareTools[1]]}
          open={compareOpen}
          onOpenChange={setCompareOpen}
        />
      )}

      {/* Season Plan Generator — Pro feature dialog */}
      <SeasonPlanGenerator open={seasonPlanOpen} onOpenChange={setSeasonPlanOpen} />
    </section>
  );
}

/** Sticky bottom bar that shows the current comparison tray state. */
function CompareTrayBar({
  tools, onClear, onOpenCompare,
}: {
  tools: ToolMeta[];
  onClear: () => void;
  onOpenCompare: () => void;
}) {
  const hasTwo = tools.length >= 2;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-3xl">
      <div className="flex items-center gap-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/95 dark:bg-emerald-950/90 backdrop-blur px-3 py-2 shadow-lg">
        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 flex-shrink-0">
          <Columns2 className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide hidden sm:inline">Compare</span>
        </div>
        <div className="flex-1 min-w-0">
          {hasTwo ? (
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-semibold truncate">{tools[0].name}</span>
              <span className="text-muted-foreground text-xs flex-shrink-0">vs</span>
              <span className="font-semibold truncate">{tools[1].name}</span>
            </div>
          ) : (
            <div className="text-xs text-emerald-800 dark:text-emerald-200">
              Select one more tool to compare <span className="font-mono opacity-70">(1/2 selected)</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {hasTwo && (
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={onOpenCompare}
            >
              <Columns2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Open side-by-side</span>
              <span className="sm:hidden">Compare</span>
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 text-xs text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
            onClick={onClear}
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Landscape (horizontal) tool card — icon on the left, content on the right, action arrow on the far right. */
function LandscapeToolCard({
  tool, onOpen, isFavorite, onToggleFavorite, isInCompareTray, compareTrayFull, onToggleCompare,
}: {
  tool: ToolMeta;
  onOpen: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isInCompareTray: boolean;
  compareTrayFull: boolean;
  onToggleCompare: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      className="group relative text-left rounded-xl border border-border bg-card p-4 sm:p-5 hover:border-emerald-400 hover:shadow-md transition-all flex gap-4 items-start cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      {/* Compare toggle — top-right, just left of the star */}
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onToggleCompare(); }}
        aria-label={isInCompareTray ? `Remove ${tool.name} from comparison` : `Add ${tool.name} to comparison`}
        aria-pressed={isInCompareTray}
        title={compareTrayFull && !isInCompareTray ? 'Comparison tray is full (max 2)' : (isInCompareTray ? 'Remove from comparison' : 'Add to comparison')}
        className={`absolute top-3 right-11 z-10 inline-flex items-center justify-center h-7 w-7 rounded-full border transition-all ${
          isInCompareTray
            ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700'
            : 'bg-background/80 backdrop-blur border-border text-muted-foreground hover:text-emerald-600 hover:border-emerald-300 opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
        }`}
      >
        <Columns2 className="h-3.5 w-3.5" />
        {isInCompareTray && (
          <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center h-3.5 w-3.5 rounded-full bg-emerald-700 text-white text-[8px] font-bold border border-background">
            <Check className="h-2.5 w-2.5" />
          </span>
        )}
      </button>

      {/* Star toggle — top-right corner; always visible when favorited, otherwise on hover */}
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
        aria-label={isFavorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
        aria-pressed={isFavorite}
        className={`absolute top-3 right-3 z-10 inline-flex items-center justify-center h-7 w-7 rounded-full border transition-all ${
          isFavorite
            ? 'bg-amber-400 border-amber-400 text-white hover:bg-amber-500 hover:border-amber-500'
            : 'bg-background/80 backdrop-blur border-border text-muted-foreground hover:text-amber-500 hover:border-amber-300 opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
        }`}
      >
        <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`} />
      </button>

      {/* Icon block — colored by category */}
      <div
        className="flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-lg transition-all group-hover:scale-105"
        style={{ background: `${CATEGORY_DOT_COLORS[tool.category]}20`, color: CATEGORY_DOT_COLORS[tool.category] }}
      >
        <tool.icon className="h-7 w-7" />
      </div>

      {/* Content — pr-16 on mobile reserves room for both star + compare buttons; sm+ relies on the arrow column */}
      <div className="flex-1 min-w-0 space-y-1.5 pr-16 sm:pr-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-base font-semibold leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
            {tool.name}
          </h4>
          <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[tool.category]}`}>
            {tool.category}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {tool.description}
        </p>
        <p className="text-xs text-foreground/80 leading-relaxed flex gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <span><span className="font-medium text-amber-700 dark:text-amber-400">Benefit:</span> {tool.benefit}</span>
        </p>
      </div>

      {/* Action arrow */}
      <div className="flex-shrink-0 self-center hidden sm:flex items-center justify-center h-8 w-8 rounded-full border border-border text-muted-foreground group-hover:border-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
        <ArrowRight className="h-4 w-4" />
      </div>
    </div>
  );
}

function IntroCard({ icon: Icon, color, title, body }: { icon: typeof Info; color: string; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg" style={{ background: color + '20', color }}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold" style={{ color }}>{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function CategoryChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-md border transition-all ${active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-background border-border text-muted-foreground hover:border-emerald-300 hover:text-foreground'}`}
    >
      {label} <span className="ml-1 opacity-70 font-mono">({count})</span>
    </button>
  );
}

/** Horizontal chip row for Favorites / Recently used — auto-hides when no tools match. */
function ToolRow({
  label, icon, ids, onOpen,
}: {
  label: string;
  icon: React.ReactNode;
  ids: string[];
  onOpen: (id: string) => void;
}) {
  const tools = ids.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) as ToolMeta[];
  if (tools.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
        <span className="font-mono opacity-70">{tools.length}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tools.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => onOpen(t.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              <span style={{ color: CATEGORY_DOT_COLORS[t.category] }}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="font-medium">{t.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
