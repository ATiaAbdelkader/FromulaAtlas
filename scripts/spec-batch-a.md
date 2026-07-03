# NutriPlant PRO — Free Tools Batch A — Logic & Data Specification

**Task ID:** 1-a
**Agent:** general-purpose
**Source files:**
- `/tmp/np_tools/measure-units-calculator.js`
- `/tmp/np_tools/vpd-free.html`
- `/tmp/np_tools/agua-dureza-free.html`
- `/tmp/np_tools/enmienda-free.html`
- `/tmp/np_tools/n-mineralizable-mo-free.html`

**Purpose:** Self-contained spec so another agent can reimplement each tool as a React/TypeScript component. All formulas, constants, lookup tables, classifications and non-obvious UX behaviors are reproduced here as TS-friendly literals.

---

## TOC

1. [Tool 1 — Measure Units Converter (measure-units-calculator.js)](#tool-1)
2. [Tool 2 — VPD Estimator (vpd-free.html)](#tool-2)
3. [Tool 3 — Water Hardness Diagnostic (agua-dureza-free.html)](#tool-3)
4. [Tool 4 — Amendment Balance by CEC (enmienda-free.html)](#tool-4)
5. [Tool 5 — Mineralizable N Estimation (n-mineralizable-mo-free.html)](#tool-5)
6. [Shared / Cross-cutting patterns](#shared)

---

<a id="tool-1"></a>
## Tool 1 — Measure Units Converter

- **English name:** Measure Units Converter (with Root-Reach surface estimator)
- **Original Spanish:** Conversor de magnitudes físicas (longitud, área, volumen, masa, temperatura, presión, concentración, carga iónica) + % superficie con raíces
- **File:** `measure-units-calculator.js`
- **Purpose:** Convert physical quantities across unit families and estimate the percentage of cultivated surface with active root exploration (used in water-balance as "wetted fraction").

### 1.1 Input fields (HTML ids assumed by the script)

| id              | label                              | unit       | default | range           | notes |
|-----------------|------------------------------------|------------|---------|-----------------|-------|
| `measure-category` | Categoría de magnitud          | (select)  | —       | enum (see `MEASURE_UNITS` keys + `rootReachPlant`, `rootReachBed`) | drives which unit list shows |
| `measure-value`    | Valor a convertir              | (number)  | ''      | any             | shown only for standard categories |
| `measure-from`     | Unidad origen                  | (select)  | first   | depends on category | |
| `measure-to`       | Unidad destino                 | (select)  | second  | depends on category | |
| `measure-result`   | Resultado                      | (readonly)| ''      | —               | output |
| `measure-ionic-hint` | hint about soil vs solution  | —         | —       | —               | shown only when category = `ionic` |
| **rootReachPlant** special panel fields (rendered dynamically): |
| `measure-rrp-mode`        | Zona radical (tipo)        | select    | `radius` | `radius`/`diameter`/`orilla` | orilla = separación orilla a orilla |
| `measure-rrp-size`        | Medida (m)                  | m         | —       | >0              | |
| `measure-rrp-plants-ha`   | Plantas / ha (directo)     | plants/ha | —       | >0 (optional)   | |
| `measure-rrp-row-m`       | Separación surcos (m)      | m         | —       | >0 (optional)   | |
| `measure-rrp-inrow-m`     | Separación en surco (m)    | m         | —       | >0 (optional)   | |
| **rootReachBed** special panel fields: |
| `measure-rrb-row-m`       | Distancia entre surcos (m) | m         | —       | >0              | center-to-center |
| `measure-rrb-bed-m`       | Ancho de cama (m)          | m         | —       | >0 and ≤ row-m  | |
| `measure-rrb-reach-pct`   | Raíz en cama (% del ancho) | %         | 100     | 1–100           | 100% = full bed wetted |

### 1.2 Output fields

| id                          | label                                  | unit          | formula |
|-----------------------------|----------------------------------------|---------------|---------|
| `measure-result`            | Converted value                        | (target unit) | see 1.4 |
| `measure-special-result`    | % surface with roots                   | %             | see 1.5 |
| `measure-special-result-label` | dynamic label                      | —             | "% superficie con raíces (estimado)" |
| `measure-special-detail`    | explanatory detail string              | —             | computed |

### 1.3 Constants — `MEASURE_UNITS` lookup table (reproduce verbatim)

```ts
export const MEASURE_UNITS = {
  length: [
    { id: 'm',    name: 'm (metro)',         toBase: 1 },
    { id: 'km',   name: 'km',                toBase: 1000 },
    { id: 'cm',   name: 'cm',                toBase: 0.01 },
    { id: 'ft',   name: 'ft (pie)',          toBase: 0.3048 },
    { id: 'in',   name: 'in (pulgada)',      toBase: 0.0254 },
    { id: 'yd',   name: 'yd (yarda)',        toBase: 0.9144 },
    { id: 'mi',   name: 'mi (milla)',        toBase: 1609.344 },
  ],
  area: [
    { id: 'm2',   name: 'm²',                toBase: 1 },
    { id: 'ha',   name: 'ha (hectárea)',     toBase: 10000 },
    { id: 'acre', name: 'acre',              toBase: 4046.86 },
    { id: 'ft2',  name: 'ft²',               toBase: 0.092903 },
    { id: 'km2',  name: 'km²',               toBase: 1e6 },
  ],
  volume: [
    { id: 'L',      name: 'L (litro)',       toBase: 1 },
    { id: 'mL',     name: 'mL',              toBase: 0.001 },
    { id: 'm3',     name: 'm³',              toBase: 1000 },
    { id: 'galUS',  name: 'gal (US)',        toBase: 3.78541 },
    { id: 'galUK',  name: 'gal (UK)',        toBase: 4.54609 },
    { id: 'ft3',    name: 'ft³',             toBase: 28.3168 },
    { id: 'flozUS', name: 'fl oz (US)',      toBase: 0.0295735 },
  ],
  weight: [
    { id: 'kg', name: 'kg',                  toBase: 1 },
    { id: 'g',  name: 'g',                   toBase: 0.001 },
    { id: 'mg', name: 'mg',                  toBase: 0.000001 },
    { id: 't',  name: 't (tonelada)',        toBase: 1000 },
    { id: 'lb', name: 'lb (libra)',          toBase: 0.453592 },
    { id: 'oz', name: 'oz (onza)',           toBase: 0.0283495 },
  ],
  temperature: [
    { id: 'C', name: '°C', toBase: 1, isTemp: true },
    { id: 'F', name: '°F', toBase: 1, isTemp: true },
    { id: 'K', name: 'K',  toBase: 1, isTemp: true },
  ],
  pressure: [
    { id: 'kPa', name: 'kPa',  toBase: 1 },
    { id: 'psi', name: 'psi',  toBase: 6.89476 },
    { id: 'bar', name: 'bar',  toBase: 100 },
    { id: 'atm', name: 'atm',  toBase: 101.325 },
    { id: 'mmHg',name: 'mmHg', toBase: 0.133322 },
  ],
  concentration: [
    { id: 'mgL',         name: 'mg/L',                                toBase: 1 },
    { id: 'ppm',         name: 'ppm (≈ mg/L, agua diluida)',          toBase: 1 },
    { id: 'ugL',         name: 'µg/L (ppb)',                          toBase: 0.001 },
    { id: 'gm3',         name: 'g/m³ (= mg/L)',                       toBase: 1 },
    { id: 'mgm3',        name: 'mg/m³',                               toBase: 0.001 },
    { id: 'gL',          name: 'g/L',                                 toBase: 1000 },
    { id: 'kgm3',        name: 'kg/m³',                               toBase: 1000 },
    { id: 'lbMgalUS',    name: 'lb / millón US gal (trat. agua, USA)', toBase: 0.1198264273 },
    { id: 'lb100galUS',  name: 'lb / 100 US gal (tanques, USA)',      toBase: 1198.264273 },
    { id: 'ozGalUSmass', name: 'oz masa / US gal (USA)',              toBase: 7489.086034 },
  ],
  ionic: [
    { id: 'meqL',     name: 'meq/L (solución o agua)',                            toBase: 1,    group: 'solution' },
    { id: 'cmolL',    name: 'cmol(+)/L (solución)',                              toBase: 10,   group: 'solution' },
    { id: 'mmolL',    name: 'mmol/L (monovalente ≈ meq/L)',                     toBase: 1,    group: 'solution' },
    { id: 'umolL',    name: 'µmol/L (monovalente; 1000 µmol/L ≈ 1 meq/L)',      toBase: 0.001,group: 'solution' },
    { id: 'meq100g',  name: 'meq/100 g (suelo, CIC)',                            toBase: 1,    group: 'soil' },
    { id: 'cmolKg',   name: 'cmolc/kg = cmol(+)/kg (suelo)',                     toBase: 1,    group: 'soil' },
  ],
};

export const MEASURE_SPECIAL_CATEGORIES = ['rootReachPlant', 'rootReachBed'] as const;
```

### 1.4 Standard conversion formula

For all categories except `temperature` and the special root-reach categories:

```
baseValue = inputValue * fromUnit.toBase
outVal    = baseValue / toUnit.toBase
// rounded to 6 decimal places: Math.round(outVal * 1e6) / 1e6
```

For `temperature` (special-cased):
```
// first convert input → Celsius
if fromUnit.id === 'F': c = (num - 32) * 5 / 9
else if fromUnit.id === 'K': c = num - 273.15
else: c = num  // already °C

// then convert celsius → target
if toUnit.id === 'F': outVal = c * 9 / 5 + 32
else if toUnit.id === 'K': outVal = c + 273.15
else: outVal = c
```

For `ionic` cross-group attempt (soil ↔ solution): output is `—` with tooltip `"No se puede convertir entre unidades de suelo y de solución. Elige unidades del mismo grupo."` (only blocks conversion when both units carry a `group` and the groups differ).

### 1.5 Root-reach surface estimator (special categories)

#### `rootReachPlant` — % surface via plant circles × density

```
if plantsHa is null AND rowM > 0 AND inrowM > 0:
    plantsHa = round(10000 / (rowM * inrowM), 1)

if mode === 'radius':    r = size
else (diameter or orilla): r = size / 2   // 'orilla' also divides by 2 (treats orilla-to-orilla as diameter)

areaPlant = π * r^2
totalM2   = areaPlant * plantsHa
pct       = min(100, round((totalM2 / 10000) * 100, 1))
// "Superposición" flag when uncapped pct > 100 → displayed as 100%
```

Detail string (ES): `"Área por planta ≈ <areaPlant> m² (r = <r> m) · <plantsHa> plantas/ha → <totalM2> m²/ha[ · Superposición: círculos suman más de 1 ha; se muestra 100 % máximo.] · Usa este % en balance hídrico → raíces en superficie / franja regada."`

#### `rootReachBed` — % surface via bed fraction × row spacing

Validation: if `bedW > rowSpacing` → output `—` with message "El ancho de cama no puede ser mayor que la distancia entre surcos."

```
effectiveBed = bedW * (reachPct / 100)
pct          = round((effectiveBed / rowSpacing) * 100, 1)
m2Ha         = round(pct * 100, 0)   // m²/ha
```

Detail string (ES): `"Fracción surco: <bedW> m cama ÷ <rowSpacing> m entre surcos[ × <reachPct>% raíz en cama] → <m2Ha> m²/ha con raíces · Usa este % en balance hídrico."`

### 1.6 Helper functions

```ts
function measureRound(n: number | null, dec?: number): number | null {
  if (!Number.isFinite(n as number)) return null;
  const f = Math.pow(10, dec != null ? dec : 2);
  return Math.round((n as number) * f) / f;
}
```

### 1.7 UX notes (non-obvious)

- The standard panel (`measure-standard-panel`) and special panel (`measure-special-panel`) toggle visibility based on category.
- `measure-from` and `measure-to` are re-populated when category changes; defaults are `list[0]` and `list[1]` (or `list[0]` if only one item).
- `measure-ionic-hint` shows only when category = `ionic`.
- For `ionic` cross-group conversions: result is `—` plus a tooltip — conversion is blocked (not zeroed) to communicate the semantic mismatch.
- Round result to **6 decimal places** for the standard converter.
- All numeric input is parsed with `parseFloat`; empty/invalid → result is cleared (not 0).

---

<a id="tool-2"></a>
## Tool 2 — VPD Estimator

- **English name:** Vapor Pressure Deficit (VPD) Estimator
- **Original Spanish:** Estimador de déficit de presión de vapor
- **File:** `vpd-free.html`
- **Purpose:** Estimate atmospheric Vapor Pressure Deficit (kPa) and Humidity Deficit (g/m³) from air temperature and relative humidity, with optional leaf-temperature or solar-radiation inputs. Includes an interactive map that fetches live weather from Open-Meteo.

### 2.1 Inputs

| id                    | label                                   | unit | default | range     |
|-----------------------|-----------------------------------------|------|---------|-----------|
| `vpd-free-lat`        | Latitud                                 | °    | 19.4326 | -90..90   |
| `vpd-free-lng`        | Longitud                                | °    | -99.1332| -180..180 |
| `vpd-env-temp`        | Temperatura del Aire (simple)           | °C   | ''      | any       |
| `vpd-env-humidity`    | Humedad Relativa (simple)               | %    | ''      | 0–100     |
| `vpd-adv-air-temp`    | Temperatura del Aire (avanzado)         | °C   | ''      | any       |
| `vpd-adv-humidity`    | Humedad Relativa (avanzado)             | %    | ''      | 0–100     |
| `vpd-mode-free` (radio) | Modo: `leaf` (default) or `radiation` | —    | `leaf`  | enum      |
| `vpd-leaf-temp`       | Temperatura de Hoja                     | °C   | ''      | any (when mode=leaf) |
| `vpd-solar-radiation` | Radiación Solar                         | W/m² | ''      | any (when mode=radiation) |

### 2.2 Outputs (rendered into `vpd-environmental-results` and `vpd-advanced-results`)

| name                  | label                                  | unit  | formula |
|-----------------------|----------------------------------------|-------|---------|
| VPD                   | Déficit de Presión de Vapor            | kPa   | see 2.3 |
| HD (humidity deficit) | Déficit de Humedad                     | g/m³  | see 2.3 |
| Leaf temp (calc)      | Temperatura de Hoja Calculada          | °C    | see 2.3 (when radiation mode) |
| Solar radiation       | ☀️ Radiación solar                     | W/m²  | from API (when fetched) |
| UV Index              | 🟣 Índice UV                           | —     | from API (when fetched) |
| HD class badge        | DH/HD label + color                    | —     | see 2.4 |
| Range chart           | VPD position bar 0–3 kPa               | —     | see 2.6 |

### 2.3 Formulas

**Saturation Vapor Pressure (Tetens / Murray 1967):**
```
SVP_T  = 0.6108 * exp(17.27 * T / (T + 237.3))   // kPa, T in °C
```

**Saturation Absolute Humidity (polynomial fit, g/m³ vs T°C):**
```
satAbsHum(T) = 5.018 + 0.32321*T + 0.0081847*T^2 + 0.00031243*T^3
```

**Simple environmental VPD** (`calculateVPDSimple`):
```
es = SVP_T(airTemp)
ea = es * (humidity / 100)
vpd = es - ea                                  // kPa, rounded 2 dp
hd  = satAbsHum(airTemp) * ((100 - humidity) / 100)   // g/m³, rounded 2 dp
```

**Leaf temperature from solar radiation** (`calculateLeafTempFromRadiation`):
```
if solarRadiation > 200:
    leafTemp = airTemp + (((solarRadiation - 200) * 0.6) / 100)
else:
    leafTemp = airTemp
// rounded 1 dp
```

**Advanced VPD** (`calculateVPDAdvanced`) — uses leaf temperature for `es_leaf` but air temperature for `ea`:
```
esLeaf = SVP_T(leafTemp)
esAir  = SVP_T(airTemp)
ea     = esAir * (airHumidity / 100)
vpd    = esLeaf - ea                           // kPa, rounded 2 dp
hd     = satAbsHum(leafTemp) - satAbsHum(airTemp) * (airHumidity / 100)  // g/m³, rounded 2 dp
```

### 2.4 HD classification (`getHumidityDeficitClass`)

| Range (g/m³) | Label ES / EN            | Message ES                                | Color    | Background |
|--------------|--------------------------|-------------------------------------------|----------|------------|
| not finite   | N/D / N/A                | Sin dato suficiente / Not enough data     | `#64748b`| `#f8fafc`  |
| `< 3`        | Muy bajo / Very low      | Ambiente húmedo / baja demanda evaporativa| `#2563eb`| `#eff6ff`  |
| `< 6`        | Bajo-moderado / Low-mod  | Demanda manejable                         | `#16a34a`| `#f0fdf4`  |
| `< 10`       | Moderado / Moderate      | Transpiración activa; vigilar sensible    | `#ca8a04`| `#fefce8`  |
| `<= 15`      | Alto / High              | Alta demanda evaporativa                  | `#ea580c`| `#fff7ed`  |
| `> 15`       | Muy alto / Very high     | Demanda muy alta; validar en campo        | `#dc2626`| `#fef2f2`  |

```ts
function getHumidityDeficitClass(hd: number) {
  if (!Number.isFinite(hd)) return { label: 'N/D', message: 'Sin dato suficiente', color: '#64748b', bg: '#f8fafc' };
  if (hd < 3)  return { label: 'Muy bajo',       message: 'Ambiente húmedo / baja demanda evaporativa', color: '#2563eb', bg: '#eff6ff' };
  if (hd < 6)  return { label: 'Bajo-moderado',  message: 'Demanda manejable',                          color: '#16a34a', bg: '#f0fdf4' };
  if (hd < 10) return { label: 'Moderado',       message: 'Transpiración activa; vigilar cultivo sensible', color: '#ca8a04', bg: '#fefce8' };
  if (hd <= 15)return { label: 'Alto',           message: 'Alta demanda evaporativa',                  color: '#ea580c', bg: '#fff7ed' };
  return            { label: 'Muy alto',         message: 'Demanda muy alta; validar en campo',        color: '#dc2626', bg: '#fef2f2' };
}
```

### 2.5 UV Index classification (only when fetched from API)

| Range | Label ES / EN      | Color     | Background |
|-------|--------------------|-----------|------------|
| ≤ 2   | Bajo / Low         | `#166534` | `#dcfce7`  |
| ≤ 5   | Moderado / Moderate| `#92400e` | `#fef3c7`  |
| ≤ 7   | Alto / High        | `#b45309` | `#ffedd5`  |
| ≤ 10  | Muy alto / Very high | `#be123c` | `#ffe4e6`  |
| > 10  | Extremo (default)  | `#6d28d9` | `#ede9fe`  |

### 2.6 VPD range chart (`createVPDRangeChart`)

A horizontal gradient bar from 0 to 3.0 kPa showing the current VPD position with a marker. Renders inline HTML/CSS (no external chart library).

**Constants:**
```ts
const VPD_CHART = {
  minVPD: 0,
  maxVPD: 3.0,
  optimalMin: 0.5,
  optimalMax: 1.5,
};
```

**Status classification:**
```ts
function vpdStatus(vpd: number) {
  if (vpd < 0.5) return { color: '#3b82f6', label: 'Bajo' };    // blue
  if (vpd > 1.5) return { color: '#ef4444', label: 'Alto' };    // red
  return            { color: '#10b981', label: 'Óptimo' };      // green
}
```

**Bar gradient** (CSS `linear-gradient(to right, ...)`):
- 0% to ~17% (0.5/3.0): blue band (#3b82f6 → #22d3ee transition)
- ~17% to ~50% (1.5/3.0): green band (#10b981)
- ~50% to 100%: yellow→orange→red band (#fbbf24 → #fb923c → #f97316 → #f87171 → #ef4444 → #dc2626)

Tick labels at 0.5 increments from 0.5 to 3.0 kPa. Position of marker = `clamp(((vpd - 0) / 3.0) * 100, 0, 100)%`. White vertical dividers at 0.5 and 1.5 kPa positions indicate optimal range boundaries.

### 2.7 Map + weather fetch (Open-Meteo API)

**Endpoint:**
```
GET https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lng>
   &current=temperature_2m,relative_humidity_2m,shortwave_radiation,uv_index
```

**Response parsing** (from `data.current`):
- `temperature_2m` → temperature (°C)
- `relative_humidity_2m` → humidity (%)
- `shortwave_radiation` → solar radiation (W/m²), may be null/NaN
- `uv_index` → UV index, may be null/NaN

**Map:** Leaflet 1.9.4 with Esri World Imagery tiles (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`). Default center: `19.4326, -99.1332` (Mexico City), zoom 5. Marker is draggable; clicking the map moves the marker.

**Behavior after weather fetch:**
1. Fills `vpd-env-temp`, `vpd-env-humidity`, `vpd-adv-air-temp`, `vpd-adv-humidity` (rounded humidity to integer).
2. If `shortwave_radiation >= 0` and finite → also fills `vpd-solar-radiation` (rounded), switches advanced radio to `radiation`, computes leaf temp from radiation, and uses **advanced VPD** formula.
3. Otherwise → uses **simple VPD** formula.
4. Results render into `vpd-environmental-results` (the simple panel's results area) showing: VPD, HD badge, optional solar radiation tile, optional UV index tile, plus the range chart.
5. **Lock behavior:** sets `vpdFreeEnvSimpleLockedAfterSatellite = true`, disabling the manual "Calcular VPD" button in the simple panel and showing a hint until the user clicks "Limpiar valores".

### 2.8 Validation rules

- Simple/advanced calc: alert `"⚠️ Por favor ingresa temperatura del aire y humedad relativa"` if either value is NaN.
- Humidity must be `0 ≤ h ≤ 100`, else alert `"⚠️ La humedad relativa debe estar entre 0 y 100%"`.
- Advanced leaf mode: alert if leaf temp missing. Radiation mode: alert if solar radiation missing.

### 2.9 Non-obvious UX

- Three panels stacked: (1) map/weather fetch, (2) simple environmental estimator (T + RH), (3) advanced estimator (T + RH + leaf/radiation mode toggle).
- Radio toggle `toggleVPDModeFree()` swaps visibility between `vpd-leaf-input` and `vpd-radiation-input`.
- "Limpiar valores" (`vpdFreeClearEnvironmentalSimple`) clears inputs, results, and unlocks the simple panel.
- Geolocation: `vpdFreeUseMyLocation()` uses `window.NpFreeGeo.requestLocation({ retry: true, t })` (from `assets/np-free-geolocation.js`).
- Spanish/English bilingual via `t(es, en)` helper detecting language from page title regex `/\b(Vapor Pressure|Deficit|Calculator|Results|Humidity)\b/i`.
- Local persistence: `window.NpFreePersist.bind('vpd', snap, apply)` for IDs `['vpd-free-lat','vpd-free-lng','vpd-env-temp','vpd-env-humidity','vpd-adv-air-temp','vpd-adv-humidity','vpd-leaf-temp','vpd-solar-radiation']` plus the radio mode.

---

<a id="tool-3"></a>
## Tool 3 — Water Hardness Diagnostic

- **English name:** Water Hardness & Acid Conditioning Diagnostic
- **Original Spanish:** Diagnóstico de agua y acondicionamiento
- **File:** `agua-dureza-free.html`
- **Purpose:** Three-section tool: (1) live two-way hardness unit conversions with classification, (2) compute hardness as CaCO₃ from lab Ca + Mg values, (3) compute acid dose (mL/m³ and total L) to neutralize HCO₃⁻ + CO₃²⁻ with a target residual buffer.

### 3.1 Section 1 — Hardness unit converter

#### Inputs (text fields, `inputmode="decimal"`, accept comma or dot)

| id            | label                              | data-hardness | unit  |
|---------------|------------------------------------|---------------|-------|
| `hardnessPpm` | Dureza como CaCO₃ (ppm o mg/L)     | `ppm`         | mg/L  |
| `hardnessMeq` | Dureza (meq/L)                     | `meq`         | meq/L |
| `hardnessDh`  | Dureza (°dH)                       | `dh`          | °dH   |
| `hardnessEh`  | Dureza (°e)                        | `eh`          | °e    |
| `hardnessFh`  | Dureza (°fH)                       | `fh`          | °fH   |

#### Outputs

| id               | label                                       | formula |
|------------------|---------------------------------------------|---------|
| `hardnessClass`  | `Clasificación: <cls>` pill                 | from `hardnessClassByPpm(ppm)` |
| `hardnessSummary`| summary text with all 5 unit equivalents    | see below |

#### Constants

```ts
const EQ_CACO3             = 50.043;                 // mg CaCO₃ per meq/L
const PPM_CACO3_PER_PPM_CA = 100.086 / 40.078;       // ≈ 2.4972
const PPM_CACO3_PER_PPM_MG = 100.086 / 24.305;       // ≈ 4.1180
const PPM_PER_DH           = 17.848;                  // mg/L per °dH (German)
const PPM_PER_EH           = 14.254;                  // mg/L per °e (English / Clark)
const PPM_PER_FH           = 10.0;                    // mg/L per °fH (French)
```

#### Conversion formulas

```
// All fields are derived from a canonical ppm (mg/L CaCO₃) value:
meq = ppm / EQ_CACO3
dH  = ppm / PPM_PER_DH
eH  = ppm / PPM_PER_EH
fH  = ppm / PPM_PER_FH

// And the inverse (when the user edits a non-ppm field):
ppm_from_meq = meq * EQ_CACO3
ppm_from_dh  = dh  * PPM_PER_DH
ppm_from_eh  = eh  * PPM_PER_EH
ppm_from_fh  = fh  * PPM_PER_FH
```

#### Classification (`hardnessClassByPpm`)

| ppm range (CaCO₃) | Label ES           |
|-------------------|--------------------|
| `< 60`            | Blanda             |
| `60 to < 120`     | Moderadamente dura |
| `120 to < 180`    | Dura               |
| `>= 180`          | Muy dura           |

```ts
function hardnessClassByPpm(ppm: number): string {
  if (ppm < 60)  return 'Blanda';
  if (ppm < 120) return 'Moderadamente dura';
  if (ppm < 180) return 'Dura';
  return 'Muy dura';
}
```

#### Reference table (shown in UI, from USGS)

| Classification        | mg/L CaCO₃   | meq/L          | °dH            | °fH            | °e (Clark)     |
|-----------------------|--------------|----------------|----------------|----------------|----------------|
| Blanda (Soft)         | < 60         | < 1.20         | < 3.36         | < 6.0          | < 4.21         |
| Moderadamente dura    | 60 to < 120  | 1.20 to < 2.40 | 3.36 to < 6.72 | 6.0 to < 12.0  | 4.21 to < 8.42 |
| Dura (Hard)           | 120 to < 180 | 2.40 to < 3.60 | 6.72 to < 10.08| 12.0 to < 18.0 | 8.42 to < 12.63|
| Muy dura (Very hard)  | >= 180       | >= 3.60        | >= 10.08       | >= 18.0        | >= 12.63       |

#### UX

- All 5 fields start empty. Typing in any one converts and writes the other 4 on `input`. On `focusout` (blur) the active field is normalized to 2 decimals.
- If all 5 fields become empty (after a blur where the active field was cleared), all fields are cleared and the classification resets to `—`.
- Numeric parser `n(v)` returns `max(0, parseFloat(String(v).replace(',', '.')) || 0)`.
- Display formatter `f(v, d=2)` → `(parseFloat(v) || 0).toFixed(d)`.

### 3.2 Section 2 — Hardness from Ca + Mg

#### Inputs

| id           | label                          | data-ion | unit select id | unit options    |
|--------------|--------------------------------|----------|----------------|-----------------|
| `caLab`      | Calcio (Ca)                    | `ca`     | `caLabUnit`    | `ppm` (default) / `meq` |
| `mgLab`      | Magnesio (Mg)                  | `mg`     | `mgLabUnit`    | `ppm` (default) / `meq` |

#### Output

| id           | label                                       | formula |
|--------------|---------------------------------------------|---------|
| `labCaco3Out`| Dureza total como CaCO₃ (readonly)          | `partCa + partMg` |
| `labClass`   | `Clasificación: <cls>` violet pill          | `hardnessClassByPpm(total)` |
| `labSummary` | detail lines for Ca and Mg contributions    | see below |

#### Formulas

```ts
function caco3FromCaPpmOrMeq(v: number, unit: 'ppm' | 'meq'): number {
  if (unit === 'meq') return v * EQ_CACO3;
  return v * PPM_CACO3_PER_PPM_CA;
}
function caco3FromMgPpmOrMeq(v: number, unit: 'ppm' | 'meq'): number {
  if (unit === 'meq') return v * EQ_CACO3;
  return v * PPM_CACO3_PER_PPM_MG;
}

const partCa = caco3FromCaPpmOrMeq(vCa, uCa);
const partMg = caco3FromMgPpmOrMeq(vMg, uMg);
const total  = partCa + partMg;          // ppm CaCO₃
const cls    = hardnessClassByPpm(total);
```

#### Summary text pattern

```
Ca: <vCa> [ppm|meq/L] → <partCa> ppm eq. CaCO₃.   (or "Ca: no indicado (0 en la suma)." if empty)
Mg: <vMg> [ppm|meq/L] → <partMg> ppm eq. CaCO₃.   (or "Mg: no indicado (0 en la suma)." if empty)
Suma durezas iónicas: <partCa> + <partMg> = <total> ppm como CaCO₃ · <cls>.
```

### 3.3 Section 3 — Acid dose to neutralize HCO₃⁻ + CO₃²⁻

#### Inputs

| id              | label                                | unit                | default | notes |
|-----------------|--------------------------------------|---------------------|---------|-------|
| `hco3Meq`       | HCO₃⁻ (meq/L)                       | meq/L               | ''      | data-acid-num="1" |
| `co3Meq`        | CO₃²⁻ (meq/L)                       | meq/L               | ''      | data-acid-num="1" |
| `residualMeq`   | Residual objetivo (meq/L)           | meq/L               | ''      | buffer left un-neutralized |
| `waterVolumeL`  | Volumen de preparación              | L or m³             | ''      | data-acid-vol="1" |
| `waterVolumeUnit` | Unit select for volume            | `L` (default) / `m³` | `L`     | |
| `acidSelect`    | Ácido (select)                      | —                   | `acido_nitrico_55` | populated from `acids` |

#### Acids lookup table

```ts
const ACIDS = [
  { id: 'acido_nitrico_55',   name: 'Ácido Nítrico 55%',   meqPerMl: 11.6, densityKgL: 1.37 },
  { id: 'acido_sulfurico_98', name: 'Ácido Sulfúrico 98%', meqPerMl: 36.7, densityKgL: 1.84 },
  { id: 'acido_fosforico_75', name: 'Ácido Fosfórico 75%', meqPerMl: 12.0, densityKgL: 1.57 },
  { id: 'acido_fosforico_85', name: 'Ácido Fosfórico 85%', meqPerMl: 14.6, densityKgL: 1.69 },
];
```

#### Output (`acidResult`)

```
Meq/L a neutralizar = (hco3 + co3) − residual = <needMeq> meq/L
Dosis = <mlPerM3> mL/m³ de ácido (<kgPerM3Water> kg de ácido / m³ de agua, aprox.)
Para <vol.inputValue> [L|m³] de agua (<volM3> m³ / <volL> L): <totalLAcid> L de ácido (<totalMl> mL) · aprox. <kgTotal> kg
```

#### Formulas

```ts
function getAcidVolume() {
  // returns { raw, unit, inputValue, volL, volM3 }
  // volM3 = unit === 'm3' ? inputValue : inputValue / 1000
  // volL  = unit === 'm3' ? inputValue * 1000 : inputValue
}

const acid      = ACIDS.find(a => a.id === selectedAcidId) ?? ACIDS[0];
const meqPerMl  = acid.meqPerMl;
const rho       = acid.densityKgL;     // kg per L of acid

const sourceMeq = hco3 + co3;
const needMeq   = Math.max(0, sourceMeq - residual);    // meq/L
const meqPerM3  = needMeq * 1000;                       // meq per m³ of water
const mlPerM3   = meqPerMl > 0 ? meqPerM3 / meqPerMl : 0; // mL acid per m³ water
const totalMl   = mlPerM3 * volM3;
const totalLAcid = totalMl / 1000;
const kgPerM3Water = (mlPerM3 / 1000) * rho;            // kg acid per m³ water
const kgTotal   = totalLAcid * rho;
```

#### Volume equivalence line (`volM3Equiv`)

```
"Volumen usado: <inputValue> [L|m³] = <volM3> m³ = <volL> L."
```

#### UX

- When volume is empty or invalid → `setAcidPlaceholderUI()` shows placeholder text and the volume equivalence reads `"Equivale a — m³ de agua (solo referencia)."`.
- All acid inputs use `data-acid-num="1"` for blur normalization to 2 dp.
- Volume unit change updates the input placeholder (`'ej. 0.2'` for m³, `'ej. 200'` for L) and re-runs calc.
- Warning: `"⚠️ Referencia técnica: no neutralizar al 100% por defecto. Ajusta con colchón (residual objetivo) y valida pH final de la solución."`
- Tips: foliar compatibility, EPP (PPE) for acid handling.

### 3.4 Persistence

`window.NpFreePersist.bind('agua_dureza', snapshotAcidHardness, applyAcidHardness)` persists all section 1/2/3 field values + units + acid id.

---

<a id="tool-4"></a>
## Tool 4 — Amendment Balance by CEC

- **English name:** Amendment Balance by CEC (Cation Exchange Capacity)
- **Original Spanish:** Balance de enmiendas por CIC (ajuste de CIC del suelo)
- **File:** `enmienda-free.html`
- **Purpose:** Capture soil cation analysis (meq/100g), auto-compute CEC and ideal cation distribution, auto-suggest per-cation meq/100g adjustments, then compute kg/ha of selected amendments (gypsum, lime, dolomite, MgSO₄, SOP) needed to satisfy Ca/Mg/K/SO₄ deficits.

### 4.1 Ideal cation ranges (displayed, also used for status icons)

| Cation | Ideal range (% of CEC) | Color class      |
|--------|------------------------|------------------|
| K⁺     | 3–7%                   | `cation-good`    |
| Ca²⁺   | 65–75%                 | `cation-good`    |
| Mg²⁺   | 10–15%                 | `cation-good`    |
| H⁺     | 0–10%                  | `cation-warning` |
| Na⁺    | 0–1%                   | `cation-warning` |
| Al³⁺   | 0–1%                   | `cation-warning` |

```ts
const IDEAL_CATION_RANGES = {
  k:  { min: 3,  max: 7  },
  ca: { min: 65, max: 75 },
  mg: { min: 10, max: 15 },
  h:  { min: 0,  max: 10 },
  na: { min: 0,  max: 1  },
  al: { min: 0,  max: 1  },
};
```

### 4.2 Soil texture → typical CEC reference table

| Textura orientativa | CIC típica (meq/100g or cmol⁺/kg) |
|---------------------|------------------------------------|
| Arenosa (Sandy)     | ~ 3 – 8                            |
| Franca (Loam)       | ~ 10 – 20                          |
| Arcillosa (Clayey)  | ~ 20 – 40+                         |

### 4.3 Inputs

#### Soil analysis (meq/100g or cmol⁺/kg — numerically identical)

| id            | label | default | step  |
|---------------|-------|---------|-------|
| `k-initial`   | K⁺    | 0.00    | 0.01  |
| `ca-initial`  | Ca²⁺  | 0.00    | 0.01  |
| `mg-initial`  | Mg²⁺  | 0.00    | 0.01  |
| `h-initial`   | H⁺    | 0.00    | 0.01  |
| `na-initial`  | Na⁺   | 0.00    | 0.01  |
| `al-initial`  | Al³⁺  | 0.00    | 0.01  |

#### Computed (readonly)

| id         | label    | formula |
|------------|----------|---------|
| `cic-total`| CIC Total| `sum(k + ca + mg + h + na + al)` rounded to 2 dp |

#### Per-cation percent displays (computed, not editable)

`k-percent`, `ca-percent`, `mg-percent`, `h-percent`, `na-percent`, `al-percent` → `((value / cic) * 100).toFixed(1) + '%'` (or `'0.0%'` when cic=0).

#### Status icons

`k-status`, `ca-status`, `mg-status`, `h-status`, `na-status`, `al-status`:
- `'-'` when value is NaN or 0
- `'✅'` when `minRange ≤ pct ≤ maxRange`
- `'⚠️'` when `pct > maxRange`
- `'❌'` when `pct < minRange`

#### Soil properties

| id                  | label                          | unit    | default | range |
|---------------------|--------------------------------|---------|---------|-------|
| `soil-density`      | Densidad aparente              | g/cm³   | 1.1     | >0    |
| `soil-depth`        | Profundidad                    | cm      | 30      | >0    |
| `soil-ph`           | pH del suelo                   | —       | ''      | 4.0–9.0 |
| `ph-indicator` (out)| pH indicator badge             | —       | —       | dynamic |

#### Target meq/100g adjustments (auto-filled, but editable)

| id         | label                    | default |
|------------|--------------------------|---------|
| `k-target`  | K⁺ (meq a ajustar)      | 0.00    |
| `ca-target` | Ca²⁺ (meq a ajustar)    | 0.00    |
| `mg-target` | Mg²⁺ (meq a ajustar)    | 0.00    |
| `h-target`  | H⁺ (meq a ajustar)      | 0.00    |
| `na-target` | Na⁺ (meq a ajustar)     | 0.00    |
| `al-target` | Al³⁺ (meq a ajustar)    | 0.00    |

> Positive = deficit (needs amendment); negative = excess.

#### Soil reach

| id                    | label                              | unit | default | range |
|-----------------------|------------------------------------|------|---------|-------|
| `soil-reach-percent`  | Suelo explorado por raíces (%)     | %    | 100     | 10–100 (clamped) |

#### Buttons

- `calculate-amendment` → 🧮 Calcular Enmienda
- `reset-amendment` → 🔄 Reiniciar

### 4.4 Auto-computed adjustments (`calculateAutomaticAdjustments`)

Ideal values are computed from CIC using fixed fractions (NOT the range midpoints — uses upper bounds for ca/mg and 5% for K):

```ts
function calculateIdealValues(cic: number) {
  return {
    k:  +(cic * 0.05).toFixed(2),   // 5% of CEC
    ca: +(cic * 0.75).toFixed(2),   // 75% of CEC (upper bound of 65–75 range)
    mg: +(cic * 0.15).toFixed(2),   // 15% of CEC (upper bound of 10–15 range)
    h:  0,
    na: 0,
    al: 0,
  };
}

// adjustment = ideal - current, for each cation
// These auto-populate the *-target fields whenever CIC changes.
```

### 4.5 pH indicator (`updatePHIndicator`)

| pH range   | Label ES        | Class              | Icon |
|------------|-----------------|--------------------|------|
| empty / 0  | Ingrese pH      | `ph-indicator`     | ⚪   |
| `< 6.5`    | Ácido           | `ph-acid`          | 🔴   |
| `6.5–7.2`  | Neutro          | `ph-neutral`       | 🟢   |
| `> 7.2`    | Alcalino        | `ph-alkaline`      | 🟡   |

### 4.6 Amendment database (`BASE_AMENDMENTS`)

```ts
type Amendment = {
  id: string;
  name: string;
  formula: string;
  molecularWeight: number;
  ca: number;   // % w/w
  mg: number;   // % w/w
  k: number;    // % w/w
  so4: number;  // % w/w
  co3: number;  // % w/w
  h2o: number;  // % w/w
  si: number;   // % w/w
  type: 'sulfate' | 'carbonate' | 'custom';
};

const BASE_AMENDMENTS: Amendment[] = [
  { id: 'gypsum',       name: 'Yeso Agrícola',                       formula: 'CaSO4·2H2O',      molecularWeight: 172.2, ca: 23.3, mg: 0,    k: 0,    so4: 55.8, co3: 0,    h2o: 20.9, si: 0, type: 'sulfate'   },
  { id: 'lime',         name: 'Cal Agrícola',                        formula: 'CaCO3',           molecularWeight: 100,   ca: 40.0, mg: 0,    k: 0,    so4: 0,    co3: 60,   h2o: 0,    si: 0, type: 'carbonate' },
  { id: 'dolomite',     name: 'Cal Dolomítica',                      formula: 'CaCO3 + MgCO3',   molecularWeight: 184,   ca: 21.7, mg: 13.2, k: 0,    so4: 0,    co3: 65.2, h2o: 0,    si: 0, type: 'carbonate' },
  { id: 'mgso4-mono',   name: 'Sulfato de Magnesio Monohidrato',     formula: 'MgSO4·H2O',       molecularWeight: 138,   ca: 0,    mg: 17,   k: 0,    so4: 69,   co3: 0,    h2o: 14,   si: 0, type: 'sulfate'   },
  { id: 'sop-granular', name: 'Sulfato de Potasio Granular',         formula: 'K2SO4',           molecularWeight: 174,   ca: 0,    mg: 0,    k: 41.5, so4: 54.1, co3: 0,    h2o: 0,    si: 0, type: 'sulfate'   },
];
```

Users can: select/deselect amendments (`toggleAmendmentSelection`), edit composition via modal (`editAmendment`), and (UI exists for) adding a new custom amendment. The amendments database is mutable in-memory (a deep clone of `BASE_AMENDMENTS`).

### 4.7 Conversion formulas

#### meq/100g → kg/ha (`convertMeqToKgHa`)

```ts
function convertMeqToKgHa(meq: number, pesoEquivalente: number) {
  const densidadAparente = soilDensity;                  // g/cm³
  const profundidad      = soilDepth / 100;              // m
  // pesoEquivalente is the equivalent weight of the cation (g/eq):
  //   Ca²⁺: 20.04 g/eq, Mg²⁺: 12.15 g/eq, K⁺: 39.10 g/eq, Na⁺: 23.00 g/eq
  return meq * pesoEquivalente * 10 * (100 * 100 * profundidad * densidadAparente) / 1000;
}
```

Equivalent weights used (hardcoded at call sites):
- Ca²⁺: `20.04`
- Mg²⁺: `12.15`
- K⁺: `39.1`

#### kg/ha → meq/100g inverse (`convertKgHaToMeq`)

```ts
function convertKgHaToMeq(kgHa: number, pesoMolecular: number) {
  // NOTE: parameter named pesoMolecular in source but is actually the same equivalent weight
  return kgHa / (pesoMolecular * 10 * (100 * 100 * profundidad * densidadAparente) / 1000);
}
```

### 4.8 Amendment strategy algorithm (`calcularEstrategiaEnmiendas`)

**Inputs:** `selectedAmendments` (array of `Amendment`), `necesidades = { ca, mg, k, so4, pH }` (meq/100g deficits, all clamped to ≥ 0 except so4 which is derived from Na excess — see below).

**SO₄ need derivation:** when calling from `calculateAmendment`, `so4 = naTarget < 0 ? Math.abs(naTarget) : 0` (i.e. Na excess → use gypsum for Na displacement).

**Equivalent weights used:** Ca²⁺ 20.04, Mg²⁺ 12.15, K⁺ 39.1.

**Algorithm:**

```text
1. Initialize caRestante = necesidades.ca, mgRestante = necesidades.mg,
   kRestante  = necesidades.k, so4Necesario = necesidades.so4.

2. DOLomite priority (if dolomite selected AND ca>0 AND mg>0):
   - caKgHaNeeded = convertMeqToKgHa(caRestante, 20.04)
   - mgKgHaNeeded = convertMeqToKgHa(mgRestante, 12.15)
   - caAmount   = caKgHaNeeded / (dolomite.ca / 100)
   - mgAmount   = mgKgHaNeeded / (dolomite.mg / 100)
   - dosisDolomita = max(caAmount, mgAmount)
   - push { tipo: 'dolomite', dosis: dosisDolomita }
   - caRestante = max(0, caRestante - convertKgHaToMeq(dosisDolomita * (dolomite.ca/100), 20.04))
   - mgRestante = max(0, mgRestante - convertKgHaToMeq(dosisDolomita * (dolomite.mg/100), 12.15))

3. If caRestante > 0:
   - If gypsum selected: dosis = convertMeqToKgHa(caRestante, 20.04) / (gypsum.ca/100);
                          push { tipo: 'gypsum', dosis }; caRestante = 0.
   - Else if lime selected: dosis = convertMeqToKgHa(caRestante, 20.04) / (lime.ca/100);
                            push { tipo: 'lime', dosis }; caRestante = 0.

4. If mgRestante > 0 AND mgso4-mono selected:
   - dosis = convertMeqToKgHa(mgRestante, 12.15) / (mgso4.mg/100)
   - push { tipo: 'mgso4-mono', dosis }; mgRestante = 0.

5. If kRestante > 0 AND sop-granular selected:
   - dosis = convertMeqToKgHa(kRestante, 39.1) / (sop.k/100)
   - push { tipo: 'sop-granular', dosis }; kRestante = 0.

6. Compute SO₄ already contributed:
   so4YaAportado = Σ (strategy[i].dosis * (amendment.so4 / 100))
   so4Restante   = max(0, so4Necesario - so4YaAportado)
   If so4Restante > 0 AND gypsum selected:
       push { tipo: 'gypsum', dosis: so4Restante / (gypsum.so4/100) }  // (so4 expressed as kg/ha, no eq-weight)

7. Filter out entries with dosis < 100 (kg/ha minimum threshold).
8. Return strategy array.
```

### 4.9 Result rendering (`showCombinedAmendmentResults`)

For each strategy entry, compute element contributions (kg/ha):
```
amount = strategy.dosis
ca     = amount * (amendment.ca  / 100)
mg     = amount * (amendment.mg  / 100)
k      = amount * (amendment.k   / 100)
so4    = amount * (amendment.so4 / 100)
si     = amount * (amendment.si  / 100)
```

Apply root-reach factor `factor = reachPercent / 100` to `amount`, `k`, `ca`, `mg`, `so4`, `si` for the displayed totals and per-row values.

**Outputs:**
- **Total contributions** list (only non-zero entries shown): K⁺, Ca²⁺, Mg²⁺, SO₄²⁻, Si (all kg/ha).
- **Detail table** per amendment: columns = Enmienda, Cantidad (kg/ha), K⁺, Ca²⁺, Mg²⁺, SO₄²⁻, Si.
- Footer note: "% del volumen de suelo explorado por raíces (<reachPercent>%)."
- Empty-state message if no amendments meet the threshold: `"No se requieren enmiendas con las seleccionadas actuales."`

### 4.10 UX notes

- `cic-total` is **readonly** and recomputed live on every `input` event of any of the 6 initial-cation fields.
- Target fields auto-populate from `calculateAutomaticAdjustments()` whenever CIC changes, but the user can override them before clicking Calculate.
- `soil-reach-percent` clamps to `[10, 100]` and silently corrects to `100` when empty or NaN.
- Reset button restores: all initial = 0.00, all target = 0.00, cic-total = 0.00, density = 1.1, depth = 30, pH = '', reach = 100, results hidden.
- Bilingual via `t(es, en)` detecting English from page title regex `/\b(Amendment|Calculator|Adjust|Results|Soil)\b/i`.
- Persistence: `window.NpFreePersist.bind('enmienda', snap, apply)` for the 17 IDs listed.

---

<a id="tool-5"></a>
## Tool 5 — Mineralizable N Estimation

- **English name:** Mineralizable Nitrogen Estimation
- **Original Spanish:** Estimación de N mineralizable
- **File:** `n-mineralizable-mo-free.html`
- **Purpose:** Estimate the order-of-magnitude annual mineralizable N (kg N/ha/year) released from soil organic matter, given soil depth, bulk density, root-exploration fraction, organic-matter content, N fraction in OM, and an annual mineralization rate.

### 5.1 Inputs

| id       | label                                          | unit    | default | range     | group |
|----------|------------------------------------------------|---------|---------|-----------|-------|
| `inMO`   | Materia orgánica del suelo                     | %       | 2       | 0–100     | A     |
| `inDA`   | Densidad aparente (DA)                         | g/cm³   | 1.20    | 0.5–2.5   | A     |
| `inP`    | Profundidad efectiva                           | cm      | 30      | 1–200     | A     |
| `inR`    | Suelo explorado por raíces                     | %       | 70      | 1–100     | A     |
| `inNmo`  | Fracción de N en la materia orgánica (adv.)    | %       | 5       | 0.1–20    | A (advanced) |
| `rangeTmin` | Slider for T_min                            | %       | 2       | 1–3 (0.1 step) | B |
| `inTmin` | Editable numeric for T_min (synced with slider)| %      | 2       | 1–3 (0.1 step) | B |

### 5.2 Outputs

| id           | label                                       | unit              | formula |
|--------------|---------------------------------------------|-------------------|---------|
| `outMtotal`  | Masa de suelo total evaluada                | kg suelo / ha     | `10000 * (P/100) * DA * 1000` |
| `outMeff`    | Masa de suelo efectiva por raíz             | kg suelo / ha     | `Mtotal * (R/100)` |
| `outMOkg`    | Materia orgánica estimada                   | kg MO / ha        | `Meff * (MO/100)` |
| `outNorg`    | N orgánico total estimado                   | kg N / ha         | `MOkg * (Nmo/100)` |
| `outNmin`    | **N potencialmente mineralizable (anual)**  | kg N / ha / año   | `Norg * (Tmin/100)` |

### 5.3 Master formula (as displayed in the tool)

```
N_min = 10000 × (P/100) × DA × 1000 × (R/100) × (MO/100) × (N_MO/100) × (T_min/100)
```

Where:
- `P` = effective depth (cm)
- `DA` = bulk density (g/cm³)
- `R` = root-exploration fraction (%)
- `MO` = organic matter content (%)
- `N_MO` = N fraction in OM (%) — typically ~5%
- `T_min` = annual mineralization rate (%) — typically 1–3%

### 5.4 Intermediate chain (matches the displayed formula-note)

```
Mtotal = 10000 [m²/ha] × (P/100) [m] × DA [g/cm³] × 1000 [cm³/L → kg/m³ conversion in source]
       = kg soil / ha over depth P
Meff   = Mtotal × (R/100)
MOkg   = Meff × (MO/100)
Norg   = MOkg × (Nmo/100)
Nmin   = Norg × (Tmin/100)
```

> Note on units in source: `10000 * (P/100) * DA * 1000` — `10000` m²/ha, `(P/100)` converts cm→m, `DA` is g/cm³, `1000` converts g/cm³ → kg/m³ effectively. The chain yields kg/ha.

### 5.5 Numeric parsing & formatting

```ts
function parseNum(el: HTMLInputElement, fallback: number): number {
  const v = parseFloat(String(el.value).replace(',', '.'));
  return Number.isFinite(v) ? v : fallback;
}
function fmt(v: number, d: number): string {
  if (!Number.isFinite(v)) return '—';
  return v.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function clamp(x: number, a: number, b: number): number { return Math.min(b, Math.max(a, x)); }
```

Each input is clamped at compute time:
- `R` → `clamp(R, 1, 100)`
- `MO` → `clamp(MO, 0, 100)`
- `Nmo` → `clamp(Nmo, 0.1, 100)`
- `Tmin` → `clamp(Tmin, 1, 3)`
- (P and DA are NOT clamped in source — use `parseNum` fallback)

### 5.6 T_min presets and slider sync

```ts
const TMIN_PRESETS = [
  { tmin: 1, label: 'Conservador · 1 %', title: 'Suelo frío, seco, compactado o baja actividad biológica' },
  { tmin: 2, label: 'Medio · 2 %',       title: 'Condición agrícola promedio', active: true },
  { tmin: 3, label: 'Alto · 3 %',        title: 'Suelo cálido, húmedo, aireado, alta actividad biológica' },
];
```

- Slider `rangeTmin` (range input, min=1, max=3, step=0.1) and numeric input `inTmin` are kept in sync via `syncTminFromSlider` and `syncTminFromInput`.
- `tminDisplay` shows current value formatted with 1 dp + ` %` (es-MX locale uses comma decimal).
- Preset buttons are highlighted as "active" when `Math.abs(parseFloat(preset.tmin) - currentTmin) < 0.05`.
- Clicking a preset sets both slider and input to `tmin.toFixed(1)` then calls `syncTminFromSlider()`.

### 5.7 Reference tables (displayed in UI)

#### % of soil explored by root system

| Sistema                          | % sugerido |
|----------------------------------|------------|
| Cultivo extensivo cerrado        | 80 – 100   |
| Hortaliza en cama o surco        | 50 – 80    |
| Berry en cama                    | 40 – 70    |
| Aguacate joven                   | 20 – 50    |
| Aguacate adulto                  | 50 – 80    |
| Frutal con calles amplias        | 40 – 70    |
| Frutal con cobertura activa      | 60 – 90    |

#### Mineralization rate by condition

| Opción       | Tasa | Uso sugerido                                                          |
|--------------|------|-----------------------------------------------------------------------|
| Conservador  | 1 %  | Suelo frío, seco, compactado o baja actividad biológica              |
| Medio        | 2 %  | Condición agrícola promedio (default)                                |
| Alto         | 3 %  | Suelo cálido, húmedo, aireado, alta actividad biológica             |

### 5.8 Default NutriPlant suggestion

Default for `inR` is **70 %**. UI note: *"Sugerido por defecto en NutriPlant: 70 %. Para frutales/aguacate suele usarse con frecuencia 50–70 % según sistema."*

### 5.9 Output formatting precision

| Output field  | Decimals |
|---------------|----------|
| `outMtotal`   | 0        |
| `outMeff`     | 0        |
| `outMOkg`     | 0        |
| `outNorg`     | 1        |
| `outNmin`     | 2        |

### 5.10 UX notes

- Layout: two columns on desktop (`tool-col-inputs` and `tool-col-results`), single column on mobile. The results column is sticky on desktop.
- Warning tile: *"⚠️ Resultado orientativo: sensible a DA, profundidad, % explorado y T_min. Validar con observación en campo y experiencia local."*
- `inNmo` (N fraction in OM) lives inside a `<details class="advanced">` element (collapsed by default).
- Persistence: `window.NpFreePersist.bind('n_mineralizable_mo', snap, apply)` for IDs `['inP','inDA','inR','inMO','inNmo','inTmin']`. After restore, `rangeTmin` is also synced.

---

<a id="shared"></a>
## Shared / Cross-cutting patterns

### A. Local persistence (`np-free-local-persist.js` — not part of the 5 files but referenced by all)

All tools call `window.NpFreePersist.bind(toolKey, snapshotFn, applyFn)` where:
- `snapshotFn()` returns a plain object of field IDs → values (via `window.NpFreePersist.collectIds(IDS)`).
- `applyFn(d)` restores field values via `window.NpFreePersist.applyIds(d, IDS)` and re-runs the compute function.
- Each tool registers a unique key (`'vpd'`, `'agua_dureza'`, `'enmienda'`, `'n_mineralizable_mo'`).

For React reimplementation: replace with a `useState`/`useLocalStorage` hook keyed by tool name.

### B. Embed mode

All HTML tools detect `?embed=login` or `?embed=dashboard` in the URL and add a class to `<html>` (`embed-login` / `embed-dashboard`) which:
- Hides the `.np-free-tool-head` (title + watermark) in login embed.
- Switches the layout to a more compact grid in dashboard embed.
- Shows the `.embed-lead` intro paragraph.

### C. Bilingual support

Several tools (VPD, enmienda) implement an inline `t(es, en)` helper that detects English UI by regex on the page title. The detection regexes:
- VPD: `/\b(Vapor Pressure|Deficit|Calculator|Results|Humidity)\b/i`
- Enmienda: `/\b(Amendment|Calculator|Adjust|Results|Soil)\b/i`

For React reimplementation: prefer the existing i18n infrastructure (`/home/z/my-project/src/lib/language-store.ts`).

### D. Numeric parsing

- Most tools accept both `,` and `.` as decimal separator via `String(v).replace(',', '.')`.
- `Math.max(0, …)` is commonly applied to physical inputs to prevent negatives.
- Output rounding varies per field (see each tool).

### E. External dependencies

| Tool        | External JS / API |
|-------------|-------------------|
| VPD         | Leaflet 1.9.4 (CDN unpkg), Esri World Imagery tiles, Open-Meteo API (`https://api.open-meteo.com/v1/forecast`), `assets/np-free-geolocation.js`, `assets/np-free-local-persist.js` |
| Agua dureza | (none beyond local persist) |
| Enmienda    | (none beyond local persist) |
| N-min       | (none beyond local persist) |
| Measure-units | (none — pure JS, no external deps) |

### F. Suggested file layout for React reimplementation

```
src/components/agri/free-tools/
  measure-units/
    MeasureUnitsConverter.tsx
    measureUnitsData.ts          // MEASURE_UNITS, MEASURE_SPECIAL_CATEGORIES, helpers
    RootReachPlant.tsx
    RootReachBed.tsx
  vpd/
    VpdEstimator.tsx
    vpdFormulas.ts               // calculateVPDSimple, calculateVPDAdvanced, satAbsHum, leafTempFromRadiation
    vpdClassifications.ts        // getHumidityDeficitClass, UV_INDEX, VPD_CHART
    VpdRangeChart.tsx
    WeatherMap.tsx               // optional Leaflet wrapper
  agua-dureza/
    WaterHardnessDiagnostic.tsx
    aguaDurezaData.ts            // EQ_CACO3, PPM_CACO3_PER_PPM_*, PPM_PER_*, ACIDS, hardnessClassByPpm
    HardnessConverter.tsx
    HardnessFromCaMg.tsx
    AcidNeutralization.tsx
  enmienda/
    AmendmentBalanceCec.tsx
    enmiendaData.ts              // BASE_AMENDMENTS, IDEAL_CATION_RANGES, SOIL_TEXTURE_CEC
    enmiendaStrategy.ts          // calcularEstrategiaEnmiendas, convertMeqToKgHa, convertKgHaToMeq
    AmendmentTable.tsx
  n-mineralizable/
    MineralizableNEstimator.tsx
    nMineralizableData.ts        // TMIN_PRESETS, ROOT_REACH_BY_SYSTEM table
    nMineralizableFormulas.ts    // Mtotal, Meff, MOkg, Norg, Nmin
```

---

**End of Batch A spec.**
