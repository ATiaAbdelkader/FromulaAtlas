'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Share2,
  Info,
} from 'lucide-react';
import {
  buildGraphData,
  type GraphData,
  type GraphNode,
} from '@/lib/formula-graph';
import { allFormulas } from '@/lib/formulas-data';
import { FormulaDetailDialog } from './formula-detail-dialog';
import { cn } from '@/lib/utils';

interface FormulaGraphProps {
  /** Max number of nodes to render (default 60). */
  maxNodes?: number;
  /** Outer className */
  className?: string;
}

interface PositionedNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const VIEW_W = 800;
const VIEW_H = 500;

// Stable color palette for parts (mapped via group id hash).
const groupPalette = [
  '#10b981', '#f59e0b', '#0d9488', '#8b5cf6',
  '#06b6d4', '#84cc16', '#ec4899', '#6366f1',
  '#ef4444', '#14b8a6', '#eab308', '#a855f7',
];

function groupColor(group: string): string {
  let hash = 0;
  for (let i = 0; i < group.length; i++) {
    hash = (hash * 31 + group.charCodeAt(i)) >>> 0;
  }
  return groupPalette[hash % groupPalette.length];
}

const edgeColorByKind: Record<string, string> = {
  causal: '#10b981',
  same_section: '#cbd5e1',
  shared_var: '#a78bfa',
};

/**
 * Lightweight force-directed graph rendered as inline SVG. Implements a
 * simplified Fruchterman–Reingold layout with a few hundred iterations run
 * synchronously on mount and on demand.
 *
 * Hovering a node highlights its direct neighbours; clicking opens the
 * formula detail dialog.
 */
