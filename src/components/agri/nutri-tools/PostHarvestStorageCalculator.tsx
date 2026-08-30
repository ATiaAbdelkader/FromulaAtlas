'use client';

/**
 * Post-Harvest Storage Calculator
 *
 * Three-tab UI (pills):
 *   1. EMC + Safe Storage — equilibrium moisture content + safe days
 *   2. Drying — thin-layer drying time + energy cost
 *   3. Bin Aeration — fan sizing + static pressure
 *
 * Formulas: Henderson EMC, Fraser-Dua safe storage, Page drying rate,
 * drying energy cost, bin aeration CFM (PH.1-PH.5).
 *
 * Wrapped in CalculatorShell (amber accent, Warehouse icon).
 */

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Warehouse, Droplets, Wind, Zap, AlertTriangle, CheckCircle2, Copy, RotateCcw,
} from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
  type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

type Tab = 'storage' | 'drying' | 'aeration';

const TITLE: TrilingualString = {
  en: 'Post-Harvest Storage Calculator',
  ar: 'حاسبة تخزين ما بعد الحصاد',
  fr: 'Calculateur de Stockage Post-Récolte',
};

const DESC: TrilingualString = {
  en: 'EMC · Safe storage days · Drying time + cost · Bin aeration fan sizing — 7 crops',
  ar: 'رطوبة الاتزان EMC · أيام التخزين الآمن · زمن وتكلفة التجفيف · تحجيم مروحة تهوية الصومعة — 7 محاصيل',
  fr: 'EMC · jours de stockage sûr · temps + coût de séchage · dimensionnement ventilateur — 7 cultures',
};

const PILL_LABEL: TrilingualString = { en: 'Mode:', ar: 'النمط:', fr: 'Mode :' };

const PILLS: CalculatorPill[] = [
  { key: 'storage', label: 'EMC + Safe', emoji: '💧' },
  { key: 'drying', label: 'Drying', emoji: '⚡' },
  { key: 'aeration', label: 'Aeration', emoji: '🌬️' },
];

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Henderson equation for EMC (equilibrium moisture content) at given T/RH. Fraser-Dua model for safe storage days (0.7× safety factor). Page equation for thin-layer drying rate. Bin aeration: ASABE static pressure curves + fan power P = Q×SP/η.',
  ar: 'معادلة هندرسون لحساب رطوبة الاتزان EMC عند درجة الحرارة/الرطوبة المعطاة. نموذج Fraser-Dua لأيام التخزين الآمن (معامل أمان 0.7×). معادلة Page لمعدل التجفيف الطبقي الرفيع. تهوية الصومعة: منحنيات الضغط الساكن ASABE + قدرة المروحة P = Q×SP/η.',
  fr: 'Équation de Henderson pour l’EMC (humidité d’équilibre) à T/HR données. Modèle Fraser-Dua pour les jours de stockage sûr (facteur 0,7×). Équation de Page pour le séchage en couche mince. Aération : courbes ASABE de pression statique + puissance ventilateur P = Q×SP/η.',
};

// Crop EMC constants (Henderson equation) — A and B
const CROP_EMC: Record<string, { A: number; B: number; name: string; name_ar: string; name_fr: string; emoji: string; safeMoisture: number }> = {
  wheat:    { A: 2.3e-5, B: 2.7, name: 'Wheat', name_ar: 'قمح', name_fr: 'Blé', emoji: '🌾', safeMoisture: 13.5 },
  maize:    { A: 8.3e-6, B: 1.9, name: 'Maize', name_ar: 'ذرة', name_fr: 'Maïs', emoji: '🌽', safeMoisture: 13.0 },
  rice:     { A: 2.6e-5, B: 2.6, name: 'Rice', name_ar: 'أرز', name_fr: 'Riz', emoji: '🍚', safeMoisture: 12.5 },
  barley:   { A: 2.1e-5, B: 2.5, name: 'Barley', name_ar: 'شعير', name_fr: 'Orge', emoji: '🌾', safeMoisture: 13.5 },
  sorghum:  { A: 1.4e-5, B: 2.3, name: 'Sorghum', name_ar: 'سورغم', name_fr: 'Sorgho', emoji: '🌾', safeMoisture: 13.0 },
  soybean:  { A: 5.0e-5, B: 1.9, name: 'Soybean', name_ar: 'فول الصويا', name_fr: 'Soja', emoji: '🫘', safeMoisture: 13.0 },
  oats:     { A: 2.5e-5, B: 2.5, name: 'Oats', name_ar: 'شوفان', name_fr: 'Avoine', emoji: '🌾', safeMoisture: 13.0 },
};

