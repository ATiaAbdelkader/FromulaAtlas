'use client';

/**
 * About page — profiles Abdelkader Atia, the agricultural researcher behind
 * Formula Atlas. Renders a clean, editorial-style layout with a hero card,
 * mission statement, focus areas, feature showcase, and a closing reflection.
 */

import { useState, useEffect, useRef, ElementType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sprout, GraduationCap, Microscope, TrendingUp, Users, Lightbulb, Sparkles,
  MapPin, BookOpen, Heart, ArrowRight, CheckCircle2, ShieldCheck, Cpu, Database,
  Clock, Calendar, Filter, CheckSquare, Square, ChevronDown, ChevronUp, ThumbsUp,
  Satellite, Radio, Camera, Milestone, Rocket, Flame, Tag,
} from 'lucide-react';
import { useTranslation } from '@/lib/language-store';
import { FORMULA_COUNT, FREE_TOOL_COUNT } from '@/lib/catalog-stats';

/**
 * Roadmap Item Structure
 */
interface RoadmapItem {
  id: string;
  titleEn: string;
  titleAr: string;
  categoryEn: string;
  categoryAr: string;
  quarter: string;
  status: 'completed' | 'in-progress' | 'planned';
  descEn: string;
  descAr: string;
  deliverablesEn: string[];
  deliverablesAr: string[];
}

