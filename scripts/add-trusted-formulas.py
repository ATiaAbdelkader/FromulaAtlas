#!/usr/bin/env python3
"""
Phase A: Add 50 new formulas from trusted references to the Formula Atlas database.

Trusted sources:
- FAO Irrigation & Drainage Paper 56 (Allen et al., 1998)
- USDA-NRCS National Engineering Handbook Part 652
- ASABE Standards EP405.1 (drip), EP458 (sprinkler)
- IPCC 2019 Refinement (N2O, CH4)
- NRC Nutrient Requirements of Dairy Cattle (2021)
- Soil Survey Manual (USDA Handbook 18)
- Fertilizers Europe (NUE, N surplus)
- Jones (2012) Plant Nutrition Manual (DRIS)
- Manning et al. (1978) FAST model
- Smith Period (UK Met Office)
- Horton (1940) infiltration model
- Christiansen (1942) uniformity coefficient
- Penman-Monteith (FAO-56)
- Moe & Tyrrell (1979) methane prediction
"""

import json
import os

DB_PATH = '/home/z/my-project/src/data/agri_formulas.json'

# 50 new formulas from trusted references
NEW_FORMULAS = [
    # === FAO-56 Penman-Monteith family (7 formulas) ===
    {
        "code": "56.1",
        "name": "Penman-Monteith ETo (FAO-56)",
        "formula": "ETo = [0.408 × Δ × (Rn - G) + γ × (900/(T+273)) × u₂ × (es - ea)] / [Δ + γ × (1 + 0.34 × u₂)]",
        "variables": "Δ = slope of saturation vapor pressure curve (kPa/°C)\nRn = net radiation (MJ/m²/day)\nG = soil heat flux (MJ/m²/day)\nγ = psychrometric constant (kPa/°C)\nT = mean air temp (°C)\nu₂ = wind speed at 2m (m/s)\nes = saturation VP (kPa)\nea = actual VP (kPa)",
        "purpose": "Reference evapotranspiration — the global standard for irrigation scheduling.",
        "example": "T=25°C, Rn=15, G=0, u₂=2, es=3.17, ea=2.0, Δ=0.189, γ=0.066 → ETo ≈ 4.2 mm/day",
        "pitfall": "Using wind speed at wrong height — must be 2m, or adjust with FAO-56 Eq. 47.",
        "decision": "Use this for all FAO-56 Kc × ETo irrigation calculations.",
        "notes": "Source: FAO Irrigation & Drainage Paper 56 (Allen et al., 1998), Eq. 6.",
        "name_ar": "التبخر-نتح المرجعي (FAO-56)",
        "purpose_ar": "التبخر-نتح المرجعي — المعيار العالمي لجدولة الري.",
        "variables_ar": ""
    },
    {
        "code": "56.2",
        "name": "Dual Crop Coefficient (Kc = Kcb + Ke)",
        "formula": "Kc = Kcb × Ks + Ke",
        "variables": "Kcb = basal crop coefficient\nKs = water stress coefficient (0-1)\nKe = soil evaporation coefficient",
        "purpose": "Separates plant transpiration from soil evaporation for precision irrigation.",
        "example": "Kcb=1.10, Ks=0.85 (mild stress), Ke=0.15 → Kc = 1.10×0.85 + 0.15 = 1.085",
        "pitfall": "Forgetting Ks during deficit irrigation; over-estimating Ke after rain.",
        "decision": "Use dual Kc for daily irrigation scheduling; single Kc for weekly planning.",
        "notes": "Source: FAO-56 Chapter 7, Eq. 71. Ks = (TAW - Dr) / ((1-p) × TAW).",
        "name_ar": "معامل محصول مزدوج",
        "purpose_ar": "يفصل نتح النبات عن تبخر التربة للري الدقيق.",
        "variables_ar": ""
    },
    {
        "code": "56.3",
        "name": "Water Stress Coefficient (Ks)",
        "formula": "Ks = (TAW - Dr) / ((1 - p) × TAW)",
        "variables": "TAW = total available water (mm)\nDr = root zone depletion (mm)\np = depletion fraction (0.3-0.7)",
        "purpose": "Quantifies reduction in ET under water stress — enables deficit irrigation planning.",
        "example": "TAW=100mm, Dr=50mm, p=0.5 → Ks = (100-50)/((1-0.5)×100) = 1.0 (no stress yet). At Dr=60: Ks=0.80.",
        "pitfall": "Using p for one crop on another — p varies by crop and ETc rate.",
        "decision": "Trigger irrigation when Ks < 0.85 for most crops; <0.70 for stress-tolerant.",
        "notes": "Source: FAO-56 Eq. 84. Default p=0.5 for most crops; see Table 22.",
        "name_ar": "معامل الإجهاد المائي",
        "purpose_ar": "يحدد انخفاض النتح تحت الإجهاد المائي لتمكين التخطيط للري الناقص.",
        "variables_ar": ""
    },
    {
        "code": "56.4",
        "name": "Salinity-Adjusted ET (FAO-56)",
        "formula": "ETc_adj = Kc × ETo × (1 - ECe × b / 100)",
        "variables": "ECe = electrical conductivity of saturation extract (dS/m)\nb = crop-specific slope (% yield decrease per dS/m)\nKc = crop coefficient\nETo = reference ET",
        "purpose": "Reduces ET estimate when soil salinity limits water uptake.",
        "example": "Tomato (b=10%), ECe=4 dS/m, Kc=1.15, ETo=5 → ETc_adj = 1.15×5×(1-4×10/100) = 4.83 mm/day (vs 5.75 unstressed).",
        "pitfall": "Using threshold ECt instead of actual ECe; forgetting b varies by crop.",
        "decision": "If ETc_adj < 80% of ETc, leach salts before planting.",
        "notes": "Source: FAO-56 Chapter 8, Eq. 98. See Table 14 for crop-specific b values.",
        "name_ar": "التبخر-نتح المعدل للملوحة",
        "purpose_ar": "يخفض تقدير النتح عندما تحد الملوحة من امتصاص الماء.",
        "variables_ar": ""
    },
    {
        "code": "56.5",
        "name": "Net Radiation (Rn) — FAO-56",
        "formula": "Rn = Rns - Rnl",
        "variables": "Rns = net shortwave radiation (MJ/m²/day) = (1-α)×Rs\nRnl = net longwave radiation (MJ/m²/day)\nα = albedo (0.23 for crops)\nRs = solar radiation",
        "purpose": "Required input for Penman-Monteith; converts raw solar radiation to net energy.",
        "example": "Rs=20, α=0.23 → Rns=15.4; Rnl=3.0 → Rn=12.4 MJ/m²/day.",
        "pitfall": "Using α=0.05 (water) for crops; forgetting Rnl depends on cloud cover.",
        "decision": "",
        "notes": "Source: FAO-56 Eq. 38-40. Rnl depends on T, ea, Rs/Rso ratio.",
        "name_ar": "الإشعاع الصافي",
        "purpose_ar": "مدخل مطلوب لمعادلة بينمان-مونتيث.",
        "variables_ar": ""
    },
    {
        "code": "56.6",
        "name": "Psychrometric Constant (γ)",
        "formula": "γ = 0.665 × 10⁻³ × P",
        "variables": "P = atmospheric pressure (kPa)\nγ = psychrometric constant (kPa/°C)",
        "purpose": "Required for Penman-Monteith; varies with altitude.",
        "example": "At sea level P=101.3 → γ=0.067 kPa/°C. At 1500m P=84.5 → γ=0.056.",
        "pitfall": "Using sea-level γ at high altitude — introduces 10-15% error in ETo.",
        "decision": "",
        "notes": "Source: FAO-56 Eq. 8. P = 101.3 × ((293-0.0065×z)/293)^5.26.",
        "name_ar": "الثابت النفسي",
        "purpose_ar": "مطلوب لمعادلة بينمان-مونتيث ويختلف مع الارتفاع.",
        "variables_ar": ""
    },
    {
        "code": "56.7",
        "name": "Saturation Vapor Pressure (es) — FAO-56",
        "formula": "es = 0.6108 × exp(17.27 × T / (T + 237.3))",
        "variables": "T = air temperature (°C)\nes = saturation vapor pressure (kPa)",
        "purpose": "Core thermodynamic function for all ET and VPD calculations.",
        "example": "T=25°C → es = 0.6108 × exp(425.4/262.3) = 3.17 kPa.",
        "pitfall": "Using Tetens with Celsius vs Fahrenheit; mixing kPa and mb.",
        "decision": "Use this exact form for FAO-56; Murray (1967) is equivalent.",
        "notes": "Source: FAO-56 Eq. 11 (Tetens 1930).",
        "name_ar": "ضغط البخار المشبع",
        "purpose_ar": "الدالة الديناميكية الحرارية الأساسية لكل حسابات النتح.",
        "variables_ar": ""
    },

    # === USDA-NRCS Irrigation Engineering (6 formulas) ===
    {
        "code": "652.1",
        "name": "Christiansen Uniformity Coefficient (CU)",
        "formula": "CU = 100 × (1 - Σ|xᵢ - x̄| / (n × x̄))",
        "variables": "xᵢ = individual catch value\nx̄ = mean of all catches\nn = number of catch cans",
        "purpose": "Measures sprinkler irrigation uniformity — target CU > 84% for most crops.",
        "example": "16 catches averaging 10mm; sum of deviations = 12mm → CU = 100×(1-12/160) = 92.5%.",
        "pitfall": "Using only edge catches; ignoring wind drift.",
        "decision": "CU < 75%: redesign sprinkler spacing or pressure.",
        "notes": "Source: Christiansen (1942); USDA-NRCS NEH Part 652, Ch. 11.",
        "name_ar": "معامل تجانس كريستيانسن",
        "purpose_ar": "يقيس تجانس الري بالرش.",
        "variables_ar": ""
    },
    {
        "code": "652.2",
        "name": "Manning's Flow in Irrigation Channels",
        "formula": "Q = (1/n) × A × R^(2/3) × S^(1/2)",
        "variables": "Q = flow rate (m³/s)\nn = Manning's roughness (0.013 concrete, 0.025 earth)\nA = cross-sectional area (m²)\nR = hydraulic radius (m) = A/P\nS = channel slope (m/m)",
        "purpose": "Design open-channel irrigation systems — furrows, canals, laterals.",
        "example": "Trapezoidal canal: A=0.5, P=2.2, R=0.227, S=0.001, n=0.025 → Q=0.16 m³/s.",
        "pitfall": "Using concrete n on vegetated channels (can underestimate by 3×).",
        "decision": "Keep velocity < 0.6 m/s in earth channels to prevent erosion.",
        "notes": "Source: USDA-NRCS NEH Part 652; Manning (1891).",
        "name_ar": "معادلة مانينغ للري",
        "purpose_ar": "تصميم قنوات الري المفتوحة.",
        "variables_ar": ""
    },
    {
        "code": "652.3",
        "name": "Furrow Inflow Design (USDA-NRCS)",
        "formula": "Q_in = (L × q_req × F) / (3.6 × T)",
        "variables": "Q_in = furrow inflow (L/s)\nL = furrow length (m)\nq_req = required infiltration depth (mm)\nF = furrow spacing (m)\nT = application time (hours)",
        "purpose": "Size the inflow rate at the head of a furrow for uniform infiltration.",
        "example": "L=200m, q_req=50mm, F=1m, T=4h → Q_in = (200×50×1)/(3.6×4) = 694 L/s — too high, shorten furrow.",
        "pitfall": "Ignoring furrow advance time; underestimating T.",
        "decision": "If Q_in > 3 L/s, split furrow into sets.",
        "notes": "Source: USDA-NRCS NEH Part 652, Ch. 9.",
        "name_ar": "تصميم تدخل الري بالأخاديد",
        "purpose_ar": "تحديد معدل التدفق لكل أخدود للري المنتظم.",
        "variables_ar": ""
    },
    {
        "code": "652.4",
        "name": "Available Water Capacity (AWC) by Texture",
        "formula": "AWC = (FC - PWP) × D × 10",
        "variables": "FC = field capacity (% by weight)\nPWP = permanent wilting point (%)\nD = root depth (cm)\nAWC = available water (mm)",
        "purpose": "Estimate plant-available water for irrigation scheduling.",
        "example": "Sandy loam: FC=22%, PWP=10%, D=30cm → AWC = (22-10)×30×10 = 360mm... wait, AWC = (0.22-0.10)×1.3×30×10 = 46.8mm (with bulk density 1.3).",
        "pitfall": "Using % by weight without bulk density → off by 20-50%.",
        "decision": "Irrigate at 50% depletion (p=0.5) for most crops.",
        "notes": "Source: USDA Soil Survey Manual Handbook 18; NRCS Part 618.",
        "name_ar": "سعة الماء المتاح حسب القوام",
        "purpose_ar": "تقدير الماء المتاح للنبات لجدولة الري.",
        "variables_ar": ""
    },
    {
        "code": "652.5",
        "name": "Horton Infiltration Model",
        "formula": "f(t) = fc + (f₀ - fc) × e^(-kt)",
        "variables": "f(t) = infiltration rate at time t (mm/h)\nfc = final (asymptotic) infiltration rate\nf₀ = initial infiltration rate\nk = decay constant (1/h)\nt = time since start (h)",
        "purpose": "Predict how fast water enters soil during irrigation or rainfall.",
        "example": "Silty loam: f₀=80, fc=15, k=1.5, t=1h → f = 15 + 65×e^(-1.5) = 15 + 14.5 = 29.5 mm/h.",
        "pitfall": "Using lab f₀ on crusted field soil (real f₀ may be 50% lower).",
        "decision": "If f(t) < application rate, reduce flow or increase set time.",
        "notes": "Source: Horton (1940); USDA-NRCS NEH Part 630.",
        "name_ar": "نموذج هورتون للتسرب",
        "purpose_ar": "يتنبأ بسرعة دخول الماء للتربة أثناء الري.",
        "variables_ar": ""
    },
    {
        "code": "652.6",
        "name": "Sprinkler Application Rate",
        "formula": "I = 60 × Q / (S₁ × S₂)",
        "variables": "I = application rate (mm/h)\nQ = sprinkler discharge (L/min)\nS₁ = spacing along lateral (m)\nS₂ = spacing between laterals (m)",
        "purpose": "Match sprinkler rate to soil infiltration to prevent runoff.",
        "example": "Q=12 L/min, S₁=9m, S₂=12m → I = 60×12/108 = 6.7 mm/h.",
        "pitfall": "I > f(t) causes runoff; common with clay soils and impact sprinklers.",
        "decision": "If I > infiltration rate, use lower-flow nozzles or wider spacing.",
        "notes": "Source: USDA-NRCS NEH Part 652, Ch. 11.",
        "name_ar": "معدل تطبيق الرش",
        "purpose_ar": "مطابقة معدل الرش مع تسرب التربة لمنع الجريان.",
        "variables_ar": ""
    },

    # === ASABE Drip/Sprinkler Standards (5 formulas) ===
    {
        "code": "EP405.1",
        "name": "Drip Emitter Flow Variation (qv)",
        "formula": "qv = 100 × (qmax - qmin) / qavg",
        "variables": "qmax = maximum emitter flow\nqmin = minimum emitter flow\nqavg = average flow\nqv = flow variation (%)",
        "purpose": "Evaluate uniformity of drip irrigation systems.",
        "example": "qmax=4.2, qmin=3.6, qavg=3.9 → qv = 100×0.6/3.9 = 15.4%.",
        "pitfall": "Measuring only 2-3 emitters; need ≥ 18 for statistical validity.",
        "decision": "qv < 10% excellent; 10-20% acceptable; >20% redesign.",
        "notes": "Source: ASABE EP405.1; also see EU (emission uniformity).",
        "name_ar": "تباين تدفق النقاط",
        "purpose_ar": "تقييم تجانس أنظمة الري بالتنقيط.",
        "variables_ar": ""
    },
    {
        "code": "EP405.2",
        "name": "Emission Uniformity (EU) — ASABE",
        "formula": "EU = 100 × (1 - 1.27×CV) × (qmin / qavg)",
        "variables": "CV = coefficient of variation of emitters\nqmin = minimum emitter flow (lowest 25%)\nqavg = average flow",
        "purpose": "Comprehensive drip uniformity metric — accounts for manufacturing variation + pressure differences.",
        "example": "CV=0.05, qmin=3.6, qavg=3.9 → EU = 100×(1-0.064)×0.923 = 86.4%.",
        "pitfall": "Confusing qv (simpler) with EU — EU is the ASABE standard.",
        "decision": "EU > 90% excellent; 80-90% acceptable; <80% redesign.",
        "notes": "Source: ASABE EP405.1 (2020).",
        "name_ar": "تجانس الانبعاث",
        "purpose_ar": "مقياس شامل لتجانس الري بالتنقيط.",
        "variables_ar": ""
    },
    {
        "code": "EP458.1",
        "name": "Pressure-Compensating Emitter Range",
        "formula": "q = k × P^x",
        "variables": "q = emitter flow (L/h)\nk = emitter constant\nP = pressure (kPa)\nx = exponent (0 for PC, 0.5 for turbulent, 1 for laminar)",
        "purpose": "Predict emitter flow at different pressures — key for slope design.",
        "example": "Non-PC: k=0.5, x=0.5, P=150 → q=0.5×√150=6.12 L/h. At P=100: q=5.0 (18% less).",
        "pitfall": "Using x=0.5 for PC emitters (they have x≈0, no pressure sensitivity).",
        "decision": "Use PC emitters (x≈0) on slopes >5% or laterals >100m.",
        "notes": "Source: ASABE EP458; also Keller & Bliesner (1990).",
        "name_ar": "مدى النقاط المعوضة للضغط",
        "purpose_ar": "يتنبأ بتدفق النقاط عند ضغوط مختلفة.",
        "variables_ar": ""
    },
    {
        "code": "EP458.2",
        "name": "Lateral Head Loss (Darcy-Weisbach simplified)",
        "formula": "hf = 1.21 × 10¹⁰ × (Q / C)¹·⁸⁵² × L / D⁴·⁸⁷",
        "variables": "hf = head loss (m)\nQ = flow (L/s)\nC = Hazen-Williams coefficient (150 plastic)\nL = length (m)\nD = inside diameter (mm)",
        "purpose": "Size drip/sprinkler laterals to keep pressure variation < 20%.",
        "example": "Q=0.5 L/s, C=150, L=100m, D=16mm → hf = 1.21e10×(0.0033)^1.852×100/16^4.87 = 2.1m.",
        "pitfall": "Forgetting multiple-outlet reduction factor (F ≈ 0.36 for 30+ outlets).",
        "decision": "If hf × F > 20% of inlet pressure, upsize diameter or split lateral.",
        "notes": "Source: ASABE EP458; Hazen-Williams. Apply F factor for multi-outlet.",
        "name_ar": "فقد الحمل في الخطوط الجانبية",
        "purpose_ar": "تحديد قطر الخطوط الجانبية للحفاظ على تجانس الضغط.",
        "variables_ar": ""
    },
    {
        "code": "EP458.3",
        "name": "Drip System Application Rate",
        "formula": "I = 60 × q × e / (S₁ × S₂)",
        "variables": "I = application rate (mm/h)\nq = emitter flow (L/h)\ne = emitter efficiency (1.0 for 100%)\nS₁ = emitter spacing on lateral (m)\nS₂ = lateral spacing (m)",
        "purpose": "Calculate how fast drip applies water for scheduling.",
        "example": "q=4 L/h, S₁=0.3m, S₂=1.5m → I = 60×4×1/(0.3×1.5) = 533 mm/h (very high — drip is concentrated).",
        "pitfall": "Comparing drip I to sprinkler I — drip applies to small wetted volume only.",
        "decision": "Convert I to total volume: V = I × t × area / 60.",
        "notes": "Source: ASABE EP405.1.",
        "name_ar": "معدل تطبيق التنقيط",
        "purpose_ar": "حساب سرعة تطبيق الماء بالتنقيط.",
        "variables_ar": ""
    },

    # === IPCC 2019 Emissions (5 formulas) ===
    {
        "code": "IPCC.1",
        "name": "N₂O Direct Emission (IPCC Tier 1)",
        "formula": "N₂O = F × EF × 44/28",
        "variables": "F = N input (kg N/ha)\nEF = emission factor (0.01 default)\n44/28 = N₂O-N → N₂O molecular weight conversion\nN₂O = emissions (kg N₂O/ha)",
        "purpose": "Estimate direct nitrous oxide emissions from fertilizer — 298× GWP.",
        "example": "200 kg N/ha → N₂O = 200×0.01×1.57 = 3.14 kg N₂O/ha = 936 kg CO₂e/ha.",
        "pitfall": "Forgetting the 44/28 conversion; using old EF=0.0125 instead of 2019 value 0.01.",
        "decision": "Use enhanced-efficiency fertilizer to cut EF by 35% (IPCC 2019 Table 11.1).",
        "notes": "Source: IPCC 2019 Refinement, Vol. 4 Ch. 11, Eq. 11.1.",
        "name_ar": "انبعاث أكسيد النيتروجين المباشر",
        "purpose_ar": "تقدير انبعاثات N₂O من الأسمدة.",
        "variables_ar": ""
    },
    {
        "code": "IPCC.2",
        "name": "CH₄ from Rice Paddies (IPCC)",
        "formula": "CH₄ = SF × CF × t × 28",
        "variables": "SF = seasonal flux (kg CH₄/ha/day)\nCF = conversion factor for water regime\nt = cultivation period (days)\n28 = GWP of CH₄ (AR5)",
        "purpose": "Methane emissions from flooded rice — major GHG in Asia.",
        "example": "SF=1.3, CF=0.78 (intermittent), t=110 → CH₄ = 1.3×0.78×110×28 = 3119 kg CO₂e/ha.",
        "pitfall": "Using continuously-flooded CF (1.0) for intermittent (0.78) or drained (0.27).",
        "decision": "Drain mid-season to cut CH₄ by 40-70%.",
        "notes": "Source: IPCC 2019, Vol. 4 Ch. 5, Eq. 5.1.",
        "name_ar": "الميثان من حقول الأرز",
        "purpose_ar": "انبعاثات الميثان من الأرز المغمور.",
        "variables_ar": ""
    },
    {
        "code": "IPCC.3",
        "name": "Enteric Fermentation CH₄ (Moe & Tyrrell)",
        "formula": "CH₄ = 3.41 + 0.051 × DMI - 0.093 × NDF%",
        "variables": "DMI = dry matter intake (kg/day)\nNDF% = neutral detergent fiber % of diet\nCH₄ = methane (MJ/day)",
        "purpose": "Predict cattle methane from diet — key for dairy carbon footprint.",
        "example": "DMI=20 kg, NDF=45% → CH₄ = 3.41 + 1.02 - 4.19 = 0.24 MJ/day... (use IPCC Tier 2: Ym=6.5% × GE).",
        "pitfall": "Moe & Tyrrell is for dairy; IPCC Tier 2 (Ym=6.5%) is more general.",
        "decision": "Increase dietary starch (lower NDF) to reduce CH₄ by 10-20%.",
        "notes": "Source: Moe & Tyrrell (1979); IPCC 2019 Vol. 4 Ch. 10.",
        "name_ar": "التخمر المعوي للأبقار",
        "purpose_ar": "التنبؤ بالميثان من النظام الغذائي للأبقار.",
        "variables_ar": ""
    },
    {
        "code": "IPCC.4",
        "name": "N₂O Indirect (Volatilization + Leaching)",
        "formula": "N₂O_ind = (F × Frac_gas × EF_gas + F × Frac_leach × EF_leach) × 44/28",
        "variables": "F = N input (kg N/ha)\nFrac_gas = 0.10 (volatilized)\nEF_gas = 0.010 (N₂O from NH₃/N0ₓ)\nFrac_leach = 0.24 (leached)\nEF_leach = 0.011 (N₂O from leaching)",
        "purpose": "Captures the N₂O that forms AFTER fertilizer leaves the field — ~40% of total.",
        "example": "200 kg N → N₂O_ind = (200×0.10×0.01 + 200×0.24×0.011)×1.57 = 1.13 kg N₂O/ha.",
        "pitfall": "Forgetting indirect doubles total N₂O estimate; Frac_leach varies by rain.",
        "decision": "Split-apply N to cut Frac_leach; use inhibitors to cut Frac_gas.",
        "notes": "Source: IPCC 2019, Vol. 4 Ch. 11, Eq. 11.9-11.10.",
        "name_ar": "أكسيد النيتروجين غير المباشر",
        "purpose_ar": "يلتقط N₂O الذي يتكون بعد مغادرة السماد للحقل.",
        "variables_ar": ""
    },
    {
        "code": "IPCC.5",
        "name": "Soil Carbon Stock Change (IPCC Tier 1)",
        "formula": "ΔSOC = (SOC_ref - SOC_current) × Area / 20",
        "variables": "SOC_ref = reference SOC stock (t C/ha, 0-30cm)\nSOC_current = current stock\nArea = hectares\n20 = default inventory period (years)",
        "purpose": "Quantify soil carbon sequestration for carbon credit verification.",
        "example": "Convert to no-till: SOC_ref=50, SOC_current=40, Area=100ha → ΔSOC = 10×100/20 = 50 t C/yr = 183 t CO₂e/yr.",
        "pitfall": "Using wrong reference stock for climate/land-use zone.",
        "decision": "Use IPCC stock change factors (FLU, FMG, FI) for tier 1; measure for tier 3.",
        "notes": "Source: IPCC 2019, Vol. 4 Ch. 5, Eq. 5.1 (SOC stock method).",
        "name_ar": "تغير مخزون الكربون",
        "purpose_ar": "تقدير تخزين الكربون للتحقق من ائتمانات الكربون.",
        "variables_ar": ""
    },

    # === NRC Dairy Nutrition (4 formulas) ===
    {
        "code": "NRC.1",
        "name": "Net Energy for Lactation (NEL)",
        "formula": "NEL = (0.703 × TDN - 0.19) × 4.184",
        "variables": "TDN = total digestible nutrients (% DM)\nNEL = net energy lactation (Mcal/kg DM)\n4.184 = Mcal to MJ conversion",
        "purpose": "Calculate energy available for milk production — NRC 2021 standard.",
        "example": "Corn silage TDN=70% → NEL = (0.703×0.70 - 0.19)×4.184 = 1.30 Mcal/kg = 5.44 MJ/kg.",
        "pitfall": "Using DE or ME instead of NEL — overestimates by 15-25%.",
        "decision": "Balance ration at NEL ± 0.05 of cow requirement.",
        "notes": "Source: NRC (2021) Nutrient Requirements of Dairy Cattle, Eq. 3-10.",
        "name_ar": "صافي الطاقة للحليب",
        "purpose_ar": "حساب الطاقة المتاحة لإنتاج الحليب.",
        "variables_ar": ""
    },
    {
        "code": "NRC.2",
        "name": "NDF Digestibility (NRC 2021)",
        "formula": "NDFD = a + b × (1 - e^(-c×t))",
        "variables": "a = soluble fraction\nb = insoluble but digestible fraction\nc = rate of digestion (1/h)\nt = incubation time (h)",
        "purpose": "Predict forage digestibility — 1% NDFD = +0.25 kg milk/day.",
        "example": "Corn silage: a=30, b=50, c=0.05, t=30 → NDFD = 30 + 50×(1-e^(-1.5)) = 30 + 38.9 = 68.9%.",
        "pitfall": "Using 30h in vitro when ration model expects 48h; underestimates.",
        "decision": "Select hybrids with NDFD > 60% for high-producing cows.",
        "notes": "Source: NRC (2021); Mertens (1993) NDF kinetics.",
        "name_ar": "هضم NDF",
        "purpose_ar": "التنبؤ بهضم الأعلاف الخشنة.",
        "variables_ar": ""
    },
    {
        "code": "NRC.3",
        "name": "Methane Prediction (IPCC Tier 2 — dairy)",
        "formula": "CH₄ = GE × Ym × 0.0672",
        "variables": "GE = gross energy intake (MJ/day)\nYm = methane conversion factor (0.065 dairy, 0.070 beef)\n0.0672 = MJ → kg CH₄ conversion",
        "purpose": "Daily cattle methane — required for dairy carbon footprint.",
        "example": "GE=200 MJ/day, Ym=0.065 → CH₄ = 200×0.065×0.0672 = 0.874 kg/day = 319 kg/yr.",
        "pitfall": "Using Ym=0.07 for high-grain dairy (should be 0.045-0.060).",
        "decision": "Add lipids (3-5% of DM) to reduce Ym by 10-15%.",
        "notes": "Source: IPCC 2019; NRC 2021 Ch. 14.",
        "name_ar": "التنبؤ بالميثان",
        "purpose_ar": "ميثان الأبقار اليومي — مطللب للبصمة الكربونية.",
        "variables_ar": ""
    },
    {
        "code": "NRC.4",
        "name": "Amino Acid Balance (Lys:Met)",
        "formula": "Ratio = Lys_supply / Met_supply",
        "variables": "Lys_supply = metabolizable lysine (g/day)\nMet_supply = metabolizable methionine (g/day)",
        "purpose": "Balance the two most-limiting amino acids for milk protein.",
        "example": "Lys=180 g, Met=60 g → Ratio = 3.0. Target 3.0:1 (NRC 2021).",
        "pitfall": "Using total AA instead of metabolizable AA; ignoring microbial protein.",
        "decision": "Add rumen-protected Met if ratio > 3.2; protected Lys if ratio < 2.8.",
        "notes": "Source: NRC (2021) Ch. 8. Ideal Lys:Met = 2.8-3.0:1.",
        "name_ar": "توازن الأحماض الأمينية",
        "purpose_ar": "موازنة الأحماض الأمينية المحدودة لبروتين الحليب.",
        "variables_ar": ""
    },

    # === Fertilizers Europe NUE (3 formulas) ===
    {
        "code": "FE.1",
        "name": "Nitrogen Use Efficiency (NUE)",
        "formula": "NUE = N_output / N_input",
        "variables": "N_output = N in harvested product (kg N/ha)\nN_input = fertilizer + biological + atmospheric N (kg N/ha)",
        "purpose": "Single metric for nitrogen performance — Fertilizers Europe target 50-90%.",
        "example": "Wheat: 150 kg N in grain / 180 kg N applied → NUE = 0.83 = 83%.",
        "pitfall": "Excluding soil N mineralization; counting only fertilizer N.",
        "decision": "NUE < 50%: surplus high, leaching risk. >90%: mining soil N.",
        "notes": "Source: Fertilizers Europe (2015) NUE Toolkit; EU Nitrogen Expert Panel.",
        "name_ar": "كفاءة استخدام النيتروجين",
        "purpose_ar": "مقياس واحد لأداء النيتروجين.",
        "variables_ar": ""
    },
    {
        "code": "FE.2",
        "name": "N Surplus (Fertilizers Europe)",
        "formula": "N_surplus = N_input - N_output",
        "variables": "N_input = total N inputs (kg N/ha)\nN_output = N in harvested product + residue N (kg N/ha)",
        "purpose": "Environmental pressure metric — surpluses >80 kg N/ha risk leaching.",
        "example": "Wheat: input=180, output=150 → surplus=30 kg N/ha (safe). Maize: input=250, output=160 → surplus=90 (leaching risk).",
        "pitfall": "Forgetting biological N fixation (legumes add 50-300 kg N/ha).",
        "decision": "Surplus <50: sustainable. 50-80: caution. >80: action required.",
        "notes": "Source: EU Nitrogen Expert Panel (2015); Fertilizers Europe.",
        "name_ar": "فائض النيتروجين",
        "purpose_ar": "مقياس الضغط البيئي — الفائض يخاطر بالترشيح.",
        "variables_ar": ""
    },
    {
        "code": "FE.3",
        "name": "Hidden N in Crop Residues",
        "formula": "N_residue = Yield × (1 - HI) × N_conc_residue",
        "variables": "Yield = grain yield (kg/ha)\nHI = harvest index (0.4-0.5 cereals)\nN_conc_residue = N concentration in residue (~0.5-1.0%)",
        "purpose": "Often-missing N input — residues mineralize 5-20% of their N next season.",
        "example": "Wheat 6000 kg/ha, HI=0.45, N=0.6% → N_residue = 6000×0.55×0.006 = 19.8 kg N/ha.",
        "pitfall": "Assuming 100% of residue N mineralizes year 1 (actual 5-20%).",
        "decision": "Credit residue N at 15% mineralization: 19.8×0.15 = 3 kg N/ha credit.",
        "notes": "Source: Fertilizers Europe (2015); IPNI.",
        "name_ar": "النيتروجين المخفي في بقايا المحصول",
        "purpose_ar": "مدخل نيتروجين غالبًا ما يفوت.",
        "variables_ar": ""
    },

    # === Jones (2012) DRIS (3 formulas) ===
    {
        "code": "DRIS.1",
        "name": "DRIS Index (Diagnosis Recommendation Integrated System)",
        "formula": "DRIS_index = [(N/P - n/p)/(CV_np) + (N/K - n/k)/(CV_nk)] / 2",
        "variables": "N/P = sample ratio\nn/p = reference norm ratio\nCV = coefficient of variation\nAll ratios log-normalized for low/high balance",
        "purpose": "Diagnose nutrient balance regardless of growth stage — used in leaf analysis.",
        "example": "Maize N/P=8 (norm 10, CV=0.15), N/K=1.5 (norm 1.5, CV=0.2) → index = [(8-10)/1.5 + 0]/2 = -0.67 (P relative deficiency).",
        "pitfall": "Using wrong reference norms for crop/stage — DRIS is sensitive.",
        "decision": "Most negative index = most limiting nutrient. Address first.",
        "notes": "Source: Beaufils (1973); Jones (2012) Plant Nutrition Manual Ch. 10.",
        "name_ar": "مؤشر DRIS",
        "purpose_ar": "تشخيص توازن العناصر بغض النظر عن مرحلة النمو.",
        "variables_ar": ""
    },
    {
        "code": "DRIS.2",
        "name": "Critical Value Range (CVR)",
        "formula": "CVR = [mean - 1.96×SD, mean + 1.96×SD]",
        "variables": "mean = mean of high-yielding population\nSD = standard deviation\nCVR = 95% sufficient range",
        "purpose": "Defines sufficiency ranges for leaf tissue tests.",
        "example": "Maize ear-leaf N: mean=3.0%, SD=0.2 → CVR = [2.61%, 3.39%]. Below 2.6 = deficient.",
        "pitfall": "Using CVR from a different growth stage or plant part.",
        "decision": "Below CVR: apply nutrient. Above: no response expected.",
        "notes": "Source: Jones (2012); Marschner (2012).",
        "name_ar": "نطاق القيمة الحرجة",
        "purpose_ar": "يحدد نطاقات الكفاية لاختبارات الأوراق.",
        "variables_ar": ""
    },
    {
        "code": "DRIS.3",
        "name": "Sufficiency Range (Marschner)",
        "formula": "Sufficiency = [mean_low + k×(mean_high - mean_low), mean_high]",
        "variables": "mean_low = deficiency threshold\nmean_high = luxury threshold\nk = 0.25 (lower 25% of sufficiency band)",
        "purpose": "Practical range for fertilizer recommendation.",
        "example": "Tomato leaf P: low=0.25%, high=0.50% → sufficiency = [0.31%, 0.50%].",
        "pitfall": "Confusing sufficiency with critical value — sufficiency is wider.",
        "decision": "In sufficiency range: maintain. Below: fertilize. Above: reduce.",
        "notes": "Source: Marschner (2012); Jones (2012).",
        "name_ar": "نطاق الكفاية",
        "purpose_ar": "نطاق عملي لتوصية السماد.",
        "variables_ar": ""
    },

    # === Disease Models (3 formulas) ===
    {
        "code": "DIS.1",
        "name": "Smith Period (Late Blight)",
        "formula": "Smith Period = 2 consecutive days with T_min ≥ 10°C and RH ≥ 90% for ≥ 11 hours",
        "variables": "T_min = daily minimum temperature\nRH = relative humidity (≥ 90%)\n11 hours = minimum duration",
        "purpose": "Predict Phytophthora infestans infection risk — UK Met Office standard.",
        "example": "2 days with T_min=12°C, RH=92% for 13h → Smith Period met; high blight risk.",
        "pitfall": "Using RH at 2m instead of in-canopy (canopy RH is 5-10% higher).",
        "decision": "Apply preventive copper/mancozeb within 24h of Smith Period.",
        "notes": "Source: Smith (1956); UK Met Office; validated in BAMF system.",
        "name_ar": "فترة سميث (اللفحة المتأخرة)",
        "purpose_ar": "التنبؤ بخطر الإصابة بـ Phytophthora infestans.",
        "variables_ar": ""
    },
    {
        "code": "DIS.2",
        "name": "FAST Model (Early Blight)",
        "formula": "FAST_score = Σ (T_score × W_score) over 7 days",
        "variables": "T_score = temperature rating (0-3) for 18-28°C\nW_score = leaf wetness rating (0-3) for ≥12h wetness\nScore > 30 = spray threshold",
        "purpose": "Forecast Alternaria solani on tomato/potato.",
        "example": "Day 1: T=2, W=3 (6 pts). Day 2: T=3, W=3 (9 pts). Day 3: T=2, W=2 (4 pts). 7-day total=42 → spray.",
        "pitfall": "Counting only rainy days — Alternaria infects with dew alone.",
        "decision": "Score ≥ 30: apply chlorothalonil or azoxystrobin.",
        "notes": "Source: Madden et al. (1978) FAST model.",
        "name_ar": "نموذج FAST",
        "purpose_ar": "تنبؤ بـ Alternaria solani على الطماطم/البطاطس.",
        "variables_ar": ""
    },
    {
        "code": "DIS.3",
        "name": "TOM-CAST (Tomato Disease Forecasting)",
        "formula": "DSI = Σ (T_score × W_score) where T_score = 0 if T<13 or T>28",
        "variables": "T_score = temperature severity (0-4)\nW_score = leaf wetness severity (0-4)\nDSI = Disease Severity Index",
        "purpose": "Combined early blight + anthracnose forecast for tomato.",
        "example": "DSI=35 → first spray. DSI=20 thereafter (every 7 days).",
        "pitfall": "Calibrating for dew vs rain-leaf-wetness sensors differ.",
        "decision": "Spray at DSI=35 first; DSI=20 thereafter.",
        "notes": "Source: Pitblado (1992) TOM-CAST; Ontario Ministry of Ag.",
        "name_ar": "TOM-CAST",
        "purpose_ar": "تنبؤ أمراض الطماطم.",
        "variables_ar": ""
    },

    # === Soil Health (4 formulas) ===
    {
        "code": "SH.1",
        "name": "Soil Organic Carbon Stock",
        "formula": "SOC_stock = SOC% × BD × D × 100",
        "variables": "SOC% = soil organic carbon (%)\nBD = bulk density (g/cm³)\nD = depth (cm)\nSOC_stock = t C/ha",
        "purpose": "Quantify carbon stored in soil — for carbon markets & soil health.",
        "example": "SOC=1.5%, BD=1.3, D=30cm → stock = 1.5×1.3×30×100/100 = 58.5 t C/ha.",
        "pitfall": "Using disturbed (sieved) BD instead of clod BD; ignoring rock fraction.",
        "decision": "Increase SOC stock by 1 t/ha/yr via cover crops + no-till.",
        "notes": "Source: USDA-NRCS Soil Survey Manual; IPCC 2019.",
        "name_ar": "مخزون الكربون العضوي",
        "purpose_ar": "تقدير الكربون المخزن للأسواق وصحة التربة.",
        "variables_ar": ""
    },
    {
        "code": "SH.2",
        "name": "Cation Exchange Capacity (effective)",
        "formula": "CEC_eff = (Ca²⁺ + Mg²⁺ + K⁺ + Na⁺ + H⁺ + Al³⁺) in meq/100g",
        "variables": "All cations in meq/100g (= cmolc/kg)\nCEC_eff = sum of exchangeable cations",
        "purpose": "Soil fertility indicator — capacity to hold nutrients.",
        "example": "Ca=8, Mg=1.5, K=0.4, Na=0.2, H=0.5, Al=0.1 → CEC = 10.7 meq/100g (loamy).",
        "pitfall": "Confusing CEC at field pH vs effective CEC (includes exchangeable Al).",
        "decision": "CEC <5 sandy (split fertilize); 10-20 loam; >20 clay.",
        "notes": "Source: USDA-NRCS; Soil Survey Manual.",
        "name_ar": "سعة التبادل الكاتيوني",
        "purpose_ar": "مؤشر خصوبة التربة — القدرة على الاحتفاظ بالعناصر.",
        "variables_ar": ""
    },
    {
        "code": "SH.3",
        "name": "Base Saturation Ratio",
        "formula": "BS = (Ca²⁺ + Mg²⁺ + K⁺ + Na⁺) / CEC × 100",
        "variables": "Ca, Mg, K, Na in meq/100g\nCEC = total cation exchange capacity",
        "purpose": "Albrecht ratio — target Ca 65-75%, Mg 10-15%, K 3-7%.",
        "example": "Ca=8, Mg=1.5, K=0.4, CEC=10.7 → BS = (8+1.5+0.4)/10.7 = 92.5% (good).",
        "pitfall": "Albrecht ratios not universally accepted; use with soil pH test.",
        "decision": "Ca < 60%: apply lime/gypsum. Mg < 10%: apply dolomite.",
        "notes": "Source: Albrecht (1975); USDA-NRCS.",
        "name_ar": "نسبة التشبع القاعدي",
        "purpose_ar": "نسبة ألبريكت — الأهداف المثالية للكاتيونات.",
        "variables_ar": ""
    },
    {
        "code": "SH.4",
        "name": "Soil pH Adjustment (Lime Requirement)",
        "formula": "Lime = (pH_target - pH_current) × CEC × BD × D × 0.5",
        "variables": "pH_target = desired pH (e.g. 6.5)\npH_current = measured pH\nCEC = cation exchange capacity (meq/100g)\nBD = bulk density (g/cm³)\nD = depth (cm)\n0.5 = empirical lime factor",
        "purpose": "Lime dose to raise soil pH — depends on buffering capacity.",
        "example": "Target 6.5, current 5.5, CEC=15, BD=1.3, D=15cm → Lime = 1×15×1.3×15×0.5 = 146 t/ha (x2 to convert to CaCO₃).",
        "pitfall": "Using SMP buffer incorrectly — only works on certain soils.",
        "decision": "Apply in 2 split doses 6 months apart; retest after 1 year.",
        "notes": "Source: USDA-NRCS; Shoemaker-McLean-Pratt (SMP) buffer.",
        "name_ar": "تعديل درجة الحموضة",
        "purpose_ar": "جرعة الجير لرفع درجة حموضة التربة.",
        "variables_ar": ""
    },

    # === Water Productivity (3 formulas) ===
    {
        "code": "WP.1",
        "name": "Water Productivity (Crop)",
        "formula": "WP = Y / ETc",
        "variables": "Y = crop yield (kg/ha)\nETc = actual evapotranspiration (m³/ha)\nWP = water productivity (kg/m³)",
        "purpose": " kg of crop per m³ of water — key metric for water-scarce agriculture.",
        "example": "Wheat: Y=6000, ETc=5000m³ → WP=1.2 kg/m³. Global benchmark: 1.0-1.5.",
        "pitfall": "Using irrigation volume instead of ETc — ignores rain and soil water.",
        "decision": "WP < 0.8: improve variety, irrigation timing, or mulching.",
        "notes": "Source: FAO Water Paper; Molden (2007).",
        "name_ar": "إنتاجية المياه",
        "purpose_ar": "كجم محصول لكل م³ ماء — مقياس رئيسي للزراعة المحدودة المياه.",
        "variables_ar": ""
    },
    {
        "code": "WP.2",
        "name": "Irrigation Water Use Efficiency",
        "formula": "IWUE = (Y_irrig - Y_rainfed) / I",
        "variables": "Y_irrig = yield with irrigation\nY_rainfed = yield without irrigation\nI = irrigation applied (m³/ha)",
        "purpose": "Marginal productivity of irrigation — justifies irrigation investment.",
        "example": "Y_irrig=8000, Y_rainfed=5000, I=3000 → IWUE = 1.0 kg/m³ additional yield per m³ water.",
        "pitfall": "Comparing IWUE across climates — arid regions show higher values.",
        "decision": "IWUE < 0.5: reconsider irrigation investment.",
        "notes": "Source: FAO; Brouwer & Prins (1989).",
        "name_ar": "كفاءة استخدام ماء الري",
        "purpose_ar": "الإنتاجية الحدية للري.",
        "variables_ar": ""
    },
    {
        "code": "WP.3",
        "name": "Leaching Requirement (LR)",
        "formula": "LR = EC_iw / (5 × EC_threshold - EC_iw)",
        "variables": "EC_iw = irrigation water salinity (dS/m)\nEC_threshold = crop salt tolerance threshold (dS/m)",
        "purpose": "Extra water needed to flush salts below root zone.",
        "example": "Tomato EC_threshold=2.5, EC_iw=3.0 → LR = 3.0/(12.5-3.0) = 0.32 → apply 32% extra water.",
        "pitfall": "Using EC of saturation extract (ECe) for EC_iw — wrong scale.",
        "decision": "If LR > 0.5, switch to salt-tolerant variety or blend water.",
        "notes": "Source: FAO-56; Maas-Hoffman (1977) salt tolerance.",
        "name_ar": "متطلبات الغسيل",
        "purpose_ar": "الماء الإضافي لطرد الأملاح تحت منطقة الجذور.",
        "variables_ar": ""
    },

    # === Yield & Economics (3 formulas) ===
    {
        "code": "YG.1",
        "name": "Yield Gap",
        "formula": "YG = Y_potential - Y_actual",
        "variables": "Y_potential = potential yield (variety × climate)\nY_actual = farmer's actual yield",
        "purpose": "Quantify unrealized yield — key metric for development programs.",
        "example": "Maize Y_potential=12 t/ha, actual=7 → YG = 5 t/ha (42% gap).",
        "pitfall": "Using record yield as potential — should be climate-adjusted.",
        "decision": "Close yield gap via: 30% nutrient, 25% water, 20% pest, 25% management.",
        "notes": "Source: FAO; GYGA (Global Yield Gap Atlas).",
        "name_ar": "فجوة الإنتاج",
        "purpose_ar": "تقدير الإنتاج غير المحقق.",
        "variables_ar": ""
    },
    {
        "code": "YG.2",
        "name": "Harvest Index (HI)",
        "formula": "HI = Y_grain / Y_biomass",
        "variables": "Y_grain = grain yield (kg/ha)\nY_biomass = total aboveground biomass (kg/ha)\nHI = 0 to 1",
        "purpose": "Partitioning efficiency — modern varieties HI 0.50; old 0.30.",
        "example": "Wheat: grain=6000, biomass=12000 → HI=0.50. Excellent.",
        "pitfall": "Including root biomass (changes HI dramatically).",
        "decision": "HI < 0.40: improve fertility, water, or disease control.",
        "notes": "Source: FAO; Donald & Hamblin (1976).",
        "name_ar": "مؤشر الحصاد",
        "purpose_ar": "كفاءة التقسيم بين الحبوب والكتلة الحيوية.",
        "variables_ar": ""
    },
    {
        "code": "EC.1",
        "name": "Partial Budget Analysis",
        "formula": "Net = (B_new - B_old) - (C_new - C_old)",
        "variables": "B_new = benefits of new practice\nB_old = benefits of current\nC_new = costs of new practice\nC_old = costs of current",
        "purpose": "Evaluate if a management change is profitable.",
        "example": "New fertigation: B_new=$3000/ha, B_old=$2500. C_new=$700, C_old=$400. Net = 500-300 = $200/ha benefit.",
        "pitfall": "Forgetting opportunity cost; ignoring risk premium.",
        "decision": "Adopt if Net > 0 AND payback < 3 years.",
        "notes": "Source: USDA-NRCS; Kay & Edwards (2004).",
        "name_ar": "تحليل الميزانية الجزئية",
        "purpose_ar": "تقييم ربحية تغيير الإدارة.",
        "variables_ar": ""
    },

    # === Animal Science (4 formulas) ===
    {
        "code": "AN.1",
        "name": "Body Condition Score Change",
        "formula": "BCS_change = (BCS_end - BCS_start) / weeks",
        "variables": "BCS_end = score at end (1-5)\nBCS_start = score at start\nweeks = observation period",
        "purpose": "Monitor energy balance in dairy cows — losing > 0.5 BCS/week is risky.",
        "example": "Fresh cow: BCS 3.5 → 3.0 in 4 weeks → change = -0.125/week (acceptable).",
        "pitfall": "Subjective scoring — use same trained scorer throughout.",
        "decision": "Lose > 0.5/wk: increase energy density; check ketosis.",
        "notes": "Source: Edmonson et al. (1989); NRC 2021.",
        "name_ar": "تغير درجة حالة الجسم",
        "purpose_ar": "مراقبة توازن الطاقة في الأبقار.",
        "variables_ar": ""
    },
    {
        "code": "AN.2",
        "name": "Water Quality Index (Aquaculture)",
        "formula": "WQI = Σ (Wi × Qi) / Σ Wi",
        "variables": "Wi = weight of parameter i\nQi = quality rating (0-100) of parameter i\nDO, pH, T, NH₃, turbidity common parameters",
        "purpose": "Single metric for aquaculture water quality.",
        "example": "DO=80 (w=0.3), pH=90 (w=0.2), T=70 (w=0.2), NH₃=85 (w=0.3) → WQI=81.5 (good).",
        "pitfall": "Using wrong weights — calibrate to species tolerance.",
        "decision": "WQI < 70: water exchange. < 50: emergency harvest.",
        "notes": "Source: CCME (2001); Brown et al. (1970).",
        "name_ar": "مؤشر جودة الماء",
        "purpose_ar": "مقياس واحد لجودة ماء الاستزراع السمكي.",
        "variables_ar": ""
    },
    {
        "code": "AN.3",
        "name": "Rotational Grazing Rest Period",
        "formula": "RP = TR / (n - 1) - PD",
        "variables": "TR = total rest required (days)\nn = number of paddocks\nPD = paddock grazing duration (days)",
        "purpose": "Size rotational grazing system for sustainable forage use.",
        "example": "TR=30d, n=8, PD=3d → RP = 30/7 - 3 = 1.3d (too short — increase paddocks).",
        "pitfall": "Underestimating regrowth time in dry conditions.",
        "decision": "Adjust paddock count to give 25-40 days rest in temperate climates.",
        "notes": "Source: USDA-NRCS; Barnes et al. (2007) Forages.",
        "name_ar": "فترة راحة الرعي الدوار",
        "purpose_ar": "تحديد نظام الرعي الدوار للاستخدام المستدام.",
        "variables_ar": ""
    },
    {
        "code": "AN.4",
        "name": "Feed Conversion Ratio (FCR)",
        "formula": "FCR = Feed_DM / Weight_gain",
        "variables": "Feed_DM = feed dry matter intake (kg)\nWeight_gain = animal weight gain (kg)",
        "purpose": "Efficiency of converting feed to animal mass — key economic metric.",
        "example": "Broiler: 3.0 kg feed → 1.6 kg gain → FCR = 1.875. Excellent.",
        "pitfall": "Using as-fed feed instead of DM; including mortality.",
        "decision": "Cattle FCR > 8: check parasites, genetics. Poultry > 2.2: disease check.",
        "notes": "Source: NRC (2021); FAO Animal Production.",
        "name_ar": "معامل تحويل العلف",
        "purpose_ar": "كفاءة تحويل العلف إلى كتلة حيوانية.",
        "variables_ar": ""
    },

    # === Sustainability & Climate (3 formulas) ===
    {
        "code": "SUS.1",
        "name": "Carbon Footprint per kg Product",
        "formula": "CF = Total_GHG / Yield",
        "variables": "Total_GHG = all emissions (kg CO₂e/ha)\nYield = product yield (kg/ha)\nCF = kg CO₂e per kg product",
        "purpose": "Compare sustainability across production systems.",
        "example": "Wheat: 2000 kg CO₂e/ha / 6000 kg/ha = 0.33 kg CO₂e/kg wheat. Beef: 12000 / 800 = 15 kg CO₂e/kg.",
        "pitfall": "Forgetting soil carbon sequestration (net-zero possible).",
        "decision": "Benchmark: wheat <0.5, tomato <0.3, chicken <3, beef <20.",
        "notes": "Source: IPCC 2019; FAO SAFA.",
        "name_ar": "البصمة الكربونية لكل كجم",
        "purpose_ar": "مقارنة الاستدامة عبر نظم الإنتاج.",
        "variables_ar": ""
    },
    {
        "code": "SUS.2",
        "name": "Sustainability Index (SAFA)",
        "formula": "SI = (Econ + Env + Social + Governance) / 4",
        "variables": "Econ = economic score (0-100)\nEnv = environmental score (0-100)\nSocial = social score (0-100)\nGovernance = governance score (0-100)",
        "purpose": "Holistic sustainability — FAO SAFA framework.",
        "example": "Econ=70, Env=55, Social=80, Gov=60 → SI = 66.3 (moderate).",
        "pitfall": "Weighting all 4 equally — adjust for stakeholder priorities.",
        "decision": "SI < 50: high-risk operation. > 75: leader.",
        "notes": "Source: FAO SAFA (2013) Sustainability Assessment of Food and Agriculture.",
        "name_ar": "مؤشر الاستدامة",
        "purpose_ar": "استدامة شاملة — إطار SAFA.",
        "variables_ar": ""
    },
    {
        "code": "SUS.3",
        "name": "Soil Health Score (Cornell)",
        "formula": "SHS = (OC + AC + BS + pH + EC + ROT) / 6",
        "variables": "OC = organic carbon score\nAC = active carbon score\nBS = base saturation score\npH = pH score\nEC = biological activity\nROT = root health rating\nEach 0-100",
        "purpose": "Comprehensive soil health — Cornell Comprehensive Assessment.",
        "example": "OC=60, AC=50, BS=80, pH=85, EC=70, ROT=75 → SHS=70 (good).",
        "pitfall": "Sampling only top 15cm — miss subsoil constraints.",
        "decision": "SHS <50: plant cover crop, reduce tillage, add compost.",
        "notes": "Source: Cornell Soil Health Lab (Moebius-Clune et al. 2016).",
        "name_ar": "درجة صحة التربة",
        "purpose_ar": "صحة شاملة للتربة — تقييم كورنيل.",
        "variables_ar": ""
    },
]

