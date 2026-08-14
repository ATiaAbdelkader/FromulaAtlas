'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  AlertTriangle, Search, Wand2, ShieldCheck, BookOpen, Sparkles, Check, Thermometer, Droplets, Gauge, Library,
  Camera, Download, Calendar, Loader2, FileText, ExternalLink,
} from 'lucide-react';
import {
  ALGERIA_CROPS, ALGERIAN_ACTIVE_MATTERS, ACTIVE_MATTER_BY_ID, CROP_BY_ID,
  PLANT_PROBLEMS, PROBLEM_BY_ID, problemTypeEmoji, problemTypeLabel,
  type ActiveMatter, type ActiveMatterType, type PlantProblem, type ProblemType,
} from '@/lib/algeria-phyto-data';
import { InpvIndexBrowser } from './InpvIndexBrowser';
import { EphyIndexBrowser } from './EphyIndexBrowser';
import {
  fetchPhytoIndex, indexByActive, normPhyto, type PhytoProduct,
} from '@/lib/phyto-index';
import { useTranslation } from '@/lib/language-store';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const TYPE_EMOJI: Record<ActiveMatterType, string> = {
  insecticide: '🐛', acaricide: '🕷️', fungicide: '🦠', herbicide: '🌿',
  nematicide: '🪱', rodenticide: '🐀', molluscicide: '🐌',
  'bio-insecticide': '🍃', 'bio-fongicide': '🍃',
};

const TYPE_LABEL: Record<ActiveMatterType, string> = {
  insecticide: 'Insecticide', acaricide: 'Acaricide', fungicide: 'Fongicide',
  herbicide: 'Herbicide', nematicide: 'Nématicide', rodenticide: 'Rodenticide',
  molluscicide: 'Molluscicide', 'bio-insecticide': 'Bio insecticide', 'bio-fongicide': 'Bio fongicide',
};