// Safe storage constants (Fraser-Dua) — a, b, c
const SAFE_STORAGE: Record<string, { a: number; b: number; c: number }> = {
  wheat:    { a: 8.5, b: 0.35, c: 0.12 },
  maize:    { a: 8.5, b: 0.35, c: 0.12 },
  rice:     { a: 8.2, b: 0.33, c: 0.11 },
  barley:   { a: 8.4, b: 0.34, c: 0.12 },
  sorghum:  { a: 8.3, b: 0.34, c: 0.12 },
  soybean:  { a: 7.8, b: 0.32, c: 0.10 },
  oats:     { a: 8.3, b: 0.34, c: 0.12 },
};

type UiLanguage = Parameters<typeof copyFor>[0];
const cropLabel = (language: UiLanguage, key: string, c: { name: string; name_ar: string; name_fr: string }) =>
  copyFor(language, c.name, c.name_ar, c.name_fr);

export function PostHarvestStorageCalculator() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const [tab, setTab] = useState<Tab>('storage');
  const [summary, setSummary] = useState('');
  const [copied, setCopied] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleCopy = () => {
    if (!summary) {
      toast({ title: tr('Nothing to copy yet', 'لا يوجد شيء للنسخ بعد', 'Rien à copier') });
      return;
    }
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleReset = () => {
    setSummary('');
    setResetKey(k => k + 1);
    toast({ title: tr('Reset', 'إعادة', 'Réinitialiser') });
  };

  return (
    <CalculatorShell
      icon={Warehouse}
      title={TITLE}
      description={DESC}
      badge={tr('Henderson · Fraser-Dua · Page', 'هندرسون · فريزر-دوا · بيج', 'Henderson · Fraser-Dua · Page')}
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
      pills={PILLS}
      activePill={tab}
      onPillClick={(k) => setTab(k as Tab)}
      pillLabel={PILL_LABEL}
      protocolNote={PROTOCOL_NOTE}
    >
      {tab === 'storage' && <StorageTab key={`storage-${resetKey}`} language={language} onSummary={setSummary} />}
      {tab === 'drying' && <DryingTab key={`drying-${resetKey}`} language={language} onSummary={setSummary} />}
      {tab === 'aeration' && <AerationTab key={`aeration-${resetKey}`} language={language} onSummary={setSummary} />}
    </CalculatorShell>
  );
}

// ============================================================================
// Tab 1: EMC + Safe Storage
// ============================================================================

