/**
 * Comprehensive Soil pH, Nutrient Availability, Crop Tolerance & Soil Amendment Engine
 *
 * Grounded in FAO-56, Havlin et al. (Soil Fertility and Fertilizers), Tisdale & Nelson,
 * and Mediterranean/Algerian calcareous and acidic soil management principles.
 */

export interface NutrientPhCurve {
  id: string;
  symbol: string;
  name: string;
  name_ar: string;
  name_fr: string;
  category: 'macro' | 'secondary' | 'micro' | 'toxicity';
  valence: string;
  color: string;
  optimumPhMin: number;
  optimumPhMax: number;
  /** Primary available chemical forms in soil solution */
  availableForms: string;
  availableForms_ar: string;
  availableForms_fr: string;
  /** Availability calculation returning 0 - 100% */
  calculateAvailability: (ph: number) => number;
  /** Summary of behavior at low pH (< 6.0) */
  lowPhBehavior: string;
  lowPhBehavior_ar: string;
  lowPhBehavior_fr: string;
  /** Summary of behavior at optimal pH (6.0 - 7.3) */
  optimalPhBehavior: string;
  optimalPhBehavior_ar: string;
  optimalPhBehavior_fr: string;
  /** Summary of behavior at alkaline / calcareous pH (> 7.5) */
  highPhBehavior: string;
  highPhBehavior_ar: string;
  highPhBehavior_fr: string;
  /** Recommended fertilizer & chelated solutions */
  fertilizerStrategy: string;
  fertilizerStrategy_ar: string;
  fertilizerStrategy_fr: string;
}

