/**
 * Expanded Agronomic Nutrient Interaction, Mobility, Kinetics & Cation Balancing Data
 */

export interface DetailedIonSpec {
  id: string;
  ion: string;
  name: string;
  name_ar: string;
  name_fr: string;
  category: 'macro' | 'secondary' | 'micro' | 'beneficial';
  charge: 'cation' | 'anion' | 'neutral';
  valency: number;
  color: string;
  antagonists: { targetId: string; severity: 'high' | 'medium' | 'low'; mechanism: string; mechanism_ar: string; mechanism_fr: string }[];
  synergists: { targetId: string; intensity: 'high' | 'medium' | 'low'; mechanism: string; mechanism_ar: string; mechanism_fr: string }[];
  functionalRole: string;
  functionalRole_ar: string;
  functionalRole_fr: string;
  optimalRatios?: { otherIon: string; idealRatio: string; description: string; description_ar: string };
  fieldTips: string;
  fieldTips_ar: string;
}

export const DETAILED_IONS: DetailedIonSpec[] = [
  {
    id: 'no3',
    ion: 'NO₃⁻',
    name: 'Nitrate Nitrogen',
    name_ar: 'نيتروجين النترات',
    name_fr: 'Azote Nitrique',
    category: 'macro',
    charge: 'anion',
    valency: -1,
    color: '#16a34a',
    antagonists: [
      { targetId: 'cl', severity: 'high', mechanism: 'Anion competition at root nitrate transporters (NRT1/NRT2); excess chloride impairs nitrate uptake.', mechanism_ar: 'تنافس أنيوني على ناقلات النترات الجذرية؛ فائض الكلوريد يثبط امتصاص النترات.', mechanism_fr: 'Compétition anionique sur les transporteurs racinaires (NRT1/NRT2); excès de chlorure réduit l’absorption.' },
      { targetId: 'h2po4', severity: 'medium', mechanism: 'High nitrate can induce slight rhizosphere alkalinization, reducing monovalent phosphate solubility in alkaline soils.', mechanism_ar: 'النترات العالية ترفع قلوية المحيط الجذري قليلاً مما يقلل ذوبان الفوسفات أحادي التكافؤ.', mechanism_fr: 'Fort taux de nitrate alcalinise légèrement la rhizosphère, réduisant la solubilité du phosphate.' },
    ],
    synergists: [
      { targetId: 'k', intensity: 'high', mechanism: 'Cation-anion co-transport: K⁺ acts as essential counter-ion for nitrate uptake and xylem translocation.', mechanism_ar: 'نقل مرافق كاتيوني-أنيوني: K⁺ يعمل كأيون موازن أساسي لامتصاص النترات ونقلها في الخشب.', mechanism_fr: 'Co-transport cation-anion : K⁺ agit comme contre-ion essentiel pour l’absorption du nitrate.' },
      { targetId: 'mg', intensity: 'medium', mechanism: 'Stimulates chlorophyll synthesis and enzymatic nitrate reductase activation.', mechanism_ar: 'يحفز تخليق الكلوروفيل وتنشيط إنزيم نترات ريدكتاز.', mechanism_fr: 'Stimule la synthèse chlorophyllienne et l’activation de la nitrate réductase.' },
      { targetId: 'ca', intensity: 'medium', mechanism: 'Enhanced root membrane integrity and xylem loading of calcium.', mechanism_ar: 'يعزز سلامة أغشية الجذور وتحميل الكالسيوم في أوعية الخشب.', mechanism_fr: 'Renforce l’intégrité membranaire racinaire et le chargement xylémien du calcium.' },
    ],
    functionalRole: 'Primary building block of amino acids, proteins, nucleic acids, and chlorophyll.',
    functionalRole_ar: 'الوحدة الأساسية للأحماض الأمينية والبروتينات والأحماض النووية والكلوروفيل.',
    functionalRole_fr: 'Composant majeur des acides aminés, protéines, acides nucléiques et de la chlorophylle.',
    fieldTips: 'High transpiration increases mass-flow delivery. Keep NO₃⁻ : NH₄⁺ ratio around 80:20 in soilless cultures to stabilize root pH.',
    fieldTips_ar: 'النتح العالي يزيد وصول النترات عبر التدفق الكتلي. حافظ على نسبة 80:20 بين النترات والأمونيوم لتثبيت حموضة الجذور.',
  },
  {
    id: 'nh4',
    ion: 'NH₄⁺',
    name: 'Ammonium Nitrogen',
    name_ar: 'نيتروجين الأمونيوم',
    name_fr: 'Azote Ammoniacal',
    category: 'macro',
    charge: 'cation',
    valency: 1,
    color: '#059669',
    antagonists: [
      { targetId: 'k', severity: 'high', mechanism: 'Direct steric competition at non-selective cation channels and inward-rectifying K⁺ transporters due to identical hydration radii.', mechanism_ar: 'تنافس مباشر على قنوات الكاتيونات وناقلات البوتاسيوم بسبب تماثل نصف القطر الأيوني المميه.', mechanism_fr: 'Compétition stérique directe sur les transporteurs de K⁺ en raison de rayons d’hydratation similaires.' },
      { targetId: 'ca', severity: 'high', mechanism: 'Proton extrusion during NH₄ assimilation strongly suppresses Ca²⁺ uptake and induces blossom-end rot.', mechanism_ar: 'إفراز البروتونات أثناء تمثيل الأمونيوم يثبط بقوة امتصاص الكالسيوم ويحفز عفن طرف الزهرة.', mechanism_fr: 'L’extrusion de protons lors de l’assimilation de NH₄ freine l’absorption du calcium et favorise la nécrose apicale.' },
      { targetId: 'mg', severity: 'medium', mechanism: 'Competitive inhibition of Mg²⁺ root uptake leading to rapid interveinal chlorosis.', mechanism_ar: 'تثبيط تنافسي لامتصاص المغنيسيوم الجذري مسبباً اصفراراً بين العروق.', mechanism_fr: 'Inhibition compétitive de l’absorption de Mg²⁺ provoquant une chlorose internervaire.' },
    ],
    synergists: [
      { targetId: 'h2po4', intensity: 'high', mechanism: 'Rhizosphere acidification by NH₄⁺ extrusion solubilizes locked calcium phosphates in calcareous soils.', mechanism_ar: 'تحميض المحيط الجذري بواسطة الأمونيوم يذيب فوسفات الكالسيوم المثبتة في الأراضي الكلسية.', mechanism_fr: 'L’acidification rhizosphérique par NH₄⁺ solubilise les phosphates de calcium fixés.' },
      { targetId: 'so4', intensity: 'medium', mechanism: 'Coupled N-S assimilation into sulfur amino acids (methionine, cysteine).', mechanism_ar: 'تمثيل متزامن للنيتروجين والكبريت في الأحماض الأمينية الكبريتية.', mechanism_fr: 'Assimilation couplée N-S dans les acides aminés soufrés.' },
    ],
    functionalRole: 'Directly incorporated into glutamine without energy-costly nitrate reduction; rapid vegetative flush.',
    functionalRole_ar: 'يُدمج مباشرة في الجلوتامين دون استهلاك طاقة اختزال النترات؛ نمو خضري سريع.',
    functionalRole_fr: 'Incorporation directe sans étape de réduction; coup de fouet végétatif rapide.',
    fieldTips: 'Never exceed 25% of total N in warm greenhouse conditions to prevent ammonium toxicity and calcium lockout.',
    fieldTips_ar: 'لا تتجاوز 25% من إجمالي النيتروجين في البيوت المحمية الدافئة لتفادي سمية الأمونيوم وتثبيط الكالسيوم.',
  },
  {
    id: 'h2po4',
    ion: 'H₂PO₄⁻',
    name: 'Phosphate (Monovalent)',
    name_ar: 'فوسفات أحادي التكافؤ',
    name_fr: 'Phosphate Monovalent',
    category: 'macro',
    charge: 'anion',
    valency: -1,
    color: '#0284c7',
    antagonists: [
      { targetId: 'zn', severity: 'high', mechanism: 'Phosphorus-induced zinc deficiency: high P blocks mycorrhizal colonization, inhibits root-to-shoot Zn translocation, and forms insoluble Zn₃(PO₄)₂.', mechanism_ar: 'نقص الزنك المستحث بالفوسفور: الفوسفور العالي يثبط المايكورايزا ويمنع انتقال الزنك للأوراق ويرسبه.', mechanism_fr: 'Carence induite en zinc : le fort taux de P inhibe les mycorhizes et bloque la translocation de Zn.' },
      { targetId: 'fe', severity: 'high', mechanism: 'Forms insoluble ferric phosphate complexes inside root apoplast, blocking iron active transport.', mechanism_ar: 'تكوين مركبات فوسفات الحديد غير الذائبة في الفراغات الحرة للجذور مما يعيق انتقال الحديد.', mechanism_fr: 'Précipitation de phosphates ferriques insolubles dans l’apoplasme racinaire.' },
      { targetId: 'cu', severity: 'medium', mechanism: 'Precipitation of copper phosphates under high fertilizer band concentrations.', mechanism_ar: 'ترسيب فوسفات النحاس عند التركيزات العالية في نطاق التسميد المركّز.', mechanism_fr: 'Précipitation de phosphates de cuivre lors d’applications localisées concentrées.' },
    ],
    synergists: [
      { targetId: 'mg', intensity: 'high', mechanism: 'Mg²⁺ is the essential cofactor for all phosphorylation enzymes (ATP-Mg complexes) and phosphate transport.', mechanism_ar: 'المغنيسيوم هو العامل المرافق الأساسي لجميع إنزيمات الفسفرة ونقل الفوسفات.', mechanism_fr: 'Le Mg²⁺ est le cofacteur indispensable de toutes les enzymes de phosphorylation.' },
      { targetId: 'nh4', intensity: 'high', mechanism: 'Ammonium stimulates phosphate uptake via rhizosphere acidification and electrical balance.', mechanism_ar: 'الأمونيوم يحفز امتصاص الفوسفات عبر تحميض الجذور والتوازن الكهربائي.', mechanism_fr: 'L’ammonium stimule l’absorption du phosphate par acidification de la rhizosphère.' },
      { targetId: 'k', intensity: 'medium', mechanism: 'Synergistic root elongation and cellular energy transfer.', mechanism_ar: 'استطالة جذرية تآزرية ونقل طاقة خلوي.', mechanism_fr: 'Élongation racinaire et transfert d’énergie cellulaire synergiques.' },
    ],
    functionalRole: 'Energy transfer (ATP/ADP), cellular division (DNA/RNA), root architecture, flowering and seed set.',
    functionalRole_ar: 'نقل الطاقة (ATP)، الانقسام الخلوي (DNA/RNA)، نمو الجذور، التزهير وعقد الثمار.',
    functionalRole_fr: 'Transfert d’énergie (ATP/ADP), division cellulaire, architecture racinaire, floraison et nouaison.',
    fieldTips: 'Diffusion-limited: only moves 1-2 mm in soil. Cold soils (<12°C) reduce P uptake by 70%, inducing purpling in early corn.',
    fieldTips_ar: 'محدود بالانتشار (يتحرك 1-2 مم فقط). التربة الباردة تقلل امتصاصه بنسبة 70% وتسبب تلون الأوراق بالأرجواني.',
  },
  {
    id: 'k',
    ion: 'K⁺',
    name: 'Potassium',
    name_ar: 'البوتاسيوم',
    name_fr: 'Potassium',
    category: 'macro',
    charge: 'cation',
    valency: 1,
    color: '#9333ea',
    antagonists: [
      { targetId: 'mg', severity: 'high', mechanism: 'High K:Mg ratio in soil solution strongly suppresses Mg uptake by competitive binding at root cation transporters.', mechanism_ar: 'ارتفاع نسبة K:Mg في محلول التربة يثبط امتصاص المغنيسيوم بالتنافس على قنوات الامتصاص.', mechanism_fr: 'Un ratio K:Mg élevé supprime fortement l’absorption de Mg par compétition sur les transporteurs.' },
      { targetId: 'ca', severity: 'high', mechanism: 'High K concentrations suppress Ca root influx and compete during fruit expansion, causing bitter pit in apples and blossom-end rot.', mechanism_ar: 'تركيز البوتاسيوم العالي يثبط تدفق الكالسيوم ويسبب النقرة المرة في التفاح وعفن القمة في الطماطم.', mechanism_fr: 'Forte concurrence avec le calcium lors du grossissement des fruits (nécroses apicales, bitter pit).' },
      { targetId: 'b', severity: 'low', mechanism: 'High K can shift tissue B requirements and osmotic hydration balance.', mechanism_ar: 'البوتاسيوم العالي يغير احتياجات الأنسجة من البورون وتوازن الترطيب الأسموزي.', mechanism_fr: 'L’excès de K modifie les besoins tissulaires en bore et l’équilibre osmotique.' },
    ],
    synergists: [
      { targetId: 'no3', intensity: 'high', mechanism: 'Promotes rapid nitrate uptake and efficient protein synthesis in chloroplasts.', mechanism_ar: 'يعزز سرعة امتصاص النترات وتخليق البروتين في البلاستيدات الخضراء.', mechanism_fr: 'Favorise l’absorption rapide du nitrate et la synthèse protéique chloroplastique.' },
      { targetId: 'fe', intensity: 'medium', mechanism: 'Maintains optimal cytoplasmic pH and iron reduction at root epidermal plasma membrane.', mechanism_ar: 'يحافظ على حموضة السيتوبلازم واختزال الحديد عند أغشية خلايا البشرة الجذرية.', mechanism_fr: 'Maintient le pH cytosolique optimal et favorise la réduction du fer racinaire.' },
    ],
    functionalRole: 'Stomatal regulation, osmoregulation, sugar phloem loading, fruit size, brix, color, and cold/drought tolerance.',
    functionalRole_ar: 'تنظيم فتح الثغور، التوازن الأسموزي، نقل السكريات في اللحاء، حجم وجودة الثمار، ومقاومة الصقيع والجفاف.',
    functionalRole_fr: 'Régulation stomatique, osmorégulation, chargement des sucres, calibre et brix des fruits, résistance au stress.',
    fieldTips: 'Ideal Soil K:Mg meq ratio is 0.25 to 0.45. If ratio exceeds 0.70, apply Epsom salt (MgSO₄) to prevent hidden hunger.',
    fieldTips_ar: 'النسبة المثالية لـ K:Mg في التربة بين 0.25 و0.45. إذا تجاوزت 0.70 يجب إضافة سلفات المغنيسيوم لمنع الجوع الخفي.',
  },
  {
    id: 'ca',
    ion: 'Ca²⁺',
    name: 'Calcium',
    name_ar: 'الكالسيوم',
    name_fr: 'Calcium',
    category: 'secondary',
    charge: 'cation',
    valency: 2,
    color: '#d97706',
    antagonists: [
      { targetId: 'mg', severity: 'high', mechanism: 'Excess Ca occupies cation exchange sites and root uptake channels, suppressing Mg absorption.', mechanism_ar: 'فائض الكالسيوم يسيطر على مواقع التبادل وقنوات الامتصاص الجذرية مثبطاً المغنيسيوم.', mechanism_fr: 'L’excès de Ca sature les sites d’échange et réduit l’absorption de Mg.' },
      { targetId: 'k', severity: 'medium', mechanism: 'High soil Ca reduces exchangeable K availability in soils with high base saturation.', mechanism_ar: 'ارتفاع الكالسيوم يقلل البوتاسيوم المتبادل في الأراضي ذات التشبع القاعدي العالي.', mechanism_fr: 'Une forte teneur en Ca réduit la disponibilité du K échangeable.' },
      { targetId: 'b', severity: 'high', mechanism: 'High Ca forms calcium borate complexes in alkaline soils and tightens pectin cross-linking, demanding higher tissue B.', mechanism_ar: 'الكالسيوم العالي يشكل بورات الكالسيوم ويربط البكتين بقوة مما يرفع الحاجة للبورون.', mechanism_fr: 'Le Ca forme des borates peu solubles et renforce la paroi, augmentant le besoin en bore.' },
      { targetId: 'fe', severity: 'medium', mechanism: 'Excess limestone/CaCO₃ buffers pH > 7.5 and precipitates active iron.', mechanism_ar: 'فائض كربونات الكالسيوم يرفع القلوية ويرسب الحديد الصالح للامتصاص.', mechanism_fr: 'L’excès de calcaire actif alcalinise le milieu et précipite le fer assimilable.' },
    ],
    synergists: [
      { targetId: 'b', intensity: 'high', mechanism: 'Calcium and Boron work synergistically in cell wall synthesis (rhamnogalacturonan-II borate cross-linking) and pollen tube integrity.', mechanism_ar: 'الكالسيوم والبورون يتعاونان في بناء جدر الخلايا وتماسك الأنسجة ونمو أنبوب اللقاح.', mechanism_fr: 'Action synergique essentielle dans l’assemblage des parois cellulaires et la fertilité pollinique.' },
      { targetId: 'no3', intensity: 'medium', mechanism: 'Nitrate enhances calcium xylem translocation via transpiration stream.', mechanism_ar: 'النترات تعزز انتقال الكالسيوم عبر تيار النتح في الخشب.', mechanism_fr: 'Le nitrate stimule la montée xylémienne du calcium par le flux de transpiration.' },
    ],
    functionalRole: 'Cell wall structural integrity (calcium pectate), membrane stabilization, second messenger signaling, fruit shelf-life.',
    functionalRole_ar: 'صلابة جدران الخلايا (بكتات الكالسيوم)، ثبات الأغشية، نقل الإشارات الحيوية، والقدرة التخزينية للثمار.',
    functionalRole_fr: 'Intégrité structurale pariétale (pectate de Ca), stabilité membranaire, fermeté et conservation des récoltes.',
    fieldTips: 'Virtually immobile in phloem; moves only with xylem transpiration. High humidity or low VPD halts Ca delivery to fruit tips.',
    fieldTips_ar: 'عديم الحركة في اللحاء؛ ينتقل فقط مع تيار نتح الخشب. الرطوبة الجوية العالية توقف وصوله لأطراف الثمار.',
  },
  {
    id: 'mg',
    ion: 'Mg²⁺',
    name: 'Magnesium',
    name_ar: 'المغنيسيوم',
    name_fr: 'Magnésium',
    category: 'secondary',
    charge: 'cation',
    valency: 2,
    color: '#4f46e5',
    antagonists: [
      { targetId: 'k', severity: 'high', mechanism: 'K⁺ easily outcompetes Mg²⁺ due to higher diffusion velocity and stronger transporter affinity.', mechanism_ar: 'البوتاسيوم يتفوق بسهولة على المغنيسيوم لسرعة انتشاره وقوة ارتباطه بالناقلات.', mechanism_fr: 'Le potassium supplante le magnésium grâce à une vitesse de diffusion plus élevée.' },
      { targetId: 'ca', severity: 'high', mechanism: 'High calcium soils depress magnesium uptake efficiency.', mechanism_ar: 'أراضي الكالسيوم العالية تخفض كفاءة امتصاص المغنيسيوم.', mechanism_fr: 'Les sols riches en calcium limitent l’efficacité d’absorption du magnésium.' },
      { targetId: 'nh4', severity: 'medium', mechanism: 'Ammonium ions compete directly with magnesium uptake.', mechanism_ar: 'أيونات الأمونيوم تتنافس مباشرة مع امتصاص المغنيسيوم.', mechanism_fr: 'Les ions ammonium entrent en compétition directe avec le magnésium.' },
    ],
    synergists: [
      { targetId: 'h2po4', intensity: 'high', mechanism: 'Magnesium acts as the universal carrier and enzymatic activator for phosphorus uptake and ATP synthesis.', mechanism_ar: 'المغنيسيوم هو الناقل العام والمنشط الإنزيمي لامتصاص الفوسفور وبناء ATP.', mechanism_fr: 'Agit comme transporteur universel et activateur enzymatique du phosphore.' },
      { targetId: 'no3', intensity: 'medium', mechanism: 'Synergistic chlorophyll formation and protein assembly.', mechanism_ar: 'تآزر في تكوين الكلوروفيل وتخليق البروتين.', mechanism_fr: 'Synergie dans la synthèse de chlorophylle et des protéines.' },
    ],
    functionalRole: 'Central atom of chlorophyll ring, enzyme activator for >300 enzymes, carbohydrate partitioning, phloem sugar transport.',
    functionalRole_ar: 'الذرة المركزية لجزيء الكلوروفيل، منشط لأكثر من 300 إنزيم، ونقل السكريات والكربوهيدرات في اللحاء.',
    functionalRole_fr: 'Atome central de la chlorophylle, activateur de plus de 300 enzymes, translocation des sucres par le phloème.',
    fieldTips: 'Highly mobile in plant: deficiency appears on oldest leaves as bold interveinal chlorosis (Christmas tree pattern).',
    fieldTips_ar: 'عالي الحركة في النبات: يظهر نقصه على الأوراق المسنة السفلية كاصفرار بين العروق مع بقاء العروق خضراء.',
  },
  {
    id: 'so4',
    ion: 'SO₄²⁻',
    name: 'Sulfate Sulfur',
    name_ar: 'كبريت الكبريتات',
    name_fr: 'Soufre Sulfatique',
    category: 'secondary',
    charge: 'anion',
    valency: -2,
    color: '#0d9488',
    antagonists: [
      { targetId: 'moo4', severity: 'high', mechanism: 'Sulfate and molybdate share identical group-VI anion permease transporters (SULTR); excess sulfate blocks Mo uptake.', mechanism_ar: 'الكبريتات والموليبدات تشتركان في نفس ناقلات الأنيونات؛ فائض الكبريتات يمنع امتصاص الموليبدينوم.', mechanism_fr: 'Compétition directe sur les perméases anioniques SULTR; l’excès de sulfate bloque l’assimilation du molybdène.' },
      { targetId: 'se', severity: 'medium', mechanism: 'Sulfate competitively suppresses selenate uptake.', mechanism_ar: 'الكبريتات تثبط امتصاص السيلينات تنافسياً.', mechanism_fr: 'Suppression compétitive de l’absorption du séléniate.' },
    ],
    synergists: [
      { targetId: 'no3', intensity: 'high', mechanism: 'Maintains optimal N:S ratio (10:1 to 15:1) for complete protein synthesis; prevents toxic non-protein nitrate accumulation.', mechanism_ar: 'يحافظ على النسبة المثالية N:S (بين 10:1 و15:1) لتخليق البروتين ومنع تراكم النترات الضارة.', mechanism_fr: 'Maintient le ratio N:S optimal (10:1 à 15:1) pour une synthèse protéique complète.' },
      { targetId: 'k', intensity: 'medium', mechanism: 'Improves aromatic compounds, oil synthesis (canola/olives), and stress tolerance.', mechanism_ar: 'يحسن المركبات العطرية وتخليق الزيوت (الكانولا والزيتون) ومقاومة الإجهاد.', mechanism_fr: 'Améliore la synthèse d’huiles et la résistance aux stress.' },
    ],
    functionalRole: 'Essential for sulfur amino acids (cysteine, methionine), vitamins (biotin, thiamine), coenzyme A, and pest defense compounds.',
    functionalRole_ar: 'أساسي للأحماض الأمينية الكبريتية والفيتامينات ومرافق الإنزيم A ومركبات الدفاع النباتي.',
    functionalRole_fr: 'Indispensable aux acides aminés soufrés, aux vitamines et aux composés de défense (glucosinolates).',
    fieldTips: 'Intermediate mobility: deficiency shows uniform light green/yellow on young to mid-canopy leaves (unlike N which starts on bottom leaves).',
    fieldTips_ar: 'متوسط الحركة: يظهر نقصه كاصفرار متجانس على الأوراق الحديثة والمتوسطة (عكس النيتروجين الذي يبدأ من الأسفل).',
  },
  {
    id: 'fe',
    ion: 'Fe²⁺ / Fe³⁺',
    name: 'Iron',
    name_ar: 'الحديد',
    name_fr: 'Fer',
    category: 'micro',
    charge: 'cation',
    valency: 2,
    color: '#dc2626',
    antagonists: [
      { targetId: 'mn', severity: 'high', mechanism: 'Mutual antagonism: high Mn blocks Fe-chelate reductase and competes for IRT1 root transporters.', mechanism_ar: 'تضاد متبادل: المنجنيز العالي يثبط إنزيم اختزال الحديد ويتنافس على ناقل IRT1.', mechanism_fr: 'Antagonisme mutuel : le fort Mn inhibe la réductase du fer et concurrence le transporteur IRT1.' },
      { targetId: 'h2po4', severity: 'high', mechanism: 'Forms insoluble ferric phosphate complexes in roots and vascular bundles.', mechanism_ar: 'يرسب مركبات فوسفات الحديد غير الذائبة في الجذور والأوعية الناقلة.', mechanism_fr: 'Forme des phosphates ferriques insolubles dans le système vasculaire.' },
      { targetId: 'zn', severity: 'medium', mechanism: 'Competition at divalent cation transporters.', mechanism_ar: 'تنافس على ناقلات الكاتيونات ثنائية التكافؤ.', mechanism_fr: 'Compétition au niveau des transporteurs de métaux divalents.' },
      { targetId: 'cu', severity: 'medium', mechanism: 'Excess Cu inhibits root Fe reduction and translocation.', mechanism_ar: 'فائض النحاس يعطل اختزال الحديد ونقله في الجذور.', mechanism_fr: 'L’excès de cuivre inhibe la réduction et la translocation du fer.' },
    ],
    synergists: [
      { targetId: 'k', intensity: 'medium', mechanism: 'Supports root rhizosphere proton pumping and ferric reductase activity.', mechanism_ar: 'يدعم ضخ البروتونات واختزال الحديد عند الجذور.', mechanism_fr: 'Soutient l’acidification rhizosphérique et l’activité de la réductase.' },
      { targetId: 'moo4', intensity: 'low', mechanism: 'Synergy in nitrogenase and nitrate reduction electron transport chains.', mechanism_ar: 'تآزر في سلاسل نقل الإلكترونات لإنزيمات تثبيت واختزال النيتروجين.', mechanism_fr: 'Synergie dans les chaînes de transport d’électrons de la nitrate réductase.' },
    ],
    functionalRole: 'Electron transport chain in photosynthesis and respiration (cytochromes, ferredoxin), chlorophyll biosynthesis precursor.',
    functionalRole_ar: 'سلاسل نقل الإلكترونات في البناء الضوئي والتنفس (السيتوكرومات والفيرودوكسين)، وتخليق الكلوروفيل.',
    functionalRole_fr: 'Transport d’électrons (cytochromes, ferrédoxine), précurseur de la synthèse de chlorophylle.',
    fieldTips: 'Strictly immobile in phloem: deficiency produces dramatic ivory-yellow interveinal chlorosis on youngest apical leaves with razor-sharp green veins.',
    fieldTips_ar: 'عديم الحركة في اللحاء: نقصه يسبب اصفراراً عاجياً شديداً بين عروق الأوراق القمية الحديثة مع بقاء أدق العروق خضراء.',
  },
  {
    id: 'mn',
    ion: 'Mn²⁺',
    name: 'Manganese',
    name_ar: 'المنجنيز',
    name_fr: 'Manganèse',
    category: 'micro',
    charge: 'cation',
    valency: 2,
    color: '#b45309',
    antagonists: [
      { targetId: 'fe', severity: 'high', mechanism: 'Fe and Mn mutually inhibit each other’s uptake and enzymatic substitution.', mechanism_ar: 'الحديد والمنجنيز يثبطان امتصاص بعضهما ويحلان محل بعضهما في الإنزيمات.', mechanism_fr: 'Inhibition mutuelle de l’absorption et compétition enzymatique.' },
      { targetId: 'ca', severity: 'medium', mechanism: 'High soil Ca (liming) raises pH and oxidizes Mn²⁺ into unavailable Mn⁴⁺ oxides.', mechanism_ar: 'الكالسيوم العالي في التربة يرفع القلوية ويؤكسد المنجنيز لصورة Mn⁴⁺ غير المتاحة.', mechanism_fr: 'Le chaulage excessif oxyde le Mn²⁺ en oxydes insolubles de Mn⁴⁺.' },
      { targetId: 'mg', severity: 'medium', mechanism: 'Competition at cation exchange surfaces.', mechanism_ar: 'تنافس على أسطح التبادل الكاتيوني.', mechanism_fr: 'Compétition sur les surfaces d’échange cationique.' },
    ],
    synergists: [
      { targetId: 'no3', intensity: 'medium', mechanism: 'Nitrate nutrition stimulates manganese assimilation in photosynthetic water-splitting complex.', mechanism_ar: 'تغذية النترات تحفز تمثيل المنجنيز في معقد شطر الماء الضوئي.', mechanism_fr: 'Stimule l’incorporation dans le complexe de photolyse de l’eau.' },
    ],
    functionalRole: 'Water-photolysis enzyme (PSII oxygen-evolving complex), decarboxylases, lignin synthesis, fatty acid synthesis.',
    functionalRole_ar: 'إنزيم شطر الماء في البناء الضوئي (معقد توليد الأكسجين PSII)، تخليق اللجنين والأحماض الدهنية.',
    functionalRole_fr: 'Complexe de photolyse de l’eau (Photosystème II), synthèse de la lignine et des acides gras.',
    fieldTips: 'Immobile: causes checkered "checkerboard" mottling on young leaves. In waterlogged acid soils (pH < 5.0), Mn toxicity occurs rapidly.',
    fieldTips_ar: 'عديم الحركة: يسبب تبرقشاً شطرنجياً على الأوراق الحديثة. في الأراضي الحامضية الغدقة تظهر سمية المنجنيز بسرعة.',
  },
  {
    id: 'zn',
    ion: 'Zn²⁺',
    name: 'Zinc',
    name_ar: 'الزنك',
    name_fr: 'Zinc',
    category: 'micro',
    charge: 'cation',
    valency: 2,
    color: '#0891b2',
    antagonists: [
      { targetId: 'h2po4', severity: 'high', mechanism: 'Heavy phosphate fertilization strongly blocks Zn mycorrhizal absorption and translocation.', mechanism_ar: 'التسميد الفوسفاتي المفرط يمنع امتصاص الزنك بواسطة المايكورايزا ويعطل انتقاله للأوراق.', mechanism_fr: 'Une forte fertilisation phosphatée bloque l’absorption mycorhizienne et la translocation de Zn.' },
      { targetId: 'cu', severity: 'high', mechanism: 'Direct competition at ZIP metal transporters in root cell membrane.', mechanism_ar: 'تنافس مباشر على ناقلات المعادن ZIP في غشاء الخلايا الجذرية.', mechanism_fr: 'Compétition directe sur les transporteurs membranaires ZIP.' },
      { targetId: 'ca', severity: 'medium', mechanism: 'Precipitation with carbonates in calcareous soils (caliche layers).', mechanism_ar: 'ترسيب مع الكربونات في الترب الكلسية.', mechanism_fr: 'Précipitation sous forme de carbonates en sols calcaires.' },
      { targetId: 'fe', severity: 'medium', mechanism: 'Competition during uptake in root rhizosphere.', mechanism_ar: 'تنافس أثناء الامتصاص في المحيط الجذري.', mechanism_fr: 'Compétition lors de l’absorption rhizosphérique.' },
    ],
    synergists: [
      { targetId: 'n', intensity: 'medium', mechanism: 'Nitrogen nutrition boosts production of nicotianamine and Zn-binding proteins.', mechanism_ar: 'تغذية النيتروجين تحفز تكوين النيكوتينامين والبروتينات الحاملة للزنك.', mechanism_fr: 'L’azote stimule la production de nicotianamine et de protéines transporteuses.' },
    ],
    functionalRole: 'Synthesis of tryptophan (precursor to auxin IAA), internode elongation, RNA polymerase, carbonic anhydrase.',
    functionalRole_ar: 'تخليق حمض التريبتوفان (المولد للأوكسين IAA)، استطالة السلاميات، إنزيم كربونات أنهيدراز، وكبر حجم الأوراق.',
    functionalRole_fr: 'Synthèse du tryptophane (précurseur de l’auxine AIA), élongation des entre-nœuds, anhydrase carbonique.',
    fieldTips: 'Immobile: deficiency causes "little leaf", rosetting of shoot tips, and white bud/striping in corn. Foliar Zn-EDTA gives rapid recovery.',
    fieldTips_ar: 'عديم الحركة: نقصه يسبب صغر وتورد الأوراق القمية وقصر السلاميات والبرعم الأبيض في الذرة. الرش الورقي بالزنك المخلبي يعالجه بسرعة.',
  },
  {
    id: 'cu',
    ion: 'Cu²⁺',
    name: 'Copper',
    name_ar: 'النحاس',
    name_fr: 'Cuivre',
    category: 'micro',
    charge: 'cation',
    valency: 2,
    color: '#ea580c',
    antagonists: [
      { targetId: 'zn', severity: 'high', mechanism: 'Competitive inhibition at ZIP family transporters.', mechanism_ar: 'تثبيط تنافسي على ناقلات عائلة ZIP المعدنية.', mechanism_fr: 'Inhibition compétitive sur les transporteurs de la famille ZIP.' },
      { targetId: 'fe', severity: 'medium', mechanism: 'Excess Cu displaces Fe from active enzyme centers and reduces Fe mobility.', mechanism_ar: 'فائض النحاس يزيح الحديد من المراكز الإنزيمية ويقلل حركته.', mechanism_fr: 'L’excès de Cu déplace le fer des sites enzymatiques et réduit sa mobilité.' },
      { targetId: 'h2po4', severity: 'medium', mechanism: 'Formation of insoluble copper phosphate precipitates.', mechanism_ar: 'تكوين رواسب فوسفات النحاس غير الذائبة.', mechanism_fr: 'Formation de précipités insolubles de phosphate de cuivre.' },
    ],
    synergists: [
      { targetId: 'no3', intensity: 'medium', mechanism: 'Enhances plastocyanin synthesis and photosynthetic electron transport.', mechanism_ar: 'يعزز تخليق البلاستوسيانين ونقل الإلكترونات في البناء الضوئي.', mechanism_fr: 'Stimule la synthèse de plastocyanine et le transport d’électrons.' },
    ],
    functionalRole: 'Plastocyanin in photosynthetic electron transport, polyphenol oxidase, laccase (lignification of xylem vessels), pollen viability.',
    functionalRole_ar: 'مركب البلاستوسيانين في البناء الضوئي، إنزيمات اللجنين لتقوية أوعية الخشب، وخصوبة حبوب اللقاح.',
    functionalRole_fr: 'Plastocyanine photosynthétique, laccases (lignification du xylème), viabilité du pollen.' ,
    fieldTips: 'Very immobile: deficiency leads to whiptail / withered shoot tips and blind grain heads. High organic matter (>8%) tightly binds Cu.',
    fieldTips_ar: 'شديد بطء الحركة: نقصه يسبب موت أطراف الأغصان وفراغ سنابل الحبوب. المادة العضوية العالية تمسك النحاس بقوة.',
  },
  {
    id: 'b',
    ion: 'H₃BO₃',
    name: 'Boron (Boric Acid)',
    name_ar: 'البورون (حمض البوريك)',
    name_fr: 'Bore (Acide Borique)',
    category: 'micro',
    charge: 'neutral',
    valency: 0,
    color: '#ca8a04',
    antagonists: [
      { targetId: 'ca', severity: 'high', mechanism: 'High calcium locks boron in soil as insoluble calcium metaborate and increases plant tissue demand.', mechanism_ar: 'الكالسيوم المرتفع يثبت البورون كبورات كالسيوم غير ذائبة ويرفع احتياج أنسجة النبات.', mechanism_fr: 'Le calcium élevé précipite le bore en métaborate de calcium et augmente la demande tissulaire.' },
      { targetId: 'k', severity: 'low', mechanism: 'Osmotic imbalance affecting boric acid diffusion.', mechanism_ar: 'اختلال أسموزي يؤثر على انتشار حمض البوريك.', mechanism_fr: 'Déséquilibre osmotique affectant la diffusion de l’acide borique.' },
    ],
    synergists: [
      { targetId: 'ca', intensity: 'high', mechanism: 'Essential partners in forming RG-II borate diester cross-links in primary cell walls.', mechanism_ar: 'شريكان أساسيان في بناء الروابط البكتينية لجدران الخلايا الأولية.', mechanism_fr: 'Partenaires indispensables dans la réticulation boratée des pectines pariétales.' },
      { targetId: 'zn', intensity: 'medium', mechanism: 'Synergy in flower bud differentiation and successful fruit set.', mechanism_ar: 'تآزر في تمايز البراعم الزهرية والعقد الثمري الناجح.', mechanism_fr: 'Synergie dans l’induction florale et la réussite de la nouaison.' },
    ],
    functionalRole: 'Cell wall cross-linking (pectins), pollen germination and tube growth, sugar transport, apical meristem cell division.',
    functionalRole_ar: 'ربط بكتين جدران الخلايا، إنبات ونمو أنبوب اللقاح، نقل السكريات، وانقسام خلايا القمم النامية.',
    functionalRole_fr: 'Réticulation des pectines de la paroi, germination du tube pollinique, division des méristèmes apicaux.',
    fieldTips: 'Very immobile in most species: deficiency causes black heart in beets, hollow stem in brassicas, and blossom drop. Very narrow safety margin between deficiency and toxicity.',
    fieldTips_ar: 'عديم الحركة في معظم المحاصيل: نقصه يسبب القلب الأسود في الشمندر، الساق المجوفة في الملفوف، وسقوط الأزهار. الهامش ضيق جداً بين النقص والسمية.',
  },
  {
    id: 'moo4',
    ion: 'MoO₄²⁻',
    name: 'Molybdate',
    name_ar: 'الموليبدات',
    name_fr: 'Molybdate',
    category: 'micro',
    charge: 'anion',
    valency: -2,
    color: '#6366f1',
    antagonists: [
      { targetId: 'so4', severity: 'high', mechanism: 'Direct competition with sulfate at shared SULTR permease uptake systems.', mechanism_ar: 'تنافس مباشر مع الكبريتات على ناقلات SULTR المشتركة.', mechanism_fr: 'Compétition directe avec le sulfate sur les perméases SULTR.' },
      { targetId: 'cu', severity: 'medium', mechanism: 'In acidic soils, Cu and Mo can form insoluble compounds.', mechanism_ar: 'في الأراضي الحامضية قد يشكل النحاس والموليبدينوم مركبات غير ذائبة.', mechanism_fr: 'En sol acide, le cuivre et le molybdène peuvent former des complexes insolubles.' },
    ],
    synergists: [
      { targetId: 'no3', intensity: 'high', mechanism: 'Molybdenum is the essential metal center of nitrate reductase; indispensable for converting NO₃⁻ to amino acids.', mechanism_ar: 'الموليبدينوم هو المركز المعدني الأساسي لإنزيم نترات ريدكتاز لتحويل النترات إلى أحماض أمينية.', mechanism_fr: 'Cofacteur métallique central de la nitrate réductase pour la réduction du nitrate.' },
      { targetId: 'fe', intensity: 'medium', mechanism: 'Fe-Mo cofactor of nitrogenase enzyme in symbiotic rhizobia legume nodules.', mechanism_ar: 'مركز Fe-Mo لإنزيم النيتروجينيز لتثبيت النيتروجين الحيوي في عقد البقوليات.', mechanism_fr: 'Cofacteur Fe-Mo de la nitrogénase pour la fixation symbiotique de l’azote.' },
    ],
    functionalRole: 'Nitrate reductase cofactor, symbiotic nitrogen fixation in legumes, xanthine dehydrogenase (purine metabolism).',
    functionalRole_ar: 'العامل المرافق لإنزيم نترات ريدكتاز، تثبيت النيتروجين الجوي في البقوليات، وتمثيل البيورينات.',
    functionalRole_fr: 'Cofacteur de la nitrate réductase et de la nitrogénase (fixation symbiotique de l’azote).' ,
    fieldTips: 'The ONLY micronutrient whose availability INCREASES with soil pH. In acid soils (pH < 5.5), Mo is locked by iron oxides (whiptail in cauliflower).',
    fieldTips_ar: 'العنصر الصغرى الوحيد الذي يزداد توفره مع زيادة قلوية التربة. في الأراضي الحامضية يثبت بقوة مسبباً ذيل السوط في القرنبيط.',
  },
  {
    id: 'cl',
    ion: 'Cl⁻',
    name: 'Chloride',
    name_ar: 'الكلوريد',
    name_fr: 'Chlorure',
    category: 'beneficial',
    charge: 'anion',
    valency: -1,
    color: '#059669',
    antagonists: [
      { targetId: 'no3', severity: 'high', mechanism: 'High chloride outcompetes nitrate uptake and causes leaf margin necrosis.', mechanism_ar: 'الكلوريد المرتفع يطرد النترات ويسبب احتراق حواف الأوراق.', mechanism_fr: 'Le chlorure élevé supplante l’absorption de nitrate et provoque des brûlures marginales.' },
      { targetId: 'so4', severity: 'medium', mechanism: 'Anion competition during saline water irrigation.', mechanism_ar: 'تنافس أنيوني عند الري بمياه مالحة.', mechanism_fr: 'Compétition anionique lors de l’irrigation avec des eaux saumâtres.' },
    ],
    synergists: [
      { targetId: 'k', intensity: 'medium', mechanism: 'Counter-ion for potassium during stomatal opening and cell turgor expansion.', mechanism_ar: 'أيون مرافق للبوتاسيوم لفتح الثغور والامتلاء الخلوي.', mechanism_fr: 'Contre-ion du potassium pour l’ouverture stomatique et la turgescence.' },
    ],
    functionalRole: 'Osmoregulation, charge balance, stomatal regulation, photosystem II water oxidation.',
    functionalRole_ar: 'التنظيم الأسموزي، موازنة الشحنات، تنظيم الثغور، وأكسدة الماء في البناء الضوئي.',
    functionalRole_fr: 'Osmorégulation, équilibre de charge, régulation stomatique et turgescence.',
    fieldTips: 'Highly mobile: easily reaches toxic levels with saline water (>3 meq/L). Sensitive crops: avocado, berries, citrus, grapevines.',
    fieldTips_ar: 'شديد الحركة: يصل لسمية بسهولة مع المياه المالحة. المحاصيل الحساسة: الأفوكادو، التوتيات، الحمضيات، والعنب.',
  },
  {
    id: 'na',
    ion: 'Na⁺',
    name: 'Sodium (Salinity & Antagonism)',
    name_ar: 'الصوديوم (الملوحة والتضاد)',
    name_fr: 'Sodium (Salinité & Antagonisme)',
    category: 'beneficial',
    charge: 'cation',
    valency: 1,
    color: '#dc2626',
    antagonists: [
      { targetId: 'k', severity: 'high', mechanism: 'Severe competition at HKT transporters; high sodium displaces potassium, disrupting stomatal closure and protein synthesis.', mechanism_ar: 'تنافس شديد على ناقلات HKT؛ الصوديوم يطرد البوتاسيوم ويعطل عمل الثغور وتخليق البروتين.', mechanism_fr: 'Forte compétition sur les transporteurs HKT; le sodium déplace le potassium et perturbe la régulation stomatique.' },
      { targetId: 'ca', severity: 'high', mechanism: 'Displaces calcium from root cell walls and soil clay micelles, causing soil compaction and root membrane leakiness.', mechanism_ar: 'يطرد الكالسيوم من جدر الخلايا وغرويات التربة مسبباً انضغاط التربة وتلف أغشية الجذور.', mechanism_fr: 'Déplace le calcium des parois cellulaires et des argiles, provoquant la battance du sol.' },
      { targetId: 'mg', severity: 'medium', mechanism: 'High SAR (Sodium Adsorption Ratio) depresses magnesium uptake.', mechanism_ar: 'ارتفاع نسبة ادمصاص الصوديوم SAR يخفض امتصاص المغنيسيوم.', mechanism_fr: 'Un SAR élevé déprime l’assimilation du magnésium.' },
    ],
    synergists: [
      { targetId: 'k', intensity: 'low', mechanism: 'Can substitute partially for K in non-specific osmotic roles in halophytic crops (sugarbeet).', mechanism_ar: 'يمكن أن يعوض البوتاسيوم جزئياً في الوظائف الأسموزية في المحاصيل المتحملة (بنجر السكر).', mechanism_fr: 'Peut remplacer partiellement le K dans le maintien osmotique chez les plantes halophytes (betterave).' },
    ],
    functionalRole: 'Beneficial osmolyte in C4 and CAM halophytes (Chenopodiaceae, sugar beet); destructive toxin in glycophytes.',
    functionalRole_ar: 'مادة أسموزية مفيدة في النباتات الملحية؛ عنصر ضار وسام في المحاصيل العادية.',
    functionalRole_fr: 'Osmolyte bénéfique chez les halophytes; ion toxique destructeur chez les glycophytes.',
    fieldTips: 'Sodium Adsorption Ratio (SAR) > 10 destroys soil structure. Apply Agricultural Gypsum (CaSO₄) to displace Na⁺ and leach with clean water.',
    fieldTips_ar: 'إذا تجاوزت نسبة SAR 10 تتفكك بنية التربة وتتصلب. أضف الجبس الزراعي لطرد الصوديوم وغسله بمياه عذبة.',
  },
  {
    id: 'si',
    ion: 'H₄SiO₄',
    name: 'Silicon (Monosilicic Acid)',
    name_ar: 'السيليكون (حمض أحادي السيليسيك)',
    name_fr: 'Silicium (Acide Monosilicique)',
    category: 'beneficial',
    charge: 'neutral',
    valency: 0,
    color: '#0284c7',
    antagonists: [
      { targetId: 'al', severity: 'high', mechanism: 'Mitigates aluminum toxicity by forming non-toxic aluminosilicate complexes in root cell walls.', mechanism_ar: 'يحيد سمية الألمنيوم بتكوين مركبات سيليكات الألمنيوم غير السامة في الجذور.', mechanism_fr: 'Atténue la toxicité aluminique en formant des aluminosilicates non toxiques.' },
      { targetId: 'na', severity: 'high', mechanism: 'Deposits in root endodermis (Casparian strip), physically filtering out toxic sodium ions.', mechanism_ar: 'يترسب في شريط كاسباري بالجذور مما يحجب أيونات الصوديوم السامة فيزيائياً.', mechanism_fr: 'Se dépose dans l’endoderme racinaire, bloquant physiquement le passage du sodium.' },
    ],
    synergists: [
      { targetId: 'h2po4', intensity: 'high', mechanism: 'Silicate anions desorb fixed phosphate from iron and aluminum oxides, increasing plant-available P in acid soils.', mechanism_ar: 'أنيونات السيليكات تحرر الفوسفات المثبت على أكاسيد الحديد والألمنيوم.', mechanism_fr: 'Désorbe le phosphate fixé sur les oxydes de fer et d’aluminium en sol acide.' },
      { targetId: 'ca', intensity: 'medium', mechanism: 'Reinforces epidermal silica-pectate armor against fungi and chewing insects.', mechanism_ar: 'يقوي الدروع السطحية للأوراق ضد الفطريات والحشرات الثاقبة.', mechanism_fr: 'Renforce le blindage silice-pectate épidermique contre les champignons et ravageurs.' },
    ],
    functionalRole: 'Mechanical leaf rigidity (phytoliths), lodging prevention, fungal pathogen barrier (powdery mildew/blast), drought and heat mitigation.',
    functionalRole_ar: 'صلابة ميكانيكية للأوراق والسيقان، منع الرقاد، حاجز ضد الفطريات، وتخفيف إجهاد الحرارة والجفاف.',
    functionalRole_fr: 'Rigidité mécanique (phytolithes), barrière contre l’oïdium et la pyriculariose, résistance à la verse et à la chaleur.',
    fieldTips: 'Uptake occurs strictly as uncharged Si(OH)₄. Essential for rice, sugarcane, cereals, and cucurbits.',
    fieldTips_ar: 'الامتصاص يتم حصراً كحمض أحادي السيليسيك المتعادل. ضروري جداً للأرز وقصب السكر والحبوب والقرعيات.',
  },
];

