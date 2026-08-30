'use client';

import { useState, useMemo } from 'react';
import { Home, Copy, RotateCcw } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
  type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

type Tab = 'heating' | 'ventilation' | 'co2';

const GLAZING_LABELS: Record<string, { en: string; ar: string; fr: string }> = {
  single_glass: { en: 'Single glass', ar: 'زجاج مفرد', fr: 'Verre simple' },
  double_poly: { en: 'Double poly', ar: 'بولي كربونات مزدوج', fr: 'Poly double' },
  twin_wall_pc: { en: 'Twin-wall polycarbonate', ar: 'بولي كربونات بجدارين', fr: 'Polycarbonate double paroi' },
  triple_wall: { en: 'Triple-wall polycarbonate', ar: 'بولي كربونات بثلاثة جدران', fr: 'Polycarbonate triple paroi' },
};

const glazingU: Record<string, number> = {
  single_glass: 6.5,
  double_poly: 3.5,
  twin_wall_pc: 2.5,
  triple_wall: 1.8,
};

const TITLE: TrilingualString = {
  en: 'Greenhouse Climate Designer',
  ar: 'مصمم مناخ الدفيئة',
  fr: 'Concepteur de climat de serre',
};

const DESC: TrilingualString = {
  en: 'Heating load · Ventilation rate · CO₂ enrichment sizing',
  ar: 'حمل التدفئة · معدل التهوية · تحجيم إثراء CO₂',
  fr: 'Charge de chauffage · Taux de ventilation · Dimensionnement CO₂',
};

const PILL_LABEL: TrilingualString = {
  en: 'Mode:',
  ar: 'الوضع:',
  fr: 'Mode :',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Heating uses U·A·ΔT with 15% infiltration. Ventilation is based on solar load and 5°C allowed rise. CO₂ assumes 0.5 ACH and a 1000 ppm target.',
  ar: 'تستخدم التدفئة U·A·ΔT مع 15% تسرب. تعتمد التهوية على الحمل الشمسي وارتفاع 5°م مسموح به. يفترض معدل CO₂ 0.5 ACH وهدفاً 1000 جزء بالمليون.',
  fr: 'Chauffage : U·A·ΔT avec 15% d\'infiltration. Ventilation basée sur la charge solaire et 5°C de hausse. CO₂ suppose 0.5 ACH et 1000 ppm cible.',
};