export const PH_NUTRIENTS_MASTER: NutrientPhCurve[] = [
  {
    id: 'n',
    symbol: 'N',
    name: 'Nitrogen',
    name_ar: 'النيتروجين',
    name_fr: 'Azote',
    category: 'macro',
    valence: 'NO₃⁻ / NH₄⁺',
    color: '#16a34a',
    optimumPhMin: 6.0,
    optimumPhMax: 7.8,
    availableForms: 'NO₃⁻ (Nitrate), NH₄⁺ (Ammonium)',
    availableForms_ar: 'NO₃⁻ (نترات)، NH₄⁺ (أمونيوم)',
    availableForms_fr: 'NO₃⁻ (Nitrate), NH₄⁺ (Ammonium)',
    calculateAvailability: (ph: number) => {
      if (ph < 4.0) return 20;
      if (ph < 5.5) return 20 + (ph - 4.0) * 40; // 20 -> 80
      if (ph <= 7.8) return 80 + (ph - 5.5) * (20 / 2.3); // 80 -> 100 -> 98
      if (ph <= 8.8) return 98 - (ph - 7.8) * 20; // 98 -> 78
      return Math.max(40, 78 - (ph - 8.8) * 30);
    },
    lowPhBehavior: 'Nitrification bacteria (Nitrosomonas, Nitrobacter) severely inhibited below pH 5.5; mineralisation of organic N slows drastically; NH₄⁺ dominates.',
    lowPhBehavior_ar: 'تثبيط شديد لبكتيريا النترتة (النيتروزوموناس والنيتروباكتر) دون pH 5.5؛ بطء شديد في تمعدن النيتروجين العضوي وسيادة الأمونيوم.',
    lowPhBehavior_fr: 'Inhibition sévère des bactéries nitrifiantes sous pH 5.5; minéralisation ralentie; prédominance de NH₄⁺.',
    optimalPhBehavior: 'Maximum biological nitrification rate; optimal conversion of organic matter and manures into plant-available nitrate.',
    optimalPhBehavior_ar: 'أعلى معدل نترتة حيوية؛ تحويل مثالي للمادة العضوية والأسمدة إلى نترات سهلة الامتصاص.',
    optimalPhBehavior_fr: 'Activité nitrifiante optimale; conversion maximale de la matière organique en nitrates assimilables.',
    highPhBehavior: 'High risk of ammonia volatilization (NH₃ gas loss) from surface-applied urea and ammonium fertilizers when pH > 7.8.',
    highPhBehavior_ar: 'خطر مرتفع لتطاير غاز الأمونيا (NH₃) من اليوريا وأسمدة الأمونيوم عند تطبيقها السطحي في تربة ذات pH > 7.8.',
    highPhBehavior_fr: 'Risque élevé de volatilisation ammoniacale (NH₃) lors de l’épandage superficiel d’urée et d’ammonium.',
    fertilizerStrategy: 'In alkaline soils (pH > 7.5), bury urea/ammonium or use acidifying Ammonium Sulfate / MAP through drip fertigation to minimize NH₃ gas losses.',
    fertilizerStrategy_ar: 'في الأراضي القلوية (pH > 7.5)، ادمج اليوريا أو استخدم سلفات الأمونيوم و MAP عبر التسميد بالري لتقليل فقد الغاز.',
    fertilizerStrategy_fr: 'En sol alcalin, enfouir l’urée ou utiliser du sulfate d’ammonium / MAP en fertigation pour limiter la volatilisation.',
  },
  {
    id: 'p',
    symbol: 'P',
    name: 'Phosphorus',
    name_ar: 'الفسفور',
    name_fr: 'Phosphore',
    category: 'macro',
    valence: 'H₂PO₄⁻ / HPO₄²⁻',
    color: '#0284c7',
    optimumPhMin: 6.2,
    optimumPhMax: 7.2,
    availableForms: 'H₂PO₄⁻ (pH < 7.2), HPO₄²⁻ (pH > 7.2)',
    availableForms_ar: 'H₂PO₄⁻ (عند pH < 7.2)، HPO₄²⁻ (عند pH > 7.2)',
    availableForms_fr: 'H₂PO₄⁻ (pH < 7.2), HPO₄²⁻ (pH > 7.2)',
    calculateAvailability: (ph: number) => {
      if (ph < 4.0) return 15;
      if (ph < 6.2) return 15 + ((ph - 4.0) / 2.2) * 80; // 15 -> 95
      if (ph <= 7.0) return 95 + ((ph - 6.2) / 0.8) * 5; // 95 -> 100
      if (ph <= 8.5) return 100 - ((ph - 7.0) / 1.5) * 65; // 100 -> 35
      return Math.max(15, 35 - (ph - 8.5) * 20);
    },
    lowPhBehavior: 'Severely precipitated and fixed by soluble Aluminum (Al³⁺) and Iron (Fe³⁺) as insoluble Variscite [AlPO₄·2H₂O] and Strengite [FePO₄·2H₂O].',
    lowPhBehavior_ar: 'تثبيت وترسيب شديد بواسطة الألومنيوم والحديد الذائبين على هيئة فوسفات ألومنيوم وفوسفات حديد غير ذائبة.',
    lowPhBehavior_fr: 'Fixation sévère sous forme de phosphates d’aluminium et de fer insolubles (Variscite, Strengite).',
    optimalPhBehavior: 'Peak solubility! H₂PO₄⁻ is the most easily absorbed monovalent phosphate ion by plant root transporters.',
    optimalPhBehavior_ar: 'ذروة الذوبان والامتصاص! أيون H₂PO₄⁻ أحادي التكافؤ هو الأسهل امتصاصاً عبر الجذور.',
    optimalPhBehavior_fr: 'Solubilité maximale ! L’ion monovalent H₂PO₄⁻ est le plus rapidement absorbé par les racines.',
    highPhBehavior: 'Readily locked up by active Calcium (Ca²⁺) and free CaCO₃, precipitating sequentially into Dicalcium phosphate, then insoluble Tricalcium phosphate [Ca₃(PO₄)₂] and Apatites.',
    highPhBehavior_ar: 'تثبيت كيميائي قوي بفعل الكالسيوم النشط وكربونات الكالسيوم الحرة، مكوناً فوسفات ثلاثي الكالسيوم غير الذائب والأباتيت.',
    highPhBehavior_fr: 'Rétrogradation intense avec le calcium actif pour former du phosphate tricalcique insoluble [Ca₃(PO₄)₂] et des apatites.',
    fertilizerStrategy: 'In calcareous soils, inject Phosphoric Acid (H₃PO₄) or Monoammonium Phosphate (MAP 12-61-0) into drip lines, band localized P, and add Humic/Fulvic acids to shield phosphate ions from Ca bonding.',
    fertilizerStrategy_ar: 'في الأراضي الكلسية، احقن حمض الفوسفوريك أو MAP عبر شبكة التنقيط، واستخدم الأحماض الهيومية/الفولفية لحماية الفسفور من التثبيت بالكالسيوم.',
    fertilizerStrategy_fr: 'En sol calcaire, injecter de l’acide phosphorique ou du MAP en goutte-à-goutte, localiser l’apport et associer des acides humiques pour protéger le phosphate.',
  },
  {
    id: 'k',
    symbol: 'K',
    name: 'Potassium',
    name_ar: 'البوتاسيوم',
    name_fr: 'Potassium',
    category: 'macro',
    valence: 'K⁺',
    color: '#8b5cf6',
    optimumPhMin: 6.0,
    optimumPhMax: 8.2,
    availableForms: 'K⁺ (Exchangeable and solution)',
    availableForms_ar: 'K⁺ (متبادل وفي محلول التربة)',
    availableForms_fr: 'K⁺ (Échangeable et en solution)',
    calculateAvailability: (ph: number) => {
      if (ph < 4.0) return 30;
      if (ph < 6.0) return 30 + ((ph - 4.0) / 2.0) * 65; // 30 -> 95
      if (ph <= 8.2) return 95 + ((ph - 6.0) / 2.2) * 5; // 95 -> 100
      return Math.max(60, 100 - (ph - 8.2) * 25);
    },
    lowPhBehavior: 'Leaching losses on low-CEC acid soils; competitive inhibition by high Al³⁺ and H⁺ ions at root exchange sites.',
    lowPhBehavior_ar: 'فقد بالغسيل في الأراضي الحامضية منخفضة السعة التبادلية (CEC) وتنافس قوي من أيونات Al³⁺ و H⁺ على الامتصاص.',
    lowPhBehavior_fr: 'Lessivage élevé sur sols acides à faible CEC; compétition antagoniste avec Al³⁺ et H⁺.',
    optimalPhBehavior: 'Excellent retention on exchange complex and smooth diffusion towards root hairs via mass flow and diffusion.',
    optimalPhBehavior_ar: 'احتفاظ ممتاز على مجمع التبادل وانتشار سلس نحو الشعيرات الجذرية.',
    optimalPhBehavior_fr: 'Excellente rétention sur le complexe argilo-humique et diffusion optimale vers les racines.',
    highPhBehavior: 'Good chemical solubility, but massive excess of Ca²⁺ and Mg²⁺ in calcareous/saline soils can cause physiological cation antagonism against K⁺ uptake.',
    highPhBehavior_ar: 'ذوبانية كيميائية جيدة، لكن الفائض الكبير من Ca²⁺ في التربة الكلسية يسبب تنافساً كاتيونيّاً يقلل امتصاص البوتاسيوم.',
    highPhBehavior_fr: 'Bonne solubilité, mais excès de Ca²⁺ et Mg²⁺ en sol calcaire provoquant un antagonisme cationique contre K⁺.',
    fertilizerStrategy: 'Use Potassium Sulfate (SOP 0-0-50) or Potassium Nitrate; maintain balanced K/(Ca+Mg) ratio in irrigation water (ideal ratio ~ 0.05-0.10 on equivalence basis).',
    fertilizerStrategy_ar: 'استخدم سلفات البوتاسيوم (SOP) أو نترات البوتاسيوم؛ واحرص على موازنة نسبة K إلى (Ca+Mg) لتفادي التثبيط الكاتيوني.',
    fertilizerStrategy_fr: 'Privilégier le sulfate de potassium (SOP) ou nitrate de potassium; maintenir un ratio K/(Ca+Mg) équilibré.',
  },
  {
    id: 'ca',
    symbol: 'Ca',
    name: 'Calcium',
    name_ar: 'الكالسيوم',
    name_fr: 'Calcium',
    category: 'secondary',
    valence: 'Ca²⁺',
    color: '#f59e0b',
    optimumPhMin: 6.5,
    optimumPhMax: 8.5,
    availableForms: 'Ca²⁺',
    availableForms_ar: 'Ca²⁺',
    availableForms_fr: 'Ca²⁺',
    calculateAvailability: (ph: number) => {
      if (ph < 4.0) return 15;
      if (ph < 6.5) return 15 + ((ph - 4.0) / 2.5) * 80; // 15 -> 95
      if (ph <= 8.5) return 95 + ((ph - 6.5) / 2.0) * 5; // 95 -> 100
      return Math.max(65, 100 - (ph - 8.5) * 25);
    },
    lowPhBehavior: 'Severely depleted by acid leaching; low base saturation leads to structural collapse of cell walls, blossom end rot, and tip burn.',
    lowPhBehavior_ar: 'استنزاف شديد بفعل الغسيل الحامضي؛ انخفاض تشبع القواعد يسبب تدهور جدران الخلايا وظهور عفن طرف الزهرة واحتراق القمم.',
    lowPhBehavior_fr: 'Forte lixiviation en milieu acide; carence induisant nécrose apicale (cul noir) et brûlure des pointes.',
    optimalPhBehavior: 'Ideal saturation (65-75% of CEC); promotes soil flocculation, granular crumb structure, and robust root elongation.',
    optimalPhBehavior_ar: 'تشبع مثالي (65-75% من سعة التبادل CEC)؛ يدعم تجميع حبيبات التربة وتكوين بنية إسفنجية ممتازة ونمو الجذور.',
    optimalPhBehavior_fr: 'Saturation idéale (65-75% de la CEC); favorise la floculation et la structure grumeleuse du sol.',
    highPhBehavior: 'Abundant in calcareous soils, but high bicarbonate (HCO₃⁻) in soil solution can paradoxically limit active xylem transpiration transport to fruits.',
    highPhBehavior_ar: 'وفير جداً في التربة الكلسية، لكن زيادة البيكربونات (HCO₃⁻) قد تعيق انتقاله النشط في الخشب إلى الثمار سريعة النمو.',
    highPhBehavior_fr: 'Très abondant en sol calcaire; toutefois, un excès de bicarbonates peut freiner son transport xylémien vers les fruits.',
    fertilizerStrategy: 'For acidic soils, apply Agricultural Lime (CaCO₃) or Dolomite. For alkaline soils needing fruit-available Ca, apply soluble Calcium Nitrate or chelated foliar Calcium + Boron.',
    fertilizerStrategy_ar: 'للتربة الحامضية: أضف الجير الزراعي (CaCO₃) أو الدولوميت. للتربة القلوية: استخدم نترات الكالسيوم عبر الري أو رش الكالسيوم المخلبي مع البورون.',
    fertilizerStrategy_fr: 'En sol acide : chaulage au CaCO₃ ou dolomie. En sol calcaire : apport de nitrate de calcium soluble ou pulvérisation foliaire Ca + Bore.',
  },
  {
    id: 'mg',
    symbol: 'Mg',
    name: 'Magnesium',
    name_ar: 'المغنيسيوم',
    name_fr: 'Magnésium',
    category: 'secondary',
    valence: 'Mg²⁺',
    color: '#10b981',
    optimumPhMin: 6.5,
    optimumPhMax: 8.5,
    availableForms: 'Mg²⁺',
    availableForms_ar: 'Mg²⁺',
    availableForms_fr: 'Mg²⁺',
    calculateAvailability: (ph: number) => {
      if (ph < 4.0) return 20;
      if (ph < 6.5) return 20 + ((ph - 4.0) / 2.5) * 75; // 20 -> 95
      if (ph <= 8.5) return 95 + ((ph - 6.5) / 2.0) * 5;
      return Math.max(60, 100 - (ph - 8.5) * 30);
    },
    lowPhBehavior: 'Easily leached out in acid sandy soils; plant shows interveinal chlorosis on older lower leaves (central atom of chlorophyll).',
    lowPhBehavior_ar: 'ينغسل بسهولة في الأراضي الرملية الحامضية؛ تظهر أعراض الاصفرار بين العروق على الأوراق المسنة السفلية (المكون المركزي للكلوروفيل).',
    lowPhBehavior_fr: 'Lessivage rapide en sol sableux acide; chlorose internervaire marquée sur les feuilles âgées.',
    optimalPhBehavior: 'Balanced base saturation (10-15% of CEC); active photosynthesis and enzymatic phosphorylation.',
    optimalPhBehavior_ar: 'تشبع قاعدي متوازن (10-15% من CEC)؛ كفاءة عالية للبناء الضوئي وتنشيط الإنزيمات.',
    optimalPhBehavior_fr: 'Rétention idéale (10-15% de la CEC); photosynthèse et phosphorylation enzymatique optimales.',
    highPhBehavior: 'Competitively depressed by overwhelming calcium levels in high-lime soils; uptake may be reduced despite total presence.',
    highPhBehavior_ar: 'تنافس امتصاصي سلبي مع الكالسيوم الطاغي في التربة الكلسية، مما قد يسبب نقصاً فسيولوجياً رغم وفرته الكلية.',
    highPhBehavior_fr: 'Absorption freinée par l’excès de calcium en sol calcaire (antagonisme Ca/Mg).',
    fertilizerStrategy: 'In acid soils, apply Dolomitic Limestone. In alkaline/calcareous soils, use soluble Magnesium Sulfate (Kieserite / Epsom salt MgSO₄·7H₂O) or foliar Mg.',
    fertilizerStrategy_ar: 'في التربة الحامضية: أضف الجير الدولوميتي. في التربة القلوية: استخدم سلفات المغنيسيوم الذائبة (ملح إبسوم MgSO₄) أو الرش الورقي.',
    fertilizerStrategy_fr: 'En sol acide : dolomie. En sol calcaire : sulfate de magnésium (sel d’Epsom / kiesérite) en fertigation ou foliaire.',
  },
  {
    id: 's',
    symbol: 'S',
    name: 'Sulfur',
    name_ar: 'الكبريت',
    name_fr: 'Soufre',
    category: 'secondary',
    valence: 'SO₄²⁻',
    color: '#eab308',
    optimumPhMin: 6.0,
    optimumPhMax: 8.5,
    availableForms: 'SO₄²⁻ (Sulfate)',
    availableForms_ar: 'SO₄²⁻ (كبريتات)',
    availableForms_fr: 'SO₄²⁻ (Sulfate)',
    calculateAvailability: (ph: number) => {
      if (ph < 4.0) return 35;
      if (ph < 6.0) return 35 + ((ph - 4.0) / 2.0) * 60; // 35 -> 95
      if (ph <= 8.5) return 95 + ((ph - 6.0) / 2.5) * 5;
      return Math.max(70, 100 - (ph - 8.5) * 20);
    },
    lowPhBehavior: 'Adsorbed onto iron/aluminum oxides at low pH; microbial mineralization of organic sulfur drops.',
    lowPhBehavior_ar: 'يُمتص على أكاسيد الحديد والألومنيوم في درجات الحموضة المنخفضة مع بطء تمعدن الكبريت العضوي.',
    lowPhBehavior_fr: 'Adsorbé sur les oxydes de fer et d’aluminium sous pH acide; minéralisation ralentie.',
    optimalPhBehavior: 'Freely available as SO₄²⁻ anion; rapid uptake for essential amino acids (cysteine, methionine) and protein synthesis.',
    optimalPhBehavior_ar: 'متاح بحرية كأنيون كبريتات؛ امتصاص سريع لبناء الأحماض الأمينية الكبريتية والبروتينات.',
    optimalPhBehavior_fr: 'Excellente disponibilité sous forme d’anion SO₄²⁻ pour la synthèse protéique.',
    highPhBehavior: 'Remains chemically soluble, but high soil sulfates contribute to total electrical conductivity (EC).',
    highPhBehavior_ar: 'يظل ذائباً كيميائياً، لكن تراكم الكبريتات يرفع الملوحة الكلية (EC).',
    highPhBehavior_fr: 'Reste soluble mais contribue à la salinité globale (conductivité électrique).',
    fertilizerStrategy: 'Apply Ammonium Sulfate, Potassium Sulfate, or elemental sulfur (which also helps gradually acidify alkaline rhizosphere).',
    fertilizerStrategy_ar: 'استخدم سلفات الأمونيوم، سلفات البوتاسيوم، أو الكبريت الزراعي الناعم (الذي يساهم في خفض قلوية التربة).',
    fertilizerStrategy_fr: 'Apporter du sulfate d’ammonium, sulfate de potassium ou soufre élémentaire (effet acidifiant bénéfique).',
  },
  {
    id: 'fe',
    symbol: 'Fe',
    name: 'Iron',
    name_ar: 'الحديد',
    name_fr: 'Fer',
    category: 'micro',
    valence: 'Fe²⁺ / Fe³⁺',
    color: '#ef4444',
    optimumPhMin: 4.5,
    optimumPhMax: 6.5,
    availableForms: 'Fe²⁺ (Ferrous), Chelated Fe complexes',
    availableForms_ar: 'Fe²⁺ (حديدوز)، معقدات الحديد المخلبية',
    availableForms_fr: 'Fe²⁺ (Ferreux), complexes de fer chélaté',
    calculateAvailability: (ph: number) => {
      if (ph < 5.0) return 98;
      if (ph <= 6.5) return 98 - ((ph - 5.0) / 1.5) * 18; // 98 -> 80
      if (ph <= 7.5) return 80 - ((ph - 6.5) / 1.0) * 55; // 80 -> 25
      if (ph <= 8.5) return 25 - ((ph - 7.5) / 1.0) * 18; // 25 -> 7
      return Math.max(2, 7 - (ph - 8.5) * 5);
    },
    lowPhBehavior: 'Highly soluble! In waterlogged or very acidic soils (pH < 4.8), excessive Fe²⁺ can induce plant toxicity (bronzing of rice leaves).',
    lowPhBehavior_ar: 'عالي الذوبان جداً! في التربة الغدقة أو شديدة الحامضية (pH < 4.8) قد يسبب سمية الحديد وظهور التبقع البرونزي.',
    lowPhBehavior_fr: 'Très soluble; risque de toxicité ferreuse en sol très acide et gorgé d’eau.',
    optimalPhBehavior: 'Optimal equilibrium: sufficient soluble Fe²⁺ for chlorophyll catalyst activity without toxicity risk.',
    optimalPhBehavior_ar: 'توازن مثالي: توفر كافٍ لأيون Fe²⁺ لتحفيز تخليق الكلوروفيل دون خطر السمية.',
    optimalPhBehavior_fr: 'Équilibre parfait : absorption active sans risque de phytotoxicité.',
    highPhBehavior: 'CRITICAL LOCKOUT! For every 1 unit pH increase above 6.0, Fe solubility drops 1,000-fold! Precipitates as insoluble Fe(OH)₃; induces severe calcareous chlorosis (yellowing of youngest leaves).',
    highPhBehavior_ar: 'تثبيت حاد! مع كل زيادة بمقدار درجة pH واحدة فوق 6.0، تقل ذوبانية الحديد بمقدار 1,000 ضعف! يترسب كـ Fe(OH)₃ مسبباً اصفرار القمم النامية الكلسي.',
    highPhBehavior_fr: 'BLOCAGE MAJEUR ! La solubilité du fer est divisée par 1 000 par unité de pH au-dessus de 6.0. Précipite en Fe(OH)₃; provoque la chlorose ferrique sur jeunes feuilles.',
    fertilizerStrategy: 'In alkaline/calcareous soils (pH > 7.2), inorganic iron (FeSO₄) is instantly useless. You MUST use Fe-EDDHA (minimum 4.8% ortho-ortho isomer, stable up to pH 9.5) or Fe-HBED in fertigation.',
    fertilizerStrategy_ar: 'في الأراضي القلوية والكلسية (pH > 7.2)، سلفات الحديد غير مجدية في التربة. يجب حتماً استخدام شيلات الحديد Fe-EDDHA (بنسبة أورثو-أورثو لا تقل عن 4.8%) الثابتة حتى pH 9.5.',
    fertilizerStrategy_fr: 'En sol calcaire (pH > 7.2), le sulfate de fer au sol est inefficace. Utiliser impérativement du Fe-EDDHA (isomère ortho-ortho ≥ 4.8%, stable jusqu’à pH 9.5) ou Fe-HBED.',
  },
  {
    id: 'mn',
    symbol: 'Mn',
    name: 'Manganese',
    name_ar: 'المنغنيز',
    name_fr: 'Manganèse',
    category: 'micro',
    valence: 'Mn²⁺',
    color: '#d97706',
    optimumPhMin: 5.0,
    optimumPhMax: 6.5,
    availableForms: 'Mn²⁺',
    availableForms_ar: 'Mn²⁺',
    availableForms_fr: 'Mn²⁺',
    calculateAvailability: (ph: number) => {
      if (ph < 5.0) return 100;
      if (ph <= 6.5) return 100 - ((ph - 5.0) / 1.5) * 25; // 100 -> 75
      if (ph <= 7.5) return 75 - ((ph - 6.5) / 1.0) * 50; // 75 -> 25
      if (ph <= 8.5) return 25 - ((ph - 7.5) / 1.0) * 17; // 25 -> 8
      return Math.max(3, 8 - (ph - 8.5) * 5);
    },
    lowPhBehavior: 'Extreme toxicity risk below pH 5.0! Excess Mn²⁺ causes crinkled leaves, necrotic brown spots, and inhibits Ca/Mg uptake.',
    lowPhBehavior_ar: 'خطر سمية حاد دون pH 5.0! الفائض يسبب تجعد الأوراق وبقعاً نخرية بنية ويعيق امتصاص الكالسيوم والمغنيسيوم.',
    lowPhBehavior_fr: 'Risque élevé de toxicité manganique sous pH 5.0 (feuilles gaufrées, taches nécrotiques).',
    optimalPhBehavior: 'Ideal enzymatic availability for water-splitting in photosystem II and nitrogen assimilation.',
    optimalPhBehavior_ar: 'توفر إنزيمي مثالي لشطر جزيء الماء في عملية البناء الضوئي وتمثيل النيتروجين.',
    optimalPhBehavior_fr: 'Disponibilité optimale pour le système photosynthétique et l’assimilation de l’azote.',
    highPhBehavior: 'Rapidly oxidized by soil microorganisms into insoluble tetravalent oxides (MnO₂); causes speckled yellowing on young-to-middle leaves.',
    highPhBehavior_ar: 'يتأكسد سريعاً بواسطة ميكروبات التربة إلى أكاسيد رباعية غير ذائبة (MnO₂) مسبباً اصفراراً مبقعاً بين العروق.',
    highPhBehavior_fr: 'Oxydation rapide en oxydes insolubles (MnO₂); carence fréquente avec mouchetures chlorotiques.',
    fertilizerStrategy: 'In alkaline soils, apply Foliar Manganese Sulfate (MnSO₄·H₂O) or Mn-EDTA chelate; soil-applied inorganic Mn is quickly immobilized.',
    fertilizerStrategy_ar: 'في الأراضي القلوية، يفضل الرش الورقي لسلفات المنغنيز أو شيلات Mn-EDTA لتفادي تثبيته في التربة.',
    fertilizerStrategy_fr: 'En sol alcalin, privilégier les pulvérisations foliaires de sulfate de manganèse ou de Mn-EDTA chélaté.',
  },
  {
    id: 'zn',
    symbol: 'Zn',
    name: 'Zinc',
    name_ar: 'الزنك',
    name_fr: 'Zinc',
    category: 'micro',
    valence: 'Zn²⁺',
    color: '#06b6d4',
    optimumPhMin: 5.5,
    optimumPhMax: 7.0,
    availableForms: 'Zn²⁺, Zn-chelates',
    availableForms_ar: 'Zn²⁺، زنك مخلبي',
    availableForms_fr: 'Zn²⁺, chélates de zinc',
    calculateAvailability: (ph: number) => {
      if (ph < 5.0) return 95;
      if (ph <= 6.5) return 95 - ((ph - 5.0) / 1.5) * 15; // 95 -> 80
      if (ph <= 7.5) return 80 - ((ph - 6.5) / 1.0) * 45; // 80 -> 35
      if (ph <= 8.5) return 35 - ((ph - 7.5) / 1.0) * 22; // 35 -> 13
      return Math.max(5, 13 - (ph - 8.5) * 8);
    },
    lowPhBehavior: 'Readily available; susceptible to leaching in coarse acid sands with very low organic matter.',
    lowPhBehavior_ar: 'متاح بسهولة؛ معرض للغسيل في الرمال الحامضية الخشنة الفقيرة بالمادة العضوية.',
    lowPhBehavior_fr: 'Très disponible; sensible au lessivage en sables acides pauvres en humus.',
    optimalPhBehavior: 'Optimal uptake for auxin (IAA) synthesis, internode elongation, and protein metabolism.',
    optimalPhBehavior_ar: 'امتصاص مثالي لتخليق هرمون الأوكسين (IAA) واستطالة السلاميات وبناء البروتين.',
    optimalPhBehavior_fr: 'Assimilation idéale pour la synthèse de l’auxine (AIA), l’élongation des entrenœuds et le métabolisme.',
    highPhBehavior: 'Strongly chemisorbed onto calcium carbonates and clay surfaces; solubility drops 100-fold per pH unit above 7.0. Leads to "little leaf" and rosette syndrome in citrus and fruit trees.',
    highPhBehavior_ar: 'امتزاز كيميائي قوي على كربونات الكالسيوم؛ انخفاض الذوبانية 100 ضعف لكل وحدة pH فوق 7.0 مسبباً تقزم الأوراق وتورد القمم في الحمضيات والأشجار.',
    highPhBehavior_fr: 'Forte fixation sur le calcaire; induit le nanisme foliaire (« petites feuilles ») et la formation de rosettes.',
    fertilizerStrategy: 'Apply Zn-EDTA (stable up to pH 8.0) or foliar Zinc Sulfate / Zinc Oxide suspensions. Acidifying the rootzone with sulfur greatly enhances native Zn release.',
    fertilizerStrategy_ar: 'استخدم Zn-EDTA (ثابت حتى pH 8.0) أو الرش الورقي بسلفات الزنك. تحميض المحيط الجذري بالكبريت يحرر الزنك المثبت.',
    fertilizerStrategy_fr: 'Apporter du Zn-EDTA ou pulvérisations foliaires de sulfate de zinc; l’acidification locale réactive le zinc natif.',
  },
  {
    id: 'cu',
    symbol: 'Cu',
    name: 'Copper',
    name_ar: 'النحاس',
    name_fr: 'Cuivre',
    category: 'micro',
    valence: 'Cu²⁺',
    color: '#ca8a04',
    optimumPhMin: 5.5,
    optimumPhMax: 7.0,
    availableForms: 'Cu²⁺, Cu-organic complexes',
    availableForms_ar: 'Cu²⁺، معقدات نحاس عضوية',
    availableForms_fr: 'Cu²⁺, complexes cuivriques',
    calculateAvailability: (ph: number) => {
      if (ph < 5.0) return 90;
      if (ph <= 6.5) return 90 - ((ph - 5.0) / 1.5) * 10;
      if (ph <= 7.5) return 80 - ((ph - 6.5) / 1.0) * 40;
      if (ph <= 8.5) return 40 - ((ph - 7.5) / 1.0) * 22;
      return Math.max(8, 18 - (ph - 8.5) * 10);
    },
    lowPhBehavior: 'High availability; can reach phytotoxic levels in vineyards with long histories of Bordeaux mixture applications.',
    lowPhBehavior_ar: 'عالي التوفر؛ قد يصل لمستويات سامة في مزارع الكروم ذات التاريخ الطويل في استخدام مبيدات النحاس (محلول بوردو).',
    lowPhBehavior_fr: 'Forte disponibilité; risque de toxicité résiduelle (historique bouillie bordelaise).',
    optimalPhBehavior: 'Essential cofactor for plastocyanin, lignification, and pollen fertility.',
    optimalPhBehavior_ar: 'عامل مرافق أساسي للبلاستوسيانين وتخليق اللجنين وخصوبة حبوب اللقاح.',
    optimalPhBehavior_fr: 'Cofacteur enzymatique clé pour la plastocyanine, la lignification et la fertilité pollinique.',
    highPhBehavior: 'Tightly bound to organic matter and carbonates, forming insoluble copper hydroxy-carbonates.',
    highPhBehavior_ar: 'ارتباط قوي مع المادة العضوية والكربونات مكوناً مركبات هيدروكسي كربونات غير ذائبة.',
    highPhBehavior_fr: 'Liaison forte avec la matière organique et les carbonates, réduisant son absorption.',
    fertilizerStrategy: 'Apply Cu-EDTA in drip lines or foliar Copper chelate / Copper sulfate when deficient; avoid overdosing on sandy soils.',
    fertilizerStrategy_ar: 'استخدم Cu-EDTA عبر الري أو الرش الورقي المخلبي عند ظهور النقص، وتجنب الجرعات الزائدة في الأراضي الرملية.',
    fertilizerStrategy_fr: 'Apport de Cu-EDTA en fertigation ou foliaire chélaté; éviter les surdosages.',
  },
  {
    id: 'b',
    symbol: 'B',
    name: 'Boron',
    name_ar: 'البورون',
    name_fr: 'Bore',
    category: 'micro',
    valence: 'H₃BO₃ / B(OH)₄⁻',
    color: '#ec4899',
    optimumPhMin: 5.5,
    optimumPhMax: 7.2,
    availableForms: 'H₃BO₃ (Boric acid, uncharged)',
    availableForms_ar: 'H₃BO₃ (حمض البوريك غير المشحون)',
    availableForms_fr: 'H₃BO₃ (Acide borique non chargé)',
    calculateAvailability: (ph: number) => {
      if (ph < 5.0) return 90;
      if (ph <= 6.8) return 90 - ((ph - 5.0) / 1.8) * 10;
      if (ph <= 7.8) return 80 - ((ph - 6.8) / 1.0) * 35; // 80 -> 45
      if (ph <= 8.8) return 45 - ((ph - 7.8) / 1.0) * 20; // 45 -> 25
      return Math.max(10, 25 - (ph - 8.8) * 15);
    },
    lowPhBehavior: 'Exists as uncharged H₃BO₃ molecule; highly prone to leaching with rainfall or irrigation in acid sandy soils.',
    lowPhBehavior_ar: 'يتواجد كجزيء حمض بوريك غير مشحون، مما يجعله سريع الانغسال جداً مع مياه الأمطار والري في الترب الحامضية.',
    lowPhBehavior_fr: 'Molécule neutre H₃BO₃ très facilement lessivable sous fortes pluies en sol acide.',
    optimalPhBehavior: 'Optimal uptake for cell wall cross-linking (rhamnogalacturonan-II), flowering, and pollen tube growth.',
    optimalPhBehavior_ar: 'امتصاص مثالي لتكوين روابط جدران الخلايا، تحسين الإزهار، ونمو أنبوب اللقاح والعقد.',
    optimalPhBehavior_fr: 'Assimilation optimale pour la paroi cellulaire, la floraison et la germination du tube pollinique.',
    highPhBehavior: 'Converts into borate anion B(OH)₄⁻ and strongly adsorbs to CaCO₃ and clay edges; narrow window between deficiency and toxicity in arid regions.',
    highPhBehavior_ar: 'يتحول لأيون البورات B(OH)₄⁻ ويمتز بقوة على كربونات الكالسيوم؛ نافذة ضيقة جداً بين النقص والسمية في المناطق الجافة.',
    highPhBehavior_fr: 'Adsorption sur le calcaire; marge très étroite entre seuil de carence et seuil de toxicité.',
    fertilizerStrategy: 'Apply Solubor (Disodium Octaborate Tetrahydrate) or Boric Acid as targeted foliar spray before flowering (olive, citrus, tomato, sugar beet).',
    fertilizerStrategy_ar: 'استخدم سولو بور (ثنائي أوكتابورات الصوديوم) أو حمض البوريك رشاً ورقياً موجهاً قبل مرحلة الإزهار (الزيتون، الحمضيات، الطماطم، البنجر).',
    fertilizerStrategy_fr: 'Pulvérisation foliaire de Solubor ou d’acide borique ciblée avant floraison.',
  },
  {
    id: 'mo',
    symbol: 'Mo',
    name: 'Molybdenum',
    name_ar: 'الموليبدينوم',
    name_fr: 'Molybdène',
    category: 'micro',
    valence: 'MoO₄²⁻',
    color: '#6366f1',
    optimumPhMin: 6.5,
    optimumPhMax: 8.8,
    availableForms: 'MoO₄²⁻ (Molybdate)',
    availableForms_ar: 'MoO₄²⁻ (موليبدات)',
    availableForms_fr: 'MoO₄²⁻ (Molybdate)',
    calculateAvailability: (ph: number) => {
      // UNIQUE EXCEPTION: Mo availability INCREASES with pH!
      if (ph < 4.5) return 10;
      if (ph <= 6.0) return 10 + ((ph - 4.5) / 1.5) * 55; // 10 -> 65
      if (ph <= 7.5) return 65 + ((ph - 6.0) / 1.5) * 30; // 65 -> 95
      return 100;
    },
    lowPhBehavior: 'SEVERE LOCKOUT IN ACID SOILS! Uniquely among micronutrients, Mo becomes highly insoluble in acid conditions due to tight adsorption on iron/aluminum oxides. Cripples Rhizobium N-fixation in legumes and induces "whiptail" in cauliflower/brassicas.',
    lowPhBehavior_ar: 'تثبيت حاد في الأراضي الحامضية! على عكس العناصر الصغرى، تقل ذوبانية الموليبدينوم جداً في الحموضة بسبب ارتباطه بأكاسيد الحديد، مما يوقف العقد الجذرية المثبتة للنيتروجين في البقوليات ويسبب ذيل السوط في القرنبيط.',
    lowPhBehavior_fr: 'EXCEPTION UNIQUE : Très insoluble en sol acide ! Bloque la fixation symbiotique de l’azote chez les légumineuses et provoque le « whiptail » (feuilles en lanières) des choux.',
    optimalPhBehavior: 'Highly soluble as molybdate MoO₄²⁻; essential cofactor for nitrogenase (N₂ fixation) and nitrate reductase enzymes.',
    optimalPhBehavior_ar: 'عالي الذوبان كأيون موليبدات؛ عامل مرافق أساسي لإنزيم النيتروجينيز (تثبيت N₂) وإنزيم نترات ريدكتاز.',
    optimalPhBehavior_fr: 'Solubilité élevée sous forme MoO₄²⁻; indispensable à la nitrate réductase et à la nitrogénase.',
    highPhBehavior: 'Maximum solubility! Liming acid soils is the classic remedy to release native soil molybdenum.',
    highPhBehavior_ar: 'أعلى ذوبانية وتوفر! إضافة الجير للتربة الحامضية هي العلاج الأنجع لتحرير الموليبدينوم الذاتي في التربة.',
    highPhBehavior_fr: 'Solubilité maximale; le chaulage est le moyen classique de libérer le molybdène bloqué.',
    fertilizerStrategy: 'In acid soils, apply Agricultural Lime to unlock native Mo, or apply Sodium Molybdate (Na₂MoO₄·2H₂O) as seed treatment or foliar spray for legumes and brassicas.',
    fertilizerStrategy_ar: 'في التربة الحامضية: أضف الجير لتحرير الموليبدينوم، أو استخدم موليبدات الصوديوم لمعاملة البذور أو الرش الورقي للبقوليات والصلبيات.',
    fertilizerStrategy_fr: 'En sol acide : chauler pour libérer le Mo natif, ou appliquer du molybdate de sodium en traitement de semences / foliaire.',
  },
  {
    id: 'al_tox',
    symbol: 'Al³⁺',
    name: 'Aluminum Toxicity',
    name_ar: 'سمية الألومنيوم',
    name_fr: 'Toxicité aluminique',
    category: 'toxicity',
    valence: 'Al³⁺ / Al(OH)²⁺',
    color: '#991b1b',
    optimumPhMin: 5.5,
    optimumPhMax: 9.0,
    availableForms: 'Soluble toxic Al³⁺ (pH < 5.2)',
    availableForms_ar: 'أيونات Al³⁺ السامة الذائبة (عند pH < 5.2)',
    availableForms_fr: 'Al³⁺ soluble toxique (pH < 5.2)',
    calculateAvailability: (ph: number) => {
      // Represents toxicity risk level (100 = dangerous toxicity, 0 = safe)
      if (ph >= 5.5) return 0;
      if (ph >= 5.0) return (5.5 - ph) * 60; // 0 -> 30
      if (ph >= 4.5) return 30 + (5.0 - ph) * 80; // 30 -> 70
      return Math.min(100, 70 + (4.5 - ph) * 60);
    },
    lowPhBehavior: 'DISASTROUS ROOT DESTRUCTION! Below pH 5.0, structural octahedral Al dissolves into monomeric Al³⁺, which halts root cell division within hours, causing stubby, swollen, club-like roots unable to absorb water or nutrients.',
    lowPhBehavior_ar: 'تدمير كارثي للجذور! دون pH 5.0، يذوب الألومنيوم ويوقف انقسام خلايا القمم النامية للجذور خلال ساعات مسبباً جذوراً متضخمة وقصيرة عاجزة عن امتصاص الماء والغذاء.',
    lowPhBehavior_fr: 'DESTRUCTION RACINAIRE ! Sous pH 5.0, Al³⁺ bloque la division cellulaire des apex racinaires : racines courtes, épaissies, incapables d’absorber l’eau.',
    optimalPhBehavior: 'Precipitated safely as non-toxic solid gibbsite Al(OH)₃; zero root injury.',
    optimalPhBehavior_ar: 'يترسب بأمان على هيئة هيدروكسيد ألومنيوم صلب غير سام Al(OH)₃؛ سلامة كاملة للجذور.',
    optimalPhBehavior_fr: 'Totalement précipité sous forme d’hydroxyde d’aluminium inoffensif Al(OH)₃.',
    highPhBehavior: 'Non-toxic, safe solid minerals.',
    highPhBehavior_ar: 'آمن ومترسب تماماً.',
    highPhBehavior_fr: 'Inerte et non toxique.',
    fertilizerStrategy: 'MANDATORY LIMING! Apply Calcium Carbonate (CaCO₃) or Dolomitic Lime immediately to raise soil pH above 5.5 and neutralize exchangeable Al³⁺.',
    fertilizerStrategy_ar: 'إضافة الجير إجبارية! طبق الجير الزراعي (CaCO₃) أو الدولوميت فوراً لرفع pH التربة فوق 5.5 ومعادلة سمية الألومنيوم.',
    fertilizerStrategy_fr: 'CHAULAGE OBLIGATOIRE ! Apporter de la chaux agricole (CaCO₃) pour élever le pH au-dessus de 5.5 et neutraliser Al³⁺.',
  },
];

