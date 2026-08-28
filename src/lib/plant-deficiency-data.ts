export interface PlantOrganDeficiency {
  id: string;
  nutrient: string;
  chemicalSymbol: string;
  organ: 'roots' | 'stem' | 'lower_leaves' | 'upper_leaves' | 'apical_meristem' | 'flowers' | 'fruits';
  mobility: 'mobile' | 'immobile' | 'intermediate';
  severity: 'mild' | 'moderate' | 'critical';
  title: string;
  title_ar: string;
  title_fr: string;
  symptomSummary: string;
  symptomSummary_ar: string;
  symptomSummary_fr: string;
  cellularRole: string;
  cellularRole_ar: string;
  cellularRole_fr: string;
  visualDiagnosticKeys: string[];
  visualDiagnosticKeys_ar: string[];
  visualDiagnosticKeys_fr: string[];
  lookalikes: string;
  lookalikes_ar: string;
  emergencyFoliarRecipe: {
    product: string;
    product_ar: string;
    product_fr: string;
    dosage: string;
    dosage_ar: string;
    timing: string;
    timing_ar: string;
    precautions: string;
    precautions_ar: string;
  };
  fertigationSoilProgram: {
    fertilizers: string[];
    fertilizers_ar: string[];
    soilPhCorrection: string;
    soilPhCorrection_ar: string;
    antagonismAvoidance: string;
    antagonismAvoidance_ar: string;
  };
  cropExamples: string[];
}

export const PLANT_ORGANS = [
  { id: 'roots', label: 'Roots & Root Tips', label_ar: 'المجموع الجذري والقمم النامية', label_fr: 'Racines et Apex', color: '#854d0e', icon: 'Roots' },
  { id: 'stem', label: 'Stem & Vascular System', label_ar: 'الساق والأوعية الناقلة', label_fr: 'Tige & Faisceaux Vasculaires', color: '#16a34a', icon: 'Stem' },
  { id: 'lower_leaves', label: 'Older / Lower Leaves', label_ar: 'الأوراق السفلية والمسنة (عناصر متحركة)', label_fr: 'Feuilles Basses / Âgées', color: '#65a30d', icon: 'LowerLeaf' },
  { id: 'upper_leaves', label: 'Young / Upper Leaves', label_ar: 'الأوراق العلوية والحديثة (عناصر قليلة الحركة)', label_fr: 'Jeunes Feuilles / Supérieures', color: '#10b981', icon: 'UpperLeaf' },
  { id: 'apical_meristem', label: 'Apical Meristem / Shoot Tip', label_ar: 'القمة النامية والبراعم الطرفية', label_fr: 'Bourgeon Apical & Apex', color: '#059669', icon: 'ShootTip' },
  { id: 'flowers', label: 'Flowers & Inflorescence', label_ar: 'الأزهار والعناقيد الزهرية', label_fr: 'Fleurs & Inflorescences', color: '#eab308', icon: 'Flower' },
  { id: 'fruits', label: 'Fruits & Berries', label_ar: 'الثمار والإنتاج', label_fr: 'Fruits & Calibres', color: '#dc2626', icon: 'Fruit' },
] as const;

