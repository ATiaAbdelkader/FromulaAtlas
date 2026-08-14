'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  FlaskConical, Plus, Trash2, TrendingUp, TrendingDown, Minus,
  AlertTriangle, CheckCircle2, Download, MapPin, Calendar,
} from 'lucide-react';
import {
  getSoilTests, saveSoilTest, deleteSoilTest, computeTrends, getFieldNames, getLatestTest,
  type SoilTestEntry, type SoilTrend,
} from '@/lib/soil-history-store';
import { copyFor, useTranslation } from '@/lib/language-store';

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
const PARAM_AR: Record<string, string> = {
  'Organic Matter': 'المادة العضوية', Calcium: 'الكالسيوم', Magnesium: 'المغنيسيوم',
  Potassium: 'البوتاسيوم', Phosphorus: 'الفوسفور', Sodium: 'الصوديوم',
};
const STATUS_AR: Record<SoilTrend['status'], string> = { low: 'منخفض', optimal: 'مثالي', high: 'مرتفع' };
const DIRECTION_AR: Record<SoilTrend['direction'], string> = { improving: 'يتحسن', declining: 'يتراجع', stable: 'مستقر' };
function soilParamLabel(language: Parameters<typeof copyFor>[0], label: string): string {
  return copyFor(language, label, PARAM_AR[label] || label);
}
function soilStatusLabel(language: Parameters<typeof copyFor>[0], status: SoilTrend['status']): string {
  return copyFor(language, status, STATUS_AR[status]);
}
function soilDirectionLabel(language: Parameters<typeof copyFor>[0], direction: SoilTrend['direction']): string {
  return copyFor(language, direction, DIRECTION_AR[direction]);
}
function soilRecommendation(language: Parameters<typeof copyFor>[0], text: string): string {
  const copy = (arabic: string) => copyFor(language, text, arabic);
  let match = text.match(/^Apply ([[0-9].]+) t\/ha agricultural lime to raise pH to 6\.5\.$/);
  if (match) return copy(`طبّق ${match[1]} طن/هكتار من الجير الزراعي لرفع درجة الحموضة إلى 6.5.`);
  match = text.match(/^Apply K₂O at ([[0-9].]+) kg\/ha \(MOP or SOP\)\.$/);
  if (match) return copy(`طبّق K₂O بمعدل ${match[1]} كغ/هكتار (MOP أو SOP).`);
  match = text.match(/^High Na \(([^)]+) meq\/100g\) — apply gypsum to displace Na \+ leach with good quality water\.$/);
  if (match) return copy(`الصوديوم مرتفع (${match[1]} ميكاف/100غ) — طبّق الجبس لإزاحة الصوديوم واغسله بمياه جيدة النوعية.`);
  if (text === 'Apply elemental sulfur (200-400 kg/ha) to lower pH. Use acidifying fertigation.') return copy('طبّق الكبريت العنصري (200–400 كغ/هكتار) لخفض درجة الحموضة. استخدم التسميد مع الري المحمّض.');
  if (text === 'pH is in optimal range — maintain current management.') return copy('درجة الحموضة ضمن النطاق المثالي — حافظ على الإدارة الحالية.');
  if (text === 'Apply compost (10-20 t/ha) + plant cover crops. Target +0.3%/year.') return copy('طبّق السماد العضوي (10–20 طن/هكتار) وازرع محاصيل تغطية. استهدف زيادة 0.3٪ سنوياً.');
  if (text === 'Add cover crops + reduced tillage to build OM.') return copy('أضف محاصيل تغطية وقلّل الحراثة لبناء المادة العضوية.');
  if (text === 'OM is good — continue cover cropping and residue retention.') return copy('المادة العضوية جيدة — واصل زراعة محاصيل التغطية والاحتفاظ بالمخلفات.');
  if (text === 'K adequate — monitor with petiole tests during season.') return copy('البوتاسيوم كافٍ — راقبه باختبارات أعناق الأوراق خلال الموسم.');
  if (text === 'Apply 40-60 kg P₂O₅/ha as DAP or MAP at planting.') return copy('طبّق 40–60 كغ P₂O₅/هكتار على شكل DAP أو MAP عند الزراعة.');
  if (text === 'P high — skip P fertilizer this season to avoid environmental loss.') return copy('الفوسفور مرتفع — تجاوز التسميد الفوسفاتي هذا الموسم لتجنب الفقد البيئي.');
  if (text === 'P optimal — apply maintenance rate (20-30 kg P₂O₅/ha).') return copy('الفوسفور مثالي — طبّق معدل صيانة (20–30 كغ P₂O₅/هكتار).');
  if (text === 'Apply gypsum (500-1000 kg/ha) or lime if pH also low.') return copy('طبّق الجبس (500–1000 كغ/هكتار) أو الجير إذا كانت درجة الحموضة منخفضة أيضاً.');
  if (text === 'Ca adequate.') return copy('الكالسيوم كافٍ.');
  if (text === 'Apply dolomitic lime or MgSO₄ (Epsom salt, 50-100 kg/ha).') return copy('طبّق الجير الدولوميتي أو MgSO₄ (ملح إبسوم، 50–100 كغ/هكتار).');
  if (text === 'Mg adequate.') return copy('المغنيسيوم كافٍ.');
  if (text === 'Na levels safe.') return copy('مستويات الصوديوم آمنة.');
  if (text === 'Low CEC — split fertilizer applications, add OM to improve retention.') return copy('السعة التبادلية الكاتيونية منخفضة — قسّم دفعات التسميد وأضف مادة عضوية لتحسين الاحتفاظ.');
  if (text === 'High CEC — good nutrient buffer, can apply larger doses.') return copy('السعة التبادلية الكاتيونية مرتفعة — مخزن جيد للعناصر الغذائية ويمكن تطبيق جرعات أكبر.');
  if (text === 'CEC in normal range.') return copy('السعة التبادلية الكاتيونية ضمن النطاق الطبيعي.');
  return text;
}