function StorageTab({ language, onSummary }: { language: UiLanguage; onSummary: (s: string) => void }) {
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const [crop, setCrop] = useState('wheat');
  const [temp, setTemp] = useState('25');
  const [rh, setRh] = useState('70');
  const [moisture, setMoisture] = useState('14');

  const result = useMemo(() => {
    const c = CROP_EMC[crop];
    const T = parseFloat(temp), RH = parseFloat(rh) / 100;
    const M = parseFloat(moisture);
    if (!Number.isFinite(T) || !Number.isFinite(RH) || RH <= 0 || RH >= 1) return null;

    // Henderson: EMC = [-ln(1-RH) / (A × (T+273.15))]^(1/B)
    const emc = Math.pow(-Math.log(1 - RH) / (c.A * (T + 273.15)), 1 / c.B);

    // Safe storage days (Fraser-Dua)
    const ss = SAFE_STORAGE[crop];
    const logD = ss.a - ss.b * M - ss.c * T;
    const safeDays = Math.pow(10, logD) * 0.7; // 0.7 safety factor

    return { emc, safeDays, safe: M <= emc, crop: c };
  }, [crop, temp, rh, moisture]);

  useMemo(() => {
    if (!result) { onSummary(''); return; }
    onSummary(
      `=== POST-HARVEST STORAGE (EMC + Safe) ===\n` +
      `Crop: ${result.crop.emoji} ${cropLabel(language, crop, result.crop)}\n` +
      `Storage T: ${temp}°C, RH: ${rh}%\n` +
      `Current moisture: ${moisture}%\n` +
      `EMC: ${result.emc.toFixed(1)}%\n` +
      `Safe storage days: ${result.safeDays < 1 ? '<1' : result.safeDays.toFixed(0)}\n` +
      `Verdict: ${result.safe ? 'SAFE to store' : 'NOT SAFE — grain will gain moisture'}`.trim(),
    );
  }, [result]);

  return (
    <>
      <CalculatorShell.Inputs>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="p-3 rounded-xl border bg-card space-y-1">
              <Label className="text-[10px]">{tr('Crop', 'المحصول', 'Culture')}</Label>
              <select value={crop} onChange={e => setCrop(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs">
                {Object.entries(CROP_EMC).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {cropLabel(language, k, v)}</option>
                ))}
              </select>
            </div>
            <CalculatorShell.InputField
              label={tr('Current moisture (% wet basis)', 'الرطوبة الحالية (% على أساس رطب)', 'Humidité actuelle (% base humide)')}
              value={moisture}
              onChange={setMoisture}
              step="0.1"
              helper={tr(`Safe: ${CROP_EMC[crop].safeMoisture}%`, `الآمن: ${CROP_EMC[crop].safeMoisture}%`, `Sûr : ${CROP_EMC[crop].safeMoisture}%`)}
            />
            <CalculatorShell.InputField
              label={tr('Storage temperature (°C)', 'درجة حرارة التخزين (°م)', 'Température de stockage (°C)')}
              value={temp}
              onChange={setTemp}
              step="0.1"
            />
            <CalculatorShell.InputField
              label={tr('Storage relative humidity (%)', 'الرطوبة النسبية للتخزين (%)', 'Humidité relative stockage (%)')}
              value={rh}
              onChange={setRh}
              step="1"
              helper="0–100%"
            />
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="space-y-3">
          {result && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CalculatorShell.MetricTile
                  label={tr('Equilibrium Moisture', 'رطوبة الاتزان', 'Humidité d’équilibre')}
                  value={result.emc.toFixed(1)}
                  unit="%"
                  color={result.safe ? 'emerald' : 'amber'}
                  helper={`${temp}°C, ${rh}% RH`}
                />
                <CalculatorShell.MetricTile
                  label={tr('Safe Storage Days', 'أيام التخزين الآمن', 'Jours de stockage sûr')}
                  value={result.safeDays < 1 ? '<1' : result.safeDays.toFixed(0)}
                  unit={tr('days', 'يوماً', 'jours')}
                  color={result.safeDays > 30 ? 'emerald' : result.safeDays > 7 ? 'amber' : 'rose'}
                  helper={tr('0.7× safety factor', 'بمعامل أمان 0.7×', 'facteur 0,7×')}
                />
              </div>

              {result.safe ? (
                <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span><strong>{tr('Safe to store.', 'آمن للتخزين.', 'Sûr à stocker.')}</strong> {tr(`Current moisture (${moisture}%) is at or below EMC (${result.emc.toFixed(1)}%). Grain will not gain moisture.`, `الرطوبة الحالية (${moisture}%) عند أو أقل من رطوبة الاتزان EMC (${result.emc.toFixed(1)}%). لن تكتسب الحبوب رطوبة.`, `Humidité actuelle (${moisture}%) ≤ EMC (${result.emc.toFixed(1)}%). Le grain ne gagnera pas d’humidité.`)}</span>
                </div>
              ) : (
                <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span><strong>{tr('Not safe to store.', 'غير آمن للتخزين.', 'Non sûr à stocker.')}</strong> {tr(`Grain will absorb moisture (EMC ${result.emc.toFixed(1)}% > current ${moisture}%). Dry grain first or reduce storage RH.`, `ستمتص الحبوب الرطوبة (رطوبة الاتزان EMC ${result.emc.toFixed(1)}% > الحالية ${moisture}%). جفف الحبوب أولاً أو خفّض الرطوبة النسبية.`, `Le grain absorbera l’humidité (EMC ${result.emc.toFixed(1)}% > actuel ${moisture}%). Sécher d’abord.`)}</span>
                </div>
              )}

              {result.safeDays < 30 && (
                <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-3 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span><strong>{tr(`Dry within ${Math.ceil(result.safeDays / 2)} days.`, `جفف خلال ${Math.ceil(result.safeDays / 2)} أيام.`, `Sécher sous ${Math.ceil(result.safeDays / 2)} jours.`)}</strong> {tr('Below 30-day safe storage — risk of mold + aflatoxin.', 'التخزين الآمن أقل من 30 يوماً — خطر العفن والأفلاتوكسين.', 'Stockage < 30 jours — risque de moisissure + aflatoxine.')}</span>
                </div>
              )}

              <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                💡 {tr(`Safe moisture for long-term storage of ${result.crop.name}: ${result.crop.safeMoisture}%. At this moisture + 25°C, expect ~100+ safe days.`, `الرطوبة الآمنة للتخزين طويل الأمد لـ ${cropLabel(language, crop, result.crop)}: ${result.crop.safeMoisture}%. عند هذه الرطوبة ودرجة 25°م، يُتوقع أكثر من 100 يوم آمن تقريباً.`, `Humidité sûre pour stockage longue durée de ${cropLabel(language, crop, result.crop)} : ${result.crop.safeMoisture}%. À cette humidité + 25°C, ~100+ jours sûrs.`)}
              </div>
            </>
          )}
        </div>
      </CalculatorShell.Results>
    </>
  );
}

