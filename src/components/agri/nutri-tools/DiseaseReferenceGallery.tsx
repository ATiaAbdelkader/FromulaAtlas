'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Microscope, Search, ExternalLink, Bug, BookOpen, RotateCcw,
} from 'lucide-react';
import {
  DISEASE_REFS, RESEARCH_DATASETS,
  type DiseaseRef, type ResearchDataset,
} from '@/lib/disease-ref-data';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell, type TrilingualString, type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

const TYPE_AR: Record<string, string> = { fungal: 'فطري', bacterial: 'بكتيري', viral: 'فيروسي', pest: 'آفة', nutrient: 'عنصر غذائي', weed: 'حشائش' };
const TYPE_FR: Record<string, string> = { fungal: 'Fongique', bacterial: 'Bactérien', viral: 'Viral', pest: 'Ravageur', nutrient: 'Nutrition', weed: 'Adventice' };
const SEVERITY_AR: Record<string, string> = { low: 'منخفض', medium: 'متوسط', high: 'مرتفع' };
const SEVERITY_FR: Record<string, string> = { low: 'Faible', medium: 'Moyen', high: 'Élevé' };
const CROP_AR: Record<string, string> = { Tomato: 'الطماطم', Potato: 'البطاطا', Pepper: 'الفلفل', Corn: 'الذرة', Wheat: 'القمح', Apple: 'التفاح', Grape: 'العنب', Rice: 'الأرز', Citrus: 'الحمضيات', Strawberry: 'الفراولة', General: 'عام' };
const CROP_FR: Record<string, string> = { Tomato: 'Tomate', Potato: 'Pomme de terre', Pepper: 'Poivron', Corn: 'Maïs', Wheat: 'Blé', Apple: 'Pomme', Grape: 'Raisin', Rice: 'Riz', Citrus: 'Agrumes', Strawberry: 'Fraise', General: 'Général' };
const DISEASE_AR: Record<string, string> = {
  'tom-early-blight': 'اللفحة المبكرة', 'tom-late-blight': 'اللفحة المتأخرة', 'tom-leaf-mold': 'عفن الأوراق', 'tom-septoria': 'تبقع أوراق السيبتوريا', 'tom-spider-mites': 'العنكبوت الأحمر', 'tom-leaf-curl-virus': 'فيروس تجعد أوراق الطماطم', 'tom-mosaic-virus': 'فيروس موزاييك الطماطم', 'pot-early-blight': 'اللفحة المبكرة', 'pot-late-blight': 'اللفحة المتأخرة', 'pep-bacterial-spot': 'التبقع البكتيري', 'corn-gray-leaf-spot': 'تبقع الأوراق الرمادي', 'corn-rust': 'الصدأ الشائع', 'corn-northern-blight': 'اللفحة الشمالية للذرة', 'wheat-stripe-rust': 'الصدأ المخطط', 'wheat-leaf-rust': 'صدأ الأوراق', 'apple-scab': 'جرب التفاح', 'apple-cedar-rust': 'صدأ التفاح والأرز', 'grape-black-rot': 'العفن الأسود', 'grape-esca': 'مرض إيسكا', 'rice-brown-spot': 'التبقع البني', 'rice-leaf-blast': 'لفحة الأرز', 'citrus-greening': 'اخضرار الحمضيات', 'straw-leaf-scorch': 'لفحة أوراق الفراولة', 'weed-chinee-apple': 'تفاح صيني', 'weed-lantana': 'اللانتانا', 'weed-parkinsonia': 'الباركنسونيا', 'weed-parthenium': 'البارثينيوم', 'weed-prickly-acacia': 'الأكاسيا الشوكية', 'weed-rubber-vine': 'الكرمة المطاطية', 'weed-siam-weed': 'حشيشة سيام', 'weed-snake-weed': 'حشيشة الثعبان',
};
const DATASET_CATEGORY_AR: Record<string, string> = { classification: 'تصنيف الصور', segmentation: 'التقسيم الدلالي', detection: 'كشف الأجسام', instance_seg: 'تقسيم المثيلات', hyperspectral: 'فائق/متعدد الأطياف', robotics: 'الروبوتات والملاحة', large_scale: 'واسع النطاق', collectors: 'جامعو البيانات', tools: 'أدوات البيانات الاصطناعية' };
const DATASET_CATEGORY_FR: Record<string, string> = { classification: 'Classification d\'images', segmentation: 'Segmentation sémantique', detection: 'Détection d\'objets', instance_seg: 'Seg. d\'instances', hyperspectral: 'Hyperspectral', robotics: 'Robotique', large_scale: 'Grande échelle', collectors: 'Collecteurs', tools: 'Outils de données synthétiques' };

