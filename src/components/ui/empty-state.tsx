'use client';

/**
 * EmptyState — reusable placeholder for empty data states.
 *
 * Replaces "No data" text with a friendly SVG illustration + headline +
 * optional description + optional CTA button. Designed to be dropped into
 * any tool that has a "no data yet" state.
 *
 * Usage:
 *   <EmptyState
 *     icon={MapPin}
 *     title="No fields yet"
 *     description="Add your first field boundary to start tracking irrigation, fertilization, and scouting."
 *     action={{ label: "Add field", onClick: () => setOpen(true) }}
 *   />
 */

import { type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface EmptyStateProps {
  /** Lucide icon to display in the illustration circle. */
  icon: LucideIcon;
  /** Bold headline — keep it short, e.g. "No fields yet". */
  title: string;
  /** Supporting description — 1-2 sentences explaining what to do next. */
  description?: string;
  /** Optional CTA button. */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Optional secondary action (text-only link). */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Visual variant. 'illustration' = large SVG; 'compact' = small icon. */
  variant?: 'illustration' | 'compact';
  /** Accent color (hex). Defaults to emerald. */
  color?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  variant = 'illustration',
  color = '#16a34a',
}: EmptyStateProps) {
  if (variant === 'compact') {
    return (
      <div className="flex flex-col items-center justify-center text-center py-6 px-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
          style={{ backgroundColor: color + '15' }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div className="text-xs font-semibold">{title}</div>
        {description && (
          <div className="text-[10px] text-muted-foreground mt-0.5 max-w-[280px]">{description}</div>
        )}
        {action && (
          <Button size="sm" variant="outline" onClick={action.onClick} className="mt-2 text-[10px] h-7 gap-1">
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      {/* Illustration: dashed circle with icon + decorative dots */}
      <div className="relative mb-4">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Dashed outer circle */}
          <circle cx="60" cy="60" r="50" fill={color + '08'} stroke={color} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5" />
          {/* Inner filled circle */}
          <circle cx="60" cy="60" r="34" fill={color + '15'} />
          {/* Decorative dots around */}
          <circle cx="20" cy="60" r="2" fill={color} opacity="0.3" />
          <circle cx="100" cy="60" r="2" fill={color} opacity="0.3" />
          <circle cx="60" cy="20" r="2" fill={color} opacity="0.3" />
          <circle cx="60" cy="100" r="2" fill={color} opacity="0.3" />
          <circle cx="32" cy="32" r="1.5" fill={color} opacity="0.2" />
          <circle cx="88" cy="32" r="1.5" fill={color} opacity="0.2" />
          <circle cx="32" cy="88" r="1.5" fill={color} opacity="0.2" />
          <circle cx="88" cy="88" r="1.5" fill={color} opacity="0.2" />
        </svg>
        {/* Icon centered on top */}
        <div
          className="absolute inset-0 flex items-center justify-center"
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: color + '20' }}
          >
            <Icon className="h-7 w-7" style={{ color }} />
          </div>
        </div>
      </div>

      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-muted-foreground max-w-[360px] mb-4 leading-relaxed">{description}</p>
      )}
      {action && (
        <Button size="sm" onClick={action.onClick} className="gap-1.5" style={{ backgroundColor: color }}>
          {action.label}
        </Button>
      )}
      {secondaryAction && (
        <button
          onClick={secondaryAction.onClick}
          className="text-[11px] text-muted-foreground hover:text-foreground mt-2 underline-offset-2 hover:underline"
        >
          {secondaryAction.label}
        </button>
      )}
    </div>
  );
}
