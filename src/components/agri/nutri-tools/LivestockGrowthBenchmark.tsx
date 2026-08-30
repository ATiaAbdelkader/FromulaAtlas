'use client';

import { useState, useMemo } from 'react';
import { Beef, Copy, Check, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  BROILER_BENCHMARKS, PIG_BENCHMARKS, CATTLE_BUTTERFAT_BENCHMARKS,
} from '@/lib/agri-ref-data';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
  type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

type Animal = 'broiler' | 'pig' | 'cattle';

const ANIMAL_INFO: Record<Animal, { en: string; ar: string; fr: string; emoji: string }> = {
  broiler: { en: 'Broiler', ar: 'دجاج لاحم', fr: 'Poulet de chair', emoji: '🐔' },
  pig: { en: 'Pig', ar: 'خنازير', fr: 'Porc', emoji: '🐷' },
  cattle: { en: 'Cattle', ar: 'أبقار', fr: 'Bovins', emoji: '🐄' },
};

const BREED_LABELS: Record<string, { en: string; ar: string; fr: string }> = {
  Holstein: { en: 'Holstein', ar: 'هولشتاين', fr: 'Holstein' },
  Jersey: { en: 'Jersey', ar: 'جيرسي', fr: 'Jersey' },
  Ayrshire: { en: 'Ayrshire', ar: 'أيرشاير', fr: 'Ayrshire' },
  Guernsey: { en: 'Guernsey', ar: 'غيرنزي', fr: 'Guernsey' },
};

const TITLE: TrilingualString = {
  en: 'Livestock Growth Benchmarks',
  ar: 'معايير نمو الثروة الحيوانية',
  fr: 'Références de Croissance du Bétail',
};

const DESC: TrilingualString = {
  en: 'Real trial data from agridatasets-py (gpk R package) · broiler + pig + cattle',
  ar: 'بيانات تجارب حقيقية من agridatasets-py (حزمة gpk في R) · دجاج لاحم + خنازير + أبقار',
  fr: "Données réelles d'agridatasets-py (package R gpk) · poulet + porc + bovin",
};

const PILL_LABEL: TrilingualString = { en: 'Select Animal:', ar: 'اختر الحيوان:', fr: 'Animal :' };

