# 🌱 Formula Atlas — AI-Powered Agronomy Platform

> **From soil to sky, your farm's operating system.**
>
> 500 agronomic formulas · 85 interactive tools · 10 AI specialists · 20 crop profiles · GIS suite · Irrigation scheduling · Free forever

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-Installable-purple)](https://web.dev/progressive-web-apps/)

---

## 🎯 What is Formula Atlas?

Formula Atlas is a free, open-source agriculture platform built by **Abdelkader Atia**, a PhD researcher from Algeria. It bundles 500+ research-grade agronomic formulas, 85 interactive calculators, AI specialists, GIS tools, irrigation scheduling, and crop lifecycle planning into a single Progressive Web App that works offline.

**No signup required. No API keys needed. Works on any device.**

### 🌐 Live Demo

- **Landing page:** [your-domain]/
- **App dashboard:** [your-domain]/app
- **About:** [your-domain]/about

---

## 📊 Platform at a Glance

| Metric | Count |
|---|---|
| 📚 Agronomic formulas | **500** |
| 🛠️ Interactive tools | **85** |
| 🤖 AI specialist agents | **10** |
| 🌱 Crop lifecycle profiles | **20** |
| 📐 Formula categories (parts) | **44** |
| 📖 Chapters | **120** |
| 🗺️ GIS tools | **4** (Coordinate, Boundary, Distance, Elevation) |
| 💧 Irrigation tools | **5** (ET Tracker, Scheduler, System Designer, Program Gen, Seasonal) |
| 🧪 Test assertions | **164** (4 test suites) |
| 🌍 Languages | English (FR/AR planned) |
| 💰 Cost | **Free forever** |

---

## ✨ Key Features

### 🗺️ GIS Suite (GeoAPIHub-inspired)
- **Coordinate Converter** — DMS ↔ Decimal ↔ UTM (WGS84) + batch CSV
- **Field Boundary Importer** — GeoJSON / KML / WKT / CSV import + export + area/perimeter/centroid + SVG preview
- **Distance & Bearing Calculator** — Vincenty geodesic (mm-accuracy) + destination projection + batch CSV + field-to-field
- **Elevation & Slope Analyzer** — Open-Meteo elevation API + slope/aspect/hillshade + frost risk

### 💧 Irrigation Engine
- **ET Tracker** — FAO-56 Penman-Monteith ET₀ from Open-Meteo (free, no key) + Kc × ETc + 7-day plan
- **Irrigation Scheduler** — Controllers → Zones → Schedules → Sequences + cycle-and-soak + YAML export (Home Assistant compatible)
- **Irrigation System Designer** — Multi-zone sprinkler/drip/bubbler + pump sizing
- **Irrigation Program Generator** — Decadal schedule from BRL/COM memento
- **Seasonal Irrigation Planner** — Season-by-season focus + risks

### 🌱 Crop Lifecycle Planning
- **Fertilization Generator** — 20 crops × NPK + micros per growth stage + PDF export
- **Labor Calendar** — Phenology-driven operations + person-days/ha + peak week detection
- **Season Plan Generator** — AI-powered week-by-week crop plan
- **Crop Rotation Planner** — Multi-year + N credit + disease breaks + soil health score
- **Cover Crop Selector** — 12 species × 9 goals × drought tolerance
- **Seed Rate Calculator** — Target population × TGW × germination × field loss

### 🤖 AI Specialists (Multi-Agent Chat)
10 specialized AI agents, each with unique system prompts:
1. 🌱 **Agronomist** — General crop + soil + fertilizer diagnostics
2. 🔍 **Crop Scout** — Pest + disease ID + IPM
3. 💧 **Irrigation Engineer** — Schedules + pump sizing + ET₀
4. 🧪 **Soil Scientist** — Soil test interpretation + amendments + CEC
5. 📋 **Operations Manager** — Labor scheduling + equipment
6. 💰 **Financial Analyst** — Cost/revenue + breakeven + ROI
7. 🌿 **Sustainability Officer** — NUE + carbon + 5-pillar scorecard
8. 📝 **Grant Writer** — Finds + drafts agri grants
9. 🗺️ **GIS Analyst** — Coordinates + boundaries + distance + elevation
10. 🐄 **Livestock Vet** — Rations + herd health + grazing

### 🏠 Home Dashboard
- **Weather widget** — auto-fetches from saved location (Open-Meteo, no key)
- **ET₀ today** — big number + net irrigation need
- **Weather alert banner** — frost/heat/rain/wind warnings with actionable advice
- **Farm stats** — fields, area, irrigation zones, schedules (from localStorage)
- **Today's tasks** — aggregates from Irrigation Scheduler + Labor Calendar
- **Quick actions** — 4 one-tap buttons to most-used tools
- **Recently used tools** — horizontal scroll, persists across sessions
- **Farm profile wizard** — one-time setup: name, location, crop, planting date

### 📐 500 Formulas Across 44 Parts

| Part | Formulas | Coverage |
|---|---|---|
| Irrigation Engineering | 100 | FAO-56, hydraulics, drip, sprinkler, wells |
| Trusted-Reference Formulas | 53 | FAO-56, USDA-NRCS, ASABE, IPCC, NRC |
| Advanced Farm Economics | 22 | NPV, IRR, payback, breakeven, partial budget |
| Crop Production | 24 | Plant population, seed rate, yield components |
| Soil & Crop Science (Advanced) | 18 | Infiltration, water characteristic, porosity |
| Advanced Crop Science | 17 | Photosynthesis, translocation, harvest index |
| Advanced Animal Science | 18 | NRC nutrition, reproduction, genetics |
| Animal Production | 15 | Feed rations, pasture, manure |
| Digital Agriculture | 14 | Sensors, drones, VRA, NDVI |
| Animal Science (Specialist) | 14 | TDN, NEm/NEg, MP, RDP |
| Technology & Automation | 12 | IoT, traceability, blockchain |
| Visual Guides & Decision Tools | 11 | Decision trees, flowcharts |
| **Agricultural Meteorology** | 10 | GDD, chill hours, heat index, Hargreaves |
| **Post-Harvest Science** | 10 | EMC, safe storage, drying, cold storage |
| **Aquaculture** | 12 | Stocking, FCR, DO, ammonia, biofilter |
| Advanced Farm Economics & Policy | 14 | Subsidies, trade, risk |
| **Greenhouse Engineering** | 8 | Heating, ventilation, CO₂, thermal screen |
| **Animal Feed Science** | 8 | TDN, NEm/NEg, MP, DMI, MUN, NDFD |
| **Bioenergy** | 8 | Biogas yield, digester sizing, EROI |
| **Agroforestry** | 8 | Light competition, windbreak, C sequestration |
| **Plant Breeding** | 8 | Heritability, selection response, heterosis |
| **Water Harvesting** | 6 | Rooftop, cistern, micro-catchment |
| **Composting** | 6 | C:N mixer, moisture, maturity |
| **Precision Agriculture** | 6 | VRA, NDVI classifier, yield monitor |
| **Advanced Soil Physics** | 6 | Kostiakov, Horton, van Genuchten |
| **Weed Science** | 6 | Herbicide rate, tank mix, resistance |
| **Plant Pathology** | 6 | Blitecast, TOMCAST, Mills, FHB |
| **Livestock Housing** | 6 | Ventilation, space, bedding, manure |
| **Carbon Farming** | 7 | SOC stock, N₂O, CH₄, carbon credits |
| **Water Quality (Advanced)** | 5 | SAR, Langelier, DRASTIC, clogging |
| **Soil Erosion** | 5 | RUSLE, WEQ, buffer trapping |
| **Sustainability & Economics** | 5 | NUE, water productivity, carbon |
| **Organic Certification** | 5 | Transition, buffer zone, premium, OMRI |
| **Climate-Smart Agriculture** | 5 | Carbon intensity, drought resilience, WP |
| **On-Farm Research** | 5 | Replicate number, LSD, EONR, CV, PFP |
| **Advanced Beekeeping** | 5 | Varroa, queen rearing, colony model |
| **Fodder Conservation** | 5 | Hay curing, bale density, haylage, wrapping |
| **Agricultural Waste Mgmt** | 6 | Residue, composting, plastic, lagoon, bioplastic |

---

## 🛠️ All 85 Tools (by category)

### Farm → Fields & Crops (18 tools)
Multi-Field Dashboard · Coordinate Converter · Field Boundary Importer · Distance & Bearing · Elevation & Slope · Crop Rotation Planner · Season Plan Generator · Fertilization Generator · Labor Calendar · Yield Gap Analysis · Field Scouting Log · Pesticide Dose + PHI · Spray Drift Assessor · Drought Stress Index · Frost Protection · Companion Planting · Hail Damage · Pest Threshold · Seed Rate · Moon Phase Calendar · GDD Tracker

### Farm → Soil & Livestock (15 tools)
Soil Test History · Post-Harvest Storage · Compost Mixer · Cover Crop Selector · Greenhouse Designer · Grain Bin Inventory · Manure Management · Machinery Cost · Yield Monitor · Pump Efficiency · Livestock Management · Feed Ration Balancer · Silage Fermentation · Bee/Honey Yield · Water Harvesting · Biogas Digester

### Farm → Irrigation (5 tools)
Irrigation Program Generator · Irrigation System Designer · Seasonal Planner · Evapotranspiration Tracker · Irrigation Scheduler (YAML export)

### Insights → Intelligence & AI (5 tools)
NDVI Satellite Maps · Weather Radar + Frost Maps · Smart Agriculture Suite · Disease Forecast Dashboard · AI Specialists (10 agents)

### Insights → Business & Marketplace (7 tools)
Financial Dashboard · Marketplace · Sustainability Scorecard · RUSLE Erosion · Buffer Strip Designer · Pollinator Habitat Planner · Carbon Credit Estimator

### Insights → Community & Reports (3 tools)
Farmer Community · Report Generator · (About page)

### Insights → Settings (1 tool)
Service Integrations (Clerk, Neon, OneSignal, MapTiler, Gemini, Supabase)

---

## 🏗️ Technical Architecture

### Tech Stack
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript 5
- **UI:** Tailwind CSS 4 + shadcn/ui + Radix UI
- **Icons:** Lucide React
- **Charts:** Recharts
- **State:** Zustand + React hooks
- **Forms:** React Hook Form + Zod
- **AI:** z-ai-web-dev-sdk (LLM + VLM + web search)
- **Weather:** Open-Meteo (free, no key)
- **Maps:** Pure SVG (no external map library)
- **PWA:** Service Worker + Web App Manifest
- **Database:** Prisma + SQLite (local), Neon Postgres (production-ready)

### Project Structure
```
src/
├── app/
│   ├── page.tsx              # Landing page (marketing)
│   ├── app/page.tsx          # Dashboard (5 tabs, 85 tools)
│   ├── about/page.tsx        # Founder profile
│   ├── api/                  # 11 API routes
│   │   ├── agronomist-chat/  # Multi-agent AI chat
│   │   ├── season-plan/      # AI season plan generator
│   │   ├── alerts/           # Weather alerts
│   │   ├── parse-lab-report/ # Lab report OCR
│   │   └── v1/               # Public REST API
│   └── globals.css
├── components/
│   ├── agri/
│   │   ├── nutri-tools/      # 85 tool components
│   │   ├── home-dashboard.tsx
│   │   ├── weather-alert-banner.tsx
│   │   ├── farm-stats.tsx
│   │   ├── today-tasks.tsx
│   │   ├── farm-profile-wizard.tsx
│   │   ├── about-page.tsx
│   │   └── home-dashboard.tsx
│   └── ui/                   # shadcn/ui + command palette + empty-state
├── lib/                      # 49 library files
│   ├── ai-agents.ts          # 10 AI agent catalog
│   ├── crop-lifecycle.ts     # 20 crop profiles
│   ├── geodesy.ts            # Vincenty geodesic
│   ├── field-boundary.ts     # GeoJSON/KML/WKT/CSV
│   ├── elevation.ts          # Open-Meteo elevation
│   ├── open-meteo.ts         # Weather + FAO-56 ET₀
│   ├── irrigation-scheduler.ts # YAML/CSV/JSON export
│   ├── tool-registry.ts      # Command palette index
│   └── formulas-data.ts      # 500 formulas
├── data/
│   └── agri_formulas.json    # Formula database (500 entries)
└── scripts/                  # Test suites + generators
    ├── test-field-boundary.ts  # 43 assertions
    ├── test-geodesy.ts         # 42 assertions
    ├── test-open-meteo.ts      # 24 assertions
    └── test-elevation.ts       # 55 assertions
```

### Free Services Used (no API key required)
| Service | Purpose | Free Tier |
|---|---|---|
| Open-Meteo | Weather forecast + historical + elevation + ET₀ | 10,000 calls/day |
| z-ai-web-dev-sdk | AI chat (LLM + VLM) | Included |
| Service Worker | Offline PWA caching | — |

### Optional Integrations (scaffolded, key-based)
| Service | Purpose | Free Tier |
|---|---|---|
| Clerk | User authentication | 50,000 MAU |
| Neon | Serverless Postgres | 0.5 GB storage |
| OneSignal | Push notifications | Unlimited |
| MapTiler | Vector map tiles | 100K tile loads/mo |
| Google Gemini | AI vision (pest photos) | 1,500 req/day |
| Supabase | All-in-one (DB + Auth + Storage) | 500 MB DB |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (or Bun)
- npm / yarn / pnpm / bun

### Installation
```bash
git clone https://github.com/ATiaAbdelkader/FromulaAtlas.git
cd FromulaAtlas
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, or [http://localhost:3000/app](http://localhost:3000/app) for the dashboard.

### Build
```bash
npm run build
npm start
```

### Run Tests
```bash
npx tsx scripts/test-field-boundary.ts
npx tsx scripts/test-geodesy.ts
npx tsx scripts/test-open-meteo.ts
npx tsx scripts/test-elevation.ts
```

### Deploy to Vercel
1. Push to GitHub
2. Connect repo to Vercel
3. Auto-deploys on every push
4. No environment variables required (all services are free/no-key)

---

## 🧪 Test Coverage

| Suite | Assertions | Coverage |
|---|---|---|
| test-field-boundary.ts | 43 | GeoJSON/KML/WKT/CSV round-trips, area/perimeter/centroid, self-intersection |
| test-geodesy.ts | 42 | Vincenty inverse/direct, London→Paris, NYC→LA, compass, point-in-polygon |
| test-open-meteo.ts | 24 | FAO-56 ET₀ (California example), Kc interpolation, live API, WMO codes |
| test-elevation.ts | 55 | Slope classification, frost risk, live API (SF, Death Valley, Everest) |
| **Total** | **164** | All passing |

---

## 👨‍💻 About the Founder

**Abdelkader Atia** is an agricultural researcher, educator, and lifelong learner from Algeria. He is a PhD researcher focusing on animal reproduction, agribusiness, data-driven decision-making, and sustainable agricultural development in arid and semi-arid regions.

This app reflects his personal operating system — a place to organize ideas, manage projects, track progress, and continuously improve. Every feature exists because he needed it for his own work.

🔗 [About page](/about) · [GitHub](https://github.com/ATiaAbdelkader)

---

## 📄 License

MIT License — free for personal and commercial use.

---

## 🤝 Contributing

Contributions are welcome! Areas that need help:
- **Multi-language:** French + Arabic translations (next-intl installed)
- **User accounts:** Wire Clerk auth (keys scaffolded in Service Integrations)
- **Cloud sync:** Define Prisma models + connect Neon Postgres
- **More tools:** See the tool gap analysis in issues
- **More formulas:** See the formula gap analysis in issues
- **Tests:** Add Playwright E2E tests
- **Documentation:** API docs, user guide, video tutorials

---

## 🙏 Acknowledgments

- **FAO** — FAO-56 Penman-Monteith, crop coefficients, yield gap data
- **Open-Meteo** — Free weather, elevation, and ET₀ API
- **USDA-NRCS** — RUSLE, soil data, conservation standards
- **NRC** — Nutrient Requirements of Beef/Dairy Cattle (2021)
- **IPCC** — Greenhouse gas inventory guidelines
- **ASABE** — Agricultural machinery + engineering standards
- **Irrigation Unlimited** (Home Assistant) — YAML export format inspiration
- **Agency Agents** — AI agent persona inspiration
- **free-for.dev** — Free service discovery

---

## 📈 Roadmap

### Done ✅
- 500 formulas across 44 parts
- 85 interactive tools
- 10 AI specialist agents
- GIS suite (4 tools)
- Irrigation engine (5 tools)
- Crop lifecycle (6 tools)
- Landing page + dashboard
- PWA (offline-capable)
- Command palette (⌘K)
- Mobile bottom nav
- Farm profile wizard
- Weather alert banner
- Today's tasks widget
- 164 test assertions

### In Progress 🚧
- Multi-language (FR/AR)
- User accounts (Clerk)
- Cloud database (Neon)
- Push notifications (OneSignal)

### Planned 📋
- Aquaculture module
- Agroforestry planner tool
- Drone flight planner
- VRA prescription map generator
- E2E tests (Playwright)
- CI/CD pipeline (GitHub Actions)
- Sentry error tracking
- Video tutorials

---

*Built with ❤️ by Abdelkader Atia · Algeria · 2025*
