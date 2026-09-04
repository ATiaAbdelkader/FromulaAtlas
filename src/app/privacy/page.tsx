'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Sprout, Shield } from 'lucide-react';
import { useTranslation } from '@/lib/language-store';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';

/**
 * Public Privacy Policy route — required for WhatsApp Business subscription
 * consent flow (per Algerian data protection law 18-07 and Meta Business
 * policy).
 *
 * URL: /privacy
 *
 * Version: 1.0  (matches Subscription.consentVersion in Prisma schema)
 * Last updated: 2026-09-04
 */

const PRIVACY_VERSION = '1.0';
const LAST_UPDATED = '2026-09-04';

export default function PrivacyRoute() {
  const { isRTL, language } = useTranslation();
  const isArabic = language === 'ar';
  const isFrench = language === 'fr';
  const DirectionArrow = isRTL ? ArrowRight : ArrowLeft;

  const backLabel = isArabic ? 'الصفحة الرئيسية' : isFrench ? "Page d'accueil" : 'Home';
  const titleLabel = isArabic ? 'سياسة الخصوصية' : isFrench ? 'Politique de confidentialité' : 'Privacy Policy';

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

      <main className="mx-auto max-w-[820px] px-4 py-10 sm:px-6">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <DirectionArrow className="h-3.5 w-3.5" />
          {backLabel}
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-7 w-7 text-emerald-600" />
          <h1 className="text-3xl font-bold tracking-tight">{titleLabel}</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">
          {isArabic ? 'الإصدار' : isFrench ? 'Version' : 'Version'} {PRIVACY_VERSION} · {' '}
          {isArabic ? 'آخر تحديث' : isFrench ? 'Mis à jour le' : 'Last updated'} {LAST_UPDATED}
        </p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
          {isArabic ? <ArabicContent /> : isFrench ? <FrenchContent /> : <EnglishContent />}
        </div>

        <div className="mt-12 rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
          <p className="font-medium mb-1">
            {isArabic ? 'تواصل معنا' : isFrench ? 'Nous contacter' : 'Contact us'}
          </p>
          <p>
            {isArabic
              ? 'لأسئلة الخصوصية، راسلنا على: privacy@formulaatlas.dz'
              : isFrench
                ? 'Pour toute question relative à la confidentialité: privacy@formulaatlas.dz'
                : 'For privacy questions: privacy@formulaatlas.dz'}
          </p>
        </div>
      </main>
    </div>
  );
}

