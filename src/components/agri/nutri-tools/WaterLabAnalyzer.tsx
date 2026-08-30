'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Droplets,
  Beaker,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Split,
  Activity,
  Layers,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation, copyFor } from '@/lib/language-store';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

// ============================================================================
// CalculatorShell metadata (trilingual)
// ============================================================================

const TITLE: TrilingualString = {
  en: 'Smart Irrigation Water Quality & Dual-Source Blending Analyzer',
  ar: 'محلل جودة مياه الري وحاسبة خلط المصادر المائية (USSL / SAR / IWQI)',
  fr: 'Diagnostic Qualité Eau d’Irrigation & Mélange Multi-Sources',
};

const DESC: TrilingualString = {
  en: 'Laboratory hydrochemical diagnostics, US Salinity Lab C-S diagram, SAR/Infiltration risks, and 2-source blending solver.',
  ar: 'تحليل كيميائي متقدم لمياه الآبار والمصادر، وتصنيف المخاطر الملحية والصودية، وحاسبة الخلط التناسبي لتحقيق حدود تحمل المحصول.',
  fr: 'Classification FAO/USSL (C-S), SAR ajusté, risque d’infiltration et solveur de coupage d’eau pour sécuriser les cultures.',
};

// ============================================================================
// Types & Presets
// ============================================================================

export interface WaterLabSample {
  id: string;
  name: string;
  name_ar: string;
  name_fr: string;
  sourceType: 'groundwater' | 'surface' | 'desalinated' | 'recycled';
  // Physical
  ph: number;
  ec: number; // dS/m at 25°C
  tds: number; // mg/L or ppm
  // Cations (mg/L)
  ca_mgL: number;
  mg_mgL: number;
  na_mgL: number;
  k_mgL: number;
  // Anions (mg/L)
  hco3_mgL: number;
  co3_mgL: number;
  cl_mgL: number;
  so4_mgL: number;
  no3_mgL: number;
  // Trace / Toxicity (mg/L)
  boron_mgL: number;
}

export const WATER_PRESETS: WaterLabSample[] = [
  {
    id: 'mitidja-groundwater',
    name: 'Mitidja Alluvial Plain (Good Quality Well)',
    name_ar: 'مياه سهل متيجة (بئر ذو جودة عالية)',
    name_fr: 'Plaine de la Mitidja (Puits Bonne Qualité)',
    sourceType: 'groundwater',
    ph: 7.2,
    ec: 0.85,
    tds: 544,
    ca_mgL: 80,
    mg_mgL: 24,
    na_mgL: 35,
    k_mgL: 4,
    hco3_mgL: 210,
    co3_mgL: 0,
    cl_mgL: 65,
    so4_mgL: 75,
    no3_mgL: 25,
    boron_mgL: 0.2,
  },
  {
    id: 'biskra-saharan-deep',
    name: 'Biskra / Oued Righ Saharan Deep Borehole (Saline-Gypsiferous)',
    name_ar: 'مياه بسكرة ووادي ريغ (بئر عميق ألبي مالح كبريتي)',
    name_fr: 'Biskra / Oued Righ (Forage Saharien Salin)',
    sourceType: 'groundwater',
    ph: 7.6,
    ec: 4.8,
    tds: 3120,
    ca_mgL: 380,
    mg_mgL: 145,
    na_mgL: 490,
    k_mgL: 28,
    hco3_mgL: 160,
    co3_mgL: 0,
    cl_mgL: 820,
    so4_mgL: 1450,
    no3_mgL: 12,
    boron_mgL: 0.9,
  },
  {
    id: 'chlef-saline-sodic',
    name: 'Lower Chlef Valley (High Sodium / Sodic Well)',
    name_ar: 'وادي الشلف السفلي (بئر مرتفع الصودية والملوحة)',
    name_fr: 'Basse Vallée du Chlef (Puits Sodique)',
    sourceType: 'groundwater',
    ph: 8.2,
    ec: 3.4,
    tds: 2200,
    ca_mgL: 65,
    mg_mgL: 45,
    na_mgL: 580,
    k_mgL: 15,
    hco3_mgL: 340,
    co3_mgL: 15,
    cl_mgL: 720,
    so4_mgL: 480,
    no3_mgL: 35,
    boron_mgL: 1.4,
  },
  {
    id: 'desalinated-ro',
    name: 'Desalinated Reverse Osmosis (RO Permeate)',
    name_ar: 'مياه محلاة بالتناضح العكسي (RO)',
    name_fr: 'Eau Dessalée Osmose Inverse (OI)',
    sourceType: 'desalinated',
    ph: 6.4,
    ec: 0.15,
    tds: 96,
    ca_mgL: 4,
    mg_mgL: 2,
    na_mgL: 18,
    k_mgL: 1,
    hco3_mgL: 15,
    co3_mgL: 0,
    cl_mgL: 28,
    so4_mgL: 8,
    no3_mgL: 1,
    boron_mgL: 0.05,
  },
];

export interface CropSalinityTolerance {
  id: string;
  name: string;
  name_ar: string;
  name_fr: string;
  category: 'vegetable' | 'fruit' | 'field' | 'forage';
  thresholdECe: number; // dS/m
  slopePct: number; // % yield loss per dS/m above threshold
  maxToleratedECw: number; // dS/m irrigation water
  maxChloridePpm: number;
  maxSodiumPpm: number;
  maxBoronPpm: number;
}

