'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Camera,
  Upload,
  Bug,
  AlertTriangle,
  Search,
  Sparkles,
  CheckCircle2,
  X,
  ExternalLink,
  HelpCircle,
  Phone,
  Building2,
  Share2,
  Send,
  MapPin,
  Filter,
} from 'lucide-react';
import { useTranslation, copyFor } from '@/lib/language-store';
import { ToolExplainerDialog } from '@/components/agri/ToolExplainerDialog';

interface FarmerSymptomCheckerProps {
  cropName?: string;
  onOpenProductFinder?: () => void;
  onOpenHelp?: () => void;
  sunMode?: boolean;
}

interface SymptomGuide {
  id: string;
  category: 'leaf' | 'stem' | 'fruit' | 'root';
  emoji: string;
  titleEn: string;
  titleFr: string;
  titleAr: string;
  causesEn: string;
  causesFr: string;
  causesAr: string;
  actionEn: string;
  actionFr: string;
  actionAr: string;
  inpvMoleculesEn: string;
  inpvMoleculesAr: string;
  inpvMoleculesFr: string;
  pestKey: string;
}

const INPV_REGIONAL_STATIONS = [
  { wilayaEn: 'Algiers / Blida', wilayaAr: 'الجزائر / البليدة', phone: '023 57 11 60', addressEn: 'INPV El Harrach / Oued El Alleug', addressAr: 'المعهد الوطني لحماية النباتات الحراش' },
  { wilayaEn: 'Biskra / El Oued', wilayaAr: 'بسكرة / الوادي', phone: '033 74 20 15', addressEn: 'Station Régionale Sud Biskra', addressAr: 'المحطة الجهوية لحماية النباتات بسكرة' },
  { wilayaEn: 'Mostaganem / Oran', wilayaAr: 'مستغانم / وهران', phone: '045 42 18 30', addressEn: 'Station Régionale Ouest Mostaganem', addressAr: 'المحطة الجهوية مستغانم' },
  { wilayaEn: 'Batna / Constantine', wilayaAr: 'باتنة / قسنطينة', phone: '033 86 44 12', addressEn: 'Station Régionale Est Batna', addressAr: 'المحطة الجهوية باتنة' },
  { wilayaEn: 'Chlef / Ain Defla', wilayaAr: 'الشلف / عين الدفلى', phone: '027 77 39 10', addressEn: 'Station Régionale Dahra Chlef', addressAr: 'المحطة الجهوية الشلف' },
  { wilayaEn: 'Sidi Bel Abbès / Mascara', wilayaAr: 'سيدي بلعباس / معسكر', phone: '048 54 62 80', addressEn: 'Station Régionale SBA', addressAr: 'المحطة الجهوية سيدي بلعباس' },
];

