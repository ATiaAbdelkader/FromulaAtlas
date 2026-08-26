'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Copy,
  Download,
  Info,
  Droplets,
  FlaskConical,
  Zap,
  Sparkles,
  RefreshCw,
  Printer,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation, copyFor } from '@/lib/language-store';

// ============================================================================
// Types & Chemical Database
// ============================================================================

export interface StockFertilizer {
  id: string;
  name: string;
  name_ar: string;
  name_fr: string;
  formula: string;
  defaultTank: 'A' | 'B' | 'C';
  // Nutrient fractions (0.0 to 1.0)
  n_no3: number;
  n_nh4: number;
  p2o5: number;
  k2o: number;
  cao: number;
  mgo: number;
  so4: number;
  fe_ppm: number;
  mn_ppm: number;
  zn_ppm: number;
  cu_ppm: number;
  b_ppm: number;
  mo_ppm: number;
  // Maximum solubility at 20°C in g/L
  solubilityGPerL: number;
  // EC contribution (mS/cm per g/L)
  ecFactor: number;
  isAcid?: boolean;
}

export const STOCK_FERTILIZERS: StockFertilizer[] = [
  // TANK A (Calcium + Nitrogen + Iron)
  {
    id: 'calcium-nitrate',
    name: 'Calcium Nitrate (Greenhouse Grade)',
    name_ar: 'نترات الكالسيوم (درجة نقية)',
    name_fr: 'Nitrate de Calcium (Qualité Serre)',
    formula: '5Ca(NO3)2·NH4NO3·10H2O',
    defaultTank: 'A',
    n_no3: 0.144,
    n_nh4: 0.011,
    p2o5: 0,
    k2o: 0,
    cao: 0.265, // 19% Ca -> 26.5% CaO
    mgo: 0,
    so4: 0,
    fe_ppm: 0,
    mn_ppm: 0,
    zn_ppm: 0,
    cu_ppm: 0,
    b_ppm: 0,
    mo_ppm: 0,
    solubilityGPerL: 1200,
    ecFactor: 1.25,
  },
  {
    id: 'potassium-nitrate-a',
    name: 'Potassium Nitrate (KNO3)',
    name_ar: 'نترات البوتاسيوم',
    name_fr: 'Nitrate de Potassium',
    formula: 'KNO3',
    defaultTank: 'A',
    n_no3: 0.13,
    n_nh4: 0,
    p2o5: 0,
    k2o: 0.46,
    cao: 0,
    mgo: 0,
    so4: 0,
    fe_ppm: 0,
    mn_ppm: 0,
    zn_ppm: 0,
    cu_ppm: 0,
    b_ppm: 0,
    mo_ppm: 0,
    solubilityGPerL: 316,
    ecFactor: 1.35,
  },
  {
    id: 'fe-eddha',
    name: 'Iron Chelate (Fe-EDDHA 6% ortho-ortho)',
    name_ar: 'مخلب الحديد (Fe-EDDHA 6%) للتربة القلوية',
    name_fr: 'Fer Chélaté (Fe-EDDHA 6% o-o)',
    formula: 'Fe-EDDHA',
    defaultTank: 'A',
    n_no3: 0,
    n_nh4: 0,
    p2o5: 0,
    k2o: 0,
    cao: 0,
    mgo: 0,
    so4: 0,
    fe_ppm: 60000,
    mn_ppm: 0,
    zn_ppm: 0,
    cu_ppm: 0,
    b_ppm: 0,
    mo_ppm: 0,
    solubilityGPerL: 120,
    ecFactor: 0.1,
  },
  {
    id: 'fe-dtpa',
    name: 'Iron Chelate (Fe-DTPA 7%)',
    name_ar: 'مخلب الحديد (Fe-DTPA 7%)',
    name_fr: 'Fer Chélaté (Fe-DTPA 7%)',
    formula: 'Fe-DTPA',
    defaultTank: 'A',
    n_no3: 0,
    n_nh4: 0,
    p2o5: 0,
    k2o: 0,
    cao: 0,
    mgo: 0,
    so4: 0,
    fe_ppm: 70000,
    mn_ppm: 0,
    zn_ppm: 0,
    cu_ppm: 0,
    b_ppm: 0,
    mo_ppm: 0,
    solubilityGPerL: 100,
    ecFactor: 0.1,
  },

  // TANK B (Phosphorus + Potassium + Magnesium + Sulfates + Micros)
  {
    id: 'map-b',
    name: 'Monoammonium Phosphate (MAP 12-61-0)',
    name_ar: 'فوسفات أحادي الأمونيوم (MAP)',
    name_fr: 'Phosphate Monoammonique (MAP 12-61-0)',
    formula: 'NH4H2PO4',
    defaultTank: 'B',
    n_no3: 0,
    n_nh4: 0.12,
    p2o5: 0.61,
    k2o: 0,
    cao: 0,
    mgo: 0,
    so4: 0,
    fe_ppm: 0,
    mn_ppm: 0,
    zn_ppm: 0,
    cu_ppm: 0,
    b_ppm: 0,
    mo_ppm: 0,
    solubilityGPerL: 370,
    ecFactor: 0.85,
  },
  {
    id: 'mkp-b',
    name: 'Monopotassium Phosphate (MKP 0-52-34)',
    name_ar: 'فوسفات أحادي البوتاسيوم (MKP)',
    name_fr: 'Phosphate Monopotassique (MKP 0-52-34)',
    formula: 'KH2PO4',
    defaultTank: 'B',
    n_no3: 0,
    n_nh4: 0,
    p2o5: 0.52,
    k2o: 0.34,
    cao: 0,
    mgo: 0,
    so4: 0,
    fe_ppm: 0,
    mn_ppm: 0,
    zn_ppm: 0,
    cu_ppm: 0,
    b_ppm: 0,
    mo_ppm: 0,
    solubilityGPerL: 226,
    ecFactor: 0.72,
  },
  {
    id: 'sop-b',
    name: 'Potassium Sulfate (SOP 0-0-50 Soluble)',
    name_ar: 'سلفات البوتاسيوم الذائبة (SOP)',
    name_fr: 'Sulfate de Potassium Soluble (SOP)',
    formula: 'K2SO4',
    defaultTank: 'B',
    n_no3: 0,
    n_nh4: 0,
    p2o5: 0,
    k2o: 0.50,
    cao: 0,
    mgo: 0,
    so4: 0.54, // 18% S -> 54% SO4
    fe_ppm: 0,
    mn_ppm: 0,
    zn_ppm: 0,
    cu_ppm: 0,
    b_ppm: 0,
    mo_ppm: 0,
    solubilityGPerL: 110,
    ecFactor: 1.45,
  },
  {
    id: 'magnesium-sulfate-b',
    name: 'Magnesium Sulfate (Epsom Salt 16% MgO)',
    name_ar: 'سلفات المغنيسيوم (ملح إبسوم 16% MgO)',
    name_fr: 'Sulfate de Magnésium (Sel d’Epsom 16% MgO)',
    formula: 'MgSO4·7H2O',
    defaultTank: 'B',
    n_no3: 0,
    n_nh4: 0,
    p2o5: 0,
    k2o: 0,
    cao: 0,
    mgo: 0.16,
    so4: 0.38,
    fe_ppm: 0,
    mn_ppm: 0,
    zn_ppm: 0,
    cu_ppm: 0,
    b_ppm: 0,
    mo_ppm: 0,
    solubilityGPerL: 710,
    ecFactor: 0.75,
  },
  {
    id: 'zinc-sulfate-b',
    name: 'Zinc Sulfate Monohydrate (35% Zn)',
    name_ar: 'سلفات الزنك (35% Zn)',
    name_fr: 'Sulfate de Zinc (35% Zn)',
    formula: 'ZnSO4·H2O',
    defaultTank: 'B',
    n_no3: 0,
    n_nh4: 0,
    p2o5: 0,
    k2o: 0,
    cao: 0,
    mgo: 0,
    so4: 0.53,
    fe_ppm: 0,
    mn_ppm: 0,
    zn_ppm: 350000,
    cu_ppm: 0,
    b_ppm: 0,
    mo_ppm: 0,
    solubilityGPerL: 540,
    ecFactor: 0.8,
  },
  {
    id: 'manganese-sulfate-b',
    name: 'Manganese Sulfate (31% Mn)',
    name_ar: 'سلفات المنجنيز (31% Mn)',
    name_fr: 'Sulfate de Manganèse (31% Mn)',
    formula: 'MnSO4·H2O',
    defaultTank: 'B',
    n_no3: 0,
    n_nh4: 0,
    p2o5: 0,
    k2o: 0,
    cao: 0,
    mgo: 0,
    so4: 0.54,
    fe_ppm: 0,
    mn_ppm: 310000,
    zn_ppm: 0,
    cu_ppm: 0,
    b_ppm: 0,
    mo_ppm: 0,
    solubilityGPerL: 600,
    ecFactor: 0.8,
  },
  {
    id: 'borax-solubor-b',
    name: 'Solubor / Sodium Octaborate (20.5% B)',
    name_ar: 'سولوبور / بوراكس ذائب (20.5% B)',
    name_fr: 'Solubor (20.5% B)',
    formula: 'Na2B8O13·4H2O',
    defaultTank: 'B',
    n_no3: 0,
    n_nh4: 0,
    p2o5: 0,
    k2o: 0,
    cao: 0,
    mgo: 0,
    so4: 0,
    fe_ppm: 0,
    mn_ppm: 0,
    zn_ppm: 0,
    cu_ppm: 0,
    b_ppm: 205000,
    mo_ppm: 0,
    solubilityGPerL: 100,
    ecFactor: 0.2,
  },
  {
    id: 'copper-sulfate-b',
    name: 'Copper Sulfate Pentahydrate (25% Cu)',
    name_ar: 'سلفات النحاس (25% Cu)',
    name_fr: 'Sulfate de Cuivre (25% Cu)',
    formula: 'CuSO4·5H2O',
    defaultTank: 'B',
    n_no3: 0,
    n_nh4: 0,
    p2o5: 0,
    k2o: 0,
    cao: 0,
    mgo: 0,
    so4: 0.38,
    fe_ppm: 0,
    mn_ppm: 0,
    zn_ppm: 0,
    cu_ppm: 250000,
    b_ppm: 0,
    mo_ppm: 0,
    solubilityGPerL: 320,
    ecFactor: 0.8,
  },
  {
    id: 'sodium-molybdate-b',
    name: 'Sodium Molybdate (39% Mo)',
    name_ar: 'موليبدات الصوديوم (39% Mo)',
    name_fr: 'Molybdate de Sodium (39% Mo)',
    formula: 'Na2MoO4·2H2O',
    defaultTank: 'B',
    n_no3: 0,
    n_nh4: 0,
    p2o5: 0,
    k2o: 0,
    cao: 0,
    mgo: 0,
    so4: 0,
    fe_ppm: 0,
    mn_ppm: 0,
    zn_ppm: 0,
    cu_ppm: 0,
    b_ppm: 0,
    mo_ppm: 390000,
    solubilityGPerL: 840,
    ecFactor: 0.3,
  },

  // TANK C (Acid Tank)
  {
    id: 'nitric-acid-c',
    name: 'Nitric Acid 60% (HNO3)',
    name_ar: 'حمض النيتريك 60%',
    name_fr: 'Acide Nitrique 60%',
    formula: 'HNO3 (60%)',
    defaultTank: 'C',
    n_no3: 0.133, // approx 13.3% N
    n_nh4: 0,
    p2o5: 0,
    k2o: 0,
    cao: 0,
    mgo: 0,
    so4: 0,
    fe_ppm: 0,
    mn_ppm: 0,
    zn_ppm: 0,
    cu_ppm: 0,
    b_ppm: 0,
    mo_ppm: 0,
    solubilityGPerL: 9999,
    ecFactor: 1.8,
    isAcid: true,
  },
  {
    id: 'phosphoric-acid-c',
    name: 'Phosphoric Acid 85% (H3PO4)',
    name_ar: 'حمض الفوسفوريك 85%',
    name_fr: 'Acide Phosphorique 85%',
    formula: 'H3PO4 (85%)',
    defaultTank: 'C',
    n_no3: 0,
    n_nh4: 0,
    p2o5: 0.616, // approx 61.6% P2O5
    k2o: 0,
    cao: 0,
    mgo: 0,
    so4: 0,
    fe_ppm: 0,
    mn_ppm: 0,
    zn_ppm: 0,
    cu_ppm: 0,
    b_ppm: 0,
    mo_ppm: 0,
    solubilityGPerL: 9999,
    ecFactor: 0.9,
    isAcid: true,
  },
];