function EnglishContent() {
  return (
    <>
      <section>
        <h2 className="text-xl font-semibold mb-2">1. Who we are</h2>
        <p>
          FormulaAtlas (&quot;we&quot;, &quot;us&quot;) is an agricultural decision-support application
          operated from Algeria. We help farmers make daily decisions about irrigation, fertilization,
          pest scouting, and harvest timing by combining weather data, soil tests, and crop lifecycle
          models.
        </p>
        <p>
          This policy explains what personal data we collect, why we collect it, and the choices you have.
          It applies to the FormulaAtlas web app and the WhatsApp Daily Brief service.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">2. What data we collect</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Phone number</strong> (in E.164 format, e.g. +213XXXXXXXXX) — used as your account identifier and to deliver WhatsApp briefs.</li>
          <li><strong>Farm profile</strong> — farm name, crop type, planting date, field area, and approximate location (nearest wilaya). Location is derived from the wilaya you select or your device GPS if you grant permission.</li>
          <li><strong>FarmPilot plan</strong> — your irrigation system type, fertilizer product choice, and target yield.</li>
          <li><strong>Brief engagement</strong> — delivery status (sent / delivered / read) of WhatsApp briefs, to troubleshoot failed sends.</li>
          <li><strong>Optional</strong>: soil test results, field records, market price reports you choose to log.</li>
        </ul>
        <p>
          We do <strong>not</strong> collect: your name, email, national ID, bank details, precise GPS
          coordinates (only wilaya-level), or any data from third-party apps.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">3. Why we collect it (legal basis)</h2>
        <p>Under Algerian law 18-07 (personal data protection) and GDPR-inspired principles:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Consent</strong> — you explicitly opt in to the WhatsApp Daily Brief by checking the consent box and verifying your phone number.</li>
          <li><strong>Contract</strong> — your farm profile is needed to provide the irrigation and fertilizer recommendations you requested.</li>
          <li><strong>Legitimate interest</strong> — we log delivery status of briefs to troubleshoot failures and improve reliability.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">4. How we use your data</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>To generate and send your daily WhatsApp farm brief (weather, irrigation, fertilizer, tasks).</li>
          <li>To improve our crop models and recommendation accuracy (in aggregate, never per-farmer for marketing).</li>
          <li>To notify you of significant changes to the service (e.g., pricing, outages).</li>
        </ul>
        <p>We <strong>never</strong> sell your data, share it with advertisers, or use it for marketing outside the brief itself.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">5. Who we share it with</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Meta Platforms Ireland Ltd.</strong> — to send WhatsApp messages. Meta processes the phone number and message content as a data processor on our behalf.</li>
          <li><strong>Open-Meteo</strong> — to fetch weather forecasts. We send only your wilaya-level location (lat/lng rounded to 2 decimals), never your phone number.</li>
          <li><strong>Vercel Inc.</strong> — our hosting provider. Database and serverless functions run on Vercel infrastructure in Frankfurt (EU).</li>
        </ul>
        <p>We do not share data with any other third parties unless required by Algerian law enforcement with a valid court order.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">6. How long we keep your data</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Active accounts</strong>: kept for as long as your subscription is active.</li>
          <li><strong>Brief logs</strong>: retained for 24 months for audit purposes, then automatically deleted.</li>
          <li><strong>Unsubscribed accounts</strong>: phone number and consent record retained for 36 months (to prove consent was given), other data deleted after 30 days.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">7. Your rights</h2>
        <p>Under Algerian law 18-07, you have the right to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Access</strong> — request a copy of all data we hold about you.</li>
          <li><strong>Rectify</strong> — correct inaccurate data (e.g., wrong crop, wrong location).</li>
          <li><strong>Erasure</strong> — request deletion of your account and all associated data.</li>
          <li><strong>Portability</strong> — receive your data in a machine-readable format (JSON).</li>
          <li><strong>Object</strong> — unsubscribe from the WhatsApp brief at any time by replying STOP or visiting <Link href="/unsubscribe" className="text-emerald-600 underline">/unsubscribe</Link>.</li>
          <li><strong>Withdraw consent</strong> — at any time, without giving a reason. Withdrawal does not affect the lawfulness of processing before withdrawal.</li>
        </ul>
        <p>To exercise any of these rights, email <strong>privacy@formulaatlas.dz</strong>. We respond within 30 days.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">8. Security</h2>
        <p>
          We use industry-standard measures: HTTPS for all traffic, encrypted database connections,
          hashed access tokens, and least-privilege access controls. Only the founding team has database
          access, and all access is logged.
        </p>
        <p>
          In the event of a personal data breach, we will notify the Algerian data protection authority
          (INPDP) within 72 hours and affected users without undue delay, as required by law 18-07.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">9. Children</h2>
        <p>
          FormulaAtlas is not directed at children under 16. We do not knowingly collect data from
          minors. If you believe a minor has subscribed, contact us and we will delete their data
          immediately.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">10. Changes to this policy</h2>
        <p>
          We will notify all active subscribers via WhatsApp at least 30 days before any material change
          takes effect. Material changes require re-consent. The version number above will be incremented
          with each revision.
        </p>
      </section>
    </>
  );
}

