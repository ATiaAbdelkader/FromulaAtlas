'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Mic, MicOff, Camera, MapPin, Trash2, Download, Calendar,
  Leaf, AlertTriangle, CheckCircle2, X, Search, Clock3,
  ListFilter, ExternalLink, CircleDotDashed, Check, BarChart3, RotateCcw,
} from 'lucide-react';
import {
  SCOUT_ENTRIES_CHANGED_EVENT,
  appendScoutEntry,
  loadScoutEntries,
  removeScoutEntry,
  updateScoutEntry,
  type ScoutEntry,
  type ScoutSeverity,
  type ScoutStatus,
} from '@/lib/scouting-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { copyFor, useTranslation, type Language } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

const SEVERITY_STYLES: Record<ScoutSeverity, { color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  info:     { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: CheckCircle2 },
  warning:  { color: '#ca8a04', bg: '#fefce8', border: '#fef08a', icon: AlertTriangle },
  critical: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: AlertTriangle },
};

function copy(language: Language, en: string, fr: string, ar: string): string {
  return language === 'fr' ? fr : language === 'ar' ? ar : en;
}

function formatDate(timestamp: number, language: Language): string {
  const locale = language === 'ar' ? 'ar' : language === 'fr' ? 'fr-FR' : 'en-US';
  return new Date(timestamp).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
}

