---
Task ID: 19-features-algeria-calendar
Agent: main (Super Z)
Task: Build all 19 Algeria Agriculture Calendar features

Work Log:
- Created `/home/z/my-project/src/lib/algeria-agri-calendar-data.ts` (~830 lines) with:
  - 3 agro-climatic zones (Tell / Hauts Plateaux / Sahara) with rainfall, ET₀, soils, crops
  - Wilaya → zone mapping (39 wilayas)
  - Frost-risk windows per zone (almond, apricot, vine, stonefruit)
  - 6 pest biofix entries (olive fly, locust, citrus scale, bayoud, late blight, leafminer)
  - 7 CNCA / subsidy deadlines (surface declaration, OAIC, irrigation, tractor, seed, organic, crop insurance)
  - 15 weekly souks by wilaya/commune
  - 8 market price patterns (potato, tomato, onion, citrus, olive oil, dates, wheat, almond)
  - Moon-phase algorithm (Conway approximation, 8 phases)
  - Ramadan window detection (2025–2030) + work-shift advice
  - BBCH stage shortcuts (wheat, citrus, olive, potato)
  - Tank-mix compatibility matrix
  - PHI database (15 active matters with DAR)
  - 6 equipment catalog entries + 5 worker roles
  - 4 field profiles for AI generator
  - 24-entry preventive calendar (month-by-month, per-zone)
  - 3 crop rotation plans (per zone)
- Created `/home/z/my-project/src/components/agri/algeria-agri-calendar/calendar-store.ts` (zustand store, persisted):
  - CalField, CalTask, CalTrapCatch, CalTreatment, CalLaborBooking, CalEquipmentBooking, CalReminder, CalAiPlan types
  - All CRUD + zone setter + layer toggles + offline-mode + sync tracking
- Created `/home/z/my-project/src/components/agri/algeria-agri-calendar/AlgeriaAgriCalendar.tsx` (~2150 lines):
  - Header: zone selector (3 cards) + 5 layer toggles (weather/moon/Ramadan/souk/offline) + sync indicator
  - OverviewTab: 3 alert cards (frost / pest / souk) + multi-field summary + upcoming tasks (14d)
  - MonthViewTab: 6-week grid with subsidies/souks/treatments/tasks/moon/Ramadan overlays
  - WeekViewTab: 7-day grid with weather strip + print + share button + Ramadan banner
  - RotationTab: 3-4-5-year zone-specific rotations
  - BiofixTab: active/upcoming pests + trap-catch logger
  - PricesTab: 8 crops with monthly price-band visualization (high/mid/low)
  - SubsidiesTab: this-month + next-3-months deadlines
  - LaborTab: equipment scheduler (with conflict detection) + tank-mix checker + PHI countdown + souk list
  - AiTab: AI task generator (4 field profiles, generates 3-month task list) + reminder manager + preventive calendar strip + BBCH tracker
  - All trilingual (EN/FR/AR via copyFor + language-store)
- Wired AlgeriaAgriCalendar into /app Farm tab via CollapsibleSection (storageKey="collapse_algeria_calendar")
- Fixed apostrophe issue in `M'Sila` wilaya name (use double quotes)
- Verified: TypeScript clean (no errors in my code) and `next build` succeeds

Stage Summary:
- All 19 features shipped as a single integrated calendar component
- Files created:
  - /home/z/my-project/src/lib/algeria-agri-calendar-data.ts
  - /home/z/my-project/src/components/agri/algeria-agri-calendar/calendar-store.ts
  - /home/z/my-project/src/components/agri/algeria-agri-calendar/AlgeriaAgriCalendar.tsx
- File modified: /home/z/my-project/src/app/app/page.tsx (added import + CollapsibleSection in Farm tab)
- Production build passes ✓
- All data persists locally via localStorage (`algeria-agri-calendar` key) → offline-first
