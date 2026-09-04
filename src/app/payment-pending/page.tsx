'use client';

import Link from 'next/link';
import { Sprout, Clock, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useTranslation } from '@/lib/language-store';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';

function PaymentPendingContent() {
  const { isRTL, language } = useTranslation();
  const isArabic = language === 'ar';
  const isFrench = language === 'fr';
  const t = (en: string, ar: string, fr: string) => (isArabic ? ar : isFrench ? fr : en);

  const searchParams = useSearchParams();
  const status = searchParams.get('status');

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
        {status === 'failed' ? (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {t('Payment failed', 'فشل الدفع', 'Paiement échoué')}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {t(
                'Your payment could not be completed. Please try again or contact support.',
                'تعذّر إتمام الدفع. حاول مرة أخرى أو تواصل مع الدعم.',
                'Votre paiement n\'a pas pu être complété. Veuillez réessayer ou contacter le support.',
              )}
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {t('Payment not yet live', 'الدفع غير مفعّل بعد', 'Paiement pas encore actif')}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {t(
                'We are setting up payment integration with Chargily (CIB + Edahabia). Your subscription intent has been recorded — we will contact you when payment goes live.',
                'نحن نقوم بإعداد تكامل الدفع مع Chargily (CIB + الذهبية). تم تسجيل طلب اشتراكك — سنتواصل معك عند تفعيل الدفع.',
                "Nous configurons l'intégration de paiement avec Chargily (CIB + Edahabia). Votre intention d'abonnement a été enregistrée — nous vous contacterons dès que le paiement sera actif.",
              )}
            </p>
          </>
        )}

        <Button asChild variant="outline" className="w-full">
          <Link href="/app">
            {t('Back to app', 'العودة للتطبيق', 'Retour à l\'app')}
          </Link>
        </Button>
      </main>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <PaymentPendingContent />
    </Suspense>
  );
}
