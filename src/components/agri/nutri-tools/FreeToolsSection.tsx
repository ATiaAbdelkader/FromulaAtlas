'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search, X, Sparkles, ArrowRight, Info, BookOpen, Lightbulb, HelpCircle,
  Calculator, FlaskConical, Ruler, Droplets, Waves, Thermometer,
  Tractor, Package, Atom, BarChart3, Grid3x3, Beaker, Globe2,
  Sprout, Mountain, CloudRain, TableProperties, Network,
  Star, Clock, Columns2, Check, ShieldCheck,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

import { ConversionCalculator } from './ConversionCalculator';
import { NutrientUnitsConverter } from './NutrientUnitsConverter';
import { MeasureUnitsConverter } from './MeasureUnitsConverter';
import { HydroSolutionDesigner } from './HydroSolutionDesigner';
import { WaterHardnessDiagnostic } from './WaterHardnessDiagnostic';
import { VpdEstimator } from './VpdEstimator';
import { AmendmentBalanceCec } from './AmendmentBalanceCec';
import { GranularMixFormulation } from './GranularMixFormulation';
import { FertilizerComposition } from './FertilizerComposition';
import { NutrientDistributionByStage } from './NutrientDistributionByStage';
import { PeriodicTableNutrients } from './PeriodicTableNutrients';
import { FertilizerCompatibility } from './FertilizerCompatibility';
import { NutrientInteractions } from './NutrientInteractions';
import { MineralizableNEstimator } from './MineralizableNEstimator';
import { SoilWaterTexture } from './SoilWaterTexture';
import { IrrigationBalance } from './IrrigationBalance';
import { SolubilitySaltIndex } from './SolubilitySaltIndex';
import { FertilizerCarbonFootprint } from './FertilizerCarbonFootprint';
import { WhyItMattersPanel } from './WhyItMattersPanel';
import { WHY_IT_MATTERS } from '@/lib/why-it-matters-data';
import { ToolExportBar, EXPORT_COPY_EVENT } from './ToolExportBar';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { CompareDialog } from './CompareDialog';
import { SeasonPlanGenerator } from './SeasonPlanGenerator';
import { ActiveMatterSelector } from '../active-matter-selector/ActiveMatterSelector';
import { useTranslation } from '@/lib/language-store';

type ToolCategory = 'Converters' | 'Solution & Water' | 'Fertilizers' | 'Soil & Irrigation' | 'Reference';

export interface ToolMeta {
  id: string;
  name: string;
  description: string;
  /** Short one-line benefit the user gains from this tool. */
  benefit: string;
  /** 2-3 short steps describing how to use the tool. */
  howToUse: string[];
  category: ToolCategory;
  icon: React.ComponentType<{ className?: string }>;
  Component: React.ComponentType;
  /** Optional Arabic translations. When the active language is 'ar',
   * these replace the English `name`/`description`/`benefit`/`howToUse`
   * fields in the rendered UI. Fall back to English when undefined. */
  name_ar?: string;
  description_ar?: string;
  benefit_ar?: string;
  howToUse_ar?: string[];
}

/** Picks the right localized string from a ToolMeta field. Falls back
 * to the English source when the Arabic variant isn't provided. */
function trField<T>(en: T, ar: T | undefined, isRTL: boolean): T {
  return isRTL && ar !== undefined ? ar : en;
}

