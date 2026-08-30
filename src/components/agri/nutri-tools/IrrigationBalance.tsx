'use client';

import { useEffect, useMemo, useState } from 'react';
import { Droplets, Copy, Check, RotateCcw } from 'lucide-react';
import { computeIrrigation, type IrrigationResult } from '@/lib/nutri-tools-data';
import { CropPresetDropdown } from './CropPresetDropdown';
import type { CropPreset } from '@/lib/crop-presets';
import { useBridgePayload } from '@/lib/use-bridge-payload';
import { WeatherFetcher } from './WeatherFetcher';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

const KC_REFERENCE = [
  { stage: 'Initial', stage_ar: 'البداية', stage_fr: 'Initial',      kc: 0.4  },
  { stage: 'Development', stage_ar: 'النمو', stage_fr: 'Développement',  kc: 0.75 },
  { stage: 'Mid-season', stage_ar: 'منتصف الموسم', stage_fr: 'Mi-saison',   kc: 1.05 },
  { stage: 'Late-season', stage_ar: 'أواخر الموسم', stage_fr: 'Fin de saison',  kc: 0.85 },
];

const TITLE: TrilingualString = {
  en: 'Irrigation Sheet & Water Balance',
  ar: 'ورقة الري وتوازن المياه',
  fr: 'Bilan d\'Irrigation & Hydrique',
};

const DESC: TrilingualString = {
  en: 'FAO-56 standard: ETc = Kc × ETo. Balance = irrigation (mm) + rain − ETc. Optional live ETo from Open-Meteo.',
  ar: 'معيار FAO-56: ETc = Kc × ETo. التوازن = الري (مم) + المطر − ETc. ETo مباشر اختياري من Open-Meteo.',
  fr: 'Standard FAO-56 : ETc = Kc × ETo. Bilan = irrigation (mm) + pluie − ETc. ETo en direct optionnel via Open-Meteo.',
};

interface ExampleChip {
  label: string;
  et0: string;
  kc: string;
  rain: string;
  period: 1 | 7;
}

const EXAMPLE_CHIPS: ExampleChip[] = [
  { label: 'Tomato mid-season', et0: '5',  kc: '1.15', rain: '0', period: 7 },
  { label: 'Citrus daily',      et0: '4',  kc: '0.85', rain: '0', period: 1 },
  { label: 'Strawberry 7-day',  et0: '22', kc: '0.7',  rain: '8', period: 7 },
];

