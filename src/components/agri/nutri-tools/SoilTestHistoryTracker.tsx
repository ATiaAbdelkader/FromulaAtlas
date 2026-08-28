'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FlaskConical,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Download,
  MapPin,
  Calendar,
  Sparkles,
  Leaf,
  Activity,
  Layers,
  Printer,
  History,
  Trees,
  LineChart,
} from 'lucide-react';
import {
  getSoilTests,
  saveSoilTest,
  deleteSoilTest,
  computeTrends,
  computeFieldHealthScore,
  getFieldNames,
  getLatestTest,
  type SoilTestEntry,
  type SoilTrend,
  type FieldHealthScore,
} from '@/lib/soil-history-store';
import { useTranslation, copyFor } from '@/lib/language-store';
import { SoilMultiYearTrendsChart } from '@/components/agri/nutri-tools/SoilMultiYearTrendsChart';

const TREND_COLORS: Record<SoilTrend['direction'], string> = {
  improving: '#16a34a',
  declining: '#dc2626',
  stable: '#64748b',
};

const STATUS_COLORS: Record<SoilTrend['status'], string> = {
  low: '#ea580c',
  optimal: '#16a34a',
  high: '#7c3aed',
};

export function SoilTestHistoryTracker() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const isAr = language === 'ar';
  const isFr = language === 'fr';
  const [entries, setEntries] = useState<SoilTestEntry[]>([]);
  const [selectedField, setSelectedField] = useState<string>('Pivot 1 - North Valley');
  const [activeView, setActiveView] = useState<'d3-trends' | 'timeline' | 'trends' | 'health' | 'history'>('d3-trends');
  const [showForm, setShowForm] = useState(false);

  const [newEntry, setNewEntry] = useState<Record<string, any>>({
    date: new Date().toISOString().slice(0, 10),
    fieldName: 'Pivot 1 - North Valley',
    ph: 6.6,
    om: 2.8,
    cec: 15,
    ca: 9.0,
    mg: 1.4,
    k: 0.5,
    na: 0.2,
    p: 30,
    sand: 40,
    silt: 35,
    clay: 25,
    cropGrown: 'Wheat',
    notes: '',
  });

  useEffect(() => {
    setEntries(getSoilTests());
  }, []);

  const fieldNames = useMemo(() => getFieldNames(entries), [entries]);
  const filtered = useMemo(
    () => (selectedField === 'all' ? entries : entries.filter((e) => e.fieldName === selectedField)),
    [entries, selectedField]
  );
  const trends = useMemo(() => computeTrends(filtered), [filtered]);
  const latest = useMemo(() => getLatestTest(filtered), [filtered]);
  const healthScore = useMemo(
    () => computeFieldHealthScore(entries, selectedField === 'all' ? fieldNames[0] || 'Field' : selectedField),
    [entries, selectedField, fieldNames]
  );

  const handleAdd = () => {
    const entry: SoilTestEntry = {
      id: `soil-${Date.now()}`,
      date: newEntry.date || new Date().toISOString().slice(0, 10),
      fieldName: newEntry.fieldName || 'Field A',
      ph: Number(newEntry.ph) || 7.0,
      om: Number(newEntry.om) || 2.0,
      cec: Number(newEntry.cec) || 15,
      ca: Number(newEntry.ca) || 8,
      mg: Number(newEntry.mg) || 1.5,
      k: Number(newEntry.k) || 0.4,
      na: Number(newEntry.na) || 0.2,
      p: Number(newEntry.p) || 25,
      sand: Number(newEntry.sand) || 40,
      silt: Number(newEntry.silt) || 35,
      clay: Number(newEntry.clay) || 25,
      cropGrown: newEntry.cropGrown || '',
      notes: newEntry.notes || '',
    };
    setEntries(saveSoilTest(entry));
    setShowForm(false);
  };

  const handleDelete = (id: string) => setEntries(deleteSoilTest(id));

  // Critical Drawdown Alerts (e.g. rapid loss of K or P or OM)
  const drawdownAlerts = useMemo(() => {
    return trends.filter((t) => t.drawdownWarning);
  }, [trends]);

  return (
    <Card className="overflow-hidden border-emerald-100 shadow-sm dark:border-emerald-900/60">
      {/* Top Header & Field Switcher Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-border/60 bg-muted/20 p-3.5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
            <History className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground">
              {tr('Multi-Year Soil Health & Historic Parcel Tracker', 'سجل صحة التربة المتعدد السنوات وتتبع استنزاف القطع', 'Suivi Historique & Santé du Sol')}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {tr('Monitor nutrient trajectory, drawdown warnings, and carbon stock changes.', 'متابعة تغيرات خصوبة التربة ومخزون الكربون والتحذير من استنزاف العناصر.', 'Évolution pluriannuelle des nutriments et séquestration carbone.')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Select value={selectedField} onValueChange={setSelectedField}>
            <SelectTrigger className="h-9 min-w-44 text-xs font-bold bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr('All Parcels / Fields', 'جميع الحقول والقطع', 'Toutes les parcelles')}</SelectItem>
              {fieldNames.map((f) => (
                <SelectItem key={f} value={f} className="text-xs">
                  <MapPin className="h-3 w-3 inline mr-1 text-emerald-600" />
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button size="sm" onClick={() => setShowForm(!showForm)} className="h-9 gap-1.5 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
            <Plus className="h-3.5 w-3.5" />
            {tr('Log Lab Test', 'تسجيل تحليل مخبري', 'Ajouter Analyse')}
          </Button>

          <Button size="sm" variant="outline" onClick={() => window.print()} className="h-9 gap-1.5 px-2.5 text-xs">
            <Printer className="h-3.5 w-3.5" />
            {tr('Print', 'طباعة', 'Imprimer')}
          </Button>
        </div>
      </div>

      {/* Critical Drawdown Banner */}
      {drawdownAlerts.length > 0 && (
        <div className="m-3 p-3 rounded-xl bg-red-50/80 dark:bg-red-950/40 border border-red-300 dark:border-red-900 text-red-950 dark:text-red-100 flex items-start gap-2.5 text-xs shadow-2xs">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">
              {tr('Critical Nutrient Drawdown Detected!', 'تنبيه حرج: رصد استنزاف حاد للعناصر الغذائية!', 'Alerte : Épuisement Nutritif Détecté !')}
            </span>
            <p className="text-[11px] mt-0.5">
              {tr(
                `The soil records for this parcel indicate significant depletion in: ${drawdownAlerts.map((d) => isAr ? d.label_ar : d.label).join(', ')}. Nutrient harvest extraction is exceeding application replenishment.`,
                `تشير السجلات إلى تراجع حاد في مخزون: ${drawdownAlerts.map((d) => isAr ? d.label_ar : d.label).join('، ')}. كميات السحب بالمحصول تفوق التسميد التعويضي.`,
                `Épuisement important détecté sur : ${drawdownAlerts.map((d) => d.label).join(', ')}.`
              )}
            </p>
          </div>
        </div>
      )}

      {/* Add New Soil Test Form (Collapsible) */}
      {showForm && (
        <div className="mx-3 mt-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/40 p-4 shadow-xs dark:border-emerald-800 dark:bg-emerald-950/10">
          <div className="mb-3 flex items-start gap-2">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <FlaskConical className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold">{tr('Enter Laboratory Soil Test Record', 'إدخال نتائج تحليل التربة المخبري', 'Saisie Analyse de Sol')}</p>
              <p className="text-[11px] text-muted-foreground">
                {tr('Capture analytical values to update parcel history and nutrient trajectory.', 'سجل بيانات المختبر لتحديث سجل القطعة ومؤشر صحة التربة.', 'Renseignez les valeurs pour recalculer les trajectoires.')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <div>
              <Label className="text-[10px] font-semibold">{tr('Sampling Date', 'تاريخ أخذ العينة', 'Date')}</Label>
              <Input type="date" value={newEntry.date} onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })} className="h-8 text-xs mt-0.5" />
            </div>
            <div>
              <Label className="text-[10px] font-semibold">{tr('Parcel Name', 'اسم القطعة / الحقل', 'Parcelle')}</Label>
              <Input value={newEntry.fieldName} onChange={(e) => setNewEntry({ ...newEntry, fieldName: e.target.value })} className="h-8 text-xs mt-0.5" />
            </div>
            <div>
              <Label className="text-[10px] font-semibold">pH (1:2.5)</Label>
              <Input type="number" step="0.1" value={newEntry.ph} onChange={(e) => setNewEntry({ ...newEntry, ph: e.target.value })} className="h-8 text-xs mt-0.5" />
            </div>
            <div>
              <Label className="text-[10px] font-semibold">{tr('Organic Matter (%)', 'المادة العضوية (%)', 'MO (%)')}</Label>
              <Input type="number" step="0.1" value={newEntry.om} onChange={(e) => setNewEntry({ ...newEntry, om: e.target.value })} className="h-8 text-xs mt-0.5" />
            </div>
            <div>
              <Label className="text-[10px] font-semibold">P Olsen (ppm)</Label>
              <Input type="number" value={newEntry.p} onChange={(e) => setNewEntry({ ...newEntry, p: e.target.value })} className="h-8 text-xs mt-0.5" />
            </div>
            <div>
              <Label className="text-[10px] font-semibold">K (meq/100g)</Label>
              <Input type="number" step="0.05" value={newEntry.k} onChange={(e) => setNewEntry({ ...newEntry, k: e.target.value })} className="h-8 text-xs mt-0.5" />
            </div>
            <div>
              <Label className="text-[10px] font-semibold">Ca (meq/100g)</Label>
              <Input type="number" step="0.1" value={newEntry.ca} onChange={(e) => setNewEntry({ ...newEntry, ca: e.target.value })} className="h-8 text-xs mt-0.5" />
            </div>
            <div>
              <Label className="text-[10px] font-semibold">Mg (meq/100g)</Label>
              <Input type="number" step="0.1" value={newEntry.mg} onChange={(e) => setNewEntry({ ...newEntry, mg: e.target.value })} className="h-8 text-xs mt-0.5" />
            </div>
            <div>
              <Label className="text-[10px] font-semibold">Na (meq/100g)</Label>
              <Input type="number" step="0.05" value={newEntry.na} onChange={(e) => setNewEntry({ ...newEntry, na: e.target.value })} className="h-8 text-xs mt-0.5" />
            </div>
            <div>
              <Label className="text-[10px] font-semibold">CEC (meq/100g)</Label>
              <Input type="number" step="0.5" value={newEntry.cec} onChange={(e) => setNewEntry({ ...newEntry, cec: e.target.value })} className="h-8 text-xs mt-0.5" />
            </div>
            <div>
              <Label className="text-[10px] font-semibold">{tr('Crop Grown', 'المحصول المزروع', 'Culture')}</Label>
              <Input value={newEntry.cropGrown} onChange={(e) => setNewEntry({ ...newEntry, cropGrown: e.target.value })} placeholder="e.g. Tomato" className="h-8 text-xs mt-0.5" />
            </div>
            <div>
              <Label className="text-[10px] font-semibold">{tr('Texture (Sand/Clay %)', 'القوام (رمل/طين %)', 'Texture')}</Label>
              <div className="flex gap-1 mt-0.5">
                <Input type="number" placeholder="Sand" value={newEntry.sand} onChange={(e) => setNewEntry({ ...newEntry, sand: e.target.value })} className="h-8 text-xs" />
                <Input type="number" placeholder="Clay" value={newEntry.clay} onChange={(e) => setNewEntry({ ...newEntry, clay: e.target.value })} className="h-8 text-xs" />
              </div>
            </div>
          </div>

          <Textarea
            value={newEntry.notes}
            onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
            placeholder={tr('Agronomic observations, fertilizations applied, yield notes...', 'ملاحظات زراعية، تسميد مطبق، إنتاجية...', 'Observations...')}
            className="min-h-16 text-xs mt-2.5"
          />

          <div className="flex justify-end gap-2 mt-2.5">
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="h-8 text-xs">
              {tr('Cancel', 'إلغاء', 'Annuler')}
            </Button>
            <Button size="sm" onClick={handleAdd} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              <Plus className="h-3.5 w-3.5 mr-1" />
              {tr('Save to Soil Database', 'حفظ في قاعدة البيانات', 'Enregistrer')}
            </Button>
          </div>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="p-3">
        <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)}>
          <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full h-auto p-1 bg-muted/80 rounded-xl border">
            <TabsTrigger value="d3-trends" className="py-2 text-xs font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span>{tr('D3 Multi-Year Trends', 'مخطط الاتجاهات D3', 'Tendances D3')}</span>
              <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono">
                pH • OM • CEC
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="py-2 text-xs font-semibold flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-blue-600" />
              <span>{tr('Matrix', 'مصفوفة المقارنة', 'Matrice')}</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="py-2 text-xs font-semibold flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-amber-600" />
              <span>{tr('Nutrient Warnings', 'تحذيرات العناصر', 'Alertes')}</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="py-2 text-xs font-semibold flex items-center gap-1.5">
              <Leaf className="h-3.5 w-3.5 text-green-600" />
              <span>{tr('Health & Carbon', 'الصحة والكربون', 'Santé & Carbone')}</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="py-2 text-xs font-semibold flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-purple-600" />
              <span>{tr('Lab Records', 'سجل التحاليل', 'Analyses')}</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 0: D3.JS MULTI-YEAR VISUALIZATION */}
          <TabsContent value="d3-trends" className="space-y-4 pt-3">
            <SoilMultiYearTrendsChart
              entries={entries}
              selectedField={selectedField}
            />
          </TabsContent>

          {/* TAB 1: MULTI-YEAR COMPARISON MATRIX */}
          <TabsContent value="timeline" className="space-y-4 pt-3">
            <div className="overflow-x-auto rounded-xl border shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/70 border-b text-[11px]">
                  <tr>
                    <th className="p-3 font-bold">{tr('Parameter / Nutrient', 'المعيار / العنصر', 'Paramètre')}</th>
                    <th className="p-3 font-semibold text-muted-foreground">{tr('Optimal Range', 'النطاق المثالي', 'Optimal')}</th>
                    {filtered.map((test) => (
                      <th key={test.id} className="p-3 text-center font-mono font-bold bg-background/50 border-l">
                        <div>{test.date.slice(0, 4)}</div>
                        <div className="text-[9px] font-normal text-muted-foreground font-sans">{test.cropGrown || test.date.slice(5)}</div>
                      </th>
                    ))}
                    <th className="p-3 text-right font-bold bg-emerald-50/50 dark:bg-emerald-950/20">{tr('Net Trend', 'محصلة التغير', 'Évolution')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono">
                  {/* Organic Matter Row */}
                  <tr className="hover:bg-muted/20">
                    <td className="p-2.5 font-sans font-bold flex items-center gap-1.5">
                      <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                      {tr('Organic Matter (%)', 'المادة العضوية (%)', 'Matière Organique (%)')}
                    </td>
                    <td className="p-2.5 font-sans text-muted-foreground">2.5 – 4.5%</td>
                    {filtered.map((t) => (
                      <td key={t.id} className="p-2.5 text-center font-bold border-l">
                        {t.om}%
                      </td>
                    ))}
                    <td className="p-2.5 text-right font-bold text-emerald-600">
                      {(trends.find((t) => t.param === 'om')?.change ?? 0) > 0 ? '+' : ''}
                      {trends.find((t) => t.param === 'om')?.change ?? 0}%
                    </td>
                  </tr>

                  {/* pH Row */}
                  <tr className="hover:bg-muted/20">
                    <td className="p-2.5 font-sans font-bold flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-blue-600" />
                      Soil pH (1:2.5)
                    </td>
                    <td className="p-2.5 font-sans text-muted-foreground">6.2 – 7.3</td>
                    {filtered.map((t) => (
                      <td key={t.id} className="p-2.5 text-center font-bold border-l">
                        {t.ph}
                      </td>
                    ))}
                    <td className="p-2.5 text-right font-bold text-blue-600">
                      {(trends.find((t) => t.param === 'ph')?.change ?? 0) > 0 ? '+' : ''}
                      {trends.find((t) => t.param === 'ph')?.change ?? 0}
                    </td>
                  </tr>

                  {/* Phosphorus Row */}
                  <tr className="hover:bg-muted/20">
                    <td className="p-2.5 font-sans font-bold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      Available P (ppm)
                    </td>
                    <td className="p-2.5 font-sans text-muted-foreground">25 – 50 ppm</td>
                    {filtered.map((t) => (
                      <td key={t.id} className="p-2.5 text-center font-bold border-l">
                        {t.p}
                      </td>
                    ))}
                    <td className="p-2.5 text-right font-bold text-amber-600">
                      {(trends.find((t) => t.param === 'p')?.change ?? 0) > 0 ? '+' : ''}
                      {trends.find((t) => t.param === 'p')?.change ?? 0} ppm
                    </td>
                  </tr>

                  {/* Potassium Row */}
                  <tr className="hover:bg-muted/20">
                    <td className="p-2.5 font-sans font-bold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-red-500" />
                      Exchangeable K (meq)
                    </td>
                    <td className="p-2.5 font-sans text-muted-foreground">0.4 – 0.9 meq</td>
                    {filtered.map((t) => (
                      <td key={t.id} className="p-2.5 text-center font-bold border-l">
                        {t.k}
                      </td>
                    ))}
                    <td className="p-2.5 text-right font-bold text-red-600">
                      {(trends.find((t) => t.param === 'k')?.change ?? 0) > 0 ? '+' : ''}
                      {trends.find((t) => t.param === 'k')?.change ?? 0}
                    </td>
                  </tr>

                  {/* Calcium Row */}
                  <tr className="hover:bg-muted/20">
                    <td className="p-2.5 font-sans font-medium">Exchangeable Ca (meq)</td>
                    <td className="p-2.5 font-sans text-muted-foreground">7.0 – 16.0 meq</td>
                    {filtered.map((t) => (
                      <td key={t.id} className="p-2.5 text-center border-l">
                        {t.ca}
                      </td>
                    ))}
                    <td className="p-2.5 text-right">{trends.find((t) => t.param === 'ca')?.change}</td>
                  </tr>

                  {/* Magnesium Row */}
                  <tr className="hover:bg-muted/20">
                    <td className="p-2.5 font-sans font-medium">Exchangeable Mg (meq)</td>
                    <td className="p-2.5 font-sans text-muted-foreground">1.2 – 3.5 meq</td>
                    {filtered.map((t) => (
                      <td key={t.id} className="p-2.5 text-center border-l">
                        {t.mg}
                      </td>
                    ))}
                    <td className="p-2.5 text-right">{trends.find((t) => t.param === 'mg')?.change}</td>
                  </tr>

                  {/* CEC Row */}
                  <tr className="hover:bg-muted/20">
                    <td className="p-2.5 font-sans font-medium">CEC (meq/100g)</td>
                    <td className="p-2.5 font-sans text-muted-foreground">12 – 28 meq</td>
                    {filtered.map((t) => (
                      <td key={t.id} className="p-2.5 text-center border-l">
                        {t.cec}
                      </td>
                    ))}
                    <td className="p-2.5 text-right">{trends.find((t) => t.param === 'cec')?.change}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* TAB 2: NUTRIENT TRENDS & WARNINGS */}
          <TabsContent value="trends" className="space-y-3 pt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {trends.map((trend) => (
                <div key={trend.param} className="p-3.5 rounded-xl border bg-card shadow-2xs space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">
                        {isAr ? trend.label_ar : isFr ? trend.label_fr : trend.label}
                      </span>
                      <Badge
                        variant="outline"
                        style={{ color: STATUS_COLORS[trend.status], borderColor: STATUS_COLORS[trend.status] + '60' }}
                        className="text-[10px]"
                      >
                        {trend.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1 font-mono font-bold text-xs">
                      <span>{trend.current} {trend.unit}</span>
                      {trend.direction === 'improving' && <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />}
                      {trend.direction === 'declining' && <TrendingDown className="h-3.5 w-3.5 text-red-600" />}
                      {trend.direction === 'stable' && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span style={{ color: TREND_COLORS[trend.direction] }}>
                        ({trend.change > 0 ? '+' : ''}{trend.changePct}%)
                      </span>
                    </div>
                  </div>

                  {/* Optimal bar */}
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{tr('Optimal', 'المثالي', 'Optimum')}: {trend.optimal[0]} - {trend.optimal[1]} {trend.unit}</span>
                  </div>

                  {/* Agronomic Recommendation */}
                  <div className="p-2.5 rounded-lg bg-muted/40 text-[11px] leading-relaxed flex items-start gap-1.5">
                    {trend.status === 'optimal' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <span className="text-muted-foreground">
                      {isAr ? trend.recommendation_ar : trend.recommendation}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TAB 3: SOIL HEALTH & CARBON SEQUESTRATION */}
          <TabsContent value="health" className="space-y-4 pt-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Overall Soil Health Score */}
              <Card className="border shadow-xs bg-gradient-to-br from-emerald-600 to-teal-800 text-white">
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold opacity-90">
                      {tr('Overall Soil Health Index (SHI)', 'مؤشر صحة وجودة التربة الشامل', 'Indice Santé du Sol (SHI)')}
                    </span>
                    <div className="text-5xl font-black mt-1 font-mono">
                      {healthScore.overallScore} <span className="text-lg font-normal">/ 100</span>
                    </div>
                    <p className="text-xs opacity-90 mt-1">
                      {healthScore.overallScore >= 80
                        ? tr('Regenerative & High Biological Activity', 'تربة عالية الخصوبة والنشاط الحيوي', 'Sol Régénératif & Très Fertile')
                        : tr('Moderate Fertility — Needs OM Enhancement', 'خصوبة متوسطة — تتطلب تدعيم المادة العضوية', 'Fertilité Moyenne')}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-white/10 backdrop-blur-xs text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>{tr('Organic Matter Subscore', 'درجة المادة العضوية', 'Score MO')}:</span>
                      <span className="font-bold font-mono">{healthScore.omScore}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{tr('pH & Buffer Subscore', 'درجة الحموضة والتنظيم', 'Score pH')}:</span>
                      <span className="font-bold font-mono">{healthScore.phScore}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{tr('Nutrient Reserve Subscore', 'درجة مخزون العناصر', 'Score Nutriments')}:</span>
                      <span className="font-bold font-mono">{healthScore.fertilityScore}/100</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Carbon Stock & Sequestration */}
              <Card className="md:col-span-2 border shadow-xs">
                <CardHeader className="p-4 pb-2 border-b">
                  <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                    <Trees className="h-4 w-4 text-emerald-600" />
                    {tr('Soil Organic Carbon (SOC) & CO₂e Sequestration', 'مخزون الكربون العضوي بالتربة واحتجاز ثاني أكسيد الكربون', 'Stock Carbone & Séquestration')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-muted/40 border">
                      <div className="text-[11px] text-muted-foreground">{tr('Current Topsoil Carbon Stock', 'مخزون الكربون الحالي (0-30سم)', 'Stock Carbone Actuel')}</div>
                      <div className="text-xl font-black font-mono mt-0.5 text-foreground">
                        {healthScore.carbonStockTonPerHa} <span className="text-xs font-normal">t C / ha</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200">
                      <div className="text-[11px] text-emerald-900 dark:text-emerald-200">{tr('Net Carbon Gain (Multi-Year)', 'صافي الزيادة في الكربون', 'Gain Net Carbone')}</div>
                      <div className="text-xl font-black font-mono mt-0.5 text-emerald-700 dark:text-emerald-300">
                        {healthScore.carbonDeltaTonPerHa > 0 ? '+' : ''}{healthScore.carbonDeltaTonPerHa} <span className="text-xs font-normal">t C / ha</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200">
                      <div className="text-[11px] text-emerald-900 dark:text-emerald-200">{tr('CO₂e Sequestered from Atmosphere', 'مكافئ CO₂ المحتجز', 'CO₂e Séquestré')}</div>
                      <div className="text-xl font-black font-mono mt-0.5 text-emerald-700 dark:text-emerald-300">
                        {healthScore.co2eSequesteredTonPerHa > 0 ? '+' : ''}{healthScore.co2eSequesteredTonPerHa} <span className="text-xs font-normal">t CO₂e / ha</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {tr(
                      'Calculated using IPCC Tier 1 soil organic carbon methodology (van Bemmelen 1.724 factor across 0-30cm rootzone depth). Increasing soil organic matter by 1% sequesters approximately 24 tonnes of atmospheric CO₂ equivalent per hectare.',
                      'محسوب وفق معايير الهيئة الدولية لتغير المناخ (IPCC) لعمق 0-30 سم. كل زيادة بنسبة 1% في المادة العضوية تحتجز قرابة 24 طن من مكافئ غاز ثاني أكسيد الكربون لكل هكتار.',
                      'Calculé selon la méthode GIEC Tier 1 (0-30cm). +1% de MO séquestre environ 24 tonnes de CO₂e par hectare.'
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 4: RAW LAB RECORDS TABLE */}
          <TabsContent value="history" className="space-y-3 pt-3">
            <div className="overflow-x-auto rounded-xl border shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/70 text-[11px] text-muted-foreground border-b">
                  <tr>
                    <th className="p-2.5">{tr('Date', 'التاريخ', 'Date')}</th>
                    <th className="p-2.5">{tr('Parcel', 'القطعة', 'Parcelle')}</th>
                    <th className="p-2.5 text-center">pH</th>
                    <th className="p-2.5 text-center">OM (%)</th>
                    <th className="p-2.5 text-center">P (ppm)</th>
                    <th className="p-2.5 text-center">K (meq)</th>
                    <th className="p-2.5 text-center">Ca (meq)</th>
                    <th className="p-2.5 text-center">Mg (meq)</th>
                    <th className="p-2.5 text-center">CEC</th>
                    <th className="p-2.5">{tr('Crop', 'المحصول', 'Culture')}</th>
                    <th className="p-2.5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono">
                  {filtered.map((e) => (
                    <tr key={e.id} className="hover:bg-muted/30">
                      <td className="p-2.5 font-bold">{e.date}</td>
                      <td className="p-2.5 font-sans font-medium">{e.fieldName}</td>
                      <td className="p-2.5 text-center">{e.ph}</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">{e.om}%</td>
                      <td className="p-2.5 text-center">{e.p}</td>
                      <td className="p-2.5 text-center">{e.k}</td>
                      <td className="p-2.5 text-center">{e.ca}</td>
                      <td className="p-2.5 text-center">{e.mg}</td>
                      <td className="p-2.5 text-center">{e.cec}</td>
                      <td className="p-2.5 font-sans">{e.cropGrown || '—'}</td>
                      <td className="p-2.5 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(e.id)}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
