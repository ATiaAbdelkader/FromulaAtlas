'use client';

import { useState, useMemo } from 'react';
import { Leaf, Copy, Check, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

const PRACTICES = [
  { id: 'no-till', name: 'No-till adoption', name_ar: 'الزراعة بدون حرث', name_fr: 'Semis direct', rate: 0.5, co2e: 1.0, cost: 0 },
  { id: 'cover-crop', name: 'Cover crops', name_ar: 'محاصيل التغطية', name_fr: 'Cultures couvertes', rate: 1.5, co2e: 1.5, cost: 40 },
  { id: 'manure', name: 'Manure compost application', name_ar: 'تطبيق سماد الكمبوست', name_fr: 'Compost', rate: 0.8, co2e: 0.8, cost: 60 },
  { id: 'reduced-n', name: 'Reduced N rate (−20%)', name_ar: 'تقليل الآزوت (−20%)', name_fr: 'Azote réduit (−20%)', rate: -0.3, co2e: 0.3, cost: -20 },
  { id: 'n-inhibitor', name: 'Nitrification inhibitor', name_ar: 'مثبط النترجة', name_fr: 'Inhibiteur nitrification', rate: -0.2, co2e: 0.2, cost: 15 },
  { id: 'agroforestry', name: 'Agroforestry (alley crop)', name_ar: 'حراجة زراعية', name_fr: 'Agroforesterie', rate: 2.0, co2e: 2.0, cost: 100 },
];

const TITLE: TrilingualString = {
  en: 'Carbon Credit Estimator',
  ar: 'مقدّر ائتمانات الكربون',
  fr: 'Estimateur de Crédits Carbone',
};
const DESC: TrilingualString = {
  en: 'IPCC Tier 2 · 6 practices · $/ha revenue · 20% permanence buffer · 10-year commitment',
  ar: 'IPCC المستوى 2 · 6 ممارسات · $/هكتار · 20% احتياطي الديمومة · التزام 10 سنوات',
  fr: 'IPCC Tier 2 · 6 pratiques · $/ha · 20% tampon permanence · 10 ans',
};

export function CarbonCreditCalculator() {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';
  const isFr = language === 'fr';
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [area, setArea] = useState('100');
  const [carbonPrice, setCarbonPrice] = useState('15');
  const [selectedPractices, setSelectedPractices] = useState<string[]>(['no-till', 'cover-crop']);
  const [years, setYears] = useState('10');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const a = parseFloat(area), cp = parseFloat(carbonPrice), y = parseInt(years);
    if (!Number.isFinite(a) || !Number.isFinite(cp)) return null;

    const chosen = PRACTICES.filter((p) => selectedPractices.includes(p.id));
    const totalCo2ePerHa = chosen.reduce((s, p) => s + p.co2e, 0);
    const totalCo2e = totalCo2ePerHa * a * y;
    const grossRevenue = totalCo2e * cp;
    const netCredits = totalCo2e * 0.8;
    const netRevenue = netCredits * cp;
    const annualCo2e = totalCo2ePerHa * a;
    const annualRevenue = annualCo2e * cp * 0.8;
    const totalCost = chosen.reduce((s, p) => s + p.cost * a, 0);
    const netProfit = annualRevenue - totalCost;
    const eligible = chosen.length > 0 && a >= 50;

    return { totalCo2ePerHa, totalCo2e, grossRevenue, netCredits, netRevenue, annualCo2e, annualRevenue, totalCost, netProfit, eligible };
  }, [area, carbonPrice, selectedPractices, years]);

  const togglePractice = (id: string) => {
    setSelectedPractices((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const handleReset = () => {
    setArea('100'); setCarbonPrice('15'); setSelectedPractices(['no-till', 'cover-crop']); setYears('10');
    toast({ title: tr('Reset', 'إعادة', 'Réinitialiser') });
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `=== CARBON CREDITS ===\nArea: ${area} ha | Price: $${carbonPrice}/t | Years: ${years}\nPractices: ${selectedPractices.join(', ')}\n\nAnnual C stored: ${result.annualCo2e.toFixed(0)} t CO₂e\nAnnual revenue: $${result.annualRevenue.toFixed(0)}\nAnnual cost: $${result.totalCost.toFixed(0)}\nNet profit/yr: $${result.netProfit.toFixed(0)}\n\n${years}-yr total: ${result.netCredits.toFixed(0)} t CO₂e\nNet revenue: $${result.netRevenue.toFixed(0)}`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <CalculatorShell
      icon={Leaf}
      title={TITLE}
      description={DESC}
      badge="IPCC Tier 2"
      accent="emerald"
      actions={[
        { icon: Copy, label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' }, onClick: handleCopy, variant: 'primary', showCheck: copied },
        { icon: RotateCcw, label: { en: 'Reset', ar: 'إعادة', fr: 'Réinitialiser' }, onClick: handleReset },
      ]}
      protocolNote={{
        en: 'Voluntary market prices $5-30/t CO₂e. Compliance markets (CA, EU) $15-50. Additionality + 25-yr permanence required. Verification every 5 yr. Contact aggregator (Indigo, Nori, Truterra) for enrollment.',
        ar: 'أسعار السوق التطوعي 5-30$/طن CO₂e. أسواق الامتثال (CA, EU) 15-50$. الإضافة + ديمومة 25 سنة مطلوبة. التحقق كل 5 سنوات. تواصل مع مجمّع (Indigo, Nori, Truterra) للتسجيل.',
        fr: 'Marché volontaire 5-30$/t CO₂e. Marché conformité 15-50$. Additionnalité + permanence 25 ans requis. Vérification tous les 5 ans.',
      }}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Leaf className="h-4 w-4 text-emerald-600" />
            <span className="text-base font-bold">{tr('Carbon Parameters', 'مدخلات الكربون', 'Paramètres carbone')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <CalculatorShell.InputField label={tr('Area (ha)', 'المساحة (هكتار)', 'Surface (ha)')} value={area} onChange={setArea} step="10" helper={tr('Farm area', 'مساحة المزرعة', 'Surface ferme')} />
            <CalculatorShell.InputField label={tr('Carbon price ($/t CO₂e)', 'سعر الكربون ($/طن)', 'Prix carbone ($/t)')} value={carbonPrice} onChange={setCarbonPrice} step="1" helper={tr('Market rate', 'سعر السوق', 'Tarif marché')} />
            <CalculatorShell.InputField label={tr('Commitment (years)', 'الالتزام (سنوات)', 'Engagement (ans)')} value={years} onChange={setYears} step="1" helper={tr('5-25 years', '5-25 سنة', '5-25 ans')} />
          </div>

          {/* Practice selection */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{tr('Practices adopted', 'الممارسات المتبناة', 'Pratiques adoptées')}</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRACTICES.map((p) => {
                const active = selectedPractices.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePractice(p.id)}
                    className={`text-start rounded-xl border p-2.5 transition-all ${active ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-border hover:bg-muted/50'}`}
                  >
                    <div className="text-xs font-semibold">{isAr ? p.name_ar : isFr ? p.name_fr : p.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {p.co2e > 0 ? '+' : ''}{p.co2e.toFixed(1)} t CO₂e/ha/yr · ${p.cost}/ha
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        {result && (
          <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
            <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-emerald-50 via-transparent to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
              <span className="text-base font-bold flex items-center gap-2">✨ {tr('Carbon & Revenue Analysis', 'تحليل الكربون والإيرادات', 'Analyse carbone & revenu')}</span>
              <span className="font-mono text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 rounded-lg px-2 py-0.5">{result.annualCo2e.toFixed(0)} t/yr</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CalculatorShell.MetricTile label={tr('Annual C Stored', 'الكربون المخزن سنوياً', 'C stocké/an')} value={result.annualCo2e.toFixed(0)} unit="t CO₂e/yr" color="emerald" />
              <CalculatorShell.MetricTile label={tr('Gross Revenue', 'الإيراد الإجمالي', 'Revenu brut')} value={`$${result.annualRevenue.toFixed(0)}`} unit="/yr" color="amber" />
              <CalculatorShell.MetricTile label={tr('Practice Cost', 'تكلفة الممارسات', 'Coût pratiques')} value={`$${result.totalCost.toFixed(0)}`} unit="/yr" color="rose" />
              <CalculatorShell.MetricTile label={tr('Net Profit', 'الربح الصافي', 'Profit net')} value={`$${result.netProfit.toFixed(0)}`} unit="/yr" color={result.netProfit > 0 ? 'emerald' : 'rose'} />
            </div>

            {/* Multi-year totals */}
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{years}-{tr('Year Totals', 'سنوات الإجمالي', 'ans total')}</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300">{result.netCredits.toFixed(0)}</div>
                  <div className="text-[9px] text-muted-foreground">{tr('t CO₂e (net)', 'طن CO₂e (صافي)', 't CO₂e net')}</div>
                </div>
                <div>
                  <div className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300">${result.netRevenue.toFixed(0)}</div>
                  <div className="text-[9px] text-muted-foreground">{tr('net revenue', 'صافي الإيراد', 'revenu net')}</div>
                </div>
                <div>
                  <div className="text-xl font-black font-mono">{`$${(result.netProfit * parseInt(years)).toFixed(0)}`}</div>
                  <div className="text-[9px] text-muted-foreground">{tr('net profit', 'صافي الربح', 'profit net')}</div>
                </div>
              </div>
            </div>

            {/* Eligibility */}
            {result.eligible ? (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>{tr('Eligible for carbon credits.', 'مؤهل للحصول على ائتمانات الكربون.', 'Éligible aux crédits carbone.')}</strong> {tr('Next steps: contact aggregator for protocol enrollment. Get baseline soil test. Verification cost ~$5-10/ha/yr.', 'الخطوات التالية: تواصل مع مجمّع للتسجيل. احصل على تحليل تربة أساسي. تكلفة التحقق ~5-10$/هكتار/سنة.', 'Contactez un agrégateur. Test de sol de référence requis.')}</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>{tr('Below minimum scale.', 'أقل من الحد الأدنى.', 'Sous le seuil minimum.')}</strong> {tr('Most protocols require ≥50 ha. Consider aggregating with neighbors or using practice-based programs (EQIP, CSP).', 'معظم البروتوكولات تتطلب ≥50 هكتار. فكر في التجميع مع الجيران أو برامج الممارسات.')}</span>
              </div>
            )}
          </div>
        )}
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
