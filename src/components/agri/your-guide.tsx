'use client';

/**
 * Your Guide — a professional, comprehensive guide to every feature,
 * tool, and capability in Formula Atlas. Organized into logical sections
 * with search, category filters, and deep links to each tool.
 *
 * Visible to all user levels (Farmer / Manager / Professional).
 * Trilingual (EN/FR/AR).
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, Sprout, Bug, Droplets, Beaker, Tractor, Sparkles, DollarSign,
  Users, Wrench, Calendar, BookOpen, FlaskConical, Cloud, MapPin, Activity,
  ChevronRight, Home, CloudRain, Microscope, ShieldCheck, Layers, Zap,
  Cpu, Leaf, Scale, TrendingUp, FileText, AlertTriangle, CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation, copyFor } from '@/lib/language-store';
import type { TabId } from '@/lib/user-level';
import { cn } from '@/lib/utils';

// ============================================================================
// Guide content
// ============================================================================

interface GuideEntry {
  id: string;
  title: { en: string; fr: string; ar: string };
  description: { en: string; fr: string; ar: string };
  category: string;
  icon: LucideIcon;
  color: string;
  /** Which tab the tool lives on. */
  tab: TabId;
  /** Storage key to deep-link (optional). */
  storageKey?: string;
  /** Which user levels can access this. */
  levels: ('farmer' | 'manager' | 'professional')[];
  /** Key features list. */
  features: { en: string; fr: string; ar: string }[];
  /** Data sources. */
  sources?: string[];
}

const CATEGORIES = [
  { id: 'getting-started', icon: Home, color: '#16a34a', label: { en: 'Getting Started', fr: 'Démarrage', ar: 'البدء' } },
  { id: 'weather', icon: Cloud, color: '#0ea5e9', label: { en: 'Weather & Climate', fr: 'Météo & Climat', ar: 'الطقس والمناخ' } },
  { id: 'soil', icon: Beaker, color: '#8b5cf6', label: { en: 'Soil & Nutrients', fr: 'Sol & Nutriments', ar: 'التربة والمغذيات' } },
  { id: 'crops', icon: Sprout, color: '#16a34a', label: { en: 'Crops & Planting', fr: 'Cultures & Plantation', ar: 'المحاصيل والزراعة' } },
  { id: 'irrigation', icon: Droplets, color: '#0284c7', label: { en: 'Irrigation & Water', fr: 'Irrigation & Eau', ar: 'الري والمياه' } },
  { id: 'protection', icon: Bug, color: '#dc2626', label: { en: 'Plant Protection', fr: 'Protection des Plantes', ar: 'وقاية النبات' } },
  { id: 'harvest', icon: TrendingUp, color: '#f59e0b', label: { en: 'Harvest & Storage', fr: 'Récolte & Stockage', ar: 'الحصاد والتخزين' } },
  { id: 'machinery', icon: Tractor, color: '#f97316', label: { en: 'Machinery & Equipment', fr: 'Machinisme', ar: 'الآلات والمعدات' } },
  { id: 'ai', icon: Sparkles, color: '#7c3aed', label: { en: 'AI & Intelligence', fr: 'IA & Intelligence', ar: 'الذكاء الاصطناعي' } },
  { id: 'business', icon: DollarSign, color: '#f59e0b', label: { en: 'Business & Finance', fr: 'Business & Finance', ar: 'الأعمال والمالية' } },
  { id: 'community', icon: Users, color: '#3b82f6', label: { en: 'Community & Reports', fr: 'Communauté & Rapports', ar: 'المجتمع والتقارير' } },
  { id: 'formulas', icon: BookOpen, color: '#16a34a', label: { en: 'Formulas Library', fr: 'Bibliothèque de Formules', ar: 'مكتبة المعادلات' } },
];

