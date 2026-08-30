'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Sparkles,
  Leaf,
  Activity,
  Layers,
  Download,
  Calendar,
  Sprout,
  ShieldCheck,
  Copy,
  RotateCcw,
} from 'lucide-react';
import { type SoilTestEntry } from '@/lib/soil-history-store';
import { useTranslation, copyFor } from '@/lib/language-store';
import {
  CalculatorShell,
  type TrilingualString,
  type CalculatorAction,
} from '@/components/agri/nutri-tools/CalculatorShell';
import { toast } from '@/hooks/use-toast';

export interface SoilMultiYearTrendsChartProps {
  entries: SoilTestEntry[];
  selectedField: string;
  className?: string;
}

type ChartLayoutMode = 'combined' | 'split' | 'ph' | 'om' | 'cec';

interface MetricConfig {
  key: 'ph' | 'om' | 'cec';
  label: string;
  label_ar: string;
  label_fr: string;
  unit: string;
  color: string;
  gradientStart: string;
  gradientEnd: string;
  optimalRange: [number, number];
  minDomain: number;
  maxDomain: number;
  description: string;
  description_ar: string;
  description_fr: string;
}

const METRIC_CONFIGS: Record<'ph' | 'om' | 'cec', MetricConfig> = {
  ph: {
    key: 'ph',
    label: 'Soil pH (1:2.5)',
    label_ar: 'حموضة التربة (pH)',
    label_fr: 'pH du Sol',
    unit: '',
    color: '#3b82f6', // blue
    gradientStart: '#60a5fa',
    gradientEnd: '#1d4ed8',
    optimalRange: [6.2, 7.3],
    minDomain: 4.5,
    maxDomain: 8.8,
    description: 'Optimal nutrient bioavailability is between 6.2 - 7.3',
    description_ar: 'النطاق الأمثل لجاهزية العناصر الغذائية بين 6.2 و 7.3',
    description_fr: 'Disponibilité maximale des nutriments entre 6.2 et 7.3',
  },
  om: {
    key: 'om',
    label: 'Organic Matter (OM)',
    label_ar: 'المادة العضوية (OM)',
    label_fr: 'Matière Organique (MO)',
    unit: '%',
    color: '#10b981', // emerald green
    gradientStart: '#34d399',
    gradientEnd: '#047857',
    optimalRange: [2.5, 4.5],
    minDomain: 0.5,
    maxDomain: 5.5,
    description: 'Driver of water retention, soil biology & carbon storage',
    description_ar: 'محرك احتباس الماء، والنشاط البيولوجي وتخزين الكربون',
    description_fr: 'Moteur de rétention d’eau, biologie et stockage carbone',
  },
  cec: {
    key: 'cec',
    label: 'Cation Exchange Capacity (CEC)',
    label_ar: 'السعة التبادلية الكاتيونية (CEC)',
    label_fr: 'Capacité d’Échange Cationique (CEC)',
    unit: 'meq/100g',
    color: '#f59e0b', // amber / gold
    gradientStart: '#fbbf24',
    gradientEnd: '#b45309',
    optimalRange: [14, 28],
    minDomain: 5,
    maxDomain: 35,
    description: 'Soil nutrient reservoir & buffering against leaching',
    description_ar: 'خزان العناصر الغذائية وقدرة التربة على مقاومة الغسيل',
    description_fr: 'Réservoir d’éléments et pouvoir tampon du sol',
  },
};

const TITLE: TrilingualString = {
  en: 'Multi-Year Soil Health Trajectory (D3.js Visualization)',
  ar: 'مخطط المسار الزمني المتعدد السنوات لصحة التربة (D3.js)',
  fr: 'Trajectoire Pluriannuelle de la Santé du Sol (D3.js)',
};

const DESC: TrilingualString = {
  en: 'Long-term progression of pH, Organic Matter (OM %), and Cation Exchange Capacity (CEC) over multi-year rotations.',
  ar: 'متابعة تطور الحموضة والمادة العضوية والسعة التبادلية الكاتيونية عبر الدورات الزراعية المتعاقبة.',
  fr: 'Évolution à long terme du pH, de la matière organique et de la CEC sur les rotations culturales.',
};

