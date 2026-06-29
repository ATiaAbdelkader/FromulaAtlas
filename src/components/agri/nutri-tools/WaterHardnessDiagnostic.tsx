'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ACIDS, EQ_CACO3, PPM_CACO3_PER_PPM_CA, PPM_CACO3_PER_PPM_MG,
  PPM_PER_DH, PPM_PER_EH, PPM_PER_FH, hardnessClassByPpm,
} from '@/lib/nutri-tools-data';
import { SendToMenu } from './SendToMenu';

/**
 * Tool 5 — Water Hardness Diagnostic
 * Three sections: unit converter, Ca+Mg hardness, acid dose.
 */
export function WaterHardnessDiagnostic() {
  // Section 1: bidirectional hardness units
  const [ppm, setPpm] = useState('');
  const [meq, setMeq] = useState('');
  const [dh, setDh] = useState('');
  const [eh, setEh] = useState('');
  const [fh, setFh] = useState('');

  const fromPpm = (v: string) => {
    setPpm(v);
    const n = parseFloat(v.replace(',', '.')) || 0;
    setMeq(n ? (n / EQ_CACO3).toFixed(2) : '');
    setDh(n ? (n / PPM_PER_DH).toFixed(2) : '');
    setEh(n ? (n / PPM_PER_EH).toFixed(2) : '');
    setFh(n ? (n / PPM_PER_FH).toFixed(2) : '');
  };
  const fromMeq = (v: string) => {
    setMeq(v);
    const n = parseFloat(v.replace(',', '.')) || 0;
    const p = n * EQ_CACO3;
    setPpm(p ? p.toFixed(2) : '');
    setDh(p ? (p / PPM_PER_DH).toFixed(2) : '');
    setEh(p ? (p / PPM_PER_EH).toFixed(2) : '');
    setFh(p ? (p / PPM_PER_FH).toFixed(2) : '');
  };
  const fromDh = (v: string) => {
    setDh(v);
    const n = parseFloat(v.replace(',', '.')) || 0;
    const p = n * PPM_PER_DH;
    setPpm(p ? p.toFixed(2) : '');
    setMeq(p ? (p / EQ_CACO3).toFixed(2) : '');
    setEh(p ? (p / PPM_PER_EH).toFixed(2) : '');
    setFh(p ? (p / PPM_PER_FH).toFixed(2) : '');
  };
  const fromEh = (v: string) => {
    setEh(v);
    const n = parseFloat(v.replace(',', '.')) || 0;
    const p = n * PPM_PER_EH;
    setPpm(p ? p.toFixed(2) : '');
    setMeq(p ? (p / EQ_CACO3).toFixed(2) : '');
    setDh(p ? (p / PPM_PER_DH).toFixed(2) : '');
    setFh(p ? (p / PPM_PER_FH).toFixed(2) : '');
  };
  const fromFh = (v: string) => {
    setFh(v);
    const n = parseFloat(v.replace(',', '.')) || 0;
    const p = n * PPM_PER_FH;
    setPpm(p ? p.toFixed(2) : '');
    setMeq(p ? (p / EQ_CACO3).toFixed(2) : '');
    setDh(p ? (p / PPM_PER_DH).toFixed(2) : '');
    setEh(p ? (p / PPM_PER_EH).toFixed(2) : '');
  };

  const ppmNum = parseFloat(ppm) || 0;
  const cls = hardnessClassByPpm(ppmNum);

  // Section 2: from Ca + Mg
  const [caVal, setCaVal] = useState('');
  const [caUnit, setCaUnit] = useState('ppm');
  const [mgVal, setMgVal] = useState('');
  const [mgUnit, setMgUnit] = useState('ppm');

  const caPpm = caUnit === 'meq' ? (parseFloat(caVal) || 0) * EQ_CACO3 : (parseFloat(caVal) || 0);
  const mgPpm = mgUnit === 'meq' ? (parseFloat(mgVal) || 0) * EQ_CACO3 : (parseFloat(mgVal) || 0);
  const partCa = caPpm * PPM_CACO3_PER_PPM_CA;
  const partMg = mgPpm * PPM_CACO3_PER_PPM_MG;
  const labTotal = partCa + partMg;
  const labCls = hardnessClassByPpm(labTotal);

  // Section 3: acid dose
  const [hco3, setHco3] = useState('');
  const [co3, setCo3] = useState('');
  const [residual, setResidual] = useState('0.5');
  const [waterVol, setWaterVol] = useState('1000');
  const [volUnit, setVolUnit] = useState<'L' | 'm3'>('L');
  const [acidId, setAcidId] = useState(ACIDS[0].id);

  const hco3N = parseFloat(hco3) || 0;
  const co3N = parseFloat(co3) || 0;
  const residualN = parseFloat(residual) || 0;
  const volN = parseFloat(waterVol) || 0;
  const volM3 = volUnit === 'm3' ? volN : volN / 1000;
  const acid = ACIDS.find(a => a.id === acidId)!;
  const needMeq = Math.max(0, hco3N + co3N - residualN);
  const mlPerM3 = acid.meqPerMl > 0 ? (needMeq * 1000) / acid.meqPerMl : 0;
  const totalMl = mlPerM3 * volM3;
  const totalL = totalMl / 1000;
  const kgPerM3Water = (mlPerM3 / 1000) * acid.densityKgL;
  const kgTotal = totalL * acid.densityKgL;

  return (
    <div className="space-y-4">
      {/* Section 1 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Water Hardness Unit Converter</CardTitle>
          <p className="text-xs text-muted-foreground">Type in any field — all other units update.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="mg/L as CaCO₃ (ppm)" value={ppm} onChange={fromPpm} />
            <Field label="meq/L" value={meq} onChange={fromMeq} />
            <Field label="°dH (German)" value={dh} onChange={fromDh} />
            <Field label="°e (English / Clark)" value={eh} onChange={fromEh} />
            <Field label="°fH (French)" value={fh} onChange={fromFh} />
            <div>
              <Label className="text-xs">Classification</Label>
              <div className="h-9 mt-1 px-3 flex items-center rounded-md border text-sm font-medium"
                   style={{ background: `${cls.color}15`, color: cls.color, borderColor: `${cls.color}40` }}>
                {ppmNum > 0 ? `${cls.label} · ${ppmNum.toFixed(1)} ppm` : '—'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Hardness from Ca + Mg (lab values)</CardTitle>
          <p className="text-xs text-muted-foreground">Computes total hardness as CaCO₃ from calcium and magnesium.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Calcium (Ca)</Label>
              <div className="flex gap-1 mt-1">
                <Input value={caVal} onChange={e => setCaVal(e.target.value)} placeholder="0" className="h-9" />
                <Select value={caUnit} onValueChange={setCaUnit}>
                  <SelectTrigger className="h-9 w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ppm">ppm</SelectItem>
                    <SelectItem value="meq">meq/L</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Magnesium (Mg)</Label>
              <div className="flex gap-1 mt-1">
                <Input value={mgVal} onChange={e => setMgVal(e.target.value)} placeholder="0" className="h-9" />
                <Select value={mgUnit} onValueChange={setMgUnit}>
                  <SelectTrigger className="h-9 w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ppm">ppm</SelectItem>
                    <SelectItem value="meq">meq/L</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="rounded-lg p-3 bg-muted/40 text-sm">
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Ca → {partCa.toFixed(1)} ppm CaCO₃</div>
              <div>Mg → {partMg.toFixed(1)} ppm CaCO₃</div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total hardness</span>
              <span className="font-bold" style={{ color: labCls.color }}>
                {labTotal.toFixed(1)} ppm · {labCls.label}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="text-base">Acid Dose for HCO₃⁻ / CO₃²⁻ Neutralization</CardTitle>
              <p className="text-xs text-muted-foreground">mL/m³ and total acid volume to neutralize bicarbonate + carbonate to a residual buffer.</p>
            </div>
            {hco3N > 0 && (
              <SendToMenu
                sourceToolId="water-hardness"
                targets={[
                  {
                    toolId: 'hydro-solution',
                    label: 'Hydroponic Solution Designer',
                    values: { hco3: Number(hco3N.toFixed(2)) },
                    description: `${hco3N.toFixed(2)} meq/L HCO₃⁻ → Cl`,
                  },
                ]}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Field label="HCO₃⁻ (meq/L)" value={hco3} onChange={setHco3} />
            <Field label="CO₃²⁻ (meq/L)" value={co3} onChange={setCo3} />
            <Field label="Residual target (meq/L)" value={residual} onChange={setResidual} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Water volume</Label>
              <div className="flex gap-1 mt-1">
                <Input value={waterVol} onChange={e => setWaterVol(e.target.value)} className="h-9" />
                <Select value={volUnit} onValueChange={v => setVolUnit(v as 'L'|'m3')}>
                  <SelectTrigger className="h-9 w-16"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="m3">m³</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Acid</Label>
              <Select value={acidId} onValueChange={setAcidId}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACIDS.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="rounded-lg p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-sm">
            <div className="grid grid-cols-2 gap-y-1">
              <div className="text-xs text-muted-foreground">meq/L to neutralize</div>
              <div className="text-right font-mono">{needMeq.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Acid dose</div>
              <div className="text-right font-mono">{mlPerM3.toFixed(1)} mL/m³</div>
              <div className="text-xs text-muted-foreground">kg acid / m³ water</div>
              <div className="text-right font-mono">{kgPerM3Water.toFixed(3)}</div>
              <div className="text-xs text-muted-foreground">Total acid for {volM3.toFixed(2)} m³</div>
              <div className="text-right font-mono">{totalL.toFixed(3)} L ({kgTotal.toFixed(2)} kg)</div>
            </div>
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded p-2">
            ⚠️ Technical reference: don't neutralize to 100% by default. Use a residual buffer and validate final pH.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder="0" className="h-9 mt-1" />
    </div>
  );
}
