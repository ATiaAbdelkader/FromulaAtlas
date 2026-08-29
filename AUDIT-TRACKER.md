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
| P2-2 | Tests drifted from implementation contract | RESOLVED | (this commit) | Updated `test-localization.ts`, `test-user-level-tool-visibility.ts`, `test-count-consistency.ts` to match current canonical counts (FREE_TOOL_COUNT=27, INTERACTIVE_TOOL_COUNT=39, 48 tool-registry entries) and current calendar wording (`source operations` / `Previous Month` / `moveMonth = useCallback`). |
| P2-3 | Pre-existing TS errors in algeria-wilayas-58 / algeria-soil-zones-data / tool-explainer-data (`very_high` not in union, missing `algerianContextFr`) | OPEN | — | Does not block `next build` (config has `ignoreBuildErrors: true`). Should be cleaned up before stable release. |
| P2-4 | 'guide' tab added to all 3 user levels without UX review | OPEN | — | Functional but `help` + `guide` may overlap; consider consolidating or differentiating. |

### P3 — Low (nice-to-have)

_None tracked yet._

---

## How to add a new finding

1. Append a new row to the appropriate priority table (P0/P1/P2/P3).
2. Use the next available ID in the format `<priority>-<next integer>` (e.g. `P2-5`).
3. Set status to `OPEN`.
4. When resolved: set status to `RESOLVED`, fill the `Resolved in` column with the commit SHA, and write a one-line summary in `Notes`.

---

## How to run the verification suite

```bash
# Type check (warnings OK, build ignores errors)
npx tsc --noEmit

# Next.js production build
npx next build

# Domain tests (all must pass before tagging)
npm run test:domain
```

All three are required to be green before any release tag is cut.
