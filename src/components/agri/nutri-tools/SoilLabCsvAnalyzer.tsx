'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FlaskConical,
  Sprout,
  Atom,
  Scale,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Download,
  Copy,
  Check,
  Printer,
  RotateCcw,
  Sliders,
  Table as TableIcon,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Droplets,
  Layers,
  ArrowRight,
  Info,
  FileText,
  PieChart,
  Zap,
  ExternalLink,
  ChevronRight,
  Filter,
  ArrowUpRight,
  ShieldAlert,
  Calculator,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useTranslation, copyFor } from '@/lib/language-store';
import { sendToBridge } from '@/lib/tool-bridge';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';
import {
  SoilLabSample,
  SamplePrescription,
  AutomatedCalculatorSuggestion,
  TargetCropProfile,
  TARGET_CROPS_DATABASE,
  SAMPLE_LAB_CSVS,
  parseSoilLabCsv,
  convertToSoilSamples,
  generateSamplePrescription,
} from '@/lib/soil-lab-analyzer-data';

const TITLE: TrilingualString = {
  en: 'Soil Lab CSV Analyzer & Formula Engine',
  ar: 'محلل تقارير التربة المخبرية ومطابق المعادلات',
  fr: 'Analyseur CSV de laboratoire de sol',
};

const DESC: TrilingualString = {
  en: 'Import soil test CSVs from any agricultural lab, auto-map headers (pH, CEC, Base Saturation, P, K, EC, NO₃), and compute precise fertilizer & amendment prescriptions powered by canonical Formula Atlas equations.',
  ar: 'استورد ملفات CSV لتحاليل التربة من أي مختبر زراعي، مع مطابقة آلية للأعمدة وحساب دقيق للاحتياجات السمادية والجير والجبس والكبريت اعتماداً على معادلات أطلس التسميد.',
  fr: 'Importez vos analyses de sol CSV, mappez automatiquement les colonnes et calculez vos besoins d’amendements et d’engrais selon le référentiel agronomique.',
};

