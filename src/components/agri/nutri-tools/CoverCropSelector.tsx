'use client';

import { useState, useMemo } from 'react';
import { Sprout, Calculator, Sparkles, Copy, RotateCcw, CheckCircle2 } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

const TITLE: TrilingualString = {
  en: 'Cover Crop Selector',
  ar: 'محدد محاصيل التغطية',
  fr: 'Sélecteur de Cultures Couvertes',
};

const DESC: TrilingualString = {
  en: '12 species · 9 goals · drought tolerance · ranked recommendations',
  ar: '12 نوعاً · 9 أهداف · تحمل الجفاف · توصيات مرتبة',
  fr: '12 espèces · 9 objectifs · tolérance à la sécheresse · recommandations classées',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Cover crops suppress weeds, fix nitrogen (legumes), build organic matter (grasses), break compaction (brassicas) and attract pollinators — terminate 2-3 weeks before cash crop planting.',
  ar: 'تحسن محاصيل التغطية كبح الأعشاب وتثبيت النيتروجين (البقوليات) وبناء المادة العضوية (النجيليات) وتفكيك الانضغاط (الصليبيات) وجذب الملقحات — أنهِها قبل زراعة المحصول الرئيسي بـ 2–3 أسابيع.',
  fr: 'Les cultures couvertes suppriment les adventices, fixent l’azote (légumineuses), construisent la MO (graminées), décompactent (brassicas) et attirent les pollinisateurs — détruire 2-3 semaines avant la culture principale.',
};

interface CoverCrop {
  name: string; emoji: string; type: 'grass' | 'legume' | 'brassica' | 'mix';
  nFix: number; biomass: number; winterKill: boolean; droughtTol: number; minPrecip: number;
  plantingWindow: string; goals: string[];
}

const COVER_CROPS: CoverCrop[] = [
  { name: 'Cereal Rye', emoji: '🌾', type: 'grass', nFix: 0, biomass: 5, winterKill: false, droughtTol: 5, minPrecip: 250, plantingWindow: 'Sep–Nov', goals: ['erosion', 'biomass', 'weed', 'scavenge'] },
  { name: 'Oats', emoji: '🌾', type: 'grass', nFix: 0, biomass: 4, winterKill: true, droughtTol: 3, minPrecip: 300, plantingWindow: 'Aug–Oct', goals: ['biomass', 'weed', 'scavenge'] },
  { name: 'Winter Wheat', emoji: '🌾', type: 'grass', nFix: 0, biomass: 4, winterKill: false, droughtTol: 4, minPrecip: 300, plantingWindow: 'Oct–Nov', goals: ['erosion', 'biomass', 'weed'] },
  { name: 'Crimson Clover', emoji: '🌸', type: 'legume', nFix: 100, biomass: 3, winterKill: false, droughtTol: 3, minPrecip: 400, plantingWindow: 'Sep–Oct', goals: ['nitrogen', 'biomass', 'pollinator'] },
  { name: 'Vetch (Hairy)', emoji: '🌸', type: 'legume', nFix: 150, biomass: 4, winterKill: false, droughtTol: 3, minPrecip: 350, plantingWindow: 'Aug–Oct', goals: ['nitrogen', 'biomass', 'weed'] },
  { name: 'Peas (Winter)', emoji: '🫛', type: 'legume', nFix: 80, biomass: 3, winterKill: true, droughtTol: 2, minPrecip: 350, plantingWindow: 'Sep–Oct', goals: ['nitrogen', 'biomass'] },
  { name: 'Tillage Radish', emoji: '🥬', type: 'brassica', nFix: 0, biomass: 4, winterKill: true, droughtTol: 3, minPrecip: 350, plantingWindow: 'Aug–Sep', goals: ['compaction', 'scavenge', 'weed'] },
  { name: 'Mustard', emoji: '🥬', type: 'brassica', nFix: 0, biomass: 3, winterKill: true, droughtTol: 3, minPrecip: 300, plantingWindow: 'Aug–Sep', goals: ['biofumigation', 'weed', 'scavenge'] },
  { name: 'Sorghum-Sudan', emoji: '🌾', type: 'grass', nFix: 0, biomass: 6, winterKill: true, droughtTol: 5, minPrecip: 200, plantingWindow: 'Jun–Aug', goals: ['biomass', 'weed', 'compaction'] },
  { name: 'Buckwheat', emoji: '🌸', type: 'grass', nFix: 0, biomass: 3, winterKill: true, droughtTol: 3, minPrecip: 250, plantingWindow: 'May–Aug', goals: ['weed', 'pollinator', 'phosphorus'] },
  { name: 'Berseem Clover', emoji: '🌸', type: 'legume', nFix: 120, biomass: 4, winterKill: true, droughtTol: 3, minPrecip: 400, plantingWindow: 'Mar–May', goals: ['nitrogen', 'biomass', 'pollinator'] },
  { name: 'Phacelia', emoji: '🌸', type: 'grass', nFix: 0, biomass: 4, winterKill: true, droughtTol: 3, minPrecip: 300, plantingWindow: 'Apr–Aug', goals: ['biomass', 'pollinator', 'weed'] },
];

