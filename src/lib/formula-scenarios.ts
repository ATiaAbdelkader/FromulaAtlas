/**
 * Scenario-based formula categorization — replaces the textbook-style
 * Part/Chapter hierarchy with problem-driven scenario groups.
 *
 * Instead of "Part XVIII: Irrigation Engineering" (academic), users see
 * "Manage My Water" (action-oriented). Each scenario maps to one or more
 * Parts from the original handbook, plus optional formula-code prefixes
 * for finer-grained inclusion.
 *
 * The mapping is deliberately many-to-one: a Part can appear in multiple
 * scenarios (e.g. "Soil & Crop Science" appears in both "Test My Soil"
 * and "Plan My Crop"). This gives users multiple discovery paths.
 */

export interface FormulaScenario {
  id: string;
  title: string;
  title_ar: string;
  title_fr: string;
  emoji: string;
  subtitle: string;
  subtitle_ar: string;
  subtitle_fr: string;
  /** Gradient for the card background */
  gradient: string;
  /** Solid color for accents */
  color: string;
  /** Part titles that belong to this scenario */
  parts: string[];
  /** Optional: formula code prefixes for finer inclusion (e.g. IRR-) */
  codePrefixes?: string[];
  /** Optional: keywords to match against formula name/purpose */
  keywords?: string[];
}

