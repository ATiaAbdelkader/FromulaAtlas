'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Droplets,
  FlaskConical,
  Scale,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Info,
  Layers,
  Beaker,
  Share2,
} from 'lucide-react';
import {
  ACIDS,
  EQ_CACO3,
  PPM_CACO3_PER_PPM_CA,
  PPM_CACO3_PER_PPM_MG,
  PPM_PER_DH,
  PPM_PER_EH,
  PPM_PER_FH,
  hardnessClassByPpm,
} from '@/lib/nutri-tools-data';
import { SendToMenu } from './SendToMenu';
import { sendToBridge } from '@/lib/tool-bridge';
import { useTranslation, copyFor } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

const TITLE: TrilingualString = {
  en: 'Water Hardness Diagnostic & Acid Dosing Engine',
  ar: 'تشخيص عسورة المياه وحاسبة معادلة القلوية والأحماض',
  fr: 'Diagnostic de Dureté de l\'Eau & Neutralisation Acide',
};

const DESC: TrilingualString = {
  en: 'Accurately calculate Total Hardness (CaCO₃) from Ca²⁺ and Mg²⁺ lab assays, convert across international hardness scales, compute precise acid injections for bicarbonate neutralization, and prevent drip emitter scaling with Langelier saturation modeling.',
  ar: 'حساب العسورة الكلية (CaCO₃) بدقة من تحاليل الكالسيوم والماغنيسيوم، والتحويل بين درجات العسورة الدولية، وحساب جرعات الأحماض لمعادلة البيكربونات مع نمذجة مؤشر لانجلييه لمنع انسداد شبكات الري.',
  fr: 'Calculez la dureté totale (CaCO₃), convertissez en degrés français et allemands, et dosez précisément les acides pour neutraliser les bicarbonates et éviter le colmatage.',
};

interface WaterSamplePreset {
  id: string;
  name: string;
  name_ar: string;
  name_fr: string;
  desc: string;
  ca: number;
  mg: number;
  hco3: number;
  co3: number;
  ph: number;
  ec: number;
}

const HARDNESS_PRESETS: WaterSamplePreset[] = [
  {
    id: 'deep-well-calc',
    name: 'High Calcareous Deep Well (Mitidja / Mediterranean)',
    name_ar: 'بئر كلسي عميق عالي العسورة (سهل متيجة)',
    name_fr: 'Puits profond très calcaire (Mitidja)',
    desc: 'Very hard groundwater with elevated calcium & bicarbonate requiring acid correction for drip lines.',
    ca: 140,
    mg: 35,
    hco3: 4.8,
    co3: 0,
    ph: 7.8,
    ec: 1.35,
  },
  {
    id: 'biskra-saline-gypsum',
    name: 'Biskra / Saharan Gypsiferous Borehole',
    name_ar: 'مياه جوفية كبريتية جبسية (بسكرة / وادي ريغ)',
    name_fr: 'Forage saharien gypseux (Biskra)',
    desc: 'Extreme hardness dominated by calcium sulfate and magnesium, severe clogging risk.',
    ca: 380,
    mg: 145,
    hco3: 2.6,
    co3: 0,
    ph: 7.5,
    ec: 4.6,
  },
  {
    id: 'surface-dam',
    name: 'Surface Dam Reservoir (Moderate Soft)',
    name_ar: 'مياه سد سطحي (عسورة معتدلة إلى خفيفة)',
    name_fr: 'Eau de barrage de surface',
    desc: 'Low to moderate hardness with balanced calcium/magnesium and low risk of precipitation.',
    ca: 38,
    mg: 12,
    hco3: 1.8,
    co3: 0,
    ph: 7.2,
    ec: 0.45,
  },
  {
    id: 'ro-permeate',
    name: 'Desalinated / RO Permeate Water',
    name_ar: 'مياه محلاة من محطة التناضح العكسي (RO)',
    name_fr: 'Eau osmosée / Perméat d’osmose inverse',
    desc: 'Ultra-soft water lacking mineral buffers; aggressive and corrosive without remineralization.',
    ca: 4,
    mg: 1.5,
    hco3: 0.3,
    co3: 0,
    ph: 6.2,
    ec: 0.12,
  },
];

