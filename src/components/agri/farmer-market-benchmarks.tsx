'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Store,
  Calculator,
  Scale,
  Sparkles,
  Truck,
  Check,
  BookOpen,
  Wheat,
  FileCheck,
  Coins,
} from 'lucide-react';
import { useTranslation, copyFor } from '@/lib/language-store';
import { appendManualFieldRecord } from '@/lib/field-record-book';

interface FarmerMarketBenchmarksProps {
  defaultCrop?: string;
  defaultAreaHa?: number;
  sunMode?: boolean;
}

interface CommodityPrice {
  id: string;
  emoji: string;
  nameEn: string;
  nameFr: string;
  nameAr: string;
  priceDzdKgMin: number;
  priceDzdKgMax: number;
  priceAvgDzd: number;
  regionEn: string;
  regionFr: string;
  regionAr: string;
  typicalYieldQxHa: number; // in Quintaux (1 Qx = 100 kg)
  typicalCostDzdHa: number; // typical investment cost per ha
}

const ALGERIAN_SOUK_BENCHMARKS: CommodityPrice[] = [
  {
    id: 'potato',
    emoji: '🥔',
    nameEn: 'Potato (Batata)',
    nameFr: 'Pomme de terre',
    nameAr: 'البطاطا (بطاطس)',
    priceDzdKgMin: 55,
    priceDzdKgMax: 85,
    priceAvgDzd: 70,
    regionEn: 'Ain Defla / Mostaganem / Oued Souf',
    regionFr: 'Aïn Defla / Mostaganem / Oued Souf',
    regionAr: 'عين الدفلى / مستغانم / وادي سوف',
    typicalYieldQxHa: 320, // 32 t/ha
    typicalCostDzdHa: 950000,
  },
  {
    id: 'tomato',
    emoji: '🍅',
    nameEn: 'Market Tomato',
    nameFr: 'Tomate maraîchère',
    nameAr: 'طماطم المائدة / الحقلية',
    priceDzdKgMin: 60,
    priceDzdKgMax: 130,
    priceAvgDzd: 90,
    regionEn: 'Biskra / Tipaza / Mostaganem',
    regionFr: 'Biskra / Tipaza / Mostaganem',
    regionAr: 'بسكرة / تيبازة / مستغانم',
    typicalYieldQxHa: 500,
    typicalCostDzdHa: 1400000,
  },
  {
    id: 'durum_wheat',
    emoji: '🌾',
    nameEn: 'Durum Wheat (Blé Dur CCLS)',
    nameFr: 'Blé dur (Prix garanti CCLS)',
    nameAr: 'القمح الصلب (سعر CCLS المدعوم)',
    priceDzdKgMin: 60,
    priceDzdKgMax: 60,
    priceAvgDzd: 60, // 6000 DZD / Qx
    regionEn: 'Constantine / Sétif / Tiaret / Guelma',
    regionFr: 'Constantine / Sétif / Tiaret / Guelma',
    regionAr: 'قسنطينة / سطيف / تيارت / قالمة',
    typicalYieldQxHa: 32,
    typicalCostDzdHa: 110000,
  },
  {
    id: 'bread_wheat',
    emoji: '🌾',
    nameEn: 'Bread Wheat (Blé Tendre CCLS)',
    nameFr: 'Blé tendre (CCLS)',
    nameAr: 'القمح اللين (الفرينة CCLS)',
    priceDzdKgMin: 50,
    priceDzdKgMax: 50,
    priceAvgDzd: 50, // 5000 DZD / Qx
    regionEn: 'Sidi Bel Abbes / Chlef / Bouira',
    regionFr: 'Sidi Bel Abbès / Chlef / Bouira',
    regionAr: 'سيدي بلعباس / الشلف / البويرة',
    typicalYieldQxHa: 35,
    typicalCostDzdHa: 105000,
  },
  {
    id: 'barley',
    emoji: '🌾',
    nameEn: 'Barley (Orge CCLS)',
    nameFr: 'Orge (CCLS)',
    nameAr: 'الشعير (CCLS)',
    priceDzdKgMin: 34,
    priceDzdKgMax: 34,
    priceAvgDzd: 34, // 3400 DZD / Qx
    regionEn: 'Tiaret / Djelfa / Batna / Saïda',
    regionFr: 'Tiaret / Djelfa / Batna / Saïda',
    regionAr: 'تيارت / الجلفة / باتنة / سعيدة',
    typicalYieldQxHa: 25,
    typicalCostDzdHa: 85000,
  },
  {
    id: 'citrus',
    emoji: '🍊',
    nameEn: 'Citrus (Thomson / Clémentine)',
    nameFr: 'Agrumes (Orange / Clémentine)',
    nameAr: 'الحمضيات (برتقال / كلمنتين)',
    priceDzdKgMin: 90,
    priceDzdKgMax: 170,
    priceAvgDzd: 125,
    regionEn: 'Mitidja (Blida) / Chlef / Mascara',
    regionFr: 'Mitidja (Blida) / Chlef / Mascara',
    regionAr: 'متيجة (البليدة) / الشلف / معسكر',
    typicalYieldQxHa: 220,
    typicalCostDzdHa: 650000,
  },
  {
    id: 'olive_oil',
    emoji: '🫒',
    nameEn: 'Olive Oil (Huile d\'olive)',
    nameFr: 'Huile d\'olive extra vierge',
    nameAr: 'زيت الزيتون البكر الممتاز',
    priceDzdKgMin: 850,
    priceDzdKgMax: 1150,
    priceAvgDzd: 950,
    regionEn: 'Tizi Ouzou / Bejaia / Bouira / Mascara',
    regionFr: 'Tizi Ouzou / Béjaïa / Bouira / Mascara',
    regionAr: 'تيزي وزو / بجاية / البويرة / معسكر',
    typicalYieldQxHa: 12,
    typicalCostDzdHa: 350000,
  },
  {
    id: 'dates_deglet',
    emoji: '🌴',
    nameEn: 'Dates Deglet Nour (Branche)',
    nameFr: 'Dattes Deglet Nour branchée',
    nameAr: 'تمور دقلة نور (شمروخ)',
    priceDzdKgMin: 450,
    priceDzdKgMax: 750,
    priceAvgDzd: 580,
    regionEn: 'Biskra (Tolga) / El Oued',
    regionFr: 'Biskra (Tolga) / El Oued',
    regionAr: 'بسكرة (طولقة) / الوادي',
    typicalYieldQxHa: 80,
    typicalCostDzdHa: 700000,
  },
  {
    id: 'onion',
    emoji: '🧅',
    nameEn: 'Dry Onions (Bsal)',
    nameFr: 'Oignon sec de conservation',
    nameAr: 'البصل الجاف للتخزين',
    priceDzdKgMin: 40,
    priceDzdKgMax: 80,
    priceAvgDzd: 55,
    regionEn: 'Mascara (Tighennif) / Ain Defla / El Oued',
    regionFr: 'Mascara (Tighennif) / Aïn Defla',
    regionAr: 'معسكر (تيغنيف) / عين الدفلى / الوادي',
    typicalYieldQxHa: 400,
    typicalCostDzdHa: 800000,
  },
];

