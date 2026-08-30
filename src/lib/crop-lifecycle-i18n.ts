/**
 * Crop lifecycle stage internationalization — Arabic + French translations
 * for the 46 unique stage names and 93 unique stage descriptions across
 * 20 crops in CROP_LIFECYCLES.
 *
 * Usage:
 *   import { localizedStageName, localizedStageDescription } from './crop-lifecycle-i18n';
 *   const name = localizedStageName(stage.name, language);
 *   const desc = localizedStageDescription(stage.description, language);
 *
 * Falls back to the English string when no translation is found, so missing
 * translations never break the UI — they just show English.
 */

import type { Language } from './language-store';

// ===========================================================================
// Stage name translations (46 unique names)
// ===========================================================================

export const STAGE_NAME_I18N: Record<string, { ar: string; fr: string }> = {
  // Common stages
  'Establishment': { ar: 'التأسيس', fr: 'Installation' },
  'Vegetative': { ar: 'النمو الخضري', fr: 'Croissance végétative' },
  'Flowering': { ar: 'الإزهار', fr: 'Floraison' },
  'Maturation': { ar: 'النضج', fr: 'Maturation' },
  'Maturation/Harvest': { ar: 'النضج/الحصاد', fr: 'Maturation/Récolte' },
  'Harvest': { ar: 'الحصاد', fr: 'Récolte' },
  'Emergence': { ar: 'الظهور', fr: 'Levée' },
  'Ripening': { ar: 'النضج', fr: 'Maturation' },
  'Maturity': { ar: 'الاكتمال', fr: 'Maturité' },
  'Reproductive': { ar: 'التكاثري', fr: 'Reproductif' },

  // Cereal-specific
  'Tillering': { ar: 'التفرع', fr: 'Tallage' },
  'Stem Elongation': { ar: 'استطالة الساق', fr: 'Élongation de la tige' },
  'Heading/Flowering': { ar: 'الطرد/الإزهار', fr: 'Épiaison/Floraison' },
  'Boot/Flowering': { ar: 'السنبلة/الإزهار', fr: 'Gonflement/Floraison' },
  'Bud/Flowering': { ar: 'البرعم/الإزهار', fr: 'Bourgeon/Floraison' },
  'Grain Fill': { ar: 'امتلاء الحبوب', fr: 'Remplissage du grain' },
  'Grain Fill/Maturation': { ar: 'امتلاء الحبوب/النضج', fr: 'Remplissage/Maturation' },
  'Tasseling/Silking': { ar: 'طرود الحرير', fr: 'Floraison mâle/femelle' },
  'Nursery': { ar: 'المشتل', fr: 'Pépinière' },
  'Drainage/Harvest': { ar: 'التصريف/الحصاد', fr: 'Drainage/Récolte' },
  'Seed Fill': { ar: 'امتلاء البذور', fr: 'Remplissage des graines' },

  // Legume-specific
  'Pod Fill': { ar: 'امتلاء القرون', fr: 'Remplissage des gousses' },
  'Pod Fill/Maturation': { ar: 'امتلاء القرون/النضج', fr: 'Remplissage/Maturation' },

  // Tuber/root
  'Sprouting/Establishment': { ar: 'الإنبات/التأسيس', fr: 'Germination/Installation' },
  'Tuber Bulking': { ar: 'تكبير الدرنات', fr: 'Grossissement des tubercules' },
  'Bulbing': { ar: 'تكوين البصلة', fr: 'Bulbification' },
  'Curing': { ar: 'المعالجة', fr: 'Curing' },
  'Bolting/Bud': { ar: 'الإزهار الزهري/البرعم', fr: 'Montaison/Bourgeon' },
  'Bolting Risk': { ar: 'خطر الإزهار الزهري', fr: 'Risque de montaison' },
  'Rosette': { ar: 'الوردة', fr: 'Rosette' },

  // Fruit/flower
  'Bloom': { ar: 'التفتح', fr: 'Floraison' },
  'Bloom/Fruit Set': { ar: 'التفتح/العقد', fr: 'Floraison/Nouaison' },
  'Flower Initiation': { ar: 'بدء الإزهار', fr: 'Initiation florale' },
  'Flowering/Fruit Set': { ar: 'الإزهار/العقد', fr: 'Floraison/Nouaison' },
  'Fruit Set/Cell Division': { ar: 'العقد/انقسام الخلايا', fr: 'Nouaison/Division cellulaire' },
  'Fruit Set/Fill': { ar: 'العقد/الامتلاء', fr: 'Nouaison/Remplissage' },
  'Fruit Sizing': { ar: 'تكبير الثمار', fr: 'Grossissement des fruits' },
  'Fruit Fill': { ar: 'امتلاء الثمار', fr: 'Remplissage des fruits' },
  'Berry Development': { ar: 'تكوين البذور', fr: 'Développement des baies' },

  // Cotton
  'Boll Development': { ar: 'تكوين الجوزات', fr: 'Développement des capsules' },
  'Open Boll / Maturation': { ar: 'انفتاح الجوزة/النضج', fr: 'Capsule ouverte/Maturation' },

  // Tree/perennial
  'Dormancy/Bud Break': { ar: 'السكون/تفتح البرعم', fr: 'Dormance/Débourrement' },
  'Harvest/Dormancy': { ar: 'الحصاد/السكون', fr: 'Récolte/Dormance' },
  'Vegetative Flush': { ar: 'الدفع الخضري', fr: 'Pousse végétative' },
  'Production (Y1)': { ar: 'الإنتاج (س1)', fr: 'Production (A1)' },
  'Production (Y2+)': { ar: 'الإنتاج (س2+)', fr: 'Production (A2+)' },
};

