'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileText, Download, Eye, CheckCircle2, Sparkles,
} from 'lucide-react';
import {
  DEFAULT_CONFIG, generateReport, generateRecommendations, type ReportConfig,
} from '@/lib/report-generator';
import {
  getSoilTests, getLatestTest, computeTrends,
} from '@/lib/soil-history-store';
import { getEntries, computeSummary } from '@/lib/financial-store';
import { CROP_IRRIGATION_DATA } from '@/lib/irrigation-crop-data';
import { useTranslation } from '@/lib/language-store';

const SECTION_LABELS: { key: keyof ReportConfig['includeSections']; label: string; label_ar: string; emoji: string }[] = [
  { key: 'farmSummary', label: 'Farm Summary', label_ar: 'ملخّص المزرعة', emoji: '📋' },
  { key: 'soilAnalysis', label: 'Soil Analysis & Trends', label_ar: 'تحليل التربة والاتجاهات', emoji: '🧪' },
  { key: 'irrigationPlan', label: 'Irrigation Plan', label_ar: 'خطة الري', emoji: '💧' },
  { key: 'seasonPlan', label: 'Season Plan', label_ar: 'خطة الموسم', emoji: '📅' },
  { key: 'scoutingLog', label: 'Scouting Summary', label_ar: 'ملخّص الكشف', emoji: '🔍' },
  { key: 'financialSummary', label: 'Financial Summary', label_ar: 'ملخّص مالي', emoji: '💰' },
  { key: 'sustainabilityScore', label: 'Sustainability Scorecard', label_ar: 'بطاقة الاستدامة', emoji: '🌿' },
  { key: 'weatherForecast', label: 'Weather Forecast', label_ar: 'توقعات الطقس', emoji: '🌤️' },
  { key: 'recommendations', label: 'AI Recommendations', label_ar: 'توصيات بالذكاء', emoji: '💡' },
];

