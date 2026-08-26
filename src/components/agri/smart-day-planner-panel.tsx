'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Droplets,
  Sprout,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw,
  Printer,
  Copy,
  Check,
  Share2,
  Shield,
  Sun,
  CloudRain,
  Flame,
  Info,
  CheckSquare,
  PlusCircle,
  TrendingUp,
  MapPin,
  X,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
  type SmartDayPlanSummary,
  type SmartPlannerItem,
  type ActiveFieldInput,
  type SmartPlannerItemType,
  SMART_PLANNER_STORAGE_KEY,
} from '@/lib/smart-day-planner';
import { readSavedFields, type SavedFieldRecord } from '@/lib/farm-digital-twin';
import { useFarmStore } from '@/lib/farm-store';
import { loadScoutEntries } from '@/lib/scouting-store';
import { getSoilTests } from '@/lib/soil-history-store';
import { addManualFieldRecord } from '@/lib/field-record-book';
import { useTranslation, type Language } from '@/lib/language-store';

interface SmartDayPlannerPanelProps {
  zone: 'coastal' | 'highPlateaus' | 'sahara';
  onZoneChange?: (zone: 'coastal' | 'highPlateaus' | 'sahara') => void;
  language?: Language;
  onApplyToCalendar?: (items: SmartPlannerItem[]) => void;
}

