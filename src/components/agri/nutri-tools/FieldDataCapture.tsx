'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, X, FileText, ScanLine } from 'lucide-react';
import { sendToBridge } from '@/lib/tool-bridge';

interface ParsedReport {
  type: 'soil' | 'water' | 'fertilizer_bag' | 'lab_report' | 'unknown';
  confidence: number;
  values: Record<string, number | string>;
  notes: string;
  suggestedTool: string;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  soil:            { label: 'Soil report',        color: '#8b5cf6' },
  water:           { label: 'Water analysis',     color: '#0891b2' },
  fertilizer_bag:  { label: 'Fertilizer label',   color: '#16a34a' },
  lab_report:      { label: 'Lab report',         color: '#3b82f6' },
  unknown:         { label: 'Not recognized',     color: '#64748b' },
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

/**
 * Field Data Capture — upload a photo of a soil/water lab report or fertilizer
 * label, AI extracts the numbers, then "Send to {tool}" pre-fills the tool.
 */
export function FieldDataCapture() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, etc.)');
      return;
    }
    setLoading(true);
    setError(null);
    setParsed(null);

    // Read as data URL for preview + API
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
        setParsed(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to parse image';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const sendToTool = () => {
    if (!parsed) return;
    const payload = buildBridgePayload(parsed);
    if (!payload) return;
    sendToBridge({
      targetToolId: payload.toolId,
      sourceToolId: 'field-data-capture',
      values: payload.values,
    });
    // Show success and close
    setOpen(false);
    setParsed(null);
    setPreview(null);
  };

  const reset = () => {
    setParsed(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const valueEntries = parsed ? Object.entries(parsed.values).filter(([, v]) => v !== '' && v !== 0) : [];

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        title="Capture lab report or fertilizer label"
      >
        <ScanLine className="h-5 w-5" />
        <span className="text-sm font-semibold hidden sm:inline">Scan report</span>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div
            className="bg-background rounded-xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-br from-violet-600 to-purple-700 text-white">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/20 backdrop-blur">
                  <Camera className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Field Data Capture</div>
                  <div className="text-[10px] text-violet-100/90">Photo → AI extraction → auto-fill tool</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-violet-100 hover:text-white p-1 rounded hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Upload area */}
              {!preview && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50/30 dark:hover:bg-violet-950/10 transition-colors"
                >
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <div className="text-sm font-medium">Click to upload a photo</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Soil lab report, water analysis, or fertilizer bag label — PNG/JPG, max 10 MB
                  </div>
                </div>
              )}
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

              {/* Preview */}
              {preview && (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img src={preview} alt="Uploaded report" className="w-full max-h-[300px] object-contain bg-muted/20" />
                    <button
                      onClick={reset}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur hover:bg-background border border-border"
                      title="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Loading */}
                  {loading && (
                    <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Extracting values with AI vision...
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3 border border-destructive/30">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <div>{error}</div>
                    </div>
                  )}

                  {/* Parsed result */}
                  {parsed && !loading && (
                    <div className="space-y-3">
                      {/* Type + confidence */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{ background: `${TYPE_LABELS[parsed.type].color}20`, color: TYPE_LABELS[parsed.type].color, borderColor: `${TYPE_LABELS[parsed.type].color}60` }}
                        >
                          {TYPE_LABELS[parsed.type].label}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          Confidence: {Math.round(parsed.confidence * 100)}%
                        </div>
                      </div>

                      {/* Extracted values */}
                      {valueEntries.length > 0 ? (
                        <div className="rounded-lg border border-border overflow-hidden">
                          <div className="bg-muted/40 px-3 py-2 text-[11px] uppercase tracking-wide font-semibold text-muted-foreground flex items-center gap-1.5">
                            <FileText className="h-3 w-3" /> Extracted values ({valueEntries.length})
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
                          No values could be extracted from this image.
                        </div>
                      )}

                      {/* Notes */}
                      {parsed.notes && (
                        <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2 italic">
                          {parsed.notes}
                        </div>
                      )}

                      {/* Suggested tool + send button */}
                      {parsed.suggestedTool && parsed.suggestedTool !== 'unknown' && valueEntries.length > 0 && (
                        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                          <div className="text-sm">
                            <div className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300 font-semibold">Suggested tool</div>
                            <div className="font-medium">{TOOL_LABELS[parsed.suggestedTool] || parsed.suggestedTool}</div>
                          </div>
                          <Button onClick={sendToTool} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                            Send to tool →
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Privacy note */}
              <div className="text-[10px] text-muted-foreground text-center border-t border-border pt-3">
                Images are processed by AI vision to extract numbers only. They are not stored or sent to any third party.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
