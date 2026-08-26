'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Database, Download, Eraser, FlaskConical, RefreshCw, Sparkles, Sprout, WalletCards, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation, type Language } from '@/lib/language-store';
import {
  applyDemoScenario,
  clearDemoScenario,
  createDemoScenario,
  DEMO_DATA_WARNING,
  DEMO_SCENARIO_CHANGED_EVENT,
  loadLastDemoScenario,
  type DemoScenario,
  type DemoScenarioDensity,
  type DemoScenarioRecipe,
} from '@/lib/demo-scenario';

function copy(language: Language, en: string, fr: string, ar: string): string {
  return language === 'fr' ? fr : language === 'ar' ? ar : en;
}

function formatNumber(value: number, language: Language, decimals = 0): string {
  const locale = language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-DZ';
  return new Intl.NumberFormat(locale, { maximumFractionDigits: decimals }).format(value);
}

function formatDzd(value: number, language: Language): string {
  return `${formatNumber(value, language)} DZD`;
}

const DEFAULT_RECIPE: DemoScenarioRecipe = {
  masterSeed: 'formula-atlas-2026',
  baseYear: 2026,
  density: 'standard',
  locale: 'en',
};

export function DemoScenarioStudio() {
  const { language, isRTL } = useTranslation();
  const [recipe, setRecipe] = useState<DemoScenarioRecipe>({ ...DEFAULT_RECIPE });
  const [scenario, setScenario] = useState<DemoScenario>(() => createDemoScenario(DEFAULT_RECIPE));
  const [appliedScenarioId, setAppliedScenarioId] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const t = useCallback((en: string, fr: string, ar: string) => copy(language, en, fr, ar), [language]);

  const refreshScenario = useCallback(() => {
    const nextRecipe = { ...recipe, locale: language };
    setRecipe(nextRecipe);
    setScenario(createDemoScenario(nextRecipe));
    setStatus('');
  }, [language, recipe]);

  useEffect(() => {
    const last = loadLastDemoScenario();
    if (last) {
      setScenario(last);
      setRecipe(last.recipe);
      setAppliedScenarioId(last.manifest.scenarioId);
    }
    const refresh = () => {
      const loaded = loadLastDemoScenario();
      setAppliedScenarioId(loaded?.manifest.scenarioId ?? null);
    };
    window.addEventListener(DEMO_SCENARIO_CHANGED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(DEMO_SCENARIO_CHANGED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const densityLabel = useMemo(() => ({
    compact: t('Compact · 2 fields', 'Compact · 2 parcelles', 'مختصر · حقلان'),
    standard: t('Standard · 3 fields', 'Standard · 3 parcelles', 'قياسي · 3 حقول'),
    showcase: t('Showcase · 4 fields', 'Démonstration · 4 parcelles', 'عرض · 4 حقول'),
  } satisfies Record<DemoScenarioDensity, string>), [t]);

  const updateRecipe = useCallback((patch: Partial<DemoScenarioRecipe>) => {
    const next = { ...recipe, ...patch };
    setRecipe(next);
    setScenario(createDemoScenario(next));
    setAppliedScenarioId(null);
    setStatus('');
  }, [recipe]);

  const apply = useCallback(() => {
    const counts = applyDemoScenario(scenario);
    setAppliedScenarioId(scenario.manifest.scenarioId);
    setStatus(t(
      `${counts.fields} fields, ${counts.records} records, and connected demo signals were added locally.`,
      `${counts.fields} parcelles, ${counts.records} enregistrements et les signaux connectés ont été ajoutés localement.`,
      `تمت إضافة ${counts.fields} حقول و${counts.records} سجلات وإشارات تجريبية مرتبطة محلياً.`,
    ));
  }, [scenario, t]);

  const reset = useCallback(() => {
    clearDemoScenario();
    setAppliedScenarioId(null);
    setStatus(t('Demo records were removed. Existing user records were preserved.', 'Les données de démonstration ont été supprimées. Les données de l’utilisateur ont été conservées.', 'تم حذف السجلات التجريبية مع الحفاظ على سجلات المستخدم الحالية.'));
  }, [t]);

  const exportManifest = useCallback(() => {
    const blob = new Blob([JSON.stringify({ manifest: scenario.manifest, recipe: scenario.recipe, metrics: scenario.metrics }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${scenario.manifest.scenarioId}-manifest.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [scenario]);

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'} className="overflow-hidden border-violet-200/70 shadow-sm dark:border-violet-900/60">
      <CardHeader className="border-b bg-gradient-to-r from-violet-50 via-background to-amber-50/60 pb-4 dark:from-violet-950/30 dark:via-background dark:to-amber-950/20">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-violet-600" /> {t('Demo Scenario Studio', 'Studio de scénarios de démonstration', 'استوديو سيناريوهات العرض')}</CardTitle>
            <CardDescription className="mt-1 max-w-3xl text-xs leading-relaxed">{t('Create a reproducible Algeria-aware farm scenario for demos, onboarding, and QA. It connects to existing Farm tools without changing their calculation logic.', 'Créez un scénario agricole algérien reproductible pour les démonstrations, l’accueil et les tests. Il se connecte aux outils existants sans modifier leurs calculs.', 'أنشئ سيناريو مزرعة جزائرياً قابلاً لإعادة الإنتاج للعروض والتدريب والاختبار. يتصل بأدوات المزرعة الحالية دون تغيير منطق الحساب.')}</CardDescription>
          </div>
          <Badge className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-200"><AlertTriangle className="h-3 w-3" />{t('Synthetic data', 'Données synthétiques', 'بيانات اصطناعية')}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/20 dark:text-amber-100"><strong>{t('Safety label:', 'Étiquette de sécurité :', 'تنبيه السلامة:')}</strong> {t(DEMO_DATA_WARNING, 'Données synthétiques uniquement — pas pour les décisions agronomiques.', 'بيانات اصطناعية للعرض فقط — ليست لاتخاذ قرارات زراعية.')}</div>

        <div className="grid gap-3 md:grid-cols-3">
          <div><Label className="text-xs">{t('Master seed', 'Graine principale', 'البذرة الرئيسية')}</Label><Input value={recipe.masterSeed} onChange={(event) => updateRecipe({ masterSeed: event.target.value })} className="mt-1 h-10" placeholder="formula-atlas-2026" /><p className="mt-1 text-[10px] text-muted-foreground">{t('Same seed + settings = same generated records.', 'Même graine + paramètres = mêmes enregistrements.', 'نفس البذرة والإعدادات تعطي نفس السجلات.')}</p></div>
          <div><Label className="text-xs">{t('Base season', 'Saison de base', 'الموسم الأساسي')}</Label><Input type="number" min="2020" max="2035" value={recipe.baseYear} onChange={(event) => updateRecipe({ baseYear: Number(event.target.value) || DEFAULT_RECIPE.baseYear })} className="mt-1 h-10" /></div>
          <div><Label className="text-xs">{t('Scenario density', 'Densité du scénario', 'كثافة السيناريو')}</Label><select value={recipe.density} onChange={(event) => updateRecipe({ density: event.target.value as DemoScenarioDensity })} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm">{(['compact', 'standard', 'showcase'] as DemoScenarioDensity[]).map((density) => <option key={density} value={density}>{densityLabel[density]}</option>)}</select></div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {([
            { label: t('Fields', 'Parcelles', 'الحقول'), value: formatNumber(scenario.metrics.fieldCount, language), Icon: Sprout },
            { label: t('Area (ha)', 'Surface (ha)', 'المساحة (هكتار)'), value: formatNumber(scenario.metrics.totalAreaHa, language, 1), Icon: Database },
            { label: t('Timeline records', 'Enregistrements', 'سجلات الخط الزمني'), value: formatNumber(scenario.metrics.recordCount, language), Icon: FlaskConical },
            { label: t('Satellite checks', 'Contrôles satellite', 'فحوص الأقمار'), value: formatNumber(scenario.metrics.satelliteCount, language), Icon: RefreshCw },
            { label: t('Simulated yield (t)', 'Rendement simulé (t)', 'الإنتاج المحاكى (طن)'), value: formatNumber(scenario.metrics.totalYieldT, language, 1), Icon: Sprout },
            { label: t('Simulator revenue', 'Revenu simulateur', 'إيراد المحاكي'), value: formatDzd(scenario.metrics.totalRevenueDzd, language), Icon: WalletCards },
          ] satisfies Array<{ label: string; value: string; Icon: LucideIcon }>).map(({ label, value, Icon }) => <div key={label} className="rounded-xl border bg-muted/20 p-3"><Icon className="h-4 w-4 text-violet-600" /><div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 text-sm font-bold">{value}</div></div>)}
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-violet-200/70 bg-violet-50/40 p-3 dark:border-violet-900/60 dark:bg-violet-950/20 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-sm font-semibold">{scenario.manifest.label}</div><div className="mt-1 text-[10px] text-muted-foreground">{scenario.manifest.scenarioId} · {t('Generator', 'Générateur', 'المولّد')} {scenario.manifest.generatorVersion} · {t('Currency', 'Devise', 'العملة')} DZD</div></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={refreshScenario} className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" />{t('Regenerate', 'Régénérer', 'إعادة التوليد')}</Button><Button size="sm" variant="outline" onClick={exportManifest} className="gap-1.5"><Download className="h-3.5 w-3.5" />{t('Manifest', 'Manifeste', 'بيان')}</Button></div></div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"><Button onClick={apply} className="gap-1.5 bg-violet-700 hover:bg-violet-800"><Database className="h-4 w-4" />{appliedScenarioId === scenario.manifest.scenarioId ? t('Applied to workspace', 'Appliqué à l’espace', 'تم تطبيقه على مساحة العمل') : t('Apply demo farm', 'Appliquer la ferme démo', 'تطبيق مزرعة العرض')}</Button><Button onClick={reset} variant="outline" className="gap-1.5 text-red-700 hover:text-red-800"><Eraser className="h-4 w-4" />{t('Remove demo data', 'Supprimer les données démo', 'حذف بيانات العرض')}</Button></div>
        {status && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">{status}</p>}
        <p className="text-[10px] leading-relaxed text-muted-foreground">{t('Apply is additive for user records: generated IDs are isolated by scenario. Remove demo data only removes the last applied scenario.', 'L’application est additive pour les données utilisateur : les identifiants générés sont isolés par scénario. La suppression retire uniquement le dernier scénario appliqué.', 'التطبيق يضيف البيانات إلى سجلات المستخدم: المعرفات التجريبية معزولة حسب السيناريو. الحذف يزيل آخر سيناريو مطبق فقط.')}</p>
      </CardContent>
    </Card>
  );
}
