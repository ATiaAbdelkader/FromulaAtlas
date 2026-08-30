'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Network,
  Activity,
  Flame,
  Droplet,
  Zap,
  Info,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Download,
  Printer,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Thermometer,
  Gauge,
  Sprout,
  Compass,
  FileSpreadsheet,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useTranslation, copyFor } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';
import {
  DETAILED_IONS,
  DetailedIonSpec,
  KINETIC_NUTRIENTS,
  KineticNutrientArrival,
  PLANT_ZONES,
  DIAGNOSTIC_NODES,
  calculateCationBalance,
} from '@/lib/nutrient-interactions-data';
import { PH_NUTRIENTS } from '@/lib/nutri-tools-data';
import { PlantDeficiencyVisualizer } from './PlantDeficiencyVisualizer';
import { TomatoDiseaseVisualizer } from './TomatoDiseaseVisualizer';

// ---------------------------------------------------------------------------
// Trilingual constants for the CalculatorShell hero header
// ---------------------------------------------------------------------------

const TITLE: TrilingualString = {
  en: 'Nutrient Interactions, Mobility & Uptake Suite',
  ar: 'منظومة تفاعلات وحركية وامتصاص العناصر المغذية',
  fr: 'Suite Interactions, Mobilité & Cinétique des Nutriments',
};

const DESC: TrilingualString = {
  en: "Advanced Mulder's diagram, 16×16 conflict matrix, environmental root kinetics, phloem translocation & cation balance",
  ar: 'مخطط مولدر التفاعلي، مصفوفة التضاد 16×16، ديناميكا الامتصاص الجذري، حركية اللحاء وتوازن الكاتيونات',
  fr: 'Diagramme de Mulder interactif, matrice 16×16, cinétique racinaire, translocation et équilibre des cations',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: "Mulder (1953) cation-anion antagonism & synergy wheel · 16×16 cross-reference matrix · Barber (1995) nutrient uptake kinetics (Mass Flow / Diffusion / Root Interception) · Troug-Lucas pH availability curves · BCSR base-cation saturation ratios (Albrecht / Kinsey).",
  ar: 'عجلة مولدر (1953) للتضاد والتآزر الكاتيوني-الأنيوني · مصفوفة 16×16 · ديناميكا امتصاص باربر (1995): التدفق الكتلي / الانتشار / الاعتراض الجذري · منحنيات تروغ-لوكاس لتوفر العناصر حسب pH · نسب تشبع الكاتيونات BCSR (ألبريشت / كينسي).',
  fr: "Roue de Mulder (1953) antagonismes & synergies cation-anion · matrice 16×16 · cinétique d'absorption de Barber (1995) (flux de masse / diffusion / interception racinaire) · courbes de disponibilité Troug-Lucas · ratios de saturation BCSR (Albrecht / Kinsey).",
};

