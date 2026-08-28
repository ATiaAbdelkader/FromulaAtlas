'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Droplets,
  Wind,
  Thermometer,
  CloudRain,
  RotateCcw,
  Check,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Info,
} from 'lucide-react';
import { type Language } from '@/lib/language-store';

export interface TelemetryThresholdConfig {
  rhLow: number;
  rhHigh: number;
  rhExtreme: number;
  windWarning: number;
  windDanger: number;
  tempMinFrost: number;
  tempMaxWarning: number;
  tempMaxDanger: number;
  rainWarning: number;
  rainDanger: number;
  et0Warning: number;
}

export const DEFAULT_TELEMETRY_THRESHOLDS: TelemetryThresholdConfig = {
  rhLow: 25,
  rhHigh: 85,
  rhExtreme: 90,
  windWarning: 15,
  windDanger: 25,
  tempMinFrost: 2,
  tempMaxWarning: 32,
  tempMaxDanger: 35,
  rainWarning: 15,
  rainDanger: 25,
  et0Warning: 6.0,
};

export const THRESHOLDS_STORAGE_KEY = 'agri_sensor_thresholds_v1';

export function loadSavedThresholds(): TelemetryThresholdConfig {
  if (typeof window === 'undefined') return DEFAULT_TELEMETRY_THRESHOLDS;
  try {
    const raw = localStorage.getItem(THRESHOLDS_STORAGE_KEY);
    if (!raw) return DEFAULT_TELEMETRY_THRESHOLDS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_TELEMETRY_THRESHOLDS, ...parsed };
  } catch {
    return DEFAULT_TELEMETRY_THRESHOLDS;
  }
}

function copyFor(language: Language, en: string, fr: string, ar: string) {
  return language === 'ar' ? ar : language === 'fr' ? fr : en;
}

interface TelemetryThresholdsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thresholds: TelemetryThresholdConfig;
  onSaveThresholds: (config: TelemetryThresholdConfig) => void;
  current?: {
    relativeHumidity: number;
    windSpeed10m: number;
    temperature: number;
  } | null;
  today?: {
    tempMax: number;
    tempMin: number;
    precipitationSum: number;
    et0: number;
  } | null;
  language: Language;
  initialTab?: 'humidity' | 'wind' | 'temp' | 'rain';
}

