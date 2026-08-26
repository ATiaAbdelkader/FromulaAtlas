/**
 * Algeria Agricultural Calendar — source-traceable monthly operations.
 *
 * Generated from the twelve normalized INVA/Ministère de l'Agriculture
 * Calendrier des Opérations Culturales records in
 * /home/ubuntu/agriculture-calendar-sources/.
 *
 * The dataset preserves the source's `u` fertilizer notation, quintals/ha,
 * regional qualifiers, printed page references, and uncertainty boundaries.
 * Same-month overlap is an activity view, not a companion-planting claim.
 */

export type CalendarSection =
  | 'grandesCultures'
  | 'forage'
  | 'oilseeds'
  | 'vegetables'
  | 'greenhouse'
  | 'industrial'
  | 'perennials';

export type CalendarActionType =
  | 'sowing'
  | 'harvest'
  | 'irrigation'
  | 'fertilization'
  | 'soil'
  | 'weedManagement'
  | 'maintenance'
  | 'cropProtection'
  | 'observation';

export interface CalendarSource {
  file: string;
  printedPages: string;
  pdfLength: string;
}

export interface AlgeriaCalendarEntry {
  id: string;
  month: number;
  cropKeys: string[];
  cropContext: string;
  section: CalendarSection;
  operations: string[];
  actionTypes: CalendarActionType[];
  source: CalendarSource;
}

export interface AlgeriaCalendarMonth {
  number: number;
  key: string;
  name: { en: string; fr: string; ar: string };
  source: {
    file: string;
    institution: string;
    documentTitle: string;
    language: string;
    pdfLength: string;
    printedPages: string;
    extractionStatus: string;
    interpretationRule: string;
  };
  entries: AlgeriaCalendarEntry[];
  sourceNote: string[];
  regionalQualifiers: string[];
  companionNote: string[];
  uncertaintyNotes: string[];
}