export function SoilTestHistoryTracker() {
  const { language } = useTranslation();
  const [entries, setEntries] = useState<SoilTestEntry[]>([]);
  const [selectedField, setSelectedField] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [newEntry, setNewEntry] = useState<Record<string, any>>({
    date: new Date().toISOString().slice(0, 10), fieldName: 'Field A',
    ph: 6.5, om: 2.5, cec: 15, ca: 8, mg: 1.2, k: 0.4, na: 0.2, p: 25,
    sand: 40, silt: 35, clay: 25, notes: '',
  });

  useEffect(() => { setEntries(getSoilTests()); }, []);

  const fieldNames = useMemo(() => getFieldNames(entries), [entries]);
  const filtered = useMemo(() => selectedField === 'all' ? entries : entries.filter(e => e.fieldName === selectedField), [entries, selectedField]);
  const trends = useMemo(() => computeTrends(filtered), [filtered]);
  const latest = useMemo(() => getLatestTest(filtered), [filtered]);

  const handleAdd = () => {
    const entry: SoilTestEntry = {
      id: `soil-${Date.now()}`,
      date: newEntry.date || new Date().toISOString().slice(0, 10),
      fieldName: newEntry.fieldName || 'Unknown',
      ph: Number(newEntry.ph) || 0, om: Number(newEntry.om) || 0, cec: Number(newEntry.cec) || 0,
      ca: Number(newEntry.ca) || 0, mg: Number(newEntry.mg) || 0, k: Number(newEntry.k) || 0,
      na: Number(newEntry.na) || 0, p: Number(newEntry.p) || 0,
      sand: Number(newEntry.sand) || 0, silt: Number(newEntry.silt) || 0, clay: Number(newEntry.clay) || 0,
      notes: newEntry.notes || '',
    };
    setEntries(saveSoilTest(entry));
    setShowForm(false);
  };

  const handleDelete = (id: string) => setEntries(deleteSoilTest(id));

  const exportPdf = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const trendRows = trends.map(t => `<tr><td>${soilParamLabel(language, t.label)}</td><td style="text-align:right">${t.current} ${t.unit}</td><td style="text-align:right">${t.change > 0 ? '+' : ''}${t.change} (${t.changePct > 0 ? '+' : ''}${t.changePct}%)</td><td>${soilDirectionLabel(language, t.direction)}</td><td>${soilStatusLabel(language, t.status)}</td><td>${soilRecommendation(language, t.recommendation)}</td></tr>`).join('');
    const entryRows = filtered.map(e => `<tr><td>${e.date}</td><td>${e.fieldName}</td><td style="text-align:center">${e.ph}</td><td style="text-align:center">${e.om}%</td><td style="text-align:center">${e.cec}</td><td style="text-align:center">${e.ca}</td><td style="text-align:center">${e.mg}</td><td style="text-align:center">${e.k}</td><td style="text-align:center">${e.p}</td></tr>`).join('');
    win.document.write(`<!DOCTYPE html><html><head><title>${copyFor(language, 'Soil Test History Report', 'تقرير سجل اختبارات التربة')}</title><style>
      body{font-family:system-ui,sans-serif;margin:24px;color:#0f172a} h1{color:#16a34a;font-size:20px}
      .meta{color:#475569;font-size:12px;margin-bottom:16px} table{width:100%;border-collapse:collapse;font-size:10px;margin-bottom:16px}
      th{background:#ecfdf5;color:#047857;padding:6px;border:1px solid #a7f3d0;text-align:left} td{padding:4px 6px;border:1px solid #d1fae5}
      @page{size:landscape;margin:12mm}
    </style></head><body>
      <h1>📊 ${copyFor(language, 'Soil Test History Report', 'تقرير سجل اختبارات التربة')}</h1>
      <div class="meta">${copyFor(language, 'Field', 'الحقل')}: ${selectedField === 'all' ? copyFor(language, 'All fields', 'جميع الحقول') : selectedField} · ${filtered.length} ${copyFor(language, 'tests', 'اختبارات')} · ${copyFor(language, 'Generated', 'تاريخ الإنشاء')}: ${new Date().toLocaleString()}</div>
      <h2>${copyFor(language, 'Parameter Trends & Recommendations', 'اتجاهات المعايير والتوصيات')}</h2>
      <table><thead><tr><th>${copyFor(language, 'Parameter', 'المعيار')}</th><th>${copyFor(language, 'Current', 'الحالي')}</th><th>${copyFor(language, 'Change', 'التغير')}</th><th>${copyFor(language, 'Trend', 'الاتجاه')}</th><th>${copyFor(language, 'Status', 'الحالة')}</th><th>${copyFor(language, 'Recommendation', 'التوصية')}</th></tr></thead><tbody>${trendRows}</tbody></table>
      <h2>${copyFor(language, 'Test History', 'سجل الاختبارات')}</h2>
      <table><thead><tr><th>${copyFor(language, 'Date', 'التاريخ')}</th><th>${copyFor(language, 'Field', 'الحقل')}</th><th>pH</th><th>OM%</th><th>CEC</th><th>Ca</th><th>Mg</th><th>K</th><th>P</th></tr></thead><tbody>${entryRows}</tbody></table>
    </body></html>`);
    win.document.close(); setTimeout(() => win.print(), 300);
  };

  return (
    <Card className="overflow-hidden border-emerald-100 shadow-sm dark:border-emerald-900/60">
      {/* Field selector + actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-border/60 bg-muted/10 p-3">
        <Select value={selectedField} onValueChange={setSelectedField}>
          <SelectTrigger aria-label={copyFor(language, 'Filter soil tests by field', 'تصفية اختبارات التربة حسب الحقل')} className="h-10 min-w-44 text-sm bg-background"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copyFor(language, 'All Fields', 'جميع الحقول')}</SelectItem>
            {fieldNames.map(f => <SelectItem key={f} value={f}><MapPin className="h-3 w-3 inline mr-1" />{f}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} className="h-10 gap-2 px-3 text-sm">
          <Plus className="h-3.5 w-3.5" /> {copyFor(language, 'Add Test', 'إضافة اختبار')}
        </Button>
        <Button size="sm" variant="ghost" onClick={exportPdf} className="h-10 gap-2 px-3 text-sm sm:ml-auto">
          <Download className="h-3.5 w-3.5" /> {copyFor(language, 'PDF', 'PDF')}
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mx-3 mt-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/40 p-4 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/10">
          <div className="mb-3 flex items-start gap-2">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"><FlaskConical className="h-4 w-4" /></div>
            <div><p className="text-sm font-semibold">{copyFor(language, 'Add a soil test', 'إضافة اختبار تربة')}</p><p className="text-xs text-muted-foreground">{copyFor(language, 'Capture the lab values once, then compare field trends over time.', 'سجّل قيم المختبر مرة واحدة، ثم قارن اتجاهات الحقل بمرور الوقت.')}</p></div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div><Label className="text-[11px] font-medium">{copyFor(language, 'Date', 'التاريخ')}</Label><Input type="date" value={newEntry.date} onChange={e => setNewEntry({ ...newEntry, date: e.target.value })} className="mt-1 h-10 text-sm" /></div>
            <div><Label className="text-[11px] font-medium">{copyFor(language, 'Field name', 'اسم الحقل')}</Label><Input value={newEntry.fieldName} onChange={e => setNewEntry({ ...newEntry, fieldName: e.target.value })} className="mt-1 h-10 text-sm" /></div>
            <div><Label className="text-[11px] font-medium">pH</Label><Input type="number" step="0.1" value={newEntry.ph as any} onChange={e => setNewEntry({ ...newEntry, ph: e.target.value })} className="mt-1 h-10 text-sm" /></div>
            <div><Label className="text-[11px] font-medium">{copyFor(language, 'OM (%)', 'المادة العضوية (%)')}</Label><Input type="number" step="0.1" value={newEntry.om as any} onChange={e => setNewEntry({ ...newEntry, om: e.target.value })} className="mt-1 h-10 text-sm" /></div>
            <div><Label className="text-[11px] font-medium">CEC (meq/100g)</Label><Input type="number" step="0.1" value={newEntry.cec as any} onChange={e => setNewEntry({ ...newEntry, cec: e.target.value })} className="mt-1 h-10 text-sm" /></div>
            <div><Label className="text-[11px] font-medium">Ca (meq/100g)</Label><Input type="number" step="0.1" value={newEntry.ca as any} onChange={e => setNewEntry({ ...newEntry, ca: e.target.value })} className="mt-1 h-10 text-sm" /></div>
            <div><Label className="text-[11px] font-medium">Mg (meq/100g)</Label><Input type="number" step="0.1" value={newEntry.mg as any} onChange={e => setNewEntry({ ...newEntry, mg: e.target.value })} className="mt-1 h-10 text-sm" /></div>
            <div><Label className="text-[11px] font-medium">K (meq/100g)</Label><Input type="number" step="0.1" value={newEntry.k as any} onChange={e => setNewEntry({ ...newEntry, k: e.target.value })} className="mt-1 h-10 text-sm" /></div>
            <div><Label className="text-[11px] font-medium">Na (meq/100g)</Label><Input type="number" step="0.1" value={newEntry.na as any} onChange={e => setNewEntry({ ...newEntry, na: e.target.value })} className="mt-1 h-10 text-sm" /></div>
            <div><Label className="text-[11px] font-medium">P (ppm)</Label><Input type="number" value={newEntry.p as any} onChange={e => setNewEntry({ ...newEntry, p: e.target.value })} className="mt-1 h-10 text-sm" /></div>
            <div><Label className="text-[11px] font-medium">{copyFor(language, 'Sand (%)', 'الرمل (%)')}</Label><Input type="number" value={newEntry.sand as any} onChange={e => setNewEntry({ ...newEntry, sand: e.target.value })} className="mt-1 h-10 text-sm" /></div>
            <div><Label className="text-[11px] font-medium">{copyFor(language, 'Silt (%)', 'الغرين (%)')}</Label><Input type="number" value={newEntry.silt as any} onChange={e => setNewEntry({ ...newEntry, silt: e.target.value })} className="mt-1 h-10 text-sm" /></div>
          </div>
          <Textarea value={newEntry.notes} onChange={e => setNewEntry({ ...newEntry, notes: e.target.value })} placeholder={copyFor(language, 'Notes...', 'ملاحظات...')} className="min-h-20 resize-y text-sm" />
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="h-10">{copyFor(language, 'Cancel', 'إلغاء')}</Button>
            <Button size="sm" onClick={handleAdd} className="h-10 gap-2"><Plus className="h-4 w-4" /> {copyFor(language, 'Save Test', 'حفظ الاختبار')}</Button>
          </div>
        </div>
      )}

      {/* Latest test summary */}
      {latest && (
        <div className="mx-3 mt-3 rounded-xl border border-emerald-200/70 bg-emerald-50/30 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"><Calendar className="h-4 w-4" /></div>
            <div className="min-w-0"><p className="text-sm font-semibold">{copyFor(language, 'Latest test', 'أحدث اختبار')}</p><p className="text-xs text-muted-foreground">{latest.date} · {latest.fieldName}</p></div>
            <Badge variant="outline" className="ml-auto text-[10px]">{filtered.length} {copyFor(language, 'tests on record', 'اختباراً مسجلاً')}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {[
              { l: 'pH', v: latest.ph }, { l: 'OM%', v: latest.om }, { l: 'CEC', v: latest.cec },
              { l: 'Ca', v: latest.ca }, { l: 'Mg', v: latest.mg }, { l: 'K', v: latest.k },
              { l: 'Na', v: latest.na }, { l: 'P', v: latest.p },
            ].map(s => (
              <div key={s.l} className="text-center rounded p-1.5 bg-background/60 border">
                <div className="text-[8px] text-muted-foreground uppercase">{s.l}</div>
                <div className="text-sm font-bold">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filtered.length > 0 ? (
        <>
      {/* Trend charts */}
      <div className="space-y-3 px-3 pt-4">
        <div><p className="text-sm font-semibold">{copyFor(language, 'Parameter trends', 'اتجاهات المعايير')}</p><p className="text-xs text-muted-foreground">{copyFor(language, 'Compare the latest values with the previous test and the target range.', 'قارن أحدث القيم بالاختبار السابق وبالنطاق المستهدف.')}</p></div>
        {trends.map(trend => (
          <div key={trend.param} className="rounded-xl border border-border/70 bg-background/70 p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">{soilParamLabel(language, trend.label)}</span>
                <span className="text-[10px] text-muted-foreground">{trend.unit}</span>
                <Badge variant="outline" className="text-[8px]" style={{ color: STATUS_COLORS[trend.status], borderColor: STATUS_COLORS[trend.status] + '60' }}>
                  {soilStatusLabel(language, trend.status)}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="font-mono font-bold">{trend.current}</span>
                {trend.direction === 'improving' && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                {trend.direction === 'declining' && <TrendingDown className="h-3 w-3 text-red-500" />}
                {trend.direction === 'stable' && <Minus className="h-3 w-3 text-muted-foreground" />}
                <span style={{ color: TREND_COLORS[trend.direction] }}>
                  {trend.change > 0 ? '+' : ''}{trend.change} ({trend.changePct > 0 ? '+' : ''}{trend.changePct}%)
                </span>
              </div>
            </div>
            {/* Mini line chart */}
            {trend.values.length > 1 && <MiniChart trend={trend} />}
            {/* Optimal range bar */}
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground mt-1">
              <span>{copyFor(language, 'Optimal', 'المثالي')}: {trend.optimal[0]}-{trend.optimal[1]}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden relative">
                <div className="absolute h-full bg-emerald-300/40" style={{
                  left: `${Math.max(0, Math.min(100, (trend.optimal[0] / (trend.optimal[1] * 1.5)) * 100))}%`,
                  width: `${Math.max(5, Math.min(100, ((trend.optimal[1] - trend.optimal[0]) / (trend.optimal[1] * 1.5)) * 100))}%`,
                }} />
                <div className="absolute top-0 bottom-0 w-0.5 bg-foreground" style={{
                  left: `${Math.max(0, Math.min(100, (trend.current / (trend.optimal[1] * 1.5)) * 100))}%`,
                }} />
              </div>
            </div>
            {/* Recommendation */}
            <div className="text-[10px] text-muted-foreground mt-1 flex items-start gap-1">
              {trend.status === 'optimal' ? <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="h-2.5 w-2.5 text-amber-500 flex-shrink-0 mt-0.5" />}
              {soilRecommendation(language, trend.recommendation)}
            </div>
          </div>
        ))}
      </div>

      {/* Test history table */}
      <div className="px-3 pb-3 pt-2">
        <div className="mb-2 flex items-end justify-between gap-2"><div><p className="text-sm font-semibold">{copyFor(language, 'Test history', 'سجل الاختبارات')}</p><p className="text-xs text-muted-foreground">{copyFor(language, 'Review recorded lab values by date.', 'راجع قيم المختبر المسجلة حسب التاريخ.')}</p></div><Badge variant="secondary" className="text-[10px]">{filtered.length} {copyFor(language, 'records', 'سجلاً')}</Badge></div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr className="text-left text-[10px] text-muted-foreground">
                <th className="px-2 py-1.5">{copyFor(language, 'Date', 'التاريخ')}</th><th className="px-2 py-1.5">{copyFor(language, 'Field', 'الحقل')}</th>
                <th className="px-2 py-1.5 text-center">pH</th><th className="px-2 py-1.5 text-center">OM</th>
                <th className="px-2 py-1.5 text-center">CEC</th><th className="px-2 py-1.5 text-center">Ca</th>
                <th className="px-2 py-1.5 text-center">Mg</th><th className="px-2 py-1.5 text-center">K</th>
                <th className="px-2 py-1.5 text-center">P</th><th></th>
              </tr>
            </thead>
            <tbody>
              {[...filtered].reverse().map(e => (
                <tr key={e.id} className="border-t border-border/40">
                  <td className="px-2 py-1.5 font-mono text-[10px]">{e.date}</td>
                  <td className="px-2 py-1.5">{e.fieldName}</td>
                  <td className="px-2 py-1.5 text-center font-mono">{e.ph}</td>
                  <td className="px-2 py-1.5 text-center font-mono">{e.om}%</td>
                  <td className="px-2 py-1.5 text-center font-mono">{e.cec}</td>
                  <td className="px-2 py-1.5 text-center font-mono">{e.ca}</td>
                  <td className="px-2 py-1.5 text-center font-mono">{e.mg}</td>
                  <td className="px-2 py-1.5 text-center font-mono">{e.k}</td>
                  <td className="px-2 py-1.5 text-center font-mono">{e.p}</td>
                  <td className="px-2 py-1.5"><button type="button" aria-label={copyFor(language, `Delete soil test from ${e.date}`, `حذف اختبار التربة بتاريخ ${e.date}`)} title={copyFor(language, 'Delete soil test', 'حذف اختبار التربة')} onClick={() => handleDelete(e.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      ) : (
        <div className="mx-3 my-4 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-6 text-center dark:border-emerald-800 dark:bg-emerald-950/10">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"><FlaskConical className="h-6 w-6" /></div>
          <p className="text-sm font-semibold">{copyFor(language, 'No soil tests for this view', 'لا توجد اختبارات تربة لهذا العرض')}</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">{copyFor(language, 'Add a lab result to unlock parameter trends, target-range guidance, and a searchable history for this field.', 'أضف نتيجة مختبر لفتح اتجاهات المعايير وإرشادات النطاق المستهدف وسجل قابل للبحث لهذا الحقل.')}</p>
          <Button size="sm" onClick={() => setShowForm(true)} className="mt-4 h-10 gap-2"><Plus className="h-4 w-4" /> {copyFor(language, 'Add first test', 'إضافة أول اختبار')}</Button>
        </div>
      )}
    </Card>
  );
}

/** Mini SVG line chart for a soil parameter trend. */
function MiniChart({ trend }: { trend: SoilTrend }) {
  const w = 300, h = 40, pad = 4;
  const values = trend.values;
  const allVals = [...values.map(v => v.value), ...trend.optimal];
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const range = max - min || 1;

  const x = (i: number) => pad + (i / (values.length - 1)) * (w - 2 * pad);
  const y = (v: number) => h - pad - ((v - min) / range) * (h - 2 * pad);

  const points = values.map((v, i) => `${x(i)},${y(v.value)}`).join(' ');
  const color = TREND_COLORS[trend.direction];
  const optTop = y(trend.optimal[1]);
  const optBot = y(trend.optimal[0]);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10">
      {/* Optimal zone */}
      <rect x={pad} y={optTop} width={w - 2 * pad} height={Math.max(1, optBot - optTop)} fill="#16a34a20" />
      {/* Line */}
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
      {/* Points */}
      {values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v.value)} r="2.5" fill={color} />)}
      {/* Date labels */}
      {values.map((v, i) => (
        <text key={i} x={x(i)} y={h - 1} textAnchor="middle" fontSize="6" fill="#94a3b8">{v.date.slice(2, 7)}</text>
      ))}
    </svg>
  );
}
