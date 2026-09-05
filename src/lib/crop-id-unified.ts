/**
 * Unified Crop ID Mapper
 *
 * Resolves crop ID mismatches across the 7 different crop ID systems
 * used in Formula Atlas:
 *
 * 1. CROP_LIFECYCLES (crop-lifecycle.ts)     — 'maize', 'wheat', 'bell-pepper'
 * 2. FARMPILOT_CROPS (farmpilot-data.ts)     — 'maize', 'wheat_durum', 'bell_pepper'
 * 3. CROP_LABELS (crop-localization.ts)      — 'maize', 'wheat', 'bell-pepper'
 * 4. ALGERIA_CROP_SUITABILITY_RULES          — 'wheat_durum', 'corn_grain', 'tomato_greenhouse'
 * 5. SeedRateCalculator CROP_SEEDS           — 'wheat', 'corn', 'rice', 'canola'
 * 6. CCMT/Makerere expanded diseases         — 'cashew', 'cassava', 'maize', 'tomato'
 * 7. CROP_PHENOLOGY_DATA (crop-phenology-data.ts) — 'durum-wheat', 'grapevine', 'date-palm'
 *
 * This file is the SINGLE SOURCE OF TRUTH for crop ID translation.
 * Components should NEVER write their own ad-hoc mappers (e.g.
 * `LIFECYCLE_TO_FARMPILOT` inline objects, nested ternaries on
 * `selectedLifecycleCrop === 'wheat' ? 'durum-wheat' : ...`).
 *
 * Provided:
 *   - A canonical crop ID (the CROP_LIFECYCLES format, which is the most complete)
 *   - Mappers to/from each system (toFarmPilotId, toSuitabilityId, toSeedRateId,
 *     toAlgeriaCalendarId, toPhenologyId — aliases of the same thing)
 *   - A unified resolver canonicalCropId() that accepts any ID from any system
 *   - Trilingual display name resolver cropDisplayName()
 */

// ---------------------------------------------------------------------------
// Canonical crop IDs (the "source of truth" — matches CROP_LIFECYCLES)
// ---------------------------------------------------------------------------

export type CanonicalCropId =
  | 'maize' | 'wheat' | 'rice' | 'soybean' | 'cotton'
  | 'tomato' | 'potato' | 'lettuce' | 'onion' | 'alfalfa'
  | 'coffee' | 'apple' | 'sunflower' | 'citrus' | 'sorghum'
  | 'barley' | 'canola' | 'bell-pepper' | 'cucumber' | 'grapes'
  // Added crops (not in CROP_LIFECYCLES but in other systems)
  | 'carrot' | 'strawberry' | 'date-palm' | 'cassava' | 'cashew'
  | 'olive' | 'pepper' | 'oil-palm';

// ---------------------------------------------------------------------------
// Aliases — maps non-canonical IDs to canonical ones
// ---------------------------------------------------------------------------

const CROP_ALIASES: Record<string, CanonicalCropId> = {
  // FarmPilot → canonical
  'wheat_durum': 'wheat',
  'bell_pepper': 'bell-pepper',
  'cucumber_greenhouse': 'cucumber',
  'date_palm': 'date-palm',

  // Algeria suitability → canonical
  'tomato_greenhouse': 'tomato',
  'corn_grain': 'maize',
  'corn': 'maize',

  // SeedRateCalculator → canonical
  // (already uses canonical: wheat, barley, corn→maize, soybean, rice, canola)

  // Common alternate names
  'durum_wheat': 'wheat',
  'bread_wheat': 'wheat',
  'durum-wheat': 'wheat',
  'field_corn': 'maize',
  'sweet_pepper': 'bell-pepper',
  'capsicum': 'bell-pepper',
  'lucerne': 'alfalfa',
  'rapeseed': 'canola',
  'oilseed_rape': 'canola',
  'grape': 'grapes',
  'grapevine': 'grapes',
  'vitis': 'grapes',
  'datepalm': 'date-palm',
  'phoenix': 'date-palm',
  'oil_palm': 'oil-palm',
  'oilpalm': 'oil-palm',
  'elaeis': 'oil-palm',
};

// ---------------------------------------------------------------------------
// Reverse aliases — maps canonical to the ID expected by each system
// ---------------------------------------------------------------------------

/** Maps a canonical crop ID to the FARMPILOT_CROPS ID (if different). */
export function toFarmPilotId(canonicalId: string): string {
  const reverse: Record<string, string> = {
    'wheat': 'wheat_durum',
    'bell-pepper': 'bell_pepper',
    'date-palm': 'date_palm',
  };
  return reverse[canonicalId] ?? canonicalId;
}

/** Maps a canonical crop ID to the ALGERIA_CROP_SUITABILITY_RULES ID. */
export function toSuitabilityId(canonicalId: string): string {
  const reverse: Record<string, string> = {
    'maize': 'corn_grain',
    'wheat': 'wheat_durum',
    'tomato': 'tomato_greenhouse',
    'date-palm': 'date_palm',
  };
  return reverse[canonicalId] ?? canonicalId;
}

/** Maps a canonical crop ID to the SeedRateCalculator ID. */
export function toSeedRateId(canonicalId: string): string {
  const reverse: Record<string, string> = {
    'maize': 'corn',
    'bell-pepper': 'bell-pepper',
  };
  return reverse[canonicalId] ?? canonicalId;
}

/**
 * Maps a canonical crop ID to the CROP_PHENOLOGY_DATA ID
 * (crop-phenology-data.ts — used by CropPhenologyTimeline and
 * AlgeriaCropCalendar). This ID system uses kebab-case with longer
 * names like 'durum-wheat', 'grapevine'.
 *
 * Also exported as `toPhenologyId` for readability at call sites that
 * specifically deal with phenology timelines.
 */
