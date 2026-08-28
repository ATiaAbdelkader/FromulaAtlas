'use client';
import { Sprout, ChevronRight, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cropPackages, calculatorFormulaCode, type CropPackage, type CropCalculatorKey } from '@/lib/crop-packages';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

interface Props {
  selectedCrop: CropPackage | null;
  onSelectCrop: (crop: CropPackage | null) => void;
  onLaunchCalculator: (crop: CropPackage, calcKey: CropCalculatorKey) => void;
}

export function CropPackagesSection({ selectedCrop, onSelectCrop, onLaunchCalculator }: Props) {
  const calcKeys = Object.keys(calculatorFormulaCode) as CropCalculatorKey[];
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div><div className="flex items-center gap-2 mb-1"><Sprout className="h-4 w-4 text-emerald-600" /><h2 className="text-lg font-semibold tracking-tight">Crop Calculator Packages</h2></div><p className="text-sm text-muted-foreground">Pick a crop to auto-fill calculators with research-backed defaults.</p></div>
        {selectedCrop && <Badge variant="outline" className="gap-1.5"><Check className="h-3 w-3" />{selectedCrop.name} selected</Badge>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
        {cropPackages.map(crop => {
          const isSelected = selectedCrop?.id === crop.id;
          return (
            <button key={crop.id} onClick={() => onSelectCrop(isSelected ? null : crop)} className={cn('group relative rounded-xl border-2 p-3 transition-all hover:shadow-md hover:-translate-y-0.5 text-center', isSelected ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 ring-2 ring-emerald-400' : 'border-border bg-card')}>
              <div className="flex items-center justify-center h-10 w-10 rounded-lg mx-auto mb-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600"><Sprout className="h-5 w-5" /></div>
              <div className="text-sm font-semibold leading-tight">{crop.name}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{crop.typicalYield}</div>
              {isSelected && <div className="absolute top-1.5 right-1.5 flex items-center justify-center h-4 w-4 rounded-full bg-emerald-600 text-white"><Check className="h-2.5 w-2.5" /></div>}
            </button>
          );
        })}
      </div>
      {selectedCrop && (
        <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-900 p-5 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div><h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{selectedCrop.name}</h3><p className="text-sm text-muted-foreground mt-0.5">{selectedCrop.description}</p>
              <div className="flex items-center gap-2 flex-wrap mt-2"><Badge variant="outline" className="text-[10px]">Yield: {selectedCrop.typicalYield}</Badge><Badge variant="outline" className="text-[10px]">Season: {selectedCrop.growingSeason}</Badge>{selectedCrop.defaults.etc && <Badge variant="outline" className="text-[10px]">Kc = {selectedCrop.defaults.etc.kc}</Badge>}</div>
            </div>
            <button onClick={() => onSelectCrop(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-2">Pre-filled Calculators</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {calcKeys.map(key => {
              if (!selectedCrop.defaults[key]) return null;
              return (
                <button key={key} onClick={() => onLaunchCalculator(selectedCrop, key)} className="group flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-sm transition-all text-left">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex-shrink-0"><Sprout className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0"><div className="text-sm font-medium leading-tight capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div><div className="text-[10px] text-muted-foreground font-mono">{calculatorFormulaCode[key]}</div></div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
