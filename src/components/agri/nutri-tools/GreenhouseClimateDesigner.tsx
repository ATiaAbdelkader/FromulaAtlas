'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Home, Sun, Wind, Snowflake, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';

type Tab = 'heating' | 'ventilation' | 'co2';
type UiLanguage = Parameters<typeof copyFor>[0];
const GLAZING_AR: Record<string, string> = { single_glass: 'زجاج مفرد', double_poly: 'بولي كربونات مزدوج', twin_wall_pc: 'بولي كربونات بجدارين', triple_wall: 'بولي كربونات بثلاثة جدران' };

export function GreenhouseClimateDesigner() {
  const { language } = useTranslation();
  const [tab, setTab] = useState<Tab>('heating');
  const [area, setArea] = useState('500');
  const [height, setHeight] = useState('4');
  const [glazing, setGlazing] = useState('double_poly');
  const [insideT, setInsideT] = useState('18');
  const [outsideT, setOutsideT] = useState('-5');

  const glazingU: Record<string, { u: number; label: string }> = {
    single_glass: { u: 6.5, label: 'Single glass' },
    double_poly: { u: 3.5, label: 'Double poly' },
    twin_wall_pc: { u: 2.5, label: 'Twin-wall polycarbonate' },
    triple_wall: { u: 1.8, label: 'Triple-wall polycarbonate' },
  };

  const result = useMemo(() => {
    const A = parseFloat(area), H = parseFloat(height);
    const Ti = parseFloat(insideT), To = parseFloat(outsideT);
    const U = glazingU[glazing].u;
    if (!Number.isFinite(A) || !Number.isFinite(Ti)) return null;
    const surfaceArea = A * 2 + 2 * Math.sqrt(A) * H * 0.5; // approx wall + roof
    const dT = Ti - To;
    const infiltration = 0.15;
    const Q_heating = U * surfaceArea * dT * (1 + infiltration) / 1000; // kW
    const Q_heating_btuh = Q_heating * 3412;
    // Ventilation
    const solarLoad = A * 600 * 0.7; // W on clear day
    const dT_allowed = 5;
    const V_vent = solarLoad / (1.2 * 1005 * dT_allowed); // m³/s
    const cfm = V_vent * 2119;
    // CO2
    const volume = A * H;
    const co2Rate = (1000 - 400) * volume * 1.2 * 0.5 / (1e6); // kg/hr at 0.5 ACH
    return { Q_heating, Q_heating_btuh, V_vent, cfm, co2Rate, surfaceArea, solarLoad };
  }, [area, height, glazing, insideT, outsideT]);

  return (
    <Card className="overflow-hidden border-emerald-100 shadow-sm dark:border-emerald-900/60">
      <CardHeader className="border-b border-border/60 bg-emerald-50/50 pb-4 dark:bg-emerald-950/10">
        <CardTitle className="flex items-center gap-2 text-base"><span className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"><Home className="h-4 w-4" /></span> {copyFor(language, 'Greenhouse Climate Designer', 'مصمم مناخ الدفيئة')}
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">{copyFor(language, 'Heating load · Ventilation rate · CO₂ enrichment sizing', 'حمل التدفئة · معدل التهوية · تحجيم إثراء CO₂')}</p>
        <div className="mt-3 grid grid-cols-1 gap-1 rounded-xl bg-emerald-100/70 p-1 dark:bg-emerald-950/30 sm:grid-cols-3">
          <TabBtn active={tab === 'heating'} onClick={() => setTab('heating')} icon={Snowflake} label={copyFor(language, 'Heating', 'التدفئة')} />
          <TabBtn active={tab === 'ventilation'} onClick={() => setTab('ventilation')} icon={Wind} label={copyFor(language, 'Ventilation', 'التهوية')} />
          <TabBtn active={tab === 'co2'} onClick={() => setTab('co2')} icon={Zap} label="CO₂" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/30 p-3 sm:grid-cols-2 dark:border-emerald-900/60 dark:bg-emerald-950/10">
          <div>
            <Label className="text-[11px] font-medium">{copyFor(language, 'Greenhouse area (m²)', 'مساحة الدفيئة (م²)')}</Label>
            <Input value={area} onChange={e => setArea(e.target.value)} type="number" step="10" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-[11px] font-medium">{copyFor(language, 'Wall height (m)', 'ارتفاع الجدار (م)')}</Label>
            <Input value={height} onChange={e => setHeight(e.target.value)} type="number" step="0.5" className="mt-1 h-10 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/30 p-3 sm:grid-cols-2 dark:border-emerald-900/60 dark:bg-emerald-950/10">
          <div>
            <Label className="text-[11px] font-medium">{copyFor(language, 'Glazing type', 'نوع التغطية')}</Label>
            <select value={glazing} onChange={e => setGlazing(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              {Object.entries(glazingU).map(([k, v]) => <option key={k} value={k}>{copyFor(language, v.label, GLAZING_AR[k])} (U={v.u})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-[11px] font-medium">{copyFor(language, 'Inside (°C)', 'الداخل (°م)')}</Label>
              <Input value={insideT} onChange={e => setInsideT(e.target.value)} type="number" className="mt-1 h-10 text-sm" />
            </div>
            <div>
              <Label className="text-[11px] font-medium">{copyFor(language, 'Outside (°C)', 'الخارج (°م)')}</Label>
              <Input value={outsideT} onChange={e => setOutsideT(e.target.value)} type="number" className="mt-1 h-10 text-sm" />
            </div>
          </div>
        </div>

        {result && (
          <div className="space-y-2">
            {tab === 'heating' && (
              <>
                <div className="grid grid-cols-1 gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/30 p-3 sm:grid-cols-2 dark:border-emerald-900/60 dark:bg-emerald-950/10">
                  <Metric label={copyFor(language, 'Heating load', 'حمل التدفئة')} value={`${result.Q_heating.toFixed(1)} kW`} sub={`${result.Q_heating_btuh.toFixed(0)} BTU/hr`} color="rose" />
                  <Metric label={copyFor(language, 'Surface area', 'مساحة السطح')} value={`${result.surfaceArea.toFixed(0)} m²`} sub={copyFor(language, 'walls + roof', 'الجدران + السقف')} color="violet" />
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                  💡 {copyFor(language, `Add 20% safety factor → ${(result.Q_heating * 1.2).toFixed(1)} kW heater. Thermal screen saves 30-50%.`, `أضف معامل أمان 20% → مدفأة بقدرة ${(result.Q_heating * 1.2).toFixed(1)} ك.و. توفر الستارة الحرارية 30–50%.`)}
                </div>
              </>
            )}
            {tab === 'ventilation' && (
              <>
                <div className="grid grid-cols-1 gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/30 p-3 sm:grid-cols-2 dark:border-emerald-900/60 dark:bg-emerald-950/10">
                  <Metric label={copyFor(language, 'Ventilation rate', 'معدل التهوية')} value={`${result.V_vent.toFixed(1)} m³/s`} sub={`${result.cfm.toFixed(0)} CFM`} color="cyan" />
                  <Metric label={copyFor(language, 'Solar load', 'الحمل الشمسي')} value={`${(result.solarLoad / 1000).toFixed(1)} kW`} sub={copyFor(language, '70% transmission', 'نفاذية 70%')} color="amber" />
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                  💡 {copyFor(language, `Use 2-3 fans totaling ${Math.ceil(result.cfm / 25000) * 25000} CFM. Add 15% for static pressure. HAF fans for mixing.`, `استخدم 2–3 مراوح بإجمالي ${Math.ceil(result.cfm / 25000) * 25000} CFM. أضف 15% للضغط الساكن. استخدم مراوح HAF للخلط.`)}
                </div>
              </>
            )}
            {tab === 'co2' && (
              <>
                <div className="grid grid-cols-1 gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/30 p-3 sm:grid-cols-2 dark:border-emerald-900/60 dark:bg-emerald-950/10">
                  <Metric label={copyFor(language, 'CO₂ rate', 'معدل CO₂')} value={`${result.co2Rate.toFixed(2)} kg/hr`} sub={copyFor(language, 'at 1000 ppm', 'عند 1000 جزء بالمليون')} color="emerald" />
                  <Metric label={copyFor(language, 'Greenhouse volume', 'حجم الدفيئة')} value={`${(parseFloat(area) * parseFloat(height)).toFixed(0)} m³`} sub={`${parseFloat(area)}×${parseFloat(height)}m`} color="violet" />
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                  💡 {copyFor(language, '1 L propane = 1.5 kg CO₂. Stop enrichment when vents open >10%. Only during daylight hours.', '1 لتر بروبان = 1.5 كغ CO₂. أوقف الإثراء عندما تفتح الفتحات أكثر من 10%. استخدمه خلال ساعات النهار فقط.')}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const ACCENT: Record<string, string> = {
  cyan: 'border-cyan-200 dark:border-cyan-900 bg-cyan-50/40 dark:bg-cyan-950/20',
  emerald: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20',
  amber: 'border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20',
  violet: 'border-violet-200 dark:border-violet-900 bg-violet-50/40 dark:bg-violet-950/20',
  rose: 'border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20',
};

function Metric({ label, value, sub, color }: { label: string; value: string; sub?: string; color: keyof typeof ACCENT }) {
  return (
    <div className={`rounded-xl border p-3 shadow-sm ${ACCENT[color]}`}>
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-semibold leading-tight">{value}</div>
      {sub && <div className="text-[9px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Sun; label: string }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${active ? 'bg-background text-emerald-700 shadow-sm dark:text-emerald-300' : 'text-muted-foreground hover:text-foreground'}`}>
      <Icon className="h-4 w-4" /><span>{label}</span>
    </button>
  );
}
