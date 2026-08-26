// Part-level metadata: domain grouping, icons, and color themes
// Used by sidebar navigation, formula cards, and detail dialog.

import {
  Sprout,
  PawPrint,
  Leaf,
  Wrench,
  Beaker,
  Microscope,
  Cpu,
  LineChart,
  Database,
  Bug,
  ScanLine,
  Globe2,
  type LucideIcon,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

export type Domain = 'crop' | 'animal' | 'cross-cutting';

export interface PartTheme {
  /** lucide icon component */
  icon: LucideIcon;
  /** primary accent color (hex) */
  accent: string;
  /** light tint background (tailwind class) */
  tintBg: string;
  /** chip background (tailwind class) */
  chipBg: string;
  /** chip text color (tailwind class) */
  chipText: string;
  /** chip border color (tailwind class) */
  chipBorder: string;
  /** roman numeral badge gradient (tailwind class) */
  badgeGradient: string;
  /** progress bar fill (tailwind class) */
  progressFill: string;
  /** domain for grouping */
  domain: Domain;
}

// Map part titles to themes. Use partial match for resilience.
const partThemeMap: { match: string; theme: Omit<PartTheme, 'icon'>; icon: LucideIcon }[] = [
  {
    match: 'Foundations of Agriculture',
    icon: Sprout,
    theme: {
      accent: '#78716c',
      tintBg: 'bg-stone-100 dark:bg-stone-900/60',
      chipBg: 'bg-stone-100 dark:bg-stone-900/60',
      chipText: 'text-stone-700 dark:text-stone-300',
      chipBorder: 'border-stone-300 dark:border-stone-700',
      badgeGradient: 'from-stone-500 to-stone-700',
      progressFill: 'bg-stone-500',
      domain: 'cross-cutting',
    },
  },
  {
    match: 'Crop Production Formulas',
    icon: Sprout,
    theme: {
      accent: '#059669',
      tintBg: 'bg-emerald-50 dark:bg-emerald-950/40',
      chipBg: 'bg-emerald-50 dark:bg-emerald-950/40',
      chipText: 'text-emerald-700 dark:text-emerald-300',
      chipBorder: 'border-emerald-200 dark:border-emerald-900',
      badgeGradient: 'from-emerald-500 to-green-700',
      progressFill: 'bg-emerald-500',
      domain: 'crop',
    },
  },
  {
    match: 'Animal Production Formulas',
    icon: PawPrint,
    theme: {
      accent: '#d97706',
      tintBg: 'bg-amber-50 dark:bg-amber-950/40',
      chipBg: 'bg-amber-50 dark:bg-amber-950/40',
      chipText: 'text-amber-700 dark:text-amber-300',
      chipBorder: 'border-amber-200 dark:border-amber-900',
      badgeGradient: 'from-amber-500 to-orange-700',
      progressFill: 'bg-amber-500',
      domain: 'animal',
    },
  },
  {
    match: 'Sustainability & Farm Economics',
    icon: Leaf,
    theme: {
      accent: '#0d9488',
      tintBg: 'bg-teal-50 dark:bg-teal-950/40',
      chipBg: 'bg-teal-50 dark:bg-teal-950/40',
      chipText: 'text-teal-700 dark:text-teal-300',
      chipBorder: 'border-teal-200 dark:border-teal-900',
      badgeGradient: 'from-teal-500 to-cyan-700',
      progressFill: 'bg-teal-500',
      domain: 'cross-cutting',
    },
  },
  {
    match: 'Tools & Applications',
    icon: Wrench,
    theme: {
      accent: '#475569',
      tintBg: 'bg-slate-100 dark:bg-slate-900/60',
      chipBg: 'bg-slate-100 dark:bg-slate-900/60',
      chipText: 'text-slate-700 dark:text-slate-300',
      chipBorder: 'border-slate-300 dark:border-slate-700',
      badgeGradient: 'from-slate-500 to-slate-700',
      progressFill: 'bg-slate-500',
      domain: 'cross-cutting',
    },
  },
  {
    match: 'Appendices',
    icon: Database,
    theme: {
      accent: '#6b7280',
      tintBg: 'bg-gray-100 dark:bg-gray-900/60',
      chipBg: 'bg-gray-100 dark:bg-gray-900/60',
      chipText: 'text-gray-700 dark:text-gray-300',
      chipBorder: 'border-gray-300 dark:border-gray-700',
      badgeGradient: 'from-gray-500 to-gray-700',
      progressFill: 'bg-gray-500',
      domain: 'cross-cutting',
    },
  },
  {
    match: 'Advanced Crop Science',
    icon: Beaker,
    theme: {
      accent: '#65a30d',
      tintBg: 'bg-lime-50 dark:bg-lime-950/40',
      chipBg: 'bg-lime-50 dark:bg-lime-950/40',
      chipText: 'text-lime-700 dark:text-lime-300',
      chipBorder: 'border-lime-200 dark:border-lime-900',
      badgeGradient: 'from-lime-500 to-green-700',
      progressFill: 'bg-lime-500',
      domain: 'crop',
    },
  },
  {
    match: 'Advanced Animal Science',
    icon: Microscope,
    theme: {
      accent: '#ea580c',
      tintBg: 'bg-orange-50 dark:bg-orange-950/40',
      chipBg: 'bg-orange-50 dark:bg-orange-950/40',
      chipText: 'text-orange-700 dark:text-orange-300',
      chipBorder: 'border-orange-200 dark:border-orange-900',
      badgeGradient: 'from-orange-500 to-red-700',
      progressFill: 'bg-orange-500',
      domain: 'animal',
    },
  },
  {
    match: 'Digital Agriculture & Technology',
    icon: Cpu,
    theme: {
      accent: '#0891b2',
      tintBg: 'bg-cyan-50 dark:bg-cyan-950/40',
      chipBg: 'bg-cyan-50 dark:bg-cyan-950/40',
      chipText: 'text-cyan-700 dark:text-cyan-300',
      chipBorder: 'border-cyan-200 dark:border-cyan-900',
      badgeGradient: 'from-cyan-500 to-blue-700',
      progressFill: 'bg-cyan-500',
      domain: 'cross-cutting',
    },
  },
  {
    match: 'Advanced Farm Economics',
    icon: LineChart,
    theme: {
      accent: '#7c3aed',
      tintBg: 'bg-violet-50 dark:bg-violet-950/40',
      chipBg: 'bg-violet-50 dark:bg-violet-950/40',
      chipText: 'text-violet-700 dark:text-violet-300',
      chipBorder: 'border-violet-200 dark:border-violet-900',
      badgeGradient: 'from-violet-500 to-purple-700',
      progressFill: 'bg-violet-500',
      domain: 'cross-cutting',
    },
  },
  {
    match: 'Reference Materials',
    icon: Database,
    theme: {
      accent: '#475569',
      tintBg: 'bg-slate-100 dark:bg-slate-900/60',
      chipBg: 'bg-slate-100 dark:bg-slate-900/60',
      chipText: 'text-slate-700 dark:text-slate-300',
      chipBorder: 'border-slate-300 dark:border-slate-700',
      badgeGradient: 'from-slate-500 to-slate-700',
      progressFill: 'bg-slate-500',
      domain: 'cross-cutting',
    },
  },
  {
    match: 'Soil & Crop Science',
    icon: Sprout,
    theme: {
      accent: '#16a34a',
      tintBg: 'bg-green-50 dark:bg-green-950/40',
      chipBg: 'bg-green-50 dark:bg-green-950/40',
      chipText: 'text-green-700 dark:text-green-300',
      chipBorder: 'border-green-200 dark:border-green-900',
      badgeGradient: 'from-green-500 to-emerald-700',
      progressFill: 'bg-green-500',
      domain: 'crop',
    },
  },
  {
    match: 'Animal Science',
    icon: Bug,
    theme: {
      accent: '#ca8a04',
      tintBg: 'bg-yellow-50 dark:bg-yellow-950/40',
      chipBg: 'bg-yellow-50 dark:bg-yellow-950/40',
      chipText: 'text-yellow-700 dark:text-yellow-300',
      chipBorder: 'border-yellow-200 dark:border-yellow-900',
      badgeGradient: 'from-yellow-500 to-amber-700',
      progressFill: 'bg-yellow-500',
      domain: 'animal',
    },
  },
  {
    match: 'Technology, Traceability',
    icon: ScanLine,
    theme: {
      accent: '#2563eb',
      tintBg: 'bg-blue-50 dark:bg-blue-950/40',
      chipBg: 'bg-blue-50 dark:bg-blue-950/40',
      chipText: 'text-blue-700 dark:text-blue-300',
      chipBorder: 'border-blue-200 dark:border-blue-900',
      badgeGradient: 'from-blue-500 to-indigo-700',
      progressFill: 'bg-blue-500',
      domain: 'cross-cutting',
    },
  },
  {
    match: 'Advanced Farm Economics & Policy',
    icon: LineChart,
    theme: {
      accent: '#9333ea',
      tintBg: 'bg-purple-50 dark:bg-purple-950/40',
      chipBg: 'bg-purple-50 dark:bg-purple-950/40',
      chipText: 'text-purple-700 dark:text-purple-300',
      chipBorder: 'border-purple-200 dark:border-purple-900',
      badgeGradient: 'from-purple-500 to-fuchsia-700',
      progressFill: 'bg-purple-500',
      domain: 'cross-cutting',
    },
  },
  {
    match: 'Visual Guides',
    icon: Globe2,
    theme: {
      accent: '#e11d48',
      tintBg: 'bg-rose-50 dark:bg-rose-950/40',
      chipBg: 'bg-rose-50 dark:bg-rose-950/40',
      chipText: 'text-rose-700 dark:text-rose-300',
      chipBorder: 'border-rose-200 dark:border-rose-900',
      badgeGradient: 'from-rose-500 to-pink-700',
      progressFill: 'bg-rose-500',
      domain: 'cross-cutting',
    },
  },
  {
    match: 'Benchmark Database',
    icon: Database,
    theme: {
      accent: '#64748b',
      tintBg: 'bg-slate-100 dark:bg-slate-900/60',
      chipBg: 'bg-slate-100 dark:bg-slate-900/60',
      chipText: 'text-slate-700 dark:text-slate-300',
      chipBorder: 'border-slate-300 dark:border-slate-700',
      badgeGradient: 'from-slate-500 to-slate-700',
      progressFill: 'bg-slate-500',
      domain: 'cross-cutting',
    },
  },
];

const defaultTheme: Omit<PartTheme, 'icon'> = {
  accent: '#78716c',
  tintBg: 'bg-stone-100 dark:bg-stone-900/60',
  chipBg: 'bg-stone-100 dark:bg-stone-900/60',
  chipText: 'text-stone-700 dark:text-stone-300',
  chipBorder: 'border-stone-300 dark:border-stone-700',
  badgeGradient: 'from-stone-500 to-stone-700',
  progressFill: 'bg-stone-500',
  domain: 'cross-cutting' as Domain,
};

const defaultIcon: LucideIcon = Sprout;

export function getPartTheme(partTitle: string): PartTheme {
  for (const entry of partThemeMap) {
    if (partTitle.includes(entry.match)) {
      return { ...entry.theme, icon: entry.icon };
    }
  }
  return { ...defaultTheme, icon: defaultIcon };
}

export function PartIcon({ partTitle, ...props }: { partTitle: string } & LucideProps) {
  const Icon = getPartTheme(partTitle).icon;
  return <Icon {...props} />;
}

// Domain metadata for group headers
export const domainMeta: Record<Domain, { label: string; icon: LucideIcon; color: string }> = {
  crop: { label: 'Crop & Soil Science', icon: Sprout, color: 'text-emerald-600' },
  animal: { label: 'Animal Science', icon: PawPrint, color: 'text-amber-600' },
  'cross-cutting': { label: 'Cross-Cutting & Applied', icon: LineChart, color: 'text-violet-600' },
};