const TOOLS: ToolMeta[] = [
  // Converters
  {
    id: 'oxide-conversion',
    name: 'Oxide ↔ Elemental Converter',
    description: 'Bidirectional CaO↔Ca, K₂O↔K, P₂O₅↔P, etc. (30+ pairs).',
    benefit: 'Avoids lab-vs-label confusion when comparing soil tests (oxide form) with fertilizer guarantees (elemental form).',
    howToUse: [
      'Type a value into either the oxide or elemental field.',
      'The opposite field updates instantly with the converted value.',
      'Use "Clear all" to reset every row at once.',
    ],
    name_ar: 'محوّل الأكاسيد ↔ العناصر',
    description_ar: 'تحويل ثنائي CaO↔Ca، K₂O↔K، P₂O₅↔P وغيرها (أكثر من 30 زوجاً).',
    benefit_ar: 'يتفادى اللبس بين المختبر والملصق عند مقارنة تحاليل التربة (صيغة الأكسيد) مع ضمانات السماد (الصيغة العنصرية).',
    howToUse_ar: [
      'اكتب قيمة في حقل الأكسيد أو العنصر.',
      'يتحدّث الحقل المقابل فوراً بالقيمة المحوّلة.',
      'استخدم «مسح الكل» لإعادة ضبط كل الصفوف دفعة واحدة.',
    ],
    category: 'Converters', icon: Calculator, Component: ConversionCalculator,
  },
  {
    id: 'nutrient-units',
    name: 'Nutrient Units Converter',
    description: 'ppm ↔ mmol ↔ meq/L for 22 nutrients and ions.',
    benefit: 'Reconciles hydroponic recipes (meq/L) with lab reports (ppm) and scientific literature (mmol/L) in one click.',
    howToUse: [
      'Pick any nutrient row.',
      'Type into ppm, mmol (or µmol for micros), or meq/L — the other two update live.',
      'Equivalent weights and valences are pre-loaded, so conversions are exact.',
    ],
    name_ar: 'محوّل وحدات العناصر الغذائية',
    description_ar: 'ppm ↔ mmol ↔ meq/L لـ 22 عنصراً وأيون.',
    benefit_ar: 'يوافق بين وصفات الزراعة المائية (meq/L) وتقارير المختبر (ppm) والأدبيات العلمية (mmol/L) بنقرة واحدة.',
    howToUse_ar: [
      'اختر أي صف عنصر غذائي.',
      'اكتب في ppm أو mmol (أو µmol للعناصر الصغرى) أو meq/L — يتحدّث الآخران مباشرة.',
      'الأوزان المعادلة والتكافؤات محمّلة مسبقاً، فالتحويلات دقيقة.',
    ],
    category: 'Converters', icon: FlaskConical, Component: NutrientUnitsConverter,
  },
  {
    id: 'measure-units',
    name: 'Physical Units Converter',
    description: 'Length, area, volume, mass, temperature, pressure, concentration, ionic.',
    benefit: 'A single converter for the eight physical magnitudes agronomists juggle daily — no more tab-hopping between unit sites.',
    howToUse: [
      'Choose a category (length, area, temperature, ionic, etc.).',
      'Enter the value, pick the source and target units.',
      'Result appears instantly; soil↔solution ionic mismatches are flagged.',
    ],
    name_ar: 'محوّل الوحدات الفيزيائية',
    description_ar: 'الطول، المساحة، الحجم، الكتلة، الحرارة، الضغط، التركيز، الأيونات.',
    benefit_ar: 'محوّل واحد للمقادير الفيزيائية الثمانية التي يتنقّل بينها المهندس الزراعي يومياً — بلا تبديل بين مواقع الوحدات.',
    howToUse_ar: [
      'اختر فئة (طول، مساحة، حرارة، أيوني، إلخ).',
      'أدخل القيمة، اختر الوحدتين المصدر والهدف.',
      'تظهر النتيجة فوراً؛ عدم تطابق الأيونات بين التربة والمحلول يُعلام عنه.',
    ],
    category: 'Converters', icon: Ruler, Component: MeasureUnitsConverter,
  },

  // Solution & Water
  {
    id: 'hydro-solution',
    name: 'Hydroponic Solution Designer',
    description: 'Design a nutrient solution via meq/L, ppm, CE, and an anion ternary diagram.',
    benefit: 'Visualises the ionic balance of a hydroponic formula against the Steiner equilibrium zone — spot K/Ca/Mg imbalance before mixing.',
    howToUse: [
      'Edit meq/L for the 8 ions (or use a preset like Steiner / Hoagland).',
      'CE and ppm update automatically; the ternary diagram shows your anion split.',
      'Compare your % distribution against the green equilibrium polygon.',
    ],
    name_ar: 'مصمّم محلول الزراعة المائية',
    description_ar: 'صمّم محلولاً غذائياً عبر meq/L، ppm، CE، ومخطط ثلاثي للأنيونات.',
    benefit_ar: 'يصوّر التوازن الأيوني لوصفة الزراعة المائية مقابل منطقة توازن شتاينر — اكشف اختلال K/Ca/Mg قبل الخلط.',
    howToUse_ar: [
      'حرّر meq/L للأيونات الثمانية (أو استخدم إعداداً مسبقاً مثل شتاينر / هوغلاند).',
      'يتحدّث CE و ppm تلقائياً؛ المخطط الثلاثي يعرض توزيع الأنيون.',
      'قارن نسبتك المئوية مع مضلّع التوازن الأخضر.',
    ],
    category: 'Solution & Water', icon: Droplets, Component: HydroSolutionDesigner,
  },
  {
    id: 'water-hardness',
    name: 'Water Hardness Diagnostic',
    description: 'Hardness units, Ca+Mg hardness, and acid dose for HCO₃⁻/CO₃²⁻ neutralization.',
    benefit: 'Tells you exactly how much nitric/sulfuric/phosphoric acid to add per m³ to drop HCO₃⁻ to a safe residual — protecting drip emitters and pH stability.',
    howToUse: [
      'Section 1: type any hardness unit; all 5 units + classification update.',
      'Section 2: enter lab Ca and Mg to compute total hardness as CaCO₃.',
      'Section 3: enter HCO₃⁻/CO₃²⁻, residual target, water volume, and acid choice — dose appears.',
    ],
    name_ar: 'تشخيص صالبة المياه',
    description_ar: 'وحدات الصالبة، صالبة Ca+Mg، وجرعة حمض لمعادلة HCO₃⁻/CO₃²⁻.',
    benefit_ar: 'يخبرك بالضبط بكمية حمض النيتريك/الكبريتيك/الفوسفوريك لكل م³ لخفض HCO₃⁻ إلى بقايا آمنة — حماية لرؤوس الريب واستقرار pH.',
    howToUse_ar: [
      'القسم 1: اكتب أي وحدة صالبة؛ كل الوحدات الخمس + التصنيف تتحدّث.',
      'القسم 2: أدخل Ca و Mg من المختبر لحساب الصالبة الكلية كـ CaCO₃.',
      'القسم 3: أدخل HCO₃⁻/CO₃²⁻، الهدف المتبقي، حجم الماء، واختيار الحمض — تظهر الجرعة.',
    ],
    category: 'Solution & Water', icon: Waves, Component: WaterHardnessDiagnostic,
  },
  {
    id: 'vpd',
    name: 'VPD Estimator',
    description: 'Vapor Pressure Deficit (kPa) and Humidity Deficit (g/m³) from temperature & humidity.',
    benefit: 'Quantifies the real "thirst" of the air — the number that drives transpiration, Ca transport, and stress in greenhouses.',
    howToUse: [
      'Enter air temperature and relative humidity.',
      'Pick leaf-temperature mode (you measured it) or solar-radiation mode (estimated).',
      'Read VPD (kPa) + humidity deficit (g/m³) + status (Low / Optimal / High).',
    ],
    name_ar: 'مقدّر عجز ضغط البخار (VPD)',
    description_ar: 'عجز ضغط البخار (kPa) وعجز الرطوبة (g/m³) من الحرارة والرطوبة.',
    benefit_ar: 'يقدّر «عطش الهواء» الحقيقي — الرقم الذي يقود النتح، نقل Ca، والإجهاد في البيوت المحمية.',
    howToUse_ar: [
      'أدخل حرارة الهواء والرطوبة النسبية.',
      'اختر وضع حرارة الورقة (قسته) أو وضع الإشعاع الشمسي (مقدّر).',
      'اقرأ VPD (kPa) + عجز الرطوبة (g/m³) + الحالة (منخفض / مثالي / مرتفع).',
    ],
    category: 'Solution & Water', icon: Thermometer, Component: VpdEstimator,
  },

  // Fertilizers
  {
    id: 'amendment-balance',
    name: 'Amendment Balance by CEC',
    description: 'Soil cation analysis → amendment doses (gypsum, lime, dolomite, SOP, MgSO₄).',
    benefit: 'Translates a soil-test cation profile into kg/ha of gypsum/lime/dolomite/SOP — closes the gap between lab report and field application.',
    howToUse: [
      'Enter the 6 exchangeable cations (K, Ca, Mg, H, Na, Al) in meq/100g.',
      'Set bulk density, depth, pH, and root-reach %.',
      'Read the recommended amendment strategy with doses already adjusted by root-reach factor.',
    ],
    name_ar: 'توازن المعدلات حسب CEC',
    description_ar: 'تحليل كاتيونات التربة → جرعات معدّلات (جبس، جير، دولوميت، SOP، MgSO₄).',
    benefit_ar: 'يحوّل مخطط كاتيونات تحليل التربة إلى kg/ha من الجبس/الجير/الدولوميت/SOP — يسد الفجوة بين تقرير المختبر والتطبيق الحقلي.',
    howToUse_ar: [
      'أدخل الكاتيونات المتبادلة الستة (K، Ca، Mg، H، Na، Al) بـ meq/100g.',
      'حدد الكثافة الظاهرية، العمق، pH، ونسبة وصول الجذور.',
      'اقرأ استراتيجية المعدّلات الموصى بها بجرعات معدّلة بعامل وصول الجذور.',
    ],
    category: 'Fertilizers', icon: Tractor, Component: AmendmentBalanceCec,
  },
  {
    id: 'granular-mix',
    name: 'Granular Mix Formulation',
    description: 'Build a granular blend from 24 fertilizers → NPK analysis and kg/ha.',
    benefit: 'Previews the NPK + secondary + micro analysis of a custom blend before you commit tonnes — and computes kg/ha of every nutrient at your application rate.',
    howToUse: [
      'Add fertilizers from the 24-product library and enter each one\'s % by tonne.',
      'Set the blend dose (kg/ha).',
      'Read the live blend analysis, NPK ratio, and per-nutrient kg/ha.',
    ],
    name_ar: 'صياغة الخلطة الحبيبية',
    description_ar: 'ابنِ خلطة حبيبية من 24 سماداً → تحليل NPK و kg/ha.',
    benefit_ar: 'يعاين تحليل NPK + العناصر الثانوية والصغرى لخلطة مخصّصة قبل توريد الأطنان — ويحسب kg/ha لكل عنصر عند معدل تطبيقك.',
    howToUse_ar: [
      'أضف أسمدة من مكتبة الـ24 منتجاً وأدخل % لكل منها بالطن.',
      'حدد جرعة الخلطة (kg/ha).',
      'اقرأ تحليل الخلطة الحي، نسبة NPK، و kg/ha لكل عنصر.',
    ],
    category: 'Fertilizers', icon: Package, Component: GranularMixFormulation,
  },
  {
    id: 'fertilizer-composition',
    name: 'Fertilizer Composition (%)',
    description: 'Parse a chemical formula → elemental %, oxide equivalents, MW, N partition.',
    benefit: 'Type any chemical formula (e.g. Ca(NO₃)₂·4H₂O) and instantly see elemental %, oxide equivalents, N-NO₃/N-NH₄ split, and molecular weight — no lookup tables.',
    howToUse: [
      'Type a formula (supports hydrates ·, double salts +, parentheses, unicode subscripts).',
      'Click Calculate (or press Enter).',
      'Read elemental %, oxide %, NPK tag, and MW; click any example chip to try one.',
    ],
    name_ar: 'تركيب السماد (%)',
    description_ar: 'حلّ صيغة كيميائية → % عنصرية، مكافئات الأكسيد، الوزن الجزيئي، تقسيم N.',
    benefit_ar: 'اكتب أي صيغة كيميائية (مثل Ca(NO₃)₂·4H₂O) لترى فوراً % العناصر، مكافئات الأكسيد، تقسيم N-NO₃/N-NH₄، والوزن الجزيئي — بلا جداول بحث.',
    howToUse_ar: [
      'اكتب صيغة (يدعم المميهات ·، الأملاح المزدوجة +، الأقواس، الحروف السفلية اليونيكود).',
      'اضغط احسب (أو Enter).',
      'اقرأ % العنصري، % الأكسيد، علامة NPK، والوزن الجزيئي؛ اضغط أي مثال للتجربة.',
    ],
    category: 'Fertilizers', icon: Atom, Component: FertilizerComposition,
  },
  {
    id: 'nutrient-distribution',
    name: 'Nutrient Distribution by Stage',
    description: 'Distribute nutrient extraction (kg/ha) across phenological stages with chart.',
    benefit: 'Matches supply to crop demand week-by-week — prevents both mid-cycle deficiency and end-of-season luxury consumption.',
    howToUse: [
      'Set total seasonal extraction (kg/ha) per nutrient.',
      'Adjust the % split across phenological stages (or use defaults).',
      'Read kg/ha per stage per nutrient on the chart and table.',
    ],
    name_ar: 'توزيع العناصر حسب المرحلة',
    description_ar: 'وزّع استخلاص العناصر (kg/ha) عبر مراحل فينولوجية مع رسم بياني.',
    benefit_ar: 'يوافق العرض مع طلب المحصول أسبوعياً — يمنع كل من نقص منتصف الدورة واستهلاك الفاخر نهاية الموسم.',
    howToUse_ar: [
      'حدد الاستخلاص الموسمي الكلي (kg/ha) لكل عنصر.',
      'اضبط النسبة المئوية عبر المراحل الفينولوجية (أو استخدم الافتراضية).',
      'اقرأ kg/ha لكل مرحلة لكل عنصر على الرسم والجدول.',
    ],
    category: 'Fertilizers', icon: BarChart3, Component: NutrientDistributionByStage,
  },
  {
    id: 'fertilizer-compatibility',
    name: 'Fertilizer Compatibility Matrix',
    description: '32×32 lower-triangular matrix of compatibility (C/R/I) for fertigation.',
    benefit: 'Prevents the #1 fertigation mistake — co-dissolving Ca²⁺ with sulfates or phosphates — by showing exactly which pairs precipitate before you mix the tank.',
    howToUse: [
      'Filter the matrix by fertilizer name if needed.',
      'Click any cell to see the chemistry explanation and recommended action.',
      'Green C = compatible · Yellow R = caution · Red I = never in the same stock tank.',
    ],
    name_ar: 'مصفوفة توافق الأسمدة',
    description_ar: 'مصفوفة 32×32 مثلثية سفلية للتوافق (C/R/I) للتسميد بالري.',
    benefit_ar: 'يمنع خطأ التسميد بالري رقم 1 — إذابة Ca²⁺ مع الكبريتات أو الفوسفات — بعرض الأزواج التي تترسّب قبل خلط الخزّان.',
    howToUse_ar: [
      'صفِّ المصفوفة باسم السماد إن لزم.',
      'اضغط أي خلية لرؤية شرح الكيمياء والإجراء الموصى به.',
      'C أخضر = متوافق · R أصفر = حذر · I أحمر = لا تجمع في خزّان المخزون نفسه أبداً.',
    ],
    category: 'Fertilizers', icon: Grid3x3, Component: FertilizerCompatibility,
  },
  {
    id: 'solubility-salt-index',
    name: 'Solubility & Salt Index',
    description: 'Sortable, filterable table of solubility (g/L) and salt index (NaNO₃=100).',
    benefit: 'Tells you which fertilizers will dissolve in cold stock tanks and which will burn roots — solubility for tank design, salt index for placement safety.',
    howToUse: [
      'Use the search box to filter by name or formula.',
      'Click any column header to sort (default: salt index descending).',
      'Coloured dots classify solubility as High / Medium / Low at a glance.',
    ],
    name_ar: 'الذوبانية ومؤشر الملح',
    description_ar: 'جدول قابل للفرز والتصفية للذوبانية (g/L) ومؤشر الملح (NaNO₃=100).',
    benefit_ar: 'يخبرك أي الأسمدة ستذوب في خزّانات باردة وأيها سيحرق الجذور — الذوبانية لتصميم الخزّان، مؤشر الملح لسلامة الموضع.',
    howToUse_ar: [
      'استخدم مربع البحث للتصفية بالاسم أو الصيغة.',
      'اضغط رأس أي عمود للفرز (الافتراضي: مؤشر الملح تنازلي).',
      'نقاط ملوّنة تصنّف الذوبانية كـ عالية / متوسطة / منخفضة بنظرة.',
    ],
    category: 'Fertilizers', icon: Beaker, Component: SolubilitySaltIndex,
  },
  {
    id: 'fertilizer-carbon',
    name: 'Fertilizer Carbon Footprint',
    description: 'Compare two fertilization programs by manufacturing + transport + N₂O emissions.',
    benefit: 'Quantifies the kg CO₂e/ha difference between Program A and Program B — turns "sustainable" from a slogan into a number you can defend.',
    howToUse: [
      'In each scenario, add up to 5 fertilizers with rate (kg/ha) and transport legs.',
      'Read per-row emissions split into manufacturing, transport, and field N₂O.',
      'Compare totals — the bar shows which program is lower and by how many kg CO₂e/ha.',
    ],
    name_ar: 'الأثر الكربوني للسماد',
    description_ar: 'قارن برنامجَي تسميد حسب التصنيع + النقل + انبعاثات N₂O.',
    benefit_ar: 'يقدّر فرق kg CO₂e/ha بين البرنامج أ والبرنامج ب — يحوّل «مستدام» من شعار إلى رقم قابل للدفاع.',
    howToUse_ar: [
      'في كل سيناريو، أضف حتى 5 أسمدة بمعدل (kg/ha) ومراحل نقل.',
      'اقرأ انبعاثات كل صف مقسّمة إلى تصنيع، نقل، و N₂O حقلي.',
      'قارن المجاميع — يعرض الشريط أي برنامج أقل وبكم kg CO₂e/ha.',
    ],
    category: 'Fertilizers', icon: Globe2, Component: FertilizerCarbonFootprint,
  },

  // Soil & Irrigation
  {
    id: 'n-mineralizable',
    name: 'Mineralizable N Estimation',
    description: 'Annual N release (kg N/ha/yr) from soil organic matter with T_min presets.',
    benefit: 'Estimates how much "free" nitrogen your soil will release this season — so you can subtract it from the fertilizer budget and avoid over-application.',
    howToUse: [
      'Enter organic matter %, bulk density, depth, and root-reach %.',
      'Pick a mineralization rate T_min preset (1 % conservative · 2 % medium · 3 % high).',
      'Read annual mineralizable N in kg/ha/yr — orientative, validate in field.',
    ],
    name_ar: 'تقدير النيتروجين المعدّني',
    description_ar: 'إطلاق نيتروجين سنوي (kg N/ha/yr) من المادة العضوية للتربة مع إعدادات T_min.',
    benefit_ar: 'يقدّر كم نيتروجين «مجاني» ستطلقه تربتك هذا الموسم — لتطرحه من ميزانية السماد وتتفادى الإفراط.',
    howToUse_ar: [
      'أدخل % المادة العضوية، الكثافة الظاهرية، العمق، ونسبة وصول الجذور.',
      'اختر إعداد معدل التمعدن T_min (1 % محافظ · 2 % متوسط · 3 % مرتفع).',
      'اقرأ النيتروجين المعدّني السنوي بـ kg/ha/yr — توجيهي، تحقّق في الحقل.',
    ],
    category: 'Soil & Irrigation', icon: Sprout, Component: MineralizableNEstimator,
  },
  {
    id: 'soil-water-texture',
    name: 'Soil Water & Texture (USDA)',
    description: 'USDA texture triangle + available water and irrigation-to-CC calculator.',
    benefit: 'Classifies your soil texture from clay/silt/sand % and computes how much water is available between permanent wilting point and field capacity.',
    howToUse: [
      'Enter any two of clay / silt / sand % — the third auto-balances.',
      'The USDA triangle highlights your texture class.',
      'Set CC, PMP, depth, bulk density, area, and root efficiency to get available water (m³) and irrigation sheet to CC (mm).',
    ],
    name_ar: 'ماء التربة والنسجة (USDA)',
    description_ar: 'مثلث نسجة USDA + الماء المتاح وحاسبة الري إلى السعة الحقلية.',
    benefit_ar: 'يصنّف نسجة تربتك من % طين/طين/رمل ويحسب كمية الماء المتاح بين نقطة الذبول الدائم والسعة الحقلية.',
    howToUse_ar: [
      'أدخل أي اثنين من % طين / طين / رمل — الثالث يوازن تلقائياً.',
      'يبرز مثلث USDA فئة نسجتك.',
      'حدد CC، PMP، العمق، الكثافة الظاهرية، المساحة، وكفاءة الجذور للحصول على الماء المتاح (م³) وجدول الري إلى CC (مم).',
    ],
    category: 'Soil & Irrigation', icon: Mountain, Component: SoilWaterTexture,
  },
  {
    id: 'irrigation-balance',
    name: 'Irrigation Sheet & Water Balance',
    description: 'FAO-56 ETc = Kc × ETo, deficit/surplus, m³ conversions for 1 or 7 day periods.',
    benefit: 'Replaces guesswork with FAO-56 — knows exactly how much water your crop used (ETc) and whether your irrigation + rain covered it.',
    howToUse: [
      'Enter ETo (mm) and Kc for your crop and stage; toggle 1-day or 7-day period.',
      'Enter rain (mm) and applied irrigation (m³) on the irrigated area.',
      'Read ETc, irrigation mm, balance (deficit/surplus), and total volume needed (m³).',
    ],
    name_ar: 'جدول الري وميزان المياه',
    description_ar: 'FAO-56 ETc = Kc × ETo، عجز/فائض، تحويلات م³ لفترات 1 أو 7 أيام.',
    benefit_ar: 'يستبدل التخمين بـ FAO-56 — يعرف بالضبط كم استهلك محصولك (ETc) وما إذا كان ريّك + المطر غطّاه.',
    howToUse_ar: [
      'أدخل ETo (مم) و Kc لمحصولك ومرحلته؛ بدّل فترة 1-يوم أو 7-أيام.',
      'أدخل المطر (مم) والري المطبّق (م³) على المساحة المروية.',
      'اقرأ ETc، ريّ مم، الميزان (عجز/فائض)، والحجم الكلي المطلوب (م³).',
    ],
    category: 'Soil & Irrigation', icon: CloudRain, Component: IrrigationBalance,
  },

  // Reference
  {
    id: 'periodic-table',
    name: 'Periodic Table of Plant Nutrients',
    description: 'Interactive 118-element table with agronomic roles + molecular weight calc.',
    benefit: 'One screen for "which elements are essential / beneficial / structural" plus a molecular-weight calculator — useful for teaching and for quick MW lookups.',
    howToUse: [
      'Click any element to see atomic weight, valence, electronegativity, and agronomic role.',
      'Switch to the Mol-weight tab and type a formula (e.g. KNO₃) to compute MW and elemental %.',
      'Use the "Use in molecular calculator" button to push an element into the formula.',
    ],
    name_ar: 'الجدول الدوري للعناصر النباتية',
    description_ar: 'جدول 118 عنصراً تفاعلي مع أدوار زراعية + حاسبة الوزن الجزيئي.',
    benefit_ar: 'شاشة واحدة لـ «أي العناصر أساسية / مفيدة / بنيوية» بالإضافة إلى حاسبة الوزن الجزيئي — مفيدة للتدريس وللبحث السريع.',
    howToUse_ar: [
      'اضغط أي عنصر لرؤية وزنه الذري، تكافؤه، كهروسالبيته، ودوره الزراعي.',
      'بدّل إلى تبويب الوزن الجزيئي واكتب صيغة (مثل KNO₃) لحساب MW و % العنصري.',
      'استخدم زر «استخدم في الحاسبة الجزيئية» لدفع عنصر إلى الصيغة.',
    ],
    category: 'Reference', icon: TableProperties, Component: PeriodicTableNutrients,
  },
  {
    id: 'nutrient-interactions',
    name: 'Nutrient Interactions & Mobility',
    description: 'Mulder diagram, root-arrival mechanisms, mobility, and pH availability curves.',
    benefit: 'A 4-in-1 reference that explains why high P locks up Zn, why K⁺ competes with Mg²⁺, and how pH moves each nutrient\'s availability — supports diagnosis, not just data.',
    howToUse: [
      'Mulder tab: click any ion to highlight its antagonists (red) and synergists (blue).',
      'Root-arrival tab: click a row to see how each nutrient reaches the root.',
      'Mobility tab: click an element pill for symptom location + functions + tip.',
      'pH tab: click any nutrient to read why availability changes with pH.',
    ],
    name_ar: 'تفاعلات العناصر وحيودها',
    description_ar: 'مخطط مولدر، آليات وصول الجذور، الحيودة، ومنحنيات التوافر حسب pH.',
    benefit_ar: 'مرجع 4-في-1 يشرح لماذا يثبّت P العالي Zn، ولماذا ينافس K⁺ أيون Mg²⁺، وكيف يحرّك pH توافر كل عنصر — يدعم التشخيص وليس مجرد بيانات.',
    howToUse_ar: [
      'تبويب مولدر: اضغط أي أيون لإبراز خصومه (أحمر) وأ增效اته (أزرق).',
      'تبويب وصول الجذور: اضغط صفًا لرؤية كيف يصل كل عنصر إلى الجذر.',
      'تبويب الحيودة: اضغط بطاقة عنصر لموقع الأعراض + الوظائف + نصيحة.',
      'تبويب pH: اضغط أي عنصر لقراءة لماذا يتغيّر التوافر مع pH.',
    ],
    category: 'Reference', icon: Network, Component: NutrientInteractions,
  },
  {
    id: 'active-matter-selector',
    name: 'Active Matter Selector — Algérie',
    description: 'Décision aid: rank active ingredients against diseases, pests and weeds (crop-based, INPV 2017 + E-Phy data).',
    benefit: 'From crop + observed symptoms to a ranked shortlist of registered active matters with doses, DAR, safety and restrictions — no more guesswork at the sprayer.',
    howToUse: [
      'Pick your crop, then the problem (disease / pest / weed) — or type symptoms like “taches brunes”.',
      'Optionally set temperature, humidity and pressure to refine the ranking.',
      'Read the ranked cards: confidence, dose, DAR, restrictions and alternatives; browse the full catalogue in the second tab.',
    ],
    name_ar: 'منتقي المادة الفعالة — الجزائر',
    description_ar: 'مساعد قرار: رتّب المواد الفعالة ضد الأمراض والآفات والأعشاب (حسب المحصول، بيانات INPV 2017 + E-Phy).',
    benefit_ar: 'من المحصول + الأعراض الملاحظة إلى قائمة مرتّبة من المواد الفعالة المسجّلة بجرعات وDAR وسلامة وقيود — بلا تخمين عند الرشّاشة.',
    howToUse_ar: [
      'اختر محصولك، ثم المشكلة (مرض / آفة / عشبة) — أو اكتب أعراضاً مثل «بقع بنية».',
      'اختيارياً حدد الحرارة والرطوبة والضغط لتحسين الترتيب.',
      'اقرأ البطاقات المرتّبة: الثقة، الجرعة، DAR، القيود والبدائل؛ تصفّح الفهرس الكامل في التبويب الثاني.',
    ],
    category: 'Reference', icon: ShieldCheck, Component: ActiveMatterSelector,
  },
];