// ============================================================================
// Tab 2: Drying
// ============================================================================

function DryingTab({ language, onSummary }: { language: UiLanguage; onSummary: (s: string) => void }) {
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const [crop, setCrop] = useState('wheat');
  const [mStart, setMStart] = useState('20');
  const [mTarget, setMTarget] = useState('14');
  const [airTemp, setAirTemp] = useState('60');
  const [electricityPrice, setElectricityPrice] = useState('0.12');
  const [efficiency, setEfficiency] = useState('0.6');

  const result = useMemo(() => {
    const c = CROP_EMC[crop];
    const M0 = parseFloat(mStart), Mf = parseFloat(mTarget);
    const T = parseFloat(airTemp);
    const Pe = parseFloat(electricityPrice);
    const eta = parseFloat(efficiency);
    if (!Number.isFinite(M0) || !Number.isFinite(Mf) || Mf >= M0) return null;

    // EMC at drying conditions (assume RH=30% in hot air)
    const RH = 0.30;
    const Me = Math.pow(-Math.log(1 - RH) / (c.A * (T + 273.15)), 1 / c.B);

    // Drying constants (approximate — increase with air temp)
    const k = 0.02 * Math.exp(0.03 * T);  // hr⁻¹
    const n = 0.7;

    // Moisture ratio
    const MR = (Mf - Me) / (M0 - Me);
    if (MR <= 0) return { error: 'Target moisture below EMC at these conditions — impossible.' };

    // Page equation: MR = exp(-k × t^n) → t = [-ln(MR)/k]^(1/n)
    const dryingTime = Math.pow(-Math.log(MR) / k, 1 / n);

    // Water removed (kg per tonne)
    const waterRemoved = 1000 * (M0 / 100 - Mf / 100) / (1 - Mf / 100);

    // Energy cost
    const hfg = 2260;  // kJ/kg
    const energyKWh = (waterRemoved * hfg) / (eta * 3600);
    const costPerTonne = energyKWh * Pe;

    return { dryingTime, waterRemoved, energyKWh, costPerTonne, Me, error: null };
  }, [crop, mStart, mTarget, airTemp, electricityPrice, efficiency]);

  useMemo(() => {
    if (!result) { onSummary(''); return; }
    if (result.error) { onSummary(`=== DRYING ===\nERROR: ${result.error}`); return; }
    onSummary(
      `=== POST-HARVEST DRYING ===\n` +
      `Crop: ${cropLabel(language, crop, CROP_EMC[crop])}\n` +
      `Start moisture: ${mStart}% → Target: ${mTarget}%\n` +
      `Air temp: ${airTemp}°C\n` +
      `Drying time: ${result.dryingTime!.toFixed(1)} hr\n` +
      `Water removed: ${result.waterRemoved!.toFixed(0)} kg/t\n` +
      `Energy: ${result.energyKWh!.toFixed(1)} kWh/t\n` +
      `Cost: $${result.costPerTonne!.toFixed(2)}/t`.trim(),
    );
  }, [result]);

  return (
    <>
      <CalculatorShell.Inputs>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="p-3 rounded-xl border bg-card space-y-1">
              <Label className="text-[10px]">{tr('Crop', 'المحصول', 'Culture')}</Label>
              <select value={crop} onChange={e => setCrop(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs">
                {Object.entries(CROP_EMC).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {cropLabel(language, k, v)}</option>
                ))}
              </select>
            </div>
            <CalculatorShell.InputField
              label={tr('Air temperature (°C)', 'درجة حرارة الهواء (°م)', 'Température air (°C)')}
              value={airTemp}
              onChange={setAirTemp}
              step="1"
            />
            <CalculatorShell.InputField
              label={tr('Start moisture (%)', 'الرطوبة الابتدائية (%)', 'Humidité initiale (%)')}
              value={mStart}
              onChange={setMStart}
              step="0.1"
            />
            <CalculatorShell.InputField
              label={tr('Target moisture (%)', 'الرطوبة المستهدفة (%)', 'Humidité cible (%)')}
              value={mTarget}
              onChange={setMTarget}
              step="0.1"
            />
            <CalculatorShell.InputField
              label={tr('Dryer efficiency (0–1)', 'كفاءة المجفف (0–1)', 'Efficacité séchoir (0–1)')}
              value={efficiency}
              onChange={setEfficiency}
              step="0.05"
              helper="0.3–0.9"
            />
            <CalculatorShell.InputField
              label={tr('Electricity price ($/kWh)', 'سعر الكهرباء ($/ك.و.س)', 'Prix électricité ($/kWh)')}
              value={electricityPrice}
              onChange={setElectricityPrice}
              step="0.01"
            />
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="space-y-3">
          {result?.error && (
            <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 p-3 text-xs text-rose-700 dark:text-rose-300">
              {tr(result.error, 'الرطوبة المستهدفة أقل من رطوبة الاتزان في هذه الظروف — العملية غير ممكنة.', 'L’humidité cible est inférieure à l’EMC dans ces conditions — impossible.')}
            </div>
          )}

          {result && !result.error && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CalculatorShell.MetricTile
                  label={tr('Drying time', 'زمن التجفيف', 'Temps de séchage')}
                  value={result.dryingTime!.toFixed(1)}
                  unit="hr"
                  color="amber"
                />
                <CalculatorShell.MetricTile
                  label={tr('Water removed', 'الماء المُزال', 'Eau évaporée')}
                  value={result.waterRemoved!.toFixed(0)}
                  unit="kg/t"
                  color="sky"
                />
                <CalculatorShell.MetricTile
                  label={tr('Energy', 'الطاقة', 'Énergie')}
                  value={result.energyKWh!.toFixed(1)}
                  unit="kWh/t"
                  color="default"
                />
                <CalculatorShell.MetricTile
                  label={tr('Cost', 'التكلفة', 'Coût')}
                  value={`$${result.costPerTonne!.toFixed(2)}`}
                  unit="/t"
                  color="emerald"
                />
              </div>
              <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                💡 {tr(`EMC at ${airTemp}°C drying air: ${result.Me!.toFixed(1)}%. Page equation with k=${(0.02 * Math.exp(0.03 * parseFloat(airTemp))).toFixed(3)} hr⁻¹. Increase air temp to cut drying time exponentially.`, `رطوبة الاتزان EMC عند هواء تجفيف ${airTemp}°م: ${result.Me!.toFixed(1)}%. معادلة Page بقيمة k=${(0.02 * Math.exp(0.03 * parseFloat(airTemp))).toFixed(3)} ساعة⁻¹. ارفع درجة حرارة الهواء لخفض زمن التجفيف أُسّياً.`, `EMC à ${airTemp}°C : ${result.Me!.toFixed(1)}%. Équation de Page avec k=${(0.02 * Math.exp(0.03 * parseFloat(airTemp))).toFixed(3)} h⁻¹. Augmenter la T° de l’air réduit le temps exponentiellement.`)}
              </div>
            </>
          )}
        </div>
      </CalculatorShell.Results>
    </>
  );
}

