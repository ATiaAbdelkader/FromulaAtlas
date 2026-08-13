/**
 * Tool registry — single source of truth for all navigable items in the app.
 *
 * Used by the Command Palette (Cmd+K) and the Home Dashboard's "Recent Tools"
 * widget. Each entry maps a tool/agent/formula to an action (switch tab + open
 * section, or open a URL).
 *
 * To add a new tool to the registry:
 *   1. Find the CollapsibleSection in page.tsx
 *   2. Note the storageKey (e.g. "collapse_et_tracker")
 *   3. Add an entry here with the same tab + storageKey
 */

import {
  Home, Wrench, BookOpen, Tractor, Sparkles,
  Droplets, Settings, Calendar, Sun, Clock, MapPin, Shapes, Compass, Mountain,
  Layers, RefreshCw, TrendingUp, Sprout, FlaskConical, Beef, CloudRain,
  Satellite, Bug, DollarSign, ShoppingCart, Leaf, Users, FileText,
  Calculator, Network, TableProperties, Star, Columns2,
} from 'lucide-react';
import { FORMULA_COUNT, FREE_TOOL_COUNT } from './catalog-stats';
import type { Language } from './language-store';

export type TabId = 'home' | 'formulas' | 'tools' | 'farm' | 'insights';

export interface ToolEntry {
  id: string;
  title: string;
  description: string;
  /** Keywords for search (lowercased). */
  keywords: string;
  /** Tab to switch to. */
  tab: TabId;
  /** CollapsibleSection storageKey to auto-open. */
  storageKey?: string;
  /** Lucide icon name. */
  icon: typeof Home;
  /** Category for grouping in the palette. */
  category: 'farm' | 'tools' | 'insights' | 'formulas' | 'agents';
  /** Accent color. */
  color: string;
}

const FRENCH_TOOL_COPY: Record<string, string> = {
  'Multi-Field Dashboard': 'Tableau multi-parcelles',
  'Track every field, crop stage and irrigation demand': 'Suivez chaque parcelle, stade de culture et besoin d’irrigation',
  'Coordinate Converter': 'Convertisseur de coordonnées',
  'Field Boundary Importer': 'Importateur de limites de parcelle',
  'Distance & Bearing Calculator': 'Calculateur de distance et de relèvement',
  'Elevation & Slope Analyzer': 'Analyseur d’altitude et de pente',
  'Crop Rotation Planner': 'Planificateur de rotation des cultures',
  'Season Plan Generator': 'Générateur de plan de saison',
  'Fertilization Generator': 'Générateur de fertilisation',
  'Labor Calendar': 'Calendrier de la main-d’œuvre',
  'Yield Gap Analysis': 'Analyse de l’écart de rendement',
  'Field Scouting Log': 'Journal de prospection au champ',
  'Soil Test History Tracker': 'Suivi historique des analyses de sol',
  'Livestock Management': 'Gestion de l’élevage',
  'Irrigation Program Generator': 'Générateur de programme d’irrigation',
  'Irrigation System Designer': 'Concepteur de système d’irrigation',
  'Seasonal Irrigation Planner': 'Planificateur d’irrigation saisonnière',
  'Evapotranspiration Tracker': 'Suivi de l’évapotranspiration',
  'Irrigation Scheduler': 'Planificateur d’irrigation',
  'NDVI Satellite Field Maps': 'Cartes NDVI des parcelles par satellite',
  'Weather Radar + Frost Maps': 'Radar météo et cartes du gel',
  'Smart Agriculture Suite': 'Suite d’agriculture intelligente',
  'AI Specialists (Multi-Agent Chat)': 'Spécialistes IA (chat multi-agents)',
  'Financial Dashboard': 'Tableau de bord financier',
  'Marketplace — Buy Fertilizers': 'Marché — acheter des engrais',
  'Sustainability Scorecard': 'Tableau de bord de durabilité',
  'Farmer Community': 'Communauté agricole',
  'Professional Report Generator': 'Générateur de rapports professionnels',
  'Service Integrations': 'Intégrations de services',
  'Home Dashboard': 'Tableau de bord d’accueil',
};

/** Return the registry entry with a localized display title and description. */
export function localizeToolEntry(entry: ToolEntry, language: Language): ToolEntry {
  if (language !== 'fr') return entry;
  return {
    ...entry,
    title: FRENCH_TOOL_COPY[entry.title] ?? entry.title,
    description: FRENCH_TOOL_COPY[entry.description] ?? entry.description,
  };
}

