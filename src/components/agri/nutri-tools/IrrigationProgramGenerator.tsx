'use client';

import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Droplets, Download, Calendar, Gauge, Waves, Layers,
  Copy, RotateCcw,
} from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell, type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';
import {
  CROP_IRRIGATION_DATA,
  DECADAL_MONTHS,
  getCropIrrigation,
  type CropCategory,
} from '@/lib/irrigation-crop-data';

type SystemType = 'drip' | 'sprinkler' | 'furrow';

const SYSTEM_DEFAULT_EFFICIENCY: Record<SystemType, number> = {
  drip: 90,
  sprinkler: 75,
  furrow: 60,
};

const CATEGORY_LABELS: Record<CropCategory, string> = {
  vegetable: 'Vegetables',
  fruit: 'Fruits & Orchards',
  cereal: 'Cereals',
  industrial: 'Industrial Crops',
  forage: 'Forage',
};

const CATEGORY_LABELS_AR: Record<CropCategory, string> = {
  vegetable: 'الخضروات',
  fruit: 'الفواكه والبساتين',
  cereal: 'الحبوب',
  industrial: 'المحاصيل الصناعية',
  forage: 'الأعلاف',
};

const CATEGORY_LABELS_FR: Record<CropCategory, string> = {
  vegetable: 'Légumes',
  fruit: 'Fruits & Vergers',
  cereal: 'Céréales',
  industrial: 'Cultures industrielles',
  forage: 'Fourrage',
};

const CROP_NAME_AR: Record<string, string> = {
  asparagus: 'الهليون', eggplant: 'الباذنجان', summer_carrot: 'الجزر الصيفي', zucchini: 'الكوسا', strawberry: 'الفراولة',
  early_melon_tunnel: 'الشمام المبكر (نفق)', season_melon_mulched: 'الشمام الموسمي (مغطى)', late_melon: 'الشمام المتأخر', bell_pepper: 'الفلفل الحلو',
  early_potato: 'البطاطا المبكرة', storage_potato: 'بطاطا التخزين', summer_lettuce: 'الخس الصيفي', field_tomato: 'طماطم الحقل', garlic: 'الثوم',
  shallot: 'الكراث الأندلسي', onion: 'البصل', green_bean: 'الفاصوليا الخضراء', pea: 'البازلاء', apricot: 'المشمش', apple: 'التفاح',
  cherry: 'الكرز', peach: 'الخوخ', vineyard: 'العنب', olive: 'الزيتون', citrus: 'الحمضيات', durum_wheat: 'القمح الصلب',
  soft_wheat: 'القمح الطري', barley: 'الشعير', grain_maize: 'ذرة الحبوب', sorghum: 'الذرة الرفيعة', forage_maize: 'ذرة العلف',
  alfalfa: 'الفصة', soybean: 'فول الصويا', sunflower: 'عباد الشمس', rapeseed: 'الكانولا',
};

