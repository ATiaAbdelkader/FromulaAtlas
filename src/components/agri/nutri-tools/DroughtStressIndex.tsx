'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Flame, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function DroughtStressIndex() {
  const [et0, setEt0] = useState('5.0');
  const [rain, setRain] = useState('2.0');
  const [soilWater, setSoilWater] = useState('60');
  const [taw, setTaw] = useState('120');
  const [stage, setStage] = useState('flowering');

  const result = useMemo(() => {
    const ET0 = parseFloat(et0), R = parseFloat(rain), SW = parseFloat(soilWater), TAW = parseFloat(taw);
    if (!Number.isFinite(ET0) || !Number.isFinite(TAW) || TAW <= 0) return null;

    const deficit = Math.max(0, ET0 - R * 0.8); // net water deficit mm/day
    const depletionPct = ((TAW - SW) / TAW) * 100;
    const stageFactor: Record<string, number> = { establishment: 0.5, vegetative: 0.7, flowering: 1.0, filling: 0.9, maturation: 0.5 };
    const sf = stageFactor[stage] ?? 0.7;
    const dsi = (deficit / ET0) * 0.4 + (depletionPct / 100) * 0.4 + sf * 0.2;
    const dsiScore = Math.min(100, dsi * 100);

    let level: string, color: string, advice: string;
    if (dsiScore < 25) { level = 'None'; color = '#10b981'; advice = 'No drought stress. Crop water needs are being met.'; }
    else if (dsiScore < 50) { level = 'Mild'; color = '#eab308'; advice = 'Mild stress. Monitor soil moisture. Consider light irrigation.'; }
    else if (dsiScore < 75) { level = 'Moderate'; color = '#f97316'; advice = 'Moderate stress. Irrigate within 2-3 days to prevent yield loss.'; }
    else { level = 'Severe'; color = '#dc2626'; advice = 'Severe stress! Irrigate immediately. Yield loss likely at this stage.'; }

    return { dsiScore, level, color, advice, deficit, depletionPct };
  }, [et0, rain, soilWater, taw, stage]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-600" /> Drought Stress Index
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">Combines ET₀ deficit + soil water depletion + crop stage sensitivity</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">ET₀ today (mm/day)</Label>
            <Input value={et0} onChange={e => setEt0(e.target.value)} type="number" step="0.1" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Rain today (mm)</Label>
            <Input value={rain} onChange={e => setRain(e.target.value)} type="number" step="0.1" className="h-8 text-xs mt-0.5" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-[10px]">Soil water (mm)</Label>
            <Input value={soilWater} onChange={e => setSoilWater(e.target.value)} type="number" step="5" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">TAW (mm)</Label>
            <Input value={taw} onChange={e => setTaw(e.target.value)} type="number" step="10" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Growth stage</Label>
            <select value={stage} onChange={e => setStage(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-1.5 mt-0.5">
              <option value="establishment">Establishment</option>
              <option value="vegetative">Vegetative</option>
              <option value="flowering">Flowering</option>
              <option value="filling">Grain fill</option>
              <option value="maturation">Maturation</option>
            </select>
          </div>
        </div>
        {result && (
          <div className="space-y-2">
            <div className="rounded-lg border p-4 text-center" style={{ borderColor: result.color + '60', backgroundColor: result.color + '15' }}>
              <div className="text-[10px] text-muted-foreground uppercase">Drought Stress Index</div>
              <div className="text-3xl font-bold font-mono" style={{ color: result.color }}>{result.dsiScore.toFixed(0)}<span className="text-sm">/100</span></div>
              <div className="text-sm font-semibold" style={{ color: result.color }}>{result.level}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border p-2"><span className="text-muted-foreground">Water deficit:</span> <strong>{result.deficit.toFixed(1)} mm/day</strong></div>
              <div className="rounded border p-2"><span className="text-muted-foreground">Soil depletion:</span> <strong>{result.depletionPct.toFixed(0)}%</strong></div>
            </div>
            <div className="rounded-md border p-2 text-xs flex items-start gap-1.5" style={{ borderColor: result.color + '40', color: result.color }}>
              {result.dsiScore < 50 ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
              <span>{result.advice}</span>
            </div>
            <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
              💡 DSI = 40% ET₀ deficit + 40% soil depletion + 20% stage sensitivity. Flowering is most sensitive — water stress here causes irreversible yield loss.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
