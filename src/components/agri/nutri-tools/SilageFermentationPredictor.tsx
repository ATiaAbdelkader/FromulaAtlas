'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Beef, CheckCircle2, AlertTriangle } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';

const SILAGE_CROP_AR: Record<string, string> = { corn: 'سيلاج الذرة', alfalfa: 'البرسيم الحجازي', grass: 'الأعشاب', sorghum: 'سورغم-سودان' };

export function SilageFermentationPredictor() {
  const { language } = useTranslation();
  const [crop, setCrop] = useState('corn');
  const [moisture, setMoisture] = useState('65');
  const [sugar, setSugar] = useState('3.5');
  const [packingDensity, setPackingDensity] = useState('240');
  const [ chopLength, setChopLength] = useState('19');

  const result = useMemo(() => {
    const M = parseFloat(moisture), S = parseFloat(sugar), PD = parseFloat(packingDensity), CL = parseFloat(chopLength);
    if (!Number.isFinite(M)) return null;

    let score = 0;
    // Moisture: ideal 60-70%
    score += M >= 60 && M <= 70 ? 30 : M >= 55 && M <= 75 ? 15 : 0;
    // Sugar: >3% needed for fermentation
    score += S >= 4 ? 25 : S >= 3 ? 18 : S >= 2 ? 8 : 0;
    // Packing density: >240 kg/m³ DM
    score += PD >= 240 ? 25 : PD >= 200 ? 15 : PD >= 160 ? 8 : 0;
    // Chop length: 10-25 mm ideal
    score += CL >= 10 && CL <= 25 ? 20 : CL >= 5 && CL <= 35 ? 10 : 0;

    let quality: string, color: string, advice: string;
    if (score >= 85) { quality = 'Excellent'; color = '#10b981'; advice = 'Optimal fermentation expected. pH will drop to 3.8-4.0 within 3 weeks. Stable storage 6+ months.'; }
    else if (score >= 65) { quality = 'Good'; color = '#84cc16'; advice = 'Adequate fermentation. Monitor pH — target <4.2. Seal bunker immediately after filling.'; }
    else if (score >= 40) { quality = 'Fair'; color = '#eab308'; advice = 'Risk of poor fermentation. Consider inoculant (Lactobacillus). Check moisture + packing.'; }
    else { quality = 'Poor'; color = '#dc2626'; advice = 'High risk of spoilage. Adjust moisture/sugar/packing before ensiling. Clostridial risk if too wet.'; }

    const cropInfo: Record<string, { idealM: string; idealS: string }> = {
      corn: { idealM: '63-68%', idealS: '3-5%' },
      alfalfa: { idealM: '55-65%', idealS: '4-6%' },
      grass: { idealM: '55-65%', idealS: '3-5%' },
      sorghum: { idealM: '60-70%', idealS: '2-4%' },
    };

    return { score, quality, color, advice, cropInfo: cropInfo[crop] };
  }, [crop, moisture, sugar, packingDensity, chopLength]);

  return (
    <Card className="overflow-hidden border-lime-100 shadow-sm dark:border-lime-900/60">
      <CardHeader className="border-b border-border/60 bg-lime-50/50 pb-4 dark:bg-lime-950/10">
        <CardTitle className="flex items-center gap-2 text-base"><span className="rounded-lg bg-lime-100 p-2 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300"><Beef className="h-4 w-4" /></span> {copyFor(language, 'Silage Fermentation Predictor', 'متنبئ تخمير السيلاج')}</CardTitle>
        <p className="text-[10px] text-muted-foreground">{copyFor(language, 'Moisture · sugar · packing density · chop length → fermentation quality score', 'الرطوبة · السكر · كثافة الكبس · طول التقطيع ← درجة جودة التخمير')}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-xl border border-lime-200/70 bg-lime-50/30 p-3 dark:border-lime-900/60 dark:bg-lime-950/10">
          <Label className="text-xs font-medium">{copyFor(language, 'Crop', 'المحصول')}</Label>
          <select aria-label={copyFor(language, 'Silage crop', 'محصول السيلاج')} value={crop} onChange={e => setCrop(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="corn">{copyFor(language, 'Corn silage', 'سيلاج الذرة')} 🌽</option>
            <option value="alfalfa">{copyFor(language, 'Alfalfa', 'البرسيم الحجازي')} 🌿</option>
            <option value="grass">{copyFor(language, 'Grass', 'الأعشاب')} 🌾</option>
            <option value="sorghum">{copyFor(language, 'Sorghum-Sudan', 'سورغم-سودان')} 🌾</option>
          </select>
        </div>
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Moisture (%)', 'الرطوبة (%)')}</Label>
            <Input aria-label={copyFor(language, 'Silage moisture percentage', 'نسبة رطوبة السيلاج')} value={moisture} onChange={e => setMoisture(e.target.value)} type="number" step="1" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Water-soluble sugar (%)', 'السكر القابل للذوبان في الماء (%)')}</Label>
            <Input aria-label={copyFor(language, 'Water soluble sugar percentage', 'نسبة السكر القابل للذوبان في الماء')} value={sugar} onChange={e => setSugar(e.target.value)} type="number" step="0.1" className="mt-1 h-10 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Packing density (kg DM/m³)', 'كثافة الكبس (كغ مادة جافة/م³)')}</Label>
            <Input aria-label={copyFor(language, 'Packing density', 'كثافة الكبس')} value={packingDensity} onChange={e => setPackingDensity(e.target.value)} type="number" step="10" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Chop length (mm)', 'طول التقطيع (مم)')}</Label>
            <Input aria-label={copyFor(language, 'Chop length', 'طول التقطيع')} value={chopLength} onChange={e => setChopLength(e.target.value)} type="number" step="1" className="mt-1 h-10 text-sm" />
          </div>
        </div>
        {result && (
          <div className="space-y-2">
            <div className="rounded-xl border p-4 text-center shadow-sm" style={{ borderColor: result.color + '60', backgroundColor: result.color + '15' }}>
              <div className="text-[10px] text-muted-foreground uppercase">{copyFor(language, 'Fermentation Quality', 'جودة التخمير')}</div>
              <div className="text-2xl font-bold" style={{ color: result.color }}>{copyFor(language, result.quality, result.quality === 'Excellent' ? 'ممتاز' : result.quality === 'Good' ? 'جيد' : result.quality === 'Fair' ? 'مقبول' : 'ضعيف')}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{copyFor(language, `Score: ${result.score}/100`, `الدرجة: ${result.score}/100`)}</div>
            </div>
            <div className="flex items-start gap-2 rounded-xl border p-3 text-xs leading-relaxed" style={{ borderColor: result.color + '40', color: result.color }}>
              {result.score >= 65 ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
              <span>{copyFor(language, result.advice, result.advice.startsWith('Optimal') ? 'التخمير الأمثل متوقع. ستنخفض درجة الحموضة إلى 3.8–4.0 خلال 3 أسابيع. تخزين مستقر لمدة 6 أشهر أو أكثر.' : result.advice.startsWith('Adequate') ? 'تخمير كافٍ. راقب درجة الحموضة — الهدف أقل من 4.2. أغلق الخندق فوراً بعد الملء.' : result.advice.startsWith('Risk') ? 'خطر حدوث تخمير ضعيف. فكّر في استخدام لقاح (Lactobacillus). تحقق من الرطوبة والكبس.' : 'خطر مرتفع للتلف. اضبط الرطوبة والسكر والكبس قبل التخزين في صورة سيلاج. يوجد خطر كلوستريديوم إذا كانت الرطوبة مرتفعة جداً.')}</span>
            </div>
            {result.cropInfo && (
              <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                💡 {copyFor(language, `${crop} ideal: moisture ${result.cropInfo.idealM}, sugar ${result.cropInfo.idealS}. Use homofermentative inoculant (L. plantarum) for low-sugar crops. Pack to ≥240 kg DM/m³.`, `القيم المثلى لـ${SILAGE_CROP_AR[crop] || crop}: الرطوبة ${result.cropInfo.idealM}، السكر ${result.cropInfo.idealS}. استخدم لقاحاً متجانس التخمر (L. plantarum) للمحاصيل منخفضة السكر. اكبس إلى ≥240 كغ مادة جافة/م³.`)}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
