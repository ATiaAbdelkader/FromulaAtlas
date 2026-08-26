# NutriPlant PRO — Spec Batch C (5 free-tool HTML files)

Source files (in `/tmp/np_tools/`):
1. `tabla-periodica-nutrientes-free.html` (720 lines)
2. `fertilizer-compatibility-free.html` (766 lines)
3. `interacciones-absorcion-movilidad-free.html` (2443 lines)
4. `solubilidad-indice-salino-free.html` (596 lines)
5. `lamina-riego-free.html` (673 lines)

All five tools embed the same `assets/free-tools-watermark.css` and `assets/free-tools-embed.js` ( NutriPlant PRO header + watermark), and four of them share `assets/np-free-local-persist.js` (localStorage auto-save via `window.NpFreePersist.bind(key, snapFn, applyFn)`). The exact API of `NpFreePersist` is documented at the bottom; for React reimplementation, prefer `useState` + `localStorage` instead.

Numeric / locale conventions across the suite:
- Decimal separator shown to user: `,` (es-MX locale via `toLocaleString('es-MX', …)`)
- `fmtNum(n, digits)` → returns `'—'` if `!Number.isFinite(n)`, otherwise `n.toLocaleString('es-MX', { minimumFractionDigits: digits, maximumFractionDigits: digits })`
- HTML escape helper: `escapeHtml(s) = String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')`

---

## TOOL 1 — Periodic Table of Essential Plant Nutrients

**Tool name (EN):** Periodic Table of Essential Plant Nutrients
**Tool name (ES):** Tabla Periódica (Nutrientes Esenciales)
**File:** `tabla-periodica-nutrientes-free.html` (720 lines)

### Purpose
Two-tab tool. Tab 1 renders a full interactive periodic table where elements relevant to plant nutrition (essential nutrients, beneficial elements, structural CHO) are color-coded and clickable, opening a detail card. Tab 2 is a molecular-weight calculator: type a chemical formula (with hydrates, double salts, parentheses) and get molecular weight, element composition %, and per-element equivalent weight.

### Input fields

| id | label | type | default | range / notes |
|---|---|---|---|---|
| `molFormula` | Fórmula | text | `''` | Any chemical formula: `KNO3`, `H2SO4`, `Ca(NO3)2·4H2O`, `NH4NO3`, etc. Supports unicode sub/superscripts, `·`/`*`/`+` as block separators, `[]`, `{}` → `()`. |

No numeric inputs on tab 1 — element click selects & opens detail card.
Examples are clickable chips that fill `molFormula` and trigger calculation.

### Output fields (tab 1 — element detail)

| id | label | source |
|---|---|---|
| `selTitle` | Element header (e.g. `N — Nitrógeno`) | `ELEMENTS.find(el => el.s === symbol).s + ' — ' + el.n` |
| `selMeta` | `Número atómico: Z • Grupo: G • Período: P (or 'Lantánidos'/'Actínidos' for p=8/9)` | from `ELEMENTS` |
| `selGrid` (5 cards) | Peso atómico / Valencia(s) / Radio atómico / Electronegatividad / Categoría | from `DETAILS[symbol]` + `category()` |
| `selRole` | Agronomic role text | from `DETAILS[symbol].role` |
| `selUseInMol` | "+ Usar en calculadora molecular" button → appends symbol to `molFormula` and switches to tab 2 | — |

### Output fields (tab 2 — molecular weight calculator)

| id | label | formula |
|---|---|---|
| `molSummary` → card "Peso molecular (PM)" | g/mol | `Σ(atomCounts[sym] × ATOMIC_WEIGHTS[sym])` formatted with 3 decimals |
| `molSummary` → card "Fórmula normalizada" | — | `formatNormalizedDisplay(normalized)` — replaces `·` with ` + ` |
| `molSummary` → card "Peso equivalente (molécula)" (optional) | g/eq | `mw / n` where `n` is inferred by `inferMoleculeEquivalent()` |
| `molSummary` → card "Criterio eq. molécula" (optional) | label | e.g. "Ácido sulfúrico (2 H⁺ por S)" |
| `molTableBody` rows | Element / Átomos / Masa parcial (g/mol) / % en molécula / P. eq. meq (g/eq) | per element: `partial = atoms × ATOMIC_WEIGHTS[sym]`; `pct = partial / mw × 100`; `eq = ATOMIC_WEIGHTS[sym] / primaryValence(sym)` |
| `molError` | Error message (hidden when valid) | exception text from parser |

### ALL formulas / equations

**1. Molecular weight**
```
mw = Σ_sym (atomCounts[sym] × ATOMIC_WEIGHTS[sym])
```

**2. Atom collection (recursive, with multiplier)**
```
collectElements(terms, mult, out):
  for each term in terms:
    if term.type === 'element':
      out[term.symbol] += term.count × mult
    else: # group
      collectElements(term.terms, mult × term.count, out)
```

**3. Per-element % composition**
```
pct(sym) = (atoms(sym) × ATOMIC_WEIGHTS[sym]) / mw × 100
```

**4. Per-element equivalent weight (g/eq)**
```
eq(sym) = ATOMIC_WEIGHTS[sym] / primaryValence(sym)
```

**5. Primary valence selection**
```
primaryValence(sym):
  val = DETAILS[sym].val  (e.g. "+2, +3" or "-2, +4, +6")
  if matches /+\d+/ → min of all positive integers
  else if matches /-\d+/ → min of all negative magnitudes
  else fallback to DEFAULT_VALENCE[sym] or null
```

**6. Motif count (for NO₃⁻ and NH₄⁺ detection)**
```
countMotifInTerms(terms, mult, motif):
  for each contiguous window of length |motif| in terms (at top level):
    if every position matches motif[j].symbol and Math.abs(count - motif[j].count) < 1e-9:
      total += mult
  recurse into groups (× mult × group.count)
  return total
```
Motifs: `NO3 = [{N,1},{O,3}]`, `NH4 = [{N,1},{H,4}]`.

**7. Molecule equivalent inference (`inferMoleculeEquivalent`)**
Looks at `atomCounts` H/O/P/S/B/Cl:
- If H > 0 && S > 0 && |H/S − 2| < 0.01 → `{n: H, label: 'Ácido sulfúrico (2 H⁺ por S)'}`
- else if H > 0 && P > 0 && H % P === 0 && H/P ≤ 3 → `{n: H, label: 'Ácido fosforoso (H/P)'}`
- else if H > 0 && B > 0 && H % B === 0 → `{n: H, label: 'Ácido bórico (H/B)'}`
- else if H > 0 && Cl > 0 && H === Cl → `{n: H, label: 'Ácido clorhídrico'}`
- else if H > 0 && O > 0 && H % 2 === 0 && H/2 === O && !P && !S && !B → `{n: H, label: 'Hidróxido (OH⁻)'}`
- else → `null`
When matched, equivalent weight = `mw / n`.

**8. Formula normalization (`normalizeFormula`)**
- Map subscript/superscript unicode chars (`₀-₉`, `⁰-⁹`, `⁺`, `⁻`) to ASCII
- Replace `−` (U+2212) → `-`
- Strip whitespace
- Replace `{`→`(`, `}`→`)`, `[`→`(`, `]`→`)`
- Replace `:` → `·`
- Replace `)(` → `)*(`
- Then `replace(/([0-9)\]])([\*+])([0-9(A-Z])/g, '$1·$3')` — i.e., insert `·` separator when a digit/closing-bracket is followed by `*` or `+` and a digit/letter (so hydrates / double salts get split, but ionic charges like `NH4+` at end are not affected)
- Final `replace(/\.+/g, '.')` collapses dot runs

**9. Block split & unit mass**
```
parts = normalized.split(/[·•.]/).filter(Boolean)
for each part:
  m = part.match(/^(\d+(?:\.\d+)?)(.*)$/)
  coef = m && m[2] ? Number(m[1]) : 1
  body = m && m[2] ? m[2] : part
  parseTerms(body, 0, null) → terms tree
  unitMw = Σ atomCounts(sym) × ATOMIC_WEIGHTS[sym]  (within this block)
  mass = unitMw × coef
  pct = mass / mw × 100
```

**10. Format normalized display**
```
formatNormalizedDisplay(normalized) = String(normalized).replace(/·/g, ' + ')
```

### Constants and lookup tables

```ts
// ---- Element categories ----
const ESSENTIAL = new Set(['N','P','K','Ca','Mg','S','Fe','Mn','Zn','Cu','B','Mo','Cl','Ni']);
const BENEFICIAL = new Set(['Si','Na','Ti','Al','Co','Se','V']);
const CHO = new Set(['C','H','O']);

function category(sym: string): 'cho' | 'essential' | 'beneficial' | 'other' {
  if (CHO.has(sym)) return 'cho';
  if (ESSENTIAL.has(sym)) return 'essential';
  if (BENEFICIAL.has(sym)) return 'beneficial';
  return 'other';
}

// ---- Atomic weights (g/mol) — all 118 elements ----
const ATOMIC_WEIGHTS: Record<string, number> = {
  H:1.008, He:4.003, Li:6.94, Be:9.012, B:10.81, C:12.011, N:14.007, O:15.999, F:18.998, Ne:20.180,
  Na:22.990, Mg:24.305, Al:26.982, Si:28.085, P:30.974, S:32.06, Cl:35.45, Ar:39.948,
  K:39.098, Ca:40.078, Sc:44.956, Ti:47.867, V:50.942, Cr:51.996, Mn:54.938, Fe:55.845, Co:58.933, Ni:58.693,
  Cu:63.546, Zn:65.38, Ga:69.723, Ge:72.630, As:74.922, Se:78.971, Br:79.904, Kr:83.798,
  Rb:85.468, Sr:87.62, Y:88.906, Zr:91.224, Nb:92.906, Mo:95.95, Tc:98, Ru:101.07, Rh:102.91, Pd:106.42,
  Ag:107.87, Cd:112.41, In:114.82, Sn:118.71, Sb:121.76, Te:127.60, I:126.90, Xe:131.29,
  Cs:132.91, Ba:137.33, La:138.91, Ce:140.12, Pr:140.91, Nd:144.24, Pm:145, Sm:150.36, Eu:151.96, Gd:157.25,
  Tb:158.93, Dy:162.50, Ho:164.93, Er:167.26, Tm:168.93, Yb:173.05, Lu:174.97, Hf:178.49, Ta:180.95, W:183.84,
  Re:186.21, Os:190.23, Ir:192.22, Pt:195.08, Au:196.97, Hg:200.59, Tl:204.38, Pb:207.2, Bi:208.98, Po:209,
  At:210, Rn:222, Fr:223, Ra:226, Ac:227, Th:232.04, Pa:231.04, U:238.03, Np:237, Pu:244, Am:243, Cm:247,
  Bk:247, Cf:251, Es:252, Fm:257, Md:258, No:259, Lr:266, Rf:267, Db:268, Sg:269, Bh:270, Hs:277, Mt:278,
  Ds:281, Rg:282, Cn:285, Nh:286, Fl:289, Mc:290, Lv:293, Ts:294, Og:294
};

// ---- Subscript/superscript unicode map ----
const SUBSCRIPT_MAP: Record<string, string> = {
  '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9',
  '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9',
  '⁺':'+','⁻':'-'
};

// ---- Default valences (fallback when DETAILS[sym].val is missing) ----
const DEFAULT_VALENCE: Record<string, number> = {
  H:1, Li:1, Na:1, K:1, Rb:1, Cs:1, Ag:1, Cu:1, Tl:1, N:1, P:1, Cl:1, F:1, Br:1, I:1,
  Ca:2, Mg:2, Sr:2, Ba:2, Zn:2, Mn:2, Ni:2, Co:2, Cd:2, Hg:2, Pb:2, Fe:2, Cu:2,
  Al:3, B:3, Fe:3, Cr:3, As:3, S:2, O:2, C:4, Si:4, Se:2, Mo:6
};

// ---- Molecule examples (chips on tab 2) ----
const MOL_EXAMPLES = [
  { label: 'KNO₃', formula: 'KNO3' },
  { label: 'H₂SO₄', formula: 'H2SO4' },
  { label: 'Ca(NO₃)₂', formula: 'Ca(NO3)2' },
  { label: 'NH₄NO₃', formula: 'NH4NO3' },
  { label: '(NH₄)₂SO₄', formula: '(NH4)2SO4' },
  { label: 'KH₂PO₄', formula: 'KH2PO4' },
  { label: 'MgSO₄', formula: 'MgSO4' },
  { label: 'H₃BO₃', formula: 'H3BO3' },
  { label: 'ZnSO₄', formula: 'ZnSO4' }
];
```

#### DETAILS — per-element agronomic card (24 entries)

```ts
const DETAILS: Record<string, { aw: string; val: string; rad: string; en: string; role: string }> = {
  H:  { aw: '1.008',   val: '+1',             rad: '53 pm',  en: '2.20', role: 'Elemento estructural (CHO). Presente en agua y compuestos orgánicos.' },
  C:  { aw: '12.011',  val: '-4, +2, +4',     rad: '67 pm',  en: '2.55', role: 'Elemento estructural principal de biomasa vegetal.' },
  O:  { aw: '15.999',  val: '-2',             rad: '48 pm',  en: '3.44', role: 'Elemento estructural (agua, compuestos orgánicos y respiración).' },
  N:  { aw: '14.007',  val: '-3, +3, +5',     rad: '56 pm',  en: '3.04', role: 'Macronutriente esencial: proteínas, clorofila y crecimiento vegetativo.' },
  P:  { aw: '30.974',  val: '+5, +3',         rad: '98 pm',  en: '2.19', role: 'Macronutriente esencial: energía (ATP), raíces y floración.' },
  K:  { aw: '39.098',  val: '+1',             rad: '227 pm', en: '0.82', role: 'Macronutriente esencial: regulación osmótica, calidad y transporte.' },
  Ca: { aw: '40.078',  val: '+2',             rad: '197 pm', en: '1.00', role: 'Macronutriente esencial: pared celular, firmeza y crecimiento apical.' },
  Mg: { aw: '24.305',  val: '+2',             rad: '145 pm', en: '1.31', role: 'Macronutriente esencial: átomo central de clorofila.' },
  S:  { aw: '32.06',   val: '-2, +4, +6',     rad: '88 pm',  en: '2.58', role: 'Macronutriente esencial: aminoácidos azufrados y metabolismo.' },
  Fe: { aw: '55.845',  val: '+2, +3',         rad: '126 pm', en: '1.83', role: 'Micronutriente esencial: síntesis de clorofila y enzimas redox.' },
  Mn: { aw: '54.938',  val: '+2, +4, +7',     rad: '127 pm', en: '1.55', role: 'Micronutriente esencial: fotosíntesis y activación enzimática.' },
  Zn: { aw: '65.38',   val: '+2',             rad: '134 pm', en: '1.65', role: 'Micronutriente esencial: regulación hormonal y enzimas.' },
  Cu: { aw: '63.546',  val: '+1, +2',         rad: '128 pm', en: '1.90', role: 'Micronutriente esencial: enzimas y metabolismo oxidativo.' },
  B:  { aw: '10.81',   val: '+3',             rad: '85 pm',  en: '2.04', role: 'Micronutriente esencial: pared celular, floración y cuajado.' },
  Mo: { aw: '95.95',   val: '+6, +4',         rad: '139 pm', en: '2.16', role: 'Micronutriente esencial: metabolismo del nitrógeno.' },
  Cl: { aw: '35.45',   val: '-1, +1, +5, +7', rad: '79 pm',  en: '3.16', role: 'Micronutriente esencial en trazas: balance iónico y estomas.' },
  Ni: { aw: '58.693',  val: '+2',             rad: '124 pm', en: '1.91', role: 'Micronutriente esencial en bajas dosis: ureasa y metabolismo de N.' },
  Si: { aw: '28.085',  val: '+4',             rad: '111 pm', en: '1.90', role: 'Elemento benéfico: refuerza tejidos y tolerancia a estrés.' },
  Na: { aw: '22.990',  val: '+1',             rad: '186 pm', en: '0.93', role: 'Benéfico en algunas especies; puede apoyar balance osmótico.' },
  Ti: { aw: '47.867',  val: '+4, +3',         rad: '147 pm', en: '1.54', role: 'Elemento benéfico reportado en trazas (según especie y manejo).' },
  Al: { aw: '26.982',  val: '+3',             rad: '143 pm', en: '1.61', role: 'No esencial; en suelos ácidos suele ser tóxico, aunque puede tener efectos benéficos puntuales en algunas especies.' },
  Co: { aw: '58.933',  val: '+2, +3',         rad: '125 pm', en: '1.88', role: 'Benéfico para fijación biológica de nitrógeno (leguminosas).' },
  Se: { aw: '78.971',  val: '-2, +4, +6',     rad: '103 pm', en: '2.55', role: 'Elemento benéfico en trazas; exceso puede causar toxicidad.' },
  V:  { aw: '50.942',  val: '+5, +4, +3',     rad: '134 pm', en: '1.63', role: 'Elemento benéfico reportado en condiciones específicas.' }
};
```

