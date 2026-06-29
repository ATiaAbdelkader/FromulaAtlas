'use client';

import { Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ShortcutRow {
  keys: string[];
  description: string;
}

const SHORTCUTS: ShortcutRow[] = [
  { keys: ['Ctrl', 'K'], description: 'Focus the search input' },
  { keys: ['Esc'], description: 'Close the open tool dialog, or clear search when no dialog is open' },
  { keys: ['Ctrl', 'S'], description: 'Save preset (copies tool inputs — full persistence coming soon)' },
  { keys: ['Ctrl', 'E'], description: 'Copy current tool\'s results to the clipboard' },
  { keys: ['1', '–', '9'], description: 'Open the Nth visible tool (when no dialog is open and search is not focused)' },
];

function KeyCap({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.75rem] h-6 px-1.5 rounded border border-border bg-muted text-[11px] font-mono font-semibold text-foreground shadow-sm">
      {children}
    </kbd>
  );
}

/**
 * Small ghost button with a Keyboard icon that opens a popover listing all
 * global keyboard shortcuts recognized by FreeToolsSection. Renders its own
 * trigger — drop it anywhere in the search/filter bar.
 */
export function KeyboardShortcutsHelp() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-10 gap-1.5 text-xs px-2.5 border border-border"
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts"
        >
          <Keyboard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline">Shortcuts</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0">
        <div className="px-3 py-2.5 border-b border-border bg-emerald-50/60 dark:bg-emerald-950/20 rounded-t-md">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
            <Keyboard className="h-3.5 w-3.5" />
            Keyboard shortcuts
          </div>
        </div>
        <div className="p-2">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-border">
              {SHORTCUTS.map((row, i) => (
                <tr key={i} className="align-middle">
                  <td className="py-2 pr-2 pl-1">
                    <div className="flex flex-wrap items-center gap-1">
                      {row.keys.map((k, j) => (
                        // alternating gap element vs keycap
                        k === '–' || k === '+' ? (
                          <span key={j} className="text-muted-foreground text-[10px]">+</span>
                        ) : (
                          <KeyCap key={j}>{k}</KeyCap>
                        )
                      ))}
                    </div>
                  </td>
                  <td className="py-2 pr-1 text-muted-foreground leading-snug">
                    {row.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 px-1 py-1.5 text-[10px] text-muted-foreground border-t border-border">
            On macOS, use <span className="font-mono">⌘</span> instead of <span className="font-mono">Ctrl</span>.
            Shortcuts are disabled while typing in inputs (except <span className="font-mono">Ctrl+K</span>).
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