const GUIDE_ENTRIES: GuideEntry[] = [
  // === GETTING STARTED ===
  {
    id: 'farm-profile-wizard',
    title: { en: 'Farm Profile Wizard', fr: 'Assistant de Profil de Ferme', ar: 'معالج إعداد المزرعة' },
    description: { en: 'Set up your farm: name, location (GPS), main crop, planting date, and area. This personalizes weather, tasks, and recommendations across the entire app.', fr: 'Configurez votre ferme : nom, localisation GPS, culture principale, date de plantation et surface. Personnalise la météo, les tâches et les recommandations.', ar: 'أعدّ ملف مزرعتك: الاسم، الموقع (GPS)، المحصول الرئيسي، تاريخ الزراعة، والمساحة. يخصّص الطقس والمهام والتوصيات عبر التطبيق.' },
    category: 'getting-started',
    icon: Sprout, color: '#16a34a', tab: 'home',
    levels: ['farmer', 'manager', 'professional'],
    features: [
      { en: 'GPS location with "use my location" button', fr: 'Localisation GPS avec bouton « ma position »', ar: 'تحديد الموقع GPS مع زر "موقعي الحالي"' },
      { en: 'Crop picker from 20+ Algerian crops', fr: 'Sélecteur de culture parmi 20+ cultures algériennes', ar: 'اختيار المحصول من 20+ محصول جزائري' },
      { en: 'Auto-fills ET tracker, weather, labor calendar', fr: 'Remplissage auto du suivi ET, météo, calendrier de main-d\'œuvre', ar: 'تعبئة تلقائية لمتعقب التبخر والطقس وتقويم العمالة' },
    ],
  },
  {
    id: 'onboarding',
    title: { en: 'Onboarding Tour', fr: 'Visite Guidée', ar: 'جولة التعريف' },
    description: { en: '6-step guided tour: welcome → user level → role → crop → farm details → features. Collects area + irrigation system type.', fr: 'Visite guidée en 6 étapes : bienvenue → niveau → rôle → culture → détails → fonctionnalités.', ar: 'جولة تعريف في 6 خطوات: ترحيب → المستوى → الدور → المحصول → التفاصيل → الميزات.' },
    category: 'getting-started',
    icon: Home, color: '#16a34a', tab: 'home',
    levels: ['farmer', 'manager', 'professional'],
    features: [
      { en: 'Auto-starts on first visit', fr: 'Démarre automatiquement à la première visite', ar: 'يبدأ تلقائياً عند الزيارة الأولى' },
      { en: 'Saves farm profile to localStorage', fr: 'Sauvegarde le profil de ferme dans localStorage', ar: 'يحفظ ملف المزرعة في localStorage' },
      { en: 'Skippable + replayable via Tour button', fr: 'Ignorable + rejouable via le bouton Visite', ar: 'قابل للتخطّي وإعادة العرض' },
    ],
  },
  {
    id: 'user-levels',
    title: { en: 'Three User Levels', fr: 'Trois Niveaux d\'Utilisateur', ar: 'ثلاثة مستويات للمستخدم' },
    description: { en: 'Farmer Mode (simplified, 9 tools), Manager Mode (33 tools, financial focus), Professional Mode (34 tools, full library). Switch anytime from the header.', fr: 'Mode Agriculteur (simplifié, 9 outils), Mode Gestionnaire (33 outils, focus financier), Mode Professionnel (34 outils, bibliothèque complète).', ar: 'وضع المزارع (مبسّط، 9 أدوات)، وضع المدير (33 أداة، تركيز مالي)، وضع المحترف (34 أداة، المكتبة الكاملة).' },
    category: 'getting-started',
    icon: Layers, color: '#6366f1', tab: 'home',
    levels: ['farmer', 'manager', 'professional'],
    features: [
      { en: 'Farmer: Home + My Field + Farm + Calendar + Simulator + Help + Guide + About', fr: 'Agriculteur : Accueil + Mon Champ + Ferme + Calendrier + Simulateur + Aide + Guide + À propos', ar: 'المزارع: الرئيسية + حقلتي + مزرعة + تقويم + محاكي + مساعدة + دليل + حول' },
      { en: 'Manager: Farm + Calendar + Simulator + Insights + Tools', fr: 'Gestionnaire : Ferme + Calendrier + Simulateur + Analyses + Outils', ar: 'المدير: مزرعة + تقويم + محاكي + تحليلات + أدوات' },
      { en: 'Professional: full library + formulas + all tools', fr: 'Professionnel : bibliothèque complète + formules + tous les outils', ar: 'المحترف: المكتبة الكاملة + المعادلات + كل الأدوات' },
    ],
  },
  {
    id: 'i18n',
    title: { en: 'Trilingual Support (EN/FR/AR)', fr: 'Support Trilingue (EN/FR/AR)', ar: 'دعم ثلاثي اللغات (EN/FR/AR)' },
    description: { en: 'Full interface in English, French, and Arabic with RTL support. Toggle from the language button in the header.', fr: 'Interface complète en anglais, français et arabe avec support RTL. Basculez depuis le bouton de langue.', ar: 'واجهة كاملة بالإنجليزية والفرنسية والعربية مع دعم RTL. بدّل من زر اللغة.' },
    category: 'getting-started',
    icon: BookOpen, color: '#0ea5e9', tab: 'home',
    levels: ['farmer', 'manager', 'professional'],
    features: [
      { en: 'Cairo font for Latin + Arabic', fr: 'Police Cairo pour latin + arabe', ar: 'خط Cairo للاتيني والعربي' },
      { en: 'RTL layout with logical CSS properties', fr: 'Mise en page RTL avec propriétés CSS logiques', ar: 'تخطيط RTL مع خصائص CSS منطقية' },
      { en: '90+ UI strings + all tool descriptions translated', fr: '90+ chaînes UI + descriptions d\'outils traduites', ar: '90+ سلسلة واجهة + أوصاف الأدوات مترجمة' },
    ],
  },

  // === WEATHER ===
  {
    id: 'weather-advisor',
    title: { en: 'Weather & Field Activity Advisor', fr: 'Conseiller Météo & Activité', ar: 'مستشار الطقس والنشاط الميداني' },
    description: { en: 'Live weather from Open-Meteo with spray-window check (wind/rain/temp), 4-day forecast, and spoken audio daily briefing in Arabic/French.', fr: 'Météo en direct d\'Open-Meteo avec vérification de la fenêtre de pulvérisation, prévisions 4 jours, et briefing audio quotidien.', ar: 'طقس مباشر من Open-Meteo مع فحص نافذة الرش، توقعات 4 أيام، وملخص صوتي يومي.' },
    category: 'weather',
    icon: Cloud, color: '#0ea5e9', tab: 'myfield',
    levels: ['farmer', 'manager', 'professional'],
    features: [
      { en: 'Go/No-Go spray window (wind<15km/h, rain<60%, temp 12-28°C)', fr: 'Fenêtre de pulvérisation Go/No-Go', ar: 'نافذة رش Go/No-Go' },
      { en: '🔊 Spoken audio briefing via speechSynthesis API', fr: '🔊 Briefing audio via speechSynthesis', ar: '🔊 ملخص صوتي عبر speechSynthesis' },
      { en: 'Frost/heat/rain/wind alert banners', fr: 'Bannières d\'alerte gel/chaleur/pluie/vent', ar: 'تنبيهات الصقيع/الحرارة/المطر/الرياح' },
    ],
    sources: ['Open-Meteo (free, no API key)'],
  },
  {
    id: 'et-tracker',
    title: { en: 'Evapotranspiration Tracker', fr: 'Suivi de l\'Évapotranspiration', ar: 'متعقّب التبخر النتحي' },
    description: { en: 'FAO-56 Penman-Monteith ET₀ from live weather data. Computes crop ETc = Kc × ET₀ × area, with 7-day irrigation plan and ERA5 historical data.', fr: 'ET₀ FAO-56 Penman-Monteith depuis les données météo en direct. Calcule ETc = Kc × ET₀ × surface.', ar: 'حساب ET₀ بطريقة FAO-56 Penman-Monteith من بيانات الطقس المباشرة.' },
    category: 'weather',
    icon: CloudRain, color: '#0891b2', tab: 'farm', storageKey: 'collapse_et_tracker',
    levels: ['manager', 'professional'],
    features: [
      { en: 'FAO-56 Penman-Monteith equation (full)', fr: 'Équation FAO-56 Penman-Monteith complète', ar: 'معادلة FAO-56 Penman-Monteith الكاملة' },
      { en: '20 crop Kc curves (FAO-56 Table 12)', fr: '20 courbes Kc de cultures', ar: '20 منحنى Kc للمحاصيل' },
      { en: 'ERA5 historical data (2010-present)', fr: 'Données historiques ERA5 (2010-présent)', ar: 'بيانات تاريخية ERA5 (2010-الحاضر)' },
    ],
    sources: ['Open-Meteo', 'FAO-56 (Allen et al., 1998)'],
  },
  {
    id: 'weather-radar',
    title: { en: 'Weather Radar + Frost Maps', fr: 'Radar Météo + Cartes de Gel', ar: 'رادار الطقس + خرائط الصقيع' },
    description: { en: 'Real-time weather radar with precipitation, temperature, and wind overlays. Frost risk maps for Hauts Plateaux fruit trees.', fr: 'Radar météo en temps réel avec précipitations, température et vent. Cartes de risque de gel.', ar: 'رادار طقس لحظي مع التساقط والحرارة والرياح.' },
    category: 'weather',
    icon: CloudRain, color: '#0ea5e9', tab: 'insights', storageKey: 'collapse_weather_radar',
    levels: ['manager', 'professional'],
    features: [
      { en: 'Multi-layer weather map (rain/temp/wind/clouds)', fr: 'Carte météo multi-couches', ar: 'خريطة طقس متعددة الطبقات' },
      { en: 'Frost risk zones for Algerian regions', fr: 'Zones à risque de gel pour les régions algériennes', ar: 'مناطق خطر الصقيع للمناطق الجزائرية' },
    ],
  },
  {
    id: 'drought-stress',
    title: { en: 'Drought Stress Index', fr: 'Indice de Stress Hydrique', ar: 'مؤشر إجهاد الجفاف' },
    description: { en: 'Combines ET₀ deficit + soil water depletion + crop stage → stress score + irrigation urgency rating.', fr: 'Combine déficit ET₀ + déplétion d\'eau du sol + stade de culture → score de stress.', ar: 'يجمع عجز ET₀ + استنزاف ماء التربة + مرحلة المحصول → درجة الإجهاد.' },
    category: 'weather',
    icon: AlertTriangle, color: '#f97316', tab: 'farm', storageKey: 'collapse_drought',
    levels: ['manager', 'professional'],
    features: [
      { en: 'Stress score 0-100 with urgency rating', fr: 'Score de stress 0-100 avec urgence', ar: 'درجة إجهاد 0-100 مع تصنيف الإلحاح' },
      { en: 'Crop-stage sensitivity weighting', fr: 'Pondération par sensibilité du stade', ar: 'ترجيح حساسية المرحلة' },
    ],
  },

  // === SOIL ===
  {
    id: 'soil-sensor',
    title: { en: 'Soil Sensor Dashboard', fr: 'Tableau des Capteurs du Sol', ar: 'لوحة مستشعر التربة' },
    description: { en: 'Real-time or simulated soil N/P/K/pH/EC/moisture/temperature readings with alert thresholds. Ready for Modbus sensor integration.', fr: 'Lectures en temps réel ou simulées de N/P/K/pH/EC/humidité/température du sol.', ar: 'قراءات لحظية أو محاكاة لعناصر التربة.' },
    category: 'soil',
    icon: Activity, color: '#0891b2', tab: 'farm', storageKey: 'collapse_soil_sensor',
    levels: ['farmer', 'manager', 'professional'],
    features: [
      { en: '6 soil type profiles (Alluvial, Black, Red, Laterite, Sandy, Clay)', fr: '6 profils de sol (Alluvial, Noir, Rouge, Latéritique, Sableux, Argileux)', ar: '6 أنواع تربة (غرينية، سوداء، حمراء، لاتيريتية، رملية، طينية)' },
      { en: 'Alert thresholds for N/P/K/pH/EC/moisture', fr: 'Seuils d\'alerte pour N/P/K/pH/EC/humidité', ar: 'عتبات تنبيه للعناصر' },
      { en: 'Simulated readings based on soil physics — replaceable with real Modbus sensors', fr: 'Lectures simulées — remplaçables par capteurs Modbus réels', ar: 'قراءات محاكاة — قابلة للاستبدال بمستشعرات Modbus حقيقية' },
    ],
    sources: ['AgroAI soil physics model (MIT)'],
  },
  {
    id: 'soil-profiles',
    title: { en: 'Soil Physics Profiles', fr: 'Profils Physiques du Sol', ar: 'ملفات فيزياء التربة' },
    description: { en: 'Quantitative properties for 6 soil types: water retention, drainage rate, pH/EC ranges, NPK baselines. Feeds irrigation and nutrient recommendations.', fr: 'Propriétés quantitatives pour 6 types de sol : rétention d\'eau, drainage, pH/EC, NPK de base.', ar: 'خصائص كمية لأنواع التربة: الاحتفاظ بالماء، الصرف، pH/EC، NPK.' },
    category: 'soil',
    icon: Beaker, color: '#8b5cf6', tab: 'farm',
    levels: ['manager', 'professional'],
    features: [
      { en: 'Irrigation adjustment: sandy → 3.2× frequency, 0.4× dose', fr: 'Ajustement d\'irrigation : sableux → 3.2× fréquence, 0.4× dose', ar: 'تعديل الري: رملية → 3.2× تردد، 0.4× جرعة' },
      { en: 'pH compatibility check for each crop', fr: 'Vérification de compatibilité pH par culture', ar: 'فحص توافق pH لكل محصول' },
    ],
    sources: ['AgroAI (MIT)', 'USDA soil taxonomy'],
  },
  {
    id: 'soil-test-history',
    title: { en: 'Soil Test History Tracker', fr: 'Suivi des Analyses de Sol', ar: 'متعقّب تحاليل التربة' },
    description: { en: 'Multi-year soil test tracking with trend charts, amendment recommendations, and PDF export.', fr: 'Suivi pluriannuel des analyses de sol avec graphiques de tendance et recommandations.', ar: 'تتبع متعدد السنوات لتحاليل التربة مع رسوم بيانية وتوصيات.' },
    category: 'soil',
    icon: FlaskConical, color: '#8b5cf6', tab: 'farm', storageKey: 'collapse_soil_history',
    levels: ['farmer', 'manager', 'professional'],
    features: [
      { en: 'N/P/K/pH/OM trend charts over time', fr: 'Graphiques de tendance N/P/K/pH/MO', ar: 'رسوم اتجاه N/P/K/pH/MO' },
      { en: 'Amendment recommendations based on test results', fr: 'Recommandations d\'amendement', ar: 'توصيات التعديل' },
      { en: 'PDF export for lab submission', fr: 'Export PDF pour soumission au laboratoire', ar: 'تصدير PDF للمختبر' },
    ],
  },
  {
    id: 'soil-texture',
    title: { en: 'Soil Texture Triangle', fr: 'Triangle de Texture du Sol', ar: 'مثلث نسجة التربة' },
    description: { en: 'Interactive ternary diagram (USDA/SSEW/International) with soil properties and management recommendations.', fr: 'Diagramme ternaire interactif (USDA/SSEW/International) avec propriétés du sol.', ar: 'مخطط ثلاثي تفاعلي مع خصائص التربة.' },
    category: 'soil',
    icon: Beaker, color: '#78716c', tab: 'farm', storageKey: 'collapse_soil_texture',
    levels: ['manager', 'professional'],
    features: [
      { en: '3 classification systems (USDA/SSEW/International)', fr: '3 systèmes de classification', ar: '3 أنظمة تصنيف' },
      { en: 'Click-to-set sand/silt/clay percentages', fr: 'Clic pour définir les pourcentages', ar: 'نقر لتحديد النسب' },
    ],
  },
  {
    id: 'nutrient-budget',
    title: { en: '4R Nutrient Budget Planner', fr: 'Planificateur de Budget Nutritionnel 4R', ar: 'مخطّط الميزانية الغذائية 4R' },
    description: { en: 'Right source, right rate, right time, right place. Translates kg/ha NPK requirements into commercial product quantities.', fr: 'Right source, right rate, right time, right place. Traduit les besoins NPK en quantités de produits commerciaux.', ar: 'المصدر الصحيح، المعدل الصحيح، الوقت الصحيح، المكان الصحيح.' },
    category: 'soil',
    icon: Beaker, color: '#059669', tab: 'farm', storageKey: 'collapse_nutrient_budget',
    levels: ['farmer', 'manager', 'professional'],
    features: [
      { en: '20 crop-specific NPK recommendations', fr: '20 recommandations NPK par culture', ar: '20 توصية NPK حسب المحصول' },
      { en: 'Fertial fertilization manual integration', fr: 'Intégration du manuel Fertial', ar: 'تكامل مع دليل Fertial' },
      { en: 'Product cost calculator in DZD', fr: 'Calculateur de coût en DZD', ar: 'حاسبة التكلفة بالدينار' },
    ],
    sources: ['Fertial fertilization manual', 'FAO-56'],
  },

  // === CROPS ===
  {
    id: 'crop-recommender',
    title: { en: 'Crop Recommendation Engine', fr: 'Moteur de Recommandation de Cultures', ar: 'محرّك توصية المحاصيل' },
    description: { en: 'Enter soil test results → get top-3 crop recommendations with confidence scores. Also: "Can I grow X here?" reverse feasibility check with amendment suggestions.', fr: 'Entrez vos résultats d\'analyse de sol → obtenez le top-3 des cultures recommandées avec scores de confiance.', ar: 'أدخل نتائج تحليل التربة → احصل على أفضل 3 محاصيل مع درجات الثقة.' },
    category: 'crops',
    icon: Sparkles, color: '#7c3aed', tab: 'farm', storageKey: 'collapse_crop_recommender',
    levels: ['farmer', 'manager', 'professional'],
    features: [
      { en: '12 Algerian crop profiles (wheat, barley, maize, potato, tomato, citrus, olive, vine, datepalm, alfalfa, sunflower, onion)', fr: '12 profils de cultures algériennes', ar: '12 ملف محاصيل جزائرية' },
      { en: 'Scoring: pH + N + P + K + temp + rainfall + soil type', fr: 'Notation : pH + N + P + K + temp + pluie + type de sol', ar: 'تقييم: pH + N + P + K + حرارة + مطر + نوع التربة' },
      { en: 'Reverse recommendation: feasibility + amendments + irrigation', fr: 'Recommandation inverse : faisabilité + amendements + irrigation', ar: 'توصية عكسية: جدوى + تعديلات + ري' },
    ],
    sources: ['AgroAI crop recommendation pattern (MIT)', 'INPV 2017'],
  },
  {
    id: 'crop-calendar',
    title: { en: 'Crop Calendar Generator', fr: 'Générateur de Calendrier Cultural', ar: 'مولّد تقويم المحصول' },
    description: { en: 'One-click complete farm calendar: planting + fertilization + irrigation + pest control + labor. 20 crops, editable, PDF export with INPV-matched commercial products.', fr: 'Calendrier cultural complet en un clic : plantation + fertilisation + irrigation + lutte + main-d\'œuvre.', ar: 'تقويم مزرعة كامل بنقرة واحدة.' },
    category: 'crops',
    icon: Calendar, color: '#16a34a', tab: 'farm', storageKey: 'collapse_crop_calendar_gen',
    levels: ['farmer', 'manager', 'professional'],
    features: [
      { en: 'Week-by-week operations table with Kc + ETc + labor', fr: 'Tableau hebdomadaire avec Kc + ETc + main-d\'œuvre', ar: 'جدول أسبوعي مع Kc + ETc + عمالة' },
      { en: 'INPV-matched brand badges on each pest risk entry', fr: 'Badges de marques INPV sur chaque risque', ar: 'شارات منتجات INPV لكل خطر آفة' },
      { en: 'PDF export with Fertial reference', fr: 'Export PDF avec référence Fertial', ar: 'تصدير PDF مع مرجع Fertial' },
    ],
    sources: ['FAO-56', 'INPV 2017', 'Fertial'],
  },
  {
    id: 'algeria-calendar',
    title: { en: 'Algeria Agriculture Calendar', fr: 'Calendrier Agricole Algérien', ar: 'التقويم الفلاحي الجزائري' },
    description: { en: '12 source-backed months with 529 entries across 49 crops. 3 views: This Week (personalized), Browse Month (with filters), Annual Timeline (Gantt heatmap).', fr: '12 mois sourcés avec 529 entrées pour 49 cultures. 3 vues : Cette semaine, Parcourir le mois, Chronologie annuelle.', ar: '12 شهراً موثقة بـ 529 إدخالاً لـ 49 محصولاً. 3 عروض.' },
    category: 'crops',
    icon: Calendar, color: '#0f766e', tab: 'calendar',
    levels: ['farmer', 'manager', 'professional'],
    features: [
      { en: 'This Week: auto-personalized to your crop + weather spray window', fr: 'Cette semaine : personnalisé selon votre culture + météo', ar: 'هذا الأسبوع: مخصّص لمحصولك + طقس' },
      { en: 'BBCH growth stages + pest activity flags + INPV brands', fr: 'Stades BBCH + indicateurs d\'activité des ravageurs + marques INPV', ar: 'مراحل BBCH + مؤشرات نشاط الآفات + منتجات INPV' },
      { en: 'Entry cards with done-checkbox + reminders + share', fr: 'Cartes avec case à cocher + rappels + partage', ar: 'بطاقات مع مربع إنجاز + تذكيرات + مشاركة' },
    ],
    sources: ['INVA/Ministère de l\'Agriculture (12 PDF sources)'],
  },
  {
    id: 'bbch-tracker',
    title: { en: 'BBCH Growth Stage Tracker', fr: 'Suivi des Stades BBCH', ar: 'متتبّع مراحل BBCH' },
    description: { en: 'Visual phenology tracker showing your crop\'s current BBCH stage, days since planting, progress bar, and countdown to harvest.', fr: 'Suivi visuel de la phénologie : stade BBCH actuel, jours depuis plantation, barre de progression, compte à rebours de la récolte.', ar: 'متتبّع بصري للنمو: مرحلة BBCH الحالية، الأيام منذ الزراعة، شريط التقدم، العد التنازلي للحصاد.' },
    category: 'crops',
    icon: Sprout, color: '#16a34a', tab: 'myfield',
    levels: ['farmer', 'manager', 'professional'],
    features: [
      { en: 'BBCH codes for wheat, citrus, olive, potato (4 crops)', fr: 'Codes BBCH pour blé, agrumes, olivier, pomme de terre', ar: 'رموز BBCH للقمح، الحمضيات، الزيتون، البطاطا' },
      { en: 'Visual progress ring + days-to-harvest countdown', fr: 'Anneau de progression + compte à rebours', ar: 'حلقة تقدم + عد تنازلي للحصاد' },
    ],
  },
  {
    id: 'multi-field',
    title: { en: 'Multi-Field Dashboard', fr: 'Tableau Multi-Parcelles', ar: 'لوحة الحقول المتعددة' },
    description: { en: 'Track every field, crop stage, and irrigation demand in one place. Add fields with name, crop, area, GPS, irrigation system.', fr: 'Suivez chaque parcelle, stade de culture et besoin d\'irrigation en un seul endroit.', ar: 'تابع كل حقل ومرحلة محصول وطلب ري في مكان واحد.' },
    category: 'crops',
    icon: Layers, color: '#16a34a', tab: 'farm', storageKey: 'collapse_multifield',
    levels: ['manager', 'professional'],
    features: [
      { en: 'Unlimited fields with color-coding', fr: 'Parcelles illimitées avec code couleur', ar: 'حقول غير محدودة بألوان' },
      { en: 'Per-field crop stage + Kc + irrigation demand', fr: 'Stade + Kc + besoin d\'irrigation par parcelle', ar: 'مرحلة + Kc + طلب ري لكل حقل' },
    ],
  },
  {
    id: 'companion-planting',
    title: { en: 'Companion Planting Guide', fr: 'Guide des Associations de Cultures', ar: 'دليل الزراعة المرافقة' },
    description: { en: '20 crops with 100+ pairings — synergy (✓) or antagonism (✗). Search any crop to see what helps or harms it.', fr: '20 cultures avec 100+ associations — synergie (✓) ou antagonisme (✗).', ar: '20 محصولاً مع 100+ اقتران — تآزر (✓) أو تضاد (✗).' },
    category: 'crops',
    icon: Leaf, color: '#84cc16', tab: 'farm', storageKey: 'collapse_companion',
    levels: ['manager', 'professional'],
    features: [
      { en: 'Synergy + antagonism matrix', fr: 'Matrice de synergie + antagonisme', ar: 'مصفوفة التآزر + التضاد' },
      { en: 'Search any crop → see compatible + incompatible neighbors', fr: 'Recherche → voisins compatibles + incompatibles', ar: 'بحث → الجيران المتوافقون وغير المتوافقين' },
    ],
  },
  {
    id: 'seed-rate',
    title: { en: 'Seed Rate Calculator', fr: 'Calculateur de Dose de Semence', ar: 'حاسبة معدل البذور' },
    description: { en: 'Target population × TGW × germination × field loss → kg seed/ha. 6 crops with spacing recommendations.', fr: 'Population cible × TGW × germination × perte au champ → kg semence/ha.', ar: 'الكثافة المستهدفة × وزن 1000 حبة × الإنبات × الفقد → كغ بذور/هكتار.' },
    category: 'crops',
    icon: Sprout, color: '#16a34a', tab: 'farm', storageKey: 'collapse_seedrate',
    levels: ['manager', 'professional'],
    features: [
      { en: '6 crops (maize, wheat, rice, soybean, barley, canola)', fr: '6 cultures', ar: '6 محاصيل' },
      { en: 'Plant spacing + row spacing output', fr: 'Espacement des plants + des rangs', ar: 'تباعد النباتات + الصفوف' },
    ],
  },
  {
    id: 'gdd-tracker',
    title: { en: 'GDD Tracker (Growing Degree Days)', fr: 'Suivi des Degrés-Jours de Croissance', ar: 'متعقّب درجات النمو الحرارية' },
    description: { en: 'Accumulates thermal time from Open-Meteo weather data. Predicts growth stages for 5 crops.', fr: 'Accumule le temps thermique depuis Open-Meteo. Prédit les stades de croissance pour 5 cultures.', ar: 'يجمع الوقت الحراري من Open-Meteo. يتنبأ بمراحل النمو لـ 5 محاصيل.' },
    category: 'crops',
    icon: Zap, color: '#f59e0b', tab: 'farm', storageKey: 'collapse_gdd',
    levels: ['manager', 'professional'],
    features: [
      { en: 'Auto-fetches daily temp from Open-Meteo', fr: 'Récupère la température quotidienne d\'Open-Meteo', ar: 'يجلب الحرارة اليومية من Open-Meteo' },
      { en: '5 crops with base temp + GDD thresholds per stage', fr: '5 cultures avec temp. de base + seuils GDD par stade', ar: '5 محاصيل مع حرارة أساسية + عتبات GDD' },
    ],
    sources: ['Open-Meteo'],
  },

  // === IRRIGATION ===
  {
    id: 'water-budget',
    title: { en: 'Water Budget Optimizer', fr: 'Optimiseur de Budget Hydrique', ar: 'مُحسّن ميزانية المياه' },
    description: { en: 'Computes daily irrigation need: ETc = Kc × ET₀ × area. Adjusts for rain, soil type, and irrigation system efficiency.', fr: 'Calcule le besoin quotidien d\'irrigation : ETc = Kc × ET₀ × surface.', ar: 'يحسب الاحتياج اليومي للري: ETc = Kc × ET₀ × المساحة.' },
    category: 'irrigation',
    icon: Droplets, color: '#0284c7', tab: 'farm', storageKey: 'collapse_water_budget',
    levels: ['farmer', 'manager', 'professional'],
    features: [
      { en: 'Soil-type adjustment (sandy → frequent small doses)', fr: 'Ajustement par type de sol', ar: 'تعديل حسب نوع التربة' },
      { en: '4 irrigation systems (drip 90%, sprinkler 75%, furrow 60%, rainfed 50%)', fr: '4 systèmes d\'irrigation', ar: '4 أنظمة ري' },
    ],
  },
  {
    id: 'irrigation-scheduler',
    title: { en: 'Irrigation Scheduler', fr: 'Planificateur d\'Irrigation', ar: 'مجدول الري' },
    description: { en: 'Controllers → Zones → Schedules → Sequences. Cycle-and-soak eco-mode with weather % adjust. YAML/CSV/JSON export.', fr: 'Contrôleurs → Zones → Programmes → Séquences. Mode eco cycle-and-soak.', ar: 'متحكمات → مناطق → جداول → تسلسلات. وضع eco.' },
    category: 'irrigation',
    icon: Droplets, color: '#0ea5e9', tab: 'farm', storageKey: 'collapse_irr_sched',
    levels: ['manager', 'professional'],
    features: [
      { en: 'Multi-controller, multi-zone scheduling', fr: 'Planification multi-contrôleur, multi-zone', ar: 'جدولة متعددة المتحكمات والمناطق' },
      { en: 'Weather-based % adjustment (rain skip)', fr: 'Ajustement % basé météo (saut de pluie)', ar: 'تعديل % حسب الطقس (تخطّي المطر)' },
      { en: 'YAML/CSV/JSON export for controller import', fr: 'Export YAML/CSV/JSON', ar: 'تصدير YAML/CSV/JSON' },
    ],
  },
  {
    id: 'irrigation-designer',
    title: { en: 'Irrigation System Designer', fr: 'Concepteur de Système d\'Irrigation', ar: 'مصمّم نظام الري' },
    description: { en: 'Multi-zone sprinkler / drip / bubbler designer with pump sizing, pipe sizing, and pressure-loss calculations.', fr: 'Concepteur multi-zone aspersion / goutte-à-goutte avec dimensionnement de pompe.', ar: 'مصمّم متعدد المناطق مع تحديد المضخة.' },
    category: 'irrigation',
    icon: Wrench, color: '#6366f1', tab: 'farm', storageKey: 'collapse_system_design',
    levels: ['manager', 'professional'],
    features: [
      { en: 'Pump sizing (flow + head + efficiency)', fr: 'Dimensionnement de pompe', ar: 'تحديد المضخة' },
      { en: 'Pipe sizing with Hazen-Williams pressure loss', fr: 'Dimensionnement des tuyaux (Hazen-Williams)', ar: 'تحديد الأنابيب (Hazen-Williams)' },
    ],
  },
  {
    id: 'water-harvesting',
    title: { en: 'Water Harvesting Calculator', fr: 'Calculateur de Récupération d\'Eau', ar: 'حاسبة حصاد المياه' },
    description: { en: 'Rooftop rainwater collection + cistern sizing + demand coverage analysis.', fr: 'Récupération d\'eau de pluie + dimensionnement de citerne.', ar: 'حصاد مياه الأمطار + تحديد حجم الخزان.' },
    category: 'irrigation',
    icon: CloudRain, color: '#0ea5e9', tab: 'farm', storageKey: 'collapse_water_harvest',
    levels: ['manager', 'professional'],
    features: [
      { en: 'Rooftop area → annual harvestable water', fr: 'Surface du toit → eau récupérable annuelle', ar: 'مساحة السطح → مياه قابلة للحصاد' },
      { en: 'Cistern sizing with demand coverage %', fr: 'Dimensionnement de citerne avec % de couverture', ar: 'تحديد الخزام بـ% التغطية' },
    ],
  },

  // === PLANT PROTECTION ===
  {
    id: 'ai-scout',
    title: { en: 'AI Field Scout', fr: 'Éclaireur de Champ IA', ar: 'كشاف الحقل بالذكاء الاصطناعي' },
    description: { en: 'Photo + observation-based crop scouting with evidence cards, verification prompts, and safety gates. Matches symptoms to INPV-registered treatments.', fr: 'Prospection par photo + observation avec preuves, vérification et garde-fous de sécurité.', ar: 'كشف بالصورة + الملاحظة مع بطاقات أدلة وحواجز أمان.' },
    category: 'protection',
    icon: Sparkles, color: '#0f766e', tab: 'farm', storageKey: 'collapse_ai_scout',
    levels: ['farmer', 'manager', 'professional'],
    features: [
      { en: 'Photo upload + voice transcript scouting', fr: 'Téléversement photo + transcription vocale', ar: 'رفع صورة + نسخ صوتي' },
      { en: 'Matches symptoms to INPV active matters', fr: 'Correspondance symptômes → matières actives INPV', ar: 'مطابقة الأعراض مع المواد الفعالة INPV' },
      { en: 'Safety gates: review required before treatment', fr: 'Garde-fous : revue requise avant traitement', ar: 'حواجز أمان: مراجعة قبل العلاج' },
    ],
    sources: ['INPV 2017', 'PlantVillage'],
  },
  {
    id: 'disease-encyclopedia',
    title: { en: 'Disease Encyclopedia', fr: 'Encyclopédie des Maladies', ar: 'موسوعة الأمراض' },
    description: { en: 'Browse 20+ diseases by crop or search by symptom. Chemical + organic treatments, precautions, and INPV-registered active substances.', fr: 'Parcourez 20+ maladies par culture ou recherchez par symptôme. Traitements chimiques + biologiques.', ar: 'تصفّح 20+ مرضاً حسب المحصول أو ابحث بالعَرَض.' },
    category: 'protection',
    icon: Bug, color: '#dc2626', tab: 'farm', storageKey: 'collapse_disease_encyclopedia',
    levels: ['farmer', 'manager', 'professional'],
    features: [
      { en: '20 Algerian diseases across 8 crops', fr: '20 maladies algériennes sur 8 cultures', ar: '20 مرضاً جزائرياً على 8 محاصيل' },
      { en: 'Chemical + organic treatment with doses', fr: 'Traitement chimique + biologique avec doses', ar: 'علاج كيميائي + عضوي مع جرعات' },
      { en: 'INPV-registered active substances linked', fr: 'Matières actives INPV liées', ar: 'مواد فعالة INPV مرتبطة' },
    ],
    sources: ['AgroAI disease_kb.json (MIT)', 'INPV 2017'],
  },
  {
    id: 'active-matter',
    title: { en: 'Active Matter Selector (Algérie)', fr: 'Sélecteur de Matières Actives (Algérie)', ar: 'منتقي المادة الفعالة (الجزائر)' },
    description: { en: 'Decide which active ingredient to use against diseases, pests and weeds. Crop-based advisor with INPV 2017 catalogue, symptom search, ranked recommendations.', fr: 'Décidez quelle matière active utiliser. Conseiller basé sur la culture avec catalogue INPV 2017.', ar: 'قرّر المادة الفعالة المناسبة. مستشار حسب المحصول.' },
    category: 'protection',
    icon: Bug, color: '#65a30d', tab: 'farm', storageKey: 'collapse_active_matter',
    levels: ['manager', 'professional'],
    features: [
      { en: 'Symptom-based search across 50+ plant problems', fr: 'Recherche par symptômes sur 50+ problèmes', ar: 'بحث بالأعراض على 50+ مشكلة' },
      { en: 'Ranked recommendations with confidence + doses + DAR', fr: 'Recommandations classées avec confiance + doses + DAR', ar: 'توصيات مرتّبة مع ثقة + جرعات + DAR' },
      { en: '10 enhancements: spray window, AI, timeline, resistance, cost, bees, comparison, tank mix, QR, preventive', fr: '10 améliorations', ar: '10 تحسينات' },
    ],
    sources: ['INPV 2017', 'E-Phy (Anses)'],
  },
  {
    id: 'product-finder',
    title: { en: 'Product Finder (INPV 2017)', fr: 'Chercheur de Produits (INPV 2017)', ar: 'الباحث عن المنتجات (INPV 2017)' },
    description: { en: '1,264 official Algerian phytosanitary products. Pick your crop + problem → see matching brands with doses, harvest-wait times, and bee/aquatic toxicity warnings.', fr: '1 264 produits phytosanitaires algériens officiels. Choisissez culture + problème → marques correspondantes.', ar: '1,264 منتجات جزائرية مرخّصة. اختر محصولك ومشكلتك.' },
    category: 'protection',
    icon: Search, color: '#16a34a', tab: 'myfield', storageKey: 'collapse_product_finder_myfield',
    levels: ['farmer', 'manager', 'professional'],
    features: [
      { en: 'Enriched JSON: structured usage, toxicity flags, BBCH stages', fr: 'JSON enrichi : usage structuré, toxicité, BBCH', ar: 'JSON مُخصّب: استخدام منظم، سمية، BBCH' },
      { en: 'Crop + pest + section filters', fr: 'Filtres culture + ravageur + section', ar: 'مرشحات محصول + آفة + قسم' },
      { en: '🐝 Toxic to bees / 🐟 Toxic to aquatic warning badges', fr: 'Badges de toxicité 🐝 / 🐟', ar: 'شارات سمية 🐝 / 🐟' },
    ],
    sources: ['INPV 2017 (232-page PDF, 1,264 products)'],
  },
  {
    id: 'ipm-planner',
    title: { en: 'IPM Action Planner', fr: 'Planificateur d\'Action IPM', ar: 'مخطّط عمل الإدارة المتكاملة للآفات' },
    description: { en: 'Integrated Pest Management: scouting evidence → action thresholds → lower-risk controls → responsible treatment review.', fr: 'Gestion intégrée des ravageurs : preuves → seuils → contrôles à moindre risque → revue.', ar: 'إدارة متكاملة للآفات: أدلة → عتبات → مكافحة أقل خطراً → مراجعة.' },
    category: 'protection',
    icon: ShieldCheck, color: '#e11d48', tab: 'farm', storageKey: 'collapse_ipm_action',
    levels: ['farmer', 'manager', 'professional'],
    features: [
      { en: 'Action threshold library (5 pest types)', fr: 'Bibliothèque de seuils d\'action', ar: 'مكتبة عتبات التدخل' },
      { en: 'Sequential sampling plan', fr: 'Plan d\'échantillonnage séquentiel', ar: 'خطة أخذ عينات تسلسلية' },
    ],
  },
  {
    id: 'disease-forecast',
    title: { en: 'Disease Forecast Dashboard', fr: 'Tableau de Prévision des Maladies', ar: 'لوحة تنبؤ الأمراض' },
    description: { en: '5 disease models (Blitecast, TOMCAST, Mills, FHB, Downy mildew) with weather-based spray timing.', fr: '5 modèles de maladies avec timing de pulvérisation basé météo.', ar: '5 نماذج أمراض مع توقيت الرش حسب الطقس.' },
    category: 'protection',
    icon: Bug, color: '#dc2626', tab: 'farm', storageKey: 'collapse_disease',
    levels: ['manager', 'professional'],
    features: [
      { en: 'Blitecast (potato late blight) — Smith Period', fr: 'Blitecast (mildou pomme de terre)', ar: 'Blitecast (لفحة البطاطا)' },
      { en: 'Mills table (apple scab) — ascospore maturity', fr: 'Table de Mills (tavelure du pommier)', ar: 'جدول Mills (جرب التفاح)' },
      { en: 'FHB (Fusarium Head Blight) — wheat flowering risk', fr: 'FHB (fusariose de l\'épi)', ar: 'FHB (لفحة السنابل)' },
    ],
    sources: ['Smith Period', 'Mills Table', 'TOMCAST'],
  },
  {
    id: 'disease-detection',
    title: { en: 'Plant Disease Detection Model', fr: 'Modèle de Détection des Maladies', ar: 'نموذج كشف أمراض النبات' },
    description: { en: '30-class disease taxonomy (EfficientNet-B4 architecture) with training pipeline documentation. Ready for future microservice deployment.', fr: 'Taxonomie de 30 classes (EfficientNet-B4) avec documentation du pipeline d\'entraînement.', ar: 'تصنيف 30 فئة (EfficientNet-B4) مع وثائق التدريب.' },
    category: 'protection',
    icon: Microscope, color: '#8b5cf6', tab: 'farm',
    levels: ['professional'],
    features: [
      { en: '30 disease classes across 5 crops', fr: '30 classes de maladies sur 5 cultures', ar: '30 فئة مرض على 5 محاصيل' },
      { en: 'Per-class accuracy 0.87-0.99', fr: 'Précision par classe 0.87-0.99', ar: 'دقة لكل فئة 0.87-0.99' },
      { en: 'Training pipeline docs for Algerian retraining', fr: 'Docs du pipeline pour réentraînement algérien', ar: 'وثائق التدريب لإعادة التدريب الجزائري' },
    ],
    sources: ['AgroAI EfficientNet B4 (MIT)', 'PlantVillage'],
  },

  // === HARVEST ===
  {
    id: 'harvest-forecast',
    title: { en: 'Harvest Forecast & Lot Planner', fr: 'Prévision de Récolte & Lots', ar: 'توقّع الحصاد وتخطيط الدفعات' },
    description: { en: 'Predicts harvest timing + yield per lot. Schedules labor and storage for optimal timing.', fr: 'Prédit le timing et le rendement de récolte par lot.', ar: 'يتنبأ بتوقيت وإنتاج الحصاد لكل دفعة.' },
    category: 'harvest',
    icon: TrendingUp, color: '#f59e0b', tab: 'farm', storageKey: 'collapse_harvest_forecast',
    levels: ['farmer', 'manager', 'professional'],
    features: [
      { en: 'Yield estimation per lot', fr: 'Estimation du rendement par lot', ar: 'تقدير الإنتاج لكل دفعة' },
      { en: 'Labor scheduling for harvest window', fr: 'Planification de la main-d\'œuvre', ar: 'جدولة العمالة لنافذة الحصاد' },
    ],
  },
  {
    id: 'post-harvest',
    title: { en: 'Post-Harvest Storage Calculator', fr: 'Calculateur de Stockage Post-Récolte', ar: 'حاسبة التخزين بعد الحصاد' },
    description: { en: 'EMC (Henderson), safe storage days, drying time + cost, bin aeration fan sizing. 7 crops.', fr: 'EMC (Henderson), jours de stockage sûr, temps de séchage, ventilation. 7 cultures.', ar: 'محتوى الرطوبة التوازني، أيام التخزين الآمن، التجفيف. 7 محاصيل.' },
    category: 'harvest',
    icon: Wrench, color: '#f59e0b', tab: 'farm', storageKey: 'collapse_postharvest',
    levels: ['manager', 'professional'],
    features: [
      { en: '7 crops with equilibrium moisture content', fr: '7 cultures avec humidité d\'équilibre', ar: '7 محاصيل مع رطوبة التوازن' },
      { en: 'Bin aeration fan sizing (CFM + static pressure)', fr: 'Dimensionnement de ventilateur de cellule', ar: 'تحديد مروحة التهوية' },
    ],
  },
  {
    id: 'grain-bin',
    title: { en: 'Grain Bin Inventory Tracker', fr: 'Suivi d\'Inventaire des Cellules', ar: 'متعقّب مخزون الصوامع' },
    description: { en: 'Track grain quantities by bin, with moisture, temperature, and fumigation records.', fr: 'Suivez les quantités de grains par cellule, avec humidité et température.', ar: 'تابع كميات الحبوب حسب الصومعة.' },
    category: 'harvest',
    icon: Layers, color: '#f59e0b', tab: 'farm', storageKey: 'collapse_grainbin',
    levels: ['manager', 'professional'],
    features: [
      { en: 'Multi-bin inventory with grain type', fr: 'Inventaire multi-cellules par type de grain', ar: 'مخزون متعدد الصوامع حسب النوع' },
      { en: 'Moisture + temperature monitoring per bin', fr: 'Suivi humidité + température par cellule', ar: 'مراقبة الرطوبة + الحرارة لكل صومعة' },
    ],
  },

  // === MACHINERY ===
  {
    id: 'machinery-cost',
    title: { en: 'Machinery Cost Calculator', fr: 'Calculateur de Coûts Machinisme', ar: 'حاسبة تكاليف الآلات' },
    description: { en: 'Annual ownership + operating costs per machine. Depreciation, fuel, maintenance, labor.', fr: 'Coûts annuels de possession + exploitation par machine.', ar: 'تكاليف سنوية للملكية + التشغيل لكل آلة.' },
    category: 'machinery',
    icon: Tractor, color: '#f97316', tab: 'farm', storageKey: 'collapse_machinery',
    levels: ['manager', 'professional'],
    features: [
      { en: 'Depreciation (straight-line + declining balance)', fr: 'Amortissement', ar: 'الإهلاك' },
      { en: 'Fuel + maintenance + labor per hour', fr: 'Carburant + entretien + main-d\'œuvre par heure', ar: 'وقود + صيانة + عمالة بالساعة' },
    ],
  },
  {
    id: 'machinery-optimizer',
    title: { en: 'Machinery & Field-Operation Optimizer', fr: 'Optimiseur Machinisme & Opérations', ar: 'مُحسّن الآلات والعمليات الميدانية' },
    description: { en: 'Optimizes tractor-implement matching, field operation sequences, and fuel efficiency.', fr: 'Optimise l\'appariement tracteur-outil et l\'efficacité énergétique.', ar: 'يحسّن مطابقة الجرار-الأداة والكفاءة.' },
    category: 'machinery',
    icon: Tractor, color: '#f97316', tab: 'farm', storageKey: 'collapse_machinery_optimizer',
    levels: ['manager', 'professional'],
    features: [
      { en: 'Tractor-implement power matching', fr: 'Appariement tracteur-outil', ar: 'مطابقة الجرار-الأداة' },
      { en: 'Field operation sequence optimization', fr: 'Optimisation de séquence d\'opérations', ar: 'تحسين تسلسل العمليات' },
    ],
  },

  // === AI ===
  {
    id: 'ai-specialists',
    title: { en: 'AI Specialists (10 Agents)', fr: 'Spécialistes IA (10 Agents)', ar: 'متخصصو الذكاء الاصطناعي (10 وكلاء)' },
    description: { en: '10 AI specialists: Agronomist, Irrigation Engineer, Soil Scientist, Pest/Disease Expert, Crop Planner, Financial Advisor, Weather Analyst, Machinery Expert, Livestock Expert, Market Analyst.', fr: '10 spécialistes IA : agronome, ingénieur irrigation, pédologue, expert ravageurs, planificateur, conseiller financier, analyste météo, machinisme, bétail, marché.', ar: '10 متخصصين بالذكاء الاصطناعي.' },
    category: 'ai',
    icon: Sparkles, color: '#7c3aed', tab: 'insights', storageKey: 'collapse_agent_chat',
    levels: ['manager', 'professional'],
    features: [
      { en: 'Multi-agent chat with context sanitization', fr: 'Chat multi-agent avec sanitization du contexte', ar: 'محادثة متعددة الوكلاء' },
      { en: 'Trilingual responses (EN/FR/AR)', fr: 'Réponses trilingues', ar: 'ردود ثلاثية اللغة' },
      { en: 'Safety prompt + capability grounding', fr: 'Prompt de sécurité + ancrage des capacités', ar: 'موجه أمان + تأريض القدرات' },
    ],
  },
  {
    id: 'season-plan-ai',
    title: { en: 'AI Season Plan Generator', fr: 'Générateur de Plan de Saison IA', ar: 'مولّد خطة الموسم بالذكاء الاصطناعي' },
    description: { en: 'Generates a complete week-by-week crop plan from your inputs — Kc curve, weekly NPK dose, irrigation schedule, fertigation recipe, growth-stage notes, and warnings.', fr: 'Génère un plan hebdomadaire complet — courbe Kc, doses NPK hebdomadaires, programme d\'irrigation, fertigation, notes de stades.', ar: 'يولّد خطة أسبوعية كاملة — منحنى Kc، جرعات NPK أسبوعياً، جدول ري، fertigation، ملاحظات المراحل.' },
    category: 'ai',
    icon: Sparkles, color: '#7c3aed', tab: 'farm', storageKey: 'collapse_season_plan',
    levels: ['manager', 'professional'],
    features: [
      { en: 'LLM-powered via /api/season-plan', fr: 'Propulsé par LLM via /api/season-plan', ar: 'مدعوم بـ LLM' },
      { en: 'Frost/heat/water-stress warnings', fr: 'Avertissements gel/chaleur/stress hydrique', ar: 'تحذيرات الصقيع/الحرارة/الإجهاد المائي' },
    ],
  },
  {
    id: 'farm-digital-twin',
    title: { en: 'Farm Digital Twin', fr: 'Jumeau Numérique de Ferme', ar: 'التوأم الرقمي للمزرعة' },
    description: { en: 'Command center: field status, priorities, alerts, and cross-tool recommendations in one dashboard.', fr: 'Centre de commande : statut de parcelle, priorités, alertes, recommandations.', ar: 'مركز القيادة: حالة الحقل، الأولويات، التنبيهات، التوصيات.' },
    category: 'ai',
    icon: Activity, color: '#0f766e', tab: 'farm', storageKey: 'collapse_digital_twin',
    levels: ['manager', 'professional'],
    features: [
      { en: 'Cross-tool recommendation engine', fr: 'Moteur de recommandations inter-outils', ar: 'محرّك توصيات عبر الأدوات' },
      { en: 'Priority queue based on weather + crop stage', fr: 'File de priorités basée météo + stade', ar: 'قائمة أولويات حسب الطقس + المرحلة' },
    ],
  },
  {
    id: 'satellite-health',
    title: { en: 'Satellite Crop Health Monitor', fr: 'Surveillance Satellite de la Santé des Cultures', ar: 'مراقب صحة المحصول بالأقمار الصناعية' },
    description: { en: 'NDVI field maps, vegetation health heatmap, stress zone detection, and AI recommendations from satellite imagery.', fr: 'Cartes NDVI, heatmap de santé végétale, détection de zones de stress, recommandations IA.', ar: 'خرائط NDVI، خريطة حرارية للصحة، كشف مناطق الإجهاد.' },
    category: 'ai',
    icon: MapPin, color: '#6366f1', tab: 'farm', storageKey: 'collapse_satellite_health',
    levels: ['manager', 'professional'],
    features: [
      { en: 'NDVI (Normalized Difference Vegetation Index)', fr: 'NDVI (Indice de Végétation Différencié Normalisé)', ar: 'NDVI (مؤشر الغطاء النباتي)' },
      { en: 'Stress zone detection + AI recommendations', fr: 'Détection de zones de stress + recommandations IA', ar: 'كشف مناطق الإجهاد + توصيات ذكية' },
    ],
    sources: ['Sentinel-2 (ESA)', 'Landsat 8 (USGS)'],
  },

  // === BUSINESS ===
  {
    id: 'crop-simulator',
    title: { en: 'Crop Simulator (DZD)', fr: 'Simulateur de Culture (DZD)', ar: 'محاكي المحصول (دينار)' },
    description: { en: 'Run real-world crop scenarios in DZD with costs, yield, price, and risks. What-if analysis for break-even and ROI.', fr: 'Simulez des scénarios de culture en DZD avec coûts, rendement, prix et risques.', ar: 'حاك سيناريوهات محصول بالدينار مع التكاليف والإنتاج والسعر والمخاطر.' },
    category: 'business',
    icon: DollarSign, color: '#f59e0b', tab: 'simulator',
    levels: ['farmer', 'manager', 'professional'],
    features: [
      { en: 'Full cost breakdown (seed/fertilizer/crop protection/irrigation/fuel/labor)', fr: 'Décomposition complète des coûts', ar: 'تفصيل كامل للتكاليف' },
      { en: 'Risk scenarios (drought/pest/price drop)', fr: 'Scénarios de risque', ar: 'سيناريوهات المخاطر' },
      { en: 'Break-even yield + price calculator', fr: 'Calculateur de point de rentabilité', ar: 'حاسبة نقطة التعادل' },
    ],
  },
  {
    id: 'financial-dashboard',
    title: { en: 'Financial Dashboard', fr: 'Tableau Financier', ar: 'اللوحة المالية' },
    description: { en: 'Costs, revenue, gross margin, break-even, ROI, and what-if scenario analysis.', fr: 'Coûts, revenus, marge brute, seuil de rentabilité, ROI, scénarios.', ar: 'التكاليف، الإيرادات، الهامش، التعادل، العائد، السيناريوهات.' },
    category: 'business',
    icon: DollarSign, color: '#f59e0b', tab: 'insights', storageKey: 'collapse_financial',
    levels: ['manager', 'professional'],
    features: [
      { en: 'Break-even analysis (yield + price)', fr: 'Analyse de seuil de rentabilité', ar: 'تحليل نقطة التعادل' },
      { en: 'ROI (Return on Investment) calculator', fr: 'Calculateur de ROI', ar: 'حاسبة العائد على الاستثمار' },
    ],
  },
  {
    id: 'gross-margin',
    title: { en: 'Gross-Margin & Break-Even Planner', fr: 'Planificateur de Marge Brute', ar: 'مخطّط الهامش الإجمالي' },
    description: { en: 'Compare crop choices, cost and revenue per hectare, break-even yield and price, downside scenarios.', fr: 'Comparez les choix de cultures, coût et revenu par hectare, scénarios.', ar: 'قارن خيارات المحاصيل والتكلفة والإيراد.' },
    category: 'business',
    icon: Scale, color: '#d97706', tab: 'farm', storageKey: 'collapse_gross_margin',
    levels: ['farmer', 'manager', 'professional'],
    features: [
      { en: 'Side-by-side crop comparison', fr: 'Comparaison côte à côte des cultures', ar: 'مقارنة جنباً إلى جنب' },
      { en: 'Downside scenario (yield × price)', fr: 'Scénario défavorable', ar: 'سيناريو سلبي' },
    ],
  },
  {
    id: 'marketplace',
    title: { en: 'Marketplace — Buy Fertilizers & Supplies', fr: 'Marketplace — Achats', ar: 'السوق — شراء الأسمدة والمستلزمات' },
    description: { en: 'Browse and compare agricultural supplies from Algerian dealers. Fertilizers, seeds, equipment.', fr: 'Parcourez et comparez les fournitures agricoles des revendeurs algériens.', ar: 'تصفّح وقارن المستلزمات الزراعية من التجار الجزائريين.' },
    category: 'business',
    icon: DollarSign, color: '#3b82f6', tab: 'insights', storageKey: 'collapse_marketplace',
    levels: ['manager', 'professional'],
    features: [
      { en: 'Product catalog with DZD pricing', fr: 'Catalogue de produits avec prix en DZD', ar: 'كتالوج منتجات بأسعار الدينار' },
      { en: 'Dealer comparison + contact', fr: 'Comparaison de revendeurs', ar: 'مقارنة التجار' },
    ],
  },
  {
    id: 'carbon-credit',
    title: { en: 'Carbon Credit Estimator', fr: 'Estimateur de Crédits Carbone', ar: 'مقدّر أرصدة الكربون' },
    description: { en: 'Estimates carbon sequestration from cover crops, reduced tillage, and organic amendments. Carbon credit potential in tCO₂e.', fr: 'Estime la séquestration de carbone. Potentiel de crédits carbone en tCO₂e.', ar: 'يقدّر عزل الكربون. إمكانات أرصدة الكربون.' },
    category: 'business',
    icon: Leaf, color: '#16a34a', tab: 'farm', storageKey: 'collapse_carbon',
    levels: ['manager', 'professional'],
    features: [
      { en: '3 practices: cover crops, no-till, organic amendments', fr: '3 pratiques : cultures intermédiaires, semis direct, amendements', ar: '3 ممارسات' },
      { en: 'tCO₂e per hectare per year', fr: 'tCO₂e par hectare par an', ar: 'tCO₂e لكل هكتار سنوياً' },
    ],
  },

  // === COMMUNITY ===
  {
    id: 'farmer-community',
    title: { en: 'Farmer Community & Knowledge Exchange', fr: 'Communauté d\'Agriculteurs', ar: 'مجتمع المزارعين' },
    description: { en: 'Share experiences, ask questions, benchmark your farm, and read success stories from other Algerian farmers.', fr: 'Partagez vos expériences, posez des questions, comparez votre ferme.', ar: 'شارك الخبرات، اطرح الأسئلة، قارن مزرعتك.' },
    category: 'community',
    icon: Users, color: '#3b82f6', tab: 'insights', storageKey: 'collapse_community',
    levels: ['manager', 'professional'],
    features: [
      { en: 'Q&A forum + success stories', fr: 'Forum Q&R + témoignages', ar: 'منتدى أسئلة + قصص نجاح' },
      { en: 'Farm benchmarking (yield/cost/efficiency)', fr: 'Benchmarking de ferme', ar: 'مقارنة المزارع' },
    ],
  },
  {
    id: 'report-generator',
    title: { en: 'Professional Report Generator', fr: 'Générateur de Rapport Professionnel', ar: 'مولّد التقارير المهنية' },
    description: { en: 'Combine field, soil, financial, and crop-plan evidence into an exportable PDF report.', fr: 'Combinez les données de parcelle, sol, finances et plan cultural en un rapport PDF.', ar: 'اجمع بيانات الحقل والتربة والمال وخطة المحصول في تقرير PDF.' },
    category: 'community',
    icon: FileText, color: '#7c3aed', tab: 'insights', storageKey: 'collapse_report',
    levels: ['professional'],
    features: [
      { en: 'Multi-section PDF with charts and tables', fr: 'PDF multi-sections avec graphiques', ar: 'PDF متعدد الأقسام مع رسوم' },
      { en: 'Customizable report sections', fr: 'Sections personnalisables', ar: 'أقسام قابلة للتخصيص' },
    ],
  },

  // === FORMULAS ===
  {
    id: 'formula-explorer',
    title: { en: 'Formula Library (500 formulas)', fr: 'Bibliothèque de Formules (500)', ar: 'مكتبة المعادلات (500)' },
    description: { en: '500 agronomic formulas across 8 problem-driven scenarios. 3 view modes: Explorer, Classic (Part/Chapter), Graph. Difficulty badges + auto-tags.', fr: '500 formules agronomiques. 3 modes d\'affichage. Badges de difficulté + tags auto.', ar: '500 معادلة زراعية. 3 أوضاع عرض. شارات صعوبة + وسوم تلقائية.' },
    category: 'formulas',
    icon: BookOpen, color: '#16a34a', tab: 'formulas',
    levels: ['professional'],
    features: [
      { en: '8 problem-driven scenarios (irrigation, fertilization, pest, economics…)', fr: '8 scénarios par problème', ar: '8 سيناريوهات حسب المشكلة' },
      { en: 'Interactive calculators linked to formulas', fr: 'Calculateurs interactifs liés aux formules', ar: 'حاسبات تفاعلية مرتبطة بالمعادلات' },
      { en: 'Formula of the Day + recently viewed strip', fr: 'Formule du jour + vues récemment', ar: 'معادلة اليوم + شوهد مؤخراً' },
    ],
    sources: ['FAO-56', 'NRC 2021', 'Fertial', 'INPV 2017'],
  },
  {
    id: 'command-palette',
    title: { en: 'Command Palette (⌘K)', fr: 'Palette de Commandes (⌘K)', ar: 'لوحة الأوامر (⌘K)' },
    description: { en: 'Global search across all tools, agents, and formulas. Pin favorites. Filtered by user level.', fr: 'Recherche globale sur tous les outils, agents et formules. Filtré par niveau.', ar: 'بحث شامل في كل الأدوات والوكلاء والمعادلات.' },
    category: 'formulas',
    icon: Search, color: '#6366f1', tab: 'home',
    levels: ['farmer', 'manager', 'professional'],
    features: [
      { en: '⌘K / Ctrl+K to open on desktop', fr: '⌘K / Ctrl+K pour ouvrir', ar: '⌘K / Ctrl+K للفتح' },
      { en: 'Pinned tools + recent history', fr: 'Outils épinglés + historique', ar: 'أدوات مثبّتة + سجل' },
      { en: 'Filters by current user level', fr: 'Filtre par niveau d\'utilisateur', ar: 'مرشّح حسب مستوى المستخدم' },
    ],
  },
];

