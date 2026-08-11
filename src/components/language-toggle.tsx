'use client';

import { useEffect } from 'react';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguageStore, useTranslation } from '@/lib/language-store';
import { cn } from '@/lib/utils';

/**
 * Toggles between English (LTR) and Arabic (RTL).
 *
 * Persists to localStorage via Zustand. Updates <html dir> and <html lang>
 * in a useEffect so server-rendered markup stays clean.
 *
 * The button shows the language you'll switch TO, not the current one:
 *   - When EN is active → shows "ع" (click to switch to Arabic)
 *   - When AR is active → shows "EN" (click to switch to English)
 */
export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguageStore();
  const { t } = useTranslation();

  useEffect(() => {
    const html = document.documentElement;
    html.dir = language === 'ar' ? 'rtl' : 'ltr';
    html.lang = language;
  }, [language]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className={cn(
        'h-9 px-2 gap-1 text-xs font-semibold',
        language === 'ar'
          ? 'text-emerald-700 dark:text-emerald-400'
          : 'text-muted-foreground hover:text-foreground'
      )}
      title={language === 'en' ? t.switchToArabic : t.switchToEnglish}
      aria-label={language === 'en' ? t.switchToArabic : t.switchToEnglish}
    >
      <Languages className="h-4 w-4" />
      {language === 'en' ? 'ع' : 'EN'}
    </Button>
  );
}
