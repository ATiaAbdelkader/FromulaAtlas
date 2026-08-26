'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Sprout } from 'lucide-react';
import { AboutPage } from '@/components/agri/about-page';
import { useTranslation } from '@/lib/language-store';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';

/**
 * Public About route.
 *
 * The app shell continues to render AboutPage as its `about` tab. This route
 * gives footer and direct links a real page without duplicating the content.
 */
export default function AboutRoute() {
  const { isRTL, language } = useTranslation();
  const isArabic = language === 'ar';
  const isFrench = language === 'fr';

  const openAppLabel = isArabic ? 'فتح التطبيق' : isFrench ? "Ouvrir l’application" : 'Open the app';
  const homeLabel = isArabic ? 'الصفحة الرئيسية' : isFrench ? "Page d’accueil" : 'Home';
  const DirectionArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background text-foreground" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-emerald-700 dark:hover:text-emerald-300">
            <Sprout className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span>Formula Atlas</span>
          </Link>
          <nav className="flex items-center gap-3 text-xs text-muted-foreground" aria-label={isArabic ? 'التنقل' : isFrench ? 'Navigation' : 'Navigation'}>
            <Link href="/" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
              <DirectionArrow className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{homeLabel}</span>
            </Link>
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/app" className="rounded-md bg-emerald-600 px-3 py-1.5 font-medium text-white transition-colors hover:bg-emerald-700">
              {openAppLabel}
            </Link>
          </nav>
        </div>
      </header>
      <AboutPage />
    </div>
  );
}
