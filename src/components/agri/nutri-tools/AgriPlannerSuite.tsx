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
import { copyFor, useTranslation } from '@/lib/language-store';

const SEVERITY_CLASSES: Record<PlantDisease['severity'], string> = {
  low: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
  moderate: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
  high: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300',
  critical: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300',
};

const CROP_LIST = [...new Set(PLANT_DISEASES.map((d) => d.crop))].sort();

function localizeSeverity(language: Parameters<typeof copyFor>[0], value: string) {
  const labels: Record<string, string> = { low: 'منخفضة', moderate: 'متوسطة', high: 'مرتفعة', critical: 'حرجة' };
  return copyFor(language, value, labels[value] || value);
}

function localizeStatus(language: Parameters<typeof copyFor>[0], value: string) {
  const labels: Record<string, string> = { unknown: 'غير مؤكد', disease: 'مرض', pest: 'آفة', nutrient: 'نقص غذائي' };
  return copyFor(language, value.replace('_', ' '), labels[value] || value.replace('_', ' '));
}

export function AgriPlannerSuite() {
  const { language } = useTranslation();
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Leaf className="h-4 w-4 text-emerald-600" /> {copyFor(language, 'AgriPlanner Suite', 'حزمة المخطط الزراعي')}
        </CardTitle>
        <CardDescription className="text-xs">
          {copyFor(language, 'Disease detection, crop recommendation, and fertilizer guidance — all-in-one AI planner.', 'كشف الأمراض وتوصيات المحاصيل وإرشادات التسميد — مخطط زراعي ذكي متكامل.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="disease" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="disease" className="text-xs"><Microscope className="h-3 w-3 mr-1" />{copyFor(language, 'Disease', 'مرض')}</TabsTrigger>
            <TabsTrigger value="crop" className="text-xs"><Brain className="h-3 w-3 mr-1" />{copyFor(language, 'Crop', 'محصول')}</TabsTrigger>
            <TabsTrigger value="fert" className="text-xs"><FlaskConical className="h-3 w-3 mr-1" />{copyFor(language, 'Fertilizer', 'سماد')}</TabsTrigger>
          </TabsList>
          <TabsContent value="disease"><DiseaseTab /></TabsContent>
          <TabsContent value="crop"><CropTab /></TabsContent>
          <TabsContent value="fert"><FertilizerTab /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface SymptomResult {
  problem_type: string;
  problem_name: string;
  problem_name_ar?: string;
  confidence: number;
  symptoms_observed: string[];
  possible_causes: string[];
  severity: string;
  recommendation: string;
  suggested_active_matters: string[];
  reviewRequired?: boolean;
}

function DiseaseTab() {
  const { language } = useTranslation();
  const [cropFilter, setCropFilter] = useState<string>('all');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [vlmResponse, setVlmResponse] = useState<SymptomResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filtered = useMemo(() => PLANT_DISEASES.filter((d) => cropFilter === 'all' || d.crop === cropFilter), [cropFilter]);

  const handleUpload = async (file: File) => {
    setError('');
    setVlmResponse(null);
    if (!file.type.startsWith('image/')) {
      setError(copyFor(language, 'Please upload a JPG, PNG, WEBP, or GIF image.', 'يرجى رفع صورة بصيغة JPG أو PNG أو WEBP أو GIF.'));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError(copyFor(language, 'Please choose an image smaller than 8 MB.', 'يرجى اختيار صورة أصغر من 8 ميغابايت.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setLoading(true);
      try {
        const res = await fetch('/api/identify-symptom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl }),
        });
        const data = await res.json();
        if (!res.ok || data.error) setError(copyFor(language, data.error || `HTTP ${res.status}`, 'تعذر إكمال تحليل الصورة.'));
        else setVlmResponse(data as SymptomResult);
      } catch (e) {
        setError(copyFor(language, e instanceof Error ? e.message : 'The AI service is temporarily unavailable.', 'خدمة الذكاء الاصطناعي غير متاحة مؤقتاً.'));
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => setError(copyFor(language, 'Failed to read the image.', 'تعذر قراءة الصورة.'));
    reader.readAsDataURL(file);
  };

  const isUnknown = vlmResponse?.problem_type === 'unknown';

  return (
    <div className="space-y-3 pt-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">{copyFor(language, 'Upload leaf / plant photo', 'رفع صورة الورقة / النبات')}</Label>
          <label htmlFor="disease-photo" className="block cursor-pointer border-2 border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors">
            {imagePreview ? <img src={imagePreview} alt={copyFor(language, 'preview', 'معاينة')} className="max-h-32 mx-auto rounded" /> : <><Upload className="h-6 w-6 mx-auto mb-1 text-emerald-600" />{copyFor(language, 'Click to upload (JPG/PNG, max 8 MB)', 'انقر للرفع (JPG/PNG، بحد أقصى 8 ميغابايت)')}</>}
          </label>
          <input id="disease-photo" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
          {loading && <div className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />{copyFor(language, 'Analyzing image…', 'جارٍ تحليل الصورة…')}</div>}
          {error && <div className="text-xs text-red-600">{error}</div>}
          {vlmResponse && !loading && (
            <div className="rounded-lg border bg-background p-3 space-y-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap"><Badge variant="outline" className="capitalize">{localizeStatus(language, vlmResponse.problem_type)}</Badge><Badge variant="outline">{copyFor(language, `${Math.round(vlmResponse.confidence * 100)}% confidence`, `${Math.round(vlmResponse.confidence * 100)}٪ ثقة`)}</Badge><Badge variant="outline" className="capitalize">{localizeSeverity(language, vlmResponse.severity)} {copyFor(language, 'severity', 'الخطورة')}</Badge></div>
              <div className="font-semibold">{vlmResponse.problem_name_ar || vlmResponse.problem_name || copyFor(language, 'Uncertain identification', 'تحديد غير مؤكد')}</div>
              {vlmResponse.symptoms_observed.length > 0 && <div><span className="font-medium">{copyFor(language, 'Observed:', 'الملاحظ:')} </span>{vlmResponse.symptoms_observed.join(' · ')}</div>}
              {vlmResponse.possible_causes.length > 0 && <div><span className="font-medium">{copyFor(language, 'Possible causes:', 'الأسباب المحتملة:')} </span>{vlmResponse.possible_causes.join(' · ')}</div>}
              <div className="rounded bg-muted/40 p-2">{vlmResponse.recommendation}</div>
              {vlmResponse.suggested_active_matters.length > 0 && <div className="text-muted-foreground"><span className="font-medium">{copyFor(language, 'Possible active matters:', 'المواد الفعالة المحتملة:')} </span>{vlmResponse.suggested_active_matters.join(' · ')}</div>}
              {vlmResponse.reviewRequired && <div className="text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 rounded p-2">{copyFor(language, 'Review this result with the original symptoms, local product label, and a qualified agronomist before acting. The model is advisory and may be wrong.', 'راجع هذه النتيجة مع الأعراض الأصلية وملصق المنتج المحلي وخبير زراعي مؤهل قبل اتخاذ أي إجراء. النموذج استشاري وقد يخطئ.')}</div>}
            </div>
          )}
          {isUnknown && <div className="text-[10px] text-amber-700 dark:text-amber-300">{copyFor(language, 'The image was not confidently identified. Browse the disease database below and capture a clearer photo with the leaf, stem, and surrounding field context.', 'لم تُحدد الصورة بدرجة ثقة كافية. تصفح قاعدة بيانات الأمراض أدناه والتقط صورة أوضح للورقة والساق وسياق الحقل المحيط.')}</div>}
        </div>
        <div>
          <Label className="text-xs">{copyFor(language, 'Filter disease database by crop', 'تصفية قاعدة الأمراض حسب المحصول')}</Label>
          <Select value={cropFilter} onValueChange={setCropFilter}>
            <SelectTrigger className="h-9 mt-1 w-full text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">{copyFor(language, `All crops (${PLANT_DISEASES.length})`, `كل المحاصيل (${PLANT_DISEASES.length})`)}</SelectItem>
              {CROP_LIST.map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border p-2 max-h-80 overflow-y-auto space-y-2">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground sticky top-0 bg-card py-1">{copyFor(language, `Disease database — ${filtered.length} entries`, `قاعدة الأمراض — ${filtered.length} سجلاً`)}</div>
        {filtered.map((d) => <div key={d.id} className="border rounded p-2 text-xs space-y-1"><div className="flex items-center justify-between gap-2"><div className="font-medium"><span className="text-emerald-700 dark:text-emerald-300">{d.crop}</span> · {d.disease_name}</div><Badge variant="outline" className={`text-[10px] ${SEVERITY_CLASSES[d.severity]}`}>{d.severity}</Badge></div><p className="text-muted-foreground text-[11px] leading-relaxed">{d.description}</p>{!d.is_healthy && <div className="text-[10px]"><span className="font-medium">{copyFor(language, 'Treatment:', 'العلاج:')} </span>{d.treatment}</div>}</div>)}
      </div>
    </div>
  );
}

function CropTab() {
  const { language } = useTranslation();
  const [v, setV] = useState({ N: '80', P: '50', K: '50', temperature: '25', humidity: '65', ph: '6.5', rainfall: '100' });
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }));

  const results = useMemo(() => recommendCrops({
    N: +v.N || 0, P: +v.P || 0, K: +v.K || 0,
    temperature: +v.temperature || 0, humidity: +v.humidity || 0, ph: +v.ph || 0, rainfall: +v.rainfall || 0,
  }, 5), [v]);

  const inputs: [keyof typeof v, string][] = [
    ['N', copyFor(language, 'N (kg/ha)', 'N (كغ/هكتار)')], ['P', copyFor(language, 'P (kg/ha)', 'P (كغ/هكتار)')], ['K', copyFor(language, 'K (kg/ha)', 'K (كغ/هكتار)')],
    ['temperature', copyFor(language, 'Temp (°C)', 'الحرارة (°م)')], ['humidity', copyFor(language, 'Humidity (%)', 'الرطوبة (%)')], ['ph', copyFor(language, 'Soil pH', 'درجة حموضة التربة')], ['rainfall', copyFor(language, 'Rainfall (mm)', 'الأمطار (مم)')],
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
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Top 5 crop recommendations', 'أفضل 5 توصيات للمحاصيل')}</div>
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
  const { language } = useTranslation();
  const [soilType, setSoilType] = useState('Loamy');
  const [cropType, setCropType] = useState('Cereal');
  const [vals, setVals] = useState({ N: '40', P: '30', K: '60', moisture: '45' });
  const setVal = (k: keyof typeof vals) => (e: { target: { value: string } }) =>
    setVals((v) => ({ ...v, [k]: e.target.value }));

  const rec = useMemo(() => recommendFertilizer({
    soilType, cropType, N: +vals.N || 0, P: +vals.P || 0, K: +vals.K || 0, moisture: +vals.moisture || 0,
  }), [soilType, cropType, vals]);

  const numInputs: [keyof typeof vals, string][] = [['N', copyFor(language, 'N (kg/ha)', 'N (كغ/هكتار)')], ['P', copyFor(language, 'P (kg/ha)', 'P (كغ/هكتار)')], ['K', copyFor(language, 'K (kg/ha)', 'K (كغ/هكتار)')], ['moisture', copyFor(language, 'Moisture (%)', 'الرطوبة (%)')]];

  return (
    <div className="space-y-3 pt-2">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <div>
          <Label className="text-[10px]">{copyFor(language, 'Soil type', 'نوع التربة')}</Label>
          <Select value={soilType} onValueChange={setSoilType}>
            <SelectTrigger className="h-8 mt-1 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['Sandy', 'Loamy', 'Clay', 'Peaty', 'Saline'].map((s) => <SelectItem key={s} value={s} className="text-xs">{copyFor(language, s, ({ Sandy: 'رملية', Loamy: 'طميية', Clay: 'طينية', Peaty: 'خثية', Saline: 'ملحية' } as Record<string, string>)[s])}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px]">{copyFor(language, 'Crop type', 'نوع المحصول')}</Label>
          <Select value={cropType} onValueChange={setCropType}>
            <SelectTrigger className="h-8 mt-1 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['Cereal', 'Vegetable', 'Fruit', 'Legume', 'Root', 'Oilseed'].map((c) => <SelectItem key={c} value={c} className="text-xs">{copyFor(language, c, ({ Cereal: 'حبوب', Vegetable: 'خضروات', Fruit: 'فاكهة', Legume: 'بقوليات', Root: 'جذور', Oilseed: 'محاصيل زيتية' } as Record<string, string>)[c])}</SelectItem>)}
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
        <div className="text-xs mt-2"><span className="font-medium text-emerald-700 dark:text-emerald-300">{copyFor(language, 'Application:', 'التطبيق:')} </span>{rec.applicationRate}</div>
        <p className="text-[10px] text-muted-foreground mt-1 italic">{rec.notes}</p>
      </div>
    </div>
  );
}
