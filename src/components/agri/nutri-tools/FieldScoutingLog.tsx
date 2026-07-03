'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mic, MicOff, Camera, MapPin, Trash2, Download, Calendar,
  Leaf, AlertTriangle, CheckCircle2, Loader2, X, Search,
} from 'lucide-react';

interface ScoutEntry {
  id: string;
  timestamp: number;
  fieldName: string;
  crop: string;
  location?: { lat: number; lng: number };
  note: string;
  severity: 'info' | 'warning' | 'critical';
  photo?: string; // base64 data URL
  voiceTranscript?: string;
}

const STORAGE_KEY = 'nutriplant_scout_log_v1';

const SEVERITY_STYLES = {
  info:     { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: CheckCircle2, label: 'Info' },
  warning:  { color: '#ca8a04', bg: '#fefce8', border: '#fef08a', icon: AlertTriangle, label: 'Warning' },
  critical: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: AlertTriangle, label: 'Critical' },
};

/**
 * Field Scouting Log — voice + photo + GPS notes, stored locally,
 * exportable as PDF. Uses Web Speech API for voice transcription.
 */
export function FieldScoutingLog() {
  const [entries, setEntries] = useState<ScoutEntry[]>([]);
  const [fieldName, setFieldName] = useState('');
  const [crop, setCrop] = useState('tomato');
  const [note, setNote] = useState('');
  const [severity, setSeverity] = useState<ScoutEntry['severity']>('info');
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [filterField, setFilterField] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEntries(JSON.parse(raw));
    } catch { /* ignore */ }
    // Check speech recognition support
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setSpeechSupported(!!SpeechRecognition);
    }
  }, []);

  // Save to localStorage
  const save = useCallback((newEntries: ScoutEntry[]) => {
    setEntries(newEntries);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
    } catch { /* ignore */ }
  }, []);

  // Voice transcription
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
    recognition.lang = 'en-US';
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
  }, [listening, speechSupported]);

  // GPS
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* ignore error */ }
    );
  }, []);

  // Photo
  const handlePhoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  // Add entry
  const addEntry = useCallback(() => {
    if (!note.trim() && !photo) return;
    const entry: ScoutEntry = {
      id: `scout-${Date.now()}`,
      timestamp: Date.now(),
      fieldName: fieldName.trim() || 'Unspecified field',
      crop,
      location: location || undefined,
      note: note.trim(),
      severity,
      photo: photo || undefined,
    };
    save([entry, ...entries]);
    // Reset form
    setNote('');
    setPhoto(null);
    setLocation(null);
    setSeverity('info');
  }, [note, photo, fieldName, crop, location, severity, entries, save]);

  // Delete entry
  const deleteEntry = useCallback((id: string) => {
    save(entries.filter(e => e.id !== id));
  }, [entries, save]);

  // Export as PDF (print-friendly)
  const exportPdf = useCallback(() => {
    const win = window.open('', '_blank');
    if (!win) return;
    const rows = entries.map(e => {
      const date = new Date(e.timestamp).toLocaleString();
      const loc = e.location ? `${e.location.lat.toFixed(4)}, ${e.location.lng.toFixed(4)}` : '—';
      const photoCell = e.photo ? `<img src="${e.photo}" style="max-width:120px;max-height:80px;border-radius:4px" />` : '—';
      return `<tr><td>${date}</td><td>${e.fieldName}</td><td>${e.crop}</td><td style="text-transform:capitalize">${e.severity}</td><td>${e.note}</td><td>${loc}</td><td>${photoCell}</td></tr>`;
    }).join('');
    win.document.write(`<!DOCTYPE html><html><head><title>Field Scouting Log</title><style>
      body{font-family:system-ui,sans-serif;margin:24px;color:#0f172a}
      h1{color:#047857;font-size:20px} .meta{color:#475569;font-size:12px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse;font-size:10px}
      th{background:#ecfdf5;color:#047857;text-align:left;padding:6px;border:1px solid #a7f3d0}
      td{padding:4px 6px;border:1px solid #d1fae5;vertical-align:top}
      @page{size:landscape;margin:12mm}
    </style></head><body>
      <h1>Field Scouting Log</h1>
      <div class="meta">Exported: ${new Date().toLocaleString()} · ${entries.length} entries</div>
      <table><thead><tr><th>Date/Time</th><th>Field</th><th>Crop</th><th>Severity</th><th>Notes</th><th>GPS</th><th>Photo</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  }, [entries]);

  const filteredEntries = filterField
    ? entries.filter(e => e.fieldName.toLowerCase().includes(filterField.toLowerCase()) || e.crop.toLowerCase().includes(filterField.toLowerCase()))
    : entries;

  const stats = {
    total: entries.length,
    critical: entries.filter(e => e.severity === 'critical').length,
    warning: entries.filter(e => e.severity === 'warning').length,
    info: entries.filter(e => e.severity === 'info').length,
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Leaf className="h-4 w-4 text-emerald-600" /> Field Scouting Log
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Voice + photo + GPS notes — stored locally, exportable as PDF</p>
        </div>
        {entries.length > 0 && (
          <Button size="sm" variant="outline" onClick={exportPdf} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export PDF
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input form */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Field name</Label>
            <Input value={fieldName} onChange={e => setFieldName(e.target.value)} placeholder="e.g. North 40" className="h-8 text-sm mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Crop</Label>
            <Input value={crop} onChange={e => setCrop(e.target.value)} className="h-8 text-sm mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Severity</Label>
            <div className="flex gap-1 mt-0.5">
              {(['info', 'warning', 'critical'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={`flex-1 text-[10px] py-1.5 rounded border capitalize transition-colors ${severity === s ? '' : 'bg-muted/40 border-border'}`}
                  style={severity === s ? { background: SEVERITY_STYLES[s].bg, color: SEVERITY_STYLES[s].color, borderColor: SEVERITY_STYLES[s].border } : {}}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Note input with voice + photo */}
        <div className="space-y-2">
          <div className="flex gap-1.5">
            <Input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What did you observe? (type or use voice)"
              className="h-9 text-sm flex-1"
            />
            {speechSupported && (
              <Button
                size="sm"
                variant={listening ? 'default' : 'outline'}
                onClick={toggleVoice}
                className={`h-9 w-9 p-0 ${listening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''}`}
                title={listening ? 'Stop recording' : 'Voice note'}
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="h-9 w-9 p-0" title="Attach photo">
              <Camera className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={getLocation} className="h-9 w-9 p-0" title="Tag GPS location">
              <MapPin className="h-4 w-4" />
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
          </div>

          {/* Photo preview */}
          {photo && (
            <div className="relative inline-block">
              <img src={photo} alt="Scout photo" className="h-20 rounded-lg border border-border" />
              <button onClick={() => setPhoto(null)} className="absolute -top-1 -right-1 p-0.5 rounded-full bg-background border border-border">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Location badge */}
          {location && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <MapPin className="h-3 w-3 text-emerald-600" />
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </Badge>
          )}

          {/* Add button */}
          <Button onClick={addEntry} disabled={!note.trim() && !photo} size="sm" className="w-full gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Log scouting entry
          </Button>
        </div>

        {/* Stats */}
        {entries.length > 0 && (
          <div className="flex gap-2 text-xs">
            <Badge variant="outline">{stats.total} total</Badge>
            {stats.critical > 0 && <Badge variant="outline" className="text-red-600 border-red-300">{stats.critical} critical</Badge>}
            {stats.warning > 0 && <Badge variant="outline" className="text-amber-600 border-amber-300">{stats.warning} warnings</Badge>}
            {stats.info > 0 && <Badge variant="outline" className="text-blue-600 border-blue-300">{stats.info} info</Badge>}
          </div>
        )}

        {/* Filter */}
        {entries.length > 3 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={filterField} onChange={e => setFilterField(e.target.value)} placeholder="Filter by field or crop..." className="h-8 text-xs pl-8" />
          </div>
        )}

        {/* Entries list */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Leaf className="h-8 w-8 mx-auto mb-2 opacity-40" />
              {entries.length === 0 ? 'No scouting entries yet. Start by logging your first field observation above.' : 'No entries match your filter.'}
            </div>
          ) : (
            filteredEntries.map(entry => {
              const style = SEVERITY_STYLES[entry.severity];
              const Icon = style.icon;
              return (
                <div key={entry.id} className="rounded-lg border p-3 flex gap-3" style={{ background: style.bg, borderColor: style.border }}>
                  <div className="flex items-center justify-center h-7 w-7 rounded flex-shrink-0" style={{ background: `${style.color}20` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: style.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold">{entry.fieldName}</span>
                      <Badge variant="outline" className="text-[9px]">{entry.crop}</Badge>
                      <span className="text-[10px] text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</span>
                      {entry.location && (
                        <Badge variant="outline" className="text-[9px] gap-0.5">
                          <MapPin className="h-2.5 w-2.5" /> {entry.location.lat.toFixed(3)}
                        </Badge>
                      )}
                    </div>
                    {entry.note && <p className="text-xs mt-1 leading-snug">{entry.note}</p>}
                    {entry.photo && <img src={entry.photo} alt="" className="h-16 mt-1.5 rounded border border-border" />}
                  </div>
                  <button onClick={() => deleteEntry(entry.id)} className="text-muted-foreground hover:text-destructive flex-shrink-0 self-start">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {!speechSupported && (
          <p className="text-[10px] text-muted-foreground text-center">
            💡 Voice notes require Chrome/Edge. Photo + GPS + text work in all browsers.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
