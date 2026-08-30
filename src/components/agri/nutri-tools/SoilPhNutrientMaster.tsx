'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  FlaskConical,
  Sprout,
  Tractor,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Search,
  Printer,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Scale,
  Atom,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Droplets,
  Leaf,
  Thermometer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';
import { copyFor, useTranslation } from '@/lib/language-store';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';
import {
  PH_NUTRIENTS_MASTER,
  CROPS_PH_DATABASE,
  SOIL_TEXTURE_DATA,
  ORGANIC_AMENDMENTS_DATA,
  FERTILIZER_REACTIONS_DATA,
  NutrientPhCurve,
  CropPhSpec,
  SoilTextureType,
  OrganicAmendmentOption,
} from '@/lib/soil-ph-nutrients-data';

// ---------------------------------------------------------------------------
// Trilingual constants
// ---------------------------------------------------------------------------

const TITLE: TrilingualString = {
  en: 'Soil pH & Nutrients Availability Master',
  ar: 'منظومة حموضة التربة وتوافر العناصر وتعديلها',
  fr: 'Maître du pH du sol et disponibilité des nutriments',
};

const DESC: TrilingualString = {
  en: 'Interactive Troug-Lucas nutrient availability curves, crop pH tolerance thresholds, and smart soil amendment solvers (Elemental Sulfur, Lime, Manure & Acid Fertigation).',
  ar: 'المحاكي التفاعلي لمنحنيات تروغ-لوكاس لتوافر العناصر، وحدود تحمل المحاصيل للحموضة، وحاسبة تعديل ومعالجة قلوية وحامضية التربة بالأسمدة والمادة العضوية.',
  fr: 'Courbes interactives de Troug, seuils de tolérance des cultures et calculs d’amendements (soufre, chaux, fumiers et fertigation acidifiante).',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Availability curves follow Troug-Lucas (1955) sigmoid models. Amendment rates use USDA texture buffering factors and CCE conversion (Lyon & Buckman). Chelate stability: Norvell 1972.',
  ar: 'منحنيات التوفر تتبع نماذج تروغ-لوكاس (1955). تُحسب الجرعات حسب معاملات النسجة والتنظيم USDA وتحويل CCE (Lyon & Buckman). ثبات الشيلات: Norvell 1972.',
  fr: 'Courbes de disponibilité selon Troug-Lucas (1955). Doses basées sur les pouvoirs tampons USDA et conversion CCE (Lyon & Buckman). Stabilité des chélates : Norvell 1972.',
};

