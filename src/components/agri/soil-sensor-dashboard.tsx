'use client';

/**
 * Soil Sensor Dashboard — adapted from AgroAI's AgroSensor module.
 *
 * Shows real-time (or simulated) soil sensor readings with alert
 * thresholds. Supports both:
 *   1. Simulated readings (for demo/onboarding — no hardware needed)
 *   2. Real readings (when a Modbus gateway is available — just replace
 *      the simulateSensorReading() call with a fetch to /api/sensor/:id)
 *
 * Trilingual (EN/FR/AR).
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw, AlertTriangle, CheckCircle2, Radio } from 'lucide-react';
import { useTranslation, copyFor } from '@/lib/language-store';
import {
  simulateSensorReading, checkSensorAlerts, saveSensorReading,
  getSensorHistory, SENSOR_THRESHOLDS,
  type SensorReading, type SensorAlert,
} from '@/lib/soil-sensor-model';
import { SOIL_PROFILES } from '@/lib/soil-profiles';
import { cn } from '@/lib/utils';

export function SoilSensorDashboard() {
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  const [reading, setReading] = useState<SensorReading | null>(null);
  const [alerts, setAlerts] = useState<SensorAlert[]>([]);
  const [soilTypeId, setSoilTypeId] = useState('alluvial');
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [isSimulated, setIsSimulated] = useState(true);

  const takeReading = useCallback(() => {
    const newReading = simulateSensorReading(soilTypeId);
    setReading(newReading);
    setAlerts(checkSensorAlerts(newReading));
    saveSensorReading(newReading);
    setHistory(getSensorHistory(10));
  }, [soilTypeId]);

  useEffect(() => {
    takeReading();
  }, [takeReading]);

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header + controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Radio className="h-4 w-4 text-cyan-600" />
              {tr('Soil Sensor Dashboard', 'لوحة مستشعر التربة', 'Tableau des capteurs du sol')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[9px] gap-1">
                <Activity className={cn('h-2.5 w-2.5', isSimulated ? 'text-amber-500 animate-pulse' : 'text-emerald-500')} />
                {isSimulated ? tr('Simulated', 'محاكاة', 'Simulé') : tr('Live', 'مباشر', 'En direct')}
              </Badge>
              <Button variant="outline" size="sm" onClick={takeReading} className="h-8 gap-1.5 text-xs">
                <RefreshCw className="h-3 w-3" />{tr('Refresh', 'تحديث', 'Actualiser')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Soil type selector */}
          <div className="flex flex-wrap gap-1">
            {SOIL_PROFILES.map(s => (
              <button
                key={s.id}
                onClick={() => setSoilTypeId(s.id)}
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full border transition-all flex items-center gap-1',
                  soilTypeId === s.id ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-card border-border hover:border-cyan-400'
                )}
              >
                <span>{s.emoji}</span>
                {language === 'ar' ? s.nameAr : language === 'fr' ? s.nameFr : s.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alert banner */}
      {alerts.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              {alerts.length} {tr('alerts', 'تنبيهات', 'alertes')}
            </span>
          </div>
          <div className="space-y-1">
            {alerts.map((a, i) => (
              <div key={i} className={cn(
                'text-[11px] flex items-start gap-1.5',
                a.severity === 'critical' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'
              )}>
                <span>{a.severity === 'critical' ? '🔴' : '🟡'}</span>
                <span>{language === 'ar' ? a.messageAr : a.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sensor readings grid */}
      {reading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <SensorCard label={tr('Nitrogen', 'النيتروجين', 'Azote')} value={reading.nitrogen} unit="mg/kg" threshold={SENSOR_THRESHOLDS.nitrogen} icon="🌿" />
          <SensorCard label={tr('Phosphorus', 'الفوسفور', 'Phosphore')} value={reading.phosphorus} unit="mg/kg" threshold={SENSOR_THRESHOLDS.phosphorus} icon="🟣" />
          <SensorCard label={tr('Potassium', 'البوتاسيوم', 'Potassium')} value={reading.potassium} unit="mg/kg" threshold={SENSOR_THRESHOLDS.potassium} icon="🟡" />
          <SensorCard label="pH" value={reading.ph} unit="" threshold={SENSOR_THRESHOLDS.ph} icon="⚖️" />
          <SensorCard label={tr('Temp', 'الحرارة', 'Temp')} value={reading.temperature} unit="°C" threshold={SENSOR_THRESHOLDS.temperature} icon="🌡️" />
          <SensorCard label={tr('Moisture', 'الرطوبة', 'Humidité')} value={reading.moisture} unit="%" threshold={SENSOR_THRESHOLDS.moisture} icon="💧" />
          <SensorCard label="EC" value={reading.ec} unit="μS/cm" threshold={SENSOR_THRESHOLDS.ec} icon="⚡" />
          <Card className="p-2 flex flex-col items-center justify-center">
            <div className="text-lg">{isSimulated ? '📡' : '🔌'}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {isSimulated ? tr('Demo mode', 'وضع العرض', 'Mode démo') : tr('Connected', 'متصل', 'Connecté')}
            </div>
          </Card>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-cyan-600" />
              {tr('Recent readings', 'قراءات حديثة', 'Lectures récentes')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {history.slice(0, 8).map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] py-1 border-b border-border/30 last:border-0">
                  <span className="text-muted-foreground font-mono">{new Date(h.timestamp).toLocaleTimeString(language === 'ar' ? 'ar' : language === 'fr' ? 'fr-FR' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-emerald-600">N:{h.nitrogen.toFixed(0)}</span>
                  <span className="text-violet-600">P:{h.phosphorus.toFixed(0)}</span>
                  <span className="text-amber-600">K:{h.potassium.toFixed(0)}</span>
                  <span className="text-cyan-600">pH:{h.ph.toFixed(1)}</span>
                  <span className="text-muted-foreground">💧{h.moisture.toFixed(0)}%</span>
                  {checkSensorAlerts(h).length > 0 && <AlertTriangle className="h-2.5 w-2.5 text-amber-500" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration note */}
      <div className="rounded-lg border border-dashed border-cyan-300 bg-cyan-50/30 dark:bg-cyan-950/10 p-3 text-[10px] text-muted-foreground leading-relaxed">
        <strong>{tr('Integration:', 'التكامل:', 'Intégration:')}</strong>{' '}
        {tr(
          'This dashboard currently shows simulated readings based on soil type. To connect real Modbus sensors, replace the simulateSensorReading() call in src/lib/soil-sensor-model.ts with a fetch to your sensor gateway API.',
          'تعرض هذه اللوحة حالياً قراءات محاكاة بناءً على نوع التربة. لربط مستشعرات Modbus حقيقية، استبدل دالة simulateSensorReading() في src/lib/soil-sensor-model.ts بطلب fetch إلى بوابة المستشعرات.',
          'Ce tableau affiche actuellement des lectures simulées basées sur le type de sol. Pour connecter des capteurs Modbus réels, remplacez la fonction simulateSensorReading() dans src/lib/soil-sensor-model.ts par un appel fetch à votre passerelle de capteurs.'
        )}
      </div>
    </div>
  );
}

function SensorCard({ label, value, unit, threshold, icon }: {
  label: string; value: number; unit: string;
  threshold: { min: number; max: number }; icon: string;
}) {
  const isLow = value < threshold.min;
  const isHigh = value > threshold.max;
  const isOk = !isLow && !isHigh;
  const color = isLow ? '#dc2626' : isHigh ? '#ea580c' : '#16a34a';
  const bgColor = isLow ? '#fee2e2' : isHigh ? '#ffedd5' : '#dcfce7';

  return (
    <Card className="p-2 flex flex-col items-center text-center" style={{ borderColor: isOk ? undefined : color }}>
      <div className="text-lg">{icon}</div>
      <div className="text-sm font-bold font-mono mt-0.5" style={{ color }}>{value.toFixed(value < 10 ? 1 : 0)}</div>
      <div className="text-[9px] text-muted-foreground">{unit}</div>
      <div className="text-[9px] text-muted-foreground mt-0.5">{label}</div>
      {isOk && <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500 mt-0.5" />}
      {(isLow || isHigh) && <AlertTriangle className="h-2.5 w-2.5 mt-0.5" style={{ color }} />}
    </Card>
  );
}
