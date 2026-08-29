'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import {
  Layers,
  Sparkles,
  MapPin,
  Plus,
  Trash2,
  Download,
  RotateCcw,
  Maximize2,
  Info,
  Sliders,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Droplets,
  Sprout,
  Compass,
  Grid3X3,
  Eye,
  EyeOff,
  Crosshair,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { copyFor, useTranslation } from '@/lib/language-store';

// ============================================================================
// Types & Definitions
// ============================================================================

export type NutrientKey = 'nitrogen' | 'phosphorus' | 'potassium' | 'som' | 'ph' | 'ec' | 'cec' | 'zinc';

export interface SoilSamplePoint {
  id: string;
  x: number; // 0 to 100 (% of field width)
  y: number; // 0 to 100 (% of field length)
  realXMetres?: number;
  realYMetres?: number;
  label?: string;
  depthCm: number;
  values: {
    nitrogen: number; // ppm NO3-N
    phosphorus: number; // ppm P (Olsen/Bray)
    potassium: number; // ppm K
    som: number; // % Organic Matter
    ph: number; // pH 1:1 soil:water
    ec: number; // dS/m electrical conductivity
    cec: number; // meq/100g
    zinc: number; // ppm Zn
  };
}

export interface NutrientMetadata {
  key: NutrientKey;
  name: { en: string; fr: string; ar: string };
  unit: string;
  minRange: number;
  maxRange: number;
  step: number;
  optimalMin: number;
  optimalMax: number;
  colorInterpolator: (t: number) => string;
  colorSchemeName: string;
  description: { en: string; fr: string; ar: string };
  fertilizerName: { en: string; fr: string; ar: string };
  correctionFormula: (avgValue: number, fieldAreaHa: number) => {
    rateKgHa: number;
    totalKg: number;
    actionText: { en: string; fr: string; ar: string };
    urgency: 'low' | 'medium' | 'high' | 'optimal';
  };
}

export interface FieldPreset {
  id: string;
  name: { en: string; fr: string; ar: string };
  widthM: number;
  lengthM: number;
  areaHa: number;
  description: { en: string; fr: string; ar: string };
  samples: SoilSamplePoint[];
}

// ============================================================================
// Nutrient Metadata Specifications
// ============================================================================

