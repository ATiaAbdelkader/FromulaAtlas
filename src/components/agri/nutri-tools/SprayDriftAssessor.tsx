'use client';

import { useState, useMemo } from 'react';
import { Wind, Copy, Check, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

const RISK_AR: Record<string, string> = { LOW: 'منخفض', MODERATE: 'متوسط', HIGH: 'مرتفع', EXTREME: 'شديد جداً' };
const RISK_FR: Record<string, string> = { LOW: 'Faible', MODERATE: 'Modéré', HIGH: 'Élevé', EXTREME: 'Extrême' };
const CAN_SPRAY_AR: Record<string, string> = {
  'Safe to spray': 'آمن للرش',
  'Spray with caution': 'الرش بحذر',
  'Avoid spraying': 'تجنب الرش',
  'DO NOT SPRAY': 'لا ترش',
};
const CAN_SPRAY_FR: Record<string, string> = {
  'Safe to spray': 'Pulvérisation sûre',
  'Spray with caution': 'Pulvériser avec prudence',
  'Avoid spraying': 'Éviter de pulvériser',
  'DO NOT SPRAY': 'NE PAS PULVÉRISER',
};

const TITLE: TrilingualString = {
  en: 'Spray Drift Risk Assessor',
  ar: 'مقيّم خطر انجراف الرش',
  fr: 'Évaluateur du Risque de Dérive',
};

const DESC: TrilingualString = {
  en: 'Wind · Delta-T · Droplet size · Boom height → drift score + buffer distance',
  ar: 'الرياح · دلتا-تي · حجم القطرات · ارتفاع ذراع الرش → درجة الانجراف + مسافة العزل',
  fr: 'Vent · Delta-T · Taille de gouttes · Hauteur de rampe → score de dérive + zone tampon',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Optimal spraying: wind 3–10 km/h, ΔT 2–8, temp < 28°C. Avoid inversions (calm dawn/dusk) — drift stays at ground level.',
  ar: 'الرش الأمثل: رياح 3–10 كم/ساعة، ΔT بين 2 و8، وحرارة أقل من 28°م. تجنب الانقلابات الحرارية (سكون الفجر/الغروب) — يبقى الانجراف قريباً من سطح الأرض.',
  fr: 'Pulvérisation optimale : vent 3–10 km/h, ΔT 2–8, température < 28°C. Évitez les inversions thermiques (aube/crépuscule calmes) — la dérive stagne au sol.',
};

export function SprayDriftAssessor() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [windSpeed, setWindSpeed] = useState('12');
  const [temp, setTemp] = useState('25');
  const [rh, setRh] = useState('50');
  const [boomHeight, setBoomHeight] = useState('50');
  const [dropletSize, setDropletSize] = useState('medium');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const ws = parseFloat(windSpeed), T = parseFloat(temp), RH = parseFloat(rh);
    const bh = parseFloat(boomHeight);
    if (!Number.isFinite(ws)) return null;

    // Risk scoring (0-100)
    let score = 0;
    score += ws <= 3 ? 0 : ws <= 8 ? 15 : ws <= 15 ? 30 : ws <= 20 ? 50 : 80;
    const deltaT = T - (100 - RH) * 0.2; // simplified
    score += deltaT > 10 ? 15 : deltaT > 6 ? 8 : 0;
    const dropletRisk: Record<string, number> = { fine: 25, medium: 12, coarse: 5, very_coarse: 0 };
    score += dropletRisk[dropletSize] ?? 12;
    score += bh <= 30 ? 0 : bh <= 50 ? 5 : bh <= 70 ? 15 : 25;
    score = Math.min(100, score);

    let risk: 'low' | 'moderate' | 'high' | 'extreme';
    let color: string;
    let can: string;
    if (score < 20) { risk = 'low'; color = '#10b981'; can = 'Safe to spray'; }
    else if (score < 40) { risk = 'moderate'; color = '#f59e0b'; can = 'Spray with caution'; }
    else if (score < 65) { risk = 'high'; color = '#f97316'; can = 'Avoid spraying'; }
    else { risk = 'extreme'; color = '#dc2626'; can = 'DO NOT SPRAY'; }

    const buffer = risk === 'low' ? 5 : risk === 'moderate' ? 15 : risk === 'high' ? 50 : 100;
    return { score, risk, color, can, buffer, deltaT };
  }, [windSpeed, temp, rh, dropletSize, boomHeight]);

  const handleReset = () => {
    setWindSpeed('12'); setTemp('25'); setRh('50'); setBoomHeight('50'); setDropletSize('medium');
    toast({ title: tr('Reset', 'إعادة', 'Réinitialiser') });
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `=== SPRAY DRIFT RISK ===\nWind: ${windSpeed} km/h\nTemp: ${temp}°C\nRH: ${rh}%\nBoom height: ${boomHeight} cm\nDroplet: ${dropletSize}\n\nDrift score: ${result.score.toFixed(0)}/100 (${result.risk.toUpperCase()})\nΔT: ${result.deltaT.toFixed(1)}\nVerdict: ${result.can}\nBuffer zone: ${result.buffer} m`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  const dropletLabel = (key: string) => {
    const map: Record<string, [string, string, string]> = {
      fine: [
        'Fine (VF–F) — highest drift, best coverage',
        'ناعمة (VF–F) — أعلى انجراف، أفضل تغطية',
        'Fine (VF–F) — dérive max, couverture optimale',
      ],
      medium: [
        'Medium (M) — balanced',
        'متوسطة (M) — متوازنة',
        'Moyenne (M) — équilibré',
      ],
      coarse: [
        'Coarse (C) — low drift, systemic herbicides',
        'خشنة (C) — انجراف منخفض، مبيدات جهازية',
        'Grossière (C) — faible dérive, herbicides systémiques',
      ],
      very_coarse: [
        'Very Coarse (VC) — lowest drift, glyphosate',
        'خشنة جداً (VC) — أقل انجراف، غليفوسات',
        'Très grossière (VC) — dérive min, glyphosate',
      ],
    };
    const v = map[key] || map.medium;
    return tr(v[0], v[1], v[2]);
  };

  return (
    <CalculatorShell
      icon={Wind}
      title={TITLE}
      description={DESC}
      badge="Application Safety"
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
          label: { en: 'Reset', ar: 'إعادة', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      protocolNote={PROTOCOL_NOTE}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            {tr('Weather observations', 'رصد الطقس', 'Observations météo')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CalculatorShell.InputField
              label={tr('Wind (km/h)', 'الرياح (كم/ساعة)', 'Vent (km/h)')}
              value={windSpeed}
              onChange={setWindSpeed}
              step="0.5"
            />
            <CalculatorShell.InputField
              label={tr('Temp (°C)', 'الحرارة (°م)', 'Température (°C)')}
              value={temp}
              onChange={setTemp}
              step="1"
            />
            <CalculatorShell.InputField
              label={tr('RH (%)', 'الرطوبة النسبية (%)', 'HR (%)')}
              value={rh}
              onChange={setRh}
              step="5"
            />
            <CalculatorShell.InputField
              label={tr('Boom (cm)', 'ذراع الرش (سم)', 'Rampe (cm)')}
              value={boomHeight}
              onChange={setBoomHeight}
              step="10"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-bold text-foreground">
              {tr('Droplet size', 'حجم القطرات', 'Taille de gouttes')}
            </Label>
            <select
              value={dropletSize}
              onChange={e => setDropletSize(e.target.value)}
              aria-label={tr('Droplet size', 'حجم القطرات', 'Taille de gouttes')}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="fine">{dropletLabel('fine')}</option>
              <option value="medium">{dropletLabel('medium')}</option>
              <option value="coarse">{dropletLabel('coarse')}</option>
              <option value="very_coarse">{dropletLabel('very_coarse')}</option>
            </select>
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        {result ? (
          <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
            <div
              className="rounded-xl border p-5 text-center"
              style={{ borderColor: result.color + '60', backgroundColor: result.color + '15' }}
            >
              <div className="text-3xl font-bold leading-tight" style={{ color: result.color }}>
                {tr(result.can, CAN_SPRAY_AR[result.can] ?? result.can, CAN_SPRAY_FR[result.can] ?? result.can)}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {tr('Drift score:', 'درجة الانجراف:', 'Score de dérive :')} {result.score.toFixed(0)}/100 ·{' '}
                {tr(
                  result.risk.toUpperCase(),
                  RISK_AR[result.risk.toUpperCase()] ?? result.risk.toUpperCase(),
                  RISK_FR[result.risk.toUpperCase()] ?? result.risk.toUpperCase(),
                )}{' '}
                · ΔT = {result.deltaT.toFixed(1)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CalculatorShell.MetricTile
                label={tr('Buffer zone', 'منطقة العزل', 'Zone tampon')}
                value={result.buffer}
                unit={tr('m', 'م', 'm')}
                color="amber"
              />
              <CalculatorShell.MetricTile
                label={tr('Best spray window', 'أفضل نافذة للرش', 'Meilleure fenêtre')}
                value={
                  result.deltaT < 2
                    ? tr('Too humid', 'رطوبة مرتفعة جداً', 'Trop humide')
                    : result.deltaT > 10
                      ? tr('Too dry', 'جفاف شديد', 'Trop sec')
                      : tr('Good (ΔT 2–8)', 'جيد (ΔT 2–8)', 'Bon (ΔT 2–8)')
                }
                color={result.deltaT >= 2 && result.deltaT <= 10 ? 'emerald' : 'rose'}
              />
            </div>

            {result.risk === 'low' ? (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-sm leading-relaxed text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong>{tr('Good conditions.', 'ظروف جيدة.', 'Bonnes conditions.')}</strong>{' '}
                  {tr(
                    `Wind ${windSpeed} km/h, ΔT ${result.deltaT.toFixed(1)}. Spray now — minimal drift risk.`,
                    `الرياح ${windSpeed} كم/ساعة، ΔT ${result.deltaT.toFixed(1)}. يمكنك الرش الآن — خطر الانجراف ضئيل.`,
                    `Vent ${windSpeed} km/h, ΔT ${result.deltaT.toFixed(1)}. Pulvérisez maintenant — risque de dérive minimal.`,
                  )}
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm leading-relaxed text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong>
                    {tr(
                      result.can,
                      CAN_SPRAY_AR[result.can] ?? result.can,
                      CAN_SPRAY_FR[result.can] ?? result.can,
                    )}
                    .
                  </strong>{' '}
                  {result.risk === 'extreme'
                    ? tr('Wait for better conditions. ', 'انتظر ظروفاً أفضل. ', 'Attendez de meilleures conditions. ')
                    : ''}
                  {tr(
                    'Use coarser droplets, lower boom, or wait for wind < 10 km/h.',
                    'استخدم قطرات أخشن، أو اخفض ذراع الرش، أو انتظر رياحاً أقل من 10 كم/ساعة.',
                    'Utilisez des gouttes plus grosses, baissez la rampe, ou attendez un vent < 10 km/h.',
                  )}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[200px] text-sm text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
            {tr('Enter wind speed to see results.', 'أدخل سرعة الرياح لعرض النتائج.', 'Saisissez la vitesse du vent pour voir les résultats.')}
          </div>
        )}
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