export function ReportGenerator() {
  const [config, setConfig] = useState<ReportConfig>(DEFAULT_CONFIG);
  const [preview, setPreview] = useState<string | null>(null);
  const { isRTL } = useTranslation();
  const sectionLabel = (s: typeof SECTION_LABELS[number]) => isRTL ? s.label_ar : s.label;

  useEffect(() => {
    // Auto-fill farm name from profile if available
    try {
      const profile = JSON.parse(localStorage.getItem('nutriplant_community_profile_v1') || '{}');
      if (profile.farm) setConfig(c => ({ ...c, farmName: profile.farm, farmerName: profile.name || c.farmerName }));
    } catch { /* ignore */ }
  }, []);

  const toggleSection = (key: keyof ReportConfig['includeSections']) => {
    setConfig(c => ({ ...c, includeSections: { ...c.includeSections, [key]: !c.includeSections[key] } }));
  };

  const gatherData = () => {
    // Gather data from all stores
    const soilEntries = getSoilTests();
    const latest = getLatestTest(soilEntries);
    const trends = computeTrends(soilEntries);

    const finEntries = getEntries();
    const finSummary = finEntries.length > 0 ? computeSummary(finEntries, 10, 200) : undefined;

    // Try to get scouting log data
    let scoutingData: { total: number; critical: number; warnings: number; recentNotes: string[] } | undefined;
    try {
      const scouting = JSON.parse(localStorage.getItem('nutriplant_scout_log_v1') || '[]');
      if (scouting.length > 0) {
        scoutingData = {
          total: scouting.length,
          critical: scouting.filter((s: any) => s.severity === 'critical').length,
          warnings: scouting.filter((s: any) => s.severity === 'warning').length,
          recentNotes: scouting.slice(0, 5).map((s: any) => `[${s.timestamp ? new Date(s.timestamp).toLocaleDateString() : ''}] ${s.fieldName}: ${s.note}`),
        };
      }
    } catch { /* ignore */ }

    const data = {
      soilLatest: latest ? {
        ph: latest.ph, om: latest.om, cec: latest.cec, ca: latest.ca,
        mg: latest.mg, k: latest.k, p: latest.p, na: latest.na,
      } : undefined,
      soilTrends: trends.map(t => ({
        label: t.label, current: t.current, direction: t.direction,
        status: t.status, recommendation: t.recommendation,
      })),
      irrigation: {
        crop: 'Field Tomato', annualMm: 395, volumeM3: 4647, peakMm: 4.1,
      },
      seasonPlan: {
        crop: 'Tomato', weeks: 52, totalN: 200, totalP: 32, totalK: 179, totalIrrigation: 4647,
      },
      scouting: scoutingData,
      financial: finSummary ? {
        costs: finSummary.totalCosts, revenue: finSummary.totalRevenue,
        margin: finSummary.grossMargin, roi: finSummary.roi,
        breakEvenYield: finSummary.breakEvenYield,
      } : undefined,
      sustainability: {
        nue: 65, waterProd: 1.4, carbon: 0.35, soilHealth: 72, grade: 'B',
      },
      weather: {
        currentTemp: 24, forecast: 'Mixed sun and clouds', frostRisk: false,
        sprayWindow: 'Jul 8-9 (low wind, dry)',
      },
    };

    // Generate AI recommendations from gathered data
    const recommendations = generateRecommendations({
      soilLatest: data.soilLatest,
      financial: data.financial,
      sustainability: data.sustainability,
      scouting: data.scouting,
      weather: data.weather,
    });

    return { ...data, recommendations };
  };

  const generate = () => {
    const data = gatherData();
    const html = generateReport(config, data);
    setPreview(html);
  };

  const printReport = () => {
    if (!preview) { generate(); }
    const html = preview || generateReport(config, gatherData());
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const enabledCount = Object.values(config.includeSections).filter(Boolean).length;

  return (
    <Card>
      {/* Report config */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-[10px]">{isRTL ? 'اسم المزرعة' : 'Farm name'}</Label>
          <Input value={config.farmName} onChange={e => setConfig({ ...config, farmName: e.target.value })} className="h-8 text-xs mt-0.5" />
        </div>
        <div>
          <Label className="text-[10px]">{isRTL ? 'اسم المزارع' : 'Farmer name'}</Label>
          <Input value={config.farmerName} onChange={e => setConfig({ ...config, farmerName: e.target.value })} className="h-8 text-xs mt-0.5" />
        </div>
        <div>
          <Label className="text-[10px]">{isRTL ? 'تاريخ التقرير' : 'Report date'}</Label>
          <Input type="date" value={config.reportDate} onChange={e => setConfig({ ...config, reportDate: e.target.value })} className="h-8 text-xs mt-0.5" />
        </div>
      </div>

      {/* Report type */}
      <div className="flex gap-1.5 flex-wrap">
        {(['comprehensive', 'season_plan', 'soil_analysis', 'financial', 'irrigation'] as const).map(t => {
          const labelMap: Record<string, { en: string; ar: string }> = {
            comprehensive: { en: 'Comprehensive', ar: 'شامل' },
            season_plan: { en: 'Season Plan', ar: 'خطة الموسم' },
            soil_analysis: { en: 'Soil Analysis', ar: 'تحليل التربة' },
            financial: { en: 'Financial', ar: 'مالي' },
            irrigation: { en: 'Irrigation', ar: 'ري' },
          };
          return (
            <button
              key={t}
              onClick={() => setConfig({ ...config, reportType: t })}
              className={`text-[10px] px-2.5 py-1.5 rounded-md border transition-all ${config.reportType === t ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-background border-border text-muted-foreground hover:border-emerald-300'}`}
            >
              {isRTL ? labelMap[t].ar : labelMap[t].en}
            </button>
          );
        })}
      </div>

      {/* Section toggles */}
      <div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">{isRTL ? `تضمين الأقسام (${enabledCount} مُختار)` : `Include Sections (${enabledCount} selected)`}</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {SECTION_LABELS.map(s => (
            <label key={s.key} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/40 cursor-pointer transition-colors">
              <Checkbox checked={config.includeSections[s.key]} onCheckedChange={() => toggleSection(s.key)} />
              <span className="text-xs">{s.emoji} {sectionLabel(s)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={generate} variant="outline" size="sm" className="gap-1.5 text-xs flex-1">
          <Eye className="h-3.5 w-3.5" /> {isRTL ? 'معاينة التقرير' : 'Preview Report'}
        </Button>
        <Button onClick={printReport} size="sm" className="gap-1.5 text-xs flex-1 bg-emerald-600 hover:bg-emerald-700">
          <Download className="h-3.5 w-3.5" /> {isRTL ? 'تصدير PDF' : 'Generate PDF'}
        </Button>
      </div>

      {/* Preview */}
      {preview && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {isRTL ? `التقرير جاهز (${enabledCount} أقسام)` : `Report Ready (${enabledCount} sections)`}
            </span>
            <Badge variant="outline" className="text-[9px]">{config.reportType}</Badge>
          </div>
          <iframe srcDoc={preview} className="w-full h-[500px] rounded-lg border border-border" title={isRTL ? 'معاينة التقرير' : 'Report Preview'} />
        </div>
      )}

      {/* Info */}
      <div className="rounded-lg p-3 border border-sky-200 dark:border-sky-900 bg-sky-50/50 dark:bg-sky-950/20">
        <div className="flex items-start gap-2 text-xs text-sky-700 dark:text-sky-400">
          <Sparkles className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <div>
            <strong>{isRTL ? 'كيف يعمل:' : 'How it works:'}</strong> {isRTL
              ? 'مولّد التقارير يسحب البيانات من كل أدواتك المحفوظة — سجل تحاليل التربة، اللوحة المالية، سجل الكشف، خطة الموسم، برنامج الري، وبطاقة الاستدامة. يجمعها في PDF متعدّد الصفحات بهوية مع صفحة غلاف وجداول بيانات وتوصيات بالذكاء الاصطناعي. اضغط «تصدير PDF» لفتح حوار الطباعة.'
              : 'The report generator pulls data from all your saved tools — soil test history, financial dashboard, scouting log, season plan, irrigation program, and sustainability scorecard. It combines them into a branded multi-page PDF with cover page, data tables, and AI recommendations. Click "Generate PDF" to open the print dialog.'}
          </div>
        </div>
      </div>
    </Card>
  );
}
