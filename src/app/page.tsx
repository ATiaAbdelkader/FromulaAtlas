'use client';

/**
 * Marketing landing page for Formula Atlas.
 *
 * Route: /landing
 *
 * Designed to impress on first visit:
 *   - Animated hero with gradient + floating elements
 *   - Live counter stats (formulas, tools, agents, crops)
 *   - Feature grid with icons + hover effects
 *   - Interactive demo cards (GIS, AI, irrigation)
 *   - Founder quote from About tab
 *   - Strong CTA → / (the dashboard)
 */

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Sprout, Sparkles, MapPin, Droplets, Clock, Beaker, Mountain, Compass,
  Layers, BookOpen, Calculator, CloudRain, Satellite, Bug, DollarSign,
  Leaf, Users, FileText, ArrowRight, Play, Check, Zap, Sun, TrendingUp,
  ChevronRight, Microscope, Globe,
} from 'lucide-react';
import { AnimatedCounter } from '@/components/agri/nutri-tools/AnimatedCounter';
import { LanguageToggle } from '@/components/language-toggle';
import { useTranslation } from '@/lib/language-store';
import { FORMULA_COUNT, FREE_TOOL_COUNT } from '@/lib/catalog-stats';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const { isRTL } = useTranslation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-rotate the active feature tab every 4s
  useEffect(() => {
    const t = setInterval(() => setActiveFeature(f => (f + 1) % 4), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ================================================================== */}
      {/* Sticky nav */}
      {/* ================================================================== */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all ${scrolled ? 'bg-background/95 backdrop-blur-md border-b shadow-sm py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center">
              <Sprout className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm sm:text-base">Formula Atlas</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-xs">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#stats" className="text-muted-foreground hover:text-foreground transition-colors">Stats</a>
            <a href="#founder" className="text-muted-foreground hover:text-foreground transition-colors">Founder</a>
            <Link href="/app" className="text-muted-foreground hover:text-foreground transition-colors">Open App</Link>
            <LanguageToggle />
          </div>
          <Link href="/app" className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-700 text-white text-xs sm:text-sm font-medium hover:shadow-lg hover:scale-105 transition-all">
            Launch App <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>

      {/* ================================================================== */}
      {/* Hero */}
      {/* ================================================================== */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-violet-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-300/50 bg-emerald-50/50 dark:bg-emerald-950/30 mb-6">
            <Sparkles className="h-3 w-3 text-emerald-600" />
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">{isRTL ? 'منصة زراعية بالذكاء الاصطناعي · مجانية للأبد' : 'AI-powered agronomy platform · Free forever'}</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
            {isRTL ? (
              <>
                من <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">التربة</span> إلى <span className="bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 bg-clip-text text-transparent">السماء</span>،
                <br /><span className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">نظام تشغيل</span> مزرعتك.
              </>
            ) : (
              <>
                From <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">soil</span> to <span className="bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 bg-clip-text text-transparent">sky</span>,
                <br />your farm&apos;s <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">operating system</span>.
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            {isRTL
              ? `${FORMULA_COUNT} معادلة زراعية. ${FREE_TOOL_COUNT} حاسبة مجانية. نظم معلومات جغرافية، وكلاء ذكاء اصطناعي، جدولة ري، و ET₀ وفق FAO-56 — كل ذلك في منصة واحدة. صمّمه باحث، للمزارعين والمهندسين الزراعيين والطلاب.`
              : `${FORMULA_COUNT} agronomic formulas. ${FREE_TOOL_COUNT} free calculators. GIS, AI specialists, irrigation scheduling, and FAO-56 ET₀ — all in one platform. Built by a researcher, for farmers, agronomists, and students.`}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link href="/app" className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all">
              <Play className="h-4 w-4" /> {isRTL ? 'افتح التطبيق' : 'Launch the App'}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#features" className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-border bg-background hover:bg-muted/50 font-semibold transition-all">
              <Sparkles className="h-4 w-4" /> {isRTL ? 'استكشف الميزات' : 'Explore Features'}
            </a>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Check className="h-3 w-3 text-emerald-600" /> {isRTL ? 'بدون تسجيل' : 'No signup required'}</span>
            <span className="flex items-center gap-1"><Check className="h-3 w-3 text-emerald-600" /> {isRTL ? 'يعمل دون اتصال (PWA)' : 'Works offline (PWA)'}</span>
            <span className="flex items-center gap-1"><Check className="h-3 w-3 text-emerald-600" /> {isRTL ? 'بيانات مفتوحة (FAO-56، Open-Meteo)' : 'Open data (FAO-56, Open-Meteo)'}</span>
            <span className="flex items-center gap-1"><Check className="h-3 w-3 text-emerald-600" /> {isRTL ? 'متعدد اللغات' : 'Multi-language ready'}</span>
          </div>

          {/* Dashboard mockup — animated preview of the app */}
          <div className="mt-16 sm:mt-20 relative max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            {/* Glow behind */}
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-violet-500/20 rounded-3xl blur-2xl" />
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Live stats */}
      {/* ================================================================== */}
      <section id="stats" className="py-12 border-y bg-gradient-to-r from-emerald-50/50 via-cyan-50/30 to-violet-50/50 dark:from-emerald-950/20 dark:via-cyan-950/10 dark:to-violet-950/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
            <StatCounter icon={BookOpen} value={500} label={isRTL ? 'معادلة زراعية' : 'Agronomic formulas'} color="#f59e0b" />
            <StatCounter icon={Calculator} value={91} suffix="+" label={isRTL ? 'أداة تفاعلية' : 'Interactive tools'} color="#0891b2" />
            <StatCounter icon={Sparkles} value={10} label={isRTL ? 'وكلاء ذكاء' : 'AI specialists'} color="#6366f1" />
            <StatCounter icon={Sprout} value={20} label={isRTL ? 'محصول' : 'Crop profiles'} color="#16a34a" />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Features */}
      {/* ================================================================== */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/50 text-xs text-muted-foreground mb-4">
              <Zap className="h-3 w-3" /> {isRTL ? 'كل ما تحتاجه' : 'Everything you need'}
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
              {isRTL ? (
                <>منصة واحدة، <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">كل سير العمل</span></>
              ) : (
                <>One platform, <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">every workflow</span></>
              )}
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              {isRTL
                ? 'من أول تحليل تربة إلى تقرير الحصاد النهائي — يغطّي أطلس المعادلات الموسم الزراعي بأكمله بأدوات بمستوى البحث العلمي.'
                : 'From the first soil test to the final harvest report — Formula Atlas covers the entire growing season with research-grade tools.'}
            </p>
          </div>

          {/* Feature tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-12">
            {FEATURE_TABS.map((tab, i) => {
              const Icon = tab.icon;
              const active = i === activeFeature;
              return (
                <button
                  key={tab.id}
                  onMouseEnter={() => setActiveFeature(i)}
                  onClick={() => setActiveFeature(i)}
                  className={`text-left rounded-xl border-2 p-5 transition-all ${active ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[1.02]' : 'border-border bg-card hover:border-muted-foreground/30'}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${active ? 'bg-emerald-600 text-white' : 'bg-muted'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{tab.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tab.subtitle}</p>
                </button>
              );
            })}
          </div>

          {/* Active feature detail */}
          <div className="rounded-2xl border bg-card p-6 sm:p-10 min-h-[320px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {(() => {
                    const Icon = FEATURE_TABS[activeFeature].icon;
                    return (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-700 text-white flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                    );
                  })()}
                  <h3 className="text-xl font-bold">{FEATURE_TABS[activeFeature].title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{FEATURE_TABS[activeFeature].description}</p>
                <ul className="space-y-2">
                  {FEATURE_TABS[activeFeature].bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/app" className="inline-flex items-center gap-1.5 mt-5 text-sm font-medium text-emerald-600 hover:text-emerald-700">
                  Try it now <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {/* Visual mock */}
              <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-6 flex items-center justify-center min-h-[200px]">
                {FEATURE_TABS[activeFeature].visual}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Feature grid — all tools at a glance */}
      {/* ================================================================== */}
      <section className="py-20 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">{isRTL ? `${FREE_TOOL_COUNT} حاسبة مجانية، بلا احتكاك` : `${FREE_TOOL_COUNT} free calculators, zero friction`}</h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">{isRTL ? 'اضغط ⌘K من أي مكان في التطبيق لإيجاد أي أداة في أجزاء من الثانية.' : 'Press ⌘K from anywhere in the app to find any tool in milliseconds.'}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {ALL_TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.name}
                  className="group rounded-lg border bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: tool.color + '20' }}
                  >
                    <Icon className="h-4 w-4" style={{ color: tool.color }} />
                  </div>
                  <div className="text-xs font-semibold leading-tight">{tool.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{tool.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Use cases — who is this for? */}
      {/* ================================================================== */}
      <section className="py-20 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">{isRTL ? 'مصمّم للجميع في الزراعة' : 'Built for everyone in agriculture'}</h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">{isRTL ? 'من المزارع صغير الحيز إلى الباحث الدكتوراه — يتكيّف أطلس المعادلات مع نطاقك.' : 'From the smallholder farmer to the PhD researcher — Formula Atlas adapts to your scale.'}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <UseCaseCard
              icon={Sprout}
              color="#16a34a"
              title={isRTL ? 'المزارعون' : 'Farmers'}
              description={isRTL
                ? 'خطط للري، تابع تحاليل التربة، جدول العمالة، واحصل على نصائح بالذكاء الاصطناعي — كلها تعمل دون اتصال.'
                : 'Plan irrigation, track soil tests, schedule labor, and get AI advice — all offline-capable.'}
              points={isRTL
                ? ['مجاني للأبد', 'يعمل على الهاتف', 'بدون تسجيل', 'PWA قابل للتثبيت']
                : ['Free forever', 'Works on phone', 'No signup', 'PWA installable']}
            />
            <UseCaseCard
              icon={Microscope}
              color="#6366f1"
              title={isRTL ? 'الباحثون' : 'Researchers'}
              description={isRTL
                ? `${FORMULA_COUNT} معادلة مع مراجع، رياضيات FAO-56 ET₀، وبيانات قابلة للتصدير للأبحاث.`
                : `${FORMULA_COUNT} formulas with citations, FAO-56 ET₀ math, and exportable data for papers.`}
              points={isRTL
                ? ['FAO-56 + فينسنتي', 'جاهز للاقتباس', 'تصدير CSV/JSON', 'مصادر بيانات مفتوحة']
                : ['FAO-56 + Vincenty', 'Citation-ready', 'CSV/JSON export', 'Open data sources']}
            />
            <UseCaseCard
              icon={Users}
              color="#f59e0b"
              title={isRTL ? 'الطلاب' : 'Students'}
              description={isRTL
                ? 'تعلّم الزراعة تفاعلياً — كل معادلة لها حاسبة مع أمثلة محلولة.'
                : 'Learn agronomy interactively — every formula has a calculator with worked examples.'}
              points={isRTL
                ? ['218 حاسبة', 'خطوة بخطوة', 'مسرد مدمج', 'متعدد اللغات']
                : ['218 calculators', 'Step-by-step', 'Glossary built-in', 'Multi-language']}
            />
            <UseCaseCard
              icon={Globe}
              color="#0891b2"
              title={isRTL ? 'الإرشاد الزراعي' : 'Extension agents'}
              description={isRTL
                ? 'أوصِ المزارعين بخطط في دقائق. صدّر PDF. زامن عبر YAML إلى Home Assistant.'
                : 'Recommend plans to farmers in minutes. Export PDFs. Sync via YAML to Home Assistant.'}
              points={isRTL
                ? ['تقارير PDF', 'ري YAML', 'متعدد المزارع', 'الأولوية لدون اتصال']
                : ['PDF reports', 'YAML irrigation', 'Multi-farm', 'Offline-first']}
            />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Testimonials */}
      {/* ================================================================== */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/30 mb-4">
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">⭐ {isRTL ? 'موثوق به من المزارعين حول العالم' : 'Trusted by growers worldwide'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">{isRTL ? 'محبوب من المجتمع' : 'Loved by the community'}</h2>
            <p className="text-sm text-muted-foreground">{isRTL ? 'قصص حقيقية من مزارعين وباحثين ومربّين يستخدمون أطلس المعادلات.' : 'Real stories from farmers, researchers, and educators using Formula Atlas.'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-xl border bg-card p-5 flex flex-col">
                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                {/* Quote */}
                <p className="text-sm text-foreground/90 leading-relaxed flex-1 mb-4">
                  &ldquo;{t.quote}&rdquo;
                </p>
                {/* Author */}
                <div className="flex items-center gap-2.5 pt-3 border-t">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: t.color }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-xs font-semibold">{t.name}</div>
                    <div className="text-[10px] text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Founder quote */}
      {/* ================================================================== */}
      <section id="founder" className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-300/50 bg-violet-50/50 dark:bg-violet-950/30 mb-6">
            <Microscope className="h-3 w-3 text-violet-600" />
            <span className="text-[11px] font-medium text-violet-700 dark:text-violet-300">{isRTL ? 'صمّمه باحث' : 'Built by a researcher'}</span>
          </div>
          <blockquote className="text-xl sm:text-2xl font-medium leading-relaxed mb-6">
            {isRTL
              ? '«كل مهمة وهدف ورؤية مسجّلة هنا تساهم في مهمتي بأن أكون باحثاً ومربّياً وقائداً أكثر فعالية في الزراعة.»'
              : '"Every task, goal, and insight captured here contributes to my mission of becoming a more effective researcher, educator, and leader in agriculture."'}
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-700 text-white flex items-center justify-center font-bold">
              AA
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm">{isRTL ? 'عبد القادر عطية' : 'Abdelkader Atia'}</div>
              <div className="text-xs text-muted-foreground">{isRTL ? 'باحث دكتوراه · الجزائر' : 'PhD Researcher · Algeria'}</div>
            </div>
          </div>
          <Link href="/about" className="inline-flex items-center gap-1.5 mt-6 text-sm text-muted-foreground hover:text-foreground">
            {isRTL ? 'اقرأ القصة كاملة' : 'Read the full story'} <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Final CTA */}
      {/* ================================================================== */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800 text-white p-10 sm:p-16 text-center relative overflow-hidden">
            {/* Decorative blurs */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-300/20 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl sm:text-5xl font-bold mb-4">{isRTL ? 'ابدأ بزراعة أذكى اليوم' : 'Start growing smarter today'}</h2>
              <p className="text-emerald-100 text-base sm:text-lg mb-8 max-w-xl mx-auto">
                {isRTL
                  ? 'مجاني للأبد. بدون تسجيل. يعمل دون اتصال. صُمّم للمزارعين والمهندسين الزراعيين والطلاب في المناطق القاحلة وشبه القاحلة.'
                  : 'Free forever. No signup. Works offline. Built for farmers, agronomists, and students in arid and semi-arid regions.'}
              </p>
              <Link href="/app" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-emerald-700 font-bold text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                <Play className="h-5 w-5" /> {isRTL ? 'افتح أطلس المعادلات' : 'Launch Formula Atlas'}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-xs text-emerald-100">
                <span className="flex items-center gap-1"><Check className="h-3 w-3" /> {isRTL ? `${FORMULA_COUNT} معادلة` : `${FORMULA_COUNT} formulas`}</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3" /> {isRTL ? `${FREE_TOOL_COUNT} حاسبة مجانية` : `${FREE_TOOL_COUNT} free calculators`}</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3" /> {isRTL ? '10 وكلاء ذكاء' : '10 AI agents'}</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3" /> {isRTL ? 'حزمة GIS' : 'GIS suite'}</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3" /> FAO-56 ET₀</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Footer */}
      {/* ================================================================== */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center">
              <Sprout className="h-3 w-3 text-white" />
            </div>
            <span>{isRTL ? 'أطلس المعادلات · صمّمه عبد القادر عطية' : 'Formula Atlas · Built by Abdelkader Atia'}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/app" className="hover:text-foreground">{isRTL ? 'افتح التطبيق' : 'Open App'}</Link>
            <Link href="/about" className="hover:text-foreground">{isRTL ? 'حول' : 'About'}</Link>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function StatCounter({ icon: Icon, value, suffix, label, color }: {
  icon: typeof BookOpen; value: number; suffix?: string; label: string; color: string;
}) {
  return (
    <div className="text-center">
      <div
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl mx-auto mb-2 flex items-center justify-center"
        style={{ backgroundColor: color + '20' }}
      >
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color }} />
      </div>
      <div className="text-2xl sm:text-4xl font-bold tracking-tight">
        <AnimatedCounter value={value} decimals={0} suffix={suffix} />
      </div>
      <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

// ============================================================================
// DashboardMockup — animated SVG/HTML preview of the app's dashboard.
// Shows a browser chrome + weather widget + ET₀ card + AI agents + tasks.
// ============================================================================

function DashboardMockup() {
  return (
    <div className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-muted/50">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="px-3 py-1 rounded-md bg-background text-[10px] text-muted-foreground font-mono flex items-center gap-1.5">
            <span className="text-emerald-600">●</span> formula-atlas.app/app
          </div>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="p-4 sm:p-5 space-y-3 bg-gradient-to-br from-emerald-50/30 to-cyan-50/20 dark:from-emerald-950/10 dark:to-cyan-950/10">
        {/* Welcome banner */}
        <div className="rounded-lg bg-gradient-to-r from-emerald-700 to-green-700 text-white p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-emerald-100 uppercase tracking-wide">Good morning</div>
            <div className="text-sm font-bold">Green Valley Farm 👋</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-emerald-100">Today's ET₀</div>
            <div className="text-lg font-bold font-mono">4.2 mm</div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Fields', value: '5', color: '#16a34a' },
            { label: 'Area', value: '12 ha', color: '#0891b2' },
            { label: 'Zones', value: '8', color: '#0ea5e9' },
            { label: 'Schedules', value: '14', color: '#8b5cf6' },
          ].map(s => (
            <div key={s.label} className="rounded-md border bg-background p-2" style={{ borderLeftWidth: 2, borderLeftColor: s.color }}>
              <div className="text-[8px] text-muted-foreground uppercase">{s.label}</div>
              <div className="text-xs font-bold font-mono">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Weather + tasks */}
        <div className="grid grid-cols-2 gap-2">
          {/* Weather */}
          <div className="rounded-lg border bg-background p-3">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <CloudRain className="h-2.5 w-2.5" /> Current Weather
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl">⛅</div>
              <div>
                <div className="text-lg font-bold leading-tight">22°C</div>
                <div className="text-[9px] text-muted-foreground">Partly cloudy</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 mt-2 pt-2 border-t">
              {[['Tue', '☀️', '24°'], ['Wed', '🌧️', '18°'], ['Thu', '⛅', '21°']].map(([d, e, t]) => (
                <div key={d} className="text-center">
                  <div className="text-[7px] text-muted-foreground">{d}</div>
                  <div className="text-sm">{e}</div>
                  <div className="text-[7px] font-mono">{t}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's tasks */}
          <div className="rounded-lg border bg-background p-3">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" /> Today's Tasks
            </div>
            <div className="space-y-1">
              {[
                { time: '06:00', task: 'Irrigate Field A', color: '#0ea5e9', priority: '!' },
                { time: '09:00', task: 'Fertilize tomatoes', color: '#16a34a' },
                { time: '14:00', task: 'Scout for pests', color: '#dc2626' },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[9px]">
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="font-mono text-muted-foreground">{t.time}</span>
                  <span className="flex-1 truncate">{t.task}</span>
                  {t.priority && <span className="text-rose-500 font-bold">{t.priority}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI agents strip */}
        <div className="rounded-lg border bg-background p-2.5 flex items-center gap-2">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide shrink-0">AI Agents</div>
          <div className="flex gap-1 flex-1">
            {['🌱', '🔍', '💧', '🧪', '📋', '💰', '🌿', '📝', '🗺️', '🐄'].map((e, i) => (
              <div key={i} className="w-6 h-6 rounded-md bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center text-xs">{e}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating badge — "Live demo" */}
      <div className="absolute top-12 right-3 sm:right-5 px-2 py-1 rounded-full bg-rose-500 text-white text-[9px] font-bold animate-pulse shadow-lg">
        ● LIVE
      </div>
    </div>
  );
}

// ============================================================================
// UseCaseCard — who is this for?
// ============================================================================

function UseCaseCard({ icon: Icon, color, title, description, points }: {
  icon: typeof Sprout;
  color: string;
  title: string;
  description: string;
  points: string[];
}) {
  return (
    <div className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow" style={{ borderTopWidth: 2, borderTopColor: color }}>
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
        style={{ backgroundColor: color + '20' }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <h3 className="font-bold text-sm mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{description}</p>
      <ul className="space-y-1">
        {points.map((p, i) => (
          <li key={i} className="flex items-center gap-1.5 text-[11px]">
            <Check className="h-3 w-3 shrink-0" style={{ color }} />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// Data
// ============================================================================

const FEATURE_TABS = [
  {
    id: 'gis',
    title: 'GIS Suite',
    subtitle: 'Coordinates, boundaries, distance, elevation',
    icon: MapPin,
    description: 'A complete geospatial toolkit — convert between DMS, decimal, and UTM. Import field boundaries from GeoJSON, KML, WKT, or CSV. Compute Vincenty geodesic distances with millimeter accuracy. Analyze elevation, slope, and aspect for frost-risk planning.',
    bullets: [
      'Vincenty inverse — mm-accuracy on WGS84 ellipsoid',
      'Field boundaries: GeoJSON · KML · WKT · CSV import + export',
      'Elevation API (free, no key) + slope + aspect + hillshade',
      'Point-in-polygon + nearest-edge distance',
    ],
    visual: (
      <div className="text-center">
        <MapPin className="h-12 w-12 text-emerald-600 mx-auto mb-2" />
        <div className="text-[10px] font-mono text-muted-foreground">37.77°N, 122.42°W</div>
        <div className="text-xs font-semibold mt-1">→ UTM Zone 10N</div>
        <div className="text-[10px] font-mono text-cyan-600 mt-0.5">551234 E, 4180345 N</div>
      </div>
    ),
  },
  {
    id: 'ai',
    title: 'AI Specialists',
    subtitle: '10 agents — Agronomist, Scout, Vet, GIS, …',
    icon: Sparkles,
    description: 'A team of AI specialists at your fingertips. Each agent has its own expertise, voice, and behavior — ask the Crop Scout about pests, the Irrigation Engineer about pump sizing, or the Soil Scientist about your latest lab results.',
    bullets: [
      '10 specialized agents (Agronomist, Scout, Vet, GIS, Grant Writer…)',
      'Per-agent conversation history, persisted locally',
      'Sample questions to guide each specialist',
      'Powered by z-ai-web-dev-sdk',
    ],
    visual: (
      <div className="flex flex-wrap justify-center gap-1.5">
        {['🌱', '🔍', '💧', '🧪', '📋', '💰', '🌿', '📝', '🗺️', '🐄'].map((e, i) => (
          <div key={i} className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center text-lg">{e}</div>
        ))}
      </div>
    ),
  },
  {
    id: 'irrigation',
    title: 'Irrigation Engine',
    subtitle: 'ET₀, scheduling, YAML export, cycle-and-soak',
    icon: Droplets,
    description: 'FAO-56 Penman-Monteith ET₀ from free Open-Meteo data (no API key). Design controllers, zones, schedules, and sequences. Export to YAML for Home Assistant. Cycle-and-soak for clay soils. Weather-adjustment slider.',
    bullets: [
      'Live ET₀ + Kc × ETc + 7-day irrigation plan',
      'Controllers → Zones → Schedules → Sequences',
      'YAML export (Irrigation Unlimited compatible)',
      'Eco-mode cycle-and-soak + weather % adjust',
    ],
    visual: (
      <div className="text-center">
        <Droplets className="h-12 w-12 text-cyan-600 mx-auto mb-2" />
        <div className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">4.2<span className="text-sm">mm</span></div>
        <div className="text-[10px] text-muted-foreground">Today&apos;s ET₀ (FAO-56)</div>
      </div>
    ),
  },
  {
    id: 'crops',
    title: 'Crop Lifecycle',
    subtitle: '20 crops · fertilization + labor schedules',
    icon: Sprout,
    description: 'Pick a crop — get a complete week-by-week plan. Fertilization schedule with NPK + micronutrients per growth stage. Labor calendar with person-days/ha estimates and peak-week detection. All based on FAO-56 + extension service data.',
    bullets: [
      '20 crops: maize, wheat, rice, tomato, potato, coffee, citrus, …',
      'Per-stage NPK + Ca/Mg/S + B/Zn/Mn/Fe with source materials',
      'Labor operations: 10 types, 3 priority levels, 3 skill levels',
      'PDF export for both fertilization + labor',
    ],
    visual: (
      <div className="grid grid-cols-4 gap-1">
        {['🌽', '🌾', '🍅', '🥔', '☕', '🍊', '🍇', '🥬'].map((e, i) => (
          <div key={i} className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-lg">{e}</div>
        ))}
      </div>
    ),
  },
];

const ALL_TOOLS = [
  { name: 'Coordinate Converter', desc: 'DMS ↔ Decimal · UTM', icon: MapPin, color: '#6366f1' },
  { name: 'Field Boundary', desc: 'GeoJSON · KML · WKT', icon: Layers, color: '#10b981' },
  { name: 'Distance & Bearing', desc: 'Vincenty geodesic', icon: Compass, color: '#0891b2' },
  { name: 'Elevation & Slope', desc: 'Aspect · Hillshade', icon: Mountain, color: '#78716c' },
  { name: 'ET Tracker', desc: 'FAO-56 Penman-Monteith', icon: Sun, color: '#0891b2' },
  { name: 'Irrigation Scheduler', desc: 'YAML export', icon: Clock, color: '#0ea5e9' },
  { name: 'Fertilization Gen', desc: '20 crops · NPK stages', icon: Beaker, color: '#16a34a' },
  { name: 'Labor Calendar', desc: 'Person-days/ha', icon: Users, color: '#0891b2' },
  { name: 'AI Specialists', desc: '10 agents', icon: Sparkles, color: '#6366f1' },
  { name: 'NDVI Maps', desc: 'Vegetation heatmap', icon: Satellite, color: '#6366f1' },
  { name: 'Weather Radar', desc: 'Frost · Heat · Spray', icon: CloudRain, color: '#0ea5e9' },
  { name: 'Smart Agriculture', desc: 'Disease detection', icon: Bug, color: '#65a30d' },
  { name: 'Soil Test Tracker', desc: 'Multi-year trends', icon: Beaker, color: '#8b5cf6' },
  { name: 'Livestock Mgmt', desc: 'NRC 2021 rations', icon: Sprout, color: '#f59e0b' },
  { name: 'Financial Dashboard', desc: 'ROI · Breakeven', icon: DollarSign, color: '#f59e0b' },
  { name: 'Sustainability', desc: '5-pillar scorecard', icon: Leaf, color: '#16a34a' },
  { name: 'Crop Rotation', desc: 'N credit · Disease breaks', icon: Sprout, color: '#16a34a' },
  { name: 'Yield Gap', desc: 'Benchmark vs potential', icon: TrendingUp, color: '#0891b2' },
  { name: 'Report Generator', desc: 'Branded PDF', icon: FileText, color: '#0ea5e9' },
  { name: 'Marketplace', desc: 'Fertilizer prices', icon: DollarSign, color: '#f59e0b' },
];

const TESTIMONIALS = [
  {
    quote: 'Finally an app that takes irrigation scheduling seriously. The YAML export dropped straight into my Home Assistant setup — my drip system runs itself now.',
    name: 'Karim B.',
    role: 'Tomato grower · Tunisia',
    initials: 'KB',
    color: '#16a34a',
  },
  {
    quote: 'As a PhD student in agronomy, I use the FAO-56 ET₀ calculator daily. The math matches the textbook examples exactly. Huge time-saver for my thesis work.',
    name: 'Maria S.',
    role: 'PhD Researcher · Brazil',
    initials: 'MS',
    color: '#6366f1',
  },
  {
    quote: 'I teach extension agents in rural Algeria. Formula Atlas lets me show farmers a complete fertilizer plan in 2 minutes — they can see the numbers, not just hear advice.',
    name: 'Yacine R.',
    role: 'Extension educator · Algeria',
    initials: 'YR',
    color: '#f59e0b',
  },
];
