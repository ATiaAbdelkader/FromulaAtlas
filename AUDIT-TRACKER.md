# Audit Tracker — FormulaAtlas DZ

Single source of truth for findings from external audits and their resolution state.
Append new findings at the bottom; update status inline when resolved.

**Status legend:** OPEN · IN PROGRESS · RESOLVED · WONTFIX

---

## Audit Round 1 — Strict External Audit (2026-08-28)

Source: strict external review of the FormulaAtlas DZ prototype.
Commit at time of audit: `bf5990a` (fix: 3 runtime errors — useLanguage, isRTL, favicon 404).

### P0 — Critical (blocker for production)

| ID | Finding | Status | Resolved in | Notes |
|----|---------|--------|-------------|-------|
| P0-1 | Runtime crash: `useLanguage is not defined` | RESOLVED | `bf5990a` | Replaced with `useTranslation()` from `@/lib/language-store`. Same fix cleared the cascading `isRTL` and `.toFixed on undefined` errors. |
| P0-2 | `/favicon.ico` 404 on Vercel | RESOLVED | `bf5990a` | Copied `icon.svg` to `public/favicon.ico` so both paths resolve. |
| P0-3 | TypeScript errors blocking `next build` | RESOLVED | `bf5990a` | Added `guide` to `TabId` union + all 3 level tab lists; restored lost CollapsibleSection props; fixed SeasonPlanGeneratorWrapper language prop. |
| P0-4 | 16 files lost during rebase | RESOLVED | `d97bf9b` | All 16 files restored; Vercel build clean. |

### P1 — High priority (must fix before stable release)

| ID | Finding | Status | Resolved in | Notes |
|----|---------|--------|-------------|-------|
| P1-1 | `useLanguage` / `isRTL` cleanup incomplete | RESOLVED | `bf5990a` | Same fix as P0-1; verified no remaining call sites. |
| P1-2 | Displayed prices conflated official vs market price | RESOLVED | `e276d04` | Added `PRICE_TYPE_DISCLAIMER`, `PriceInfo` interface (4 types: `official_reference`, `market_estimate`, `historical_average`, `user_input`), and `formatPriceWithProvenance()`. Now explicit that displayed prices are OAIC regulatory reference, not live wholesale. |
| P1-3 | Version governance absent | RESOLVED | `e276d04` | `VERSION_INFO.productVersion` now `'0.2.0 (Prototype)'`; `inpvDatasetVersion` notes `'may be outdated'`. |
| P1-4 | Feature status contradicted itself (NDVI: marketed as available but roadmap said In Progress) | RESOLVED | `e276d04` | Created `FEATURE_STATUS` (LIVE / BETA / ROADMAP) with trilingual labels and `FEATURE_REGISTRY` covering 16 features. NDVI now correctly BETA (limited Algerian coverage). |
| P1-5 | Calendar missing 'observation' filter + distinct action icons | RESOLVED | `4425ae0` | Added filter dropdown entry and per-activity icons (weedManagement ✂, maintenance ⚙, observation 👁). |
| P1-6 | VPD interpretation was universal instead of crop-specific | RESOLVED | `e276d04` | Created `VPD_CROP_RANGES` (12 crop × environment combinations); `interpretVPD(crop, environment)` returns crop-specific optimal/moderate/stress with trilingual message. Falls back to generic with disclaimer if crop not specified. |
| P1-7 | Required dose conflated with purchase quantity (bag surplus hidden) | RESOLVED | `e276d04` | Created `computeNutrientPurchase()` separating: required nutrient (kg/ha), required product (kg/ha), bags to purchase (rounded up), surplus (kg + %), actual applied dose. Warning emitted when surplus > 5%. |
| P1-8 | FarmerHome did not mount FarmProfileWizard | RESOLVED | `43e2cfc` | FarmerHome now mounts wizard with auto-open on first visit + first-run banner + Edit button. |
| P1-9 | FarmStats was English-only (no FR/AR) | RESOLVED | `43e2cfc` | Trilingual labels added; `language` added to useEffect deps. |

### P2 — Medium (polish, not blocking)