function toDateInputValue(timestamp?: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function isOverdue(entry: ScoutEntry): boolean {
  return Boolean(entry.followUpDate && entry.followUpDate < Date.now() && entry.status !== 'resolved');
}

const TITLE: TrilingualString = {
  en: 'Field Intelligence',
  ar: 'ذكاء الحقل',
  fr: 'Intelligence de terrain',
};

const DESC: TrilingualString = {
  en: 'Voice, photo, GPS, issue status, and follow-up tasks in one local-first timeline',
  ar: 'الصوت والصورة وGPS وحالة المشكلة ومهام المتابعة في سجل محلي واحد',
  fr: 'Voix, photo, GPS, statut des problèmes et actions de suivi dans une chronologie locale',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Voice notes require Chrome/Edge. Photo, GPS, and text work in all browsers. All entries are stored locally on this device.',
  ar: 'تتطلب الملاحظات الصوتية Chrome/Edge. تعمل الصورة وGPS والنص في كل المتصفحات. تُخزّن كل الإدخالات محلياً على هذا الجهاز.',
  fr: 'Les notes vocales nécessitent Chrome/Edge. Photo, GPS et texte fonctionnent dans tous les navigateurs. Toutes les entrées sont stockées localement sur cet appareil.',
};

/**
 * Field Scouting Log — a local-first, searchable field timeline with voice,
 * photo, GPS markers, issue status, follow-up tasks, and seasonal summaries.
 */
export function FieldScoutingLog() {
  const [entries, setEntries] = useState<ScoutEntry[]>([]);
  const [fieldName, setFieldName] = useState('');
  const [crop, setCrop] = useState('tomato');
  const [note, setNote] = useState('');
  const [severity, setSeverity] = useState<ScoutSeverity>('info');
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [followUpTask, setFollowUpTask] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | ScoutStatus>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | ScoutSeverity>('all');
  const [filterField, setFilterField] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const { language } = useTranslation();

  const t = useCallback((en: string, fr: string, ar: string) => copy(language, en, fr, ar), [language]);
  // Trilingual helper following the standard tr(en, ar, fr) pattern used across the codebase.
  const tr = useCallback((en: string, ar: string, fr: string) => copyFor(language, en, ar, fr), [language]);

  useEffect(() => {
    setEntries(loadScoutEntries());
    const handleEntriesChanged = () => setEntries(loadScoutEntries());
    window.addEventListener(SCOUT_ENTRIES_CHANGED_EVENT, handleEntriesChanged);
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setSpeechSupported(!!SpeechRecognition);
    }
    return () => window.removeEventListener(SCOUT_ENTRIES_CHANGED_EVENT, handleEntriesChanged);
  }, []);

  const toggleVoice = useCallback(() => {
    if (!speechSupported) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-US';
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join(' ');
      setNote(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  }, [language, listening, speechSupported]);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* Permission errors stay non-blocking for field capture. */ },
    );
  }, []);

  const handlePhoto = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const addEntry = useCallback(() => {
    if (!note.trim() && !photo) return;
    const entry: ScoutEntry = {
      id: `scout-${Date.now()}`,
      timestamp: Date.now(),
      fieldName: fieldName.trim() || t('Unspecified field', 'Parcelle sans nom', 'حقل غير محدد'),
      crop: crop.trim() || t('Unknown crop', 'Culture inconnue', 'محصول غير معروف'),
      location: location || undefined,
      note: note.trim(),
      severity,
      photo: photo || undefined,
      status: severity === 'critical' ? 'open' : 'monitoring',
      followUpTask: followUpTask.trim() || undefined,
      followUpDate: followUpDate ? new Date(`${followUpDate}T12:00:00`).getTime() : undefined,
    };
    setEntries(appendScoutEntry(entry));
    setNote('');
    setPhoto(null);
    setLocation(null);
    setSeverity('info');
    setFollowUpTask('');
    setFollowUpDate('');
  }, [crop, fieldName, followUpDate, followUpTask, location, note, photo, severity, t]);

  const deleteEntry = useCallback((id: string) => {
    setEntries(removeScoutEntry(id));
  }, []);

  const changeEntry = useCallback((id: string, patch: Partial<Pick<ScoutEntry, 'status' | 'followUpDate' | 'followUpTask' | 'severity'>>) => {
    setEntries(updateScoutEntry(id, patch));
  }, []);

  const exportPdf = useCallback(() => {
    const win = window.open('', '_blank');
    if (!win) return;
    const rows = entries.map((entry) => {
      const date = formatDate(entry.timestamp, language);
      const loc = entry.location ? `${entry.location.lat.toFixed(4)}, ${entry.location.lng.toFixed(4)}` : '—';
      const followUp = entry.followUpDate ? `${toDateInputValue(entry.followUpDate)}${entry.followUpTask ? ` — ${entry.followUpTask}` : ''}` : '—';
      const photoCell = entry.photo ? `<img src="${entry.photo}" style="max-width:120px;max-height:80px;border-radius:4px" />` : '—';
      return `<tr><td>${date}</td><td>${entry.fieldName}</td><td>${entry.crop}</td><td style="text-transform:capitalize">${entry.severity}</td><td>${entry.status ?? 'monitoring'}</td><td>${entry.note}</td><td>${followUp}</td><td>${loc}</td><td>${photoCell}</td></tr>`;
    }).join('');
    win.document.write(`<!DOCTYPE html><html><head><title>${t('Field Intelligence Timeline', 'Chronologie des observations', 'سجل ذكاء الحقل')}</title><style>
      body{font-family:system-ui,sans-serif;margin:24px;color:#0f172a} h1{color:#047857;font-size:20px}.meta{color:#475569;font-size:12px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse;font-size:9px}th{background:#ecfdf5;color:#047857;text-align:left;padding:6px;border:1px solid #a7f3d0}td{padding:4px 6px;border:1px solid #d1fae5;vertical-align:top}@page{size:landscape;margin:12mm}
    </style></head><body><h1>${t('Field Intelligence Timeline', 'Chronologie des observations', 'سجل ذكاء الحقل')}</h1><div class="meta">${t('Exported', 'Exporté', 'تم التصدير')}: ${formatDate(Date.now(), language)} · ${entries.length} ${t('entries', 'entrées', 'إدخالات')}</div><table><thead><tr><th>${t('Date/Time', 'Date/heure', 'التاريخ والوقت')}</th><th>${t('Field', 'Parcelle', 'الحقل')}</th><th>${t('Crop', 'Culture', 'المحصول')}</th><th>${t('Severity', 'Gravité', 'الخطورة')}</th><th>${t('Status', 'Statut', 'الحالة')}</th><th>${t('Observation', 'Observation', 'الملاحظة')}</th><th>${t('Follow-up', 'Suivi', 'المتابعة')}</th><th>GPS</th><th>${t('Photo', 'Photo', 'الصورة')}</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  }, [entries, language, t]);

  const handleReset = useCallback(() => {
    setFieldName('');
    setCrop('tomato');
    setNote('');
    setSeverity('info');
    setPhoto(null);
    setLocation(null);
    setFollowUpTask('');
    setFollowUpDate('');
    setFilterText('');
    setFilterStatus('all');
    setFilterSeverity('all');
    setFilterField('all');
    toast({ title: tr('Form reset', 'تمت إعادة التعيين', 'Formulaire réinitialisé') });
  }, [tr]);

  const fields = useMemo(() => Array.from(new Set(entries.map((entry) => entry.fieldName))).sort(), [entries]);
  const filteredEntries = useMemo(() => {
    const query = filterText.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesText = !query || [entry.fieldName, entry.crop, entry.note, entry.followUpTask ?? ''].some((value) => value.toLowerCase().includes(query));
      const matchesField = filterField === 'all' || entry.fieldName === filterField;
      const matchesStatus = filterStatus === 'all' || (entry.status ?? 'monitoring') === filterStatus;
      const matchesSeverity = filterSeverity === 'all' || entry.severity === filterSeverity;
      return matchesText && matchesField && matchesStatus && matchesSeverity;
    });
  }, [entries, filterField, filterSeverity, filterStatus, filterText]);

  const stats = useMemo(() => ({
    total: entries.length,
    open: entries.filter((entry) => (entry.status ?? 'monitoring') === 'open').length,
    monitoring: entries.filter((entry) => (entry.status ?? 'monitoring') === 'monitoring').length,
    resolved: entries.filter((entry) => entry.status === 'resolved').length,
    overdue: entries.filter(isOverdue).length,
    mapped: entries.filter((entry) => entry.location).length,
    critical: entries.filter((entry) => entry.severity === 'critical').length,
  }), [entries]);

  const monthSummary = useMemo(() => {
    const locale = language === 'ar' ? 'ar' : language === 'fr' ? 'fr-FR' : 'en-US';
    const months = new Map<string, { label: string; count: number; critical: number }>();
    entries.forEach((entry) => {
      const date = new Date(entry.timestamp);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const current = months.get(key) ?? { label: date.toLocaleDateString(locale, { month: 'short', year: 'numeric' }), count: 0, critical: 0 };
      current.count += 1;
      if (entry.severity === 'critical') current.critical += 1;
      months.set(key, current);
    });
    return Array.from(months.values()).slice(-6);
  }, [entries, language]);

  return (
    <CalculatorShell
      icon={Search}
      title={TITLE}
      description={DESC}
      badge="Local-first"
      accent="emerald"
      actions={[
        {
          icon: RotateCcw,
          label: { en: 'Reset Form', ar: 'إعادة تعيين النموذج', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
        {
          icon: Download,
          label: { en: 'Export PDF', ar: 'تصدير PDF', fr: 'Exporter PDF' },
          onClick: exportPdf,
          variant: 'primary',
        },
      ]}
      protocolNote={PROTOCOL_NOTE}
    >
      {/* Inputs column — capture form */}
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <Leaf className="h-4 w-4 text-emerald-600" />
              {tr('New Observation', 'ملاحظة جديدة', 'Nouvelle observation')}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('Field name', 'Nom de la parcelle', 'اسم الحقل')}</Label>
              <Input value={fieldName} onChange={(event) => setFieldName(event.target.value)} placeholder={t('e.g. North 40', 'ex. Parcelle Nord', 'مثال: الحقل الشمالي')} className="mt-1 h-10 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('Crop', 'Culture', 'المحصول')}</Label>
              <Input value={crop} onChange={(event) => setCrop(event.target.value)} className="mt-1 h-10 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('Severity', 'Gravité', 'الخطورة')}</Label>
              <div className="mt-1 grid grid-cols-3 gap-1">
                {(['info', 'warning', 'critical'] as const).map((value) => {
                  const style = SEVERITY_STYLES[value];
                  return (
                    <button
                      type="button"
                      key={value}
                      aria-pressed={severity === value}
                      onClick={() => setSeverity(value)}
                      className={`min-h-10 flex-1 rounded-md border px-2 py-1.5 text-[10px] capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${severity === value ? '' : 'border-border bg-muted/40'}`}
                      style={severity === value ? { background: style.bg, color: style.color, borderColor: style.border } : {}}
                    >
                      {t(value === 'info' ? 'Info' : value === 'warning' ? 'Warning' : 'Critical', value === 'info' ? 'Info' : value === 'warning' ? 'Avertissement' : 'Critique', value === 'info' ? 'معلومة' : value === 'warning' ? 'تحذير' : 'حرج')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder={t('What did you observe? (type or use voice)', 'Qu’avez-vous observé ? (saisir ou utiliser la voix)', 'ماذا لاحظت؟ (اكتب أو استخدم الصوت)')} className="h-10 flex-1 text-sm" />
              {speechSupported && <Button size="sm" variant={listening ? 'default' : 'outline'} onClick={toggleVoice} className={`h-10 w-10 shrink-0 p-0 ${listening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''}`} title={listening ? t('Stop recording', 'Arrêter l’enregistrement', 'إيقاف التسجيل') : t('Voice note', 'Note vocale', 'ملاحظة صوتية')}>{listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</Button>}
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="h-10 w-10 shrink-0 p-0" title={t('Attach photo', 'Joindre une photo', 'إرفاق صورة')}><Camera className="h-4 w-4" /></Button>
              <Button size="sm" variant="outline" onClick={getLocation} className="h-10 w-10 shrink-0 p-0" title={t('Tag GPS location', 'Ajouter la position GPS', 'إضافة موقع GPS')}><MapPin className="h-4 w-4" /></Button>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
            </div>
            {photo && <div className="relative inline-block"><img src={photo} alt={t('Scout photo', 'Photo de prospection', 'صورة المعاينة')} className="h-20 rounded-lg border border-border" /><button type="button" aria-label={t('Remove photo', 'Supprimer la photo', 'إزالة الصورة')} onClick={() => setPhoto(null)} className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background shadow-sm"><X className="h-3 w-3" /></button></div>}
            {location && <Badge variant="outline" className="text-[10px] gap-1"><MapPin className="h-3 w-3 text-emerald-600" /> {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</Badge>}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('Follow-up task (optional)', 'Action de suivi (facultative)', 'مهمة المتابعة (اختياري)')}</Label>
                <Input value={followUpTask} onChange={(event) => setFollowUpTask(event.target.value)} placeholder={t('e.g. Recheck in 3 days', 'ex. Recontrôler dans 3 jours', 'مثال: أعد الفحص بعد 3 أيام')} className="mt-1 h-10 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('Follow-up date', 'Date de suivi', 'تاريخ المتابعة')}</Label>
                <Input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} className="mt-1 h-10 text-sm" />
              </div>
            </div>
            <Button onClick={addEntry} disabled={!note.trim() && !photo} size="sm" className="h-11 w-full gap-2">
              <Calendar className="h-3.5 w-3.5" /> {t('Log observation', 'Enregistrer l’observation', 'تسجيل الملاحظة')}
            </Button>
          </div>
        </div>
      </CalculatorShell.Inputs>

      {/* Results column — stats + GPS markers + seasonal trend */}
      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
          {entries.length > 0 ? (
            <>
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-base font-bold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                  {tr('Season Summary', 'ملخص الموسم', 'Résumé saisonnier')}
                </span>
                <Badge variant="outline" className="text-[10px]">{stats.total} {tr('records', 'سجلات', 'entrées')}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  [stats.total, tr('Total', 'الإجمالي', 'Total'), 'text-foreground'],
                  [stats.open, tr('Open', 'مفتوحة', 'Ouvertes'), 'text-red-600'],
                  [stats.monitoring, tr('Monitoring', 'قيد المتابعة', 'Suivi'), 'text-amber-600'],
                  [stats.resolved, tr('Resolved', 'محلولة', 'Résolues'), 'text-emerald-600'],
                  [stats.overdue, tr('Overdue', 'متأخرة', 'En retard'), 'text-orange-600'],
                  [stats.mapped, tr('Mapped', 'محددة الموقع', 'Géolocalisées'), 'text-blue-600'],
                ].map(([value, label, color]) => (
                  <div key={String(label)} className="rounded-lg border p-2 text-center">
                    <div className={`text-lg font-semibold ${color}`}>{value}</div>
                    <div className="text-[10px] text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <BarChart3 className="h-3.5 w-3.5 text-emerald-600" />
                  {t('Seasonal trend', 'Tendance saisonnière', 'الاتجاه الموسمي')}
                </div>
                {monthSummary.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t('Trend data will appear after observations are logged.', 'La tendance apparaîtra après l’enregistrement d’observations.', 'سيظهر الاتجاه بعد تسجيل الملاحظات.')}</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {monthSummary.map((month) => (
                      <div key={month.label} className="text-center">
                        <div className="h-12 rounded bg-emerald-100 dark:bg-emerald-950/40 flex items-end justify-center overflow-hidden">
                          <div className="w-5 bg-emerald-500 rounded-t" style={{ height: `${Math.max(15, Math.min(100, (month.count / Math.max(...monthSummary.map((item) => item.count))) * 100))}%` }} />
                        </div>
                        <div className="text-[10px] mt-1 text-muted-foreground">{month.label}</div>
                        <div className="text-[10px] font-medium">{month.count}{month.critical > 0 ? ` · ${month.critical} ${t('critical', 'crit.', 'حرج')}` : ''}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {stats.mapped > 0 && (
                <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 dark:text-blue-200">
                    <MapPin className="h-3.5 w-3.5" /> {t('GPS field markers', 'Marqueurs GPS des parcelles', 'علامات GPS للحقول')}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {entries.filter((entry) => entry.location).map((entry) => (
                      <a key={entry.id} href={`https://www.openstreetmap.org/?mlat=${entry.location!.lat}&mlon=${entry.location!.lng}#map=16/${entry.location!.lat}/${entry.location!.lng}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-background px-2 py-1 text-[10px] hover:border-blue-400">
                        <MapPin className="h-3 w-3 text-blue-600" /> {entry.fieldName} · {entry.location!.lat.toFixed(3)}, {entry.location!.lng.toFixed(3)} <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center text-sm text-muted-foreground">
              <Leaf className="h-8 w-8 mb-2 opacity-40" />
              {tr('No observations yet. Start by logging your first field observation on the left.', 'لا توجد ملاحظات بعد. ابدأ بتسجيل أول ملاحظة حقل على اليسار.', 'Aucune observation. Commencez par enregistrer votre première observation à gauche.')}
            </div>
          )}
        </div>
      </CalculatorShell.Results>

      {/* Full-width: filters + entries list */}
      {entries.length > 0 && (
        <div className="lg:col-span-12">
          <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
            <div className="space-y-3 rounded-xl border p-3">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <ListFilter className="h-3.5 w-3.5 text-emerald-600" />
                {t('Timeline filters', 'Filtres de chronologie', 'مرشحات السجل')}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={filterText} onChange={(event) => setFilterText(event.target.value)} placeholder={t('Search observations...', 'Rechercher des observations…', 'البحث في الملاحظات...')} className="h-10 pl-8 text-sm" />
                </div>
                <select value={filterField} onChange={(event) => setFilterField(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="all">{t('All fields', 'Toutes les parcelles', 'كل الحقول')}</option>
                  {fields.map((field) => <option key={field} value={field}>{field}</option>)}
                </select>
                <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value as 'all' | ScoutStatus)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="all">{t('All statuses', 'Tous les statuts', 'كل الحالات')}</option>
                  <option value="open">{t('Open', 'Ouvert', 'مفتوح')}</option>
                  <option value="monitoring">{t('Monitoring', 'Suivi', 'متابعة')}</option>
                  <option value="resolved">{t('Resolved', 'Résolu', 'محلول')}</option>
                </select>
                <select value={filterSeverity} onChange={(event) => setFilterSeverity(event.target.value as 'all' | ScoutSeverity)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="all">{t('All severity', 'Toutes les gravités', 'كل مستويات الخطورة')}</option>
                  <option value="info">{t('Info', 'Info', 'معلومة')}</option>
                  <option value="warning">{t('Warning', 'Avertissement', 'تحذير')}</option>
                  <option value="critical">{t('Critical', 'Critique', 'حرج')}</option>
                </select>
              </div>
            </div>

            <div className="max-h-[520px] space-y-3 overflow-y-auto rounded-xl border bg-muted/10 p-2 sm:p-3">
              {filteredEntries.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-background px-4 py-10 text-center text-sm text-muted-foreground">
                  <Leaf className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  {t('No entries match your filters.', 'Aucune entrée ne correspond aux filtres.', 'لا توجد إدخالات تطابق المرشحات.')}
                </div>
              ) : filteredEntries.map((entry) => {
                const style = SEVERITY_STYLES[entry.severity];
                const Icon = style.icon;
                const status = entry.status ?? 'monitoring';
                return (
                  <div key={entry.id} className="flex gap-3 rounded-xl border p-3 shadow-sm transition-shadow hover:shadow-md" style={{ background: style.bg, borderColor: style.border }}>
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: `${style.color}20` }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: style.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold">{entry.fieldName}</span>
                        <Badge variant="outline" className="text-[9px]">{entry.crop}</Badge>
                        <span className="text-[10px] text-muted-foreground">{formatDate(entry.timestamp, language)}</span>
                        {entry.location && <a href={`https://www.openstreetmap.org/?mlat=${entry.location.lat}&mlon=${entry.location.lng}#map=16/${entry.location.lat}/${entry.location.lng}`} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 inline-flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" /> {t('Map', 'Carte', 'خريطة')}</a>}
                      </div>
                      {entry.note && <p className="text-xs mt-1 leading-snug">{entry.note}</p>}
                      {entry.photo && <img src={entry.photo} alt="" className="h-16 mt-1.5 rounded border border-border" />}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <select value={status} onChange={(event) => changeEntry(entry.id, { status: event.target.value as ScoutStatus })} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                          <option value="open">{t('Open', 'Ouvert', 'مفتوح')}</option>
                          <option value="monitoring">{t('Monitoring', 'Suivi', 'متابعة')}</option>
                          <option value="resolved">{t('Resolved', 'Résolu', 'محلول')}</option>
                        </select>
                        {entry.followUpDate && <Badge variant="outline" className={`text-[9px] gap-1 ${isOverdue(entry) ? 'text-orange-700 border-orange-300' : ''}`}><Clock3 className="h-2.5 w-2.5" />{isOverdue(entry) ? t('Overdue', 'En retard', 'متأخر') : toDateInputValue(entry.followUpDate)}{entry.followUpTask ? ` · ${entry.followUpTask}` : ''}</Badge>}
                        {status === 'open' && <button type="button" onClick={() => changeEntry(entry.id, { status: 'resolved' })} className="inline-flex min-h-10 items-center gap-1 rounded-md px-2 text-sm text-emerald-700 hover:bg-emerald-50 hover:underline dark:hover:bg-emerald-950/30"><Check className="h-3 w-3" /> {t('Mark resolved', 'Marquer résolu', 'تحديد كمحلول')}</button>}
                        {status === 'monitoring' && <CircleDotDashed className="h-3.5 w-3.5 text-amber-600" />}
                      </div>
                    </div>
                    <button type="button" aria-label={t('Delete observation', 'Supprimer l’observation', 'حذف الملاحظة')} onClick={() => deleteEntry(entry.id)} className="flex h-10 w-10 flex-shrink-0 items-center justify-center self-start rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" title={t('Delete observation', 'Supprimer l’observation', 'حذف الملاحظة')}><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </CalculatorShell>
  );
}