// ============================================================================
// 2. ROOT ARRIVAL TRANSPORT KINETICS & ENVIRONMENTAL MODIFIER
// ============================================================================

export interface KineticNutrientArrival {
  id: string;
  name: string;
  name_ar: string;
  name_fr: string;
  symbol: string;
  standardMassFlowPct: number;
  standardDiffusionPct: number;
  standardInterceptionPct: number;
  diffusionCoeffCm2s: number; // e.g. 1e-5 to 1e-9
  soilMobilityScore: 'Extremely Mobile' | 'Mobile' | 'Low Mobility' | 'Virtually Immobile';
  soilMobilityScore_ar: string;
  soilMobilityScore_fr: string;
  vulnerabilityToDrought: 'Extreme' | 'High' | 'Moderate' | 'Low';
  vulnerabilityToColdSoil: 'Extreme' | 'High' | 'Moderate' | 'Low';
  mechanisticNotes: string;
  mechanisticNotes_ar: string;
}

export const KINETIC_NUTRIENTS: KineticNutrientArrival[] = [
  {
    id: 'no3',
    name: 'Nitrate (NO₃⁻)',
    name_ar: 'النترات',
    name_fr: 'Nitrate',
    symbol: 'NO₃⁻',
    standardMassFlowPct: 80,
    standardDiffusionPct: 15,
    standardInterceptionPct: 5,
    diffusionCoeffCm2s: 1.0e-5,
    soilMobilityScore: 'Extremely Mobile',
    soilMobilityScore_ar: 'شديد الحركة في التربة',
    soilMobilityScore_fr: 'Extrêmement mobile',
    vulnerabilityToDrought: 'High',
    vulnerabilityToColdSoil: 'Moderate',
    mechanisticNotes: 'Rides water flow directly to root surface. Rapidly washes below root zone under over-irrigation.',
    mechanisticNotes_ar: 'ينتقل مباشرة مع تيار الماء لسطح الجذر. يغسل سريعاً تحت منطقة الجذور عند الإفراط في الري.',
  },
  {
    id: 'ca',
    name: 'Calcium (Ca²⁺)',
    name_ar: 'الكالسيوم',
    name_fr: 'Calcium',
    symbol: 'Ca²⁺',
    standardMassFlowPct: 72,
    standardDiffusionPct: 18,
    standardInterceptionPct: 10,
    diffusionCoeffCm2s: 6.0e-6,
    soilMobilityScore: 'Mobile',
    soilMobilityScore_ar: 'متحرك في التربة',
    soilMobilityScore_fr: 'Mobile dans le sol',
    vulnerabilityToDrought: 'Extreme',
    vulnerabilityToColdSoil: 'Moderate',
    mechanisticNotes: 'Transpiration stream carries abundant Ca to roots; if air is humid or soil dries, mass flow stops and fruit develops necrosis.',
    mechanisticNotes_ar: 'تيار النتح يحمل كميات وفيرة للجذور؛ عند انخفاض النتح أو جفاف التربة يتوقف الإمداد فوراً.',
  },
  {
    id: 'mg',
    name: 'Magnesium (Mg²⁺)',
    name_ar: 'المغنيسيوم',
    name_fr: 'Magnésium',
    symbol: 'Mg²⁺',
    standardMassFlowPct: 65,
    standardDiffusionPct: 22,
    standardInterceptionPct: 13,
    diffusionCoeffCm2s: 5.5e-6,
    soilMobilityScore: 'Mobile',
    soilMobilityScore_ar: 'متحرك في التربة',
    soilMobilityScore_fr: 'Mobile dans le sol',
    vulnerabilityToDrought: 'High',
    vulnerabilityToColdSoil: 'Moderate',
    mechanisticNotes: 'Mainly supplied by mass flow. Leaches easily in coarse sandy soils with low CEC.',
    mechanisticNotes_ar: 'يصل غالباً بالتدفق الكتلي. يغسل بسهولة في الأراضي الرملية منخفضة السعة التبادلية.',
  },
  {
    id: 'so4',
    name: 'Sulfate (SO₄²⁻)',
    name_ar: 'الكبريتات',
    name_fr: 'Sulfate',
    symbol: 'SO₄²⁻',
    standardMassFlowPct: 60,
    standardDiffusionPct: 28,
    standardInterceptionPct: 12,
    diffusionCoeffCm2s: 7.0e-6,
    soilMobilityScore: 'Mobile',
    soilMobilityScore_ar: 'متحرك في التربة',
    soilMobilityScore_fr: 'Mobile dans le sol',
    vulnerabilityToDrought: 'High',
    vulnerabilityToColdSoil: 'Moderate',
    mechanisticNotes: 'Anion that moves with soil solution; intermediate retention by iron/aluminum oxides at low pH.',
    mechanisticNotes_ar: 'أنيون يتحرك مع محلول التربة؛ يثبت جزئياً في الأراضي الحامضية.',
  },
  {
    id: 'nh4',
    name: 'Ammonium (NH₄⁺)',
    name_ar: 'الأمونيوم',
    name_fr: 'Ammonium',
    symbol: 'NH₄⁺',
    standardMassFlowPct: 35,
    standardDiffusionPct: 50,
    standardInterceptionPct: 15,
    diffusionCoeffCm2s: 8.0e-6,
    soilMobilityScore: 'Low Mobility',
    soilMobilityScore_ar: 'قليل الحركة (ممسوك على معقد التبادل)',
    soilMobilityScore_fr: 'Peu mobile (retenu sur le CEC)',
    vulnerabilityToDrought: 'Moderate',
    vulnerabilityToColdSoil: 'High',
    mechanisticNotes: 'Adsorbed on clay/OM exchange complex; requires diffusion to reach active root hairs.',
    mechanisticNotes_ar: 'ممسوك على معقد الدبال والطين؛ يحتاج للانتشار للوصول إلى الشعيرات الجذرية.',
  },
  {
    id: 'k',
    name: 'Potassium (K⁺)',
    name_ar: 'البوتاسيوم',
    name_fr: 'Potassium',
    symbol: 'K⁺',
    standardMassFlowPct: 20,
    standardDiffusionPct: 70,
    standardInterceptionPct: 10,
    diffusionCoeffCm2s: 1.5e-7,
    soilMobilityScore: 'Low Mobility',
    soilMobilityScore_ar: 'قليل الحركة (انتشار بطيء)',
    soilMobilityScore_fr: 'Peu mobile (diffusion)',
    vulnerabilityToDrought: 'High',
    vulnerabilityToColdSoil: 'High',
    mechanisticNotes: 'High root demand creates a steep depletion zone around roots. Diffusion drops 80% when soil dries.',
    mechanisticNotes_ar: 'الطلب العالي ينشئ نطاق استنزاف حول الجذر. ينخفض انتشاره بنسبة 80% عند جفاف التربة.',
  },
  {
    id: 'h2po4',
    name: 'Phosphate (H₂PO₄⁻)',
    name_ar: 'الفوسفات',
    name_fr: 'Phosphate',
    symbol: 'H₂PO₄⁻',
    standardMassFlowPct: 5,
    standardDiffusionPct: 85,
    standardInterceptionPct: 10,
    diffusionCoeffCm2s: 1.0e-9,
    soilMobilityScore: 'Virtually Immobile',
    soilMobilityScore_ar: 'شبه عديم الحركة (< 2 مم)',
    soilMobilityScore_fr: 'Pratiquement immobile',
    vulnerabilityToDrought: 'Extreme',
    vulnerabilityToColdSoil: 'Extreme',
    mechanisticNotes: 'Slowest moving ion. Relies critically on dense root hair proliferation and mycorrhizal hyphal networks.',
    mechanisticNotes_ar: 'أبطأ الأيونات حركة. يعتمد كلياً على كثافة الشعيرات الجذرية وشبكات المايكورايزا.',
  },
  {
    id: 'zn',
    name: 'Zinc (Zn²⁺)',
    name_ar: 'الزنك',
    name_fr: 'Zinc',
    symbol: 'Zn²⁺',
    standardMassFlowPct: 30,
    standardDiffusionPct: 55,
    standardInterceptionPct: 15,
    diffusionCoeffCm2s: 3.0e-8,
    soilMobilityScore: 'Low Mobility',
    soilMobilityScore_ar: 'قليل الحركة',
    soilMobilityScore_fr: 'Peu mobile',
    vulnerabilityToDrought: 'High',
    vulnerabilityToColdSoil: 'High',
    mechanisticNotes: 'Strongly bound by carbonates and organic matter; diffusion driven by root exudates (phytosiderophores).',
    mechanisticNotes_ar: 'يرتبط بقوة بالكربونات والمادة العضوية؛ يعتمد على الإفرازات الجذرية لانتشاره.',
  },
  {
    id: 'fe',
    name: 'Iron (Fe²⁺/Fe³⁺)',
    name_ar: 'الحديد',
    name_fr: 'Fer',
    symbol: 'Fe²⁺/³⁺',
    standardMassFlowPct: 15,
    standardDiffusionPct: 65,
    standardInterceptionPct: 20,
    diffusionCoeffCm2s: 2.0e-8,
    soilMobilityScore: 'Virtually Immobile',
    soilMobilityScore_ar: 'شبه عديم الحركة في الأراضي القلوية',
    soilMobilityScore_fr: 'Très peu mobile en sol calcaire',
    vulnerabilityToDrought: 'High',
    vulnerabilityToColdSoil: 'Extreme',
    mechanisticNotes: 'Free ionic Fe in alkaline soil is < 10⁻¹⁵ M. Uptake requires active rhizosphere proton pumping or synthetic chelates.',
    mechanisticNotes_ar: 'تركيز الحديد الحر في الأراضي القلوية ضئيل جداً. يحتاج تحميض الجذور أو مركبات مخلبية كـ EDDHA.',
  },
  {
    id: 'b',
    name: 'Boron (H₃BO₃)',
    name_ar: 'البورون',
    name_fr: 'Bore',
    symbol: 'H₃BO₃',
    standardMassFlowPct: 35,
    standardDiffusionPct: 45,
    standardInterceptionPct: 20,
    diffusionCoeffCm2s: 2.5e-6,
    soilMobilityScore: 'Mobile',
    soilMobilityScore_ar: 'متحرك في التربة الرملية',
    soilMobilityScore_fr: 'Mobile dans les sols légers',
    vulnerabilityToDrought: 'Extreme',
    vulnerabilityToColdSoil: 'Moderate',
    mechanisticNotes: 'Uncharged boric acid moves with water flow in light soils but adsorbs on clay minerals in alkaline soils.',
    mechanisticNotes_ar: 'حمض البوريك المتعادل يتحرك مع الماء في الترب الرملية لكنه يثبت على الطين في الأراضي القلوية.',
  },
];

