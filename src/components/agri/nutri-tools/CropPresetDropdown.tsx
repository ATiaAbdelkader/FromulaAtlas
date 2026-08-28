'use client';

import { Info } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CROP_CATEGORY_LABELS,
  CROP_PRESETS,
  type CropPreset,
} from '@/lib/crop-presets';

/**
 * CropPresetDropdown — a small Select that lets the user pick one of the 10
 * research-backed crop presets. Calls `onSelect(preset)` when a crop is chosen.
 *
 * The dropdown is grouped by category (fruit / vegetable / berry / cereal /
 * industrial) using SelectGroup + SelectLabel (rendered as optgroup-like
 * headers). Each option shows the crop's emoji + name. A small "info" tooltip
 * to the right of the trigger explains what presets do.
 */

const CATEGORY_ORDER: CropPreset['category'][] = [
  'fruit',
  'vegetable',
  'berry',
  'cereal',
  'industrial',
];

export interface CropPresetDropdownProps {
  /** Called with the chosen preset whenever the user picks a crop. */
  onSelect: (preset: CropPreset) => void;
  /** Optional controlled value (preset id). Pass null/undefined to show the
   *  placeholder. */
  value?: CropPreset['id'] | null;
  /** Optional extra className for the wrapper div. */
  className?: string;
}

export function CropPresetDropdown({
  onSelect,
  value,
  className,
}: CropPresetDropdownProps) {
  return (
    <div className={`flex items-center gap-1.5 ${className ?? ''}`}>
      <Select
        value={value ?? undefined}
        onValueChange={id => {
          const preset = CROP_PRESETS.find(c => c.id === id);
          if (preset) onSelect(preset);
        }}
      >
        <SelectTrigger size="sm" className="w-[210px] h-8 text-xs">
          <SelectValue placeholder="— Select crop preset —" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORY_ORDER.map(cat => {
            const crops = CROP_PRESETS.filter(c => c.category === cat);
            if (crops.length === 0) return null;
            return (
              <SelectGroup key={cat}>
                <SelectLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {CROP_CATEGORY_LABELS[cat]}
                </SelectLabel>
                {crops.map(c => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    <span aria-hidden className="text-sm">
                      {c.emoji}
                    </span>
                    <span>{c.name}</span>
                  </SelectItem>
                ))}
              </SelectGroup>
            );
          })}
        </SelectContent>
      </Select>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="What are crop presets?"
            className="text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          >
            <Info className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[240px] text-xs leading-relaxed">
          <p>
            Loads research-backed defaults for this crop across the 4 nutri-tools
            (hydro solution, nutrient distribution, irrigation Kc, amendment
            targets). Values can still be edited afterwards.
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
