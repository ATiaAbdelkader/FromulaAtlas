// Helpers for the ENRICHED INPV 2017 product index.
// Replaces phyto-index.ts for new consumers; the old file stays for backwards
// compatibility with InpvIndexBrowser.tsx.
//
// Each product now has:
//   - active_substance: cleaned name
//   - section_label: { en, fr, ar } — trilingual section name
//   - usage_structured: [{ crop, pest, dose, dar, raw }] — parsed entries
//   - crops: unique crop list (English)
//   - pests: unique pest list (French)
//   - doses: unique dose strings
//   - dars: unique DAR (Délai Avant Récolte) integers
//   - min_dar / max_dar: range of pre-harvest intervals
//   - toxic_to_bees: boolean
//   - toxic_to_aquatic: boolean
//   - usage_raw: original raw chunks (traceability)

export interface EnrichedUsageEntry {
  crop: string | null;
  pest: string | null;
  dose: string | null;
  dar: number | null;
  raw: string;
}

export interface EnrichedPhytoProduct {
  page: number;
  homologation: string;
  brand: string;
  active_substance: string;
  active_raw: string;
  concentration: string;
  formulation: string;
  section: string;
  section_label: { en: string; fr: string; ar: string };
  company: string;
  usage_structured: EnrichedUsageEntry[];
  crops: string[];
  pests: string[];
  doses: string[];
  dars: number[];
  min_dar: number | null;
  max_dar: number | null;
  toxic_to_bees: boolean;
  toxic_to_aquatic: boolean;
  usage_raw: string[];
}

export interface EnrichedIndex {
  source: string;
  source_pdf: string;
  generated: string;
  count: number;
  products: EnrichedPhytoProduct[];
}

let cache: Promise<EnrichedPhytoProduct[]> | null = null;

/** Fetch (once) the enriched INPV 2017 index. */
export function fetchEnrichedPhytoIndex(): Promise<EnrichedPhytoProduct[]> {
  if (!cache) {
    cache = fetch('/data/phyto-2017-index-enriched.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<EnrichedIndex>;
      })
      .then((d) => d.products ?? [])
      .catch((e) => {
        cache = null;
        throw e;
      });
  }
  return cache;
}

/** Filter products by crop (English name) and/or pest. */
export function filterProducts(
  products: EnrichedPhytoProduct[],
  opts: { crop?: string; pest?: string; section?: string; activeSubstance?: string },
): EnrichedPhytoProduct[] {
  return products.filter((p) => {
    if (opts.section && p.section !== opts.section) return false;
    if (opts.crop && !p.crops.includes(opts.crop)) return false;
    if (opts.pest) {
      const pestLow = opts.pest.toLowerCase();
      if (!p.pests.some((pp) => pp.toLowerCase().includes(pestLow))) return false;
    }
    if (opts.activeSubstance) {
      const subLow = opts.activeSubstance.toLowerCase();
      if (
        !p.active_substance.toLowerCase().includes(subLow) &&
        !p.active_raw.toLowerCase().includes(subLow)
      ) {
        return false;
      }
    }
    return true;
  });
}

/** Build a plain-language summary for Farmer mode. */
export interface ProductSummary {
  brand: string;
  activeSubstance: string;
  sectionLabel: string;
  emoji: string;
  crops: string[];
  pests: string[];
  doseRange: string;
  darRange: string;
  toxicToBees: boolean;
  toxicToAquatic: boolean;
  homologation: string;
}

