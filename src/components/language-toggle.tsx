'use client';

import { useEffect } from 'react';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguageStore } from '@/lib/language-store';
import { cn } from '@/lib/utils';

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguageStore();

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
      title={language === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
    >
      <Languages className="h-4 w-4" />
      {language === 'en' ? 'ع' : 'EN'}
    </Button>
  );
}