const CROP_NOTE_AR: Record<string, string> = {
  asparagus: 'محصول تاجي معمر؛ حافظ على رطوبة متجانسة خلال حصاد السيقان وتطور الأوراق.', eggplant: 'حساس للإجهاد المائي أثناء الإزهار؛ يوصى بالري بالتنقيط لتحسين عقد الثمار.',
  summer_carrot: 'حافظ على رطوبة السطح أثناء الإنبات؛ خفّض الري قرب الحصاد لتجنب التشقق.', zucchini: 'ري خفيف ومتكرر أثناء تضخم الثمار؛ تجنب الري العلوي للحد من البياض الدقيقي.',
  strawberry: 'الاحتياجات المائية حرجة أثناء الإزهار ونضج الثمار؛ استخدم التنقيط والغطاء للحفاظ على نظافة الثمار.', early_melon_tunnel: 'تقلل الزراعة المحمية البخر-نتح؛ حافظ على رطوبة التربة أثناء تكبر الثمار.',
  season_melon_mulched: 'استخدم الغطاء البلاستيكي مع التنقيط؛ أوقف الري قبل الحصاد بـ7–10 أيام لرفع السكر.', late_melon: 'محصول متأخر في الحقل المكشوف؛ يبلغ الطلب ذروته في يوليو–أغسطس أثناء امتلاء الثمار.',
  bell_pepper: 'تجنب الإجهاد المائي أثناء الإزهار؛ تسبب الرطوبة غير المتجانسة تساقط الأزهار وتعفن الطرف الزهري.', early_potato: 'دورة قصيرة؛ يكفي الري الخفيف عند بدء تكوين الدرنات في معظم السنوات.',
  storage_potato: 'يبلغ الطلب ذروته أثناء تضخم الدرنات (يونيو–يوليو)؛ أوقف الري قبل التجفيف بـ2–3 أسابيع.', summer_lettuce: 'ري خفيف ومتكرر؛ يسبب الإجهاد المائي القصير احتراق الحواف والاستطالة الزهرية.',
  field_tomato: 'الاحتياج حرج أثناء الإزهار وتكبر الثمار؛ يحسن الري الناقص قرب الحصاد النكهة.', garlic: 'أوقف الري قبل الحصاد بـ2–3 أسابيع ليسمح ذلك بجفاف الأبصال وتخزينها جيداً.',
  shallot: 'طلب متوسط خلال تكوين الأبصال؛ خفّض الماء عند بدء رقاد القمم.', onion: 'جذور سطحية؛ حافظ على الرطوبة أثناء تكوين الأبصال ثم جفف التربة للتخزين.',
  green_bean: 'الاحتياج حرج أثناء الإزهار وعقد القرون؛ تجنب الري العلوي أثناء الإزهار.', pea: 'بقول بارد الموسم؛ يطيل الري أثناء الإزهار امتلاء القرون ويرفع الإنتاج.',
  apricot: 'اروِ بعد تصلب النواة وخلال التمدد النهائي للثمرة؛ تجنب الإفراط قرب الحصاد.', apple: 'بخر-نتح موسمي مرتفع؛ المراحل الحرجة هي انقسام الخلايا بعد الإزهار وتوسع الثمار.',
  cherry: 'اروِ حتى تلوّن الثمار؛ تسبب التقلبات السريعة التشقق. أوقف الري عند الحصاد.', peach: 'يبلغ الطلب ذروته في المرحلة الثالثة من نمو الثمرة (التمدد النهائي)؛ يوفر الري الناقص المنظم بعد تصلب النواة الماء.',
  vineyard: 'يحسن الري الناقص المنظم بين العقد وبداية التلون الجودة دون الإضرار بالإنتاج.', olive: 'يتحمل الجفاف لكنه يستجيب بقوة للري عند تصلب النواة وتراكم الزيت.', citrus: 'حافظ على رطوبة ثابتة أثناء توسع الخلايا؛ يقلل الإجهاد حجم الثمار وجودتها.',
  durum_wheat: 'حبوب شتوية؛ يدعم ري الربيع استطالة الساق وامتلاء الحبوب.', soft_wheat: 'يؤدي ري ربيعي واحد أو اثنان عند طور الحذاء والإزهار عادةً إلى تعظيم الإنتاج.',
  barley: 'ينضج أبكر من القمح؛ الري عند طور الحذاء هو أعلى تطبيق من حيث العائد.', grain_maize: 'حبوب صيفية عالية الطلب؛ النافذة الحرجة من ظهور النورة المذكرة حتى امتلاء الحبوب.',
  sorghum: 'محصول C4 متحمل للجفاف؛ يحمي الري عند طور الحذاء والإزهار الإنتاج في السنوات الجافة.', forage_maize: 'سيلاج نبات كامل؛ يؤدي إنتاج الكتلة الحيوية المرتفع إلى طلب مائي مرتفع خلال الصيف.',
  alfalfa: 'محصول معمر عميق الجذور؛ اروِ بعد كل حشة لإعادة نمو المجموع الخضري قبل التالية.', soybean: 'الاحتياج حرج أثناء الإزهار وامتلاء القرون؛ يسبب الإجهاد عند عقد القرون خسارة كبيرة في الإنتاج.',
  sunflower: 'الجذر الوتدي العميق يتحمل إجهاداً متوسطاً؛ يرفع الري من البرعم حتى الإزهار إنتاج الزيت.', rapeseed: 'محصول شتوي؛ يدعم ري الربيع استطالة الساق وامتلاء القرون قبل الحصاد.',
};