export function IrrigationBalance() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [period, setPeriod] = useState<1 | 7>(1);
  const [et0, setEt0] = useState('4.5');
  const [kc, setKc] = useState('1.05');
  const [rain, setRain] = useState('0');
  const [irrigM3, setIrrigM3] = useState('60');
  const [irrigArea, setIrrigArea] = useState('1');
  const [cropArea, setCropArea] = useState('1');
  const [preset, setPreset] = useState<CropPreset | null>(null);
  const [liveEtoApplied, setLiveEtoApplied] = useState(false);
  const [copied, setCopied] = useState(false);

  // "Send to" bridge — receive payloads from Soil Water & Texture.
  const bridgePayload = useBridgePayload('irrigation-balance');
  const [bridgeBanner, setBridgeBanner] = useState<{ m3: number; ha: number } | null>(null);
  useEffect(() => {
    if (!bridgePayload) return;
    const v = bridgePayload.values;
    const m3 = typeof v.irrigationM3 === 'number' ? v.irrigationM3 : parseFloat(String(v.irrigationM3 ?? '0')) || 0;
    const ha = typeof v.irrigatedAreaHa === 'number' ? v.irrigatedAreaHa : parseFloat(String(v.irrigatedAreaHa ?? '0')) || 0;
    if (m3 > 0) setIrrigM3(String(m3));
    if (ha > 0) {
      setIrrigArea(String(ha));
      setCropArea(String(ha));
    }
    setBridgeBanner({ m3, ha });
  }, [bridgePayload]);

  const applyCropPreset = (p: CropPreset) => {
    setPreset(p);
    const stages = p.irrigation.stages;
    const midKc = stages[Math.min(2, stages.length - 1)]?.kc;
    if (typeof midKc === 'number') setKc(String(midKc));
  };

  const applyExample = (chip: ExampleChip) => {
    setEt0(chip.et0);
    setKc(chip.kc);
    setRain(chip.rain);
    setPeriod(chip.period);
  };

  const result: IrrigationResult | null = useMemo(() => {
    const p = {
      et0: parseFloat(et0) || 0,
      kc: parseFloat(kc) || 0,
      rain: parseFloat(rain) || 0,
      irrigationM3: parseFloat(irrigM3) || 0,
      irrigatedAreaHa: parseFloat(irrigArea) || 0,
      cropAreaHa: parseFloat(cropArea) || 0,
      periodDays: period,
    };
    if (!p.et0 || !p.kc) return null;
    return computeIrrigation(p);
  }, [et0, kc, rain, irrigM3, irrigArea, cropArea, period]);

  const balanceColor = !result
    ? 'default'
    : result.balance >= 0
      ? 'sky'
      : result.balance < -2
        ? 'rose'
        : 'amber';

  const balanceBg = result?.balance !== undefined ? (result.balance >= 0 ? '#0ea5e915' : '#ea580c15') : '#0ea5e915';
  const balanceBorder = result?.balance !== undefined ? (result.balance >= 0 ? '#0ea5e940' : '#ea580c40') : '#0ea5e940';
  const balanceMsgColor = result?.balance !== undefined ? (result.balance >= 0 ? '#0284c7' : '#c2410c') : '#0284c7';
  const balanceMessage = result
    ? (result.balance >= 0
        ? tr(
            'Surplus of ' + result.balance.toFixed(2) + ' mm — irrigation + rain exceed crop demand.',
            'فائض بمقدار ' + result.balance.toFixed(2) + ' مم — الري + المطر يتجاوزان الطلب.',
            'Excédent de ' + result.balance.toFixed(2) + ' mm — irrigation + pluie dépassent la demande.',
          )
        : tr(
            'Deficit of ' + Math.abs(result.balance).toFixed(2) + ' mm — crop demand exceeds supply; consider increasing irrigation.',
            'عجز بمقدار ' + Math.abs(result.balance).toFixed(2) + ' مم — الطلب يتجاوز العرض؛ فكّر في زيادة الري.',
            'Déficit de ' + Math.abs(result.balance).toFixed(2) + ' mm — la demande dépasse loffre ; augmentez lirrigation.',
          ))
    : '';

  const handleReset = () => {
    setPeriod(1); setEt0('4.5'); setKc('1.05'); setRain('0');
    setIrrigM3('60'); setIrrigArea('1'); setCropArea('1');
    setPreset(null); setLiveEtoApplied(false);
    toast({ title: tr('Reset to defaults', 'تمت إعادة التعيين', 'Réinitialisé') });
  };

  const handleCopy = () => {
    if (!result) {
      toast({ title: tr('Enter inputs to compute results.', 'أدخل القيم لحساب النتائج.', 'Saisissez les valeurs.') });
      return;
    }
    const text = [
      '=== IRRIGATION WATER BALANCE ===',
      `Period: ${period} day(s)`,
      `ETo: ${et0} mm`,
      `Kc: ${kc}`,
      `Rain: ${rain} mm`,
      `Irrigation volume: ${irrigM3} m³`,
      `Irrigated area: ${irrigArea} ha`,
      `Crop area: ${cropArea} ha`,
      '',
      'Results:',
      `ETc: ${result.etc.toFixed(2)} mm`,
      `Irrigation sheet: ${result.irrigationMm.toFixed(2)} mm`,
      `Balance: ${result.balance >= 0 ? '+' : ''}${result.balance.toFixed(2)} mm (${result.balance >= 0 ? 'surplus' : 'deficit'})`,
      `Total volume needed: ${result.totalVolumeM3.toFixed(0)} m³`,
    ].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  const periodUnit = period === 1 ? tr('day', 'يوم', 'jour') : tr('week', 'أسبوع', 'semaine');

  return (
    <CalculatorShell
      icon={Droplets}
      title={TITLE}
      description={DESC}
      badge={tr('FAO-56', 'FAO-56', 'FAO-56')}
      accent="sky"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ الملخص', fr: 'Copier' },
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
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <Droplets className="h-4 w-4 text-sky-600" />
              {tr('Inputs', 'المدخلات', 'Entrées')}
            </span>
            <CropPresetDropdown onSelect={applyCropPreset} value={preset?.id ?? null} />
          </div>

          {bridgeBanner && (
            <div className="rounded-md border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-emerald-800 dark:text-emerald-200 flex-1 leading-snug">
                {tr('Received from', 'استُقبل من', 'Reçu de')} <strong>Soil Water &amp; Texture</strong>:{' '}
                {bridgeBanner.m3.toLocaleString('en-US', { maximumFractionDigits: 0 })} m³ {tr('on', 'على', 'sur')}{' '}
                {bridgeBanner.ha.toFixed(1)} ha — {tr('irrigation volume & areas updated.', 'حجم الري والمساحات محدّثة.', 'volume d\'irrigation et surfaces mis à jour.')}
              </div>
            </div>
          )}

          {preset && (
            <div className="rounded-md border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/30 p-2.5 space-y-2">
              <div className="text-[11px] text-sky-800 dark:text-sky-200">
                <strong className="font-medium">{preset.emoji} {preset.name} — Kc {tr('set to', 'عُيّن إلى', 'défini à')} {kc} ({tr('mid-season', 'منتصف الموسم', 'mi-saison')}).</strong>{' '}
                {preset.irrigation.notes}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {preset.irrigation.stages.map(s => (
                  <div key={s.name} className="rounded-md border border-sky-200/60 dark:border-sky-800/60 bg-background/60 p-2 text-center">
                    <div className="text-[10px] text-muted-foreground">{s.name}</div>
                    <div className="text-sm font-semibold tabular-nums text-sky-700 dark:text-sky-300">{s.kc.toFixed(2)}</div>
                    <div className="text-[10px] text-muted-foreground">{s.days} d</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <WeatherFetcher
            variant="irrigation"
            onWeather={() => {
              /* current weather not consumed here yet — ETo drives the balance */
            }}
            onEto={(eto) => {
              const days = eto.etoPerDay;
              const sum =
                period === 1
                  ? (days[days.length - 1] ?? 0)
                  : days.slice(-7).reduce((a, b) => a + b, 0);
              setEt0(String(Math.round(sum * 100) / 100));
              setRain('0');
              setLiveEtoApplied(true);
            }}
          />

          {/* Period toggle */}
          <div>
            <div className="text-xs font-bold text-foreground mb-2">{tr('Period', 'الفترة', 'Période')}</div>
            <div className="inline-flex rounded-md border overflow-hidden">
              <button
                type="button"
                onClick={() => setPeriod(1)}
                className={`px-4 py-1.5 text-xs font-semibold transition-colors ${period === 1 ? 'bg-sky-500 text-white' : 'bg-background hover:bg-muted text-muted-foreground'}`}
              >
                {tr('1 day', 'يوم واحد', '1 jour')}
              </button>
              <button
                type="button"
                onClick={() => setPeriod(7)}
                className={`px-4 py-1.5 text-xs font-semibold border-l transition-colors ${period === 7 ? 'bg-sky-500 text-white' : 'bg-background hover:bg-muted text-muted-foreground'}`}
              >
                {tr('7 days', '7 أيام', '7 jours')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CalculatorShell.InputField
              label={tr(`ETo (mm / ${periodUnit})`, `ETo (مم / ${periodUnit})`, `ETo (mm / ${periodUnit})`)}
              value={et0}
              onChange={setEt0}
              helper={liveEtoApplied ? tr('Live ETo from Open-Meteo', 'ETo مباشر من Open-Meteo', 'ETo en direct Open-Meteo') : tr('Reference evapotranspiration', 'التبخر-نتح مرجعي', 'Évapotranspiration de référence')}
            />
            <CalculatorShell.InputField
              label={tr('Crop coefficient (Kc)', 'معامل المحصول (Kc)', 'Coefficient cultural (Kc)')}
              value={kc}
              onChange={setKc}
              helper={tr('FAO-56 crop coefficient', 'معامل المحصول FAO-56', 'Coefficient cultural FAO-56')}
            />
            <CalculatorShell.InputField
              label={tr(`Rain (mm / ${periodUnit})`, `المطر (مم / ${periodUnit})`, `Pluie (mm / ${periodUnit})`)}
              value={rain}
              onChange={setRain}
              helper={tr('Effective rainfall', 'المطر الفعّال', 'Pluie efficace')}
            />
            <CalculatorShell.InputField
              label={tr('Irrigation volume (m³)', 'حجم الري (م³)', 'Volume d\'irrigation (m³)')}
              value={irrigM3}
              onChange={setIrrigM3}
              helper={tr('Applied water', 'المياه المُضافة', 'Eau appliquée')}
            />
            <CalculatorShell.InputField
              label={tr('Irrigated area (ha)', 'المساحة المروية (هكتار)', 'Surface irriguée (ha)')}
              value={irrigArea}
              onChange={setIrrigArea}
              helper={tr('Area under irrigation', 'المساحة تحت الري', 'Surface sous irrigation')}
            />
            <CalculatorShell.InputField
              label={tr('Crop reference area (ha)', 'مساحة المحصول المرجعية (هكتار)', 'Surface culturale (ha)')}
              value={cropArea}
              onChange={setCropArea}
              helper={tr('Total crop area', 'إجمالي مساحة المحصول', 'Surface totale')}
            />
          </div>

          {/* Worked-example chips */}
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">{tr('Try an example', 'جرّب مثالاً', 'Essayez un exemple')}</div>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_CHIPS.map(chip => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => applyExample(chip)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4 h-full">
          <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-sky-50 via-transparent to-blue-50/50 dark:from-sky-950/30 dark:to-blue-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
            <span className="text-base font-bold flex items-center gap-2">
              💧 {tr('Water Balance', 'توازن المياه', 'Bilan Hydrique')}
            </span>
            {result && (
              <span className="font-mono text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 rounded-lg px-2 py-0.5">
                {result.balance >= 0 ? '+' : ''}{result.balance.toFixed(2)} mm
              </span>
            )}
          </div>

          {result ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <CalculatorShell.MetricTile
                  label={tr('ETc', 'ETc', 'ETc')}
                  value={result.etc.toFixed(2)}
                  unit="mm"
                  helper={tr('Kc × ETo', 'Kc × ETo', 'Kc × ETo')}
                  color="sky"
                />
                <CalculatorShell.MetricTile
                  label={tr('Irrigation sheet', 'ورقة الري', 'Bilan d\'irrigation')}
                  value={result.irrigationMm.toFixed(2)}
                  unit="mm"
                  helper={tr('m³ / (ha × 10)', 'م³ / (هكتار × 10)', 'm³ / (ha × 10)')}
                  color="teal"
                />
                <CalculatorShell.MetricTile
                  label={tr('Rain', 'المطر', 'Pluie')}
                  value={result.rain.toFixed(2)}
                  unit="mm"
                  helper={tr('manual entry', 'إدخال يدوي', 'saisie manuelle')}
                  color="default"
                />
                <CalculatorShell.MetricTile
                  label={tr('Balance', 'التوازن', 'Bilan')}
                  value={`${result.balance >= 0 ? '+' : ''}${result.balance.toFixed(2)}`}
                  unit="mm"
                  helper={result.balance >= 0 ? tr('surplus', 'فائض', 'excédent') : tr('deficit', 'عجز', 'déficit')}
                  color={balanceColor as 'sky' | 'amber' | 'rose' | 'default'}
                />
                <div className="col-span-2">
                  <CalculatorShell.MetricTile
                    label={tr('Total volume needed', 'إجمالي الحجم المطلوب', 'Volume total requis')}
                    value={result.totalVolumeM3.toFixed(0)}
                    unit="m³"
                    helper={tr('ETc × crop area × 10', 'ETc × مساحة المحصول × 10', 'ETc × surface × 10')}
                    color="emerald"
                  />
                </div>
              </div>

              <div
                className="rounded-lg p-3 text-xs border"
                style={{
                  background: result.balance >= 0 ? '#0ea5e915' : '#ea580c15',
                  borderColor: result.balance >= 0 ? '#0ea5e940' : '#ea580c40',
                  color: result.balance >= 0 ? '#0284c7' : '#c2410c',
                }}
              >
                {balanceMessage}
              </div>

              {/* Kc reference table */}
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{tr('Typical Kc values (FAO-56)', 'قيم Kc النموذجية (FAO-56)', 'Valeurs Kc types (FAO-56)')}</div>
                <div className="grid grid-cols-4 gap-2">
                  {KC_REFERENCE.map(k => (
                    <div key={k.stage} className="rounded-md border border-border/60 p-2 text-center">
                      <div className="text-[10px] text-muted-foreground">{tr(k.stage, k.stage_ar, k.stage_fr)}</div>
                      <div className="text-sm font-semibold tabular-nums">{k.kc.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[200px] text-sm text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
              {tr('Enter ETo and Kc to see results.', 'أدخل ETo و Kc لعرض النتائج.', 'Saisissez ETo et Kc pour voir les résultats.')}
            </div>
          )}
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
