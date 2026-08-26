'use client';

/**
 * Marketing landing page for Formula Atlas.
 *
 * Route: / (landing page)
 *
 * High-craft, animated, interactive landing page:
 *   - Motion floating telemetry chips around hero with organic physics
 *   - Infinite animated formula & tool marquee ribbon
 *   - Living dashboard preview with animated sensor feeds & flow wave
 *   - Interactive Quick-Estimate Crop Simulator with live dials
 *   - Dynamic feature showcase with animated canvases & AnimatePresence transitions
 *   - Staggered scroll entrance animations on all cards & tools
 *   - Fast navigation to /app and /about
 */

import Link from 'next/link';
import { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sprout, Sparkles, MapPin, Droplets, Clock, Beaker, Mountain, Compass,
  Layers, BookOpen, Calculator, CloudRain, Satellite, Bug, DollarSign,
  Leaf, Users, FileText, ArrowRight, Play, Check, Zap, Sun, TrendingUp,
  ChevronRight, Microscope, Globe, Activity, Wind, Gauge, ShieldAlert,
  Flame, Sliders, Waves,
} from 'lucide-react';
import { AnimatedCounter } from '@/components/agri/nutri-tools/AnimatedCounter';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTranslation, copyFor } from '@/lib/language-store';
import { CALCULATOR_COUNT, FORMULA_COUNT, FREE_TOOL_COUNT, INTERACTIVE_TOOL_COUNT } from '@/lib/catalog-stats';
import { WhatWeOfferSection } from '@/components/agri/what-we-offer-section';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const { isRTL, language } = useTranslation();

  // Scroll listener for sticky navbar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-rotate the active feature tab every 5s if user isn't hovering
  useEffect(() => {
    const t = setInterval(() => setActiveFeature(f => (f + 1) % FEATURE_TABS.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden text-foreground selection:bg-emerald-500/20 selection:text-emerald-900 dark:selection:text-emerald-100">
      {/* ================================================================== */}
      {/* Sticky nav with blur */}
      {/* ================================================================== */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-background/90 backdrop-blur-md border-b border-border/60 shadow-sm py-2.5'
            : 'bg-transparent py-4'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-500/20"
            >
              <Sprout className="h-4 w-4 text-white" />
            </motion.div>
            <div>
              <span className="font-bold text-base tracking-tight group-hover:text-emerald-600 transition-colors">Formula Atlas</span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">v3.5</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-5 text-xs font-medium">
            <a href="#offer" className="text-foreground font-semibold hover:text-emerald-600 transition-colors flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{copyFor(language, 'What We Offer', 'ماذا نقدم', 'Ce que nous offrons')}</span>
            </a>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">{copyFor(language, 'Features', 'المميزات', 'Fonctionnalités')}</a>
            <a href="#simulator" className="text-muted-foreground hover:text-foreground transition-colors">{copyFor(language, 'Simulator', 'المحاكي', 'Simulateur')}</a>
            <a href="#tools" className="text-muted-foreground hover:text-foreground transition-colors">{copyFor(language, 'Calculators', 'الحاسبات', 'Calculateurs')}</a>
            <a href="#stats" className="text-muted-foreground hover:text-foreground transition-colors">{copyFor(language, 'Stats', 'الإحصائيات', 'Statistiques')}</a>
            <a href="#founder" className="text-muted-foreground hover:text-foreground transition-colors">{copyFor(language, 'Founder', 'المؤسس', 'Fondateur')}</a>
            <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">{copyFor(language, 'About', 'عن المنصة', 'À propos')}</Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <ThemeToggle />
            <Link
              href="/app"
              className="group flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-700/20 hover:shadow-lg hover:shadow-emerald-700/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>{isRTL ? 'فتح المنصة' : 'Launch App'}</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ================================================================== */}
      {/* Hero Section with Parallax, Floating Telemetry & Living Mockup */}
      {/* ================================================================== */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        {/* Animated fluid gradient ambient orbs */}
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              x: [0, 30, 0],
              y: [0, -20, 0],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-10 left-1/4 w-[450px] h-[450px] bg-emerald-400/15 dark:bg-emerald-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              x: [0, -40, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-400/15 dark:bg-cyan-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              x: [0, 20, 0],
              y: [0, 40, 0],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute bottom-10 left-1/3 w-[500px] h-[500px] bg-teal-400/10 dark:bg-emerald-600/10 rounded-full blur-3xl"
          />
          {/* Subtle animated grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative">
          {/* Badge with glowing pulse */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-400/30 bg-emerald-50/70 dark:bg-emerald-950/40 backdrop-blur-sm mb-6 shadow-sm"
          >
            <motion.span
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </motion.span>
            <span className="text-[11px] sm:text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              {isRTL ? 'منصة زراعية بالذكاء الاصطناعي · مجانية ومفتوحة للأبد' : 'AI-Powered Agronomy Operating System · Free & Offline-First'}
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6"
          >
            {isRTL ? (
              <>
                من <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">التربة</span> إلى <span className="bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 bg-clip-text text-transparent">السماء</span>،
                <br /><span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-green-700 bg-clip-text text-transparent">نظام تشغيل</span> مزرعتك المتكامل.
              </>
            ) : (
              <>
                From <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">soil</span> to <span className="bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 bg-clip-text text-transparent">sky</span>,
                <br />your farm&apos;s intelligent <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-green-700 bg-clip-text text-transparent">operating system</span>.
              </>
            )}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            {isRTL
              ? `${FORMULA_COUNT} معادلة زراعية معتمدة. ${FREE_TOOL_COUNT} حاسبة ميدانية فورية. نظم معلومات جغرافية، وكلاء ذكاء اصطناعي، وجدولة ري وفق FAO-56. مصممة للباحثين والمزارعين والمهندسين الزراعيين.`
              : `${FORMULA_COUNT} peer-reviewed agronomic formulas. ${FREE_TOOL_COUNT} field-ready calculators. GIS boundary mapping, AI specialists, and FAO-56 ET₀ scheduling — engineered for researchers, agronomists, and growers.`}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-12"
          >
            <Link
              href="/app"
              className="group flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 text-white font-semibold text-sm sm:text-base shadow-lg shadow-emerald-700/25 hover:shadow-xl hover:shadow-emerald-700/35 hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>{isRTL ? 'افتح المنصة مباشرة' : 'Launch Formula Atlas'}</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#simulator"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-border/80 bg-background/80 hover:bg-muted/60 font-semibold text-sm backdrop-blur-sm hover:border-emerald-500/40 transition-all hover:scale-[1.02]"
            >
              <Sliders className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isRTL ? 'جرّب المحاكي التفاعلي' : 'Try Live Simulator'}</span>
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> {isRTL ? 'بدون تسجيل حساب' : 'Zero signup required'}</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> {isRTL ? 'يعمل دون اتصال (PWA)' : 'Works 100% offline (PWA)'}</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> {isRTL ? 'بيانات FAO-56 و Open-Meteo' : 'FAO-56 & Open-Meteo validated'}</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> {isRTL ? 'عربي / English / Français' : 'Multi-language support'}</span>
          </motion.div>

          {/* ================================================================ */}
          {/* Dashboard Preview with Floating Animated Telemetry Chips */}
          {/* ================================================================ */}
          <div className="mt-14 sm:mt-18 relative max-w-4xl mx-auto">
            {/* Glowing background halo */}
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-teal-500/20 rounded-3xl blur-2xl opacity-75 animate-pulse" />

            {/* Floating Telemetry Chip 1: Top-Left (ET₀ Real-Time) */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                x: [0, 4, 0],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="hidden md:flex absolute -top-6 -left-8 z-20 items-center gap-2 px-3 py-2 rounded-xl bg-card/90 border border-border/80 shadow-lg backdrop-blur-md text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center">
                <Droplets className="h-4 w-4 animate-bounce" style={{ animationDuration: '2.5s' }} />
              </div>
              <div>
                <div className="text-[9px] text-muted-foreground uppercase font-semibold">FAO-56 ET₀ Today</div>
                <div className="text-xs font-bold font-mono text-cyan-600 dark:text-cyan-400">4.2 mm/day · Optimal</div>
              </div>
            </motion.div>

            {/* Floating Telemetry Chip 2: Top-Right (NDVI Satellite) */}
            <motion.div
              animate={{
                y: [0, 8, 0],
                x: [0, -5, 0],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="hidden md:flex absolute -top-6 -right-8 z-20 items-center gap-2 px-3 py-2 rounded-xl bg-card/90 border border-border/80 shadow-lg backdrop-blur-md text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <Satellite className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[9px] text-muted-foreground uppercase font-semibold">Sentinel-2 NDVI</div>
                <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">0.84 · Healthy Canopy</div>
              </div>
            </motion.div>

            {/* Floating Telemetry Chip 3: Bottom-Left (Wind Spray Window) */}
            <motion.div
              animate={{
                y: [0, 9, 0],
                x: [0, 6, 0],
              }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="hidden lg:flex absolute -bottom-6 -left-6 z-20 items-center gap-2 px-3 py-2 rounded-xl bg-card/90 border border-border/80 shadow-lg backdrop-blur-md text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <Wind className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[9px] text-muted-foreground uppercase font-semibold">Spray Window</div>
                <div className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400">8 km/h · Drift Safe</div>
              </div>
            </motion.div>

            {/* Floating Telemetry Chip 4: Bottom-Right (Soil Temp & pH) */}
            <motion.div
              animate={{
                y: [0, -8, 0],
                x: [0, -4, 0],
              }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
              className="hidden lg:flex absolute -bottom-6 -right-6 z-20 items-center gap-2 px-3 py-2 rounded-xl bg-card/90 border border-border/80 shadow-lg backdrop-blur-md text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[9px] text-muted-foreground uppercase font-semibold">Soil Status</div>
                <div className="text-xs font-bold font-mono text-teal-600 dark:text-teal-400">pH 6.8 · Temp 19.4°C</div>
              </div>
            </motion.div>

            {/* Live Interactive Mockup Frame */}
            <LivingDashboardMockup />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Infinite Moving Formula & Tool Ribbon Marquee */}
      {/* ================================================================== */}
      <section className="py-4 border-y border-border/60 bg-muted/40 overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-muted/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-muted/80 to-transparent z-10 pointer-events-none" />

        <div className="flex select-none">
          <motion.div
            animate={{ x: isRTL ? ['0%', '50%'] : ['0%', '-50%'] }}
            transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
            className="flex items-center gap-4 whitespace-nowrap"
          >
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-border/70 bg-card/80 text-xs font-medium backdrop-blur-sm hover:border-emerald-500/50 transition-colors"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="font-semibold text-foreground/90">{item.title}</span>
                <span className="text-[10px] text-muted-foreground font-mono">[{item.code}]</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Live Animated Stats Section */}
      {/* ================================================================== */}
      <section id="stats" className="py-14 border-b bg-gradient-to-r from-emerald-50/40 via-cyan-50/20 to-teal-50/40 dark:from-emerald-950/15 dark:via-cyan-950/10 dark:to-teal-950/15">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            <StatCounter icon={BookOpen} value={FORMULA_COUNT} label={isRTL ? 'معادلة زراعية موثقة' : 'Agronomic formulas'} color="#f59e0b" delay={0.1} />
            <StatCounter icon={Calculator} value={INTERACTIVE_TOOL_COUNT} label={isRTL ? 'أداة وحاسبة تفاعلية' : 'Interactive calculators'} color="#0891b2" delay={0.2} />
            <StatCounter icon={Sparkles} value={10} label={isRTL ? 'وكلاء ذكاء متخصصين' : 'Specialized AI agents'} color="#10b981" delay={0.3} />
            <StatCounter icon={Sprout} value={39} label={isRTL ? 'ملف تسميد ومحصول' : 'Crop & Fertial profiles'} color="#16a34a" delay={0.4} />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* What We Offer — Problems Solved, Direct Gains & Unique Superpowers */}
      {/* ================================================================== */}
      <WhatWeOfferSection language={language} isRTL={isRTL} />

      {/* ================================================================== */}
      {/* Interactive Live Crop & Irrigation Simulator Sandbox */}
      {/* ================================================================== */}
      <section id="simulator" className="py-20 sm:py-28 bg-muted/20 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-300/40 bg-emerald-50/50 dark:bg-emerald-950/30 text-xs text-emerald-700 dark:text-emerald-300 mb-3">
              <Sliders className="h-3.5 w-3.5" />
              <span>{isRTL ? 'تجربة حية فورية' : 'Live Interactive Micro-Simulator'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              {isRTL ? (
                <>شاهد الرياضيات الزراعية <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">تتحرك في الوقت الفعلي</span></>
              ) : (
                <>Experience Agronomic Math <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">in Real-Time</span></>
              )}
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              {isRTL
                ? 'غيّر المساحة والمحصول ولاحظ كيف تحسب محركاتنا الاحتياج المائي الفوري، التسميد، وتوقعات العائد المالي لحظياً.'
                : 'Adjust field area and select a crop to watch our deterministic engines compute live water demand, nutrient budgets, and break-even targets.'}
            </p>
          </div>

          <InteractiveLiveSimulator isRTL={isRTL} />
        </div>
      </section>

      {/* ================================================================== */}
      {/* Dynamic Animated Feature Showcase */}
      {/* ================================================================== */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/50 text-xs text-muted-foreground mb-4">
              <Zap className="h-3.5 w-3.5 text-emerald-600" />
              <span>{isRTL ? 'سير عمل متكامل 360°' : 'Complete 360° Agronomic Suite'}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
              {isRTL ? (
                <>منصة واحدة، <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">كل دورة الإنتاج</span></>
              ) : (
                <>One platform, <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">every field workflow</span></>
              )}
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              {isRTL
                ? 'من استيراد حدود الحقل ونظم GIS، إلى التنبؤ بالأمراض الفطرية، حساب جرعات الرش، وحساب نقطة التعادل بالدينار الجزائري.'
                : 'From GIS boundary analysis to fungal disease modeling, spray backpack mixing, and DZD/kg farm break-even economics.'}
            </p>
          </div>

          {/* Feature interactive tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {FEATURE_TABS.map((tab, i) => {
              const Icon = tab.icon;
              const active = i === activeFeature;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ y: -4, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveFeature(i)}
                  className={`text-left rounded-xl border-2 p-5 transition-all relative overflow-hidden ${
                    active
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/25 shadow-md shadow-emerald-500/10'
                      : 'border-border/80 bg-card hover:border-muted-foreground/40'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeFeatureBar"
                      className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600"
                    />
                  )}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                      active ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-sm' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm mb-1">{tab.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tab.subtitle}</p>
                </motion.button>
              );
            })}
          </div>

          {/* Active feature detail with smooth AnimatePresence transition */}
          <div className="rounded-2xl border bg-card p-6 sm:p-10 shadow-sm relative min-h-[340px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-3.5">
                    {(() => {
                      const Icon = FEATURE_TABS[activeFeature].icon;
                      return (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-sm">
                          <Icon className="h-5 w-5" />
                        </div>
                      );
                    })()}
                    <h3 className="text-xl font-bold">{FEATURE_TABS[activeFeature].title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{FEATURE_TABS[activeFeature].description}</p>
                  <ul className="space-y-2.5 mb-6">
                    {FEATURE_TABS[activeFeature].bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/app"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-105"
                  >
                    <span>{isRTL ? 'استكشف في التطبيق' : 'Explore in Workspace'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Interactive visual canvas for the active tab */}
                <div className="rounded-xl border border-border/80 bg-muted/20 p-6 flex items-center justify-center min-h-[220px] overflow-hidden relative">
                  {FEATURE_TABS[activeFeature].visual}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Feature Grid — All Tools with Hover Elevation */}
      {/* ================================================================== */}
      <section id="tools" className="py-20 bg-muted/20 border-y">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              {isRTL ? `${FREE_TOOL_COUNT} حاسبة متخصصة بدون احتكاك` : `${FREE_TOOL_COUNT} field-ready calculators, zero friction`}
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              {isRTL
                ? 'اضغط ⌘K من أي مكان في المنصة للوصول لأي حاسبة أو صيغة في أجزاء من الثانية.'
                : 'Instant calculation across soil physics, hydraulics, plant protection, and farm business.'}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {ALL_TOOLS.map((tool, idx) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.name}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: (idx % 8) * 0.05 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group rounded-xl border bg-card p-4 hover:shadow-md hover:border-emerald-500/30 transition-all cursor-pointer"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: tool.color + '20' }}
                  >
                    <Icon className="h-4 w-4" style={{ color: tool.color }} />
                  </div>
                  <div className="text-xs font-semibold leading-tight group-hover:text-emerald-600 transition-colors">{tool.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 leading-snug">{tool.desc}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Use Cases with Smooth Reveal */}
      {/* ================================================================== */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">{isRTL ? 'مصمّم لكل فاعل في القطاع الزراعي' : 'Engineered for everyone in agriculture'}</h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">{isRTL ? 'من المزارع الميداني إلى باحث الدكتوراه — يتكيف أطلس المعادلات مع احتياجاتك بدقة.' : 'From the smallholder grower to the agronomist and doctoral researcher.'}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <UseCaseCard
              icon={Sprout}
              color="#16a34a"
              title={isRTL ? 'المزارعون والمستثمرون' : 'Farmers & Growers'}
              description={isRTL
                ? 'خطط للري بالدقيقة، جدول خلطات الرش ومواعيد الأمان DAR، واحسب تكلفة الإنتاج بالهكتار.'
                : 'Plan irrigation minutes, calculate tank spray mixes with DAR safety, and track break-even per hectare.'}
              points={isRTL
                ? ['مجاني للأبد', 'يعمل على الهاتف دون إنترنت', 'حاسبة خلطات الرش WALES', 'تنبيهات فورية']
                : ['Free forever', 'Offline phone ready', 'WALES spray calculator', 'Drift & heat alerts']}
            />
            <UseCaseCard
              icon={Microscope}
              color="#6366f1"
              title={isRTL ? 'الباحثون والمهندسون' : 'Researchers & Agronomists'}
              description={isRTL
                ? `${FORMULA_COUNT} معادلة موثقة بالمراجع، رياضيات Penman-Monteith الكاملة، وتصدير البيانات.`
                : `${FORMULA_COUNT} formulas with literature citations, FAO-56 math steps, and CSV/JSON export.`}
              points={isRTL
                ? ['FAO-56 + فينسنتي للجيوديسيا', 'جاهز للاستشهاد العلمي', 'تصدير للتقارير والأبحاث', 'معايرة النماذج']
                : ['FAO-56 + Vincenty Geodesy', 'Citation-ready formulas', 'CSV/JSON raw export', 'Model calibration']}
            />
            <UseCaseCard
              icon={Users}
              color="#f59e0b"
              title={isRTL ? 'الطلاب والجامعات' : 'Agronomy Students'}
              description={isRTL
                ? 'تعلم الفيزياء الزراعية والكيمياء الحيوية عملياً — كل معادلة مزودة بحاسبة وأمثلة محلولة خطوة بخطوة.'
                : 'Learn agronomy interactively — every formula has dynamic inputs and worked numerical examples.'}
              points={isRTL
                ? [`${CALCULATOR_COUNT} حاسبة تفاعلية`, 'خطوات حل مفصلة', 'مسرد مصطلحات ثلاثي اللغات', 'مفاهيم التسميد']
                : [`${CALCULATOR_COUNT} calculators`, 'Step-by-step math', 'Trilingual glossary', 'Soil chemistry visuals']}
            />
            <UseCaseCard
              icon={Globe}
              color="#0891b2"
              title={isRTL ? 'الإرشاد والمكاتب التقنية' : 'Extension Services'}
              description={isRTL
                ? 'أصدر توصيات تسميد وحماية فورية للمزارعين. ولّد ملفات تقارير PDF احترافية وزامن مع الأجهزة الذكية.'
                : 'Deliver fast fertigation and crop protection prescriptions. Export PDF sheets and YAML schedules.'}
              points={isRTL
                ? ['تقارير استشارية PDF', 'جدولة ري YAML', 'إدارة متعددة المزارع', 'تتبع الأمراض INPV']
                : ['Branded PDF reports', 'Home Assistant YAML', 'Multi-field twin', 'INPV disease tracking']}
            />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Testimonials */}
      {/* ================================================================== */}
      <section className="py-20 sm:py-28 border-t bg-muted/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/30 mb-4">
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">⭐ {isRTL ? 'موثوق من مهندسين ومزارعين عبر الوطن العربي والمتوسط' : 'Trusted by growers and researchers across the Mediterranean'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">{isRTL ? 'شهادات من الميدان' : 'Voices from the Field'}</h2>
            <p className="text-sm text-muted-foreground">{isRTL ? 'تجارب حقيقية من مزارعين وخبراء يستخدمون المنصة يومياً.' : 'Real feedback from growers and agronomists using Formula Atlas daily.'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border bg-card p-6 flex flex-col shadow-sm"
              >
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed flex-1 mb-5 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                    style={{ backgroundColor: t.color }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-xs font-semibold">{t.name}</div>
                    <div className="text-[11px] text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Founder Quote */}
      {/* ================================================================== */}
      <section id="founder" className="py-20 sm:py-28 border-t">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-300/50 bg-teal-50/50 dark:bg-teal-950/30 mb-6">
            <Microscope className="h-3.5 w-3.5 text-teal-600" />
            <span className="text-[11px] font-medium text-teal-700 dark:text-teal-300">{isRTL ? 'رؤية بحثية وميدانية' : 'Built by an Agronomy Researcher'}</span>
          </div>
          <blockquote className="text-xl sm:text-2xl font-medium leading-relaxed mb-8 text-foreground/90">
            {isRTL
              ? '«كل معادلة وهدف وخوارزمية مسجلة هنا تساهم في مهمتنا لتمكين الفلاح والمهندس الزراعي من اتخاذ القرار الدقيق المبني على العلم والبيانات.»'
              : '"Every formula, metric, and decision rule captured here contributes to our mission of empowering farmers and researchers with precision science."'}
          </blockquote>
          <div className="flex items-center justify-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-md">
              AA
            </div>
            <div className="text-left">
              <div className="font-bold text-sm">{isRTL ? 'عبد القادر عطية' : 'Abdelkader Atia'}</div>
              <div className="text-xs text-muted-foreground">{isRTL ? 'باحث دكتوراه في العلوم الفلاحية · الجزائر' : 'PhD Researcher in Agronomy · Algeria'}</div>
            </div>
          </div>
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 mt-6 text-xs sm:text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <span>{isRTL ? 'اقرأ القصة وخارطة الطريق الكاملة' : 'Read full story & interactive roadmap'}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Final Call to Action */}
      {/* ================================================================== */}
      <section className="py-20 sm:py-28 border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800 text-white p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl">
            {/* Animated background bubbles */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute -top-10 -left-10 w-72 h-72 bg-white rounded-full blur-3xl"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.35, 0.2] }}
              transition={{ duration: 10, repeat: Infinity, delay: 1 }}
              className="absolute -bottom-10 -right-10 w-72 h-72 bg-cyan-300 rounded-full blur-3xl"
            />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-5xl font-extrabold mb-4">{isRTL ? 'ابدأ بالزراعة الذكية اليوم' : 'Start Growing Smarter Today'}</h2>
              <p className="text-emerald-100 text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
                {isRTL
                  ? 'مجاني للأبد. بدون تسجيل. يعمل دون اتصال بالإنترنت. صُمّم خصيصاً لمزارعي ومهندسي المناطق القاحلة وشبه القاحلة.'
                  : '100% free and open. No credit card, no sign-up. Works fully offline in the field.'}
              </p>
              <Link
                href="/app"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-white text-emerald-800 font-bold text-base shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all"
              >
                <Play className="h-5 w-5 fill-emerald-800" />
                <span>{isRTL ? 'افتح أطلس المعادلات الآن' : 'Launch Formula Atlas Now'}</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-xs text-emerald-100/90 font-medium">
                <span className="flex items-center gap-1"><Check className="h-3 w-3" /> {FORMULA_COUNT} {isRTL ? 'معادلة' : 'Formulas'}</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3" /> {FREE_TOOL_COUNT} {isRTL ? 'حاسبة مجانية' : 'Free Tools'}</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3" /> 10 {isRTL ? 'وكلاء ذكاء' : 'AI Agents'}</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3" /> FAO-56 ET₀</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Footer */}
      {/* ================================================================== */}
      <footer className="border-t py-8 bg-card/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center">
              <Sprout className="h-3.5 w-3.5 text-white" />
            </div>
            <span>{isRTL ? 'أطلس المعادلات الفلاحية · صممه عبد القادر عطية' : 'Formula Atlas · Developed by Abdelkader Atia'}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/app" className="hover:text-foreground transition-colors">{isRTL ? 'فتح التطبيق' : 'Open Workspace'}</Link>
            <Link href="/about" className="hover:text-foreground transition-colors">{isRTL ? 'حول المنصة' : 'About & Roadmap'}</Link>
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

function StatCounter({ icon: Icon, value, suffix, label, color, delay = 0 }: {
  icon: typeof BookOpen; value: number; suffix?: string; label: string; color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="text-center"
    >
      <div
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl mx-auto mb-2.5 flex items-center justify-center shadow-sm"
        style={{ backgroundColor: color + '20' }}
      >
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color }} />
      </div>
      <div className="text-2xl sm:text-4xl font-extrabold tracking-tight font-mono">
        <AnimatedCounter value={value} decimals={0} suffix={suffix} />
      </div>
      <div className="text-[10px] sm:text-xs text-muted-foreground uppercase font-semibold tracking-wide mt-1">{label}</div>
    </motion.div>
  );
}

// ============================================================================
// Living Dashboard Mockup — Interactive, animated dashboard canvas
// ============================================================================

function LivingDashboardMockup() {
  const [activeAgentIdx, setActiveAgentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveAgentIdx(i => (i + 1) % 10);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative rounded-2xl border border-border/90 bg-card shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Browser chrome header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-muted/60 backdrop-blur-md">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="px-3 py-1 rounded-md bg-background/80 border border-border/50 text-[10px] text-muted-foreground font-mono flex items-center gap-2 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-foreground font-medium">formula-atlas.app/app/dashboard</span>
          </div>
        </div>
        <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold hidden sm:block">
          ● LIVE SENSORS
        </div>
      </div>

      {/* Living dashboard body */}
      <div className="p-4 sm:p-5 space-y-3 bg-gradient-to-br from-emerald-50/20 via-background to-teal-50/20 dark:from-emerald-950/10 dark:via-background dark:to-teal-950/10">
        {/* Welcome & Flow banner */}
        <div className="rounded-xl bg-gradient-to-r from-emerald-700 via-green-700 to-teal-800 text-white p-3.5 flex items-center justify-between shadow-md relative overflow-hidden">
          {/* Subtle animated water ripple wave in background */}
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent w-full pointer-events-none"
          />

          <div className="relative z-10 text-left">
            <div className="text-[10px] text-emerald-200 uppercase tracking-wider font-semibold">Live Field Station</div>
            <div className="text-sm sm:text-base font-bold flex items-center gap-1.5">
              <span>Mitidja Valley Sector 4</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
          <div className="relative z-10 text-right">
            <div className="text-[10px] text-emerald-200 uppercase font-semibold">Active Irrigation Flow</div>
            <div className="text-sm sm:text-lg font-bold font-mono text-cyan-200">18.4 m³/h · 2.8 bar</div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Fields', value: '6 Plots', color: '#16a34a' },
            { label: 'Total Area', value: '14.5 ha', color: '#0891b2' },
            { label: 'Drip Zones', value: '8 Active', color: '#0ea5e9' },
            { label: 'Daily ETc', value: '4.8 mm', color: '#10b981' },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-lg border bg-background/90 p-2 text-left hover:border-emerald-500/40 transition-colors"
              style={{ borderLeftWidth: 3, borderLeftColor: s.color }}
            >
              <div className="text-[8px] text-muted-foreground uppercase font-bold">{s.label}</div>
              <div className="text-xs font-bold font-mono mt-0.5">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Weather & Active Schedule */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Weather & ET₀ gauge */}
          <div className="rounded-xl border bg-background/90 p-3 text-left">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1 font-semibold"><CloudRain className="h-3 w-3 text-cyan-600" /> Weather & ET₀</span>
              <span className="text-[9px] text-emerald-600 font-mono">Open-Meteo Synced</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-2xl"
                >
                  ⛅
                </motion.div>
                <div>
                  <div className="text-base font-bold leading-tight font-mono">24.2°C · 48% RH</div>
                  <div className="text-[9px] text-muted-foreground">Wind: 7 km/h NNE · No Drift</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[8px] text-muted-foreground uppercase font-bold">Today ET₀</div>
                <div className="text-sm font-bold font-mono text-cyan-600 dark:text-cyan-400">4.20 mm</div>
              </div>
            </div>
          </div>

          {/* Today's Tasks */}
          <div className="rounded-xl border bg-background/90 p-3 text-left">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1 font-semibold"><Clock className="h-3 w-3 text-emerald-600" /> Scheduled Operations</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium">Automatic</span>
            </div>
            <div className="space-y-1.5">
              {[
                { time: '06:00', task: 'Zone A - Drip Fertigation (Solu-Potash)', status: 'Done', color: '#16a34a' },
                { time: '11:00', task: 'Zone B - Cycle & Soak Drip 45m', status: 'Running', color: '#0ea5e9' },
                { time: '17:30', task: 'Potato Field 3 - INPV Blight Check', status: 'Pending', color: '#f59e0b' },
              ].map((t, i) => (
                <div key={i} className="flex items-center justify-between text-[9px] gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="font-mono text-muted-foreground">{t.time}</span>
                    <span className="truncate">{t.task}</span>
                  </div>
                  <span className="font-medium text-[8px] uppercase tracking-wider shrink-0" style={{ color: t.color }}>{t.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Agents Strip with Animated Spotlight Highlight */}
        <div className="rounded-xl border bg-background/90 p-2.5 flex items-center gap-2 text-left">
          <div className="text-[9px] text-muted-foreground uppercase font-bold shrink-0">10 AI Agents:</div>
          <div className="flex gap-1.5 flex-1 overflow-x-auto py-0.5">
            {AGENTS_LIST.map((agent, i) => {
              const isActive = i === activeAgentIdx;
              return (
                <motion.div
                  key={i}
                  animate={isActive ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400'
                      : 'bg-muted/80 hover:bg-muted text-muted-foreground'
                  }`}
                  title={agent.name}
                >
                  {agent.emoji}
                </motion.div>
              );
            })}
          </div>
          <div className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0 font-mono hidden sm:block">
            {AGENTS_LIST[activeAgentIdx].name}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Interactive Live Crop Simulator Component
// ============================================================================

function InteractiveLiveSimulator({ isRTL }: { isRTL: boolean }) {
  const [selectedCrop, setSelectedCrop] = useState('tomato');
  const [areaHa, setAreaHa] = useState(5);
  const [weatherEto, setWeatherEto] = useState(4.2);
  const areaInputId = useId();
  const etoInputId = useId();

  const crop = SIMULATOR_CROPS[selectedCrop] || SIMULATOR_CROPS.tomato;

  // Real-time calculations
  const dailyWaterM3 = Math.round(areaHa * 10000 * (weatherEto * crop.kc) / 1000 * 10) / 10;
  const seasonalFertilizerKg = Math.round(areaHa * crop.nPerHa);
  const expectedYieldTons = Math.round(areaHa * crop.yieldTonsHa * 10) / 10;
  const estGrossDzd = Math.round(expectedYieldTons * 1000 * crop.avgPriceDzd);

  return (
    <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-5 text-left">
          {/* Crop Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              {isRTL ? 'اختر المحصول' : 'Select Target Crop'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(SIMULATOR_CROPS).map(([key, data]) => {
                const isSelected = selectedCrop === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedCrop(key)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 shadow-sm'
                        : 'border-border bg-background hover:border-muted-foreground/40 text-muted-foreground'
                    }`}
                  >
                    <span className="text-base">{data.emoji}</span>
                    <span>{data.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Area Slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <label htmlFor={areaInputId} className="font-bold uppercase tracking-wider text-muted-foreground">
                {isRTL ? 'المساحة المزروعة' : 'Field Area'}
              </label>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">{areaHa} Hectares ({areaHa * 10000} m²)</span>
            </div>
            <input
              id={areaInputId}
              type="range"
              min="0.5"
              max="50"
              step="0.5"
              value={areaHa}
              onChange={e => setAreaHa(parseFloat(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>

          {/* Weather ET₀ Slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <label htmlFor={etoInputId} className="font-bold uppercase tracking-wider text-muted-foreground">
                {isRTL ? 'التبخر والنتح المرجعي ET₀' : 'Reference ET₀ (Open-Meteo)'}
              </label>
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-sm">{weatherEto.toFixed(1)} mm/day</span>
            </div>
            <input
              id={etoInputId}
              type="range"
              min="1.5"
              max="8.5"
              step="0.1"
              value={weatherEto}
              onChange={e => setWeatherEto(parseFloat(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>FAO-56 formula applied: ETc = Kc × ET₀ = {(weatherEto * crop.kc).toFixed(2)} mm/day</span>
          </div>
        </div>

        {/* Live Calculation Output Display */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Card 1: Daily Water */}
          <motion.div
            key={`water-${selectedCrop}-${areaHa}-${weatherEto}`}
            initial={{ scale: 0.96, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-xl border border-cyan-200/50 dark:border-cyan-900/40 bg-cyan-50/40 dark:bg-cyan-950/20 p-4 text-left relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-cyan-700 dark:text-cyan-300">Daily Irrigation Need</span>
              <Droplets className="h-4 w-4 text-cyan-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-800 dark:text-cyan-200">
              <AnimatedCounter value={dailyWaterM3} decimals={1} suffix=" m³/day" />
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              ≈ {Math.round(dailyWaterM3 / areaHa)} m³/ha at Kc = {crop.kc}
            </div>
          </motion.div>

          {/* Card 2: Fertilizer Budget */}
          <motion.div
            key={`fert-${selectedCrop}-${areaHa}`}
            initial={{ scale: 0.96, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-xl border border-emerald-200/50 dark:border-emerald-950/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 text-left relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">Nitrogen Split (N Target)</span>
              <Beaker className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-800 dark:text-emerald-200">
              <AnimatedCounter value={seasonalFertilizerKg} decimals={0} suffix=" kg N" />
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Based on {crop.nPerHa} kg N/ha lifecycle demand
            </div>
          </motion.div>

          {/* Card 3: Expected Yield */}
          <motion.div
            key={`yield-${selectedCrop}-${areaHa}`}
            initial={{ scale: 0.96, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-xl border border-amber-200/50 dark:border-amber-950/40 bg-amber-50/40 dark:bg-amber-950/20 p-4 text-left relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300">Expected Harvest Output</span>
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-800 dark:text-amber-200">
              <AnimatedCounter value={expectedYieldTons} decimals={1} suffix=" Tons" />
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Benchmark yield: {crop.yieldTonsHa} t/ha
            </div>
          </motion.div>

          {/* Card 4: Estimated Value */}
          <motion.div
            key={`rev-${selectedCrop}-${areaHa}`}
            initial={{ scale: 0.96, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-xl border border-teal-200/50 dark:border-teal-950/40 bg-teal-50/40 dark:bg-teal-950/20 p-4 text-left relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-300">Estimated Market Gross</span>
              <DollarSign className="h-4 w-4 text-teal-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-teal-800 dark:text-teal-200">
              <AnimatedCounter value={estGrossDzd} decimals={0} suffix=" DZD" />
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              At benchmark {crop.avgPriceDzd} DZD/kg wholesale
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function UseCaseCard({ icon: Icon, color, title, description, points }: {
  icon: typeof Sprout;
  color: string;
  title: string;
  description: string;
  points: string[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-all text-left"
      style={{ borderTopWidth: 3, borderTopColor: color }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 shadow-sm"
        style={{ backgroundColor: color + '20' }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <h3 className="font-bold text-sm mb-1.5">{title}</h3>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{description}</p>
      <ul className="space-y-1.5">
        {points.map((p, i) => (
          <li key={i} className="flex items-center gap-2 text-[11px]">
            <Check className="h-3 w-3 shrink-0" style={{ color }} />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// ============================================================================
// Static Data Definitions
// ============================================================================

const MARQUEE_ITEMS = [
  { title: 'FAO-56 Penman-Monteith (ET₀)', code: 'ISO-FAO-56', color: '#0891b2' },
  { title: 'Vincenty Geodesic Distance', code: 'WGS84-ACC', color: '#10b981' },
  { title: 'Base Saturation & CEC Balance', code: 'SOIL-CHEM', color: '#8b5cf6' },
  { title: 'WALES Tank Mix Sequence', code: 'AGRI-SAFE', color: '#f59e0b' },
  { title: 'Crop Water Stress Index (CWSI)', code: 'THERM-IR', color: '#06b6d4' },
  { title: 'Hazen-Williams Hydraulic Friction', code: 'PIPES-PSI', color: '#3b82f6' },
  { title: 'Growing Degree Days (GDD)', code: 'PHENOLOGY', color: '#16a34a' },
  { title: 'DAR Pre-Harvest Safety Timer', code: 'INPV-REG', color: '#ef4444' },
  { title: 'Drip Emitter Uniformity (EU/CU)', code: 'MICRO-IRR', color: '#0ea5e9' },
  { title: 'Farm Net Margin & Break-Even', code: 'DZD-ROI', color: '#84cc16' },
];

const AGENTS_LIST = [
  { emoji: '🌱', name: 'Agronomist' },
  { emoji: '🔍', name: 'Scout' },
  { emoji: '💧', name: 'Irrigation' },
  { emoji: '🧪', name: 'Soil Scientist' },
  { emoji: '📋', name: 'Extension' },
  { emoji: '💰', name: 'Farm Economist' },
  { emoji: '🌿', name: 'Horticulture' },
  { emoji: '📝', name: 'Grant Writer' },
  { emoji: '🗺️', name: 'GIS Officer' },
  { emoji: '🐄', name: 'Livestock Vet' },
];

const SIMULATOR_CROPS: Record<string, { name: string; emoji: string; kc: number; nPerHa: number; yieldTonsHa: number; avgPriceDzd: number }> = {
  tomato: { name: 'Tomato (طماطم)', emoji: '🍅', kc: 1.15, nPerHa: 220, yieldTonsHa: 75, avgPriceDzd: 65 },
  potato: { name: 'Potato (بطاطا)', emoji: '🥔', kc: 1.10, nPerHa: 180, yieldTonsHa: 38, avgPriceDzd: 70 },
  wheat: { name: 'Wheat (قمح صلب)', emoji: '🌾', kc: 1.05, nPerHa: 130, yieldTonsHa: 5.2, avgPriceDzd: 60 },
  olive: { name: 'Olive (زيتون)', emoji: '🫒', kc: 0.70, nPerHa: 90, yieldTonsHa: 7.5, avgPriceDzd: 180 },
};

const FEATURE_TABS = [
  {
    id: 'gis',
    title: 'GIS & Field Boundaries',
    subtitle: 'Millimeter Geodesy & Terrain Slope',
    icon: MapPin,
    description: 'Precision geospatial engine — convert seamlessly between DMS, decimal degrees, and UTM coordinates. Import and calculate field polygons from GeoJSON, KML, or WKT with Vincenty inverse accuracy. Analyze elevation contours, aspect, and frost drain zones.',
    bullets: [
      'Vincenty inverse ellipsoidal math on WGS84',
      'GeoJSON, KML, WKT, and CSV polygon import & export',
      'Elevation terrain profile + slope + aspect analysis',
      'Point-in-polygon & nearest border clearance distance',
    ],
    visual: (
      <div className="text-center relative py-4">
        {/* Animated radar compass sweep */}
        <div className="relative w-32 h-32 mx-auto mb-3 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-emerald-500/30" />
          <div className="absolute inset-4 rounded-full border border-emerald-500/20" />
          <div className="absolute inset-8 rounded-full border border-emerald-500/10" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/20 via-transparent to-transparent"
          />
          <MapPin className="h-8 w-8 text-emerald-600 relative z-10" />
        </div>
        <div className="text-[11px] font-mono text-muted-foreground">36.75°N, 3.05°E · UTM Zone 31N</div>
        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">Area: 14.52 ha · Perimeter: 1,640 m</div>
      </div>
    ),
  },
  {
    id: 'ai',
    title: '10 AI Specialists',
    subtitle: 'Agronomist, Scout, Vet, GIS & Farm Economist',
    icon: Sparkles,
    description: 'An integrated team of AI specialists tailored for real agricultural decision support. Each specialist possesses dedicated domain grounding — from pest and weed diagnosis to pump hydraulics sizing and grant proposals.',
    bullets: [
      '10 specialized domain agents with local context persistence',
      'Algerian & Mediterranean crop calendars and INPV guidance',
      'Audio voice notes & one-tap WhatsApp dispatch for workers',
      'Complete privacy with local browser storage',
    ],
    visual: (
      <div className="flex flex-wrap justify-center gap-2 max-w-[280px]">
        {AGENTS_LIST.map((agent, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.2, rotate: 10 }}
            className="w-11 h-11 rounded-xl bg-card border border-border/80 shadow-sm flex flex-col items-center justify-center cursor-pointer"
          >
            <span className="text-base">{agent.emoji}</span>
            <span className="text-[7px] font-medium text-muted-foreground truncate max-w-[36px]">{agent.name}</span>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: 'irrigation',
    title: 'FAO-56 Irrigation Engine',
    subtitle: 'Penman-Monteith, Kc Curves & Home Assistant YAML',
    icon: Droplets,
    description: 'Deterministic FAO-56 Penman-Monteith ET₀ calculations using free Open-Meteo data. Design controller zones, valve runtimes, cycle-and-soak for clay soils, and export directly to YAML for automated smart irrigation.',
    bullets: [
      'Dynamic ET₀ + stage-based Kc × ETc forecasting',
      'Controllers → Zones → Valves → Sequence scheduling',
      'Direct YAML export for Home Assistant / ESPHome',
      'Weather compensation slider & soil depletion alerts',
    ],
    visual: (
      <div className="text-center py-2">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-16 h-16 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 mx-auto mb-2 flex items-center justify-center shadow-md"
        >
          <Droplets className="h-8 w-8" />
        </motion.div>
        <div className="text-2xl font-bold font-mono text-cyan-700 dark:text-cyan-300">
          4.20 <span className="text-sm font-sans">mm/day</span>
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">Today&apos;s Penman-Monteith Baseline</div>
        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 text-[10px] font-semibold">
          💧 42 m³/ha Net Demand
        </div>
      </div>
    ),
  },
  {
    id: 'crops',
    title: 'Crop Lifecycle & Nutrition',
    subtitle: '39 Fertial Profiles & Stage-by-Stage NPK',
    icon: Sprout,
    description: 'Complete nutritional guidance and phenology tracking for Algerian and Mediterranean crops. Macro and micronutrient splits per growth stage, soil base saturation planning, and labor workload distribution.',
    bullets: [
      '39 Fertial verified fertilization schedules',
      'Stage-by-stage NPK + Ca/Mg/S + B/Zn/Mn balance',
      'Labor peak weeks estimation in person-days/ha',
      'Direct PDF printing for field workers and engineers',
    ],
    visual: (
      <div className="grid grid-cols-4 gap-2">
        {[
          { emoji: '🍅', name: 'Tomato' },
          { emoji: '🥔', name: 'Potato' },
          { emoji: '🌾', name: 'Wheat' },
          { emoji: '🫒', name: 'Olive' },
          { emoji: '🍊', name: 'Citrus' },
          { emoji: '🍇', name: 'Grape' },
          { emoji: '🥬', name: 'Lettuce' },
          { emoji: '🌶️', name: 'Pepper' },
        ].map((item, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.15, y: -2 }}
            className="w-12 h-12 rounded-xl bg-card border border-border/80 flex flex-col items-center justify-center shadow-sm"
          >
            <span className="text-base">{item.emoji}</span>
            <span className="text-[8px] text-muted-foreground">{item.name}</span>
          </motion.div>
        ))}
      </div>
    ),
  },
];

const ALL_TOOLS = [
  { name: 'Coordinate Converter', desc: 'DMS ↔ Decimal · UTM Zones', icon: MapPin, color: '#6366f1' },
  { name: 'Field Boundary Mapper', desc: 'GeoJSON · KML · WKT Polygons', icon: Layers, color: '#10b981' },
  { name: 'Distance & Bearing', desc: 'Vincenty Geodesic Ellipsoid', icon: Compass, color: '#0891b2' },
  { name: 'Terrain & Elevation', desc: 'Slope · Aspect · Frost Risk', icon: Mountain, color: '#78716c' },
  { name: 'ET₀ Penman-Monteith', desc: 'FAO-56 Weather Math', icon: Sun, color: '#0891b2' },
  { name: 'Irrigation Scheduler', desc: 'Valves · Runtime · YAML Export', icon: Clock, color: '#0ea5e9' },
  { name: 'Backpack Spray Calculator', desc: '16L/20L Dosage & WALES Mix', icon: ShieldAlert, color: '#ef4444' },
  { name: 'Fertilization Engine', desc: '39 Fertial Profiles · NPK', icon: Beaker, color: '#16a34a' },
  { name: 'Disease & INPV Guide', desc: 'Symptom Checker & DAR Timers', icon: Bug, color: '#65a30d' },
  { name: 'Farm Break-Even & ROI', desc: 'Costs/ha & DZD/kg Threshold', icon: DollarSign, color: '#f59e0b' },
  { name: 'AI Specialists Team', desc: '10 Field-Trained Agents', icon: Sparkles, color: '#6366f1' },
  { name: 'Sentinel-2 NDVI Maps', desc: 'Vegetation Heatmap & Stress', icon: Satellite, color: '#6366f1' },
  { name: 'Field Decision Dashboard', desc: 'Wind Drift · Frost · Heat', icon: CloudRain, color: '#0ea5e9' },
  { name: 'Soil Test Analyzer', desc: 'CEC · pH · Macro Balance', icon: Beaker, color: '#8b5cf6' },
  { name: 'Labor Calendar', desc: 'Person-days/ha & Peak Weeks', icon: Users, color: '#0891b2' },
  { name: 'Livestock Rations', desc: 'NRC Nutritional Balancer', icon: Sprout, color: '#f59e0b' },
];

const TESTIMONIALS = [
  {
    quote: 'The backpack spray calculator and WALES tank order saved our farm team from costly chemical precipitation mistakes. The DAR harvest safety timer is invaluable.',
    name: 'Karim B.',
    role: 'Commercial Greenhouse Grower · Tipaza, Algeria',
    initials: 'KB',
    color: '#16a34a',
  },
  {
    quote: 'As an agronomist, having Vincenty geodesy and FAO-56 Penman-Monteith math verified side-by-side with literature citations makes field prescriptions lightning fast.',
    name: 'Dr. Yasmine M.',
    role: 'Agronomy Researcher · ENSA Algiers',
    initials: 'YM',
    color: '#6366f1',
  },
  {
    quote: 'The break-even calculator allowed us to determine our exact DZD/kg minimum before negotiating with market intermediaries. Outstanding tool.',
    name: 'Omar T.',
    role: 'Potato & Citrus Producer · Mascara, Algeria',
    initials: 'OT',
    color: '#f59e0b',
  },
];