const CATEGORIES: ToolCategory[] = ['Converters', 'Solution & Water', 'Fertilizers', 'Soil & Irrigation', 'Reference'];

/** Arabic display labels for each category. The underlying `ToolCategory`
 * type stays in English (it's used as a key), but the user-facing chip
 * and count badge render through this map when the language is Arabic. */
const CATEGORY_LABEL_AR: Record<ToolCategory, string> = {
  'Converters':         'المحوّلات',
  'Solution & Water':   'المحاليل والمياه',
  'Fertilizers':        'الأسمدة',
  'Soil & Irrigation':  'التربة والري',
  'Reference':          'مراجع',
};

/** Returns the localized display label for a category given the active
 * language flag. */
export function categoryLabel(c: ToolCategory, isRTL: boolean): string {
  return isRTL ? CATEGORY_LABEL_AR[c] : c;
}

export const CATEGORY_COLORS: Record<ToolCategory, string> = {
  'Converters':         'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-900',
  'Solution & Water':   'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-900',
  'Fertilizers':        'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-900',
  'Soil & Irrigation':  'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-900',
  'Reference':          'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-900',
};

export const CATEGORY_DOT_COLORS: Record<ToolCategory, string> = {
  'Converters':         '#3b82f6',
  'Solution & Water':   '#0891b2',
  'Fertilizers':        '#16a34a',
  'Soil & Irrigation':  '#d97706',
  'Reference':          '#7c3aed',
};