const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    id: 'inpv-phyto-db',
    titleEn: 'INPV Algerian Phytosanitary Directory',
    titleAr: 'دليل المبيدات الفيتوسانيتارية الجزائرية (INPV)',
    categoryEn: 'Phytosanitary & Protection',
    categoryAr: 'وقاية النبات والمبيدات',
    quarter: 'Q1 2026',
    status: 'completed',
    descEn: 'Full indexing of 1,264 official Algerian registered crop protection products with Pre-Harvest Intervals (DAR), target pests, and dosages.',
    descAr: 'فهرسة كاملة لـ 1,264 منتجاً مسجلاً في الفهرس الجزائري مع فترات الأمان قبل الجني (DAR) والآفات المستهدفة والجرعات المعتمدة.',
    deliverablesEn: ['1,264 Algerian INPV products indexed', 'Pre-harvest wait (DAR) safety warnings', 'Bee & aquatic toxicity indicators'],
    deliverablesAr: ['1,264 منتج جزائري مرخص', 'تنبيهات فترات الأمان قبل الجني (DAR)', 'مؤشرات سمية النحل والحياة المائية'],
  },
  {
    id: 'ai-specialists',
    titleEn: '10 Domain-Specialized AI Agronomists',
    titleAr: '10 وكلاء ذكاء اصطناعي متخصصين',
    categoryEn: 'AI & Decision Support',
    categoryAr: 'الذكاء الاصطناعي ودعم القرار',
    quarter: 'Q1 2026',
    status: 'completed',
    descEn: 'Dedicated AI advisory team covering plant nutrition, irrigation engineering, pest diagnostics, weed control, and arid-zone crop economics.',
    descAr: 'فريق استشاري ذكي يغطي تغذية النبات، هندسة الري، تشخيص الآفات، مكافحة الأعشاب، واقتصاديات المحاصيل في المناطق القاحلة.',
    deliverablesEn: ['10 specialist personas with system prompts', 'Bilingual Arabic/French spoken briefing', 'Real-time contextual formula linking'],
    deliverablesAr: ['10 مستشارين متخصصين', 'ملخص صوتي ناطق بالعربية والفرنسية', 'ربط فوري بمعادلات الأطلس الحسابية'],
  },
  {
    id: 'sunlight-field-logger',
    titleEn: 'Sunlight High-Contrast Mode & Field Logger',
    titleAr: 'وضع تحت الشمس وسجل الحقل السريع',
    categoryEn: 'Field Operations',
    categoryAr: 'العمليات الميدانية',
    quarter: 'Q1 2026',
    status: 'completed',
    descEn: 'Ultra-high-contrast glare-resistant display mode with one-tap field logging for irrigation, fertilizers, sprays, and harvests.',
    descAr: 'واجهة فائقة التباين مقاومة للوهج مع تسجيل ميداني بلمسة واحدة لعمليات السقي، التسميد، الرش، والحصاد.',
    deliverablesEn: ['High-contrast amber/black outdoor theme', 'Backpack sprayer 16L/20L dose calculators', 'Offline local storage synchronization'],
    deliverablesAr: ['سمة خارجية عالية التباين', 'حاسبة جرعات مضخة الظهر 16 و20 لتر', 'مزامنة وحفظ محلي بدون إنترنت'],
  },
  {
    id: 'sentinel-ndvi',
    titleEn: 'Sentinel-2 Satellite NDVI Vegetation Index',
    titleAr: 'مؤشر الغطاء النباتي بالأقمار الصناعية (Sentinel-2 NDVI)',
    categoryEn: 'Remote Sensing & GIS',
    categoryAr: 'الاستشعار عن بعد ونظم المعلومات الجغرافية',
    quarter: 'Q2 2026',
    status: 'in-progress',
    descEn: 'Automated 10m-resolution multispectral vegetation vigor tracking, historical moisture trends, and crop stress anomaly mapping.',
    descAr: 'تتبع آلي لكثافة الغطاء النباتي بدقة 10 أمتار، وتحليل رطوبة المحاصيل واكتشاف بؤر الإجهاد المائي والميداني.',
    deliverablesEn: ['10m multispectral NDVI/NDRE overlays', 'Automated cloud-mask filtering', 'Parcel stress change-over-time graph'],
    deliverablesAr: ['خرائط NDVI و NDRE بدقة 10 أمتار', 'تصفية آلية للغيوم والشوائب', 'مخطط زمني لتغير إجهاد القطعة'],
  },
  {
    id: 'micro-nutrient-lab',
    titleEn: 'Precision Soil & Leaf Lab CSV Analyzer',
    titleAr: 'محلل تحاليل التربة والأوراق المخبرية (CSV)',
    categoryEn: 'Soil & Plant Nutrition',
    categoryAr: 'تغذية التربة والنبات',
    quarter: 'Q2 2026',
    status: 'in-progress',
    descEn: 'Direct import of laboratory soil and foliar analysis reports to auto-generate corrective micro-nutrient and leaching recipes.',
    descAr: 'استيراد مباشر لتقارير التحاليل المخبرية للتربة والأوراق مع توليد فوري لبرامج التسميد التصحيحية وغسيل الأملاح.',
    deliverablesEn: ['CSV lab file auto-parser', 'Cation Exchange Capacity (CEC) balance', 'Salinity leaching requirement calculator'],
    deliverablesAr: ['قارئ آلي لملفات CSV المخبرية', 'موازنة السعة التبادلية الكاتيونية (CEC)', 'حساب احتياجات غسيل الملوحة'],
  },
  {
    id: 'weather-frost-alerts',
    titleEn: 'Predictive Frost & Sirocco (Chehili) Alerts',
    titleAr: 'نظام إنذار مبكر للصقيع ورياح الشهيلي',
    categoryEn: 'Agro-Meteorology',
    categoryAr: 'الأرصاد الزراعية',
    quarter: 'Q3 2026',
    status: 'planned',
    descEn: 'Hyperlocal 48-hour frost probability and heatwave desiccation alerts with emergency mitigation protocols (sprinklers, anti-transpirants).',
    descAr: 'تنبؤات دقيقة لـ 48 ساعة باحتمالية الصقيع وموجات الحرارة الشديدة مع توصيات الحماية الطارئة والري الوقائي.',
    deliverablesEn: ['Dew point and wet-bulb freeze calculations', 'Push alerts for rapid temperature drop', 'Emergency action checklists by crop type'],
    deliverablesAr: ['حساب نقطة الندى ودرجة حرارة الصقيع', 'تنبيهات فورية عند الانخفاض الحاد للحرارة', 'قوائم تدخل طارئ حسب نوع المحصول'],
  },
  {
    id: 'lora-iot-telemetry',
    titleEn: 'LoRaWAN & IoT Soil Moisture Probe Sync',
    titleAr: 'ربط حساسات التربة اللاسلكية (LoRaWAN & IoT)',
    categoryEn: 'Smart Hardware & IoT',
    categoryAr: 'الأجهزة الذكية وإنترنت الأشياء',
    quarter: 'Q3 2026',
    status: 'planned',
    descEn: 'Real-time telemetry ingestion from multi-depth capacitive probes for autonomous drip irrigation valve trigger recommendations.',
    descAr: 'استقبال بيانات حساسات الرطوبة متعددة الأعماق في الوقت الفعلي لاقتراح أوقات فتح وإغلاق صمامات الري بالتنقيط بدقة.',
    deliverablesEn: ['MQTT and TTN LoRaWAN webhook integrations', 'Multi-depth root-zone moisture graphs', 'Autonomous ETc feedback adjustments'],
    deliverablesAr: ['تكامل مع بروتوكولات MQTT و LoRaWAN', 'رسوم بيانية لرطوبة منطقة الجذور', 'تعديل آلي لجدولة الري بالتبخر-نتح'],
  },
  {
    id: 'cv-leaf-scanner',
    titleEn: 'On-Device Computer Vision Leaf Disease Scanner',
    titleAr: 'ماسح أمراض الأوراق بالرؤية الحاسوبية على الجهاز',
    categoryEn: 'AI & Diagnostics',
    categoryAr: 'الذكاء الاصطناعي والتشخيص',
    quarter: 'Q4 2026',
    status: 'planned',
    descEn: 'Fast on-device camera inference to identify fungal spots, nutrient deficiencies, and insect attacks with instant INPV treatment matches.',
    descAr: 'تحليل فوري عبر كاميرا الهاتف لتشخيص الأمراض الفطرية ونقص العناصر والآفات الحشرية مع اقتراح العلاج المرخص فوراً.',
    deliverablesEn: ['Offline-capable edge neural model', 'Symptom bounding boxes & confidence score', 'Direct link to INPV approved treatments'],
    deliverablesAr: ['نموذج ذكاء خفيف يعمل بدون إنترنت', 'تحديد دقيق لأعراض الإصابة ونسبة التأكد', 'ربط فوري بالحلول المرخصة في INPV'],
  },
];

