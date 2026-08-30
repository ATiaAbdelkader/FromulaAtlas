'use client';

/**
 * CalculatorShell — reusable wrapper that gives every Farm-tab calculator
 * the same polished design as YieldEstimationCalculator.
 *
 * Provides:
 *   1. Hero Header Banner — gradient background, icon badge, title +
 *      optional badge + description, action buttons (Copy / Reset / custom)
 *   2. Optional selector pill bar — crop / product / feedstock picker
 *   3. Two-column grid layout — inputs on the left, results on the right
 *   4. Formula box — optional monospace formula display
 *
 * Usage: see SeedRateCalculator or PesticideDoseCalculator for a complete
 * working example. The shell provides CalculatorShell.Inputs (left column),
 * CalculatorShell.Results (right column), CalculatorShell.InputField (small
 * bordered input card), and CalculatorShell.MetricTile (colored output card).
 *
 * The gradient colors are customizable via the `accent` prop
 * ('emerald' | 'teal' | 'sky' | 'violet' | 'amber' | 'rose').
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Calculator, Copy, Check, RotateCcw, Info, Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { copyFor, useTranslation, type Language } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TrilingualString {
  en: string;
  ar: string;
  fr: string;
}

export interface CalculatorAction {
  icon: LucideIcon;
  label: TrilingualString;
  onClick: () => void;
  /** 'primary' = filled white button; 'ghost' = transparent. Default 'ghost'. */
  variant?: 'primary' | 'ghost';
  /** Show a checkmark temporarily (for copy actions). */
  showCheck?: boolean;
}

export interface CalculatorPill {
  key: string;
  label: string;
  emoji?: string;
}

type AccentColor = 'emerald' | 'teal' | 'sky' | 'violet' | 'amber' | 'rose';