export function SoilMultiYearTrendsChart({
  entries,
  selectedField,
  className = '',
}: SoilMultiYearTrendsChartProps) {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const isAr = language === 'ar';
  const isFr = language === 'fr';

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [layoutMode, setLayoutMode] = useState<ChartLayoutMode>('combined');
  const [activeMetrics, setActiveMetrics] = useState<Record<'ph' | 'om' | 'cec', boolean>>({
    ph: true,
    om: true,
    cec: true,
  });
  const [showProjection, setShowProjection] = useState(true);
  const [showOptimalBands, setShowOptimalBands] = useState(true);
  const [showCropLabels, setShowCropLabels] = useState(true);
  const [hoveredTest, setHoveredTest] = useState<SoilTestEntry | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(750);
  const [copied, setCopied] = useState(false);

  // Filter & sort data chronologically
  const sortedTests = useMemo(() => {
    const list = selectedField === 'all'
      ? [...entries]
      : entries.filter((e) => e.fieldName === selectedField);

    return list
      .filter((e) => e.date && !isNaN(new Date(e.date).getTime()))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [entries, selectedField]);

  // Handle Container Resizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.floor(entry.contentRect.width));
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Multi-Year Metric Progression Analytics
  const metricsAnalytics = useMemo(() => {
    if (sortedTests.length === 0) return null;
    const first = sortedTests[0];
    const latest = sortedTests[sortedTests.length - 1];

    const yearsSpan = Math.max(
      1,
      (new Date(latest.date).getTime() - new Date(first.date).getTime()) / (365.25 * 24 * 3600 * 1000)
    );

    const omDelta = latest.om - first.om;
    const omDeltaPct = first.om > 0 ? (omDelta / first.om) * 100 : 0;
    const omAnnualRate = omDelta / yearsSpan;

    const cecDelta = latest.cec - first.cec;
    const cecDeltaPct = first.cec > 0 ? (cecDelta / first.cec) * 100 : 0;

    const phDelta = latest.ph - first.ph;

    // Carbon sequestered estimate: +1% OM ~ 24 t CO2e/ha (0-30cm)
    const carbonDeltaTon = (omDelta / 1.724) * 1.35 * 30; // t C / ha
    const co2eDeltaTon = carbonDeltaTon * 3.67; // t CO2e / ha

    return {
      yearsSpan: Math.round(yearsSpan * 10) / 10,
      firstYear: first.date.slice(0, 4),
      latestYear: latest.date.slice(0, 4),
      first,
      latest,
      om: {
        first: first.om,
        latest: latest.om,
        delta: Math.round(omDelta * 100) / 100,
        deltaPct: Math.round(omDeltaPct * 10) / 10,
        annualRate: Math.round(omAnnualRate * 100) / 100,
        direction: omDelta > 0.05 ? 'improving' : omDelta < -0.05 ? 'declining' : 'stable',
      },
      cec: {
        first: first.cec,
        latest: latest.cec,
        delta: Math.round(cecDelta * 10) / 10,
        deltaPct: Math.round(cecDeltaPct * 10) / 10,
        direction: cecDelta > 0.5 ? 'improving' : cecDelta < -0.5 ? 'declining' : 'stable',
      },
      ph: {
        first: first.ph,
        latest: latest.ph,
        delta: Math.round(phDelta * 100) / 100,
        direction:
          Math.abs(latest.ph - 6.7) < Math.abs(first.ph - 6.7)
            ? 'improving'
            : Math.abs(latest.ph - 6.7) > Math.abs(first.ph - 6.7)
            ? 'declining'
            : 'stable',
      },
      carbonDeltaTon: Math.round(carbonDeltaTon * 10) / 10,
      co2eDeltaTon: Math.round(co2eDeltaTon * 10) / 10,
    };
  }, [sortedTests]);

  // Linear Regression Helper for Projections
  const calculateProjection = useCallback((data: { date: Date; value: number }[]) => {
    if (data.length < 2) return [];
    const n = data.length;
    const x0 = data[0].date.getTime();
    const xs = data.map((d) => (d.date.getTime() - x0) / (365.25 * 24 * 3600 * 1000));
    const ys = data.map((d) => d.value);

    const sumX = d3.sum(xs);
    const sumY = d3.sum(ys);
    const sumXY = d3.sum(xs.map((x, i) => x * ys[i]));
    const sumXX = d3.sum(xs.map((x) => x * x));

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
    const intercept = (sumY - slope * sumX) / n;

    const lastX = xs[xs.length - 1];
    const lastDate = data[data.length - 1].date;
    const projDate = new Date(lastDate.getTime() + 2 * 365.25 * 24 * 3600 * 1000); // 2 years future
    const projX = lastX + 2;
    const projValue = Math.max(0, slope * projX + intercept);

    return [
      { date: lastDate, value: data[data.length - 1].value, isForecast: false },
      { date: projDate, value: Math.round(projValue * 100) / 100, isForecast: true },
    ];
  }, []);

  // Main D3 Drawing Effect
  useEffect(() => {
    if (!svgRef.current || sortedTests.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = Math.max(320, containerWidth);
    const isSplit = layoutMode === 'split';
    const height = isSplit ? 460 : 360;

    const margin = {
      top: 25,
      right: isSplit ? 30 : 65,
      bottom: 45,
      left: isSplit ? 45 : 55,
    };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', height);

    // Defs & Gradients
    const defs = svg.append('defs');

    // Create Gradients for each metric
    Object.entries(METRIC_CONFIGS).forEach(([key, cfg]) => {
      const grad = defs
        .append('linearGradient')
        .attr('id', `gradient-${key}`)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

      grad
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', cfg.gradientStart)
        .attr('stop-opacity', 0.35);

      grad
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', cfg.gradientEnd)
        .attr('stop-opacity', 0.02);
    });

    // Drop shadow filter for points
    const filter = defs.append('filter').attr('id', 'point-shadow').attr('height', '130%');
    filter.append('feGaussianBlur').attr('in', 'SourceAlpha').attr('stdDeviation', 2);
    filter.append('feOffset').attr('dx', 0).attr('dy', 1.5);
    filter.append('feComponentTransfer').append('feFuncA').attr('type', 'linear').attr('slope', 0.2);
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Time Domain (X-Axis)
    const dates = sortedTests.map((d) => new Date(d.date));
    const minDate = d3.min(dates) || new Date();
    const maxDate = d3.max(dates) || new Date();

    // Extend maxDate slightly if projection is enabled
    const xMaxExtent = showProjection
      ? new Date(maxDate.getTime() + 2 * 365.25 * 24 * 3600 * 1000)
      : maxDate;

    // Add small margin around minDate
    const xMinExtent = new Date(minDate.getTime() - 60 * 24 * 3600 * 1000);

    const xScale = d3.scaleTime().domain([xMinExtent, xMaxExtent]).range([0, innerWidth]);

    // RENDER LAYOUT 1: SPLIT 3-PANEL VIEW
    if (isSplit) {
      const panelHeight = (innerHeight - 30) / 3;
      const metrics: ('ph' | 'om' | 'cec')[] = ['om', 'ph', 'cec'];

      metrics.forEach((metricKey, idx) => {
        const cfg = METRIC_CONFIGS[metricKey];
        const panelTop = margin.top + idx * (panelHeight + 15);
        const g = svg.append('g').attr('transform', `translate(${margin.left}, ${panelTop})`);

        // Y-Scale for this panel
        const rawValues = sortedTests.map((d) => Number(d[metricKey]) || 0);
        const yMin = Math.max(0, Math.min(cfg.minDomain, d3.min(rawValues) || cfg.minDomain) * 0.9);
        const yMax = Math.max(cfg.maxDomain, (d3.max(rawValues) || cfg.maxDomain) * 1.1);
        const yScale = d3.scaleLinear().domain([yMin, yMax]).range([panelHeight, 0]);

        // Optimal Range Shaded Band
        if (showOptimalBands) {
          const [optMin, optMax] = cfg.optimalRange;
          const bandTop = Math.max(0, yScale(Math.min(optMax, yMax)));
          const bandBottom = Math.min(panelHeight, yScale(Math.max(optMin, yMin)));
          const bandHeight = Math.max(0, bandBottom - bandTop);

          g.append('rect')
            .attr('x', 0)
            .attr('y', bandTop)
            .attr('width', innerWidth)
            .attr('height', bandHeight)
            .attr('fill', cfg.color)
            .attr('fill-opacity', 0.08)
            .attr('rx', 3);

          g.append('text')
            .attr('x', innerWidth - 6)
            .attr('y', bandTop + 11)
            .attr('text-anchor', 'end')
            .attr('font-size', '9px')
            .attr('font-weight', 'bold')
            .attr('fill', cfg.color)
            .attr('opacity', 0.8)
            .text(`${tr('Optimal Zone', 'النطاق المثالي', 'Zone Optimale')} (${optMin} - ${optMax} ${cfg.unit})`);
        }

        // Background grid lines
        const yTicks = yScale.ticks(3);
        yTicks.forEach((tickVal) => {
          g.append('line')
            .attr('x1', 0)
            .attr('x2', innerWidth)
            .attr('y1', yScale(tickVal))
            .attr('y2', yScale(tickVal))
            .attr('stroke', 'currentColor')
            .attr('stroke-opacity', 0.08)
            .attr('stroke-dasharray', '2,3');
        });

        // Area & Line Generators
        const areaGen = d3
          .area<SoilTestEntry>()
          .x((d) => xScale(new Date(d.date)))
          .y0(panelHeight)
          .y1((d) => yScale(d[metricKey] as number))
          .curve(d3.curveMonotoneX);

        const lineGen = d3
          .line<SoilTestEntry>()
          .x((d) => xScale(new Date(d.date)))
          .y((d) => yScale(d[metricKey] as number))
          .curve(d3.curveMonotoneX);

        // Draw Area
        g.append('path')
          .datum(sortedTests)
          .attr('fill', `url(#gradient-${metricKey})`)
          .attr('d', areaGen);

        // Draw Main Line
        g.append('path')
          .datum(sortedTests)
          .attr('fill', 'none')
          .attr('stroke', cfg.color)
          .attr('stroke-width', 2.5)
          .attr('d', lineGen);

        // Forecast / Projection Line
        if (showProjection) {
          const projData = calculateProjection(
            sortedTests.map((d) => ({ date: new Date(d.date), value: d[metricKey] as number }))
          );
          if (projData.length === 2) {
            const projLine = d3
              .line<{ date: Date; value: number }>()
              .x((d) => xScale(d.date))
              .y((d) => yScale(d.value));

            g.append('path')
              .datum(projData)
              .attr('fill', 'none')
              .attr('stroke', cfg.color)
              .attr('stroke-width', 1.8)
              .attr('stroke-dasharray', '4,4')
              .attr('opacity', 0.75)
              .attr('d', projLine);

            // Future forecast dot
            const futurePt = projData[1];
            g.append('circle')
              .attr('cx', xScale(futurePt.date))
              .attr('cy', yScale(futurePt.value))
              .attr('r', 3.5)
              .attr('fill', 'none')
              .attr('stroke', cfg.color)
              .attr('stroke-width', 1.5)
              .attr('stroke-dasharray', '2,2');

            g.append('text')
              .attr('x', xScale(futurePt.date))
              .attr('y', yScale(futurePt.value) - 7)
              .attr('text-anchor', 'middle')
              .attr('font-size', '8.5px')
              .attr('font-weight', 'bold')
              .attr('fill', cfg.color)
              .text(`${futurePt.value} ${cfg.unit} (${tr('Proj.', 'توقع', 'Proj.')})`);
          }
        }

        // Data Points
        sortedTests.forEach((d) => {
          const cx = xScale(new Date(d.date));
          const cy = yScale(d[metricKey] as number);

          g.append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', 4.5)
            .attr('fill', '#ffffff')
            .attr('stroke', cfg.color)
            .attr('stroke-width', 2.5)
            .attr('filter', 'url(#point-shadow)')
            .style('cursor', 'pointer');

          // Value label
          g.append('text')
            .attr('x', cx)
            .attr('y', cy - 8)
            .attr('text-anchor', 'middle')
            .attr('font-size', '9px')
            .attr('font-weight', 'bold')
            .attr('fill', cfg.color)
            .text(`${d[metricKey]}${cfg.unit ? ' ' + cfg.unit : ''}`);
        });

        // Panel Title & Y-Axis
        const yAxis = d3.axisLeft(yScale).ticks(3).tickSize(0).tickPadding(6);
        const yAxisG = g.append('g').call(yAxis);
        yAxisG.select('.domain').remove();
        yAxisG.selectAll('text').attr('font-size', '9px').attr('fill', 'currentColor').attr('opacity', 0.6);

        // Panel Metric Label Header
        g.append('text')
          .attr('x', 0)
          .attr('y', -6)
          .attr('font-size', '11px')
          .attr('font-weight', 'bold')
          .attr('fill', cfg.color)
          .text(`${isAr ? cfg.label_ar : isFr ? cfg.label_fr : cfg.label} (${cfg.unit || 'Score'})`);

        // X-Axis on the bottom panel only
        if (idx === metrics.length - 1) {
          const xAxis = d3
            .axisBottom(xScale)
            .ticks(width < 500 ? 4 : 7)
            .tickFormat((d) => d3.timeFormat('%Y-%m')(d as Date))
            .tickSize(0)
            .tickPadding(8);

          const xAxisG = g.append('g').attr('transform', `translate(0, ${panelHeight})`).call(xAxis);
          xAxisG.select('.domain').attr('stroke', 'currentColor').attr('stroke-opacity', 0.2);
          xAxisG.selectAll('text').attr('font-size', '9px').attr('fill', 'currentColor').attr('opacity', 0.7);
        }
      });

      return;
    }

    // RENDER LAYOUT 2: COMBINED MULTI-AXIS OR SINGLE FOCUSED METRIC
    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Determine which metrics to render
    const activeKeys: ('ph' | 'om' | 'cec')[] =
      layoutMode === 'combined'
        ? (['om', 'ph', 'cec'] as const).filter((k) => activeMetrics[k])
        : [layoutMode as 'ph' | 'om' | 'cec'];

    // Y-Scale Definitions
    // 1. Organic Matter Scale (Left Axis 1)
    const omValues = sortedTests.map((d) => d.om);
    const omYScale = d3
      .scaleLinear()
      .domain([
        Math.max(0, (d3.min(omValues) || 1) * 0.8),
        Math.max(4.5, (d3.max(omValues) || 3) * 1.15),
      ])
      .range([innerHeight, 0]);

    // 2. pH Scale (Right Axis 1)
    const phValues = sortedTests.map((d) => d.ph);
    const phYScale = d3
      .scaleLinear()
      .domain([5.0, 8.5])
      .range([innerHeight, 0]);

    // 3. CEC Scale (Right Axis 2 or Normalized Scale)
    const cecValues = sortedTests.map((d) => d.cec);
    const cecYScale = d3
      .scaleLinear()
      .domain([5, Math.max(30, (d3.max(cecValues) || 20) * 1.15)])
      .range([innerHeight, 0]);

    const getScaleForMetric = (key: 'ph' | 'om' | 'cec') => {
      if (key === 'om') return omYScale;
      if (key === 'ph') return phYScale;
      return cecYScale;
    };

    // Shaded Optimal Bands for primary active metric
    if (showOptimalBands && activeKeys.length > 0) {
      const primaryKey = activeKeys[0];
      const cfg = METRIC_CONFIGS[primaryKey];
      const scale = getScaleForMetric(primaryKey);
      const [optMin, optMax] = cfg.optimalRange;

      const bandTop = Math.max(0, scale(optMax));
      const bandBottom = Math.min(innerHeight, scale(optMin));
      const bandHeight = Math.max(0, bandBottom - bandTop);

      g.append('rect')
        .attr('x', 0)
        .attr('y', bandTop)
        .attr('width', innerWidth)
        .attr('height', bandHeight)
        .attr('fill', cfg.color)
        .attr('fill-opacity', 0.07)
        .attr('rx', 4);

      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', bandTop)
        .attr('y2', bandTop)
        .attr('stroke', cfg.color)
        .attr('stroke-opacity', 0.25)
        .attr('stroke-dasharray', '3,3');

      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', bandBottom)
        .attr('y2', bandBottom)
        .attr('stroke', cfg.color)
        .attr('stroke-opacity', 0.25)
        .attr('stroke-dasharray', '3,3');

      g.append('text')
        .attr('x', innerWidth - 6)
        .attr('y', bandTop + 12)
        .attr('text-anchor', 'end')
        .attr('font-size', '9.5px')
        .attr('font-weight', 'bold')
        .attr('fill', cfg.color)
        .attr('opacity', 0.8)
        .text(
          `${isAr ? cfg.label_ar : isFr ? cfg.label_fr : cfg.label} ${tr('Optimal Band', 'النطاق المثالي', 'Zone Optimale')} (${optMin} - ${optMax} ${cfg.unit})`
        );
    }

    // Grid lines
    const yTicks = omYScale.ticks(5);
    yTicks.forEach((tVal) => {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', omYScale(tVal))
        .attr('y2', omYScale(tVal))
        .attr('stroke', 'currentColor')
        .attr('stroke-opacity', 0.07)
        .attr('stroke-dasharray', '2,3');
    });

    // Draw Metric Series in Reverse Order (OM first for area fill)
    activeKeys.forEach((key) => {
      const cfg = METRIC_CONFIGS[key];
      const scale = getScaleForMetric(key);

      // Area fill (only for Organic Matter or single focus mode)
      if (key === 'om' || activeKeys.length === 1) {
        const areaGen = d3
          .area<SoilTestEntry>()
          .x((d) => xScale(new Date(d.date)))
          .y0(innerHeight)
          .y1((d) => scale(d[key] as number))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(sortedTests)
          .attr('fill', `url(#gradient-${key})`)
          .attr('d', areaGen);
      }

      // Line Path
      const lineGen = d3
        .line<SoilTestEntry>()
        .x((d) => xScale(new Date(d.date)))
        .y((d) => scale(d[key] as number))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(sortedTests)
        .attr('fill', 'none')
        .attr('stroke', cfg.color)
        .attr('stroke-width', key === 'om' ? 3 : 2.5)
        .attr('d', lineGen);

      // Forecast line
      if (showProjection) {
        const projData = calculateProjection(
          sortedTests.map((d) => ({ date: new Date(d.date), value: d[key] as number }))
        );
        if (projData.length === 2) {
          const projLine = d3
            .line<{ date: Date; value: number }>()
            .x((d) => xScale(d.date))
            .y((d) => scale(d.value));

          g.append('path')
            .datum(projData)
            .attr('fill', 'none')
            .attr('stroke', cfg.color)
            .attr('stroke-width', 1.8)
            .attr('stroke-dasharray', '4,4')
            .attr('opacity', 0.7)
            .attr('d', projLine);

          // Forecast endpoint
          const futurePt = projData[1];
          g.append('circle')
            .attr('cx', xScale(futurePt.date))
            .attr('cy', scale(futurePt.value))
            .attr('r', 3.5)
            .attr('fill', 'none')
            .attr('stroke', cfg.color)
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '2,2');

          g.append('text')
            .attr('x', xScale(futurePt.date))
            .attr('y', scale(futurePt.value) - 6)
            .attr('text-anchor', 'middle')
            .attr('font-size', '8.5px')
            .attr('font-weight', 'bold')
            .attr('fill', cfg.color)
            .text(`${futurePt.value}${cfg.unit ? ' ' + cfg.unit : ''} (${tr('Forecast', 'توقع', 'Prévision')})`);
        }
      }

      // Individual Data Dots & Markers
      sortedTests.forEach((d) => {
        const cx = xScale(new Date(d.date));
        const cy = scale(d[key] as number);

        const point = g
          .append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 5)
          .attr('fill', '#ffffff')
          .attr('stroke', cfg.color)
          .attr('stroke-width', 2.5)
          .attr('filter', 'url(#point-shadow)')
          .style('cursor', 'pointer')
          .on('mouseenter', (event) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
              setHoverPosition({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
              });
            }
            setHoveredTest(d);
          })
          .on('mouseleave', () => {
            setHoveredTest(null);
            setHoverPosition(null);
          });

        // Value text
        g.append('text')
          .attr('x', cx)
          .attr('y', cy - 8)
          .attr('text-anchor', 'middle')
          .attr('font-size', '9px')
          .attr('font-weight', 'bold')
          .attr('fill', cfg.color)
          .text(`${d[key]}${cfg.unit ? ' ' + cfg.unit : ''}`);
      });
    });

    // Crop Rotations Badges along Bottom Timeline
    if (showCropLabels) {
      sortedTests.forEach((d) => {
        if (!d.cropGrown) return;
        const cx = xScale(new Date(d.date));
        const cy = innerHeight + 22;

        const badgeG = g
          .append('g')
          .attr('transform', `translate(${cx}, ${cy})`)
          .style('cursor', 'pointer');

        badgeG
          .append('rect')
          .attr('x', -24)
          .attr('y', -9)
          .attr('width', 48)
          .attr('height', 16)
          .attr('rx', 8)
          .attr('fill', 'currentColor')
          .attr('fill-opacity', 0.08)
          .attr('stroke', 'currentColor')
          .attr('stroke-opacity', 0.2);

        badgeG
          .append('text')
          .attr('x', 0)
          .attr('y', 2.5)
          .attr('text-anchor', 'middle')
          .attr('font-size', '8px')
          .attr('font-weight', 'bold')
          .attr('fill', 'currentColor')
          .attr('opacity', 0.85)
          .text(d.cropGrown.slice(0, 8));
      });
    }

    // X-Axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(width < 500 ? 4 : 7)
      .tickFormat((d) => d3.timeFormat('%Y-%m')(d as Date))
      .tickSize(0)
      .tickPadding(10);

    const xAxisG = g.append('g').attr('transform', `translate(0, ${innerHeight})`).call(xAxis);
    xAxisG.select('.domain').attr('stroke', 'currentColor').attr('stroke-opacity', 0.2);
    xAxisG.selectAll('text').attr('font-size', '9.5px').attr('fill', 'currentColor').attr('opacity', 0.7);

    // Primary Left Y-Axis (OM or primary metric)
    const primaryKey = activeKeys[0] || 'om';
    const primaryScale = getScaleForMetric(primaryKey);
    const primaryCfg = METRIC_CONFIGS[primaryKey];

    const yAxisLeft = d3.axisLeft(primaryScale).ticks(5).tickSize(0).tickPadding(8);
    const yAxisLeftG = g.append('g').call(yAxisLeft);
    yAxisLeftG.select('.domain').remove();
    yAxisLeftG
      .selectAll('text')
      .attr('font-size', '9.5px')
      .attr('font-weight', 'bold')
      .attr('fill', primaryCfg.color);

    // Left Axis Title
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -38)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', primaryCfg.color)
      .text(`${isAr ? primaryCfg.label_ar : isFr ? primaryCfg.label_fr : primaryCfg.label} (${primaryCfg.unit || 'pH'})`);

    // Secondary Right Y-Axis (pH or CEC if in combined mode)
    if (activeKeys.length > 1) {
      const secondaryKey = activeKeys.includes('ph') ? 'ph' : activeKeys[1];
      const secondaryScale = getScaleForMetric(secondaryKey);
      const secondaryCfg = METRIC_CONFIGS[secondaryKey];

      const yAxisRight = d3.axisRight(secondaryScale).ticks(5).tickSize(0).tickPadding(8);
      const yAxisRightG = g.append('g').attr('transform', `translate(${innerWidth}, 0)`).call(yAxisRight);
      yAxisRightG.select('.domain').remove();
      yAxisRightG
        .selectAll('text')
        .attr('font-size', '9.5px')
        .attr('font-weight', 'bold')
        .attr('fill', secondaryCfg.color);

      // Right Axis Title
      g.append('text')
        .attr('transform', 'rotate(90)')
        .attr('y', -45)
        .attr('x', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('fill', secondaryCfg.color)
        .text(`${isAr ? secondaryCfg.label_ar : isFr ? secondaryCfg.label_fr : secondaryCfg.label} (${secondaryCfg.unit || 'Scale'})`);
    }

    // Transparent Hover Overlay for Crosshair
    const bisectDate = d3.bisector<SoilTestEntry, Date>((d) => new Date(d.date)).center;

    svg
      .append('rect')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event);
        const xDate = xScale.invert(mx - margin.left);
        const index = bisectDate(sortedTests, xDate);
        const test = sortedTests[Math.max(0, Math.min(sortedTests.length - 1, index))];

        if (test) {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setHoverPosition({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            });
          }
          setHoveredTest(test);
        }
      })
      .on('mouseleave', () => {
        setHoveredTest(null);
        setHoverPosition(null);
      });
  }, [
    sortedTests,
    layoutMode,
    activeMetrics,
    showProjection,
    showOptimalBands,
    showCropLabels,
    containerWidth,
    calculateProjection,
    isAr,
    isFr,
    tr,
  ]);

  // Export SVG as PNG
  const handleExportPNG = () => {
    if (!svgRef.current) return;
    const svgEl = svgRef.current;
    const svgString = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 1200;
    canvas.height = 700;

    img.onload = () => {
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement('a');
      a.download = `soil-health-trends-${selectedField.replace(/\s+/g, '-').toLowerCase()}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
  };

  // Copy a textual summary of the chart's analytics
  const handleCopy = () => {
    const lines: string[] = [
      '=== MULTI-YEAR SOIL HEALTH TRAJECTORY ===',
      `Field: ${selectedField}`,
      `Lab records: ${sortedTests.length}`,
    ];

    if (metricsAnalytics) {
      lines.push(
        '',
        `Period: ${metricsAnalytics.firstYear} → ${metricsAnalytics.latestYear} (${metricsAnalytics.yearsSpan} years)`,
        '',
        `Organic Matter: ${metricsAnalytics.om.first}% → ${metricsAnalytics.om.latest}% (Δ ${metricsAnalytics.om.delta > 0 ? '+' : ''}${metricsAnalytics.om.delta}%, ${metricsAnalytics.om.deltaPct > 0 ? '+' : ''}${metricsAnalytics.om.deltaPct}%)`,
        `  Annual rate: ${metricsAnalytics.om.annualRate > 0 ? '+' : ''}${metricsAnalytics.om.annualRate}%/year — ${metricsAnalytics.om.direction}`,
        '',
        `CEC: ${metricsAnalytics.cec.first} → ${metricsAnalytics.cec.latest} meq/100g (Δ ${metricsAnalytics.cec.delta > 0 ? '+' : ''}${metricsAnalytics.cec.delta}) — ${metricsAnalytics.cec.direction}`,
        '',
        `pH: ${metricsAnalytics.ph.first} → ${metricsAnalytics.ph.latest} (Δ ${metricsAnalytics.ph.delta > 0 ? '+' : ''}${metricsAnalytics.ph.delta}) — ${metricsAnalytics.ph.direction}`,
        '',
        `Carbon sequestered: ${metricsAnalytics.carbonDeltaTon > 0 ? '+' : ''}${metricsAnalytics.carbonDeltaTon} t C/ha`,
        `CO₂e sequestered: ${metricsAnalytics.co2eDeltaTon > 0 ? '+' : ''}${metricsAnalytics.co2eDeltaTon} t/ha (IPCC Tier 1, 0-30cm)`,
      );
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  // Reset every view toggle & layout back to defaults
  const handleReset = () => {
    setLayoutMode('combined');
    setActiveMetrics({ ph: true, om: true, cec: true });
    setShowProjection(true);
    setShowOptimalBands(true);
    setShowCropLabels(true);
    toast({ title: tr('View Reset', 'تمت الإعادة', 'Réinitialisé') });
  };

  const actions: CalculatorAction[] = [
    {
      icon: Copy,
      label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
      onClick: handleCopy,
      variant: 'primary',
      showCheck: copied,
    },
    {
      icon: Download,
      label: { en: 'Export PNG', ar: 'تصدير PNG', fr: 'Exporter' },
      onClick: handleExportPNG,
    },
    {
      icon: RotateCcw,
      label: { en: 'Reset View', ar: 'إعادة العرض', fr: 'Réinitialiser' },
      onClick: handleReset,
    },
  ];

  return (
    <div className={className}>
      <CalculatorShell
        icon={TrendingUp}
        title={TITLE}
        description={DESC}
        badge={`${sortedTests.length} ${tr('Lab Records', 'تحاليل مخبرية', 'Analyses')}`}
        accent="emerald"
        actions={actions}
      >
        <div className="lg:col-span-12 space-y-4">
          {/* Top Controls Bar: Layout Switcher */}
          <div className="flex items-center justify-between gap-3 flex-wrap p-3.5 rounded-2xl border bg-card shadow-xs">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">
                  {tr('Visualization Layout', 'تخطيط العرض', 'Disposition du Graphique')}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {tr(
                    'Toggle between combined multi-axis view or 3-panel trellis layout.',
                    'التبديل بين العرض الموحد متعدد المحاور أو العرض المنفصل في 3 لوحات.',
                    'Basculez entre la vue combinée multi-axes ou la vue à 3 panneaux.'
                  )}
                </div>
              </div>
            </div>

            {/* View Mode Controls */}
            <div className="flex items-center bg-muted/70 p-0.5 rounded-lg border text-xs">
              <button
                onClick={() => setLayoutMode('combined')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  layoutMode === 'combined'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tr('Combined Axis', 'المحاور المدمجة', 'Vue Combinée')}
              </button>
              <button
                onClick={() => setLayoutMode('split')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  layoutMode === 'split'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tr('3-Panel Trellis', '3 لوحات منفصلة', '3 Panneaux')}
              </button>
            </div>
          </div>

          {/* Top Metric Summary Cards (Live Delta & Carbon Sequestration) */}
          {metricsAnalytics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Organic Matter Trajectory */}
              <div className="p-2.5 rounded-xl bg-card border border-emerald-200/60 dark:border-emerald-900/40 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                    <Leaf className="h-3 w-3" />
                    {tr('Organic Matter', 'المادة العضوية', 'Matière Organique')}
                  </span>
                  <span className="font-mono text-[10px]">{metricsAnalytics.firstYear} → {metricsAnalytics.latestYear}</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <div className="text-base font-black font-mono text-foreground">
                    {metricsAnalytics.om.latest}%
                  </div>
                  <div className="flex items-center gap-0.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {metricsAnalytics.om.delta > 0 ? '+' : ''}{metricsAnalytics.om.delta}%
                    <span className="text-[10px] font-normal text-muted-foreground">
                      ({metricsAnalytics.om.deltaPct > 0 ? '+' : ''}{metricsAnalytics.om.deltaPct}%)
                    </span>
                  </div>
                </div>
                <div className="text-[9.5px] text-muted-foreground mt-0.5">
                  {metricsAnalytics.om.annualRate > 0 ? '+' : ''}{metricsAnalytics.om.annualRate}% {tr('/ year velocity', '/ سنة معدل التحسن', '/ an')}
                </div>
              </div>

              {/* CEC Holding Capacity */}
              <div className="p-2.5 rounded-xl bg-card border border-amber-200/60 dark:border-amber-900/40 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                    <Layers className="h-3 w-3" />
                    {tr('CEC Capacity', 'السعة التبادلية CEC', 'Capacité CEC')}
                  </span>
                  <span className="font-mono text-[10px]">{metricsAnalytics.first.cec} → {metricsAnalytics.latest.cec}</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <div className="text-base font-black font-mono text-foreground">
                    {metricsAnalytics.cec.latest} <span className="text-[10px] font-normal text-muted-foreground">meq</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                    {metricsAnalytics.cec.delta > 0 ? '+' : ''}{metricsAnalytics.cec.delta}
                    <span className="text-[10px] font-normal text-muted-foreground">
                      ({metricsAnalytics.cec.deltaPct > 0 ? '+' : ''}{metricsAnalytics.cec.deltaPct}%)
                    </span>
                  </div>
                </div>
                <div className="text-[9.5px] text-muted-foreground mt-0.5">
                  {metricsAnalytics.cec.latest >= 15 ? tr('High nutrient buffer', 'سعة تخزين عالية للعناصر', 'Forte rétention nutritive') : tr('Moderate buffer', 'سعة تخزين متوسطة', 'Rétention moyenne')}
                </div>
              </div>

              {/* pH Regulation */}
              <div className="p-2.5 rounded-xl bg-card border border-blue-200/60 dark:border-blue-900/40 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400">
                    <Activity className="h-3 w-3" />
                    {tr('Soil pH', 'حموضة التربة', 'pH du Sol')}
                  </span>
                  <span className="font-mono text-[10px]">{metricsAnalytics.first.ph} → {metricsAnalytics.latest.ph}</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <div className="text-base font-black font-mono text-foreground">
                    {metricsAnalytics.ph.latest}
                  </div>
                  <div className="flex items-center gap-0.5 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    {metricsAnalytics.ph.delta > 0 ? '+' : ''}{metricsAnalytics.ph.delta}
                  </div>
                </div>
                <div className="text-[9.5px] text-muted-foreground mt-0.5">
                  {metricsAnalytics.ph.latest >= 6.2 && metricsAnalytics.ph.latest <= 7.3
                    ? tr('Optimal agronomic range', 'في النطاق الزراعي المثالي', 'Optimal agronomique')
                    : metricsAnalytics.ph.latest < 6.2
                    ? tr('Acidic — lime needed', 'حامضية — تحتاج جير', 'Acide — chaulage requis')
                    : tr('Alkaline — sulfur needed', 'قلوية — تحتاج كبريت', 'Alcalin — soufre requis')}
                </div>
              </div>

              {/* Atmospheric Carbon Sequestration */}
              <div className="p-2.5 rounded-xl bg-card border border-teal-200/60 dark:border-teal-900/40 shadow-2xs bg-gradient-to-br from-teal-50/40 to-emerald-50/20 dark:from-teal-950/20">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 font-semibold text-teal-800 dark:text-teal-300">
                    <Sparkles className="h-3 w-3" />
                    {tr('CO₂e Sequestered', 'مكافئ CO₂ المحتجز', 'CO₂e Séquestré')}
                  </span>
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                    SOC
                  </Badge>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <div className="text-base font-black font-mono text-teal-700 dark:text-teal-300">
                    {metricsAnalytics.co2eDeltaTon > 0 ? '+' : ''}{metricsAnalytics.co2eDeltaTon} <span className="text-[10px] font-normal">t/ha</span>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    +{metricsAnalytics.carbonDeltaTon} t C/ha
                  </div>
                </div>
                <div className="text-[9.5px] text-muted-foreground mt-0.5 truncate">
                  {tr('IPCC Tier 1 (0-30cm)', 'معايير IPCC الدولية 0-30سم', 'Méthode GIEC Tier 1')}
                </div>
              </div>
            </div>
          )}

          {/* Interactive Controls Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs p-3.5 rounded-2xl border bg-card shadow-xs">
            {/* Metric Toggle Chips (Combined Mode Only) */}
            {layoutMode === 'combined' && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-muted-foreground mr-1">
                  {tr('Series:', 'السلاسل:', 'Séries :')}
                </span>
                {(['om', 'ph', 'cec'] as const).map((key) => {
                  const cfg = METRIC_CONFIGS[key];
                  const isActive = activeMetrics[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveMetrics((prev) => ({ ...prev, [key]: !prev[key] }))}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                        isActive
                          ? 'border-transparent text-white shadow-2xs'
                          : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
                      }`}
                      style={{
                        backgroundColor: isActive ? cfg.color : undefined,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: isActive ? '#ffffff' : cfg.color }}
                      />
                      {isAr ? cfg.label_ar : isFr ? cfg.label_fr : cfg.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Visualization Options Toggle Switches */}
            <div className="flex items-center gap-2 ml-auto flex-wrap text-[11px]">
              <button
                onClick={() => setShowOptimalBands(!showOptimalBands)}
                className={`px-2 py-0.5 rounded-md border transition-all ${
                  showOptimalBands
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-muted/40 text-muted-foreground border-border'
                }`}
              >
                {tr('Optimal Shaded Bands', 'نطاقات المستويات المثالية', 'Zones Idéales')}
              </button>

              <button
                onClick={() => setShowProjection(!showProjection)}
                className={`px-2 py-0.5 rounded-md border transition-all ${
                  showProjection
                    ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-muted/40 text-muted-foreground border-border'
                }`}
              >
                {tr('2-Year Trajectory Forecast', 'توقعات المسار المستقبلي', 'Projection 2 Ans')}
              </button>

              <button
                onClick={() => setShowCropLabels(!showCropLabels)}
                className={`px-2 py-0.5 rounded-md border transition-all ${
                  showCropLabels
                    ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300'
                    : 'bg-muted/40 text-muted-foreground border-border'
                }`}
              >
                {tr('Crop Rotation Badges', 'محاصيل الدورات الزراعية', 'Cultures')}
              </button>
            </div>
          </div>

          {/* D3 SVG Chart Container */}
          <div ref={containerRef} className="relative w-full rounded-xl bg-card border shadow-2xs overflow-hidden">
            <svg ref={svgRef} className="w-full select-none" />

            {/* Interactive Floating Tooltip */}
            {hoveredTest && hoverPosition && (
              <div
                className="absolute z-20 pointer-events-none p-3 rounded-xl bg-popover/95 text-popover-foreground shadow-lg border border-border backdrop-blur-md text-xs space-y-1.5 min-w-56"
                style={{
                  left: `${Math.min(containerWidth - 230, Math.max(10, hoverPosition.x - 110))}px`,
                  top: `${Math.max(10, hoverPosition.y - 140)}px`,
                }}
              >
                <div className="flex items-center justify-between border-b pb-1.5 font-bold">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <Calendar className="h-3.5 w-3.5" />
                    {hoveredTest.date}
                  </span>
                  {hoveredTest.cropGrown && (
                    <Badge variant="secondary" className="text-[10px] font-semibold">
                      <Sprout className="h-2.5 w-2.5 mr-1 text-emerald-600" />
                      {hoveredTest.cropGrown}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1 font-mono text-[11px] pt-0.5">
                  <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                    <span className="font-sans text-muted-foreground">{tr('Organic Matter:', 'المادة العضوية:', 'Matière Organique :')}</span>
                    <span className="font-bold">{hoveredTest.om}%</span>
                  </div>
                  <div className="flex justify-between items-center text-blue-600 dark:text-blue-400">
                    <span className="font-sans text-muted-foreground">Soil pH (1:2.5):</span>
                    <span className="font-bold">{hoveredTest.ph}</span>
                  </div>
                  <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
                    <span className="font-sans text-muted-foreground">CEC:</span>
                    <span className="font-bold">{hoveredTest.cec} meq/100g</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground text-[10px]">
                    <span className="font-sans">P / K Reserve:</span>
                    <span>{hoveredTest.p} ppm / {hoveredTest.k} meq</span>
                  </div>
                </div>

                {hoveredTest.notes && (
                  <div className="text-[10px] text-muted-foreground border-t pt-1 italic truncate max-w-56">
                    {hoveredTest.notes}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Agronomic Regeneration Guidance Box */}
          <div className="p-3 rounded-xl bg-muted/40 border text-xs space-y-1 text-muted-foreground leading-relaxed">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>
                {tr(
                  'Agronomic Interpretation & Soil Health Velocity',
                  'التفسير الزراعي ومعدل سرعة تجديد صحة التربة',
                  'Interprétation Agronomique & Régénération des Sols'
                )}
              </span>
            </div>
            <p className="text-[11px]">
              {tr(
                'A healthy living soil requires synchronized management of Organic Matter, pH, and CEC. Increasing Organic Matter by 0.1% per year enhances soil cation retention (CEC) by ~0.3-0.5 meq/100g, buffers the rootzone against sudden pH shifts, and improves available water holding capacity by up to 35,000 litres per hectare.',
                'تتطلب التربة الحية المتجددة إدارة متزامنة للمادة العضوية والحموضة والسعة التبادلية. كل زيادة بنسبة 0.1% سنوياً في المادة العضوية ترفع سعة احتجاز العناصر (CEC) بنحو 0.3-0.5 meq/100غ، وتحمي الجذور من صدمات الحموضة، وترفع السعة الحقلية لتخزين المياه بما يصل إلى 35,000 لتر لكل هكتار.',
                'Un sol vivant et régénératif requiert la gestion synchronisée de la matière organique, du pH et de la CEC. +0.1% de MO par an augmente la CEC de ~0.3-0.5 meq/100g et améliore la réserve utile en eau jusqu’à 35 000 L/ha.'
              )}
            </p>
          </div>
        </div>
      </CalculatorShell>
    </div>
  );
}
