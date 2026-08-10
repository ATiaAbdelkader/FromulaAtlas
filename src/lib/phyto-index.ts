// Shared helpers for the INPV 2017 product index (parsed from
// INDEX_PRODUITS_PHYTO_2017.pdf by scripts/parse_phyto_index.py).
// The JSON lives in /public/data and is fetched at runtime (keeps the bundle
// lean — the file is ~560 KB).

export interface PhytoProduct {
  page: number;
  homologation: string;
  brand: string;
  active: string;
  active_raw: string;
  concentration: string;
  formulation: string;
  section: string;
  company: string;
  usage: string[];
}

export const SECTION_META: Record<string, { emoji: string; label: string }> = {
  INSECTICIDES: { emoji: '🐛', label: 'Insecticides' },
  ACARICIDES: { emoji: '🕷️', label: 'Acaricides' },
  FONGICIDES: { emoji: '🦠', label: 'Fongicides' },
  HERBICIDES: { emoji: '🌿', label: 'Herbicides' },
  NEMATICIDES: { emoji: '🪱', label: 'Nématicides' },
  RODENTICIDES: { emoji: '🐀', label: 'Rodenticides' },
  MOLLUSCICIDES: { emoji: '🐌', label: 'Molluscicides' },
  REGULATEURS: { emoji: '🧪', label: 'Régulateurs & carences' },
  CARENCES: { emoji: '🧪', label: 'Carences' },
  STOCKAGE: { emoji: '📦', label: 'Stockage' },
  DIVERS: { emoji: '📎', label: 'Divers' },
  ENGRAIS: { emoji: '🌱', label: 'Engrais' },
  BIOSTIMULANTS: { emoji: '🌿', label: 'Biostimulants' },
  BIOPESTICIDES: { emoji: '🍃', label: 'Biopesticides' },
  FERTILISANTS: { emoji: '🌱', label: 'Fertilisants' },
};

export function sectionLabel(section: string): string {
  return SECTION_META[section]?.label ?? section ?? '—';
}

export function sectionEmoji(section: string): string {
  return SECTION_META[section]?.emoji ?? '📄';
}

/** Accent-insensitive, case-insensitive normalisation for matching. */
export function normPhyto(s: string): string {
  return (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** Best active-substance name for a parsed row (prefers the reassembled one). */
export function productActiveName(p: PhytoProduct): string {
  return p.active && p.active.length > 2 ? p.active : p.active_raw || '—';
}

let cache: Promise<PhytoProduct[]> | null = null;

/** Fetch (once) the parsed INPV 2017 index. */
export function fetchPhytoIndex(): Promise<PhytoProduct[]> {
  if (!cache) {
    cache = fetch('/data/phyto-2017-index.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ products: PhytoProduct[] }>;
      })
      .then((d) => d.products ?? [])
      .catch((e) => {
        cache = null; // allow retry
        throw e;
      });
  }
  return cache;
}

/** Map: normalised active substance -> products carrying it. */
export function indexByActive(products: PhytoProduct[]): Map<string, PhytoProduct[]> {
  const map = new Map<string, PhytoProduct[]>();
  for (const p of products) {
    const names = [p.active, p.active_raw]
      .filter(Boolean)
      .map((s) => normPhyto(s))
      .filter((s) => s.length >= 4);
    for (const n of new Set(names)) {
      const list = map.get(n) ?? [];
      list.push(p);
      map.set(n, list);
    }
  }
  return map;
}