/**
 * Lightweight scroll observer hook for entrance animations using Tailwind classes
 */
function useScrollReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Fallback if IntersectionObserver is unsupported
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

export function AboutPage() {
  const { isRTL } = useTranslation();

  const heroReveal = useScrollReveal(0.05);
  const aboutMeReveal = useScrollReveal(0.1);
  const focusReveal = useScrollReveal(0.1);
  const beliefsReveal = useScrollReveal(0.1);
  const appFeaturesReveal = useScrollReveal(0.1);
  const closingReveal = useScrollReveal(0.1);

  // Roadmap filter & interaction states
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in-progress' | 'planned'>('all');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    'inpv-phyto-db': true,
    'sentinel-ndvi': true,
  });
  const [userUpvotes, setUserUpvotes] = useState<Record<string, boolean>>({});

  // Load upvotes from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('formula_atlas_roadmap_votes');
      if (saved) setUserUpvotes(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  const toggleUpvote = (id: string) => {
    setUserUpvotes((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('formula_atlas_roadmap_votes', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredRoadmap = ROADMAP_ITEMS.filter((item) => {
    if (statusFilter === 'all') return true;
    return item.status === statusFilter;
  });

  const completedCount = ROADMAP_ITEMS.filter((i) => i.status === 'completed').length;
  const inProgressCount = ROADMAP_ITEMS.filter((i) => i.status === 'in-progress').length;
  const plannedCount = ROADMAP_ITEMS.filter((i) => i.status === 'planned').length;

  return (
    <main className="flex-1 max-w-[900px] mx-auto w-full p-4 sm:p-6 space-y-8 pb-20 sm:pb-8" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Hero card */}
      <section
        ref={heroReveal.ref}
        className={`rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800 text-white shadow-lg transition-all duration-700 ease-out transform ${
          heroReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-3 text-emerald-100 text-xs font-medium uppercase tracking-wide">
            <Sparkles className="h-3.5 w-3.5" />
            {isRTL ? 'عن المؤسّس' : 'About the founder'}
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar circle with initials */}
            <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-3xl sm:text-4xl font-bold border-2 border-white/30 shadow-inner">
              AA
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                {isRTL ? 'عبد القادر عطية' : 'Abdelkader Atia'}
              </h1>
              <p className="text-emerald-100 text-sm mt-1">
                {isRTL
                  ? 'باحث زراعي · مرشّح دكتوراه · مُربّي'
                  : 'Agricultural Researcher · PhD Candidate · Educator'}
              </p>
              <div className="flex items-center gap-1.5 text-emerald-200 text-xs mt-2">
                <MapPin className="h-3 w-3" />
                {isRTL ? 'الجزائر · الزراعة في الأراضي القاحلة وشبه القاحلة' : 'Algeria · Arid & Semi-arid Agriculture'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Me text */}
      <section
        ref={aboutMeReveal.ref}
        className={`rounded-xl border bg-card p-5 sm:p-6 space-y-4 shadow-sm transition-all duration-700 ease-out transform ${
          aboutMeReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <h2 className="text-lg font-bold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-emerald-600" />
          {isRTL ? 'نبذة عني' : 'About Me'}
        </h2>

        {isRTL ? (
          <>
            <p className="text-sm leading-relaxed text-foreground/90">
              أنا <strong>عبد القادر عطية</strong>، باحث زراعي ومُربّي ومتعلّم مدى الحياة من <strong>الجزائر</strong>، شغوف بتطوير الزراعة عبر العلم والتكنولوجيا والابتكار.
            </p>
            <p className="text-sm leading-relaxed text-foreground/90">
              تركّز أعمالي على <strong>تناسل الحيوان</strong>، و<strong>الأعمال الزراعية</strong>، و<strong>اتخاذ القرارات المبنية على البيانات</strong>، و<strong>التطوير الزراعي المستدام</strong>. كباحث دكتوراه، أبحث عن حلول عملية لتحسين إنتاجية الماشية مع المساهمة في البحث العلمي الذي يخاطب تحديات الزراعة في المناطق القاحلة وشبه القاحلة.
            </p>
            <p className="text-sm leading-relaxed text-foreground/90">
              إلى جانب البحث، أحبّ تصميم برامج التدريب وإنشاء محتوى تعليمي ومساعدة الطلاب والمزارعين والمحترفين على تحويل المعرفة إلى مهارات عملية. أؤمن بأن التعلّم المستمر والتعاون والاستخدام الذكي للأدوات الرقمية والذكاء الاصطناعي يمكن أن يسرّع التطوير الزراعي ويخلق أثراً دائماً.
            </p>
            <p className="text-sm leading-relaxed text-foreground/90">
              يعكس هذا التطبيق نظام تشغيلي الشخصي — مكان لتنظيم الأفكار وإدارة المشاريع وتتبع التقدّم والتحسين المستمر لعملي ونموّي الشخصي. كل مهمة وهدف ورؤية مسجّلة هنا تساهم في مهمتي بأن أكون باحثاً ومربّياً وقائداً أكثر فعالية في الزراعة.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-foreground/90">
              I am <strong>Abdelkader Atia</strong>, an agricultural researcher, educator, and lifelong learner from <strong>Algeria</strong> with a passion for advancing agriculture through science, technology, and innovation.
            </p>
            <p className="text-sm leading-relaxed text-foreground/90">
              My work focuses on <strong>animal reproduction</strong>, <strong>agribusiness</strong>, <strong>data-driven decision-making</strong>, and <strong>sustainable agricultural development</strong>. As a PhD researcher, I investigate practical solutions to improve livestock productivity while contributing to scientific research that addresses the challenges facing agriculture in arid and semi-arid regions.
            </p>
            <p className="text-sm leading-relaxed text-foreground/90">
              Alongside research, I enjoy designing training programs, creating educational content, and helping students, farmers, and professionals transform knowledge into practical skills. I believe that continuous learning, collaboration, and the intelligent use of digital tools and artificial intelligence can accelerate agricultural development and create lasting impact.
            </p>
            <p className="text-sm leading-relaxed text-foreground/90">
              This app reflects my personal operating system — a place to organize ideas, manage projects, track progress, and continuously improve both my work and personal growth. Every task, goal, and insight captured here contributes to my mission of becoming a more effective researcher, educator, and leader in agriculture.
            </p>
          </>
        )}
      </section>

      {/* Focus areas section with staggered scroll entrance */}
      <section
        ref={focusReveal.ref}
        className={`transition-all duration-700 ease-out transform ${
          focusReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Microscope className="h-4 w-4 text-emerald-600" />
            {isRTL ? 'مجالات التركيز الرئيسية' : 'Key Focus Areas'}
          </h3>
          <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full font-mono">
            {isRTL ? '٤ مجالات تخصصية' : '4 Disciplines'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FocusCard
            isVisible={focusReveal.isVisible}
            delayClass="delay-75"
            icon={Microscope}
            color="#0891b2"
            title={isRTL ? 'تناسل الحيوان' : 'Animal Reproduction'}
            description={isRTL
              ? 'بحث دكتوراه لتحسين إنتاجية الماشية عبر تقنيات الإنجاب وممارسات الإدارة المتكيّفة مع المناخات القاحلة.'
              : 'PhD research on improving livestock productivity through reproductive technologies and management practices adapted to arid climates.'}
          />
          <FocusCard
            isVisible={focusReveal.isVisible}
            delayClass="delay-150"
            icon={TrendingUp}
            color="#16a34a"
            title={isRTL ? 'الأعمال الزراعية' : 'Agribusiness'}
            description={isRTL
              ? 'اتخاذ قرارات مبنية على البيانات لربحية المزرعة وسلاسل التوريد وتطوير المشاريع المستدامة.'
              : 'Data-driven decision-making for farm profitability, supply chains, and sustainable enterprise development.'}
          />
          <FocusCard
            isVisible={focusReveal.isVisible}
            delayClass="delay-200"
            icon={Sprout}
            color="#f59e0b"
            title={isRTL ? 'الزراعة المستدامة' : 'Sustainable Agriculture'}
            description={isRTL
              ? 'حلول عملية للمناطق القاحلة وشبه القاحلة — كفاءة المياه، مرونة الجفاف، صحة التربة.'
              : 'Practical solutions for arid and semi-arid regions — water efficiency, drought resilience, and soil health.'}
          />
          <FocusCard
            isVisible={focusReveal.isVisible}
            delayClass="delay-300"
            icon={Users}
            color="#6366f1"
            title={isRTL ? 'التعليم والتدريب' : 'Education & Training'}
            description={isRTL
              ? 'تصميم برامج تحوّل المعرفة إلى مهارات للطلاب والمزارعين والمحترفين الزراعيين.'
              : 'Designing programs that turn knowledge into skills for students, farmers, and agricultural professionals.'}
          />
        </div>
      </section>

      {/* What I believe section */}
      <section
        ref={beliefsReveal.ref}
        className={`rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 sm:p-6 shadow-sm transition-all duration-700 ease-out transform ${
          beliefsReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-emerald-800 dark:text-emerald-200">
          <Heart className="h-4 w-4" />
          {isRTL ? 'بمَ أؤمن' : 'What I Believe'}
        </h3>
        <ul className="space-y-2.5 text-sm text-foreground/90">
          <li className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{isRTL
              ? <><strong>التعلّم المستمر</strong> — الزراعة تتطوّر بسرعة، ويجب أن نتطوّر معها.</>
              : <><strong>Continuous learning</strong> — agriculture evolves fast, and so must we.</>}</span>
          </li>
          <li className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{isRTL
              ? <><strong>التعاون</strong> — أفضل الحلول تنشأ من ربط الباحثين والمزارعين والتكنولوجيا.</>
              : <><strong>Collaboration</strong> — the best solutions come from connecting researchers, farmers, and technology.</>}</span>
          </li>
          <li className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{isRTL
              ? <><strong>الاستخدام الذكي للذكاء الاصطناعي</strong> — الأدوات الرقمية يمكنها تسريع التطوير الزراعي وخلق أثر دائم.</>
              : <><strong>Intelligent use of AI</strong> — digital tools can accelerate agricultural development and create lasting impact.</>}</span>
          </li>
          <li className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{isRTL
              ? <><strong>المعرفة إلى ممارسة</strong> — البحث يهمّ فقط عندما يصل إلى الحقل.</>
              : <><strong>Knowledge into practice</strong> — research only matters when it reaches the field.</>}</span>
          </li>
        </ul>
      </section>

      {/* Feature & Platform Showcase section with scroll entrance */}
      <section
        ref={appFeaturesReveal.ref}
        className={`rounded-xl border bg-card p-5 sm:p-6 shadow-sm space-y-4 transition-all duration-700 ease-out transform ${
          appFeaturesReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-emerald-600" />
            {isRTL ? 'عن هذا التطبيق وميزاته' : 'About This App & Platform Features'}
          </h3>
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded font-mono">
            v0.2.0
          </span>
        </div>

        <p className="text-sm leading-relaxed text-foreground/90">
          {isRTL ? (
            <><strong>أطلس المعادلات</strong> هو نظام تشغيلي متكامل للزراعة — يجمع بين <strong>{FORMULA_COUNT} معادلة زراعية</strong>، <strong>{FREE_TOOL_COUNT} أداة تفاعلية متقدمة</strong>، <strong>قدرات GIS</strong>، <strong>10 وكلاء ذكاء اصطناعي متخصصين</strong>، و<strong>جدولة الري الذكية</strong> في منصة واحدة. صُممت كل ميزة لحل تحديات حقيقية يواجهها المزارعون والباحثون والطلاب.</>
          ) : (
            <><strong>Formula Atlas</strong> is a full-scale agronomic operating system — integrating <strong>{FORMULA_COUNT} formulas</strong>, <strong>{FREE_TOOL_COUNT} interactive field tools</strong>, <strong>GIS mapping</strong>, <strong>10 specialized AI agents</strong>, and <strong>smart irrigation scheduling</strong>. Every feature is engineered to solve authentic challenges faced by farmers, agronomists, and students.</>
          )}
        </p>

        {/* Feature Highlights Grid with staggered animation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <FeatureHighlightCard
            isVisible={appFeaturesReveal.isVisible}
            delayClass="delay-75"
            icon={Cpu}
            title={isRTL ? 'أدوات حقلية وحاسبات' : 'Field Tools & Calculators'}
            desc={isRTL ? 'حسابات ري، تسميد، مبيدات INPV، وموازنات مغذيات فورية.' : 'Instant irrigation, fertigation, INPV phyto doses, & nutrient budgets.'}
          />
          <FeatureHighlightCard
            isVisible={appFeaturesReveal.isVisible}
            delayClass="delay-150"
            icon={Sparkles}
            title={isRTL ? 'وكلاء ذكاء اصطناعي' : '10 AI Agronomists'}
            desc={isRTL ? 'مستشارون متخصصون في المحاصيل، التربة، والوقاية والري.' : 'Specialized advisors for crops, soil, pest defense, and agronomy.'}
          />
          <FeatureHighlightCard
            isVisible={appFeaturesReveal.isVisible}
            delayClass="delay-200"
            icon={Database}
            title={isRTL ? 'قاعدة بيانات شاملة' : 'Deep Knowledge Base'}
            desc={isRTL ? 'فهرس الفيتوسانيتار الجزائري، مراجع BBCH، وتوأم المزرعة الرقمي.' : 'Algerian phytosanitary index, BBCH stages, and digital twin.'}
          />
        </div>

        {/* Key Metrics Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t">
          <Stat value={String(FORMULA_COUNT)} label={isRTL ? 'معادلة زراعية' : 'Formulas'} />
          <Stat value={String(FREE_TOOL_COUNT)} label={isRTL ? 'أداة مجانية' : 'Free tools'} />
          <Stat value="10" label={isRTL ? 'وكلاء ذكاء' : 'AI Agents'} />
          <Stat value="20" label={isRTL ? 'ملفات محاصيل' : 'Crop profiles'} />
        </div>
      </section>

      {/* ===================================================================== */}
      {/* INTERACTIVE ROADMAP & TIMELINE SECTION WITH FRAMER MOTION ANIMATIONS */}
      {/* ===================================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-xl border bg-card p-5 sm:p-6 shadow-sm space-y-6"
      >
        {/* Roadmap Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4"
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
              <Rocket className="h-3.5 w-3.5 animate-bounce" />
              {isRTL ? 'خارطة طريق التطوير' : 'Interactive Product Roadmap'}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              {isRTL ? 'الميزات القادمة ومراحل الإنجاز' : 'Upcoming Features & Milestone Timeline'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRTL
                ? 'تتبع حالة الميزات المنفذة وقيد التطوير والمخطط لها مع إمكانية التفاعل والتصويت.'
                : 'Track completed releases, active developments, and vote on upcoming platform capabilities.'}
            </p>
          </div>

          {/* Interactive Progress Chips */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{completedCount} {isRTL ? 'مكتمل' : 'Completed'}</span>
            </motion.span>
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 transition-colors"
            >
              <Clock className="h-3.5 w-3.5 animate-pulse" />
              <span>{inProgressCount} {isRTL ? 'قيد التطوير' : 'In-Progress'}</span>
            </motion.span>
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{plannedCount} {isRTL ? 'مخطط' : 'Planned'}</span>
            </motion.span>
          </div>
        </motion.div>

        {/* Filter Navigation Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-muted-foreground flex items-center gap-1 me-1 font-medium shrink-0">
            <Filter className="h-3.5 w-3.5" />
            {isRTL ? 'تصفية:' : 'Filter:'}
          </span>
          {(['all', 'completed', 'in-progress', 'planned'] as const).map((filterKey) => {
            const isActive = statusFilter === filterKey;
            const labels = {
              all: isRTL ? 'جميع الميزات' : 'All Features',
              completed: isRTL ? 'المكتملة' : 'Completed',
              'in-progress': isRTL ? 'قيد التطوير' : 'In-Progress',
              planned: isRTL ? 'المخطط لها' : 'Planned',
            };
            return (
              <motion.button
                key={filterKey}
                onClick={() => setStatusFilter(filterKey)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {labels[filterKey]}
              </motion.button>
            );
          })}
        </div>

        {/* Timeline Checklist Flow */}
        <div className="relative border-s-2 border-border/80 ms-3 sm:ms-4 space-y-6 pt-1">
          <AnimatePresence mode="popLayout">
            {filteredRoadmap.map((item, idx) => {
              const isExpanded = expandedItems[item.id] ?? false;
              const isVoted = userUpvotes[item.id] ?? false;

              // Status Styling Map
              const statusConfig = {
                completed: {
                  badgeBg: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
                  dotBg: 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/80',
                  icon: CheckCircle2,
                  labelEn: 'Completed',
                  labelAr: 'مكتمل',
                },
                'in-progress': {
                  badgeBg: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
                  dotBg: 'bg-amber-500 text-white ring-4 ring-amber-100 dark:ring-amber-950/80',
                  icon: Clock,
                  labelEn: 'In-Progress',
                  labelAr: 'قيد التطوير',
                },
                planned: {
                  badgeBg: 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
                  dotBg: 'bg-indigo-500 text-white ring-4 ring-indigo-100 dark:ring-indigo-950/80',
                  icon: Calendar,
                  labelEn: 'Planned',
                  labelAr: 'مخطط له',
                },
              }[item.status];

              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 24, x: isRTL ? 16 : -16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    y: -20,
                    x: isRTL ? -16 : 16,
                    scale: 0.95,
                    transition: {
                      duration: 0.28,
                      ease: [0.32, 0, 0.67, 0],
                    },
                  }}
                  transition={{
                    duration: 0.45,
                    delay: Math.min(idx * 0.06, 0.3),
                    ease: [0.22, 1, 0.36, 1],
                    layout: { duration: 0.3, ease: 'easeOut' },
                  }}
                  className="relative ps-6 sm:ps-8 transition-all group"
                >
                  {/* Timeline node icon */}
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(idx * 0.05 + 0.05, 0.3) }}
                    whileHover={{ scale: 1.15 }}
                    className={`absolute -start-[17px] top-1.5 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-transform duration-300 ${statusConfig.dotBg}`}
                  >
                    <StatusIcon className="h-4 w-4" />
                  </motion.div>

                  {/* Main Card */}
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl border bg-card/70 hover:bg-card hover:border-emerald-500/50 p-4 transition-colors duration-300 shadow-xs hover:shadow-md"
                  >
                    {/* Card Top Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusConfig.badgeBg}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          <span>{isRTL ? statusConfig.labelAr : statusConfig.labelEn}</span>
                        </span>

                        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border">
                          {item.quarter}
                        </span>

                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Tag className="h-3 w-3 text-emerald-600" />
                          {isRTL ? item.categoryAr : item.categoryEn}
                        </span>
                      </div>

                      {/* Upvote & Interaction Button */}
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => toggleUpvote(item.id)}
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            isVoted
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground border-border'
                          }`}
                          title={isRTL ? 'صوّت لهذه الميزة' : 'Vote / Show interest'}
                        >
                          <ThumbsUp className={`h-3.5 w-3.5 ${isVoted ? 'fill-current' : ''}`} />
                          <span>{isVoted ? (isRTL ? 'مهتم ✓' : 'Interested ✓') : (isRTL ? 'أرغب بهذه' : 'I want this')}</span>
                        </motion.button>

                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                          aria-label="Toggle details"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h4 className="text-sm sm:text-base font-semibold text-foreground mb-1">
                      {isRTL ? item.titleAr : item.titleEn}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {isRTL ? item.descAr : item.descEn}
                    </p>

                    {/* Expandable Checklist Deliverables */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          key="deliverables-panel"
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                          exit={{
                            opacity: 0,
                            height: 0,
                            marginTop: 0,
                            transition: {
                              height: { duration: 0.25, ease: 'easeInOut' },
                              opacity: { duration: 0.15 },
                            },
                          }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden pt-3 border-t border-dashed space-y-2 bg-muted/20 p-3 rounded-lg"
                        >
                          <div className="text-[11px] font-semibold text-foreground uppercase tracking-wider flex items-center gap-1">
                            <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
                            {isRTL ? 'عناصر الإنجاز والمواصفات:' : 'Key Deliverables & Specifications:'}
                          </div>
                          <ul className="space-y-1.5 text-xs text-foreground/90">
                            {(isRTL ? item.deliverablesAr : item.deliverablesEn).map((del, dIdx) => (
                              <motion.li
                                key={dIdx}
                                initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: isRTL ? -10 : 10 }}
                                transition={{ duration: 0.2, delay: dIdx * 0.04 }}
                                className="flex items-start gap-2"
                              >
                                {item.status === 'completed' ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                ) : item.status === 'in-progress' ? (
                                  <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                ) : (
                                  <Square className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                                )}
                                <span className={item.status === 'completed' ? 'text-foreground' : 'text-muted-foreground'}>
                                  {del}
                                </span>
                              </motion.li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* Closing reflection */}
      <section
        ref={closingReveal.ref}
        className={`text-center py-4 transition-all duration-700 ease-out transform ${
          closingReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <p className="text-sm text-muted-foreground italic max-w-xl mx-auto">
          {isRTL
            ? '«كل مهمة وهدف ورؤية مسجّلة هنا تساهم في مهمتي بأن أكون باحثاً ومربّياً وقائداً أكثر فعالية في الزراعة.»'
            : '"Every task, goal, and insight captured here contributes to my mission of becoming a more effective researcher, educator, and leader in agriculture."'}
        </p>
        <p className="text-xs text-muted-foreground mt-2 font-medium">— {isRTL ? 'عبد القادر عطية' : 'Abdelkader Atia'}</p>
      </section>
    </main>
  );
}

// ============================================================================
// Sub-components with Tailwind Transition Support
// ============================================================================

function FocusCard({
  icon: Icon,
  color,
  title,
  description,
  isVisible,
  delayClass,
}: {
  icon: ElementType;
  color: string;
  title: string;
  description: string;
  isVisible: boolean;
  delayClass: string;
}) {
  return (
    <div
      className={`rounded-lg border bg-card p-4 shadow-sm transition-all duration-700 ease-out transform ${delayClass} hover:shadow-md hover:-translate-y-0.5 ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-[0.98]'
      }`}
      style={{ borderTopWidth: 3, borderTopColor: color }}
    >
      <div
        className="w-9 h-9 rounded-md flex items-center justify-center mb-2 transition-transform duration-300 hover:scale-110"
        style={{ backgroundColor: color + '20' }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <h4 className="text-sm font-semibold mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureHighlightCard({
  icon: Icon,
  title,
  desc,
  isVisible,
  delayClass,
}: {
  icon: ElementType;
  title: string;
  desc: string;
  isVisible: boolean;
  delayClass: string;
}) {
  return (
    <div
      className={`rounded-lg border border-border/80 bg-muted/20 p-3 text-start space-y-1.5 transition-all duration-700 ease-out transform ${delayClass} hover:bg-muted/40 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="p-1 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="text-xs font-semibold text-foreground">{title}</div>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-md border bg-muted/20 p-2 text-center transition-all duration-300 hover:bg-muted/40">
      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
    </div>
  );
}