interface CalculatorShellProps {
  icon: LucideIcon;
  title: TrilingualString;
  description: TrilingualString;
  /** Optional small badge next to the title (e.g. "Agronomy Standard"). */
  badge?: string;
  /** Accent color theme for the hero gradient. Default 'emerald'. */
  accent?: AccentColor;
  /** Action buttons in the hero header (Copy, Reset, etc.). */
  actions?: CalculatorAction[];
  /** Optional selector pills below the hero (crop picker, product picker, etc.). */
  pills?: CalculatorPill[];
  /** Currently active pill key. */
  activePill?: string;
  onPillClick?: (key: string) => void;
  /** Pill bar label (e.g. "Select Crop:"). */
  pillLabel?: TrilingualString;
  /** Optional formula box shown at the bottom of the results column. */
  formula?: string;
  /** Optional formula result (highlighted). */
  formulaResult?: string;
  /** Formula label. */
  formulaLabel?: TrilingualString;
  /** Optional protocol note shown at the bottom of the inputs column. */
  protocolNote?: TrilingualString;
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Accent color mappings
// ---------------------------------------------------------------------------

const ACCENT_GRADIENT: Record<AccentColor, string> = {
  emerald: 'from-emerald-950 via-teal-900 to-cyan-950',
  teal: 'from-teal-950 via-emerald-900 to-cyan-950',
  sky: 'from-sky-950 via-blue-900 to-indigo-950',
  violet: 'from-violet-950 via-purple-900 to-indigo-950',
  amber: 'from-amber-950 via-orange-900 to-red-950',
  rose: 'from-rose-950 via-pink-900 to-red-950',
};

const ACCENT_ICON_BG: Record<AccentColor, string> = {
  emerald: 'bg-white/10 border-white/20',
  teal: 'bg-white/10 border-white/20',
  sky: 'bg-white/10 border-white/20',
  violet: 'bg-white/10 border-white/20',
  amber: 'bg-white/10 border-white/20',
  rose: 'bg-white/10 border-white/20',
};

const ACCENT_ICON_COLOR: Record<AccentColor, string> = {
  emerald: 'text-emerald-300',
  teal: 'text-teal-300',
  sky: 'text-sky-300',
  violet: 'text-violet-300',
  amber: 'text-amber-300',
  rose: 'text-rose-300',
};

const ACCENT_PILL_ACTIVE: Record<AccentColor, string> = {
  emerald: 'bg-emerald-500 text-white shadow-md',
  teal: 'bg-teal-500 text-white shadow-md',
  sky: 'bg-sky-500 text-white shadow-md',
  violet: 'bg-violet-500 text-white shadow-md',
  amber: 'bg-amber-500 text-white shadow-md',
  rose: 'bg-rose-500 text-white shadow-md',
};

const ACCENT_RESULT_HEADER: Record<AccentColor, string> = {
  emerald: 'from-emerald-50 via-background to-teal-50/50 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/20',
  teal: 'from-teal-50 via-background to-cyan-50/50 dark:from-teal-950/30 dark:via-background dark:to-cyan-950/20',
  sky: 'from-sky-50 via-background to-blue-50/50 dark:from-sky-950/30 dark:via-background dark:to-blue-950/20',
  violet: 'from-violet-50 via-background to-purple-50/50 dark:from-violet-950/30 dark:via-background dark:to-purple-950/20',
  amber: 'from-amber-50 via-background to-orange-50/50 dark:from-amber-950/30 dark:via-background dark:to-orange-950/20',
  rose: 'from-rose-50 via-background to-pink-50/50 dark:from-rose-950/30 dark:via-background dark:to-pink-950/20',
};

const ACCENT_RESULT_BADGE: Record<AccentColor, string> = {
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
  teal: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300',
  sky: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300',
  violet: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border-violet-300',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
  rose: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tr(language: Language, s: TrilingualString): string {
  return copyFor(language, s.en, s.ar, s.fr);
}

// ---------------------------------------------------------------------------
// Sub-components for the two-column layout
// ---------------------------------------------------------------------------

function InputsColumn({ children }: { children: React.ReactNode }) {
  return <div className="lg:col-span-6 space-y-4">{children}</div>;
}

function ResultsColumn({ children }: { children: React.ReactNode }) {
  return <div className="lg:col-span-6 space-y-4">{children}</div>;
}

/**
 * Input field card — the small bordered box with label + input + helper text.
 * Matches the YieldEstimationCalculator's input field design.
 */
function InputField({
  label, value, onChange, placeholder, step, helper, type = 'number', className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  step?: string;
  helper?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={cn('p-3 rounded-xl border bg-card space-y-1', className)}>
      <Label className="text-xs font-bold text-foreground">{label}</Label>
      <Input
        type={type}
        step={step}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 text-xs font-mono font-bold"
      />
      {helper && <div className="text-[10px] text-muted-foreground">{helper}</div>}
    </div>
  );
}

/**
 * Metric tile — the colored output card with a big number.
 * Matches the YieldEstimationCalculator's metric tile design.
 */
function MetricTile({
  label, value, unit, helper, color = 'default',
}: {
  label: string;
  value: string | number;
  unit?: string;
  helper?: string;
  color?: 'emerald' | 'teal' | 'sky' | 'amber' | 'rose' | 'default';
}) {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
    teal: 'bg-teal-50/60 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800',
    sky: 'bg-sky-50/60 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800',
    amber: 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    rose: 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800',
    default: 'bg-card border-border',
  };
  const textColorClasses: Record<string, string> = {
    emerald: 'text-emerald-700 dark:text-emerald-300',
    teal: 'text-teal-700 dark:text-teal-300',
    sky: 'text-sky-700 dark:text-sky-300',
    amber: 'text-amber-700 dark:text-amber-300',
    rose: 'text-rose-700 dark:text-rose-300',
    default: 'text-foreground',
  };

  return (
    <div className={cn('p-4 rounded-xl border space-y-1', colorClasses[color])}>
      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
      <div className={cn('text-2xl font-black font-mono', textColorClasses[color])}>
        {value}
        {unit && <span className="text-sm font-normal text-muted-foreground ms-1">{unit}</span>}
      </div>
      {helper && <div className="text-[10px] text-muted-foreground">{helper}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CalculatorShell({
  icon: Icon,
  title,
  description,
  badge,
  accent = 'emerald',
  actions = [],
  pills,
  activePill,
  onPillClick,
  pillLabel,
  formula,
  formulaResult,
  formulaLabel,
  protocolNote,
  children,
}: CalculatorShellProps) {
  const { language, isRTL } = useTranslation();
  const gradient = ACCENT_GRADIENT[accent];
  const iconBg = ACCENT_ICON_BG[accent];
  const iconColor = ACCENT_ICON_COLOR[accent];
  const pillActive = ACCENT_PILL_ACTIVE[accent];

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero Header Banner */}
      <div className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-r text-white p-6 shadow-xl border border-white/10',
        gradient,
      )}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={cn('p-2.5 rounded-xl backdrop-blur-md border shadow-inner', iconBg)}>
                <Icon className={cn('h-6 w-6', iconColor)} />
              </span>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  {tr(language, title)}
                  {badge && (
                    <Badge variant="outline" className={cn('text-[10px] uppercase tracking-wider', iconBg, iconColor, 'border-white/30')}>
                      {badge}
                    </Badge>
                  )}
                </h2>
              </div>
            </div>
            <p className="text-sm text-white/90 max-w-3xl leading-relaxed">
              {tr(language, description)}
            </p>
          </div>

          {/* Action buttons */}
          {actions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {actions.map((action, i) => (
                <Button
                  key={i}
                  onClick={action.onClick}
                  variant="outline"
                  size="sm"
                  className={cn(
                    'backdrop-blur font-semibold shadow-sm border-white/25',
                    action.variant === 'primary'
                      ? 'bg-white/15 hover:bg-white/25 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white',
                  )}
                >
                  {action.showCheck ? (
                    <Check className="h-4 w-4 mr-1 text-emerald-300" />
                  ) : (
                    <action.icon className={cn('h-4 w-4 mr-1', iconColor)} />
                  )}
                  {tr(language, action.label)}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Selector Pill Bar */}
        {pills && pills.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center gap-2">
            {pillLabel && (
              <span className="text-xs text-white/80 font-medium me-1">
                {tr(language, pillLabel)}
              </span>
            )}
            {pills.map((pill) => (
              <button
                key={pill.key}
                onClick={() => onPillClick?.(pill.key)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all',
                  activePill === pill.key
                    ? pillActive
                    : 'bg-white/10 hover:bg-white/20 text-white/90',
                )}
              >
                {pill.emoji && <span>{pill.emoji}</span>}
                <span>{pill.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Inputs and Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {children}
      </div>

      {/* Optional protocol note (full width, below grid) */}
      {protocolNote && (
        <div className="p-3.5 rounded-xl bg-muted/40 border text-xs text-muted-foreground space-y-1">
          <div className="font-bold text-foreground flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-emerald-600" />
            <span>{tr(language, { en: 'Methodology:', ar: 'المنهجية:', fr: 'Méthodologie :' })}</span>
          </div>
          <p className="leading-relaxed text-[11px]">{tr(language, protocolNote)}</p>
        </div>
      )}
    </div>
  );
}

// Attach sub-components for convenient access
CalculatorShell.Inputs = InputsColumn;
CalculatorShell.Results = ResultsColumn;
CalculatorShell.InputField = InputField;
CalculatorShell.MetricTile = MetricTile;
