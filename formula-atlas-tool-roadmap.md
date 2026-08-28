# FormulaAtlas Free Tools: Product Rename and Farm Tool Roadmap

## Completed rename

The heading has been changed from **“NutriPlant PRO Free Tools”** to **“FormulaAtlas Free Tools”** in English, Arabic, and French. The change is committed and pushed to GitHub in commit `14e4b80`.

## Product direction

FormulaAtlas already contains a wide set of calculators and reference tools covering soil, irrigation, fertilizers, crop protection, machinery, livestock, GIS, finance, weather, reports, and multi-field management. The next stage should therefore focus on **decision workflows that connect existing tools**, rather than adding more isolated calculators with overlapping inputs.

This direction is consistent with the USDA NRCS nutrient-management model, which organizes recommendations around the 4Rs—right source, right rate, right time, and right place—and emphasizes site-specific assessment, measurable nutrient sources, realistic yield goals, local climate, crop stage, testing, conservation practices, and reassessment.[1]

## Recommended priorities

| Priority | Proposed tool | Main user problem | Existing FormulaAtlas capabilities to reuse | Recommended MVP output |
|---|---|---|---|---|
| P0 | **4R Nutrient Budget and Application Planner** | Farmers know a target yield but do not have one place to convert soil tests, organic sources, fertilizer products, and crop demand into an actionable plan. | Fertilization Generator, Mineralizable N Estimator, Manure Management Planner, Nutrient Distribution by Stage, Season Plan Generator, Soil Test History Tracker. | A field-specific N-P-K budget, source credits, split-application schedule, kg/ha and total-field quantities, and a printable/exportable plan. |
| P0 | **Field Workbench and Task Calendar** | Calculators produce answers, but farmers need to turn those answers into dated work, assign responsibility, and record completion. | Multi-Field Dashboard, Labor Calendar, Field Scouting Log, Irrigation Program Generator, Notification Center, Report Generator. | A per-field timeline containing irrigation, fertigation, scouting, spray, labor, and harvest tasks with status, notes, and reminders. |
| P1 | **Water Budget and Irrigation Optimizer** | Existing irrigation tools calculate individual values, but users need a weekly water balance that combines ET, rainfall, soil storage, system efficiency, and crop stage. | Evapotranspiration Tracker, Irrigation Scheduler, Irrigation System Designer, Water Harvesting Calculator, Weather Widget. | Recommended irrigation depth and duration by date, effective rainfall, root-zone depletion, deficit warning, and “what if rainfall changes?” scenarios. |
| P1 | **IPM Action Planner** | Scouting, pest thresholds, disease forecasts, spray drift, and pesticide dose decisions are currently distributed across separate tools. | Field Scouting Log, Pest Threshold Calculator, Disease Forecast Dashboard, Disease Reference Gallery, Pesticide Dose Calculator, Spray Drift Assessor, GDD Tracker. | A crop-and-field action card showing observation history, threshold status, biological and cultural options, treatment decision, weather constraints, and follow-up date. |
| P1 | **Field Gross-Margin and Break-Even Planner** | Farmers need to compare crop choices and understand whether yield, price, input cost, or labor changes will make a field profitable. | Financial Dashboard, Machinery Cost Calculator, Yield Estimation Calculator, Yield Gap Analysis, Multi-Field Dashboard. | Cost per hectare, revenue, gross margin, break-even yield and price, sensitivity scenarios, and actual-versus-budget tracking. |
| P2 | **Harvest Forecast and Lot Planner** | Production estimates are not enough; farms need an expected harvest window, labor demand, storage capacity, and lot records. | GDD Tracker, Yield Estimation Calculator, Post-Harvest Storage Calculator, Grain Bin Inventory Tracker, Labor Calendar. | Harvest-window estimate, expected volume, labor/transport requirement, storage allocation, and lot-level notes. |
| P2 | **Soil Health and Erosion Scenario Planner** | Soil tests show chemistry, but users also need to understand how cover crops, residue, rotation, organic matter, and slope affect soil-health risk. | Soil Test History Tracker, Cover Crop Selector, Crop Rotation Planner, RUSLE Erosion Calculator, Soil Water Texture, Carbon Credit Calculator. | A trend score for organic matter, erosion-risk scenario comparison, water-holding implications, and a season-by-season improvement plan. |
| P2 | **Machinery and Field-Operation Optimizer** | Machinery cost data exists, but farmers still need to compare operation sequences, field capacity, fuel, labor, and timing. | Machinery Cost Calculator, Labor Calendar, Multi-Field Dashboard, Field Boundary Importer, Distance and Bearing Calculator. | Operation cost per hectare, estimated completion time, equipment conflicts, route/field sequence, and a saveable operation plan. |

