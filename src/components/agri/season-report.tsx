'use client';

// Season Report generator: opens a print-optimized PDF/HTML window that
// summarises a farm's season — basic profile, summary stats, the full
// calculation log, and current weather — then auto-triggers the browser's
// print dialog. Mirrors the print-HTML pattern from `printFormulaCard` in
// share-utils.ts so the styling stays consistent across printed outputs.

import { useMemo } from 'react';
import { FileText, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHydrated } from '@/lib/use-hydrated';
import {
  useFarmStore,
  cropOptions,
  soilTypeOptions,
  irrigationTypeOptions,
  type Farm,
  type FarmCalcEntry,
} from '@/lib/farm-store';
import {
  useWeatherStore,
  weatherCodeToText,
} from '@/lib/weather-store';

interface SeasonReportButtonProps {
  /** Optional extra classes for the trigger button. */
  className?: string;
  /** Visual variant of the trigger button. Defaults to "outline". */
  variant?: 'outline' | 'secondary' | 'ghost';
  /** Size of the trigger button. */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Render a more compact label (icon only) for tight toolbars. */
  compact?: boolean;
  /** Optional: render null when no farm is active (default: render nothing). */
  hideWhenInactive?: boolean;
}

// --- Formatting helpers ----------------------------------------------------

function cropLabel(value: string): string {
  return cropOptions.find((o) => o.value === value)?.label ?? value;
}

function soilLabel(value: Farm['soilType']): string {
  return soilTypeOptions.find((o) => o.value === value)?.label ?? value;
}

