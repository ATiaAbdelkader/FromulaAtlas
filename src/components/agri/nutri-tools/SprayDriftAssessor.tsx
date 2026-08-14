'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Wind, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';

const RISK_AR: Record<string, string> = { LOW: 'منخفض', MODERATE: 'متوسط', HIGH: 'مرتفع', EXTREME: 'شديد جداً' };
const CAN_SPRAY_AR: Record<string, string> = { 'Safe to spray': 'آمن للرش', 'Spray with caution': 'الرش بحذر', 'Avoid spraying': 'تجنب الرش', 'DO NOT SPRAY': 'لا ترش' };

export function SprayDriftAssessor() {
  const { language } = useTranslation();
  const [windSpeed, setWindSpeed] = useState('12');
  const [temp, setTemp] = useState('25');
  const [rh, setRh] = useState('50');
  const [nozzle, setNozzle] = useState('medium');
  const [boomHeight, setBoomHeight] = useState('50');
  const [dropletSize, setDropletSize] = useState('medium');

  const result = useMemo(() => {
    const ws = parseFloat(windSpeed), T = parseFloat(temp), RH = parseFloat(rh);
    const bh = parseFloat(boomHeight);
    if (!Number.isFinite(ws)) return null;

    // Risk scoring (0-100)
    let score = 0;
    // Wind: 0-3 km/h = 0, 4-8 = 15, 9-15 = 30, 16-20 = 50, >20 = 80
    score += ws <= 3 ? 0 : ws <= 8 ? 15 : ws <= 15 ? 30 : ws <= 20 ? 50 : 80;
    // Temp + RH (delta T): high temp + low RH = high evaporation = drift
    const deltaT = T - (100 - RH) * 0.2; // simplified
    score += deltaT > 10 ? 15 : deltaT > 6 ? 8 : 0;
    // Nozzle/droplet: fine = 25, medium = 10, coarse = 5, very coarse = 0
    const dropletRisk: Record<string, number> = { fine: 25, medium: 12, coarse: 5, very_coarse: 0 };
    score += dropletRisk[dropletSize] ?? 12;
    // Boom height: 30 cm = 0, 50 = 5, 70 = 15, 100 = 25
    score += bh <= 30 ? 0 : bh <= 50 ? 5 : bh <= 70 ? 15 : 25;

    score = Math.min(100, score);

    let risk: 'low' | 'moderate' | 'high' | 'extreme';
    let color: string;
    let can: string;
    if (score < 20) { risk = 'low'; color = '#10b981'; can = 'Safe to spray'; }
    else if (score < 40) { risk = 'moderate'; color = '#f59e0b'; can = 'Spray with caution'; }
    else if (score < 65) { risk = 'high'; color = '#f97316'; can = 'Avoid spraying'; }
    else { risk = 'extreme'; color = '#dc2626'; can = 'DO NOT SPRAY'; }

    // Buffer recommendation
    const buffer = risk === 'low' ? 5 : risk === 'moderate' ? 15 : risk === 'high' ? 50 : 100;

    return { score, risk, color, can, buffer, deltaT };
  }, [windSpeed, temp, rh, dropletSize, boomHeight]);

  return (
    <Card className="overflow-hidden border-cyan-200/60 shadow-sm dark:border-cyan-900/60">
      <CardHeader className="border-b bg-gradient-to-r from-cyan-50 via-background to-sky-50/40 pb-4 dark:from-cyan-950/30 dark:via-background dark:to-sky-950/20">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wind className="h-4 w-4 text-cyan-600" /> {copyFor(language, 'Spray Drift Risk Assessor', 'مقيّم خطر انجراف الرش')}</CardTitle>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copyFor(language, 'Wind · Delta-T · Droplet size · Boom height → drift score + buffer distance', 'الرياح · دلتا-تي · حجم القطرات · ارتفاع ذراع الرش → درجة الانجراف + مسافة العزل')}</p>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-4">
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Wind (km/h)', 'الرياح (كم/ساعة)')}</Label>
            <Input value={windSpeed} onChange={e => setWindSpeed(e.target.value)} type="number" step="0.5" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Temp (°C)', 'الحرارة (°م)')}</Label>
            <Input value={temp} onChange={e => setTemp(e.target.value)} type="number" step="1" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'RH (%)', 'الرطوبة النسبية (%)')}</Label>
            <Input value={rh} onChange={e => setRh(e.target.value)} type="number" step="5" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Boom (cm)', 'ذراع الرش (سم)')}</Label>
            <Input value={boomHeight} onChange={e => setBoomHeight(e.target.value)} type="number" step="10" className="mt-1 h-10 text-sm" />
          </div>
        </div>
        <div>
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Droplet size', 'حجم القطرات')}</Label>
          <select value={dropletSize} onChange={e => setDropletSize(e.target.value)} aria-label={copyFor(language, 'Droplet size', 'حجم القطرات')} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="fine">{copyFor(language, 'Fine (VF–F) — highest drift, best coverage', 'ناعمة (VF–F) — أعلى انجراف، أفضل تغطية')}</option>
            <option value="medium">{copyFor(language, 'Medium (M) — balanced', 'متوسطة (M) — متوازنة')}</option>
            <option value="coarse">{copyFor(language, 'Coarse (C) — low drift, systemic herbicides', 'خشنة (C) — انجراف منخفض، مبيدات جهازية')}</option>
            <option value="very_coarse">{copyFor(language, 'Very Coarse (VC) — lowest drift, glyphosate', 'خشنة جداً (VC) — أقل انجراف، غليفوسات')}</option>
          </select>
        </div>

        {result && (
          <div className="space-y-4">
            <div className="rounded-xl border p-5 text-center shadow-sm" style={{ borderColor: result.color + '60', backgroundColor: result.color + '15' }}>
              <div className="text-3xl font-bold leading-tight" style={{ color: result.color }}>{copyFor(language, result.can, CAN_SPRAY_AR[result.can] ?? result.can)}</div>
              <div className="mt-2 text-xs text-muted-foreground">
                {copyFor(language, 'Drift score:', 'درجة الانجراف:')} {result.score.toFixed(0)}/100 · {copyFor(language, result.risk.toUpperCase(), RISK_AR[result.risk.toUpperCase()] ?? result.risk.toUpperCase())} · ΔT = {result.deltaT.toFixed(1)}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-xl border bg-background p-3 text-center">
                <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Buffer zone', 'منطقة العزل')}</div>
                <div className="mt-1 text-2xl font-bold font-mono">{result.buffer} {copyFor(language, 'm', 'م')}</div>
              </div>
              <div className="rounded-xl border bg-background p-3 text-center">
                <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Best spray window', 'أفضل نافذة للرش')}</div>
                <div className="text-xs font-semibold">
                  {result.deltaT < 2 ? copyFor(language, 'Too humid', 'رطوبة مرتفعة جداً') : result.deltaT > 10 ? copyFor(language, 'Too dry', 'جفاف شديد') : copyFor(language, 'Good (ΔT 2–8)', 'جيد (ΔT 2–8)')}
                </div>
              </div>
            </div>

            {result.risk === 'low' ? (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-sm leading-relaxed text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>{copyFor(language, 'Good conditions.', 'ظروف جيدة.')}</strong> {copyFor(language, `Wind ${windSpeed} km/h, ΔT ${result.deltaT.toFixed(1)}. Spray now — minimal drift risk.`, `الرياح ${windSpeed} كم/ساعة، ΔT ${result.deltaT.toFixed(1)}. يمكنك الرش الآن — خطر الانجراف ضئيل.`)}</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm leading-relaxed text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>{copyFor(language, result.can, CAN_SPRAY_AR[result.can] ?? result.can)}.</strong> {result.risk === 'extreme' ? copyFor(language, 'Wait for better conditions. ', 'انتظر ظروفاً أفضل. ') : ''}{copyFor(language, 'Use coarser droplets, lower boom, or wait for wind < 10 km/h.', 'استخدم قطرات أخشن، أو اخفض ذراع الرش، أو انتظر رياحاً أقل من 10 كم/ساعة.')}</span>
              </div>
            )}

            <div className="rounded-lg border border-dashed bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
              {copyFor(language, 'Optimal spraying: wind 3–10 km/h, ΔT 2–8, temp < 28°C. Avoid inversions (calm dawn/dusk) — drift stays at ground level.', 'الرش الأمثل: رياح 3–10 كم/ساعة، ΔT بين 2 و8، وحرارة أقل من 28°م. تجنب الانقلابات الحرارية (سكون الفجر/الغروب) — يبقى الانجراف قريباً من سطح الأرض.')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
