'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, FileText, RotateCcw } from 'lucide-react';
import { sendToBridge } from '@/lib/tool-bridge';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

interface ParsedReport {
  type: 'soil' | 'water' | 'fertilizer_bag' | 'lab_report' | 'unknown';
  confidence: number;
  values: Record<string, number | string>;
  notes: string;
  suggestedTool: string;
  reviewRequired?: boolean;
}

const TYPE_LABELS: Record<string, { label: string; label_ar: string; label_fr: string; color: string }> = {
  soil:            { label: 'Soil report',        label_ar: 'تقرير تربة',           label_fr: 'Analyse de sol',          color: '#8b5cf6' },
  water:           { label: 'Water analysis',     label_ar: 'تحليل مياه',          label_fr: 'Analyse d\'eau',          color: '#0891b2' },
  fertilizer_bag:  { label: 'Fertilizer label',    label_ar: 'ملصق سماد',           label_fr: 'Étiquette engrais',       color: '#16a34a' },
  lab_report:      { label: 'Lab report',          label_ar: 'تقرير مختبر',         label_fr: 'Rapport de laboratoire',  color: '#3b82f6' },
  unknown:         { label: 'Not recognized',     label_ar: 'غير معروف',           label_fr: 'Non reconnu',             color: '#64748b' },
};

const TOOL_LABELS: Record<string, string> = {
  'soil-water-texture':   'Soil Water & Texture',
  'amendment-balance':    'Amendment Balance by CEC',
  'water-hardness':       'Water Hardness Diagnostic',
  'hydro-solution':       'Hydroponic Solution Designer',
  'granular-mix':         'Granular Mix Formulation',
  'fertilizer-composition': 'Fertilizer Composition',
  'nutrient-units':       'Nutrient Units Converter',
  'unknown':              '—',
};

const TITLE: TrilingualString = {
  en: 'Field Data Capture',
  ar: 'التقاط بيانات الحقل',
  fr: 'Capture de Données Terrain',
};

const DESC: TrilingualString = {
  en: 'Photo → AI extraction → auto-fill tool. Upload a soil/water lab report or fertilizer bag label, AI extracts the numbers, then "Send to tool" pre-fills the matching calculator.',
  ar: 'صورة ← استخراج بالذكاء ← ملء تلقائي للأداة. ارفع تقرير مختبر تربة/مياه أو ملصق كيس سماد، يستخرج الذكاء الأرقام، ثم «إرسال إلى الأداة» يملأ الحاسبة المطابقة.',
  fr: 'Photo → extraction IA → pré-remplissage. Téléversez une analyse de sol/eau ou une étiquette d\'engrais, l\'IA extrait les valeurs, puis « Envoyer vers l\'outil » pré-remplit le calculateur.',
};

// Map parsed values → bridge payloads for each tool
function buildBridgePayload(parsed: ParsedReport): { toolId: string; values: Record<string, number | string> } | null {
  const v = parsed.values;
  switch (parsed.suggestedTool) {
    case 'amendment-balance':
      return {
        toolId: 'amendment-balance',
        values: {
          ca: Number(v.ca_meq_100g) || 0,
          mg: Number(v.mg_meq_100g) || 0,
          k: Number(v.k_meq_100g) || 0,
          na: Number(v.na_meq_100g) || 0,
          h: Number(v.h_meq_100g) || 0,
          al: Number(v.al_meq_100g) || 0,
          cic: Number(v.cec_meq_100g) || 0,
          ph: Number(v.ph) || 0,
        },
      };
    case 'soil-water-texture':
      return {
        toolId: 'soil-water-texture',
        values: {
          clay: Number(v.clay_percent) || 0,
          silt: Number(v.silt_percent) || 0,
          sand: Number(v.sand_percent) || 0,
        },
      };
    case 'water-hardness':
      return {
        toolId: 'water-hardness',
        values: {
          hco3: Number(v.hco3_meq_l) || 0,
          co3: Number(v.co3_meq_l) || 0,
          ca: Number(v.ca_ppm) || 0,
          mg: Number(v.mg_ppm) || 0,
        },
      };
    case 'hydro-solution':
      return {
        toolId: 'hydro-solution',
        values: {
          ca: Number(v.ca_meq_l) || Number(v.ca_ppm) || 0,
          mg: Number(v.mg_meq_l) || Number(v.mg_ppm) || 0,
          k: Number(v.k_meq_l) || Number(v.k_ppm) || 0,
          no3: Number(v.no3_meq_l) || Number(v.no3_ppm) || 0,
          hco3: Number(v.hco3_meq_l) || 0,
          cl: Number(v.cl_meq_l) || Number(v.cl_ppm) || 0,
          so4: Number(v.so4_meq_l) || Number(v.so4_ppm) || 0,
        },
      };
    case 'fertilizer-composition':
      return {
        toolId: 'fertilizer-composition',
        values: { formula: String(v.formula || ''), name: String(v.npk_grade || v.formula || '') },
      };
    case 'granular-mix':
      return {
        toolId: 'granular-mix',
        values: { npk: String(v.npk_grade || ''), n: Number(v.n_percent) || 0, p: Number(v.p2o5_percent) || 0, k: Number(v.k2o_percent) || 0 },
      };
    default:
      return null;
  }
}

