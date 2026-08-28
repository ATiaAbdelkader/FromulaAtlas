'use client';

import { useEffect } from 'react';
import { Check, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguageStore, useTranslation, type Language } from '@/lib/language-store';
import { cn } from '@/lib/utils';

const LANGUAGE_OPTIONS: Array<{ value: Language; label: string; nativeLabel: string }> = [
  { value: 'en', label: 'English', nativeLabel: 'English' },
  { value: 'fr', label: 'French', nativeLabel: 'Français' },
  { value: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
];

/**
 * Accessible language selector for English, French, and Arabic.
 *
 * Persists through the shared Zustand language store and updates <html dir>
 * and <html lang> after hydration so server-rendered markup stays stable.
 */
export function LanguageToggle() {
  const { language, setLanguage } = useLanguageStore();
  const { t } = useTranslation();

  useEffect(() => {
    const html = document.documentElement;
    html.dir = language === 'ar' ? 'rtl' : 'ltr';
    html.lang = language;
  }, [language]);

  const currentLabel = language === 'ar' ? 'ع' : language.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-9 px-2 gap-1 text-xs font-semibold',
            language === 'ar'
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-muted-foreground hover:text-foreground',
          )}
          title={t.switchLanguage}
          aria-label={t.switchLanguage}
        >
          <Languages className="h-4 w-4" />
          <span>{currentLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {LANGUAGE_OPTIONS.map(option => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setLanguage(option.value)}
            className={cn('gap-2 cursor-pointer', language === option.value && 'bg-accent')}
          >
            <span className="w-7 text-center text-xs font-semibold">{option.value === 'ar' ? 'ع' : option.value.toUpperCase()}</span>
            <span className="flex-1">{option.nativeLabel}</span>
            {language === option.value && <Check className="h-3.5 w-3.5 text-emerald-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
