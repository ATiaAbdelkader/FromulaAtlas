'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Printer,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Clock,
  User,
  MapPin,
  Sparkles,
  Tractor,
  Droplets,
  Wind,
} from 'lucide-react';
import { useTranslation, copyFor } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';

export interface WorkOrderItem {
  productName: string;
  formulation: string;
  ratePerHa: number;
  unit: 'kg/ha' | 'L/ha' | 'g/ha';
  tank: string;
  notes: string;
}

export function AgronomicWorkOrderGenerator() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const isAr = language === 'ar';
  const isFr = language === 'fr';

  // Header & Farm Details
  const [farmName, setFarmName] = useState<string>('Domaine Agro-Mitidja / Parcel 04');
  const [agronomistName, setAgronomistName] = useState<string>('Dr. K. Benali (Lead Agronomist)');
  const [operatorName, setOperatorName] = useState<string>('Ahmed M. (Irrigation Tech)');
  const [executionDate, setExecutionDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [crop, setCrop] = useState<string>('Tomato (Drip Fertigation)');
  const [growthStage, setGrowthStage] = useState<string>('Fruit Sizing / High Potassium Demand');
  const [parcelAreaHa, setParcelAreaHa] = useState<number>(4.5);
  const [waterVolumeM3, setWaterVolumeM3] = useState<number>(45); // m3 total irrigation

  // Work Order Type
  const [taskType, setTaskType] = useState<'fertigation' | 'foliar' | 'basal' | 'amendment'>('fertigation');

  // Safety & Weather Requirements
  const [reEntryHours, setReEntryHours] = useState<number>(12);
  const [maxWindSpeedKmh, setMaxWindSpeedKmh] = useState<number>(15);
  const [targetEC, setTargetEC] = useState<number>(2.3);
  const [targetPH, setTargetPH] = useState<number>(5.8);

  // Fertilizer / Input Items
  const [items, setItems] = useState<WorkOrderItem[]>([
    {
      productName: 'Calcium Nitrate Greenhouse Grade',
      formulation: '15.5-0-0 + 26.5% CaO',
      ratePerHa: 25.0,
      unit: 'kg/ha',
      tank: 'Tank A',
      notes: 'Dissolve fully before injection',
    },
    {
      productName: 'Potassium Nitrate (KNO3)',
      formulation: '13-0-46',
      ratePerHa: 20.0,
      unit: 'kg/ha',
      tank: 'Tank A',
      notes: 'Split injection over last 60% of irrigation cycle',
    },
    {
      productName: 'Monopotassium Phosphate (MKP)',
      formulation: '0-52-34',
      ratePerHa: 12.0,
      unit: 'kg/ha',
      tank: 'Tank B',
      notes: 'Keep strictly separated from Tank A',
    },
    {
      productName: 'Magnesium Sulfate (Epsom Salt)',
      formulation: '16% MgO + 32% SO3',
      ratePerHa: 15.0,
      unit: 'kg/ha',
      tank: 'Tank B',
      notes: 'Dissolve in Tank B with MKP',
    },
    {
      productName: 'Iron Chelate (Fe-EDDHA 6%)',
      formulation: '6% Fe o-o',
      ratePerHa: 0.8,
      unit: 'kg/ha',
      tank: 'Tank A',
      notes: 'Add to Tank A with Calcium Nitrate',
    },
  ]);

  const [specialInstructions, setSpecialInstructions] = useState<string>(
    'Start clean water flush for 15 minutes before injection. Inject stock solutions over 45 minutes, followed by 20 minutes clean water line flush to clear drip emitters.'
  );

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productName: 'Soluble Fertilizer',
        formulation: '20-20-20 + TE',
        ratePerHa: 10,
        unit: 'kg/ha',
        tank: 'Tank B',
        notes: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof WorkOrderItem, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <Card className="border-border shadow-xs bg-gradient-to-r from-slate-50/80 via-background to-emerald-50/80 dark:from-slate-950/30 dark:via-background dark:to-emerald-950/30">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-slate-800 text-white shadow-xs">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-foreground">
                  {tr(
                    'Exportable Agronomic Prescription & Field Work Order Generator',
                    'منشئ أوامر العمل الحقلي والوصفات السمادية الاحترافية للطباعة',
                    'Générateur d’Ordre de Travail & Prescription Agronomique'
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  {tr(
                    'Generate formal field task orders with chemical recipes, safety PPE, REI intervals, and operator execution checklists.',
                    'إنشاء أوامر تنفيذية موثقة لفرق العمل بالمزرعة متضمنة الكميات الإجمالية، الخزانات، شروط الأمان، وفترة الأمان قبل الدخول (REI).',
                    'Édition d’ordres de mission terrain, dosages totaux, consignes de sécurité et fiches d’émargement.'
                  )}
                </CardDescription>
              </div>
            </div>

            <Button
              onClick={() => window.print()}
              className="h-9 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <Printer className="h-4 w-4" />
              {tr('Print / Export Work Order (PDF)', 'طباعة أمر العمل (PDF)', 'Imprimer / Exporter')}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Metadata Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 p-3 rounded-xl bg-card border text-xs">
            <div>
              <Label className="text-[10px] text-muted-foreground">{tr('Farm / Parcel', 'المزرعة / القطعة', 'Domaine / Parcelle')}</Label>
              <Input value={farmName} onChange={(e) => setFarmName(e.target.value)} className="h-8 text-xs font-bold mt-0.5" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">{tr('Agronomist', 'المهندس المشرف', 'Agronome')}</Label>
              <Input value={agronomistName} onChange={(e) => setAgronomistName(e.target.value)} className="h-8 text-xs mt-0.5" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">{tr('Field Operator', 'فني التنفيذ', 'Opérateur')}</Label>
              <Input value={operatorName} onChange={(e) => setOperatorName(e.target.value)} className="h-8 text-xs mt-0.5" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">{tr('Execution Date', 'تاريخ التنفيذ', 'Date')}</Label>
              <Input type="date" value={executionDate} onChange={(e) => setExecutionDate(e.target.value)} className="h-8 text-xs font-mono mt-0.5" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">{tr('Parcel Area (Hectares)', 'المساحة (هكتار)', 'Surface (Ha)')}</Label>
              <Input
                type="number"
                step="0.1"
                value={parcelAreaHa}
                onChange={(e) => setParcelAreaHa(Number(e.target.value) || 1)}
                className="h-8 text-xs font-mono font-bold mt-0.5"
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">{tr('Task Type', 'نوع المعاملة', 'Type')}</Label>
              <Select value={taskType} onValueChange={(v: any) => setTaskType(v)}>
                <SelectTrigger className="h-8 text-xs font-bold mt-0.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fertigation">Drip Fertigation</SelectItem>
                  <SelectItem value="foliar">Foliar Spray</SelectItem>
                  <SelectItem value="basal">Basal Soil Application</SelectItem>
                  <SelectItem value="amendment">Soil Amendment (Lime/Gypsum)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Printable Work Order Document */}
      <Card className="border shadow-sm print:border-none print:shadow-none bg-card">
        <CardContent className="p-6 sm:p-8 space-y-6 text-xs font-sans">
          {/* Header Banner for Print */}
          <div className="border-b pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <div className="text-xl font-black tracking-tight text-foreground uppercase">
                {tr('Agronomic Field Work Order & Prescription', 'أمر تشغيل ووصفة تسميد حقلية رسمية', 'Ordre de Mission & Prescription Agronomique')}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Ref: WO-{executionDate.replace(/-/g, '')}-{(parcelAreaHa * 10).toFixed(0)} · NutriPlant PRO Suite
              </div>
            </div>
            <Badge className="bg-slate-900 text-white font-mono text-xs px-3 py-1 uppercase">
              {taskType}
            </Badge>
          </div>

          {/* Key Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-muted/40 border">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase">{tr('Target Parcel & Area', 'القطعة والمساحة', 'Parcelle & Surface')}</span>
              <div className="font-bold text-sm text-foreground">{farmName} ({parcelAreaHa} Ha)</div>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase">{tr('Target Crop & Stage', 'المحصول والمرحلة', 'Culture & Stade')}</span>
              <div className="font-bold text-sm text-foreground">{crop}</div>
              <div className="text-[10px] text-muted-foreground">{growthStage}</div>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase">{tr('Target Delivered EC / pH', 'الناقلية والحموضة المستهدفة', 'CE & pH Cibles')}</span>
              <div className="font-bold text-sm text-emerald-600 font-mono">EC {targetEC} dS/m · pH {targetPH}</div>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase">{tr('Safety Re-entry (REI)', 'فترة الأمان لإعادة الدخول (REI)', 'Délai Réentrée (DRE)')}</span>
              <div className="font-bold text-sm text-amber-600 flex items-center gap-1 font-mono">
                <ShieldCheck className="h-3.5 w-3.5" />
                {reEntryHours} Hours
              </div>
            </div>
          </div>

          {/* Product Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Tractor className="h-4 w-4 text-emerald-600" />
                {tr('Input Application Rates & Total Batch Quantities', 'الأسمدة والجرعات والكمية الإجمالية المطلوبة', 'Produits & Doses Totales')}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddItem}
                className="h-7 text-xs font-semibold print:hidden"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {tr('Add Product Line', 'إضافة صنف سماد', 'Ajouter ligne')}
              </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/70 text-[11px] text-muted-foreground border-b">
                  <tr>
                    <th className="p-2.5">{tr('Product Name', 'اسم السماد / المادة', 'Produit')}</th>
                    <th className="p-2.5">{tr('Formulation / Composition', 'التركيب الكيميائي', 'Formulation')}</th>
                    <th className="p-2.5 text-center">{tr('Tank', 'الخزان', 'Bac')}</th>
                    <th className="p-2.5 text-right">{tr('Rate / Ha', 'الجرعة / هكتار', 'Dose/Ha')}</th>
                    <th className="p-2.5 text-right font-bold text-foreground bg-emerald-50/50 dark:bg-emerald-950/30">
                      {tr('Total Batch for Parcel', 'الكمية الإجمالية للقطعة', 'Quantité Totale')}
                    </th>
                    <th className="p-2.5 print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item, idx) => {
                    const totalQty = Math.round(item.ratePerHa * parcelAreaHa * 10) / 10;
                    return (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="p-2.5">
                          <Input
                            value={item.productName}
                            onChange={(e) => handleUpdateItem(idx, 'productName', e.target.value)}
                            className="h-7 text-xs font-bold print:border-none print:p-0"
                          />
                        </td>
                        <td className="p-2.5">
                          <Input
                            value={item.formulation}
                            onChange={(e) => handleUpdateItem(idx, 'formulation', e.target.value)}
                            className="h-7 text-xs font-mono text-muted-foreground print:border-none print:p-0"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {item.tank}
                          </Badge>
                        </td>
                        <td className="p-2.5 text-right font-mono">
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              type="number"
                              step="0.1"
                              value={item.ratePerHa}
                              onChange={(e) => handleUpdateItem(idx, 'ratePerHa', Number(e.target.value))}
                              className="h-7 w-16 text-right font-mono font-bold print:border-none print:p-0"
                            />
                            <span className="text-[10px] text-muted-foreground">{item.unit}</span>
                          </div>
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-sm text-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20">
                          {totalQty} {item.unit.split('/')[0]}
                        </td>
                        <td className="p-2.5 text-right print:hidden">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveItem(idx)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operational & Safety Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2">
              <span className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                {tr('Special Application Instructions & Injection Sequence', 'تعليمات الخلط وترتيب الحقن الحقلي', 'Consignes d’Injection')}
              </span>
              <Textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="min-h-16 text-xs print:border-none print:p-0"
              />
            </div>

            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2">
              <span className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                {tr('Operator Safety, PPE & Weather Constraints', 'معدات الوقاية الشخصية والاشتراطات الجوية', 'EPI & Météo')}
              </span>
              <div className="space-y-1.5 text-[11px] text-muted-foreground">
                <div>• {tr('Mandatory PPE: Chemical gloves, eye goggles, protective apron when handling concentrated acids.', 'الوقاية: قفازات كيميائية، نظارات واقية، مريول عازل عند التعامل مع الأحماض.', 'EPI obligatoire : Gants, lunettes.')}</div>
                <div>• {tr('Max Allowable Wind Speed: 15 km/h (avoid drift during foliar operations).', 'أقصى سرعة رياح مسموحة: 15 كم/سا.', 'Vent max : 15 km/h.')}</div>
                <div>• {tr('Irrigation Line Pressure: Verify drip line operating pressure is 1.0 - 1.2 bar.', 'ضغط الشبكة: تأكد من ضغط 1.0 - 1.2 بار عند أبعد نقطة.', 'Pression ligne : 1.0 - 1.2 bar.')}</div>
              </div>
            </div>
          </div>

          {/* Signatures & Execution Sign-off Block */}
          <div className="pt-4 border-t grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs">
            <div className="space-y-4">
              <span className="text-[10px] text-muted-foreground uppercase">{tr('Prescribed by (Agronomist)', 'إعداد المهندس الزراعي', 'Prescrit par (Agronome)')}</span>
              <div className="font-bold">{agronomistName}</div>
              <div className="border-b border-dashed pt-4"></div>
              <span className="text-[9px] text-muted-foreground">Signature & Date</span>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] text-muted-foreground uppercase">{tr('Executed by (Operator)', 'تنفيذ الفني المسؤول', 'Exécuté par (Opérateur)')}</span>
              <div className="font-bold">{operatorName}</div>
              <div className="border-b border-dashed pt-4"></div>
              <span className="text-[9px] text-muted-foreground">Signature & Start/End Time</span>
            </div>

            <div className="space-y-4 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-muted-foreground uppercase">{tr('Quality & Delivery Verification', 'التحقق والمطابقة الحقلية', 'Contrôle Qualité')}</span>
              <div className="space-y-1 text-[11px]">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" defaultChecked className="rounded text-emerald-600" />
                  <span>{tr('Delivered EC verified at drippers', 'تم فحص الـ EC عند النقاطات', 'CE vérifiée')}</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" defaultChecked className="rounded text-emerald-600" />
                  <span>{tr('Clean water line flush completed', 'تم غسيل الخطوط بماء نظيف', 'Rinçage effectué')}</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