// ============================================================================
// 3. PLANT PHLOEM MOBILITY & VISUAL SYMPTOM DIAGNOSTIC
// ============================================================================

export interface PlantTissueZone {
  id: 'apical' | 'young' | 'mature' | 'lower';
  name: string;
  name_ar: string;
  name_fr: string;
  description: string;
  description_ar: string;
  affectedNutrients: string[];
}

export const PLANT_ZONES: PlantTissueZone[] = [
  {
    id: 'apical',
    name: 'Growing Tip, Buds & Fruits',
    name_ar: 'القمة النامية، البراعم والثمار',
    name_fr: 'Apex, bourgeons et fruits',
    description: 'Immobile nutrients that cannot re-mobilize through phloem. Failure strikes fastest-growing cells.',
    description_ar: 'عناصر عديمة الحركة في اللحاء لا تنتقل من الأنسجة القديمة. يصيب نقصه الخلايا سريعة الانقسام.',
    affectedNutrients: ['Ca', 'B'],
  },
  {
    id: 'young',
    name: 'Young Upper Leaves (Shoot apex)',
    name_ar: 'الأوراق الحديثة العلوية',
    name_fr: 'Jeunes feuilles supérieures',
    description: 'Immobile and intermediate nutrients; symptoms appear at the top because plant cannot re-allocate from base.',
    description_ar: 'عناصر عديمة أو بطيئة الحركة؛ تظهر الأعراض في القمة لعجز النبات عن إعادة تدويرها من الأسفل.',
    affectedNutrients: ['Fe', 'Mn', 'Zn', 'Cu', 'S'],
  },
  {
    id: 'mature',
    name: 'Middle Canopy Leaves',
    name_ar: 'أوراق وسط المجموع الخضري',
    name_fr: 'Feuilles médianes',
    description: 'Transition zone where progressive mobile and intermediate deficiencies overlap.',
    description_ar: 'منطقة انتقال تظهر فيها أعراض النقص التدريجي للعناصر متوسطة الحركة.',
    affectedNutrients: ['S', 'Mo', 'Mg'],
  },
  {
    id: 'lower',
    name: 'Lower & Oldest Leaves (Base)',
    name_ar: 'الأوراق السفلية والمسنة',
    name_fr: 'Vieilles feuilles basales',
    description: 'Highly mobile nutrients; plant cannibalizes old foliage to feed young growing shoots.',
    description_ar: 'عناصر عالية الحركة؛ يقوم النبات بسحبها من الأوراق القديمة لتغذية القمم النامية الجديدة.',
    affectedNutrients: ['N', 'P', 'K', 'Mg', 'Mo'],
  },
];