export function SoilPhNutrientMaster() {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const isFr = language === 'fr';

  const tr = (enText: string, arText: string, frText?: string) => {
    if (isAr) return arText;
    if (isFr && frText) return frText;
    return enText;
  };

  // Main Active Tab
  const [activeTab, setActiveTab] = useState<'spectrum' | 'crops' | 'amendments' | 'fertilizers'>('spectrum');

  // Soil pH state (3.5 to 10.0)
  const [currentPh, setCurrentPh] = useState<number>(7.8);
  const [selectedNutrientId, setSelectedNutrientId] = useState<string>('p');
  const [nutrientCategoryFilter, setNutrientCategoryFilter] = useState<'all' | 'macro' | 'secondary' | 'micro'>('all');

  // Crop Recommender state
  const [selectedCropId, setSelectedCropId] = useState<string>('tomato');
  const [cropCategoryFilter, setCropCategoryFilter] = useState<'all' | 'cereals' | 'vegetables' | 'fruits_orchard' | 'legumes_forages' | 'industrial'>('all');
  const [cropSearchQuery, setCropSearchQuery] = useState<string>('');

  // Soil Amendment Calculator state
  const [targetPh, setTargetPh] = useState<number>(6.5);
  const [soilTexture, setSoilTexture] = useState<SoilTextureType>('clay_loam');
  const [calcareousLevel, setCalcareousLevel] = useState<'none' | 'low' | 'moderate' | 'high'>('moderate');
  const [fieldAreaHa, setFieldAreaHa] = useState<number>(1.0);
  const [selectedOrganicId, setSelectedOrganicId] = useState<string>('mature_compost');
  const [copiedPrescription, setCopiedPrescription] = useState<boolean>(false);

  // Selected nutrient object
  const selectedNutrient = useMemo(() => {
    return PH_NUTRIENTS_MASTER.find((n) => n.id === selectedNutrientId) || PH_NUTRIENTS_MASTER[0];
  }, [selectedNutrientId]);

  // Selected crop object
  const selectedCrop = useMemo(() => {
    return CROPS_PH_DATABASE.find((c) => c.id === selectedCropId) || CROPS_PH_DATABASE[0];
  }, [selectedCropId]);

  // Soil Classification at current pH
  const phClassification = useMemo(() => {
    if (currentPh < 5.0) {
      return {
        label: tr('Strongly Acidic', 'حامضية شديدة', 'Fortement acide'),
        badgeClass: 'bg-red-500 text-white',
        color: '#ef4444',
        summary: tr(
          'Severe Aluminum & Manganese toxicity risk. Phosphorus and Molybdenum locked out. Bacterial nitrification severely suppressed.',
          'خطر شديد لسمية الألومنيوم والمنغنيز وتثبيت حاد للفسفور والموليبدينوم مع توقف نشاط بكتيريا النترتة.',
          'Risque sévère de toxicité Al/Mn. Phosphore et molybdène bloqués. Nitrification ralentie.'
        ),
        recommendation: tr(
          'Mandatory Liming (Agricultural Lime / Dolomite) to raise pH above 5.8.',
          'إضافة الجير الزراعي أو الدولوميت إجبارية لرفع الحموضة فوق 5.8.',
          'Chaulage obligatoire pour remonter le pH au-dessus de 5.8.'
        ),
      };
    }
    if (currentPh < 6.0) {
      return {
        label: tr('Moderately Acidic', 'حامضية معتدلة', 'Modérément acide'),
        badgeClass: 'bg-amber-500 text-white',
        color: '#f59e0b',
        summary: tr(
          'Good micronutrient availability (Fe, Mn, Zn), but reduced Ca/Mg saturation and moderate Phosphorus fixation by Fe/Al.',
          'توفر ممتاز للعناصر الصغرى (حديد، منغنيز، زنك) مع انخفاض نسبي في تشبع الكالسيوم وتثبيت متوسط للفسفور.',
          'Bonne disponibilité des oligo-éléments, mais saturation Ca/Mg plus faible.'
        ),
        recommendation: tr(
          'Suitable for potatoes, strawberries, and tea. For cereals and legumes, light liming is recommended.',
          'مناسبة للبطاطا والفراولة. للحبوب والبقوليات يفضل إضافة جرعة جير خفيفة.',
          'Idéal pour pomme de terre et fraisier; chaulage léger recommandé pour céréales/légumineuses.'
        ),
      };
    }
    if (currentPh <= 7.2) {
      return {
        label: tr('Optimal Agronomic Neutral', 'حيادية مثالية زراعياً', 'Neutre agronomique optimal'),
        badgeClass: 'bg-emerald-600 text-white',
        color: '#16a34a',
        summary: tr(
          'The sweet spot! Peak availability for N, P, K, Ca, Mg, S, and balanced micronutrient solubility with maximum microbial activity.',
          'المنطقة الذهبية! أعلى كفاءة لامتصاص كافة العناصر الكبرى والصغرى مع نشاط ميكروبي حيوي مثالي.',
          'Zone idéale ! Disponibilité maximale pour N, P, K, Ca, Mg et activité microbienne optimale.'
        ),
        recommendation: tr(
          'Maintain current balance with organic compost and balanced NPK fertigation.',
          'حافظ على هذا التوازن باستخدام الكمبوست والتسميد المتوازن.',
          'Maintenir avec compost et fertilisation équilibrée.'
        ),
      };
    }
    if (currentPh <= 7.8) {
      return {
        label: tr('Slightly Alkaline', 'قلوية خفيفة', 'Légèrement alcalin'),
        badgeClass: 'bg-teal-600 text-white',
        color: '#0d9488',
        summary: tr(
          'High Calcium & Magnesium saturation. Initial Phosphorus and Iron availability starts to decline; Zinc fixation begins.',
          'تشبع عالي بالكالسيوم والمغنيسيوم. بداية تراجع ذوبانية الفسفور والحديد وبدء تثبيت الزنك.',
          'Forte saturation en Ca. Début de blocage du fer, du zinc et du phosphore.'
        ),
        recommendation: tr(
          'Use acidifying fertilizers (Ammonium sulfate, MAP) and chelates (Fe-DTPA / Fe-EDDHA).',
          'استخدم الأسمدة المحمضة (سلفات الأمونيوم، MAP) والحديد المخلبي.',
          'Utiliser des engrais acidifiants (sulfate d’ammonium, MAP) et chélates de fer.'
        ),
      };
    }
    if (currentPh <= 8.4) {
      return {
        label: tr('Calcareous / Moderately Alkaline', 'كلسية / قلوية متوسطة', 'Calcaire / Modérément alcalin'),
        badgeClass: 'bg-orange-600 text-white',
        color: '#ea580c',
        summary: tr(
          'Widespread Mediterranean soil condition. High active lime triggers severe Phosphorus precipitation (Tricalcium phosphate) and Lime-induced Iron Chlorosis.',
          'النمط الشائع في أراضي حوض المتوسط. الكلس الحر يسبب تثبيتاً حاداً للفسفور (فوسفات ثلاثي الكالسيوم) والاصفرار الحديدي.',
          'Sol calcaire méditerranéen type. Forte rétrogradation du phosphore et chlorose ferrique marquée.'
        ),
        recommendation: tr(
          'Apply Elemental Sulfur (S⁰) + organic matter. Inject Phosphoric Acid in drip lines and use Fe-EDDHA ortho-ortho.',
          'طبق الكبريت الزراعي والمادة العضوية، واحقن حمض الفوسفوريك وشيلات Fe-EDDHA.',
          'Apport de soufre élémentaire + matière organique. Injection d’acide phosphorique et Fe-EDDHA.'
        ),
      };
    }
    return {
      label: tr('Strongly Alkaline / Sodic', 'قلوية شديدة / صودية', 'Fortement alcalin / Sodique'),
      badgeClass: 'bg-purple-700 text-white',
      color: '#7e22ce',
      summary: tr(
        'Severe alkalinity, likely accompanied by excess exchangeable Sodium (ESP > 15%). Poor water infiltration, dispersion of clay, and extreme micronutrient lockout.',
        'قلوية مرتفعة غالباً مصحوبة بارتفاع الصوديوم المتبادل وتدهور نفاذية التربة وتشتت الطين مع انعدام ذوبان العناصر الصغرى.',
        'Alcalinité sévère, risque sodique élevé (ESP > 15%). Structure dégradée et blocage extrême des oligo-éléments.'
      ),
      recommendation: tr(
        'Apply Gypsum (CaSO₄·2H₂O) for sodic soils or Elemental Sulfur + deep tillage and heavy organic conditioning.',
        'إضافة الجبس الزراعي لغسيل الصوديوم، أو الكبريت الزراعي مع حراثة عميقة وإضافة كميات وافرة من السماد العضوي.',
        'Apport de gypse agricole si sodique, ou soufre élémentaire massif + amendement organique profond.'
      ),
    };
  }, [currentPh, tr]);

  // Compute crop suitability score at current pH
  const calculateCropSuitability = (crop: CropPhSpec, ph: number) => {
    if (ph >= crop.optimumPhMin && ph <= crop.optimumPhMax) {
      return { score: 100, status: 'optimal', label: tr('Optimal (100%)', 'مثالي (100%)', 'Optimal (100%)'), color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    }
    if (ph >= crop.toleratedPhMin && ph <= crop.toleratedPhMax) {
      // Linear interpolation in tolerance zone
      const isBelow = ph < crop.optimumPhMin;
      const distance = isBelow ? (crop.optimumPhMin - ph) / (crop.optimumPhMin - crop.toleratedPhMin) : (ph - crop.optimumPhMax) / (crop.toleratedPhMax - crop.optimumPhMax);
      const score = Math.round(100 - distance * 30); // 100 -> 70
      return { score, status: 'tolerable', label: tr(`Tolerable (~${score}%)`, `مقبول مع إجهاد (~${score}%)`, `Tolérable (~${score}%)`), color: 'text-amber-600 bg-amber-50 border-amber-200' };
    }
    // Outside tolerated range
    const isBelow = ph < crop.toleratedPhMin;
    const diff = isBelow ? crop.toleratedPhMin - ph : ph - crop.toleratedPhMax;
    const score = Math.max(15, Math.round(65 - diff * 40));
    return { score, status: 'stress', label: tr(`Severe Risk (~${score}%)`, `خطر إنتاجي شديد (~${score}%)`, `Risque sévère (~${score}%)`), color: 'text-red-600 bg-red-50 border-red-200' };
  };

  // Filtered Nutrients
  const filteredNutrients = useMemo(() => {
    return PH_NUTRIENTS_MASTER.filter((item) => {
      if (nutrientCategoryFilter === 'all') return true;
      if (nutrientCategoryFilter === 'macro') return item.category === 'macro';
      if (nutrientCategoryFilter === 'secondary') return item.category === 'secondary';
      if (nutrientCategoryFilter === 'micro') return item.category === 'micro';
      return true;
    });
  }, [nutrientCategoryFilter]);

  // Filtered Crops
  const filteredCrops = useMemo(() => {
    return CROPS_PH_DATABASE.filter((crop) => {
      const matchesCat = cropCategoryFilter === 'all' || crop.category === cropCategoryFilter;
      const q = cropSearchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        crop.name.toLowerCase().includes(q) ||
        crop.name_ar.includes(q) ||
        crop.name_fr.toLowerCase().includes(q) ||
        crop.scientificName.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [cropCategoryFilter, cropSearchQuery]);

  // Amendment Prescription Calculation
  const amendmentPrescription = useMemo(() => {
    const deltaPh = currentPh - targetPh; // positive means we need to lower pH (acidify); negative means raise pH (lime)
    const texture = SOIL_TEXTURE_DATA[soilTexture];
    const isAcidifying = deltaPh > 0.05;
    const isLiming = deltaPh < -0.05;
    const isOptimal = Math.abs(deltaPh) <= 0.05;

    // Calcareous buffer multiplier for acidification
    let calcareousMultiplier = 1.0;
    if (calcareousLevel === 'low') calcareousMultiplier = 1.25;
    if (calcareousLevel === 'moderate') calcareousMultiplier = 1.6;
    if (calcareousLevel === 'high') calcareousMultiplier = 2.2;

    // Elemental sulfur rate (kg/ha)
    const sulfurKgHa = Math.round(Math.abs(deltaPh) * texture.sulfurPerUnitDropKgHa * calcareousMultiplier);
    const sulfurTonnesField = Number(((sulfurKgHa * fieldAreaHa) / 1000).toFixed(2));

    // Agricultural lime rate (kg/ha)
    const limeKgHa = Math.round(Math.abs(deltaPh) * texture.limePerUnitRiseKgHa);
    const limeTonnesField = Number(((limeKgHa * fieldAreaHa) / 1000).toFixed(2));

    // Organic amendment choice
    const org = ORGANIC_AMENDMENTS_DATA.find((o) => o.id === selectedOrganicId) || ORGANIC_AMENDMENTS_DATA[0];
    const organicTonnesField = Number((org.recommendedRateTonnesHa * fieldAreaHa).toFixed(1));

    return {
      deltaPh,
      isAcidifying,
      isLiming,
      isOptimal,
      texture,
      sulfurKgHa,
      sulfurTonnesField,
      limeKgHa,
      limeTonnesField,
      org,
      organicTonnesField,
      calcareousMultiplier,
    };
  }, [currentPh, targetPh, soilTexture, calcareousLevel, fieldAreaHa, selectedOrganicId]);

  // Copy Prescription to clipboard
  const handleCopyPrescription = () => {
    const text = `
=== SOIL pH & NUTRIENT AMENDMENT PRESCRIPTION ===
Current Soil pH: ${currentPh.toFixed(1)} (${phClassification.label})
Target Soil pH: ${targetPh.toFixed(1)}
Soil Texture: ${SOIL_TEXTURE_DATA[soilTexture].name} | Free Lime: ${calcareousLevel.toUpperCase()}
Field Area: ${fieldAreaHa} ha

DIAGNOSIS & PRESCRIPTION:
${
  amendmentPrescription.isAcidifying
    ? `• Action: Soil Acidification
• Elemental Sulfur (S⁰ 99%): ${amendmentPrescription.sulfurKgHa.toLocaleString()} kg/ha (Total: ${amendmentPrescription.sulfurTonnesField} tonnes for field)
• Application: Broadcast & incorporate into top 15-20 cm at least 4-8 weeks before planting (warm soil >15°C).
• Fertigation Strategy: Inject Phosphoric Acid (H₃PO₄) and use Ammonium Sulfate [(NH₄)₂SO₄] as primary nitrogen source.
• Chelated Micronutrients: Use Fe-EDDHA (ortho-ortho isomer ≥ 4.8%) and Zn-EDTA.`
    : amendmentPrescription.isLiming
    ? `• Action: Soil Liming
• Agricultural Lime (CaCO₃ CCE 100%): ${amendmentPrescription.limeKgHa.toLocaleString()} kg/ha (Total: ${amendmentPrescription.limeTonnesField} tonnes for field)
• Application: Broadcast evenly and disc into top 15 cm in autumn/winter.`
    : `• Soil pH is already within the optimal target range!`
}

ORGANIC CONDITIONING:
• Recommended: ${amendmentPrescription.org.name}
• Rate: ${amendmentPrescription.org.recommendedRateTonnesHa} t/ha (Total: ${amendmentPrescription.organicTonnesField} tonnes)
• Benefits: ${amendmentPrescription.org.keyBenefits}
Generated by FormulaAtlas Agronomic Engine.
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedPrescription(true);
    toast({
      title: tr('Prescription Copied!', 'تم نسخ الوصفة التسميدية!', 'Ordonnance copiée !'),
      description: tr(
        'Soil amendment prescription ready to paste or share.',
        'تم نسخ تقرير معالجة وتعديل التربة إلى الحافظة بنجاح.',
        'Ordonnance d’amendement prête à être partagée.'
      ),
    });
    setTimeout(() => setCopiedPrescription(false), 3000);
  };

  // Reset all soil & amendment inputs to default agronomic values
  const handleReset = () => {
    setCurrentPh(7.8);
    setTargetPh(6.5);
    setSoilTexture('clay_loam');
    setCalcareousLevel('moderate');
    setFieldAreaHa(1.0);
    setSelectedOrganicId('mature_compost');
    setSelectedNutrientId('p');
    setSelectedCropId('tomato');
    setNutrientCategoryFilter('all');
    setCropCategoryFilter('all');
    setCropSearchQuery('');
    setActiveTab('spectrum');
    toast({
      title: tr('Reset Complete', 'تمت إعادة التعيين', 'Réinitialisé'),
      description: tr(
        'All soil pH, amendment and crop parameters restored to defaults.',
        'تمت إعادة جميع معايير الحموضة والتعديل والمحاصيل إلى الوضع الافتراضي.',
        'Tous les paramètres pH, amendements et cultures ont été réinitialisés.'
      ),
    });
  };

  const heroActions = [
    {
      icon: Copy,
      label: { en: 'Copy Prescription', ar: 'نسخ الوصفة', fr: 'Copier' },
      onClick: handleCopyPrescription,
      variant: 'primary' as const,
      showCheck: copiedPrescription,
    },
    {
      icon: RotateCcw,
      label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
      onClick: handleReset,
    },
    {
      icon: Printer,
      label: { en: 'Print', ar: 'طباعة', fr: 'Imprimer' },
      onClick: () => window.print(),
    },
  ];

  return (
    <CalculatorShell
      icon={FlaskConical}
      title={TITLE}
      description={DESC}
      badge={tr('Troug-Lucas · CCE', 'تروغ-لوكاس · CCE', 'Troug-Lucas · CCE')}
      accent="amber"
      actions={heroActions}
      protocolNote={PROTOCOL_NOTE}
    >
      {/* Live Interactive pH Controller — full width gradient card */}
      <div className="lg:col-span-12">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950 via-orange-900 to-red-950 text-white p-6 shadow-xl border border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Slider & Presets */}
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-amber-200">
                  {tr('Active Soil pH Slider (Scale 3.5 — 10.0)', 'مؤشر قياس درجة حموضة التربة (pH)', 'Curseur de pH du sol (Échelle 3.5 — 10.0)')}
                </span>
                <span className="text-2xl font-black text-white px-3 py-0.5 rounded-lg bg-black/30 backdrop-blur border border-white/20">
                  pH {currentPh.toFixed(1)}
                </span>
              </div>

              <Slider
                value={[currentPh]}
                min={3.5}
                max={10.0}
                step={0.1}
                onValueChange={(val) => setCurrentPh(val[0])}
                className="py-2"
              />

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-amber-200 font-medium mr-1">
                  {tr('Presets:', 'نماذج جاهزة:', 'Préréglages :')}
                </span>
                {[
                  { label: '4.5 Acid Sand', ph: 4.5 },
                  { label: '5.5 Potato/Berry', ph: 5.5 },
                  { label: '6.5 Ideal Target', ph: 6.5 },
                  { label: '7.5 Slight Alkaline', ph: 7.5 },
                  { label: '8.2 Calcareous (Med.)', ph: 8.2 },
                  { label: '8.8 Sodic Alkali', ph: 8.8 },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setCurrentPh(p.ph)}
                    className={`text-[11px] px-2.5 py-1 rounded-full transition-all font-medium border ${
                      Math.abs(currentPh - p.ph) < 0.05
                        ? 'bg-white text-amber-900 border-white shadow-sm font-bold'
                        : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Status Card */}
            <div className="lg:col-span-4 bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge className={`${phClassification.badgeClass} font-semibold text-xs`}>
                  {phClassification.label}
                </Badge>
                <span className="text-[11px] text-white/70 font-mono">pH {currentPh.toFixed(1)}</span>
              </div>
              <p className="text-xs text-white/90 line-clamp-2 leading-relaxed">
                {phClassification.summary}
              </p>
              <div className="text-[11px] text-amber-200 flex items-center gap-1 font-medium pt-0.5">
                <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-amber-300" />
                <span className="truncate">{phClassification.recommendation}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="lg:col-span-12">
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1.5 bg-muted/80 rounded-xl border">
          <TabsTrigger value="spectrum" className="py-2.5 flex items-center gap-2 font-medium">
            <Atom className="h-4 w-4 text-emerald-600" />
            <span>{tr('Nutrient Availability', 'توافر العناصر (تروغ)', 'Disponibilité nutriments')}</span>
          </TabsTrigger>
          <TabsTrigger value="crops" className="py-2.5 flex items-center gap-2 font-medium">
            <Sprout className="h-4 w-4 text-green-600" />
            <span>{tr('Crop pH Tolerance', 'تحمل المحاصيل', 'Tolérance des cultures')}</span>
          </TabsTrigger>
          <TabsTrigger value="amendments" className="py-2.5 flex items-center gap-2 font-medium">
            <Scale className="h-4 w-4 text-amber-600" />
            <span>{tr('Amendment Solver', 'حاسبة تعديل التربة', 'Calculateur d’amendements')}</span>
          </TabsTrigger>
          <TabsTrigger value="fertilizers" className="py-2.5 flex items-center gap-2 font-medium">
            <Tractor className="h-4 w-4 text-blue-600" />
            <span>{tr('Fertilizer & Chelate Guide', 'دليل الأسمدة والشيلات', 'Guide engrais & chélates')}</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: NUTRIENT AVAILABILITY SPECTRUM (TROUG DYNAMICS) */}
        <TabsContent value="spectrum" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Interactive Spectrum Bars */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="border shadow-sm">
                <CardHeader className="pb-3 border-b bg-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Atom className="h-5 w-5 text-emerald-600" />
                        {tr('Nutrient Solubility Spectrum at pH', 'مخطط ذوبانية وتوافر العناصر عند pH', 'Spectre de solubilité des nutriments à pH')} {currentPh.toFixed(1)}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {tr(
                          'Click any nutrient to inspect chemical forms, fixation mechanisms, and remediation protocols.',
                          'اضغط على أي عنصر لمعاينة صورته الكيميائية وأسباب التثبيت وطرق العلاج التسميدي.',
                          'Cliquez sur un élément pour voir les formes chimiques et protocoles de remédiation.'
                        )}
                      </CardDescription>
                    </div>

                    {/* Category Filter Chips */}
                    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                      {(['all', 'macro', 'secondary', 'micro'] as const).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setNutrientCategoryFilter(cat)}
                          className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium ${
                            nutrientCategoryFilter === cat ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {cat === 'all' && tr('All', 'الكل', 'Tous')}
                          {cat === 'macro' && tr('NPK', 'NPK', 'NPK')}
                          {cat === 'secondary' && tr('Ca-Mg-S', 'Ca-Mg-S', 'Ca-Mg-S')}
                          {cat === 'micro' && tr('Micros', 'صغرى', 'Oligos')}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  {filteredNutrients.map((nutrient) => {
                    const avail = Math.round(nutrient.calculateAvailability(currentPh));
                    const isSelected = selectedNutrientId === nutrient.id;
                    const isTox = nutrient.category === 'toxicity';

                    let barColor = 'bg-emerald-500';
                    let statusLabel = tr('Optimal', 'مثالي', 'Optimal');
                    let statusTextClass = 'text-emerald-700 dark:text-emerald-400';

                    if (isTox) {
                      if (avail > 40) {
                        barColor = 'bg-red-600';
                        statusLabel = tr('CRITICAL TOXICITY', 'سمية خطيرة', 'TOXICITÉ CRITIQUE');
                        statusTextClass = 'text-red-600 font-bold';
                      } else if (avail > 0) {
                        barColor = 'bg-amber-500';
                        statusLabel = tr('Mild Toxicity', 'سمية خفيفة', 'Toxicité légère');
                        statusTextClass = 'text-amber-600';
                      } else {
                        barColor = 'bg-emerald-500';
                        statusLabel = tr('Safe (Precipitated)', 'آمن تماماً', 'Sûr (Inerte)');
                        statusTextClass = 'text-emerald-600';
                      }
                    } else {
                      if (avail < 40) {
                        barColor = 'bg-red-500';
                        statusLabel = tr('Severe Lockout', 'تثبيت حاد', 'Blocage sévère');
                        statusTextClass = 'text-red-600';
                      } else if (avail < 75) {
                        barColor = 'bg-amber-500';
                        statusLabel = tr('Moderate Lockout', 'تثبيت متوسط', 'Disponibilité moyenne');
                        statusTextClass = 'text-amber-600';
                      }
                    }

                    return (
                      <div
                        key={nutrient.id}
                        onClick={() => setSelectedNutrientId(nutrient.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-600'
                            : 'border-border/60 hover:border-emerald-300 hover:bg-muted/40'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className="font-bold font-mono px-2 py-0.5 rounded text-white text-[11px]"
                              style={{ backgroundColor: nutrient.color }}
                            >
                              {nutrient.symbol}
                            </span>
                            <span className="font-semibold text-foreground">
                              {isAr ? nutrient.name_ar : isFr ? nutrient.name_fr : nutrient.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ({nutrient.valence})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-medium ${statusTextClass}`}>
                              {statusLabel}
                            </span>
                            <span className="font-bold font-mono text-xs w-9 text-right">
                              {isTox ? `${avail}%` : `${avail}%`}
                            </span>
                          </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                            style={{ width: `${isTox ? Math.max(avail, 3) : Math.max(avail, 5)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Right 5 Cols: Selected Nutrient Chemical Dossier */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="border shadow-sm sticky top-4">
                <CardHeader className="pb-3 border-b bg-muted/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-10 w-10 rounded-xl text-white font-black text-lg flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: selectedNutrient.color }}
                      >
                        {selectedNutrient.symbol}
                      </span>
                      <div>
                        <CardTitle className="text-base font-bold">
                          {isAr ? selectedNutrient.name_ar : isFr ? selectedNutrient.name_fr : selectedNutrient.name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {tr('Optimum Soil pH Range:', 'النطاق المثالي للـ pH:', 'Plage de pH optimale :')}{' '}
                          <span className="font-bold text-emerald-600">
                            {selectedNutrient.optimumPhMin.toFixed(1)} — {selectedNutrient.optimumPhMax.toFixed(1)}
                          </span>
                        </CardDescription>
                      </div>
                    </div>

                    <Badge variant="outline" className="font-mono text-xs">
                      {selectedNutrient.category.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4 text-xs">
                  {/* Current pH Behavior Alert */}
                  <div
                    className={`p-3 rounded-xl border ${
                      currentPh < 6.0
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 text-amber-900 dark:text-amber-200'
                        : currentPh > 7.3
                        ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 text-orange-900 dark:text-orange-200'
                        : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-900 dark:text-emerald-200'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 mb-1">
                      <Info className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {currentPh < 6.0
                          ? tr('Acid Reaction Profile', 'السلوك في الوسط الحامضي', 'Comportement en milieu acide')
                          : currentPh > 7.3
                          ? tr('Alkaline / Calcareous Lockout Profile', 'السلوك في الوسط القلوي والكلسي', 'Comportement en milieu calcaire/alcalin')
                          : tr('Optimal Equilibrium Profile', 'السلوك في الوسط المثالي', 'Comportement à l’optimum')}
                      </span>
                    </div>
                    <p className="leading-relaxed">
                      {currentPh < 6.0
                        ? isAr ? selectedNutrient.lowPhBehavior_ar : isFr ? selectedNutrient.lowPhBehavior_fr : selectedNutrient.lowPhBehavior
                        : currentPh > 7.3
                        ? isAr ? selectedNutrient.highPhBehavior_ar : isFr ? selectedNutrient.highPhBehavior_fr : selectedNutrient.highPhBehavior
                        : isAr ? selectedNutrient.optimalPhBehavior_ar : isFr ? selectedNutrient.optimalPhBehavior_fr : selectedNutrient.optimalPhBehavior}
                    </p>
                  </div>

                  {/* Chemical Forms in Solution */}
                  <div className="space-y-1">
                    <span className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">
                      {tr('Available Chemical Species in Soil Solution', 'الصور الكيميائية الذائبة في محلول التربة', 'Formes chimiques assimilables')}
                    </span>
                    <p className="p-2 rounded-lg bg-muted/60 font-mono text-xs">
                      {isAr ? selectedNutrient.availableForms_ar : isFr ? selectedNutrient.availableForms_fr : selectedNutrient.availableForms}
                    </p>
                  </div>

                  {/* Practical Agronomic Strategy */}
                  <div className="space-y-1">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide text-[10px] flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      {tr('Fertilizer & Remediation Recommendation', 'التوصية التسميدية والعلاج الحقلي', 'Recommandation agronomique')}
                    </span>
                    <p className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 text-foreground leading-relaxed">
                      {isAr ? selectedNutrient.fertilizerStrategy_ar : isFr ? selectedNutrient.fertilizerStrategy_fr : selectedNutrient.fertilizerStrategy}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: CROP PH TOLERANCE & RECOVERY MATRIX */}
        <TabsContent value="crops" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Filterable Crops List */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="border shadow-sm">
                <CardHeader className="pb-3 border-b bg-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Sprout className="h-5 w-5 text-green-600" />
                        {tr('Crop Suitability at Current Soil pH', 'ملاءمة المحاصيل عند درجة pH التربة', 'Adaptation des cultures au pH')} ({currentPh.toFixed(1)})
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {tr(
                          'Evaluates expected yield response, acidity sensitivity, and active limestone tolerance.',
                          'تقييم الاستجابة الإنتاجية المتوقعة، والحساسية للحموضة وتحمل الكلس النشط.',
                          'Évalue le rendement potentiel, la sensibilité à l’acidité et la tolérance au calcaire.'
                        )}
                      </CardDescription>
                    </div>

                    {/* Search */}
                    <div className="relative w-full sm:w-48">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder={tr('Search crop...', 'بحث عن محصول...', 'Rechercher culture...')}
                        value={cropSearchQuery}
                        onChange={(e) => setCropSearchQuery(e.target.value)}
                        className="h-8 pl-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div className="flex flex-wrap items-center gap-1 pt-2">
                    {[
                      { id: 'all', label: tr('All Crops', 'جميع المحاصيل', 'Toutes') },
                      { id: 'cereals', label: tr('Cereals', 'حبوب', 'Céréales') },
                      { id: 'vegetables', label: tr('Vegetables', 'خضروات', 'Maraîchage') },
                      { id: 'fruits_orchard', label: tr('Fruits & Orchard', 'أشجار وفاكهة', 'Arboriculture') },
                      { id: 'legumes_forages', label: tr('Legumes & Forages', 'بقوليات وأعلاف', 'Légumineuses') },
                      { id: 'industrial', label: tr('Industrial', 'صناعية', 'Industrielles') },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCropCategoryFilter(cat.id as any)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                          cropCategoryFilter === cat.id
                            ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                            : 'bg-muted/60 text-muted-foreground hover:text-foreground border-transparent'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-2.5 max-h-[600px] overflow-y-auto">
                  {filteredCrops.map((crop) => {
                    const isSelected = selectedCropId === crop.id;
                    const suitability = calculateCropSuitability(crop, currentPh);

                    return (
                      <div
                        key={crop.id}
                        onClick={() => setSelectedCropId(crop.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 ring-1 ring-emerald-600'
                            : 'border-border/60 hover:border-emerald-300 hover:bg-muted/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl p-1.5 rounded-lg bg-muted/60">{crop.iconEmoji}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-foreground">
                                {isAr ? crop.name_ar : isFr ? crop.name_fr : crop.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground italic hidden sm:inline">
                                ({crop.scientificName})
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                              <span>
                                {tr('Optimum:', 'المثالي:', 'Optimum :')}{' '}
                                <strong className="text-foreground">{crop.optimumPhMin.toFixed(1)} - {crop.optimumPhMax.toFixed(1)}</strong>
                              </span>
                              <span>·</span>
                              <span>
                                {tr('Tolerated:', 'المتحمل:', 'Toléré :')}{' '}
                                <span>{crop.toleratedPhMin.toFixed(1)} - {crop.toleratedPhMax.toFixed(1)}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border font-bold ${suitability.color}`}>
                            {suitability.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {tr('Calcareous tol:', 'تحمل الكلس:', 'Tol. calcaire :')} {crop.calcareousTolerance}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Right 5 Cols: Selected Crop Deep Agronomic Profile */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="border shadow-sm sticky top-4">
                <CardHeader className="pb-3 border-b bg-muted/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2 rounded-xl bg-card border shadow-xs">
                        {selectedCrop.iconEmoji}
                      </span>
                      <div>
                        <CardTitle className="text-base font-bold">
                          {isAr ? selectedCrop.name_ar : isFr ? selectedCrop.name_fr : selectedCrop.name}
                        </CardTitle>
                        <CardDescription className="text-xs italic font-mono">
                          {selectedCrop.scientificName}
                        </CardDescription>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTargetPh((selectedCrop.optimumPhMin + selectedCrop.optimumPhMax) / 2)}
                      className="text-xs h-7 text-emerald-700 dark:text-emerald-300 border-emerald-300"
                    >
                      {tr('Set as Target', 'تعيين كهدف', 'Cibler')}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4 text-xs">
                  {/* Visual pH Range Span for Crop */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-muted/50 border">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold">{tr('pH Range Spectrum', 'نطاق الحموضة للمحصول', 'Spectre de pH')}</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                        {selectedCrop.optimumPhMin} — {selectedCrop.optimumPhMax}
                      </span>
                    </div>

                    {/* Interactive horizontal mini-bar */}
                    <div className="relative h-6 w-full bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center">
                      {/* Tolerated zone */}
                      <div
                        className="absolute h-full bg-amber-200 dark:bg-amber-900/60"
                        style={{
                          left: `${((selectedCrop.toleratedPhMin - 3.5) / 6.5) * 100}%`,
                          width: `${((selectedCrop.toleratedPhMax - selectedCrop.toleratedPhMin) / 6.5) * 100}%`,
                        }}
                      />
                      {/* Optimal zone */}
                      <div
                        className="absolute h-full bg-emerald-500/80"
                        style={{
                          left: `${((selectedCrop.optimumPhMin - 3.5) / 6.5) * 100}%`,
                          width: `${((selectedCrop.optimumPhMax - selectedCrop.optimumPhMin) / 6.5) * 100}%`,
                        }}
                      />
                      {/* Current soil pH marker pointer */}
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-red-600 z-10 shadow-md"
                        style={{ left: `${((currentPh - 3.5) / 6.5) * 100}%` }}
                      >
                        <div className="w-2.5 h-2.5 -ml-[3px] -mt-1 bg-red-600 rounded-full border border-white" />
                      </div>
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
                      <span>3.5</span>
                      <span>5.0</span>
                      <span>6.5 (Neutral)</span>
                      <span>8.0</span>
                      <span>10.0</span>
                    </div>
                  </div>

                  {/* Agronomic Sensitivity Tags */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg border bg-card">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                        {tr('Active Lime Tolerance', 'تحمل الكلس النشط', 'Tolérance calcaire')}
                      </span>
                      <p className="font-bold text-xs capitalize mt-0.5 text-foreground">
                        {selectedCrop.calcareousTolerance.replace('_', ' ')}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg border bg-card">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                        {tr('Acidity Sensitivity', 'الحساسية للحموضة', 'Sensibilité acidité')}
                      </span>
                      <p className="font-bold text-xs capitalize mt-0.5 text-foreground">
                        {selectedCrop.aciditySensitivity.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  {/* Typical Deficiency Risks at High pH */}
                  <div className="space-y-1">
                    <span className="font-semibold text-orange-700 dark:text-orange-400 text-[11px] flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {tr('High pH / Calcareous Deficiency Risks', 'مخاطر النقص في الأراضي القلوية/الكلسية', 'Risques de carence en sol calcaire')}
                    </span>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {selectedCrop.typicalDeficienciesAtHighPh.map((nId) => {
                        const nut = PH_NUTRIENTS_MASTER.find((n) => n.id === nId);
                        return (
                          <Badge key={nId} variant="outline" className="text-[10px] bg-orange-50 border-orange-200 text-orange-900">
                            {nut ? nut.name : nId.toUpperCase()}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Agronomic Advice & Management */}
                  <div className="space-y-1">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-[11px] flex items-center gap-1">
                      <Leaf className="h-3.5 w-3.5" />
                      {tr('Agronomic Management & Rootstock Advice', 'الإرشاد الزراعي وإدارة المحصول', 'Conseils agronomiques & porte-greffe')}
                    </span>
                    <p className="p-2.5 rounded-lg bg-muted/60 text-foreground leading-relaxed">
                      {isAr ? selectedCrop.notes_ar : isFr ? selectedCrop.notes_fr : selectedCrop.notes}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: SMART SOIL AMENDMENT & pH DECISION SOLVER */}
        <TabsContent value="amendments" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 5 Cols: Input Parameters Form */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="border shadow-sm">
                <CardHeader className="pb-3 border-b bg-card">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-amber-600" />
                    {tr('Soil & Target Parameters', 'معايير التربة والهدف الزراعي', 'Paramètres du sol & objectif')}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {tr(
                      'Configure your soil texture, active limestone buffering, and field surface area.',
                      'حدد نسجة التربة، ونسبة الكلس الحر، والمساحة الحقلية لحساب الجرعات بدقة.',
                      'Configurez la texture, le calcaire actif et la surface pour calculer les doses.'
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 space-y-4 text-xs">
                  {/* Current vs Target pH */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-muted-foreground">
                        {tr('Current Soil pH', 'درجة pH الحالية', 'pH actuel du sol')}
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="3.5"
                        max="10.0"
                        value={currentPh}
                        onChange={(e) => setCurrentPh(parseFloat(e.target.value) || 7.0)}
                        className="font-bold text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-emerald-700 dark:text-emerald-400">
                        {tr('Target Soil pH', 'درجة pH المستهدفة', 'pH cible')}
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="4.5"
                        max="8.5"
                        value={targetPh}
                        onChange={(e) => setTargetPh(parseFloat(e.target.value) || 6.5)}
                        className="font-bold text-sm border-emerald-300"
                      />
                    </div>
                  </div>

                  {/* Soil Texture Selection */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">
                      {tr('Soil Texture (USDA Class)', 'نسجة وقوام التربة', 'Texture du sol (USDA)')}
                    </label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {(Object.keys(SOIL_TEXTURE_DATA) as SoilTextureType[]).map((tKey) => {
                        const tex = SOIL_TEXTURE_DATA[tKey];
                        const isSelected = soilTexture === tKey;
                        return (
                          <div
                            key={tKey}
                            onClick={() => setSoilTexture(tKey)}
                            className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                              isSelected
                                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 font-bold'
                                : 'bg-muted/40 hover:bg-muted border-border/70'
                            }`}
                          >
                            <span>{isAr ? tex.name_ar : isFr ? tex.name_fr : tex.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {tr('Buffer:', 'التنظيم:', 'Tampon :')} {tex.bufferingCapacity}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Free Calcium Carbonate (CaCO3) / Limestone Level */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">
                      {tr('Free Calcium Carbonate (CaCO₃ / Active Lime)', 'نسبة كربونات الكالسيوم الحرة (الكلس)', 'Calcaire total / actif (CaCO₃)')}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'none', label: tr('Non-Calcareous (<1%)', 'غير كلسية (<1%)', 'Non calcaire (<1%)') },
                        { id: 'low', label: tr('Low Lime (1-5%)', 'كلس منخفض (1-5%)', 'Faible (1-5%)') },
                        { id: 'moderate', label: tr('Moderate (5-15%)', 'كلس متوسط (5-15%)', 'Moyen (5-15%)') },
                        { id: 'high', label: tr('Highly Calcareous (>15%)', 'شديدة الكلس (>15%)', 'Fortement calcaire (>15%)') },
                      ].map((lvl) => (
                        <button
                          key={lvl.id}
                          onClick={() => setCalcareousLevel(lvl.id as any)}
                          className={`p-2 rounded-lg border text-xs text-left transition-all ${
                            calcareousLevel === lvl.id
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 font-bold text-emerald-900 dark:text-emerald-100'
                              : 'bg-muted/30 border-border/70 text-muted-foreground'
                          }`}
                        >
                          {lvl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Field Area (Hectares) */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">
                      {tr('Field Surface Area (Hectares)', 'مساحة الحقل (هكتار)', 'Superficie de la parcelle (ha)')}
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.01"
                      value={fieldAreaHa}
                      onChange={(e) => setFieldAreaHa(Math.max(0.01, parseFloat(e.target.value) || 1))}
                      className="font-bold text-sm"
                    />
                  </div>

                  {/* Organic Amendment Selector */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">
                      {tr('Organic Conditioning Source', 'نوع السماد العضوي المقترح', 'Source d’amendement organique')}
                    </label>
                    <select
                      value={selectedOrganicId}
                      onChange={(e) => setSelectedOrganicId(e.target.value)}
                      className="w-full p-2 rounded-lg border bg-background text-xs"
                    >
                      {ORGANIC_AMENDMENTS_DATA.map((org) => (
                        <option key={org.id} value={org.id}>
                          {isAr ? org.name_ar : isFr ? org.name_fr : org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right 7 Cols: Calculated Prescription & Action Plan */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="border shadow-md border-emerald-200 dark:border-emerald-900 bg-card">
                <CardHeader className="pb-3 border-b bg-emerald-50/40 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                        <Scale className="h-5 w-5 text-emerald-600" />
                        {tr('Custom Soil Amendment Prescription', 'الوصفة التسميدية الميدانية لتعديل التربة', 'Ordonnance personnalisée d’amendement')}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {tr(
                          'Scientifically calculated amendment rates for your texture, buffer capacity, and target pH.',
                          'جرعات محسوبة علمياً بناءً على السعة التنظيمية ونسجة التربة والهدف.',
                          'Doses calculées selon la texture, le pouvoir tampon et l’objectif.'
                        )}
                      </CardDescription>
                    </div>

                    <Button size="sm" onClick={handleCopyPrescription} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                      {copiedPrescription ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                      {tr('Copy Plan', 'نسخ الخطة', 'Copier')}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-5 text-xs">
                  {/* Action Summary Pill */}
                  <div className="p-3 rounded-xl bg-muted/60 border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">
                        {tr('Required pH Shift', 'تعديل درجة الحموضة المطلوب', 'Variation de pH requise')}
                      </span>
                      <p className="font-bold text-sm text-foreground mt-0.5">
                        {currentPh.toFixed(1)} → {targetPh.toFixed(1)} ({amendmentPrescription.deltaPh > 0 ? `-${amendmentPrescription.deltaPh.toFixed(1)} pH units` : `+${Math.abs(amendmentPrescription.deltaPh).toFixed(1)} pH units`})
                      </p>
                    </div>
                    <Badge className={amendmentPrescription.isAcidifying ? 'bg-orange-600 text-white' : amendmentPrescription.isLiming ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}>
                      {amendmentPrescription.isAcidifying
                        ? tr('Soil Acidification Needed', 'مطلوب خفض القلوية (تحميض)', 'Acidification requise')
                        : amendmentPrescription.isLiming
                        ? tr('Soil Liming Needed', 'مطلوب رفع الحموضة (تجير)', 'Chaulage requis')
                        : tr('pH Perfectly Balanced', 'التربة متوازنة تماماً', 'pH parfaitement équilibré')}
                    </Badge>
                  </div>

                  {/* Primary Mineral Amendment Doses */}
                  {amendmentPrescription.isAcidifying && (
                    <div className="space-y-3 p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200">
                      <div className="flex items-center justify-between border-b border-orange-200 pb-2">
                        <span className="font-bold text-orange-950 dark:text-orange-200 text-sm flex items-center gap-1.5">
                          <Atom className="h-4 w-4 text-orange-600" />
                          {tr('Primary Acidifier: Elemental Sulfur (S⁰ 99%)', 'المعالج الأساسي: الكبريت الزراعي الناعم (S⁰ 99%)', 'Amendement principal : Soufre élémentaire (S⁰)')}
                        </span>
                        <span className="font-black text-sm font-mono text-orange-700 dark:text-orange-300">
                          {amendmentPrescription.sulfurKgHa.toLocaleString()} kg/ha
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <div>
                          <span className="text-muted-foreground">{tr('Total for Field Area:', 'الكمية الكلية للمساحة:', 'Total pour la parcelle :')}</span>
                          <p className="font-bold text-sm text-foreground">{amendmentPrescription.sulfurTonnesField} {tr('Tonnes', 'طن', 'Tonnes')}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{tr('Application Window:', 'توقيت التطبيق:', 'Période d’épandage :')}</span>
                          <p className="font-semibold text-foreground">{tr('4-8 weeks before sowing (>15°C)', '4-8 أسابيع قبل الزراعة (>15°م)', '4-8 sem. avant semis (>15°C)')}</p>
                        </div>
                      </div>

                      <p className="text-xs text-orange-900 dark:text-orange-200 leading-relaxed border-t border-orange-200 pt-2">
                        {tr(
                          'Incorporate into the top 15-20 cm. Soil bacteria (Thiobacillus) biologically convert S⁰ into sulfuric acid (H₂SO₄), lowering bulk pH and liberating locked Phosphorus and Iron.',
                          'يحرث في عمق 15-20 سم. تقوم بكتيريا التربة (الثيوباسيلوس) بتحويل الكبريت إلى حمض كبريتيك يخفض قلوية التربة ويحرر الفسفور والحديد المثبت.',
                          'Enfouir sur 15-20 cm. Les bactéries Thiobacillus transforment S⁰ en acide sulfurique, libérant le phosphore et le fer bloqués.'
                        )}
                      </p>
                    </div>
                  )}

                  {amendmentPrescription.isLiming && (
                    <div className="space-y-3 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200">
                      <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                        <span className="font-bold text-blue-950 dark:text-blue-200 text-sm flex items-center gap-1.5">
                          <Scale className="h-4 w-4 text-blue-600" />
                          {tr('Primary Liming Agent: Agricultural Lime (CaCO₃)', 'المعالج الأساسي: الجير الزراعي (كربونات الكالسيوم)', 'Amendement calcaire : Chaux agricole (CaCO₃)')}
                        </span>
                        <span className="font-black text-sm font-mono text-blue-700 dark:text-blue-300">
                          {amendmentPrescription.limeKgHa.toLocaleString()} kg/ha
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <div>
                          <span className="text-muted-foreground">{tr('Total for Field Area:', 'الكمية الكلية للمساحة:', 'Total pour la parcelle :')}</span>
                          <p className="font-bold text-sm text-foreground">{amendmentPrescription.limeTonnesField} {tr('Tonnes', 'طن', 'Tonnes')}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{tr('Dolomite Alternative (if Mg low):', 'بديل الدولوميت (عند نقص Mg):', 'Dolomie (si déficit en Mg) :')}</span>
                          <p className="font-semibold text-foreground">{(amendmentPrescription.limeKgHa * 0.9).toFixed(0)} kg/ha</p>
                        </div>
                      </div>

                      <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed border-t border-blue-200 pt-2">
                        {tr(
                          'Neutralizes toxic exchangeable Aluminum (Al³⁺) and supplies essential Calcium for root and fruit cell wall structural integrity.',
                          'يعادل سمية الألومنيوم الذائب ويمد النبات بالكالسيوم الأساسي لتقوية جدران الخلايا وتفادي عفن طرف الزهرة.',
                          'Neutralise la toxicité aluminique et apporte le calcium essentiel pour la structure cellulaire.'
                        )}
                      </p>
                    </div>
                  )}

                  {/* Organic Matter Conditioning Card */}
                  <div className="space-y-3 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200">
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                      <span className="font-bold text-emerald-950 dark:text-emerald-100 text-sm flex items-center gap-1.5">
                        <Leaf className="h-4 w-4 text-emerald-600" />
                        {tr('Organic Conditioning:', 'التسميد العضوي المنظم:', 'Conditionnement organique :')}{' '}
                        {isAr ? amendmentPrescription.org.name_ar : isFr ? amendmentPrescription.org.name_fr : amendmentPrescription.org.name}
                      </span>
                      <span className="font-black text-sm font-mono text-emerald-700 dark:text-emerald-300">
                        {amendmentPrescription.org.recommendedRateTonnesHa} t/ha
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-muted-foreground">{tr('Field Requirement:', 'الكمية الكلية للمزرعة:', 'Besoin total parcelle :')}</span>
                        <p className="font-bold text-sm text-foreground">{amendmentPrescription.organicTonnesField} {tr('Tonnes', 'طن', 'Tonnes')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{tr('C:N Ratio & OM %:', 'نسبة الكربون للنيتروجين C:N:', 'Rapport C/N & % MO :')}</span>
                        <p className="font-semibold text-foreground">{amendmentPrescription.org.cnRatio} ({amendmentPrescription.org.organicMatterContentPct}% OM)</p>
                      </div>
                    </div>

                    <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed border-t border-emerald-200 pt-2">
                      <strong>{tr('Why it matters:', 'الأهمية الحقلية:', 'Intérêt agronomique :')}</strong>{' '}
                      {isAr ? amendmentPrescription.org.keyBenefits_ar : isFr ? amendmentPrescription.org.keyBenefits_fr : amendmentPrescription.org.keyBenefits}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 4: FERTILIZER PHYSIOLOGICAL REACTION & CHELATE OPTIMIZER */}
        <TabsContent value="fertilizers" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Fertilizer Physiological Reaction Table */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="border shadow-sm">
                <CardHeader className="pb-3 border-b bg-card">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Tractor className="h-5 w-5 text-blue-600" />
                    {tr('Fertilizer Physiological Impact on Soil pH', 'التأثير الفسيولوجي للأسمدة على حموضة التربة', 'Impact physiologique des engrais sur le pH')}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {tr(
                      'Shows whether fertilizer biological reaction acidifies, neutralizes, or alkalizes the root rhizosphere.',
                      'يوضح ما إذا كان التفاعل الحيوي للسماد يحمض أو يرفع قلوية المحيط الجذري.',
                      'Indique si l’engrais acidifie, neutralise ou alcalinise la rhizosphère.'
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  {FERTILIZER_REACTIONS_DATA.map((fert) => {
                    const isAcid = fert.caco3EquivalentPer100kg < 0;
                    const isNeutral = fert.caco3EquivalentPer100kg === 0;

                    return (
                      <div
                        key={fert.id}
                        className="p-3 rounded-xl border bg-card/60 hover:bg-muted/40 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-xs text-foreground">
                              {isAr ? fert.name_ar : isFr ? fert.name_fr : fert.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono ml-2">
                              {fert.formula} · ({fert.npk})
                            </span>
                          </div>

                          <Badge
                            className={
                              isAcid
                                ? 'bg-orange-600 text-white font-mono text-[10px]'
                                : isNeutral
                                ? 'bg-slate-600 text-white font-mono text-[10px]'
                                : 'bg-blue-600 text-white font-mono text-[10px]'
                            }
                          >
                            {fert.caco3EquivalentPer100kg < 0
                              ? `${fert.caco3EquivalentPer100kg} kg CaCO₃/100kg (Acidifying)`
                              : fert.caco3EquivalentPer100kg === 0
                              ? 'Neutral'
                              : `+${fert.caco3EquivalentPer100kg} kg CaCO₃/100kg (Basic)`}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {isAr ? fert.recommendationForAlkalineSoil_ar : isFr ? fert.recommendationForAlkalineSoil_fr : fert.recommendationForAlkalineSoil}
                        </p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Right 5 Cols: Chelated Iron & Micronutrient Guide */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="border shadow-sm sticky top-4">
                <CardHeader className="pb-3 border-b bg-muted/40">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-emerald-600" />
                    {tr('Chelated Iron (Fe) Selector by Soil pH', 'دليل اختيار شيلات الحديد حسب درجة pH التربة', 'Guide des chélates de fer selon le pH')}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {tr(
                      'Matching chelate stability constant with soil and water pH avoids premature iron degradation.',
                      'اختيار نوع الشيلات المناسب يحمي الحديد من التثبيت والترسب في التربة الكلسية.',
                      'Le choix du chélate adapté empêche la précipitation du fer en sol calcaire.'
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 space-y-3.5 text-xs">
                  {/* Fe-EDTA */}
                  <div className="p-3 rounded-xl border bg-card space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">Fe-EDTA 13%</span>
                      <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">
                        {tr('Stable only at pH < 6.5', 'ثابت فقط دون pH 6.5', 'Stable sous pH 6.5')}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      {tr(
                        'Degrades rapidly above pH 6.5 as Calcium displaces Iron, precipitating Fe(OH)₃. Strictly for foliar spray or acidic hydroponics.',
                        'يفقد فعاليته فوق pH 6.5 حيث يحل الكالسيوم محل الحديد ليترسب. مخصص فقط للرش الورقي أو المحاليل الحامضية.',
                        'Inopérant au-dessus de 6.5. Réservé aux pulvérisations foliaires et hydroponie acide.'
                      )}
                    </p>
                  </div>

                  {/* Fe-DTPA */}
                  <div className="p-3 rounded-xl border bg-card space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">Fe-DTPA 6% - 7%</span>
                      <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                        {tr('Stable up to pH 7.5', 'ثابت حتى pH 7.5', 'Stable jusqu’à pH 7.5')}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      {tr(
                        'Excellent for soilless cultures and neutral soils. Moderate resistance to limestone.',
                        'ممتاز للزراعات المائية والأراضي المتعادلة؛ مقاومة متوسطة للكلس.',
                        'Idéal en hors-sol et sols neutres; résistance moyenne au calcaire.'
                      )}
                    </p>
                  </div>

                  {/* Fe-EDDHA */}
                  <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 dark:text-emerald-200">
                        Fe-EDDHA 6% (Ortho-Ortho ≥ 4.8%)
                      </span>
                      <Badge className="text-[10px] bg-emerald-600 text-white font-bold">
                        {tr('Gold Standard: Stable up to pH 9.5', 'المعيار الذهبي: ثابت حتى pH 9.5', 'Standard d’or : Stable jusqu’à pH 9.5')}
                      </Badge>
                    </div>
                    <p className="text-foreground text-[11px] leading-relaxed">
                      {tr(
                        'THE ONLY RELIABLE SOIL-APPLIED CHELATE for Mediterranean calcareous soils (pH 7.5-8.8). The ortho-ortho isomer holds iron tenaciously against free calcium.',
                        'الخيار الوحيد الموثوق في الأراضي الكلسية والقلوية بالمتوسط. جزيء الأورثو-أورثو يمنع الكالسيوم من إزاحة الحديد.',
                        'LE SEUL CHÉLATE EFFICACE au sol en milieu calcaire méditerranéen (pH 7.5-8.8).'
                      )}
                    </p>
                  </div>

                  {/* Fe-HBED */}
                  <div className="p-3 rounded-xl border bg-card space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">Fe-HBED 6%</span>
                      <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
                        {tr('Ultra-Stable: Up to pH 10.0', 'ثبات فائق حتى pH 10.0', 'Ultra-stable jusqu’à pH 10.0')}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      {tr(
                        'Highest affinity constant for iron with lowest copper displacement. Outstanding longevity in alkaline soils.',
                        'أعلى ثبات كيميائي وأطول فترة بقاء في الأراضي شديدة القلوية دون ترسيب.',
                        'Plus forte constante d’affinité; exceptionnelle rémanence en sol très alcalin.'
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </CalculatorShell>
  );
}
