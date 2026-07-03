# NutriPlant PRO — Spec Batch D (Task 1-d)

Self-contained specification for two NutriPlant PRO free tools, ready to be reimplemented as React/TypeScript components.

- **Tool 1** — Agua en suelo y textura (Soil Water & USDA Texture Triangle)
  Source: `/tmp/np_tools/agua-disponible-textura-suelo-free.html` (1 990 lines, 81 KB)
- **Tool 2** — Huella de carbono de fertilizantes (Fertilizer Carbon Footprint, A vs B scenario comparison with full supply-chain route)
  Source: `/tmp/np_tools/fertilizer-carbon-free.html` (2 153 lines, 100 KB)

---

## Tool 1 — Agua en suelo y textura

### Tool name
- English: **Soil Water & USDA Texture Triangle**
- Spanish: **Agua en suelo y textura**

### Purpose
Two-tab reference tool. Tab 1 computes the plant-available water reservoir of a soil profile (CC − PMP) and, when current volumetric water content is supplied, the irrigation amount (m³ and mm) needed to refill to field capacity (CC) — and to the "objective zone" (40–60 % of available water). Tab 2 is an interactive USDA texture triangle: the user enters sand/silt/clay % (or drags a marker inside the triangle) and the tool returns the USDA texture class plus an illustrative CC/PMP range.

### Layout / tabs
- Tab 1 `#panel1` — "1 · Agua en suelo" (default active)
- Tab 2 `#panel2` — "2 · Triángulo de textura"
- Tabs are round pill buttons (`.tabs button[role="tab"]` with `aria-selected`).
- Switching to tab 2 calls `drawTernary()`.

### External dependencies (MISSING — must be reconstructed)
The HTML loads three external scripts (paths listed but files absent from workspace):

1. `assets/free-tools-watermark.css` — watermark styling only (cosmetic).
2. `assets/free-tools-embed.js` — embed-mode wrapper.
3. `assets/np-free-local-persist.js` — `window.NpFreePersist` (see API surface in spec-batch-c.md, lines 1701-1706).
4. `assets/np-soil-water-bridge.js?v=202606241500` — `window.NpSoilWaterBridge` (cross-tab bridge).

`window.NpSoilWaterBridge` API used here:

```ts
type NpSoilWaterBridge = {
  // Publish current soil-water state so the lamina-riego sister tool can read it via localStorage.
  publish(state: {
    cc: number; pmp: number; depth: number; areaHa: number; rootEff: number; thetaVol: string;
  }): void;

  // Returns the 40–60 % "objective zone" band in % vol.
  // Convention (FAO-56 / NutriPlant reference): AW = CC − PMP; low = PMP + 0.4×AW; high = PMP + 0.6×AW.
  computeObjectiveZone(cc: number, pmp: number): {
    lowPctVol: number;     // PMP + 0.4 × (CC − PMP)
    highPctVol: number;    // PMP + 0.6 × (CC − PMP)
    labelShort: string;    // e.g. "40–60% AU"
  } | null;
};
```

`NpFreePersist.bind('agua_disponible_textura', snapFn, applyFn)` saves/restores the field set + active tab.

### Tab 1 — Agua en suelo

#### Inputs

| id          | label (es)                              | unit       | default | range          | step |
|-------------|-----------------------------------------|------------|---------|----------------|------|
| `presetTex` | Cargar valores de referencia (CC / PMP) | (dropdown) | `''`    | 6 entries      | —    |
| `cc`        | Capacidad de campo CC (% vol.)          | % vol.     | 30      | 0 – 60         | 0.1  |
| `pmp`       | Punto de marchitez PMP (% vol.)         | % vol.     | 20      | 0 – 50         | 0.1  |
| `depth`     | Profundidad de suelo (cm)               | cm         | 30      | 1 – 200        | 1    |
| `areaHa`    | Área (ha)                               | ha         | 1       | 0.01 – 10 000  | 0.01 |
| `rootEff`   | % suelo explorado — superficie (franja) | %          | 60      | 1 – 100        | 1    |
| `thetaVol`  | Humedad actual del suelo (% vol.)       | % vol.     | `''`    | 0 – 55         | 0.1  |

- `thetaVol` is **optional**; if empty, only the reservoir reference is shown (no déficit/lámina).
- `rootEff` is the fraction of the **crop area** with active roots / wetted zone (drip, furrow) — explicitly *not* a depth. When `< 99.5 %` and `areaHa > 0`, the tool shows "franja regada" split results.

#### Preset dropdown (`TEXTURE_SERIES`)

```ts
const TEXTURE_SERIES = [
  { label: 'Arena',            cc:  8, pmp:  3 },
  { label: 'Franco arenoso',   cc: 12, pmp:  6 },
  { label: 'Franco',           cc: 22, pmp: 11 },
  { label: 'Franco limoso',    cc: 28, pmp: 14 },
  { label: 'Franco arcilloso', cc: 32, pmp: 17 },
  { label: 'Arcilla',          cc: 38, pmp: 22 }
] as const;
```