export function FreeToolsSection() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'All'>('All');
  const [openTool, setOpenTool] = useState<ToolMeta | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [seasonPlanOpen, setSeasonPlanOpen] = useState(false);
  const { isRTL } = useTranslation();

  // Comparison tray — holds up to 2 tool IDs for side-by-side comparison.
  // Persists across tool-dialog opens/closes but not across page reloads (v1).
  const [compareTray, setCompareTray] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  // Ref to the search input — focused by the Ctrl+K / Cmd+K shortcut.
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Favorites + Recently used (localStorage-persisted)
  const FAV_KEY = 'nutriplant_tools_favorites_v1';
  const REC_KEY = 'nutriplant_tools_recent_v1';
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  // Load persisted favorites + recent on mount; also handle #tool=<id> hash for shareable URLs
  useEffect(() => {
    try {
      const fav = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
      const rec = JSON.parse(localStorage.getItem(REC_KEY) || '[]');
      if (Array.isArray(fav)) setFavorites(fav);
      if (Array.isArray(rec)) setRecent(rec);
    } catch { /* corrupt localStorage — ignore */ }
    // Open tool from URL hash (#tool=<id>) on initial load — supports shared URLs
    if (typeof window !== 'undefined') {
      const m = window.location.hash.match(/#tool=([\w-]+)/);
      if (m) {
        const t = TOOLS.find(x => x.id === m[1]);
        if (t) {
          setOpenTool(t);
          setRecent(prev => [t.id, ...prev.filter(id => id !== t.id)].slice(0, 5));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist favorites
  useEffect(() => {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(favorites)); } catch { /* storage full or blocked */ }
  }, [favorites]);

  // Persist recent
  useEffect(() => {
    try { localStorage.setItem(REC_KEY, JSON.stringify(recent)); } catch { /* storage full or blocked */ }
  }, [recent]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const addRecent = useCallback((id: string) => {
    setRecent(prev => [id, ...prev.filter(x => x !== id)].slice(0, 5));
  }, []);

  const openToolById = useCallback((id: string) => {
    const t = TOOLS.find(x => x.id === id);
    if (!t) return;
    setOpenTool(t);
    addRecent(id);
  }, [addRecent]);

  // Toggle a tool in/out of the comparison tray (max 2). When the tray is full
  // and the tool isn't already in it, show a toast and bail.
  const toggleCompare = useCallback((id: string) => {
    setCompareTray(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 2) {
        toast({
          title: 'Comparison tray is full (max 2)',
          description: 'Clear it first to add a different tool.',
        });
        return prev;
      }
      return [...prev, id];
    });
  }, []);

  const clearCompareTray = useCallback(() => {
    setCompareTray([]);
    setCompareOpen(false);
  }, []);

  // Resolve the two tools currently in the tray (in tray order, not TOOLS order).
  const compareTools = useMemo(
    () => compareTray.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) as ToolMeta[],
    [compareTray],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return TOOLS.filter(t => {
      if (activeCategory !== 'All' && t.category !== activeCategory) return false;
      if (!q) return true;
      return (t.name + ' ' + t.description + ' ' + t.benefit + ' ' + t.category).toLowerCase().includes(q);
    });
  }, [search, activeCategory]);

  // Group filtered tools by category for the landscape grid
  const grouped = useMemo(() => {
    return CATEGORIES.map(c => ({
      category: c,
      tools: filtered.filter(t => t.category === c),
    })).filter(g => g.tools.length > 0);
  }, [filtered]);

  // Global keyboard shortcuts — registered on window. See KeyboardShortcutsHelp
  // for the user-facing list. The handler is re-bound whenever any of its
  // dependencies change so the closures always see fresh state.
  useEffect(() => {
    const isTypingTarget = (el: Element | null) => {
      if (!el) return false;
      if (el instanceof HTMLInputElement) return true;
      if (el instanceof HTMLTextAreaElement) return true;
      if ((el as HTMLElement).isContentEditable) return true;
      return false;
    };

    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      // Ctrl+K / Cmd+K — focus the search input (always, even while typing elsewhere)
      if (mod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // Esc — if a dialog is open, let Radix handle it; otherwise clear search.
      if (e.key === 'Escape') {
        if (openTool || compareOpen) return; // Radix closes the dialog
        if (search) {
          setSearch('');
          searchInputRef.current?.focus();
        }
        return;
      }

      // From here on, don't trigger when the user is typing in an input/textarea.
      if (isTypingTarget(document.activeElement)) return;

      // Ctrl+S / Cmd+S — save-preset placeholder toast (only if a tool dialog is open)
      if (mod && (e.key === 's' || e.key === 'S')) {
        if (openTool) {
          e.preventDefault();
          toast({
            title: 'Save preset',
            description: "Copy this tool's inputs to your notes (full preset persistence coming soon).",
          });
        }
        return;
      }

      // Ctrl+E / Cmd+E — trigger the export bar's Copy action (only if a tool dialog is open)
      if (mod && (e.key === 'e' || e.key === 'E')) {
        if (openTool) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent(EXPORT_COPY_EVENT));
          toast({ title: 'Results copied to clipboard' });
        }
        return;
      }

      // Number keys 1-9 — open the Nth visible tool (no dialog open, search not focused)
      if (!openTool && !compareOpen && /^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const t = filtered[idx];
        if (t) {
          e.preventDefault();
          setOpenTool(t);
          addRecent(t.id);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openTool, compareOpen, search, filtered, addRecent]);

  return (
    <section className="space-y-5">
      {/* Hero header */}
      <div className="rounded-xl p-5 sm:p-6 bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800 text-white">
        <div className="flex items-center gap-2 mb-2 text-emerald-100 text-xs font-medium uppercase tracking-wide">
          <Sparkles className="h-3.5 w-3.5" /> {isRTL ? '19 أداة زراعية مجانية' : '19 Free Agronomic Tools'}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold leading-tight mb-1">
          {isRTL ? 'أدوات NutriPlant PRO المجانية' : 'NutriPlant PRO Free Tools'}
        </h2>
        <p className="text-sm text-emerald-100/90 max-w-2xl">
          {isRTL
            ? 'إعادة تنفيذ أصيلة لمجموعة الأدوات المجانية العامة من NutriPlant PRO — محوّلات، تشخيص محاليل ومياه، حاسبات أسمدة، أدوات تربة وري، ومصفوفات مرجعية. كل الحسابات تعمل في المتصفح، لا شيء يُرسل إلى خادم.'
            : 'A native reimplementation of NutriPlant PRO\'s public free-tools collection — converters, solution & water diagnostics, fertilizer calculators, soil & irrigation tools, and quick-reference matrices. All calculations run client-side; nothing is sent to a server.'}
        </p>
        <div className="flex flex-wrap gap-3 mt-3 text-xs">
          {CATEGORIES.map(c => {
            const count = TOOLS.filter(t => t.category === c).length;
            return (
              <div key={c} className="bg-white/10 backdrop-blur rounded px-2 py-1 border border-white/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: CATEGORY_DOT_COLORS[c] }} />
                <span className="text-emerald-100">{categoryLabel(c, isRTL)}</span> <span className="font-bold ml-0.5">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Introduction panel — What / How / Why */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <IntroCard
          icon={Info}
          color="#0891b2"
          title={isRTL ? 'ما هذه الأدوات' : 'What these tools are'}
          body={isRTL
            ? 'مجموعة منتقاة من 19 حاسبة وجدول مرجعي تغطي العمل اليومي للمهندسين الزراعيين والمزارعين والاستشاريين: تحويل الوحدات، تشخيص المياه والمحاليل الغذائية، صياغة الأسمدة، تخطيط التربة والري، بيانات تغذية المحاصيل المرجعية، ومنتقي المادة الفعالة للجزائر.'
            : 'A curated set of 19 calculators and reference tables covering the day-to-day workflow of agronomists, growers, and consultants: unit conversions, water & nutrient solution diagnostics, fertilizer formulation, soil & irrigation planning, crop-nutrition reference data, and an Algeria-focused active-matter selector.'}
        />
        <IntroCard
          icon={BookOpen}
          color="#16a34a"
          title={isRTL ? 'كيف تستخدمها' : 'How to use them'}
          body={isRTL
            ? 'تصفّح البطاقات أدناه، صفِّ حسب الفئة، أو ابحث بالاسم. اضغط أي بطاقة لفتح الأداة في نافذة — أدخل قيمك والنتيجة تتحدّث مباشرة. تعرض نافذة كل أداة فائدة قصيرة وخطوات استخدام.'
            : 'Browse the cards below, filter by category, or search by name. Click any card to open the tool in a dialog — enter your inputs and the result updates live. Each tool\'s dialog also shows a short benefit and step-by-step usage hint.'}
        />
        <IntroCard
          icon={Lightbulb}
          color="#d97706"
          title={isRTL ? 'لماذا تستخدمها' : 'Why use them'}
          body={isRTL
            ? 'تستبدل التخمين بالحساب: جرعات حمض دقيقة، خلطات NPK مضبوطة، جداول ري وفق FAO-56، خطط تعديل قائمة على CEC، وأثر كربوني للتسميد — تحوّل تقارير المختبر والملاحظات الحقلية إلى قرارات قابلة للدفاع.'
            : 'They replace guesswork with calculation: precise acid doses, exact NPK blends, FAO-56 irrigation sheets, CEC-based amendment plans, and fertilization carbon footprints — turning lab reports and field observations into defensible decisions.'}
        />
      </div>

      {/* Search & filter */}
      <div className="sticky top-[120px] z-20 bg-background/95 backdrop-blur rounded-lg border border-border p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchInputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isRTL ? 'ابحث عن أداة بالاسم أو الوصف أو الفائدة... (Ctrl+K)' : 'Search tools by name, description, or benefit... (Ctrl+K)'}
              className="pl-9 pr-8 h-10"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            <CategoryChip active={activeCategory === 'All'} onClick={() => setActiveCategory('All')} label={isRTL ? 'الكل' : 'All'} count={TOOLS.length} />
            {CATEGORIES.map(c => (
              <CategoryChip
                key={c}
                active={activeCategory === c}
                onClick={() => setActiveCategory(c)}
                label={categoryLabel(c, isRTL)}
                count={TOOLS.filter(t => t.category === c).length}
              />
            ))}
          </div>
          <KeyboardShortcutsHelp />
        </div>
      </div>

      {/* Favorites + Recently used (auto-hide when empty) */}
      {(favorites.length > 0 || recent.length > 0) && (
        <div className="space-y-3">
          {favorites.length > 0 && (
            <ToolRow
              label={isRTL ? 'المفضّلة' : 'Favorites'}
              icon={<Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
              ids={favorites}
              onOpen={openToolById}
              isRTL={isRTL}
            />
          )}
          {recent.length > 0 && (
            <ToolRow
              label={isRTL ? 'المستخدمة مؤخراً' : 'Recently used'}
              icon={<Clock className="h-3.5 w-3.5 text-emerald-600" />}
              ids={recent}
              onOpen={openToolById}
              isRTL={isRTL}
            />
          )}
        </div>
      )}

      {/* Season Plan Generator — highlighted Pro feature card (above the tools grid) */}
      <button
        type="button"
        onClick={() => setSeasonPlanOpen(true)}
        className="group relative w-full text-left rounded-xl p-5 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <div className="absolute top-3 right-3">
          <Badge className="bg-amber-400/90 text-amber-950 hover:bg-amber-400 text-[10px] font-bold">✨ Pro feature</Badge>
        </div>
        <div className="flex items-start gap-4 pr-24">
          <div className="flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-lg bg-white/20 backdrop-blur">
            <Sparkles className="h-7 w-7" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="text-lg font-bold leading-tight">Season Plan Generator</h3>
            <p className="text-sm text-emerald-50/90 leading-relaxed">
              Generate a 52-week PDF agronomic plan for your crop — NPK demand, irrigation,
              fertigation recipes, and management notes per week, tailored to your soil &amp; water test.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-50/80 mt-1">
              <span>Powered by AI · covers establishment → vegetative → flowering → filling → maturation</span>
            </div>
          </div>
          <div className="hidden sm:flex flex-shrink-0 self-center items-center justify-center h-8 w-8 rounded-full border border-white/30 group-hover:bg-white/20 transition-all">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </button>

      {/* Tools grouped by category — landscape cards */}
      <div className="space-y-6">
        {grouped.map(group => (
          <div key={group.category} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-6 rounded-sm" style={{ background: CATEGORY_DOT_COLORS[group.category] }} />
              <h3 className="text-base font-bold tracking-tight">{categoryLabel(group.category, isRTL)}</h3>
              <Badge variant="secondary" className="text-[10px] font-mono">{group.tools.length}</Badge>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {group.tools.map(tool => (
                <LandscapeToolCard
                  key={tool.id}
                  tool={tool}
                  onOpen={() => { setOpenTool(tool); addRecent(tool.id); }}
                  isFavorite={favorites.includes(tool.id)}
                  onToggleFavorite={() => toggleFavorite(tool.id)}
                  isInCompareTray={compareTray.includes(tool.id)}
                  compareTrayFull={compareTray.length >= 2}
                  onToggleCompare={() => toggleCompare(tool.id)}
                  isRTL={isRTL}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="rounded-full bg-muted p-4 inline-flex mb-3">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-1">{isRTL ? 'لا توجد أدوات مطابقة' : 'No tools match'}</h3>
          <p className="text-sm text-muted-foreground">{isRTL ? 'جرّب بحثاً أو فئة مختلفة.' : 'Try a different search or category.'}</p>
        </div>
      )}

      {/* Tool dialog — near-fullscreen like NutriPlant PRO: header + full-height tool area */}
      <Dialog open={!!openTool} onOpenChange={open => !open && setOpenTool(null)}>
        <DialogContent className="!max-w-[1600px] w-[98vw] !max-h-[96vh] h-[96vh] overflow-hidden p-0 gap-0 flex flex-col">
          {/* Compact header bar — title + collapsible hints toggle */}
          <DialogHeader className="px-5 py-3 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="flex items-center gap-2 text-base">
                {openTool && (
                  <span
                    className="flex items-center justify-center h-8 w-8 rounded-lg"
                    style={{ background: `${CATEGORY_DOT_COLORS[openTool.category]}20`, color: CATEGORY_DOT_COLORS[openTool.category] }}
                  >
                    <openTool.icon className="h-4 w-4" />
                  </span>
                )}
                {openTool ? trField(openTool.name, openTool.name_ar, isRTL) : null}
                {openTool && (
                  <Badge variant="outline" className={`text-[10px] ml-1 ${CATEGORY_COLORS[openTool.category]}`}>
                    {categoryLabel(openTool.category, isRTL)}
                  </Badge>
                )}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => setShowHints(v => !v)}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  {showHints ? (isRTL ? 'إخفاء الدليل' : 'Hide guide') : (isRTL ? 'إظهار الدليل' : 'Show guide')}
                </Button>
              </div>
            </div>
            <DialogDescription className="text-xs mt-1">
              {openTool ? trField(openTool.description, openTool.description_ar, isRTL) : null}
            </DialogDescription>

            {/* Collapsible benefit + how-to bar — inline, doesn't steal horizontal space from the tool */}
            {openTool && showHints && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                <div className="rounded-md px-3 py-2 border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300 font-semibold mb-0.5">
                    <Lightbulb className="h-3 w-3" /> {isRTL ? 'الفائدة' : 'Benefit'}
                  </div>
                  <p className="text-xs leading-snug text-foreground">
                    {trField(openTool.benefit, openTool.benefit_ar, isRTL)}
                  </p>
                </div>
                <div className="rounded-md px-3 py-2 border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/20">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-blue-700 dark:text-blue-300 font-semibold mb-0.5">
                    <HelpCircle className="h-3 w-3" /> {isRTL ? 'كيفية الاستخدام' : 'How to use'}
                  </div>
                  <ol className="text-xs leading-snug text-foreground list-decimal pl-4 space-y-0.5">
                    {trField(openTool.howToUse, openTool.howToUse_ar, isRTL).map((step, i) => <li key={i}>{step}</li>)}
                  </ol>
                </div>
              </div>
            )}
          </DialogHeader>

          {/* Full-height tool area — gets 100% of remaining viewport height */}
          <div className="flex-1 min-h-0 overflow-y-auto p-5">
            {openTool && <ToolExportBar tool={openTool} />}
            <div className={openTool ? 'mt-3' : ''}>
              {openTool && <openTool.Component />}
            </div>
            {/* Why this matters — collapsible educational panel */}
            {openTool && WHY_IT_MATTERS[openTool.id] && (
              <div className="mt-4">
                <WhyItMattersPanel content={WHY_IT_MATTERS[openTool.id]} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Comparison tray — sticky bottom bar (visible when ≥1 tool selected) */}
      {compareTray.length > 0 && (
        <CompareTrayBar
          tools={compareTools}
          onClear={clearCompareTray}
          onOpenCompare={() => setCompareOpen(true)}
          isRTL={isRTL}
        />
      )}

      {/* Side-by-side comparison dialog */}
      {compareTools.length === 2 && (
        <CompareDialog
          tools={[compareTools[0], compareTools[1]]}
          open={compareOpen}
          onOpenChange={setCompareOpen}
        />
      )}

      {/* Season Plan Generator — Pro feature dialog */}
      <SeasonPlanGenerator open={seasonPlanOpen} onOpenChange={setSeasonPlanOpen} />
    </section>
  );
}

/** Sticky bottom bar that shows the current comparison tray state. */
function CompareTrayBar({
  tools, onClear, onOpenCompare, isRTL,
}: {
  tools: ToolMeta[];
  onClear: () => void;
  onOpenCompare: () => void;
  isRTL: boolean;
}) {
  const hasTwo = tools.length >= 2;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-3xl">
      <div className="flex items-center gap-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/95 dark:bg-emerald-950/90 backdrop-blur px-3 py-2 shadow-lg">
        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 flex-shrink-0">
          <Columns2 className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide hidden sm:inline">{isRTL ? 'مقارنة' : 'Compare'}</span>
        </div>
        <div className="flex-1 min-w-0">
          {hasTwo ? (
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-semibold truncate">{trField(tools[0].name, tools[0].name_ar, isRTL)}</span>
              <span className="text-muted-foreground text-xs flex-shrink-0">{isRTL ? 'مقابل' : 'vs'}</span>
              <span className="font-semibold truncate">{trField(tools[1].name, tools[1].name_ar, isRTL)}</span>
            </div>
          ) : (
            <div className="text-xs text-emerald-800 dark:text-emerald-200">
              {isRTL ? 'اختر أداة أخرى للمقارنة' : 'Select one more tool to compare'} <span className="font-mono opacity-70">(1/2)</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {hasTwo && (
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={onOpenCompare}
            >
              <Columns2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isRTL ? 'افتح جنباً إلى جنب' : 'Open side-by-side'}</span>
              <span className="sm:hidden">{isRTL ? 'قارن' : 'Compare'}</span>
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 text-xs text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
            onClick={onClear}
          >
            <X className="h-3.5 w-3.5" />
            {isRTL ? 'مسح' : 'Clear'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Landscape (horizontal) tool card — icon on the left, content on the right, action arrow on the far right. */
function LandscapeToolCard({
  tool, onOpen, isFavorite, onToggleFavorite, isInCompareTray, compareTrayFull, onToggleCompare, isRTL,
}: {
  tool: ToolMeta;
  onOpen: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isInCompareTray: boolean;
  compareTrayFull: boolean;
  onToggleCompare: () => void;
  isRTL: boolean;
}) {
  const localizedName = trField(tool.name, tool.name_ar, isRTL);
  const localizedDescription = trField(tool.description, tool.description_ar, isRTL);
  const localizedBenefit = trField(tool.benefit, tool.benefit_ar, isRTL);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      className="group relative text-left rounded-xl border border-border bg-card p-4 sm:p-5 hover:border-emerald-400 hover:shadow-md transition-all flex gap-4 items-start cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      {/* Compare toggle — top-right, just left of the star */}
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onToggleCompare(); }}
        aria-label={isInCompareTray ? `Remove ${localizedName} from comparison` : `Add ${localizedName} to comparison`}
        aria-pressed={isInCompareTray}
        title={compareTrayFull && !isInCompareTray ? (isRTL ? 'صينية المقارنة ممتلئة (حد 2)' : 'Comparison tray is full (max 2)') : (isInCompareTray ? (isRTL ? 'إزالة من المقارنة' : 'Remove from comparison') : (isRTL ? 'أضف إلى المقارنة' : 'Add to comparison'))}
        className={`absolute top-3 right-11 z-10 inline-flex items-center justify-center h-7 w-7 rounded-full border transition-all ${
          isInCompareTray
            ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700'
            : 'bg-background/80 backdrop-blur border-border text-muted-foreground hover:text-emerald-600 hover:border-emerald-300 opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
        }`}
      >
        <Columns2 className="h-3.5 w-3.5" />
        {isInCompareTray && (
          <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center h-3.5 w-3.5 rounded-full bg-emerald-700 text-white text-[8px] font-bold border border-background">
            <Check className="h-2.5 w-2.5" />
          </span>
        )}
      </button>

      {/* Star toggle — top-right corner; always visible when favorited, otherwise on hover */}
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
        aria-label={isFavorite ? `Remove ${localizedName} from favorites` : `Add ${localizedName} to favorites`}
        aria-pressed={isFavorite}
        className={`absolute top-3 right-3 z-10 inline-flex items-center justify-center h-7 w-7 rounded-full border transition-all ${
          isFavorite
            ? 'bg-amber-400 border-amber-400 text-white hover:bg-amber-500 hover:border-amber-500'
            : 'bg-background/80 backdrop-blur border-border text-muted-foreground hover:text-amber-500 hover:border-amber-300 opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
        }`}
      >
        <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`} />
      </button>

      {/* Icon block — colored by category */}
      <div
        className="flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-lg transition-all group-hover:scale-105"
        style={{ background: `${CATEGORY_DOT_COLORS[tool.category]}20`, color: CATEGORY_DOT_COLORS[tool.category] }}
      >
        <tool.icon className="h-7 w-7" />
      </div>

      {/* Content — pr-16 on mobile reserves room for both star + compare buttons; sm+ relies on the arrow column */}
      <div className="flex-1 min-w-0 space-y-1.5 pr-16 sm:pr-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-base font-semibold leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
            {localizedName}
          </h4>
          <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[tool.category]}`}>
            {categoryLabel(tool.category, isRTL)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {localizedDescription}
        </p>
        <p className="text-xs text-foreground/80 leading-relaxed flex gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <span><span className="font-medium text-amber-700 dark:text-amber-400">{isRTL ? 'الفائدة:' : 'Benefit:'}</span> {localizedBenefit}</span>
        </p>
      </div>

      {/* Action arrow */}
      <div className="flex-shrink-0 self-center hidden sm:flex items-center justify-center h-8 w-8 rounded-full border border-border text-muted-foreground group-hover:border-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
        <ArrowRight className="h-4 w-4" />
      </div>
    </div>
  );
}

function IntroCard({ icon: Icon, color, title, body }: { icon: typeof Info; color: string; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg" style={{ background: color + '20', color }}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold" style={{ color }}>{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function CategoryChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-md border transition-all ${active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-background border-border text-muted-foreground hover:border-emerald-300 hover:text-foreground'}`}
    >
      {label} <span className="ml-1 opacity-70 font-mono">({count})</span>
    </button>
  );
}

/** Horizontal chip row for Favorites / Recently used — auto-hides when no tools match. */
function ToolRow({
  label, icon, ids, onOpen, isRTL,
}: {
  label: string;
  icon: React.ReactNode;
  ids: string[];
  onOpen: (id: string) => void;
  isRTL: boolean;
}) {
  const tools = ids.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) as ToolMeta[];
  if (tools.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
        <span className="font-mono opacity-70">{tools.length}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tools.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => onOpen(t.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              <span style={{ color: CATEGORY_DOT_COLORS[t.category] }}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="font-medium">{trField(t.name, t.name_ar, isRTL)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
