# RECREATE — Recreate 4 lost files from session reset

- **Task ID:** RECREATE
- **Agent:** general-purpose
- **Date:** 2025
- **Files recreated:**
  - `src/lib/irrigation-crop-data.ts` (229 lines)
  - `src/components/agri/nutri-tools/IrrigationProgramGenerator.tsx` (214 lines)
  - `src/lib/plant-disease-data.ts` (394 lines)
  - `src/components/agri/nutri-tools/AgriPlannerSuite.tsx` (248 lines)

## Work log

1. Read `worklog.md` (PhaseB, PhaseC, IrrCalcs sections) and inspected existing project layout to understand the established patterns: `src/lib/crop-presets.ts` (CropPreset interface), `src/components/agri/nutri-tools/YieldGapAnalysis.tsx` and `SustainabilityScorecard.tsx` (component conventions, emerald palette, print-to-PDF pattern), `src/app/api/parse-lab-report/route.ts` (VLM endpoint contract).

2. **File 1 — `irrigation-crop-data.ts` (229 lines):**
   - Defined `CropCategory = 'vegetable' | 'fruit' | 'cereal' | 'industrial' | 'forage'` and `CropIrrigationData` interface with all required fields.
   - Implemented an internal triangular-kernel `buildDecadal(annual, seasonStart, seasonEnd, peak)` helper that produces 18 decadal values summing ≈ `annual_irrigation_mm`. Values outside `[seasonStart, seasonEnd]` are 0; the kernel peaks at `peak` and decays linearly on both sides, then normalises the rounded sum to match the target. Verified manually for asparagus (364 mm, 0–17, peak 7) → 18 values summing to 363 (off-by-one rounding, "approximately" as required).
   - Hard-coded all 35 crops with the **exact** BRL/COM values provided in the task (annual_consumption, annual_irrigation, category). Each crop's season window and peak decade were chosen agronomically (e.g. winter cereals Apr–Jun with Apr peak; summer crops May–Sep with Jul–Aug peak; perennials Apr–Sep with Jun–Aug peak).
   - Exported `CROP_IRRIGATION_DATA` array, `DECADAL_MONTHS` (18-decade label array Apr-D1 … Sep-D3), `getCropIrrigation(id)`, `getCropsByCategory(category)`.

3. **File 2 — `IrrigationProgramGenerator.tsx` (214 lines):**
   - `'use client'` component consuming `CROP_IRRIGATION_DATA`, `DECADAL_MONTHS`, `getCropIrrigation`, `CropCategory`.
   - Crop selector grouped by category (using nested div with category header inside SelectContent, matching the existing component pattern).
   - Inputs: field area (ha), system efficiency (%), irrigation system type (drip/sprinkler/furrow, with auto-set efficiency defaults: drip 90, sprinkler 75, furrow 60).
   - Computations: `grossAnnual = net / (eff/100)`, `totalVolumeM3 = grossAnnual × area × 10` (1 mm·ha = 10 m³), `peakDaily = (peakDecadal / 10) × area × 10` (peak decade = 10 days).
   - 4 summary cards (Net annual, Gross annual, Total volume, Peak daily) using Droplets/Waves/Gauge/Layers icons and emerald/teal/cyan/sky text colours.
   - Monthly table with 6 horizontal bars (Apr–Sep) showing net mm with width proportional to max month.
   - 10-day (decadal) schedule grid: 18 cards in a 6-column layout (one row per month); the PEAK decade is highlighted with amber border + amber background + "PEAK" Badge.
   - Export-to-PDF: opens a new window, writes self-contained styled HTML with summary stats + monthly table, then triggers `window.print()` after 300 ms — matching the SustainabilityScorecard pattern.
   - Lucide icons: Droplets, Download, Calendar, Gauge, Waves, Layers.

