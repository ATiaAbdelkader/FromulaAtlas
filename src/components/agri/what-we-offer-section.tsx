'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplets,
  Wind,
  Beaker,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Zap,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Calculator,
  Compass,
  MapPin,
  Leaf,
  Layers,
  Clock,
  Coins,
  Fuel,
  Users,
  Microscope,
  Sprout,
  Sliders,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { copyFor, Language } from '@/lib/language-store';

interface WhatWeOfferSectionProps {
  language: Language;
  isRTL: boolean;
}

type OfferTab = 'questions' | 'roi' | 'unique' | 'roles';

export function WhatWeOfferSection({ language, isRTL }: WhatWeOfferSectionProps) {
  const [activeTab, setActiveTab] = useState<OfferTab>('questions');
  const [activeQuestion, setActiveQuestion] = useState(0);

  const tabs: { id: OfferTab; title: string; icon: React.ElementType }[] = [
    {
      id: 'questions',
      title: copyFor(language, '4 Daily Questions in 10s', '4 أسئلة يومية في 10 ثوانٍ', '4 Questions quotidiennes en 10s'),
      icon: Clock,
    },
    {
      id: 'roi',
      title: copyFor(language, 'Farmer Gains & ROI (DA)', 'الأرباح والتوفير المالي (دج)', 'Gains & Rentabilité (DA)'),
      icon: DollarSign,
    },
    {
      id: 'unique',
      title: copyFor(language, 'Algerian Superpowers', 'ميزاتنا الخاصة بالجزائر', 'Spécificités Algériennes'),
      icon: Zap,
    },
    {
      id: 'roles',
      title: copyFor(language, 'Tailored to Your Role', 'مفصل حسب دورك الميداني', 'Adapté à votre Profil'),
      icon: Users,
    },
  ];

  const dailyQuestions = [
    {
      icon: Droplets,
      color: '#0284c7',
      question: copyFor(language, '1. How much water & when?', '1. كمية الماء وتوقيت الري؟', '1. Combien d’eau et quand ?'),
      farmerProblem: copyFor(
        language,
        'Pumping by intuition causes root asphyxiation, crop water stress, and massive electricity or diesel waste.',
        'الري العشوائي والتخميني يسبب اختناق الجذور أو إجهاد المحصول، واستهلاكاً كبيراً في الكهرباء والمازوت.',
        'L’arrosage au jugé entraîne l’asphyxie racinaire, le stress hydrique et un gaspillage massif d’énergie.'
      ),
      instantAnswer: copyFor(
        language,
        'Open Sector 2 (Pivot) for 2h 15min today (42 m³/ha net demand).',
        'شغل الصمام في القطاع 2 (المحور) لمدة ساعتين و15 دقيقة اليوم (42 م³/هكتار).',
        'Ouvrez le Secteur 2 (Pivot) pendant 2h 15min aujourd’hui (42 m³/ha net).'
      ),
      theEngine: 'FAO-56 Penman-Monteith ET₀ × Kc (Open-Meteo Synced)',
      gainMetric: copyFor(language, 'Save 15%–30% Water & Energy (~25,000 to 60,000 DA/ha/yr)', 'توفير 15%–30% في الماء والكهرباء (~25,000 إلى 60,000 دج/هكتار/سنة)', 'Économisez 15%–30% d’eau et d’énergie (~25 000 à 60 000 DA/ha/an)'),
      toolId: 'collapse_water_budget',
      tabTarget: 'farm',
    },
    {
      icon: Wind,
      color: '#0891b2',
      question: copyFor(language, '2. Can I spray right now?', '2. هل يمكنني الرش والمعالجة الآن؟', '2. Puis-je traiter maintenant ?'),
      farmerProblem: copyFor(
        language,
        'Spraying during midday heat evaporates pesticide droplets before they touch the foliage; wind causes expensive chemical drift.',
        'الرش في درجات حرارة مرتفعة يسبب تبخر قطرات المبيد قبل وصولها للأوراق، والرياح تسبب ضياع المحلول في الهواء.',
        'Traiter par forte chaleur évapore les gouttelettes avant contact ; le vent disperse le produit inutilement.'
      ),
      instantAnswer: copyFor(
        language,
        'YES / NO Clear Advisor · Delta-T: 4.8°C (Optimal) · Wind: 7 km/h · No Drift Risk.',
        'مؤشر أخضر/أحمر فوري · دلتا-T: 4.8°م (مثالي) · الرياح: 7 كم/سا · أمان تام من الانجراف.',
        'Signal VERT/ROUGE direct · Delta-T : 4.8°C (Idéal) · Vent : 7 km/h · Zéro dérive.'
      ),
      theEngine: 'Atmospheric Psychrometry + Delta-T Table + INPV Pre-Harvest Safety (DAR)',
      gainMetric: copyFor(language, 'Zero Lost Chemical Treatments (Save 8,000 to 20,000 DA per spray)', 'صفر مبيدات ضائعة (توفير 8,000 إلى 20,000 دج لكل معالجة)', 'Zéro traitement perdu (Économisez 8 000 à 20 000 DA par passage)'),
      toolId: 'collapse_field_decision',
      tabTarget: 'farm',
    },
    {
      icon: Beaker,
      color: '#16a34a',
      question: copyFor(language, '3. How many fertilizer bags to buy?', '3. كم كيس سماد أشتري وأضيف؟', '3. Combien de sacs d’engrais ?'),
      farmerProblem: copyFor(
        language,
        'Over-fertilizing burns tender root systems and wastes expensive N-P-K bags; under-fertilizing drastically drops target yield.',
        'الإفراط في التسميد يحرق الجذور ويرفع ملوحة التربة، والنقص يقلل المردود الإنتاجي.',
        'Le surdosage brûle les racines et gaspille des sacs coûteux ; le sous-dosage détruit le rendement.'
      ),
      instantAnswer: copyFor(
        language,
        'Apply exactly 5 bags of Urea 46% (50 kg Asmidal/Fertial) for your 2.5 ha plot at current growth stage.',
        'أضف بالضبط 5 أكياس يوريا 46% (50 كغ فرتيال) لقطعتك بمساحة 2.5 هكتار في هذه المرحلة.',
        'Appliquez exactement 5 sacs d’Urée 46% (50 kg Fertial) pour vos 2.5 ha au stade actuel.'
      ),
      theEngine: '4R Nutrient Stewardship & Fertial 39-Crop Phenological Split',
      gainMetric: copyFor(language, 'Save 3 to 6 Bags of Urea/DAP per ha (~15,000 to 30,000 DA/ha)', 'توفير 3 إلى 6 أكياس يوريا/DAP في الهكتار (~15,000 إلى 30,000 دج/هكتار)', 'Économisez 3 à 6 sacs d’Urée/DAP par ha (~15 000 à 30 000 DA/ha)'),
      toolId: 'collapse_nutri_tools',
      tabTarget: 'farm',
    },
    {
      icon: DollarSign,
      color: '#d97706',
      question: copyFor(language, '4. What is my net profit before delivery?', '4. كم هو ربحي الصافي قبل التوصيل؟', '4. Quel est mon gain net avant livraison ?'),
      farmerProblem: copyFor(
        language,
        'Delivering harvest blindly to silos or wholesale souks without calculating moisture penalties, transport freight, or net margins.',
        'تسليم المحصول للمخازن أو أسواق الجملة دون معرفة خصومات الرطوبة وتكاليف النقل وهامش الربح الحقيقي.',
        'Livrer la récolte sans connaître les déductions d’humidité, les frais de transport et le gain net réel.'
      ),
      instantAnswer: copyFor(
        language,
        '240 Quintals Durum Wheat delivered to CCLS = 1,411,200 DA Net Payout after freight and standard grading.',
        '240 قنطار قمح صلب لدى التعاونية (CCLS) = 1,411,200 دج شيك صافي بعد مصاريف النقل والفرز.',
        '240 Quintaux de Blé Dur à la CCLS = 1 411 200 DA de chèque net après transport et agréage.'
      ),
      theEngine: 'Official OAIC / CCLS Scale (6,000 DA/Q Durum) & Wholesale Souk Matrix',
      gainMetric: copyFor(language, 'Total Financial Visibility Before Hauling to the Silo', 'وضوح مالي تام قبل نقل المحصول للمخزن أو السوق', 'Transparence financière totale avant transport au silo'),
      toolId: 'collapse_farm_economics',
      tabTarget: 'farm',
    },
  ];

  const roiItems = [
    {
      title: copyFor(language, 'Irrigation & Sonelgaz Energy', 'الري والطاقة (سونلغاز / مازوت)', 'Irrigation & Énergie Sonelgaz'),
      badPractice: copyFor(language, 'Pumping by habit: 6h/day on dry days', 'الضخ العشوائي: 6 ساعات يومياً بالتخمين', 'Pompage à l’aveugle : 6h/j'),
      withApp: copyFor(language, 'FAO-56 ET₀ match: 3h 15min precise runtime', 'الري الدقيق حسب ET₀: 3 ساعات و15 دقيقة', 'Pilotage FAO-56 : 3h 15min exact'),
      annualSaving: '25,000 – 60,000 DA / ha',
      icon: Fuel,
      color: '#0284c7',
    },
    {
      title: copyFor(language, 'Phytosanitary & Plant Protection', 'المبيدات وحماية النبات (INPV)', 'Traitements Phyto & DAR'),
      badPractice: copyFor(language, 'Spraying in afternoon Chehili heat (evaporation)', 'الرش وقت الظهيرة والشهيلي (تبخر الدواء)', 'Pulvérisation par temps chaud (évaporation)'),
      withApp: copyFor(language, 'Delta-T & wind drift safe morning lock', 'تأكيد نافذة الرش الآمنة صباحاً وفق دلتا-T', 'Fenêtre Delta-T sécurisée le matin'),
      annualSaving: '16,000 – 40,000 DA / ha',
      icon: ShieldCheck,
      color: '#0891b2',
    },
    {
      title: copyFor(language, 'Fertilizers & Nutrients (Asmidal)', 'الأسمدة والتغذية (أسميدال / فرتيال)', 'Engrais & Nutrition Minérale'),
      badPractice: copyFor(language, 'Over-applying Urea/DAP blindly', 'إضافة جرعات زائدة من اليوريا وDAP', 'Surdosage systématique en Urée/DAP'),
      withApp: copyFor(language, 'Exact 50kg bag counter per growth stage', 'حساب دقيق للأكياس (50 كغ) لكل مرحلة نمو', 'Calculateur exact de sacs de 50 kg par stade'),
      annualSaving: '20,000 – 45,000 DA / ha',
      icon: Beaker,
      color: '#16a34a',
    },
    {
      title: copyFor(language, 'Harvest Yield Preservation', 'حماية المردود وجودة المحصول', 'Préservation du Rendement'),
      badPractice: copyFor(language, 'Delayed fungal / frost intervention', 'التأخر في معالجة الأمراض الفطرية والصقيع', 'Traitement tardif des attaques fongiques'),
      withApp: copyFor(language, 'Predictive disease models & phenology alarms', 'تنبؤ استباقي بالأمراض وتنبيهات درجات الحرارة', 'Modèles prédictifs et alertes précoces'),
      annualSaving: '+15% to +25% Yield Retained',
      icon: TrendingUp,
      color: '#10b981',
    },
  ];

  const uniqueFeatures = [
    {
      icon: MapPin,
      title: copyFor(language, 'Grounded in Algerian Bioclimatic Hubs', 'مبني على أقاليم الجزائر الفلاحية', 'Calibré sur les Terroirs Algériens'),
      desc: copyFor(
        language,
        'Pre-calibrated weather & soil baselines for Mitidja, El Oued (Desert potato pivots), Biskra (Greenhouses & palms), Sétif & Constantine (High plateaus cerealiculture), and Mascara.',
        'إعدادات مسبقة لمناطق المتيجة، وادي سوف (محاور البطاطا الصحراوية)، بسكرة (البيوت المحمية والنخيل)، سطيف وقسنطينة (الحبوب)، ومعسكر والشلف.',
        'Paramétrages intégrés pour la Mitidja, El Oued (pivots de pomme de terre), Biskra (serres & dattes), Sétif (céréales des hauts plateaux) et Mascara.'
      ),
      badge: copyFor(language, 'Includes Chehili Heat Waves', 'حساب رياح الشهيلي الحارة', 'Modèle Canicule & Sirocco'),
    },
    {
      icon: ShieldAlert,
      title: copyFor(language, 'Complete 1,264 INPV Algerian Product Index', 'دليل المبيدات المعتمدة 1,264 INPV', 'Index Officiel INPV (1 264 Produits)'),
      desc: copyFor(
        language,
        'The actual commercial trade names and active substances sold in Algerian agricultural counters with official Pre-Harvest Intervals (DAR) and safety timers.',
        'الأسماء التجارية والمواد الفعالة المتوفرة في نقاط البيع الفلاحية الجزائرية مع مدة الأمان قبل الجني (DAR) المعتمدة رسمياً.',
        'Les vrais noms commerciaux vendus dans les comptoirs agricoles algériens avec délais avant récolte (DAR) légaux.'
      ),
      badge: copyFor(language, '100% Registered Trade Names', 'أسماء تجارية حقيقية', 'Noms Commerciaux Homologués'),
    },
    {
      icon: Coins,
      title: copyFor(language, 'Sonelgaz 51 BT & Official CCLS Grain Tariffs', 'تعريفات سونلغاز وأسعار الحبوب CCLS', 'Tarifs Sonelgaz 51 BT & Barème CCLS'),
      desc: copyFor(
        language,
        'Includes real utility prices: Sonelgaz Tariff 51 BT (4.50 DA/kWh), subsidized Mazout (29 DA/L), and official OAIC grain purchasing scales (6,000 DA/Q for Durum, 5,000 DA/Q for Soft Wheat).',
        'مدمج بتسعيرات الطاقة الحقيقية: سونلغاز تعريفة 51 (4.50 دج/كيلوواط)، المازوت (29 دج/لتر)، والأسعار الرسمية لشراء الحبوب (6,000 دج للقنطار قمح صلب).',
        'Intègre les vrais coûts : Sonelgaz Tarif 51 (4,50 DA/kWh), Mazout (29 DA/L) et le barème OAIC (6 000 DA/Q blé dur).'
      ),
      badge: copyFor(language, 'Real Economic Calculations', 'حسابات اقتصادية واقعية', 'Calculs Économiques Réels'),
    },
    {
      icon: Zap,
      title: copyFor(language, '100% Free & Offline-First (PWA)', 'مجاني تماماً ويعمل دون إنترنت (PWA)', '100% Gratuit & Hors-Ligne (PWA)'),
      desc: copyFor(
        language,
        'Runs directly on your smartphone in the middle of a remote parcel without cellular data. No credit card, no sign-up barrier, no cloud subscription.',
        'يعمل على هاتفك مباشرة في قلب الحقل حتى دون تغطية إنترنت. بدون بطاقة بنكية، بدون تسجيل معقد، ومجاني للأبد.',
        'Fonctionne sur smartphone au milieu de la parcelle sans réseau. Zéro carte bancaire, zéro inscription obligatoire.'
      ),
      badge: copyFor(language, 'Field Ready Everywhere', 'جاهز للميدان في كل مكان', 'Prêt pour le Terrain'),
    },
  ];

  const roleProfiles = [
    {
      title: copyFor(language, 'Farmer Mode (عمي الفلاح)', 'وضع الفلاح (عمي الفلاح)', 'Mode Agriculteur Terrain'),
      badge: copyFor(language, 'Simplicity & Action', 'بساطة وعمل ميداني', 'Simplicité & Action'),
      desc: copyFor(
        language,
        'Large tactile dials, direct valve runtimes (e.g. 2h 15m), 50kg bag fertilizer counts, green/red spraying traffic lights. Zero complex math jargon.',
        'أزرار ومؤشرات واضحة، مدة تشغيل الصمامات بالدقيقة، عدد أكياس التسميد (50 كغ)، ومؤشر ملون أخضر/أحمر للرش. بدون تعقيد رياضي.',
        'Grands cadrans, durée de vanne en minutes, nombre de sacs de 50 kg, feu vert/rouge de traitement. Zéro jargon mathématique.'
      ),
      features: [
        copyFor(language, 'Irrigation runtime in minutes', 'مدة تشغيل الري بالدقائق', 'Temps d’irrigation en minutes'),
        copyFor(language, '50kg fertilizer bag counter', 'حساب أكياس السماد (50 كغ)', 'Nombre exact de sacs d’engrais'),
        copyFor(language, 'Spray window traffic light (Green/Red)', 'إشارة خضراء/حمراء لرش المبيدات', 'Feu vert/rouge pour traiter'),
        copyFor(language, 'One-touch voice instructions', 'تسجيلات صوتية للمهام', 'Instructions audio simples'),
      ],
      color: '#16a34a',
      icon: Sprout,
    },
    {
      title: copyFor(language, 'Farm Manager Mode', 'وضع مسيّر المزرعة', 'Mode Gestionnaire d’Exploitation'),
      badge: copyFor(language, 'Economics & Efficiency', 'اقتصاد ومردودية', 'Rentabilité & Gestion'),
      desc: copyFor(
        language,
        'Multi-parcel tracking, water budget balancing, break-even per hectare, labor calendar, and input cost ledger for high profitability.',
        'متابعة الحقول المتعددة، ميزانية المياه، نقطة التعادل بالدينار للهكتار، جدول توزيع العمالة، وتتبع تكاليف المدخلات.',
        'Suivi multi-parcelles, bilan hydrique global, seuil de rentabilité au kg, calendrier de main-d’œuvre et coûts d’intrants.'
      ),
      features: [
        copyFor(language, 'DZD/kg break-even calculator', 'حساب نقطة التعادل (دج/كغ)', 'Seuil de rentabilité en DZD/kg'),
        copyFor(language, 'Labor calendar & person-days/ha', 'جدول العمالة وأيام العمل/هكتار', 'Calendrier de main-d’œuvre'),
        copyFor(language, 'Multi-parcel irrigation scheduling', 'جدولة ري الحقول المتعددة', 'Pilotage multi-secteurs'),
        copyFor(language, 'PDF audit and harvest reporting', 'تصدير تقارير PDF للمحصول', 'Rapports PDF imprimables'),
      ],
      color: '#0891b2',
      icon: DollarSign,
    },
    {
      title: copyFor(language, 'Agronomist & Researcher Mode', 'وضع المهندس الزراعي والباحث', 'Mode Agronome & Chercheur'),
      badge: copyFor(language, 'Scientific Precision', 'دقة علمية كاملة', 'Rigueur Scientifique'),
      desc: copyFor(
        language,
        'Full Penman-Monteith step equations, Vincenty geodesy, soil matrix chemistry (CEC, SAR, Osmotic pressure), and citations for literature-grade work.',
        'معادلات بنمان-مونتيث الكاملة، حسابات الجيوديسيا لفينسنتي، كيمياء التربة (CEC، SAR، الضغط الأسموزي)، ومراجع علمية معتمدة.',
        'Équations Penman-Monteith complètes, géodésie Vincenty, chimie du sol (CEC, SAR, pression osmotique) et références bibliographiques.'
      ),
      features: [
        copyFor(language, 'Full step-by-step formula derivations', 'خطوات حل المعادلات بالتفصيل', 'Dérivations mathématiques pas-à-pas'),
        copyFor(language, 'Soil saturation & CEC chemistry', 'تحليل تشبع القواعد وكيمياء التربة', 'Équilibre cationique et saturation CEC'),
        copyFor(language, 'GIS polygon imports (GeoJSON/KML)', 'استيراد حدود الحقول (GIS/KML)', 'Import polygones SIG (GeoJSON/KML)'),
        copyFor(language, 'Literature citations & academic export', 'مراجع أكاديمية وتصدير البيانات', 'Citations scientifiques et export brut'),
      ],
      color: '#6366f1',
      icon: Microscope,
    },
  ];

  return (
    <section id="offer" className="py-20 sm:py-28 bg-gradient-to-b from-background via-muted/30 to-background border-b relative overflow-hidden">
      {/* Background ambient decorative elements */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-400/40 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-4 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {copyFor(
                language,
                'WHAT WE OFFER · DIRECT FIELD VALUE',
                'ماذا نقدم للمزارع والمهندس · قيمة ميدانية فورية',
                'CE QUE NOUS OFFRONS · VALEUR TERRAIN IMMÉDIATE'
              )}
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4"
          >
            {isRTL ? (
              <>
                إجابات في 10 ثوانٍ. <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">وتوفير مالي حقيقي</span>.
              </>
            ) : language === 'fr' ? (
              <>
                Des réponses en 10 secondes. <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">Des gains financiers réels</span>.
              </>
            ) : (
              <>
                Answers in 10 Seconds. <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">Real Financial Gains</span>.
              </>
            )}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            {copyFor(
              language,
              'Formula Atlas turns complex agronomic science into clear daily actions. Stop guessing water hours, fertilizer bags, and spraying windows.',
              'يحول أطلس المعادلات العلوم الزراعية المعقدة إلى قرارات يومية واضحة. لا مزيد من التخمين في ساعات الري، أكياس السماد، وتوقيت الرش.',
              'Formula Atlas transforme les calculs agronomiques complexes en actions simples. Fini le hasard pour l’eau, les engrais et les traitements.'
            )}
          </motion.p>
        </div>

        {/* Primary Tab Navigation */}
        <div className="flex justify-center mb-10 overflow-x-auto pb-2">
          <div className="inline-flex p-1.5 rounded-2xl bg-muted/80 border border-border/80 shadow-inner">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap relative ${
                    isActive
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeOfferTab"
                      className="absolute inset-0 bg-card rounded-xl border border-border/60 shadow-sm -z-10"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                  <span>{tab.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Display */}
        <AnimatePresence mode="wait">
          {/* ============================================================== */}
          {/* TAB 1: The 4 Daily Questions */}
          {/* ============================================================== */}
          {activeTab === 'questions' && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {dailyQuestions.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = activeQuestion === idx;
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -3 }}
                      onClick={() => setActiveQuestion(idx)}
                      className={`rounded-2xl border-2 p-6 transition-all cursor-pointer relative overflow-hidden bg-card ${
                        isSelected
                          ? 'border-emerald-500 shadow-md shadow-emerald-500/10'
                          : 'border-border/80 hover:border-muted-foreground/40'
                      }`}
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                            style={{ backgroundColor: item.color + '20' }}
                          >
                            <Icon className="h-5 w-5" style={{ color: item.color }} />
                          </div>
                          <div>
                            <h3 className="font-bold text-base text-foreground">{item.question}</h3>
                            <span className="text-[10px] font-mono text-muted-foreground">{item.theEngine}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {copyFor(language, '10s Answer', 'إجابة في 10ث', 'En 10s')}
                        </span>
                      </div>

                      {/* Problem vs Instant Answer */}
                      <div className="space-y-3 mb-4">
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                          <div className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>{copyFor(language, 'The Costly Guesswork:', 'المشكلة والتخمين المكلف:', 'Le problème du hasard :')}</span>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">{item.farmerProblem}</p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs">
                          <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span>{copyFor(language, 'Our Instant Field Answer:', 'إجابة التطبيق الفورية والدقيقة:', 'La réponse instantanée du système :')}</span>
                          </div>
                          <p className="font-semibold text-foreground leading-relaxed">{item.instantAnswer}</p>
                        </div>
                      </div>

                      {/* Gain Pill & Action CTA */}
                      <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                          <Coins className="h-4 w-4" />
                          <span>{item.gainMetric}</span>
                        </div>
                        <Link
                          href="/app"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-emerald-600 transition-colors"
                        >
                          <span>{copyFor(language, 'Test in App', 'جرّب في التطبيق', 'Tester')}</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Bottom Quick Advice Callout */}
              <div className="rounded-2xl border border-emerald-300/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      {copyFor(language, 'Need to run these live right now?', 'هل تريد تطبيق هذه الحسابات فوراً في مزرعتك؟', 'Voulez-vous tester ces outils en direct ?')}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {copyFor(
                        language,
                        'Open the live workspace to connect your wilaya, soil type, and crop parcel in 1 click.',
                        'افتح المنصة مباشرة واختر ولايتك ونوع تربتك ومحصولك بضغطة زر واحدة.',
                        'Lancez l’application pour configurer votre wilaya, sol et culture en 1 clic.'
                      )}
                    </p>
                  </div>
                </div>
                <Link
                  href="/app"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-all shrink-0 hover:scale-105"
                >
                  {copyFor(language, 'Launch Live Workspace', 'فتح المنصة الميدانية', 'Ouvrir l’Application')}
                </Link>
              </div>
            </motion.div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: ROI & Financial Gains */}
          {/* ============================================================== */}
          {activeTab === 'roi' && (
            <motion.div
              key="roi"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {roiItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={i}
                      whileHover={{ y: -4 }}
                      className="rounded-2xl border bg-card p-5 shadow-sm flex flex-col justify-between text-left"
                      style={{ borderTopWidth: 4, borderTopColor: item.color }}
                    >
                      <div>
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-sm"
                          style={{ backgroundColor: item.color + '20' }}
                        >
                          <Icon className="h-5 w-5" style={{ color: item.color }} />
                        </div>
                        <h3 className="font-bold text-sm mb-2">{item.title}</h3>

                        <div className="space-y-2 mb-4 text-xs">
                          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-muted-foreground">
                            <span className="font-bold text-rose-600 block text-[10px] uppercase">
                              {copyFor(language, 'Without App', 'بدون التطبيق', 'Sans l’App')}
                            </span>
                            {item.badPractice}
                          </div>

                          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-foreground font-medium">
                            <span className="font-bold text-emerald-600 block text-[10px] uppercase">
                              {copyFor(language, 'With AgroAtlas', 'مع المنصة', 'Avec AgroAtlas')}
                            </span>
                            {item.withApp}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <div className="text-[10px] text-muted-foreground uppercase font-bold">
                          {copyFor(language, 'Estimated Annual Gain', 'التوفير السنوي التقديري', 'Gain Annuel Estimé')}
                        </div>
                        <div className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {item.annualSaving}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* ROI Summary Box */}
              <div className="rounded-2xl border bg-gradient-to-br from-emerald-900 via-teal-900 to-green-950 text-white p-6 sm:p-8 shadow-xl text-left">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="md:col-span-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold mb-3">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>{copyFor(language, 'Direct Economic Return', 'عائد اقتصادي مباشر ومضمون', 'Retour sur Investissement Direct')}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">
                      {copyFor(
                        language,
                        'Average Estimated Farm Savings: 60,000 to 140,000 DA per Hectare / Year',
                        'متوسط التوفير التقديري: 60,000 إلى 140,000 دج لكل هكتار سنوياً',
                        'Économie moyenne estimée : 60 000 à 140 000 DA par hectare / an'
                      )}
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                      {copyFor(
                        language,
                        'By eliminating just one failed phytosanitary spray treatment and optimizing pumping hours under Sonelgaz 51 BT tariff, the system pays for itself on Day 1.',
                        'بمجرد تفادي معالجة كيميائية واحدة ضائعة وضبط ساعات الضخ وفق تسعيرة سونلغاز 51، تحقق المنصة ربحاً مباشراً من اليوم الأول.',
                        'En évitant un seul passage de traitement raté et en optimisant le pompage Sonelgaz, le gain est immédiat.'
                      )}
                    </p>
                  </div>
                  <div className="text-center md:text-right">
                    <Link
                      href="/app"
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-emerald-900 font-bold text-sm shadow-lg hover:bg-emerald-50 transition-all hover:scale-105"
                    >
                      <span>{copyFor(language, 'Calculate Your Farm ROI', 'احسب عائد مزرعتك الآن', 'Calculer Vos Économies')}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: Algerian Superpowers & Unique Tech */}
          {/* ============================================================== */}
          {activeTab === 'unique' && (
            <motion.div
              key="unique"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              {uniqueFeatures.map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <motion.div
                    key={i}
                    whileHover={{ y: -4 }}
                    className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between text-left relative overflow-hidden"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-sm">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {feat.badge}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-foreground mb-2">{feat.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">{feat.desc}</p>
                    </div>

                    <div className="pt-3 border-t flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <span>{copyFor(language, 'Integrated in all modules', 'مدمج في كافة الأدوات والحاسبات', 'Intégré dans tous les modules')}</span>
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: Tailored by Role */}
          {/* ============================================================== */}
          {activeTab === 'roles' && (
            <motion.div
              key="roles"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-5"
            >
              {roleProfiles.map((role, i) => {
                const Icon = role.icon;
                return (
                  <motion.div
                    key={i}
                    whileHover={{ y: -4 }}
                    className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between text-left"
                    style={{ borderTopWidth: 4, borderTopColor: role.color }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
                          style={{ backgroundColor: role.color + '20' }}
                        >
                          <Icon className="h-5 w-5" style={{ color: role.color }} />
                        </div>
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ backgroundColor: role.color + '15', color: role.color }}
                        >
                          {role.badge}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-foreground mb-2">{role.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-5">{role.desc}</p>

                      <div className="space-y-2 mb-6">
                        {role.features.map((f, fi) => (
                          <div key={fi} className="flex items-center gap-2 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: role.color }} />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Link
                      href="/app"
                      className="w-full py-2.5 rounded-xl border text-xs font-bold text-center block transition-all hover:bg-muted"
                      style={{ borderColor: role.color + '40', color: role.color }}
                    >
                      {copyFor(language, 'Enter in this Mode', 'الدخول بهذا الوضع', 'Accéder dans ce mode')}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
