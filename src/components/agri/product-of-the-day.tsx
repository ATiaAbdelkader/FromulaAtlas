'use client';

/**
 * ProductOfTheDay — rotates one INPV-registered product per day on the
 * Farmer Home dashboard. The product is chosen to be relevant to the
 * current month (seasonal pest pressure) and to the farmer's chosen
 * crop if a profile is set.
 *
 * Selection algorithm:
 *   1. Pool: all products with at least one structured usage entry.
 *   2. Filter: prefer products whose crops include the farmer's crop
 *      (from the saved farm profile, if any).
 *   3. Filter: prefer products whose pests match a pest active in the
 *      current month (from PEST_BIOFIX calendar in algeria-agri-calendar-data).
 *   4. If still empty, fall back to all products in the INSECTICIDES
 *      section (always non-empty, useful year-round).
 *   5. Pick: index by day-of-year so the same product shows all day,
 *      but rotates the next day. Stable + shareable.
 *
 * Output: a compact card with:
 *   - Brand + section emoji
 *   - Active substance + concentration
 *   - "Good for: [crop] · [pest]"
 *   - Dose + harvest-wait
 *   - 🐝 / 🐟 toxicity badges
 *   - "View all products →" link that opens the Product Finder
 *
 * Trilingual (EN/FR/AR via copyFor).
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, ChevronRight, Droplets, Clock, Hash } from 'lucide-react';
import { useTranslation, copyFor } from '@/lib/language-store';
import {
  fetchEnrichedPhytoIndex, summarizeProduct, type EnrichedPhytoProduct,
} from '@/lib/phyto-enriched';
import { CROP_LIFECYCLES } from '@/lib/crop-lifecycle';

// Inlined minimal pest biofix calendar (subset of
// algeria-agri-calendar-data.ts — kept here to avoid coupling this
// single component to the separate calendar library, which is on
// a feature branch).
const PEST_SEASONAL_WINDOWS: { pestKeywords: string[]; months: number[] }[] = [
  // Olive fruit fly — June to October
  { pestKeywords: ['mouche', 'fly', 'olive'], months: [5, 6, 7, 8, 9] },
  // Locust — March to July
  { pestKeywords: ['locust', 'criquet'], months: [2, 3, 4, 5, 6] },
  // Citrus scale — May to October
  { pestKeywords: ['cochenille', 'scale'], months: [4, 5, 6, 7, 8, 9] },
  // Aphids — spring & autumn peaks
  { pestKeywords: ['pucerons', 'aphids', 'puceron'], months: [2, 3, 4, 5, 9, 10] },
  // Thrips — summer
  { pestKeywords: ['thrips'], months: [4, 5, 6, 7, 8] },
  // Whiteflies — summer
  { pestKeywords: ['aleurodes', 'whitefly'], months: [4, 5, 6, 7, 8] },
  // Leafminers — spring to autumn
  { pestKeywords: ['mineuse', 'leafminer'], months: [3, 4, 5, 6, 7, 8, 9] },
  // Mites — hot dry months
  { pestKeywords: ['acariens', 'mites', 'mite'], months: [5, 6, 7, 8] },
  // Fruit flies — late summer
  { pestKeywords: ['mouche des fruits'], months: [6, 7, 8, 9] },
  // Caterpillars / noctuelles — spring and autumn
  { pestKeywords: ['chenilles', 'noctuelles', 'caterpillar'], months: [3, 4, 5, 9, 10] },
];

// Map INPV product `crops` (English labels) to crop-lifecycle IDs
// so we can match the farmer's profile crop to product crops.
const CROP_LABEL_TO_LIFECYCLE_ID: Record<string, string> = {
  'Citrus': 'citrus',
  'Tomato': 'tomato',
  'Potato': 'potato',
  'Vine': 'vine',
  'Olive': 'olive',
  'Cereals': 'wheat',
  'Vegetable crops': 'tomato', // generic
  'Fruit trees': 'apple',
  'Cucurbits': 'cucumber',
  'Strawberry': 'strawberry',
  'Pepper': 'bell-pepper',
  'Onion': 'onion',
  'Apple': 'apple',
  'Pear': 'apple',
  'Peach': 'apple', // stone fruit
  'Apricot': 'apple',
  'Almond': 'almond',
  'Date palm': 'datepalm',
  'Wheat': 'wheat',
  'Barley': 'barley',
  'Maize': 'maize',
  'Alfalfa': 'alfalfa',
  'Sunflower': 'sunflower',
  'Canola': 'canola',
  'Rice': 'rice',
  'Sorghum': 'sorghum',
  'Cotton': 'cotton',
};

// Reversed map: lifecycle ID → list of crop labels to match
const LIFECYCLE_ID_TO_LABELS: Record<string, string[]> = {};
for (const [label, id] of Object.entries(CROP_LABEL_TO_LIFECYCLE_ID)) {
  if (!LIFECYCLE_ID_TO_LABELS[id]) LIFECYCLE_ID_TO_LABELS[id] = [];
  LIFECYCLE_ID_TO_LABELS[id].push(label);
}

interface ProductOfTheDayProps {
  /** Optional: callback when user clicks 'View all products' */
  onViewAll?: () => void;
}

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}

