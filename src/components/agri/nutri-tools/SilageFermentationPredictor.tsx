'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Beef, CheckCircle2, AlertTriangle } from 'lucide-react';

export function SilageFermentationPredictor() {
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Beef className="h-4 w-4 text-amber-600" /> Silage Fermentation Predictor
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">Moisture · sugar · packing density · chop length → fermentation quality score</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-[10px]">Crop</Label>
          <select value={crop} onChange={e => setCrop(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5">
            <option value="corn">Corn silage 🌽</option>
            <option value="alfalfa">Alfalfa 🌿</option>
            <option value="grass">Grass 🌾</option>
            <option value="sorghum">Sorghum-Sudan 🌾</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Moisture (%)</Label>
            <Input value={moisture} onChange={e => setMoisture(e.target.value)} type="number" step="1" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Water-soluble sugar (%)</Label>
            <Input value={sugar} onChange={e => setSugar(e.target.value)} type="number" step="0.1" className="h-8 text-xs mt-0.5" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Packing density (kg DM/m³)</Label>
            <Input value={packingDensity} onChange={e => setPackingDensity(e.target.value)} type="number" step="10" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Chop length (mm)</Label>
            <Input value={chopLength} onChange={e => setChopLength(e.target.value)} type="number" step="1" className="h-8 text-xs mt-0.5" />
          </div>
        </div>
        {result && (
          <div className="space-y-2">
            <div className="rounded-lg border p-4 text-center" style={{ borderColor: result.color + '60', backgroundColor: result.color + '15' }}>
              <div className="text-[10px] text-muted-foreground uppercase">Fermentation Quality</div>
              <div className="text-2xl font-bold" style={{ color: result.color }}>{result.quality}</div>
              <div className="text-[10px] text-muted-foreground mt-1">Score: {result.score}/100</div>
            </div>
            <div className="rounded-md border p-2 text-xs flex items-start gap-1.5" style={{ borderColor: result.color + '40', color: result.color }}>
              {result.score >= 65 ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
              <span>{result.advice}</span>
            </div>
            {result.cropInfo && (
              <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
                💡 {crop} ideal: moisture {result.cropInfo.idealM}, sugar {result.cropInfo.idealS}. Use homofermentative inoculant (L. plantarum) for low-sugar crops. Pack to ≥240 kg DM/m³.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