// ============================================================================
// Component
// ============================================================================

export function YourGuide({ onNavigate }: { onNavigate: (tab: TabId, storageKey?: string) => void }) {
  const { language, isRTL } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  const filtered = useMemo(() => {
    let result = GUIDE_ENTRIES;
    if (selectedCategory) {
      result = result.filter(e => e.category === selectedCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(e =>
        e.title.en.toLowerCase().includes(q) ||
        e.title.fr.toLowerCase().includes(q) ||
        e.title.ar.includes(q) ||
        e.description.en.toLowerCase().includes(q) ||
        e.description.fr.toLowerCase().includes(q) ||
        e.description.ar.includes(q) ||
        e.features.some(f => f.en.toLowerCase().includes(q) || f.fr.toLowerCase().includes(q))
      );
    }
    return result;
  }, [query, selectedCategory]);

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="rounded-2xl p-5 bg-gradient-to-r from-indigo-600 via-violet-700 to-purple-800 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
              {tr('Professional Guide', 'دليل احترافي', 'Guide Professionnel')}
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              {tr('Your Guide', 'دليلك', 'Votre Guide')}
            </h2>
            <p className="text-xs text-white/75 mt-0.5">
              {tr(
                'Everything in the app — every tool, feature, and data source explained.',
                'كل شيء في التطبيق — كل أداة وميزة ومصدر بيانات مشروح.',
                'Tout dans l\'application — chaque outil, fonctionnalité et source de données expliqués.',
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tr('Search tools, features, data sources…', 'ابحث عن أدوات أو ميزات أو مصادر…', 'Rechercher outils, fonctionnalités…')}
          className="h-10 ps-9 text-sm"
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            'text-xs px-2.5 py-1 rounded-full border transition-all',
            !selectedCategory ? 'bg-foreground text-background border-foreground' : 'bg-card border-border hover:border-foreground/40'
          )}
        >
          {tr('All', 'الكل', 'Tout')}
          <span className="ms-1 text-[9px] opacity-70">{GUIDE_ENTRIES.length}</span>
        </button>
        {CATEGORIES.map(cat => {
          const count = GUIDE_ENTRIES.filter(e => e.category === cat.id).length;
          if (count === 0) return null;
          const CatIcon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1',
                selectedCategory === cat.id
                  ? 'text-white border-transparent shadow-sm'
                  : 'bg-card border-border hover:border-foreground/40'
              )}
              style={selectedCategory === cat.id ? { background: cat.color, borderColor: cat.color } : undefined}
            >
              <CatIcon className="h-3 w-3" />
              {language === 'ar' ? cat.label.ar : language === 'fr' ? cat.label.fr : cat.label.en}
              <span className="text-[9px] opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <Badge variant="secondary" className="text-[10px]">
        {filtered.length} {tr('items', 'عنصر', 'éléments')}
      </Badge>

      {/* Guide cards */}
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map(entry => (
          <GuideCard key={entry.id} entry={entry} language={language} onNavigate={onNavigate} />
        ))}
      </div>

      {filtered.length === 0 && (
        <Card><CardContent className="py-8 text-center text-xs text-muted-foreground">
          <Search className="h-6 w-6 mx-auto mb-2 opacity-50" />
          {tr('No results. Try a different search or category.', 'لا نتائج. جرّب بحثاً أو فئة أخرى.', 'Aucun résultat. Essayez une autre recherche.')}
        </CardContent></Card>
      )}
    </div>
  );
}