function FrenchContent() {
  return (
    <>
      <section>
        <h2 className="text-xl font-semibold mb-2">1. Qui nous sommes</h2>
        <p>
          FormulaAtlas (« nous ») est une application d&apos;aide à la décision agricole opérée depuis
          l&apos;Algérie. Nous aidons les agriculteurs à prendre des décisions quotidiennes concernant
          l&apos;irrigation, la fertilisation, le suivi des ravageurs et la récolte.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">2. Données collectées</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Numéro de téléphone</strong> (format E.164) — identifiant de compte et livraison WhatsApp.</li>
          <li><strong>Profil de ferme</strong> — nom, culture, date de plantation, surface, wilaya.</li>
          <li><strong>Plan FarmPilot</strong> — système d&apos;irrigation, engrais, rendement cible.</li>
          <li><strong>Engagement aux briefs</strong> — statut de livraison (envoyé/livré/lu).</li>
        </ul>
        <p>Nous ne collectons <strong>pas</strong>: nom, email, identifiant national, coordonnées bancaires, ou GPS précis.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">3. Vos droits</h2>
        <p>Conformément à la loi algérienne 18-07, vous disposez des droits: accès, rectification, effacement, portabilité, opposition, retrait du consentement.</p>
        <p>Pour exercer ces droits: <strong>privacy@formulaatlas.dz</strong> (réponse sous 30 jours).</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">4. Partage avec des tiers</h2>
        <p>Meta (pour l&apos;envoi WhatsApp), Open-Meteo (météo — wilaya uniquement), Vercel (hébergement, UE). Aucune vente de données.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">5. Conservation</h2>
        <p>Comptes actifs: tant que l&apos;abonnement est actif. Logs de briefs: 24 mois. Comptes désabonnés: 36 mois pour le numéro + consentement, autres données supprimées sous 30 jours.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">6. Sécurité</h2>
        <p>HTTPS, connexions chiffrées, jetons hachés, accès minimal. Notification de violation à l&apos;INPDP sous 72h.</p>
      </section>
    </>
  );
}

function ArabicContent() {
  return (
    <>
      <section>
        <h2 className="text-xl font-semibold mb-2">1. من نحن</h2>
        <p>
          فورمولا أطلس («نحن») هو تطبيق لدعم القرار الزراعي يُدير من الجزائر. نساعد المزارعين على اتخاذ
          قرارات يومية بشأن الري والتسميد وكشف الآفات والحصاد.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">2. البيانات التي نجمعها</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>رقم الهاتف</strong> (صيغة E.164) — معرّف الحساب وإرسال واتساب.</li>
          <li><strong>ملف المزرعة</strong> — الاسم، المحصول، تاريخ الزراعة، المساحة، الولاية.</li>
          <li><strong>خطة FarmPilot</strong> — نظام الري، السماد، الإنتاج المستهدف.</li>
          <li><strong>تفاعل الملخصات</strong> — حالة التسليم (أُرسل/سُلّم/قُرئ).</li>
        </ul>
        <p>لا نجمع: الاسم، البريد الإلكتروني، رقم التعريف الوطني، الحساب البنكي، أو GPS دقيق.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">3. حقوقك</h2>
        <p>وفقاً للقانون الجزائري 18-07، لك الحق في: الوصول، التصحيح، الحذف، النقل، الاعتراض، سحب الموافقة.</p>
        <p>لممارسة هذه الحقوق: <strong>privacy@formulaatlas.dz</strong> (الرد خلال 30 يوماً).</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">4. المشاركة مع أطراف ثالثة</h2>
        <p>Meta (لإرسال واتساب)، Open-Meteo (الطقس — الولاية فقط)، Vercel (الاستضافة، الاتحاد الأوروبي). لا بيع للبيانات.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">5. الحفظ</h2>
        <p>الحسابات النشطة: طوال فترة الاشتراك. سجلات الملخصات: 24 شهراً. الحسابات الملغاة: 36 شهراً للرقم + الموافقة، باقي البيانات تُحذف خلال 30 يوماً.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">6. الأمان</h2>
        <p>HTTPS، اتصالات مشفرة، رموز مجزأة، وصول محدود. إبلاغ السلطة الجزائرية (INPDP) خلال 72 ساعة في حالة خرق البيانات.</p>
      </section>
    </>
  );
}
