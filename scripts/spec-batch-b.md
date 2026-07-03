# NutriPlant PRO — Free Tools Batch B — Logic & Data Specification

**Task ID:** 1-b
**Agent:** general-purpose
**Source files (in `/tmp/np_tools/`):**
- `hidro-solucion-free.html` (3188 lines — Hydroponic nutrient solution designer; **largest, most complex**)
- `granular-mix-free.html` (479 lines — Granular mix formulation)
- `fertilizer-composition-free.html` (798 lines — Fertilizer composition % via chemical formula)
- `extraccion-etapa-free.html` (1487 lines — Nutrient distribution by phenological stage %)

**Purpose:** Self-contained spec so another agent can reimplement each tool as a React/TypeScript component. All formulas, constants, lookup tables, classifications and non-obvious UX behaviors are reproduced here as TS-friendly literals.

**External script dependencies referenced but NOT present in the workspace** (must be reconstructed from this spec or shipped separately):
- `assets/fert-formula-engine.js` → exposes `window.FertFormulaEngine.tryCompFromFormula(rawFormula)` returning `{ok: boolean, comp?, normalized?, error?}`. The formula engine itself is fully reproduced in **Tool 3** below (it was inlined there) — reuse that parser for `fertAporteApplyFormulaToRow`.
- `assets/hydro-fert-aporte-catalog.js` → exposes `window.HydroFertAporteCatalog` with a built-in product list plus per-browser user materials (localStorage). The exact built-in catalog was **not available** in the workspace; reconstruct from the references found in `hidro-solucion-free.html` (key surface area captured in Tool 1 § "External catalog surface"). The default material id is `nitrato_calcio_cristal`; another referenced id is `mkp`.
- `assets/np-free-local-persist.js` → exposes `window.NpFreePersist.load(toolKey)` / `.bind(toolKey, snapshotFn, applyFn)` for localStorage persistence in Granular Mix and Fertilizer Composition tools.

---

## TOC

