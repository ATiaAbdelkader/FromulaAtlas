'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  Beaker,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Download,
  FlaskConical,
  Leaf,
  MapPin,
  ShieldCheck,
  Sprout,
  Waves,
  Copy,
  RotateCcw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { copyFor, type Language, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import { CROP_LIFECYCLES } from '@/lib/crop-lifecycle';
import {
  calculateNutrientBudget,
  MANURE_SOURCES,
  methodLabel,
  type IncorporationTiming,
  type ManureType,
  type NutrientAmounts,
  type NutrientBudgetInput,
} from '@/lib/nutrient-budget';
import { getFieldNames, getLatestTest, getSoilTests, type SoilTestEntry } from '@/lib/soil-history-store';
import { formatFertialAmounts } from '@/lib/fertial-fertilization';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

const CROP_NAMES_AR: Record<string, string> = {
  maize: 'ذرة', wheat: 'قمح', rice: 'أرز', soybean: 'فول الصويا', cotton: 'قطن',
  tomato: 'طماطم', potato: 'بطاطا', lettuce: 'خس', onion: 'بصل', alfalfa: 'برسيم',
  coffee: 'قهوة', apple: 'تفاح', sunflower: 'دوّار الشمس', citrus: 'حمضيات',
  sorghum: 'ذرة رفيعة', barley: 'شعير', canola: 'كانولا', 'bell-pepper': 'فلفل حلو',
  cucumber: 'خيار', grapes: 'عنب',
};

const MANURE_NAMES_AR: Record<ManureType, string> = {
  dairy_solid: 'روث صلب للأبقار الحلوب', dairy_liquid: 'روث سائل للأبقار الحلوب',
  beef_solid: 'روث صلب للأبقار اللحمية', poultry: 'روث دجاج بياض',
  swine: 'روث خنازير سائل', composted: 'روث مُكمَّر',
};

const INCORPORATION_AR: Record<IncorporationTiming, string> = {
  immediate: 'فوراً', hours12: 'خلال 12 ساعة', days1: 'خلال يوم واحد', days7: 'خلال 7 أيام', none: 'غير مدمج',
};

const STAGE_NAMES_AR: Record<string, string> = {
  'At planting': 'عند الزراعة', 'At transplant': 'عند الشتل', 'Berry Development': 'تطور التوت', 'Berry Ripening': 'نضج التوت',
  Bolting: 'التزهير', Boot: 'طور الانتفاخ', 'Bud break': 'تفتح البراعم', Bulbing: 'تكوين الأبصال', Establishment: 'التأسيس', Flowering: 'الإزهار',
  'Flowering/Fruit Set': 'الإزهار/عقد الثمار', 'Fruit Fill': 'امتلاء الثمار', 'Fruit Set': 'عقد الثمار', 'Fruit Set/Fill': 'عقد/امتلاء الثمار', 'Fruit Sizing': 'تحجيم الثمار',
  Harvest: 'الحصاد', 'Late rosette (spring green-up)': 'الوردة المتأخرة (نمو الربيع)', Maturity: 'النضج', 'Panicle initiation': 'بدء تكوين النورة',
  'Pre-flowering': 'ما قبل الإزهار', 'Pre-plant (year 0)': 'ما قبل الزراعة (السنة 0)', 'Pre-plant': 'ما قبل الزراعة', 'Pre-transplant (basal)': 'ما قبل الشتل (تسميد أساسي)',
  'Production (annual maintenance)': 'الإنتاج (صيانة سنوية)', 'Spring flush': 'دفعة الربيع', 'Stem elongation': 'استطالة الساق', Tillering: 'التفريع',
  'Tuber Bulking': 'تضخم الدرنات', 'V10–V12': 'V10–V12', 'V6 (6-leaf)': 'V6 (6 أوراق)', 'Vegetative (post-harvest)': 'النمو الخضري (بعد الحصاد)',
  Vegetative: 'النمو الخضري', Veraison: 'بدء النضج اللوني',
};

const MATERIAL_NAMES_AR: Record<string, string> = {
  'Ammonium sulfate (21-0-0-24S)': 'كبريتات الأمونيوم (21-0-0-24S)', 'Borax (11% B)': 'بوراكس (11% ب)', 'Borax foliar 0.5%': 'بوراكس ورقي 0.5%', Borax: 'بوراكس',
  'Bradyrhizium japonicum peat-based': 'برادي رايزوبيوم يابونيكوم أساسه الخث', 'Calcium chloride foliar 0.5%': 'كلوريد الكالسيوم ورقي 0.5%',
  'Calcium nitrate (15.5-0-0-19Ca)': 'نترات الكالسيوم (15.5-0-0-19Ca)', 'Calcium nitrate (fertigated)': 'نترات الكالسيوم عبر الري', 'Calcium nitrate (light feed)': 'نترات الكالسيوم (جرعة خفيفة)',
  'Calcium nitrate + potassium nitrate (starter solution)': 'نترات الكالسيوم + نترات البوتاسيوم (محلول بادئ)', 'Calcium nitrate + potassium nitrate fertigated': 'نترات الكالسيوم + نترات البوتاسيوم عبر الري',
  'Calcium nitrate + potassium nitrate': 'نترات الكالسيوم + نترات البوتاسيوم', 'Calcium nitrate fertigated': 'نترات الكالسيوم عبر الري', 'Calcium nitrate': 'نترات الكالسيوم',
  'DAP (18-46-0)': 'فوسفات ثنائي الأمونيوم DAP (18-46-0)', DAP: 'فوسفات ثنائي الأمونيوم DAP', 'Dolomite (15% Ca, 10% Mg)': 'دولوميت (15% كالسيوم، 10% مغنيسيوم)', Dolomite: 'دولوميت',
  'Epsom salt (10% Mg)': 'ملح إبسوم (10% مغنيسيوم)', 'Epsom salt foliar 2%': 'ملح إبسوم ورقي 2%', 'Foliar micronutrient mix': 'خليط مغذيات صغرى ورقي', 'Foliar mix': 'خليط ورقي',
  'Gypsum (17% S)': 'جبس (17% كبريت)', 'Gypsum (23% Ca, 18% S)': 'جبس (23% كالسيوم، 18% كبريت)', Gypsum: 'جبس', 'Iron chelate (Fe-EDDHA)': 'شيلات الحديد (Fe-EDDHA)',
  'Manganese sulfate foliar': 'كبريتات المنغنيز ورقية', 'Manganese sulfate': 'كبريتات المنغنيز', 'Muriate of potash (0-0-60)': 'كلوريد البوتاسيوم (0-0-60)', 'Muriate of potash': 'كلوريد البوتاسيوم',
  'NPK 10-15-20': 'NPK 10-15-20', 'NPK 12-12-17': 'NPK 12-12-17', 'NPK 15-10-20': 'NPK 15-10-20', 'NPK 15-15-15': 'NPK 15-15-15', 'NPK 15-5-20': 'NPK 15-5-20',
  'Potash (0-0-60)': 'بوتاس (0-0-60)', 'Potassium nitrate (13-0-46)': 'نترات البوتاسيوم (13-0-46)', 'Potassium nitrate foliar 1%': 'نترات البوتاسيوم ورقية 1%',
  'Potassium nitrate foliar': 'نترات البوتاسيوم ورقية', 'Potassium nitrate': 'نترات البوتاسيوم', 'Potassium sulfate (0-0-50-18S)': 'كبريتات البوتاسيوم (0-0-50-18S)', 'Potassium sulfate': 'كبريتات البوتاسيوم',
  'SSP (16% P)': 'سوبر فوسفات أحادي SSP (16% فسفور)', 'Single superphosphate (8.8% P, 11% S)': 'سوبر فوسفات أحادي (8.8% فسفور، 11% كبريت)',
  'Sinorhizobium meliloti peat': 'سينورايزوبيوم ميليوتي مع خث', 'Solubor (20% B) foliar': 'سولوبور (20% ب) ورقي', 'Solubor foliar': 'سولوبور ورقي',
  'Triple superphosphate (0-46-0)': 'سوبر فوسفات ثلاثي (0-46-0)', 'Triple superphosphate': 'سوبر فوسفات ثلاثي', 'UAN 32%': 'محلول يوريا-أمونيوم-نترات UAN 32%',
  'Urea (46-0-0)': 'يوريا (46-0-0)', 'Urea (fertigated)': 'يوريا عبر الري', 'Urea + potassium nitrate fertigated': 'يوريا + نترات البوتاسيوم عبر الري',
  'Urea ammonium nitrate (UAN 32%)': 'يوريا-أمونيوم-نترات (UAN 32%)', 'Urea fertigated': 'يوريا عبر الري', 'Urea foliar 2%': 'يوريا ورقية 2%', Urea: 'يوريا',
  'Zinc sulfate (35% Zn)': 'كبريتات الزنك (35% زنك)', 'Zinc sulfate foliar': 'كبريتات الزنك ورقية', 'Zinc sulfate': 'كبريتات الزنك',
};

const TITLE: TrilingualString = {
  en: '4R Nutrient Budget and Application Planner',
  ar: 'مخطط ميزانية وتطبيق المغذيات 4R',
  fr: 'Planificateur de Budget Nutritionnel 4R',
};

const DESC: TrilingualString = {
  en: 'Build a field-specific planning budget around the right source, rate, time, and place. Crop defaults, soil-test inputs, and organic-source credits remain transparent.',
  ar: 'أنشئ ميزانية تخطيطية خاصة بالحقل وفق المصدر والمعدل والتوقيت والمكان المناسبين. تبقى افتراضات المحصول ومدخلات تحليل التربة وائتمانات المصادر العضوية واضحة وشفافة.',
  fr: 'Élaborez un budget de planification spécifique au champ autour de la bonne source, dose, date et place. Les valeurs par défaut de culture, les analyses de sol et les crédits organiques restent transparents.',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'This is a transparent planning estimate, not a fertilizer prescription. Confirm current soil and source analyses, label directions, local weather, setbacks, and regulations before field application.',
  ar: 'هذا تقدير تخطيطي شفاف وليس وصفة سماد. أكد تحليلات التربة والمصادر الحالية، وتعليمات الملصق، والطقس المحلي، ومسافات الارتداد، واللوائح قبل التطبيق الحقلي.',
  fr: 'Ceci est une estimation de planification transparente, pas une prescription d\'engrais. Confirmez les analyses de sol et de source, les indications d\'étiquette, la météo locale, les marges et la réglementation avant application au champ.',
};

function numberValue(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function cropLabel(language: Language, cropId: string, name: string): string {
  return copyFor(language, name, CROP_NAMES_AR[cropId] ?? name);
}

function nutrientLabel(language: Language, nutrient: keyof NutrientAmounts): string {
  const labels = {
    n: ['Nitrogen', 'النيتروجين'],
    p: ['Phosphorus', 'الفوسفور'],
    k: ['Potassium', 'البوتاسيوم'],
  } as const;
  return copyFor(language, labels[nutrient][0], labels[nutrient][1]);
}

function stageLabel(language: Language, stage: string): string {
  return copyFor(language, stage, STAGE_NAMES_AR[stage] ?? stage);
}

function materialLabel(language: Language, material: string): string {
  return copyFor(language, material, MATERIAL_NAMES_AR[material] ?? material);
}

function methodLabelArabic(method: string): string {
  const labels: Record<string, string> = {
    broadcast: 'نثر سطحي', band: 'وضع في خطوط', side_dress: 'تسميد جانبي', fertigation: 'تسميد عبر الري', foliar: 'رش ورقي', seed_treatment: 'معاملة البذور',
  };
  return labels[method] ?? method;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character] ?? character));
}