export const FORMULA_SCENARIOS: FormulaScenario[] = [
  {
    id: 'crop-planning',
    title: 'Plan My Crop',
    title_ar: 'خطّط محصولي',
    title_fr: 'Planifier ma culture',
    emoji: '🌱',
    subtitle: 'Planting density · Growth stages · Phenology · GDD',
    subtitle_ar: 'كثافة الزراعة · مراحل النمو · الفينولوجيا · درجات النمو الحرارية',
    subtitle_fr: 'Densité de plantation · Stades de croissance · Phénologie · Degrés-jours',
    gradient: 'from-emerald-500 to-green-700',
    color: '#16a34a',
    parts: [
      'Crop Production Formulas',
      'Advanced Crop Science',
      'Plant Breeding & Genetics',
    ],
    keywords: ['plant population', 'planting', 'growth', 'phenology', 'degree day', 'crop', 'seed', 'germination'],
  },
  {
    id: 'water-management',
    title: 'Manage My Water',
    title_ar: 'أدر مائي',
    title_fr: 'Gérer mon eau',
    emoji: '💧',
    subtitle: 'ET₀ · Kc · Irrigation scheduling · System design · Water harvesting',
    subtitle_ar: 'ET₀ · Kc · جدولة الري · تصميم النظام · حصاد المياه',
    subtitle_fr: 'ET₀ · Kc · Calendrier d’irrigation · Conception du système · Collecte de l’eau',
    gradient: 'from-cyan-500 to-blue-700',
    color: '#0891b2',
    parts: [
      'Irrigation Engineering',
      'Water Harvesting',
      'Water Quality (Advanced)',
    ],
    codePrefixes: ['IRR-'],
    keywords: ['irrigation', 'water', 'et', 'evapotranspiration', 'drip', 'sprinkler', 'pump', 'flow'],
  },
  {
    id: 'soil-health',
    title: 'Test My Soil',
    title_ar: 'افحص تربتي',
    title_fr: 'Analyser mon sol',
    emoji: '🧪',
    subtitle: 'pH · CEC · NPK · Organic matter · Soil physics · Erosion',
    subtitle_ar: 'pH · CEC · NPK · مادة عضوية · فيزياء التربة · التعرّف',
    subtitle_fr: 'pH · CEC · NPK · Matière organique · Physique du sol · Érosion',
    gradient: 'from-amber-500 to-orange-700',
    color: '#d97706',
    parts: [
      'Soil & Crop Science — Advanced Topics',
      'Advanced Soil Physics',
      'Soil Erosion',
    ],
    keywords: ['soil', 'ph', 'cec', 'organic matter', 'bulk density', 'texture', 'erosion', 'compaction'],
  },
  {
    id: 'plant-protection',
    title: 'Protect My Plants',
    title_ar: 'احمِ نباتاتي',
    title_fr: 'Protéger mes plantes',
    emoji: '🛡️',
    subtitle: 'Pest thresholds · Disease forecasting · Weed science · Spray timing',
    subtitle_ar: 'عتبات الآفات · التنبؤ بالأمراض · علم الأعشاب · توقيت الرش',
    subtitle_fr: 'Seuils de ravageurs · Prévision des maladies · Adventices · Moment du traitement',
    gradient: 'from-red-500 to-rose-700',
    color: '#dc2626',
    parts: [
      'Weed Science',
      'Plant Pathology Forecasting',
    ],
    keywords: ['pest', 'disease', 'weed', 'spray', 'threshold', 'eil', 'pesticide', 'pathogen', 'infection'],
  },
  {
    id: 'yield-harvest',
    title: 'Estimate My Yield',
    title_ar: 'قدّر إنتاجي',
    title_fr: 'Estimer mon rendement',
    emoji: '📊',
    subtitle: 'Yield prediction · Harvest timing · Post-harvest storage · Quality',
    subtitle_ar: 'التنبؤ بالإنتاج · توقيت الحصاد · التخزين بعد الحصاد · الجودة',
    subtitle_fr: 'Prévision du rendement · Date de récolte · Stockage après récolte · Qualité',
    gradient: 'from-lime-500 to-green-700',
    color: '#65a30d',
    parts: [
      'Post-Harvest Science',
      'Fodder Conservation',
    ],
    keywords: ['yield', 'harvest', 'storage', 'dry matter', 'quality', 'moisture', 'grain'],
  },
  {
    id: 'livestock',
    title: 'Feed My Animals',
    title_ar: 'غذّ حيواناتي',
    title_fr: 'Nourrir mes animaux',
    emoji: '🐄',
    subtitle: 'Nutrition · Rations · Growth · Reproduction · Aquaculture · Beekeeping',
    subtitle_ar: 'التغذية · العلائق · النمو · التناسل · الاستزراع المائي · النحل',
    subtitle_fr: 'Nutrition · Rations · Croissance · Reproduction · Aquaculture · Apiculture',
    gradient: 'from-orange-500 to-amber-700',
    color: '#ea580c',
    parts: [
      'Animal Production Formulas',
      'Advanced Animal Science',
      'Animal Science — Specialist Topics',
      'Animal Feed Science (Advanced)',
      'Aquaculture & Fish Farming',
      'Advanced Beekeeping',
      'Livestock Housing',
    ],
    keywords: ['animal', 'livestock', 'feed', 'ration', 'cattle', 'poultry', 'fish', 'bee', 'milk', 'weight', 'reproduction'],
  },
  {
    id: 'farm-economics',
    title: 'Run My Business',
    title_ar: 'أدر عملي',
    title_fr: 'Gérer mon exploitation',
    emoji: '💰',
    subtitle: 'Costs · Revenue · ROI · Break-even · Scenarios · Precision ag',
    subtitle_ar: 'التكاليف · الإيرادات · العائد · التعادل · السيناريوهات · الزراعة الدقيقة',
    subtitle_fr: 'Coûts · Revenus · ROI · Seuil de rentabilité · Scénarios · Agriculture de précision',
    gradient: 'from-violet-500 to-purple-700',
    color: '#7c3aed',
    parts: [
      'Sustainability & Farm Economics',
      'Advanced Farm Economics',
      'Advanced Farm Economics & Policy',
      'Digital Agriculture & Technology',
      'Precision Agriculture',
      'Technology, Traceability & Automation',
    ],
    keywords: ['cost', 'revenue', 'profit', 'roi', 'break-even', 'margin', 'economic', 'investment', 'precision'],
  },
  {
    id: 'sustainability',
    title: 'Score My Sustainability',
    title_ar: 'قيّس استدامتي',
    title_fr: 'Évaluer ma durabilité',
    emoji: '🌿',
    subtitle: 'Carbon · Water productivity · NUE · Climate-smart · Agroforestry · Bioenergy',
    subtitle_ar: 'الكربون · إنتاجية الماء · كفاءة النيتروجين · المناخ · الحراج الزراعي · الطاقة الحيوية',
    subtitle_fr: 'Carbone · Productivité de l’eau · EUN · Climat · Agroforesterie · Bioénergie',
    gradient: 'from-teal-500 to-emerald-700',
    color: '#14b8a6',
    parts: [
      'Carbon Farming',
      'Climate-Smart Agriculture',
      'Agroforestry',
      'Bioenergy',
      'Organic Certification & Standards',
      'Agricultural Waste Management',
      'Agricultural Meteorology',
      'On-Farm Research & Trials',
      'Composting',
      'Greenhouse Engineering',
      'Visual Guides, Decision Tools & Global Content',
      'Trusted-Reference Formulas (FAO-56, USDA-NRCS, ASABE, IPCC, NRC)',
    ],
    keywords: ['carbon', 'sustainability', 'climate', 'emission', 'greenhouse', 'energy', 'organic', 'compost', 'waste', 'meteorology'],
  },
];

