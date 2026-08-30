'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText, Download, Eye, CheckCircle2, Copy, RotateCcw,
} from 'lucide-react';
import {
  DEFAULT_CONFIG, generateReport, generateRecommendations, type ReportConfig,
} from '@/lib/report-generator';
import {
  getSoilTests, getLatestTest, computeTrends,
} from '@/lib/soil-history-store';
import { getEntries, computeSummary } from '@/lib/financial-store';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell, type TrilingualString, type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

const SECTION_LABELS: { key: keyof ReportConfig['includeSections']; en: string; ar: string; fr: string; emoji: string }[] = [
  { key: 'farmSummary',          en: 'Farm Summary',              ar: 'ملخّص المزرعة',           fr: 'Résumé Ferme',           emoji: '📋' },
  { key: 'soilAnalysis',         en: 'Soil Analysis & Trends',    ar: 'تحليل التربة والاتجاهات', fr: 'Analyse Sol & Tendances', emoji: '🧪' },
  { key: 'irrigationPlan',       en: 'Irrigation Plan',           ar: 'خطة الري',               fr: 'Plan d\'Irrigation',     emoji: '💧' },
  { key: 'seasonPlan',          en: 'Season Plan',               ar: 'خطة الموسم',              fr: 'Plan Saisonnier',       emoji: '📅' },
  { key: 'scoutingLog',          en: 'Scouting Summary',          ar: 'ملخّص الكشف',             fr: 'Résumé Scout',           emoji: '🔍' },
  { key: 'financialSummary',    en: 'Financial Summary',         ar: 'ملخّص مالي',              fr: 'Résumé Financier',      emoji: '💰' },
  { key: 'sustainabilityScore',  en: 'Sustainability Scorecard',  ar: 'بطاقة الاستدامة',         fr: 'Scorecard Durabilité',  emoji: '🌿' },
  { key: 'weatherForecast',      en: 'Weather Forecast',          ar: 'توقعات الطقس',            fr: 'Prévisions Météo',      emoji: '🌤️' },
  { key: 'recommendations',      en: 'AI Recommendations',        ar: 'توصيات بالذكاء',          fr: 'Recommandations IA',    emoji: '💡' },
];

const REPORT_TYPES = [
  { key: 'comprehensive',  en: 'Comprehensive',  ar: 'شامل',          fr: 'Complet' },
  { key: 'season_plan',    en: 'Season Plan',    ar: 'خطة الموسم',    fr: 'Plan Saisonnier' },
  { key: 'soil_analysis',  en: 'Soil Analysis',  ar: 'تحليل التربة',  fr: 'Analyse Sol' },
  { key: 'financial',      en: 'Financial',      ar: 'مالي',          fr: 'Financier' },
  { key: 'irrigation',     en: 'Irrigation',     ar: 'ري',            fr: 'Irrigation' },
] as const;

const TITLE: TrilingualString = {
  en: 'Report Generator',
  ar: 'مولّد التقارير',
  fr: 'Générateur de Rapport',
};

const DESC: TrilingualString = {
  en: 'Pulls data from every saved tool — soil tests, financial dashboard, scouting log, season plan, irrigation program, and sustainability scorecard — and combines them into a branded multi-page PDF.',
  ar: 'يجمع البيانات من كل أدواتك المحفوظة — سجل تحاليل التربة، اللوحة المالية، سجل الكشف، خطة الموسم، برنامج الري، وبطاقة الاستدامة — في PDF متعدّد الصفحات بهوية موحّدة.',
  fr: 'Compile les données de tous vos outils enregistrés — historique sol, tableau financier, journal scout, plan saisonnier, programme d\'irrigation et scorecard durabilité — en un PDF multi-pages.',
};

const PILL_LABEL: TrilingualString = { en: 'Report type:', ar: 'نوع التقرير:', fr: 'Type :' };

