'use client';

import Link from 'next/link';
import { Sprout, CheckCircle2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/language-store';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

function PaymentSuccessContent() {
  const { isRTL, language } = useTranslation();
  const isArabic = language === 'ar';
  const isFrench = language === 'fr';
  const t = (en: string, ar: string, fr: string) => (isArabic ? ar : isFrench ? fr : en);

  const searchParams = useSearchParams();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    // Give the webhook a moment to process, then check Pro status
    const timer = setTimeout(() => setVerifying(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <Sprout className="h-4 w-4 text-emerald-600" />
            FormulaAtlas
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[440px] px-4 py-16 text-center">
        {verifying ? (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              {t('Verifying payment…', 'جارٍ التحقق من الدفع…', 'Vérification du paiement…')}
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {t('Welcome to Pro!', 'مرحباً في Pro!', 'Bienvenue dans Pro !')}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {t(
                'Your subscription is active. You now have access to all Pro features.',
                'اشتراكك مفعّل. الآن لديك وصول إلى جميع مزايا Pro.',
                'Votre abonnement est actif. Vous avez maintenant accès à toutes les fonctionnalités Pro.',
              )}
            </p>
            <Button asChild className="w-full" size="lg">
              <Link href="/app">
                {t('Start using Pro', 'ابدأ استخدام Pro', 'Commencer avec Pro')}
              </Link>
            </Button>
          </>
        )}
      </main>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
