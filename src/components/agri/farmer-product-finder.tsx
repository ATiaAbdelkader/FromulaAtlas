'use client';

/**
 * FarmerProductFinder — a simple, plain-language product browser for
 * Farmer-level users. Hides complex technical filters; lets the farmer
 * say "I have [crop] and [problem]" and see matching products.
 *
 * Data: /data/phyto-2017-index-enriched.json (1,264 INPV 2017 products)
 *
 * Layout:
 *   1. Step 1 — "What's your crop?" (chip picker, top 12 crops)
 *   2. Step 2 — "What's the problem?" (chip picker, top 12 pests)
 *   3. Results — plain-language product cards showing:
 *        - Brand name + section emoji
 *        - "Use this for: [pest] on [crop]"
 *        - "Dose: [range]" + "Wait [N] days before harvest"
 *        - Bee/aquatic toxicity warning badges
 *        - Homologation number (for traceability)
 *   4. Safety banner — INPV 2017 caveat + link to full Active Matter Selector
 *
 * All trilingual (EN/FR/AR via copyFor).
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Search, Sprout, Bug, Droplets, Clock, Hash, ChevronRight, RefreshCw } from 'lucide-react';
import { useTranslation, copyFor } from '@/lib/language-store';
import { fetchEnrichedPhytoIndex, summarizeProduct, normPhyto, type EnrichedPhytoProduct } from '@/lib/phyto-enriched';

// Top crops offered as quick chips (English names that match `crops` field)
const TOP_CROPS = [
  { en: 'Citrus', fr: 'Agrumes', ar: 'الحمضيات', emoji: '🍊' },
  { en: 'Tomato', fr: 'Tomate', ar: 'الطماطم', emoji: '🍅' },
  { en: 'Potato', fr: 'Pomme de terre', ar: 'البطاطا', emoji: '🥔' },
  { en: 'Vine', fr: 'Vigne', ar: 'الكروم', emoji: '🍇' },
  { en: 'Olive', fr: 'Olivier', ar: 'الزيتون', emoji: '🫒' },
  { en: 'Cereals', fr: 'Céréales', ar: 'الحبوب', emoji: '🌾' },
  { en: 'Vegetable crops', fr: 'Cultures maraîchères', ar: 'الخضروات', emoji: '🥬' },
  { en: 'Fruit trees', fr: 'Arbres fruitiers', ar: 'الأشجار المثمرة', emoji: '🍎' },
  { en: 'Cucurbits', fr: 'Cucurbitacées', ar: 'القرعيات', emoji: '🍉' },
  { en: 'Strawberry', fr: 'Fraisier', ar: 'الفراولة', emoji: '🍓' },
  { en: 'Pepper', fr: 'Poivron', ar: 'الفلفل', emoji: '🫑' },
  { en: 'Onion', fr: 'Oignon', ar: 'البصل', emoji: '🧅' },
];

// Top pests (French names that match `pests` field — used as canonical keys)
const TOP_PESTS = [
  { fr: 'Pucerons', en: 'Aphids', ar: 'المنّ' },
  { fr: 'Thrips', en: 'Thrips', ar: 'التربس' },
  { fr: 'Aleurodes', en: 'Whiteflies', ar: 'الذباب الأبيض' },
  { fr: 'Mineuse', en: 'Leafminers', ar: 'حادّة الأوراق' },
  { fr: 'Acariens', en: 'Mites', ar: 'العث' },
  { fr: 'Cochenille', en: 'Scale insects', ar: 'الحشرات القشرية' },
  { fr: 'Mouche des fruits', en: 'Fruit flies', ar: 'ذبابة الفاكهة' },
  { fr: 'Punaise', en: 'Bugs', ar: 'البق' },
  { fr: 'Noctuelles', en: 'Armyworms', ar: 'دودة الليل' },
  { fr: 'Chenilles', en: 'Caterpillars', ar: 'اليرقات' },
];

const SECTIONS = [
  { id: 'INSECTICIDES', emoji: '🐛', en: 'Insecticide', fr: 'Insecticide', ar: 'مبيد حشرات' },
  { id: 'FONGICIDES', emoji: '🦠', en: 'Fungicide', fr: 'Fongicide', ar: 'مبيد فطريات' },
  { id: 'HERBICIDES', emoji: '🌿', en: 'Herbicide', fr: 'Herbicide', ar: 'مبيد أعشاب' },
  { id: 'ACARICIDES', emoji: '🕷️', en: 'Acaricide', fr: 'Acaricide', ar: 'مبيد عث' },
];

const PAGE_SIZE = 12;

export function FarmerProductFinder() {
  const { language, isRTL } = useTranslation();
  const [products, setProducts] = useState<EnrichedPhytoProduct[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [selectedPest, setSelectedPest] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    let alive = true;
    fetchEnrichedPhytoIndex()
      .then((list) => { if (alive) { setProducts(list); setLoading(false); } })
      .catch((e) => { if (alive) { setError(e.message); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  const tr = (en: string, fr: string, ar: string) => copyFor(language, en, ar, fr);

  // Apply filters
  const filtered = useMemo(() => {
    if (!products) return [];
    const q = normPhyto(searchQuery.trim());
    return products.filter((p) => {
      // Must have at least one structured usage entry (skip empty rows)
      if (p.usage_structured.length === 0) return false;
      // Must have either a crop or pest identified (skip unreconstructable rows)
      if (p.crops.length === 0 && p.pests.length === 0) return false;
      if (selectedCrop && !p.crops.includes(selectedCrop)) return false;
      if (selectedPest) {
        const pestLow = selectedPest.toLowerCase();
        if (!p.pests.some((pp) => pp.toLowerCase().includes(pestLow))) return false;
      }
      if (selectedSection && p.section !== selectedSection) return false;
      if (q) {
        const hay = normPhyto(`${p.brand} ${p.active_substance} ${p.active_raw} ${p.company}`);
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, selectedCrop, selectedPest, selectedSection, searchQuery]);

  const reset = () => {
    setSelectedCrop(null);
    setSelectedPest(null);
    setSelectedSection(null);
    setSearchQuery('');
    setVisible(PAGE_SIZE);
  };

  const shown = filtered.slice(0, visible);

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <Card className="border-emerald-200/60 dark:border-emerald-900/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sprout className="h-4 w-4 text-emerald-600" />
            {tr('Find the Right Product', 'Trouver le bon produit', 'اعثر على المنتج المناسب')}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {products
              ? tr(
                  `${products.length} INPV-registered products (2017). Pick your crop and problem — we'll show matching options with doses and harvest-wait times.`,
                  `${products.length} produits homologués INPV (2017). Choisissez votre culture et votre problème — nous afficherons les options avec doses et délais avant récolte.`,
                  `${products.length} منتج مسجّل لدى INPV (2017). اختر محصولك ومشكلتك — سنعرض الخيارات مع الجرعات وفترات الانتظار قبل الحصاد.`,
                )
              : tr('Loading products…', 'Chargement des produits…', 'جارٍ تحميل المنتجات…')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 p-3 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">{tr('Could not load products', 'Impossible de charger les produits', 'تعذّر تحميل المنتجات')}</div>
                <div className="opacity-80 mt-1">{error}</div>
              </div>
            </div>
          )}

          {/* Step 1: Crop picker */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              {tr('Step 1 — What crop do you have?', 'Étape 1 — Quelle culture?', 'الخطوة 1 — ما هو محصولك؟')}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TOP_CROPS.map((c) => {
                const active = selectedCrop === c.en;
                return (
                  <button
                    key={c.en}
                    onClick={() => { setSelectedCrop(active ? null : c.en); setVisible(PAGE_SIZE); }}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                      active
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-card border-border hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                    }`}
                  >
                    <span>{c.emoji}</span>
                    <span>{language === 'ar' ? c.ar : language === 'fr' ? c.fr : c.en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Problem picker */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              {tr('Step 2 — What is the problem?', 'Étape 2 — Quel est le problème?', 'الخطوة 2 — ما هي المشكلة؟')}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TOP_PESTS.map((p) => {
                const active = selectedPest === p.fr;
                return (
                  <button
                    key={p.fr}
                    onClick={() => { setSelectedPest(active ? null : p.fr); setVisible(PAGE_SIZE); }}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                      active
                        ? 'bg-red-600 text-white border-red-600 shadow-sm'
                        : 'bg-card border-border hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                    }`}
                  >
                    <Bug className="h-3 w-3" />
                    <span>{language === 'ar' ? p.ar : language === 'fr' ? p.fr : p.en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section filter (optional, smaller) */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              {tr('Product type (optional)', 'Type de produit (optionnel)', 'نوع المنتج (اختياري)')}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SECTIONS.map((s) => {
                const active = selectedSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedSection(active ? null : s.id); setVisible(PAGE_SIZE); }}
                    className={`text-[11px] px-2 py-0.5 rounded border transition-all flex items-center gap-1 ${
                      active
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-card border-border hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30'
                    }`}
                  >
                    <span>{s.emoji}</span>
                    <span>{language === 'ar' ? s.ar : language === 'fr' ? s.fr : s.en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Free-text search */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              {tr('Or search by name / active substance', 'Ou chercher par nom / matière active', 'أو ابحث بالاسم / المادة الفعالة')}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setVisible(PAGE_SIZE); }}
                placeholder={tr('e.g. abamectin, actara…', 'ex. abamectine, actara…', 'مثال: abamectin، actara…')}
                className="h-9 pl-9 text-xs"
              />
            </div>
          </div>

          {/* Result count + reset */}
          <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 p-2">
            <Badge variant="secondary" className="text-[10px]">
              {filtered.length} {tr('matching products', 'produits correspondants', 'منتج مطابق')}
            </Badge>
            {(selectedCrop || selectedPest || selectedSection || searchQuery) && (
              <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={reset}>
                <RefreshCw className="h-3 w-3 mr-1" />
                {tr('Reset', 'Réinitialiser', 'إعادة ضبط')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <Card><CardContent className="py-8 text-center text-xs text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
          {tr('Loading INPV products…', 'Chargement des produits INPV…', 'جارٍ تحميل منتجات INPV…')}
        </CardContent></Card>
      ) : shown.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-xs text-muted-foreground">
          <Search className="h-6 w-6 mx-auto mb-2 opacity-50" />
          {tr(
            'No products match. Try removing a filter or use the search box.',
            'Aucun produit ne correspond. Essayez de retirer un filtre ou d\'utiliser la recherche.',
            'لا يوجد منتج مطابق. جرّب إزالة مرشّح أو استخدم مربع البحث.',
          )}
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {shown.map((p) => (
            <ProductCard key={`${p.homologation}-${p.brand}-${p.page}`} product={p} language={language} />
          ))}
          {shown.length < filtered.length && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                {tr(`Show ${Math.min(PAGE_SIZE, filtered.length - shown.length)} more`, `Afficher ${Math.min(PAGE_SIZE, filtered.length - shown.length)} de plus`, `اعرض ${Math.min(PAGE_SIZE, filtered.length - shown.length)} إضافية`)}
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Safety banner */}
      <Card className="border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong>{tr('Important', 'Important', 'مهم')}:</strong>{' '}
            {tr(
              'This index is from 2017. Some products may have been withdrawn, renewed, or had their conditions changed. Always verify the current homologation with INPV before use. Read the product label carefully and follow all safety instructions.',
              'Cet index date de 2017. Certains produits ont pu être retirés, renouvelés ou modifiés. Vérifiez toujours l\'homologation actuelle auprès de l\'INPV avant usage. Lisez attentivement l\'étiquette et respectez les consignes de sécurité.',
              'هذا الفهرس يعود لسنة 2017. بعض المنتجات قد تكون سُحبت أو جُدّدت أو عُدّلت. تحقّق دائماً من الترخيص الحالي لدى INPV قبل الاستعمال. اقرأ ملصق المنتج بعناية واتبع تعليمات السلامة.',
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// ProductCard — plain-language summary
// ============================================================================

function ProductCard({ product, language }: { product: EnrichedPhytoProduct; language: 'en' | 'fr' | 'ar' }) {
  const summary = summarizeProduct(product, language);
  const tr = (en: string, fr: string, ar: string) => copyFor(language, en, ar, fr);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 space-y-2">
        {/* Header: emoji + brand + section badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl">{summary.emoji}</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{summary.brand}</div>
              <div className="text-[10px] text-muted-foreground">
                {summary.sectionLabel} · <span className="font-mono">{summary.activeSubstance}</span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="text-[9px] font-mono shrink-0">
            <Hash className="h-2.5 w-2.5 mr-0.5" />
            {summary.homologation}
          </Badge>
        </div>

        {/* For: crop + pest */}
        {(summary.crops.length > 0 || summary.pests.length > 0) && (
          <div className="rounded-lg bg-muted/40 p-2 text-[11px]">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Sprout className="h-3 w-3" />
              {tr('Use for', 'À utiliser pour', 'يُستعمل لـ')}:
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {summary.pests.slice(0, 4).map((p) => (
                <Badge key={p} variant="secondary" className="text-[9px] bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300">
                  {p}
                </Badge>
              ))}
              {summary.crops.slice(0, 4).map((c) => (
                <Badge key={c} variant="secondary" className="text-[9px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Dose + DAR */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-lg border border-border/60 bg-card p-2">
            <div className="text-muted-foreground flex items-center gap-1">
              <Droplets className="h-3 w-3" />
              {tr('Dose', 'Dose', 'الجرعة')}
            </div>
            <div className="text-sm font-bold mt-0.5 font-mono">{summary.doseRange}</div>
          </div>
          <div className={`rounded-lg border p-2 ${
            summary.darRange === '—'
              ? 'border-border/60 bg-card'
              : 'border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800'
          }`}>
            <div className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {tr('Wait before harvest', 'Attendre avant récolte', 'انتظر قبل الحصاد')}
            </div>
            <div className="text-sm font-bold mt-0.5">
              {summary.darRange === '—'
                ? tr('Not specified', 'Non spécifié', 'غير محدّد')
                : summary.darRange}
            </div>
          </div>
        </div>

        {/* Toxicity warnings */}
        {(summary.toxicToBees || summary.toxicToAquatic) && (
          <div className="flex flex-wrap gap-1.5">
            {summary.toxicToBees && (
              <Badge variant="outline" className="text-[9px] border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                🐝 {tr('Toxic to bees', 'Toxique pour les abeilles', 'سامّ للنحل')}
              </Badge>
            )}
            {summary.toxicToAquatic && (
              <Badge variant="outline" className="text-[9px] border-blue-400 bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                🐟 {tr('Toxic to aquatic life', 'Toxique pour la vie aquatique', 'سامّ للكائنات المائية')}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
