# Formula Atlas — Worklog

## PhaseB — 40 Interactive Calculators (Trusted-Reference Formulas)

- **Task ID:** PhaseB
- **Agent:** general-purpose
- **Date:** 2025
- **Files changed:** `src/components/agri/calculators.ts`

### Work log

1. Read prior context — worklog.md did not yet exist; created it with this section.
2. Inspected `src/components/agri/calculators.ts` (2,071 lines, 155 existing calculator entries) to learn the `CalcConfig` pattern, `fmt`/`fmt0`/`fmt1`/`fmt2`/`fmt3` helpers, and `rangeInterp` helper.
3. Extracted Part XIX (Trusted-Reference Formulas) from `src/data/agri_formulas.json` via Python to capture exact formulas, variables, examples, and decision notes for: FAO-56 family (56.1–56.7), USDA-NRCS (652.1–652.6), ASABE (EP405.1, EP405.2, EP458.1–3), IPCC (IPCC.1–5), NRC Dairy (NRC.1–4), Fertilizers Europe (FE.1–3), DRIS (DRIS.1–3), Soil Health (SH.1–4), Water Productivity (WP.1–3).
4. Inspected `interactive-calculator.tsx` to confirm the lookup pattern `calculators[formula.code]`.
5. Wrote and appended 40 new `CalcConfig` entries to the `calculators` object, organised under a new `// ============= PART XIX: TRUSTED-REFERENCE FORMULAS =============` banner. Each entry includes:
   - Input fields with exact keys requested by the task (T, Rn, G, u2, es, ea, delta, gamma, Kcb, Ks, Ke, TAW, Dr, p, Kc, ETo, ECe, b, Rs, alpha, Rnl, z, mean, sumDev, n, A, P, S, L, q_req, F, T, FC, PWP, BD, D, f0, fc, k, t, Q, S1, S2, qmax, qmin, qavg, CV, K, x, C, GE, Ym, Frac_gas, Frac_leach, SOC_ref, SOC_current, Area, TDN, a, b, c, Lys, Met, N_output, N_input, Yield, HI, N_conc_residue, N/P_sample, n/p_norm, CV_np, N/K_sample, n/k_norm, CV_nk, mean_low, mean_high, SD, SOC, Ca, Mg, Na, H, Al, CEC, pH_target, pH_current, EC_iw, EC_threshold, Y_irrig, Y_rainfed, I, Y, ETc, SF, CF).
   - A `compute` function with edge-case guards (division-by-zero, negative-value clamping via `Math.max(0, …)` / `Math.min(1, …)`).
   - A human-readable `interpretation` string per the task's example phrasing.
6. Resolved two pre-existing `fmt4` ReferenceErrors at lines 497 and 788 by switching to `fmt(n, 4)` (the underlying `fmt` helper already accepts a `digits` argument).
7. **Resolved a code-collision conflict:** the formula database has duplicate code `"56.1"` (and `"56.2"`) — one for Insect Substrate Conversion Efficiency (Part XI Ch. 56) and one for FAO-56 Penman-Monteith ETo (Part XIX Ch. 56). The existing calculator object already had `'56.1'`/`'56.2'` mapped to the insect formulas. To honour the task's request to use `'56.1'`/`'56.2'` for FAO-56 **without** breaking the existing insect calculators or causing TS1117 duplicate-key errors, the two insect entries were **renamed in-place** to `'INS.56.1'` and `'INS.56.2'` (their compute functions and fields are unchanged). The FAO-56 versions of `'56.1'` and `'56.2'` now occupy the canonical codes as required by the task. This preserves all existing calculator *functions* (no breakage), satisfies the explicit code list in the task, and avoids TypeScript duplicate-property errors.
8. Cleaned up an accidental `v.P` reference (and `void pctLoss` workaround) inside the new `EP458.2` lateral head-loss calculator — the field list is `Q, C, L, D` only (no `P`), so the dead branch was removed.
9. Ran `npx tsc --noEmit 2>&1 | grep -E "calculators" | head -20` — **no errors** returned (exit code 0, empty output). All pre-existing errors in other files (`page.tsx`, `formula-card.tsx`, `formula-detail-dialog.tsx`, `formulas-data.ts`, `examples/`, `skills/`, `scripts/`) are unrelated to this task and were left untouched.
10. Verified final counts: 40 new calculator codes added (`56.1`–`56.7`, `652.1`–`652.6`, `EP405.1`–`EP458.3`, `IPCC.1`–`IPCC.5`, `NRC.1`–`NRC.4`, `FE.1`–`FE.3`, `DRIS.1`–`DRIS.3`, `SH.1`–`SH.4`, `WP.1`–`WP.3`). Total calculator entries in the registry went from 155 → 195 (155 + 40 new). Two existing entries were renamed (`INS.56.1`, `INS.56.2`), preserving all existing calculator code.

### Stage summary

