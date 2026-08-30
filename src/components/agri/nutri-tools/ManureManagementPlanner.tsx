'use client';

import { useState, useMemo } from 'react';
import {
  Recycle,
  Copy,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  CalculatorShell,
  type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';

const MANURE_AR: Record<string, string> = {
  dairy_solid: 'روث صلب للأبقار الحلوب',
  dairy_liquid: 'روث سائل للأبقار الحلوب',
  beef_solid: 'روث صلب للأبقار اللحمية',
  poultry: 'روث دجاج بياض',
  swine: 'روث خنازير سائل',
  composted: 'روث مُكمَّر',
};
const MANURE_FR: Record<string, string> = {
  dairy_solid: 'Fumier solide laitier',
  dairy_liquid: 'Lisier laitier',
  beef_solid: 'Fumier solide viande',
  poultry: 'Fiente de volaille',
  swine: 'Lisier porcin',
  composted: 'Fumier composté',
};
const INCORPORATION_AR: Record<string, string> = {
  immediate: 'فوراً',
  hours12: 'خلال 12 ساعة',
  days1: 'خلال يوم واحد',
  days7: 'خلال 7 أيام',
  none: 'غير مدمج',
};
const INCORPORATION_FR: Record<string, string> = {
  immediate: 'Immédiat',
  hours12: 'Sous 12 h',
  days1: 'Sous 1 jour',
  days7: 'Sous 7 jours',
  none: 'Non incorporé',
};

const MANURE_TYPES: Record<
  string,
  { name: string; n: number; p: number; k: number; dm: number }
> = {
  dairy_solid: { name: 'Dairy solid', n: 10, p: 5, k: 10, dm: 25 },
  dairy_liquid: { name: 'Dairy liquid', n: 5, p: 2.5, k: 5, dm: 8 },
  beef_solid: { name: 'Beef solid', n: 11, p: 7, k: 12, dm: 25 },
  poultry: { name: 'Poultry layer', n: 30, p: 25, k: 15, dm: 45 },
  swine: { name: 'Swine liquid', n: 6, p: 3, k: 4, dm: 5 },
  composted: { name: 'Composted manure', n: 8, p: 6, k: 8, dm: 40 },
};

const INCORPORATION_OPTIONS: { key: string; nAvail: number }[] = [
  { key: 'immediate', nAvail: 0.4 },
  { key: 'hours12', nAvail: 0.3 },
  { key: 'days1', nAvail: 0.2 },
  { key: 'days7', nAvail: 0.1 },
  { key: 'none', nAvail: 0.05 },
];

export function ManureManagementPlanner() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [manureType, setManureType] = useState('dairy_solid');
  const [rate, setRate] = useState('40');
  const [area, setArea] = useState('10');
  const [incorporation, setIncorporation] = useState('immediate');
  const [slope, setSlope] = useState('3');
  const [nearestWater, setNearestWater] = useState('50');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const m = MANURE_TYPES[manureType];
    const r = parseFloat(rate),
      a = parseFloat(area),
      s = parseFloat(slope),
      nw = parseFloat(nearestWater);
    if (!Number.isFinite(r)) return null;
    // N availability: Year 1 depends on incorporation
    const nAvail: Record<string, number> = {
      immediate: 0.4,
      hours12: 0.3,
      days1: 0.2,
      days7: 0.1,
      none: 0.05,
    };
    const nY1 = r * m.n * (nAvail[incorporation] ?? 0.3);
    const pY1 = r * m.p * 0.6; // P availability Year 1
    const kY1 = r * m.k * 0.9; // K availability Year 1
    // Buffer requirement
    const minBuffer = s > 5 ? 30 : s > 2 ? 20 : 10;
    const bufferOK = nw >= minBuffer;
    return {
      m,
      nY1,
      pY1,
      kY1,
      totalN: r * m.n,
      totalP: r * m.p,
      totalK: r * m.k,
      totalApplied: r * a,
      minBuffer,
      bufferOK,
      nAvailPct: ((nAvail[incorporation] ?? 0.3) * 100),
    };
  }, [manureType, rate, area, incorporation, slope, nearestWater]);

  const handleReset = () => {
    setManureType('dairy_solid');
    setRate('40');
    setArea('10');
    setIncorporation('immediate');
    setSlope('3');
    setNearestWater('50');
    toast({
      title: tr(
        'Reset to Defaults',
        'تمت استعادة القيم الافتراضية',
        'Valeurs réinitialisées',
      ),
    });
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `
=== MANURE MANAGEMENT REPORT ===
Manure type: ${result.m.name} (N:${result.m.n} P:${result.m.p} K:${result.m.k} kg/t)
Application rate: ${rate} t/ha  |  Field area: ${area} ha
Total manure applied: ${result.totalApplied.toFixed(0)} t

Year-1 available nutrients (kg/ha):
• N: ${result.nY1.toFixed(0)}  (${result.nAvailPct.toFixed(0)}% of total)
• P: ${result.pY1.toFixed(0)}
• K: ${result.kY1.toFixed(0)}

Total nutrients applied (kg/ha):
• N: ${result.totalN.toFixed(0)}
• P: ${result.totalP.toFixed(0)}
• K: ${result.totalK.toFixed(0)}

Buffer zone: ${result.bufferOK ? 'Compliant' : 'Violation'} (min ${result.minBuffer}m, you have ${nearestWater}m)
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: tr('Summary Copied!', 'تم نسخ التقرير!', 'Résumé copié !'),
      description: tr(
        'Manure management report copied to clipboard.',
        'تم نسخ تقرير إدارة الروث إلى الحافظة.',
        'Rapport copié dans le presse-papiers.',
      ),
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const pills: CalculatorPill[] = Object.keys(MANURE_TYPES).map(k => ({
    key: k,
    label: tr(
      MANURE_TYPES[k].name,
      MANURE_AR[k] ?? MANURE_TYPES[k].name,
      MANURE_FR[k] ?? MANURE_TYPES[k].name,
    ),
  }));

  return (
    <CalculatorShell
      icon={Recycle}
      accent="emerald"
      title={{
        en: 'Manure Management Planner',
        ar: 'مخطط إدارة الروث',
        fr: 'Planificateur de Gestion du Fumier',
      }}
      description={{
        en: 'N-P-K value · application timing · buffer zone compliance',
        ar: 'قيمة N-P-K · توقيت التطبيق · الالتزام بمنطقة العزل',
        fr: 'Valeur N-P-K · timing d’épandage · conformité zone tampon',
      }}
      badge="Nutrient Standard"
      pills={pills}
      activePill={manureType}
      onPillClick={setManureType}
      pillLabel={{ en: 'Manure type:', ar: 'نوع الروث:', fr: 'Type de fumier :' }}
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
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      protocolNote={{
        en: 'Incorporate within 12 hr to save 30% of N (ammonia volatilization). Don\'t exceed crop N needs — soil test first. Year 2 releases additional 20-30% of total N.',
        ar: 'ادمج الروث خلال 12 ساعة للحفاظ على 30% من N (تطاير الأمونيا). لا تتجاوز احتياجات المحصول من N — أجرِ اختباراً للتربة أولاً. تطلق السنة الثانية 20–30% إضافية من إجمالي N.',
        fr: 'Incorporez sous 12 h pour sauver 30% de N (volatilisation de l’ammoniac). Ne pas dépasser les besoins de la culture — analyse de sol d’abord. L’année 2 libère 20-30% supplémentaires du N total.',
      }}
    >
      <CalculatorShell.Inputs>
        <CalculatorShell.InputField
          label={tr(
            'Application rate (t/ha)',
            'معدل التطبيق (طن/هكتار)',
            "Taux d’épandage (t/ha)",
          )}
          value={rate}
          onChange={setRate}
          step="5"
          helper={tr(
            'Wet-weight tonnes applied per hectare',
            'الطن الرطب لكل هكتار',
            'Tonnes poids humide par hectare',
          )}
        />
        <CalculatorShell.InputField
          label={tr('Field area (ha)', 'مساحة الحقل (هكتار)', 'Surface (ha)')}
          value={area}
          onChange={setArea}
          step="0.5"
          helper={tr(
            'Total spread area',
            'إجمالي المساحة المخصصة للرش',
            'Surface totale d’épandage',
          )}
        />
        <div className="p-3 rounded-xl border bg-card space-y-1">
          <label className="text-xs font-bold text-foreground">
            {tr('Incorporation timing', 'توقيت الدمج', 'Incorporation')}
          </label>
          <select
            aria-label={tr('Incorporation timing', 'توقيت الدمج', 'Incorporation')}
            value={incorporation}
            onChange={e => setIncorporation(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-mono font-bold"
          >
            {INCORPORATION_OPTIONS.map(opt => (
              <option key={opt.key} value={opt.key}>
                {tr(
                  opt.key === 'immediate'
                    ? 'Immediate'
                    : opt.key === 'hours12'
                      ? 'Within 12 hr'
                      : opt.key === 'days1'
                        ? 'Within 1 day'
                        : opt.key === 'days7'
                          ? 'Within 7 days'
                          : 'Not incorporated',
                  INCORPORATION_AR[opt.key],
                  INCORPORATION_FR[opt.key],
                )}{' '}
                ({(opt.nAvail * 100).toFixed(0)}% N)
              </option>
            ))}
          </select>
          <div className="text-[10px] text-muted-foreground">
            {tr(
              'Year-1 N availability factor',
              'معامل توفر N في السنة الأولى',
              "Facteur de disponibilité N année 1",
            )}
          </div>
        </div>
        <CalculatorShell.InputField
          label={tr('Field slope (%)', 'انحدار الحقل (%)', 'Pente (%)')}
          value={slope}
          onChange={setSlope}
          step="0.5"
          helper={tr(
            'Affects minimum buffer width',
            'يؤثر على الحد الأدنى لمنطقة العزل',
            'Détermine la largeur minimale de la zone tampon',
          )}
        />
        <CalculatorShell.InputField
          label={tr(
            'Nearest waterway (m)',
            'أقرب مجرى مائي (م)',
            'Cours d’eau le plus proche (m)',
          )}
          value={nearestWater}
          onChange={setNearestWater}
          step="5"
          helper={tr(
            'Distance to any stream / pond / well',
            'المسافة إلى أي مجرى مائي / بركة / بئر',
            'Distance vers tout cours d’eau / étang / puits',
          )}
        />
      </CalculatorShell.Inputs>
      <CalculatorShell.Results>
        {result ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <CalculatorShell.MetricTile
                label={`N · ${tr('Yr 1', 'السنة 1', 'An 1')}`}
                value={result.nY1.toFixed(0)}
                unit={tr('kg/ha', 'كغ/هكتار', 'kg/ha')}
                color="emerald"
                helper={tr(
                  `${result.nAvailPct.toFixed(0)}% of total N available`,
                  `${result.nAvailPct.toFixed(0)}% من إجمالي N متاح`,
                  `${result.nAvailPct.toFixed(0)}% du N total disponible`,
                )}
              />
              <CalculatorShell.MetricTile
                label={`P · ${tr('Yr 1', 'السنة 1', 'An 1')}`}
                value={result.pY1.toFixed(0)}
                unit={tr('kg/ha', 'كغ/هكتار', 'kg/ha')}
                color="teal"
                helper={tr('60% of total P', '60% من إجمالي P', '60% du P total')}
              />
              <CalculatorShell.MetricTile
                label={`K · ${tr('Yr 1', 'السنة 1', 'An 1')}`}
                value={result.kY1.toFixed(0)}
                unit={tr('kg/ha', 'كغ/هكتار', 'kg/ha')}
                color="amber"
                helper={tr('90% of total K', '90% من إجمالي K', '90% du K total')}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CalculatorShell.MetricTile
                label={tr(
                  'Total N applied',
                  'إجمالي N المطبق',
                  'N total appliqué',
                )}
                value={result.totalN.toFixed(0)}
                unit={tr('kg/ha', 'كغ/هكتار', 'kg/ha')}
                color="default"
              />
              <CalculatorShell.MetricTile
                label={tr(
                  'Total manure applied',
                  'إجمالي الروث المطبق',
                  'Fumier total appliqué',
                )}
                value={result.totalApplied.toFixed(0)}
                unit="t"
                color="default"
                helper={`${area} ha × ${rate} t/ha`}
              />
            </div>
            {result.bufferOK ? (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  <strong>
                    {tr(
                      'Buffer zone compliant.',
                      'منطقة العزل مطابقة.',
                      'Zone tampon conforme.',
                    )}
                  </strong>{' '}
                  {tr(
                    `${nearestWater}m to nearest waterway exceeds ${result.minBuffer}m minimum.`,
                    `المسافة ${nearestWater}م إلى أقرب مجرى مائي تتجاوز الحد الأدنى ${result.minBuffer}م.`,
                    `${nearestWater}m au cours d’eau le plus proche dépasse le minimum de ${result.minBuffer}m.`,
                  )}
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/60 p-3 text-xs text-rose-700 dark:text-rose-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  <strong>
                    {tr(
                      'Buffer zone violation!',
                      'مخالفة لمنطقة العزل!',
                      'Violation de zone tampon !',
                    )}
                  </strong>{' '}
                  {tr(
                    `Need ${result.minBuffer}m minimum (you have ${nearestWater}m). Do not apply — move setback or use buffer strip.`,
                    `يلزم حد أدنى ${result.minBuffer}م (المتاح ${nearestWater}م). لا تطبق — زد مسافة الارتداد أو استخدم شريطاً عازلاً.`,
                    `Minimum requis ${result.minBuffer}m (vous avez ${nearestWater}m). N’épandez pas — reculez ou installez une bande tampon.`,
                  )}
                </span>
              </div>
            )}
          </>
        ) : (
          <CalculatorShell.MetricTile
            label={tr(
              'Available nutrients',
              'العناصر المتاحة',
              'Nutriments disponibles',
            )}
            value="—"
            color="default"
            helper={tr(
              'Enter application rate to calculate',
              'أدخل معدل التطبيق للحساب',
              'Saisissez le taux d’épandage',
            )}
          />
        )}
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
