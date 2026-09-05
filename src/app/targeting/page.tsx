'use client';

/**
 * Date Palm Region Targeting — internal marketing tool.
 *
 * URL: /targeting
 *
 * Shows which Algerian wilayas have the highest date palm density,
 * ranked by marketing priority. Used to decide where to focus:
 *   - WhatsApp brief recruitment
 *   - Cooperative pilot outreach
 *   - Field marketing events
 *
 * Data is static (from Algerian Ministry of Agriculture estimates).
 * When the app has real subscriber data, this page can overlay
 * current subscriber counts per wilaya to identify gaps.
 */

import Link from 'next/link';
import { Sprout, MapPin, Trees, TrendingUp, Target, Crown } from 'lucide-react';
import { useTranslation } from '@/lib/language-store';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DATE_PALM_WILAYAS,
  TOTAL_DATE_PALM_TREES_K,
  TOTAL_DATE_PALM_HA,
  getWilayasByPriority,
  densityColor,
} from '@/lib/date-palm-regions';

export default function TargetingPage() {
  const { isRTL, language } = useTranslation();
  const isArabic = language === 'ar';
  const isFrench = language === 'fr';
  const t = (en: string, ar: string, fr: string) => (isArabic ? ar : isFrench ? fr : en);

  const ranked = getWilayasByPriority();
  const highPriority = ranked.filter(w => w.priority === 'HIGH');
  const mediumPriority = ranked.filter(w => w.priority === 'MEDIUM');

  const nameOf = (w: typeof ranked[0]) => isArabic ? w.nameAr : isFrench ? w.nameFr : w.nameEn;

  return (
    <div className="min-h-screen bg-background text-foreground" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <Sprout className="h-4 w-4 text-emerald-600" />
            FormulaAtlas
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl font-bold">
              {t('Date Palm Region Targeting', 'استهداف مناطق نخيل التمر', 'Ciblage Régional Palmier Dattier')}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {t(
              'Where to focus WhatsApp brief recruitment + cooperative pilot outreach.',
              'أين نركّز تجنيد ملخصات واتساب + التواصل مع التعاونيات التجريبية.',
              'Où concentrer le recrutement WhatsApp + la sensibilisation des coopératives pilotes.',
            )}
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard
            icon={Trees}
            label={t('Total trees', 'إجمالي الأشجار', 'Total arbres')}
            value={`${(TOTAL_DATE_PALM_TREES_K / 1000).toFixed(1)}M`}
            sub={t('(est.)', '(تقديري)', '(est.)')}
          />
          <StatCard
            icon={MapPin}
            label={t('Total area', 'إجمالي المساحة', 'Surface totale')}
            value={`${(TOTAL_DATE_PALM_HA / 1000).toFixed(0)}K`}
            sub={t('hectares', 'هكتار', 'hectares')}
          />
          <StatCard
            icon={Target}
            label={t('High priority', 'أولوية عالية', 'Haute priorité')}
            value={String(highPriority.length)}
            sub={t('wilayas', 'ولايات', 'wilayas')}
          />
          <StatCard
            icon={Crown}
            label={t('#1 region', 'المنطقة الأولى', 'Région #1')}
            value={nameOf(ranked[0])}
            sub={`${(ranked[0].estimatedTreesK / 1000).toFixed(1)}M trees`}
          />
        </div>

        {/* High priority regions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-600" />
              {t('HIGH priority — target first', 'أولوية عالية — استهدف أولاً', 'Haute priorité — cibler en premier')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {highPriority.map(w => (
              <WilayaRow key={w.code} w={w} name={nameOf(w)} t={t} />
            ))}
          </CardContent>
        </Card>

        {/* Medium priority */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {t('MEDIUM priority — secondary target', 'أولوية متوسطة — استهداف ثانوي', 'Priorité moyenne — cible secondaire')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mediumPriority.map(w => (
              <WilayaRow key={w.code} w={w} name={nameOf(w)} t={t} />
            ))}
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-sm">{t('Density legend', 'مفتاح الكثافة', 'Légende densité')}</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-xs">
              {[5, 4, 3, 2, 1].map(d => (
                <div key={d} className="flex items-center gap-2">
                  <span className="h-3 w-6 rounded" style={{ backgroundColor: densityColor(d) }} />
                  <span>
                    {d === 5 ? t('Very high', 'عالية جداً', 'Très haute') :
                     d === 4 ? t('High', 'عالية', 'Haute') :
                     d === 3 ? t('Medium', 'متوسطة', 'Moyenne') :
                     d === 2 ? t('Low', 'منخفضة', 'Basse') :
                     t('Very low', 'منخفضة جداً', 'Très basse')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action plan */}
        <Card>
          <CardHeader><CardTitle className="text-sm">{t('Recommended action plan', 'خطة العمل الموصى بها', "Plan d'action recommandé")}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex-shrink-0">1</span>
              <p>
                {t(
                  'Contact cooperatives in Biskra, Ouargla, El Oued, Ghardaïa — these 4 wilayas have 13.5M trees (75% of national total).',
                  'تواصل مع التعاونيات في بسكرة، ورقلة، الوادي، غرداية — هذه الولايات الأربع تضم 13.5 مليون شجرة (75% من الإجمالي الوطني).',
                  'Contacter les coopératives à Biskra, Ouargla, El Oued, Ghardaïa — 4 wilayas totalisant 13,5M arbres (75% du national).',
                )}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex-shrink-0">2</span>
              <p>
                {t(
                  'Run WhatsApp brief pilot with 3 cooperatives in these regions — 60 days free, case study in exchange.',
                  'أطلق تجربة ملخصات واتساب مع 3 تعاونيات في هذه المناطق — 60 يوماً مجاناً، قصة نجاح مقابل ذلك.',
                  'Lancer le pilote WhatsApp avec 3 coopératives — 60 jours gratuits, étude de cas en échange.',
                )}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex-shrink-0">3</span>
              <p>
                {t(
                  'Use Algerian disease database (Bayoud, Red Palm Weevil) to demonstrate value — these are the #1 threats to date palm farmers.',
                  'استخدم قاعدة بيانات الأمراض الجزائرية (البيوض، سوسة النخيل) لإظهار القيمة — هذه هي التهديدات الأولى لمزارعي نخيل التمر.',
                  'Utiliser la base de maladies algériennes (Bayoud, Charançon) pour démontrer la valeur — menace #1 pour les phoeniciculteurs.',
                )}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex-shrink-0">4</span>
              <p>
                {t(
                  'Target the Deglet Nour variety specifically — it\'s Algeria\'s #1 export date and most farmers grow it.',
                  "استهدف صنف دقلة نور تحديداً — وهو التمرة التصديرية الأولى في الجزائر ومعظم المزارعين يزرعونها.",
                  "Cibler spécifiquement Deglet Nour — c'est la 1re date d'export algérienne, cultivée par la majorité.",
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            {t(
              'Data: Algerian Ministry of Agriculture + FAO estimates (2022). Tree counts are approximate.',
              'البيانات: وزارة الفلاحة الجزائرية + تقديرات FAO (2022). أعداد الأشجار تقريبية.',
              'Données: Ministère algérien de l\'Agriculture + FAO (2022). Comptages approximatifs.',
            )}
          </p>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <Icon className="h-4 w-4 text-emerald-600 mb-1" />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-[10px] text-muted-foreground/70">{sub}</p>
    </div>
  );
}

function WilayaRow({
  w,
  name,
  t,
}: {
  w: typeof DATE_PALM_WILAYAS[0];
  name: string;
  t: (en: string, ar: string, fr: string) => string;
}) {
  const maxTrees = 5000; // Biskra baseline
  const barWidth = (w.estimatedTreesK / maxTrees) * 100;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
      {/* Density indicator */}
      <div
        className="h-10 w-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: densityColor(w.density) }}
      />

      {/* Wilaya name + code */}
      <div className="w-32 flex-shrink-0">
        <p className="text-sm font-semibold truncate">{name}</p>
        <p className="text-[10px] text-muted-foreground">Wilaya #{w.code}</p>
      </div>

      {/* Trees bar chart */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-5 bg-muted rounded relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded"
              style={{ width: `${barWidth}%`, backgroundColor: densityColor(w.density) }}
            />
          </div>
          <span className="text-xs font-medium w-16 text-right flex-shrink-0">
            {(w.estimatedTreesK / 1000).toFixed(1)}M
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {w.mainVarieties.slice(0, 2).map(v => (
            <Badge key={v} variant="secondary" className="text-[9px] py-0">{v}</Badge>
          ))}
        </div>
      </div>

      {/* Area */}
      <div className="w-16 text-right flex-shrink-0">
        <p className="text-xs font-medium">{(w.estimatedHa / 1000).toFixed(1)}K</p>
        <p className="text-[10px] text-muted-foreground">ha</p>
      </div>
    </div>
  );
}
