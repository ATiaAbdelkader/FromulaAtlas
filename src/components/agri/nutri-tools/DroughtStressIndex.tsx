'use client';

import { useState, useMemo, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Bell, Send, Check, Copy, RotateCcw } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import {
  initOneSignalSDK,
  sendDroughtStressPushAlert,
  requestPushPermission,
} from '@/lib/onesignal';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

const STAGE_AR: Record<string, string> = { establishment: 'التأسيس', vegetative: 'النمو الخضري', flowering: 'الإزهار', filling: 'امتلاء الحبوب', maturation: 'النضج' };
const STAGE_FR: Record<string, string> = { establishment: 'Installation', vegetative: 'Végétatif', flowering: 'Floraison', filling: 'Remplissage grain', maturation: 'Maturation' };
const LEVEL_AR: Record<string, string> = { None: 'لا يوجد', Mild: 'خفيف', Moderate: 'متوسط', Severe: 'شديد' };
const LEVEL_FR: Record<string, string> = { None: 'Aucun', Mild: 'Léger', Moderate: 'Modéré', Severe: 'Sévère' };
const ADVICE_AR: Record<string, string> = {
  'No drought stress. Crop water needs are being met.': 'لا يوجد إجهاد جفاف. يتم تلبية احتياجات المحصول المائية.',
  'Mild stress. Monitor soil moisture. Consider light irrigation.': 'إجهاد خفيف. راقب رطوبة التربة وفكّر في ري خفيف.',
  'Moderate stress. Irrigate within 2-3 days to prevent yield loss.': 'إجهاد متوسط. ابدأ الري خلال 2–3 أيام لمنع فقد المحصول.',
  'Severe stress! Irrigate immediately. Yield loss likely at this stage.': 'إجهاد شديد! ابدأ الري فوراً. يُحتمل فقد المحصول في هذه المرحلة.',
};
const ADVICE_FR: Record<string, string> = {
  'No drought stress. Crop water needs are being met.': 'Aucun stress hydrique. Les besoins en eau de la culture sont satisfaits.',
  'Mild stress. Monitor soil moisture. Consider light irrigation.': 'Stress léger. Surveillez l\'humidité du sol. Envisagez une irrigation légère.',
  'Moderate stress. Irrigate within 2-3 days to prevent yield loss.': 'Stress modéré. Irriguez sous 2 à 3 jours pour éviter une perte de rendement.',
  'Severe stress! Irrigate immediately. Yield loss likely at this stage.': 'Stress sévère ! Irriguez immédiatement. Perte de rendement probable à ce stade.',
};

const TITLE: TrilingualString = {
  en: 'Drought Stress Index',
  ar: 'مؤشر إجهاد الجفاف',
  fr: 'Indice de Stress Hydrique',
};

const DESC: TrilingualString = {
  en: 'Combines ET₀ deficit + soil water depletion + crop stage sensitivity with instant OneSignal push alerts',
  ar: 'يجمع بين عجز ET₀ واستنزاف ماء التربة وحساسية مرحلة المحصول مع تنبيهات دفع OneSignal فورية',
  fr: 'Combine le déficit ET₀ + la déplétion d\'eau du sol + la sensibilité du stade culture avec alertes push OneSignal instantanées',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'DSI = 40% ET₀ deficit + 40% soil depletion + 20% stage sensitivity. Flowering is most sensitive — water stress here causes irreversible yield loss.',
  ar: 'مؤشر إجهاد الجفاف = 40% عجز ET₀ + 40% استنزاف التربة + 20% حساسية المرحلة. الإزهار هو الأكثر حساسية — ويسبب الإجهاد المائي فيه فقداً غير قابل للعكس في المحصول.',
  fr: 'DSI = 40% déficit ET₀ + 40% déplétion sol + 20% sensibilité du stade. La floraison est la plus sensible — un stress hydrique ici entraîne une perte de rendement irréversible.',
};