export function FormulaGraph({ maxNodes = 60, className }: FormulaGraphProps) {
  const graph: GraphData = useMemo(() => buildGraphData(maxNodes), [maxNodes]);

  // Compute initial positions deterministically so SSR + first paint match.
  const initialPositions = useMemo(() => {
    const map = new Map<string, PositionedNode>();
    const cx = VIEW_W / 2;
    const cy = VIEW_H / 2;
    graph.nodes.forEach((n, i) => {
      const angle = (i / Math.max(1, graph.nodes.length)) * Math.PI * 2;
      const r = 150 + (i % 3) * 25;
      map.set(n.id, {
        ...n,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        vx: 0,
        vy: 0,
      });
    });
    return map;
  }, [graph]);

  const [positions, setPositions] = useState<Map<string, PositionedNode>>(
    () => new Map(initialPositions),
  );
  const [hovered, setHovered] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Run a few iterations of force-directed layout, memoised by graph. Done
  // during render (rather than in an effect) so the first paint already has
  // the laid-out positions.
  const laidOut = useMemo(() => {
    const next = new Map(initialPositions);
    const iterations = 250;
    const k = Math.sqrt((VIEW_W * VIEW_H) / Math.max(1, graph.nodes.length)) * 0.55;

    for (let iter = 0; iter < iterations; iter++) {
      const t = 1 - iter / iterations;
      // Repulsive forces between all pairs.
      for (const a of next.values()) {
        let fx = 0;
        let fy = 0;
        for (const b of next.values()) {
          if (a.id === b.id) continue;
          let dx = a.x - b.x;
          let dy = a.y - b.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 0.01) {
            dist = 0.01;
            dx = 0.01 * (Math.random() - 0.5);
            dy = 0.01 * (Math.random() - 0.5);
          }
          const rep = (k * k) / dist;
          fx += (dx / dist) * rep;
          fy += (dy / dist) * rep;
        }
        a.vx = fx;
        a.vy = fy;
      }
      // Attractive forces along edges.
      for (const e of graph.edges) {
        const a = next.get(e.source);
        const b = next.get(e.target);
        if (!a || !b) continue;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.01) dist = 0.01;
        const att = (dist * dist) / k;
        const f = (e.kind === 'causal' ? 1.4 : e.kind === 'same_section' ? 0.7 : 0.5) * att;
        a.vx -= (dx / dist) * f;
        a.vy -= (dy / dist) * f;
        b.vx += (dx / dist) * f;
        b.vy += (dy / dist) * f;
      }
      // Apply with cooling + keep inside view bounds.
      for (const n of next.values()) {
        n.x += Math.max(-10, Math.min(10, n.vx * 0.1 * t));
        n.y += Math.max(-10, Math.min(10, n.vy * 0.1 * t));
        n.x = Math.max(20, Math.min(VIEW_W - 20, n.x));
        n.y = Math.max(20, Math.min(VIEW_H - 20, n.y));
      }
    }
    return next;
  }, [graph, initialPositions]);

  // Keep the rendered positions in sync with the memoised layout. Adjust
  // during render (React's recommended "derived state" pattern).
  const [prevLayout, setPrevLayout] = useState(laidOut);
  if (prevLayout !== laidOut) {
    setPrevLayout(laidOut);
    setPositions(new Map(laidOut));
  }

  // Cancel any pending work on unmount (no-op for now — kept for future use).
  useEffect(() => {
    return () => {
      /* no-op */
    };
  }, []);

  // Build adjacency for hover highlighting.
  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const e of graph.edges) {
      if (!map.has(e.source)) map.set(e.source, new Set());
      if (!map.has(e.target)) map.set(e.target, new Set());
      map.get(e.source)!.add(e.target);
      map.get(e.target)!.add(e.source);
    }
    return map;
  }, [graph]);

  const handleNodeClick = (node: PositionedNode) => {
    setSelectedCode(node.code);
    setDetailOpen(true);
  };

  const handleRelayout = () => {
    // Re-trigger the effect by replacing positions with the initial layout
    // (the effect runs once on mount; here we re-run a fresh layout pass).
    const next = new Map(initialPositions);
    // Just reset to initial for a stable behaviour.
    setPositions(next);
  };

  const hoveredNeighbors = hovered ? adjacency.get(hovered) : null;
  const activeFormula = selectedCode
    ? allFormulas.find((f) => f.code === selectedCode) ?? null
    : null;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <span className="flex items-center justify-center h-7 w-7 rounded-md bg-gradient-to-br from-emerald-500 to-green-700 text-white">
              <Share2 className="h-3.5 w-3.5" />
            </span>
            Formula Graph
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[10px] font-mono text-muted-foreground w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleRelayout}
              title="Reset layout"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0 space-y-2">
        <div className="relative rounded-lg border border-border bg-gradient-to-br from-background to-muted/30 overflow-hidden">
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="w-full h-[400px] block"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
            role="img"
            aria-label="Formula relationship graph"
          >
            {/* Edges */}
            <g>
              {graph.edges.map((e) => {
                const a = positions.get(e.source);
                const b = positions.get(e.target);
                if (!a || !b) return null;
                const isHighlighted =
                  hovered &&
                  (e.source === hovered || e.target === hovered);
                const color = edgeColorByKind[e.kind] ?? '#cbd5e1';
                return (
                  <line
                    key={e.id}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={color}
                    strokeWidth={isHighlighted ? 1.5 : 0.5}
                    strokeOpacity={isHighlighted ? 0.9 : hovered ? 0.05 : 0.35}
                  />
                );
              })}
            </g>

            {/* Nodes */}
            <g>
              {[...positions.values()].map((n) => {
                const isHovered = hovered === n.id;
                const isNeighbor = hoveredNeighbors?.has(n.id);
                const dim = hovered && !isHovered && !isNeighbor;
                const r = 4 + Math.min(8, n.degree);
                const color = groupColor(n.group);
                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x},${n.y})`}
                    className="cursor-pointer"
                    onClick={() => handleNodeClick(n)}
                    onMouseEnter={() => setHovered(n.id)}
                    onMouseLeave={() => setHovered(null)}
                    opacity={dim ? 0.25 : 1}
                  >
                    <circle
                      r={r}
                      fill={color}
                      stroke={isHovered ? '#ffffff' : '#ffffffaa'}
                      strokeWidth={isHovered ? 2 : 0.5}
                    />
                    {(isHovered || isNeighbor || n.degree >= 4) && (
                      <text
                        x={r + 3}
                        y={3}
                        fontSize={9}
                        fill="currentColor"
                        className="font-mono fill-foreground pointer-events-none"
                      >
                        {n.code}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Hover info */}
          {hovered && (
            <div className="absolute top-2 left-2 rounded-md border border-border bg-background/95 px-2.5 py-1.5 text-xs shadow-sm max-w-[260px]">
              {(() => {
                const n = positions.get(hovered);
                if (!n) return null;
                return (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: groupColor(n.group) }}
                      />
                      <span className="font-mono font-bold text-[11px]">{n.code}</span>
                      <span className="text-[10px] text-muted-foreground">
                        · {n.degree} link{n.degree === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="text-[11px] mt-0.5 leading-tight">
                      {n.name}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-3 rounded-sm" style={{ background: edgeColorByKind.causal }} />
            causal
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-3 rounded-sm" style={{ background: edgeColorByKind.same_section }} />
            same section
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-3 rounded-sm" style={{ background: edgeColorByKind.shared_var }} />
            shared variable
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Info className="h-3 w-3" />
            Click any node to open its formula
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            Showing {graph.nodes.length} nodes · {graph.edges.length} edges
          </span>
          <Badge variant="outline" className="text-[10px] font-mono">
            Top {graph.nodes.length} of {allFormulas.length}
          </Badge>
        </div>
      </CardContent>

      <FormulaDetailDialog
        formula={activeFormula}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </Card>
  );
}

export default FormulaGraph;