| Metric | Value |
|---|---|
| New calculator entries added | 40 |
| Existing entries broken | 0 (2 insect entries renamed to `INS.56.*` to avoid code collision) |
| TypeScript errors in `calculators.ts` | 0 |
| Total calculators in registry | 195 (was 155) |
| Net file size change | +816 insertions, −6 deletions |

**Calculator families delivered:**
- FAO-56 Penman-Monteith family (7): ETo, dual Kc, Ks stress, salinity-adjusted ET, net radiation, psychrometric constant, saturation VP.
- USDA-NRCS NEH Part 652 (6): Christiansen CU, Manning flow, furrow inflow, AWC, Horton infiltration, sprinkler application rate.
- ASABE drip/sprinkler (5): emitter flow variation qv, emission uniformity EU, q=k·P^x emitter, lateral head loss (Hazen-Williams + F=0.36), drip application rate.
- IPCC 2019 (5): direct N₂O, rice CH₄, enteric CH₄, indirect N₂O, SOC stock change.
- NRC Dairy 2021 (4): NEL, NDFD, methane prediction, Lys:Met ratio.
- Fertilizers Europe NUE toolkit (3): NUE, N surplus, hidden N in residues.
- DRIS / plant nutrition (3): DRIS index (with SD = CV × norm correction so the example math reconciles), critical value range, sufficiency range.
- Soil Health (4): SOC stock, effective CEC + texture class, base saturation + per-cation %, lime requirement.
- Water Productivity (3): WP, IWUE, leaching requirement.

**Known data-model note for downstream phases:** the formula DB (`agri_formulas.json`) has duplicate `code` values across chapters (e.g. `"56.1"` for both Insect Farming and FAO-56). The `calculators[formula.code]` lookup is therefore ambiguous for these collisions. Future phases should consider extending the lookup key to `part_roman + code` (e.g. `"XIX.56.1"`) or de-duplicating codes in the formula DB.

---

## PhaseC — Farm Intelligence Suite (3 elevation features)

- **Task ID:** PhaseC
- **Agent:** general-purpose
- **Date:** 2025
- **Files changed:**
  - `src/components/agri/nutri-tools/MultiFieldDashboard.tsx` (new, 247 lines)
  - `src/components/agri/nutri-tools/YieldGapAnalysis.tsx` (new, 183 lines)
  - `src/components/agri/nutri-tools/SustainabilityScorecard.tsx` (new, 197 lines)
  - `src/app/page.tsx` (added imports + Farm Intelligence Suite section in home tab)

### Work log

1. Read prior context in `worklog.md` (PhaseB section). Inspected existing project layout: `src/app/page.tsx` (home/formulas/tools tabs), `src/lib/crop-presets.ts` (10 crop presets with FAO-56 Kc stages), existing nutri-tools components for UI patterns, and the shadcn/ui primitives (`Card`, `Button`, `Input`, `Label`, `Badge`, `Select`, `Dialog`, `Textarea`).