const SYSTEM_LABELS_AR: Record<SystemType, string> = { drip: 'تنقيط', sprinkler: 'رشاش', furrow: 'أخدود' };
const SYSTEM_LABELS_FR: Record<SystemType, string> = { drip: 'Goutte', sprinkler: 'Aspersion', furrow: 'Sillons' };
const MONTH_SHORT = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const MONTH_SHORT_AR = ['أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر'];
const MONTH_SHORT_FR = ['Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep'];
const MONTH_LONG = ['April', 'May', 'June', 'July', 'August', 'September'];
const MONTH_LONG_AR = ['أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر'];
const MONTH_LONG_FR = ['Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre'];
const DECADAL_MONTHS_AR = ['أبريل-1', 'أبريل-2', 'أبريل-3', 'مايو-1', 'مايو-2', 'مايو-3', 'يونيو-1', 'يونيو-2', 'يونيو-3', 'يوليو-1', 'يوليو-2', 'يوليو-3', 'أغسطس-1', 'أغسطس-2', 'أغسطس-3', 'سبتمبر-1', 'سبتمبر-2', 'سبتمبر-3'];

const TITLE: TrilingualString = {
  en: 'Irrigation Program Generator',
  ar: 'مولّد برنامج الري',
  fr: 'Générateur de Programme d\'Irrigation',
};

const DESC: TrilingualString = {
  en: 'Decadal (10-day) irrigation schedule from the BRL/COM memento, sized to your field, system and efficiency.',
  ar: 'جدول ري عشري (10 أيام) من مذكرة BRL/COM، مضبوط لمساحة حقلك ونظامك وكفاءتك.',
  fr: 'Programme d\'irrigation décadaire (10 jours) du mémo BRL/COM, ajusté à votre parcelle, système et efficacité.',
};