export interface TankAddition {
  fertilizerId: string;
  tank: 'A' | 'B' | 'C';
  kgPerTank: number;
}

export interface PresetRecipe {
  id: string;
  name: string;
  name_ar: string;
  name_fr: string;
  crop: string;
  stage: string;
  targetEC: number;
  additions: { fertilizerId: string; tank: 'A' | 'B' | 'C'; kgPer1000L: number }[];
}

export const PRESET_RECIPES: PresetRecipe[] = [
  {
    id: 'tomato-fruiting-hydro',
    name: 'Tomato (Fruiting / Production Phase)',
    name_ar: 'طماطم بيوت محمية (مرحلة الإنتاج والإثمار)',
    name_fr: 'Tomate Serre (Pleine Production)',
    crop: 'Tomato',
    stage: 'Fruiting',
    targetEC: 2.4,
    additions: [
      { fertilizerId: 'calcium-nitrate', tank: 'A', kgPer1000L: 90 },
      { fertilizerId: 'potassium-nitrate-a', tank: 'A', kgPer1000L: 35 },
      { fertilizerId: 'fe-eddha', tank: 'A', kgPer1000L: 1.8 },
      { fertilizerId: 'mkp-b', tank: 'B', kgPer1000L: 30 },
      { fertilizerId: 'sop-b', tank: 'B', kgPer1000L: 45 },
      { fertilizerId: 'magnesium-sulfate-b', tank: 'B', kgPer1000L: 50 },
      { fertilizerId: 'zinc-sulfate-b', tank: 'B', kgPer1000L: 0.15 },
      { fertilizerId: 'manganese-sulfate-b', tank: 'B', kgPer1000L: 0.18 },
      { fertilizerId: 'borax-solubor-b', tank: 'B', kgPer1000L: 0.12 },
      { fertilizerId: 'nitric-acid-c', tank: 'C', kgPer1000L: 8.0 },
    ],
  },
  {
    id: 'citrus-drip-spring',
    name: 'Citrus / Orange (Spring Flush & Flowering)',
    name_ar: 'حمضيات / برتقال (تزهير ونمو ربيعي)',
    name_fr: 'Agrumes (Floraison et Pousse de Printemps)',
    crop: 'Citrus',
    stage: 'Flowering & Fruit Set',
    targetEC: 1.8,
    additions: [
      { fertilizerId: 'calcium-nitrate', tank: 'A', kgPer1000L: 80 },
      { fertilizerId: 'fe-eddha', tank: 'A', kgPer1000L: 2.5 },
      { fertilizerId: 'map-b', tank: 'B', kgPer1000L: 40 },
      { fertilizerId: 'potassium-nitrate-a', tank: 'A', kgPer1000L: 50 },
      { fertilizerId: 'magnesium-sulfate-b', tank: 'B', kgPer1000L: 35 },
      { fertilizerId: 'zinc-sulfate-b', tank: 'B', kgPer1000L: 0.35 },
    ],
  },
  {
    id: 'potato-tuber-bulking',
    name: 'Potato Drip Fertigation (Tuber Bulking)',
    name_ar: 'بطاطا ري بالتنقيط (مرحلة تحجيم الدرنات)',
    name_fr: 'Pomme de Terre Goutte-à-Goutte (Grossissement)',
    crop: 'Potato',
    stage: 'Bulking',
    targetEC: 2.1,
    additions: [
      { fertilizerId: 'calcium-nitrate', tank: 'A', kgPer1000L: 60 },
      { fertilizerId: 'potassium-nitrate-a', tank: 'A', kgPer1000L: 40 },
      { fertilizerId: 'mkp-b', tank: 'B', kgPer1000L: 25 },
      { fertilizerId: 'sop-b', tank: 'B', kgPer1000L: 65 },
      { fertilizerId: 'magnesium-sulfate-b', tank: 'B', kgPer1000L: 30 },
    ],
  },
  {
    id: 'strawberry-everbearing',
    name: 'Strawberry Hydroponic / Substrate',
    name_ar: 'فراولة (هيدروبونيك وتربة بديلة)',
    name_fr: 'Fraisier Hors-Sol / Substrat',
    crop: 'Strawberry',
    stage: 'Continuous Harvest',
    targetEC: 1.6,
    additions: [
      { fertilizerId: 'calcium-nitrate', tank: 'A', kgPer1000L: 65 },
      { fertilizerId: 'fe-dtpa', tank: 'A', kgPer1000L: 1.5 },
      { fertilizerId: 'mkp-b', tank: 'B', kgPer1000L: 22 },
      { fertilizerId: 'sop-b', tank: 'B', kgPer1000L: 35 },
      { fertilizerId: 'magnesium-sulfate-b', tank: 'B', kgPer1000L: 38 },
      { fertilizerId: 'borax-solubor-b', tank: 'B', kgPer1000L: 0.1 },
    ],
  },
];