export interface SymptomDiagnosticNode {
  id: string;
  location: 'lower' | 'young' | 'apical' | 'whole';
  pattern: 'interveinal' | 'marginal' | 'uniform' | 'purple' | 'deformation' | 'rosette';
  patternLabel: string;
  patternLabel_ar: string;
  patternLabel_fr: string;
  matchingNutrient: string;
  name: string;
  name_ar: string;
  visualSummary: string;
  visualSummary_ar: string;
  correctionAction: string;
  correctionAction_ar: string;
}

export const DIAGNOSTIC_NODES: SymptomDiagnosticNode[] = [
  {
    id: 'n-def',
    location: 'lower',
    pattern: 'uniform',
    patternLabel: 'General uniform chlorosis (pale yellowing)',
    patternLabel_ar: 'اصفرار متجانس وشامل على كامل الورقة',
    patternLabel_fr: 'Chlorose uniforme généralisée',
    matchingNutrient: 'N',
    name: 'Nitrogen Deficiency',
    name_ar: 'نقص النيتروجين',
    visualSummary: 'Starts on oldest bottom leaves; pale yellowing of entire lamina, stunting, premature senescence.',
    visualSummary_ar: 'يبدأ من الأوراق السفلية القديمة؛ اصفرار شامل للأنصال، تقزم، وتساقط مبكر للأوراق.',
    correctionAction: 'Apply soluble Calcium Nitrate or Urea 46% fertigation; foliar urea (0.5-1%) for rapid greening.',
    correctionAction_ar: 'تسميد نترات الكالسيوم أو اليوريا؛ رش ورقي باليوريا منخفضة البيوريت 0.5-1%.',
  },
  {
    id: 'p-def',
    location: 'lower',
    pattern: 'purple',
    patternLabel: 'Dark green with purplish / bronze veins',
    patternLabel_ar: 'أخضر داكن مع تلون أرجواني أو برونزي في العروق والسيقان',
    patternLabel_fr: 'Feuillage vert foncé avec teintes pourpres/bronzes',
    matchingNutrient: 'P',
    name: 'Phosphorus Deficiency',
    name_ar: 'نقص الفوسفور',
    visualSummary: 'Old leaves turn dull dark green with red-purple anthocyanin pigmentation along veins, stiff upright leaves, stunted roots.',
    visualSummary_ar: 'أوراق قديمة بلون أخضر معتم مع صبغة أنثوسيانين أرجوانية حمراء على العروق، وضعف نمو الجذور.',
    correctionAction: 'Apply MAP (12-61-0) or MKP (0-52-34); mycorrhizal inoculation; ensure soil temperature > 15°C.',
    correctionAction_ar: 'تسميد فوسفات أحادي الأمونيوم MAP أو MKP؛ إدخال المايكورايزا؛ تدفئة بيئة الجذور.',
  },
  {
    id: 'k-def',
    location: 'lower',
    pattern: 'marginal',
    patternLabel: 'Marginal chlorosis turning to dry leaf edge burn',
    patternLabel_ar: 'اصفرار حواف الأوراق يتبعه احتراق وجفاف الحواف (Scorching)',
    patternLabel_fr: 'Chlorose marginale évoluant en nécrose des bords',
    matchingNutrient: 'K',
    name: 'Potassium Deficiency',
    name_ar: 'نقص البوتاسيوم',
    visualSummary: 'Old leaf tips and margins turn yellow then brown and crispy ("firing"), weak stems, poor fruit filling.',
    visualSummary_ar: 'اصفرار قمم وحواف الأوراق المسنة ثم تحولها للون البني المحترق الجاف، ضعف السيقان وقلة تحجيم الثمار.',
    correctionAction: 'Fertigate Potassium Sulfate (0-0-50) or Potassium Nitrate (13-0-46); check K:Mg ratio.',
    correctionAction_ar: 'تسميد سلفات البوتاسيوم أو نترات البوتاسيوم؛ ضبط نسبة البوتاسيوم للمغنيسيوم.',
  },
  {
    id: 'mg-def',
    location: 'lower',
    pattern: 'interveinal',
    patternLabel: 'Bold interveinal chlorosis with green inverted-V',
    patternLabel_ar: 'اصفرار واضح بين العروق مع بقاء العروق خضراء (شكل V مقلوب)',
    patternLabel_fr: 'Chlorose internervaire prononcée en V inversé',
    matchingNutrient: 'Mg',
    name: 'Magnesium Deficiency',
    name_ar: 'نقص المغنيسيوم',
    visualSummary: 'Striking yellowing between main veins of bottom leaves while veins remain green; may develop purple/red margins in brassicas.',
    visualSummary_ar: 'اصفرار صارخ بين عروق الأوراق المسنة مع بقاء العروق خضراء؛ قد تتحول الحواف للون الأرجواني في بعض المحاصيل.',
    correctionAction: 'Apply Magnesium Sulfate (Epsom Salt) 20-40 kg/ha via fertigation or 1.5-2% foliar spray.',
    correctionAction_ar: 'تسميد سلفات المغنيسيوم (ملح إبسوم) 20-40 كجم/هـ أو رشه ورقياً بتركيز 1.5-2%.',
  },
  {
    id: 'fe-def',
    location: 'young',
    pattern: 'interveinal',
    patternLabel: 'Intense ivory/yellow interveinal chlorosis on newest leaves',
    patternLabel_ar: 'اصفرار عاجي فاقع بين العروق على أحدث الأوراق القمية',
    patternLabel_fr: 'Chlorose internervaire ivoire/jaune vive sur jeunes feuilles',
    matchingNutrient: 'Fe',
    name: 'Iron Deficiency (Chlorosis)',
    name_ar: 'نقص الحديد (الاصفرار القمي)',
    visualSummary: 'Newest emerging leaves show bright yellowing between veins; in severe cases the entire leaf turns bleached white/ivory.',
    visualSummary_ar: 'أحدث الأوراق النامية تظهر اصفراراً ناصعاً بين العروق؛ وفي الحالات الشديدة تبيض الورقة تماماً.',
    correctionAction: 'Apply Fe-EDDHA (6% ortho-ortho) at 10-30 g/tree for alkaline soils (pH > 7.2) or Fe-EDTA for acid soils.',
    correctionAction_ar: 'استخدام حديد مخلبي Fe-EDDHA (نسبة أورثو-أورثو عالية) في الأراضي القلوية أو Fe-DTPA في الزراعة المائية.',
  },
  {
    id: 'zn-def',
    location: 'young',
    pattern: 'rosette',
    patternLabel: 'Small clustered leaves, shortened internodes ("Little Leaf" rosette)',
    patternLabel_ar: 'صغر شديد في حجم الأوراق وتقزم السلاميات (التورد والورقة الصغيرة)',
    patternLabel_fr: 'Petites feuilles en rosette et raccourcissement des entre-nœuds',
    matchingNutrient: 'Zn',
    name: 'Zinc Deficiency',
    name_ar: 'نقص الزنك',
    visualSummary: 'Shoot tips stop elongating, forming tight clusters of miniature, stiff, chlorotic leaves; white striping in corn.',
    visualSummary_ar: 'توقف استطالة القمم النامية مكونة حزم متجمعة من أوراق صغيرة قاسية، مع خطوط بيضاء عريضة في الذرة.',
    correctionAction: 'Foliar spray Zinc-EDTA 12% (1-1.5 g/L) or soil application of Zinc Sulfate (20-30 kg/ha).',
    correctionAction_ar: 'رش ورقي بالزنك المخلبي Zn-EDTA (1-1.5 جم/لتر) أو إضافة سلفات الزنك في التربة.',
  },
  {
    id: 'mn-def',
    location: 'young',
    pattern: 'interveinal',
    patternLabel: 'Checkerboard mottled chlorosis with small necrotic spots',
    patternLabel_ar: 'تبرقش شطرنجي بين العروق مع بقع نخرية دقيقة (عين العصفور)',
    patternLabel_fr: 'Marbrure en damier avec petites taches nécrotiques',
    matchingNutrient: 'Mn',
    name: 'Manganese Deficiency',
    name_ar: 'نقص المنجنيز',
    visualSummary: 'Upper leaves show diffuse speckled chlorosis; veins remain bordered by a green band giving a reticulated appearance.',
    visualSummary_ar: 'الأوراق العلوية تظهر تبرقشاً نقطياً دقيقاً؛ العروق تظل محاطة بحزام أخضر ضيق كشبكة شطرنجية.',
    correctionAction: 'Foliar application of Manganese Sulfate 0.3-0.5% or Mn-EDTA chelate; avoid over-liming.',
    correctionAction_ar: 'رش سلفات المنجنيز 0.3-0.5% أو المنجنيز المخلبي Mn-EDTA؛ تجنب الإفراط في الجير.',
  },
  {
    id: 'ca-def',
    location: 'apical',
    pattern: 'deformation',
    patternLabel: 'Death of shoot tip, hook-shaped young leaves, blossom-end rot',
    patternLabel_ar: 'موت القمة النامية، تشوه الأوراق الحديثة كالمعكوف، وعفن طرف الزهرة في الثمار',
    patternLabel_fr: 'Mort du bourgeon terminal, feuilles en crosse, nécrose apicale des fruits',
    matchingNutrient: 'Ca',
    name: 'Calcium Deficiency',
    name_ar: 'نقص الكالسيوم',
    visualSummary: 'Growing tips die back ("blind shoot"); new leaves are distorted with hooked tips; tomato/pepper fruits develop sunken black bottom rot.',
    visualSummary_ar: 'موت القمة النامية (البرعم الأعمى)؛ تشوه الأوراق القمية والتفافها كخطاف؛ سواد وتآكل أسفل ثمار الطماطم والفلفل.',
    correctionAction: 'Improve transpiration (lower greenhouse humidity); apply Calcium Nitrate + Boron; avoid excess NH₄⁺ or K⁺.',
    correctionAction_ar: 'تحسين حركة الهواء والنتح؛ تسميد نترات الكالسيوم مع البورون؛ تقليل البوتاسيوم والأمونيوم الزائد.',
  },
  {
    id: 'b-def',
    location: 'apical',
    pattern: 'deformation',
    patternLabel: 'Brittle thick leaves, death of apical buds, hollow stems, blossom drop',
    patternLabel_ar: 'هشاشة وتكسر الأوراق، موت البراعم الطرفية، سيقان مجوفة، وسقوط الأزهار',
    patternLabel_fr: 'Feuilles cassantes épaissies, avortement des boutons, tiges creuses',
    matchingNutrient: 'B',
    name: 'Boron Deficiency',
    name_ar: 'نقص البورون',
    visualSummary: 'Terminal shoot dies, lateral buds break then die ("witch’s broom"); corky cracking on fruits and stems, flower abortion.',
    visualSummary_ar: 'موت البرعم الطرفي ثم نمو براعم جانبية مشوهة تموت لاحقاً (مكنسة الساحرة)؛ تشقق فليني في الثمار وتساقط الأزهار.',
    correctionAction: 'Apply Solubor (Disodium Octaborate) foliar (1 g/L) during pre-bloom; soil application of Borax (10-15 kg/ha).',
    correctionAction_ar: 'رش ورقي بمركب سوليوبور (1 جم/لتر) قبل التزهير؛ أو إضافة البوراكس للتربة 10-15 كجم/هـ.',
  },
];

