'use client';

import { useState, useMemo } from 'react';
import { Leaf, Copy, Check, RotateCcw, Download, AlertTriangle } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

type Traffic = 'red' | 'yellow' | 'green';

const TRAFFIC_COLORS: Record<Traffic, { bg: string; border: string; text: string; label: string }> = {
  red:    { bg: '#fee2e2', border: '#dc2626', text: '#991b1b', label: 'Red' },
  yellow: { bg: '#fef3c7', border: '#d97706', text: '#92400e', label: 'Yellow' },
  green:  { bg: '#dcfce7', border: '#16a34a', text: '#15803d', label: 'Green' },
};

interface MetricResult { score: number; traffic: Traffic; note: string; }

function nueScore(v: number): MetricResult {
  if (v < 40) return { score: 30, traffic: 'red', note: 'Low NUE — N losses likely. Improve 4R: right source, rate, time, placement.' };
  if (v < 60) return { score: 55, traffic: 'yellow', note: 'Average NUE — split applications and use cover crops to capture residual N.' };
  if (v <= 90) return { score: 90, traffic: 'green', note: 'Excellent NUE — maintain balance to protect soil N and profitability.' };
  return { score: 60, traffic: 'yellow', note: 'Very high NUE may indicate soil N mining — monitor soil organic N over time.' };
}
function waterScore(v: number): MetricResult {
  if (v < 0.8) return { score: 30, traffic: 'red', note: 'Low water productivity — reduce losses via mulching, drip, and ET-based scheduling.' };
  if (v <= 1.2) return { score: 60, traffic: 'yellow', note: 'Moderate — tune irrigation timing and explore regulated deficit strategies.' };
  return { score: 90, traffic: 'green', note: 'High water productivity — exemplary; maintain current practices.' };
}
function carbonScore(v: number): MetricResult {
  if (v < 0.5) return { score: 90, traffic: 'green', note: 'Low carbon footprint — efficient production system.' };
  if (v <= 2) return { score: 60, traffic: 'yellow', note: 'Moderate footprint — reduce N fertiliser rate and fuel use; add cover crops.' };
  return { score: 30, traffic: 'red', note: 'High footprint — review N source, tillage intensity, and energy use.' };
}
function soilScore(v: number): MetricResult {
  if (v < 40) return { score: 30, traffic: 'red', note: 'Degraded soil — add organic amendments, cover crops, and reduce tillage.' };
  if (v <= 60) return { score: 60, traffic: 'yellow', note: 'Improvable — diversify rotation and build organic matter.' };
  return { score: 90, traffic: 'green', note: 'Healthy soil — sustain with regenerative practices.' };
}
function pesticideScore(v: number): MetricResult {
  if (v < 20) return { score: 90, traffic: 'green', note: 'Low pesticide risk — strong IPM program in place.' };
  if (v <= 50) return { score: 60, traffic: 'yellow', note: 'Moderate risk — adopt scouting, thresholds, and biocontrol.' };
  return { score: 30, traffic: 'red', note: 'High pesticide risk — overhaul IPM and reduce reliance on high-risk actives.' };
}

function grade(score: number): { grade: string; color: string } {
  if (score > 80) return { grade: 'A', color: '#16a34a' };
  if (score > 60) return { grade: 'B', color: '#65a30d' };
  if (score > 40) return { grade: 'C', color: '#d97706' };
  return { grade: 'D', color: '#dc2626' };
}

const TITLE: TrilingualString = {
  en: 'Sustainability Scorecard',
  ar: 'بطاقة قياس الاستدامة',
  fr: 'Tableau de Bord de Durabilité',
};

const DESC: TrilingualString = {
  en: 'Five-dimension traffic-light assessment — NUE, water, carbon, soil, and pesticide risk → overall grade.',
  ar: 'تقييم بإشارات المرور لخمسة أبعاد — كفاءة النيتروجين، المياه، الكربون، التربة، ومخاطر المبيدات ← درجة إجمالية.',
  fr: 'Évaluation feux tricolores sur cinq dimensions — EUN, eau, carbone, sol, et risque pesticides → note globale.',
};