export interface CropPhSpec {
  id: string;
  name: string;
  name_ar: string;
  name_fr: string;
  scientificName: string;
  category: 'cereals' | 'vegetables' | 'fruits_orchard' | 'legumes_forages' | 'industrial';
  optimumPhMin: number;
  optimumPhMax: number;
  toleratedPhMin: number;
  toleratedPhMax: number;
  calcareousTolerance: 'high' | 'very_high' | 'medium' | 'low';
  aciditySensitivity: 'high' | 'very_high' | 'medium' | 'low';
  salinitySensitivity: 'sensitive' | 'moderately_sensitive' | 'moderately_tolerant' | 'tolerant';
  typicalDeficienciesAtHighPh: string[];
  typicalRisksAtLowPh: string[];
  iconEmoji: string;
  notes: string;
  notes_ar: string;
  notes_fr: string;
}

export const CROPS_PH_DATABASE: CropPhSpec[] = [
  // Cereals & Grains
  {
    id: 'durum_wheat',
    name: 'Durum Wheat (Blé dur)',
    name_ar: 'القمح الصلب',
    name_fr: 'Blé dur',
    scientificName: 'Triticum durum',
    category: 'cereals',
    optimumPhMin: 6.2,
    optimumPhMax: 7.8,
    toleratedPhMin: 5.5,
    toleratedPhMax: 8.5,
    calcareousTolerance: 'very_high',
    aciditySensitivity: 'high',
    salinitySensitivity: 'moderately_tolerant',
    typicalDeficienciesAtHighPh: ['fe', 'zn', 'p'],
    typicalRisksAtLowPh: ['al_tox', 'p_fixation'],
    iconEmoji: '🌾',
    notes: 'Well adapted to Mediterranean calcareous soils. Sensitive to Al³⁺ toxicity below pH 5.5. On high-lime soils, seed-dressing or foliar Zn is highly responsive.',
    notes_ar: 'متأقلم جداً مع الأراضي الكلسية المتوسطية. حساس لسمية الألومنيوم دون pH 5.5. يستجيب بقوة لمعاملة البذور أو الرش بالزنك في الأراضي الكلسية.',
    notes_fr: 'Très adapté aux sols calcaires méditerranéens. Sensible à la toxicité aluminique sous pH 5.5. Fortement réceptif aux apports de zinc.',
  },
  {
    id: 'bread_wheat',
    name: 'Bread Wheat (Blé tendre)',
    name_ar: 'القمح اللين',
    name_fr: 'Blé tendre',
    scientificName: 'Triticum aestivum',
    category: 'cereals',
    optimumPhMin: 6.0,
    optimumPhMax: 7.5,
    toleratedPhMin: 5.4,
    toleratedPhMax: 8.4,
    calcareousTolerance: 'high',
    aciditySensitivity: 'medium',
    salinitySensitivity: 'moderately_tolerant',
    typicalDeficienciesAtHighPh: ['zn', 'mn', 'p'],
    typicalRisksAtLowPh: ['al_tox', 'mg_deficiency'],
    iconEmoji: '🌾',
    notes: 'Slightly more acid-tolerant than durum wheat, but optimum grain yield and protein content require pH 6.2-7.5.',
    notes_ar: 'أكثر تحملاً للحموضة قليلاً من القمح الصلب، لكن الإنتاجية المثالية ونسبة البروتين تتطلب pH بين 6.2 و 7.5.',
    notes_fr: 'Légèrement plus tolérant à l’acidité que le blé dur; rendement et protéines optimaux entre 6.2 et 7.5.',
  },
  {
    id: 'barley',
    name: 'Barley (Orge)',
    name_ar: 'الشعير',
    name_fr: 'Orge',
    scientificName: 'Hordeum vulgare',
    category: 'cereals',
    optimumPhMin: 6.5,
    optimumPhMax: 8.2,
    toleratedPhMin: 5.8,
    toleratedPhMax: 8.8,
    calcareousTolerance: 'very_high',
    aciditySensitivity: 'very_high',
    salinitySensitivity: 'tolerant',
    typicalDeficienciesAtHighPh: ['zn', 'fe'],
    typicalRisksAtLowPh: ['al_tox', 'root_stunting'],
    iconEmoji: '🌾',
    notes: 'Champion of alkaline & saline tolerance, but EXTREMELY intolerant of acid soils (yield collapses below pH 6.0 due to extreme Al sensitivity).',
    notes_ar: 'بطل تحمل القلوية والملوحة، ولكنه شديد الحساسية للحموضة (ينهار المحصول دون pH 6.0 لحساسيته الفائقة للألومنيوم).',
    notes_fr: 'Champion de la tolérance au calcaire et à la salinité, mais TRÈS intolérant aux sols acides (effondrement sous pH 6.0).',
  },
  {
    id: 'corn_maize',
    name: 'Corn / Maize (Maïs)',
    name_ar: 'الذرة الصفراء',
    name_fr: 'Maïs',
    scientificName: 'Zea mays',
    category: 'cereals',
    optimumPhMin: 5.8,
    optimumPhMax: 7.0,
    toleratedPhMin: 5.2,
    toleratedPhMax: 7.8,
    calcareousTolerance: 'medium',
    aciditySensitivity: 'medium',
    salinitySensitivity: 'moderately_sensitive',
    typicalDeficienciesAtHighPh: ['zn', 'p', 'fe'],
    typicalRisksAtLowPh: ['p_fixation', 'mg_deficiency'],
    iconEmoji: '🌽',
    notes: 'Very high demand for starter P and early Zn. In soils with pH > 7.4, banded zinc sulfate or Zn-EDTA prevents white bud syndrome.',
    notes_ar: 'احتياج كبير للفسفور والزنك في مرحلة البادرة. في التربة ذات pH > 7.4، يؤدي التسميد الموضعي بالزنك لتفادي مرض البرعم الأبيض.',
    notes_fr: 'Besoin élevé en P de démarrage et Zn précoce. Au-delà de pH 7.4, apporter du zinc pour éviter la chlorose internervaire.',
  },

  // Vegetables
  {
    id: 'tomato',
    name: 'Tomato (Tomate)',
    name_ar: 'الطماطم',
    name_fr: 'Tomate',
    scientificName: 'Solanum lycopersicum',
    category: 'vegetables',
    optimumPhMin: 6.0,
    optimumPhMax: 6.8,
    toleratedPhMin: 5.5,
    toleratedPhMax: 7.8,
    calcareousTolerance: 'medium',
    aciditySensitivity: 'medium',
    salinitySensitivity: 'moderately_sensitive',
    typicalDeficienciesAtHighPh: ['fe', 'p', 'b', 'zn'],
    typicalRisksAtLowPh: ['ca_deficiency', 'blossom_end_rot', 'mg_deficiency'],
    iconEmoji: '🍅',
    notes: 'Prone to blossom end rot when Ca uptake is restricted. At pH > 7.5, requires Fe-EDDHA and phosphoric acid in drip fertigation for high yield.',
    notes_ar: 'معرضة لعفن طرف الزهرة عند نقص الكالسيوم. عند pH > 7.5 تتطلب حقن Fe-EDDHA وحمض الفوسفوريك بالتنقيط لإنتاجية عالية.',
    notes_fr: 'Sensible à la nécrose apicale en cas de déficit en Ca. Au-dessus de 7.5, injection indispensable de Fe-EDDHA et acide phosphorique.',
  },
  {
    id: 'potato',
    name: 'Potato (Pomme de terre)',
    name_ar: 'البطاطا',
    name_fr: 'Pomme de terre',
    scientificName: 'Solanum tuberosum',
    category: 'vegetables',
    optimumPhMin: 5.2,
    optimumPhMax: 6.4,
    toleratedPhMin: 4.8,
    toleratedPhMax: 7.5,
    calcareousTolerance: 'low',
    aciditySensitivity: 'low',
    salinitySensitivity: 'moderately_sensitive',
    typicalDeficienciesAtHighPh: ['p', 'fe', 'mn', 'scab_disease'],
    typicalRisksAtLowPh: ['ca_deficiency_hollow_heart'],
    iconEmoji: '🥔',
    notes: 'Prefers slightly acid soil (pH 5.2-6.2) to suppress Common Scab (Streptomyces scabies). Liming above 6.5 triggers high scab severity.',
    notes_ar: 'تفضل التربة الحامضية الخفيفة (pH 5.2-6.2) لتثبيط مرض الجرب العادي (الستربتومايسس). رفع الحموضة فوق 6.5 يزيد الجرب بشدة.',
    notes_fr: 'Préfère un sol modérément acide (5.2-6.2) pour limiter la gale commune (Streptomyces scabies).',
  },
  {
    id: 'pepper',
    name: 'Bell Pepper / Chilli (Poivron / Piment)',
    name_ar: 'الفلفل / الحار',
    name_fr: 'Poivron / Piment',
    scientificName: 'Capsicum annuum',
    category: 'vegetables',
    optimumPhMin: 6.0,
    optimumPhMax: 6.8,
    toleratedPhMin: 5.5,
    toleratedPhMax: 7.5,
    calcareousTolerance: 'medium',
    aciditySensitivity: 'medium',
    salinitySensitivity: 'sensitive',
    typicalDeficienciesAtHighPh: ['fe', 'p', 'b'],
    typicalRisksAtLowPh: ['ca_deficiency_blossom_end_rot'],
    iconEmoji: '🫑',
    notes: 'Sensitive to salinity and high bicarbonate in irrigation water. Maintain rootzone pH ~6.0-6.5 using nitric/phosphoric acid.',
    notes_ar: 'حساس للملوحة والبيكربونات في مياه الري. يفضل الحفاظ على pH المحيط الجذري بين 6.0 و 6.5 باستخدام أحماض التسميد.',
    notes_fr: 'Sensible à la salinité et aux bicarbonates; maintenir le pH racinaire autour de 6.0-6.5.',
  },
  {
    id: 'onion_garlic',
    name: 'Onion & Garlic (Oignon & Ail)',
    name_ar: 'البصل والثوم',
    name_fr: 'Oignon & Ail',
    scientificName: 'Allium cepa / sativum',
    category: 'vegetables',
    optimumPhMin: 6.2,
    optimumPhMax: 7.0,
    toleratedPhMin: 5.8,
    toleratedPhMax: 7.8,
    calcareousTolerance: 'medium',
    aciditySensitivity: 'high',
    salinitySensitivity: 'sensitive',
    typicalDeficienciesAtHighPh: ['p', 'mn', 'zn'],
    typicalRisksAtLowPh: ['al_tox', 'poor_bulb_formation'],
    iconEmoji: '🧅',
    notes: 'Shallow root system requires high phosphate availability and good soil structure. Sensitive to acidity below pH 6.0.',
    notes_ar: 'المجموع الجذري السطحي يحتاج توفراً ممتازاً للفسفور وبنية تربة جيدة. حساس للحموضة دون pH 6.0.',
    notes_fr: 'Système racinaire superficiel exigeant en phosphore disponible; sensible à l’acidité sous pH 6.0.',
  },
  {
    id: 'cucumber_squash',
    name: 'Cucumber & Squash (Concombre & Courgette)',
    name_ar: 'الخيار والكوسة',
    name_fr: 'Concombre & Courgette',
    scientificName: 'Cucumis sativus / Cucurbita',
    category: 'vegetables',
    optimumPhMin: 6.0,
    optimumPhMax: 7.0,
    toleratedPhMin: 5.5,
    toleratedPhMax: 7.6,
    calcareousTolerance: 'medium',
    aciditySensitivity: 'medium',
    salinitySensitivity: 'moderately_sensitive',
    typicalDeficienciesAtHighPh: ['fe', 'mn', 'p'],
    typicalRisksAtLowPh: ['ca_deficiency', 'mg_deficiency'],
    iconEmoji: '🥒',
    notes: 'Fast-growing; rapidly develops interveinal chlorosis if Fe or Mn availability is impaired in alkaline greenhouse soils.',
    notes_ar: 'نمو سريع؛ يظهر اصفراراً سريعاً بين العروق عند نقص الحديد أو المنغنيز في التربة القلوية المحمية.',
    notes_fr: 'Croissance rapide; développe rapidement des chloroses si le fer ou manganèse est bloqué.',
  },
  {
    id: 'watermelon_melon',
    name: 'Watermelon & Melon (Pastèque & Melon)',
    name_ar: 'البطيخ والشمام',
    name_fr: 'Pastèque & Melon',
    scientificName: 'Citrullus lanatus / Cucumis melo',
    category: 'vegetables',
    optimumPhMin: 6.0,
    optimumPhMax: 7.2,
    toleratedPhMin: 5.5,
    toleratedPhMax: 8.0,
    calcareousTolerance: 'high',
    aciditySensitivity: 'medium',
    salinitySensitivity: 'moderately_tolerant',
    typicalDeficienciesAtHighPh: ['fe', 'zn', 'b'],
    typicalRisksAtLowPh: ['blossom_end_rot', 'p_fixation'],
    iconEmoji: '🍉',
    notes: 'Melon tolerates alkaline conditions well; watermelon prefers slightly more neutral-to-acidic pH for maximum brix/sweetness.',
    notes_ar: 'الشمام يتحمل القلوية جيداً؛ بينما يفضل البطيخ الأحمر pH أقرب للاعتدال لزيادة نسبة السكر (Brix).',
    notes_fr: 'Le melon tolère bien le calcaire; la pastèque préfère un sol plus neutre pour maximiser le taux de sucre.',
  },

  // Orchards & Fruit Trees
  {
    id: 'olive',
    name: 'Olive Tree (Olivier)',
    name_ar: 'الزيتون',
    name_fr: 'Olivier',
    scientificName: 'Olea europaea',
    category: 'fruits_orchard',
    optimumPhMin: 6.5,
    optimumPhMax: 8.2,
    toleratedPhMin: 5.5,
    toleratedPhMax: 8.6,
    calcareousTolerance: 'very_high',
    aciditySensitivity: 'medium',
    salinitySensitivity: 'tolerant',
    typicalDeficienciesAtHighPh: ['b', 'fe', 'k'],
    typicalRisksAtLowPh: ['ca_deficiency'],
    iconEmoji: '🫒',
    notes: 'Mediterranean flagship tree! Highly tolerant to active limestone and alkaline soils. Boron is the most critical micronutrient (shot-berry prevention).',
    notes_ar: 'رمز الزراعة المتوسطية! يتحمل الكلس النشط والقلوية باقتدار. البورون هو العنصر الأصغر الأكثر أهمية لتفادي تساقط الثمار وتشوهها.',
    notes_fr: 'Arbre emblématique méditerranéen ! Très tolérant au calcaire actif. Le bore est l’oligo-élément clé.',
  },
  {
    id: 'date_palm',
    name: 'Date Palm (Palmier Dattier)',
    name_ar: 'النخيل',
    name_fr: 'Palmier Dattier',
    scientificName: 'Phoenix dactylifera',
    category: 'fruits_orchard',
    optimumPhMin: 6.5,
    optimumPhMax: 8.5,
    toleratedPhMin: 5.5,
    toleratedPhMax: 9.2,
    calcareousTolerance: 'very_high',
    aciditySensitivity: 'low',
    salinitySensitivity: 'tolerant',
    typicalDeficienciesAtHighPh: ['k', 'fe', 'mn'],
    typicalRisksAtLowPh: ['none_common'],
    iconEmoji: '🌴',
    notes: 'Phenomenal resilience to alkaline, calcareous, and saline oasis soils. Responds well to organic manure and potassium sulfate for Deglet Nour quality.',
    notes_ar: 'قدرة استثنائية على تحمل الأراضي القلوية والكلسية والمالحة بالواحات. يستجيب بقوة للتسميد العضوي وسلفات البوتاسيوم لجودة دقلة نور.',
    notes_fr: 'Résistance exceptionnelle aux sols alcalins et salins d’oasis. Fortement valorisé par le fumier et le potassium.',
  },
  {
    id: 'citrus',
    name: 'Citrus (Orange, Lemon, Clementine)',
    name_ar: 'الحمضيات (برتقال، ليمون، كليمانتين)',
    name_fr: 'Agrumes (Oranger, Citronnier, Clémentinier)',
    scientificName: 'Citrus spp.',
    category: 'fruits_orchard',
    optimumPhMin: 6.0,
    optimumPhMax: 7.0,
    toleratedPhMin: 5.5,
    toleratedPhMax: 8.0,
    calcareousTolerance: 'medium',
    aciditySensitivity: 'medium',
    salinitySensitivity: 'sensitive',
    typicalDeficienciesAtHighPh: ['fe', 'zn', 'mn', 'p'],
    typicalRisksAtLowPh: ['al_tox', 'cu_toxicity'],
    iconEmoji: '🍊',
    notes: 'Rootstock choice is decisive! Sour orange (Bigaradier) tolerates calcareous soil (up to 12-14% active lime), while Carrizo/Troyer citrange suffers severe iron chlorosis above pH 7.5.',
    notes_ar: 'نوع الأصل حاسم جداً! أصل النارنج (الخشخاش) يتحمل حتى 12-14% كلس نشط، بينما يعاني أصل الكاريزو من اصفرار حديدي حاد فوق pH 7.5.',
    notes_fr: 'Choix du porte-greffe déterminant ! Le Bigaradier tolère le calcaire actif, tandis que le Citrange Carrizo subit de fortes chloroses.',
  },
  {
    id: 'grapevine',
    name: 'Grapevine (Vigne)',
    name_ar: 'الكرمة (العنب)',
    name_fr: 'Vigne',
    scientificName: 'Vitis vinifera',
    category: 'fruits_orchard',
    optimumPhMin: 6.0,
    optimumPhMax: 7.5,
    toleratedPhMin: 5.5,
    toleratedPhMax: 8.4,
    calcareousTolerance: 'high',
    aciditySensitivity: 'medium',
    salinitySensitivity: 'moderately_sensitive',
    typicalDeficienciesAtHighPh: ['fe', 'mg', 'b'],
    typicalRisksAtLowPh: ['p_fixation', 'al_tox'],
    iconEmoji: '🍇',
    notes: 'Select lime-tolerant rootstocks (140 Ruggeri, 110 Richter, Fercal) for soils with high active CaCO₃ (IPC > 40).',
    notes_ar: 'اختر أصولاً مقاومة للكلس (مثل 140 Ruggeri و 110 Richter و Fercal) في الأراضي ذات الكلس النشط المرتفع.',
    notes_fr: 'Choisir des porte-greffes résistants au calcaire (140 Ru, 110 R, Fercal) en sol à fort calcaire actif.',
  },
  {
    id: 'apple_pear',
    name: 'Apple & Pear (Pommier & Poirier)',
    name_ar: 'التفاح والكمثرى',
    name_fr: 'Pommier & Poirier',
    scientificName: 'Malus domestica / Pyrus',
    category: 'fruits_orchard',
    optimumPhMin: 6.0,
    optimumPhMax: 6.8,
    toleratedPhMin: 5.5,
    toleratedPhMax: 7.8,
    calcareousTolerance: 'medium',
    aciditySensitivity: 'medium',
    salinitySensitivity: 'sensitive',
    typicalDeficienciesAtHighPh: ['fe', 'zn', 'b', 'mn'],
    typicalRisksAtLowPh: ['ca_deficiency_bitter_pit'],
    iconEmoji: '🍎',
    notes: 'Requires adequate Ca for bitter pit prevention. High pH induces iron chlorosis, especially on quince (Cognassier) pear rootstocks.',
    notes_ar: 'يحتاج كفايته من الكالسيوم لتفادي التبقع المر في التفاح. الـ pH المرتفع يسبب اصفراراً حديدياً خاصة على أصول السفرجل للكمثرى.',
    notes_fr: 'Exigence en calcium pour éviter le bitter pit. Risque de chlorose ferrique sur porte-greffe cognassier.',
  },
  {
    id: 'strawberry',
    name: 'Strawberry (Fraisier)',
    name_ar: 'الفراولة',
    name_fr: 'Fraisier',
    scientificName: 'Fragaria × ananassa',
    category: 'fruits_orchard',
    optimumPhMin: 5.5,
    optimumPhMax: 6.5,
    toleratedPhMin: 5.0,
    toleratedPhMax: 7.2,
    calcareousTolerance: 'low',
    aciditySensitivity: 'low',
    salinitySensitivity: 'sensitive',
    typicalDeficienciesAtHighPh: ['fe', 'mn', 'p'],
    typicalRisksAtLowPh: ['ca_deficiency_tipburn'],
    iconEmoji: '🍓',
    notes: 'Acidophilic tendencies; very sensitive to salinity and high bicarbonate in substrate/soil. Fe-DTPA or Fe-EDDHA essential if pH > 6.8.',
    notes_ar: 'تميل للوسط الحامضي؛ حساسة جداً للملوحة والبيكربونات. إضافة الحديد المخلبي ضرورية إذا تجاوز pH 6.8.',
    notes_fr: 'Tendances acidophiles; très sensible à la salinité et aux bicarbonates.',
  },
  {
    id: 'blueberry',
    name: 'Blueberry (Myrtille)',
    name_ar: 'التوت الأزرق (بلوبيري)',
    name_fr: 'Myrtille',
    scientificName: 'Vaccinium corymbosum',
    category: 'fruits_orchard',
    optimumPhMin: 4.5,
    optimumPhMax: 5.2,
    toleratedPhMin: 4.0,
    toleratedPhMax: 5.8,
    calcareousTolerance: 'low',
    aciditySensitivity: 'low',
    salinitySensitivity: 'sensitive',
    typicalDeficienciesAtHighPh: ['fe', 'mn', 'p', 'severe_stunting'],
    typicalRisksAtLowPh: ['none'],
    iconEmoji: '🫐',
    notes: 'STRICT ACIDOPHILE! Cannot absorb nitrate or iron above pH 5.5. Requires elemental sulfur, peat moss, or acid fertigation with ammonium sulfate.',
    notes_ar: 'نبات حامضي بامتياز! يعجز عن امتصاص الحديد والنيتروجين فوق pH 5.5. يتطلب الكبريت الزراعي والبيت موس والتسميد بسلفات الأمونيوم.',
    notes_fr: 'ACIDOPHILE STRICT ! Incapable d’absorber le fer au-dessus de pH 5.5. Nécessite tourbe acide, soufre et sulfate d’ammonium.',
  },

  // Legumes & Forages
  {
    id: 'alfalfa',
    name: 'Alfalfa / Lucerne (Luzerne)',
    name_ar: 'البرسيم الحجازي (الفصة)',
    name_fr: 'Luzerne',
    scientificName: 'Medicago sativa',
    category: 'legumes_forages',
    optimumPhMin: 6.5,
    optimumPhMax: 7.5,
    toleratedPhMin: 6.0,
    toleratedPhMax: 8.2,
    calcareousTolerance: 'very_high',
    aciditySensitivity: 'very_high',
    salinitySensitivity: 'moderately_tolerant',
    typicalDeficienciesAtHighPh: ['p', 'b', 'k'],
    typicalRisksAtLowPh: ['rhizobium_failure', 'mo_deficiency', 'al_tox'],
    iconEmoji: '🌿',
    notes: 'Extremely demanding for Calcium and high pH! Below pH 6.2, Rhizobium meliloti nodulation collapses, stopping biological N₂ fixation. High Boron and Potassium demand for high protein forage.',
    notes_ar: 'شديدة الاحتياج للكالسيوم والـ pH المرتفع! دون pH 6.2 تفشل بكتيريا العقد الجذرية (الريزوبيوم) في تثبيت النيتروجين. تحتاج البورون والبوتاسيوم.',
    notes_fr: 'Très exigeante en calcium et pH élevé ! Sous 6.2, la nodulation par Rhizobium s’effondre. Exigeante en Bore et Potassium.',
  },
  {
    id: 'chickpea',
    name: 'Chickpea (Pois chiche)',
    name_ar: 'الحمص',
    name_fr: 'Pois chiche',
    scientificName: 'Cicer arietinum',
    category: 'legumes_forages',
    optimumPhMin: 6.5,
    optimumPhMax: 8.0,
    toleratedPhMin: 6.0,
    toleratedPhMax: 8.5,
    calcareousTolerance: 'very_high',
    aciditySensitivity: 'high',
    salinitySensitivity: 'moderately_sensitive',
    typicalDeficienciesAtHighPh: ['fe', 'p', 'zn'],
    typicalRisksAtLowPh: ['rhizobium_failure', 'al_tox'],
    iconEmoji: '🧆',
    notes: 'Thrives in Mediterranean calcareous clay-loams. Secretes malic and citric acids from roots to solubilize soil calcium phosphate.',
    notes_ar: 'يزدهر في الترب الطينية الكلسية المتوسطية. يفرز جذرياً أحماض الماليك والستريك لإذابة فوسفات الكالسيوم الذاتي.',
    notes_fr: 'Très bien adapté aux sols calcaires méditerranéens; sécrète des acides organiques pour dissoudre le phosphate natif.',
  },
  {
    id: 'lentil',
    name: 'Lentil (Lentille)',
    name_ar: 'العدس',
    name_fr: 'Lentille',
    scientificName: 'Lens culinaris',
    category: 'legumes_forages',
    optimumPhMin: 6.0,
    optimumPhMax: 7.8,
    toleratedPhMin: 5.6,
    toleratedPhMax: 8.2,
    calcareousTolerance: 'high',
    aciditySensitivity: 'medium',
    salinitySensitivity: 'sensitive',
    typicalDeficienciesAtHighPh: ['fe', 'p', 'zn'],
    typicalRisksAtLowPh: ['nodulation_failure'],
    iconEmoji: '🍲',
    notes: 'Tolerates alkaline soils well; sensitive to waterlogging and salinity.',
    notes_ar: 'يتحمل الأراضي القلوية جيداً؛ حساس للغدق والملوحة.',
    notes_fr: 'Bonne tolérance aux sols calcaires; sensible à l’excès d’eau et à la salinité.',
  },

  // Industrial & Special
  {
    id: 'sugar_beet',
    name: 'Sugar Beet (Betterave sucrière)',
    name_ar: 'البنجر السكري',
    name_fr: 'Betterave sucrière',
    scientificName: 'Beta vulgaris',
    category: 'industrial',
    optimumPhMin: 6.5,
    optimumPhMax: 8.0,
    toleratedPhMin: 6.0,
    toleratedPhMax: 8.6,
    calcareousTolerance: 'very_high',
    aciditySensitivity: 'very_high',
    salinitySensitivity: 'tolerant',
    typicalDeficienciesAtHighPh: ['b_heart_rot', 'mn', 'p'],
    typicalRisksAtLowPh: ['al_tox', 'seedling_blight'],
    iconEmoji: '🪴',
    notes: 'Outstanding tolerance to salinity and alkalinity, but extremely sensitive to acidity (seedlings die below pH 6.0). Boron deficiency causes Heart Rot.',
    notes_ar: 'تحمل ممتاز للملوحة والقلوية، وحساسية شديدة للحموضة (موت البادرات دون pH 6.0). نقص البورون يسبب مرض موت القلب الأسود.',
    notes_fr: 'Excellente tolérance au calcaire et à la salinité; très sensible à l’acidité. Carence en bore responsable du pourridié du cœur.',
  },
];