#### ELEMENTS — full periodic table layout (118 elements; rows 8 and 9 are lanthanides/actinides placed in a f-block)

```ts
type Element = { z: number; s: string; n: string; p: number; g: number };
// p = period (1-7 for main, 8 = Lantánidos, 9 = Actínidos); g = group (1-18)

const ELEMENTS: Element[] = [
  { z:1,s:'H', n:'Hidrógeno', p:1, g:1 }, { z:2,s:'He', n:'Helio', p:1, g:18 },
  { z:3,s:'Li', n:'Litio', p:2, g:1 }, { z:4,s:'Be', n:'Berilio', p:2, g:2 }, { z:5,s:'B', n:'Boro', p:2, g:13 }, { z:6,s:'C', n:'Carbono', p:2, g:14 }, { z:7,s:'N', n:'Nitrógeno', p:2, g:15 }, { z:8,s:'O', n:'Oxígeno', p:2, g:16 }, { z:9,s:'F', n:'Flúor', p:2, g:17 }, { z:10,s:'Ne', n:'Neón', p:2, g:18 },
  { z:11,s:'Na', n:'Sodio', p:3, g:1 }, { z:12,s:'Mg', n:'Magnesio', p:3, g:2 }, { z:13,s:'Al', n:'Aluminio', p:3, g:13 }, { z:14,s:'Si', n:'Silicio', p:3, g:14 }, { z:15,s:'P', n:'Fósforo', p:3, g:15 }, { z:16,s:'S', n:'Azufre', p:3, g:16 }, { z:17,s:'Cl', n:'Cloro', p:3, g:17 }, { z:18,s:'Ar', n:'Argón', p:3, g:18 },
  { z:19,s:'K', n:'Potasio', p:4, g:1 }, { z:20,s:'Ca', n:'Calcio', p:4, g:2 }, { z:21,s:'Sc', n:'Escandio', p:4, g:3 }, { z:22,s:'Ti', n:'Titanio', p:4, g:4 }, { z:23,s:'V', n:'Vanadio', p:4, g:5 }, { z:24,s:'Cr', n:'Cromo', p:4, g:6 }, { z:25,s:'Mn', n:'Manganeso', p:4, g:7 }, { z:26,s:'Fe', n:'Hierro', p:4, g:8 }, { z:27,s:'Co', n:'Cobalto', p:4, g:9 }, { z:28,s:'Ni', n:'Níquel', p:4, g:10 }, { z:29,s:'Cu', n:'Cobre', p:4, g:11 }, { z:30,s:'Zn', n:'Zinc', p:4, g:12 }, { z:31,s:'Ga', n:'Galio', p:4, g:13 }, { z:32,s:'Ge', n:'Germanio', p:4, g:14 }, { z:33,s:'As', n:'Arsénico', p:4, g:15 }, { z:34,s:'Se', n:'Selenio', p:4, g:16 }, { z:35,s:'Br', n:'Bromo', p:4, g:17 }, { z:36,s:'Kr', n:'Kriptón', p:4, g:18 },
  { z:37,s:'Rb', n:'Rubidio', p:5, g:1 }, { z:38,s:'Sr', n:'Estroncio', p:5, g:2 }, { z:39,s:'Y', n:'Itrio', p:5, g:3 }, { z:40,s:'Zr', n:'Zirconio', p:5, g:4 }, { z:41,s:'Nb', n:'Niobio', p:5, g:5 }, { z:42,s:'Mo', n:'Molibdeno', p:5, g:6 }, { z:43,s:'Tc', n:'Tecnecio', p:5, g:7 }, { z:44,s:'Ru', n:'Rutenio', p:5, g:8 }, { z:45,s:'Rh', n:'Rodio', p:5, g:9 }, { z:46,s:'Pd', n:'Paladio', p:5, g:10 }, { z:47,s:'Ag', n:'Plata', p:5, g:11 }, { z:48,s:'Cd', n:'Cadmio', p:5, g:12 }, { z:49,s:'In', n:'Indio', p:5, g:13 }, { z:50,s:'Sn', n:'Estaño', p:5, g:14 }, { z:51,s:'Sb', n:'Antimonio', p:5, g:15 }, { z:52,s:'Te', n:'Telurio', p:5, g:16 }, { z:53,s:'I', n:'Yodo', p:5, g:17 }, { z:54,s:'Xe', n:'Xenón', p:5, g:18 },
  { z:55,s:'Cs', n:'Cesio', p:6, g:1 }, { z:56,s:'Ba', n:'Bario', p:6, g:2 }, { z:57,s:'La', n:'Lantano', p:6, g:3 }, { z:72,s:'Hf', n:'Hafnio', p:6, g:4 }, { z:73,s:'Ta', n:'Tantalio', p:6, g:5 }, { z:74,s:'W', n:'Wolframio', p:6, g:6 }, { z:75,s:'Re', n:'Renio', p:6, g:7 }, { z:76,s:'Os', n:'Osmio', p:6, g:8 }, { z:77,s:'Ir', n:'Iridio', p:6, g:9 }, { z:78,s:'Pt', n:'Platino', p:6, g:10 }, { z:79,s:'Au', n:'Oro', p:6, g:11 }, { z:80,s:'Hg', n:'Mercurio', p:6, g:12 }, { z:81,s:'Tl', n:'Talio', p:6, g:13 }, { z:82,s:'Pb', n:'Plomo', p:6, g:14 }, { z:83,s:'Bi', n:'Bismuto', p:6, g:15 }, { z:84,s:'Po', n:'Polonio', p:6, g:16 }, { z:85,s:'At', n:'Astato', p:6, g:17 }, { z:86,s:'Rn', n:'Radón', p:6, g:18 },
  { z:87,s:'Fr', n:'Francio', p:7, g:1 }, { z:88,s:'Ra', n:'Radio', p:7, g:2 }, { z:89,s:'Ac', n:'Actinio', p:7, g:3 }, { z:104,s:'Rf', n:'Rutherfordio', p:7, g:4 }, { z:105,s:'Db', n:'Dubnio', p:7, g:5 }, { z:106,s:'Sg', n:'Seaborgio', p:7, g:6 }, { z:107,s:'Bh', n:'Bohrio', p:7, g:7 }, { z:108,s:'Hs', n:'Hassio', p:7, g:8 }, { z:109,s:'Mt', n:'Meitnerio', p:7, g:9 }, { z:110,s:'Ds', n:'Darmstadtio', p:7, g:10 }, { z:111,s:'Rg', n:'Roentgenio', p:7, g:11 }, { z:112,s:'Cn', n:'Copernicio', p:7, g:12 }, { z:113,s:'Nh', n:'Nihonio', p:7, g:13 }, { z:114,s:'Fl', n:'Flerovio', p:7, g:14 }, { z:115,s:'Mc', n:'Moscovio', p:7, g:15 }, { z:116,s:'Lv', n:'Livermorio', p:7, g:16 }, { z:117,s:'Ts', n:'Tenesino', p:7, g:17 }, { z:118,s:'Og', n:'Oganesón', p:7, g:18 },
  // Period 8 = Lantánides (Z 58-71)  — placed in f-block row
  { z:58,s:'Ce', n:'Cerio', p:8, g:4 }, { z:59,s:'Pr', n:'Praseodimio', p:8, g:5 }, { z:60,s:'Nd', n:'Neodimio', p:8, g:6 }, { z:61,s:'Pm', n:'Prometio', p:8, g:7 }, { z:62,s:'Sm', n:'Samario', p:8, g:8 }, { z:63,s:'Eu', n:'Europio', p:8, g:9 }, { z:64,s:'Gd', n:'Gadolinio', p:8, g:10 }, { z:65,s:'Tb', n:'Terbio', p:8, g:11 }, { z:66,s:'Dy', n:'Disprosio', p:8, g:12 }, { z:67,s:'Ho', n:'Holmio', p:8, g:13 }, { z:68,s:'Er', n:'Erbio', p:8, g:14 }, { z:69,s:'Tm', n:'Tulio', p:8, g:15 }, { z:70,s:'Yb', n:'Iterbio', p:8, g:16 }, { z:71,s:'Lu', n:'Lutecio', p:8, g:17 },
  // Period 9 = Actínides (Z 90-103)
  { z:90,s:'Th', n:'Torio', p:9, g:4 }, { z:91,s:'Pa', n:'Protactinio', p:9, g:5 }, { z:92,s:'U', n:'Uranio', p:9, g:6 }, { z:93,s:'Np', n:'Neptunio', p:9, g:7 }, { z:94,s:'Pu', n:'Plutonio', p:9, g:8 }, { z:95,s:'Am', n:'Americio', p:9, g:9 }, { z:96,s:'Cm', n:'Curio', p:9, g:10 }, { z:97,s:'Bk', n:'Berkelio', p:9, g:11 }, { z:98,s:'Cf', n:'Californio', p:9, g:12 }, { z:99,s:'Es', n:'Einsteinio', p:9, g:13 }, { z:100,s:'Fm', n:'Fermio', p:9, g:14 }, { z:101,s:'Md', n:'Mendelevio', p:9, g:15 }, { z:102,s:'No', n:'Nobelio', p:9, g:16 }, { z:103,s:'Lr', n:'Lawrencio', p:9, g:17 }
];
```

### Layout / CSS for periodic table
- `.board` is a CSS grid with `grid-template-columns: 44px repeat(18, 56px) 92px;` and `grid-template-rows: 24px repeat(9, 56px);` gap 4px.
- For each element, `grid-column = g + 1`, `grid-row = p + 1` (because the first row & column hold axis labels).
- Top-row labels `G1`–`G18` placed at row 1, column `g+1`.
- Side-row labels `P1`–`P7`, `Ln`, `Ac` placed at column 1, rows 2–10.
- Side-block badges "Bloque s/p/d/f" placed at column 20 in rows 3, 4, 6, 9-10.
- Ln/Ac labels at column 4 row 9/10.
- Default opacity for `.el` is 0.42 (faded for "other" elements); `.essential`, `.beneficial`, `.cho` set `opacity: 1` and color their background.

### Non-obvious UX
- Two tabs (`.tab-btn` + `.tab-pane`). Tab switch via `switchTab(tabId)`.
- Element click selects it (adds `.selected`, removes from previous), populates detail panel, and wires the "+ Usar en calculadora molecular" button to append the symbol string to `molFormula` and switch to tab 2.
- `lastClickedSymbol` tracked globally (currently only used internally — exposed as `window.npPeriodicAppendSymbol(symbol)`).
- On page load, N is auto-selected (`first.click()`).
- Mol calc is triggered by clicking `#molCalcBtn`, pressing Enter in `#molFormula`, or clicking any example chip.
- Clear button (`#molClearBtn`) resets input, hides error and results.
- Nutrient elements in the composition table get `.is-nutrient` class (green tint).
- % bar: `<div class="mol-bar"><span style="width:{min(100,pct).toFixed(1)}%"></span></div>`.
- `fmtNum(atoms, atoms % 1 ? 2 : 0)` — shows atoms with 0 decimals if integer, 2 if fractional.
- Equivalent weight column: shows `—` when `primaryValence()` returns null.
- Sorting of elements in composition table: descending by `atomCounts[sym] * ATOMIC_WEIGHTS[sym]` (i.e. by mass contribution).

### Block-display name override (`blockDisplayName`)
For block labels in the molecular calc table, special cases:
- `Ca(NO3)2` → `'Nitrato de calcio Ca(NO₃)₂'`
- `NH4NO3` → `'Nitrato de amonio NH₄NO₃'`
- `H2O` / `(H2O)` → `'Agua H₂O'`
- Otherwise: `formatNormalizedDisplay(body)` (replaces `·` with ` +`)

### No persistence
This tool does NOT use `NpFreePersist` — state is ephemeral (no localStorage save).

---

## TOOL 2 — Fertilizer Compatibility Matrix

**Tool name (EN):** Fertilizer Compatibility Matrix
**Tool name (ES):** Compatibilidad de fertilizantes
**File:** `fertilizer-compatibility-free.html` (766 lines)

### Purpose
Renders a 32×32 **triangular** (lower) matrix of compatibility codes (C/R/I) between 32 common soluble fertilizers + acids used in fertigation. Codes are derived from explicit trait-based rules + an explicit override map. Clicking a cell opens a detailed panel (what happens / impact / critical factor / conditions / recommended action). Clicking a row/column header highlights that fertilizer's row+column.

### Input fields
None — purely a display/reference tool. No numeric inputs.

### Output fields

| id | label | source |
|---|---|---|
| `compatTable` | The matrix table (sticky corner + sticky top header + sticky left column). Each cell is a `<button class="cell-btn l-{c,r,i}" data-i data-j data-a data-b>` showing `C` / `R` / `I`. Cells where `j > i` are empty (upper triangle). | `inferLevel(aid, bid)` for each `(i, j)` with `j ≤ i` |
| `detailTitle` | Title in detail panel (e.g. "🟢 Compatible", "🟡 Precaución", "🔴 No compatible", "🟢 Mismo producto", or "Fertilizante: {name}" when only a header was clicked) | from `DETAIL_KEYS.*.title` or fertilizer name |
| `detailBody` | Full detail HTML: badge + fertilizer names + sections (Qué pasa, Impacto, Factor crítico, Condición, Acción recomendada) | from `detailTemplate()` → `DETAIL_KEYS.*` |

### ALL formulas / equations (compatibility inference)

```
inferLevel(aid, bid):
  if aid === bid → 'C'
  k = keyPair(aid, bid)  // sorted "a|b" with aid < bid
  if OVERRIDE[k] → OVERRIDE[k]
  A = TR[aid]; B = TR[bid]
  ca = A.ca_no3 || B.ca_no3     // is one of them calcium nitrate?
  function has(t) { return !!(A[t] || B[t]) }
  isMap = aid === 'map' || bid === 'map'
  isMkp = aid === 'mkp' || bid === 'mkp'

  // Rule 1: Ca(NO3)2 vs phosphate / P-complex / phosphoric acid
  if ca && (has('po4') || has('p_acid') || (has('npk') && (A.po4 || B.po4))):
      if (A.po4 || B.po4 || A.npk || B.npk) && !has('hno3') → 'I'
  if ca && (has('h3po4') || (A.strong_acid && A.h3po4) || (B.strong_acid && B.h3po4)) → 'I'
  if ca && (has('h2so4') || A.h2so4 || B.h2so4) → 'I'

  // Rule 2: Ca + sulfate (gypsum precipitation)
  if ca && has('so4') && (A.so4 || B.so4):
      if (A.nh4 && A.so4) || (B.nh4 && B.so4) → 'I'
      if aid|bid ∈ {sop, sulfato_magnesio} → 'I'
      if aid|bid === 'nks' → 'I'

  // Rule 3: metal-sulfate micros + phosphate (MAP/MKP / ortho-P)
  if has('metal_sulfate') && (has('po4') || isMap || isMkp) → 'I'

  // Rule 4: chelates + orthophosphate (Caution)
  if (A.chelate || B.chelate) && (isMap || isMkp || (has('po4') && (A.npk || B.npk))) → 'R'

  // Rule 5: KNO3-family + ammonium sulfate / SOP (salting)
  if (aid|bid ∈ {nks, nk_mg}) && (has('nh4') && has('so4')) → 'R'
  if (aid|bid === 'nks') && (aid|bid === 'sop') → 'R'

  // Rule 6: strong acids mixed together
  if A.strong_acid && B.strong_acid && aid !== bid → 'R'

  return 'C'
```

`keyPair(ia, ib)` returns `ia < ib ? ia+'|'+ib : ib+'|'+ia` — note comparison is **string comparison** of the IDs (so override keys must use the alphabetically-smaller id first).

### Constants and lookup tables

