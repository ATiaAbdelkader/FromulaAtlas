'use client';

import React, { useState } from 'react';
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
  ClipboardList,
  Printer,
  Plus,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Tractor,
  Copy,
  RotateCcw,
} from 'lucide-react';
import { useTranslation, copyFor } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

const TITLE: TrilingualString = {
  en: 'Agronomic Field Work Order Generator',
  ar: 'منشئ أوامر العمل الحقلي والوصفات السمادية',
  fr: 'Générateur d’Ordre de Travail Agronomique',
};

const DESC: TrilingualString = {
  en: 'Generate formal field task orders with chemical recipes, safety PPE, REI intervals, and operator execution checklists. Print-ready.',
  ar: 'إنشاء أوامر تنفيذية موثقة لفرق العمل بالمزرعة متضمنة الكميات الإجمالية، الخزانات، شروط الأمان، وفترة الأمان قبل الدخول (REI). جاهز للطباعة.',
  fr: 'Édition d’ordres de mission terrain, dosages totaux, consignes de sécurité et fiches d’émargement. Prêt à imprimer.',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Total batch = rate/ha × parcel area (ha). For fertigation, inject stock solutions over 45 min with 15 min pre-flush and 20 min post-flush to clear drip emitters. REI (Re-entry Interval) is mandatory after chemical application. Max wind 15 km/h for foliar operations to avoid drift.',
  ar: 'الكمية الإجمالية = الجرعة/هكتار × مساحة القطعة (هكتار). للسمادة، تُحقن محاليل الأم خلال 45 دقيقة مع غسل مسبق 15 دقيقة وغسل لاحق 20 دقيقة لتنظيف النقاطات. فترة إعادة الدخول (REI) إلزامية بعد التطبيق الكيميائي. أقصى رياح 15 كم/سا للعمليات الورقية لتفادي الانجراف.',
  fr: 'Quantité totale = dose/ha × surface parcelle (ha). Pour la fertigation, injecter les solutions mères sur 45 min avec prérinçage 15 min et postrinçage 20 min pour nettoyer les goutteurs. DRE (Délai de Réentrée) obligatoire après application chimique. Vent max 15 km/h pour les applications foliaires pour éviter la dérive.',
};

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

  // Header & Farm Details
  const [farmName, setFarmName] = useState<string>('Domaine Agro-Mitidja / Parcel 04');
  const [agronomistName, setAgronomistName] = useState<string>('Dr. K. Benali (Lead Agronomist)');
  const [operatorName, setOperatorName] = useState<string>('Ahmed M. (Irrigation Tech)');
  const [executionDate, setExecutionDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [crop, setCrop] = useState<string>('Tomato (Drip Fertigation)');
  const [growthStage, setGrowthStage] = useState<string>('Fruit Sizing / High Potassium Demand');
  const [parcelAreaHa, setParcelAreaHa] = useState<number>(4.5);
  const [waterVolumeM3, setWaterVolumeM3] = useState<number>(45);

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

  // ============================================================================
  // Hero actions
  // ============================================================================
  const handleCopy = () => {
    const ref = `WO-${executionDate.replace(/-/g, '')}-${(parcelAreaHa * 10).toFixed(0)}`;
    const itemsText = items
      .map((it, i) => `  ${i + 1}. ${it.productName} [${it.formulation}] → ${it.ratePerHa} ${it.unit} × ${parcelAreaHa} ha = ${(Math.round(it.ratePerHa * parcelAreaHa * 10) / 10)} ${it.unit.split('/')[0]} (Tank ${it.tank})`)
      .join('\n');
    const text =
      `=== AGRONOMIC WORK ORDER ===\n` +
      `Ref: ${ref}\n` +
      `Farm: ${farmName} (${parcelAreaHa} ha)\n` +
      `Crop: ${crop} — ${growthStage}\n` +
      `Date: ${executionDate}\n` +
      `Type: ${taskType}\n` +
      `Agronomist: ${agronomistName} · Operator: ${operatorName}\n` +
      `Target: EC ${targetEC} dS/m · pH ${targetPH}\n` +
      `REI: ${reEntryHours} h · Max wind: ${maxWindSpeedKmh} km/h · Water: ${waterVolumeM3} m³\n\n` +
      `Products:\n${itemsText}\n\n` +
      `Special instructions:\n${specialInstructions}`.trim();
    navigator.clipboard.writeText(text);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
  };

  const handleReset = () => {
    setFarmName('Domaine Agro-Mitidja / Parcel 04');
    setAgronomistName('Dr. K. Benali (Lead Agronomist)');
    setOperatorName('Ahmed M. (Irrigation Tech)');
    setExecutionDate(new Date().toISOString().slice(0, 10));
    setCrop('Tomato (Drip Fertigation)');
    setGrowthStage('Fruit Sizing / High Potassium Demand');
    setParcelAreaHa(4.5);
    setWaterVolumeM3(45);
    setTaskType('fertigation');
    setReEntryHours(12);
    setMaxWindSpeedKmh(15);
    setTargetEC(2.3);
    setTargetPH(5.8);
    setItems([
      { productName: 'Calcium Nitrate Greenhouse Grade', formulation: '15.5-0-0 + 26.5% CaO', ratePerHa: 25.0, unit: 'kg/ha', tank: 'Tank A', notes: 'Dissolve fully before injection' },
      { productName: 'Potassium Nitrate (KNO3)', formulation: '13-0-46', ratePerHa: 20.0, unit: 'kg/ha', tank: 'Tank A', notes: 'Split injection over last 60% of irrigation cycle' },
      { productName: 'Monopotassium Phosphate (MKP)', formulation: '0-52-34', ratePerHa: 12.0, unit: 'kg/ha', tank: 'Tank B', notes: 'Keep strictly separated from Tank A' },
    ]);
    setSpecialInstructions('Start clean water flush for 15 minutes before injection. Inject stock solutions over 45 minutes, followed by 20 minutes clean water line flush to clear drip emitters.');
    toast({ title: tr('Reset to defaults', 'إعادة للقيم الافتراضية', 'Réinitialisé') });
  };

  // Derived totals
  const totalBatchKg = items
    .filter(it => it.unit === 'kg/ha')
    .reduce((s, it) => s + it.ratePerHa * parcelAreaHa, 0);
  const totalBatchL = items
    .filter(it => it.unit === 'L/ha')
    .reduce((s, it) => s + it.ratePerHa * parcelAreaHa, 0);
  const totalBatchG = items
    .filter(it => it.unit === 'g/ha')
    .reduce((s, it) => s + it.ratePerHa * parcelAreaHa, 0);

  return (
    <CalculatorShell
      icon={ClipboardList}
      title={TITLE}
      description={DESC}
      badge={tr('Printable', 'قابل للطباعة', 'Imprimable')}
      accent="emerald"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
          onClick: handleCopy,
          variant: 'primary',
        },
        {
          icon: Printer,
          label: { en: 'Print / PDF', ar: 'طباعة / PDF', fr: 'Imprimer / PDF' },
          onClick: () => window.print(),
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      protocolNote={PROTOCOL_NOTE}
    >
      {/* Inputs: metadata + safety + crop */}
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-emerald-600" />
              {tr('Order Metadata', 'بيانات الأمر', 'Métadonnées')}
            </span>
            <Badge variant="outline" className="text-[10px] font-mono uppercase">{taskType}</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{tr('Farm / Parcel', 'المزرعة / القطعة', 'Domaine / Parcelle')}</Label>
              <Input value={farmName} onChange={(e) => setFarmName(e.target.value)} className="h-9 text-xs font-bold" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{tr('Agronomist', 'المهندس المشرف', 'Agronome')}</Label>
              <Input value={agronomistName} onChange={(e) => setAgronomistName(e.target.value)} className="h-9 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{tr('Field Operator', 'فني التنفيذ', 'Opérateur')}</Label>
              <Input value={operatorName} onChange={(e) => setOperatorName(e.target.value)} className="h-9 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{tr('Execution Date', 'تاريخ التنفيذ', 'Date')}</Label>
              <Input type="date" value={executionDate} onChange={(e) => setExecutionDate(e.target.value)} className="h-9 text-xs font-mono" />
            </div>
            <CalculatorShell.InputField
              label={tr('Parcel Area (ha)', 'المساحة (هكتار)', 'Surface (ha)')}
              value={String(parcelAreaHa)}
              onChange={(v) => setParcelAreaHa(Number(v) || 1)}
              step="0.1"
            />
            <CalculatorShell.InputField
              label={tr('Water volume (m³)', 'حجم المياه (م³)', 'Volume eau (m³)')}
              value={String(waterVolumeM3)}
              onChange={(v) => setWaterVolumeM3(Number(v) || 0)}
              step="1"
            />
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{tr('Task Type', 'نوع المعاملة', 'Type')}</Label>
              <Select value={taskType} onValueChange={(v: any) => setTaskType(v)}>
                <SelectTrigger className="h-9 text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fertigation">{tr('Drip Fertigation', 'سمادة بالتنقيط', 'Fertigation')}</SelectItem>
                  <SelectItem value="foliar">{tr('Foliar Spray', 'رش ورقي', 'Pulvérisation foliaire')}</SelectItem>
                  <SelectItem value="basal">{tr('Basal Soil Application', 'إضافة أرضية', 'Application au sol')}</SelectItem>
                  <SelectItem value="amendment">{tr('Soil Amendment (Lime/Gypsum)', 'تعديل التربة (جير/جبس)', 'Amendement (Chaux/Gypse)')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{tr('Crop & Stage', 'المحصول والمرحلة', 'Culture & Stade')}</Label>
              <Input value={crop} onChange={(e) => setCrop(e.target.value)} className="h-9 text-xs" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">{tr('Growth Stage Detail', 'تفاصيل مرحلة النمو', 'Détail stade croissance')}</Label>
            <Input value={growthStage} onChange={(e) => setGrowthStage(e.target.value)} className="h-9 text-xs" />
          </div>

          {/* Safety & EC/pH */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <CalculatorShell.InputField
              label={tr('REI (hours)', 'فترة الأمان (ساعة)', 'DRE (heures)')}
              value={String(reEntryHours)}
              onChange={(v) => setReEntryHours(Number(v) || 0)}
              step="1"
            />
            <CalculatorShell.InputField
              label={tr('Max wind (km/h)', 'أقصى رياح (كم/سا)', 'Vent max (km/h)')}
              value={String(maxWindSpeedKmh)}
              onChange={(v) => setMaxWindSpeedKmh(Number(v) || 0)}
              step="1"
            />
            <CalculatorShell.InputField
              label={tr('Target EC (dS/m)', 'الناقلية (dS/m)', 'CE cible (dS/m)')}
              value={String(targetEC)}
              onChange={(v) => setTargetEC(Number(v) || 0)}
              step="0.1"
            />
            <CalculatorShell.InputField
              label={tr('Target pH', 'الحموضة المستهدفة', 'pH cible')}
              value={String(targetPH)}
              onChange={(v) => setTargetPH(Number(v) || 0)}
              step="0.1"
            />
          </div>
        </div>
      </CalculatorShell.Inputs>

      {/* Results: summary metrics */}
      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-emerald-50 via-transparent to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
            <span className="text-base font-bold flex items-center gap-2">
              ✨ {tr('Order Summary', 'ملخص الأمر', 'Résumé')}
            </span>
            <span className="font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 rounded-lg px-2 py-0.5">
              WO-{executionDate.replace(/-/g, '')}-{(parcelAreaHa * 10).toFixed(0)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CalculatorShell.MetricTile
              label={tr('Products', 'المنتجات', 'Produits')}
              value={items.length}
              color="emerald"
            />
            <CalculatorShell.MetricTile
              label={tr('Total Batch (kg)', 'الكمية الإجمالية (كغ)', 'Lot total (kg)')}
              value={totalBatchKg.toFixed(1)}
              unit="kg"
              color="teal"
            />
            <CalculatorShell.MetricTile
              label={tr('Total Batch (L)', 'الكمية الإجمالية (ل)', 'Lot total (L)')}
              value={totalBatchL.toFixed(1)}
              unit="L"
              color="sky"
            />
            <CalculatorShell.MetricTile
              label={tr('Total Batch (g)', 'الكمية الإجمالية (غ)', 'Lot total (g)')}
              value={totalBatchG.toFixed(0)}
              unit="g"
              color="amber"
            />
            <CalculatorShell.MetricTile
              label={tr('Parcel Area', 'مساحة القطعة', 'Surface')}
              value={parcelAreaHa.toFixed(1)}
              unit="ha"
              color="default"
            />
            <CalculatorShell.MetricTile
              label={tr('Water Volume', 'حجم المياه', 'Volume eau')}
              value={waterVolumeM3.toFixed(0)}
              unit="m³"
              color="default"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-2.5">
              <div className="text-[10px] text-muted-foreground uppercase">{tr('Target EC / pH', 'الناقلية والحموضة', 'CE / pH')}</div>
              <div className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-300">EC {targetEC} · pH {targetPH}</div>
            </div>
            <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-2.5">
              <div className="text-[10px] text-muted-foreground uppercase">{tr('REI', 'فترة الأمان', 'DRE')}</div>
              <div className="font-mono text-sm font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> {reEntryHours} h
              </div>
            </div>
          </div>
        </div>
      </CalculatorShell.Results>

      {/* Full-width: printable work order document */}
      <div className="lg:col-span-12">
        <div className="p-6 sm:p-8 rounded-2xl border bg-card shadow-xs space-y-6 text-xs font-sans print:border-none print:shadow-none">
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
                {reEntryHours} {tr('Hours', 'ساعات', 'Heures')}
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

            <div className="overflow-x-auto rounded-xl border max-h-96 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/70 text-[11px] text-muted-foreground border-b sticky top-0">
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
                <div>• {tr('Mandatory PPE: Chemical gloves, eye goggles, protective apron when handling concentrated acids.', 'الوقاية: قفازات كيميائية، نظارات واقية، مريول عازل عند التعامل مع الأحماض.', 'EPI obligatoire : gants, lunettes, tablier pour acides concentrés.')}</div>
                <div>• {tr(`Max Allowable Wind Speed: ${maxWindSpeedKmh} km/h (avoid drift during foliar operations).`, `أقصى سرعة رياح مسموحة: ${maxWindSpeedKmh} كم/سا.`, `Vent max : ${maxWindSpeedKmh} km/h (éviter la dérive foliaire).`)}</div>
                <div>• {tr('Irrigation Line Pressure: Verify drip line operating pressure is 1.0 - 1.2 bar.', 'ضغط الشبكة: تأكد من ضغط 1.0 - 1.2 بار عند أبعد نقطة.', 'Pression ligne : vérifier 1,0 - 1,2 bar au point le plus éloigné.')}</div>
              </div>
            </div>
          </div>

          {/* Signatures & Execution Sign-off Block */}
          <div className="pt-4 border-t grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs">
            <div className="space-y-4">
              <span className="text-[10px] text-muted-foreground uppercase">{tr('Prescribed by (Agronomist)', 'إعداد المهندس الزراعي', 'Prescrit par (Agronome)')}</span>
              <div className="font-bold">{agronomistName}</div>
              <div className="border-b border-dashed pt-4"></div>
              <span className="text-[9px] text-muted-foreground">{tr('Signature & Date', 'التوقيع والتاريخ', 'Signature & Date')}</span>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] text-muted-foreground uppercase">{tr('Executed by (Operator)', 'تنفيذ الفني المسؤول', 'Exécuté par (Opérateur)')}</span>
              <div className="font-bold">{operatorName}</div>
              <div className="border-b border-dashed pt-4"></div>
              <span className="text-[9px] text-muted-foreground">{tr('Signature & Start/End Time', 'التوقيع ووقت البدء/الانتهاء', 'Signature & Heures')}</span>
            </div>

            <div className="space-y-4 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-muted-foreground uppercase">{tr('Quality & Delivery Verification', 'التحقق والمطابقة الحقلية', 'Contrôle Qualité')}</span>
              <div className="space-y-1 text-[11px]">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" defaultChecked className="rounded text-emerald-600" />
                  <span>{tr('Delivered EC verified at drippers', 'تم فحص الـ EC عند النقاطات', 'CE vérifiée aux goutteurs')}</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" defaultChecked className="rounded text-emerald-600" />
                  <span>{tr('Clean water line flush completed', 'تم غسيل الخطوط بماء نظيف', 'Rinçage effectué')}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CalculatorShell>
  );
}
