'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Microscope, Search, ExternalLink, AlertTriangle, CheckCircle2,
  BookOpen, Leaf, Bug,
} from 'lucide-react';
import {
  DISEASE_REFS, RESEARCH_DATASETS,
  type DiseaseRef, type ResearchDataset,
} from '@/lib/disease-ref-data';

const TYPE_META: Record<string, { label: string; emoji: string; color: string }> = {
  fungal: { label: 'Fungal', emoji: '🦠', color: '#dc2626' },
  bacterial: { label: 'Bacterial', emoji: '🟠', color: '#f97316' },
  viral: { label: 'Viral', emoji: '🟣', color: '#8b5cf6' },
  pest: { label: 'Pest', emoji: '🐛', color: '#eab308' },
  nutrient: { label: 'Nutrient', emoji: '🟡', color: '#f59e0b' },
  weed: { label: 'Weed', emoji: '🌿', color: '#84cc16' },
};

const SEVERITY_META: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: '#10b981' },
  medium: { label: 'Medium', color: '#f59e0b' },
  high: { label: 'High', color: '#dc2626' },
};

const DATASET_CATEGORIES: { id: ResearchDataset['category']; label: string; emoji: string }[] = [
  { id: 'classification', label: 'Image Classification', emoji: '🏷️' },
  { id: 'segmentation', label: 'Semantic Segmentation', emoji: '✂️' },
  { id: 'detection', label: 'Object Detection', emoji: '🎯' },
  { id: 'instance_seg', label: 'Instance Segmentation', emoji: '🔬' },
  { id: 'hyperspectral', label: 'Hyperspectral / Multispectral', emoji: '🌈' },
  { id: 'robotics', label: 'Robotics & Navigation', emoji: '🤖' },
  { id: 'large_scale', label: 'Large-Scale', emoji: '📦' },
  { id: 'collectors', label: 'Dataset Collectors', emoji: '📚' },
  { id: 'tools', label: 'Synthetic Data Tools', emoji: '🛠️' },
];

type Tab = 'gallery' | 'datasets';

export function DiseaseReferenceGallery() {
  const [tab, setTab] = useState<Tab>('gallery');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Microscope className="h-4 w-4 text-violet-600" /> Disease &amp; Weed Reference Gallery
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">Curated from PlantVillage (50K images) · PlantDoc · DeepWeeds · 35+ research datasets</p>
        <div className="flex gap-1 mt-2">
          <button onClick={() => setTab('gallery')} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === 'gallery' ? 'bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300' : 'text-muted-foreground hover:bg-muted/50'}`}>
            <Bug className="h-3.5 w-3.5" /> Gallery ({DISEASE_REFS.length})
          </button>
          <button onClick={() => setTab('datasets')} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === 'datasets' ? 'bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300' : 'text-muted-foreground hover:bg-muted/50'}`}>
            <BookOpen className="h-3.5 w-3.5" /> Datasets ({RESEARCH_DATASETS.length})
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {tab === 'gallery' && <GalleryTab />}
        {tab === 'datasets' && <DatasetsTab />}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Gallery Tab
// ============================================================================