const SYMPTOM_DATABASE: SymptomGuide[] = [
  {
    id: 'spots',
    category: 'leaf',
    emoji: '🍂',
    titleEn: 'Brown/Black Leaf Spots & Halos (Late Blight)',
    titleFr: 'Taches brunes / noires avec feutrage (Mildiou)',
    titleAr: 'بقع بنية أو سوداء وهالات رطبة (اللفحة المتأخرة / الميلديو)',
    causesEn: 'Late Blight (Phytophthora infestans) / Alternaria fungal attack favored by cool, wet nights.',
    causesFr: 'Mildiou (Phytophthora) / Alternariose favorisé par des nuits fraîches et humides.',
    causesAr: 'فطر اللفحة المتأخرة (الميلديو) أو الألترناريا ينشط في الليالي الباردة والرطبة.',
    actionEn: 'Treat immediately before high humidity. Remove heavily infected leaves.',
    actionFr: 'Traiter immédiatement avant les pics d’humidité. Éliminer les foyers primaires.',
    actionAr: 'رش فوراً قبل ارتفاع الرطوبة وتخلص من الأوراق المصابة بشدة.',
    inpvMoleculesEn: 'Copper Hydroxide, Mancozeb 80%, Cymoxanil, Azoxystrobin',
    inpvMoleculesAr: 'هيدروكسيد النحاس، مانكوزيب 80%، سيموكسانيل، أزوكسيستروبين',
    inpvMoleculesFr: 'Hydroxyde de Cuivre, Mancozèbe 80%, Cymoxanil, Azoxystrobine',
    pestKey: 'Mildiou',
  },
  {
    id: 'blossom_end_rot',
    category: 'fruit',
    emoji: '⚫',
    titleEn: 'Black Sunken Patch on Fruit Bottom (Blossom-End Rot / Cul Noir)',
    titleFr: 'Nécrose apicale noire au fond du fruit (Cul Noir)',
    titleAr: 'بقعة سوداء غائرة في أسفل الثمرة (عفن الطرف الزهري / نقص الكالسيوم)',
    causesEn: 'Calcium deficiency coupled with irregular irrigation fluctuations.',
    causesFr: 'Carence en Calcium provoquée par des à-coups d\'irrigation.',
    causesAr: 'نقص عنصر الكالسيوم المصاحب لعدم انتظام دورات السقي وجفاف التربة المؤقت.',
    actionEn: 'Apply foliar Calcium Nitrate or chelated Calcium; normalize drip frequency.',
    actionFr: 'Appliquer du Nitrate de Chaux ou Calcium foliaire ; régulariser les arrosages.',
    actionAr: 'رش نترات الكالسيوم أو كالسيوم مخلبي ورقياً، ونظم دورات الري دون تعطيش.',
    inpvMoleculesEn: 'Foliar Calcium Nitrate (Ca(NO₃)₂), Calcium Formate, Boron synergist',
    inpvMoleculesAr: 'نترات الكالسيوم ورقياً، فورمات الكالسيوم، البورون المساعد',
    inpvMoleculesFr: 'Nitrate de Chaux foliaire, Formiate de Calcium, Bore',
    pestKey: 'Calcium',
  },
  {
    id: 'yellowing',
    category: 'leaf',
    emoji: '🟡',
    titleEn: 'Yellowing of Lower Leaves (Chlorosis)',
    titleFr: 'Jaunissement des vieilles feuilles (Chlorose)',
    titleAr: 'اصفرار الأوراق السفلية والقديمة (كلوروز النيتروجين)',
    causesEn: 'Nitrogen deficiency OR over-watering causing root asphyxia.',
    causesFr: 'Carence en azote (N) OU excès d’eau (asphyxie racinaire).',
    causesAr: 'نقص عنصر النيتروجين أو زيادة السقي واختناق الجذور.',
    actionEn: 'Apply fast-release Nitrogen (Urea 46% or Ammonium Nitrate) and check drainage.',
    actionFr: 'Apporter de l’Urée 46% ou Nitrate d\'Ammonium et vérifier le drainage.',
    actionAr: 'أضف سماد نيتروجيني سريع الامتصاص (يوريا 46%) وتأكد من تصريف التربة.',
    inpvMoleculesEn: 'Urea 46%, Ammonium Nitrate 33.5%, Iron chelate EDDHA',
    inpvMoleculesAr: 'يوريا 46%، نترات الأمونيوم 33.5%، شيلات الحديد EDDHA',
    inpvMoleculesFr: 'Urée 46%, Nitrate d\'ammonium 33.5%, Chélate de fer EDDHA',
    pestKey: 'Carence',
  },
  {
    id: 'white_powder',
    category: 'leaf',
    emoji: '⚪',
    titleEn: 'White Powdery Coating on Leaves (Oidium / Powdery Mildew)',
    titleFr: 'Poudre blanche / Feutrage sur feuilles (Oïdium)',
    titleAr: 'مسحوق وغبار أبيض قطني على الأوراق (البياض الدقيقي / لودييوم)',
    causesEn: 'Powdery Mildew (Oïdium) favored by warm, dry weather with morning dew.',
    causesFr: 'Oïdium favorisé par temps chaud et sec avec rosée matinale.',
    causesAr: 'مرض البياض الدقيقي الفطري ينشط في الأجواء الدافئة مع وجود ندى الصباح.',
    actionEn: 'Spray micronized sulfur or registered triazole fungicide.',
    actionFr: 'Appliquer du soufre mouillable ou un fongicide triazole homologué.',
    actionAr: 'رش الكبريت الميكروني القابل للبلل أو مبيد تريازول مرخص.',
    inpvMoleculesEn: 'Micronized Wettable Sulfur 80%, Difenoconazole, Penconazole',
    inpvMoleculesAr: 'كبريت ميكروني 80%، ديفينوكونازول، بينكونازول',
    inpvMoleculesFr: 'Soufre mouillable 80%, Difénoconazole, Penconazole',
    pestKey: 'Oïdium',
  },
  {
    id: 'curling_bugs',
    category: 'leaf',
    emoji: '🐛',
    titleEn: 'Curled Leaves, Sticky Honeydew & Aphids (Pucerons)',
    titleFr: 'Feuilles crispées, miellat collant ou pucerons',
    titleAr: 'أوراق ملتفة، مادة دبقة عسلية، وحشرات المنّ والتربس',
    causesEn: 'Aphids (Pucerons), Whiteflies (Aleurodes), or Thrips feeding on sap.',
    causesFr: 'Pucerons, Mouches blanches (Aleurodes) ou Thrips suceurs de sève.',
    causesAr: 'حشرات المنّ، الذباب الأبيض، أو التربس الماص لعصارة النبات.',
    actionEn: 'Treat with Acetamiprid, Deltamethrin, or organic potassium soap.',
    actionFr: 'Traiter avec Acétamipride, Deltaméthrine ou savon noir potassique.',
    actionAr: 'رش أسيتامبريد، ديلتاميثرين، أو صابون بوتاسي موضعي.',
    inpvMoleculesEn: 'Acetamiprid 20%, Deltamethrin, Spirotetramat, Potassium Soap',
    inpvMoleculesAr: 'أسيتامبريد 20%، ديلتاميثرين، سبيروتتراماط، صابون بوتاسي',
    inpvMoleculesFr: 'Acétamipride 20%, Deltaméthrine, Spirotétramate, Savon potassique',
    pestKey: 'Pucerons',
  },
  {
    id: 'tunnels',
    category: 'fruit',
    emoji: '🪱',
    titleEn: 'Serpentine Mines & Bored Fruits (Tuta Absoluta / Mineuse)',
    titleFr: 'Galeries transparentes ou fruits perforés (Mineuse / Tuta)',
    titleAr: 'أنفاق متعرجة في الأوراق وثقوب في الثمار (حفارة أوراق / توتا أبسولوتا)',
    causesEn: 'Leafminer (Mineuse) or Tomato borer (Tuta Absoluta / Noctuelles).',
    causesFr: 'Mineuse des feuilles ou Noctuelle / Tuta Absoluta sur tomate.',
    causesAr: 'حفارة الأنفاق أو فراشة التوتا أبسولوتا / دودة ثمار الطماطم.',
    actionEn: 'Use Abamectin, Emamectin benzoate, or pheromone delta traps.',
    actionFr: 'Utiliser Abamectine, Emamectine benzoate ou pièges à phéromones.',
    actionAr: 'استخدم أبامكتين، إيمامكتين بنزوات، أو مصائد الفيرومونات.',
    inpvMoleculesEn: 'Emamectin benzoate 5%, Abamectin 1.8%, Chlorantraniliprole',
    inpvMoleculesAr: 'إيمامكتين بنزوات 5%، أبامكتين 1.8%، كلورانترانيليبرول',
    inpvMoleculesFr: 'Emamectine benzoate 5%, Abamectine 1.8%, Chlorantraniliprole',
    pestKey: 'Mineuse',
  },
  {
    id: 'spider_mites',
    category: 'leaf',
    emoji: '🕸️',
    titleEn: 'Fine Webbing, Bronzing & Dusty Leaves (Red Spider Mites)',
    titleFr: 'Fines toiles, décoloration bronze (Tétranyques / Araignées rouges)',
    titleAr: 'خيوط عنكبوتية دقيقة، اصفرار برونزي وتغبر الأوراق (العنكبوت الأحمر)',
    causesEn: 'Two-spotted spider mites (Tetranychus urticae) thriving in hot, dry, dusty conditions.',
    causesFr: 'Araignée rouge (Tétranyque) favorisée par la chaleur sèche et la poussière.',
    causesAr: 'الأكاروسات والعنكبوت الأحمر ينشط في الأجواء الحارة والجافة والمغبرة.',
    actionEn: 'Spray specific acaricide (Abamectin, Hexythiazox) with high water volume under leaves.',
    actionFr: 'Appliquer un acaricide spécifique (Abamectine, Hexythiazox) en mouillant le dessous des feuilles.',
    actionAr: 'رش مبيد أكاروسي متخصص (أبامكتين أو هيكسيثيازوكس) مع تبليل السطح السفلي للأوراق.',
    inpvMoleculesEn: 'Abamectin 1.8%, Hexythiazox, Spirodiclofen, Bifenazate',
    inpvMoleculesAr: 'أبامكتين 1.8%، هيكسيثيازوكس، سبيروديكلوفين، بيفينازات',
    inpvMoleculesFr: 'Abamectine 1.8%, Hexythiazox, Spirodiclofène, Bifénazate',
    pestKey: 'Acariens',
  },
  {
    id: 'olive_fly',
    category: 'fruit',
    emoji: '🫒',
    titleEn: 'Punctured Fruits & Larval Drop (Olive Fruit Fly / Bactrocera)',
    titleFr: 'Fruits piqués et chute précoce (Mouche de l\'olive)',
    titleAr: 'ثقوب دقيقة في حبات الزيتون وتساقط الثمار (ذبابة ثمار الزيتون)',
    causesEn: 'Olive fruit fly (Bactrocera oleae) laying eggs inside olive drupes in late summer.',
    causesFr: 'Mouche de l\'olive (Bactrocera oleae) pondant sous l\'épiderme des olives.',
    causesAr: 'حشرة ذبابة الزيتون تضع بيوضها داخل الثمار مسببة تعفنها وتساقطها.',
    actionEn: 'Install protein bait traps (McPhail) and apply Deltamethrin or Spinosad.',
    actionFr: 'Poser des pièges à phéromone/protéine hydrolysée et traiter au Spinosad.',
    actionAr: 'علق مصائد جاذبة غذائية واستخدم مبيد سبينوساد أو ديلتاميثرين.',
    inpvMoleculesEn: 'Spinosad, Deltamethrin, Hydrolyzed protein bait traps',
    inpvMoleculesAr: 'سبينوساد، ديلتاميثرين، طعوم بروتينية مائية جاذبة',
    inpvMoleculesFr: 'Spinosad, Deltaméthrine, Pièges aux protéines hydrolysées',
    pestKey: 'Mouche',
  },
  {
    id: 'wilting',
    category: 'stem',
    emoji: '🥀',
    titleEn: 'Sudden Daytime Wilting & Collar Rot (Fusarium / Verticillium)',
    titleFr: 'Flétrissement brutal en journée & Pourriture du collet',
    titleAr: 'ذبول مفاجئ للنبات وقت الظهيرة وعفن عند التاج (فيوزاريوم / فرتيسيليوم)',
    causesEn: 'Fusarium / Verticillium vascular wilt or root-knot nematodes.',
    causesFr: 'Fusariose, Verticilliose ou pourriture racinaire.',
    causesAr: 'ذبول الفيوزاريوم أو الفرتيسيليوم الوعائي أو نيماتودا تعقد الجذور.',
    actionEn: 'Reduce irrigation frequency, drench collar with Trichoderma or authorized fungicide.',
    actionFr: 'Espacer les arrosages, traiter au collet avec fongicide ou Trichoderma.',
    actionAr: 'باعد بين فترات الري، وعالج أسفل الساق بمبيد جهازي أو فطر تريكوديرما.',
    inpvMoleculesEn: 'Hymexazol, Fosetyl-Al, Trichoderma harzianum bio-agent',
    inpvMoleculesAr: 'هيميكسازول، فوستيل الألومنيوم، تريكوديرما هارزيانوم حيوي',
    inpvMoleculesFr: 'Hymexazol, Fosétyl-Al, Trichoderma harzianum bio-fongicide',
    pestKey: 'Pourriture',
  },
  {
    id: 'root_galls',
    category: 'root',
    emoji: '🪢',
    titleEn: 'Root Knots, Swellings & Stunted Growth (Nematodes)',
    titleFr: 'Galles, nodosités sur racines et nanisme (Nématodes)',
    titleAr: 'عقد وانتفاخات على الجذور وضعف نمو عام (نيماتودا تعقد الجذور)',
    causesEn: 'Meloidogyne root-knot nematodes infesting sandy / light soils.',
    causesFr: 'Nématodes à galles (Meloidogyne) en sols légers et chauds.',
    causesAr: 'ديدان النيماتودا الثعبانية المسببة لتعقد الجذور في الأراضي الرملية.',
    actionEn: 'Solarize soil before planting; use bio-nematicide via drip.',
    actionFr: 'Solarisation du sol en été, apport de nématicide bio par goutte-à-goutte.',
    actionAr: 'التشميس الصيفي للتربة واستعمال مبيد نيماتودي مرخص بالتقطير.',
    inpvMoleculesEn: 'Fluopyram, Paecilomyces lilacinus bio-nematicide, Garlic extract',
    inpvMoleculesAr: 'فلوبيورام، فطر باسيلوميسيس بيولوجي، مستخلص الثوم',
    inpvMoleculesFr: 'Fluopyram, Paecilomyces lilacinus bio-nématicide',
    pestKey: 'Nématodes',
  },
];

