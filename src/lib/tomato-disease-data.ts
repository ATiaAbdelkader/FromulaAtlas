export interface TomatoDisease {
  id: string;
  name: string;
  name_ar: string;
  name_fr: string;
  scientificName: string;
  pathogenType: 'fungal' | 'bacterial' | 'viral' | 'nematode' | 'physiological';
  organ: 'roots_crown' | 'stem_collar' | 'leaves' | 'flowers' | 'fruits';
  severity: 'low' | 'moderate' | 'high' | 'devastating';
  symptomSummary: string;
  symptomSummary_ar: string;
  symptomSummary_fr: string;
  epidemiology: {
    favorableTemp: string;
    favorableHumidity: string;
    transmissionVectors: string;
    transmissionVectors_ar: string;
    transmissionVectors_fr: string;
  };
  diagnosticFeatures: string[];
  diagnosticFeatures_ar: string[];
  diagnosticFeatures_fr: string[];
  ipmCulturalPractices: string[];
  ipmCulturalPractices_ar: string[];
  biologicalControl: string[];
  biologicalControl_ar: string[];
  chemicalControl: {
    activeSubstances: string[];
    activeSubstances_ar: string[];
    fracCodes: string[];
    phiDays: string;
    precautions: string;
    precautions_ar: string;
  };
  resistantGenes: string[];
}

export const DISEASE_ORGANS = [
  { id: 'roots_crown', label: 'Roots & Crown / Collar', label_ar: 'الجذور والتاج وقاعدة الساق', label_fr: 'Racines, Collet & Couronne', color: '#854d0e' },
  { id: 'stem_collar', label: 'Main Stem & Petioles', label_ar: 'الساق الرئيسي والأعناق', label_fr: 'Tige Principale & Pétioles', color: '#16a34a' },
  { id: 'leaves', label: 'Foliage & Leaves', label_ar: 'المجموع الخضري والأوراق', label_fr: 'Feuilles & Folioles', color: '#10b981' },
  { id: 'flowers', label: 'Flowers & Pedicels', label_ar: 'الأزهار والعناقيد الزهرية', label_fr: 'Fleurs & Bouquets', color: '#eab308' },
  { id: 'fruits', label: 'Fruits & Calyx', label_ar: 'الثمار والكأس', label_fr: 'Fruits & Calice', color: '#dc2626' },
] as const;