export function ProductOfTheDay({ onViewAll }: ProductOfTheDayProps) {
  const { language, isRTL } = useTranslation();
  const [products, setProducts] = useState<EnrichedPhytoProduct[] | null>(null);
  const [profileCrop, setProfileCrop] = useState<string | undefined>(undefined);

  // Load farm profile (to know which crop the farmer grows)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('farm_profile_v1');
      if (raw) {
        const p = JSON.parse(raw);
        if (p.crop) setProfileCrop(p.crop);
      }
    } catch { /* ignore */ }
  }, []);

  // Load INPV products (cached by fetchEnrichedPhytoIndex)
  useEffect(() => {
    let alive = true;
    fetchEnrichedPhytoIndex()
      .then((list) => { if (alive) setProducts(list); })
      .catch(() => { /* silent */ });
    return () => { alive = false; };
  }, []);

  // Pick today's product
  const todayProduct = useMemo(() => {
    if (!products || products.length === 0) return null;
    const now = new Date();
    const monthIdx = now.getMonth();
    const doy = dayOfYear(now);

    // Step 1: pool — products with structured usage
    let pool = products.filter((p) => p.usage_structured.length > 0 && (p.crops.length > 0 || p.pests.length > 0));
    if (pool.length === 0) return null;

    // Step 2: prefer products matching the farmer's crop
    const farmerLabels = profileCrop ? (LIFECYCLE_ID_TO_LABELS[profileCrop] ?? []) : [];
    let cropMatches = farmerLabels.length > 0
      ? pool.filter((p) => p.crops.some((c) => farmerLabels.includes(c)))
      : [];
    if (cropMatches.length === 0) cropMatches = pool;

    // Step 3: prefer products whose pests are active this month
    const activePestKeywords = PEST_SEASONAL_WINDOWS
      .filter((pw) => pw.months.includes(monthIdx))
      .flatMap((pw) => pw.pestKeywords);
    let monthMatches = activePestKeywords.length > 0
      ? cropMatches.filter((p) => p.pests.some((pp) => {
          const pLow = pp.toLowerCase();
          return activePestKeywords.some((k) => pLow.includes(k));
        }))
      : [];
    if (monthMatches.length === 0) monthMatches = cropMatches;

    // Step 4: stable pick by day-of-year
    const idx = doy % monthMatches.length;
    return monthMatches[idx];
  }, [products, profileCrop]);

  if (!todayProduct) {
    // Silent placeholder while loading or no data
    return null;
  }

  const summary = summarizeProduct(todayProduct, language);
  const tr = (en: string, fr: string, ar: string) => copyFor(language, en, ar, fr);
  const today = new Date().toLocaleDateString(language === 'ar' ? 'ar' : language === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long' });

  return (
    <Card className="border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50 to-green-50/50 dark:from-emerald-950/30 dark:to-green-950/20 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Big emoji + sparkles badge */}
          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-white shadow-sm dark:bg-card">
            <span className="text-2xl leading-none">{summary.emoji}</span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                {tr('Product of the Day', 'Produit du jour', 'منتج اليوم')} · {today}
              </span>
            </div>

            {/* Brand + active substance */}
            <div className="text-sm font-bold truncate">{summary.brand}</div>
            <div className="text-[11px] text-muted-foreground">
              {summary.sectionLabel} · <span className="font-mono">{summary.activeSubstance}</span>
              {todayProduct.concentration && <span> · {todayProduct.concentration}</span>}
            </div>

            {/* "Good for" row */}
            {(summary.pests.length > 0 || summary.crops.length > 0) && (
              <div className="mt-2 flex flex-wrap gap-1">
                {summary.pests.slice(0, 2).map((p) => (
                  <Badge key={p} variant="secondary" className="text-[9px] bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 py-0 px-1">
                    {p}
                  </Badge>
                ))}
                {summary.crops.slice(0, 2).map((c) => (
                  <Badge key={c} variant="secondary" className="text-[9px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 py-0 px-1">
                    {c}
                  </Badge>
                ))}
              </div>
            )}

            {/* Dose + DAR */}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="text-[10px]">
                <div className="text-muted-foreground flex items-center gap-1">
                  <Droplets className="h-2.5 w-2.5" />
                  {tr('Dose', 'Dose', 'الجرعة')}
                </div>
                <div className="font-mono font-semibold">{summary.doseRange}</div>
              </div>
              <div className="text-[10px]">
                <div className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {tr('Wait before harvest', 'Attendre avant récolte', 'انتظر قبل الحصاد')}
                </div>
                <div className="font-semibold">{summary.darRange}</div>
              </div>
            </div>

            {/* Toxicity badges */}
            {(summary.toxicToBees || summary.toxicToAquatic) && (
              <div className="mt-2 flex flex-wrap gap-1">
                {summary.toxicToBees && (
                  <Badge variant="outline" className="text-[9px] border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 py-0 px-1">
                    🐝 {tr('Toxic to bees', 'Toxique pour les abeilles', 'سامّ للنحل')}
                  </Badge>
                )}
                {summary.toxicToAquatic && (
                  <Badge variant="outline" className="text-[9px] border-blue-400 bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300 py-0 px-1">
                    🐟 {tr('Toxic to aquatic', 'Toxique aquatique', 'سامّ مائياً')}
                  </Badge>
                )}
              </div>
            )}

            {/* Footer: homologation + view all */}
            <div className="mt-2 flex items-center justify-between gap-2">
              <Badge variant="outline" className="text-[9px] font-mono py-0 px-1">
                <Hash className="h-2 w-2 mr-0.5" />
                {summary.homologation}
              </Badge>
              {onViewAll && (
                <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-0.5 px-1" onClick={onViewAll}>
                  {tr('View all products', 'Tous les produits', 'كل المنتجات')}
                  <ChevronRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
