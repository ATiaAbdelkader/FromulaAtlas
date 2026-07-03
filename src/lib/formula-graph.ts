// Build a graph (nodes + edges) of the formula atlas for visualization.
// Edges encode three relationship types:
//   - causal:     formula A's output feeds formula B (e.g. NIR → GIR)
//   - shared_var: two formulas reference the same variable/keyword
//   - same_section: two formulas live in the same chapter
//
// The graph is bounded by `maxNodes` to keep visualization responsive.

import { allFormulas } from '@/lib/formulas-data';
import type { Formula } from '@/lib/types';

// --- Types ----------------------------------------------------------------

export type EdgeKind = 'causal' | 'shared_var' | 'same_section';

export interface GraphNode {
  id: string; // formula code (unique within a part)
  code: string;
  name: string;
  part: string;
  chapterNumber: number;
  /** number of edges — for node sizing */
  degree: number;
  /** short color group id (for the renderer) */
  group: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
  /** 0–1 normalized weight — for edge thickness */
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// --- Causal chain definitions --------------------------------------------
// Curated, hand-picked output→input links between formulas. These represent
// the natural "next calculation" flow a user would walk through.

interface CausalLink {
  from: string; // formula code
  to: string; // formula code
  reason: string;
}

const causalLinks: CausalLink[] = [
  { from: '2.1', to: '2.2', reason: 'plant population → seed rate' },
  { from: '2.2', to: '2.3', reason: 'seed quality → real value' },
  { from: '4.1', to: '4.8a', reason: 'fertilizer applied → agronomic efficiency' },
  { from: '4.1', to: '4.8b', reason: 'fertilizer applied → nutrient recovery' },
  { from: '4.1', to: '4.8c', reason: 'fertilizer applied → partial factor productivity' },
  { from: '6.1', to: '6.2', reason: 'NIR → gross irrigation requirement' },
  { from: '6.2', to: '6.4', reason: 'water applied → water use efficiency' },
  { from: '7.1', to: '7.3', reason: 'bulk density → porosity' },
  { from: '7.1', to: '41.1', reason: 'bulk density → soil carbon stock' },
  { from: 'IRR-10.4', to: 'IRR-10.6', reason: 'ETc → NIR → GIR' },
  { from: 'IRR-10.4', to: 'IRR-9.3', reason: 'ETc → irrigation interval' },
  { from: 'IRR-11.9', to: 'IRR-9.3', reason: 'TAW → RAW → interval' },
  { from: 'IRR-11.8', to: 'IRR-11.9', reason: 'AW (FC−PWP) → TAW × root depth' },
  { from: 'IRR-3.3', to: 'IRR-5.7', reason: 'TDH → brake power' },
  { from: 'IRR-5.7', to: 'IRR-5.2', reason: 'brake power → pump efficiency' },
  { from: 'IRR-7.1', to: 'IRR-7.3', reason: 'emitter discharge → DU' },
  { from: 'IRR-15.6', to: 'IRR-3.3', reason: 'pipe diameter → friction → TDH' },
  { from: 'IRR-12.1', to: 'IRR-9.4', reason: 'water quality → leaching requirement' },
  { from: 'IRR-14.1', to: 'IRR-14.3', reason: 'storage volume → detention time' },
  { from: '10.9', to: '13.6', reason: 'ECM yield → persistency' },
  { from: '13.8', to: '10.9', reason: 'SCS / mastitis → milk yield' },
  { from: '37.1', to: '10.9', reason: 'THI / heat stress → milk yield' },
  { from: '14.5', to: '17.2', reason: 'broiler EBI → gross margin' },
  { from: '14.5', to: '63.3', reason: 'broiler performance → break-even' },
  { from: '63.3', to: '17.2', reason: 'break-even → gross margin' },
  { from: '8.9', to: '6.4', reason: 'harvest index → WUE' },
  { from: '69.3', to: '69.1', reason: 'drought tolerance → RUE' },
  { from: '69.4', to: '69.2', reason: 'runoff coefficient → water harvest index' },
  { from: '41.1', to: '7.1', reason: 'soil carbon → bulk density (compaction feedback)' },
];

// --- Helpers --------------------------------------------------------------

function nodeKey(f: Formula): string {
  return `${f.code}@${f.part}`;
}

function partToGroup(part: string): string {
  // Short stable group id for color-coding nodes in the renderer.
  // Use the first 8 chars of the part title, slugified.
  return part
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
}

// --- Builder --------------------------------------------------------------

/**
 * Build the formula graph, capping the number of nodes at `maxNodes`.
 * Selection strategy: include all formulas referenced in `causalLinks`
 * first (so the most interesting causal structure is preserved), then fill
 * the rest with formulas that have the most chapter-mates (denser clusters).
 */
export function buildGraphData(maxNodes = 80): GraphData {
  // Index formulas by code so causal links resolve even when parts differ.
  const byCode = new Map<string, Formula>();
  for (const f of allFormulas) {
    if (!byCode.has(f.code)) byCode.set(f.code, f);
  }

  // --- Phase 1: pick the node set ----------------------------------------
  const selected = new Set<string>(); // node keys

  // Start from causal-link endpoints.
  for (const link of causalLinks) {
    const fromF = byCode.get(link.from);
    const toF = byCode.get(link.to);
    if (fromF) selected.add(nodeKey(fromF));
    if (toF) selected.add(nodeKey(toF));
    if (selected.size >= maxNodes) break;
  }

  // Fill the rest with the formulas that share the most chapter-mates
  // (so the graph shows denser clusters).
  if (selected.size < maxNodes) {
    // Count chapter-mates per formula.
    const chapterCounts = new Map<string, number>();
    for (const f of allFormulas) {
      const key = `${f.part}::${f.chapter_number}`;
      chapterCounts.set(key, (chapterCounts.get(key) ?? 0) + 1);
    }
    const ranked = [...allFormulas].sort((a, b) => {
      const ca = chapterCounts.get(`${a.part}::${a.chapter_number}`) ?? 0;
      const cb = chapterCounts.get(`${b.part}::${b.chapter_number}`) ?? 0;
      if (cb !== ca) return cb - ca;
      return a.code.localeCompare(b.code);
    });
    for (const f of ranked) {
      if (selected.size >= maxNodes) break;
      selected.add(nodeKey(f));
    }
  }

  // --- Phase 2: build nodes ----------------------------------------------
  const nodeMap = new Map<string, GraphNode>();
  for (const f of allFormulas) {
    const k = nodeKey(f);
    if (!selected.has(k)) continue;
    nodeMap.set(k, {
      id: k,
      code: f.code,
      name: f.name,
      part: f.part,
      chapterNumber: f.chapter_number,
      degree: 0,
      group: partToGroup(f.part),
    });
  }

  // --- Phase 3: build edges ----------------------------------------------
  const edgeMap = new Map<string, GraphEdge>();

  const addEdge = (
    source: string,
    target: string,
    kind: EdgeKind,
    weight: number
  ) => {
    if (source === target) return;
    if (!nodeMap.has(source) || !nodeMap.has(target)) return;
    // Edge id is order-independent for undirected kinds.
    const id =
      kind === 'causal'
        ? `${kind}:${source}->${target}`
        : `${kind}:${[source, target].sort().join('->')}`;
    const existing = edgeMap.get(id);
    if (existing) {
      existing.weight = Math.max(existing.weight, weight);
      return;
    }
    edgeMap.set(id, { id, source, target, kind, weight });
  };

  // (a) Causal links.
  for (const link of causalLinks) {
    const fromF = byCode.get(link.from);
    const toF = byCode.get(link.to);
    if (!fromF || !toF) continue;
    addEdge(nodeKey(fromF), nodeKey(toF), 'causal', 1.0);
  }

  // (b) Same-section edges — connect formulas within the same chapter
  // (bounded so we don't blow up the graph).
  const byChapter = new Map<string, Formula[]>();
  for (const f of allFormulas) {
    if (!selected.has(nodeKey(f))) continue;
    const key = `${f.part}::${f.chapter_number}`;
    if (!byChapter.has(key)) byChapter.set(key, []);
    byChapter.get(key)!.push(f);
  }
  const SAME_SECTION_CAP = 6; // connect at most this many within a chapter
  for (const siblings of byChapter.values()) {
    const subset = siblings.slice(0, SAME_SECTION_CAP);
    for (let i = 0; i < subset.length; i++) {
      for (let j = i + 1; j < subset.length; j++) {
        addEdge(
          nodeKey(subset[i]),
          nodeKey(subset[j]),
          'same_section',
          0.4
        );
      }
    }
  }

  // (c) Shared-variable edges — based on shared name keywords.
  // Limit to keep edge count manageable: only consider keywords that appear
  // in <= 5 selected formulas.
  const keywordIndex = new Map<string, Formula[]>();
  const STOP = new Set(['the', 'and', 'of', 'for', 'a', 'in', 'to']);
  for (const f of allFormulas) {
    if (!selected.has(nodeKey(f))) continue;
    const words = f.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP.has(w));
    const seen = new Set<string>();
    for (const w of words) {
      if (seen.has(w)) continue;
      seen.add(w);
      if (!keywordIndex.has(w)) keywordIndex.set(w, []);
      keywordIndex.get(w)!.push(f);
    }
  }
  for (const siblings of keywordIndex.values()) {
    if (siblings.length < 2 || siblings.length > 5) continue;
    for (let i = 0; i < siblings.length; i++) {
      for (let j = i + 1; j < siblings.length; j++) {
        addEdge(
          nodeKey(siblings[i]),
          nodeKey(siblings[j]),
          'shared_var',
          0.25
        );
      }
    }
  }

  // --- Phase 4: compute node degrees -------------------------------------
  for (const e of edgeMap.values()) {
    const a = nodeMap.get(e.source);
    const b = nodeMap.get(e.target);
    if (a) a.degree++;
    if (b) b.degree++;
  }

  return {
    nodes: [...nodeMap.values()],
    edges: [...edgeMap.values()],
  };
}

/** Get just the causal-chain subgraph — useful for focused walkthroughs. */
export function buildCausalSubgraph(): GraphData {
  const data = buildGraphData(200);
  const causalEdges = data.edges.filter((e) => e.kind === 'causal');
  const usedNodeIds = new Set<string>();
  for (const e of causalEdges) {
    usedNodeIds.add(e.source);
    usedNodeIds.add(e.target);
  }
  return {
    nodes: data.nodes.filter((n) => usedNodeIds.has(n.id)),
    edges: causalEdges,
  };
}

export default buildGraphData;