// ============================================================================
// 4. BASE CATION SATURATION RATIO (BCSR) ALBRECHT FORMULAS
// ============================================================================

export interface CationBalanceResult {
  totalBasesMeq: number;
  caPct: number;
  mgPct: number;
  kPct: number;
  naPct: number;
  kToMgRatio: number;
  caToMgRatio: number;
  mgToKRatio: number;
  antagonismIndex: number; // (K + NH4) / (Ca + Mg)
  status: 'Optimal' | 'Warning: High K (Suppresses Mg)' | 'Warning: Low Ca (Compaction/Poor uptake)' | 'Warning: High Mg (Blocks K)' | 'Warning: Sodic (High Na)';
  status_ar: string;
  recommendation: string;
  recommendation_ar: string;
}

export function calculateCationBalance(
  caCmol: number, // cmol(+)/kg or meq/100g
  mgCmol: number,
  kCmol: number,
  naCmol: number,
  nh4Cmol: number = 0,
  alCmol: number = 0
): CationBalanceResult {
  const totalCations = Math.max(0.1, caCmol + mgCmol + kCmol + naCmol + nh4Cmol + alCmol);
  const caPct = (caCmol / totalCations) * 100;
  const mgPct = (mgCmol / totalCations) * 100;
  const kPct = (kCmol / totalCations) * 100;
  const naPct = (naCmol / totalCations) * 100;

  const kToMgRatio = mgCmol > 0 ? kCmol / mgCmol : 0;
  const caToMgRatio = mgCmol > 0 ? caCmol / mgCmol : 0;
  const mgToKRatio = kCmol > 0 ? mgCmol / kCmol : 0;
  const antagonismIndex = (caCmol + mgCmol) > 0 ? (kCmol + nh4Cmol) / (caCmol + mgCmol) : 0;

  let status: CationBalanceResult['status'] = 'Optimal';
  let status_ar = 'توازن كاتيونات مثالي ومستقر';
  let recommendation = 'Base saturation is balanced. Soil structure and uptake pathways are operating at peak efficiency.';
  let recommendation_ar = 'التشبع القاعدي متوازن تماماً. بنية التربة ومسارات الامتصاص تعمل بأعلى كفاءة.';

  if (naPct > 8) {
    status = 'Warning: Sodic (High Na)';
    status_ar = 'تحذير: تربة صودية مرتفعة الصوديوم (ESP > 8%)';
    recommendation = 'Apply Agricultural Gypsum (CaSO₄·2H₂O) at 2-5 tonnes/ha to displace exchangeable sodium and leach with low-salinity water.';
    recommendation_ar = 'أضف الجبس الزراعي بمعدل 2-5 طن/هكتار لطرد الصوديوم المتبادل ثم اغسل بمياه عذبة.';
  } else if (kToMgRatio > 0.65 || kPct > 8) {
    status = 'Warning: High K (Suppresses Mg)';
    status_ar = 'تحذير: فائض بوتاسيوم يثبط امتصاص المغنيسيوم والكالسيوم';
    recommendation = 'High Potassium is inducing hidden magnesium deficiency. Supplement with Epsom Salt (MgSO₄) and withhold potassium applications.';
    recommendation_ar = 'البوتاسيوم العالي يحجب المغنيسيوم مسبباً اصفراراً بين العروق. أضف سلفات المغنيسيوم وأوقف تسميد البوتاسيوم مؤقتاً.';
  } else if (caToMgRatio < 3.5 || mgPct > 25) {
    status = 'Warning: High Mg (Blocks K)';
    status_ar = 'تحذير: مغنيسيوم مفرط يسبب انضغاط التربة وحجب البوتاسيوم';
    recommendation = 'Excess magnesium causes soil tightness and sluggish water percolation. Apply Gypsum to restore Ca:Mg ratio above 5:1.';
    recommendation_ar = 'المغنيسيوم المرتفع يؤدي لتماسك التربة وصعوبة تصريف المياه وحجب البوتاسيوم. استخدم الجبس لرفع نسبة الكالسيوم.';
  } else if (caPct < 55) {
    status = 'Warning: Low Ca (Compaction/Poor uptake)';
    status_ar = 'تحذير: انخفاض الكالسيوم (ضعف بنية التربة واضطرابات الثمار)';
    recommendation = 'Low Calcium saturation reduces soil flocculation and causes fruit tip disorders. Apply Agricultural Lime (CaCO₃) if acid or Gypsum if neutral/alkaline.';
    recommendation_ar = 'انخفاض الكالسيوم يضعف تجمعات التربة ويسبب عفن طرف الثمار. أضف الحجر الجيري إذا كانت التربة حامضية أو الجبس إذا كانت قلوية.';
  }

  return {
    totalBasesMeq: Number(totalCations.toFixed(2)),
    caPct: Number(caPct.toFixed(1)),
    mgPct: Number(mgPct.toFixed(1)),
    kPct: Number(kPct.toFixed(1)),
    naPct: Number(naPct.toFixed(1)),
    kToMgRatio: Number(kToMgRatio.toFixed(2)),
    caToMgRatio: Number(caToMgRatio.toFixed(2)),
    mgToKRatio: Number(mgToKRatio.toFixed(2)),
    antagonismIndex: Number(antagonismIndex.toFixed(3)),
    status,
    status_ar,
    recommendation,
    recommendation_ar,
  };
}
