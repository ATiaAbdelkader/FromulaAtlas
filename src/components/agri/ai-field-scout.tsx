'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  Mic,
  MicOff,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { copyFor, useTranslation, type Language } from '@/lib/language-store';
import { appendScoutEntry, type ScoutDiagnosis, type ScoutSeverity } from '@/lib/scouting-store';
import { getDiseaseReference, type ReferenceMatch } from '@/lib/disease-reference-matcher';
import { getPhytoOptionsForCrop } from '@/lib/crop-simulator';
import { readSavedFields, type SavedFieldRecord } from '@/lib/farm-digital-twin';

interface SymptomResult {
  problem_type: 'disease' | 'pest' | 'weed' | 'nutrient_deficiency' | 'abiotic_stress' | 'unknown';
  problem_name: string;
  problem_name_ar: string;
  confidence: number;
  symptoms_observed: string[];
  possible_causes: string[];
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
  suggested_active_matters: string[];
  reviewRequired: boolean;
  referenceMatches?: ReferenceMatch[];
  needsSecondPhoto?: boolean;
  nextPhotoTarget?: string;
  modelProvider?: string;
}

interface AIFieldScoutProps {
  onOpenFarmTool?: (storageKey: string) => void;
}

function tr(language: Language, english: string, arabic: string, french: string): string {
  return copyFor(language, english, arabic, french);
}

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function resultSeverity(result: SymptomResult | null): ScoutSeverity {
  if (!result) return 'info';
  return result.severity === 'high' ? 'critical' : result.severity === 'medium' ? 'warning' : 'info';
}

function resultLabel(language: Language, result: SymptomResult): string {
  if (language === 'ar' && result.problem_name_ar) return result.problem_name_ar;
  return result.problem_name || tr(language, 'Uncertain crop problem', 'مشكلة محصول غير مؤكدة', 'Problème de culture incertain');
}