Picking an option writes `cc` and `pmp` to the inputs, calls `updateWater()`, then resets the select back to `''` (so subsequent manual edits don't appear tied to the preset).

#### Formulas (plain math)

Let `cc`, `pmp`, `depth`, `areaHa`, `rootEff`, `thetaVol` be the parsed numeric inputs (`thetaVol` may be NaN if blank).

```
adPct        = max(0, cc − pmp)                         # % vol  — available-water band
volSoilM3    = areaHa × 10000 × (depth / 100)           # m³     — soil profile volume
adM3         = volSoilM3 × (adPct / 100)                # m³     — potential AW volume over full area
effAreaHa    = areaHa × (rootEff / 100)                 # ha     — wetted-strip area
realM3       = adM3 × (rootEff / 100)                   # m³     — potential AW volume in the wetted strip
hasSplitArea = (rootEff < 99.5) && (areaHa > 0)
```

If `thetaVol` is present:

```
deficitPctRaw = cc − thetaVol                       # may be negative if thetaVol > cc
deficitToCc   = max(0, deficitPctRaw)               # % vol

lamMmTot      = (deficitToCc / 100) × depth × 10    # mm  — full-profile deficit
lamM3Tot      = volSoilM3 × (deficitToCc / 100)     # m³  — over the entire area
lamM3Active   = lamM3Tot × (rootEff / 100)          # m³  — applied to wetted strip only
lamMmFranja   = lamMmTot                            # mm  — physical depth in the wetted strip (same as lamMmTot)
lamMmCropRef  = areaHa > 0 ? lamM3Active / (areaHa × 10) : lamMmTot × (rootEff / 100)
                                                     # mm  — same m³ expressed over the whole crop area
lamM3Surplus  = volSoilM3 × max(0, thetaVol − cc)/100 × (rootEff/100)   # m³ — excess over CC
```

Objective-zone (40–60 % AW) calculations — only when `NpSoilWaterBridge.computeObjectiveZone` is available:

```
objZone.lowPctVol  = pmp + 0.4 × (cc − pmp)
objZone.highPctVol = pmp + 0.6 × (cc − pmp)
defObjPct    = max(0, objZone.highPctVol − thetaVol)
lamMmObj     = (defObjPct / 100) × depth × 10
lamM3ObjTot  = volSoilM3 × (defObjPct / 100)
lamM3ObjFranja = lamM3ObjTot × (rootEff / 100)
```

`mm ↔ m³` conversions: `1 mm over 1 ha = 10 m³` (so `m³ = mm × ha × 10`). The chart helper `chartPctToMmM3(pct)` does `mm = (pct/100) × depth × 10`, `m³ = round(mm × areaHa × 10)`.

#### Outputs (rendered as HTML spans inside `#calcLines`, plus hero cards)

| id / class                         | label                                                         | unit  | formula                                    |
|------------------------------------|---------------------------------------------------------------|-------|--------------------------------------------|
| `.calc-metric--geom`               | Volumen de suelo (área × profundidad)                         | m³    | `volSoilM3`                                |
| `.calc-metric--pmp-band`           | Potencial de agua útil (CC − PMP)                             | % vol | `adPct`                                    |
| `.calc-metric--pmp-band`           | Volumen de ese potencial en el perfil                         | m³    | `adM3`                                     |
| `.calc-metric--radical`            | Potencial × superficie explorada                              | m³    | `realM3`                                   |
| `.calc-metric--theta`              | Humedad actual (volumétrica)                                  | % vol | `thetaVal`                                 |
| `.calc-metric--rep`                | Déficit hasta CC (CC − humedad actual)                        | % vol | `deficitToCc`                              |
| `.calc-metric--lamina`             | Lámina hasta CC (perfil · toda el área)                       | mm / m³ | `lamMmTot`, `lamM3Tot`                   |
| `.calc-metric--objective`          | Zona objetivo riego (40–60 % agua útil)                       | % vol | `objZone.lowPctVol–highPctVol`             |
| `.calc-metric--objective`          | Lámina hasta objetivo                                         | mm / m³ | `lamMmObj`, `lamM3ObjTot`/`lamM3ObjFranja` |
| `#calcHeroResult`                  | Hero card: m³ + mm (or surplus / near-CC variants)            | m³, mm | see scenarios below                        |
| `#calcHeroObjective`               | Hero card: riego hasta nivel objetivo (purple variant)        | m³, mm | `lamM3ObjH`, `lamMmObjH`                   |

**Hero card scenarios (`#calcHeroResult`)** — chosen by `deficitPctRaw = cc − thetaVal`:

| condition                                | class added                          | eyebrow text                                          | body formula                                                        |
|------------------------------------------|--------------------------------------|-------------------------------------------------------|---------------------------------------------------------------------|
| `deficitPctRaw < −0.05` (θ > CC)         | `is-visible calc-hero-result--surplus` | "⚠️ Exceso sobre CC — no reponer suelo"               | `lamM3Surplus` m³ + `(max(0, θ−CC)/100 × depth × 10)` mm            |
| `deficitToCc ≤ 0.05` (near CC)           | `is-visible`                         | "✓ Suelo cerca de CC"                                 | "Sin déficit de reposición hasta capacidad de campo."               |
| otherwise (deficit)                      | `is-visible`                         | "📍 Resultado para riego · franja X ha" (split) / "📍 Lámina hasta CC · toda el área" | `heroM3` = `lamM3Active` (split) or `lamM3Tot`; `heroMm` = `lamMmFranja` (split) or `lamMmTot` |

The split-area sub-text reads: "Aplica `heroM3` m³ en la franja regada (`effAreaHa` ha) — eso son `heroMm` mm de lámina en esa zona. No son dos riegos: m³ = lo que riegas; mm = la misma agua en profundidad. Sobre toda la ha cultivo (`areaHa` ha) equivalen a `lamMmCropRef` mm (mismos `heroM3` m³)."

**Objective hero card (`#calcHeroObjective`)** — separate purple card, only when `objZone && deficitPctRaw >= −0.05`:

| condition                                                | eyebrow                                  | body                                                                                |
|----------------------------------------------------------|------------------------------------------|-------------------------------------------------------------------------------------|
| `defObjPctHero > 0.05`                                   | "🎯 Riego hasta nivel objetivo (60 % AU)" | `lamM3ObjH` m³ + `lamMmObjH` mm, sub: "Zona objetivo X–Y % vol. (40–60 % entre PMP y CC). Hasta CC serían `lamM3Active` m³." |
| `thetaVal >= objZone.lowPctVol − 0.05`                   | "🎯 En zona objetivo de riego"            | "Tu humedad está dentro del rango 40–60 % agua útil."                               |
| `deficitToCc > 0.05` (between obj zone and CC)           | "🎯 Por encima de zona objetivo"          | "Entre objetivo y CC — puedes ajustar el riego con criterio de campo."              |

#### SVG bar chart (`#chartSvg`, viewBox `0 0 640 300` then resized)

A horizontal stacked bar showing PMP / available-water band / remainder (air), plus an amber marker line for `thetaVol`, plus a violet band for the objective zone (40–60 % AW). Procedurally drawn by `drawWaterBarChart(cc, pmp, depth, thetaVol, rootEff, irrDefPct, areaHa)`.

Key drawing rules:

- Canonical band order is `PMP` (left) → `AD = CC − PMP` (middle) → remainder (right, hatched `patAirSalt` pattern).
- If user enters `PMP > CC`, the bar swaps them visually (a " swapped" warning is rendered) but `adPct` is still computed with `max(0, cc − pmp)`.
- Scale: `rawMax = max(cc + 10, pmp + 8, thetaVol + 4, 38)`; `maxScale = min(62, max(32, ceil(rawMax/5) × 5))`; bumped up if `< cc + 5`.
- Bar geometry: `padL = 52`, `padR = 24`, `barW = W − padL − padR`, `barH = 40`, `barY = swapped ? 108 : hasTheta ? 118 : 106`.
- Inside the available-water band:
  - If `hasTheta`: split into `pxFilledGreen` (dark teal `#0f766e`, from PMP up to `thetaVol` clamped into band) and `pxNeedGreen` (light green `#4ade80`, from θ to CC).
  - If no θ: solid green `#15803d`.
- Amber marker line at `xThetaPx` (clamped to bar), circle on top.
- Violet objective band: rectangle from `xObjLo` to `xObjHi` (clamped to available band), with dashed side lines and a bracket below.
- Tick marks at 0/25/50/75/100 % of `maxScale`.
- Stat lines below: PMP, CC, Potencial útil, Zona objetivo, Humedad actual, Lámina hasta CC, Lámina hasta objetivo.
- Legend with colored circles / pattern swatch.

Three small conceptual SVGs (`.viz-card`) illustrate **saturación / CC / PMP** as brown soil particles inside a pore circle with varying water fill (full / partial-with-air / film-only).

#### Color palette (CSS variables, to mirror in React)

```ts
const PALETTE = {
  pmp:       '#172554',  // very dark navy
  pmpSoft:   '#eef2ff',
  cc:        '#15803d',  // green
  ccSoft:    '#f0fdf4',
  potential: '#15803d',
  rep:       '#4ade80',  // light green (deficit to CC)
  repInk:    '#14532d',
  tealOcc:   '#0f766e',  // dark teal (θ within band)
  theta:     '#c2410c',  // amber line/marker
  thetaSoft: '#fff7ed',
  lamina:    '#0d9488',
  laminaSoft:'#f0fdfa',
  radical:   '#0369a1',
  radicalSoft:'#e0f2fe',
  geom:      '#475569',
  geomSoft:  '#f8fafc',
  objective: '#7c3aed'   // violet (40–60 % band + hero card)
};
```

### Tab 2 — Triángulo de textura (USDA)

#### Inputs

| id         | label      | unit | default | range    | step |
|------------|------------|------|---------|----------|------|
| `pctSand`  | % Arena    | %    | 30      | 0 – 100  | 0.1  |
| `pctSilt`  | % Limo     | %    | 40      | 0 – 100  | 0.1  |
| `pctClay`  | % Arcilla  | %    | 30      | 0 – 100  | 0.1  |

Buttons: `#btnNormalize` (rescales to sum 100), `#btnEjemplo` (loads 30/40/30).

`#sumWarn` becomes visible when `sum > 0 && |sum − 100| > 1`, with text `"La suma es X.X %. Usa «Normalizar a 100%» o ajusta los valores."`.

#### Triangle geometry

Triangle vertex coordinates inside SVG `viewBox="-55 -35 640 530"`:

```ts
const BL = { x:  70, y: 420 };  // bottom-left   = 100 % Arena
const BR = { x: 470, y: 420 };  // bottom-right  = 100 % Limo
const TP = { x: 270, y:  70 };  // top           = 100 % Arcilla
```

Barycentric mapping `% (sand, silt, clay) → (x, y)`:

```ts
function xyBar(sand: number, silt: number, clay: number) {
  const ns = sand / 100, ni = silt / 100, nc = clay / 100;
  return {
    x: ns * BL.x + ni * BR.x + nc * TP.x,
    y: ns * BL.y + ni * BR.y + nc * TP.y
  };
}
```

Inverse (`(x, y) → {sand, silt, clay}`) — barycentric via 3-vertex inverse matrix, with clamping to non-negative weights and renormalization to sum 1 (so dragging outside the triangle still returns valid percentages).

#### 26 USDA triangle vertices (`USDA_PTS_CSS`)

Each row is `[clayFraction, siltFraction, sandFraction]` (note the order: clay, silt, sand). Indices 0–25 (referred to as `P01…P26` in the R `soiltexture` package).

```ts
const USDA_PTS_CSS: readonly [number, number, number][] = [
  [0.55, 0,     0.45 ],  //  0
  [0.6,  0.4,   0    ],  //  1
  [0.35, 0,     0.65 ],  //  2
  [0.35, 0.2,   0.45 ],  //  3
  [0.4,  0.15,  0.45 ],  //  4
  [0.4,  0.4,   0.2  ],  //  5
  [0.4,  0.6,   0    ],  //  6
  [0.2,  0,     0.8  ],  //  7
  [0.2,  0.275, 0.525],  //  8
  [0.275,0.275, 0.45 ],  //  9
  [0.275,0.5,   0.225],  // 10
  [0.275,0.525, 0.2  ],  // 11
  [0.275,0.725, 0    ],  // 12
  [0.15, 0,     0.85 ],  // 13
  [0.1,  0,     0.9  ],  // 14
  [0.075,0.4,   0.525],  // 15
  [0.075,0.5,   0.425],  // 16
  [0.125,0.8,   0.075],  // 17
  [0.125,0.875, 0    ],  // 18
  [0,    0.15,  0.85 ],  // 19
  [0,    0.3,   0.7  ],  // 20
  [0,    0.5,   0.5  ],  // 21
  [0,    0.8,   0.2  ],  // 22
  [1,    0,     0    ],  // 23  (100 % clay)
  [0,    0,     1    ],  // 24  (100 % sand)
  [0,    1,     0    ]   // 25  (100 % silt)
];
```

#### 12 USDA regions (`USDA_REGIONS`)

Each region has a key, Spanish label, ordered list of vertex indices into `USDA_PTS_CSS`, fill color, and font size for the in-triangle label.

```ts
const USDA_REGIONS = [
  { key: 'Cl',      label: 'Arcilla',                       ix: [23, 0, 4, 5, 1],            fill: '#ebb0b0', fz: 8 },
  { key: 'SiCl',    label: 'Arcilloso limoso',              ix: [1, 5, 6],                   fill: '#d9cee8', fz: 9 },
  { key: 'SaCl',    label: 'Arcilloso arenoso',             ix: [0, 2, 3, 4],                fill: '#6f7a82', fz: 8 },
  { key: 'ClLo',    label: 'Franco arcilloso',              ix: [4, 3, 9, 10, 11, 5],        fill: '#d4a068', fz: 8 },
  { key: 'SiClLo',  label: 'Franco arcilloso limoso',       ix: [5, 11, 12, 6],              fill: '#a8cce4', fz: 8 },
  { key: 'SaClLo',  label: 'Franco arcilloso arenoso',      ix: [2, 7, 8, 9, 3],             fill: '#a8b8cc', fz: 8 },
  { key: 'Lo',      label: 'Franco',                        ix: [9, 8, 15, 16, 10],          fill: '#e6ddc8', fz: 8 },
  { key: 'SiLo',    label: 'Franco limoso',                 ix: [10, 16, 21, 22, 17, 18, 12, 11], fill: '#bfe4bc', fz: 8 },
  { key: 'SaLo',    label: 'Franco arenoso',                ix: [7, 13, 20, 21, 16, 15, 8],  fill: '#d4cce8', fz: 8 },
  { key: 'Si',      label: 'Limo',                          ix: [17, 22, 25, 18],            fill: '#f7f4c8', fz: 8 },
  { key: 'LoSa',    label: 'Arena franca',                  ix: [13, 14, 19, 20],            fill: '#e4d4a8', fz: 8 },
  { key: 'Sa',      label: 'Arena',                         ix: [14, 24, 19],                fill: '#f2a848', fz: 9 }
] as const;
```

#### Classification logic

```ts
function classifyUSDAFrac(sFrac: number, siFrac: number, cFrac: number): string {
  if (!(sFrac + siFrac + cFrac)) return '—';
  if (Math.abs(sFrac + siFrac + cFrac - 1) > 0.02) return '—';
  const pt = xyBar(sFrac * 100, siFrac * 100, cFrac * 100);
  // Point-in-polygon ray-casting against each region's vertex list (in SVG coordinates).
  for (const reg of USDA_REGIONS) {
    const verts = reg.ix.map(j => cssXY(USDA_PTS_CSS[j]));
    if (pointInPoly(pt, verts)) return reg.label;
  }
  // Fallback: nearest centroid (Euclidean distance in SVG space).
  let best = USDA_REGIONS[0].label, bd = Infinity;
  for (const reg of USDA_REGIONS) {
    const c = polyCentroid(reg.ix);
    const d = (c.x - pt.x) ** 2 + (c.y - pt.y) ** 2;
    if (d < bd) { bd = d; best = reg.label; }
  }
  return best;
}
```

`cssXY(row)` calls `xyBar(sand = row[2]×100, silt = row[1]×100, clay = row[0]×100)`.

`pointInPoly` is the classic ray-casting test (semi-open intervals; epsilon `1e-12` in denominator to avoid division by zero).

`polyCentroid` is the standard signed-area centroid formula.

#### Reference CC/PMP ranges per USDA class (`TEXTURE_CC_PMP_MAP`)

Illustrative % vol. ranges shown under the classified texture label.

```ts
const TEXTURE_CC_PMP_MAP: Record<string, { ccLo: number; ccHi: number; pmpLo: number; pmpHi: number }> = {
  'Arena':                       { ccLo:  5, ccHi: 12, pmpLo:  1, pmpHi:  5 },
  'Arena franca':                { ccLo:  8, ccHi: 15, pmpLo:  2, pmpHi:  6 },
  'Franco arenoso':              { ccLo: 10, ccHi: 16, pmpLo:  4, pmpHi:  8 },
  'Franco':                      { ccLo: 18, ccHi: 26, pmpLo:  8, pmpHi: 14 },
  'Franco limoso':               { ccLo: 24, ccHi: 32, pmpLo: 10, pmpHi: 18 },
  'Limo':                        { ccLo: 26, ccHi: 34, pmpLo: 12, pmpHi: 18 },
  'Franco arcilloso':            { ccLo: 28, ccHi: 36, pmpLo: 14, pmpHi: 20 },
  'Franco arcilloso limoso':     { ccLo: 30, ccHi: 38, pmpLo: 15, pmpHi: 22 },
  'Franco arcilloso arenoso':    { ccLo: 26, ccHi: 34, pmpLo: 12, pmpHi: 18 },
  'Arcilloso limoso':            { ccLo: 32, ccHi: 40, pmpLo: 16, pmpHi: 22 },
  'Arcilloso arenoso':           { ccLo: 22, ccHi: 30, pmpLo: 10, pmpHi: 16 },
  'Arcilla':                     { ccLo: 34, ccHi: 45, pmpLo: 18, pmpHi: 26 }
};
```

#### Embedded reference table: particle size (USDA / ISSS)

Shown statically inside `panel2`:

| Partícula | Diámetro (mm)   | vs arcilla |
|-----------|-----------------|------------|
| Arcilla   | < 0.002         | Base (1×)  |
| Limo      | 0.002 – 0.05    | 1 a 25× más grande |
| Arena     | 0.05 – 2.0      | 25 a 1 000× más grande |

#### SVG ternary diagram (`#ternSvg`)

Procedurally drawn by `drawTernary()`:

1. `<defs><clipPath id="triClipTer">` with the outer triangle path.
2. Filled polygons for each `USDA_REGIONS` entry (`polyPath(ix)`), stroked with thin `rgba(15,23,42,0.12)`.
3. 10 % gridlines (3 directions × 9 lines each) inside the clip:
   - `lineConstClayPct(k×10)` connects `xyBar(100−k, 0, k)` to `xyBar(0, 100−k, k)` (constant clay).
   - `lineConstSandPct(k×10)` connects `xyBar(k, 0, 100−k)` to `xyBar(k, 100−k, 0)` (constant sand).
   - `lineConstSiltPct(k×10)` connects `xyBar(100−k, k, 0)` to `xyBar(0, k, 100−k)` (constant silt).
4. Class labels at `polyCentroid(ix)` — split into two lines via `textureLabelTwoLines(label)` (first word on top, rest on bottom; single line if one word). Font weight 700, opacity 0.78, white stroke for legibility.
5. Strong triangle outline (`#475569`, width 2.2).
6. Tick marks + labels every 10 % along all three sides (outside the triangle, rotated for the left/right sides).
7. Axis titles: "Arena (%)" bottom, "Arcilla (%)" left rotated -60°, "Limo (%)" right rotated +60°.
8. Vertex labels "Arena 100", "Limo 100", "Arcilla 100".
9. If `sum > 0`: three colored "constant-%" lines through the current marker (clay=`#ca8a04`, sand=`#2563eb`, silt=`#16a34a`, width 2.5), plus a black marker circle (`r=7`, white stroke) at `xyBar(sN, siN, cN)` (with a transparent `r=16` hit circle).
10. Footer title: "Triángulo de texturas agrícolas USDA (referencia)".

#### Drag interaction

`setupTernaryDrag()` wires pointer events on `#ternSvg`:

- `pointerdown` (button 0 only): convert client coords to SVG coords via `getScreenCTM().inverse()`; if inside triangle (`pointInTextureTriangle`), set `texDrag.active = true`, add `tex-dragging` class, call `setPointerCapture`, apply.
- `pointermove`: if dragging, requestAnimationFrame-throttled `applyTextureFromSvgPoint(x, y)` which calls `barFromXY` to update `pctSand/pctSilt/pctClay` (1-decimal) and redraws.
- `pointerup` / `pointercancel`: end drag, release pointer capture.

`#ternSvg` CSS: `cursor: crosshair`, `touch-action: none`, `user-select: none`, and `cursor: grabbing` while `.tex-dragging`.

### Persistence & cross-tab bridge

- `NpFreePersist.bind('agua_disponible_textura', snapTexSoil, applyTexSoil)`:
  - `snapTexSoil()` returns `{ fields: NpFreePersist.collectIds(TEX_IDS), tab: activeTabBtnId }` where `TEX_IDS = ['cc', 'pmp', 'depth', 'areaHa', 'rootEff', 'thetaVol', 'presetTex', 'pctSand', 'pctSilt', 'pctClay']`.
  - `applyTexSoil(d)` restores the fields, switches to `tab2` if it was active, then calls `updateWater()` and `drawTernary()`.
- After each `updateWater()`, if `window.NpSoilWaterBridge.publish` exists it is called with `{ cc, pmp, depth, areaHa, rootEff, thetaVol: <raw string value> }` — this publishes to the lamina-riego sister tool via a shared localStorage key.

### Numeric parsing patterns

- All inputs parsed with `parseFloat(el.value) || <fallback>` (default fallbacks: `depth → 30`, `areaHa → 1`, `rootEff → 100`, others → 0).
- `thetaVol` is treated as NaN when blank (`el.value === ''`); `hasTheta = thetaStr !== '' && !Number.isNaN(parseFloat(thetaStr))`.
- `toFixed(0)` for m³ outputs, `toFixed(1)` for % vol. and mm, `toFixed(2)` for `areaHa` and `effAreaHa`.
- No locale formatting (uses `.` as decimal separator in inputs).

### Foot disclaimer (es)

> NutriPlant PRO — material educativo. Los valores típicos de CC y PMP varían con estructura, materia orgánica y método de medición; el triángulo de texturas sigue polígonos USDA estándar (referencia Soil Survey Manual / soiltexture). Combine con laboratorio y criterio local.

---

## Tool 2 — Huella de carbono de fertilizantes

### Tool name
- English: **Fertilizer Carbon Footprint (A vs B scenario comparison)**
- Spanish: **Huella de carbono de fertilizantes**

### Purpose
A two-scenario (Programa A / Programa B) carbon-footprint calculator for fertilization programs. Each scenario is a list of fertilizers with per-row logistics route (factory → origin port → sea → destination port → field), dose, and an optional custom manufacturing factor. The tool returns the total kg CO₂e per program (manufacturing + transport + field N₂O), per-hectare value, an "origin-efficiency" benchmark (best/worst case across available origin regions for the same products), and a Program-A-vs-B comparison with pickup-truck-km equivalence. A separate didactic panel compares one fertilizer at two different origins.

### External dependencies (MISSING — must be reconstructed)

The HTML loads three external resources:

1. `assets/free-tools-watermark.css` + `assets/free-tools-embed.js` — cosmetic.
2. `assets/fertilizer-carbon-core.js?v=20260626` — exposes `window.NpFertilizerCarbon` (all logic).
3. `assets/emission-factors-by-country.json?v=20260626` — emission-factor dataset loaded at init via `NpFertilizerCarbon.loadFactors(url)`.

Both files are **MISSING** from the workspace. The HTML is a thin wrapper. The full API surface (every call site observed) and the input/output data shape are captured below so a reimplementation can reconstruct the core.

### `window.NpFertilizerCarbon` API surface (inferred from call sites)

```ts
type NpFertilizerCarbon = {
  // Initialization
  loadFactors(url: string): Promise<Factors>;
  getFactors(): Factors | null;

  // Catalog: countries, origin groups, fertilizers
  getCountries(): Array<{ iso: string; name: string; region?: string }>;
  getOriginGroups(): Array<{ id: string; label: string }>;
  originGroupForCountry(iso: string): string;          // maps a country ISO to an origin-group id (EU, CN, MX, BR, LATAM, GLOBAL, …)
  originGroupLabel(groupId: string): string;           // human label for an origin group
  manufacturingRegionLabel(iso: string): string;       // alias used in compare panel
  getFertilizers(): Fertilizer[];
  getFertilizersForOrigin(originGroup: string): Fertilizer[];     // filtered list (some products unavailable for certain origins)
  getFertilizersForOrigins(isoArr: string[]): Fertilizer[];       // intersection (used by single-product compare)
  findFertilizer(id: string): Fertilizer | null;
  fertilizerFormGroupLabel(formKey: string): string;   // optgroup label for physical_form

  // Destination country + entry points (ports/coasts)
  getDestinationEntryConfig(countryIso: string): {
    label: string;
    hint: string;
    default: string;
    options: Array<{ id: string; label: string }>;
  } | null;
  findDestinationEntryPoint(countryIso: string, entryId: string): { label: string } | null;

  // Transport estimation
  estimateOriginFactoryToPortKm(groupId: string): number | null;
  estimateTransportRoute(input: {
    origin_country_iso: string;
    application_country_iso: string;
    entry_point_id: string | null;
    rows: Array<{ dose: number; origin_country_iso: string }>;
  }): {
    ok: boolean;
    origin_km: number | null;
    maritime_km: number | null;
    road_km: number | null;
    manufacturing_group_label: string;
    destination_country_name: string;
    entry_point_label: string | null;
    note: string;
    disclaimer: string;
  };

  // Main calculation
  calculate(input: CalculationInput): CalculationResult;

  // Origin-efficiency benchmark (best/worst case across available origins)
  calculateOriginEfficiency(input: CalculationInput): OriginEfficiencyBenchmark;

  // Citations
  getCitations(): Citation[];
  formatCitationHtml(c: Citation): string;

  // Formatting helpers
  formatCo2e(kg: number): string;         // returns e.g. "1.234 kg CO₂e" or "1.2 t CO₂e"
  getPickupEquivalence(): {
    label: string;
    label_short: string;
    kg_co2e_per_km: number;   // 0.254
    source: string;           // "DESNZ/DEFRA"
    disclaimer: string;
  };
  co2eToPickupKm(kg: number): number;
  formatPickupKm(km: number): string;     // returns "~N km" string
};
```

### Types (inferred from call sites)

```ts
type Factors = {
  methodology: {
    manufacturing: string;          // "Fertilizers Europe (2020) — promedios regionales DNV"
    field: string;                  // "IPCC"
    factor_year: string | number;   // 2020
    eu_reference_checks: Array<{
      nutriplant_id: string;
      product: string;
      fe_eu_kg_co2e_per_kg: number;
    }>;
  };
  // + internal lookup tables for fertilizers, origins, transport modes, pickup equivalence
};

type Fertilizer = {
  id: string;                              // e.g. "urea", "calcium_nitrate", "potassium_nitrate"
  name: string;                            // display name
  physical_form: 'solid' | 'liquid' | 'other' | string;
  n_total_pct: number;                     // total N % (used for soil N₂O calc + display)
  manufacturing_kg_co2e_per_kg: Record<string, number>;  // per origin-group, e.g. { EU: 1.234, CN: 2.345, MX: 1.8, … }
  manufacturing_availability?: 'local' | 'import_typical' | string;
  // + transport emission factor, density, etc.
};

type Citation = {
  // opaque — only rendered via formatCitationHtml
};

type CalculationInput = {
  origin_country_iso?: string;     // top-level default (overridden per row)
  area_ha: number;
  rows: Array<{
    fertilizer_id: string;
    dose: number;                                     // kg/ha or kg total
    dose_unit?: 'kg_ha' | 'total_kg';
    origin_country_iso: string;
    application_country_iso: string;
    entry_point_id: string | null;
    transport_origin_km: number;
    transport_sea_km: number;
    transport_km: number;                             // road: destination port → field
    factor_source: 'estimated' | 'custom_per_kg' | 'custom_total_mfg';
    custom_factor: number;                            // kg CO₂e / kg product (custom_per_kg mode)
    custom_mfg_total_kg_co2e: number;                 // kg CO₂e total manufacturing (custom_total_mfg mode)
    custom_note: string;
  }>;
};

type CalculationResult = {
  ok: boolean;
  totals: {
    total_kg_co2e: number;
    manufacturing_kg_co2e: number;
    transport_kg_co2e: number;
    transport_origin_kg_co2e: number;
    transport_sea_kg_co2e: number;
    transport_road_kg_co2e: number;
    field_kg_co2e: number;
    per_ha_kg_co2e: number | null;
  };
  rows: Array<{
    ok: boolean;
    fertilizer_id: string;
    fertilizer_name: string;
    dose: number;
    dose_unit: 'kg_ha' | 'total_kg';
    origin_group_label: string;
    application_country_iso: string;
    transport_origin_km: number;
    transport_sea_km: number;
    transport_km: number;
    manufacturing_blocked: boolean;                  // true when no factor available for origin
    factor_source_label: string;
    row_precision: 'user_provided' | 'estimated' | string;
    manufacturing_availability?: 'import_typical' | 'local' | string;
    manufacturing_kg_co2e: number;
    transport_kg_co2e: number;
    field_kg_co2e: number;
    total_kg_co2e: number;
  }>;
  methodology: { manufacturing: string; field: string; factor_year: string | number };
  origin_group_label: string;
  multiple_origins: boolean;
  origins_used: Array<{ name: string }>;
  has_user_provided_factors: boolean;
  citations: Citation[];
};

type OriginEfficiencyBenchmark = {
  ok: boolean;
  adjustable_rows: number;             // count of rows using 'estimated' factor (excludes user-provided)
  range_kg_co2e: number;               // worst − best
  position_pct: number;                // 0 = best, 100 = worst
  efficiency_score: number | string;   // 0–100, higher = better (less CO₂e)
  tier_label: string;                  // e.g. "Excelente", "Bueno", "Mejorable"
  best_case_total_kg_co2e: number;
  current_total_kg_co2e: number;
  worst_case_total_kg_co2e: number;
  potential_reduction_kg_co2e: number;
  potential_reduction_pct: number;
  opportunities: Array<{
    fertilizer_name: string;
    saving_kg_co2e: number;
    best_origin_group_label: string;
  }>;
  has_user_provided_factors: boolean;
  disclaimer: string;
};
```

### Inputs (HTML form controls)

#### Top bar / scenario tabs

| id / control                | label                                | type            | default                              |
|-----------------------------|--------------------------------------|-----------------|--------------------------------------|
| `tabScenarioA`              | Programa A                           | tab button      | active                               |
| `tabScenarioB`              | Programa B                           | tab button      | inactive                             |
| `copyActiveToOtherScenario` | Duplicar al otro programa →          | button          | —                                    |

`switchScenario('a'|'b')` persists the current form to the active scenario, swaps `state.active_scenario`, restores the other scenario's form, re-renders rows, recalculates.
`copyActiveToOtherScenario()` deep-clones the active scenario into the other slot (via `JSON.parse(JSON.stringify(...))`).

#### Route strip (`#supplyChainFlow`) — applies to the active row of the active scenario

Five flow steps with their corresponding input controls:

| step                  | icon  | input id              | label                          | type        | default |
|-----------------------|-------|-----------------------|--------------------------------|-------------|---------|
| 🏭 Fabricación        | 🏭    | `originCountry`       | Fabricación                    | select      | GLOBAL  |
| 🚛 Origen             | 🚛    | `transportOriginKm`   | Origen (km)                    | number      | 0       |
| ⛴️ Marítimo           | ⛴️   | `transportSeaKm`      | Marítimo (km)                  | number      | 0       |
| 🚢 Puerto / país dest.| 🚢    | `applicationCountry`  | Puerto / país destino          | select      | MX      |
| ↳ (entry point)       | ⚓    | `entryPointSelect`    | Costa / puerto                 | select      | (cond.) |
| 🌾 Campo              | 🌾    | `transportKm`         | Campo (km)                     | number      | 0       |

`entryPointField` is conditionally shown (`is-hidden` toggled) based on `getDestinationEntryConfig(applicationCountry)` returning a non-null config with `options.length > 0`. For MX the default `entry_point_id` is `'mx_gulf'`.

#### Auxiliary fields

| id                  | label                  | type    | default | hint                              |
|---------------------|------------------------|---------|---------|-----------------------------------|
| `areaHa`            | Superficie (ha)        | number  | 1       | Converts total dose → kg/ha       |
| `doseUnit`          | Unidad de dosis        | select  | kg_ha   | `kg_ha` or `total_kg`             |
| `applyTransportEstimate` | Estimar km (referencia) | button | —     | Fills `transportOriginKm/Sea/Km`  |

#### Per-row table (`#rowsTable`)

Each row has these controls (rendered by `renderRows()`):

| field              | column header | control                                           | notes                                                                |
|--------------------|---------------|---------------------------------------------------|----------------------------------------------------------------------|
| `fertilizer_id`    | Fertilizante  | `<select class="fert">` grouped by physical_form   | list filtered by row's origin group (`getFertilizersForOrigin`)      |
| (route summary)    | 🛣️ Ruta       | read-only cell `.fc-route-cell`                   | `mfg → dest · N km` (e.g. "China → México · 9 220 km")              |
| `dose`             | Dosis         | `<input class="dose" type="number">` + unit label | unit from `doseUnit`                                                 |
| `factor_source`    | Factor fab.   | `<select class="factor-mode">`                    | `estimated` / `custom_per_kg` / `custom_total_mfg`                   |
| custom value       | Valor propio  | `<input class="custom-val" type="number">`        | disabled when mode = `estimated`; placeholder `"ej. 1.2"` or `"kg CO₂e"` |
| `custom_note`      | Nota (opc.)   | `<input class="custom-note" type="text">`         | disabled when mode = `estimated`; placeholder "EPD, ficha…"          |
| (computed)         | N %           | read-only `.row-n`                                | `fert.n_total_pct + "%"`                                             |
| (computed)         | 🏭 Fab.       | read-only `.row-mfg`                              | kg CO₂e; "— orig." if `manufacturing_blocked`; "PROPIO" badge if `row_precision === 'user_provided'`; "↗ imp." hint if `manufacturing_availability === 'import_typical'` |
| (computed)         | 🚛 Transp.    | read-only `.row-trans`                            | kg CO₂e                                                              |
| (computed)         | 🌾 Suelo      | read-only `.row-field`                            | kg CO₂e (N₂O from soil)                                              |
| (computed)         | Total         | read-only `.row-total`                            | kg CO₂e                                                              |
| (delete)           | (×)           | `<button class="btn-del">×</button>`              | Removes the row (or resets to blank if it's the last one)            |

Clicking anywhere on a `<tr>` (except cells that `event.stopPropagation()`) calls `selectRow(idx)` — sets `active_row_index`, persists the previous route, loads the new row's route into the form, re-renders, and recalculates.

Buttons below the table:
- `+ Agregar fertilizante` (`addRow()`) — appends a new row, copying the active row's route, then selects it.
- `Limpiar` (`clearAll()`) — replaces rows with one blank row (dose 100, area 1, GLOBAL origin, MX destination, `mx_gulf` entry).

#### Single-product compare panel (didactic)

| id            | label                | type    | default            |
|---------------|----------------------|---------|--------------------|
| `cmpFert`     | Fertilizante         | select  | calcium_nitrate    |
| `cmpDose`     | Dosis (kg/ha)        | number  | 100                |
| `cmpOriginA`  | 🏭 Fabricación A     | select  | CN                 |
| `cmpOriginB`  | 🏭 Fabricación B     | select  | EU                 |

For each origin, `NpFertilizerCarbon.calculate()` is called with a single-row input. The panel shows three cards: A total, B total, and the difference (with `% vs fabricación A`). The fertilizer list is the intersection of fertilizers available at both origins (`getFertilizersForOrigins([isoA, isoB])`); if the current `cmpFert` isn't in the intersection, it's reset to the first available.

### Outputs

#### Active-scenario results (`#resultsPanel`)

| id            | label                          | unit            | source                                                  |
|---------------|--------------------------------|-----------------|---------------------------------------------------------|
| `totalDisplay`| Total (Programa A/B)           | kg CO₂e         | `result.totals.total_kg_co2e` via `formatCo2e`          |
| `mfgTotal`    | 🏭 Fabricación                 | kg CO₂e         | `result.totals.manufacturing_kg_co2e`                   |
| `transTotal`  | 🚛 Transporte                  | kg CO₂e         | `result.totals.transport_kg_co2e` (+ breakdown of origin/sea/road sub-totals when > 0) |
| `fieldTotal`  | 🌾 Suelo (N₂O)                 | kg CO₂e         | `result.totals.field_kg_co2e`                           |
| `perHaTotal`  | Por hectárea                   | kg CO₂e/ha      | `result.totals.per_ha_kg_co2e`                          |
| `metaBox`     | Routes/methodology metadata    | text            | route count, selected row, methodology text, precision, factor year |
| `rowDetail`   | (currently empty in this HTML) | —               | —                                                       |

#### Top comparison bar (`#compareTopBar`)

| id           | label        | source                              |
|--------------|--------------|-------------------------------------|
| `compareTopA`| Programa A   | `rA.totals.total_kg_co2e`           |
| `compareTopB`| Programa B   | `rB.totals.total_kg_co2e`           |

#### Reduction banner (`#reductionBanner`, inside `#valueTagline`)

Only shown when `rA.totals.total_kg_co2e > 0 && |diff| > 0.001`:

| condition             | class       | text                                                                                       |
|-----------------------|-------------|--------------------------------------------------------------------------------------------|
| `diff < 0` (B < A)    | (default)   | "↓ Reducción estimada (Programa B vs A): X kg CO₂e (Y% menos CO₂e) · ≈ Z km menos en pick-up 6 cil." |
| `diff > 0` (B > A)    | `increase`  | "↑ Programa B emitiría más: +X kg CO₂e (Y% vs Programa A) · ≈ Z km más en pick-up 6 cil."    |

Sub-text always: "Estimación de referencia — validar antes de comunicar o decidir".

#### Program comparison panel (`#programComparePanel`)

- `#programCompareResults` — three cards: Programa A (blue border), Programa B (purple border), B − A difference (with `+/- % vs Programa A` and per-ha diff).
- `#programComparePickup` — pickup equivalence block with 3 cards:
  - Programa A: `co2eToPickupKm(rA.total)` formatted with `formatPickupKm`.
  - Programa B: same for `rB`.
  - B − A: difference in km (green `.is-diff` border if `kmDiff < −0.5`).
  - Footer: "Factor referencia: 0.254 kg CO₂e/km (DESNZ/DEFRA)."
- `#programCompareCharts` — two side-by-side chart boxes:
  1. **Total estimado CO₂e** — two horizontal bars (A blue, B purple), widths proportional to each total / `max(A, B)`.
  2. **Desglose por componente** — two stacked bars (A and B), each with three segments: `mfg` (#3b82f6 blue), `trans` (#94a3b8 gray), `field` (#22c55e green). Segments computed by `stackedSegments()`:
     ```
     scale = (program.total / maxTotal) × 100
     segMfg  = (program.mfg   / program.total) × scale
     segTrans= (program.trans / program.total) × scale
     segField= (program.field / program.total) × scale
     ```
  - Legend below: Fabricación / Transporte / Suelo (N₂O).
- `#programCompareSummary` — two summary boxes side-by-side (stacked on mobile), each listing `<fertilizer> · dose · origin → dest · total CO₂e` per row.

#### Origin-efficiency panel (`#efficiencyPanel`, hidden by default)

Shown only if `benchmark.ok && benchmark.adjustable_rows > 0`:

- Title: "📊 Nivel de eficiencia por origen (referencia)"
- Score: `<score>/100` + tier label.
- Gauge: horizontal track with gradient `#22c55e → #eab308 → #ef4444`; white circular marker at `position_pct` % from the left.
- Range cards (3): "Mínimo (meores orígenes)", "Tu programa actual" (highlighted), "Máximo (peores orígenes)".
- Potential-reduction callout (if `potential_reduction_kg_co2e > 0.001`): "💡 Podrías reducir hasta X kg CO₂e (~Y%) cambiando solo el origen de fabricación (mismos productos y dosis)."
- Opportunities list (top 3): each entry names the fertilizer, the saving in kg CO₂e, and the best origin group label.
- Disclaimer footer.

If `range_kg_co2e ≤ 0.001` (already at minimum): single paragraph "Con tus productos y dosis actuales, ya estás en el mínimo estimado según los orígenes de fabricación disponibles en la tabla de factores." + disclaimer.

#### Legal notice (`#legalNoticeBox`)

Orange-bordered collapsible banner at the top. Toggled by `toggleLegalNotice()` (bound to `#legalNoticeToggle` via inline `onclick`). The full notice lists:
- No es certificación (no LCA/EPD/audit substitute)
- Validación en campo
- Sin marcas ni proveedores
- Factores propios (user-entered factors are user's responsibility)
- Comparaciones A vs B son escenarios del usuario
- Calibración sectorial (Fertilizers Europe 2020 for urea/AN/CAN/UAN regional averages; no per-plant PCF)
- Disponibilidad regional (hidrosolubles not offered for MX/BR/LATAM if no local production)
- Precisión estimada (±25–40 % manufacturing, ±30–50 % with generic transport/field)
- Decisión final: responsibility of the user
- Link to T&C §7

#### Fertilizers Europe reference table (`#feReferenceTable`)

Collapsed `<details>` panel. Rendered by `renderFeReferenceTable()` from `data.methodology.eu_reference_checks`:

| Product (row.product) | FE EU (2020) (row.fe_eu_kg_co2e_per_kg) | NutriPlant EU (fert.manufacturing_kg_co2e_per_kg.EU) | Δ (np − fe) |
|-----------------------|------------------------------------------|------------------------------------------------------|-------------|

Δ cell shows `✓ 0` (`.ok` class, green) when `|delta| < 0.001`, else signed `+/-X.XXX`.

#### Citations panel (`#citationsPanel`)

- `#citationsFullList` — full list of all citations (`getCitations()` mapped via `formatCitationHtml`).
- `#citationsUsedList` — citations applied to the current calculation (`result.citations`).

### State shape & persistence

```ts
type State = {
  active_scenario: 'a' | 'b';
  scenario_a: Scenario;
  scenario_b: Scenario;
  cmp_fert: string;
  cmp_dose: number;
  cmp_origin_a: string;   // origin-group id (CN, EU, …)
  cmp_origin_b: string;
};

type Scenario = {
  rows: Row[];
  area_ha: number;
  dose_unit: 'kg_ha' | 'total_kg';
  active_row_index: number;
  application_country_iso: string;
  entry_point_id: string | null;
  origin_country_iso: string;
  transport_km: number;
  transport_origin_km: number;
  transport_sea_km: number;
};

type Row = {
  fertilizer_id: string;
  dose: number | '';
  origin_country_iso: string;       // normalized to origin-group id
  application_country_iso: string;
  entry_point_id: string | null;
  transport_origin_km: number;
  transport_sea_km: number;
  transport_km: number;
  factor_source: 'estimated' | 'custom_per_kg' | 'custom_total_mfg';
  custom_factor: string | number;
  custom_mfg_total_kg_co2e: string | number;
  custom_note: string;
};
```

- `LS_KEY = 'nutriplant_free_fertilizer_carbon_v2'`. Legacy key `'nutriplant_free_fertilizer_carbon_v1'` is also checked on load and migrated.
- `migrateState(s)` handles three shapes:
  1. Already-new (has `scenario_a` + `scenario_b`) → just migrate rows.
  2. Legacy single-scenario (has `rows` array) → wraps into `scenario_a`, sets `scenario_b = blankScenario('CN')`, copies `cmp_*` fields.
  3. Otherwise → `null` (fall back to defaults).
- `migrateScenarioRows(sc)` ensures each row has `application_country_iso`, `entry_point_id`, `transport_*_km`, `origin_country_iso`, and migrates `fertilizer_id === 'nk_mg'` → `'potassium_nitrate'` (with an auto-added `custom_note`).
- Defaults:
  - `scenario_a` rows[0]: `{ fertilizer_id: 'urea', dose: 100, origin: 'GLOBAL', app: 'MX', entry: 'mx_gulf', … }`
  - `scenario_b` rows[0]: `{ fertilizer_id: 'urea', dose: 0, origin: 'CN', app: 'MX', entry: 'mx_gulf', … }`
  - `cmp_fert: 'calcium_nitrate'`, `cmp_dose: 100`, `cmp_origin_a: 'CN'`, `cmp_origin_b: 'EU'`

### Known constants & defaults (reproducible from call sites)

```ts
const LS_KEY = 'nutriplant_free_fertilizer_carbon_v2';
const LS_KEY_LEGACY = 'nutriplant_free_fertilizer_carbon_v1';
const PICKUP_KG_CO2E_PER_KM = 0.254;        // DESNZ/DEFRA
const PICKUP_SOURCE = 'DESNZ/DEFRA';
const PRECISION_ESTIMATED = 'Estimado (±30–50%)';
const PRECISION_MIXED = 'Mixta (estimado + factor propio del usuario)';
const PRECISION_MANUFACTURING_RANGE = '±25–40%';
const PRECISION_FULL_RANGE = '±30–50%';

const FACTOR_MODES = [
  { id: 'estimated',        label: 'Estimado' },
  { id: 'custom_per_kg',    label: 'Propio kg/kg' },
  { id: 'custom_total_mfg', label: 'Propio total' }
] as const;

const METHODOLOGY_MANUFACTURING = 'Fertilizers Europe (2020) — promedios regionales DNV';
const METHODOLOGY_FIELD = 'IPCC';
const METHODOLOGY_TRANSPORT = 'DESNZ/DEFRA';

// Default route for new rows
const DEFAULT_APPLICATION_COUNTRY = 'MX';
const DEFAULT_ENTRY_POINT_ID = 'mx_gulf';
const DEFAULT_ORIGIN_A = 'GLOBAL';   // scenario A
const DEFAULT_ORIGIN_B = 'CN';       // scenario B
```

### Fertilizer IDs referenced (from call sites)

- `'urea'`
- `'calcium_nitrate'` (default for cmp panel)
- `'potassium_nitrate'` (legacy `'nk_mg'` migrated to this)

(Many more exist in the missing JSON — the full catalog is not recoverable from this HTML alone; it must be reconstructed from Fertilizers Europe 2020 + IPCC + DESNZ/DEFRA references.)

### Formulas (plain math, reconstructed)

Per row `r` (where `fert = findFertilizer(r.fertilizer_id)` and `originGroup = normalizeManufacturingGroup(r.origin_country_iso)`):

```
# Dose normalization to kg/ha
effectiveDoseKgPerHa = (r.dose_unit === 'total_kg')
  ? r.dose / area_ha
  : r.dose

# Manufacturing emission factor (kg CO₂e per kg product)
if r.factor_source === 'custom_per_kg':
    mfgFactor = r.custom_factor
elif r.factor_source === 'custom_total_mfg':
    mfgFactor = r.custom_mfg_total_kg_co2e / effectiveDoseKgPerHa   # converts total → per-kg
else:  # 'estimated'
    mfgFactor = fert.manufacturing_kg_co2e_per_kg[originGroup]
    # If fert has no factor for originGroup, manufacturing_blocked = true and mfg = 0

# Manufacturing total (kg CO₂e)
manufacturing_kg_co2e = mfgFactor × effectiveDoseKgPerHa × area_ha

# Transport (3 legs) — DESNZ/DEFRA factors
transport_origin_kg_co2e = r.transport_origin_km × <roadFactorPerKgPerHa> × area_ha
transport_sea_kg_co2e    = r.transport_sea_km    × <seaFactorPerKgPerHa> × area_ha
transport_road_kg_co2e   = r.transport_km        × <roadFactorPerKgPerHa> × area_ha
transport_kg_co2e        = transport_origin + transport_sea + transport_road

# Field N₂O — IPCC
field_kg_co2e = effectiveDoseKgPerHa × area_ha × (fert.n_total_pct / 100) × <ipccN2OFactor>

# Row total
total_kg_co2e = manufacturing + transport + field
```

Scenario totals:

```
totals.manufacturing_kg_co2e = Σ rows.manufacturing_kg_co2e
totals.transport_*_kg_co2e   = Σ rows.transport_*_kg_co2e
totals.field_kg_co2e         = Σ rows.field_kg_co2e
totals.total_kg_co2e         = mfg + trans + field
totals.per_ha_kg_co2e        = totals.total_kg_co2e / area_ha   (if area_ha > 0)
```

Program comparison:

```
diff = rB.totals.total_kg_co2e − rA.totals.total_kg_co2e
pct  = rA.totals.total_kg_co2e > 0 ? round(diff / rA.totals.total_kg_co2e × 100) : 0
diffHa = rB.per_ha − rA.per_ha    (if both non-null)

kmA  = rA.total / 0.254           # pickup equivalence
kmB  = rB.total / 0.254
kmDiff = kmB − kmA
```

Origin-efficiency benchmark (`calculateOriginEfficiency`):

```
For each row with factor_source === 'estimated', enumerate all available origin groups
  for that fertilizer's manufacturing_kg_co2e_per_kg map.
For each combination, recompute the scenario total.
best_case_total_kg_co2e = min over all combinations
worst_case_total_kg_co2e = max over all combinations
current_total_kg_co2e = total with the user's current origins
range_kg_co2e = worst − best
position_pct = (current − best) / range × 100    # 0 = best, 100 = worst
efficiency_score = 100 − position_pct             # higher = better
potential_reduction_kg_co2e = current − best
potential_reduction_pct = round(potential_reduction / current × 100)
opportunities = for each row, the saving_kg_co2e if switched to its best origin
adjustable_rows = count of rows with factor_source === 'estimated'
```

Tier labels (inferred from `tier_label` field, ranges not visible in HTML — reconstruct from score bands, e.g. ≥80 "Excelente", 60–79 "Bueno", 40–59 "Mejorable", <40 "Crítico").

### Supply-chain flow strip (`#supplyChainFlow`)

5-column flex strip with 4 arrow separators. Each column has:
- A "flow step" card (icon + label + dynamic value):
  - 🏭 Fabricación → `NpFertilizerCarbon.originGroupLabel(originGroup)`
  - 🚛 Origen → `transportOriginKm + " km → puerto exp."` or `"~" + estimateOriginFactoryToPortKm(group) + " km ref."` or "Sin km origen"
  - ⛴️ Marítimo → `transportSeaKm + " km (→ " + destinationCountry + ")"` or "Sin km marítimo"
  - 🚢 Puerto / país destino → entry-point label or destination-country name
  - 🌾 Campo → `"🚛 " + transportKm + " km a finca"` or "Sin km terrestre"
- Below the step card, the input field(s) for that leg.

On screens ≤ 720 px: switches to horizontal scroll with `scroll-snap-type: x proximity`, columns become 122 px (152 px for the port column), arrow font shrinks.

### Numeric parsing patterns

- All numeric inputs parsed with `Number(el.value) || 0` (dose via `Number(val)` with empty-string preservation in `onRowChange`).
- `dose` is preserved as `''` if blank in the input handler, but normalized to `0` on blur (`onDoseBlur`).
- `area_ha` parsed as `Number(...) || 0` (default 1 shown in HTML attribute but state default is 1).
- `km.toLocaleString('es')` for thousand separators in route summaries (Spanish locale, so `9.220` not `9,220`).
- No floating-point rounding is done at the call-site level — `formatCo2e` is expected to handle it (probably switching between `kg CO₂e` and `t CO₂e` based on magnitude).

### Non-obvious UX

- **Two-scenario design** with a top comparison bar that always shows A vs B side-by-side, regardless of which scenario is being edited.
- **Per-row route**: each row has its own logistics route; the route strip at the top edits the **active row's** route. Clicking a row selects it (`selectRow`), which persists the previous row's route from the form, loads the new row's route, and re-renders.
- **Origin-group normalization**: `origin_country_iso` is always normalized to an origin-group id (EU, CN, MX, BR, LATAM, GLOBAL) via `originGroupForCountry()`. Selecting an origin group filters the fertilizer dropdown to those available there (`getFertilizersForOrigin`); if the current fertilizer isn't available, it's reset to the first available (`fixRowFertilizerForOrigin`).
- **Factor-mode gating**: when `factor_source === 'estimated'`, the custom-value and custom-note inputs are `disabled` and the row's `custom_factor` and `custom_mfg_total_kg_co2e` are cleared.
- **Entry-point conditional**: shown only when `getDestinationEntryConfig(applicationCountry)` returns options. For MX the default entry is `mx_gulf`.
- **"Estimar km (referencia)" button** (`applyTransportEstimate`): calls `estimateTransportRoute()` for the active row's origin → destination and writes the returned `origin_km`, `maritime_km`, `road_km` into `transportOriginKm`, `transportSeaKm`, `transportKm`. Updates the hint text to show the applied values.
- **Transport-estimate hint** (`#transportEstimateHint`) is updated live as the user changes the route; it shows the reference values that *would* be applied if they clicked "Estimar".
- **Active-route title** (`#activeRouteTitle`): shows `"<fert name> · fila X de Y"` so the user knows which row the route strip is editing.
- **Supply-chain flow strip** with scroll-snap on mobile and a "Desliza horizontalmente" hint.
- **"Duplicar al otro programa →" button** deep-clones the active scenario into the other slot (so you can start B from a copy of A and tweak).
- **State migration** from v1 (single-scenario) to v2 (two-scenario) on load.
- **Legacy fertilizer migration**: `'nk_mg'` → `'potassium_nitrate'` with auto-added note "Antes NK+Mg (mezcla comercial); usar KNO₃ + Mg por separado para huella más precisa".
- **Embedded mode**: `html.embed-login .np-free-tool-head { display: none }` (driven by `free-tools-embed.js` adding the class to `<html>`).
- **Legal-notice toggle** (inline `onclick="toggleLegalNotice()"`) — collapses/expands the body, rotates the ▼ icon, swaps "Ver más"/"Ocultar" label.
- **Row selection visual**: `<tr class="row-selected">` gets `background: #eff6ff !important` and an inset blue border.
- **Fertilizer dropdown optgroups**: grouped by `physical_form` via `fertOptionsHtml()` — uses `fertilizerFormGroupLabel(form)` for the optgroup label.
- **Reduced-row calculation**: rows where `manufacturing_blocked === true` show "— orig." in the mfg cell (with a tooltip of the factor-source label); rows with `manufacturing_availability === 'import_typical'` get a "↗ imp." hint; rows with `row_precision === 'user_provided'` get a "PROPIO" badge.
- **Precision label** in metaBox switches between "Estimado (±30–50%)" and "Mixta (estimado + factor propio del usuario)" based on `result.has_user_provided_factors`.
- **Route count** in metaBox: counts distinct `(origin, app, transport_origin_km, transport_sea_km, transport_km)` tuples across rows.

### Methodology references (bibliographic)

- **Fertilizers Europe (2020)** — Carbon Footprint of N Fertilizers (regional averages DNV-validated). Used for manufacturing emission factors of urea, AN, CAN, UAN (and others).
- **IPCC 2006 / 2019 Refinement** — N₂O soil emissions from applied N (Tier 1).
- **DESNZ / DEFRA** (UK government) — freight transport emission factors (road + sea), used for the transport legs and the pickup-truck equivalence (`0.254 kg CO₂e/km`).

---

## Appendix: bonus — nutrient oxide↔element conversion factors

The user mentioned `/tmp/inline_script_1.js` earlier in the task description. Even though it was dropped from the final scope, the conversion factors were easy to extract and are reproduced here as a TS data literal for the next agent's convenience (this is the conversion-calculator logic used by the NutriPlant modal, not by either of the two tools above).

```ts
// Conversion factors: input × factor = output
// Source: /tmp/inline_script_1.js (setupConversionCalculator)
// Rounded to 3 decimal places (matches HTML .toFixed(3) output).
const NUTRIENT_CONVERSIONS = [
  // [from, to, factor]
  ['CaO',  'Ca',   0.715],
  ['Ca',   'CaO',  1.399],
  ['K2O',  'K',    0.830],
  ['K',    'K2O',  1.205],
  ['P2O5', 'P',    0.436],
  ['P',    'P2O5', 2.291],
  ['MgO',  'Mg',   0.603],
  ['Mg',   'MgO',  1.658],
  ['N',    'NO3',  4.429],
  ['NO3',  'N',    0.226],
  ['N',    'NH4',  1.286],
  ['NH4',  'N',    0.778],
  ['S',    'SO4',  3.000],
  ['SO4',  'S',    0.333],
  ['S',    'SO3',  2.497],
  ['SO3',  'S',    0.400],
  ['Zn',   'ZnO',  1.245],
  ['ZnO',  'Zn',   0.803],
  ['Fe',   'Fe2O3',1.430],
  ['Fe2O3','Fe',   0.699],
  ['Mn',   'MnO',  1.291],
  ['MnO',  'Mn',   0.775],
  ['B',    'B2O3', 3.220],
  ['B2O3', 'B',    0.311],
  ['Cu',   'CuO',  1.252],
  ['CuO',  'Cu',   0.799],
  ['Si',   'SiO2', 2.139],
  ['SiO2', 'Si',   0.467],
  ['Mo',   'MoO3', 1.500],
  ['MoO3', 'Mo',   0.667]
] as const;
```

---

## Suggested React/TS file layout (for the next agent)

```
src/tools/
  soil-water-texture/
    SoilWaterTextureTool.tsx          // 2-tab shell, persistence wiring
    tab1-soil-water/
      SoilWaterTab.tsx
      useSoilWaterCalc.ts             // volSoilM3, adPct, adM3, realM3, deficitToCc, lamMmTot, …
      WaterBarChart.tsx                // SVG bar chart (PMP / band / air + θ marker + obj zone)
      PoreConceptDiagrams.tsx          // 3 small SVG conceptual cards
      textureSeries.ts                 // TEXTURE_SERIES preset list
      textureCcPmpMap.ts               // TEXTURE_CC_PMP_MAP
    tab2-texture-triangle/
      TextureTriangleTab.tsx
      TextureTriangle.tsx              // SVG triangle + drag interaction
      useTextureClass.ts               // classifyUSDAFrac + helpers
      usdaData.ts                      // USDA_PTS_CSS + USDA_REGIONS + BL/BR/TP + xyBar/barFromXY
    palette.ts                         // PALETTE constant
    npSoilWaterBridge.ts               // stub for window.NpSoilWaterBridge (publish + computeObjectiveZone)
    npFreePersist.ts                   // generic bind/collectIds/applyIds wrapper (shared)

  fertilizer-carbon/
    FertilizerCarbonTool.tsx           // top-level shell, scenario tabs, legal notice, factor loader
    types.ts                           // State, Scenario, Row, CalculationInput, CalculationResult, …
    constants.ts                       // LS_KEY, PICKUP_KG_CO2E_PER_KM, FACTOR_MODES, METHODOLOGY_*, defaults
    useFertilizerCarbonState.ts        // state, persist, migrate, scenario switching, row CRUD
    ScenarioRouteStrip.tsx             // 5-column flow strip + route form
    FertilizerRowsTable.tsx            // per-row table with inline editing
    ResultsPanel.tsx                   // total + 4 breakdown cards + metaBox
    ProgramComparePanel.tsx            // A vs B cards + pickup equiv + 2 charts + summary boxes
    OriginEfficiencyPanel.tsx          // gauge + range cards + opportunities
    SingleProductComparePanel.tsx      // cmpFert + cmpDose + cmpOriginA/B + 3 result cards
    LegalNotice.tsx                    // collapsible orange banner
    FeReferenceTable.tsx               // Fertilizers Europe calibration table
    CitationsPanel.tsx                 // full list + used list
    npFertilizerCarbonStub.ts          // API surface stub + JSON schema for emission-factors-by-country.json
    emissionFactorsSchema.ts           // TS types for the JSON dataset (must be populated from Fertilizers Europe 2020 + IPCC + DESNZ/DEFRA)
```

### Reconstruction priority for missing data

1. **`emission-factors-by-country.json`** is the critical missing piece. The next agent must compile it from:
   - Fertilizers Europe (2020) "Carbon Footprint of N Fertilizers" — regional average manufacturing factors (kg CO₂e/kg product) for: urea, AN, CAN, UAN, plus other N/P/K fertilizers, by region (EU, CN, MX, BR, LATAM, …). Include `eu_reference_checks` array.
   - IPCC 2006/2019 Refinement — N₂O Tier 1 emission factor for applied mineral N (~0.01 kg N₂O-N / kg N input × 298/28 GWP → ≈0.00293 kg N₂O/kg N × 298 ≈ 0.873 kg CO₂e/kg N applied, but verify exact factor used).
   - DESNZ/DEFRA 2024 freight transport factors — road (kg CO₂e per t·km) and sea container (kg CO₂e per t·km).
   - Fertilizer catalog (id, name, physical_form, n_total_pct, manufacturing_kg_co2e_per_kg per origin group, manufacturing_availability).
   - Destination country list + entry-point config (e.g. MX has `mx_gulf`, `mx_pacific`).
   - Citation list with full bibliographic entries.

2. **`np-soil-water-bridge.js`** is shared with the lamina-riego tool (already documented in spec-batch-c.md). The only methods used here are `publish(state)` and `computeObjectiveZone(cc, pmp)` → `{ lowPctVol, highPctVol, labelShort }` where `low = pmp + 0.4×(cc−pmp)`, `high = pmp + 0.6×(cc−pmp)`.

3. **`fertilizer-carbon-core.js`** is the main logic module. The full API surface is captured above; the formulas are reconstructable from the cited references.
