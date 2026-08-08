// E-Phy (Anses) catalogue helpers.
// Data built by scripts/build_ephy_index.py from the data.gouv.fr open
// catalogue of French plant-protection products and fertilisers (MFSC),
// published by ANSES under Licence Ouverte 2.0. The JSON files live in
// /public/data and are fetched on demand (lazy) to keep the bundle lean.

import { normPhyto } from './phyto-index';

export interface EphyActive {
  name: string;
  conc: string;
}

export interface EphyPppProduct {
  amm: string;
  name: string;
  alt: string[];
  titulaire: string;
  etat: string;
  premiereAutorisation: string;
  actives: EphyActive[];
  fonctions: string[];
  formulations: string[];
}

export interface EphyMfscProduct {
  amm: string;
  name: string;
  alt: string[];
  titulaire: string;
  etat: string;
  premiereAutorisation: string;
  composition: string;
  classe: string;
  revendication: string;
}

/** Accent-insensitive, case-insensitive normalisation for matching. */
export const normEphy = normPhyto;

/** "diméthoate 400.0 g/L + ..." — compact active list for one product. */
export function ephyActiveSummary(p: EphyPppProduct): string {
  return p.actives.map((a) => (a.conc ? `${a.name} ${a.conc}` : a.name)).join(' + ');
}

const EPHY_PPP_URL = '/data/ephy-ppp-index.json';
const EPHY_MFSC_URL = '/data/ephy-mfsc-index.json';

let pppCache: Promise<EphyPppProduct[]> | null = null;
let mfscCache: Promise<EphyMfscProduct[]> | null = null;

function fetchOnce<T>(url: string, key: 'ppp' | 'mfsc'): Promise<T[]> {
  const cache = key === 'ppp' ? pppCache : mfscCache;
  if (cache) return cache as Promise<T[]>;
  const p = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<{ products: T[] }>;
    })
    .then((d) => d.products ?? [])
    .catch((e) => {
      if (key === 'ppp') pppCache = null;
      else mfscCache = null;
      throw e;
    });
  if (key === 'ppp') pppCache = p as Promise<unknown> as Promise<EphyPppProduct[]>;
  else mfscCache = p as Promise<unknown> as Promise<EphyMfscProduct[]>;
  return p;
}

/** Fetch (once) the E-Phy plant-protection products (PPP + adjuvants + mixes). */
export function fetchEphyPppIndex(): Promise<EphyPppProduct[]> {
  return fetchOnce<EphyPppProduct>(EPHY_PPP_URL, 'ppp');
}

/** Fetch (once) the E-Phy fertilisers / biostimulants (MFSC + supports). */
export function fetchEphyMfscIndex(): Promise<EphyMfscProduct[]> {
  return fetchOnce<EphyMfscProduct>(EPHY_MFSC_URL, 'mfsc');
}