export const PLANT_DEFICIENCIES_DATA: PlantOrganDeficiency[] = [
  // 1. ROOTS
  {
    id: 'root-p',
    nutrient: 'Phosphorus',
    chemicalSymbol: 'P (H₂PO₄⁻)',
    organ: 'roots',
    mobility: 'mobile',
    severity: 'critical',
    title: 'Phosphorus Deficiency in Root Architecture',
    title_ar: 'نقص الفوسفور وتثبيط الجذور وتلونها الأرجواني',
    title_fr: 'Carence en Phosphore & Inhibition Racinaire',
    symptomSummary: 'Severely stunted taproot and primary roots with almost no lateral root hairs; root tips turn dark reddish-purple due to anthocyanin accumulation.',
    symptomSummary_ar: 'تقزم شديد في الجذور الوتدية والجانبية مع انعدام الشعيرات الماصة وتلون بني مائل للأرجواني الداكن لتراكم الأنثوسيانين.',
    symptomSummary_fr: 'Racines secondaires très peu développées, arrêt d’élongation et coloration violacée des apex racinaires.',
    cellularRole: 'Critical for ATP, ADP, phospholipid cell membranes, DNA synthesis and root cellular division in the apical root cap.',
    cellularRole_ar: 'حجر الأساس لمركبات الطاقة ATP والفوسفوليبيدات للأغشية الخلوية وانقسام خلايا قلنسوة الجذر.',
    cellularRole_fr: 'Essentiel pour l’ATP, la synthèse d’ADN et la division cellulaire dans le méristème racinaire.',
    visualDiagnosticKeys: [
      'Poor root volume and lack of white feeder root hairs',
      'Purplish-brown pigmentation on outer root cortex',
      'Complete arrest of lateral branching in cold soils (<14°C)',
      'Seedling "sitting still" for weeks after transplant'
    ],
    visualDiagnosticKeys_ar: [
      'انخفاض حجم الكتلة الجذرية واختفاء الشعيرات الماصة البيضاء',
      'تلون أرجواني مائل للبني على قشرة الجذور',
      'توقف تام للتفرع الجذري في الترب الباردة أقل من 14 مئوية',
      'ركود الشتلات بعد الشتل وعدم قدرتها على التثبيت'
    ],
    visualDiagnosticKeys_fr: [
      'Faible volume racinaire et disparition des poils absorbants',
      'Pigmentation pourpre/brune du cortex racinaire',
      'Blocage de l’enracinement en sol froid (<14°C)',
      'Plantules bloquées sans croissance après repiquage'
    ],
    lookalikes: 'Root suffocation from waterlogging or cold soil stress without actual soil P deficiency.',
    lookalikes_ar: 'اختناق الجذور بالري الزائد أو برودة التربة دون وجود نقص حقيقي في مخزون التربة.',
    emergencyFoliarRecipe: {
      product: 'Mono-Potassium Phosphate (MKP 0-52-34) or Potassium Phosphite',
      product_ar: 'أحادي فوسفات البوتاسيوم (MKP 0-52-34) أو فوسفيت البوتاسيوم',
      product_fr: 'Phosphate Monopotassique (MKP 0-52-34) ou Phosphite de Potassium',
      dosage: '2.5 to 3.5 g/L with non-ionic organosilicone surfactant',
      dosage_ar: '2.5 إلى 3.5 جم/لتر مع ناشر سيليكوني',
      timing: 'Early morning spray on young vegetative foliage; repeat in 7 days',
      timing_ar: 'رش في الصباح الباكر ويكرر بعد 7 أيام',
      precautions: 'Do not mix with Calcium nitrate or micronutrient sulphates in the spray tank.',
      precautions_ar: 'ممنوع الخلط مع نترات الكالسيوم أو سلفات العناصر الصغرى لتجنب الترسيب.'
    },
    fertigationSoilProgram: {
      fertilizers: ['MAP (12-61-0) at 3-5 kg/ha per fertigation', 'Urea Phosphate (17-44-0) to lower soil pH', 'Ortho-phosphate starter gels'],
      fertilizers_ar: ['أحادي فوسفات الأمونيوم MAP بمعدل 3-5 كجم/هكتار', 'يوريا فوسفات (17-44-0) لتخفيض حموضة التربة', 'أسمدة بادئة غنية بالأورثوفوسفات'],
      soilPhCorrection: 'Maintain rhizosphere pH between 6.2 - 6.8 to prevent fixation with Ca (alkaline) or Fe/Al (acidic).',
      soilPhCorrection_ar: 'ضبط حموضة منطقة الجذور بين 6.2 و 6.8 لمنع التثبيت بالكالسيوم أو الحديد.',
      antagonismAvoidance: 'Avoid excess Zinc application which competes for the same uptake carrier.',
      antagonismAvoidance_ar: 'تجنب الإفراط في الزنك الذي ينافس على نفس نواقل الامتصاص.'
    },
    cropExamples: ['Tomato', 'Pepper', 'Corn', 'Strawberry', 'Citrus']
  },
  {
    id: 'root-ca',
    nutrient: 'Calcium',
    chemicalSymbol: 'Ca (Ca²⁺)',
    organ: 'roots',
    mobility: 'immobile',
    severity: 'critical',
    title: 'Calcium Deficiency in Root Tips & Apex Necrosis',
    title_ar: 'نقص الكالسيوم وموت قمم الجذور والشعيرات (Root Tip Necrosis)',
    title_fr: 'Carence en Calcium & Nécrose des Apex Racinaires',
    symptomSummary: 'Root tips turn brown, gelatinous, and die off; roots look stubby, thickened, and brittle like a brush.',
    symptomSummary_ar: 'تحول نهايات الجذور إلى اللون البني الهلامي وموت القمم مع تشوه الجذور لتصبح قصيرة وسميكة كالفرشاة.',
    symptomSummary_fr: 'Apex racinaires gélatineux, bruns et nécrosés ; racines courtes, trapues et cassantes.',
    cellularRole: 'Structural component of middle lamella (calcium pectate) maintaining cell wall rigidity and membrane stability.',
    cellularRole_ar: 'المكون الرئيسي للصفيحة الوسطى لجدران الخلايا (بكتات الكالسيوم) المسؤولة عن الصلابة واستقرار الغشاء.',
    cellularRole_fr: 'Ciment pectique de la lamelle moyenne assurant la cohésion cellulaire et la résistance mécanique.',
    visualDiagnosticKeys: [
      'Black/brown rotten root tips while main body remains firm',
      'Stubby "witch\'s broom" cluster appearance of secondary roots',
      'Mucilaginous/gelatinous breakdown of the root cap',
      'High vulnerability to Pythium and Rhizoctonia ingress'
    ],
    visualDiagnosticKeys_ar: [
      'تعفن قمم الجذور وتحولها للون الأسود مع بقاء الساق متماسكاً',
      'تفرع عقيم وكثيف يشبه مكنسة الساحرة للجذور الثانوية',
      'تحلل هلامي مخاطي لقلنسوة الجذر',
      'سهولة اختراق فطريات البيثيوم والريزوكتونيا للجذور التالفة'
    ],
    visualDiagnosticKeys_fr: [
      'Apex noirs et pourris alors que la base de la racine est saine',
      'Aspect de racines en "balai de sorcière" épaissies',
      'Désagrégation gélatineuse de la coiffe racinaire',
      'Porte d’entrée majeure pour Pythium et Phytophthora'
    ],
    lookalikes: 'Pythium root rot or high EC salt burn at root tips.',
    lookalikes_ar: 'عفن جذور البيثيوم أو حروق ملوحة الأسمدة المرتفعة EC.',
    emergencyFoliarRecipe: {
      product: 'Chelated Calcium (Ca-EDTA or Ca-amino acid complex)',
      product_ar: 'كالسيوم مخلبي (Ca-EDTA أو معقد أحماض أمينية)',
      product_fr: 'Calcium Chélaté (Ca-EDTA ou complexe d’acides aminés)',
      dosage: '2.0 g/L sprayed every 5 days',
      dosage_ar: '2.0 جم/لتر رشاً كل 5 أيام',
      timing: 'Apply during mild sunlight hours; calcium does not relocate to roots via phloem so root drench is also mandatory',
      timing_ar: 'يرش في الصباح، ومع عدم انتقال الكالسيوم باللحاء يلزم حقن الجذور فوراً',
      precautions: 'Foliar sprays only treat foliage/fruits; drench is essential for root system recovery.',
      precautions_ar: 'الرش يعالج الأوراق فقط ولا يغذي الجذور فيجب الحقن الأرضي فوراً.'
    },
    fertigationSoilProgram: {
      fertilizers: ['Fully soluble Calcium Nitrate (15.5-0-0 + 26% CaO) at 5-10 kg/ha', 'Liquid Calcium Thiosulfate (CTS) in alkaline soils'],
      fertilizers_ar: ['نترات الكالسيوم الذائبة بالكامل (15.5-0-0 + 26% CaO) بمعدل 5-10 كجم/هكتار', 'ثيوكبريتات الكالسيوم في الأراضي القلوية'],
      soilPhCorrection: 'Gypsum (CaSO4) application if soil pH is high and Calcium is deficient without raising pH.',
      soilPhCorrection_ar: 'استخدام الجبس الزراعي إذا كانت التربة قلوية لإمداد الكالسيوم دون رفع الـ pH.',
      antagonismAvoidance: 'Check K:Ca and Mg:Ca ratios; high potassium or ammonium directly blocks calcium root absorption.',
      antagonismAvoidance_ar: 'فحص نسبة K:Ca؛ الإفراط في البوتاسيوم أو الأمونيوم يحجب امتصاص الكالسيوم فوراً.'
    },
    cropExamples: ['Tomato', 'Lettuce', 'Potato', 'Cucumber', 'Melon']
  },

  // 2. STEM & VASCULAR SYSTEM
  {
    id: 'stem-k',
    nutrient: 'Potassium',
    chemicalSymbol: 'K (K⁺)',
    organ: 'stem',
    mobility: 'mobile',
    severity: 'moderate',
    title: 'Potassium Deficiency & Stem Lodging Weakness',
    title_ar: 'نقص البوتاسيوم وضعف الساق ورقاد النباتات',
    title_fr: 'Carence en Potassium & Fragilité de la Tige / Verse',
    symptomSummary: 'Weak, hollow, brittle stems with thin vascular bundles; plants easily bend, break under fruit load, or lodge during winds.',
    symptomSummary_ar: 'سيقان ضعيفة ومجوفة وهشة مع ضيق الحزم الوعائية، وسهولة كسر الساق تحت حمولة الثمار أو رقاده مع الرياح.',
    symptomSummary_fr: 'Tiges grêles, creuses et cassantes ; verse précoce sous la charge des fruits ou vent.',
    cellularRole: 'Osmotic pressure regulator, activates over 60 enzymes, governs stomatal conductance and strengthens vascular sclerenchyma.',
    cellularRole_ar: 'منظم الضغط الإسموزي وتنشيط أكثر من 60 إنزيماً وبناء خلايا السكلرنشيميا الداعمة للأوعية.',
    cellularRole_fr: 'Régulateur osmotique, activation enzymatique et épaississement des parois vasculaires de soutien.',
    visualDiagnosticKeys: [
      'Soft rubbery stem tissue prone to lodging',
      'Shortened internodes giving a stunted zigzag stem look',
      'Hollow stem pith under heavy nitrogen fertilization',
      'Premature vascular collapse under drought or high transpiration'
    ],
    visualDiagnosticKeys_ar: [
      'ليونة أنسجة الساق وسهولة انثنائها',
      'قصر السلاميات وظهور الساق بمظهر متعرج متقزم',
      'تجوف نخاع الساق عند التسميد النيتروجيني الزائد',
      'انهيار الأوعية الناقلة سريعاً عند الجفاف أو الإجهاد الحراري'
    ],
    visualDiagnosticKeys_fr: [
      'Tissus caulinaires mous et flexibles sensibles à la casse',
      'Entrenœuds courts et arqués',
      'Moelle creuse sous excès d’azote',
      'Affaissement vasculaire en cas de stress hydrique'
    ],
    lookalikes: 'Stem pith necrosis bacteria (*Pseudomonas*) or excessive shading elongation.',
    lookalikes_ar: 'مرض النخر البكتيري لنخاع الساق أو استطالة السيقان الناتجة عن التزاحم ونقص الإضاءة.',
    emergencyFoliarRecipe: {
      product: 'Potassium Sulfate (SOP 0-0-50) or Potassium Citrate',
      product_ar: 'سلفات البوتاسيوم فائق الذوبان (0-0-50) أو سترات البوتاسيوم',
      product_fr: 'Sulfate de Potassium Soluble (0-0-50) ou Citrate de Potassium',
      dosage: '3.0 - 5.0 g/L',
      dosage_ar: '3.0 إلى 5.0 جم/لتر',
      timing: 'Apply late afternoon; ensure complete stem and leaf coverage',
      timing_ar: 'يرش في المساء مع تغطية كاملة للساق والأوراق',
      precautions: 'Ensure pH of spray solution is buffered to 6.0 to prevent scorching.',
      precautions_ar: 'معايرة حموضة محلول الرش عند 6.0 لتجنب احتراق الأوراق.'
    },
    fertigationSoilProgram: {
      fertilizers: ['Potassium Nitrate (13-0-46) at 15-25 kg/ha/week', 'Potassium Thiosulfate (KTS 0-0-25 + 17% S)'],
      fertilizers_ar: ['نترات البوتاسيوم (13-0-46) بمعدل 15-25 كجم/هكتار أسبوعياً', 'ثيوكبريتات البوتاسيوم KTS'],
      soilPhCorrection: 'Maintain soil pH 6.0 - 7.5; highly acidic soils leach potassium rapidly.',
      soilPhCorrection_ar: 'الحفاظ على pH التربة بين 6.0 و 7.5 حيث تفقد الأراضي الحامضية البوتاسيوم بالغسيل.',
      antagonismAvoidance: 'Keep K / (Ca + Mg) equivalent balance around 0.25 - 0.35.',
      antagonismAvoidance_ar: 'الحفاظ على اتزان الكاتيونات K/(Ca+Mg) حول 0.3 لتجنب تضاد المغنيسيوم.'
    },
    cropExamples: ['Tomato', 'Cereals', 'Banana', 'Sugarcane', 'Pepper']
  },

  // 3. LOWER / OLDER LEAVES
  {
    id: 'lower-n',
    nutrient: 'Nitrogen',
    chemicalSymbol: 'N (NO₃⁻ / NH₄⁺)',
    organ: 'lower_leaves',
    mobility: 'mobile',
    severity: 'critical',
    title: 'Nitrogen Deficiency: Uniform Lower Leaf Chlorosis',
    title_ar: 'نقص النيتروجين: اصفرار عام شامل للأوراق السفلية والمسنة',
    title_fr: 'Carence en Azote : Chlorose Généralisée des Feuilles Basses',
    symptomSummary: 'Uniform pale green to bright yellow discoloration beginning at the oldest bottom leaves and progressing steadily upwards; veins turn yellow along with the blade.',
    symptomSummary_ar: 'اصفرار متجانس شامل يبدأ من الأوراق السفلية القديمة صاعداً للأعلى، حيث تصفر العروق ونصل الورقة معاً بانتظام.',
    symptomSummary_fr: 'Jaunissement uniforme partant des feuilles les plus âgées vers le haut ; limbe et nervures jaunissent ensemble.',
    cellularRole: 'Core constituent of all amino acids, proteins, nucleic acids, and the central tetrapyrrole ring of chlorophyll.',
    cellularRole_ar: 'المكون الأساسي لجميع الأحماض الأمينية والبروتينات وحلقة البورفيرين للكلوروفيل.',
    cellularRole_fr: 'Composant majeur des acides aminés, protéines, acides nucléiques et de la chlorophylle.',
    visualDiagnosticKeys: [
      'Uniform yellowing of entire leaf (blade + veins together)',
      'Starts strictly on the oldest basal leaves while top leaves stay green',
      'Leaves become thin, papery, and senesce/drop prematurely',
      'Whole plant displays light green spindly growth'
    ],
    visualDiagnosticKeys_ar: [
      'اصفرار متجانس لكامل الورقة (النصل والعروق معاً)',
      'يبدأ حصرياً في الأوراق القاعدية المسنة بينما القمة خضراء',
      'تصبح الأوراق رقيقة وجافة وتسقط مبكراً',
      'نمو عام باهت ومتقزم وضعيف التفرع'
    ],
    visualDiagnosticKeys_fr: [
      'Jaunissement complet et uniforme (limbe + nervures)',
      'Débute strictement sur les feuilles les plus vieilles',
      'Feuilles minces, parcheminées, chute prématurée',
      'Port général grêle et vert très pâle'
    ],
    lookalikes: 'Root asphyxiation from over-irrigation or nematode damage restricting N uptake.',
    lookalikes_ar: 'غرق الجذور ونقص الأكسجين بالتربة أو إصابة النيماتودا الحادة.',
    emergencyFoliarRecipe: {
      product: 'Low-Biuret Foliar Urea (46-0-0) or Calcium Nitrate',
      product_ar: 'يوريا ورقية منخفضة البيوريت (46-0-0) أو نترات الكالسيوم',
      product_fr: 'Urée Foliaire Bas Biuret ou Nitrate de Chaux',
      dosage: '4.0 - 5.0 g/L (Urea) or 3.0 g/L (Calcium Nitrate)',
      dosage_ar: '4 إلى 5 جم/لتر يوريا أو 3 جم/لتر نترات كالسيوم',
      timing: 'Spray early morning; greening response visible in 48-72 hours',
      timing_ar: 'يرش صباحاً وتظهر استجابة الاخضرار خلال 48-72 ساعة',
      precautions: 'Biuret content must be <0.2% to avoid leaf margin toxicity scorch.',
      precautions_ar: 'يجب ألا تتعدى نسبة البيوريت 0.2% لتجنب سمية واحتراق حواف الأوراق.'
    },
    fertigationSoilProgram: {
      fertilizers: ['Ammonium Nitrate (33.5% N) or Calcium Nitrate in irrigation', 'Urea 46% during rapid vegetative flush'],
      fertilizers_ar: ['نترات النشادر (33.5%) أو نترات الكالسيوم عبر التسميد', 'يوريا 46% خلال مرحلة النشاط الخضري'],
      soilPhCorrection: 'Nitrate (NO3-) preferred in acidic soils; Ammonium (NH4+) limited to <20% of total N in warm soils.',
      soilPhCorrection_ar: 'تفضيل النترات في الأراضي الحامضية وتقليل الأمونيوم لأقل من 20% في الأجواء الحارة.',
      antagonismAvoidance: 'Do not overload ammonium (NH4+) as it inhibits Ca²⁺ and Mg²⁺ uptake.',
      antagonismAvoidance_ar: 'تجنب الإفراط في الأمونيوم لأنه يثبط امتصاص الكالسيوم والمغنيسيوم.'
    },
    cropExamples: ['Tomato', 'Corn', 'Citrus', 'Wheat', 'Cucumber']
  },
  {
    id: 'lower-mg',
    nutrient: 'Magnesium',
    chemicalSymbol: 'Mg (Mg²⁺)',
    organ: 'lower_leaves',
    mobility: 'mobile',
    severity: 'moderate',
    title: 'Magnesium Deficiency: Inverted-V Interveinal Chlorosis',
    title_ar: 'نقص المغنيسيوم: اصفرار ما بين العروق على شكل حرف V مقلوب للأوراق السفلية',
    title_fr: 'Carence en Magnésium : Chlorose Internervaire en V Inversé',
    symptomSummary: 'Striking interveinal chlorosis on bottom leaves where veins remain dark green while the interveinal tissue turns bright yellow, bronze, or orange-red.',
    symptomSummary_ar: 'اصفرار شديد بين العروق في الأوراق السفلية مع بقاء العروق الرئيسية خضراء داكنة وظهور ألوان برونزية أو محمرة مع تقدم الإصابة.',
    symptomSummary_fr: 'Chlorose internervaire nette sur les feuilles basses : les nervures restent vert foncé tandis que le limbe jaunit ou bronze.',
    cellularRole: 'Central metallic atom in the chlorophyll molecule (porphyrin ring) and activator of Ribulose-1,5-bisphosphate carboxylase (Rubisco).',
    cellularRole_ar: 'الذرة المركزية لجزيء الكلوروفيل والمنشط الرئيسي لإنزيم الروبيسكو المسؤول عن تثبيت الكربون.',
    cellularRole_fr: 'Atome central de la molécule de chlorophylle et activateur de la Rubisco pour la photosynthèse.',
    visualDiagnosticKeys: [
      'Main leaf veins remain clearly dark green',
      'Interveinal tissue turns bright yellow starting from margins inwards',
      'Classic "inverted V" green pattern pointing towards the petiole',
      'Leaves become brittle and turn purple/bronze in brassicas and tomatoes'
    ],
    visualDiagnosticKeys_ar: [
      'بقاء العروق الرئيسية خضراء داكنة بوضوح',
      'اصفرار ناصع لما بين العروق يبدأ من الحواف متجهاً للداخل',
      'ظهور شكل حرف V مقلوب أخضر متجهاً نحو عنق الورقة',
      'تقصف الأوراق وتلونها بالبرونزي أو البنفسجي في الطماطم والصليبيات'
    ],
    visualDiagnosticKeys_fr: [
      'Nervures principales restant nettement vert foncé',
      'Limbe internervaire jaune vif puis bronzé',
      'Motif caractéristique en "V inversé" vert vers le pétiole',
      'Feuilles cassantes et épaissies avec coloration pourpre'
    ],
    lookalikes: 'Potassium deficiency (which shows marginal necrosis rather than interveinal chlorosis) or Spider mite damage.',
    lookalikes_ar: 'نقص البوتاسيوم (الذي يتميز باحتراق الحواف) أو الإصابة بالعنكبوت الأحمر.',
    emergencyFoliarRecipe: {
      product: 'Magnesium Sulfate Heptahydrate (Epsom Salt - MgSO4·7H2O, 16% MgO)',
      product_ar: 'سلفات المغنيسيوم (ملح إبسوم - MgSO4·7H2O بتركيز 16% MgO)',
      product_fr: 'Sulfate de Magnésium Heptahydraté (Sel d’Epsom - 16% MgO)',
      dosage: '10.0 - 15.0 g/L (1-1.5%)',
      dosage_ar: '10 إلى 15 جم/لتر (1-1.5%)',
      timing: 'Apply in morning or cloudy day; 2-3 sprays spaced 7 days apart',
      timing_ar: 'رش صباحاً ويكرر مرتين إلى 3 مرات بفاصل أسبوع',
      precautions: 'Do not tank mix with Calcium nitrate (precipitates Gypsum).',
      precautions_ar: 'ممنوع الخلط مع نترات الكالسيوم في نفس برميل الرش.'
    },
    fertigationSoilProgram: {
      fertilizers: ['Magnesium Sulfate (MgSO4) at 20-30 kg/ha', 'Magnesium Nitrate [Mg(NO3)2] for simultaneous N + Mg push'],
      fertilizers_ar: ['سلفات المغنيسيوم بمعدل 20-30 كجم/هكتار', 'نترات المغنيسيوم للحقن المشترك مع النيتروجين'],
      soilPhCorrection: 'Apply Dolomitic Limestone (CaCO3·MgCO3) in acidic soils to raise pH and supply Mg.',
      soilPhCorrection_ar: 'إضافة الحجر الجيري الدولوميتي في الأراضي الحامضية لرفع الـ pH وإمداد المغنيسيوم.',
      antagonismAvoidance: 'High Potassium (K+) or Ammonium (NH4+) in soil aggressively induces magnesium deficiency; lower K dosage.',
      antagonismAvoidance_ar: 'الإفراط في البوتاسيوم أو الأمونيوم يسبب نقصاً مستحثاً حاداً في المغنيسيوم؛ خفض جرعة K.'
    },
    cropExamples: ['Tomato', 'Grapevine', 'Citrus', 'Oil Palm', 'Potato']
  },
  {
    id: 'lower-k',
    nutrient: 'Potassium',
    chemicalSymbol: 'K (K⁺)',
    organ: 'lower_leaves',
    mobility: 'mobile',
    severity: 'critical',
    title: 'Potassium Deficiency: Marginal Leaf Scorch & Necrosis',
    title_ar: 'نقص البوتاسيوم: احتراق واحتداد حواف الأوراق السفلية (Marginal Scorch)',
    title_fr: 'Carence en Potassium : Brûlure et Nécrose Marginale des Feuilles Basses',
    symptomSummary: 'Tips and outer margins of older lower leaves turn yellow, scorch brown, curl upwards, and die as if burnt by fire.',
    symptomSummary_ar: 'اصفرار واحتراق حواف وقمم الأوراق السفلية القديمة مع جفافها وتجعدها للأعلى كأنها محروقة بالنار.',
    symptomSummary_fr: 'Jaunissement puis nécrose brûlée des pointes et bordures des vieilles feuilles, s’enroulant vers le haut.',
    cellularRole: 'Osmotic regulation, stomatal guard cell opening/closing, phloem transport of sugars and starch loading into storage organs.',
    cellularRole_ar: 'التحكم في فتح وغلق الثغور ونقل السكريات باللحاء وتخزين النشا في الثمار والدرنات.',
    cellularRole_fr: 'Régulation stomatique, turgescence cellulaire et translocation des sucres vers les fruits/tubercules.',
    visualDiagnosticKeys: [
      'Dry necrotic "burnt" margin along the leaf edge',
      'Begins at leaf tip and advances backwards along margins',
      'Center of leaf blade often remains dark green initially',
      'Leaves curl upward and become crispy and dry'
    ],
    visualDiagnosticKeys_ar: [
      'حافة جافة وميتة بنية اللون ممتدة على طول أطراف الورقة',
      'يبدأ الاحتراق من قمة الورقة ويتراجع بمحاذاة الحواف',
      'يبقى مركز الورقة أخضر في البداية',
      'التفاف الحواف للأعلى وتيبسها مثل الرقائق'
    ],
    visualDiagnosticKeys_fr: [
      'Bordure nécrosée et sèche d’aspect brûlé',
      'Départ à la pointe foliaire puis progression sur les marges',
      'Centre du limbe souvent vert au début',
      'Feuilles enroulées vers le haut et cassantes'
    ],
    lookalikes: 'Salinity / Chloride toxicity scorch or fertilizer salt burn.',
    lookalikes_ar: 'سمية الكلوريد والملوحة العالية أو حروق الأسمدة السطحية.',
    emergencyFoliarRecipe: {
      product: 'Potassium Nitrate (13-0-46) or Potassium Thiosulfate',
      product_ar: 'نترات البوتاسيوم (13-0-46) أو سترات البوتاسيوم',
      product_fr: 'Nitrate de Potassium (13-0-46) ou Citrate de Potassium',
      dosage: '4.0 - 6.0 g/L',
      dosage_ar: '4 إلى 6 جم/لتر',
      timing: 'Spray twice a week during heavy fruit filling',
      timing_ar: 'رش مرتين أسبوعياً أثناء مرحلة التحجيم والملء',
      precautions: 'Do not spray in midday heat (>28°C) to avoid osmotic leaf burn.',
      precautions_ar: 'تجنب الرش أثناء حرارة الظهيرة (>28 مئوية) لتفادي الحروق الإسموزية.'
    },
    fertigationSoilProgram: {
      fertilizers: ['Soluble Sulfate of Potash (SOP 0-0-50) at 30-50 kg/ha/week', 'Potassium Nitrate during fruit load'],
      fertilizers_ar: ['سلفات البوتاسيوم الذائبة (0-0-50) بمعدل 30-50 كجم/هكتار أسبوعياً', 'نترات البوتاسيوم مع عقد الثمار'],
      soilPhCorrection: 'In alkaline calcareous soils, use SOP or KTS to acidify the root strip.',
      soilPhCorrection_ar: 'في الأراضي الكلسية القلوية، يفضل استخدام سلفات أو ثيوكبريتات البوتاسيوم.',
      antagonismAvoidance: 'Balance potassium with calcium and magnesium to avoid inducing BER or Mg chlorosis.',
      antagonismAvoidance_ar: 'موازنة البوتاسيوم مع الكالسيوم والمغنيسيوم لتجنب عفن الطرف الزهري.'
    },
    cropExamples: ['Tomato', 'Potato', 'Cucumber', 'Citrus', 'Banana', 'Grape']
  },

  // 4. UPPER / YOUNG LEAVES
  {
    id: 'upper-fe',
    nutrient: 'Iron',
    chemicalSymbol: 'Fe (Fe²⁺ / Fe³⁺)',
    organ: 'upper_leaves',
    mobility: 'immobile',
    severity: 'critical',
    title: 'Iron Deficiency: Intense Fine-Mesh Interveinal Chlorosis on Young Leaves',
    title_ar: 'نقص الحديد: اصفرار شبكي دقيق ما بين العروق على الأوراق القمية والحديثة',
    title_fr: 'Carence en Fer : Chlorose Internervaire Réticulée des Jeunes Feuilles',
    symptomSummary: 'Emerging terminal leaves turn ivory-yellow to bleach-white between a very fine network of dark green veins; entire new shoots look bleached.',
    symptomSummary_ar: 'تحول الأوراق الحديثة والقمم النامية إلى لون أصفر باهت أو أبيض عاجي مع بقاء شبكة العروق الدقيقة خضراء داكنة بصورة حادة.',
    symptomSummary_fr: 'Nouvelles feuilles apicales jaune ivoire à blanc décoloré avec un réseau très fin de nervures vert foncé.',
    cellularRole: 'Electron transfer in cytochromes, ferredoxin, catalase, and enzymatic precursor for chlorophyll synthesis.',
    cellularRole_ar: 'نواقل الإلكترونات في السيتوكروم والفريدوكسين وتخليق السلسلة البادئة للكلوروفيل.',
    cellularRole_fr: 'Transport d’électrons dans la chaîne respiratoire/photosynthétique et précurseur de la synthèse de chlorophylle.',
    visualDiagnosticKeys: [
      'Strictly affects the newest, youngest emerging leaves at the top',
      'Extremely sharp contrast: paper-white/bright yellow blade with fine green veins',
      'In extreme cases, young leaves emerge completely white without green veins',
      'Lower and mature leaves remain fully dark green'
    ],
    visualDiagnosticKeys_ar: [
      'يصيب حصرياً الأوراق الحديثة والنموات القمية الغضة',
      'تباين حاد جداً: نصل أصفر/أبيض عاجي وشبكة عروق دقيقة خضراء',
      'في الحالات الحادة تصبح النموات الجديدة بيضاء كلياً وتتوقف',
      'الأوراق السفلية والمسنة تظل خضراء تماماً'
    ],
    visualDiagnosticKeys_fr: [
      'Touche exclusivement les jeunes pousses apicales en émergence',
      'Contraste très vif : limbe blanc/ivoire et réseau fin vert foncé',
      'Blanchiment complet des apex en cas de carence sévère',
      'Feuilles âgées de la base restant parfaitement vertes'
    ],
    lookalikes: 'Manganese deficiency (which has wider green bands and necrotic specks) or Sulfur deficiency (uniform pale green without green veins).',
    lookalikes_ar: 'نقص المنجنيز (حيث تكون أشرطة العروق أعرض مع بقع بنية) أو نقص الكبريت (اصفرار متجانس دون شبكة عروق).',
    emergencyFoliarRecipe: {
      product: 'Fe-EDTA (in acidic spray water pH < 6.5) or Fe-DTPA / Fe-Amino Acid chelate',
      product_ar: 'حديد مخلبي Fe-EDTA (مع ماء رش حامضي pH<6.5) أو Fe-DTPA أو حديد أحماض أمينية',
      product_fr: 'Chélate Fe-EDTA / Fe-DTPA ou Chélate Fe-Acides Aminés',
      dosage: '1.0 - 1.5 g/L',
      dosage_ar: '1.0 إلى 1.5 جم/لتر',
      timing: 'Apply early morning or late evening; repeat in 5 days',
      timing_ar: 'رش في الصباح الباكر أو الغروب ويكرر بعد 5 أيام',
      precautions: 'Do not expose iron solutions to direct UV sunlight in the tank; Fe degrades fast.',
      precautions_ar: 'عدم ترك محلول الحديد في الخزان معرضاً للشمس لتفككه السريع بالأشعة فوق البنفسجية.'
    },
    fertigationSoilProgram: {
      fertilizers: ['Fe-EDDHA (6% ortho-ortho) at 5-10 g/tree or 2-4 kg/ha in calcareous/alkaline soil (pH > 7.5)', 'Fe-DTPA in soilless hydroponics (pH 6.5-7.5)'],
      fertilizers_ar: ['حديد شيلات Fe-EDDHA (6% أورثو-أورثو) بمعدل 2-4 كجم/هكتار في الأراضي الكلسية القلوية', 'حديد Fe-DTPA في الهيدروبونيك'],
      soilPhCorrection: 'Acidify irrigation water to pH 5.8-6.2 using Nitric or Phosphoric acid to mobilize soil native iron.',
      soilPhCorrection_ar: 'معادلة وحقن أحماض النيتريك أو الفوسفوريك لخفض pH ماء الري لـ 6.0 لتحرير حديد التربة.',
      antagonismAvoidance: 'Excessive Phosphorus (P) precipitates Iron as insoluble iron phosphate in roots.',
      antagonismAvoidance_ar: 'الإفراط في الفوسفور يرسب الحديد داخل الجذور على صورة فوسفات حديد غير ذائبة.'
    },
    cropExamples: ['Tomato', 'Citrus', 'Peach', 'Vineyard', 'Rose', 'Strawberry']
  },
  {
    id: 'upper-mn',
    nutrient: 'Manganese',
    chemicalSymbol: 'Mn (Mn²⁺)',
    organ: 'upper_leaves',
    mobility: 'immobile',
    severity: 'moderate',
    title: 'Manganese Deficiency: Checkered Interveinal Chlorosis & Necrotic Flecking',
    title_ar: 'نقص المنجنيز: اصفرار مبقع بين العروق ونقط ميتة بنية (Speckling)',
    title_fr: 'Carence en Manganèse : Chlorose à Damiers & Mouchetures Nécrotiques',
    symptomSummary: 'Young and middle-upper leaves develop mottled yellow interveinal patches with wide green vein borders, followed by tiny brown necrotic speckles across the leaf blade.',
    symptomSummary_ar: 'تطور بقع صفراء مبقعة بين العروق على الأوراق الحديثة والمتوسطة مع حزم عروق خضراء عريضة وظهور نقط بنية ميتة دقيقة.',
    symptomSummary_fr: 'Jeunes feuilles montrant une chlorose tachetée avec bandes vertes larges le long des nervures, puis fines ponctuations nécrotiques brunes.',
    cellularRole: 'Water photolysis in Photosystem II (Hill reaction), lignin synthesis and nitrate reduction enzyme activation.',
    cellularRole_ar: 'التحلل الضوئي للماء في نظام البناء الضوئي الثاني (تفاعل هيل) وبناء اللجنين وتنشيط إنزيمات اختزال النترات.',
    cellularRole_fr: 'Photolyse de l’eau dans le Photosystème II, biosynthèse de la lignine et réduction des nitrates.',
    visualDiagnosticKeys: [
      'Wide green bands along main and secondary veins (unlike the razor-thin veins of Fe deficiency)',
      'Checkered/mottled appearance across the leaf blade',
      'Small sunken necrotic pinhead spots (flecking) scattered over chlorotic zones',
      'Leaves remain pliable rather than brittle'
    ],
    visualDiagnosticKeys_ar: [
      'حزم خضراء عريضة على طول العروق الرئيسية والثانوية (عكس شبكة الحديد الدقيقة جداً)',
      'مظهر مبقع كالشطرنج على نصل الورقة',
      'نقط بنية ميتة دقيقة كعلامات رأس الدبوس متناثرة على المناطق الصفراء',
      'الورقة تحتفظ بمرونتها ولا تصبح هشة كالزجاج'
    ],
    visualDiagnosticKeys_fr: [
      'Larges bandes vertes bordant les nervures (différent du réseau très fin du fer)',
      'Aspect moucheté en damier sur le limbe',
      'Petites ponctuations nécrotiques brunes ponctuées',
      'Feuilles restant souples et non cassantes'
    ],
    lookalikes: 'Iron deficiency, early spider mite feeding, or ozone pollution injury.',
    lookalikes_ar: 'نقص الحديد أو بداية وخز حلم العنكبوت الأحمر أو أضرار التلوث بالأوزون.',
    emergencyFoliarRecipe: {
      product: 'Manganese Sulfate (MnSO4·H2O) or Mn-EDTA chelate',
      product_ar: 'سلفات المنجنيز (MnSO4·H2O) أو منجنيز مخلبي Mn-EDTA',
      product_fr: 'Sulfate de Manganèse ou Chélate Mn-EDTA',
      dosage: '1.5 - 2.0 g/L buffered with citric acid to pH 5.5',
      dosage_ar: '1.5 إلى 2.0 جم/لتر مع ضبط pH الرش عند 5.5 بحمض الستريك',
      timing: 'Spray at first sign of interveinal mottling; 2 applications',
      timing_ar: 'يرش عند ظهور أول علامات التبقع ويكرر مرتين',
      precautions: 'Do not spray when temperatures exceed 30°C.',
      precautions_ar: 'تجنب الرش عند درجات حرارة تتجاوز 30 مئوية.'
    },
    fertigationSoilProgram: {
      fertilizers: ['Mn-EDTA or Mn-lignosulfonate at 1-2 kg/ha via fertigation', 'Soil application of Manganese Sulfate banded close to roots with acidifying N'],
      fertilizers_ar: ['منجنيز مخلبي Mn-EDTA بمعدل 1-2 كجم/هكتار عبر شبكة الري', 'سلفات المنجنيز مع الأسمدة النيتروجينية الحامضية'],
      soilPhCorrection: 'Soil pH > 7.2 strongly oxidizes Mn into unavailable Mn⁴⁺; apply elemental sulfur to lower pH.',
      soilPhCorrection_ar: 'الأراضي ذات pH أعلى من 7.2 تؤكسد المنجنيز لشكل غير ميسر؛ يلزم إضافة الكبريت الزراعي.',
      antagonismAvoidance: 'Excess iron (Fe) or zinc (Zn) competes directly for root divalent ion channels.',
      antagonismAvoidance_ar: 'الإفراط في الحديد والزنك ينافس على قنوات الامتصاص الثنائية.'
    },
    cropExamples: ['Soybean', 'Tomato', 'Citrus', 'Oats', 'Sugar Beet']
  },
  {
    id: 'upper-zn',
    nutrient: 'Zinc',
    chemicalSymbol: 'Zn (Zn²⁺)',
    organ: 'upper_leaves',
    mobility: 'immobile',
    severity: 'critical',
    title: 'Zinc Deficiency: Little Leaf, Rosetting & Interveinal Banding',
    title_ar: 'نقص الزنك: صغر وتقزم الأوراق وظاهرة التورد (Little Leaf & Rosette)',
    title_fr: 'Carence en Zinc : Petites Feuilles, Rosette & Raccourcissement des Entrenœuds',
    symptomSummary: 'Emerging upper leaves are abnormally small, narrow, clustered closely together due to shortened internodes ("rosette"), with wide chlorotic bands between veins.',
    symptomSummary_ar: 'خروج أوراق علوية صغيرة جداً وضيقة ومتجمعة ومتزاحمة في قمة الساق بسبب قصر السلاميات (تورد القمة) مع شحوب عريض بين العروق.',
    symptomSummary_fr: 'Jeunes feuilles très réduites, étroites, dressées et agglomérées en rosette par raccourcissement des entrenœuds.',
    cellularRole: 'Required for biosynthesis of Tryptophan (the direct precursor of Auxin/Indole-3-Acetic Acid - IAA) and carbonic anhydrase.',
    cellularRole_ar: 'ضروري لتخليق حمض التريبتوفان (المولد المباشر لهرمون الأوكسين IAA المسؤول عن استطالة الخلايا) وإنزيم الكربونيك أنهيدريز.',
    cellularRole_fr: 'Indispensable à la synthèse du Tryptophane (précurseur de l’auxine AIE) et à l’élongation cellulaire.',
    visualDiagnosticKeys: [
      'Severe reduction in leaf size ("Little Leaf syndrome")',
      'Short internodes causing crowded leaves at shoot tip ("Rosetting")',
      'Leaves become narrow, lanceolate, and stiff/upright',
      'Broad white/yellow bands on either side of the midrib in monocots (white bud in corn)'
    ],
    visualDiagnosticKeys_ar: [
      'صغر مفرط في حجم الأوراق (متلازمة الورقة الصغيرة Little Leaf)',
      'قصر شديد في المسافات بين العقد مسبباً مظهر تورد القمة Rosette',
      'أوراق رمحية ضيقة متصلبة قائمة',
      'ظاهرة البرعم الأبيض في الذرة وخطوط شاحبة عريضة حول العرق الوسطي'
    ],
    visualDiagnosticKeys_fr: [
      'Réduction spectaculaire de la surface foliaire ("Petites Feuilles")',
      'Entrenœuds très courts donnant un aspect en touffe/rosette',
      'Feuilles dressées, rigides et lancéolées',
      'Symptôme du "bourgeon blanc" chez le maïs'
    ],
    lookalikes: 'Herbicide hormone drift (2,4-D / glyphosate damage) or viral stunt complexes.',
    lookalikes_ar: 'أضرار رذاذ مبيدات الحشائش الهرمونية أو الفيروسات المسببة للتقزم.',
    emergencyFoliarRecipe: {
      product: 'Zinc-EDTA chelate (15% Zn) or Zinc Sulfate (ZnSO4·7H2O)',
      product_ar: 'زنك مخلبي Zn-EDTA (15%) أو سلفات الزنك',
      product_fr: 'Chélate Zn-EDTA (15% Zn) ou Sulfate de Zinc',
      dosage: '1.0 - 1.5 g/L with humectant/adjuvant',
      dosage_ar: '1.0 إلى 1.5 جم/لتر مع مادة ناشرة',
      timing: 'Apply at early shoot vegetative extension before flower bud burst',
      timing_ar: 'يرش مع بداية انطلاق النموات الخضرية قبل تفتح البراعم الزهرية',
      precautions: 'In stone fruits and citrus, apply during flush dormancy or mild temperature flushes.',
      precautions_ar: 'في أشجار الفاكهة يرش عند خروج دورات النمو الربيعية.'
    },
    fertigationSoilProgram: {
      fertilizers: ['Zinc Sulfate (ZnSO4) at 5-10 kg/ha or Zn-EDTA in fertigation', 'Zinc-coated starter fertilizers'],
      fertilizers_ar: ['سلفات الزنك بمعدل 5-10 كجم/هكتار أو زنك مخلبي بالتنقيط', 'أسمدة بادئة محببة معززة بالزنك'],
      soilPhCorrection: 'Zinc availability drops 100-fold for every 1 unit rise in pH above 6.5.',
      soilPhCorrection_ar: 'تنخفض إتاحة الزنك 100 ضعف لكل زيادة بمقدار درجة واحدة في pH التربة فوق 6.5.',
      antagonismAvoidance: 'Heavy Phosphorus (P) over-fertilization strongly induces severe Zinc starvation.',
      antagonismAvoidance_ar: 'الإفراط في الفوسفات يمنع انتقال الزنك من الجذور للأوراق تماماً.'
    },
    cropExamples: ['Corn', 'Citrus', 'Pecan', 'Apple', 'Tomato', 'Rice']
  },

  // 5. APICAL MERISTEM & SHOOT TIPS
  {
    id: 'apical-ca-b',
    nutrient: 'Calcium & Boron',
    chemicalSymbol: 'Ca²⁺ & B (H₃BO₃)',
    organ: 'apical_meristem',
    mobility: 'immobile',
    severity: 'critical',
    title: 'Calcium / Boron Deficiency: Shoot Tip Dieback & Hooked Distortion',
    title_ar: 'نقص الكالسيوم والبورون: موت القمة النامية وتشوه البراعم الطرفية (Tip Dieback)',
    title_fr: 'Carence en Calcium & Bore : Mort du Bourgeon Terminal & Déformation Apicale',
    symptomSummary: 'Growing tip wilts, curls like a shepherd’s crook, turns black/necrotic, and dies completely; plant loses apical dominance and triggers excessive weak lateral branching.',
    symptomSummary_ar: 'ذبول والتفاف القمة النامية كعصا الراعي مع موتها وتحولها للأسود، وفقدان السيادة القمية وتفرع عشوائي كثيف ضعيف للبراعم الجانبية.',
    symptomSummary_fr: 'Mort et nécrose noire du bourgeon terminal apical ("crochet de berger"), perte de dominance apicale et buissonnement latéral.',
    cellularRole: 'Pectin cross-linking in newly dividing cell walls (Ca) and rhamnogalacturonan-II borate diester cross-links (B) essential for cell division.',
    cellularRole_ar: 'بناء جدران الخلايا المنقسمة حديثاً (الكالسيوم) وتشابك استرات البورات مع البكتين (البورون) لاستمرار نمو الأنسجة المرستيمية.',
    cellularRole_fr: 'Pontages pectiques des parois primaires néoformées (Ca) et réticulation borate-RG-II (B).',
    visualDiagnosticKeys: [
      'Black death of the main central growing shoot point',
      'Youngest terminal leaves curl downwards with deformed hooked margins',
      'Loss of apical dominance producing a "bushy / broom" multi-stem habit',
      'Brittle, cracked petioles that snap off easily when touched'
    ],
    visualDiagnosticKeys_ar: [
      'موت وتفحم البرعم الطرفي النامي الرئيسي',
      'التفاف الأوراق القمية لأسفل كالمخلب مع تشوه حوافها',
      'فقد السيادة القمية ونمو شجيري كثيف متقزم',
      'هشاشة أعناق الأوراق وتكسرها بسهولة بمجرد لمسها'
    ],
    visualDiagnosticKeys_fr: [
      'Nécrose noire irrémédiable du méristème terminal',
      'Feuilles apicales recourbées en crochet et crispées',
      'Perte de dominance apicale et prolifération de pousses secondaires',
      'Pétioles cassants comme du verre'
    ],
    lookalikes: 'Broad mite (*Polyphagotarsonemus latus*) injury or terminal shoot blight fungi.',
    lookalikes_ar: 'إصابة الحلم العريض (الأكاروس العريض) أو عفن القمم الفطري.',
    emergencyFoliarRecipe: {
      product: 'Liquid Calcium-Boron Complex (e.g. 10% Ca + 1% B with Polyols/Sorbitol)',
      product_ar: 'مركب كالسيوم-بورون مخلبي سائل (10% Ca + 1% B مع بوليولات/سوربيتول)',
      product_fr: 'Complexe Liquide Calcium-Bore (10% Ca + 1% B formulé avec polyols)',
      dosage: '2.0 - 2.5 ml/L',
      dosage_ar: '2.0 إلى 2.5 مل/لتر',
      timing: 'Direct spray at growing shoot tips early morning; repeat in 4 days',
      timing_ar: 'رش موجه مباشرة على القمم النامية صباحاً ويكرر بعد 4 أيام',
      precautions: 'Boron safety margin is narrow; do not exceed recommended dosage to avoid foliar toxicity.',
      precautions_ar: 'هامش أمان البورون ضيق جداً؛ الالتزام الدقيق بالجرعة منعاً لسمية الأوراق.'
    },
    fertigationSoilProgram: {
      fertilizers: ['Calcium Nitrate (15-0-0 + 26% CaO) at 10 kg/ha', 'Solubor (Disodium Octaborate Tetrahydrate, 20.8% B) at 0.5 - 1 kg/ha'],
      fertilizers_ar: ['نترات الكالسيوم بمعدل 10 كجم/هكتار', 'سوليوبور (بورون ذائب 20.8% B) بمعدل 0.5-1 كجم/هكتار'],
      soilPhCorrection: 'Boron is easily locked in soil with pH > 7.5; maintain pH 6.2 - 6.8.',
      soilPhCorrection_ar: 'يثبت البورون بقوة في التربة عند pH أعلى من 7.5؛ يفضل خفض pH منطقة الجذور.',
      antagonismAvoidance: 'Ensure constant soil moisture; dry cycles instantly halt Calcium delivery to the apical tip.',
      antagonismAvoidance_ar: 'انتظام الري ضروري جداً؛ جفاف التربة يوقف صعود الكالسيوم للقمم فوراً.'
    },
    cropExamples: ['Tomato', 'Pepper', 'Broccoli', 'Celery', 'Sunflower', 'Sugar Beet']
  },

  // 6. FLOWERS & INFLORESCENCE
  {
    id: 'flower-b-mo',
    nutrient: 'Boron & Molybdenum',
    chemicalSymbol: 'B & Mo (MoO₄²⁻)',
    organ: 'flowers',
    mobility: 'immobile',
    severity: 'critical',
    title: 'Boron & Moly Deficiency: Blossom Drop & Pollen Sterility',
    title_ar: 'نقص البورون والموليبدنوم: تساقط الأزهار وفشل الإخصاب وعقم حبوب اللقاح',
    title_fr: 'Carence en Bore & Molybdène : Coulure des Fleurs & Stérilité Pollinique',
    symptomSummary: 'Abundant flower bud formation but flowers turn yellow at the abscission zone and drop off before fruit set; pollen grains fail to germinate and styles dry up.',
    symptomSummary_ar: 'تكوين براعم زهرية كثيفة لكنها تصفر وتنفصل عند منطقة عنق الزهرة وتسقط قبل العقد مع جفاف المياسم وعقم حبوب اللقاح.',
    symptomSummary_fr: 'Coulure massive des fleurs, avortement des boutons floraux et échec de la germination du tube pollinique.',
    cellularRole: 'Boron is required for pollen tube elongation, sugar-borate transport into the stigma, and nectar production; Mo activates nitrate reductase and nitrogenase.',
    cellularRole_ar: 'البورون مسؤول عن استطالة أنبوبة اللقاح وإفراز السكريات بالمياسم؛ والموليبدنوم ينشط إنزيمات النترات المسؤولة عن تغذية الزهرة.',
    cellularRole_fr: 'Le bore régule l’élongation du tube pollinique et la fécondation ovarienne ; le Mo active la nitrate réductase.',
    visualDiagnosticKeys: [
      'Yellow abscission line at flower joint followed by clean drop (blossom blast)',
      'Malformed, split, or dry flower petals',
      'No fruit set despite active bee activity',
      'Small deformed "parthenocarpic" miniature seedless fruitlets'
    ],
    visualDiagnosticKeys_ar: [
      'اصفرار مفصل عنق الزهرة وسقوطها النظيف (Blossom Drop)',
      'بتلات زهرية مشوهة أو جافة أو منشقة',
      'فشل عقد الثمار رغم وجود الملقحات ونشاط النحل',
      'ثمار عاقدة بكرية صغيرة ومتقزمة وخالية من البذور وتتساقط'
    ],
    visualDiagnosticKeys_fr: [
      'Jaunissement de la zone d’abscission du pédoncule et chute des boutons',
      'Pétales déformés et stigmates desséchés',
      'Absence de nouaison malgré la présence de pollinisateurs',
      'Nouaison parthénocarpique stérile'
    ],
    lookalikes: 'High temperature heat stress (>32°C day / >22°C night) causing pollen abortion, or Botrytis flower blight.',
    lookalikes_ar: 'الإجهاد الحراري المرتفع (أكثر من 32 مئوية نهاراً) أو لفحة الأزهار الفطرية (البوتريتس).',
    emergencyFoliarRecipe: {
      product: 'Foliar Boron Ethanolamine (10-15% B) + Sodium Molybdate (39% Mo)',
      product_ar: 'بورون إيثانول أمين سائل (10-15%) + موليبدات الصوديوم',
      product_fr: 'Bore Éthanolamine Soluble (10-15% B) + Molybdate de Sodium',
      dosage: '1.0 ml/L Boron + 0.1 g/L Sodium Molybdate with Seaweed Extract',
      dosage_ar: '1.0 مل/لتر بورون + 0.1 جم/لتر موليبدات صوديوم مع مستخلص طحالب بحرية',
      timing: 'Spray 5-7 days prior to opening of first flower trusses and repeat at mid-bloom',
      timing_ar: 'رش قبل تفتح أول عنقود زهري بـ 5 أيام ويكرر في قمة التزهير',
      precautions: 'Do not spray in the heat of midday when flowers are open and vulnerable.',
      precautions_ar: 'عدم الرش وقت الظهيرة الحار لتجنب جفاف حبوب اللقاح.'
    },
    fertigationSoilProgram: {
      fertilizers: ['Solubor at 2-3 kg/ha annual soil maintenance', 'Ammonium or Sodium Molybdate at 100-200 g/ha'],
      fertilizers_ar: ['سوليوبور بمعدل 2-3 كجم/هكتار سنوياً للتربة', 'موليبدات الأمونيوم بمعدل 150 جم/هكتار'],
      soilPhCorrection: 'Molybdenum is unique: its availability DROPS in acidic soils (pH < 5.8); liming soil cures Mo deficiency.',
      soilPhCorrection_ar: 'الموليبدنوم فريد: يقل توفره في الأراضي الحامضية، وإضافة الجير تعالج نقصه تماماً.',
      antagonismAvoidance: 'Excessive nitrogen vegetative push draws Boron away from reproductive trusses into shoots.',
      antagonismAvoidance_ar: 'التسميد النيتروجيني الزائد يسحب البورون للنمو الخضري حارماً الأزهار.'
    },
    cropExamples: ['Tomato', 'Olive', 'Almond', 'Pepper', 'Canola', 'Grape']
  },

  // 7. FRUITS & PRODUCE
  {
    id: 'fruit-ca-ber',
    nutrient: 'Calcium',
    chemicalSymbol: 'Ca (Ca²⁺)',
    organ: 'fruits',
    mobility: 'immobile',
    severity: 'critical',
    title: 'Calcium Deficiency: Blossom-End Rot (BER) & Internal Browning',
    title_ar: 'نقص الكالسيوم: عفن الطرف الزهري في الثمار (Blossom-End Rot - BER)',
    title_fr: 'Carence en Calcium : Nécrose Apicale des Fruits (Cul Noir / Blossom-End Rot)',
    symptomSummary: 'A water-soaked sunken spot appears at the blossom end (distal tip) of developing fruits, rapidly turning into a flat, black, tough, leathery dead lesion.',
    symptomSummary_ar: 'ظهور بقعة مائية غائرة عند قمة الثمرة (الطرف الزهري) تتسع وتتحول بسرعة إلى قرص جلدي أسود جاف صلب وميت.',
    symptomSummary_fr: 'Tache aqueuse affaissée à la pointe apicale du fruit, virant rapidement en une large plaque noire, dure et parcheminée.',
    cellularRole: 'Cross-links cell wall pectins in rapidly expanding pericarp cells; deficiency leads to membrane collapse and cellular liquid leakage.',
    cellularRole_ar: 'ربط بكتين جدران خلايا الثمرة أثناء تمددها السريع؛ ونقصه يؤدي لتمزق الأغشية وتسرب العصارة الخلوية وموت الأنسجة.',
    cellularRole_fr: 'Maintien de l’intégrité membranaire des cellules du péricarpe en forte expansion rapide.',
    visualDiagnosticKeys: [
      'Flattened or sunken black leathery patch strictly at the blossom end (bottom tip) of fruit',
      'Affects fastest growing green fruits (2-3 weeks after pollination)',
      'Internal black seed cavity discoloration even when exterior looks normal',
      'Premature ripening of damaged fruits'
    ],
    visualDiagnosticKeys_ar: [
      'قرص جلدي أسود غائر وصلب عند الطرف الزهري السفلي للثمرة',
      'يصيب الثمار الخضراء سريعة التمدد والنمو (بعد 2-3 أسابيع من العقد)',
      'اسوداد النسيج اللحمي وحول البذور داخلياً حتى قبل اكتمال العفن الخارجي',
      'احمرار وتلوين مبكر غير متجانس للثمار المصابة'
    ],
    visualDiagnosticKeys_fr: [
      'Plaque noire, sèche et déprimée strictement localisée à l’extrémité distale du fruit',
      'Apparaît sur fruits verts en phase de grossissement exponentiel',
      'Nécrose interne des loges carpellaires et graines',
      'Maturation prématurée et avortement du fruit'
    ],
    lookalikes: 'Anthracnose fruit rot or severe Sunscald (sunscald appears on the sunny side, BER strictly on bottom tip).',
    lookalikes_ar: 'عفن الأنثراكنوز أو لسعة الشمس (لسعة الشمس تحدث في الجانب المعرض للضوء بينما عفن الطرف الزهري أسفل قمة الثمرة حصرياً).',
    emergencyFoliarRecipe: {
      product: 'Calcium Chloride (CaCl2 food grade) or Formulated Ca-Formate / Ca-Chelate',
      product_ar: 'كلوريد الكالسيوم أو فورمات الكالسيوم / كالسيوم مخلبي عالي النقاوة',
      product_fr: 'Chlorure de Calcium Pur ou Formiate / Chélate de Calcium',
      dosage: '3.0 - 4.0 g/L (CaCl2) with non-ionic wetting agent',
      dosage_ar: '3.0 إلى 4.0 جم/لتر مع مادة ناشرة',
      timing: 'Direct spray strictly onto the fruit clusters (calcium does NOT relocate from leaves to fruit!) every 4-6 days',
      timing_ar: 'توجيه الرش مباشرة على عناقيد الثمار الصغيرة (الكالسيوم لا ينتقل من الأوراق للثمار!)',
      precautions: 'Spray early in morning when transpiration is gentle; avoid high chloride buildup on leaves.',
      precautions_ar: 'الرش في الصباح الباكر؛ مع مراعاة عدم تراكم الكلوريد على الأوراق.'
    },
    fertigationSoilProgram: {
      fertilizers: ['Fully soluble Calcium Nitrate [5Ca(NO3)2·NH4NO3·10H2O] at 20-30 kg/ha/week', 'Calcium Thiosulfate (CTS) in alkaline calcareous soils'],
      fertilizers_ar: ['نترات الكالسيوم النقية الذائبة بمعدل 20-30 كجم/هكتار أسبوعياً', 'ثيوكبريتات الكالسيوم في التربة القلوية'],
      soilPhCorrection: 'Maintain steady volumetric soil moisture (prevent alternating drought-flood cycles which shut down xylem Ca flux).',
      soilPhCorrection_ar: 'انتظام رطوبة التربة ومنع تذبذب الري (العطش ثم الغمر يوقف تيار الكالسيوم الصاعد في الخشب).',
      antagonismAvoidance: 'Cut down excessive Potassium (K+) and Ammonium (NH4+) fertilization during rapid fruit sizing.',
      antagonismAvoidance_ar: 'خفض جرعات البوتاسيوم والأمونيوم الزائدة خلال مرحلة التحجيم السريع.'
    },
    cropExamples: ['Tomato', 'Bell Pepper', 'Watermelon', 'Zucchini', 'Eggplant']
  },
  {
    id: 'fruit-k-blotchy',
    nutrient: 'Potassium',
    chemicalSymbol: 'K (K⁺)',
    organ: 'fruits',
    mobility: 'mobile',
    severity: 'moderate',
    title: 'Potassium Deficiency: Yellow Shoulder, Blotchy Ripening & Low Brix',
    title_ar: 'نقص البوتاسيوم: الأكتاف الخضراء والصفراء، النضج المبقع وانخفاض السكر في الثمار',
    title_fr: 'Carence en Potassium : Épaules Vertes/Jaunes, Maturation Hétérogène & Faible Brix',
    symptomSummary: 'Fruits ripen unevenly with hard yellow or green tops/shoulders ("Yellow Shoulder"), white spongy internal tissue, hollow carpels, and flat acidic taste.',
    symptomSummary_ar: 'عدم تجانس تلوين الثمار مع بقاء أكتاف وقواعد الثمار صلبة صفراء أو خضراء وظهور أنسجة إسفنجية بيضاء داخل الثمرة وضعف حلاوة الطعم.',
    symptomSummary_fr: 'Maturation irrégulière en mosaïque, collet jaune/vert induré ("Yellow Shoulder"), chair interne spongieuse blanche et goût fade.',
    cellularRole: 'Regulates lycopene and sugar synthesis, maintains cellular turgor in fruit pulp, and drives organic acid conversion.',
    cellularRole_ar: 'تخليق صبغة الليكوبين الحمراء وتراكم السكريات وتنظيم امتلاء اللب وتحويل الأحماض العضوية.',
    cellularRole_fr: 'Synthèse du lycopène, accumulation des sucres et équilibre acide-sucre dans la pulpe.',
    visualDiagnosticKeys: [
      'Hard yellow or green patches on the stem end of ripe red tomato fruit',
      'White tough pithy vascular fibers inside the fruit wall',
      'Hollow internal cavities (puffiness) and poor fruit density/weight',
      'Low brix (°Bx) and bland flavor'
    ],
    visualDiagnosticKeys_ar: [
      'بقع صفراء أو خضراء صلبة حول عنق ثمار الطماطم الناضجة (الأكتاف الصفراء)',
      'ألياف بيضاء إسفنجية خشنة داخل جدار الثمرة',
      'فراغات وتجوف داخلي للثمار (Puffiness) وخفة وزنها',
      'انخفاض نسبة السكريات الذائبة Brix وطعم حامضي باهت'
    ],
    visualDiagnosticKeys_fr: [
      'Zones fermes jaunes/vertes persistantes autour du calice à maturité',
      'Tissus vasculaires blancs et durs dans la paroi du fruit',
      'Poches d’air internes et fruits légers/mous',
      'Faible taux de sucre et acidité déséquilibrée'
    ],
    lookalikes: 'High temperature pigment inhibition (>30°C prevents lycopene synthesis) or Tomato Mosaic Virus (ToMV).',
    lookalikes_ar: 'ارتفاع درجات الحرارة فوق 30 مئوية (الذي يعطل إنزيمات تصنيع الليكوبين) أو الإصابة بفيروس موزاييك الطماطم.',
    emergencyFoliarRecipe: {
      product: 'Potassium Citrate or Potassium Phosphite (0-0-28)',
      product_ar: 'سترات البوتاسيوم أو فوسفيت البوتاسيوم النقي',
      product_fr: 'Citrate de Potassium ou Phosphite de Potassium',
      dosage: '3.0 - 5.0 ml/L',
      dosage_ar: '3.0 إلى 5.0 مل/لتر',
      timing: 'Apply every 7 days from first fruit breaker stage until harvest completion',
      timing_ar: 'رش أسبوعياً من بداية مرحلة تلوين أول ثمرة حتى نهاية الجمع',
      precautions: 'Do not spray during intense direct solar radiation.',
      precautions_ar: 'تجنب الرش أثناء سطوع الشمس الحارق.'
    },
    fertigationSoilProgram: {
      fertilizers: ['Potassium Nitrate (13-0-46) combined with Sulfate of Potash (SOP 0-0-50) at 35-50 kg/ha/week', 'Monopotassium Phosphate (MKP)'],
      fertilizers_ar: ['نترات البوتاسيوم مع سلفات البوتاسيوم بمعدل 35-50 كجم/هكتار أسبوعياً', 'أحادي فوسفات البوتاسيوم MKP'],
      soilPhCorrection: 'Ensure adequate magnesium balance (Mg:K ratio around 1:2 to 1:3).',
      soilPhCorrection_ar: 'ضبط توازن المغنيسيوم مع البوتاسيوم لتجنب التضاد.',
      antagonismAvoidance: 'Excessive Nitrogen (N) during fruit coloring increases green shoulder and blotchy ripening dramatically.',
      antagonismAvoidance_ar: 'زيادة التسميد النيتروجيني في مرحلة التلوين تضاعف مشكلة الأكتاف الخضراء.'
    },
    cropExamples: ['Tomato', 'Strawberry', 'Melon', 'Citrus', 'Grape']
  }
];
