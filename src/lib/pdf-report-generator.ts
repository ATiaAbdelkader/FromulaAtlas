/**
 * Trilingual PDF Report Generator (Feature #10)
 * ==============================================
 *
 * A bundle-light, client-side farm report generator. Instead of pulling in a
 * heavy PDF library (jsPDF / pdfmake / pdfkit — each 200KB+), we render a
 * styled, print-ready HTML document in a new browser window and trigger
 * `window.print()`. The browser's native "Save as PDF" dialog does the rest.
 *
 * The report is fully trilingual (EN / FR / AR) and includes:
 *   1. Farm header (name, location, date, crop, stage)
 *   2. Soil test summary with Fertility Score gauge
 *   3. Today's irrigation recommendation
 *   4. Today's fertilizer recommendation
 *   5. 4-day weather forecast
 *   6. Field records timeline (last 10 entries)
 *   7. Economics summary (revenue, cost, margin, ROI)
 *
 * SSR-safe: `generateFarmReport` is a no-op when `window` is undefined, so it
 * can be imported from server components without breaking.
 */

import type { Language } from './language-store';

// ---------------------------------------------------------------------------
// Report data shape — callers assemble this from localStorage stores.
// ---------------------------------------------------------------------------

export interface ReportFarmProfile {
  name: string;
  location: string;        // wilaya name, city, or lat/lng string
  lat?: number;
  lng?: number;
  areaHa?: number;
  crop?: string;           // crop id (e.g. 'potato')
  cropLabel?: string;      // localized crop name
  stage?: string;          // localized current stage label
  plantingDate?: string;   // ISO YYYY-MM-DD
  productionSystem?: string;
  irrigationSystem?: string;
}

export interface ReportSoilData {
  ph?: number;
  om?: number;             // organic matter %
  nPpm?: number;
  pPpm?: number;
  kPpm?: number;
  cec?: number;            // cmol/kg
  ec?: number;             // dS/m
  fertilityScore?: number; // 0-100
  fertilityBand?: string;  // localized band label
  testDate?: string;       // ISO date
  fieldName?: string;
}

export interface ReportIrrigation {
  etcMmPerDay?: number;        // mm/day
  totalM3PerDay?: number;     // m³/day
  durationMinutes?: number;   // minutes
  etoMmPerDay?: number;       // mm/day
  kc?: number;                // crop coefficient
  effectiveRainfallMm?: number;
  efficiency?: number;        // 0-1
}

export interface ReportFertilizer {
  product?: string;            // e.g. "NPK 15-15-15"
  npk?: string;                // "15-15-15"
  requiredProductKgPerHa?: number;
  totalProductKg?: number;
  requiredN?: number;          // kg/ha N
  requiredP?: number;          // kg/ha P
  requiredK?: number;          // kg/ha K
}

export interface ReportWeatherDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;     // mm
  weatherCode: number;          // WMO code
  et0?: number;                 // mm/day
}

export interface ReportFieldRecord {
  date: string;
  kind: string;                 // localized kind label
  title: string;
  summary: string;
  source?: string;              // localized source label
}

export interface ReportEconomics {
  totalRevenueDzd?: number;
  totalCostDzd?: number;
  grossMarginDzd?: number;
  roiPct?: number;
  expectedYieldTonsHa?: number;
  priceDzdPerKg?: number;
  breakEvenPriceDzdPerKg?: number;
}

export interface ReportData {
  farm: ReportFarmProfile;
  soil: ReportSoilData;
  irrigation?: ReportIrrigation;
  fertilizer?: ReportFertilizer;
  weather?: ReportWeatherDay[];
  records?: ReportFieldRecord[];
  economics?: ReportEconomics;
}

// ---------------------------------------------------------------------------
// Trilingual strings
// ---------------------------------------------------------------------------

