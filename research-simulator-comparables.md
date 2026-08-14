# Crop Business Simulator Research Notes

## Comparable products and concepts

The initial comparable-product search identified these reference points:

- Harvest Profit — https://www.harvestprofit.com/ — field-level profitability, cost/profit tracking, and grain marketing planning.
- FARMSIM, Texas A&M — https://blackland.tamu.edu/models/farmsim/ — multi-year farm-income simulation for representative farms.
- Agricultural Budget Calculator, University of Nebraska–Lincoln — https://cap.unl.edu/abc/ — enterprise budgets for cost of production and projected cash flow.
- Wisconsin Extension enterprise budgeting — https://farms.extension.wisc.edu/articles/enterprise-budgeting/ — enterprise budgets organize income, expenses, and profit for one farm enterprise.
- OSU Enterprise Budgets — https://farmoffice.osu.edu/farm-management/enterprise-budgets — structured crop enterprise-budget reference.
- Farm business planning, USDA Farmers.gov — https://www.farmers.gov/your-business/beginning-farmers/business-plan — business-plan framing for start-up, profitability, and growth.
- P2PAgri — https://p2pagri.com.au/ — scenario analysis, cash-flow management, and multi-year planning.

## Product gap to exploit

The common pattern is financial planning, enterprise budgets, cost tracking, and sometimes multi-year scenarios. FormulaAtlas can differentiate by combining editable household-to-field overhead allocation, Algeria-aware phytosanitary index selection, crop-calendar labor generation, agronomic yield and risk relationships, local currency and units, and transparent scenario explanations in one workflow rather than presenting only a static budget sheet.

## Algeria context verified from public sources

The USDA Algeria Grain and Feed Annual reports that wheat and barley planting commonly occurs from September to December, the growing season runs roughly January to mid-May, and harvest begins in early summer. It also notes that consecutive drought years delayed sowing for rainfed farms, while irrigated plots could start earlier. The report states that the Algerian Office of Cereals purchase references in place at the time were 60,000 DZD/tonne for durum wheat, 50,000 DZD/tonne for bread wheat, and 34,000 DZD/tonne for barley and oats. It further reports subsidized distribution of certified seeds, fertilizers, and technical/financial resources, and describes most cereal production as rainfed. Source: USDA Foreign Agricultural Service, Grain and Feed Annual, Algeria, 22 March 2024 — https://apps.fas.usda.gov/newgainapi/api/Report/DownloadReportByFileName?fileName=Grain%20and%20Feed%20Annual_Algiers_Algeria_AG2024-0002.pdf.

These facts support Simulator defaults for DZD/tonne reference prices, a rainfed-versus-irrigated switch, subsidized input presets, and explicit drought/yield-risk scenarios. They are used as editable starting references rather than guarantees of current market pricing.