function GuideCard({ entry, language, onNavigate }: {
  entry: GuideEntry;
  language: 'en' | 'fr' | 'ar';
  onNavigate: (tab: TabId, storageKey?: string) => void;
}) {
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const Icon = entry.icon;
  const title = language === 'ar' ? entry.title.ar : language === 'fr' ? entry.title.fr : entry.title.en;
  const desc = language === 'ar' ? entry.description.ar : language === 'fr' ? entry.description.fr : entry.description.en;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `${entry.color}18`, color: entry.color }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm">{title}</CardTitle>
            <div className="flex flex-wrap gap-1 mt-1">
              {entry.levels.map(lvl => (
                <Badge key={lvl} variant="outline" className="text-[8px] py-0 px-1 capitalize">
                  {lvl === 'farmer' ? tr('Farmer', 'مزارع', 'Agriculteur') :
                   lvl === 'manager' ? tr('Manager', 'مدير', 'Gestionnaire') :
                   tr('Pro', 'محترف', 'Pro')}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <p className="text-muted-foreground leading-relaxed">{desc}</p>

        {/* Features */}
        <ul className="space-y-0.5">
          {entry.features.map((f, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{language === 'ar' ? f.ar : language === 'fr' ? f.fr : f.en}</span>
            </li>
          ))}
        </ul>

        {/* Sources */}
        {entry.sources && entry.sources.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1 border-t border-border/40">
            <span className="text-[9px] text-muted-foreground">{tr('Sources', 'المصادر', 'Sources')}:</span>
            {entry.sources.map(s => (
              <Badge key={s} variant="outline" className="text-[8px] py-0 px-1">{s}</Badge>
            ))}
          </div>
        )}

        {/* Open button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2 text-[10px] gap-1"
          onClick={() => onNavigate(entry.tab, entry.storageKey)}
        >
          {tr('Open', 'افتح', 'Ouvrir')}
          <ChevronRight className="h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}