function GalleryTab() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [cropFilter, setCropFilter] = useState<string>('all');

  const crops = useMemo(() => {
    const set = new Set(DISEASE_REFS.map(d => d.crop));
    return ['all', ...Array.from(set).sort()];
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return DISEASE_REFS.filter(d => {
      if (typeFilter !== 'all' && d.type !== typeFilter) return false;
      if (cropFilter !== 'all' && d.crop !== cropFilter) return false;
      if (q) {
        const hay = `${d.crop} ${d.disease} ${d.diseaseAr ?? ''} ${d.symptoms} ${d.visualDescription}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [search, typeFilter, cropFilter]);

  return (
    <div className="space-y-3">
      {/* Search + filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search disease, symptom, weed…" className="pl-8 text-xs h-8" />
        </div>
        <select value={cropFilter} onChange={e => setCropFilter(e.target.value)} className="h-8 text-xs rounded-md border border-input bg-background px-2">
          {crops.map(c => <option key={c} value={c}>{c === 'all' ? 'All crops' : c}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-8 text-xs rounded-md border border-input bg-background px-2">
          <option value="all">All types</option>
          {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
        </select>
      </div>

      {/* Results count */}
      <div className="text-[10px] text-muted-foreground">{filtered.length} reference{filtered.length !== 1 ? 's' : ''} found</div>

      {/* Gallery cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto">
        {filtered.map(d => <GalleryCard key={d.id} ref={d} />)}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-xs text-muted-foreground">
          <Microscope className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          No references found. Try a different search.
        </div>
      )}

      <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
        💡 Reference photos from PlantVillage (50K images), PlantDoc (2.5K), and DeepWeeds (17.5K). Click "View photos" to browse the original dataset.
      </div>
    </div>
  );
}

function GalleryCard({ ref: d }: { ref: DiseaseRef }) {
  const typeMeta = TYPE_META[d.type];
  const sevMeta = SEVERITY_META[d.severity];

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-2">
        <div className="text-2xl shrink-0">{d.cropEmoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold leading-tight">{d.disease}</span>
            {d.diseaseAr && <span className="text-[10px] text-muted-foreground" dir="rtl">{d.diseaseAr}</span>}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{d.crop}</div>
        </div>
        <Badge className="text-[9px] shrink-0" style={{ backgroundColor: typeMeta.color + '20', color: typeMeta.color }}>
          {typeMeta.emoji} {typeMeta.label}
        </Badge>
      </div>

      <div className="text-[10px] text-muted-foreground">
        <strong className="text-foreground/80">Symptoms:</strong> {d.symptoms}
      </div>
      <div className="text-[10px] text-muted-foreground italic">
        <strong className="text-foreground/80 not-italic">Visual:</strong> {d.visualDescription}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[9px]" style={{ borderColor: sevMeta.color, color: sevMeta.color }}>
            {sevMeta.label} severity
          </Badge>
          <span className="text-[9px] text-muted-foreground">{d.imageCount.toLocaleString()} images</span>
        </div>
        <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline">
          View photos <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    </div>
  );
}

// ============================================================================
// Datasets Tab
// ============================================================================

function DatasetsTab() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return RESEARCH_DATASETS.filter(d => {
      if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
      if (q) {
        const hay = `${d.name} ${d.description} ${d.modalities} ${d.size}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [search, categoryFilter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search datasets by name, description, modality…" className="pl-8 text-xs h-8" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="h-8 text-xs rounded-md border border-input bg-background px-2">
          <option value="all">All categories</option>
          {DATASET_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
        </select>
      </div>

      <div className="text-[10px] text-muted-foreground">{filtered.length} dataset{filtered.length !== 1 ? 's' : ''}</div>

      <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
        {filtered.map(d => <DatasetCard key={d.id} dataset={d} />)}
      </div>

      <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
        💡 These datasets can train ML models for weed detection, disease identification, fruit counting, and robotic navigation. Use AgML (Python framework) for standardized access.
      </div>
    </div>
  );
}

function DatasetCard({ dataset: d }: { dataset: ResearchDataset }) {
  const cat = DATASET_CATEGORIES.find(c => c.id === d.category);
  return (
    <div className="rounded-md border bg-card p-2.5 flex items-start gap-2.5 hover:shadow-sm transition-shadow">
      <div className="text-lg shrink-0">{cat?.emoji ?? '📊'}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold">{d.name}</span>
          <Badge variant="outline" className="text-[9px]">{cat?.label}</Badge>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{d.description}</p>
        <div className="flex items-center gap-3 mt-1 text-[9px] text-muted-foreground">
          <span>📊 {d.size}</span>
          <span>📡 {d.modalities}</span>
        </div>
      </div>
      <a href={d.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-blue-600 hover:text-blue-800">
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