export const NUTRIENT_METADATA: Record<NutrientKey, NutrientMetadata> = {
  nitrogen: {
    key: 'nitrogen',
    name: {
      en: 'Nitrate Nitrogen (NO₃⁻-N)',
      fr: 'Azote Nitrique (NO₃⁻-N)',
      ar: 'نيتروجين النترات (NO₃⁻-N)',
    },
    unit: 'ppm (mg/kg)',
    minRange: 5,
    maxRange: 75,
    step: 1,
    optimalMin: 25,
    optimalMax: 45,
    colorInterpolator: d3.interpolateYlGn,
    colorSchemeName: 'YlGn',
    description: {
      en: 'Primary driver for vegetative vigor and chlorophyll synthesis. Highly mobile in root zone.',
      fr: 'Moteur principal de la vigueur végétative et de la chlorophylle. Très mobile dans la zone racinaire.',
      ar: 'المحرك الرئيسي للنمو الخضري وتكوين الكلوروفيل. شديد الحركة في منطقة الجذور.',
    },
    fertilizerName: {
      en: 'Urea (46% N) / Ammonium Nitrate (33.5% N)',
      fr: 'Urée (46% N) / Nitrate d’Ammonium (33.5% N)',
      ar: 'يوريا (46% N) / نترات الأمونيوم (33.5% N)',
    },
    correctionFormula: (avg, ha) => {
      if (avg < 20) {
        const deficit = 35 - avg;
        const rate = Math.round(deficit * 4.5);
        return {
          rateKgHa: rate,
          totalKg: Math.round(rate * ha),
          actionText: {
            en: `Severe N deficiency. Top-dress ${rate} kg/ha Urea split into 2 fertigation doses.`,
            fr: `Déficit azoté sévère. Apporter ${rate} kg/ha d’Urée fractionnée en 2 apports.`,
            ar: `نقص حاد في النيتروجين. سمّد بـ ${rate} كغ/هـ يوريا مجزأة على دفعتين بالري.`,
          },
          urgency: 'high',
        };
      } else if (avg < 25) {
        const rate = Math.round((25 - avg) * 3.2);
        return {
          rateKgHa: rate,
          totalKg: Math.round(rate * ha),
          actionText: {
            en: `Moderate N deficit. Add ${rate} kg/ha Ammonium Nitrate at vegetative stage.`,
            fr: `Déficit modéré en N. Ajouter ${rate} kg/ha de nitrate d'ammonium au stade végétatif.`,
            ar: `عجز نيتروجيني معتدل. أضف ${rate} كغ/هـ نترات أمونيوم في طور النمو الخضري.`,
          },
          urgency: 'medium',
        };
      } else if (avg > 55) {
        return {
          rateKgHa: 0,
          totalKg: 0,
          actionText: {
            en: 'Excessive N risk (leaching & lodging). Hold N fertilizer; irrigate to manage salinity.',
            fr: 'Risque d’excès d’azote (lessivage et verse). Suspendre l’azote ; irriguer.',
            ar: 'خطر إفراط النيتروجين (غسيل ورقاد). أوقف التسميد النيتروجيني ونظم الري.',
          },
          urgency: 'high',
        };
      }
      return {
        rateKgHa: 0,
        totalKg: 0,
        actionText: {
          en: 'Nitrogen level is within target agronomic range for optimal yield.',
          fr: 'Le niveau d’azote se situe dans la plage agronomique optimale.',
          ar: 'مستوى النيتروجين ضمن النطاق الزراعي المثالي لإنتاجية ممتازة.',
        },
        urgency: 'optimal',
      };
    },
  },
  phosphorus: {
    key: 'phosphorus',
    name: {
      en: 'Available Phosphorus (P Olsen/Bray)',
      fr: 'Phosphore Assimilable (P Olsen/Bray)',
      ar: 'الفوسفور المتاح (P أولسن/براي)',
    },
    unit: 'ppm (mg/kg)',
    minRange: 5,
    maxRange: 80,
    step: 1,
    optimalMin: 25,
    optimalMax: 50,
    colorInterpolator: d3.interpolateViridis,
    colorSchemeName: 'Viridis',
    description: {
      en: 'Critical for early root elongation, flowering, energy transfer (ATP), and grain set.',
      fr: 'Crucial pour l’enracinement précoce, la floraison, le transfert d’énergie (ATP) et la nouaison.',
      ar: 'حاسم لنمو الجذور المبكر، التزهير، نقل الطاقة (ATP) وعقد الثمار.',
    },
    fertilizerName: {
      en: 'Di-Ammonium Phosphate (DAP 18-46-0) / MAP (12-61-0)',
      fr: 'Phosphate Diammonique (DAP 18-46-0) / MAP (12-61-0)',
      ar: 'فوسفات ثنائي الأمونيوم (DAP 18-46-0) / MAP (12-61-0)',
    },
    correctionFormula: (avg, ha) => {
      if (avg < 20) {
        const rate = Math.round((35 - avg) * 5.2);
        return {
          rateKgHa: rate,
          totalKg: Math.round(rate * ha),
          actionText: {
            en: `Low available P. Band ${rate} kg/ha DAP near the root zone or apply MAP via drip.`,
            fr: `Faible P assimilable. Localiser ${rate} kg/ha de DAP près des racines ou MAP au goutte-à-goutte.`,
            ar: `انخفاض الفوسفور المتاح. أضف ${rate} كغ/هـ DAP بالقرب من منطقة الجذور أو MAP بالتنقيط.`,
          },
          urgency: 'high',
        };
      }
      return {
        rateKgHa: 0,
        totalKg: 0,
        actionText: {
          en: 'Phosphorus availability is optimal; maintain baseline maintenance dressing.',
          fr: 'Disponibilité du phosphore optimale ; maintenir la fumure d’entretien.',
          ar: 'توفر الفوسفور مثالي؛ حافظ على سماد الصيانة الأساسي فقط.',
        },
        urgency: 'optimal',
      };
    },
  },
  potassium: {
    key: 'potassium',
    name: {
      en: 'Exchangeable Potassium (K)',
      fr: 'Potassium Échangeable (K)',
      ar: 'البوتاسيوم القابل للتبادل (K)',
    },
    unit: 'ppm (mg/kg)',
    minRange: 80,
    maxRange: 500,
    step: 5,
    optimalMin: 200,
    optimalMax: 350,
    colorInterpolator: d3.interpolatePlasma,
    colorSchemeName: 'Plasma',
    description: {
      en: 'Regulates stomatal conductance, osmotic water retention, fruit sugar brix, and drought resilience.',
      fr: 'Régule l’ouverture stomatique, le maintien hydrique osmotique, le taux de sucre (°Brix) et la tolérance à la sécheresse.',
      ar: 'ينظم فتح الثغور، الاحتفاظ بالأسموزية المائية، تركيز سكر الثمار (بريكس) ومقاومة الجفاف.',
    },
    fertilizerName: {
      en: 'Potassium Sulfate (SOP 0-0-50) / Potassium Nitrate',
      fr: 'Sulfate de Potassium (SOP 0-0-50) / Nitrate de Potassium',
      ar: 'كبريتات البوتاسيوم (SOP 0-0-50) / نترات البوتاسيوم',
    },
    correctionFormula: (avg, ha) => {
      if (avg < 180) {
        const rate = Math.round((250 - avg) * 1.5);
        return {
          rateKgHa: rate,
          totalKg: Math.round(rate * ha),
          actionText: {
            en: `K deficit threatens heat/drought resistance. Apply ${rate} kg/ha Potassium Sulfate.`,
            fr: `Déficit en K compromettant la résistance à la chaleur. Apporter ${rate} kg/ha de sulfate de potassium.`,
            ar: `عجز البوتاسيوم يهدد مقاومة الحر والجفاف. أضف ${rate} كغ/هـ كبريتات البوتاسيوم.`,
          },
          urgency: 'medium',
        };
      }
      return {
        rateKgHa: 0,
        totalKg: 0,
        actionText: {
          en: 'Exchangeable Potassium is well balanced for high quality crop yield.',
          fr: 'Le potassium échangeable est bien équilibré pour un rendement de qualité.',
          ar: 'البوتاسيوم القابل للتبادل متوازن تماماً لجودة المحصول.',
        },
        urgency: 'optimal',
      };
    },
  },
  som: {
    key: 'som',
    name: {
      en: 'Soil Organic Matter (SOM)',
      fr: 'Matière Organique du Sol (MOS)',
      ar: 'المادة العضوية في التربة (SOM)',
    },
    unit: '% w/w',
    minRange: 0.5,
    maxRange: 7.0,
    step: 0.1,
    optimalMin: 2.5,
    optimalMax: 5.0,
    colorInterpolator: d3.interpolateYlOrBr,
    colorSchemeName: 'YlOrBr',
    description: {
      en: 'Foundation of soil structure, water holding capacity (WHC), microbiological biodiversity, and CEC.',
      fr: 'Fondement de la structure du sol, de la réserve utile en eau (RU), de la biodiversité microbienne et de la CEC.',
      ar: 'أساس بنية التربة، السعة الحقلية لحفظ الماء، التنوع الميكروبي وسعة التبادل الكاتيوني.',
    },
    fertilizerName: {
      en: 'Mature Compost / Biochar / Cover Crop Green Manure',
      fr: 'Compost Mûr / Biochar / Engrais Vert (Couvert)',
      ar: 'كمبوست ناضج / بيوتشار / سماد أخضر بمحاصيل التغطية',
    },
    correctionFormula: (avg, ha) => {
      if (avg < 2.0) {
        const rateTons = Math.round((3.0 - avg) * 12);
        return {
          rateKgHa: rateTons * 1000,
          totalKg: rateTons * 1000 * ha,
          actionText: {
            en: `Low organic matter (<2%). Broadcast ${rateTons} t/ha mature compost or sow legume cover crop.`,
            fr: `Faible taux de matière organique (<2%). Épandre ${rateTons} t/ha de compost ou semer un couvert légumineux.`,
            ar: `انخفاض المادة العضوية (<2%). انثر ${rateTons} طن/هـ كمبوست ناضج أو ازرع محصول تغطية بقولي.`,
          },
          urgency: 'high',
        };
      }
      return {
        rateKgHa: 0,
        totalKg: 0,
        actionText: {
          en: 'Organic matter levels are healthy, ensuring excellent water retention.',
          fr: 'Le taux de matière organique est sain, garantissant une bonne rétention hydrique.',
          ar: 'مستويات المادة العضوية صحية وتضمن قدرة ممتازة على تخزين المياه.',
        },
        urgency: 'optimal',
      };
    },
  },
  ph: {
    key: 'ph',
    name: {
      en: 'Soil pH (1:1 H₂O)',
      fr: 'pH du Sol (1:1 H₂O)',
      ar: 'درجة حموضة التربة (pH)',
    },
    unit: 'pH scale',
    minRange: 4.5,
    maxRange: 9.0,
    step: 0.1,
    optimalMin: 6.2,
    optimalMax: 7.4,
    colorInterpolator: d3.interpolateSpectral,
    colorSchemeName: 'Spectral',
    description: {
      en: 'Determines nutrient solubility and microbial activity. Extremes induce micro-nutrient lockup.',
      fr: 'Détermine la solubilité des nutriments et l’activité microbienne. Les extrêmes bloquent les oligo-éléments.',
      ar: 'يحدد ذائبية العناصر الغذائية والنشاط الميكروبي. الدرجات الحادة تسبب تثبيت العناصر الصغرى.',
    },
    fertilizerName: {
      en: 'Agricultural Lime (CaCO₃) if Acidic / Elemental Sulfur if Alkaline',
      fr: 'Chaux Agricole (CaCO₃) si Acide / Soufre Élémentaire si Alcalin',
      ar: 'كلس زراعي (CaCO₃) إذا كانت حامضية / كبريت زراعي إذا كانت قلوية',
    },
    correctionFormula: (avg, ha) => {
      if (avg > 8.0) {
        const rate = 800;
        return {
          rateKgHa: rate,
          totalKg: rate * ha,
          actionText: {
            en: `Calcareous/Alkaline soil (pH ${avg.toFixed(1)}). Apply ${rate} kg/ha micronized elemental Sulfur and acidifying fertigation.`,
            fr: `Sol calcaire/alcalin (pH ${avg.toFixed(1)}). Appliquer ${rate} kg/ha de soufre élémentaire et fertirrigation acidifiante.`,
            ar: `تربة كلسية/قلوية (pH ${avg.toFixed(1)}). أضف ${rate} كغ/هـ كبريت زراعي ناعم واستخدم أسمدة محمضة في الري.`,
          },
          urgency: 'high',
        };
      } else if (avg < 5.8) {
        const rate = 1500;
        return {
          rateKgHa: rate,
          totalKg: rate * ha,
          actionText: {
            en: `Acidic soil (pH ${avg.toFixed(1)}). Apply ${rate} kg/ha calcitic lime to elevate pH and mobilize Phosphorus.`,
            fr: `Sol acide (pH ${avg.toFixed(1)}). Appliquer ${rate} kg/ha de chaux pour relever le pH et libérer le phosphore.`,
            ar: `تربة حامضية (pH ${avg.toFixed(1)}). أضف ${rate} كغ/هـ جير زراعي لرفع الحموضة وتحرير الفوسفور.`,
          },
          urgency: 'high',
        };
      }
      return {
        rateKgHa: 0,
        totalKg: 0,
        actionText: {
          en: 'Soil pH is in the optimal agronomic availability zone (6.2 - 7.5).',
          fr: 'Le pH du sol se situe dans la zone optimale de disponibilité des nutriments (6.2 - 7.5).',
          ar: 'درجة حموضة التربة في النطاق المثالي لإتاحة جميع العناصر (6.2 - 7.5).',
        },
        urgency: 'optimal',
      };
    },
  },
  ec: {
    key: 'ec',
    name: {
      en: 'Electrical Conductivity (Salinity ECe)',
      fr: 'Conductivité Électrique (Salinité CEe)',
      ar: 'الناقلية الكهربائية (الملوحة ECe)',
    },
    unit: 'dS/m (mS/cm)',
    minRange: 0.2,
    maxRange: 8.0,
    step: 0.1,
    optimalMin: 0.5,
    optimalMax: 1.8,
    colorInterpolator: (t: number) => d3.interpolateRdYlBu(1 - t),
    colorSchemeName: 'RdYlBu-Inverted',
    description: {
      en: 'Measure of total soluble salts. High EC causes root osmotic shock and yield reduction.',
      fr: 'Mesure des sels solubles totaux. Une CE élevée provoque un stress osmotique et réduit le rendement.',
      ar: 'مقياس إجمالي الأملاح الذائبة. ارتفاع الملوحة يسبب صدمة أسموزية للجذور وتراجع الإنتاج.',
    },
    fertilizerName: {
      en: 'Gypsum (CaSO₄·2H₂O) Leaching / High Leaching Fraction',
      fr: 'Gypse Agricole (CaSO₄·2H₂O) / Fraction de Lessivage',
      ar: 'جبس زراعي (CaSO₄·2H₂O) للغسيل / زيادة معامل غسيل الأملاح',
    },
    correctionFormula: (avg, ha) => {
      if (avg > 3.0) {
        const gypsumTons = 3;
        return {
          rateKgHa: gypsumTons * 1000,
          totalKg: gypsumTons * 1000 * ha,
          actionText: {
            en: `Salinity hazard (EC ${avg.toFixed(1)} dS/m). Apply +25% leaching fraction and ${gypsumTons} t/ha agricultural Gypsum.`,
            fr: `Risque de salinité (CE ${avg.toFixed(1)} dS/m). Appliquer +25% de fraction de lessivage et ${gypsumTons} t/ha de gypse.`,
            ar: `خطر ملوحة مرتفعة (EC ${avg.toFixed(1)} dS/m). زد ماء الري بنسبة غسيل +25% وأضف ${gypsumTons} طن/هـ جبس زراعي.`,
          },
          urgency: 'high',
        };
      }
      return {
        rateKgHa: 0,
        totalKg: 0,
        actionText: {
          en: 'Salinity is low to moderate; safe for salt-sensitive crops.',
          fr: 'Salinité faible à modérée ; sans danger pour les cultures sensibles.',
          ar: 'الملوحة منخفضة إلى معتدلة؛ آمنة تماماً للمحاصيل الحساسة للملوحة.',
        },
        urgency: 'optimal',
      };
    },
  },
  cec: {
    key: 'cec',
    name: {
      en: 'Cation Exchange Capacity (CEC)',
      fr: 'Capacité d’Échange Cationique (CEC)',
      ar: 'سعة التبادل الكاتيوني (CEC)',
    },
    unit: 'meq/100g',
    minRange: 4,
    maxRange: 40,
    step: 1,
    optimalMin: 15,
    optimalMax: 30,
    colorInterpolator: d3.interpolateBlues,
    colorSchemeName: 'Blues',
    description: {
      en: 'Soil buffer capacity and electrical reserve for Ca²⁺, Mg²⁺, K⁺, and NH₄⁺ cations.',
      fr: 'Pouvoir tampon et réserve d’échange pour les cations Ca²⁺, Mg²⁺, K⁺ et NH₄⁺.',
      ar: 'القدرة التخزينية للتربة واحتفاظها بالكاتيونات الموجبة مثل الكالسيوم، المغنيسيوم والبوتاسيوم.',
    },
    fertilizerName: {
      en: 'Humic Acids / Zeolite / Heavy Organic Ameliorants',
      fr: 'Acides Humiques / Zéolithe / Amendements Organiques Lourds',
      ar: 'أحماض الهيوميك / زيوليت / مصلحات عضوية مركزة',
    },
    correctionFormula: (avg, ha) => {
      if (avg < 10) {
        return {
          rateKgHa: 100,
          totalKg: 100 * ha,
          actionText: {
            en: 'Low CEC (sandy buffer). Split all fertigation into frequent micro-doses to avoid nutrient leaching.',
            fr: 'Faible CEC (sol sableux). Fractionner la fertirrigation en micro-doses pour éviter le lessivage.',
            ar: 'سعة تبادلية منخفضة (تربة رملية). جزّء التسميد إلى دفعات صغيرة متكررة لتفادي غسيل الأسمدة.',
          },
          urgency: 'medium',
        };
      }
      return {
        rateKgHa: 0,
        totalKg: 0,
        actionText: {
          en: 'High buffering capacity. Soil holds nutrients securely with low leaching risk.',
          fr: 'Forte capacité tampon. Le sol retient efficacement les éléments nutritifs.',
          ar: 'قدرة تخزينية ممتازة. التربة تحتفظ بالعناصر بكفاءة دون مخاطر غسيل عالية.',
        },
        urgency: 'optimal',
      };
    },
  },
  zinc: {
    key: 'zinc',
    name: {
      en: 'Available Zinc (Zn DTPA)',
      fr: 'Zinc Assimilable (Zn DTPA)',
      ar: 'الزنك المتاح (Zn DTPA)',
    },
    unit: 'ppm (mg/kg)',
    minRange: 0.2,
    maxRange: 6.0,
    step: 0.1,
    optimalMin: 1.2,
    optimalMax: 3.5,
    colorInterpolator: d3.interpolateWarm,
    colorSchemeName: 'Warm',
    description: {
      en: 'Crucial micronutrient for auxin synthesis, internode elongation, and enzyme activation.',
      fr: 'Oligo-élément essentiel pour la synthèse de l’auxine, l’élongation des entrenœuds et les enzymes.',
      ar: 'عنصر صغري أساسي لتخليق هرمون الأوكسين، استطالة السلاميات وتنشيط الإنزيمات.',
    },
    fertilizerName: {
      en: 'Chelated Zinc (Zn-EDTA 15%) / Zinc Sulfate (ZnSO₄)',
      fr: 'Zinc Chélaté (Zn-EDTA 15%) / Sulfate de Zinc',
      ar: 'زنك مخلبي (Zn-EDTA 15%) / كبريتات الزنك',
    },
    correctionFormula: (avg, ha) => {
      if (avg < 1.0) {
        const rate = 8;
        return {
          rateKgHa: rate,
          totalKg: rate * ha,
          actionText: {
            en: `Zn deficiency detected. Apply ${rate} kg/ha Zinc Sulfate in base dressing or foliar Zn-EDTA (1.5 kg/ha).`,
            fr: `Carence en zinc détectée. Appliquer ${rate} kg/ha de sulfate de zinc au sol ou Zn-EDTA foliaire (1.5 kg/ha).`,
            ar: `نقص واضح في الزنك. أضف ${rate} كغ/هـ كبريتات الزنك أرضياً أو رشاً ورقياً بـ Zn-EDTA (1.5 كغ/هـ).`,
          },
          urgency: 'high',
        };
      }
      return {
        rateKgHa: 0,
        totalKg: 0,
        actionText: {
          en: 'Zinc levels meet standard physiological thresholds.',
          fr: 'Les niveaux de zinc satisfont les seuils physiologiques normaux.',
          ar: 'مستويات الزنك كافية وتلبي المتطلبات الفسيولوجية للنبات.',
        },
        urgency: 'optimal',
      };
    },
  },
};

