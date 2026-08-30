'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Bug,
  Droplets,
  Search,
  CheckCircle2,
  Printer,
  Info,
  Layers,
  Thermometer,
  Wind,
  Dna,
  Beaker,
  AlertOctagon,
  Sparkles,
  HelpCircle,
  Stethoscope,
  Microscope,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  DISEASE_ORGANS,
  TOMATO_DISEASES_DATA,
  TomatoDisease,
} from '@/lib/tomato-disease-data';
import {
  CalculatorShell,
  type TrilingualString, type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

const TITLE: TrilingualString = {
  en: 'Interactive Tomato Pathology & Disease Location Map',
  ar: 'الأطلس التفاعلي لأمراض الطماطم ومواقع الإصابة على النبات',
  fr: 'Atlas Pathologique Interactif de la Tomate par Organe',
};

const DESC: TrilingualString = {
  en: 'Explore common tomato fungal, bacterial, viral & nematode diseases mapped directly onto plant anatomy with IPM protocols, FRAC codes & resistance genes.',
  ar: 'خريطة تفاعلية لأخطر أمراض الطماطم الفطرية والبكتيرية والفيروسية والنيماتودية موزعة على أجزاء النبات مع برامج المكافحة المتكاملة.',
  fr: 'Explorez les maladies fongiques, bactériennes et virales de la tomate par organe, avec codes FRAC, lutte biologique et gènes de résistance.',
};

const PILL_LABEL: TrilingualString = { en: 'Plant zone:', ar: 'المنطقة:', fr: 'Zone :' };

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Click any organ on the plant map (or pills above) to see diseases affecting that zone. Use the FRAC code rotation to prevent resistance — never apply the same MoA group twice in a row.',
  ar: 'انقر أي عضو على خريطة النبات (أو الأزرار أعلاه) لرؤية الأمراض المؤثرة على تلك المنطقة. استخدم تدوير أكواد FRAC لمنع المقاومة — لا تكرر نفس مجموعة آلية العمل مرتين متتاليتين.',
  fr: 'Cliquez sur un organe de la carte (ou pastilles) pour voir les maladies de cette zone. Alternez les codes FRAC pour éviter la résistance.',
};

