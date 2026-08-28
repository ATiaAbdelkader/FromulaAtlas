'use client';

/**
 * Disease Encyclopedia — browse diseases by crop or search by symptom.
 * Adapted from AgroAI's disease_kb.json structure.
 *
 * Shows: disease name, crop, type (Fungal/Bacterial/etc.), symptoms list,
 * chemical treatment (medicine + dose + frequency), organic treatment,
 * precautions, and matching INPV-registered active substances.
 *
 * Trilingual (EN/FR/AR).
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Beaker, Leaf, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTranslation, copyFor } from '@/lib/language-store';
import { DISEASE_KB, getDiseaseKBCrops, type DiseaseEntry } from '@/lib/disease-kb';

const TYPE_STYLES: Record<string, { color: string; bg: string; emoji: string }> = {
  'Fungal': { color: '#dc2626', bg: '#fee2e2', emoji: '🦠' },
  'Bacterial': { color: '#ea580c', bg: '#ffedd5', emoji: '🟠' },
  'Viral': { color: '#7c3aed', bg: '#ede9fe', emoji: '🧬' },
  'Insect Pest': { color: '#b45309', bg: '#fef3c7', emoji: '🐛' },
  'Healthy': { color: '#16a34a', bg: '#dcfce7', emoji: '✅' },
  'Physiological': { color: '#0891b2', bg: '#cffafe', emoji: '🌡️' },
};

export function DiseaseEncyclopedia() {
  const { language, isRTL } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);

  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const crops = useMemo(() => getDiseaseKBCrops(), []);

  const filtered = useMemo(() => {
    let result = DISEASE_KB.filter(d => d.regional);
    if (selectedCrop) {
      result = result.filter(d => d.crop === selectedCrop);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(d =>
        d.symptoms.some(s => s.toLowerCase().includes(q)) ||
        d.crop.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q)
      );
    }
    return result;
  }, [query, selectedCrop]);

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Search + crop filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr('Search by symptom, crop, or disease…', 'ابحث بالعَرَض أو المحصول أو المرض…', 'Rechercher par symptôme, culture ou maladie…')}
            className="h-10 ps-9 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedCrop(null)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${!selectedCrop ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-card border-border hover:border-emerald-400'}`}
          >
            {tr('All crops', 'كل المحاصيل', 'Toutes les cultures')}
          </button>
          {crops.map(crop => (
            <button
              key={crop}
              onClick={() => setSelectedCrop(selectedCrop === crop ? null : crop)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${selectedCrop === crop ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-card border-border hover:border-emerald-400'}`}
            >
              {crop}
            </button>
          ))}
        </div>
      </div>

      <Badge variant="secondary" className="text-[10px]">
        {filtered.length} {tr('diseases', 'أمراض', 'maladies')}
      </Badge>

      {/* Disease cards */}
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map(disease => (
          <DiseaseCard key={disease.id} disease={disease} language={language} />
        ))}
      </div>

      {filtered.length === 0 && (
        <Card><CardContent className="py-8 text-center text-xs text-muted-foreground">
          {tr('No diseases match your search.', 'لا توجد أمراض مطابقة.', 'Aucune maladie ne correspond.')}
        </CardContent></Card>
      )}
    </div>
  );
}

function DiseaseCard({ disease, language }: { disease: DiseaseEntry; language: 'en' | 'fr' | 'ar' }) {
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const style = TYPE_STYLES[disease.type] ?? TYPE_STYLES['Fungal'];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <span>{style.emoji}</span>
              {disease.id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </CardTitle>
            <div className="text-[11px] text-muted-foreground mt-0.5">{disease.crop} · {disease.cropAr}</div>
          </div>
          <Badge variant="outline" className="text-[9px] shrink-0" style={{ color: style.color, borderColor: style.color }}>
            {disease.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {/* Symptoms */}
        <div>
          <div className="font-semibold text-muted-foreground mb-1 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {tr('Symptoms', 'الأعراض', 'Symptômes')}
          </div>
          <ul className="space-y-0.5">
            {disease.symptoms.map((s, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-amber-600">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Chemical treatment */}
        <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 p-2">
          <div className="font-semibold text-red-700 dark:text-red-400 mb-1 flex items-center gap-1">
            <Beaker className="h-3 w-3" />
            {tr('Chemical Treatment', 'العلاج الكيميائي', 'Traitement chimique')}
          </div>
          <div className="text-[11px]">
            <div><strong>{disease.chemical_treatment.medicine}</strong></div>
            <div className="text-muted-foreground">{tr('Dose', 'الجرعة', 'Dose')}: {disease.chemical_treatment.dosage}</div>
            {disease.chemical_treatment.frequency && (
              <div className="text-muted-foreground">{tr('Frequency', 'التكرار', 'Fréquence')}: {disease.chemical_treatment.frequency}</div>
            )}
          </div>
        </div>

        {/* Organic treatment */}
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 p-2">
          <div className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1">
            <Leaf className="h-3 w-3" />
            {tr('Organic Treatment', 'العلاج العضوي', 'Traitement biologique')}
          </div>
          <div className="text-[11px]">
            <div><strong>{disease.organic_treatment.medicine}</strong></div>
            <div className="text-muted-foreground">{tr('Dose', 'الجرعة', 'Dose')}: {disease.organic_treatment.dosage}</div>
          </div>
        </div>

        {/* Precautions */}
        <div>
          <div className="font-semibold text-muted-foreground mb-1 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            {tr('Precautions', 'الاحتياطات', 'Précautions')}
          </div>
          <ul className="space-y-0.5">
            {disease.precautions.map((p, i) => (
              <li key={i} className="flex gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* INPV active substances */}
        {disease.inpvActives && disease.inpvActives.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1 border-t border-border/40">
            <span className="text-[10px] text-muted-foreground">{tr('INPV actives', 'INPV المواد الفعالة', 'Matières actives INPV')}:</span>
            {disease.inpvActives.map(a => (
              <Badge key={a} variant="outline" className="text-[9px] font-mono">{a}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
