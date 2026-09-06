'use client';

/**
 * Phone auth page — Foundation mode.
 *
 * Flow:
 *   1. User enters Algerian phone number
 *   2. We POST /api/auth/otp/send → OTP generated + sent via WhatsApp
 *      (stub mode: OTP returned in response, shown on screen for dev convenience)
 *   3. User enters 6-digit OTP
 *   4. We POST /api/auth/otp/verify → OTP verified
 *   5. On success, we call signIn('phone-otp', { phoneE164, otp }) to set session
 *   6. Redirect to /app
 *
 * Foundation mode behavior:
 *   - In stub mode (default), the OTP is displayed on screen after send,
 *     so the user doesn't need to check console logs
 *   - In live mode, the OTP is sent via WhatsApp and not shown on screen
 *   - The phone is recorded with phoneVerified=true on successful verify
 *     (in both modes — when live, this is real verification; in stub mode,
 *     we trust the dev who completed the flow)
 */

import { useState, useCallback, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sprout, Phone, ArrowRight, ArrowLeft, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/language-store';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { normalizeAlgerianPhone, prettyAlgerianPhone } from '@/lib/phone-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Step = 'phone' | 'otp' | 'success' | 'error';

export default function AuthPage() {
  const { isRTL, language } = useTranslation();
  const isArabic = language === 'ar';
  const isFrench = language === 'fr';
  const DirectionArrow = isRTL ? ArrowLeft : ArrowRight;

  const t = (en: string, ar: string, fr: string) => (isArabic ? ar : isFrench ? fr : en);

  const [step, setStep] = useState<Step>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneE164, setPhoneE164] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresInMs, setExpiresInMs] = useState(0);
  const [retryAfter, setRetryAfter] = useState(0);

  const router = useRouter();

  // Countdown for rate limit
  useEffect(() => {
    if (retryAfter <= 0) return;
    const interval = setInterval(() => {
      setRetryAfter((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [retryAfter]);

  const handleSendOtp = useCallback(async () => {
    setError(null);
    const normalized = normalizeAlgerianPhone(phoneInput);
    if (!normalized) {
      setError(t(
        'Invalid Algerian phone. Use 06XX XXX XXX or +213 6XX XXX XXX.',
        'رقم هاتف جزائري غير صالح. استخدم 06XX XXX XXX أو +213 6XX XXX XXX.',
        'Numéro algérien invalide. Format: 06XX XXX XXX ou +213 6XX XXX XXX.',
      ));
      return;
    }

    setLoading(true);
    setDevOtpHint(null);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 429) {
          setRetryAfter(600); // 10 min
          setError(t(
            'Too many requests. Please wait 10 minutes.',
            'طلبات كثيرة. انتظر 10 دقائق.',
            'Trop de demandes. Patientez 10 minutes.',
          ));
        } else {
          setError(data.error ?? 'Failed to send OTP');
        }
        return;
      }
      setPhoneE164(normalized);
      setExpiresInMs(data.expiresInMs ?? 600_000);
      setStep('otp');
      // In stub mode, the API returns the OTP for dev convenience
      if (data.otp && data.mode === 'stub') {
        setDevOtpHint(data.otp);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [phoneInput, t]);

  const handleVerifyOtp = useCallback(async () => {
    setError(null);
    if (otpInput.length !== 6) {
      setError(t('OTP must be 6 digits', 'يجب أن يكون الرمز 6 أرقام', 'Le code doit comporter 6 chiffres'));
      return;
    }

    setLoading(true);
    try {
      // 1. Verify OTP via our endpoint
      const verifyRes = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput, otp: otpInput }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        setError(verifyData.error ?? 'Verification failed');
        return;
      }

      // 2. Sign in via NextAuth (sets the session cookie)
      const signInResult = await signIn('phone-otp', {
        phoneE164,
        otp: otpInput,
        redirect: false,
      });
      if (signInResult?.error) {
        setError(t('Session creation failed', 'فشل إنشاء الجلسة', 'Échec de création de session'));
        return;
      }

      // 3. Redirect to app
      setStep('success');
      setTimeout(() => router.push('/app'), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [otpInput, phoneInput, phoneE164, router, t]);

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
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <Phone className="h-6 w-6 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('Sign in to FormulaAtlas', 'تسجيل الدخول إلى فورمولا أطلس', 'Connexion à FormulaAtlas')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(
              'We will send a 6-digit code to your WhatsApp.',
              'سنرسل رمزاً من 6 أرقام إلى واتساب الخاص بك.',
              'Nous enverrons un code à 6 chiffres sur votre WhatsApp.',
            )}
          </p>
        </div>

        {step === 'phone' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">
                {t('Phone number', 'رقم الهاتف', 'Numéro de téléphone')}
              </Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                placeholder="06XX XXX XXX"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                disabled={loading || retryAfter > 0}
                className="text-lg"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                {t(
                  'Algerian mobile only (5/6/7 prefix).',
                  'هاتف جزائري فقط (بادئة 5/6/7).',
                  'Mobile algérien uniquement (préfixe 5/6/7).',
                )}
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              onClick={handleSendOtp}
              disabled={loading || retryAfter > 0 || phoneInput.length < 6}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : retryAfter > 0 ? (
                `${t('Wait', 'انتظر', 'Patientez')} ${Math.floor(retryAfter / 60)}:${String(retryAfter % 60).padStart(2, '0')}`
              ) : (
                <>
                  {t('Send code', 'إرسال الرمز', 'Envoyer le code')}
                  <DirectionArrow className="h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {t(
                'By continuing you agree to our ',
                'بالمتابعة فإنك توافق على ',
                'En continuant, vous acceptez notre ',
              )}
              <Link href="/privacy" className="text-emerald-600 underline" target="_blank">
                {t('Privacy Policy', 'سياسة الخصوصية', 'Politique de confidentialité')}
              </Link>
              .
            </p>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">
                {t('Verification code', 'رمز التحقق', 'Code de vérification')}
              </Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                placeholder="000000"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={loading}
                className="text-center text-2xl tracking-[0.5em]"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                {t(
                  `Sent to ${prettyAlgerianPhone(phoneE164)}`,
                  `أُرسل إلى ${prettyAlgerianPhone(phoneE164)}`,
                  `Envoyé au ${prettyAlgerianPhone(phoneE164)}`,
                )}
              </p>
            </div>

            {devOtpHint && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
                <p className="font-medium text-amber-800 dark:text-amber-300">
                  {t(
                    '🔧 Dev mode — your code is:',
                    '🔧 وضع التطوير — رمزك هو:',
                    '🔧 Mode dev — votre code est:',
                  )}
                </p>
                <p className="mt-1 text-center font-mono text-2xl tracking-[0.4em] text-amber-900 dark:text-amber-200">
                  {devOtpHint}
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  {t(
                    'Set WHATSAPP_SEND_MODE=live to send via WhatsApp.',
                    'اضبط WHATSAPP_SEND_MODE=live للإرسال عبر واتساب.',
                    'Activez WHATSAPP_SEND_MODE=live pour envoyer via WhatsApp.',
                  )}
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              onClick={handleVerifyOtp}
              disabled={loading || otpInput.length !== 6}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  {t('Verify and sign in', 'تحقق وسجل الدخول', 'Vérifier et se connecter')}
                </>
              )}
            </Button>

            <button
              onClick={() => {
                setStep('phone');
                setOtpInput('');
                setError(null);
                setDevOtpHint(null);
              }}
              className="w-full text-center text-xs text-muted-foreground underline hover:text-foreground"
              disabled={loading}
            >
              {t('Change phone number', 'تغيير رقم الهاتف', 'Changer le numéro')}
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-lg font-medium">
              {t('Signed in! Redirecting…', 'تم تسجيل الدخول! جارٍ التحويل…', 'Connecté ! Redirection…')}
            </p>
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        <div className="mt-12 rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
          <p className="mb-1 font-medium">
            {t('Why phone only?', 'لماذا الهاتف فقط؟', 'Pourquoi téléphone uniquement ?')}
          </p>
          <p>
            {t(
              'Most Algerian farmers use WhatsApp daily but rarely have email. Your phone number IS your account.',
              'معظم المزارعين الجزائريين يستخدمون واتساب يومياً لكن نادراً ما يملكون بريداً إلكترونياً. رقم هاتفك هو حسابك.',
              "La plupart des agriculteurs algériens utilisent WhatsApp quotidiennement mais rarement l'email. Votre numéro est votre compte.",
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