// ============================================================================
// Tab 3: Bin Aeration
// ============================================================================

function AerationTab({ language, onSummary }: { language: UiLanguage; onSummary: (s: string) => void }) {
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const [binDiameter, setBinDiameter] = useState('6');
  const [grainDepth, setGrainDepth] = useState('3');
  const [crop, setCrop] = useState('wheat');
  const [airflowRate, setAirflowRate] = useState('1.0');

  const result = useMemo(() => {
    const D = parseFloat(binDiameter), H = parseFloat(grainDepth);
    const AFR = parseFloat(airflowRate);
    if (!Number.isFinite(D) || !Number.isFinite(H)) return null;

    // Bin volume + grain weight
    const radius = D / 2;
    const volume = Math.PI * radius * radius * H;  // m³
    const bulkDensity: Record<string, number> = {
      wheat: 780, maize: 720, rice: 720, barley: 650, sorghum: 730, soybean: 720, oats: 520,
    };
    const bd = bulkDensity[crop] || 780;
    const grainMass = volume * bd;  // kg
    const grainT = grainMass / 1000;
    const grainBu = grainMass / 27.2;  // 1 bu ≈ 27.2 kg (wheat)

    // Airflow: AFR in m³/min/t × tonnes
    const cfmPerBu = AFR * 1.06;  // 1 m³/min/t ≈ 1.06 CFM/bu
    const cfm = cfmPerBu * grainBu;

    // Static pressure (rough — ASABE curves)
    const grainFactor: Record<string, number> = {
      wheat: 1.0, maize: 0.7, rice: 1.1, barley: 0.8, sorghum: 1.0, soybean: 0.7, oats: 0.6,
    };
    const sp = grainFactor[crop] * H * (0.5 + 0.3 * AFR);  // Pa (approximate)

    // Fan power: P = Q × SP / η
    const fanPower = (cfm * 0.000472 * sp) / 0.4;  // kW (convert CFM to m³/s)

    return { grainT, grainBu, cfm, sp, fanPower, volume };
  }, [binDiameter, grainDepth, crop, airflowRate]);

  useMemo(() => {
    if (!result) { onSummary(''); return; }
    onSummary(
      `=== BIN AERATION ===\n` +
      `Bin: ${binDiameter}m × ${grainDepth}m deep\n` +
      `Crop: ${cropLabel(language, crop, CROP_EMC[crop])}\n` +
      `Airflow rate: ${airflowRate} m³/min/t\n` +
      `Grain in bin: ${result.grainT.toFixed(1)} t (${result.grainBu.toFixed(0)} bu)\n` +
      `Required CFM: ${result.cfm.toFixed(0)}\n` +
      `Static pressure: ${result.sp.toFixed(0)} Pa\n` +
      `Fan power: ${result.fanPower.toFixed(1)} kW`.trim(),
    );
  }, [result]);

  return (
    <>
      <CalculatorShell.Inputs>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CalculatorShell.InputField
              label={tr('Bin diameter (m)', 'قطر الصومعة (م)', 'Diamètre silo (m)')}
              value={binDiameter}
              onChange={setBinDiameter}
              step="0.5"
            />
            <CalculatorShell.InputField
              label={tr('Grain depth (m)', 'عمق الحبوب (م)', 'Profondeur grain (m)')}
              value={grainDepth}
              onChange={setGrainDepth}
              step="0.5"
            />
            <div className="p-3 rounded-xl border bg-card space-y-1">
              <Label className="text-[10px]">{tr('Crop', 'المحصول', 'Culture')}</Label>
              <select value={crop} onChange={e => setCrop(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs">
                {Object.entries(CROP_EMC).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {cropLabel(language, k, v)}</option>
                ))}
              </select>
            </div>
            <div className="p-3 rounded-xl border bg-card space-y-1">
              <Label className="text-[10px]">{tr('Airflow rate (m³/min/t)', 'معدل تدفق الهواء (م³/دقيقة/طن)', 'Débit air (m³/min/t)')}</Label>
              <select value={airflowRate} onChange={e => setAirflowRate(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs">
                <option value="0.1">0.1 — {tr('Cooling only', 'تبريد فقط', 'Refroidissement')}</option>
                <option value="0.5">0.5 — {tr('Light drying', 'تجفيف خفيف', 'Séchage léger')}</option>
                <option value="1.0">1.0 — {tr('Standard drying', 'تجفيف قياسي', 'Séchage standard')}</option>
                <option value="2.0">2.0 — {tr('Fast drying', 'تجفيف سريع', 'Séchage rapide')}</option>
              </select>
            </div>
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="space-y-3">
          {result && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CalculatorShell.MetricTile
                  label={tr('Grain in bin', 'الحبوب في الصومعة', 'Grain dans silo')}
                  value={result.grainT.toFixed(1)}
                  unit="t"
                  color="amber"
                  helper={`${result.grainBu.toFixed(0)} bu`}
                />
                <CalculatorShell.MetricTile
                  label={tr('Required CFM', 'CFM المطلوب', 'CFM requis')}
                  value={result.cfm.toFixed(0)}
                  color="sky"
                  helper={tr('cubic ft/min', 'قدم³/دقيقة', 'pieds³/min')}
                />
                <CalculatorShell.MetricTile
                  label={tr('Static pressure', 'الضغط الساكن', 'Pression statique')}
                  value={result.sp.toFixed(0)}
                  unit="Pa"
                  color="default"
                  helper={tr('resistance', 'المقاومة', 'résistance')}
                />
                <CalculatorShell.MetricTile
                  label={tr('Fan power', 'قدرة المروحة', 'Puissance ventilateur')}
                  value={result.fanPower.toFixed(1)}
                  unit="kW"
                  color="emerald"
                  helper={tr('minimum', 'الحد الأدنى', 'minimum')}
                />
              </div>
              <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                💡 {tr(`Select fan with ≥${result.cfm.toFixed(0)} CFM at ${result.sp.toFixed(0)} Pa static pressure. Add 20% safety margin. Run fans at night (cool, dry air) for first 2 weeks.`, `اختر مروحة بقدرة ≥${result.cfm.toFixed(0)} CFM عند ضغط ساكن ${result.sp.toFixed(0)} باسكال. أضف هامش أمان 20%. شغّل المراوح ليلاً (هواء بارد وجاف) خلال أول أسبوعين.`, `Choisir ventilateur ≥${result.cfm.toFixed(0)} CFM à ${result.sp.toFixed(0)} Pa de pression statique. Ajouter 20% de marge. Faire tourner la nuit (air frais et sec) les 2 premières semaines.`)}
              </div>
            </>
          )}
        </div>
      </CalculatorShell.Results>
    </>
  );
}