// ===========================================================================
// Stage description translations (unique descriptions across all crops)
// ===========================================================================

export const STAGE_DESCRIPTION_I18N: Record<string, { ar: string; fr: string }> = {
  'Germination to 2-leaf stage': { ar: 'الإنبات حتى مرحلة الورقتين', fr: 'Germination à 2 feuilles' },
  'Stem elongation, leaf area expansion': { ar: 'استطالة الساق وتوسع المساحة الورقية', fr: 'Élongation de la tige, expansion foliaire' },
  'Flowering — critical pollination window': { ar: 'الإزهار — فترة التلقيح الحرجة', fr: 'Floraison — fenêtre critique de pollinisation' },
  'Kernels filling, dry matter accumulation': { ar: 'امتلاء الحبوب وتراكم المادة الجافة', fr: 'Remplissage des grains, accumulation de matière sèche' },
  'Black layer formation, drydown': { ar: 'تكوين الطبقة السوداء والجفاف', fr: 'Formation de la couche noire, séchage' },
  'Germination to 3-leaf stage': { ar: 'الإنبات حتى مرحلة 3 أوراق', fr: 'Germination à 3 feuilles' },
  'Germination to 3-leaf': { ar: 'الإنبات حتى 3 أوراق', fr: 'Germination à 3 feuilles' },
  'Crown root system + tiller development': { ar: 'تطور نظام الجذور التاجية والتفرعات', fr: 'Système racinaire couronne + tallage' },
  'Crown roots + tillers': { ar: 'الجذور التاجية والتفرعات', fr: 'Racines couronnes + talles' },
  'Node formation, internode elongation': { ar: 'تكوين العقد واستطالة السلاميات', fr: 'Formation des nœuds, élongation des entre-nœuds' },
  'Nodes + internode elongation': { ar: 'العقد واستطالة السلاميات', fr: 'Nœuds + élongation des entre-nœuds' },
  'Milk → dough → hard dough': { ar: 'لبنى ← عجينة ← عجينة صلبة', fr: 'Laitue → pâteuse → dure' },
  'Seedling growth in nursery bed': { ar: 'نمو البادرات في المشتل', fr: 'Croissance des semis en pépinière' },
  'Flowering → milk → dough → yellow ripeness': { ar: 'الإزهار ← لبنى ← عجينة ← نضج أصفر', fr: 'Floraison → lait → pâte → maturité jaune' },
  'Field drained, harvest moisture reached': { ar: 'تصريف الحقل والوصول لرطوبة الحصاد', fr: 'Drainage du champ, humidité de récolte atteinte' },
  'Germination to VC (unifoliate)': { ar: 'الإنبات حتى VC (ورقة أحادية)', fr: 'Germination à VC (unifoliée)' },
  'V1 to V6 — trifoliate leaves': { ar: 'V1 إلى V6 — أوراق ثلاثية', fr: 'V1 à V6 — feuilles trifoliées' },
  'R1 (beginning bloom) to R3 (beginning pod)': { ar: 'R1 (بداية الإزهار) إلى R3 (بداية القرن)', fr: 'R1 (début floraison) à R3 (début gousse)' },
  'R4 (full pod) to R6 (full seed)': { ar: 'R4 (قرن ممتلئ) إلى R6 (بذرة ممتلئة)', fr: 'R4 (gousse pleine) à R6 (graine pleine)' },
  'R7 (beginning maturity) to R8 (full maturity)': { ar: 'R7 (بداية النضج) إلى R8 (النضج الكامل)', fr: 'R7 (début maturité) à R8 (maturité pleine)' },
  'Emergence to 4-true-leaf': { ar: 'الظهور حتى 4 أوراق حقيقية', fr: 'Levée à 4 vraies feuilles' },
  'Stem + canopy growth, squares form': { ar: 'نمو الساق والمظلة وتكوين البراعم', fr: 'Croissance tige + couvert, formation des carrés' },
  'First bloom to peak bloom': { ar: 'أول إزهار حتى ذروة الإزهار', fr: 'Première fleur à floraison maximale' },
  'Boll fill + fiber elongation': { ar: 'امتلاء الجوزة واستطالة الألياف', fr: 'Remplissage des capsules + élongation des fibres' },
  'Bolls crack open, defoliation, harvest': { ar: 'انفتاح الجوزات وتساقط الأوراق والحصاد', fr: 'Capsules ouvertes, défoliation, récolte' },
  'Emergence to 4-leaf': { ar: 'الظهور حتى 4 أوراق', fr: 'Levée à 4 feuilles' },
  'Emergence to 5-leaf': { ar: 'الظهور حتى 5 أوراق', fr: 'Levée à 5 feuilles' },
  'Vine growth + early flower trusses': { ar: 'نمو الكرمة وعناقيد الزهور المبكرة', fr: 'Croissance de la vigne + premières grappes florales' },
  'Vine growth + first flowers': { ar: 'نمو الكرمة وأول الأزهار', fr: 'Croissance vigne + premières fleurs' },
  'Transplant recovery to first flower': { ar: 'تعافي الشتلة حتى أول زهرة', fr: 'Reprise du repiquage à la première fleur' },
  'Transplant shock recovery to first flower': { ar: 'تعافي الشتلة من الصدمة حتى أول زهرة', fr: 'Reprise du repiquage à la première fleur' },
  'Transplant recovery + first new leaves': { ar: 'تعافي الشتلة وأول أوراق جديدة', fr: 'Reprise du repiquage + premières feuilles' },
  'Full flowering on multiple trusses': { ar: 'إزهار كامل على عناقيد متعددة', fr: 'Floraison pleine sur plusieurs grappes' },
  'Continuous flowering + fruit set': { ar: 'إزهار مستمر وعقد الثمار', fr: 'Floraison continue + nouaison' },
  'Continuous flowering + early fruit': { ar: 'إزهار مستمر وثمار مبكرة', fr: 'Floraison continue + fruits précoces' },
  'Fruit set + early cell division (determines final size)': { ar: 'العقد وانقسام الخلايا المبكر (يحدد الحجم النهائي)', fr: 'Nouaison + premières divisions cellulaires (détermine la taille finale)' },
  'Fruit sizing + color break': { ar: 'تكبير الثمار وتغير اللون', fr: 'Grossissement des fruits + virage de couleur' },
  'Multiple fruit sizing + color break': { ar: 'تكبير ثمار متعددة وتغير اللون', fr: 'Grossissement multiple + virage de couleur' },
  'Continuous harvest (every 1–2 days)': { ar: 'حصاد مستمر (كل 1–2 يوم)', fr: 'Récolte continue (tous les 1–2 jours)' },
  'Multiple hand-picks': { ar: 'قطاف يدوي متعدد', fr: 'Cueillette manuelle multiple' },
  'Multiple hand-picks at color stages': { ar: 'قطاف يدوي متعدد عند مراحل اللون', fr: 'Cueillette manuelle selon stades de couleur' },
  'Quality declines rapidly if not harvested': { ar: 'تتدهور الجودة بسرعة إن لم تُحصد', fr: 'La qualité chute rapidement si non récolté' },
  'Emergence to 20% canopy': { ar: 'الظهور حتى 20% مظلة', fr: 'Levée à 20% de couvert' },
  'Canopy expansion, tuber initiation': { ar: 'توسع المظلة وبدء تكوين الدرنات', fr: 'Expansion du couvert, initiation des tubercules' },
  'Tuber dry matter accumulation': { ar: 'تراكم المادة الجافة في الدرنات', fr: 'Accumulation de matière sèche des tubercules' },
  'Vine senescence, skin set': { ar: 'شيخوخة الكرمة وتكون القشرة', fr: 'Sénescence des fanes, durcissement de la peau' },
  'Head/leaf formation': { ar: 'تكوين الرأس/الأوراق', fr: 'Formation des pommes/feuilles' },
  'Harvest window (firm heads)': { ar: 'فترة الحصاد (رؤوس صلبة)', fr: 'Fenêtre de récolte (pomme ferme)' },
  'Bulb initiation + leaf growth': { ar: 'بدء تكوين البصلة ونمو الأوراق', fr: 'Initiation du bulbe + croissance des feuilles' },
  'Bulb enlargement — photoperiod-triggered': { ar: 'تكبير البصلة — يحفزه طول النهار', fr: 'Grossissement du bulbe — déclenché par la photopériode' },
  'Top fall + neck softening + harvest': { ar: 'انحناء القمم وليونة العنق والحصاد', fr: 'Verse des fanes + ramollissement du col + récolte' },
  'Seedling to first cut': { ar: 'من البادرة حتى أول حشة', fr: 'Du semis à la première coupe' },
  'First-season cuts (4–5 cuts)': { ar: 'حشات الموسم الأول (4–5 حشات)', fr: 'Coupes de la 1ère année (4–5 coupes)' },
  'Mature stand — peak production years 2–4': { ar: 'موقف ناضج — ذروة الإنتاج سنوات 2–4', fr: 'Peuplement adulte — production maximale années 2–4' },
  'Shoot growth + leaf development': { ar: 'نمو الأفرع وتطور الأوراق', fr: 'Croissance des pousses + développement des feuilles' },
  'Flower buds form after rain trigger': { ar: 'تكون براعم الزهور بعد تحفيز المطر', fr: 'Formation des boutons floraux après pluies déclenchantes' },
  'Mass flowering after first rains': { ar: 'إزهار كثيف بعد أول الأمطار', fr: 'Floraison massive après les premières pluies' },
  'Pinhead → expansion → ripening': { ar: 'دبوس ← تضخم ← نضج', fr: 'Épingle → expansion → maturation' },
  'Selective picking of ripe cherries': { ar: 'قطف انتقائي للكرز الناضج', fr: 'Cueillette sélective des cerises mûres' },
  'Winter dormancy → bud swell → green tip': { ar: 'سكون شتوي ← انتفاخ البرعم ← الطرف الأخضر', fr: 'Dormance hivernale → gonflement des bourgeons → pointe verte' },
  'Dormancy → green tip → pink': { ar: 'سكون ← طرف أخضر ← وردي', fr: 'Dormance → pointe verte → rose' },
  'Spring flush + root growth': { ar: 'دفع ربيعي ونمو الجذور', fr: 'Pousse printanière + croissance racinaire' },
  'Full bloom — pollination window': { ar: 'إزهار كامل — فترة التلقيح', fr: 'Pleine floraison — fenêtre de pollinisation' },
  'Cell expansion + juice sac development': { ar: 'توسع الخلايا وتطور أكياس العصير', fr: 'Expansion cellulaire + développement des sacs de jus' },
  'Color break + sugar + acid balance': { ar: 'تغير اللون وتوازن السكر والحموضة', fr: 'Virage de couleur + équilibre sucre/acidité' },
  'Leaf flush + branch growth (post-harvest)': { ar: 'دفع ورقي ونمو الأفرع (بعد الحصاد)', fr: 'Pousse foliaire + croissance des branches (post-récolte)' },
  'Harvest + winter semi-dormancy': { ar: 'الحصاد وشبه سكون شتوي', fr: 'Récolte + semi-dormance hivernale' },
  'Rosette growth + winter vernalization': { ar: 'نمو الوردة وتنشيط شتوي', fr: 'Croissance en rosette + vernalisation hivernale' },
  'Stem elongation + bud formation': { ar: 'استطالة الساق وتكوين البرعم', fr: 'Élongation de la tige + formation du bouton' },
  'Stem elongation + flag leaf': { ar: 'استطالة الساق والورقة العلم', fr: 'Élongation de la tige + feuille étendard' },
  'Stem elongation + head formation': { ar: 'استطالة الساق وتكوين القرص', fr: 'Élongation de la tige + formation du capitule' },
  'Bud visible + ray florets open': { ar: 'برعم مرئي وتفتح الأزهار الشعاعية', fr: 'Bouton visible + fleurs ligulées ouvertes' },
  'Yellow bloom — 14–21 day window': { ar: 'إزهار أصفر — فترة 14–21 يوم', fr: 'Floraison jaune — fenêtre de 14–21 jours' },
  'Seed fill + ripening': { ar: 'امتلاء البذور والنضج', fr: 'Remplissage des graines + maturation' },
  'Back of head yellow → brown': { ar: 'ظهر القرص أصفر ← بني', fr: 'Dos du capitule jaune → marron' },
  'Black layer': { ar: 'الطبقة السوداء', fr: 'Couche noire' },
  'Bud visible + early leaf flush': { ar: 'برعم مرئي ودفع ورقي مبكر', fr: 'Bourgeon visible + première pousse foliaire' },
  'Bloom + fruit set + physiological drop': { ar: 'إزهار + عقد + تساقط فسيولوجي', fr: 'Floraison + nouaison + chute physiologique' },
  'Fruit sizing + cell expansion': { ar: 'تكبير الثمار وتوسع الخلايا', fr: 'Grossissement des fruits + expansion cellulaire' },
  'Color break + juice + sugar accumulation': { ar: 'تغير اللون وتراكم العصير والسكر', fr: 'Virage de couleur + jus + accumulation de sucre' },
  'Veraison → sugar accumulation': { ar: 'بدء النضج ← تراكم السكر', fr: 'Véraison → accumulation de sucre' },
  'Slow early growth — critical weed window': { ar: 'نمو مبكر بطيء — فترة حرجة لمكافحة الأعشاب', fr: 'Croissance lente précoce — fenêtre critique de désherbage' },
  'Boot + heading + flowering': { ar: 'سنبلة + طرد + إزهار', fr: 'Gonflement + épiaison + floraison' },
  'Soft dough → hard dough': { ar: 'عجينة طرية ← عجينة صلبة', fr: 'Pâte molle → pâte dure' },
  'Milk → dough → harvest': { ar: 'لبنى ← عجينة ← حصاد', fr: 'Lait → pâte → récolte' },
  'Canopy + early flower set': { ar: 'مظلة وعقد زهري مبكر', fr: 'Couvert + nouaison précoce' },
  'Bud break + shoot growth': { ar: 'تفتح البرعم ونمو الأفرع', fr: 'Débourrement + croissance des pousses' },
  'Flowering + berry set': { ar: 'الإزهار وعقد البذور', fr: 'Floraison + nouaison des baies' },
  'Color + flavor + tannin development': { ar: 'تطور اللون والنكهة والعفص', fr: 'Développement couleur + saveur + tanins' },

  // Previously missing — added during QA
  'Ear emergence + anthesis': { ar: 'ظهور السنبلة والتأبير', fr: 'Émergence de l\'épi + anthèse' },
  'Panicle init to heading': { ar: 'بدء السنابل حتى الطرد', fr: 'Initiation paniculaire à l\'épiaison' },
  'Transplanting to panicle initiation': { ar: 'الزراعة حتى بدء السنابل', fr: 'Repiquage à l\'initiation paniculaire' },
  'Ripening to harvest moisture': { ar: 'النضج حتى رطوبة الحصاد', fr: 'Maturation jusqu\'à l\'humidité de récolte' },
  'Cell expansion + sugar accumulation': { ar: 'توسع الخلايا وتراكم السكر', fr: 'Expansion cellulaire + accumulation de sucre' },
  'Color development + starch conversion': { ar: 'تطور اللون وتحويل النشا', fr: 'Développement de la couleur + conversion de l\'amidon' },
  'Emergence to 2-true-leaf': { ar: 'الظهور حتى ورقتين حقيقيتين', fr: 'Levée à 2 vraies feuilles' },
  'OIL + protein accumulation': { ar: 'تراكم الزيت والبروتين', fr: 'Accumulation d\'huile + protéines' },
  'Pod fill + ripening': { ar: 'امتلاء القرون والنضج', fr: 'Remplissage des gousses + maturation' },
};

// ===========================================================================
// Helper functions
// ===========================================================================

/**
 * Returns the stage name in the requested language, falling back to the
 * English name if no translation is available.
 */
export function localizedStageName(name: string, language: Language): string {
  if (language === 'en') return name;
  const t = STAGE_NAME_I18N[name];
  return t ? t[language] : name;
}

/**
 * Returns the stage description in the requested language, falling back to
 * the English description if no translation is available.
 */
export function localizedStageDescription(description: string, language: Language): string {
  if (language === 'en') return description;
  const t = STAGE_DESCRIPTION_I18N[description];
  return t ? t[language] : description;
}

/**
 * Returns the crop name in the requested language. Falls back to the
 * `crop-localization` module's `localizedCropName` if available, else
 * the English name.
 *
 * (Re-exported here for convenience — the canonical implementation lives
 * in `src/lib/crop-localization.ts`.)
 */
export { localizedCropName } from './crop-localization';
