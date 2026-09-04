'use client';

/**
 * Subscription management page — for authenticated farmers.
 *
 * URL: /subscribe
 *
 * Lets a logged-in farmer:
 *   - View their current subscription status
 *   - Pick preferred daily brief time (HH:MM in Algeria time)
 *   - Pick UI language (EN/FR/AR) — affects brief language
 *   - Consent to the privacy policy (required checkbox)
 *   - Subscribe / update / unsubscribe
 *
 * Foundation mode: subscription is saved to the Subscription table but no
 * WhatsApp message is sent (just logged to console in stub mode). When live,
 * a welcome template is sent on first subscription.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sprout, Bell, Clock, Languages, ShieldCheck, Loader2,
  AlertCircle, CheckCircle2, XCircle, ArrowRight, ArrowLeft,
} from 'lucide-react';
import { useTranslation } from '@/lib/language-store';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { prettyAlgerianPhone } from '@/lib/phone-utils';

interface SubscriptionInfo {
  enabled: boolean;
  preferredTime: string;
  consentedAt: string | null;
  consentVersion: string | null;
  unsubscribedAt: string | null;
  nextSendAt: string | null;
}

interface SubscribeGetResponse {
  farmer: {
    phoneE164: string;
    language: 'EN' | 'FR' | 'AR';
    displayName: string | null;
  };
  subscription: SubscriptionInfo | null;
}

const TIME_PRESETS = [
  { value: '05:30', label: { en: '5:30 AM', fr: '5h30', ar: '5:30 صباحاً' } },
  { value: '06:00', label: { en: '6:00 AM', fr: '6h00', ar: '6:00 صباحاً' }, default: true },
  { value: '06:30', label: { en: '6:30 AM', fr: '6h30', ar: '6:30 صباحاً' } },
  { value: '07:00', label: { en: '7:00 AM', fr: '7h00', ar: '7:00 صباحاً' } },
  { value: '19:00', label: { en: '7:00 PM', fr: '19h00', ar: '7:00 مساءً' } },
];

export default function SubscribePage() {
  const { isRTL, language } = useTranslation();
  const isArabic = language === 'ar';
  const isFrench = language === 'fr';
  const DirectionArrow = isRTL ? ArrowLeft : ArrowRight;
  const t = (en: string, ar: string, fr: string) => (isArabic ? ar : isFrench ? fr : en);

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [phoneE164, setPhoneE164] = useState('');
  const [preferredTime, setPreferredTime] = useState('06:00');
  const [customTime, setCustomTime] = useState('');
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionInfo | null>(null);

  // Load current subscription on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/subscribe');
        if (res.status === 401) {
          router.push('/auth');
          return;
        }
        const data: SubscribeGetResponse = await res.json();
        if (cancelled) return;
        setPhoneE164(data.farmer.phoneE164);
        if (data.subscription) {
          setCurrentSubscription(data.subscription);
          setPreferredTime(data.subscription.preferredTime);
          // If time isn't in presets, show as custom
          if (!TIME_PRESETS.find(p => p.value === data.subscription?.preferredTime)) {
            setCustomTime(data.subscription.preferredTime);
            setUseCustomTime(true);
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Network error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setSuccess(null);
    if (!consentAccepted) {
      setError(t(
        'Please accept the privacy policy to subscribe.',
        'يرجى قبول سياسة الخصوصية للاشتراك.',
        'Veuillez accepter la politique de confidentialité pour vous abonner.',
      ));
      return;
    }
    const time = useCustomTime ? customTime : preferredTime;
    if (!/^\d{2}:\d{2}$/.test(time)) {
      setError(t(
        'Invalid time format. Use HH:MM.',
        'صيغة وقت غير صحيحة. استخدم HH:MM.',
        'Format d\'heure invalide. Utilisez HH:MM.',
      ));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: true,
          preferredTime: time,
          consentAccepted: true,
          consentVersion: '1.0',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Subscription failed');
        return;
      }
      setCurrentSubscription(data.subscription);
      setSuccess(t(
        'Subscribed! Your first brief arrives tomorrow at the chosen time.',
        'تم الاشتراك! سيصلك أول ملخص غداً في الوقت المختار.',
        'Abonné ! Votre premier brief arrivera demain à l\'heure choisie.',
      ));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setSubmitting(false);
    }
  }, [consentAccepted, customTime, preferredTime, useCustomTime, t]);

  const handleUnsubscribe = useCallback(async () => {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/subscribe', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Unsubscribe failed');
        return;
      }
      setCurrentSubscription(prev => prev ? {
        ...prev,
        enabled: false,
        unsubscribedAt: new Date().toISOString(),
        nextSendAt: null,
      } : null);
      setSuccess(t(
        'Unsubscribed. You will not receive any more WhatsApp briefs.',
        'تم إلغاء الاشتراك. لن تتلقى المزيد من ملخصات واتساب.',
        'Désabonné. Vous ne recevrez plus de briefs WhatsApp.',
      ));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setSubmitting(false);
    }
  }, [t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isSubscribed = currentSubscription?.enabled && !currentSubscription.unsubscribedAt;

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

      <main className="mx-auto max-w-[560px] px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <Bell className="h-6 w-6 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('Daily WhatsApp Brief', 'ملخص واتساب اليومي', 'Brief WhatsApp quotidien')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(
              'Get your weather, irrigation, and tasks delivered to WhatsApp every morning.',
              'احصل على الطقس والري والمهام عبر واتساب كل صباح.',
              'Recevez météo, irrigation et tâches sur WhatsApp chaque matin.',
            )}
          </p>
        </div>

        {/* Current status */}
        {currentSubscription && (
          <div className={`mb-6 rounded-lg border p-4 ${
            isSubscribed
              ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
              : 'border-muted bg-muted/30'
          }`}>
            <div className="flex items-start gap-3">
              {isSubscribed ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
              )}
              <div className="flex-1 text-sm">
                <p className="font-medium">
                  {isSubscribed
                    ? t('Subscribed', 'مشترك', 'Abonné')
                    : t('Not subscribed', 'غير مشترك', 'Non abonné')}
                </p>
                {isSubscribed && (
                  <p className="text-muted-foreground mt-0.5">
                    {t(
                      `Brief time: ${currentSubscription.preferredTime} (Algeria)`,
                      `وقت الملخص: ${currentSubscription.preferredTime} (الجزائر)`,
                      `Heure du brief: ${currentSubscription.preferredTime} (Algérie)`,
                    )}
                  </p>
                )}
                {currentSubscription.consentedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t(
                      `Consented: ${new Date(currentSubscription.consentedAt).toLocaleDateString()}`,
                      `الموافقة: ${new Date(currentSubscription.consentedAt).toLocaleDateString('ar-DZ')}`,
                      `Consentement: ${new Date(currentSubscription.consentedAt).toLocaleDateString('fr-FR')}`,
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Phone number (read-only) */}
        <div className="mb-6 space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            {t('Phone number', 'رقم الهاتف', 'Numéro de téléphone')}
          </Label>
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm font-medium">
            {prettyAlgerianPhone(phoneE164)}
          </div>
        </div>

        {/* Time picker */}
        <div className="mb-6 space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4 text-emerald-600" />
            {t('Brief time (Algeria)', 'وقت الملخص (الجزائر)', 'Heure du brief (Algérie)')}
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TIME_PRESETS.map(preset => (
              <button
                key={preset.value}
                type="button"
                onClick={() => { setPreferredTime(preset.value); setUseCustomTime(false); }}
                className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                  !useCustomTime && preferredTime === preset.value
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
                    : 'border-border hover:border-emerald-300 hover:bg-muted/50'
                }`}
              >
                {preset.label[language]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Checkbox
              id="custom-time"
              checked={useCustomTime}
              onCheckedChange={(c) => setUseCustomTime(c === true)}
            />
            <Label htmlFor="custom-time" className="cursor-pointer text-muted-foreground">
              {t('Custom time', 'وقت مخصص', 'Heure personnalisée')}
            </Label>
            {useCustomTime && (
              <Input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="ml-2 w-32"
              />
            )}
          </div>
        </div>

        {/* Consent */}
        <div className="mb-6 space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            {t('Consent', 'الموافقة', 'Consentement')}
          </Label>
          <div className="rounded-md border border-border p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={consentAccepted}
                onCheckedChange={(c) => setConsentAccepted(c === true)}
                className="mt-0.5"
              />
              <Label htmlFor="consent" className="cursor-pointer text-sm leading-relaxed">
                {t(
                  'I consent to receive daily WhatsApp messages from FormulaAtlas with my farm brief. I have read and agree to the ',
                  'أوافق على استلام رسائل واتساب يومية من فورمولا أطلس تتضمن ملخص مزرعتي. لقد قرأت ووافقت على ',
                  "J'accepte de recevoir des messages WhatsApp quotidiens de FormulaAtlas avec mon brief de ferme. J'ai lu et j'accepte la ",
                )}
                <Link href="/privacy" className="text-emerald-600 underline" target="_blank">
                  {t('Privacy Policy v1.0', 'سياسة الخصوصية v1.0', 'Politique de confidentialité v1.0')}
                </Link>
                {t(
                  '. I can unsubscribe at any time by replying STOP or clicking the unsubscribe link.',
                  '. يمكنني إلغاء الاشتراك في أي وقت بالرد بـ STOP أو بالنقر على رابط إلغاء الاشتراك.',
                  ". Je peux me désabonner à tout moment en répondant STOP ou en cliquant sur le lien de désabonnement.",
                )}
              </Label>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleSubmit}
            disabled={submitting || !consentAccepted}
            className="w-full"
            size="lg"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {isSubscribed
                  ? t('Update subscription', 'تحديث الاشتراك', 'Mettre à jour')
                  : t('Subscribe to daily brief', 'اشترك في الملخص اليومي', 'S\'abonner au brief')}
                <DirectionArrow className="h-4 w-4" />
              </>
            )}
          </Button>

          {isSubscribed && (
            <Button
              onClick={handleUnsubscribe}
              disabled={submitting}
              variant="outline"
              className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              {t('Unsubscribe', 'إلغاء الاشتراك', 'Se désabonner')}
            </Button>
          )}
        </div>

        <div className="mt-12 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          <p className="font-medium mb-1">
            {t('🔧 Foundation mode', '🔧 وضع التأسيس', '🔧 Mode fondation')}
          </p>
          <p>
            {t(
              'Subscriptions are being recorded but WhatsApp messages are not yet sent. We will notify you the moment the service goes live.',
              'يتم تسجيل الاشتراكات ولكن رسائل واتساب لا تُرسل بعد. سنخطرك بمجرد تشغيل الخدمة.',
              "Les abonnements sont enregistrés mais les messages WhatsApp ne sont pas encore envoyés. Nous vous préviendrons dès que le service sera activé.",
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