```ts
type Fert = { id: string; name: string };

const FERTILIZERS: Fert[] = [
  { id: 'urea', name: 'Urea' },
  { id: 'nitrato_amonio', name: 'Nitrato de amonio' },
  { id: 'fosfonitrato_33_03_00', name: 'Fosfonitrato' },
  { id: 'sulfato_amonio_soluble', name: 'Sulfato de amonio' },
  { id: 'nitrato_calcio_granular', name: 'Nitrato de calcio' },
  { id: 'nitrato_calcio_cristal', name: 'Nitrato de calcio (cristal)' },
  { id: 'nitrato_magnesio', name: 'Nitrato de magnesio' },
  { id: 'map', name: 'MAP (fosfato monoamónico)' },
  { id: 'mkp', name: 'MKP' },
  { id: 'nks', name: 'NKS' },
  { id: 'nk_mg', name: 'NK + Mg' },
  { id: 'sop', name: 'SOP (sulfato de potasio)' },
  { id: 'kcl_soluble', name: 'KCl (cloruro de potasio)' },
  { id: 'cacl2_dihidratado', name: 'Cloruro de calcio (dihidratado)' },
  { id: 'sulfato_magnesio', name: 'Sulfato de magnesio' },
  { id: 'triple_19_me', name: 'Triple 19 +Me' },
  { id: 'npk_13_04_25_znb', name: '13-4-25 Zn+B' },
  { id: 'mix_micros_edta', name: 'Mix micros EDTA' },
  { id: 'quelato_fe', name: 'Fe EDTA' },
  { id: 'fe_dtpa', name: 'Fe DTPA' },
  { id: 'fe_eddha', name: 'Fe EDDHA' },
  { id: 'quelato_mn', name: 'Mn EDTA' },
  { id: 'quelato_zn', name: 'Zn EDTA' },
  { id: 'quelato_cu', name: 'Cu EDTA' },
  { id: 'acido_borico', name: 'Ácido bórico' },
  { id: 'molibdato_sodio', name: 'Molibdato de sodio (Mo)' },
  { id: 'sulfatos_micros', name: 'Sulfatos Fe, Mn, Zn, Cu' },
  { id: 'silicio', name: 'Fuente de Si (soluble)' },
  { id: 'acido_fosforico_75', name: 'Ácido fosfórico 75%' },
  { id: 'acido_fosforico_85', name: 'Ácido fosfórico 85%' },
  { id: 'acido_nitrico_55', name: 'Ácido nítrico 55%' },
  { id: 'acido_sulfurico_98', name: 'Ácido sulfúrico 98%' }
];

// Traits used by inferLevel()
const TR: Record<string, Set<string> | Record<string, boolean>> = {
  urea: { urea: true },
  nitrato_amonio: { nh4: true, no3: true },
  fosfonitrato_33_03_00: { n: true, p: true, po4: true },
  sulfato_amonio_soluble: { nh4: true, so4: true },
  nitrato_calcio_granular: { ca_no3: true, ca: true },
  nitrato_calcio_cristal: { ca_no3: true, ca: true },
  nitrato_magnesio: { no3: true, mg: true },
  map: { nh4: true, po4: true, p_acid: true },
  mkp: { k: true, po4: true, p_acid: true },
  nks: { no3: true, k: true, so4: true },
  nk_mg: { no3: true, k: true, mg: true },
  sop: { k: true, so4: true },
  kcl_soluble: { k: true, cl: true },
  cacl2_dihidratado: { ca: true, cl: true },
  sulfato_magnesio: { mg: true, so4: true },
  triple_19_me: { npk: true, po4: true, nh4: true, no3: true, k: true, micro: true },
  npk_13_04_25_znb: { npk: true, po4: true, nh4: true, no3: true, k: true, so4: true, micro: true },
  mix_micros_edta: { chelate: true, edta: true, micro: true },
  quelato_fe: { chelate: true, edta: true, fe: true },
  fe_dtpa: { chelate: true, dtpa: true, fe: true },
  fe_eddha: { chelate: true, eddha: true, fe: true },
  quelato_mn: { chelate: true, edta: true, mn: true },
  quelato_zn: { chelate: true, edta: true, zn: true },
  quelato_cu: { chelate: true, edta: true, cu: true },
  acido_borico: { b: true, weak_acid: true },
  molibdato_sodio: { mo: true },
  sulfatos_micros: { metal_sulfate: true, so4: true, micro: true },
  silicio: { si: true },
  acido_fosforico_75: { strong_acid: true, h3po4: true, po4: true },
  acido_fosforico_85: { strong_acid: true, h3po4: true, po4: true },
  acido_nitrico_55: { strong_acid: true, hno3: true, no3: true },
  acido_sulfurico_98: { strong_acid: true, h2so4: true, so4: true }
};
```

#### OVERRIDE — explicit pair overrides (alphabetical order: smaller id first)

```ts
const OVERRIDE: Record<string, 'C' | 'R' | 'I'> = {
  'mkp|nitrato_calcio_granular': 'I',
  'map|nitrato_calcio_granular': 'I',
  'map|nitrato_calcio_cristal': 'I',
  'mkp|nitrato_calcio_cristal': 'I',
  'sulfato_amonio_soluble|nitrato_calcio_granular': 'I',
  'sulfato_amonio_soluble|nitrato_calcio_cristal': 'I',
  'sulfato_magnesio|nitrato_calcio_granular': 'I',
  'sulfato_magnesio|nitrato_calcio_cristal': 'I',
  'sop|nitrato_calcio_granular': 'I',
  'sop|nitrato_calcio_cristal': 'I',
  'acido_fosforico_75|nitrato_calcio_granular': 'I',
  'acido_fosforico_75|nitrato_calcio_cristal': 'I',
  'acido_fosforico_85|nitrato_calcio_granular': 'I',
  'acido_fosforico_85|nitrato_calcio_cristal': 'I',
  'acido_sulfurico_98|nitrato_calcio_granular': 'I',
  'acido_sulfurico_98|nitrato_calcio_cristal': 'I',
  'nks|sulfato_amonio_soluble': 'R',
  'sop|nks': 'R',
  'map|sulfatos_micros': 'I',
  'mkp|sulfatos_micros': 'I',
  'mix_micros_edta|map': 'R',
  'mix_micros_edta|mkp': 'R',
  'fe_eddha|map': 'R',
  'fe_eddha|mkp': 'R',
  'nitrato_magnesio|mix_micros_edta': 'R',
  'nitrato_magnesio|quelato_fe': 'R'
};
```

### Detail-template selection (`detailTemplate`)

```ts
function detailTemplate(aid, bid, level) {
  if (aid === bid) return DETAIL_KEYS.same;
  const A = TR[aid], B = TR[bid];
  const ca = A.ca_no3 || B.ca_no3;
  const mapMkp = (aid|bid) ∈ {map, mkp};

  if (level === 'I') {
    if (mapMkp && ca && (A.po4 || B.po4)) return DETAIL_KEYS.ca_phosphate_mkp;
    if (ca && (A.h3po4 || B.h3po4)) return DETAIL_KEYS.ca_acid_phosphoric;
    if (ca && (A.h2so4 || B.h2so4)) return DETAIL_KEYS.ca_acid_sulfuric;
    if (ca && (A.so4 || B.so4)) {
      if ((A.nh4 && A.so4) || (B.nh4 && B.so4)) return DETAIL_KEYS.ca_sulfate;
      if ((aid|bid) ∈ {sop, sulfato_magnesio, nks}) return DETAIL_KEYS.ca_sulfate;
    }
    if ((A.metal_sulfate || B.metal_sulfate) && (A.po4 || B.po4)) return DETAIL_KEYS.metal_sulfate_phosphate;
    return DETAIL_KEYS.default_i;
  }
  if (level === 'R') {
    if ((A.chelate || B.chelate) && (A.po4 || B.po4)) return DETAIL_KEYS.chelate_phosphate;
    if ((aid|bid) ∈ {nks, nk_mg} && ((A.nh4 && A.so4) || (B.nh4 && B.so4))) return DETAIL_KEYS.kno3_sulfate_salting;
    if ((aid|bid) ∈ {sop} && (aid|bid) ∈ {nks}) return DETAIL_KEYS.kno3_sulfate_salting;
    if (A.strong_acid && B.strong_acid) return DETAIL_KEYS.strong_acids;
    if ((A.chelate || B.chelate) && (A.mg || B.mg) && (aid|bid) === 'nitrato_magnesio') return DETAIL_KEYS.chelate_phosphate;
    return DETAIL_KEYS.default_r;
  }
  return DETAIL_KEYS.default_c;
}
```

### DETAIL_KEYS — full text for each detail template

```ts
const DETAIL_KEYS = {
  ca_phosphate_mkp: {
    title: '🔴 No compatible',
    que: 'Formación de fosfato de calcio (Ca₃(PO₄)₂) → precipitado poco soluble.',
    impacto: ['↓ disponibilidad de Ca', '↓ disponibilidad de P', 'riesgo de taponamiento de goteros / líneas'],
    factor: 'Concentración y pH local en la mezcla.',
    cond: ['❌ No en la misma solución madre con fosfatos ortofosfato.', '⚠️ Riesgo incluso a pH cercano a neutro si la concentración es alta.'],
    accion: ['Separar en tanque A / B', 'Inyectar por separado', 'Diluir bien antes de mezclar en línea si el diseño lo permite']
  },
  ca_sulfate: {
    title: '🔴 No compatible',
    que: 'Formación de yeso (CaSO₄·2H₂O) al mezclar Ca²⁺ con SO₄²⁻ en medio concentrado.',
    impacto: ['Turbidez', 'precipitado', 'obstrucción'],
    factor: 'Producto de solubilidad; empeora en solución madre.',
    cond: ['Especialmente crítico con sulfato de amonio, SOP o sulfato de magnesio frente a nitrato de calcio.'],
    accion: ['Tanques separados', 'Orden: disolver primero el que menos precipita según tu protocolo', 'Nunca concentrar ambos en el mismo carboy']
  },
  ca_acid_phosphoric: {
    title: '🔴 No compatible',
    que: 'Reacción ácido–base + fosfato: precipitados de Ca–P y riesgo de calor local.',
    impacto: ['Precipitados', 'inestabilidad de la mezcla'],
    factor: 'Concentración del ácido y del calcio.',
    cond: ['No mezclar ácido fosfórico concentrado con nitrato de calcio en el mismo volumen pequeño.'],
    accion: ['Ácido en un tanque, calcio en otro', 'Dilución fuerte antes de llegar a línea']
  },
  ca_acid_sulfuric: {
    title: '🔴 No compatible',
    que: 'Sulfato + calcio → yeso; además calor de dilución del ácido.',
    impacto: ['Precipitado', 'daño a componentes plásticos si hay calor local'],
    factor: 'Concentración.',
    cond: ['Evitar co-disolución concentrada.'],
    accion: ['Tanques separados', 'Seguridad: siempre ácido al agua, nunca al revés']
  },
  metal_sulfate_phosphate: {
    title: '🔴 No compatible',
    que: 'Sulfatos de microelementos con MAP/MKP pueden generar fosfatos insolubles de Fe/Zn/Mn/Cu.',
    impacto: ['Pérdida de micro y P', 'turbidez'],
    factor: 'pH y concentración.',
    cond: ['Muy frecuente en solución madre.'],
    accion: ['Micros quelatados en otro tanque', 'o MAP/MKP separado de sulfatos metálicos']
  },
  chelate_phosphate: {
    title: '🟡 Precaución',
    que: 'Los ortofosfatos compiten con quelatos (especialmente Fe); puede haber intercambio y pérdida de eficacia.',
    impacto: ['↓ Fe quelatado disponible', 'interacciones lentas en tanque'],
    factor: 'Tiempo de contacto y concentración.',
    cond: ['Más delicado en solución madre concentrada.'],
    accion: ['Fe quelato en tanque B', 'fosfatos en A', 'mezcla solo ya diluida en línea']
  },
  kno3_sulfate_salting: {
    title: '🟡 Precaución',
    que: 'Combinaciones K/NO₃ con sulfatos pueden reducir solubilidad conjunta ("salting out").',
    impacto: ['Cristalización en frío', 'sedimentos'],
    factor: 'Temperatura y concentración total de sales.',
    cond: ['Vigilar especialmente solución madre fría.'],
    accion: ['Reducir concentración', 'separar tanques', 'agitar / mantener temperatura estable']
  },
  strong_acids: {
    title: '🟡 Precaución',
    que: 'Mezclar ácidos fuertes entre sí o con sales sin protocolo puede generar calor, salpicaduras y descomposición.',
    impacto: ['Riesgo físico-químico', 'corrosión'],
    factor: 'Orden y dilución.',
    cond: ['Cada ácido suele ir en etapa separada de preparación.'],
    accion: ['No mezclar concentrados', 'EPP', 'agua primero']
  },
  default_c: {
    title: '🟢 Compatible (típico)',
    que: 'En condiciones habituales de solución de trabajo diluida no se espera precipitado grave; revisa siempre ficha del fabricante.',
    impacto: ['—'],
    factor: 'Concentración final y calidad del agua.',
    cond: ['Validar en tu instalación.'],
    accion: ['Prueba de jarra / solución madre pequeña antes de escalar']
  },
  default_r: {
    title: '🟡 Precaución',
    que: 'Interacción o límite de solubilidad según tabla y experiencia.',
    impacto: ['Posible turbidez o reducción de eficacia'],
    factor: 'Concentración, pH, temperatura.',
    cond: ['Monitorear solución madre.'],
    accion: ['Diluir más', 'separar tanques', 'consultar técnico']
  },
  default_i: {
    title: '🔴 No compatible',
    que: 'Riesgo alto de precipitado u obstrucción en condiciones típicas de fertirriego.',
    impacto: ['Obstrucción', 'pérdida de nutrientes'],
    factor: 'Concentración.',
    cond: ['Evitar co-maduración.'],
    accion: ['Separar A/B', 'inyección separada']
  },
  same: {
    title: '🟢 Mismo producto',
    que: 'Sin interacción entre dos lotes del mismo fertilizante en esta matriz.',
    impacto: ['—'], factor: '—', cond: ['—'], accion: ['—']
  }
};
```

### Matrix layout / CSS
- `.compat` table with `--compat-col: 56px` for fixed cell size.
- `thead th.corner` is sticky top-left (200px wide × 84px high), `thead th.col-vlabel` are sticky-top column headers (rotated/wrapped text via `-webkit-line-clamp: 2`), `tbody th.row-h` are sticky-left row headers (200px wide, `cursor: help`, full name in `title`).
- Lower triangle only: cells where `j > i` are `<td class="empty-cell">` (no button).
- Each cell button has classes `cell-btn l-{c,r,i}` (green/yellow/red backgrounds), `data-i`, `data-j`, `data-a`, `data-b` attributes, and `aria-label` + `title` = `"{nameA} ↔ {nameB} — {Compatible|Precaución|Incompatible}"`.

### Non-obvious UX
- Click cell → highlights: clears all `.hl-fert .hl-row .hl-col .hl-both .selected`, then adds `.selected` + `.hl-both` to clicked, `.hl-row` to row-neighbors, `.hl-col` to col-neighbors, `.hl-fert` to corresponding row/col headers. Renders detail.
- Click row header or column header → calls `highlightFert(k)` which highlights the whole row + column of that fertilizer and shows a generic "Fertilizante: {name}" panel (no detail).
- Header click also stops the previous cell selection.
- Tooltip on hover: full name (for headers) or pair-name + level (for cells).
- `restoreCompatUi(d)` re-clicks the persisted cell or re-highlights the persisted fert on load.
- Persistence: `window.NpFreePersist.bind('fertilizer_compatibility', snapFn, applyFn)` — saves `{ fert, pair }` (fert = selectedFert index, pair = [i, j]).

### Color codes
- `C` (Compatible): `#bbf7d0` background, `#14532d` text. Badge `#dcfce7` / `#14532d`.
- `R` (Precaución): `#fef08a` background, `#713f12` text. Badge `#fef9c3` / `#713f12`.
- `I` (Incompatible): `#fecaca` background, `#7f1d1d` text. Badge `#fee2e2` / `#7f1d1d`.

---

## TOOL 3 — Nutrient Interactions & Mobility

**Tool name (EN):** Nutrient Interactions & Mobility
**Tool name (ES):** Interacciones y movilidad nutrimental
**File:** `interacciones-absorcion-movilidad-free.html` (2443 lines)

### Purpose
Four-tab educational reference tool:
1. **Mulder diagram** — circular SVG of 14 ions with antagonism (red) and synergy (blue) edges; click an ion to see its card.
2. **Root-arrival mechanisms** — horizontal 3-segment stacked bars per ion showing % contribution of mass-flow / diffusion / root-interception; click a row for the ion's ficha.
3. **Mobility & symptoms** — dichotomous key (symptoms → nutrient), 3 lists of pills (mobile / immobile / very-immobile), and a ficha with functions + tips per element. Also embeds a reference table of nutrient concentrations in dry matter (Taiz & Zeiger / Epstein).
4. **pH vs availability** — 14 schematic curves (one per nutrient, plus Al) showing relative availability across pH 4–9; click a row to read the chemistry explanation.

### Input fields
None — purely display/reference. All interaction is by clicking elements in the visualizations.

### Output fields (per section)

**Section 1 (Mulder diagram):**
| id | label | source |
|---|---|---|
| `detailTitle` | `"{ion} — {name}"` (e.g. `"NO₃⁻ — Nitrato"`) | from `SPEC[id].ion + ' — ' + SPEC[id].name` |
| `detailBody` | HTML with tag chips for antagonists (red), synergists from this ion (blue), functional relations (green), and a shortTip card | from `SPEC[id]` + `relationIdsFor(id, kind)` |

**Section 2 (root-arrival):**
| id | label | source |
|---|---|---|
| `ionBars` | 14 stacked bar rows (one per ion in `ARRIVAL`) | each row = `mf%` (blue) + `dif%` (green) + `int%` (orange) segments with percentages inline |
| `fichaArrTitle` | `"{lab} — {name}"` | from `ARRIVAL[i]` |
| `fichaArrBody` | 4 lines: Vía dominante / Qué significa / Depende de / Riesgo común | from `ARRIVAL[i]` |