// ============================================================================
// Field Presets with Georeferenced Coordinates
// ============================================================================

export const FIELD_PRESETS: FieldPreset[] = [
  {
    id: 'mitidja-cereal-15ha',
    name: {
      en: 'Mitidja Valley - Cereal Pivot Sector (15.0 Ha)',
      fr: 'Plaine de la Mitidja - Secteur Céréalier (15.0 Ha)',
      ar: 'سهل متيجة - قطاع الحبوب المحوري (15.0 هـ)',
    },
    widthM: 387,
    lengthM: 387,
    areaHa: 15.0,
    description: {
      en: 'Loamy alluvial soil with severe historical nitrogen depletion on the eastern flank and balanced phosphorus.',
      fr: 'Sol alluvial limoneux avec épuisement azoté sur le flanc est et phosphore équilibré.',
      ar: 'تربة طميية رسوبية مع استنزاف نيتروجيني حاد في الجانب الشرقي وتوازن فوسفوري.',
    },
    samples: [
      { id: 'SP-01', x: 12, y: 15, depthCm: 30, values: { nitrogen: 14, phosphorus: 28, potassium: 240, som: 2.1, ph: 7.4, ec: 0.8, cec: 22, zinc: 1.1 } },
      { id: 'SP-02', x: 45, y: 18, depthCm: 30, values: { nitrogen: 24, phosphorus: 35, potassium: 290, som: 2.6, ph: 7.2, ec: 0.7, cec: 24, zinc: 1.4 } },
      { id: 'SP-03', x: 82, y: 16, depthCm: 30, values: { nitrogen: 38, phosphorus: 42, potassium: 320, som: 3.1, ph: 7.1, ec: 0.6, cec: 27, zinc: 1.9 } },
      { id: 'SP-04', x: 20, y: 50, depthCm: 30, values: { nitrogen: 18, phosphorus: 22, potassium: 210, som: 1.8, ph: 7.7, ec: 1.1, cec: 19, zinc: 0.9 } },
      { id: 'SP-05', x: 50, y: 48, depthCm: 30, values: { nitrogen: 32, phosphorus: 38, potassium: 280, som: 2.8, ph: 7.3, ec: 0.7, cec: 23, zinc: 1.6 } },
      { id: 'SP-06', x: 85, y: 52, depthCm: 30, values: { nitrogen: 48, phosphorus: 54, potassium: 360, som: 3.4, ph: 6.9, ec: 0.5, cec: 28, zinc: 2.3 } },
      { id: 'SP-07', x: 15, y: 82, depthCm: 30, values: { nitrogen: 12, phosphorus: 19, potassium: 195, som: 1.6, ph: 7.9, ec: 1.4, cec: 18, zinc: 0.7 } },
      { id: 'SP-08', x: 52, y: 85, depthCm: 30, values: { nitrogen: 28, phosphorus: 31, potassium: 260, som: 2.4, ph: 7.4, ec: 0.9, cec: 21, zinc: 1.3 } },
      { id: 'SP-09', x: 88, y: 80, depthCm: 30, values: { nitrogen: 44, phosphorus: 48, potassium: 340, som: 3.2, ph: 7.0, ec: 0.6, cec: 26, zinc: 2.1 } },
      { id: 'SP-10', x: 35, y: 32, depthCm: 30, values: { nitrogen: 22, phosphorus: 30, potassium: 250, som: 2.3, ph: 7.5, ec: 0.8, cec: 21, zinc: 1.2 } },
      { id: 'SP-11', x: 68, y: 68, depthCm: 30, values: { nitrogen: 41, phosphorus: 45, potassium: 310, som: 3.0, ph: 7.1, ec: 0.6, cec: 25, zinc: 1.8 } },
    ],
  },
  {
    id: 'biskra-oasis-date-8ha',
    name: {
      en: 'Biskra Oasis - Drip Irrigated Orchard (8.0 Ha)',
      fr: 'Oasis de Biskra - Verger Irrigué au Goutte-à-Goutte (8.0 Ha)',
      ar: 'واحات بسكرة - بستان مروي بالتنقيط (8.0 هـ)',
    },
    widthM: 282,
    lengthM: 283,
    areaHa: 8.0,
    description: {
      en: 'Sandy-calcareous arid soil with elevated salinity (EC) gradient near tail drain and alkaline pH.',
      fr: 'Sol aride sableux-calcaire avec gradient de salinité (CE) près du drain et pH alcalin.',
      ar: 'تربة رملية كلسية جافة مع تدرج ملوحة (EC) بالقرب من المصرف وقلوية مرتفعة.',
    },
    samples: [
      { id: 'B-01', x: 15, y: 15, depthCm: 45, values: { nitrogen: 20, phosphorus: 18, potassium: 290, som: 1.1, ph: 8.1, ec: 1.5, cec: 12, zinc: 0.8 } },
      { id: 'B-02', x: 50, y: 15, depthCm: 45, values: { nitrogen: 26, phosphorus: 24, potassium: 320, som: 1.4, ph: 8.0, ec: 2.1, cec: 14, zinc: 1.0 } },
      { id: 'B-03', x: 85, y: 18, depthCm: 45, values: { nitrogen: 18, phosphorus: 14, potassium: 260, som: 0.9, ph: 8.3, ec: 3.8, cec: 11, zinc: 0.6 } },
      { id: 'B-04', x: 20, y: 55, depthCm: 45, values: { nitrogen: 28, phosphorus: 22, potassium: 310, som: 1.5, ph: 7.9, ec: 1.8, cec: 15, zinc: 1.1 } },
      { id: 'B-05', x: 52, y: 50, depthCm: 45, values: { nitrogen: 34, phosphorus: 30, potassium: 370, som: 1.8, ph: 7.8, ec: 2.6, cec: 16, zinc: 1.3 } },
      { id: 'B-06', x: 82, y: 55, depthCm: 45, values: { nitrogen: 16, phosphorus: 12, potassium: 240, som: 0.8, ph: 8.4, ec: 4.9, cec: 9, zinc: 0.5 } },
      { id: 'B-07', x: 18, y: 88, depthCm: 45, values: { nitrogen: 22, phosphorus: 19, potassium: 280, som: 1.2, ph: 8.0, ec: 2.4, cec: 13, zinc: 0.9 } },
      { id: 'B-08', x: 55, y: 85, depthCm: 45, values: { nitrogen: 30, phosphorus: 27, potassium: 340, som: 1.6, ph: 7.9, ec: 3.2, cec: 14, zinc: 1.2 } },
      { id: 'B-09', x: 88, y: 88, depthCm: 45, values: { nitrogen: 14, phosphorus: 10, potassium: 220, som: 0.7, ph: 8.6, ec: 6.2, cec: 8, zinc: 0.4 } },
    ],
  },
  {
    id: 'chlef-greenhouse-3ha',
    name: {
      en: 'Chlef Valley - Protected Solanaceous Greenhouse (3.5 Ha)',
      fr: 'Vallée du Chlef - Serres Solanacées de Précision (3.5 Ha)',
      ar: 'وادي الشلف - بيوت محمية لإنتاج الباذنجانيات (3.5 هـ)',
    },
    widthM: 187,
    lengthM: 187,
    areaHa: 3.5,
    description: {
      en: 'Intensive fertigated soil with localized Phosphorus buildup and high Potassium accumulation.',
      fr: 'Sol intensif sous fertirrigation avec accumulation localisée de phosphore et potassium élevé.',
      ar: 'تربة مكثفة بالتسميد بالري مع تراكم موضعي للفوسفور ونسب بوتاسيوم مرتفعة.',
    },
    samples: [
      { id: 'GH-1', x: 10, y: 20, depthCm: 20, values: { nitrogen: 45, phosphorus: 65, potassium: 420, som: 3.6, ph: 6.8, ec: 1.9, cec: 28, zinc: 3.2 } },
      { id: 'GH-2', x: 50, y: 22, depthCm: 20, values: { nitrogen: 52, phosphorus: 74, potassium: 460, som: 4.1, ph: 6.7, ec: 2.2, cec: 31, zinc: 3.8 } },
      { id: 'GH-3', x: 90, y: 20, depthCm: 20, values: { nitrogen: 38, phosphorus: 58, potassium: 390, som: 3.2, ph: 6.9, ec: 1.7, cec: 26, zinc: 2.8 } },
      { id: 'GH-4', x: 12, y: 80, depthCm: 20, values: { nitrogen: 40, phosphorus: 60, potassium: 410, som: 3.4, ph: 6.8, ec: 1.8, cec: 27, zinc: 3.0 } },
      { id: 'GH-5', x: 52, y: 78, depthCm: 20, values: { nitrogen: 58, phosphorus: 82, potassium: 490, som: 4.4, ph: 6.6, ec: 2.5, cec: 33, zinc: 4.2 } },
      { id: 'GH-6', x: 88, y: 82, depthCm: 20, values: { nitrogen: 34, phosphorus: 52, potassium: 370, som: 3.0, ph: 7.0, ec: 1.6, cec: 25, zinc: 2.6 } },
      { id: 'GH-7', x: 50, y: 50, depthCm: 20, values: { nitrogen: 62, phosphorus: 88, potassium: 510, som: 4.7, ph: 6.5, ec: 2.7, cec: 35, zinc: 4.6 } },
    ],
  },
];

