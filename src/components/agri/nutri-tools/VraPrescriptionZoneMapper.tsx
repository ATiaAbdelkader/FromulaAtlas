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
  Map,
  Layers,
  Sparkles,
  Sliders,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  TrendingDown,
  DollarSign,
  Leaf,
  Tractor,
  Activity,
  Maximize2,
  Percent,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation, copyFor } from '@/lib/language-store';

export interface ManagementZone {
  id: string;
  name: string;
  name_ar: string;
  name_fr: string;
  color: string;
  areaHa: number;
  ndvi: number; // 0.0 to 1.0 (Vegetation vigor)
  soilOM: number; // %
  soilCEC: number; // meq/100g
  targetYieldTPerHa: number;
  // Recommended variable rate (kg/ha)
  prescribedN: number;
  prescribedP2O5: number;
  prescribedK2O: number;
  prescribedLime: number; // kg/ha
}

export function VraPrescriptionZoneMapper() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const isAr = language === 'ar';
  const isFr = language === 'fr';

  // Field & Machine Config
  const [fieldName, setFieldName] = useState<string>('Pivot 04 - Sector West (48.0 Ha)');
  const [totalFieldAreaHa, setTotalFieldAreaHa] = useState<number>(48.0);
  const [crop, setCrop] = useState<string>('Wheat / Maize Rotation');
  const [fertilizerCostPerKgN, setFertilizerCostPerKgN] = useState<number>(1.2); // $ or equivalent per kg N
  const [fertilizerCostPerKgP, setFertilizerCostPerKgP] = useState<number>(1.6);
  const [fertilizerCostPerKgK, setFertilizerCostPerKgK] = useState<number>(1.4);

  // Baseline Uniform Flat-Rate Strategy
  const [flatRateN, setFlatRateN] = useState<number>(180); // kg N/ha
  const [flatRateP, setFlatRateP] = useState<number>(80); // kg P2O5/ha
  const [flatRateK, setFlatRateK] = useState<number>(120); // kg K2O/ha

  // Management Zones
  const [zones, setZones] = useState<ManagementZone[]>([
    {
      id: 'z1',
      name: 'Zone 1: High Vigor & Deep Silt Loam',
      name_ar: 'المنطقة 1: نشاط خضري مرتفع وتربة عميقة خصبة',
      name_fr: 'Zone 1 : Haute Vigueur & Limon Profond',
      color: '#16a34a', // Emerald
      areaHa: 16.5,
      ndvi: 0.82,
      soilOM: 3.4,
      soilCEC: 22,
      targetYieldTPerHa: 9.5,
      prescribedN: 195,
      prescribedP2O5: 50,
      prescribedK2O: 90,
      prescribedLime: 0,
    },
    {
      id: 'z2',
      name: 'Zone 2: Moderate Vigor / Average Texture',
      name_ar: 'المنطقة 2: نمو متوسط وقوام طيني متوسط',
      name_fr: 'Zone 2 : Vigueur Moyenne / Texture Équilibrée',
      color: '#3b82f6', // Blue
      areaHa: 19.0,
      ndvi: 0.65,
      soilOM: 2.3,
      soilCEC: 16,
      targetYieldTPerHa: 7.8,
      prescribedN: 170,
      prescribedP2O5: 75,
      prescribedK2O: 120,
      prescribedLime: 500,
    },
    {
      id: 'z3',
      name: 'Zone 3: Sandy Ridge / Low OM (Leaching Risk)',
      name_ar: 'المنطقة 3: مرتفع رملي فقير في المادة العضوية (معرض للغسيل)',
      name_fr: 'Zone 3 : Crête Sableuse / Faible MO',
      color: '#f59e0b', // Amber
      areaHa: 8.5,
      ndvi: 0.44,
      soilOM: 1.2,
      soilCEC: 9,
      targetYieldTPerHa: 5.2,
      prescribedN: 130, // Reduced to prevent leaching
      prescribedP2O5: 90, // Higher starter P
      prescribedK2O: 150,
      prescribedLime: 1200,
    },
    {
      id: 'z4',
      name: 'Zone 4: Heavy Clay Depression / Compaction',
      name_ar: 'المنطقة 4: منخفض طيني ثقيل مع اندماج في التربة',
      name_fr: 'Zone 4 : Bas-fond Argileux / Compacté',
      color: '#8b5cf6', // Purple
      areaHa: 4.0,
      ndvi: 0.52,
      soilOM: 2.8,
      soilCEC: 26,
      targetYieldTPerHa: 6.5,
      prescribedN: 150,
      prescribedP2O5: 60,
      prescribedK2O: 100,
      prescribedLime: 800,
    },
  ]);

  // Update a zone parameter
  const handleUpdateZone = (id: string, field: keyof ManagementZone, value: any) => {
    setZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, [field]: value } : z))
    );
  };

  // ==========================================================================
  // Economic & Ecological Savings Calculations (VRA vs Flat Rate)
  // ==========================================================================
  const comparisonStats = useMemo(() => {
    // Flat Rate Totals
    const flatTotalN = flatRateN * totalFieldAreaHa;
    const flatTotalP = flatRateP * totalFieldAreaHa;
    const flatTotalK = flatRateK * totalFieldAreaHa;
    const flatTotalCost =
      flatTotalN * fertilizerCostPerKgN +
      flatTotalP * fertilizerCostPerKgP +
      flatTotalK * fertilizerCostPerKgK;

    // VRA Prescribed Totals
    let vraTotalN = 0;
    let vraTotalP = 0;
    let vraTotalK = 0;
    let vraTotalLime = 0;

    zones.forEach((z) => {
      vraTotalN += z.prescribedN * z.areaHa;
      vraTotalP += z.prescribedP2O5 * z.areaHa;
      vraTotalK += z.prescribedK2O * z.areaHa;
      vraTotalLime += z.prescribedLime * z.areaHa;
    });

    const vraTotalCost =
      vraTotalN * fertilizerCostPerKgN +
      vraTotalP * fertilizerCostPerKgP +
      vraTotalK * fertilizerCostPerKgK;

    const netCostSavings = flatTotalCost - vraTotalCost;
    const nSavingsKg = flatTotalN - vraTotalN;
    const nSavingsPct = Math.round((nSavingsKg / flatTotalN) * 100);

    // CO2e emissions avoided (approx 3.5 kg CO2e per kg synthetic N fertilizer manufactured and applied)
    const co2eAvoidedKg = Math.round(nSavingsKg * 3.5);

    return {
      flatTotalN: Math.round(flatTotalN),
      flatTotalP: Math.round(flatTotalP),
      flatTotalK: Math.round(flatTotalK),
      flatTotalCost: Math.round(flatTotalCost),

      vraTotalN: Math.round(vraTotalN),
      vraTotalP: Math.round(vraTotalP),
      vraTotalK: Math.round(vraTotalK),
      vraTotalLime: Math.round(vraTotalLime),
      vraTotalCost: Math.round(vraTotalCost),

      netCostSavings: Math.round(netCostSavings),
      nSavingsKg: Math.round(nSavingsKg),
      nSavingsPct,
      co2eAvoidedKg,
    };
  }, [
    zones,
    totalFieldAreaHa,
    flatRateN,
    flatRateP,
    flatRateK,
    fertilizerCostPerKgN,
    fertilizerCostPerKgP,
    fertilizerCostPerKgK,
  ]);

  // Export CSV Grid prescription
  const handleExportCSV = () => {
    const header = 'Zone_ID,Zone_Name,Area_Ha,NDVI,Soil_OM_Pct,Soil_CEC,Target_Yield_tHa,Prescribed_N_kgHa,Prescribed_P2O5_kgHa,Prescribed_K2O_kgHa,Prescribed_Lime_kgHa\n';
    const rows = zones
      .map(
        (z) =>
          `"${z.id}","${z.name}",${z.areaHa},${z.ndvi},${z.soilOM},${z.soilCEC},${z.targetYieldTPerHa},${z.prescribedN},${z.prescribedP2O5},${z.prescribedK2O},${z.prescribedLime}`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `VRA_Prescription_${fieldName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: tr('Prescription Exported', 'تم تصدير خريطة الوصفة', 'Prescription exportée'),
      description: tr('ISO-XML / Shapefile compatible CSV downloaded.', 'تم تحميل ملف CSV المتوافق مع شاشات الجرارات الذكية.', 'Fichier CSV téléchargé.'),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-border shadow-xs bg-gradient-to-r from-purple-50/70 via-background to-emerald-50/70 dark:from-purple-950/20 dark:via-background dark:to-emerald-950/20">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
                <Map className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-foreground">
                  {tr(
                    'Variable Rate Application (VRA) Prescription & Zone Mapper',
                    'خريطة التسميد المتغير حسب المناطق (VRA Prescription Mapper)',
                    'Cartographie & Prescription à Taux Variable (VRA)'
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  {tr(
                    'Segment parcels into NDVI vigor and soil texture zones, calculate variable N-P-K doses, and quantify ROI vs uniform application.',
                    'تقسيم الحقل إلى مناطق تجانس حسب مؤشر الغطاء النباتي (NDVI) وخصائص التربة لتطبيق جرعات متغيرة وتوفير التكاليف وحماية البيئة.',
                    'Zonage intra-parcellaire, modulation de dose N-P-K et calcul du retour sur investissement.'
                  )}
                </CardDescription>
              </div>
            </div>

            <Button
              onClick={handleExportCSV}
              className="h-9 gap-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-xs"
            >
              <Download className="h-4 w-4" />
              {tr('Export Tractor Prescription (CSV)', 'تصدير خريطة التسميد (CSV)', 'Exporter Prescription')}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Machine & Field Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-card border text-xs">
            <div>
              <Label className="text-[10px] text-muted-foreground">{tr('Field / Parcel', 'الحقل / القطعة', 'Parcelle')}</Label>
              <Input value={fieldName} onChange={(e) => setFieldName(e.target.value)} className="h-8 text-xs font-bold mt-0.5" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">{tr('Total Parcel Area (Ha)', 'المساحة الكلية (هكتار)', 'Surface Totale (Ha)')}</Label>
              <Input
                type="number"
                step="0.5"
                value={totalFieldAreaHa}
                onChange={(e) => setTotalFieldAreaHa(Number(e.target.value) || 40)}
                className="h-8 text-xs font-mono font-bold mt-0.5"
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">{tr('Target Crop', 'المحصول', 'Culture')}</Label>
              <Input value={crop} onChange={(e) => setCrop(e.target.value)} className="h-8 text-xs mt-0.5" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">{tr('Flat Rate N Benchmark (kg/ha)', 'معدل النيتروجين الثابت للمقارنة', 'Dose N Uniforme')}</Label>
              <Input
                type="number"
                value={flatRateN}
                onChange={(e) => setFlatRateN(Number(e.target.value) || 180)}
                className="h-8 text-xs font-mono font-bold mt-0.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ROI & Savings Hero Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border shadow-xs bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200">
          <CardContent className="p-4 space-y-1">
            <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
              <span>{tr('Total Input Cost Savings', 'صافي الوفر المالي للتسميد', 'Économie Financière')}</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
              ${comparisonStats.netCostSavings.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {tr('Across', 'على كامل مساحة', 'Sur')} {totalFieldAreaHa} Ha vs {tr('Flat Uniform Rate', 'التطبيق الثابت', 'Taux fixe')}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-blue-50/70 dark:bg-blue-950/20 border-blue-200">
          <CardContent className="p-4 space-y-1">
            <div className="text-xs font-semibold text-blue-900 dark:text-blue-300 flex items-center justify-between">
              <span>{tr('Nitrogen Fertilizer Saved', 'النيتروجين الموفر', 'N Économisé')}</span>
              <TrendingDown className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black font-mono text-blue-700 dark:text-blue-400">
              {comparisonStats.nSavingsKg.toLocaleString()} <span className="text-xs font-normal">kg N</span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {comparisonStats.nSavingsPct}% {tr('reduction in over-fertilization', 'تقليل في الهدر والتسميد الزائد', 'de réduction')}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-purple-50/70 dark:bg-purple-950/20 border-purple-200">
          <CardContent className="p-4 space-y-1">
            <div className="text-xs font-semibold text-purple-900 dark:text-purple-300 flex items-center justify-between">
              <span>{tr('CO₂e Emissions Avoided', 'انبعاثات الكربون المتجنبة', 'CO₂e Évité')}</span>
              <Leaf className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black font-mono text-purple-700 dark:text-purple-400">
              {(comparisonStats.co2eAvoidedKg / 1000).toFixed(1)} <span className="text-xs font-normal">t CO₂e</span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {tr('Reduced Haber-Bosch synthesis footprint', 'خفض البصمة الكربونية للتصنيع الكيميائي', 'Empreinte synthèse réduite')}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-amber-50/70 dark:bg-amber-950/20 border-amber-200">
          <CardContent className="p-4 space-y-1">
            <div className="text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-center justify-between">
              <span>{tr('Precision Agronomic ROI', 'العائد الاستثماري للدقة', 'ROI Modulation')}</span>
              <Activity className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-700 dark:text-amber-400">
              +${(comparisonStats.netCostSavings / totalFieldAreaHa).toFixed(1)} <span className="text-xs font-normal">/ Ha</span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {tr('Net gain per hectare', 'ربح إضافي صافٍ لكل هكتار', 'Gain net par hectare')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spatial Management Zones Map & Table */}
      <Card className="border shadow-xs">
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-600" />
                {tr('Intra-Parcel Management Zones Prescription Matrix', 'مصفوفة التسميد المتغير حسب مناطق التجانس الحقلية', 'Prescriptions par Zone')}
              </CardTitle>
              <CardDescription className="text-xs">
                {tr('Configure variable N-P-K doses according to soil CEC, OM%, and NDVI vigor.', 'تعديل الجرعات بحسب السعة التبادلية ونسبة المادة العضوية ونشاط النبات.', 'Ajustez les doses par zone.')}
              </CardDescription>
            </div>

            {/* Visual Zone Proportion Bar */}
            <div className="h-3 w-64 rounded-full overflow-hidden flex bg-muted">
              {zones.map((z) => (
                <div
                  key={z.id}
                  style={{ width: `${(z.areaHa / totalFieldAreaHa) * 100}%`, backgroundColor: z.color }}
                  title={`${z.name}: ${z.areaHa} Ha`}
                />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/70 text-[11px] text-muted-foreground border-b">
                <tr>
                  <th className="p-3">{tr('Management Zone', 'منطقة التجانس', 'Zone')}</th>
                  <th className="p-3 text-right">{tr('Area (Ha)', 'المساحة (هكتار)', 'Surface')}</th>
                  <th className="p-3 text-center">NDVI</th>
                  <th className="p-3 text-center">{tr('Soil OM (%)', 'المادة العضوية (%)', 'MO (%)')}</th>
                  <th className="p-3 text-center">CEC</th>
                  <th className="p-3 text-right font-bold text-blue-600">Prescribed N (kg/ha)</th>
                  <th className="p-3 text-right font-bold text-amber-600">P₂O₅ (kg/ha)</th>
                  <th className="p-3 text-right font-bold text-red-600">K₂O (kg/ha)</th>
                  <th className="p-3 text-right font-bold">Lime (kg/ha)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {zones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-muted/20">
                    <td className="p-3 font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: zone.color }} />
                        <span className="text-foreground">{isAr ? zone.name_ar : isFr ? zone.name_fr : zone.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold">
                      <div className="flex items-center justify-end gap-1">
                        <Input
                          type="number"
                          step="0.5"
                          value={zone.areaHa}
                          onChange={(e) => handleUpdateZone(zone.id, 'areaHa', Number(e.target.value))}
                          className="h-7 w-16 text-right font-mono font-bold"
                        />
                        <span className="text-[10px] text-muted-foreground">Ha</span>
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono font-bold">{zone.ndvi}</td>
                    <td className="p-3 text-center font-mono">{zone.soilOM}%</td>
                    <td className="p-3 text-center font-mono">{zone.soilCEC}</td>
                    <td className="p-3 text-right">
                      <Input
                        type="number"
                        value={zone.prescribedN}
                        onChange={(e) => handleUpdateZone(zone.id, 'prescribedN', Number(e.target.value))}
                        className="h-7 w-20 text-right font-mono font-bold text-blue-600 bg-blue-50/50 dark:bg-blue-950/20"
                      />
                    </td>
                    <td className="p-3 text-right">
                      <Input
                        type="number"
                        value={zone.prescribedP2O5}
                        onChange={(e) => handleUpdateZone(zone.id, 'prescribedP2O5', Number(e.target.value))}
                        className="h-7 w-20 text-right font-mono font-bold text-amber-600 bg-amber-50/50 dark:bg-amber-950/20"
                      />
                    </td>
                    <td className="p-3 text-right">
                      <Input
                        type="number"
                        value={zone.prescribedK2O}
                        onChange={(e) => handleUpdateZone(zone.id, 'prescribedK2O', Number(e.target.value))}
                        className="h-7 w-20 text-right font-mono font-bold text-red-600 bg-red-50/50 dark:bg-red-950/20"
                      />
                    </td>
                    <td className="p-3 text-right">
                      <Input
                        type="number"
                        value={zone.prescribedLime}
                        onChange={(e) => handleUpdateZone(zone.id, 'prescribedLime', Number(e.target.value))}
                        className="h-7 w-20 text-right font-mono font-bold text-foreground"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
