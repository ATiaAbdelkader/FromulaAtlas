'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle2, XCircle, Loader2, MessageCircle, Bot, Copy, Check,
  ExternalLink, Send, ScanLine, Brain,
} from 'lucide-react';
import { useTranslation } from '@/lib/language-store';

interface BotInfo {
  connected: boolean;
  bot?: { username: string; name: string };
  error?: string;
  setup?: string;
}

export default function TelegramSetupPage() {
  const [status, setStatus] = useState<BotInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const { isRTL } = useTranslation();

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/telegram-webhook?action=info');
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ connected: false, error: 'Failed to check status' });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/telegram-webhook` : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/30 dark:from-slate-950 dark:via-emerald-950/20 dark:to-cyan-950/20" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 mb-4">
            <MessageCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{isRTL ? 'اربط أطلس المعادلات بـ Telegram' : 'Connect Formula Atlas to Telegram'}</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
            {isRTL
              ? 'احصل على نصائح زراعية بالذكاء الاصطناعي، امسح تقارير المختبر، وولّد خطط موسمية — كل ذلك من هاتفك عبر Telegram. مجاني، يستغرق دقيقتين.'
              : 'Get AI agronomy advice, scan lab reports, and generate season plans — all from your phone via Telegram. Free, takes 2 minutes.'}
          </p>
        </div>

        {status && (
          <Card className={`mb-6 border-2 ${status.connected ? 'border-emerald-300 dark:border-emerald-800' : 'border-amber-300 dark:border-amber-800'}`}>
            <CardContent className="p-4 flex items-center gap-3">
              {checking ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : status.connected ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 text-amber-600" />
              )}
              <div className="flex-1">
                {status.connected ? (
                  <>
                    <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{isRTL ? 'البوت متّصل' : 'Bot is connected'}</div>
                    <div className="text-xs text-muted-foreground">@{status.bot?.username} · {status.bot?.name}</div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-semibold text-amber-700 dark:text-amber-400">{isRTL ? 'غير متّصل بعد' : 'Not connected yet'}</div>
                    <div className="text-xs text-muted-foreground">{status.error || (isRTL ? 'اتبع الخطوات أدناه للاتصال.' : 'Follow the steps below to connect.')}</div>
                  </>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={checkStatus} disabled={checking}>{isRTL ? 'تحديث' : 'Refresh'}</Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <StepCard number={1} title={isRTL ? 'أنشئ بوت Telegram' : 'Create a Telegram bot'} icon={Bot} color="#0891b2">
            <p className="text-sm text-muted-foreground mb-3">
              {isRTL
                ? <>افتح Telegram، راسل <strong>@BotFather</strong>، وأنشئ بوتاً جديداً. ستحصل على رمز مثل <code className="text-xs bg-muted px-1.5 py-0.5 rounded">7812345678:AAH-xxxx...</code></>
                : <>Open Telegram, message <strong>@BotFather</strong>, and create a new bot. You&apos;ll get a token like <code className="text-xs bg-muted px-1.5 py-0.5 rounded">7812345678:AAH-xxxx...</code></>}
            </p>
            <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> {isRTL ? 'افتح @BotFather' : 'Open @BotFather'}</Button>
            </a>
          </StepCard>

          <StepCard number={2} title={isRTL ? 'أضف رمز البوت إلى بيئتك' : 'Add the bot token to your environment'} icon={Brain} color="#16a34a">
            <p className="text-sm text-muted-foreground mb-3">{isRTL ? <>أضف هذا السطر إلى ملف <code className="text-xs bg-muted px-1.5 py-0.5 rounded">.env</code>:</> : <>Add this line to your <code className="text-xs bg-muted px-1.5 py-0.5 rounded">.env</code> file:</>}</p>
            <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-3 flex items-center justify-between gap-2">
              <code className="text-xs text-emerald-400 font-mono break-all">TELEGRAM_BOT_TOKEN=your_token_here</code>
              <button onClick={() => copyToClipboard('TELEGRAM_BOT_TOKEN=your_token_here', 'env')} className="text-slate-400 hover:text-white flex-shrink-0">
                {copied === 'env' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{isRTL ? 'بعد الحفظ، أعِد تشغيل خادم التطوير لتحميل الرمز.' : 'After saving, restart your dev server so the token is loaded.'}</p>
          </StepCard>

          <StepCard number={3} title={isRTL ? 'شغّل البوت' : 'Start the bot'} icon={Send} color="#7c3aed">
            <p className="text-sm text-muted-foreground mb-3">{isRTL ? <><strong>للتطوير المحلي</strong>، شغّل سكربت الاستطلاع الطويل:</> : <>For <strong>local development</strong>, run the long-polling script:</>}</p>
            <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-3 flex items-center justify-between gap-2 mb-3">
              <code className="text-xs text-cyan-400 font-mono">npx tsx scripts/telegram-bot-runner.ts</code>
              <button onClick={() => copyToClipboard('npx tsx scripts/telegram-bot-runner.ts', 'runner')} className="text-slate-400 hover:text-white flex-shrink-0">
                {copied === 'runner' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-semibold">{isRTL ? 'للإنتاج (تطبيق منشور):' : 'For production (deployed app):'}</p>
              <p>{isRTL ? 'اضبط الـ webhook بزيارة:' : 'Set the webhook by visiting:'}</p>
              <div className="bg-muted/40 rounded p-2 font-mono text-[11px] break-all">
                {webhookUrl}?action=set&amp;url={webhookUrl}
              </div>
            </div>
          </StepCard>

          <StepCard number={4} title={isRTL ? 'راسل بوتك!' : 'Message your bot!'} icon={MessageCircle} color="#ea580c">
            <p className="text-sm text-muted-foreground mb-3">{isRTL ? 'افتح Telegram، ابحث عن بوتك، وأرسل:' : 'Open Telegram, find your bot, and send:'}</p>
            <div className="grid grid-cols-2 gap-2">
              <CommandChip cmd="/start" desc={isRTL ? 'رسالة ترحيب' : 'Welcome message'} />
              <CommandChip cmd="/help" desc={isRTL ? 'كيفية الاستخدام' : 'How to use'} />
              <CommandChip cmd="/tools" desc={isRTL ? 'قائمة الـ18 أداة' : 'List 18 tools'} />
              <CommandChip cmd="/plan" desc={isRTL ? 'دليل خطة الموسم' : 'Season plan guide'} />
              <CommandChip cmd="/scan" desc={isRTL ? 'كيفية مسح التقارير' : 'How to scan reports'} />
              <CommandChip cmd="/reset" desc={isRTL ? 'مسح الذاكرة' : 'Clear memory'} />
            </div>
          </StepCard>
        </div>

        <Card className="mt-6 bg-gradient-to-br from-cyan-50/50 to-blue-50/50 dark:from-cyan-950/20 dark:to-blue-950/20 border-cyan-200 dark:border-cyan-900">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ScanLine className="h-4 w-4 text-cyan-600" /> {isRTL ? 'ماذا يستطيع البوت فعله' : 'What the bot can do'}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <FeatureRow icon={MessageCircle} title={isRTL ? 'اسأل أي سؤال زراعي' : 'Ask any agronomy question'} description={isRTL ? 'صِف عرضاً، شارك قيم المختبر، أو اسأل أي أداة تُستخدم — المهندس الزراعي بالذكاء يجيب بأداة محددة وتوصيات إدخال.' : 'Describe a symptom, share lab values, or ask which tool to use — the AI Agronomist answers with specific tool + input recommendations.'} />
            <FeatureRow icon={ScanLine} title={isRTL ? 'امسح تقارير المختبر' : 'Scan lab reports'} description={isRTL ? 'أرسل صورة لتحليل التربة أو المياه أو ملصق كيس السماد — الذكاء يستخرج كل القيم ويخبرك بأي أداة تفتحها.' : 'Send a photo of your soil test, water analysis, or fertilizer bag label — AI extracts all values and tells you which tool to open.'} />
            <FeatureRow icon={Brain} title={isRTL ? 'يتذكّر السياق' : 'Remembers context'} description={isRTL ? 'اسأل أسئلة متابعة دون تكرار نفسك. استخدم /reset للبدء من جديد.' : 'Ask follow-up questions without repeating yourself. Use /reset to start fresh.'} />
            <FeatureRow icon={Bot} title={isRTL ? 'يعمل 24/7' : 'Works 24/7'} description={isRTL ? 'احصل على إجابات في ثوانٍ، في أي وقت، بأي لغة. بلا موعد.' : 'Get answers in seconds, any time, in any language. No appointment needed.'} />
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>{isRTL ? '← العودة إلى التطبيق' : '← Back to app'}</Button>
        </div>
      </div>
    </div>
  );
}

function StepCard({ number, title, icon: Icon, color, children }: { number: number; title: string; icon: typeof Bot; color: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center gap-3 space-y-0">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg text-white font-bold text-sm flex-shrink-0" style={{ background: color }}>{number}</div>
        <div className="flex items-center gap-2 flex-1"><Icon className="h-4 w-4" style={{ color }} /><CardTitle className="text-base">{title}</CardTitle></div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function CommandChip({ cmd, desc }: { cmd: string; desc: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/60">
      <code className="text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400">{cmd}</code>
      <span className="text-xs text-muted-foreground">{desc}</span>
    </div>
  );
}

function FeatureRow({ icon: Icon, title, description }: { icon: typeof Bot; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 flex-shrink-0"><Icon className="h-4 w-4" /></div>
      <div><div className="text-sm font-semibold">{title}</div><p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{description}</p></div>
    </div>
  );
}
