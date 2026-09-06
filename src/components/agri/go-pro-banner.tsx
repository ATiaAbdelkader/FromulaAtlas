'use client';

/**
 * GoProBanner — upgrade CTA for free users.
 *
 * Shows a small banner at the top of the app if the user is logged in
 * but doesn't have an active Pro subscription. Clicking it goes to /pricing.
 *
 * The banner is dismissable for the current session (stored in sessionStorage).
 * It reappears next session.
 *
 * Hidden if:
 *   - User is not logged in
 *   - User has Pro
 *   - User dismissed it this session
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Crown, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/lib/language-store';
import { Button } from '@/components/ui/button';

const DISMISS_KEY = 'go_pro_banner_dismissed_v1';

export function GoProBanner() {
  const { data: session, status } = useSession();
  const { isRTL, language } = useTranslation();
  const isArabic = language === 'ar';
  const isFrench = language === 'fr';
  const DirectionArrow = isRTL ? ArrowLeft : ArrowRight;
  const t = (en: string, ar: string, fr: string) => (isArabic ? ar : isFrench ? fr : en);

  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check dismissal
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') {
        setDismissed(true);
        return;
      }
    } catch { /* ignore */ }

    // Check Pro status if logged in
    if (status === 'authenticated') {
      fetch('/api/pro-status')
        .then(r => r.json())
        .then(data => setIsPro(Boolean(data.isPro)))
        .catch(() => setIsPro(false));
    } else if (status === 'unauthenticated') {
      setIsPro(false);
    }
  }, [status]);

  // Don't render while loading, if Pro, if dismissed, or if not logged in
  if (isPro === null || isPro || dismissed || status !== 'authenticated') {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  };

  return (
    <div
      className="relative rounded-lg border border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 p-3 dark:border-emerald-800 dark:from-emerald-950/40 dark:to-green-950/30"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 end-2 text-muted-foreground hover:text-foreground"
        aria-label={t('Dismiss', 'إغلاق', 'Fermer')}
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-center gap-3 pe-6">
        <Crown className="h-5 w-5 text-emerald-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
            {t(
              'Upgrade to Pro for NDVI maps, PDF reports, and multi-field support.',
              'الترقية إلى Pro لخرائط NDVI وتقارير PDF ودعم الحقول المتعددة.',
              'Passez à Pro pour les cartes NDVI, rapports PDF et multi-parcelles.',
            )}
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
            {t(
              'From 1,500 DZD/month — cancel anytime.',
              'بدءاً من 1,500 دج/شهرياً — إلغاء في أي وقت.',
              'À partir de 1 500 DZD/mois — annulation à tout moment.',
            )}
          </p>
        </div>
        <Button asChild size="sm" className="flex-shrink-0">
          <Link href="/pricing">
            {t('Go Pro', 'الترقية', 'Passer à Pro')}
            <DirectionArrow className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
