'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  SprayCan,
  Package,
  Timer,
  Droplets,
  CheckCircle2,
  AlertCircle,
  Calculator,
  ArrowRight,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Send,
  Copy,
  Check,
  XCircle,
  FlaskConical,
  Flame,
  Search,
  Zap,
  Fuel,
  Sparkles,
  Layers,
  HelpCircle,
  Activity,
} from 'lucide-react';
import { useTranslation, copyFor } from '@/lib/language-store';

interface FarmerCalculatorsProps {
  defaultAreaHa?: number;
  cropName?: string;
  sunMode?: boolean;
}

interface ChemicalProduct {
  id: string;
  nameEn: string;
  nameFr: string;
  nameAr: string;
  category: 'copper' | 'calcium' | 'sulfate' | 'phosphate' | 'amino_acid' | 'sulfur' | 'oil' | 'fungicide' | 'insecticide' | 'npk' | 'micronutrient' | 'acid';
}

const CHEMICAL_PRODUCTS: ChemicalProduct[] = [
  { id: 'copper_hydroxide', nameEn: 'Copper Hydroxide / Bouillie Bordelaise', nameFr: 'Hydroxyde de Cuivre / Bouillie Bordelaise', nameAr: 'هيدروكسيد النحاس / بوردو', category: 'copper' },
  { id: 'calcium_nitrate', nameEn: 'Calcium Nitrate (Ca(NO₃)₂)', nameFr: 'Nitrate de Chaux (Ca(NO₃)₂)', nameAr: 'نترات الكالسيوم', category: 'calcium' },
  { id: 'potassium_sulfate', nameEn: 'Potassium Sulfate (SOP 0-0-50)', nameFr: 'Sulfate de Potasse (SOP)', nameAr: 'سلفات البوتاسيوم', category: 'sulfate' },
  { id: 'map_phosphate', nameEn: 'Monoammonium Phosphate (MAP 12-61-0)', nameFr: 'Phosphate Monoammonique (MAP)', nameAr: 'فوسفات أحادي الأمونيوم (MAP)', category: 'phosphate' },
  { id: 'amino_acids', nameEn: 'Amino Acids & Biostimulants', nameFr: 'Acides Aminés & Biostimulants', nameAr: 'أحماض أمينية ومحفزات حيوية', category: 'amino_acid' },
  { id: 'micronized_sulfur', nameEn: 'Micronized Wettable Sulfur 80%', nameFr: 'Soufre Mouillable 80%', nameAr: 'كبريت ميكروني قابل للبلل 80%', category: 'sulfur' },
  { id: 'mineral_oil', nameEn: 'Mineral Summer/Winter Spray Oil', nameFr: 'Huile Minérale de Traitement', nameAr: 'الزيت المعدني الشتوي/الصيفي', category: 'oil' },
  { id: 'mancozeb', nameEn: 'Mancozeb 80% Contact Fungicide', nameFr: 'Mancozèbe 80% Fongicide', nameAr: 'مانكوزيب 80% مبيد فطري وقائي', category: 'fungicide' },
  { id: 'abamectin', nameEn: 'Abamectin 1.8% / Emamectin', nameFr: 'Abamectine 1.8% / Emamectine', nameAr: 'أبامكتين 1.8% / إيمامكتين', category: 'insecticide' },
  { id: 'npk_soluble', nameEn: 'Soluble NPK 20-20-20 + TE', nameFr: 'NPK Soluble 20-20-20 + OE', nameAr: 'سماد NPK متوازن 20-20-20 ذائب', category: 'npk' },
  { id: 'zinc_manganese', nameEn: 'Zinc & Manganese Chelate / Foliar', nameFr: 'Zinc & Manganèse Chélaté', nameAr: 'شيلات الزنك والمنغنيز الورقي', category: 'micronutrient' },
  { id: 'phosphoric_acid', nameEn: 'Phosphoric Acid 85%', nameFr: 'Acide Phosphorique 85%', nameAr: 'حمض الفوسفوريك 85%', category: 'acid' },
];

/** Algerian INPV Homologated Phytosanitary Registry Sample */
interface InpvProduct {
  tradeName: string;
  activeMatter: string;
  type: 'fungicide' | 'insecticide' | 'acaricide';
  darDays: number;
  dosePerHa: string;
  targetPest: { en: string; fr: string; ar: string };
  targetCrops: string;
  inpvCode: string;
}

const INPV_REGISTRY: InpvProduct[] = [
  {
    tradeName: 'Dithane / Mancozèbe 80 WP',
    activeMatter: 'Mancozèbe 80%',
    type: 'fungicide',
    darDays: 7,
    dosePerHa: '2.5 kg/ha',
    targetPest: { en: 'Late Blight (Mildiou), Alternaria', fr: 'Mildiou, Alternariose', ar: 'الميلديو، اللفحة المبكرة (ألترناريا)' },
    targetCrops: 'Pomme de terre, Tomate, Vigne',
    inpvCode: 'INPV-F-0842',
  },
  {
    tradeName: 'Ridomil Gold MZ 68 WG',
    activeMatter: 'Méfénoxam 4% + Mancozèbe 64%',
    type: 'fungicide',
    darDays: 7,
    dosePerHa: '2.5 kg/ha',
    targetPest: { en: 'Late Blight (Systemic + Contact)', fr: 'Mildiou (Systémique + Contact)', ar: 'الميلديو الجهازي والوقائي' },
    targetCrops: 'Pomme de terre, Tomate, Oignon',
    inpvCode: 'INPV-F-1102',
  },
  {
    tradeName: 'Score 250 EC',
    activeMatter: 'Difénoconazole 250 g/L',
    type: 'fungicide',
    darDays: 14,
    dosePerHa: '0.35 L/ha',
    targetPest: { en: 'Early Blight, Powdery Mildew, Scab', fr: 'Alternariose, Oïdium, Tavelure', ar: 'الألترناريا، البياض الدقيقي، التبقع' },
    targetCrops: 'Arboriculture, Maraîchage',
    inpvCode: 'INPV-F-0789',
  },
  {
    tradeName: 'Flint 50 WG',
    activeMatter: 'Trifloxystrobine 50%',
    type: 'fungicide',
    darDays: 14,
    dosePerHa: '0.15 kg/ha',
    targetPest: { en: 'Powdery Mildew (Oïdium), Rust', fr: 'Oïdium, Rouille, Tavelure', ar: 'البياض الدقيقي، الصدأ' },
    targetCrops: 'Arboriculture, Vigne, Maraîchage',
    inpvCode: 'INPV-F-0955',
  },
  {
    tradeName: 'Acrobat MZ',
    activeMatter: 'Diméthomorphe 9% + Mancozèbe 60%',
    type: 'fungicide',
    darDays: 7,
    dosePerHa: '2.0 kg/ha',
    targetPest: { en: 'Late Blight (Anti-sporulant)', fr: 'Mildiou (Anti-sporulant)', ar: 'الميلديو المانع للأبواغ' },
    targetCrops: 'Pomme de terre, Tomate',
    inpvCode: 'INPV-F-0644',
  },
  {
    tradeName: 'Coragen 20 SC',
    activeMatter: 'Chlorantraniliprole 200 g/L',
    type: 'insecticide',
    darDays: 3,
    dosePerHa: '125 mL/ha',
    targetPest: { en: 'Tuta absoluta, Heliothis, Caterpillars', fr: 'Tuta absoluta, Noctuelles, Chenilles', ar: 'توتا أبسوليوتا، دودة الثمار، الديدان القارضة' },
    targetCrops: 'Tomate, Poivron, Pomme de terre, Arboriculture',
    inpvCode: 'INPV-I-1430',
  },
  {
    tradeName: 'Vertimec 018 EC',
    activeMatter: 'Abamectine 18 g/L',
    type: 'acaricide',
    darDays: 3,
    dosePerHa: '0.75 L/ha',
    targetPest: { en: 'Red Spider Mites, Leafminers (Liriomyza)', fr: 'Acariens rouges, Mineuses', ar: 'العنكبوت الأحمر، صانعات الأنفاق' },
    targetCrops: 'Agrumes, Maraîchage, Fraise',
    inpvCode: 'INPV-A-0520',
  },
  {
    tradeName: 'Karate Zeon 050 CS',
    activeMatter: 'Lambda-cyhalothrine 50 g/L',
    type: 'insecticide',
    darDays: 7,
    dosePerHa: '150 mL/ha',
    targetPest: { en: 'Aphids, Whiteflies, Thrips', fr: 'Pucerons, Aleurodes, Thrips', ar: 'المن، الذبابة البيضاء، التريبس' },
    targetCrops: 'Céréales, Maraîchage, Arboriculture',
    inpvCode: 'INPV-I-0810',
  },
];

