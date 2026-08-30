'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  CloudSun,
  Thermometer,
  Droplets,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Activity,
  Gauge,
  Info,
} from 'lucide-react';
import { calcVpdAdvanced, calcVpdSimple, hdClass, leafTempFromRadiation, vpdStatus } from '@/lib/nutri-tools-data';
import { WeatherFetcher } from './WeatherFetcher';
import { AnimatedCounter } from './AnimatedCounter';
import { RangeSparkline } from './RangeSparkline';
import { useTranslation, copyFor } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

interface VpdPreset {
  id: string;
  label: string;
  label_ar: string;
  label_fr: string;
  desc: string;
  airTemp: string;
  humidity: string;
  mode: 'leaf' | 'radiation';
  leafTemp?: string;
  solarRad?: string;
}

const EXTENDED_VPD_PRESETS: VpdPreset[] = [
  {
    id: 'gh-noon',
    label: 'Greenhouse Midday (Transpiring)',
    label_ar: 'ظهيرة البيوت المحمية (نتح نشط)',
    label_fr: 'Midi sous serre (Transpiration)',
    desc: 'Moderate to high transpiration drive with active leaf evaporative cooling.',
    airTemp: '28',
    humidity: '65',
    mode: 'leaf',
    leafTemp: '25.8',
  },
  {
    id: 'cold-fog',
    label: 'Early Morning High Humidity (Dew Risk)',
    label_ar: 'صباح باكر عالي الرطوبة (خطر التكاثف والفطريات)',
    label_fr: 'Matin humide (Risque de rosée & Botrytis)',
    desc: 'Low VPD with restricted transpiration and high risk of fungal spore germination (Botrytis).',
    airTemp: '14',
    humidity: '92',
    mode: 'leaf',
    leafTemp: '12.5',
  },
  {
    id: 'arid-afternoon',
    label: 'Arid / Saharan Hot Afternoon (Stress Drive)',
    label_ar: 'ظهيرة صحراوية حارة وجافة (إجهاد نتحي شديد)',
    label_fr: 'Après-midi aride / saharienne (Stress hydrique)',
    desc: 'Extreme VPD causing stomatal closure, leaf wilting, and blossom abortion.',
    airTemp: '37',
    humidity: '22',
    mode: 'radiation',
    solarRad: '920',
  },
  {
    id: 'indoor-veg',
    label: 'Indoor / Controlled Environment (Vegetative)',
    label_ar: 'زراعة داخلية مغلقة (مرحلة النمو الخضري)',
    label_fr: 'Culture Indoor / CEA (Phase Végétative)',
    desc: 'Target 0.8–1.1 kPa for optimal nutrient uptake and vegetative biomass expansion.',
    airTemp: '24',
    humidity: '70',
    mode: 'leaf',
    leafTemp: '22.8',
  },
  {
    id: 'indoor-flower',
    label: 'Indoor / Controlled Environment (Flowering/Fruiting)',
    label_ar: 'زراعة داخلية مغلقة (مرحلة الإزهار والإثمار)',
    label_fr: 'Culture Indoor (Floraison / Fructification)',
    desc: 'Target 1.2–1.5 kPa to accelerate calcium transport to buds and prevent mold.',
    airTemp: '26',
    humidity: '55',
    mode: 'leaf',
    leafTemp: '24.2',
  },
];

const TITLE: TrilingualString = {
  en: 'Precision VPD & Transpiration Deficit Estimator',
  ar: 'حاسبة عجز ضغط البخار (VPD) والعجز الرطوبي وعوامل النتح الدقيقة',
  fr: 'Estimateur DPV & Déficit de Pression de Vapeur',
};

const DESC: TrilingualString = {
  en: 'Compute true Vapor Pressure Deficit (VPD in kPa) using actual leaf temperature or solar radiation energy balance. Prevent fungal outbreaks, eliminate calcium tip burn, and optimize stomatal conductance.',
  ar: 'حساب عجز ضغط البخار الحقيقي (VPD) بدقة باستخدام حرارة أوراق النبات وتوازن الإشعاع الشمسي لمنع الأمراض الفطرية واحتراق القمم النامية وضمان الفتح المثالي للثغور.',
  fr: 'Calculez le DPV foliaire réel (kPa) et le déficit hydrique de l\'air (g/m³) pour piloter le climat de serre, éviter le tip-burn et maximiser la photosynthèse.',
};

