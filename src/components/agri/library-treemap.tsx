'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { handbook } from '@/lib/formulas-data';
import { getPartTheme } from './part-themes';
import { cn } from '@/lib/utils';

interface LibraryTreemapProps {
  /** called when a part (or part + chapter) is selected */
  onSelectPart?: (partTitle: string | null) => void;
  onSelectChapter?: (partTitle: string, chapterNumber: number) => void;
  /** currently selected part (for highlighting) */
  selectedPart?: string | null;
  selectedChapter?: number | null;
  /** extra className */
  className?: string;
}

interface Tile {
  key: string;
  label: string;
  partTitle: string;
  chapterNumber?: number;
  formulaCount: number;
  roman: string;
  isPart: boolean;
}

export function LibraryTreemap({
  onSelectPart,
  onSelectChapter,
  selectedPart,
  selectedChapter,
  className,
}: LibraryTreemapProps) {
  // Build the tile set: one tile per part, sized by formula count.
  const tiles = useMemo<Tile[]>(() => {
    const out: Tile[] = [];
    for (const part of handbook.parts) {
      const formulaCount = part.chapters.reduce(
        (sum, ch) => sum + ch.formulas.length + ch.sub_sections.reduce((s, ss) => s + ss.formulas.length, 0),
        0,
      );
      if (formulaCount === 0) continue;
      out.push({
        key: part.title,
        label: part.title,
        partTitle: part.title,
        formulaCount,
        roman: part.roman,
        isPart: true,
      });
    }
    return out;
  }, []);

  const totalFormulas = useMemo(
    () => tiles.reduce((s, t) => s + t.formulaCount, 0),
    [tiles],
  );
  const maxCount = useMemo(
    () => tiles.reduce((m, t) => Math.max(m, t.formulaCount), 1),
    [tiles],
  );

  const [expandedPart, setExpandedPart] = useState<string | null>(null);

  const handleTileClick = (tile: Tile) => {
    if (tile.isPart) {
      if (expandedPart === tile.partTitle) {
        // Second click on the same part fires onSelectPart
        onSelectPart?.(tile.partTitle);
      } else {
        setExpandedPart(tile.partTitle);
      }
    } else {
      onSelectChapter?.(tile.partTitle, tile.chapterNumber!);
    }
  };

  // Build expanded chapter tiles for the active expanded part.
  const expandedTiles = useMemo<Tile[]>(() => {
    if (!expandedPart) return [];
    const part = handbook.parts.find((p) => p.title === expandedPart);
    if (!part) return [];
    return part.chapters
      .map((ch) => ({
        key: `${part.title}-${ch.number}`,
        label: ch.title,
        partTitle: part.title,
        chapterNumber: ch.number,
        formulaCount: ch.formulas.length + ch.sub_sections.reduce((s, ss) => s + ss.formulas.length, 0),
        roman: String(ch.number),
        isPart: false,
      }))
      .filter((t) => t.formulaCount > 0);
  }, [expandedPart]);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <span className="flex items-center justify-center h-7 w-7 rounded-md bg-gradient-to-br from-emerald-500 to-green-700 text-white">
              <LayoutIcon />
            </span>
            Library Treemap
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-mono">
            {totalFormulas} formulas
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Each tile is sized by formula count. Click a tile to expand its
          sections, then click again to filter the formula list.
        </p>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 auto-rows-[80px]">
          {tiles.map((tile) => {
            const theme = getPartTheme(tile.partTitle);
            // Scale font size and span by formula count.
            const ratio = tile.formulaCount / maxCount;
            const span = ratio > 0.5 ? 'sm:col-span-2' : '';
            const rowSpan = ratio > 0.5 ? 'row-span-2' : '';
            const isActive = selectedPart === tile.partTitle && !selectedChapter;
            const isExpanded = expandedPart === tile.partTitle;
            return (
              <button
                key={tile.key}
                onClick={() => handleTileClick(tile)}
                className={cn(
                  'group relative rounded-lg border-2 p-2 text-left transition-all overflow-hidden flex flex-col justify-between',
                  theme.tintBg,
                  theme.chipBorder,
                  isActive && 'ring-2 ring-emerald-400',
                  isExpanded && 'ring-2 ring-emerald-400',
                  span,
                  rowSpan,
                )}
                style={{ minHeight: 70 }}
                title={`${tile.label}: ${tile.formulaCount} formulas`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span
                    className={cn(
                      'flex items-center justify-center h-5 w-5 rounded text-[9px] font-bold bg-gradient-to-br text-white shadow-sm',
                      theme.badgeGradient,
                    )}
                  >
                    {tile.roman}
                  </span>
                  <span className={cn('text-[10px] font-mono font-bold', theme.chipText)}>
                    {tile.formulaCount}
                  </span>
                </div>
                <div
                  className={cn(
                    'font-semibold leading-tight pr-1',
                    ratio > 0.5 ? 'text-xs' : 'text-[11px]',
                  )}
                >
                  {tile.label}
                </div>
                {/* Inline ratio bar */}
                <div className="h-1 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', theme.progressFill)}
                    style={{ width: `${Math.max(8, ratio * 100)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Expanded sections */}
        {expandedTiles.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                Sections in {expandedPart}
              </span>
              <button
                onClick={() => setExpandedPart(null)}
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                Collapse
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
              {expandedTiles.map((tile) => {
                const theme = getPartTheme(tile.partTitle);
                const isActive =
                  selectedPart === tile.partTitle && selectedChapter === tile.chapterNumber;
                return (
                  <button
                    key={tile.key}
                    onClick={() => handleTileClick(tile)}
                    className={cn(
                      'rounded-md border px-2 py-1.5 text-left transition-all',
                      theme.tintBg,
                      theme.chipBorder,
                      isActive && 'ring-2 ring-emerald-400',
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center h-4 min-w-4 px-1 rounded text-[9px] font-mono font-bold',
                          'bg-gradient-to-br text-white',
                          theme.badgeGradient,
                        )}
                      >
                        {tile.roman}
                      </span>
                      <span className={cn('text-[10px] font-mono', theme.chipText)}>
                        {tile.formulaCount}
                      </span>
                    </div>
                    <div className="text-[11px] font-medium leading-tight mt-1 truncate">
                      {tile.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LayoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="4" rx="1" />
      <rect x="14" y="11" width="7" height="10" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export default LibraryTreemap;