const CROP_AR: Record<string, string> = {
  'Cereal Rye': 'جاودار حبي', Oats: 'شوفان', 'Winter Wheat': 'قمح شتوي', 'Crimson Clover': 'برسيم قرمزي', 'Vetch (Hairy)': 'بيقية شعراء', 'Peas (Winter)': 'بازلاء شتوية', 'Tillage Radish': 'فجل حراثي', Mustard: 'خردل', 'Sorghum-Sudan': 'سورغم سوداني', Buckwheat: 'حنطة سوداء', 'Berseem Clover': 'برسيم مصري', Phacelia: 'فاسيليا',
};
const CROP_FR: Record<string, string> = {
  'Cereal Rye': 'Seigle', Oats: 'Avoine', 'Winter Wheat': 'Blé d’hiver', 'Crimson Clover': 'Trèfle incarnat', 'Vetch (Hairy)': 'Vesce velue', 'Peas (Winter)': 'Pois d’hiver', 'Tillage Radish': 'Radis fourrager', Mustard: 'Moutarde', 'Sorghum-Sudan': 'Sorgho-Soudan', Buckwheat: 'Sarrasin', 'Berseem Clover': 'Trèfle d’Alexandrie', Phacelia: 'Phacélie',
};
const TYPE_AR: Record<string, string> = { grass: 'نجيليات', legume: 'بقوليات', brassica: 'صليبيات', mix: 'خليط' };
const TYPE_FR: Record<string, string> = { grass: 'graminée', legume: 'légumineuse', brassica: 'brassica', mix: 'mélange' };
const WINDOW_AR: Record<string, string> = { 'Sep–Nov': 'سبتمبر–نوفمبر', 'Aug–Oct': 'أغسطس–أكتوبر', 'Oct–Nov': 'أكتوبر–نوفمبر', 'Sep–Oct': 'سبتمبر–أكتوبر', 'Jun–Aug': 'يونيو–أغسطس', 'May–Aug': 'مايو–أغسطس', 'Mar–May': 'مارس–مايو', 'Apr–Aug': 'أبريل–أغسطس', 'Aug–Sep': 'أغسطس–سبتمبر' };
const WINDOW_FR: Record<string, string> = { 'Sep–Nov': 'sep–nov', 'Aug–Oct': 'août–oct', 'Oct–Nov': 'oct–nov', 'Sep–Oct': 'sep–oct', 'Jun–Aug': 'juin–août', 'May–Aug': 'mai–août', 'Mar–May': 'mars–mai', 'Apr–Aug': 'avr–août', 'Aug–Sep': 'août–sep' };
const GOAL_AR: Record<string, string> = { nitrogen: 'تثبيت النيتروجين', erosion: 'مكافحة التعرية', weed: 'كبح الأعشاب', biomass: 'الكتلة الحيوية / المادة العضوية', compaction: 'تفكيك الانضغاط', scavenge: 'التقاط النيتروجين', pollinator: 'موئل الملقحات', biofumigation: 'تبخير حيوي', phosphorus: 'إذابة الفوسفور' };
const GOAL_FR: Record<string, string> = { nitrogen: 'Fixation N', erosion: 'Anti-érosion', weed: 'Suppression adventices', biomass: 'Biomasse / MO', compaction: 'Décompactage', scavenge: 'Récupération N', pollinator: 'Habitat pollinisateurs', biofumigation: 'Biofumigation', phosphorus: 'Solubilisation P' };
type UiLanguage = Parameters<typeof copyFor>[0];
const localized = (language: UiLanguage, value: string, arabic: Record<string, string>, french: Record<string, string>) =>
  copyFor(language, value, arabic[value] || value, french[value] || value);