export function LivestockGrowthBenchmark() {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const isFr = language === 'fr';
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [animal, setAnimal] = useState<Animal>('broiler');
  // Broiler inputs
  const [broilerAge, setBroilerAge] = useState('150');
  const [broilerWeight, setBroilerWeight] = useState('2200');
  // Pig inputs
  const [pigWeight, setPigWeight] = useState('180');
  const [pigDays, setPigDays] = useState('90');
  // Cattle inputs
  const [cattleBreed, setCattleBreed] = useState('Holstein');
  const [cattleBf, setCattleBf] = useState('3.6');
  const [copied, setCopied] = useState(false);

  const broilerResult = useMemo(() => {
    const age = parseInt(broilerAge);
    const w = parseFloat(broilerWeight);
    const bench = BROILER_BENCHMARKS.find(b => b.age >= age) || BROILER_BENCHMARKS[BROILER_BENCHMARKS.length - 1];
    const target = bench.targetBW;
    const diff = w - target;
    const pct = (w / target) * 100;
    return { bench, target, diff, pct };
  }, [broilerAge, broilerWeight]);

  const pigResult = useMemo(() => {
    const w = parseFloat(pigWeight);
    const d = parseInt(pigDays);
    const avgAdg = PIG_BENCHMARKS.reduce((s, p) => s + p.adg, 0) / PIG_BENCHMARKS.length;
    const avgFcr = PIG_BENCHMARKS.reduce((s, p) => s + p.fcr, 0) / PIG_BENCHMARKS.length;
    const expectedWeight = 48 + (d / 100) * avgAdg * 10;
    const diff = w - expectedWeight;
    return { avgAdg, avgFcr, expectedWeight, diff };
  }, [pigWeight, pigDays]);

  const cattleResult = useMemo(() => {
    const bf = parseFloat(cattleBf);
    const benchmarks = CATTLE_BUTTERFAT_BENCHMARKS.filter(c => c.breed === cattleBreed && c.age === 'Mature');
    const avgBf = benchmarks.length > 0 ? benchmarks[0].butterfat : 3.7;
    const diff = bf - avgBf;
    return { avgBf, diff, benchmarks };
  }, [cattleBreed, cattleBf]);

  const handleReset = () => {
    if (animal === 'broiler') { setBroilerAge('150'); setBroilerWeight('2200'); }
    if (animal === 'pig') { setPigWeight('180'); setPigDays('90'); }
    if (animal === 'cattle') { setCattleBreed('Holstein'); setCattleBf('3.6'); }
    toast({ title: tr('Reset', 'إعادة', 'Réinitialiser') });
  };

  const handleCopy = () => {
    const info = ANIMAL_INFO[animal];
    let body = '';
    if (animal === 'broiler') {
      body = `Animal: ${info.emoji} ${info.en}\nAge: ${broilerAge} days\nWeight: ${broilerWeight} g\nTarget (day ${broilerResult.bench.age}): ${broilerResult.target} g\nDifference: ${broilerResult.diff.toFixed(0)} g (${broilerResult.pct.toFixed(0)}% of target)\nBenchmark ADFI: ${broilerResult.bench.adfi} g/day\nBenchmark ADG: ${broilerResult.bench.adg} g/day`;
    } else if (animal === 'pig') {
      body = `Animal: ${info.emoji} ${info.en}\nWeight: ${pigWeight} kg\nDays on feed: ${pigDays}\nExpected weight: ${pigResult.expectedWeight.toFixed(0)} kg\nDifference: ${pigResult.diff.toFixed(1)} kg\nBenchmark ADG: ${pigResult.avgAdg.toFixed(1)} kg\nBenchmark FCR: ${pigResult.avgFcr.toFixed(2)}`;
    } else {
      body = `Animal: ${info.emoji} ${info.en}\nBreed: ${cattleBreed}\nButterfat: ${cattleBf}%\nBreed average: ${cattleResult.avgBf.toFixed(2)}%\nDifference: ${cattleResult.diff >= 0 ? '+' : ''}${cattleResult.diff.toFixed(2)}%`;
    }
    navigator.clipboard.writeText(`=== LIVESTOCK BENCHMARK ===\n${body}`.trim());
    setCopied(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  const pills: CalculatorPill[] = (['broiler', 'pig', 'cattle'] as Animal[]).map(a => ({
    key: a,
    emoji: ANIMAL_INFO[a].emoji,
    label: isAr ? ANIMAL_INFO[a].ar : isFr ? ANIMAL_INFO[a].fr : ANIMAL_INFO[a].en,
  }));

  const breedOptions = Object.entries(BREED_LABELS);

  return (
    <CalculatorShell
      icon={Beef}
      title={TITLE}
      description={DESC}
      badge="Production Reference"
      accent="amber"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
          onClick: handleCopy,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      pills={pills}
      activePill={animal}
      onPillClick={(k) => setAnimal(k as Animal)}
      pillLabel={PILL_LABEL}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
          {animal === 'broiler' && (
            <>
              <CalculatorShell.InputField
                label={tr('Age (days)', 'العمر (يوم)', 'Âge (jours)')}
                value={broilerAge}
                onChange={setBroilerAge}
                step="1"
              />
              <CalculatorShell.InputField
                label={tr('Body weight (g)', 'وزن الجسم (غ)', 'Poids vif (g)')}
                value={broilerWeight}
                onChange={setBroilerWeight}
                step="10"
              />
            </>
          )}
          {animal === 'pig' && (
            <>
              <CalculatorShell.InputField
                label={tr('Current weight (kg)', 'الوزن الحالي (كغ)', 'Poids actuel (kg)')}
                value={pigWeight}
                onChange={setPigWeight}
                step="1"
              />
              <CalculatorShell.InputField
                label={tr('Days on feed', 'أيام التغذية', "Jours d'engraissement")}
                value={pigDays}
                onChange={setPigDays}
                step="1"
              />
            </>
          )}
          {animal === 'cattle' && (
            <>
              <div className="space-y-1">
                <span className="text-xs font-bold text-foreground">{tr('Breed', 'السلالة', 'Race')}</span>
                <select
                  aria-label={tr('Cattle breed', 'سلالة الأبقار', 'Race bovine')}
                  value={cattleBreed}
                  onChange={e => setCattleBreed(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {breedOptions.map(([key, val]) => (
                    <option key={key} value={key}>{tr(val.en, val.ar, val.fr)}</option>
                  ))}
                </select>
              </div>
              <CalculatorShell.InputField
                label={tr('Your butterfat (%)', 'نسبة دهن الحليب لديك (%)', 'Votre taux butyreux (%)')}
                value={cattleBf}
                onChange={setCattleBf}
                step="0.01"
              />
            </>
          )}
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        {animal === 'broiler' && (
          <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-semibold">
                {tr(`Benchmark at day ${broilerResult.bench.age}`, `المعيار عند اليوم ${broilerResult.bench.age}`, `Réf. au jour ${broilerResult.bench.age}`)}
              </span>
              <Badge variant="outline" className="text-[9px]">
                {tr(`${broilerResult.pct.toFixed(0)}% of target`, `${broilerResult.pct.toFixed(0)}% من الهدف`, `${broilerResult.pct.toFixed(0)}% de l'objectif`)}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <CalculatorShell.MetricTile label={tr('Your bird', 'طائرك', 'Votre oiseau')} value={broilerWeight} unit="g" color="amber" />
              <CalculatorShell.MetricTile label={tr('Target', 'الهدف', 'Cible')} value={broilerResult.target} unit="g" color="teal" />
              <CalculatorShell.MetricTile
                label={tr('Difference', 'الفرق', 'Écart')}
                value={`${broilerResult.diff >= 0 ? '+' : ''}${broilerResult.diff.toFixed(0)}`}
                unit="g"
                color={broilerResult.diff >= 0 ? 'emerald' : 'rose'}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <CalculatorShell.MetricTile label={tr('Benchmark ADFI', 'المعيار ADFI', 'Réf. ADFI')} value={broilerResult.bench.adfi} unit={tr('g/day', 'غ/يوم', 'g/j')} color="default" />
              <CalculatorShell.MetricTile label={tr('Benchmark ADG', 'المعيار ADG', 'Réf. ADG')} value={broilerResult.bench.adg} unit={tr('g/day', 'غ/يوم', 'g/j')} color="default" />
            </div>
            {broilerResult.pct < 85 ? (
              <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20 p-3 text-xs leading-relaxed text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong>{tr(`Below target (${broilerResult.pct.toFixed(0)}%).`, `أقل من الهدف (${broilerResult.pct.toFixed(0)}%).`, `Sous la cible (${broilerResult.pct.toFixed(0)}%).`)}</strong>{' '}
                  {tr(
                    'Check: feed protein (should be 20-23% CP), temperature (21-23°C), stocking density (<33 kg/m²), disease (coccidiosis, ND).',
                    'تحقق من: بروتين العلف (ينبغي أن يكون 20–23% CP)، ودرجة الحرارة (21–23°م)، وكثافة التربية (<33 كغ/م²)، والأمراض (الكوكسيديا، مرض نيوكاسل).',
                    'Vérifiez : protéine (20-23% PB), température (21-23°C), densité (<33 kg/m²), maladies (coccidiose, MN).',
                  )}
                </span>
              </div>
            ) : broilerResult.pct < 95 ? (
              <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong>{tr('Slightly below target.', 'أقل من الهدف بقليل.', 'Légèrement sous la cible.')}</strong>{' '}
                  {tr(
                    'Monitor feed intake + adjust lighting program (18hr light improves feed intake).',
                    'راقب مدخول العلف واضبط برنامج الإضاءة (تساعد إضاءة 18 ساعة على تحسين مدخول العلف).',
                    "Surveillez la consommation et ajustez le programme lumineux (18h de lumière améliore l'ingestion).",
                  )}
                </span>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-3 text-xs leading-relaxed text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong>{tr('On target or above.', 'عند الهدف أو أعلى منه.', 'Sur ou au-dessus de la cible.')}</strong>{' '}
                  {tr(
                    'Growth performance excellent. Monitor for leg issues if growing too fast.',
                    'أداء النمو ممتاز. راقب مشكلات الأرجل إذا كان النمو سريعاً جداً.',
                    'Performance excellente. Surveillez les pattes si croissance trop rapide.',
                  )}
                </span>
              </div>
            )}
            <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
              💡 {tr(
                'Source: gpk R package broiler growth trial data (9 age points, days 143-171).',
                'المصدر: بيانات تجربة نمو الدجاج اللاحم من حزمة gpk في R (9 نقاط عمرية، الأيام 143–171).',
                "Source : package R gpk, essai croissance poulet (9 points d'âge, jours 143-171).",
              )}
            </div>
          </div>
        )}

        {animal === 'pig' && (
          <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <CalculatorShell.MetricTile label={tr('Expected weight', 'الوزن المتوقع', 'Poids attendu')} value={pigResult.expectedWeight.toFixed(0)} unit="kg" color="amber" />
              <CalculatorShell.MetricTile label={tr('Benchmark ADG', 'المعيار ADG', 'Réf. ADG')} value={pigResult.avgAdg.toFixed(1)} unit="kg" color="teal" />
              <CalculatorShell.MetricTile label={tr('Benchmark FCR', 'المعيار FCR', 'Réf. FCR')} value={pigResult.avgFcr.toFixed(2)} color="teal" />
            </div>
            <div className={`rounded-md border p-2 text-xs flex items-start gap-1.5 ${pigResult.diff >= 0 ? 'border-emerald-200 bg-emerald-50/60 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300' : 'border-amber-200 bg-amber-50/60 text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300'}`}>
              {pigResult.diff >= 0 ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
              <span>
                {pigResult.diff >= 0
                  ? tr(
                      `Above benchmark by ${pigResult.diff.toFixed(1)} kg — excellent growth.`,
                      `أعلى من المعيار بمقدار ${pigResult.diff.toFixed(1)} كغ — نمو ممتاز.`,
                      `Au-dessus de la référence de ${pigResult.diff.toFixed(1)} kg — croissance excellente.`,
                    )
                  : tr(
                      `${Math.abs(pigResult.diff).toFixed(1)} kg below expected. Check: feed energy (should be 13-14 MJ DE/kg), protein (16-18% CP), health (mycoplasma, APP), temperature (18-22°C).`,
                      `أقل من المتوقع بمقدار ${Math.abs(pigResult.diff).toFixed(1)} كغ. تحقق من: طاقة العلف (ينبغي أن تكون 13–14 ميغاجول طاقة مهضومة/كغ)، والبروتين (16–18% CP)، والصحة (الميكوبلازما، APP)، ودرجة الحرارة (18–22°م).`,
                      `${Math.abs(pigResult.diff).toFixed(1)} kg sous l'attendu. Vérifiez : énergie (13-14 MJ ED/kg), protéine (16-18% PB), santé (mycoplasme, APP), température (18-22°C).`,
                    )}
              </span>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
              💡 {tr(
                'Source: gpk R package pig trial (Treatment A vs B, M+F, initial ~48 kg → final ~210 kg, 90-day feeding period).',
                'المصدر: تجربة الخنازير من حزمة gpk في R (المعاملة A مقابل B، ذكور وإناث، من نحو 48 كغ إلى نحو 210 كغ، فترة تغذية 90 يوماً).',
                'Source : package R gpk, essai porc (Traitement A vs B, M+F, ~48 kg → ~210 kg, 90 jours).',
              )}
            </div>
          </div>
        )}

        {animal === 'cattle' && (
          <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <CalculatorShell.MetricTile label={tr('Your BF%', 'دهن الحليب لديك', 'Votre TB%')} value={cattleBf} unit="%" color="amber" />
              <CalculatorShell.MetricTile label={tr('Breed avg', 'متوسط السلالة', 'Moy. race')} value={cattleResult.avgBf.toFixed(2)} unit="%" color="teal" />
              <CalculatorShell.MetricTile
                label={tr('Difference', 'الفرق', 'Écart')}
                value={`${cattleResult.diff >= 0 ? '+' : ''}${cattleResult.diff.toFixed(2)}`}
                unit="%"
                color={cattleResult.diff >= 0 ? 'emerald' : 'rose'}
              />
            </div>
            {cattleResult.diff < -0.2 ? (
              <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20 p-3 text-xs leading-relaxed text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong>{tr('Below breed average.', 'أقل من متوسط السلالة.', 'Sous la moyenne de la race.')}</strong>{' '}
                  {tr(
                    'Check: energy intake (low fiber → low BF), rumen pH (SARA reduces BF), stage of lactation, heat stress.',
                    'تحقق من: مدخول الطاقة (الألياف المنخفضة تؤدي إلى انخفاض دهن الحليب)، ودرجة حموضة الكرش (يخفض SARA دهن الحليب)، ومرحلة الإدرار، والإجهاد الحراري.',
                    'Vérifiez : apport énergétique (fibre basse → TB bas), pH ruminal (SARA réduit TB), stade de lactation, stress thermique.',
                  )}
                </span>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-3 text-xs leading-relaxed text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong>{tr('At or above breed average.', 'عند متوسط السلالة أو أعلى منه.', 'Au-dessus de la moyenne de la race.')}</strong>{' '}
                  {tr('Butterfat production healthy.', 'إنتاج دهن الحليب صحي.', 'Production de TB saine.')}
                </span>
              </div>
            )}
            <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
              💡 {tr(
                'Source: gpk R package cattle butterfat trial (4 breeds × 2 age classes). Jersey has highest BF (4.21%), Holstein lowest (3.58%).',
                'المصدر: تجربة دهن حليب الأبقار من حزمة gpk في R (4 سلالات × فئتين عمريتين). تسجل جيرسي أعلى نسبة دهن (4.21%) وهولشتاين أدنى نسبة (3.58%).',
                "Source : package R gpk, essai TB bovin (4 races × 2 classes d'âge). Jersey : TB max (4.21%), Holstein : min (3.58%).",
              )}
            </div>
          </div>
        )}
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