export function IrrigationProgramGenerator() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [cropId, setCropId] = useState('field_tomato');
  const [areaHa, setAreaHa] = useState('10');
  const [efficiency, setEfficiency] = useState('90');
  const [systemType, setSystemType] = useState<SystemType>('drip');
  const [copied, setCopied] = useState(false);

  const crop = getCropIrrigation(cropId) ?? CROP_IRRIGATION_DATA[0];
  const area = Math.max(0, parseFloat(areaHa) || 0);
  const eff = Math.min(100, Math.max(1, parseFloat(efficiency) || 0));
  const effFrac = eff / 100;
  const grossAnnual = effFrac > 0 ? crop.annual_irrigation_mm / effFrac : 0;
  const totalVolumeM3 = grossAnnual * area * 10; // 1 mm over 1 ha = 10 m³
  const peakDecadal = Math.max(0, ...crop.decadal_irrigation_mm);
  const peakIdx = crop.decadal_irrigation_mm.indexOf(peakDecadal);
  // Peak daily demand (m³/day) = peak decadal depth (mm/10 d) ÷ 10 (mm/day) × area (ha) × 10 (m³/mm·ha)
  const peakDaily = (peakDecadal / 10) * area * 10;

  const monthlyTotals = useMemo(() => {
    const m = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 18; i++) m[Math.floor(i / 3)] += crop.decadal_irrigation_mm[i];
    return m;
  }, [crop]);
  const maxMonthly = Math.max(...monthlyTotals, 1);
  const localizedCropName = copyFor(language, crop.name_en, CROP_NAME_AR[crop.id] ?? crop.name_en, crop.name_en);
  const localizedCropNotes = copyFor(language, crop.notes, CROP_NOTE_AR[crop.id] ?? crop.notes, crop.notes);

  const cropsByCat = (Object.keys(CATEGORY_LABELS) as CropCategory[]).map((cat) => ({
    cat,
    items: CROP_IRRIGATION_DATA.filter((c) => c.category === cat),
  }));

  const handleExportPdf = () => {
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;
    const rows = monthlyTotals
      .map((m, i) => `<tr><td>${language === 'ar' ? MONTH_LONG_AR[i] : language === 'fr' ? MONTH_LONG_FR[i] : MONTH_LONG[i]}</td><td>${m}</td><td>${(m / effFrac).toFixed(0)}</td><td>${((m / effFrac) * area * 10).toFixed(0)}</td></tr>`)
      .join('');
    w.document.write(`<!doctype html><html><head><title>${tr('Irrigation Program', 'برنامج الري', 'Programme d\'irrigation')} — ${localizedCropName}</title>
<style>body{font-family:system-ui;padding:24px;color:#0f172a}h1{color:#15803d;margin:0 0 4px}
table{width:100%;border-collapse:collapse;margin-top:12px}td,th{border:1px solid #cbd5e1;padding:6px 10px;font-size:12px;text-align:left}
.stat{display:inline-block;padding:10px 14px;border:1px solid #cbd5e1;border-radius:8px;margin:4px 4px 0 0;min-width:110px}
.stat .l{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.04em}
.stat .v{font-size:18px;font-weight:700;color:#15803d}</style></head><body>
<h1>${tr('Irrigation Program', 'برنامج الري', 'Programme d\'irrigation')} — ${localizedCropName}</h1>
<p style="font-size:11px;color:#64748b;margin:0 0 8px">${tr('Generated', 'تم الإنشاء', 'Généré')} ${new Date().toLocaleString(language === 'ar' ? 'ar-EG' : undefined)}</p>
<div>
<div class="stat"><div class="l">${tr('Area', 'المساحة', 'Surface')}</div><div class="v">${area} ha</div></div>
<div class="stat"><div class="l">${tr('System', 'النظام', 'Système')}</div><div class="v">${tr(systemType, SYSTEM_LABELS_AR[systemType], SYSTEM_LABELS_FR[systemType])}</div></div>
<div class="stat"><div class="l">${tr('Efficiency', 'الكفاءة', 'Efficacité')}</div><div class="v">${eff}%</div></div>
<div class="stat"><div class="l">${tr('Net annual', 'الصافي السنوي', 'Net annuel')}</div><div class="v">${crop.annual_irrigation_mm} mm</div></div>
<div class="stat"><div class="l">${tr('Gross annual', 'الإجمالي السنوي', 'Brut annuel')}</div><div class="v">${grossAnnual.toFixed(0)} mm</div></div>
<div class="stat"><div class="l">${tr('Total volume', 'الحجم الكلي', 'Volume total')}</div><div class="v">${totalVolumeM3.toFixed(0)} m³</div></div>
<div class="stat"><div class="l">${tr('Peak daily', 'الذروة اليومية', 'Pic journalier')}</div><div class="v">${peakDaily.toFixed(1)} m³/d</div></div>
</div>
<h3 style="margin-top:18px;color:#15803d">${tr('Monthly schedule', 'الجدول الشهري', 'Planning mensuel')}</h3>
<table><thead><tr><th>${tr('Month', 'الشهر', 'Mois')}</th><th>${tr('Net (mm)', 'الصافي (مم)', 'Net (mm)')}</th><th>${tr('Gross (mm)', 'الإجمالي (مم)', 'Brut (mm)')}</th><th>${tr('Volume (m³)', 'الحجم (م³)', 'Volume (m³)')}</th></tr></thead><tbody>${rows}</tbody></table>
<p style="font-size:11px;color:#64748b;margin-top:12px">${localizedCropNotes}</p>
</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const handleReset = () => {
    setCropId('field_tomato');
    setAreaHa('10');
    setSystemType('drip');
    setEfficiency('90');
    toast({ title: tr('Reset done', 'تمت إعادة التعيين', 'Réinitialisé') });
  };

  const handleCopy = () => {
    const monthLabels = language === 'ar' ? MONTH_SHORT_AR : language === 'fr' ? MONTH_SHORT_FR : MONTH_SHORT;
    const monthlyText = monthlyTotals.map((m, i) => `  ${monthLabels[i]}: ${m} mm`).join('\n');
    const text = `=== IRRIGATION PROGRAM ===\nCrop: ${localizedCropName}\nArea: ${area} ha\nSystem: ${tr(systemType, SYSTEM_LABELS_AR[systemType], SYSTEM_LABELS_FR[systemType])}\nEfficiency: ${eff}%\n\nNet annual: ${crop.annual_irrigation_mm} mm\nGross annual: ${grossAnnual.toFixed(0)} mm\nTotal volume: ${totalVolumeM3.toFixed(0)} m³\nPeak daily: ${peakDaily.toFixed(1)} m³/day\n\nMonthly (net, mm):\n${monthlyText}`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Summary copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  const summary = [
    { icon: Droplets, label: tr('Net annual', 'الصافي السنوي', 'Net annuel'), value: `${crop.annual_irrigation_mm}`, unit: 'mm', color: 'emerald' as const },
    { icon: Waves,    label: tr('Gross annual', 'الإجمالي السنوي', 'Brut annuel'), value: grossAnnual.toFixed(0), unit: 'mm', color: 'teal' as const },
    { icon: Gauge,    label: tr('Total volume', 'الحجم الكلي', 'Volume total'), value: totalVolumeM3.toFixed(0), unit: 'm³', color: 'sky' as const },
    { icon: Layers,   label: tr('Peak daily', 'الذروة اليومية', 'Pic journalier'), value: peakDaily.toFixed(1), unit: 'm³/day', color: 'amber' as const },
  ];

  const monthShort = language === 'ar' ? MONTH_SHORT_AR : language === 'fr' ? MONTH_SHORT_FR : MONTH_SHORT;
  const unitLabel = (u: string) => copyFor(language, u, u === 'm³/day' ? 'م³/يوم' : u, u === 'm³/day' ? 'm³/j' : u);

  return (
    <CalculatorShell
      icon={Droplets}
      title={TITLE}
      description={DESC}
      badge="BRL/COM"
      accent="sky"
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
      protocolNote={{
        en: `${localizedCropName} — ${localizedCropNotes}`,
        ar: `${localizedCropName} — ${localizedCropNotes}`,
        fr: `${localizedCropName} — ${localizedCropNotes}`,
      }}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <Droplets className="h-4 w-4 text-sky-600" />
              {tr('Field & System Parameters', 'مدخلات الحقل والنظام', 'Paramètres parcelle & système')}
            </span>
            <span className="font-mono text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 rounded-lg px-2 py-0.5">
              {crop.name_en}
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground">{tr('Crop', 'المحصول', 'Culture')}</label>
            <Select value={cropId} onValueChange={setCropId}>
              <SelectTrigger aria-label={tr('Crop selection', 'اختيار المحصول', 'Sélection culture')} className="mt-1 h-10 w-full text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {cropsByCat.map((g) => (
                  <div key={g.cat}>
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">{tr(CATEGORY_LABELS[g.cat], CATEGORY_LABELS_AR[g.cat], CATEGORY_LABELS_FR[g.cat])}</div>
                    {g.items.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">{copyFor(language, c.name_en, CROP_NAME_AR[c.id] ?? c.name_en, c.name_en)}</SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground">{tr('System', 'النظام', 'Système')}</label>
            <Select value={systemType} onValueChange={(v) => {
              setSystemType(v as SystemType);
              setEfficiency(String(SYSTEM_DEFAULT_EFFICIENCY[v as SystemType]));
            }}>
              <SelectTrigger aria-label={tr('Irrigation system type', 'نوع نظام الري', 'Type de système d\'irrigation')} className="mt-1 h-10 w-full text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="drip" className="text-xs">{tr('Drip', 'تنقيط', 'Goutte')}</SelectItem>
                <SelectItem value="sprinkler" className="text-xs">{tr('Sprinkler', 'رشاش', 'Aspersion')}</SelectItem>
                <SelectItem value="furrow" className="text-xs">{tr('Furrow', 'أخدود', 'Sillons')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CalculatorShell.InputField
              label={tr('Area (ha)', 'المساحة (هكتار)', 'Surface (ha)')}
              value={areaHa}
              onChange={setAreaHa}
              placeholder="10"
              helper={tr('Irrigated area in hectares', 'المساحة المروية بالهكتار', 'Surface irriguée en hectares')}
            />
            <CalculatorShell.InputField
              label={tr('Efficiency (%)', 'الكفاءة (%)', 'Efficacité (%)')}
              value={efficiency}
              onChange={setEfficiency}
              placeholder="90"
              helper={tr('Irrigation efficiency percentage', 'نسبة كفاءة الري', 'Pourcentage d\'efficacité')}
            />
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              ✨ {tr('Irrigation Program', 'برنامج الري', 'Programme d\'irrigation')}
            </span>
            <span className="font-mono text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 rounded-lg px-2 py-0.5">
              {totalVolumeM3.toFixed(0)} m³
            </span>
          </div>

          {/* 4 summary cards */}
          <div className="grid grid-cols-2 gap-2">
            {summary.map((s) => (
              <CalculatorShell.MetricTile
                key={s.label}
                label={s.label}
                value={s.value}
                unit={unitLabel(s.unit)}
                color={s.color}
              />
            ))}
          </div>

          {/* Monthly table with visual bars */}
          <div className="rounded-xl border border-border/70 bg-muted/10 p-3">
            <div className="mb-3 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              <Calendar className="h-3 w-3" /> {tr('Monthly irrigation (net, mm)', 'الري الشهري (الصافي، مم)', 'Irrigation mensuelle (net, mm)')}
            </div>
            <div className="space-y-1.5">
              {MONTH_SHORT.map((m, i) => (
                <div key={m} className="flex items-center gap-2 text-xs">
                  <div className="w-9 text-xs font-medium text-muted-foreground">{monthShort[i]}</div>
                  <div className="h-4 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-sky-500" style={{ width: `${(monthlyTotals[i] / maxMonthly) * 100}%` }} />
                  </div>
                  <div className="w-12 text-right tabular-nums font-medium">{monthlyTotals[i]} mm</div>
                </div>
              ))}
            </div>
          </div>

          {/* 10-day schedule grid */}
          <div className="rounded-xl border border-border/70 bg-muted/10 p-3">
            <div className="mb-3 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              <Calendar className="h-3 w-3" /> {tr('10-day (decadal) schedule — mm/decade', 'الجدول العشري (10 أيام) — مم/عشرة أيام', 'Calendrier décadaire — mm/décade')}
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-3 lg:grid-cols-6">
              {DECADAL_MONTHS.map((label, i) => {
                const v = crop.decadal_irrigation_mm[i];
                const isPeak = i === peakIdx && v > 0;
                return (
                  <div key={label} className={`rounded-xl border p-2 text-center shadow-sm ${isPeak ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30' : 'border-border bg-card'}`}>
                    <div className="text-[9px] text-muted-foreground">{language === 'ar' ? DECADAL_MONTHS_AR[i] : label}</div>
                    <div className={`font-bold tabular-nums ${isPeak ? 'text-amber-700 dark:text-amber-300' : 'text-sky-700 dark:text-sky-300'}`}>{v}</div>
                    {isPeak && <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 mt-0.5 border-amber-400 text-amber-700 dark:text-amber-300">{tr('PEAK', 'الذروة', 'PIC')}</Badge>}
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">{localizedCropNotes}</p>
          </div>

          <Button onClick={handleExportPdf} variant="outline" size="sm" className="h-10 w-full">
            <Download className="h-4 w-4 mr-1" /> {tr('Export to PDF', 'تصدير إلى PDF', 'Exporter en PDF')}
          </Button>
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