/** Soil Texture types for amendment requirement calculation */
export type SoilTextureType = 'sand' | 'sandy_loam' | 'loam' | 'clay_loam' | 'clay';

export interface SoilTextureInfo {
  id: SoilTextureType;
  name: string;
  name_ar: string;
  name_fr: string;
  /** kg Elemental Sulfur (S0) needed to lower pH by 1.0 unit per ha (plow depth ~20cm) */
  sulfurPerUnitDropKgHa: number;
  /** kg Pure CaCO3 (Lime CCE 100%) needed to raise pH by 1.0 unit per ha */
  limePerUnitRiseKgHa: number;
  bufferingCapacity: 'low' | 'medium' | 'high' | 'very_high';
}

export const SOIL_TEXTURE_DATA: Record<SoilTextureType, SoilTextureInfo> = {
  sand: {
    id: 'sand',
    name: 'Sandy (Sableuse)',
    name_ar: 'رملية (خفيفة)',
    name_fr: 'Sableuse',
    sulfurPerUnitDropKgHa: 350,
    limePerUnitRiseKgHa: 800,
    bufferingCapacity: 'low',
  },
  sandy_loam: {
    id: 'sandy_loam',
    name: 'Sandy Loam (Limono-sableuse)',
    name_ar: 'طميية رملية',
    name_fr: 'Limono-sableuse',
    sulfurPerUnitDropKgHa: 600,
    limePerUnitRiseKgHa: 1400,
    bufferingCapacity: 'medium',
  },
  loam: {
    id: 'loam',
    name: 'Loam (Franche / Limoneuse)',
    name_ar: 'طميية معتدلة (فرنك)',
    name_fr: 'Limoneuse (Franche)',
    sulfurPerUnitDropKgHa: 900,
    limePerUnitRiseKgHa: 2200,
    bufferingCapacity: 'medium',
  },
  clay_loam: {
    id: 'clay_loam',
    name: 'Clay Loam (Argilo-limoneuse)',
    name_ar: 'طميية طينية',
    name_fr: 'Argilo-limoneuse',
    sulfurPerUnitDropKgHa: 1300,
    limePerUnitRiseKgHa: 3200,
    bufferingCapacity: 'high',
  },
  clay: {
    id: 'clay',
    name: 'Heavy Clay (Argileuse lourde)',
    name_ar: 'طينية ثقيلة',
    name_fr: 'Argileuse lourde',
    sulfurPerUnitDropKgHa: 1700,
    limePerUnitRiseKgHa: 4200,
    bufferingCapacity: 'very_high',
  },
};

