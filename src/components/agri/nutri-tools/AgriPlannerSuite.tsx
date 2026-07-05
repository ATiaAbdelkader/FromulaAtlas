'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Microscope, Brain, FlaskConical, Upload, Leaf, Loader2 } from 'lucide-react';
import {
  PLANT_DISEASES,
  recommendCrops,
  recommendFertilizer,
  type PlantDisease,
} from '@/lib/plant-disease-data';

const SEVERITY_CLASSES: Record<PlantDisease['severity'], string> = {
  low: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
  moderate: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
  high: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300',
  critical: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300',
};

const CROP_LIST = [...new Set(PLANT_DISEASES.map((d) => d.crop))].sort();

export function AgriPlannerSuite() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Leaf className="h-4 w-4 text-emerald-600" /> AgriPlanner Suite
        </CardTitle>
        <CardDescription className="text-xs">
          Disease detection, crop recommendation, and fertilizer guidance — all-in-one AI planner.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="disease" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="disease" className="text-xs"><Microscope className="h-3 w-3 mr-1" />Disease</TabsTrigger>
            <TabsTrigger value="crop" className="text-xs"><Brain className="h-3 w-3 mr-1" />Crop</TabsTrigger>
            <TabsTrigger value="fert" className="text-xs"><FlaskConical className="h-3 w-3 mr-1" />Fertilizer</TabsTrigger>
          </TabsList>
          <TabsContent value="disease"><DiseaseTab /></TabsContent>
          <TabsContent value="crop"><CropTab /></TabsContent>
          <TabsContent value="fert"><FertilizerTab /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function DiseaseTab() {
  const [cropFilter, setCropFilter] = useState<string>('all');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [vlmResponse, setVlmResponse] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filtered = useMemo(() => PLANT_DISEASES.filter((d) => cropFilter === 'all' || d.crop === cropFilter), [cropFilter]);

  const handleUpload = async (file: File) => {
    setError('');
    setVlmResponse(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setLoading(true);
      try {
        const res = await fetch('/api/parse-lab-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl }),
        });
        const data = await res.json();
        if (!res.ok || data.error) setError(data.error || `HTTP ${res.status}`);
        else setVlmResponse(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Network error');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const isUnknown = vlmResponse && (vlmResponse as { type?: string }).type === 'unknown';

  return (
    <div className="space-y-3 pt-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Upload leaf / plant photo</Label>
          <label htmlFor="disease-photo" className="block cursor-pointer border-2 border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors">
            {imagePreview ? (
              <img src={imagePreview} alt="preview" className="max-h-32 mx-auto rounded" />
            ) : (
              <><Upload className="h-6 w-6 mx-auto mb-1 text-emerald-600" />Click to upload (JPG/PNG)</>
            )}
          </label>
          <input id="disease-photo" type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
          {loading && <div className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Analyzing with VLM…</div>}
          {error && <div className="text-xs text-red-600">{error}</div>}
          {vlmResponse && (
            <div className="text-[10px] font-mono bg-muted p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap">
              {JSON.stringify(vlmResponse, null, 2)}
            </div>
          )}
          {isUnknown && (
            <div className="text-[10px] text-amber-700 dark:text-amber-300">
              VLM didn't detect a soil/water/lab pattern. Browse the disease database below to identify by symptoms.
            </div>
          )}
        </div>
        <div>
          <Label className="text-xs">Filter disease database by crop</Label>
          <Select value={cropFilter} onValueChange={setCropFilter}>
            <SelectTrigger className="h-9 mt-1 w-full text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All crops ({PLANT_DISEASES.length})</SelectItem>
              {CROP_LIST.map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border p-2 max-h-80 overflow-y-auto space-y-2">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground sticky top-0 bg-card py-1">
          Disease database — {filtered.length} entries
        </div>
        {filtered.map((d) => (
          <div key={d.id} className="border rounded p-2 text-xs space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium">
                <span className="text-emerald-700 dark:text-emerald-300">{d.crop}</span> · {d.disease_name}
              </div>
              <Badge variant="outline" className={`text-[10px] ${SEVERITY_CLASSES[d.severity]}`}>{d.severity}</Badge>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">{d.description}</p>
            {!d.is_healthy && (
              <div className="text-[10px]"><span className="font-medium">Treatment: </span>{d.treatment}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CropTab() {
  const [v, setV] = useState({ N: '80', P: '50', K: '50', temperature: '25', humidity: '65', ph: '6.5', rainfall: '100' });
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }));

  const results = useMemo(() => recommendCrops({
    N: +v.N || 0, P: +v.P || 0, K: +v.K || 0,
    temperature: +v.temperature || 0, humidity: +v.humidity || 0, ph: +v.ph || 0, rainfall: +v.rainfall || 0,
  }, 5), [v]);

  const inputs: [keyof typeof v, string][] = [
    ['N', 'N (kg/ha)'], ['P', 'P (kg/ha)'], ['K', 'K (kg/ha)'],
    ['temperature', 'Temp (°C)'], ['humidity', 'Humidity (%)'], ['ph', 'Soil pH'], ['rainfall', 'Rainfall (mm)'],
  ];

  const maxConf = Math.max(...results.map((r) => r.confidence), 1);

  return (
    <div className="space-y-3 pt-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {inputs.map(([key, label]) => (
          <div key={key}>
            <Label className="text-[10px]">{label}</Label>
            <Input type="number" value={v[key]} onChange={set(key)} className="h-8 mt-1 text-xs" />
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Top 5 crop recommendations</div>
        {results.map((r, i) => (
          <div key={r.crop} className="flex items-center gap-2 text-xs">
            <div className="w-5 text-muted-foreground">#{i + 1}</div>
            <div className="w-24 font-medium capitalize">{r.crop}</div>
            <div className="flex-1 bg-muted rounded h-4 overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${(r.confidence / maxConf) * 100}%` }} />
            </div>
            <div className="w-12 text-right tabular-nums font-medium">{r.confidence}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FertilizerTab() {
  const [soilType, setSoilType] = useState('Loamy');
  const [cropType, setCropType] = useState('Cereal');
  const [vals, setVals] = useState({ N: '40', P: '30', K: '60', moisture: '45' });
  const setVal = (k: keyof typeof vals) => (e: { target: { value: string } }) =>
    setVals((v) => ({ ...v, [k]: e.target.value }));

  const rec = useMemo(() => recommendFertilizer({
    soilType, cropType, N: +vals.N || 0, P: +vals.P || 0, K: +vals.K || 0, moisture: +vals.moisture || 0,
  }), [soilType, cropType, vals]);

  const numInputs: [keyof typeof vals, string][] = [['N', 'N (kg/ha)'], ['P', 'P (kg/ha)'], ['K', 'K (kg/ha)'], ['moisture', 'Moisture (%)']];

  return (
    <div className="space-y-3 pt-2">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <div>
          <Label className="text-[10px]">Soil type</Label>
          <Select value={soilType} onValueChange={setSoilType}>
            <SelectTrigger className="h-8 mt-1 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['Sandy', 'Loamy', 'Clay', 'Peaty', 'Saline'].map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px]">Crop type</Label>
          <Select value={cropType} onValueChange={setCropType}>
            <SelectTrigger className="h-8 mt-1 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['Cereal', 'Vegetable', 'Fruit', 'Legume', 'Root', 'Oilseed'].map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {numInputs.map(([key, label]) => (
          <div key={key}>
            <Label className="text-[10px]">{label}</Label>
            <Input type="number" value={vals[key]} onChange={setVal(key)} className="h-8 mt-1 text-xs" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border p-3 bg-emerald-50/30 dark:bg-emerald-950/20">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-base font-bold text-emerald-700 dark:text-emerald-300">{rec.name}</div>
          <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 dark:text-emerald-300">NPK {rec.npk.join('-')}</Badge>
        </div>
        <p className="text-xs mt-1 text-muted-foreground">{rec.reason}</p>
        <div className="text-xs mt-2"><span className="font-medium text-emerald-700 dark:text-emerald-300">Application: </span>{rec.applicationRate}</div>
        <p className="text-[10px] text-muted-foreground mt-1 italic">{rec.notes}</p>
      </div>
    </div>
  );
}