**Section 3 (mobility):**
| id | label | source |
|---|---|---|
| `pillsOld`, `pillsYoung`, `pillsCrit` | 3 lists of element pills (mobile / immobile / very-immobile) | `[['N','P','K','Mg','Mo'], ['S','Fe','Mn','Zn','Cu','Ca','B'], ['Ca','B']]` |
| `mobFichaTitle` | `"{sym} — {name}"` | from `EL_NAMES[sym]` |
| `mobFichaBody` | Movilidad / Dónde se ve primero / Síntoma común / Funciones principales (list with markers) / Tip | from `MOBILITY[sym]` |
| symptom-diagram (static) | 3-column dichotomous key (Hojas viejas / Hojas jóvenes / Brotes yemas meristemos frutos) | static HTML with `data-mob-sym` buttons |

**Section 4 (pH curves):**
| id | label | source |
|---|---|---|
| `phRows` | 14 SVG sparkline rows (one per nutrient + Al) | from `PH_NUTRIENTS` |
| `phFichaTitle` | `"{lab} · {name}"` | from `PH_NUTRIENTS[i]` |
| `phFichaBody` | Tag chip + intro paragraph + bullet list | from `PH_NUTRIENTS[i]` |

### Constants and lookup tables

#### SPEC — ion interaction card (14 entries)

```ts
type IonSpec = {
  ion: string;          // display formula with charges
  short: string;        // short label inside SVG circle
  name: string;
  antagonists: string[];  // ids of competing ions (bidirectional)
  synergists: string[];   // ids of synergistic ions (one-directional from this ion)
  functional: string[];   // functional-relation tags (green)
  shortTip: string;
};

const SPEC: Record<string, IonSpec> = {
  no3: {
    ion: 'NO₃⁻', short: 'NO₃⁻', name: 'Nitrato',
    antagonists: ['cl'], synergists: ['k','nh4','moo4'],
    functional: ['Síntesis proteica (con NH₄⁺)','Balance aniónico','Relación con absorción de cationes'],
    shortTip: 'Sinergias azules = manejo conjunto frecuente (p. ej. KNO₃, N amoniacal+nitrato, Mo en cadena del NO₃⁻). El Cl⁻ en exceso puede competir por transporte (rojo).'
  },
  nh4: {
    ion: 'NH₄⁺', short: 'NH₄⁺', name: 'Amonio',
    antagonists: ['k','ca','mg'], synergists: ['h2po4','so4','no3'],
    functional: ['Asimilación directa (menos carbono que NO₃⁻)','Efecto en rizósfera y pH local'],
    shortTip: 'NH₄⁺ alto puede competir por sitios de transporte con K⁺, Ca²⁺ y Mg²⁺ y alterar el balance catiónico.'
  },
  h2po4: {
    ion: 'H₂PO₄⁻ / HPO₄²⁻', short: 'H₂PO₄⁻', name: 'Fosfato (formas ácida/alcalina según pH)',
    antagonists: ['zn','fe','cu','mn','ca'], synergists: ['nh4','k','mg'],
    functional: ['Energía (ATP/ADP)','Ácidos nucleicos','Estrategia radicular'],
    shortTip: 'P alto en suelo/solución se asocia a menudo con antagonismo relativo de micronutrientes (Zn, Fe, Cu, Mn) y con Ca²⁺ (precipitación / fijación de fosfatos en suelos calcareos o con mucho Ca); revisar ratios y pH.'
  },
  k: {
    ion: 'K⁺', short: 'K⁺', name: 'Potasio',
    antagonists: ['mg','ca','nh4'], synergists: ['no3','h2po4','so4','cl'],
    functional: ['Regulación osmótica','Transporte de azúcares','Apertura y cierre estomático'],
    shortTip: 'K alto puede presionar la absorción o balance de Mg y Ca, especialmente cuando la relación catiónica está desbalanceada.'
  },
  ca: {
    ion: 'Ca²⁺', short: 'Ca²⁺', name: 'Calcio',
    antagonists: ['mg','k','nh4','h2po4'], synergists: ['so4','no3','moo4'],
    functional: ['Pared celular','Membranas','Transmisión de señales'],
    shortTip: 'Exceso de P puede reducir Ca²⁺ disponible por precipitación/fijación; otros cationes o baja transpiración también afectan el llegado a fruto y tejidos jóvenes.'
  },
  mg: {
    ion: 'Mg²⁺', short: 'Mg²⁺', name: 'Magnesio',
    antagonists: ['k','ca','nh4'], synergists: ['h2po4','so4','no3'],
    functional: ['Centro de la clorofila','Activación enzimática'],
    shortTip: 'Exceso relativo de K, Ca o NH₄ puede afectar el balance de Mg.'
  },
  so4: {
    ion: 'SO₄²⁻', short: 'SO₄²⁻', name: 'Sulfato',
    antagonists: ['moo4'], synergists: ['no3','nh4','k'],
    functional: ['Aminoácidos azufrados','Estrés y defensas'],
    shortTip: 'Sulfato en exceso puede afectar toma de molibdato en algunas condiciones (competencia aniónica).'
  },
  fe: {
    ion: 'Fe²⁺ / Fe³⁺', short: 'Fe²⁺/Fe³⁺', name: 'Hierro (especiación según pH y oxígeno)',
    antagonists: ['h2po4','zn','cu','mn'], synergists: ['no3','moo4'],
    functional: ['Cloroplastos','Enzimas redox'],
    shortTip: 'P alto, Zn o Cu en exceso, y Mn en condiciones ácidas suelen empeorar la Fe disponible; pH alto y carbonatos también. Mo apoya la cadena del N cuando hay NO₃⁻.'
  },
  mn: {
    ion: 'Mn²⁺', short: 'Mn²⁺', name: 'Manganeso',
    antagonists: ['h2po4','fe','zn','cu'], synergists: ['no3'],
    functional: ['Fotosíntesis (fotosistema)','Activación enzimática'],
    shortTip: 'Interactúa con pH y a veces con Fe, Cu y P; con Cu y Zn suele predominar competencia más que sinergia de absorción.'
  },
  zn: {
    ion: 'Zn²⁺', short: 'Zn²⁺', name: 'Zinc',
    antagonists: ['h2po4','cu','ca','fe','mn'], synergists: [],
    functional: ['Auxinas','enzimas','integridad de membranas'],
    shortTip: 'P alto, Fe o Cu en exceso, y Mn en suelos ácidos pueden inducir Zn relativo bajo; revisar ratio P:Zn en suelo y hoja.'
  },
  cu: {
    ion: 'Cu²⁺', short: 'Cu²⁺', name: 'Cobre',
    antagonists: ['zn','h2po4','fe','mn'], synergists: ['no3'],
    functional: ['Lignificación','fotosíntesis'],
    shortTip: 'Exceso de Zn o interferencia con Fe/P pueden modificar el balance de Cu; con Mn suele haber más competencia que sinergia.'
  },
  b: {
    ion: 'H₃BO₃ / B(OH)₄⁻', short: 'H₃BO₃', name: 'Boro (especiación según pH)',
    antagonists: ['ca'], synergists: ['nh4'],
    functional: ['Pared celular','División celular','Polinización'],
    shortTip: 'Ca alto puede reducir B disponible; el B es sensible a humedad y lixiviación.'
  },
  moo4: {
    ion: 'MoO₄²⁻', short: 'MoO₄²⁻', name: 'Molibdato',
    antagonists: ['so4'], synergists: ['no3','nh4'],
    functional: ['Nitrato reductasa','fijación de N','Cofactores Fe en cadena del N'],
    shortTip: 'SO₄²⁻ en exceso puede competir con MoO₄²⁻. La relación con Fe es funcional (enzimas del N), no sinergia directa de absorción.'
  },
  cl: {
    ion: 'Cl⁻', short: 'Cl⁻', name: 'Cloruro',
    antagonists: ['no3'], synergists: ['k','nh4'],
    functional: ['Balance iónico','fotosíntesis (PSII)','adaptación osmótica'],
    shortTip: 'Cl⁻ y NO₃⁻ compiten en algunas condiciones (rojo). Con K⁺ y NH₄⁺ suele manejarse en sales comunes (KCl, NH₄Cl).'
  }
};

// Clockwise order around the circle (starting at top, -π/2):
const NODE_ORDER = ['no3','nh4','h2po4','k','ca','mg','so4','fe','mn','zn','cu','b','moo4','cl'];
```

#### Edge construction

```ts
// Antagonism edges: built bidirectionally from each ion's antagonists list.
//   addEdge(a, b, kind) sorts the pair (a < b string comparison) and dedupes.
// Synergy edges: built from each ion's synergists list, but only displayed directionally
//   (synergyFrom(focusId, otherId) — only true if focusId lists otherId as synergist).
//   The edge itself is still added bidirectionally for drawing, but the highlight uses
//   synergyFrom(focus, other) to decide if it should be drawn as "syn" from the focus.

// Layout constants (SVG viewBox 0 0 520 420):
const cx = 260, cy = 230, r = 168, NODE_R = 24;
// position for ion i: ang = -π/2 + (i / NODE_ORDER.length) × 2π
//   x = cx + r × cos(ang)
//   y = cy + r × sin(ang)

// Edge endpoints are trimmed by NODE_R so lines don't pierce the circles:
//   ux = (p2.x - p1.x) / len, uy = (p2.y - p1.y) / len
//   x1 = p1.x + ux × NODE_R, y1 = p1.y + uy × NODE_R
//   x2 = p2.x - ux × NODE_R, y2 = p2.y - uy × NODE_R
```

#### Antagonism / synergy predicates

```ts
function antagonistic(a, b) {
  return SPEC[a].antagonists.includes(b) || SPEC[b].antagonists.includes(a);
}
// Synergy is directional: only from the focused ion
function synergyFrom(focusId, otherId) {
  return (SPEC[focusId].synergists || []).includes(otherId);
}
```

#### ARRIVAL — root-arrival mechanism percentages (14 ions)

```ts
type ArrivalRow = {
  id: string; lab: string; name: string;
  mf: number;  // mass flow %
  dif: number; // diffusion %
  int: number; // root interception %
  dom: string; // dominant mechanism text
  mean: string; dep: string; risk: string;
};
// Note: mf + dif + int = 100 for every row.

const ARRIVAL: ArrivalRow[] = [
  { id:'no3', lab:'NO₃⁻', name:'Nitrato', mf:78, dif:14, int:8,
    dom:'Flujo de masas',
    mean:'Se mueve bien con el agua hacia las raíces cuando hay transpiración activa.',
    dep:'Transpiración, humedad del suelo, distribución radicular.',
    risk:'Lixiviación si el aporte excede la demanda y el sistema es permeable.' },
  { id:'nh4', lab:'NH₄⁺', name:'Amonio', mf:38, dif:47, int:15,
    dom:'Difusión + flujo de masas (según retención)',
    mean:'Gran parte queda en cambiable; en solución suele ser menos móvil que el nitrato: la llegada mezcla difusión y flujo de masas según CIC, nitrificación y recarga en solución.',
    dep:'CIC, humedad, temperatura, nitrificación, competencia catiónica.',
    risk:'Toxicidad amonio si acumula; competencia con K⁺, Ca²⁺, Mg²⁺.' },
  { id:'h2po4', lab:'H₂PO₄⁻ / HPO₄²⁻', name:'Fosfato', mf:8, dif:80, int:12,
    dom:'Difusión',
    mean:'Se mueve lentamente hacia la raíz; la "disponibilidad" en análisis no siempre es acercamiento a la rizósfera.',
    dep:'Humedad, raíz activa, pH, Ca, Fe, Al y temperatura.',
    risk:'Puede haber P en el suelo, pero no necesariamente entrando al ritmo que la planta demanda.' },
  { id:'k', lab:'K⁺', name:'Potasio', mf:24, dif:66, int:10,
    dom:'Difusión (fuerte) + flujo de masas',
    mean:'Con alta demanda suele crearse una zona menos concentrada cerca de la raíz; en muchos sistemas la llegada efectiva se explica más por difusión desde el potasio intercambiable (y el contenido en solución) que solo por el volumen de agua transpirada.',
    dep:'CIC, buffers de K⁺ en suelo, humedad, densidad radicular, demanda transpirativa.',
    risk:'Desequilibrio con otros cationes; lixiviación en suelos arenosos.' },
  { id:'ca', lab:'Ca²⁺', name:'Calcio', mf:70, dif:18, int:12,
    dom:'Flujo de masas + intercepción radicular',
    mean:'Depende mucho del movimiento de agua, transpiración y raíz activa.',
    dep:'Humedad, CE, VPD, raíz activa y demanda del tejido.',
    risk:'Puede haber Ca en suelo, pero no llegar bien a fruto o tejidos jóvenes (baja "conductividad" hacia ápices y fruto).' },
  { id:'mg', lab:'Mg²⁺', name:'Magnesio', mf:62, dif:24, int:14,
    dom:'Flujo de masas + difusión',
    mean:'Menos dominante que Ca en flujo de masas puro; contribución importante de difusión.',
    dep:'CEC, humedad, competencia con K⁺/NH₄⁺/Ca²⁺.',
    risk:'Deficiencia relativa con fertilización alta en K.' },
  { id:'so4', lab:'SO₄²⁻', name:'Sulfato', mf:58, dif:30, int:12,
    dom:'Flujo de masas + difusión',
    mean:'Anión móvil en solución; menor retención que fosfato en muchos suelos.',
    dep:'Humedad, lixiviación, aporte azufre foliar o en agua.',
    risk:'Lixiviación; interacción con MoO₄²⁻ en exceso de sulfato.' },
  { id:'fe', lab:'Fe²⁺ / Fe³⁺', name:'Hierro (especiación)', mf:18, dif:58, int:24,
    dom:'Difusión + rizósfera',
    mean:'En solución el Fe suele ir muy diluido, así que el arrastre con transpiración aporta poco frente a difusión y a la rizósfera (pH, quelatos, redox, sólidos).',
    dep:'pH, carbonatos, redox, competencia (Cu, Mn, Zn), rizósfera.',
    risk:'Clorosis férrica con pH alto aunque Fe total sea alto.' },
  { id:'mn', lab:'Mn²⁺', name:'Manganeso', mf:38, dif:42, int:20,
    dom:'Difusión + flujo de masas (según pH)',
    mean:'Muy sensible a pH y redox.',
    dep:'pH bajo aumenta Mn disponible (ojo toxicidad).',
    risk:'Toxicidad en suelos ácidos; deficiencia en alcalinos.' },
  { id:'zn', lab:'Zn²⁺', name:'Zinc', mf:36, dif:44, int:20,
    dom:'Difusión principal',
    mean:'Baja movilidad en suelo; difusión hacia la rizósfera.',
    dep:'pH, P, carbonatos, materia orgánica.',
    risk:'Deficiencia relativa con P alto.' },
  { id:'cu', lab:'Cu²⁺', name:'Cobre', mf:34, dif:46, int:20,
    dom:'Difusión',
    mean:'Toma ligada a materia orgánica complejante y pH.',
    dep:'pH, MO, antagonismos con Zn/Fe.',
    risk:'Toxicidad por fungicidas cupríacos acumulados; deficiencia en suelos muy calcareos.' },
  { id:'b', lab:'H₃BO₃ / B(OH)₄⁻', name:'Boro', mf:28, dif:48, int:24,
    dom:'Difusión + flujo de masas (según especie y transpiración)',
    mean:'Movimiento hacia raíz por difusión de ácido bórico; flujo de masas con transpiración en xilema.',
    dep:'Humedad textura, lixiviación, Ca, pH.',
    risk:'Bandas de carencia por falta de humedad; toxicidad en exceso.' },
  { id:'moo4', lab:'MoO₄²⁻', name:'Molibdato', mf:40, dif:45, int:15,
    dom:'Flujo de masas + difusión',
    mean:'Anión en competencia con sulfato.',
    dep:'SO₄²⁻, pH, materia orgánica.',
    risk:'Deficiencia en suelos ácidos (Mo menos disponible) dependiendo de mineralogía (reglas generales).' },
  { id:'cl', lab:'Cl⁻', name:'Cloruro', mf:75, dif:15, int:10,
    dom:'Flujo de masas',
    mean:'Muy móvil en solución con el agua.',
    dep:'Aporte (agua/fertilizante), escurrimiento, NO₃⁻.',
    risk:'Sensibilidad varietal a Cl⁻; competencia con NO₃⁻ en algunos contextos.' }
];
```

#### MOBILITY — per-element mobility / symptoms / functions (12 elements)

