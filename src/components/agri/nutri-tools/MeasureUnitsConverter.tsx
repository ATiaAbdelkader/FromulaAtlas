'use client';

import { useState } from 'react';
import {
  ArrowRightLeft,
  Copy,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalculatorShell,
  type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  MEASURE_UNITS,
  MEASURE_CATEGORIES,
  convertMeasure,
} from '@/lib/nutri-tools-data';

const CATEGORY_AR: Record<string, string> = {
  length: 'الطول',
  area: 'المساحة',
  volume: 'الحجم',
  weight: 'الكتلة / الوزن',
  temperature: 'درجة الحرارة',
  pressure: 'الضغط',
  concentration: 'التركيز',
  ionic: 'أيوني (تربة / محلول)',
};
const CATEGORY_FR: Record<string, string> = {
  length: 'Longueur',
  area: 'Surface',
  volume: 'Volume',
  weight: 'Masse / Poids',
  temperature: 'Température',
  pressure: 'Pression',
  concentration: 'Concentration',
  ionic: 'Ionique (sol / solution)',
};

export function MeasureUnitsConverter() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [category, setCategory] = useState('length');
  const [value, setValue] = useState('1');
  const [from, setFrom] = useState('m');
  const [to, setTo] = useState('ft');
  const [copied, setCopied] = useState(false);

  const units = MEASURE_UNITS[category] || [];
  const num = parseFloat(value.replace(',', '.')) || 0;
  const fromDef = units.find(u => u.id === from);
  const toDef = units.find(u => u.id === to);
  const result =
    fromDef && toDef ? convertMeasure(num, fromDef, toDef, category) : null;

  const onCategoryChange = (cat: string) => {
    setCategory(cat);
    const list = MEASURE_UNITS[cat] || [];
    if (list.length > 0) {
      setFrom(list[0].id);
      setTo(list[1]?.id || list[0].id);
    }
  };

  const handleReset = () => {
    setCategory('length');
    setValue('1');
    setFrom('m');
    setTo('ft');
    toast({
      title: tr(
        'Reset to Defaults',
        'تمت استعادة القيم الافتراضية',
        'Valeurs réinitialisées',
      ),
    });
  };

  const handleCopy = () => {
    if (result == null) return;
    const text = `
=== UNIT CONVERSION ===
Category: ${tr(CATEGORY_AR[category] ?? category, CATEGORY_AR[category] ?? category, CATEGORY_FR[category] ?? category)}
Input: ${value} ${fromDef?.name ?? from}
Result: ${result.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${toDef?.name ?? to}
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: tr('Result Copied!', 'تم نسخ النتيجة!', 'Résultat copié !'),
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const pills: CalculatorPill[] = MEASURE_CATEGORIES.map(c => ({
    key: c.id,
    label: tr(c.label, CATEGORY_AR[c.id] ?? c.label, CATEGORY_FR[c.id] ?? c.label),
  }));

  return (
    <CalculatorShell
      icon={ArrowRightLeft}
      accent="sky"
      title={{
        en: 'Physical Units Converter',
        ar: 'محول وحدات القياس الفيزيائي',
        fr: 'Convertisseur d’Unités Physiques',
      }}
      description={{
        en: 'Length, area, volume, mass, temperature, pressure, concentration, and ionic units — 8 categories.',
        ar: 'الطول، المساحة، الحجم، الكتلة، الحرارة، الضغط، التركيز، والوحدات الأيونية — 8 فئات.',
        fr: 'Longueur, surface, volume, masse, température, pression, concentration et unités ioniques — 8 catégories.',
      }}
      badge="SI · Imperial"
      pills={pills}
      activePill={category}
      onPillClick={onCategoryChange}
      pillLabel={{ en: 'Category:', ar: 'الفئة:', fr: 'Catégorie :' }}
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Result', ar: 'نسخ النتيجة', fr: 'Copier' },
          onClick: handleCopy,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      protocolNote={
        category === 'temperature'
          ? {
              en: 'Temperature uses special formulas (°C ↔ °F ↔ K), not simple ratios. 0°C = 32°F = 273.15 K.',
              ar: 'تستخدم درجة الحرارة صيغاً خاصة (°C ↔ °F ↔ K) وليست نسباً بسيطة. 0°م = 32°ف = 273.15 كلفن.',
              fr: 'La température utilise des formules spéciales (°C ↔ °F ↔ K), pas des ratios simples. 0°C = 32°F = 273,15 K.',
            }
          : category === 'ionic'
            ? {
                en: 'Ionic units split into solution-based (meq/L, mmol/L) and soil-based (meq/100g, cmolc/kg). Cross-group conversion is blocked.',
                ar: 'تنقسم الوحدات الأيونية إلى محلولية (meq/L، mmol/L) وترابية (meq/100g، cmolc/kg). التحويل بين المجموعتين غير ممكن.',
                fr: 'Les unités ioniques se divisent en solution (meq/L, mmol/L) et sol (meq/100g, cmolc/kg). La conversion croisée est bloquée.',
              }
            : undefined
      }
    >
      <CalculatorShell.Inputs>
        <div className="p-3 rounded-xl border bg-card space-y-1">
          <label className="text-xs font-bold text-foreground">
            {tr('From', 'من', 'De')}
          </label>
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-mono font-bold"
          />
          <Select value={from} onValueChange={setFrom}>
            <SelectTrigger className="h-9 mt-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {units.map(u => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="p-3 rounded-xl border bg-card space-y-1">
          <label className="text-xs font-bold text-foreground">
            {tr('To', 'إلى', 'Vers')}
          </label>
          <Select value={to} onValueChange={setTo}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {units.map(u => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-[10px] text-muted-foreground">
            {tr(
              'Pick the destination unit',
              'اختر الوحدة الهدف',
              'Choisir l’unité cible',
            )}
          </div>
        </div>
      </CalculatorShell.Inputs>
      <CalculatorShell.Results>
        <CalculatorShell.MetricTile
          label={tr('Converted value', 'القيمة المحوّلة', 'Valeur convertie')}
          value={
            result == null
              ? '—'
              : result.toLocaleString('en-US', { maximumFractionDigits: 6 })
          }
          unit={toDef?.id}
          color="sky"
          helper={
            result == null
              ? tr(
                  'Cannot convert between soil and solution ionic units — pick units from the same group.',
                  'لا يمكن التحويل بين وحدات التربة والمحلول الأيونية — اختر وحدات من نفس المجموعة.',
                  'Conversion impossible entre sol et solution ioniques — choisissez des unités du même groupe.',
                )
              : `${value} ${fromDef?.id ?? ''} → ${toDef?.id ?? ''}`
          }
        />
        <div className="grid grid-cols-2 gap-3">
          <CalculatorShell.MetricTile
            label={tr('Input value', 'القيمة المدخلة', 'Valeur saisie')}
            value={value || '0'}
            unit={fromDef?.id}
            color="default"
          />
          <CalculatorShell.MetricTile
            label={tr('Conversion factor', 'معامل التحويل', 'Facteur')}
            value={
              fromDef && toDef && !fromDef.isTemp
                ? (toDef.toBase / fromDef.toBase).toLocaleString('en-US', {
                    maximumFractionDigits: 6,
                  })
                : '—'
            }
            color="default"
            helper={
              fromDef?.isTemp
                ? tr('Formula-based', 'بصيغة خاصة', 'Formule dédiée')
                : '1 ' + (fromDef?.id ?? '') + ' = ? ' + (toDef?.id ?? '')
            }
          />
        </div>
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
          <ArrowRight className="h-3.5 w-3.5" />
          <span>
            {tr(
              'Bidirectional — swap From and To any time',
              'ثنائي الاتجاه — بدّل بين «من» و«إلى» في أي وقت',
              'Bidirectionnel — permutez From et To à tout moment',
            )}
          </span>
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