4. **File 3 — `plant-disease-data.ts` (394 lines):**
   - Defined interfaces: `PlantDisease`, `CropRecommendationInput`, `CropRecommendationRange`, `CropRecommendationResult`, `FertilizerInput`, `FertilizerType`, `FertilizerRecommendation`.
   - **39 PlantDisease entries** derived from the AgriPlanner CNN model (PlantVillage-derived). The task's per-crop breakdown (Apple 4, Blueberry 1, Cherry 2, Corn 4, Grape 4, Orange 1, Peach 2, Pepper 2, Potato 3, Raspberry 1, Soybean 1, Squash 1, Strawberry 2, Tomato 10) sums to **38**, but the task explicitly requires **39** entries. Resolved by adding one extra realistic Tomato disease (`tomato_powdery_mildew` caused by Leveillula taurica / Oidium neolycopersici, a real and economically significant disease) — bringing Tomato to 11 and total to 39. Each entry has id, disease_name, crop, is_healthy, description, prevention[], treatment, severity (low/moderate/high/critical) with realistic agronomic content (real pathogen binomials, real active ingredients, real cultural/chemical controls).
   - **22 CropRecommendationRange entries** for the AgriPlanner / Crop-Recommendation Kaggle dataset (rice, maize, chickpea, kidneybeans, pigeonpeas, mothbeans, mungbean, blackgram, lentil, pomegranate, banana, mango, grapes, watermelon, muskmelon, apple, orange, papaya, coconut, cotton, jute, coffee). Each has 7 ranges (N, P, K, temperature, humidity, pH, rainfall) based on common agronomic references.
   - **7 FertilizerType entries**: Urea (46-0-0), DAP (18-46-0), 14-35-14, 28-28 (28-28-0), 17-17-17, 20-20 (20-20-0), 10-26-26 — each with NPK tuple and application notes.
   - **`recommendCrops(input, topN=5)`**: scores each crop on each of 7 inputs (1.0 if inside range, decays linearly with distance outside the range scaled by the half-width of the range); averages across the 7 fields; returns top N sorted by confidence (0–100).
   - **`recommendFertilizer(input)`**: computes relative sufficiency for N (÷100), P (÷50), K (÷80); selects the most deficient nutrient and recommends the matching fertiliser (Urea for N-deficient, DAP for P-deficient, 10-26-26 for K-deficient, 17-17-17 for balanced). Application rate adjusts for soil type (lower on Sandy) and moisture (split applications below 30% to limit NH₃ volatilisation).
   - Exports all interfaces and both functions.

5. **File 4 — `AgriPlannerSuite.tsx` (248 lines, under the 250-line limit):**
   - `'use client'` component with 3 Tabs (Tabs/TabsList/TabsTrigger/TabsContent from shadcn/ui).
   - **DiseaseTab**: file input (hidden `<input type="file">` wrapped in a clickable `<label>`) that reads the file as a data URL via FileReader, POSTs to `/api/parse-lab-report`, displays the JSON response. Shows preview image, loading spinner (Loader2 with animate-spin), error text, and a graceful "VLM didn't detect a soil/water/lab pattern" notice when the response type is "unknown" (since the existing endpoint is trained for soil/water/fertilizer reports, not plant diseases). Below the upload is a disease-database browser filtered by crop (Select with "All crops" + per-crop options) showing all 39 entries with severity Badge and treatment notes.
   - **CropTab**: 7 number inputs (N, P, K, Temp, Humidity, pH, Rainfall) using a single state object + mapped inputs array for compactness. Calls `recommendCrops(input, 5)` and renders the top 5 crops as ranked rows with horizontal confidence bars (width ∝ confidence / maxConfidence).
   - **FertilizerTab**: 2 Selects (soil type, crop type) + 4 number inputs (N, P, K, moisture) using the same state-object pattern. Calls `recommendFertilizer(input)` and renders the recommended fertiliser name, NPK Badge, reason, application rate, and notes in an emerald-tinted card.
   - Lucide icons: Microscope, Brain, FlaskConical, Upload, Leaf, Loader2.
   - Severity colour mapping: low → emerald, moderate → amber, high → orange, critical → red (with dark-mode variants).
   - Line-count management: first draft was 272 lines; consolidated CropTab and FertilizerTab input state into single objects with mapped input arrays; inlined single-expression `useMemo` and `SelectItem` map; final size 248 lines (under 250).