const SAFETY_META = {
  low: { label: 'Risque faible', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300', emoji: '🟢' },
  medium: { label: 'Risque modéré', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300', emoji: '🟡' },
  high: { label: 'Risque élevé', cls: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300', emoji: '🔴' },
} as const;

const COST_META = {
  low: { label: 'Coût faible', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  medium: { label: 'Coût moyen', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  high: { label: 'Coût élevé', cls: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' },
} as const;

const AVAIL_META = {
  common: { label: 'Disponible', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  moderate: { label: 'Dispo. moyenne', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  rare: { label: 'Peu disponible', cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' },
} as const;

type Severity = 'low' | 'medium' | 'high';
const SEVERITY_META: { value: Severity; label: string }[] = [
  { value: 'low', label: 'Faible' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Forte' },
];

interface Env {
  temperature: number;
  humidity: number;
  rainfall: number;
  severity: Severity;
}

interface Scored {
  matter: ActiveMatter;
  score: number;
  factors: string[];
  warnings: string[];
}

/** Systemic / contact helper sets used by the scoring heuristics. */
const SYSTEMIC_IDS = new Set([
  'metalaxyl-m', 'cymoxanil', 'fosetyl-aluminium', 'azoxystrobine', 'tebuconazole',
  'propiconazole', 'cyproconazole', 'difenoconazole', 'myclobutanil', 'penconazole',
  'thiophanate-methyl', 'imidaclopride', 'thiamethoxame', 'acetamipride', 'dimethoate',
]);
const CONTACT_IDS = new Set(['mancozebe', 'cuivre', 'soufre', 'chlorothalonil', 'captan', 'paraquat', 'oxyfluorfene', 'bentazone']);

function scoreActives(problem: PlantProblem, env: Env): Scored[] {
  const out: Scored[] = [];
  problem.actives.forEach((id, rank) => {
    const matter = ACTIVE_MATTER_BY_ID[id];
    if (!matter) return;
    let score = 0.94 - rank * 0.07;
    const factors: string[] = [];
    const warnings: string[] = [];
    const sub = norm(matter.activeSubstance);

    // --- temperature heuristics ---
    if (sub.includes('soufre') && env.temperature > 28) {
      score -= 0.22;
      warnings.push('Risque de phytotoxicité du soufre au-delà de 28 °C — différer ou baisser la dose.');
    }
    if (matter.resistanceCode?.includes('FRAC 3') && env.temperature < 8) {
      score -= 0.08;
      warnings.push('Absorption réduite des triazoles par temps froid (< 8 °C).');
    }
    if (sub.includes('cuivre') && env.temperature < 12) score += 0.03;

    // --- humidity / rainfall heuristics (disease context) ---
    if (problem.type === 'disease') {
      const systemic = SYSTEMIC_IDS.has(matter.id);
      const contact = CONTACT_IDS.has(matter.id);
      if (env.humidity >= 85 && systemic) {
        score += 0.06;
        factors.push('Humidité élevée → privilégier un produit systémique.');
      }
      if (env.humidity >= 85 && contact) score -= 0.03;
      if (env.rainfall >= 15 && contact) {
        score -= 0.12;
        warnings.push('Pluie attendue > 15 mm → un produit de contact sera lessivé : renouveler après pluie ou choisir un systémique.');
      }
    }

    // --- severity ---
    if (env.severity === 'high') {
      if (rank <= 1) {
        score += 0.04;
        factors.push('Pression forte → intervention immédiate avec la référence du problème.');
      } else {
        score -= 0.02;
      }
    }

    // --- registration in Algeria ---
    if (!matter.registeredAlgeria) {
      score -= 0.06;
      warnings.push('Non repéré dans l’index INPV 2017 — vérifier l’homologation en vigueur.');
    }

    out.push({ matter, score, factors, warnings });
  });

  // --- resistance management: penalise same-group duplicates ---
  const seen = new Set<string>();
  for (const r of out) {
    const code = r.matter.resistanceCode;
    if (code && code !== 'n/a' && code !== '—') {
      if (seen.has(code)) {
        r.score -= 0.05;
        r.warnings.push(`Même groupe ${code} qu’un produit mieux classé → alterner pour limiter les résistances.`);
      } else {
        seen.add(code);
      }
    }
  }

  out.forEach((r) => {
    r.score = Math.min(0.97, Math.max(0.3, r.score));
    r.score = Math.round(r.score * 100) / 100;
  });
  return out.sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------
// Confidence ring (SVG)
// ---------------------------------------------------------------------------
function ConfidenceRing({ value, size = 58 }: { value: number; size?: number }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value));
  const color = pct >= 0.75 ? '#059669' : pct >= 0.55 ? '#d97706' : '#dc2626';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={stroke} className="text-muted-foreground/25" fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
        strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fontSize={Math.round(size / 4.4)} fontWeight={800} fill={color}>
        {Math.round(pct * 100)}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function ActiveMatterSelector() {
  const { language } = useTranslation();
  const [tab, setTab] = useState('decision');

  // ----- decision state -----
  const [crop, setCrop] = useState('');
  const [problemType, setProblemType] = useState<ProblemType | ''>('');
  const [problemId, setProblemId] = useState('');
  const [symptomQuery, setSymptomQuery] = useState('');
  const [temperature, setTemperature] = useState(22);
  const [humidity, setHumidity] = useState(65);
  const [rainfall, setRainfall] = useState(5);
  const [severity, setSeverity] = useState<Severity>('medium');
  const [results, setResults] = useState<Scored[] | null>(null);
  const [analysedProblem, setAnalysedProblem] = useState<PlantProblem | null>(null);

  // ----- photo identification state -----
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoResult, setPhotoResult] = useState<any>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----- DAR treatment tracking -----
  const [savedTreatments, setSavedTreatments] = useState<{ problemId: string; matterId: string; date: string; dar: number; harvestDate: string }[]>([]);

  // ----- catalog state -----
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ActiveMatterType>('all');
  const [cropFilter, setCropFilter] = useState('all');
  const [availFilter, setAvailFilter] = useState<'all' | 'common' | 'moderate' | 'rare'>('all');

  const problemsByCrop = useMemo(
    () => PLANT_PROBLEMS.filter((p) => p.crops.includes(crop)),
    [crop],
  );

  const problemsFiltered = useMemo(
    () => problemsByCrop.filter((p) => !problemType || p.type === problemType),
    [problemsByCrop, problemType],
  );

  const matchedBySymptoms = useMemo(() => {
    const q = norm(symptomQuery.trim());
    if (q.length < 3) return [];
    const tokens = q.split(/\s+/).filter((t) => t.length >= 3);
    if (!tokens.length) return [];
    return problemsByCrop.filter((p) => {
      const hay = norm(`${p.name} ${p.nameAr ?? ''} ${p.symptoms.join(' ')}`);
      return tokens.some((t) => hay.includes(t));
    });
  }, [problemsByCrop, symptomQuery]);

  const catalogFiltered = useMemo(() => {
    const q = norm(query.trim());
    return ALGERIAN_ACTIVE_MATTERS.filter((m) => {
      if (typeFilter !== 'all' && m.type !== typeFilter) return false;
      if (availFilter !== 'all' && m.availability !== availFilter) return false;
      if (cropFilter !== 'all' && !m.crops.includes(cropFilter)) return false;
      if (q) {
        const hay = norm(`${m.name} ${m.activeSubstance} ${m.modeOfAction} ${m.crops.join(' ')} ${m.targets.join(' ')}`);
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [query, typeFilter, availFilter, cropFilter]);

  const env: Env = { temperature, humidity, rainfall, severity };

  // ----- INPV 2017 index (enrichment) -----
  const [phytoProducts, setPhytoProducts] = useState<PhytoProduct[] | null>(null);
  useEffect(() => {
    let alive = true;
    fetchPhytoIndex()
      .then((list) => { if (alive) setPhytoProducts(list); })
      .catch(() => { if (alive) setPhytoProducts([]); });
    return () => { alive = false; };
  }, []);

  const activeIndex = useMemo(
    () => (phytoProducts ? indexByActive(phytoProducts) : null),
    [phytoProducts],
  );

  /** INPV specialities whose active substance matches a curated matter. */
  const inpvMatchesFor = useMemo(() => {
    const map = new Map<string, PhytoProduct[]>();
    if (!activeIndex) return map;
    for (const m of ALGERIAN_ACTIVE_MATTERS) {
      const hay = normPhyto(m.activeSubstance);
      if (hay.length < 3) continue;
      const seen = new Map<string, PhytoProduct>();
      for (const [n, list] of activeIndex) {
        if (n.length >= 3 && (hay.includes(n) || n.includes(hay))) {
          for (const p of list) seen.set(`${p.homologation}|${p.brand}`, p);
        }
      }
      map.set(m.id, [...seen.values()].slice(0, 8));
    }
    return map;
  }, [activeIndex]);

  const runAnalysis = () => {
    const problem = problemId ? PROBLEM_BY_ID[problemId] : matchedBySymptoms[0];
    if (!problem) return;
    setAnalysedProblem(problem);
    setResults(scoreActives(problem, env));
  };

  const canAnalyze = Boolean(problemId || matchedBySymptoms.length === 1);

  const selectProblem = (id: string) => {
    setProblemId(id);
    const p = PROBLEM_BY_ID[id];
    if (p) setProblemType(p.type);
  };

  // ----- Photo identification handler -----
  const handlePhotoUpload = useCallback(async (file: File) => {
    setPhotoLoading(true);
    setPhotoError(null);
    setPhotoResult(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = String(reader.result);
        setPhotoData(dataUrl);
        try {
          const res = await fetch('/api/identify-symptom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: dataUrl, crop: CROP_BY_ID[crop]?.name || undefined }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          setPhotoResult(data);
          // Auto-select crop + problem if matched
          if (data.suggested_active_matters && data.suggested_active_matters.length > 0) {
            // Try to find matching problem in our database
            const problemName = norm(data.problem_name || '');
            const matched = PLANT_PROBLEMS.find(p => norm(p.name).includes(problemName) || problemName.includes(norm(p.name)));
            if (matched) {
              selectProblem(matched.id);
              if (matched.crops[0]) setCrop(matched.crops[0]);
            }
          }
        } catch (e: any) {
          setPhotoError(e?.message || 'Échec de l\'analyse');
        } finally {
          setPhotoLoading(false);
        }
      };
      reader.onerror = () => { setPhotoError('Lecture du fichier échouée'); setPhotoLoading(false); };
      reader.readAsDataURL(file);
    } catch (e: any) {
      setPhotoError(e?.message || 'Erreur'); setPhotoLoading(false);
    }
  }, []);

  // ----- PDF export handler -----
  const exportTreatmentPDF = useCallback(() => {
    if (!results || !analysedProblem) return;
    const cropName = crop ? CROP_BY_ID[crop]?.name : '—';
    const win = window.open('', '_blank');
    if (!win) return;
    const rows = results.slice(0, 5).map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${r.matter.name}</strong><br/><span style="font-size:10px;color:#666">${r.matter.activeSubstance} (${r.matter.formulation})</span></td>
        <td style="text-align:center;font-weight:bold;color:${r.score >= 0.75 ? '#059669' : r.score >= 0.55 ? '#d97706' : '#dc2626'}">${Math.round(r.score * 100)}%</td>
        <td>${r.matter.applicationRate}</td>
        <td style="text-align:center"><strong>${r.matter.preHarvestInterval}</strong></td>
        <td>${r.matter.resistanceCode || '—'}</td>
        <td style="font-size:10px">${r.warnings.join('; ') || '—'}</td>
      </tr>
    `).join('');
    win.document.write(`<!doctype html><html><head><title>Plan de traitement — ${cropName} — ${analysedProblem.name}</title>
      <style>
        body { font-family: -apple-system, sans-serif; margin: 24px; color: #1f2937; }
        h1 { color: #059669; border-bottom: 2px solid #059669; padding-bottom: 8px; font-size: 18px; }
        h2 { font-size: 13px; text-transform: uppercase; color: #6b7280; margin-top: 20px; }
        .meta { font-size: 11px; color: #6b7280; margin: 4px 0 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #ecfdf5; padding: 6px 8px; text-align: left; border: 1px solid #d1d5db; color: #065f46; }
        td { padding: 6px 8px; border: 1px solid #d1d5db; vertical-align: top; }
        .footer { margin-top: 24px; font-size: 10px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 8px; }
        @media print { @page { margin: 1cm; } }
      </style></head><body>
      <h1>🌾 Plan de traitement phytosanitaire</h1>
      <div class="meta">
        <strong>Culture:</strong> ${cropName} ·
        <strong>Problème:</strong> ${analysedProblem.name} ${analysedProblem.nameAr || ''} ·
        <strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')} ·
        <strong>Conditions:</strong> ${temperature}°C, ${humidity}% HR, ${rainfall}mm pluie, pression ${severity}
      </div>
      <h2>Classement des matières actives recommandées</h2>
      <table>
        <thead><tr><th>#</th><th>Produit</th><th>Score</th><th>Dose</th><th>DAR (j)</th><th>Groupe</th><th>Remarques</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">
        ⚠️ Ce document est une aide à la décision basée sur l'Index INPV 2017 et E-Phy/Anses.
        Vérifiez toujours l'étiquette du produit et l'homologation algérienne en vigueur.
        Généré par Formula Atlas — ${new Date().toLocaleString('fr-FR')}
      </div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  }, [results, analysedProblem, crop, temperature, humidity, rainfall, severity]);

  // ----- DAR treatment save handler -----
  const saveTreatment = useCallback((matterId: string, dar: number) => {
    const today = new Date();
    const harvest = new Date(today);
    harvest.setDate(harvest.getDate() + dar);
    const treatment = {
      problemId: problemId || analysedProblem?.id || '',
      matterId,
      date: today.toISOString().slice(0, 10),
      dar,
      harvestDate: harvest.toISOString().slice(0, 10),
    };
    // Save to localStorage for Today's Tasks widget
    try {
      const key = 'phyto_treatments_v1';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(treatment);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch { /* ignore */ }
    setSavedTreatments(prev => [...prev, treatment]);
  }, [problemId, analysedProblem]);

  // =========================================================================
  return (
    <div className="space-y-6">
      {/* ------------------------------------------------ Banner ---------- */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-5 text-white shadow-lg sm:p-6">
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-44 w-44 rounded-full bg-teal-300/10" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge className="border-white/25 bg-white/15 text-white">🇩🇿 Algérie — Index INPV 2017</Badge>
              <Badge className="border-white/25 bg-white/15 text-white">🛡️ {ALGERIAN_ACTIVE_MATTERS.length} produits</Badge>
              <Badge className="border-white/25 bg-white/15 text-white">🦠 {PLANT_PROBLEMS.length} problèmes</Badge>
              <Badge className="border-white/25 bg-white/15 text-white">🌾 {ALGERIA_CROPS.length} cultures</Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Sélectionneur de matières actives</h2>
            <p className="mt-1.5 text-sm text-emerald-100/95">
              Trouvez la bonne matière active contre une maladie, un ravageur ou une adventice —
              adaptée à votre culture, à la pression observée et aux conditions du terrain.
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <div className="text-4xl">🌾</div>
            <div className="mt-1 text-xs text-emerald-100" dir="rtl">مختار المواد الفعّالة</div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------ How it works ---- */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: '🌾', t: '1 · Choisissez la culture', d: 'Olivier, blé, tomate, palmier dattier… 19 cultures algériennes.' },
          { icon: '🔎', t: '2 · Décrivez le problème', d: 'Maladie, ravageur ou adventice — par liste ou par symptômes.' },
          { icon: '🧭', t: '3 · Recevez le classement', d: 'Produits notés avec explications, doses, DAR et restrictions.' },
        ].map((s) => (
          <div key={s.t} className="flex min-h-[92px] items-start gap-3 rounded-2xl border bg-card p-4 shadow-sm">
            <div className="text-2xl leading-none">{s.icon}</div>
            <div>
              <div className="text-sm font-semibold">{s.t}</div>
              <div className="text-xs text-muted-foreground">{s.d}</div>
            </div>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid h-auto w-full max-w-2xl grid-cols-2 gap-1 p-1 sm:grid-cols-4">
          <TabsTrigger value="decision" className="min-h-10 text-sm">🧭 Décision</TabsTrigger>
          <TabsTrigger value="catalog" className="min-h-10 text-sm">📚 Catalogue</TabsTrigger>
          <TabsTrigger value="inpv" className="min-h-10 text-sm">📜 Index INPV</TabsTrigger>
          <TabsTrigger value="ephy" className="min-h-10 text-sm">🇫🇷 E-Phy</TabsTrigger>
        </TabsList>

        {/* ================================================================
            DECISION TAB
        ================================================================ */}
        <TabsContent value="decision" className="space-y-4">
          {/* ---- Photo identification ---- */}
          <Card className="overflow-hidden rounded-2xl border-emerald-200 bg-emerald-50/30 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/10">
            <CardContent className="p-4">
              <div className="flex flex-col items-start gap-4 rounded-xl border bg-background/70 p-3 sm:flex-row sm:p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Camera className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-semibold">Identification par photo (IA)</span>
                    <Badge variant="outline" className="text-[9px]">Nouveau</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">Prenez une photo du problème (feuille malade, insecte, adventice) — l'IA identifie le problème et remplit automatiquement les champs ci-dessous.</p>
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }} />
                    <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={photoLoading} className="min-h-10 gap-1.5">
                    {photoLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                    {photoLoading ? 'Analyse en cours…' : 'Téléverser une photo'}
                  </Button>
                </div>
                {photoData && (
                  <div className="relative shrink-0">
                    <img src={photoData} alt="Symptôme" className="h-24 w-24 rounded-xl border-2 border-emerald-300 object-cover" />
                    {photoLoading && <div className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center"><Loader2 className="h-6 w-6 text-white animate-spin" /></div>}
                  </div>
                )}
              </div>
              {photoError && <div className="mt-2 text-xs text-rose-600">⚠️ {photoError}</div>}
              {photoResult && !photoLoading && (
                <div className="mt-4 space-y-2 rounded-xl border border-emerald-200 bg-background p-3 text-sm dark:border-emerald-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-emerald-600 text-white text-[10px]">{photoResult.problem_type}</Badge>
                    <span className="font-semibold">{photoResult.problem_name}</span>
                    {photoResult.problem_name_ar && <span className="text-muted-foreground" dir="rtl">{photoResult.problem_name_ar}</span>}
                    <Badge variant="outline" className="text-[10px] ml-auto">Confiance: {Math.round((photoResult.confidence || 0) * 100)}%</Badge>
                  </div>
                  {photoResult.symptoms_observed?.length > 0 && <div className="text-muted-foreground">Symptômes: {photoResult.symptoms_observed.join(', ')}</div>}
                  {photoResult.recommendation && <div className="text-foreground/80">{photoResult.recommendation}</div>}
                  {photoResult.referenceMatches?.length > 0 && <div className="rounded-lg border border-cyan-200 bg-cyan-50/50 p-2 dark:border-cyan-900 dark:bg-cyan-950/20"><div className="font-medium text-cyan-800 dark:text-cyan-200">{language === 'ar' ? 'أدلة المعرض المرجعية' : language === 'fr' ? 'Preuves de référence de la galerie' : 'Gallery reference evidence'}</div><div className="mt-1 space-y-1">{photoResult.referenceMatches.slice(0, 3).map((match: { diseaseRefId: string; matchReason: string; source: { dataset: string; url: string; imageCount: number } }) => <div key={match.diseaseRefId} className="flex flex-wrap items-center justify-between gap-1 text-[10px]"><span>{match.diseaseRefId} · {match.matchReason} · {match.source.dataset} ({match.source.imageCount})</span><a href={match.source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-700 hover:underline dark:text-cyan-300">{language === 'ar' ? 'المصدر' : language === 'fr' ? 'Source' : 'Source'}<ExternalLink className="h-3 w-3" /></a></div>)}</div></div>}
                  {photoResult.needsSecondPhoto && <div className="rounded border border-amber-200 bg-amber-50 p-2 text-[10px] text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">{language === 'ar' ? 'التقط صورة تحقق قبل اتخاذ أي إجراء.' : language === 'fr' ? 'Ajoutez une photo de vérification avant toute action.' : 'Add a verification photo before taking action.'}</div>}
                  {photoResult.suggested_active_matters?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      <span className="text-muted-foreground">Matières actives suggérées:</span>
                      {photoResult.suggested_active_matters.map((m: string, i: number) => <Badge key={i} variant="secondary" className="text-[9px]">{m}</Badge>)}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-3 lg:grid-cols-3">
            {/* ---- Step 1 : culture ---- */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">1</span>
                  Culture
                </CardTitle>
                <CardDescription>La parcelle concernée</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={crop} onValueChange={(v) => { setCrop(v); setProblemId(''); setResults(null); }}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Choisir une culture…" /></SelectTrigger>
                  <SelectContent>
                    {ALGERIA_CROPS.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* ---- Step 2 : problème ---- */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">2</span>
                  Problème
                </CardTitle>
                <CardDescription>Maladie, ravageur ou adventice</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* type toggle */}
                <div className="grid grid-cols-3 gap-1.5">
                  {(['disease', 'pest', 'weed'] as ProblemType[]).map((t) => (
                    <Button
                      key={t}
                      type="button"
                      variant={problemType === t ? 'default' : 'outline'}
                      size="sm"
                      className={problemType === t ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                      onClick={() => { setProblemType(problemType === t ? '' : t); setProblemId(''); }}
                    >
                      {problemTypeEmoji[t]} {problemTypeLabel[t]}
                    </Button>
                  ))}
                </div>

                {!crop ? (
                  <p className="rounded-lg border border-dashed bg-muted/40 px-3 py-4 text-center text-xs text-muted-foreground">
                    Sélectionnez d’abord une culture pour afficher les problèmes associés.
                  </p>
                ) : (
                  <>
                    <Select value={problemId} onValueChange={selectProblem}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Choisir le problème…" /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {problemsFiltered.length === 0 && (
                          <div className="px-3 py-2 text-xs text-muted-foreground">Aucun problème pour cette culture / ce type.</div>
                        )}
                        {problemsFiltered.map((p) => (
                          <SelectItem key={p.id} value={p.id} className="text-xs">
                            {problemTypeEmoji[p.type]} {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">ou par symptômes</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={symptomQuery}
                        onChange={(e) => { setSymptomQuery(e.target.value); setProblemId(''); }}
                        placeholder="Ex : taches brunes, galeries, oïdium…"
                        className="h-10 pl-9 text-sm"
                      />
                    </div>
                    {matchedBySymptoms.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                          {matchedBySymptoms.length} correspondance{matchedBySymptoms.length > 1 ? 's' : ''} détectée{matchedBySymptoms.length > 1 ? 's' : ''} :
                        </div>
                        {matchedBySymptoms.slice(0, 4).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => selectProblem(p.id)}
                            className={`block w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
                              problemId === p.id
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                                : 'border-border bg-card hover:border-emerald-300'
                            }`}
                          >
                            <span className="font-semibold">{problemTypeEmoji[p.type]} {p.name}</span>
                            {p.nameAr && <span className="ml-1.5 text-muted-foreground" dir="rtl">{p.nameAr}</span>}
                            {p.notes && <span className="mt-0.5 block text-[10px] text-muted-foreground">{p.notes.slice(0, 90)}…</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* ---- Step 3 : conditions ---- */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">3</span>
                  Conditions (optionnel)
                </CardTitle>
                <CardDescription>Affinent le classement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <Label className="flex items-center gap-1.5"><Thermometer className="h-3.5 w-3.5 text-orange-500" /> Température</Label>
                    <Badge variant="outline" className="text-xs">{temperature} °C</Badge>
                  </div>
                  <Slider min={0} max={45} step={1} value={[temperature]} onValueChange={(v) => setTemperature(v[0])} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <Label className="flex items-center gap-1.5"><Droplets className="h-3.5 w-3.5 text-sky-500" /> Humidité relative</Label>
                    <Badge variant="outline" className="text-xs">{humidity} %</Badge>
                  </div>
                  <Slider min={10} max={100} step={5} value={[humidity]} onValueChange={(v) => setHumidity(v[0])} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <Label className="flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5 text-indigo-500" /> Pluie prévue (24 h)</Label>
                    <Badge variant="outline" className="text-xs">{rainfall} mm</Badge>
                  </div>
                  <Slider min={0} max={40} step={1} value={[rainfall]} onValueChange={(v) => setRainfall(v[0])} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Niveau de pression</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SEVERITY_META.map((s) => (
                      <Button
                        key={s.value}
                        type="button"
                        size="sm"
                        variant={severity === s.value ? 'default' : 'outline'}
                        className={severity === s.value ? (s.value === 'high' ? 'bg-red-600 hover:bg-red-700' : s.value === 'medium' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700') : ''}
                        onClick={() => setSeverity(s.value)}
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ---- Analyse ---- */}
          <div className="flex flex-col items-center gap-2">
            <Button
              size="lg"
              disabled={!canAnalyze || !crop}
              onClick={runAnalysis}
              className="min-h-11 w-full max-w-md gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-base hover:from-emerald-700 hover:to-teal-700"
            >
              <Wand2 className="h-4 w-4" />
              Analyser et classer les matières actives
            </Button>
            {!canAnalyze && crop && (
              <p className="text-xs text-muted-foreground">
                {problemsFiltered.length === 0
                  ? 'Aucun problème listé pour cette culture — essayez la recherche par symptômes.'
                  : 'Choisissez un problème dans la liste ou tapez des symptômes.'}
              </p>
            )}
          </div>

          {/* ---- Results ---- */}
          {results && analysedProblem && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-base font-semibold">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  Classement pour « {analysedProblem.name} »
                  {analysedProblem.nameAr && <span className="text-xs font-normal text-muted-foreground" dir="rtl">{analysedProblem.nameAr}</span>}
                </h3>
                <div className="flex gap-1.5">
                  {analysedProblem.crops.slice(0, 3).map((c) => (
                    <Badge key={c} variant="outline" className="text-[10px]">{CROP_BY_ID[c]?.emoji} {CROP_BY_ID[c]?.name}</Badge>
                  ))}
                  <Button size="sm" variant="outline" onClick={exportTreatmentPDF} className="min-h-10 gap-1.5 text-sm">
                    <FileText className="h-3.5 w-3.5" /> Exporter PDF
                  </Button>
                </div>
              </div>

              {results.map((r, i) => (
                <RecommendationCard key={r.matter.id} scored={r} rank={i + 1} top={i === 0} problem={analysedProblem} inpv={inpvMatchesFor.get(r.matter.id) ?? []} onSaveTreatment={saveTreatment} />
              ))}

              <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Ce classement est une aide à la décision fondée sur des données publiques (Index INPV 2017, E-Phy/Anses).
                  Il ne remplace ni l’étiquette du produit, ni l’avis d’un conseiller technique. Vérifiez toujours
                  l’homologation algérienne en vigueur et les doses indiquées sur l’emballage avant toute application.
                </span>
              </p>
            </div>
          )}
        </TabsContent>

        {/* ================================================================
            CATALOG TAB
        ================================================================ */}
        <TabsContent value="catalog" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Library className="h-4 w-4 text-emerald-600" /> Catalogue des matières actives</CardTitle>
              <CardDescription>
                {ALGERIAN_ACTIVE_MATTERS.length} produits · {new Set(ALGERIAN_ACTIVE_MATTERS.map((m) => norm(m.activeSubstance))).size} substances · {ALGERIA_CROPS.length} cultures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative sm:col-span-2">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher : nom, substance, culture, cible…"
                    className="pl-8 text-xs"
                  />
                </div>
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                                        <SelectTrigger className="min-h-10 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {(['insecticide', 'acaricide', 'fungicide', 'herbicide', 'nematicide', 'rodenticide', 'molluscicide', 'bio-insecticide', 'bio-fongicide'] as ActiveMatterType[]).map((t) => (
                      <SelectItem key={t} value={t}>{TYPE_EMOJI[t]} {TYPE_LABEL[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Select value={cropFilter} onValueChange={setCropFilter}>
                    <SelectTrigger className="min-h-10 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="all">Toutes cultures</SelectItem>
                      {ALGERIA_CROPS.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Disponibilité :</span>
                {(['all', 'common', 'moderate', 'rare'] as const).map((a) => (
                  <Button
                    key={a}
                    type="button"
                    size="sm"
                    variant={availFilter === a ? 'default' : 'outline'}
                    className={availFilter === a ? 'h-9 bg-emerald-600 text-sm hover:bg-emerald-700' : 'h-9 text-sm'}
                    onClick={() => setAvailFilter(a)}
                  >
                    {a === 'all' ? 'Tous' : AVAIL_META[a].label}
                  </Button>
                ))}
                <Badge variant="secondary" className="ml-auto text-xs">{catalogFiltered.length} résultat{catalogFiltered.length > 1 ? 's' : ''}</Badge>
              </div>

              {catalogFiltered.length === 0 ? (
                <p className="rounded-xl border border-dashed px-4 py-8 text-center text-xs text-muted-foreground">
                  Aucun produit ne correspond aux filtres — élargissez la recherche.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {catalogFiltered.map((m) => (
                      <Card key={m.id} className="rounded-xl transition hover:border-emerald-400/60 hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">{TYPE_EMOJI[m.type]}</span>
                              <span className="truncate text-sm font-semibold">{m.name}</span>
                              {m.registeredAlgeria && (
                                <Badge className="shrink-0 bg-emerald-600 px-1.5 py-0 text-[9px] text-white">INPV 2017</Badge>
                              )}
                            </div>
                            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{m.activeSubstance} · {m.formulation}</div>
                          </div>
                          <Badge variant="outline" className="shrink-0 text-[9px]">{TYPE_LABEL[m.type]}</Badge>
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {m.crops.slice(0, 4).map((c) => (
                            <Badge key={c} variant="secondary" className="px-1.5 py-0 text-[9px]">
                              {CROP_BY_ID[c]?.emoji ?? ''} {CROP_BY_ID[c]?.name ?? c}
                            </Badge>
                          ))}
                          {m.crops.length > 4 && <Badge variant="secondary" className="px-1.5 py-0 text-[9px]">+{m.crops.length - 4}</Badge>}
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          <Badge className={`text-[9px] ${SAFETY_META[m.safetyLevel].cls}`}>{SAFETY_META[m.safetyLevel].emoji} {SAFETY_META[m.safetyLevel].label}</Badge>
                          <Badge className={`text-[9px] ${COST_META[m.cost].cls}`}>{COST_META[m.cost].label}</Badge>
                          <Badge className={`text-[9px] ${AVAIL_META[m.availability].cls}`}>{AVAIL_META[m.availability].label}</Badge>
                        </div>
                        <div className="mt-2 text-[10px] text-muted-foreground">
                          {m.targets.length} cible{m.targets.length > 1 ? 's' : ''} · Dose : {m.applicationRate} · DAR : {m.preHarvestInterval}
                        </div>
                        {inpvMatchesFor.get(m.id)?.length ? (
                          <div className="mt-2 flex flex-wrap items-center gap-1">
                            <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Index INPV :</span>
                            {inpvMatchesFor.get(m.id)!.slice(0, 3).map((p) => (
                              <Badge key={`${p.homologation}|${p.brand}`} variant="outline" className="border-emerald-300 px-1.5 py-0 font-mono text-[9px] text-emerald-700 dark:border-emerald-800 dark:text-emerald-400">
                                {p.brand || '—'} · {p.homologation}
                              </Badge>
                            ))}
                            {inpvMatchesFor.get(m.id)!.length > 3 && (
                              <Badge variant="outline" className="px-1.5 py-0 text-[9px]">+{inpvMatchesFor.get(m.id)!.length - 3}</Badge>
                            )}
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================
            INPV 2017 INDEX TAB
        ================================================================ */}
        <TabsContent value="inpv" className="space-y-4">
          <InpvIndexBrowser />
        </TabsContent>

        {/* ================================================================
            E-PHY CATALOGUE TAB (France, Anses)
        ================================================================ */}
        <TabsContent value="ephy" className="space-y-4">
          <EphyIndexBrowser />
        </TabsContent>
      </Tabs>

      {/* ------------------------------------------------ Sources ---------- */}
      <div className="rounded-2xl border bg-card px-4 py-4 shadow-sm">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Sources :</span>{' '}
            Index des produits phytosanitaires à usage agricole — Algérie (INPV, 2017) · Catalogue ouvert E-Phy (Anses, France — Licence Ouverte 2.0) ·
            Registres EPPO. Outil d’aide à la décision —{' '}
            <span className="font-medium text-amber-600 dark:text-amber-400">
              l’utilisation d’un produit n’est légale que si l’homologation algérienne (INPV) est en vigueur et si les mentions de l’étiquette sont respectées.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recommendation card
// ---------------------------------------------------------------------------
function RecommendationCard({
  scored, rank, top, problem, inpv, onSaveTreatment,
}: {
  scored: Scored;
  rank: number;
  top: boolean;
  problem: PlantProblem;
  inpv: PhytoProduct[];
  onSaveTreatment: (matterId: string, dar: number) => void;
}) {
  const { matter: m } = scored;
  const cropNames = m.crops.slice(0, 4).map((c) => CROP_BY_ID[c]?.name ?? c);
  const [treatmentSaved, setTreatmentSaved] = useState(false);
  const darDays = parseInt(m.preHarvestInterval) || 0;
  const harvestDate = useMemo(() => {
    if (!darDays) return null;
    const d = new Date(); d.setDate(d.getDate() + darDays);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [darDays]);
  return (
      <Card className={`overflow-hidden rounded-2xl shadow-sm ${top ? 'border-emerald-500/70 shadow-md ring-1 ring-emerald-500/30' : ''}`}>
      {top && (
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-1.5 text-[11px] font-semibold text-white">
          <Check className="h-3.5 w-3.5" /> Choix recommandé — meilleur compromis efficacité / risque / disponibilité
        </div>
      )}
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
        <div className="flex flex-col items-center gap-1">
          <ConfidenceRing value={scored.score} />
          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">confiance</span>
        </div>

        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-bold">#{rank}</span>
            <span className="text-sm font-semibold">{m.name}</span>
            <Badge variant="outline" className="text-[10px]">{TYPE_EMOJI[m.type]} {TYPE_LABEL[m.type]}</Badge>
            {m.registeredAlgeria && <Badge className="bg-emerald-600 px-1.5 py-0 text-[9px] text-white">🇩🇿 INPV 2017</Badge>}
            <div className="ml-auto flex flex-wrap justify-end gap-1">
              <Badge className={`text-[9px] ${SAFETY_META[m.safetyLevel].cls}`}>{SAFETY_META[m.safetyLevel].emoji} {SAFETY_META[m.safetyLevel].label}</Badge>
              <Badge className={`text-[9px] ${COST_META[m.cost].cls}`}>{COST_META[m.cost].label}</Badge>
              <Badge className={`text-[9px] ${AVAIL_META[m.availability].cls}`}>{AVAIL_META[m.availability].label}</Badge>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Substance active :</span> {m.activeSubstance} ({m.formulation})
            {m.resistanceCode && m.resistanceCode !== 'n/a' && m.resistanceCode !== '—' && (
              <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">{m.resistanceCode}</span>
            )}
          </p>

          <ul className="space-y-1 text-xs text-muted-foreground">
            <li><span className="font-medium text-foreground">Mode d’action :</span> {m.modeOfAction} — cible : {problem.name}.</li>
            <li>
              <span className="font-medium text-foreground">Application :</span> {m.applicationRate} · DAR {m.preHarvestInterval} ·
              cultures : {cropNames.join(', ')}{m.crops.length > 4 ? ` (+${m.crops.length - 4})` : ''}
            </li>
            {/* DAR countdown */}
            {darDays > 0 && harvestDate && (
              <li className="flex items-center gap-2 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 px-2 py-1.5">
                <Calendar className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span className="text-amber-800 dark:text-amber-300">
                  <strong>DAR: {darDays} jours</strong> — récolte possible à partir du <strong>{harvestDate}</strong>
                </span>
                {!treatmentSaved ? (
                  <Button size="sm" variant="outline" className="ml-auto text-[10px] h-6 gap-1" onClick={() => { onSaveTreatment(m.id, darDays); setTreatmentSaved(true); }}>
                    <Check className="h-3 w-3" /> Enregistrer
                  </Button>
                ) : (
                  <Badge variant="default" className="ml-auto text-[9px] bg-emerald-600">✓ Enregistré</Badge>
                )}
              </li>
            )}
            {scored.factors.map((f) => (
              <li key={f} className="flex items-start gap-1.5 text-emerald-700 dark:text-emerald-400">
                <Check className="mt-0.5 h-3 w-3 shrink-0" /> {f}
              </li>
            ))}
          </ul>

          {scored.warnings.length > 0 && (
            <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/40">
              {scored.warnings.map((w) => (
                <p key={w} className="flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {w}
                </p>
              ))}
            </div>
          )}

          {m.restrictions.length > 0 && (
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Restrictions</div>
              <ul className="space-y-0.5">
                {m.restrictions.map((r) => (
                  <li key={r} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" /> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {m.alternatives.length > 0 && (
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Alternatives</div>
              <div className="flex flex-wrap gap-1">
                {m.alternatives.map((a) => (
                  <Badge key={a} variant="secondary" className="px-1.5 py-0 text-[9px]">{a}</Badge>
                ))}
              </div>
            </div>
          )}

          {inpv.length > 0 && (
            <div>
              <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <BookOpen className="h-3 w-3 text-emerald-600" /> Spécialités homologuées — index INPV 2017
              </div>
              <div className="flex flex-wrap gap-1">
                {inpv.slice(0, 5).map((p) => (
                  <Badge
                    key={`${p.homologation}|${p.brand}`}
                    variant="outline"
                    className="border-emerald-300 bg-emerald-50/60 px-1.5 py-0 text-[9px] font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    title={p.usage?.[0] ?? ''}
                  >
                    {p.brand || '—'} <span className="font-mono text-emerald-600 dark:text-emerald-400">{p.homologation}</span>
                    {p.concentration && <span className="text-emerald-600/80 dark:text-emerald-400/80"> · {p.concentration}</span>}
                  </Badge>
                ))}
                {inpv.length > 5 && (
                  <Badge variant="outline" className="px-1.5 py-0 text-[9px]">+{inpv.length - 5} autres</Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
