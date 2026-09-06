'use client';

/**
 * Pilot program landing page.
 *
 * URL: /pilot
 *
 * Explains the 60-day free pilot program for cooperatives. Coop admins
 * can apply by submitting their coop ID + a short note about their group.
 *
 * After approval (admin manually sets isPilot=true via /api/coop/pilot),
 * all coop members get free Pro access for 60 days.
 *
 * At the end of the pilot, the coop admin is asked to submit a case study
 * (story + results + quotes) in exchange for the free period.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sprout, Gift, Users, CheckCircle2, ArrowRight, ArrowLeft,
  Loader2, Sparkles, Calendar, MessageSquare,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/language-store';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PilotPage() {
  const { data: session, status } = useSession();
  const { isRTL, language } = useTranslation();
  const isArabic = language === 'ar';
  const isFrench = language === 'fr';
  const DirectionArrow = isRTL ? ArrowLeft : ArrowRight;
  const t = (en: string, ar: string, fr: string) => (isArabic ? ar : isFrench ? fr : en);
  const router = useRouter();

  const benefits = [
    { icon: Sparkles, text: t(
      'Free Pro access for all coop members (20-50 farmers)',
      'وصول Pro مجاني لجميع أعضاء التعاونية (20-50 مزارعاً)',
      'Accès Pro gratuit pour tous les membres (20-50 agriculteurs)',
    )},
    { icon: Calendar, text: t(
      '60-day pilot period — no payment required',
      'فترة تجريبية 60 يوماً — لا حاجة للدفع',
      'Période pilote de 60 jours — aucun paiement requis',
    )},
    { icon: Users, text: t(
      'Multi-farm dashboard, NDVI maps, PDF reports, WhatsApp briefs',
      'لوحة متعددة المزارع، خرائط NDVI، تقارير PDF، ملخصات واتساب',
      'Tableau multi-fermes, cartes NDVI, rapports PDF, briefs WhatsApp',
    )},
    { icon: MessageSquare, text: t(
      'We ask for a short case study at the end (story + results)',
      'نطلب قصة نجاح قصيرة في النهاية (قصة + نتائج)',
      'Nous demandons une étude de cas à la fin (récit + résultats)',
    )},
  ];

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

      <main className="mx-auto max-w-[800px] px-4 py-12 sm:px-6">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <Gift className="h-7 w-7 text-emerald-600" />
          </div>
          <Badge className="mb-3" variant="default">
            {t('Pilot Program', 'البرنامج التجريبي', 'Programme Pilote')}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            {t(
              '60 days of free Pro for your cooperative',
              '60 يوماً من Pro مجاني لتعاونيتك',
              '60 jours de Pro gratuit pour votre coopérative',
            )}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t(
              'We are looking for 3 pilot cooperatives in Algeria to test FormulaAtlas Pro. In exchange for 60 days of free access, we ask for a short case study at the end.',
              'نبحث عن 3 تعاونيات تجريبية في الجزائر لاختبار FormulaAtlas Pro. مقابل 60 يوماً من الوصول المجاني، نطلب قصة نجاح قصيرة في النهاية.',
              'Nous cherchons 3 coopératives pilotes en Algérie pour tester FormulaAtlas Pro. En échange de 60 jours d\'accès gratuit, nous demandons une courte étude de cas à la fin.',
            )}
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {benefits.map((b, i) => (
            <Card key={i}>
              <CardContent className="pt-4 flex items-start gap-3">
                <b.icon className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{b.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How it works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">
              {t('How it works', 'كيف يعمل', 'Comment ça marche')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Step
              num={1}
              title={t('Create your cooperative', 'أنشئ تعاونيتك', 'Créez votre coopérative')}
              desc={t(
                'Sign in, go to /coop, and create a cooperative. Invite your members with the 6-char join code.',
                'سجل الدخول، اذهب إلى /coop، وأنشئ تعاونية. ادعُ أعضاءك برمز الانضمام المكوّن من 6 أحرف.',
                'Connectez-vous, allez sur /coop, et créez une coopérative. Invitez vos membres avec le code à 6 caractères.',
              )}
            />
            <Step
              num={2}
              title={t('Apply for the pilot', 'تقديم على البرنامج', 'Postuler au pilote')}
              desc={t(
                'Email us at pilot@formulaatlas.dz with your coop name + a short note about your group (crops, region, size).',
                'راسلنا على pilot@formulaatlas.dz مع اسم تعاونيتك وملاحظة قصيرة عن مجموعتك (محاصيل، منطقة، حجم).',
                'Écrivez à pilot@formulaatlas.dz avec le nom de votre coopérative et une note sur votre groupe (cultures, région, taille).',
              )}
            />
            <Step
              num={3}
              title={t('We activate your pilot', 'نُفعّل برنامجك', 'Nous activons votre pilote')}
              desc={t(
                'Within 48 hours, we mark your coop as a pilot. All members instantly get Pro access for 60 days.',
                'خلال 48 ساعة، نُعلّم تعاونيتك كتجريبية. يحصل جميع الأعضاء فوراً على وصول Pro لمدة 60 يوماً.',
                'Sous 48h, nous marquons votre coopérative comme pilote. Tous les membres obtiennent Pro pour 60 jours.',
              )}
            />
            <Step
              num={4}
              title={t('Share your story', 'شارك قصتك', 'Partagez votre histoire')}
              desc={t(
                'At day 60, we ask you to submit a short case study (what worked, what didn\'t, results you saw).',
                'في اليوم 60، نطلب منك تقديم قصة نجاح قصيرة (ما نجح، ما لم ينجح، النتائج التي رأيتها).',
                'Au jour 60, nous vous demandons une courte étude de cas (ce qui a marché, les résultats observés).',
              )}
            />
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          {status === 'authenticated' ? (
            <Button size="lg" onClick={() => router.push('/coop')}>
              {t('Go to Cooperatives', 'الذهاب للتعاونيات', 'Aller aux Coopératives')}
              <DirectionArrow className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="lg" onClick={() => router.push('/auth?redirect=/coop')}>
              {t('Sign in to get started', 'سجل الدخول للبدء', 'Connectez-vous pour commencer')}
              <DirectionArrow className="h-4 w-4" />
            </Button>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            {t(
              'Questions? Email pilot@formulaatlas.dz',
              'أسئلة؟ راسلنا على pilot@formulaatlas.dz',
              'Questions ? Écrivez à pilot@formulaatlas.dz',
            )}
          </p>
        </div>

        {/* Fine print */}
        <div className="mt-12 rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
          <p className="font-medium mb-1">
            {t('Pilot terms', 'شروط البرنامج', 'Conditions du pilote')}
          </p>
          <ul className="space-y-1 list-disc pl-4">
            <li>{t('Limited to the first 3 cooperatives that apply and are approved.', 'محدود بأول 3 تعاونيات تتقدم وتوافق.', 'Limité aux 3 premières coopératives approuvées.')}</li>
            <li>{t('Minimum 10 active members required.', 'حد أدنى 10 أعضاء نشطين مطلوب.', 'Minimum 10 membres actifs requis.')}</li>
            <li>{t('Pilot access ends after 60 days — coop reverts to standard billing.', 'ينتهي الوصول التجريبي بعد 60 يوماً — تعود التعاونية للفوترة العادية.', 'L\'accès pilote se termine après 60 jours — retour à la facturation standard.')}</li>
            <li>{t('Case study submission is required (not optional).', 'تقديم قصة النجاح مطلوب (ليس اختيارياً).', 'La soumission de l\'étude de cas est obligatoire.')}</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

function Step({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-bold flex-shrink-0">
        {num}
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
