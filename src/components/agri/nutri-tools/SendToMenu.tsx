'use client';

import { Send, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { sendToBridge } from '@/lib/tool-bridge';
import { toast } from '@/hooks/use-toast';

export interface SendToTarget {
  /** Tool ID of the receiver (matches `ToolMeta.id`). */
  toolId: string;
  /** Human-readable name shown in the menu + toast. */
  label: string;
  /** Field name → value mapping the receiver will consume. */
  values: Record<string, number | string>;
  /** Short summary shown under the label, e.g. `"60 m³, 1 ha"`. */
  description?: string;
}

export interface SendToMenuProps {
  /** Tool ID of the current (sending) tool. */
  sourceToolId: string;
  /** List of tools the current result can be sent to. */
  targets: SendToTarget[];
  /** Optional className for the trigger wrapper. */
  className?: string;
}

/**
 * Small "Send to →" dropdown button placed at the top of a tool's result area.
 * Each target item shows the target tool's name and a short description of the
 * values that will be sent. On click: calls `sendToBridge(...)` and shows a
 * toast confirming the send.
 *
 * Renders `null` when `targets` is empty — so source tools can build the
 * targets array dynamically and only render the button when there's a valid
 * result to send.
 */
export function SendToMenu({ sourceToolId, targets, className }: SendToMenuProps) {
  if (targets.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className={`h-8 gap-1.5 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/40 ${className ?? ''}`}
        >
          <Send className="h-3.5 w-3.5" /> Send to
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Send current result to…
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {targets.map((t) => (
          <DropdownMenuItem
            key={t.toolId}
            onClick={() => {
              sendToBridge({
                targetToolId: t.toolId,
                sourceToolId,
                values: t.values,
              });
              toast({
                title: `Sent to ${t.label}`,
                description: 'Open the tool to apply the values.',
              });
            }}
            className="flex items-start gap-2 py-2"
          >
            <ArrowRight className="h-3.5 w-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium">{t.label}</div>
              {t.description && (
                <div className="text-[10px] text-muted-foreground truncate">
                  {t.description}
                </div>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
