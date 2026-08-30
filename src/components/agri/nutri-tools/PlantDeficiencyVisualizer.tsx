'use client';

import React, { useState, useMemo } from 'react';
import {
  Sprout,
  AlertTriangle,
  Sparkles,
  Droplets,
  Layers,
  Search,
  CheckCircle2,
  Printer,
  Info,
  ArrowRight,
  ShieldAlert,
  Beaker,
  Thermometer,
  Zap,
  Activity,
  HeartCrack,
  Flame,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  PLANT_ORGANS,
  PLANT_DEFICIENCIES_DATA,
  PlantOrganDeficiency,
} from '@/lib/plant-deficiency-data';
import {
  CalculatorShell,
  type TrilingualString, type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

const TITLE: TrilingualString = {
  en: 'Interactive Botanical Plant Deficiency & Recovery Guide',
  ar: 'الدليل التفاعلي لتشخيص وعلاج نقص العناصر حسب أعضاء النبات',
  fr: 'Guide Interactif des Carences et Correction par Organe Végétal',
};

const DESC: TrilingualString = {
  en: 'Click any plant organ (Roots, Stem, Leaves, Flower, Fruit) to discover exact deficiency symptoms, microscopic causes & precision emergency recipes.',
  ar: 'اضغط على أي جزء من أجزاء النبات (الجذور، الساق، الأوراق، الأزهار، الثمار) لمعاينة أعراض النقص والجرعات العلاجية.',
  fr: 'Cliquez sur un organe végétal pour explorer les symptômes de carence, mécanismes cellulaires et protocoles de correction.',
};

const PILL_LABEL: TrilingualString = { en: 'Organ:', ar: 'العضو:', fr: 'Organe :' };

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Mobile nutrients (N, P, K, Mg, Mo) show deficiency on OLD/LOWER leaves first. Immobile nutrients (Ca, B, Fe, Mn, Zn, Cu) show deficiency on YOUNG/TOP shoots first. Apply foliar sprays at the correct growth stage for fastest recovery.',
  ar: 'العناصر المتحركة (N, P, K, Mg, Mo) تُظهر النقص على الأوراق السفلية القديمة أولاً. العناصر غير المتحركة (Ca, B, Fe, Mn, Zn, Cu) تُظهر النقص على القمم النامية أولاً. رش ورقي في المرحلة المناسبة لأسرع تعافي.',
  fr: 'Les éléments mobiles (N, P, K, Mg, Mo) montrent une carence sur les VIEILLES feuilles. Les éléments immobiles (Ca, B, Fe, Mn, Zn, Cu) sur les JEUNNES pousses. Pulvérisation foliaire au bon stade.',
};

