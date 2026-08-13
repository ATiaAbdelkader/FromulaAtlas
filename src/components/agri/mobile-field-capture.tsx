'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  Camera,
  CheckCircle2,
  CloudOff,
  Leaf,
  MapPin,
  Mic,
  MicOff,
  Navigation,
  Radio,
  Save,
  ShieldCheck,
  Sprout,
  Trash2,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/language-store';
import {
  appendScoutEntry,
  loadScoutEntries,
  removeScoutEntry,
  SCOUT_ENTRIES_CHANGED_EVENT,
  type ScoutEntry,
  type ScoutSeverity,
} from '@/lib/scouting-store';

const SEVERITIES: Array<{ value: ScoutSeverity; label: string; active: string }> = [
  { value: 'info', label: 'Info', active: 'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
  { value: 'warning', label: 'Watch', active: 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  { value: 'critical', label: 'Urgent', active: 'border-red-400 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' },
];

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
}

export function MobileFieldCaptureButton() {
  const { isRTL } = useTranslation();
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ScoutEntry[]>([]);
  const [fieldName, setFieldName] = useState('');
  const [crop, setCrop] = useState('');
  const [note, setNote] = useState('');
  const [severity, setSeverity] = useState<ScoutSeverity>('info');
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<ScoutEntry['location'] | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const refreshEntries = useCallback(() => setEntries(loadScoutEntries()), []);

  useEffect(() => {
    refreshEntries();
    setIsOnline(navigator.onLine);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(Boolean(SpeechRecognition));
    const handleConnectivity = () => setIsOnline(navigator.onLine);
    const handleEntriesChanged = () => refreshEntries();
    window.addEventListener('online', handleConnectivity);
    window.addEventListener('offline', handleConnectivity);
    window.addEventListener(SCOUT_ENTRIES_CHANGED_EVENT, handleEntriesChanged);
    return () => {
      window.removeEventListener('online', handleConnectivity);
      window.removeEventListener('offline', handleConnectivity);
      window.removeEventListener(SCOUT_ENTRIES_CHANGED_EVENT, handleEntriesChanged);
    };
  }, [refreshEntries]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  const handlePhoto = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationLoading(false);
      },
      () => setLocationLoading(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
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
    recognition.lang = isRTL ? 'ar-SA' : 'en-US';
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((result: any) => result[0].transcript).join(' ');
      setNote(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  }, [isRTL, listening, speechSupported]);

  const resetDraft = useCallback(() => {
    setNote('');
    setPhoto(null);
    setLocation(null);
    setSeverity('info');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const saveEntry = useCallback(() => {
    if (!note.trim() && !photo) return;
    appendScoutEntry({
      id: `scout-${Date.now()}`,
      timestamp: Date.now(),
      fieldName: fieldName.trim() || (isRTL ? 'حقل غير محدد' : 'Unspecified field'),
      crop: crop.trim() || (isRTL ? 'غير محدد' : 'Unspecified crop'),
      location: location || undefined,
      note: note.trim(),
      severity,
      photo: photo || undefined,
    });
    refreshEntries();
    resetDraft();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }, [crop, fieldName, isRTL, location, note, photo, refreshEntries, resetDraft, severity]);

  const deleteEntry = useCallback((id: string) => {
    removeScoutEntry(id);
    refreshEntries();
  }, [refreshEntries]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11"
        onClick={() => setOpen(true)}
        title={isRTL ? 'التقاط ملاحظة حقلية' : 'Capture field observation'}
        aria-label={isRTL ? 'فتح التقاط الحقل' : 'Open field capture'}
      >
        <Camera className="h-4 w-4" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col" role="dialog" aria-modal="true" aria-label={isRTL ? 'وضع الحقل' : 'Mobile Field Mode'}>
          <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40 safe-top">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <Sprout className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold leading-tight">{isRTL ? 'وضع الحقل' : 'Mobile Field Mode'}</h2>
                <p className="text-xs text-muted-foreground truncate">{isRTL ? 'التقط الملاحظات بسرعة، حتى دون اتصال' : 'Capture observations quickly, even offline'}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-11 w-11 flex-shrink-0" onClick={() => setOpen(false)} aria-label={isRTL ? 'إغلاق' : 'Close'}>
              <X className="h-5 w-5" />
            </Button>
          </header>

          <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <div className="mx-auto w-full max-w-xl space-y-4 p-4 pb-8 safe-bottom">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
                <div className="flex items-center gap-2 text-xs">
                  {isOnline ? <Radio className="h-4 w-4 text-emerald-600" /> : <CloudOff className="h-4 w-4 text-amber-600" />}
                  <span className="font-medium">{isOnline ? (isRTL ? 'متصل — تُحفظ محلياً' : 'Online — saved locally') : (isRTL ? 'دون اتصال — تُحفظ محلياً' : 'Offline — saved locally')}</span>
                </div>
                <Badge variant="outline" className="gap-1 text-[10px] border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">
                  <ShieldCheck className="h-3 w-3" /> {entries.length} {isRTL ? 'ملاحظة' : 'saved'}
                </Badge>
              </div>

              {saved && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" role="status">
                  <CheckCircle2 className="h-5 w-5" /> {isRTL ? 'تم حفظ الملاحظة على هذا الجهاز' : 'Observation saved on this device'}
                </div>
              )}

              <section className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-emerald-600" />
                  <div>
                    <h3 className="font-semibold">{isRTL ? 'ملاحظة جديدة' : 'New observation'}</h3>
                    <p className="text-xs text-muted-foreground">{isRTL ? 'أضف صورة أو ملاحظة واحدة على الأقل' : 'Add a photo or note to save an observation'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">{isRTL ? 'الحقل' : 'Field'}</span>
                    <Input value={fieldName} onChange={event => setFieldName(event.target.value)} placeholder={isRTL ? 'مثال: الحقل الشمالي' : 'e.g. North 40'} className="h-12 text-base" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">{isRTL ? 'المحصول' : 'Crop'}</span>
                    <Input value={crop} onChange={event => setCrop(event.target.value)} placeholder={isRTL ? 'مثال: طماطم' : 'e.g. Tomato'} className="h-12 text-base" />
                  </label>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground">{isRTL ? 'درجة الخطورة' : 'Severity'}</span>
                  <div className="grid grid-cols-3 gap-2">
                    {SEVERITIES.map(item => (
                      <button key={item.value} type="button" onClick={() => setSeverity(item.value)} className={`min-h-[52px] rounded-xl border-2 px-2 text-sm font-semibold transition-colors ${severity === item.value ? item.active : 'border-border bg-muted/30 text-muted-foreground'}`} aria-pressed={severity === item.value}>
                        {isRTL ? ({ info: 'معلومة', warning: 'مراقبة', critical: 'عاجل' } as Record<ScoutSeverity, string>)[item.value] : item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">{isRTL ? 'ماذا رأيت؟' : 'What did you observe?'}</span>
                    {speechSupported && (
                      <button type="button" onClick={toggleVoice} className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold ${listening ? 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' : 'border-border bg-muted/30 text-muted-foreground'}`}>
                        {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        {listening ? (isRTL ? 'إيقاف' : 'Stop') : (isRTL ? 'صوت' : 'Voice')}
                      </button>
                    )}
                  </div>
                  <textarea value={note} onChange={event => setNote(event.target.value)} placeholder={isRTL ? 'اكتب ملاحظتك أو استخدم الصوت...' : 'Type a note or use voice...'} className="min-h-[112px] w-full resize-y rounded-xl border border-input bg-background px-3 py-3 text-base outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" className="min-h-[54px] gap-2 text-sm" onClick={() => fileInputRef.current?.click()}>
                    <Camera className="h-5 w-5" /> {photo ? (isRTL ? 'تغيير الصورة' : 'Change photo') : (isRTL ? 'التقاط صورة' : 'Take photo')}
                  </Button>
                  <Button type="button" variant="outline" className="min-h-[54px] gap-2 text-sm" onClick={getLocation} disabled={locationLoading}>
                    {locationLoading ? <Navigation className="h-5 w-5 animate-pulse" /> : <MapPin className="h-5 w-5" />}
                    {location ? (isRTL ? 'تم تحديد الموقع' : 'Location added') : (isRTL ? 'إضافة الموقع' : 'Add location')}
                  </Button>
                </div>

                {photo && (
                  <div className="relative overflow-hidden rounded-xl border border-border">
                    <img src={photo} alt={isRTL ? 'صورة الملاحظة' : 'Observation preview'} className="max-h-56 w-full object-cover" />
                    <button type="button" onClick={() => setPhoto(null)} className="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/90 shadow-sm" aria-label={isRTL ? 'إزالة الصورة' : 'Remove photo'}>
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {location && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    <MapPin className="h-4 w-4 text-emerald-600" /> {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  </div>
                )}

                <Button type="button" onClick={saveEntry} disabled={!note.trim() && !photo} className="min-h-[56px] w-full gap-2 bg-emerald-600 text-base hover:bg-emerald-700">
                  <Save className="h-5 w-5" /> {isRTL ? 'حفظ الملاحظة' : 'Save observation'}
                </Button>
              </section>

              {entries.length > 0 && (
                <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <h3 className="font-semibold">{isRTL ? 'آخر الملاحظات' : 'Recent observations'}</h3>
                    </div>
                    <Badge variant="outline" className="text-xs">{entries.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {entries.slice(0, 4).map(entry => (
                      <div key={entry.id} className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/20 p-3">
                        <div className={`mt-0.5 h-3 w-3 flex-shrink-0 rounded-full ${entry.severity === 'critical' ? 'bg-red-500' : entry.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                            <span>{entry.fieldName}</span>
                            <Badge variant="outline" className="text-[10px]">{entry.crop}</Badge>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{entry.note || (isRTL ? 'صورة مرفقة' : 'Photo attached')}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">{formatTime(entry.timestamp)}{entry.location ? ` · ${entry.location.lat.toFixed(3)}, ${entry.location.lng.toFixed(3)}` : ''}</p>
                        </div>
                        <button type="button" onClick={() => deleteEntry(entry.id)} className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={isRTL ? 'حذف الملاحظة' : 'Delete observation'}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </main>
        </div>
      )}
    </>
  );
}