export function FarmerSymptomChecker({
  cropName = 'Potato',
  onOpenProductFinder,
  onOpenHelp,
  sunMode = false,
}: FarmerSymptomCheckerProps) {
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'leaf' | 'stem' | 'fruit' | 'root'>('all');
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomGuide | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showInpvDirectory, setShowInpvDirectory] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredSymptoms = selectedCategory === 'all'
    ? SYMPTOM_DATABASE
    : SYMPTOM_DATABASE.filter((s) => s.category === selectedCategory);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShareToWhatsApp = () => {
    if (!selectedSymptom) return;
    const text = language === 'ar'
      ? `🚨 *استشارة تشخيص مرضي حقلي* 🚨
🌾 المحصول: ${cropName}
🔍 العرض المشاهد: ${selectedSymptom.titleAr}
⚠️ السبب المرجح: ${selectedSymptom.causesAr}
🛡️ الإجراء المقترح: ${selectedSymptom.actionAr}
🧪 المواد الفعالة INPV: ${selectedSymptom.inpvMoleculesAr}`
      : `🚨 *Field Crop Diagnosis Request* 🚨
🌾 Crop: ${cropName}
🔍 Observed Symptom: ${selectedSymptom.titleEn}
⚠️ Probable Cause: ${selectedSymptom.causesEn}
🛡️ Action: ${selectedSymptom.actionEn}
🧪 INPV Active Ingredients: ${selectedSymptom.inpvMoleculesEn}`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <Card className={`border ${sunMode ? 'border-foreground bg-background text-foreground' : 'border-border bg-card'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Camera className="h-5 w-5 text-rose-600" />
            <span>{tr('Quick Crop Diagnosis & INPV Disease Guide', 'مرشد أعراض وتشخيص أمراض المحاصيل ودليل INPV', 'Diagnostic rapide au champ & Guide INPV')}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <ToolExplainerDialog category="symptom_checker" triggerVariant="outline" className="h-7 text-xs" />
            <Badge variant="outline" className="text-[11px] font-normal">
              {tr('10 Common Field Conditions', '10 أعراض حقلية رئيسية', '10 symptômes courants')}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {tr(
            'Identify visual pests, leaf spots, and nutrient deficiencies. Get authorized active ingredients from the Algerian Phytosanitary Index (INPV).',
            'تعرف على الآفات المرئية، التبقعات، ونقص التغذية. احصل على المواد الفعالة المرخصة من الفهرس الفلاحي الجزائري INPV.',
            'Identifiez les maladies, carences et ravageurs. Consultez les matières actives homologuées par l\'INPV.'
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* PHOTO CAPTURE BAR */}
        <div className="p-3.5 rounded-xl border border-dashed border-rose-300 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handlePhotoCapture}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-9 px-3 gap-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
            >
              <Camera className="h-4 w-4" />
              <span>{tr('Take Crop Photo', 'التقط صورة للورقة/الثمرة', 'Prendre une photo')}</span>
            </Button>

            {photoPreview && (
              <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-border shrink-0">
                <img src={photoPreview} alt="Field preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-0 right-0 bg-black/60 text-white p-0.5 rounded-bl"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            <span className="text-xs text-muted-foreground hidden md:inline">
              {tr('Or select a matching visual symptom from the atlas below:', 'أو اختر العرض المشابه مباشرة من الدليل أدناه:', 'Ou sélectionnez un symptôme dans la liste ci-dessous :')}
            </span>
          </div>

          <div className="flex gap-1.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowInpvDirectory((prev) => !prev)}
              className="h-8 text-xs gap-1 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300"
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>{showInpvDirectory ? tr('Hide INPV Stations', 'إخفاء محطات INPV', 'Masquer INPV') : tr('INPV Stations Directory', 'دليل محطات INPV', 'Stations INPV')}</span>
            </Button>
          </div>
        </div>

        {/* INPV REGIONAL STATIONS DIRECTORY */}
        {showInpvDirectory && (
          <div className="rounded-xl border border-border p-3.5 bg-muted/20 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Building2 className="h-4 w-4 text-emerald-600" />
              <span>{tr('National Institute of Plant Protection (INPV) Regional Stations:', 'المحطات الجهوية للمعهد الوطني لحماية النباتات (INPV):', 'Stations régionales de l\'INPV Algérie :')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              {INPV_REGIONAL_STATIONS.map((station, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border border-border bg-card space-y-1">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-rose-600" />
                    <span>{language === 'ar' ? station.wilayaAr : station.wilayaEn}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {language === 'ar' ? station.addressAr : station.addressEn}
                  </div>
                  <div className="flex items-center gap-1 font-mono text-emerald-600 font-bold pt-0.5">
                    <Phone className="h-3 w-3" />
                    <span>{station.phone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ORGAN FILTER PILLS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-xs font-medium text-muted-foreground mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> {tr('Organ:', 'العضو:', 'Partie :')}
          </span>
          {(['all', 'leaf', 'fruit', 'stem', 'root'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                selectedCategory === cat
                  ? 'bg-rose-600 text-white border-rose-600 font-bold'
                  : 'bg-card border-border text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {cat === 'all' && tr('All Organs', 'كل الأجزاء', 'Tous')}
              {cat === 'leaf' && tr('🍃 Leaves', '🍃 الأوراق', '🍃 Feuilles')}
              {cat === 'fruit' && tr('🍅 Fruits & Tubers', '🍅 الثمار والدرنات', '🍅 Fruits & Tubercules')}
              {cat === 'stem' && tr('🪵 Stems & Collar', '🪵 الساق والتاج', '🪵 Tiges & Collet')}
              {cat === 'root' && tr('🌱 Roots', '🌱 الجذور', '🌱 Racines')}
            </button>
          ))}
        </div>

        {/* SYMPTOM CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredSymptoms.map((sym) => {
            const isSelected = selectedSymptom?.id === sym.id;
            return (
              <button
                key={sym.id}
                type="button"
                onClick={() => setSelectedSymptom(sym)}
                className={`p-3 rounded-xl border text-left transition-all space-y-1.5 flex flex-col justify-between ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/60 ring-2 ring-rose-400'
                    : 'border-border bg-card hover:bg-muted/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <span className="text-xl">{sym.emoji}</span>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    {sym.category}
                  </Badge>
                </div>
                <div className="font-bold text-xs text-foreground leading-snug">
                  {language === 'ar' ? sym.titleAr : language === 'fr' ? sym.titleFr : sym.titleEn}
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {language === 'ar' ? sym.causesAr : language === 'fr' ? sym.causesFr : sym.causesEn}
                </p>
              </button>
            );
          })}
        </div>

        {/* SELECTED SYMPTOM DETAILED PRESCRIPTION */}
        {selectedSymptom && (
          <div className="rounded-xl border-2 border-rose-500 bg-rose-50/50 dark:bg-rose-950/40 p-4 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-rose-200 dark:border-rose-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedSymptom.emoji}</span>
                <div>
                  <h4 className="text-xs font-bold text-rose-950 dark:text-rose-200">
                    {language === 'ar' ? selectedSymptom.titleAr : language === 'fr' ? selectedSymptom.titleFr : selectedSymptom.titleEn}
                  </h4>
                  <span className="text-[10px] text-muted-foreground">
                    {tr('Probable Cause:', 'السبب المشخص:', 'Cause probable :')} {language === 'ar' ? selectedSymptom.causesAr : language === 'fr' ? selectedSymptom.causesFr : selectedSymptom.causesEn}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSymptom(null)}
                className="h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Field Action */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-rose-200 dark:border-rose-900 space-y-1">
                <div className="text-[11px] font-bold text-rose-800 dark:text-rose-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{tr('Immediate Action in Field:', 'التصرف العاجل في الحقل:', 'Action immédiate au champ :')}</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  {language === 'ar' ? selectedSymptom.actionAr : language === 'fr' ? selectedSymptom.actionFr : selectedSymptom.actionEn}
                </p>
              </div>

              {/* INPV Authorized Molecules */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-rose-200 dark:border-rose-900 space-y-1">
                <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  <span>{tr('INPV Registered Active Ingredients:', 'المواد الفعالة المرخصة INPV:', 'Matières actives homologuées INPV :')}</span>
                </div>
                <p className="text-xs font-semibold text-foreground leading-relaxed">
                  {language === 'ar' ? selectedSymptom.inpvMoleculesAr : language === 'fr' ? selectedSymptom.inpvMoleculesFr : selectedSymptom.inpvMoleculesEn}
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleShareToWhatsApp}
                className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{tr('Ask Agronomist via WhatsApp', 'استشارة مهندس فلاحي عبر واتساب', 'Consulter agronome WhatsApp')}</span>
              </Button>

              {onOpenProductFinder && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onOpenProductFinder}
                  className="h-8 text-xs gap-1.5 border-rose-300 text-rose-800 dark:text-rose-300"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>{tr('Search Product in Phyto Index', 'البحث في الفهرس الفلاحي', 'Chercher dans l\'index phyto')}</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