export function FarmerCalculators({ defaultAreaHa = 1, cropName = 'Potato', sunMode = false }: FarmerCalculatorsProps) {
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  // -------------------------------------------------------------
  // 1. Backpack Sprayer Dosage Calculator
  // -------------------------------------------------------------
  const [sprayAreaHa, setSprayAreaHa] = useState<number>(defaultAreaHa || 0.5);
  const [productDosePerHa, setProductDosePerHa] = useState<number>(1.5);
  const [tankSizeL, setTankSizeL] = useState<number>(16);
  const [waterRateLHa, setWaterRateLHa] = useState<number>(300);
  const [isLiquid, setIsLiquid] = useState<boolean>(true);

  const totalWaterNeededL = Math.max(1, sprayAreaHa * waterRateLHa);
  const totalTanks = Math.ceil(totalWaterNeededL / tankSizeL);
  const totalProductAmount = sprayAreaHa * productDosePerHa;
  const productPerTank = totalTanks > 0 ? totalProductAmount / totalTanks : 0;
  const productPerTankMl = productPerTank * 1000;
  const bottleCaps = Math.round((productPerTankMl / 15) * 10) / 10;

  // -------------------------------------------------------------
  // 2. DAR & INPV Safety Lookup & Dispatch
  // -------------------------------------------------------------
  const [inpvSearch, setInpvSearch] = useState<string>('');
  const [selectedInpvProduct, setSelectedInpvProduct] = useState<InpvProduct>(INPV_REGISTRY[0]);
  const [customDarDays, setCustomDarDays] = useState<number>(7);
  const [sprayDate, setSprayDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [copiedDispatch, setCopiedDispatch] = useState<boolean>(false);

  const filteredInpv = useMemo(() => {
    if (!inpvSearch.trim()) return INPV_REGISTRY;
    const q = inpvSearch.toLowerCase();
    return INPV_REGISTRY.filter(
      (p) =>
        p.tradeName.toLowerCase().includes(q) ||
        p.activeMatter.toLowerCase().includes(q) ||
        p.targetPest.fr.toLowerCase().includes(q) ||
        p.targetPest.ar.includes(q) ||
        p.targetCrops.toLowerCase().includes(q)
    );
  }, [inpvSearch]);

  const handleSelectInpv = (p: InpvProduct) => {
    setSelectedInpvProduct(p);
    setCustomDarDays(p.darDays);
  };

  const safeHarvestDate = useMemo(() => {
    try {
      const d = new Date(sprayDate + 'T00:00:00');
      d.setDate(d.getDate() + Number(customDarDays));
      return d.toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '—';
    }
  }, [sprayDate, customDarDays, language]);

  const dispatchMessage =
    language === 'ar'
      ? `📋 *تعليمات الرش الحقلي وفترة الأمان - أطلس الفلاحة* 📋
🌾 المحصول: ${cropName} (${sprayAreaHa} هكتار)
🧪 المبيد المستعمل: ${selectedInpvProduct.tradeName} (${selectedInpvProduct.activeMatter})
🔖 رمز المطابقة INPV: ${selectedInpvProduct.inpvCode}
🧴 الجرعة لكل خزان ${tankSizeL} لتر: *${productPerTankMl.toFixed(0)} ${isLiquid ? 'مل' : 'غرام'}* (~${bottleCaps} أغطية قارورة)
🎒 عدد الخزانات الإجمالي: *${totalTanks} خزان*
💧 إجمالي الماء: ${totalWaterNeededL} لتر
---------------------------------
⛔ *فترة الأمان القانونية (DAR):* ${customDarDays} أيام
📅 تاريخ الرش: ${sprayDate}
✅ *أول تاريخ مسموح للجني والحصاد:* ${safeHarvestDate}
⚠️ ارتداء الكمامة والقفازات إلزامي أثناء الخلط والرش.`
      : `📋 *Fiche Traitement Phytosanitaire & Sécurité DAR - Formula Atlas* 📋
🌾 Culture: ${cropName} (${sprayAreaHa} ha)
🧪 Produit: ${selectedInpvProduct.tradeName} (${selectedInpvProduct.activeMatter})
🔖 Homologation INPV: ${selectedInpvProduct.inpvCode}
🧴 Dose par pulvérisateur de ${tankSizeL}L: *${productPerTankMl.toFixed(0)} ${isLiquid ? 'mL' : 'g'}* (~${bottleCaps} bouchons)
🎒 Nombre de dosées: *${totalTanks} dosées*
💧 Volume bouillie total: ${totalWaterNeededL} Litres
---------------------------------
⛔ *Délai d'Attente avant Récolte (DAR):* ${customDarDays} jours
📅 Date du traitement: ${sprayDate}
✅ *Date autorisée la plus précoce pour récolter:* ${safeHarvestDate}
⚠️ EPI obligatoire: Port de gants et masque lors de la préparation et de l'application.`;

  const handleShareDispatchWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(dispatchMessage)}`;
    window.open(url, '_blank');
  };

  const handleCopyDispatch = async () => {
    try {
      await navigator.clipboard.writeText(dispatchMessage);
      setCopiedDispatch(true);
      setTimeout(() => setCopiedDispatch(false), 2000);
    } catch {
      // ignore
    }
  };

  // -------------------------------------------------------------
  // 3. Tank Mix 2-Second Chemical Compatibility Engine
  // -------------------------------------------------------------
  const [productAId, setProductAId] = useState<string>('copper_hydroxide');
  const [productBId, setProductBId] = useState<string>('amino_acids');

  const prodA = CHEMICAL_PRODUCTS.find((p) => p.id === productAId) || CHEMICAL_PRODUCTS[0];
  const prodB = CHEMICAL_PRODUCTS.find((p) => p.id === productBId) || CHEMICAL_PRODUCTS[4];

  const getCompatibility = (catA: ChemicalProduct['category'], catB: ChemicalProduct['category']) => {
    if (catA === catB) {
      return {
        status: 'compatible' as const,
        titleEn: 'Compatible (Same Class / Redundant)',
        titleAr: 'متوافق (نفس الفئة / تجنب التكرار غير الضروري)',
        titleFr: 'Compatible (Même famille chimique)',
        descEn: 'Generally safe to combine, but verify that you are not overdosing active ingredient.',
        descAr: 'خلط آمن بشكل عام، ولكن تأكد من عدم مضاعفة الجرعة دون داعٍ.',
        descFr: 'Sans danger de précipitation mais évitez les surdosages inutiles.',
      };
    }

    const pair = [catA, catB].sort().join('+');

    if (pair === 'amino_acid+copper') {
      return {
        status: 'forbidden' as const,
        titleEn: 'STRICTLY INCOMPATIBLE (Severe Phytotoxicity)',
        titleAr: 'ممنوع تماماً (حروق كيميائية شديدة للأوراق)',
        titleFr: 'STRICTEMENT INCOMPATIBLE (Phytotoxicité sévère)',
        descEn: 'Amino acids chelate copper ions rapidly, leading to uncontrollable systemic absorption and intense burning of plant tissue.',
        descAr: 'الأحماض الأمينية تشلب النحاس وتجعله سريع النفاذ لخلايا الورقة مما يسبب حروقاً وتشوهات شديدة للنبات.',
        descFr: 'Les acides aminés complexent le cuivre et provoquent une absorption massive hautement phytotoxique.',
      };
    }

    if (pair === 'oil+sulfur') {
      return {
        status: 'forbidden' as const,
        titleEn: 'STRICTLY INCOMPATIBLE (Lethal Foliar Scorch)',
        titleAr: 'ممنوع تماماً (حرق شديد وسقوط الأوراق)',
        titleFr: 'STRICTEMENT INCOMPATIBLE (Brûlure foliaire foudroyante)',
        descEn: 'Mineral oils strip the leaf cuticle, allowing sulfur to enter mesophyll cells and cause total leaf defoliation. Maintain at least 21 days between treatments.',
        descAr: 'الزيت المعدني يذيب الطبقة الشمعية للورقة مما يجعل الكبريت يحرق النسيج الداخلي ويسقط الأوراق. اترك 21 يوماً على الأقل بين الرشتين.',
        descFr: 'L’huile dissout la cuticule et le soufre brûle le parenchyme. Respectez un délai d’au moins 21 jours entre les deux.',
      };
    }

    if (pair === 'calcium+sulfate') {
      return {
        status: 'forbidden' as const,
        titleEn: 'STRICTLY INCOMPATIBLE (Gypsum CaSO₄ Precipitation)',
        titleAr: 'ممنوع تماماً (ترسب الجبس CaSO₄ وانسداد الفلاتر)',
        titleFr: 'STRICTEMENT INCOMPATIBLE (Précipité de Gypse CaSO₄)',
        descEn: 'Calcium and sulfate react immediately to form insoluble calcium sulfate (gypsum crystals), clogging sprayer nozzles and drip emitters.',
        descAr: 'يتفاعل الكالسيوم مع الكبريتات فوراً مكوناً بلورات الجبس غير الذائبة التي تسد الفلاتر ونقاطات الري نهائياً.',
        descFr: 'Réaction immédiate formant du sulfate de calcium (gypse insoluble) bouchant irrémédiablement filtres et buses.',
      };
    }

    if (pair === 'calcium+phosphate') {
      return {
        status: 'forbidden' as const,
        titleEn: 'STRICTLY INCOMPATIBLE (Calcium Phosphate Precipitation)',
        titleAr: 'ممنوع تماماً (ترسب فوسفات الكالسيوم CaHPO₄)',
        titleFr: 'STRICTEMENT INCOMPATIBLE (Précipité de Phosphate de Calcium)',
        descEn: 'Calcium reacts with orthophosphates to precipitate insoluble dicalcium phosphate (CaHPO₄), rendering both elements unavailable.',
        descAr: 'يتحد الكالسيوم مع الفوسفات ليرسب فوسفات ثنائي الكالسيوم غير الذائب مما يفقد النبات كلا العنصرين.',
        descFr: 'Précipitation insoluble de phosphate bicalcique rendant le calcium et le phosphore indisponibles.',
      };
    }

    if (pair === 'acid+micronutrient' || pair === 'copper+micronutrient') {
      return {
        status: 'caution' as const,
        titleEn: 'CAUTION (Check pH & Jar Test)',
        titleAr: 'حذر (افحص درجة الحموضة واعمل اختبار كاس مسبق)',
        titleFr: 'ATTENTION (Vérifier le pH & Faire un test en bocal)',
        descEn: 'High acidity or heavy metal competition may reduce chelate stability. Perform a small 1L jar test before tank mixing.',
        descAr: 'الحموضة العالية أو تنافس المعادن قد يكسر الروابط الشلبية. قم بعمل تجربة مصغرة في كأس ماء قبل تعبئة الخزان.',
        descFr: 'L’acidité excessive peut déstabiliser les chélates. Faites un test préalable dans 1L d’eau.',
      };
    }

    return {
      status: 'compatible' as const,
      titleEn: 'COMPATIBLE (Standard Mix)',
      titleAr: 'متوافق (خلط مسموح به)',
      titleFr: 'COMPATIBLE (Mélange autorisé)',
      descEn: 'No known chemical antagonism. Always maintain continuous tank agitation and spray within 2 hours of preparation.',
      descAr: 'لا يوجد تعارض كيميائي معروف. حافظ على تحريك الخزان ورش المحلول في غضون ساعتين من الخلط.',
      descFr: 'Aucune incompatibilité connue. Maintenez l’agitation et appliquez dans les 2 heures.',
    };
  };

  const compatResult = getCompatibility(prodA.category, prodB.category);

  // -------------------------------------------------------------
  // 4. Fertilizer 50kg Bag Counter & Calcareous Soil Guard
  // -------------------------------------------------------------
  const [fertAreaHa, setFertAreaHa] = useState<number>(defaultAreaHa || 1);
  const [selectedProgram, setSelectedProgram] = useState<
    'potato_basal' | 'potato_cover' | 'cereal_tillering' | 'tomato_fert' | 'citrus_spring' | 'olive_annual' | 'date_palm_biskra' | 'custom'
  >('potato_basal');

  // Custom NPK Target Inputs
  const [customTargetN, setCustomTargetN] = useState<number>(80);
  const [customTargetP, setCustomTargetP] = useState<number>(100);
  const [customTargetK, setCustomTargetK] = useState<number>(120);

  // Calcareous Soil Toggle
  const [isCalcareousSoil, setIsCalcareousSoil] = useState<boolean>(true); // >7.8 pH standard in Algeria

  const FERT_PROGRAMS = {
    potato_basal: {
      nameEn: 'Potato (Basal / Fond at planting)',
      nameFr: 'Pomme de terre (Fond / Plantation)',
      nameAr: 'بطاطا (تسميد الأساس / عند الغرس)',
      dapBagsPerHa: 4, // 200 kg DAP
      potassiumBagsPerHa: 4, // 200 kg Sulfate de potasse
      ureaBagsPerHa: 2, // 100 kg Urea
      npk15BagsPerHa: 0,
      calciumNitrateBagsPerHa: 0,
      adviceEn: 'Bury fertilizer 5 cm below seed tubers to avoid root burning.',
      adviceFr: 'Enfouir à 5 cm sous les tubercules pour éviter les brûlures.',
      adviceAr: 'ادفن السماد على عمق 5 سم تحت الدرنات لتجنب حرق الجذور.',
    },
    potato_cover: {
      nameEn: 'Potato (Cover / Ridging / Buttage)',
      nameFr: 'Pomme de terre (Couverture / Buttage)',
      nameAr: 'بطاطا (تسميد التغطية / التحضين)',
      dapBagsPerHa: 0,
      potassiumBagsPerHa: 3,
      ureaBagsPerHa: 3,
      npk15BagsPerHa: 0,
      calciumNitrateBagsPerHa: 2,
      adviceEn: 'Apply before earthing up / ridging, followed immediately by irrigation.',
      adviceFr: 'Appliquer avant le buttage, suivi immédiatement d’une irrigation.',
      adviceAr: 'انثر السماد قبل عملية التحضين، واسقِ مباشرة بعدها.',
    },
    cereal_tillering: {
      nameEn: 'Wheat & Barley (Tillering top-dressing)',
      nameFr: 'Céréales Blé / Orge (Tallage)',
      nameAr: 'حبوب قمح / شعير (مرحلة التفريع)',
      dapBagsPerHa: 0,
      potassiumBagsPerHa: 0,
      ureaBagsPerHa: 2.5,
      npk15BagsPerHa: 0,
      calciumNitrateBagsPerHa: 0,
      adviceEn: 'Apply Urea just before a light rain (5–15 mm) for maximum uptake.',
      adviceFr: 'Appliquer l’Urée juste avant une pluie modérée (5–15 mm).',
      adviceAr: 'انثر اليوريا قبل هطول أمطار خفيفة (5-15 ملم) لضمان الامتصاص السريع.',
    },
    tomato_fert: {
      nameEn: 'Open-field Tomato / Pepper (Active Growth)',
      nameFr: 'Tomate / Poivron plein champ (Croissance)',
      nameAr: 'طماطم / فلفل حقلي (مرحلة النمو النشط)',
      dapBagsPerHa: 2,
      potassiumBagsPerHa: 3,
      ureaBagsPerHa: 2,
      npk15BagsPerHa: 0,
      calciumNitrateBagsPerHa: 2,
      adviceEn: 'Split into small weekly doses via drip (fertigation) if possible.',
      adviceFr: 'Fractionner en petits apports hebdomadaires par goutte-à-goutte.',
      adviceAr: 'قسّم الجرعات أسبوعياً عبر شبكة التسميد بالري إن أمكن.',
    },
    citrus_spring: {
      nameEn: 'Citrus & Fruit Trees (Spring restart)',
      nameFr: 'Agrumes & Arboriculture (Débourrement)',
      nameAr: 'حمضيات وأشجار مثمرة (استئناف الربيع)',
      dapBagsPerHa: 3,
      potassiumBagsPerHa: 3,
      ureaBagsPerHa: 3,
      npk15BagsPerHa: 0,
      calciumNitrateBagsPerHa: 2,
      adviceEn: 'Spread under the canopy drip line, away from trunk.',
      adviceFr: 'Épandre sous la projection de la frondaison, à distance du tronc.',
      adviceAr: 'انثر السماد تحت مسقط المجموع الخضري بعيداً عن الجذع.',
    },
    olive_annual: {
      nameEn: 'Olive Grove (Annual maintenance)',
      nameFr: 'Oliveraie (Entretien annuel)',
      nameAr: 'أشجار الزيتون (الصيانة السنوية)',
      dapBagsPerHa: 2,
      potassiumBagsPerHa: 2,
      ureaBagsPerHa: 2,
      npk15BagsPerHa: 0,
      calciumNitrateBagsPerHa: 0,
      adviceEn: 'Apply in winter / early spring before flowering onset.',
      adviceFr: 'Appliquer en fin d’hiver / début printemps avant la floraison.',
      adviceAr: 'انثر السماد في نهاية الشتاء / بداية الربيع قبل انطلاق التزهير.',
    },
    date_palm_biskra: {
      nameEn: 'Date Palm (Oasis Biskra / El Oued)',
      nameFr: 'Palmier Dattier (Oasis Biskra / Oued Souf)',
      nameAr: 'النخيل ودقلة نور (واحات بسكرة والوادي)',
      dapBagsPerHa: 3,
      potassiumBagsPerHa: 5,
      ureaBagsPerHa: 4,
      npk15BagsPerHa: 0,
      calciumNitrateBagsPerHa: 0,
      adviceEn: 'High potassium requirement for Deglet Nour fruit filling. Split in March, May, and July.',
      adviceFr: 'Besoins élevés en Potasse pour le remplissage des dattes. Fractionner en mars, mai et juillet.',
      adviceAr: 'احتياج عالي للبوتاسيوم لتحجيم تمور دقلة نور. يقسم التسميد على 3 دفعات (مارس، ماي، جويلية).',
    },
    custom: {
      nameEn: 'Custom NPK Dosage (Dose personnalisée)',
      nameFr: 'Dose personnalisée sur mesure',
      nameAr: 'جرعة مخصصة حسب الطلب',
      dapBagsPerHa: 0,
      potassiumBagsPerHa: 0,
      ureaBagsPerHa: 0,
      npk15BagsPerHa: 0,
      calciumNitrateBagsPerHa: 0,
      adviceEn: 'Tailored 50kg bag breakdown calculated from your exact target pure units.',
      adviceFr: 'Calcul personnalisé en sacs de 50 kg selon vos unités pures souhaitées.',
      adviceAr: 'حساب مخصص بعدد الأكياس 50 كغ وفق احتياجاتك المحددة من الوحدات الصافية.',
    },
  };

  const currentProgram = FERT_PROGRAMS[selectedProgram];

  // Bag counts calculation
  let dapTotalBags = 0;
  let potassiumTotalBags = 0;
  let ureaTotalBags = 0;
  let calciumNitrateTotalBags = 0;

  if (selectedProgram === 'custom') {
    // DAP 18-46: 1 bag (50kg) gives 23 kg P2O5 and 9 kg N
    dapTotalBags = customTargetP > 0 ? Math.ceil((customTargetP * fertAreaHa) / 23) : 0;
    const nSuppliedByDap = (dapTotalBags * 9) / fertAreaHa;
    const remainingN = Math.max(0, customTargetN - nSuppliedByDap);
    // Urea 46%: 1 bag (50kg) gives 23 kg N
    ureaTotalBags = remainingN > 0 ? Math.ceil((remainingN * fertAreaHa) / 23) : 0;
    // SOP 50%: 1 bag (50kg) gives 25 kg K2O
    potassiumTotalBags = customTargetK > 0 ? Math.ceil((customTargetK * fertAreaHa) / 25) : 0;
  } else {
    dapTotalBags = Math.round(currentProgram.dapBagsPerHa * fertAreaHa * 10) / 10;
    potassiumTotalBags = Math.round(currentProgram.potassiumBagsPerHa * fertAreaHa * 10) / 10;
    ureaTotalBags = Math.round(currentProgram.ureaBagsPerHa * fertAreaHa * 10) / 10;
    calciumNitrateTotalBags = Math.round(currentProgram.calciumNitrateBagsPerHa * fertAreaHa * 10) / 10;
  }

  // -------------------------------------------------------------
  // 5. Drip Valve Run-Time + Salinity Leaching + Sirocco Shield
  // -------------------------------------------------------------
  const [dripAreaM2, setDripAreaM2] = useState<number>(5000); // 5000 m² (0.5 ha)
  const [rowSpacingM, setRowSpacingM] = useState<number>(0.8);
  const [dripperSpacingM, setDripperSpacingM] = useState<number>(0.4);
  const [dripperFlowLh, setDripperFlowLh] = useState<number>(2.0);
  const [baseWaterMm, setBaseWaterMm] = useState<number>(4.0);

  // Advanced Algerian Agro-Conditions
  const [waterSalinityEcW, setWaterSalinityEcW] = useState<number>(1.8); // dS/m (Borehole water)
  const [isSiroccoActive, setIsSiroccoActive] = useState<boolean>(false); // Chehili hot wind
  const [energySource, setEnergySource] = useState<'diesel' | 'sonelgaz'>('diesel');
  const [pumpHp, setPumpHp] = useState<number>(10); // 10 HP pump

  // Crop salinity threshold (ECe)
  const cropEcThreshold = cropName.toLowerCase().includes('potato')
    ? 1.7
    : cropName.toLowerCase().includes('tomat')
    ? 2.5
    : cropName.toLowerCase().includes('date') || cropName.toLowerCase().includes('palm')
    ? 4.0
    : cropName.toLowerCase().includes('wheat')
    ? 6.0
    : 2.0;

  // FAO Leaching Fraction: LF = ECw / (5*ECe - ECw)
  const leachingFraction = useMemo(() => {
    if (waterSalinityEcW <= 1.0) return 0;
    const denom = 5 * cropEcThreshold - waterSalinityEcW;
    if (denom <= 0) return 0.35;
    const lf = waterSalinityEcW / denom;
    return Math.min(0.4, Math.max(0, lf));
  }, [waterSalinityEcW, cropEcThreshold]);

  // Sirocco boost factor (+30% pre-heatwave pulse)
  const siroccoBoost = isSiroccoActive ? 1.3 : 1.0;

  // Effective target water depth in mm
  const effectiveWaterMm = (baseWaterMm / (1 - leachingFraction)) * siroccoBoost;

  const dripperCount = Math.max(1, Math.round(dripAreaM2 / (rowSpacingM * dripperSpacingM)));
  const totalWaterNeededLiters = dripAreaM2 * effectiveWaterMm;
  const totalWaterM3 = (totalWaterNeededLiters / 1000).toFixed(1);
  const systemFlowRateLh = dripperCount * dripperFlowLh;
  const runTimeHoursDecimal = systemFlowRateLh > 0 ? totalWaterNeededLiters / systemFlowRateLh : 0;
  const runHours = Math.floor(runTimeHoursDecimal);
  const runMinutes = Math.round((runTimeHoursDecimal - runHours) * 60);

  // Energy consumption & cost in Algerian Dinar
  // Diesel: ~0.25 L of mazout per HP per hour @ 29.00 DA/L
  // Sonelgaz: ~0.746 kWh per HP per hour @ 4.50 DA/kWh (Tarif 51 BT Agricole)
  const dieselConsumedL = runTimeHoursDecimal * pumpHp * 0.22;
  const dieselCostDzd = dieselConsumedL * 29.0;
  const electricityKwh = runTimeHoursDecimal * pumpHp * 0.746;
  const electricityCostDzd = electricityKwh * 4.5;
  const estimatedEnergyCostDzd = energySource === 'diesel' ? dieselCostDzd : electricityCostDzd;

  return (
    <Card className={`border ${sunMode ? 'border-foreground bg-background text-foreground' : 'border-border bg-card'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <Calculator className="h-5 w-5 text-emerald-600" />
          {tr('Practical Algerian Field Calculators & Safety Suite', 'حاسبات الحقل الجزائرية العملية وجناح السلامة', 'Calculateurs pratiques de terrain & Sécurité agricole')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {tr(
            'Zero technical jargon: get backpack tank doses, official INPV DAR safety lookups, 50kg bag fertilizer plans, and salinity-aware pump timers.',
            'بدون تعقيد: احسب جرعات المرشات بالغطاء، فحص فترات الأمان INPV، أكياس السماد 50 كغ، ومواقيت تشغيل المضخة مع مراعاة ملوحة المياه والشهيلي.',
            'Sans jargon: calculez le dosage pulvérisateur, vérifiez les DAR homologués INPV, comptez les sacs d\'engrais de 50 kg et le temps d’arrosage ajusté à la salinité.'
          )}
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sprayer" className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4">
            <TabsTrigger value="sprayer" className="text-xs gap-1.5 py-2">
              <SprayCan className="h-4 w-4" />
              <span className="truncate">{tr('Backpack Sprayer', 'بخاخ الظهر', 'Pulvérisateur')}</span>
            </TabsTrigger>
            <TabsTrigger value="tank_mixing" className="text-xs gap-1.5 py-2">
              <FlaskConical className="h-4 w-4 text-purple-600" />
              <span className="truncate">{tr('Mix & DAR Safety', 'الخلط وفترة الأمان', 'Mélange & DAR')}</span>
            </TabsTrigger>
            <TabsTrigger value="fertilizer" className="text-xs gap-1.5 py-2">
              <Package className="h-4 w-4 text-amber-600" />
              <span className="truncate">{tr('50kg Bags', 'أكياس 50 كغ', 'Sacs 50 kg')}</span>
            </TabsTrigger>
            <TabsTrigger value="irrigation" className="text-xs gap-1.5 py-2">
              <Timer className="h-4 w-4 text-cyan-600" />
              <span className="truncate">{tr('Valve & Salinity', 'السقي والملوحة', 'Arrosage & Salinité')}</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: BACKPACK SPRAYER */}
          <TabsContent value="sprayer" className="space-y-4">
            <div className="rounded-xl bg-emerald-50/70 p-3.5 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                {tr('Accurate Tank Dosing Guide', 'دليل دقيق لخلط خزان الرش', 'Guide de dosage pour pulvérisateur')}
              </div>
              <p className="text-xs text-muted-foreground">
                {tr(
                  'Avoid crop burning and wasted chemicals by calculating the exact bottle cap dose per backpack tank.',
                  'تجنب حرق النبات أو هدر المبيد بحساب الجرعة الدقيقة لكل خزان رش بالغطاء.',
                  'Évitez de brûler la culture ou de gaspiller le produit avec le bon dosage au bouchon par dosée.'
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{tr('Parcel Area to treat (Hectares)', 'مساحة القطعة المراد رشها (هكتار)', 'Surface de la parcelle (ha)')}</Label>
                <Input
                  type="number"
                  step="0.05"
                  min="0.01"
                  value={sprayAreaHa}
                  onChange={(e) => setSprayAreaHa(parseFloat(e.target.value) || 0.1)}
                  className="h-9 font-medium"
                />
                <div className="flex gap-1.5 pt-1">
                  {[0.1, 0.25, 0.5, 1.0].map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => setSprayAreaHa(area)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        sprayAreaHa === area
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-muted/40 border-border text-muted-foreground'
                      }`}
                    >
                      {area} ha ({area * 10000} m²)
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs">{tr('Recommended Product Dose per Ha', 'الجرعة الموصى بها للهكتار', 'Dose recommandée / ha')}</Label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setIsLiquid(true)}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${isLiquid ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}
                    >
                      {tr('Liquid (L)', 'سائل (لتر)', 'Liquide (L)')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLiquid(false)}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${!isLiquid ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}
                    >
                      {tr('Powder (kg)', 'بودرة (كغ)', 'Poudre (kg)')}
                    </button>
                  </div>
                </div>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={productDosePerHa}
                  onChange={(e) => setProductDosePerHa(parseFloat(e.target.value) || 0.1)}
                  className="h-9 font-medium"
                />
                <span className="text-[10px] text-muted-foreground">
                  {tr('Standard INPV dose from product label', 'الجرعة المسجلة على ملصق منتج INPV', 'Dose mentionnée sur l\'étiquette')}
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{tr('Backpack Tank Capacity (Liters)', 'سعة خزان البخاخ (لتر)', 'Capacité du pulvérisateur (Litres)')}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[16, 20, 12].map((size) => (
                    <Button
                      key={size}
                      type="button"
                      variant={tankSizeL === size ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTankSizeL(size)}
                      className="h-8 text-xs font-semibold"
                    >
                      {size} L
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{tr('Water volume per hectare (L/ha)', 'حجم الماء للهكتار (لتر/هكتار)', 'Bouillie par hectare (L/ha)')}</Label>
                <Input
                  type="number"
                  step="50"
                  min="100"
                  value={waterRateLHa}
                  onChange={(e) => setWaterRateLHa(parseInt(e.target.value, 10) || 300)}
                  className="h-9 font-medium"
                />
                <span className="text-[10px] text-muted-foreground">
                  {tr('Typical manual backpack: 250 - 400 L/ha', 'المعتاد بالبخاخ اليدوي: 250 - 400 لتر/هكتار', 'Moyenne au dos: 250 à 400 L/ha')}
                </span>
              </div>
            </div>

            {/* RESULTS BOX */}
            <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50/50 p-4 dark:bg-emerald-950/40 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800 pb-2">
                <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  {tr('Instructions for this treatment:', 'تعليمات تحضير الخلطة:', 'Instructions pour votre traitement :')}
                </span>
                <Badge className="bg-emerald-600 text-white font-mono text-xs">
                  {totalTanks} {tr('Full Tanks', 'خزانات ممتلئة', 'Dosées')}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-900">
                  <div className="text-[11px] text-muted-foreground font-medium">
                    {tr('Dose per each 1 backpack tank:', 'الجرعة في كل خزان بخاخ واحد:', 'Dose par pulvérisateur :')}
                  </div>
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {productPerTankMl.toFixed(0)} {isLiquid ? 'mL' : 'g'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <span>🧪 {tr('Or approx.', 'أي ما يعادل', 'Soit environ')}</span>
                    <strong className="text-foreground">
                      {bottleCaps} {tr('standard bottle caps (~15mL)', 'أغطية قارورة (~15 مل)', 'bouchons standards')}
                    </strong>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-900">
                  <div className="text-[11px] text-muted-foreground font-medium">
                    {tr('Total product for your field:', 'الكمية الإجمالية لقطعتك بالكامل:', 'Quantité totale de produit :')}
                  </div>
                  <div className="text-2xl font-bold text-foreground mt-0.5">
                    {isLiquid ? `${totalProductAmount.toFixed(2)} Liters` : `${totalProductAmount.toFixed(2)} kg`}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    💧 {tr('Total water:', 'إجمالي الماء:', 'Eau totale :')} <strong>{totalWaterNeededL} L</strong>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/40 p-2.5 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>
                  {tr(
                    'Safety tip: Fill tank halfway with clean water first, add product dose, stir well, then top up with water.',
                    'نصيحة أمان: املأ نصف الخزان بالماء النظيف أولاً، أضف جرعة المبيد وحرك جيداً، ثم أكمل تعبئة الخزان بالماء.',
                    'Conseil: Remplissez d’abord le réservoir à moitié avec de l’eau claire, ajoutez la dose, mélangez, puis complétez d’eau.'
                  )}
                </span>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: TANK MIXING TRAFFIC LIGHT & INPV DAR LOOKUP */}
          <TabsContent value="tank_mixing" className="space-y-4">
            {/* 2-SECOND CHEMICAL COMPATIBILITY CHECKER */}
            <div className="rounded-xl border-2 border-purple-500/80 bg-purple-50/50 dark:bg-purple-950/30 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-800 pb-2">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-bold text-purple-950 dark:text-purple-200">
                    {tr('2-Second Tank Mix Compatibility Traffic Light', 'إشارة المرور لفحص توافق خلط المبيدات والأسمدة', 'Feu tricolore de compatibilité des mélanges')}
                  </span>
                </div>
                <Badge className="bg-purple-700 text-white text-[10px]">
                  {tr('Instant Verification', 'فحص فوري', 'Vérification instantanée')}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">{tr('Select Product #1 in tank:', 'اختر المنتج الأول المراد خلطه:', 'Produit 1 :')}</Label>
                  <select
                    value={productAId}
                    onChange={(e) => setProductAId(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {CHEMICAL_PRODUCTS.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {language === 'ar' ? prod.nameAr : language === 'fr' ? prod.nameFr : prod.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">{tr('Select Product #2 to add:', 'اختر المنتج الثاني المضاف:', 'Produit 2 à ajouter :')}</Label>
                  <select
                    value={productBId}
                    onChange={(e) => setProductBId(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {CHEMICAL_PRODUCTS.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {language === 'ar' ? prod.nameAr : language === 'fr' ? prod.nameFr : prod.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Instant Compatibility Result Banner */}
              <div
                className={`p-3.5 rounded-xl border-2 flex items-start gap-3 ${
                  compatResult.status === 'compatible'
                    ? 'border-emerald-500 bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200'
                    : compatResult.status === 'caution'
                    ? 'border-amber-500 bg-amber-100/70 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200'
                    : 'border-rose-500 bg-rose-100/70 dark:bg-rose-950/60 text-rose-950 dark:text-rose-200'
                }`}
              >
                {compatResult.status === 'compatible' ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : compatResult.status === 'caution' ? (
                  <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-extrabold tracking-wide uppercase">
                    {language === 'ar' ? compatResult.titleAr : language === 'fr' ? compatResult.titleFr : compatResult.titleEn}
                  </div>
                  <p className="text-xs mt-1 leading-relaxed font-medium">
                    {language === 'ar' ? compatResult.descAr : language === 'fr' ? compatResult.descFr : compatResult.descEn}
                  </p>
                </div>
              </div>
            </div>

            {/* ALGERIAN INPV HOMOLOGATED SUBSTANCE LOOKUP & ACTIVE DAR TRACKER */}
            <div className="rounded-xl border-2 border-purple-500 bg-purple-50/40 dark:bg-purple-950/30 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-800 pb-2">
                <span className="text-xs font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-purple-600" />
                  {tr('Algerian INPV Homologated Products & DAR Safety', 'دليل المبيدات المعتمدة رسمياً في الجزائر وفترة الأمان', 'Index Phytosanitaire Homologué INPV Algérie & DAR')}
                </span>
                <Badge className="bg-purple-700 text-white font-mono text-xs">
                  {customDarDays} {tr('Days DAR', 'أيام أمان', 'Jours DAR')}
                </Badge>
              </div>

              {/* Quick Search in Algerian Registry */}
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={inpvSearch}
                    onChange={(e) => setInpvSearch(e.target.value)}
                    placeholder={tr('Search product, active ingredient, or pest (e.g. Mildiou, Mancozeb, Tuta)...', 'ابحث عن اسم المبيد، المادة الفعالة أو الآفة...', 'Rechercher un produit ou ravageur...')}
                    className="pl-8 h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pt-1">
                  {filteredInpv.map((p) => {
                    const isSelected = selectedInpvProduct.tradeName === p.tradeName;
                    return (
                      <div
                        key={p.tradeName}
                        onClick={() => handleSelectInpv(p)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'border-purple-600 bg-purple-100 dark:bg-purple-900/60 ring-2 ring-purple-400'
                            : 'border-border bg-card hover:bg-muted/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground truncate">{p.tradeName}</span>
                          <Badge variant="outline" className="text-[10px] font-mono shrink-0 ml-1">
                            {p.darDays}j DAR
                          </Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">{p.activeMatter}</div>
                        <div className="text-[10px] text-purple-700 dark:text-purple-300 font-medium mt-0.5 truncate">
                          🎯 {language === 'ar' ? p.targetPest.ar : language === 'fr' ? p.targetPest.fr : p.targetPest.en}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs">{tr('Selected Product', 'المبيد المختار', 'Produit sélectionné')}</Label>
                  <Input
                    type="text"
                    value={selectedInpvProduct.tradeName}
                    readOnly
                    className="h-9 text-xs font-semibold bg-muted"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">{tr('Spray Application Date', 'تاريخ إجراء الرش', 'Date du traitement')}</Label>
                  <Input
                    type="date"
                    value={sprayDate}
                    onChange={(e) => setSprayDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">{tr('Official DAR (Days)', 'فترة الأمان DAR (أيام)', 'DAR officiel (Jours)')}</Label>
                  <div className="flex gap-1.5">
                    {[3, 7, 14, 21].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setCustomDarDays(d)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded border ${
                          customDarDays === d ? 'bg-purple-600 text-white border-purple-600' : 'bg-muted/40 border-border text-muted-foreground'
                        }`}
                      >
                        {d}j
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Safe Date Result Banner */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-900 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-[11px] text-muted-foreground font-semibold">
                    {tr('Earliest Authorized Harvest Date:', 'أول تاريخ مسموح قانونياً لجني المحصول:', 'Date autorisée la plus précoce pour récolter :')}
                  </div>
                  <div className="text-lg font-black text-purple-700 dark:text-purple-300 mt-0.5">
                    {safeHarvestDate}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-mono mt-0.5">
                    🔖 {tr('INPV Registration Code:', 'رقم الاعتماد:', 'Homologation:')} {selectedInpvProduct.inpvCode}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleShareDispatchWhatsApp}
                    className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{tr('Send to WhatsApp', 'إرسال لواتساب', 'Envoyer WhatsApp')}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyDispatch}
                    className="h-8 px-2.5 text-xs gap-1"
                  >
                    {copiedDispatch ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedDispatch ? tr('Copied!', 'تم النسخ!', 'Copié !') : tr('Copy', 'نسخ', 'Copier')}</span>
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: 50KG FERTILIZER BAG COUNTER & CALCAREOUS SOIL GUARD */}
          <TabsContent value="fertilizer" className="space-y-4">
            <div className="rounded-xl bg-amber-50/70 p-3.5 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  <Package className="h-4 w-4 text-amber-600" />
                  {tr('Algerian Fertilizer Program in 50kg Bags', 'برنامج التسميد الجزائري بالأكياس 50 كغ', 'Programme d\'engrais en sacs de 50 kg')}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-amber-900 dark:text-amber-200">{tr('Calcareous Soil (pH > 7.8):', 'تربة كلسية قلوية:', 'Sol Calcaire :')}</span>
                  <button
                    type="button"
                    onClick={() => setIsCalcareousSoil((v) => !v)}
                    className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${
                      isCalcareousSoil ? 'bg-amber-600 text-white' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCalcareousSoil ? tr('Active (Alkaline)', 'مفعل (قلوية)', 'Actif') : tr('Neutral', 'معتدلة', 'Neutre')}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {tr(
                  'Convert pure N-P-K nutrient needs directly into exact 50kg bag counts of Urea 46%, DAP 18-46, and Potassium Sulfate SOP.',
                  'حول احتياجات المحصول مباشرة إلى عدد دقيق لأكياس 50 كغ من اليوريا 46%، DAP، وسلفات البوتاسيوم المتوفرة في السوق الجزائري.',
                  'Convertissez directement vos unités N-P-K en sacs de 50 kg d\'Urée 46%, DAP 18-46 et Sulfate de Potasse.'
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">{tr('Select Crop Program or Custom Targets', 'اختر برنامج المحصول أو حدد جرعات مخصصة', 'Programme de culture ou dosage sur mesure')}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {(Object.keys(FERT_PROGRAMS) as Array<keyof typeof FERT_PROGRAMS>).map((key) => {
                    const prog = FERT_PROGRAMS[key];
                    const active = selectedProgram === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedProgram(key)}
                        className={`text-left p-2 rounded-xl border text-xs font-medium transition-all ${
                          active
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 ring-2 ring-amber-400 font-bold'
                            : 'border-border bg-card hover:bg-muted/50 text-foreground'
                        }`}
                      >
                        <div className="truncate">{language === 'ar' ? prog.nameAr : language === 'fr' ? prog.nameFr : prog.nameEn}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedProgram === 'custom' && (
                <div className="sm:col-span-2 p-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 space-y-2">
                  <Label className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    {tr('Target Pure Units per Hectare (kg/ha):', 'الوحدات الصافية المستهدفة للهكتار (كغ/هكتار):', 'Unités pures cibles par hectare (kg/ha) :')}
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-muted-foreground">N (Azote)</span>
                      <Input
                        type="number"
                        min="0"
                        value={customTargetN}
                        onChange={(e) => setCustomTargetN(parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">P₂O₅ (Phosphore)</span>
                      <Input
                        type="number"
                        min="0"
                        value={customTargetP}
                        onChange={(e) => setCustomTargetP(parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">K₂O (Potasse)</span>
                      <Input
                        type="number"
                        min="0"
                        value={customTargetK}
                        onChange={(e) => setCustomTargetK(parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">{tr('Field Area (Hectares)', 'مساحة الحقل (هكتار)', 'Superficie de la parcelle (ha)')}</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={fertAreaHa}
                  onChange={(e) => setFertAreaHa(parseFloat(e.target.value) || 0.1)}
                  className="h-9 font-medium"
                />
              </div>

              <div className="space-y-1.5 flex items-end">
                <div className="flex gap-1.5 w-full">
                  {[0.5, 1, 2, 5].map((a) => (
                    <Button
                      key={a}
                      type="button"
                      variant={fertAreaHa === a ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFertAreaHa(a)}
                      className="flex-1 h-9 text-xs font-bold"
                    >
                      {a} ha
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* RESULTS 50KG BAGS */}
            <div className="rounded-xl border-2 border-amber-500 bg-amber-50/40 dark:bg-amber-950/30 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800 pb-2">
                <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                  {tr('Required Fertilizer Bags for', 'الأكياس المطلوبة لـ', 'Sacs nécessaires pour')} {fertAreaHa} ha:
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">50 kg {tr('per bag', 'لكل كيس', '/ sac')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* DAP 18-46 */}
                <div className={`p-3 rounded-lg border ${dapTotalBags > 0 ? 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-800' : 'bg-muted/30 border-dashed border-border opacity-60'}`}>
                  <div className="text-xs font-bold text-amber-800 dark:text-amber-400">DAP 18-46-0 (Engrais Fond)</div>
                  <div className="text-2xl font-bold mt-1 text-foreground">
                    {dapTotalBags > 0 ? `${dapTotalBags} ${tr('bags', 'أكياس', 'sacs')}` : tr('None', 'لا يوجد', 'Aucun')}
                  </div>
                  {dapTotalBags > 0 && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      = {dapTotalBags * 50} kg ({tr('Phosphorus + Starter N', 'فوسفور وتأسيس نيتروجين', 'Phosphore + Azote démarrage')})
                    </div>
                  )}
                </div>

                {/* Urea 46% */}
                <div className={`p-3 rounded-lg border ${ureaTotalBags > 0 ? 'bg-white dark:bg-slate-900 border-blue-300 dark:border-blue-800' : 'bg-muted/30 border-dashed border-border opacity-60'}`}>
                  <div className="text-xs font-bold text-blue-800 dark:text-blue-400">{tr('Urea 46% (Asmidal)', 'يوريا 46% أسميدال', 'Urée 46% (Asmidal)')}</div>
                  <div className="text-2xl font-bold mt-1 text-foreground">
                    {ureaTotalBags > 0 ? `${ureaTotalBags} ${tr('bags', 'أكياس', 'sacs')}` : tr('None', 'لا يوجد', 'Aucun')}
                  </div>
                  {ureaTotalBags > 0 && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      = {ureaTotalBags * 50} kg ({tr('Vegetative Nitrogen', 'نمو خضري نيتروجين', 'Azote végétatif')})
                    </div>
                  )}
                </div>

                {/* Potassium Sulfate */}
                <div className={`p-3 rounded-lg border ${potassiumTotalBags > 0 ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800' : 'bg-muted/30 border-dashed border-border opacity-60'}`}>
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-400">{tr('Potassium Sulfate 50% SOP', 'سلفات البوتاسيوم 50%', 'Sulfate de Potasse SOP')}</div>
                  <div className="text-2xl font-bold mt-1 text-foreground">
                    {potassiumTotalBags > 0 ? `${potassiumTotalBags} ${tr('bags', 'أكياس', 'sacs')}` : tr('None', 'لا يوجد', 'Aucun')}
                  </div>
                  {potassiumTotalBags > 0 && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      = {potassiumTotalBags * 50} kg ({tr('Tuber size & quality', 'حجم وجودة الدرنات/الثمار', 'Calibre et qualité')})
                    </div>
                  )}
                </div>
              </div>

              {/* CALCAREOUS SOIL & IRON CHLOROSIS GUARD */}
              {isCalcareousSoil && (
                <div className="p-3 rounded-xl border border-amber-400 bg-amber-100/70 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="h-4 w-4 text-amber-700" />
                    <span>{tr('Algerian Calcareous Soil Guard (High CaCO₃ / pH > 7.8):', 'تنبيه التربة الكلسية الجزائرية (تثبيت الفوسفور ونقص الحديد):', 'Alerte Sol Calcaire Algérien (pH > 7.8) :')}</span>
                  </div>
                  <p className="leading-relaxed">
                    {tr(
                      'High free lime locks phosphorus and blocks iron absorption. Recommend adding 5 to 10 kg/ha of Iron Chelate (Fe-EDDHA 6% ortho-ortho) and acidifying drip irrigation water with Phosphoric or Nitric Acid to prevent emitter calcification.',
                      'الكلس العالي يثبت الفوسفور ويعيق امتصاص الحديد. يوصى بإضافة 5 إلى 10 كغ/هكتار من شيلات الحديد Fe-EDDHA (6% أورثو-أورثو) مع حقن حمض الفوسفوريك أو النيتريك في مياه الري لمنع تكلس النقاطات.',
                      'Le calcaire actif bloque le phosphore et induit la chlorose ferrique. Apportez 5 à 10 kg/ha de Fer Chélaté (Fe-EDDHA 6% ortho-ortho) et acidifiez l’eau d’arrosage pour détartrer les gaines.'
                    )}
                  </p>
                </div>
              )}

              <div className="text-xs text-amber-900 dark:text-amber-200 bg-amber-100/70 dark:bg-amber-900/40 p-2.5 rounded-lg flex items-start gap-2">
                <span className="text-base">💡</span>
                <span>{language === 'ar' ? currentProgram.adviceAr : language === 'fr' ? currentProgram.adviceFr : currentProgram.adviceEn}</span>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: DRIP VALVE RUN-TIME + SALINITY LEACHING + SIROCCO + ENERGY COSTS */}
          <TabsContent value="irrigation" className="space-y-4">
            <div className="rounded-xl bg-cyan-50/70 p-3.5 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-800 dark:text-cyan-300">
                  <Timer className="h-4 w-4 text-cyan-600" />
                  {tr('Drip Irrigation Valve Run-Time & Salinity Shield', 'حاسبة مدة تشغيل صمام التقطير والوقاية من الملوحة والشهيلي', 'Calculateur de durée d\'arrosage & Bouclier Salinité/Sirocco')}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSiroccoActive((v) => !v)}
                    className={`text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1 transition-all ${
                      isSiroccoActive ? 'bg-orange-600 text-white animate-pulse' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Flame className="h-3 w-3" />
                    <span>{tr('Sirocco / Chehili', 'الشهيلي / رياح حارة', 'Sirocco / Chehili')}</span>
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {tr(
                  'Know exactly how many hours and minutes to run your pump for each sector based on dripper spacing, water salinity (ECw), and fuel/electricity energy costs.',
                  'اعرف بالضبط كم ساعة ودقيقة يجب تشغيل المضخة لكل صمام قطاع مع حساب غسيل الملوحة وتكلفة المازوت والكهرباء.',
                  'Déterminez le temps exact en heures et minutes pour irriguer votre vanne en intégrant la fraction de lessivage du sel et le coût énergétique.'
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{tr('Sector Area (m²)', 'مساحة القطاع (متر مربع)', 'Surface du secteur (m²)')}</Label>
                <Input
                  type="number"
                  step="500"
                  min="100"
                  value={dripAreaM2}
                  onChange={(e) => setDripAreaM2(parseFloat(e.target.value) || 1000)}
                  className="h-9 font-medium"
                />
                <div className="flex gap-1.5 pt-1">
                  {[2500, 5000, 10000].map((m2) => (
                    <button
                      key={m2}
                      type="button"
                      onClick={() => setDripAreaM2(m2)}
                      className={`text-[10px] px-2 py-0.5 rounded border ${
                        dripAreaM2 === m2 ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-muted/40 border-border text-muted-foreground'
                      }`}
                    >
                      {m2 >= 10000 ? `${m2 / 10000} ha` : `${m2} m²`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{tr('Base Crop Water Need (mm/day)', 'الاحتياج الأساسي اليومي (ملم/يوم)', 'Besoin brut en eau (mm/jour)')}</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="1"
                  value={baseWaterMm}
                  onChange={(e) => setBaseWaterMm(parseFloat(e.target.value) || 1)}
                  className="h-9 font-medium"
                />
                <span className="text-[10px] text-muted-foreground">
                  {tr('Standard ETc in summer: 4.0 to 6.5 mm', 'التبخر والنتح المعتاد صيفاً: 4.0 إلى 6.5 ملم', 'ETc standard en été: 4.0 à 6.5 mm')}
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{tr('Well Water Salinity ECw (dS/m)', 'ملوحة ماء البئر / السقي ECw (dS/m)', 'Salinité de l\'eau du forage ECw (dS/m)')}</Label>
                <Input
                  type="number"
                  step="0.2"
                  min="0.4"
                  max="8.0"
                  value={waterSalinityEcW}
                  onChange={(e) => setWaterSalinityEcW(parseFloat(e.target.value) || 1.0)}
                  className="h-9 font-medium"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
                  <span>💧 {tr('Fresh (<1.2)', 'عذبة (<1.2)', 'Douce (<1.2)')}</span>
                  <span>⚠️ {tr('Brackish (1.5 - 3.5)', 'متوسطة الملوحة (1.5 - 3.5)', 'Saumâtre')}</span>
                  <span>🔴 {tr('High Salinity (>3.5)', 'ملوحة عالية (>3.5)', 'Forte')}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{tr('Pumping Power & Energy Source', 'مصدر الطاقة وقوة المضخة', 'Source d\'énergie & Puissance pompe')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEnergySource('diesel')}
                      className={`flex-1 h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border ${
                        energySource === 'diesel' ? 'bg-amber-600 text-white border-amber-600' : 'bg-muted border-border text-muted-foreground'
                      }`}
                    >
                      <Fuel className="h-3.5 w-3.5" />
                      <span>{tr('Mazout', 'مازوت', 'Gasoil')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnergySource('sonelgaz')}
                      className={`flex-1 h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border ${
                        energySource === 'sonelgaz' ? 'bg-sky-600 text-white border-sky-600' : 'bg-muted border-border text-muted-foreground'
                      }`}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Sonelgaz</span>
                    </button>
                  </div>
                  <Input
                    type="number"
                    step="1"
                    min="2"
                    placeholder="Pump HP"
                    value={pumpHp}
                    onChange={(e) => setPumpHp(parseFloat(e.target.value) || 10)}
                    className="h-9 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{tr('Line Spacing between rows (m)', 'المسافة بين خطوط السقي (متر)', 'Écartement entre rangs (m)')}</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.4"
                  value={rowSpacingM}
                  onChange={(e) => setRowSpacingM(parseFloat(e.target.value) || 0.8)}
                  className="h-9 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{tr('Dripper Spacing & Flow (L/h)', 'المسافة بين القطارات وتدفق القطار (لتر/سا)', 'Écartement goutteurs & Débit (L/h)')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    min="0.2"
                    placeholder="Spacing (m)"
                    value={dripperSpacingM}
                    onChange={(e) => setDripperSpacingM(parseFloat(e.target.value) || 0.4)}
                    className="h-9 font-medium"
                  />
                  <Input
                    type="number"
                    step="0.2"
                    min="0.5"
                    placeholder="Flow (L/h)"
                    value={dripperFlowLh}
                    onChange={(e) => setDripperFlowLh(parseFloat(e.target.value) || 2.0)}
                    className="h-9 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* RESULTS DRIP TIMER */}
            <div className="rounded-xl border-2 border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/30 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-cyan-200 dark:border-cyan-800 pb-2">
                <span className="text-xs font-bold text-cyan-950 dark:text-cyan-200">
                  {tr('Pump Run-Time & Leaching Recommendation:', 'توصية تشغيل المضخة وغسيل الملوحة:', 'Recommandation de pompage & lessivage :')}
                </span>
                <Badge className="bg-cyan-600 text-white font-mono text-xs">
                  {dripperCount.toLocaleString()} {tr('Drippers', 'قطّار', 'Goutteurs')}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-cyan-200 dark:border-cyan-900">
                  <div className="text-[11px] text-muted-foreground font-medium">
                    {tr('Exact Pump Duration:', 'مدة تشغيل الصمام بدقة:', 'Durée exacte d\'ouverture :')}
                  </div>
                  <div className="text-2xl font-extrabold text-cyan-700 dark:text-cyan-400 mt-1">
                    {runHours}h {runMinutes}m
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    ⏱️ {runTimeHoursDecimal.toFixed(2)} {tr('total hours', 'إجمالي الساعات', 'heures')}
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-cyan-200 dark:border-cyan-900">
                  <div className="text-[11px] text-muted-foreground font-medium">
                    {tr('Water Volume Delivered:', 'إجمالي كمية المياه الموزعة:', 'Volume d\'eau distribué :')}
                  </div>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {totalWaterM3} m³
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    💧 {totalWaterNeededLiters.toLocaleString()} L ({effectiveWaterMm.toFixed(1)} mm)
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-cyan-200 dark:border-cyan-900">
                  <div className="text-[11px] text-muted-foreground font-medium">
                    {tr('Estimated Energy Cost:', 'تكلفة الطاقة المقدرة:', 'Coût énergétique estimé :')}
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {Math.round(estimatedEnergyCostDzd).toLocaleString()} DA
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {energySource === 'diesel'
                      ? `⛽ ${dieselConsumedL.toFixed(1)} L ${tr('diesel', 'مازوت', 'gasoil')}`
                      : `⚡ ${electricityKwh.toFixed(1)} kWh Sonelgaz`}
                  </div>
                </div>
              </div>

              {/* Salinity Leaching Fraction info */}
              {leachingFraction > 0 && (
                <div className="p-2.5 rounded-lg border border-cyan-300 dark:border-cyan-800 bg-cyan-100/70 dark:bg-cyan-950/60 text-xs text-cyan-950 dark:text-cyan-200 flex items-start gap-2">
                  <Droplets className="h-4 w-4 shrink-0 text-cyan-700 mt-0.5" />
                  <div>
                    <span className="font-bold">
                      {tr('Salinity Leaching Fraction (+', 'نسبة غسيل الأملاح الإضافية (+', 'Fraction de lessivage des sels (+')}
                      {Math.round(leachingFraction * 100)}%):{' '}
                    </span>
                    <span>
                      {tr(
                        `Given water salinity of ${waterSalinityEcW} dS/m, the application depth was automatically increased to prevent toxic salt accumulation in the root zone.`,
                        `نظراً لملوحة المياه البالغة ${waterSalinityEcW} dS/m، تمت زيادة كمية السقي تلقائياً لغسل الأملاح تحت منطقة الجذور وحماية المحصول.`,
                        `En raison de la salinité de l'eau (${waterSalinityEcW} dS/m), le volume a été augmenté pour lessiver les sels hors de la zone racinaire.`
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Sirocco warning */}
              {isSiroccoActive && (
                <div className="p-2.5 rounded-lg border border-orange-400 bg-orange-100/80 dark:bg-orange-950/60 text-xs text-orange-950 dark:text-orange-200 flex items-start gap-2">
                  <Flame className="h-4 w-4 shrink-0 text-orange-600 mt-0.5 animate-bounce" />
                  <div>
                    <span className="font-bold">{tr('🔥 Chehili / Sirocco Pulse Activated (+30%):', '🔥 تفعيل درع الشهيلي والري الوقائي (+30%):', '🔥 Bouclier Sirocco / Chehili Actif (+30%) :')} </span>
                    <span>
                      {tr(
                        'Pre-heatwave pulse scheduled to keep plant xylem pressure balanced and prevent fruit drop or leaf scorch during extreme desert winds.',
                        'تمت جدولة رية وقائية سريعة للحفاظ على ضغط العصارة في النبات ومنع تساقط الثمار والأزهار أو احتراق الأوراق أثناء هبوب رياح الشهيلي.',
                        'Irrigation préventive programmée pour maintenir la turgescence et éviter la chute des fleurs et l’échaudage lors des vents chauds.'
                      )}
                    </span>
                  </div>
                </div>
              )}

              <div className="text-[11px] text-cyan-900 dark:text-cyan-200 bg-cyan-100/70 dark:bg-cyan-900/40 p-2.5 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-600" />
                <span>
                  {tr(
                    'Irrigate in early morning (05:00 - 08:00) or dusk to reduce evaporation loss by up to 25%.',
                    'اسقِ في الصباح الباكر (05:00 - 08:00) أو عند الغروب لتقليل الفقد بالتبخر بنسبة تصل إلى 25%.',
                    'Arrosez tôt le matin (05h00 - 08h00) ou au crépuscule pour économiser jusqu\'à 25% d\'eau.'
                  )}
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
