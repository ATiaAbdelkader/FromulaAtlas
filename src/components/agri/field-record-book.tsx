'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen, CalendarDays, CheckCircle2, ClipboardCheck, Download, Filter,
  FlaskConical, Leaf, MapPin, Plus, RefreshCw, Search, Satellite, Sparkles, Sprout,
  Trash2, TrendingUp, WalletCards, X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation, type Language } from '@/lib/language-store';
import {
  appendManualFieldRecord,
  buildFieldRecordTimeline,
  FIELD_RECORD_BOOK_CHANGED_EVENT,
  getFieldRecordBookStats,
  removeManualFieldRecord,
  type FieldRecord,
  type FieldRecordKind,
  type FieldRecordSource,
} from '@/lib/field-record-book';
import { SCOUT_ENTRIES_CHANGED_EVENT } from '@/lib/scouting-store';
import { SATELLITE_HEALTH_CHANGED_EVENT } from '@/lib/satellite-health';
import { DIGITAL_TWIN_CHANGED_EVENT } from '@/lib/farm-digital-twin';

const KIND_OPTIONS: FieldRecordKind[] = ['observation', 'decision', 'input', 'irrigation', 'harvest', 'note'];
const SOURCE_FILTER_OPTIONS: FieldRecordSource[] = ['manual', 'demo', 'field-profile', 'scouting', 'soil-test', 'satellite'];

type Tone = { accent: string; background: string; border: string; icon: typeof Leaf };

const KIND_TONES: Record<FieldRecordKind, Tone> = {
  observation: { accent: '#2563eb', background: '#eff6ff', border: '#bfdbfe', icon: ClipboardCheck },
  decision: { accent: '#7c3aed', background: '#f5f3ff', border: '#ddd6fe', icon: CheckCircle2 },
  input: { accent: '#b45309', background: '#fffbeb', border: '#fde68a', icon: WalletCards },
  irrigation: { accent: '#0891b2', background: '#ecfeff', border: '#a5f3fc', icon: TrendingUp },
  harvest: { accent: '#15803d', background: '#f0fdf4', border: '#bbf7d0', icon: Sprout },
  note: { accent: '#475569', background: '#f8fafc', border: '#cbd5e1', icon: BookOpen },
};

function copy(language: Language, en: string, fr: string, ar: string): string {
  return language === 'fr' ? fr : language === 'ar' ? ar : en;
}