export function DroughtStressIndex() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  const [fieldName, setFieldName] = useState('North Pivot Block A');
  const [cropName, setCropName] = useState('Tomato');
  const [et0, setEt0] = useState('5.0');
  const [rain, setRain] = useState('2.0');
  const [soilWater, setSoilWater] = useState('60');
  const [taw, setTaw] = useState('120');
  const [stage, setStage] = useState('flowering');
  const [sendingPush, setSendingPush] = useState(false);
  const [pushSent, setPushSent] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    initOneSignalSDK();
  }, []);

  const result = useMemo(() => {
    const ET0 = parseFloat(et0), R = parseFloat(rain), SW = parseFloat(soilWater), TAW = parseFloat(taw);
    if (!Number.isFinite(ET0) || !Number.isFinite(TAW) || TAW <= 0) return null;

    const deficit = Math.max(0, ET0 - R * 0.8); // net water deficit mm/day
    const depletionPct = ((TAW - SW) / TAW) * 100;
    const stageFactor: Record<string, number> = { establishment: 0.5, vegetative: 0.7, flowering: 1.0, filling: 0.9, maturation: 0.5 };
    const sf = stageFactor[stage] ?? 0.7;
    const dsi = (deficit / ET0) * 0.4 + (depletionPct / 100) * 0.4 + sf * 0.2;
    const dsiScore = Math.min(100, dsi * 100);

    let level: string, color: string, advice: string;
    if (dsiScore < 25) { level = 'None'; color = '#10b981'; advice = 'No drought stress. Crop water needs are being met.'; }
    else if (dsiScore < 50) { level = 'Mild'; color = '#eab308'; advice = 'Mild stress. Monitor soil moisture. Consider light irrigation.'; }
    else if (dsiScore < 75) { level = 'Moderate'; color = '#f97316'; advice = 'Moderate stress. Irrigate within 2-3 days to prevent yield loss.'; }
    else { level = 'Severe'; color = '#dc2626'; advice = 'Severe stress! Irrigate immediately. Yield loss likely at this stage.'; }

    return { dsiScore, level, color, advice, deficit, depletionPct };
  }, [et0, rain, soilWater, taw, stage]);

  const handleSendPushAlert = async () => {
    if (!result) return;
    setSendingPush(true);
    setPushSent(false);

    try {
      await requestPushPermission();
      const res = await sendDroughtStressPushAlert({
        title: `🚨 High Drought Stress Alert: ${fieldName || 'Field'}`,
        message: `${cropName || 'Crop'} is experiencing ${result.level.toUpperCase()} drought stress (DSI ${result.dsiScore.toFixed(0)}/100). ${result.advice}`,
        fieldName: fieldName || 'Field',
        crop: cropName || 'Crop',
        dsiScore: result.dsiScore,
        level: result.level.toLowerCase() as 'mild' | 'moderate' | 'severe' | 'critical',
        url: '/app?tab=irrigation-scheduler',
      });

      setPushSent(true);
      toast({
        title: tr('Push Notification Dispatched', 'تم إرسال إشعار الدفع', 'Notification push envoyée'),
        description: tr(
          `Triggered for ${fieldName || 'field'} via ${res.channel} (${res.details || 'OK'})`,
          `تم الإرسال لـ ${fieldName || 'الحقل'} عبر ${res.channel}`,
          `Envoyé pour ${fieldName || 'champ'} via ${res.channel} (${res.details || 'OK'})`,
        ),
      });
    } catch {
      toast({
        title: tr('Notification Error', 'خطأ في إرسال الإشعار', 'Erreur de notification'),
        description: tr('Could not deliver push notification', 'تعذر إرسال الإشعار', 'Impossible d\'envoyer la notification push'),
        variant: 'destructive',
      });
    } finally {
      setSendingPush(false);
      setTimeout(() => setPushSent(false), 5000);
    }
  };

  const handleReset = () => {
    setFieldName('North Pivot Block A');
    setCropName('Tomato');
    setEt0('5.0');
    setRain('2.0');
    setSoilWater('60');
    setTaw('120');
    setStage('flowering');
    toast({ title: tr('Reset to defaults', 'تمت إعادة التعيين', 'Réinitialisé') });
  };

  const handleCopy = () => {
    if (!result) {
      toast({ title: tr('No data to copy', 'لا توجد بيانات للنسخ', 'Aucune donnée à copier') });
      return;
    }
    const lines = [
      `=== DROUGHT STRESS INDEX ===`,
      `Field: ${fieldName || '—'}`,
      `Crop: ${cropName || '—'}`,
      `Stage: ${stage}`,
      ``,
      `ET₀: ${et0} mm/day`,
      `Rain: ${rain} mm`,
      `Soil water: ${soilWater} mm`,
      `TAW: ${taw} mm`,
      ``,
      `DSI Score: ${result.dsiScore.toFixed(0)}/100`,
      `Level: ${tr(result.level, LEVEL_AR[result.level] ?? result.level, LEVEL_FR[result.level] ?? result.level)}`,
      `Water deficit: ${result.deficit.toFixed(1)} mm/day`,
      `Soil depletion: ${result.depletionPct.toFixed(0)}%`,
      ``,
      `Advice: ${tr(result.advice, ADVICE_AR[result.advice] ?? result.advice, ADVICE_FR[result.advice] ?? result.advice)}`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <CalculatorShell
      icon={AlertTriangle}
      title={TITLE}
      description={DESC}
      badge="OneSignal Ready"
      accent="amber"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
          onClick: handleCopy,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      protocolNote={PROTOCOL_NOTE}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              {tr('Field Context', 'سياق الحقل', 'Contexte parcelle')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CalculatorShell.InputField
              label={tr('Field / Zone Name', 'اسم الحقل / المنطقة', 'Nom parcelle / zone')}
              value={fieldName}
              onChange={setFieldName}
              type="text"
              placeholder="North Pivot Block A"
            />
            <CalculatorShell.InputField
              label={tr('Crop Type', 'نوع المحصول', 'Type de culture')}
              value={cropName}
              onChange={setCropName}
              type="text"
              placeholder="Tomato / Maize"
            />
            <CalculatorShell.InputField
              label={tr('ET₀ today (mm/day)', 'ET₀ اليوم (ملم/يوم)', 'ET₀ aujourd\'hui (mm/jour)')}
              value={et0}
              onChange={setEt0}
              step="0.1"
              placeholder="5.0"
            />
            <CalculatorShell.InputField
              label={tr('Rain today (mm)', 'مطر اليوم (ملم)', 'Pluie du jour (mm)')}
              value={rain}
              onChange={setRain}
              step="0.1"
              placeholder="2.0"
            />
            <CalculatorShell.InputField
              label={tr('Soil water (mm)', 'ماء التربة (ملم)', 'Eau du sol (mm)')}
              value={soilWater}
              onChange={setSoilWater}
              step="5"
              placeholder="60"
            />
            <CalculatorShell.InputField
              label={tr('TAW (mm)', 'الماء المتاح الكلي (ملم)', 'TAW (mm)')}
              value={taw}
              onChange={setTaw}
              step="10"
              placeholder="120"
            />
          </div>

          {/* Growth stage selector — styled to match InputField */}
          <div className="p-3 rounded-xl border bg-card space-y-1">
            <label className="text-xs font-bold text-foreground">{tr('Growth stage', 'مرحلة النمو', 'Stade de croissance')}</label>
            <select
              aria-label={tr('Growth stage', 'مرحلة النمو', 'Stade de croissance')}
              value={stage}
              onChange={e => setStage(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-mono font-bold"
            >
              {Object.entries({ establishment: 'Establishment', vegetative: 'Vegetative', flowering: 'Flowering', filling: 'Grain fill', maturation: 'Maturation' }).map(([key, label]) => (
                <option key={key} value={key}>{tr(label, STAGE_AR[key], STAGE_FR[key])}</option>
              ))}
            </select>
            <div className="text-[10px] text-muted-foreground">{tr('Sensitivity factor — flowering is most critical', 'عامل الحساسية — الإزهار هو الأكثر حرجاً', 'Facteur de sensibilité — la floraison est la plus critique')}</div>
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
          {result ? (
            <>
              <div className="flex items-center justify-between border-b pb-3 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl" style={{ background: `linear-gradient(to right, ${result.color}15, transparent, ${result.color}10)` }}>
                <span className="text-base font-bold flex items-center gap-2">
                  <Bell className="h-4 w-4" style={{ color: result.color }} />
                  {tr('Drought Stress Index', 'مؤشر إجهاد الجفاف', 'Indice de stress hydrique')}
                </span>
                <span className="font-mono text-xs font-bold border rounded-lg px-2 py-0.5" style={{ color: result.color, borderColor: result.color }}>
                  {tr(result.level, LEVEL_AR[result.level] ?? result.level, LEVEL_FR[result.level] ?? result.level)}
                </span>
              </div>

              {/* Big DSI score tile */}
              <div className="rounded-xl border p-5 text-center shadow-sm relative overflow-hidden" style={{ borderColor: result.color + '60', backgroundColor: result.color + '15' }}>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{tr('Drought Stress Index', 'مؤشر إجهاد الجفاف', 'Indice de stress hydrique')}</div>
                <div className="mt-1 text-4xl font-bold font-mono" style={{ color: result.color }}>
                  {result.dsiScore.toFixed(0)}<span className="text-sm">/100</span>
                </div>
                <div className="mt-1 text-sm font-semibold" style={{ color: result.color }}>
                  {tr(result.level, LEVEL_AR[result.level] ?? result.level, LEVEL_FR[result.level] ?? result.level)}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <CalculatorShell.MetricTile
                  label={tr('Water deficit', 'عجز الماء', 'Déficit hydrique')}
                  value={result.deficit.toFixed(1)}
                  unit="mm/day"
                  color="amber"
                />
                <CalculatorShell.MetricTile
                  label={tr('Soil depletion', 'استنزاف التربة', 'Déplétion du sol')}
                  value={result.depletionPct.toFixed(0)}
                  unit="%"
                  color="rose"
                />
              </div>

              {/* Advice box */}
              <div className="flex items-start gap-2 rounded-xl border p-3 text-sm leading-relaxed" style={{ borderColor: result.color + '40', color: result.color }}>
                {result.dsiScore < 50 ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
                <span>{tr(result.advice, ADVICE_AR[result.advice] ?? result.advice, ADVICE_FR[result.advice] ?? result.advice)}</span>
              </div>

              {/* OneSignal Push Notification Action Box */}
              <div className="rounded-xl border border-cyan-200 bg-cyan-50/50 p-4 dark:border-cyan-900/60 dark:bg-cyan-950/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold flex items-center gap-1.5 text-cyan-900 dark:text-cyan-200">
                      <Bell className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                      {tr('OneSignal Push Alert Trigger', 'إطلاق تنبيه دفع OneSignal', 'Déclencheur d\'alerte push OneSignal')}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {result.dsiScore >= 50
                        ? tr('High drought stress detected! Send immediate push notification to agronomists & field crew.', 'تم اكتشاف إجهاد جفاف مرتفع! أرسل إشعار دفع فوري للمهندسين وفرق الحقل.', 'Stress hydrique élevé détecté ! Envoyez une notification push immédiate aux agronomes et équipes de terrain.')
                        : tr('Test or broadcast current field drought status to subscribed devices.', 'اختبر أو أرسل حالة جفاف الحقل الحالية للأجهزة المشتركة.', 'Testez ou diffusez le statut de sécheresse actuel aux appareils abonnés.')}
                    </div>
                  </div>
                  <Button
                    onClick={handleSendPushAlert}
                    disabled={sendingPush}
                    className={`h-10 text-xs gap-1.5 font-medium shrink-0 ${
                      result.dsiScore >= 50
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                        : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    }`}
                  >
                    {pushSent ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-300" />
                        {tr('Alert Sent!', 'تم الإرسال!', 'Envoyé !')}
                      </>
                    ) : sendingPush ? (
                      <>
                        <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {tr('Sending Push...', 'جارٍ الإرسال...', 'Envoi...')}
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        {tr('Trigger Push Alert', 'إرسال تنبيه دفع', 'Déclencher l\'alerte')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center text-sm text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mb-2 opacity-40" />
              {tr('Enter valid ET₀ and TAW to compute the drought stress index.', 'أدخل ET₀ و TAW صحيحين لحساب مؤشر إجهاد الجفاف.', 'Saisissez ET₀ et TAW valides pour calculer l\'indice de stress hydrique.')}
            </div>
          )}
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