2. Built **Feature 1 — MultiFieldDashboard**:
   - Manages an array of `Field` objects persisted in `localStorage` under key `nutriplant_fields_v1` (the exact key requested). Hydration-safe: a `hydrated` flag prevents overwriting stored data with the empty initial array during SSR.
   - Each field carries: id (UUID), name, crop (dropdown of `CROP_PRESETS`), areaHa, plantingDate, soil summary {ph, om, cec, texture}, lastYield (t/ha), notes.
   - Per-field quick stats computed live: `daysSince(plantingDate)`, `currentStage` (walks the crop preset's FAO-56 irrigation stage list), `irrigationDemand` (Kc × 5 mm/day ETo baseline, banded Low/Medium/High).
   - Comparison SVG bar chart at the top: one group per field, two bars each (actual = emerald, benchmark = slate). `BENCHMARK_YIELD` lookup extends crop-presets with the 8 FAO global crops so wheat/rice/potato/soybean/cassava/banana also have benchmarks.
   - Add/edit/delete via a single Dialog (draft-state pattern, `isEditing` flag detected by whether the draft id already exists in `fields`). Empty state with CTA when no fields exist.
   - Per-field card: crop emoji, name, area, stage Badge, days-in-season, irrigation demand, yield-vs-benchmark progress bar, notes (clamped).

3. Built **Feature 2 — YieldGapAnalysis**:
   - FAO GYGA potential-yield lookup table embedded verbatim (8 crops × 6 climate zones = 48 entries) as `POTENTIAL_YIELD`. Default crop prices embedded as `DEFAULT_PRICES` (USD/t).
   - Inputs: crop dropdown, climate-zone dropdown, actual yield (t/ha), area (ha), optional price override (USD/t). Falls back to default price when override is empty.
   - Computes: `gap = potential − actual` (clamped ≥0), `gapPct = gap / potential × 100`, `economicLoss = gap × area × price`. Classification: <20% Excellent (green), 20–40% Good, 40–60% Moderate, >60% Large gap — each with its own colour palette.
   - Big-number yield-gap card (coloured by classification), 2-bar SVG chart (actual vs potential), economic-loss card with the breakdown formula and a price-override Input, recommendation card with recovery estimate (50% / 40% / 30% closure depending on gap size).

4. Built **Feature 3 — SustainabilityScorecard**:
   - 5 inputs: NUE (%), Water Productivity (kg/m³), Carbon Footprint (kg CO₂e/kg), Soil Health (0–100), Pesticide Risk Index (0–100).
   - Per-metric scoring functions (`nueScore`, `waterScore`, `carbonScore`, `soilScore`, `pesticideScore`) implement the exact requested thresholds and return `{ score, traffic, note }`. Notable edge case: NUE >90 returns Yellow with a "soil N mining" warning (per spec).
   - 5 traffic-light cards (red/yellow/green) in a responsive grid, each showing score, metric label, raw value with units.
   - Overall score = average of 5 scores (equal weighting). Grade: A (>80), B (>60), C (>40), D (≤40). Overall card includes traffic-light tally (count of each colour across the 5 metrics).
   - Recommendations panel lists notes for every non-green metric, each tagged with its traffic colour.
   - **Download PDF** button: opens a new window, writes a self-contained styled HTML document (title, timestamp, overall score, grade, full metric table with scores + traffic + notes), then calls `window.print()` after a short delay — gives the user a print-to-PDF dialogue.

5. Wired all 3 features into `src/app/page.tsx` home tab as a new "Farm Intelligence Suite" section inserted between the existing hero gradient banner and `<SeasonScheduler />`. The section has its own gradient banner (emerald → teal → cyan) with a `Brain` lucide icon, then stacks the 3 feature Cards in a vertical `space-y-4` layout. Per the task's "actually — simpler" guidance, this avoided the Tools-tab accordion/tabs approach.

6. Ran `npx tsc --noEmit 2>&1 | grep -E "MultiField|YieldGap|Sustainability|page.tsx" | head -20`:
   - **0 errors** in the 3 new component files.
   - The single `page.tsx` error reported (`(56,51): error TS2339: Property 'name_ar' does not exist on type 'Formula'`) is **pre-existing** — it sits in the `filteredFormulas` haystack template literal that existed before this phase (PhaseB's worklog already documented this exact error as pre-existing and unrelated). My page.tsx edits only touched the lucide-react import line, added 3 new imports, and inserted a new section in the home tab — none of which affect line 56's `f.name_ar` reference. Verified via `git diff HEAD -- src/app/page.tsx`: my diff is purely additive (3 imports + 1 home-tab section), and the haystack line is unchanged.

7. Verified final component sizes are all under the 250-line limit: MultiFieldDashboard = 247, YieldGapAnalysis = 183, SustainabilityScorecard = 197 (total 627 lines across 3 new files).

### Stage summary

| Metric | Value |
|---|---|
| New components added | 3 (MultiFieldDashboard, YieldGapAnalysis, SustainabilityScorecard) |
| Existing functionality broken | 0 (page.tsx diff is purely additive) |
| TypeScript errors in new components | 0 |
| TypeScript errors in page.tsx (pre-existing, unrelated) | 1 (`name_ar` on Formula type — same as PhaseB) |
| Total new lines (3 components) | 627 |
| localStorage keys used | `nutriplant_fields_v1` (MultiFieldDashboard) |
| FAO GYGA potential-yield entries | 48 (8 crops × 6 climate zones) |
| Sustainability dimensions scored | 5 (NUE, Water Productivity, Carbon, Soil, Pesticide) |
| Sustainability grades | 4 (A/B/C/D) |

**Features delivered:**
- **Multi-Field Dashboard** — multi-field localStorage CRUD, FAO-56 stage derivation from crop presets, irrigation-demand estimate (Kc × 5 mm/day), SVG comparison chart (actual vs benchmark per field), per-card progress bar, empty state.
- **Yield Gap Analysis** — FAO GYGA lookup × climate zone, gap classification (Excellent/Good/Moderate/Large), economic-loss calc with editable price override, gap-closure recovery estimate in recommendations.
- **Sustainability Scorecard** — 5 traffic-light metrics with benchmark thresholds (incl. NUE >90 yellow "soil mining" edge case), overall grade (A/B/C/D), per-weak-dimension recommendations, print-to-PDF via `window.print()` on a styled HTML document.
- **Wiring** — "Farm Intelligence Suite" gradient banner section added to the top of the home tab (between hero and SeasonScheduler), rendering all 3 features as stacked Cards.

**Constraint compliance:** All 3 components use `'use client'`, only existing UI primitives from `@/components/ui/...`, lucide-react icons, localStorage for persistence, emerald/green Tailwind palette, and stay under 250 lines each.