export function FieldDataCapture() {
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [reviewAcknowledged, setReviewAcknowledged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError(tr('Please upload an image file (PNG, JPG, etc.)', 'يرجى رفع ملف صورة (PNG، JPG، إلخ)', 'Veuillez téléverser un fichier image (PNG, JPG, etc.)'));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError(tr('Please upload an image smaller than 8 MB.', 'يرجى رفع صورة أصغر من 8 ميغابايت.', 'Veuillez téléverser une image < 8 Mo.'));
      return;
    }
    setLoading(true);
    setError(null);
    setParsed(null);
    setReviewAcknowledged(false);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);

      try {
        const res = await fetch('/api/parse-lab-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data: ParsedReport = await res.json();
        setReviewAcknowledged(false);
        setParsed(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to parse image';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError(tr('Failed to read file', 'فشل قراءة الملف', 'Échec de lecture du fichier'));
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const sendToTool = () => {
    if (!parsed || (parsed.reviewRequired && !reviewAcknowledged)) return;
    const payload = buildBridgePayload(parsed);
    if (!payload) return;
    sendToBridge({
      targetToolId: payload.toolId,
      sourceToolId: 'field-data-capture',
      values: payload.values,
    });
    setParsed(null);
    setPreview(null);
    toast({ title: tr('Sent to tool!', 'أُرسل إلى الأداة!', 'Envoyé vers l\'outil !') });
  };

  const reset = () => {
    setParsed(null);
    setPreview(null);
    setError(null);
    setReviewAcknowledged(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const valueEntries = parsed ? Object.entries(parsed.values).filter(([, v]) => v !== '' && v !== 0) : [];

  return (
    <CalculatorShell
      icon={Camera}
      title={TITLE}
      description={DESC}
      badge={tr('AI Vision', 'رؤية الذكاء', 'Vision IA')}
      accent="emerald"
      actions={[
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة', fr: 'Réinitialiser' },
          onClick: reset,
        },
      ]}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <Camera className="h-4 w-4 text-emerald-600" />
              {tr('Upload Report', 'رفع تقرير', 'Téléverser')}
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />

          {!preview && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 transition-colors"
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <div className="text-sm font-medium">{tr('Click to upload a photo', 'اضغط لرفع صورة', 'Cliquez pour téléverser une photo')}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {tr('Soil lab report, water analysis, or fertilizer bag label — PNG/JPG, max 8 MB', 'تقرير تربة، تحليل مياه، أو ملصق كيس سماد — PNG/JPG، حد أقصى 8 ميغابايت', 'Analyse de sol, d\'eau ou étiquette d\'engrais — PNG/JPG, max 8 Mo')}
              </div>
            </div>
          )}

          {preview && (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img src={preview} alt={tr('Uploaded report', 'التقرير المرفوع', 'Rapport téléversé')} className="w-full max-h-[300px] object-contain bg-muted/20" />
                <button
                  onClick={reset}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur hover:bg-background border border-border"
                  title={tr('Remove image', 'إزالة الصورة', 'Retirer l\'image')}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {tr('Extracting values with AI vision...', 'جارٍ استخراج القيم برؤية الذكاء...', 'Extraction des valeurs par vision IA...')}
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3 border border-destructive/30">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}
            </div>
          )}

          <div className="text-[10px] text-muted-foreground text-center border-t border-border pt-3">
            {tr('Images are processed by AI vision to extract numbers only. They are not stored or sent to any third party.', 'تتم معالجة الصور برؤية الذكاء لاستخراج الأرقام فقط. لا تُخزَّن ولا تُرسَل إلى أي طرف ثالث.', 'Les images sont traitées par vision IA pour extraire les nombres uniquement. Elles ne sont ni stockées ni envoyées à des tiers.')}
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-3 h-full">
          <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-emerald-50 via-transparent to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
            <span className="text-base font-bold flex items-center gap-2">
              ✨ {tr('Extracted Values', 'القيم المستخرجة', 'Valeurs extraites')}
            </span>
          </div>

          {!preview && !loading && !error && (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-sm text-muted-foreground bg-muted/30 rounded-lg border border-dashed text-center gap-2">
              <Camera className="h-8 w-8 opacity-40" />
              <span>{tr('Upload an image to see extracted values.', 'ارفع صورة لعرض القيم المستخرجة.', 'Téléversez une image pour voir les valeurs.')}</span>
            </div>
          )}

          {parsed && !loading && (
            <div className="space-y-3">
              {/* Type + confidence */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-xs font-semibold rounded-full px-2.5 py-1 border"
                  style={{
                    background: `${TYPE_LABELS[parsed.type].color}20`,
                    color: TYPE_LABELS[parsed.type].color,
                    borderColor: `${TYPE_LABELS[parsed.type].color}60`,
                  }}
                >
                  {tr(TYPE_LABELS[parsed.type].label, TYPE_LABELS[parsed.type].label_ar, TYPE_LABELS[parsed.type].label_fr)}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  {tr('Confidence:', 'الثقة:', 'Confiance :')} {Math.round(parsed.confidence * 100)}%
                </div>
              </div>

              {/* Extracted values */}
              {valueEntries.length > 0 ? (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-muted/40 px-3 py-2 text-[11px] uppercase tracking-wide font-semibold text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-3 w-3" /> {tr(`Extracted values (${valueEntries.length})`, `القيم المستخرجة (${valueEntries.length})`, `Valeurs extraites (${valueEntries.length})`)}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-3 text-sm">
                    {valueEntries.map(([k, v]) => (
                      <div key={k} className="flex justify-between border-b border-border/30 py-0.5 last:border-0">
                        <span className="text-muted-foreground text-xs font-mono">{k}</span>
                        <span className="font-mono font-medium text-xs">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 rounded p-2 text-center">
                  {tr('No values could be extracted from this image.', 'تعذّر استخراج أي قيم من هذه الصورة.', 'Aucune valeur extraite de cette image.')}
                </div>
              )}

              {/* Notes */}
              {parsed.notes && (
                <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2 italic">
                  {parsed.notes}
                </div>
              )}

              {parsed.reviewRequired && (
                <label className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-200">
                  <input type="checkbox" checked={reviewAcknowledged} onChange={(event) => setReviewAcknowledged(event.target.checked)} className="mt-0.5" />
                  <span>{tr('I reviewed these values against the original report and understand that AI extraction is advisory and may be inaccurate.', 'راجعت القيم مقابل التقرير الأصلي وأفهم أن نتائج الذكاء الاصطناعي استشارية وقد تكون غير دقيقة.', 'J\'ai vérifié ces valeurs avec le rapport original et comprends que l\'extraction IA est consultative et peut être inexacte.')}</span>
                </label>
              )}

              {/* Suggested tool + send button */}
              {parsed.suggestedTool && parsed.suggestedTool !== 'unknown' && valueEntries.length > 0 && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                  <div className="text-sm">
                    <div className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300 font-semibold">{tr('Suggested tool', 'الأداة المقترحة', 'Outil suggéré')}</div>
                    <div className="font-medium">{TOOL_LABELS[parsed.suggestedTool] || parsed.suggestedTool}</div>
                  </div>
                  <Button onClick={sendToTool} disabled={Boolean(parsed.reviewRequired && !reviewAcknowledged)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    {isRTL ? 'إرسال ←' : tr('Send to tool →', 'إرسال إلى الأداة ←', 'Envoyer →')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