function formatDate(timestamp: number, language: Language): string {
  const locale = language === 'ar' ? 'ar' : language === 'fr' ? 'fr-FR' : 'en-US';
  return new Date(timestamp).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatDzd(amount: number, language: Language): string {
  const locale = language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-DZ';
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount)} DZD`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ?? character);
}

function sourceIcon(source: FieldRecordSource) {
  if (source === 'demo') return Sparkles;
  if (source === 'satellite') return Satellite;
  if (source === 'soil-test') return FlaskConical;
  if (source === 'scouting') return Sprout;
  if (source === 'field-profile') return MapPin;
  return BookOpen;
}

export function FieldRecordBook() {
  const { language, isRTL } = useTranslation();
  const [records, setRecords] = useState<FieldRecord[]>([]);
  const [query, setQuery] = useState('');
  const [fieldFilter, setFieldFilter] = useState('all');
  const [kindFilter, setKindFilter] = useState<'all' | FieldRecordKind>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | FieldRecordSource>('all');
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    fieldName: '', fieldId: '', crop: '', date: new Date().toISOString().slice(0, 10),
    kind: 'note' as FieldRecordKind, title: '', summary: '', amountDzd: '',
  });

  const t = useCallback((en: string, fr: string, ar: string) => copy(language, en, fr, ar), [language]);
  const refresh = useCallback(() => setRecords(buildFieldRecordTimeline()), []);

  useEffect(() => {
    refresh();
    const events = [FIELD_RECORD_BOOK_CHANGED_EVENT, SCOUT_ENTRIES_CHANGED_EVENT, SATELLITE_HEALTH_CHANGED_EVENT, DIGITAL_TWIN_CHANGED_EVENT];
    events.forEach((eventName) => window.addEventListener(eventName, refresh));
    window.addEventListener('storage', refresh);
    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, refresh));
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  const fields = useMemo(() => Array.from(new Set(records.map((record) => record.fieldName).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [records]);
  const stats = useMemo(() => getFieldRecordBookStats(records), [records]);
  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return records.filter((record) => {
      const searchable = [record.fieldName, record.crop ?? '', record.title, record.summary, record.source, record.kind].join(' ').toLocaleLowerCase();
      return (!normalizedQuery || searchable.includes(normalizedQuery))
        && (fieldFilter === 'all' || record.fieldName === fieldFilter)
        && (kindFilter === 'all' || record.kind === kindFilter)
        && (sourceFilter === 'all' || record.source === sourceFilter);
    });
  }, [fieldFilter, kindFilter, query, records, sourceFilter]);

  const updateForm = useCallback((patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch })), []);

  const submitRecord = useCallback(() => {
    if (!form.fieldName.trim() || !form.title.trim() || !form.summary.trim()) {
      setFormError(t('Field, title, and details are required.', 'La parcelle, le titre et les détails sont obligatoires.', 'الحقل والعنوان والتفاصيل مطلوبة.'));
      return;
    }
    const parsedAmount = form.amountDzd.trim() ? Number.parseFloat(form.amountDzd) : undefined;
    if (parsedAmount !== undefined && (!Number.isFinite(parsedAmount) || parsedAmount < 0)) {
      setFormError(t('Enter a valid non-negative DZD amount.', 'Saisissez un montant DZD valide et positif ou nul.', 'أدخل مبلغاً صالحاً غير سالب بالدينار الجزائري.'));
      return;
    }
    appendManualFieldRecord({
      fieldId: form.fieldId || undefined,
      fieldName: form.fieldName,
      crop: form.crop,
      date: form.date,
      kind: form.kind,
      title: form.title,
      summary: form.summary,
      amountDzd: parsedAmount,
    });
    setForm((current) => ({ ...current, title: '', summary: '', amountDzd: '' }));
    setFormError('');
    setShowForm(false);
    refresh();
  }, [form, refresh, t]);

  const deleteManualRecord = useCallback((id: string) => {
    removeManualFieldRecord(id);
    refresh();
  }, [refresh]);

  const exportTimeline = useCallback(() => {
    const win = window.open('', '_blank');
    if (!win) return;
    const rows = filteredRecords.map((record) => `<tr><td>${escapeHtml(formatDate(record.timestamp, language))}</td><td>${escapeHtml(record.fieldName)}</td><td>${escapeHtml(record.crop ?? '—')}</td><td>${escapeHtml(record.title)}</td><td>${escapeHtml(record.summary)}</td><td>${escapeHtml(record.source)}</td><td>${record.amountDzd == null ? '—' : escapeHtml(formatDzd(record.amountDzd, language))}</td></tr>`).join('');
    win.document.write(`<!doctype html><html dir="${isRTL ? 'rtl' : 'ltr'}"><head><title>${escapeHtml(t('Field Record Book', 'Carnet de parcelle', 'دفتر سجل الحقل'))}</title><style>body{font-family:system-ui,sans-serif;margin:24px;color:#0f172a}h1{color:#047857}.meta{color:#475569;font-size:12px;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#ecfdf5;color:#047857;text-align:start;padding:6px;border:1px solid #a7f3d0}td{padding:5px 6px;border:1px solid #d1fae5;vertical-align:top}@page{size:landscape;margin:12mm}</style></head><body><h1>${escapeHtml(t('Field Record Book', 'Carnet de parcelle', 'دفتر سجل الحقل'))}</h1><div class="meta">${escapeHtml(t('Exported', 'Exporté', 'تم التصدير'))}: ${escapeHtml(formatDate(Date.now(), language))} · ${filteredRecords.length} ${escapeHtml(t('records', 'enregistrements', 'سجلات'))}</div><table><thead><tr><th>${escapeHtml(t('Date', 'Date', 'التاريخ'))}</th><th>${escapeHtml(t('Field', 'Parcelle', 'الحقل'))}</th><th>${escapeHtml(t('Crop', 'Culture', 'المحصول'))}</th><th>${escapeHtml(t('Title', 'Titre', 'العنوان'))}</th><th>${escapeHtml(t('Details', 'Détails', 'التفاصيل'))}</th><th>${escapeHtml(t('Source', 'Source', 'المصدر'))}</th><th>DZD</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  }, [filteredRecords, isRTL, language, t]);

  const kindLabel = useCallback((kind: FieldRecordKind) => {
    const labels: Record<FieldRecordKind, [string, string, string]> = {
      observation: ['Observation', 'Observation', 'ملاحظة'], decision: ['Decision', 'Décision', 'قرار'], input: ['Input / cost', 'Intrant / coût', 'مدخل / تكلفة'], irrigation: ['Irrigation', 'Irrigation', 'ري'], harvest: ['Harvest', 'Récolte', 'حصاد'], note: ['Note', 'Note', 'مذكرة'],
    };
    return t(...labels[kind]);
  }, [t]);

  const sourceLabel = useCallback((source: FieldRecordSource) => {
    const labels: Record<FieldRecordSource, [string, string, string]> = {
      manual: ['Manual', 'Manuel', 'يدوي'], demo: ['Demo data', 'Données de démonstration', 'بيانات تجريبية'], 'field-profile': ['Field profile', 'Profil de parcelle', 'ملف الحقل'], scouting: ['Field scouting', 'Prospection', 'كشف حقلي'], 'soil-test': ['Soil history', 'Historique du sol', 'تاريخ التربة'], satellite: ['Satellite', 'Satellite', 'قمر صناعي'],
    };
    return t(...labels[source]);
  }, [t]);

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'} className="overflow-hidden border-emerald-200/60 shadow-sm dark:border-emerald-900/60">
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b bg-gradient-to-r from-emerald-50 via-background to-lime-50/50 pb-4 dark:from-emerald-950/30 dark:via-background dark:to-lime-950/20">
        <div>
          <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-emerald-600" /> {t('Field Record Book', 'Carnet de parcelle', 'دفتر سجل الحقل')}</CardTitle>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">{t('One traceable timeline for field decisions, observations, soil tests, satellite checks, inputs, irrigation, and harvest notes.', 'Une chronologie traçable pour les décisions, observations, analyses de sol, contrôles satellite, intrants, irrigation et récoltes.', 'سجل زمني موحد وقابل للتتبع لقرارات الحقل والملاحظات وتحاليل التربة وفحوص الأقمار الصناعية والمدخلات والري والحصاد.')}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={refresh} className="h-9 gap-1.5" title={t('Refresh connected sources', 'Actualiser les sources connectées', 'تحديث المصادر المرتبطة')}><RefreshCw className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t('Sync', 'Synchroniser', 'مزامنة')}</span></Button>
          {filteredRecords.length > 0 && <Button size="sm" variant="outline" onClick={exportTimeline} className="h-9 gap-1.5"><Download className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t('Export', 'Exporter', 'تصدير')}</span></Button>}
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            [t('Records', 'Enregistrements', 'السجلات'), stats.total, 'text-emerald-700'],
            [t('Fields', 'Parcelles', 'الحقول'), stats.fields, 'text-sky-700'],
            [t('Observations', 'Observations', 'الملاحظات'), stats.observations, 'text-blue-700'],
            [t('Actions', 'Actions', 'الإجراءات'), stats.actions, 'text-violet-700'],
            [t('Critical', 'Critiques', 'حرجة'), stats.critical, 'text-red-700'],
            [t('Tracked DZD', 'DZD suivis', 'الدينار المتتبع'), formatDzd(stats.totalAmountDzd, language), 'text-amber-700'],
          ].map(([label, value, color]) => <div key={String(label)} className="rounded-xl border bg-muted/20 p-3"><div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div><div className={`mt-1 text-lg font-bold ${color}`}>{value}</div></div>)}
        </div>

        <div className="flex flex-col gap-2 rounded-xl border bg-muted/20 p-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1"><Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Search field, title, crop, or detail…', 'Rechercher parcelle, titre, culture ou détail…', 'ابحث عن الحقل أو العنوان أو المحصول أو التفاصيل…')} className="h-10 ps-9 text-sm" /></div>
          <div className="flex flex-wrap items-center gap-2"><Filter className="hidden h-4 w-4 text-muted-foreground sm:block" /><select aria-label={t('Field filter', 'Filtre parcelle', 'تصفية الحقل')} value={fieldFilter} onChange={(event) => setFieldFilter(event.target.value)} className="h-10 min-w-[125px] rounded-md border bg-background px-3 text-xs"><option value="all">{t('All fields', 'Toutes les parcelles', 'كل الحقول')}</option>{fields.map((field) => <option key={field} value={field}>{field}</option>)}</select><select aria-label={t('Type filter', 'Filtre type', 'تصفية النوع')} value={kindFilter} onChange={(event) => setKindFilter(event.target.value as typeof kindFilter)} className="h-10 min-w-[125px] rounded-md border bg-background px-3 text-xs"><option value="all">{t('All types', 'Tous les types', 'كل الأنواع')}</option>{KIND_OPTIONS.map((kind) => <option key={kind} value={kind}>{kindLabel(kind)}</option>)}</select><select aria-label={t('Source filter', 'Filtre source', 'تصفية المصدر')} value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as typeof sourceFilter)} className="h-10 min-w-[125px] rounded-md border bg-background px-3 text-xs"><option value="all">{t('All sources', 'Toutes les sources', 'كل المصادر')}</option>{SOURCE_FILTER_OPTIONS.map((source) => <option key={source} value={source}>{sourceLabel(source)}</option>)}</select></div>
        </div>

        <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-100"><Plus className="h-4 w-4" /> {t('Add a field record', 'Ajouter un enregistrement', 'إضافة سجل للحقل')}</div><p className="mt-1 text-xs text-muted-foreground">{t('Capture a decision, input cost, irrigation event, harvest, or operational note. Connected records are synchronized automatically.', 'Saisissez une décision, un coût, une irrigation, une récolte ou une note. Les sources connectées sont synchronisées automatiquement.', 'سجل قراراً أو تكلفة مدخل أو عملية ري أو حصاد أو ملاحظة. تتم مزامنة السجلات المرتبطة تلقائياً.')}</p></div><Button size="sm" onClick={() => { setShowForm((current) => !current); setFormError(''); }} className="h-9 shrink-0 gap-1.5 bg-emerald-700 hover:bg-emerald-800">{showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}{showForm ? t('Close', 'Fermer', 'إغلاق') : t('New record', 'Nouveau', 'سجل جديد')}</Button></div>
          {showForm && <div className="mt-4 grid gap-3 border-t border-emerald-200/70 pt-4 dark:border-emerald-900/60 sm:grid-cols-2 lg:grid-cols-4">
            <div><Label className="text-xs">{t('Field name', 'Nom de parcelle', 'اسم الحقل')}</Label><Input value={form.fieldName} onChange={(event) => updateForm({ fieldName: event.target.value })} list="record-book-fields" placeholder={t('e.g. North 40', 'ex. Parcelle Nord', 'مثال: الحقل الشمالي')} className="mt-1 h-10 text-sm" /><datalist id="record-book-fields">{fields.map((field) => <option key={field} value={field} />)}</datalist></div>
            <div><Label className="text-xs">{t('Crop', 'Culture', 'المحصول')}</Label><Input value={form.crop} onChange={(event) => updateForm({ crop: event.target.value })} placeholder={t('e.g. durum wheat', 'ex. blé dur', 'مثال: قمح صلب')} className="mt-1 h-10 text-sm" /></div>
            <div><Label className="text-xs">{t('Date', 'Date', 'التاريخ')}</Label><Input type="date" value={form.date} onChange={(event) => updateForm({ date: event.target.value })} className="mt-1 h-10 text-sm" /></div>
            <div><Label className="text-xs">{t('Record type', 'Type', 'نوع السجل')}</Label><select value={form.kind} onChange={(event) => updateForm({ kind: event.target.value as FieldRecordKind })} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm">{KIND_OPTIONS.map((kind) => <option key={kind} value={kind}>{kindLabel(kind)}</option>)}</select></div>
            <div className="sm:col-span-2 lg:col-span-2"><Label className="text-xs">{t('Title', 'Titre', 'العنوان')}</Label><Input value={form.title} onChange={(event) => updateForm({ title: event.target.value })} placeholder={t('e.g. Applied compost to Field A', 'ex. Compost appliqué à la parcelle A', 'مثال: إضافة السماد العضوي إلى الحقل A')} className="mt-1 h-10 text-sm" /></div>
            <div><Label className="text-xs">{t('Amount (DZD, optional)', 'Montant (DZD, optionnel)', 'المبلغ (دج، اختياري)')}</Label><Input type="number" min="0" value={form.amountDzd} onChange={(event) => updateForm({ amountDzd: event.target.value })} placeholder="0" className="mt-1 h-10 text-sm" /></div>
            <div className="sm:col-span-2 lg:col-span-4"><Label className="text-xs">{t('Details', 'Détails', 'التفاصيل')}</Label><Textarea value={form.summary} onChange={(event) => updateForm({ summary: event.target.value })} placeholder={t('What happened, what was decided, and what should be checked next?', 'Que s’est-il passé, quelle décision a été prise et que faut-il vérifier ensuite ?', 'ماذا حدث؟ ما القرار المتخذ؟ وما الذي يجب التحقق منه لاحقاً؟')} className="mt-1 min-h-20 text-sm" /></div>
            {formError && <p className="text-xs font-medium text-red-600 sm:col-span-2 lg:col-span-4">{formError}</p>}
            <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-4"><Button variant="outline" size="sm" onClick={() => setShowForm(false)}>{t('Cancel', 'Annuler', 'إلغاء')}</Button><Button size="sm" onClick={submitRecord} className="bg-emerald-700 hover:bg-emerald-800">{t('Save record', 'Enregistrer', 'حفظ السجل')}</Button></div>
          </div>}
        </div>

        <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-semibold"><CalendarDays className="h-4 w-4 text-emerald-600" /> {t('Traceable timeline', 'Chronologie traçable', 'الخط الزمني القابل للتتبع')}</div><Badge variant="outline" className="text-[10px]">{filteredRecords.length} / {records.length}</Badge></div>
        {filteredRecords.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center"><Leaf className="mx-auto h-8 w-8 text-emerald-300" /><p className="mt-2 text-sm font-medium">{records.length === 0 ? t('Your field history will appear here.', 'Votre historique de parcelle apparaîtra ici.', 'سيظهر تاريخ الحقل هنا.') : t('No records match these filters.', 'Aucun enregistrement ne correspond aux filtres.', 'لا توجد سجلات تطابق عوامل التصفية.')}</p><p className="mt-1 text-xs text-muted-foreground">{t('Add a manual record or use Field Scouting, Soil History, and Satellite Monitor to build the timeline.', 'Ajoutez un enregistrement ou utilisez le journal de prospection, l’historique du sol et le satellite pour construire la chronologie.', 'أضف سجلاً يدوياً أو استخدم الكشف الحقلي وتاريخ التربة ومراقبة الأقمار الصناعية لبناء الخط الزمني.')}</p></div> : <div className="space-y-3">{filteredRecords.map((record) => { const tone = KIND_TONES[record.kind]; const KindIcon = tone.icon; const SourceIcon = sourceIcon(record.source); return <div key={`${record.source}-${record.id}`} className="relative rounded-xl border bg-background p-3 transition-colors hover:bg-muted/20 sm:p-4" style={{ borderInlineStartColor: tone.accent, borderInlineStartWidth: 3 }}><div className="flex items-start gap-3"><div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: tone.background, color: tone.accent }}><KindIcon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5"><h4 className="text-sm font-semibold">{record.title}</h4><Badge variant="outline" className="gap-1 text-[10px] font-normal"><SourceIcon className="h-3 w-3" />{sourceLabel(record.source)}</Badge>{record.severity && <Badge className={`text-[10px] ${record.severity === 'critical' ? 'bg-red-100 text-red-700 hover:bg-red-100' : record.severity === 'warning' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : 'bg-blue-100 text-blue-700 hover:bg-blue-100'}`}>{record.severity}</Badge>}</div><div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground"><span className="font-medium text-foreground">{record.fieldName}</span>{record.crop && <span>{record.crop}</span>}<span>{formatDate(record.timestamp, language)}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{record.summary}</p>{record.source === 'demo' && <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">{t('Synthetic demo record — not for agronomic decisions', 'Enregistrement synthétique — pas pour décisions agronomiques', 'سجل تجريبي اصطناعي — ليس لاتخاذ قرارات زراعية')}</p>}<div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground"> <Badge variant="secondary" className="text-[10px]">{kindLabel(record.kind)}</Badge>{record.amountDzd != null && <Badge variant="secondary" className="gap-1 text-[10px]"><WalletCards className="h-3 w-3" />{formatDzd(record.amountDzd, language)}</Badge>}{record.metadata?.ndvi != null && <Badge variant="secondary" className="gap-1 text-[10px]"><Satellite className="h-3 w-3" />NDVI {Number(record.metadata.ndvi).toFixed(2)}</Badge>}{record.metadata?.latitude != null && <Badge variant="secondary" className="gap-1 text-[10px]"><MapPin className="h-3 w-3" />GPS</Badge>}</div></div>{record.source === 'manual' && <Button size="icon" variant="ghost" onClick={() => deleteManualRecord(record.id)} className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-600" title={t('Delete record', 'Supprimer', 'حذف السجل')}><Trash2 className="h-3.5 w-3.5" /></Button>}</div></div>; })}</div>}
        <p className="text-[10px] leading-relaxed text-muted-foreground">{t(`${stats.linkedSources} records are linked from existing FormulaAtlas tools; manual entries are stored locally on this device.`, `${stats.linkedSources} enregistrements proviennent des outils FormulaAtlas ; les saisies manuelles sont conservées localement sur cet appareil.`, `${stats.linkedSources} سجلاً مرتبطاً بأدوات FormulaAtlas الحالية؛ أما الإدخالات اليدوية فمحفوظة محلياً على هذا الجهاز.`)}</p>
      </CardContent>
    </Card>
  );
}