export function SustainabilityScorecard() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [nue, setNue] = useState('65');
  const [wp, setWp] = useState('1.5');
  const [carbon, setCarbon] = useState('1.2');
  const [soil, setSoil] = useState('70');
  const [pest, setPest] = useState('25');
  const [copied, setCopied] = useState(false);

  const metrics = useMemo(() => {
    const n = parseFloat(nue) || 0, w = parseFloat(wp) || 0, c = parseFloat(carbon) || 0;
    const s = parseFloat(soil) || 0, p = parseFloat(pest) || 0;
    return [
      { key: 'NUE', label: tr('Nitrogen Use Efficiency', 'كفاءة استخدام النيتروجين', 'Efficacité azote'), value: n, unit: '%',          ...nueScore(n) },
      { key: 'WP',  label: tr('Water Productivity', 'إنتاجية المياه', 'Productivité eau'), value: w, unit: 'kg/m³',       ...waterScore(w) },
      { key: 'CF',  label: tr('Carbon Footprint', 'البصمة الكربونية', 'Empreinte carbone'), value: c, unit: 'kg CO₂e/kg',  ...carbonScore(c) },
      { key: 'SH',  label: tr('Soil Health Score', 'درجة صحة التربة', 'Score de santé sol'), value: s, unit: '/100',        ...soilScore(s) },
      { key: 'PR',  label: tr('Pesticide Risk Index', 'مؤشر مخاطر المبيدات', 'Indice risque pesticides'), value: p, unit: '/100',        ...pesticideScore(p) },
    ];
  }, [nue, wp, carbon, soil, pest, language]);

  const overall = Math.round(metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length);
  const g = grade(overall);

  const downloadPdf = () => {
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;
    const rows = metrics.map(m => `
      <tr>
        <td>${m.label}</td>
        <td>${m.value} ${m.unit}</td>
        <td style="color:${TRAFFIC_COLORS[m.traffic].text};font-weight:bold">${m.score}</td>
        <td>${TRAFFIC_COLORS[m.traffic].label}</td>
        <td>${m.note}</td>
      </tr>`).join('');
    w.document.write(`<!doctype html><html><head><title>Sustainability Scorecard</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:32px;max-width:760px;margin:auto;color:#1f2937}
        h1{color:#15803d;margin-bottom:4px}table{width:100%;border-collapse:collapse;margin-top:16px}
        th,td{border:1px solid #e5e7eb;padding:8px;text-align:left;font-size:13px}
        th{background:#f0fdf4;color:#15803d}.score{font-size:48px;font-weight:800;color:${g.color}}
      </style></head><body>
      <h1>🌱 Farm Sustainability Scorecard</h1>
      <p style="margin-top:0;color:#6b7280">Generated ${new Date().toLocaleString()}</p>
      <div>Overall score: <span class="score">${overall}</span> &nbsp; Grade: <b style="color:${g.color}">${g.grade}</b></div>
      <table><thead><tr><th>Metric</th><th>Value</th><th>Score</th><th>Traffic</th><th>Recommendation</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p style="margin-top:24px;font-size:11px;color:#6b7280">Generated by Formula Atlas — Farm Intelligence Suite.</p>
      </body></html>`);
    w.document.close(); w.focus();
    setTimeout(() => w.print(), 350);
  };

  const weak = metrics.filter(m => m.traffic !== 'green');

  const handleReset = () => {
    setNue('65'); setWp('1.5'); setCarbon('1.2'); setSoil('70'); setPest('25');
    toast({ title: tr('Reset', 'إعادة', 'Réinitialiser') });
  };

  const handleCopy = () => {
    const lines = metrics.map(m => `  • ${m.label}: ${m.value} ${m.unit} → ${m.score} (${TRAFFIC_COLORS[m.traffic].label})`).join('\n');
    const text = `=== SUSTAINABILITY SCORECARD ===\nOverall score: ${overall}/100 (Grade ${g.grade})\n\nMetrics:\n${lines}\n\nWeak areas: ${weak.length}`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <CalculatorShell
      icon={Leaf}
      title={TITLE}
      description={DESC}
      badge="5 Dimensions"
      accent="emerald"
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
        {
          icon: Download,
          label: { en: 'PDF', ar: 'بي دي إف', fr: 'PDF' },
          onClick: downloadPdf,
        },
      ]}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <Leaf className="h-4 w-4 text-emerald-600" />
              {tr('Farm Inputs', 'مدخلات المزرعة', 'Entrées de la ferme')}
            </span>
            <span className="font-mono text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 rounded-lg px-2 py-0.5" style={{ color: g.color }}>
              {overall}/100 · {g.grade}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <CalculatorShell.InputField
              label={tr('NUE (%)', 'كفاءة استخدام النيتروجين (%)', 'EUN (%)')}
              value={nue}
              onChange={setNue}
              step="1"
              helper={tr('Nitrogen use efficiency', 'كفاءة استخدام النيتروجين', 'Efficacité d\'utilisation azote')}
            />
            <CalculatorShell.InputField
              label={tr('Water productivity (kg/m³)', 'إنتاجية المياه (كغ/م³)', 'Productivité eau (kg/m³)')}
              value={wp}
              onChange={setWp}
              step="0.1"
              helper={tr('Crop output per m³ water', 'إنتاج المحصول لكل م³ ماء', 'Production par m³ d\'eau')}
            />
            <CalculatorShell.InputField
              label={tr('Carbon (kg CO₂e/kg)', 'الكربون (كغ CO₂e/كغ)', 'Carbone (kg CO₂e/kg)')}
              value={carbon}
              onChange={setCarbon}
              step="0.1"
              helper={tr('Emissions intensity', 'كثافة الانبعاثات', 'Intensité émissions')}
            />
            <CalculatorShell.InputField
              label={tr('Soil Health (0-100)', 'صحة التربة (0-100)', 'Santé sol (0-100)')}
              value={soil}
              onChange={setSoil}
              step="1"
              helper={tr('Composite soil score', 'مؤشر تربة مركّب', 'Score sol composite')}
            />
            <CalculatorShell.InputField
              label={tr('Pesticide Risk (0-100)', 'مخاطر المبيدات (0-100)', 'Risque pesticides (0-100)')}
              value={pest}
              onChange={setPest}
              step="1"
              helper={tr('Higher = riskier', 'أعلى = أكثر خطورة', 'Plus haut = plus risqué')}
            />
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
          <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-emerald-50 via-transparent to-green-50/50 dark:from-emerald-950/30 dark:to-green-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
            <span className="text-base font-bold flex items-center gap-2">
              ✨ {tr('Overall Sustainability', 'الاستدامة الإجمالية', 'Durabilité globale')}
            </span>
            <div className="flex gap-2">
              {(['red', 'yellow', 'green'] as Traffic[]).map(t => {
                const count = metrics.filter(m => m.traffic === t).length;
                return (
                  <div key={t} className="text-center">
                    <div className="w-6 h-6 rounded-full mx-auto" style={{ background: TRAFFIC_COLORS[t].border }} />
                    <div className="text-[10px] mt-1 text-muted-foreground">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5 metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {metrics.map(m => {
              const c = TRAFFIC_COLORS[m.traffic];
              return (
                <div key={m.key} className="rounded-lg p-3 border" style={{ background: c.bg, borderColor: c.border + '50' }}>
                  <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: c.text }}>{m.key}</div>
                  <div className="text-2xl font-bold mt-0.5" style={{ color: c.text }}>{m.score}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{m.label}</div>
                  <div className="text-[10px] mt-1 font-mono">{m.value} {m.unit}</div>
                </div>
              );
            })}
          </div>

          <CalculatorShell.MetricTile
            label={tr('Overall Score', 'النتيجة الإجمالية', 'Note globale')}
            value={overall}
            unit={`/100 · ${g.grade}`}
            color="emerald"
            helper={tr(`Grade ${g.grade} · ${weak.length} weak dimension(s)`, `الدرجة ${g.grade} · ${weak.length} أبعاد ضعيفة`, `Grade ${g.grade} · ${weak.length} dimension(s) faible(s)`)}
          />

          {weak.length > 0 && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1 mb-2">
                <AlertTriangle className="h-3 w-3" /> {tr('Recommendations', 'التوصيات', 'Recommandations')} ({weak.length})
              </div>
              <ul className="space-y-1.5">
                {weak.map(m => (
                  <li key={m.key} className="text-xs flex items-start gap-2">
                    <span className="font-bold flex-shrink-0" style={{ color: TRAFFIC_COLORS[m.traffic].text }}>{m.key}:</span>
                    <span className="text-muted-foreground">{m.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