export function PlantDeficiencyVisualizer() {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const isFr = language === 'fr';

  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  // Active Organ selection
  const [selectedOrgan, setSelectedOrgan] = useState<string>('fruits');
  const [selectedDeficiencyId, setSelectedDeficiencyId] = useState<string>('fruit-ca-ber');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobilityFilter, setMobilityFilter] = useState<'all' | 'mobile' | 'immobile'>('all');

  // Filtered Deficiencies by Organ & Search
  const activeOrganDeficiencies = useMemo(() => {
    return PLANT_DEFICIENCIES_DATA.filter((item) => {
      const matchesOrgan = selectedOrgan === 'all' || item.organ === selectedOrgan;
      const matchesMobility = mobilityFilter === 'all' || item.mobility === mobilityFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        item.nutrient.toLowerCase().includes(query) ||
        item.chemicalSymbol.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query) ||
        item.title_ar.includes(query) ||
        item.symptomSummary.toLowerCase().includes(query) ||
        item.symptomSummary_ar.includes(query);

      return matchesOrgan && matchesMobility && matchesQuery;
    });
  }, [selectedOrgan, mobilityFilter, searchQuery]);

  const activeDeficiency = useMemo(() => {
    const found = PLANT_DEFICIENCIES_DATA.find((d) => d.id === selectedDeficiencyId);
    if (found) return found;
    return activeOrganDeficiencies[0] || PLANT_DEFICIENCIES_DATA[0];
  }, [selectedDeficiencyId, activeOrganDeficiencies]);

  const organMeta = useMemo(() => {
    return PLANT_ORGANS.find((o) => o.id === selectedOrgan) || PLANT_ORGANS[6];
  }, [selectedOrgan]);

  const pills: CalculatorPill[] = [
    { key: 'all', emoji: '🌐', label: tr('All Organs', 'كل الأعضاء', 'Tous') },
    ...PLANT_ORGANS.map((o) => ({
      key: o.id,
      label: isAr ? o.label_ar : isFr ? o.label_fr : o.label,
    })),
  ];

  const handlePillClick = (key: string) => {
    setSelectedOrgan(key);
    if (key !== 'all') {
      const firstInOrgan = PLANT_DEFICIENCIES_DATA.find((d) => d.organ === key);
      if (firstInOrgan) setSelectedDeficiencyId(firstInOrgan.id);
    }
  };

  const handleReset = () => {
    setSelectedOrgan('fruits');
    setSelectedDeficiencyId('fruit-ca-ber');
    setSearchQuery('');
    setMobilityFilter('all');
    toast({ title: tr('Reset', 'إعادة تعيين', 'Réinitialiser') });
  };

  return (
    <CalculatorShell
      icon={Sprout}
      title={TITLE}
      description={DESC}
      badge="Plant Nutrition"
      accent="amber"
      actions={[
        {
          icon: Printer,
          label: { en: 'Print / PDF', ar: 'طباعة / PDF', fr: 'Imprimer' },
          onClick: () => window.print(),
          variant: 'primary',
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      pills={pills}
      activePill={selectedOrgan}
      onPillClick={handlePillClick}
      pillLabel={PILL_LABEL}
      protocolNote={PROTOCOL_NOTE}
    >
      <div className="lg:col-span-12 space-y-6">
        {/* Main 2-Column Grid: Left is Botanical SVG, Right is Deficiency Explorer & Protocol */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          
          {/* ========================================================================= */}
          {/* COLUMN 1: INTERACTIVE BOTANICAL PLANT ANATOMY SVG                        */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 flex flex-col items-center p-4 rounded-2xl bg-gradient-to-b from-emerald-50/30 via-background to-amber-50/20 dark:from-emerald-950/10 dark:to-amber-950/10 border relative overflow-hidden shadow-xs">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Sprout className="h-4 w-4 text-emerald-600" />
                <span>{tr('Botanical Plant Anatomy', 'التشريح النباتي التفاعلي', 'Anatomie Végétale')}</span>
              </span>
              <Badge variant="outline" className="text-[10px]">
                {tr('Click any part to inspect', 'اضغط العضو للمعاينة', 'Cliquer pour inspecter')}
              </Badge>
            </div>

            {/* Botanical SVG Drawing */}
            <div className="w-full max-w-xs sm:max-w-sm relative select-none">
              <svg viewBox="0 0 320 480" className="w-full h-auto drop-shadow-sm">
                <defs>
                  <linearGradient id="stemGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#15803d" />
                    <stop offset="50%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#166534" />
                  </linearGradient>
                  <linearGradient id="soilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#78350f" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#451a03" stopOpacity="0.8" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="glow" />
                    <feComposite in="SourceGraphic" in2="glow" operator="over" />
                  </filter>
                </defs>

                {/* Soil Line & Horizon */}
                <rect x="10" y="340" width="300" height="130" rx="10" fill="url(#soilGrad)" opacity="0.4" />
                <line x1="10" y1="340" x2="310" y2="340" stroke="#78350f" strokeWidth="2.5" strokeDasharray="4 2" />
                <text x="25" y="355" fill="#78350f" fontSize="10" fontWeight="bold" opacity="0.8">
                  {tr('Soil Level / Rhizosphere', 'مستوى التربة / الريزوسفير', 'Niveau du Sol')}
                </text>

                {/* 1. ROOT SYSTEM (Zone: roots) */}
                <g
                  onClick={() => setSelectedOrgan('roots')}
                  className={`cursor-pointer transition-all duration-300 ${selectedOrgan === 'roots' ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
                >
                  {/* Taproot */}
                  <path d="M 160 340 Q 160 390 155 450" fill="none" stroke="#92400e" strokeWidth={selectedOrgan === 'roots' ? 5 : 3.5} strokeLinecap="round" />
                  {/* Lateral Roots */}
                  <path d="M 160 355 Q 120 370 70 380 Q 45 390 35 410" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 160 370 Q 200 385 250 400 Q 280 415 290 440" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 158 395 Q 110 415 90 445" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
                  <path d="M 156 415 Q 190 435 220 455" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
                  {/* Root hairs */}
                  <path d="M 70 380 Q 60 395 55 405 M 120 370 Q 115 385 110 395 M 250 400 Q 260 415 265 425" fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="2 2" />
                  
                  {/* Root Hotspot Badge */}
                  <g transform="translate(160, 410)">
                    <circle cx="0" cy="0" r="16" fill={selectedOrgan === 'roots' ? '#92400e' : '#ffffff'} stroke="#92400e" strokeWidth="2" className={selectedOrgan === 'roots' ? 'animate-pulse' : ''} />
                    <text x="0" y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill={selectedOrgan === 'roots' ? '#ffffff' : '#92400e'} className="font-mono">P, Ca</text>
                  </g>
                </g>

                {/* 2. MAIN VASCULAR STEM (Zone: stem) */}
                <g
                  onClick={() => setSelectedOrgan('stem')}
                  className={`cursor-pointer transition-all duration-300 ${selectedOrgan === 'stem' ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
                >
                  <path d="M 160 340 Q 160 220 160 70" fill="none" stroke="url(#stemGrad)" strokeWidth={selectedOrgan === 'stem' ? 9 : 6.5} strokeLinecap="round" />
                  {/* Internal Xylem / Phloem Lines */}
                  <path d="M 158 335 Q 158 220 158 80" fill="none" stroke="#86efac" strokeWidth="1.2" strokeDasharray="3 2" />
                  <path d="M 162 335 Q 162 220 162 80" fill="none" stroke="#3b82f6" strokeWidth="1.2" strokeDasharray="3 2" />

                  {/* Stem Hotspot */}
                  <g transform="translate(160, 260)">
                    <circle cx="0" cy="0" r="13" fill={selectedOrgan === 'stem' ? '#16a34a' : '#ffffff'} stroke="#16a34a" strokeWidth="2" />
                    <text x="0" y="3.5" textAnchor="middle" fontSize="8" fontWeight="bold" fill={selectedOrgan === 'stem' ? '#ffffff' : '#16a34a'} className="font-mono">K</text>
                  </g>
                </g>

                {/* 3. LOWER / MATURE LEAVES (Zone: lower_leaves) */}
                <g
                  onClick={() => setSelectedOrgan('lower_leaves')}
                  className={`cursor-pointer transition-all duration-300 ${selectedOrgan === 'lower_leaves' ? 'opacity-100' : 'opacity-85 hover:opacity-100'}`}
                >
                  {/* Left Lower Leaf */}
                  <path d="M 160 300 Q 110 305 60 315 Q 40 285 80 270 Q 125 275 160 295" fill={selectedOrgan === 'lower_leaves' ? '#a3e635' : '#84cc16'} stroke="#4d7c0f" strokeWidth="1.8" />
                  <path d="M 160 295 Q 110 290 60 315" fill="none" stroke="#4d7c0f" strokeWidth="1.2" />
                  <path d="M 110 292 Q 100 280 85 275 M 130 294 Q 120 283 105 278" fill="none" stroke="#4d7c0f" strokeWidth="0.8" />
                  {/* Left chlorosis/scorch simulation */}
                  <path d="M 60 315 Q 50 295 80 270" fill="none" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />

                  {/* Right Lower Leaf */}
                  <path d="M 160 275 Q 210 280 260 290 Q 280 260 240 245 Q 195 250 160 270" fill={selectedOrgan === 'lower_leaves' ? '#a3e635' : '#84cc16'} stroke="#4d7c0f" strokeWidth="1.8" />
                  <path d="M 160 270 Q 210 265 260 290" fill="none" stroke="#4d7c0f" strokeWidth="1.2" />
                  {/* Inverted V chlorosis marker */}
                  <polygon points="210,268 230,255 245,280" fill="#facc15" opacity="0.6" />

                  {/* Lower Leaf Hotspot */}
                  <g transform="translate(60, 270)">
                    <circle cx="0" cy="0" r="16" fill={selectedOrgan === 'lower_leaves' ? '#65a30d' : '#ffffff'} stroke="#65a30d" strokeWidth="2" className={selectedOrgan === 'lower_leaves' ? 'animate-pulse' : ''} />
                    <text x="0" y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill={selectedOrgan === 'lower_leaves' ? '#ffffff' : '#65a30d'} className="font-mono">N,Mg,K</text>
                  </g>
                </g>

                {/* 4. UPPER / YOUNG LEAVES (Zone: upper_leaves) */}
                <g
                  onClick={() => setSelectedOrgan('upper_leaves')}
                  className={`cursor-pointer transition-all duration-300 ${selectedOrgan === 'upper_leaves' ? 'opacity-100' : 'opacity-85 hover:opacity-100'}`}
                >
                  {/* Left Mid-Upper Leaf */}
                  <path d="M 160 190 Q 115 175 75 165 Q 65 140 100 135 Q 135 150 160 185" fill={selectedOrgan === 'upper_leaves' ? '#86efac' : '#4ade80'} stroke="#15803d" strokeWidth="1.8" />
                  <path d="M 160 185 Q 115 165 75 165" fill="none" stroke="#15803d" strokeWidth="1.2" />
                  {/* Fine iron mesh veins */}
                  <path d="M 115 167 Q 105 150 95 142 M 135 173 Q 125 157 115 148" fill="none" stroke="#166534" strokeWidth="0.8" />

                  {/* Right Mid-Upper Leaf */}
                  <path d="M 160 160 Q 205 145 245 135 Q 255 110 220 105 Q 185 120 160 155" fill={selectedOrgan === 'upper_leaves' ? '#86efac' : '#4ade80'} stroke="#15803d" strokeWidth="1.8" />
                  <path d="M 160 155 Q 205 135 245 135" fill="none" stroke="#15803d" strokeWidth="1.2" />

                  {/* Upper Leaf Hotspot */}
                  <g transform="translate(260, 125)">
                    <circle cx="0" cy="0" r="16" fill={selectedOrgan === 'upper_leaves' ? '#10b981' : '#ffffff'} stroke="#10b981" strokeWidth="2" className={selectedOrgan === 'upper_leaves' ? 'animate-pulse' : ''} />
                    <text x="0" y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill={selectedOrgan === 'upper_leaves' ? '#ffffff' : '#10b981'} className="font-mono">Fe,Mn,Zn</text>
                  </g>
                </g>

                {/* 5. APICAL MERISTEM / SHOOT TIP (Zone: apical_meristem) */}
                <g
                  onClick={() => setSelectedOrgan('apical_meristem')}
                  className={`cursor-pointer transition-all duration-300 ${selectedOrgan === 'apical_meristem' ? 'opacity-100' : 'opacity-85 hover:opacity-100'}`}
                >
                  {/* Terminal Leaves forming crown */}
                  <path d="M 160 70 Q 145 40 135 25 Q 155 20 160 45" fill={selectedOrgan === 'apical_meristem' ? '#22c55e' : '#16a34a'} stroke="#14532d" strokeWidth="1.5" />
                  <path d="M 160 70 Q 175 40 185 25 Q 165 20 160 45" fill={selectedOrgan === 'apical_meristem' ? '#22c55e' : '#16a34a'} stroke="#14532d" strokeWidth="1.5" />
                  <path d="M 160 45 Q 160 15 160 10" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Necrotic Hook Tip marker */}
                  <circle cx="160" cy="10" r="3.5" fill="#991b1b" />

                  {/* Apical Hotspot */}
                  <g transform="translate(160, 35)">
                    <circle cx="0" cy="0" r="15" fill={selectedOrgan === 'apical_meristem' ? '#059669' : '#ffffff'} stroke="#059669" strokeWidth="2" className={selectedOrgan === 'apical_meristem' ? 'animate-pulse' : ''} />
                    <text x="0" y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill={selectedOrgan === 'apical_meristem' ? '#ffffff' : '#059669'} className="font-mono">Ca, B</text>
                  </g>
                </g>

                {/* 6. FLOWERS & INFLORESCENCE (Zone: flowers) */}
                <g
                  onClick={() => setSelectedOrgan('flowers')}
                  className={`cursor-pointer transition-all duration-300 ${selectedOrgan === 'flowers' ? 'opacity-100' : 'opacity-85 hover:opacity-100'}`}
                >
                  {/* Flower truss branch */}
                  <path d="M 160 120 Q 130 110 100 100" fill="none" stroke="#15803d" strokeWidth="2" />
                  {/* Flower 1 (Yellow petals) */}
                  <g transform="translate(100, 100)">
                    <circle cx="0" cy="0" r="4" fill="#ca8a04" />
                    <path d="M 0 -8 L 3 -3 L 8 0 L 3 3 L 0 8 L -3 3 L -8 0 L -3 -3 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
                  </g>
                  {/* Flower 2 (Drop/Abscission) */}
                  <g transform="translate(120, 107)">
                    <circle cx="0" cy="0" r="3" fill="#ca8a04" />
                    <path d="M 0 -6 L 2 -2 L 6 0 L 2 2 L 0 6 L -2 2 L -6 0 L -2 -2 Z" fill="#fde047" stroke="#ca8a04" strokeWidth="0.6" />
                  </g>

                  {/* Flower Hotspot */}
                  <g transform="translate(75, 90)">
                    <circle cx="0" cy="0" r="14" fill={selectedOrgan === 'flowers' ? '#eab308' : '#ffffff'} stroke="#eab308" strokeWidth="2" className={selectedOrgan === 'flowers' ? 'animate-pulse' : ''} />
                    <text x="0" y="3.5" textAnchor="middle" fontSize="8" fontWeight="bold" fill={selectedOrgan === 'flowers' ? '#ffffff' : '#eab308'} className="font-mono">B,Mo</text>
                  </g>
                </g>

                {/* 7. FRUITS / BERRIES (Zone: fruits) */}
                <g
                  onClick={() => setSelectedOrgan('fruits')}
                  className={`cursor-pointer transition-all duration-300 ${selectedOrgan === 'fruits' ? 'opacity-100' : 'opacity-85 hover:opacity-100'}`}
                >
                  {/* Fruit truss branch */}
                  <path d="M 160 215 Q 195 210 220 220" fill="none" stroke="#15803d" strokeWidth="2.5" />

                  {/* Fruit 1 (Red Tomato with Blossom-End Rot black patch) */}
                  <g transform="translate(230, 240)">
                    <circle cx="0" cy="0" r="22" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5" />
                    {/* Calyx sepals */}
                    <path d="M -8 -20 L 0 -15 L 8 -20 M -12 -16 L 0 -15 L 12 -16" stroke="#15803d" strokeWidth="2" fill="none" />
                    {/* Blossom End Rot Black Crater */}
                    <ellipse cx="0" cy="18" rx="11" ry="5" fill="#18181b" stroke="#09090b" strokeWidth="1" />
                  </g>

                  {/* Fruit 2 (Green immature tomato with yellow shoulder) */}
                  <g transform="translate(200, 215)">
                    <circle cx="0" cy="0" r="14" fill="#84cc16" stroke="#4d7c0f" strokeWidth="1" />
                    <path d="M -10 -5 Q 0 -14 10 -5" fill="#facc15" opacity="0.8" />
                  </g>

                  {/* Fruit Hotspot */}
                  <g transform="translate(265, 275)">
                    <circle cx="0" cy="0" r="16" fill={selectedOrgan === 'fruits' ? '#dc2626' : '#ffffff'} stroke="#dc2626" strokeWidth="2" className={selectedOrgan === 'fruits' ? 'animate-pulse' : ''} />
                    <text x="0" y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill={selectedOrgan === 'fruits' ? '#ffffff' : '#dc2626'} className="font-mono">Ca, K</text>
                  </g>
                </g>
              </svg>
            </div>

            {/* Phloem Mobility Legend & Translocation Rule */}
            <div className="w-full mt-3 p-3 rounded-xl bg-background border text-xs space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                  <Activity className="h-3.5 w-3.5" />
                  <span>{tr('Plant Phloem Translocation Rule', 'قاعدة حركة العناصر في اللحاء')}</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-lime-50 dark:bg-lime-950/30 border border-lime-200 dark:border-lime-900/40">
                  <span className="font-bold text-lime-800 dark:text-lime-300 block mb-0.5">
                    {tr('Mobile Elements (N, P, K, Mg, Mo)', 'عناصر متحركة (N, P, K, Mg, Mo)')}
                  </span>
                  <p className="text-muted-foreground">
                    {tr('Plant relocates nutrient from old lower leaves to top shoots. Deficiency appears on OLD/LOWER leaves first.', 'ينقلها النبات من القديم للحديث؛ يظهر النقص على الأوراق السفلية أولاً.')}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                    {tr('Immobile Elements (Ca, B, Fe, Mn, Zn, Cu)', 'عناصر غير متحركة (Ca, B, Fe, Mn, Zn)')}
                  </span>
                  <p className="text-muted-foreground">
                    {tr('Locked in older tissue; cannot relocate. Deficiency appears on TOP/YOUNG shoots, flowers & fruits first.', 'مثبتة في الأنسجة القديمة؛ يظهر النقص على القمم والأوراق الحديثة والثمار.')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* COLUMN 2: DEFICIENCY DIAGNOSTIC & CORRECTION RECIPE EXPLORER              */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Search & Filter Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={tr('Search nutrient (e.g. Calcium, BER, Iron, Nitrogen)...', 'ابحث عن العنصر أو العرض (كالسيوم، حديد، نتروجين)...', 'Rechercher un élément...')}
                  className="pl-8 h-8 text-xs w-full"
                />
              </div>

              <div className="flex items-center gap-1 w-full sm:w-auto shrink-0">
                <Button
                  type="button"
                  variant={mobilityFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMobilityFilter('all')}
                  className="h-8 text-xs px-2.5 flex-1 sm:flex-none"
                >
                  {tr('All', 'الكل', 'Tous')}
                </Button>
                <Button
                  type="button"
                  variant={mobilityFilter === 'mobile' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMobilityFilter('mobile')}
                  className="h-8 text-xs px-2.5 flex-1 sm:flex-none"
                >
                  {tr('Mobile', 'متحركة', 'Mobiles')}
                </Button>
                <Button
                  type="button"
                  variant={mobilityFilter === 'immobile' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMobilityFilter('immobile')}
                  className="h-8 text-xs px-2.5 flex-1 sm:flex-none"
                >
                  {tr('Immobile', 'غير متحركة', 'Immobiles')}
                </Button>
              </div>
            </div>

            {/* List of Available Deficiencies in Selected Organ */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">
                  {tr('Detected Deficiencies for', 'حالات النقص المسجلة في')} {isAr ? organMeta.label_ar : organMeta.label} ({activeOrganDeficiencies.length})
                </span>
                <span className="text-[11px] text-muted-foreground">{tr('Select to view treatment recipe', 'اختر لمعاينة برنامج العلاج')}</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-2">
                {activeOrganDeficiencies.map((def) => {
                  const isSelected = def.id === activeDeficiency.id;
                  return (
                    <div
                      key={def.id}
                      onClick={() => setSelectedDeficiencyId(def.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/30 shadow-xs ring-1 ring-amber-600'
                          : 'border-border bg-card hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-amber-700 dark:text-amber-400 font-mono">
                              {def.chemicalSymbol}
                            </span>
                            <Badge variant="outline" className="text-[9px] py-0 px-1.5 uppercase">
                              {def.mobility}
                            </Badge>
                          </div>
                          <h4 className="font-bold text-xs mt-1 line-clamp-1">
                            {isAr ? def.title_ar : isFr ? def.title_fr : def.title}
                          </h4>
                        </div>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-snug">
                        {isAr ? def.symptomSummary_ar : isFr ? def.symptomSummary_fr : def.symptomSummary}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* In-Depth Selected Deficiency Detail & Prescription Card */}
            {activeDeficiency && (
              <div className="p-4 rounded-xl border bg-card shadow-xs space-y-4">
                
                {/* Header Profile */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-600 text-white hover:bg-amber-700 text-xs font-mono">
                        {activeDeficiency.chemicalSymbol}
                      </Badge>
                      <h3 className="text-sm md:text-base font-bold">
                        {isAr ? activeDeficiency.title_ar : isFr ? activeDeficiency.title_fr : activeDeficiency.title}
                      </h3>
                    </div>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      {tr('Target Plant Organ:', 'العضو المصاب:')} <strong className="text-foreground">{activeDeficiency.organ.replace('_', ' ')}</strong> | {tr('Mobility in Phloem:', 'الحركية في اللحاء:')} <strong className="text-foreground">{activeDeficiency.mobility}</strong>
                    </span>
                  </div>
                  <Badge variant={activeDeficiency.severity === 'critical' ? 'destructive' : 'secondary'} className="text-[10px] uppercase tracking-wider self-start sm:self-auto">
                    {activeDeficiency.severity} {tr('Impact', 'التأثير')}
                  </Badge>
                </div>

                {/* Cellular Mechanism & Symptom Overview */}
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-muted/40 border space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-foreground">
                      <Zap className="h-3.5 w-3.5 text-amber-600" />
                      <span>{tr('Cellular & Biochemical Role', 'الدور الخلوي والحيوي')}</span>
                    </span>
                    <p className="text-muted-foreground leading-relaxed">
                      {isAr ? activeDeficiency.cellularRole_ar : isFr ? activeDeficiency.cellularRole_fr : activeDeficiency.cellularRole}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40 border space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-foreground">
                      <HeartCrack className="h-3.5 w-3.5 text-red-600" />
                      <span>{tr('Lookalikes & Confounders', 'أعراض مشابهة يجب الحذر منها')}</span>
                    </span>
                    <p className="text-muted-foreground leading-relaxed">
                      {isAr ? activeDeficiency.lookalikes_ar : activeDeficiency.lookalikes}
                    </p>
                  </div>
                </div>

                {/* Visual Diagnostic Checklist */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{tr('Key Visual Diagnostic Checklist', 'قائمة علامات الفحص البصري الحقلية')}</span>
                  </span>
                  <div className="grid sm:grid-cols-2 gap-1.5">
                    {(isAr ? activeDeficiency.visualDiagnosticKeys_ar : isFr ? activeDeficiency.visualDiagnosticKeys_fr : activeDeficiency.visualDiagnosticKeys).map((key, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 p-2 rounded-lg bg-background border text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                        <span className="leading-snug">{key}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* EMERGENCY FOLIAR CORRECTION RECIPE */}
                <div className="p-3.5 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <Droplets className="h-4 w-4 text-emerald-600" />
                      <span>{tr('⚡ Emergency Foliar Correction Protocol', '⚡ وصفة الرش الورقي العلاجية السريعة')}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-emerald-400 text-emerald-700 dark:text-emerald-300">
                      {tr('Fast Absorption', 'امتصاص فوري')}
                    </Badge>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-2 text-xs pt-1">
                    <div className="p-2 rounded-lg bg-background/80 border">
                      <span className="text-[10px] text-muted-foreground block">{tr('Recommended Product', 'المركب الموصى به')}</span>
                      <strong className="text-emerald-700 dark:text-emerald-300 block mt-0.5">
                        {isAr ? activeDeficiency.emergencyFoliarRecipe.product_ar : isFr ? activeDeficiency.emergencyFoliarRecipe.product_fr : activeDeficiency.emergencyFoliarRecipe.product}
                      </strong>
                    </div>

                    <div className="p-2 rounded-lg bg-background/80 border">
                      <span className="text-[10px] text-muted-foreground block">{tr('Exact Dosage Rate', 'الجرعة الدقيقة')}</span>
                      <strong className="text-foreground block mt-0.5 font-mono">
                        {isAr ? activeDeficiency.emergencyFoliarRecipe.dosage_ar : activeDeficiency.emergencyFoliarRecipe.dosage}
                      </strong>
                    </div>

                    <div className="p-2 rounded-lg bg-background/80 border">
                      <span className="text-[10px] text-muted-foreground block">{tr('Application Timing', 'توقيت التطبيق')}</span>
                      <span className="text-muted-foreground block mt-0.5 text-[11px]">
                        {isAr ? activeDeficiency.emergencyFoliarRecipe.timing_ar : activeDeficiency.emergencyFoliarRecipe.timing}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-900/40">
                    <strong>{tr('Tank-Mix Warning:', 'تنبيه خلط الرش:')}</strong> {isAr ? activeDeficiency.emergencyFoliarRecipe.precautions_ar : activeDeficiency.emergencyFoliarRecipe.precautions}
                  </p>
                </div>

                {/* LONG-TERM FERTIGATION & SOIL PROGRAM */}
                <div className="p-3.5 rounded-xl border bg-muted/30 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <Beaker className="h-4 w-4 text-emerald-600" />
                    <span>{tr('Long-Term Fertigation & Soil Conditioning', 'برنامج التسميد الأرضي والتسميد بالتنقيط')}</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap gap-1.5">
                      {(isAr ? activeDeficiency.fertigationSoilProgram.fertilizers_ar : activeDeficiency.fertigationSoilProgram.fertilizers).map((f, i) => (
                        <Badge key={i} variant="secondary" className="text-[11px] font-normal">
                          {f}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground pt-1">
                      <strong>{tr('Soil pH / Root Chemistry:', 'ضبط pH التربة:')}</strong> {isAr ? activeDeficiency.fertigationSoilProgram.soilPhCorrection_ar : activeDeficiency.fertigationSoilProgram.soilPhCorrection}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      <strong>{tr('Antagonism Avoidance:', 'تجنب التضاد والتنافس:')}</strong> {isAr ? activeDeficiency.fertigationSoilProgram.antagonismAvoidance_ar : activeDeficiency.fertigationSoilProgram.antagonismAvoidance}
                    </p>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </CalculatorShell>
  );
}