export interface OrganicAmendmentOption {
  id: string;
  name: string;
  name_ar: string;
  name_fr: string;
  category: 'manure' | 'compost' | 'acidic_organic' | 'humus';
  typicalPh: number;
  cnRatio: string;
  phModifyingEffect: 'acidifying' | 'buffering_neutral' | 'slightly_alkalizing';
  organicMatterContentPct: number;
  recommendedRateTonnesHa: number;
  keyBenefits: string;
  keyBenefits_ar: string;
  keyBenefits_fr: string;
  precautions: string;
  precautions_ar: string;
  precautions_fr: string;
}

export const ORGANIC_AMENDMENTS_DATA: OrganicAmendmentOption[] = [
  {
    id: 'sheep_manure',
    name: 'Sheep / Goat Manure (Fumier de mouton/chèvre)',
    name_ar: 'سماد الأغنام والماعز (مخلفات المواشي)',
    name_fr: 'Fumier de mouton / chèvre',
    category: 'manure',
    typicalPh: 7.6,
    cnRatio: '14 - 18',
    phModifyingEffect: 'buffering_neutral',
    organicMatterContentPct: 55,
    recommendedRateTonnesHa: 15,
    keyBenefits: 'Rich in Potassium and Organic Nitrogen; enhances microbial biological activity and soil CEC, creating natural humic complexes that shield micronutrients.',
    keyBenefits_ar: 'غني بالبوتاسيوم والنيتروجين العضوي؛ يرفع السعة التبادلية CEC ويكون مركبات هيومية طبيعية تحمي العناصر الصغرى من التثبيت.',
    keyBenefits_fr: 'Riche en potassium et azote organique; augmente la CEC et forme des chélates humiques naturels.',
    precautions: 'Ensure full composting/maturation (6+ months) before applying to eliminate weed seeds and avoid temporary nitrogen tie-up.',
    precautions_ar: 'تأكد من تمام التخمر والتحلل (6 أشهر على الأقل) للقضاء على بذور الأعشاب وتفادي احتراق الجذور.',
    precautions_fr: 'Bien composter (6 mois) pour détruire les graines d’adventices et éviter les brûlures racinaires.',
  },
  {
    id: 'cattle_manure',
    name: 'Cattle / Cow Manure (Fumier de bovin)',
    name_ar: 'سماد الأبقار',
    name_fr: 'Fumier de bovin',
    category: 'manure',
    typicalPh: 7.2,
    cnRatio: '18 - 25',
    phModifyingEffect: 'buffering_neutral',
    organicMatterContentPct: 50,
    recommendedRateTonnesHa: 25,
    keyBenefits: 'Excellent soil conditioner; improves water holding capacity in sandy soils and loosens heavy clay structure.',
    keyBenefits_ar: 'محسن تربة ممتاز؛ يزيد قدرة الأراضي الرملية على الاحتفاظ بالماء ويحسن تهوية الأراضي الطينية.',
    keyBenefits_fr: 'Excellent structurant du sol; améliore la rétention en eau des sables et allège les argiles.',
    precautions: 'Apply in autumn/winter and incorporate into the top 15-20 cm.',
    precautions_ar: 'يطبق في الخريف أو الشتاء ويحرث في عمق 15-20 سم.',
    precautions_fr: 'Appliquer en automne/hiver et incorporer sur 15-20 cm.',
  },
  {
    id: 'poultry_manure',
    name: 'Poultry / Chicken Manure (Fiente de volaille)',
    name_ar: 'سماد الدواجن (الزرق)',
    name_fr: 'Fiente de volaille',
    category: 'manure',
    typicalPh: 6.8,
    cnRatio: '9 - 12',
    phModifyingEffect: 'buffering_neutral',
    organicMatterContentPct: 60,
    recommendedRateTonnesHa: 8,
    keyBenefits: 'Highest N-P-K concentration among animal manures; rapid mineralization provides fast-acting nitrogen and active organic acids.',
    keyBenefits_ar: 'أعلى تركيز N-P-K بين المخلفات الحيوانية؛ تمعدن سريع يطلق أحماضاً عضوية ونترات سريعة.',
    keyBenefits_fr: 'Le plus riche en N-P-K; libération rapide d’acides organiques et d’azote assimilable.',
    precautions: 'High electrical conductivity (EC) and ammonia risk! Never exceed 10 t/ha and avoid direct root contact.',
    precautions_ar: 'ملوحة مرتفعة (EC) وخطر أمونيا عالي! لا تتجاوز 8-10 طن/هكتار وتجنب ملامسته للجذور مباشرة.',
    precautions_fr: 'Salinité (CE) élevée; ne jamais dépasser 10 t/ha et éviter le contact racinaire direct.',
  },
  {
    id: 'mature_compost',
    name: 'Mature Vegetal Compost (Compost végétal mûr)',
    name_ar: 'الكمبوست النباتي المعالج والمتحلل',
    name_fr: 'Compost végétal mûr',
    category: 'compost',
    typicalPh: 6.8,
    cnRatio: '12 - 16',
    phModifyingEffect: 'buffering_neutral',
    organicMatterContentPct: 45,
    recommendedRateTonnesHa: 20,
    keyBenefits: 'Safe, pathogen-free, stable humus. Acts as a pH buffer: tempers extreme acidity or alkalinity and enhances phosphorus mobility.',
    keyBenefits_ar: 'دبال مستقر وخالٍ من الممرضات؛ يعمل كمنظم حامضي (Buffer) يوازن تقلبات pH ويزيد حركة الفسفور.',
    keyBenefits_fr: 'Humus stable et sain. Véritable tampon de pH qui améliore la biodisponibilité du phosphore.',
    precautions: 'Verify maturity (Solvita score > 7 or no bad odor) to avoid oxygen depletion in the root zone.',
    precautions_ar: 'تأكد من نضج الكمبوست وانعدام الرائحة الكريهة لتفادي استنزاف الأكسجين الجذري.',
    precautions_fr: 'Vérifier la maturité (pas d’odeur désagréable) pour préserver l’oxygénation des racines.',
  },
  {
    id: 'sphagnum_peat',
    name: 'Sphagnum Peat Moss (Tourbe blonde acide)',
    name_ar: 'البيت موس الحامضي (تورب الشفاجنوم)',
    name_fr: 'Tourbe blonde de sphaigne',
    category: 'acidic_organic',
    typicalPh: 4.0,
    cnRatio: '45 - 60',
    phModifyingEffect: 'acidifying',
    organicMatterContentPct: 90,
    recommendedRateTonnesHa: 10,
    keyBenefits: 'Directly lowers pH in localized planting holes and substrates; exceptional water holding capacity (up to 15x its dry weight). Ideal for blueberries, acidophiles, and nursery potting.',
    keyBenefits_ar: 'يخفض الـ pH مباشرة في جور الزراعة والمراقد؛ قدرة هائلة على حفظ الرطوبة (15 ضعف وزنه). مثالي للنباتات الحامضية والمشاتل.',
    keyBenefits_fr: 'Acidifie directement les trous de plantation et substrats; rétention d’eau exceptionnelle (15x son poids).',
    precautions: 'Low initial nutrient content; re-wetting dry peat requires surfactants or pre-soaking.',
    precautions_ar: 'فقير بالعناصر الغذائية الأولية؛ يحتاج ترطيباً جيداً قبل الزراعة.',
    precautions_fr: 'Pauvre en éléments nutritifs; humidifier avant utilisation.',
  },
  {
    id: 'humic_fulvic',
    name: 'Humic & Fulvic Acid Concentrates (Acides humiques & fulviques)',
    name_ar: 'مستخلصات أحماض الهيوميك والفولفيك',
    name_fr: 'Acides humiques et fulviques',
    category: 'humus',
    typicalPh: 5.5,
    cnRatio: '10 - 15',
    phModifyingEffect: 'buffering_neutral',
    organicMatterContentPct: 80,
    recommendedRateTonnesHa: 0.05, // Applied in kg/ha (20 - 50 kg/ha or 20-50 L/ha)
    keyBenefits: 'Natural chelation agent! Fulvic acids dissolve fixed iron, zinc, and phosphates in calcareous soils (pH 7.5-8.5) and stimulate root elongation.',
    keyBenefits_ar: 'عامل استخلاب طبيعي خارق! تحرر أحماض الفولفيك الفسفور والحديد والزنك المثبت في التربة الكلسية وتنشط نمو الجذور.',
    keyBenefits_fr: 'Agent chélatant naturel puissant ! Débloque le fer, le zinc et le phosphore en sol calcaire.',
    precautions: 'Apply via fertigation in 3-4 split doses during peak root growth phases.',
    precautions_ar: 'تطبق عبر شبكة الري بالتنقيط على دفعات مقسمة خلال فترات النشاط الجذري.',
    precautions_fr: 'Appliquer en fertigation fractionnée durant les poussées racinaires.',
  },
];