export function FarmerMarketBenchmarks({
  defaultCrop = 'potato',
  defaultAreaHa = 1,
  sunMode = false,
}: FarmerMarketBenchmarksProps) {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  const [activeTab, setActiveTab] = useState<'calculator' | 'ccls_estimator' | 'crate_logger'>('calculator');
  const [selectedCropId, setSelectedCropId] = useState<string>(
    defaultCrop.toLowerCase().includes('potato')
      ? 'potato'
      : defaultCrop.toLowerCase().includes('tomat')
      ? 'tomato'
      : defaultCrop.toLowerCase().includes('wheat')
      ? 'durum_wheat'
      : defaultCrop.toLowerCase().includes('citrus')
      ? 'citrus'
      : defaultCrop.toLowerCase().includes('olive')
      ? 'olive_oil'
      : defaultCrop.toLowerCase().includes('date')
      ? 'dates_deglet'
      : 'potato'
  );
  const selectedCrop = ALGERIAN_SOUK_BENCHMARKS.find((c) => c.id === selectedCropId) || ALGERIAN_SOUK_BENCHMARKS[0];

  // Financial ROI Calculator State
  const [calcAreaHa, setCalcAreaHa] = useState<number>(defaultAreaHa || 1);
  const [customYieldQx, setCustomYieldQx] = useState<number>(selectedCrop.typicalYieldQxHa);
  const [customPriceDzdKg, setCustomPriceDzdKg] = useState<number>(selectedCrop.priceAvgDzd);

  // Cost items per Hectare
  const [seedCostHa, setSeedCostHa] = useState<number>(Math.round(selectedCrop.typicalCostDzdHa * 0.45));
  const [fertCostHa, setFertCostHa] = useState<number>(Math.round(selectedCrop.typicalCostDzdHa * 0.25));
  const [energyLaborCostHa, setEnergyLaborCostHa] = useState<number>(Math.round(selectedCrop.typicalCostDzdHa * 0.20));
  const [mechanizationCostHa, setMechanizationCostHa] = useState<number>(Math.round(selectedCrop.typicalCostDzdHa * 0.10));

  // Sync defaults when crop is clicked
  const handleSelectCrop = (crop: CommodityPrice) => {
    setSelectedCropId(crop.id);
    setCustomYieldQx(crop.typicalYieldQxHa);
    setCustomPriceDzdKg(crop.priceAvgDzd);
    setSeedCostHa(Math.round(crop.typicalCostDzdHa * 0.45));
    setFertCostHa(Math.round(crop.typicalCostDzdHa * 0.25));
    setEnergyLaborCostHa(Math.round(crop.typicalCostDzdHa * 0.20));
    setMechanizationCostHa(Math.round(crop.typicalCostDzdHa * 0.10));
  };

  // Math computations for general ROI
  const totalCostPerHaDzd = seedCostHa + fertCostHa + energyLaborCostHa + mechanizationCostHa;
  const totalInvestedDzd = totalCostPerHaDzd * calcAreaHa;
  const totalProductionKg = customYieldQx * 100 * calcAreaHa;
  const grossRevenueDzd = totalProductionKg * customPriceDzdKg;
  const netProfitDzd = grossRevenueDzd - totalInvestedDzd;
  const breakEvenPriceDzdKg = totalProductionKg > 0 ? totalInvestedDzd / totalProductionKg : 0;
  const roiPercentage = totalInvestedDzd > 0 ? Math.round((netProfitDzd / totalInvestedDzd) * 100) : 0;

  // -------------------------------------------------------------
  // CCLS CEREAL DELIVERY & QUALITY GRADER STATE
  // -------------------------------------------------------------
  const [cclsCerealType, setCclsCerealType] = useState<'ble_dur' | 'ble_tendre' | 'orge' | 'avoine'>('ble_dur');
  const [cclsDeliveredQx, setCclsDeliveredQx] = useState<number>(350); // 350 Quintaux (35 tonnes)
  const [cclsPsKgHl, setCclsPsKgHl] = useState<number>(78); // Specific Weight (Poids Spécifique)
  const [cclsMoisturePct, setCclsMoisturePct] = useState<number>(12.5); // % Moisture (<14% is standard)
  const [cclsImpuritiesPct, setCclsImpuritiesPct] = useState<number>(2.0); // % Impurities (<3% is clean)
  const [cclsTransportDzd, setCclsTransportDzd] = useState<number>(25000); // 25,000 DZD truck freight

  // Official Algerian Guaranteed CCLS Prices (DZD per Quintal)
  const CCLS_BASE_PRICES = {
    ble_dur: 6000,
    ble_tendre: 5000,
    orge: 3400,
    avoine: 3400,
  };

  const basePricePerQx = CCLS_BASE_PRICES[cclsCerealType];

  // CCLS Quality Bonuses / Discounts Calculation
  // 1. Specific Weight (PS) Bonus/Malus: standard = 76 kg/hL. If >= 78 -> +1.5% bonus. If < 74 -> -2% discount.
  let psFactor = 1.0;
  if (cclsPsKgHl >= 80) psFactor = 1.025;
  else if (cclsPsKgHl >= 78) psFactor = 1.015;
  else if (cclsPsKgHl < 74) psFactor = 0.97;
  else if (cclsPsKgHl < 70) psFactor = 0.92;

  // 2. Moisture Deduction: if > 14%, deduct 1% per 0.5% excess
  let moistureDeductionPct = 0;
  if (cclsMoisturePct > 14.0) {
    moistureDeductionPct = (cclsMoisturePct - 14.0) * 2;
  }

  // 3. Impurities Deduction: if > 2%, deduct excess
  let impuritiesDeductionPct = 0;
  if (cclsImpuritiesPct > 2.0) {
    impuritiesDeductionPct = cclsImpuritiesPct - 2.0;
  }

  const netQualityMultiplier = Math.max(0.8, psFactor - (moistureDeductionPct + impuritiesDeductionPct) / 100);
  const effectivePricePerQx = basePricePerQx * netQualityMultiplier;
  const cclsGrossPayoutDzd = cclsDeliveredQx * effectivePricePerQx;
  const cclsNetAfterTransportDzd = cclsGrossPayoutDzd - cclsTransportDzd;

  // -------------------------------------------------------------
  // Harvest & Crate Profitability Batch Logger State
  // -------------------------------------------------------------
  const [crateType, setCrateType] = useState<'plastic_20' | 'wood_15' | 'bag_50' | 'quintal_100'>('plastic_20');
  const [crateCount, setCrateCount] = useState<number>(150);
  const [todayPriceDzdKg, setTodayPriceDzdKg] = useState<number>(selectedCrop.priceAvgDzd);
  const [transportCostDzd, setTransportCostDzd] = useState<number>(12000);
  const [savedBatchSuccess, setSavedBatchSuccess] = useState<boolean>(false);

  const crateWeights = {
    plastic_20: 20,
    wood_15: 15,
    bag_50: 50,
    quintal_100: 100,
  };

  const unitWeightKg = crateWeights[crateType];
  const totalHarvestBatchKg = crateCount * unitWeightKg;
  const totalGrossHarvestDzd = totalHarvestBatchKg * todayPriceDzdKg;
  const netHarvestAfterTransportDzd = totalGrossHarvestDzd - transportCostDzd;

  const handleSaveHarvestToFieldBook = () => {
    const summary = `${selectedCrop.nameEn} Harvest: ${crateCount} packages (${totalHarvestBatchKg} kg) @ ${todayPriceDzdKg} DZD/kg. Gross: ${totalGrossHarvestDzd.toLocaleString()} DZD. Transport: ${transportCostDzd.toLocaleString()} DZD. Net: ${netHarvestAfterTransportDzd.toLocaleString()} DZD.`;

    appendManualFieldRecord({
      fieldName: selectedCrop.nameEn,
      crop: selectedCrop.nameEn,
      date: new Date().toISOString().slice(0, 10),
      kind: 'harvest',
      title: `${selectedCrop.nameEn} Harvest Recorded`,
      summary,
      amountDzd: totalGrossHarvestDzd,
    });

    setSavedBatchSuccess(true);
    setTimeout(() => setSavedBatchSuccess(false), 3000);
  };

  const handleSaveCclsToFieldBook = () => {
    const summary = `CCLS Cereal Delivery: ${cclsDeliveredQx} Qx ${cclsCerealType.replace('_', ' ')}. PS: ${cclsPsKgHl} kg/hL, Moisture: ${cclsMoisturePct}%. Gross: ${cclsGrossPayoutDzd.toLocaleString()} DZD. Net after Freight: ${cclsNetAfterTransportDzd.toLocaleString()} DZD.`;

    appendManualFieldRecord({
      fieldName: 'Cereal (CCLS)',
      crop: 'Cereal (CCLS)',
      date: new Date().toISOString().slice(0, 10),
      kind: 'harvest',
      title: 'CCLS Cereal Delivery Recorded',
      summary,
      amountDzd: cclsGrossPayoutDzd,
    });

    setSavedBatchSuccess(true);
    setTimeout(() => setSavedBatchSuccess(false), 3000);
  };

  return (
    <Card className={`border ${sunMode ? 'border-foreground bg-background text-foreground' : 'border-border bg-card'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Store className="h-5 w-5 text-emerald-600" />
            <span>{tr('Algerian Wholesale Souk Benchmarks & CCLS Payouts', 'أسعار أسواق الجملة الجزائرية وحاسبة أرباح CCLS والصناديق', 'Marchés de gros algériens, CCLS & Rentabilité')}</span>
          </CardTitle>
          <div className="flex gap-1 flex-wrap">
            <Button
              type="button"
              variant={activeTab === 'calculator' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('calculator')}
              className="h-8 text-xs font-semibold"
            >
              <Calculator className="h-3.5 w-3.5 mr-1" />
              {tr('ROI & Break-Even', 'تكلفة الكيلو والربح', 'Seuil & Rentabilité')}
            </Button>
            <Button
              type="button"
              variant={activeTab === 'ccls_estimator' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('ccls_estimator')}
              className="h-8 text-xs font-semibold"
            >
              <Wheat className="h-3.5 w-3.5 mr-1 text-amber-600" />
              {tr('CCLS Cereal Payout', 'حساب دفع الحبوب CCLS', 'Paiement CCLS')}
            </Button>
            <Button
              type="button"
              variant={activeTab === 'crate_logger' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('crate_logger')}
              className="h-8 text-xs font-semibold"
            >
              <Truck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              {tr('Crate & Truck Logger', 'حساب الصناديق والشاحنة', 'Caisse & Camion')}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {tr(
            'Live wholesale benchmark prices across Algerian wilayas, minimum break-even price calculator, official CCLS cereal delivery grading, and batch profit recorders.',
            'أسعار الجملة المرجعية في أسواق الوطن، حساب سعر التعادل الحقيقي للكيلوغرام، تقييم شحنات الحبوب لدى تعاونية CCLS، ومسجل أرباح الصناديق.',
            'Prix de référence des Souks de gros, calcul du seuil de rentabilité au kilo, barème de livraison CCLS et enregistreur de récoltes.'
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* COMMODITY SELECTOR PILLS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {ALGERIAN_SOUK_BENCHMARKS.map((item) => {
            const isSelected = item.id === selectedCropId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectCrop(item)}
                className={`p-2 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 ring-2 ring-emerald-500 shadow-sm'
                    : 'border-border bg-card hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{item.emoji}</span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {item.priceDzdKgMin === item.priceDzdKgMax ? `${item.priceAvgDzd} DA/kg` : `${item.priceDzdKgMin}-${item.priceDzdKgMax} DA`}
                  </span>
                </div>
                <div className="text-xs font-semibold mt-1 truncate">
                  {language === 'ar' ? item.nameAr : language === 'fr' ? item.nameFr : item.nameEn}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  📍 {language === 'ar' ? item.regionAr : language === 'fr' ? item.regionFr : item.regionEn}
                </div>
              </button>
            );
          })}
        </div>

        {activeTab === 'calculator' && (
          <>
            {/* PRODUCTION & YIELD PARAMETERS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-muted/30 border border-border">
              <div className="space-y-1">
                <Label className="text-xs font-bold">{tr('Field Area (Hectares)', 'مساحة الحقل (هكتار)', 'Superficie (ha)')}</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0.1"
                  value={calcAreaHa}
                  onChange={(e) => setCalcAreaHa(parseFloat(e.target.value) || 0.1)}
                  className="h-9 font-medium"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">{tr('Expected Yield (Quintaux / ha)', 'المردود المتوقع (قنطار/هكتار)', 'Rendement (Qx/ha)')}</Label>
                <Input
                  type="number"
                  step="10"
                  min="5"
                  value={customYieldQx}
                  onChange={(e) => setCustomYieldQx(parseFloat(e.target.value) || 10)}
                  className="h-9 font-medium"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">{tr('Expected Wholesale Price (DZD / kg)', 'سعر البيع بالجملة المتوقع (دج/كغ)', 'Prix de vente gros (DZD/kg)')}</Label>
                <Input
                  type="number"
                  step="5"
                  min="10"
                  value={customPriceDzdKg}
                  onChange={(e) => setCustomPriceDzdKg(parseFloat(e.target.value) || 10)}
                  className="h-9 font-medium"
                />
              </div>
            </div>

            {/* PRODUCTION COSTS BREAKDOWN */}
            <div className="p-3.5 rounded-xl border border-border bg-card space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-emerald-600" />
                  {tr('Field Costs Breakdown per Hectare (DZD/ha):', 'تفصيل تكاليف الإنتاج للهكتار (دج/هكتار):', 'Détail des charges de production par hectare :')}
                </span>
                <span className="text-xs font-bold font-mono text-muted-foreground">
                  {tr('Total / ha:', 'المجموع/هكتار:', 'Total/ha :')} {totalCostPerHaDzd.toLocaleString()} DZD
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{tr('Seeds / Seedlings', 'البذور والشتلات', 'Semences & plants')}</Label>
                  <Input
                    type="number"
                    step="10000"
                    value={seedCostHa}
                    onChange={(e) => setSeedCostHa(parseInt(e.target.value, 10) || 0)}
                    className="h-8 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{tr('Fertilizers & Phyto', 'الأسمدة والمبيدات', 'Engrais & Phyto')}</Label>
                  <Input
                    type="number"
                    step="10000"
                    value={fertCostHa}
                    onChange={(e) => setFertCostHa(parseInt(e.target.value, 10) || 0)}
                    className="h-8 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{tr('Diesel & Labor', 'الوقود والعمال', 'Gasoil & Main d\'œuvre')}</Label>
                  <Input
                    type="number"
                    step="10000"
                    value={energyLaborCostHa}
                    onChange={(e) => setEnergyLaborCostHa(parseInt(e.target.value, 10) || 0)}
                    className="h-8 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{tr('Tractor & Land rent', 'الجرار وكراء الأرض', 'Tracteur & Foncier')}</Label>
                  <Input
                    type="number"
                    step="10000"
                    value={mechanizationCostHa}
                    onChange={(e) => setMechanizationCostHa(parseInt(e.target.value, 10) || 0)}
                    className="h-8 text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* DECISION RESULTS: BREAK-EVEN PRICE & PROFIT */}
            <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800 pb-2">
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  {tr('Economic Performance & Break-Even Price:', 'المؤشرات المالية وسعر التعادل الميداني:', 'Indicateurs économiques & Seuil de rentabilité :')}
                </span>
                <Badge className={`${netProfitDzd >= 0 ? 'bg-emerald-600' : 'bg-rose-600'} text-white font-mono text-xs`}>
                  ROI: {roiPercentage > 0 ? `+${roiPercentage}%` : `${roiPercentage}%`}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Break-Even Price */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-800">
                  <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1">
                    <span>🎯 {tr('Break-Even Price (Cost/kg):', 'سعر التكلفة الأدنى (سعر التعادل):', 'Prix de revient (Seuil zéro) :')}</span>
                  </div>
                  <div className="text-2xl font-black text-foreground mt-1">
                    {breakEvenPriceDzdKg.toFixed(1)} <span className="text-xs font-bold">DZD / kg</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {tr('Do not sell below this price to avoid a loss.', 'البيع بأقل من هذا السعر يسبب خسارة مباشرة.', 'Ne vendez pas sous ce seuil sous peine de perte.')}
                  </p>
                </div>

                {/* Total Invested */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-border">
                  <div className="text-[11px] font-semibold text-muted-foreground">
                    {tr('Total Production Expense:', 'إجمالي المصاريف المستثمرة:', 'Dépenses totales investies :')}
                  </div>
                  <div className="text-xl font-bold text-foreground mt-1">
                    {totalInvestedDzd.toLocaleString()} DZD
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    ~{(totalInvestedDzd / 10000).toLocaleString()} {tr('Million Centimes', 'مليون سنتيم', 'Centimes')}
                  </p>
                </div>

                {/* Net Estimated Profit */}
                <div className={`p-3 bg-white dark:bg-slate-900 rounded-xl border ${netProfitDzd >= 0 ? 'border-emerald-400 dark:border-emerald-800' : 'border-rose-400 dark:border-rose-800'}`}>
                  <div className={`text-[11px] font-bold ${netProfitDzd >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                    {netProfitDzd >= 0 ? '💰 ' + tr('Estimated Net Profit:', 'صافي الأرباح المقدرة:', 'Bénéfice net estimé :') : '⚠️ ' + tr('Estimated Loss:', 'الخسارة المقدرة:', 'Perte estimée :')}
                  </div>
                  <div className={`text-2xl font-black mt-1 ${netProfitDzd >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {netProfitDzd.toLocaleString()} <span className="text-xs font-bold">DZD</span>
                  </div>
                  <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
                    ~{(netProfitDzd / 10000).toLocaleString()} {tr('Million Centimes', 'مليون سنتيم', 'Centimes')}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* CCLS CEREAL DELIVERY ESTIMATOR TAB */}
        {activeTab === 'ccls_estimator' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-amber-50/70 p-3.5 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
                <Wheat className="h-4 w-4 text-amber-600" />
                {tr('Official Algerian CCLS Cereal Payout & Grain Quality Grader', 'حاسبة تقييم وتسليم الحبوب لدى تعاونية CCLS الرسمية', 'Calculateur de livraison céréales CCLS & Grille de qualité')}
              </div>
              <p className="text-xs text-muted-foreground">
                {tr(
                  'Simulate your official OAIC / CCLS grain delivery check with official guaranteed prices (Durum Wheat 6,000 DA/Q, Soft Wheat 5,000 DA/Q, Barley 3,400 DA/Q) and quality bonifications.',
                  'احسب مستحقات شيك دفع الحبوب لدى تعاونيات الحبوب والبقول الجافة (CCLS) مع الأسعار الرسمية المحددة وجودة المحصول (الوزن النوعي، الرطوبة، والشوائب).',
                  'Simulez le montant exact de votre virement CCLS selon les prix garantis par l\'État et la grille d\'agréage (Poids Spécifique, Humidité, Impuretés).'
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{tr('Cereal Type (CCLS)', 'نوع الحبوب المسلّمة', 'Espèce de céréale')}</Label>
                <select
                  value={cclsCerealType}
                  onChange={(e) => setCclsCerealType(e.target.value as any)}
                  className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ble_dur">{tr('Durum Wheat / Blé Dur (6,000 DA/Q)', 'القمح الصلب (6,000 دج/قنطار)', 'Blé Dur (6 000 DA/Q)')}</option>
                  <option value="ble_tendre">{tr('Soft Bread Wheat / Blé Tendre (5,000 DA/Q)', 'القمح اللين / فرينة (5,000 دج/قنطار)', 'Blé Tendre (5 000 DA/Q)')}</option>
                  <option value="orge">{tr('Barley / Orge (3,400 DA/Q)', 'الشعير (3,400 دج/قنطار)', 'Orge (3 400 DA/Q)')}</option>
                  <option value="avoine">{tr('Oats / Avoine (3,400 DA/Q)', 'الخرطال / الشوفان (3,400 دج/قنطار)', 'Avoine (3 400 DA/Q)')}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{tr('Quantity Delivered (Quintaux)', 'الكمية المسلمة (بالقنطار)', 'Quantité livrée (Qx)')}</Label>
                <Input
                  type="number"
                  step="10"
                  min="1"
                  value={cclsDeliveredQx}
                  onChange={(e) => setCclsDeliveredQx(parseFloat(e.target.value) || 1)}
                  className="h-9 font-medium"
                />
                <span className="text-[10px] text-muted-foreground">
                  = {(cclsDeliveredQx / 10).toFixed(1)} {tr('Tonnes', 'طن', 'Tonnes')}
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{tr('Specific Weight PS (kg/hL)', 'الوزن النوعي PS (كغ/هكتولتر)', 'Poids Spécifique PS (kg/hL)')}</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="65"
                  max="88"
                  value={cclsPsKgHl}
                  onChange={(e) => setCclsPsKgHl(parseFloat(e.target.value) || 76)}
                  className="h-9 font-medium"
                />
                <span className="text-[10px] text-muted-foreground">
                  {cclsPsKgHl >= 78 ? `✅ ${tr('High Quality Bonus (+1.5%)', 'جودة ممتازة (مكافأة)', 'Bonification (+1.5%)')}` : cclsPsKgHl < 74 ? `⚠️ ${tr('Discounted (-3%)', 'خصم لجودة منخفضة', 'Réfraction')}` : tr('Standard (76 kg/hL)', 'معياري', 'Standard')}
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{tr('Moisture % (Max 14%)', 'نسبة الرطوبة % (المعيار 14%)', 'Taux d\'Humidité %')}</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="8"
                  max="20"
                  value={cclsMoisturePct}
                  onChange={(e) => setCclsMoisturePct(parseFloat(e.target.value) || 12)}
                  className="h-9 font-medium"
                />
                <span className="text-[10px] text-muted-foreground">
                  {cclsMoisturePct > 14 ? `🔴 ${tr('Moisture Penalty', 'خصم بسبب الرطوبة الزائدة', 'Pénalité humidité')}` : `✅ ${tr('Dry & Safe', 'جاف ومطابق', 'Conforme')}`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{tr('Grain Transport to Silo (DZD)', 'تكلفة نقل الشاحنة إلى الصومعة (دج)', 'Transport vers silo CCLS (DZD)')}</Label>
                <Input
                  type="number"
                  step="2000"
                  min="0"
                  value={cclsTransportDzd}
                  onChange={(e) => setCclsTransportDzd(parseInt(e.target.value, 10) || 0)}
                  className="h-9 font-medium"
                />
              </div>

              <div className="p-3 rounded-xl bg-card border border-border flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-muted-foreground">{tr('Base Price per Quintal:', 'السعر المرجعي للقنطار:', 'Prix de base garanti :')}</div>
                  <div className="text-lg font-bold text-foreground">
                    {basePricePerQx.toLocaleString()} DA / Q
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-muted-foreground">{tr('Quality Adjusted Price:', 'السعر بعد تعديل الجودة:', 'Prix net agréage :')}</div>
                  <div className="text-lg font-bold text-amber-600">
                    {effectivePricePerQx.toFixed(0)} DA / Q
                  </div>
                </div>
              </div>
            </div>

            {/* RESULTS CCLS PAYOUT */}
            <div className="rounded-xl border-2 border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <FileCheck className="h-4 w-4 text-amber-600" />
                  <span>{tr('Estimated CCLS Check Amount (Net of Transport):', 'قيمة مستحقات شيك CCLS (صافي بعد النقل):', 'Montant estimé du virement CCLS (Net transport) :')}</span>
                </div>
                <div className="text-3xl font-black text-amber-700 dark:text-amber-400 mt-0.5">
                  {cclsNetAfterTransportDzd.toLocaleString()} <span className="text-sm font-bold">DZD</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  ~{(cclsNetAfterTransportDzd / 10000).toLocaleString()} {tr('Million Centimes', 'مليون سنتيم', 'Centimes')} ({cclsGrossPayoutDzd.toLocaleString()} DA {tr('Gross', 'إجمالي', 'Brut')})
                </div>
              </div>

              <Button
                type="button"
                onClick={handleSaveCclsToFieldBook}
                className="h-10 px-4 gap-2 font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
              >
                {savedBatchSuccess ? <Check className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                <span>
                  {savedBatchSuccess
                    ? tr('Saved to Field Book!', 'تم الحفظ في سجل الحقل!', 'Enregistré au carnet !')
                    : tr('Save CCLS Delivery Record', 'حفظ تسليم الحبوب في السجل', 'Enregistrer livraison CCLS')}
                </span>
              </Button>
            </div>
          </div>
        )}

        {/* CRATE & HARVEST BATCH LOGGER TAB */}
        {activeTab === 'crate_logger' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50/70 p-3.5 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                <Truck className="h-4 w-4 text-emerald-600" />
                {tr('Daily Crate & Truckload Net Earnings Calculator', 'حاسبة أرباح الصناديق والشاحنات وحفظها في السجل', 'Calculateur de cageots et chargement camion')}
              </div>
              <p className="text-xs text-muted-foreground">
                {tr(
                  'Quickly tally your crates picked today, deduct truck freight, and save the batch record to your farm log book.',
                  'احسب دخل جني اليوم بالصندوق أو القنطار، واخصم تكلفة نقل الشاحنة، واحفظ الحصاد مباشرة في سجل المزرعة.',
                  'Comptabilisez vos cageots du jour, déduisez le transport et enregistrez la récolte au cahier de champ.'
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{tr('Packaging Type', 'نوع التعبئة', 'Type de conditionnement')}</Label>
                <select
                  value={crateType}
                  onChange={(e) => setCrateType(e.target.value as any)}
                  className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="plastic_20">{tr('Plastic Crate (20 kg)', 'صندوق بلاستيكي (20 كغ)', 'Caisse plastique (20 kg)')}</option>
                  <option value="wood_15">{tr('Wooden Cageot (15 kg)', 'صندوق خشب / كاجو (15 كغ)', 'Cageot bois (15 kg)')}</option>
                  <option value="bag_50">{tr('50kg Sack (50 kg)', 'كيس خيش/بلاستيك (50 كغ)', 'Sac de 50 kg')}</option>
                  <option value="quintal_100">{tr('Quintal (100 kg)', 'قنطار (100 كغ)', 'Quintal (100 kg)')}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{tr('Number of Packages Harvested', 'عدد الصناديق / الأكياس المجنية', 'Nombre de caisses / sacs')}</Label>
                <Input
                  type="number"
                  step="10"
                  min="1"
                  value={crateCount}
                  onChange={(e) => setCrateCount(parseInt(e.target.value, 10) || 1)}
                  className="h-9 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{tr('Today\'s Souk Selling Price (DZD / kg)', 'سعر البيع بالسوق اليوم (دج/كغ)', 'Prix du jour (DZD/kg)')}</Label>
                <Input
                  type="number"
                  step="5"
                  min="1"
                  value={todayPriceDzdKg}
                  onChange={(e) => setTodayPriceDzdKg(parseFloat(e.target.value) || 1)}
                  className="h-9 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{tr('Truck Transport & Labor Haulage (DZD)', 'تكلفة شاحنة النقل والعتالة (دج)', 'Transport & Manutention (DZD)')}</Label>
                <Input
                  type="number"
                  step="1000"
                  min="0"
                  value={transportCostDzd}
                  onChange={(e) => setTransportCostDzd(parseInt(e.target.value, 10) || 0)}
                  className="h-9 font-medium"
                />
              </div>

              <div className="p-3 rounded-xl bg-card border border-border flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-muted-foreground">{tr('Total Weight Loaded:', 'الوزن الإجمالي المشحون:', 'Poids total chargé :')}</div>
                  <div className="text-lg font-bold text-foreground">
                    {totalHarvestBatchKg.toLocaleString()} kg <span className="text-xs font-normal text-muted-foreground">({(totalHarvestBatchKg / 100).toFixed(1)} Qx)</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-muted-foreground">{tr('Gross Value:', 'القيمة الإجمالية:', 'Valeur brute :')}</div>
                  <div className="text-lg font-bold text-emerald-600">
                    {totalGrossHarvestDzd.toLocaleString()} DZD
                  </div>
                </div>
              </div>
            </div>

            {/* RESULTS BATCH BANNER */}
            <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  {tr('Net Cash from this Truckload (After Transport):', 'صافي العائد المالي بعد خصم النقل:', 'Net en poche (Après transport) :')}
                </div>
                <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {netHarvestAfterTransportDzd.toLocaleString()} <span className="text-sm font-bold">DZD</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  ~{(netHarvestAfterTransportDzd / 10000).toLocaleString()} {tr('Million Centimes', 'مليون سنتيم', 'Centimes')}
                </div>
              </div>

              <Button
                type="button"
                onClick={handleSaveHarvestToFieldBook}
                className="h-10 px-4 gap-2 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                {savedBatchSuccess ? <Check className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                <span>
                  {savedBatchSuccess
                    ? tr('Saved to Field Book!', 'تم الحفظ في سجل الحقل!', 'Enregistré au carnet !')
                    : tr('Save to Farm Record Book', 'حفظ الحصاد في سجل الحقل', 'Enregistrer au carnet de champ')}
                </span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