export function TomatoDiseaseVisualizer() {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const isFr = language === 'fr';

  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [selectedOrgan, setSelectedOrgan] = useState<string>('leaves');
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string>('early-blight');
  const [pathogenFilter, setPathogenFilter] = useState<'all' | 'fungal' | 'bacterial' | 'viral' | 'nematode'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredDiseases = useMemo(() => {
    return TOMATO_DISEASES_DATA.filter((item) => {
      const matchesOrgan = selectedOrgan === 'all' || item.organ === selectedOrgan;
      const matchesPathogen = pathogenFilter === 'all' || item.pathogenType === pathogenFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.name_ar.includes(query) ||
        item.scientificName.toLowerCase().includes(query) ||
        item.symptomSummary.toLowerCase().includes(query) ||
        item.symptomSummary_ar.includes(query);

      return matchesOrgan && matchesPathogen && matchesQuery;
    });
  }, [selectedOrgan, pathogenFilter, searchQuery]);

  const activeDisease = useMemo(() => {
    const found = TOMATO_DISEASES_DATA.find((d) => d.id === selectedDiseaseId);
    if (found) return found;
    return filteredDiseases[0] || TOMATO_DISEASES_DATA[0];
  }, [selectedDiseaseId, filteredDiseases]);

  const organMeta = useMemo(() => {
    return DISEASE_ORGANS.find((o) => o.id === selectedOrgan) || DISEASE_ORGANS[2];
  }, [selectedOrgan]);

  const pills: CalculatorPill[] = [
    { key: 'all', emoji: '🌐', label: tr('All Zones', 'كل المناطق', 'Toutes') },
    ...DISEASE_ORGANS.map((o) => ({
      key: o.id,
      label: isAr ? o.label_ar : isFr ? o.label_fr : o.label,
    })),
  ];

  const handlePillClick = (key: string) => {
    setSelectedOrgan(key);
    if (key !== 'all') {
      const firstInOrgan = TOMATO_DISEASES_DATA.find((d) => d.organ === key);
      if (firstInOrgan) setSelectedDiseaseId(firstInOrgan.id);
    }
  };

  const handleReset = () => {
    setSelectedOrgan('leaves');
    setSelectedDiseaseId('early-blight');
    setPathogenFilter('all');
    setSearchQuery('');
    toast({ title: tr('Reset', 'إعادة تعيين', 'Réinitialiser') });
  };

  return (
    <CalculatorShell
      icon={Bug}
      title={TITLE}
      description={DESC}
      badge="Phytopathology"
      accent="rose"
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
        {/* Main Layout Grid */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          
          {/* ========================================================================= */}
          {/* COLUMN 1: TOMATO PLANT PATHOLOGY SVG MAP                                  */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 flex flex-col items-center p-4 rounded-2xl bg-gradient-to-b from-rose-50/30 via-background to-emerald-50/20 dark:from-rose-950/10 dark:to-emerald-950/10 border relative overflow-hidden shadow-xs">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                <span>{tr('Tomato Pathology Map', 'خريطة مواقع الإصابات المرضية', 'Carte Pathologique')}</span>
              </span>
              <Badge variant="outline" className="text-[10px] text-rose-600 border-rose-300">
                {tr('Solanum lycopersicum', 'Solanum lycopersicum')}
              </Badge>
            </div>

            {/* Interactive Tomato Plant SVG Diagram */}
            <div className="w-full max-w-xs sm:max-w-sm relative select-none">
              <svg viewBox="0 0 320 480" className="w-full h-auto drop-shadow-sm">
                <defs>
                  <linearGradient id="tStemGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#15803d" />
                    <stop offset="50%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#166534" />
                  </linearGradient>
                  <linearGradient id="tSoilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#713f12" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#451a03" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                {/* Soil line */}
                <rect x="10" y="340" width="300" height="130" rx="10" fill="url(#tSoilGrad)" opacity="0.4" />
                <line x1="10" y1="340" x2="310" y2="340" stroke="#713f12" strokeWidth="2.5" strokeDasharray="4 2" />

                {/* 1. ROOTS & CROWN / COLLAR (Zone: roots_crown) */}
                <g
                  onClick={() => setSelectedOrgan('roots_crown')}
                  className={`cursor-pointer transition-all duration-300 ${selectedOrgan === 'roots_crown' ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
                >
                  {/* Taproot & Nematode Galls */}
                  <path d="M 160 340 Q 160 390 155 450" fill="none" stroke="#78350f" strokeWidth={selectedOrgan === 'roots_crown' ? 5 : 3.5} strokeLinecap="round" />
                  <path d="M 160 355 Q 120 370 70 380 Q 45 390 35 410" fill="none" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 160 370 Q 200 385 250 400 Q 280 415 290 440" fill="none" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" />
                  
                  {/* Nematode Root Knot Gall Nodes */}
                  <circle cx="85" cy="377" r="5" fill="#ca8a04" stroke="#78350f" strokeWidth="1" />
                  <circle cx="115" cy="368" r="4.5" fill="#ca8a04" stroke="#78350f" strokeWidth="1" />
                  <circle cx="230" cy="392" r="5.5" fill="#ca8a04" stroke="#78350f" strokeWidth="1" />
                  <circle cx="265" cy="408" r="4" fill="#ca8a04" stroke="#78350f" strokeWidth="1" />

                  {/* Crown collar decay patch */}
                  <ellipse cx="160" cy="342" rx="10" ry="4" fill="#451a03" />

                  {/* Root Hotspot Badge */}
                  <g transform="translate(160, 420)">
                    <circle cx="0" cy="0" r="16" fill={selectedOrgan === 'roots_crown' ? '#78350f' : '#ffffff'} stroke="#78350f" strokeWidth="2" className={selectedOrgan === 'roots_crown' ? 'animate-pulse' : ''} />
                    <text x="0" y="3.5" textAnchor="middle" fontSize="8" fontWeight="bold" fill={selectedOrgan === 'roots_crown' ? '#ffffff' : '#78350f'} className="font-mono">Ralstonia/Fus</text>
                  </g>
                </g>

                {/* 2. STEM & COLLAR (Zone: stem_collar) */}
                <g
                  onClick={() => setSelectedOrgan('stem_collar')}
                  className={`cursor-pointer transition-all duration-300 ${selectedOrgan === 'stem_collar' ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
                >
                  <path d="M 160 340 Q 160 220 160 70" fill="none" stroke="url(#tStemGrad)" strokeWidth={selectedOrgan === 'stem_collar' ? 9 : 6.5} strokeLinecap="round" />
                  
                  {/* Southern Blight White Mycelial Collar + Sclerotia */}
                  <rect x="154" y="325" width="12" height="15" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" rx="2" />
                  <circle cx="157" cy="328" r="1" fill="#78350f" />
                  <circle cx="163" cy="333" r="1.2" fill="#78350f" />
                  <circle cx="159" cy="337" r="1" fill="#78350f" />

                  {/* Pith Necrosis Adventitious Rootlets */}
                  <line x1="160" y1="280" x2="148" y2="283" stroke="#e2e8f0" strokeWidth="1.5" />
                  <line x1="160" y1="290" x2="146" y2="294" stroke="#e2e8f0" strokeWidth="1.5" />
                  <line x1="160" y1="285" x2="173" y2="288" stroke="#e2e8f0" strokeWidth="1.5" />

                  {/* Stem Hotspot */}
                  <g transform="translate(160, 260)">
                    <circle cx="0" cy="0" r="15" fill={selectedOrgan === 'stem_collar' ? '#16a34a' : '#ffffff'} stroke="#16a34a" strokeWidth="2" className={selectedOrgan === 'stem_collar' ? 'animate-pulse' : ''} />
                    <text x="0" y="3.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill={selectedOrgan === 'stem_collar' ? '#ffffff' : '#16a34a'} className="font-mono">Pith/Scler</text>
                  </g>
                </g>

                {/* 3. FOLIAGE & LEAVES (Zone: leaves) */}
                <g
                  onClick={() => setSelectedOrgan('leaves')}
                  className={`cursor-pointer transition-all duration-300 ${selectedOrgan === 'leaves' ? 'opacity-100' : 'opacity-85 hover:opacity-100'}`}
                >
                  {/* Lower Leaf (Early Blight Bullseye Rings) */}
                  <path d="M 160 295 Q 110 295 60 310 Q 40 280 80 265 Q 125 270 160 290" fill={selectedOrgan === 'leaves' ? '#a3e635' : '#84cc16'} stroke="#4d7c0f" strokeWidth="1.8" />
                  {/* Early Blight Concentric Target rings */}
                  <circle cx="85" cy="285" r="7" fill="#451a03" opacity="0.8" />
                  <circle cx="85" cy="285" r="4.5" fill="none" stroke="#facc15" strokeWidth="1" />
                  <circle cx="85" cy="285" r="2" fill="none" stroke="#fef08a" strokeWidth="0.8" />

                  {/* Right Mid Leaf (Late Blight Water Soaked Dark Blotch) */}
                  <path d="M 160 240 Q 205 225 245 215 Q 255 190 220 185 Q 185 200 160 235" fill={selectedOrgan === 'leaves' ? '#86efac' : '#4ade80'} stroke="#15803d" strokeWidth="1.8" />
                  {/* Late Blight Dark Necrosis with white downy edge */}
                  <path d="M 215 195 Q 240 195 245 215 Q 225 215 215 195" fill="#1e293b" opacity="0.9" />
                  <path d="M 215 195 Q 240 195 245 215" fill="none" stroke="#f8fafc" strokeWidth="1" strokeDasharray="1 1" />

                  {/* Top Young Leaf (TYLCV yellow curl spoon shape) */}
                  <path d="M 160 140 Q 125 115 95 110 Q 90 90 120 90 Q 145 105 160 135" fill="#facc15" stroke="#ca8a04" strokeWidth="1.8" />

                  {/* Leaf Hotspot */}
                  <g transform="translate(60, 240)">
                    <circle cx="0" cy="0" r="16" fill={selectedOrgan === 'leaves' ? '#10b981' : '#ffffff'} stroke="#10b981" strokeWidth="2" className={selectedOrgan === 'leaves' ? 'animate-pulse' : ''} />
                    <text x="0" y="3.5" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill={selectedOrgan === 'leaves' ? '#ffffff' : '#10b981'} className="font-mono">Blight/TYLCV</text>
                  </g>
                </g>

                {/* 4. FLOWERS & PEDICELS (Zone: flowers) */}
                <g
                  onClick={() => setSelectedOrgan('flowers')}
                  className={`cursor-pointer transition-all duration-300 ${selectedOrgan === 'flowers' ? 'opacity-100' : 'opacity-85 hover:opacity-100'}`}
                >
                  <path d="M 160 110 Q 130 100 100 90" fill="none" stroke="#15803d" strokeWidth="2" />
                  {/* Botrytis Gray Mold on blossom */}
                  <g transform="translate(100, 90)">
                    <circle cx="0" cy="0" r="7" fill="#64748b" opacity="0.9" />
                    <path d="M 0 -8 L 3 -3 L 8 0 L 3 3 L 0 8 L -3 3 L -8 0 L -3 -3 Z" fill="#94a3b8" stroke="#475569" strokeWidth="0.8" />
                  </g>

                  {/* Flower Hotspot */}
                  <g transform="translate(75, 75)">
                    <circle cx="0" cy="0" r="14" fill={selectedOrgan === 'flowers' ? '#eab308' : '#ffffff'} stroke="#eab308" strokeWidth="2" className={selectedOrgan === 'flowers' ? 'animate-pulse' : ''} />
                    <text x="0" y="3.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill={selectedOrgan === 'flowers' ? '#ffffff' : '#eab308'} className="font-mono">Botrytis</text>
                  </g>
                </g>

                {/* 5. FRUITS & CALYX (Zone: fruits) */}
                <g
                  onClick={() => setSelectedOrgan('fruits')}
                  className={`cursor-pointer transition-all duration-300 ${selectedOrgan === 'fruits' ? 'opacity-100' : 'opacity-85 hover:opacity-100'}`}
                >
                  <path d="M 160 185 Q 195 180 220 190" fill="none" stroke="#15803d" strokeWidth="2.5" />

                  {/* Tomato Fruit 1: ToBRFV marbling & Calyx drying */}
                  <g transform="translate(230, 210)">
                    <circle cx="0" cy="0" r="22" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5" />
                    {/* ToBRFV Yellow Mosaic Rugose Marbling */}
                    <path d="M -12 -5 Q -4 10 5 -2 Q 12 8 16 0" fill="none" stroke="#facc15" strokeWidth="3" opacity="0.85" />
                    <circle cx="-6" cy="6" r="3" fill="#78350f" opacity="0.7" />
                    {/* Brown Necrotic Calyx sepals */}
                    <path d="M -8 -20 L 0 -15 L 8 -20 M -12 -16 L 0 -15 L 12 -16" stroke="#78350f" strokeWidth="2" fill="none" />
                  </g>

                  {/* Tomato Fruit 2: Anthracnose sunken circular dish craters */}
                  <g transform="translate(200, 185)">
                    <circle cx="0" cy="0" r="14" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
                    {/* Sunken crater */}
                    <circle cx="2" cy="2" r="5" fill="#7f1d1d" />
                    <circle cx="2" cy="2" r="2" fill="#fb7185" />
                  </g>

                  {/* Fruit Hotspot */}
                  <g transform="translate(265, 245)">
                    <circle cx="0" cy="0" r="16" fill={selectedOrgan === 'fruits' ? '#dc2626' : '#ffffff'} stroke="#dc2626" strokeWidth="2" className={selectedOrgan === 'fruits' ? 'animate-pulse' : ''} />
                    <text x="0" y="3.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill={selectedOrgan === 'fruits' ? '#ffffff' : '#dc2626'} className="font-mono">ToBRFV/Anth</text>
                  </g>
                </g>
              </svg>
            </div>

            {/* Quick Diagnostic Field Tip Box */}
            <div className="w-full mt-3 p-3 rounded-xl bg-background border text-xs space-y-2">
              <span className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                <Stethoscope className="h-3.5 w-3.5" />
                <span>{tr('Field Diagnostic Rule: Ralstonia vs. Fusarium', 'الفحص الحقلي السريع: الرالستونيا ضد الفيوزاريوم')}</span>
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {tr(
                  'Cut stem and suspend in water: Ralstonia bacterial wilt emits streaming milky white bacterial ooze within 60s; Fusarium wilt shows dark brown xylem ring but ZERO streaming ooze.',
                  'قص طرف الساق وضعه في كأس ماء: الرالستونيا تطلق خيوطاً بكتيرية بيضاء حليبية متدفقة فوراً، بينما الفيوزاريوم يُظهر تلوناً بنياً بالحلقة الخشبية دون أي تدفق بكتيري.'
                )}
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* COLUMN 2: DISEASE EXPLORER & COMPLETE IPM PRESCRIPTION CARD               */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={tr('Search disease (e.g. Early Blight, ToBRFV, Fusarium, TYLCV)...', 'ابحث عن المرض (اللفحة المبكرة، توبامو ToBRFV، فيوزاريوم)...', 'Rechercher une maladie...')}
                  className="pl-8 h-8 text-xs w-full"
                />
              </div>

              <div className="flex items-center gap-1 w-full sm:w-auto shrink-0 flex-wrap">
                <Button
                  type="button"
                  variant={pathogenFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPathogenFilter('all')}
                  className="h-8 text-xs px-2.5 flex-1 sm:flex-none"
                >
                  {tr('All', 'الكل', 'Tous')}
                </Button>
                <Button
                  type="button"
                  variant={pathogenFilter === 'fungal' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPathogenFilter('fungal')}
                  className="h-8 text-xs px-2 flex-1 sm:flex-none"
                >
                  {tr('Fungal', 'فطري', 'Fongique')}
                </Button>
                <Button
                  type="button"
                  variant={pathogenFilter === 'bacterial' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPathogenFilter('bacterial')}
                  className="h-8 text-xs px-2 flex-1 sm:flex-none"
                >
                  {tr('Bacterial', 'بكتيري', 'Bactérien')}
                </Button>
                <Button
                  type="button"
                  variant={pathogenFilter === 'viral' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPathogenFilter('viral')}
                  className="h-8 text-xs px-2 flex-1 sm:flex-none"
                >
                  {tr('Viral', 'فيروسي', 'Viral')}
                </Button>
              </div>
            </div>

            {/* Disease Selector Cards for Active Zone */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">
                  {tr('Pathogens affecting', 'الأمراض المسجلة في')} {isAr ? organMeta.label_ar : organMeta.label} ({filteredDiseases.length})
                </span>
                <span className="text-[11px] text-muted-foreground">{tr('Click to open full IPM treatment plan', 'انقر لفتح بروتوكول العلاج الكامل')}</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-2">
                {filteredDiseases.map((dis) => {
                  const isSelected = dis.id === activeDisease.id;
                  const pathogenColor =
                    dis.pathogenType === 'fungal'
                      ? 'bg-amber-500/10 text-amber-600 border-amber-300'
                      : dis.pathogenType === 'bacterial'
                      ? 'bg-blue-500/10 text-blue-600 border-blue-300'
                      : dis.pathogenType === 'viral'
                      ? 'bg-purple-500/10 text-purple-600 border-purple-300'
                      : 'bg-emerald-500/10 text-emerald-600 border-emerald-300';

                  return (
                    <div
                      key={dis.id}
                      onClick={() => setSelectedDiseaseId(dis.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-rose-600 bg-rose-50/50 dark:bg-rose-950/30 shadow-xs ring-1 ring-rose-600'
                          : 'border-border bg-card hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className={`text-[9px] py-0 px-1.5 uppercase ${pathogenColor}`}>
                              {dis.pathogenType}
                            </Badge>
                            <span className="text-[10px] italic text-muted-foreground line-clamp-1">
                              {dis.scientificName.split('(')[0]}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs mt-1 line-clamp-1">
                            {isAr ? dis.name_ar : isFr ? dis.name_fr : dis.name}
                          </h4>
                        </div>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-snug">
                        {isAr ? dis.symptomSummary_ar : isFr ? dis.symptomSummary_fr : dis.symptomSummary}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* In-Depth Selected Disease Profile & Treatment Plan */}
            {activeDisease && (
              <div className="p-4 rounded-xl border bg-card shadow-xs space-y-4">
                
                {/* Header Profile */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-rose-600 text-white hover:bg-rose-700 text-xs">
                        {activeDisease.pathogenType.toUpperCase()}
                      </Badge>
                      <h3 className="text-sm md:text-base font-bold">
                        {isAr ? activeDisease.name_ar : isFr ? activeDisease.name_fr : activeDisease.name}
                      </h3>
                    </div>
                    <span className="text-xs text-muted-foreground italic block mt-0.5">
                      {activeDisease.scientificName}
                    </span>
                  </div>
                  <Badge variant={activeDisease.severity === 'devastating' ? 'destructive' : 'secondary'} className="text-[10px] uppercase tracking-wider self-start sm:self-auto">
                    {activeDisease.severity} {tr('Risk', 'الخطورة')}
                  </Badge>
                </div>

                {/* Epidemiology & Micro-Climate Matrix */}
                <div className="grid sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-muted/40 border">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-bold">
                      <Thermometer className="h-3 w-3 text-rose-500" />
                      <span>{tr('Favorable Temp', 'الحرارة الملائمة')}</span>
                    </span>
                    <strong className="text-foreground block mt-1 text-[11px]">
                      {activeDisease.epidemiology.favorableTemp}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/40 border">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-bold">
                      <Droplets className="h-3 w-3 text-blue-500" />
                      <span>{tr('Humidity & Moisture', 'الرطوبة وظروف العدوى')}</span>
                    </span>
                    <span className="text-muted-foreground block mt-1 text-[11px] leading-snug">
                      {activeDisease.epidemiology.favorableHumidity}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/40 border">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-bold">
                      <Wind className="h-3 w-3 text-amber-500" />
                      <span>{tr('Transmission Vectors', 'طرق الانتقال والناقل')}</span>
                    </span>
                    <span className="text-muted-foreground block mt-1 text-[11px] leading-snug">
                      {isAr ? activeDisease.epidemiology.transmissionVectors_ar : isFr ? activeDisease.epidemiology.transmissionVectors_fr : activeDisease.epidemiology.transmissionVectors}
                    </span>
                  </div>
                </div>

                {/* Diagnostic Key Features Checklist */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 text-rose-600" />
                    <span>{tr('Diagnostic Identification Keys', 'العلامات التشخيصية الفارقة')}</span>
                  </span>
                  <div className="grid sm:grid-cols-2 gap-1.5">
                    {(isAr ? activeDisease.diagnosticFeatures_ar : isFr ? activeDisease.diagnosticFeatures_fr : activeDisease.diagnosticFeatures).map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 p-2 rounded-lg bg-background border text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CHEMICAL SPRAY PROGRAM & FRAC CODES */}
                <div className="p-3.5 rounded-xl border-2 border-rose-500/30 bg-rose-50/30 dark:bg-rose-950/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
                      <Beaker className="h-4 w-4 text-rose-600" />
                      <span>{tr('🧪 Chemical / Fungicidal Control & FRAC Rotation', '🧪 المكافحة الكيميائية ومجموعات FRAC')}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-rose-400 text-rose-700 dark:text-rose-300">
                      PHI: {activeDisease.chemicalControl.phiDays}
                    </Badge>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 rounded-lg bg-background/80 border">
                      <span className="text-[10px] text-muted-foreground block">{tr('Active Substances', 'المواد الفعالة المسجلة')}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(isAr ? activeDisease.chemicalControl.activeSubstances_ar : activeDisease.chemicalControl.activeSubstances).map((act, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] font-normal">
                            {act}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-background/80 border">
                      <span className="text-[10px] text-muted-foreground block">{tr('FRAC / IRAC Mode of Action Codes', 'أكواد مجموعات كسر المقاومة')}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {activeDisease.chemicalControl.fracCodes.map((code, i) => (
                          <Badge key={i} className="text-[10px] bg-rose-600 text-white font-mono">
                            {code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-rose-900 dark:text-rose-200 bg-rose-100/50 dark:bg-rose-950/50 p-2 rounded-lg border border-rose-200 dark:border-rose-900/40">
                    <strong>{tr('Precaution:', 'تنبيه المقاومة والسلامة:')}</strong> {isAr ? activeDisease.chemicalControl.precautions_ar : activeDisease.chemicalControl.precautions}
                  </p>
                </div>

                {/* IPM CULTURAL PRACTICES & RESISTANT GENES */}
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-muted/30 border space-y-1.5">
                    <span className="font-bold flex items-center gap-1.5 text-foreground">
                      <Layers className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{tr('IPM Cultural Practices', 'الممارسات الزراعية الوقائية')}</span>
                    </span>
                    <ul className="space-y-1 text-muted-foreground text-[11px]">
                      {(isAr ? activeDisease.ipmCulturalPractices_ar : activeDisease.ipmCulturalPractices).map((prac, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{prac}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/30 border space-y-2">
                    <span className="font-bold flex items-center gap-1.5 text-foreground">
                      <Dna className="h-3.5 w-3.5 text-purple-600" />
                      <span>{tr('Resistant Cultivar Genes', 'جينات المقاومة الوراثية')}</span>
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {activeDisease.resistantGenes.map((gene, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] border-purple-400 text-purple-700 dark:text-purple-300 font-mono">
                          {gene}
                        </Badge>
                      ))}
                    </div>

                    <span className="font-bold flex items-center gap-1.5 text-foreground pt-1">
                      <Bug className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{tr('Biological Control', 'المكافحة الحيوية')}</span>
                    </span>
                    <ul className="space-y-1 text-muted-foreground text-[11px]">
                      {(isAr ? activeDisease.biologicalControl_ar : activeDisease.biologicalControl).map((bio, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{bio}</span>
                        </li>
                      ))}
                    </ul>
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
