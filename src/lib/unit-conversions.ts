// Unit conversions: 8 categories with conversion factors and a temperature
// converter (offset + scale) for non-linear °C ↔ °F.

// --- Types ----------------------------------------------------------------

export type UnitCategoryId =
  | 'area'
  | 'length'
  | 'weight'
  | 'volume'
  | 'temperature'
  | 'water_depth'
  | 'yield'
  | 'pressure';

export interface UnitDef {
  /** unit id, e.g. 'ha', 'm', 'kg' */
  id: string;
  /** display label, e.g. 'hectare' */
  label: string;
  /** short symbol shown alongside inputs */
  symbol: string;
  /**
   * For linear units: factor to convert FROM this unit TO the base unit.
   * For temperature: handled via custom converter.
   */
  toBase: number;
}

export interface UnitCategory {
  id: UnitCategoryId;
  label: string;
  /** the canonical reference unit (all conversions go through base) */
  baseUnitId: string;
  units: UnitDef[];
}

// --- Categories -----------------------------------------------------------

export const unitCategories: UnitCategory[] = [
  {
    id: 'area',
    label: 'Area',
    baseUnitId: 'm2',
    units: [
      { id: 'm2', label: 'square meter', symbol: 'm²', toBase: 1 },
      { id: 'ha', label: 'hectare', symbol: 'ha', toBase: 10_000 },
      { id: 'acre', label: 'acre', symbol: 'ac', toBase: 4_046.8564224 },
      { id: 'km2', label: 'square kilometer', symbol: 'km²', toBase: 1_000_000 },
      { id: 'ft2', label: 'square foot', symbol: 'ft²', toBase: 0.09290304 },
      { id: 'mi2', label: 'square mile', symbol: 'mi²', toBase: 2_589_988.110336 },
    ],
  },
  {
    id: 'length',
    label: 'Length',
    baseUnitId: 'm',
    units: [
      { id: 'm', label: 'meter', symbol: 'm', toBase: 1 },
      { id: 'cm', label: 'centimeter', symbol: 'cm', toBase: 0.01 },
      { id: 'mm', label: 'millimeter', symbol: 'mm', toBase: 0.001 },
      { id: 'km', label: 'kilometer', symbol: 'km', toBase: 1_000 },
      { id: 'in', label: 'inch', symbol: 'in', toBase: 0.0254 },
      { id: 'ft', label: 'foot', symbol: 'ft', toBase: 0.3048 },
      { id: 'yd', label: 'yard', symbol: 'yd', toBase: 0.9144 },
      { id: 'mi', label: 'mile', symbol: 'mi', toBase: 1_609.344 },
    ],
  },
  {
    id: 'weight',
    label: 'Weight',
    baseUnitId: 'kg',
    units: [
      { id: 'kg', label: 'kilogram', symbol: 'kg', toBase: 1 },
      { id: 'g', label: 'gram', symbol: 'g', toBase: 0.001 },
      { id: 't', label: 'metric ton', symbol: 't', toBase: 1_000 },
      { id: 'lb', label: 'pound', symbol: 'lb', toBase: 0.45359237 },
      { id: 'oz', label: 'ounce', symbol: 'oz', toBase: 0.028349523125 },
      { id: 'cwt', label: 'hundredweight (US)', symbol: 'cwt', toBase: 45.359237 },
    ],
  },
  {
    id: 'volume',
    label: 'Volume',
    baseUnitId: 'L',
    units: [
      { id: 'L', label: 'liter', symbol: 'L', toBase: 1 },
      { id: 'mL', label: 'milliliter', symbol: 'mL', toBase: 0.001 },
      { id: 'm3', label: 'cubic meter', symbol: 'm³', toBase: 1_000 },
      { id: 'gal_us', label: 'US gallon', symbol: 'gal', toBase: 3.785411784 },
      { id: 'gal_uk', label: 'UK gallon', symbol: 'gal (UK)', toBase: 4.54609 },
      { id: 'ft3', label: 'cubic foot', symbol: 'ft³', toBase: 28.316846592 },
      { id: 'bu', label: 'US bushel', symbol: 'bu', toBase: 35.23907016688 },
    ],
  },
  {
    id: 'temperature',
    label: 'Temperature',
    baseUnitId: 'C',
    units: [
      { id: 'C', label: 'Celsius', symbol: '°C', toBase: 1 },
      { id: 'F', label: 'Fahrenheit', symbol: '°F', toBase: 1 },
      { id: 'K', label: 'Kelvin', symbol: 'K', toBase: 1 },
    ],
  },
  {
    id: 'water_depth',
    label: 'Water Depth',
    baseUnitId: 'mm',
    units: [
      { id: 'mm', label: 'millimeter', symbol: 'mm', toBase: 1 },
      { id: 'cm', label: 'centimeter', symbol: 'cm', toBase: 10 },
      { id: 'in', label: 'inch', symbol: 'in', toBase: 25.4 },
      { id: 'm3_ha', label: 'cubic meter per hectare', symbol: 'm³/ha', toBase: 0.1 }, // 1 m³/ha = 0.1 mm
    ],
  },
  {
    id: 'yield',
    label: 'Yield',
    baseUnitId: 'kg_ha',
    units: [
      { id: 'kg_ha', label: 'kilogram per hectare', symbol: 'kg/ha', toBase: 1 },
      { id: 't_ha', label: 'tonne per hectare', symbol: 't/ha', toBase: 1_000 },
      { id: 'lb_ac', label: 'pound per acre', symbol: 'lb/ac', toBase: 1.120851 }, // 1 lb/ac ≈ 1.12085 kg/ha
      { id: 'bu_ac', label: 'bushel per acre (60lb)', symbol: 'bu/ac', toBase: 67.25106 }, // assumes 60-lb bushel (wheat/soy)
    ],
  },
  {
    id: 'pressure',
    label: 'Pressure',
    baseUnitId: 'kPa',
    units: [
      { id: 'kPa', label: 'kilopascal', symbol: 'kPa', toBase: 1 },
      { id: 'bar', label: 'bar', symbol: 'bar', toBase: 100 },
      { id: 'psi', label: 'pound per square inch', symbol: 'psi', toBase: 6.894757 },
      { id: 'atm', label: 'atmosphere', symbol: 'atm', toBase: 101.325 },
      { id: 'm_h2o', label: 'meter of water', symbol: 'm H₂O', toBase: 9.80665 },
      { id: 'mmHg', label: 'millimeter of mercury', symbol: 'mmHg', toBase: 0.133322 },
    ],
  },
];