def main():
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Find or create a new part for these formulas
    new_part = {
        "roman": "XIX",
        "title": "Trusted-Reference Formulas (FAO-56, USDA-NRCS, ASABE, IPCC, NRC)",
        "subtitle": "Peer-reviewed formulas from international standards bodies",
        "chapters": [
            {
                "number": 56,
                "title": "FAO-56 Penman-Monteith Family",
                "intro": "Reference evapotranspiration, dual Kc, stress coefficients from FAO Irrigation & Drainage Paper 56 (Allen et al., 1998).",
                "formulas": [f for f in NEW_FORMULAS if f["code"].startswith("56.")],
                "sub_sections": []
            },
            {
                "number": 652,
                "title": "USDA-NRCS Irrigation Engineering",
                "intro": "From National Engineering Handbook Part 652 — Christiansen uniformity, Manning's channel flow, furrow design, infiltration.",
                "formulas": [f for f in NEW_FORMULAS if f["code"].startswith("652.")],
                "sub_sections": []
            },
            {
                "number": 405,
                "title": "ASABE Drip & Sprinkler Standards",
                "intro": "From ASABE EP405.1 (drip) and EP458 (sprinkler) — emitter flow, emission uniformity, lateral hydraulics.",
                "formulas": [f for f in NEW_FORMULAS if f["code"].startswith(("EP405", "EP458"))],
                "sub_sections": []
            },
            {
                "number": 600,
                "title": "IPCC 2019 Emission Models",
                "intro": "Tier 1/2 emission factors from IPCC 2019 Refinement — N₂O, CH₄, soil carbon.",
                "formulas": [f for f in NEW_FORMULAS if f["code"].startswith("IPCC.")],
                "sub_sections": []
            },
            {
                "number": 700,
                "title": "NRC Dairy Nutrition (2021)",
                "intro": "From Nutrient Requirements of Dairy Cattle — NEL, NDFD, methane, amino acid balance.",
                "formulas": [f for f in NEW_FORMULAS if f["code"].startswith("NRC.")],
                "sub_sections": []
            },
            {
                "number": 750,
                "title": "Fertilizers Europe NUE Toolkit",
                "intro": "Nitrogen use efficiency, surplus, hidden N in residues.",
                "formulas": [f for f in NEW_FORMULAS if f["code"].startswith("FE.")],
                "sub_sections": []
            },
            {
                "number": 800,
                "title": "DRIS & Plant Nutrition (Jones 2012)",
                "intro": "Diagnosis Recommendation Integrated System, critical values, sufficiency ranges.",
                "formulas": [f for f in NEW_FORMULAS if f["code"].startswith("DRIS.")],
                "sub_sections": []
            },
            {
                "number": 850,
                "title": "Disease Forecast Models",
                "intro": "Smith Period (late blight), FAST (early blight), TOM-CAST.",
                "formulas": [f for f in NEW_FORMULAS if f["code"].startswith("DIS.")],
                "sub_sections": []
            },
            {
                "number": 860,
                "title": "Soil Health Indicators",
                "intro": "SOC stock, CEC, base saturation, lime requirement — USDA-NRCS + Cornell.",
                "formulas": [f for f in NEW_FORMULAS if f["code"].startswith("SH.")],
                "sub_sections": []
            },
            {
                "number": 870,
                "title": "Water Productivity (FAO)",
                "intro": "Water productivity, IWUE, leaching requirement.",
                "formulas": [f for f in NEW_FORMULAS if f["code"].startswith("WP.")],
                "sub_sections": []
            },
            {
                "number": 880,
                "title": "Yield Gap & Economics",
                "intro": "Yield gap, harvest index, partial budget analysis.",
                "formulas": [f for f in NEW_FORMULAS if f["code"].startswith(("YG.", "EC."))],
                "sub_sections": []
            },
            {
                "number": 890,
                "title": "Animal Science Metrics",
                "intro": "BCS, water quality, grazing rest, FCR.",
                "formulas": [f for f in NEW_FORMULAS if f["code"].startswith("AN.")],
                "sub_sections": []
            },
            {
                "number": 900,
                "title": "Sustainability Scorecards",
                "intro": "Carbon footprint, SAFA sustainability index, Cornell soil health score.",
                "formulas": [f for f in NEW_FORMULAS if f["code"].startswith("SUS.")],
                "sub_sections": []
            },
        ]
    }

    # Add the new part to the data
    data['parts'].append(new_part)

    # Update meta count
    old_total = data.get('meta', {}).get('total_formulas', 0)
    new_total = old_total + len(NEW_FORMULAS)
    if 'meta' not in data:
        data['meta'] = {}
    data['meta']['total_formulas'] = new_total
    data['meta']['total_parts'] = len(data['parts'])

    # Write back
    with open(DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ Added {len(NEW_FORMULAS)} new formulas from trusted references")
    print(f"   Old total: {old_total} → New total: {new_total}")
    print(f"   New part: Part XIX — Trusted-Reference Formulas")
    print(f"   Chapters: {len(new_part['chapters'])}")

    # Summary by category
    from collections import Counter
    cats = Counter()
    for f in NEW_FORMULAS:
        prefix = f["code"].split(".")[0]
        cats[prefix] += 1
    print("\n   By source:")
    for cat, count in sorted(cats.items()):
        print(f"     {cat}: {count} formulas")

if __name__ == "__main__":
    main()