// ============================================================================
// Inverse Distance Weighting (IDW) Algorithm
// ============================================================================

function computeIdwGrid(
  samples: SoilSamplePoint[],
  nutrient: NutrientKey,
  gridWidth: number,
  gridHeight: number,
  power = 2.0,
  smoothing = 0.5
): number[][] {
  const grid: number[][] = Array.from({ length: gridHeight }, () =>
    Array.from({ length: gridWidth }, () => 0)
  );

  if (samples.length === 0) return grid;
  if (samples.length === 1) {
    const singleVal = samples[0].values[nutrient];
    for (let r = 0; r < gridHeight; r++) {
      for (let c = 0; c < gridWidth; c++) {
        grid[r][c] = singleVal;
      }
    }
    return grid;
  }

  for (let r = 0; r < gridHeight; r++) {
    const py = (r / (gridHeight - 1)) * 100;
    for (let c = 0; c < gridWidth; c++) {
      const px = (c / (gridWidth - 1)) * 100;

      let numerator = 0;
      let denominator = 0;
      let exactMatchVal: number | null = null;

      for (const s of samples) {
        const dx = px - s.x;
        const dy = py - s.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < 0.001) {
          exactMatchVal = s.values[nutrient];
          break;
        }

        const dist = Math.sqrt(distSq) + smoothing;
        const weight = 1 / Math.pow(dist, power);

        numerator += weight * s.values[nutrient];
        denominator += weight;
      }

      grid[r][c] = exactMatchVal !== null ? exactMatchVal : numerator / denominator;
    }
  }

  return grid;
}

// ============================================================================
// Main Component: SoilNutrientHeatmap
// ============================================================================

