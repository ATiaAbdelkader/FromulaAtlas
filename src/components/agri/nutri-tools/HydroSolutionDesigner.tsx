'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  FlaskConical,
  Check,
  X,
  Droplets,
  Zap,
  Sparkles,
  Scale,
  RotateCcw,
  Copy,
  Info,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Atom,
  Layers,
  ChevronRight,
  Download,
  Share2,
} from 'lucide-react';
import {
  HYDRO_EQ_WEIGHTS,
  HYDRO_MEQ_NUTRIENTS,
  HYDRO_NUTRIENT_LABELS,
  HYDRO_ANION_POLYGON,
  HYDRO_CATION_POLYGON,
  HYDRO_ANION_LIMITS,
  HYDRO_CATION_LIMITS,
} from '@/lib/nutri-tools-data';
import { CropPresetDropdown } from './CropPresetDropdown';
import type { CropPreset } from '@/lib/crop-presets';
import { useBridgePayload } from '@/lib/use-bridge-payload';
import { sendToBridge } from '@/lib/tool-bridge';
import { useTranslation, copyFor } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';

const ANIONS = ['N_NO3', 'P', 'S', 'Cl'] as const;
const CATIONS = ['K', 'Ca', 'Mg', 'N_NH4'] as const;

interface HydroPreset {
  id: string;
  name: string;
  name_ar: string;
  name_fr: string;
  description: string;
  description_ar: string;
  description_fr: string;
  targetEC: number;
  phRange: string;
  values: Record<string, number>;
}

const EXTENDED_PRESETS: HydroPreset[] = [
  {
    id: 'steiner',
    name: 'Steiner Universal',
    name_ar: 'محلول شتاينر الشامل (Steiner)',
    name_fr: 'Solution universelle de Steiner',
    description: 'Gold-standard balanced nutrient solution based on Steiner’s ionic ratio equilibrium.',
    description_ar: 'المعيار المرجعي للتوازن الأيوني للمحاليل المائية حسب نسب شتاينر الكلاسيكية.',
    description_fr: 'Équilibre ionique de référence basé sur les ratios de Steiner.',
    targetEC: 2.1,
    phRange: '5.6 - 6.2',
    values: { N_NO3: 12, P: 3, S: 6, Cl: 0, K: 7, Ca: 10, Mg: 4, N_NH4: 0 },
  },
  {
    id: 'hoagland_half',
    name: 'Hoagland 50%',
    name_ar: 'هوغلاند 50% المخفف',
    name_fr: 'Hoagland 50% modifié',
    description: 'Modified Hoagland solution standard for seedling stage & scientific trials.',
    description_ar: 'محلول هوغلاند المخفف لمرحلة الشتلات والتجارب العلمية الزراعية.',
    description_fr: 'Formule Hoagland demi-force pour semis et essais agronomiques.',
    targetEC: 1.35,
    phRange: '5.8 - 6.4',
    values: { N_NO3: 8, P: 1, S: 2, Cl: 0, K: 6, Ca: 8, Mg: 2, N_NH4: 0 },
  },
  {
    id: 'tomato_fruiting',
    name: 'Greenhouse Tomato (Fruiting)',
    name_ar: 'طماطم بيوت محمية (مرحلة الإنتاج)',
    name_fr: 'Tomate sous serre (Pleine fructification)',
    description: 'High potassium & calcium ratio to prevent blossom end rot and maximize brix.',
    description_ar: 'نسبة بوتاسيوم وكالسيوم مرتفعة لمنع تعفن الطرف الزهري وزيادة السكريات.',
    description_fr: 'Ratio K/Ca élevé pour éviter le BER et maximiser le calibre.',
    targetEC: 2.4,
    phRange: '5.5 - 6.0',
    values: { N_NO3: 13.5, P: 1.8, S: 4.5, Cl: 0, K: 9.5, Ca: 8.5, Mg: 3.5, N_NH4: 1.0 },
  },
  {
    id: 'strawberry',
    name: 'Strawberry Soilless (NFT / Trough)',
    name_ar: 'فراولة هيدروبونيك (أنظمة NFT / أحواض)',
    name_fr: 'Fraisier hydroponique (NFT / Substrat)',
    description: 'Low-salinity formulation sensitive to high EC, optimized for continuous flowering.',
    description_ar: 'محلول منخفض الملوحة حساس للـ EC ومحسن للإزهار وعقد الثمار المستمر.',
    description_fr: 'Formule à faible conductivité pour fraisiers sensibles aux sels.',
    targetEC: 1.4,
    phRange: '5.6 - 6.0',
    values: { N_NO3: 8.5, P: 1.5, S: 3.0, Cl: 0, K: 5.5, Ca: 5.0, Mg: 2.0, N_NH4: 0.5 },
  },
  {
    id: 'lettuce_leafy',
    name: 'Lettuce & Leafy Greens (NFT / DWC)',
    name_ar: 'خس وورقيات مائية (NFT / DWC)',
    name_fr: 'Laitue et légumes-feuilles',
    description: 'High nitrogen nitrate with moderate EC for fast vegetative biomass without tip burn.',
    description_ar: 'نيتروجين نتراتي مرتفع مع EC معتدل للنمو الخضري السريع بدون احتراق الحواف.',
    description_fr: 'Riche en azote nitrique avec EC modéré évitant le tip-burn.',
    targetEC: 1.5,
    phRange: '5.8 - 6.2',
    values: { N_NO3: 11.0, P: 1.5, S: 2.5, Cl: 0, K: 6.5, Ca: 5.5, Mg: 1.8, N_NH4: 0.2 },
  },
  {
    id: 'cucumber',
    name: 'Greenhouse Cucumber',
    name_ar: 'خيار بيوت محمية عالي الإنتاج',
    name_fr: 'Concombre sous serre',
    description: 'High transpiration formulation with balanced N and strong vegetative-fruiting drive.',
    description_ar: 'تركيبة مناسبة للنتح العالي مع نيتروجين متوازن ودفع خضري وإنتاجي قوي.',
    description_fr: 'Adapté à la forte transpiration et à la charge fruitière continue.',
    targetEC: 2.2,
    phRange: '5.5 - 6.0',
    values: { N_NO3: 14.0, P: 2.0, S: 3.5, Cl: 0, K: 8.0, Ca: 7.5, Mg: 2.8, N_NH4: 0.8 },
  },
  {
    id: 'pepper',
    name: 'Sweet Pepper / Bell Pepper',
    name_ar: 'فلفل حلو (Capsicum)',
    name_fr: 'Poivron / Piment',
    description: 'Moderate EC with sustained Magnesium and Calcium for thick-walled firm fruit.',
    description_ar: 'تغذية متوازنة مع ماغنيسيوم وكالسيوم مستقر لجدران ثمار سميكة ومقاومة للتشقق.',
    description_fr: 'Formulation assurant une fermeté de paroi et limitant les carences en calcium.',
    targetEC: 2.3,
    phRange: '5.6 - 6.2',
    values: { N_NO3: 12.5, P: 1.8, S: 4.0, Cl: 0, K: 7.5, Ca: 8.0, Mg: 3.2, N_NH4: 0.5 },
  },
];