interface ReportStrings {
  dir: 'ltr' | 'rtl';
  lang: string;
  title: string;
  subtitle: string;
  generatedOn: string;
  pageOf: string;
  farmHeader: string;
  location: string;
  area: string;
  crop: string;
  stage: string;
  plantingDate: string;
  productionSystem: string;
  irrigationSystem: string;
  soilSection: string;
  fertilityScore: string;
  soilTestDate: string;
  notAvailable: string;
  soilParamPh: string;
  soilParamOm: string;
  soilParamN: string;
  soilParamP: string;
  soilParamK: string;
  soilParamCec: string;
  soilParamEc: string;
  irrigationSection: string;
  irrigationVolume: string;
  irrigationDuration: string;
  irrigationEto: string;
  irrigationKc: string;
  irrigationRainfall: string;
  irrigationEfficiency: string;
  fertilizerSection: string;
  fertilizerProduct: string;
  fertilizerRate: string;
  fertilizerTotal: string;
  fertilizerNpk: string;
  weatherSection: string;
  weatherDate: string;
  weatherTemp: string;
  weatherRain: string;
  weatherEt0: string;
  recordsSection: string;
  recordsDate: string;
  recordsKind: string;
  recordsTitle: string;
  recordsSummary: string;
  recordsSource: string;
  recordsEmpty: string;
  economicsSection: string;
  econRevenue: string;
  econCost: string;
  econMargin: string;
  econRoi: string;
  econYield: string;
  econPrice: string;
  econBreakEven: string;
  footerNote: string;
  confidential: string;
  printHint: string;
}