export function SoilLabCsvAnalyzer() {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';
  const isFr = language === 'fr';

  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  // State
  const [csvInput, setCsvInput] = useState<string>(SAMPLE_LAB_CSVS[0].csv);
  const [selectedCropId, setSelectedCropId] = useState<string>('wheat');
  const [targetYield, setTargetYield] = useState<number>(6.0);
  const [fieldAreaHa, setFieldAreaHa] = useState<number>(10.0);
  const [defaultPMethod, setDefaultPMethod] = useState<'olsen' | 'bray1' | 'mehlich3'>('bray1');
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'samples' | 'suggestions' | 'cations' | 'formulas' | 'order'>('samples');
  const [suggestionFilter, setSuggestionFilter] = useState<'all' | 'deficiency' | 'soil_health' | 'salinity_sodicity' | 'fertigation_blend'>('all');
  const [showMappingEditor, setShowMappingEditor] = useState<boolean>(false);
  const [copiedPrescription, setCopiedPrescription] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected crop object
  const selectedCrop = useMemo(() => {
    return TARGET_CROPS_DATABASE.find((c) => c.id === selectedCropId) || TARGET_CROPS_DATABASE[0];
  }, [selectedCropId]);

  // When crop changes, set default yield
  const handleCropChange = (cropId: string) => {
    setSelectedCropId(cropId);
    const crop = TARGET_CROPS_DATABASE.find((c) => c.id === cropId);
    if (crop) {
      setTargetYield(crop.defaultYieldTonnesHa);
      if (crop.category === 'fruit' || crop.id === 'date_palm' || crop.id === 'olive') {
        setDefaultPMethod('olsen');
      }
    }
  };

  // Parse CSV text & extract headers and rows
  const parsedData = useMemo(() => {
    return parseSoilLabCsv(csvInput);
  }, [csvInput]);

  // Working column mapping state
  const [customColumnMap, setCustomColumnMap] = useState<Partial<Record<keyof SoilLabSample, string>>>({});

  // Merge detected map with custom overrides
  const effectiveColumnMap = useMemo(() => {
    return { ...parsedData.detectedColumnMap, ...customColumnMap };
  }, [parsedData.detectedColumnMap, customColumnMap]);

  // Convert raw rows to typed soil samples
  const soilSamples = useMemo(() => {
    if (!parsedData.rawRows.length) return [];
    return convertToSoilSamples(parsedData.rawRows, effectiveColumnMap, defaultPMethod);
  }, [parsedData.rawRows, effectiveColumnMap, defaultPMethod]);

  // Generate complete prescriptions for all samples
  const prescriptions = useMemo<SamplePrescription[]>(() => {
    return soilSamples.map((sample) => generateSamplePrescription(sample, selectedCrop, targetYield));
  }, [soilSamples, selectedCrop, targetYield]);

  // Currently selected sample prescription
  const currentPrescription = useMemo<SamplePrescription | null>(() => {
    if (!prescriptions.length) return null;
    const idx = Math.min(selectedSampleIndex, prescriptions.length - 1);
    return prescriptions[idx] || prescriptions[0];
  }, [prescriptions, selectedSampleIndex]);

  // Aggregated Smart Suggestions across the whole field / all samples
  const allFieldSuggestions = useMemo(() => {
    const map = new Map<
      string,
      AutomatedCalculatorSuggestion & { sampleCount: number; sampleIds: string[] }
    >();

    prescriptions.forEach((p) => {
      p.automatedSuggestions.forEach((sug) => {
        // Group by base condition key
        const baseKey = sug.id.replace(/-[^-]+$/, '');
        if (!map.has(baseKey)) {
          map.set(baseKey, {
            ...sug,
            sampleCount: 1,
            sampleIds: [p.sample.sampleId],
          });
        } else {
          const item = map.get(baseKey)!;
          item.sampleCount += 1;
          if (!item.sampleIds.includes(p.sample.sampleId)) {
            item.sampleIds.push(p.sample.sampleId);
          }
        }
      });
    });

    return Array.from(map.values());
  }, [prescriptions]);

  // Total suggestions count across all samples
  const totalSuggestionsCount = useMemo(() => {
    return prescriptions.reduce((acc, p) => acc + p.automatedSuggestions.length, 0);
  }, [prescriptions]);

  // Launch calculator & pre-fill bridge payload handler
  const handleLaunchCalculator = (suggestion: AutomatedCalculatorSuggestion) => {
    // 1. Dispatch payload to tool-bridge for target tool input pre-filling
    if (suggestion.bridgePayload) {
      sendToBridge({
        sourceToolId: 'soil-lab-csv-analyzer',
        targetToolId: suggestion.targetToolId,
        values: suggestion.bridgePayload,
      });
    }

    // 2. Perform navigation
    if (typeof window !== 'undefined') {
      if (suggestion.targetTab === 'tools') {
        window.history.pushState(null, '', `#tool=${suggestion.targetToolId}`);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } else if (suggestion.targetTab === 'farm') {
        if (suggestion.storageKey) {
          try {
            localStorage.setItem(suggestion.storageKey, 'true');
          } catch (e) {
            /* ignore */
          }
        }
        window.dispatchEvent(
          new CustomEvent('nutriplant-navigate-tab', {
            detail: { tab: 'farm', subtool: suggestion.targetToolId },
          })
        );
        window.history.pushState(null, '', `#farm-${suggestion.targetToolId}`);
      }
    }

    toast({
      title: tr('Formula Atlas Calculator Connected', 'تم ربط وتعبئة حاسبة الأطلس', 'Calculateur lié'),
      description: tr(
        `Pre-filled ${suggestion.calculatorName} with detected soil test parameters.`,
        `تم نقل وتعبئة بيانات التحليل المخبري في ${suggestion.calculatorName_ar} بنجاح.`,
        `Paramètres transmis à ${suggestion.calculatorName_fr}.`
      ),
    });
  };

  // Aggregate Field Commercial Fertilizer Order
  const fieldSummaryOrder = useMemo(() => {
    if (!prescriptions.length) return [];
    const productTotals: Record<
      string,
      {
        productName: string;
        productName_ar: string;
        productName_fr: string;
        grade: string;
        totalKg: number;
        avgKgHa: number;
        timing: string;
        timing_ar: string;
        timing_fr: string;
        purposeFormula: string;
      }
    > = {};

    prescriptions.forEach((p) => {
      p.fertilizerProducts.forEach((prod) => {
        if (!productTotals[prod.productName]) {
          productTotals[prod.productName] = {
            productName: prod.productName,
            productName_ar: prod.productName_ar,
            productName_fr: prod.productName_fr,
            grade: prod.grade,
            totalKg: 0,
            avgKgHa: 0,
            timing: prod.timing,
            timing_ar: prod.timing_ar,
            timing_fr: prod.timing_fr,
            purposeFormula: prod.purposeFormula,
          };
        }
        productTotals[prod.productName].totalKg += (prod.rateKgHa * fieldAreaHa) / prescriptions.length;
      });
    });

    return Object.values(productTotals).map((item) => ({
      ...item,
      avgKgHa: Math.round(item.totalKg / fieldAreaHa),
      totalTonnes: Number((item.totalKg / 1000).toFixed(2)),
    }));
  }, [prescriptions, fieldAreaHa]);

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setCsvInput(content);
        setCustomColumnMap({});
        setSelectedSampleIndex(0);
        toast({
          title: tr('Soil Lab CSV Imported!', 'تم استيراد ملف تحليل التربة بنجاح!', 'Fichier CSV importé !'),
          description: tr(
            `Loaded ${file.name} (${content.split('\n').length - 1} rows detected).`,
            `تم تحميل ${file.name} واكتشاف الحقول والأعمدة آلياً.`,
            `Fichier ${file.name} chargé avec succès.`
          ),
        });
      }
    };
    reader.readAsText(file);
  };

  // Load Preset
  const handleLoadPreset = (presetCsv: string, name: string) => {
    setCsvInput(presetCsv);
    setCustomColumnMap({});
    setSelectedSampleIndex(0);
    toast({
      title: tr('Sample Dataset Loaded', 'تم تحميل النموذج المخبري', 'Jeu de données chargé'),
      description: name,
    });
  };

  // Export Analyzed Prescription as CSV
  const handleExportCsv = () => {
    if (!prescriptions.length) return;
    const headers = [
      'Sample_ID',
      'Field',
      'pH',
      'pH_Status',
      'OM_pct',
      'CEC',
      'Ca_Sat_pct',
      'Mg_Sat_pct',
      'K_Sat_pct',
      'Na_Sat_pct_ESP',
      'SAR',
      'P_ppm',
      'K_ppm',
      'ECe_dSm',
      'N_Req_kgHa',
      'P2O5_Req_kgHa',
      'K2O_Req_kgHa',
      'Lime_Req_tHa',
      'Gypsum_Req_tHa',
      'Elemental_Sulfur_kgHa',
      'Applied_Formulas',
    ];

    const rows = prescriptions.map((p) => [
      `"${p.sample.sampleId}"`,
      `"${p.sample.fieldName}"`,
      p.sample.ph.toFixed(1),
      `"${p.phStatus}"`,
      p.sample.omPercent.toFixed(1),
      p.sample.cec.toFixed(1),
      p.cationBalance.caSatPercent.toFixed(1),
      p.cationBalance.mgSatPercent.toFixed(1),
      p.cationBalance.kSatPercent.toFixed(1),
      p.cationBalance.naSatPercent.toFixed(1),
      p.cationBalance.sar.toFixed(1),
      p.sample.pPpm.toFixed(1),
      p.sample.kPpm.toFixed(1),
      p.sample.ecDsM.toFixed(1),
      p.nReqKgHa,
      p.p2o5ReqKgHa,
      p.k2oReqKgHa,
      p.limeRequirementTonnesHa,
      p.gypsumRequirementTonnesHa,
      p.elementalSulfurKgHa,
      `"${p.appliedFormulas.map((f) => f.code).join('; ')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Soil_Prescription_${selectedCrop.id}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Full Prescription Summary
  const handleCopyPrescription = () => {
    if (!currentPrescription) return;
    const p = currentPrescription;
    const text = `
=== SOIL LAB FERTILIZER & AMENDMENT PRESCRIPTION ===
Sample: ${p.sample.sampleId} | Field: ${p.sample.fieldName} (${p.sample.zone || 'Main Zone'})
Target Crop: ${selectedCrop.name} (${targetYield} ${selectedCrop.unit}) | Field Area: ${fieldAreaHa} ha

1. SOIL STATUS & CATION BALANCE:
• Soil pH: ${p.sample.ph.toFixed(1)} (${p.phStatus.replace('_', ' ').toUpperCase()})
• Organic Matter: ${p.sample.omPercent}% -> SOC Stock: ${p.socStockTonnesHa} t/ha (Formula SH.1)
• Organic N Credit: ${p.nMineralizationCreditKgHa} kg N/ha
• CEC: ${p.sample.cec} meq/100g | Base Saturation: Ca=${p.cationBalance.caSatPercent}%, Mg=${p.cationBalance.mgSatPercent}%, K=${p.cationBalance.kSatPercent}%, ESP (Na)=${p.cationBalance.naSatPercent}%
• SAR: ${p.cationBalance.sar} (Formula 7.10) | ECe: ${p.sample.ecDsM} dS/m (${p.salinityClass})

2. AMENDMENTS (RECLAMATION & BUFFERING):
${p.limeRequirementTonnesHa > 0 ? `• Agricultural Lime (CaCO₃): ${p.limeRequirementTonnesHa} t/ha [Formula SH.4]\n` : ''}${p.gypsumRequirementTonnesHa > 0 ? `• Agricultural Gypsum (CaSO₄·2H₂O): ${p.gypsumRequirementTonnesHa} t/ha [Formula 49.2]\n` : ''}${p.elementalSulfurKgHa > 0 ? `• Elemental Sulfur (S⁰): ${p.elementalSulfurKgHa} kg/ha [Rhizosphere Acidification]\n` : ''}${p.leachingRequirementPercent > 5 ? `• Salinity Leaching Requirement: +${p.leachingRequirementPercent}% extra irrigation [Formula 49.1]\n` : ''}

3. NET NUTRIENT RECOMMENDATIONS (KG/HA):
• Net N: ${p.nReqKgHa} kg/ha
• Net P₂O₅: ${p.p2o5ReqKgHa} kg/ha
• Net K₂O: ${p.k2oReqKgHa} kg/ha
${p.znReqKgHa > 0 ? `• Zinc (Zn): ${p.znReqKgHa} kg/ha\n` : ''}${p.feReqGramsHa > 0 ? `• Iron (Fe-EDDHA): ${p.feReqGramsHa} g/ha\n` : ''}

4. COMMERCIAL FERTILIZER PRODUCTS (FORMULA 4.1):
${p.fertilizerProducts.map((prod) => `• ${prod.productName}: ${prod.rateKgHa} kg/ha (Timing: ${prod.timing})`).join('\n')}

FORMULA ATLAS TRACEABILITY:
${p.appliedFormulas.map((f) => `• [${f.code}] ${f.name}: ${f.formula}`).join('\n')}
Generated by FormulaAtlas Soil Lab Agronomic Engine.
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedPrescription(true);
    toast({
      title: tr('Prescription Copied!', 'تم نسخ الوصفة التسميدية!', 'Ordonnance copiée !'),
      description: tr('Full sample prescription copied to clipboard.', 'تم نسخ التقرير الحسابي والوصفة إلى الحافظة بنجاح.', 'Ordonnance copiée.'),
    });
    setTimeout(() => setCopiedPrescription(false), 3000);
  };

  // Reset all CSV input & crop settings to initial defaults
  const handleReset = () => {
    setCsvInput(SAMPLE_LAB_CSVS[0].csv);
    setSelectedCropId('wheat');
    setTargetYield(6.0);
    setFieldAreaHa(10.0);
    setDefaultPMethod('bray1');
    setSelectedSampleIndex(0);
    setCustomColumnMap({});
    setShowMappingEditor(false);
    toast({
      title: tr('Reset to Defaults', 'تمت استعادة الإعدادات الافتراضية', 'Réinitialisé'),
      description: tr(
        'Soil Lab inputs restored to default sample dataset.',
        'تمت استعادة إعدادات المحلل إلى الحالة الافتراضية.',
        'Paramètres réinitialisés aux valeurs par défaut.'
      ),
    });
  };

  return (
    <CalculatorShell
      icon={FileSpreadsheet}
      title={TITLE}
      description={DESC}
      badge="Formula Atlas"
      accent="amber"
      actions={[
        {
          icon: Upload,
          label: { en: 'Import CSV', ar: 'استيراد CSV', fr: 'Importer CSV' },
          onClick: () => fileInputRef.current?.click(),
          variant: 'primary',
        },
        {
          icon: Download,
          label: { en: 'Export CSV', ar: 'تصدير CSV', fr: 'Exporter CSV' },
          onClick: handleExportCsv,
        },
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ الوصفة', fr: 'Copier le résumé' },
          onClick: handleCopyPrescription,
          showCheck: copiedPrescription,
        },
        {
          icon: Printer,
          label: { en: 'Print', ar: 'طباعة', fr: 'Imprimer' },
          onClick: () => window.print(),
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.tsv,.txt"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Full-width workspace: settings ribbon + presets + mapping editor + analysis tabs */}
      <div className="lg:col-span-12 space-y-4">
        {/* Global Settings Ribbon: Target Crop, Yield, Area, P Method */}
        <Card className="border shadow-sm border-amber-500/30 bg-gradient-to-br from-amber-50/60 via-card to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10">
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Target Crop */}
            <div className="space-y-1">
              <Label className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
                {tr('Target Crop', 'المحصول المستهدف', 'Culture cible')}
              </Label>
              <Select value={selectedCropId} onValueChange={handleCropChange}>
                <SelectTrigger className="bg-background/60 border-amber-300/50 text-foreground h-9 text-xs">
                  <SelectValue placeholder="Select Crop" />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_CROPS_DATABASE.map((crop) => (
                    <SelectItem key={crop.id} value={crop.id}>
                      {isAr ? crop.name_ar : isFr ? crop.name_fr : crop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Yield */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-300 font-semibold">
                <span>{tr('Target Yield', 'الإنتاجية المستهدفة', 'Rendement cible')}</span>
                <span className="font-mono text-foreground">
                  {targetYield} {selectedCrop.unit}
                </span>
              </div>
              <Input
                type="number"
                min={0.5}
                max={200}
                step={0.5}
                value={targetYield}
                onChange={(e) => setTargetYield(Number(e.target.value) || selectedCrop.defaultYieldTonnesHa)}
                className="bg-background/60 border-amber-300/50 text-foreground h-9 text-xs font-mono"
              />
            </div>

            {/* Total Field Area */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-300 font-semibold">
                <span>{tr('Field Area (Hectares)', 'المساحة الكلية (هكتار)', 'Surface totale (ha)')}</span>
                <span className="font-mono text-foreground">{fieldAreaHa} ha</span>
              </div>
              <Input
                type="number"
                min={0.1}
                max={1000}
                step={0.5}
                value={fieldAreaHa}
                onChange={(e) => setFieldAreaHa(Number(e.target.value) || 1.0)}
                className="bg-background/60 border-amber-300/50 text-foreground h-9 text-xs font-mono"
              />
            </div>

            {/* P Extraction Method */}
            <div className="space-y-1">
              <Label className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
                {tr('Phosphorus Method', 'طريقة استخلاص الفوسفور', 'Méthode d’extraction P')}
              </Label>
              <Select value={defaultPMethod} onValueChange={(val: any) => setDefaultPMethod(val)}>
                <SelectTrigger className="bg-background/60 border-amber-300/50 text-foreground h-9 text-xs">
                  <SelectValue placeholder="P Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="olsen">Olsen P (NaHCO₃ - Alkaline & Calcareous)</SelectItem>
                  <SelectItem value="bray1">Bray-1 P (Acid to Neutral)</SelectItem>
                  <SelectItem value="mehlich3">Mehlich-3 P (Multi-element ICP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Quick Sample Presets + Edit Column Mapping toggle */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground font-medium">{tr('Sample Labs:', 'نماذج مختبرات جاهزة:', 'Exemples :')}</span>
          {SAMPLE_LAB_CSVS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleLoadPreset(preset.csv, preset.name)}
              className="px-2.5 py-1 rounded-full bg-muted hover:bg-muted/80 border text-foreground transition-all text-[11px]"
            >
              {preset.name.split('(')[0].trim()}
            </button>
          ))}
          <button
            onClick={() => setShowMappingEditor(!showMappingEditor)}
            className="ml-auto px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/40 hover:bg-amber-200 dark:hover:bg-amber-900/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-medium transition-all text-[11px] flex items-center gap-1"
          >
            <Sliders className="h-3 w-3" />
            {showMappingEditor
              ? tr('Hide Column Mapper', 'إخفاء مطابقة الأعمدة', 'Masquer le mappage')
              : tr('Edit Column Mapping', 'تعديل مطابقة الأعمدة', 'Modifier le mappage')}
          </button>
        </div>

      {/* Collapsible Raw CSV & Column Mapping Inspector */}
      {showMappingEditor && (
        <Card className="border shadow-sm border-emerald-500/40 bg-card">
          <CardHeader className="pb-3 border-b bg-muted/40">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-emerald-600" />
                  {tr('CSV Column Binding & Mapping Inspector', 'أداة ربط وتعيين أعمدة ملف الـ CSV', 'Inspecteur de liaison des colonnes CSV')}
                </CardTitle>
                <CardDescription className="text-xs">
                  {tr(
                    'Ensure each soil metric is accurately bound to the corresponding header in your imported CSV file.',
                    'تأكد من مطابقة كل عنصر كيميائي مع العمود المقابل في ملف التحليل المخبري المستورد.',
                    'Vérifiez la correspondance entre chaque paramètre de sol et l’en-tête de votre fichier CSV.'
                  )}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {parsedData.headers.length} {tr('Headers detected', 'أعمدة مكتشفة', 'colonnes détectées')}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {/* Raw Textarea option */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground">
                {tr('Raw CSV / TSV Text Input', 'نص ملف CSV الخام', 'Texte brut CSV')}
              </Label>
              <Textarea
                rows={4}
                value={csvInput}
                onChange={(e) => {
                  setCsvInput(e.target.value);
                  setCustomColumnMap({});
                }}
                placeholder="Paste CSV text here..."
                className="font-mono text-xs"
              />
            </div>

            {/* Column Mapping Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
              {[
                { key: 'sampleId', label: 'Sample ID / Code' },
                { key: 'fieldName', label: 'Field / Plot' },
                { key: 'ph', label: 'Soil pH (1:1 / 1:2.5)' },
                { key: 'omPercent', label: 'Organic Matter (OM %)' },
                { key: 'cec', label: 'CEC (meq/100g)' },
                { key: 'pPpm', label: 'Phosphorus (P ppm)' },
                { key: 'kPpm', label: 'Potassium (K ppm)' },
                { key: 'caPpm', label: 'Calcium (Ca ppm)' },
                { key: 'mgPpm', label: 'Magnesium (Mg ppm)' },
                { key: 'naPpm', label: 'Sodium (Na ppm)' },
                { key: 'ecDsM', label: 'Salinity (ECe dS/m)' },
                { key: 'no3NPpm', label: 'Nitrate-N (NO3-N ppm)' },
                { key: 'znPpm', label: 'Zinc (Zn ppm)' },
                { key: 'fePpm', label: 'Iron (Fe ppm)' },
              ].map(({ key, label }) => {
                const boundCol = effectiveColumnMap[key as keyof SoilLabSample];
                const isMapped = Boolean(boundCol);

                return (
                  <div key={key} className="space-y-1 p-2 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-foreground truncate">{label}</span>
                      {isMapped ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <span className="text-[9px] text-muted-foreground italic">optional</span>
                      )}
                    </div>
                    <Select
                      value={boundCol || '__none__'}
                      onValueChange={(val) => {
                        setCustomColumnMap((prev) => ({
                          ...prev,
                          [key]: val === '__none__' ? undefined : val,
                        }));
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Select Column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-- Not Present --</SelectItem>
                        {parsedData.headers.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Analysis Workspace */}
      <div className="space-y-4">
        {/* Top Smart Suggestion Notification Bar */}
        {totalSuggestionsCount > 0 && (
          <div className="p-3 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-amber-50/90 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-amber-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500 text-white shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-foreground flex items-center gap-2">
                  <span>{tr('Formula Atlas Smart Diagnostics Active', 'تم رصد اقتراحات ذكية من أطلس التسميد', 'Diagnostics intelligents actifs')}</span>
                  <Badge className="bg-amber-600 text-white text-[10px] font-mono px-1.5 py-0">
                    {totalSuggestionsCount} {tr('Actions Detected', 'إجراء مطلوب', 'Actions détectées')}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {tr(
                    'Nutrient levels in your soil report automatically matched with specialized Formula Atlas calculators & pre-fill parameters.',
                    'تمت مطابقة نتائج التحليل المخبري آلياً مع حاسبات أطلس التسميد المتخصصة وتجهيز المتغيرات للربط المباشر.',
                    'Les valeurs d’analyse sont automatiquement associées aux calculateurs spécialisés du référentiel.'
                  )}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveTab('suggestions')}
              className="border-amber-400/80 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-100 font-bold text-xs h-8 px-3 shrink-0"
            >
              <Zap className="h-3.5 w-3.5 mr-1 text-amber-600 fill-amber-500" />
              {tr('Explore Suggestions', 'معاينة الاقتراحات التلقائية', 'Voir les suggestions')}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        )}

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 w-full h-auto p-1.5 bg-muted/80 rounded-xl border gap-1">
            <TabsTrigger value="samples" className="py-2 flex items-center gap-1.5 font-medium text-xs">
              <TableIcon className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{tr('Sample Matrix', 'مصفوفة العينات', 'Échantillons')}</span>
              <Badge variant="secondary" className="text-[10px] ml-0.5">
                {prescriptions.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger value="suggestions" className="py-2 flex items-center gap-1.5 font-medium text-xs relative">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              <span>{tr('Smart Suggestions', 'الاقتراحات الذكية', 'Suggestions')}</span>
              {totalSuggestionsCount > 0 && (
                <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-1.5 py-0">
                  {totalSuggestionsCount}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="cations" className="py-2 flex items-center gap-1.5 font-medium text-xs">
              <PieChart className="h-4 w-4 text-blue-600 shrink-0" />
              <span>{tr('Cation Balance & SAR', 'توازن الكاتيونات و SAR', 'Équilibre cationique & SAR')}</span>
            </TabsTrigger>

            <TabsTrigger value="formulas" className="py-2 flex items-center gap-1.5 font-medium text-xs">
              <Atom className="h-4 w-4 text-purple-600 shrink-0" />
              <span>{tr('Formula Atlas Proofs', 'إثباتات معادلات الأطلس', 'Formules appliquées')}</span>
            </TabsTrigger>

            <TabsTrigger value="order" className="py-2 flex items-center gap-1.5 font-medium text-xs">
              <Scale className="h-4 w-4 text-amber-600 shrink-0" />
              <span>{tr('Commercial Order', 'أمر الشراء والتسميد', 'Commande d’engrais')}</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: SAMPLE MATRIX TABLE & DETAILED PROFILE */}
          <TabsContent value="samples" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 Cols: Interactive Sample List Table */}
              <div className="lg:col-span-7 space-y-4">
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3 border-b bg-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <TableIcon className="h-5 w-5 text-emerald-600" />
                          {tr('Imported Soil Lab Samples', 'عينات التربة المخبرية المستوردة', 'Échantillons analysés')}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {tr(
                            'Click any sample row to inspect chemical balances, nutrient indices, and formula breakdowns.',
                            'اضغط على أي عينة لمعاينة توازن الكاتيونات والاحتياجات التسميدية والمعادلات المطبقة.',
                            'Cliquez sur une ligne pour afficher l’ordonnance détaillée.'
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse" dir={isAr ? 'rtl' : 'ltr'}>
                      <thead className="bg-muted/60 text-muted-foreground font-semibold border-b">
                        <tr>
                          <th className="p-3">{tr('Sample / Field', 'العينة / الحقل', 'Échantillon')}</th>
                          <th className="p-3 text-center">pH</th>
                          <th className="p-3 text-center">OM %</th>
                          <th className="p-3 text-center">CEC</th>
                          <th className="p-3 text-center">P ppm</th>
                          <th className="p-3 text-center">K ppm</th>
                          <th className="p-3 text-center">EC dS/m</th>
                          <th className="p-3 text-center">{tr('Status', 'الحالة', 'Diagnostic')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {prescriptions.map((p, idx) => {
                          const isSelected = selectedSampleIndex === idx;

                          let phBadge = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
                          if (p.sample.ph < 5.8) phBadge = 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
                          else if (p.sample.ph > 8.2) phBadge = 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300';
                          else if (p.sample.ph > 7.5) phBadge = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';

                          return (
                            <tr
                              key={p.sample.id}
                              onClick={() => setSelectedSampleIndex(idx)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-emerald-50/80 dark:bg-emerald-950/40 font-semibold' : 'hover:bg-muted/50'
                              }`}
                            >
                              <td className="p-3">
                                <div className="font-bold text-foreground">{p.sample.sampleId}</div>
                                <div className="text-[11px] text-muted-foreground truncate max-w-[120px]">
                                  {p.sample.fieldName} {p.sample.zone ? `(${p.sample.zone})` : ''}
                                </div>
                              </td>

                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] ${phBadge}`}>
                                  {p.sample.ph.toFixed(1)}
                                </span>
                              </td>

                              <td className="p-3 text-center font-mono">{p.sample.omPercent.toFixed(1)}%</td>
                              <td className="p-3 text-center font-mono">{p.sample.cec.toFixed(1)}</td>
                              <td className="p-3 text-center font-mono">{p.sample.pPpm.toFixed(0)}</td>
                              <td className="p-3 text-center font-mono">{p.sample.kPpm.toFixed(0)}</td>

                              <td className="p-3 text-center font-mono">
                                <span className={p.sample.ecDsM >= 3.0 ? 'text-red-600 font-bold' : 'text-foreground'}>
                                  {p.sample.ecDsM.toFixed(1)}
                                </span>
                              </td>

                              <td className="p-3 text-center">
                                {p.gypsumRequirementTonnesHa > 0 ? (
                                  <Badge className="bg-purple-600 text-white text-[10px]">
                                    {tr('Sodic', 'صودية', 'Sodique')}
                                  </Badge>
                                ) : p.limeRequirementTonnesHa > 0 ? (
                                  <Badge className="bg-red-600 text-white text-[10px]">
                                    {tr('Acidic', 'حامضية', 'Acide')}
                                  </Badge>
                                ) : p.sample.ecDsM >= 4.0 ? (
                                  <Badge className="bg-orange-600 text-white text-[10px]">
                                    {tr('Saline', 'ملحية', 'Salin')}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-emerald-600 text-white text-[10px]">
                                    {tr('Good', 'متوازنة', 'Bon')}
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>

              {/* Right 5 Cols: Selected Sample Comprehensive Diagnosis */}
              {currentPrescription && (
                <div className="lg:col-span-5 space-y-4">
                  <Card className="border shadow-sm sticky top-4">
                    <CardHeader className="pb-3 border-b bg-muted/40">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded bg-emerald-600 text-white font-mono font-bold text-xs">
                              {currentPrescription.sample.sampleId}
                            </span>
                            <CardTitle className="text-base font-bold">
                              {currentPrescription.sample.fieldName}
                            </CardTitle>
                          </div>
                          <CardDescription className="text-xs">
                            {tr('Prescription for', 'التوصية التسميدية لـ', 'Recommandation pour')}{' '}
                            <span className="font-bold text-emerald-600">{selectedCrop.name}</span> (
                            {targetYield} {selectedCrop.unit})
                          </CardDescription>
                        </div>

                        <Badge variant="outline" className="font-mono text-xs">
                          pH {currentPrescription.sample.ph.toFixed(1)}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-4 text-xs">
                      {/* Automated Formula Atlas Suggestions for this sample */}
                      {currentPrescription.automatedSuggestions.length > 0 && (
                        <div className="p-3 rounded-xl border border-amber-300 bg-amber-50/60 dark:bg-amber-950/20 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-900 dark:text-amber-200 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                              {tr('Suggested Formula Atlas Calculators', 'حاسبات أطلس التسميد المقترحة للعينة', 'Calculateurs suggérés')}
                            </span>
                            <Badge className="bg-amber-500 text-white text-[9px] font-mono">
                              {currentPrescription.automatedSuggestions.length} {tr('Matched', 'مطابق', 'Liés')}
                            </Badge>
                          </div>

                          <div className="space-y-1.5">
                            {currentPrescription.automatedSuggestions.slice(0, 3).map((sug) => (
                              <div
                                key={sug.id}
                                className="p-2 rounded-lg bg-card border border-border flex items-center justify-between gap-2 text-xs"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-[11px] text-foreground truncate">
                                    {isAr ? sug.calculatorName_ar : isFr ? sug.calculatorName_fr : sug.calculatorName}
                                  </div>
                                  <div className="text-[10px] text-amber-800 dark:text-amber-300 flex items-center gap-1 mt-0.5">
                                    <span className="font-semibold">{isAr ? sug.nutrientOrCondition_ar : sug.nutrientOrCondition}</span>: {sug.detectedValue}
                                  </div>
                                </div>

                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleLaunchCalculator(sug)}
                                  className="h-6 px-2 text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white shrink-0 shadow-xs"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  {tr('Pre-fill', 'تعبئة', 'Ouvrir')}
                                </Button>
                              </div>
                            ))}
                          </div>

                          {currentPrescription.automatedSuggestions.length > 3 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveTab('suggestions')}
                              className="w-full text-center text-[10px] font-semibold text-amber-800 dark:text-amber-300 h-6 p-0 hover:bg-transparent"
                            >
                              {tr(`+ ${currentPrescription.automatedSuggestions.length - 3} more suggestions in Smart Suggestions tab`, `+ ${currentPrescription.automatedSuggestions.length - 3} اقتراحات إضافية في تبويب الاقتراحات الذكية`, `+ ${currentPrescription.automatedSuggestions.length - 3} suggestions dans l'onglet`)} →
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Soil Health & Carbon Metrics (Formula SH.1) */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/50 border">
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                            {tr('SOC Carbon Stock', 'مخزون الكربون العضوي', 'Stock carbone SOC')}
                          </span>
                          <p className="font-bold text-xs text-foreground mt-0.5">
                            {currentPrescription.socStockTonnesHa} t C/ha
                          </p>
                          <span className="text-[10px] text-muted-foreground font-mono">[Formula SH.1]</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                            {tr('Organic N Credit', 'رصيد النيتروجين العضوي', 'Crédit N minéral')}
                          </span>
                          <p className="font-bold text-xs text-emerald-600 mt-0.5">
                            +{currentPrescription.nMineralizationCreditKgHa} kg N/ha
                          </p>
                          <span className="text-[10px] text-muted-foreground">{tr('From OM mineralization', 'من تحلل المادة العضوية', 'Minéralisation')}</span>
                        </div>
                      </div>

                      {/* Soil Amendment Protocols */}
                      {(currentPrescription.limeRequirementTonnesHa > 0 ||
                        currentPrescription.gypsumRequirementTonnesHa > 0 ||
                        currentPrescription.elementalSulfurKgHa > 0) && (
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-amber-900 dark:text-amber-200 space-y-1.5">
                          <div className="font-bold flex items-center gap-1.5 text-xs">
                            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                            <span>{tr('Required Soil Amendments', 'معالجات وتعديلات التربة الإجبارية', 'Amendements du sol')}</span>
                          </div>

                          {currentPrescription.limeRequirementTonnesHa > 0 && (
                            <div className="flex justify-between items-center text-xs">
                              <span>• {tr('Agricultural Lime (CaCO₃):', 'الجير الزراعي (CaCO₃):', 'Chaux agricole :')}</span>
                              <strong className="font-mono">{currentPrescription.limeRequirementTonnesHa} t/ha [Formula SH.4]</strong>
                            </div>
                          )}

                          {currentPrescription.gypsumRequirementTonnesHa > 0 && (
                            <div className="flex justify-between items-center text-xs">
                              <span>• {tr('Agricultural Gypsum (CaSO₄·2H₂O):', 'الجبس الزراعي:', 'Gypse agricole :')}</span>
                              <strong className="font-mono">{currentPrescription.gypsumRequirementTonnesHa} t/ha [Formula 49.2]</strong>
                            </div>
                          )}

                          {currentPrescription.elementalSulfurKgHa > 0 && (
                            <div className="flex justify-between items-center text-xs">
                              <span>• {tr('Elemental Sulfur (S⁰):', 'الكبريت الزراعي (S⁰):', 'Soufre élémentaire :')}</span>
                              <strong className="font-mono">{currentPrescription.elementalSulfurKgHa} kg/ha</strong>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Net Pure Nutrient Requirements */}
                      <div className="space-y-2">
                        <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wide">
                          {tr('Net Nutrient Demand (Pure Active Basis)', 'صافي الاحتياجات السمادية الصافية (كغ/هكتار)', 'Besoins nets en unités')}
                        </span>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200">
                            <span className="text-[10px] text-blue-700 dark:text-blue-300 font-bold">N (Nitrogen)</span>
                            <p className="text-sm font-black text-blue-900 dark:text-blue-100">{currentPrescription.nReqKgHa} <span className="text-[10px] font-normal">kg/ha</span></p>
                          </div>
                          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200">
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">P₂O₅ (Phosphate)</span>
                            <p className="text-sm font-black text-emerald-900 dark:text-emerald-100">{currentPrescription.p2o5ReqKgHa} <span className="text-[10px] font-normal">kg/ha</span></p>
                          </div>
                          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200">
                            <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold">K₂O (Potash)</span>
                            <p className="text-sm font-black text-purple-900 dark:text-purple-100">{currentPrescription.k2oReqKgHa} <span className="text-[10px] font-normal">kg/ha</span></p>
                          </div>
                        </div>
                      </div>

                      {/* Commercial Fertilizer Products Prescription */}
                      <div className="space-y-2">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 uppercase text-[10px] tracking-wide flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" />
                          {tr('Commercial Fertilizer Program (Formula 4.1)', 'برنامج الأسمدة التجارية (معادلة 4.1)', 'Programme commercial d’engrais')}
                        </span>
                        <div className="space-y-1.5">
                          {currentPrescription.fertilizerProducts.map((prod, pIdx) => (
                            <div
                              key={pIdx}
                              className="p-2 rounded-lg border bg-card flex items-center justify-between gap-2"
                            >
                              <div>
                                <div className="font-bold text-xs text-foreground">
                                  {isAr ? prod.productName_ar : isFr ? prod.productName_fr : prod.productName}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {isAr ? prod.timing_ar : isFr ? prod.timing_fr : prod.timing}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-xs font-mono text-emerald-700 dark:text-emerald-400">
                                  {prod.rateKgHa} kg/ha
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB: AUTOMATED FORMULA ATLAS SMART SUGGESTIONS */}
          <TabsContent value="suggestions" className="space-y-6 pt-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-4 border-b bg-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      {tr(
                        'Automated Formula Atlas Suggestions Engine',
                        'محرك الاقتراحات الذكية والربط بحاسبات أطلس التسميد',
                        'Moteur de suggestions intelligentes du Référentiel'
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {tr(
                        'Intelligent agronomic rule-engine detecting nutrient deficiencies, base imbalances, and salt hazards with one-click calculator pre-filling.',
                        'محرك قواعد خبير يرصد عجز العناصر واختلال الكاتيونات ومخاطر الملوحة والصودية مع إمكانية فتح الحاسبة وتعبئتها بضغطة واحدة.',
                        'Système expert associant les anomalies d’analyses aux calculateurs du référentiel avec pré-remplissage direct.'
                      )}
                    </CardDescription>
                  </div>

                  {/* Category Filter Chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      size="sm"
                      variant={suggestionFilter === 'all' ? 'default' : 'outline'}
                      onClick={() => setSuggestionFilter('all')}
                      className="h-7 text-xs px-2.5"
                    >
                      {tr('All', 'الكل', 'Tous')} ({allFieldSuggestions.length})
                    </Button>
                    <Button
                      size="sm"
                      variant={suggestionFilter === 'deficiency' ? 'default' : 'outline'}
                      onClick={() => setSuggestionFilter('deficiency')}
                      className="h-7 text-xs px-2.5"
                    >
                      {tr('Deficiencies', 'نقص العناصر', 'Carences')}
                    </Button>
                    <Button
                      size="sm"
                      variant={suggestionFilter === 'soil_health' ? 'default' : 'outline'}
                      onClick={() => setSuggestionFilter('soil_health')}
                      className="h-7 text-xs px-2.5"
                    >
                      {tr('pH & Amendments', 'الحموضة والمصلحات', 'pH & Amendements')}
                    </Button>
                    <Button
                      size="sm"
                      variant={suggestionFilter === 'salinity_sodicity' ? 'default' : 'outline'}
                      onClick={() => setSuggestionFilter('salinity_sodicity')}
                      className="h-7 text-xs px-2.5"
                    >
                      {tr('Salinity & Sodicity', 'الملوحة والصودية', 'Salinité & Sodicité')}
                    </Button>
                    <Button
                      size="sm"
                      variant={suggestionFilter === 'fertigation_blend' ? 'default' : 'outline'}
                      onClick={() => setSuggestionFilter('fertigation_blend')}
                      className="h-7 text-xs px-2.5"
                    >
                      {tr('Fertigation & Splits', 'التسميد والتقسيم', 'Fertigation')}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-4">
                {allFieldSuggestions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground border rounded-xl bg-muted/20">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
                    <h3 className="font-bold text-sm text-foreground">
                      {tr('All Soil Parameters Within Optimal Ranges', 'جميع مؤشرات التربة ضمن الحدود المثالية', 'Tous les paramètres sont optimaux')}
                    </h3>
                    <p className="text-xs mt-1 max-w-md mx-auto">
                      {tr(
                        'No critical nutrient deficits, extreme pH, or sodic risks detected in the uploaded lab samples.',
                        'لم يتم رصد أي نقص حاد أو قلوية شديدة أو صودية في العينات المرفوعة.',
                        'Aucune carence critique ni risque de salinité détecté dans les échantillons.'
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {allFieldSuggestions
                      .filter((sug) => suggestionFilter === 'all' || sug.category === suggestionFilter)
                      .map((suggestion) => {
                        const isCritical = suggestion.severity === 'critical';

                        return (
                          <div
                            key={suggestion.id}
                            className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                              isCritical
                                ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/60'
                                : 'bg-card border-border hover:border-amber-400'
                            }`}
                          >
                            <div className="space-y-2.5">
                              {/* Header Pill & Severity */}
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge
                                      className={
                                        isCritical
                                          ? 'bg-red-600 text-white text-[10px]'
                                          : 'bg-amber-600 text-white text-[10px]'
                                      }
                                    >
                                      {isCritical
                                        ? tr('Critical Attention', 'أولوية قصوى', 'Critique')
                                        : tr('Recommended Action', 'إجراء موصى به', 'Recommandé')}
                                    </Badge>
                                    <span className="font-bold text-sm text-foreground">
                                      {isAr
                                        ? suggestion.nutrientOrCondition_ar
                                        : isFr
                                        ? suggestion.nutrientOrCondition_fr
                                        : suggestion.nutrientOrCondition}
                                    </span>
                                  </div>

                                  <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                                    <span>{tr('Detected in', 'مرصود في', 'Détecté dans')}:</span>
                                    <span className="font-semibold text-foreground">
                                      {suggestion.sampleCount} {tr('sample(s)', 'عينة', 'échantillon(s)')} ({suggestion.sampleIds.slice(0, 3).join(', ')}{suggestion.sampleIds.length > 3 ? '...' : ''})
                                    </span>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-muted border">
                                    {suggestion.detectedValue}
                                  </span>
                                </div>
                              </div>

                              {/* Trigger Diagnostic Reason */}
                              <div className="p-2.5 rounded-lg bg-background/80 border text-xs text-foreground/90 space-y-1">
                                <p className="leading-relaxed">
                                  {isAr
                                    ? suggestion.triggerReason_ar
                                    : isFr
                                    ? suggestion.triggerReason_fr
                                    : suggestion.triggerReason}
                                </p>
                                <div className="text-[11px] font-semibold text-muted-foreground pt-0.5">
                                  {tr('Agronomic Benchmark', 'المعيار الزراعي المرجعي', 'Référence')}:{' '}
                                  <span className="text-foreground">{isAr ? suggestion.benchmark_ar : isFr ? suggestion.benchmark_fr : suggestion.benchmark}</span>
                                </div>
                              </div>

                              {/* Linked Formula Atlas Equations */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-semibold text-muted-foreground">
                                    {tr('Linked Formula Atlas Models', 'معادلات أطلس التسميد المرتبطة', 'Modèles du Référentiel')}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {suggestion.formulaAtlasCodes.map((code, cIdx) => (
                                    <Badge
                                      key={cIdx}
                                      variant="secondary"
                                      className="font-mono text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200"
                                    >
                                      Formula {code}
                                    </Badge>
                                  ))}
                                  {suggestion.formulaNames.map((name, nIdx) => (
                                    <span key={nIdx} className="text-[10px] text-muted-foreground self-center">
                                      • {name}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Recommended Agronomic Action */}
                              <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 text-xs">
                                <div className="font-bold text-emerald-900 dark:text-emerald-200 mb-0.5 flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                  {tr('Recommended Field Protocol', 'البروتوكول الحقلي الموصى به', 'Protocole recommandé')}
                                </div>
                                <p className="text-[11px] text-emerald-950 dark:text-emerald-100 leading-relaxed">
                                  {isAr
                                    ? suggestion.actionRecommendation_ar
                                    : isFr
                                    ? suggestion.actionRecommendation_fr
                                    : suggestion.actionRecommendation}
                                </p>
                              </div>

                              {/* Mathematical Proof */}
                              <div className="p-2 rounded-lg bg-muted/40 border font-mono text-[10px] text-muted-foreground space-y-0.5">
                                <div className="font-bold text-foreground">Formula: {suggestion.formulaProofFormula}</div>
                                <div className="text-purple-700 dark:text-purple-300 truncate">{suggestion.formulaProofSteps}</div>
                              </div>
                            </div>

                            {/* Action CTA Button */}
                            <div className="pt-2 border-t flex items-center justify-between gap-2">
                              <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5 truncate">
                                <Calculator className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                <span className="truncate">
                                  {isAr
                                    ? suggestion.calculatorName_ar
                                    : isFr
                                    ? suggestion.calculatorName_fr
                                    : suggestion.calculatorName}
                                </span>
                              </div>

                              <Button
                                size="sm"
                                onClick={() => handleLaunchCalculator(suggestion)}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-8 px-3 shrink-0 shadow-xs"
                              >
                                <Zap className="h-3.5 w-3.5 mr-1 fill-amber-400" />
                                {tr('Open & Pre-fill Calculator', 'فتح وتعبئة الحاسبة', 'Ouvrir le calculateur')}
                                <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: CATION BALANCE, BASE SATURATION & SAR */}
          <TabsContent value="cations" className="space-y-6 pt-4">
            {currentPrescription && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 6 Cols: Base Saturation Breakdown */}
                <div className="lg:col-span-6 space-y-4">
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-3 border-b bg-card">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-blue-600" />
                        {tr('Base Saturation % vs Albrecht Ideal Standard', 'نسب تشبع القواعد مقابل المعيار المثالي لألبريخت', 'Saturation des bases vs Standard Albrecht')}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {tr('Sample:', 'العينة:', 'Échantillon :')} {currentPrescription.sample.sampleId} | CEC: {currentPrescription.sample.cec} meq/100g
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-4 space-y-4 text-xs">
                      {/* Calcium Saturation */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-semibold">{tr('Calcium (Ca²⁺) Saturation', 'تشبع الكالسيوم', 'Saturation en Calcium')}</span>
                          <span className="font-mono font-bold">{currentPrescription.cationBalance.caSatPercent}% (Ideal: 65 - 75%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(currentPrescription.cationBalance.caSatPercent, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Magnesium Saturation */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-semibold">{tr('Magnesium (Mg²⁺) Saturation', 'تشبع المغنيسيوم', 'Saturation en Magnésium')}</span>
                          <span className="font-mono font-bold">{currentPrescription.cationBalance.mgSatPercent}% (Ideal: 10 - 15%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(currentPrescription.cationBalance.mgSatPercent * 3, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Potassium Saturation */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-semibold">{tr('Potassium (K⁺) Saturation', 'تشبع البوتاسيوم', 'Saturation en Potassium')}</span>
                          <span className="font-mono font-bold">{currentPrescription.cationBalance.kSatPercent}% (Ideal: 3 - 5%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-purple-600 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(currentPrescription.cationBalance.kSatPercent * 10, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Sodium Saturation (ESP) */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-semibold">{tr('Sodium (Na⁺) Saturation / ESP', 'نسبة الصوديوم المتبادل (ESP)', 'Sodium échangeable (ESP)')}</span>
                          <span className={`font-mono font-bold ${currentPrescription.cationBalance.naSatPercent > 5 ? 'text-red-600' : 'text-foreground'}`}>
                            {currentPrescription.cationBalance.naSatPercent}% (Safe: &lt; 3%, Critical: &gt; 10%)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${currentPrescription.cationBalance.naSatPercent > 5 ? 'bg-red-600' : 'bg-slate-400'}`}
                            style={{ width: `${Math.min(currentPrescription.cationBalance.naSatPercent * 5, 100)}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right 6 Cols: Cation Ratios & Salinity/Sodicity Diagnostics */}
                <div className="lg:col-span-6 space-y-4">
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-3 border-b bg-card">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Atom className="h-5 w-5 text-purple-600" />
                        {tr('Cation Ratios & Sodic Index (Formula 7.10)', 'نسب الكاتيونات ومؤشر الصودية (معادلة 7.10)', 'Rapports cationiques & Indice SAR')}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="p-4 space-y-3 text-xs">
                      {/* Ca:Mg Ratio */}
                      <div className="p-3 rounded-xl border bg-muted/40 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-foreground">Ca : Mg Ratio</span>
                          <p className="text-[11px] text-muted-foreground">
                            {tr('Ideal Range: 4.0 - 7.0 (Structural Stability)', 'المثالي: 4.0 - 7.0 لثبات بناء التربة', 'Optimum : 4.0 - 7.0')}
                          </p>
                        </div>
                        <span className="text-sm font-black font-mono px-2.5 py-1 rounded bg-card border">
                          {currentPrescription.cationBalance.caMgRatio} : 1
                        </span>
                      </div>

                      {/* Mg:K Ratio */}
                      <div className="p-3 rounded-xl border bg-muted/40 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-foreground">Mg : K Ratio</span>
                          <p className="text-[11px] text-muted-foreground">
                            {tr('Ideal Range: 2.0 - 4.0 (Antagonism Avoidance)', 'المثالي: 2.0 - 4.0 لتفادي التضاد', 'Optimum : 2.0 - 4.0')}
                          </p>
                        </div>
                        <span className="text-sm font-black font-mono px-2.5 py-1 rounded bg-card border">
                          {currentPrescription.cationBalance.mgKRatio} : 1
                        </span>
                      </div>

                      {/* SAR (Formula 7.10) */}
                      <div className="p-3 rounded-xl border bg-muted/40 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground">Sodium Adsorption Ratio (SAR)</span>
                            <Badge variant="outline" className="text-[9px] font-mono">Formula 7.10</Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {tr('SAR = [Na⁺] / √(([Ca²⁺]+[Mg²⁺])/2) (Critical > 13)', 'معيار امتزاز الصوديوم (الخطر > 13)', 'Ratio d’adsorption du sodium')}
                          </p>
                        </div>
                        <span className={`text-sm font-black font-mono px-2.5 py-1 rounded bg-card border ${currentPrescription.cationBalance.sar >= 8 ? 'text-red-600 border-red-300' : ''}`}>
                          {currentPrescription.cationBalance.sar}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 3: FORMULA ATLAS PROOFS & TRACEABILITY */}
          <TabsContent value="formulas" className="space-y-6 pt-4">
            {currentPrescription && (
              <Card className="border shadow-sm">
                <CardHeader className="pb-3 border-b bg-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Atom className="h-5 w-5 text-purple-600" />
                        {tr('Agronomic Formula Proofs for Sample', 'إثباتات المعادلات المطبقة للعينة', 'Preuves agronomiques pour l’échantillon')}: {currentPrescription.sample.sampleId}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {tr(
                          'Direct step-by-step mathematical traceability linked to canonical Formula Atlas equations.',
                          'تتبع حسابي ورياضي مباشر لكل رقم في التوصية وفق معادلات أطلس التسميد المعتمدة.',
                          'Traçabilité mathématique étape par étape liée aux équations du référentiel.'
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  {currentPrescription.appliedFormulas.map((f) => (
                    <div key={f.code} className="p-3.5 rounded-xl border bg-muted/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-purple-700 text-white font-mono font-bold text-xs">
                            Formula {f.code}
                          </Badge>
                          <span className="font-bold text-sm text-foreground">{f.name}</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-card border font-mono text-xs text-purple-700 dark:text-purple-300">
                        {f.formula}
                      </div>

                      <p className="text-xs text-foreground/90 font-mono leading-relaxed bg-background/60 p-2 rounded border">
                        {f.calculationSteps}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB 4: COMMERCIAL FERTILIZER PROCUREMENT & BATCH ORDER */}
          <TabsContent value="order" className="space-y-6 pt-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-3 border-b bg-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Scale className="h-5 w-5 text-amber-600" />
                      {tr('Field Commercial Fertilizer & Amendment Procurement List', 'قائمة المشتريات والتسميد الكلي للحقل', 'Liste des commandes d’engrais')}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {tr('Aggregated for', 'محسوبة لإجمالي مساحة', 'Calculé pour')}{' '}
                      <span className="font-bold text-foreground">{fieldAreaHa} ha</span> ({selectedCrop.name})
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse" dir={isAr ? 'rtl' : 'ltr'}>
                  <thead className="bg-muted/60 text-muted-foreground font-semibold border-b">
                    <tr>
                      <th className="p-3">{tr('Commercial Product & Grade', 'السماد التجاري والتركيب', 'Produit & Formule')}</th>
                      <th className="p-3 text-center">{tr('Avg Rate (kg/ha)', 'المعدل للهكتار (كغ/هـ)', 'Dose moy (kg/ha)')}</th>
                      <th className="p-3 text-center">{tr(`Total Field Requirement (${fieldAreaHa} ha)`, `إجمالي الحقل (${fieldAreaHa} هـ)`, `Total (${fieldAreaHa} ha)`)}</th>
                      <th className="p-3">{tr('Application Timing & Strategy', 'مواعيد وطريقة الإضافة', 'Stade & Application')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {fieldSummaryOrder.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/40 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-foreground">
                            {isAr ? item.productName_ar : isFr ? item.productName_fr : item.productName}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">{item.grade}</div>
                        </td>

                        <td className="p-3 text-center font-mono font-bold text-xs">
                          {item.avgKgHa} kg/ha
                        </td>

                        <td className="p-3 text-center font-mono font-black text-sm text-emerald-700 dark:text-emerald-400">
                          {item.totalTonnes} {tr('tonnes', 'طن', 'tonnes')}
                        </td>

                        <td className="p-3 text-xs text-muted-foreground">
                          {isAr ? item.timing_ar : isFr ? item.timing_fr : item.timing}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </CalculatorShell>
  );
}