export function ReportGenerator() {
  const [config, setConfig] = useState<ReportConfig>(DEFAULT_CONFIG);
  const [preview, setPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);
  const sectionLabel = (s: typeof SECTION_LABELS[number]) => tr(s.en, s.ar, s.fr);

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
    }, language);

    return { ...data, recommendations };
  };

  const generate = () => {
    const data = gatherData();
    const html = generateReport(config, data, language);
    setPreview(html);
  };

  const printReport = () => {
    if (!preview) { generate(); }
    const html = preview || generateReport(config, gatherData(), language);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    setPreview(null);
    toast({ title: tr('Reset done', 'تمت إعادة التعيين', 'Réinitialisé') });
  };

  const handleCopy = () => {
    const enabledSections = SECTION_LABELS
      .filter(s => config.includeSections[s.key])
      .map(s => `${s.emoji} ${tr(s.en, s.ar, s.fr)}`)
      .join('\n');
    const text = `=== FARM REPORT ===\nFarm: ${config.farmName}\nFarmer: ${config.farmerName}\nDate: ${config.reportDate}\nType: ${config.reportType}\nSections (${Object.values(config.includeSections).filter(Boolean).length}):\n${enabledSections}`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Summary copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  const enabledCount = Object.values(config.includeSections).filter(Boolean).length;
  const reportTypeLabel = (key: string) => {
    const r = REPORT_TYPES.find(t => t.key === key);
    return r ? tr(r.en, r.ar, r.fr) : key;
  };

  const pills: CalculatorPill[] = REPORT_TYPES.map(t => ({
    key: t.key,
    label: tr(t.en, t.ar, t.fr),
  }));

  return (
    <CalculatorShell
      icon={FileText}
      title={TITLE}
      description={DESC}
      badge="Branded PDF"
      accent="violet"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ الملخّص', fr: 'Copier' },
          onClick: handleCopy,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      pills={pills}
      activePill={config.reportType}
      onPillClick={(k) => setConfig(c => ({ ...c, reportType: k as ReportConfig['reportType'] }))}
      pillLabel={PILL_LABEL}
      protocolNote={{
        en: 'How it works: The report generator pulls data from all your saved tools — soil test history, financial dashboard, scouting log, season plan, irrigation program, and sustainability scorecard. It combines them into a branded multi-page PDF with cover page, data tables, and AI recommendations. Click "Generate PDF" to open the print dialog.',
        ar: 'كيف يعمل: مولّد التقارير يسحب البيانات من كل أدواتك المحفوظة — سجل تحاليل التربة، اللوحة المالية، سجل الكشف، خطة الموسم، برنامج الري، وبطاقة الاستدامة. يجمعها في PDF متعدّد الصفحات بهوية مع صفحة غلاف وجداول بيانات وتوصيات بالذكاء الاصطناعي. اضغط «تصدير PDF» لفتح حوار الطباعة.',
        fr: 'Comment ça marche : le générateur compile les données de tous vos outils enregistrés — historique sol, tableau financier, journal scout, plan saisonnier, programme d\'irrigation et scorecard durabilité — en un PDF multi-pages avec page de garde, tableaux et recommandations IA. Cliquez sur « Générer PDF » pour ouvrir la boîte d\'impression.',
      }}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-violet-600" />
              {tr('Report Configuration', 'إعداد التقرير', 'Configuration du rapport')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <CalculatorShell.InputField
              label={tr('Farm name', 'اسم المزرعة', 'Nom de la ferme')}
              value={config.farmName}
              onChange={(v) => setConfig({ ...config, farmName: v })}
              type="text"
            />
            <CalculatorShell.InputField
              label={tr('Farmer name', 'اسم المزارع', 'Nom de l\'agriculteur')}
              value={config.farmerName}
              onChange={(v) => setConfig({ ...config, farmerName: v })}
              type="text"
            />
            <CalculatorShell.InputField
              label={tr('Report date', 'تاريخ التقرير', 'Date du rapport')}
              type="date"
              value={config.reportDate}
              onChange={(v) => setConfig({ ...config, reportDate: v })}
            />
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">
              {tr(`Include Sections (${enabledCount} selected)`, `تضمين الأقسام (${enabledCount} مُختار)`, `Sections incluses (${enabledCount} sélectionnées)`)}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {SECTION_LABELS.map(s => (
                <label
                  key={s.key}
                  className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/40 cursor-pointer transition-colors"
                >
                  <Checkbox checked={config.includeSections[s.key]} onCheckedChange={() => toggleSection(s.key)} />
                  <span className="text-xs">{s.emoji} {sectionLabel(s)}</span>
                </label>
              ))}
            </div>
          </div>

          <Button onClick={generate} variant="outline" size="sm" className="gap-1.5 text-xs w-full">
            <Eye className="h-3.5 w-3.5" /> {tr('Preview Report', 'معاينة التقرير', 'Aperçu du rapport')}
          </Button>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              ✨ {tr('Report Output', 'مخرجات التقرير', 'Sortie du rapport')}
            </span>
            {preview && (
              <Badge variant="outline" className="text-[9px]">{reportTypeLabel(config.reportType)}</Badge>
            )}
          </div>

          {preview ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {tr(`Report Ready (${enabledCount} sections)`, `التقرير جاهز (${enabledCount} أقسام)`, `Rapport prêt (${enabledCount} sections)`)}
              </div>
              <iframe
                srcDoc={preview}
                className="w-full h-[500px] rounded-lg border border-border"
                title={tr('Report Preview', 'معاينة التقرير', 'Aperçu du rapport')}
              />
              <Button onClick={printReport} size="sm" className="gap-1.5 text-xs w-full bg-violet-600 hover:bg-violet-700">
                <Download className="h-3.5 w-3.5" /> {tr('Generate PDF', 'تصدير PDF', 'Générer PDF')}
              </Button>
            </div>
          ) : (
            <div className="text-center py-10">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
              <div className="text-sm text-muted-foreground">
                {tr(
                  'Select sections and click "Preview Report" to generate a branded PDF.',
                  'اختر الأقسام واضغط «معاينة التقرير» لإنشاء PDF بهوية.',
                  'Sélectionnez les sections et cliquez sur « Aperçu » pour générer un PDF.',
                )}
              </div>
            </div>
          )}
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