| ID | Finding | Status | Resolved in | Notes |
|----|---------|--------|-------------|-------|
| P2-1 | Calendar source provenance fields not surfaced in UI | RESOLVED | `1180ee6` | New "Source provenance" Card surfaces institution / documentTitle / language / extractionStatus / interpretationRule. |
| P2-2 | Tests drifted from implementation contract | RESOLVED | `157e892` | Updated `test-localization.ts`, `test-user-level-tool-visibility.ts`, `test-count-consistency.ts` to match current canonical counts (FREE_TOOL_COUNT=27, INTERACTIVE_TOOL_COUNT=39, 48 tool-registry entries) and current calendar wording (`source operations` / `Previous Month` / `moveMonth = useCallback`). |
| P2-3 | Pre-existing TS errors in algeria-wilayas-58 / algeria-soil-zones-data / tool-explainer-data (`very_high` not in union, missing `algerianContextFr`) — and 54 more across 19 source files | RESOLVED | (this commit) | **All 63 pre-existing TS errors fixed.** `npx tsc --noEmit` is now clean. Key fixes: (a) standardized `very_high` → `severe` across all 5 risk unions in 3 algeria data files; (b) added missing `algerianContextFr` to `rusle_erosion` tool-explainer entry; (c) fixed `ManualFieldRecordInput` API mismatches in crop-phenology-timeline and farmer-market-benchmarks; (d) migrated two `sendToBridge()` call sites from old 2-arg signature to new `{targetToolId, sourceToolId, values}` shape; (e) extended `VpdResult` with `vpsAir` / `vpa` / `vpsLeaf` and populated in `calcVpdAdvanced`; (f) added `formula` field to `AcidDef` + populated 4 acids; (g) added `usslRisk` / `clToxRisk` / `naToxRisk` / `boronRisk` to WaterLabAnalyzer diagnostics; (h) rewrote AlgeriaAgriMap topography rendering to use actual `TOPOGRAPHIC_RELIEF_DATA` shape (tellAtlas/saharanAtlas/hoggarTassili arrays + majorChotts/majorWadis/desertErgs); (i) added `lithosol` to AlgeriaSoilClass union + injected lithosol entries into 9 `soilClassMultipliers` records; (j) replaced `Float64Array` with `number[]` for d3.contours compatibility; (k) inlined d3 transition setup to avoid cross-element-type `transition(t)` typing issues. |
| P2-4 | 'guide' tab added to all 3 user levels without UX review | WONTFIX | — | Reviewed: `help` mounts `<FarmerHelp>` (Farmer support: FAQ, tutorials, contact); `guide` mounts `<YourGuide>` (Professional in-depth feature catalogue). They serve distinct audiences and purposes — not redundant. Keeping both. |

### P3 — Low (nice-to-have)