// ============================================================================
// Main Component
// ============================================================================

export function FertigationTankMixer() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const isAr = language === 'ar';
  const isFr = language === 'fr';

  // Stock Tank Parameters
  const [tankCapacityL, setTankCapacityL] = useState<number>(1000);
  const [dilutionRatio, setDilutionRatio] = useState<number>(100); // 1:100 (1%)
  const [waterEC, setWaterEC] = useState<number>(0.5); // dS/m
  const [waterHCO3, setWaterHCO3] = useState<number>(180); // mg/L HCO3-
  const [targetDripperPH, setTargetDripperPH] = useState<number>(5.8);
  const [waterTempC, setWaterTempC] = useState<number>(20);

  // Active additions in recipe
  const [additions, setAdditions] = useState<TankAddition[]>([
    { fertilizerId: 'calcium-nitrate', tank: 'A', kgPerTank: 90 },
    { fertilizerId: 'potassium-nitrate-a', tank: 'A', kgPerTank: 35 },
    { fertilizerId: 'fe-eddha', tank: 'A', kgPerTank: 1.8 },
    { fertilizerId: 'mkp-b', tank: 'B', kgPerTank: 30 },
    { fertilizerId: 'sop-b', tank: 'B', kgPerTank: 45 },
    { fertilizerId: 'magnesium-sulfate-b', tank: 'B', kgPerTank: 50 },
    { fertilizerId: 'zinc-sulfate-b', tank: 'B', kgPerTank: 0.15 },
    { fertilizerId: 'manganese-sulfate-b', tank: 'B', kgPerTank: 0.18 },
    { fertilizerId: 'borax-solubor-b', tank: 'B', kgPerTank: 0.12 },
    { fertilizerId: 'nitric-acid-c', tank: 'C', kgPerTank: 8.0 },
  ]);

  // Selected new fertilizer to add
  const [selectedFertToAdd, setSelectedFertToAdd] = useState<string>('map-b');
  const [selectedTargetTank, setSelectedTargetTank] = useState<'A' | 'B' | 'C'>('B');

  // Active view tab
  const [activeTab, setActiveTab] = useState<'tanks' | 'dripper' | 'compat' | 'acid' | 'export'>('tanks');

  // Load Preset
  const handleLoadPreset = (presetId: string) => {
    const p = PRESET_RECIPES.find((x) => x.id === presetId);
    if (!p) return;
    const factor = tankCapacityL / 1000;
    setAdditions(
      p.additions.map((a) => ({
        fertilizerId: a.fertilizerId,
        tank: a.tank,
        kgPerTank: Math.round(a.kgPer1000L * factor * 10) / 10,
      }))
    );
    toast({
      title: tr('Preset Loaded', 'تم تحميل التركيبة النموذجية', 'Recette chargée'),
      description: isAr ? p.name_ar : isFr ? p.name_fr : p.name,
    });
  };

  // Add a fertilizer row
  const handleAddFertilizer = () => {
    const f = STOCK_FERTILIZERS.find((x) => x.id === selectedFertToAdd);
    if (!f) return;
    setAdditions((prev) => [
      ...prev,
      {
        fertilizerId: f.id,
        tank: selectedTargetTank,
        kgPerTank: 10,
      },
    ]);
  };

  // Remove addition
  const handleRemoveAddition = (idx: number) => {
    setAdditions((prev) => prev.filter((_, i) => i !== idx));
  };

  // Update addition kg
  const handleUpdateKg = (idx: number, kg: number) => {
    setAdditions((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, kgPerTank: Math.max(0, kg) } : item))
    );
  };

  // Update addition tank
  const handleUpdateTank = (idx: number, newTank: 'A' | 'B' | 'C') => {
    setAdditions((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, tank: newTank } : item))
    );
  };

  // ==========================================================================
  // Incompatibility & Precipitation Detection Engine
  // ==========================================================================
  const compatibilityAlerts = useMemo(() => {
    const alerts: {
      type: 'danger' | 'warning' | 'info';
      tank: string;
      title: string;
      title_ar: string;
      desc: string;
      desc_ar: string;
    }[] = [];

    // Group by tank
    const tankA = additions.filter((a) => a.tank === 'A' && a.kgPerTank > 0);
    const tankB = additions.filter((a) => a.tank === 'B' && a.kgPerTank > 0);

    const hasCaInA = tankA.some((a) => a.fertilizerId === 'calcium-nitrate');
    const hasPhosInA = tankA.some((a) => ['map-b', 'mkp-b', 'phosphoric-acid-c'].includes(a.fertilizerId));
    const hasSulfInA = tankA.some((a) =>
      ['sop-b', 'magnesium-sulfate-b', 'zinc-sulfate-b', 'manganese-sulfate-b', 'copper-sulfate-b'].includes(
        a.fertilizerId
      )
    );

    const hasCaInB = tankB.some((a) => a.fertilizerId === 'calcium-nitrate');
    const hasPhosInB = tankB.some((a) => ['map-b', 'mkp-b', 'phosphoric-acid-c'].includes(a.fertilizerId));
    const hasSulfInB = tankB.some((a) =>
      ['sop-b', 'magnesium-sulfate-b', 'zinc-sulfate-b', 'manganese-sulfate-b', 'copper-sulfate-b'].includes(
        a.fertilizerId
      )
    );

    // Rule 1: Calcium + Phosphate in same tank -> Tricalcium Phosphate precipitate
    if (hasCaInA && hasPhosInA) {
      alerts.push({
        type: 'danger',
        tank: 'Tank A',
        title: 'CRITICAL: Calcium + Phosphate in Tank A!',
        title_ar: 'تحذير حرج: خلط الكالسيوم مع الفوسفات في الخزان أ!',
        desc: 'Calcium Nitrate mixed with MAP/MKP will form insoluble Tricalcium Phosphate [Ca3(PO4)2], permanently clogging drippers and rendering P and Ca unavailable.',
        desc_ar: 'خلط نترات الكالسيوم مع الفوسفات يؤدي إلى ترسيب فوسفات ثلاثي الكالسيوم غير الذائب مما يسد النقاطات ويفقد النبات عنصري الفوسفور والكالسيوم.',
      });
    }
    if (hasCaInB && hasPhosInB) {
      alerts.push({
        type: 'danger',
        tank: 'Tank B',
        title: 'CRITICAL: Calcium + Phosphate in Tank B!',
        title_ar: 'تحذير حرج: خلط الكالسيوم مع الفوسفات في الخزان ب!',
        desc: 'Move Calcium Nitrate to Tank A to prevent Tricalcium Phosphate precipitation.',
        desc_ar: 'انقل نترات الكالسيوم إلى الخزان أ لتجنب ترسيب الفوسفات غير الذائب.',
      });
    }

    // Rule 2: Calcium + Sulfate in same tank -> Gypsum precipitate
    if (hasCaInA && hasSulfInA) {
      alerts.push({
        type: 'danger',
        tank: 'Tank A',
        title: 'CRITICAL: Calcium + Sulfates in Tank A!',
        title_ar: 'تحذير حرج: خلط الكالسيوم مع الكبريتات في الخزان أ!',
        desc: 'Calcium Nitrate mixed with SOP/Magnesium Sulfate forms Gypsum (CaSO4·2H2O) precipitate at stock tank concentrations.',
        desc_ar: 'خلط نترات الكالسيوم مع سلفات البوتاسيوم أو المغنيسيوم يشكل راسب الجبس غير الذائب في محاليل الأم المركزة.',
      });
    }
    if (hasCaInB && hasSulfInB) {
      alerts.push({
        type: 'danger',
        tank: 'Tank B',
        title: 'CRITICAL: Calcium + Sulfates in Tank B!',
        title_ar: 'تحذير حرج: خلط الكالسيوم مع الكبريتات في الخزان ب!',
        desc: 'Keep Sulfates in Tank B and Calcium in Tank A.',
        desc_ar: 'احتفظ بالكبريتات في الخزان ب وانقل الكالسيوم إلى الخزان أ.',
      });
    }

    // Rule 3: Iron Chelates with Strong Acids in same concentrated tank
    const hasAcidInA = additions.some(
      (a) => a.tank === 'A' && (a.fertilizerId === 'nitric-acid-c' || a.fertilizerId === 'phosphoric-acid-c')
    );
    const hasFeInA = tankA.some((a) => a.fertilizerId.startsWith('fe-'));
    if (hasAcidInA && hasFeInA) {
      alerts.push({
        type: 'warning',
        tank: 'Tank A',
        title: 'Caution: Strong Acid with Iron Chelate',
        title_ar: 'تنبيه: حمض مركز مع مخلب الحديد في الخزان أ',
        desc: 'Direct contact with concentrated acid in the stock tank can degrade EDDHA/DTPA iron chelate rings. Keep acids in Tank C or dilute thoroughly.',
        desc_ar: 'التلامس المباشر للأحماض المركزة مع مخلب الحديد يفكك حلقة المخلب. استخدم الخزان ج للأحماض.',
      });
    }

    return alerts;
  }, [additions]);

  // ==========================================================================
  // Total Dissolved Mass & Solubility Verification
  // ==========================================================================
  const tankStats = useMemo(() => {
    const tanks = {
      A: { totalKg: 0, items: [] as { name: string; kg: number; maxSolubility: number }[] },
      B: { totalKg: 0, items: [] as { name: string; kg: number; maxSolubility: number }[] },
      C: { totalKg: 0, items: [] as { name: string; kg: number; maxSolubility: number }[] },
    };

    additions.forEach((add) => {
      if (add.kgPerTank <= 0) return;
      const fert = STOCK_FERTILIZERS.find((f) => f.id === add.fertilizerId);
      if (!fert) return;
      tanks[add.tank].totalKg += add.kgPerTank;
      tanks[add.tank].items.push({
        name: isAr ? fert.name_ar : isFr ? fert.name_fr : fert.name,
        kg: add.kgPerTank,
        maxSolubility: fert.solubilityGPerL,
      });
    });

    // Concentration in g/L in stock tank
    const concA = (tanks.A.totalKg * 1000) / tankCapacityL;
    const concB = (tanks.B.totalKg * 1000) / tankCapacityL;
    const concC = (tanks.C.totalKg * 1000) / tankCapacityL;

    // Solubility safety limit (typically 150 - 200 g/L max for cold water 15-20°C)
    const maxSafeConc = waterTempC < 15 ? 140 : waterTempC < 22 ? 180 : 220;

    return {
      tanks,
      concA,
      concB,
      concC,
      maxSafeConc,
      isAOverloaded: concA > maxSafeConc,
      isBOverloaded: concB > maxSafeConc,
    };
  }, [additions, tankCapacityL, waterTempC, isAr, isFr]);

  // ==========================================================================
  // Final Dripper Delivered Concentrations (ppm & meq/L & EC)
  // ==========================================================================
  const finalDripperNutrients = useMemo(() => {
    // Dilution factor: 1 L stock solution injected into `dilutionRatio` L irrigation water
    // Total grams of nutrient dissolved per 1000L stock = sum(kg * fraction * 1000)
    // Concentration in dripper (mg/L = ppm) = (total grams in stock tank / tankCapacityL) * (1000 / dilutionRatio)
    // which simplifies to: (total kg in stock * 1000 * 1000 * fraction) / (tankCapacityL * dilutionRatio)

    let totalN_NO3 = 0;
    let totalN_NH4 = 0;
    let totalP2O5 = 0;
    let totalK2O = 0;
    let totalCaO = 0;
    let totalMgO = 0;
    let totalSO4 = 0;
    let totalFe = 0;
    let totalMn = 0;
    let totalZn = 0;
    let totalCu = 0;
    let totalB = 0;
    let totalMo = 0;
    let fertilizerEC = 0;

    additions.forEach((add) => {
      if (add.kgPerTank <= 0) return;
      const f = STOCK_FERTILIZERS.find((x) => x.id === add.fertilizerId);
      if (!f) return;

      const multiplier = (add.kgPerTank * 1000 * 1000) / (tankCapacityL * dilutionRatio); // ppm

      totalN_NO3 += f.n_no3 * multiplier;
      totalN_NH4 += f.n_nh4 * multiplier;
      totalP2O5 += f.p2o5 * multiplier;
      totalK2O += f.k2o * multiplier;
      totalCaO += f.cao * multiplier;
      totalMgO += f.mgo * multiplier;
      totalSO4 += f.so4 * multiplier;

      totalFe += (f.fe_ppm / 1000000) * multiplier;
      totalMn += (f.mn_ppm / 1000000) * multiplier;
      totalZn += (f.zn_ppm / 1000000) * multiplier;
      totalCu += (f.cu_ppm / 1000000) * multiplier;
      totalB += (f.b_ppm / 1000000) * multiplier;
      totalMo += (f.mo_ppm / 1000000) * multiplier;

      // EC contribution in stock tank (g/L) divided by dilution ratio
      const stockConcGPerL = (add.kgPerTank * 1000) / tankCapacityL;
      fertilizerEC += (stockConcGPerL * f.ecFactor) / dilutionRatio;
    });

    const totalN = totalN_NO3 + totalN_NH4;
    const elementalP = totalP2O5 * 0.4364;
    const elementalK = totalK2O * 0.8302;
    const elementalCa = totalCaO * 0.7147;
    const elementalMg = totalMgO * 0.6030;
    const elementalS = totalSO4 * 0.3333;

    // meq/L for macro cations and anions
    const no3_meq = totalN_NO3 / 14.01;
    const nh4_meq = totalN_NH4 / 14.01;
    const h2po4_meq = elementalP / 30.97;
    const k_meq = elementalK / 39.10;
    const ca_meq = (elementalCa / 40.08) * 2;
    const mg_meq = (elementalMg / 24.31) * 2;
    const so4_meq = (elementalS / 32.06) * 2;

    const finalEC = Math.round((waterEC + fertilizerEC) * 100) / 100;

    return {
      // Elemental ppm
      n_total: Math.round(totalN * 10) / 10,
      n_no3: Math.round(totalN_NO3 * 10) / 10,
      n_nh4: Math.round(totalN_NH4 * 10) / 10,
      p: Math.round(elementalP * 10) / 10,
      p2o5: Math.round(totalP2O5 * 10) / 10,
      k: Math.round(elementalK * 10) / 10,
      k2o: Math.round(totalK2O * 10) / 10,
      ca: Math.round(elementalCa * 10) / 10,
      cao: Math.round(totalCaO * 10) / 10,
      mg: Math.round(elementalMg * 10) / 10,
      mgo: Math.round(totalMgO * 10) / 10,
      s: Math.round(elementalS * 10) / 10,
      so4: Math.round(totalSO4 * 10) / 10,
      // Micro ppm
      fe: Math.round(totalFe * 100) / 100,
      mn: Math.round(totalMn * 1000) / 1000,
      zn: Math.round(totalZn * 1000) / 1000,
      cu: Math.round(totalCu * 1000) / 1000,
      b: Math.round(totalB * 1000) / 1000,
      mo: Math.round(totalMo * 10000) / 10000,
      // meq/L
      no3_meq: Math.round(no3_meq * 100) / 100,
      nh4_meq: Math.round(nh4_meq * 100) / 100,
      h2po4_meq: Math.round(h2po4_meq * 100) / 100,
      k_meq: Math.round(k_meq * 100) / 100,
      ca_meq: Math.round(ca_meq * 100) / 100,
      mg_meq: Math.round(mg_meq * 100) / 100,
      so4_meq: Math.round(so4_meq * 100) / 100,
      // EC
      finalEC,
      fertilizerEC: Math.round(fertilizerEC * 100) / 100,
    };
  }, [additions, tankCapacityL, dilutionRatio, waterEC]);

  // ==========================================================================
  // Acid Requirement for Bicarbonate Neutralization
  // ==========================================================================
  const acidRequirement = useMemo(() => {
    // Water HCO3 in meq/L = mg/L / 61.02
    const hco3_meq = waterHCO3 / 61.02;
    // Target residual HCO3 to buffer pH at 5.8 is ~0.5 meq/L (30.5 mg/L)
    const targetResidualMeq = 0.5;
    const meqToNeutralize = Math.max(0, hco3_meq - targetResidualMeq);

    // Nitric acid 60% (d = 1.37 g/mL, MW = 63.01) -> 1 meq = ~0.076 mL HNO3 60% per Liter water
    // Phosphoric acid 85% (d = 1.68 g/mL, MW = 97.99) -> 1 meq = ~0.068 mL H3PO4 85% per Liter water
    const nitricMlPerM3 = Math.round(meqToNeutralize * 76.5 * 10) / 10;
    const phosphoricMlPerM3 = Math.round(meqToNeutralize * 68.5 * 10) / 10;

    // In 1000L stock tank at dilution ratio (e.g. 1:100):
    // Stock tank treats (tankCapacityL * dilutionRatio) Liters of irrigation water = (tankCapacityL * dilutionRatio / 1000) m3
    const treatedM3 = (tankCapacityL * dilutionRatio) / 1000;
    const nitricLPerTank = Math.round(((nitricMlPerM3 * treatedM3) / 1000) * 10) / 10;
    const phosphoricLPerTank = Math.round(((phosphoricMlPerM3 * treatedM3) / 1000) * 10) / 10;

    return {
      hco3_meq: Math.round(hco3_meq * 100) / 100,
      meqToNeutralize: Math.round(meqToNeutralize * 100) / 100,
      nitricMlPerM3,
      phosphoricMlPerM3,
      nitricLPerTank,
      phosphoricLPerTank,
      treatedM3,
    };
  }, [waterHCO3, tankCapacityL, dilutionRatio]);

  return (
    <div className="space-y-6">
      {/* Signature Hero Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-900 to-indigo-950 text-white p-6 shadow-xl border border-emerald-700/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                <FlaskConical className="h-6 w-6 text-emerald-300" />
              </span>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  {tr(
                    'Fertigation Tank Mix & Compatibility Solver (A & B Tanks)',
                    'حاسبة خلط وتنظيم خزانات التسميد (الخزان أ و ب والأحماض)',
                    'Calculateur de Mélange Fertigation (Bacs A, B & Acide)'
                  )}
                  <Badge variant="outline" className="bg-emerald-500/20 text-emerald-200 border-emerald-400/40 text-[10px] uppercase tracking-wider">
                    Closed-Loop Solver
                  </Badge>
                </h2>
              </div>
            </div>
            <p className="text-sm text-emerald-100/90 max-w-3xl leading-relaxed">
              {tr(
                'Closed-loop stock solution solver preventing tricalcium phosphate & gypsum precipitation, calculating precise dilution injection rates, and delivering target ppm and dripper EC.',
                'نظام خبير لحساب محاليل الأم وتوزيع الأسمدة الذائبة ومنع الترسيب الكيميائي وانسداد النقاطات مع ضبط الـ EC والـ ppm بدقة متناهية.',
                'Calcul des solutions mères, compatibilité chimique stricte et calcul d’injection selon la CE et ppm cibles.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select onValueChange={handleLoadPreset} defaultValue="tomato-fruiting-hydro">
              <SelectTrigger className="h-9 w-[220px] text-xs font-semibold bg-white/15 text-white border-white/25 backdrop-blur">
                <SelectValue placeholder={tr('Load Crop Preset...', 'اختر تركيبة محصول جاهزة...', 'Charger recette...')} />
              </SelectTrigger>
              <SelectContent>
                {PRESET_RECIPES.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id} className="text-xs">
                    {isAr ? preset.name_ar : isFr ? preset.name_fr : preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Presets Pills */}
        <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center gap-2">
          <span className="text-xs text-emerald-200/80 font-medium mr-1">
            {tr('Quick Crop Presets:', 'نماذج محاصيل سريعة:', 'Formules rapides :')}
          </span>
          {PRESET_RECIPES.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleLoadPreset(preset.id)}
              className="px-3 py-1 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-emerald-100 transition-all shadow-xs"
            >
              {isAr ? preset.name_ar : isFr ? preset.name_fr : preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Quick System Parameters Bar */}
      <Card className="border-border shadow-xs bg-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div>
              <Label className="text-[11px] text-muted-foreground">
                {tr('Stock Tank Volume (L)', 'سعة الخزان (لتر)', 'Volume Bac (L)')}
              </Label>
              <Input
                type="number"
                value={tankCapacityL}
                onChange={(e) => setTankCapacityL(Number(e.target.value) || 1000)}
                className="h-8 text-xs font-mono font-bold mt-1"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">
                {tr('Injection Ratio (1 : X)', 'نسبة الحقن (1 : س)', 'Taux d’injection (1:X)')}
              </Label>
              <Input
                type="number"
                value={dilutionRatio}
                onChange={(e) => setDilutionRatio(Number(e.target.value) || 100)}
                className="h-8 text-xs font-mono font-bold mt-1"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">
                {tr('Source Water EC (dS/m)', 'ملوحة ماء الري (EC)', 'CE Eau brute (dS/m)')}
              </Label>
              <Input
                type="number"
                step="0.1"
                value={waterEC}
                onChange={(e) => setWaterEC(Number(e.target.value) || 0)}
                className="h-8 text-xs font-mono font-bold mt-1"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">
                {tr('Water HCO₃⁻ (mg/L)', 'بيكربونات الماء (mg/L)', 'Bicarbonates HCO₃⁻')}
              </Label>
              <Input
                type="number"
                value={waterHCO3}
                onChange={(e) => setWaterHCO3(Number(e.target.value) || 0)}
                className="h-8 text-xs font-mono font-bold mt-1"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">
                {tr('Target Dripper pH', 'درجة حموضة النقاط المستهدفة', 'pH Goutteurs Cible')}
              </Label>
              <Input
                type="number"
                step="0.1"
                value={targetDripperPH}
                onChange={(e) => setTargetDripperPH(Number(e.target.value) || 5.8)}
                className="h-8 text-xs font-mono font-bold mt-1"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">
                {tr('Water Temp (°C)', 'حرارة الماء (°م)', 'Temp. Eau (°C)')}
              </Label>
              <Input
                type="number"
                value={waterTempC}
                onChange={(e) => setWaterTempC(Number(e.target.value) || 20)}
                className="h-8 text-xs font-mono font-bold mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Incompatibility Alert Banner */}
      {compatibilityAlerts.length > 0 && (
        <div className="space-y-2">
          {compatibilityAlerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex items-start gap-3 shadow-xs ${
                alert.type === 'danger'
                  ? 'bg-red-50/90 dark:bg-red-950/40 border-red-300 dark:border-red-900 text-red-950 dark:text-red-100'
                  : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900 text-amber-950 dark:text-amber-100'
              }`}
            >
              <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${alert.type === 'danger' ? 'text-red-600' : 'text-amber-600'}`} />
              <div className="text-xs">
                <div className="font-bold text-sm">{isAr ? alert.title_ar : alert.title}</div>
                <p className="mt-0.5 leading-relaxed">{isAr ? alert.desc_ar : alert.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full h-auto p-1 bg-muted/80 rounded-xl border">
          <TabsTrigger value="tanks" className="py-2 text-xs font-semibold flex items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5 text-blue-600" />
            <span>{tr('Stock Tanks (A & B & C)', 'الخزانات (أ، ب، ج)', 'Bacs Mères')}</span>
          </TabsTrigger>
          <TabsTrigger value="dripper" className="py-2 text-xs font-semibold flex items-center gap-1.5">
            <Droplets className="h-3.5 w-3.5 text-emerald-600" />
            <span>{tr('Dripper Delivery & EC', 'تركيز النقاطات و EC', 'Solution aux Goutteurs')}</span>
          </TabsTrigger>
          <TabsTrigger value="compat" className="py-2 text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
            <span>{tr('Compatibility & Salts', 'التوافق وقوانين الخلط', 'Règles de Solubilité')}</span>
          </TabsTrigger>
          <TabsTrigger value="acid" className="py-2 text-xs font-semibold flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            <span>{tr('Acid & HCO₃⁻ Neutralization', 'حقن الأحماض ومعادلة القلوية', 'Neutralisation Acide')}</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="py-2 text-xs font-semibold flex items-center gap-1.5">
            <Printer className="h-3.5 w-3.5 text-slate-600" />
            <span>{tr('Print Recipe Card', 'بطاقة الخلط للطباعة', 'Fiche Fertigation')}</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: STOCK TANKS RECIPE BUILDER */}
        <TabsContent value="tanks" className="space-y-4 pt-3">
          {/* Add Fertilizer Bar */}
          <div className="p-3 rounded-xl bg-card border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <Select value={selectedFertToAdd} onValueChange={setSelectedFertToAdd}>
                <SelectTrigger className="h-8 text-xs font-medium min-w-[260px] flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STOCK_FERTILIZERS.map((fert) => (
                    <SelectItem key={fert.id} value={fert.id} className="text-xs">
                      {isAr ? fert.name_ar : isFr ? fert.name_fr : fert.name} ({fert.formula})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTargetTank} onValueChange={(val: any) => setSelectedTargetTank(val)}>
                <SelectTrigger className="h-8 text-xs font-bold w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Tank A (Ca/Fe)</SelectItem>
                  <SelectItem value="B">Tank B (P/K/Mg/S)</SelectItem>
                  <SelectItem value="C">Tank C (Acid)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              size="sm"
              onClick={handleAddFertilizer}
              className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              {tr('Add Fertilizer to Tank', 'إضافة سماد للخزان', 'Ajouter au bac')}
            </Button>
          </div>

          {/* 3 Tanks Visual Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* TANK A CARD */}
            <Card className="border-blue-200 dark:border-blue-950 bg-blue-50/30 dark:bg-blue-950/10">
              <CardHeader className="p-3.5 pb-2 border-b bg-blue-100/50 dark:bg-blue-950/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                      A
                    </span>
                    <div>
                      <CardTitle className="text-xs font-bold">
                        {tr('Tank A (Calcium + Nitrogen + Iron)', 'الخزان أ (الكالسيوم والنيتروجين والحديد)', 'Bac A (Ca + N + Fe)')}
                      </CardTitle>
                      <span className="text-[10px] text-muted-foreground">
                        {tankStats.concA.toFixed(1)} g/L ({tankStats.tanks.A.totalKg.toFixed(1)} kg)
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${tankStats.isAOverloaded ? 'bg-red-100 text-red-700 border-red-300' : 'bg-blue-100 text-blue-700'}`}
                  >
                    {tankStats.isAOverloaded ? tr('Exceeds Solubility', 'تجاوز الذوبانية', 'Saturé') : tr('Safe Solution', 'ذائب بأمان', 'OK')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-2 text-xs">
                {additions
                  .map((add, originalIdx) => ({ add, originalIdx }))
                  .filter(({ add }) => add.tank === 'A')
                  .map(({ add, originalIdx }) => {
                    const fert = STOCK_FERTILIZERS.find((f) => f.id === add.fertilizerId);
                    if (!fert) return null;
                    return (
                      <div
                        key={originalIdx}
                        className="p-2 rounded-lg bg-card border flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[11px] truncate">
                            {isAr ? fert.name_ar : isFr ? fert.name_fr : fert.name}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground">{fert.formula}</div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.1"
                              value={add.kgPerTank}
                              onChange={(e) => handleUpdateKg(originalIdx, Number(e.target.value))}
                              className="h-7 w-16 text-xs font-mono font-bold text-right px-1"
                            />
                            <span className="text-[10px] font-semibold text-muted-foreground">kg</span>
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveAddition(originalIdx)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                {additions.filter((a) => a.tank === 'A').length === 0 && (
                  <div className="p-4 text-center text-[11px] text-muted-foreground border border-dashed rounded-lg">
                    {tr('Tank A is empty. Add Calcium Nitrate & Iron.', 'الخزان أ فارغ. أضف نترات الكالسيوم ومخلب الحديد.', 'Bac A vide.')}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* TANK B CARD */}
            <Card className="border-emerald-200 dark:border-emerald-950 bg-emerald-50/30 dark:bg-emerald-950/10">
              <CardHeader className="p-3.5 pb-2 border-b bg-emerald-100/50 dark:bg-emerald-950/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                      B
                    </span>
                    <div>
                      <CardTitle className="text-xs font-bold">
                        {tr('Tank B (P + K + Mg + S + Micros)', 'الخزان ب (الفوسفور والبوتاسيوم والمغنيسيوم والصغرى)', 'Bac B (P + K + Mg + S + Micros)')}
                      </CardTitle>
                      <span className="text-[10px] text-muted-foreground">
                        {tankStats.concB.toFixed(1)} g/L ({tankStats.tanks.B.totalKg.toFixed(1)} kg)
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${tankStats.isBOverloaded ? 'bg-red-100 text-red-700 border-red-300' : 'bg-emerald-100 text-emerald-700'}`}
                  >
                    {tankStats.isBOverloaded ? tr('Exceeds Solubility', 'تجاوز الذوبانية', 'Saturé') : tr('Safe Solution', 'ذائب بأمان', 'OK')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-2 text-xs">
                {additions
                  .map((add, originalIdx) => ({ add, originalIdx }))
                  .filter(({ add }) => add.tank === 'B')
                  .map(({ add, originalIdx }) => {
                    const fert = STOCK_FERTILIZERS.find((f) => f.id === add.fertilizerId);
                    if (!fert) return null;
                    return (
                      <div
                        key={originalIdx}
                        className="p-2 rounded-lg bg-card border flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[11px] truncate">
                            {isAr ? fert.name_ar : isFr ? fert.name_fr : fert.name}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground">{fert.formula}</div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.1"
                              value={add.kgPerTank}
                              onChange={(e) => handleUpdateKg(originalIdx, Number(e.target.value))}
                              className="h-7 w-16 text-xs font-mono font-bold text-right px-1"
                            />
                            <span className="text-[10px] font-semibold text-muted-foreground">kg</span>
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveAddition(originalIdx)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                {additions.filter((a) => a.tank === 'B').length === 0 && (
                  <div className="p-4 text-center text-[11px] text-muted-foreground border border-dashed rounded-lg">
                    {tr('Tank B is empty. Add MAP, MKP, SOP & MgSO4.', 'الخزان ب فارغ. أضف الفوسفات وسلفات البوتاسيوم.', 'Bac B vide.')}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* TANK C (ACID TANK) */}
            <Card className="border-amber-200 dark:border-amber-950 bg-amber-50/30 dark:bg-amber-950/10">
              <CardHeader className="p-3.5 pb-2 border-b bg-amber-100/50 dark:bg-amber-950/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center">
                      C
                    </span>
                    <div>
                      <CardTitle className="text-xs font-bold">
                        {tr('Tank C (Acid Injector / pH Control)', 'الخزان ج (الأحماض وضبط الحموضة)', 'Bac C (Acide / pH)')}
                      </CardTitle>
                      <span className="text-[10px] text-muted-foreground">
                        {tankStats.tanks.C.totalKg.toFixed(1)} L {tr('acid dose', 'جرعة حمض', 'dose')}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-700">
                    pH {targetDripperPH}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-2 text-xs">
                {additions
                  .map((add, originalIdx) => ({ add, originalIdx }))
                  .filter(({ add }) => add.tank === 'C')
                  .map(({ add, originalIdx }) => {
                    const fert = STOCK_FERTILIZERS.find((f) => f.id === add.fertilizerId);
                    if (!fert) return null;
                    return (
                      <div
                        key={originalIdx}
                        className="p-2 rounded-lg bg-card border flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[11px] truncate">
                            {isAr ? fert.name_ar : isFr ? fert.name_fr : fert.name}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground">{fert.formula}</div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.1"
                              value={add.kgPerTank}
                              onChange={(e) => handleUpdateKg(originalIdx, Number(e.target.value))}
                              className="h-7 w-16 text-xs font-mono font-bold text-right px-1"
                            />
                            <span className="text-[10px] font-semibold text-muted-foreground">L</span>
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveAddition(originalIdx)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                {additions.filter((a) => a.tank === 'C').length === 0 && (
                  <div className="p-4 text-center text-[11px] text-muted-foreground border border-dashed rounded-lg">
                    {tr('Tank C is optional. Used for Nitric or Phosphoric acid pH control.', 'الخزان ج اختياري للأحماض لخفض القلوية.', 'Bac C optionnel.')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: FINAL DRIPPER NUTRIENT DELIVERY & EC */}
        <TabsContent value="dripper" className="space-y-4 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Summary EC Meter */}
            <Card className="border shadow-xs bg-gradient-to-br from-emerald-500 to-teal-700 text-white">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold opacity-90">
                    {tr('Target Delivered EC at Drippers', 'الناقلية الكهربائية النهائية عند النقاطات', 'CE Finale aux Goutteurs')}
                  </span>
                  <div className="text-4xl font-black mt-1 font-mono">
                    {finalDripperNutrients.finalEC}{' '}
                    <span className="text-lg font-normal">dS/m</span>
                  </div>
                  <p className="text-xs opacity-80 mt-1">
                    {tr('Source Water EC', 'ملوحة ماء الري', 'CE Eau brute')}: {waterEC} dS/m + {tr('Fertilizer EC', 'أسمدة', 'Engrais')}: {finalDripperNutrients.fertilizerEC} dS/m
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-white/10 backdrop-blur-xs text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>{tr('Dilution Rate', 'معدل التخفيف', 'Dilution')}:</span>
                    <span className="font-bold font-mono">1 : {dilutionRatio} ({(100 / dilutionRatio).toFixed(1)}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{tr('Target Rootzone pH', 'درجة حموضة الجذور', 'pH Cible')}:</span>
                    <span className="font-bold font-mono">{targetDripperPH}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Macro Nutrients Table */}
            <Card className="md:col-span-2 border shadow-xs">
              <CardHeader className="p-4 pb-2 border-b">
                <CardTitle className="text-xs font-bold flex items-center justify-between">
                  <span>{tr('Macro-Nutrient Concentration at Dripper', 'تركيز العناصر الكبرى عند النقاط (ppm & meq/L)', 'Concentration Macro-Éléments')}</span>
                  <Badge variant="secondary" className="text-[10px]">ppm = mg/L</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 text-[11px] text-muted-foreground border-b">
                    <tr>
                      <th className="p-2.5">{tr('Nutrient', 'العنصر', 'Élément')}</th>
                      <th className="p-2.5 text-right">Elemental (ppm)</th>
                      <th className="p-2.5 text-right">Oxide (ppm)</th>
                      <th className="p-2.5 text-right">Charge (meq/L)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-mono">
                    <tr className="hover:bg-muted/30">
                      <td className="p-2.5 font-bold font-sans flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        Nitrate Nitrogen (N-NO₃)
                      </td>
                      <td className="p-2.5 text-right font-bold text-blue-600">{finalDripperNutrients.n_no3}</td>
                      <td className="p-2.5 text-right text-muted-foreground">—</td>
                      <td className="p-2.5 text-right">{finalDripperNutrients.no3_meq}</td>
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="p-2.5 font-bold font-sans flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-300" />
                        Ammoniacal Nitrogen (N-NH₄)
                      </td>
                      <td className="p-2.5 text-right font-bold">{finalDripperNutrients.n_nh4}</td>
                      <td className="p-2.5 text-right text-muted-foreground">—</td>
                      <td className="p-2.5 text-right">{finalDripperNutrients.nh4_meq}</td>
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="p-2.5 font-bold font-sans flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        Phosphorus (P / P₂O₅)
                      </td>
                      <td className="p-2.5 text-right font-bold text-amber-600">{finalDripperNutrients.p}</td>
                      <td className="p-2.5 text-right text-muted-foreground">{finalDripperNutrients.p2o5}</td>
                      <td className="p-2.5 text-right">{finalDripperNutrients.h2po4_meq}</td>
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="p-2.5 font-bold font-sans flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        Potassium (K / K₂O)
                      </td>
                      <td className="p-2.5 text-right font-bold text-red-600">{finalDripperNutrients.k}</td>
                      <td className="p-2.5 text-right text-muted-foreground">{finalDripperNutrients.k2o}</td>
                      <td className="p-2.5 text-right">{finalDripperNutrients.k_meq}</td>
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="p-2.5 font-bold font-sans flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Calcium (Ca / CaO)
                      </td>
                      <td className="p-2.5 text-right font-bold text-emerald-600">{finalDripperNutrients.ca}</td>
                      <td className="p-2.5 text-right text-muted-foreground">{finalDripperNutrients.cao}</td>
                      <td className="p-2.5 text-right">{finalDripperNutrients.ca_meq}</td>
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="p-2.5 font-bold font-sans flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-purple-500" />
                        Magnesium (Mg / MgO)
                      </td>
                      <td className="p-2.5 text-right font-bold text-purple-600">{finalDripperNutrients.mg}</td>
                      <td className="p-2.5 text-right text-muted-foreground">{finalDripperNutrients.mgo}</td>
                      <td className="p-2.5 text-right">{finalDripperNutrients.mg_meq}</td>
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="p-2.5 font-bold font-sans flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-yellow-500" />
                        Sulfur (S / SO₄)
                      </td>
                      <td className="p-2.5 text-right font-bold text-yellow-600">{finalDripperNutrients.s}</td>
                      <td className="p-2.5 text-right text-muted-foreground">{finalDripperNutrients.so4}</td>
                      <td className="p-2.5 text-right">{finalDripperNutrients.so4_meq}</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Micro Nutrients Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-card border text-xs">
              <div className="text-[11px] text-muted-foreground font-semibold">Iron (Fe)</div>
              <div className="text-base font-black font-mono mt-0.5 text-foreground">{finalDripperNutrients.fe} ppm</div>
              <div className="text-[10px] text-muted-foreground">Target: 0.8 - 2.5 ppm</div>
            </div>
            <div className="p-3 rounded-xl bg-card border text-xs">
              <div className="text-[11px] text-muted-foreground font-semibold">Manganese (Mn)</div>
              <div className="text-base font-black font-mono mt-0.5 text-foreground">{finalDripperNutrients.mn} ppm</div>
              <div className="text-[10px] text-muted-foreground">Target: 0.3 - 0.8 ppm</div>
            </div>
            <div className="p-3 rounded-xl bg-card border text-xs">
              <div className="text-[11px] text-muted-foreground font-semibold">Zinc (Zn)</div>
              <div className="text-base font-black font-mono mt-0.5 text-foreground">{finalDripperNutrients.zn} ppm</div>
              <div className="text-[10px] text-muted-foreground">Target: 0.2 - 0.5 ppm</div>
            </div>
            <div className="p-3 rounded-xl bg-card border text-xs">
              <div className="text-[11px] text-muted-foreground font-semibold">Copper (Cu)</div>
              <div className="text-base font-black font-mono mt-0.5 text-foreground">{finalDripperNutrients.cu} ppm</div>
              <div className="text-[10px] text-muted-foreground">Target: 0.03 - 0.08 ppm</div>
            </div>
            <div className="p-3 rounded-xl bg-card border text-xs">
              <div className="text-[11px] text-muted-foreground font-semibold">Boron (B)</div>
              <div className="text-base font-black font-mono mt-0.5 text-foreground">{finalDripperNutrients.b} ppm</div>
              <div className="text-[10px] text-muted-foreground">Target: 0.2 - 0.6 ppm</div>
            </div>
            <div className="p-3 rounded-xl bg-card border text-xs">
              <div className="text-[11px] text-muted-foreground font-semibold">Molybdenum (Mo)</div>
              <div className="text-base font-black font-mono mt-0.5 text-foreground">{finalDripperNutrients.mo} ppm</div>
              <div className="text-[10px] text-muted-foreground">Target: 0.02 - 0.05 ppm</div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: COMPATIBILITY & SOLUBILITY RULES */}
        <TabsContent value="compat" className="space-y-4 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border shadow-xs">
              <CardHeader className="p-4 pb-2 border-b">
                <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  {tr('The Golden Rules of Stock Tank Separation', 'القواعد الذهبية لتوزيع الأسمدة في الخزانات', 'Règles de Séparation des Bacs')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs leading-relaxed">
                <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200">
                  <div className="font-bold text-blue-900 dark:text-blue-200">Tank A: Calcium + Iron Domain</div>
                  <p className="text-[11px] text-blue-950 dark:text-blue-100 mt-0.5">
                    Contains Calcium Nitrate, Potassium Nitrate (portion), and Iron Chelates (EDDHA / DTPA). Must NEVER contain Phosphates or Sulfates.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200">
                  <div className="font-bold text-emerald-900 dark:text-emerald-200">Tank B: Phosphate + Sulfate Domain</div>
                  <p className="text-[11px] text-emerald-950 dark:text-emerald-100 mt-0.5">
                    Contains MAP, MKP, Potassium Sulfate (SOP), Magnesium Sulfate, and micronutrients (Zn, Mn, Cu, B, Mo).
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200">
                  <div className="font-bold text-amber-900 dark:text-amber-200">Tank C: Acid Tank (Optional)</div>
                  <p className="text-[11px] text-amber-950 dark:text-amber-100 mt-0.5">
                    Contains concentrated Nitric Acid (HNO₃ 60%) or Phosphoric Acid (H₃PO₄ 85%) for direct pH regulation at the mixing unit.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-xs">
              <CardHeader className="p-4 pb-2 border-b">
                <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                  <FlaskConical className="h-4 w-4 text-purple-600" />
                  {tr('Solubility & Temperature Thresholds', 'الذوبانية وحدود الإشباع بالحرارة', 'Limites de Solubilité')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs leading-relaxed">
                <p className="text-muted-foreground text-[11px]">
                  {tr(
                    'In cold weather (<15°C), fertilizer solubility drops significantly. SOP (K₂SO₄) and Potassium Nitrate are most prone to salting out at the bottom of the tank.',
                    'في الطقس البارد (أقل من 15°م)، تقل ذوبانية سلفات ونترات البوتاسيوم بشكل حاد مما يسبب ترسب بلورات صلبة في قاع الخزان.',
                    'À basse température (<15°C), la solubilité du SOP et du Nitrate de Potassium chute fortement.'
                  )}
                </p>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between p-1.5 rounded bg-muted/40">
                    <span className="font-sans font-semibold">Calcium Nitrate:</span>
                    <span>1,200 g/L (Extremely Soluble)</span>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-muted/40">
                    <span className="font-sans font-semibold">MAP (12-61-0):</span>
                    <span>370 g/L (Good)</span>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-muted/40">
                    <span className="font-sans font-semibold">Potassium Nitrate:</span>
                    <span>316 g/L @ 20°C (130 g/L @ 5°C)</span>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-muted/40">
                    <span className="font-sans font-semibold">MKP (0-52-34):</span>
                    <span>226 g/L @ 20°C</span>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-muted/40 text-amber-600 font-bold">
                    <span className="font-sans font-semibold">SOP (K₂SO₄):</span>
                    <span>110 g/L (Lowest solubility — max 70kg/1000L)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 4: ACID DOSING & HCO3- NEUTRALIZATION */}
        <TabsContent value="acid" className="space-y-4 pt-3">
          <Card className="border shadow-xs">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                {tr(
                  'Irrigation Water Bicarbonate (HCO₃⁻) Neutralization Calculator',
                  'حاسبة معادلة قلوية وبيكربونات مياه الري بالأحماض',
                  'Calculateur de Neutralisation des Bicarbonates'
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-muted/50 border space-y-1">
                  <div className="text-muted-foreground font-semibold">{tr('Raw Water Bicarbonate', 'بيكربونات الماء الخام', 'HCO₃⁻ Brut')}</div>
                  <div className="text-xl font-bold font-mono text-foreground">{waterHCO3} mg/L</div>
                  <div className="text-[11px] text-muted-foreground font-mono">({acidRequirement.hco3_meq} meq/L)</div>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 space-y-1">
                  <div className="text-amber-900 dark:text-amber-200 font-semibold">{tr('Bicarbonates to Neutralize', 'البيكربونات المطلوب معادلتها', 'À Neutraliser')}</div>
                  <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300">
                    {acidRequirement.meqToNeutralize} meq/L
                  </div>
                  <div className="text-[11px] text-muted-foreground">{tr('Leaving 0.5 meq/L pH buffer', 'مع إبقاء 0.5 ميكاف/لتر أمان', 'Garde 0.5 meq/L')}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 space-y-1">
                  <div className="text-emerald-900 dark:text-emerald-200 font-semibold">{tr('Total Water Treated per Tank', 'حجم المياه المعالج لكل خزان أم', 'Volume traité')}</div>
                  <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                    {acidRequirement.treatedM3} m³
                  </div>
                  <div className="text-[11px] text-muted-foreground">({(acidRequirement.treatedM3 * 1000).toLocaleString()} Liters)</div>
                </div>
              </div>

              {/* Recommended Acid Dosage Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-blue-900 dark:text-blue-200">Option 1: Nitric Acid (HNO₃ 60%)</span>
                    <Badge className="bg-blue-600 text-white font-mono text-xs">{acidRequirement.nitricMlPerM3} mL / m³</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Adds nitrogen (N-NO₃) to the fertigation stream while lowering pH without precipitation hazard.
                  </p>
                  <div className="p-2 rounded bg-background border font-mono font-bold text-xs text-foreground">
                    {tr('Add to Stock Tank C', 'الجرعة المطلوبة في الخزان ج', 'Dose dans Bac C')}:{' '}
                    <span className="text-blue-600">{acidRequirement.nitricLPerTank} Liters</span> per {tankCapacityL}L tank
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-amber-900 dark:text-amber-200">Option 2: Phosphoric Acid (H₃PO₄ 85%)</span>
                    <Badge className="bg-amber-600 text-white font-mono text-xs">{acidRequirement.phosphoricMlPerM3} mL / m³</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Adds available phosphorus (P₂O₅) while lowering pH. (Place in Tank B or Tank C, NEVER Tank A).
                  </p>
                  <div className="p-2 rounded bg-background border font-mono font-bold text-xs text-foreground">
                    {tr('Add to Stock Tank C/B', 'الجرعة المطلوبة في الخزان ج/ب', 'Dose dans Bac C/B')}:{' '}
                    <span className="text-amber-600">{acidRequirement.phosphoricLPerTank} Liters</span> per {tankCapacityL}L tank
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: PRINT RECIPE CARD */}
        <TabsContent value="export" className="space-y-4 pt-3">
          <Card className="border shadow-xs print:border-none print:shadow-none">
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">
                  {tr('Field Fertigation Operator Work Order', 'أمر تشغيل وخلط التسميد الحقلي', 'Fiche d’Instruction de Fertigation')}
                </CardTitle>
                <CardDescription className="text-xs">
                  {tr('Printable recipe card for irrigation technicians.', 'بطاقة عمل قابلة للطباعة والتسليم لفني الري والتسميد.', 'Fiche imprimable pour l’opérateur.')}
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="h-8 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white"
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                {tr('Print Recipe Card', 'طباعة البطاقة', 'Imprimer')}
              </Button>
            </CardHeader>

            <CardContent className="p-6 space-y-6 text-xs font-sans">
              {/* Header Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-muted/40 border">
                <div>
                  <span className="text-[10px] text-muted-foreground">{tr('Tank Size', 'سعة الخزان', 'Capacité')}</span>
                  <div className="font-bold">{tankCapacityL} Liters</div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">{tr('Injection Ratio', 'نسبة الحقن', 'Injection')}</span>
                  <div className="font-bold">1 : {dilutionRatio} ({(100 / dilutionRatio).toFixed(1)}%)</div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">{tr('Target Dripper EC', 'الناقلية المستهدفة', 'CE Cible')}</span>
                  <div className="font-bold text-emerald-600">{finalDripperNutrients.finalEC} dS/m</div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">{tr('Target pH', 'الحموضة المستهدفة', 'pH')}</span>
                  <div className="font-bold">{targetDripperPH}</div>
                </div>
              </div>

              {/* Tank Breakdown Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-xl p-3 bg-blue-50/20">
                  <div className="font-bold text-xs text-blue-900 dark:text-blue-200 mb-2 flex items-center justify-between border-b pb-1">
                    <span>{tr('Tank A Recipe (Dissolve in 800L warm water first)', 'تركيبة الخزان أ (أذب في 800 لتر ماء أولاً)', 'Bac A')}</span>
                    <Badge variant="secondary" className="text-[10px]">{tankStats.tanks.A.totalKg.toFixed(1)} kg total</Badge>
                  </div>
                  <table className="w-full text-xs">
                    <tbody>
                      {additions
                        .filter((a) => a.tank === 'A' && a.kgPerTank > 0)
                        .map((add, i) => {
                          const fert = STOCK_FERTILIZERS.find((f) => f.id === add.fertilizerId);
                          return (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-1.5 font-medium">{isAr ? fert?.name_ar : isFr ? fert?.name_fr : fert?.name}</td>
                              <td className="py-1.5 text-right font-mono font-bold text-blue-600">{add.kgPerTank} kg</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                <div className="border rounded-xl p-3 bg-emerald-50/20">
                  <div className="font-bold text-xs text-emerald-900 dark:text-emerald-200 mb-2 flex items-center justify-between border-b pb-1">
                    <span>{tr('Tank B Recipe (Dissolve in 800L warm water first)', 'تركيبة الخزان ب (أذب في 800 لتر ماء أولاً)', 'Bac B')}</span>
                    <Badge variant="secondary" className="text-[10px]">{tankStats.tanks.B.totalKg.toFixed(1)} kg total</Badge>
                  </div>
                  <table className="w-full text-xs">
                    <tbody>
                      {additions
                        .filter((a) => a.tank === 'B' && a.kgPerTank > 0)
                        .map((add, i) => {
                          const fert = STOCK_FERTILIZERS.find((f) => f.id === add.fertilizerId);
                          return (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-1.5 font-medium">{isAr ? fert?.name_ar : isFr ? fert?.name_fr : fert?.name}</td>
                              <td className="py-1.5 text-right font-mono font-bold text-emerald-600">{add.kgPerTank} kg</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Operator Sign-off */}
              <div className="pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                <div>
                  {tr('Prepared by: _____________________', 'إعداد المهندس الزراعي: _____________________', 'Établi par : _____________________')}
                </div>
                <div>
                  {tr('Operator Execution: _____________________', 'توقيع فني الخلط والري: _____________________', 'Opérateur : _____________________')}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