const TYPE_META: Record<string, { label: string; emoji: string; color: string }> = {
  fungal: { label: 'Fungal', emoji: '🦠', color: '#dc2626' },
  bacterial: { label: 'Bacterial', emoji: '🟠', color: '#f97316' },
  viral: { label: 'Viral', emoji: '🟣', color: '#8b5cf6' },
  pest: { label: 'Pest', emoji: '🐛', color: '#eab308' },
  nutrient: { label: 'Nutrient', emoji: '🟡', color: '#f59e0b' },
  weed: { label: 'Weed', emoji: '🌿', color: '#84cc16' },
};

const SEVERITY_META: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: '#10b981' },
  medium: { label: 'Medium', color: '#f59e0b' },
  high: { label: 'High', color: '#dc2626' },
};

const DATASET_CATEGORIES: { id: ResearchDataset['category']; en: string; ar: string; fr: string; emoji: string }[] = [
  { id: 'classification', en: 'Image Classification',       ar: 'تصنيف الصور',          fr: 'Classification d\'images',   emoji: '🏷️' },
  { id: 'segmentation',   en: 'Semantic Segmentation',       ar: 'التقسيم الدلالي',      fr: 'Segmentation sémantique',  emoji: '✂️' },
  { id: 'detection',       en: 'Object Detection',            ar: 'كشف الأجسام',          fr: 'Détection d\'objets',       emoji: '🎯' },
  { id: 'instance_seg',    en: 'Instance Segmentation',       ar: 'تقسيم المثيلات',       fr: 'Seg. d\'instances',         emoji: '🔬' },
  { id: 'hyperspectral',   en: 'Hyperspectral / Multispectral', ar: 'فائق/متعدد الأطياف', fr: 'Hyperspectral',            emoji: '🌈' },
  { id: 'robotics',        en: 'Robotics & Navigation',       ar: 'الروبوتات والملاحة',   fr: 'Robotique',                emoji: '🤖' },
  { id: 'large_scale',     en: 'Large-Scale',                 ar: 'واسع النطاق',          fr: 'Grande échelle',           emoji: '📦' },
  { id: 'collectors',      en: 'Dataset Collectors',          ar: 'جامعو البيانات',        fr: 'Collecteurs',              emoji: '📚' },
  { id: 'tools',           en: 'Synthetic Data Tools',        ar: 'أدوات البيانات الاصطناعية', fr: 'Outils synthétiques',  emoji: '🛠️' },
];

type Tab = 'gallery' | 'datasets';

const TITLE: TrilingualString = {
  en: 'Disease & Weed Reference Gallery',
  ar: 'معرض مرجع الأمراض والحشائش',
  fr: 'Galerie de Référence Maladies & Adventices',
};

const DESC: TrilingualString = {
  en: 'Curated from PlantVillage (50K images) · PlantDoc · DeepWeeds · 35+ research datasets for ML model training.',
  ar: 'مختارات من PlantVillage (50 ألف صورة) وPlantDoc وDeepWeeds وأكثر من 35 مجموعة بيانات بحثية لتدريب نماذج تعلم آلي.',
  fr: 'Sélection issue de PlantVillage (50K images) · PlantDoc · DeepWeeds · 35+ jeux de données de recherche pour l\'entraînement de modèles ML.',
};

const PILL_LABEL: TrilingualString = { en: 'View:', ar: 'طريقة العرض:', fr: 'Vue :' };

