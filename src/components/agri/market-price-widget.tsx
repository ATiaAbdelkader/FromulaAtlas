'use client';

/**
 * MarketPriceWidget (Feature #12)
 * ================================
 *
 * A crowd-sourced market price tracker for Algerian farmers. Farmers can:
 *   - Report prices they've seen at their local market
 *   - View min / avg / max prices for a crop (computed from all reports)
 *   - See a 30-day trend chart (simple inline SVG)
 *   - Browse recent reports from "other farmers" (seeded + their own)
 *
 * - Uses CalculatorShell with `accent="amber"`, `icon={DollarSign}`,
 *   `badge="Crowd-Sourced"`.
 * - SSR-safe: all localStorage access is guarded behind `useEffect`.
 * - Trilingual: all UI strings are localized EN/FR/AR via `copyFor`.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DollarSign, TrendingUp, TrendingDown, Plus, RotateCcw, MapPin, Store,
  Calendar, Users, AlertCircle,
} from 'lucide-react';
import {
  CalculatorShell, type TrilingualString, type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';
import { useTranslation, copyFor } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  savePriceReport, getPriceReports, getAveragePrice, getPriceTrend,
  listCrops, resetToSeed, MARKET_CROPS, localizeCrop, REPORTER_TYPE_LABELS,
  type MarketPriceReport, type ReporterType, type PriceTrendPoint,
} from '@/lib/market-price-store';
import { ALL_58_WILAYAS } from '@/lib/algeria-wilayas-58';

// ---------------------------------------------------------------------------
// Localized strings
// ---------------------------------------------------------------------------

const TITLE: TrilingualString = {
  en: 'Market Prices',
  ar: 'أسعار السوق',
  fr: 'Prix du Marché',
};

const DESC: TrilingualString = {
  en: 'Crowd-sourced local market prices — report what you saw at your market, see what other farmers are reporting, and track 30-day price trends for your crop. All data stays in your browser.',
  ar: 'أسعار السوق المحلية بمساهمة المزارعين — سجّل ما رأيته في سوقك، اطّلع على ما يُبلّغ عنه المزارعون الآخرون، وتابع اتجاه الأسعار لمدة 30 يوماً لمحصولك. كل البيانات تبقى في متصفحك.',
  fr: 'Prix de marché locaux collaboratifs — signalez les prix vus sur votre marché, consultez les signalements d\'autres agriculteurs et suivez les tendances sur 30 jours. Toutes les données restent dans votre navigateur.',
};

const PILL_LABEL: TrilingualString = { en: 'Crop:', ar: 'المحصول:', fr: 'Culture :' };

// ---------------------------------------------------------------------------
// Inline SVG sparkline / trend chart
// ---------------------------------------------------------------------------

function TrendChart({
  points, language,
}: { points: PriceTrendPoint[]; language: 'en' | 'fr' | 'ar' }) {
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  if (!points.length) {
    return (
      <div className="text-xs text-muted-foreground italic py-6 text-center">
        {tr('No trend data yet.', 'لا توجد بيانات اتجاه بعد.', 'Pas encore de données de tendance.')}
      </div>
    );
  }
  const W = 480, H = 140, P = 28;
  const values = points.map(p => p.avg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = points.length > 1 ? (W - P * 2) / (points.length - 1) : 0;
  const xy = points.map((p, i) => {
    const x = P + i * stepX;
    const y = H - P - ((p.avg - min) / range) * (H - P * 2);
    return { x, y, p };
  });
  const linePath = xy.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${xy[xy.length - 1].x.toFixed(1)} ${H - P} L ${xy[0].x.toFixed(1)} ${H - P} Z`;
  const lastPt = xy[xy.length - 1];
  const firstPt = xy[0];
  const change = lastPt.p.avg - firstPt.p.avg;
  const changePct = firstPt.p.avg > 0 ? (change / firstPt.p.avg) * 100 : 0;
  const trendUp = change >= 0;

  // Y-axis ticks (3 ticks)
  const ticks = [max, (max + min) / 2, min];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">
          {tr('30-day trend', 'اتجاه 30 يوماً', 'Tendance 30 jours')} ·{' '}
          <span className="font-mono">{min.toFixed(0)}–{max.toFixed(0)} دج/kg</span>
        </span>
        <Badge variant="outline" className={`text-[10px] gap-1 ${trendUp ? 'text-amber-700 border-amber-300' : 'text-emerald-700 border-emerald-300'}`}>
          {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {changePct >= 0 ? '+' : ''}{changePct.toFixed(1)}%
        </Badge>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={tr('Price trend chart', 'رسم اتجاه الأسعار', 'Graphique de tendance des prix')}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Grid lines + Y-axis labels */}
        {ticks.map((t, i) => {
          const y = H - P - ((t - min) / range) * (H - P * 2);
          return (
            <g key={i}>
              <line x1={P} y1={y} x2={W - P} y2={y} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2 3" />
              <text x={P - 4} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                {Math.round(t)}
              </text>
            </g>
          );
        })}
        {/* Area + line */}
        <path d={areaPath} fill="url(#trendFill)" />
        <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* Last-point dot */}
        <circle cx={lastPt.x} cy={lastPt.y} r="3.5" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
        {/* X-axis labels (first + last) */}
        <text x={firstPt.x} y={H - P + 12} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">
          {firstPt.p.date.slice(5)}
        </text>
        <text x={lastPt.x} y={H - P + 12} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">
          {lastPt.p.date.slice(5)}
        </text>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MarketPriceWidget() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  const [activeCrop, setActiveCrop] = useState<string>('potato');
  const [reports, setReports] = useState<MarketPriceReport[]>([]);
  const [stats, setStats] = useState({ min: 0, max: 0, avg: 0, count: 0 });
  const [trend, setTrend] = useState<PriceTrendPoint[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Report-a-price form state
  const [formCrop, setFormCrop] = useState('potato');
  const [formPrice, setFormPrice] = useState('');
  const [formMarket, setFormMarket] = useState('');
  const [formWilaya, setFormWilaya] = useState('Alger');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formReporter, setFormReporter] = useState<ReporterType>('farmer');

  const refresh = useCallback(() => {
    setReports(getPriceReports(activeCrop));
    setStats(getAveragePrice(activeCrop));
    setTrend(getPriceTrend(activeCrop, 30));
  }, [activeCrop]);

  useEffect(() => {
    setHydrated(true);
    refresh();
  }, [refresh]);

  // Whenever the crop changes, also update the form's crop default
  useEffect(() => {
    setFormCrop(activeCrop);
  }, [activeCrop]);

  const pills: CalculatorPill[] = MARKET_CROPS.map(c => ({
    key: c.id,
    emoji: c.emoji,
    label: localizeCrop(language, c.id),
  }));

  const handleReport = useCallback(() => {
    const price = parseFloat(formPrice);
    if (!Number.isFinite(price) || price <= 0) {
      toast({
        title: tr('Enter a valid price', 'أدخل سعراً صالحاً', 'Saisissez un prix valide'),
        variant: 'destructive',
      });
      return;
    }
    if (!formMarket.trim()) {
      toast({
        title: tr('Enter a market name', 'أدخل اسم السوق', 'Saisissez le nom du marché'),
        variant: 'destructive',
      });
      return;
    }
    const report: MarketPriceReport = {
      id: '',
      crop: formCrop,
      priceDzdPerKg: Math.round(price * 100) / 100,
      marketName: formMarket.trim(),
      wilaya: formWilaya,
      date: formDate,
      reporterType: formReporter,
    };
    savePriceReport(report);
    setFormPrice('');
    setFormMarket('');
    toast({
      title: tr('Price reported!', 'تم تسجيل السعر!', 'Prix signalé !'),
      description: `${localizeCrop(language, formCrop)} · ${price.toFixed(2)} دج/kg · ${formMarket}`,
    });
    // If the reported crop is the active one, refresh immediately
    if (formCrop === activeCrop) refresh();
  }, [formCrop, formPrice, formMarket, formWilaya, formDate, formReporter, activeCrop, refresh, language, tr]);

  const handleReset = useCallback(() => {
    resetToSeed();
    refresh();
    toast({
      title: tr('Reset to seed data', 'إعادة التعيين للبيانات الأولية', 'Réinitialisé aux données initiales'),
      description: tr('50 seed price reports restored.', 'تمت استعادة 50 تقرير سعر أولي.', '50 signalements initiaux restaurés.'),
    });
  }, [refresh, tr]);

  // Recent reports for the active crop (cap at 12)
  const recentReports = useMemo(() => reports.slice(0, 12), [reports]);

  const avgDisplay = hydrated && stats.count > 0 ? stats.avg.toFixed(2) : '—';
  const minDisplay = hydrated && stats.count > 0 ? stats.min.toFixed(2) : '—';
  const maxDisplay = hydrated && stats.count > 0 ? stats.max.toFixed(2) : '—';

  return (
    <CalculatorShell
      icon={DollarSign}
      title={TITLE}
      description={DESC}
      badge="Crowd-Sourced"
      accent="amber"
      actions={[
        {
          icon: RotateCcw,
          label: { en: 'Reset to seed', ar: 'إعادة للبيانات الأولية', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      pills={pills}
      activePill={activeCrop}
      onPillClick={setActiveCrop}
      pillLabel={PILL_LABEL}
      protocolNote={{
        en: 'All prices are reported by farmers, traders and extension agents — no central authority. Treat as indicative. Data is stored locally in your browser and shared only via export.',
        ar: 'جميع الأسعار يُبلّغ عنها المزارعون والتجار والمرشدون الفلاحيون — لا توجد جهة مركزية. اعتبرها إرشادية. تُخزّن البيانات محلياً في متصفحك ولا تُشارك إلا عبر التصدير.',
        fr: 'Tous les prix sont signalés par des agriculteurs, commerçants et conseillers agricoles — aucune autorité centrale. À titre indicatif. Données stockées localement et partageables via export.',
      }}
    >
      {/* INPUTS column: report-a-price form */}
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <Plus className="h-4 w-4 text-amber-600" />
              {tr('Report a Price', 'سجّل سعراً', 'Signaler un prix')}
            </span>
            <Badge variant="outline" className="text-[10px]">
              {tr('Local market', 'سوق محلي', 'Marché local')}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">{tr('Crop', 'المحصول', 'Culture')}</Label>
              <select
                value={formCrop}
                onChange={(e) => setFormCrop(e.target.value)}
                className="h-9 w-full rounded-md border bg-background px-3 text-xs font-semibold"
              >
                {MARKET_CROPS.map(c => (
                  <option key={c.id} value={c.id}>{c.emoji} {localizeCrop(language, c.id)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">{tr('Price (DZD/kg)', 'السعر (دج/كغ)', 'Prix (DZD/kg)')}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="65.00"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="h-9 text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs font-bold flex items-center gap-1">
                <Store className="h-3 w-3" /> {tr('Market name', 'اسم السوق', 'Nom du marché')}
              </Label>
              <Input
                type="text"
                placeholder={tr('e.g. Souk El Sebt', 'مثال: سوق السبت', 'ex. Souk El Sebt')}
                value={formMarket}
                onChange={(e) => setFormMarket(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {tr('Wilaya', 'الولاية', 'Wilaya')}
              </Label>
              <select
                value={formWilaya}
                onChange={(e) => setFormWilaya(e.target.value)}
                className="h-9 w-full rounded-md border bg-background px-3 text-xs"
              >
                {ALL_58_WILAYAS.map(w => (
                  <option key={w.code} value={w.nameEn}>
                    {language === 'ar' ? w.nameAr : language === 'fr' ? w.nameFr : w.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {tr('Date', 'التاريخ', 'Date')}
              </Label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs font-bold flex items-center gap-1">
                <Users className="h-3 w-3" /> {tr('You are', 'أنت', 'Vous êtes')}
              </Label>
              <div className="flex gap-2">
                {(['farmer', 'trader', 'extension_agent'] as ReporterType[]).map(rt => (
                  <button
                    key={rt}
                    onClick={() => setFormReporter(rt)}
                    className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                      formReporter === rt
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-muted/40 hover:bg-muted/70 text-foreground'
                    }`}
                  >
                    {REPORTER_TYPE_LABELS[rt][language]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={handleReport}
            className="w-full h-10 gap-2 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Plus className="h-4 w-4" />
            {tr('Submit Report', 'إرسال البلاغ', 'Envoyer le signalement')}
          </Button>
        </div>
      </CalculatorShell.Inputs>

      {/* RESULTS column: stats + chart + recent reports */}
      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              💰 {tr('Current Prices', 'الأسعار الحالية', 'Prix actuels')}
            </span>
            <Badge variant="outline" className="text-[10px]">
              {hydrated ? `${stats.count} ${tr('reports', 'بلاغات', 'signalements')}` : '—'}
            </Badge>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-2">
            <CalculatorShell.MetricTile
              label={tr('Min', 'الأدنى', 'Min')}
              value={minDisplay}
              unit="دج/kg"
              color="emerald"
            />
            <CalculatorShell.MetricTile
              label={tr('Average', 'المتوسط', 'Moyen')}
              value={avgDisplay}
              unit="دج/kg"
              color="amber"
            />
            <CalculatorShell.MetricTile
              label={tr('Max', 'الأعلى', 'Max')}
              value={maxDisplay}
              unit="دج/kg"
              color="rose"
            />
          </div>

          {/* Trend chart */}
          <div className="p-3 rounded-xl border bg-muted/20">
            <TrendChart points={trend} language={language} />
          </div>

          {/* Recent reports */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold flex items-center justify-between">
              <span>{tr('Recent reports', 'بلاغات حديثة', 'Signalements récents')}</span>
              <span>{recentReports.length}</span>
            </div>
            {recentReports.length === 0 ? (
              <div className="text-xs text-muted-foreground italic py-3 text-center flex items-center justify-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                {tr('No reports for this crop yet.', 'لا توجد بلاغات لهذا المحصول بعد.', 'Aucun signalement pour cette culture.')}
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-1.5">
                {recentReports.map((r, i) => (
                  <div
                    key={r.id || i}
                    className="flex items-start gap-2 p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold font-mono text-amber-700 dark:text-amber-400">
                          {r.priceDzdPerKg.toFixed(2)} دج/kg
                        </span>
                        <Badge variant="outline" className="text-[9px]">
                          {REPORTER_TYPE_LABELS[r.reporterType][language]}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        <Store className="h-3 w-3 inline mr-1" />
                        {r.marketName} · {r.wilaya}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {r.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