export function NutrientInteractions() {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const isFr = language === 'fr';

  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'mulder' | 'matrix' | 'arrival' | 'mobility' | 'ph' | 'cation' | 'plant-deficiency' | 'tomato-diseases'>('mulder');

  // ============================================================================
  // TAB 1: MULDER DIAGRAM & CONFLICT SIMULATOR STATE
  // ============================================================================
  const [selectedIonId, setSelectedIonId] = useState<string>('k');
  const [interactionFilter, setInteractionFilter] = useState<'all' | 'antagonism' | 'synergy'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'macro' | 'secondary' | 'micro' | 'beneficial'>('all');
  const [isConflictSimOpen, setIsConflictSimOpen] = useState<boolean>(false);

  // Fertilizer Blend Simulator (Select multiple ions to test mixture compatibility)
  const [simSelectedIons, setSimSelectedIons] = useState<string[]>(['k', 'nh4', 'ca']);

  const selectedIon = useMemo(() => {
    return DETAILED_IONS.find((i) => i.id === selectedIonId) || DETAILED_IONS[0];
  }, [selectedIonId]);

  // Mulder SVG Geometry
  const cx = 175,
    cy = 175,
    radius = 125;
  const filteredIons = useMemo(() => {
    if (categoryFilter === 'all') return DETAILED_IONS;
    return DETAILED_IONS.filter((i) => i.category === categoryFilter);
  }, [categoryFilter]);

  const ionPositions = useMemo(() => {
    return DETAILED_IONS.map((ion, idx) => {
      const angle = -Math.PI / 2 + (idx / DETAILED_IONS.length) * 2 * Math.PI;
      return {
        ...ion,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        angle,
      };
    });
  }, [cx, cy, radius]);

  const posMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    ionPositions.forEach((p) => map.set(p.id, { x: p.x, y: p.y }));
    return map;
  }, [ionPositions]);

  // Extract Antagonism Edges & Synergism Edges
  const { allAntEdges, allSynEdges } = useMemo(() => {
    const antEdges: { from: string; to: string; severity: string; mechanism: string }[] = [];
    const synEdges: { from: string; to: string; intensity: string; mechanism: string }[] = [];

    DETAILED_IONS.forEach((ion) => {
      ion.antagonists.forEach((ant) => {
        antEdges.push({ from: ion.id, to: ant.targetId, severity: ant.severity, mechanism: ant.mechanism });
      });
      ion.synergists.forEach((syn) => {
        synEdges.push({ from: ion.id, to: syn.targetId, intensity: syn.intensity, mechanism: syn.mechanism });
      });
    });

    return { allAntEdges: antEdges, allSynEdges: synEdges };
  }, []);

  // Blend Simulator Conflicts Calculation
  const simConflicts = useMemo(() => {
    const conflicts: {
      ionA: string;
      ionB: string;
      type: 'antagonism' | 'synergy';
      severity: string;
      mechanism: string;
      mechanism_ar: string;
    }[] = [];

    for (let i = 0; i < simSelectedIons.length; i++) {
      for (let j = i + 1; j < simSelectedIons.length; j++) {
        const idA = simSelectedIons[i];
        const idB = simSelectedIons[j];
        const ionA = DETAILED_IONS.find((x) => x.id === idA);
        const ionB = DETAILED_IONS.find((x) => x.id === idB);

        if (!ionA || !ionB) continue;

        // Check A -> B Antagonism
        const antAB = ionA.antagonists.find((x) => x.targetId === idB);
        if (antAB) {
          conflicts.push({
            ionA: ionA.ion,
            ionB: ionB.ion,
            type: 'antagonism',
            severity: antAB.severity,
            mechanism: antAB.mechanism,
            mechanism_ar: antAB.mechanism_ar,
          });
        }
        // Check A -> B Synergy
        const synAB = ionA.synergists.find((x) => x.targetId === idB);
        if (synAB) {
          conflicts.push({
            ionA: ionA.ion,
            ionB: ionB.ion,
            type: 'synergy',
            severity: synAB.intensity,
            mechanism: synAB.mechanism,
            mechanism_ar: synAB.mechanism_ar,
          });
        }
      }
    }
    return conflicts;
  }, [simSelectedIons]);

  // ============================================================================
  // TAB 2: ROOT ARRIVAL & KINETIC ENVIRONMENTAL SIMULATOR
  // ============================================================================
  const [selectedKineticId, setSelectedKineticId] = useState<string>('h2po4');
  const [soilMoisturePct, setSoilMoisturePct] = useState<number>(75); // 10% drought, 75% field capacity, 100% saturated
  const [soilTempC, setSoilTempC] = useState<number>(20); // 5C cold to 35C warm
  const [rootHealthState, setRootHealthState] = useState<'poor' | 'standard' | 'mycorrhizal'>('standard');
  const [transpirationDemand, setTranspirationDemand] = useState<'low' | 'normal' | 'high'>('normal');

  const activeKinetic = useMemo(() => {
    return KINETIC_NUTRIENTS.find((k) => k.id === selectedKineticId) || KINETIC_NUTRIENTS[0];
  }, [selectedKineticId]);

  // Dynamic Effective Delivery Flux computation based on Environmental Conditions
  const dynamicKinetics = useMemo(() => {
    // Moisture factor (affects diffusion exponentially, mass flow linearly)
    const moistureFactor = Math.max(0.1, soilMoisturePct / 75);
    const diffusionMoistureFactor = Math.pow(soilMoisturePct / 75, 1.8);

    // Temperature factor (Q10 rule ~2x per 10C)
    const tempFactor = Math.max(0.2, (soilTempC + 5) / 25);

    // Root factor (Mycorrhizae boosts P and Zn diffusion by 300%)
    const rootFactor = rootHealthState === 'mycorrhizal' ? 1.8 : rootHealthState === 'poor' ? 0.45 : 1.0;
    const mycorrhizalPZnBoost = rootHealthState === 'mycorrhizal' ? 2.5 : 1.0;

    // Transpiration factor (affects mass flow)
    const vpdFactor = transpirationDemand === 'high' ? 1.4 : transpirationDemand === 'low' ? 0.4 : 1.0;

    return KINETIC_NUTRIENTS.map((nutri) => {
      let effMassFlow = nutri.standardMassFlowPct * moistureFactor * vpdFactor;
      let effDiffusion =
        nutri.standardDiffusionPct *
        diffusionMoistureFactor *
        tempFactor *
        (nutri.id === 'h2po4' || nutri.id === 'zn' ? mycorrhizalPZnBoost : rootFactor);
      let effInterception = nutri.standardInterceptionPct * rootFactor;

      const rawTotal = effMassFlow + effDiffusion + effInterception;
      const normalizedMassFlow = Number(((effMassFlow / rawTotal) * 100).toFixed(1));
      const normalizedDiffusion = Number(((effDiffusion / rawTotal) * 100).toFixed(1));
      const normalizedInterception = Number(((effInterception / rawTotal) * 100).toFixed(1));

      // Overall uptake capacity vs standard baseline
      const standardTotal = nutri.standardMassFlowPct + nutri.standardDiffusionPct + nutri.standardInterceptionPct;
      const deliveryEfficiency = Math.round((rawTotal / standardTotal) * 100);

      return {
        ...nutri,
        currentMassFlowPct: normalizedMassFlow,
        currentDiffusionPct: normalizedDiffusion,
        currentInterceptionPct: normalizedInterception,
        deliveryEfficiency,
      };
    });
  }, [soilMoisturePct, soilTempC, rootHealthState, transpirationDemand]);

  const currentDynamicNutrient = useMemo(() => {
    return dynamicKinetics.find((k) => k.id === selectedKineticId) || dynamicKinetics[0];
  }, [dynamicKinetics, selectedKineticId]);

  // ============================================================================
  // TAB 3: PLANT MOBILITY & LEAF DIAGNOSTIC WIZARD
  // ============================================================================
  const [selectedZoneId, setSelectedZoneId] = useState<'apical' | 'young' | 'mature' | 'lower'>('lower');
  const [wizardLocation, setWizardLocation] = useState<'all' | 'lower' | 'young' | 'apical' | 'mature'>('all');
  const [wizardPattern, setWizardPattern] = useState<string>('all');
  const [selectedDiagNodeId, setSelectedDiagNodeId] = useState<string>('mg-def');

  const filteredDiagNodes = useMemo(() => {
    return DIAGNOSTIC_NODES.filter((n) => {
      const matchLoc = wizardLocation === 'all' || n.location === wizardLocation;
      const matchPat = wizardPattern === 'all' || n.pattern === wizardPattern;
      return matchLoc && matchPat;
    });
  }, [wizardLocation, wizardPattern]);

  const selectedDiagNode = useMemo(() => {
    return DIAGNOSTIC_NODES.find((n) => n.id === selectedDiagNodeId) || DIAGNOSTIC_NODES[0];
  }, [selectedDiagNodeId]);

  // ============================================================================
  // TAB 4: SOIL PH AVAILABILITY SPECTRUM
  // ============================================================================
  const [currentPh, setCurrentPh] = useState<number>(6.5);
  const [selectedPhNutrientId, setSelectedPhNutrientId] = useState<string>('P');

  // Compute interpolated relative availability at current pH
  const phAvailabilityMap = useMemo(() => {
    const map = new Map<string, number>();

    PH_NUTRIENTS.forEach((nutri) => {
      // Linear interpolation between point pairs
      const points = nutri.points;
      let avail = 0.5;

      for (let i = 0; i < points.length - 1; i++) {
        const [p1, v1] = points[i];
        const [p2, v2] = points[i + 1];
        if (currentPh >= p1 && currentPh <= p2) {
          const ratio = (currentPh - p1) / (p2 - p1);
          avail = v1 + ratio * (v2 - v1);
          break;
        }
      }
      map.set(nutri.id, Math.max(0, Math.min(1, avail)));
    });

    return map;
  }, [currentPh]);

  const selectedPhInfo = useMemo(() => {
    return PH_NUTRIENTS.find((n) => n.id === selectedPhNutrientId) || PH_NUTRIENTS[1];
  }, [selectedPhNutrientId]);

  // ============================================================================
  // TAB 5: CATION EXCHANGE & BASE BALANCE CALCULATOR
  // ============================================================================
  const [soilCa, setSoilCa] = useState<number>(12.5); // cmol(+)/kg
  const [soilMg, setSoilMg] = useState<number>(2.4);
  const [soilK, setSoilK] = useState<number>(0.85);
  const [soilNa, setSoilNa] = useState<number>(0.3);
  const [soilNh4, setSoilNh4] = useState<number>(0.2);

  const cationResult = useMemo(() => {
    return calculateCationBalance(soilCa, soilMg, soilK, soilNa, soilNh4);
  }, [soilCa, soilMg, soilK, soilNa, soilNh4]);

  // ===========================================================================
  // Hero action handlers: Copy Summary & Reset
  // ===========================================================================
  const [copied, setCopied] = useState<boolean>(false);

  const handleReset = () => {
    setSelectedIonId('k');
    setInteractionFilter('all');
    setCategoryFilter('all');
    setIsConflictSimOpen(false);
    setSimSelectedIons(['k', 'nh4', 'ca']);
    setSelectedKineticId('h2po4');
    setSoilMoisturePct(75);
    setSoilTempC(20);
    setRootHealthState('standard');
    setTranspirationDemand('normal');
    setSelectedZoneId('lower');
    setWizardLocation('all');
    setWizardPattern('all');
    setSelectedDiagNodeId('mg-def');
    setCurrentPh(6.5);
    setSelectedPhNutrientId('P');
    setSoilCa(12.5);
    setSoilMg(2.4);
    setSoilK(0.85);
    setSoilNa(0.3);
    setSoilNh4(0.2);
    toast({ title: tr('Reset', 'إعادة', 'Réinitialiser') });
  };

  const handleCopy = () => {
    const lines: string[] = ['=== NUTRIENT INTERACTIONS SUITE ==='];
    lines.push(`Active Tab: ${activeTab}`);

    if (activeTab === 'mulder') {
      lines.push(`Selected Ion: ${selectedIon.ion} — ${selectedIon.name}`);
      lines.push(`Category: ${selectedIon.category} (${selectedIon.charge})`);
      lines.push(`Antagonists: ${selectedIon.antagonists.length} | Synergists: ${selectedIon.synergists.length}`);
      if (isConflictSimOpen) {
        lines.push('');
        lines.push('-- Tank/Soil Blend Simulator --');
        lines.push(`Selected ions: ${simSelectedIons.join(', ')}`);
        lines.push(`Conflicts detected: ${simConflicts.length}`);
        simConflicts.forEach((c) => {
          lines.push(`  • ${c.ionA} ⇄ ${c.ionB}: ${c.type} (${c.severity}) — ${c.mechanism}`);
        });
      }
    } else if (activeTab === 'matrix') {
      lines.push(`Selected Target Element: ${selectedIon.ion} — ${selectedIon.name}`);
    } else if (activeTab === 'arrival') {
      lines.push(`Nutrient: ${currentDynamicNutrient.symbol} — ${currentDynamicNutrient.name}`);
      lines.push(`Soil moisture: ${soilMoisturePct}% | Temperature: ${soilTempC}°C`);
      lines.push(`Root state: ${rootHealthState} | Transpiration: ${transpirationDemand}`);
      lines.push(`Delivery efficiency: ${currentDynamicNutrient.deliveryEfficiency}%`);
      lines.push(`  Mass flow: ${currentDynamicNutrient.currentMassFlowPct}%`);
      lines.push(`  Diffusion: ${currentDynamicNutrient.currentDiffusionPct}%`);
      lines.push(`  Interception: ${currentDynamicNutrient.currentInterceptionPct}%`);
    } else if (activeTab === 'mobility') {
      lines.push(`Selected zone: ${selectedZoneId}`);
      lines.push(`Selected diagnosis: ${selectedDiagNode.name} (${selectedDiagNode.matchingNutrient})`);
    } else if (activeTab === 'ph') {
      lines.push(`Current pH: ${currentPh.toFixed(1)}`);
      lines.push(`Nutrient: ${selectedPhInfo.lab} — ${selectedPhInfo.name}`);
      const avail = phAvailabilityMap.get(selectedPhInfo.id) ?? 0.5;
      lines.push(`Relative availability: ${Math.round(avail * 100)}%`);
    } else if (activeTab === 'cation') {
      lines.push(`Ca: ${soilCa} cmol(+)/kg`);
      lines.push(`Mg: ${soilMg} cmol(+)/kg`);
      lines.push(`K: ${soilK} cmol(+)/kg`);
      lines.push(`Na: ${soilNa} cmol(+)/kg`);
      lines.push(`NH4: ${soilNh4} cmol(+)/kg`);
      lines.push(`Total bases: ${cationResult.totalBasesMeq} cmol(+)/kg`);
      lines.push(`K:Mg ratio: ${cationResult.kToMgRatio} : 1`);
      lines.push(`Ca:Mg ratio: ${cationResult.caToMgRatio} : 1`);
      lines.push(`Antagonism index: ${cationResult.antagonismIndex}`);
      lines.push(`ESP: ${cationResult.naPct}%`);
      lines.push(`Status: ${cationResult.status}`);
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    toast({ title: tr('Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  const heroActions = [
    {
      icon: Copy,
      label: { en: 'Copy Summary', ar: 'نسخ الملخص', fr: 'Copier le résumé' },
      onClick: handleCopy,
      variant: 'primary' as const,
      showCheck: copied,
    },
    {
      icon: RotateCcw,
      label: { en: 'Reset', ar: 'إعادة', fr: 'Réinitialiser' },
      onClick: handleReset,
    },
    {
      icon: Printer,
      label: { en: 'Print / Export PDF', ar: 'طباعة / تصدير PDF', fr: 'Imprimer / PDF' },
      onClick: () => window.print(),
    },
  ];

  return (
    <CalculatorShell
      icon={Network}
      title={TITLE}
      description={DESC}
      badge={tr('Mulder · BCSR', 'مولدر · BCSR', 'Mulder · BCSR')}
      accent="emerald"
      actions={heroActions}
      protocolNote={PROTOCOL_NOTE}
    >
      {/* Navigation Tabs — full width */}
      <div className="lg:col-span-12">
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 no-scrollbar">
          {[
            { id: 'mulder', label: tr('Mulder Interaction Chord', 'مخطط مولدر التفاعلي', 'Diagramme de Mulder'), icon: Network },
            { id: 'plant-deficiency', label: tr('Botanical Plant Deficiency Guide', 'دليل نقص العناصر النباتي', 'Guide Carences Botanique'), icon: Sprout },
            { id: 'tomato-diseases', label: tr('Tomato Pathology Map', 'خريطة أمراض الطماطم', 'Atlas Pathologique Tomate'), icon: ShieldAlert },
            { id: 'matrix', label: tr('16×16 Interaction Matrix', 'مصفوفة التضاد 16×16', 'Matrice 16×16'), icon: Layers },
            { id: 'arrival', label: tr('Root Arrival Kinetics', 'ديناميكا وصول الجذور', 'Cinétique Racinaire'), icon: Droplet },
            { id: 'mobility', label: tr('Plant Mobility & Diagnosis', 'حركية اللحاء وتشخيص النقص', 'Mobilité & Diagnostic'), icon: Sprout },
            { id: 'ph', label: tr('Soil pH Spectrum', 'طيف التوفر حسب pH', 'Spectre pH du Sol'), icon: Gauge },
            { id: 'cation', label: tr('Cation Balancer (BCSR)', 'موازن الكاتيونات (BCSR)', 'Équilibre des Cations'), icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                type="button"
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-xs gap-1.5 whitespace-nowrap rounded-lg h-8 transition-all ${
                  isActive ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Tab Content — full width */}
      <div className="lg:col-span-12 space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: MULDER DIAGRAM & FERTILIZER TANK BLEND SIMULATOR                    */}
        {/* ========================================================================= */}
        {activeTab === 'mulder' && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground">{tr('Filter Interaction:', 'تصفية التفاعل:', 'Filtrer :')}</span>
                <Button
                  type="button"
                  variant={interactionFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInteractionFilter('all')}
                  className="h-7 text-xs px-2.5"
                >
                  {tr('All Interactions', 'كافة التفاعلات', 'Tous')}
                </Button>
                <Button
                  type="button"
                  variant={interactionFilter === 'antagonism' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInteractionFilter('antagonism')}
                  className="h-7 text-xs px-2.5 bg-red-600 hover:bg-red-700 text-white"
                >
                  {tr('Antagonisms Only ⚡', 'التضاد والتنافس فقط ⚡', 'Antagonismes')}
                </Button>
                <Button
                  type="button"
                  variant={interactionFilter === 'synergy' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInteractionFilter('synergy')}
                  className="h-7 text-xs px-2.5 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {tr('Synergisms Only ✦', 'التآزر والتنشيط فقط ✦', 'Synergies')}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={isConflictSimOpen ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setIsConflictSimOpen((v) => !v)}
                  className="h-7 text-xs gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>
                    {isConflictSimOpen
                      ? tr('Close Blend Simulator', 'إغلاق محاكي الخلطات', 'Fermer Simulateur')
                      : tr('Test My Tank/Soil Blend', 'اختبار خلطة السماد أو التربة', 'Tester un Mélange')}
                  </span>
                </Button>
              </div>
            </div>

            {/* Optional Fertilizer Blend Compatibility Simulator Drawer */}
            {isConflictSimOpen && (
              <div className="p-4 rounded-xl border-2 border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-bold">
                      {tr(
                        'Tank-Mix & High-Dose Conflict Simulator',
                        'محاكي توافق وتضاد خلطات الأسمدة ومحلول التسميد',
                        'Simulateur de Compatibilité des Mélanges'
                      )}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[11px]">
                    {simSelectedIons.length} {tr('Ions active in blend', 'عناصر مختارة في الخلطة', 'ions sélectionnés')}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {tr(
                    'Select which ions are co-applied or abundant in your soil/tank to check for precipitation and induced deficiencies:',
                    'اختر العناصر الموجودة في خزان التسميد أو التربة لفحص مخاطر الترسيب والجوع الخفي المستحث:',
                    'Sélectionnez les ions présents dans votre cuve ou sol pour détecter les précipitations et carences induites :'
                  )}
                </p>

                {/* Ion Toggle Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {DETAILED_IONS.map((ion) => {
                    const isSelected = simSelectedIons.includes(ion.id);
                    return (
                      <button
                        key={ion.id}
                        type="button"
                        onClick={() => {
                          setSimSelectedIons((prev) =>
                            isSelected ? prev.filter((x) => x !== ion.id) : [...prev, ion.id]
                          );
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-mono font-medium transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-background hover:bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {ion.ion} ({ion.name.split(' ')[0]})
                      </button>
                    );
                  })}
                </div>

                {/* Simulation Output Alerts */}
                <div className="pt-2">
                  {simConflicts.length === 0 ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background border text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>
                        {tr(
                          'No critical direct antagonisms detected between selected elements at balanced rates.',
                          'لم يتم رصد تضاد مباشر خطير بين العناصر المختارة عند التركيزات المتوازنة.',
                          'Aucun antagonisme direct majeur détecté pour ces éléments sélectionnés.'
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {simConflicts.map((c, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                            c.type === 'antagonism'
                              ? 'bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-200'
                              : 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-200'
                          }`}
                        >
                          {c.type === 'antagonism' ? (
                            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                          ) : (
                            <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="font-bold">
                              {c.ionA} ⇄ {c.ionB} : {c.type === 'antagonism' ? tr('Antagonistic Conflict', 'تضاد وتنافس جذري') : tr('Synergistic Couple', 'تآزر وتعزيز متبادل')} ({c.severity})
                            </div>
                            <div className="text-[11px] opacity-90">{isAr ? c.mechanism_ar : c.mechanism}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Main Interactive Diagram & Details Grid */}
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Interactive Circular Chord Network SVG */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/30 border relative overflow-hidden">
                <div className="absolute top-3 left-3 text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{tr('Mulder Interaction Wheel', 'عجلة مولدر للتفاعلات', 'Roue de Mulder')}</span>
                </div>

                <svg viewBox="0 0 350 350" className="w-full max-w-sm sm:max-w-md select-none">
                  {/* Subtle Background Target Rings */}
                  <circle cx={cx} cy={cy} r={radius} fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx={cx} cy={cy} r={radius * 0.65} fill="none" stroke="currentColor" strokeOpacity="0.05" strokeWidth="1" />
                  <circle cx={cx} cy={cy} r={radius * 0.3} fill="none" stroke="currentColor" strokeOpacity="0.04" strokeWidth="1" />

                  {/* Connecting Edges */}
                  <g className="edges-layer">
                    {/* Antagonism lines (Red) */}
                    {(interactionFilter === 'all' || interactionFilter === 'antagonism') &&
                      allAntEdges.map((edge, idx) => {
                        const p1 = posMap.get(edge.from);
                        const p2 = posMap.get(edge.to);
                        if (!p1 || !p2) return null;

                        const isConnectedToSelected = edge.from === selectedIonId || edge.to === selectedIonId;
                        const isDimmed = !isConnectedToSelected;

                        return (
                          <line
                            key={`ant-${idx}`}
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke="#dc2626"
                            strokeWidth={isConnectedToSelected ? 2.2 : 0.8}
                            strokeOpacity={isConnectedToSelected ? 0.95 : 0.15}
                            strokeDasharray={edge.severity === 'high' ? 'none' : '4 2'}
                            className="transition-all duration-300"
                          />
                        );
                      })}

                    {/* Synergism lines (Blue / Green) */}
                    {(interactionFilter === 'all' || interactionFilter === 'synergy') &&
                      allSynEdges.map((edge, idx) => {
                        const p1 = posMap.get(edge.from);
                        const p2 = posMap.get(edge.to);
                        if (!p1 || !p2) return null;

                        const isConnectedToSelected = edge.from === selectedIonId || edge.to === selectedIonId;

                        return (
                          <line
                            key={`syn-${idx}`}
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke="#2563eb"
                            strokeWidth={isConnectedToSelected ? 2.5 : 0.9}
                            strokeOpacity={isConnectedToSelected ? 0.95 : 0.12}
                            strokeDasharray="3 3"
                            className="transition-all duration-300"
                          />
                        );
                      })}
                  </g>

                  {/* Ion Circular Nodes */}
                  <g className="nodes-layer">
                    {ionPositions.map((ion) => {
                      const isSelected = ion.id === selectedIonId;
                      const isAntagonist = selectedIon.antagonists.some((a) => a.targetId === ion.id);
                      const isSynergist = selectedIon.synergists.some((s) => s.targetId === ion.id);

                      let nodeFill = '#ffffff';
                      let nodeStroke = ion.color;
                      let textColor = '#0f172a';

                      if (isSelected) {
                        nodeFill = ion.color;
                        textColor = '#ffffff';
                        nodeStroke = '#ffffff';
                      } else if (isAntagonist) {
                        nodeFill = '#fee2e2';
                        nodeStroke = '#dc2626';
                        textColor = '#991b1b';
                      } else if (isSynergist) {
                        nodeFill = '#dbeafe';
                        nodeStroke = '#2563eb';
                        textColor = '#1e40af';
                      }

                      return (
                        <g
                          key={ion.id}
                          onClick={() => setSelectedIonId(ion.id)}
                          className="cursor-pointer transition-transform duration-200 hover:scale-110"
                        >
                          {/* Selection Outer Glow */}
                          {isSelected && (
                            <circle cx={ion.x} cy={ion.y} r={22} fill="none" stroke={ion.color} strokeWidth="3" opacity="0.4" className="animate-pulse" />
                          )}

                          <circle
                            cx={ion.x}
                            cy={ion.y}
                            r={isSelected ? 16 : 13.5}
                            fill={nodeFill}
                            stroke={nodeStroke}
                            strokeWidth={isSelected ? 2.5 : 1.5}
                            className="drop-shadow-xs"
                          />
                          <text
                            x={ion.x}
                            y={ion.y + 3.5}
                            textAnchor="middle"
                            fontSize={isSelected ? '9px' : '8px'}
                            fontWeight="bold"
                            fill={textColor}
                            className="pointer-events-none font-mono"
                          >
                            {ion.ion}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] mt-2 pt-2 border-t w-full">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-1 bg-red-600 rounded-full"></span>
                    <span className="font-medium text-red-700 dark:text-red-400">{tr('Antagonism (Inhibition)', 'تضاد وتثبيط')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-1 bg-blue-600 rounded-full border-t border-dashed"></span>
                    <span className="font-medium text-blue-700 dark:text-blue-400">{tr('Synergy (Stimulation)', 'تآزر وتحفيز')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border-2 border-emerald-600 bg-emerald-600 text-white"></span>
                    <span>{tr('Selected Focus', 'العنصر النشط')}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: In-depth Ion Profile & Interactions */}
              <div className="lg:col-span-6 space-y-4">
                {/* Active Ion Hero Header */}
                <div className="p-4 rounded-xl border bg-card shadow-xs space-y-2" style={{ borderLeftColor: selectedIon.color, borderLeftWidth: 4 }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold font-mono" style={{ color: selectedIon.color }}>
                          {selectedIon.ion}
                        </span>
                        <span className="text-base font-bold">
                          {isAr ? selectedIon.name_ar : isFr ? selectedIon.name_fr : selectedIon.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                          {selectedIon.category}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {selectedIon.charge === 'cation' ? 'Cation (+)' : selectedIon.charge === 'anion' ? 'Anion (-)' : 'Neutral Molecule'}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-muted-foreground block">{tr('Total Interactions', 'إجمالي التفاعلات')}</span>
                      <span className="text-xs font-bold">
                        {selectedIon.antagonists.length} ⚡ | {selectedIon.synergists.length} ✦
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    {isAr ? selectedIon.functionalRole_ar : isFr ? selectedIon.functionalRole_fr : selectedIon.functionalRole}
                  </p>
                </div>

                {/* Antagonistic Partners Panel */}
                <div className="p-3.5 rounded-xl border bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-300">
                      <AlertTriangle className="h-4 w-4" />
                      <span>
                        {tr('Antagonists & Competitors', 'العناصر المضادة والمنافسة')} ({selectedIon.antagonists.length})
                      </span>
                    </div>
                    <span className="text-[10px] text-red-600/80">{tr('Click to inspect', 'اضغط للمعاينة')}</span>
                  </div>

                  {selectedIon.antagonists.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">{tr('No strong direct antagonists known.', 'لا يوجد تضاد مباشر حاد.')}</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedIon.antagonists.map((ant) => {
                        const target = DETAILED_IONS.find((i) => i.id === ant.targetId);
                        if (!target) return null;
                        return (
                          <div
                            key={ant.targetId}
                            onClick={() => setSelectedIonId(target.id)}
                            className="p-2 rounded-lg bg-background/80 border border-red-200 dark:border-red-900/60 hover:border-red-400 cursor-pointer transition-all text-xs"
                          >
                            <div className="flex items-center justify-between font-semibold mb-1">
                              <span className="text-red-700 dark:text-red-300 font-mono">
                                {selectedIon.ion} ⚡ {target.ion} ({isAr ? target.name_ar : target.name})
                              </span>
                              <Badge variant="outline" className="text-[10px] border-red-300 text-red-700">
                                {ant.severity.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {isAr ? ant.mechanism_ar : ant.mechanism}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Synergistic Partners Panel */}
                <div className="p-3.5 rounded-xl border bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                      <Sparkles className="h-4 w-4" />
                      <span>
                        {tr('Synergistic Partners & Enhancers', 'العناصر المعززة والمحفزة')} ({selectedIon.synergists.length})
                      </span>
                    </div>
                    <span className="text-[10px] text-blue-600/80">{tr('Click to inspect', 'اضغط للمعاينة')}</span>
                  </div>

                  {selectedIon.synergists.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">{tr('No major direct synergists identified.', 'لا توجد شركاء تآزر رئيسية.')}</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedIon.synergists.map((syn) => {
                        const target = DETAILED_IONS.find((i) => i.id === syn.targetId);
                        if (!target) return null;
                        return (
                          <div
                            key={syn.targetId}
                            onClick={() => setSelectedIonId(target.id)}
                            className="p-2 rounded-lg bg-background/80 border border-blue-200 dark:border-blue-900/60 hover:border-blue-400 cursor-pointer transition-all text-xs"
                          >
                            <div className="flex items-center justify-between font-semibold mb-1">
                              <span className="text-blue-700 dark:text-blue-300 font-mono">
                                {selectedIon.ion} ✦ {target.ion} ({isAr ? target.name_ar : target.name})
                              </span>
                              <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-700">
                                {syn.intensity.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {isAr ? syn.mechanism_ar : syn.mechanism}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Agronomic Practical Tip */}
                <div className="p-3 rounded-xl bg-muted/40 border text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                    <Info className="h-3.5 w-3.5" />
                    <span>{tr('Field Management & Tank Advice', 'نصيحة الحقل وإدارة الخزانات')}</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {isAr ? selectedIon.fieldTips_ar : selectedIon.fieldTips}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: FULL 16×16 INTERACTION MATRIX GRID                                 */}
        {/* ========================================================================= */}
        {activeTab === 'matrix' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold">
                  {tr('Complete 16×16 Agronomic Interaction Matrix', 'مصفوفة التداخلات الزراعية الشاملة 16×16', 'Matrice d’Interactions Complète 16×16')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {tr(
                    'Cross-reference of how each nutrient in the top row impacts the nutrient in the left column. Click any cell to inspect mechanism.',
                    'تقاطع تأثير عناصر الصف العلوي على عناصر العمود الأيسر. اضغط أي خلية لمعاينة الآلية الدقيقة.',
                    'Croisement des interactions entre chaque élément. Cliquez sur une cellule pour voir le mécanisme.'
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="bg-red-50 dark:bg-red-950/40 text-red-700 border-red-300">
                  ⚡ {tr('Antagonism', 'تضاد')}
                </Badge>
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 border-blue-300">
                  ✦ {tr('Synergy', 'تآزر')}
                </Badge>
                <Badge variant="outline" className="text-muted-foreground">
                  — {tr('Neutral', 'حيادي')}
                </Badge>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto border rounded-xl bg-card shadow-xs">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="bg-muted/60 border-b">
                    <th className="p-2 text-left font-bold text-muted-foreground sticky left-0 bg-muted z-10 min-w-[70px]">
                      {tr('Target ↓ / Influencer →', 'المتأثر ↓ / المؤثر →')}
                    </th>
                    {DETAILED_IONS.map((col) => (
                      <th
                        key={col.id}
                        onClick={() => setSelectedIonId(col.id)}
                        className={`p-2 text-center font-mono font-bold cursor-pointer hover:bg-muted ${
                          col.id === selectedIonId ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700' : ''
                        }`}
                        title={col.name}
                      >
                        {col.ion}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DETAILED_IONS.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-muted/20 transition-colors">
                      <td
                        onClick={() => setSelectedIonId(row.id)}
                        className={`p-2 font-mono font-bold sticky left-0 bg-card border-r z-10 cursor-pointer ${
                          row.id === selectedIonId ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700' : ''
                        }`}
                      >
                        {row.ion}
                      </td>
                      {DETAILED_IONS.map((col) => {
                        if (row.id === col.id) {
                          return (
                            <td key={col.id} className="p-1 text-center bg-muted/40 text-muted-foreground font-mono">
                              •
                            </td>
                          );
                        }

                        const ant = row.antagonists.find((a) => a.targetId === col.id);
                        const syn = row.synergists.find((s) => s.targetId === col.id);

                        if (ant) {
                          return (
                            <td
                              key={col.id}
                              onClick={() => setSelectedIonId(row.id)}
                              className="p-1 text-center cursor-pointer bg-red-100/60 dark:bg-red-950/40 hover:bg-red-200 text-red-700 dark:text-red-300 font-bold transition-colors"
                              title={`${row.ion} is antagonized by ${col.ion}: ${ant.mechanism}`}
                            >
                              ⚡
                            </td>
                          );
                        }

                        if (syn) {
                          return (
                            <td
                              key={col.id}
                              onClick={() => setSelectedIonId(row.id)}
                              className="p-1 text-center cursor-pointer bg-blue-100/60 dark:bg-blue-950/40 hover:bg-blue-200 text-blue-700 dark:text-blue-300 font-bold transition-colors"
                              title={`${row.ion} is synergized by ${col.ion}: ${syn.mechanism}`}
                            >
                              ✦
                            </td>
                          );
                        }

                        return (
                          <td key={col.id} className="p-1 text-center text-muted-foreground/30 font-mono">
                            —
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Selected Cell Insight Box */}
            <div className="p-4 rounded-xl border bg-muted/30 flex items-start gap-3">
              <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="font-bold">
                  {tr('Currently Selected Target Element:', 'العنصر المختار حالياً:')}{' '}
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    {selectedIon.ion} — {isAr ? selectedIon.name_ar : selectedIon.name}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  {isAr ? selectedIon.fieldTips_ar : selectedIon.fieldTips}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ROOT ARRIVAL & ENVIRONMENTAL KINETICS                              */}
        {/* ========================================================================= */}
        {activeTab === 'arrival' && (
          <div className="space-y-6">
            {/* Environmental Conditions Modifiers Toolbar */}
            <div className="p-4 rounded-xl border bg-card shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-bold">
                    {tr(
                      'Live Soil Environment & Root Uptake Simulator',
                      'محاكي بيئة التربة وديناميكا امتصاص الجذور',
                      'Simulateur d’Environnement du Sol & Cinétique Racinaire'
                    )}
                  </h3>
                </div>
                <Badge variant="outline" className="text-[11px]">
                  {tr('Dynamic Kinetics Engine', 'محرك ديناميكي لحساب التدفق')}
                </Badge>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                {/* 1. Soil Moisture */}
                <div className="space-y-1.5 p-3 rounded-lg bg-muted/30 border">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{tr('Soil Moisture Level', 'رطوبة التربة')}</span>
                    <span className="text-emerald-600 font-mono">{soilMoisturePct}%</span>
                  </div>
                  <Slider
                    value={[soilMoisturePct]}
                    min={10}
                    max={100}
                    step={5}
                    onValueChange={([val]) => setSoilMoisturePct(val)}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
                    <span>{tr('Drought (10%)', 'جفاف')}</span>
                    <span>{tr('Field Cap (75%)', 'سعة حقلية')}</span>
                    <span>{tr('Saturated', 'غدق')}</span>
                  </div>
                </div>

                {/* 2. Soil Temperature */}
                <div className="space-y-1.5 p-3 rounded-lg bg-muted/30 border">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{tr('Root Zone Temperature', 'حرارة منطقة الجذور')}</span>
                    <span className="text-amber-600 font-mono">{soilTempC}°C</span>
                  </div>
                  <Slider
                    value={[soilTempC]}
                    min={5}
                    max={35}
                    step={1}
                    onValueChange={([val]) => setSoilTempC(val)}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
                    <span>{tr('Cold (<10°C)', 'باردة')}</span>
                    <span>{tr('Optimal (20°C)', 'مثالية')}</span>
                    <span>{tr('Hot (35°C)', 'حارة')}</span>
                  </div>
                </div>

                {/* 3. Root System & Mycorrhizae */}
                <div className="space-y-1.5 p-3 rounded-lg bg-muted/30 border">
                  <span className="text-xs font-semibold block">{tr('Root Architecture / AMF', 'بنية الجذور والمايكورايزا')}</span>
                  <select
                    value={rootHealthState}
                    onChange={(e) => setRootHealthState(e.target.value as any)}
                    className="w-full h-8 text-xs rounded-md border bg-background px-2"
                  >
                    <option value="poor">{tr('Compacted / Poor Root Depth', 'تربة منضغطة / جذور ضعيفة')}</option>
                    <option value="standard">{tr('Standard Root Density', 'كثافة جذرية قياسية')}</option>
                    <option value="mycorrhizal">{tr('Inoculated Mycorrhizae (AMF)', 'ملقحة بمايكورايزا نشطة (AMF)')}</option>
                  </select>
                </div>

                {/* 4. Transpiration / VPD */}
                <div className="space-y-1.5 p-3 rounded-lg bg-muted/30 border">
                  <span className="text-xs font-semibold block">{tr('Transpiration Pull (VPD)', 'شدة النتح والطلب التبخري')}</span>
                  <select
                    value={transpirationDemand}
                    onChange={(e) => setTranspirationDemand(e.target.value as any)}
                    className="w-full h-8 text-xs rounded-md border bg-background px-2"
                  >
                    <option value="low">{tr('Low Transpiration (Humid/Cloudy)', 'نتح منخفض (رطوبة عالية/غائم)')}</option>
                    <option value="normal">{tr('Balanced Transpiration', 'نتح متوازن')}</option>
                    <option value="high">{tr('High VPD / Dry Winds', 'نتح مرتفع / رياح جافة وحارة')}</option>
                  </select>
                </div>
              </div>

              {/* Environmental Alerts Banner */}
              {soilTempC < 12 && (
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    {tr(
                      'Cold soil (<12°C) severely inhibits phosphorus diffusion by ~70%, causing purpling in early corn and stunted seedling root establishment.',
                      'التربة الباردة (<12°م) تثبط انتشار الفوسفور بنسبة 70% وتسبب اصفراراً وأرجوانية الأوراق وضعف تجذير الشتلات.'
                    )}
                  </span>
                </div>
              )}

              {soilMoisturePct < 30 && (
                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-xs text-red-900 dark:text-red-200 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>
                    {tr(
                      'Drought stress halts calcium and boron mass-flow delivery to growing fruit tips, triggering blossom-end rot and fruit cracking.',
                      'إجهاد الجفاف يوقف انتقال الكالسيوم والبورون بالتدفق الكتلي لأطراف الثمار مسبباً عفن طرف الزهرة والتشقق.'
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Nutrient Arrival Comparison Grid */}
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Stacked Percentage Bars for all Nutrients */}
              <div className="lg:col-span-7 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground pb-1">
                  <span>{tr('Nutrient / Dynamic Pathway Breakdown', 'العنصر / مسارات الوصول المحسوبة')}</span>
                  <span>{tr('Effective Delivery Efficiency', 'كفاءة الإمداد')}</span>
                </div>

                <div className="space-y-2">
                  {dynamicKinetics.map((row) => {
                    const isSelected = row.id === selectedKineticId;
                    return (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => setSelectedKineticId(row.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-xs'
                            : 'border-border bg-card hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-300">
                              {row.symbol}
                            </span>
                            <span className="text-xs font-semibold">{isAr ? row.name_ar : row.name}</span>
                          </div>
                          <Badge
                            variant={row.deliveryEfficiency >= 80 ? 'default' : row.deliveryEfficiency >= 50 ? 'secondary' : 'destructive'}
                            className="text-[10px]"
                          >
                            {row.deliveryEfficiency}% {tr('Capacity', 'الكفاءة')}
                          </Badge>
                        </div>

                        {/* Stacked Bar (Mass Flow | Diffusion | Interception) */}
                        <div className="flex h-3 rounded-full overflow-hidden bg-muted/60">
                          <div
                            style={{ width: `${row.currentMassFlowPct}%` }}
                            className="bg-blue-600 transition-all duration-300"
                            title={`Mass flow: ${row.currentMassFlowPct}%`}
                          />
                          <div
                            style={{ width: `${row.currentDiffusionPct}%` }}
                            className="bg-emerald-600 transition-all duration-300"
                            title={`Diffusion: ${row.currentDiffusionPct}%`}
                          />
                          <div
                            style={{ width: `${row.currentInterceptionPct}%` }}
                            className="bg-amber-600 transition-all duration-300"
                            title={`Root interception: ${row.currentInterceptionPct}%`}
                          />
                        </div>

                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
                          <span className="text-blue-600 dark:text-blue-400">
                            {tr('Mass Flow', 'تدفق كتلي')}: {row.currentMassFlowPct}%
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {tr('Diffusion', 'انتشار')}: {row.currentDiffusionPct}%
                          </span>
                          <span className="text-amber-600 dark:text-amber-400">
                            {tr('Interception', 'اعتراض جذري')}: {row.currentInterceptionPct}%
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: In-Depth Mechanistic Explanation */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-xl border bg-card shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div>
                      <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {currentDynamicNutrient.symbol}
                      </span>
                      <span className="text-sm font-bold ml-2">
                        {isAr ? currentDynamicNutrient.name_ar : currentDynamicNutrient.name}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {isAr ? currentDynamicNutrient.soilMobilityScore_ar : currentDynamicNutrient.soilMobilityScore}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <strong className="text-muted-foreground block mb-0.5">{tr('Mechanistic Uptake Dynamics:', 'آلية الانتقال والحركة:')}</strong>
                      <p className="text-foreground leading-relaxed">
                        {isAr ? currentDynamicNutrient.mechanisticNotes_ar : currentDynamicNutrient.mechanisticNotes}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="p-2 rounded-lg bg-muted/40 border">
                        <span className="text-[10px] text-muted-foreground block">{tr('Vulnerability to Drought', 'الحساسية للجفاف')}</span>
                        <span className="font-bold text-red-600">{currentDynamicNutrient.vulnerabilityToDrought}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/40 border">
                        <span className="text-[10px] text-muted-foreground block">{tr('Vulnerability to Cold Soil', 'الحساسية لبرودة التربة')}</span>
                        <span className="font-bold text-amber-600">{currentDynamicNutrient.vulnerabilityToColdSoil}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 Pathway Definitions Legend */}
                <div className="p-4 rounded-xl border bg-muted/20 space-y-2 text-xs">
                  <h4 className="font-bold text-xs">{tr('Key Transport Mechanisms Defined:', 'تعريف آليات الانتقال الرئيسية:')}</h4>
                  <div className="space-y-1.5 text-[11px] text-muted-foreground">
                    <div>
                      <strong className="text-blue-600 dark:text-blue-400">1. {tr('Mass Flow (Convection)', 'التدفق الكتلي')}:</strong>{' '}
                      {tr(
                        'Nutrients dissolved in soil solution travel directly with the water moving toward transpirating roots (NO₃⁻, Ca²⁺, Mg²⁺, SO₄²⁻).',
                        'حركة العناصر الذائبة مع تيار الماء المنجذب نحو الجذور بفعل نتح النبات (النترات، الكالسيوم، المغنيسيوم).'
                      )}
                    </div>
                    <div>
                      <strong className="text-emerald-600 dark:text-emerald-400">2. {tr('Diffusion (Concentration Gradient)', 'الانتشار الغشائي')}:</strong>{' '}
                      {tr(
                        'Nutrients move from high concentration in bulk soil to low concentration at the root surface (H₂PO₄⁻, K⁺, Zn²⁺).',
                        'انتقال الأيونات من مناطق التركيز العالي في التربة إلى منطقة الاستنزاف حول الجذور (الفوسفات، البوتاسيوم، الزنك).'
                      )}
                    </div>
                    <div>
                      <strong className="text-amber-600 dark:text-amber-400">3. {tr('Root Interception (Contact)', 'الاعتراض الجذري')}:</strong>{' '}
                      {tr(
                        'Direct physical contact between expanding root tips/hairs and soil colloids holding exchangeable ions.',
                        'التلامس المباشر بين القمم النامية والشعيرات الجذرية مع غرويات التربة الحاملة للأيونات.'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PLANT MOBILITY & DIAGNOSTIC WIZARD                                 */}
        {/* ========================================================================= */}
        {activeTab === 'mobility' && (
          <div className="space-y-6">
            {/* Visual Plant Tissue Zones Picker */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PLANT_ZONES.map((zone) => {
                const isSelected = zone.id === selectedZoneId;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => {
                      setSelectedZoneId(zone.id);
                      setWizardLocation(zone.id);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 shadow-xs'
                        : 'bg-card hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">{isAr ? zone.name_ar : zone.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {zone.affectedNutrients.join(', ')}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {isAr ? zone.description_ar : zone.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Diagnostic Troubleshooting Flow */}
            <div className="p-4 rounded-xl border bg-muted/20 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-bold">
                    {tr('Visual Foliar Diagnostic Troubleshooting Key', 'مفتاح التشخيص البصري لأعراض نقص العناصر')}
                  </h3>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <select
                    value={wizardLocation}
                    onChange={(e) => setWizardLocation(e.target.value as any)}
                    className="h-8 rounded-lg border bg-background px-2 text-xs"
                  >
                    <option value="all">{tr('All Canopy Positions', 'كافة مواقع المجموع الخضري')}</option>
                    <option value="lower">{tr('Bottom Old Leaves (Mobile N, P, K, Mg)', 'الأوراق السفلية المسنة')}</option>
                    <option value="young">{tr('Upper Young Leaves (Immobile Fe, Mn, Zn)', 'الأوراق العلوية الحديثة')}</option>
                    <option value="apical">{tr('Growing Tips / Fruits (Ca, B)', 'القمم النامية والثمار')}</option>
                  </select>

                  <select
                    value={wizardPattern}
                    onChange={(e) => setWizardPattern(e.target.value)}
                    className="h-8 rounded-lg border bg-background px-2 text-xs"
                  >
                    <option value="all">{tr('All Symptom Patterns', 'كافة أنماط الأعراض')}</option>
                    <option value="interveinal">{tr('Interveinal Chlorosis (Veins stay green)', 'اصفرار بين العروق')}</option>
                    <option value="marginal">{tr('Marginal Scorch / Edge Burn', 'احتراق الحواف')}</option>
                    <option value="uniform">{tr('Uniform Yellowing / Pale', 'اصفرار متجانس شامل')}</option>
                    <option value="purple">{tr('Purple / Red Anthocyanin', 'تلون أرجواني')}</option>
                    <option value="deformation">{tr('Deformed Shoot / Blossom-End Rot', 'تشوه القمة / عفن الزهرة')}</option>
                    <option value="rosette">{tr('Little Leaf / Rosette Clusters', 'صغر الأوراق والتورد')}</option>
                  </select>
                </div>
              </div>

              {/* Symptom Cards Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredDiagNodes.map((node) => {
                  const isSelected = node.id === selectedDiagNodeId;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedDiagNodeId(node.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-background shadow-md ring-2 ring-emerald-500/20'
                          : 'bg-card hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-foreground">{isAr ? node.name_ar : node.name}</span>
                        <Badge className="font-mono text-xs bg-emerald-600 text-white">
                          {node.matchingNutrient}
                        </Badge>
                      </div>

                      <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
                        {isAr ? node.patternLabel_ar : node.patternLabel}
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3 mb-2">
                        {isAr ? node.visualSummary_ar : node.visualSummary}
                      </p>

                      <div className="p-2 rounded-lg bg-muted/50 border text-[10px] text-muted-foreground">
                        <strong className="text-foreground">{tr('Fix:', 'العلاج:')} </strong>
                        {isAr ? node.correctionAction_ar : node.correctionAction}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SOIL PH AVAILABILITY SPECTRUM & SPECIATION                         */}
        {/* ========================================================================= */}
        {activeTab === 'ph' && (
          <div className="space-y-6">
            {/* Interactive Continuous pH Slider */}
            <div className="p-4 rounded-xl border bg-card shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold">
                    {tr('Interactive Soil pH Nutrient Availability & Speciation Spectrum', 'طيف توفر الأسمدة والتحولات الكيميائية حسب درجة حموضة التربة')}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {tr(
                      'Drag the slider to test soil reaction (pH 3.5 to 9.5) and observe chemical fixation, lockouts, and toxicities.',
                      'حرك المؤشر لاختبار درجة تفاعل التربة ومراقبة التثبيت الكيميائي والسمية والعناصر المتاحة.'
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">{tr('Current pH:', 'الحموضة الحالية:')}</span>
                  <div
                    className={`px-3 py-1 rounded-lg font-mono font-bold text-base ${
                      currentPh < 5.5
                        ? 'bg-red-500 text-white'
                        : currentPh <= 7.2
                        ? 'bg-emerald-600 text-white'
                        : currentPh <= 8.2
                        ? 'bg-amber-500 text-white'
                        : 'bg-purple-600 text-white'
                    }`}
                  >
                    pH {currentPh.toFixed(1)}
                  </div>
                </div>
              </div>

              {/* Slider with Color Gradient Track */}
              <div className="space-y-2 pt-1">
                <Slider
                  value={[currentPh]}
                  min={3.5}
                  max={9.5}
                  step={0.1}
                  onValueChange={([val]) => setCurrentPh(val)}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                  <span className="text-red-600">3.5 ({tr('Extreme Acid', 'حامضية شديدة')})</span>
                  <span className="text-amber-600">5.5 ({tr('Slightly Acid', 'حامضية خفيفة')})</span>
                  <span className="text-emerald-600">6.5 ({tr('Ideal Agronomic Zone', 'المثالية للزراعة')})</span>
                  <span className="text-blue-600">7.8 ({tr('Calcareous / Alkaline', 'كلسية قلوية')})</span>
                  <span className="text-purple-600">9.5 ({tr('Sodic Alkali', 'صودية قلوية')})</span>
                </div>
              </div>

              {/* Current pH Warning & Fertilizer Guidance Banner */}
              {currentPh > 7.6 && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs space-y-1 text-amber-900 dark:text-amber-200">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>{tr('Alkaline / Calcareous Soil Alert (pH > 7.6):', 'تنبيه الأراضي الكلسية القلوية (pH > 7.6):')}</span>
                  </div>
                  <p>
                    {tr(
                      'Free calcium carbonate precipitates iron, zinc, and phosphate. Regular Fe-EDTA is ineffective — use Fe-EDDHA (ortho-ortho) chelates and acidifying fertilizers (Ammonium sulfate, MAP, Urea phosphate).',
                      'كربونات الكالسيوم ترسب الحديد والزنك والفوسفات. الحديد العادي Fe-EDTA غير فعال — استخدم حديد Fe-EDDHA المخلبي عالي الأورثو وأسمدة ذات تأثير حامضي.'
                    )}
                  </p>
                </div>
              )}

              {currentPh < 5.2 && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-xs space-y-1 text-red-900 dark:text-red-200">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>{tr('Acid Soil & Aluminum Toxicity Alert (pH < 5.2):', 'تحذير سمية الألمنيوم في الأراضي الحامضية (pH < 5.2):')}</span>
                  </div>
                  <p>
                    {tr(
                      'Soluble toxic Al³⁺ and Mn²⁺ damage root tips. Phosphate is locked by iron/aluminum oxides. Apply Agricultural Limestone (CaCO₃) or Dolomite to raise pH above 6.0.',
                      'ذوبان الألمنيوم Al³⁺ والمنجنيز السامين يدمر القمم الجذرية، ويُثبت الفوسفات بأكاسيد الحديد. أضف الحجر الجيري الزراعي لرفع الحموضة فوق 6.0.'
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Live Availability Spectrum Bars for all Nutrients */}
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground pb-1">
                  <span>{tr('Nutrient Availability at current pH', 'نسبة التوفر المقدرة عند الحموضة الحالية')}</span>
                  <span>{tr('Relative Availability %', 'نسبة التوفر')}</span>
                </div>

                <div className="space-y-1.5">
                  {PH_NUTRIENTS.map((nutri) => {
                    const avail = phAvailabilityMap.get(nutri.id) ?? 0.5;
                    const availPct = Math.round(avail * 100);
                    const isSelected = nutri.id === selectedPhNutrientId;

                    return (
                      <button
                        key={nutri.id}
                        type="button"
                        onClick={() => setSelectedPhNutrientId(nutri.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-xs'
                            : 'border-border bg-card hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs" style={{ color: nutri.color }}>
                              {nutri.lab}
                            </span>
                            <span className="text-xs font-medium">{nutri.name}</span>
                          </div>
                          <span className="font-mono text-xs font-bold">{availPct}%</span>
                        </div>

                        {/* Progress Bar with Color */}
                        <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden">
                          <div
                            style={{ width: `${availPct}%`, backgroundColor: nutri.color }}
                            className="h-full rounded-full transition-all duration-300"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Chemical Speciation Notes */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-xl border bg-card shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold font-mono" style={{ color: selectedPhInfo.color }}>
                        {selectedPhInfo.lab}
                      </span>
                      <span className="text-sm font-bold">{selectedPhInfo.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {selectedPhInfo.tag}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{selectedPhInfo.intro}</p>

                  <div className="space-y-1.5 pt-2">
                    <strong className="text-xs text-foreground block">{tr('Soil Chemistry Principles:', 'مبادئ كيمياء التربة:')}</strong>
                    <ul className="text-xs space-y-1 list-disc pl-4 text-muted-foreground" dangerouslySetInnerHTML={{ __html: selectedPhInfo.bullets.map((b) => `<li>${b}</li>`).join('') }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: BASE CATION SATURATION RATIO (BCSR) CALCULATOR                     */}
        {/* ========================================================================= */}
        {activeTab === 'cation' && (
          <div className="space-y-6">
            {/* Cation Input Sliders */}
            <div className="p-4 rounded-xl border bg-card shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-bold">
                    {tr(
                      'Base Cation Saturation Ratio (BCSR) & Antagonism Balancer',
                      'موازن نسب تشبع الكاتيونات وقوة التضاد الأيوني في التربة',
                      'Équilibre des Cations Échangeables (BCSR)'
                    )}
                  </h3>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  {tr('Total Bases:', 'إجمالي القواعد:')} {cationResult.totalBasesMeq} cmol(+)/kg
                </Badge>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                {/* Ca */}
                <div className="p-3 rounded-lg bg-muted/30 border space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{tr('Calcium (Ca²⁺)', 'الكالسيوم')}</span>
                    <span className="font-mono text-amber-600">{soilCa} cmol</span>
                  </div>
                  <Slider value={[soilCa]} min={1} max={30} step={0.5} onValueChange={([v]) => setSoilCa(v)} />
                  <span className="text-[10px] text-muted-foreground block text-right">({cationResult.caPct}%)</span>
                </div>

                {/* Mg */}
                <div className="p-3 rounded-lg bg-muted/30 border space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{tr('Magnesium (Mg²⁺)', 'المغنيسيوم')}</span>
                    <span className="font-mono text-indigo-600">{soilMg} cmol</span>
                  </div>
                  <Slider value={[soilMg]} min={0.5} max={10} step={0.1} onValueChange={([v]) => setSoilMg(v)} />
                  <span className="text-[10px] text-muted-foreground block text-right">({cationResult.mgPct}%)</span>
                </div>

                {/* K */}
                <div className="p-3 rounded-lg bg-muted/30 border space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{tr('Potassium (K⁺)', 'البوتاسيوم')}</span>
                    <span className="font-mono text-purple-600">{soilK} cmol</span>
                  </div>
                  <Slider value={[soilK]} min={0.1} max={5} step={0.05} onValueChange={([v]) => setSoilK(v)} />
                  <span className="text-[10px] text-muted-foreground block text-right">({cationResult.kPct}%)</span>
                </div>

                {/* Na */}
                <div className="p-3 rounded-lg bg-muted/30 border space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{tr('Sodium (Na⁺)', 'الصوديوم')}</span>
                    <span className="font-mono text-red-600">{soilNa} cmol</span>
                  </div>
                  <Slider value={[soilNa]} min={0.05} max={4} step={0.05} onValueChange={([v]) => setSoilNa(v)} />
                  <span className="text-[10px] text-muted-foreground block text-right">({cationResult.naPct}%)</span>
                </div>

                {/* NH4 */}
                <div className="p-3 rounded-lg bg-muted/30 border space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{tr('Ammonium (NH₄⁺)', 'الأمونيوم')}</span>
                    <span className="font-mono text-emerald-600">{soilNh4} cmol</span>
                  </div>
                  <Slider value={[soilNh4]} min={0} max={2} step={0.05} onValueChange={([v]) => setSoilNh4(v)} />
                  <span className="text-[10px] text-muted-foreground block text-right">
                    ({((soilNh4 / cationResult.totalBasesMeq) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Diagnostic Critical Ratios Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* K:Mg Ratio */}
              <div className="p-4 rounded-xl border bg-card shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">{tr('K : Mg Ratio', 'نسبة البوتاسيوم للمغنيسيوم')}</span>
                  <Badge variant={cationResult.kToMgRatio > 0.5 ? 'destructive' : 'default'} className="text-[10px]">
                    {cationResult.kToMgRatio > 0.5 ? tr('High Risk', 'خطر تضاد') : tr('Balanced', 'متوازن')}
                  </Badge>
                </div>
                <div className="text-2xl font-bold font-mono text-purple-600">{cationResult.kToMgRatio} : 1</div>
                <div className="text-[11px] text-muted-foreground">
                  {tr('Ideal range: 0.20 to 0.40. Above 0.50 induces Mg deficiency.', 'المثالي: 0.20 إلى 0.40. فوق 0.50 يحجب المغنيسيوم.')}
                </div>
              </div>

              {/* Ca:Mg Ratio */}
              <div className="p-4 rounded-xl border bg-card shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">{tr('Ca : Mg Ratio', 'نسبة الكالسيوم للمغنيسيوم')}</span>
                  <Badge variant={cationResult.caToMgRatio < 3.5 ? 'destructive' : 'default'} className="text-[10px]">
                    {cationResult.caToMgRatio < 3.5 ? tr('Low Ca', 'كالسيوم ضعيف') : tr('Optimal', 'ممتاز')}
                  </Badge>
                </div>
                <div className="text-2xl font-bold font-mono text-amber-600">{cationResult.caToMgRatio} : 1</div>
                <div className="text-[11px] text-muted-foreground">
                  {tr('Ideal range: 5.0 to 7.0 for crumb soil structure and root respiration.', 'المثالي: 5.0 إلى 7.0 لتهوية وتماسك حبيبات التربة.')}
                </div>
              </div>

              {/* Antagonism Index */}
              <div className="p-4 rounded-xl border bg-card shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">{tr('(K+NH₄):(Ca+Mg)', 'مؤشر التضاد الكاتيوني')}</span>
                  <Badge variant={cationResult.antagonismIndex > 0.35 ? 'destructive' : 'default'} className="text-[10px]">
                    {cationResult.antagonismIndex > 0.35 ? tr('BER Alert', 'خطر عفن القمة') : tr('Safe', 'آمن')}
                  </Badge>
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-600">{cationResult.antagonismIndex}</div>
                <div className="text-[11px] text-muted-foreground">
                  {tr('Above 0.40 strongly suppresses Ca/Mg fruit loading in tomato & peppers.', 'فوق 0.40 يسبب عفن طرف الزهرة في الطماطم والفلفل.')}
                </div>
              </div>

              {/* ESP (Exchangeable Sodium) */}
              <div className="p-4 rounded-xl border bg-card shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">{tr('ESP (Sodium %)', 'نسبة الصوديوم المتبادل')}</span>
                  <Badge variant={cationResult.naPct > 8 ? 'destructive' : 'default'} className="text-[10px]">
                    {cationResult.naPct > 8 ? tr('Sodic', 'صودية') : tr('Non-Sodic', 'سليمة')}
                  </Badge>
                </div>
                <div className="text-2xl font-bold font-mono text-red-600">{cationResult.naPct}%</div>
                <div className="text-[11px] text-muted-foreground">
                  {tr('Above 8% causes clay dispersion and water stagnation.', 'فوق 8% يؤدي لتفكك الطين وتصلب التربة وركود الماء.')}
                </div>
              </div>
            </div>

            {/* Diagnostic Assessment Banner */}
            <div className="p-4 rounded-xl border bg-muted/30 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-emerald-600" />
                <span className="font-bold text-sm">
                  {isAr ? cationResult.status_ar : cationResult.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isAr ? cationResult.recommendation_ar : cationResult.recommendation}
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: BOTANICAL PLANT DEFICIENCY & RECOVERY GUIDE                         */}
        {/* ========================================================================= */}
        {activeTab === 'plant-deficiency' && (
          <div className="space-y-4">
            <PlantDeficiencyVisualizer />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: TOMATO PATHOLOGY & DISEASE LOCATION MAP                             */}
        {/* ========================================================================= */}
        {activeTab === 'tomato-diseases' && (
          <div className="space-y-4">
            <TomatoDiseaseVisualizer />
          </div>
        )}
      </div>
    </CalculatorShell>
  );
}
