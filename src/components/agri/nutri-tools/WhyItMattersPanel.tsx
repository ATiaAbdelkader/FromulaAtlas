'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ChevronDown, ChevronUp, Lightbulb, AlertTriangle, ExternalLink } from 'lucide-react';

export interface WhyItMatters {
  example: string;        // real-world scenario
  science: string;        // 1-paragraph explanation
  mistakes: string[];     // common pitfalls
  references: { label: string; url: string }[];
}

interface Props {
  title?: string;
  content: WhyItMatters;
}

/**
 * Collapsible educational panel shown below a tool.
 * Explains the real-world context, the science, common mistakes,
 * and links to authoritative references (FAO, USDA, Fertilizers Europe, etc.).
 */
export function WhyItMattersPanel({ title = 'Why this matters', content }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="border-dashed">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-7 w-7 rounded-md bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300">
            <BookOpen className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-[11px] text-muted-foreground">Real-world example, science, common mistakes, references</div>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <CardContent className="pt-0 space-y-3 text-sm">
          {/* Real-world example */}
          <div className="rounded-md p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300 font-semibold mb-1.5">
              <Lightbulb className="h-3 w-3" /> Real-world example
            </div>
            <p className="text-xs leading-relaxed text-foreground">{content.example}</p>
          </div>

          {/* Science */}
          <div className="rounded-md p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
            <div className="text-[11px] uppercase tracking-wide text-blue-700 dark:text-blue-300 font-semibold mb-1.5">The science</div>
            <p className="text-xs leading-relaxed text-foreground">{content.science}</p>
          </div>

          {/* Common mistakes */}
          <div className="rounded-md p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-amber-700 dark:text-amber-300 font-semibold mb-1.5">
              <AlertTriangle className="h-3 w-3" /> Common mistakes
            </div>
            <ul className="text-xs leading-relaxed text-foreground space-y-1 list-disc pl-4">
              {content.mistakes.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>

          {/* References */}
          {content.references.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {content.references.map((ref, i) => (
                <a
                  key={i}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-border bg-background hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  {ref.label}
                </a>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