## What should be added first to the Free Tools section

The first public additions should be the **4R Nutrient Budget and Application Planner**, **Water Budget and Irrigation Optimizer**, and **IPM Action Planner**. Together they create a clear daily decision loop: determine what the crop needs, decide how much water and nutrient to apply, monitor field conditions, and choose the least-risk crop-protection action. They also reuse the largest amount of existing FormulaAtlas logic, reducing development time and keeping the experience coherent.

The **Field Workbench and Task Calendar** should follow immediately because it gives the other three tools a shared operational home. It should become the integration layer rather than another stand-alone calculator. The gross-margin planner is the best commercial follow-up because it turns agronomic recommendations into economic decisions without requiring external market data in the first version.

## Suggested implementation sequence

| Release | Scope | Definition of done |
|---|---|---|
| Release 1 | 4R Nutrient Budget and Application Planner | Soil, crop, yield target, field area, organic source, fertilizer source, application timing, totals, validation, Arabic/French/English copy, RTL layout, exportable report, deterministic tests. |
| Release 2 | Field Workbench and Task Calendar | Tasks linked to a field and season, status and due date, notes, local persistence, filters, mobile layout, and integration links back to existing calculators. |
| Release 3 | Water Budget and Irrigation Optimizer | ET and rainfall inputs, soil-water storage, system efficiency, crop stage, schedule output, warnings, scenario comparison, and integration with weather and irrigation tools. |
| Release 4 | IPM Action Planner | Observation log, threshold state, GDD context, treatment constraints, follow-up tasks, disclaimer and jurisdiction-safe pesticide data model, and printable action card. |
| Release 5 | Field Gross-Margin Planner | Budget versus actual, per-field and per-crop comparison, break-even analysis, sensitivity controls, and export to the existing financial/report surfaces. |

## Product and engineering rules for every new tool

Every tool should use a shared `Field` and `CropSeason` identity so that users do not re-enter the same farm, crop, area, planting date, soil, and irrigation data. A lightweight shared data model should include fields, seasons, observations, applications, tasks, harvest lots, and financial entries. Existing local-storage persistence can support the first version, while the data model should remain ready for future account synchronization.

All new user-facing copy should use the existing `copyFor(language, english, arabic, french?)` pattern and provide `dir={isRTL ? 'rtl' : 'ltr'}` at the component root. Arabic should be designed at the same time as English, not added as a later translation pass. Each tool should expose a concise printable summary and should connect to the existing Report Generator where practical.

Calculations should remain deterministic and testable. Each tool should include unit labels, input validation, source/assumption notes, an uncertainty or limitation notice where appropriate, and a clear distinction between a calculated estimate and a regulated recommendation. Pesticide and compliance-related workflows should use jurisdiction-specific data and should never imply that a generic dose is a legal label recommendation.

## Recommended next development task

The best next implementation is the **4R Nutrient Budget and Application Planner**. It has the strongest overlap with existing FormulaAtlas capabilities, directly addresses a high-frequency farm decision, can be delivered without new external services, and provides a foundation for the later Field Workbench, Water Optimizer, and IPM Planner.

## References

[1]: https://www.nrcs.usda.gov/getting-assistance/other-topics/nutrient-management "USDA NRCS — Nutrient Management"

[2]: https://openknowledge.fao.org/handle/20.500.14283/cd7169en "FAO Knowledge Repository — Integrated Pest Management"

The IPM roadmap should be aligned with official FAO crop-protection guidance and jurisdiction-specific pesticide labels before production recommendations are expanded.[2]