export function toAlgeriaCalendarId(canonicalId: string): string {
  const reverse: Record<string, string> = {
    'wheat': 'durum-wheat',
    'grapes': 'grapevine',
    // The following are already the same in both systems:
    // potato, tomato, olive, date-palm, citrus
  };
  return reverse[canonicalId] ?? canonicalId;
}

/** Alias for toAlgeriaCalendarId — same mapping, clearer name at phenology call sites. */
export const toPhenologyId = toAlgeriaCalendarId;

// ---------------------------------------------------------------------------
// Main resolver — takes any crop ID from any system, returns canonical
// ---------------------------------------------------------------------------

/**
 * Normalize any crop ID to the canonical form.
 * Falls back to the input if no alias is found (so unknown crops pass through).
 */
export function canonicalCropId(rawId: string): CanonicalCropId {
  const lower = rawId.toLowerCase().trim();
  // Direct match
  if (CROP_ALIASES[lower]) return CROP_ALIASES[lower];
  // Already canonical
  return lower as CanonicalCropId;
}

/**
 * Check if a crop ID is known in any system.
 */
export function isKnownCrop(rawId: string): boolean {
  const lower = rawId.toLowerCase().trim();
  return Boolean(CROP_ALIASES[lower]) || Boolean(CROP_LABELS_EXISTS[lower]);
}

// Quick check for canonical IDs that exist in CROP_LABELS
const CROP_LABELS_EXISTS: Record<string, boolean> = {
  maize: true, wheat: true, rice: true, soybean: true, cotton: true,
  tomato: true, potato: true, lettuce: true, onion: true, alfalfa: true,
  coffee: true, apple: true, sunflower: true, citrus: true, sorghum: true,
  barley: true, canola: true, 'bell-pepper': true, cucumber: true, grapes: true,
  cassava: true, cashew: true, carrot: true, strawberry: true, 'date-palm': true,
  olive: true, pepper: true, 'oil-palm': true,
};

// ---------------------------------------------------------------------------
// Trilingual display name resolver
// ---------------------------------------------------------------------------

/**
 * Get a trilingual display name for any crop ID from any system.
 * Uses crop-localization.ts's CROP_LABELS as the canonical label source,
 * with fallbacks for crops not in CROP_LABELS.
 */
export function cropDisplayName(
  rawId: string,
  language: 'en' | 'fr' | 'ar',
): { en: string; fr: string; ar: string } {
  const canonical = canonicalCropId(rawId);

  // Known trilingual labels (subset — the full list is in crop-localization.ts)
  const LABELS: Record<string, { en: string; fr: string; ar: string }> = {
    maize: { en: 'Maize', fr: 'Maïs', ar: 'الذرة' },
    wheat: { en: 'Wheat', fr: 'Blé', ar: 'القمح' },
    rice: { en: 'Rice', fr: 'Riz', ar: 'الأرز' },
    soybean: { en: 'Soybean', fr: 'Soja', ar: 'فول الصويا' },
    cotton: { en: 'Cotton', fr: 'Coton', ar: 'القطن' },
    tomato: { en: 'Tomato', fr: 'Tomate', ar: 'الطماطم' },
    potato: { en: 'Potato', fr: 'Pomme de terre', ar: 'البطاطا' },
    lettuce: { en: 'Lettuce', fr: 'Laitue', ar: 'الخس' },
    onion: { en: 'Onion', fr: 'Oignon', ar: 'البصل' },
    alfalfa: { en: 'Alfalfa', fr: 'Luzerne', ar: 'الفصة' },
    coffee: { en: 'Coffee', fr: 'Café', ar: 'القهوة' },
    apple: { en: 'Apple', fr: 'Pomme', ar: 'التفاح' },
    sunflower: { en: 'Sunflower', fr: 'Tournesol', ar: 'دوار الشمس' },
    citrus: { en: 'Citrus', fr: 'Agrumes', ar: 'الحمضيات' },
    sorghum: { en: 'Sorghum', fr: 'Sorgho', ar: 'الذرة الرفيعة' },
    barley: { en: 'Barley', fr: 'Orge', ar: 'الشعير' },
    canola: { en: 'Canola', fr: 'Colza', ar: 'الكانولا' },
    'bell-pepper': { en: 'Bell Pepper', fr: 'Poivron', ar: 'الفلفل الحلو' },
    cucumber: { en: 'Cucumber', fr: 'Concombre', ar: 'الخيار' },
    grapes: { en: 'Grapes', fr: 'Raisin', ar: 'العنب' },
    cassava: { en: 'Cassava', fr: 'Manioc', ar: 'الكاسافا' },
    cashew: { en: 'Cashew', fr: 'Anacardier', ar: 'الكاجو' },
    carrot: { en: 'Carrot', fr: 'Carotte', ar: 'الجزر' },
    strawberry: { en: 'Strawberry', fr: 'Fraise', ar: 'الفراولة' },
    'date-palm': { en: 'Date Palm', fr: 'Palmier dattier', ar: 'نخيل التمر' },
    'oil-palm': { en: 'Oil Palm', fr: 'Palmier à huile', ar: 'نخيل الزيت' },
    olive: { en: 'Olive', fr: 'Olivier', ar: 'الزيتون' },
    pepper: { en: 'Pepper', fr: 'Piment', ar: 'الفلفل' },
  };

  const label = LABELS[canonical];
  if (label) return label;

  // Fallback: return the raw ID as the display name
  return { en: rawId, fr: rawId, ar: rawId };
}

/**
 * Get a localized crop name in the user's language.
 */
export function localizedCropDisplayName(rawId: string, language: 'en' | 'fr' | 'ar'): string {
  return cropDisplayName(rawId, language)[language];
}