const STRINGS: Record<Language, ReportStrings> = {
  en: {
    dir: 'ltr', lang: 'en',
    title: 'Farm Report',
    subtitle: 'Soil · Irrigation · Fertilizer · Weather · Records · Economics',
    generatedOn: 'Generated on',
    pageOf: 'Page',
    farmHeader: 'Farm Overview',
    location: 'Location',
    area: 'Area',
    crop: 'Crop',
    stage: 'Growth stage',
    plantingDate: 'Planting date',
    productionSystem: 'Production system',
    irrigationSystem: 'Irrigation system',
    soilSection: 'Soil Test Summary',
    fertilityScore: 'Fertility Score',
    soilTestDate: 'Test date',
    notAvailable: '—',
    soilParamPh: 'pH',
    soilParamOm: 'Organic Matter',
    soilParamN: 'Nitrogen (N)',
    soilParamP: 'Phosphorus (P)',
    soilParamK: 'Potassium (K)',
    soilParamCec: 'CEC',
    soilParamEc: 'EC (Salinity)',
    irrigationSection: "Today's Irrigation Recommendation",
    irrigationVolume: 'Volume',
    irrigationDuration: 'Duration',
    irrigationEto: 'ET₀',
    irrigationKc: 'Kc',
    irrigationRainfall: 'Effective rainfall',
    irrigationEfficiency: 'Efficiency',
    fertilizerSection: "Today's Fertilizer Recommendation",
    fertilizerProduct: 'Product',
    fertilizerRate: 'Rate',
    fertilizerTotal: 'Total for field',
    fertilizerNpk: 'NPK',
    weatherSection: '4-Day Weather Forecast',
    weatherDate: 'Date',
    weatherTemp: 'Temp (°C)',
    weatherRain: 'Rain (mm)',
    weatherEt0: 'ET₀ (mm)',
    recordsSection: 'Field Records Timeline',
    recordsDate: 'Date',
    recordsKind: 'Type',
    recordsTitle: 'Title',
    recordsSummary: 'Summary',
    recordsSource: 'Source',
    recordsEmpty: 'No field records yet.',
    economicsSection: 'Economics Summary',
    econRevenue: 'Expected revenue',
    econCost: 'Total cost',
    econMargin: 'Gross margin',
    econRoi: 'ROI',
    econYield: 'Expected yield',
    econPrice: 'Sale price',
    econBreakEven: 'Break-even price',
    footerNote: 'Generated by Formula Atlas — all values are advisory. Verify with local agronomist before action.',
    confidential: 'Confidential — for farm use only',
    printHint: 'Use your browser print dialog to save as PDF.',
  },
  fr: {
    dir: 'ltr', lang: 'fr',
    title: 'Rapport de Ferme',
    subtitle: 'Sol · Irrigation · Fertilisation · Météo · Registres · Économie',
    generatedOn: 'Généré le',
    pageOf: 'Page',
    farmHeader: 'Aperçu de la ferme',
    location: 'Localisation',
    area: 'Surface',
    crop: 'Culture',
    stage: 'Stade de croissance',
    plantingDate: 'Date de plantation',
    productionSystem: 'Système de production',
    irrigationSystem: "Système d'irrigation",
    soilSection: "Résumé de l'analyse de sol",
    fertilityScore: 'Score de fertilité',
    soilTestDate: "Date d'analyse",
    notAvailable: '—',
    soilParamPh: 'pH',
    soilParamOm: 'Matière organique',
    soilParamN: 'Azote (N)',
    soilParamP: 'Phosphore (P)',
    soilParamK: 'Potassium (K)',
    soilParamCec: 'CEC',
    soilParamEc: 'CE (Salinité)',
    irrigationSection: "Recommandation d'irrigation du jour",
    irrigationVolume: 'Volume',
    irrigationDuration: 'Durée',
    irrigationEto: 'ET₀',
    irrigationKc: 'Kc',
    irrigationRainfall: 'Pluie efficace',
    irrigationEfficiency: 'Efficacité',
    fertilizerSection: 'Recommandation de fertilisation du jour',
    fertilizerProduct: 'Produit',
    fertilizerRate: 'Dose',
    fertilizerTotal: 'Total parcelle',
    fertilizerNpk: 'NPK',
    weatherSection: 'Prévisions météo sur 4 jours',
    weatherDate: 'Date',
    weatherTemp: 'Temp (°C)',
    weatherRain: 'Pluie (mm)',
    weatherEt0: 'ET₀ (mm)',
    recordsSection: 'Chronologie des registres de parcelle',
    recordsDate: 'Date',
    recordsKind: 'Type',
    recordsTitle: 'Titre',
    recordsSummary: 'Résumé',
    recordsSource: 'Source',
    recordsEmpty: 'Aucun registre de parcelle.',
    economicsSection: 'Synthèse économique',
    econRevenue: 'Revenu attendu',
    econCost: 'Coût total',
    econMargin: 'Marge brute',
    econRoi: 'ROI',
    econYield: 'Rendement attendu',
    econPrice: 'Prix de vente',
    econBreakEven: 'Prix de seuil de rentabilité',
    footerNote: 'Généré par Formula Atlas — toutes les valeurs sont indicatives. Vérifiez avec un agronome local avant action.',
    confidential: 'Confidentiel — usage interne',
    printHint: 'Utilisez la boîte d\'impression du navigateur pour enregistrer en PDF.',
  },
  ar: {
    dir: 'rtl', lang: 'ar',
    title: 'تقرير المزرعة',
    subtitle: 'التربة · الري · التسميد · الطقس · السجلات · الاقتصاد',
    generatedOn: 'أُنشئ في',
    pageOf: 'صفحة',
    farmHeader: 'نظرة عامة على المزرعة',
    location: 'الموقع',
    area: 'المساحة',
    crop: 'المحصول',
    stage: 'مرحلة النمو',
    plantingDate: 'تاريخ الزراعة',
    productionSystem: 'نظام الإنتاج',
    irrigationSystem: 'نظام الري',
    soilSection: 'ملخص تحليل التربة',
    fertilityScore: 'درجة الخصوبة',
    soilTestDate: 'تاريخ التحليل',
    notAvailable: '—',
    soilParamPh: 'الحموضة',
    soilParamOm: 'المادة العضوية',
    soilParamN: 'الآزوت (N)',
    soilParamP: 'الفوسفور (P)',
    soilParamK: 'البوتاسيوم (K)',
    soilParamCec: 'سعة التبادل',
    soilParamEc: 'التوصيلية (الملوحة)',
    irrigationSection: 'توصية الري اليوم',
    irrigationVolume: 'الحجم',
    irrigationDuration: 'المدة',
    irrigationEto: 'ET₀',
    irrigationKc: 'Kc',
    irrigationRainfall: 'هطول فعّال',
    irrigationEfficiency: 'الكفاءة',
    fertilizerSection: 'توصية التسميد اليوم',
    fertilizerProduct: 'المنتج',
    fertilizerRate: 'المعدل',
    fertilizerTotal: 'إجمالي الحقل',
    fertilizerNpk: 'NPK',
    weatherSection: 'توقعات الطقس 4 أيام',
    weatherDate: 'التاريخ',
    weatherTemp: 'الحرارة (°م)',
    weatherRain: 'المطر (ملم)',
    weatherEt0: 'ET₀ (ملم)',
    recordsSection: 'السجل الزمني لحقلك',
    recordsDate: 'التاريخ',
    recordsKind: 'النوع',
    recordsTitle: 'العنوان',
    recordsSummary: 'الملخص',
    recordsSource: 'المصدر',
    recordsEmpty: 'لا توجد سجلات حقلية بعد.',
    economicsSection: 'ملخص الاقتصاد',
    econRevenue: 'الإيراد المتوقع',
    econCost: 'التكلفة الإجمالية',
    econMargin: 'الهامش الإجمالي',
    econRoi: 'العائد على الاستثمار',
    econYield: 'الإنتاج المتوقع',
    econPrice: 'سعر البيع',
    econBreakEven: 'سعر التعادل',
    footerNote: 'أُنشئ بواسطة Formula Atlas — جميع القيم استشارية. تحقق مع مهندس زراعي محلي قبل اتخاذ أي إجراء.',
    confidential: 'سري — للاستخدام الداخلي للمزرعة',
    printHint: 'استخدم نافذة الطباعة في المتصفح لحفظ الملف كـ PDF.',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number | undefined | null, digits = 1, unit = ''): string {
  if (n == null || !Number.isFinite(n)) return STRINGS.en.notAvailable;
  return `${n.toFixed(digits)}${unit ? ' ' + unit : ''}`;
}

function fmtInt(n: number | undefined | null, unit = ''): string {
  if (n == null || !Number.isFinite(n)) return STRINGS.en.notAvailable;
  return `${Math.round(n).toLocaleString('en-US')}${unit ? ' ' + unit : ''}`;
}

function fmtDzd(n: number | undefined | null): string {
  if (n == null || !Number.isFinite(n)) return STRINGS.en.notAvailable;
  return `${Math.round(n).toLocaleString('en-US')} دج`;
}

function fmtDate(iso: string | undefined, lang: Language): string {
  if (!iso) return STRINGS.en.notAvailable;
  const d = new Date(iso.length > 10 ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const locale = lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-FR' : 'en-GB';
  try {
    return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wmoEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 3) return '🌤️';
  if (code <= 48) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '🌨️';
  if (code >= 95) return '⛈️';
  return '🌡️';
}

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------

function renderFarmHeader(s: ReportStrings, data: ReportData): string {
  const f = data.farm;
  const row = (label: string, value: string | undefined) => `
    <div class="kv">
      <span class="kv-label">${escapeHtml(label)}</span>
      <span class="kv-value">${escapeHtml(value || s.notAvailable)}</span>
    </div>`;
  return `
    <section class="card">
      <h2 class="card-title">${escapeHtml(s.farmHeader)}</h2>
      <div class="kv-grid">
        ${row(s.location, f.location)}
        ${row(s.area, f.areaHa != null ? fmt(f.areaHa, 2, 'ha') : undefined)}
        ${row(s.crop, f.cropLabel)}
        ${row(s.stage, f.stage)}
        ${row(s.plantingDate, f.plantingDate ? fmtDate(f.plantingDate, s.lang as Language) : undefined)}
        ${row(s.productionSystem, f.productionSystem)}
        ${row(s.irrigationSystem, f.irrigationSystem)}
      </div>
    </section>`;
}

function renderFertilityGauge(s: ReportStrings, score: number): string {
  // SVG arc gauge: 0-100, semicircle
  const clamped = Math.max(0, Math.min(100, score));
  const angle = (clamped / 100) * 180;
  const rad = (Math.PI * (180 - angle)) / 180;
  const cx = 90, cy = 90, r = 70;
  const x = cx + r * Math.cos(rad);
  const y = cy - r * Math.sin(rad);
  const largeArc = angle > 180 ? 1 : 0;
  const color = clamped >= 75 ? '#16a34a' : clamped >= 50 ? '#f59e0b' : clamped >= 30 ? '#f97316' : '#dc2626';
  return `
    <div class="gauge">
      <svg viewBox="0 0 180 110" width="180" height="110" aria-label="${escapeHtml(s.fertilityScore)}">
        <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke="#e2e8f0" stroke-width="14" stroke-linecap="round"/>
        <path d="M 20 90 A 70 70 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round"/>
        <text x="90" y="80" text-anchor="middle" font-size="32" font-weight="700" fill="${color}">${Math.round(clamped)}</text>
        <text x="90" y="100" text-anchor="middle" font-size="10" fill="#64748b">/ 100</text>
      </svg>
    </div>`;
}

function renderSoilSection(s: ReportStrings, data: ReportData): string {
  const soil = data.soil;
  const tile = (label: string, value: string | undefined) => `
    <div class="soil-tile">
      <div class="soil-tile-label">${escapeHtml(label)}</div>
      <div class="soil-tile-value">${escapeHtml(value || s.notAvailable)}</div>
    </div>`;
  const tiles = [
    tile(s.soilParamPh, soil.ph != null ? fmt(soil.ph, 2) : undefined),
    tile(s.soilParamOm, soil.om != null ? fmt(soil.om, 2, '%') : undefined),
    tile(s.soilParamN, soil.nPpm != null ? fmtInt(soil.nPpm, 'ppm') : undefined),
    tile(s.soilParamP, soil.pPpm != null ? fmtInt(soil.pPpm, 'ppm') : undefined),
    tile(s.soilParamK, soil.kPpm != null ? fmtInt(soil.kPpm, 'ppm') : undefined),
    tile(s.soilParamCec, soil.cec != null ? fmt(soil.cec, 1, 'cmol/kg') : undefined),
    tile(s.soilParamEc, soil.ec != null ? fmt(soil.ec, 2, 'dS/m') : undefined),
  ].join('');
  const gauge = soil.fertilityScore != null
    ? renderFertilityGauge(s, soil.fertilityScore)
    : `<div class="gauge-empty">${escapeHtml(s.notAvailable)}</div>`;
  const band = soil.fertilityBand ? `<div class="band">${escapeHtml(soil.fertilityBand)}</div>` : '';
  const dateLine = soil.testDate
    ? `<div class="meta-line">${escapeHtml(s.soilTestDate)}: ${escapeHtml(fmtDate(soil.testDate, s.lang as Language))}</div>`
    : '';
  const fieldLine = soil.fieldName ? `<div class="meta-line">${escapeHtml(soil.fieldName)}</div>` : '';
  return `
    <section class="card">
      <h2 class="card-title">${escapeHtml(s.soilSection)}</h2>
      ${fieldLine}${dateLine}
      <div class="soil-layout">
        <div class="soil-tiles">${tiles}</div>
        <div class="soil-gauge">
          <div class="gauge-label">${escapeHtml(s.fertilityScore)}</div>
          ${gauge}
          ${band}
        </div>
      </div>
    </section>`;
}

function renderIrrigationSection(s: ReportStrings, data: ReportData): string {
  const ir = data.irrigation;
  if (!ir) return '';
  const tile = (label: string, value: string | undefined, color: string) => `
    <div class="irr-tile" style="border-color:${color}">
      <div class="irr-tile-label">${escapeHtml(label)}</div>
      <div class="irr-tile-value" style="color:${color}">${escapeHtml(value || s.notAvailable)}</div>
    </div>`;
  return `
    <section class="card">
      <h2 class="card-title">${escapeHtml(s.irrigationSection)}</h2>
      <div class="irr-grid">
        ${tile(s.irrigationVolume, ir.totalM3PerDay != null ? fmt(ir.totalM3PerDay, 1, 'm³') : undefined, '#0ea5e9')}
        ${tile(s.irrigationDuration, ir.durationMinutes != null ? fmtInt(ir.durationMinutes, 'min') : undefined, '#0284c7')}
        ${tile(s.irrigationEto, ir.etoMmPerDay != null ? fmt(ir.etoMmPerDay, 2, 'mm') : undefined, '#0369a1')}
        ${tile(s.irrigationKc, ir.kc != null ? fmt(ir.kc, 2) : undefined, '#0d9488')}
        ${tile(s.irrigationRainfall, ir.effectiveRainfallMm != null ? fmt(ir.effectiveRainfallMm, 1, 'mm') : undefined, '#0891b2')}
        ${tile(s.irrigationEfficiency, ir.efficiency != null ? fmt(ir.efficiency * 100, 0, '%') : undefined, '#16a34a')}
      </div>
    </section>`;
}

function renderFertilizerSection(s: ReportStrings, data: ReportData): string {
  const f = data.fertilizer;
  if (!f) return '';
  const tile = (label: string, value: string | undefined) => `
    <div class="fert-tile">
      <div class="fert-tile-label">${escapeHtml(label)}</div>
      <div class="fert-tile-value">${escapeHtml(value || s.notAvailable)}</div>
    </div>`;
  return `
    <section class="card">
      <h2 class="card-title">${escapeHtml(s.fertilizerSection)}</h2>
      <div class="fert-grid">
        ${tile(s.fertilizerProduct, f.product)}
        ${tile(s.fertilizerNpk, f.npk)}
        ${tile(s.fertilizerRate, f.requiredProductKgPerHa != null ? fmtInt(f.requiredProductKgPerHa, 'kg/ha') : undefined)}
        ${tile(s.fertilizerTotal, f.totalProductKg != null ? fmtInt(f.totalProductKg, 'kg') : undefined)}
      </div>
      ${(f.requiredN != null || f.requiredP != null || f.requiredK != null) ? `
        <div class="npk-strip">
          <span><strong>N:</strong> ${escapeHtml(f.requiredN != null ? fmtInt(f.requiredN, 'kg/ha') : s.notAvailable)}</span>
          <span><strong>P:</strong> ${escapeHtml(f.requiredP != null ? fmtInt(f.requiredP, 'kg/ha') : s.notAvailable)}</span>
          <span><strong>K:</strong> ${escapeHtml(f.requiredK != null ? fmtInt(f.requiredK, 'kg/ha') : s.notAvailable)}</span>
        </div>` : ''}
    </section>`;
}

function renderWeatherSection(s: ReportStrings, data: ReportData): string {
  const days = (data.weather || []).slice(0, 4);
  if (days.length === 0) return '';
  const rows = days.map(d => `
    <tr>
      <td class="weather-emoji">${wmoEmoji(d.weatherCode)}</td>
      <td>${escapeHtml(fmtDate(d.date, s.lang as Language))}</td>
      <td>${fmt(d.tempMin, 0)} – ${fmt(d.tempMax, 0)} °C</td>
      <td>${fmt(d.precipitationSum, 1)} mm</td>
      <td>${d.et0 != null ? fmt(d.et0, 1) + ' mm' : s.notAvailable}</td>
    </tr>`).join('');
  return `
    <section class="card">
      <h2 class="card-title">${escapeHtml(s.weatherSection)}</h2>
      <table class="weather-table">
        <thead><tr>
          <th></th>
          <th>${escapeHtml(s.weatherDate)}</th>
          <th>${escapeHtml(s.weatherTemp)}</th>
          <th>${escapeHtml(s.weatherRain)}</th>
          <th>${escapeHtml(s.weatherEt0)}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
}

function renderRecordsSection(s: ReportStrings, data: ReportData): string {
  const recs = (data.records || []).slice(0, 10);
  if (recs.length === 0) {
    return `
      <section class="card">
        <h2 class="card-title">${escapeHtml(s.recordsSection)}</h2>
        <p class="empty">${escapeHtml(s.recordsEmpty)}</p>
      </section>`;
  }
  const rows = recs.map(r => `
    <tr>
      <td>${escapeHtml(fmtDate(r.date, s.lang as Language))}</td>
      <td><span class="kind-badge">${escapeHtml(r.kind)}</span></td>
      <td><strong>${escapeHtml(r.title)}</strong><br/><span class="summary">${escapeHtml(r.summary)}</span></td>
      <td class="src">${escapeHtml(r.source || '')}</td>
    </tr>`).join('');
  return `
    <section class="card">
      <h2 class="card-title">${escapeHtml(s.recordsSection)}</h2>
      <table class="records-table">
        <thead><tr>
          <th>${escapeHtml(s.recordsDate)}</th>
          <th>${escapeHtml(s.recordsKind)}</th>
          <th>${escapeHtml(s.recordsTitle)}</th>
          <th>${escapeHtml(s.recordsSource)}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
}

function renderEconomicsSection(s: ReportStrings, data: ReportData): string {
  const e = data.economics;
  if (!e) return '';
  const tile = (label: string, value: string | undefined, color: string) => `
    <div class="econ-tile" style="border-color:${color}">
      <div class="econ-tile-label">${escapeHtml(label)}</div>
      <div class="econ-tile-value" style="color:${color}">${escapeHtml(value || s.notAvailable)}</div>
    </div>`;
  const marginColor = (e.grossMarginDzd ?? 0) >= 0 ? '#16a34a' : '#dc2626';
  const roiColor = (e.roiPct ?? 0) >= 0 ? '#16a34a' : '#dc2626';
  return `
    <section class="card">
      <h2 class="card-title">${escapeHtml(s.economicsSection)}</h2>
      <div class="econ-grid">
        ${tile(s.econRevenue, e.totalRevenueDzd != null ? fmtDzd(e.totalRevenueDzd) : undefined, '#0ea5e9')}
        ${tile(s.econCost, e.totalCostDzd != null ? fmtDzd(e.totalCostDzd) : undefined, '#f97316')}
        ${tile(s.econMargin, e.grossMarginDzd != null ? fmtDzd(e.grossMarginDzd) : undefined, marginColor)}
        ${tile(s.econRoi, e.roiPct != null ? fmt(e.roiPct, 0, '%') : undefined, roiColor)}
        ${tile(s.econYield, e.expectedYieldTonsHa != null ? fmt(e.expectedYieldTonsHa, 1, 't/ha') : undefined, '#7c3aed')}
        ${tile(s.econPrice, e.priceDzdPerKg != null ? fmtDzd(e.priceDzdPerKg * 1000) + '/t' : undefined, '#0891b2')}
        ${tile(s.econBreakEven, e.breakEvenPriceDzdPerKg != null ? fmtDzd(e.breakEvenPriceDzdPerKg * 1000) + '/t' : undefined, '#64748b')}
      </div>
    </section>`;
}

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------

function buildCss(s: ReportStrings): string {
  const fontFamily = s.lang === 'ar'
    ? "'Cairo','Tajawal','Segoe UI',system-ui,sans-serif"
    : "'Segoe UI',system-ui,-apple-system,sans-serif";
  return `
    * { box-sizing: border-box; }
    @page { size: A4; margin: 14mm; }
    body {
      font-family: ${fontFamily};
      color: #0f172a;
      background: #fff;
      margin: 0;
      padding: 20px;
      line-height: 1.5;
      font-size: 12px;
      direction: ${s.dir};
    }
    .report-header {
      background: linear-gradient(135deg, #4c1d95, #6d28d9);
      color: #fff;
      padding: 18px 24px;
      border-radius: 12px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .report-header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .report-header .subtitle { font-size: 11px; opacity: 0.9; margin-top: 2px; }
    .report-header .meta { font-size: 10px; opacity: 0.85; text-align: ${s.dir === 'rtl' ? 'left' : 'right'}; }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 14px;
      background: #fff;
      page-break-inside: avoid;
    }
    .card-title {
      font-size: 13px;
      font-weight: 700;
      color: #6d28d9;
      margin: 0 0 10px 0;
      padding-bottom: 6px;
      border-bottom: 2px solid #ede9fe;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .card-title::before { content: '●'; color: #8b5cf6; font-size: 10px; }
    .kv-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 8px;
    }
    .kv {
      background: #f8fafc;
      border-radius: 6px;
      padding: 6px 10px;
      border: 1px solid #f1f5f9;
    }
    .kv-label { display: block; font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .kv-value { display: block; font-size: 12px; font-weight: 600; color: #0f172a; margin-top: 2px; }
    .meta-line { font-size: 10px; color: #64748b; margin-bottom: 6px; }
    .soil-layout { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .soil-tiles {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
      gap: 6px;
      flex: 1;
      min-width: 240px;
    }
    .soil-tile {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 6px 8px;
      text-align: center;
    }
    .soil-tile-label { font-size: 9px; color: #15803d; text-transform: uppercase; }
    .soil-tile-value { font-size: 14px; font-weight: 700; color: #166534; margin-top: 2px; }
    .soil-gauge { text-align: center; min-width: 180px; }
    .gauge-label { font-size: 10px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
    .gauge svg { display: block; margin: 0 auto; }
    .gauge-empty { font-size: 24px; color: #cbd5e1; padding: 30px 0; }
    .band {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 999px;
      background: #ede9fe;
      color: #6d28d9;
      font-size: 10px;
      font-weight: 600;
      margin-top: 6px;
    }
    .irr-grid, .fert-grid, .econ-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
    }
    .irr-tile, .fert-tile, .econ-tile {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 10px;
      text-align: center;
    }
    .irr-tile-label, .fert-tile-label, .econ-tile-label { font-size: 9px; color: #64748b; text-transform: uppercase; }
    .irr-tile-value, .fert-tile-value, .econ-tile-value { font-size: 16px; font-weight: 700; margin-top: 2px; }
    .npk-strip {
      display: flex;
      gap: 14px;
      margin-top: 10px;
      padding: 8px 12px;
      background: #fef3c7;
      border: 1px solid #fde68a;
      border-radius: 6px;
      font-size: 11px;
    }
    .weather-table, .records-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .weather-table th, .records-table th {
      background: #f1f5f9;
      padding: 6px 8px;
      text-align: ${s.dir === 'rtl' ? 'right' : 'left'};
      font-size: 10px;
      color: #475569;
      text-transform: uppercase;
      border-bottom: 1px solid #e2e8f0;
    }
    .weather-table td, .records-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }
    .weather-emoji { font-size: 14px; text-align: center; }
    .kind-badge {
      display: inline-block;
      padding: 1px 8px;
      border-radius: 999px;
      background: #ede9fe;
      color: #6d28d9;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .summary { font-size: 10px; color: #64748b; }
    .src { font-size: 9px; color: #94a3b8; text-transform: uppercase; }
    .empty { color: #94a3b8; font-style: italic; padding: 8px 0; }
    .footer {
      margin-top: 20px;
      padding: 10px 14px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #64748b;
      text-align: center;
    }
    .footer .confidential { font-weight: 600; color: #475569; margin-bottom: 4px; }
    .print-banner {
      background: #fef3c7;
      border: 1px solid #fde68a;
      border-radius: 6px;
      padding: 8px 14px;
      margin-bottom: 14px;
      font-size: 11px;
      color: #92400e;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      .print-banner { display: none; }
      .card { page-break-inside: avoid; }
    }
  `;
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

/**
 * Generate a trilingual farm report and open it in a new window for printing.
 *
 * SSR-safe: no-op when `window` is undefined (server render).
 */
export function generateFarmReport(language: Language, data: ReportData): void {
  if (typeof window === 'undefined') return;
  const s = STRINGS[language] || STRINGS.en;

  const now = new Date();
  const generatedDate = now.toLocaleDateString(
    language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-GB',
    { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  );

  const html = `<!DOCTYPE html>
<html lang="${s.lang}" dir="${s.dir}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(s.title)} — ${escapeHtml(data.farm.name || '')}</title>
<style>${buildCss(s)}</style>
</head>
<body>
  <div class="print-banner">${escapeHtml(s.printHint)}</div>
  <div class="report-header">
    <div>
      <h1>${escapeHtml(s.title)}${data.farm.name ? ' — ' + escapeHtml(data.farm.name) : ''}</h1>
      <div class="subtitle">${escapeHtml(s.subtitle)}</div>
    </div>
    <div class="meta">
      <div>${escapeHtml(s.generatedOn)}: ${escapeHtml(generatedDate)}</div>
      <div>Formula Atlas</div>
    </div>
  </div>
  ${renderFarmHeader(s, data)}
  ${renderSoilSection(s, data)}
  ${renderIrrigationSection(s, data)}
  ${renderFertilizerSection(s, data)}
  ${renderWeatherSection(s, data)}
  ${renderRecordsSection(s, data)}
  ${renderEconomicsSection(s, data)}
  <div class="footer">
    <div class="confidential">${escapeHtml(s.confidential)}</div>
    <div>${escapeHtml(s.footerNote)}</div>
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 400);
    });
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    // Pop-up blocked — fall back to in-page document write
    const doc = document.implementation.createHTMLDocument(s.title);
    doc.documentElement.innerHTML = html;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `farm-report-${(data.farm.name || 'farm').replace(/\s+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