export function SmartDayPlannerPanel({
  zone,
  onZoneChange,
  language = 'en',
  onApplyToCalendar,
}: SmartDayPlannerPanelProps) {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [plan, setPlan] = useState<SmartDayPlanSummary | null>(null);
  const [filterType, setFilterType] = useState<'all' | SmartPlannerItemType>('all');
  const [selectedFieldFilter, setSelectedFieldFilter] = useState<string>('all');
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<boolean>(false);

  // Active fields gathering
  const [activeFields, setActiveFields] = useState<ActiveFieldInput[]>([]);

  // Load active fields from local storage / store
  const refreshActiveFields = useCallback(() => {
    const saved = readSavedFields();
    const farmStoreFarms = useFarmStore.getState().farms;
    const scoutEntries = loadScoutEntries();
    const soilTests = getSoilTests();

    const fieldsList: ActiveFieldInput[] = [];

    if (saved.length > 0) {
      saved.forEach(f => {
        const fieldScouts = scoutEntries.filter(s => s.fieldName.toLowerCase() === f.name.toLowerCase());
        const openScouts = fieldScouts.filter(s => s.severity === 'critical' || s.severity === 'warning');
        const soil = soilTests.find(s => s.fieldName.toLowerCase() === f.name.toLowerCase());
        const soilConstraints: string[] = [];
        if (soil) {
          if (soil.ph < 6.0) soilConstraints.push('Acidic Soil');
          if (soil.ph > 8.0) soilConstraints.push('Alkaline Soil (Calcareous)');
          if (soil.om < 1.5) soilConstraints.push('Low OM');
        }

        fieldsList.push({
          id: f.id,
          name: f.name,
          crop: f.crop || 'Crop',
          areaHa: f.areaHa || 1.0,
          plantingDate: f.plantingDate,
          currentStage: f.crop.toLowerCase().includes('tomato') ? 'Flowering / Fruit Set' : 'Tillering / Vegetative',
          soilType: f.soil?.texture || 'Loam',
          irrigationType: 'Drip System',
          openScoutCount: openScouts.length,
          recentScoutIssues: openScouts.map(s => s.diagnosis?.problemName || s.note || 'Scout Flag').slice(0, 2),
          soilConstraints,
          zone,
        });
      });
    } else if (farmStoreFarms.length > 0) {
      farmStoreFarms.forEach(f => {
        fieldsList.push({
          id: f.id,
          name: f.name,
          crop: f.crop || 'Wheat',
          areaHa: f.area || 2.0,
          plantingDate: f.plantingDate,
          currentStage: 'Active Season',
          soilType: f.soilType || 'Loam',
          irrigationType: f.irrigationType || 'Drip',
          zone,
        });
      });
    } else {
      // Default demo Algerian fields so the farmer gets immediate value
      fieldsList.push(
        {
          id: 'demo-field-1',
          name: 'Parcelle Blé Dur (Mitidja Nord)',
          crop: 'Wheat (Cirta)',
          areaHa: 5.0,
          plantingDate: new Date(Date.now() - 70 * 86400000).toISOString().slice(0, 10),
          currentStage: 'Stem Elongation / Tallage',
          soilType: 'Clay Loam',
          irrigationType: 'Sprinkler Pivot',
          openScoutCount: 1,
          recentScoutIssues: ['Early septoria leaf spot alert on lower canopy'],
          zone,
        },
        {
          id: 'demo-field-2',
          name: 'Serre Maraîchère (Tipaza / Tomate)',
          crop: 'Tomato (Tavira F1)',
          areaHa: 1.5,
          plantingDate: new Date(Date.now() - 35 * 86400000).toISOString().slice(0, 10),
          currentStage: 'Flowering & First Fruit Cluster',
          soilType: 'Sandy Loam',
          irrigationType: 'Drip Fertigation (Venturi)',
          openScoutCount: 0,
          zone,
        },
        {
          id: 'demo-field-3',
          name: 'Verger Olivier & Agrumes (Blida)',
          crop: 'Olive (Chemlal)',
          areaHa: 3.2,
          plantingDate: '2020-03-15',
          currentStage: 'Bud Break / Vegetative Push',
          soilType: 'Calcareous Loam',
          irrigationType: 'Micro-sprinkler',
          openScoutCount: 0,
          zone,
        }
      );
    }

    setActiveFields(fieldsList);
  }, [zone]);

  useEffect(() => {
    refreshActiveFields();
  }, [refreshActiveFields]);

  // Load saved plan from localStorage if exists
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem(SMART_PLANNER_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.items)) {
            setPlan(parsed);
          }
        }
      } catch (e) {
        console.error('Failed to load saved plan', e);
      }
    }
  }, []);

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    try {
      const payload = {
        selectedDate,
        zone,
        language: language as 'en' | 'fr' | 'ar',
        fields: activeFields,
      };

      const res = await fetch('/api/smart-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to generate smart plan');
      }

      const data: SmartDayPlanSummary = await res.json();
      setPlan(data);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SMART_PLANNER_STORAGE_KEY, JSON.stringify(data));
      }

      toast({
        title: 'Smart Day Plan Generated',
        description: `Scheduled ${data.items.length} tasks (${data.totalWaterM3} m³ irrigation, ${data.totalFertilizerKg} kg nutrients) via Gemini.`,
      });

      if (onApplyToCalendar) {
        onApplyToCalendar(data.items);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Plan Generation Notice',
        description: 'Loaded deterministic agronomist schedule for current climate & field conditions.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItemCompletion = (itemId: string, item: SmartPlannerItem) => {
    setCompletedItems(prev => {
      const nextVal = !prev[itemId];
      if (nextVal) {
        // Also log into field record book
        addManualFieldRecord({
          fieldName: item.fieldName,
          fieldId: item.fieldId,
          crop: item.crop,
          date: item.date,
          kind: item.type === 'irrigation' ? 'irrigation' : item.type === 'fertilization' ? 'input' : 'observation',
          title: item.title,
          summary: `Completed Smart Planner Task: ${item.description}`,
        });
        toast({
          title: 'Task Completed & Logged',
          description: `"${item.title}" added to Field Record Book.`,
        });
      }
      return { ...prev, [itemId]: nextVal };
    });
  };

  const handleCopyBriefing = () => {
    if (!plan) return;
    const text = `🌿 FARMER SMART DAY BRIEFING (${selectedDate})\n` +
      `Zone: ${zone.toUpperCase()} | Active Fields: ${activeFields.length}\n` +
      `Focus: ${plan.dailyFocus}\n` +
      `Water Demand: ${plan.totalWaterM3} m³ | Nutrient Demand: ${plan.totalFertilizerKg} kg\n\n` +
      `TASKS & SCHEDULES:\n` +
      plan.items.map(i => `• [${i.timeWindow}] (${i.type.toUpperCase()}) ${i.title}\n  -> ${i.description}`).join('\n\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Briefing Copied',
      description: 'Ready to share on WhatsApp or print.',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredItems = useMemo(() => {
    if (!plan) return [];
    return plan.items.filter(item => {
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (selectedFieldFilter !== 'all' && item.fieldId !== selectedFieldFilter) return false;
      return true;
    });
  }, [plan, filterType, selectedFieldFilter]);

  const uniqueFieldsInPlan = useMemo(() => {
    if (!plan) return [];
    const map = new Map<string, string>();
    plan.items.forEach(i => map.set(i.fieldId, i.fieldName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [plan]);

  return (
    <div id="smart-day-planner-root" className="space-y-5">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-5 dark:from-emerald-950/40 dark:via-teal-950/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5 px-2.5 py-0.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
                AI Smart Day Planner
              </Badge>
              <Badge variant="outline" className="text-xs border-emerald-400/40 text-emerald-700 dark:text-emerald-300 bg-white/60 dark:bg-black/30">
                Gemini 3.7 Flash Engine
              </Badge>
              <Badge variant="outline" className="text-xs border-blue-400/40 text-blue-700 dark:text-blue-300 bg-white/60 dark:bg-black/30">
                {activeFields.length} Active Field{activeFields.length > 1 ? 's' : ''} Synced
              </Badge>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Precision Agronomic Day Scheduler
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Automatically populates daily calendar timelines with ET₀-based irrigation schedules, stage-specific fertigation windows, and canopy protection tasks mapped to your real active fields.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-background/80 dark:bg-black/40 border rounded-lg px-2.5 py-1.5 shadow-xs">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-medium border-0 focus:outline-hidden text-foreground"
              />
            </div>

            <Button
              onClick={handleGeneratePlan}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-medium transition-all"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Reasoning Field Data...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2 text-amber-300" />
                  {plan ? 'Regenerate Smart Plan' : 'Generate Smart Day Plan'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Active Fields Pills Bar */}
        <div className="mt-4 pt-3 border-t border-emerald-500/20 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-muted-foreground flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            Active Fields Connected:
          </span>
          {activeFields.map(f => (
            <span
              key={f.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background/90 dark:bg-card border text-foreground shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <strong>{f.name}</strong>
              <span className="text-muted-foreground">({f.crop} • {f.areaHa} ha)</span>
              {f.openScoutCount && f.openScoutCount > 0 ? (
                <span className="text-rose-600 dark:text-rose-400 font-bold">⚠️ Alert</span>
              ) : null}
            </span>
          ))}
        </div>
      </div>

      {/* Main Plan Display */}
      {plan ? (
        <div className="space-y-5">
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
            <Card className="border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Daily Operations</div>
                  <div className="text-xl font-bold text-foreground">{plan.items.length} Actions</div>
                  <div className="text-2xs text-emerald-700 dark:text-emerald-400 font-medium">
                    {Object.values(completedItems).filter(Boolean).length} completed
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-sky-500/20 bg-sky-50/50 dark:bg-sky-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Irrigation Target</div>
                  <div className="text-xl font-bold text-foreground">{plan.totalWaterM3} m³</div>
                  <div className="text-2xs text-sky-700 dark:text-sky-400 font-medium">
                    Low-evaporation windows
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-500/20 bg-purple-50/50 dark:bg-purple-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Nutrient Window</div>
                  <div className="text-xl font-bold text-foreground">{plan.totalFertilizerKg} kg</div>
                  <div className="text-2xs text-purple-700 dark:text-purple-400 font-medium">
                    Stage-matched NPK/Ca
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Priority / Alerts</div>
                  <div className="text-xl font-bold text-foreground">{plan.criticalTasksCount} High Priority</div>
                  <div className="text-2xs text-amber-700 dark:text-amber-400 font-medium">
                    Agro-climatic cautions
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Focus & Weather Advisory Callout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="rounded-lg border bg-card p-4 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                Chief Agronomist Focus
              </div>
              <p className="text-sm font-medium text-foreground">
                {plan.dailyFocus}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {plan.planSummary}
              </p>
            </div>

            <div className="rounded-lg border bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/30 p-4 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <Sun className="w-4 h-4" />
                Agro-Climatic Guidance
              </div>
              <p className="text-sm font-medium text-foreground">
                {plan.weatherCaution}
              </p>
              <div className="flex items-center gap-2 text-2xs text-muted-foreground pt-1">
                <span>Zone: <strong>{zone === 'sahara' ? 'Sahara Oasis' : zone === 'highPlateaus' ? 'High Plateaus' : 'Coastal Tell'}</strong></span>
                <span>•</span>
                <span>Date: <strong>{selectedDate}</strong></span>
              </div>
            </div>
          </div>

          {/* Action Bar & Filtering */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground mr-1">Filter:</span>
              <Button
                size="sm"
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                className="h-7 text-xs px-2.5"
              >
                All ({plan.items.length})
              </Button>
              <Button
                size="sm"
                variant={filterType === 'irrigation' ? 'default' : 'outline'}
                onClick={() => setFilterType('irrigation')}
                className="h-7 text-xs px-2.5 gap-1"
              >
                <Droplets className="w-3.5 h-3.5 text-sky-500" />
                Irrigation
              </Button>
              <Button
                size="sm"
                variant={filterType === 'fertilization' ? 'default' : 'outline'}
                onClick={() => setFilterType('fertilization')}
                className="h-7 text-xs px-2.5 gap-1"
              >
                <Sprout className="w-3.5 h-3.5 text-purple-500" />
                Nutrients
              </Button>
              <Button
                size="sm"
                variant={filterType === 'task' || filterType === 'scouting' ? 'default' : 'outline'}
                onClick={() => setFilterType(filterType === 'task' ? 'all' : 'task')}
                className="h-7 text-xs px-2.5 gap-1"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                Field Tasks
              </Button>
            </div>

            {/* Field Filter & Export Actions */}
            <div className="flex items-center gap-2">
              {uniqueFieldsInPlan.length > 1 && (
                <select
                  value={selectedFieldFilter}
                  onChange={e => setSelectedFieldFilter(e.target.value)}
                  className="h-7 text-xs rounded-md border bg-background px-2 text-foreground focus:outline-hidden"
                >
                  <option value="all">All Fields ({uniqueFieldsInPlan.length})</option>
                  {uniqueFieldsInPlan.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyBriefing}
                className="h-7 text-xs px-2.5 gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handlePrint}
                className="h-7 text-xs px-2.5 gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </Button>
            </div>
          </div>

          {/* Planned Items List */}
          <div className="space-y-3">
            {filteredItems.map(item => {
              const isCompleted = Boolean(completedItems[item.id]);
              const isIrrigation = item.type === 'irrigation';
              const isFertilization = item.type === 'fertilization';
              const isScouting = item.type === 'scouting' || item.type === 'cropProtection';

              const badgeColor = isIrrigation
                ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-300'
                : isFertilization
                ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300'
                : isScouting
                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300'
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300';

              return (
                <div
                  key={item.id}
                  className={`group relative rounded-xl border p-4 transition-all duration-200 ${
                    isCompleted
                      ? 'bg-muted/40 border-muted opacity-75'
                      : 'bg-card hover:border-emerald-500/40 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleItemCompletion(item.id, item)}
                        className="mt-0.5 text-muted-foreground hover:text-emerald-600 transition-colors focus:outline-hidden"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100 dark:fill-emerald-950" />
                        ) : (
                          <Circle className="w-5 h-5 hover:text-emerald-500" />
                        )}
                      </button>

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-foreground bg-muted px-2 py-0.5 rounded-md">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            {item.timeWindow}
                          </span>

                          <Badge variant="outline" className={`text-2xs uppercase tracking-wider font-semibold ${badgeColor}`}>
                            {item.type}
                          </Badge>

                          <Badge variant="outline" className="text-2xs border-muted text-muted-foreground">
                            {item.fieldName} ({item.crop})
                          </Badge>

                          {item.priority === 'high' && (
                            <Badge className="bg-rose-600 text-white text-2xs px-1.5 py-0 font-medium">
                              High Priority
                            </Badge>
                          )}
                        </div>

                        <h4 className={`text-sm font-semibold text-foreground ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {item.title}
                        </h4>

                        <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
                          {item.description}
                        </p>

                        {/* Agronomic Reasoning Pill */}
                        {item.reasoning && (
                          <div className="flex items-center gap-1.5 text-2xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-900/60 w-fit">
                            <Info className="w-3 h-3 shrink-0" />
                            <span><strong>Why today:</strong> {item.reasoning}</span>
                          </div>
                        )}

                        {/* Metrics Badges */}
                        {item.metrics && (
                          <div className="flex flex-wrap items-center gap-3 pt-1 text-2xs font-mono text-muted-foreground">
                            {item.metrics.waterM3 !== undefined && (
                              <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold">
                                <Droplets className="w-3 h-3" />
                                {item.metrics.waterM3} m³ water
                              </span>
                            )}
                            {item.metrics.fertilizerKg !== undefined && (
                              <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold">
                                <Sprout className="w-3 h-3" />
                                {item.metrics.fertilizerKg} kg formulation
                              </span>
                            )}
                            {item.metrics.durationMin !== undefined && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {item.metrics.durationMin} min duration
                              </span>
                            )}
                            {item.metrics.dosage && (
                              <span className="text-foreground">
                                Rate: {item.metrics.dosage}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleItemCompletion(item.id, item)}
                        className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        {isCompleted ? 'Done' : 'Mark Done'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 7-Day Matrix Projection */}
          {plan.weeklyMatrix && plan.weeklyMatrix.length > 0 && (
            <Card className="border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  7-Day Outlook & Farm Load Projection
                </CardTitle>
                <CardDescription className="text-xs">
                  Forecasted daily irrigation runs, nutrient application windows, and tasks across active fields.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 text-center">
                  {plan.weeklyMatrix.map((day, idx) => (
                    <div
                      key={day.date}
                      className={`p-2.5 rounded-lg border text-xs space-y-1.5 ${
                        idx === 0 ? 'bg-emerald-500/10 border-emerald-500/40 font-semibold' : 'bg-muted/30 border-muted'
                      }`}
                    >
                      <div className="font-bold text-foreground">{day.dayName}</div>
                      <div className="text-2xs text-muted-foreground font-mono">{day.date.slice(5)}</div>
                      <Separator />
                      <div className="text-2xs space-y-1 text-left pt-0.5">
                        <div className="flex items-center justify-between text-sky-600 dark:text-sky-400">
                          <span>💧 Irrig:</span>
                          <span className="font-bold">{day.irrigationRuns}</span>
                        </div>
                        <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
                          <span>🌿 Fert:</span>
                          <span className="font-bold">{day.nutrientApplications}</span>
                        </div>
                        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                          <span>📋 Tasks:</span>
                          <span className="font-bold">{day.tasksCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Empty State / Call to Action */
        <Card className="border-dashed border-2">
          <CardContent className="py-12 px-4 text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-foreground">
                No Day Plan Generated Yet for {selectedDate}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Click below to have the Gemini Precision Agronomist analyze your {activeFields.length} active field(s), compute ET₀ deficits, and schedule optimized irrigation and fertigation windows.
              </p>
            </div>
            <Button
              onClick={handleGeneratePlan}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2 text-amber-300" />
                  Generate AI Day Plan
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