export interface FertilizerReactionSpec {
  id: string;
  name: string;
  name_ar: string;
  name_fr: string;
  formula: string;
  npk: string;
  physiologicalEffect: 'strongly_acidifying' | 'moderately_acidifying' | 'neutral' | 'slightly_alkalizing' | 'strongly_alkalizing';
  /** kg of pure CaCO3 equivalent needed to neutralize the acidity of 100 kg fertilizer (negative means acidifying, positive means basic) */
  caco3EquivalentPer100kg: number;
  recommendationForAlkalineSoil: string;
  recommendationForAlkalineSoil_ar: string;
  recommendationForAlkalineSoil_fr: string;
}

export const FERTILIZER_REACTIONS_DATA: FertilizerReactionSpec[] = [
  {
    id: 'ammonium_sulfate',
    name: 'Ammonium Sulfate (Sulfate d’ammonium)',
    name_ar: 'سلفات الأمونيوم (كبريتات النشادر)',
    name_fr: 'Sulfate d’ammonium',
    formula: '(NH₄)₂SO₄',
    npk: '21-0-0 + 24% S',
    physiologicalEffect: 'strongly_acidifying',
    caco3EquivalentPer100kg: -110,
    recommendationForAlkalineSoil: 'TOP CHOICE for high pH/calcareous soils! Nitrification releases 2 H⁺ ions per NH₄⁺, creating an acidified micro-rhizosphere that unlocks native P, Fe, and Zn.',
    recommendationForAlkalineSoil_ar: 'الخيار الأول والمفضل للأراضي القلوية والكلسية! عملية النترتة تطلق أيونات H⁺ في المحيط الجذري مما يخفض الحموضة ويحرر الفسفور والحديد والزنك.',
    recommendationForAlkalineSoil_fr: 'MEILLEUR CHOIX en sol alcalin ! La nitrification libère des protons H⁺, acidifiant la rhizosphère et libérant P, Fe et Zn.',
  },
  {
    id: 'map',
    name: 'Monoammonium Phosphate (MAP 12-61-0)',
    name_ar: 'مونو أمونيوم فوسفات (MAP)',
    name_fr: 'Phosphate monoammonique (MAP)',
    formula: 'NH₄H₂PO₄',
    npk: '12-61-0 (or 11-52-0)',
    physiologicalEffect: 'strongly_acidifying',
    caco3EquivalentPer100kg: -65,
    recommendationForAlkalineSoil: 'Best soluble phosphorus source for alkaline soils (pH in 1% solution is ~4.5). Prevents emitter clogging and delays Ca-phosphate precipitation in drip lines.',
    recommendationForAlkalineSoil_ar: 'أفضل مصدر فسفوري ذائب للأراضي القلوية (pH المحلول 1% يبلغ 4.5). يحمي النقاطات من الانسداد ويؤخر ترسب الفسفور مع الكالسيوم.',
    recommendationForAlkalineSoil_fr: 'Meilleure source de phosphore en sol alcalin (solution à pH ~4.5); limite le colmatage des goutteurs.',
  },
  {
    id: 'urea',
    name: 'Urea (Urée 46%)',
    name_ar: 'اليوريا (سماد نتروجيني 46%)',
    name_fr: 'Urée 46%',
    formula: 'CO(NH₂)₂',
    npk: '46-0-0',
    physiologicalEffect: 'moderately_acidifying',
    caco3EquivalentPer100kg: -71,
    recommendationForAlkalineSoil: 'Hydrolysis temporarily raises local pH for 2-4 days, then nitrification causes net acidification. Must be watered in immediately on alkaline soils to prevent ammonia gas losses.',
    recommendationForAlkalineSoil_ar: 'يسبب تحلله المائي ارتفاعاً مؤقتاً في الـ pH لعدة أيام ثم يتبعه تحميض صافٍ. يجب ريه فوراً في الأراضي القلوية لمنع تطاير غاز الأمونيا.',
    recommendationForAlkalineSoil_fr: 'Acidifiant net à terme, mais irriguer immédiatement pour éviter les pertes d’ammoniac par volatilisation.',
  },
  {
    id: 'phosphoric_acid',
    name: 'Phosphoric Acid 85% (Acide phosphorique)',
    name_ar: 'حمض الفوسفوريك 85%',
    name_fr: 'Acide phosphorique 85%',
    formula: 'H₃PO₄',
    npk: '0-52-0 to 0-61-0',
    physiologicalEffect: 'strongly_acidifying',
    caco3EquivalentPer100kg: -140,
    recommendationForAlkalineSoil: 'Ultimate dual-purpose acid: neutralizes bicarbonates (HCO₃⁻) in irrigation water and supplies 100% available monovalent orthophosphate.',
    recommendationForAlkalineSoil_ar: 'الحل المثالي المزدوج: يعادل بيكربونات مياه الري ويغذي النبات بأعلى صور الفسفور الأرثوفوسفاتي ذوباناً.',
    recommendationForAlkalineSoil_fr: 'Double action remarquable : neutralise les bicarbonates d’irrigation et apporte du phosphore ultra-assimilable.',
  },
  {
    id: 'potassium_sulfate',
    name: 'Potassium Sulfate (Sulfate de potassium SOP)',
    name_ar: 'سلفات البوتاسيوم (SOP 0-0-50)',
    name_fr: 'Sulfate de potassium (SOP)',
    formula: 'K₂SO₄',
    npk: '0-0-50 + 18% S',
    physiologicalEffect: 'neutral',
    caco3EquivalentPer100kg: 0,
    recommendationForAlkalineSoil: 'Safe, low salt index potassium source. Excellent for fruit quality, brix, and drought resistance without increasing soil alkalinity.',
    recommendationForAlkalineSoil_ar: 'مصدر بوتاسي آمن ومنخفض الملوحة. ممتاز لجودة الثمار ونسبة السكر ومقاومة الجفاف دون زيادة قلوية التربة.',
    recommendationForAlkalineSoil_fr: 'Source de potassium neutre et à faible indice de salinité, idéale pour la qualité des fruits.',
  },
  {
    id: 'calcium_nitrate',
    name: 'Calcium Nitrate (Nitrate de chaux)',
    name_ar: 'نترات الكالسيوم',
    name_fr: 'Nitrate de chaux',
    formula: '5Ca(NO₃)₂·NH₄NO₃·10H₂O',
    npk: '15.5-0-0 + 26% CaO',
    physiologicalEffect: 'slightly_alkalizing',
    caco3EquivalentPer100kg: 20,
    recommendationForAlkalineSoil: 'Provides vital soluble Ca for fast-growing fruits (prevents blossom end rot), but has a slightly alkalizing physiological reaction.',
    recommendationForAlkalineSoil_ar: 'يمد الثمار بالكالسيوم الذائب السريع (يمنع عفن طرف الزهرة)، لكن تأثيره الفسيولوجي قلوي طفيف.',
    recommendationForAlkalineSoil_fr: 'Apport de calcium soluble essentiel contre la nécrose apicale; effet physiologique légèrement basique.',
  },
  {
    id: 'elemental_sulfur',
    name: 'Elemental Agricultural Sulfur (Soufre élémentaire S⁰)',
    name_ar: 'الكبريت الزراعي الناعم (S⁰)',
    name_fr: 'Soufre élémentaire agricole (S⁰)',
    formula: 'S⁰ (99% pure S)',
    npk: '0-0-0 + 99% S',
    physiologicalEffect: 'strongly_acidifying',
    caco3EquivalentPer100kg: -300,
    recommendationForAlkalineSoil: 'The definitive permanent soil acidifier. Soil bacteria (Thiobacillus) oxidize S⁰ into sulfuric acid (H₂SO₄), lowering bulk and rhizosphere soil pH effectively.',
    recommendationForAlkalineSoil_ar: 'المعالج الأساسي والدائم لخفض قلوية التربة. تحوله بكتيريا الثيوباسيلوس إلى حمض كبريتيك مخفضاً حموضة التربة ومحرراً العناصر.',
    recommendationForAlkalineSoil_fr: 'L’amendement acidifiant par excellence. Oxydé en acide sulfurique par les bactéries Thiobacillus du sol.',
  },
];