export const TOMATO_DISEASES_DATA: TomatoDisease[] = [
  // ==========================================
  // 1. ROOTS & CROWN / COLLAR
  // ==========================================
  {
    id: 'fusarium-wilt',
    name: 'Fusarium Wilt',
    name_ar: 'الذبول الفيوزارمي (الفيوزاريوم)',
    name_fr: 'Flétrissement Fusarien (Fusariose)',
    scientificName: 'Fusarium oxysporum f. sp. lycopersici (Races 1, 2, 3)',
    pathogenType: 'fungal',
    organ: 'roots_crown',
    severity: 'devastating',
    symptomSummary: 'Unilateral "one-sided" yellowing and wilting of lower leaves, accompanied by a distinct dark chocolate-brown discoloration of the xylem vascular ring.',
    symptomSummary_ar: 'اصفرار وذبول أحادي الجانب على فرع أو شطر واحد من النبات، مع تلون بني كستنائي داكن في الحلقات الوعائية الخشبية عند شق الساق طولياً.',
    symptomSummary_fr: 'Jaunissement et flétrissement unilatéral d’une seule branche, avec brunissement vasculaire brun chocolat caractéristique du xylème.',
    epidemiology: {
      favorableTemp: '27°C - 30°C (Warm/Hot soils)',
      favorableHumidity: 'Moderate to high soil moisture, acidic sandy soils (pH 5.0 - 6.5)',
      transmissionVectors: 'Soil-borne chlamydospores persisting 10+ years, infected seedlings, irrigation runoff, machinery',
      transmissionVectors_ar: 'جراثيم كلاميدية كامنة بالتربة لأكثر من 10 سنوات، الشتلات المصابة، مياه الري، المعدات الزراعية',
      transmissionVectors_fr: 'Chlamydospores dans le sol (10+ ans), plants infectés, eau d’irrigation et outils'
    },
    diagnosticFeatures: [
      'Unilateral (one-sided) leaf yellowing and flagging during midday heat',
      'Diagnostic dark brown xylem streak visible when stem is sliced open near crown',
      'No milky bacterial ooze when cut stem is placed in clear water (unlike Ralstonia)',
      'Roots remain externally intact until late disease stages'
    ],
    diagnosticFeatures_ar: [
      'اصفرار وذبول نصفي أحادي لفرع واحد من النبات وقت حرارة الظهيرة',
      'تلون بني داكن واضح للأوعية الخشبية عند كشط أو شق قاعدة الساق طولياً',
      'عدم خروج أي تدفق بكتيري أبيض حليبي عند غمر طرف الساق في الماء (للتفرقة عن الرالستونيا)',
      'سلامة الجذور الخارجية ظاهرياً حتى المراحل المتأخرة من الذبول'
    ],
    diagnosticFeatures_fr: [
      'Flétrissement unilatéral d’un côté de la plante aux heures chaudes',
      'Brunissement vasculaire très net du xylème à la coupe longitudinale',
      'Test d’écoulement négatif dans l’eau (pas de filet bactérien blanchâtre)',
      'Racines externes d’aspect normal au début'
    ],
    ipmCulturalPractices: [
      'Grafting on resistant rootstocks carrying Fol: 1, 2, 3 resistance genes (e.g. Maxifort, Emperador)',
      'Raise soil pH to 6.8 - 7.2 using agricultural lime to suppress fungal sporulation',
      'Strict 4 to 5 year crop rotation with non-host crops (avoid Solanaceous crops)',
      'Solarization with clear transparent polyethylene mulch for 6-8 weeks in summer'
    ],
    ipmCulturalPractices_ar: [
      'التطعيم على أصول مقاومة لسلالات الفيوزاريوم الثلاثة (مثل ماكسيفورت، إمبيرادور)',
      'رفع حموضة التربة بالجير الزراعي إلى pH 6.8 - 7.2 لتثبيط إنبات جراثيم الفطر',
      'دورة زراعية من 4 إلى 5 سنوات وتجنب زراعة العائلة الباذنجانية',
      'التعقيم الشمسي بتغطية التربة بالبلاستيك الشفاف لمدة 6-8 أسابيع صيفاً'
    ],
    biologicalControl: [
      'Root inoculation at transplanting with Trichoderma harzianum (strain T-22) or Trichoderma asperellum',
      'Soil drench with Bacillus subtilis / Bacillus amyloliquefaciens (FZB24) to colonize rhizosphere'
    ],
    biologicalControl_ar: [
      'غمر جذور الشتلات عند الزراعة بفطر التريكوديرما (Trichoderma harzianum)',
      'حقن بكتيريا المكافحة الحيوية باسيلس سبتيلس (Bacillus subtilis) حول الجذور'
    ],
    chemicalControl: {
      activeSubstances: ['Azoxystrobin + Difenoconazole', 'Thiophanate-Methyl', 'Fludioxonil + Metalaxyl-M'],
      activeSubstances_ar: ['أزوكسيستروبين + ديفينوكونازول', 'ثيوفانات الميثيل', 'فلوديوكسونيل + ميتالاكسيل-إم'],
      fracCodes: ['FRAC 11 + 3', 'FRAC 1', 'FRAC 12 + 4'],
      phiDays: '14 - 28 days (soil drench only at transplant stage)',
      precautions: 'Fungicides are mostly preventative; curatively ineffective once xylem is plugged.',
      precautions_ar: 'المبيدات وقائية فقط وغير مجدية علاجياً بعد انسداد الحزم الوعائية الخشبية.'
    },
    resistantGenes: ['I (Race 1)', 'I-2 (Race 2)', 'I-3 / I-7 (Race 3)']
  },
  {
    id: 'bacterial-wilt',
    name: 'Bacterial Wilt (Southern Bacterial Wilt)',
    name_ar: 'الذبول البكتيري (الرالستونيا)',
    name_fr: 'Flétrissement Bactérien (Ralstonia)',
    scientificName: 'Ralstonia solanacearum (Race 1 & Race 3 / Biovar 2)',
    pathogenType: 'bacterial',
    organ: 'roots_crown',
    severity: 'devastating',
    symptomSummary: 'Extremely rapid daytime wilting of the entire plant while foliage remains completely green, followed by dark water-soaked vascular collapse and intense white bacterial streaming in water.',
    symptomSummary_ar: 'ذبول مفاجئ وسريع لكامل النبات خلال ساعات النهار مع بقاء الأوراق خضراء دون اصفرار مسبق، وخروج خيوط بكتيرية بيضاء حليبية كثيفة عند وضع الساق في كأس ماء.',
    symptomSummary_fr: 'Flétrissement foudroyant de la plante entière conservant sa couleur verte, avec écoulement bactérien blanc laiteux intense dans un verre d’eau.',
    epidemiology: {
      favorableTemp: '30°C - 35°C (High soil and air temperatures)',
      favorableHumidity: 'Saturated, waterlogged soils with poor drainage',
      transmissionVectors: 'Soil water movement, root-to-root contact, root-knot nematode wounds, infected seed tubers/seedlings',
      transmissionVectors_ar: 'حركة مياه الري، تلامس الجذور، جروح النيماتودا، الشتلات المصابة',
      transmissionVectors_fr: 'Eau d’irrigation, blessures racinaires (nématodes), outils et sol contaminé'
    },
    diagnosticFeatures: [
      'Rapid "green wilting" where whole plant collapses without prior chlorosis',
      'Diagnostic Vascular Streaming Test: Cut lower stem suspended in clean water releases milky white bacterial threads within 60 seconds',
      'Adventitious aerial rootlets sprouting on lower stem',
      'Pith turns brown, water-soaked, and hollow near the soil level'
    ],
    diagnosticFeatures_ar: [
      'الذبول الأخضر المفاجئ: انهيار النبات كاملاً وهو محتفظ بلونه الأخضر',
      'اختبار التدفق البكتيري: شق قطعة من الساق وغمرها في كأس ماء يطلق خيوطاً بكتيرية بيضاء حليبية متدفقة خلال 60 ثانية',
      'خروج جذور هوائية عرضية كثيفة على الساق قرب سطح التربة',
      'تآكل مائي وتحلل نخاع الساق الداخلي'
    ],
    diagnosticFeatures_fr: [
      'Flétrissement brutal "vert" sans jaunissement préalable',
      'Test du verre d’eau positif : filets bactériens laiteux s’écoulant de la tige',
      'Émission abondante de racines adventives sur la tige basse',
      'Moelle décomposée et spongieuse au collet'
    ],
    ipmCulturalPractices: [
      'Plant only on certified clean soils or adopt soilless substrate systems (cocopeat/rockwool)',
      'Graft onto resistant wild eggplant / tomato rootstocks (*Solanum torvum*)',
      'Improve soil drainage, construct raised beds, and avoid excess flood irrigation',
      'Sanitize all pruning knives with 70% alcohol or 10% sodium hypochlorite'
    ],
    ipmCulturalPractices_ar: [
      'الزراعة في تربة خالية معقمة أو استخدام الزراعة المائية وبدائل التربة',
      'التطعيم على أصول باذنجان برية مقاومة (مثل Solanum torvum)',
      'إنشاء مصاطب مرتفعة وتحسين الصرف وتجنب الغمر الزائد',
      'تعقيم أدوات التقليم بمحلول الكلور أو الكحول بين النباتات'
    ],
    biologicalControl: [
      'Rhizosphere colonization with antagonist *Pseudomonas fluorescens* or *Bacillus velezensis*',
      'Biofumigation with Brassica green manures (isothiocyanates)'
    ],
    biologicalControl_ar: [
      'تطعيم الجذور ببكتيريا سودوموناس فلورسنس (Pseudomonas fluorescens)',
      'التدخين الحيوي بمحاصيل الخردل والصليبيات المحتوية على الإيزوثيوسيانات'
    ],
    chemicalControl: {
      activeSubstances: ['Copper Hydroxide + Kasugamycin (in countries where registered)', 'Oxytetracycline (strictly regulated)', 'Peracetic acid drench'],
      activeSubstances_ar: ['هيدروكسيد النحاس + كاسوجامايسين', 'حمض البيرأسيتيك لتطهير التربة'],
      fracCodes: ['FRAC M01 + 24'],
      phiDays: 'Varies by local regulation',
      precautions: 'Antibiotics face severe regulatory bans; chemical controls have limited efficacy once systemic.',
      precautions_ar: 'المكافحة الكيميائية محدودة الفاعلية بعد دخول البكتيريا إلى الأوعية الجهازية.'
    },
    resistantGenes: ['Bwr-12', 'Bwr-6 (Partial resistance)']
  },
  {
    id: 'root-knot-nematode',
    name: 'Root-Knot Nematodes',
    name_ar: 'نيماتودا تعقد الجذور',
    name_fr: 'Nématodes à Galles Racinaire',
    scientificName: 'Meloidogyne incognita / Meloidogyne javanica',
    pathogenType: 'nematode',
    organ: 'roots_crown',
    severity: 'high',
    symptomSummary: 'Formation of severe spherical swollen galls and beads on the root system, leading to unthrifty stunted growth, nutrient chlorosis, and midday temporary wilting.',
    symptomSummary_ar: 'تكون عقد وأورام وانتفاخات كروية واضحة على كامل المجموع الجذري تشبه الخرز، مسببة ضعف وتقزم النبات واصفرار الأوراق والذبول وقت الظهيرة.',
    symptomSummary_fr: 'Formation de volumineuses galles et nodosités sur les racines, provoquant nanisme, chloroses nutritionnelles et flétrissement diurne.',
    epidemiology: {
      favorableTemp: '25°C - 30°C (Inactivated below 15°C or above 40°C)',
      favorableHumidity: 'Light sandy-loam soils with free moisture films for juvenile migration',
      transmissionVectors: 'Infected nursery seedlings, irrigation water, contaminated farming tools and footwear',
      transmissionVectors_ar: 'شتلات المشاتل المصابة، مياه الري الجارية، التربة العالقة بالمعدات والأحذية',
      transmissionVectors_fr: 'Plants de pépinière contaminés, eau de drainage, outils de travail du sol'
    },
    diagnosticFeatures: [
      'Massive swollen galls ("beaded necklace" appearance) throughout the root system',
      'General plant stunting and severe deficiency symptoms despite high fertilizer rates',
      'Midday reversible wilting when transpiration pull exceeds damaged root uptake',
      'Premature plant death under heavy fruit load'
    ],
    diagnosticFeatures_ar: [
      'عقد وتورمات منتفخة كالخرز على امتداد الشعيرات والجذور',
      'تقزم عام وأعراض نقص عناصر حادة رغم التسميد الكثيف',
      'ذبول مؤقت وقت الظهيرة يعود للانتصاب ليلاً لضعف امتصاص الجذور التالفة',
      'موت النبات المبكر مع اكتمال حمل الثمار'
    ],
    diagnosticFeatures_fr: [
      'Galles nodulaires en chapelet déformant l’ensemble du système racinaire',
      'Chétivité générale et carences multiples malgré une fertilisation abondante',
      'Flétrissement réversible aux heures les plus chaudes',
      'Sénescence précoce de la culture lors du pic de charge'
    ],
    ipmCulturalPractices: [
      'Use certified nematode-resistant rootstocks or varieties carrying the *Mi-1* gene',
      'Note: *Mi* gene resistance breaks down when soil temperatures exceed 28°C!',
      'Crop rotation with non-hosts like French Marigold (*Tagetes patula*) or Sunn Hemp (*Crotalaria*)',
      'High-temperature solarization combined with organic compost incorporation'
    ],
    ipmCulturalPractices_ar: [
      'زراعة هجن أو أصول تطعيم حاملة لجين المقاومة Mi-1',
      'تنبيه: تنكسر مقاومة جين Mi عند ارتفاع حرارة التربة فوق 28 مئوية!',
      'زراعة نباتات القطيفة (Tagetes) أو حشيشة السودان في الدورة الزراعية لإفراز مواد طاردة',
      'التعقيم الشمسي المزدوج مع إضافة الكمبوست العضوي المعقم'
    ],
    biologicalControl: [
      '*Purpureocillium lilacinum* (bionematicide attacking nematode eggs)',
      '*Pasteuria penetrans* (obligate parasitic bacterium of root-knot nematodes)'
    ],
    biologicalControl_ar: [
      'فطر التطفل على بيض النيماتودا (Purpureocillium lilacinum)',
      'بكتيريا باستوريا بينترانس (Pasteuria penetrans) المتخصصة'
    ],
    chemicalControl: {
      activeSubstances: ['Fluopyram', 'Oxamyl', 'Abamectin (nematicide formulation)', 'Fluazaindolizine'],
      activeSubstances_ar: ['فلووبيرام (Fluopyram)', 'أوكساميل (Oxamyl)', 'أبامكتين محبب', 'فلوازايندوليزين'],
      fracCodes: ['FRAC 7 / N-3', 'IRAC 1A', 'IRAC 6', 'Group N-UN'],
      phiDays: '3 - 14 days depending on active',
      precautions: 'Apply precisely in the drip root zone at early seedling establishment.',
      precautions_ar: 'الحقن الدقيق في منطقة بلل النقاطات مع بداية تأسيس الشتلات.'
    },
    resistantGenes: ['Mi-1', 'Mi-1.2']
  },

  // ==========================================
  // 2. MAIN STEM & COLLAR
  // ==========================================
  {
    id: 'southern-blight',
    name: 'Southern Blight / Stem Rot',
    name_ar: 'اللفحة الجنوبية وعفن الساق الأبيض (السكليروتيوم)',
    name_fr: 'Flétrissement du Sud / Pourriture à Sclérocytes',
    scientificName: 'Athelia rolfsii (anamorph Sclerotium rolfsii)',
    pathogenType: 'fungal',
    organ: 'stem_collar',
    severity: 'high',
    symptomSummary: 'Fan-like thick white cottony mycelium growing on the stem collar at the soil line, studded with tiny spherical mustard-seed-like sclerotia (white turning brown).',
    symptomSummary_ar: 'نمو ميسيليومي قطني أبيض كثيف يشبه المروحة يطوق قاعدة الساق عند سطح التربة، مغطى بأجسام حجرية كروية دقيقة تشبه بذور الخردل (بيضاء ثم بنية).',
    symptomSummary_fr: 'Manchon mycélien blanc cotonneux dense enserrant le collet au ras du sol, parsemé de petits sclérotes sphériques semblables à des graines de moutarde.',
    epidemiology: {
      favorableTemp: '28°C - 35°C (Warm tropical/subtropical summer)',
      favorableHumidity: 'High soil humidity, decaying plant debris, dense canopy',
      transmissionVectors: 'Soil sclerotia surviving 5+ years, splashing rain, contaminated irrigation water',
      transmissionVectors_ar: 'أجسام حجرية كامنة بالتربة لـ 5 سنوات، رذاذ مياه الري، بقايا المحاصيل المتحللة',
      transmissionVectors_fr: 'Sclérotes dans le sol, débris organiques de surface et éclaboussures'
    },
    diagnosticFeatures: [
      'Dense white fungal mat spreading over the lower stem and soil surface around the collar',
      'Diagnostic mustard-seed sclerotia (1-2 mm, initial white turning reddish-brown to dark brown)',
      'Rapid stem girdling causing sudden permanent daytime wilting',
      'Collar tissue becomes soft, brown, and decayed'
    ],
    diagnosticFeatures_ar: [
      'طبقة بيضاء قطنية كثيفة تفترش قاعدة الساق وسطح التربة المحيطة',
      'أجسام حجرية مميزة بحجم حبة الخردل (1-2 ملم) يتغير لونها من الأبيض للبني المحمر',
      'تحليق وتآكل كامل لقشرة الساق يتبعه ذبول وموت مفاجئ',
      'تعفن لين وتآكل أنسجة التاج'
    ],
    diagnosticFeatures_fr: [
      'Feutrage mycélien blanc éclatant en éventail à la base de la tige',
      'Sclérotes caractéristiques couleur graine de moutarde',
      'Étranglement complet du collet et effondrement foliaire irréversible',
      'Tissus caulinaires spongieux et pourris'
    ],
    ipmCulturalPractices: [
      'Deep plowing (>25 cm) to bury surface sclerotia below root depth',
      'Avoid placing organic mulch directly in contact with the tomato stem',
      'Maintain good air circulation at the plant base by bottom-leaf pruning (defoliation)',
      'Crop rotation with non-host monocots (corn, sorghum)'
    ],
    ipmCulturalPractices_ar: [
      'الحراثة العميقة (>25 سم) لدفن الأجسام الحجرية بعيداً عن منطقة الجذور',
      'إبعاد الغطاء العضوي (المالتش) عن ملامسة ساق الطماطم مباشرة',
      'تهوية قاعدة النبات عبر التوريق وإزالة الأوراق السفلية الملامسة للأرض',
      'دورة زراعية مع النجيليات (الذرة، السورجم)'
    ],
    biologicalControl: [
      'Soil pre-plant application of *Trichoderma virens* (strain G-41) to parasitize sclerotia',
      '*Coniothyrium minitans* sclerotial mycoparasite'
    ],
    biologicalControl_ar: [
      'إضافة فطر تريكوديرما فايرنز (Trichoderma virens) قبل الزراعة لافتراس الأجسام الحجرية',
      'فطر كونيوثيريوم مينيتانس (Coniothyrium minitans)'
    ],
    chemicalControl: {
      activeSubstances: ['Flutolanil', 'Penthiopyrad', 'Azoxystrobin', 'PCNB (Quintozene - where registered)'],
      activeSubstances_ar: ['فلوتولانيل (Flutolanil)', 'بينثيوبيراد (Penthiopyrad)', 'أزوكسيستروبين'],
      fracCodes: ['FRAC 7', 'FRAC 7', 'FRAC 11'],
      phiDays: '7 - 14 days',
      precautions: 'Direct spray strictly to the lower 10 cm of the stem and crown soil band.',
      precautions_ar: 'توجيه الرش مباشرة على قاعدة الساق والشريط الأرضي حول التاج.'
    },
    resistantGenes: ['No fully resistant commercial cultivars available']
  },
  {
    id: 'pith-necrosis',
    name: 'Tomato Pith Necrosis',
    name_ar: 'نخر وتعفن نخاع الساق البكتيري (البيث نكروزيس)',
    name_fr: 'Nécrose de la Moelle de la Tomate',
    scientificName: 'Pseudomonas corrugata / Pseudomonas mediterranea',
    pathogenType: 'bacterial',
    organ: 'stem_collar',
    severity: 'moderate',
    symptomSummary: 'Stem surfaces develop dark brown to black longitudinal lesions; internally, the pith turns dark brown, chambers, and becomes hollow with abundant adventitious root formation.',
    symptomSummary_ar: 'ظهور خطوط سوداء بنية طولية على الساق من الخارج، ومع شق الساق يظهر النخاع الداخلي مقسماً إلى غرف ومتحللاً ومجوفاً ومصحوباً بنمو غزير لجذور هوائية.',
    symptomSummary_fr: 'Lésions longitudinales sombres sur la tige ; moelle brune cloisonnée en "échelle de meunier" et devenue creuse avec racines adventives.',
    epidemiology: {
      favorableTemp: '12°C - 20°C night / 20°C - 25°C day (Cool nights, high humidity)',
      favorableHumidity: 'Excessive vegetative growth induced by high Nitrogen and high RH in greenhouses',
      transmissionVectors: 'Pruning wounds, mechanical handling, splashing condensation droplets',
      transmissionVectors_ar: 'جروح التقليم والتربية، التسميد الأزوتي الزائد، قطرات التكثيف في البيوت المحمية',
      transmissionVectors_fr: 'Plaies d’ébourgeonnage, excès d’azote et forte hygrométrie sous serre'
    },
    diagnosticFeatures: [
      'Pith displays a ladder-like chambered hollow internal structure ("ladder pith")',
      'Profuse adventitious aerial roots erupting along the main stem',
      'Upper canopy shows yellowing and wilting while lower plant looks vigorous',
      'Dark brown greasy streaks on external stem epidermis'
    ],
    diagnosticFeatures_ar: [
      'النخاع الداخلي مقسم إلى حجرات متتالية كدرجات السلم ومفرغ من الداخل',
      'انفجار خروج جذور هوائية عرضية بكثافة على طول الساق المصاب',
      'اصفرار وذبول القمة النامية بينما الجزء السفلي يبدو قوياً',
      'خطوط زيتية بنية مسودة ممتدة على جدار الساق الخارجي'
    ],
    diagnosticFeatures_fr: [
      'Moelle brune creusée de cavités régulières en échelle ("laddering")',
      'Émergence massive de racines adventives le long de la tige',
      'Chlorose et flétrissement apical contrastant avec la base',
      'Stries brunes déprimées le long des faisceaux conducteurs'
    ],
    ipmCulturalPractices: [
      'Strictly avoid excessive Nitrogen fertilization during early cool vegetative stages',
      'Disinfect pruning shears regularly with alcohol or bleach',
      'Improve greenhouse heating/ventilation to eliminate night condensation on plants',
      'Prune only in dry, sunny conditions so wounds heal rapidly'
    ],
    ipmCulturalPractices_ar: [
      'تجنب الإفراط في التسميد النيتروجيني في الأجواء الباردة لتفادي الغضاضة',
      'تعقيم مقصات التقليم والتربية بانتظام',
      'تحسين تهوية وتدفئة البيوت المحمية لتقليل الرطوبة النسبية ومنع التكثف',
      'إجراء عمليات التقليم في الأيام المشمسة الجافة لسرعة التئام الجروح'
    ],
    biologicalControl: [
      'Preventative applications of *Bacillus subtilis* foliar formulations to pruning wounds'
    ],
    biologicalControl_ar: [
      'رش بكتيريا باسيلس سبتيلس على جروح التقليم فور إجرائها'
    ],
    chemicalControl: {
      activeSubstances: ['Copper Oxychloride', 'Copper Octanoate', 'Potassium Phosphite'],
      activeSubstances_ar: ['أوكسي كلوريد النحاس', 'أوكتانوات النحاس', 'فوسفيت البوتاسيوم'],
      fracCodes: ['FRAC M01', 'FRAC M01', 'FRAC P07'],
      phiDays: '3 - 7 days',
      precautions: 'Avoid spraying copper during very cold damp conditions to avoid phytotoxicity.',
      precautions_ar: 'تجنب رش النحاس في الأجواء شديدة البرودة والرطوبة لتفادي سمية الأوراق.'
    },
    resistantGenes: ['Tolerance linked to moderate vegetative vigor']
  },

  // ==========================================
  // 3. FOLIAGE & LEAVES
  // ==========================================
  {
    id: 'early-blight',
    name: 'Early Blight',
    name_ar: 'اللفحة المبكرة (الألترناريا)',
    name_fr: 'Alternariose de la Tomate (Brûlure Précoce)',
    scientificName: 'Alternaria solani / Alternaria linariae',
    pathogenType: 'fungal',
    organ: 'leaves',
    severity: 'high',
    symptomSummary: 'Dark brown to black circular spots on older lower leaves, characterized by distinct concentric rings forming a "target-board" or "bullseye" pattern surrounded by a yellow halo.',
    symptomSummary_ar: 'بقع دائرية بنية داكنة على الأوراق السفلية القديمة، تتميز بحلقات متداخلة متحدة المركز تشبه لوحة الهدف (Bullseye) ومحاطة بهالة صفراء فاقعة.',
    symptomSummary_fr: 'Taches foliaires circulaires brun foncé à noires sur vieilles feuilles, avec anneaux concentriques typiques en cible ("bullseye") et halo jaune.',
    epidemiology: {
      favorableTemp: '24°C - 29°C (Warm conditions)',
      favorableHumidity: 'Alternating wet (rain/dew) and dry periods; frequent overhead wetting',
      transmissionVectors: 'Windborne conidia, rain splash, infected crop residues in soil, seed',
      transmissionVectors_ar: 'الرياح الحاملة للجراثيم، رذاذ المطر والري الرذاذي، بقايا المحصول السابق',
      transmissionVectors_fr: 'Conidies transportées par le vent, pluie battante et débris foliaires'
    },
    diagnosticFeatures: [
      'Concentric concentric target-board rings within brown necrotic spots',
      'Bright yellow chlorotic halo surrounding each lesion',
      'Starts strictly on oldest lower leaves and progresses upward',
      'Lesions coalesce causing severe lower leaf scorch and premature defoliation'
    ],
    diagnosticFeatures_ar: [
      'حلقات دائرية متداخلة واضحة كلوحة الهدف داخل البقعة البنية',
      'هالة صفراء فاقعة تحيط بكل بقعة',
      'تبدأ الإصابة دائماً من الأوراق السفلية القديمة وتصعد للأعلى',
      'اندماج البقع مسبباً جفاف واحتراق وسقوط الأوراق السفلية'
    ],
    diagnosticFeatures_fr: [
      'Anneaux concentriques très nets au centre des taches nécrotiques',
      'Halo jaune vif entourant chaque lésion',
      'Progression du bas vers le haut du feuillage',
      'Défoliation précoce exposant les fruits aux coups de soleil'
    ],
    ipmCulturalPractices: [
      'Strip and remove lower leaves (bottom 30-40 cm) to eliminate ground splash contact',
      'Use drip irrigation instead of overhead sprinklers to keep foliage dry',
      'Rotate crops for at least 3 years away from Solanaceae (potato, eggplant, pepper)',
      'Ensure balanced Potassium and avoid plant stress during heavy fruiting'
    ],
    ipmCulturalPractices_ar: [
      'إزالة وتوريق الأوراق السفلية (أول 30-40 سم) لمنع تلامسها مع رطوبة التربة',
      'الاعتماد الحصري على الري بالتنقيط وتجنب الرشاشات العلوية',
      'دورة زراعية 3 سنوات خالية من العائلة الباذنجانية',
      'تغذية بوتاسية متوازنة وتجنب إجهاد النبات أثناء عقد الثمار'
    ],
    biologicalControl: [
      'Foliar spray with *Bacillus amyloliquefaciens* (D747)',
      'Copper-octanoate and potassium bicarbonate biological fungicides'
    ],
    biologicalControl_ar: [
      'رش بكتيريا باسيلس أميلوليكفاشينس الوقائي',
      'بيكربونات البوتاسيوم ومركبات النحاس العضوي'
    ],
    chemicalControl: {
      activeSubstances: ['Difenoconazole + Azoxystrobin', 'Boscalid + Pyraclostrobin', 'Chlorothalonil (preventative)', 'Mancozeb'],
      activeSubstances_ar: ['ديفينوكونازول + أزوكسيستروبين', 'بوسكاليد + بيراكلوستروبين', 'كلوروثالونيل', 'مانكوزيب'],
      fracCodes: ['FRAC 3 + 11', 'FRAC 7 + 11', 'FRAC M05', 'FRAC M03'],
      phiDays: '3 - 7 days',
      precautions: 'Alternate FRAC modes of action to prevent strobilurin (FRAC 11) resistance buildup.',
      precautions_ar: 'تبادل مجموعات FRAC المختلفة لمنع ظهور سلالات مقاومة للمبيدات الجهازية.'
    },
    resistantGenes: ['Ph-2', 'Ph-3 (provides partial field tolerance)']
  },
  {
    id: 'late-blight',
    name: 'Late Blight',
    name_ar: 'اللفحة المتأخرة (فيتوفثورا إنفستانس)',
    name_fr: 'Mildiou de la Tomate (Brûlure Tardive)',
    scientificName: 'Phytophthora infestans (Oomycete)',
    pathogenType: 'fungal',
    organ: 'leaves',
    severity: 'devastating',
    symptomSummary: 'Large, irregular, pale green to water-soaked oily spots rapidly turning dark brown/black; in high humidity, a delicate white fuzzy cottony mold appears on the underside of leaves.',
    symptomSummary_ar: 'بقع مائية زيتية كبيرة غير منتظمة تتحول سريعاً للون البني والأسود المحروق، وتظهر في الأجواء الرطبة طبقة زغبية قطنية بيضاء ناعمة على السطح السفلي للأوراق.',
    symptomSummary_fr: 'Grandes taches irrégulières d’aspect huileux vert pâle puis brun-noir, avec duvet blanc cotonneux visible à la face inférieure par temps humide.',
    epidemiology: {
      favorableTemp: '15°C - 22°C (Cool, damp weather; destroyed above 30°C)',
      favorableHumidity: '>90% Relative Humidity or free water film on leaves for >6 hours',
      transmissionVectors: 'Windborne sporangia traveling miles, infected potato tubers, volunteers',
      transmissionVectors_ar: 'أكياس جرثومية منقولة بالرياح لمسافات كيلومترات، درنات البطاطس المصابة',
      transmissionVectors_fr: 'Sporanges aéroportés sur plusieurs kilomètres, repousses de pommes de terre'
    },
    diagnosticFeatures: [
      'Rapidly expanding water-soaked "grease-spot" lesions on leaves and stems',
      'Diagnostic white downy mildew sporulation on the underside of leaf lesions in humid mornings',
      'Dark greasy brown lesions encircling stems and leaf petioles',
      'Total canopy collapse can occur within 3 to 5 days under epidemic conditions'
    ],
    diagnosticFeatures_ar: [
      'بقع زيتية مائية تتسع بسرعة فائقة على الأوراق والسيقان',
      'ظهور زغب فطري أبيض ناصع على السطح السفلي للبقع في الصباح الرطب',
      'تطويق الساق وأعناق الأوراق بحلقات بنية زيتية داكنة',
      'انهيار واحتراق الحقل بالكامل خلال 3-5 أيام عند توفر الظروف'
    ],
    diagnosticFeatures_fr: [
      'Taches huileuses d’expansion foudroyante',
      'Duvet blanc de sporulation visible au revers des feuilles au petit matin',
      'Manchons bruns huileux nécrosant les tiges et pétioles',
      'Destruction totale de la parcelle en moins d’une semaine'
    ],
    ipmCulturalPractices: [
      'Destroy all cull piles and volunteer potato/tomato plants in the vicinity',
      'Ensure wide plant spacing and keep greenhouse vents open to avoid leaf wetness',
      'Utilize disease forecasting weather models (BlightCast / Tomcast)',
      'Plant resistant cultivars carrying multiple *Ph* resistance genes'
    ],
    ipmCulturalPractices_ar: [
      'التخلص من بقايا محصول البطاطس ونباتات الطماطم البرية المجاورة',
      'توسيع مسافات الزراعة والتهوية الجيدة لمنع استمرار البلل على الأوراق',
      'متابعة نماذج التنبؤ الجوي باللفحة',
      'زراعة أصناف مقاومة حاملة لجينات Ph المتعددة'
    ],
    biologicalControl: [
      'Preventative foliar sprays with Copper Hydroxide / Copper Octanoate',
      '*Bacillus subtilis* (QST 713 strain)'
    ],
    biologicalControl_ar: [
      'الرش الوقائي بمركبات هيدروكسيد النحاس أو أوكتانوات النحاس',
      'بكتيريا المكافحة باسيلس سبتيلس'
    ],
    chemicalControl: {
      activeSubstances: ['Mandipropamid', 'Cymoxanil + Mancozeb', 'Fluopicolide + Propamocarb', 'Dimethomorph + Ametoctradin', 'Cyazofamid'],
      activeSubstances_ar: ['مانديبروباميد (Mandipropamid)', 'سيموكسانيل + مانكوزيب', 'فلوبيكوليد + بروباموكارب', 'ديميثومورف', 'سيازوفاميد'],
      fracCodes: ['FRAC 40', 'FRAC 27 + M03', 'FRAC 43 + 28', 'FRAC 40 + 45', 'FRAC 21'],
      phiDays: '3 - 7 days',
      precautions: 'Apply systemic oomyceticides at first weather alert; curative action must occur within 24-48h of infection.',
      precautions_ar: 'الرش بمضادات الأوميسيتات الجهازية فور صدور التحذير الجوي؛ التأثير العلاجي فعال فقط خلال 24-48 ساعة من العدوى.'
    },
    resistantGenes: ['Ph-1', 'Ph-2', 'Ph-3 (triple-gene resistance in modern hybrids)']
  },
  {
    id: 'tylcv',
    name: 'Tomato Yellow Leaf Curl Virus (TYLCV)',
    name_ar: 'فيروس تجعد واصفرار أوراق الطماطم (TYLCV)',
    name_fr: 'Virus des Feuilles Jaunes Enroulées de la Tomate (TYLCV)',
    scientificName: 'Tomato yellow leaf curl begomovirus (Family Geminiviridae)',
    pathogenType: 'viral',
    organ: 'leaves',
    severity: 'devastating',
    symptomSummary: 'Severe stunting and bushy erect growth; newly formed leaves are miniature, cup-shaped (curled upward), with bright golden yellow margins and interveinal chlorosis; flowers drop off.',
    symptomSummary_ar: 'تقزم شديد للنبات ونمو شجيري منتصب، وتخرج الأوراق الحديثة صغيرة جداً وملتفة للأعلى كالفنجان مع اصفرار ذهبي حاد للحواف وتساقط كامل للأزهار.',
    symptomSummary_fr: 'Nanisme sévère et port buissonnant ; folioles apicales réduites, crispées et enroulées en cuillère vers le haut avec marges jaune d’or ; coulure florale totale.',
    epidemiology: {
      favorableTemp: '27°C - 35°C (Active whitefly vector seasons)',
      favorableHumidity: 'Arid, semi-arid, and Mediterranean greenhouse conditions',
      transmissionVectors: 'Exclusively transmitted persistently by the Sweetpotato Whitefly (*Bemisia tabaci* - B & Q biotypes)',
      transmissionVectors_ar: 'ينتقل حصرياً بصورة مستمرة عبر حشرة الذبابة البيضاء (Bemisia tabaci)',
      transmissionVectors_fr: 'Transmis exclusivement par l’aleurode du tabac (*Bemisia tabaci* biotypes B & Q)'
    },
    diagnosticFeatures: [
      'Upward cupping / spoon-like curling of leaf margins',
      'Bright golden-yellow chlorosis on leaf margins and interveinal zones of young leaves',
      'Severe plant stunting ("bonsai-like" appearance if infected early)',
      'Complete flower bud abortion resulting in near zero fruit set'
    ],
    diagnosticFeatures_ar: [
      'التفاف حواف الأوراق القمية لأعلى كالملعقة أو الفنجان',
      'اصفرار ذهبي ناصع للأطراف وما بين عروق الأوراق الحديثة',
      'تقزم شديد ومظهر شجيري متصلب كالبونساي عند الإصابة المبكرة',
      'إجهاض كامل للبراعم الزهرية وانعدام الإنتاج'
    ],
    diagnosticFeatures_fr: [
      'Enroulement des folioles en coupelle vers la face supérieure',
      'Liseré jaune doré vif et chlorose internervaire des jeunes pousses',
      'Raccourcissement spectaculaire des entrenœuds',
      'Coulure florale quasi totale sur les bouquets néoformés'
    ],
    ipmCulturalPractices: [
      'Plant TYLCV-resistant varieties carrying *Ty-1*, *Ty-3*, or *Ty-5* genes',
      'Install 50-mesh anti-insect netting on all greenhouse openings and double-door entries',
      'Yellow sticky traps (1 trap per 20 m²) for continuous whitefly population monitoring',
      'Implement a mandatory 6-week host-free crop break between seasons'
    ],
    ipmCulturalPractices_ar: [
      'زراعة هجن مقاومة لفيروس التجعد حاملة لجينات Ty-1 و Ty-3',
      'تركيب شباك مانعة للحشرات 50 Mesh على جميع فتحات الصوب وغرف عزل مزدوجة',
      'توزيع المصائد اللاصقة الصفراء لمراقبة وصيد الذبابة البيضاء',
      'تطبيق فترة كسر دورة خالية من العوائل لمدة شهر بين المواسم'
    ],
    biologicalControl: [
      'Release of parasitoid wasps *Encarsia formosa* or *Eretmocerus mundus*',
      'Predatory mirid bugs *Nesidiocoris tenuis* or *Macrolophus pygmaeus*',
      'Entomopathogenic fungi *Beauveria bassiana* or *Cordyceps fumosorosea*'
    ],
    biologicalControl_ar: [
      'إطلاق طفيليات الذبابة البيضاء إنكارسيا فورموزا (Encarsia formosa)',
      'المفترس الحشري نيسيديوكوريس تينويس (Nesidiocoris tenuis)',
      'فطر البوفيريا باسيانا الممرض للحشرات'
    ],
    chemicalControl: {
      activeSubstances: ['Cyantraniliprole', 'Spirotetramat', 'Pyriproxyfen (IGR)', 'Acetamiprid', 'Flupyradifurone'],
      activeSubstances_ar: ['سيانترانيليبرول', 'سبيروتترامات', 'بيريبروكسيفين (مانع انسلاخ)', 'أسيتامبريد', 'فلوبيراديفورون'],
      fracCodes: ['IRAC 28', 'IRAC 23', 'IRAC 7C', 'IRAC 4A', 'IRAC 4D'],
      phiDays: '1 - 3 days',
      precautions: 'Direct vector control is the ONLY chemical method; viruses have no curative viricide treatment.',
      precautions_ar: 'المكافحة موجهة حصرياً لناقل الفيروس (الذبابة البيضاء)؛ لا توجد مبيدات علاجية للفيروسات داخل النبات.'
    },
    resistantGenes: ['Ty-1', 'Ty-2', 'Ty-3', 'Ty-4', 'Ty-5 / ty-5 (high polygenic resistance)']
  },

  // ==========================================
  // 4. FLOWERS & CLUSTERS
  // ==========================================
  {
    id: 'botrytis-gray-mold',
    name: 'Gray Mold / Blossom Blight',
    name_ar: 'العفن الرمادي ولفحة الأزهار (البوتريتس)',
    name_fr: 'Pourriture Grise / Botrytis des Fleurs',
    scientificName: 'Botrytis cinerea',
    pathogenType: 'fungal',
    organ: 'flowers',
    severity: 'high',
    symptomSummary: 'Senescing flower petals turn brown and water-soaked, becoming covered in a dense velvety gray-brown spore carpet; infection moves down the pedicel into the cluster stem.',
    symptomSummary_ar: 'تحول بتلات الأزهار إلى اللون البني المائي المتعفن وتغطيتها بطبقة مخملية كثيفة من الجراثيم الرمادية، مع انتقال العدوى عبر عنق الزهرة إلى الساق العنقودي الرئيسي.',
    symptomSummary_fr: 'Pétales bruns et flétris recouverts d’un feutrage grisâtre dense de conidies ; progression de la pourriture dans le pédoncule et la tige.',
    epidemiology: {
      favorableTemp: '17°C - 23°C (Cool to mild greenhouse climate)',
      favorableHumidity: '>85% RH; free moisture from condensation or dead floral parts',
      transmissionVectors: 'Airborne conidia entering through dying petals, pruning wounds, or de-leafing scars',
      transmissionVectors_ar: 'جراثيم منقولة بالهواء تخترق البتلات الذابلة وجروح التقليم والتوريق',
      transmissionVectors_fr: 'Conidies aéroportées colonisant les organes sénescents et plaies de taille'
    },
    diagnosticFeatures: [
      'Abundant fuzzy gray-brown dust/spores visible when touching infected flowers',
      'Brown water-soaked soft rot of flower pedicels causing entire cluster blight',
      'V-shaped necrotic lesions starting at leaf margins when infected petals drop onto leaves',
      'Ghost spots (halo rings) on green fruits beneath infected clusters'
    ],
    diagnosticFeatures_ar: [
      'غبار رمادي كثيف يتصاعد عند لمس الأزهار والعناقيد المصابة',
      'عفن بني مائي على عنق الزهرة يؤدي لجفاف وموت العنقود الزهري كاملاً',
      'بقع نخرية مثلثة بشكل حرف V على الأوراق التي تسقط عليها البتلات الملوثة',
      'ظهور بقع شبحية دائرية مبيضة (Ghost Spots) على الثمار الخضراء'
    ],
    diagnosticFeatures_fr: [
      'Feutrage grisâtre pulvérulent très abondant au toucher',
      'Pourriture brune molle du pédoncule entraînant le dessèchement du bouquet',
      'Taches nécrotiques en V sur feuilles après chute des pétales infectés',
      'Taches fantômes circulaires sur fruits verts'
    ],
    ipmCulturalPractices: [
      'Vigorously shake plant wires/trellises to dislodge dying petals after pollination',
      'Heat and ventilate greenhouses before sunrise to purge condensation humidity',
      'Prune lower leaves flush with the stem (no stubs) in the early morning on sunny days',
      'Avoid high plant density and ensure open airflow through the blossom zone'
    ],
    ipmCulturalPractices_ar: [
      'هز وتخبيط خيوط التربية لإسقاط البتلات الذابلة بعد نجاح التلقيح والعقد',
      'تشغيل التدفئة والتهوية فجراً لطرد الرطوبة ومنع التكثف المائي',
      'إجراء التوريق دون ترك بقايا أعناق ناتئة (Flush cuts) صباحاً في يوم مشمس',
      'توسيع المسافات وضمان حركة الهواء حول منطقة التزهير'
    ],
    biologicalControl: [
      '*Trichoderma harzianum* (T-39) biofungicide',
      '*Bacillus subtilis* spray directly onto open flower clusters',
      '*Ulocladium oudemansii* competitive antagonist'
    ],
    biologicalControl_ar: [
      'فطر تريكوديرما هارزيانوم المخصص للبوتريتس',
      'رش بكتيريا باسيلس سبتيلس مباشرة على العناقيد المفتوحة',
      'فطر يولوكلاديوم المنافس'
    ],
    chemicalControl: {
      activeSubstances: ['Fludioxonil + Cyprodinil', 'Fenhexamid', 'Fluopyram + Trifloxystrobin', 'Boscalid', 'Pyrimethanil'],
      activeSubstances_ar: ['فلوديوكسونيل + سيبرودينيل', 'فينهيكساميد (Fenhexamid)', 'فلووبيرام + تريفلوكسيستروبين', 'بوسكاليد', 'بيريميثانيل'],
      fracCodes: ['FRAC 12 + 9', 'FRAC 17', 'FRAC 7 + 11', 'FRAC 7', 'FRAC 9'],
      phiDays: '1 - 3 days',
      precautions: 'Rotate FRAC groups strictly; Botrytis evolves resistance faster than almost any other plant pathogen.',
      precautions_ar: 'التبادل الصارم لمجموعات FRAC؛ فطر البوتريتس يطور مناعة ضد المبيدات أسرع من أي فطر آخر.'
    },
    resistantGenes: ['Polygenic partial tolerance']
  },

  // ==========================================
  // 5. FRUITS & CALYX
  // ==========================================
  {
    id: 'tobrfv',
    name: 'Tomato Brown Rugose Fruit Virus (ToBRFV)',
    name_ar: 'فيروس ثمار الطماطم البنية المجعدة (ToBRFV)',
    name_fr: 'Virus du Fruit Rugueux Brun de la Tomate (ToBRFV)',
    scientificName: 'Tomato brown rugose fruit tobamovirus (ToBRFV)',
    pathogenType: 'viral',
    organ: 'fruits',
    severity: 'devastating',
    symptomSummary: 'Fruits show dramatic yellow marbling, blotchy ripening, wrinkled brown rugose patches, necrotic calyx browning, and extreme deformity; breaks Tm-2² genetic resistance.',
    symptomSummary_ar: 'ظهور تبرقش رخامي أصفر شديد على الثمار مع بقع بنية مجعدة وخشنة واحتراق وتيبس الكأس الأخضر وتشوه حاد للثمار؛ يكسر جينات المقاومة التقليدية Tm-2².',
    symptomSummary_fr: 'Fruits marbrés de jaune avec taches brunes rugueuses et ridées, nécrose et dessèchement du calice vert ; contourne le gène de résistance Tm-2².',
    epidemiology: {
      favorableTemp: 'Persistent across all temperatures (Extremely heat & chemical stable)',
      favorableHumidity: 'Not humidity dependent (mechanically transmitted virus)',
      transmissionVectors: 'Mechanical contact via worker hands, clothing, pruning tools, bumblebees (*Bombus*), seed coat contamination, surviving years on greenhouse structures',
      transmissionVectors_ar: 'الملامسة الميكانيكية بأيدي العمال، الملابس، أدوات التقليم، طرود نحل التلقيح، البذور الملوثة، البقاء لسنوات على هياكل الصوب',
      transmissionVectors_fr: 'Contact mécanique direct (mains, outils, vêtements), ruches de bourdons, semences et structures'
    },
    diagnosticFeatures: [
      'Yellow mosaic marbling and uncolored blotches on ripe red fruits',
      'Brown corky rugose necrotic lesions on fruit surface ("rugose patches")',
      'Diagnostic Calyx Necrosis: Browning and drying of green fruit sepals (calyx points)',
      'Mosaic pattern and slight bubbling / narrowing of young foliage'
    ],
    diagnosticFeatures_ar: [
      'تبرقش رخامي أصفر وبقع غير متجانسة النضج على الثمار الحمراء',
      'بقع بنية فلينية مجعدة خشنة على جدار الثمرة الخارجي',
      'احتراق واصفرار وتيبس سبلات الكأس الزهري المحيط بعنق الثمرة',
      'موزاييك وتفقيع وضيق نصل الأوراق القمية'
    ],
    diagnosticFeatures_fr: [
      'Marbrures jaunes hétérogènes et maturation en damier',
      'Lésions brunes rugueuses et plissées sur l’épiderme du fruit',
      'Nécrose et dessèchement caractéristique des sépales du calice',
      'Mosaïque et cloquage discret sur les jeunes feuilles'
    ],
    ipmCulturalPractices: [
      'Deploy newly released ToBRFV High-Resistance (HR) hybrid cultivars',
      'Strict greenhouse biosecurity: footbaths with 2% Virkon S or Menno Florades',
      'Mandatory disposable gloves and tool soaking in 10% TSP (Trisodium Phosphate) between every plant',
      'Use only tested, certified tobamovirus-free seeds with official phytosanitary passports'
    ],
    ipmCulturalPractices_ar: [
      'زراعة الأصناف والهجن الحديثة ذات المقاومة العالية (HR) لفيروس ToBRFV',
      'إجراءات أمن حيوي صارمة: مغاطس تعقيم أحذية بمادة فيركون إس (Virkon S)',
      'ارتداء قفازات أحادية الاستعمال ونقع أدوات التقليم في محلول فوسفات ثلاثي الصوديوم TSP 10%',
      'استخدام بذور معتمدة ومفحوصة مخبرياً بشهادة خلو رسمية'
    ],
    biologicalControl: [
      'No biological biocontrol can eliminate tobamoviruses inside plant sap; strict hygiene is essential.'
    ],
    biologicalControl_ar: [
      'لا يوجد علاج حيوي داخل عصارة النبات؛ الوقاية والنظافة الصارمة هما الأساس.'
    ],
    chemicalControl: {
      activeSubstances: ['Disinfectants only: Trisodium Phosphate (TSP 10%)', 'Peracetic acid for structural cleanup', 'Virkon S'],
      activeSubstances_ar: ['مطهرات فقط: فوسفات ثلاثي الصوديوم TSP', 'حمض البيرأسيتيك لغسيل الهياكل', 'فيركون إس'],
      fracCodes: ['Sanitizers'],
      phiDays: 'N/A (Not applied to living crop for curative therapy)',
      precautions: 'Tobamoviruses survive for months on dry plastic and steel without breakdown.',
      precautions_ar: 'فيروسات التوبامو تظل حية ومعدية لشهور وسنوات على البلاستيك والحديد الجاف.'
    },
    resistantGenes: ['Modern resistant loci (e.g., GCR-ToBRFV polygenic resistance)']
  },
  {
    id: 'anthracnose-fruit-rot',
    name: 'Anthracnose Fruit Rot',
    name_ar: 'أنثراكنوز ثمار الطماطم (عفن الثمار الدائري الغائر)',
    name_fr: 'Anthracnose des Fruits de Tomate',
    scientificName: 'Colletotrichum coccodes / Colletotrichum gloeosporioides',
    pathogenType: 'fungal',
    organ: 'fruits',
    severity: 'moderate',
    symptomSummary: 'Ripe and overripe fruits develop small, circular, sunken, water-soaked lesions that enlarge and form dark target-like concentric rings with salmon-pink spore droplets in wet weather.',
    symptomSummary_ar: 'تطور بقع دائرية غائرة تشبه الصحن على الثمار الناضجة، تتسع وتأخذ حلقات متحدة المركز وتفرز في الأجواء الرطبة كتلاً جيلاتينية بلون وردي سلموني.',
    symptomSummary_fr: 'Taches circulaires déprimées en cupules sur fruits mûrs, s’élargissant avec anneaux concentriques et masses gélatineuses de spores rose saumon.',
    epidemiology: {
      favorableTemp: '26°C - 30°C (Warm summer rains)',
      favorableHumidity: 'Frequent rainfall, overhead irrigation, wet fruit surfaces >8 hours',
      transmissionVectors: 'Soil splash carrying microsclerotia, rain-splashed conidia, infected weed solanaceous hosts',
      transmissionVectors_ar: 'رذاذ التربة الحامل للأجسام الميكروسكوبية، مياه الأمطار والري، الحشائش الباذنجانية',
      transmissionVectors_fr: 'Éclaboussures de terre portant des microsclérotes et pluie battante'
    },
    diagnosticFeatures: [
      'Depressed dish-like circular sunken craters on ripening/ripe fruit',
      'Concentric zones of tiny black microsclerotia within the crater',
      'Gelatinous salmon-pink or orange spore masses in humid conditions',
      'Rot penetrates deeply into the fruit mesocarp pulp'
    ],
    diagnosticFeatures_ar: [
      'انخفاضات دائرية غائرة كالصحن على الثمار الناضجة أو قريبة النضج',
      'دوائر متحدة المركز من النقط السوداء الدقيقة داخل الانخفاض الغائر',
      'إفرازات مخاطية جيلاتينية بلون وردي سلموني أو برتقالي عند ارتفاع الرطوبة',
      'تعفن عميق يخترق لحم الثمرة الداخلي'
    ],
    diagnosticFeatures_fr: [
      'Cratères circulaires affaissés sur fruits en cours de coloration',
      'Ponctuations noires (microsclérotes) disposées en cercles concentriques',
      'Masses gélatineuses de conidies rose saumon par temps pluvieux',
      'Désagrégation aqueuse profonde de la pulpe'
    ],
    ipmCulturalPractices: [
      'Harvest fruit promptly at the breaker/pink stage to avoid field over-ripening',
      'Stake, trellis, and mulch plants to prevent any fruit from contacting wet soil',
      'Eliminate nightshade weeds (*Solanum nigrum*) around field borders',
      'Avoid overhead irrigation during fruit ripening weeks'
    ],
    ipmCulturalPractices_ar: [
      'جمع الثمار في مرحلة التلوين الأولى (Breaker) وتجنب بقاء الثمار الناضجة بالحقل',
      'تربية النباتات رأسياً وتغطية التربة بالبلاستيك لمنع ملامسة الثمار للأرض',
      'مكافحة حشائش عنب الديب والباذنجان البري على أطراف الحقل',
      'منع الري الرذاذي العلوي أثناء نضج الثمار'
    ],
    biologicalControl: [
      'Preventative applications of *Bacillus subtilis* or *Streptomyces lydicus*'
    ],
    biologicalControl_ar: [
      'الرش الوقائي ببكتيريا باسيلس سبتيلس أو ستربتومايسس ليديكس'
    ],
    chemicalControl: {
      activeSubstances: ['Azoxystrobin', 'Pyraclostrobin', 'Chlorothalonil', 'Mancozeb', 'Difenoconazole'],
      activeSubstances_ar: ['أزوكسيستروبين', 'بيراكلوستروبين', 'كلوروثالونيل', 'مانكوزيب', 'ديفينوكونازول'],
      fracCodes: ['FRAC 11', 'FRAC 11', 'FRAC M05', 'FRAC M03', 'FRAC 3'],
      phiDays: '0 - 5 days',
      precautions: 'Ensure complete spray coverage of fruit clusters underneath dense foliage.',
      precautions_ar: 'ضمان وصول محلول الرش لكامل العناقيد الثمرية المختبئة تحت المجموع الخضري.'
    },
    resistantGenes: ['Partial genetic resistance in small-fruited varieties']
  }
];