```ts
const EL_NAMES: Record<string, string> = {
  N:'Nitrógeno', P:'Fósforo', K:'Potasio', Mg:'Magnesio', Mo:'Molibdeno',
  S:'Azufre', Fe:'Hierro', Mn:'Manganeso', Zn:'Zinc', Cu:'Cobre', Ca:'Calcio', B:'Boro'
};

// Pill groups:
//   Old leaves (mobile):      ['N','P','K','Mg','Mo']
//   Young leaves (immobile):  ['S','Fe','Mn','Zn','Cu','Ca','B']
//   Meristems/fruits (very immobile): ['Ca','B']
// Note: Ca and B appear in BOTH "young" and "meristems" groups.

const MOBILITY: Record<string, {
  mob: string;        // mobility description
  where: string;      // where symptoms show first
  sym: string;        // symptom description
  functions: { text: string; detail: string }[];
  tip: string;
}> = {
  N: {
    mob:'Alta', where:'Hojas viejas',
    sym:'Clorosis general / amarillamiento, a veces con hojas inferiores más pálidas',
    functions: [
      { text:'Síntesis de proteínas, enzimas y metabolitos nitrogenados',
        detail:'El N entra en aminoácidos y bases nitrogenadas; una baja ingesta limita mitosis, brotación y formación de tejidos de llenado.' },
      { text:'Clorofila y fotosíntesis',
        detail:'La clorofila contiene N en su anillo; al faltar, el follaje palidece y el rendimiento fotosintético cae antes que aparezcan signos muy específicos.' },
      { text:'Crecimiento vegetativo, ramificación y área foliar',
        detail:'Los brotes y hojas nuevas actúan como sumidero activo; el N se moviliza desde lo viejo, de ahí el patrón clásico en deficiencia.' },
      { text:'Relación con hormonas y respuesta a estrés abiótico',
        detail:'Modula rutas de citoquininas y respuestas a sombra, salinidad o restricción hídrica; no es solo "volumen", también plasticidad fisiológica.' }
    ],
    tip:'Deficiencia temprana suele mostrarse en hojas más viejas cuando el N se moviliza a tejidos nuevos.'
  },
  P: {
    mob:'Alta', where:'Hojas viejas',
    sym:'Tonos más oscuros del follaje, púrpuras en nervaduras o tallos en algunos cultivos; crecimiento reducido',
    functions: [
      { text:'Energía (ATP/ADP) y transferencia de fosfatos',
        detail:'Sin ATP no hay transporte electrogénico, biosíntesis ni mantenimiento de gradientes; el metabolismo se "frena" en bloque.' },
      { text:'Ácidos nucleicos (ADN/ARN) y división celular',
        detail:'ADN/ARN son polifosfatos; meristemos, flores y semillas están expuestos porque la demanda celular crece rápido en esas zonas.' },
      { text:'Desarrollo radicular, floración y formación de semilla/fruto',
        detail:'La arquitectura radicular y el encadenamiento floración→polinización→llenado necesitan pulsos continuos de P en etapa clave.' },
      { text:'Regulación metabólica y compuestos fosforilados',
        detail:'Muchas señales y reguladores transitan por estados fosforilados; la carencia muestra lentitud de crecimiento y metabolismo empobrecido.' }
    ],
    tip:'Fríos, suelos fijadores de P o pH extremos pueden exacerbar síntomas aunque el análisis de suelo sea "medio".'
  },
  K: {
    mob:'Alta', where:'Hojas viejas',
    sym:'Clorosis marginal u oscurecimiento; necrosis de bordes ("quemado") en casos avanzados',
    functions: [
      { text:'Regulación osmótica y apertura/cierre estomático',
        detail:'K⁺ acompaña guardias celulares; controla transpiración, entrada de CO₂ y enfriamiento del follaje en condiciones de estrés térmico o hídrico.' },
      { text:'Movilización de azúcares y carga osmótica en fruto',
        detail:'El movimiento de fotoasimilados al fruto suele relacionarse con gradientes osmóticos donde K es protagonista.' },
      { text:'Calidad (color, sabor, firmeza) y tolerancia a estrés',
        detail:'Incide en pigmentación, firmeza y equilibrio hídrico del tejido; carencias muestran bajas relativas incluso cuando el síntoma "clásico" aún es leve.' },
      { text:'Activación de enzimas y balance iónico con otros cationes',
        detail:'Coexiste en solución raíz con Ca²⁺, Mg²⁺ y NH₄⁺; el balance K/Mg/Ca en hoja aclara mejor que una cifra aislada de suelo.' }
    ],
    tip:'Puede confundirse con Mg; revisar K/Mg/Ca en hoja y síntomas marginales vs intervenales.'
  },
  Mg: {
    mob:'Alta', where:'Hojas viejas',
    sym:'Clorosis intervenal en láminas maduras, nervadura a menudo más verde',
    functions: [
      { text:'Átomo central de la molécula de clorofila',
        detail:'Sin Mg estable no hay anillo Mg-porfirínico funcional; la clorosis intervenal en láminas maduras es una señal frecuente al movilizarse desde lo viejo.' },
      { text:'Fotosíntesis y enzimas clave (p. ej. activadores)',
        detail:'Actúa como cofactor en reacciones de transferencia energética; "apaga" rutas fotoquímicas si la disponibilidad es baja.' },
      { text:'Metabolismo de carbono y respuesta a luz',
        detail:'El rendimiento fotosintético integrado depende del acople cloroplasto–citoplasma; Mg insuficiente reduce el gasto efectivo de luz útil.' },
      { text:'Síntesis de lípidos y estabilidad de membranas',
        detail:'Participa en lipídos de membrana y fosfolípidos; no todo síntoma de Mg se limita al patrón clásico intervenal tras largas carencias.' }
    ],
    tip:'Exceso relativo de K, Ca o NH₄ puede alterar el balance de Mg aunque el análisis global parezca suficiente.'
  },
  Mo: {
    mob:'Alta (matriz de Mo en planta puede variar)', where:'Hojas viejas (se confunde a veces con carencia de N)',
    sym:'Amarillamiento general o moteo; en leguminosas puede ligarse a eficiencia del uso de nitrato',
    functions: [
      { text:'Cofactor de la nitratoreductasa y enzimas del metabolismo del N',
        detail:'La reducción NO₃⁻ → NO₂⁻ se detiene si falta Mo; el síntoma puede parecer "falta de N" habiendo nitrato en la solución o el suelo.' },
      { text:'Fijación biológica de N en leguminosas (nódulos)',
        detail:'La nitrogenasa de muchos sistemas símbióticos requiere el centro Fe–Mo; sin él los nódulos existen pero el aporte efectivo cae.' },
      { text:'Metabolismo de ácidos nucleicos y azufre (contextos específicos)',
        detail:'En rutas de asimilación nitrogenada coexisten vínculos con compuestos azufrados; ayuda contextualizar síntomas con el programa N/S de la especie.' }
    ],
    tip:'Interpretar con especie, forma de N aportada y síntomas foliares; no es un "clásico único" en todas las fichas.'
  },
  S: {
    mob:'Intermedia / baja según cultivo y etapa', where:'Hojas jóvenes',
    sym:'Clorosis más uniforme en tejido nuevo; en algunas especies puede asociarse a tonos rojizos',
    functions: [
      { text:'Puentes disulfuro en proteínas (estructura y enzimas)',
        detail:'Estabiliza plegamiento proteico en cloroplastos y tejidos; la deficiencia afecta estructuras que se renuevan en hoja nueva.' },
      { text:'Compuestos de defensa y metabolitos secundarios azufrados',
        detail:'Glucosinolatos, aliínas u otros compuestos S participan en defensa frente a plagas/patógenos y en calidad aromatica.' },
      { text:'Fotosíntesis (componentes proteicos del aparato fotosintético)',
        detail:'Varias proteína del fotosistema contienen cisteína; tras carencia prolongada se acentúa palidez más homogénea en tejidos jóvenes.' }
    ],
    tip:'En hidro u inertes puede manifestarse en hoja joven antes que otros patrones "clásicos".'
  },
  Fe: {
    mob:'Baja', where:'Hojas jóvenes',
    sym:'Clorosis intervenal con nervaduras más verdes (patrón típico, según especie)',
    functions: [
      { text:'Síntesis y mantenimiento de cloroplastos (efecto indirecto sobre clorofila)',
        detail:'Fe interviene en la maquinaria de biosíntesis de clorofila dentro del cloroplasto; síntomas se expresan en expansión laminar.' },
      { text:'Cadena de transporte de electrones en fotosíntesis y respiración',
        detail:'Complejos citocrómicos dependen de Fe; antes de necrosis marcada aparece menor eficiencia y cloroplastos "livianos".' },
      { text:'Enzimas redox y metabolismo del nitrógeno',
        detail:'Rutinas de assimilación/reducción nitrogenada cargan sistemas hierro‑azufre; la clorosis puede cruzarse con programas muy nitratados.' }
    ],
    tip:'pH alto, bicarbonatos o frío radical pueden inducir clorosis férrica con Fe "total" alto en suelo.'
  },
  Mn: {
    mob:'Baja', where:'Hojas jóvenes',
    sym:'Moteado, clorosis intervenal; "ojos de pájaro" en algunos casos',
    functions: [
      { text:'Fotosíntesis (fotosistema y fotoprotección)',
        detail:'El complejo divisor de agua lleva centro Mn; la fotooxidación aumenta cuando el equipo no está bien armado enzimáticamente.' },
      { text:'Activación de enzimas y metabolismo del oxígeno',
        detail:'Mn²⁺ activa decenas de hidrolasas y descarboxilasas; repercute en lignificación local y desarrollo laminar ordenado.' },
      { text:'Defensa oxidativa (contexto de estrés)',
        detail:'En plantas estrés alta luz/sobreflujo de electrones, Mn equilibra parcialmente el exceso de radicales cuando está disponible en hoja joven.' }
    ],
    tip:'Síntomas pueden asemejar Fe; la edad de la hoja y el modelo de síntomas ayuda a orientar.'
  },
  Zn: {
    mob:'Baja', where:'Hojas jóvenes',
    sym:'Hojas más pequeñas, clorosis, hojas "rígidas" o acartonadas en cultivos sensibles',
    functions: [
      { text:'Auxinas y morfogénesis foliar',
        detail:'Regula niveles efectivos de auxina en ápices; la carencia se nota como hojas pequeñas en roseta ("achaparramiento") antes de otros signos tardíos.' },
      { text:'Cofactor de enzimas (carbohidratos, proteínas, defensa)',
        detail:'Carbono anhidrasa, carboxipeptidasas u otras deshidrogenasas Zn‑dependientes acoplan fotosíntesis y uso de fotoasimilados.' },
      { text:'Integridad de membranas y crecimiento meristemático',
        detail:'El meristemo apical es sensible porque la división rápida gasta rutas sintéticas que usan Zinc en varios puntos enzimáticos.' }
    ],
    tip:'P alto, frío o restricción radicular suelen empeorar la expresión foliar.'
  },
  Cu: {
    mob:'Baja', where:'Hojas jóvenes',
    sym:'Deformación, clorosis; ápices pueden necrosar en casos fuertes',
    functions: [
      { text:'Lignificación y pared celular',
        detail:'Laccasas u oxidasas dependientes de cobre endurecen vasos y esclerénquima; deficiencias producen láminas "blandas" o curvadas.' },
      { text:'Fotosíntesis (plastocianina) y metabolismo oxidativo',
        detail:'La plastocianina porta electrones entre fotosistemas; un cuello ahí tiene efecto rápido en cloroplastos nuevos.' },
      { text:'Polen y fertilidad (según cultivo)',
        detail:'El polen fértil requiere integridad enzimática y pared pollinica adecuada; la carencia de Cu aparece antes en programas muy generativos.' }
    ],
    tip:'Cuidado con acumulación por fungicidas cupríacos en programas intensivos.'
  },
  Ca: {
    mob:'Baja (poco redistribuido en floema)', where:'Tejidos jóvenes, meristemos, puntos de crecimiento y frutos',
    sym:'Necrosis marginal en hojas nuevas, deformación, blossom-end rot u otras necrosis en fruto',
    functions: [
      { text:'Pared celular (pectinas) y estabilidad tisular',
        detail:'Los puentes ion Ca²⁺ entre pectinas dan firmeza; tejidos jóvenes con bajo flujo transpiratorio son focos típicos de fallo.' },
      { text:'Membranas y señalización (calmodulina, respuesta a estímulos)',
        detail:'La calmodulina transduce señales de Ca citosólico; esto ata respuestas a sequía breve o herida con integridad membrane dependiente.' },
      { text:'Integridad de fruto y tejidos en expansión',
        detail:'Frutos de llenado rápido (tomate, pimientos, algunos berry) muestran BER u otras necrosis incluso si el suelo reporta Ca "adecuado".' }
    ],
    tip:'Puede haber Ca adecuado en suelo y fallar en fruto/meristemo por baja distribución o baja transpiración local.'
  },
  B: {
    mob:'Baja en la mayoría de cultivos (excepción "boromóvil" vía polioles en algunos)',
    where:'Brotes, yemas, meristemos, flores y frutos',
    sym:'Muerte de puntos de crecimiento, deformación, floración o cuajado irregular',
    functions: [
      { text:'Pared celular y estabilidad de membranas',
        detail:'El B interviene en la red de pectinas y en enlaces que ordenan la pared nueva; brotes deformes o láminas "engrosadas" sugieren menor armado ordenado del tejido.' },
      { text:'Polinización (tubo polínico) y retención floral',
        detail:'El tubo polínico debe atravesar el estilo de forma ordenada y requiere continuidad sintética; pueden verse abortos florales o polen poco viable antes que necrosis marcada.' },
      { text:'Transporte de azúcares y meristemos en expansión',
        detail:'Se asocia a movilización de fotoasimilados hacia puntos de crecimiento; meristemos y flores nuevas revelan rápido un cuello de transporte‑metabólico.' },
      { text:'Calidad de fruto y lignificación (según etapa/cultivo)',
        detail:'En aguacate, déficit suele relacionarse con frutos deformes, lignificación irregular o aborted fruitlets en olas de floración tensas; también en otros sensibles con carga alta.' }
    ],
    tip:'En manzano, pera (rosáceas), aguacate (sensible en olas florales densas) y cultivos delicados en polinización/cuajado, el comportamiento efectivo del B suele diferir respecto de olivo o vid; validar síntomas y análisis foliar/agua‑suelo por cultivo.'
  }
};
```

#### PH_NUTRIENTS — schematic availability curves (14 entries, each 11 pH points)

Each row has `points: [pH, availability]` with pH from 4 to 9 in 0.5 steps (11 points); availability is a 0–1 normalized "height" of the curve. The grey ideal-band is drawn from pH 5.5 to 7.0.