/**
 * Returns the scenario IDs that a formula belongs to.
 * A formula can belong to multiple scenarios (e.g. an irrigation
 * formula that also affects sustainability).
 */
export function getFormulaScenarios(formula: {
  part: string;
  code: string;
  name: string;
  purpose?: string;
}): string[] {
  const scenarios: string[] = [];
  const haystack = `${formula.name} ${formula.purpose || ''}`.toLowerCase();

  for (const scenario of FORMULA_SCENARIOS) {
    // Match by part title
    if (scenario.parts.includes(formula.part)) {
      scenarios.push(scenario.id);
      continue;
    }
    // Match by code prefix
    if (scenario.codePrefixes) {
      for (const prefix of scenario.codePrefixes) {
        if (formula.code.startsWith(prefix)) {
          scenarios.push(scenario.id);
          break;
        }
      }
      if (scenarios.includes(scenario.id)) continue;
    }
    // Match by keyword (fallback for formulas whose part isn't mapped)
    if (scenario.keywords) {
      for (const kw of scenario.keywords) {
        if (haystack.includes(kw)) {
          scenarios.push(scenario.id);
          break;
        }
      }
    }
  }

  // If no scenario matched, assign to the closest by part name
  if (scenarios.length === 0) {
    // Fallback: try to match by part name keywords
    const partLower = formula.part.toLowerCase();
    if (partLower.includes('animal') || partLower.includes('livestock')) {
      scenarios.push('livestock');
    } else if (partLower.includes('irrigation') || partLower.includes('water')) {
      scenarios.push('water-management');
    } else if (partLower.includes('soil')) {
      scenarios.push('soil-health');
    } else if (partLower.includes('economic') || partLower.includes('farm')) {
      scenarios.push('farm-economics');
    } else {
      scenarios.push('crop-planning'); // ultimate fallback
    }
  }

  return scenarios;
}

/**
 * Returns the primary (first) scenario for a formula — used for
 * card color coding.
 */
export function getPrimaryScenario(formula: {
  part: string;
  code: string;
  name: string;
  purpose?: string;
}): FormulaScenario {
  const ids = getFormulaScenarios(formula);
  return FORMULA_SCENARIOS.find(s => s.id === ids[0]) ?? FORMULA_SCENARIOS[0];
}

/**
 * Returns all formulas that belong to a given scenario ID.
 */
export function getFormulasByScenario(
  scenarioId: string,
  allFormulas: Array<{ part: string; code: string; name: string; purpose?: string }>,
): typeof allFormulas {
  return allFormulas.filter(f => getFormulaScenarios(f).includes(scenarioId));
}

/**
 * Returns the count of formulas per scenario — for display on
 * the scenario hub cards.
 */
export function getScenarioCounts(
  allFormulas: Array<{ part: string; code: string; name: string; purpose?: string }>,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of FORMULA_SCENARIOS) counts[s.id] = 0;
  for (const f of allFormulas) {
    const ids = getFormulaScenarios(f);
    for (const id of ids) {
      if (id in counts) counts[id]++;
    }
  }
  return counts;
}