export function DiseaseReferenceGallery() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);
  const [tab, setTab] = useState<Tab>('gallery');
  const [resetKey, setResetKey] = useState(0);

  const handleReset = () => {
    setTab('gallery');
    setResetKey(k => k + 1);
    toast({ title: tr('Filters reset', 'تمت إعادة التعيين', 'Filtres réinitialisés') });
  };

  const pills: CalculatorPill[] = [
    { key: 'gallery',  emoji: '🐛', label: tr(`Gallery (${DISEASE_REFS.length})`, `المعرض (${DISEASE_REFS.length})`, `Galerie (${DISEASE_REFS.length})`) },
    { key: 'datasets', emoji: '📚', label: tr(`Datasets (${RESEARCH_DATASETS.length})`, `مجموعات البيانات (${RESEARCH_DATASETS.length})`, `Datasets (${RESEARCH_DATASETS.length})`) },
  ];

  return (
    <CalculatorShell
      icon={Bug}
      title={TITLE}
      description={DESC}
      badge="PlantVillage · DeepWeeds"
      accent="rose"
      actions={[
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      pills={pills}
      activePill={tab}
      onPillClick={(k) => setTab(k as Tab)}
      pillLabel={PILL_LABEL}
    >
      <div className="lg:col-span-12">
        {tab === 'gallery' && <GalleryTab key={`gallery-${resetKey}`} />}
        {tab === 'datasets' && <DatasetsTab key={`datasets-${resetKey}`} />}
      </div>
    </CalculatorShell>
  );
}

// ============================================================================
// Gallery Tab
// ============================================================================

function GalleryTab() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [cropFilter, setCropFilter] = useState<string>('all');

  const crops = useMemo(() => {
    const set = new Set(DISEASE_REFS.map(d => d.crop));
    return ['all', ...Array.from(set).sort()];
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return DISEASE_REFS.filter(d => {
      if (typeFilter !== 'all' && d.type !== typeFilter) return false;
      if (cropFilter !== 'all' && d.crop !== cropFilter) return false;
      if (q) {
        const hay = `${d.crop} ${d.disease} ${d.diseaseAr ?? ''} ${d.symptoms} ${d.visualDescription}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [search, typeFilter, cropFilter]);

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={tr('Search disease, symptom, weed…', 'ابحث عن مرض أو عرض أو حشيشة…', 'Rechercher maladie, symptôme, adventice…')} className="h-10 pl-9 text-sm" />
        </div>
        <select value={cropFilter} onChange={e => setCropFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          {crops.map(c => <option key={c} value={c}>{c === 'all' ? tr('All crops', 'كل المحاصيل', 'Toutes cultures') : copyFor(language, c, CROP_AR[c] ?? c, CROP_FR[c] ?? c)}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="all">{tr('All types', 'كل الأنواع', 'Tous types')}</option>
          {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.emoji} {copyFor(language, v.label, TYPE_AR[k] ?? v.label, TYPE_FR[k] ?? v.label)}</option>)}
        </select>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{tr(`${filtered.length} reference${filtered.length !== 1 ? 's' : ''} found`, `تم العثور على ${filtered.length} مرجع`, `${filtered.length} référence${filtered.length !== 1 ? 's' : ''}`)}</span>
        <span className="rounded-full bg-muted px-2 py-1">{tr('Browse by crop or type', 'تصفح حسب المحصول أو النوع', 'Parcourir par culture ou type')}</span>
      </div>

      {/* Gallery cards */}
      <div className="grid max-h-[520px] grid-cols-1 gap-3 overflow-y-auto rounded-xl border bg-muted/10 p-2 sm:grid-cols-2">
        {filtered.map(d => <GalleryCard key={d.id} ref={d} />)}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
          <Microscope className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          {tr('No references found. Try a different search.', 'لم يتم العثور على مراجع. جرّب بحثاً مختلفاً.', 'Aucune référence trouvée. Essayez une autre recherche.')}
        </div>
      )}

      <div className="rounded-lg border border-dashed bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
        {tr(
          'Reference photos from PlantVillage (50K images), PlantDoc (2.5K), and DeepWeeds (17.5K). Click "View photos" to browse the original dataset.',
          'صور مرجعية من PlantVillage (50 ألف صورة) وPlantDoc (2.5 ألف) وDeepWeeds (17.5 ألف). اضغط «عرض الصور» لتصفح مجموعة البيانات الأصلية.',
          'Photos de référence issues de PlantVillage (50K), PlantDoc (2.5K) et DeepWeeds (17.5K). Cliquez sur « Voir les photos » pour parcourir le dataset original.',
        )}
      </div>
    </div>
  );
}

function GalleryCard({ ref: d }: { ref: DiseaseRef }) {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);
  const typeMeta = TYPE_META[d.type];
  const sevMeta = SEVERITY_META[d.severity];

  return (
    <div className="space-y-3 rounded-xl border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">{d.cropEmoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold leading-tight">{copyFor(language, d.disease, d.diseaseAr ?? DISEASE_AR[d.id] ?? d.disease, d.disease)}</span>
            {d.diseaseAr && <span className="text-[10px] text-muted-foreground" dir="rtl">{d.diseaseAr}</span>}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{copyFor(language, d.crop, CROP_AR[d.crop] ?? d.crop, CROP_FR[d.crop] ?? d.crop)}</div>
        </div>
        <Badge className="text-[9px] shrink-0" style={{ backgroundColor: typeMeta.color + '20', color: typeMeta.color }}>
          {typeMeta.emoji} {copyFor(language, typeMeta.label, TYPE_AR[d.type] ?? typeMeta.label, TYPE_FR[d.type] ?? typeMeta.label)}
        </Badge>
      </div>

      <div className="text-[10px] text-muted-foreground">
        <strong className="text-foreground/80">{tr('Symptoms:', 'الأعراض:', 'Symptômes :')}</strong> {copyFor(language, d.symptoms, 'الأعراض موثقة في المرجع العلمي لهذا المرض.', d.symptoms)}
      </div>
      <div className="text-[10px] text-muted-foreground italic">
        <strong className="text-foreground/80 not-italic">{tr('Visual:', 'الوصف المرئي:', 'Visuel :')}</strong> {copyFor(language, d.visualDescription, 'الوصف المرئي موثق في المرجع العلمي لهذا المرض.', d.visualDescription)}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[9px]" style={{ borderColor: sevMeta.color, color: sevMeta.color }}>
            {copyFor(language, `${sevMeta.label} severity`, `${SEVERITY_AR[d.severity] ?? sevMeta.label} الشدة`, `${SEVERITY_FR[d.severity] ?? sevMeta.label} sévérité`)}
          </Badge>
          <span className="text-[9px] text-muted-foreground">{copyFor(language, `${d.imageCount.toLocaleString()} images`, `${d.imageCount.toLocaleString()} صورة`, `${d.imageCount.toLocaleString()} images`)}</span>
        </div>
        <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1 rounded-md px-2 text-sm text-blue-600 hover:bg-blue-50 hover:underline dark:hover:bg-blue-950/30">
          {tr('View photos', 'عرض الصور', 'Voir les photos')} <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    </div>
  );
}

// ============================================================================
// Datasets Tab
// ============================================================================

function DatasetsTab() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return RESEARCH_DATASETS.filter(d => {
      if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
      if (q) {
        const hay = `${d.name} ${d.description} ${d.modalities} ${d.size}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [search, categoryFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={tr('Search datasets by name, description, modality…', 'ابحث في مجموعات البيانات بالاسم أو الوصف أو النمط…', 'Rechercher datasets par nom, description, modalité…')} className="h-10 pl-9 text-sm" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="all">{tr('All categories', 'كل الفئات', 'Toutes catégories')}</option>
          {DATASET_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {tr(c.en, c.ar, c.fr)}</option>)}
        </select>
      </div>

      <div className="text-[10px] text-muted-foreground">{tr(`${filtered.length} dataset${filtered.length !== 1 ? 's' : ''}`, `${filtered.length} مجموعة بيانات`, `${filtered.length} dataset${filtered.length !== 1 ? 's' : ''}`)}</div>

      <div className="max-h-[520px] space-y-2 overflow-y-auto rounded-xl border bg-muted/10 p-2">
        {filtered.map(d => <DatasetCard key={d.id} dataset={d} />)}
      </div>

      <div className="rounded-lg border border-dashed bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
        {tr(
          'These datasets can train ML models for weed detection, disease identification, fruit counting, and robotic navigation. Use AgML (Python framework) for standardized access.',
          'يمكن استخدام هذه المجموعات لتدريب نماذج تعلم آلي لكشف الحشائش وتحديد الأمراض وعدّ الثمار والملاحة الروبوتية. استخدم AgML (إطار Python) للوصول الموحّد.',
          'Ces datasets peuvent entraîner des modèles ML pour la détection d\'adventices, l\'identification de maladies, le comptage de fruits et la navigation robotique. Utilisez AgML (framework Python) pour un accès standardisé.',
        )}
      </div>
    </div>
  );
}

function DatasetCard({ dataset: d }: { dataset: ResearchDataset }) {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);
  const cat = DATASET_CATEGORIES.find(c => c.id === d.category);
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="text-lg shrink-0">{cat?.emoji ?? '📊'}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold">{d.name}</span>
          <Badge variant="outline" className="text-[9px]">{cat ? tr(cat.en, cat.ar, cat.fr) : ''}</Badge>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{d.description}</p>
        <div className="flex items-center gap-3 mt-1 text-[9px] text-muted-foreground">
          <span>📊 {d.size}</span>
          <span>📡 {d.modalities}</span>
        </div>
      </div>
      <a href={d.url} target="_blank" rel="noopener noreferrer" aria-label={tr(`Open ${d.name}`, `فتح ${d.name}`, `Ouvrir ${d.name}`)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-blue-600 hover:bg-blue-50 hover:text-blue-800 dark:hover:bg-blue-950/30">
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