export function SoilNutrientHeatmap({ className = '' }: { className?: string }) {
  const { language, isRTL } = useTranslation();
  const tr = useCallback(
    (en: string, fr: string, ar: string) => copyFor(language, en, ar, fr),
    [language]
  );

  // State Management
  const [selectedPresetId, setSelectedPresetId] = useState<string>('mitidja-cereal-15ha');
  const [activeNutrient, setActiveNutrient] = useState<NutrientKey>('nitrogen');
  const [samples, setSamples] = useState<SoilSamplePoint[]>(() => FIELD_PRESETS[0].samples);
  const [fieldAreaHa, setFieldAreaHa] = useState<number>(() => FIELD_PRESETS[0].areaHa);
  const [fieldWidthM, setFieldWidthM] = useState<number>(() => FIELD_PRESETS[0].widthM);
  const [fieldLengthM, setFieldLengthM] = useState<number>(() => FIELD_PRESETS[0].lengthM);

  // View & Layer Controls
  const [showContours, setShowContours] = useState<boolean>(true);
  const [showSamplePoints, setShowSamplePoints] = useState<boolean>(true);
  const [showCoordinateGrid, setShowCoordinateGrid] = useState<boolean>(true);
  const [showVraZones, setShowVraZones] = useState<boolean>(false);
  const [idwPower, setIdwPower] = useState<number>(2.0);
  const [gridResolution, setGridResolution] = useState<number>(40); // 40x40 matrix
  const [contourThresholdCount, setContourThresholdCount] = useState<number>(9);
  const [transitionDuration, setTransitionDuration] = useState<number>(750); // ms transition duration for D3 color blocks
  const [isAutoCycling, setIsAutoCycling] = useState<boolean>(false);

  // Interaction State
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [hoverCoordinate, setHoverCoordinate] = useState<{
    xPct: number;
    yPct: number;
    xM: number;
    yM: number;
    value: number;
    screenX: number;
    screenY: number;
  } | null>(null);
  const [isAddingSampleMode, setIsAddingSampleMode] = useState<boolean>(false);

  // DOM Refs
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Current metadata
  const currentMeta = NUTRIENT_METADATA[activeNutrient];

  // Handle Preset Change
  const handlePresetSelect = (presetId: string) => {
    const preset = FIELD_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(presetId);
    setSamples(JSON.parse(JSON.stringify(preset.samples)));
    setFieldAreaHa(preset.areaHa);
    setFieldWidthM(preset.widthM);
    setFieldLengthM(preset.lengthM);
    setSelectedSampleId(null);
  };

  // Generate Computed Matrix
  const idwMatrix = useMemo(() => {
    return computeIdwGrid(samples, activeNutrient, gridResolution, gridResolution, idwPower, 0.4);
  }, [samples, activeNutrient, gridResolution, idwPower]);

  // Statistical Metrics
  const stats = useMemo(() => {
    const values = samples.map((s) => s.values[activeNutrient]);
    if (values.length === 0) {
      return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0, cv: 0, sampleCount: 0 };
    }

    const min = d3.min(values) ?? 0;
    const max = d3.max(values) ?? 0;
    const mean = d3.mean(values) ?? 0;
    const median = d3.median(values) ?? 0;
    const stdDev = d3.deviation(values) ?? 0;
    const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

    return { min, max, mean, median, stdDev, cv, sampleCount: values.length };
  }, [samples, activeNutrient]);

  // Prescription Recommendation
  const prescription = useMemo(() => {
    return currentMeta.correctionFormula(stats.mean, fieldAreaHa);
  }, [currentMeta, stats.mean, fieldAreaHa]);

  // Auto-Cycle demo loop
  useEffect(() => {
    if (!isAutoCycling) return;
    const nutrientKeys = Object.keys(NUTRIENT_METADATA) as NutrientKey[];
    const timer = setInterval(() => {
      setActiveNutrient((prev) => {
        const currentIndex = nutrientKeys.indexOf(prev);
        const nextIndex = (currentIndex + 1) % nutrientKeys.length;
        return nutrientKeys[nextIndex];
      });
    }, 2600);
    return () => clearInterval(timer);
  }, [isAutoCycling]);

  // ============================================================================
  // D3 Rendering Pipeline with Smooth Color Transitions
  // ============================================================================

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const containerWidth = containerRef.current.clientWidth || 600;
    const margin = { top: 35, right: 35, bottom: 45, left: 55 };
    const width = containerWidth - margin.left - margin.right;
    const height = Math.max(380, Math.min(520, containerWidth * 0.7)) - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${containerWidth} ${height + margin.top + margin.bottom}`);

    // Ensure Persistent Layer Structure
    let g = svg.select<SVGGElement>('g.main-group');
    if (g.empty()) {
      g = svg.append('g').attr('class', 'main-group');
      g.append('g').attr('class', 'raster-layer');
      g.append('g').attr('class', 'grid-layer');
      g.append('g').attr('class', 'contour-layer');
      g.append('g').attr('class', 'axis-layer');
      g.append('rect').attr('class', 'border-box');
      g.append('g').attr('class', 'samples-layer');
      g.append('rect').attr('class', 'interaction-overlay');
    }

    g.attr('transform', `translate(${margin.left},${margin.top})`);

    // X and Y Scales (0 to 100% field coords)
    const xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([0, height]);

    // Metric scales (0 to Field Width / Length in meters)
    const xMetreScale = d3.scaleLinear().domain([0, fieldWidthM]).range([0, width]);
    const yMetreScale = d3.scaleLinear().domain([0, fieldLengthM]).range([0, height]);

    // Color Scale for the active nutrient
    const minVal = Math.min(currentMeta.minRange, stats.min * 0.9);
    const maxVal = Math.max(currentMeta.maxRange, stats.max * 1.1);

    const colorScale = d3.scaleSequential(currentMeta.colorInterpolator).domain([minVal, maxVal]);

    // Define Grid Matrix as 1D array for d3.contours
    // (d3.contours expects a number[], not a typed array, in current @types/d3)
    const flatGrid: number[] = new Array(gridResolution * gridResolution);
    for (let r = 0; r < gridResolution; r++) {
      for (let c = 0; c < gridResolution; c++) {
        flatGrid[r * gridResolution + c] = idwMatrix[r][c];
      }
    }

    // Transform from grid indices to SVG coordinates
    const transformScaleX = d3.scaleLinear().domain([0, gridResolution - 1]).range([0, width]);
    const transformScaleY = d3.scaleLinear().domain([0, gridResolution - 1]).range([0, height]);

    // Shared transition setup
    const animDuration = transitionDuration;
    const t = svg.transition().duration(animDuration).ease(d3.easeCubicInOut);

    // --------------------------------------------------------------------------
    // 1. Base Pixel Raster Rendering with Smooth Color Transitions
    // --------------------------------------------------------------------------
    const cellW = width / (gridResolution - 1);
    const cellH = height / (gridResolution - 1);

    const rasterG = g.select<SVGGElement>('g.raster-layer');

    type CellData = { id: string; r: number; c: number; x: number; y: number; val: number };
    const cellData: CellData[] = [];

    for (let r = 0; r < gridResolution - 1; r++) {
      for (let c = 0; c < gridResolution - 1; c++) {
        cellData.push({
          id: `cell-${r}-${c}`,
          r,
          c,
          x: transformScaleX(c),
          y: transformScaleY(r),
          val: idwMatrix[r][c],
        });
      }
    }

    rasterG
      .selectAll<SVGRectElement, CellData>('rect.raster-cell')
      .data(cellData, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append('rect')
            .attr('class', 'raster-cell')
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .attr('width', cellW + 0.8)
            .attr('height', cellH + 0.8)
            .attr('opacity', 0.94)
            .attr('fill', (d) => colorScale(d.val)),
        (update) =>
          update
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .attr('width', cellW + 0.8)
            .attr('height', cellH + 0.8)
            .call((upd) =>
              animDuration > 0
                ? upd.transition().duration(animDuration).ease(d3.easeCubicInOut).attr('fill', (d) => colorScale(d.val))
                : upd.attr('fill', (d) => colorScale(d.val))
            ),
        (exit) => exit.remove()
      );

    // --------------------------------------------------------------------------
    // 2. Contour Isoband & Isoline Layer with Smooth Geometry & Opacity Transitions
    // --------------------------------------------------------------------------
    const contourG = g.select<SVGGElement>('g.contour-layer');

    if (showContours) {
      const contours = d3
        .contours()
        .size([gridResolution, gridResolution])
        .thresholds(contourThresholdCount)(flatGrid);

      const pathGenerator = d3.geoPath(
        d3.geoTransform({
          point(x, y) {
            this.stream.point(transformScaleX(x), transformScaleY(y));
          },
        })
      );

      // Contour Lines
      contourG
        .selectAll<SVGPathElement, d3.ContourMultiPolygon>('path.contour-line')
        .data(contours, (d, i) => `contour-${i}`)
        .join(
          (enter) =>
            enter
              .append('path')
              .attr('class', 'contour-line')
              .attr('fill', 'none')
              .attr('stroke', 'rgba(255, 255, 255, 0.55)')
              .attr('stroke-width', 1.2)
              .attr('stroke-dasharray', (d) =>
                d.value === currentMeta.optimalMin || d.value === currentMeta.optimalMax ? '4 2' : 'none'
              )
              .attr('d', pathGenerator)
              .attr('opacity', 0)
              .call((e) => (animDuration > 0 ? e.transition().duration(400).attr('opacity', 1) : e.attr('opacity', 1))),
          (update) =>
            update
              .attr('stroke-dasharray', (d) =>
                d.value === currentMeta.optimalMin || d.value === currentMeta.optimalMax ? '4 2' : 'none'
              )
              .call((upd) =>
                animDuration > 0
                  ? upd.transition().duration(animDuration).ease(d3.easeCubicInOut).attr('d', pathGenerator).attr('opacity', 1)
                  : upd.attr('d', pathGenerator).attr('opacity', 1)
              ),
          (exit) =>
            exit.call((ex) => (animDuration > 0 ? ex.transition().duration(250).attr('opacity', 0).remove() : ex.remove()))
        );

      // Contour Numerical Labels
      const labeledContours = contours.filter((_, i) => i % 2 === 0);
      contourG
        .selectAll<SVGTextElement, d3.ContourMultiPolygon>('text.contour-label')
        .data(labeledContours, (d, i) => `clabel-${i}`)
        .join(
          (enter) =>
            enter
              .append('text')
              .attr('class', 'contour-label')
              .attr('transform', (d) => {
                const centroid = pathGenerator.centroid(d);
                return isNaN(centroid[0]) ? 'translate(-100,-100)' : `translate(${centroid[0]},${centroid[1]})`;
              })
              .text((d) => `${d.value.toFixed(1)}`)
              .attr('font-size', '9px')
              .attr('font-weight', '600')
              .attr('font-family', 'monospace')
              .attr('fill', '#ffffff')
              .attr('stroke', 'rgba(0,0,0,0.6)')
              .attr('stroke-width', 2)
              .attr('paint-order', 'stroke')
              .attr('text-anchor', 'middle')
              .attr('opacity', 0)
              .call((e) => (animDuration > 0 ? e.transition().duration(400).attr('opacity', 1) : e.attr('opacity', 1))),
          (update) =>
            update
              .text((d) => `${d.value.toFixed(1)}`)
              .call((upd) =>
                animDuration > 0
                  ? upd
                      .transition().duration(animDuration).ease(d3.easeCubicInOut)
                      .attr('transform', (d) => {
                        const centroid = pathGenerator.centroid(d);
                        return isNaN(centroid[0]) ? 'translate(-100,-100)' : `translate(${centroid[0]},${centroid[1]})`;
                      })
                      .attr('opacity', 1)
                  : upd
                      .attr('transform', (d) => {
                        const centroid = pathGenerator.centroid(d);
                        return isNaN(centroid[0]) ? 'translate(-100,-100)' : `translate(${centroid[0]},${centroid[1]})`;
                      })
                      .attr('opacity', 1)
              ),
          (exit) =>
            exit.call((ex) => (animDuration > 0 ? ex.transition().duration(250).attr('opacity', 0).remove() : ex.remove()))
        );
    } else {
      contourG.selectAll('*').remove();
    }

    // --------------------------------------------------------------------------
    // 3. Coordinate Grid Overlay & Axes
    // --------------------------------------------------------------------------
    const gridG = g.select<SVGGElement>('g.grid-layer');
    gridG.selectAll('*').remove();

    if (showCoordinateGrid) {
      const gridX = d3.axisBottom(xScale).ticks(10).tickSize(-height).tickFormat(() => '');
      const gridY = d3.axisLeft(yScale).ticks(10).tickSize(-width).tickFormat(() => '');

      gridG
        .append('g')
        .attr('class', 'grid grid-x')
        .attr('transform', `translate(0,${height})`)
        .call(gridX)
        .selectAll('line')
        .attr('stroke', 'currentColor')
        .attr('stroke-opacity', 0.12)
        .attr('stroke-dasharray', '2 2');

      gridG
        .append('g')
        .attr('class', 'grid grid-y')
        .call(gridY)
        .selectAll('line')
        .attr('stroke', 'currentColor')
        .attr('stroke-opacity', 0.12)
        .attr('stroke-dasharray', '2 2');
    }

    // Axes
    const axisG = g.select<SVGGElement>('g.axis-layer');
    axisG.selectAll('*').remove();

    const xAxis = d3
      .axisBottom(xMetreScale)
      .ticks(6)
      .tickFormat((d) => `${d}m`);

    const xAxisG = axisG
      .append('g')
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);

    xAxisG.selectAll('text').attr('font-size', '10px').attr('fill', 'currentColor').attr('opacity', 0.8);
    xAxisG.selectAll('line').attr('stroke', 'currentColor').attr('opacity', 0.3);
    xAxisG.select('.domain').attr('stroke', 'currentColor').attr('opacity', 0.4);

    const yAxis = d3
      .axisLeft(yMetreScale)
      .ticks(6)
      .tickFormat((d) => `${d}m`);

    const yAxisG = axisG.append('g').attr('class', 'axis axis-y').call(yAxis);

    yAxisG.selectAll('text').attr('font-size', '10px').attr('fill', 'currentColor').attr('opacity', 0.8);
    yAxisG.selectAll('line').attr('stroke', 'currentColor').attr('opacity', 0.3);
    yAxisG.select('.domain').attr('stroke', 'currentColor').attr('opacity', 0.4);

    // Field Boundary Box
    g.select<SVGRectElement>('rect.border-box')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('stroke', 'currentColor')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.7)
      .attr('rx', 4);

    // --------------------------------------------------------------------------
    // 4. Soil Sample Points Overlay with Transition Animation
    // --------------------------------------------------------------------------
    const samplesG = g.select<SVGGElement>('g.samples-layer');

    if (showSamplePoints) {
      const pointGroups = samplesG
        .selectAll<SVGGElement, SoilSamplePoint>('g.sample-point')
        .data(samples, (d) => d.id);

      const pointEnter = pointGroups
        .enter()
        .append('g')
        .attr('class', 'sample-point')
        .attr('transform', (d) => `translate(${xScale(d.x)},${yScale(d.y)})`)
        .attr('cursor', 'pointer')
        .on('click', (event, d) => {
          event.stopPropagation();
          setSelectedSampleId((prev) => (prev === d.id ? null : d.id));
        });

      // Point Pin Circle
      pointEnter
        .append('circle')
        .attr('class', 'sample-circle')
        .attr('r', 7)
        .attr('fill', (d) => colorScale(d.values[activeNutrient]))
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)
        .attr('filter', 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))');

      // Point Pin Core
      pointEnter
        .append('circle')
        .attr('class', 'sample-core')
        .attr('r', 2.5)
        .attr('fill', '#000000');

      // Sample Label & Measured Value
      pointEnter
        .append('text')
        .attr('class', 'sample-text')
        .attr('x', 9)
        .attr('y', 3)
        .text((d) => `${d.id}: ${d.values[activeNutrient]}${activeNutrient === 'som' ? '%' : ''}`)
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .attr('font-family', 'monospace')
        .attr('fill', '#ffffff')
        .attr('stroke', 'rgba(0,0,0,0.8)')
        .attr('stroke-width', 2.5)
        .attr('paint-order', 'stroke');

      // Update existing points with smooth transition
      pointGroups
        .call((upd: any) =>
          animDuration > 0
            ? upd.transition(t).attr('transform', (d: any) => `translate(${xScale(d.x)},${yScale(d.y)})`)
            : upd.attr('transform', (d: any) => `translate(${xScale(d.x)},${yScale(d.y)})`)
        );

      pointGroups
        .select('circle.sample-circle')
        .call((upd: any) =>
          animDuration > 0
            ? upd.transition(t).attr('fill', (d: any) => colorScale(d.values[activeNutrient]))
            : upd.attr('fill', (d: any) => colorScale(d.values[activeNutrient]))
        );

      pointGroups
        .select('text.sample-text')
        .text((d) => `${d.id}: ${d.values[activeNutrient]}${activeNutrient === 'som' ? '%' : ''}`);

      pointGroups.exit().remove();

      // Outer Selection Pulse Ring
      samplesG.selectAll('.pulse-ring').remove();
      if (selectedSampleId) {
        const selectedPt = samples.find((s) => s.id === selectedSampleId);
        if (selectedPt) {
          samplesG
            .append('circle')
            .attr('class', 'pulse-ring animate-spin')
            .attr('cx', xScale(selectedPt.x))
            .attr('cy', yScale(selectedPt.y))
            .attr('r', 14)
            .attr('fill', 'none')
            .attr('stroke', '#38bdf8')
            .attr('stroke-width', 2.5)
            .attr('stroke-dasharray', '3 2')
            .attr('pointer-events', 'none');
        }
      }
    } else {
      samplesG.selectAll('*').remove();
    }

    // --------------------------------------------------------------------------
    // 5. Interactive Cursor & Click-to-Add Tracking
    // --------------------------------------------------------------------------
    const overlay = g
      .select<SVGRectElement>('rect.interaction-overlay')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'transparent')
      .attr('cursor', isAddingSampleMode ? 'crosshair' : 'default');

    overlay.on('mousemove', (event) => {
      const [mx, my] = d3.pointer(event);
      const xPct = Math.max(0, Math.min(100, xScale.invert(mx)));
      const yPct = Math.max(0, Math.min(100, yScale.invert(my)));
      const xM = Math.round((xPct / 100) * fieldWidthM);
      const yM = Math.round((yPct / 100) * fieldLengthM);

      // Look up interpolated value at mouse coordinate
      const rIdx = Math.max(0, Math.min(gridResolution - 1, Math.round((yPct / 100) * (gridResolution - 1))));
      const cIdx = Math.max(0, Math.min(gridResolution - 1, Math.round((xPct / 100) * (gridResolution - 1))));
      const val = idwMatrix[rIdx][cIdx];

      setHoverCoordinate({
        xPct: Math.round(xPct * 10) / 10,
        yPct: Math.round(yPct * 10) / 10,
        xM,
        yM,
        value: Math.round(val * 10) / 10,
        screenX: event.clientX,
        screenY: event.clientY,
      });
    });

    overlay.on('mouseleave', () => {
      setHoverCoordinate(null);
    });

    overlay.on('click', (event) => {
      const [mx, my] = d3.pointer(event);
      const xPct = Math.round(xScale.invert(mx));
      const yPct = Math.round(yScale.invert(my));

      if (isAddingSampleMode) {
        // Create new sample point
        const newId = `SP-${String(samples.length + 1).padStart(2, '0')}`;
        const rIdx = Math.max(0, Math.min(gridResolution - 1, Math.round((yPct / 100) * (gridResolution - 1))));
        const cIdx = Math.max(0, Math.min(gridResolution - 1, Math.round((xPct / 100) * (gridResolution - 1))));
        const curVal = idwMatrix[rIdx][cIdx];

        const newSample: SoilSamplePoint = {
          id: newId,
          x: xPct,
          y: yPct,
          depthCm: 30,
          values: {
            nitrogen: activeNutrient === 'nitrogen' ? Math.round(curVal) : 28,
            phosphorus: activeNutrient === 'phosphorus' ? Math.round(curVal) : 32,
            potassium: activeNutrient === 'potassium' ? Math.round(curVal) : 260,
            som: activeNutrient === 'som' ? Math.round(curVal * 10) / 10 : 2.5,
            ph: activeNutrient === 'ph' ? Math.round(curVal * 10) / 10 : 7.2,
            ec: activeNutrient === 'ec' ? Math.round(curVal * 10) / 10 : 0.9,
            cec: activeNutrient === 'cec' ? Math.round(curVal) : 22,
            zinc: activeNutrient === 'zinc' ? Math.round(curVal * 10) / 10 : 1.4,
          },
        };

        setSamples((prev) => [...prev, newSample]);
        setSelectedSampleId(newId);
        setIsAddingSampleMode(false);
      } else {
        setSelectedSampleId(null);
      }
    });
  }, [
    idwMatrix,
    samples,
    activeNutrient,
    currentMeta,
    fieldWidthM,
    fieldLengthM,
    stats,
    showContours,
    showSamplePoints,
    showCoordinateGrid,
    contourThresholdCount,
    selectedSampleId,
    isAddingSampleMode,
    gridResolution,
    transitionDuration,
  ]);

  // ============================================================================
  // Sample Point Value Editing & Handlers
  // ============================================================================

  const updateSelectedSampleValue = (nutrient: NutrientKey, value: number) => {
    if (!selectedSampleId) return;
    setSamples((prev) =>
      prev.map((s) =>
        s.id === selectedSampleId
          ? { ...s, values: { ...s.values, [nutrient]: value } }
          : s
      )
    );
  };

  const updateSelectedSampleCoords = (x: number, y: number) => {
    if (!selectedSampleId) return;
    setSamples((prev) =>
      prev.map((s) =>
        s.id === selectedSampleId
          ? { ...s, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
          : s
      )
    );
  };

  const deleteSelectedSample = () => {
    if (!selectedSampleId) return;
    setSamples((prev) => prev.filter((s) => s.id !== selectedSampleId));
    setSelectedSampleId(null);
  };

  const addRandomSample = () => {
    const rx = Math.floor(Math.random() * 80) + 10;
    const ry = Math.floor(Math.random() * 80) + 10;
    const newId = `SP-${String(samples.length + 1).padStart(2, '0')}`;
    const newSample: SoilSamplePoint = {
      id: newId,
      x: rx,
      y: ry,
      depthCm: 30,
      values: {
        nitrogen: Math.floor(Math.random() * 40) + 15,
        phosphorus: Math.floor(Math.random() * 45) + 15,
        potassium: Math.floor(Math.random() * 250) + 150,
        som: Math.round((Math.random() * 3 + 1.2) * 10) / 10,
        ph: Math.round((Math.random() * 2.0 + 6.5) * 10) / 10,
        ec: Math.round((Math.random() * 2.0 + 0.4) * 10) / 10,
        cec: Math.floor(Math.random() * 20) + 12,
        zinc: Math.round((Math.random() * 2.5 + 0.6) * 10) / 10,
      },
    };
    setSamples((prev) => [...prev, newSample]);
    setSelectedSampleId(newId);
  };

  const resetToPreset = () => {
    handlePresetSelect(selectedPresetId);
  };

  const exportSvgMap = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soil_nutrient_heatmap_${activeNutrient}_${selectedPresetId}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectedSample = samples.find((s) => s.id === selectedSampleId);

  // ============================================================================
  // Render JSX
  // ============================================================================

  return (
    <Card
      id="soil-nutrient-d3-heatmap-card"
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`border-emerald-200/70 shadow-sm dark:border-emerald-900/60 ${className}`}
    >
      {/* Header Section */}
      <CardHeader className="border-b bg-gradient-to-r from-emerald-50/70 via-background to-teal-50/40 pb-4 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <Grid3X3 className="h-4 w-4" />
              </span>
              <CardTitle className="text-base sm:text-lg font-bold tracking-tight">
                {tr(
                  'Soil Nutrient Spatial Heatmap (D3.js)',
                  'Cartographie Spatiale des Nutriments du Sol (D3.js)',
                  'خريطة التوزيع الحراري لمغذيات التربة (D3.js)'
                )}
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                IDW Spatial Model
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground max-w-2xl leading-relaxed">
              {tr(
                'Interpolates core soil sample coordinates (N, P, K, SOM, pH, EC, CEC, Zn) across field geometries using Inverse Distance Weighting and D3 contour polygons.',
                'Interpole les coordonnées d’échantillons de sol (N, P, K, MOS, pH, CE, CEC, Zn) sur les parcelles par pondération inverse de la distance et contours D3.',
                'نمذجة مكانية لاستيفاء عينات التربة (N, P, K, SOM, pH, EC, CEC, Zn) عبر إحداثيات الحقل باستخدام مضلعات الكنتور واستيفاء مقلوب المسافة الموزونة.'
              )}
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={exportSvgMap}
              className="gap-1.5 text-xs h-8"
              title={tr('Export Heatmap as SVG', 'Exporter la carte en SVG', 'تصدير الخريطة بصيغة SVG')}
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tr('Export SVG', 'Exporter SVG', 'تصدير SVG')}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetToPreset}
              className="gap-1.5 text-xs h-8"
              title={tr('Reset to Preset', 'Réinitialiser au préréglage', 'إعادة تعيين للنموذج')}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tr('Reset', 'Réinitialiser', 'إعادة ضبط')}</span>
            </Button>
          </div>
        </div>

        {/* Field Preset Selector & Dimension Indicators */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border/50 text-xs">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              {tr('Field Parcel Preset', 'Parcelle de terrain', 'نموذج القطعة الحقلية')}
            </label>
            <select
              value={selectedPresetId}
              onChange={(e) => handlePresetSelect(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-emerald-500"
            >
              {FIELD_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name[language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en']}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-4 px-3 py-1 rounded-md bg-muted/40 border text-[11px]">
            <div>
              <span className="text-muted-foreground">{tr('Dimensions:', 'Dimensions :', 'الأبعاد:')}</span>{' '}
              <span className="font-mono font-semibold">{fieldWidthM}m × {fieldLengthM}m</span>
            </div>
            <div>
              <span className="text-muted-foreground">{tr('Area:', 'Superficie :', 'المساحة:')}</span>{' '}
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{fieldAreaHa} Ha</span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-4 px-3 py-1 rounded-md bg-muted/40 border text-[11px]">
            <div>
              <span className="text-muted-foreground">{tr('Samples:', 'Échantillons :', 'العينات:')}</span>{' '}
              <span className="font-mono font-semibold">{samples.length} points</span>
            </div>
            <div>
              <span className="text-muted-foreground">{tr('Density:', 'Densité :', 'الكثافة:')}</span>{' '}
              <span className="font-mono font-semibold">{(samples.length / fieldAreaHa).toFixed(1)} / Ha</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Nutrient Selection Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
          {(Object.keys(NUTRIENT_METADATA) as NutrientKey[]).map((key) => {
            const meta = NUTRIENT_METADATA[key];
            const isActive = activeNutrient === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setActiveNutrient(key);
                  setSelectedSampleId(null);
                }}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>{meta.name[language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en']}</span>
                <span className={`text-[10px] font-mono px-1 rounded ${isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-background/80 text-muted-foreground'}`}>
                  {meta.unit}
                </span>
              </button>
            );
          })}
        </div>

        {/* Visualization Toolbar & Layer Switches */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-muted/30 p-2 rounded-lg border">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowContours((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                showContours
                  ? 'bg-background border-emerald-500/50 text-foreground font-semibold shadow-2xs'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-emerald-600" />
              <span>{tr('Contour Lines', 'Lignes de Contour', 'خطوط الكنتور')}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSamplePoints((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                showSamplePoints
                  ? 'bg-background border-emerald-500/50 text-foreground font-semibold shadow-2xs'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <MapPin className="h-3.5 w-3.5 text-sky-600" />
              <span>{tr('Sample Pins', 'Points de prélèvement', 'نقاط العينات')}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCoordinateGrid((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                showCoordinateGrid
                  ? 'bg-background border-emerald-500/50 text-foreground font-semibold shadow-2xs'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Compass className="h-3.5 w-3.5 text-amber-600" />
              <span>{tr('Meter Coordinates', 'Coordonnées en mètres', 'الإحداثيات بالأمتار')}</span>
            </button>

            {/* Animation Speed Selector */}
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border bg-background/80 text-[11px]">
              <Sparkles className="h-3 w-3 text-emerald-600 animate-pulse" />
              <span className="text-muted-foreground">{tr('Transition:', 'Transition :', 'الانتقال:')}</span>
              <select
                value={transitionDuration}
                onChange={(e) => setTransitionDuration(Number(e.target.value))}
                aria-label={tr('Transition duration', 'Durée de transition', 'مدة الانتقال')}
                className="bg-transparent font-semibold text-emerald-700 dark:text-emerald-300 border-none outline-hidden cursor-pointer"
              >
                <option value={1200}>{tr('Ultra (1.2s)', 'Fluide (1.2s)', 'فائق السلاسة (1.2ث)')}</option>
                <option value={750}>{tr('Smooth (750ms)', 'Fluide (750ms)', 'سلس (750مل ث)')}</option>
                <option value={350}>{tr('Fast (350ms)', 'Rapide (350ms)', 'سريع (350مل ث)')}</option>
                <option value={0}>{tr('Instant (0ms)', 'Instantané (0ms)', 'فوري (0مل ث)')}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto Cycle Demo Button */}
            <Button
              type="button"
              variant={isAutoCycling ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsAutoCycling((v) => !v)}
              className={`gap-1.5 text-xs h-7.5 ${isAutoCycling ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
              title={tr('Auto-cycle through all nutrients to preview smooth transition animation', 'Défilement automatique des nutriments', 'جولة تلقائية لمشاهدة التحول السلس بين العناصر')}
            >
              <RotateCcw className={`h-3.5 w-3.5 ${isAutoCycling ? 'animate-spin' : ''}`} />
              <span>
                {isAutoCycling
                  ? tr('Cycling Nutrients...', 'Défilement...', 'جولة انتقال نشطة...')
                  : tr('Cycle Demo', 'Démo Transition', 'عرض الانتقال')}
              </span>
            </Button>

            <Button
              type="button"
              variant={isAddingSampleMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsAddingSampleMode((v) => !v)}
              className={`gap-1.5 text-xs h-7.5 ${isAddingSampleMode ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}`}
            >
              <Crosshair className="h-3.5 w-3.5" />
              <span>
                {isAddingSampleMode
                  ? tr('Click map to place point...', 'Cliquez sur la carte...', 'انقر على الخريطة لوضع النقطة...')
                  : tr('Add Core Sample', 'Ajouter un échantillon', 'إضافة عينة')}
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRandomSample}
              className="gap-1.5 text-xs h-7.5"
              title={tr('Generate random test sample', 'Générer un échantillon aléatoire', 'توليد عينة عشوائية')}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{tr('Random Point', 'Point Aléatoire', 'نقطة عشوائية')}</span>
            </Button>
          </div>
        </div>

        {/* Main Grid: D3 Map Canvas + Live Statistical & Prescription Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* D3 Canvas Container (8 Cols) */}
          <div className="lg:col-span-8 space-y-2">
            <div
              ref={containerRef}
              className="relative w-full rounded-xl border bg-card/60 p-2 shadow-inner overflow-hidden"
            >
              {/* SVG Canvas */}
              <svg ref={svgRef} className="w-full h-auto select-none" />

              {/* Hover Coordinate Overlay HUD */}
              {hoverCoordinate && (
                <div
                  className="pointer-events-none absolute top-3 right-3 rounded-lg border bg-background/90 px-2.5 py-1.5 shadow-md backdrop-blur-md text-[11px] font-mono space-y-0.5"
                >
                  <div className="flex items-center justify-between gap-3 text-muted-foreground">
                    <span>X: {hoverCoordinate.xM}m ({hoverCoordinate.xPct}%)</span>
                    <span>Y: {hoverCoordinate.yM}m ({hoverCoordinate.yPct}%)</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 font-bold text-foreground">
                    <span>{currentMeta.name[language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en']}:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {hoverCoordinate.value} {currentMeta.unit}
                    </span>
                  </div>
                </div>
              )}

              {/* Adding Sample Active Banner */}
              {isAddingSampleMode && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-600 text-white px-4 py-1 text-xs font-semibold shadow-lg animate-pulse flex items-center gap-1.5">
                  <Crosshair className="h-3.5 w-3.5" />
                  <span>{tr('Click anywhere on the field grid to place a sample probe', 'Cliquez sur la parcelle pour placer un échantillon', 'انقر في أي مكان لوضع مسبار العينة')}</span>
                </div>
              )}
            </div>

            {/* Continuous Color Gradient Legend Bar */}
            <div className="rounded-lg border bg-muted/20 p-2.5 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-medium">
                <span className="text-muted-foreground">
                  {tr('Deficient / Low', 'Déficitaire / Faible', 'ناقص / منخفض')}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {tr('Optimal Agronomic Target Range', 'Plage Cible Optimale', 'النطاق المستهدف المثالي')}: {currentMeta.optimalMin} - {currentMeta.optimalMax} {currentMeta.unit}
                </span>
                <span className="text-muted-foreground">
                  {tr('Excessive / High', 'Excessif / Élevé', 'فائض / مرتفع')}
                </span>
              </div>

              {/* Color Bar */}
              <div
                className="h-3 w-full rounded-md shadow-2xs"
                style={{
                  background: `linear-gradient(to right, ${d3.range(0, 1.05, 0.1).map((t) => currentMeta.colorInterpolator(t)).join(', ')})`,
                }}
              />

              <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                <span>{Math.min(currentMeta.minRange, stats.min).toFixed(1)} {currentMeta.unit}</span>
                <span>{((currentMeta.minRange + currentMeta.maxRange) / 2).toFixed(1)}</span>
                <span>{Math.max(currentMeta.maxRange, stats.max).toFixed(1)} {currentMeta.unit}</span>
              </div>
            </div>
          </div>

          {/* Sidebar: Statistics, VRA Prescriptions & Selected Point Editor (4 Cols) */}
          <div className="lg:col-span-4 space-y-3">
            {/* Field Nutrient Statistical Summary */}
            <div className="rounded-xl border bg-card p-3.5 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  {tr('Spatial Statistics', 'Statistiques Spatiales', 'الإحصاء المكاني')}
                </h3>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  CV: {stats.cv.toFixed(1)}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-muted/40 p-2">
                  <span className="text-[10px] text-muted-foreground block">{tr('Field Mean', 'Moyenne', 'المتوسط')}</span>
                  <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {stats.mean.toFixed(1)} <span className="text-[10px] font-normal">{currentMeta.unit}</span>
                  </span>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <span className="text-[10px] text-muted-foreground block">{tr('Median', 'Médiane', 'الوسيط')}</span>
                  <span className="text-sm font-bold font-mono">
                    {stats.median.toFixed(1)} <span className="text-[10px] font-normal">{currentMeta.unit}</span>
                  </span>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <span className="text-[10px] text-muted-foreground block">{tr('Min Recorded', 'Minimum', 'أدنى قيمة')}</span>
                  <span className="text-xs font-semibold font-mono text-amber-600">
                    {stats.min.toFixed(1)} {currentMeta.unit}
                  </span>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <span className="text-[10px] text-muted-foreground block">{tr('Max Recorded', 'Maximum', 'أعلى قيمة')}</span>
                  <span className="text-xs font-semibold font-mono text-blue-600">
                    {stats.max.toFixed(1)} {currentMeta.unit}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {currentMeta.description[language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en']}
              </p>
            </div>

            {/* Variable Rate Application (VRA) Prescription Box */}
            <div
              className={`rounded-xl border p-3.5 shadow-2xs space-y-2 ${
                prescription.urgency === 'high'
                  ? 'border-rose-200 bg-rose-50/50 dark:border-rose-900/60 dark:bg-rose-950/20'
                  : prescription.urgency === 'medium'
                  ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20'
                  : 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Sprout className="h-3.5 w-3.5 text-emerald-600" />
                  {tr('Agronomic Prescription', 'Prescription Agronomique', 'التوصية السمادية الحقلية')}
                </span>
                <Badge
                  variant="secondary"
                  className={`text-[10px] uppercase font-bold ${
                    prescription.urgency === 'high'
                      ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                      : prescription.urgency === 'medium'
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {prescription.urgency}
                </Badge>
              </div>

              <p className="text-xs leading-relaxed text-foreground">
                {prescription.actionText[language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en']}
              </p>

              {prescription.rateKgHa > 0 && (
                <div className="pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">{tr('VRA Dosage Rate', 'Dose VRA', 'معدل الجرعة')}</span>
                    <span className="font-bold font-mono text-foreground">{prescription.rateKgHa} kg / Ha</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">{tr('Total Parcel Need', 'Besoin Total', 'إجمالي الاحتياج')}</span>
                    <span className="font-bold font-mono text-emerald-700 dark:text-emerald-300">{prescription.totalKg} kg</span>
                  </div>
                </div>
              )}
            </div>

            {/* Selected Sample Point Inspector & Live Editor */}
            {selectedSample ? (
              <div className="rounded-xl border border-sky-200/80 bg-sky-50/40 p-3.5 shadow-2xs dark:border-sky-900/60 dark:bg-sky-950/20 space-y-3">
                <div className="flex items-center justify-between border-b pb-2 border-sky-200 dark:border-sky-900">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-sky-600" />
                    <span className="font-bold text-xs text-foreground">
                      {tr('Inspect Point', 'Échantillon', 'فحص العينة')}: {selectedSample.id}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={deleteSelectedSample}
                    className="h-7 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950/50 p-1"
                    title={tr('Delete sample point', 'Supprimer le point', 'حذف النقطة')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-muted-foreground block">{tr('X Coord (%)', 'Coord X (%)', 'الإحداثي X (%)')}</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={selectedSample.x}
                      onChange={(e) => updateSelectedSampleCoords(Number(e.target.value), selectedSample.y)}
                      className="h-8 text-xs font-mono mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block">{tr('Y Coord (%)', 'Coord Y (%)', 'الإحداثي Y (%)')}</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={selectedSample.y}
                      onChange={(e) => updateSelectedSampleCoords(selectedSample.x, Number(e.target.value))}
                      className="h-8 text-xs font-mono mt-0.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground block">
                    {currentMeta.name[language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en']} ({currentMeta.unit})
                  </label>
                  <Input
                    type="number"
                    step={currentMeta.step}
                    value={selectedSample.values[activeNutrient]}
                    onChange={(e) => updateSelectedSampleValue(activeNutrient, Number(e.target.value))}
                    className="h-8 text-xs font-mono font-bold mt-0.5"
                  />
                </div>

                <div className="text-[10px] text-muted-foreground">
                  {tr(
                    'Values update in real-time. The D3 IDW surface recalculates immediately.',
                    'Les valeurs sont mises à jour en temps réel sur la surface D3.',
                    'يتم تحديث القيم وسطح الاستيفاء المكاني لـ D3 فوراً عند التعديل.'
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground space-y-1">
                <MapPin className="h-5 w-5 mx-auto text-muted-foreground/60" />
                <p className="font-semibold">{tr('Click any sample pin on the map to inspect or edit values.', 'Cliquez sur un point pour modifier ses valeurs.', 'انقر على أي نقطة عينة على الخريطة لتعديل قيمها.')}</p>
                <p className="text-[11px] opacity-80">{tr('Or toggle "Add Core Sample" to place new soil probes.', 'Ou activez "Ajouter" pour placer une nouvelle sonde.', 'أو فعّل "إضافة عينة" لوضع مجسات تربة جديدة.')}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