const GOALS = [
  { id: 'nitrogen', label: 'N fixation', icon: '🟢' },
  { id: 'erosion', label: 'Erosion control', icon: '🏔️' },
  { id: 'weed', label: 'Weed suppression', icon: '🌿' },
  { id: 'biomass', label: 'Biomass / OM', icon: '📦' },
  { id: 'compaction', label: 'Break compaction', icon: '⛏️' },
  { id: 'scavenge', label: 'N scavenging', icon: '🔬' },
  { id: 'pollinator', label: 'Pollinator habitat', icon: '🐝' },
  { id: 'biofumigation', label: 'Biofumigation', icon: '💨' },
  { id: 'phosphorus', label: 'P solubilize', icon: '🟡' },
];

export function CoverCropSelector() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [selectedGoals, setSelectedGoals] = useState<string[]>(['nitrogen', 'biomass']);
  const [droughtTol, setDroughtTol] = useState(3);
  const [precip, setPrecip] = useState('400');
  const [copied, setCopied] = useState<boolean>(false);

  const ranked = useMemo(() => {
    const p = parseFloat(precip);
    return COVER_CROPS
      .filter(c => c.minPrecip <= p + 50)  // tolerate 50mm below minimum
      .map(c => {
        let score = 0;
        for (const g of selectedGoals) if (c.goals.includes(g)) score += 10;
        score += c.droughtTol >= droughtTol ? 5 : -5;
        score += c.nFix > 0 && selectedGoals.includes('nitrogen') ? c.nFix / 20 : 0;
        score += c.biomass * 2;
        return { crop: c, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [selectedGoals, droughtTol, precip]);

  const toggleGoal = (id: string) => setSelectedGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);

  const handleReset = () => {
    setSelectedGoals(['nitrogen', 'biomass']);
    setDroughtTol(3);
    setPrecip('400');
    toast({
      title: tr('Reset to Defaults', 'تمت استعادة القيم الافتراضية', 'Valeurs par défaut rétablies'),
    });
  };

  const handleCopySummary = () => {
    const text = `
=== COVER CROP SELECTION ===
Goals: ${selectedGoals.map(g => localized(language, g, GOAL_AR, GOAL_FR)).join(', ')}
Drought tolerance: ${droughtTol}/5
Annual rainfall: ${precip} mm

Top Recommendations:
${ranked.map((r, i) => `${i + 1}. ${r.crop.emoji} ${localized(language, r.crop.name, CROP_AR, CROP_FR)} — ${r.score.toFixed(0)} pts (${localized(language, r.crop.type, TYPE_AR, TYPE_FR)}, ${localized(language, r.crop.plantingWindow, WINDOW_AR, WINDOW_FR)})`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: tr('Summary Copied!', 'تم نسخ التقرير!', 'Résumé copié !'),
      description: tr('Cover crop recommendations copied to clipboard.', 'تم نسخ توصيات محاصيل التغطية إلى الحافظة.', 'Recommandations copiées dans le presse-papiers.'),
    });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <CalculatorShell
      icon={Sprout}
      title={TITLE}
      description={DESC}
      badge="Conservation"
      accent="emerald"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
          onClick: handleCopySummary,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset Defaults', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      protocolNote={PROTOCOL_NOTE}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-emerald-600" />
              {tr('Goals & Conditions', 'الأهداف والظروف', 'Objectifs et conditions')}
            </span>
            <Badge variant="secondary" className="text-[10px]">{selectedGoals.length} {tr('selected', 'محددة', 'sélectionnés')}</Badge>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-foreground">
              {tr('Your goals', 'أهدافك', 'Vos objectifs')}
            </div>
            <p className="text-xs text-muted-foreground">
              {tr('Select every outcome you want this cover crop to support.', 'حدد كل نتيجة تريد أن يدعمها محصول التغطية.', 'Sélectionnez chaque résultat souhaité.')}
            </p>
            <div className="flex flex-wrap gap-2">
              {GOALS.map(g => {
                const active = selectedGoals.includes(g.id);
                return (
                  <button
                    type="button"
                    key={g.id}
                    aria-pressed={active}
                    onClick={() => toggleGoal(g.id)}
                    className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${active ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm' : 'border-border bg-background hover:bg-muted/50'}`}
                  >
                    {g.icon} {localized(language, g.label, GOAL_AR, GOAL_FR)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border bg-card space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-foreground">
                  {tr('Min drought tolerance', 'الحد الأدنى لتحمل الجفاف', 'Tolérance sécheresse min.')}
                </span>
                <Badge variant="outline" className="text-[10px]">{droughtTol} / 5</Badge>
              </div>
              <input
                aria-label={tr('Minimum drought tolerance', 'الحد الأدنى لتحمل الجفاف', 'Tolérance sécheresse minimum')}
                type="range"
                min={1}
                max={5}
                value={droughtTol}
                onChange={e => setDroughtTol(parseInt(e.target.value))}
                className="h-2 w-full accent-emerald-600"
              />
            </div>
            <CalculatorShell.InputField
              label={tr('Annual rainfall (mm)', 'الأمطار السنوية (مم)', 'Précipitations annuelles (mm)')}
              value={precip}
              onChange={setPrecip}
              step="50"
              helper={tr('Used to filter out unsuitable species', 'يُستخدم لاستبعاد الأنواع غير المناسبة', 'Permet d’exclure les espèces inadaptées')}
            />
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
          <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-emerald-50 via-transparent to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
            <span className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              {tr('Top Recommendations', 'أفضل التوصيات', 'Top recommandations')}
            </span>
            {ranked[0] && (
              <span className="font-mono text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 rounded-lg px-2 py-0.5">
                {ranked[0].score.toFixed(0)} pts
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {tr('Ranked for your goals, drought threshold, and rainfall.', 'مرتبة وفق أهدافك وحد تحمل الجفاف ومعدل الأمطار.', 'Classé selon vos objectifs, seuil de sécheresse et précipitations.')}
          </p>

          <div className="space-y-2">
            {ranked.map((r, i) => (
              <div key={r.crop.name} className="flex items-center gap-3 rounded-xl border bg-background/70 p-3 shadow-sm" style={{ borderLeftWidth: 3, borderLeftColor: i === 0 ? '#16a34a' : '#94a3b8' }}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xl dark:bg-emerald-950/30">{r.crop.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{localized(language, r.crop.name, CROP_AR, CROP_FR)}</div>
                  <div className="text-xs leading-relaxed text-muted-foreground">
                    {localized(language, r.crop.type, TYPE_AR, TYPE_FR)} · {localized(language, r.crop.plantingWindow, WINDOW_AR, WINDOW_FR)} · {r.crop.biomass}t {tr('biomass', 'كتلة حيوية', 'biomasse')} · {r.crop.nFix > 0 ? `${r.crop.nFix} kg N/ha` : tr('no N fix', 'لا يثبت النيتروجين', 'pas de fix. N')}
                    {r.crop.winterKill && ` · ${tr('winter-kills', 'يموت شتاءً', 'gel hivernal')}`}
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">{r.score.toFixed(0)} {tr('pts', 'نقطة', 'pts')}</Badge>
                {i === 0 && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