export function VpdEstimator() {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';
  const isFr = language === 'fr';
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [airTemp, setAirTemp] = useState('25');
  const [humidity, setHumidity] = useState('60');
  const [mode, setMode] = useState<'leaf' | 'radiation'>('leaf');
  const [leafTemp, setLeafTemp] = useState('23.5');
  const [solarRad, setSolarRad] = useState('500');
  const [liveApplied, setLiveApplied] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string>('gh-noon');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'calculator' | 'matrix' | 'physiology'>('calculator');

  const applyPreset = (p: VpdPreset) => {
    setActivePresetId(p.id);
    setAirTemp(p.airTemp);
    setHumidity(p.humidity);
    setMode(p.mode);
    if (p.leafTemp !== undefined) setLeafTemp(p.leafTemp);
    if (p.solarRad !== undefined) setSolarRad(p.solarRad);
    setLiveApplied(false);
    toast({
      title: tr(`Applied Preset: ${p.label}`, `تم تطبيق قالب: ${p.label_ar}`, `Scénario appliqué : ${p.label_fr}`),
      description: p.desc,
    });
  };

  const t = parseFloat(airTemp) || 0;
  const rh = parseFloat(humidity) || 0;
  const lt =
    mode === 'leaf'
      ? parseFloat(leafTemp) || t - 1.5
      : leafTempFromRadiation(t, parseFloat(solarRad) || 0);

  const hasInputs = !!(t && rh >= 0 && rh <= 100);
  const result = hasInputs
    ? mode === 'leaf'
      ? calcVpdAdvanced(t, rh, lt)
      : calcVpdAdvanced(t, rh, Math.round(lt * 10) / 10)
    : null;
  const simple = hasInputs ? calcVpdSimple(t, rh) : null;

  const status = result ? vpdStatus(result.vpd) : null;
  const hdCls = result ? hdClass(result.hd) : null;

  // Dew point calculation (Magnus-Tetens formula)
  const dewPoint = useMemo(() => {
    if (!t || !rh) return 0;
    const a = 17.27;
    const b = 237.7;
    const alpha = (a * t) / (b + t) + Math.log(rh / 100);
    return (b * alpha) / (a - alpha);
  }, [t, rh]);

  const handleCopyReport = () => {
    if (!result || !status) return;
    const text = `
=== VAPOR PRESSURE DEFICIT (VPD) & MICROCLIMATE REPORT ===
Air Temperature: ${t.toFixed(1)} °C | Relative Humidity: ${rh.toFixed(1)}%
Leaf Temperature: ${lt.toFixed(1)} °C (Delta: ${(lt - t).toFixed(1)} °C)
Calculated Dew Point: ${dewPoint.toFixed(1)} °C

RESULTS:
• Advanced Leaf VPD: ${result.vpd.toFixed(2)} kPa [Status: ${status.label}]
• Humidity Deficit (HD): ${result.hd.toFixed(2)} g/m³ [${hdCls?.label}]
• Simple Air VPD: ${simple?.vpd.toFixed(2)} kPa
• Saturated Vapor Pressure (Air): ${(result.vpsAir ?? 0).toFixed(2)} kPa
• Actual Vapor Pressure (Air): ${(result.vpa ?? 0).toFixed(2)} kPa
• Saturated Vapor Pressure (Leaf): ${(result.vpsLeaf ?? 0).toFixed(2)} kPa

AGRONOMIC RECOMMENDATION:
${hdCls?.message}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: tr('VPD Report Copied!', 'تم نسخ تقرير عجز ضغط البخار!', 'Rapport DPV copié !'),
      description: tr('Full psychrometric calculations copied to clipboard.', 'تم نسخ الحسابات السيكرومترية الدقيقة للحافظة.', 'Copié.'),
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleReset = () => {
    applyPreset(EXTENDED_VPD_PRESETS[0]);
    setActiveTab('calculator');
  };

  return (
    <CalculatorShell
      icon={Droplets}
      title={TITLE}
      description={DESC}
      badge="Leaf Psychrometrics"
      accent="teal"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Diagnostics', ar: 'نسخ التشخيص', fr: 'Copier' },
          onClick: handleCopyReport,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
    >
      {/* Quick Climate Scenarios Pill Bar */}
      <div className="lg:col-span-12 flex flex-wrap items-center gap-2 p-3.5 rounded-2xl border bg-card shadow-xs">
        <span className="text-xs text-muted-foreground font-medium me-1">
          {tr('Quick Climate Scenarios:', 'سيناريوهات مناخية سريعة:', 'Scénarios climatiques :')}
        </span>
        {EXTENDED_VPD_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => applyPreset(p)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activePresetId === p.id
                ? 'bg-teal-500 text-white shadow-md font-bold'
                : 'bg-muted hover:bg-muted/70 text-foreground'
            }`}
          >
            {isAr ? p.label_ar : isFr ? p.label_fr : p.label}
          </button>
        ))}
      </div>

      {/* Top Vital Metric Displays */}
      {result && status && hdCls && (
        <div className="lg:col-span-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-1" style={{ borderColor: `${status.color}40` }}>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>{tr('True Leaf VPD', 'عجز ضغط بخار الورقة (VPD)', 'DPV Foliaire Réel')}</span>
              <Gauge className="h-3.5 w-3.5" style={{ color: status.color }} />
            </div>
            <div className="text-2xl font-black font-mono" style={{ color: status.color }}>
              <AnimatedCounter value={result.vpd} decimals={2} suffix=" kPa" />
            </div>
            <div className="text-[10px] font-bold flex items-center gap-1" style={{ color: status.color }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: status.color }} />
              {status.label}
            </div>
          </div>

          <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-1" style={{ borderColor: `${hdCls.color}40` }}>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>{tr('Humidity Deficit (HD)', 'العجز الرطوبي الحجمي', 'Déficit Hydrique (HD)')}</span>
              <Droplets className="h-3.5 w-3.5" style={{ color: hdCls.color }} />
            </div>
            <div className="text-2xl font-black font-mono" style={{ color: hdCls.color }}>
              <AnimatedCounter value={result.hd} decimals={2} suffix=" g/m³" />
            </div>
            <div className="text-[10px] font-bold" style={{ color: hdCls.color }}>
              {hdCls.label}
            </div>
          </div>

          <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-1">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>{tr('Dew Point (T_dew)', 'نقطة الندى (التكاثف)', 'Point de Rosée')}</span>
              <Thermometer className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-700 dark:text-blue-300 font-mono">
              {dewPoint.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">°C</span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {dewPoint >= lt - 1.5 ? (
                <span className="text-rose-600 font-bold flex items-center gap-0.5">
                  <AlertTriangle className="h-3 w-3" /> {tr('Condensation Risk!', 'خطر تكاثف قطرات الماء!', 'Risque de condensation !')}
                </span>
              ) : (
                <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                  <CheckCircle2 className="h-3 w-3" /> {tr('Safe from dew', 'آمن من التكاثف', 'Sans condensation')}
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-1">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>{tr('Leaf-to-Air Delta (ΔT)', 'فرق حرارة الورقة والجو', 'Delta T Feuille-Air')}</span>
              <Activity className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-700 dark:text-purple-300 font-mono">
              {(lt - t).toFixed(1)} <span className="text-sm font-normal text-muted-foreground">°C</span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {lt < t ? (
                <span className="text-emerald-600 font-medium">{tr('Evaporative Cooling Active', 'تبريد نتحي فعال', 'Refroidissement actif')}</span>
              ) : (
                <span className="text-amber-600 font-medium">{tr('Radiative Heating / Stress', 'احترار إشعاعي وإجهاد', 'Échauffement radiatif')}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="lg:col-span-12 w-full">
        <TabsList className="grid grid-cols-3 w-full h-11 p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="calculator" className="rounded-lg text-xs font-bold gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-emerald-600" />
            <span>{tr('Psychrometric Calculator', 'الحاسبة السيكرومترية', 'Calculateur Psychrométrique')}</span>
          </TabsTrigger>
          <TabsTrigger value="matrix" className="rounded-lg text-xs font-bold gap-1.5">
            <Layers className="h-3.5 w-3.5 text-teal-600" />
            <span>{tr('VPD Heatmap Matrix', 'جدول ومصفوفة الـ VPD الشاملة', 'Matrice & Grille DPV')}</span>
          </TabsTrigger>
          <TabsTrigger value="physiology" className="rounded-lg text-xs font-bold gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>{tr('Crop Target Zones & Health', 'أهداف المحاصيل والإجهاد الفسيولوجي', 'Zones Cibles & Physiologie')}</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CALCULATOR */}
        <TabsContent value="calculator" className="space-y-4 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Form */}
            <div className="lg:col-span-6 space-y-4">
              <Card className="rounded-2xl border shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/30 py-3.5 px-4 border-b">
                  <CardTitle className="text-sm font-bold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-emerald-600" />
                      {tr('Climate & Crop Parameters', 'مدخلات المناخ وحرارة الورقة', 'Paramètres Climat & Végétal')}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <WeatherFetcher
                    variant="vpd"
                    onWeather={(w) => {
                      setAirTemp(String(w.temperature));
                      setHumidity(String(w.humidity));
                      setSolarRad(String(w.solarRadiation));
                      setMode('radiation');
                      setLiveApplied(true);
                      toast({
                        title: tr('Live Weather Synced', 'تم ربط الطقس اللحظي', 'Météo en direct synchronisée'),
                        description: `${w.temperature}°C, ${w.humidity}% RH, ${w.solarRadiation} W/m²`,
                      });
                    }}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        {tr('Air Temperature (°C)', 'حرارة الهواء الجاف (°C)', 'Température de l\'air (°C)')}
                        {liveApplied && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50 rounded-full px-1.5 py-px">
                            <CloudSun className="h-2.5 w-2.5" />
                            Live
                          </span>
                        )}
                      </Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={airTemp}
                        onChange={(e) => setAirTemp(e.target.value)}
                        className="h-9 font-mono font-bold mt-1"
                        placeholder="25"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">{tr('Relative Humidity (%)', 'الرطوبة النسبية (%)', 'Humidité Relative (%)')}</Label>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        value={humidity}
                        onChange={(e) => setHumidity(e.target.value)}
                        className="h-9 font-mono font-bold mt-1"
                        placeholder="60"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t space-y-3">
                    <div>
                      <Label className="text-xs font-semibold mb-2 block">{tr('Leaf Temperature Acquisition Mode:', 'طريقة تحديد حرارة أوراق النبات:', 'Mode de mesure foliaire :')}</Label>
                      <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'leaf' | 'radiation')} className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem id="vpd-leaf-m" value="leaf" />
                          <Label htmlFor="vpd-leaf-m" className="text-xs cursor-pointer font-medium">
                            {tr('Infrared IR Gun (Direct)', 'ميزان حرارة بالأشعة تحت الحمراء (مباشر)', 'Thermomètre IR direct')}
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem id="vpd-rad-m" value="radiation" />
                          <Label htmlFor="vpd-rad-m" className="text-xs cursor-pointer font-medium">
                            {tr('Solar Radiation Model (W/m²)', 'نموذج الإشعاع الشمسي (W/m²)', 'Modèle radiatif')}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {mode === 'leaf' ? (
                      <div>
                        <Label className="text-xs font-semibold">{tr('Measured Leaf Surface Temp (°C)', 'حرارة سطح الورقة المقاسة (°C)', 'Température de surface foliaire (°C)')}</Label>
                        <Input
                          type="number"
                          step="0.2"
                          value={leafTemp}
                          onChange={(e) => setLeafTemp(e.target.value)}
                          className="h-9 font-mono mt-1 text-emerald-700 dark:text-emerald-300 font-bold"
                          placeholder="23.5"
                        />
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {tr('Typical active transpiration offset is 1.5–3.0°C below air temperature.', 'النتح النشط يخفض حرارة الورقة 1.5–3°C تحت حرارة الهواء.', 'En transpiration active, la feuille est 1.5–3°C plus fraîche.')}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Label className="text-xs font-semibold">{tr('Global Solar Radiation (W/m²)', 'شدة الإشعاع الشمسي الكلي (W/m²)', 'Rayonnement Solaire (W/m²)')}</Label>
                        <Input
                          type="number"
                          step="50"
                          value={solarRad}
                          onChange={(e) => setSolarRad(e.target.value)}
                          className="h-9 font-mono mt-1 font-bold"
                          placeholder="500"
                        />
                        <div className="text-[11px] text-muted-foreground mt-1 flex justify-between">
                          <span>{tr('Estimated Leaf Temp from Radiation:', 'حرارة الورقة التقديرية:', 'Température foliaire estimée :')}</span>
                          <strong className="text-emerald-700 dark:text-emerald-300 font-mono">{lt.toFixed(1)} °C</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Visual & Ranges */}
            <div className="lg:col-span-6 space-y-4">
              <Card className="rounded-2xl border shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/30 py-3.5 px-4 border-b">
                  <CardTitle className="text-sm font-bold flex items-center justify-between">
                    <span>{tr('VPD Spectrum & Physiological Interpretation', 'طيف الـ VPD والتفسير الفسيولوجي', 'Spectre DPV & Interprétation')}</span>
                    {status && (
                      <Badge variant="outline" className="font-bold" style={{ color: status.color, borderColor: status.color }}>
                        {status.label}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {result ? (
                    <>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 font-bold">
                          {tr('Active VPD Position on Agronomic Scale:', 'موقع الـ VPD على سلم الاستجابة النباتية:', 'Position sur l\'échelle agronomique :')}
                        </div>
                        <RangeSparkline
                          value={result.vpd}
                          min={0}
                          max={3.0}
                          zones={[
                            { from: 0, to: 0.4, color: '#3b82f6', label: tr('Danger: Low', 'خطر: ركود', 'Trop bas') },
                            { from: 0.4, to: 0.8, color: '#06b6d4', label: tr('Propagation / Seedlings', 'شتلات وتجذير', 'Semis') },
                            { from: 0.8, to: 1.2, color: '#10b981', label: tr('Optimal Vegetative', 'نمو خضري مثالي', 'Végétatif optimal') },
                            { from: 1.2, to: 1.6, color: '#84cc16', label: tr('Optimal Fruiting', 'إثمار مثالي', 'Fructification') },
                            { from: 1.6, to: 3.0, color: '#ef4444', label: tr('Danger: High Stress', 'خطر: إجهاد حاد', 'Stress hydrique') },
                          ]}
                          showLabels
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 pt-2 text-xs">
                        <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
                          <div className="text-[10px] text-muted-foreground">{tr('Simple Air VPD (No leaf delta)', 'VPD الهواء فقط (بدون حرارة الورقة)', 'DPV Air Simple')}</div>
                          <div className="font-mono font-bold text-foreground text-base">{simple?.vpd.toFixed(2)} kPa</div>
                        </div>

                        <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
                          <div className="text-[10px] text-muted-foreground">{tr('Saturated Vapor Press. (Leaf)', 'ضغط التشبع عند الورقة', 'Pression Vapeur Sat. Feuille')}</div>
                          <div className="font-mono font-bold text-foreground text-base">{(result.vpsLeaf ?? 0).toFixed(2)} kPa</div>
                        </div>
                      </div>

                      <div
                        className="p-3.5 rounded-xl border text-xs leading-relaxed space-y-1"
                        style={{ color: hdCls?.color, background: `${hdCls?.color}10`, borderColor: `${hdCls?.color}30` }}
                      >
                        <div className="font-bold flex items-center gap-1.5">
                          <Info className="h-4 w-4 shrink-0" />
                          {tr('Agronomic Climate Prescription:', 'التوجيه الزراعي للمناخ:', 'Prescription climatique :')}
                        </div>
                        <p className="text-[11px]">{hdCls?.message}</p>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground text-xs">
                      {tr('Enter air temperature and humidity to see full psychrometric diagnostics.', 'أدخل درجة الحرارة والرطوبة لعرض التشخيص السيكرومتري.', 'Saisissez les données.')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: VPD HEATMAP MATRIX */}
        <TabsContent value="matrix" className="space-y-4 pt-2">
          <Card className="rounded-2xl border shadow-xs overflow-hidden">
            <CardHeader className="bg-muted/30 py-3.5 px-4 border-b">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>{tr('VPD Lookup Grid (°C vs. Relative Humidity %)', 'مصفوفة الـ VPD الشاملة (درجات الحرارة مقابل الرطوبة)', 'Grille DPV Complète')}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {tr('Assuming standard -2.0°C leaf cooling offset', 'بافتراض فرق حرارة للورقة -2.0°C', 'Offset foliaire -2.0°C')}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 overflow-x-auto">
              <div className="min-w-[600px]">
                <table className="w-full text-xs text-center border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b">
                      <th className="p-2 text-left font-bold">{tr('Air Temp (°C)', 'حرارة الجو', 'Temp Air')}</th>
                      {[40, 50, 60, 70, 80, 90].map((rhVal) => (
                        <th key={rhVal} className="p-2 font-bold font-mono">
                          {rhVal}% RH
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y font-mono">
                    {[16, 20, 24, 28, 32, 36].map((tempVal) => (
                      <tr key={tempVal} className="hover:bg-muted/20">
                        <td className="p-2 text-left font-bold text-foreground bg-muted/20">{tempVal} °C</td>
                        {[40, 50, 60, 70, 80, 90].map((rhVal) => {
                          const v = calcVpdAdvanced(tempVal, rhVal, tempVal - 2.0).vpd;
                          let bg = 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200';
                          if (v < 0.5) bg = 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200';
                          else if (v > 1.6) bg = 'bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200';
                          else if (v > 1.2) bg = 'bg-teal-100 text-teal-900 dark:bg-teal-950/60 dark:text-teal-200';

                          return (
                            <td key={rhVal} className="p-2">
                              <span className={`inline-block px-2 py-1 rounded-md text-[11px] font-bold ${bg}`}>
                                {v.toFixed(2)}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-blue-500 inline-block" />
                    <span>&lt; 0.5 kPa ({tr('Under-transpiration / Disease', 'ركود رطوبي / فطريات', 'Sous-transpiration')})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                    <span>0.8 – 1.2 kPa ({tr('Vegetative Target', 'النمو الخضري الأمثل', 'Végétatif optimal')})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-teal-500 inline-block" />
                    <span>1.2 – 1.5 kPa ({tr('Fruiting Target', 'مرحلة الإثمار والسكريات', 'Fructification')})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
                    <span>&gt; 1.6 kPa ({tr('Stomatal Closure / Stress', 'إغلاق الثغور / إجهاد حاد', 'Fermeture stomates')})</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: CROPS & PHYSIOLOGY */}
        <TabsContent value="physiology" className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl border shadow-xs overflow-hidden">
              <CardHeader className="bg-muted/30 py-3.5 px-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  {tr('Crop-Specific Target VPD Guidelines', 'إرشادات الـ VPD حسب نوع المحصول', 'Directives DPV par culture')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-muted/20 border space-y-1">
                  <div className="font-bold text-foreground flex justify-between">
                    <span>🍅 {tr('Greenhouse Tomato & Pepper', 'طماطم وفلفل البيوت المحمية', 'Tomate & Poivron')}</span>
                    <Badge variant="outline" className="font-mono text-emerald-700 dark:text-emerald-300">0.9 – 1.3 kPa</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {tr(
                      'Prevents Blossom End Rot (BER) by ensuring continuous calcium xylem transport without leaf wilting.',
                      'يحمي من تعفن الطرف الزهري بضمان انتقال الكالسيوم عبر الخشب بدون ذبول الأوراق.',
                      'Prévient le cul noir (BER) en assurant le transport continu du calcium.'
                    )}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-muted/20 border space-y-1">
                  <div className="font-bold text-foreground flex justify-between">
                    <span>🥬 {tr('Leafy Greens & Hydroponic Lettuce', 'خس وورقيات هيدروبونيك', 'Laitues & Légumes Feuilles')}</span>
                    <Badge variant="outline" className="font-mono text-teal-700 dark:text-teal-300">0.8 – 1.1 kPa</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {tr(
                      'Maintains rapid cell elongation and prevents inner tip burn caused by calcium deficiency in enclosed hearts.',
                      'يحافظ على استطالة الخلايا السريعة ويمنع احتراق حواف الأوراق الداخلية (Tip-burn).',
                      'Évite le tip-burn interne des cœurs de laitues.'
                    )}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-muted/20 border space-y-1">
                  <div className="font-bold text-foreground flex justify-between">
                    <span>🍓 {tr('Strawberry (Protected Cultivation)', 'فراولة (أنفاق وزراعة محمية)', 'Fraisier sous abri')}</span>
                    <Badge variant="outline" className="font-mono text-blue-700 dark:text-blue-300">0.7 – 1.0 kPa</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {tr(
                      'High sensitivity to moisture stress; maintaining < 1.0 kPa prevents calyx browning and flower drying.',
                      'حساسية عالية للجفاف؛ الحفاظ على أقل من 1.0 kPa يحمي الكأس والأزهار من الجفاف.',
                      'Évite le dessèchement des sépales et favorise la nouaison.'
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border shadow-xs overflow-hidden">
              <CardHeader className="bg-muted/30 py-3.5 px-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-600" />
                  {tr('Microclimate Control Corrective Actions', 'الإجراءات التصحيحية للتحكم في المناخ', 'Actions correctives du microclimat')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs leading-relaxed">
                <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 space-y-1">
                  <div className="font-bold text-rose-950 dark:text-rose-200">
                    {tr('If VPD is Too High (> 1.5 kPa):', 'إذا كان الـ VPD مرتفعاً جداً (> 1.5 kPa):', 'Si le DPV est trop élevé (> 1.5 kPa) :')}
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-rose-900/90 dark:text-rose-300 space-y-0.5">
                    <li>{tr('Deploy high-pressure fogging/misting systems or wet pads.', 'تشغيل نظام التضبيب عالي الضغط (Fogging) أو وسائد التبريد الرطب.', 'Activer la brumisation haute pression ou les cooling pads.')}</li>
                    <li>{tr('Close thermal shade screens to reduce radiative heat load.', 'فرد ستائر التظليل الحراري لخفض الحمل الإشعاعي المباشر.', 'Déployer les écrans d\'ombrage thermiques.')}</li>
                    <li>{tr('Increase irrigation frequency to support high transpiration demand.', 'زيادة وتيرة الري لتعويض استهلاك المياه العالي.', 'Augmenter la fréquence des irrigations.')}</li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 space-y-1">
                  <div className="font-bold text-blue-950 dark:text-blue-200">
                    {tr('If VPD is Too Low (< 0.5 kPa):', 'إذا كان الـ VPD منخفضاً جداً (< 0.5 kPa):', 'Si le DPV est trop bas (< 0.5 kPa) :')}
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-blue-900/90 dark:text-blue-300 space-y-0.5">
                    <li>{tr('Open ridge vents to expel saturated moisture and increase air renewal.', 'فتح النوافذ العلوية لطرد الرطوبة المشبعة وتجديد الهواء.', 'Ouvrir les ouvrants pour évacuer l\'humidité.')}</li>
                    <li>{tr('Activate minimum heating (heating + venting combo) to raise air temp and water holding capacity.', 'تشغيل التدفئة الخفيفة مع التهوية لرفع درجة حرارة الهواء وقدرته على حمل البخار.', 'Chauffer légèrement tout en ventilant.')}</li>
                    <li>{tr('Run horizontal air circulation fans to break humid boundary layers around leaves.', 'تشغيل مراوح تدوير الهواء لكسر الطبقة الرطوبة الملاصقة للأوراق.', 'Activer les brasseurs d\'air pour casser la couche limite.')}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </CalculatorShell>
  );
}