export function GreenhouseClimateDesigner() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [tab, setTab] = useState<Tab>('heating');
  const [area, setArea] = useState('500');
  const [height, setHeight] = useState('4');
  const [glazing, setGlazing] = useState('double_poly');
  const [insideT, setInsideT] = useState('18');
  const [outsideT, setOutsideT] = useState('-5');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const A = parseFloat(area), H = parseFloat(height);
    const Ti = parseFloat(insideT), To = parseFloat(outsideT);
    const U = glazingU[glazing];
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

  const pills: CalculatorPill[] = [
    { key: 'heating', label: tr('Heating', 'التدفئة', 'Chauffage'), emoji: '❄️' },
    { key: 'ventilation', label: tr('Ventilation', 'التهوية', 'Ventilation'), emoji: '💨' },
    { key: 'co2', label: 'CO₂', emoji: '⚡' },
  ];

  const handleReset = () => {
    setArea('500'); setHeight('4'); setGlazing('double_poly');
    setInsideT('18'); setOutsideT('-5'); setTab('heating');
    toast({ title: tr('Reset', 'إعادة', 'Réinitialiser') });
  };

  const handleCopy = () => {
    if (!result) return;
    const lines = [
      '=== GREENHOUSE CLIMATE DESIGNER ===',
      `Area: ${area} m² · Height: ${height} m · Glazing: ${GLAZING_LABELS[glazing].en} (U=${glazingU[glazing]})`,
      `Inside: ${insideT}°C · Outside: ${outsideT}°C`,
      '',
      '-- Heating --',
      `Heating load: ${result.Q_heating.toFixed(1)} kW (${result.Q_heating_btuh.toFixed(0)} BTU/hr)`,
      `Surface area: ${result.surfaceArea.toFixed(0)} m²`,
      `With 20% safety: ${(result.Q_heating * 1.2).toFixed(1)} kW`,
      '',
      '-- Ventilation --',
      `Rate: ${result.V_vent.toFixed(1)} m³/s (${result.cfm.toFixed(0)} CFM)`,
      `Solar load: ${(result.solarLoad / 1000).toFixed(1)} kW`,
      `Recommended fans: ${Math.ceil(result.cfm / 25000) * 25000} CFM total`,
      '',
      '-- CO2 --',
      `CO2 rate: ${result.co2Rate.toFixed(2)} kg/hr`,
      `Volume: ${(parseFloat(area) * parseFloat(height)).toFixed(0)} m³`,
    ];
    navigator.clipboard?.writeText(lines.join('\n'));
    setCopied(true);
    toast({ title: tr('Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <CalculatorShell
      icon={Home}
      title={TITLE}
      description={DESC}
      accent="teal"
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
      pills={pills}
      activePill={tab}
      onPillClick={(k) => setTab(k as Tab)}
      pillLabel={PILL_LABEL}
      protocolNote={PROTOCOL_NOTE}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <Home className="h-4 w-4 text-teal-600" />
              {tr('Greenhouse Parameters', 'مدخلات الدفيئة', 'Paramètres de la serre')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CalculatorShell.InputField
              label={tr('Greenhouse area (m²)', 'مساحة الدفيئة (م²)', 'Surface de la serre (m²)')}
              value={area}
              onChange={setArea}
              step="10"
              helper={tr('Floor footprint', 'البصمة الأرضية', 'Emprise au sol')}
            />
            <CalculatorShell.InputField
              label={tr('Wall height (m)', 'ارتفاع الجدار (م)', 'Hauteur du mur (m)')}
              value={height}
              onChange={setHeight}
              step="0.5"
              helper={tr('Eave height', 'ارتفاع الرف', 'Hauteur d\'égout')}
            />
            <CalculatorShell.InputField
              label={tr('Inside (°C)', 'الداخل (°م)', 'Intérieur (°C)')}
              value={insideT}
              onChange={setInsideT}
              helper={tr('Target setpoint', 'النقطة المرجعية', 'Consigne cible')}
            />
            <CalculatorShell.InputField
              label={tr('Outside (°C)', 'الخارج (°م)', 'Extérieur (°C)')}
              value={outsideT}
              onChange={setOutsideT}
              helper={tr('Design temp', 'درجة التصميم', 'Température de dimensionnement')}
            />
          </div>

          <div className="p-3 rounded-xl border bg-card space-y-1">
            <span className="text-xs font-bold text-foreground">
              {tr('Glazing type', 'نوع التغطية', 'Type de couverture')}
            </span>
            <select
              value={glazing}
              onChange={(e) => setGlazing(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm font-mono font-bold"
            >
              {Object.entries(glazingU).map(([k, u]) => {
                const lbl = GLAZING_LABELS[k];
                return (
                  <option key={k} value={k}>
                    {tr(lbl.en, lbl.ar, lbl.fr)} (U={u})
                  </option>
                );
              })}
            </select>
            <div className="text-[10px] text-muted-foreground">
              {tr('U-value in W/m²·K', 'قيمة U بوحدة W/m²·K', 'Valeur U en W/m²·K')}
            </div>
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        {result && (
          <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-base font-bold flex items-center gap-2">
                ✨ {tab === 'heating'
                  ? tr('Heating Results', 'نتائج التدفئة', 'Résultats chauffage')
                  : tab === 'ventilation'
                    ? tr('Ventilation Results', 'نتائج التهوية', 'Résultats ventilation')
                    : tr('CO₂ Results', 'نتائج CO₂', 'Résultats CO₂')}
              </span>
            </div>

            {tab === 'heating' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <CalculatorShell.MetricTile
                    label={tr('Heating load', 'حمل التدفئة', 'Charge de chauffage')}
                    value={result.Q_heating.toFixed(1)}
                    unit="kW"
                    helper={`${result.Q_heating_btuh.toFixed(0)} BTU/hr`}
                    color="rose"
                  />
                  <CalculatorShell.MetricTile
                    label={tr('Surface area', 'مساحة السطح', 'Surface enveloppe')}
                    value={result.surfaceArea.toFixed(0)}
                    unit="m²"
                    helper={tr('walls + roof', 'الجدران + السقف', 'murs + toit')}
                    color="teal"
                  />
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                  💡 {tr(
                    `Add 20% safety factor → ${(result.Q_heating * 1.2).toFixed(1)} kW heater. Thermal screen saves 30-50%.`,
                    `أضف معامل أمان 20% → مدفأة بقدرة ${(result.Q_heating * 1.2).toFixed(1)} ك.و. توفر الستارة الحرارية 30–50%.`,
                    `Ajoutez 20% de sécurité → radiateur de ${(result.Q_heating * 1.2).toFixed(1)} kW. L'écran thermique économise 30–50%.`,
                  )}
                </div>
              </>
            )}

            {tab === 'ventilation' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <CalculatorShell.MetricTile
                    label={tr('Ventilation rate', 'معدل التهوية', 'Taux de ventilation')}
                    value={result.V_vent.toFixed(1)}
                    unit="m³/s"
                    helper={`${result.cfm.toFixed(0)} CFM`}
                    color="teal"
                  />
                  <CalculatorShell.MetricTile
                    label={tr('Solar load', 'الحمل الشمسي', 'Charge solaire')}
                    value={(result.solarLoad / 1000).toFixed(1)}
                    unit="kW"
                    helper={tr('70% transmission', 'نفاذية 70%', 'Transmission 70%')}
                    color="amber"
                  />
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                  💡 {tr(
                    `Use 2-3 fans totaling ${Math.ceil(result.cfm / 25000) * 25000} CFM. Add 15% for static pressure. HAF fans for mixing.`,
                    `استخدم 2–3 مراوح بإجمالي ${Math.ceil(result.cfm / 25000) * 25000} CFM. أضف 15% للضغط الساكن. استخدم مراوح HAF للخلط.`,
                    `Utilisez 2–3 ventilateurs totalisant ${Math.ceil(result.cfm / 25000) * 25000} CFM. Ajoutez 15% pour la pression statique. Ventilateurs HAF pour mélange.`,
                  )}
                </div>
              </>
            )}

            {tab === 'co2' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <CalculatorShell.MetricTile
                    label={tr('CO₂ rate', 'معدل CO₂', 'Taux de CO₂')}
                    value={result.co2Rate.toFixed(2)}
                    unit="kg/hr"
                    helper={tr('at 1000 ppm', 'عند 1000 جزء بالمليون', 'à 1000 ppm')}
                    color="emerald"
                  />
                  <CalculatorShell.MetricTile
                    label={tr('Greenhouse volume', 'حجم الدفيئة', 'Volume de la serre')}
                    value={(parseFloat(area) * parseFloat(height)).toFixed(0)}
                    unit="m³"
                    helper={`${parseFloat(area)}×${parseFloat(height)}m`}
                    color="teal"
                  />
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                  💡 {tr(
                    '1 L propane = 1.5 kg CO₂. Stop enrichment when vents open >10%. Only during daylight hours.',
                    '1 لتر بروبان = 1.5 كغ CO₂. أوقف الإثراء عندما تفتح الفتحات أكثر من 10%. استخدمه خلال ساعات النهار فقط.',
                    '1 L de propane = 1,5 kg CO₂. Arrêtez l\'enrichissement quand les ouvrants dépassent 10%. Lumière du jour uniquement.',
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
