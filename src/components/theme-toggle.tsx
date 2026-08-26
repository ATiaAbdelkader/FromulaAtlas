'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor, Sparkles, Check, Compass } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/language-store';

interface ThemeToggleProps {
  variant?: 'compact' | 'pill' | 'expanded';
  className?: string;
}

export function ThemeToggle({ variant = 'compact', className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const { language, isRTL } = useTranslation();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? (theme === 'dark' || (theme === 'system' && resolvedTheme === 'dark')) : false;

  const labels = {
    en: {
      toggle: 'Toggle theme',
      themeHeader: 'Display Environment',
      light: 'Solar Day',
      lightDesc: 'High-contrast sunlight & field readability',
      dark: 'Nocturnal Field',
      darkDesc: 'Obsidian soil & bioluminescent foliage',
      system: 'Sensor Sync',
      systemDesc: 'Follows device & solar rhythm',
      quickToggle: 'Switch to',
    },
    fr: {
      toggle: 'Changer le thème',
      themeHeader: 'Environnement d’affichage',
      light: 'Plein Soleil',
      lightDesc: 'Contraste élevé pour lecture au champ',
      dark: 'Nocturne Agricole',
      darkDesc: 'Terre d’obsidienne & bioluminescence',
      system: 'Synchronisation',
      systemDesc: 'Suit le rythme de l’appareil',
      quickToggle: 'Passer à',
    },
    ar: {
      toggle: 'تبديل المظهر',
      themeHeader: 'بيئة العرض',
      light: 'النهار الشمسي',
      lightDesc: 'تباين فائق للعمل في الحقل تحت الشمس',
      dark: 'الحقل الليلي',
      darkDesc: 'تربة سبجية ولمسات مضيئة حيوية',
      system: 'مزامنة المستشعر',
      systemDesc: 'يتماشى تلقائياً مع نظام الجهاز',
      quickToggle: 'التحويل إلى',
    },
  }[language as 'en' | 'fr' | 'ar'] || {
    toggle: 'Toggle theme',
    themeHeader: 'Display Environment',
    light: 'Solar Day',
    lightDesc: 'High-contrast sunlight & field readability',
    dark: 'Nocturnal Field',
    darkDesc: 'Obsidian soil & bioluminescent foliage',
    system: 'Sensor Sync',
    systemDesc: 'Follows device & solar rhythm',
    quickToggle: 'Switch to',
  };

  const toggleDirectly = () => {
    if (!mounted) return;
    if (theme === 'dark' || resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn(
          'h-9 w-9 p-0 rounded-xl border-border/70 bg-background/50 backdrop-blur-sm',
          className
        )}
        aria-label="Toggle theme"
      >
        <Sun className="h-4 w-4 text-muted-foreground opacity-60" />
      </Button>
    );
  }

  if (variant === 'pill') {
    return (
      <div className={cn('inline-flex items-center p-1 rounded-xl bg-muted/60 border border-border/80 backdrop-blur-sm shadow-inner', className)}>
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
            theme === 'light'
              ? 'bg-white text-emerald-950 shadow-sm font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
          title={labels.light}
        >
          <Sun className="h-3.5 w-3.5 text-amber-500" />
          <span className="hidden sm:inline">{labels.light}</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
            theme === 'dark'
              ? 'bg-[#15231c] text-emerald-300 shadow-sm border border-emerald-500/30 font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
          title={labels.dark}
        >
          <Moon className="h-3.5 w-3.5 text-emerald-400" />
          <span className="hidden sm:inline">{labels.dark}</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('system')}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all',
            theme === 'system'
              ? 'bg-background text-foreground shadow-sm font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
          title={labels.system}
        >
          <Monitor className="h-3.5 w-3.5 text-sky-400" />
        </button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'relative h-9 px-2.5 rounded-xl border-border/70 bg-background/70 hover:bg-muted/80 backdrop-blur-sm transition-all duration-300 group',
            isDark && 'border-emerald-500/30 bg-[#121c17]/90 hover:border-emerald-500/50 shadow-sm shadow-emerald-950/40',
            className
          )}
          title={`${labels.toggle} (${isDark ? labels.dark : labels.light})`}
        >
          <div className="relative w-4 h-4 flex items-center justify-center">
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.div
                  key="dark"
                  initial={{ rotate: -90, scale: 0, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: 90, scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Moon className="h-4 w-4 text-emerald-400 fill-emerald-400/20" />
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </motion.div>
              ) : (
                <motion.div
                  key="light"
                  initial={{ rotate: 90, scale: 0, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: -90, scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Sun className="h-4 w-4 text-amber-500 group-hover:rotate-45 transition-transform duration-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <span className="hidden xl:inline-block ml-2 text-xs font-semibold tracking-tight">
            {theme === 'system' ? labels.system : isDark ? labels.dark : labels.light}
          </span>
          <span className="sr-only">{labels.toggle}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={isRTL ? 'start' : 'end'}
        className="w-72 p-2 rounded-2xl border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl shadow-emerald-950/20 animate-in fade-in-50 zoom-in-95"
      >
        <div className="px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              {labels.themeHeader}
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
              {isDark ? 'Nocturnal' : 'Solar'}
            </span>
          </div>
        </div>

        <DropdownMenuSeparator className="my-1 opacity-60" />

        {/* Light Option */}
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={cn(
            'group cursor-pointer rounded-xl px-3 py-2.5 transition-all flex items-start gap-3',
            theme === 'light' && 'bg-amber-500/10 text-amber-950 dark:text-amber-200 border border-amber-500/30 font-medium'
          )}
        >
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
            theme === 'light' ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30' : 'bg-muted text-amber-500'
          )}>
            <Sun className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{labels.light}</span>
              {theme === 'light' && <Check className="h-3.5 w-3.5 text-amber-600" />}
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{labels.lightDesc}</p>
          </div>
        </DropdownMenuItem>

        {/* Dark Option */}
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={cn(
            'group cursor-pointer rounded-xl px-3 py-2.5 transition-all flex items-start gap-3 mt-1',
            theme === 'dark' && 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border border-emerald-500/35 font-medium shadow-sm'
          )}
        >
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
            theme === 'dark' ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/40' : 'bg-muted text-emerald-500'
          )}>
            <Moon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                {labels.dark}
                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-mono">Pro</span>
              </span>
              {theme === 'dark' && <Check className="h-3.5 w-3.5 text-emerald-400" />}
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{labels.darkDesc}</p>
          </div>
        </DropdownMenuItem>

        {/* System Option */}
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={cn(
            'group cursor-pointer rounded-xl px-3 py-2.5 transition-all flex items-start gap-3 mt-1',
            theme === 'system' && 'bg-primary/10 text-foreground border border-primary/20 font-medium'
          )}
        >
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
            theme === 'system' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
          )}>
            <Monitor className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{labels.system}</span>
              {theme === 'system' && <Check className="h-3.5 w-3.5 text-primary" />}
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{labels.systemDesc}</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