const EMPTY: Record<string, number> = Object.fromEntries(HYDRO_MEQ_NUTRIENTS.map((n) => [n, 0]));

// Fertilizer Salts for Recipe Formulator (Tank A / Tank B)
interface FertilizerSalt {
  id: string;
  name: string;
  name_ar: string;
  name_fr: string;
  formula: string;
  tank: 'A' | 'B' | 'Acid';
  supplies: { nutrient: string; fractionMeq: number; fractionPpm: number }[];
  purityPct: number;
}

export function HydroSolutionDesigner() {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';
  const isFr = language === 'fr';
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [meq, setMeq] = useState<Record<string, number>>({ ...EXTENDED_PRESETS[0].values });
  const [activePresetId, setActivePresetId] = useState<string>('steiner');
  const [activeTab, setActiveTab] = useState<'editor' | 'charts' | 'tanks' | 'diagnostics'>('editor');
  const [targetVolumeLiters, setTargetVolumeLiters] = useState<number>(1000);
  const [concentrateFactor, setConcentrateFactor] = useState<number>(100); // 100x stock tank
  const [copied, setCopied] = useState<boolean>(false);
  const [preset, setPreset] = useState<CropPreset | null>(null);

  // "Send to" bridge — receive HCO₃⁻ from Water Hardness Diagnostic or Soil Lab
  const bridgePayload = useBridgePayload('hydro-solution');
  const [bridgeBanner, setBridgeBanner] = useState<{ hco3: number; source?: string } | null>(null);

  useEffect(() => {
    if (!bridgePayload) return;
    const v = bridgePayload.values;
    const hco3 = typeof v.hco3 === 'number' ? v.hco3 : parseFloat(String(v.hco3 ?? '0')) || 0;
    if (hco3 > 0) {
      setMeq((prev) => ({ ...prev, Cl: Number(hco3.toFixed(2)) }));
      setBridgeBanner({ hco3, source: bridgePayload.sourceToolId });
      toast({
        title: tr('Bridge Data Injected', 'تم استلام بيانات الجسر الأيوني', 'Données injectées via la passerelle'),
        description: `${tr('Received bicarbonate HCO₃⁻:', 'تم استيراد البيكربونات HCO₃⁻:', 'Bicarbonate HCO₃⁻ reçu :')} ${hco3.toFixed(2)} meq/L`,
      });
    }
  }, [bridgePayload]);

  const applyExtendedPreset = (p: HydroPreset) => {
    setActivePresetId(p.id);
    setPreset(null);
    setMeq({ ...EMPTY, ...p.values });
    toast({
      title: tr(`Preset Applied: ${p.name}`, `تم تطبيق قالب: ${p.name_ar}`, `Profil appliqué : ${p.name_fr}`),
      description: `${tr('Target EC:', 'الناقلية المستهدفة:', 'CE cible :')} ~${p.targetEC} dS/m | pH: ${p.phRange}`,
    });
  };

  const applyCropPreset = (p: CropPreset) => {
    setPreset(p);
    setActivePresetId('custom');
    const h = p.hydroSolution;
    setMeq((prev) => ({
      ...prev,
      N_NO3: h.N_NO3,
      N_NH4: h.N_NH4,
      P: h.P,
      S: h.S,
      K: h.K,
      Ca: h.Ca,
      Mg: h.Mg,
      Cl: h.Cl,
    }));
    toast({
      title: tr(`Crop Preset Applied: ${p.name}`, `تم تطبيق قالب المحصول: ${p.name}`, `Culture appliquée : ${p.name}`),
      description: h.notes,
    });
  };

  const setMeqValue = (key: string, v: number) => {
    setActivePresetId('custom');
    setMeq((prev) => ({ ...prev, [key]: Math.max(0, v) }));
  };

  const setPpmValue = (key: string, ppm: number) => {
    setActivePresetId('custom');
    const w = HYDRO_EQ_WEIGHTS[key] || 1;
    setMeq((prev) => ({ ...prev, [key]: w > 0 ? Math.max(0, ppm / w) : 0 }));
  };

  // Calculations
  const sumAnions = useMemo(() => {
    return (meq.N_NO3 || 0) + (meq.P || 0) + (meq.S || 0) + (meq.Cl || 0);
  }, [meq]);

  const sumCations = useMemo(() => {
    return (meq.K || 0) + (meq.Ca || 0) + (meq.Mg || 0) + (meq.N_NH4 || 0);
  }, [meq]);

  const totalMeq = useMemo(() => sumAnions + sumCations, [sumAnions, sumCations]);

  // Electrical Conductivity (CE / EC) estimation: sum(meq/L) / 20 ≈ dS/m
  const estimatedEC = useMemo(() => {
    return totalMeq > 0 ? totalMeq / 20 : 0;
  }, [totalMeq]);

  // Osmotic Potential (bars / atmospheres): Ψos ≈ -0.36 × EC (dS/m)
  const osmoticPotentialBars = useMemo(() => {
    return -0.36 * estimatedEC;
  }, [estimatedEC]);

  // Ion Balance error %: (Cations - Anions) / (Cations + Anions) * 100
  const ionBalanceErrorPct = useMemo(() => {
    if (totalMeq === 0) return 0;
    return ((sumCations - sumAnions) / (sumCations + sumAnions)) * 100;
  }, [sumCations, sumAnions, totalMeq]);

  const isIonBalanced = Math.abs(ionBalanceErrorPct) <= 5.0;

  // Key Ratios
  const ratios = useMemo(() => {
    const k = meq.K || 0;
    const ca = meq.Ca || 0;
    const mg = meq.Mg || 0;
    const n_no3 = meq.N_NO3 || 0;
    const n_nh4 = meq.N_NH4 || 0;
    const totalN = n_no3 + n_nh4;

    const kCaRatio = ca > 0 ? k / ca : 0;
    const caMgRatio = mg > 0 ? ca / mg : 0;
    const kMgRatio = mg > 0 ? k / mg : 0;
    const nh4RatioPct = totalN > 0 ? (n_nh4 / totalN) * 100 : 0;
    const nkRatio = k > 0 ? totalN / k : 0;

    return {
      kCaRatio,
      caMgRatio,
      kMgRatio,
      nh4RatioPct,
      nkRatio,
      totalN,
    };
  }, [meq]);

  // Primary 3-anion distribution (NO3, P, S) for ternary diagram
  const anionDist3 = useMemo(() => {
    const s = (meq.N_NO3 || 0) + (meq.P || 0) + (meq.S || 0);
    return {
      N_NO3: s > 0 ? ((meq.N_NO3 || 0) / s) * 100 : 0,
      P: s > 0 ? ((meq.P || 0) / s) * 100 : 0,
      S: s > 0 ? ((meq.S || 0) / s) * 100 : 0,
      sum: s,
    };
  }, [meq]);

  // Primary 3-cation distribution (K, Ca, Mg) for ternary diagram
  const cationDist3 = useMemo(() => {
    const s = (meq.K || 0) + (meq.Ca || 0) + (meq.Mg || 0);
    return {
      K: s > 0 ? ((meq.K || 0) / s) * 100 : 0,
      Ca: s > 0 ? ((meq.Ca || 0) / s) * 100 : 0,
      Mg: s > 0 ? ((meq.Mg || 0) / s) * 100 : 0,
      sum: s,
    };
  }, [meq]);

  // Ternary SVG Coordinates generator (Top, Left, Right)
  const toTernarySvg = (topPct: number, leftPct: number, rightPct: number) => {
    const t = topPct / 100;
    const l = leftPct / 100;
    const r = rightPct / 100;
    // Base width: 240, height: 210. Top=(120, 15), Left=(20, 200), Right=(220, 200)
    return {
      x: 120 + (r - l) * 100,
      y: 20 + (1 - t) * 180,
    };
  };

  const anionMarker = toTernarySvg(anionDist3.N_NO3, anionDist3.P, anionDist3.S);
  const cationMarker = toTernarySvg(cationDist3.Ca, cationDist3.K, cationDist3.Mg);

  const anionPolyPts = HYDRO_ANION_POLYGON.map(([a, b, c]) => {
    const p = toTernarySvg(a, b, c);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');

  const cationPolyPts = HYDRO_CATION_POLYGON.map(([a, b, c]) => {
    // In our chart: Top=Ca, Left=K, Right=Mg
    const p = toTernarySvg(b, a, c);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');

  // Practical Fertilizer Dissolution Recipe (Tank A & Tank B calculation)
  // Simplified stoichiometric mass calculation for standard commercial salts
  const fertilizerRecipe = useMemo(() => {
    const volM3 = targetVolumeLiters / 1000;
    const concF = Math.max(1, concentrateFactor);
    const stockTankVolL = targetVolumeLiters / concF;

    // Nutrient meq/L to ppm
    const ppms: Record<string, number> = {};
    HYDRO_MEQ_NUTRIENTS.forEach((k) => {
      ppms[k] = (meq[k] || 0) * (HYDRO_EQ_WEIGHTS[k] || 1);
    });

    // 1. Calcium Nitrate [Ca(NO3)2·4H2O or 5Ca(NO3)2·NH4NO3·10H2O] in Tank A
    // Provides 19% Ca and 15.5% N (14.4% NO3, 1.1% NH4). MW ~ 1080 / 5 = 216 g/eq Ca
    // 1 meq/L Ca = 20.04 mg/L Ca -> requires (20.04 / 0.19) = 105.5 mg/L or g/m3 of Ca(NO3)2
    const caMeq = meq.Ca || 0;
    const calcNitrateGramsPerM3 = caMeq * 108.5; // g/m3
    const calcNitrateN_NO3_meq = (calcNitrateGramsPerM3 * 0.144) / 14.0;
    const calcNitrateN_NH4_meq = (calcNitrateGramsPerM3 * 0.011) / 14.0;

    // 2. Potassium Nitrate [KNO3] in Tank A or B
    // Provides 38.6% K, 13.8% N-NO3. 1 meq/L K = 39.1 mg/L -> (39.1 / 0.386) = 101.3 g/m3
    const remainingNO3 = Math.max(0, (meq.N_NO3 || 0) - calcNitrateN_NO3_meq);
    const kMeq = meq.K || 0;
    // We satisfy NO3 or K with KNO3
    const kno3Meq = Math.min(kMeq, remainingNO3);
    const kno3GramsPerM3 = kno3Meq * 101.3;
    const kno3K_meq = kno3Meq;
    const kno3NO3_meq = kno3Meq;

    // 3. Monopotassium Phosphate [KH2PO4 - MKP] in Tank B
    // Provides 28.7% K, 22.7% P. 1 meq/L P = 31.0 mg/L -> (31.0 / 0.227) = 136.5 g/m3
    // Supplies 1 meq P and 0.79 meq K per meq of MKP
    const pMeq = meq.P || 0;
    const mkpGramsPerM3 = pMeq * 136.1;
    const mkpK_meq = pMeq;

    // 4. Potassium Sulfate [K2SO4 - SOP] in Tank B for remaining K
    const remainingK = Math.max(0, kMeq - kno3K_meq - mkpK_meq);
    const sopGramsPerM3 = remainingK * 87.1; // 1 meq K = 87.1 g K2SO4 / m3

    // 5. Magnesium Sulfate [MgSO4·7H2O - Epsom Salt] in Tank B
    // Provides 9.8% Mg, 13.0% S. 1 meq/L Mg = 12.15 mg/L -> (12.15 / 0.0986) = 123.2 g/m3
    const mgMeq = meq.Mg || 0;
    const epsomGramsPerM3 = mgMeq * 123.2;

    // 6. Iron Chelate Fe-EDDHA 6% (or Fe-DTPA) in Tank A (assuming 1.5 ppm Fe default)
    const feChelateGramsPerM3 = 25.0; // 25 g/m3 of 6% = 1.5 ppm Fe

    // Total grams per target volume
    const tankASalts = [
      {
        name: tr('Calcium Nitrate [5Ca(NO₃)₂·NH₄NO₃·10H₂O]', 'نترات الكالسيوم القابلة للذوبان', 'Nitrate de Chaux soluble'),
        formula: 'Ca(NO₃)₂ + NH₄NO₃',
        gPerM3: calcNitrateGramsPerM3,
        totalKg: (calcNitrateGramsPerM3 * volM3) / 1000,
        supplies: `Ca²⁺: ${(caMeq * 20.04).toFixed(0)} ppm | NO₃⁻: ${(calcNitrateN_NO3_meq * 14).toFixed(0)} ppm`,
        tank: 'A',
      },
      {
        name: tr('Potassium Nitrate [KNO₃] (Part A)', 'نترات البوتاسيوم', 'Nitrate de Potasse'),
        formula: 'KNO₃',
        gPerM3: kno3GramsPerM3,
        totalKg: (kno3GramsPerM3 * volM3) / 1000,
        supplies: `K⁺: ${(kno3K_meq * 39.1).toFixed(0)} ppm | NO₃⁻: ${(kno3NO3_meq * 14).toFixed(0)} ppm`,
        tank: 'A',
      },
      {
        name: tr('Iron Chelate [Fe-DTPA / EDDHA 6%]', 'مخلب الحديد Fe-EDDHA / DTPA 6%', 'Chélate de Fer 6%'),
        formula: 'Fe-Chelate 6%',
        gPerM3: feChelateGramsPerM3,
        totalKg: (feChelateGramsPerM3 * volM3) / 1000,
        supplies: 'Fe: 1.50 ppm',
        tank: 'A',
      },
    ];

    const tankBSalts = [
      {
        name: tr('Monopotassium Phosphate [KH₂PO₄ - MKP]', 'أحادي فوسفات البوتاسيوم (MKP)', 'Phosphate Monopotassique (MKP)'),
        formula: 'KH₂PO₄ (0-52-34)',
        gPerM3: mkpGramsPerM3,
        totalKg: (mkpGramsPerM3 * volM3) / 1000,
        supplies: `P: ${(pMeq * 31.0).toFixed(0)} ppm | K⁺: ${(mkpK_meq * 39.1).toFixed(0)} ppm`,
        tank: 'B',
      },
      {
        name: tr('Magnesium Sulfate [MgSO₄·7H₂O - Epsom]', 'سلفات الماغنيسيوم (ملح إبسوم)', 'Sulfate de Magnésium (Epsom)'),
        formula: 'MgSO₄·7H₂O (16% MgO, 13% S)',
        gPerM3: epsomGramsPerM3,
        totalKg: (epsomGramsPerM3 * volM3) / 1000,
        supplies: `Mg²⁺: ${(mgMeq * 12.15).toFixed(0)} ppm | S: ${(mgMeq * 16.03).toFixed(0)} ppm`,
        tank: 'B',
      },
      {
        name: tr('Potassium Sulfate [K₂SO₄ - SOP]', 'سلفات البوتاسيوم الذائبة (SOP)', 'Sulfate de Potasse (SOP)'),
        formula: 'K₂SO₄ (0-0-50+18S)',
        gPerM3: sopGramsPerM3,
        totalKg: (sopGramsPerM3 * volM3) / 1000,
        supplies: `K⁺: ${(remainingK * 39.1).toFixed(0)} ppm | S: ${(remainingK * 16.03).toFixed(0)} ppm`,
        tank: 'B',
      },
    ];

    const totalTankAKg = tankASalts.reduce((acc, s) => acc + s.totalKg, 0);
    const totalTankBKg = tankBSalts.reduce((acc, s) => acc + s.totalKg, 0);

    return {
      volM3,
      concF,
      stockTankVolL,
      tankASalts,
      tankBSalts,
      totalTankAKg,
      totalTankBKg,
    };
  }, [meq, targetVolumeLiters, concentrateFactor, tr]);

  const handleCopyReport = () => {
    const activeP = EXTENDED_PRESETS.find((p) => p.id === activePresetId);
    const text = `
=== HYDROPONIC NUTRIENT SOLUTION DESIGN REPORT ===
Profile: ${activeP ? activeP.name : preset?.name || 'Custom Formulation'}
Total Target Volume: ${targetVolumeLiters} Liters (${(targetVolumeLiters / 1000).toFixed(1)} m³)
Target EC: ${estimatedEC.toFixed(2)} dS/m | Osmotic Potential: ${osmoticPotentialBars.toFixed(2)} bars
Total Anions: ${sumAnions.toFixed(2)} meq/L | Total Cations: ${sumCations.toFixed(2)} meq/L (Error: ${ionBalanceErrorPct.toFixed(1)}%)

IONIC PROFILE (meq/L & ppm):
• N-NO3: ${meq.N_NO3 || 0} meq/L (${((meq.N_NO3 || 0) * 14).toFixed(1)} ppm)
• N-NH4: ${meq.N_NH4 || 0} meq/L (${((meq.N_NH4 || 0) * 14).toFixed(1)} ppm) [NH4/N: ${ratios.nh4RatioPct.toFixed(1)}%]
• P (H2PO4): ${meq.P || 0} meq/L (${((meq.P || 0) * 31).toFixed(1)} ppm)
• S (SO4): ${meq.S || 0} meq/L (${((meq.S || 0) * 16.03).toFixed(1)} ppm)
• K+: ${meq.K || 0} meq/L (${((meq.K || 0) * 39.1).toFixed(1)} ppm)
• Ca2+: ${meq.Ca || 0} meq/L (${((meq.Ca || 0) * 20.04).toFixed(1)} ppm)
• Mg2+: ${meq.Mg || 0} meq/L (${((meq.Mg || 0) * 12.15).toFixed(1)} ppm)
• Cl-: ${meq.Cl || 0} meq/L (${((meq.Cl || 0) * 35.45).toFixed(1)} ppm)

KEY RATIOS:
• K / Ca: ${ratios.kCaRatio.toFixed(2)} (Ideal: 0.8 - 1.2)
• Ca / Mg: ${ratios.caMgRatio.toFixed(2)} (Ideal: 2.0 - 3.5)
• K / Mg: ${ratios.kMgRatio.toFixed(2)} (Ideal: 2.0 - 3.0)
• Total N / K: ${ratios.nkRatio.toFixed(2)}

TWO-TANK CONCENTRATE RECIPE (${fertilizerRecipe.concF}x Stock for ${fertilizerRecipe.stockTankVolL} L Stock Tank):
--- TANK A (Calcium + Nitrate + Chelates) ---
${fertilizerRecipe.tankASalts.map((s) => `• ${s.name}: ${s.totalKg.toFixed(2)} kg (${s.gPerM3.toFixed(1)} g/m³)`).join('\n')}
Total Tank A Salts: ${fertilizerRecipe.totalTankAKg.toFixed(2)} kg

--- TANK B (Phosphates + Sulfates + Magnesium) ---
${fertilizerRecipe.tankBSalts.map((s) => `• ${s.name}: ${s.totalKg.toFixed(2)} kg (${s.gPerM3.toFixed(1)} g/m³)`).join('\n')}
Total Tank B Salts: ${fertilizerRecipe.totalTankBKg.toFixed(2)} kg
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: tr('Hydroponic Recipe Copied!', 'تم نسخ تقرير المحلول المغذي!', 'Rapport de solution copié !'),
      description: tr('Full ionic balance and tank mixing recipes copied.', 'تم نسخ التوازن الأيوني وخلطة الخزانين إلى الحافظة.', 'Rapport copié dans le presse-papier.'),
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendToWaterLab = () => {
    sendToBridge({
      targetToolId: 'water-lab',
      sourceToolId: 'Hydroponic Solution Designer',
      values: {
        ca: meq.Ca,
        mg: meq.Mg,
        k: meq.K,
        cl: meq.Cl,
        so4: meq.S,
        no3: meq.N_NO3,
        ec: estimatedEC,
      },
    });
    toast({
      title: tr('Sent to Water Lab Analyzer', 'تم إرسال البيانات إلى محلل جودة المياه', 'Envoyé à l’analyseur d’eau'),
      description: `${tr('Exported EC:', 'الناقلية المصدرة:', 'CE exportée :')} ${estimatedEC.toFixed(2)} dS/m`,
    });
  };

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Signature Hero Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-950 via-emerald-900 to-cyan-950 text-white p-6 shadow-xl border border-teal-700/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                <FlaskConical className="h-6 w-6 text-teal-300" />
              </span>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  {tr(
                    'Hydroponic Solution Designer & Tank Formulator',
                    'مصمّم المحاليل المغذية المائية وخلطات الخزانات (A/B Tank Formulation)',
                    'Concepteur de Solution Hydroponique & Cuves A/B'
                  )}
                  <Badge variant="outline" className="bg-teal-500/20 text-teal-200 border-teal-400/40 text-[10px] uppercase tracking-wider">
                    Steiner & Hoagland Models
                  </Badge>
                </h2>
              </div>
            </div>
            <p className="text-sm text-teal-100/90 max-w-3xl leading-relaxed">
              {tr(
                'Formulate precision soilless nutrient solutions in meq/L & ppm. Calculate electrical conductivity (EC), ionic equilibrium ratios, Steiner ternary polygons, and 2-tank (Tank A / Tank B) commercial fertilizer recipes.',
                'تصميم محاليل التغذية الهيدروبونية بدقة (meq/L و ppm) وحساب الناقلية الكهربائية والتوازن الأيوني ومخطط شتاينر الثلاثي وجداول إذابة الأسمدة في الخزانين A و B.',
                'Calculez la CE, l’équilibre ionique, les diagrammes ternaires de Steiner et les recettes de fertilisation en cuves A et B.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleCopyReport}
              variant="outline"
              size="sm"
              className="bg-white/15 hover:bg-white/25 text-white border-white/25 backdrop-blur font-semibold shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1 text-emerald-300" />
                  {tr('Copied!', 'تم النسخ!', 'Copié !')}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1 text-teal-300" />
                  {tr('Copy Recipe', 'نسخ الوصفة', 'Copier')}
                </>
              )}
            </Button>
            <Button
              onClick={handleSendToWaterLab}
              variant="outline"
              size="sm"
              className="bg-white/15 hover:bg-white/25 text-white border-white/25 backdrop-blur font-semibold shadow-sm"
            >
              <Share2 className="h-4 w-4 mr-1 text-cyan-300" />
              {tr('Send to Water Lab', 'إرسال إلى محلل المياه', 'Vers Analyseur d’Eau')}
            </Button>
            <Button
              onClick={() => {
                setMeq({ ...EXTENDED_PRESETS[0].values });
                setActivePresetId('steiner');
                setPreset(null);
                toast({ title: tr('Reset to Steiner Baseline', 'تمت استعادة محلول شتاينر', 'Réinitialisé à Steiner') });
              }}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur"
            >
              <RotateCcw className="h-4 w-4 mr-1 text-stone-300" />
              {tr('Reset', 'إعادة تعيين', 'Réinitialiser')}
            </Button>
          </div>
        </div>

        {/* Quick Preset Selector Pill Bar */}
        <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-teal-200/80 font-medium mr-1">
              {tr('Quick Presets:', 'نماذج جاهزة:', 'Profils types :')}
            </span>
            {EXTENDED_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyExtendedPreset(p)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  activePresetId === p.id
                    ? 'bg-teal-400 text-teal-950 shadow-md font-bold'
                    : 'bg-white/10 hover:bg-white/20 text-teal-100'
                }`}
              >
                {isAr ? p.name_ar : isFr ? p.name_fr : p.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <CropPresetDropdown onSelect={applyCropPreset} value={preset?.id ?? null} />
          </div>
        </div>

        {preset && (
          <div className="mt-3 text-xs rounded-xl border border-teal-400/40 bg-white/10 backdrop-blur px-3 py-2 text-teal-100 flex items-center justify-between">
            <div>
              <strong className="text-white font-bold">{preset.emoji} {preset.name}:</strong> {preset.hydroSolution.notes}
            </div>
            <Badge variant="outline" className="bg-teal-500/20 text-white border-teal-300/40 text-[10px]">
              {tr('Crop Database Linked', 'مرتبط بقاعدة المحاصيل', 'Lié à la base')}
            </Badge>
          </div>
        )}
      </div>

      {/* Bridge Integration Banner if received from Water Diagnostic */}
      {bridgeBanner && (
        <div className="p-3.5 rounded-2xl border border-teal-300 dark:border-teal-800 bg-teal-50/80 dark:bg-teal-950/40 text-xs text-teal-900 dark:text-teal-200 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Check className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>
              {tr(
                `Injected bicarbonate alkalinity from ${bridgeBanner.source || 'Water Quality'}:`,
                `تم استيراد قلوية البيكربونات من ${bridgeBanner.source || 'تشخيص المياه'}:`,
                `Alcalinité bicarbonatée injectée depuis ${bridgeBanner.source || 'Qualité de l’Eau'} :`
              )}{' '}
              <strong className="font-mono font-bold text-teal-800 dark:text-teal-300">{bridgeBanner.hco3.toFixed(2)} meq/L</strong> — {tr('Mapped to counter-anion load.', 'تمت إضافتها كحمل أنيوني مكافئ.', 'Ajoutée comme charge anionique équivalente.')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setBridgeBanner(null)}
            className="text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Vital Solution Health Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>{tr('Estimated EC', 'الناقلية الكهربائية (EC)', 'Conductivité (CE)')}</span>
            <Zap className="h-3.5 w-3.5 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-700 dark:text-teal-300 font-mono">
            {estimatedEC.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">dS/m</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Σ meq/L = {totalMeq.toFixed(1)} (≈ {Math.round(estimatedEC * 640)} ppm TDS)
          </div>
        </div>

        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>{tr('Osmotic Pressure', 'الضغط الأسموزي (Ψos)', 'Pression osmotique')}</span>
            <Droplets className="h-3.5 w-3.5 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-cyan-700 dark:text-cyan-300 font-mono">
            {Math.abs(osmoticPotentialBars).toFixed(2)} <span className="text-sm font-normal text-muted-foreground">bar</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Ψos = {osmoticPotentialBars.toFixed(2)} atm / bar
          </div>
        </div>

        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>{tr('Ionic Balance Error', 'توازن الشحنات الكهربائية', 'Bilan des charges')}</span>
            <Scale className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <div className={`text-2xl font-black font-mono ${isIonBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {ionBalanceErrorPct > 0 ? `+${ionBalanceErrorPct.toFixed(1)}` : ionBalanceErrorPct.toFixed(1)}%
          </div>
          <div className="text-[10px] text-muted-foreground">
            {isIonBalanced ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="h-3 w-3" /> {tr('Balanced (<5%)', 'متوازن (<5%)', 'Équilibré (<5%)')}
              </span>
            ) : (
              <span className="text-amber-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {tr('Charge disparity', 'عدم تطابق شحنات', 'Déséquilibre')}
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>{tr('K : Ca : Mg Ratio', 'نسب الكاتيونات K:Ca:Mg', 'Ratios K:Ca:Mg')}</span>
            <Atom className="h-3.5 w-3.5 text-purple-600" />
          </div>
          <div className="text-lg font-black text-foreground font-mono">
            {ratios.kCaRatio.toFixed(1)} : 1.0 : {(1 / (ratios.caMgRatio || 1)).toFixed(1)}
          </div>
          <div className="text-[10px] text-muted-foreground">
            NH₄⁺/N = {ratios.nh4RatioPct.toFixed(1)}% (Limit &lt;15%)
          </div>
        </div>
      </div>

      {/* Navigation Tabs: Formulation Grid, Graphical Equilibrium Diagrams, Tank Dissolution Recipe, Diagnostics */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-11 p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="editor" className="rounded-lg text-xs font-bold gap-1.5">
            <FlaskConical className="h-3.5 w-3.5 text-teal-600" />
            <span>{tr('Nutrient Input Grid', 'جدول تركيز الأيونات', 'Saisie des Éléments')}</span>
          </TabsTrigger>
          <TabsTrigger value="charts" className="rounded-lg text-xs font-bold gap-1.5">
            <Atom className="h-3.5 w-3.5 text-purple-600" />
            <span>{tr('Ternary Diagrams', 'مخططات شتاينر الثلاثية', 'Diagrammes de Steiner')}</span>
          </TabsTrigger>
          <TabsTrigger value="tanks" className="rounded-lg text-xs font-bold gap-1.5">
            <Layers className="h-3.5 w-3.5 text-emerald-600" />
            <span>{tr('Tank A / B Recipes', 'وصفة إذابة الخزانين A/B', 'Recette Cuves A/B')}</span>
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="rounded-lg text-xs font-bold gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>{tr('Physiological Diagnostics', 'التشخيص الفسيولوجي', 'Diagnostic Physiologique')}</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: NUTRIENT INPUT GRID (meq/L <-> ppm) */}
        <TabsContent value="editor" className="space-y-4 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Anions Table */}
            <div className="lg:col-span-6 space-y-3">
              <Card className="rounded-2xl border shadow-xs overflow-hidden">
                <CardHeader className="bg-blue-50/50 dark:bg-blue-950/20 py-3 px-4 border-b flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <CardTitle className="text-sm font-bold">
                      {tr('Anions (Negative Charges −)', 'الأنيونات السالبة (Anions −)', 'Anions (Charges Négatives −)')}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300">
                    Σ {sumAnions.toFixed(2)} meq/L
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/30 border-b">
                        <tr className="text-muted-foreground font-semibold">
                          <th className="py-2.5 px-3 text-left">{tr('Ion / Nutrient', 'الأيون / العنصر', 'Ion / Élément')}</th>
                          <th className="py-2.5 px-3 text-right">{tr('meq / L', 'مكافئ/لتر (meq/L)', 'meq / L')}</th>
                          <th className="py-2.5 px-3 text-right">{tr('Concentration (ppm / mg/L)', 'التركيز (ppm)', 'Concentration (ppm)')}</th>
                          <th className="py-2.5 px-3 text-right">{tr('% of Anions', 'النسبة %', '% Anions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {ANIONS.map((key) => {
                          const lbl = HYDRO_NUTRIENT_LABELS[key];
                          const w = HYDRO_EQ_WEIGHTS[key] || 1;
                          const m = meq[key] || 0;
                          const ppm = m * w;
                          const pct = sumAnions > 0 ? (m / sumAnions) * 100 : 0;
                          return (
                            <tr key={key} className="hover:bg-muted/20 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="font-mono font-bold text-foreground">{lbl.ion}</div>
                                <div className="text-[10px] text-muted-foreground">{lbl.name}</div>
                              </td>
                              <td className="py-2 px-2 text-right">
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={m || ''}
                                  placeholder="0.0"
                                  onChange={(e) => setMeqValue(key, parseFloat(e.target.value) || 0)}
                                  className="h-8 w-20 text-right text-xs font-mono font-bold ml-auto"
                                />
                              </td>
                              <td className="py-2 px-2 text-right">
                                <Input
                                  type="number"
                                  step="1"
                                  min="0"
                                  value={ppm ? Number(ppm.toFixed(1)) : ''}
                                  placeholder="0"
                                  onChange={(e) => setPpmValue(key, parseFloat(e.target.value) || 0)}
                                  className="h-8 w-24 text-right text-xs font-mono font-bold ml-auto"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-semibold text-muted-foreground">
                                {pct.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cations Table */}
            <div className="lg:col-span-6 space-y-3">
              <Card className="rounded-2xl border shadow-xs overflow-hidden">
                <CardHeader className="bg-amber-50/50 dark:bg-amber-950/20 py-3 px-4 border-b flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <CardTitle className="text-sm font-bold">
                      {tr('Cations (Positive Charges +)', 'الكاتيونات الموجبة (Cations +)', 'Cations (Charges Positives +)')}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300">
                    Σ {sumCations.toFixed(2)} meq/L
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/30 border-b">
                        <tr className="text-muted-foreground font-semibold">
                          <th className="py-2.5 px-3 text-left">{tr('Ion / Nutrient', 'الأيون / العنصر', 'Ion / Élément')}</th>
                          <th className="py-2.5 px-3 text-right">{tr('meq / L', 'مكافئ/لتر (meq/L)', 'meq / L')}</th>
                          <th className="py-2.5 px-3 text-right">{tr('Concentration (ppm / mg/L)', 'التركيز (ppm)', 'Concentration (ppm)')}</th>
                          <th className="py-2.5 px-3 text-right">{tr('% of Cations', 'النسبة %', '% Cations')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {CATIONS.map((key) => {
                          const lbl = HYDRO_NUTRIENT_LABELS[key];
                          const w = HYDRO_EQ_WEIGHTS[key] || 1;
                          const m = meq[key] || 0;
                          const ppm = m * w;
                          const pct = sumCations > 0 ? (m / sumCations) * 100 : 0;
                          return (
                            <tr key={key} className="hover:bg-muted/20 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="font-mono font-bold text-foreground">{lbl.ion}</div>
                                <div className="text-[10px] text-muted-foreground">{lbl.name}</div>
                              </td>
                              <td className="py-2 px-2 text-right">
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={m || ''}
                                  placeholder="0.0"
                                  onChange={(e) => setMeqValue(key, parseFloat(e.target.value) || 0)}
                                  className="h-8 w-20 text-right text-xs font-mono font-bold ml-auto"
                                />
                              </td>
                              <td className="py-2 px-2 text-right">
                                <Input
                                  type="number"
                                  step="1"
                                  min="0"
                                  value={ppm ? Number(ppm.toFixed(1)) : ''}
                                  placeholder="0"
                                  onChange={(e) => setPpmValue(key, parseFloat(e.target.value) || 0)}
                                  className="h-8 w-24 text-right text-xs font-mono font-bold ml-auto"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-semibold text-muted-foreground">
                                {pct.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Ratios & Chemical Rule Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border bg-card space-y-1 text-xs">
              <div className="font-bold text-foreground flex items-center justify-between">
                <span>{tr('K / Ca Ratio:', 'نسبة البوتاسيوم إلى الكالسيوم:', 'Ratio K / Ca :')}</span>
                <span className="font-mono font-bold text-teal-600">{ratios.kCaRatio.toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {tr(
                  'Vegetative target: 0.8–1.0. Fruiting target: 1.2–1.6. Prevents blossom-end rot and marginal leaf tip necrosis.',
                  'النمو الخضري: 0.8–1.0. الإثمار: 1.2–1.6. توازن ضروري لتفادي تعفن الطرف الزهري واحتراق الأطراف.',
                  'Végétatif : 0.8–1.0. Fructification : 1.2–1.6. Prévient la nécrose apicale.'
                )}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border bg-card space-y-1 text-xs">
              <div className="font-bold text-foreground flex items-center justify-between">
                <span>{tr('Ca / Mg Ratio:', 'نسبة الكالسيوم إلى الماغنيسيوم:', 'Ratio Ca / Mg :')}</span>
                <span className="font-mono font-bold text-teal-600">{ratios.caMgRatio.toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {tr(
                  'Optimum range: 2.0–3.5. High magnesium competes with calcium transport to developing fruits.',
                  'المجال الأمثل: 2.0–3.5. ارتفاع الماغنيسيوم ينافس الكالسيوم في الامتصاص ويؤدي للتشوهات.',
                  'Plage optimale : 2.0–3.5. Évite la compétition sur l’absorption racinaire.'
                )}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border bg-card space-y-1 text-xs">
              <div className="font-bold text-foreground flex items-center justify-between">
                <span>{tr('NH₄⁺ Fraction of Total N:', 'نسبة الأمونيوم من النيتروجين الكلي:', 'Fraction NH₄⁺ / N total :')}</span>
                <span className={`font-mono font-bold ${ratios.nh4RatioPct > 15 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {ratios.nh4RatioPct.toFixed(1)}%
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {tr(
                  'Should remain < 10–15% in soilless systems to prevent root rhizosphere acidification and root burn.',
                  'يجب ألا تتجاوز 10–15% لتفادي تحمض الجذور الشديد وانخفاض الأكسجين الجذري.',
                  'Doit rester < 10–15% en hors-sol pour éviter l’acidification de la rhizosphère.'
                )}
              </p>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: TERNARY STEINER EQUILIBRIUM DIAGRAMS */}
        <TabsContent value="charts" className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Anion Ternary Diagram */}
            <Card className="rounded-2xl border shadow-xs overflow-hidden">
              <CardHeader className="py-3 px-4 bg-muted/20 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Atom className="h-4 w-4 text-blue-600" />
                  {tr('Steiner Anion Polygon (% meq)', 'مخطط شتاينر الثلاثي للأنيونات (% meq)', 'Triangle Anionique de Steiner')}
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono font-bold">
                  NO₃ : H₂PO₄ : SO₄
                </Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="relative w-full max-w-[280px] mx-auto">
                  <svg viewBox="0 0 240 230" className="w-full h-auto drop-shadow-xs">
                    {/* Background triangle */}
                    <polygon points="120,20 20,200 220,200" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
                    {/* Steiner recommended equilibrium polygon */}
                    <polygon points={anionPolyPts} fill="#3b82f626" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="3,2" />
                    {/* Vertex Labels */}
                    <text x="120" y="14" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1e293b">
                      NO₃ ({anionDist3.N_NO3.toFixed(0)}%)
                    </text>
                    <text x="12" y="215" textAnchor="start" fontSize="10" fontWeight="bold" fill="#1e293b">
                      H₂PO₄ ({anionDist3.P.toFixed(0)}%)
                    </text>
                    <text x="228" y="215" textAnchor="end" fontSize="10" fontWeight="bold" fill="#1e293b">
                      SO₄ ({anionDist3.S.toFixed(0)}%)
                    </text>
                    {/* Active Marker */}
                    <circle cx={anionMarker.x} cy={anionMarker.y} r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                  </svg>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center text-xs">
                  <div className="p-2 rounded-lg bg-muted/40">
                    <div className="text-[10px] text-muted-foreground">NO₃⁻</div>
                    <div className="font-mono font-bold text-foreground">{anionDist3.N_NO3.toFixed(1)}%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40">
                    <div className="text-[10px] text-muted-foreground">H₂PO₄⁻</div>
                    <div className="font-mono font-bold text-foreground">{anionDist3.P.toFixed(1)}%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40">
                    <div className="text-[10px] text-muted-foreground">SO₄²⁻</div>
                    <div className="font-mono font-bold text-foreground">{anionDist3.S.toFixed(1)}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cation Ternary Diagram */}
            <Card className="rounded-2xl border shadow-xs overflow-hidden">
              <CardHeader className="py-3 px-4 bg-muted/20 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Atom className="h-4 w-4 text-amber-600" />
                  {tr('Steiner Cation Polygon (% meq)', 'مخطط شتاينر الثلاثي للكاتيونات (% meq)', 'Triangle Cationique de Steiner')}
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono font-bold">
                  Ca : K : Mg
                </Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="relative w-full max-w-[280px] mx-auto">
                  <svg viewBox="0 0 240 230" className="w-full h-auto drop-shadow-xs">
                    {/* Background triangle */}
                    <polygon points="120,20 20,200 220,200" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
                    {/* Steiner recommended equilibrium polygon */}
                    <polygon points={cationPolyPts} fill="#f59e0b26" stroke="#d97706" strokeWidth="1.5" strokeDasharray="3,2" />
                    {/* Vertex Labels */}
                    <text x="120" y="14" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1e293b">
                      Ca²⁺ ({cationDist3.Ca.toFixed(0)}%)
                    </text>
                    <text x="12" y="215" textAnchor="start" fontSize="10" fontWeight="bold" fill="#1e293b">
                      K⁺ ({cationDist3.K.toFixed(0)}%)
                    </text>
                    <text x="228" y="215" textAnchor="end" fontSize="10" fontWeight="bold" fill="#1e293b">
                      Mg²⁺ ({cationDist3.Mg.toFixed(0)}%)
                    </text>
                    {/* Active Marker */}
                    <circle cx={cationMarker.x} cy={cationMarker.y} r="6" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                  </svg>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center text-xs">
                  <div className="p-2 rounded-lg bg-muted/40">
                    <div className="text-[10px] text-muted-foreground">Ca²⁺</div>
                    <div className="font-mono font-bold text-foreground">{cationDist3.Ca.toFixed(1)}%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40">
                    <div className="text-[10px] text-muted-foreground">K⁺</div>
                    <div className="font-mono font-bold text-foreground">{cationDist3.K.toFixed(1)}%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40">
                    <div className="text-[10px] text-muted-foreground">Mg²⁺</div>
                    <div className="font-mono font-bold text-foreground">{cationDist3.Mg.toFixed(1)}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: TWO-TANK COMMERCIAL FERTILIZER FORMULATION RECIPE */}
        <TabsContent value="tanks" className="space-y-4 pt-2">
          {/* Mixing Parameters Control Bar */}
          <div className="p-4 rounded-2xl border bg-card shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">
                  {tr('Target Irrigation Volume (Liters)', 'حجم مياه الري الكلي (لتر)', 'Volume d’irrigation cible (Litres)')}
                </Label>
                <Input
                  type="number"
                  step="500"
                  min="100"
                  value={targetVolumeLiters}
                  onChange={(e) => setTargetVolumeLiters(Math.max(10, parseFloat(e.target.value) || 1000))}
                  className="h-9 w-36 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">
                  {tr('Stock Concentrate Factor (1:X)', 'معامل تركيز خزان الأمهات (1:X)', 'Facteur de concentration stock')}
                </Label>
                <Input
                  type="number"
                  step="10"
                  min="1"
                  value={concentrateFactor}
                  onChange={(e) => setConcentrateFactor(Math.max(1, parseFloat(e.target.value) || 100))}
                  className="h-9 w-32 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="text-right text-xs">
              <div className="text-muted-foreground">{tr('Stock Tanks Volume:', 'حجم كل خزان مركز:', 'Volume de chaque cuve mère :')}</div>
              <div className="text-lg font-black text-teal-600 font-mono">
                {fertilizerRecipe.stockTankVolL.toFixed(1)} Liters / Tank
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TANK A (Calcium + Nitrates + Iron Chelate) */}
            <Card className="rounded-2xl border border-teal-200 dark:border-teal-800/60 shadow-xs overflow-hidden">
              <CardHeader className="bg-teal-50 dark:bg-teal-950/30 py-3.5 px-4 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-teal-900 dark:text-teal-200 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-teal-600 text-white font-mono text-xs font-bold">Tank A</span>
                    <span>{tr('Calcium, Nitrates & Chelates', 'الكالسيوم والنترات ومخلب الحديد', 'Calcium, Nitrates & Chélates')}</span>
                  </CardTitle>
                  <CardDescription className="text-[11px] text-teal-700 dark:text-teal-300">
                    {tr('Do NOT mix with phosphates or sulfates (prevents CaSO₄ & CaHPO₄ precipitation)', 'لا يخلط أبداً مع الفوسفات أو الكبريتات لتفادي الترسيب', 'Ne jamais mélanger avec phosphates/sulfates')}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs font-bold bg-white text-teal-900 border-teal-300">
                  {fertilizerRecipe.totalTankAKg.toFixed(2)} kg
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {fertilizerRecipe.tankASalts.map((s, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-muted/20 transition-colors">
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs text-foreground">{s.name}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{s.formula}</div>
                        <div className="text-[10px] text-teal-700 dark:text-teal-400 font-medium">{s.supplies}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-black text-sm text-foreground">{s.totalKg.toFixed(2)} kg</div>
                        <div className="text-[10px] text-muted-foreground">{s.gPerM3.toFixed(1)} g/m³</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* TANK B (Phosphates + Sulfates + Magnesium) */}
            <Card className="rounded-2xl border border-blue-200 dark:border-blue-800/60 shadow-xs overflow-hidden">
              <CardHeader className="bg-blue-50 dark:bg-blue-950/30 py-3.5 px-4 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-mono text-xs font-bold">Tank B</span>
                    <span>{tr('Phosphates, Sulfates & Magnesium', 'الفوسفات والكبريتات والماغنيسيوم', 'Phosphates, Sulfates & Magnésium')}</span>
                  </CardTitle>
                  <CardDescription className="text-[11px] text-blue-700 dark:text-blue-300">
                    {tr('Contains MKP, SOP, Epsom salt and soluble micronutrient complexes', 'يحتوي على الـ MKP وسلفات البوتاسيوم وسلفات الماغنيسيوم والعناصر الصغرى', 'Contient MKP, sulfate de potasse, sulfate de Mg')}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs font-bold bg-white text-blue-900 border-blue-300">
                  {fertilizerRecipe.totalTankBKg.toFixed(2)} kg
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {fertilizerRecipe.tankBSalts.map((s, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-muted/20 transition-colors">
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs text-foreground">{s.name}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{s.formula}</div>
                        <div className="text-[10px] text-blue-700 dark:text-blue-400 font-medium">{s.supplies}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-black text-sm text-foreground">{s.totalKg.toFixed(2)} kg</div>
                        <div className="text-[10px] text-muted-foreground">{s.gPerM3.toFixed(1)} g/m³</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 4: PHYSIOLOGICAL DIAGNOSTICS & AGRONOMIC RULES */}
        <TabsContent value="diagnostics" className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="rounded-2xl border shadow-xs p-4 space-y-3">
              <div className="font-bold text-sm text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>{tr('Solution Safety & Precipitation Risk Matrix', 'مصفوفة أمان المحلول ومخاطر الترسيب', 'Sécurité et risques de précipitation')}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl border bg-muted/20 flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-foreground">{tr('Gypsum Precipitation (CaSO₄):', 'ترسيب كبريتات الكالسيوم:', 'Précipitation CaSO₄ :')}</strong>{' '}
                    <span className="text-muted-foreground">
                      {tr(
                        'Keep (Ca²⁺ meq × SO₄²⁻ meq) product below limits in concentrated stock tanks by strictly separating Ca into Tank A and SO₄ into Tank B.',
                        'احرص على فصل الكالسيوم في الخزان A والكبريتات في الخزان B لتفادي انسداد النقاطات بالجبس.',
                        'Séparer strictement le Ca dans la cuve A et le SO₄ dans la cuve B.'
                      )}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl border bg-muted/20 flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-foreground">{tr('Dicalcium Phosphate (CaHPO₄):', 'ترسيب فوسفات ثنائي الكالسيوم:', 'Précipitation CaHPO₄ :')}</strong>{' '}
                    <span className="text-muted-foreground">
                      {tr(
                        'Occurs when pH > 6.5 in the presence of free calcium and phosphate. Maintain dripper line pH at 5.6–6.0 using Nitric / Phosphoric acid.',
                        'يحدث عند ارتفاع الـ pH فوق 6.5 بوجود الكالسيوم والفوسفور. حافظ على درجة حموضة 5.6–6.0 باستعمال حمض النيتريك.',
                        'Maintenir le pH entre 5.6 et 6.0 pour éviter le blocage du phosphore.'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border shadow-xs p-4 space-y-3">
              <div className="font-bold text-sm text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-600" />
                <span>{tr('pH Buffering & Acid Dosing Guide', 'دليل تعديل الحموضة (pH) وحقن الأحماض', 'Régulation du pH et injection d’acide')}</span>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                <p>
                  {tr(
                    'When raw water contains HCO₃⁻ > 1.5 meq/L (90 ppm), inject 58% Nitric Acid (HNO₃) or 75% Phosphoric Acid (H₃PO₄) to neutralize excess bicarbonate down to 0.5 meq/L.',
                    'عندما تحتوي المياه الخام على بيكربونات > 1.5 meq/L، قم بحقن حمض النيتريك 58% أو الفوسفوريك 75% لمعادلة القلوية والوصول إلى 0.5 meq/L متبقية كعازل منظم.',
                    'Si l’eau brute contient HCO₃⁻ > 1.5 meq/L, injecter de l’acide nitrique ou phosphorique pour stabiliser le pH.'
                  )}
                </p>
                <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-[11px] text-teal-900 dark:text-teal-200 font-mono">
                  1 meq/L HNO₃ (63 g/m³ pure) neutralizes 1 meq/L HCO₃⁻ and adds 14 ppm N-NO₃⁻.
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