export const TOOL_REGISTRY: ToolEntry[] = [
  // ==========================================================================
  // FARM TAB — Fields & Crops
  // ==========================================================================
  { id: 'multi-field', title: 'Multi-Field Dashboard', description: 'Track every field, crop stage and irrigation demand', keywords: 'field crop dashboard track irrigation demand', tab: 'farm', storageKey: 'collapse_multifield', icon: Layers, category: 'farm', color: '#16a34a' },
  { id: 'coord-converter', title: 'Coordinate Converter', description: 'DMS ↔ Decimal · UTM ↔ Lat/Lng · Batch CSV', keywords: 'coordinate dms decimal utm lat lng gps wgs84', tab: 'farm', storageKey: 'collapse_coords', icon: MapPin, category: 'farm', color: '#6366f1' },
  { id: 'field-boundary', title: 'Field Boundary Importer', description: 'GeoJSON · KML · WKT · CSV · Area + perimeter + centroid', keywords: 'boundary geojson kml wkt csv import field polygon', tab: 'farm', storageKey: 'collapse_boundary', icon: Shapes, category: 'farm', color: '#10b981' },
  { id: 'distance-bearing', title: 'Distance & Bearing Calculator', description: 'Vincenty geodesic · Initial/final bearing · Batch CSV', keywords: 'distance bearing vincenty geodesic destination field to field', tab: 'farm', storageKey: 'collapse_distance', icon: Compass, category: 'farm', color: '#0891b2' },
  { id: 'elevation-slope', title: 'Elevation & Slope Analyzer', description: 'Point / Path profile / Slope grid · Aspect · Hillshade', keywords: 'elevation slope aspect hillshade frost terrain path profile', tab: 'farm', storageKey: 'collapse_elevation', icon: Mountain, category: 'farm', color: '#78716c' },
  { id: 'crop-rotation', title: 'Crop Rotation Planner', description: 'Multi-year rotation · N credit · Disease breaks · Cover crops', keywords: 'rotation crop nitrogen credit disease cover crop soil health', tab: 'farm', storageKey: 'collapse_rotation', icon: RefreshCw, category: 'farm', color: '#16a34a' },
  { id: 'season-plan', title: 'Season Plan Generator', description: 'AI week-by-week crop plan · Kc + NPK + irrigation', keywords: 'season plan ai crop kc npk irrigation fertigation', tab: 'farm', storageKey: 'collapse_season_plan', icon: Sparkles, category: 'farm', color: '#7c3aed' },
  { id: 'fertilization', title: 'Fertilization Generator', description: 'Per-crop lifecycle fertilization · NPK + micros · 20 crops', keywords: 'fertilization npk micros crop lifecycle stage schedule', tab: 'farm', storageKey: 'collapse_fertilization', icon: FlaskConical, category: 'farm', color: '#16a34a' },
  { id: 'labor-calendar', title: 'Labor Calendar', description: 'Phenology-driven field operations · Person-days/ha', keywords: 'labor calendar operations work phenology person days', tab: 'farm', storageKey: 'collapse_labor_cal', icon: Calendar, category: 'farm', color: '#0891b2' },
  { id: 'yield-gap', title: 'Yield Gap Analysis', description: 'Benchmark actual vs potential yield by crop and climate', keywords: 'yield gap potential benchmark climate crop', tab: 'farm', storageKey: 'collapse_yieldgap', icon: TrendingUp, category: 'farm', color: '#0891b2' },
  { id: 'scouting-log', title: 'Field Scouting Log', description: 'Voice + photo field observations with severity tagging', keywords: 'scouting field observation pest disease photo voice', tab: 'farm', storageKey: 'collapse_scouting', icon: Sprout, category: 'farm', color: '#84cc16' },

  // ==========================================================================
  // FARM TAB — Soil & Livestock
  // ==========================================================================
  { id: 'soil-history', title: 'Soil Test History Tracker', description: 'Multi-year soil test tracking · Trend charts · Amendment recs', keywords: 'soil test history trend amendment ph om cec', tab: 'farm', storageKey: 'collapse_soil_history', icon: FlaskConical, category: 'farm', color: '#8b5cf6' },
  { id: 'livestock', title: 'Livestock Management', description: 'Feed rations (NRC 2021) · Pasture capacity · Manure NPK', keywords: 'livestock cattle cow feed ration pasture manure grazing', tab: 'farm', storageKey: 'collapse_livestock', icon: Beef, category: 'farm', color: '#f59e0b' },

  // ==========================================================================
  // FARM TAB — Irrigation
  // ==========================================================================
  { id: 'irrigation-program', title: 'Irrigation Program Generator', description: 'Decadal (10-day) irrigation schedule from the BRL/COM memento', keywords: 'irrigation program decadal schedule brl com', tab: 'farm', storageKey: 'collapse_irrigation', icon: Droplets, category: 'farm', color: '#0ea5e9' },
  { id: 'irrigation-system', title: 'Irrigation System Designer', description: 'Multi-zone sprinkler / drip / bubbler designer with pump sizing', keywords: 'irrigation system designer sprinkler drip bubbler pump zone', tab: 'farm', storageKey: 'collapse_system_design', icon: Settings, category: 'farm', color: '#6366f1' },
  { id: 'seasonal-irrigation', title: 'Seasonal Irrigation Planner', description: 'Season-by-season irrigation focus, risks and recommendations', keywords: 'seasonal irrigation planner season risk', tab: 'farm', storageKey: 'collapse_seasonal', icon: Calendar, category: 'farm', color: '#f59e0b' },
  { id: 'et-tracker', title: 'Evapotranspiration Tracker', description: 'Live ET₀ (Open-Meteo) · FAO-56 Kc × ETc · 7-day plan', keywords: 'evapotranspiration et0 etc fao kc penman montethe open meteo', tab: 'farm', storageKey: 'collapse_et_tracker', icon: Sun, category: 'farm', color: '#0891b2' },
  { id: 'irrigation-scheduler', title: 'Irrigation Scheduler', description: 'Controllers · Zones · Schedules · Sequences · YAML export', keywords: 'irrigation scheduler controller zone schedule sequence yaml home assistant', tab: 'farm', storageKey: 'collapse_irr_sched', icon: Clock, category: 'farm', color: '#0ea5e9' },

  // ==========================================================================
  // INSIGHTS TAB — Intelligence & AI
  // ==========================================================================
  { id: 'ndvi', title: 'NDVI Satellite Field Maps', description: 'Vegetation health heatmap · Stress zone detection', keywords: 'ndvi satellite vegetation health stress map', tab: 'insights', storageKey: 'collapse_ndvi', icon: Satellite, category: 'insights', color: '#6366f1' },
  { id: 'weather-radar', title: 'Weather Radar + Frost Maps', description: 'Live 7-day forecast · Frost risk · Heat warnings', keywords: 'weather radar frost heat forecast spray window', tab: 'insights', storageKey: 'collapse_weather_radar', icon: CloudRain, category: 'insights', color: '#0ea5e9' },
  { id: 'agri-planner', title: 'Smart Agriculture Suite', description: 'Disease detection · crop recommendation · fertilizer guidance', keywords: 'smart agriculture disease detection crop recommendation fertilizer', tab: 'insights', storageKey: 'collapse_agriplanner', icon: Bug, category: 'insights', color: '#65a30d' },
  { id: 'ai-specialists', title: 'AI Specialists (Multi-Agent Chat)', description: '10 specialized AI agents — Agronomist · Crop Scout · etc.', keywords: 'ai agent specialist chat agronomist crop scout irrigation soil', tab: 'insights', storageKey: 'collapse_agent_chat', icon: Sparkles, category: 'agents', color: '#6366f1' },

  // ==========================================================================
  // INSIGHTS TAB — Business & Marketplace
  // ==========================================================================
  { id: 'financial', title: 'Financial Dashboard', description: 'Costs · Revenue · Gross margin · Break-even · ROI', keywords: 'financial dashboard cost revenue margin breakeven roi', tab: 'insights', storageKey: 'collapse_financial', icon: DollarSign, category: 'insights', color: '#f59e0b' },
  { id: 'marketplace', title: 'Marketplace — Buy Fertilizers', description: 'Price comparison from 3 suppliers · Shopping cart', keywords: 'marketplace buy fertilizer supplier price cart', tab: 'insights', storageKey: 'collapse_marketplace', icon: ShoppingCart, category: 'insights', color: '#f59e0b' },
  { id: 'sustainability', title: 'Sustainability Scorecard', description: '5 traffic-light metrics — NUE, water, carbon, soil, pesticides', keywords: 'sustainability scorecard nue water carbon soil pesticide', tab: 'insights', storageKey: 'collapse_sustainability', icon: Leaf, category: 'insights', color: '#16a34a' },

  // ==========================================================================
  // INSIGHTS TAB — Community & Reports
  // ==========================================================================
  { id: 'community', title: 'Farmer Community', description: 'Share experiences · Ask questions · Benchmark your farm', keywords: 'community farmer share question benchmark', tab: 'insights', storageKey: 'collapse_community', icon: Users, category: 'insights', color: '#3b82f6' },
  { id: 'report', title: 'Professional Report Generator', description: 'Branded multi-page PDF · Combines all data', keywords: 'report generator pdf branded', tab: 'insights', storageKey: 'collapse_report', icon: FileText, category: 'insights', color: '#0ea5e9' },
  { id: 'integrations', title: 'Service Integrations', description: 'Clerk · Neon · OneSignal · MapTiler · Gemini · Supabase', keywords: 'integration clerk neon onesignal maptiler gemini supabase api key', tab: 'insights', storageKey: 'collapse_integrations', icon: Settings, category: 'insights', color: '#64748b' },

  // ==========================================================================
  // TOOLS TAB (FreeToolsSection — represents the whole section)
  // ==========================================================================
  { id: 'tools-tab', title: `All Free Tools (${FREE_TOOL_COUNT} calculators)`, description: 'Oxide/elemental, units, hydro, water, fertilizers, soil, reference', keywords: 'free tools calculator oxide elemental units hydro water fertilizer soil reference', tab: 'tools', icon: Wrench, category: 'tools', color: '#0891b2' },
  { id: 'formulas-tab', title: `Formula Atlas (${FORMULA_COUNT} formulas)`, description: `Browse all ${FORMULA_COUNT} agronomic formulas with 218 interactive calculators`, keywords: 'formula atlas browse formulas interactive calculator', tab: 'formulas', icon: BookOpen, category: 'formulas', color: '#f59e0b' },

  // ==========================================================================
  // Quick actions (not real tools, but navigable shortcuts)
  // ==========================================================================
  { id: 'home-tab', title: 'Home Dashboard', description: 'Weather · ET₀ · Quick actions · Recent tools', keywords: 'home dashboard weather et0 quick actions recent', tab: 'home', icon: Home, category: 'farm', color: '#16a34a' },
];