function irrigationLabel(value: Farm['irrigationType']): string {
  return irrigationTypeOptions.find((o) => o.value === value)?.label ?? value;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function esc(value: unknown): string {
  return (value == null ? '' : String(value))
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --- HTML rendering --------------------------------------------------------

interface SeasonReportData {
  farm: Farm;
  entries: FarmCalcEntry[];
  weather: ReturnType<typeof useWeatherStore.getState>['weather'];
  weatherLocation: ReturnType<typeof useWeatherStore.getState>['location'];
  generatedAt: string;
}

function renderSummaryStat(label: string, value: string): string {
  return `
    <div class="stat">
      <div class="stat-label">${esc(label)}</div>
      <div class="stat-value">${esc(value)}</div>
    </div>`;
}

function renderFarmField(label: string, value: string): string {
  if (!value || value === '—') return '';
  return `
    <div class="field-row">
      <span class="field-label">${esc(label)}</span>
      <span class="field-value">${esc(value)}</span>
    </div>`;
}

function renderCalcRow(entry: FarmCalcEntry, idx: number): string {
  const inputs = Object.entries(entry.inputs)
    .slice(0, 4)
    .map(([k, v]) => `<span class="kv">${esc(k)}=${esc(typeof v === 'number' ? v : String(v))}</span>`)
    .join(' ');
  const extraInputs =
    Object.keys(entry.inputs).length > 4
      ? `<span class="kv-muted">+${Object.keys(entry.inputs).length - 4} more</span>`
      : '';
  return `
    <tr class="${idx % 2 ? 'alt' : ''}">
      <td class="cell-date">${esc(formatDateTime(entry.timestamp))}</td>
      <td class="cell-code">${esc(entry.formulaCode)}</td>
      <td class="cell-name">${esc(entry.formulaName)}</td>
      <td class="cell-result">
        <span class="result-value">${esc(entry.resultValue)}</span>
        <span class="result-label">${esc(entry.resultLabel)}</span>
      </td>
      <td class="cell-inputs">${inputs}${extraInputs}</td>
    </tr>`;
}

function renderSeasonReportHtml(data: SeasonReportData): string {
  const { farm, entries, weather, weatherLocation, generatedAt } = data;

  // Sort oldest → newest so the log reads chronologically.
  const sorted = [...entries].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp),
  );

  // Summary stats
  const totalCalcs = sorted.length;
  const dateRange =
    totalCalcs > 0
      ? `${formatDate(sorted[0].timestamp)} → ${formatDate(sorted[sorted.length - 1].timestamp)}`
      : '—';
  const uniqueFormulas = new Set(sorted.map((e) => e.formulaCode)).size;
  const uniqueFormulaList = Array.from(
    new Set(sorted.map((e) => `${e.formulaCode} · ${e.formulaName}`)),
  )
    .sort()
    .slice(0, 12)
    .map((s) => `<li>${esc(s)}</li>`)
    .join('');
  const moreFormulas =
    new Set(sorted.map((e) => e.formulaCode)).size > 12
      ? `<li class="muted">+${new Set(sorted.map((e) => e.formulaCode)).size - 12} more formula(s)</li>`
      : '';

  // Farm profile block — `createdAt` is used as the planting/season-start date
  // since the Farm interface does not currently expose a dedicated plantingDate.
  const farmFields = [
    renderFarmField('Crop', cropLabel(farm.crop)),
    renderFarmField('Area', `${farm.areaHa.toFixed(2)} ha`),
    renderFarmField('Soil type', soilLabel(farm.soilType)),
    renderFarmField('Irrigation', irrigationLabel(farm.irrigationType)),
    renderFarmField('Planting date', formatDate(farm.createdAt)),
    farm.location ? renderFarmField('Location', farm.location) : '',
  ]
    .filter(Boolean)
    .join('');

  // Weather block — only when current data is available from the store.
  const weatherBlock = weather
    ? `
        <section class="block">
          <h2>Weather at time of report</h2>
          ${
            weatherLocation
              ? `<div class="weather-loc">📍 ${esc(weatherLocation.label)}</div>`
              : ''
          }
          <div class="weather-grid">
            ${renderWeatherStat('Conditions', weatherCodeToText(weather.weatherCode))}
            ${renderWeatherStat('Temperature', `${weather.temperature.toFixed(1)} °C`)}
            ${renderWeatherStat('Feels like', `${weather.apparentTemperature.toFixed(1)} °C`)}
            ${renderWeatherStat('Humidity', `${weather.humidity.toFixed(0)} %`)}
            ${renderWeatherStat('Wind', `${weather.windSpeed.toFixed(1)} km/h`)}
            ${renderWeatherStat('Precipitation', `${weather.precipitation.toFixed(1)} mm`)}
            ${renderWeatherStat('Cloud cover', `${weather.cloudCover.toFixed(0)} %`)}
            ${renderWeatherStat('Pressure', `${weather.pressure.toFixed(0)} hPa`)}
          </div>
          <p class="muted weather-stamp">Observation time: ${esc(formatDateTime(weather.time))}</p>
        </section>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(farm.name)} — Season Report — ${esc(formatDate(generatedAt))}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #1c1917;
    margin: 32px;
    max-width: 880px;
    line-height: 1.5;
  }
  h1 { font-size: 24px; margin: 0 0 4px; color: #065f46; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .05em; color: #047857; margin: 24px 0 8px; }
  .meta { color: #78716c; font-size: 12px; margin-bottom: 16px; }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    color: #fff;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .04em;
    margin-bottom: 12px;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin: 16px 0 8px;
  }
  .stat {
    background: #f5f5f4;
    border: 1px solid #e7e5e4;
    border-radius: 8px;
    padding: 10px 12px;
  }
  .stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #78716c; font-weight: 600; }
  .stat-value { font-size: 18px; font-weight: 700; margin-top: 2px; color: #1c1917; }
  .block {
    background: #fff;
    border: 1px solid #e7e5e4;
    border-radius: 10px;
    padding: 14px 16px;
    margin-top: 12px;
  }
  .field-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px dashed #e7e5e4;
    font-size: 13px;
  }
  .field-row:last-child { border-bottom: none; }
  .field-label { color: #57534e; font-weight: 500; }
  .field-value { color: #1c1917; font-weight: 600; text-align: right; }
  table.calc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    margin-top: 6px;
  }
  .calc-table th {
    background: #ecfdf5;
    color: #047857;
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: .04em;
    text-align: left;
    padding: 8px 10px;
    border-bottom: 2px solid #a7f3d0;
  }
  .calc-table td {
    padding: 8px 10px;
    border-bottom: 1px solid #f0efec;
    vertical-align: top;
  }
  .calc-table tr.alt td { background: #fafaf9; }
  .cell-code {
    font-family: 'SF Mono', Menlo, monospace;
    font-weight: 700;
    color: #047857;
    white-space: nowrap;
  }
  .cell-date { white-space: nowrap; color: #57534e; }
  .cell-name { font-weight: 500; }
  .cell-result { white-space: nowrap; text-align: right; }
  .result-value { font-weight: 700; color: #065f46; }
  .result-label { font-size: 10px; color: #78716c; margin-left: 4px; }
  .cell-inputs { font-family: 'SF Mono', Menlo, monospace; font-size: 10px; }
  .kv {
    display: inline-block;
    background: #f5f5f4;
    padding: 1px 5px;
    border-radius: 3px;
    margin: 1px 3px 1px 0;
    color: #44403c;
  }
  .kv-muted { color: #a8a29e; font-style: italic; }
  .weather-loc { font-size: 12px; color: #57534e; margin-bottom: 8px; }
  .weather-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .weather-stamp { margin-top: 8px; }
  .muted { color: #78716c; font-size: 11px; }
  .formula-list { margin: 6px 0 0; padding-left: 18px; font-size: 12px; }
  .formula-list li { padding: 2px 0; }
  .formula-list .muted { font-style: italic; }
  .empty {
    padding: 32px 16px;
    text-align: center;
    color: #78716c;
    font-style: italic;
    background: #fafaf9;
    border-radius: 8px;
    border: 1px dashed #e7e5e4;
  }
  footer {
    margin-top: 32px;
    padding-top: 12px;
    border-top: 1px solid #e7e5e4;
    color: #78716c;
    font-size: 11px;
    text-align: center;
  }
  @media print {
    body { margin: 16px; }
    .block, .stats { break-inside: avoid; }
    .calc-table tr { break-inside: avoid; }
  }
  @media (max-width: 640px) {
    .stats, .weather-grid { grid-template-columns: repeat(2, 1fr); }
  }
</style>
</head>
<body>
  <div class="brand">🌱 Agri-Atlas · Season Report</div>
  <h1>${esc(farm.name)}</h1>
  <div class="meta">Generated ${esc(formatDateTime(generatedAt))}${
    farm.location ? ` · Location: ${esc(farm.location)}` : ''
  }</div>

  <section class="block">
    <h2>Farm profile</h2>
    ${farmFields || '<div class="muted">No farm details on record.</div>'}
  </section>

  <section class="block">
    <h2>Season summary</h2>
    <div class="stats">
      ${renderSummaryStat('Calculations', String(totalCalcs))}
      ${renderSummaryStat('Unique formulas', String(uniqueFormulas))}
      ${renderSummaryStat('Date range', dateRange)}
      ${renderSummaryStat(
        'Days tracked',
        totalCalcs > 0
          ? String(
              Math.max(
                1,
                Math.round(
                  (new Date(sorted[sorted.length - 1].timestamp).getTime() -
                    new Date(sorted[0].timestamp).getTime()) /
                    86400000,
                ) + 1,
              ),
            )
          : '0',
      )}
    </div>
    ${
      uniqueFormulas > 0
        ? `<p class="muted" style="margin:8px 0 4px">Formulas used this season:</p>
           <ul class="formula-list">${uniqueFormulaList}${moreFormulas}</ul>`
        : '<p class="muted">No calculations have been saved for this farm yet.</p>'
    }
  </section>

  <section class="block">
    <h2>Calculation log (${totalCalcs})</h2>
    ${
      totalCalcs === 0
        ? '<div class="empty">No calculations have been saved for this farm yet. Run a calculator and save the result to start building your season log.</div>'
        : `<table class="calc-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Code</th>
                <th>Formula</th>
                <th style="text-align:right">Result</th>
                <th>Key inputs</th>
              </tr>
            </thead>
            <tbody>
              ${sorted.map(renderCalcRow).join('')}
            </tbody>
          </table>`
    }
  </section>

  ${weatherBlock}

  <footer>Formula Atlas — Season Report — ${esc(formatDate(generatedAt))}</footer>
</body>
</html>`;
}