| ID | Finding | Status | Resolved in | Notes |
|----|---------|--------|-------------|-------|
| P3-1 | New major tool "FarmPilot" integrated into Farmer (and Manager) mode | RESOLVED | (this commit) | Adds a top-level "FarmPilot" tab to Farmer + Manager navigation. Implements all 16 MVP features from the master prompt: (1) farm context integration via useFarmProfile(); (2) soil information (Basic + Advanced modes); (3) water information with FAO-29 classification; (4) Atlas estimates with explicit provenance tags (Measured/Farmer estimate/Atlas estimate/Unknown); (5) 14-crop FarmPilot database with FAO-56 Kc stages; (6) multi-factor recommendation engine (8 weighted factors: climate/soil/water/salinity/season/system/water-req/economics); (7) "I already know what I want to plant" reverse evaluation; (8) planting calculator (density/seed/cycle); (9) irrigation calculator ETc = ETo × Kc with efficiency + rainfall + duration; (10) fertilizer calculator NPK product → kg/ha with stage-split applications; (11) dynamic crop calendar from planting date; (12) Today's Tasks engine (irrigation/fertilization/inspection/field-work); (13) basic economics (revenue/cost/margin/ROI/break-even); (14) WHY? buttons on every recommendation; (15) High/Medium/Low confidence indicators; (16) demo farm mode (El Oued, 0.5 ha sandy, drip, potato) clearly labelled as Atlas estimates. All values carry source provenance; estimates are never presented as measured. Trilingual (EN/FR/AR), RTL-safe, mobile-first, PWA-friendly (localStorage persistence). Reuses: useFarmProfile, ALL_58_WILAYAS, useTranslation/copyFor, PROVENANCE/CONFIDENCE badges. Does not duplicate existing CropRecommendationEngine — operates on FarmPilot's own 14-crop database with FarmPilot-specific Kc/N-uptake/stage parameters. |
| P3-2 | FarmPilot: live weather forecast + alert banner + recent activity memory | RESOLVED | (this commit) | Three P0 audit findings from "My Field" → FarmPilot integration audit: (a) **Live weather** — replaced hardcoded `ET₀ = 5.0 mm/day` in Plan view (irrigation calc) and Today view (tasks) with `forecast.daily[0].et0` from Open-Meteo via `getForecast(lat, lng, { days: 4 })`. Falls back to `ALL_58_WILAYAS[].et0` (Atlas climatic default) when fetch fails. Forecast is fetched in a useEffect whenever wilaya or farm profile lat/lng changes; loading + error states shown inline. (b) **Weather alert banner** — mounted `<WeatherAlertBanner forecast={forecast} />` between FarmPilotHeader and nav. Drop-in component from weather-alert-banner.tsx shows frost/heat/rain/wind alerts (or green "good conditions") computed from `forecast.daily.slice(0, 3)`. (c) **Recent activity** — new `RecentActivityCard` shared component added to Home view and Today view. Reads `buildFieldRecordTimeline()` from field-record-book.ts (aggregates 6 sources: manual / scouting / soil-test / satellite / demo / field-profile). Shows top 6 records with kind emoji, title, summary, localized date, source badge. Header shows total record count + breakdown badges (observations 👁 / actions ⚙ / total DZD). Listens to `FIELD_RECORD_BOOK_CHANGED_EVENT` so records logged elsewhere update FarmPilot in real time. Also added a live weather chip to FarmPilotHeader showing current temp + ET₀ + rainfall + "Live" badge. Trilingual throughout. |
| P3-3 | Option B: port FarmPilot's decision engine INTO My Field | RESOLVED | (this commit) | New `FarmPilotDecisionCard` component (`src/components/agri/farmpilot-decision-card.tsx`, ~440 lines) mounted at the TOP of My Field (FarmerField), right after the banner and before FarmerWeatherAdvisor. Adds 3 FarmPilot-powered cards: (a) **Today's Decision** — shows irrigation (m³ + duration) and fertilizer (kg/ha + stage split) recommendations from FarmPilot's `calculateIrrigation()` and `calculateFertilizer()` engines, using the live ET₀ from My Field's existing forecast. Each row has a WHY? toggle (ET₀/Kc/ETc/efficiency/rainfall/stage breakdown) and provenance note (live vs Atlas default). Confidence badge (High/Medium/Low) on every recommendation. (b) **Crop Recommendation preview** — top 3 ranked crops from `recommendCrops()` with medals (🥇🥈🥉), score %, top strength, confidence badge. Shows current crop's score if one is set. "Open FarmPilot wizard" button deep-links to the FarmPilot tab for the full decision flow (soil/water entry, plan creation, calendar, economics). (c) **Atlas Estimates status** — small card showing provenance counts (🟢 measured / 🔵 Atlas / 🔴 unknown) with a prompt to add lab analyses via FarmPilot wizard. Includes a crop ID mapper (`mapLifecycleIdToFarmPilotId`) that translates CROP_LIFECYCLES IDs (used by My Field's farm profile) to FARMPILOT_CROPS IDs (used by the engine) — handles `wheat` → `wheat_durum` and `bell-pepper` → `bell_pepper` mismatches. My Field now has both operational depth (QuickLogger, calculators, symptom checker, computer vision, market benchmarks) AND decision intelligence (FarmPilot engine, provenance, confidence, WHY?). FarmPilot tab remains as a "wizard" launched from My Field's "Open FarmPilot wizard" button. |

---

## How to add a new finding

1. Append a new row to the appropriate priority table (P0/P1/P2/P3).
2. Use the next available ID in the format `<priority>-<next integer>` (e.g. `P2-5`).
3. Set status to `OPEN`.
4. When resolved: set status to `RESOLVED`, fill the `Resolved in` column with the commit SHA, and write a one-line summary in `Notes`.

---

## How to run the verification suite

```bash
# Type check — CLEAN as of P2-3 resolution (was 63 errors, now 0)
npx tsc --noEmit

# Next.js production build (TS errors would be ignored by config, but no longer any)
npx next build

# Domain tests (all must pass before tagging)
npm run test:domain
```

All three are required to be green before any release tag is cut.