// ============================================================================
// Search
// ============================================================================

export interface SearchResult {
  entry: ToolEntry;
  score: number;  // higher = better match
}

/**
 * Fuzzy search across the tool registry.
 * Scores by: title match (3pts) > description match (2pts) > keywords match (1pt).
 */
export function searchTools(query: string, limit = 8): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    // No query → return all, sorted by category
    return TOOL_REGISTRY.map(entry => ({ entry, score: 0 }))
      .sort((a, b) => a.entry.category.localeCompare(b.entry.category));
  }
  const terms = q.split(/\s+/);
  const results: SearchResult[] = [];

  for (const entry of TOOL_REGISTRY) {
    let score = 0;
    const title = entry.title.toLowerCase();
    const desc = entry.description.toLowerCase();
    const kw = entry.keywords.toLowerCase();

    for (const term of terms) {
      if (title.includes(term)) score += 3;
      if (desc.includes(term)) score += 2;
      if (kw.includes(term)) score += 1;
      // Exact title match bonus
      if (title === q) score += 10;
    }

    if (score > 0) {
      results.push({ entry, score });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

// ============================================================================
// Recent tools (localStorage-backed)
// ============================================================================

const RECENT_KEY = 'recent_tools_v1';
const PINNED_KEY = 'pinned_tools_v1';
const TOOL_PINS_CHANGED_EVENT = 'formula-atlas-tool-pins-changed';
const MAX_RECENT = 6;

function readIds(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(key);
    const ids = saved ? JSON.parse(saved) : [];
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function getRecentTools(): ToolEntry[] {
  try {
    const saved = localStorage.getItem(RECENT_KEY);
    if (!saved) return [];
    const ids: string[] = JSON.parse(saved);
    return ids
      .map(id => TOOL_REGISTRY.find(t => t.id === id))
      .filter((t): t is ToolEntry => t !== undefined);
  } catch {
    return [];
  }
}

export function recordToolUse(toolId: string): void {
  try {
    const ids = readIds(RECENT_KEY);
    // Remove if already present, then prepend
    const next = [toolId, ...ids.filter(id => id !== toolId)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
}

export function getPinnedToolIds(): string[] {
  return readIds(PINNED_KEY);
}

export function getPinnedTools(): ToolEntry[] {
  const pinned = new Set(getPinnedToolIds());
  return TOOL_REGISTRY.filter(entry => pinned.has(entry.id));
}

export function isToolPinned(toolId: string): boolean {
  return getPinnedToolIds().includes(toolId);
}

export function toggleToolPin(toolId: string): string[] {
  const ids = getPinnedToolIds();
  const next = ids.includes(toolId) ? ids.filter(id => id !== toolId) : [toolId, ...ids];
  try {
    localStorage.setItem(PINNED_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(TOOL_PINS_CHANGED_EVENT, { detail: next }));
  } catch { /* ignore */ }
  return next;
}

export function setPinnedToolIds(toolIds: string[]): string[] {
  const validIds = [...new Set(toolIds)].filter(id => TOOL_REGISTRY.some(tool => tool.id === id));
  try {
    localStorage.setItem(PINNED_KEY, JSON.stringify(validIds));
    window.dispatchEvent(new CustomEvent(TOOL_PINS_CHANGED_EVENT, { detail: validIds }));
  } catch { /* ignore */ }
  return validIds;
}

export { TOOL_PINS_CHANGED_EVENT };