export const CROP_SALINITY_DATABASE: CropSalinityTolerance[] = [
  {
    id: 'strawberry',
    name: 'Strawberry (Very Sensitive)',
    name_ar: 'فراولة (شديدة الحساسية)',
    name_fr: 'Fraisier (Très Sensible)',
    category: 'fruit',
    thresholdECe: 1.0,
    slopePct: 33,
    maxToleratedECw: 0.7,
    maxChloridePpm: 120,
    maxSodiumPpm: 70,
    maxBoronPpm: 0.5,
  },
  {
    id: 'citrus',
    name: 'Citrus / Orange (Sensitive to Cl & Na)',
    name_ar: 'حمضيات / برتقال (حساس للكلور والصوديوم)',
    name_fr: 'Agrumes / Oranger (Sensible au Cl et Na)',
    category: 'fruit',
    thresholdECe: 1.7,
    slopePct: 16,
    maxToleratedECw: 1.1,
    maxChloridePpm: 180,
    maxSodiumPpm: 115,
    maxBoronPpm: 0.7,
  },
  {
    id: 'potato',
    name: 'Potato (Moderately Sensitive)',
    name_ar: 'بطاطا (متوسطة الحساسية)',
    name_fr: 'Pomme de Terre (Moyennement Sensible)',
    category: 'vegetable',
    thresholdECe: 1.7,
    slopePct: 12,
    maxToleratedECw: 1.1,
    maxChloridePpm: 250,
    maxSodiumPpm: 150,
    maxBoronPpm: 1.0,
  },
  {
    id: 'tomato',
    name: 'Tomato (Moderately Tolerant)',
    name_ar: 'طماطم (متوسطة التحمل)',
    name_fr: 'Tomate (Moyennement Tolérante)',
    category: 'vegetable',
    thresholdECe: 2.5,
    slopePct: 9.9,
    maxToleratedECw: 1.7,
    maxChloridePpm: 350,
    maxSodiumPpm: 230,
    maxBoronPpm: 1.5,
  },
  {
    id: 'olive',
    name: 'Olive Tree (Tolerant)',
    name_ar: 'زيتون (متحمل للملوحة)',
    name_fr: 'Olivier (Tolérant)',
    category: 'fruit',
    thresholdECe: 3.8,
    slopePct: 7.2,
    maxToleratedECw: 2.5,
    maxChloridePpm: 450,
    maxSodiumPpm: 300,
    maxBoronPpm: 2.0,
  },
  {
    id: 'date-palm',
    name: 'Date Palm (Highly Tolerant)',
    name_ar: 'نخيل التمر (عالي التحمل جداً)',
    name_fr: 'Palmier Dattier (Très Tolérant)',
    category: 'fruit',
    thresholdECe: 4.0,
    slopePct: 3.6,
    maxToleratedECw: 3.2,
    maxChloridePpm: 900,
    maxSodiumPpm: 600,
    maxBoronPpm: 4.0,
  },
  {
    id: 'barley',
    name: 'Barley (Extremely Tolerant Grain)',
    name_ar: 'شعير (متحمل جداً)',
    name_fr: 'Orge (Extrêmement Tolérant)',
    category: 'field',
    thresholdECe: 8.0,
    slopePct: 5.0,
    maxToleratedECw: 5.3,
    maxChloridePpm: 1000,
    maxSodiumPpm: 700,
    maxBoronPpm: 5.0,
  },
];

// ============================================================================
// Main Component
// ============================================================================