// --- Lookup helpers -------------------------------------------------------

const categoryIndex: Record<string, UnitCategory> = (() => {
  const idx: Record<string, UnitCategory> = {};
  for (const c of unitCategories) idx[c.id] = c;
  return idx;
})();

export function getCategory(id: UnitCategoryId): UnitCategory | undefined {
  return categoryIndex[id];
}

export function getUnit(
  categoryId: UnitCategoryId,
  unitId: string
): UnitDef | undefined {
  return categoryIndex[categoryId]?.units.find((u) => u.id === unitId);
}

// --- Conversion -----------------------------------------------------------

/**
 * Convert a value from one unit to another within the same category.
 *
 * For linear categories this is straightforward: convert to base, then
 * from base to the target. Temperature uses a custom offset+scale
 * converter because the °C ↔ °F relationship is affine, not linear.
 */
export function convertValue(
  value: number,
  categoryId: UnitCategoryId,
  fromUnitId: string,
  toUnitId: string
): number {
  if (fromUnitId === toUnitId) return value;
  const cat = getCategory(categoryId);
  if (!cat) return NaN;
  const fromU = cat.units.find((u) => u.id === fromUnitId);
  const toU = cat.units.find((u) => u.id === toUnitId);
  if (!fromU || !toU) return NaN;

  // Special-case temperature (affine transformation).
  if (categoryId === 'temperature') {
    const celsius = toCelsius(value, fromU.id);
    return fromCelsius(celsius, toU.id);
  }

  // Linear: value_in_base = value × toBase_from; result = base / toBase_to
  const inBase = value * fromU.toBase;
  return inBase / toU.toBase;
}

function toCelsius(value: number, unitId: string): number {
  switch (unitId) {
    case 'C':
      return value;
    case 'F':
      return ((value - 32) * 5) / 9;
    case 'K':
      return value - 273.15;
    default:
      return value;
  }
}

function fromCelsius(celsius: number, unitId: string): number {
  switch (unitId) {
    case 'C':
      return celsius;
    case 'F':
      return (celsius * 9) / 5 + 32;
    case 'K':
      return celsius + 273.15;
    default:
      return celsius;
  }
}

// --- Formatting -----------------------------------------------------------

function formatNumber(n: number, digits: number): string {
  if (!isFinite(n)) return '—';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  // For very large or very small numbers, use exponential or fixed.
  if (abs >= 1e6 || abs < 1e-4) {
    return n.toExponential(digits);
  }
  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

/**
 * Convert AND format in one call. Returns a string with the converted value
 * and the target unit's symbol, e.g. "2.47 acre".
 *
 * @param value      numeric value to convert
 * @param categoryId which unit category
 * @param fromUnitId source unit id
 * @param toUnitId   target unit id
 * @param digits     decimal places (default 2)
 */
export function formatConverted(
  value: number,
  categoryId: UnitCategoryId,
  fromUnitId: string,
  toUnitId: string,
  digits = 2
): string {
  const converted = convertValue(value, categoryId, fromUnitId, toUnitId);
  const toU = getUnit(categoryId, toUnitId);
  const symbol = toU?.symbol ?? toUnitId;
  return `${formatNumber(converted, digits)} ${symbol}`;
}

/**
 * Build a small conversion table showing the value in every unit of a
 * category. Useful for "see all units" UI.
 */
export function convertToAllUnits(
  value: number,
  categoryId: UnitCategoryId,
  fromUnitId: string
): { unit: UnitDef; value: number; formatted: string }[] {
  const cat = getCategory(categoryId);
  if (!cat) return [];
  return cat.units
    .filter((u) => u.id !== fromUnitId)
    .map((u) => {
      const v = convertValue(value, categoryId, fromUnitId, u.id);
      return {
        unit: u,
        value: v,
        formatted: formatNumber(v, 2),
      };
    });
}

export default unitCategories;
