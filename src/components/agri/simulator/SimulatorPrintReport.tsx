'use client';

import React from 'react';
import {
  Printer,
  FileSpreadsheet,
  Download,
  Share2,
  CheckCircle2,
  Calendar,
  Layers,
  Droplets,
  DollarSign,
  ShieldCheck,
  Wheat,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation, copyFor, type Language } from '@/lib/language-store';
import {
  type SimulatorScenario,
  type SimulatorResult,
  formatSimulatorDzd,
  formatSimulatorNumber,
} from '@/lib/crop-simulator';

export interface SimulatorPrintReportProps {
  scenario: SimulatorScenario;
  result: SimulatorResult;
  cropName: string;
  cropEmoji: string;
}

export function SimulatorPrintReport({
  scenario,
  result,
  cropName,
  cropEmoji,
}: SimulatorPrintReportProps) {
  const { language } = useTranslation();
  const tr = copyFor;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const headers = ['Category', 'Item / Operation', 'Basis', 'Amount (DZD)', 'Note'];
    const rows = scenario.costs.map((c) => [
      c.category,
      `"${c.label.replace(/"/g, '""')}"`,
      c.basis,
      c.amount,
      `"${(c.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        [`"Crop Simulation Technical Dossier - ${cropName} (${scenario.areaHa} ha)"`],
        [`"Generated on: ${new Date().toLocaleDateString()}"`],
        [],
        headers,
        ...rows,
        [],
        ['"SUMMARY FINANCIALS"', '', '', '', ''],
        ['"Total Operating Cost (DZD)"', '', '', result.operatingCost, ''],
        ['"Total Projected Revenue (DZD)"', '', '', result.totalRevenue, ''],
        ['"Gross Margin (DZD)"', '', '', result.grossMargin, ''],
        ['"Gross Margin per Hectare (DZD/ha)"', '', '', result.grossMarginPerHa, ''],
        ['"Breakeven Yield (Tons/ha)"', '', '', result.breakEvenYieldTPerHa, ''],
      ]
        .map((e) => e.join(','))
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FormulaAtlas_${scenario.cropId}_${scenario.areaHa}ha_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        onClick={handlePrint}
        variant="outline"
        size="sm"
        className="h-9 gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
      >
        <Printer className="h-4 w-4" />
        <span>{tr(language, 'Export Technical Report (PDF/Print)', 'تصدير التقرير الفني (PDF/طباعة)', 'Exporter rapport technique (PDF/Imprimer)')}</span>
      </Button>

      <Button
        onClick={handleDownloadCsv}
        variant="ghost"
        size="sm"
        className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <FileSpreadsheet className="h-4 w-4" />
        <span>{tr(language, 'Export CSV', 'تصدير جدول CSV', 'Exporter CSV')}</span>
      </Button>
    </div>
  );
}