function renderWeatherStat(label: string, value: string): string {
  return `
    <div class="stat">
      <div class="stat-label">${esc(label)}</div>
      <div class="stat-value" style="font-size:14px">${esc(value)}</div>
    </div>`;
}

// --- Component -------------------------------------------------------------

/**
 * Trigger button that opens a print-optimized PDF/HTML season report for the
 * active farm. Returns `null` when no farm is active so it can be safely
 * dropped into any toolbar (e.g. the Farm Dashboard).
 */
export function SeasonReportButton({
  className,
  variant = 'outline',
  size = 'sm',
  compact = false,
  hideWhenInactive = true,
}: SeasonReportButtonProps) {
  const hydrated = useHydrated();
  const farm = useFarmStore((s) => s.farms.find((f) => f.id === s.activeFarmId) ?? null);
  const farmCalcs = useFarmStore((s) => s.farmCalcs);
  const weather = useWeatherStore((s) => s.weather);
  const weatherLocation = useWeatherStore((s) => s.location);

  const entries = useMemo<FarmCalcEntry[]>(() => {
    if (!farm) return [];
    return farmCalcs.filter((c) => c.farmId === farm.id);
  }, [farm, farmCalcs]);

  // During SSR / pre-hydration the persisted store hasn't reloaded yet, so
  // we hide the button to avoid flicker.
  if (!hydrated) return null;
  if (!farm) return hideWhenInactive ? null : (
    <Button
      variant={variant}
      size={size}
      className={cn('gap-1.5', className)}
      disabled
      title="No active farm — add a farm in Farm Management first"
    >
      <FileText className="h-4 w-4" />
      {!compact && <span>Season Report</span>}
    </Button>
  );

  const handleGenerate = () => {
    if (typeof window === 'undefined') return;
    const generatedAt = new Date().toISOString();
    const data: SeasonReportData = {
      farm,
      entries,
      weather,
      weatherLocation,
      generatedAt,
    };
    const html = renderSeasonReportHtml(data);
    const printWin = window.open('', '_blank', 'width=900,height=1100');
    if (!printWin) {
      // Popup blocked — fall back to a download of the HTML so the user can
      // still access the report.
      try {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeFarm = farm.name.replace(/[^a-z0-9_-]+/gi, '_').slice(0, 40);
        const stamp = generatedAt.slice(0, 10);
        a.download = `${safeFarm}_season_report_${stamp}.html`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch {
        /* noop */
      }
      return;
    }
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      try {
        printWin.print();
      } catch {
        /* noop */
      }
    }, 350);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleGenerate}
      className={cn('gap-1.5', className)}
      title={`Generate printable season report for ${farm.name}${
        entries.length > 0 ? ` · ${entries.length} calculation${entries.length === 1 ? '' : 's'}`
        : ' · no calculations yet'
      }`}
      aria-label="Generate printable season report"
    >
      {compact ? <Printer className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
      {!compact && <span>Season Report</span>}
    </Button>
  );
}

export default SeasonReportButton;
