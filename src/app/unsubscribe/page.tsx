'use client';

/**
 * Public unsubscribe page — accessible via link in WhatsApp briefs.
 *
 * URL: /unsubscribe?token=...
 *
 * The token is a signed payload containing the farmerId + expiry. No login
 * required — the farmer clicks from WhatsApp, sees a confirmation, clicks
 * "Unsubscribe", done.
 *
 * In Foundation mode (stub): no WhatsApp confirmation message is sent.
 */

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sprout, ShieldAlert, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/language-store';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';

function UnsubscribeContent() {
  const { isRTL, language } = useTranslation();
  const isArabic = language === 'ar';
  const isFrench = language === 'fr';
  const t = (en: string, ar: string, fr: string) => (isArabic ? ar : isFrench ? fr : en);

  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const router = useRouter();

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'already' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // If no token, show error immediately
  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError(t(
        'No unsubscribe token found. The link in your WhatsApp message may be broken.',
        'لم يتم العثور على رمز إلغاء الاشتراك. قد يكون الرابط في رسالة واتساب معطوباً.',
        "Aucun jeton de désabonnement trouvé. Le lien dans votre message WhatsApp est peut-être cassé.",
      ));
    }
  }, [token, t]);

  const handleUnsubscribe = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, reason: 'user_clicked_link' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatus('error');
        setError(data.error ?? 'Failed to unsubscribe');
        return;
      }
      if (data.alreadyUnsubscribed) {
        setStatus('already');
      } else {
        setStatus('success');
      }
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Network error');
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-background text-foreground" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-emerald-700 dark:hover:text-emerald-300">
            <Sprout className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            FormulaAtlas
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[440px] flex-col px-4 py-12 sm:px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <ShieldAlert className="h-6 w-6 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('Unsubscribe from daily brief', 'إلغاء الاشتراك في الملخص اليومي', 'Se désabonner du brief quotidien')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(
              'You will stop receiving WhatsApp messages from FormulaAtlas.',
              'ستتوقف عن استلام رسائل واتساب من فورمولا أطلس.',
              "Vous ne recevrez plus de messages WhatsApp de FormulaAtlas.",
            )}
          </p>
        </div>

        {status === 'idle' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
              <p className="font-medium mb-2">
                {t('Before you go…', 'قبل أن تغادر…', 'Avant de partir…')}
              </p>
              <ul className="space-y-1 text-muted-foreground list-disc pl-4">
                <li>
                  {t(
                    'You will stop receiving the daily weather + irrigation brief.',
                    'ستتوقف عن استلام الملخص اليومي للطقس والري.',
                    "Vous ne recevrez plus le brief quotidien météo + irrigation.",
                  )}
                </li>
                <li>
                  {t(
                    'Your account and farm data are NOT deleted — you can resubscribe anytime.',
                    'حسابك وبيانات مزرعتك لا تُحذف — يمكنك إعادة الاشتراك في أي وقت.',
                    "Votre compte et vos données ne sont PAS supprimés — vous pouvez vous réabonner à tout moment.",
                  )}
                </li>
                <li>
                  {t(
                    'Reply STOP to any WhatsApp message as an alternative.',
                    'أرسل STOP إلى أي رسالة واتساب كبديل.',
                    'Répondez STOP à n\'importe quel message WhatsApp comme alternative.',
                  )}
                </li>
              </ul>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              onClick={handleUnsubscribe}
              disabled={!token}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              {t('Yes, unsubscribe me', 'نعم، ألغِ اشتراكي', 'Oui, me désabonner')}
            </Button>

            <button
              onClick={() => router.push('/app')}
              className="w-full text-center text-xs text-muted-foreground underline hover:text-foreground"
            >
              {t('Keep my subscription', 'احتفظ باشتراكي', 'Garder mon abonnement')}
            </button>
          </div>
        )}

        {status === 'loading' && (
          <div className="space-y-4 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t('Processing…', 'جارٍ المعالجة…', 'Traitement…')}
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold">
              {t('You are unsubscribed', 'تم إلغاء اشتراكك', 'Vous êtes désabonné')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t(
                'You will not receive any more WhatsApp messages from FormulaAtlas. We respect your choice.',
                'لن تتلقى المزيد من رسائل واتساب من فورمولا أطلس. نحترم اختيارك.',
                "Vous ne recevrez plus de messages WhatsApp de FormulaAtlas. Nous respectons votre choix.",
              )}
            </p>
            <Button onClick={() => router.push('/')} variant="outline" className="w-full">
              {t('Back to home', 'العودة للرئيسية', 'Retour à l\'accueil')}
            </Button>
          </div>
        )}

        {status === 'already' && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold">
              {t('Already unsubscribed', 'تم إلغاء الاشتراك بالفعل', 'Déjà désabonné')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t(
                'You were already unsubscribed — no action needed.',
                'كنت قد ألغيت اشتراكك بالفعل — لا حاجة لأي إجراء.',
                'Vous étiez déjà désabonné — aucune action nécessaire.',
              )}
            </p>
            <Button onClick={() => router.push('/')} variant="outline" className="w-full">
              {t('Back to home', 'العودة للرئيسية', 'Retour à l\'accueil')}
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold">
              {t('Something went wrong', 'حدث خطأ ما', 'Une erreur est survenue')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {error ?? t('Please try again later.', 'حاول مرة أخرى لاحقاً.', 'Veuillez réessayer plus tard.')}
            </p>
            <Button onClick={() => router.push('/')} variant="outline" className="w-full">
              {t('Back to home', 'العودة للرئيسية', 'Retour à l\'accueil')}
            </Button>
          </div>
        )}

        <div className="mt-12 text-center text-xs text-muted-foreground">
          <Link href="/privacy" className="underline hover:text-foreground" target="_blank">
            {t('Privacy Policy', 'سياسة الخصوصية', 'Politique de confidentialité')}
          </Link>
          {' · '}
          <a href="mailto:privacy@formulaatlas.dz" className="underline hover:text-foreground">
            privacy@formulaatlas.dz
          </a>
        </div>
      </main>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}