export function TelemetryThresholdsDialog({
  open,
  onOpenChange,
  thresholds,
  onSaveThresholds,
  current,
  today,
  language,
  initialTab = 'humidity',
}: TelemetryThresholdsDialogProps) {
  const [draft, setDraft] = useState<TelemetryThresholdConfig>(thresholds);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'humidity' | 'wind' | 'temp' | 'rain'>(initialTab);

  useEffect(() => {
    if (open) {
      setDraft(thresholds);
      setSavedSuccess(false);
      if (initialTab) {
        setActiveTab(initialTab);
      }
    }
  }, [open, thresholds, initialTab]);

  const handleSave = () => {
    onSaveThresholds(draft);
    setSavedSuccess(true);
    setTimeout(() => {
      onOpenChange(false);
      setSavedSuccess(false);
    }, 400);
  };

  const handleReset = () => {
    setDraft(DEFAULT_TELEMETRY_THRESHOLDS);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto p-5">
        <DialogHeader className="space-y-1.5 pb-2 border-b">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                {copyFor(
                  language,
                  'Telemetry Alert Thresholds',
                  'Seuils d’alerte télémétrique',
                  'عتبات وتنبيهات الحساسات الزراعية',
                )}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {copyFor(
                  language,
                  'Customize high and low trigger limits for agricultural safety warnings.',
                  'Personnalisez les limites hautes et basses pour les alertes de sécurité agricole.',
                  'قم بتخصيص الحدود القصوى والدنيا لإطلاق التنبيهات الميدانية.',
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full mt-2">
          <TabsList className="grid grid-cols-4 w-full h-9">
            <TabsTrigger value="humidity" className="text-xs gap-1.5">
              <Droplets className="h-3.5 w-3.5 text-sky-500" />
              <span>{copyFor(language, 'Humidity', 'Humidité', 'الرطوبة')}</span>
            </TabsTrigger>
            <TabsTrigger value="wind" className="text-xs gap-1.5">
              <Wind className="h-3.5 w-3.5 text-teal-500" />
              <span>{copyFor(language, 'Wind', 'Vent', 'الرياح')}</span>
            </TabsTrigger>
            <TabsTrigger value="temp" className="text-xs gap-1.5">
              <Thermometer className="h-3.5 w-3.5 text-amber-500" />
              <span>{copyFor(language, 'Temp', 'T°', 'الحرارة')}</span>
            </TabsTrigger>
            <TabsTrigger value="rain" className="text-xs gap-1.5">
              <CloudRain className="h-3.5 w-3.5 text-blue-500" />
              <span>{copyFor(language, 'Rain / ET₀', 'Pluie / ET₀', 'المطر / ET₀')}</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: HUMIDITY */}
          <TabsContent value="humidity" className="space-y-4 pt-3">
            <div className="p-3 rounded-lg bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-900/40 text-xs flex items-start gap-2.5">
              <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              <div className="text-sky-900 dark:text-sky-200">
                {copyFor(
                  language,
                  'High humidity (>85%) causes spore germination and mildew risk. Very low humidity (<25%) causes stomatal shutdown.',
                  'Une forte humidité (>85%) favorise la germination des spores et le mildiou. Une faible humidité (<25%) ferme les stomates.',
                  'الرطوبة العالية (>85%) تحفز إنبات الفطريات والبياض الزغبي، بينما الرطوبة المنخفضة جداً (<25%) تؤدي لإجهاد نتحي وإغلاق الثغور.',
                )}
              </div>
            </div>

            {current && (
              <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-muted/40 border">
                <span className="text-muted-foreground">{copyFor(language, 'Current Live RH:', 'HR actuelle en direct :', 'الرطوبة اللحظية:')}</span>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{current.relativeHumidity}%</span>
              </div>
            )}

            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    {copyFor(language, 'Dry Air Threshold (Low Limit)', 'Seuil d’air sec (Limite basse)', 'عتبة الجفاف الجوي (الحد الأدنى)')}
                  </Label>
                  <Badge variant="outline" className="font-mono text-xs">
                    &lt; {draft.rhLow}%
                  </Badge>
                </div>
                <Slider
                  value={[draft.rhLow]}
                  min={10}
                  max={45}
                  step={1}
                  onValueChange={([val]) => setDraft({ ...draft, rhLow: val })}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    {copyFor(language, 'Fungal Disease Warning (High Limit)', 'Alerte maladie fongique (Limite haute)', 'عتبة الخطر الفطري (الحد الأعلى)')}
                  </Label>
                  <Badge variant="outline" className="font-mono text-xs">
                    &ge; {draft.rhHigh}%
                  </Badge>
                </div>
                <Slider
                  value={[draft.rhHigh]}
                  min={70}
                  max={95}
                  step={1}
                  onValueChange={([val]) => setDraft({ ...draft, rhHigh: val })}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                    {copyFor(language, 'Extreme Spore Hazard (Critical High)', 'Risque cryptogamique extrême (Critique)', 'عتبة الخطر الفطري الحرج')}
                  </Label>
                  <Badge variant="outline" className="font-mono text-xs border-rose-500/40 text-rose-600 dark:text-rose-400">
                    &ge; {draft.rhExtreme}%
                  </Badge>
                </div>
                <Slider
                  value={[draft.rhExtreme]}
                  min={80}
                  max={100}
                  step={1}
                  onValueChange={([val]) => setDraft({ ...draft, rhExtreme: val })}
                />
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: WIND */}
          <TabsContent value="wind" className="space-y-4 pt-3">
            <div className="p-3 rounded-lg bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40 text-xs flex items-start gap-2.5">
              <Info className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              <div className="text-teal-900 dark:text-teal-200">
                {copyFor(
                  language,
                  'Agrochemical spraying should be suspended when wind exceeds safety limits to prevent drift contamination and volatilization.',
                  'Les pulvérisations doivent être suspendues au-delà des limites de vent pour éviter les dérives et contaminations.',
                  'يجب تعليق عمليات الرش عند تجاوز سرعة الرياح لحدود الأمان لتجنب انجراف المبيدات وتلوث المحاصيل المجاورة.',
                )}
              </div>
            </div>

            {current && (
              <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-muted/40 border">
                <span className="text-muted-foreground">{copyFor(language, 'Current Live Wind:', 'Vent actuel en direct :', 'سرعة الرياح اللحظية:')}</span>
                <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{current.windSpeed10m.toFixed(1)} km/h</span>
              </div>
            )}

            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    {copyFor(language, 'Spray Drift Safety Limit', 'Limite de dérive de pulvérisation', 'حد أمان انجراف الرش')}
                  </Label>
                  <Badge variant="outline" className="font-mono text-xs">
                    &ge; {draft.windWarning} km/h
                  </Badge>
                </div>
                <Slider
                  value={[draft.windWarning]}
                  min={8}
                  max={25}
                  step={1}
                  onValueChange={([val]) => setDraft({ ...draft, windWarning: val })}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                    {copyFor(language, 'No-Spray / Crop Mechanical Stress', 'Interdiction de traitement / Stress mécanique', 'حظر الرش / خطر الأضرار الميكانيكية')}
                  </Label>
                  <Badge variant="outline" className="font-mono text-xs border-rose-500/40 text-rose-600 dark:text-rose-400">
                    &ge; {draft.windDanger} km/h
                  </Badge>
                </div>
                <Slider
                  value={[draft.windDanger]}
                  min={18}
                  max={45}
                  step={1}
                  onValueChange={([val]) => setDraft({ ...draft, windDanger: val })}
                />
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: TEMPERATURE */}
          <TabsContent value="temp" className="space-y-4 pt-3">
            <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs flex items-start gap-2.5">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-amber-900 dark:text-amber-200">
                {copyFor(
                  language,
                  'Temperatures below freezing damage buds and leaf tissue. Temperatures above 35°C trigger flower abortion and pollen sterility.',
                  'Les températures négatives ou proches de 0°C endommagent les bourgeons. Au-delà de 35°C, l’avortement floral s’accélère.',
                  'درجات الحرارة القريبة من الصفر تسبب صقيعاً وتلفاً للأنسجة الغضة، والحرارة فوق 35°م تسبب إجهاض الأزهار وعقم حبوب اللقاح.',
                )}
              </div>
            </div>

            {today && (
              <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-muted/40 border">
                <span className="text-muted-foreground">{copyFor(language, 'Today\'s Forecast Hi / Lo:', 'Prévision Max / Min du jour :', 'توقعات اليوم ع / م:')}</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {today.tempMax.toFixed(0)}°C / {today.tempMin.toFixed(0)}°C
                </span>
              </div>
            )}

            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                    {copyFor(language, 'Frost Hazard Threshold (Min Temp)', 'Seuil de risque de gel (T° min)', 'عتبة خطر الصقيع (الحرارة الدنيا)')}
                  </Label>
                  <Badge variant="outline" className="font-mono text-xs border-blue-500/40 text-blue-600 dark:text-blue-400">
                    &le; {draft.tempMinFrost}°C
                  </Badge>
                </div>
                <Slider
                  value={[draft.tempMinFrost]}
                  min={-5}
                  max={8}
                  step={1}
                  onValueChange={([val]) => setDraft({ ...draft, tempMinFrost: val })}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    {copyFor(language, 'Heat Stress Warning (Max Temp)', 'Alerte forte chaleur (T° max)', 'تنبيه الحرارة المرتفعة (الحرارة القصوى)')}
                  </Label>
                  <Badge variant="outline" className="font-mono text-xs">
                    &ge; {draft.tempMaxWarning}°C
                  </Badge>
                </div>
                <Slider
                  value={[draft.tempMaxWarning]}
                  min={26}
                  max={38}
                  step={1}
                  onValueChange={([val]) => setDraft({ ...draft, tempMaxWarning: val })}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                    {copyFor(language, 'Critical Heat Stress / Abortion Limit', 'Seuil canicule critique / Avortement floral', 'عتبة الحرارة الحرجة / عقم الأزهار')}
                  </Label>
                  <Badge variant="outline" className="font-mono text-xs border-rose-500/40 text-rose-600 dark:text-rose-400">
                    &ge; {draft.tempMaxDanger}°C
                  </Badge>
                </div>
                <Slider
                  value={[draft.tempMaxDanger]}
                  min={32}
                  max={45}
                  step={1}
                  onValueChange={([val]) => setDraft({ ...draft, tempMaxDanger: val })}
                />
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: RAINFALL & ET0 */}
          <TabsContent value="rain" className="space-y-4 pt-3">
            <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs flex items-start gap-2.5">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-blue-900 dark:text-blue-200">
                {copyFor(
                  language,
                  'Rainfall above limits requires pausing scheduled irrigation and avoiding soil compaction from tractors. High ET₀ demands increased irrigation.',
                  'Les fortes pluies imposent l’arrêt des irrigations programmées et limitent le passage d’engins. Une ET₀ élevée exige un apport accru.',
                  'الأمطار الغزيرة تتطلب إيقاف الري المبرمج وتجنب ضغط التربة بالجرارات. ارتفاع التبخر ET₀ يتطلب زيادة كميات الري.',
                )}
              </div>
            </div>

            {today && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-muted/40 border">
                  <span className="text-muted-foreground">{copyFor(language, 'Rain Today:', 'Pluie :', 'المطر:')}</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{today.precipitationSum.toFixed(1)} mm</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-muted/40 border">
                  <span className="text-muted-foreground">{copyFor(language, 'ET₀ Today:', 'ET₀ :', 'التبخر ET₀:')}</span>
                  <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{today.et0.toFixed(1)} mm</span>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    {copyFor(language, 'Heavy Rain (Pause Irrigation)', 'Pluie forte (Pause irrigation)', 'عتبة المطر الغزير (إيقاف الري)')}
                  </Label>
                  <Badge variant="outline" className="font-mono text-xs">
                    &ge; {draft.rainWarning} mm
                  </Badge>
                </div>
                <Slider
                  value={[draft.rainWarning]}
                  min={5}
                  max={35}
                  step={1}
                  onValueChange={([val]) => setDraft({ ...draft, rainWarning: val })}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                    {copyFor(language, 'Runoff & Leaching Hazard', 'Risque de ruissellement et lessivage', 'خطر الجريان السطحي وغسيل الأسمدة')}
                  </Label>
                  <Badge variant="outline" className="font-mono text-xs border-rose-500/40 text-rose-600 dark:text-rose-400">
                    &ge; {draft.rainDanger} mm
                  </Badge>
                </div>
                <Slider
                  value={[draft.rainDanger]}
                  min={15}
                  max={60}
                  step={1}
                  onValueChange={([val]) => setDraft({ ...draft, rainDanger: val })}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
                    {copyFor(language, 'High Crop Water Demand (ET₀)', 'Forte demande évaporative (ET₀)', 'عتبة الطلب المائي العالي (ET₀)')}
                  </Label>
                  <Badge variant="outline" className="font-mono text-xs border-cyan-500/40 text-cyan-600 dark:text-cyan-400">
                    &ge; {draft.et0Warning.toFixed(1)} mm/day
                  </Badge>
                </div>
                <Slider
                  value={[draft.et0Warning]}
                  min={3}
                  max={10}
                  step={0.5}
                  onValueChange={([val]) => setDraft({ ...draft, et0Warning: val })}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2 pt-3 border-t mt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {copyFor(language, 'Reset to Defaults', 'Réinitialiser', 'استعادة الافتراضي')}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              {copyFor(language, 'Cancel', 'Annuler', 'إلغاء')}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {savedSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  {copyFor(language, 'Saved', 'Enregistré', 'تم الحفظ')}
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {copyFor(language, 'Save Thresholds', 'Enregistrer les seuils', 'حفظ العتبات')}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
