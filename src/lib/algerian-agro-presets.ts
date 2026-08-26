export interface AlgerianAgroPreset {
  id: string;
  name: { en: string; ar: string; fr: string };
  region: { en: string; ar: string; fr: string };
  badge: { en: string; ar: string; fr: string };
  emoji: string;
  cropId: string;
  areaHa: number;
  plantingDate: string;
  avgET0: number; // mm/day
  irrigationSystem: 'drip' | 'sprinkler' | 'furrow' | 'rainfed';
  description: { en: string; ar: string; fr: string };
  soilType: { en: string; ar: string; fr: string };
  waterCostDzdPerM3: number;
  expectedYieldTonsHa: number;
  sellingPriceDzdPerTon: number;
  agronomicNote: { en: string; ar: string; fr: string };
}

export const ALGERIAN_AGRO_PRESETS: AlgerianAgroPreset[] = [
  {
    id: 'biskra_tomato_greenhouse',
    name: {
      en: 'Biskra Winter Protected Tomato',
      ar: 'طماطم بسكرة الشتوية (بيوت بلاستيكية)',
      fr: 'Tomate primeur sous serre - Biskra / Ziban',
    },
    region: {
      en: 'Biskra / Ziban (Arid Oasis)',
      ar: 'بسكرة / منطقة الزيبان',
      fr: 'Biskra / Ziban (Zone Aride)',
    },
    badge: {
      en: 'High Yield Drip Greenhouse',
      ar: 'بيوت محمية عالية الإنتاجية',
      fr: 'Serres haut rendement goutte-à-goutte',
    },
    emoji: '🍅',
    cropId: 'tomato',
    areaHa: 2,
    plantingDate: '2026-10-01',
    avgET0: 4.8,
    irrigationSystem: 'drip',
    description: {
      en: 'Intensive drip fertigation inside multi-chapelle tunnel greenhouses. High early-market price window in Northern cities.',
      ar: 'تسميد وري قطري مكثف داخل البيوت البلاستيكية. نافذة أسعار بواكير ممتازة لأسواق الشمال.',
      fr: 'Fertigation intensive au goutte-à-goutte sous serres tunnels. Excellente valorisation précoce sur les marchés du nord.',
    },
    soilType: {
      en: 'Sandy-loam, well drained, mild salinity (ECw 2.8 dS/m)',
      ar: 'رملية طميية، تصريف جيد، ملوحة خفيفة',
      fr: 'Sablo-limoneux, bien drainé, salinité modérée',
    },
    waterCostDzdPerM3: 22,
    expectedYieldTonsHa: 95,
    sellingPriceDzdPerTon: 65000,
    agronomicNote: {
      en: 'Watch for Tuta absoluta & Botrytis during winter humidity peaks. Maintain Calcium/Potassium balance during truss filling.',
      ar: 'راقب حافرة الطماطم (توتا أبسوليوتا) والعفن الرمادي مع رطوبة الشتاء. اضبط توازن الكالسيوم/البوتاسيوم أثناء امتلاء العناقيد.',
      fr: 'Surveiller Tuta absoluta et le botrytis en hiver. Maintenir le ratio Ca/K au grossissement des bouquets.',
    },
  },
  {
    id: 'el_oued_pivot_potato',
    name: {
      en: 'El Oued Desert Center-Pivot Potato',
      ar: 'بطاطا الوادي (ري محوري في الكثبان الرملية)',
      fr: 'Pomme de terre sous pivot - Oued Souf',
    },
    region: {
      en: 'El Oued / Souf (Erg Desert Sand)',
      ar: 'الوادي / وادي سوف (رمال العرق الشرقي)',
      fr: 'El Oued / Oued Souf (Erg saharien)',
    },
    badge: {
      en: 'High Volume Center Pivot',
      ar: 'ري محوري صحراوي عالي الإنتاج',
      fr: 'Pivots géants sur sables',
    },
    emoji: '🥔',
    cropId: 'potato',
    areaHa: 25,
    plantingDate: '2026-10-15',
    avgET0: 6.2,
    irrigationSystem: 'sprinkler',
    description: {
      en: 'Pivot irrigation on free-draining desert sand dunes. Rapid tuber bulking with high frequency pulse watering and deep boreholes.',
      ar: 'ري محوري بالرش على كثبان الرمال الصحراوية نفاذة المياه. وتيرة ري مكثفة وسريعة مع آبار ألبيان عميقة.',
      fr: 'Pivots sur sables éoliens filtrants. Cycles d’irrigation fractionnés à haute fréquence et forages albien.',
    },
    soilType: {
      en: 'Pure Desert Dune Sand (92% sand, zero organic matter)',
      ar: 'رمال صحراوية نقية (92% رمل، مادة عضوية منعدمة)',
      fr: 'Sable éolien pur (92% sable, MO très faible)',
    },
    waterCostDzdPerM3: 16,
    expectedYieldTonsHa: 38,
    sellingPriceDzdPerTon: 58000,
    agronomicNote: {
      en: 'Leaching risk for Nitrate is high; split nitrogen into daily pulses. Apply protective sprays for Alternaria blight.',
      ar: 'خطر غسيل النيتروجين مرتفع جدا في الرمال؛ وزّع الآزوت يوميا مع ماء الري. وقاية مستمرة من اللفحة المبكرة (الألترناريا).',
      fr: 'Risque de lessivage azoté très élevé ; fractionner la fertigation. Traitements préventifs contre l’alternariose.',
    },
  },
  {
    id: 'setif_high_plains_cereal',
    name: {
      en: 'Sétif High Plains Durum Wheat',
      ar: 'قمح صلب بالهضاب العليا (سطيف / العلمة)',
      fr: 'Blé dur des Hautes Plaines - Sétif / El Eulma',
    },
    region: {
      en: 'Sétif / Bordj / Tiaret (High Plains)',
      ar: 'سطيف / البرج / تيارت (الهضاب العليا)',
      fr: 'Hautes Plaines Céréalières (Sétif/Tiaret)',
    },
    badge: {
      en: 'Supplemental Spring Irrigation',
      ar: 'ري تكميلي ربيعي لتفادي الجفاف',
      fr: 'Irrigation de complément au tallage/gonflement',
    },
    emoji: '🌾',
    cropId: 'wheat',
    areaHa: 50,
    plantingDate: '2026-11-10',
    avgET0: 3.5,
    irrigationSystem: 'sprinkler',
    description: {
      en: 'Strategic durum wheat crop utilizing winter rainfall with targeted 50-80mm sprinkler booster at heading & grain-fill.',
      ar: 'زراعة استراتيجية للقمح الصلب تعتمد على أمطار الشتاء مع ري تكميلي حاسم (50-80 مم) عند طرد السنابل وتعبئة الحبوب.',
      fr: 'Culture stratégique de blé dur valorisant la pluviométrie hivernale avec apports de complément au gonflement et remplissage.',
    },
    soilType: {
      en: 'Clay-loam, high water retention, prone to surface crusting',
      ar: 'طينية طميية، احتفاظ عالي بالماء، قابلة للتقشر السطحي',
      fr: 'Argilo-limoneux profond, bonne rétention hydrique',
    },
    waterCostDzdPerM3: 14,
    expectedYieldTonsHa: 4.8,
    sellingPriceDzdPerTon: 60000,
    agronomicNote: {
      en: 'OAIC subsidized durum wheat price (6,000 DZD/ql). Frost risk in March-April; apply supplemental irrigation before hot Sirocco.',
      ar: 'سعر دعم ديوان الحبوب OAIC (6000 دج/ق). خطر صقيع ربيعي في مارس-أفريل؛ ري تكميلي عاجل قبل هبوب رياح السيروكو (الشهيلي).',
      fr: 'Prix garanti OAIC (6 000 DZD/ql). Risque de gel tardif et sirocco ; irriguer 48h avant vague de chaleur.',
    },
  },
  {
    id: 'mitidja_citrus_orchard',
    name: {
      en: 'Mitidja Valley Citrus Orchard (Clementine)',
      ar: 'بساتين حمضيات سهل متيجة (كليمونتين)',
      fr: 'Verger d’agrumes - Plaine de la Mitidja',
    },
    region: {
      en: 'Blida / Boufarik / Tipaza (Mitidja Plain)',
      ar: 'البليدة / بوفاريك / تيبازة (متيجة)',
      fr: 'Blida / Tipaza / Mitidja sub-humide',
    },
    badge: {
      en: 'Precision Micro-Sprinkler & Drip',
      ar: 'ري قطري ورش دقيق تحت الأشجار',
      fr: 'Micro-aspersion sous frondaison',
    },
    emoji: '🍊',
    cropId: 'citrus',
    areaHa: 8,
    plantingDate: '2026-03-01',
    avgET0: 4.2,
    irrigationSystem: 'drip',
    description: {
      en: 'Mature citrus orchard on deep fertile alluvial soils with drip lines. Focus on fruit sizing during summer drought stress.',
      ar: 'بساتين حمضيات منتجة على تربة لحقية خصبة بمتيجة. تركيز الري على تكبير حجم الثمار وتفادي تساقطها في حر الصيف.',
      fr: 'Vergers adultes sur alluvions fertiles de la Mitidja. Maîtrise du calibre et réduction de la chute physiologique estivale.',
    },
    soilType: {
      en: 'Deep alluvial loam, rich in organic matter (2.4% OM)',
      ar: 'تربة لحقية عميقة وخصبة، غنية بالمادة العضوية',
      fr: 'Alluvionnaire profond, riche en matière organique',
    },
    waterCostDzdPerM3: 20,
    expectedYieldTonsHa: 32,
    sellingPriceDzdPerTon: 95000,
    agronomicNote: {
      en: 'Monitor Ceratitis (Mediterranean fruit fly) from September. Zinc & Manganese foliar sprays in Spring flush.',
      ar: 'مراقبة ذبابة الفاكهة (السيراتيت) ابتداء من سبتمبر. رش ورقي بالزنك والمنغنيز مع نمو النموات الربيعية الجديدة.',
      fr: 'Surveillance pièges cératite dès septembre. Apports foliaires Oligo (Zn, Mn) au débourrement printanier.',
    },
  },
  {
    id: 'ghardaia_alfalfa_fodder',
    name: {
      en: 'Ghardaïa Pivot Fodder Alfalfa (Luzerne)',
      ar: 'فصة علفية تحت المحاور (غرداية / المنيعة)',
      fr: 'Luzerne fourragère sous pivot - Ghardaïa / El Menia',
    },
    region: {
      en: 'Ghardaïa / El Menia (Sahara Basin)',
      ar: 'غرداية / المنيعة (الصحراء الوسطى)',
      fr: 'Ghardaïa / El Menia (Bassin Saharien)',
    },
    badge: {
      en: 'Multi-Cut Pivot Forage',
      ar: 'أعلاف محورية متعددة الحشات (8-10 حشات)',
      fr: 'Fourrage intensif 8 à 10 coupes/an',
    },
    emoji: '🌿',
    cropId: 'alfalfa',
    areaHa: 40,
    plantingDate: '2026-09-20',
    avgET0: 7.0,
    irrigationSystem: 'sprinkler',
    description: {
      en: 'High-protein perennial forage under center pivots. Constant irrigation replenishment feeding Sahara dairy and livestock basins.',
      ar: 'إنتاج علفي مكثف عالي البروتين لتغذية أحواض الألبان والمواشي بالصحراء مع 8 إلى 10 حشات سنويا.',
      fr: 'Fourrage pérenne haute protéine alimentant les grands bassins laitiers du Sud. 8 à 10 fauches par an.',
    },
    soilType: {
      en: 'Calcareous sandy-loam, gypsum presence (ECw 3.5 dS/m)',
      ar: 'رملية طميية كلسية وجبسية، ملوحة متوسطة',
      fr: 'Sablo-limoneux calcaire et gypseux',
    },
    waterCostDzdPerM3: 15,
    expectedYieldTonsHa: 85, // Total annual fresh forage
    sellingPriceDzdPerTon: 24000,
    agronomicNote: {
      en: 'Requires high phosphorus at establishment (P2O5). Stop watering 3 days before mowing, resume immediately post baling.',
      ar: 'احتياج عالي للفوسفور عند التأسيس. إيقاف الري قبل الحش بـ 3 أيام واستئنافه فورا بعد جمع البالات.',
      fr: 'Forte exigence en phosphore au semis. Arrêt d’eau 3 jours avant fauche et reprise immédiate après ramassage.',
    },
  },
];