export function NutrientBudgetPlanner() {
  const { language, isRTL } = useTranslation();
  const tr = (english: string, arabic: string, french?: string) => copyFor(language, english, arabic, french);
  const [cropId, setCropId] = useState('maize');
  const [areaHa, setAreaHa] = useState('1');
  const [plantingDate, setPlantingDate] = useState(new Date().toISOString().slice(0, 10));
  const [yieldAdjustmentPct, setYieldAdjustmentPct] = useState('100');
  const [fieldName, setFieldName] = useState('');
  const [soilTests, setSoilTests] = useState<SoilTestEntry[]>([]);
  const [organicMatterPct, setOrganicMatterPct] = useState('2.5');
  const [cec, setCec] = useState('15');
  const [ph, setPh] = useState('6.5');
  const [soilPppm, setSoilPppm] = useState('25');
  const [soilKMeq, setSoilKMeq] = useState('0.4');
  const [manureType, setManureType] = useState<ManureType | 'none'>('none');
  const [manureRateTHa, setManureRateTHa] = useState('0');
  const [incorporation, setIncorporation] = useState<IncorporationTiming>('immediate');
  const [slopePct, setSlopePct] = useState('3');
  const [nearestWaterM, setNearestWaterM] = useState('50');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSoilTests(getSoilTests());
  }, []);

  const fieldNames = useMemo(() => getFieldNames(soilTests), [soilTests]);
  const input = useMemo<NutrientBudgetInput>(() => ({
    cropId,
    areaHa: Math.max(0, numberValue(areaHa, 0)),
    plantingDate,
    yieldAdjustmentPct: Math.max(0, numberValue(yieldAdjustmentPct, 100)),
    organicMatterPct: Math.max(0, numberValue(organicMatterPct, 0)),
    cec: Math.max(0, numberValue(cec, 0)),
    ph: Math.max(0, numberValue(ph, 0)),
    soilPppm: Math.max(0, numberValue(soilPppm, 0)),
    soilKMeq: Math.max(0, numberValue(soilKMeq, 0)),
    manureType,
    manureRateTHa: Math.max(0, numberValue(manureRateTHa, 0)),
    incorporation,
    slopePct: Math.max(0, numberValue(slopePct, 0)),
    nearestWaterM: Math.max(0, numberValue(nearestWaterM, 0)),
  }), [areaHa, cec, cropId, incorporation, manureRateTHa, manureType, nearestWaterM, organicMatterPct, ph, plantingDate, slopePct, soilKMeq, soilPppm, yieldAdjustmentPct]);
  const plan = useMemo(() => calculateNutrientBudget(input, language), [input, language]);
  const crop = CROP_LIFECLESafe(cropId);

  const applyLatestSoilTest = (name: string) => {
    setFieldName(name);
    const test = getLatestTest(soilTests, name);
    if (!test) return;
    setOrganicMatterPct(String(test.om));
    setCec(String(test.cec));
    setPh(String(test.ph));
    setSoilPppm(String(test.p));
    setSoilKMeq(String(test.k));
  };

  const exportPlan = () => {
    if (!plan) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const direction = isRTL ? 'rtl' : 'ltr';
    const rows = plan.applications.map(application => `<tr>
      <td>${application.day}</td><td>${escapeHtml(application.date)}</td><td>${escapeHtml(stageLabel(language, application.stage))}</td>
      <td>${escapeHtml(language === 'ar' ? methodLabelArabic(application.method) : methodLabel(application.method))}</td><td>${application.n.toFixed(1)}</td><td>${application.p.toFixed(1)}</td><td>${application.k.toFixed(1)}</td>
    </tr>`).join('');
    const warnings = plan.warnings.length > 0 ? `<ul>${plan.warnings.map(warning => `<li>${escapeHtml(warning)}</li>`).join('')}</ul>` : `<p>${escapeHtml(tr('No planning warnings from the entered inputs.', 'لا توجد تحذيرات تخطيطية من المدخلات المُدخلة.'))}</p>`;
    const fertialReference = plan.fertialGuidance ? `<h2>${escapeHtml(tr('Fertial manual reference', 'مرجع دليل Fertial'))}</h2><p>${escapeHtml(plan.fertialGuidance.summary)}</p><ul>${plan.fertialGuidance.applications.map(application => `<li><strong>${escapeHtml(application.timing)}</strong> · ${escapeHtml(formatFertialAmounts(application.amounts))} · ${escapeHtml(application.method)}</li>`).join('')}</ul><p class="small">${escapeHtml(tr(`Source: ${plan.fertialGuidance.source.document}, ${plan.fertialGuidance.source.pages}`, `المصدر: ${plan.fertialGuidance.source.document}، ${plan.fertialGuidance.source.pages}`))}</p>` : '';
    win.document.write(`<!doctype html><html dir="${direction}"><head><title>${escapeHtml(tr('4R Nutrient Plan', 'خطة المغذيات 4R'))}</title><style>
      body{font-family:Arial,sans-serif;margin:24px;color:#172033;line-height:1.45}h1{color:#047857;border-bottom:2px solid #10b981;padding-bottom:8px}h2{color:#166534;margin-top:24px;font-size:16px}.meta{color:#475569;font-size:12px}table{width:100%;border-collapse:collapse;font-size:11px;margin-top:8px}th{background:#ecfdf5;color:#065f46}th,td{border:1px solid #cbd5e1;padding:6px;text-align:start}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.tile{border:1px solid #a7f3d0;background:#f0fdf4;padding:10px;border-radius:8px}.small{font-size:11px;color:#475569}@media print{@page{margin:1cm}}</style></head><body>
      <h1>${escapeHtml(tr('4R Nutrient Budget and Application Plan', 'خطة ميزانية وتطبيق المغذيات 4R'))}</h1>
      <p class="meta"><strong>${escapeHtml(tr('Crop:', 'المحصول:'))}</strong> ${escapeHtml(cropLabel(language, crop.id, plan.cropName))} · <strong>${escapeHtml(tr('Area:', 'المساحة:'))}</strong> ${input.areaHa} ha · <strong>${escapeHtml(tr('Planting date:', 'تاريخ الزراعة:'))}</strong> ${escapeHtml(input.plantingDate)} · <strong>${escapeHtml(tr('Yield target:', 'هدف الإنتاجية:'))}</strong> ${input.yieldAdjustmentPct}%</p>
      <h2>${escapeHtml(tr('Remaining budget', 'الميزانية المتبقية'))}</h2><div class="grid"><div class="tile"><b>N</b><br>${plan.remaining.n.toFixed(1)} kg/ha<br><span class="small">${plan.totalRemaining.n.toFixed(1)} kg total</span></div><div class="tile"><b>P</b><br>${plan.remaining.p.toFixed(1)} kg/ha<br><span class="small">${plan.totalRemaining.p.toFixed(1)} kg total</span></div><div class="tile"><b>K</b><br>${plan.remaining.k.toFixed(1)} kg/ha<br><span class="small">${plan.totalRemaining.k.toFixed(1)} kg total</span></div></div>
      <h2>${escapeHtml(tr('Application schedule', 'جدول التطبيقات'))}</h2><table><thead><tr><th>${escapeHtml(tr('Day', 'اليوم'))}</th><th>${escapeHtml(tr('Date', 'التاريخ'))}</th><th>${escapeHtml(tr('Stage', 'المرحلة'))}</th><th>${escapeHtml(tr('Method', 'الطريقة'))}</th><th>N</th><th>P</th><th>K</th></tr></thead><tbody>${rows}</tbody></table>
      ${fertialReference}
      <h2>${escapeHtml(tr('Planning warnings', 'تحذيرات التخطيط'))}</h2>${warnings}
      <p class="small">${escapeHtml(tr('FormulaAtlas provides a planning estimate only. Confirm current soil and source analyses, local weather, product labels, and regulations before field application.', 'يوفر FormulaAtlas تقديراً للتخطيط فقط. أكد تحليلات التربة والمصادر الحالية، والطقس المحلي، وملصقات المنتجات، واللوائح قبل التطبيق الحقلي.'))}</p>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 250);
  };

  const handleReset = () => {
    setCropId('maize'); setAreaHa('1'); setPlantingDate(new Date().toISOString().slice(0, 10));
    setYieldAdjustmentPct('100'); setFieldName(''); setOrganicMatterPct('2.5'); setCec('15');
    setPh('6.5'); setSoilPppm('25'); setSoilKMeq('0.4'); setManureType('none'); setManureRateTHa('0');
    setIncorporation('immediate'); setSlopePct('3'); setNearestWaterM('50');
    toast({ title: tr('Reset to defaults', 'تمت إعادة التعيين', 'Réinitialisé') });
  };

  const handleCopy = () => {
    if (!plan) return;
    const lines = [
      '=== 4R NUTRIENT BUDGET ===',
      `Crop: ${crop.emoji} ${cropLabel(language, crop.id, crop.name)}`,
      `Area: ${input.areaHa} ha`,
      `Planting date: ${input.plantingDate}`,
      `Yield target: ${input.yieldAdjustmentPct}%`,
      '',
      'Remaining budget (kg/ha):',
      `N: ${plan.remaining.n.toFixed(1)} (target ${plan.target.n.toFixed(1)}, credits ${plan.credits.n.toFixed(1)}, total ${plan.totalRemaining.n.toFixed(1)} kg)`,
      `P: ${plan.remaining.p.toFixed(1)} (target ${plan.target.p.toFixed(1)}, credits ${plan.credits.p.toFixed(1)}, total ${plan.totalRemaining.p.toFixed(1)} kg)`,
      `K: ${plan.remaining.k.toFixed(1)} (target ${plan.target.k.toFixed(1)}, credits ${plan.credits.k.toFixed(1)}, total ${plan.totalRemaining.k.toFixed(1)} kg)`,
      '',
      'Application schedule:',
      ...plan.applications.map(a => `D${a.day} ${a.date} — ${stageLabel(language, a.stage)}: N=${a.n.toFixed(1)} P=${a.p.toFixed(1)} K=${a.k.toFixed(1)}`),
      '',
      `Warnings: ${plan.warnings.length}`,
      ...plan.warnings.map(w => `- ${w}`),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  if (!plan || !crop) return null;

  return (
    <CalculatorShell
      icon={FlaskConical}
      title={TITLE}
      description={DESC}
      badge={tr('4R Stewardship', 'إدارة 4R', 'Gestion 4R')}
      accent="emerald"
      actions={[
        {
          icon: Download,
          label: { en: 'Print Plan', ar: 'طباعة الخطة', fr: 'Imprimer' },
          onClick: exportPlan,
          variant: 'primary',
        },
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ الملخص', fr: 'Copier' },
          onClick: handleCopy,
          showCheck: copied,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      protocolNote={PROTOCOL_NOTE}
    >
      {/* Inputs column */}
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-emerald-600" />
              {tr('Crop & Field Setup', 'إعداد المحصول والحقل', 'Configuration culture & champ')}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField label={tr('Crop', 'المحصول', 'Culture')} value={cropId} onChange={setCropId} ariaLabel={tr('Crop', 'المحصول', 'Culture')}>
              {CROP_LIFECYCLES.map(item => <option key={item.id} value={item.id}>{item.emoji} {cropLabel(language, item.id, item.name)}</option>)}
            </SelectField>
            <NumberField label={tr('Field area (ha)', 'مساحة الحقل (هكتار)', 'Surface (ha)')} value={areaHa} onChange={setAreaHa} min="0.1" step="0.1" />
            <div><Label className="text-xs font-medium">{tr('Planting date', 'تاريخ الزراعة', 'Date de plantation')}</Label><Input aria-label={tr('Planting date', 'تاريخ الزراعة', 'Date de plantation')} type="date" value={plantingDate} onChange={event => setPlantingDate(event.target.value)} className="mt-1 h-10 text-sm" /></div>
            <NumberField label={tr('Yield target (% of crop default)', 'هدف الإنتاجية (% من افتراض المحصول)', 'Rendement (% du défaut)')} value={yieldAdjustmentPct} onChange={setYieldAdjustmentPct} min="0" step="5" />
          </div>
        </div>

        <section className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
          <SectionTitle icon={Sprout} title={tr('Site assessment and soil credits', 'تقييم الموقع وائتمانات التربة')} description={tr('Use the latest saved soil test or enter current values manually. The values drive planning credits and cautions, not a regulatory recommendation.', 'استخدم أحدث تحليل تربة محفوظ أو أدخل القيم الحالية يدويًا. تقود القيم الائتمانات والتنبيهات التخطيطية، وليست توصية تنظيمية.')} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField label={tr('Load saved soil test', 'تحميل تحليل تربة محفوظ')} value={fieldName} onChange={applyLatestSoilTest} ariaLabel={tr('Load saved soil test', 'تحميل تحليل تربة محفوظ')}>
              <option value="">{tr('Manual inputs', 'إدخالات يدوية')}</option>
              {fieldNames.map(name => <option key={name} value={name}>{name}</option>)}
            </SelectField>
            <div className="rounded-xl border border-dashed bg-muted/20 px-3 py-2 text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">{tr('Selected crop:', 'المحصول المحدد:')}</strong> {crop.emoji} {cropLabel(language, crop.id, crop.name)}<br />{tr('Default season:', 'الموسم الافتراضي:')} {plan.seasonLengthDays} {tr('days', 'يوماً')}</div>
            <NumberField label={tr('Organic matter (%)', 'المادة العضوية (%)')} value={organicMatterPct} onChange={setOrganicMatterPct} min="0" step="0.1" />
            <NumberField label={tr('CEC (meq/100g)', 'السعة التبادلية الكاتيونية (meq/100g)')} value={cec} onChange={setCec} min="0" step="0.1" />
            <NumberField label={tr('Soil pH', 'الرقم الهيدروجيني للتربة')} value={ph} onChange={setPh} min="0" step="0.1" />
            <NumberField label={tr('Soil phosphorus (ppm)', 'فسفور التربة (ppm)')} value={soilPppm} onChange={setSoilPppm} min="0" step="1" />
            <NumberField label={tr('Soil potassium (meq/100g)', 'بوتاسيوم التربة (meq/100g)')} value={soilKMeq} onChange={setSoilKMeq} min="0" step="0.01" />
          </div>
        </section>

        <section className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
          <SectionTitle icon={Leaf} title={tr('Organic source and placement check', 'المصدر العضوي وفحص المكان')} description={tr('Credit first-year available nutrients from an organic source and check the entered waterway setback.', 'احسب ائتمان المغذيات المتاحة في السنة الأولى من مصدر عضوي وتحقق من مسافة الارتداد المُدخلة عن المجرى المائي.')} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField label={tr('Organic source', 'المصدر العضوي')} value={manureType} onChange={value => setManureType(value as ManureType | 'none')} ariaLabel={tr('Organic source', 'المصدر العضوي')}>
              <option value="none">{tr('No organic source', 'لا يوجد مصدر عضوي')}</option>
              {Object.entries(MANURE_SOURCES).map(([id, source]) => <option key={id} value={id}>{tr(source.name, MANURE_NAMES_AR[id as ManureType])}</option>)}
            </SelectField>
            <NumberField label={tr('Application rate (t/ha)', 'معدل التطبيق (طن/هكتار)')} value={manureRateTHa} onChange={setManureRateTHa} min="0" step="1" disabled={manureType === 'none'} />
            <SelectField label={tr('Incorporation timing', 'توقيت الدمج')} value={incorporation} onChange={value => setIncorporation(value as IncorporationTiming)} ariaLabel={tr('Incorporation timing', 'توقيت الدمج')} disabled={manureType === 'none'}>
              <option value="immediate">{tr('Immediate', INCORPORATION_AR.immediate)}</option><option value="hours12">{tr('Within 12 hr', INCORPORATION_AR.hours12)}</option><option value="days1">{tr('Within 1 day', INCORPORATION_AR.days1)}</option><option value="days7">{tr('Within 7 days', INCORPORATION_AR.days7)}</option><option value="none">{tr('Not incorporated', INCORPORATION_AR.none)}</option>
            </SelectField>
            <NumberField label={tr('Field slope (%)', 'انحدار الحقل (%)')} value={slopePct} onChange={setSlopePct} min="0" step="0.5" />
            <NumberField label={tr('Nearest waterway (m)', 'أقرب مجرى مائي (م)')} value={nearestWaterM} onChange={setNearestWaterM} min="0" step="1" />
            {manureType !== 'none' && <div className={`sm:col-span-2 rounded-xl border p-3 text-xs leading-relaxed ${plan.bufferCompliant ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300' : 'border-rose-200 bg-rose-50/70 text-rose-800 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300'}`}><span className="flex items-start gap-2">{plan.bufferCompliant ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}<span><strong>{plan.bufferCompliant ? tr('Planning buffer check passed.', 'اجتاز فحص منطقة العزل التخطيطي.') : tr('Planning buffer check needs attention.', 'يتطلب فحص منطقة العزل التخطيطي الانتباه.')}</strong> {tr(`Entered distance: ${input.nearestWaterM} m · planning minimum: ${plan.minBufferM} m.`, `المسافة المُدخلة: ${input.nearestWaterM} م · الحد الأدنى التخطيطي: ${plan.minBufferM} م.`)}</span></span></div>}
          </div>
        </section>
      </CalculatorShell.Inputs>

      {/* Results column */}
      <CalculatorShell.Results>
        <section className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 bg-gradient-to-r from-emerald-50 via-transparent to-lime-50/40 dark:from-emerald-950/20 dark:to-lime-950/10 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
            <SectionTitle icon={Beaker} title={tr('Right rate: nutrient budget', 'المعدل المناسب: ميزانية المغذيات')} description={tr('All values are planning estimates in kg/ha. Total field quantities scale with the entered area.', 'جميع القيم تقديرات تخطيطية بوحدة كغ/هكتار. تتناسب كميات الحقل الإجمالية مع المساحة المُدخلة.')} />
            <Badge variant="outline" className="border-emerald-200 bg-background/70 text-[10px] text-emerald-800 dark:border-emerald-900 dark:text-emerald-300">{input.areaHa.toFixed(1)} ha</Badge>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {(['n', 'p', 'k'] as const).map(nutrient => <BudgetTile key={nutrient} language={language} nutrient={nutrient} target={plan.target[nutrient]} credit={plan.credits[nutrient]} remaining={plan.remaining[nutrient]} total={plan.totalRemaining[nutrient]} />)}
          </div>
          <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-3">
            <CreditLine icon={Waves} label={tr('Soil organic-matter N credit', 'ائتمان N من المادة العضوية في التربة')} value={`${plan.soilNCredit.toFixed(1)} kg N/ha`} />
            <CreditLine icon={Sprout} label={tr('Soil K planning credit', 'ائتمان K التخطيطي للتربة')} value={`${plan.soilKCredit.toFixed(1)} kg K/ha`} />
            <CreditLine icon={Leaf} label={tr('Organic-source first-year credit', 'ائتمان المصدر العضوي في السنة الأولى')} value={`${plan.manureCredit.n.toFixed(1)} N · ${plan.manureCredit.p.toFixed(1)} P · ${plan.manureCredit.k.toFixed(1)} K kg/ha`} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3">
          <GuidanceCard icon={ShieldCheck} title={tr('Right source and right rate', 'المصدر والمعدل المناسبان')} items={[...plan.guidance.source, ...plan.guidance.rate]} />
          <GuidanceCard icon={MapPin} title={tr('Right time and right place', 'التوقيت والمكان المناسبان')} items={[...plan.guidance.time, ...plan.guidance.place]} />
        </section>
      </CalculatorShell.Results>

      {/* Full-width sections */}
      <div className="lg:col-span-12 space-y-4">
        <section className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
          <SectionTitle icon={CalendarDays} title={tr('Right time: adjusted application schedule', 'التوقيت المناسب: جدول التطبيقات المعدّل')} description={tr('The crop lifecycle schedule is proportionally adjusted after the planning credits. Check crop condition, rainfall, and source analysis before each field operation.', 'يُعدّل جدول دورة حياة المحصول بشكل نسبي بعد الائتمانات التخطيطية. تحقق من حالة المحصول، وهطول الأمطار، وتحليل المصدر قبل كل عملية حقلية.')} />
          <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[680px] text-left text-xs rtl:text-right"><thead className="bg-muted/50 text-[10px] uppercase tracking-wide text-muted-foreground"><tr><th className="p-2.5">{tr('Day', 'اليوم')}</th><th className="p-2.5">{tr('Date', 'التاريخ')}</th><th className="p-2.5">{tr('Stage', 'المرحلة')}</th><th className="p-2.5">{tr('Method', 'الطريقة')}</th><th className="p-2.5">N</th><th className="p-2.5">P</th><th className="p-2.5">K</th><th className="p-2.5">{tr('Starting sources', 'المصادر الأولية')}</th></tr></thead><tbody>{plan.applications.map((application, index) => <tr key={`${application.day}-${index}`} className="border-t align-top"><td className="p-2.5 font-mono text-muted-foreground">D{application.day}</td><td className="p-2.5 whitespace-nowrap">{application.date}</td><td className="p-2.5 font-medium">{stageLabel(language, application.stage)}</td><td className="p-2.5"><Badge variant="secondary" className="text-[9px] font-normal">{tr(methodLabel(application.method), methodLabelArabic(application.method))}</Badge></td><td className="p-2.5 font-mono">{application.n.toFixed(1)}</td><td className="p-2.5 font-mono">{application.p.toFixed(1)}</td><td className="p-2.5 font-mono">{application.k.toFixed(1)}</td><td className="max-w-[240px] p-2.5 text-[10px] leading-relaxed text-muted-foreground">{application.sources.map(source => materialLabel(language, source.material)).join(' · ') || '—'}</td></tr>)}</tbody></table></div>
        </section>

        {plan.fertialGuidance && <section className="rounded-2xl border border-lime-200 bg-lime-50/60 p-3 dark:border-lime-900/70 dark:bg-lime-950/20">
          <div className="flex items-start gap-2"><BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-lime-700 dark:text-lime-300" /><div className="min-w-0"><h3 className="text-xs font-semibold text-lime-950 dark:text-lime-100">{tr('Fertial manual reference', 'مرجع دليل Fertial', 'Référence du manuel Fertial')}</h3><p className="mt-1 text-xs leading-relaxed text-lime-950/80 dark:text-lime-100/80">{plan.fertialGuidance.summary}</p></div></div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">{plan.fertialGuidance.applications.map((application, index) => <div key={`${application.timing}-${index}`} className="rounded-xl border border-lime-200/80 bg-background/70 p-2.5 dark:border-lime-900/70"><div className="text-[10px] font-semibold text-lime-900 dark:text-lime-200">{application.timing}</div><div className="mt-1 font-mono text-[11px] font-semibold">{formatFertialAmounts(application.amounts)}</div><div className="mt-1 text-[10px] text-muted-foreground">{tr(`Method: ${application.method}`, `الطريقة: ${application.method}`, `Méthode : ${application.method}`)} · {application.note}</div></div>)}</div>
          {plan.fertialGuidance.formulas.length > 0 && <div className="mt-3 border-t border-lime-200/80 pt-3 dark:border-lime-900/70"><h4 className="text-[10px] font-semibold uppercase tracking-wide text-lime-900 dark:text-lime-200">{tr('Source-backed fertilizer formulas', 'معادلات التسميد المدعومة بالمصدر', 'Formules de fertilisation sourcées')}</h4><div className="mt-2 grid gap-2 md:grid-cols-2">{plan.fertialGuidance.formulas.map(formula => <article key={formula.id} className="rounded-xl border border-lime-200/80 bg-background/70 p-2.5 dark:border-lime-900/70"><h5 className="text-xs font-semibold">{formula.title}</h5><p className="mt-1 rounded-md bg-lime-100/70 p-2 font-mono text-[10px] text-lime-950 dark:bg-lime-950/40 dark:text-lime-100">{formula.formula}</p><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground"><strong>{tr('Variables:', 'المتغيرات:', 'Variables :')}</strong> {formula.variables}</p><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground"><strong>{tr('Use:', 'الاستخدام:', 'Utilisation :')}</strong> {formula.use}</p></article>)}</div></div>}
          {plan.fertialGuidance.cautions.length > 0 && <ul className="mt-3 space-y-1 text-[10px] leading-relaxed text-amber-800 dark:text-amber-200">{plan.fertialGuidance.cautions.map(caution => <li key={caution} className="flex gap-2"><span aria-hidden="true">⚠</span><span>{caution}</span></li>)}</ul>}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-lime-200/80 pt-2 text-[10px] text-muted-foreground dark:border-lime-900/70"><span>{tr(`Source: ${plan.fertialGuidance.source.document} · ${plan.fertialGuidance.source.pages}`, `المصدر: ${plan.fertialGuidance.source.document} · ${plan.fertialGuidance.source.pages}`, `Source : ${plan.fertialGuidance.source.document} · ${plan.fertialGuidance.source.pages}`)}</span><a className="font-medium text-lime-800 underline underline-offset-2 dark:text-lime-300" href={plan.fertialGuidance.source.url} target="_blank" rel="noreferrer">{tr('Open manual source', 'فتح مصدر الدليل', 'Ouvrir la source')}</a></div>
        </section>}

        <section aria-live="polite" className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/70 dark:bg-amber-950/20">
          <div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" /><div><h3 className="text-xs font-semibold text-amber-900 dark:text-amber-200">{tr('Planning guardrails', 'ضوابط التخطيط')}</h3><p className="mt-1 text-xs leading-relaxed text-amber-900/80 dark:text-amber-100/80">{tr('This is a transparent planning estimate, not a fertilizer prescription. Confirm current soil and source analyses, label directions, local weather, setbacks, and regulations before field application.', 'هذا تقدير تخطيطي شفاف وليس وصفة سماد. أكد تحليلات التربة والمصادر الحالية، وتعليمات الملصق، والطقس المحلي، ومسافات الارتداد، واللوائح قبل التطبيق الحقلي.')}</p></div></div>
          {plan.warnings.length > 0 && <ul className="mt-2 space-y-1 border-t border-amber-200/80 pt-2 text-xs leading-relaxed text-amber-950 dark:border-amber-900/70 dark:text-amber-100">{plan.warnings.map(warning => <li key={warning} className="flex gap-2"><span aria-hidden="true">•</span><span>{warning}</span></li>)}</ul>}
        </section>
      </div>
    </CalculatorShell>
  );
}

function CROP_LIFECLESafe(cropId: string) {
  return CROP_LIFECYCLES.find(item => item.id === cropId) ?? CROP_LIFECYCLES[0];
}

function SectionTitle({ icon: Icon, title, description }: { icon: typeof Sprout; title: string; description: string }) {
  return <div className="min-w-0"><div className="flex items-center gap-2 text-xs font-semibold"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"><Icon className="h-3.5 w-3.5" /></span><span>{title}</span></div><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{description}</p></div>;
}

function NumberField({ label, value, onChange, min, step, disabled = false }: { label: string; value: string; onChange: (value: string) => void; min: string; step: string; disabled?: boolean }) {
  return <div><Label className="text-xs font-medium">{label}</Label><Input aria-label={label} type="number" value={value} onChange={event => onChange(event.target.value)} min={min} step={step} disabled={disabled} className="mt-1 h-10 text-sm" /></div>;
}

function SelectField({ label, value, onChange, ariaLabel, children, disabled = false }: { label: string; value: string; onChange: (value: string) => void; ariaLabel: string; children: ReactNode; disabled?: boolean }) {
  return <div><Label className="text-xs font-medium">{label}</Label><select aria-label={ariaLabel} value={value} onChange={event => onChange(event.target.value)} disabled={disabled} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50">{children}</select></div>;
}

function BudgetTile({ language, nutrient, target, credit, remaining, total }: { language: Language; nutrient: keyof NutrientAmounts; target: number; credit: number; remaining: number; total: number }) {
  const colorClass = nutrient === 'n'
    ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20'
    : nutrient === 'p'
      ? 'border-teal-200 bg-teal-50/60 dark:border-teal-900 dark:bg-teal-950/20'
      : 'border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20';
  const tr = (english: string, arabic: string) => copyFor(language, english, arabic);
  return <div className={`rounded-xl border p-3 ${colorClass}`}>
    <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold">{nutrient.toUpperCase()} · {nutrientLabel(language, nutrient)}</span><span className="font-mono text-lg font-bold">{remaining.toFixed(1)}</span></div>
    <div className="mt-0.5 text-[10px] text-muted-foreground">{tr('kg/ha remaining after credits', 'كغ/هكتار متبقية بعد الائتمانات')}</div>
    <div className="mt-2 grid grid-cols-2 gap-2 border-t border-black/5 pt-2 text-[10px] dark:border-white/10"><div><span className="block text-muted-foreground">{tr('Crop target', 'هدف المحصول')}</span><strong className="font-mono">{target.toFixed(1)}</strong></div><div><span className="block text-muted-foreground">{tr('Planning credits', 'ائتمانات التخطيط')}</span><strong className="font-mono">{credit.toFixed(1)}</strong></div></div>
    <div className="mt-2 rounded-lg bg-background/70 px-2 py-1.5 text-[10px] text-muted-foreground"><strong className="font-mono text-foreground">{total.toFixed(1)} kg</strong> {tr('total for this field', 'إجمالي هذا الحقل')}</div>
  </div>;
}

function CreditLine({ icon: Icon, label, value }: { icon: typeof Sprout; label: string; value: string }) {
  return <div className="flex items-start gap-2 rounded-xl border bg-background/70 p-2.5"><Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-300" /><div className="min-w-0"><div className="text-[10px] text-muted-foreground">{label}</div><div className="mt-0.5 font-mono text-[11px] font-semibold text-foreground">{value}</div></div></div>;
}

function GuidanceCard({ icon: Icon, title, items }: { icon: typeof Sprout; title: string; items: string[] }) {
  return <section className="rounded-2xl border bg-muted/15 p-3"><div className="flex items-center gap-2 text-xs font-semibold"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"><Icon className="h-3.5 w-3.5" /></span>{title}</div><ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">{items.map(item => <li key={item} className="flex gap-2"><span className="text-emerald-600 dark:text-emerald-400">•</span><span>{item}</span></li>)}</ul></section>;
}