6. **Verification:** ran `cd /home/z/my-project && npx tsc --noEmit 2>&1 | grep -E "irrigation-crop-data|IrrigationProgramGenerator|plant-disease-data|AgriPlannerSuite" | head -20` — **0 errors** (empty output). All pre-existing TypeScript errors in the broader codebase (`season-report.tsx`, `smart-alerts.tsx`, `formulas-data.ts`) are unrelated to this task and were left untouched.

## Stage summary

| Metric | Value |
|---|---|
| Files recreated | 4 |
| Total new lines | 1,085 (229 + 214 + 394 + 248) |
| TypeScript errors in recreated files | 0 |
| Crops in irrigation data | 35 (exact BRL/COM annual values) |
| Decadal values per crop | 18 (3 decades × 6 months Apr–Sep) |
| PlantDisease entries | 39 (38 standard PlantVillage + 1 extra realistic tomato powdery mildew to reach 39) |
| Crop recommendation ranges | 22 (AgriPlanner Kaggle crops) |
| Fertilizer types | 7 (Urea, DAP, 14-35-14, 28-28, 17-17-17, 20-20, 10-26-26) |
| AgriPlannerSuite tabs | 3 (Disease / Crop / Fertilizer) |
| Largest component (lines) | 248 (AgriPlannerSuite, under 250 limit) |

## Constraint compliance

- ✅ `'use client'` directive on both component files.
- ✅ Imports from `@/lib/...` and `@/components/ui/...`.
- ✅ Emerald/green Tailwind palette matching existing nutri-tools components (no indigo or blue).
- ✅ Both components under 250 lines (248 and 214).
- ✅ All 4 files self-contained and properly typed (no `any` in exported APIs).
- ✅ Lucide icons used throughout (Droplets, Download, Calendar, Gauge, Waves, Layers, Microscope, Brain, FlaskConical, Upload, Leaf, Loader2).
- ✅ shadcn/ui components: Card, Button, Input, Label, Select, Badge, Tabs (and sub-components).
- ✅ PDF export via `window.print()` on styled HTML (IrrigationProgramGenerator).
- ✅ VLM integration via existing `/api/parse-lab-report` endpoint (AgriPlannerSuite Disease tab).
- ✅ Exact BRL/COM annual values for all 35 crops preserved verbatim.

## Notes for downstream agents

- The 39-class AgriPlanner CNN model breakdown in the task (summing to 38) was reconciled by adding `tomato_powdery_mildew` as a realistic 39th entry. If a strict 38-class model is needed later, remove that one entry — the rest of the file is unaffected.
- `CROP_IRRIGATION_DATA` decadal values are generated at module-load time by `buildDecadal`. The sum is within ±5 mm of `annual_irrigation_mm` due to integer rounding — this is intentional and matches the task's "approximately" wording.
- The existing `/api/parse-lab-report` VLM endpoint is designed for soil/water/fertilizer reports. When the AgriPlannerSuite Disease tab uploads a plant leaf photo, the endpoint will likely return `type: "unknown"` — the UI handles this gracefully with a "browse the disease database" hint. A future enhancement could create a dedicated `/api/detect-plant-disease` endpoint with a plant-disease-aware system prompt.
- The 4 recreated files are **not yet wired into** `src/app/page.tsx` or any sidebar nav. A future task should add them to the home tab or tools tab (similar to how PhaseC wired in MultiFieldDashboard, YieldGapAnalysis, SustainabilityScorecard).