export const ALGERIA_CALENDAR_MONTHS: AlgeriaCalendarMonth[] = [
  {
    "number": 1,
    "key": "01",
    "name": {
      "en": "January",
      "fr": "Janvier",
      "ar": "يناير"
    },
    "source": {
      "file": "01-janvier_fr.pdf",
      "institution": "République Algérienne Démocratique et Populaire; Ministère de l’Agriculture et du Développement Rural; Direction de la Formation, de la Recherche et de la Vulgarisation; Institut National de la Vulgarisation Agricole.",
      "documentTitle": "*Calendrier des Opérations Culturales*",
      "language": "French",
      "pdfLength": "13 pages",
      "printedPages": "46–57",
      "extractionStatus": "Complete text extraction reviewed manually; crop names, operations, quantities, timing, and regional qualifiers retained from the source.",
      "interpretationRule": "`u` means the source’s fertilizer unit notation and is intentionally not converted into kg. `q/ha` means quintals per hectare. Where the source refers to a phytosanitary calendar or leaflet, the January document does not provide the active ingredient or dose; the future tool must show a source-linked reference rather than inventing a treatment."
    },
    "entries": [
      {
        "id": "m01-001-winter-cereals-durum-wheat-and-bread-wheat",
        "month": 1,
        "cropKeys": [
          "wheat"
        ],
        "cropContext": "Winter cereals — durum wheat and bread wheat",
        "section": "grandesCultures",
        "operations": [
          "Early chemical weed control.",
          "Nitrogen application in favorable zones receiving approximately 400–600 mm: 2 q/ha of 46% urea, split as one-third at sowing and two-thirds from tillering to stem elongation.",
          "Nitrogen application in moderately favorable zones receiving approximately 300–400 mm: 1 q/ha of 46% urea at tillering.",
          "Under supplementary irrigation: 3 q/ha of 46% urea, split as one-third at sowing and two-thirds from tillering to stem elongation.",
          "If winter is dry: apply 20 mm of water at emergence, tillering, and full tillering.",
          "Phytosanitary treatment: refer to the phytosanitary calendar in the annex."
        ],
        "actionTypes": [
          "weedManagement",
          "sowing",
          "fertilization",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 46; PDF page 1.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-002-winter-cereals-barley-oats-and-triticale",
        "month": 1,
        "cropKeys": [
          "barley",
          "oats",
          "triticale"
        ],
        "cropContext": "Winter cereals — barley, oats, and triticale",
        "section": "grandesCultures",
        "operations": [
          "Early chemical weed control.",
          "Apply 1 q/ha of 46% urea at tillering.",
          "Phytosanitary treatment: refer to the phytosanitary calendar in the annex."
        ],
        "actionTypes": [
          "weedManagement",
          "fertilization",
          "cropProtection"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 46; PDF page 1.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-003-food-legumes-lentils-and-fava-bean",
        "month": 1,
        "cropKeys": [
          "lentil",
          "fava-bean"
        ],
        "cropContext": "Food legumes — lentils and fava bean",
        "section": "grandesCultures",
        "operations": [
          "Finish sowing."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 46; PDF page 1.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-004-food-legumes-chickpea",
        "month": 1,
        "cropKeys": [
          "chickpea"
        ],
        "cropContext": "Food legumes — chickpea",
        "section": "grandesCultures",
        "operations": [
          "Sow."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 46; PDF page 2.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-005-bersim",
        "month": 1,
        "cropKeys": [
          "bersim"
        ],
        "cropContext": "Bersim",
        "section": "forage",
        "operations": [
          "Irrigated production: second cut followed by irrigation.",
          "Rainfed production: first cut."
        ],
        "actionTypes": [
          "irrigation"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 46; PDF page 2.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-006-alfalfa",
        "month": 1,
        "cropKeys": [
          "alfalfa"
        ],
        "cropContext": "Alfalfa",
        "section": "forage",
        "operations": [
          "Maintenance fertilization for the second, third, and fourth years after establishment."
        ],
        "actionTypes": [
          "fertilization",
          "maintenance"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 46; PDF page 2.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-007-italian-ryegrass",
        "month": 1,
        "cropKeys": [
          "italian-ryegrass"
        ],
        "cropContext": "Italian ryegrass",
        "section": "forage",
        "operations": [
          "First rainfed cut at the end of the month, at the stem-elongation stage.",
          "Apply 30 u/ha of nitrogen."
        ],
        "actionTypes": [
          "fertilization"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 46; PDF page 2.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-008-safflower",
        "month": 1,
        "cropKeys": [
          "safflower"
        ],
        "cropContext": "Safflower",
        "section": "oilseeds",
        "operations": [
          "Sow at 15 kg/ha.",
          "Roll the seedbed.",
          "Apply 30 u/ha of nitrogen at sowing."
        ],
        "actionTypes": [
          "sowing",
          "fertilization"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 47; PDF page 2.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-009-sunflower",
        "month": 1,
        "cropKeys": [
          "sunflower"
        ],
        "cropContext": "Sunflower",
        "section": "oilseeds",
        "operations": [
          "Prepare the seedbed."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 47; PDF page 2.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-010-rapeseed",
        "month": 1,
        "cropKeys": [
          "rapeseed"
        ],
        "cropContext": "Rapeseed",
        "section": "oilseeds",
        "operations": [
          "Mechanical hoeing if a new infestation of dicotyledonous weeds appears."
        ],
        "actionTypes": [
          "weedManagement"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 47; PDF page 2.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-011-potato",
        "month": 1,
        "cropKeys": [
          "potato"
        ],
        "cropContext": "Potato",
        "section": "vegetables",
        "operations": [
          "Late-season potato: harvest.",
          "Early potato: irrigation; phytosanitary treatments by reference to the annexed phytosanitary calendar.",
          "Main-season potato: soil preparation; planting at 25–27 q/ha; pre-sprouting for 4–6 weeks; hoeing and earthing-up; organic manure at 25–30 t/ha from cattle or sheep; mineral fertilizer at 80–100 u N/ha, 100–120 u P/ha, and 200–240 u K/ha; phytosanitary treatments by reference to the annexed calendar; chemical weed control."
        ],
        "actionTypes": [
          "harvest",
          "irrigation",
          "cropProtection",
          "sowing",
          "fertilization",
          "soil",
          "weedManagement"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 48; PDF page 3.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-012-market-garden-tomato",
        "month": 1,
        "cropKeys": [
          "market-tomato"
        ],
        "cropContext": "Market-garden tomato",
        "section": "vegetables",
        "operations": [
          "Late-season production: finish harvest and clean the plot."
        ],
        "actionTypes": [
          "harvest",
          "weedManagement"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 48; PDF page 3.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-013-green-bean-early-production",
        "month": 1,
        "cropKeys": [
          "bean"
        ],
        "cropContext": "Green bean — early production",
        "section": "vegetables",
        "operations": [
          "Soil preparation.",
          "Base dressing: 15 t/ha of decomposed manure.",
          "Mineral fertilizer: 50–80 u N/ha, 80–100 u P/ha, and 100–150 u K/ha.",
          "Direct sowing.",
          "Soil disinfection after analysis.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "sowing",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 49; PDF page 4.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-014-onion",
        "month": 1,
        "cropKeys": [
          "onion"
        ],
        "cropContext": "Onion",
        "section": "vegetables",
        "operations": [
          "Disc harrowing and leveling during the first half of January.",
          "Fertilizer application: 60 u N, 130 u P, and 130 u K per hectare.",
          "Furrow marking.",
          "Planting during the second half of January."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "sowing"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 49; PDF page 4.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-015-garlic",
        "month": 1,
        "cropKeys": [
          "garlic"
        ],
        "cropContext": "Garlic",
        "section": "vegetables",
        "operations": [
          "Planting: 8–10 q/ha of cloves, corresponding to approximately 150,000–200,000 plants/ha.",
          "Irrigation.",
          "Phytosanitary treatments: refer to the garlic leaflet.",
          "Crop maintenance: hoeing, earthing-up, and weed control."
        ],
        "actionTypes": [
          "sowing",
          "irrigation",
          "cropProtection",
          "weedManagement",
          "maintenance"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 49; PDF page 4.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-016-cabbage-and-cauliflower",
        "month": 1,
        "cropKeys": [
          "cabbage",
          "cauliflower"
        ],
        "cropContext": "Cabbage and cauliflower",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Clean the soil/plot after the crop."
        ],
        "actionTypes": [
          "harvest",
          "soil"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 49; PDF page 4.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-017-carrot-and-turnip",
        "month": 1,
        "cropKeys": [
          "carrot",
          "turnip"
        ],
        "cropContext": "Carrot and turnip",
        "section": "vegetables",
        "operations": [
          "Direct-sowing planting: 1,200,000–1,600,000 plants/ha; precision sowing: 2,000,000–2,400,000 plants/ha.",
          "Soil preparation.",
          "Harvest."
        ],
        "actionTypes": [
          "sowing",
          "soil",
          "harvest"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 50; PDF page 5.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-018-fennel",
        "month": 1,
        "cropKeys": [
          "fennel"
        ],
        "cropContext": "Fennel",
        "section": "vegetables",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 50; PDF page 5.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-019-leek",
        "month": 1,
        "cropKeys": [
          "leek"
        ],
        "cropContext": "Leek",
        "section": "vegetables",
        "operations": [
          "Soil preparation.",
          "Disc harrowing.",
          "Furrow marking.",
          "Nursery maintenance, weeding, and thinning.",
          "Planting after trimming/preparing the seedlings and irrigating."
        ],
        "actionTypes": [
          "soil",
          "weedManagement",
          "maintenance",
          "sowing",
          "irrigation"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 50; PDF page 5.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-020-celery",
        "month": 1,
        "cropKeys": [
          "celery"
        ],
        "cropContext": "Celery",
        "section": "vegetables",
        "operations": [
          "Soil preparation: plowing and base fertilizer with 30 t manure/ha.",
          "Bed formation/ridging.",
          "Nursery maintenance, weeding, and thinning.",
          "Planting and manual watering."
        ],
        "actionTypes": [
          "fertilization",
          "soil",
          "weedManagement",
          "maintenance",
          "sowing",
          "irrigation"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 50; PDF page 5.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-021-cardoon",
        "month": 1,
        "cropKeys": [
          "cardoon"
        ],
        "cropContext": "Cardoon",
        "section": "vegetables",
        "operations": [
          "Sowing and rolling/firming: 7–8 kg/ha.",
          "Thinning.",
          "Hoeing and hand weeding.",
          "Irrigation and phytosanitary treatments if necessary.",
          "Begin blanching during the second half of January."
        ],
        "actionTypes": [
          "sowing",
          "weedManagement",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 50; PDF page 5.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-022-endive-chicory-winter-production",
        "month": 1,
        "cropKeys": [
          "endive"
        ],
        "cropContext": "Endive chicory — winter production",
        "section": "vegetables",
        "operations": [
          "Blanching.",
          "Irrigation as needed.",
          "Phytosanitary treatments if necessary.",
          "Harvest."
        ],
        "actionTypes": [
          "weedManagement",
          "irrigation",
          "cropProtection",
          "harvest"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 51; PDF page 6.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-023-artichoke",
        "month": 1,
        "cropKeys": [
          "artichoke"
        ],
        "cropContext": "Artichoke",
        "section": "vegetables",
        "operations": [
          "Harvest in the second year of the crop.",
          "Maintenance fertilization: 200 u N/ha in four applications from October, November, December, and January to February as written in the source.",
          "Irrigation.",
          "Phytosanitary treatment if necessary.",
          "Weed control."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection",
          "weedManagement"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 51; PDF page 6.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-024-pea",
        "month": 1,
        "cropKeys": [
          "pea"
        ],
        "cropContext": "Pea",
        "section": "vegetables",
        "operations": [
          "Planting at 80 kg/ha.",
          "Harvest.",
          "Irrigation.",
          "Maintenance fertilization.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "sowing",
          "harvest",
          "irrigation",
          "fertilization",
          "maintenance",
          "cropProtection"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 51; PDF page 6.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-025-fava-bean",
        "month": 1,
        "cropKeys": [
          "fava-bean"
        ],
        "cropContext": "Fava bean",
        "section": "vegetables",
        "operations": [
          "Direct sowing at 80,000–120,000 plants/ha.",
          "Phytosanitary treatments if necessary.",
          "Hoeing and earthing-up.",
          "Weed control.",
          "Harvest."
        ],
        "actionTypes": [
          "sowing",
          "cropProtection",
          "weedManagement",
          "harvest"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 51; PDF page 6.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-026-strawberry-open-field-in-season-production",
        "month": 1,
        "cropKeys": [
          "strawberry"
        ],
        "cropContext": "Strawberry — open field, in-season production",
        "section": "vegetables",
        "operations": [
          "Irrigation.",
          "Phytosanitary treatments if necessary.",
          "Maintenance fertilization: 100 u N/ha and 100 u K/ha.",
          "Crop maintenance: weed control."
        ],
        "actionTypes": [
          "irrigation",
          "cropProtection",
          "fertilization",
          "maintenance",
          "weedManagement"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 52; PDF page 7.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-027-greenhouse-tomato-biskra",
        "month": 1,
        "cropKeys": [
          "greenhouse-tomato"
        ],
        "cropContext": "Greenhouse tomato — Biskra",
        "section": "greenhouse",
        "operations": [
          "Harvest.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "harvest",
          "cropProtection"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 52; PDF page 7.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-028-greenhouse-tomato-other-regions",
        "month": 1,
        "cropKeys": [
          "greenhouse-tomato"
        ],
        "cropContext": "Greenhouse tomato — other regions",
        "section": "greenhouse",
        "operations": [
          "Planting.",
          "Crop maintenance: trellising, removal of side shoots, and leaf removal.",
          "Irrigation.",
          "Maintenance fertilization: the source states a first and second application of 60 u N and 50 u K, followed by a third and fifth application of 20 u N and 60 u K. The apparent numbering anomaly must be preserved and flagged for source verification rather than silently corrected."
        ],
        "actionTypes": [
          "sowing",
          "maintenance",
          "irrigation",
          "fertilization"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed pages 52–53; PDF pages 7–8.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-029-greenhouse-pepper-and-bell-pepper-biskra",
        "month": 1,
        "cropKeys": [
          "pepper"
        ],
        "cropContext": "Greenhouse pepper and bell pepper — Biskra",
        "section": "greenhouse",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 52; PDF page 7.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-030-greenhouse-pepper-and-bell-pepper-other-regions",
        "month": 1,
        "cropKeys": [
          "pepper"
        ],
        "cropContext": "Greenhouse pepper and bell pepper — other regions",
        "section": "greenhouse",
        "operations": [
          "Planting.",
          "Maintenance fertilization in four applications:",
          "First application before flowering: 40 u N and 30 u K.",
          "Second application at fruit set: 40 u N and 60 u K.",
          "Third application at fruit development: 30 u N and 60 u K.",
          "Fourth application after the first harvest: 20 u N and 60 u K.",
          "Irrigation.",
          "Phytosanitary treatments if necessary.",
          "Crop maintenance: mulching, staking, hoeing, and earthing-up where there is no mulch."
        ],
        "actionTypes": [
          "sowing",
          "fertilization",
          "maintenance",
          "harvest",
          "irrigation",
          "cropProtection",
          "weedManagement"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed pages 52–53; PDF pages 7–8.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-031-climbing-bean",
        "month": 1,
        "cropKeys": [
          "climbing-bean"
        ],
        "cropContext": "Climbing bean",
        "section": "greenhouse",
        "operations": [
          "Irrigation.",
          "Transplanting.",
          "Hoeing and earthing-up.",
          "Trellising."
        ],
        "actionTypes": [
          "irrigation",
          "sowing",
          "weedManagement",
          "maintenance"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 53; PDF page 8.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-032-greenhouse-strawberry",
        "month": 1,
        "cropKeys": [
          "strawberry"
        ],
        "cropContext": "Greenhouse strawberry",
        "section": "greenhouse",
        "operations": [
          "Harvest of fresh plants/fruit as written in the source.",
          "Irrigation.",
          "Maintenance fertilization: 100 u N/ha and 100 u K/ha.",
          "Phytosanitary treatments if necessary.",
          "Weed control."
        ],
        "actionTypes": [
          "harvest",
          "sowing",
          "irrigation",
          "fertilization",
          "maintenance",
          "cropProtection",
          "weedManagement"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 53; PDF page 8.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-033-cantaloupe",
        "month": 1,
        "cropKeys": [
          "cantaloupe"
        ],
        "cropContext": "Cantaloupe",
        "section": "greenhouse",
        "operations": [
          "Planting.",
          "Soil preparation with base dressing: 60 t/ha organic manure; 100 u N/ha, 150 u P/ha, and 150 u K/ha mineral fertilizer.",
          "Soil treatment after analysis."
        ],
        "actionTypes": [
          "sowing",
          "fertilization",
          "soil",
          "cropProtection"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 53; PDF page 8.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-034-early-cucumber",
        "month": 1,
        "cropKeys": [
          "cucumber"
        ],
        "cropContext": "Early cucumber",
        "section": "greenhouse",
        "operations": [
          "Planting.",
          "Irrigation.",
          "Phytosanitary treatments if necessary.",
          "Soil preparation.",
          "Soil disinfection after analysis.",
          "Base dressing: 30–35 t/ha manure; 170–200 u N/ha, 100–150 u P/ha, and 200–250 u K/ha mineral fertilizer.",
          "Nursery work."
        ],
        "actionTypes": [
          "sowing",
          "irrigation",
          "cropProtection",
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed pages 53–54; PDF pages 8–9.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-035-eggplant",
        "month": 1,
        "cropKeys": [
          "eggplant"
        ],
        "cropContext": "Eggplant",
        "section": "greenhouse",
        "operations": [
          "Planting at 15,000–20,000 plants/ha.",
          "Irrigation.",
          "Maintenance fertilization.",
          "Phytosanitary treatments if necessary.",
          "Crop maintenance: earthing-up, weed control, and staking."
        ],
        "actionTypes": [
          "sowing",
          "irrigation",
          "fertilization",
          "maintenance",
          "cropProtection",
          "weedManagement"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 54; PDF page 9.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-036-early-zucchini",
        "month": 1,
        "cropKeys": [
          "zucchini"
        ],
        "cropContext": "Early zucchini",
        "section": "greenhouse",
        "operations": [
          "Harvest.",
          "Irrigation.",
          "Phytosanitary treatments if necessary.",
          "Maintenance fertilization in two applications:",
          "First application at fruit set: 30 u/ha.",
          "Second application 15 days after the first: 30 u N/ha and 20 u K/ha."
        ],
        "actionTypes": [
          "harvest",
          "irrigation",
          "cropProtection",
          "fertilization",
          "maintenance"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 54; PDF page 9.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-037-processing-tomato",
        "month": 1,
        "cropKeys": [
          "processing-tomato"
        ],
        "cropContext": "Processing tomato",
        "section": "industrial",
        "operations": [
          "Prepare the nursery and sow at 250–300 g for standard seed, 100–150 g for hybrid seed, or 80–100 seeds per linear metre."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 55; PDF page 10.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-038-olive",
        "month": 1,
        "cropKeys": [
          "olive"
        ],
        "cropContext": "Olive",
        "section": "perennials",
        "operations": [
          "Continue harvesting olives for oil.",
          "Continue annual pruning and remove pruning wood.",
          "Continue planting with watering.",
          "Phytosanitary treatments: refer to the olive phytosanitary annex/leaflet."
        ],
        "actionTypes": [
          "harvest",
          "maintenance",
          "sowing",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 56; PDF page 11.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-039-citrus",
        "month": 1,
        "cropKeys": [
          "citrus"
        ],
        "cropContext": "Citrus",
        "section": "perennials",
        "operations": [
          "Finish harvesting clementines and continue harvesting navel oranges, lemons, and pomelos.",
          "Begin harvesting common oranges and mandarins.",
          "Formative and maintenance pruning of harvested trees and wound sealing/mastic application.",
          "Winter treatments: refer to the phytosanitary annex.",
          "Collect and burn pruning wood, subject to applicable safety and environmental rules."
        ],
        "actionTypes": [
          "harvest",
          "maintenance",
          "cropProtection"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 56; PDF page 11.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-040-stone-fruits-apricot-peach-cherry-and-almond",
        "month": 1,
        "cropKeys": [
          "stone-fruits"
        ],
        "cropContext": "Stone fruits — apricot, peach, cherry, and almond",
        "section": "perennials",
        "operations": [
          "Continue winter treatments.",
          "Finish planting.",
          "Prune late varieties.",
          "Phytosanitary treatments: refer to the annexed calendar."
        ],
        "actionTypes": [
          "cropProtection",
          "sowing",
          "maintenance"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 56; PDF page 11.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-041-pome-fruits-and-related-fruit-trees-apple-pear-quince-pomegranate-and-loquat",
        "month": 1,
        "cropKeys": [
          "pome-fruits"
        ],
        "cropContext": "Pome fruits and related fruit trees — apple, pear, quince, pomegranate, and loquat",
        "section": "perennials",
        "operations": [
          "Continue new plantings.",
          "Continue annual fruiting pruning.",
          "Remove soil from around the base of hedge-trained plantations as written in the source.",
          "Winter treatments: refer to the phytosanitary calendar."
        ],
        "actionTypes": [
          "sowing",
          "maintenance",
          "soil",
          "cropProtection"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed pages 56–57; PDF pages 11–12.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-042-grapevine-established-vineyard",
        "month": 1,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — established vineyard",
        "section": "perennials",
        "operations": [
          "Chemical weed control on vines older than four years.",
          "Remove soil from around the vine base.",
          "Continue pruning.",
          "Collect pruning canes.",
          "Repair trellising.",
          "Winter treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "weedManagement",
          "soil",
          "maintenance",
          "cropProtection"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 57; PDF page 12.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m01-043-grapevine-new-vineyard",
        "month": 1,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — new vineyard",
        "section": "perennials",
        "operations": [
          "Planting.",
          "Irrigation at 10 litres per plant.",
          "Staking and earthing-up.",
          "Continue receiving the plants.",
          "Continue temporary heeling-in/storage of plants before planting.",
          "Prepare planting holes.",
          "The source notes that the vine is in full dormancy, making January especially suitable for cultural operations."
        ],
        "actionTypes": [
          "sowing",
          "irrigation",
          "weedManagement",
          "maintenance"
        ],
        "source": {
          "file": "01-janvier_fr.pdf",
          "printedPages": "printed page 57; PDF pages 12–13.",
          "pdfLength": "13 pages"
        }
      }
    ],
    "sourceNote": [
      "Prepare the nursery and sow at 250–300 g for standard seed, 100–150 g for hybrid seed, or 80–100 seeds per linear metre.",
      "Source location: printed page 55; PDF page 10."
    ],
    "regionalQualifiers": [
      "The January source can be represented using the following action types without changing the source meaning:",
      "| Action type | Examples found in January source |",
      "|---|---|",
      "| Sowing/planting | chickpea sowing; onion second-half planting; potato planting; new vineyard planting |",
      "| Nursery/seed preparation | sunflower seedbed; tomato nursery; potato pre-sprouting; cucumber nursery |",
      "| Harvest | late-season potato; cabbage; fennel; artichoke; citrus; olive; greenhouse crops |",
      "| Irrigation | wheat dry-winter 20 mm stages; potato; greenhouse crops; vine 10 L/plant |",
      "| Fertilization | urea, N-P-K, manure, maintenance fertilizer, fertilizer by crop stage |",
      "| Soil preparation | plowing, discing, leveling, ridging, furrow marking, bed formation |",
      "| Weed management | chemical weed control, mechanical hoeing, hand weeding, thinning |",
      "| Crop maintenance | earthing-up, trellising, staking, pruning, mulching, blanching |",
      "| Crop protection | refer to annexed crop-specific phytosanitary calendar or leaflet; no unsupported product recommendation should be generated from this PDF alone |",
      "| Nursery and transplanting | seedling maintenance, transplanting, seedling preparation, planting after irrigation |",
      "| Post-harvest/plot hygiene | plot cleaning, collection of pruning wood, removal of crop residues |"
    ],
    "companionNote": [
      "This January source describes monthly operations by crop and production context. It does **not** provide explicit companion-planting or intercropping compatibility rules. The future calendar may show crops that are active in the same month, but it must label that view as **“same-month activity overlap”** rather than claiming biological compatibility. True companion-planting recommendations should be added only from a separate verified source or a clearly labeled agronomic rule set."
    ],
    "uncertaintyNotes": [
      "The January calendar is a monthly operations guide. It is not, by itself, a complete irrigation calculator, soil-test interpretation, phytosanitary product registry, or companion-planting database. FormulaAtlas can combine these source-backed tasks with its existing crop lifecycle, irrigation, nutrient, INPV, field-record, and simulator tools, but the UI should show which fields came from the January calendar and which came from another source or user input."
    ]
  },
  {
    "number": 2,
    "key": "02",
    "name": {
      "en": "February",
      "fr": "Février",
      "ar": "فبراير"
    },
    "source": {
      "file": "02-fevrier_fr.pdf",
      "institution": "République Algérienne Démocratique et Populaire; Ministère de l’Agriculture et du Développement Rural; Direction de la Formation, de la Recherche et de la Vulgarisation; Institut National de la Vulgarisation Agricole.",
      "documentTitle": "*Calendrier des Opérations Culturales*",
      "language": "French",
      "pdfLength": "14 pages",
      "printedPages": "58–70",
      "extractionStatus": "Complete text extraction reviewed manually; crop names, operations, quantities, timing, production contexts, and regional qualifiers retained from the source.",
      "interpretationRule": "`u` means the source’s fertilizer-unit notation and is intentionally not converted into kg. `q/ha` means quintals per hectare. Where the source points to an annex or crop leaflet, the tool must show a source-linked reference rather than inventing an active ingredient or dose."
    },
    "entries": [
      {
        "id": "m02-001-winter-cereals-durum-wheat-bread-wheat-barley-oats-and-triticale",
        "month": 2,
        "cropKeys": [
          "wheat",
          "barley",
          "oats",
          "triticale"
        ],
        "cropContext": "Winter cereals — durum wheat, bread wheat, barley, oats, and triticale",
        "section": "grandesCultures",
        "operations": [
          "Finish cereal weed control at the 3–4 leaf stage.",
          "Phytosanitary treatment: refer to the phytosanitary calendar in the annex."
        ],
        "actionTypes": [
          "weedManagement",
          "cropProtection"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 58; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-002-spring-chickpea",
        "month": 2,
        "cropKeys": [
          "chickpea"
        ],
        "cropContext": "Spring chickpea",
        "section": "grandesCultures",
        "operations": [
          "Sowing."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 58; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-003-bersim",
        "month": 2,
        "cropKeys": [
          "bersim"
        ],
        "cropContext": "Bersim",
        "section": "forage",
        "operations": [
          "Irrigated production: third cut followed by irrigation.",
          "Rainfed production: second cut."
        ],
        "actionTypes": [
          "irrigation"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 58; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-004-alfalfa",
        "month": 2,
        "cropKeys": [
          "alfalfa"
        ],
        "cropContext": "Alfalfa",
        "section": "forage",
        "operations": [
          "Rainfed production: first cut."
        ],
        "actionTypes": [
          "observation"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 58; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-005-italian-ryegrass",
        "month": 2,
        "cropKeys": [
          "italian-ryegrass"
        ],
        "cropContext": "Italian ryegrass",
        "section": "forage",
        "operations": [
          "First or second cut.",
          "Nitrogen application."
        ],
        "actionTypes": [
          "fertilization"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 58; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-006-safflower",
        "month": 2,
        "cropKeys": [
          "safflower"
        ],
        "cropContext": "Safflower",
        "section": "oilseeds",
        "operations": [
          "If it was not applied at sowing, apply 30–50 u/ha of nitrogen."
        ],
        "actionTypes": [
          "sowing",
          "fertilization"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 58; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-007-sunflower",
        "month": 2,
        "cropKeys": [
          "sunflower"
        ],
        "cropContext": "Sunflower",
        "section": "oilseeds",
        "operations": [
          "Sowing at 8–10 kg/ha.",
          "Apply 30 u/ha nitrogen, with one-third applied at sowing as stated in the source.",
          "Chemical weed control from sowing to emergence, followed by supplementary hoeing up to the five-pair-of-leaves stage."
        ],
        "actionTypes": [
          "sowing",
          "fertilization",
          "weedManagement"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 59; PDF page 2.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-008-rapeseed",
        "month": 2,
        "cropKeys": [
          "rapeseed"
        ],
        "cropContext": "Rapeseed",
        "section": "oilseeds",
        "operations": [
          "Mechanical hoeing.",
          "Apply 60 u/ha nitrogen and 50 u/ha sulfur at stem elongation; the source identifies this operation as occurring between February and March."
        ],
        "actionTypes": [
          "weedManagement",
          "fertilization"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 59; PDF page 2.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-009-potato",
        "month": 2,
        "cropKeys": [
          "potato"
        ],
        "cropContext": "Potato",
        "section": "vegetables",
        "operations": [
          "Early potato: irrigation; phytosanitary treatments by reference to the potato annex.",
          "Main-season potato: soil preparation; base dressing of 25–30 t/ha cattle or sheep manure; mineral fertilizer at 80–100 u N/ha, 100–120 u P/ha, and 200–240 u K/ha; pre-sprouting for 2–3 weeks; planting; hoeing and earthing-up; phytosanitary treatments by reference to the annexed calendar."
        ],
        "actionTypes": [
          "irrigation",
          "cropProtection",
          "sowing",
          "fertilization",
          "soil",
          "weedManagement"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 60; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-010-fava-bean",
        "month": 2,
        "cropKeys": [
          "fava-bean"
        ],
        "cropContext": "Fava bean",
        "section": "vegetables",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 60; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-011-carrot-and-turnip",
        "month": 2,
        "cropKeys": [
          "carrot",
          "turnip"
        ],
        "cropContext": "Carrot and turnip",
        "section": "vegetables",
        "operations": [
          "Planting by direct sowing: 1,200,000–1,600,000 plants/ha.",
          "Precision sowing: 2,000,000–2,400,000 plants/ha.",
          "Soil preparation.",
          "Harvest."
        ],
        "actionTypes": [
          "sowing",
          "soil",
          "harvest"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 60; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-012-eggplant-main-season-production",
        "month": 2,
        "cropKeys": [
          "eggplant"
        ],
        "cropContext": "Eggplant — main-season production",
        "section": "vegetables",
        "operations": [
          "Soil preparation.",
          "Soil disinfection.",
          "Base dressing: 40 t/ha manure.",
          "Mineral fertilizer: 100 u N/ha, 150 u P/ha, and 200 u K/ha. The source text contains a typographical `P/h`; it is interpreted as P/ha from the surrounding notation but should remain flagged for source review.",
          "Nursery work."
        ],
        "actionTypes": [
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 60; PDF page 4.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-013-onion",
        "month": 2,
        "cropKeys": [
          "onion"
        ],
        "cropContext": "Onion",
        "section": "vegetables",
        "operations": [
          "Weed control and hoeing during the second half of February.",
          "Fertilizer application: 90 u N and 10 u K per hectare as printed. The source does not state a P rate for this February operation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "weedManagement",
          "fertilization",
          "cropProtection"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 60; PDF page 4.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-014-garlic",
        "month": 2,
        "cropKeys": [
          "garlic"
        ],
        "cropContext": "Garlic",
        "section": "vegetables",
        "operations": [
          "Planting: 8–10 q/ha cloves, approximately 150,000–200,000 plants/ha.",
          "Phytosanitary treatments: refer to the garlic leaflet in the annex.",
          "Crop maintenance: hoeing, earthing-up, and weeding.",
          "Irrigation.",
          "Harvest."
        ],
        "actionTypes": [
          "sowing",
          "cropProtection",
          "weedManagement",
          "maintenance",
          "irrigation",
          "harvest"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed pages 60–61; PDF pages 4–5.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-015-zucchini-main-season-production",
        "month": 2,
        "cropKeys": [
          "zucchini"
        ],
        "cropContext": "Zucchini — main-season production",
        "section": "vegetables",
        "operations": [
          "Soil preparation.",
          "Soil disinfection after analysis.",
          "Base dressing: 30 t/ha organic manure.",
          "Mineral fertilizer: 120 u N/ha, 60 u P/ha, and 100 u K/ha."
        ],
        "actionTypes": [
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 61; PDF pages 5–6.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-016-cantaloupe-main-season-production",
        "month": 2,
        "cropKeys": [
          "cantaloupe"
        ],
        "cropContext": "Cantaloupe — main-season production",
        "section": "vegetables",
        "operations": [
          "Soil preparation.",
          "Soil disinfection after analysis.",
          "Base dressing if necessary."
        ],
        "actionTypes": [
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 61; PDF page 6.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-017-strawberry-in-season-production",
        "month": 2,
        "cropKeys": [
          "strawberry"
        ],
        "cropContext": "Strawberry — in-season production",
        "section": "vegetables",
        "operations": [
          "Irrigation.",
          "Phytosanitary treatments.",
          "Maintenance fertilization: 100 u N/ha and 100 u K/ha.",
          "Weed control."
        ],
        "actionTypes": [
          "irrigation",
          "cropProtection",
          "fertilization",
          "maintenance",
          "weedManagement"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 61; PDF page 6.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-018-watermelon",
        "month": 2,
        "cropKeys": [
          "cantaloupe",
          "watermelon"
        ],
        "cropContext": "Watermelon",
        "section": "vegetables",
        "operations": [
          "Spread well-decomposed manure at 30 t/ha."
        ],
        "actionTypes": [
          "fertilization"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 62; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-019-cucumber-main-season-production",
        "month": 2,
        "cropKeys": [
          "cucumber"
        ],
        "cropContext": "Cucumber — main-season production",
        "section": "vegetables",
        "operations": [
          "Soil preparation.",
          "Soil disinfection.",
          "Base dressing: 30–35 t/ha manure.",
          "Mineral fertilizer: 170–200 u N/ha, 100–150 u P/ha, and 200–250 u K/ha."
        ],
        "actionTypes": [
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 62; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-020-green-bean-early-production",
        "month": 2,
        "cropKeys": [
          "bean"
        ],
        "cropContext": "Green bean — early production",
        "section": "vegetables",
        "operations": [
          "Soil preparation.",
          "Soil disinfection.",
          "Base dressing: 15 t/ha decomposed manure.",
          "Mineral fertilizer: 50–80 u N/ha, 80–100 u P/ha, and 100–150 u K/ha.",
          "Direct sowing.",
          "Maintenance fertilization.",
          "Harvest.",
          "Irrigation."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "sowing",
          "maintenance",
          "harvest",
          "irrigation"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 63; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-021-green-bean-main-season-production",
        "month": 2,
        "cropKeys": [
          "bean"
        ],
        "cropContext": "Green bean — main-season production",
        "section": "vegetables",
        "operations": [
          "Soil preparation.",
          "Soil disinfection after analysis.",
          "Base dressing: 15 t/ha decomposed manure.",
          "Mineral fertilizer: 50–80 u N/ha, 80–100 u P/ha, and 100–150 u K/ha."
        ],
        "actionTypes": [
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 63; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-022-fennel",
        "month": 2,
        "cropKeys": [
          "fennel"
        ],
        "cropContext": "Fennel",
        "section": "vegetables",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 63; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-023-leek",
        "month": 2,
        "cropKeys": [
          "leek"
        ],
        "cropContext": "Leek",
        "section": "vegetables",
        "operations": [
          "Apply compound fertilizer: 70 u N, 150 u P, and 100 u K per hectare.",
          "Hoeing.",
          "Water if necessary.",
          "Phytosanitary treatments."
        ],
        "actionTypes": [
          "fertilization",
          "weedManagement",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 63; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-024-celery",
        "month": 2,
        "cropKeys": [
          "celery"
        ],
        "cropContext": "Celery",
        "section": "vegetables",
        "operations": [
          "Apply fertilizer: 40 u N, 90 u P, and 50 u K per hectare.",
          "Watering, hoeing, and hand weeding.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "fertilization",
          "irrigation",
          "weedManagement",
          "cropProtection"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 63; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-025-cardoon",
        "month": 2,
        "cropKeys": [
          "cardoon"
        ],
        "cropContext": "Cardoon",
        "section": "vegetables",
        "operations": [
          "Sowing and rolling/firming: 7–8 kg/ha.",
          "Thinning, hoeing, and hand weeding.",
          "Blanching.",
          "Irrigation as needed.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "sowing",
          "weedManagement",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 63; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-026-endive-chicory-winter-production",
        "month": 2,
        "cropKeys": [
          "endive"
        ],
        "cropContext": "Endive chicory — winter production",
        "section": "vegetables",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 64; PDF page 9.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-027-pea",
        "month": 2,
        "cropKeys": [
          "pea"
        ],
        "cropContext": "Pea",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Irrigation.",
          "Maintenance fertilization.",
          "Phytosanitary treatments if necessary.",
          "Crop maintenance."
        ],
        "actionTypes": [
          "harvest",
          "irrigation",
          "fertilization",
          "maintenance",
          "cropProtection"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 64; PDF page 9.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-028-artichoke",
        "month": 2,
        "cropKeys": [
          "artichoke"
        ],
        "cropContext": "Artichoke",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Maintenance fertilization: 200 u N/ha in four applications spanning October, November, December, and January to February as written in the source.",
          "Irrigation.",
          "Phytosanitary treatments.",
          "Weed control."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection",
          "weedManagement"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 64; PDF page 9.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-029-greenhouse-tomato-biskra",
        "month": 2,
        "cropKeys": [
          "greenhouse-tomato"
        ],
        "cropContext": "Greenhouse tomato — Biskra",
        "section": "greenhouse",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 65; PDF page 10.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-030-greenhouse-tomato-other-regions",
        "month": 2,
        "cropKeys": [
          "greenhouse-tomato"
        ],
        "cropContext": "Greenhouse tomato — other regions",
        "section": "greenhouse",
        "operations": [
          "Irrigation.",
          "Maintenance fertilization: the first and second applications are each 60 u N and 50 u K; the source then states a third and fifth application of 20 u N and 60 u K. The apparent numbering anomaly is preserved and must be flagged for source verification.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Crop maintenance: trellising, removal of side shoots, and leaf removal."
        ],
        "actionTypes": [
          "irrigation",
          "fertilization",
          "maintenance",
          "cropProtection"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 65; PDF page 10.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-031-climbing-bean",
        "month": 2,
        "cropKeys": [
          "climbing-bean"
        ],
        "cropContext": "Climbing bean",
        "section": "greenhouse",
        "operations": [
          "Irrigation.",
          "Phytosanitary treatments if necessary.",
          "Harvest."
        ],
        "actionTypes": [
          "irrigation",
          "cropProtection",
          "harvest"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 65; PDF page 10.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-032-greenhouse-cucumber",
        "month": 2,
        "cropKeys": [
          "cucumber"
        ],
        "cropContext": "Greenhouse cucumber",
        "section": "greenhouse",
        "operations": [
          "Planting at 11,000–18,000 plants/ha.",
          "Irrigation.",
          "Maintenance fertilization in three applications:",
          "First application at flowering: 40 u N/ha.",
          "Second application three weeks after flowering: 40 u N/ha and 50 u K/ha.",
          "Third application during fruit development: 80 u N/ha and 100 u K/ha.",
          "Phytosanitary treatments if necessary.",
          "Crop maintenance."
        ],
        "actionTypes": [
          "sowing",
          "irrigation",
          "fertilization",
          "maintenance",
          "cropProtection"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 65; PDF page 10.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-033-greenhouse-strawberry",
        "month": 2,
        "cropKeys": [
          "strawberry"
        ],
        "cropContext": "Greenhouse strawberry",
        "section": "greenhouse",
        "operations": [
          "Harvest of fresh plants/fruit as written in the source.",
          "Irrigation.",
          "Maintenance fertilization: 100 u N/ha and 100 u K/ha.",
          "Phytosanitary treatments if necessary.",
          "Weed control."
        ],
        "actionTypes": [
          "harvest",
          "sowing",
          "irrigation",
          "fertilization",
          "maintenance",
          "cropProtection",
          "weedManagement"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 66; PDF page 11.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-034-greenhouse-cantaloupe-biskra",
        "month": 2,
        "cropKeys": [
          "cantaloupe"
        ],
        "cropContext": "Greenhouse cantaloupe — Biskra",
        "section": "greenhouse",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 66; PDF page 11.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-035-greenhouse-cantaloupe-other-regions",
        "month": 2,
        "cropKeys": [
          "cantaloupe"
        ],
        "cropContext": "Greenhouse cantaloupe — other regions",
        "section": "greenhouse",
        "operations": [
          "Planting.",
          "Irrigation.",
          "Maintenance fertilization in two applications: 134 u N/ha and 100 u K/ha, as written in the source. The source presentation does not clearly assign each quantity to a separate application, so the future data model should preserve the pair as a two-application schedule with an uncertainty note until the original layout is verified.",
          "Crop maintenance, including pruning/training (`taille`)."
        ],
        "actionTypes": [
          "sowing",
          "irrigation",
          "fertilization",
          "maintenance"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 66; PDF page 11.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-036-greenhouse-eggplant",
        "month": 2,
        "cropKeys": [
          "eggplant"
        ],
        "cropContext": "Greenhouse eggplant",
        "section": "greenhouse",
        "operations": [
          "The source begins the maintenance-fertilization schedule with three applications:",
          "First application: 40 u N/ha.",
          "Second application: 40 u N/ha.",
          "Third application during fruit enlargement: 40 u N/ha and 100 u K/ha.",
          "Irrigation.",
          "Phytosanitary treatments if necessary.",
          "Crop maintenance: earthing-up, weed control, and staking."
        ],
        "actionTypes": [
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection",
          "weedManagement"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed pages 66; PDF page 11.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-037-greenhouse-pepper-and-bell-pepper",
        "month": 2,
        "cropKeys": [
          "pepper"
        ],
        "cropContext": "Greenhouse pepper and bell pepper",
        "section": "greenhouse",
        "operations": [
          "Harvest.",
          "Maintenance fertilization in four applications:",
          "First application before flowering: 40 u N and 30 u K.",
          "Second application at fruit set: 40 u N and 60 u K.",
          "Third application at fruit development: 30 u N and 60 u K.",
          "Fourth application after the first harvest: 20 u N and 60 u K.",
          "Irrigation.",
          "Phytosanitary treatments if necessary.",
          "Crop maintenance: mulching, staking, hoeing, and earthing-up in non-mulched production."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection",
          "weedManagement"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 66; PDF page 12.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-038-greenhouse-zucchini",
        "month": 2,
        "cropKeys": [
          "zucchini"
        ],
        "cropContext": "Greenhouse zucchini",
        "section": "greenhouse",
        "operations": [
          "Harvest.",
          "Irrigation.",
          "Phytosanitary treatments if necessary.",
          "Maintenance fertilization in two applications:",
          "First application at fruit set: 30 u/ha as printed.",
          "Second application 15 days after the first: 30 u N/ha and 20 u K/ha.",
          "Crop maintenance: thinning."
        ],
        "actionTypes": [
          "harvest",
          "irrigation",
          "cropProtection",
          "fertilization",
          "maintenance",
          "weedManagement"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 66; PDF page 12.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-039-processing-tomato",
        "month": 2,
        "cropKeys": [
          "processing-tomato"
        ],
        "cropContext": "Processing tomato",
        "section": "industrial",
        "operations": [
          "Prepare the nursery and sow at 250–300 g for standard seed, 100–150 g for hybrid seed, or 80–100 seeds per linear metre.",
          "Prepare the soil before planting."
        ],
        "actionTypes": [
          "sowing",
          "soil"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 67; PDF page 13.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-040-olive",
        "month": 2,
        "cropKeys": [
          "olive"
        ],
        "cropContext": "Olive",
        "section": "perennials",
        "operations": [
          "Finish harvesting olives for oil.",
          "Continue annual pruning.",
          "Continue planting.",
          "Water at planting at 30–50 litres per plant.",
          "Disc harrowing to destroy weeds.",
          "Collect pruning wood and apply wound mastic.",
          "Maintain the localized drip-irrigation network.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "harvest",
          "maintenance",
          "sowing",
          "irrigation",
          "soil",
          "weedManagement",
          "cropProtection"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 67; PDF page 14.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-041-citrus",
        "month": 2,
        "cropKeys": [
          "citrus"
        ],
        "cropContext": "Citrus",
        "section": "perennials",
        "operations": [
          "Continue harvesting common oranges, lemons, and `orange double fine` as written in the source.",
          "Continue annual pruning; do not forget wound sealing, and collect and burn pruning wood as written in the source.",
          "Begin new planting.",
          "Begin disc harrowing and incorporation of green manure.",
          "Restore irrigation equipment, including pumps and mobile equipment.",
          "Apply the first portion of nitrogen fertilizer: 3 q/ha.",
          "Continue disc harrowing and incorporation of green manure."
        ],
        "actionTypes": [
          "harvest",
          "maintenance",
          "sowing",
          "fertilization",
          "soil",
          "irrigation"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 68; PDF page 14.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-042-stone-fruits-apricot-peach-cherry-and-almond",
        "month": 2,
        "cropKeys": [
          "stone-fruits"
        ],
        "cropContext": "Stone fruits — apricot, peach, cherry, and almond",
        "section": "perennials",
        "operations": [
          "Apply nitrogen fertilizer before flowering: 2.5 q/ha under irrigation and 1.5 q/ha under rainfed conditions.",
          "Incorporate green manure if weather permits.",
          "Finish annual pruning.",
          "Phytosanitary treatments: refer to the annexed calendar."
        ],
        "actionTypes": [
          "irrigation",
          "fertilization",
          "maintenance",
          "cropProtection"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed pages 68; PDF page 15.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-043-pome-fruits-and-related-fruit-trees-apple-pear-quince-pomegranate-and-loquat",
        "month": 2,
        "cropKeys": [
          "pome-fruits"
        ],
        "cropContext": "Pome fruits and related fruit trees — apple, pear, quince, pomegranate, and loquat",
        "section": "perennials",
        "operations": [
          "Continue and finish planting.",
          "Finish annual pruning for early varieties.",
          "Weed around the plants.",
          "Apply the first tranche of nitrogen fertilizer: 2 q/ha.",
          "Phytosanitary treatments: refer to the annexed calendar."
        ],
        "actionTypes": [
          "sowing",
          "maintenance",
          "weedManagement",
          "fertilization",
          "cropProtection"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed page 68; PDF page 15.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-044-grapevine-established-vineyard",
        "month": 2,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — established vineyard",
        "section": "perennials",
        "operations": [
          "First nitrogen-fertilizer application: 150 kg/ha for table grapes and 100 kg/ha for wine grapes.",
          "Finish pruning in rainfed vineyards and finish trellis restoration.",
          "Finish winter plowing.",
          "Continue opening the furrow around the vine bases (`décavaillonnage`).",
          "Incorporate green manure.",
          "Tie the canes.",
          "Phytosanitary treatments: refer to the annexed calendar."
        ],
        "actionTypes": [
          "fertilization",
          "maintenance",
          "soil",
          "cropProtection"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed pages 68–69; PDF pages 15–16.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m02-045-grapevine-new-vineyard",
        "month": 2,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — new vineyard",
        "section": "perennials",
        "operations": [
          "Install trellising for two-year-old vineyards.",
          "Use 2 m stakes, No. 16 wire, and a tensioner.",
          "Finish planting.",
          "Finish replacing missing plants.",
          "Cleft-graft plants whose chip/bark grafting did not succeed, as described in the source.",
          "Cleft-graft rooted plants from the previous year.",
          "Install stakes and the first wire for plantings from the previous year.",
          "Apply nitrogen fertilizer at 1.5 q/ha."
        ],
        "actionTypes": [
          "maintenance",
          "sowing",
          "fertilization"
        ],
        "source": {
          "file": "02-fevrier_fr.pdf",
          "printedPages": "printed pages 69–70; PDF pages 16–17.",
          "pdfLength": "14 pages"
        }
      }
    ],
    "sourceNote": [
      "Prepare the nursery and sow at 250–300 g for standard seed, 100–150 g for hybrid seed, or 80–100 seeds per linear metre.",
      "Prepare the soil before planting.",
      "Source location: printed page 67; PDF page 13."
    ],
    "regionalQualifiers": [
      "The source states that the beginning of vegetative awakening has occurred and that cultural operations started in January should be completed. For young plants, rebuild the planting mounds and begin cleft grafting in coastal zones.",
      "Source location: printed page 70; PDF page 17."
    ],
    "companionNote": [
      "| Action type | February examples |",
      "|---|---|",
      "| Sowing/planting | spring chickpea; sunflower; potato; garlic; greenhouse cucumber; cantaloupe; new vineyards |",
      "| Harvest | fava bean; garlic; fennel; endive; peas; artichoke; greenhouse tomato, strawberry, pepper, zucchini |",
      "| Irrigation | bersim after cutting; early potato; garlic; strawberry; greenhouse crops; olive planting |",
      "| Fertilization | urea, N-P-K, nitrogen/sulfur, manure, maintenance fertilizer, grapevine rates |",
      "| Soil preparation | potato, eggplant, zucchini, cantaloupe, cucumber, beans, processing tomato |",
      "| Weed management | cereal weed control; sunflower weed control; rapeseed hoeing; onion hoeing; plot and orchard weed control |",
      "| Crop maintenance | earthing-up, pruning, trellising, staking, thinning, blanching, tying grape canes |",
      "| Crop protection | annex or crop-leaflet references; no unsupported product recommendation from this PDF alone |",
      "| Nursery/transplanting | eggplant nursery; greenhouse cucumber planting; industrial tomato nursery; plant replacement and grafting |",
      "| Irrigation-system maintenance | olive localized drip network; citrus pump and mobile-equipment restoration |",
      "| Green-manure management | citrus and stone-fruit green-manure incorporation |",
      "| Post-harvest/plot hygiene | pruning-wood collection, wound mastic, and source-described burning of pruning wood |"
    ],
    "uncertaintyNotes": [
      "The February source describes monthly operations by crop and production context but does not provide explicit companion-planting or intercropping compatibility rules. The future calendar may show that two crops have activity in the same month, but this must be labeled as **same-month activity overlap**, not biological compatibility. Verified companion planting should come only from a separate source or a clearly labeled agronomic rule set."
    ]
  },
  {
    "number": 3,
    "key": "03",
    "name": {
      "en": "March",
      "fr": "Mars",
      "ar": "مارس"
    },
    "source": {
      "file": "03-mars_fr.pdf",
      "institution": "République Algérienne Démocratique et Populaire; Ministère de l’Agriculture et du Développement Rural; Direction de la Formation, de la Recherche et de la Vulgarisation; Institut National de la Vulgarisation Agricole.",
      "documentTitle": "*Calendrier des Opérations Culturales*",
      "language": "French",
      "pdfLength": "14 pages",
      "printedPages": "71–83",
      "extractionStatus": "Complete text extraction reviewed manually; crop names, production contexts, operations, quantities, growth stages, and source notes retained.",
      "interpretationRule": "`u` means the source’s fertilizer-unit notation and is intentionally not converted into kg. `q/ha` means quintals per hectare. Where the source points to an annex or crop leaflet, the future tool must show that source reference rather than inventing a product, active ingredient, or dose."
    },
    "entries": [
      {
        "id": "m03-001-winter-cereals-durum-wheat-bread-wheat-barley-oats-and-triticale",
        "month": 3,
        "cropKeys": [
          "wheat",
          "barley",
          "oats",
          "triticale"
        ],
        "cropContext": "Winter cereals — durum wheat, bread wheat, barley, oats, and triticale",
        "section": "grandesCultures",
        "operations": [
          "Finish the nitrogen-fertilization program with the final application.",
          "Phytosanitary treatment: refer to the phytosanitary calendar in the annex."
        ],
        "actionTypes": [
          "fertilization",
          "cropProtection"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 71; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-002-durum-wheat-and-bread-wheat-drought-condition",
        "month": 3,
        "cropKeys": [
          "wheat"
        ],
        "cropContext": "Durum wheat and bread wheat — drought condition",
        "section": "grandesCultures",
        "operations": [
          "Irrigate in case of drought, with an application at the stem-elongation stage."
        ],
        "actionTypes": [
          "irrigation"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 71; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-003-spring-chickpea",
        "month": 3,
        "cropKeys": [
          "chickpea"
        ],
        "cropContext": "Spring chickpea",
        "section": "grandesCultures",
        "operations": [
          "Finish sowing."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 71; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-004-lentil-fava-bean-and-dry-pea",
        "month": 3,
        "cropKeys": [
          "lentil",
          "fava-bean",
          "pea"
        ],
        "cropContext": "Lentil, fava bean, and dry pea",
        "section": "grandesCultures",
        "operations": [
          "Hoeing."
        ],
        "actionTypes": [
          "weedManagement"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 71; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-005-bersim",
        "month": 3,
        "cropKeys": [
          "bersim"
        ],
        "cropContext": "Bersim",
        "section": "forage",
        "operations": [
          "Irrigated production: fourth cut followed by irrigation.",
          "Rainfed production: third cut."
        ],
        "actionTypes": [
          "irrigation"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 71; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-006-alfalfa",
        "month": 3,
        "cropKeys": [
          "alfalfa"
        ],
        "cropContext": "Alfalfa",
        "section": "forage",
        "operations": [
          "Irrigated production: spring sowing followed by irrigation; first cut if the stand is in its second establishment year.",
          "Rainfed production: first or second cut."
        ],
        "actionTypes": [
          "sowing",
          "irrigation"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed pages 71–72; PDF pages 1–2.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-007-fodder-maize",
        "month": 3,
        "cropKeys": [
          "fodder-maize"
        ],
        "cropContext": "Fodder maize",
        "section": "forage",
        "operations": [
          "Sowing at 15–20 kg/ha, followed by rolling in dry conditions.",
          "Apply 40 u/ha nitrogen at sowing."
        ],
        "actionTypes": [
          "sowing",
          "weedManagement",
          "fertilization"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 72; PDF page 2.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-008-italian-ryegrass",
        "month": 3,
        "cropKeys": [
          "italian-ryegrass"
        ],
        "cropContext": "Italian ryegrass",
        "section": "forage",
        "operations": [
          "Second or third cut.",
          "Nitrogen application."
        ],
        "actionTypes": [
          "fertilization"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 72; PDF page 2.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-009-vetchoat-peaoat-and-peatriticale-mixtures",
        "month": 3,
        "cropKeys": [
          "oats",
          "triticale",
          "forage-mixture"
        ],
        "cropContext": "Vetch–oat, pea–oat, and pea–triticale mixtures",
        "section": "forage",
        "operations": [
          "Harvest for silage: at the beginning of ear emergence for the grass component and at full flowering for the legume component."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 72; PDF page 2.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-010-sunflower",
        "month": 3,
        "cropKeys": [
          "sunflower"
        ],
        "cropContext": "Sunflower",
        "section": "oilseeds",
        "operations": [
          "Finish sowing.",
          "Apply the second nitrogen fraction: two-thirds of the dose, stated as 60 u/ha.",
          "Chemical weed control from sowing to emergence, followed by supplementary hoeing up to the five-pair-of-leaves stage."
        ],
        "actionTypes": [
          "sowing",
          "fertilization",
          "weedManagement"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 72; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-011-rapeseed",
        "month": 3,
        "cropKeys": [
          "rapeseed"
        ],
        "cropContext": "Rapeseed",
        "section": "oilseeds",
        "operations": [
          "Apply 60 u/ha nitrogen and 50 u/ha sulfur at stem elongation."
        ],
        "actionTypes": [
          "fertilization"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 72; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-012-safflower-and-rapeseed",
        "month": 3,
        "cropKeys": [
          "safflower",
          "rapeseed"
        ],
        "cropContext": "Safflower and rapeseed",
        "section": "oilseeds",
        "operations": [
          "Mechanical hoeing if a new weed infestation occurs."
        ],
        "actionTypes": [
          "weedManagement"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 72; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-013-potato",
        "month": 3,
        "cropKeys": [
          "potato"
        ],
        "cropContext": "Potato",
        "section": "vegetables",
        "operations": [
          "Early potato: harvest and field clean-up.",
          "Main-season potato: pre-sprouting for 2–3 weeks; soil preparation; base dressing of 25–30 t/ha cattle or sheep manure; mineral fertilizer at 80–100 u N/ha, 100–120 u P/ha, and 200–240 u K/ha; planting at 25–27 q/ha; hoeing and earthing-up; phytosanitary treatment by reference to the annexed calendar."
        ],
        "actionTypes": [
          "harvest",
          "sowing",
          "fertilization",
          "soil",
          "weedManagement",
          "cropProtection"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 72; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-014-market-tomato-main-season-production",
        "month": 3,
        "cropKeys": [
          "market-tomato"
        ],
        "cropContext": "Market tomato — main-season production",
        "section": "vegetables",
        "operations": [
          "Nursery work and soil preparation.",
          "Soil disinfection after analysis.",
          "Base dressing: 30–40 t/ha manure.",
          "Mineral fertilizer: 180 u N/ha, 70 u P/ha, and 200–250 u K/ha."
        ],
        "actionTypes": [
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 73; PDF page 4.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-015-pepper-and-bell-pepper-main-season-production",
        "month": 3,
        "cropKeys": [
          "pepper"
        ],
        "cropContext": "Pepper and bell pepper — main-season production",
        "section": "vegetables",
        "operations": [
          "Nursery work and soil preparation.",
          "Soil disinfection after analysis.",
          "Base dressing: 30–35 t/ha manure.",
          "Mineral fertilizer: 180–200 u N/ha, 80–100 u P/ha, and 200–250 u K/ha."
        ],
        "actionTypes": [
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 73; PDF page 4.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-016-eggplant-main-season-production",
        "month": 3,
        "cropKeys": [
          "eggplant"
        ],
        "cropContext": "Eggplant — main-season production",
        "section": "vegetables",
        "operations": [
          "Soil preparation.",
          "Soil disinfection.",
          "Base dressing: 40 t/ha manure.",
          "Mineral fertilizer: 100 u N/ha, 150 u P/ha, and 200 u K/ha.",
          "Nursery work."
        ],
        "actionTypes": [
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed pages 73–74; PDF pages 4–5.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-017-cardoon",
        "month": 3,
        "cropKeys": [
          "cardoon"
        ],
        "cropContext": "Cardoon",
        "section": "vegetables",
        "operations": [
          "Up to the first half of March: sowing and rolling/firming.",
          "Thinning until mid-March.",
          "Blanching.",
          "Hoeing and hand weeding.",
          "Irrigation and phytosanitary treatment if necessary.",
          "Harvest."
        ],
        "actionTypes": [
          "sowing",
          "weedManagement",
          "irrigation",
          "cropProtection",
          "harvest"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 74; PDF page 5.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-018-onion",
        "month": 3,
        "cropKeys": [
          "onion"
        ],
        "cropContext": "Onion",
        "section": "vegetables",
        "operations": [
          "Harvest as green onion."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 74; PDF page 5.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-019-garlic",
        "month": 3,
        "cropKeys": [
          "garlic"
        ],
        "cropContext": "Garlic",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Planting: 8–10 q/ha cloves, approximately 150,000–200,000 plants/ha.",
          "Phytosanitary treatments: refer to the garlic leaflet in the annex.",
          "Crop maintenance: hoeing, earthing-up, and weeding.",
          "Irrigation."
        ],
        "actionTypes": [
          "harvest",
          "sowing",
          "cropProtection",
          "weedManagement",
          "maintenance",
          "irrigation"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 74; PDF page 5.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-020-okra",
        "month": 3,
        "cropKeys": [
          "okra"
        ],
        "cropContext": "Okra",
        "section": "vegetables",
        "operations": [
          "Deep plowing.",
          "Base fertilization followed by disc harrowing and marking/tracing.",
          "Ridge formation for April sowing at 20–22 kg/ha."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "sowing"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 74; PDF page 5.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-021-zucchini-main-season-production",
        "month": 3,
        "cropKeys": [
          "zucchini"
        ],
        "cropContext": "Zucchini — main-season production",
        "section": "vegetables",
        "operations": [
          "Planting.",
          "Soil preparation.",
          "Soil disinfection after analysis.",
          "Base dressing: 30 t/ha organic manure.",
          "Mineral fertilizer: 120 u N/ha, 60 u P/ha, and 100 u K/ha.",
          "Phytosanitary treatments.",
          "Crop maintenance."
        ],
        "actionTypes": [
          "sowing",
          "soil",
          "fertilization",
          "cropProtection",
          "maintenance"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 74; PDF page 5.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-022-watermelon-and-melon-main-season-production",
        "month": 3,
        "cropKeys": [
          "cantaloupe",
          "watermelon"
        ],
        "cropContext": "Watermelon and melon — main-season production",
        "section": "vegetables",
        "operations": [
          "Soil preparation.",
          "Organic and mineral fertilization: 30–35 t/ha manure, 170–200 u N/ha, 100–150 u P/ha, and 200–250 u K/ha.",
          "Soil disinfection after analysis."
        ],
        "actionTypes": [
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed pages 74–75; PDF pages 5–6.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-023-cantaloupe-main-season-production",
        "month": 3,
        "cropKeys": [
          "cantaloupe"
        ],
        "cropContext": "Cantaloupe — main-season production",
        "section": "vegetables",
        "operations": [
          "Soil preparation.",
          "Soil disinfection after analysis.",
          "Base dressing: 60 t/ha manure.",
          "Mineral fertilizer: 100 u N/ha, 150 u P/ha, and 150 u K/ha.",
          "Direct-seed planting."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "sowing"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 75; PDF page 6.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-024-cucumber-main-season-production",
        "month": 3,
        "cropKeys": [
          "cucumber"
        ],
        "cropContext": "Cucumber — main-season production",
        "section": "vegetables",
        "operations": [
          "Nursery work.",
          "Planting at 11,000–18,000 plants/ha.",
          "Direct sowing.",
          "Irrigation."
        ],
        "actionTypes": [
          "sowing",
          "irrigation"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 75; PDF page 6.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-025-green-bean-early-production",
        "month": 3,
        "cropKeys": [
          "bean"
        ],
        "cropContext": "Green bean — early production",
        "section": "vegetables",
        "operations": [
          "Soil preparation.",
          "Base dressing: mineral fertilizer at 50–80 u N/ha, 80–100 u P/ha, and 100–150 u K/ha.",
          "Direct sowing.",
          "Soil disinfection after analysis.",
          "Harvest."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "sowing",
          "harvest"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed pages 75–76; PDF pages 6–7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-026-green-bean-main-season-production",
        "month": 3,
        "cropKeys": [
          "bean"
        ],
        "cropContext": "Green bean — main-season production",
        "section": "vegetables",
        "operations": [
          "Direct sowing."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 76; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-027-carrot-and-turnip",
        "month": 3,
        "cropKeys": [
          "carrot",
          "turnip"
        ],
        "cropContext": "Carrot and turnip",
        "section": "vegetables",
        "operations": [
          "Planting by direct sowing: 1,200,000–1,600,000 plants/ha.",
          "Precision sowing: 2,000,000–2,400,000 plants/ha.",
          "Harvest."
        ],
        "actionTypes": [
          "sowing",
          "harvest"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 76; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-028-leek",
        "month": 3,
        "cropKeys": [
          "leek"
        ],
        "cropContext": "Leek",
        "section": "vegetables",
        "operations": [
          "Manual weeding and hand hoeing.",
          "Phytosanitary treatments if necessary.",
          "Harvest."
        ],
        "actionTypes": [
          "weedManagement",
          "cropProtection",
          "harvest"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 76; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-029-celery",
        "month": 3,
        "cropKeys": [
          "celery"
        ],
        "cropContext": "Celery",
        "section": "vegetables",
        "operations": [
          "Earthing-up for blanching.",
          "Irrigation according to need.",
          "Harvest."
        ],
        "actionTypes": [
          "weedManagement",
          "irrigation",
          "harvest"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 76; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-030-endive-chicory-summer-production",
        "month": 3,
        "cropKeys": [
          "endive"
        ],
        "cropContext": "Endive chicory — summer production",
        "section": "vegetables",
        "operations": [
          "Summer production.",
          "Nursery sowing at 15 kg/ha.",
          "During the second half of March: plowing and base fertilizer of 40 u N, 110 u P, and 50 u K per hectare."
        ],
        "actionTypes": [
          "sowing",
          "fertilization",
          "soil"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 77; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-031-artichoke",
        "month": 3,
        "cropKeys": [
          "artichoke"
        ],
        "cropContext": "Artichoke",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Irrigation.",
          "Phytosanitary treatments if necessary.",
          "Weed control."
        ],
        "actionTypes": [
          "harvest",
          "irrigation",
          "cropProtection",
          "weedManagement"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed pages 77; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-032-pea",
        "month": 3,
        "cropKeys": [
          "pea"
        ],
        "cropContext": "Pea",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Irrigation.",
          "Maintenance fertilization.",
          "Crop maintenance.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "irrigation",
          "fertilization",
          "maintenance",
          "cropProtection"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 77; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-033-fava-bean",
        "month": 3,
        "cropKeys": [
          "fava-bean"
        ],
        "cropContext": "Fava bean",
        "section": "vegetables",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 77; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-034-fennel",
        "month": 3,
        "cropKeys": [
          "fennel"
        ],
        "cropContext": "Fennel",
        "section": "vegetables",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 77; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-035-strawberry-main-season-production",
        "month": 3,
        "cropKeys": [
          "strawberry"
        ],
        "cropContext": "Strawberry — main-season production",
        "section": "vegetables",
        "operations": [
          "Begin harvest.",
          "Irrigation.",
          "Phytosanitary treatments if necessary.",
          "Maintenance fertilization: 100 u N/ha and 100 u K/ha.",
          "Weed control."
        ],
        "actionTypes": [
          "harvest",
          "irrigation",
          "cropProtection",
          "fertilization",
          "maintenance",
          "weedManagement"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 77; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-036-greenhouse-tomato-biskra",
        "month": 3,
        "cropKeys": [
          "greenhouse-tomato"
        ],
        "cropContext": "Greenhouse tomato — Biskra",
        "section": "greenhouse",
        "operations": [
          "Harvest.",
          "Irrigation.",
          "Maintenance fertilization: first and second applications of 60 u N and 50 u K; third and fifth applications of 20 u N and 60 u K, as written in the source.",
          "Phytosanitary treatment: refer to the annexed phytosanitary calendar.",
          "Crop maintenance: trellising, removal of side shoots, and leaf removal."
        ],
        "actionTypes": [
          "harvest",
          "irrigation",
          "fertilization",
          "maintenance",
          "cropProtection"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 78; PDF pages 9–10.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-037-greenhouse-green-bean-early-production",
        "month": 3,
        "cropKeys": [
          "bean"
        ],
        "cropContext": "Greenhouse green bean — early production",
        "section": "greenhouse",
        "operations": [
          "Soil preparation.",
          "Base dressing: mineral fertilizer at 50–80 u N/ha, 80–100 u P/ha, and 100–150 u K/ha.",
          "Direct sowing.",
          "Soil disinfection after analysis.",
          "Harvest."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "sowing",
          "harvest"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 78; PDF page 10.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-038-greenhouse-cucumber",
        "month": 3,
        "cropKeys": [
          "cucumber"
        ],
        "cropContext": "Greenhouse cucumber",
        "section": "greenhouse",
        "operations": [
          "Maintenance fertilization in three applications:",
          "First application at flowering: 40 u N/ha.",
          "Second application three weeks after flowering: 40 u N/ha and 50 u K/ha.",
          "Third application during fruit development: 80 u N/ha and 100 u K/ha.",
          "Irrigation.",
          "Phytosanitary treatments if necessary.",
          "Crop maintenance.",
          "Begin harvest."
        ],
        "actionTypes": [
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection",
          "harvest"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 79; PDF page 11.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-039-greenhouse-eggplant",
        "month": 3,
        "cropKeys": [
          "eggplant"
        ],
        "cropContext": "Greenhouse eggplant",
        "section": "greenhouse",
        "operations": [
          "Begin harvest.",
          "Maintenance fertilization in three applications:",
          "First application: 40 u N/ha.",
          "Second application: 40 u N/ha.",
          "Third application during fruit enlargement: 40 u N/ha and 100 u K/ha.",
          "Irrigation.",
          "Phytosanitary treatments if necessary.",
          "Crop maintenance: earthing-up, weed control, and staking."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection",
          "weedManagement"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 79; PDF page 11.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-040-greenhouse-pepper-and-bell-pepper",
        "month": 3,
        "cropKeys": [
          "pepper"
        ],
        "cropContext": "Greenhouse pepper and bell pepper",
        "section": "greenhouse",
        "operations": [
          "Harvest.",
          "Maintenance fertilization in four applications:",
          "First application before flowering: 40 u N and 30 u K.",
          "Second application at fruit set: 40 u N and 60 u K.",
          "Third application at fruit development: 30 u N and 60 u K.",
          "Fourth application after the first harvest: 20 u N and 60 u K.",
          "Irrigation.",
          "Phytosanitary treatments if necessary.",
          "Crop maintenance: mulching, staking, hoeing, and earthing-up in non-mulched production."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection",
          "weedManagement"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 79; PDF page 11.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-041-greenhouse-zucchini",
        "month": 3,
        "cropKeys": [
          "zucchini"
        ],
        "cropContext": "Greenhouse zucchini",
        "section": "greenhouse",
        "operations": [
          "Clean the greenhouse."
        ],
        "actionTypes": [
          "observation"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 79; PDF page 11.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-042-greenhouse-strawberry",
        "month": 3,
        "cropKeys": [
          "strawberry"
        ],
        "cropContext": "Greenhouse strawberry",
        "section": "greenhouse",
        "operations": [
          "Harvest fresh plants/fruit as written in the source.",
          "Maintenance fertilization: 100 u N/ha and 100 u K/ha.",
          "Irrigation.",
          "Phytosanitary treatments if necessary.",
          "Weed control.",
          "Harvest of cold-stored plants (`plants frigo`) as written in the source."
        ],
        "actionTypes": [
          "harvest",
          "sowing",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection",
          "weedManagement"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 80; PDF page 12.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-043-greenhouse-cantaloupe-biskra",
        "month": 3,
        "cropKeys": [
          "cantaloupe"
        ],
        "cropContext": "Greenhouse cantaloupe — Biskra",
        "section": "greenhouse",
        "operations": [
          "Harvest.",
          "Irrigation.",
          "Mineral fertilization in two applications: 134 u N/ha and 100 u K/ha, as written in the source.",
          "Pruning.",
          "Crop maintenance."
        ],
        "actionTypes": [
          "harvest",
          "irrigation",
          "fertilization",
          "maintenance"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 80; PDF page 12.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-044-processing-tomato",
        "month": 3,
        "cropKeys": [
          "processing-tomato"
        ],
        "cropContext": "Processing tomato",
        "section": "industrial",
        "operations": [
          "Soil preparation before planting.",
          "Soil disinfection after analysis.",
          "Base dressing: 25–30 t/ha manure.",
          "Mineral fertilizer: 165 u N/ha, 120 u P/ha, and 150 u K/ha.",
          "Weed control before or after planting.",
          "Planting at 25,000–35,000 plants/ha."
        ],
        "actionTypes": [
          "sowing",
          "soil",
          "fertilization",
          "weedManagement"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 81; PDF page 13.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-045-olive",
        "month": 3,
        "cropKeys": [
          "olive"
        ],
        "cropContext": "Olive",
        "section": "perennials",
        "operations": [
          "Apply the first nitrogen-fertilizer tranche: 1.5 q/ha in irrigated cultivation and 1 q/ha in rainfed cultivation.",
          "Finish pruning.",
          "Mechanical or manual weed control.",
          "Provide irrigation to intensively and semi-intensively managed olive orchards: three water applications (`3 lâchées d’eau`).",
          "Collect pruning wood and apply wound mastic.",
          "Disc harrow to incorporate weeds.",
          "Crown grafting.",
          "Finish planting.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "irrigation",
          "fertilization",
          "maintenance",
          "weedManagement",
          "soil",
          "sowing",
          "cropProtection"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 82; PDF page 14.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-046-citrus",
        "month": 3,
        "cropKeys": [
          "citrus"
        ],
        "cropContext": "Citrus",
        "section": "perennials",
        "operations": [
          "Continue harvesting seasonal oranges and begin harvesting Wilking mandarins.",
          "Continue annual pruning.",
          "Maintain the irrigation network.",
          "Continue disc harrowing.",
          "Continue planting.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "harvest",
          "maintenance",
          "irrigation",
          "soil",
          "sowing",
          "cropProtection"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 82; PDF page 14.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-047-stone-fruits-apricot-peach-cherry-and-almond",
        "month": 3,
        "cropKeys": [
          "stone-fruits"
        ],
        "cropContext": "Stone fruits — apricot, peach, cherry, and almond",
        "section": "perennials",
        "operations": [
          "Incorporate green manure.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "fertilization",
          "cropProtection"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 82; PDF page 14.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-048-pome-fruits-and-related-fruit-trees-apple-pear-quince-pomegranate-and-loquat",
        "month": 3,
        "cropKeys": [
          "pome-fruits"
        ],
        "cropContext": "Pome fruits and related fruit trees — apple, pear, quince, pomegranate, and loquat",
        "section": "perennials",
        "operations": [
          "Continue the first tranche of nitrogen fertilization.",
          "Incorporate green manure.",
          "Finish pruning for late varieties.",
          "Thin fruit on loquat trees.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "fertilization",
          "maintenance",
          "cropProtection"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 82; PDF page 15.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-049-grapevine-established-vineyard",
        "month": 3,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — established vineyard",
        "section": "perennials",
        "operations": [
          "Level the soil so it is clean, especially in frost-prone areas.",
          "Finish tying the shoots/canes.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "soil",
          "cropProtection"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 83; PDF page 15.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m03-050-grapevine-new-vineyard",
        "month": 3,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — new vineyard",
        "section": "perennials",
        "operations": [
          "Continue cleft grafting.",
          "Install stakes and the first wire for plantings from the previous year.",
          "Disc harrow and rebuild the mounds around the plants."
        ],
        "actionTypes": [
          "sowing",
          "maintenance",
          "soil"
        ],
        "source": {
          "file": "03-mars_fr.pdf",
          "printedPages": "printed page 83; PDF page 16.",
          "pdfLength": "14 pages"
        }
      }
    ],
    "sourceNote": [
      "Soil preparation before planting.",
      "Soil disinfection after analysis.",
      "Base dressing: 25–30 t/ha manure.",
      "Mineral fertilizer: 165 u N/ha, 120 u P/ha, and 150 u K/ha.",
      "Weed control before or after planting.",
      "Planting at 25,000–35,000 plants/ha.",
      "Source location: printed page 81; PDF page 13."
    ],
    "regionalQualifiers": [
      "The source states that around mid-March the vine begins bud break and starts a new vegetative cycle. It warns of climatic accidents, especially frost, and recommends that the soil be completely level and perfectly clean. The source explains that weeds are harmful to vines because they can create disease and pest foci and favor frost effects.",
      "Source location: printed page 83; PDF page 16."
    ],
    "companionNote": [
      "| Action type | March examples |",
      "|---|---|",
      "| Sowing/planting | spring chickpea completion; alfalfa; fodder maize; sunflower completion; potato; market tomato, pepper, eggplant, zucchini; okra preparation for April sowing; melon/cantaloupe; green bean; endive; processing tomato; orchard and vineyard planting |",
      "| Harvest | early potato; green garlic and onion; cardoon; peas; fava bean; fennel; artichoke; strawberry; greenhouse tomato, cucumber, eggplant, pepper, strawberry, cantaloupe |",
      "| Irrigation | drought-stressed wheat at stem elongation; forage crops after cutting or sowing; garlic; cucumber; strawberry; artichoke; olive orchards; greenhouse crops |",
      "| Fertilization | final cereal nitrogen; fodder maize nitrogen; sunflower and rapeseed N/S; vegetable base dressings; greenhouse maintenance schedules; olive and fruit-tree nitrogen |",
      "| Soil preparation | potato; tomato; pepper; eggplant; zucchini; melon; cantaloupe; cucumber; green bean; endive; processing tomato |",
      "| Weed management | oilseed hoeing; cardoon and leek hand weeding; onion/garlic maintenance; vine and orchard weed control; clean soil in frost-prone vineyards |",
      "| Crop maintenance | hoeing, earthing-up, thinning, blanching, pruning, trellising, staking, mulching, greenhouse cleaning, tying canes, rebuilding mounds |",
      "| Crop protection | annex or crop-leaflet references; no unsupported product recommendation from this PDF alone |",
      "| Nursery/transplanting | tomato, pepper, eggplant, cucumber, and processing-tomato nursery operations |",
      "| Orchard/vineyard operations | grafting, pruning, wound mastic, trellis installation, planting, fruit thinning, and soil leveling |",
      "| Frost and climate risk | frost warning at vine bud break; drought-triggered wheat irrigation |"
    ],
    "uncertaintyNotes": [
      "The March source describes monthly operations by crop and production context but does not provide explicit companion-planting or intercropping compatibility rules. The future calendar may show that two crops have operations in the same month, but this must be labeled as **same-month activity overlap**, not biological compatibility. Verified companion planting should come only from a separate source or a clearly labeled agronomic rule set."
    ]
  },
  {
    "number": 4,
    "key": "04",
    "name": {
      "en": "April",
      "fr": "Avril",
      "ar": "أبريل"
    },
    "source": {
      "file": "04-avril_fr.pdf",
      "institution": "République Algérienne Démocratique et Populaire; Ministère de l’Agriculture et du Développement Rural; Direction de la Formation, de la Recherche et de la Vulgarisation; Institut National de la Vulgarisation Agricole.",
      "documentTitle": "*Calendrier des Opérations Culturales*",
      "language": "French",
      "pdfLength": "14 pages",
      "printedPages": "84–96",
      "extractionStatus": "Complete text extraction reviewed manually; crop names, production contexts, operations, quantities, growth stages, regional qualifiers, and source boundaries retained.",
      "interpretationRule": "`u` means the source’s fertilizer-unit notation and is intentionally not converted into kg. `q/ha` means quintals per hectare. Where the source points to an annex or crop leaflet, the future tool must show that source reference rather than inventing a product, active ingredient, or dose."
    },
    "entries": [
      {
        "id": "m04-001-winter-cereals-durum-wheat-bread-wheat-barley-oats-and-triticale",
        "month": 4,
        "cropKeys": [
          "wheat",
          "barley",
          "oats",
          "triticale"
        ],
        "cropContext": "Winter cereals — durum wheat, bread wheat, barley, oats, and triticale",
        "section": "grandesCultures",
        "operations": [
          "Continue phytosanitary treatments; refer to the phytosanitary calendar in the annex."
        ],
        "actionTypes": [
          "cropProtection"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 84; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-002-wheat",
        "month": 4,
        "cropKeys": [
          "wheat"
        ],
        "cropContext": "Wheat",
        "section": "grandesCultures",
        "operations": [
          "Irrigate in case of drought.",
          "The April source uses the broader label “Blés” for this irrigation instruction; the final dataset should preserve that label rather than infer whether it applies only to durum or to all wheat entries."
        ],
        "actionTypes": [
          "irrigation"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 84; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-003-dry-bean",
        "month": 4,
        "cropKeys": [
          "bean"
        ],
        "cropContext": "Dry bean",
        "section": "grandesCultures",
        "operations": [
          "Sow at 90–100 kg/ha."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 84; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-004-lentil-and-fava-bean",
        "month": 4,
        "cropKeys": [
          "lentil",
          "fava-bean"
        ],
        "cropContext": "Lentil and fava bean",
        "section": "grandesCultures",
        "operations": [
          "Mechanical hoeing."
        ],
        "actionTypes": [
          "weedManagement"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 84; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-005-alfalfa",
        "month": 4,
        "cropKeys": [
          "alfalfa"
        ],
        "cropContext": "Alfalfa",
        "section": "forage",
        "operations": [
          "Irrigated production: continue spring sowing and rolling/firming; irrigate.",
          "Rainfed production: third cut, depending on the year of establishment/operation."
        ],
        "actionTypes": [
          "sowing",
          "irrigation",
          "weedManagement"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 84; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-006-bersim",
        "month": 4,
        "cropKeys": [
          "bersim"
        ],
        "cropContext": "Bersim",
        "section": "forage",
        "operations": [
          "Irrigated production: fifth cut followed by irrigation."
        ],
        "actionTypes": [
          "irrigation"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 84; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-007-italian-ryegrass",
        "month": 4,
        "cropKeys": [
          "italian-ryegrass"
        ],
        "cropContext": "Italian ryegrass",
        "section": "forage",
        "operations": [
          "Rainfed production: third cut, depending on the establishment period."
        ],
        "actionTypes": [
          "observation"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 85; PDF page 2.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-008-fodder-sorghum",
        "month": 4,
        "cropKeys": [
          "fodder-sorghum"
        ],
        "cropContext": "Fodder sorghum",
        "section": "forage",
        "operations": [
          "Sow at 30 kg/ha.",
          "Apply 60 u/ha nitrogen at sowing.",
          "Irrigate."
        ],
        "actionTypes": [
          "sowing",
          "fertilization",
          "irrigation"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 85; PDF page 2.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-009-fodder-maize",
        "month": 4,
        "cropKeys": [
          "fodder-maize"
        ],
        "cropContext": "Fodder maize",
        "section": "forage",
        "operations": [
          "Sow at 15–20 kg/ha.",
          "Apply 40 u/ha nitrogen at sowing."
        ],
        "actionTypes": [
          "sowing",
          "fertilization"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 85; PDF page 2.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-010-vetchoat-peaoat-and-peatriticale-mixtures",
        "month": 4,
        "cropKeys": [
          "oats",
          "triticale",
          "forage-mixture"
        ],
        "cropContext": "Vetch–oat, pea–oat, and pea–triticale mixtures",
        "section": "forage",
        "operations": [
          "Harvest for silage at the beginning of ear emergence for the grass component and at full flowering for the legume component.",
          "Harvest for hay at the ear-emergence stage for the grass component and at the beginning of pod formation for the legume component.",
          "Bale the harvested material."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 85; PDF page 2.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-011-sunflower",
        "month": 4,
        "cropKeys": [
          "sunflower"
        ],
        "cropContext": "Sunflower",
        "section": "oilseeds",
        "operations": [
          "Chemical weed control from sowing to emergence.",
          "Complete weed management with hoeing up to the five-pair-of-leaves stage."
        ],
        "actionTypes": [
          "sowing",
          "weedManagement"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 85; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-012-potato-main-season-production",
        "month": 4,
        "cropKeys": [
          "potato"
        ],
        "cropContext": "Potato — main-season production",
        "section": "vegetables",
        "operations": [
          "Pre-sprouting for 2–3 weeks.",
          "Soil preparation.",
          "Planting at 25–27 q/ha.",
          "Hoeing and earthing-up.",
          "Base dressing: 25–30 t/ha bovine or sheep manure.",
          "Mineral fertilizer: 80–100 u N/ha, 100–120 u P/ha, and 200–240 u K/ha.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Chemical weed control."
        ],
        "actionTypes": [
          "sowing",
          "soil",
          "weedManagement",
          "fertilization",
          "cropProtection"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 86; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-013-market-tomato-main-season-production",
        "month": 4,
        "cropKeys": [
          "market-tomato"
        ],
        "cropContext": "Market tomato — main-season production",
        "section": "vegetables",
        "operations": [
          "Planting.",
          "Nursery activity in the eastern region (`Est`)."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 86; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-014-pepper-and-bell-pepper-main-season-production",
        "month": 4,
        "cropKeys": [
          "pepper"
        ],
        "cropContext": "Pepper and bell pepper — main-season production",
        "section": "vegetables",
        "operations": [
          "Planting at 20,000–25,000 plants/ha.",
          "Irrigation.",
          "Nursery activity in the High Plateaus (`Hauts Plateaux`)."
        ],
        "actionTypes": [
          "sowing",
          "irrigation"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 86; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-015-eggplant-main-season-production",
        "month": 4,
        "cropKeys": [
          "eggplant"
        ],
        "cropContext": "Eggplant — main-season production",
        "section": "vegetables",
        "operations": [
          "Planting at 11,000–18,000 plants/ha.",
          "Irrigation.",
          "Base fertilization: 30–35 t/ha manure; mineral fertilizer at 170–200 u N/ha, 100–150 u P/ha, and 200–250 u K/ha.",
          "Phytosanitary treatments if necessary.",
          "Crop maintenance: mulching, trellising, pruning, and leaf removal."
        ],
        "actionTypes": [
          "sowing",
          "irrigation",
          "fertilization",
          "cropProtection",
          "weedManagement",
          "maintenance"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed pages 86–87; PDF pages 3–4.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-016-pea",
        "month": 4,
        "cropKeys": [
          "pea"
        ],
        "cropContext": "Pea",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Weed control.",
          "Maintenance fertilization.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "weedManagement",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 87; PDF page 4.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-017-fava-bean",
        "month": 4,
        "cropKeys": [
          "fava-bean"
        ],
        "cropContext": "Fava bean",
        "section": "vegetables",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 87; PDF page 4.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-018-strawberry-main-season-production",
        "month": 4,
        "cropKeys": [
          "strawberry"
        ],
        "cropContext": "Strawberry — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Weed control.",
          "Maintenance fertilization: 100 u N/ha and 100 u K/ha.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "weedManagement",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 87; PDF page 4.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-019-onion",
        "month": 4,
        "cropKeys": [
          "onion"
        ],
        "cropContext": "Onion",
        "section": "vegetables",
        "operations": [
          "Harvest as green onion."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 87; PDF page 4.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-020-garlic",
        "month": 4,
        "cropKeys": [
          "garlic"
        ],
        "cropContext": "Garlic",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Irrigation.",
          "Phytosanitary treatments: refer to the garlic leaflet in the annex.",
          "Crop maintenance."
        ],
        "actionTypes": [
          "harvest",
          "irrigation",
          "cropProtection",
          "maintenance"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 87; PDF page 5.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-021-zucchini-main-season-production",
        "month": 4,
        "cropKeys": [
          "zucchini"
        ],
        "cropContext": "Zucchini — main-season production",
        "section": "vegetables",
        "operations": [
          "Planting.",
          "Irrigation.",
          "Maintenance fertilization in two applications:",
          "First application at fruit set: 30 u/ha, as written in the source without a stated nutrient element.",
          "Second application 15 days after the first: 30 u N/ha and 20 u K/ha.",
          "Phytosanitary treatments if necessary.",
          "Thinning."
        ],
        "actionTypes": [
          "sowing",
          "irrigation",
          "fertilization",
          "maintenance",
          "cropProtection",
          "weedManagement"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 87; PDF page 5.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-022-watermelon-and-melon-main-season-production",
        "month": 4,
        "cropKeys": [
          "cantaloupe",
          "watermelon"
        ],
        "cropContext": "Watermelon and melon — main-season production",
        "section": "vegetables",
        "operations": [
          "Direct-seed planting at 3–4 seeds per station/pocket.",
          "Plant density with trellising: 8,000–12,000 plants/ha.",
          "Open-field plant density: 12,000–16,500 plants/ha.",
          "Soil preparation.",
          "Organic fertilization: 30–35 t/ha manure.",
          "Mineral fertilization: 170–200 u N/ha, 100–150 u P/ha, and 200–250 u K/ha."
        ],
        "actionTypes": [
          "sowing",
          "maintenance",
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed pages 87–88; PDF pages 5–6.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-023-cantaloupe-main-season-production",
        "month": 4,
        "cropKeys": [
          "cantaloupe"
        ],
        "cropContext": "Cantaloupe — main-season production",
        "section": "vegetables",
        "operations": [
          "Direct-seed planting.",
          "Mineral fertilization in two applications: 134 u N/ha and 100 u K/ha, as written in the source without a per-application split.",
          "Irrigation.",
          "Phytosanitary treatments if necessary.",
          "Crop maintenance."
        ],
        "actionTypes": [
          "sowing",
          "fertilization",
          "irrigation",
          "cropProtection",
          "maintenance"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 88; PDF page 6.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-024-cucumber-main-season-production",
        "month": 4,
        "cropKeys": [
          "cucumber"
        ],
        "cropContext": "Cucumber — main-season production",
        "section": "vegetables",
        "operations": [
          "Planting at 11,000–18,000 plants/ha.",
          "Base fertilization: 25–30 t/ha manure; mineral fertilizer at 170–200 u N/ha, 100–150 u P/ha, and 200–250 u K/ha.",
          "Irrigation.",
          "Phytosanitary treatments if necessary.",
          "Crop maintenance: mulching, trellising, pruning, and leaf removal."
        ],
        "actionTypes": [
          "sowing",
          "fertilization",
          "irrigation",
          "cropProtection",
          "weedManagement",
          "maintenance"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 88; PDF page 6.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-025-green-bean",
        "month": 4,
        "cropKeys": [
          "bean"
        ],
        "cropContext": "Green bean",
        "section": "vegetables",
        "operations": [
          "Early production: harvest.",
          "Main-season production: direct sowing."
        ],
        "actionTypes": [
          "harvest",
          "sowing"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 89; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-026-carrot-and-turnip",
        "month": 4,
        "cropKeys": [
          "carrot",
          "turnip"
        ],
        "cropContext": "Carrot and turnip",
        "section": "vegetables",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 89; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-027-leek",
        "month": 4,
        "cropKeys": [
          "leek"
        ],
        "cropContext": "Leek",
        "section": "vegetables",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 89; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-028-celery",
        "month": 4,
        "cropKeys": [
          "celery"
        ],
        "cropContext": "Celery",
        "section": "vegetables",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 89; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-029-cardoon",
        "month": 4,
        "cropKeys": [
          "cardoon"
        ],
        "cropContext": "Cardoon",
        "section": "vegetables",
        "operations": [
          "Finish blanching during the second half of April for plants sown in February.",
          "Hoeing and hand weeding until the beginning of April.",
          "Irrigation according to need and phytosanitary treatment if necessary.",
          "Harvest."
        ],
        "actionTypes": [
          "sowing",
          "weedManagement",
          "irrigation",
          "cropProtection",
          "harvest"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 89; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-030-endive-chicory",
        "month": 4,
        "cropKeys": [
          "endive"
        ],
        "cropContext": "Endive chicory",
        "section": "vegetables",
        "operations": [
          "Plowing and harrowing until mid-April.",
          "Nursery sowing at 1.5 kg/ha.",
          "Nursery maintenance at the end of April.",
          "Planting during the second half of April."
        ],
        "actionTypes": [
          "soil",
          "sowing",
          "maintenance"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 89; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-031-artichoke",
        "month": 4,
        "cropKeys": [
          "artichoke"
        ],
        "cropContext": "Artichoke",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Weed control.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "weedManagement",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 90; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-032-greenhouse-market-tomato",
        "month": 4,
        "cropKeys": [
          "greenhouse-tomato"
        ],
        "cropContext": "Greenhouse market tomato",
        "section": "greenhouse",
        "operations": [
          "Biskra: finish harvest.",
          "Other regions: begin harvest.",
          "Maintenance fertilization: first and second applications of 60 u N and 50 u K; third and fifth applications of 20 u N and 60 u K, as written in the source.",
          "Irrigation.",
          "Phytosanitary treatments if necessary.",
          "Crop maintenance: trellising, removal of side shoots, and leaf removal."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 90; PDF pages 9–10.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-033-greenhouse-green-bean",
        "month": 4,
        "cropKeys": [
          "bean"
        ],
        "cropContext": "Greenhouse green bean",
        "section": "greenhouse",
        "operations": [
          "Irrigation.",
          "Phytosanitary treatments if necessary.",
          "Final harvests."
        ],
        "actionTypes": [
          "irrigation",
          "cropProtection",
          "harvest"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 90; PDF page 10.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-034-greenhouse-pepper-and-bell-pepper",
        "month": 4,
        "cropKeys": [
          "pepper"
        ],
        "cropContext": "Greenhouse pepper and bell pepper",
        "section": "greenhouse",
        "operations": [
          "Biskra: finish harvest.",
          "Coastal region (`Littoral`): begin harvest.",
          "Maintenance fertilization in four applications:",
          "First application before flowering: 40 u N and 30 u K.",
          "Second application at fruit set: 40 u N and 60 u K.",
          "Third application at fruit development: 30 u N and 60 u K.",
          "Fourth application after the first harvest: 20 u N and 60 u K.",
          "Irrigation.",
          "Crop maintenance: mulching, staking, hoeing, and earthing-up in non-mulched production.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation",
          "weedManagement",
          "cropProtection"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed pages 90–91; PDF pages 10–11.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-035-greenhouse-eggplant",
        "month": 4,
        "cropKeys": [
          "eggplant"
        ],
        "cropContext": "Greenhouse eggplant",
        "section": "greenhouse",
        "operations": [
          "Harvest.",
          "Maintenance fertilization in three applications:",
          "First application: 40 u N/ha.",
          "Second application: 40 u N/ha.",
          "Third application during fruit enlargement: 40 u N/ha and 100 u K/ha.",
          "Irrigation.",
          "Crop maintenance: earthing-up, weed control, and staking.",
          "Phytosanitary treatments."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation",
          "weedManagement",
          "cropProtection"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 91; PDF page 11.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-036-greenhouse-cucumber",
        "month": 4,
        "cropKeys": [
          "cucumber"
        ],
        "cropContext": "Greenhouse cucumber",
        "section": "greenhouse",
        "operations": [
          "Harvest.",
          "Maintenance fertilization in three applications:",
          "First application at flowering: 40 u N/ha.",
          "Second application three weeks after flowering: 40 u N/ha and 50 u K/ha.",
          "Third application during fruit development: 80 u N/ha and 100 u K/ha.",
          "Irrigation.",
          "Crop maintenance: mulching, trellising, pruning, and leaf removal.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation",
          "weedManagement",
          "cropProtection"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed pages 91–92; PDF pages 11–12.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-037-greenhouse-strawberry",
        "month": 4,
        "cropKeys": [
          "strawberry"
        ],
        "cropContext": "Greenhouse strawberry",
        "section": "greenhouse",
        "operations": [
          "Harvest of fresh and cold-stored plant material/production (`plants frais et frigo`) as written in the source.",
          "Weed control.",
          "Maintenance fertilization: 100 u N/ha and 100 u K/ha.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "sowing",
          "weedManagement",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 92; PDF page 12.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-038-greenhouse-cantaloupe",
        "month": 4,
        "cropKeys": [
          "cantaloupe"
        ],
        "cropContext": "Greenhouse cantaloupe",
        "section": "greenhouse",
        "operations": [
          "Harvest.",
          "Mineral fertilization in two applications: 134 u N/ha and 100 u K/ha, as written in the source without a per-application split.",
          "Irrigation.",
          "Pruning.",
          "Crop maintenance.",
          "Phytosanitary treatment if necessary."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "irrigation",
          "maintenance",
          "cropProtection"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 92; PDF page 12.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-039-greenhouse-zucchini",
        "month": 4,
        "cropKeys": [
          "zucchini"
        ],
        "cropContext": "Greenhouse zucchini",
        "section": "greenhouse",
        "operations": [
          "Harvest.",
          "Irrigation according to need."
        ],
        "actionTypes": [
          "harvest",
          "irrigation"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 92; PDF page 12.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-040-processing-tomato",
        "month": 4,
        "cropKeys": [
          "processing-tomato"
        ],
        "cropContext": "Processing tomato",
        "section": "industrial",
        "operations": [
          "Planting at 25,000–35,000 plants/ha.",
          "Maintenance fertilization:",
          "First application one month after planting: 2 q N, stated as 60 u/ha in rainfed production and 3 q N, stated as 100 u/ha in irrigated production.",
          "Second application: 1 q N, stated as 15 u/ha, plus 1.5–2 q K, stated as 50 u/ha.",
          "Weed control before and after planting."
        ],
        "actionTypes": [
          "sowing",
          "fertilization",
          "maintenance",
          "irrigation",
          "weedManagement"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 93; PDF page 13.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-041-olive",
        "month": 4,
        "cropKeys": [
          "olive"
        ],
        "cropContext": "Olive",
        "section": "perennials",
        "operations": [
          "Superficial maintenance plowing.",
          "Irrigate table varieties in case of need in the western region.",
          "Cross-disc harrowing, making furrows, and forming basins around trees.",
          "Intensive olive production: provide three irrigation applications (`3 lâchées d’eau`).",
          "Green pruning by removing water shoots/suckers.",
          "Continue crown grafting.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "soil",
          "maintenance",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 93; PDF page 13.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-042-citrus",
        "month": 4,
        "cropKeys": [
          "citrus"
        ],
        "cropContext": "Citrus",
        "section": "perennials",
        "operations": [
          "Continue planting.",
          "Finish harvesting seasonal oranges.",
          "Begin harvesting late varieties.",
          "Continue pruning.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Prepare for irrigation.",
          "Maintain localized irrigation networks.",
          "For traditional irrigation, form furrows and basins.",
          "Prepare nursery seedbeds.",
          "Conduct row sowing and transplant first-year liners/suckers (`pourrettes`), as written in the source."
        ],
        "actionTypes": [
          "sowing",
          "harvest",
          "maintenance",
          "cropProtection",
          "irrigation",
          "soil"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed pages 93–94; PDF page 14.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-043-stone-fruits-apricot-peach-cherry-almond-and-related-orchard-operations",
        "month": 4,
        "cropKeys": [
          "stone-fruits"
        ],
        "cropContext": "Stone fruits — apricot, peach, cherry, almond, and related orchard operations",
        "section": "perennials",
        "operations": [
          "Continue disc harrowing where appropriate, particularly at fruit set.",
          "Begin harvesting early peach varieties.",
          "Form furrows and tree basins.",
          "Prepare localized irrigation networks for peach and plum orchards.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "soil",
          "harvest",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed pages 94; PDF page 14.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-044-pome-fruits-and-related-fruit-trees-apple-pear-quince-pomegranate-and-loquat",
        "month": 4,
        "cropKeys": [
          "pome-fruits"
        ],
        "cropContext": "Pome fruits and related fruit trees — apple, pear, quince, pomegranate, and loquat",
        "section": "perennials",
        "operations": [
          "Restore localized irrigation networks.",
          "Form furrows and tree basins.",
          "Begin irrigation according to need and region.",
          "Continue cultivation operations, including disc harrowing, as necessary.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "irrigation",
          "soil",
          "cropProtection"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed pages 94; PDF page 15.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-045-grapevine-established-vineyard",
        "month": 4,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — established vineyard",
        "section": "perennials",
        "operations": [
          "Rebuild soil around vines before flowering.",
          "Maintain localized irrigation networks.",
          "Apply the second nitrogen-fertilizer tranche:",
          "Table grapes: 1.5 q/ha.",
          "Wine grapes: 1 q/ha.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Disc harrowing.",
          "Remove excess shoots (`ébourgeonnage`)."
        ],
        "actionTypes": [
          "soil",
          "irrigation",
          "fertilization",
          "cropProtection"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed page 95; PDF page 15.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m04-046-grapevine-new-vineyard",
        "month": 4,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — new vineyard",
        "section": "perennials",
        "operations": [
          "Install the conventional irrigation network.",
          "Apply urea 46%: 1.5 q/ha nitrogen fertilizer.",
          "Finish cleft grafting.",
          "Finish installing the trellis system.",
          "Restore and maintain planting mounds."
        ],
        "actionTypes": [
          "irrigation",
          "fertilization",
          "maintenance",
          "sowing"
        ],
        "source": {
          "file": "04-avril_fr.pdf",
          "printedPages": "printed pages 95–96; PDF page 16.",
          "pdfLength": "14 pages"
        }
      }
    ],
    "sourceNote": [
      "Planting at 25,000–35,000 plants/ha.",
      "Maintenance fertilization:",
      "First application one month after planting: 2 q N, stated as 60 u/ha in rainfed production and 3 q N, stated as 100 u/ha in irrigated production.",
      "Second application: 1 q N, stated as 15 u/ha, plus 1.5–2 q K, stated as 50 u/ha.",
      "Weed control before and after planting.",
      "Source location: printed page 93; PDF page 13."
    ],
    "regionalQualifiers": [
      "The source states that vines are in full growth during April and that frost and disease risks are very high. It therefore emphasizes keeping the vineyard clean. Shoot removal is described as an essential operation during this period because nonproductive water shoots consume nutrients, can transmit diseases, and complicate the following year’s pruning.",
      "Source location: printed page 96; PDF page 16."
    ],
    "companionNote": [
      "| Action type | April examples |",
      "|---|---|",
      "| Sowing/planting | Dry bean; alfalfa; fodder sorghum; fodder maize; potato; tomato, pepper, eggplant, zucchini, melon, cantaloupe, cucumber, and green bean; endive; processing tomato; citrus and new-vineyard operations |",
      "| Harvest | Pea, fava bean, strawberry, onion, garlic, carrot, turnip, leek, celery, cardoon, artichoke; greenhouse tomato, bean, pepper, eggplant, cucumber, strawberry, cantaloupe, and zucchini; early peach and citrus |",
      "| Irrigation | Drought-stressed wheat; alfalfa; bersim; fodder sorghum; pepper; eggplant; pea; strawberry; garlic; zucchini; cantaloupe; cucumber; artichoke; greenhouse crops; olive, citrus, stone-fruit, and pome-fruit orchards |",
      "| Fertilization | Fodder sorghum and maize nitrogen; potato base dressing; eggplant base dressing; strawberry maintenance; zucchini two-stage feed; melon/cantaloupe and cucumber base dressing; greenhouse crop maintenance; processing tomato rainfed/irrigated schedule; olive and grapevine nitrogen |",
      "| Soil preparation | Potato, melon, cucumber, processing tomato, eggplant; orchard furrows and basins; vineyard mounding and soil rebuilding |",
      "| Weed management | Sunflower chemical control plus hoeing; pea, cardoon, artichoke, and greenhouse maintenance; potato chemical weed control; orchard disc harrowing; vineyard cleaning and disc harrowing |",
      "| Crop maintenance | Rolling, hoeing, earthing-up, thinning, mulching, trellising, pruning, leaf removal, staking, greenhouse sanitation, shoot removal, grafting, and trellis installation |",
      "| Crop protection | Annex or crop-leaflet references; no unsupported product recommendation from this PDF alone |",
      "| Nursery/transplanting | Tomato nursery in the East; pepper nursery in the High Plateaus; citrus nursery seedbeds and first-year liner operations |",
      "| Orchard/vineyard operations | Localized irrigation-network maintenance, furrows, basins, grafting, pruning, fruit-set cultivation, vine shoot removal, and trellis installation |",
      "| Climate and regional risk | Wheat irrigation under drought; Biskra versus other-region harvest timing; Western-region table-olive irrigation; vine frost and disease risk during full growth |"
    ],
    "uncertaintyNotes": [
      "The April source includes several qualifiers that must remain explicit in the interactive tool. Pepper and bell-pepper nursery work is assigned to the High Plateaus, while tomato nursery work is assigned to the East. Greenhouse tomato and pepper harvest timing distinguishes Biskra from other regions or the coast. Olive irrigation is specifically linked to table varieties in the western region and to intensive production. Processing-tomato fertilization differs between rainfed and irrigated production. These qualifiers should be represented as filters or badges rather than flattened into one national rule."
    ]
  },
  {
    "number": 5,
    "key": "05",
    "name": {
      "en": "May",
      "fr": "Mai",
      "ar": "ماي"
    },
    "source": {
      "file": "05-mai_fr.pdf",
      "institution": "République Algérienne Démocratique et Populaire; Ministère de l’Agriculture et du Développement Rural; Direction de la Formation, de la Recherche et de la Vulgarisation; Institut National de la Vulgarisation Agricole.",
      "documentTitle": "*Calendrier des Opérations Culturales*",
      "language": "French",
      "pdfLength": "14 pages",
      "printedPages": "97–109",
      "extractionStatus": "Complete text extraction reviewed manually; crop names, production contexts, operations, quantities, growth stages, regional qualifiers, and source boundaries retained.",
      "interpretationRule": "`u` means the source’s fertilizer-unit notation and is intentionally not converted into kg. `q/ha` means quintals per hectare. Where the source points to an annex or crop leaflet, the future tool must show that source reference rather than inventing a product, active ingredient, or dose."
    },
    "entries": [
      {
        "id": "m05-001-winter-cereals-durum-wheat-and-bread-wheat",
        "month": 5,
        "cropKeys": [
          "wheat"
        ],
        "cropContext": "Winter cereals — durum wheat and bread wheat",
        "section": "grandesCultures",
        "operations": [
          "Irrigate in case of drought, with applications at flowering and grain formation.",
          "Continue phytosanitary treatments; refer to the phytosanitary calendar in the annex."
        ],
        "actionTypes": [
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 97; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-002-barley",
        "month": 5,
        "cropKeys": [
          "barley"
        ],
        "cropContext": "Barley",
        "section": "grandesCultures",
        "operations": [
          "Harvest at the end of May in the South."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 97; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-003-spring-chickpea-and-dry-bean",
        "month": 5,
        "cropKeys": [
          "chickpea",
          "bean"
        ],
        "cropContext": "Spring chickpea and dry bean",
        "section": "grandesCultures",
        "operations": [
          "Mechanical hoeing (`binage`)."
        ],
        "actionTypes": [
          "weedManagement"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 97; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-004-italian-ryegrass",
        "month": 5,
        "cropKeys": [
          "italian-ryegrass"
        ],
        "cropContext": "Italian ryegrass",
        "section": "forage",
        "operations": [
          "Mow at the ear-emergence stage for silage or hay."
        ],
        "actionTypes": [
          "observation"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 97; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-005-fodder-sorghum",
        "month": 5,
        "cropKeys": [
          "fodder-sorghum"
        ],
        "cropContext": "Fodder sorghum",
        "section": "forage",
        "operations": [
          "Finish sowing at the beginning of May.",
          "Irrigate."
        ],
        "actionTypes": [
          "sowing",
          "irrigation"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 97; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-006-vetchoat-peaoat-and-peatriticale-mixtures",
        "month": 5,
        "cropKeys": [
          "oats",
          "triticale",
          "forage-mixture"
        ],
        "cropContext": "Vetch–oat, pea–oat, and pea–triticale mixtures",
        "section": "forage",
        "operations": [
          "Harvest for hay."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 97; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-007-bersim",
        "month": 5,
        "cropKeys": [
          "bersim"
        ],
        "cropContext": "Bersim",
        "section": "forage",
        "operations": [
          "Irrigated production: sixth cut followed by irrigation."
        ],
        "actionTypes": [
          "irrigation"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 98; PDF page 2.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-008-sunflower-and-safflower",
        "month": 5,
        "cropKeys": [
          "safflower",
          "sunflower"
        ],
        "cropContext": "Sunflower and safflower",
        "section": "oilseeds",
        "operations": [
          "Conduct mechanical hoeing when weeds are present."
        ],
        "actionTypes": [
          "weedManagement"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 98; PDF page 2.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-009-rapeseed",
        "month": 5,
        "cropKeys": [
          "rapeseed"
        ],
        "cropContext": "Rapeseed",
        "section": "oilseeds",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 98; PDF page 2.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-010-potato-main-season-production",
        "month": 5,
        "cropKeys": [
          "potato"
        ],
        "cropContext": "Potato — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Phytosanitary treatments: refer to the potato phytosanitary calendar in the annex."
        ],
        "actionTypes": [
          "harvest",
          "cropProtection"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 99; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-011-market-tomato-main-season-production",
        "month": 5,
        "cropKeys": [
          "market-tomato"
        ],
        "cropContext": "Market tomato — main-season production",
        "section": "vegetables",
        "operations": [
          "Fertilization.",
          "Crop maintenance: trellising, removal of side shoots, and leaf removal.",
          "Irrigation.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Eastern region (`Est`): plant at 20,000–28,000 plants/ha."
        ],
        "actionTypes": [
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection",
          "sowing"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 99; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-012-pepper-and-bell-pepper-main-season-production",
        "month": 5,
        "cropKeys": [
          "pepper"
        ],
        "cropContext": "Pepper and bell pepper — main-season production",
        "section": "vegetables",
        "operations": [
          "Maintenance fertilization in four applications:",
          "First application before flowering: 40 u N and 30 u K.",
          "Second application at fruit set: 40 u N and 60 u K.",
          "Third application at fruit development: 30 u N and 60 u K.",
          "Fourth application after the first harvest: 20 u N and 60 u K.",
          "Irrigation.",
          "Crop maintenance.",
          "Phytosanitary treatments if necessary.",
          "High Plateaus (`Hauts Plateaux`): plant at 20,000–25,000 plants/ha."
        ],
        "actionTypes": [
          "fertilization",
          "maintenance",
          "harvest",
          "irrigation",
          "cropProtection",
          "sowing"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 99; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-013-eggplant-main-season-production",
        "month": 5,
        "cropKeys": [
          "eggplant"
        ],
        "cropContext": "Eggplant — main-season production",
        "section": "vegetables",
        "operations": [
          "Planting.",
          "Maintenance fertilization in three applications:",
          "First application: 40 u N/ha.",
          "Second application: 40 u N/ha.",
          "Third application during fruit enlargement: 40 u N/ha and 100 u K/ha.",
          "Crop maintenance: earthing-up, weed control, and staking.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "sowing",
          "fertilization",
          "maintenance",
          "weedManagement",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed pages 99–100; PDF pages 3–4.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-014-green-onion",
        "month": 5,
        "cropKeys": [
          "onion"
        ],
        "cropContext": "Green onion",
        "section": "vegetables",
        "operations": [
          "Harvest as green onion."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 100; PDF page 4.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-015-garlic",
        "month": 5,
        "cropKeys": [
          "garlic"
        ],
        "cropContext": "Garlic",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Phytosanitary treatments: refer to the garlic leaflet in the annex.",
          "Crop maintenance: hoeing, earthing-up, and weed control.",
          "Irrigation."
        ],
        "actionTypes": [
          "harvest",
          "cropProtection",
          "weedManagement",
          "maintenance",
          "irrigation"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 100; PDF page 4.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-016-okra",
        "month": 5,
        "cropKeys": [
          "okra"
        ],
        "cropContext": "Okra",
        "section": "vegetables",
        "operations": [
          "Direct sowing in coastal and inland zones at 20–22 kg/ha.",
          "Soak seeds before sowing.",
          "Manual weed control.",
          "Thin the stand and retain only the most developed plant.",
          "Apply supplementary fertilizer when plants have 2–3 true leaves, excluding cotyledons.",
          "Hoe and hand-weed.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "sowing",
          "weedManagement",
          "fertilization",
          "cropProtection"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 100; PDF pages 4–5.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-017-zucchini-main-season-production",
        "month": 5,
        "cropKeys": [
          "zucchini"
        ],
        "cropContext": "Zucchini — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Thin the stand.",
          "Maintenance fertilization in two applications:",
          "First application at fruit set: 30 u/ha, as printed without specifying the nutrient element.",
          "Second application 15 days after the first: 30 u N/ha and 20 u K/ha.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed pages 100–101; PDF pages 5–6.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-018-watermelon-and-melon-main-season-production",
        "month": 5,
        "cropKeys": [
          "cantaloupe",
          "watermelon"
        ],
        "cropContext": "Watermelon and melon — main-season production",
        "section": "vegetables",
        "operations": [
          "Base fertilization:",
          "Organic: 25–30 t/ha manure.",
          "Mineral: 170–200 u N/ha, 100–150 u P/ha, and 200–250 u K/ha.",
          "Direct sowing at 3–4 seeds per station/pocket.",
          "Crop maintenance.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "fertilization",
          "sowing",
          "maintenance",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 101; PDF page 6.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-019-cucumber-main-season-production",
        "month": 5,
        "cropKeys": [
          "cucumber"
        ],
        "cropContext": "Cucumber — main-season production",
        "section": "vegetables",
        "operations": [
          "Begin harvest.",
          "Maintenance fertilization in three applications:",
          "First application at flowering: 40 u N/ha.",
          "Second application three weeks after flowering: 40 u N/ha and 50 u K/ha.",
          "Third application during fruit development: 80 u N/ha and 100 u K/ha.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed pages 101–102; PDF pages 6–7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-020-green-bean",
        "month": 5,
        "cropKeys": [
          "bean"
        ],
        "cropContext": "Green bean",
        "section": "vegetables",
        "operations": [
          "Early production (`primeur`): finish harvest.",
          "Main-season production (`saison`): direct sowing and harvest.",
          "Late-season production (`arrière saison`): prepare the soil and apply base mineral fertilizer at 50–80 u N/ha, 80–100 u P/ha, and 100–150 u K/ha."
        ],
        "actionTypes": [
          "harvest",
          "sowing",
          "fertilization",
          "soil"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 102; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-021-carrot-and-turnip",
        "month": 5,
        "cropKeys": [
          "carrot",
          "turnip"
        ],
        "cropContext": "Carrot and turnip",
        "section": "vegetables",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 102; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-022-cardoon",
        "month": 5,
        "cropKeys": [
          "cardoon"
        ],
        "cropContext": "Cardoon",
        "section": "vegetables",
        "operations": [
          "Continue harvesting until the end of May."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 102; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-023-endive-chicory",
        "month": 5,
        "cropKeys": [
          "endive"
        ],
        "cropContext": "Endive chicory",
        "section": "vegetables",
        "operations": [
          "Maintain the nursery.",
          "Conduct planting and nursery operations.",
          "Begin irrigation at the end of May.",
          "Hoe."
        ],
        "actionTypes": [
          "sowing",
          "irrigation"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 102; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-024-artichoke",
        "month": 5,
        "cropKeys": [
          "artichoke"
        ],
        "cropContext": "Artichoke",
        "section": "vegetables",
        "operations": [
          "Prepare the artichoke field.",
          "Apply well-decomposed organic manure at 30–40 t/ha.",
          "Apply base mineral fertilizer at 70 u N/ha, 140 u P/ha, and 120 u K/ha.",
          "Eastern region (`région Est`): harvest."
        ],
        "actionTypes": [
          "fertilization",
          "harvest"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 102; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-025-pea",
        "month": 5,
        "cropKeys": [
          "pea"
        ],
        "cropContext": "Pea",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 102; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-026-fava-bean",
        "month": 5,
        "cropKeys": [
          "fava-bean"
        ],
        "cropContext": "Fava bean",
        "section": "vegetables",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 102; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-027-strawberry-main-season-production",
        "month": 5,
        "cropKeys": [
          "strawberry"
        ],
        "cropContext": "Strawberry — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Maintenance fertilization: 100 u N/ha and 100 u K/ha.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 103; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-028-cantaloupe-main-season-production",
        "month": 5,
        "cropKeys": [
          "cantaloupe"
        ],
        "cropContext": "Cantaloupe — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Irrigation.",
          "Mineral fertilization in two applications: 134 u N/ha and 100 u K/ha, as printed without a per-application split.",
          "Crop maintenance.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "irrigation",
          "fertilization",
          "maintenance",
          "cropProtection"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 103; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-029-greenhouse-market-tomato",
        "month": 5,
        "cropKeys": [
          "greenhouse-tomato"
        ],
        "cropContext": "Greenhouse market tomato",
        "section": "greenhouse",
        "operations": [
          "Harvest.",
          "Crop maintenance: trellising, removal of side shoots, and leaf removal.",
          "Maintenance fertilization:",
          "First and second applications: 60 u N and 50 u K.",
          "Third and fourth applications: 20 u N and 60 u K.",
          "Irrigation.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "harvest",
          "maintenance",
          "fertilization",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 104; PDF pages 9–10.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-030-greenhouse-climbing-bean",
        "month": 5,
        "cropKeys": [
          "greenhouse-climbing-bean"
        ],
        "cropContext": "Greenhouse climbing bean",
        "section": "greenhouse",
        "operations": [
          "Plow the soil."
        ],
        "actionTypes": [
          "soil"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 104; PDF page 10.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-031-greenhouse-cantaloupe",
        "month": 5,
        "cropKeys": [
          "cantaloupe"
        ],
        "cropContext": "Greenhouse cantaloupe",
        "section": "greenhouse",
        "operations": [
          "Harvest.",
          "Mineral fertilization in two applications: 134 u N/ha and 100 u K/ha, as printed without a per-application split.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 104; PDF page 10.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-032-greenhouse-eggplant",
        "month": 5,
        "cropKeys": [
          "eggplant"
        ],
        "cropContext": "Greenhouse eggplant",
        "section": "greenhouse",
        "operations": [
          "Harvest.",
          "Crop maintenance: earthing-up, weed control, and staking.",
          "Maintenance fertilization in three applications:",
          "First application: 40 u N/ha.",
          "Second application: 40 u N/ha.",
          "Third application during fruit enlargement: 40 u N/ha and 100 u K/ha.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "weedManagement",
          "maintenance",
          "fertilization",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed pages 104–105; PDF pages 10–11.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-033-greenhouse-pepper-and-bell-pepper",
        "month": 5,
        "cropKeys": [
          "pepper"
        ],
        "cropContext": "Greenhouse pepper and bell pepper",
        "section": "greenhouse",
        "operations": [
          "Coastal region (`Littoral`): begin harvest.",
          "Crop maintenance: mulching, staking, hoeing, and earthing-up in non-mulched production.",
          "Maintenance fertilization in four applications:",
          "First application before flowering: 40 u N and 30 u K.",
          "Second application at fruit set: 40 u N and 60 u K.",
          "Third application at fruit development: 30 u N and 60 u K.",
          "Fourth application after the first harvest: 20 u N and 60 u K.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "weedManagement",
          "maintenance",
          "fertilization",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 105; PDF page 11.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-034-greenhouse-strawberry",
        "month": 5,
        "cropKeys": [
          "strawberry"
        ],
        "cropContext": "Greenhouse strawberry",
        "section": "greenhouse",
        "operations": [
          "Harvest of fresh and cold-stored plant material/production (`plants frais et frigo`) as written in the source.",
          "Weed control.",
          "Irrigation.",
          "Phytosanitary treatments."
        ],
        "actionTypes": [
          "harvest",
          "sowing",
          "weedManagement",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 105; PDF page 11.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-035-greenhouse-cucumber",
        "month": 5,
        "cropKeys": [
          "cucumber"
        ],
        "cropContext": "Greenhouse cucumber",
        "section": "greenhouse",
        "operations": [
          "Harvest.",
          "Maintenance fertilization in three applications:",
          "First application at flowering: 40 units N/ha.",
          "Second application three weeks after flowering: 40 u N/ha and 50 u K/ha.",
          "Third application during fruit development: 80 u N/ha and 100 u K/ha.",
          "Irrigation.",
          "Phytosanitary treatments."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed pages 105; PDF pages 11–12.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-036-greenhouse-zucchini",
        "month": 5,
        "cropKeys": [
          "zucchini"
        ],
        "cropContext": "Greenhouse zucchini",
        "section": "greenhouse",
        "operations": [
          "Irrigation according to need.",
          "Final harvest.",
          "Plow the soil."
        ],
        "actionTypes": [
          "irrigation",
          "harvest",
          "soil"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 105; PDF page 12.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-037-processing-tomato",
        "month": 5,
        "cropKeys": [
          "processing-tomato"
        ],
        "cropContext": "Processing tomato",
        "section": "industrial",
        "operations": [
          "Planting at 25,000–35,000 plants/ha.",
          "Maintenance fertilization:",
          "First application one month after planting: 2 q N, stated as 60 u/ha in rainfed production; 3 q N, stated as 100 u/ha in irrigated production.",
          "Second application: 1 q N, stated as 15 u/ha, plus 1.5–2 q K, stated as 50 u/ha.",
          "Weed control before or after planting."
        ],
        "actionTypes": [
          "sowing",
          "fertilization",
          "maintenance",
          "irrigation",
          "weedManagement"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 106; PDF page 13.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-038-olive",
        "month": 5,
        "cropKeys": [
          "olive"
        ],
        "cropContext": "Olive",
        "section": "perennials",
        "operations": [
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Continue disc harrowing when weeds appear.",
          "Form furrows and tree basins.",
          "Continue irrigation for table varieties while avoiding the flowering period; the source specifies three irrigation applications (`3 lâchées d’eau`)."
        ],
        "actionTypes": [
          "cropProtection",
          "soil",
          "weedManagement",
          "irrigation"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 107; PDF page 13.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-039-citrus",
        "month": 5,
        "cropKeys": [
          "citrus"
        ],
        "cropContext": "Citrus",
        "section": "perennials",
        "operations": [
          "Continue disc harrowing.",
          "Begin irrigation.",
          "Continue harvesting late varieties.",
          "Finish pruning harvested trees.",
          "Conduct shield/bud grafting (`greffage en écussons`).",
          "Subsoil where soil conditions permit.",
          "Remove water shoots/suckers.",
          "Whitewash tree trunks.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "soil",
          "irrigation",
          "harvest",
          "maintenance",
          "cropProtection"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 107; PDF page 13.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-040-stone-fruits-apricot-peach-cherry-and-almond",
        "month": 5,
        "cropKeys": [
          "stone-fruits"
        ],
        "cropContext": "Stone fruits — apricot, peach, cherry, and almond",
        "section": "perennials",
        "operations": [
          "Disc harrow when necessary or scarify.",
          "Apply the second nitrogen-fertilizer tranche:",
          "Irrigated production: 1.25 q/ha.",
          "Rainfed production: 1.5 q/ha.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Begin irrigation according to need.",
          "Continue harvesting early peaches and cherries.",
          "Form furrows and tree basins.",
          "Prepare the irrigation network.",
          "Remove excess shoots (`ébourgeonnage`)."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "irrigation",
          "cropProtection",
          "harvest"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed pages 107–108; PDF pages 13–14.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-041-pome-fruits-and-related-fruit-trees-apple-pear-quince-pomegranate-and-loquat",
        "month": 5,
        "cropKeys": [
          "pome-fruits"
        ],
        "cropContext": "Pome fruits and related fruit trees — apple, pear, quince, pomegranate, and loquat",
        "section": "perennials",
        "operations": [
          "Continue irrigation.",
          "Begin the second nitrogen-fertilizer tranche at 1 q/ha.",
          "Green pruning.",
          "Bend/train apple and pear trees conducted on trellises (`arcure` for palmette/trellis systems).",
          "Whitewash trunks.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "irrigation",
          "fertilization",
          "maintenance",
          "cropProtection"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 108; PDF page 14.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-042-grapevine-established-vineyard",
        "month": 5,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — established vineyard",
        "section": "perennials",
        "operations": [
          "Top the vines and remove suckers (`écimage et épamprage`).",
          "Disc harrow if necessary.",
          "Tie the shoots/canes to the support system.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "maintenance",
          "soil",
          "cropProtection"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed page 108; PDF page 14.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m05-043-grapevine-new-vineyard",
        "month": 5,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — new vineyard",
        "section": "perennials",
        "operations": [
          "Irrigate young plantings by tanker at 10 L per plant.",
          "Stake young plants.",
          "Conduct mechanical weed control.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "sowing",
          "irrigation",
          "maintenance",
          "weedManagement",
          "cropProtection"
        ],
        "source": {
          "file": "05-mai_fr.pdf",
          "printedPages": "printed pages 108–109; PDF page 14.",
          "pdfLength": "14 pages"
        }
      }
    ],
    "sourceNote": [
      "Planting at 25,000–35,000 plants/ha.",
      "Maintenance fertilization:",
      "First application one month after planting: 2 q N, stated as 60 u/ha in rainfed production; 3 q N, stated as 100 u/ha in irrigated production.",
      "Second application: 1 q N, stated as 15 u/ha, plus 1.5–2 q K, stated as 50 u/ha.",
      "Weed control before or after planting.",
      "Source location: printed page 106; PDF page 13."
    ],
    "regionalQualifiers": [
      "The source states that vines are in full growth during May and that frost and disease risks remain very high. It describes this as the most critical period for the vine because it affects both the current year’s harvest through flowering and the following year’s harvest through bud initiation. The source specifically names powdery mildew (`oïdium`), flea beetle/altise, and especially downy mildew (`mildiou`) as important disease or pest risks during this period.",
      "Source location: printed pages 108–109; PDF page 14."
    ],
    "companionNote": [
      "| Action type | May examples |",
      "|---|---|",
      "| Sowing/planting | Fodder sorghum; market tomato in the East; pepper and bell pepper on the High Plateaus; eggplant; okra; zucchini; watermelon and melon; green bean; endive; artichoke; processing tomato |",
      "| Harvest | Southern barley; rapeseed; potato; green onion; garlic; zucchini; cucumber; green beans by cycle; carrots and turnips; cardoon; artichoke in the East; peas; fava beans; strawberry; cantaloupe; greenhouse crops; citrus and early peaches/cherries |",
      "| Irrigation | Drought-stressed wheat at flowering and grain formation; fodder sorghum; bersim; tomato, pepper, eggplant, zucchini, melon, cucumber, peas, strawberries, cantaloupe, and greenhouse crops; olives, citrus, stone fruits, pome fruits, and new vineyards |",
      "| Fertilization | Main-season tomato, pepper, eggplant, zucchini, melon, cucumber, late-season green bean, artichoke, strawberry, cantaloupe, greenhouse crops, processing tomato, stone fruits, and pome fruits |",
      "| Soil preparation | Late-season green bean; artichoke; greenhouse climbing bean; greenhouse zucchini; processing tomato; stone-fruit and perennial orchard operations |",
      "| Weed management | Cereal and legume hoeing; sunflower and safflower hoeing; okra manual and mechanical weeding; green bean soil preparation; greenhouse zucchini plowing; orchard disc harrowing; young-vineyard mechanical weed control |",
      "| Crop maintenance | Thinning, earthing-up, staking, trellising, side-shoot removal, leaf removal, mulching, pruning, grafting, training, trunk whitewashing, shoot tying, and vine topping/suckering |",
      "| Crop protection | Annex or crop-leaflet references; May vine risks include powdery mildew, altise, and downy mildew; no unsupported product recommendation from this PDF alone |",
      "| Nursery/transplanting | Main-season and regional planting operations for tomato, pepper, eggplant, okra, melon, cucumber, and green bean |",
      "| Orchard/vineyard operations | Localized irrigation, furrows, basins, grafting, pruning, training, trellising, trunk whitewashing, shoot removal, staking, and tanker irrigation |",
      "| Climate and regional risk | Wheat irrigation under drought; Southern barley harvest timing; East-region tomato planting; High-Plateau pepper planting; coastal pepper harvest; vine frost and disease risk during full growth |"
    ],
    "uncertaintyNotes": [
      "The May source includes several qualifiers that must remain explicit in the interactive tool. Barley harvest is assigned to the South at the end of the month. Tomato planting at 20,000–28,000 plants/ha is assigned to the East, while pepper and bell-pepper planting at 20,000–25,000 plants/ha is assigned to the High Plateaus. Greenhouse pepper harvest begins in the coastal region. Artichoke harvest is specified for the East. Processing-tomato fertilization differs between rainfed and irrigated production. These qualifiers should be represented as filters or badges rather than flattened into one national rule."
    ]
  },
  {
    "number": 6,
    "key": "06",
    "name": {
      "en": "June",
      "fr": "Juin",
      "ar": "يونيو"
    },
    "source": {
      "file": "06-juin_fr.pdf",
      "institution": "République Algérienne Démocratique et Populaire; Ministère de l’Agriculture et du Développement Rural; Direction de la Formation, de la Recherche et de la Vulgarisation; Institut National de la Vulgarisation Agricole.",
      "documentTitle": "*Calendrier des Opérations Culturales*",
      "language": "French",
      "pdfLength": "12 pages",
      "printedPages": "110–120",
      "extractionStatus": "Complete text extraction reviewed manually; crop names, production contexts, operations, quantities, growth stages, regional qualifiers, and source boundaries retained.",
      "interpretationRule": "`u` means the source’s fertilizer-unit notation and is intentionally not converted into kg. `q/ha` means quintals per hectare. Where the source points to an annex or crop leaflet, the future tool must show that source reference rather than inventing a product, active ingredient, or dose."
    },
    "entries": [
      {
        "id": "m06-001-winter-cereals-durum-wheat-bread-wheat-barley-oats-and-triticale",
        "month": 6,
        "cropKeys": [
          "wheat",
          "barley",
          "oats",
          "triticale"
        ],
        "cropContext": "Winter cereals — durum wheat, bread wheat, barley, oats, and triticale",
        "section": "grandesCultures",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 110; PDF page 1.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-002-food-legumes-fava-bean-lentil-dry-pea-and-chickpea",
        "month": 6,
        "cropKeys": [
          "lentil",
          "chickpea",
          "fava-bean",
          "pea"
        ],
        "cropContext": "Food legumes — fava bean, lentil, dry pea, and chickpea",
        "section": "grandesCultures",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 110; PDF page 1.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-003-fodder-maize-and-fodder-sorghum",
        "month": 6,
        "cropKeys": [
          "fodder-maize",
          "fodder-sorghum"
        ],
        "cropContext": "Fodder maize and fodder sorghum",
        "section": "forage",
        "operations": [
          "Cut.",
          "Irrigate."
        ],
        "actionTypes": [
          "irrigation"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 110; PDF page 1.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-004-alfalfa-spring-sown-irrigated-production",
        "month": 6,
        "cropKeys": [
          "alfalfa"
        ],
        "cropContext": "Alfalfa — spring-sown irrigated production",
        "section": "forage",
        "operations": [
          "First cut, followed by irrigation."
        ],
        "actionTypes": [
          "irrigation"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 110; PDF page 1.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-005-bersim",
        "month": 6,
        "cropKeys": [
          "bersim"
        ],
        "cropContext": "Bersim",
        "section": "forage",
        "operations": [
          "Harvest the seed at the final cut."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 110; PDF page 1.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-006-rapeseed",
        "month": 6,
        "cropKeys": [
          "rapeseed"
        ],
        "cropContext": "Rapeseed",
        "section": "oilseeds",
        "operations": [
          "Finish the harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 110; PDF page 1.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-007-potato-main-season-production",
        "month": 6,
        "cropKeys": [
          "potato"
        ],
        "cropContext": "Potato — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Phytosanitary treatments: refer to the potato phytosanitary calendar in the annex."
        ],
        "actionTypes": [
          "harvest",
          "cropProtection"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 111; PDF page 2.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-008-market-tomato-main-season-production",
        "month": 6,
        "cropKeys": [
          "market-tomato"
        ],
        "cropContext": "Market tomato — main-season production",
        "section": "vegetables",
        "operations": [
          "Crop maintenance: trellising, removal of side shoots, and leaf removal.",
          "Maintenance fertilization in five applications:",
          "First and second applications: 60 u N and 50 u K.",
          "Third through fifth applications: 20 u N and 60 u K.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Eastern region (`Est`): planting."
        ],
        "actionTypes": [
          "maintenance",
          "fertilization",
          "cropProtection",
          "sowing"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 111; PDF page 2.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-009-market-tomato-late-season-production",
        "month": 6,
        "cropKeys": [
          "market-tomato"
        ],
        "cropContext": "Market tomato — late-season production",
        "section": "vegetables",
        "operations": [
          "Prepare the soil.",
          "Apply base organic and mineral fertilizer:",
          "Organic manure: 30–40 t/ha.",
          "Mineral fertilizer: 180 u N/ha, 70 u P/ha, and 200–250 u K/ha.",
          "Disinfect the soil after analysis.",
          "Irrigate."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "irrigation"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 111; PDF page 2.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-010-pepper-and-bell-pepper-main-season-production",
        "month": 6,
        "cropKeys": [
          "pepper"
        ],
        "cropContext": "Pepper and bell pepper — main-season production",
        "section": "vegetables",
        "operations": [
          "Crop maintenance: mulching, staking, hoeing, and earthing-up in non-mulched production.",
          "Maintenance fertilization in four applications:",
          "First application before flowering: 40 u N and 30 u K.",
          "Second application at fruit set: 40 u N and 60 u K.",
          "Third application at fruit development: 30 u N and 60 u K.",
          "Fourth application after the first harvest: 20 u N and 60 u K.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "weedManagement",
          "maintenance",
          "fertilization",
          "harvest",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 112; PDF page 3.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-011-eggplant-main-season-production",
        "month": 6,
        "cropKeys": [
          "eggplant"
        ],
        "cropContext": "Eggplant — main-season production",
        "section": "vegetables",
        "operations": [
          "Begin harvest.",
          "Weed control and staking.",
          "Maintenance fertilization in three applications:",
          "First application: 40 u N/ha.",
          "Second application: 40 u N/ha.",
          "Third application during fruit enlargement: 40 u N/ha and 100 u K/ha.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "weedManagement",
          "maintenance",
          "fertilization",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 112; PDF page 3.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-012-onion",
        "month": 6,
        "cropKeys": [
          "onion"
        ],
        "cropContext": "Onion",
        "section": "vegetables",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 112; PDF page 3.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-013-garlic",
        "month": 6,
        "cropKeys": [
          "garlic"
        ],
        "cropContext": "Garlic",
        "section": "vegetables",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 112; PDF page 3.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-014-cantaloupe-main-season-production",
        "month": 6,
        "cropKeys": [
          "cantaloupe"
        ],
        "cropContext": "Cantaloupe — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Mineral fertilization in two applications: 134 u N/ha and 100 u K/ha, as printed without a per-application split.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 113; PDF page 4.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-015-okra",
        "month": 6,
        "cropKeys": [
          "okra"
        ],
        "cropContext": "Okra",
        "section": "vegetables",
        "operations": [
          "Harvest for April sowings.",
          "Thin the stand.",
          "Apply supplementary fertilizer.",
          "Manual weed control plus two hoeing and hand-weeding operations.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "weedManagement",
          "cropProtection"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 113; PDF page 4.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-016-zucchini-main-season-production",
        "month": 6,
        "cropKeys": [
          "zucchini"
        ],
        "cropContext": "Zucchini — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Thin the stand.",
          "Maintenance fertilization in two applications:",
          "First application at fruit set: 30 u/ha, as printed without specifying the nutrient element.",
          "Second application 15 days after the first: 30 u N/ha and 20 u K/ha.",
          "Phytosanitary treatments if necessary.",
          "Irrigation."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "cropProtection",
          "irrigation"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 113; PDF page 4.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-017-zucchini-late-season-production",
        "month": 6,
        "cropKeys": [
          "zucchini"
        ],
        "cropContext": "Zucchini — late-season production",
        "section": "vegetables",
        "operations": [
          "Apply base fertilizer:",
          "Organic manure: 30 t/ha.",
          "Mineral fertilizer: 120 u N/ha, 60 u P/ha, and 100 u K/ha.",
          "Prepare the soil.",
          "Direct sowing at 3–6 kg/ha.",
          "Irrigation."
        ],
        "actionTypes": [
          "fertilization",
          "soil",
          "sowing",
          "irrigation"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 113; PDF page 4.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-018-strawberry-main-season-production",
        "month": 6,
        "cropKeys": [
          "strawberry"
        ],
        "cropContext": "Strawberry — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Irrigation.",
          "Phytosanitary treatments if necessary.",
          "Weed control."
        ],
        "actionTypes": [
          "harvest",
          "irrigation",
          "cropProtection",
          "weedManagement"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 113; PDF page 4.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-019-watermelon-and-melon-main-season-production",
        "month": 6,
        "cropKeys": [
          "cantaloupe",
          "watermelon"
        ],
        "cropContext": "Watermelon and melon — main-season production",
        "section": "vegetables",
        "operations": [
          "Maintenance fertilization:",
          "First application after flowering: 40 u N/ha.",
          "Second application three weeks after the first: 40 u N/ha and 50 u K/ha.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 114; PDF page 5.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-020-cucumber-main-season-production",
        "month": 6,
        "cropKeys": [
          "cucumber"
        ],
        "cropContext": "Cucumber — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Maintenance fertilization in three applications:",
          "First application at flowering: 40 u N/ha.",
          "Second application three weeks after flowering: 40 u N/ha and 50 u K/ha.",
          "Third application during fruit development: 80 u N/ha and 100 u K/ha.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 114; PDF page 5.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-021-green-bean",
        "month": 6,
        "cropKeys": [
          "bean"
        ],
        "cropContext": "Green bean",
        "section": "vegetables",
        "operations": [
          "Main-season production: harvest.",
          "Late-season production: direct sowing."
        ],
        "actionTypes": [
          "harvest",
          "sowing"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 114; PDF page 5.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-022-carrot-and-turnip",
        "month": 6,
        "cropKeys": [
          "carrot",
          "turnip"
        ],
        "cropContext": "Carrot and turnip",
        "section": "vegetables",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 114; PDF page 5.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-023-endive-chicory",
        "month": 6,
        "cropKeys": [
          "endive"
        ],
        "cropContext": "Endive chicory",
        "section": "vegetables",
        "operations": [
          "Winter production:",
          "First half of June: plow.",
          "Second half of June: sow in the nursery at 1.5 kg/ha.",
          "Maintain the nursery.",
          "Summer production:",
          "Second half of June: begin blanching.",
          "Irrigate according to need and provide phytosanitary protection."
        ],
        "actionTypes": [
          "soil",
          "sowing",
          "weedManagement",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 114; PDF page 5.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-024-artichoke",
        "month": 6,
        "cropKeys": [
          "artichoke"
        ],
        "cropContext": "Artichoke",
        "section": "vegetables",
        "operations": [
          "Apply base fertilizer:",
          "Organic manure: 30–40 t/ha.",
          "Mineral fertilizer: 150 u N/ha, 150 u P/ha, and 350 u K/ha.",
          "Irrigate."
        ],
        "actionTypes": [
          "fertilization",
          "irrigation"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 115; PDF page 6.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-025-pea-maghnia-zone",
        "month": 6,
        "cropKeys": [
          "pea"
        ],
        "cropContext": "Pea — Maghnia zone",
        "section": "vegetables",
        "operations": [
          "Prepare the soil.",
          "Apply base mineral fertilizer.",
          "Main-season production: harvest and clean the plots."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "harvest",
          "weedManagement"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 115; PDF pages 6–7.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-026-fava-bean-main-season-production",
        "month": 6,
        "cropKeys": [
          "fava-bean"
        ],
        "cropContext": "Fava bean — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest and clean the plots."
        ],
        "actionTypes": [
          "harvest",
          "weedManagement"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 115; PDF page 7.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-027-greenhouse-market-tomato",
        "month": 6,
        "cropKeys": [
          "greenhouse-tomato"
        ],
        "cropContext": "Greenhouse market tomato",
        "section": "greenhouse",
        "operations": [
          "Harvest.",
          "Other regions:",
          "Crop maintenance: trellising, removal of side shoots, and leaf removal.",
          "Maintenance fertilization:",
          "First and second applications: 60 u N and 50 u K.",
          "Third and fifth applications: 20 u N and 60 u K, as printed.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "maintenance",
          "fertilization",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 116; PDF pages 8–9.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-028-greenhouse-pepper-and-bell-pepper",
        "month": 6,
        "cropKeys": [
          "pepper"
        ],
        "cropContext": "Greenhouse pepper and bell pepper",
        "section": "greenhouse",
        "operations": [
          "Harvest.",
          "Crop maintenance: mulching, staking, hoeing, and earthing-up in non-mulched production.",
          "Maintenance fertilization in four applications:",
          "First application before flowering: 40 u N and 30 u K.",
          "Second application at fruit set: 40 u N and 60 u K.",
          "Third application at fruit development: 30 u N and 60 u K.",
          "Fourth application after the first harvest: 20 u N and 60 u K.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "weedManagement",
          "maintenance",
          "fertilization",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 116; PDF pages 8–9.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-029-greenhouse-cantaloupe",
        "month": 6,
        "cropKeys": [
          "cantaloupe"
        ],
        "cropContext": "Greenhouse cantaloupe",
        "section": "greenhouse",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 116; PDF page 9.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-030-greenhouse-cucumber",
        "month": 6,
        "cropKeys": [
          "cucumber"
        ],
        "cropContext": "Greenhouse cucumber",
        "section": "greenhouse",
        "operations": [
          "Harvest and clean the plots."
        ],
        "actionTypes": [
          "harvest",
          "weedManagement"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 116; PDF page 9.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-031-greenhouse-eggplant",
        "month": 6,
        "cropKeys": [
          "eggplant"
        ],
        "cropContext": "Greenhouse eggplant",
        "section": "greenhouse",
        "operations": [
          "Harvest.",
          "Weed control and staking.",
          "Maintenance fertilization in three applications:",
          "First application: 40 u N/ha.",
          "Second application: 40 u N/ha.",
          "Third application during fruit enlargement: 40 u N/ha and 100 u K/ha.",
          "Irrigation.",
          "Phytosanitary treatments."
        ],
        "actionTypes": [
          "harvest",
          "weedManagement",
          "maintenance",
          "fertilization",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 116; PDF page 9.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-032-greenhouse-pepper-and-bell-pepper-additional-line",
        "month": 6,
        "cropKeys": [
          "pepper"
        ],
        "cropContext": "Greenhouse pepper and bell pepper — additional line",
        "section": "greenhouse",
        "operations": [
          "Harvest.",
          "Irrigate according to need."
        ],
        "actionTypes": [
          "harvest",
          "irrigation"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 116; PDF page 9.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-033-processing-tomato",
        "month": 6,
        "cropKeys": [
          "processing-tomato"
        ],
        "cropContext": "Processing tomato",
        "section": "industrial",
        "operations": [
          "Hoe and earth up.",
          "Irrigate.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 117; PDF page 10.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-034-olive",
        "month": 6,
        "cropKeys": [
          "olive"
        ],
        "cropContext": "Olive",
        "section": "perennials",
        "operations": [
          "Apply the second nitrogen-fertilizer tranche:",
          "Irrigated production: 1.5 q/ha.",
          "Rainfed production: 1 q/ha.",
          "Conduct physicochemical soil analysis.",
          "New plantings: apply base fertilizer at 10 q/ha, followed by deep ripping/deep soil preparation to 0.80–1 m.",
          "Continue irrigation: three water applications (`3 lâchées d’eau`).",
          "Disc harrow when weeds appear; form furrows and tree basins."
        ],
        "actionTypes": [
          "fertilization",
          "irrigation",
          "soil",
          "sowing",
          "weedManagement"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 117; PDF page 10.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-035-citrus",
        "month": 6,
        "cropKeys": [
          "citrus"
        ],
        "cropContext": "Citrus",
        "section": "perennials",
        "operations": [
          "Continue disc harrowing if necessary.",
          "Apply the second nitrogen-fertilizer tranche: one quarter of the dose, specified as 1.5 q/ha in the source.",
          "Continue irrigation without allowing water to reach the tree collar.",
          "Continue and finish harvesting late varieties.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "New orchards: begin deep soil preparation and base P–K fertilization at 10 q/ha.",
          "Subsoil where necessary to break the plow pan."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "irrigation",
          "harvest",
          "cropProtection"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 117; PDF page 10.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-036-stone-fruits-apricot-peach-cherry-almond-plum",
        "month": 6,
        "cropKeys": [
          "stone-fruits"
        ],
        "cropContext": "Stone fruits — apricot, peach, cherry, almond, plum",
        "section": "perennials",
        "operations": [
          "Continue irrigation.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Begin harvesting almonds, peaches, apricots, plums, and cherries.",
          "Conduct green pruning of stone-fruit trees.",
          "Subsoil to break the plow pan."
        ],
        "actionTypes": [
          "irrigation",
          "cropProtection",
          "harvest",
          "maintenance",
          "soil"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 118; PDF pages 10–11.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-037-pome-fruits-and-related-trees-apple-pear-quince-pomegranate-loquat",
        "month": 6,
        "cropKeys": [
          "pome-fruits"
        ],
        "cropContext": "Pome fruits and related trees — apple, pear, quince, pomegranate, loquat",
        "section": "perennials",
        "operations": [
          "Clear the plot where necessary before deep soil preparation for new plantings.",
          "Subsoil to break the plow pan.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Continue irrigation.",
          "Begin harvesting early pears and apples.",
          "Continue shoot removal (`ébourgeonnage`).",
          "Conduct green pruning of young plantings."
        ],
        "actionTypes": [
          "sowing",
          "soil",
          "cropProtection",
          "irrigation",
          "harvest",
          "maintenance"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 118; PDF page 11.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-038-grapevine-established-vineyard",
        "month": 6,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — established vineyard",
        "section": "perennials",
        "operations": [
          "Begin irrigation.",
          "Mechanical weed control.",
          "Finish shoot removal in late zones.",
          "Prepare wineries and winemaking equipment."
        ],
        "actionTypes": [
          "irrigation",
          "weedManagement"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 119; PDF page 11.",
          "pdfLength": "12 pages"
        }
      },
      {
        "id": "m06-039-grapevine-new-vineyard",
        "month": 6,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — new vineyard",
        "section": "perennials",
        "operations": [
          "Conduct physicochemical and nematological soil analysis.",
          "Mechanical and manual weed control.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Begin uncovering and weaning young grafted plants (`débutage et sevrage des jeunes plants greffés soudés`).",
          "Irrigate young plantings at 10 L per plant.",
          "Re-cover or earth-up the young plants (`rebutage` as printed)."
        ],
        "actionTypes": [
          "soil",
          "weedManagement",
          "cropProtection",
          "sowing",
          "irrigation"
        ],
        "source": {
          "file": "06-juin_fr.pdf",
          "printedPages": "printed page 119; PDF page 11.",
          "pdfLength": "12 pages"
        }
      }
    ],
    "sourceNote": [
      "Hoe and earth up.",
      "Irrigate.",
      "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
      "Source location: printed page 117; PDF page 10."
    ],
    "regionalQualifiers": [
      "The source states that plants continue their full growth in June and remain highly sensitive to pest attacks, naming downy mildew (`mildiou`), powdery mildew (`oïdium`), and flea beetle/altise. It also states that soil should be kept perfectly clean to eliminate competition from weeds. For young grafted plants, the source says they must be weaned by cutting roots that emerge from the scion so that the scion does not become independent of the rootstock.",
      "Source location: printed page 120; PDF page 12."
    ],
    "companionNote": [
      "| Action type | June examples |",
      "|---|---|",
      "| Harvest | Winter cereals and food legumes; rapeseed; potato; eggplant; onion; garlic; cantaloupe; zucchini; strawberry; cucumber; green bean; carrot and turnip; pea; fava bean; greenhouse tomato, pepper, cantaloupe, cucumber, and eggplant; late citrus; early stone fruits; early pears and apples |",
      "| Cutting and forage harvest | Fodder maize and sorghum cutting; first alfalfa cut; final bersim seed harvest |",
      "| Sowing/planting | Eastern-region tomato; late-season tomato soil preparation; late-season zucchini direct sowing; late-season green bean direct sowing; endive nursery sowing; Maghnia pea preparation; greenhouse and perennial new-planting operations |",
      "| Irrigation | Fodder crops; spring-sown alfalfa; main- and late-season tomato; pepper; eggplant; cantaloupe; zucchini; strawberry; watermelon and melon; cucumber; artichoke; processing tomato; olives; citrus; stone fruits; pome fruits; established and new vineyards |",
      "| Fertilization | Main- and late-season tomato; pepper; eggplant; cantaloupe; zucchini; watermelon and melon; cucumber; artichoke; greenhouse crops; olive; citrus; new perennial plantings |",
      "| Soil preparation | Late-season tomato and zucchini; endive winter production; pea in Maghnia; new olive, citrus, and pome-fruit plantings; new vineyards |",
      "| Weed management | Okra; endive; pea and plot cleaning; olive and citrus disc harrowing; vineyard mechanical/manual weed control |",
      "| Crop maintenance | Trellising, side-shoot removal, leaf removal, mulching, staking, hoeing, earthing-up, thinning, green pruning, shoot removal, winery preparation, grafted-plant weaning, and re-covering young plants |",
      "| Crop protection | Annex or crop-leaflet references; June source note names downy mildew, powdery mildew, and flea beetle; no unsupported product recommendation from this PDF alone |",
      "| Soil testing | Olive physicochemical analysis; new-vineyard physicochemical and nematological analysis; soil disinfection after analysis for late-season tomato |",
      "| Orchard/vineyard operations | Deep ripping, plow-pan destruction, furrows, basins, irrigation collars, pruning, harvesting, grafted-plant management, young-plant irrigation, and winery preparation |",
      "| Climate and regional risk | Eastern-region tomato planting; Maghnia pea qualifier; June full-growth and pest-pressure warning; need-based irrigation and weed competition |"
    ],
    "uncertaintyNotes": [
      "The June source includes several qualifiers that must remain explicit in the interactive tool. Tomato planting is assigned to the East. Late-season tomato is associated with soil preparation, soil disinfection after analysis, and a specific base-fertilizer program. Pea preparation is assigned to the Maghnia zone. The source distinguishes irrigated and rainfed olive nitrogen rates, and it separately describes established versus new vineyards. For endive, winter and summer production have different operations within the same month. These qualifiers should be represented as filters or badges rather than flattened into one national rule."
    ]
  },
  {
    "number": 7,
    "key": "07",
    "name": {
      "en": "July",
      "fr": "Juillet",
      "ar": "يوليو"
    },
    "source": {
      "file": "07-juillet_fr.pdf",
      "institution": "République Algérienne Démocratique et Populaire; Ministère de l’Agriculture et du Développement Rural; Direction de la Formation, de la Recherche et de la Vulgarisation; Institut National de la Vulgarisation Agricole.",
      "documentTitle": "*Calendrier des Opérations Culturales*",
      "language": "French",
      "pdfLength": "13 pages",
      "printedPages": "121–132",
      "extractionStatus": "Complete text extraction reviewed manually; crop names, production contexts, operations, quantities, growth stages, regional qualifiers, and source boundaries retained.",
      "interpretationRule": "`u` means the source’s fertilizer-unit notation and is intentionally not converted into kg. `q/ha` means quintals per hectare. Where the source points to an annex or crop leaflet, the future tool must show that source reference rather than inventing a product, active ingredient, or dose."
    },
    "entries": [
      {
        "id": "m07-001-winter-cereals-durum-wheat-bread-wheat-barley-oats-and-triticale",
        "month": 7,
        "cropKeys": [
          "wheat",
          "barley",
          "oats",
          "triticale"
        ],
        "cropContext": "Winter cereals — durum wheat, bread wheat, barley, oats, and triticale",
        "section": "grandesCultures",
        "operations": [
          "Harvest.",
          "Stubble cultivation (`déchaumage`).",
          "Summer plowing."
        ],
        "actionTypes": [
          "harvest",
          "soil"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 121; PDF page 1.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-002-chickpea",
        "month": 7,
        "cropKeys": [
          "chickpea"
        ],
        "cropContext": "Chickpea",
        "section": "grandesCultures",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 121; PDF page 1.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-003-dry-bean",
        "month": 7,
        "cropKeys": [
          "bean"
        ],
        "cropContext": "Dry bean",
        "section": "grandesCultures",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 121; PDF page 1.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-004-fodder-maize-and-fodder-sorghum",
        "month": 7,
        "cropKeys": [
          "fodder-maize",
          "fodder-sorghum"
        ],
        "cropContext": "Fodder maize and fodder sorghum",
        "section": "forage",
        "operations": [
          "Cut.",
          "Apply nitrogen.",
          "Irrigate."
        ],
        "actionTypes": [
          "fertilization",
          "irrigation"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 121; PDF page 1.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-005-alfalfa-irrigated-production",
        "month": 7,
        "cropKeys": [
          "alfalfa"
        ],
        "cropContext": "Alfalfa — irrigated production",
        "section": "forage",
        "operations": [
          "Second cut, followed by irrigation."
        ],
        "actionTypes": [
          "irrigation"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 121; PDF page 1.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-006-bersim",
        "month": 7,
        "cropKeys": [
          "bersim"
        ],
        "cropContext": "Bersim",
        "section": "forage",
        "operations": [
          "Stubble cultivation.",
          "Summer plowing."
        ],
        "actionTypes": [
          "soil"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 121; PDF page 1.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-007-sunflower",
        "month": 7,
        "cropKeys": [
          "sunflower"
        ],
        "cropContext": "Sunflower",
        "section": "oilseeds",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 122; PDF page 2.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-008-safflower",
        "month": 7,
        "cropKeys": [
          "safflower"
        ],
        "cropContext": "Safflower",
        "section": "oilseeds",
        "operations": [
          "Harvest.",
          "Stubble cultivation.",
          "Summer plowing."
        ],
        "actionTypes": [
          "harvest",
          "soil"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 122; PDF page 2.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-009-rapeseed",
        "month": 7,
        "cropKeys": [
          "rapeseed"
        ],
        "cropContext": "Rapeseed",
        "section": "oilseeds",
        "operations": [
          "Stubble cultivation.",
          "Summer plowing."
        ],
        "actionTypes": [
          "soil"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 122; PDF page 2.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-010-potato-late-season-production",
        "month": 7,
        "cropKeys": [
          "potato"
        ],
        "cropContext": "Potato — late-season production",
        "section": "vegetables",
        "operations": [
          "Prepare the soil.",
          "Apply base fertilizer:",
          "Organic manure: 25–30 t/ha, bovine or ovine manure.",
          "Mineral fertilizer: 80–100 u N/ha, 100–120 u P/ha, and 200–240 u K/ha."
        ],
        "actionTypes": [
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "121–132",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-011-potato-main-season-production",
        "month": 7,
        "cropKeys": [
          "potato"
        ],
        "cropContext": "Potato — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "harvest",
          "cropProtection"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 123; PDF page 3.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-012-market-tomato-main-season-production",
        "month": 7,
        "cropKeys": [
          "market-tomato"
        ],
        "cropContext": "Market tomato — main-season production",
        "section": "vegetables",
        "operations": [
          "Begin harvest.",
          "Crop maintenance: trellising, removal of side shoots, and leaf removal.",
          "Maintenance fertilization:",
          "First and second applications: 60 u N and 50 u K.",
          "Third and fifth applications: 20 u N and 60 u K, as printed.",
          "Irrigation.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "harvest",
          "maintenance",
          "fertilization",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "121–132",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-013-market-tomato-late-season-production",
        "month": 7,
        "cropKeys": [
          "market-tomato"
        ],
        "cropContext": "Market tomato — late-season production",
        "section": "vegetables",
        "operations": [
          "Nursery seed requirement:",
          "Standard seed: 250–300 g/ha.",
          "Hybrid seed: 100–150 g/ha."
        ],
        "actionTypes": [
          "observation"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 123; PDF page 3.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-014-pepper-and-bell-pepper-main-season-production",
        "month": 7,
        "cropKeys": [
          "pepper"
        ],
        "cropContext": "Pepper and bell pepper — main-season production",
        "section": "vegetables",
        "operations": [
          "Begin harvest.",
          "Maintenance fertilization in four applications:",
          "First application before flowering: 40 u N and 30 u K.",
          "Second application at fruit set: 40 u N and 60 u K.",
          "Third application at fruit development: 30 u N and 60 u K.",
          "Fourth application after the first harvest: 20 u N and 60 u K.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 123; PDF page 3, and printed page 124/PDF page 4.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-015-eggplant-main-season-production",
        "month": 7,
        "cropKeys": [
          "eggplant"
        ],
        "cropContext": "Eggplant — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Weed control.",
          "Maintenance fertilization in three applications:",
          "First application: 40 u N/ha.",
          "Second application: 40 u N/ha.",
          "Third application during fruit enlargement: 40 u N/ha and 100 u K/ha.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "weedManagement",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 124; PDF page 4.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-016-cucumber-main-season-production",
        "month": 7,
        "cropKeys": [
          "cucumber"
        ],
        "cropContext": "Cucumber — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Maintenance fertilization in three applications:",
          "First application at flowering: 40 u N/ha.",
          "Second application three weeks after flowering: 40 u N/ha and 50 u K/ha.",
          "Third application during fruit development: 80 u N/ha and 100 u K/ha.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 124; PDF page 4.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-017-green-bean",
        "month": 7,
        "cropKeys": [
          "bean"
        ],
        "cropContext": "Green bean",
        "section": "vegetables",
        "operations": [
          "Main-season production: harvest.",
          "Late-season production: direct sowing."
        ],
        "actionTypes": [
          "harvest",
          "sowing"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 124; PDF page 4.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-018-carrot-and-turnip-high-plateaux",
        "month": 7,
        "cropKeys": [
          "carrot",
          "turnip"
        ],
        "cropContext": "Carrot and turnip — High Plateaux",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Prepare the soil.",
          "Direct-seed planting densities:",
          "Ordinary direct sowing: 1,200,000–1,600,000 plants/ha.",
          "Precision sowing: 2,000,000–2,400,000 plants/ha."
        ],
        "actionTypes": [
          "harvest",
          "soil",
          "sowing"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 124; PDF page 4.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-019-fennel",
        "month": 7,
        "cropKeys": [
          "fennel"
        ],
        "cropContext": "Fennel",
        "section": "vegetables",
        "operations": [
          "Nursery production, direct sowing, or nursery sowing.",
          "Prepare the soil."
        ],
        "actionTypes": [
          "sowing",
          "soil"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 124; PDF page 4.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-020-endive-chicory",
        "month": 7,
        "cropKeys": [
          "endive"
        ],
        "cropContext": "Endive chicory",
        "section": "vegetables",
        "operations": [
          "Winter production:",
          "Nursery sowing at 1.5 kg/ha.",
          "Nursery maintenance.",
          "First half of July: harrowing.",
          "Second half of July: harrowing followed by planting.",
          "Summer production:",
          "Prepare the soil.",
          "Irrigation and phytosanitary protection.",
          "Second half of July: begin harvest."
        ],
        "actionTypes": [
          "sowing",
          "maintenance",
          "soil",
          "irrigation",
          "cropProtection",
          "harvest"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 125; PDF page 5.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-021-artichoke",
        "month": 7,
        "cropKeys": [
          "artichoke"
        ],
        "cropContext": "Artichoke",
        "section": "vegetables",
        "operations": [
          "Apply base fertilizer:",
          "Organic manure: 30–40 t/ha.",
          "Mineral fertilizer: 150 u N/ha, 150 u P/ha, and 350 u K/ha.",
          "Prepare the soil.",
          "Planting in the Algiers region (`Algérois`)."
        ],
        "actionTypes": [
          "fertilization",
          "soil",
          "sowing"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 125; PDF page 5.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-022-pea",
        "month": 7,
        "cropKeys": [
          "pea"
        ],
        "cropContext": "Pea",
        "section": "vegetables",
        "operations": [
          "Maghnia zone:",
          "Sowing at 100–120 kg/ha.",
          "Irrigation according to need.",
          "Irrigated early production:",
          "Prepare the soil.",
          "Apply base fertilizer: 30 u N, 100 u P, and 40 u K/ha."
        ],
        "actionTypes": [
          "sowing",
          "irrigation",
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 125; PDF page 5.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-023-garlic",
        "month": 7,
        "cropKeys": [
          "garlic"
        ],
        "cropContext": "Garlic",
        "section": "vegetables",
        "operations": [
          "Clean the plot."
        ],
        "actionTypes": [
          "weedManagement"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 125; PDF page 5.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-024-cabbage-and-cauliflower-late-season-production",
        "month": 7,
        "cropKeys": [
          "cabbage",
          "cauliflower"
        ],
        "cropContext": "Cabbage and cauliflower — late-season production",
        "section": "vegetables",
        "operations": [
          "Nursery production.",
          "Apply base fertilizer:",
          "Organic manure: 40 t/ha.",
          "Mineral fertilizer: 100–150 u N/ha, 60–80 u P/ha, and 150–200 u K/ha.",
          "Prepare the soil."
        ],
        "actionTypes": [
          "fertilization",
          "soil"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed pages 125–126; PDF pages 5–6.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-025-okra",
        "month": 7,
        "cropKeys": [
          "okra"
        ],
        "cropContext": "Okra",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Irrigate according to need."
        ],
        "actionTypes": [
          "harvest",
          "irrigation"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 126; PDF page 6.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-026-cantaloupe-main-season-production",
        "month": 7,
        "cropKeys": [
          "cantaloupe"
        ],
        "cropContext": "Cantaloupe — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 126; PDF page 6.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-027-zucchini-main-season-production",
        "month": 7,
        "cropKeys": [
          "zucchini"
        ],
        "cropContext": "Zucchini — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Thin the stand.",
          "Maintenance fertilization in two applications:",
          "First application at fruit set: 30 u/ha, as printed without specifying the nutrient element.",
          "Second application 15 days after the first: 30 u N/ha and 20 u K/ha.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "121–132",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-028-zucchini-late-season-production",
        "month": 7,
        "cropKeys": [
          "zucchini"
        ],
        "cropContext": "Zucchini — late-season production",
        "section": "vegetables",
        "operations": [
          "Prepare the soil.",
          "Direct sowing at 3–6 kg/ha.",
          "Irrigation."
        ],
        "actionTypes": [
          "soil",
          "sowing",
          "irrigation"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 127; PDF page 7.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-029-watermelon-and-melon-main-season-production",
        "month": 7,
        "cropKeys": [
          "cantaloupe",
          "watermelon"
        ],
        "cropContext": "Watermelon and melon — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Irrigation."
        ],
        "actionTypes": [
          "harvest",
          "irrigation"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 127; PDF page 7.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-030-onion",
        "month": 7,
        "cropKeys": [
          "onion"
        ],
        "cropContext": "Onion",
        "section": "vegetables",
        "operations": [
          "Apply base fertilizer: 60–80 u N/ha, 100–120 u P/ha, and 180–200 u K/ha.",
          "Prepare the soil.",
          "Harvest the bulbs."
        ],
        "actionTypes": [
          "fertilization",
          "soil",
          "harvest"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 127; PDF page 7.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-031-fava-bean",
        "month": 7,
        "cropKeys": [
          "fava-bean"
        ],
        "cropContext": "Fava bean",
        "section": "vegetables",
        "operations": [
          "Early production, coastal area (`Littoral`):",
          "Prepare the soil.",
          "Apply base fertilizer: 25 u P and 40 u K/ha.",
          "Main-season production:",
          "Harvest.",
          "Clean the plots.",
          "Late-season production, High Plateaux:",
          "Apply base fertilizer: 25 u N, 80 u P, and 40 u K/ha.",
          "Prepare the soil."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "harvest",
          "weedManagement"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 127; PDF page 7.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-032-strawberry",
        "month": 7,
        "cropKeys": [
          "strawberry"
        ],
        "cropContext": "Strawberry",
        "section": "vegetables",
        "operations": [
          "Frigo strawberry plants:",
          "First half of July: layout and ridge formation.",
          "Second half of July: pre-irrigation, plant preparation, planting, and irrigation.",
          "Remove stolons.",
          "Finish harvest for one-year-old plants.",
          "Fresh strawberry plants:",
          "Irrigate according to need.",
          "Remove stolons from one-year-old plants.",
          "Finish harvest."
        ],
        "actionTypes": [
          "sowing",
          "soil",
          "irrigation",
          "harvest"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 127; PDF page 7.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-033-greenhouse-market-tomato",
        "month": 7,
        "cropKeys": [
          "greenhouse-tomato"
        ],
        "cropContext": "Greenhouse market tomato",
        "section": "greenhouse",
        "operations": [
          "Clean the greenhouse."
        ],
        "actionTypes": [
          "observation"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 128; PDF page 8.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-034-greenhouse-pepper-and-bell-pepper",
        "month": 7,
        "cropKeys": [
          "pepper"
        ],
        "cropContext": "Greenhouse pepper and bell pepper",
        "section": "greenhouse",
        "operations": [
          "Finish the harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 128; PDF page 8.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-035-greenhouse-cucumber",
        "month": 7,
        "cropKeys": [
          "cucumber"
        ],
        "cropContext": "Greenhouse cucumber",
        "section": "greenhouse",
        "operations": [
          "Irrigate.",
          "Conduct the final harvest."
        ],
        "actionTypes": [
          "irrigation",
          "harvest"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 128; PDF page 8.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-036-greenhouse-cantaloupe",
        "month": 7,
        "cropKeys": [
          "cantaloupe"
        ],
        "cropContext": "Greenhouse cantaloupe",
        "section": "greenhouse",
        "operations": [
          "Clean the greenhouse."
        ],
        "actionTypes": [
          "observation"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 128; PDF page 8.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-037-greenhouse-eggplant",
        "month": 7,
        "cropKeys": [
          "eggplant"
        ],
        "cropContext": "Greenhouse eggplant",
        "section": "greenhouse",
        "operations": [
          "Harvest.",
          "Clean the greenhouse."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 128; PDF page 8.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-038-additional-greenhouse-pepper-and-bell-pepper-line",
        "month": 7,
        "cropKeys": [
          "pepper"
        ],
        "cropContext": "Additional greenhouse pepper and bell pepper line",
        "section": "greenhouse",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 128; PDF page 8.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-039-processing-tomato",
        "month": 7,
        "cropKeys": [
          "processing-tomato"
        ],
        "cropContext": "Processing tomato",
        "section": "industrial",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 129; PDF page 9.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-040-olive",
        "month": 7,
        "cropKeys": [
          "olive"
        ],
        "cropContext": "Olive",
        "section": "perennials",
        "operations": [
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Continue irrigation: four water applications (`4 lâchées d’eau`).",
          "Continue disc harrowing.",
          "Apply the second nitrogen-fertilizer tranche if it was not completed in June."
        ],
        "actionTypes": [
          "cropProtection",
          "irrigation",
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 130; PDF page 10.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-041-citrus",
        "month": 7,
        "cropKeys": [
          "citrus"
        ],
        "cropContext": "Citrus",
        "section": "perennials",
        "operations": [
          "Continue deep soil preparation and base fertilization.",
          "Continue irrigation.",
          "Hoe at the base of trees.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "fertilization",
          "soil",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 130; PDF page 10.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-042-stone-fruits-apricot-peach-cherry-almond",
        "month": 7,
        "cropKeys": [
          "stone-fruits"
        ],
        "cropContext": "Stone fruits — apricot, peach, cherry, almond",
        "section": "perennials",
        "operations": [
          "Continue disc harrowing or scarification.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Apply the third nitrogen-fertilizer tranche after harvest: 1.25 q/ha.",
          "Continue harvesting.",
          "Begin deep soil preparation and base fertilization for planned new plantings: 10 q/ha of fertilizer.",
          "Conduct chip-budding/grafting (`greffage en écusson`).",
          "Irrigate late peach varieties."
        ],
        "actionTypes": [
          "soil",
          "cropProtection",
          "harvest",
          "fertilization",
          "sowing",
          "irrigation"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed pages 130–131; PDF page 10.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-043-pome-fruits-and-related-trees-apple-pear-quince-pomegranate-loquat",
        "month": 7,
        "cropKeys": [
          "pome-fruits"
        ],
        "cropContext": "Pome fruits and related trees — apple, pear, quince, pomegranate, loquat",
        "section": "perennials",
        "operations": [
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Continue irrigation.",
          "Continue harvesting early and semi-early pears and apples.",
          "Continue deep soil preparation and P–K base fertilization at 10 q/ha.",
          "Incorporate the third nitrogen-fertilizer tranche: 1 q/ha.",
          "Finish loquat harvest.",
          "Disc harrow and prune loquat trees."
        ],
        "actionTypes": [
          "cropProtection",
          "irrigation",
          "harvest",
          "fertilization",
          "soil",
          "maintenance"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 131; PDF page 11.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-044-grapevine-established-vineyard",
        "month": 7,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — established vineyard",
        "section": "perennials",
        "operations": [
          "Continue irrigation.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Tie the shoots.",
          "Work the soil.",
          "Continue preparing wineries and winemaking equipment.",
          "Harvest early table grapes."
        ],
        "actionTypes": [
          "irrigation",
          "cropProtection",
          "soil",
          "harvest"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed page 131; PDF page 11.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m07-045-grapevine-new-vineyard",
        "month": 7,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — new vineyard",
        "section": "perennials",
        "operations": [
          "Conduct physicochemical and nematological soil analysis.",
          "Work the soil.",
          "Irrigate.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Incorporate phospho-potassium fertilizer at 10 q/ha and organic manure at 30–40 t/ha of well-decomposed manure, if possible before deep soil preparation for the planting.",
          "Deep soil preparation for the next planting at 0.70 m to 1 m."
        ],
        "actionTypes": [
          "soil",
          "irrigation",
          "cropProtection",
          "sowing",
          "fertilization"
        ],
        "source": {
          "file": "07-juillet_fr.pdf",
          "printedPages": "printed pages 131–132; PDF pages 11–12.",
          "pdfLength": "13 pages"
        }
      }
    ],
    "sourceNote": [
      "Harvest.",
      "Source location: printed page 129; PDF page 9."
    ],
    "regionalQualifiers": [
      "The source states that vine growth stops and a transition phase begins. It warns about powdery mildew (`oïdium`) and grapevine moth (`vers de la grappe`). It recommends beginning deep soil preparation for the following year’s plantings after spreading well-decomposed manure at 30–40 t/ha and incorporating 10 q PK/ha, with an insecticide against white grubs. The printed source specifies deep preparation to at least 0.70 m using a reversible plow and a tracked tractor of 120 horsepower or more.",
      "Source location: printed page 132; PDF page 12."
    ],
    "companionNote": [
      "| Action type | July examples |",
      "|---|---|",
      "| Harvest | Winter cereals, chickpea, dry bean, sunflower, safflower, potato, market tomato, pepper, eggplant, cucumber, green bean, carrots and turnips, endive, okra, cantaloupe, zucchini, watermelon and melon, onion, fava bean, strawberry, greenhouse crops, processing tomato, stone fruits, early apples and pears, loquat, and early table grapes |",
      "| Soil preparation | Cereal stubble cultivation and summer plowing; late-season potato, zucchini, cabbage/cauliflower, and fava bean; citrus and perennial deep preparation; vineyard preparation for next year |",
      "| Sowing/planting | Late-season green bean and zucchini; High-Plateau carrot/turnip; fennel; endive nursery and planting; Algiers artichoke; Maghnia pea; late-season cabbage/cauliflower nursery; coastal fava bean; strawberry planting; new perennial/vineyard planting preparation |",
      "| Irrigation | Fodder crops; alfalfa; tomato; pepper; eggplant; cucumber; pea; endive; okra; cantaloupe; zucchini; watermelon and melon; strawberry; greenhouse cucumber; olives; citrus; late peaches; pome fruits; established and new vineyards |",
      "| Fertilization | Late-season potato; market tomato maintenance; pepper; eggplant; cucumber; artichoke; cabbage/cauliflower; onion; fava bean; pea; stone fruits; pome fruits; olives; new vineyards |",
      "| Weed and soil-surface management | Cereal and oilseed stubble operations; eggplant weed control; endive nursery harrowing; olive discing; citrus hoeing; stone-fruit discing/scarification; loquat discing; vineyard soil work |",
      "| Crop maintenance | Trellising, side-shoot and leaf removal, thinning, mulching, staking, earthing-up, stolon removal, greenhouse cleaning, shoot tying, loquat pruning, nursery management, and grafting |",
      "| Crop protection | Annex or crop-leaflet references; July source note names powdery mildew, grapevine moth, and white grubs; no unsupported product recommendation from this PDF alone |",
      "| Soil testing | Physicochemical and nematological testing for new vineyards; new-planting and perennial soil preparation; late-season tomato treatment after soil analysis is specified in the prior month’s context rather than July’s text |",
      "| Climate and regional risk | High Plateaux carrot/turnip and late fava bean; Maghnia pea; coastal early fava bean; vine transition phase, powdery mildew, grapevine moth, and white-grub risk |"
    ],
    "uncertaintyNotes": [
      "The July source includes several qualifiers that must remain explicit in the interactive tool. Carrot and turnip planting is associated with the High Plateaux. Pea is separated into the Maghnia zone and irrigated early production. Fava bean has distinct coastal early, main-season, and High-Plateau late-season programs. Artichoke planting is assigned to the Algiers region. Strawberry is separated by frigo and fresh plant material under outdoor plastic mulch. For perennial crops, the source distinguishes established production from new planting, and for vineyards it distinguishes production vineyards from new vineyards."
    ]
  },
  {
    "number": 8,
    "key": "08",
    "name": {
      "en": "August",
      "fr": "Août",
      "ar": "أغسطس"
    },
    "source": {
      "file": "08-aout_fr.pdf",
      "institution": "République Algérienne Démocratique et Populaire; Ministère de l’Agriculture et du Développement Rural; Direction de la Formation, de la Recherche et de la Vulgarisation; Institut National de la Vulgarisation Agricole.",
      "documentTitle": "*Calendrier des Opérations Culturales*",
      "language": "French",
      "pdfLength": "11 pages",
      "printedPages": "133–142",
      "extractionStatus": "Complete text extraction reviewed manually; crop names, production contexts, operations, quantities, growth stages, regional qualifiers, and source boundaries retained.",
      "interpretationRule": "`u` means the source’s fertilizer-unit notation and is intentionally not converted into kg. `q/ha` means quintals per hectare. Where the source points to an annex or phytosanitary calendar, the future tool must show that source reference rather than inventing a product, active ingredient, or dose."
    },
    "entries": [
      {
        "id": "m08-001-winter-cereals-durum-wheat-bread-wheat-barley-oats-and-triticale",
        "month": 8,
        "cropKeys": [
          "wheat",
          "barley",
          "oats",
          "triticale"
        ],
        "cropContext": "Winter cereals — durum wheat, bread wheat, barley, oats, and triticale",
        "section": "grandesCultures",
        "operations": [
          "Summer plowing."
        ],
        "actionTypes": [
          "soil"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 133; PDF page 1.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-002-food-legumes-lentil-chickpea-dry-pea-fava-bean-and-bean",
        "month": 8,
        "cropKeys": [
          "lentil",
          "chickpea",
          "fava-bean",
          "pea"
        ],
        "cropContext": "Food legumes — lentil, chickpea, dry pea, fava bean, and bean",
        "section": "grandesCultures",
        "operations": [
          "Summer plowing."
        ],
        "actionTypes": [
          "soil"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 133; PDF page 1.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-003-fodder-sorghum-and-fodder-maize",
        "month": 8,
        "cropKeys": [
          "fodder-maize",
          "fodder-sorghum"
        ],
        "cropContext": "Fodder sorghum and fodder maize",
        "section": "grandesCultures",
        "operations": [
          "Cut.",
          "Apply nitrogen.",
          "Irrigate."
        ],
        "actionTypes": [
          "fertilization",
          "irrigation"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 133; PDF page 1.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-004-alfalfa-irrigated-production",
        "month": 8,
        "cropKeys": [
          "alfalfa"
        ],
        "cropContext": "Alfalfa — irrigated production",
        "section": "grandesCultures",
        "operations": [
          "Third cut, followed by irrigation."
        ],
        "actionTypes": [
          "irrigation"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 133; PDF page 1.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-005-bersim",
        "month": 8,
        "cropKeys": [
          "bersim"
        ],
        "cropContext": "Bersim",
        "section": "grandesCultures",
        "operations": [
          "Apply base fertilizer.",
          "Plow."
        ],
        "actionTypes": [
          "fertilization",
          "soil"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 133; PDF page 1.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-006-sunflower",
        "month": 8,
        "cropKeys": [
          "sunflower"
        ],
        "cropContext": "Sunflower",
        "section": "grandesCultures",
        "operations": [
          "Finish harvest.",
          "Plow."
        ],
        "actionTypes": [
          "harvest",
          "soil"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 133; PDF page 1.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-007-safflower",
        "month": 8,
        "cropKeys": [
          "safflower"
        ],
        "cropContext": "Safflower",
        "section": "grandesCultures",
        "operations": [
          "Plow."
        ],
        "actionTypes": [
          "soil"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 133; PDF page 1.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-008-potato-late-season-production",
        "month": 8,
        "cropKeys": [
          "potato"
        ],
        "cropContext": "Potato — late-season production",
        "section": "vegetables",
        "operations": [
          "Prepare the soil.",
          "Conduct nematological soil analysis.",
          "Pre-sprout seed tubers for 2–3 weeks.",
          "Plant at 25–27 q/ha.",
          "Weed control."
        ],
        "actionTypes": [
          "soil",
          "sowing",
          "weedManagement"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "133–142",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-009-potato-main-season-production",
        "month": 8,
        "cropKeys": [
          "potato"
        ],
        "cropContext": "Potato — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 134; PDF page 2.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-010-market-tomato-main-season-production",
        "month": 8,
        "cropKeys": [
          "market-tomato"
        ],
        "cropContext": "Market tomato — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest and clean the plot.",
          "Begin harvest in the eastern region."
        ],
        "actionTypes": [
          "harvest",
          "weedManagement"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "133–142",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-011-market-tomato-late-season-production",
        "month": 8,
        "cropKeys": [
          "market-tomato"
        ],
        "cropContext": "Market tomato — late-season production",
        "section": "vegetables",
        "operations": [
          "Planting."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 134; PDF page 2.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-012-onion",
        "month": 8,
        "cropKeys": [
          "onion"
        ],
        "cropContext": "Onion",
        "section": "vegetables",
        "operations": [
          "Nursery sowing at 4–7 kg/ha.",
          "Apply base fertilizer: 60–80 u N/ha, 100–120 u P/ha, and 180–200 u K/ha.",
          "Bulb planting at 40–50 plants/m²; prepare the soil.",
          "Harvest bulbs."
        ],
        "actionTypes": [
          "sowing",
          "fertilization",
          "soil",
          "harvest"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 134; PDF page 2.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-013-pepper-and-bell-pepper-main-season-production",
        "month": 8,
        "cropKeys": [
          "pepper"
        ],
        "cropContext": "Pepper and bell pepper — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Maintenance fertilization in four applications:",
          "First application before flowering: 40 u N and 30 u K.",
          "Second application at fruit set: 40 u N and 60 u K.",
          "Third application at fruit development: 30 u N and 60 u K.",
          "Fourth application after the first harvest: 20 u N and 60 u K.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed pages 134–135; PDF pages 2–3.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-014-eggplant-main-season-production",
        "month": 8,
        "cropKeys": [
          "eggplant"
        ],
        "cropContext": "Eggplant — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Maintenance fertilization in three applications:",
          "First application: 40 u N/ha.",
          "Second application: 40 u N/ha.",
          "Third application during fruit enlargement: 40 u N/ha and 100 u K/ha.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 135; PDF page 3.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-015-cabbage-and-cauliflower-late-season-production",
        "month": 8,
        "cropKeys": [
          "cabbage",
          "cauliflower"
        ],
        "cropContext": "Cabbage and cauliflower — late-season production",
        "section": "vegetables",
        "operations": [
          "Plant at 15,000–21,000 plants/ha.",
          "Irrigate."
        ],
        "actionTypes": [
          "sowing",
          "irrigation"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 135; PDF page 3.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-016-cucumber-main-season-production",
        "month": 8,
        "cropKeys": [
          "cucumber"
        ],
        "cropContext": "Cucumber — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest and clean the plot."
        ],
        "actionTypes": [
          "harvest",
          "weedManagement"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 135; PDF page 3.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-017-okra",
        "month": 8,
        "cropKeys": [
          "okra"
        ],
        "cropContext": "Okra",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Irrigate."
        ],
        "actionTypes": [
          "harvest",
          "irrigation"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed pages 135–136; PDF pages 3–4.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-018-zucchini-main-season-production",
        "month": 8,
        "cropKeys": [
          "zucchini"
        ],
        "cropContext": "Zucchini — main-season production",
        "section": "vegetables",
        "operations": [
          "Clean the plot."
        ],
        "actionTypes": [
          "weedManagement"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "133–142",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-019-zucchini-late-season-production",
        "month": 8,
        "cropKeys": [
          "zucchini"
        ],
        "cropContext": "Zucchini — late-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Weed and thin the stand.",
          "Maintenance fertilization in two applications:",
          "First application at fruit set: 30 u/ha, as printed without specifying the nutrient element.",
          "Second application 15 days after the first: 30 u N/ha and 20 u K/ha.",
          "Irrigation.",
          "Phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "weedManagement",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 136; PDF page 4.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-020-watermelon-and-melon-main-season-production",
        "month": 8,
        "cropKeys": [
          "cantaloupe",
          "watermelon"
        ],
        "cropContext": "Watermelon and melon — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Irrigation."
        ],
        "actionTypes": [
          "harvest",
          "irrigation"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 136; PDF page 4.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-021-green-bean",
        "month": 8,
        "cropKeys": [
          "bean"
        ],
        "cropContext": "Green bean",
        "section": "vegetables",
        "operations": [
          "Main-season production: harvest.",
          "Late-season production: direct sowing."
        ],
        "actionTypes": [
          "harvest",
          "sowing"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 136; PDF page 4.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-022-fennel",
        "month": 8,
        "cropKeys": [
          "fennel"
        ],
        "cropContext": "Fennel",
        "section": "vegetables",
        "operations": [
          "Nursery production, direct sowing, or nursery sowing.",
          "Prepare the soil.",
          "Plant at 80,000–120,000 plants/ha."
        ],
        "actionTypes": [
          "sowing",
          "soil"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 136; PDF page 4.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-023-cardoon",
        "month": 8,
        "cropKeys": [
          "cardoon"
        ],
        "cropContext": "Cardoon",
        "section": "vegetables",
        "operations": [
          "Plow and incorporate base fertilizer: 30 u N, 90 u P, and 40 u K/ha."
        ],
        "actionTypes": [
          "fertilization",
          "soil"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 137; PDF page 5.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-024-endive-chicory",
        "month": 8,
        "cropKeys": [
          "endive"
        ],
        "cropContext": "Endive chicory",
        "section": "vegetables",
        "operations": [
          "Winter production:",
          "Nursery sowing at 1.5 kg/ha.",
          "Planting.",
          "Summer production:",
          "Blanching until mid-August.",
          "Harvest.",
          "Irrigate until August according to need."
        ],
        "actionTypes": [
          "sowing",
          "weedManagement",
          "harvest",
          "irrigation"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 137; PDF page 5.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-025-artichoke",
        "month": 8,
        "cropKeys": [
          "artichoke"
        ],
        "cropContext": "Artichoke",
        "section": "vegetables",
        "operations": [
          "Planting."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 137; PDF page 5.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-026-pea",
        "month": 8,
        "cropKeys": [
          "pea"
        ],
        "cropContext": "Pea",
        "section": "vegetables",
        "operations": [
          "Irrigated early production:",
          "Sow from the 15th of August at 100–120 kg/ha.",
          "Maghnia zone:",
          "Sow until the 15th of August at 100–120 kg/ha.",
          "Hoe and earth up.",
          "Irrigate according to need."
        ],
        "actionTypes": [
          "irrigation",
          "sowing"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 137; PDF page 5.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-027-fava-bean",
        "month": 8,
        "cropKeys": [
          "fava-bean"
        ],
        "cropContext": "Fava bean",
        "section": "vegetables",
        "operations": [
          "Prepare the soil.",
          "Apply base fertilizer:",
          "Well-decomposed organic manure: 15–20 t/ha.",
          "Mineral fertilizer: 20 u N/ha, 60–70 u P/ha, and 80–90 u K/ha."
        ],
        "actionTypes": [
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 137; PDF page 5.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-028-strawberry",
        "month": 8,
        "cropKeys": [
          "strawberry"
        ],
        "cropContext": "Strawberry",
        "section": "vegetables",
        "operations": [
          "Apply base fertilizer:",
          "Organic manure: 50 t/ha.",
          "Mineral fertilizer: 150 u N/ha, 80 u P/ha, and 100 u K/ha.",
          "Prepare the soil."
        ],
        "actionTypes": [
          "fertilization",
          "soil"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 137; PDF page 5.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-029-cantaloupe-main-season-production",
        "month": 8,
        "cropKeys": [
          "cantaloupe"
        ],
        "cropContext": "Cantaloupe — main-season production",
        "section": "vegetables",
        "operations": [
          "Clean the plot."
        ],
        "actionTypes": [
          "weedManagement"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 137; PDF page 5.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-030-carrot-and-turnip-high-plateaux",
        "month": 8,
        "cropKeys": [
          "carrot",
          "turnip"
        ],
        "cropContext": "Carrot and turnip — High Plateaux",
        "section": "vegetables",
        "operations": [
          "Prepare the plot.",
          "Direct-seed planting densities:",
          "Ordinary direct sowing: 1,200,000–1,600,000 plants/ha.",
          "Precision sowing: 2,000,000–2,400,000 plants/ha.",
          "Harvest."
        ],
        "actionTypes": [
          "sowing",
          "harvest"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 137; PDF page 5.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-031-greenhouse-market-tomato-biskra-nursery-and-late-season-setup",
        "month": 8,
        "cropKeys": [
          "greenhouse-tomato"
        ],
        "cropContext": "Greenhouse market tomato — Biskra nursery and late-season setup",
        "section": "greenhouse",
        "operations": [
          "Nursery in Biskra:",
          "Standard seed: 250–300 g/ha.",
          "Hybrid seed: 100–150 g/ha.",
          "Apply combined organic and mineral base fertilizer:",
          "Manure: 30–40 t/ha.",
          "Mineral fertilizer: 180 u N/ha, 70 u P/ha, and 200–250 u K/ha.",
          "Prepare the soil.",
          "Disinfect the soil."
        ],
        "actionTypes": [
          "fertilization",
          "soil"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 138; PDF page 6.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-032-greenhouse-pepper-and-bell-pepper-biskra-nursery",
        "month": 8,
        "cropKeys": [
          "pepper"
        ],
        "cropContext": "Greenhouse pepper and bell pepper — Biskra nursery",
        "section": "greenhouse",
        "operations": [
          "Nursery in Biskra.",
          "Apply base fertilizer:",
          "Organic manure: 30–35 t/ha.",
          "Mineral fertilizer: 180–200 u N/ha, 80–100 u P/ha, and 200–250 u K/ha.",
          "Prepare the soil.",
          "Disinfect the soil."
        ],
        "actionTypes": [
          "fertilization",
          "soil"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 138; PDF page 6.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-033-greenhouse-cucumber-biskra-nursery",
        "month": 8,
        "cropKeys": [
          "cucumber"
        ],
        "cropContext": "Greenhouse cucumber — Biskra nursery",
        "section": "greenhouse",
        "operations": [
          "Nursery in Biskra.",
          "Apply base fertilizer:",
          "Organic manure: 30–35 t/ha.",
          "Mineral fertilizer: 170–200 u N/ha, 100–150 u P/ha, and 200–250 u K/ha.",
          "Prepare the soil.",
          "Disinfect the soil."
        ],
        "actionTypes": [
          "fertilization",
          "soil"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 138; PDF page 6.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-034-greenhouse-strawberry",
        "month": 8,
        "cropKeys": [
          "strawberry"
        ],
        "cropContext": "Greenhouse strawberry",
        "section": "greenhouse",
        "operations": [
          "Apply base fertilizer:",
          "Organic manure: 50 t/ha.",
          "Mineral fertilizer: 150 u N/ha, 80 u P/ha, and 100 u K/ha.",
          "Prepare the soil.",
          "Disinfect the soil."
        ],
        "actionTypes": [
          "fertilization",
          "soil"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 138; PDF page 6.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-035-processing-tomato",
        "month": 8,
        "cropKeys": [
          "processing-tomato"
        ],
        "cropContext": "Processing tomato",
        "section": "industrial",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 139; PDF page 7.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-036-olive",
        "month": 8,
        "cropKeys": [
          "olive"
        ],
        "cropContext": "Olive",
        "section": "perennials",
        "operations": [
          "Spread base fertilizer followed by deep soil preparation.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Continue irrigation: five water applications (`5 lâchées d’eau`).",
          "Begin table-olive harvest in the western region.",
          "Prepare the seedbed and substrate for soilless nursery production.",
          "Sow olive pits at 3–5 kg/m². The source names wild olive (`oléastre`) and varieties such as Chemlal or Frontoio, the latter described as a small-pit variety."
        ],
        "actionTypes": [
          "fertilization",
          "soil",
          "cropProtection",
          "irrigation",
          "harvest",
          "sowing"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 140; PDF page 8.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-037-citrus",
        "month": 8,
        "cropKeys": [
          "citrus"
        ],
        "cropContext": "Citrus",
        "section": "perennials",
        "operations": [
          "Continue deep soil preparation and base fertilization at 10 q/ha.",
          "Continue disc harrowing.",
          "Apply the third nitrogen tranche at one-quarter of the dose, stated as 1.5 q/ha.",
          "Continue irrigation.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "fertilization",
          "soil",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 140; PDF page 8.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-038-stone-fruits-apricot-peach-cherry-and-almond",
        "month": 8,
        "cropKeys": [
          "stone-fruits"
        ],
        "cropContext": "Stone fruits — apricot, peach, cherry, and almond",
        "section": "perennials",
        "operations": [
          "Continue deep soil preparation.",
          "Continue base fertilization.",
          "Irrigate.",
          "Remove branches affected by gummosis using large cuts.",
          "Subsoil to break the plow pan.",
          "Disc harrow where weeds appear.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "irrigation",
          "weedManagement",
          "cropProtection"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed pages 140–141; PDF pages 8–9.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-039-pome-fruits-and-related-trees-apple-pear-quince-pomegranate-and-loquat",
        "month": 8,
        "cropKeys": [
          "pome-fruits"
        ],
        "cropContext": "Pome fruits and related trees — apple, pear, quince, pomegranate, and loquat",
        "section": "perennials",
        "operations": [
          "Continue pear and apple harvest.",
          "Continue irrigation.",
          "Continue deep soil preparation and base fertilization.",
          "Prepare the plot through leveling and disc harrowing.",
          "Drain if necessary on heavy soil.",
          "Continue pruning loquat.",
          "Apply phospho-potassium fertilizer to loquat at 5 q/ha.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "harvest",
          "irrigation",
          "fertilization",
          "soil",
          "maintenance",
          "cropProtection"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 141; PDF page 9.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-040-grapevine-established-production-vineyard",
        "month": 8,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — established production vineyard",
        "section": "perennials",
        "operations": [
          "Continue irrigation.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Work the soil.",
          "Remove leaves around table grapes if necessary.",
          "Harvest in-season table grapes.",
          "Continue preparing cellars and winemaking equipment.",
          "Monitor maturity.",
          "Prepare fermentation vats and begin the grape harvest/vintage."
        ],
        "actionTypes": [
          "irrigation",
          "cropProtection",
          "soil",
          "harvest"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 141; PDF page 9.",
          "pdfLength": "11 pages"
        }
      },
      {
        "id": "m08-041-grapevine-new-vineyard",
        "month": 8,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — new vineyard",
        "section": "perennials",
        "operations": [
          "Work the soil.",
          "Irrigate.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Continue deep soil preparation.",
          "Conduct Mallorcan grafting (`greffage à la mayorquine`) on young rooted plants."
        ],
        "actionTypes": [
          "soil",
          "irrigation",
          "cropProtection",
          "sowing"
        ],
        "source": {
          "file": "08-aout_fr.pdf",
          "printedPages": "printed page 142; PDF page 10.",
          "pdfLength": "11 pages"
        }
      }
    ],
    "sourceNote": [
      "The source states that August is the month of root maturation. It says the harvest–winemaking campaign should begin and proceed under good conditions, together with the harvest of table grapes. This is an operational priority rather than a universal prescription for every vineyard.",
      "Source location: printed page 142; PDF page 10."
    ],
    "regionalQualifiers": [
      "The August source includes several qualifiers that must remain explicit in the interactive tool. Potato late-season preparation includes a nematological soil analysis and a 2–3-week pre-germination period. The eastern region is named for the beginning of market-tomato harvest, while Biskra is named for greenhouse nurseries of tomato, pepper, and cucumber. Carrot and turnip operations are associated with the High Plateaux, pea operations with the Maghnia zone and irrigated early production, table-olive harvest with the western region, and the grapevine section with distinct established and new-vineyard programs."
    ],
    "companionNote": [
      "The August source describes monthly operations by crop, production cycle, region, and perennial status but does not provide explicit companion-planting or intercropping compatibility rules. The future calendar may show that two crops have operations in the same month, but this must be labeled as **same-month activity overlap**, not biological compatibility. Verified companion planting should come only from a separate source or a clearly labeled agronomic rule set."
    ],
    "uncertaintyNotes": [
      "The August calendar is an operational monthly guide, not a complete irrigation calculator, soil-test interpretation, phytosanitary product registry, disease forecast, or companion-planting database. FormulaAtlas can combine these monthly operations with its existing lifecycle, irrigation, nutrient, weather, INPV, field-record, and simulator tools, but the UI must distinguish source-derived values from user inputs and calculated recommendations.",
      "Several source details should remain visible as review notes before becoming prescriptive UI: the zucchini first maintenance application is printed as `30 u/ha` without a nutrient element; citrus describes the third nitrogen tranche as one-quarter of the dose and 1.5 q/ha; olive-pit sowing uses kg/m²; the source’s terms `greffage à la mayorquine`, `plants racinés`, `lâchées d’eau`, and `hors sol` need localized explanations; and phytosanitary operations should link to the annexed calendar and FormulaAtlas’s safety gate rather than inventing a treatment."
    ]
  },
  {
    "number": 9,
    "key": "09",
    "name": {
      "en": "September",
      "fr": "Septembre",
      "ar": "سبتمبر"
    },
    "source": {
      "file": "09-septembre_fr.pdf",
      "institution": "République Algérienne et Populaire; Ministère de l’Agriculture et du Développement Rural; Direction de la Formation, de la Recherche et de la Vulgarisation; Institut National de la Vulgarisation Agricole.",
      "documentTitle": "*Calendrier des Opérations Culturales*",
      "language": "French",
      "pdfLength": "14 pages",
      "printedPages": "143–155",
      "extractionStatus": "Complete text extraction reviewed manually; crop names, production contexts, operations, quantities, growth-stage timing, regional qualifiers, and source boundaries retained.",
      "interpretationRule": "`u` means the source’s fertilizer-unit notation and is intentionally not converted into kg. `q/ha` means quintals per hectare. Where the source points to an annex, crop leaflet, or phytosanitary calendar, the future tool must show that source reference rather than inventing a product, active ingredient, or dose."
    },
    "entries": [
      {
        "id": "m09-001-winter-cereals-durum-wheat-and-bread-wheat",
        "month": 9,
        "cropKeys": [
          "wheat"
        ],
        "cropContext": "Winter cereals — durum wheat and bread wheat",
        "section": "grandesCultures",
        "operations": [
          "Apply base fertilizer in the coastal zones: 92 u/ha of phosphorus, stated as 2 q of TSP, and 50 u/ha of potash (K).",
          "Apply base fertilizer in the sub-coastal zones and High Plateaux: 46 u/ha of phosphorus and 50 u/ha of potash (K).",
          "Resume or finish the summer plowing sequence.",
          "Prepare the seedbed."
        ],
        "actionTypes": [
          "fertilization",
          "soil",
          "sowing"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 143; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-002-winter-cereals-barley-and-oats",
        "month": 9,
        "cropKeys": [
          "barley",
          "oats"
        ],
        "cropContext": "Winter cereals — barley and oats",
        "section": "grandesCultures",
        "operations": [
          "Apply base fertilizer in the coastal zones: 69 u/ha of phosphorus and 50 u/ha of potash (K).",
          "Apply base fertilizer in the sub-coastal zones and High Plateaux: 46 u/ha of phosphorus and 50 u/ha of potash (K).",
          "Resume or finish the summer plowing sequence.",
          "Prepare the seedbed."
        ],
        "actionTypes": [
          "fertilization",
          "soil",
          "sowing"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 143; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-003-food-legumes-lentil-chickpea-bean-fava-bean-and-dry-pea",
        "month": 9,
        "cropKeys": [
          "lentil",
          "chickpea",
          "fava-bean",
          "pea"
        ],
        "cropContext": "Food legumes — lentil, chickpea, bean, fava bean, and dry pea",
        "section": "grandesCultures",
        "operations": [
          "Apply base fertilizer: 92 u/ha of phosphorus and 50 u/ha of potash.",
          "Resume plowing.",
          "Prepare the seedbed."
        ],
        "actionTypes": [
          "fertilization",
          "soil",
          "sowing"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed pages 143–144; PDF pages 1–2.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-004-vetchoat-peaoat-and-peatriticale-mixtures",
        "month": 9,
        "cropKeys": [
          "oats",
          "triticale",
          "forage-mixture"
        ],
        "cropContext": "Vetch–oat, pea–oat, and pea–triticale mixtures",
        "section": "grandesCultures",
        "operations": [
          "Apply base fertilizer.",
          "Resume plowing.",
          "Prepare the seedbed."
        ],
        "actionTypes": [
          "fertilization",
          "soil",
          "sowing"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 144; PDF page 2.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-005-bersim",
        "month": 9,
        "cropKeys": [
          "bersim"
        ],
        "cropContext": "Bersim",
        "section": "grandesCultures",
        "operations": [
          "Dryland: plow and apply base fertilizer at 140 u/ha of phosphorus and 70 u/ha of potash.",
          "Irrigated: resume plowing, prepare the seedbed, sow at 30–40 kg/ha, roll the seedbed, and irrigate."
        ],
        "actionTypes": [
          "fertilization",
          "soil",
          "sowing",
          "irrigation"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 144; PDF page 2.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-006-alfalfa",
        "month": 9,
        "cropKeys": [
          "alfalfa"
        ],
        "cropContext": "Alfalfa",
        "section": "grandesCultures",
        "operations": [
          "Dryland: apply base fertilizer at 140 u/ha of phosphorus and 100 u/ha of potash; resume plowing; and prepare the seedbed.",
          "Irrigated: make the next cut followed by irrigation. Plow if this is the first installation."
        ],
        "actionTypes": [
          "sowing",
          "fertilization",
          "soil",
          "irrigation"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 144; PDF page 2.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-007-italian-ryegrass",
        "month": 9,
        "cropKeys": [
          "italian-ryegrass"
        ],
        "cropContext": "Italian ryegrass",
        "section": "grandesCultures",
        "operations": [
          "Apply base fertilizer at 90 u/ha of phosphorus and 100 u/ha of potash.",
          "Plow."
        ],
        "actionTypes": [
          "fertilization",
          "soil"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 145; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-008-fodder-sorghum",
        "month": 9,
        "cropKeys": [
          "fodder-sorghum"
        ],
        "cropContext": "Fodder sorghum",
        "section": "grandesCultures",
        "operations": [
          "Make the final cut.",
          "Incorporate the stalks into the soil.",
          "Plow."
        ],
        "actionTypes": [
          "soil"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 145; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-009-fodder-maize",
        "month": 9,
        "cropKeys": [
          "fodder-maize"
        ],
        "cropContext": "Fodder maize",
        "section": "grandesCultures",
        "operations": [
          "Plow."
        ],
        "actionTypes": [
          "soil"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 145; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-010-sunflower",
        "month": 9,
        "cropKeys": [
          "sunflower"
        ],
        "cropContext": "Sunflower",
        "section": "grandesCultures",
        "operations": [
          "Plow.",
          "Apply base fertilizer at 46 u/ha of phosphorus and 100 u/ha of potash."
        ],
        "actionTypes": [
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 145; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-011-rapeseed",
        "month": 9,
        "cropKeys": [
          "rapeseed"
        ],
        "cropContext": "Rapeseed",
        "section": "grandesCultures",
        "operations": [
          "Plow.",
          "Apply base fertilizer at 92 u/ha of phosphorus, 100 u/ha of potash, and 60 u/ha of nitrogen. The source specifies that the nitrogen is applied before sowing."
        ],
        "actionTypes": [
          "soil",
          "sowing",
          "fertilization"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 145; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-012-safflower",
        "month": 9,
        "cropKeys": [
          "safflower"
        ],
        "cropContext": "Safflower",
        "section": "grandesCultures",
        "operations": [
          "Plow.",
          "Apply base fertilizer at 30–50 u/ha of phosphorus and 30–50 u/ha of potash.",
          "Resume or finish the plowing sequence."
        ],
        "actionTypes": [
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 145; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-013-potato-late-season-production",
        "month": 9,
        "cropKeys": [
          "potato"
        ],
        "cropContext": "Potato — late-season production",
        "section": "vegetables",
        "operations": [
          "Plant at 25–27 q/ha.",
          "Irrigate.",
          "Apply maintenance fertilizer one month after planting:",
          "1.5 q of 46% urea.",
          "2 q of 48% potassium sulfate.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Apply chemical weed control."
        ],
        "actionTypes": [
          "sowing",
          "irrigation",
          "fertilization",
          "maintenance",
          "cropProtection",
          "weedManagement"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 146; PDF page 4.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-014-potato-early-primeur-production",
        "month": 9,
        "cropKeys": [
          "potato"
        ],
        "cropContext": "Potato — early/primeur production",
        "section": "vegetables",
        "operations": [
          "Pre-germinate seed tubers for 2–3 weeks before planting.",
          "Prepare the soil.",
          "Apply base fertilizer:",
          "Organic: 25–30 t/ha of bovine or ovine manure.",
          "Mineral: 80–100 u of N/ha, 100–120 u of P/ha, and 200–240 u of K/ha."
        ],
        "actionTypes": [
          "sowing",
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 146; PDF page 4.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-015-onion",
        "month": 9,
        "cropKeys": [
          "onion"
        ],
        "cropContext": "Onion",
        "section": "vegetables",
        "operations": [
          "Sow in a nursery at 4–7 kg/ha.",
          "Plant bulbs at 9–12 bulbils per linear metre, equivalent to 7.5–8 q/ha according to the source.",
          "Prepare the soil.",
          "Apply combined organic and mineral fertilizer:",
          "60–80 u of N/ha.",
          "100–120 u of P/ha.",
          "180–200 u/ha in the source’s final line, where the nutrient designation is missing in the extracted text and should remain a source-review item rather than being silently corrected.",
          "Harvest bulbs."
        ],
        "actionTypes": [
          "sowing",
          "soil",
          "fertilization",
          "harvest"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed pages 146–147; PDF pages 4–5.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-016-market-tomato-main-season-production",
        "month": 9,
        "cropKeys": [
          "market-tomato"
        ],
        "cropContext": "Market tomato — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest in the eastern region."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 147; PDF page 5.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-017-market-tomato-late-season-production",
        "month": 9,
        "cropKeys": [
          "market-tomato"
        ],
        "cropContext": "Market tomato — late-season production",
        "section": "vegetables",
        "operations": [
          "Plant at 20,000–28,000 plants/ha.",
          "Apply maintenance fertilizer according to the source’s stated sequence:",
          "First and second applications: 60 u of N and 50 u of K.",
          "Third and fifth applications: 20 u of N and 60 u of K."
        ],
        "actionTypes": [
          "sowing",
          "fertilization",
          "maintenance"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 147; PDF page 5.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-018-carrot-and-turnip",
        "month": 9,
        "cropKeys": [
          "carrot",
          "turnip"
        ],
        "cropContext": "Carrot and turnip",
        "section": "vegetables",
        "operations": [
          "Prepare the soil.",
          "Use direct sowing at the following densities:",
          "Ordinary direct sowing: 1,200,000–1,600,000 plants/ha.",
          "Precision sowing: 2,000,000–2,400,000 plants/ha.",
          "Apply base fertilizer. Organic fertilizer is described as not recommended or only weakly recommended in the source.",
          "Apply mineral fertilizer at 150–200 u of N/ha, 200–250 u of K/ha, and 100–120 u of P/ha as Super 46%.",
          "Harvest."
        ],
        "actionTypes": [
          "soil",
          "sowing",
          "fertilization",
          "harvest"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 147; PDF page 5.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-019-pepper-and-bell-pepper-main-season-production",
        "month": 9,
        "cropKeys": [
          "pepper"
        ],
        "cropContext": "Pepper and bell pepper — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest in the High Plateaux.",
          "Apply maintenance fertilizer in four applications:",
          "First application before flowering: 40 u of N and 30 u of K.",
          "Second application at fruit set: 40 u of N and 60 u of K.",
          "Third application at fruit development: 30 u of N and 60 u of K.",
          "Fourth application after the first harvest: 20 u of N and 60 u of K.",
          "Irrigate.",
          "Carry out crop maintenance.",
          "Apply phytosanitary treatments against fungal diseases if necessary."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed pages 147–148; PDF pages 5–6.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-020-cabbage-and-cauliflower-late-season-production",
        "month": 9,
        "cropKeys": [
          "cabbage",
          "cauliflower"
        ],
        "cropContext": "Cabbage and cauliflower — late-season production",
        "section": "vegetables",
        "operations": [
          "Irrigate.",
          "Apply maintenance fertilizer in two applications of 20 u of N:",
          "First application one month after planting.",
          "Second application 20 days after the first.",
          "Apply phytosanitary treatments against cabbage white butterflies, aphids, and noctuid moths."
        ],
        "actionTypes": [
          "irrigation",
          "fertilization",
          "maintenance",
          "sowing",
          "cropProtection"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 148; PDF page 6.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-021-okra",
        "month": 9,
        "cropKeys": [
          "okra"
        ],
        "cropContext": "Okra",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Irrigate according to need."
        ],
        "actionTypes": [
          "harvest",
          "irrigation"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 148; PDF page 6.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-022-zucchini-late-season-production",
        "month": 9,
        "cropKeys": [
          "zucchini"
        ],
        "cropContext": "Zucchini — late-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Irrigate.",
          "Apply maintenance fertilizer in two applications:",
          "First application at fruit set: 30 u/ha, with the nutrient element not identified in the source text.",
          "Second application 15 days after the first: 30 u of N/ha and 20 u of K/ha.",
          "Maintain the crop through hoeing and thinning."
        ],
        "actionTypes": [
          "harvest",
          "irrigation",
          "fertilization",
          "maintenance",
          "weedManagement"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 148; PDF page 6.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-023-eggplant-main-season-production",
        "month": 9,
        "cropKeys": [
          "eggplant"
        ],
        "cropContext": "Eggplant — main-season production",
        "section": "vegetables",
        "operations": [
          "Finish the harvest.",
          "Remove harvest residues."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed pages 148–149; PDF pages 6–7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-024-garlic",
        "month": 9,
        "cropKeys": [
          "garlic"
        ],
        "cropContext": "Garlic",
        "section": "vegetables",
        "operations": [
          "Prepare the soil.",
          "Conduct a nematological soil analysis.",
          "Disinfect the soil.",
          "Phytosanitary treatments: refer to the annexed garlic leaflet.",
          "Apply base fertilizer at 80 u of N/ha, 50 u of P/ha, and 150 u of K/ha.",
          "Irrigate."
        ],
        "actionTypes": [
          "soil",
          "cropProtection",
          "fertilization",
          "irrigation"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 149; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-025-fennel",
        "month": 9,
        "cropKeys": [
          "fennel"
        ],
        "cropContext": "Fennel",
        "section": "vegetables",
        "operations": [
          "Use direct sowing or nursery production.",
          "Plant at 80,000–120,000 plants/ha.",
          "Prepare the soil.",
          "Carry out crop maintenance."
        ],
        "actionTypes": [
          "sowing",
          "soil",
          "maintenance"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 149; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-026-leek",
        "month": 9,
        "cropKeys": [
          "leek"
        ],
        "cropContext": "Leek",
        "section": "vegetables",
        "operations": [
          "Spread manure at 30 t/ha.",
          "Conduct deep plowing."
        ],
        "actionTypes": [
          "fertilization",
          "soil"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 149; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-027-celery",
        "month": 9,
        "cropKeys": [
          "celery"
        ],
        "cropContext": "Celery",
        "section": "vegetables",
        "operations": [
          "Spread manure at 30 t/ha.",
          "Conduct deep plowing."
        ],
        "actionTypes": [
          "fertilization",
          "soil"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 149; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-028-cardoon",
        "month": 9,
        "cropKeys": [
          "cardoon"
        ],
        "cropContext": "Cardoon",
        "section": "vegetables",
        "operations": [
          "Plow and incorporate base fertilizer at 30 u of N, 90 u of P, and 40 u of K per hectare."
        ],
        "actionTypes": [
          "fertilization",
          "soil"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 149; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-029-endive-chicory-winter-production",
        "month": 9,
        "cropKeys": [
          "endive"
        ],
        "cropContext": "Endive chicory — winter production",
        "section": "vegetables",
        "operations": [
          "Sow in a nursery until mid-September at 1.5 kg/ha.",
          "Plant."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 149; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-030-artichoke",
        "month": 9,
        "cropKeys": [
          "artichoke"
        ],
        "cropContext": "Artichoke",
        "section": "vegetables",
        "operations": [
          "Irrigate.",
          "Apply maintenance fertilizer totaling 200 u of N/ha in four applications scheduled from October through February. The source prints the timing as “octobre, novembre, décembre, janvier à février”; the exact distribution across these months should remain configurable rather than being inferred as equal doses."
        ],
        "actionTypes": [
          "irrigation",
          "fertilization",
          "maintenance"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 149; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-031-pea",
        "month": 9,
        "cropKeys": [
          "pea"
        ],
        "cropContext": "Pea",
        "section": "vegetables",
        "operations": [
          "Prepare the soil.",
          "Disinfect the soil.",
          "Apply base fertilizer:",
          "Organic: 20 t/ha, spread three months before planting.",
          "Mineral: 30 u of N/ha, 90 u of P/ha, and 120 u of K/ha, preferably during rolling before sowing."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "sowing",
          "weedManagement"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 149; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-032-bean-late-season-production",
        "month": 9,
        "cropKeys": [
          "bean"
        ],
        "cropContext": "Bean — late-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Remove harvest residues."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 150; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-033-watermelon-and-melon-main-season-production",
        "month": 9,
        "cropKeys": [
          "cantaloupe",
          "watermelon"
        ],
        "cropContext": "Watermelon and melon — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Remove harvest residues."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 150; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-034-fava-bean",
        "month": 9,
        "cropKeys": [
          "fava-bean"
        ],
        "cropContext": "Fava bean",
        "section": "vegetables",
        "operations": [
          "Direct sowing."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 150; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-035-greenhouse-market-tomato-biskra",
        "month": 9,
        "cropKeys": [
          "greenhouse-tomato"
        ],
        "cropContext": "Greenhouse market tomato — Biskra",
        "section": "greenhouse",
        "operations": [
          "Plant in Biskra at 20,000–25,000 plants/ha.",
          "Set pheromone traps against tomato leaf miner.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "sowing",
          "cropProtection"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 151; PDF page 9.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-036-greenhouse-zucchini-early-primeur-production",
        "month": 9,
        "cropKeys": [
          "zucchini"
        ],
        "cropContext": "Greenhouse zucchini — early/primeur production",
        "section": "greenhouse",
        "operations": [
          "Prepare the soil.",
          "Disinfect the soil.",
          "Apply base fertilizer:",
          "Organic: 30 t/ha.",
          "Mineral: 120 u of N/ha, 60 u of P/ha, and 100 u of K/ha."
        ],
        "actionTypes": [
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 151; PDF page 9.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-037-greenhouse-strawberry",
        "month": 9,
        "cropKeys": [
          "strawberry"
        ],
        "cropContext": "Greenhouse strawberry",
        "section": "greenhouse",
        "operations": [
          "Prepare the soil.",
          "Disinfect the soil if necessary.",
          "Apply base fertilizer:",
          "Organic: 50 t/ha.",
          "Mineral: 150 u of N/ha, 80 u of P/ha, and 100 u of K/ha.",
          "Plant refrigerated plants (`plants frigo`) at 70,000 plants/ha."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "sowing"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 151; PDF page 9.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-038-climbing-bean",
        "month": 9,
        "cropKeys": [
          "climbing-bean"
        ],
        "cropContext": "Climbing bean",
        "section": "greenhouse",
        "operations": [
          "Apply well-decomposed organic fertilizer.",
          "Plow.",
          "Level the soil.",
          "Disinfect the soil against nematodes after analysis."
        ],
        "actionTypes": [
          "fertilization",
          "soil"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 151; PDF page 9.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-039-greenhouse-pepper-and-bell-pepper-early-primeur-production",
        "month": 9,
        "cropKeys": [
          "pepper"
        ],
        "cropContext": "Greenhouse pepper and bell pepper — early/primeur production",
        "section": "greenhouse",
        "operations": [
          "Plant in Biskra at 20,000–25,000 plants/ha."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 151; PDF page 9.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-040-greenhouse-cucumber-early-primeur-production",
        "month": 9,
        "cropKeys": [
          "cucumber"
        ],
        "cropContext": "Greenhouse cucumber — early/primeur production",
        "section": "greenhouse",
        "operations": [
          "Plant at 11,000–18,000 plants/ha.",
          "Irrigate."
        ],
        "actionTypes": [
          "sowing",
          "irrigation"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 151; PDF page 9.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-041-processing-tomato",
        "month": 9,
        "cropKeys": [
          "processing-tomato"
        ],
        "cropContext": "Processing tomato",
        "section": "industrial",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 152; PDF page 10.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-042-olive",
        "month": 9,
        "cropKeys": [
          "olive"
        ],
        "cropContext": "Olive",
        "section": "perennials",
        "operations": [
          "Analyze the soil for Verticillium and *Pratylenchus*.",
          "Install windbreaks for new orchards.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Continue irrigation for table olives: three water applications (`3 lâchées d’eau`).",
          "Begin harvesting green table olives in the western region.",
          "Continue nursery operations as described for August.",
          "Incorporate maintenance fertilizer:",
          "Irrigated production: 3 q/ha.",
          "Dryland production: 2 q/ha."
        ],
        "actionTypes": [
          "soil",
          "cropProtection",
          "irrigation",
          "harvest",
          "fertilization",
          "maintenance"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 153; PDF page 11.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-043-citrus",
        "month": 9,
        "cropKeys": [
          "citrus"
        ],
        "cropContext": "Citrus",
        "section": "perennials",
        "operations": [
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Disc harrow to keep the soil clean.",
          "Continue irrigation if necessary.",
          "Plant windbreaks for new orchards.",
          "Provide drainage on heavy soils."
        ],
        "actionTypes": [
          "cropProtection",
          "soil",
          "irrigation",
          "sowing"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 153; PDF page 11.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-044-stone-fruits-apricot-peach-cherry-and-almond",
        "month": 9,
        "cropKeys": [
          "stone-fruits"
        ],
        "cropContext": "Stone fruits — apricot, peach, cherry, and almond",
        "section": "perennials",
        "operations": [
          "Continue and finish deep soil preparation.",
          "Prepare plots for new plantations through scarification, disc harrowing, and leveling.",
          "Apply phospho-potassium maintenance fertilizer at 5 q/ha.",
          "Disc harrow to keep the soil clean.",
          "Install windbreaks.",
          "Open planting holes for new plantations.",
          "Continue harvesting late peaches and European plums.",
          "Continue irrigation after harvest.",
          "Conduct physico-chemical soil analysis.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "soil",
          "sowing",
          "fertilization",
          "maintenance",
          "harvest",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed pages 153–154; PDF pages 11–12.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-045-pome-fruits-and-related-trees-apple-pear-quince-pomegranate-and-loquat",
        "month": 9,
        "cropKeys": [
          "pome-fruits"
        ],
        "cropContext": "Pome fruits and related trees — apple, pear, quince, pomegranate, and loquat",
        "section": "perennials",
        "operations": [
          "Finish deep soil preparation.",
          "Prepare the plot for planting through disc harrowing and leveling.",
          "Harvest late varieties of apple and pear.",
          "Continue loquat pruning.",
          "Remove pruned loquat wood.",
          "Conduct physico-chemical and nematological soil analyses.",
          "Plant windbreaks for new plantations."
        ],
        "actionTypes": [
          "soil",
          "sowing",
          "harvest",
          "maintenance"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 154; PDF page 12.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-046-grapevine-established-production-vineyard",
        "month": 9,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — established production vineyard",
        "section": "perennials",
        "operations": [
          "Continue harvesting table grapes.",
          "Begin the wine-grape harvest and winemaking campaign.",
          "Irrigate after the table-grape harvest."
        ],
        "actionTypes": [
          "harvest",
          "irrigation"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 154; PDF page 12.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m09-047-grapevine-new-vineyard",
        "month": 9,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — new vineyard",
        "section": "perennials",
        "operations": [
          "Carry out the second hardening or acclimatization operation (`deuxième sevrage`) on young plants.",
          "Continue and finish Mallorcan grafting (`greffage à la mayorquine`).",
          "Continue and finish deep soil preparation."
        ],
        "actionTypes": [
          "sowing",
          "soil"
        ],
        "source": {
          "file": "09-septembre_fr.pdf",
          "printedPages": "printed page 154; PDF page 12.",
          "pdfLength": "14 pages"
        }
      }
    ],
    "sourceNote": [
      "The source states that September marks the end of summer. It requires deep soil preparation to be completed no later than the end of the month and emphasizes that the second hardening operation of young plants is essential. These are source-specific seasonal priorities, not universal prescriptions for every crop or region.",
      "Source location: printed pages 154–155; PDF pages 12–13."
    ],
    "regionalQualifiers": [
      "The September source contains explicit regional fertilizer differences for winter cereals. Durum and bread wheat receive 92 u/ha of phosphorus and 50 u/ha of potash in coastal zones, versus 46 u/ha of phosphorus and 50 u/ha of potash in sub-coastal zones and the High Plateaux. Barley and oats use 69 u/ha of phosphorus and 50 u/ha of potash on the coast, versus 46 u/ha of phosphorus and 50 u/ha of potash in the sub-coastal zones and High Plateaux.",
      "The source also names the eastern region for main-season market-tomato harvest, the High Plateaux for pepper and bell-pepper harvest, Biskra for greenhouse tomato and pepper planting, and the western region for the beginning of green table-olive harvest. It separates dryland and irrigated forage programs, late-season and primeur vegetable cycles, established and new vineyards, and new orchard preparation. Heavy soils require drainage in citrus production, while the orchard sections include windbreak installation for new plantations."
    ],
    "companionNote": [
      "The September source describes monthly operations by crop, production cycle, region, soil condition, and perennial status but does not provide explicit companion-planting or intercropping compatibility rules. The future calendar may show that two crops have operations in the same month, but this must be labeled as **same-month activity overlap**, not biological compatibility. Verified companion planting should come only from a separate source or a clearly labeled agronomic rule set."
    ],
    "uncertaintyNotes": [
      "The September calendar is an operational monthly guide, not a complete irrigation calculator, soil-test interpretation, phytosanitary product registry, disease forecast, or companion-planting database. FormulaAtlas can combine these monthly operations with its existing lifecycle, irrigation, nutrient, weather, INPV, field-record, and simulator tools, but the UI must distinguish source-derived values from user inputs and calculated recommendations.",
      "Several details should remain visible as review notes before becoming prescriptive UI. The onion fertilizer line is printed as `180–200 u de /ha` with the nutrient designation missing in the extracted source; it should not be silently labeled as potassium. The first zucchini maintenance application is printed as `30 u/ha` without a nutrient element. Artichoke fertilizer is stated as 200 u N/ha in four applications from October through February, but the exact monthly distribution is not specified. Olive maintenance fertilizer is expressed as 3 q/ha in irrigated production and 2 q/ha in dryland production without a nutrient identity in this month’s text. The technical terms `deuxième sevrage`, `greffage à la mayorquine`, `lâchées d’eau`, `plants frigo`, and `TSP` should receive localized explanations in the future tool. All phytosanitary references must link to the annexed calendar or FormulaAtlas safety gate rather than inventing products, doses, or treatment schedules."
    ]
  },
  {
    "number": 10,
    "key": "10",
    "name": {
      "en": "October",
      "fr": "Octobre",
      "ar": "أكتوبر"
    },
    "source": {
      "file": "10-octobre_fr.pdf",
      "institution": "République Algérienne et Populaire; Ministère de l’Agriculture et du Développement Rural; Direction de la Formation, de la Recherche et de la Vulgarisation; Institut National de la Vulgarisation Agricole.",
      "documentTitle": "*Calendrier des Opérations Culturales*",
      "language": "French",
      "pdfLength": "15 pages",
      "printedPages": "7–20",
      "extractionStatus": "Complete text extraction reviewed manually; crop names, production contexts, operations, quantities, growth-stage timing, regional qualifiers, and source boundaries retained.",
      "interpretationRule": "`u` means the source’s fertilizer-unit notation and is intentionally not converted into kg. `q/ha` means quintals per hectare. Where the source points to an annex, crop leaflet, or phytosanitary calendar, the future tool must show that source reference rather than inventing a product, active ingredient, or dose."
    },
    "entries": [
      {
        "id": "m10-001-winter-cereals-durum-wheat-and-bread-wheat",
        "month": 10,
        "cropKeys": [
          "wheat"
        ],
        "cropContext": "Winter cereals — durum wheat and bread wheat",
        "section": "grandesCultures",
        "operations": [
          "Prepare the seedbed.",
          "Sow late varieties."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 7; PDF page 1.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-002-winter-cereals-barley-oats-and-triticale",
        "month": 10,
        "cropKeys": [
          "barley",
          "oats",
          "triticale"
        ],
        "cropContext": "Winter cereals — barley, oats, and triticale",
        "section": "grandesCultures",
        "operations": [
          "Sow.",
          "Apply nitrogen at sowing or at tillering: 1 q of 46% urea, as stated by the source."
        ],
        "actionTypes": [
          "sowing",
          "fertilization"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 7; PDF page 1.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-003-food-legumes-lentil-chickpea-bean-and-dry-pea",
        "month": 10,
        "cropKeys": [
          "lentil",
          "chickpea",
          "pea"
        ],
        "cropContext": "Food legumes — lentil, chickpea, bean, and dry pea",
        "section": "grandesCultures",
        "operations": [
          "Resume plowing.",
          "Prepare the seedbed.",
          "Apply chemical weed control before sowing or after sowing."
        ],
        "actionTypes": [
          "soil",
          "sowing",
          "weedManagement"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 7; PDF page 1.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-004-fava-bean-first-coastal-sowings",
        "month": 10,
        "cropKeys": [
          "fava-bean"
        ],
        "cropContext": "Fava bean — first coastal sowings",
        "section": "grandesCultures",
        "operations": [
          "Resume plowing.",
          "Prepare the seedbed.",
          "Make the first fava-bean sowings in coastal zones from the first rains, at 100 kg/ha."
        ],
        "actionTypes": [
          "soil",
          "sowing"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 7; PDF page 1.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-005-vetchoat-peaoat-and-peatriticale-mixtures",
        "month": 10,
        "cropKeys": [
          "oats",
          "triticale",
          "forage-mixture"
        ],
        "cropContext": "Vetch–oat, pea–oat, and pea–triticale mixtures",
        "section": "grandesCultures",
        "operations": [
          "Prepare the seedbed.",
          "Apply nitrogen fertilizer.",
          "Sow in the High Plateaux."
        ],
        "actionTypes": [
          "sowing",
          "fertilization"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed pages 7–8; PDF pages 1–2.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-006-bersim",
        "month": 10,
        "cropKeys": [
          "bersim"
        ],
        "cropContext": "Bersim",
        "section": "grandesCultures",
        "operations": [
          "Dryland: sow at 30 kg/ha and roll the seedbed.",
          "Irrigated: irrigate."
        ],
        "actionTypes": [
          "sowing",
          "irrigation"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 8; PDF page 2.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-007-alfalfa",
        "month": 10,
        "cropKeys": [
          "alfalfa"
        ],
        "cropContext": "Alfalfa",
        "section": "grandesCultures",
        "operations": [
          "Dryland: sow at 25 kg/ha from the first rains; roll in dry conditions; and apply 10 u/ha of nitrogen for establishment.",
          "Irrigated: make the next cut followed by irrigation. Prepare the soil if this is the first installation."
        ],
        "actionTypes": [
          "sowing",
          "fertilization",
          "irrigation",
          "soil"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 8; PDF page 2.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-008-italian-ryegrass",
        "month": 10,
        "cropKeys": [
          "italian-ryegrass"
        ],
        "cropContext": "Italian ryegrass",
        "section": "grandesCultures",
        "operations": [
          "Sow at 15–20 kg/ha for diploid varieties and 30–40 kg/ha for tetraploid varieties.",
          "Apply nitrogen fertilizer at sowing: 90 u/ha."
        ],
        "actionTypes": [
          "sowing",
          "fertilization"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 8; PDF page 2.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-009-fodder-sorghum",
        "month": 10,
        "cropKeys": [
          "fodder-sorghum"
        ],
        "cropContext": "Fodder sorghum",
        "section": "grandesCultures",
        "operations": [
          "Plow.",
          "Apply base fertilizer at 100 u/ha of phosphorus and 100 u/ha of potash."
        ],
        "actionTypes": [
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 8; PDF page 2.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-010-fodder-maize",
        "month": 10,
        "cropKeys": [
          "fodder-maize"
        ],
        "cropContext": "Fodder maize",
        "section": "grandesCultures",
        "operations": [
          "Plow.",
          "Apply base fertilizer at 100 u/ha of phosphorus and 100 u/ha of potash."
        ],
        "actionTypes": [
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed pages 8–9; PDF pages 2–3.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-011-sunflower-and-safflower",
        "month": 10,
        "cropKeys": [
          "safflower",
          "sunflower"
        ],
        "cropContext": "Sunflower and safflower",
        "section": "grandesCultures",
        "operations": [
          "Plow.",
          "Apply base fertilizer at the same rates as those given in the September calendar.",
          "Resume or finish the plowing sequence."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "cropProtection"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 9; PDF page 3. The October PDF does not reprint the September rates; the future data model should retain this as an explicit cross-month source reference.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-012-rapeseed",
        "month": 10,
        "cropKeys": [
          "rapeseed"
        ],
        "cropContext": "Rapeseed",
        "section": "grandesCultures",
        "operations": [
          "Apply chemical weed control before sowing.",
          "Sow at 5–7 kg/ha."
        ],
        "actionTypes": [
          "sowing",
          "weedManagement"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 9; PDF page 3.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-013-potato-late-season-production",
        "month": 10,
        "cropKeys": [
          "potato"
        ],
        "cropContext": "Potato — late-season production",
        "section": "vegetables",
        "operations": [
          "Hoe and earth up.",
          "Irrigate.",
          "Apply maintenance fertilizer two months after planting:",
          "1.5 q of 46% urea.",
          "2 q of 48% potassium sulfate.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "irrigation",
          "sowing",
          "fertilization",
          "maintenance",
          "cropProtection"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 10; PDF page 4.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-014-potato-early-primeur-production",
        "month": 10,
        "cropKeys": [
          "potato"
        ],
        "cropContext": "Potato — early/primeur production",
        "section": "vegetables",
        "operations": [
          "Prepare the soil.",
          "Conduct a nematological soil analysis.",
          "Apply base fertilizer:",
          "Organic: 25–30 t/ha of bovine or ovine manure.",
          "Mineral: 80–100 u of N/ha, 100–120 u of P/ha, and 200–240 u of K/ha.",
          "Pre-germinate seed tubers for 4–6 weeks before planting.",
          "Plant at 25–27 q/ha."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "sowing"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 10; PDF page 4.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-015-market-tomato-late-season-production",
        "month": 10,
        "cropKeys": [
          "market-tomato"
        ],
        "cropContext": "Market tomato — late-season production",
        "section": "vegetables",
        "operations": [
          "Irrigate.",
          "Apply maintenance fertilizer:",
          "First and second applications: 60 u of N and 50 u of K.",
          "Third and fourth applications: 20 u of N and 60 u of K.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Carry out crop-maintenance operations."
        ],
        "actionTypes": [
          "irrigation",
          "fertilization",
          "maintenance",
          "cropProtection"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed pages 10–11; PDF pages 4–5.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-016-pepper-and-bell-pepper-main-season-production",
        "month": 10,
        "cropKeys": [
          "pepper"
        ],
        "cropContext": "Pepper and bell pepper — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest in the High Plateaux.",
          "Apply maintenance fertilizer in four applications:",
          "First application before flowering: 40 u of N and 30 u of K.",
          "Second application at fruit set: 40 u of N and 60 u of K.",
          "Third application at fruit development: 30 u of N and 60 u of K.",
          "Fourth application after the first harvest: 20 u of N and 60 u of K.",
          "Irrigate.",
          "Maintain the crop through mulching, staking, hoeing, and earthing up where the crop is not mulched."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation",
          "weedManagement"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 11; PDF page 5.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-017-cabbage",
        "month": 10,
        "cropKeys": [
          "cabbage"
        ],
        "cropContext": "Cabbage",
        "section": "vegetables",
        "operations": [
          "Apply fertilizer at 30 u of N, 130 u of P, and 40 u of K per hectare.",
          "Hoe.",
          "Apply phytosanitary treatments against aphids and noctuid moths."
        ],
        "actionTypes": [
          "fertilization",
          "cropProtection"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 11; PDF page 5.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-018-fennel",
        "month": 10,
        "cropKeys": [
          "fennel"
        ],
        "cropContext": "Fennel",
        "section": "vegetables",
        "operations": [
          "Plant at 80,000–120,000 plants/ha.",
          "Harvest.",
          "Maintain the crop through hoeing, earthing up, and weeding."
        ],
        "actionTypes": [
          "sowing",
          "harvest",
          "weedManagement"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 11; PDF page 5.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-019-cardoon",
        "month": 10,
        "cropKeys": [
          "cardoon"
        ],
        "cropContext": "Cardoon",
        "section": "vegetables",
        "operations": [
          "Plow and incorporate base fertilizer at 30 u of N, 90 u of P, and 40 u of K/ha.",
          "Sow and press or firm the seedbed during the second half of the month.",
          "Thin at the end of October."
        ],
        "actionTypes": [
          "fertilization",
          "soil",
          "sowing"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 11; PDF page 5.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-020-endive-chicory-winter-production",
        "month": 10,
        "cropKeys": [
          "endive"
        ],
        "cropContext": "Endive chicory — winter production",
        "section": "vegetables",
        "operations": [
          "Irrigate according to need.",
          "Apply phytosanitary treatments."
        ],
        "actionTypes": [
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 12; PDF page 6.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-021-artichoke",
        "month": 10,
        "cropKeys": [
          "artichoke"
        ],
        "cropContext": "Artichoke",
        "section": "vegetables",
        "operations": [
          "Harvest second-year plants.",
          "Apply maintenance fertilizer totaling 200 u of N/ha in four applications scheduled from October through February. The source prints the sequence as October, November, December, and January to February; the exact distribution across these months is not specified.",
          "Irrigate.",
          "Apply phytosanitary treatments.",
          "Weed."
        ],
        "actionTypes": [
          "harvest",
          "sowing",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection",
          "weedManagement"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 12; PDF page 6.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-022-bean-late-season-production",
        "month": 10,
        "cropKeys": [
          "bean"
        ],
        "cropContext": "Bean — late-season production",
        "section": "vegetables",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 12; PDF page 6.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-023-pea",
        "month": 10,
        "cropKeys": [
          "pea"
        ],
        "cropContext": "Pea",
        "section": "vegetables",
        "operations": [
          "Plant at 80 kg/ha.",
          "Prepare the soil.",
          "Apply base fertilizer:",
          "Organic: 20 t/ha, spread three months before planting.",
          "Mineral: 30 u of N/ha, 90 u of P/ha, and 120 u of K/ha, preferably during rolling before sowing."
        ],
        "actionTypes": [
          "sowing",
          "soil",
          "fertilization",
          "weedManagement"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 12; PDF page 6.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-024-fava-bean",
        "month": 10,
        "cropKeys": [
          "fava-bean"
        ],
        "cropContext": "Fava bean",
        "section": "vegetables",
        "operations": [
          "Direct sow at 80,000–120,000 plants/ha.",
          "Carry out light hoeing 2–3 weeks after earthing up, following the source’s sequence of hoeing, earthing up, and weeding."
        ],
        "actionTypes": [
          "sowing",
          "weedManagement"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 12; PDF page 6.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-025-strawberry-refrigerated-plants-under-open-air-plastic-mulch",
        "month": 10,
        "cropKeys": [
          "strawberry"
        ],
        "cropContext": "Strawberry — refrigerated plants under open-air plastic mulch",
        "section": "vegetables",
        "operations": [
          "Finish installing the plastic mulch.",
          "Irrigate according to need.",
          "Remove the first flowers and stolons.",
          "Install plastic tunnels if early production is desired. The source recommends a prior trial because the financial gain is not always clear.",
          "Install windbreaks."
        ],
        "actionTypes": [
          "irrigation"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 13; PDF page 7.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-026-strawberry-fresh-plants-under-open-air-plastic-mulch",
        "month": 10,
        "cropKeys": [
          "strawberry"
        ],
        "cropContext": "Strawberry — fresh plants under open-air plastic mulch",
        "section": "vegetables",
        "operations": [
          "Pre-irrigate.",
          "Prepare the plants.",
          "Plant.",
          "Irrigate.",
          "Install windbreaks.",
          "Replace missing plants at the end of the month."
        ],
        "actionTypes": [
          "irrigation",
          "sowing"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 13; PDF page 7.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-027-onion",
        "month": 10,
        "cropKeys": [
          "onion"
        ],
        "cropContext": "Onion",
        "section": "vegetables",
        "operations": [
          "Sow in a nursery at 4–7 kg/ha."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 13; PDF page 7.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-028-garlic",
        "month": 10,
        "cropKeys": [
          "garlic"
        ],
        "cropContext": "Garlic",
        "section": "vegetables",
        "operations": [
          "Plant approximately 8–10 q/ha of cloves, equivalent to about 150,000–200,000 plants/ha.",
          "Irrigate.",
          "Conduct a nematological analysis.",
          "Phytosanitary treatments: refer to the annexed garlic leaflet.",
          "Apply base fertilizer at 80 u of N/ha, 50 u of P/ha, and 150 u of K/ha."
        ],
        "actionTypes": [
          "sowing",
          "irrigation",
          "cropProtection",
          "fertilization"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 13; PDF page 7.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-029-cauliflower-late-season-production",
        "month": 10,
        "cropKeys": [
          "cauliflower"
        ],
        "cropContext": "Cauliflower — late-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Irrigate.",
          "Apply maintenance fertilizer in two applications of 20 u of N:",
          "First application one month after planting.",
          "Second application 20 days after the first.",
          "Apply phytosanitary treatments against cabbage white butterflies, aphids, and noctuid moths."
        ],
        "actionTypes": [
          "harvest",
          "irrigation",
          "fertilization",
          "maintenance",
          "sowing",
          "cropProtection"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 14; PDF page 8.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-030-okra",
        "month": 10,
        "cropKeys": [
          "okra"
        ],
        "cropContext": "Okra",
        "section": "vegetables",
        "operations": [
          "Finish the harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 14; PDF page 8.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-031-zucchini-late-season-production",
        "month": 10,
        "cropKeys": [
          "zucchini"
        ],
        "cropContext": "Zucchini — late-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Irrigate."
        ],
        "actionTypes": [
          "harvest",
          "irrigation"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 14; PDF page 8.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-032-carrot-and-turnip",
        "month": 10,
        "cropKeys": [
          "carrot",
          "turnip"
        ],
        "cropContext": "Carrot and turnip",
        "section": "vegetables",
        "operations": [
          "Prepare the soil.",
          "Apply base fertilizer. Organic fertilizer is described as not recommended or only weakly recommended in the source.",
          "Apply mineral fertilizer at 150–200 u of N/ha, 200–250 u of K/ha, and 100–120 u of P/ha as Super 46%.",
          "Plant through direct sowing at the following densities:",
          "Ordinary direct sowing: 1,200,000–1,600,000 plants/ha.",
          "Precision sowing: 2,000,000–2,400,000 plants/ha.",
          "Harvest."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "sowing",
          "harvest"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 14; PDF page 8.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-033-greenhouse-market-tomato",
        "month": 10,
        "cropKeys": [
          "greenhouse-tomato"
        ],
        "cropContext": "Greenhouse market tomato",
        "section": "greenhouse",
        "operations": [
          "Apply fertilizer.",
          "Irrigate.",
          "Maintain the crop through mulching, training, removal of side shoots, and leaf removal.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "fertilization",
          "irrigation",
          "weedManagement",
          "maintenance",
          "cropProtection"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 15; PDF page 9.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-034-greenhouse-pepper-and-bell-pepper-early-primeur-production",
        "month": 10,
        "cropKeys": [
          "pepper"
        ],
        "cropContext": "Greenhouse pepper and bell pepper — early/primeur production",
        "section": "greenhouse",
        "operations": [
          "Apply maintenance fertilizer in four applications:",
          "First application before flowering: 40 u of N and 30 u of K.",
          "Second application at fruit set: 40 u of N and 60 u of K.",
          "Third application at fruit development: 30 u of N and 60 u of K.",
          "Fourth application after the first harvest: 20 u of N and 60 u of K.",
          "Irrigate.",
          "Maintain the crop through mulching, staking, hoeing, and earthing up where the crop is not mulched.",
          "Apply phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "fertilization",
          "maintenance",
          "harvest",
          "irrigation",
          "weedManagement",
          "cropProtection"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 15; PDF page 9.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-035-greenhouse-cucumber-biskra",
        "month": 10,
        "cropKeys": [
          "cucumber"
        ],
        "cropContext": "Greenhouse cucumber — Biskra",
        "section": "greenhouse",
        "operations": [
          "Apply maintenance fertilizer in three applications:",
          "First application at flowering: 40 u of N/ha.",
          "Second application three weeks after flowering: 40 u of N/ha and 50 u of K/ha.",
          "Third application during fruit development: 80 u of N/ha and 100 u of K/ha.",
          "Irrigate.",
          "Maintain the crop.",
          "Apply phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed pages 15–16; PDF pages 9–10.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-036-greenhouse-strawberry-fresh-plants",
        "month": 10,
        "cropKeys": [
          "strawberry"
        ],
        "cropContext": "Greenhouse strawberry — fresh plants",
        "section": "greenhouse",
        "operations": [
          "Prepare the soil.",
          "Disinfect the soil.",
          "Apply base fertilizer:",
          "Organic: 50 t/ha.",
          "Mineral: 150 u of N/ha, 80 u of P/ha, and 100 u of K/ha.",
          "Plant fresh strawberry plants at 70,000 plants/ha."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "sowing"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 15; PDF page 9.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-037-greenhouse-cantaloupe-biskra",
        "month": 10,
        "cropKeys": [
          "cantaloupe"
        ],
        "cropContext": "Greenhouse cantaloupe — Biskra",
        "section": "greenhouse",
        "operations": [
          "Establish the nursery.",
          "Prepare the soil.",
          "Apply base fertilizer:",
          "Organic: 60 t/ha.",
          "Mineral: 100 u of N/ha, 150 u of P/ha, and 150 u of K/ha."
        ],
        "actionTypes": [
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 15; PDF page 9.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-038-greenhouse-zucchini",
        "month": 10,
        "cropKeys": [
          "zucchini"
        ],
        "cropContext": "Greenhouse zucchini",
        "section": "greenhouse",
        "operations": [
          "Prepare the soil.",
          "Apply base fertilizer:",
          "Organic: 30 t/ha.",
          "Mineral: 120 u of N/ha, 60 u of P/ha, and 100 u of K/ha.",
          "Plant at 11,000–16,000 plants/ha.",
          "Maintain the crop.",
          "Irrigate."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "sowing",
          "irrigation"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed pages 16–17; PDF pages 10–11.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-039-processing-tomato",
        "month": 10,
        "cropKeys": [
          "processing-tomato"
        ],
        "cropContext": "Processing tomato",
        "section": "industrial",
        "operations": [
          "Conduct autumn plowing."
        ],
        "actionTypes": [
          "soil"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 17; PDF page 11.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-040-olive",
        "month": 10,
        "cropKeys": [
          "olive"
        ],
        "cropContext": "Olive",
        "section": "perennials",
        "operations": [
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Finish harvesting green table olives.",
          "Begin harvesting black table olives.",
          "Open planting basins or planting pits (`potets de plantation`).",
          "Weed manually in the nursery.",
          "Continue applying phospho-potassium fertilizer and incorporate it through disc harrowing.",
          "Incorporate well-decomposed organic fertilizer at 30–40 t/ha.",
          "Mark out and stake the orchard according to planting intensity:",
          "Intensive: 400 plants/ha.",
          "Semi-intensive: 200 plants/ha.",
          "Extensive: 100 plants/ha.",
          "Continue irrigation: two water applications (`2 lâchées d’eau`)."
        ],
        "actionTypes": [
          "cropProtection",
          "harvest",
          "sowing",
          "weedManagement",
          "fertilization",
          "soil",
          "maintenance",
          "irrigation"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 18; PDF page 12.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-041-citrus",
        "month": 10,
        "cropKeys": [
          "citrus"
        ],
        "cropContext": "Citrus",
        "section": "perennials",
        "operations": [
          "Incorporate phospho-potassium fertilizer at 5 q/ha.",
          "Begin harvesting satsumas and clementines.",
          "Sow green manure, such as fava bean, vetch, or mustard.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Plant windbreaks for new orchards.",
          "Disc harrow to incorporate phospho-potassium fertilizer.",
          "Apply well-decomposed organic fertilizer at 20 t/ha.",
          "Conduct physico-chemical and nematological soil analyses for new orchards."
        ],
        "actionTypes": [
          "fertilization",
          "harvest",
          "sowing",
          "cropProtection",
          "soil"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 18; PDF page 12.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-042-stone-fruits-apricot-peach-cherry-and-almond",
        "month": 10,
        "cropKeys": [
          "stone-fruits"
        ],
        "cropContext": "Stone fruits — apricot, peach, cherry, and almond",
        "section": "perennials",
        "operations": [
          "Open planting basins or planting pits.",
          "Continue incorporating phospho-potassium fertilizer.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "sowing",
          "fertilization",
          "cropProtection"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 18; PDF page 12.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-043-pome-fruits-and-related-trees-apple-pear-quince-pomegranate-and-loquat",
        "month": 10,
        "cropKeys": [
          "pome-fruits"
        ],
        "cropContext": "Pome fruits and related trees — apple, pear, quince, pomegranate, and loquat",
        "section": "perennials",
        "operations": [
          "Incorporate phospho-potassium fertilizer.",
          "Sow green manure if appropriate, such as fava bean or vetch–oat. The source refers to the fruit-crop fertilization leaflet for the dose.",
          "Mark out, stake, and open planting holes. Where planting is conducted in prepared holes, apply 3 kg of PK fertilizer per hole.",
          "Apply nitrogen fertilizer before flowering on loquat at 2 q/ha.",
          "Disc harrow to incorporate phospho-potassium and organic fertilizer.",
          "Prune late varieties of loquat.",
          "Remove pruned loquat wood.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "fertilization",
          "sowing",
          "cropProtection",
          "maintenance",
          "soil"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed pages 18–19; PDF pages 12–13.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-044-grapevine-established-production-vineyard",
        "month": 10,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — established production vineyard",
        "section": "perennials",
        "operations": [
          "Finish harvesting grapes.",
          "Finish the grape harvest and winemaking campaign.",
          "Open a furrow on every other row.",
          "Apply phospho-potassium fertilizer:",
          "Table grape vineyard: 4 q/ha.",
          "Wine-grape vineyard: 2 q/ha."
        ],
        "actionTypes": [
          "harvest",
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 19; PDF page 13.",
          "pdfLength": "15 pages"
        }
      },
      {
        "id": "m10-045-grapevine-new-vineyard",
        "month": 10,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — new vineyard",
        "section": "perennials",
        "operations": [
          "Conduct a nematological analysis for *Xyphenema*.",
          "Install windbreaks.",
          "Work the soil.",
          "Disc harrow parcels that have undergone deep soil preparation."
        ],
        "actionTypes": [
          "soil"
        ],
        "source": {
          "file": "10-octobre_fr.pdf",
          "printedPages": "printed page 20; PDF page 14.",
          "pdfLength": "15 pages"
        }
      }
    ],
    "sourceNote": [
      "The source explains that opening a furrow allows phospho-potassium fertilizer to be localized at depth and improves water infiltration. This is a source-specific explanation of the vineyard operation and should be presented in the future tool as a contextual note rather than as a universal irrigation or fertilizer recommendation.",
      "Source location: printed page 20; PDF page 14."
    ],
    "regionalQualifiers": [
      "The October source includes coastal first-rain timing for fava bean and assigns forage-mixture sowing to the High Plateaux. It distinguishes dryland and irrigated bersim and alfalfa programs, including first-rain sowing for dryland alfalfa and a next cut followed by irrigation for irrigated alfalfa. It also distinguishes diploid and tetraploid Italian ryegrass by seed rate.",
      "The source names the High Plateaux for the pepper and bell-pepper harvest, Biskra for greenhouse cucumber and cantaloupe, and new orchards or vineyards for specific soil-analysis, windbreak, and layout operations. Production cycles remain separate: late-season and primeur potato, main-season and primeur pepper, late-season bean and cauliflower, fresh versus refrigerated strawberry plants, established versus new vineyards, and green versus black table olives."
    ],
    "companionNote": [
      "The October source describes monthly operations by crop, production cycle, region, soil condition, and perennial status but does not provide explicit companion-planting or intercropping compatibility rules. The future calendar may show that two crops have operations in the same month, but this must be labeled as **same-month activity overlap**, not biological compatibility. Verified companion planting should come only from a separate source or a clearly labeled agronomic rule set."
    ],
    "uncertaintyNotes": [
      "The October calendar is an operational monthly guide, not a complete irrigation calculator, soil-test interpretation, phytosanitary product registry, disease forecast, or companion-planting database. FormulaAtlas can combine these monthly operations with its existing lifecycle, irrigation, nutrient, weather, INPV, field-record, and simulator tools, but the UI must distinguish source-derived values from user inputs and calculated recommendations.",
      "The sunflower and safflower fertilizer rates are not reprinted in October; the source explicitly refers back to September, so the future dataset should preserve a cross-month reference rather than fabricate a new October rate. The artichoke nitrogen total is stated as 200 u/ha in four applications from October through February, but its exact distribution is not specified. The source’s phrase `1 q d'urée 46%` for barley, oats, and triticale should retain its source unit and timing, without assuming whether the quantity is intended per hectare unless another source confirms it. The strawberry tunnel note includes an economic caution that early production does not always produce a clear financial gain and should be presented as a source observation, not as a universal business conclusion.",
      "Technical terms including `potets de plantation`, `P.A.M.P.`, `plants frigo`, `plombage`, `ébourgeonnage`, `effeuillage`, `sevrage`, `TSP`, and `Xyphenema` should receive localized explanations in the future tool. All phytosanitary references must link to the annexed calendar or FormulaAtlas safety gate rather than inventing products, doses, or treatment schedules."
    ]
  },
  {
    "number": 11,
    "key": "11",
    "name": {
      "en": "November",
      "fr": "Novembre",
      "ar": "نوفمبر"
    },
    "source": {
      "file": "11-novembre_fr.pdf",
      "institution": "",
      "documentTitle": "*Calendrier des Opérations Culturales*",
      "language": "French",
      "pdfLength": "13 pages",
      "printedPages": "21–32",
      "extractionStatus": "Complete text extraction reviewed manually; crop names, production contexts, operations, quantities, growth-stage timing, regional qualifiers, and source boundaries retained.",
      "interpretationRule": "`u` means the source’s fertilizer-unit notation and is intentionally not converted into kg. `q/ha` means quintals per hectare. Where the source points to an annex, crop leaflet, or phytosanitary calendar, the future tool must show that source reference rather than inventing a product, active ingredient, or dose."
    },
    "entries": [
      {
        "id": "m11-001-winter-cereals-durum-wheat-bread-wheat-barley-oats-and-triticale",
        "month": 11,
        "cropKeys": [
          "wheat",
          "barley",
          "oats",
          "triticale"
        ],
        "cropContext": "Winter cereals — durum wheat, bread wheat, barley, oats, and triticale",
        "section": "grandesCultures",
        "operations": [
          "Finish preparing the seedbed.",
          "Sow, followed by rolling in dry conditions.",
          "Phytosanitary treatment: refer to the annexed phytosanitary calendar.",
          "Apply the source’s crop-specific seeding rates:",
          "Durum wheat: 120–140 kg/ha in favorable zones receiving 400–600 mm; 120–130 kg/ha in moderately favorable zones receiving 300–400 mm; and 200 kg/ha under supplementary irrigation.",
          "Bread wheat: 120–130 kg/ha in favorable zones receiving 400–600 mm; 115–120 kg/ha in moderately favorable zones receiving 300–400 mm; and 200 kg/ha under supplementary irrigation.",
          "Barley and oats: 100 kg/ha."
        ],
        "actionTypes": [
          "sowing",
          "weedManagement",
          "cropProtection",
          "irrigation"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 21; PDF page 1.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-002-durum-wheat-and-bread-wheat-nitrogen-program",
        "month": 11,
        "cropKeys": [
          "wheat"
        ],
        "cropContext": "Durum wheat and bread wheat — nitrogen program",
        "section": "grandesCultures",
        "operations": [
          "Apply nitrogen at sowing.",
          "In favorable zones receiving 400–600 mm, apply 2 q/ha of 46% urea in split applications: one-third at sowing and two-thirds between tillering and stem elongation.",
          "Under supplementary irrigation, apply 3 q/ha of 46% urea in split applications: one-third at sowing and two-thirds from tillering to stem elongation."
        ],
        "actionTypes": [
          "sowing",
          "fertilization",
          "irrigation"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 21; PDF page 1.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-003-food-legumes-winter-lentil-and-chickpea",
        "month": 11,
        "cropKeys": [
          "lentil",
          "chickpea"
        ],
        "cropContext": "Food legumes — winter lentil and chickpea",
        "section": "grandesCultures",
        "operations": [
          "Sow at 80–100 kg/ha."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 22; PDF page 2.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-004-dry-pea",
        "month": 11,
        "cropKeys": [
          "pea"
        ],
        "cropContext": "Dry pea",
        "section": "grandesCultures",
        "operations": [
          "Sow at 100–120 kg/ha."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 22; PDF page 2.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-005-fava-bean",
        "month": 11,
        "cropKeys": [
          "fava-bean"
        ],
        "cropContext": "Fava bean",
        "section": "grandesCultures",
        "operations": [
          "Sow at 80–100 kg/ha."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 22; PDF page 2.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-006-vetchoat-peaoat-and-peatriticale-mixtures",
        "month": 11,
        "cropKeys": [
          "oats",
          "triticale",
          "forage-mixture"
        ],
        "cropContext": "Vetch–oat, pea–oat, and pea–triticale mixtures",
        "section": "grandesCultures",
        "operations": [
          "Sow in the coastal and sub-coastal zones.",
          "Use a sowing composition of two-thirds legume and one-third cereal."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 22; PDF page 2.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-007-bersim",
        "month": 11,
        "cropKeys": [
          "bersim"
        ],
        "cropContext": "Bersim",
        "section": "grandesCultures",
        "operations": [
          "Dryland: continue sowing.",
          "Irrigated: irrigate."
        ],
        "actionTypes": [
          "sowing",
          "irrigation"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 22; PDF page 2.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-008-alfalfa",
        "month": 11,
        "cropKeys": [
          "alfalfa"
        ],
        "cropContext": "Alfalfa",
        "section": "grandesCultures",
        "operations": [
          "Dryland: continue sowing.",
          "Irrigated: make the next cut followed by irrigation."
        ],
        "actionTypes": [
          "sowing",
          "irrigation"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 22; PDF page 2.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-009-italian-ryegrass",
        "month": 11,
        "cropKeys": [
          "italian-ryegrass"
        ],
        "cropContext": "Italian ryegrass",
        "section": "grandesCultures",
        "operations": [
          "Continue sowing."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 22; PDF page 2.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-010-safflower",
        "month": 11,
        "cropKeys": [
          "safflower"
        ],
        "cropContext": "Safflower",
        "section": "grandesCultures",
        "operations": [
          "Resume or finish plowing.",
          "Prepare the seedbed."
        ],
        "actionTypes": [
          "soil",
          "sowing"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 22; PDF page 2.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-011-rapeseed",
        "month": 11,
        "cropKeys": [
          "rapeseed"
        ],
        "cropContext": "Rapeseed",
        "section": "grandesCultures",
        "operations": [
          "Continue sowing."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 22; PDF page 2.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-012-potato-late-season-production",
        "month": 11,
        "cropKeys": [
          "potato"
        ],
        "cropContext": "Potato — late-season production",
        "section": "vegetables",
        "operations": [
          "Irrigate.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 23; PDF page 3.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-013-potato-early-primeur-production",
        "month": 11,
        "cropKeys": [
          "potato"
        ],
        "cropContext": "Potato — early/primeur production",
        "section": "vegetables",
        "operations": [
          "Plant at 25–27 q/ha.",
          "Irrigate.",
          "Apply chemical weed control."
        ],
        "actionTypes": [
          "sowing",
          "irrigation",
          "weedManagement"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 23; PDF page 3.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-014-carrot-and-turnip",
        "month": 11,
        "cropKeys": [
          "carrot",
          "turnip"
        ],
        "cropContext": "Carrot and turnip",
        "section": "vegetables",
        "operations": [
          "Plant through direct sowing at the following densities:",
          "Ordinary direct sowing: 1,200,000–1,600,000 plants/ha.",
          "Precision sowing: 2,000,000–2,400,000 plants/ha.",
          "Prepare the soil.",
          "Apply base fertilizer. Organic fertilizer is described as not recommended or only weakly recommended in the source.",
          "Apply mineral fertilizer at 150–200 u of N/ha, 200–250 u of K/ha, and 100–120 u of P/ha as Super 46%.",
          "Harvest."
        ],
        "actionTypes": [
          "sowing",
          "soil",
          "fertilization",
          "harvest"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 23; PDF page 3.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-015-market-tomato-late-season-production",
        "month": 11,
        "cropKeys": [
          "market-tomato"
        ],
        "cropContext": "Market tomato — late-season production",
        "section": "vegetables",
        "operations": [
          "Carry out crop-maintenance operations, including training, removal of side shoots, and leaf removal.",
          "Begin the harvest.",
          "Phytosanitary treatments: the source refers to an annexed “phytosanitary calendar of the potato” in an apparently incomplete or inconsistent line. This wording is retained as a source-boundary note and should not be silently corrected in the tool."
        ],
        "actionTypes": [
          "maintenance",
          "harvest",
          "cropProtection"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 23; PDF page 3.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-016-pepper-and-bell-pepper-main-season-production",
        "month": 11,
        "cropKeys": [
          "pepper"
        ],
        "cropContext": "Pepper and bell pepper — main-season production",
        "section": "vegetables",
        "operations": [
          "Harvest in the High Plateaux.",
          "Apply maintenance fertilizer in four applications:",
          "First application before flowering: 40 u of N and 30 u of K.",
          "Second application at fruit set: 40 u of N and 60 u of K.",
          "Third application at fruit development: 30 u of N and 60 u of K.",
          "Fourth application after the first harvest: 20 u of N and 60 u of K.",
          "Irrigate.",
          "Apply phytosanitary treatments against fungal diseases if necessary."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 24; PDF page 4.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-017-eggplant-late-season-production",
        "month": 11,
        "cropKeys": [
          "eggplant"
        ],
        "cropContext": "Eggplant — late-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Irrigate according to need.",
          "Apply phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "harvest",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 24; PDF page 4.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-018-dry-onion",
        "month": 11,
        "cropKeys": [
          "onion"
        ],
        "cropContext": "Dry onion",
        "section": "vegetables",
        "operations": [
          "Maintain the sowing."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 24; PDF page 4.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-019-garlic",
        "month": 11,
        "cropKeys": [
          "garlic"
        ],
        "cropContext": "Garlic",
        "section": "vegetables",
        "operations": [
          "Plant approximately 8–10 q/ha of cloves, equivalent to about 150,000–200,000 plants/ha.",
          "Irrigate.",
          "Apply base fertilizer at 80 u of N/ha, 50 u of P/ha, and 150 u of K/ha.",
          "Phytosanitary treatments: refer to the annexed garlic leaflet.",
          "Maintain the crop through hoeing, earthing up, and weeding."
        ],
        "actionTypes": [
          "sowing",
          "irrigation",
          "fertilization",
          "cropProtection",
          "weedManagement"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed pages 24–25; PDF pages 4–5.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-020-bean-early-primeur-production",
        "month": 11,
        "cropKeys": [
          "bean"
        ],
        "cropContext": "Bean — early/primeur production",
        "section": "vegetables",
        "operations": [
          "Prepare the soil.",
          "Apply base fertilizer:",
          "Organic: 15 t/ha of decomposed manure.",
          "Mineral: 50–80 u of N/ha, 80–100 u of P/ha, and 100–150 u of K/ha.",
          "Disinfect the soil against “l’Ail” according to the source’s wording. This phrase is retained because it is ambiguous or possibly a source typographical error; it must not be normalized into a different pest or disease without another source."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "cropProtection"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 24; PDF page 4.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-021-cabbage-and-cauliflower-late-season-production",
        "month": 11,
        "cropKeys": [
          "cabbage",
          "cauliflower"
        ],
        "cropContext": "Cabbage and cauliflower — late-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Irrigate.",
          "Apply maintenance fertilizer in two applications of 20 u of N:",
          "First application one month after planting.",
          "Second application 20 days after the first."
        ],
        "actionTypes": [
          "harvest",
          "irrigation",
          "fertilization",
          "maintenance",
          "sowing"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 25; PDF page 5.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-022-zucchini-early-primeur-production",
        "month": 11,
        "cropKeys": [
          "zucchini"
        ],
        "cropContext": "Zucchini — early/primeur production",
        "section": "vegetables",
        "operations": [
          "Until mid-November, plow and disc harrow.",
          "From mid-November, disinfect the soil against nematodes, level the soil, and apply base fertilizer."
        ],
        "actionTypes": [
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 25; PDF page 5.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-023-fennel",
        "month": 11,
        "cropKeys": [
          "fennel"
        ],
        "cropContext": "Fennel",
        "section": "vegetables",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 25; PDF page 5.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-024-cardoon",
        "month": 11,
        "cropKeys": [
          "cardoon"
        ],
        "cropContext": "Cardoon",
        "section": "vegetables",
        "operations": [
          "Plow and incorporate base fertilizer.",
          "Sow and firm the seedbed at 7–8 kg/ha.",
          "Thin.",
          "Irrigate according to need.",
          "Apply phytosanitary treatments."
        ],
        "actionTypes": [
          "fertilization",
          "soil",
          "sowing",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed pages 25–26; PDF pages 5–6.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-025-endive-chicory-winter-production",
        "month": 11,
        "cropKeys": [
          "endive"
        ],
        "cropContext": "Endive chicory — winter production",
        "section": "vegetables",
        "operations": [
          "Blanch.",
          "Irrigate according to need.",
          "Apply phytosanitary treatments."
        ],
        "actionTypes": [
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 26; PDF page 6.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-026-artichoke-second-year-crop",
        "month": 11,
        "cropKeys": [
          "artichoke"
        ],
        "cropContext": "Artichoke — second-year crop",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Apply maintenance fertilizer totaling 200 u of N/ha in four applications scheduled from October through February.",
          "Irrigate."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 26; PDF page 6.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-027-pea",
        "month": 11,
        "cropKeys": [
          "pea"
        ],
        "cropContext": "Pea",
        "section": "vegetables",
        "operations": [
          "Plant at 80 kg/ha.",
          "Prepare the soil.",
          "Apply base fertilizer:",
          "Organic: 20 t/ha, spread three months before planting.",
          "Mineral: 30 u of N/ha, 90 u of P/ha, and 120 u of K/ha, preferably during rolling before sowing.",
          "Maintain the crop.",
          "Irrigate.",
          "Apply phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "sowing",
          "soil",
          "fertilization",
          "weedManagement",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 26; PDF page 6.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-028-fava-bean",
        "month": 11,
        "cropKeys": [
          "fava-bean"
        ],
        "cropContext": "Fava bean",
        "section": "vegetables",
        "operations": [
          "Direct sow at 80,000–120,000 plants/ha.",
          "Apply phytosanitary treatments if necessary.",
          "Hoe and earth up.",
          "Weed."
        ],
        "actionTypes": [
          "sowing",
          "cropProtection",
          "weedManagement"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 26; PDF page 6.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-029-strawberry-open-field-seasonal-production",
        "month": 11,
        "cropKeys": [
          "strawberry"
        ],
        "cropContext": "Strawberry — open-field seasonal production",
        "section": "vegetables",
        "operations": [
          "Prepare the soil.",
          "Disinfect the soil.",
          "Apply base fertilizer:",
          "Organic: 50 t/ha.",
          "Mineral: 150 u of N/ha, 80 u of P/ha, and 100 u of K/ha."
        ],
        "actionTypes": [
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 26; PDF page 6.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-030-greenhouse-market-tomato-biskra",
        "month": 11,
        "cropKeys": [
          "greenhouse-tomato"
        ],
        "cropContext": "Greenhouse market tomato — Biskra",
        "section": "greenhouse",
        "operations": [
          "Apply maintenance fertilizer in five applications:",
          "First and second applications: 60 u of N and 50 u of K each.",
          "Third through fifth applications: 20 u of N and 60 u of K each.",
          "Maintain the crop through training, removal of side shoots, and leaf removal.",
          "Irrigate.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 27; PDF page 7.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-031-greenhouse-market-tomato-other-regions",
        "month": 11,
        "cropKeys": [
          "greenhouse-tomato"
        ],
        "cropContext": "Greenhouse market tomato — other regions",
        "section": "greenhouse",
        "operations": [
          "Maintain the crop through training, removal of side shoots, and leaf removal.",
          "Operate the nursery.",
          "Apply base fertilizer:",
          "Organic: 30–35 t/ha of manure.",
          "Mineral: 180–200 u of N/ha, 80–100 u of P/ha, and 200–250 u of K/ha.",
          "Irrigate.",
          "Carry out crop-maintenance operations through mulching, staking, hoeing, and earthing up where the crop is not mulched."
        ],
        "actionTypes": [
          "maintenance",
          "fertilization",
          "irrigation",
          "weedManagement"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed pages 27–28; PDF pages 7–8.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-032-greenhouse-eggplant",
        "month": 11,
        "cropKeys": [
          "eggplant"
        ],
        "cropContext": "Greenhouse eggplant",
        "section": "greenhouse",
        "operations": [
          "Nursery seed rates:",
          "Hybrid seed: 100–250 g/ha.",
          "Standard seed: 250–350 g/ha.",
          "Prepare the soil.",
          "Disinfect the soil.",
          "Apply base fertilizer:",
          "Organic: 40 t/ha of manure.",
          "Mineral: 100 u of N/ha, 150 u of P/ha, and 200 u of K/ha."
        ],
        "actionTypes": [
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 28; PDF page 8.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-033-greenhouse-cucumber-early-primeur-production",
        "month": 11,
        "cropKeys": [
          "cucumber"
        ],
        "cropContext": "Greenhouse cucumber — early/primeur production",
        "section": "greenhouse",
        "operations": [
          "Harvest.",
          "Apply maintenance fertilizer in three applications:",
          "First application at flowering: 40 u of N/ha.",
          "Second application three weeks after flowering: 40 u of N/ha and 50 u of K/ha.",
          "Third application during fruit development: 80 u of N/ha and 100 u of K/ha.",
          "Irrigate.",
          "Maintain the crop in Biskra."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed pages 28–29; PDF pages 8–9.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-034-greenhouse-strawberry-fresh-plants",
        "month": 11,
        "cropKeys": [
          "strawberry"
        ],
        "cropContext": "Greenhouse strawberry — fresh plants",
        "section": "greenhouse",
        "operations": [
          "Prepare the soil.",
          "Apply base fertilizer:",
          "Organic: 50 t/ha.",
          "Mineral: 150 u of N/ha, 80 u of P/ha, and 100 u of K/ha.",
          "Plant fresh strawberry plants at 70,000 plants/ha."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "sowing"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 29; PDF page 9.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-035-greenhouse-cantaloupe-biskra-nursery",
        "month": 11,
        "cropKeys": [
          "cantaloupe"
        ],
        "cropContext": "Greenhouse cantaloupe — Biskra nursery",
        "section": "greenhouse",
        "operations": [
          "Prepare the soil.",
          "Apply base fertilizer:",
          "Organic: 60 t/ha.",
          "Mineral: 100 u of N/ha, 150 u of P/ha, and 150 u of K/ha."
        ],
        "actionTypes": [
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 29; PDF page 9.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-036-greenhouse-zucchini-early-primeur-production",
        "month": 11,
        "cropKeys": [
          "zucchini"
        ],
        "cropContext": "Greenhouse zucchini — early/primeur production",
        "section": "greenhouse",
        "operations": [
          "Plant at 11,000–16,000 plants/ha.",
          "Irrigate.",
          "Apply phytosanitary treatments if necessary.",
          "Apply maintenance fertilizer in two applications:",
          "First application at fruit set: 30 u/ha, with the nutrient element not identified in the source.",
          "Second application 15 days after the first: 30 u of N/ha and 20 u of K/ha.",
          "Maintain the crop."
        ],
        "actionTypes": [
          "sowing",
          "irrigation",
          "cropProtection",
          "fertilization",
          "maintenance"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed pages 29–30; PDF pages 9–10.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-037-processing-tomato",
        "month": 11,
        "cropKeys": [
          "processing-tomato"
        ],
        "cropContext": "Processing tomato",
        "section": "industrial",
        "operations": [
          "Conduct autumn plowing.",
          "Apply base fertilizer at 60 u of N, 90 u of P, and 112 u of K per hectare."
        ],
        "actionTypes": [
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 30; PDF page 10.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-038-olive",
        "month": 11,
        "cropKeys": [
          "olive"
        ],
        "cropContext": "Olive",
        "section": "perennials",
        "operations": [
          "Finish harvesting table olives and begin harvesting olives for oil.",
          "Continue opening planting basins or pits.",
          "Begin new orchard plantings in semi-arid zones.",
          "Mark out and stake the parcels to be planted.",
          "Irrigate at planting with 30–50 L per plant, depending on soil type.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "harvest",
          "sowing",
          "maintenance",
          "irrigation",
          "soil",
          "cropProtection"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 31; PDF page 11.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-039-citrus",
        "month": 11,
        "cropKeys": [
          "citrus"
        ],
        "cropContext": "Citrus",
        "section": "perennials",
        "operations": [
          "Harvest satsumas and clementines and begin harvesting Thomson Navel oranges.",
          "Begin pruning harvested trees and applying wound-sealing paste.",
          "Continue cross-plowing on deeply prepared plots if soil conditions permit."
        ],
        "actionTypes": [
          "harvest",
          "maintenance",
          "soil"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 31; PDF page 11.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-040-stone-fruits-apricot-peach-cherry-and-almond",
        "month": 11,
        "cropKeys": [
          "stone-fruits"
        ],
        "cropContext": "Stone fruits — apricot, peach, cherry, and almond",
        "section": "perennials",
        "operations": [
          "Continue sowing green manure where appropriate.",
          "Plant new orchards.",
          "Begin winter pruning.",
          "Continue staking and opening planting basins or pits.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "sowing",
          "fertilization",
          "maintenance",
          "cropProtection"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 31; PDF page 11.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-041-pome-fruits-and-related-trees-apple-pear-quince-pomegranate-and-loquat",
        "month": 11,
        "cropKeys": [
          "pome-fruits"
        ],
        "cropContext": "Pome fruits and related trees — apple, pear, quince, pomegranate, and loquat",
        "section": "perennials",
        "operations": [
          "Continue and finish incorporating phospho-potassium fertilizer.",
          "Depending on available resources, spread well-decomposed organic fertilizer at 20 t/ha.",
          "Continue applying nitrogen fertilizer to loquat.",
          "Begin winter treatment.",
          "Remove suckers from rootstocks.",
          "Apply the first treatment against loquat scab, as stated by the source.",
          "Open planting basins or pits for new plantations and stake the plots.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "fertilization",
          "cropProtection",
          "maintenance",
          "sowing"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed pages 31–32; PDF pages 11–12.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-042-grapevine-established-production-vineyard",
        "month": 11,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — established production vineyard",
        "section": "perennials",
        "operations": [
          "Continue and finish harvesting late table grapes.",
          "Continue and finish the harvest–winemaking campaign in mountain zones.",
          "Continue opening the furrow.",
          "Continue applying phospho-potassium fertilizer."
        ],
        "actionTypes": [
          "harvest",
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 32; PDF page 12.",
          "pdfLength": "13 pages"
        }
      },
      {
        "id": "m11-043-grapevine-new-vineyard",
        "month": 11,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — new vineyard",
        "section": "perennials",
        "operations": [
          "Work the soil.",
          "Disc harrow parcels that have undergone deep soil preparation.",
          "Construct planting holes measuring 20 × 30 cm, as printed in the source.",
          "Mark out and stake parcels to be planted."
        ],
        "actionTypes": [
          "soil",
          "sowing",
          "maintenance"
        ],
        "source": {
          "file": "11-novembre_fr.pdf",
          "printedPages": "printed page 32; PDF page 12.",
          "pdfLength": "13 pages"
        }
      }
    ],
    "sourceNote": [
      "The source describes November as a transition month between two plant cycles and states that winter work should be undertaken. This framing explains the concentration of seedbed completion, cereal and forage sowing, orchard planting, winter pruning, soil preparation, and vineyard groundwork in the month’s operations.",
      "Source location: printed page 32; PDF page 12."
    ],
    "regionalQualifiers": [
      "The November cereal section provides explicit seeding rates based on rainfall and supplementary irrigation. Durum wheat is listed at 120–140 kg/ha in favorable 400–600 mm zones, 120–130 kg/ha in moderately favorable 300–400 mm zones, and 200 kg/ha with supplementary irrigation. Bread wheat is listed at 120–130 kg/ha, 115–120 kg/ha, and 200 kg/ha for the same respective contexts. The nitrogen program is also different: 2 q/ha of 46% urea in favorable zones and 3 q/ha under supplementary irrigation, each split one-third at sowing and two-thirds from tillering to stem elongation.",
      "The source assigns vetch–oat, pea–oat, and pea–triticale mixture sowing to coastal and sub-coastal zones, using two-thirds legume and one-third cereal. It identifies the High Plateaux for pepper and bell-pepper harvest, Biskra for greenhouse tomato, cucumber, and cantaloupe contexts, semi-arid zones for the beginning of new olive plantings, and mountain areas for the continuation and completion of the grape harvest and winemaking campaign."
    ],
    "companionNote": [
      "The November source describes monthly operations by crop, production cycle, rainfall or irrigation context, region, soil condition, and perennial status but does not provide explicit companion-planting or intercropping compatibility rules. The future calendar may show that two crops have operations in the same month, but this must be labeled as **same-month activity overlap**, not biological compatibility. Verified companion planting should come only from a separate source or a clearly labeled agronomic rule set."
    ],
    "uncertaintyNotes": [
      "The November calendar is an operational monthly guide, not a complete irrigation calculator, soil-test interpretation, phytosanitary product registry, disease forecast, or companion-planting database. FormulaAtlas can combine these monthly operations with its existing lifecycle, irrigation, nutrient, weather, INPV, field-record, and simulator tools, but the UI must distinguish source-derived values from user inputs and calculated recommendations.",
      "The tomato phytosanitary line is printed with an apparently incomplete or inconsistent reference to the “phytosanitary calendar of the potato”; this should remain flagged until the original annex is checked. The primeur-bean line says to disinfect the soil against `l’Ail`, which is agronomically ambiguous in the extracted source; it must not be silently changed to nematodes or another organism. The artichoke program retains 200 u N/ha in four applications from October through February without inferring the exact monthly distribution. The first greenhouse-zucchini application remains `30 u/ha` without a stated nutrient element. Olive planting irrigation is preserved as 30–50 L per plant according to soil type. The technical expressions `roulage`, `tallage`, `montaison`, `potets`, `plombage`, `ébourgeonnage`, `effeuillage`, `raie`, `sevrage`, and `traitement d’hiver` should receive localized explanations in the future tool. All phytosanitary references must link to the annexed calendar or FormulaAtlas safety gate rather than inventing products, doses, or treatment schedules."
    ]
  },
  {
    "number": 12,
    "key": "12",
    "name": {
      "en": "December",
      "fr": "Décembre",
      "ar": "ديسمبر"
    },
    "source": {
      "file": "12-decembre_fr.pdf",
      "institution": "",
      "documentTitle": "*Calendrier des Opérations Culturales*",
      "language": "French",
      "pdfLength": "14 pages",
      "printedPages": "33–45",
      "extractionStatus": "Complete text extraction reviewed manually; crop names, production contexts, operations, quantities, growth-stage timing, regional qualifiers, and source boundaries retained.",
      "interpretationRule": "`u` means the source’s fertilizer-unit notation and is intentionally not converted into kg. `q/ha` means quintals per hectare. Where the source points to an annex, crop leaflet, or phytosanitary calendar, the future tool must show that source reference rather than inventing a product, active ingredient, or dose."
    },
    "entries": [
      {
        "id": "m12-001-winter-cereals-durum-wheat-and-bread-wheat",
        "month": 12,
        "cropKeys": [
          "wheat"
        ],
        "cropContext": "Winter cereals — durum wheat and bread wheat",
        "section": "grandesCultures",
        "operations": [
          "Continue sowing.",
          "Apply nitrogen at sowing, with one-third of the dose applied at sowing.",
          "Phytosanitary treatment: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "sowing",
          "fertilization",
          "cropProtection"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 33; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-002-winter-cereals-barley-oats-and-triticale",
        "month": 12,
        "cropKeys": [
          "barley",
          "oats",
          "triticale"
        ],
        "cropContext": "Winter cereals — barley, oats, and triticale",
        "section": "grandesCultures",
        "operations": [
          "Continue sowing.",
          "Apply nitrogen at sowing: 1 q/ha of urea, either at sowing or at tillering according to the source.",
          "Phytosanitary treatment: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "sowing",
          "fertilization",
          "cropProtection"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 33; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-003-food-legumes-lentil-chickpea-dry-pea-and-fava-bean",
        "month": 12,
        "cropKeys": [
          "lentil",
          "chickpea",
          "fava-bean",
          "pea"
        ],
        "cropContext": "Food legumes — lentil, chickpea, dry pea, and fava bean",
        "section": "grandesCultures",
        "operations": [
          "Continue sowing.",
          "Apply 20–30 u/ha of nitrogen at sowing for good establishment."
        ],
        "actionTypes": [
          "sowing",
          "fertilization"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 33; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-004-bersim-irrigated-production",
        "month": 12,
        "cropKeys": [
          "bersim"
        ],
        "cropContext": "Bersim — irrigated production",
        "section": "grandesCultures",
        "operations": [
          "Make the first cut followed by irrigation."
        ],
        "actionTypes": [
          "irrigation"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 33; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-005-alfalfa",
        "month": 12,
        "cropKeys": [
          "alfalfa"
        ],
        "cropContext": "Alfalfa",
        "section": "grandesCultures",
        "operations": [
          "Dryland, frost-prone zone: conduct late sowing.",
          "Irrigated: make a cut at the beginning of the month."
        ],
        "actionTypes": [
          "sowing",
          "irrigation"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 33; PDF page 1.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-006-safflower",
        "month": 12,
        "cropKeys": [
          "safflower"
        ],
        "cropContext": "Safflower",
        "section": "grandesCultures",
        "operations": [
          "Sow at 15 kg/ha.",
          "Roll the seedbed.",
          "Apply nitrogen at sowing at 30 u/ha."
        ],
        "actionTypes": [
          "sowing",
          "fertilization"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 34; PDF page 2.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-007-rapeseed",
        "month": 12,
        "cropKeys": [
          "rapeseed"
        ],
        "cropContext": "Rapeseed",
        "section": "grandesCultures",
        "operations": [
          "Apply chemical post-emergence weed control against grasses."
        ],
        "actionTypes": [
          "weedManagement"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 34; PDF page 2.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-008-potato-late-season-production",
        "month": 12,
        "cropKeys": [
          "potato"
        ],
        "cropContext": "Potato — late-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Clean the plot."
        ],
        "actionTypes": [
          "harvest",
          "weedManagement"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 34; PDF page 2.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-009-potato-early-primeur-production",
        "month": 12,
        "cropKeys": [
          "potato"
        ],
        "cropContext": "Potato — early/primeur production",
        "section": "vegetables",
        "operations": [
          "Plant at 25–27 q/ha.",
          "Apply maintenance fertilizer two months after planting:",
          "1.5 q of 46% urea.",
          "2 q of 48% potassium sulfate.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "sowing",
          "fertilization",
          "maintenance",
          "cropProtection"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 34; PDF page 2.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-010-potato-seasonal-production",
        "month": 12,
        "cropKeys": [
          "potato"
        ],
        "cropContext": "Potato — seasonal production",
        "section": "vegetables",
        "operations": [
          "Prepare the soil.",
          "Apply base fertilizer:",
          "Organic: 25–30 t/ha of bovine or ovine manure.",
          "Mineral: 80–100 u of N/ha, 100–120 u of P/ha, and 200–240 u of K/ha.",
          "Pre-germinate seed tubers for 2–3 weeks before planting."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "sowing"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 34; PDF page 2.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-011-market-tomato-late-season-production",
        "month": 12,
        "cropKeys": [
          "market-tomato"
        ],
        "cropContext": "Market tomato — late-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Carry out crop-maintenance operations, including training, removal of side shoots, and leaf removal."
        ],
        "actionTypes": [
          "harvest",
          "maintenance"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 34; PDF page 2.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-012-carrot-and-turnip",
        "month": 12,
        "cropKeys": [
          "carrot",
          "turnip"
        ],
        "cropContext": "Carrot and turnip",
        "section": "vegetables",
        "operations": [
          "Plant through direct sowing at the following densities:",
          "Ordinary direct sowing: 1,200,000–1,600,000 plants/ha.",
          "Precision sowing: 2,000,000–2,400,000 plants/ha. The source’s printed spacing is irregular, but the intended range is retained as a source-normalized range.",
          "Prepare the soil.",
          "Disinfect the soil.",
          "Apply base fertilizer. Organic fertilizer is described as not recommended or only weakly recommended in the source.",
          "Apply mineral fertilizer at 150–200 u of N/ha, 200–250 u of K/ha, and 100–120 u of P/ha as Super 46%.",
          "Harvest."
        ],
        "actionTypes": [
          "sowing",
          "soil",
          "fertilization",
          "harvest"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed pages 35–36; PDF pages 3–4.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-013-eggplant-late-season-production",
        "month": 12,
        "cropKeys": [
          "eggplant"
        ],
        "cropContext": "Eggplant — late-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Irrigate according to need.",
          "Apply phytosanitary treatments.",
          "At the end of December, finish the harvest and clean the field."
        ],
        "actionTypes": [
          "harvest",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 35; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-014-fava-bean",
        "month": 12,
        "cropKeys": [
          "fava-bean"
        ],
        "cropContext": "Fava bean",
        "section": "vegetables",
        "operations": [
          "Direct sow at 80,000–120,000 plants/ha.",
          "Apply phytosanitary treatments.",
          "Hoe and earth up.",
          "Weed."
        ],
        "actionTypes": [
          "sowing",
          "cropProtection",
          "weedManagement"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 35; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-015-strawberry-seasonal-production",
        "month": 12,
        "cropKeys": [
          "strawberry"
        ],
        "cropContext": "Strawberry — seasonal production",
        "section": "vegetables",
        "operations": [
          "Plant in Skikda at 60,000–70,000 plants/ha.",
          "Pre-irrigate."
        ],
        "actionTypes": [
          "sowing",
          "irrigation"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 35; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-016-onion",
        "month": 12,
        "cropKeys": [
          "onion"
        ],
        "cropContext": "Onion",
        "section": "vegetables",
        "operations": [
          "Maintain the sowing."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 35; PDF page 3.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-017-garlic",
        "month": 12,
        "cropKeys": [
          "garlic"
        ],
        "cropContext": "Garlic",
        "section": "vegetables",
        "operations": [
          "Plant approximately 8–10 q/ha of cloves, equivalent to about 150,000–200,000 plants/ha.",
          "Irrigate.",
          "Disinfect the soil.",
          "Apply base fertilizer at 80 u of N/ha, 50 u of P/ha, and 150 u of K/ha.",
          "Phytosanitary treatments: refer to the annexed garlic leaflet.",
          "Maintain the crop through hoeing, earthing up, and weeding."
        ],
        "actionTypes": [
          "sowing",
          "irrigation",
          "soil",
          "fertilization",
          "cropProtection",
          "weedManagement"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed pages 35–36; PDF pages 3–4.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-018-cabbage-and-cauliflower-late-season-production",
        "month": 12,
        "cropKeys": [
          "cabbage",
          "cauliflower"
        ],
        "cropContext": "Cabbage and cauliflower — late-season production",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Irrigate."
        ],
        "actionTypes": [
          "harvest",
          "irrigation"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 36; PDF page 4.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-019-bean-early-primeur-production",
        "month": 12,
        "cropKeys": [
          "bean"
        ],
        "cropContext": "Bean — early/primeur production",
        "section": "vegetables",
        "operations": [
          "Prepare the soil.",
          "Apply base fertilizer:",
          "Organic: 15 t/ha of decomposed manure.",
          "Mineral: 50–80 u of N/ha, 80–100 u of P/ha, and 100–150 u of K/ha.",
          "Direct sow.",
          "Disinfect the soil. The source does not specify an organism or target in this December entry."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "sowing"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 36; PDF page 4.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-020-fennel",
        "month": 12,
        "cropKeys": [
          "fennel"
        ],
        "cropContext": "Fennel",
        "section": "vegetables",
        "operations": [
          "Harvest."
        ],
        "actionTypes": [
          "harvest"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 37; PDF page 5.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-021-leek",
        "month": 12,
        "cropKeys": [
          "leek"
        ],
        "cropContext": "Leek",
        "section": "vegetables",
        "operations": [
          "Construct nursery beds or raised propagation beds.",
          "Sow in a nursery."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 37; PDF page 5.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-022-cardoon",
        "month": 12,
        "cropKeys": [
          "cardoon"
        ],
        "cropContext": "Cardoon",
        "section": "vegetables",
        "operations": [
          "Sow and firm the seedbed.",
          "Thin.",
          "Hoe and hand-weed.",
          "Irrigate and apply phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "sowing",
          "weedManagement",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 37; PDF page 5.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-023-endive-chicory-winter-production",
        "month": 12,
        "cropKeys": [
          "endive"
        ],
        "cropContext": "Endive chicory — winter production",
        "section": "vegetables",
        "operations": [
          "Blanch.",
          "Irrigate and provide phytosanitary protection.",
          "Begin harvesting from the second half of the month."
        ],
        "actionTypes": [
          "irrigation",
          "cropProtection",
          "harvest"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 37; PDF page 5.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-024-artichoke-second-year-crop",
        "month": 12,
        "cropKeys": [
          "artichoke"
        ],
        "cropContext": "Artichoke — second-year crop",
        "section": "vegetables",
        "operations": [
          "Harvest.",
          "Apply maintenance fertilizer totaling 200 u of N/ha in four applications scheduled from October through February.",
          "Irrigate.",
          "Apply phytosanitary treatments if necessary.",
          "Weed."
        ],
        "actionTypes": [
          "harvest",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection",
          "weedManagement"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 37; PDF page 5.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-025-pea",
        "month": 12,
        "cropKeys": [
          "pea"
        ],
        "cropContext": "Pea",
        "section": "vegetables",
        "operations": [
          "Plant at 80 kg/ha.",
          "Prepare the soil.",
          "Disinfect the soil.",
          "Apply base fertilizer:",
          "Organic: 20 t/ha, spread three months before planting.",
          "Mineral: 30 u of N/ha, 90 u of P/ha, and 120 u of K/ha, preferably during rolling before sowing.",
          "Maintain the crop.",
          "Irrigate.",
          "Apply additional fertilizer as stated by the source.",
          "Apply phytosanitary treatments."
        ],
        "actionTypes": [
          "sowing",
          "soil",
          "fertilization",
          "weedManagement",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed pages 37–38; PDF pages 5–6.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-026-greenhouse-market-tomato-biskra",
        "month": 12,
        "cropKeys": [
          "greenhouse-tomato"
        ],
        "cropContext": "Greenhouse market tomato — Biskra",
        "section": "greenhouse",
        "operations": [
          "Harvest.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Plant.",
          "Prepare the soil.",
          "Disinfect the soil.",
          "Apply base fertilizer:",
          "Organic: 30–40 t/ha of manure.",
          "Mineral: 180 u of N/ha, 70 u of P/ha, and 200–250 u of K/ha."
        ],
        "actionTypes": [
          "harvest",
          "cropProtection",
          "sowing",
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 38; PDF page 6.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-027-greenhouse-market-tomato-other-regions",
        "month": 12,
        "cropKeys": [
          "greenhouse-tomato"
        ],
        "cropContext": "Greenhouse market tomato — other regions",
        "section": "greenhouse",
        "operations": [
          "Plant.",
          "Prepare the soil.",
          "Disinfect the soil.",
          "Apply base fertilizer:",
          "Organic: 30–40 t/ha of manure.",
          "Mineral: 180 u of N/ha, 70 u of P/ha, and 200–250 u of K/ha."
        ],
        "actionTypes": [
          "sowing",
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 39; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-028-greenhouse-strawberry",
        "month": 12,
        "cropKeys": [
          "strawberry"
        ],
        "cropContext": "Greenhouse strawberry",
        "section": "greenhouse",
        "operations": [
          "Plant 70,000 fresh plants/ha.",
          "Carry out crop maintenance through leaf removal.",
          "Harvest refrigerated plants (`plants frigo`), as stated by the source."
        ],
        "actionTypes": [
          "sowing",
          "maintenance",
          "harvest"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 39; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-029-greenhouse-climbing-bean",
        "month": 12,
        "cropKeys": [
          "greenhouse-climbing-bean"
        ],
        "cropContext": "Greenhouse climbing bean",
        "section": "greenhouse",
        "operations": [
          "Pre-irrigate.",
          "Sow at 90–100 kg/ha."
        ],
        "actionTypes": [
          "irrigation",
          "sowing"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 39; PDF page 7.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-030-greenhouse-pepper-and-bell-pepper",
        "month": 12,
        "cropKeys": [
          "pepper"
        ],
        "cropContext": "Greenhouse pepper and bell pepper",
        "section": "greenhouse",
        "operations": [
          "Biskra: begin the harvest.",
          "Coastal zone: plant.",
          "Prepare the soil.",
          "Apply maintenance fertilizer in four applications:",
          "First application before flowering: 40 u of N and 30 u of K.",
          "Second application at fruit set: 40 u of N and 60 u of K.",
          "Third application at fruit development: 30 u of N and 60 u of K.",
          "Fourth application after the first harvest: 20 u of N and 60 u of K.",
          "Irrigate.",
          "Apply phytosanitary treatments against noctuid moths, thrips, powdery mildew, and rots.",
          "Maintain the crop through mulching, staking, hoeing, and earthing up where the crop is not mulched."
        ],
        "actionTypes": [
          "harvest",
          "sowing",
          "soil",
          "fertilization",
          "maintenance",
          "irrigation",
          "cropProtection",
          "weedManagement"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed pages 39–40; PDF pages 7–8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-031-greenhouse-eggplant-early-primeur-production",
        "month": 12,
        "cropKeys": [
          "eggplant"
        ],
        "cropContext": "Greenhouse eggplant — early/primeur production",
        "section": "greenhouse",
        "operations": [
          "Plant at 15,000–20,000 plants/ha.",
          "Irrigate.",
          "Apply phytosanitary treatments if necessary."
        ],
        "actionTypes": [
          "sowing",
          "irrigation",
          "cropProtection"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 40; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-032-greenhouse-cantaloupe-biskra",
        "month": 12,
        "cropKeys": [
          "cantaloupe"
        ],
        "cropContext": "Greenhouse cantaloupe — Biskra",
        "section": "greenhouse",
        "operations": [
          "Plant."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 40; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-033-greenhouse-cantaloupe-other-regions",
        "month": 12,
        "cropKeys": [
          "cantaloupe"
        ],
        "cropContext": "Greenhouse cantaloupe — other regions",
        "section": "greenhouse",
        "operations": [
          "Operate the nursery.",
          "Prepare the soil.",
          "Apply base fertilizer:",
          "Organic: 60 t/ha.",
          "Mineral: 100 u of N/ha, 150 u of P/ha, and 150 u of K/ha.",
          "Disinfect the soil."
        ],
        "actionTypes": [
          "soil",
          "fertilization"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 40; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-034-greenhouse-cucumber",
        "month": 12,
        "cropKeys": [
          "cucumber"
        ],
        "cropContext": "Greenhouse cucumber",
        "section": "greenhouse",
        "operations": [
          "Prepare the soil.",
          "Disinfect the soil after analysis.",
          "Apply base fertilizer:",
          "Organic: 30–35 t/ha of manure.",
          "Mineral: 170–200 u of N/ha, 100–150 u of P/ha, and 200–250 u of K/ha.",
          "Operate the nursery.",
          "Harvest in Biskra."
        ],
        "actionTypes": [
          "soil",
          "fertilization",
          "harvest"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 40; PDF page 8.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-035-greenhouse-zucchini",
        "month": 12,
        "cropKeys": [
          "zucchini"
        ],
        "cropContext": "Greenhouse zucchini",
        "section": "greenhouse",
        "operations": [
          "Harvest.",
          "Irrigate.",
          "Apply phytosanitary treatments if necessary.",
          "Apply maintenance fertilizer in two applications:",
          "First application at fruit set: 30 u/ha, with the nutrient element not identified in the source.",
          "Second application 15 days after the first: 30 u of N/ha and 20 u of K/ha.",
          "Maintain the crop."
        ],
        "actionTypes": [
          "harvest",
          "irrigation",
          "cropProtection",
          "fertilization",
          "maintenance"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed pages 40–41; PDF pages 8–9.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-036-processing-tomato",
        "month": 12,
        "cropKeys": [
          "processing-tomato"
        ],
        "cropContext": "Processing tomato",
        "section": "industrial",
        "operations": [
          "Sow in nursery beds."
        ],
        "actionTypes": [
          "sowing"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 42; PDF page 10.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-037-olive",
        "month": 12,
        "cropKeys": [
          "olive"
        ],
        "cropContext": "Olive",
        "section": "perennials",
        "operations": [
          "Begin annual pruning and remove wild-olive suckers.",
          "Continue planting operations followed by the first irrigation at 30–50 L per plant.",
          "Finish harvesting black table olives.",
          "Continue harvesting olives for oil.",
          "Collect pruning wood, remove it from the plot, and burn it.",
          "Apply wound-sealing paste to pruning cuts.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "maintenance",
          "sowing",
          "irrigation",
          "harvest",
          "cropProtection"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed pages 42–43; PDF pages 10–11.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-038-citrus",
        "month": 12,
        "cropKeys": [
          "citrus"
        ],
        "cropContext": "Citrus",
        "section": "perennials",
        "operations": [
          "Harvest Thomson Navel oranges.",
          "Begin harvesting Hamline and Cadenera cultivars.",
          "Prune harvested trees and apply wound-sealing paste.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar.",
          "Collect and remove pruning wood.",
          "Mark out and open planting basins or pits for planting in healthy, light soils."
        ],
        "actionTypes": [
          "harvest",
          "maintenance",
          "cropProtection",
          "sowing"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 43; PDF page 11.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-039-stone-fruits-apricot-peach-cherry-and-almond",
        "month": 12,
        "cropKeys": [
          "stone-fruits"
        ],
        "cropContext": "Stone fruits — apricot, peach, cherry, and almond",
        "section": "perennials",
        "operations": [
          "Continue planting, completing almond planting where applicable.",
          "Continue pruning almond trees and mountain cherry trees.",
          "Begin winter treatment.",
          "Continue winter treatment as printed on the following page.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "sowing",
          "maintenance",
          "cropProtection"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed pages 43–44; PDF pages 11–12.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-040-pome-fruits-and-related-trees-apple-pear-quince-pomegranate-and-loquat",
        "month": 12,
        "cropKeys": [
          "pome-fruits"
        ],
        "cropContext": "Pome fruits and related trees — apple, pear, quince, pomegranate, and loquat",
        "section": "perennials",
        "operations": [
          "Begin annual pruning and apply wound-sealing paste to pruning cuts.",
          "Apply winter treatments.",
          "Weed.",
          "Remove and burn pruning wood.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "maintenance",
          "cropProtection",
          "weedManagement"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 44; PDF page 12.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-041-grapevine-established-production-vineyard",
        "month": 12,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — established production vineyard",
        "section": "perennials",
        "operations": [
          "Finish harvesting late grapes.",
          "Finish the harvest–winemaking campaign.",
          "Open a furrow on every other row.",
          "Apply phospho-potassium fertilizer:",
          "Table grape vineyard: 4 q/ha.",
          "Wine-grape vineyard: 2 q/ha.",
          "Begin pruning.",
          "Apply winter treatment, to be carried out every other year according to the source.",
          "Phytosanitary treatments: refer to the annexed phytosanitary calendar."
        ],
        "actionTypes": [
          "harvest",
          "soil",
          "fertilization",
          "maintenance",
          "cropProtection"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed pages 44–45; PDF pages 12–13.",
          "pdfLength": "14 pages"
        }
      },
      {
        "id": "m12-042-grapevine-new-vineyard",
        "month": 12,
        "cropKeys": [
          "grapevine"
        ],
        "cropContext": "Grapevine — new vineyard",
        "section": "perennials",
        "operations": [
          "Receive plants and place them in a temporary heeling-in or holding bed (`mise en jauge`).",
          "Continue installing windbreaks.",
          "Work the soil.",
          "Disc harrow parcels that have undergone deep soil preparation.",
          "Finish marking out and staking parcels to be planted.",
          "Construct planting holes measuring 20 × 30 cm, as printed in the source."
        ],
        "actionTypes": [
          "sowing",
          "soil",
          "maintenance"
        ],
        "source": {
          "file": "12-decembre_fr.pdf",
          "printedPages": "printed page 45; PDF page 13.",
          "pdfLength": "14 pages"
        }
      }
    ],
    "sourceNote": [
      "The source states that the vine enters vegetative rest in December. It identifies the beginning of pruning in coastal zones and requires received plants to be placed in a temporary holding or heeling-in bed. Together with the olive, citrus, orchard, and vineyard sections, this frames December as a month of winter pruning, wound protection, removal of pruning wood, orchard and vineyard planting preparation, and the continuation or completion of late harvests.",
      "Source location: printed page 45; PDF page 13."
    ],
    "regionalQualifiers": [
      "The December source distinguishes dryland alfalfa late sowing in frost-prone areas from an irrigated early-month cut. It identifies Skikda for seasonal strawberry planting at 60,000–70,000 plants/ha, Biskra for greenhouse tomato harvest and greenhouse cucumber harvest, Biskra for the beginning of greenhouse pepper harvest and cantaloupe planting, and the coastal zone for greenhouse pepper planting.",
      "The perennial sections distinguish black table olives from oil olives, healthy light soils for citrus planting, mountain cherry pruning, and coastal-zone grapevine pruning. The vineyard section also distinguishes established production from new-vineyard operations, including temporary heeling-in of received plants, windbreak installation, soil work, deep-prepared parcel disc harrowing, marking and staking, and 20 × 30 cm planting holes."
    ],
    "companionNote": [
      "The December source describes monthly operations by crop, production cycle, region, soil condition, climate context, and perennial status but does not provide explicit companion-planting or intercropping compatibility rules. The future calendar may show that two crops have operations in the same month, but this must be labeled as **same-month activity overlap**, not biological compatibility. Verified companion planting should come only from a separate source or a clearly labeled agronomic rule set."
    ],
    "uncertaintyNotes": [
      "The December calendar is an operational monthly guide, not a complete irrigation calculator, soil-test interpretation, phytosanitary product registry, disease forecast, or companion-planting database. FormulaAtlas can combine these monthly operations with its existing lifecycle, irrigation, nutrient, weather, INPV, field-record, and simulator tools, but the UI must distinguish source-derived values from user inputs and calculated recommendations.",
      "The source’s precision-sowing range for carrot and turnip contains irregular spacing in the printed text; it is normalized as 2,000,000–2,400,000 plants/ha while preserving the fact that this is a source-normalized reading. Greenhouse strawberry includes the phrase `Récolte plants frigo`, which is retained as printed because its exact operational meaning should be checked against the original context. The first greenhouse-zucchini maintenance application remains `30 u/ha` without a stated nutrient element. Artichoke fertilizer remains 200 u N/ha in four applications from October through February without an inferred monthly distribution. Winter treatment is recorded as a source-level operation, and vineyard winter treatment is explicitly noted as occurring every other year; the future tool must not turn either into an invented product schedule. The technical expressions `mise en jauge`, `masticage des plaies`, `potets`, `raie`, `rejets d’oléastres`, `traitement d’hiver`, and `repos végétatif` should receive localized explanations. All phytosanitary references must link to the annexed calendar or FormulaAtlas safety gate rather than inventing products, doses, or treatment schedules."
    ]
  }
];

export const ALGERIA_CALENDAR_ENTRIES: AlgeriaCalendarEntry[] = ALGERIA_CALENDAR_MONTHS.flatMap(month => month.entries);

export const CALENDAR_ACTION_LABELS: Record<CalendarActionType, { en: string; fr: string; ar: string }> = {
  sowing: { en: 'Sowing / planting', fr: 'Semis / plantation', ar: 'البذر / الزراعة' },
  harvest: { en: 'Harvest', fr: 'Récolte', ar: 'الحصاد' },
  irrigation: { en: 'Irrigation', fr: 'Irrigation', ar: 'الري' },
  fertilization: { en: 'Fertilization', fr: 'Fertilisation', ar: 'التسميد' },
  soil: { en: 'Soil preparation', fr: 'Préparation du sol', ar: 'تحضير التربة' },
  weedManagement: { en: 'Weed / surface management', fr: 'Adventices / surface du sol', ar: 'إدارة الأعشاب / سطح التربة' },
  maintenance: { en: 'Crop maintenance', fr: 'Entretien de la culture', ar: 'خدمة المحصول' },
  cropProtection: { en: 'Crop protection reference', fr: 'Référence phytosanitaire', ar: 'مرجع وقاية النبات' },
  observation: { en: 'Source observation', fr: 'Observation de la source', ar: 'ملاحظة المصدر' },
};

export const CALENDAR_SECTION_LABELS: Record<CalendarSection, { en: string; fr: string; ar: string }> = {
  grandesCultures: { en: 'Field crops', fr: 'Grandes cultures', ar: 'المحاصيل الكبرى' },
  forage: { en: 'Forage crops', fr: 'Fourrages', ar: 'الأعلاف' },
  oilseeds: { en: 'Oilseeds', fr: 'Oléagineux', ar: 'المحاصيل الزيتية' },
  vegetables: { en: 'Open-field vegetables', fr: 'Cultures maraîchères de plein champ', ar: 'الخضروات في الحقل المفتوح' },
  greenhouse: { en: 'Protected / greenhouse crops', fr: 'Cultures protégées / sous serre', ar: 'المحاصيل المحمية / البيوت المحمية' },
  industrial: { en: 'Industrial crops', fr: 'Cultures industrielles', ar: 'المحاصيل الصناعية' },
  perennials: { en: 'Perennial crops', fr: 'Cultures pérennes', ar: 'المحاصيل المعمرة' },
};

export const CALENDAR_CROP_LABELS: Record<string, { en: string; fr: string; ar: string }> = {
  wheat: { en: 'Wheat', fr: 'Blé', ar: 'القمح' },
  barley: { en: 'Barley', fr: 'Orge', ar: 'الشعير' },
  oats: { en: 'Oats', fr: 'Avoine', ar: 'الشوفان' },
  triticale: { en: 'Triticale', fr: 'Triticale', ar: 'التريتيكال' },
  lentil: { en: 'Lentil', fr: 'Lentille', ar: 'العدس' },
  chickpea: { en: 'Chickpea', fr: 'Pois chiche', ar: 'الحمص' },
  'fava-bean': { en: 'Fava bean', fr: 'Fève', ar: 'الفول' },
  bean: { en: 'Bean', fr: 'Haricot', ar: 'الفاصوليا' },
  'climbing-bean': { en: 'Climbing bean', fr: 'Haricot grimpant', ar: 'الفاصوليا المتسلقة' },
  'greenhouse-climbing-bean': { en: 'Greenhouse climbing bean', fr: 'Haricot grimpant sous serre', ar: 'الفاصوليا المتسلقة في البيوت المحمية' },
  pea: { en: 'Pea', fr: 'Pois', ar: 'البازلاء' },
  bersim: { en: 'Bersim', fr: 'Bersim', ar: 'البرسيم المصري' },
  alfalfa: { en: 'Alfalfa', fr: 'Luzerne', ar: 'الفصة' },
  'italian-ryegrass': { en: 'Italian ryegrass', fr: 'Ray-grass italien', ar: 'الراي غراس الإيطالي' },
  'fodder-maize': { en: 'Fodder maize', fr: 'Maïs fourrager', ar: 'الذرة العلفية' },
  'fodder-sorghum': { en: 'Fodder sorghum', fr: 'Sorgho fourrager', ar: 'الذرة الرفيعة العلفية' },
  'forage-mixture': { en: 'Forage mixtures', fr: 'Mélanges fourragers', ar: 'خلطات الأعلاف' },
  safflower: { en: 'Safflower', fr: 'Carthame', ar: 'العصفر' },
  sunflower: { en: 'Sunflower', fr: 'Tournesol', ar: 'عباد الشمس' },
  rapeseed: { en: 'Rapeseed', fr: 'Colza', ar: 'اللفت الزيتي' },
  potato: { en: 'Potato', fr: 'Pomme de terre', ar: 'البطاطا' },
  'market-tomato': { en: 'Market tomato', fr: 'Tomate maraîchère', ar: 'الطماطم السوقية' },
  'greenhouse-tomato': { en: 'Greenhouse tomato', fr: 'Tomate sous serre', ar: 'طماطم البيوت المحمية' },
  'processing-tomato': { en: 'Processing tomato', fr: 'Tomate industrielle', ar: 'الطماطم الصناعية' },
  carrot: { en: 'Carrot', fr: 'Carotte', ar: 'الجزر' },
  turnip: { en: 'Turnip', fr: 'Navet', ar: 'اللفت' },
  eggplant: { en: 'Eggplant', fr: 'Aubergine', ar: 'الباذنجان' },
  cabbage: { en: 'Cabbage', fr: 'Chou', ar: 'الملفوف' },
  cauliflower: { en: 'Cauliflower', fr: 'Chou-fleur', ar: 'القرنبيط' },
  onion: { en: 'Onion', fr: 'Oignon', ar: 'البصل' },
  garlic: { en: 'Garlic', fr: 'Ail', ar: 'الثوم' },
  fennel: { en: 'Fennel', fr: 'Fenouil', ar: 'الشمر' },
  leek: { en: 'Leek', fr: 'Poireau', ar: 'الكراث' },
  celery: { en: 'Celery', fr: 'Céleri', ar: 'الكرفس' },
  cardoon: { en: 'Cardoon', fr: 'Cardon', ar: 'الخرشوف الشوكي' },
  endive: { en: 'Endive chicory', fr: 'Chicorée endive', ar: 'الهندباء البلجيكية' },
  artichoke: { en: 'Artichoke', fr: 'Artichaut', ar: 'الخرشوف' },
  cucumber: { en: 'Cucumber', fr: 'Concombre', ar: 'الخيار' },
  zucchini: { en: 'Zucchini', fr: 'Courgette', ar: 'الكوسة' },
  cantaloupe: { en: 'Cantaloupe / melon', fr: 'Cantaloup / melon', ar: 'الشمام / البطيخ الأصفر' },
  watermelon: { en: 'Watermelon', fr: 'Pastèque', ar: 'البطيخ' },
  strawberry: { en: 'Strawberry', fr: 'Fraise', ar: 'الفراولة' },
  okra: { en: 'Okra', fr: 'Gombo', ar: 'البامية' },
  pepper: { en: 'Pepper / bell pepper', fr: 'Poivron / piment', ar: 'الفلفل' },
  olive: { en: 'Olive', fr: 'Olivier', ar: 'الزيتون' },
  citrus: { en: 'Citrus', fr: 'Agrumes', ar: 'الحمضيات' },
  'stone-fruits': { en: 'Stone fruits', fr: 'Rosacées à noyau', ar: 'الفواكه ذات النواة' },
  'pome-fruits': { en: 'Pome fruits', fr: 'Rosacées à pépins', ar: 'الفواكه ذات البذور' },
  grapevine: { en: 'Grapevine', fr: 'Vigne', ar: 'الكرمة' },
};

export function getCalendarMonth(month: number): AlgeriaCalendarMonth | undefined {
  return ALGERIA_CALENDAR_MONTHS.find(item => item.number === month);
}

export function getCalendarEntries(options: { month?: number; cropKeys?: string[]; actionTypes?: CalendarActionType[] } = {}): AlgeriaCalendarEntry[] {
  return ALGERIA_CALENDAR_ENTRIES.filter(entry => {
    if (options.month && entry.month !== options.month) return false;
    if (options.cropKeys?.length && !entry.cropKeys.some(key => options.cropKeys?.includes(key))) return false;
    if (options.actionTypes?.length && !entry.actionTypes.some(type => options.actionTypes?.includes(type))) return false;
    return true;
  });
}

export function getCalendarCropKeys(entries: AlgeriaCalendarEntry[] = ALGERIA_CALENDAR_ENTRIES): string[] {
  return Array.from(new Set(entries.flatMap(entry => entry.cropKeys))).sort((a, b) => (CALENDAR_CROP_LABELS[a]?.en ?? a).localeCompare(CALENDAR_CROP_LABELS[b]?.en ?? b));
}

export function getCalendarCropLabel(cropKey: string, language: 'en' | 'fr' | 'ar'): string {
  return CALENDAR_CROP_LABELS[cropKey]?.[language] ?? cropKey;
}
