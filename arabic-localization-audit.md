# Arabic localization audit

## Current architecture

Formula Atlas has a persisted `en` / `fr` / `ar` language store, RTL direction switching, a shared Arabic UI dictionary in `src/lib/language-store.ts`, and localized formula fields where Arabic data exists. The Farm index already uses an inline `tr(english, arabic, language)` helper for tool titles and descriptions.

## Audit findings

- The shared Arabic dictionary covers the current global navigation, common actions, formula controls, onboarding labels, units, language toggle, empty states, errors, bookmarks, and formula dialog labels.
- Arabic is not yet wired through most internal Farm-tool components. Only 13 of 99 `src/components/agri/nutri-tools/*.tsx` files currently consume language context or a localization helper.
- A static scan found approximately 1,189 visible-string candidates in Farm-tool components, including labels, buttons, placeholders, tabs, warnings, metric headings, and accessibility attributes.
- The highest-density user-facing surfaces include `IrrigationScheduler`, `IrrigationSystemDesigner`, `CropCalendarGenerator`, `SoilTestHistoryTracker`, `FertilizationGenerator`, `CoordinateConverter`, `LivestockGrowthBenchmark`, `DistanceBearingCalculator`, `PostHarvestStorageCalculator`, and `LaborCalendar`.
- Several non-Farm surfaces also contain English fallback copy, including About, AI/planner workflows, community, marketplace, financial dashboard, notifications, reports, service integrations, weather, onboarding, command palette, and API documentation.

## Implementation direction

1. Extend the shared localization utilities with a reusable `copyFor(language, english, french, arabic)` helper and domain-safe Arabic labels.
2. Localize the app shell and highest-traffic shared surfaces first.
3. Localize the Farm tools in coherent batches, starting with the most-used and highest-density tools, while preserving formulas, state, persistence, exports, and API behavior.
4. Add a regression audit that flags new hardcoded user-facing English strings in localized surfaces and verifies Arabic coverage for the shared dictionary.
5. Validate RTL rendering in the browser and run lint, strict TypeScript, domain tests, catalog verification, production build, and whitespace checks before committing.