```ts
type PhNutrient = {
  id: string; lab: string; name: string; color: string;
  points: [number, number][];  // 11 points, pH 4.0–9.0 step 0.5
  tag: string; intro: string; bullets: string[];
};

const PH_NUTRIENTS: PhNutrient[] = [
  { id:'N', lab:'N', name:'Nitrógeno', color:'#15803d',
    points:[[4,0.12],[4.5,0.22],[5,0.48],[5.5,0.78],[6,0.92],[6.5,0.95],[7,0.93],[7.5,0.86],[8,0.68],[8.5,0.48],[9,0.32]],
    tag:'MO, mineralización y gestión del N',
    intro:'El N que la planta "ve" integra fuentes orgánicas (mineralización), aplicaciones y pérdidas; no es un único número fijado solo por el pH.',
    bullets:[
      'En <strong>pH muy ácido</strong> suele reducirse la mineralización de MO y la actividad microbiana útil.',
      'En <strong>pH intermedio</strong> a menudo hay mayor actividad microbiana y reciclaje de N orgánico.',
      'En <strong>pH alto</strong>, mal manejo de urea / amoníaco puede favorecer <strong>volatilización de NH₃</strong>.',
      '<strong>NO₃⁻</strong> es muy móvil: puede <strong>lixiviarse</strong> con exceso de agua en el perfil.' ] },
  { id:'P', lab:'P', name:'Fósforo', color:'#18181b',
    points:[[4,0.2],[4.5,0.28],[5,0.42],[5.5,0.62],[6,0.82],[6.5,0.95],[7,0.88],[7.5,0.55],[8,0.28],[8.5,0.22],[9,0.3]],
    tag:'Fijación química en suelo',
    intro:'El P "disponible" cae mucho cuando se fija a óxidos de Fe/Al (ácido) o precipita con Ca (calcareo). Por eso la curva es un "humo" centrado en pH moderados (textura y MO lo deforman).',
    bullets:[
      'Suelos <strong>ácidos</strong>: fuerte adsorción a <strong>Fe/Al</strong>; P puede estar "en el análisis" pero poco en solución.',
      'Suelos <strong>calcareos / pH alto</strong>: precipitación con <strong>Ca</strong>, fosfatos de baja solubilidad.',
      'Óptimo ilustrativo ~ <strong>6,0–6,8</strong> (no regla universal: arcilla, MO y equilibrio iónico cambian todo).' ] },
  { id:'K', lab:'K', name:'Potasio', color:'#404040',
    points:[[4,0.08],[4.5,0.18],[5,0.38],[5.5,0.62],[6,0.82],[6.5,0.9],[7,0.94],[7.5,0.95],[8,0.96],[8.5,0.95],[9,0.92]],
    tag:'CEC efectiva y equilibrio catiónico',
    intro:'K+ intercambia en superficies; al subir el pH suele aumentar la CEC efectiva en suelos variables y mejorar el "pool" intercambiable, salvo bloqueos por salinidad o compactación.',
    bullets:[
      'En <strong>pH bajo</strong> a veces hay menor saturación respecto a Al³⁺/H⁺ y menor base intercambiable.',
      'Al <strong>subir pH</strong> (hasta cierto punto) suele incrementarse <strong>CEC</strong> en coloides variables → más retención catiónica.',
      'En <strong>suelos salinos / K muy alto</strong> el problema puede ser equilibrio iónico, no "falta de pH".' ] },
  { id:'S', lab:'S', name:'Azufre', color:'#0f766e',
    points:[[4,0.1],[4.5,0.22],[5,0.45],[5.5,0.72],[6,0.88],[6.5,0.9],[7,0.88],[7.5,0.82],[8,0.7],[8.5,0.52],[9,0.38]],
    tag:'Sulfato y MO orgánica',
    intro:'El S disponible se relaciona con mineralización de materia orgánica sulfatada y con SO₄²⁻ en solución; en pH altos el anión puede ser más móvil y lixiviar.',
    bullets:[
      '<strong>MO</strong>: principal reservorio orgánico; mineralización depende de biota y humedad.',
      '<strong>pH alto / mucho riego</strong>: riesgo de <strong>lixiviación de SO₄²⁻</strong> en perfiles arenosos.',
      'No confundir con carencias por <strong>aporte insuficiente</strong> en suelos muy empobrecidos.' ] },
  { id:'Ca', lab:'Ca', name:'Calcio', color:'#52525b',
    points:[[4,0.05],[4.5,0.12],[5,0.28],[5.5,0.52],[6,0.78],[6.5,0.9],[7,0.94],[7.5,0.93],[8,0.88],[8.5,0.72],[9,0.55]],
    tag:'CEC, bases y equilibrio',
    intro:'Ca²⁺ forma parte del complejo adsorbido; suele aumentar con la saturación de bases al acercarse a pH neutros, pero el "Ca disponible" también depende de carbonatos, SO₄, Na y fuerza iónica.',
    bullets:[
      'En <strong>acidificación fuerte</strong> puede haber más Al/Mn tóxicos y presión sobre raíz aunque el Ca total parezca medio.',
      'En <strong>calcareo</strong> hay mucho Ca "total" pero puede haber interferencia de otros iones o baja actividad en rizósfera.',
      '<strong>Ber / punta</strong> a veces es transporte en planta, no solo "pH del suelo".' ] },
  { id:'Mg', lab:'Mg', name:'Magnesio', color:'#52525b',
    points:[[4,0.06],[4.5,0.15],[5,0.32],[5.5,0.55],[6,0.78],[6.5,0.88],[7,0.9],[7.5,0.88],[8,0.8],[8.5,0.62],[9,0.45]],
    tag:'CEC y competencia catiónica',
    intro:'Mg²⁺ compite con K+, NH₄+ y Ca²+ por sitios de adsorción y transporte. La forma de la curva es orientativa: suelos arenosos y lixiviación pueden "aplanar" lo que el dibujo sugiere.',
    bullets:[
      '<strong>Exceso de K</strong> puede empujar deficiencia relativa de Mg aunque Mg "medio" en suelo.',
      'Patrones de <strong>Ca/Mg</strong> en complejo son clave en muchas regiones.',
      'En <strong>pH extremo</strong> el problema puede ser toxicidad (Al) más que Mg "químico" bajo.' ] },
  { id:'Fe', lab:'Fe', name:'Hierro', color:'#dc2626',
    points:[[4,0.96],[4.5,0.92],[5,0.82],[5.5,0.62],[6,0.42],[6.5,0.25],[7,0.14],[7.5,0.08],[8,0.04],[8.5,0.02],[9,0.02]],
    tag:'Precipitación de óxidos/hidróxidos',
    intro:'Fe disponible baja marcadamente al subir pH por precipitación e hidrólisis; por eso la clorosis férrica es frecuente en suelos calcareos o con bicarbonatos en agua de riego.',
    bullets:[
      'La planta toma principalmente <strong>Fe²⁺</strong> / quelatos, no el "Fe total" del suelo.',
      'En <strong>pH alto</strong>, aportar <strong>quelatos</strong> o reducir antagonismo (HCO₃⁻) es parte clásica del manejo.',
      '<strong>Foliar</strong> es recurso útil pero el problema de fondo suele ser química de rizósfera.' ] },
  { id:'Mn', lab:'Mn', name:'Manganeso', color:'#dc2626',
    points:[[4,0.92],[4.5,0.88],[5,0.78],[5.5,0.6],[6,0.38],[6.5,0.2],[7,0.1],[7.5,0.05],[8,0.03],[8.5,0.02],[9,0.02]],
    tag:'Redox y pH',
    intro:'Mn se vuelve más disponible en suelos ácidos; puede ser tóxico; en alcalino cae y se asemeja a carencias férricas en hoja joven.',
    bullets:[
      'En <strong>pH bajo</strong> vigilar <strong>toxicidad</strong> más que carencia.',
      'En <strong>pH alto</strong> puede competir con Fe en la foto del síntoma (discriminación fina con análisis).',
      'Oxigenación de rizósfera (encharcamiento) cambia el juego de Mn por <strong>redox</strong>.' ] },
  { id:'B', lab:'B', name:'Boro', color:'#ca8a04',
    points:[[4,0.15],[4.5,0.28],[5,0.52],[5.5,0.78],[6,0.9],[6.5,0.92],[7,0.88],[7.5,0.55],[8,0.28],[8.5,0.35],[9,0.42]],
    tag:'Especiación y lixiviación',
    intro:'El boro ácido / borato cambia con el pH; en rango intermedio suele haber mejor equilibrio; en alcalino y con riego puede lixiviarse o quedar "raro" en arcillas.',
    bullets:[
      'Ventana de manejo fina: entre <strong>carencia y toxicidad</strong> hay poco margen en muchos cultivos.',
      '<strong>pH alto + fuerte lixiviación</strong> pueden bajar B aunque el suelo "no sea extremo".',
      'Variedad y <strong>boromovilidad</strong> cambian el síntoma en planta.' ] },
  { id:'Cu', lab:'Cu', name:'Cobre', color:'#dc2626',
    points:[[4,0.9],[4.5,0.85],[5,0.72],[5.5,0.55],[6,0.4],[6.5,0.28],[7,0.2],[7.5,0.14],[8,0.1],[8.5,0.08],[9,0.06]],
    tag:'Adsorción y complejación',
    intro:'Cu y otros micros con carga positiva se adsorben más fuerte al subir pH (superficies más negativas, precipitación). En ácido suele haber más en solución con riesgo de toxicidad por acumulación si hay cobre de fungicidas.',
    bullets:[
      'Suelos <strong>orgánicos</strong> o con mucha MO pueden complejar fuerte el Cu.',
      'Exceso de <strong>P</strong> o interacciones iónicas pueden modificar lectura de disponibilidad.',
      'Toxicidad por <strong>fungicidas cupríacos</strong> en programas intensivos.' ] },
  { id:'Zn', lab:'Zn', name:'Zinc', color:'#dc2626',
    points:[[4,0.88],[4.5,0.82],[5,0.68],[5.5,0.52],[6,0.38],[6.5,0.25],[7,0.16],[7.5,0.1],[8,0.07],[8.5,0.05],[9,0.04]],
    tag:'Adsorción y pH',
    intro:'Como Fe/Mn/Cu, el Zn suele ser más soluble en ácido y caer al alcalinizar; carbonatos y fosfatos altos agravan la "disponibilidad funcional".',
    bullets:[
      '<strong>P alto</strong> puede inducir carencia relativa de Zn aunque el mapa muestre una forma general.',
      'Raíces en frío / compactación reducen toma aunque el suelo "tenga Zn".',
      'Revisar <strong>matriz arcillosa</strong> vs textura (CIC y adsorción).' ] },
  { id:'Mo', lab:'Mo', name:'Molibdeno', color:'#2563eb',
    points:[[4,0.08],[4.5,0.12],[5,0.2],[5.5,0.32],[6,0.48],[6.5,0.62],[7,0.8],[7.5,0.9],[8,0.94],[8.5,0.95],[9,0.96]],
    tag:'Aniónico / forma MoO₄²⁻',
    intro:'Mo como molibdato se comporta como anión de carga mayor en pH altos; en suelos muy ácidos puede haber menor disponibilidad relativa según mineralogía y adsorción.',
    bullets:[
      'Por eso en <strong>ácido extremo</strong> a veces se recomienda corregir pH o aplicar Mo de forma acorde.',
      'Interacción con <strong>SO₄²⁻</strong> en exceso (competencia aniónica) puede aparecer en práctica.',
      'Importante para <strong>nitratoreductasa</strong> y leguminosas (fijación).' ] },
  { id:'Cl', lab:'Cl', name:'Cloro', color:'#2563eb',
    points:[[4,0.18],[4.5,0.25],[5,0.35],[5.5,0.5],[6,0.65],[6.5,0.78],[7,0.88],[7.5,0.92],[8,0.94],[8.5,0.95],[9,0.94]],
    tag:'Anión muy móvil',
    intro:'Cl⁻ es un anión que compite en solución; su "curva" ilustra disponibilidad cualitativa más que un límite universal — en calidad de agua y fertilización puede ser exceso antes que carencia.',
    bullets:[
      '<strong>Movilidad alta</strong> con el flujo de agua; puede acumular o lavar según balance.',
      'Sensibilidad varietal a Cl⁻ en ciertos cultivos.',
      'Integrar con análisis de <strong>agua de riego</strong> y programa nutritivo.' ] },
  { id:'Al', lab:'Al', name:'Aluminio (toxicidad)', color:'#a16207',
    points:[[4,0.98],[4.5,0.88],[5,0.42],[5.5,0.08],[6,0.02],[6.5,0.01],[7,0.01],[7.5,0.01],[8,0.01],[8.5,0.01],[9,0.01]],
    tag:'Toxicidad · no nutriente',
    intro:'El "disponible" aquí es señal de riesgo: Al³⁺ es tóxico para raíz en pH muy bajo. Al subir pH precipita como hidróxido y baja en solución (no es fertilizante).',
    bullets:[
      'Muy asociado a <strong>pH < ~5,5</strong> y a Aluminio intercambiable alto.',
      'Precipitación tipo <strong>Al(OH)₃</strong> al neutralizar.',
      'Mitigar con cal/dolomita/gesso según diagnóstico; siempre validar con análisis y cultivo.' ] }
];
```

#### Static embedded reference table — Nutrient concentration in dry matter (Taiz & Zeiger / Epstein)

```ts
// Source: captioned "Tabla paramétrica en materia seca (Taiz & Zeiger / Epstein)"
// Three groups: Micronutrientes, Macronutrientes, Elementos estructurales
const NUT_REF_TABLE = [
  // Micronutrientes
  { group:'Micronutrientes', name:'Molibdeno', sym:'Mo', umol_g:0.001,  pct_or_ppm:'0.1 ppm',   atoms:1 },
  { group:'Micronutrientes', name:'Cobre',     sym:'Cu', umol_g:0.10,   pct_or_ppm:'6 ppm',     atoms:100 },
  { group:'Micronutrientes', name:'Zinc',      sym:'Zn', umol_g:0.30,   pct_or_ppm:'20 ppm',    atoms:300 },
  { group:'Micronutrientes', name:'Manganeso', sym:'Mn', umol_g:1.0,    pct_or_ppm:'50 ppm',    atoms:1000 },
  { group:'Micronutrientes', name:'Boro',      sym:'B',  umol_g:2.0,    pct_or_ppm:'20 ppm',    atoms:2000 },
  { group:'Micronutrientes', name:'Hierro',    sym:'Fe', umol_g:2.0,    pct_or_ppm:'100 ppm',   atoms:2000 },
  { group:'Micronutrientes', name:'Cloro',     sym:'Cl', umol_g:3.0,    pct_or_ppm:'100 ppm',   atoms:3000 },
  // Macronutrientes
  { group:'Macronutrientes', name:'Azufre',    sym:'S',  umol_g:30,     pct_or_ppm:'0,1 %',     atoms:30000 },
  { group:'Macronutrientes', name:'Fósforo',   sym:'P',  umol_g:60,     pct_or_ppm:'0,2 %',     atoms:60000 },
  { group:'Macronutrientes', name:'Magnesio',  sym:'Mg', umol_g:80,     pct_or_ppm:'0,2 %',     atoms:80000 },
  { group:'Macronutrientes', name:'Calcio',    sym:'Ca', umol_g:125,    pct_or_ppm:'0,5 %',     atoms:125000 },
  { group:'Macronutrientes', name:'Potasio',   sym:'K',  umol_g:250,    pct_or_ppm:'1,0 %',     atoms:250000 },
  { group:'Macronutrientes', name:'Nitrógeno', sym:'N',  umol_g:1000,   pct_or_ppm:'1,5 %',     atoms:1000000 },
  // Elementos estructurales
  { group:'Elementos estructurales', name:'Oxígeno',   sym:'O', umol_g:30000,  pct_or_ppm:'45,0 %', atoms:30000000 },
  { group:'Elementos estructurales', name:'Carbono',   sym:'C', umol_g:40000,  pct_or_ppm:'45,0 %', atoms:40000000 },
  { group:'Elementos estructurales', name:'Hidrógeno', sym:'H', umol_g:60000,  pct_or_ppm:'6,0 %',  atoms:60000000 }
];
```

### ALL formulas / equations (pH curve rendering)

```ts
const PH_MIN = 4;
const PH_MAX = 9;
const PH_CHART_H = 48;
const PH_CHART_PAD_TOP = 6;
const PH_CHART_CURVE_H = PH_CHART_H - PH_CHART_PAD_TOP - 6;

function phX(pH) { return (pH - PH_MIN) / (PH_MAX - PH_MIN) * 100; }  // 0–100 viewBox width
function phY(av) { return PH_CHART_PAD_TOP + (1 - av) * PH_CHART_CURVE_H; }

// Area path (closed polygon down to baseline at y = PH_CHART_H - 2):
function phAreaPath(points) {
  baseY = PH_CHART_H - 2;
  x0 = phX(points[0][0]);
  d = `M ${x0} ${baseY} L ${x0} ${phY(points[0][1])}`;
  for i = 1..|points|-1: d += ` L ${phX(points[i][0])} ${phY(points[i][1])}`;
  d += ` L ${phX(points[last][0])} ${baseY} Z`;
  return d;
}

// Polyline points:
function phPolyPoints(points) {
  return points.map(([pH, av]) => `${phX(pH)},${phY(av)}`).join(' ');
}

// Ideal band (grey rect): x=phX(5.5), width=phX(7)-phX(5.5), y=PH_CHART_PAD_TOP-2,
//   height=PH_CHART_CURVE_H+4. Class="ph-ideal-band" with fill rgba(100,116,139,0.12).
```

### Classification / categorization logic