export function WaterHardnessDiagnostic() {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const isFr = language === 'fr';
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  // Active Tab: Unit Converter | Ca+Mg Lab | Acid Neutralization | Clogging Diagnostics
  const [activeTab, setActiveTab] = useState<'calc' | 'acid' | 'converter' | 'clogging'>('calc');
  const [activePresetId, setActivePresetId] = useState<string>('deep-well-calc');
  const [copied, setCopied] = useState<boolean>(false);

  // Section 1: Units
  const [ppm, setPpm] = useState('250');
  const [meq, setMeq] = useState('5.00');
  const [dh, setDh] = useState('14.00');
  const [eh, setEh] = useState('17.50');
  const [fh, setFh] = useState('25.00');

  const fromPpm = (v: string) => {
    setPpm(v);
    const n = parseFloat(v.replace(',', '.')) || 0;
    setMeq(n ? (n / EQ_CACO3).toFixed(2) : '');
    setDh(n ? (n / PPM_PER_DH).toFixed(2) : '');
    setEh(n ? (n / PPM_PER_EH).toFixed(2) : '');
    setFh(n ? (n / PPM_PER_FH).toFixed(2) : '');
  };
  const fromMeq = (v: string) => {
    setMeq(v);
    const n = parseFloat(v.replace(',', '.')) || 0;
    const p = n * EQ_CACO3;
    setPpm(p ? p.toFixed(2) : '');
    setDh(p ? (p / PPM_PER_DH).toFixed(2) : '');
    setEh(p ? (p / PPM_PER_EH).toFixed(2) : '');
    setFh(p ? (p / PPM_PER_FH).toFixed(2) : '');
  };
  const fromDh = (v: string) => {
    setDh(v);
    const n = parseFloat(v.replace(',', '.')) || 0;
    const p = n * PPM_PER_DH;
    setPpm(p ? p.toFixed(2) : '');
    setMeq(p ? (p / EQ_CACO3).toFixed(2) : '');
    setEh(p ? (p / PPM_PER_EH).toFixed(2) : '');
    setFh(p ? (p / PPM_PER_FH).toFixed(2) : '');
  };
  const fromEh = (v: string) => {
    setEh(v);
    const n = parseFloat(v.replace(',', '.')) || 0;
    const p = n * PPM_PER_EH;
    setPpm(p ? p.toFixed(2) : '');
    setMeq(p ? (p / EQ_CACO3).toFixed(2) : '');
    setDh(p ? (p / PPM_PER_DH).toFixed(2) : '');
    setFh(p ? (p / PPM_PER_FH).toFixed(2) : '');
  };
  const fromFh = (v: string) => {
    setFh(v);
    const n = parseFloat(v.replace(',', '.')) || 0;
    const p = n * PPM_PER_FH;
    setPpm(p ? p.toFixed(2) : '');
    setMeq(p ? (p / EQ_CACO3).toFixed(2) : '');
    setDh(p ? (p / PPM_PER_DH).toFixed(2) : '');
    setEh(p ? (p / PPM_PER_EH).toFixed(2) : '');
  };

  const ppmNum = parseFloat(ppm) || 0;
  const unitCls = hardnessClassByPpm(ppmNum);

  // Section 2: Ca + Mg Lab Values
  const [caVal, setCaVal] = useState('140');
  const [caUnit, setCaUnit] = useState<'ppm' | 'meq'>('ppm');
  const [mgVal, setMgVal] = useState('35');
  const [mgUnit, setMgUnit] = useState<'ppm' | 'meq'>('ppm');
  const [waterPh, setWaterPh] = useState('7.8');
  const [waterEc, setWaterEc] = useState('1.35');

  // Hardness calculation
  const caPpm = caUnit === 'meq' ? (parseFloat(caVal) || 0) * 20.04 : (parseFloat(caVal) || 0);
  const mgPpm = mgUnit === 'meq' ? (parseFloat(mgVal) || 0) * 12.15 : (parseFloat(mgVal) || 0);
  const caMeq = caPpm / 20.04;
  const mgMeq = mgPpm / 12.15;

  const partCaCaCO3 = caPpm * PPM_CACO3_PER_PPM_CA;
  const partMgCaCO3 = mgPpm * PPM_CACO3_PER_PPM_MG;
  const totalHardnessPpm = partCaCaCO3 + partMgCaCO3;
  const totalHardnessMeq = totalHardnessPpm / EQ_CACO3;
  const totalHardnessDh = totalHardnessPpm / PPM_PER_DH;
  const totalHardnessFh = totalHardnessPpm / PPM_PER_FH;
  const labCls = hardnessClassByPpm(totalHardnessPpm);

  // Section 3: Acid neutralization
  const [hco3, setHco3] = useState('4.8');
  const [co3, setCo3] = useState('0');
  const [residual, setResidual] = useState('0.5'); // Maintain 0.5 meq/L buffer to avoid pH plunge
  const [waterVol, setWaterVol] = useState('1000');
  const [volUnit, setVolUnit] = useState<'L' | 'm3'>('m3');
  const [acidId, setAcidId] = useState(ACIDS[0].id); // Default: Nitric 65%

  const hco3N = parseFloat(hco3) || 0;
  const co3N = parseFloat(co3) || 0;
  const residualN = parseFloat(residual) || 0;
  const volN = parseFloat(waterVol) || 0;
  const volM3 = volUnit === 'm3' ? volN : volN / 1000;
  const acid = ACIDS.find((a) => a.id === acidId) || ACIDS[0];

  const needMeq = Math.max(0, hco3N + co3N - residualN);
  const mlPerM3 = acid.meqPerMl > 0 ? (needMeq * 1000) / acid.meqPerMl : 0;
  const totalMl = mlPerM3 * volM3;
  const totalL = totalMl / 1000;
  const kgPerM3Water = (mlPerM3 / 1000) * acid.densityKgL;
  const kgTotal = totalL * acid.densityKgL;

  // Added Nutrients through acid:
  // e.g., Nitric Acid supplies NO3-N, Phosphoric supplies P, Sulfuric supplies S
  const suppliedNutrient = useMemo(() => {
    if (acid.id.includes('nitric')) {
      // 1 meq HNO3 = 14 mg/L N (NO3-N)
      const ppmN = needMeq * 14.0;
      return { element: 'N-NO₃', ppm: ppmN, label: `${ppmN.toFixed(1)} ppm N-NO₃` };
    } else if (acid.id.includes('phosphoric')) {
      // 1 meq H3PO4 = 31 mg/L P (or 71 ppm P2O5)
      const ppmP = needMeq * 31.0;
      return { element: 'P', ppm: ppmP, label: `${ppmP.toFixed(1)} ppm P (${(ppmP * 2.29).toFixed(1)} ppm P₂O₅)` };
    } else if (acid.id.includes('sulfuric')) {
      // 1 meq H2SO4 = 16 mg/L S (or 48 ppm SO4)
      const ppmS = needMeq * 16.03;
      return { element: 'S', ppm: ppmS, label: `${ppmS.toFixed(1)} ppm S (${(ppmS * 3.0).toFixed(1)} ppm SO₄)` };
    }
    return null;
  }, [acid, needMeq]);

  // Langelier Saturation Index (LSI) Simplified Estimation
  const lsiEstimate = useMemo(() => {
    const phVal = parseFloat(waterPh) || 7.5;
    const tdsVal = (parseFloat(waterEc) || 1.0) * 640;
    // LSI = pH - pHs
    // pHs = (9.3 + A + B) - (C + D)
    // A = (log10(TDS) - 1) / 10
    // B = -13.12 * log10(T_K) + 34.55 (at 20C ~ 2.0)
    // C = log10(Ca as CaCO3) - 0.4
    // D = log10(Alkalinity as CaCO3)
    const alkPpm = (hco3N + co3N) * 50.04;
    if (caPpm <= 0 || alkPpm <= 0) return { lsi: 0, status: 'Unknown', color: '#64748b' };

    const A = (Math.log10(Math.max(10, tdsVal)) - 1) / 10;
    const B = 2.0; // 20°C
    const C = Math.log10(Math.max(1, partCaCaCO3)) - 0.4;
    const D = Math.log10(Math.max(1, alkPpm));
    const pHs = 9.3 + A + B - (C + D);
    const lsi = phVal - pHs;

    if (lsi > 0.5) {
      return {
        lsi,
        status: tr('Severe Scale Forming (Clogging Hazard)', 'ترسيب كلسي شديد وخطر انسداد القطارات', 'Fort entartrant (Risque colmatage)'),
        color: '#ef4444',
      };
    } else if (lsi > 0.0) {
      return {
        lsi,
        status: tr('Slight Scale Tendency (Safe for irrigation)', 'ميل طفيف للترسيب (آمن مع تنظيف دوري)', 'Légèrement entartrant'),
        color: '#f59e0b',
      };
    } else if (lsi > -0.5) {
      return {
        lsi,
        status: tr('Balanced / Neutral Equilibrium', 'مياه متوازنة ومستقرة كيميائياً', 'Équilibrée et stable'),
        color: '#10b981',
      };
    } else {
      return {
        lsi,
        status: tr('Corrosive / Aggressive (Attacks metal fittings)', 'مياه أكالة ومهاجمة للمعادن والأنابيب', 'Corrosive / Agressive'),
        color: '#3b82f6',
      };
    }
  }, [waterPh, waterEc, caPpm, hco3N, co3N, partCaCaCO3, tr]);

  const applyPreset = (p: WaterSamplePreset) => {
    setActivePresetId(p.id);
    setCaVal(String(p.ca));
    setCaUnit('ppm');
    setMgVal(String(p.mg));
    setMgUnit('ppm');
    setHco3(String(p.hco3));
    setCo3(String(p.co3));
    setWaterPh(String(p.ph));
    setWaterEc(String(p.ec));
    toast({
      title: tr(`Preset Applied: ${p.name}`, `تم تطبيق قالب: ${p.name_ar}`, `Modèle appliqué : ${p.name_fr}`),
      description: `${p.desc} (Ca: ${p.ca} ppm, Mg: ${p.mg} ppm, HCO₃: ${p.hco3} meq/L)`,
    });
  };

  const handleCopyReport = () => {
    const text = `
=== WATER HARDNESS & ACID DOSING DIAGNOSTIC REPORT ===
Sample: ${activePresetId}
Total Hardness: ${totalHardnessPpm.toFixed(1)} ppm CaCO3 (${totalHardnessDh.toFixed(1)} °dH | ${totalHardnessFh.toFixed(1)} °fH)
Classification: ${labCls.label}
Calcium (Ca2+): ${caPpm.toFixed(1)} ppm (${caMeq.toFixed(2)} meq/L) -> ${partCaCaCO3.toFixed(1)} ppm CaCO3 (${((partCaCaCO3 / (totalHardnessPpm || 1)) * 100).toFixed(1)}%)
Magnesium (Mg2+): ${mgPpm.toFixed(1)} ppm (${mgMeq.toFixed(2)} meq/L) -> ${partMgCaCO3.toFixed(1)} ppm CaCO3 (${((partMgCaCO3 / (totalHardnessPpm || 1)) * 100).toFixed(1)}%)

ACID NEUTRALIZATION RECIPE:
Bicarbonate (HCO3-): ${hco3N.toFixed(2)} meq/L | Carbonate (CO32-): ${co3N.toFixed(2)} meq/L
Residual Target Buffer: ${residualN.toFixed(2)} meq/L
Net Neutralization Required: ${needMeq.toFixed(2)} meq/L
Selected Acid: ${acid.name} (${acid.formula ?? '—'})
Acid Rate: ${mlPerM3.toFixed(1)} mL / m3 water (${kgPerM3Water.toFixed(3)} kg/m3)
Total Acid for ${volM3.toFixed(1)} m3: ${totalL.toFixed(2)} Liters (${kgTotal.toFixed(2)} kg)
${suppliedNutrient ? `Fertilizer Contribution: ${suppliedNutrient.label}` : ''}

SCALING & EMITTER CLOGGING:
Langelier Saturation Index (LSI): ${lsiEstimate.lsi.toFixed(2)} (${lsiEstimate.status})
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: tr('Report Copied!', 'تم نسخ التقرير التشخيصي!', 'Rapport copié !'),
      description: tr('Hardness breakdown and acid recipe copied to clipboard.', 'تم نسخ تفاصيل العسورة وجرعات الحمض إلى الحافظة.', 'Détails copiés.'),
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendToHydro = () => {
    sendToBridge({
      targetToolId: 'hydro-solution',
      sourceToolId: 'Water Hardness Diagnostic',
      values: {
        hco3: Number(hco3N.toFixed(2)),
        ca: Number(caMeq.toFixed(2)),
        mg: Number(mgMeq.toFixed(2)),
      },
    });
    toast({
      title: tr('Sent to Hydroponic Solution Designer', 'تم إرسال البيانات إلى مصمم المحاليل المغذية', 'Envoyé au Concepteur Hydroponique'),
      description: `${tr('Exported HCO₃⁻:', 'البيكربونات المصدرة:', 'HCO₃⁻ exporté :')} ${hco3N.toFixed(2)} meq/L`,
    });
  };

  return (
    <CalculatorShell
      icon={Droplets}
      title={TITLE}
      description={DESC}
      badge="LSI & Carbonate"
      accent="sky"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Report', ar: 'نسخ التقرير', fr: 'Copier' },
          onClick: handleCopyReport,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: Share2,
          label: { en: 'Send to Hydro', ar: 'إرسال للمحلول المغذي', fr: 'Vers Hydroponie' },
          onClick: handleSendToHydro,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: () => applyPreset(HARDNESS_PRESETS[0]),
        },
      ]}
    >
      {/* Presets Pill Bar */}
      <div className="lg:col-span-12 flex flex-wrap items-center gap-2 p-3.5 rounded-2xl border bg-card shadow-xs">
        <span className="text-xs text-muted-foreground font-medium me-1">
          {tr('Quick Water Presets:', 'نماذج مياه جاهزة:', 'Échantillons types :')}
        </span>
        {HARDNESS_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => applyPreset(p)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activePresetId === p.id
                ? 'bg-sky-500 text-white shadow-md font-bold'
                : 'bg-muted hover:bg-muted/70 text-foreground'
            }`}
          >
            {isAr ? p.name_ar : isFr ? p.name_fr : p.name}
          </button>
        ))}
      </div>

      {/* Vital Metric Indicators */}
      <div className="lg:col-span-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>{tr('Total Hardness (TH)', 'العسورة الكلية (TH)', 'Dureté Totale (TH)')}</span>
            <Scale className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-black font-mono" style={{ color: labCls.color }}>
            {totalHardnessPpm.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">ppm</span>
          </div>
          <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: labCls.color }} />
            {labCls.label} ({totalHardnessFh.toFixed(1)} °fH / {totalHardnessDh.toFixed(1)} °dH)
          </div>
        </div>

        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>{tr('Acid Dose Rate', 'معدل حقن الحمض', 'Taux d’injection acide')}</span>
            <FlaskConical className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
            {mlPerM3.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">mL/m³</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            {kgPerM3Water.toFixed(3)} kg acid / m³ ({acid.name})
          </div>
        </div>

        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>{tr('Bicarbonate Neutralized', 'البيكربونات المعالجة', 'HCO₃⁻ à neutraliser')}</span>
            <Zap className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">
            {needMeq.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">meq/L</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Target buffer: {residualN.toFixed(2)} meq/L ({(residualN * 61).toFixed(0)} ppm)
          </div>
        </div>

        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>{tr('Langelier Index (LSI)', 'مؤشر لانجلييه (LSI)', 'Indice de Langelier')}</span>
            <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
          </div>
          <div className="text-2xl font-black font-mono" style={{ color: lsiEstimate.color }}>
            {lsiEstimate.lsi > 0 ? `+${lsiEstimate.lsi.toFixed(2)}` : lsiEstimate.lsi.toFixed(2)}
          </div>
          <div className="text-[10px] truncate font-semibold" style={{ color: lsiEstimate.color }}>
            {lsiEstimate.status}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="lg:col-span-12 w-full">
        <TabsList className="grid grid-cols-4 w-full h-11 p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="calc" className="rounded-lg text-xs font-bold gap-1.5">
            <Scale className="h-3.5 w-3.5 text-blue-600" />
            <span>{tr('Hardness & Speciation', 'حساب العسورة والكاتيونات', 'Dureté & Spéciation')}</span>
          </TabsTrigger>
          <TabsTrigger value="acid" className="rounded-lg text-xs font-bold gap-1.5">
            <FlaskConical className="h-3.5 w-3.5 text-emerald-600" />
            <span>{tr('Acid Dosing Calculator', 'حاسبة جرعات الأحماض', 'Neutralisation Acide')}</span>
          </TabsTrigger>
          <TabsTrigger value="converter" className="rounded-lg text-xs font-bold gap-1.5">
            <Layers className="h-3.5 w-3.5 text-purple-600" />
            <span>{tr('International Units', 'محوّل الوحدات الدولية', 'Unités Internationales')}</span>
          </TabsTrigger>
          <TabsTrigger value="clogging" className="rounded-lg text-xs font-bold gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
            <span>{tr('Emitter Clogging Risk', 'تشخيص انسداد المنقطات', 'Risque Colmatage')}</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: HARDNESS & SPECIATION */}
        <TabsContent value="calc" className="space-y-4 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Inputs Panel */}
            <div className="lg:col-span-6 space-y-4">
              <Card className="rounded-2xl border shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/30 py-3.5 px-4 border-b">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Beaker className="h-4 w-4 text-blue-600" />
                    {tr('Laboratory Cation & Physical Parameters', 'بيانات التحليل المخبري للكالسيوم والماغنيسيوم', 'Paramètres Laboratoire')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold">{tr('Calcium (Ca²⁺)', 'الكالسيوم (Ca²⁺)', 'Calcium (Ca²⁺)')}</Label>
                      <div className="flex gap-1.5 mt-1">
                        <Input
                          type="number"
                          step="1"
                          value={caVal}
                          onChange={(e) => setCaVal(e.target.value)}
                          className="h-9 font-mono font-bold"
                          placeholder="140"
                        />
                        <Select value={caUnit} onValueChange={(v) => setCaUnit(v as 'ppm' | 'meq')}>
                          <SelectTrigger className="h-9 w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ppm">ppm</SelectItem>
                            <SelectItem value="meq">meq/L</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">{tr('Magnesium (Mg²⁺)', 'الماغنيسيوم (Mg²⁺)', 'Magnésium (Mg²⁺)')}</Label>
                      <div className="flex gap-1.5 mt-1">
                        <Input
                          type="number"
                          step="1"
                          value={mgVal}
                          onChange={(e) => setMgVal(e.target.value)}
                          className="h-9 font-mono font-bold"
                          placeholder="35"
                        />
                        <Select value={mgUnit} onValueChange={(v) => setMgUnit(v as 'ppm' | 'meq')}>
                          <SelectTrigger className="h-9 w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ppm">ppm</SelectItem>
                            <SelectItem value="meq">meq/L</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div>
                      <Label className="text-xs font-semibold">{tr('Water pH', 'درجة الحموضة (pH)', 'pH de l’eau')}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={waterPh}
                        onChange={(e) => setWaterPh(e.target.value)}
                        className="h-9 font-mono mt-1"
                        placeholder="7.8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">{tr('Electrical Conductivity (EC)', 'الناقلية الكهربائية (EC)', 'Conductivité (CE)')}</Label>
                      <Input
                        type="number"
                        step="0.05"
                        value={waterEc}
                        onChange={(e) => setWaterEc(e.target.value)}
                        className="h-9 font-mono mt-1"
                        placeholder="1.35"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 text-xs text-blue-950 dark:text-blue-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-blue-600" />
                      {tr('Chemical Stoichiometry:', 'المعادلة الكيميائية للعسورة:', 'Équivalence stœchiométrique :')}
                    </div>
                    <p className="leading-relaxed text-[11px] font-mono">
                      {'Total Hardness (mg/L CaCO3) = 2.497 × Ca (ppm) + 4.118 × Mg (ppm)'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Breakdown & Visual Partitioning */}
            <div className="lg:col-span-6 space-y-4">
              <Card className="rounded-2xl border shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/30 py-3.5 px-4 border-b">
                  <CardTitle className="text-sm font-bold flex items-center justify-between">
                    <span>{tr('Hardness Partitioning & Speciation', 'توزيع وتفصيل مكونات العسورة', 'Répartition de la Dureté')}</span>
                    <Badge variant="outline" className="font-mono font-bold" style={{ color: labCls.color, borderColor: labCls.color }}>
                      {labCls.label}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Progress Bar of Ca vs Mg CaCO3 */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-blue-700 dark:text-blue-300">
                        Ca-Hardness: {partCaCaCO3.toFixed(1)} ppm ({((partCaCaCO3 / (totalHardnessPpm || 1)) * 100).toFixed(0)}%)
                      </span>
                      <span className="text-indigo-700 dark:text-indigo-300">
                        Mg-Hardness: {partMgCaCO3.toFixed(1)} ppm ({((partMgCaCO3 / (totalHardnessPpm || 1)) * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-3.5 w-full rounded-full bg-muted overflow-hidden flex shadow-inner">
                      <div
                        className="bg-blue-600 transition-all duration-500"
                        style={{ width: `${(partCaCaCO3 / (totalHardnessPpm || 1)) * 100}%` }}
                      />
                      <div
                        className="bg-indigo-500 transition-all duration-500"
                        style={{ width: `${(partMgCaCO3 / (totalHardnessPpm || 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">{tr('French Degrees', 'الدرجة الفرنسية', 'Degrés Français')}</div>
                      <div className="text-xl font-bold font-mono text-foreground">{totalHardnessFh.toFixed(1)} °fH</div>
                      <div className="text-[10px] text-muted-foreground">1 °fH = 10 mg/L CaCO₃</div>
                    </div>

                    <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">{tr('German Degrees', 'الدرجة الألمانية', 'Degrés Allemands')}</div>
                      <div className="text-xl font-bold font-mono text-foreground">{totalHardnessDh.toFixed(1)} °dH</div>
                      <div className="text-[10px] text-muted-foreground">1 °dH = 17.848 mg/L CaCO₃</div>
                    </div>

                    <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">{tr('English / Clark Degrees', 'الدرجة الإنجليزية / كلارك', 'Degrés Clark (°e)')}</div>
                      <div className="text-xl font-bold font-mono text-foreground">{(totalHardnessPpm / PPM_PER_EH).toFixed(1)} °e</div>
                      <div className="text-[10px] text-muted-foreground">1 °e = 14.254 mg/L CaCO₃</div>
                    </div>

                    <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">{tr('Milliequivalents / Liter', 'المللي مكافئ / لتر', 'Milliéquivalents / L')}</div>
                      <div className="text-xl font-bold font-mono text-foreground">{totalHardnessMeq.toFixed(2)} meq/L</div>
                      <div className="text-[10px] text-muted-foreground">1 meq/L = 50.04 mg/L CaCO₃</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: ACID DOSING CALCULATOR */}
        <TabsContent value="acid" className="space-y-4 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-4">
              <Card className="rounded-2xl border shadow-xs overflow-hidden">
                <CardHeader className="bg-emerald-50/40 dark:bg-emerald-950/20 py-3.5 px-4 border-b">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-emerald-600" />
                    {tr('Alkalinity & Target Residual Buffer', 'قلوية المياه والمحلول المنظم المستهدف', 'Alcalinité & Tampon')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <Label className="text-xs font-semibold">HCO₃⁻ (meq/L)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={hco3}
                        onChange={(e) => setHco3(e.target.value)}
                        className="h-9 font-mono font-bold mt-1"
                        placeholder="4.8"
                      />
                      <div className="text-[10px] text-muted-foreground mt-0.5">≈ {(hco3N * 61).toFixed(0)} ppm</div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">CO₃²⁻ (meq/L)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={co3}
                        onChange={(e) => setCo3(e.target.value)}
                        className="h-9 font-mono mt-1"
                        placeholder="0"
                      />
                      <div className="text-[10px] text-muted-foreground mt-0.5">pH &gt; 8.3</div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">{tr('Buffer Target', 'المخزون المتبقي', 'Cible tampon')}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={residual}
                        onChange={(e) => setResidual(e.target.value)}
                        className="h-9 font-mono font-bold mt-1 text-emerald-700 dark:text-emerald-300"
                        placeholder="0.5"
                      />
                      <div className="text-[10px] text-muted-foreground mt-0.5">{tr('Rec: 0.5–0.8 meq/L', 'يوصى: 0.5-0.8', 'Rec: 0.5-0.8')}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div>
                      <Label className="text-xs font-semibold">{tr('Water Volume to Treat', 'حجم المياه المراد معالجتها', 'Volume d’eau')}</Label>
                      <div className="flex gap-1.5 mt-1">
                        <Input
                          type="number"
                          step="10"
                          value={waterVol}
                          onChange={(e) => setWaterVol(e.target.value)}
                          className="h-9 font-mono font-bold"
                          placeholder="1000"
                        />
                        <Select value={volUnit} onValueChange={(v) => setVolUnit(v as 'L' | 'm3')}>
                          <SelectTrigger className="h-9 w-20"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="m3">m³</SelectItem>
                            <SelectItem value="L">L</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">{tr('Selected Commercial Acid', 'نوع الحمض التجاري المستخدم', 'Acide commercial')}</Label>
                      <Select value={acidId} onValueChange={setAcidId}>
                        <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ACIDS.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>{tr('Safety & Buffer Mandate:', 'قاعدة الأمان الفسيولوجي:', 'Règle de sécurité tampon :')}</strong>{' '}
                      {tr(
                        'Never neutralize 100% of bicarbonates in hydroponics/fertigation! Keeping a 0.5 meq/L residual buffer prevents abrupt catastrophic pH crashes below 5.0 in the rootzone.',
                        'لا تعادل 100% من البيكربونات أبداً! الحفاظ على مخزون 0.5 مكافئ/لتر يحمي الجذور من الهبوط الحاد في الـ pH لأقل من 5.0.',
                        'Ne neutralisez jamais à 100% ! Gardez un tampon résiduel de 0.5 meq/L pour éviter l’effondrement du pH.'
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dosing Results Table & Added Nutrients */}
            <div className="lg:col-span-6 space-y-4">
              <Card className="rounded-2xl border shadow-xs overflow-hidden">
                <CardHeader className="bg-emerald-500/10 py-3.5 px-4 border-b">
                  <CardTitle className="text-sm font-bold flex items-center justify-between">
                    <span>{tr('Acid Injection Prescription', 'وصفة حقن الحمض والجرعات', 'Prescription d’injection acide')}</span>
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 font-mono font-bold">
                      {mlPerM3.toFixed(1)} mL / m³
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="divide-y text-xs">
                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-muted-foreground">{tr('Net Alkalinity to Neutralize', 'القلوية المراد معادلتها', 'Alcalinité nette à neutraliser')}</span>
                      <span className="font-mono font-bold text-foreground text-sm">{needMeq.toFixed(2)} meq/L</span>
                    </div>
                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-muted-foreground">{tr('Acid Dose Rate (per m³ of water)', 'معدل الحمض لكل 1 م³ مياه', 'Dose d’acide / m³ d’eau')}</span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-sm">{mlPerM3.toFixed(1)} mL / m³</span>
                    </div>
                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-muted-foreground">{tr('Acid Weight (kg / m³ water)', 'وزن الحمض (كغ / م³ مياه)', 'Masse acide (kg / m³ d’eau)')}</span>
                      <span className="font-mono font-bold text-foreground text-sm">{kgPerM3Water.toFixed(3)} kg / m³</span>
                    </div>
                    <div className="py-2.5 flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-950/20 px-3 rounded-lg">
                      <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                        {tr(`Total Acid for ${volM3.toFixed(1)} m³ Batch`, `إجمالي الحمض المطلوب لحجم ${volM3.toFixed(1)} م³`, `Volume total acide pour ${volM3.toFixed(1)} m³`)}
                      </span>
                      <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-base">
                        {totalL.toFixed(2)} Liters <span className="text-xs font-normal text-muted-foreground">({kgTotal.toFixed(2)} kg)</span>
                      </span>
                    </div>
                  </div>

                  {suppliedNutrient && (
                    <div className="p-3 rounded-xl bg-muted/40 border text-xs space-y-1">
                      <div className="font-bold text-foreground flex items-center justify-between">
                        <span>{tr('Nutrient Credit from Acid Injection:', 'العناصر الغذائية المضافة مع الحمض:', 'Apport nutritif de l’acide :')}</span>
                        <Badge variant="outline" className="font-mono text-teal-700 dark:text-teal-300 border-teal-400">
                          {suppliedNutrient.element}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-[11px]">
                        {tr(
                          `Injecting ${acid.name} contributes ${suppliedNutrient.label} directly to the final irrigation water. Deduct this amount from your stock fertilizer tank recipe.`,
                          `حقن ${acid.name} يضيف ${suppliedNutrient.label} مباشرة لمياه الري. يجب خصم هذه الكمية من خلطة السماد.`,
                          `L’injection de ${acid.name} apporte ${suppliedNutrient.label}. Déduisez cette quantité de la formule d’engrais.`
                        )}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: INTERNATIONAL UNITS CONVERTER */}
        <TabsContent value="converter" className="space-y-4 pt-2">
          <Card className="rounded-2xl border shadow-xs overflow-hidden">
            <CardHeader className="bg-muted/30 py-3.5 px-4 border-b">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>{tr('Live Bi-Directional Water Hardness Converter', 'محوّل درجات العسورة ثنائي الاتجاه التفاعلي', 'Convertisseur d’unités de dureté')}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {tr('Type in any field to recalculate all scales automatically', 'اكتب في أي خانة لتحديث جميع الوحدات تلقائياً', 'Saisissez dans n’importe quel champ')}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="p-3 rounded-xl border bg-muted/10 space-y-1.5">
                  <Label className="text-xs font-bold text-blue-700 dark:text-blue-300">mg/L as CaCO₃ (ppm)</Label>
                  <Input
                    type="number"
                    step="5"
                    value={ppm}
                    onChange={(e) => fromPpm(e.target.value)}
                    className="h-10 text-sm font-mono font-bold"
                    placeholder="250"
                  />
                  <div className="text-[10px] text-muted-foreground">Standard US / ISO metric</div>
                </div>

                <div className="p-3 rounded-xl border bg-muted/10 space-y-1.5">
                  <Label className="text-xs font-bold text-emerald-700 dark:text-emerald-300">meq / L</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={meq}
                    onChange={(e) => fromMeq(e.target.value)}
                    className="h-10 text-sm font-mono font-bold"
                    placeholder="5.00"
                  />
                  <div className="text-[10px] text-muted-foreground">1 meq/L = 50.04 ppm CaCO₃</div>
                </div>

                <div className="p-3 rounded-xl border bg-muted/10 space-y-1.5">
                  <Label className="text-xs font-bold text-purple-700 dark:text-purple-300">°fH (French Degrees)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={fh}
                    onChange={(e) => fromFh(e.target.value)}
                    className="h-10 text-sm font-mono font-bold"
                    placeholder="25.00"
                  />
                  <div className="text-[10px] text-muted-foreground">1 °fH = 10.0 ppm CaCO₃</div>
                </div>

                <div className="p-3 rounded-xl border bg-muted/10 space-y-1.5">
                  <Label className="text-xs font-bold text-amber-700 dark:text-amber-300">°dH (German Degrees)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={dh}
                    onChange={(e) => fromDh(e.target.value)}
                    className="h-10 text-sm font-mono font-bold"
                    placeholder="14.00"
                  />
                  <div className="text-[10px] text-muted-foreground">1 °dH = 17.848 ppm CaCO₃</div>
                </div>

                <div className="p-3 rounded-xl border bg-muted/10 space-y-1.5">
                  <Label className="text-xs font-bold text-cyan-700 dark:text-cyan-300">°e (Clark / English)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={eh}
                    onChange={(e) => fromEh(e.target.value)}
                    className="h-10 text-sm font-mono font-bold"
                    placeholder="17.50"
                  />
                  <div className="text-[10px] text-muted-foreground">1 °e = 14.254 ppm CaCO₃</div>
                </div>
              </div>

              {/* Hardness Reference Scale Chart */}
              <div className="mt-4 pt-3 border-t">
                <div className="text-xs font-bold text-foreground mb-2">
                  {tr('Water Hardness Classification Scale:', 'سلم تصنيف عسورة المياه المعتمد:', 'Échelle de classification :')}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                    <div className="font-bold text-blue-700 dark:text-blue-300">{tr('Soft Water', 'مياه يسرة', 'Eau Douce')}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">&lt; 60 ppm · &lt; 6 °fH</div>
                  </div>
                  <div className="p-2.5 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
                    <div className="font-bold text-emerald-700 dark:text-emerald-300">{tr('Moderately Hard', 'عسورة معتدلة', 'Moyennement Dure')}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">60–120 ppm · 6–12 °fH</div>
                  </div>
                  <div className="p-2.5 rounded-xl border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                    <div className="font-bold text-amber-700 dark:text-amber-300">{tr('Hard Water', 'مياه عسرة', 'Eau Dure')}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">120–180 ppm · 12–18 °fH</div>
                  </div>
                  <div className="p-2.5 rounded-xl border bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900">
                    <div className="font-bold text-rose-700 dark:text-rose-300">{tr('Very Hard Water', 'عسورة شديدة جداً', 'Très Dure')}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">&gt; 180 ppm · &gt; 18 °fH</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: EMITTER CLOGGING RISK & LSI */}
        <TabsContent value="clogging" className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl border shadow-xs overflow-hidden">
              <CardHeader className="bg-muted/30 py-3.5 px-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-600" />
                  {tr('Langelier Saturation Index (LSI) Analysis', 'تحليل مؤشر التشبع الكلسي لانجلييه', 'Indice de Saturation de Langelier')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="p-4 rounded-xl border text-center space-y-2" style={{ borderColor: `${lsiEstimate.color}40`, backgroundColor: `${lsiEstimate.color}10` }}>
                  <div className="text-xs uppercase font-bold text-muted-foreground tracking-wider">LSI Score</div>
                  <div className="text-4xl font-black font-mono" style={{ color: lsiEstimate.color }}>
                    {lsiEstimate.lsi > 0 ? `+${lsiEstimate.lsi.toFixed(2)}` : lsiEstimate.lsi.toFixed(2)}
                  </div>
                  <div className="text-sm font-bold" style={{ color: lsiEstimate.color }}>
                    {lsiEstimate.status}
                  </div>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="font-bold text-foreground">{tr('LSI Agronomic Interpretation:', 'التفسير الزراعي لمؤشر LSI:', 'Interprétation agronomique :')}</div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
                    <li><strong>LSI &gt; +0.5:</strong> {tr('High probability of CaCO₃ scale forming inside drippers and filters. Requires routine acid pulsing (pH 5.5-6.0).', 'احتمال كبير لترسب كربونات الكالسيوم داخل القطارات. يتطلب حقن حمض دوري لتعديل الـ pH.', 'Forte tendance au dépôt de tartre CaCO₃ dans les goutteurs. Nécessite une acidification continue.')}</li>
                    <li><strong>LSI 0.0 to +0.5:</strong> {tr('Slight scaling tendency. Optimal stability for non-clogging drip irrigation.', 'ميل طفيف للترسيب. استقرار مثالي لشبكات الري الموضعي.', 'Légère tendance entartrante. Équilibre stable.')}</li>
                    <li><strong>LSI &lt; 0.0:</strong> {tr('Undersaturated; water will dissolve scale but may corrode metallic pump impellers and brass valves.', 'مياه غير مشبعة؛ تذيب الترسبات لكنها تسبب تآكل المضخات والصمامات المعدنية.', 'Eau agressive dissolvant le calcaire mais corrosive pour les métaux.')}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border shadow-xs overflow-hidden">
              <CardHeader className="bg-muted/30 py-3.5 px-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  {tr('Emitter Maintenance Protocol', 'بروتوكول الصيانة الدورية للشبكة', 'Protocole d’entretien du réseau')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs leading-relaxed">
                <div className="p-3 rounded-xl bg-muted/30 border space-y-1">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <FlaskConical className="h-3.5 w-3.5 text-emerald-600" />
                    {tr('1. Continuous Acidification during Fertigation', '1. التحميض المستمر أثناء التسميد', '1. Acidification continue en fertirrigation')}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {tr(
                      `Inject ${mlPerM3.toFixed(1)} mL/m³ of ${acid.name} continuously to keep irrigation solution pH strictly between 5.8 and 6.2.`,
                      `حقن ${mlPerM3.toFixed(1)} مل/م³ من ${acid.name} بانتظام للحفاظ على pH مياه الري بين 5.8 و 6.2.`,
                      `Injectez ${mlPerM3.toFixed(1)} mL/m³ de ${acid.name} en continu pour maintenir le pH entre 5.8 et 6.2.`
                    )}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border space-y-1">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-600" />
                    {tr('2. Shock Acid Flushing (Line Cleaning)', '2. المعالجة الصدمية بالحمض (غسيل الخطوط)', '2. Choc acide curatif')}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {tr(
                      'Inject concentrated acid to lower line end-pH to 4.0 for 60 minutes at the end of the crop cycle, then flush lines with clear water.',
                      'حقن حمض مركز لخفض الـ pH عند نهايات الخطوط إلى 4.0 لمدة 60 دقيقة في نهاية الموسم ثم غسيل الخطوط بماء نظيف.',
                      'Abaissez le pH à 4.0 pendant 60 minutes en fin de culture pour dissoudre les précipités.'
                    )}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border space-y-1">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                    {tr('3. Filtration Inspection', '3. فحص ومراقبة محطة الفلاتر', '3. Inspection des filtres')}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {tr(
                      'Ensure disc or media filters operate at delta-P < 0.5 bar. High water hardness accelerates bio-mineral slime binding.',
                      'تأكد من أن فرق الضغط عبر الفلاتر لا يتجاوز 0.5 بار لتفادي تراكم المعقدات الكلسية الحيوية.',
                      'Veillez à ce que le delta-P des filtres reste inférieur à 0.5 bar.'
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </CalculatorShell>
  );
}