1. [Tool 1 — Hydroponic Nutrient Solution Designer (hidro-solucion-free.html)](#tool-1)
2. [Tool 2 — Granular Mix Formulation (granular-mix-free.html)](#tool-2)
3. [Tool 3 — Fertilizer Composition % (fertilizer-composition-free.html)](#tool-3)
4. [Tool 4 — Nutrient Distribution by Stage % (extraccion-etapa-free.html)](#tool-4)
5. [Shared / cross-cutting patterns](#shared)
6. [Suggested React/TS file layout](#layout)

---

<a id="tool-1"></a>
## Tool 1 — Hydroponic Nutrient Solution Designer

- **English name:** Hydroponic Nutrient Solution Designer
- **Spanish name:** Diseño de solución nutritiva
- **File:** `/tmp/np_tools/hidro-solucion-free.html` (3188 lines)
- **Purpose:** Two-tab tool. Tab 1 ("Diseño objetivo") lets the user design a hydroponic solution by editing CE (dS/m), meq/L per ion, or ppm per ion — values propagate bidirectionally; a draggable ternary diagram (anions N-NO₃⁻/P-H₂PO₄⁻/S-SO₄²⁻ and cations K⁺/Ca²⁺/Mg²⁺) drives the % meq distribution. Tab 2 ("Aporte fertilizantes") computes ppm and meq/L contributed by each fertilizer in a mix (≤5 products) given a dose (g/L = kg/m³) and the product's elemental % composition, with reverse-calculation (enter target ppm/meq for one nutrient → tool rescales doses).

### Constants

```ts
// Ions in the meq table (display order: anions · Cl · cations · NH₄)
const HYDRO_ANIONS = ['N_NO3', 'P', 'S'];
const HYDRO_CATIONS_TRIANGLE = ['K', 'Ca', 'Mg'];
const HYDRO_MEQ_NUTRIENTS = ['N_NO3', 'P', 'S', 'Cl', 'K', 'Ca', 'Mg', 'N_NH4'];
const HYDRO_MEQ_CE_PARTICIPANTS = ['N_NO3', 'P', 'S', 'Cl', 'K', 'Ca', 'Mg', 'N_NH4'];
const HYDRO_MICROS: string[] = []; // Free version: no micros in ppm table

// Equivalent weights (g/eq) — multiply meq/L → ppm (mg/L)
const HYDRO_EQ_WEIGHTS = {
  N_NO3: 14.0,
  N_NH4: 14.0,
  P:    31.0,
  K:    39.1,
  Ca:   20.04,
  Mg:   12.15,
  S:    16.03,
  Cl:   35.45,
};

// Ternary equilibrium zone polygons (vertex percents as [top, left, right])
const HYDRO_ANION_LIMITS  = { NO3: [20, 80],   H2PO4: [1.25, 10], SO4: [10, 70] };
const HYDRO_CATION_LIMITS = { K:   [10, 65],   Ca:    [22.5, 62.5], Mg: [0.5, 40] };

function hydroEquilibriumPolygonAnions() {
  // Each tuple: [NO3 %, H2PO4 %, SO4 %]
  return [[20, 10, 70], [28.75, 1.25, 70], [80, 1.25, 18.75], [80, 10, 10]];
}
function hydroEquilibriumPolygonCations() {
  // Each tuple: [K %, Ca %, Mg %]
  return [
    [10, 62.5, 27.5], [32.5, 62.5, 5], [65, 30, 5],
    [65, 22.5, 12.5], [37.5, 22.5, 40], [10, 50, 40],
  ];
}

const HYDRO_LS_KEY = 'nutriplant_hydro_solucion_free_v1';
const HYDRO_LS_VERSION = 3;
const FERT_APORTE_MAX_ROWS = 5;

// Drag/drop timing (ms) — UX details
const HYDRO_PPM_FULL_RENDER_MS = 480;
const HYDRO_CE_APPLY_MS = 450;

// Ternary SVG geometry
const TERNARY_SVG = { width: 460, height: 430, pad: 44 };
// vTop   = { x: width/2,     y: pad }
// vLeft  = { x: pad,         y: pad + base*√3/2 }
// vRight = { x: width - pad, y: pad + base*√3/2 }
// where base = width - 2*pad = 372
```

### Input fields (Tab 1 — Design)

| id / data attr | label | unit | default | notes |
|---|---|---|---|---|
| `input[data-field="ce"]` | CE | dS/m | "0.00" | text input; comma→dot parsing; editable while typing (don't re-render until blur, see UX) |
| `input[data-type="meq"][data-nutrient="N_NO3"]` | N-NO₃⁻ (meq/L) | meq/L | 0 | step=0.01, min=0 |
| `input[data-type="meq"][data-nutrient="P"]` | P-H₂PO₄⁻ (meq/L) | meq/L | 0 | |
| `input[data-type="meq"][data-nutrient="S"]` | S-SO₄²⁻ (meq/L) | meq/L | 0 | |
| `input[data-type="meq"][data-nutrient="Cl"]` | Cl⁻ (meq/L) | meq/L | 0 | adds to CE but outside N-P-S triangle |
| `input[data-type="meq"][data-nutrient="K"]` | K⁺ (meq/L) | meq/L | 0 | |
| `input[data-type="meq"][data-nutrient="Ca"]` | Ca²⁺ (meq/L) | meq/L | 0 | |
| `input[data-type="meq"][data-nutrient="Mg"]` | Mg²⁺ (meq/L) | meq/L | 0 | |
| `input[data-type="meq"][data-nutrient="N_NH4"]` | N-NH₄⁺ (meq/L) | meq/L | 0 | outside K-Ca-Mg triangle; % shown over total cations |
| `input[data-type="ppm"][data-nutrient="…"]` | (same ions, ppm) | ppm (mg/L) | 0 | text input (inputmode=decimal) for macros; Cl uses type=number |
| `#hydroTabBtnDesign` / `#hydroTabBtnFert` | Top tab buttons | — | design active | toggles `hydroActiveMainTab` 0/1 |

### Output fields (Tab 1)

- **`#hydroMeqTableWrap`** → CE input + meq/L editable table (computed from ppm or CE bootstrap).
- **`#hydroMeqPercentWrap`** → % meq table (read-only). For N-NO₃/P/S: % over sum of N-NO₃+P+S. For Cl: % over (N-NO₃+P+S+Cl). For K/Ca/Mg: % over (K+Ca+Mg). For N-NH₄: % over (K+Ca+Mg+N-NH₄).
- **`#hydroPpmTableWrap`** → ppm table (editable; converts to meq live).
- **`#hydroTriangleCombined`** → SVG ternary diagram, draggable markers (yellow square = anions, red circle = K-Ca-Mg cations). Edge labels: bottom = K⁺/NO₃⁻, right = Ca²⁺/H₂PO₄⁻, left = Mg²⁺/SO₄²⁻.
- **`#hydroTriangleInfoCombined`** → two chips summarizing anion and cation % splits.
- **`#hydroNitrogenSummaryText`** → compact summary: ΣN meq/L, %NO₃ over N, %NH₄ over N, %NO₃ over (NO₃+Cl), %Cl over (NO₃+Cl).
- **`#hydroNNLegend`** → text block with extended N + Cl partition info (only shown when N or Cl > 0).

### Formulas

```
CE (dS/m) = Σ meq/L  /  20
         (Σ over: N_NO3 + N_NH4 + P + S + Cl + K + Ca + Mg)

ppm(ion)  = meq/L(ion) × EQ_WEIGHT[ion]
meq/L(ion) = ppm(ion) / EQ_WEIGHT[ion]

% meq anion (N_NO3, P, S)  =  meq(ion) / (meq(N_NO3)+meq(P)+meq(S)) × 100
% meq Cl                   =  meq(Cl)   / (meq(N_NO3)+meq(P)+meq(S)+meq(Cl)) × 100
% meq cation (K, Ca, Mg)   =  meq(ion) / (meq(K)+meq(Ca)+meq(Mg)) × 100
% meq N_NH4                =  meq(N_NH4) / (meq(K)+meq(Ca)+meq(Mg)+meq(N_NH4)) × 100

// When user enters a target CE with all meq/L = 0 → bootstrap:
totalTriangleMeq = CE × 20  −  meq(N_NH4)  −  meq(Cl)
third            = max(0, totalTriangleMeq) / 6
meq(N_NO3) = meq(P) = meq(S) = meq(K) = meq(Ca) = meq(Mg) = round2(third)
// NH₄ is NOT auto-bootstrapped; user must enter it.

// When user enters CE with non-zero meq already → scale all ions (keep %):
factor = (CE × 20) / currentΣmeq
meq[n] = round2( meq[n] × factor )   for every n in HYDRO_MEQ_CE_PARTICIPANTS

// Triangle drag → converts barycentric % back to meq:
// Anion drag: pTop=NO3, pLeft=P, pRight=S
sumAn = meq(N_NO3) + meq(P) + meq(S)        // if 0, default to 30
meq(N_NO3) = round2( sumAn × pTop   / 100 )
meq(P)     = round2( sumAn × pLeft  / 100 )
meq(S)     = round2( sumAn × pRight / 100 )
// Cation drag: pTop=K, pLeft=Ca, pRight=Mg  (Ca/Mg NOT swapped)
sumKcm = meq(K) + meq(Ca) + meq(Mg)          // if 0, default to 30
meq(K)  = round2( sumKcm × pTop   / 100 )
meq(Ca) = round2( sumKcm × pLeft  / 100 )
meq(Mg) = round2( sumKcm × pRight / 100 )

// If triangle is empty (all zeros) and user starts dragging:
//   use CE×20 if CE>0, else default 30 meq/L total split into 6 equal parts.

round2(v) = Math.round(v × 100) / 100
```

#### Triangle coordinate transforms (barycentric ↔ Cartesian)

```
// Triangle vertices (top, left, right) — top is apex, left/right are bottom corners
// Barycentric to Cartesian:
//   x = (vA.x × pA + vB.x × pB + vC.x × pC) / 100
//   y = (vA.y × pA + vB.y × pB + vC.y × pC) / 100
//   where pA + pB + pC = 100 (each is a percent)

// Cartesian → barycentric (for drag):
//   denom = (vL.y − vR.y)(vT.x − vR.x) + (vR.x − vL.x)(vT.y − vR.y)
//   wTop   = ((vL.y − vR.y)(x − vR.x) + (vR.x − vL.x)(y − vR.y)) / denom
//   wLeft  = ((vR.y − vT.y)(x − vR.x) + (vT.x − vR.x)(y − vR.y)) / denom
//   wRight = 1 − wTop − wLeft
//   clamp each to ≥0, then renormalize so sum=100; return percents.
//   If denom ~ 0 or all weights ~ 0, return 33.33/33.33/33.34.
```

#### Equilibrium polygon clip

The cation polygon is clipped by a dashed red line from `(10, 50, 40)` to `(65, 25, 15)` (after normalizing to 100%). Anions polygon stays full. Use Sutherland-Hodgman clipping (`hydroClipPolygonByLine`).

### Classification / categorization logic

| Group | Ions | Marker / color |
|---|---|---|
| Anions (triangle) | N-NO₃⁻, P-H₂PO₄⁻, S-SO₄²⁻ | Yellow square, amber border |
| Cl⁻ (outside triangle) | Cl⁻ | Tan, italic % label |
| Cations (triangle) | K⁺, Ca²⁺, Mg²⁺ | Red circle, red border |
| N-NH₄⁺ (outside triangle) | N-NH₄⁺ | Pink/rose, italic % label |
| CE (header) | — | Purple-tinted input |

### Non-obvious UX (Tab 1)

1. **Bidirectional editing** — typing in meq updates ppm + % + CE; typing in ppm updates meq + % + CE; editing CE scales all meq (or bootstraps if all zero).
2. **PPM typing preservation** — while typing in a ppm cell, the input value is preserved as raw text (`hydroPpmTyping.raw`) for 480 ms before full re-render, so intermediate values like "1" don't snap to "1.0". After 480 ms of no input, the full table re-renders and focus is restored to the same cell with the original cursor position.
3. **CE typing preservation** — CE input has its own typing buffer (`hydroCeTyping`) and 450 ms apply timer; only on blur does it commit and force a re-render of the CE cell.
4. **Triangle drag** — `pointerdown` on the yellow square (`data-tern-role="an"`) or red circle (`data-tern-role="cat"`) starts a pointer-captured drag; `pointermove` recomputes barycentric % and applies it via `hydroApplyAnionPct` / `hydroApplyCationPct`. Uses `requestAnimationFrame` to throttle redraws.
5. **Marker separation** — if anion and cation markers land on the same point, they're offset by ~24 px along the angle between them (so both stay visible/draggable).
6. **Inside/outside polygon** — marker fill changes when dragged outside the equilibrium polygon (anion: `#eab308` → `#b45309`; cation: `#ef4444` → `#dc2626`).
7. **Bootstrap-on-empty** — when the user drags a marker but all meq are 0 and no CE is set, the tool seeds 30 meq/L total split equally into the six triangle ions (5 meq/L each).
8. **Auto-save** — debounced 280 ms to `localStorage[HYDRO_LS_KEY]`. On `beforeunload` a final save is forced.
9. **Cl sync** — `hydroSyncClMeqPpm(stage)` is called before any read of Cl so meq.Cl and ppm.Cl stay consistent (whichever the user edited wins).
10. **Scroll position preservation** — when re-rendering the meq/ppm/% tables, the horizontal scroll position of the previous container is captured and reapplied.

### Tab 2 — Aporte fertilizantes (fertilizer contribution)

#### Inputs

| Field | Element | Default | Notes |
|---|---|---|---|
| Product select | `<select data-fert-field="material">` | `nitrato_calcio_cristal` | Optgroups: "Catálogo NutriPlant", "Mis fertilizantes", "Uso puntual" (INLINE_FORMULA_ID + INLINE_PCT_ID) |
| Formula | `<input data-fert-field="formula">` | `""` | Read-only for catalog materials; editable for inline-formula and user_formula kind |
| Dose | `<input data-fert-field="dose">` | 0 | g/L = kg/m³; comma→dot parsing |
| Composition % per ion | `<input data-fert-comp="N_NO3">` etc. | from catalog | Editable for inline kinds; read-only display for catalog rows (shown in compact grid) |
| "+ Agregar fila al cálculo" | `#fertAporteAddBtn` | — | Max 5 rows; disabled when full |
| "Vaciar mezcla" | `#fertAporteClearBtn` | — | Hidden when no rows |
| Total meq targets | `<input data-fert-target-kind="meq" data-fert-target-nutrient="…">` | blank | Edit → on blur, rescale doses to hit target |
| Total ppm targets | `<input data-fert-target-kind="ppm" data-fert-target-nutrient="…">` | blank | Same reverse-calc |

#### Custom fertilizer panel ("➕ Agregar fertilizante a mi lista")

Two sub-tabs (`data-fert-custom-mode`):
- `formula` — name + chemical formula → calls `FertFormulaEngine.tryCompFromFormula()` to compute composition; stored with `kind: 'formula'`.
- `percent` — name + manual % grid (one input per ion KEY) → stored with `kind: 'percent'`.

User materials persist via `HydroFertAporteCatalog.getUserMaterialsSnapshot()` / `.loadUserMaterials()` (browser-local). Each entry has `{id, name, kind, formula?, comp, isUser: true}`.

#### Formulas (Tab 2)

```
// Per-row contribution (dose in g/L, comp in % elemental):
row.totals.meq[ion] = (dose × 10) × comp[ion]/100  /  EQ_WEIGHT[ion]
row.totals.ppm[ion] = (dose × 10) × comp[ion]/100

// Sum across rows → totals.meq, totals.ppm
// (factor 10 because 1 g/L = 1000 mg/L and comp is %; so 1000 × pct/100 = 10 × pct)

// Reverse target → doses:
// Case A: currentVal > 0  → scale all non-zero doses by factor = target / currentVal
//   (for micros, only scale rows that actually contain that micro)
// Case B: currentVal = 0  → pick the row with highest comp[n] and set its dose:
//   dose = ppmTarget / (10 × comp[n])

// % meq group (display under meq totals):
//   anion %:  meq[ion] / (meq(N_NO3)+meq(P)+meq(S)) × 100
//   cation %: meq[ion] / (meq(K)+meq(Ca)+meq(Mg)) × 100
//   Cl and N_NH4 → muted (no % shown)

fertAporteFormatDose(d) = Math.round(d × 10000) / 10000
fertAporteFormatPct(v)  = Number(v).toFixed(4)
fertAporteParseDose(raw) = parseFloat(String(raw).replace(',', '.')) || 0  (≥0)
```

#### External catalog surface (window.HydroFertAporteCatalog)

The HTML references but does not embed the catalog JS. Surface area reconstructed from call sites:

```ts
interface HydroFertAporteCatalog {
  KEYS: string[];            // ['N_NO3','N_NH4','P','S','Cl','K','Ca','Mg','Fe','Mn','B','Zn','Cu','Mo']
  MACRO_KEYS: string[];      // ['N_NO3','N_NH4','P','S','Cl','K','Ca','Mg']
  MICRO_KEYS: string[];      // ['Fe','Mn','B','Zn','Cu','Mo']
  EQ: Record<string, number>;// same as HYDRO_EQ_WEIGHTS
  INLINE_FORMULA_ID: string; // material id for "write a formula inline"
  INLINE_PCT_ID: string;     // material id for "enter % inline"
  zeroComp(): Record<string, number>;
  cloneComp(comp): Record<string, number>;
  getById(id): { id, name, formula?, compNutriPlant, blend?, isUser?, kind? } | null;
  getCatalogList(): Array<{id, name, formula?, compNutriPlant, isUser, kind?}>;
  isInlineKind(id): boolean;
  isEditablePctRow(id): boolean;
  rowTotals(dose, compUsed): { meq: Record<string, number>, ppm: Record<string, number> };
  sumRows(rows): { meq: Record<string, number>, ppm: Record<string, number> };
  addUserMaterial({name, kind, formula?, comp}): {ok: boolean, error?};
  removeUserMaterial(id): void;
  getUserMaterialsSnapshot(): any;
  loadUserMaterials(snapshot: any): void;
}
```

The known built-in material IDs referenced in the HTML are: `nitrato_calcio_cristal` (default for new rows), `mkp` (used when clicking the big "+ Agregar fila" button). The full built-in catalog must be supplied — the React port can reuse the `BASE_MATERIALS` formula list from **Tool 3** below plus a manual `%` analysis for blends (e.g. calcium nitrate granular = `5Ca(NO3)2+NH4NO3+10H2O`).

### Non-obvious UX (Tab 2)

1. **Two main tabs** (`hydroTabBtnDesign` / `hydroTabBtnFert`) — only one panel visible at a time; switching to Fert tab triggers `renderFertAporteAll()`.
2. **Composition grid** is grouped by ion family with subtle dividers (anion / Cl / cation / NH₄ / micros); micro cells only appear if the row has non-zero micro %.
3. **Inline formula row** — when the user picks "Uso puntual · Fórmula", the formula input becomes editable and a "Calcular %" button appears; clicking it runs `FertFormulaEngine.tryCompFromFormula()` and fills the composition grid.
4. **Inline % row** — all % cells are editable, no formula. Used for entering a supplier's blend analysis directly.
5. **Target inputs** in totals row (meq and ppm) — on blur (or Enter key), reverse-compute doses to hit that target. Shows a status message via `fertCustomSetMsg(text, ok)`.
6. **Saved user materials** — listed below the form; each has "Usar" (adds a new row with that material) and "Quitar" (removes the material and reverts any rows using it to INLINE_PCT_ID).
7. **Max 5 rows** enforced; the "+ Agregar" button label switches to `Máximo 5 productos en la mezcla` when full.
8. **Per-row aporte chips** — under each row, a horizontal scroll strip shows each ion's meq + ppm contribution (only for ions with >0.001 meq or ppm).
9. **Micro totals** — only shown if at least one row has a non-zero micro; otherwise the micro totals table is hidden.

### Charts / visualizations

- **Ternary diagram (SVG, 460×430)** — single triangle with two markers (yellow square = anion split, red circle = cation split). Equilibrium zones drawn as semi-transparent polygons (amber for anions, red for cations). Cation zone is clipped by a dashed red "55% K max" line from (10,50,40)→(65,25,15). Grid lines at 10% intervals. Edge labels: K⁺/NO₃⁻ (bottom), Ca²⁺/H₂PO₄⁻ (right), Mg²⁺/SO₄²⁻ (left). Drag uses pointer events + `setPointerCapture`.

### Embedded data tables (none)

No HTML data tables — everything is JS-rendered.

---

<a id="tool-2"></a>
## Tool 2 — Granular Mix Formulation

- **English name:** Granular Mix Formulation
- **Spanish name:** Formulación de mezclas granulares
- **File:** `/tmp/np_tools/granular-mix-free.html` (479 lines)
- **Purpose:** Build a granular fertilizer blend by selecting fertilizers from a catalog and entering each one's % by ton (TM); the tool computes the resulting N-P₂O₅-K₂O + secondary/micro analysis of the blend, the NPK ratio, and the kg/ha of each nutrient for a chosen blend dose.

### Constants

```ts
const LS_CUSTOM = 'np_login_granular_mix_customs_v1';
const KEYS = ['N','P2O5','K2O','CaO','MgO','SO4','Fe','Mn','B','Zn','Cu','Mo','SiO2'];

const MATERIAL_NAME_EN: Record<string, string> = {
  'Fosfonitrato 33-03-00': 'Nitrophosphate 33-03-00',
  'Sulfato de Amonio Granular': 'Granular Ammonium Sulfate',
  'Superfosfato Simple': 'Single Superphosphate',
  'Superfosfato Triple': 'Triple Superphosphate',
  'Sulfato de Potasio': 'Potassium Sulfate',
  'Cloruro de Potasio': 'Potassium Chloride',
  'Nitrato de Potasio': 'Potassium Nitrate',
  'Silicato de Potasio': 'Potassium Silicate',
  'Nitrato de Calcio': 'Calcium Nitrate',
  'Sulfato de K y Mg': 'Potassium Magnesium Sulfate',
  'Sulfato de Magnesio': 'Magnesium Sulfate',
  'Sulfato de Hierro': 'Iron Sulfate',
  'Sulfato de Manganeso': 'Manganese Sulfate',
  'Sulfato de Zinc': 'Zinc Sulfate',
  'Boro Granular': 'Granular Boron',
  'Sulfato de Cobre': 'Copper Sulfate',
  'Molibdato de Sodio': 'Sodium Molybdate',
};

const BASE_MATERIALS: Record<string, Record<string, number>> = {
  'Urea':                       { N:46,  P2O5:0,  K2O:0,  CaO:0,    S:0, SO4:0,    MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Fosfonitrato 33-03-00':      { N:33,  P2O5:3,  K2O:0,  CaO:0,    S:0, SO4:0,    MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Sulfato de Amonio Granular': { N:21,  P2O5:0,  K2O:0,  CaO:0,    S:0, SO4:72,   MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'DAP':                        { N:18,  P2O5:46, K2O:0,  CaO:0,    S:0, SO4:0,    MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'MAP':                        { N:11,  P2O5:52, K2O:0,  CaO:0,    S:0, SO4:0,    MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Superfosfato Simple':        { N:0,   P2O5:18, K2O:0,  CaO:12,   S:0, SO4:12,   MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Superfosfato Triple':        { N:0,   P2O5:45, K2O:0,  CaO:13,   S:0, SO4:0,    MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Sulfato de Potasio':         { N:0,   P2O5:0,  K2O:50, CaO:0,    S:0, SO4:52,   MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Cloruro de Potasio':         { N:0,   P2O5:0,  K2O:60, CaO:0,    S:0, SO4:0,    MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Nitrato de Potasio':         { N:13,  P2O5:0,  K2O:46, CaO:0,    S:0, SO4:0,    MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Silicato de Potasio':        { N:0,   P2O5:0,  K2O:23, CaO:0,    S:0, SO4:0,    MgO:0,    SiO2:26,   Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Nitrato de Calcio':          { N:15.5,P2O5:0,  K2O:0,  CaO:26,   S:0, SO4:0,    MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Sulfato de K y Mg':          { N:0,   P2O5:0,  K2O:22, CaO:0,    S:0, SO4:68.91,MgO:18,   SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Sulfato de Magnesio':        { N:0,   P2O5:0,  K2O:0,  CaO:0,    S:0, SO4:40,   MgO:16,   SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Sulfato de Hierro':          { N:0,   P2O5:0,  K2O:0,  CaO:0,    S:0, SO4:55,   MgO:0,    SiO2:0,    Zn:0,    Fe:20,  B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Sulfato de Manganeso':       { N:0,   P2O5:0,  K2O:0,  CaO:0,    S:0, SO4:55,   MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:32,   Cu:0,    Mo:0   },
  'Sulfato de Zinc':            { N:0,   P2O5:0,  K2O:0,  CaO:0,    S:0, SO4:52,   MgO:0,    SiO2:0,    Zn:36,   Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
  'Boro Granular':              { N:0,   P2O5:0,  K2O:0,  CaO:0,    S:0, SO4:0,    MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:15,    Mn:0,    Cu:0,    Mo:0   },
  'Sulfato de Cobre':           { N:0,   P2O5:0,  K2O:0,  CaO:0,    S:0, SO4:37,   MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:25,   Mo:0   },
  'Molibdato de Sodio':         { N:0,   P2O5:0,  K2O:0,  CaO:0,    S:0, SO4:0,    MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:39  },
  'Micro Mix':                  { N:0,   P2O5:0,  K2O:0,  CaO:0,    S:0, SO4:6.25, MgO:4,    SiO2:0,    Zn:4,    Fe:8,   B:1,     Mn:1,    Cu:0,    Mo:0.06},
  'Complejo 12-11-18':          { N:12,  P2O5:11, K2O:18, CaO:0,    S:0, SO4:24,   MgO:2.7,  SiO2:0,    Zn:0.02, Fe:0.2, B:0.015, Mn:0.02, Cu:0,    Mo:0   },
  'Complejo 12-12-17':          { N:12,  P2O5:12, K2O:17, CaO:0,    S:0, SO4:24,   MgO:2,    SiO2:0,    Zn:0.01, Fe:0,   B:0.02,  Mn:0,    Cu:0,    Mo:0   },
  'Complejo Triple 16':         { N:16,  P2O5:16, K2O:16, CaO:0,    S:0, SO4:0,    MgO:0,    SiO2:0,    Zn:0,    Fe:0,   B:0,     Mn:0,    Cu:0,    Mo:0   },
};
```

> Note: `BASE_MATERIALS` rows include a `S:0` column for legacy reasons but **`S` is not used in calculations** — only the `KEYS` array (which excludes `S`) drives math. All `S:` values are 0 in the catalog.

### Input fields

| Field | id / element | default | notes |
|---|---|---|---|
| Fertilizer row select | `<select class="gm-select" onchange="onMatChange(id,value)">` | `'Urea'` (first material) | All `BASE_MATERIALS` keys + custom names |
| % per TM | `<input class="pct" type="number" min="0" max="100" step="0.01">` | `''` (blank) | Per row |
| Dose kg/ha | `<input type="number" id="doseKgHa" min="0" step="1" value="500">` | 500 | Blend application rate |
| "+ Agregar fertilizante" | button → `addRow()` | — | Adds row with default material |
| "Gestionar catálogo" | button → `openCatalog()` | — | Opens modal to add up to 3 custom fertilizers |
| "Eliminar mezcla" | button → `clearMix()` | — | Confirms then empties rows |
| (In catalog modal) Name | `#newName` | `''` | required, must be unique |
| (In catalog modal) N % | `#newN` | 0 | step=0.01, min=0 |
| (In catalog modal) P₂O₅ % | `#newP` | 0 | |
| (In catalog modal) K₂O % | `#newK` | 0 | |
| (In catalog modal) CaO % | `#newCaO` | 0 | |
| (In catalog modal) MgO % | `#newMgO` | 0 | |
| (In catalog modal) SO₄ % | `#newSO4` | 0 | |
| (In catalog modal) Fe % | `#newFe` | 0 | |
| (In catalog modal) Mn % | `#newMn` | 0 | |
| (In catalog modal) B % | `#newB` | 0 | |
| (In catalog modal) Zn % | `#newZn` | 0 | |
| (In catalog modal) Cu % | `#newCu` | 0 | |
| (In catalog modal) Mo % | `#newMo` | 0 | |
| (In catalog modal) SiO₂ % | `#newSiO2` | 0 | |

### Output fields

| id | label | unit | formula |
|---|---|---|---|
| `#totalPctCell` | Sum % | % | `Σ row.pct` |
| `#tot_N`, `#tot_P2O5`, …, `#tot_SiO2` | Per-nutrient blend total | % in blend | `Σ (row.pct/100 × BASE_MATERIALS[row.name][k])` for each k in KEYS |
| `#npkDisplay` | "Relación N–P₂O₅–K₂O" | ratio a-b-c | If N,P,K all >0: `m = min(N,P,K)`; ratio = `N/m : P/m : K/m` (trim `.0`). Else guidance message. |
| `#kghaRow > td` (per nutrient) | kg/ha | kg of oxide / ha | `doseKgHa × totalPct / 100` per nutrient |
| Per-row `td.c-nut` cells | Per-row contribution | % in blend | `(row.pct/100) × BASE_MATERIALS[row.name][k]` |

### Formulas

```
For each row r:
  pct_r   = parseFloat(r.pct) || 0
  comp_r  = BASE_MATERIALS[r.name] || emptyComp()
  contrib_r[k] = (pct_r / 100) × (Number(comp_r[k]) || 0)    for k in KEYS

Totals:
  sumPct       = Σ pct_r
  totals[k]    = Σ contrib_r[k]
  NPK display: if totals.N>0 && totals.P2O5>0 && totals.K2O>0:
                  m = min(N, P2O5, K2O)
                  ratio = (N/m).toFixed(1).replace(/\.0$/,'') + ' - ' +
                          (P/m).toFixed(1).replace(/\.0$/,'') + ' - ' +
                          (K/m).toFixed(1).replace(/\.0$/,'')
                else "—" or guidance

Kg/ha per nutrient:
  kgHa[k] = doseKgHa × totals[k] / 100
  Display formatting:
    if kgHa ≤ 0 and totals[k] ≤ 0 → "0"
    if kgHa < 0.01  → toFixed(4)
    if kgHa < 1     → toFixed(3)
    else            → toFixed(2)

Per-row cell text: contrib_r[k].toFixed(2)
Total cell text:   totals[k].toFixed(2)
```

### Custom fertilizers (catalog modal)

- Stored in `localStorage['np_login_granular_mix_customs_v1']` as `Array<{name, comp}>` (max 3 entries).
- Composition object has the same keys as `KEYS` (N, P2O5, K2O, CaO, MgO, SO4, Fe, Mn, B, Zn, Cu, Mo, SiO2) — no `S`.
- Adding blocked if: 3 already saved, name empty, name collides with `BASE_MATERIALS`, or name collides with another custom (case-insensitive).
- Removing a custom: any rows referencing it get their `name` cleared (so they fall back to first material).

### Classification / categorization logic

- Materials are shown in a single `<select>` per row. The list is `Object.keys(BASE_MATERIALS)` followed by custom names. No optgroups.
- Bilingual names: if `<html lang="en">` is set, `displayMaterialName(name)` returns `MATERIAL_NAME_EN[name] || name`. (Detection: `document.documentElement.lang` starts with `en`.)

### Charts / visualizations

None.

### Non-obvious UX

1. **Auto-persist** via `window.NpFreePersist.bind('granular_mix', snapshotMix, applyMix)` — snapshots `{rowId, dose, rows:[{name,pct}]}` to localStorage on changes; reloads on page load.
2. **Empty mix** shows a placeholder row with colspan=16 instructing the user to add fertilizers.
3. **Catalog modal** — overlay with custom-list (max 3) and a "Nuevo personalizado" form. The form is grid-laid out (2 columns) with 13 nutrient inputs + a name field.
4. **Language switching** based on `<html lang>` attribute — only used for material names + a few button labels; the bulk of the UI stays Spanish.
5. **Delete button (🗑)** per row — small red button in the rightmost column.
6. **% input** has `min=0 max=100 step=0.01` but no enforcement of sum=100 (the displayed `TOTAL` cell just shows the running sum, no validation warning).

### Embedded data tables

None — everything renders from `BASE_MATERIALS`.

---

<a id="tool-3"></a>
## Tool 3 — Fertilizer Composition % (from chemical formula)

- **English name:** Fertilizer Composition %
- **Spanish name:** Composición de fertilizantes (%)
- **File:** `/tmp/np_tools/fertilizer-composition-free.html` (798 lines)
- **Purpose:** Parse a chemical formula (with hydrates `·nH2O`, double-salts separated by `+` or `·`, leading coefficients like `5Ca(NO3)2`, parentheses) and compute the elemental % composition (N, P, K, Ca, Mg, S, Si, C, H, O, micros), the oxide-equivalent % (P₂O₅, K₂O, CaO, MgO, SiO₂), the N partition between NO₃⁻ and NH₄⁺ (from counting motifs), and the molecular weight (PM). For blends, the user enters multiple formula rows with % in the product; the tool computes the weighted total composition when the rows + "Otros %" sum to 100%.

### Constants

```ts
const LS_CUSTOM = 'np_login_fertilizer_composition_customs_v1';

// All output columns (elemental + oxides + N forms)
const COLS = ['N','P','K','Ca','Mg','S','Si','C','H','O','N_NO3','N_NH4',
              'P2O5','K2O','CaO','MgO','SiO2','Zn','Fe','Mn','B','Cu','Mo'];

// Atomic weights (g/mol)
const ELEM: Record<string, number> = {
  H: 1.008, C: 12.011, N: 14.01, O: 16.0, P: 30.97, K: 39.10,
  Ca: 40.08, Mg: 24.31, S: 32.07, Si: 28.085,
  Zn: 65.38, Fe: 55.845, Mn: 54.938, Cu: 63.546, B: 10.81, Mo: 95.95,
  Cl: 35.45, Na: 22.99,
};

// Oxide conversion factors (elemental × factor = oxide)
// P × 2.29 = P₂O₅ ;  K × 1.20 = K₂O ;  Ca × 1.40 = CaO ;
// Mg × 1.66 = MgO ;  Si × 2.14 = SiO₂
const OX = { P2O5: 2.29, K2O: 1.20, CaO: 1.40, MgO: 1.66, SiO2: 2.14 };

// Unicode subscript/superscript normalization
const SUBSCRIPT_MAP: Record<string, string> = {
  '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9',
  '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9',
  '⁺':'+','⁻':'-',
};

// Built-in catalog entries (formula + aliases)
const BASE_MATERIALS = [
  // Nitrogenados
  { formula: 'CH4N2O', aliases: ['urea','Urea'] },
  { formula: 'NH4NO3', aliases: ['nitrato de amonio','Nitrato de amonio','NO3NH4'] },
  { formula: 'Ca(NO3)2·4H2O', aliases: ['nitrato de calcio tetrahidratado','Nitrato de calcio tetrahidratado'] },
  { formula: 'Ca(NO3)2' },
  { formula: '5Ca(NO3)2+NH4NO3+10H2O',
    aliases: ['nitrato de calcio granular','Nitrato de calcio granular','sal doble calcio','calcio granular'] },
  { formula: '(NH4)2SO4' },
  // Fosforados
  { formula: 'NH4H2PO4', aliases: ['map','MAP'] },
  { formula: '(NH4)2HPO4', aliases: ['dap','DAP'] },
  { formula: 'KH2PO4', aliases: ['mkp','MKP'] },
  // Potásicos
  { formula: 'KNO3' },
  { formula: 'K2SO4', aliases: ['sop','SOP'] },
  // Magnésicos y secundarios
  { formula: 'MgSO4·7H2O' },
  { formula: 'MgSO4·H2O' },
  // Microelementos frecuentes
  { formula: 'ZnSO4' },
  { formula: 'FeSO4·7H2O' },
  { formula: 'MnSO4·H2O' },
  { formula: 'CuSO4·5H2O' },
  { formula: 'H3BO3' },
];
```

### Input fields

| Field | element | default | notes |
|---|---|---|---|
| Formula per row | `<input type="text" id="formula_input_{id}" class="formula-input-narrow">` | `''` | autocomplete=off, autocapitalize=off, spellcheck=false; supports `+` (double salt), `·` (hydrate / segment separator), `:` (alias for `·`), `{}`/`[]` (alias for `()`), Unicode subscripts |
| % en producto per row | `<input type="number" class="pct-compact" min="0" max="100" step="0.01">` | `100` | First row default 100; subsequent rows default blank |
| Otros % | `<input type="number" id="othersPctInput" min="0" max="100" step="0.01" value="0">` | 0 | Inert / additives / moisture |
| "+ Agregar molécula" | button → `addBlendRow()` | — | Adds row with `pct:''` |
| "Vaciar" | button → `clearBlend()` | — | Confirms then resets to single blank row at 100% |
| Per-row "Quitar" | button → `removeBlendRow(id)` | — | If last row is removed, a fresh blank 100% row is auto-added |

### Output fields

| id / location | label | unit | formula |
|---|---|---|---|
| Per-row detail card (`#mol_wrap_{id}`) | "Composición teórica de esta molécula al 100%" | — | HTML block with formula, PM, NPK tag, nutrient cards |
| Per-row PM line | PM | g/mol | `Σ (atomCount[sym] × ELEM[sym])` over all segments |
| Per-row NPK tag | "Etiqueta tipo N – P₂O₅ – K₂O (teórico, %)" | % | `N.toFixed(1) – (P×2.29).toFixed(1) – (K×1.20).toFixed(1)` (decimal comma `.` → `,`) |
| Per-row nutrient cards | Per-element % (mass) | % | `(atomCount[sym] × ELEM[sym] / PM) × 100` |
| Per-row N_NO3 card | "N como NO₃⁻ (aprox.)" | % | see formula below |
| Per-row N_NH4 card | "N como NH₄⁺ (aprox.)" | % | see formula below |
| Per-row oxide sub-line | "Equivalente P₂O₅/K₂O/CaO/MgO/SiO₂" | % | `elementalP × 2.29` etc. |
| `#blendValidation` | "Suma: NN.NN% — OK." | % | `Σ row.pct + othersPct`; "OK" if within 0.02 of 100 |
| `#blendTotalBox` (when sum=100) | "Nutriente total en el producto (ponderado)" | % | `Σ (row.pct/100 × comp(row.material))` per column |
| `#blendTotalNutrients` (first line) | "% ponderado — forma elemental" | % | All elemental + micros + N_NO3 + N_NH4 (only if >0.0001) |
| `#blendTotalNutrients` (bordered card) | "Equivalente en óxido" | % | P2O5, K2O, CaO, MgO, SiO2 only |

### Formulas

#### Formula normalization (`normalizeFormula`)

```
1. Map each Unicode subscript/superscript char via SUBSCRIPT_MAP (→ plain digit/operator).
2. Replace '−' (U+2212) with '-'.
3. Strip all whitespace.
4. Replace '{','}' and '[',']' with '(',')'.
5. Replace ':' with '·'.
6. Replace ')(' with ')*('  (implicit multiply between adjacent groups).
7. Replace patterns matching /([0-9)\]])([\*+])([0-9(A-Z])/g with '$1·$3' (turn * and + between formula parts into '·').
   → This means '+', '*', '·' all act as segment separators after parsing.
8. Collapse runs of '.' into single '.' (so '·' · '·' = '·').
```

#### Parser (`parseCompound`)

```
1. Split normalized formula on /·•./ → segments. Filter empties.
2. For each segment:
   a. If matches /^(\d+(?:\.\d+)?)(.*)$/  → coef = Number($1), body = $2.
      Else coef = 1, body = segment.
   b. Parse terms of body via parseTerms(body, 0, null):
      - Skip '+', '-', '^' (they're separators inside a segment, treated as 1×).
      - '(' → recursively parseTerms(body, i+1, ')') returns nested terms;
              then parseNumber → count; push {type:'group', terms, count}.
      - Uppercase letter → element symbol (uppercase + optional lowercase);
              verify it's in ELEM, else throw "Elemento no soportado: <sym>";
              parseNumber → count (default 1); push {type:'element', symbol, count}.
      - Other chars → throw "Carácter inválido en fórmula: <ch>".
      - On stopChar=')' return at index after ')'.
      - At end of string with stopChar set → throw "Paréntesis sin cerrar".
3. collectElements(allTerms, mult=coef, out={}) — recursively multiplies counts.
4. mw = Σ atomCounts[sym] × ELEM[sym].
5. Count motifs:
   no3Count = Σ countMotifInTerms(seg.terms, seg.coef, [{N:1},{O:3}])
   nh4Count = Σ countMotifInTerms(seg.terms, seg.coef, [{N:1},{H:4}])
   → "Motif" = consecutive terms matching exactly (same symbol, same count).
```

#### Composition (`compFromFormula`)

```
For each element sym in {N, P, K, Ca, Mg, S, Si, C, H, O, Zn, Fe, Mn, B, Cu, Mo}:
  comp[sym] = (atomCounts[sym] × ELEM[sym] / mw) × 100     // pct mass

N partition:
  nAtoms = atomCounts['N'] || 0
  if nAtoms > 0:
    no3Atoms = max(0, parsed.no3Count)
    nh4Atoms = max(0, parsed.nh4Count)
    forms    = no3Atoms + nh4Atoms
    if forms > nAtoms and forms > 0:
      k = nAtoms / forms
      no3Atoms *= k
      nh4Atoms *= k
    N_NO3 = forms > 0 ? comp.N × (no3Atoms / nAtoms) : 0
    N_NH4 = forms > 0 ? comp.N × (nh4Atoms / nAtoms) : 0

Oxide equivalents:
  P2O5  = P × 2.29
  K2O   = K × 1.20
  CaO   = Ca × 1.40
  MgO   = Mg × 1.66
  SiO2  = Si × 2.14
```

#### Blend total (when sum=100%)

```
For each row r:
  p = max(0, parseFloat(r.pct) || 0)
  info = resolveMaterial(r.material)    // catalog match → formula; else parse raw text
  if info.ok: totals[k] += (p / 100) × info.comp[k]   for k in COLS

totalPct = Σ row.pct + othersPct
if |totalPct − 100| ≤ 0.02 and any row has material:
  Show totals box.
  Line 1 (elemental): N · N-NO₃ · N-NH₄ · P · K · Ca · Mg · S · Si · Zn · Fe · Mn · B · Cu · Mo · C · H · O
                     (skip entries ≤ 0.0001)
  Line 2 (oxides, bordered card): P₂O₅ · K₂O · CaO · MgO · SiO₂
else:
  Show "Ajusta a 100% (ingredientes + Otros)."
```

### Classification / categorization

- Nutrient cards split into two visual classes:
  - **is-nutrient** (green border, `#f0fdf4` bg) — N (total), N-NO₃, N-NH₄, P, K, Ca, Mg, S, Si, Zn, Fe, Mn, B, Cu, Mo
  - Default — C, H, O (structural elements shown but not styled as nutrients)
- Cards only appear for elements with `% > 1e-8`.
- N-NO₃ / N-NH₄ cards only shown if `comp.N > 1e-6` AND (`N_NO3 > 1e-4` OR `N_NH4 > 1e-4`).
- Oxide sub-line shown on P, K, Ca, Mg, Si cards.

### Catalog resolution (`resolveMaterial`)

```
matchCatalogEntry(raw):
  1. Try exact normalizeFormula(formula) match against catalog entries.
  2. Try case-insensitive match on entry.name (for custom entries with name).
  3. Try case-insensitive match on any alias.
  4. Return null if no match.

resolveMaterial(text):
  entry = matchCatalogEntry(text)
  if entry:
    if entry.analysis (manual analysis object):
      return fromElementalsToComp(entry.analysis)  // for hand-entered %s
    else:
      return compFromFormula(entry.formula)
  else:
    // Try to parse text as a raw formula
    try: return compFromFormula(text)
    catch: return {ok: false, error: e.message}
```

### Charts / visualizations

None.

### Non-obvious UX

1. **Autocomplete suggestions** — each formula input has a sibling `<div class="row-suggestions">` that opens on focus; up to 40 suggestions filtered by `normalizeFormula(query).toLowerCase()` (starts-with first, then contains). `onmousedown` selects; `onblur` hides after 120 ms.
2. **Catalog modal for custom fertilizers** — not implemented in this tool (only the granular mix tool has one). User materials in this tool are limited to catalog entries with `analysis` (manual %); the React port can extend this if needed.
3. **"Otros %"** captures inerts/additives/moisture; required for the blend total to hit 100%.
4. **`escapeHtml` / `escapeAttr`** used everywhere to prevent injection from user-typed formulas.
5. **Number formatting** — uses `.` decimal in card values, but `,` decimal in oxide sub-lines and NPK tag (Spanish convention): `v.toFixed(2).replace('.', ',')`.
6. **Auto-persist** via `window.NpFreePersist.bind('fertilizer_composition', snapshotBlend, applyBlend)`. Snapshot: `{blendRowId, othersPct, rows:[{material,pct}]}`.
7. **First load** — if no saved state, calls `addBlendRow('', '100')` (one blank row at 100%).
8. **Removing the last row** auto-adds a fresh blank 100% row (so there's always at least one row).
9. **Click-outside** closes all open suggestion dropdowns (document-level click handler).

### Embedded data tables

None beyond the `BASE_MATERIALS` list and `ELEM` atomic-weight table shown above.

---

<a id="tool-4"></a>
## Tool 4 — Nutrient Distribution by Stage %

- **English name:** Nutrient Distribution by Stage %
- **Spanish name:** Distribución nutrimental por etapa (%)
- **File:** `/tmp/np_tools/extraccion-etapa-free.html` (1487 lines)
- **Purpose:** User enters the total seasonal nutrient extraction (kg/ha) per element, then defines the % distribution across phenological stages; the tool computes kg/ha per stage per nutrient and renders a line chart. Supports custom nutrient additions (S, Fe, Mn, B, Zn, Cu, Mo), custom stage names, saveable curves (dashboard mode only).

### Constants

```ts
// Initial base nutrients (always shown)
const BASE = [
  { id: 'n',  label: 'N',  total: 180 },
  { id: 'p',  label: 'P',  total: 40  },
  { id: 'k',  label: 'K',  total: 220 },
  { id: 'ca', label: 'Ca', total: 120 },
  { id: 'mg', label: 'Mg', total: 35  },
];

// Optional nutrients user can add in order
const OPTIONAL_QUEUE = [
  { id: 's',  label: 'S',  total: 25   },
  { id: 'fe', label: 'Fe', total: 3    },
  { id: 'mn', label: 'Mn', total: 2    },
  { id: 'b',  label: 'B',  total: 0.5  },
  { id: 'zn', label: 'Zn', total: 0.3  },
  { id: 'cu', label: 'Cu', total: 0.2  },
  { id: 'mo', label: 'Mo', total: 0.05 },
];

const DEFAULT_STAGES = ['Brotación', 'Vegetativo', 'Floración', 'Llenado', 'Maduración'];

// Stage name suggestions (datalist)
const STAGE_PRESETS = [
  'Brotación', 'Vegetativo', 'Floración', 'Llenado', 'Maduración',
  'Mes 1', 'Mes 2', 'Mes 3',
  'Inicio de ciclo', 'Desarrollo', 'Cosecha',
];

// Nutrient group split for chart scale
const MACRO_IDS = { n: true, p: true, k: true, ca: true, mg: true, s: true };
const MICRO_IDS = { fe: true, mn: true, b: true, zn: true, cu: true, mo: true };

// Default % distribution per base nutrient (5 stages)
const DEFAULT_PCT: Record<string, number[]> = {
  n:  [10, 30, 20, 30, 10],
  p:  [15, 25, 25, 20, 15],
  k:  [5,  20, 25, 35, 15],
  ca: [12, 28, 22, 28, 10],
  mg: [12, 28, 22, 28, 10],
};

// Chart series colors (cycle)
const COLORS = [
  '#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#0891b2',
  '#ca8a04', '#db2777', '#0d9488', '#4f46e5', '#64748b',
  '#059669', '#b45309', '#be185d',
];

const toolStateVersion    = 1;
const presetsBucketVersion = 1;
```

### Input fields

| Field | element | default | notes |
|---|---|---|---|
| Nutrient total (kg/ha) | `<input type="number" step="any" min="0">` per nutrient | from `BASE` / `OPTIONAL_QUEUE` | Always-positive |
| "+ Agregar nutriente" | `#btnAddNut` | — | Pulls next from `optionalQueue` (S, Fe, Mn, B, Zn, Cu, Mo); disabled when queue empty |
| "↺ Restaurar ejemplo" | `#btnResetDefaults` | — | Confirms then resets to BASE + DEFAULT_STAGES + DEFAULT_PCT |
| Per-stage name | `<input type="text" list="stagePresets" class="stage-in">` | from `DEFAULT_STAGES` | Free text + datalist suggestions |
| Per-stage % per nutrient | `<input type="number" step="0.1" class="pct-in">` | from `DEFAULT_PCT` | Each row = stage, each col = nutrient |
| "+ Agregar etapa" | `#btnAddStage` | — | Splits last stage's % in half (rounds to 1 decimal); adds new stage "Nueva etapa" |
| Per-stage "Quitar etapa" | `.btn-danger` | — | Disabled when only 1 stage; merges removed stage's % into previous (or next if first) |
| "×" remove optional nutrient | `.rm-nut` button | — | Only on optional nutrients (S, Fe, Mn, …) |
| (Dashboard mode) "Mis curvas guardadas" select | `#presetSelect` | empty | Lists saved user curves |
| (Dashboard mode) "Título (nuevo)" | `#presetTitleInp` (maxlength=80) | `''` | Used when saving a new curve |
| (Dashboard mode) "💾 Guardar en mi biblioteca" | `#btnPresetSave` | — | Saves current state as a named preset |
| (Dashboard mode) "🗑 Eliminar seleccionada" | `#btnPresetDelete` | — | Disabled when no preset selected; confirms |
| Chart view toggle | `#btnChartMacro` / `#btnChartMicro` | macros on | Filters chart series to macro or micro nutrients (micros use their own scale) |

### Output fields

| id | label | unit | formula |
|---|---|---|---|
| `#pctFoot tr td:nth-child(n+2)` | "Σ %" per nutrient | % | `Σ pct[nutrient.id]` per nutrient; green (`ok`) if `|sum-100|<0.05`, red (`bad`) otherwise |
| `#sumWarn` | "⚠ La suma de % por nutriente debe ser 100%..." | — | Banner shown when any nutrient's % sum deviates from 100 by ≥0.05 |
| `#kgBody tr td:nth-child(n+2)` | kg/ha per stage per nutrient | kg/ha | `nutrient.total × (pct[nutrient.id][stageIndex] / 100)` |
| `#extChart` (Chart.js line chart) | kg/ha per stage | kg/ha | One dataset per nutrient; x-axis = stages |
| `#chartEmpty` | empty-state message | — | Shown when no nutrients in current view (e.g. micros view but no micros added) |
| `#nextNutHint` | "Siguiente: S" or "Ya agregaste todos los opcionales" | — | Shows which nutrient will be added next |
| `#presetHint` | Library explanation | — | Dashboard-mode text describing user-vs-project scope |

### Formulas

```
kg/ha per stage:
  kg[stageIdx, nutrient] = nutrient.total × (pct[nutrient.id][stageIdx] / 100)

Sum validation:
  ok = |Σ pct[nutrient.id] − 100| < 0.05    (per nutrient)

Equal split (utility):
  equalSplit(n) = [round1(100/n) × (n−1), round1(100 − Σ previous)]
  e.g. equalSplit(3) = [33.3, 33.3, 33.4]

Add a stage:
  - stages.push('Nueva etapa')
  - For each nutrient: take last %, split in half (a = round1(last/2), b = round1(last − a));
    push b. If new sum deviates >0.05 from 100, add diff to last entry.

Remove a stage at index ri:
  - For each nutrient: take arr[ri] (% removed); merge into arr[ri−1] (or arr[1] if ri=0);
    splice ri out.
  - stages.splice(ri, 1)

Rounding:
  round1(x) = Math.round(x × 10) / 10

Kg/ha display formatting (formatKgHa):
  if |x| ≥ 100 → toFixed(1)
  if |x| ≥ 10  → toFixed(2)
  if |x| ≥ 1   → toFixed(2)
  if |x| ≥ 0.1 → toFixed(3)
  if |x| ≥ 0.01→ toFixed(4)
  else         → toFixed(6).replace(/\.?0+$/, '') || '0'
```

### Classification / categorization

| Class | Nutrients | Chart scale |
|---|---|---|
| Macros | N, P, K, Ca, Mg, S | Same axis (kg/ha values are similar order of magnitude) |
| Micros | Fe, Mn, B, Zn, Cu, Mo | Separate scale (much smaller values; toggle via `#btnChartMicro`) |

### Charts / visualizations

- **Chart.js v4.4.1** (CDN: `https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js`)
- Type: `line`
- X-axis: stages (categories, maxRotation 45°)
- Y-axis: `kg/ha extraídos`, `beginAtZero: true`, tick callback formats via `formatKgHa`
- Datasets: one per nutrient in current view (macro or micro)
  - `borderColor: COLORS[idx % COLORS.length]`
  - `backgroundColor: COLORS[idx] + '22'`
  - `tension: 0.35`, `fill: false`, `pointRadius: 4`, `pointHoverRadius: 6`
- Legend: bottom, `boxWidth: 12`, `padding: 16`
- Tooltip: `mode: 'nearest'`, `intersect: false`; label = `"{label}: {formatKgHa(y)} kg/ha"`
- Container: `#extChart` canvas inside `#chartWrap` (height `min(420px, 55vh)`)

### Non-obvious UX

1. **Two persistence modes**:
   - Free / standalone (`?ctx` ≠ `dashboard`) — no autosave, no preset bar shown.
   - Dashboard mode (`?ctx=dashboard`) — autosave to localStorage AND cloud via `window.parent.nutriplantLoadExtractionStageFromCloud(ctx)` / `.nutriplantSaveExtractionStageToCloud({...})` (debounced 550 ms); preset bar visible; preset bucket also synced local + cloud (key `np_extraccion_etapa_presets_user_{userId}`).
2. **Newest-wins state selection** — on boot, local and cloud states are compared by `updatedAt`; the newer one wins. If cloud is newer, local is overwritten.
3. **Preset bar** — save current state as a named curve; curves are **per user** (not per project), so they survive project deletion. Loading a preset replaces the working state. Editing any input invalidates the current preset selection (dropdown resets to "— Elegir curva —").
4. **Boot reveal** — `body.np-booting` class hides hero/panels until hydration finishes (`finishBootReveal()` removes the class); prevents flicker during async load.
5. **Soft reload** — `window.addEventListener('message', …)` listens for `{type: 'np-extraccion-etapa-reload'}` from parent dashboard to re-hydrate without full page reload.
6. **Optional nutrient queue** — `+ Agregar nutriente` pulls the next nutrient from `OPTIONAL_QUEUE`; once exhausted, button is disabled with title `"No hay más nutrientes opcionales por agregar. Puedes quitar uno con × para volver a habilitar este botón."`. Removing an optional nutrient returns it to the front of the queue? (Actually no — the queue is fixed; removed optionals are just gone. Resetting restores the queue.)
7. **Stage cell** uses `<input list="stagePresets">` for autocomplete; free-text still allowed. Empty stage name auto-becomes `"Etapa {i+1}"` on `change`.
8. **Per-stage remove button** only appears when `stages.length > 1`; otherwise the cell shows "—".
9. **N PK % sum row** in tfoot — green if within 0.05 of 100, red otherwise. The warning banner `#sumWarn` appears below the % table.
10. **Chart group toggle** — two segmented buttons (`#btnChartMacro`, `#btnChartMicro`); only one active at a time. Empty-state message changes based on view ("No hay micronutrientes en la lista…").
11. **Round-to-1-decimal** for all % values (`round1`) to avoid float drift.

### Embedded data tables (none)

All defaults are in the constants above.

### State schema (snapshotState / normalizeState)

```ts
type ExtState = {
  version: 1;
  updatedAt: number;
  nutrients: Array<{id: string, label: string, total: number, optional: boolean}>;
  optionalQueue: Array<{id: string, label: string, total: number}>; // remaining un-added
  stages: string[];                  // stage names
  pct: Record<string, number[]>;     // nutrient.id → array of % per stage (length = stages.length)
};
```

`normalizeState` validates: object present, `nutrients` is non-empty array of `{id,label}` (other fields coerced), `stages` non-empty array of strings (empty → `"Etapa {i+1}"`), `pct[nutrientId]` padded/truncated to `stages.length` with `round1`. Invalid → returns `null`.

---

<a id="shared"></a>
## Shared / Cross-cutting patterns

1. **localStorage keys** — every tool uses a versioned key:
   - `nutriplant_hydro_solucion_free_v1` (hydro solution, internal version field = 3)
   - `np_login_granular_mix_customs_v1` (granular mix custom catalog)
   - `np_login_fertilizer_composition_customs_v1` (fertilizer composition customs — currently unused for custom user materials in the spec, but the key exists)
   - `np_extraccion_etapa_{userId}_{projectId}` (extraccion etapa state per project)
   - `np_extraccion_etapa_presets_user_{userId}` (extraccion etapa preset library per user)

2. **Number parsing** — all tools accept both `.` and `,` as decimal separator via `String(raw).replace(',', '.')` then `parseFloat`. Negative inputs clamped to 0 (or rejected for %).

3. **Rounding helpers**:
   - `hydroRound2(v) = Math.round(v × 100) / 100` (hydro solution)
   - `round1(v) = Math.round(v × 10) / 10` (extraccion etapa)
   - `fertAporteFormatDose(d) = Math.round(d × 10000) / 10000` (hydro aporte)

4. **HTML escape** — `escapeHtml(s)` (uses DOM textContent) and `escapeAttr(s)` (manual `&`/`"`/`<` replacement). Used for all dynamic strings.

5. **`np-free-local-persist.js` pattern** (granular mix + fertilizer composition):
   ```ts
   window.NpFreePersist.load(toolKey) → snapshot | null
   window.NpFreePersist.bind(toolKey, snapshotFn, applyFn) → autosave on input
   ```
   The React port can implement this as a custom `useLocalStorage` hook keyed by tool id.

6. **Bilingual support** — only Granular Mix has explicit EN/ES material-name mapping; other tools are Spanish-only.

7. **Validation tolerance** — `0.05` (5%) for stage % sums; `0.02` (2%) for blend % sums in fertilizer composition.

8. **`requestAnimationFrame` throttling** for expensive re-renders (triangle drag in hydro solution).

9. **CDN dependencies** — only Chart.js 4.4.1 (extraccion etapa). Hydro solution uses pure SVG; the other two have no charting.

10. **Atomic-weight table** — `ELEM` in Tool 3 is the only place where atomic weights are defined. If the React port wants to share, hoist this to a single `src/lib/elements.ts`.

11. **Oxide-conversion table** — `OX` in Tool 3: `{P2O5: 2.29, K2O: 1.20, CaO: 1.40, MgO: 1.66, SiO2: 2.14}`. Reused (hardcoded) wherever oxide equivalents are needed.

12. **Equivalent-weight table** — `HYDRO_EQ_WEIGHTS` in Tool 1: `{N_NO3:14, N_NH4:14, P:31, K:39.1, Ca:20.04, Mg:12.15, S:16.03, Cl:35.45}`. Note: these are *not* the standard eq weights for P/K/Ca/Mg/S as elements — they're the per-ion eq weights used by the hydro tool (e.g. P as H₂PO₄⁻ has eq weight 31/1 = 31; K⁺ eq weight = 39.1/1 = 39.1; Ca²⁺ eq weight = 40.08/2 = 20.04; Mg²⁺ eq weight = 24.31/2 = 12.15; S as SO₄²⁻ eq weight = 32.07/2 = 16.03 — actually 32.07/2 = 16.035 ≈ 16.03 ✓).

---

<a id="layout"></a>
## Suggested React/TS file layout

```
src/
  lib/
    elements.ts                  // ELEM atomic weights
    oxides.ts                    // OX conversion factors
    eqWeights.ts                 // HYDRO_EQ_WEIGHTS
    formulaEngine.ts             // Tool 3 parser (normalizeFormula, parseCompound, compFromFormula)
    numberParse.ts               // shared comma→dot parse, round1, round2, formatKgHa
    useLocalStorage.ts           // generic snapshot/apply hook (replaces np-free-local-persist.js)
  features/
    granular-mix/
      constants.ts               // KEYS, BASE_MATERIALS, MATERIAL_NAME_EN
      GranularMix.tsx            // main component
      CatalogModal.tsx           // custom fertilizer modal (max 3)
      useGranularMixState.ts     // rows, dose, customs (localStorage)
    fertilizer-composition/
      constants.ts               // COLS, ELEM, OX, BASE_MATERIALS (formula list)
      FormulaInput.tsx           // input with autocomplete suggestions
      NutrientCard.tsx           // single nutrient display card
      BlendRow.tsx               // formula + % row with live detail card
      FertilizerComposition.tsx  // main component (blend total + Others %)
    extraccion-etapa/
      constants.ts               // BASE, OPTIONAL_QUEUE, DEFAULT_STAGES, DEFAULT_PCT, COLORS
      StageChart.tsx             // Chart.js wrapper
      ExtraccionEtapa.tsx        // main component
      useExtraccionState.ts      // nutrients, stages, pct, autosave
      presets.ts                 // preset bucket load/save (localStorage + cloud)
    hydro-solucion/
      constants.ts               // HYDRO_ANIONS, HYDRO_CATIONS_TRIANGLE, HYDRO_MEQ_NUTRIENTS, eq weights, polygons
      DesignTab.tsx              // meq/ppm/% tables + CE input
      TernaryDiagram.tsx         // SVG triangle with draggable markers
      FertilizerAporteTab.tsx    // 2nd tab
      FertAporteRow.tsx          // single fertilizer row card
      useHydroState.ts           // stages + fertAporte state (localStorage)
      catalog.ts                 // HydroFertAporteCatalog equivalent (built-in + user materials)
      formulaEngine.ts           // re-export from lib/formulaEngine.ts
```

### External CDN / dependency requirements

- `chart.js@4.4.1` (UMD bundle) for Tool 4 — React port should use the npm `chart.js` package + `react-chartjs-2` or a direct `useEffect` hook.
- No other external runtime deps. The original `assets/fert-formula-engine.js` and `assets/hydro-fert-aporte-catalog.js` must be reconstructed — the formula engine is fully specified in Tool 3; the catalog built-in list must be supplied by the next agent (the React port can start with the `BASE_MATERIALS` formula list from Tool 3 plus manual `%` analyses for blended products like calcium nitrate granular).

### Next-actions checklist for the reimplementation agent

1. Implement `lib/formulaEngine.ts` from the spec in **Tool 3** (`normalizeFormula`, `parseCompound`, `compFromFormula`, motif counting for N_NO3/N_NH4).
2. Implement `features/granular-mix` first — it's the simplest and exercises the persistence pattern.
3. Implement `features/fertilizer-composition` — exercises the formula engine and the blend-weighting logic.
4. Implement `features/extraccion-etapa` — Chart.js integration + state schema.
5. Implement `features/hydro-solucion` last — depends on a working formula engine (for inline-formula fertilizer rows). The ternary diagram is the most complex piece (SVG + pointer events + barycentric transforms + polygon clip).
6. For the hydro-solucion catalog (`HydroFertAporteCatalog`), start with the formula-based materials from Tool 3 and add common blends with manual `compNutriPlant` (e.g. `5Ca(NO3)2+NH4NO3+10H2O` → use the formula engine, since it parses correctly).
7. All tools need: dark-mode-friendly styling matching the existing palette (Tailwind tokens: `slate-50/100/200/800/900`, `emerald-50/500/700`, `amber-50/500/700`, `rose-50/500/700`, `violet-50/500/700`).