- **Solubility class (NOT in this tool — used by Tool 4)**.
- **Element category for Mulder diagram**: each ion has 3 lists (antagonists, synergists, functional). Antagonism is bidirectional (edge drawn once, highlighted red in either direction). Synergy is one-directional — `synergyFrom(focus, other)` is only true if `focus.synergists` contains `other`. This avoids inflating synergy display (e.g., K⁺ isn't shown as synergist with micros that listed it).
- **Mobility grouping**: pills are split into 3 visual groups (mobile/old leaves, immobile/young leaves, very-immobile/meristems). Ca and B appear in BOTH the young-leaves and the meristems groups.
- **Symptom key (dichotomous)**: 3 columns. Column 1 (Hojas viejas) has 4 sub-branches: K/Mo (necrotic spots), Mg (intervenal chlorosis), N (yellow veining), P (purple tones). Column 2 (Hojas jóvenes) has 4 sub-branches: Fe/Mn (intervenal chlorosis), S/Cu (uniform chlorosis), Zn (small/deformed leaves), Ca (necrotic margins). Column 3 (Brotes/yemas/meristemos/frutos) has 1 sub-branch: Ca/B.
- **Marker rotation in symptom diagram**: SCADA-style — first sub uses filled circle, second uses horizontal dash, third uses right-pointing triangle, fourth uses filled circle (CSS `:nth-child` rules).

### Charts/visualizations
1. **Mulder SVG** (Section 1): viewBox `0 0 520 420`, 14 ion circles (r=22, stroke #94a3b8) positioned on a circle of radius 168 around center (260, 230). Edges drawn as `<line>` with class `edge-line` (faded grey, opacity 0.35). Selected node: edges to its antagonists turn red (`hi-ant`, stroke #dc2626, width 3); edges to its synergists turn blue (`hi-syn`, stroke #2563eb, width 3). Non-related nodes get `.dim` class (opacity 0.35). Title text at top.
2. **Stacked horizontal bars** (Section 2): each ion is a 3-segment bar (mf blue `#2563eb`, dif green `#16a34a`, int orange `#ea580c`), with the % inline in each segment. Active row gets blue border + blue left bar + drop shadow.
3. **Symptom diagram** (Section 3): pure CSS SCADA-style flow diagram with a root node "Síntomas", a trunk, a crossbar, 3 vertical drops into 3 columns. Each column has a header and 1–4 sub-branches with rotated markers (●, ▬, ▶, ●).
4. **pH sparklines** (Section 4): each row has an SVG (viewBox `0 0 100 48`) with a grey ideal-band rect (pH 5.5–7.0), a gradient-filled area path under the curve, and a 1.35px colored polyline on top. Active row gets blue border.

### Non-obvious UX
- 4-tab switcher at top; clicking a tab toggles `aria-selected` and shows only the matching `.section-panel`.
- Section 1: click an ion → highlight edges + dim other nodes + render its card. Tab/keyboard accessible (`role="button"`, `tabindex="0"`, Enter/Space triggers).
- Section 2: click anywhere on a row (label or bar) → re-renders all rows (with `.is-active` on the clicked one) + updates ficha. Default selection on load: `h2po4`.
- Section 3: click any `.mob-pill` (in the diagram OR in the lists) → calls `showMob(sym)` which toggles `is-active` on all pills with the same `data-mob-sym` and updates the ficha. Default selection on load: `N`.
- Section 4: click any row → re-renders all rows (with `.is-active` on the clicked one) + updates ficha + scrolls into view.
- Persistence: `window.NpFreePersist.bind('interacciones_absorcion', snapInteractions, applyInteractions)`. Saved state: `{ tab: number, arr: selArrId, ph: selPhId, mob: mobSymActive, diagram: diagramFocusId }`.

### Color codes (Section 4 pH curves)
- N: `#15803d` (green)
- P: `#18181b` (near-black)
- K, Ca, Mg: `#404040` / `#52525b` (cations base, dark grey)
- S: `#0f766e` (teal)
- Fe, Mn, Zn, Cu: `#dc2626` (red — pH-sensitive cationic micros)
- B: `#ca8a04` (amber)
- Mo, Cl: `#2563eb` (blue — anions)
- Al: `#a16207` (brown — toxicity marker, not a nutrient)

---

## TOOL 4 — Solubility & Salt Index

**Tool name (EN):** Solubility & Salt Index
**Tool name (ES):** Solubilidad e índice salino (IS)
**File:** `solubilidad-indice-salino-free.html` (596 lines)

### Purpose
Sortable/filterable table of 13 common fertilizers with their water solubility range (g/L at 20–25 °C) and salt index (NaNO₃ = 100 base). Includes two educational tabs: (1) solubility fundamentals + ion dissociation spheres diagram, (2) salt-index meaning.

### Input fields

| id | label | type | default | notes |
|---|---|---|---|---|
| `filterInput` | Filtrar | search | `''` | Filters by name, formula, or note (case-insensitive substring match) |

(No other inputs — clicking a column header toggles sort.)

### Output fields

| id | label | source |
|---|---|---|
| `tbody` (table rows) | 6-column table: Fertilizante / Fórmula / Solubilidad g/L / Clase / IS / IS visual | from `ROWS` (filtered + sorted) |
| Column "Fertilizante" | name + optional `<span class="row-note">` for note | `r.name`, `r.note` |
| Column "Fórmula" | chemical formula in monospace | `r.formula` |
| Column "Solubilidad g/L" | range string `≈ LO – HI` (rounded if ≥10) | `formatRange(r.solLo, r.solHi)` |
| Column "Clase solubilidad" | colored dot + label (Alta/Media/Baja) | `solClass((solLo+solHi)/2)` |
| Column "IS (NaNO₃=100)" | IS number, `~` prefix if `r.noteIs === '~'`, or `'—'` if null | `formatIS(r)` |
| Column "IS visual" | bar `<div class="is-bar-wrap"><div class="is-bar-fill" style="width:Npx"></div></div>` where width % = `Math.round(r.is / maxIs × 100)` | `r.is` / `maxIs` |
| `panelA` / `panelB` | educational tabs (static content) | static HTML |

### ALL formulas / equations

**1. Solubility midpoint & class**
```
mid = (solLo + solHi) / 2
if mid > 500  → cls='sol-dot-hi', label='Alta',  color='#2563eb'  (Alta)
if mid >= 100 → cls='sol-dot-mid', label='Media', color='#ca8a04'  (Media)
else          → cls='sol-dot-lo', label='Baja',  color='#dc2626'  (Baja)
```

**2. Max IS for bar normalization**
```
maxIs = max over all rows where r.is != null of r.is   // = 116.3 (KCl)
```

**3. IS bar width**
```
barWidth% = r.is != null ? Math.round(r.is / maxIs × 100) : 0
```

**4. Range formatting**
```
formatRange(lo, hi):
  if hi >= 10: return '≈ ' + Math.round(lo) + ' – ' + Math.round(hi)
  else:        return '≈ ' + lo + ' – ' + hi
```

**5. IS formatting**
```
formatIS(r):
  if r.is == null: return r.noteIs || '—'
  return (r.noteIs || '') + String(r.is)
```

**6. Filtering**
```
filterList(q):
  q = q.trim().toLowerCase()
  if !q: return ROWS.slice()
  return ROWS.filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.formula.toLowerCase().includes(q) ||
    (r.note && r.note.toLowerCase().includes(q)))
```

**7. Sorting**
```
sortList(list, k, type, dir):
  // Pre-compute _mid and _cat for each row
  _mid = (solLo + solHi) / 2
  _cat = mid > 500 ? 2 : mid >= 100 ? 1 : 0
  if k === 'name' or 'formula': case-insensitive string compare × dir
  if k === 'sol':  compare _mid × dir
  if k === 'cat':  compare _cat × dir
  if k === 'is':   compare (is == null ? -1 : is) × dir
```

Sort state initial: `{ k: 'is', dir: -1 }` (descending IS).
Clicking a column header: if same key → flip dir; else set key and use `dir = (k === 'name' || k === 'formula') ? 1 : -1` (i.e. names default ascending, numerics default descending).

### Constants and lookup tables

```ts
type SolRow = {
  name: string;
  formula: string;
  solLo: number;   // g/L at 20-25°C, low end
  solHi: number;   // g/L at 20-25°C, high end
  is: number | null;  // salt index (NaNO3 = 100)
  noteIs?: string;    // prefix like '~' or '—'
  note?: string;      // footnote text
};

const ROWS: SolRow[] = [
  { name: 'Nitrato de amonio',              formula: 'NH₄NO₃',     solLo: 1850, solHi: 1950, is: 104.7 },
  { name: 'Nitrato de magnesio',            formula: 'Mg(NO₃)₂',   solLo: 1200, solHi: 1300, is: 60.5 },
  { name: 'Nitrato de calcio',              formula: 'Ca(NO₃)₂',   solLo: 1150, solHi: 1250, is: 40.7 },
  { name: 'Nitrato de potasio',             formula: 'KNO₃',       solLo: 300,  solHi: 330,  is: 73.6 },
  { name: 'Urea',                            formula: 'CH₄N₂O',     solLo: 1000, solHi: 1150, is: 75.4 },
  { name: 'Fosfato monoamónico (MAP)',      formula: 'NH₄H₂PO₄',   solLo: 350,  solHi: 400,  is: 26.7 },
  { name: 'Fosfato monopotásico (MKP)',     formula: 'KH₂PO₄',     solLo: 200,  solHi: 240,  is: 8.4 },
  { name: 'Cloruro de potasio',             formula: 'KCl',        solLo: 320,  solHi: 360,  is: 116.3 },
  { name: 'Sulfato de amonio',              formula: '(NH₄)₂SO₄',  solLo: 720,  solHi: 780,  is: 69.0 },
  { name: 'Sulfato de magnesio',            formula: 'MgSO₄',      solLo: 680,  solHi: 740,  is: 44.0 },
  { name: 'Sulfato de potasio',             formula: 'K₂SO₄',      solLo: 105,  solHi: 115,  is: 46.0 },
  { name: 'Sulfato de calcio (yeso agrícola)', formula: 'CaSO₄',   solLo: 1.5,  solHi: 2.8,  is: 8, noteIs: '~', note: 'Enmienda · no soluble en fertirriego (referencia).' },
  { name: 'Carbonato de calcio',            formula: 'CaCO₃',      solLo: 0.01, solHi: 0.03, is: null, noteIs: '—', note: 'Enmienda · no soluble en fertirriego (referencia).' }
];

// Computed: maxIs = 116.3 (KCl)
```

### Static educational content (Tab 1 — "Solubilidad y proceso")

- 4 bullet points on what solubility depends on (Temperature, Purity/grade, Crystalline form/hydration, Other ions already dissolved).
- Ion dissociation diagram: 2 columns. **Cationes (+)**: K⁺ (blue `#1d9bf0`), Ca²⁺ (green `#059669`), Mg²⁺ (teal `#0f766e`), NH₄⁺ (purple `#7c3aed`), Na⁺ (orange `#ea580c`). **Aniones (−)**: NO₃⁻ (blue `#0284c7`), SO₄²⁻ (amber `#d97706`), H₂PO₄⁻ (pink `#b91c73`), Cl⁻ (green `#16a34a`). Each shown as a 3D-looking sphere via radial gradients.
- "Principios químicos útiles" section: 4 bullets on charge/hydration/energy-balance/charge-density.

### Static educational content (Tab 2 — "Índice salino IS")

- Intro paragraph on osmotic impact relative to NaNO₃=100.
- 3 bullets: root dehydration / emergence & sowing / energy cost.
- Note: IS bar is relative within this dataset (max = KCl = 116.3).

### Color codes / classification
- **Solubility dot**: `sol-dot-hi` (blue `#2563eb`, >500 g/L), `sol-dot-mid` (amber `#ca8a04`, 100–500), `sol-dot-lo` (red `#dc2626`, <100).
- **IS bar gradient**: `linear-gradient(90deg, #38bdf8 0%, #fbbf24 50%, #ea580c 100%)`.
- Column 4 (Solubility) gets a 3px right border (separator before IS columns).
- IS columns get a slightly different background gradient (`#eef2ff → #e2e8f0`).

### Non-obvious UX
- All sortable column headers have `data-k` and `data-type` attributes; clicking them re-renders.
- Search box is `type="search"` with `autocomplete="off"`, listens on `input` event.
- Sort direction toggle: same column = flip; new column = default dir based on type.
- Persistence: `window.NpFreePersist.bind('solubilidad_is', snapSol, applySol)`. Saved state: `{ filter, tab, sortK, sortDir }`.
- Default sort: IS descending (so KCl=116.3 shows first).
- Tab switch between `panelA` and `panelB` via `aria-selected` toggling.
- `escapeHtml` helper applied to user-facing strings (name, formula, note).

---

## TOOL 5 — Irrigation Sheet & Water Balance

**Tool name (EN):** Irrigation Sheet & Water Balance
**Tool name (ES):** Lámina de riego y balance hídrico
**File:** `lamina-riego-free.html` (673 lines)

### Purpose
Location-aware irrigation calculator. User picks a point on a Leaflet map (or enters lat/lng, or uses GPS), then fetches rolling 7-day ETo + precipitation from Open-Meteo. Calculates ETc = Kc × ETo, irrigation sheet in mm, water balance (deficit/surplus), and volume conversions for 1-day or 7-day periods. Includes a soil-water bridge panel that can suggest irrigation volume from a sister tool's soil-water storage data.

### ⚠️ External dependencies (NOT in workspace)
The HTML loads 5 external scripts that are **not present** in `/tmp/np_tools/`:
1. `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` (CDN — available)
2. `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css` (CDN — available)
3. `climate-kc-fao-data.js` (local — **MISSING**)
4. `assets/np-free-geolocation.js?v=202606201700` (local — **MISSING**)
5. `assets/np-irrigation-balance-core.js?v=202606242300` (local — **MISSING**)
6. `assets/np-soil-water-bridge.js?v=202606242400` (local — **MISSING**)
7. `assets/np-free-local-persist.js` (local — **MISSING**, but used by all 5 tools)

The HTML is essentially a thin wrapper around `window.NpIrrBalance.*` and `window.NpSoilWaterBridge.*`. The full formulas live in those missing files. Below I document the **API surface required** (call sites observed) and the **input/output structure** so a reimplementation can reconstruct the core.

### Input fields

| id | label | type | default | unit / range |
|---|---|---|---|---|
| `irr-free-lat` | Latitud | number | `''` | decimal degrees, placeholder 19.4326 |
| `irr-free-lng` | Longitud | number | `''` | decimal degrees, placeholder -99.1332 |
| `irr-use-manual-et0` | "Usar mi ETo del periodo (mm)" | checkbox | false | enables `irr-et0-manual` |
| `irr-et0-manual` | Manual ETo | number | `''` | mm, min 0, step 0.1, "Acumulado del periodo" |
| `irr-use-manual-rain` | "Usar mi lluvia (mm)" | checkbox | false | enables `irr-rain-manual` |
| `irr-rain-manual` | Manual rain | number | `''` | mm, min 0, step 0.1 |
| `irr-macro-tunnel` | "Macrotúnel (lluvia = 0)" | checkbox | false | disables rain inputs (sets rain to 0) |
| `irr-crop` | Cultivo (opcional) | text | `''` | free text, e.g. "limón, aguacate…" |
| `irr-kc` | Kc (editable) | number | `''` | 0–2, step 0.01 |
| `irr-applied` | Riego en franja regada (periodo) | number | `''` | m³ (always m³ — `irr-unit` hidden field forced to `'m3'`) |
| `irr-unit` | (hidden) | hidden | `'m3'` | unit of `irr-applied`; legacy `'mm'` is migrated to `'m3'` on load |
| `irr-crop-area` | Superficie del cultivo (ha) | number | `1` | ha, min 0, step 0.01 |
| `irr-area` | Superficie regada (ha) | number | `''` | ha, min 0, step 0.01 — empty = same as crop area |
| `irr-root-reach` | Raíces en superficie (% del área) | number | `''` | 10–100, step 1 |
| `irr-soil-mode` | Soil storage mode | select (rendered by NpSoilWaterBridge) | `''` | `'deficit'` or `'surplus'` or empty |
| `irr-soil-m3` | Soil storage volume | number (rendered by NpSoilWaterBridge) | `''` | m³ |
| Period buttons | 1 día / 7 días | button | `1` | switches `irrPeriodDays` to 1 or 7 |
| `irr-fao-kc-search` | Search FAO Kc table | text | `''` | filters the FAO Kc reference table |

### Output fields

| id | label | source |
|---|---|---|
| `irr-metric-et0` | "ETo activa ({1 día/7 días})" | `res.et0` formatted via `NB.fmtMm(res.et0)` + unit `mm/día` (1d) or `mm` (7d) + `NB.sourceBadge(res.et0Source)` |
| `irr-metric-rain` | "Lluvia activa ({1 día/7 días})" | `res.rain` formatted via `NB.fmtMm(res.rain)` + `mm` + `NB.sourceBadge(res.rainSource)` |
| `irr-sat-meta` | "Referencia satélite · actualizada {date}" | shown when `irrRolling.fetchedAt` exists |
| `irr-summary` | Full results summary | `NB.buildSummaryHtml(res)` |
| `irr-area-note` | Area criterion note | `NB.buildAreaCriterionNoteHtml(st)` |
| `irr-note-wrap` | Tool notes / disclaimer | `NB.getNoteHtml()` (static) |
| `irr-kc-wrap` | FAO Kc reference table | `NB.getReferenceTablesHtml({ idPrefix: 'irr' })` |
| `irr-area-reach-hint` | Hint for area criterion scroll | `NB.getAreaCriterionScrollHintHtml('irr')` |
| `irr-kc-hint-wrap` | Kc field hint | `NB.getKcFieldHintHtml('irr')` |
| `irr-soil-bridge-btns` | Suggest buttons for soil water | `NpSoilWaterBridge.buildSuggestButtonsHtml('irr')` |
| `irr-soil-bridge-panel` | Soil water panel | `NpSoilWaterBridge.buildPanelHtml({ idPrefix: 'irr', mode, m3 })` |
| `irr-fao-kc-tbody` | FAO Kc table body | `NB.renderFaoKcTable('irr-fao-kc-tbody', query, cropName)` |

### ALL formulas / equations

**Note**: the actual implementation of these formulas is in `assets/np-irrigation-balance-core.js` (NOT in workspace). The HTML only calls `NB.computeResults(state, rolling)`. Based on the input/output structure and standard FAO-56 practice, the formulas are:

**1. State object passed to `NpIrrBalance.computeResults`**
```ts
type IrrState = {
  cropName: string;
  kc: number | null;
  periodDays: 1 | 7;
  irrigationValue: number | null;   // m³
  irrigationUnit: 'm3';
  cropAreaHa: number;               // default 1
  irrigatedAreaHa: number | null;   // null = same as cropAreaHa
  rootReachPct: number | null;      // 10-100
  useManualEt0: boolean;
  manualEt0: number | null;         // mm
  useManualRain: boolean;
  manualRain: number | null;        // mm
  macroTunnelNoRain: boolean;       // forces rain = 0
  soilStorageMode: 'deficit' | 'surplus' | null;
  soilStorageM3: number | null;
};
```

**2. Rolling climate object** (`irrRolling`, fetched from Open-Meteo via `NB.fetchRollingOpenMeteo(lat, lng)`)
```ts
type Rolling = {
  fetchedAt: number;  // Date.now() when fetched
  // ... (internal structure not visible — used by NB.getRollingForPeriod(rolling, periodDays))
  // Returns { et0_mm, rain_mm, source: 'satellite' | ... }
};
```

**3. Standard FAO-56 irrigation formulas (reconstruct from naming)**

```
ETc = Kc × ETo                                           // crop evapotranspiration (mm)
effectiveRain = macroTunnel ? 0 : rain                    // macrotúnel forces rain to 0
irrigationMm = irrigationValue_m3 / irrigatedArea_ha / 10 // m³ → mm (1 ha = 10000 m², 1 mm = 10 m³/ha)
                                                          //   so mm = m³ / (ha × 10)
waterBalance = irrigationMm + effectiveRain - ETc          // mm  (positive = surplus, negative = deficit)
totalVolume_m3 = ETc × cropArea_ha × 10                   // m³  (ETc mm → m³/ha × ha)
```

**4. Suggest strip area** (`irrFreeSuggestStrip`)
```
suggested_irrigatedArea_ha = round(cropAreaHa × (rootReachPct / 100) × 100) / 100
// i.e. cropHa × rootReach% rounded to 2 decimals
```

**5. Period selection**
```
periodDays = 1 or 7
ETo_per_period = ETo_daily × periodDays  (when from satellite source)
rain_per_period = sum of daily rain over period (when from satellite source)
manual values are taken as-is (already accumulated for the period)
```

**6. Soil water bridge** (`NpSoilWaterBridge`)
- `buildPanelHtml({ idPrefix, mode, m3 })` → returns HTML for `#irr-soil-mode` (select: deficit/surplus) + `#irr-soil-m3` (number input).
- `applySuggestionToDom('irr', target)` where target is `'cc'` (field capacity) or `'objective60'` (60% available water) — fills `#irr-soil-m3` with a suggested value computed from a sister tool's soil-water data (cross-tab via localStorage `BRIDGE_KEY`).
- `BRIDGE_KEY` is a localStorage key the sister tool (likely `agua-disponible-textura-suelo-free.html`) writes to.
- `buildSuggestButtonsHtml('irr')` returns 2 buttons: "Sugerir hasta 60% AU" and "hasta CC".

**7. Legacy irrigation-unit migration** (`irrFreeMigrateLegacyIrrigationUnit`)
```
NB.migrateIrrigationValueToM3(value, fromUnit, irrigatedHa, cropHa)
// Converts old 'mm' value to 'm3' using irrigatedHa (or cropHa fallback)
// Result replaces irr-applied.value; irr-unit forced to 'm3'
```

### Constants and lookup tables
**Not visible in this file** — all reference tables (FAO Kc per crop, soil textures, etc.) live in the missing `climate-kc-fao-data.js` and `assets/np-irrigation-balance-core.js`. The tool calls:
- `NB.getReferenceTablesHtml({ idPrefix: 'irr' })` — returns full FAO Kc reference HTML.
- `NB.renderFaoKcTable('irr-fao-kc-tbody', query, cropName)` — renders filtered FAO Kc table body.

The previous worklog (1-a) noted that `agua-disponible-textura-suelo-free.html` likely contains soil-texture data that the soil-water bridge consumes. The VPD tool in batch 1-a also uses Open-Meteo.

### Persistence

```ts
const IRR_PERSIST_IDS = [
  'irr-free-lat', 'irr-free-lng', 'irr-crop', 'irr-kc', 'irr-applied', 'irr-unit',
  'irr-crop-area', 'irr-area', 'irr-root-reach', 'irr-et0-manual', 'irr-rain-manual',
  'irr-use-manual-et0', 'irr-use-manual-rain', 'irr-macro-tunnel',
  'irr-soil-mode', 'irr-soil-m3'
];

// snap function also saves: periodDays, rolling (whole climate object)
// apply function: re-applies IDs, migrates legacy unit, restores rolling (and shows meta), restores period, re-applies coords, rebuilds soil panel, calls irrFreeUpdate()
```

### Map setup (`irrInitMap`)
```ts
// Default center: 19.4326, -99.1332 (Mexico City), zoom 5
// Tile layer: Esri World Imagery (satellite)
//   https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}
//   maxZoom: 19, attribution: '© Esri'
// Marker: draggable; on 'dragend' → irrApplyCoords(lat, lng, false)
// Map click → move marker + irrApplyCoords(lat, lng, false)
// irrApplyCoords writes 6-decimal lat/lng to inputs, dispatches 'input' event for persistence,
//   optionally moves marker and re-centers map at zoom ≥ 10.
// setTimeout 400ms → irrMap.invalidateSize() (Leaflet fix for initially-hidden maps).
```

### `irrFreeFetchClimate` (async)
```ts
async function irrFreeFetchClimate() {
  c = irrReadCoords();  // { lat, lng } from inputs
  if (!Number.isFinite(c.lat) || !Number.isFinite(c.lng)) {
    alert('Indica latitud y longitud o elige un punto en el mapa.');
    return;
  }
  // Disable button, set status '🌧️ Consultando clima…'
  try {
    irrRolling = await window.NpIrrBalance.fetchRollingOpenMeteo(c.lat, c.lng);
    irrRestoreClimateMeta();  // shows "Referencia satélite · actualizada {date}"
    // Status '✅ Clima cargado. Ajusta Kc y riego si hace falta.'
    irrFreeUpdate();
    if (irrPersist) irrPersist.saveNow();
  } catch (e) {
    // Status '⚠️ No se pudo obtener clima. Revisa conexión o coordenadas.'
    alert('No se pudo obtener el clima en ese punto. Revisa la conexión o las coordenadas.');
  } finally {
    // Re-enable button
  }
}
```

### `irrFreeUseMyLocation` (GPS)
```ts
// Uses window.NpFreeGeo.requestLocation({ retry: true })
//   Returns Promise<{ coords: { latitude, longitude } }>
// On success: irrApplyCoords(lat, lng, true)
// On failure: shows err.message or generic message
// Button #irr-btn-geo is disabled during request
```

### Non-obvious UX
- Period buttons (1 día / 7 días) switch `irrPeriodDays` and re-render.
- Manual ETo / rain checkboxes enable their inputs; macro-tunnel checkbox disables both rain checkbox and rain input (forces rain = 0).
- `irrSyncManualLabelStyles(st)` toggles `.is-on` class on the labels (turns them blue) when their checkbox is on.
- `irrFreeSuggestStrip()` reads `rootReachPct`; if null or <10 → alerts "Indica % raíces en superficie (10–100)." Otherwise computes `suggested = round(cropHa × reach% × 100) / 100` and writes to `#irr-area`.
- `irrFreeInitSoilPanel()` reads current soil mode/m3 from DOM (or defaults), then calls `NpSoilWaterBridge.buildPanelHtml()` to render the panel if not already present.
- Cross-tab listener: `window.addEventListener('storage', e => …)` — when `BRIDGE_KEY` changes in another tab (sister tool updated soil data), shows a message suggesting to click "Sugerir hasta 60% AU" or "hasta CC".
- Suggest buttons (`np-soil-bridge-suggest-btn[data-soil-prefix="irr"]`) trigger `irrFreeSuggestSoilFromBridge(target)` where target = `'cc'` or `'objective60'`.
- Embedded mode (`embed=login` or `embed=dashboard` in URL): hides the NutriPlant header, shows a "abrir herramienta en página completa" link if GPS fails.
- On `DOMContentLoaded`: init map, render notes/tables, wire FAO Kc search box, init soil panel, wire soil panel input/change handlers, bind persistence, do initial update.

### Charts/visualizations
- **Leaflet map** with Esri World Imagery (satellite tiles). Single draggable marker, click-to-move. Default center Mexico City.
- **Two metric cards** at top of calculator (ETo, Rain) with satellite-source badge.
- **Summary card** (`#irr-summary`) with gradient blue/cyan background, rendered by `NB.buildSummaryHtml(res)` (content not visible — likely shows ETc, deficit, surplus, m³ needed, etc.).
- **FAO Kc reference table** (`irr-kc-wrap`) with search box.

### Required API surface to reconstruct (for reimplementation)

```ts
// window.NpIrrBalance (NB):
type NpIrrBalance = {
  fetchRollingOpenMeteo(lat: number, lng: number): Promise<Rolling>;
  getRollingForPeriod(rolling: Rolling, periodDays: 1 | 7): { et0_mm: number|null, rain_mm: number|null, source: string };
  computeResults(state: IrrState, rolling: Rolling | null): IrrResults;
  fmtMm(v: number | null): string;
  sourceBadge(source: string): string;        // returns small HTML badge
  buildSummaryHtml(res: IrrResults): string;
  buildAreaCriterionNoteHtml(st: IrrState): string;
  getNoteHtml(): string;
  getReferenceTablesHtml(opts: { idPrefix: string }): string;
  getAreaCriterionScrollHintHtml(idPrefix: string): string;
  getKcFieldHintHtml(idPrefix: string): string;
  renderFaoKcTable(tbodyId: string, query: string, cropName: string): void;
  migrateIrrigationValueToM3(value: number, fromUnit: 'mm'|'m3', irrigatedHa: number, cropHa: number): number | null;
};

// window.NpSoilWaterBridge (SB):
type NpSoilWaterBridge = {
  BRIDGE_KEY: string;     // localStorage key for cross-tab soil water data
  buildPanelHtml(opts: { idPrefix: string; mode: string; m3: number|null }): string;
  applySuggestionToDom(idPrefix: string, target: 'cc' | 'objective60'): void;
  buildSuggestButtonsHtml(idPrefix: string): string;
};

// window.NpFreeGeo:
type NpFreeGeo = {
  requestLocation(opts: { retry: boolean }): Promise<{ coords: { latitude: number; longitude: number } }>;
  isEmbedded(): boolean;
};

// window.NpFreePersist:
type NpFreePersist = {
  bind(key: string, snapFn: () => any, applyFn: (data: any) => void): { saveNow: () => void };
  collectIds(ids: string[]): Record<string, string>;
  applyIds(data: Record<string, string>, ids: string[]): void;
};
```

`IrrResults` shape is inferred as containing at minimum:
```ts
type IrrResults = {
  periodDays: 1 | 7;
  et0: number | null;
  et0Source: string;
  rain: number | null;
  rainSource: string;
  // … plus ETc, irrigationMm, balance, totalVolume_m3, etc. (consumed by buildSummaryHtml)
};
```

---

## Cross-tool conventions

### `window.NpFreePersist` API (used by tools 2, 3, 4, 5)
- `bind(key, snapFn, applyFn)` returns an object with `saveNow()`. Internally it auto-saves to `localStorage` on input changes (debounced) and calls `applyFn(savedData)` on page load.
- `collectIds(ids)` returns `{ [id]: element.value }` for all matched IDs.
- `applyIds(data, ids)` writes `data[id]` to each element's `.value`.
- React reimplementation: replace with `useState` + `useEffect` + `localStorage`.

### NutriPlant branding
Every tool starts with `<div class="np-free-tool-head">` containing:
- `<h1 class="np-free-tool-title">` with emoji + Spanish title
- `<div class="np-free-watermark"><img src="assets/N_Hoja_Azul.png" alt=""></div>`

External assets (`assets/free-tools-watermark.css`, `assets/free-tools-embed.js`, `assets/N_Hoja_Azul.png`) are not present in `/tmp/np_tools/` but their behavior is documented in worklog 1-a.

### Numeric formatting
- All tools use `es-MX` locale (comma decimals).
- `fmtNum(n, digits)` returns `'—'` for non-finite, else `n.toLocaleString('es-MX', { minimumFractionDigits: digits, maximumFractionDigits: digits })`.
- `escapeHtml(s)` is the standard 4-replacement helper.

---

## Suggested React/TypeScript file layout (for next agent)

```
src/components/free-tools/
├── periodic-table/
│   ├── PeriodicTable.tsx           // main tool, two-tab switcher
│   ├── PeriodicGrid.tsx            // CSS-grid 118-element table
│   ├── ElementDetailCard.tsx       // selected element panel
│   ├── MolecularWeightCalculator.tsx
│   ├── formulaParser.ts            // normalizeFormula + parseTerms + collectElements + parseCompound
│   └── data/
│       ├── elements.ts             // ELEMENTS (118 entries)
│       ├── atomicWeights.ts        // ATOMIC_WEIGHTS
│       ├── details.ts              // DETAILS (24 entries)
│       ├── valences.ts             // DEFAULT_VALENCE + primaryValence()
│       └── molExamples.ts
├── fertilizer-compatibility/
│   ├── FertilizerCompatibility.tsx
│   ├── CompatibilityMatrix.tsx     // triangular table
│   ├── DetailPanel.tsx
│   ├── inferLevel.ts               // trait-based inference + OVERRIDE map
│   ├── detailTemplate.ts           // detailTemplate() + DETAIL_KEYS
│   └── data/
│       ├── fertilizers.ts          // FERTILIZERS (32 entries)
│       ├── traits.ts               // TR
│       └── override.ts             // OVERRIDE map
├── nutrient-interactions/
│   ├── NutrientInteractions.tsx    // 4-tab container
│   ├── MulderDiagram.tsx           // SVG circular diagram
│   ├── RootArrivalBars.tsx         // stacked bar chart
│   ├── MobilitySymptoms.tsx        // dichotomous key + pill lists + ficha
│   ├── PhAvailability.tsx          // pH curve sparklines
│   └── data/
│       ├── spec.ts                 // SPEC (14 ions)
│       ├── arrival.ts              // ARRIVAL (14 rows)
│       ├── mobility.ts             // MOBILITY (12 elements) + EL_NAMES
│       ├── phNutrients.ts          // PH_NUTRIENTS (14 curves)
│       └── nutRefTable.ts          // NUT_REF_TABLE (16 rows)
├── solubility-salt-index/
│   ├── SolubilitySaltIndex.tsx
│   ├── SolubilityTable.tsx
│   ├── IonDissociationDiagram.tsx  // cation/anion spheres
│   └── data/
│       └── rows.ts                 // ROWS (13 fertilizers)
├── irrigation-balance/
│   ├── IrrigationBalance.tsx       // main tool
│   ├── ClimateMap.tsx              // Leaflet wrapper
│   ├── Calculator.tsx              // input form
│   ├── SoilWaterBridgePanel.tsx
│   ├── FaoKcTable.tsx
│   ├── core/
│   │   ├── balance.ts              // computeResults() — needs reconstruction
│   │   ├── rolling.ts              // fetchRollingOpenMeteo() — needs reconstruction
│   │   ├── format.ts               // fmtMm, sourceBadge
│   │   └── migrate.ts              // migrateIrrigationValueToM3
│   └── data/
│       ├── faoKc.ts                // FAO Kc per crop (needs reconstruction)
│       └── soilTextures.ts         // (consumed via BRIDGE_KEY)
└── shared/
    ├── NpFreePersist.ts            // React hook usePersistedState
    ├── format.ts                   // fmtNum, escapeHtml
    └── LeafletMap.tsx              // shared map wrapper
```

### Reconstruction priorities
1. **High-confidence** (full data in this file): Periodic Table, Fertilizer Compatibility, Nutrient Interactions, Solubility & Salt Index — all four have 100% of their data and logic inline.
2. **Low-confidence** (requires reconstructing missing JS files): Irrigation Balance — only the input/output schema and the call-site API are visible. The actual `computeResults()`, `fetchRollingOpenMeteo()`, FAO Kc data, soil-water bridge logic, and geolocation helper must be reconstructed from:
   - FAO-56 standard formulas (ETc = Kc × ETo, etc.)
   - Open-Meteo API docs (the VPD tool from batch 1-a uses the same API)
   - The `agua-disponible-textura-suelo-free.html` file (which probably contains the soil texture / available-water logic that the bridge consumes)
   - The `climate-kc-fao-data.js` file (FAO-56 Kc table per crop — standard published values)

### Key external dependencies flagged
- **Leaflet 1.9.4** (CDN) — required for irrigation map (tool 5)
- **Open-Meteo API** — required for ETo + rain fetching (tool 5)
- **Esri World Imagery** tiles — satellite basemap (tool 5)
- **Geolocation API** (`navigator.geolocation`) — wrapped by `np-free-geolocation.js` (tool 5)
- No external dependencies for tools 1, 2, 3, 4 — all data and logic is inline.