export function AIFieldScout({ onOpenFarmTool }: AIFieldScoutProps) {
  const { language, isRTL } = useTranslation();
  const [fields, setFields] = useState<SavedFieldRecord[]>([]);
  const [fieldName, setFieldName] = useState('');
  const [crop, setCrop] = useState('tomato');
  const [note, setNote] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [followUpPhoto, setFollowUpPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [result, setResult] = useState<SymptomResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const followUpInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const saved = readSavedFields();
    setFields(saved);
    if (saved[0]) {
      setFieldName(saved[0].name);
      setCrop(saved[0].crop);
    }
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setSpeechSupported(Boolean(SpeechRecognition));
    }
  }, []);

  const t = useCallback((english: string, french: string, arabic: string) => tr(language, english, arabic, french), [language]);

  const matchedPhyto = useMemo(() => {
    if (!result || result.problem_type === 'unknown') return [];
    const suggestions = result.suggested_active_matters.map(normalizeText);
    const options = getPhytoOptionsForCrop(crop);
    return options.filter((option) => {
      const matterName = normalizeText(option.activeMatter.name);
      const substance = normalizeText(option.activeMatter.activeSubstance);
      return suggestions.some((suggestion) => suggestion.includes(matterName) || matterName.includes(suggestion) || suggestion.includes(substance) || substance.includes(suggestion));
    }).slice(0, 4);
  }, [crop, result]);

  const chooseField = (value: string) => {
    setFieldName(value);
    const selected = fields.find((field) => field.name === value);
    if (selected) setCrop(selected.crop);
  };

  const handlePhoto = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(t('Please choose an image file.', 'Choisissez une image.', 'يرجى اختيار ملف صورة.'));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError(t('Please choose an image smaller than 8 MB.', 'Choisissez une image de moins de 8 Mo.', 'يرجى اختيار صورة أصغر من 8 ميغابايت.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result as string);
      setFollowUpPhoto(null);
      setResult(null);
      setError('');
    };
    reader.onerror = () => setError(t('Could not read the image.', 'Impossible de lire l’image.', 'تعذر قراءة الصورة.'));
    reader.readAsDataURL(file);
  }, [t]);

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
    recognition.lang = language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US';
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((entry: any) => entry[0].transcript).join(' ').trim();
      setVoiceTranscript(transcript);
      setNote(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  }, [language, listening, speechSupported]);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setError(t('GPS is not available on this device.', 'Le GPS n’est pas disponible sur cet appareil.', 'GPS غير متاح على هذا الجهاز.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setError('');
      },
      () => setError(t('Location permission was not granted.', 'Permission de localisation refusée.', 'لم يتم منح إذن الموقع.')),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const analyzePhoto = async (imageOverride?: string) => {
    const imageToAnalyze = imageOverride ?? photo;
    if (!imageToAnalyze) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/identify-symptom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageToAnalyze, crop: crop.trim() || undefined }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || t('AI analysis failed. Please retry.', 'L’analyse IA a échoué. Réessayez.', 'فشل تحليل الذكاء الاصطناعي. حاول مرة أخرى.'));
      setResult(payload as SymptomResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('AI analysis failed. Please retry.', 'L’analyse IA a échoué. Réessayez.', 'فشل تحليل الذكاء الاصطناعي. حاول مرة أخرى.'));
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUpPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) {
      setError(t('Please choose an image smaller than 8 MB.', 'Choisissez une image de moins de 8 Mo.', 'يرجى اختيار صورة أصغر من 8 ميغابايت.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const nextPhoto = reader.result as string;
      setFollowUpPhoto(nextPhoto);
      void analyzePhoto(nextPhoto);
    };
    reader.onerror = () => setError(t('Could not read the follow-up image.', 'Impossible de lire la photo de vérification.', 'تعذر قراءة صورة التحقق.'));
    reader.readAsDataURL(file);
  };

  const saveObservation = () => {
    if (!note.trim() && !photo && !result) {
      setError(t('Add a note, voice recording, or photo before saving.', 'Ajoutez une note, une voix ou une photo avant d’enregistrer.', 'أضف ملاحظة أو تسجيلاً صوتياً أو صورة قبل الحفظ.'));
      return;
    }
    setSaving(true);
    const diagnosis = result ? `${resultLabel(language, result)}${result.recommendation ? ` — ${result.recommendation}` : ''}` : '';
    const combinedNote = [note.trim(), diagnosis].filter(Boolean).join('\n\n');
    const diagnosisEvidence: ScoutDiagnosis | undefined = result ? {
      problemType: result.problem_type,
      problemName: result.problem_name,
      problemNameAr: result.problem_name_ar || undefined,
      confidence: result.confidence,
      referenceMatches: (result.referenceMatches ?? []).map((match) => ({
        diseaseRefId: match.diseaseRefId,
        rank: match.rank,
        matchReason: match.matchReason,
        sourceDataset: match.source.dataset,
        sourceUrl: match.source.url,
        imageCount: match.source.imageCount,
      })),
      needsSecondPhoto: result.needsSecondPhoto ?? false,
      nextPhotoTarget: result.nextPhotoTarget,
      modelProvider: result.modelProvider,
      verificationStatus: 'pending',
    } : undefined;
    const entry = appendScoutEntry({
      id: `ai-scout-${Date.now()}`,
      timestamp: Date.now(),
      fieldName: fieldName.trim() || t('Unspecified field', 'Parcelle sans nom', 'حقل غير محدد'),
      crop: crop.trim() || t('Unknown crop', 'Culture inconnue', 'محصول غير معروف'),
      location: location || undefined,
      note: combinedNote,
      voiceTranscript: voiceTranscript.trim() || undefined,
      photo: photo || undefined,
      additionalPhotos: followUpPhoto ? [followUpPhoto] : undefined,
      diagnosis: diagnosisEvidence,
      severity: resultSeverity(result),
      status: resultSeverity(result) === 'critical' ? 'open' : 'monitoring',
      followUpTask: result?.reviewRequired || result?.needsSecondPhoto ? t('Review the Gallery evidence, add the requested second photo, and verify the label.', 'Vérifier les preuves de la galerie, ajouter la seconde photo demandée et contrôler l’étiquette.', 'راجع أدلة المعرض وأضف صورة التحقق المطلوبة وتحقق من الملصق.') : undefined,
      updatedAt: Date.now(),
    });
    setSaving(false);
    setNotice(t(`Observation saved · ${entry[0]?.fieldName ?? fieldName}`, `Observation enregistrée · ${entry[0]?.fieldName ?? fieldName}`, `تم حفظ الملاحظة · ${entry[0]?.fieldName ?? fieldName}`));
    setTimeout(() => setNotice(''), 2600);
    setNote('');
    setVoiceTranscript('');
    setPhoto(null);
    setFollowUpPhoto(null);
    setLocation(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const reset = () => {
    setPhoto(null);
    setFollowUpPhoto(null);
    setResult(null);
    setError('');
    setNote('');
    setVoiceTranscript('');
    setLocation(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resultTone = result?.severity === 'high' ? 'border-rose-300 bg-rose-50/80 dark:border-rose-900 dark:bg-rose-950/20' : result?.severity === 'medium' ? 'border-amber-300 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/20' : 'border-emerald-300 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/20';

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'} className="overflow-hidden border-emerald-200/60 shadow-sm dark:border-emerald-900/60">
      <CardHeader className="border-b bg-gradient-to-r from-emerald-50 via-background to-cyan-50/40 pb-4 dark:from-emerald-950/30 dark:via-background dark:to-cyan-950/20">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-emerald-600" />{t('AI Field Scout', 'Scout terrain IA', 'كشاف الحقل بالذكاء الاصطناعي')}</CardTitle>
            <CardDescription className="mt-1 max-w-2xl text-xs leading-relaxed">{t('Capture a crop photo, describe what you see by voice, and turn the observation into an Algeria-aware scouting record with reviewable phyto guidance.', 'Photographiez la culture, décrivez-la à la voix et transformez l’observation en fiche de prospection avec conseils phytosanitaires adaptés à l’Algérie.', 'التقط صورة للمحصول، صف ما تراه بالصوت، وحوّل الملاحظة إلى سجل كشف مع إرشادات وقاية نباتية مناسبة للجزائر وقابلة للمراجعة.')}</CardDescription>
          </div>
          <Badge variant="outline" className="w-fit gap-1.5 border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"><ShieldCheck className="h-3 w-3" />{t('Advisory · review required', 'Conseil · vérification requise', 'إرشادي · يتطلب المراجعة')}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="grid gap-3 rounded-2xl border bg-muted/20 p-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">{t('Field', 'Parcelle', 'الحقل')}</label>
            {fields.length > 0 ? <select value={fieldName} onChange={(event) => chooseField(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">{t('Choose a saved field', 'Choisir une parcelle enregistrée', 'اختر حقلاً محفوظاً')}</option>{fields.map((field) => <option key={field.id} value={field.name}>{field.name} · {field.crop}</option>)}</select> : <Input value={fieldName} onChange={(event) => setFieldName(event.target.value)} placeholder={t('e.g. North field', 'ex. Parcelle Nord', 'مثال: الحقل الشمالي')} className="mt-1 h-10 text-sm" />}
          </div>
          <div><label className="text-xs font-semibold text-muted-foreground">{t('Crop', 'Culture', 'المحصول')}</label><Input value={crop} onChange={(event) => setCrop(event.target.value)} className="mt-1 h-10 text-sm" /></div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">{t('What do you observe?', 'Que voyez-vous ?', 'ماذا تلاحظ؟')}</label>
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={t('Describe color changes, spots, insects, wilting, weeds, or weather damage…', 'Décrivez les changements de couleur, taches, insectes, flétrissement, adventices ou dégâts météo…', 'صف تغير اللون أو البقع أو الحشرات أو الذبول أو الأعشاب أو أضرار الطقس…')} className="min-h-24 resize-y text-sm" />
            <div className="flex flex-wrap gap-2">
              {speechSupported && <Button type="button" size="sm" variant={listening ? 'default' : 'outline'} onClick={toggleVoice} className={`gap-1.5 ${listening ? 'bg-rose-600 hover:bg-rose-700' : ''}`}>{listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}{listening ? t('Stop voice', 'Arrêter la voix', 'إيقاف الصوت') : t('Speak note', 'Dicter une note', 'إملاء ملاحظة')}</Button>}
              <Button type="button" size="sm" variant="outline" onClick={captureLocation} className="gap-1.5"><MapPin className="h-3.5 w-3.5" />{location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : t('Add GPS', 'Ajouter GPS', 'إضافة GPS')}</Button>
              {location && <Button type="button" size="sm" variant="ghost" onClick={() => setLocation(null)} className="h-8 px-2 text-xs"><X className="mr-1 h-3 w-3" />{t('Remove', 'Retirer', 'إزالة')}</Button>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">{t('Photo evidence', 'Preuve photo', 'دليل الصورة')}</label>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
            {!photo ? <button type="button" onClick={() => fileInputRef.current?.click()} className="flex min-h-24 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 px-3 py-4 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40"><Camera className="mb-2 h-7 w-7 text-emerald-600" /><span className="text-xs font-semibold">{t('Take or upload a crop photo', 'Prendre ou importer une photo', 'التقط أو ارفع صورة للمحصول')}</span><span className="mt-1 text-[10px] text-muted-foreground">JPG, PNG, WEBP · max 8 MB</span></button> : <div className="relative overflow-hidden rounded-2xl border bg-muted/20"><img src={photo} alt={t('Crop evidence', 'Photo de culture', 'صورة المحصول')} className="h-32 w-full object-cover" /><button type="button" onClick={() => { setPhoto(null); setResult(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute right-2 top-2 rounded-full bg-background/85 p-1.5 shadow" title={t('Remove photo', 'Retirer la photo', 'إزالة الصورة')}><X className="h-3.5 w-3.5" /></button></div>}
            <Button type="button" onClick={() => { void analyzePhoto(); }} disabled={!photo || loading} className="w-full gap-2 bg-emerald-700 hover:bg-emerald-800"><ScanLine className="h-4 w-4" />{loading ? <><Loader2 className="h-4 w-4 animate-spin" />{t('Analyzing…', 'Analyse…', 'جارٍ التحليل…')}</> : t('Analyze with AI', 'Analyser avec l’IA', 'تحليل بالذكاء الاصطناعي')}</Button>
          </div>
        </div>

        {error && <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
        {notice && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200"><CheckCircle2 className="h-4 w-4 shrink-0" /><span>{notice}</span></div>}

        {result && <div className={`rounded-2xl border p-4 ${resultTone}`}>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="text-[10px] uppercase tracking-wide">{result.problem_type.replace('_', ' ')}</Badge><Badge variant="outline" className="text-[10px]">{Math.round(result.confidence * 100)}% {t('confidence', 'confiance', 'ثقة')}</Badge></div><h3 className="mt-2 text-sm font-bold">{resultLabel(language, result)}</h3></div><div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide opacity-75"><ShieldCheck className="h-3.5 w-3.5" />{result.reviewRequired ? t('Verify before action', 'Vérifier avant action', 'تحقق قبل الإجراء') : t('Reviewable suggestion', 'Suggestion à vérifier', 'اقتراح قابل للمراجعة')}</div></div>
          {result.symptoms_observed.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{result.symptoms_observed.slice(0, 5).map((symptom) => <Badge key={symptom} variant="secondary" className="text-[10px]">{symptom}</Badge>)}</div>}
          {result.recommendation && <p className="mt-3 text-xs leading-relaxed">{result.recommendation}</p>}
          {(result.referenceMatches?.length ?? 0) > 0 && <div className="mt-4 rounded-xl border border-cyan-200/80 bg-cyan-50/50 p-3 dark:border-cyan-900/60 dark:bg-cyan-950/20"><div className="flex items-center gap-2 text-xs font-bold"><ShieldCheck className="h-3.5 w-3.5 text-cyan-700" />{t('Reference evidence from the Gallery', 'Preuves de référence de la galerie', 'أدلة مرجعية من المعرض')}</div><div className="mt-2 space-y-2">{result.referenceMatches?.map((match) => { const reference = getDiseaseReference(match.diseaseRefId); return <div key={match.diseaseRefId} className="rounded-lg border bg-background/70 p-2"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="text-xs font-semibold">{reference?.disease ?? match.diseaseRefId}</div><div className="mt-0.5 text-[10px] text-muted-foreground">{match.matchReason} · {match.source.dataset} · {match.source.imageCount.toLocaleString()} {t('reference images', 'images de référence', 'صورة مرجعية')}</div></div><a href={match.source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-700 hover:underline dark:text-cyan-300">{t('View source', 'Voir la source', 'عرض المصدر')}<ExternalLink className="h-3 w-3" /></a></div><div className="mt-2 flex flex-wrap gap-1">{match.discriminators.slice(0, 3).map((item) => <Badge key={item} variant="secondary" className="text-[10px]">{item}</Badge>)}</div></div>; })}</div></div>}
          {result.needsSecondPhoto && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100"><div className="flex flex-wrap items-center justify-between gap-2"><div><div className="font-semibold">{t('Verification photo recommended', 'Photo de vérification recommandée', 'يوصى بصورة تحقق')}</div><div className="mt-1 opacity-85">{t(`Target: ${result.nextPhotoTarget?.replace('_', ' ') ?? 'another plant detail'}. Compare the evidence before any treatment.`, `Cible : ${result.nextPhotoTarget?.replace('_', ' ') ?? 'un autre détail de la plante'}. Comparez les preuves avant tout traitement.`, `الهدف: ${result.nextPhotoTarget?.replace('_', ' ') ?? 'تفصيل آخر للنبات'}. قارن الأدلة قبل أي معالجة.`)}</div></div><input ref={followUpInputRef} type="file" accept="image/*" capture="environment" onChange={handleFollowUpPhoto} className="hidden" /><Button type="button" variant="outline" size="sm" onClick={() => followUpInputRef.current?.click()} className="h-8 gap-1.5 text-[10px]"><Camera className="h-3 w-3" />{t('Add second photo', 'Ajouter une seconde photo', 'إضافة صورة ثانية')}</Button></div>{followUpPhoto && <div className="mt-2 text-[10px] font-medium">{t('Second photo analyzed and stored with this observation.', 'Seconde photo analysée et enregistrée avec cette observation.', 'تم تحليل الصورة الثانية وحفظها مع هذه الملاحظة.')}</div>}</div>}
          {matchedPhyto.length > 0 && !result.reviewRequired && !result.needsSecondPhoto && <div className="mt-4 rounded-xl border border-emerald-200/80 bg-background/60 p-3 dark:border-emerald-900/60"><div className="flex flex-wrap items-center justify-between gap-2"><div className="text-xs font-bold">{t('Matched Algeria phyto options', 'Options phyto algériennes correspondantes', 'خيارات الوقاية النباتية الجزائرية المطابقة')}</div><Button type="button" variant="outline" size="sm" onClick={() => onOpenFarmTool?.('collapse_ipm_action')} className="h-7 gap-1 text-[10px]"><Sparkles className="h-3 w-3" />{t('Open IPM planner', 'Ouvrir le planificateur IPM', 'فتح مخطط IPM')}</Button></div><div className="mt-2 grid gap-2 sm:grid-cols-2">{matchedPhyto.map((option) => <div key={option.activeMatter.id} className="rounded-lg border bg-background/70 p-2"><div className="text-xs font-semibold">{option.activeMatter.name}</div><div className="mt-0.5 text-[10px] text-muted-foreground">{option.activeMatter.activeSubstance} · {option.activeMatter.applicationRate}</div></div>)}</div></div>}
          {matchedPhyto.length > 0 && (result.reviewRequired || result.needsSecondPhoto) && <p className="mt-3 text-[10px] font-medium text-amber-800 dark:text-amber-200">{t('Phyto matches are held until the reference evidence is verified.', 'Les correspondances phyto sont bloquées jusqu’à la vérification des preuves.', 'تم تعليق خيارات الوقاية النباتية حتى التحقق من الأدلة المرجعية.')}</p>}
          {result.reviewRequired && <p className="mt-3 text-[10px] font-medium text-muted-foreground">{t('AI output is advisory. Verify symptoms, local label registration, dose, pre-harvest interval, and safety requirements with a qualified agronomist before treatment.', 'La sortie IA est indicative. Vérifiez les symptômes, l’homologation locale, la dose, le délai avant récolte et la sécurité avec un agronome qualifié avant traitement.', 'نتيجة الذكاء الاصطناعي إرشادية. تحقق من الأعراض وتسجيل المنتج محلياً والجرعة وفترة ما قبل الحصاد ومتطلبات السلامة مع مهندس زراعي مؤهل قبل المعالجة.')}</p>}
        </div>}

        <div className="flex flex-col justify-between gap-3 rounded-2xl border bg-muted/20 p-3 sm:flex-row sm:items-center"><div className="flex items-start gap-2 text-xs text-muted-foreground"><Upload className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>{t('Save the reviewed observation to the Field Intelligence timeline. The Farm Digital Twin will refresh automatically.', 'Enregistrez l’observation vérifiée dans la chronologie. Le Jumeau numérique se mettra à jour automatiquement.', 'احفظ الملاحظة التي تمت مراجعتها في سجل ذكاء الحقل. سيُحدّث التوأم الرقمي نفسه تلقائياً.')}</span></div><div className="flex shrink-0 gap-2"><Button type="button" variant="ghost" size="sm" onClick={reset}>{t('Reset', 'Réinitialiser', 'إعادة ضبط')}</Button><Button type="button" size="sm" onClick={saveObservation} disabled={saving} className="gap-1.5 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}{t('Save observation', 'Enregistrer l’observation', 'حفظ الملاحظة')}</Button></div></div>
      </CardContent>
    </Card>
  );
}
