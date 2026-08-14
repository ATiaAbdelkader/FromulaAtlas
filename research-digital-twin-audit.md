# Farm Digital Twin audit

## Existing integration boundary

FormulaAtlas already has a field-centric aggregation engine in `src/lib/field-workbench.ts`. `buildFieldWorkbenchSnapshot()` combines saved field records, soil test history, scouting entries, crop lifecycle stage, irrigation demand, nutrient budget, and priority signals. It should be reused by the Digital Twin rather than reimplemented.

## Current persistence contracts

- Multi-field records: `nutriplant_fields_v1`, managed by `MultiFieldDashboard`.
- Soil tests: `nutriplant_soil_history_v1`, managed by `soil-history-store.ts`.
- Scouting: `nutriplant_scout_log_v1`, managed by `scouting-store.ts`.
- Farm legacy store: `agri-atlas-farms`, managed by `farm-store.ts`; it stores farms and tagged formula calculations but is not linked to the newer field/workbench data.
- Workspace/team state: `agri-atlas-workspace`; local-only plan and member controls, not a field data source.
- Weather state: `agri-atlas-weather`; persisted location with live Open-Meteo weather fetch.

## Important compatibility constraints

The newer field tools link soil tests and scouting entries to fields by normalized field name, not by a shared field ID. The first Digital Twin release should preserve this behavior through adapters and should not silently migrate or delete existing keys. A future field-ID migration can be added deliberately later.

`FieldWorkbenchSnapshot` already exposes the most useful single-field view: crop stage, days since planting, irrigation demand, latest soil test, soil constraints, scouting counts and recent entries, nutrient plan, and priorities.

## Simulator integration

The Simulator domain engine is deterministic and already contains the scenario, costs, household overhead, phyto selections, risk results, market points, break-even price, total cost, total revenue, total yield, margins, ROI, warnings, labor calendar, and irrigation volume. The Digital Twin should store or reference a selected scenario per field rather than copy its calculations.

## Proposed first release boundary

Build a new local-first `farm-digital-twin.ts` adapter/summary layer and a `FarmDigitalTwin` component. It should read the existing field, soil, scouting, weather, and Simulator state, build one farm overview, and allow lightweight field-level actions such as selecting a field, recording a status note, and opening the existing Workbench/Simulator tools. It should be added near the top of the Farm tab, above the current WorkspacePanel and tool sections.

The first release should not change existing calculator formulas, replace current stores, introduce a server backend, or claim external synchronization. It should provide a stable integration surface for future AI scouting, satellite monitoring, price intelligence, and collaboration features.

## Candidate summary outputs

- Total fields and total cultivated area.
- Active crop mix and current season status.
- Field-level operational priority count from `FieldWorkbenchSnapshot`.
- Open/critical/overdue scouting count.
- Fields with soil constraints.
- Water-demand and irrigation-mode overview.
- Linked Simulator economics: total cost, break-even, expected margin, and risk status where a scenario is available.
- Latest weather context from the persisted location/weather store when available.
- A clear “next best action” list derived from existing deterministic priorities.

## Design direction

Use the existing Farm green visual language but elevate it into a command-center layout: a compact executive summary row, a field portfolio grid/table, a priority rail, and a selected-field detail panel. All visible labels must use the existing trilingual `copyFor()`/`useTranslation()` patterns and support RTL.