export function WaterLabAnalyzer() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const isAr = language === 'ar';
  const isFr = language === 'fr';

  // Water Test Inputs
  const [ph, setPh] = useState<number>(7.6);
  const [ec, setEc] = useState<number>(2.4);
  const [tds, setTds] = useState<number>(1536);

  // Cations (mg/L)
  const [ca, setCa] = useState<number>(140);
  const [mg, setMg] = useState<number>(55);
  const [na, setNa] = useState<number>(280);
  const [k, setK] = useState<number>(12);

  // Anions (mg/L)
  const [hco3, setHco3] = useState<number>(220);
  const [co3, setCo3] = useState<number>(0);
  const [cl, setCl] = useState<number>(410);
  const [so4, setSo4] = useState<number>(510);
  const [no3, setNo3] = useState<number>(25);

  // Trace
  const [boron, setBoron] = useState<number>(0.8);

  // Selected Target Crop for Sensitivity Check
  const [selectedCropId, setSelectedCropId] = useState<string>('tomato');

  // Dual-Source Water Blending State
  const [blendSource2EC, setBlendSource2EC] = useState<number>(0.3); // dS/m (e.g. Desalinated / Canal)
  const [blendTargetEC, setBlendTargetEC] = useState<number>(1.5); // dS/m

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'crops' | 'blending' | 'infiltration'>('diagnosis');
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  const handleCopyReport = () => {
    const text = `
=== IRRIGATION WATER QUALITY DIAGNOSTIC REPORT ===
pH: ${ph} | ECw: ${ec} dS/m | TDS: ${tds} mg/L
USSL Class: ${diagnostics.usslCode} (${diagnostics.usslRisk})
SAR: ${diagnostics.sar} (adjSAR: ${diagnostics.adjSAR})
Infiltration Risk: ${diagnostics.infiltrationRisk}
Hardness (CaCO3): ${diagnostics.hardnessCaCO3} mg/L

1. CATIONS (mg/L / meq/L):
• Ca²⁺: ${ca} mg/L (${diagnostics.ca_meq} meq/L)
• Mg²⁺: ${mg} mg/L (${diagnostics.mg_meq} meq/L)
• Na⁺: ${na} mg/L (${diagnostics.na_meq} meq/L)
• K⁺: ${k} mg/L (${diagnostics.k_meq} meq/L)
Total Cations: ${diagnostics.sumCations} meq/L

2. ANIONS (mg/L / meq/L):
• HCO₃⁻: ${hco3} mg/L (${diagnostics.hco3_meq} meq/L)
• CO₃²⁻: ${co3} mg/L (${diagnostics.co3_meq} meq/L)
• Cl⁻: ${cl} mg/L (${diagnostics.cl_meq} meq/L)
• SO₄²⁻: ${so4} mg/L (${diagnostics.so4_meq} meq/L)
• NO₃⁻: ${no3} mg/L (${diagnostics.no3_meq} meq/L)
Total Anions: ${diagnostics.sumAnions} meq/L
Charge Balance Error: ${diagnostics.chargeBalanceErrorPct}% (${diagnostics.isChargeBalanced ? 'BALANCED' : 'IMBALANCE > 5%'})

3. TOXICITY & RESTRICTIONS:
• Chloride Toxicity: ${diagnostics.clToxRisk}
• Sodium Hazard: ${diagnostics.naToxRisk}
• Boron Hazard: ${diagnostics.boronRisk}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    toast({
      title: tr('Report Copied!', 'تم نسخ تقرير جودة المياه!', 'Rapport copié !'),
      description: tr('Full hydrochemical summary copied to clipboard.', 'تم نسخ ملخص التحليل الهيدروكيميائي إلى الحافظة.', 'Rapport copié dans le presse-papier.'),
    });
    setTimeout(() => setCopiedReport(false), 3000);
  };

  const handleReset = () => {
    setPh(7.6);
    setEc(2.4);
    setTds(1536);
    setCa(140);
    setMg(55);
    setNa(280);
    setK(12);
    setHco3(220);
    setCo3(0);
    setCl(410);
    setSo4(510);
    setNo3(25);
    setBoron(0.8);
    setBlendSource2EC(0.3);
    setBlendTargetEC(1.5);
    setSelectedCropId('tomato');
    setActiveTab('diagnosis');
    toast({
      title: tr('Reset Complete', 'تمت إعادة التعيين', 'Réinitialisation terminée'),
      description: tr('All lab parameters restored to default values.', 'تم استرجاع جميع المعطيات إلى القيم الافتراضية.', 'Tous les paramètres ont été réinitialisés.'),
    });
  };

  // Load Preset
  const handleLoadPreset = (presetId: string) => {
    const p = WATER_PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    setPh(p.ph);
    setEc(p.ec);
    setTds(p.tds);
    setCa(p.ca_mgL);
    setMg(p.mg_mgL);
    setNa(p.na_mgL);
    setK(p.k_mgL);
    setHco3(p.hco3_mgL);
    setCo3(p.co3_mgL);
    setCl(p.cl_mgL);
    setSo4(p.so4_mgL);
    setNo3(p.no3_mgL);
    setBoron(p.boron_mgL);

    toast({
      title: tr('Water Sample Loaded', 'تم تحميل عينة المياه', 'Échantillon chargé'),
      description: isAr ? p.name_ar : isFr ? p.name_fr : p.name,
    });
  };

  // ==========================================================================
  // Hydrochemical & Diagnostic Calculations
  // ==========================================================================
  const diagnostics = useMemo(() => {
    // 1. Convert mg/L (ppm) to meq/L (milli-equivalents per Liter)
    // Equivalent weights: Ca=20.04, Mg=12.15, Na=23.00, K=39.10
    // HCO3=61.02, CO3=30.00, Cl=35.45, SO4=48.03, NO3=62.00
    const ca_meq = ca / 20.04;
    const mg_meq = mg / 12.15;
    const na_meq = na / 23.00;
    const k_meq = k / 39.10;
    const sumCations = ca_meq + mg_meq + na_meq + k_meq;

    const hco3_meq = hco3 / 61.02;
    const co3_meq = co3 / 30.00;
    const cl_meq = cl / 35.45;
    const so4_meq = so4 / 48.03;
    const no3_meq = no3 / 62.00;
    const sumAnions = hco3_meq + co3_meq + cl_meq + so4_meq + no3_meq;

    // Charge Balance Error % = 100 * (sumCations - sumAnions) / (sumCations + sumAnions)
    const chargeBalanceDiff = sumCations - sumAnions;
    const chargeBalanceErrorPct =
      sumCations + sumAnions > 0
        ? Math.round((Math.abs(chargeBalanceDiff) / (sumCations + sumAnions)) * 200 * 10) / 10
        : 0;

    // 2. Sodium Adsorption Ratio (SAR)
    // SAR = Na / sqrt((Ca + Mg)/2) using meq/L
    const divisor = Math.sqrt((ca_meq + mg_meq) / 2);
    const sar = divisor > 0 ? Math.round((na_meq / divisor) * 10) / 10 : 0;

    // Adjusted SAR (adj SAR) considering calcium bicarbonate equilibrium (Ayers & Westcot FAO 29)
    // adj SAR = SAR * (1 + (8.4 - pHc))
    // Approximate pHc from (pK'2 - pK'c) + p(Ca+Mg) + p(Alk)
    const pCaMg = -Math.log10(Math.max(0.0001, (ca_meq + mg_meq) / 1000));
    const pAlk = -Math.log10(Math.max(0.0001, (hco3_meq + co3_meq) / 1000));
    const pHc = Math.max(6.0, Math.min(8.8, 2.3 + pCaMg + pAlk));
    const adjSAR = Math.round(sar * (1 + Math.max(0, 8.4 - pHc)) * 10) / 10;

    // 3. US Salinity Laboratory (USSL) Classification (C1-S1 to C4-S4)
    // Salinity (C): C1 (<0.25 dS/m), C2 (0.25-0.75), C3 (0.75-2.25), C4 (>2.25)
    let cClass = 'C3';
    let cDesc = 'High Salinity';
    let cDesc_ar = 'ملوحة عالية';
    if (ec < 0.25) {
      cClass = 'C1';
      cDesc = 'Low Salinity';
      cDesc_ar = 'ملوحة منخفضة';
    } else if (ec <= 0.75) {
      cClass = 'C2';
      cDesc = 'Medium Salinity';
      cDesc_ar = 'ملوحة متوسطة';
    } else if (ec <= 2.25) {
      cClass = 'C3';
      cDesc = 'High Salinity';
      cDesc_ar = 'ملوحة عالية';
    } else {
      cClass = 'C4';
      cDesc = 'Very High Salinity';
      cDesc_ar = 'ملوحة شديدة جداً';
    }

    // Sodicity (S): S1 (<10 SAR), S2 (10-18), S3 (18-26), S4 (>26)
    let sClass = 'S1';
    let sDesc = 'Low Sodium Hazard';
    let sDesc_ar = 'خطر صوديوم منخفض';
    if (sar < 10) {
      sClass = 'S1';
      sDesc = 'Low Sodium Hazard';
      sDesc_ar = 'خطر صوديوم منخفض';
    } else if (sar <= 18) {
      sClass = 'S2';
      sDesc = 'Medium Sodium Hazard';
      sDesc_ar = 'خطر صوديوم متوسط';
    } else if (sar <= 26) {
      sClass = 'S3';
      sDesc = 'High Sodium Hazard';
      sDesc_ar = 'خطر صوديوم مرتفع';
    } else {
      sClass = 'S4';
      sDesc = 'Very High Sodium Hazard';
      sDesc_ar = 'خطر صوديوم حرج';
    }

    const usslCode = `${cClass}-${sClass}`;

    // 4. Infiltration Hazard Evaluation (FAO 29 Table)
    // Based on both SAR and ECw
    let infiltrationRisk: 'none' | 'slight_moderate' | 'severe' = 'none';
    if (sar < 3) {
      if (ec < 0.2) infiltrationRisk = 'severe';
      else if (ec < 0.7) infiltrationRisk = 'slight_moderate';
      else infiltrationRisk = 'none';
    } else if (sar <= 6) {
      if (ec < 0.3) infiltrationRisk = 'severe';
      else if (ec < 1.2) infiltrationRisk = 'slight_moderate';
      else infiltrationRisk = 'none';
    } else if (sar <= 12) {
      if (ec < 0.5) infiltrationRisk = 'severe';
      else if (ec < 1.9) infiltrationRisk = 'slight_moderate';
      else infiltrationRisk = 'none';
    } else if (sar <= 20) {
      if (ec < 1.0) infiltrationRisk = 'severe';
      else if (ec < 2.9) infiltrationRisk = 'slight_moderate';
      else infiltrationRisk = 'none';
    } else {
      if (ec < 2.0) infiltrationRisk = 'severe';
      else if (ec < 5.0) infiltrationRisk = 'slight_moderate';
      else infiltrationRisk = 'none';
    }

    // 5. Hardness (CaCO3 equivalent)
    const hardnessCaCO3 = Math.round((ca_meq + mg_meq) * 50.04);

    return {
      ca_meq: Math.round(ca_meq * 100) / 100,
      mg_meq: Math.round(mg_meq * 100) / 100,
      na_meq: Math.round(na_meq * 100) / 100,
      k_meq: Math.round(k_meq * 100) / 100,
      sumCations: Math.round(sumCations * 100) / 100,

      hco3_meq: Math.round(hco3_meq * 100) / 100,
      co3_meq: Math.round(co3_meq * 100) / 100,
      cl_meq: Math.round(cl_meq * 100) / 100,
      so4_meq: Math.round(so4_meq * 100) / 100,
      no3_meq: Math.round(no3_meq * 100) / 100,
      sumAnions: Math.round(sumAnions * 100) / 100,

      chargeBalanceErrorPct,
      isChargeBalanced: chargeBalanceErrorPct <= 5.0,

      sar,
      adjSAR,
      usslCode,
      usslRisk: `${cDesc} / ${sDesc}`,
      cClass,
      cDesc,
      cDesc_ar,
      sClass,
      sDesc,
      sDesc_ar,
      clToxRisk: cl_meq > 10 ? 'severe' : cl_meq > 4 ? 'moderate' : cl_meq > 2 ? 'slight' : 'none',
      naToxRisk: na_meq > 15 ? 'severe' : na_meq > 8 ? 'moderate' : na_meq > 3 ? 'slight' : 'none',
      boronRisk: boron > 2.0 ? 'severe' : boron > 1.0 ? 'moderate' : boron > 0.5 ? 'slight' : 'none',
      infiltrationRisk,
      hardnessCaCO3,
    };
  }, [ph, ec, ca, mg, na, k, hco3, co3, cl, so4, no3, boron]);

  // ==========================================================================
  // Crop Specific Toxicity & Yield Loss Impact
  // ==========================================================================
  const cropImpact = useMemo(() => {
    const crop = CROP_SALINITY_DATABASE.find((c) => c.id === selectedCropId) || CROP_SALINITY_DATABASE[3];

    // Estimated soil ECe under standard leaching fraction (LF = 15-20%) -> ECe ≈ 1.5 * ECw
    const estimatedECe = Math.round(ec * 1.5 * 10) / 10;

    // Yield loss % = max(0, (estimatedECe - thresholdECe) * slopePct)
    const yieldLossPct =
      estimatedECe > crop.thresholdECe
        ? Math.min(100, Math.round((estimatedECe - crop.thresholdECe) * crop.slopePct * 10) / 10)
        : 0;

    // Toxicity flags
    const isChlorideToxic = cl > crop.maxChloridePpm;
    const isSodiumToxic = na > crop.maxSodiumPpm;
    const isBoronToxic = boron > crop.maxBoronPpm;

    return {
      crop,
      estimatedECe,
      yieldLossPct,
      isChlorideToxic,
      isSodiumToxic,
      isBoronToxic,
      expectedYieldPct: Math.max(0, 100 - yieldLossPct),
    };
  }, [selectedCropId, ec, cl, na, boron]);

  // ==========================================================================
  // Dual-Source Water Blending Solver
  // ==========================================================================
  const blendingSolver = useMemo(() => {
    // We have Source 1 (Current Water with EC = `ec`) and Source 2 (Fresh/RO with EC = `blendSource2EC`).
    // We want target EC = `blendTargetEC`.
    // TargetEC = X * EC1 + (1 - X) * EC2  =>  X = (TargetEC - EC2) / (EC1 - EC2)
    if (ec <= blendSource2EC) {
      return {
        isValid: false,
        reason: 'Source 1 must have higher salinity than Source 2.',
        source1Pct: 100,
        source2Pct: 0,
      };
    }

    const clampedTarget = Math.max(blendSource2EC, Math.min(ec, blendTargetEC));
    const source1Fraction = (clampedTarget - blendSource2EC) / (ec - blendSource2EC);
    const source1Pct = Math.round(source1Fraction * 100);
    const source2Pct = 100 - source1Pct;

    // Resulting blended ions (e.g. per 100 m3 irrigation)
    const blendedCl = Math.round(cl * source1Fraction + 25 * (1 - source1Fraction));
    const blendedNa = Math.round(na * source1Fraction + 15 * (1 - source1Fraction));
    const blendedSAR = Math.round((diagnostics.sar * source1Fraction + 1.2 * (1 - source1Fraction)) * 10) / 10;

    return {
      isValid: true,
      source1Pct,
      source2Pct,
      clampedTarget,
      blendedCl,
      blendedNa,
      blendedSAR,
      // If irrigating 100 m3
      source1M3: source1Pct,
      source2M3: source2Pct,
    };
  }, [ec, blendSource2EC, blendTargetEC, cl, na, diagnostics.sar]);

  return (
    <CalculatorShell
      icon={Beaker}
      title={TITLE}
      description={DESC}
      badge="USSL & FAO 29"
      accent="sky"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
          onClick: handleCopyReport,
          variant: 'primary',
          showCheck: copiedReport,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
    >
      {/* Quick Preset Toolbar */}
      <div className="lg:col-span-12 p-3.5 rounded-2xl border bg-card shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">
            {tr('Load Water Preset:', 'اختر نموذج مياه مرجعي:', 'Charger eau type :')}
          </span>
          <Select onValueChange={handleLoadPreset} defaultValue="biskra-saharan-deep">
            <SelectTrigger className="h-8 w-[260px] text-xs font-semibold">
              <SelectValue placeholder={tr('Load Water Preset...', 'اختر نموذج مياه...', 'Charger eau type...')} />
            </SelectTrigger>
            <SelectContent>
              {WATER_PRESETS.map((preset) => (
                <SelectItem key={preset.id} value={preset.id} className="text-xs">
                  {isAr ? preset.name_ar : isFr ? preset.name_fr : preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-sky-600" />
          <span>{tr('Standard: USSL C-S Diagram & Ayers-Westcot', 'المعايير: تصنيف مختبر الملوحة الأمريكي وفاو 29', 'Normes : Diagramme USSL & FAO 29')}</span>
        </div>
      </div>

      {/* Lab Parameters Card */}
      <Card className="lg:col-span-12 border-border shadow-xs">
        <CardHeader className="py-3 px-4 bg-muted/30 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Droplets className="h-4 w-4 text-sky-600" />
              {tr('Primary Laboratory Measurements (Cations & Anions)', 'القياسات المخبرية الأساسية (الكاتيونات والأنيونات)', 'Mesures de Laboratoire (Cations & Anions)')}
            </CardTitle>
            <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
              ECw: {ec} dS/m | pH: {ph}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {/* Key Lab Metrics Input Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
            <div>
              <Label className="text-[11px] text-muted-foreground">pH</Label>
              <Input
                type="number"
                step="0.1"
                value={ph}
                onChange={(e) => setPh(Number(e.target.value) || 7.0)}
                className="h-8 text-xs font-mono font-bold mt-0.5"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">ECw (dS/m)</Label>
              <Input
                type="number"
                step="0.1"
                value={ec}
                onChange={(e) => setEc(Number(e.target.value) || 0)}
                className="h-8 text-xs font-mono font-bold mt-0.5"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">TDS (mg/L)</Label>
              <Input
                type="number"
                value={tds}
                onChange={(e) => setTds(Number(e.target.value) || 0)}
                className="h-8 text-xs font-mono font-bold mt-0.5"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Ca²⁺ (mg/L)</Label>
              <Input
                type="number"
                value={ca}
                onChange={(e) => setCa(Number(e.target.value) || 0)}
                className="h-8 text-xs font-mono font-bold mt-0.5"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Mg²⁺ (mg/L)</Label>
              <Input
                type="number"
                value={mg}
                onChange={(e) => setMg(Number(e.target.value) || 0)}
                className="h-8 text-xs font-mono font-bold mt-0.5"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Na⁺ (mg/L)</Label>
              <Input
                type="number"
                value={na}
                onChange={(e) => setNa(Number(e.target.value) || 0)}
                className="h-8 text-xs font-mono font-bold mt-0.5 text-amber-600"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Cl⁻ (mg/L)</Label>
              <Input
                type="number"
                value={cl}
                onChange={(e) => setCl(Number(e.target.value) || 0)}
                className="h-8 text-xs font-mono font-bold mt-0.5 text-amber-600"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytical Charge Balance Pill */}
      <div className="lg:col-span-12 p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs bg-muted/40">
        <div className="flex items-center gap-2">
          {diagnostics.isChargeBalanced ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          )}
          <div>
            <span className="font-bold">
              {tr('Cation-Anion Charge Balance Verification', 'التحقق من التوازن الشحني المخبري', 'Balance Électrochimique')}
            </span>
            <span className="text-muted-foreground ml-2">
              (Σ Cations: {diagnostics.sumCations} meq/L vs Σ Anions: {diagnostics.sumAnions} meq/L)
            </span>
          </div>
        </div>

        <Badge
          variant="outline"
          className={
            diagnostics.isChargeBalanced
              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-300'
              : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-300'
          }
        >
          {diagnostics.chargeBalanceErrorPct}% {tr('Charge Error', 'خطأ القياس', 'Écart')}
        </Badge>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="lg:col-span-12 w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto p-1 bg-muted/80 rounded-xl border">
          <TabsTrigger value="diagnosis" className="py-2 text-xs font-semibold flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-sky-600" />
            <span>{tr('USSL & SAR Classification', 'تصنيف USSL والـ SAR', 'Classification USSL')}</span>
          </TabsTrigger>
          <TabsTrigger value="crops" className="py-2 text-xs font-semibold flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
            <span>{tr('Crop Sensitivity & Toxicity', 'تحمل المحاصيل والسمية', 'Tolérance des Cultures')}</span>
          </TabsTrigger>
          <TabsTrigger value="blending" className="py-2 text-xs font-semibold flex items-center gap-1.5">
            <Split className="h-3.5 w-3.5 text-emerald-600" />
            <span>{tr('Dual-Source Blending Solver', 'حاسبة خلط مصدرين للمياه', 'Coupage d’Eau')}</span>
          </TabsTrigger>
          <TabsTrigger value="infiltration" className="py-2 text-xs font-semibold flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-purple-600" />
            <span>{tr('Infiltration & Hardness', 'نفاذية التربة والعسر', 'Infiltration & Dureté')}</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: USSL & SAR CLASSIFICATION */}
        <TabsContent value="diagnosis" className="space-y-4 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* USSL Code Hero Card */}
            <Card className="border shadow-xs bg-gradient-to-br from-sky-600 to-indigo-800 text-white">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold opacity-90">
                    {tr('US Salinity Lab (USSL) Class', 'تصنيف مختبر الملوحة الأمريكي (USSL)', 'Classification USSL')}
                  </span>
                  <div className="text-4xl font-black mt-1 font-mono">{diagnostics.usslCode}</div>
                  <p className="text-xs opacity-90 mt-1">
                    {diagnostics.cClass} ({isAr ? diagnostics.cDesc_ar : diagnostics.cDesc}) + {diagnostics.sClass} ({isAr ? diagnostics.sDesc_ar : diagnostics.sDesc})
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-white/10 backdrop-blur-xs text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span>{tr('Standard SAR', 'نسبة ادمصاص الصوديوم (SAR)', 'SAR Standard')}:</span>
                    <span className="font-bold font-mono">{diagnostics.sar}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{tr('Adjusted SAR (adj SAR)', 'الـ SAR المعدل (adj SAR)', 'SAR Ajusté')}:</span>
                    <span className="font-bold font-mono text-amber-300">{diagnostics.adjSAR}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{tr('Water Hardness', 'عسر الماء', 'Dureté Totale')}:</span>
                    <span className="font-bold font-mono">{diagnostics.hardnessCaCO3} mg/L CaCO₃</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cations Breakdown */}
            <Card className="border shadow-xs">
              <CardHeader className="p-3.5 pb-2 border-b bg-muted/30">
                <CardTitle className="text-xs font-bold flex items-center justify-between">
                  <span>{tr('Cations (Positively Charged)', 'الكاتيونات (الأيونات الموجبة)', 'Cations')}</span>
                  <Badge variant="secondary" className="text-[10px] font-mono">{diagnostics.sumCations} meq/L</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y font-mono">
                    <tr className="hover:bg-muted/30">
                      <td className="p-2.5 font-sans font-medium">Calcium (Ca²⁺)</td>
                      <td className="p-2.5 text-right">{ca} mg/L</td>
                      <td className="p-2.5 text-right font-bold text-sky-600">{diagnostics.ca_meq} meq/L</td>
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="p-2.5 font-sans font-medium">Magnesium (Mg²⁺)</td>
                      <td className="p-2.5 text-right">{mg} mg/L</td>
                      <td className="p-2.5 text-right font-bold text-purple-600">{diagnostics.mg_meq} meq/L</td>
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="p-2.5 font-sans font-medium">Sodium (Na⁺)</td>
                      <td className="p-2.5 text-right">{na} mg/L</td>
                      <td className="p-2.5 text-right font-bold text-amber-600">{diagnostics.na_meq} meq/L</td>
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="p-2.5 font-sans font-medium">Potassium (K⁺)</td>
                      <td className="p-2.5 text-right">{k} mg/L</td>
                      <td className="p-2.5 text-right font-bold text-red-600">{diagnostics.k_meq} meq/L</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Anions Breakdown */}
            <Card className="border shadow-xs">
              <CardHeader className="p-3.5 pb-2 border-b bg-muted/30">
                <CardTitle className="text-xs font-bold flex items-center justify-between">
                  <span>{tr('Anions (Negatively Charged)', 'الأنيونات (الأيونات السالبة)', 'Anions')}</span>
                  <Badge variant="secondary" className="text-[10px] font-mono">{diagnostics.sumAnions} meq/L</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y font-mono">
                    <tr className="hover:bg-muted/30">
                      <td className="p-2.5 font-sans font-medium">Bicarbonate (HCO₃⁻)</td>
                      <td className="p-2.5 text-right">{hco3} mg/L</td>
                      <td className="p-2.5 text-right font-bold">{diagnostics.hco3_meq} meq/L</td>
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="p-2.5 font-sans font-medium">Chloride (Cl⁻)</td>
                      <td className="p-2.5 text-right">{cl} mg/L</td>
                      <td className="p-2.5 text-right font-bold text-amber-600">{diagnostics.cl_meq} meq/L</td>
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="p-2.5 font-sans font-medium">Sulfate (SO₄²⁻)</td>
                      <td className="p-2.5 text-right">{so4} mg/L</td>
                      <td className="p-2.5 text-right font-bold text-yellow-600">{diagnostics.so4_meq} meq/L</td>
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="p-2.5 font-sans font-medium">Nitrate (NO₃⁻)</td>
                      <td className="p-2.5 text-right">{no3} mg/L</td>
                      <td className="p-2.5 text-right font-bold text-sky-600">{diagnostics.no3_meq} meq/L</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: CROP SENSITIVITY & TOXICITY */}
        <TabsContent value="crops" className="space-y-4 pt-3">
          <div className="p-3.5 rounded-xl bg-card border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold">{tr('Select Crop to Evaluate Agronomic Risk', 'اختر المحصول لتقييم التأثير الإنتاجي', 'Culture Cible')}:</span>
              <Select value={selectedCropId} onValueChange={setSelectedCropId}>
                <SelectTrigger className="h-8 w-[220px] text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CROP_SALINITY_DATABASE.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {isAr ? c.name_ar : isFr ? c.name_fr : c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {tr('Crop Threshold ECe', 'حد العتبة الحرج للمحصول', 'Seuil Tolérance')}: {cropImpact.crop.thresholdECe} dS/m
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Predicted Yield Impact Card */}
            <Card className="border shadow-xs">
              <CardHeader className="p-4 pb-2 border-b">
                <CardTitle className="text-xs font-bold flex items-center justify-between">
                  <span>{tr('Salinity Yield Impact Prediction', 'التأثير المتوقع على المحصول والإنتاجية', 'Impact sur le Rendement')}</span>
                  <Badge
                    className={
                      cropImpact.yieldLossPct === 0
                        ? 'bg-emerald-600 text-white'
                        : cropImpact.yieldLossPct < 20
                        ? 'bg-amber-600 text-white'
                        : 'bg-red-600 text-white'
                    }
                  >
                    {cropImpact.yieldLossPct === 0
                      ? tr('100% Potential Yield', 'إنتاج كامل 100%', '100% Rendement')
                      : `${cropImpact.yieldLossPct}% ${tr('Yield Loss', 'فاقد إنتاجي', 'Perte')}`}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tr('Irrigation Water Salinity (ECw)', 'ملوحة ماء الري', 'CE Eau')}:</span>
                    <span className="font-bold font-mono">{ec} dS/m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tr('Estimated Soil Rootzone Salinity (ECe)', 'الملوحة المتوقعة في التربة', 'CEe Sol estimée')}:</span>
                    <span className="font-bold font-mono">{cropImpact.estimatedECe} dS/m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tr('Crop Salinity Threshold (ECe)', 'عتبة المحصول الآمنة', 'Seuil Culture')}:</span>
                    <span className="font-bold font-mono">{cropImpact.crop.thresholdECe} dS/m</span>
                  </div>
                </div>

                {cropImpact.yieldLossPct > 0 ? (
                  <div className="p-3 rounded-lg bg-red-50/70 dark:bg-red-950/30 border border-red-200 text-red-950 dark:text-red-100 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      {tr('Osmotic Stress Detected', 'إجهاد أسموزي مرصود', 'Stress Osmotique Détecté')}
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {tr(
                        `Using this water directly will cause approximately ${cropImpact.yieldLossPct}% yield reduction. Leaching requirement or water blending with low-salinity water is strongly advised.`,
                        `استخدام هذه المياه مباشرة دون خلط أو غسيل سيؤدي إلى خسارة قرابة ${cropImpact.yieldLossPct}% من المحصول. ينصح بخلط المياه أو زيادة معدل الغسيل (Leaching).`,
                        `Cette eau entraînera environ ${cropImpact.yieldLossPct}% de perte de récolte. Un coupage d'eau ou un drainage accru est requis.`
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-950 dark:text-emerald-100 text-xs">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      {tr('Safe Salinity Range for Selected Crop', 'الملوحة ضمن النطاق الآمن لهذا المحصول', 'Salinité Sécurisée')}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Specific Ion Toxicity Hazards */}
            <Card className="border shadow-xs">
              <CardHeader className="p-4 pb-2 border-b">
                <CardTitle className="text-xs font-bold">
                  {tr('Specific Ion Toxicity & Leaf Burn Risks', 'سمية الأيونات المحددة واحتراق حواف الأوراق', 'Toxicité Spécifique des Ions')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                {/* Chloride Risk */}
                <div className={`p-3 rounded-lg border flex items-start justify-between gap-2 ${cropImpact.isChlorideToxic ? 'bg-red-50/60 border-red-200' : 'bg-muted/30'}`}>
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>Chloride (Cl⁻) Toxicity</span>
                      {cropImpact.isChlorideToxic ? (
                        <Badge className="bg-red-600 text-white text-[9px]">Exceeded</Badge>
                      ) : (
                        <Badge className="bg-emerald-600 text-white text-[9px]">Safe</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Detected: <span className="font-bold text-foreground">{cl} mg/L</span> (Crop limit: {cropImpact.crop.maxChloridePpm} mg/L)
                    </p>
                  </div>
                </div>

                {/* Sodium Risk */}
                <div className={`p-3 rounded-lg border flex items-start justify-between gap-2 ${cropImpact.isSodiumToxic ? 'bg-red-50/60 border-red-200' : 'bg-muted/30'}`}>
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>Sodium (Na⁺) Direct Root & Foliar Hazard</span>
                      {cropImpact.isSodiumToxic ? (
                        <Badge className="bg-red-600 text-white text-[9px]">Exceeded</Badge>
                      ) : (
                        <Badge className="bg-emerald-600 text-white text-[9px]">Safe</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Detected: <span className="font-bold text-foreground">{na} mg/L</span> (Crop limit: {cropImpact.crop.maxSodiumPpm} mg/L)
                    </p>
                  </div>
                </div>

                {/* Boron Risk */}
                <div className={`p-3 rounded-lg border flex items-start justify-between gap-2 ${cropImpact.isBoronToxic ? 'bg-red-50/60 border-red-200' : 'bg-muted/30'}`}>
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>Boron (B) Accumulation Risk</span>
                      {cropImpact.isBoronToxic ? (
                        <Badge className="bg-red-600 text-white text-[9px]">Exceeded</Badge>
                      ) : (
                        <Badge className="bg-emerald-600 text-white text-[9px]">Safe</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Detected: <span className="font-bold text-foreground">{boron} mg/L</span> (Crop limit: {cropImpact.crop.maxBoronPpm} mg/L)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: DUAL-SOURCE WATER BLENDING SOLVER */}
        <TabsContent value="blending" className="space-y-4 pt-3">
          <Card className="border shadow-xs">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Split className="h-4 w-4 text-emerald-600" />
                {tr(
                  'Dual-Source Water Blending Solver (Well + RO / Desalinated / Canal)',
                  'حاسبة خلط مصدرين للمياه (بئر مالح + ماء محلى / قناة / أمطار)',
                  'Solveur de Coupage d’Eau (Puits Salin + Eau Douce / OI)'
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                {tr(
                  'Calculate exact volumetric blending proportions to hit target crop EC and stay below critical chloride and sodium thresholds.',
                  'حساب النسب الحجمية الدقيقة لخلط المياه المالحة مع مياه عذبة لتوفير مياه مطابقة لمعايير المحصول وبأقل تكلفة.',
                  'Détermine les volumes exacts de chaque source pour atteindre la conductivité cible.'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-5 text-xs">
              {/* Blending Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-muted/40 border space-y-1.5">
                  <span className="font-bold text-xs text-foreground">
                    {tr('Source 1 (Current Saline Well)', 'المصدر 1 (البئر المالح الحالي)', 'Source 1 (Puits Salin)')}
                  </span>
                  <div className="text-xl font-black font-mono text-sky-600">{ec} dS/m</div>
                  <p className="text-[10px] text-muted-foreground">Cl: {cl} mg/L, Na: {na} mg/L</p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border space-y-1.5">
                  <span className="font-bold text-xs text-foreground">
                    {tr('Source 2 (Fresh / RO / Rainwater EC)', 'المصدر 2 (ماء محلى / سد / أمطار)', 'Source 2 (Eau Douce / OI)')}
                  </span>
                  <Input
                    type="number"
                    step="0.05"
                    value={blendSource2EC}
                    onChange={(e) => setBlendSource2EC(Number(e.target.value) || 0.1)}
                    className="h-8 font-mono font-bold text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">Typically 0.1 - 0.4 dS/m</p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 space-y-1.5">
                  <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200">
                    {tr('Target Desired Blended EC', 'الناقلية الكهربائية المستهدفة بعد الخلط', 'CE Cible Finale')}
                  </span>
                  <Input
                    type="number"
                    step="0.1"
                    value={blendTargetEC}
                    onChange={(e) => setBlendTargetEC(Number(e.target.value) || 1.2)}
                    className="h-8 font-mono font-bold text-sm text-emerald-700 dark:text-emerald-300"
                  />
                  <p className="text-[10px] text-muted-foreground">Target limit for {cropImpact.crop.name}</p>
                </div>
              </div>

              {/* Blending Solution Result */}
              {blendingSolver.isValid && (
                <div className="p-5 rounded-2xl border bg-gradient-to-r from-sky-50/80 via-emerald-50/80 to-sky-50/80 dark:from-sky-950/30 dark:via-emerald-950/30 dark:to-sky-950/30 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-wider font-bold text-emerald-800 dark:text-emerald-300">
                        {tr('Optimal Blending Recipe Ratio', 'نسبة الخلط الحجمية المثالية', 'Proportion de Mélange')}
                      </div>
                      <div className="text-2xl font-black font-mono text-foreground mt-0.5">
                        {blendingSolver.source1Pct}% {tr('Well Water', 'ماء البئر', 'Puits')} + {blendingSolver.source2Pct}% {tr('Fresh Water', 'ماء عذب/محلى', 'Eau Douce')}
                      </div>
                    </div>

                    <Badge className="bg-emerald-600 text-white font-mono text-sm px-3 py-1">
                      Final EC: {blendingSolver.clampedTarget} dS/m
                    </Badge>
                  </div>

                  {/* Visual Proportion Bar */}
                  <div className="space-y-1">
                    <div className="h-4 w-full rounded-full overflow-hidden flex bg-muted">
                      <div
                        style={{ width: `${blendingSolver.source1Pct}%` }}
                        className="bg-sky-600 h-full flex items-center justify-center text-[10px] text-white font-bold"
                      >
                        {blendingSolver.source1Pct}%
                      </div>
                      <div
                        style={{ width: `${blendingSolver.source2Pct}%` }}
                        className="bg-emerald-500 h-full flex items-center justify-center text-[10px] text-white font-bold"
                      >
                        {blendingSolver.source2Pct}%
                      </div>
                    </div>
                  </div>

                  {/* Volumetric Table Example */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-card border font-mono">
                      <div className="text-muted-foreground font-sans font-semibold">For 100 m³ Tank:</div>
                      <div className="font-bold text-foreground mt-0.5">{blendingSolver.source1M3} m³ Well + {blendingSolver.source2M3} m³ Fresh</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-card border font-mono">
                      <div className="text-muted-foreground font-sans font-semibold">Resulting Blended Cl⁻:</div>
                      <div className="font-bold text-foreground mt-0.5">{blendingSolver.blendedCl} mg/L (Safe)</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-card border font-mono">
                      <div className="text-muted-foreground font-sans font-semibold">Resulting Blended SAR:</div>
                      <div className="font-bold text-foreground mt-0.5">{blendingSolver.blendedSAR} (Low Hazard)</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: INFILTRATION & HARDNESS */}
        <TabsContent value="infiltration" className="space-y-4 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border shadow-xs">
              <CardHeader className="p-4 pb-2 border-b">
                <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-purple-600" />
                  {tr('Soil Infiltration & Structural Dispersion Hazard', 'مخاطر تدهور نفاذية التربة وتشتت الطين', 'Risque d’Infiltration du Sol')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs leading-relaxed">
                <p className="text-muted-foreground text-[11px]">
                  {tr(
                    'High Sodium (SAR) combined with low water salinity (ECw) causes clay particles to swell and disperse, sealing soil pores and destroying infiltration.',
                    'ارتفاع الصوديوم (SAR) مع ملوحة ماء منخفضة يسبب انتفاخ حبيبات الطين وانسداد مسام التربة وانعدام النفاذية وتكون قشور صلبة.',
                    'Un SAR élevé combiné à une faible salinité provoque le scellement des pores du sol.'
                  )}
                </p>

                <div className={`p-3 rounded-lg border ${diagnostics.infiltrationRisk === 'none' ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50/70 border-amber-200'}`}>
                  <div className="font-bold text-foreground">
                    {tr('Infiltration Hazard Status', 'حالة خطر النفاذية', 'Statut Infiltration')}:{' '}
                    <span className="uppercase font-mono">
                      {diagnostics.infiltrationRisk === 'none'
                        ? tr('None / Unlikely', 'لا يوجد خطر', 'Aucun')
                        : diagnostics.infiltrationRisk === 'slight_moderate'
                        ? tr('Slight to Moderate Hazard', 'خطر خفيف إلى متوسط', 'Moyen')
                        : tr('Severe Infiltration Loss', 'خطر شديد جداً', 'Sévère')}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Current SAR: <span className="font-bold">{diagnostics.sar}</span> at ECw: <span className="font-bold">{ec} dS/m</span>.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-xs">
              <CardHeader className="p-4 pb-2 border-b">
                <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                  <Droplets className="h-4 w-4 text-sky-600" />
                  {tr('Water Hardness & Calcium Carbonate Scale Index', 'عسر المياه والترسبات الجيرية في شبكات الري', 'Dureté & Entartrage')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs leading-relaxed">
                <div className="p-3 rounded-lg bg-muted/40 space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="font-sans font-medium">{tr('Total Hardness', 'العسر الكلي', 'Dureté Totale')}:</span>
                    <span className="font-bold">{diagnostics.hardnessCaCO3} mg/L CaCO₃</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans font-medium">{tr('French Degrees (°fH)', 'الدرجة الفرنسية (°fH)', 'Degré Français')}:</span>
                    <span className="font-bold">{(diagnostics.hardnessCaCO3 / 10).toFixed(1)} °fH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans font-medium">{tr('German Degrees (°dH)', 'الدرجة الألمانية (°dH)', 'Degré Allemand')}:</span>
                    <span className="font-bold">{(diagnostics.hardnessCaCO3 / 17.8).toFixed(1)} °dH</span>
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground">
                  {diagnostics.hardnessCaCO3 > 300 ? (
                    <span className="text-amber-700 dark:text-amber-300 font-semibold">
                      {tr(
                        'Very Hard Water: High risk of CaCO3 clogging in drip emitters. Regular acid flushing with Nitric or Phosphoric acid is required.',
                        'ماء شديد العسر: خطر مرتفع لانسداد النقاطات بالكلس. يلزم غسيل دوري للشبكة بحمض النيتريك أو الفوسفوريك.',
                        'Eau très dure : Risque d’entartrage des goutteurs. Rinçage acide recommandé.'
                      )}
                    </span>
                  ) : (
                    <span className="text-emerald-700 dark:text-emerald-300">
                      {tr('Moderate to soft water — low emitter encrustation risk.', 'عسر معتدل — خطر ترسب منخفض على النقاطات.', 'Dureté acceptable.')}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </CalculatorShell>
  );
}