export function summarizeProduct(p: EnrichedPhytoProduct, language: 'en' | 'fr' | 'ar'): ProductSummary {
  const sectionEmojiMap: Record<string, string> = {
    INSECTICIDES: '🐛',
    ACARICIDES: '🕷️',
    FONGICIDES: '🦠',
    HERBICIDES: '🌿',
    NEMATICIDES: '🪱',
    RODENTICIDES: '🐀',
    MOLLUSCICIDES: '🐌',
    REGULATEURS: '🧪',
    CARENCES: '🌱',
    STOCKAGE: '📦',
    DIVERS: '📎',
    ENGRAIS: '🌱',
    BIOSTIMULANTS: '🌿',
    BIOPESTICIDES: '🍃',
    FERTILISANTS: '🌱',
  };
  const doseRange = p.doses.length === 0 ? '—'
    : p.doses.length === 1 ? p.doses[0]
      : `${p.doses[0]} – ${p.doses[p.doses.length - 1]}`;
  const darRange = p.dars.length === 0
    ? (language === 'ar' ? '—' : language === 'fr' ? '—' : '—')
    : p.dars.length === 1 ? `${p.dars[0]} ${language === 'ar' ? 'يوم' : language === 'fr' ? 'j' : 'd'}`
      : `${p.min_dar}–${p.max_dar} ${language === 'ar' ? 'يوم' : language === 'fr' ? 'j' : 'd'}`;
  return {
    brand: p.brand || '—',
    activeSubstance: p.active_substance || p.active_raw || '—',
    sectionLabel: p.section_label[language],
    emoji: sectionEmojiMap[p.section] ?? '📄',
    crops: p.crops,
    pests: p.pests,
    doseRange,
    darRange,
    toxicToBees: p.toxic_to_bees,
    toxicToAquatic: p.toxic_to_aquatic,
    homologation: p.homologation,
  };
}

/** Accent-insensitive, case-insensitive normalisation for matching. */
export function normPhyto(s: string): string {
  return (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Map: normalised active-substance name -> list of commercial products.
 * Use this to look up "which INPV-registered brands contain this active".
 */
export function indexByActiveEnriched(
  products: EnrichedPhytoProduct[],
): Map<string, EnrichedPhytoProduct[]> {
  const map = new Map<string, EnrichedPhytoProduct[]>();
  for (const p of products) {
    const names = [p.active_substance, p.active_raw]
      .filter(Boolean)
      .map((s) => normPhyto(s))
      // Split multi-active names like "abamectine + abamectin"
      .flatMap((s) => s.split(/\+/).map((x) => x.trim()))
      .filter((s) => s.length >= 4);
    for (const n of new Set(names)) {
      const list = map.get(n) ?? [];
      list.push(p);
      map.set(n, list);
    }
  }
  return map;
}

/**
 * Lookup commercial brands that contain a given active substance.
 * Returns up to `limit` brands with their homologation + dose + DAR.
 */
export interface BrandMatch {
  brand: string;
  homologation: string;
  concentration: string;
  formulation: string;
  section: string;
  doseRange: string;
  darRange: string;
  toxicToBees: boolean;
  toxicToAquatic: boolean;
}

export function findBrandsForActive(
  indexByActive: Map<string, EnrichedPhytoProduct[]>,
  activeSubstance: string,
  limit = 5,
): BrandMatch[] {
  const key = normPhyto(activeSubstance);
  if (key.length < 4) return [];
  const matches = indexByActive.get(key) ?? [];
  // Deduplicate by brand name (keep first occurrence)
  const seen = new Set<string>();
  const out: BrandMatch[] = [];
  for (const p of matches) {
    if (seen.has(p.brand)) continue;
    seen.add(p.brand);
    const doses = p.doses;
    const dars = p.dars;
    out.push({
      brand: p.brand,
      homologation: p.homologation,
      concentration: p.concentration,
      formulation: p.formulation,
      section: p.section,
      doseRange: doses.length === 0 ? '—' : doses.length === 1 ? doses[0] : `${doses[0]} – ${doses[doses.length - 1]}`,
      darRange: dars.length === 0 ? '—' : dars.length === 1 ? `${dars[0]}d` : `${p.min_dar}–${p.max_dar}d`,
      toxicToBees: p.toxic_to_bees,
      toxicToAquatic: p.toxic_to_aquatic,
    });
    if (out.length >= limit) break;
  }
  return out;
}
