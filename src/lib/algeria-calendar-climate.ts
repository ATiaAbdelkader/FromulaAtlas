/**
 * Algeria Agro-Climatic & Seasonal Insights Data for the 12-Month Crop Calendar.
 * Covers 3 main agro-ecological zones:
 * - Zone 1: Littoral & Plaines (Tellian North: Mitidja, Sahel, Chéliff, Habra, Annaba)
 * - Zone 2: Hauts Plateaux (Steppic / Semi-arid: Sétif, Tiaret, Bordj Bou Arreridj, Batna, Saïda)
 * - Zone 3: Sahara & Oasis (Arid / Irrigated: Biskra, El Oued, Ouargla, Ghardaïa, Adrar)
 */

export interface AlgeriaZoneClimate {
  zoneName: { en: string; fr: string; ar: string };
  tempRange: string;
  avgET0: number; // mm/day
  avgRainfall: number; // mm/month
  frostRisk: 'none' | 'low' | 'moderate' | 'high';
  heatRisk: 'none' | 'low' | 'moderate' | 'high';
  keyAdvisory: { en: string; fr: string; ar: string };
}

export interface AlgeriaMonthInsight {
  month: number;
  season: 'winter' | 'spring' | 'summer' | 'autumn';
  seasonName: { en: string; fr: string; ar: string };
  solarRadiationAvg: string;
  daylightHours: string;
  zones: {
    littoral: AlgeriaZoneClimate;
    plateaus: AlgeriaZoneClimate;
    sahara: AlgeriaZoneClimate;
  };
  generalAdvisory: { en: string; fr: string; ar: string };
  criticalMilestones: { en: string; fr: string; ar: string }[];
}

export const ALGERIA_MONTH_CLIMATE: Record<number, AlgeriaMonthInsight> = {
  1: {
    month: 1,
    season: 'winter',
    seasonName: { en: 'Winter', fr: 'Hiver', ar: 'الشتاء' },
    solarRadiationAvg: '10.2 MJ/m²/day',
    daylightHours: '9.8 h',
    zones: {
      littoral: {
        zoneName: { en: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', fr: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', ar: 'التل والساحل (متيجة، الشلف، الساحل)' },
        tempRange: '6°C – 15°C',
        avgET0: 1.4,
        avgRainfall: 85,
        frostRisk: 'low',
        heatRisk: 'none',
        keyAdvisory: {
          en: 'Monitor early weeds in cereals; weed control at tillering. Prune deciduous orchards.',
          fr: 'Désherbage précoce des céréales au tallage. Poursuivre la taille des arbres fruitiers.',
          ar: 'مكافحة الأعشاب الضارة في الحبوب عند التفريع. مواصلة تقليم الأشجار المثمرة نفضية الأوراق.',
        },
      },
      plateaus: {
        zoneName: { en: 'High Plateaus (Sétif, Tiaret, Batna)', fr: 'Hauts Plateaux (Sétif, Tiaret, Batna)', ar: 'الهضاب العليا (سطيف، تيارت، باتنة)' },
        tempRange: '-1°C – 9°C',
        avgET0: 1.1,
        avgRainfall: 45,
        frostRisk: 'high',
        heatRisk: 'none',
        keyAdvisory: {
          en: 'High black frost risk. Drain standing water; protect young seedlings and greenhouse structures.',
          fr: 'Fort risque de gelée blanche/noire. Évacuer les eaux stagnantes et protéger les pépinières.',
          ar: 'خطر مرتفع للصقيع. تصريف المياه الراكدة وحماية الشتلات والبيوت المحمية.',
        },
      },
      sahara: {
        zoneName: { en: 'Sahara & Oasis (Biskra, El Oued, Adrar)', fr: 'Sahara & Oasis (Biskra, El Oued, Adrar)', ar: 'الصحراء والواحات (بسكرة، الوادي، أدرار)' },
        tempRange: '7°C – 19°C',
        avgET0: 2.8,
        avgRainfall: 10,
        frostRisk: 'low',
        heatRisk: 'none',
        keyAdvisory: {
          en: 'Peak greenhouse vegetable production (tomato, pepper). Regular pivot irrigation for desert wheat.',
          fr: 'Plein boom des primeurs sous serre (tomate, poivron). Irrigation pivot continue du blé.',
          ar: 'ذروة إنتاج البواكير تحت البيوت البلاستيكية (طماطم، فلفل). انتظام الري المحوري لقمح الصحراء.',
        },
      },
    },
    generalAdvisory: {
      en: 'Focus on winter weed control, tillering nitrogen top-dressing (Urea 46%), and dormant tree spraying.',
      fr: 'Priorité au désherbage d’hiver, apport d’azote au tallage (Urée 46%) et traitements d’hiver des vergers.',
      ar: 'التركيز على مكافحة أعشاب الشتاء، نثر سماد الآزوت عند التفريع (يوريا 46%)، والمعالجة الشتوية للأشجار.',
    },
    criticalMilestones: [
      { en: 'Cereal tillering stage nitrogen application (1–2 q/ha 46% Urea)', fr: 'Apport azoté tallage céréales (1–2 q/ha Urée 46%)', ar: 'تسميد الآزوت لمرحلة تفريع الحبوب (1-2 ق/هكتار يوريا 46%)' },
      { en: 'Winter orchard pruning & copper-based sanitizing spray', fr: 'Taille d’hiver et traitement cuivrique d’assainissement', ar: 'تقليم الأشجار الشتوي والرش بالنحاس للتطهير' },
      { en: 'Early potato & fava bean emergence monitoring', fr: 'Suivi de la levée des pommes de terre primeurs et fèves', ar: 'متابعة بزوغ البطاطا المبكرة والفول' },
    ],
  },
  2: {
    month: 2,
    season: 'winter',
    seasonName: { en: 'Winter', fr: 'Hiver', ar: 'الشتاء' },
    solarRadiationAvg: '13.1 MJ/m²/day',
    daylightHours: '10.8 h',
    zones: {
      littoral: {
        zoneName: { en: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', fr: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', ar: 'التل والساحل (متيجة، الشلف، الساحل)' },
        tempRange: '7°C – 16°C',
        avgET0: 1.9,
        avgRainfall: 70,
        frostRisk: 'low',
        heatRisk: 'none',
        keyAdvisory: {
          en: 'Sow spring chickpeas and lentils. Start spring potato planting.',
          fr: 'Semis des pois chiches et lentilles de printemps. Démarrage plantation pomme de terre de saison.',
          ar: 'بذر الحمص والعدس الربيعي. بداية غرس بطاطا الموسم.',
        },
      },
      plateaus: {
        zoneName: { en: 'High Plateaus (Sétif, Tiaret, Batna)', fr: 'Hauts Plateaux (Sétif, Tiaret, Batna)', ar: 'الهضاب العليا (سطيف، تيارت، باتنة)' },
        tempRange: '0°C – 11°C',
        avgET0: 1.6,
        avgRainfall: 40,
        frostRisk: 'high',
        heatRisk: 'none',
        keyAdvisory: {
          en: 'Finish cereal nitrogen top-dressing as vegetative growth resumes. Guard against late winter cold snaps.',
          fr: 'Compléter l’engrais de couverture sur céréales à la reprise. Vigilance gelées tardives.',
          ar: 'إتمام سماد التغطية للحبوب مع استئناف النمو الخضري. الحذر من موجات الصقيع المتأخرة.',
        },
      },
      sahara: {
        zoneName: { en: 'Sahara & Oasis (Biskra, El Oued, Adrar)', fr: 'Sahara & Oasis (Biskra, El Oued, Adrar)', ar: 'الصحراء والواحات (بسكرة، الوادي، أدرار)' },
        tempRange: '9°C – 22°C',
        avgET0: 3.8,
        avgRainfall: 5,
        frostRisk: 'none',
        heatRisk: 'none',
        keyAdvisory: {
          en: 'Wheat heading stage — maximize supplementary irrigation. Clean date palm crowns.',
          fr: 'Épiaison des blés sahariens — optimiser l’irrigation. Nettoyage de la couronne des palmiers.',
          ar: 'طرد سنابل القمح الصحراوي — تكثيف الري التكميلي. تنظيف تيجان نخيل التمر.',
        },
      },
    },
    generalAdvisory: {
      en: 'Transition from winter dormancy: spring pulse sowing, potato planting, and fungicide preparation.',
      fr: 'Reprise végétative : semis des légumineuses de printemps, plantation pomme de terre et veille cryptogamique.',
      ar: 'استئناف النشاط النباتي: زراعة البقوليات الربيعية، غرس البطاطا واليقظة ضد الأمراض الفطرية.',
    },
    criticalMilestones: [
      { en: 'Spring chickpea & fava bean sowings', fr: 'Semis des pois chiches et fèves de printemps', ar: 'بذر الحمص وفول الربيع' },
      { en: 'Stem elongation nitrogen split for wheat and barley', fr: 'Fractionnement azoté montaison blé et orge', ar: 'الدفعة الثانية لآزوت مرحلة الاستطالة للقمح والشعير' },
      { en: 'Bud break preparation in vineyards & stone fruits', fr: 'Débourrement vigne et rosacées fruitières', ar: 'انتفاخ البراعم في الكروم والأشجار المثمرة' },
    ],
  },
  3: {
    month: 3,
    season: 'spring',
    seasonName: { en: 'Spring', fr: 'Printemps', ar: 'الربيع' },
    solarRadiationAvg: '17.4 MJ/m²/day',
    daylightHours: '12.0 h',
    zones: {
      littoral: {
        zoneName: { en: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', fr: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', ar: 'التل والساحل (متيجة، الشلف، الساحل)' },
        tempRange: '9°C – 19°C',
        avgET0: 2.7,
        avgRainfall: 55,
        frostRisk: 'none',
        heatRisk: 'none',
        keyAdvisory: {
          en: 'Downy mildew & rust vigilance. Active pollination of citrus and fruit trees.',
          fr: 'Vigilance mildiou et rouilles. Pleine floraison des agrumes et vergers.',
          ar: 'اليقظة ضد البياض الزغبي والصدأ. ذروة إزهار الحمضيات والأشجار المثمرة.',
        },
      },
      plateaus: {
        zoneName: { en: 'High Plateaus (Sétif, Tiaret, Batna)', fr: 'Hauts Plateaux (Sétif, Tiaret, Batna)', ar: 'الهضاب العليا (سطيف، تيارت، باتنة)' },
        tempRange: '3°C – 15°C',
        avgET0: 2.3,
        avgRainfall: 38,
        frostRisk: 'moderate',
        heatRisk: 'none',
        keyAdvisory: {
          en: 'Watch for spring frost on blooming almond and apricot trees. Herbicide application in cereals.',
          fr: 'Risque de gelée printanière sur fleurs d’amandier/abricotier. Désherbage céréales.',
          ar: 'خطر الصقيع الربيعي على أزهار اللوز والمشمش. مكافحة الأعشاب في حقول الحبوب.',
        },
      },
      sahara: {
        zoneName: { en: 'Sahara & Oasis (Biskra, El Oued, Adrar)', fr: 'Sahara & Oasis (Biskra, El Oued, Adrar)', ar: 'الصحراء والواحات (بسكرة، الوادي، أدرار)' },
        tempRange: '13°C – 26°C',
        avgET0: 5.2,
        avgRainfall: 4,
        frostRisk: 'none',
        heatRisk: 'low',
        keyAdvisory: {
          en: 'Date palm pollination (Dokkar). Harvest of early desert potatoes in El Oued.',
          fr: 'Pollinisation du palmier dattier (Dokkar). Récolte de la pomme de terre primeur à El Oued.',
          ar: 'تلقيح نخيل التمر (الذكار). حصاد وتقليع البطاطا المبكرة بوادي سوف.',
        },
      },
    },
    generalAdvisory: {
      en: 'Major spring operations: cereal flag leaf protection, open-field vegetable planting, date palm pollination.',
      fr: 'Opérations majeures de printemps : protection dernière feuille céréales, repiquage maraîchage, pollinisation dattier.',
      ar: 'أهم عمليات الربيع: حماية ورقة الراية في الحبوب، شتل الخضروات، وتلقيح النخيل.',
    },
    criticalMilestones: [
      { en: 'Cereal flag leaf rust & septoria defense', fr: 'Protection rouille et septoriose feuille étendard', ar: 'حماية ورقة الراية من الصدأ والسبتوريا' },
      { en: 'Open-field tomato, pepper, and watermelon nursery transplanting', fr: 'Repiquage plein champ tomate, piment, pastèque', ar: 'شتل الطماطم والفلفل والبطيخ في الحقل المفتوح' },
      { en: 'Date palm artificial pollination across southern wilayas', fr: 'Pollinisation artificielle des palmiers dattiers', ar: 'التلقيح اليدوي لنخيل التمر في ولايات الجنوب' },
    ],
  },
  4: {
    month: 4,
    season: 'spring',
    seasonName: { en: 'Spring', fr: 'Printemps', ar: 'الربيع' },
    solarRadiationAvg: '21.8 MJ/m²/day',
    daylightHours: '13.2 h',
    zones: {
      littoral: {
        zoneName: { en: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', fr: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', ar: 'التل والساحل (متيجة، الشلف، الساحل)' },
        tempRange: '11°C – 22°C',
        avgET0: 3.8,
        avgRainfall: 40,
        frostRisk: 'none',
        heatRisk: 'none',
        keyAdvisory: {
          en: 'First forage cuts (bersim, vetch-oat). Supplementary irrigation for grain filling in dry springs.',
          fr: 'Premières coupes de fourrages (bersim, vesce-avoine). Irrigation d’appoint si printemps sec.',
          ar: 'الحشة الأولى للأعلاف (البرسيم، البيقية والشوفان). ري تكميلي لامتلاء الحبوب في حال جفاف الربيع.',
        },
      },
      plateaus: {
        zoneName: { en: 'High Plateaus (Sétif, Tiaret, Batna)', fr: 'Hauts Plateaux (Sétif, Tiaret, Batna)', ar: 'الهضاب العليا (سطيف، تيارت، باتنة)' },
        tempRange: '6°C – 19°C',
        avgET0: 3.4,
        avgRainfall: 35,
        frostRisk: 'low',
        heatRisk: 'none',
        keyAdvisory: {
          en: 'Critical heading to flowering stage for wheat. Monitor for cereal sunn pest and aphid colonies.',
          fr: 'Stade sensible épiaison-floraison blé. Surveiller punaises des céréales et pucerons.',
          ar: 'مرحلة حساسة لطرد السنابل والإزهار. مراقبة حشرة السونة والمن في حقول الحبوب.',
        },
      },
      sahara: {
        zoneName: { en: 'Sahara & Oasis (Biskra, El Oued, Adrar)', fr: 'Sahara & Oasis (Biskra, El Oued, Adrar)', ar: 'الصحراء والواحات (بسكرة، الوادي، أدرار)' },
        tempRange: '17°C – 31°C',
        avgET0: 6.8,
        avgRainfall: 3,
        frostRisk: 'none',
        heatRisk: 'moderate',
        keyAdvisory: {
          en: 'Desert cereal harvest begins (combine harvesters in Adrar/Ouargla). High irrigation demand for palms.',
          fr: 'Début moisson des céréales du Sud (Adrar/Ouargla). Forte demande en eau des palmiers.',
          ar: 'انطلاق موسم حصاد الحبوب في الجنوب (أدرار وورقلة). زيادة مقننات ري النخيل.',
        },
      },
    },
    generalAdvisory: {
      en: 'Grain filling water management, forage hay making, fruit thinning, and intensive pest scouting.',
      fr: 'Gestion hydrique du remplissage du grain, fenaison des fourrages, éclaircissage et veille phytosanitaire.',
      ar: 'إدارة الري لامتلاء الحبوب، تجفيف الأعلاف وصنع الدريس، خف الثمار، والمراقبة الحشرية.',
    },
    criticalMilestones: [
      { en: 'Forage hay cutting & silage baling', fr: 'Fauche et pressage du foin fourrager', ar: 'حش وكبس أعلاف الدريس والسيلاج' },
      { en: 'Grain filling supplementary irrigation (+30–40 mm deficit refill)', fr: 'Irrigation d’appoint remplissage du grain (+30–40 mm)', ar: 'ري تكميلي لامتلاء الحبوب (+30 إلى 40 ملم)' },
      { en: 'Sahara early wheat harvesting mobilization', fr: 'Mobilisation des moissonneuses au Sud', ar: 'تجهيز الحاصدات وانطلاق الحصاد بالجنوب' },
    ],
  },
  5: {
    month: 5,
    season: 'spring',
    seasonName: { en: 'Spring', fr: 'Printemps', ar: 'الربيع' },
    solarRadiationAvg: '25.3 MJ/m²/day',
    daylightHours: '14.2 h',
    zones: {
      littoral: {
        zoneName: { en: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', fr: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', ar: 'التل والساحل (متيجة، الشلف، الساحل)' },
        tempRange: '14°C – 26°C',
        avgET0: 4.9,
        avgRainfall: 25,
        frostRisk: 'none',
        heatRisk: 'low',
        keyAdvisory: {
          en: 'Harvest green peas and broad beans. Regular drip fertigation for summer solanaceous crops.',
          fr: 'Récolte des petits pois et fèves vertes. Fertigation régulière des solanacées d’été.',
          ar: 'جني البازلاء والفول الأخضر. انتظام التسميد بالري للخضروات الصيفية.',
        },
      },
      plateaus: {
        zoneName: { en: 'High Plateaus (Sétif, Tiaret, Batna)', fr: 'Hauts Plateaux (Sétif, Tiaret, Batna)', ar: 'الهضاب العليا (سطيف، تيارت، باتنة)' },
        tempRange: '10°C – 24°C',
        avgET0: 4.6,
        avgRainfall: 30,
        frostRisk: 'none',
        heatRisk: 'none',
        keyAdvisory: {
          en: 'Milky to dough grain stage. Watch for hot Sirocco (Chhili) winds; apply cooling irrigation if available.',
          fr: 'Stade grain pâteux. Vigilance vent de sirocco (Chhili) ; irriguer pour atténuer l’échaudage.',
          ar: 'مرحلة النضج العجيني للحبوب. الحذر من رياح الشهيلي وتطبيق ري التبريد لتفادي الصدمة الحرارية.',
        },
      },
      sahara: {
        zoneName: { en: 'Sahara & Oasis (Biskra, El Oued, Adrar)', fr: 'Sahara & Oasis (Biskra, El Oued, Adrar)', ar: 'الصحراء والواحات (بسكرة، الوادي، أدرار)' },
        tempRange: '21°C – 37°C',
        avgET0: 8.2,
        avgRainfall: 1,
        frostRisk: 'none',
        heatRisk: 'high',
        keyAdvisory: {
          en: 'End of desert cereal harvest. Date fruit setting (Hababouk to Kimri stage); intensive oasis irrigation.',
          fr: 'Clôture moisson Sud. Nouaison des dattes (stade Kimri) ; arrosage intensif des palmeraies.',
          ar: 'اختتام حصاد حبوب الجنوب. عقد ثمار التمر (طور الحبابوك والجمري)؛ تكثيف سقي الواحات.',
        },
      },
    },
    generalAdvisory: {
      en: 'High solar gain: Sirocco vigilance, start of barley harvesting in early zones, peak vegetable fertigation.',
      fr: 'Montée thermique : veille anti-échaudage/sirocco, début récolte orge dans les zones précoces.',
      ar: 'ارتفاع الإشعاع والحرارة: تفادي الصدمة الحرارية، بداية حصاد الشعير بالمناطق المبكرة، وضبط التسميد بالري.',
    },
    criticalMilestones: [
      { en: 'Barley harvest initiation in coastal & early inland plains', fr: 'Début moisson de l’orge plaines précoces', ar: 'بدء حصاد الشعير بالسهول المبكرة' },
      { en: 'Olive fruit set monitoring & boron/potassium foliar nutrition', fr: 'Nouaison olivier et apport foliaire bore/potassium', ar: 'عقد ثمار الزيتون والتغذية الورقية بالبورون والبوتاسيوم' },
      { en: 'Installation of drip lines & mulching for open-field melons & watermelons', fr: 'Pose goutte-à-goutte et paillage melons/pastèques', ar: 'تركيب شبكات التنقيط والتغطية البلاستيكية للبطيخ والشمام' },
    ],
  },
  6: {
    month: 6,
    season: 'summer',
    seasonName: { en: 'Summer', fr: 'Été', ar: 'الصيف' },
    solarRadiationAvg: '27.8 MJ/m²/day',
    daylightHours: '14.8 h',
    zones: {
      littoral: {
        zoneName: { en: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', fr: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', ar: 'التل والساحل (متيجة، الشلف، الساحل)' },
        tempRange: '18°C – 30°C',
        avgET0: 6.1,
        avgRainfall: 8,
        frostRisk: 'none',
        heatRisk: 'moderate',
        keyAdvisory: {
          en: 'Full wheat harvest campaign. Harvest of season potatoes. Fire prevention strips along field edges.',
          fr: 'Plein boom moisson-battage blé. Récolte pomme de terre de saison. Pare-feux aux bordures.',
          ar: 'ذروة حملة الحصاد والدرس للقمح. تقليع بطاطا الموسم. فتح خطوط مصدات الحرائق بأطراف الحقول.',
        },
      },
      plateaus: {
        zoneName: { en: 'High Plateaus (Sétif, Tiaret, Batna)', fr: 'Hauts Plateaux (Sétif, Tiaret, Batna)', ar: 'الهضاب العليا (سطيف، تيارت، باتنة)' },
        tempRange: '15°C – 31°C',
        avgET0: 5.9,
        avgRainfall: 15,
        frostRisk: 'none',
        heatRisk: 'moderate',
        keyAdvisory: {
          en: 'Major cereal harvest launch. Combine harvester maintenance and grain transport logistics to CCLS.',
          fr: 'Lancement grande moisson céréalière. Réglage moissonneuses et livraison CCLS.',
          ar: 'انطلاق موسم الحصاد الكبرى. ضبط الحاصدات وتنظيم نقل المحصول إلى تعاونيات الحبوب CCLS.',
        },
      },
      sahara: {
        zoneName: { en: 'Sahara & Oasis (Biskra, El Oued, Adrar)', fr: 'Sahara & Oasis (Biskra, El Oued, Adrar)', ar: 'الصحراء والواحات (بسكرة، الوادي، أدرار)' },
        tempRange: '26°C – 42°C',
        avgET0: 9.8,
        avgRainfall: 0,
        frostRisk: 'none',
        heatRisk: 'high',
        keyAdvisory: {
          en: 'Extreme heat: night irrigation only. Palm bunch bagging & spider mite (Boufaroua) preventive control.',
          fr: 'Canicule extrême : irrigation nocturne. Ensachage régimes dattiers et lutte anti-Boufaroua.',
          ar: 'حرارة قصوى: الري ليلاً فقط. تكميم عراجين النخيل والوقاية من عنكبوت الغبار (بوفروة).',
        },
      },
    },
    generalAdvisory: {
      en: 'Peak national cereal harvest campaign (Moisson-Battage), CCLS silo deliveries, straw baling, and fire safety.',
      fr: 'Campagne nationale moisson-battage, livraison aux silos CCLS, bottelage paille et sécurité incendie.',
      ar: 'الحملة الوطنية للحصاد والدرس، تسليم المحصول لصوامع CCLS، كبس التبن والوقاية من الحرائق.',
    },
    criticalMilestones: [
      { en: 'National durum & bread wheat harvest campaign peak', fr: 'Pic national de la moisson blé dur et tendre', ar: 'ذروة حصاد القمح الصلب واللين وطنياً' },
      { en: 'Cereal straw baling & livestock feed storage', fr: 'Pressage et stockage des bottes de paille', ar: 'كبس وتخزين بالات التبن لتغذية الماشية' },
      { en: 'Processing tomato harvest commencement (Guelma, Annaba, Chéliff)', fr: 'Démarrage récolte tomate industrielle', ar: 'انطلاق جني الطماطم الصناعية (قالمة، عنابة، الشلف)' },
    ],
  },
  7: {
    month: 7,
    season: 'summer',
    seasonName: { en: 'Summer', fr: 'Été', ar: 'الصيف' },
    solarRadiationAvg: '28.1 MJ/m²/day',
    daylightHours: '14.5 h',
    zones: {
      littoral: {
        zoneName: { en: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', fr: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', ar: 'التل والساحل (متيجة، الشلف، الساحل)' },
        tempRange: '20°C – 33°C',
        avgET0: 6.6,
        avgRainfall: 2,
        frostRisk: 'none',
        heatRisk: 'high',
        keyAdvisory: {
          en: 'Intensive irrigation for orchards and summer vegetables. Olive fruit fly (Dacus) monitoring.',
          fr: 'Irrigation intensive vergers et légumes d’été. Piégeage mouche de l’olive (Dacus).',
          ar: 'تكثيف الري للبساتين وخضروات الصيف. مصائد ومراقبة ذبابة ثمار الزيتون (داكوس).',
        },
      },
      plateaus: {
        zoneName: { en: 'High Plateaus (Sétif, Tiaret, Batna)', fr: 'Hauts Plateaux (Sétif, Tiaret, Batna)', ar: 'الهضاب العليا (سطيف، تيارت، باتنة)' },
        tempRange: '18°C – 35°C',
        avgET0: 6.8,
        avgRainfall: 8,
        frostRisk: 'none',
        heatRisk: 'high',
        keyAdvisory: {
          en: 'Finish cereal harvest in higher altitudes. Stubble grazing for sheep flocks.',
          fr: 'Clôture moissons en altitude. Pâturage des chaumes par les troupeaux ovins.',
          ar: 'إنهاء الحصاد في المناطق الجبلية العالية. رعي الأغنام على بقايا الحصاد (القصل).',
        },
      },
      sahara: {
        zoneName: { en: 'Sahara & Oasis (Biskra, El Oued, Adrar)', fr: 'Sahara & Oasis (Biskra, El Oued, Adrar)', ar: 'الصحراء والواحات (بسكرة، الوادي، أدرار)' },
        tempRange: '28°C – 45°C',
        avgET0: 10.4,
        avgRainfall: 0,
        frostRisk: 'none',
        heatRisk: 'high',
        keyAdvisory: {
          en: 'Max summer ET0: sustain oasis palm irrigation. Early date varieties (Ghars) softening.',
          fr: 'ET0 estivale maximale : maintenir irrigation oasis. Maturation variétés précoces (Ghars).',
          ar: 'أعلى معدل بخر نتح: ضمان ري نخيل الواحات. بدء ترطيب الأصناف المبكرة من التمور (الغرس).',
        },
      },
    },
    generalAdvisory: {
      en: 'Peak summer heat & water deficit: maximize irrigation efficiency, night fertigation, orchard pest defense.',
      fr: 'Pic de canicule et déficit hydrique : maximiser l’efficience d’irrigation, fertigation de nuit.',
      ar: 'ذروة القيظ والعجز المائي: تعظيم كفاءة الري، التسميد ليلاً، ومكافحة آفات البساتين الصيفية.',
    },
    criticalMilestones: [
      { en: 'Processing tomato cannery deliveries at full capacity', fr: 'Livraisons des tomates aux conserveries à plein régime', ar: 'توريد الطماطم الصناعية للمصانع بكامل الطاقة' },
      { en: 'Melon, watermelon, and summer squash harvest peaks', fr: 'Plein pic de récolte melons, pastèques et courgettes', ar: 'ذروة جني البطيخ والشمام والكوسة الصيفية' },
      { en: 'Deep summer soil tillage on fallow lands (labour d’été)', fr: 'Labour d’été sur parcelles en jachère', ar: 'الحراثة الصيفية العميقة للأراضي المستريحة' },
    ],
  },
  8: {
    month: 8,
    season: 'summer',
    seasonName: { en: 'Summer', fr: 'Été', ar: 'الصيف' },
    solarRadiationAvg: '25.6 MJ/m²/day',
    daylightHours: '13.6 h',
    zones: {
      littoral: {
        zoneName: { en: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', fr: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', ar: 'التل والساحل (متيجة، الشلف، الساحل)' },
        tempRange: '21°C – 34°C',
        avgET0: 5.9,
        avgRainfall: 6,
        frostRisk: 'none',
        heatRisk: 'high',
        keyAdvisory: {
          en: 'Start planting late-season potato (arrière-saison). Table grape & fig harvesting.',
          fr: 'Démarrage plantation pomme de terre d’arrière-saison. Récolte raisin de table et figues.',
          ar: 'بدء غرس بطاطا ما بعد الموسم (المتأخرة). جني عنب المائدة والتين.',
        },
      },
      plateaus: {
        zoneName: { en: 'High Plateaus (Sétif, Tiaret, Batna)', fr: 'Hauts Plateaux (Sétif, Tiaret, Batna)', ar: 'الهضاب العليا (سطيف، تيارت، باتنة)' },
        tempRange: '18°C – 34°C',
        avgET0: 6.1,
        avgRainfall: 12,
        frostRisk: 'none',
        heatRisk: 'high',
        keyAdvisory: {
          en: 'Seedbed preparation for upcoming autumn cereal campaign. Soil organic amendments.',
          fr: 'Préparation des lits de semences pour la future campagne céréales. Amendements organiques.',
          ar: 'تحضير مهد البذور لحملة الحبوب الخريفية القادمة. إضافة المادة العضوية والأسمدة الأساسية.',
        },
      },
      sahara: {
        zoneName: { en: 'Sahara & Oasis (Biskra, El Oued, Adrar)', fr: 'Sahara & Oasis (Biskra, El Oued, Adrar)', ar: 'الصحراء والواحات (بسكرة، الوادي، أدرار)' },
        tempRange: '27°C – 44°C',
        avgET0: 9.2,
        avgRainfall: 1,
        frostRisk: 'none',
        heatRisk: 'high',
        keyAdvisory: {
          en: 'Deglet Nour date translucent stage (Bser to Routab transition). Prepare greenhouse plastic covers.',
          fr: 'Dattes Deglet Nour au stade Bser/Routab. Préparation des films plastiques des serres.',
          ar: 'تمر دقلة نور في طور البسر وبداية الرطب. صيانة وتجهيز أغطية البيوت البلاستيكية.',
        },
      },
    },
    generalAdvisory: {
      en: 'Arrière-saison potato planting, orchard fruit harvesting, and early land prep for autumn sowings.',
      fr: 'Plantation pomme de terre d’arrière-saison, récolte fruitière et préparation des sols d’automne.',
      ar: 'غرس بطاطا ما بعد الموسم، جني الفواكه الصيفية، وبدء تحضير التربة للموسم الخريفي.',
    },
    criticalMilestones: [
      { en: 'Late-season (arrière-saison) potato tuber planting in coastal & low plains', fr: 'Plantation pomme de terre arrière-saison plaines littorales', ar: 'غرس درنات بطاطا ما بعد الموسم بالسهول الساحلية والمنخفضة' },
      { en: 'Table grape & summer pear/peach harvesting', fr: 'Récolte raisins de table, poires et pêches', ar: 'جني عنب المائدة والإجاص والخوخ' },
      { en: 'Agricultural equipment overhaul & soil fertilizer procurement', fr: 'Révision du matériel agricole et achat engrais de fond', ar: 'صيانة العتاد الزراعي واقتناء الأسمدة الفوسفاتية والبوتاسية' },
    ],
  },
  9: {
    month: 9,
    season: 'autumn',
    seasonName: { en: 'Autumn', fr: 'Automne', ar: 'الخريف' },
    solarRadiationAvg: '20.5 MJ/m²/day',
    daylightHours: '12.4 h',
    zones: {
      littoral: {
        zoneName: { en: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', fr: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', ar: 'التل والساحل (متيجة، الشلف، الساحل)' },
        tempRange: '18°C – 29°C',
        avgET0: 4.3,
        avgRainfall: 35,
        frostRisk: 'none',
        heatRisk: 'none',
        keyAdvisory: {
          en: 'Autumn vegetable planting (artichoke, cauliflower, carrot). Olive pre-harvest irrigation.',
          fr: 'Plantation légumes d’automne (artichaut, chou-fleur, carotte). Irrigation pré-récolte olivier.',
          ar: 'غرس خضروات الخريف (الخرشوف، القرنبيط، الجزر). ري أشجار الزيتون قبل الحصاد.',
        },
      },
      plateaus: {
        zoneName: { en: 'High Plateaus (Sétif, Tiaret, Batna)', fr: 'Hauts Plateaux (Sétif, Tiaret, Batna)', ar: 'الهضاب العليا (سطيف، تيارت، باتنة)' },
        tempRange: '14°C – 28°C',
        avgET0: 4.2,
        avgRainfall: 28,
        frostRisk: 'none',
        heatRisk: 'none',
        keyAdvisory: {
          en: 'Apply basal phosphate & potassium fertilizers (TSP 46%, 15-15-15). Seed purchase from CCLS.',
          fr: 'Épandage engrais de fond (TSP 46%, NPK). Approvisionnement semences certifiées CCLS.',
          ar: 'نثر الأسمدة الأساسية (سوبر فوسفات، NPK). التزود بالبذور المعتمدة من تعاونيات الحبوب.',
        },
      },
      sahara: {
        zoneName: { en: 'Sahara & Oasis (Biskra, El Oued, Adrar)', fr: 'Sahara & Oasis (Biskra, El Oued, Adrar)', ar: 'الصحراء والواحات (بسكرة، الوادي، أدرار)' },
        tempRange: '23°C – 38°C',
        avgET0: 6.9,
        avgRainfall: 4,
        frostRisk: 'none',
        heatRisk: 'moderate',
        keyAdvisory: {
          en: 'Greenhouse soil solarization completion & early transplanting. Harvest of common dates.',
          fr: 'Fin solarisation des serres et repiquage primeurs. Récolte dattes communes.',
          ar: 'إنهاء تعقيم التربة الشمسي والبدء في تشتيل البيوت المحمية. جني التمور العادية.',
        },
      },
    },
    generalAdvisory: {
      en: 'Launch of the autumn agricultural campaign: basal fertilization, seedbed refining, greenhouse planting.',
      fr: 'Lancement de la campagne agricole d’automne : fertilisation de fond, lits de semences, serres.',
      ar: 'انطلاق الحملة الفلاحية الخريفية: التسميد الأساسي، تهيئة مهاد البذور، وزراعة البيوت البلاستيكية.',
    },
    criticalMilestones: [
      { en: 'Autumn vegetable planting across coastal & interior belts', fr: 'Plantation des légumes d’automne', ar: 'غرس خضروات الخريف في الشريط الساحلي والداخلي' },
      { en: 'Basal phosphorus (TSP 46% or MAP) broadcast before cereal plowing', fr: 'Épandage phosphore de fond avant labour céréales', ar: 'نثر الفسفور الأساسي (TSP 46% أو MAP) قبل حراثة الحبوب' },
      { en: 'Early desert greenhouse transplanting (tomato, pepper, cucumber)', fr: 'Repiquage sous serres sahariennes (tomate, poivron)', ar: 'تشتيل البيوت المحمية الصحراوية (طماطم، فلفل، خيار)' },
    ],
  },
  10: {
    month: 10,
    season: 'autumn',
    seasonName: { en: 'Autumn', fr: 'Automne', ar: 'الخريف' },
    solarRadiationAvg: '15.2 MJ/m²/day',
    daylightHours: '11.2 h',
    zones: {
      littoral: {
        zoneName: { en: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', fr: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', ar: 'التل والساحل (متيجة، الشلف، الساحل)' },
        tempRange: '14°C – 24°C',
        avgET0: 2.9,
        avgRainfall: 65,
        frostRisk: 'none',
        heatRisk: 'none',
        keyAdvisory: {
          en: 'Start table olive harvest. Sowing of forage crops (bersim, vetch-oats).',
          fr: 'Début récolte olives de table. Semis des fourrages (bersim, vesce-avoine).',
          ar: 'انطلاق جني زيتون المائدة. بذر الأعلاف الخريفية (البرسيم، البيقية مع الشوفان).',
        },
      },
      plateaus: {
        zoneName: { en: 'High Plateaus (Sétif, Tiaret, Batna)', fr: 'Hauts Plateaux (Sétif, Tiaret, Batna)', ar: 'الهضاب العليا (سطيف، تيارت، باتنة)' },
        tempRange: '9°C – 22°C',
        avgET0: 2.8,
        avgRainfall: 35,
        frostRisk: 'low',
        heatRisk: 'none',
        keyAdvisory: {
          en: 'Begin barley and early durum wheat sowings upon first significant autumn rains (Ghaith).',
          fr: 'Démarrage semis orge et blé dur précoce dès les premières pluies d’automne.',
          ar: 'بدء بذر الشعير والقمح الصلب المبكر مع هطول أمطار الخريف الأولى (الغيث).',
        },
      },
      sahara: {
        zoneName: { en: 'Sahara & Oasis (Biskra, El Oued, Adrar)', fr: 'Sahara & Oasis (Biskra, El Oued, Adrar)', ar: 'الصحراء والواحات (بسكرة، الوادي، أدرار)' },
        tempRange: '17°C – 30°C',
        avgET0: 4.8,
        avgRainfall: 8,
        frostRisk: 'none',
        heatRisk: 'none',
        keyAdvisory: {
          en: 'Deglet Nour date harvest kickoff (Biskra, Tolga, Ouargla). Desert potato planting.',
          fr: 'Coup d’envoi récolte dattes Deglet Nour (Tolga, Biskra). Plantation pomme de terre Sud.',
          ar: 'انطلاق موسم جني تمور دقلة نور (طولقة، بسكرة، ورقلة). غرس بطاطا الجنوب الصحراوية.',
        },
      },
    },
    generalAdvisory: {
      en: 'Major national sowing kickoff: forage crops, early barley, table olives, and Deglet Nour date harvest.',
      fr: 'Lancement majeur des semis : fourrages, orge précoce, récolte olives de table et dattes Deglet Nour.',
      ar: 'الانطلاقة الكبرى لحملة البذر: الأعلاف، الشعير المبكر، جني زيتون المائدة وتمور دقلة نور.',
    },
    criticalMilestones: [
      { en: 'Forage legume & grass mixture sowing across rainfed zones', fr: 'Semis des mélanges fourragers en zones pluviales', ar: 'بذر خلطات الأعلاف في المناطق البعلية' },
      { en: 'Table olive harvesting & green pickling processing', fr: 'Récolte et confisage des olives de table vertes', ar: 'جني وتخليل زيتون المائدة الأخضر' },
      { en: 'Deglet Nour date harvesting in Biskra, El Oued, and Ghardaïa', fr: 'Récolte Deglet Nour à Biskra, El Oued et Ghardaïa', ar: 'موسم جني تمور دقلة نور في بسكرة ووادي سوف وغرداية' },
    ],
  },
  11: {
    month: 11,
    season: 'autumn',
    seasonName: { en: 'Autumn', fr: 'Automne', ar: 'الخريف' },
    solarRadiationAvg: '11.4 MJ/m²/day',
    daylightHours: '10.2 h',
    zones: {
      littoral: {
        zoneName: { en: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', fr: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', ar: 'التل والساحل (متيجة، الشلف، الساحل)' },
        tempRange: '10°C – 19°C',
        avgET0: 1.8,
        avgRainfall: 80,
        frostRisk: 'none',
        heatRisk: 'none',
        keyAdvisory: {
          en: 'Peak durum wheat and bread wheat sowings. Oil olive harvest and mill opening.',
          fr: 'Plein pic des semis blé dur et tendre. Récolte olive à huile et ouverture des huileries.',
          ar: 'ذروة بذر القمح الصلب واللين. انطلاق جني زيتون الزيت وافتتاح المعاصر.',
        },
      },
      plateaus: {
        zoneName: { en: 'High Plateaus (Sétif, Tiaret, Batna)', fr: 'Hauts Plateaux (Sétif, Tiaret, Batna)', ar: 'الهضاب العليا (سطيف، تيارت، باتنة)' },
        tempRange: '4°C – 15°C',
        avgET0: 1.6,
        avgRainfall: 42,
        frostRisk: 'moderate',
        heatRisk: 'none',
        keyAdvisory: {
          en: 'Intensive cereal drilling campaign. Ensure proper seed depth (3–5 cm) to withstand early winter cold.',
          fr: 'Campagne intensive de semis céréales. Profondeur de semis optimale (3–5 cm).',
          ar: 'تكثيف عمليات بذر الحبوب في الهضاب. ضبط عمق البذر (3-5 سم) لمقاومة برد الشتاء المبكر.',
        },
      },
      sahara: {
        zoneName: { en: 'Sahara & Oasis (Biskra, El Oued, Adrar)', fr: 'Sahara & Oasis (Biskra, El Oued, Adrar)', ar: 'الصحراء والواحات (بسكرة، الوادي، أدرار)' },
        tempRange: '12°C – 24°C',
        avgET0: 3.3,
        avgRainfall: 6,
        frostRisk: 'none',
        heatRisk: 'none',
        keyAdvisory: {
          en: 'Desert pivot cereal sowing (Adrar, Ghardaïa, El Meniaa). Active greenhouse vegetable harvesting.',
          fr: 'Semis blé sous pivot au Sud (Adrar, El Meniaa). Récolte continue sous serres.',
          ar: 'بذر القمح تحت الرشاشات المحورية بالجنوب (أدرار، المنيعة). جني المحاصيل المحمية.',
        },
      },
    },
    generalAdvisory: {
      en: 'Peak national cereal sowing window (Campagne Semis), oil olive pressing mills activation, autumn rain capture.',
      fr: 'Cœur de la campagne nationale des semis céréales, pressage de l’huile d’olive, valorisation des pluies.',
      ar: 'قلب الحملة الوطنية لبذر الحبوب، عصر زيت الزيتون البكر، واستغلال مياه الأمطار الخريفية.',
    },
    criticalMilestones: [
      { en: 'Optimal cereal sowing window across all northern & high plateau zones', fr: 'Fenêtre optimale de semis des céréales au Nord et Hauts Plateaux', ar: 'الفترة المثالية لبذر الحبوب في الشمال والهضاب العليا' },
      { en: 'Oil olive harvesting & cold extraction milling peak', fr: 'Récolte des olives et extraction de l’huile d’olive', ar: 'جني الزيتون وعصر زيت الزيتون البكر الممتاز' },
      { en: 'Winter cereal emergence & pre-emergence weed control scouting', fr: 'Suivi de la levée des céréales et désherbage de prélevée', ar: 'متابعة إنبات الحبوب ومكافحة الأعشاب قبل/بعد البزوغ' },
    ],
  },
  12: {
    month: 12,
    season: 'winter',
    seasonName: { en: 'Winter', fr: 'Hiver', ar: 'الشتاء' },
    solarRadiationAvg: '9.6 MJ/m²/day',
    daylightHours: '9.6 h',
    zones: {
      littoral: {
        zoneName: { en: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', fr: 'Tell & Littoral (Mitidja, Chéliff, Sahel)', ar: 'التل والساحل (متيجة، الشلف، الساحل)' },
        tempRange: '7°C – 16°C',
        avgET0: 1.3,
        avgRainfall: 95,
        frostRisk: 'low',
        heatRisk: 'none',
        keyAdvisory: {
          en: 'Finish late cereal sowings. Citrus harvest (Clementine, Washington Navel). Pruning fruit trees.',
          fr: 'Fin des semis tardifs. Récolte agrumes (Clémentine, Navel). Taille des arbres fruitiers.',
          ar: 'إنهاء زراعة الحبوب المتأخرة. جني الحمضيات (كليمونتين، نافيل). تقليم الأشجار المثمرة.',
        },
      },
      plateaus: {
        zoneName: { en: 'High Plateaus (Sétif, Tiaret, Batna)', fr: 'Hauts Plateaux (Sétif, Tiaret, Batna)', ar: 'الهضاب العليا (سطيف، تيارت، باتنة)' },
        tempRange: '0°C – 10°C',
        avgET0: 1.1,
        avgRainfall: 45,
        frostRisk: 'high',
        heatRisk: 'none',
        keyAdvisory: {
          en: 'Winter dormancy. Maintenance of farm machinery, seed drill cleaning, soil conservation ditches.',
          fr: 'Repos hivernal. Entretien du matériel agricole, fossés de drainage et anti-érosion.',
          ar: 'السكون الشتوي. صيانة العتاد الزراعي، تنظيف البذارات، وتطهير خنادق تصريف المياه.',
        },
      },
      sahara: {
        zoneName: { en: 'Sahara & Oasis (Biskra, El Oued, Adrar)', fr: 'Sahara & Oasis (Biskra, El Oued, Adrar)', ar: 'الصحراء والواحات (بسكرة، الوادي، أدرار)' },
        tempRange: '8°C – 20°C',
        avgET0: 2.5,
        avgRainfall: 8,
        frostRisk: 'low',
        heatRisk: 'none',
        keyAdvisory: {
          en: 'Winter pivot irrigation of wheat. High production of greenhouse tomatoes and peppers.',
          fr: 'Irrigation continue des pivots de blé. Pleine production des serres maraîchères.',
          ar: 'الري المنتظم لمحاور القمح الصحراوي. ذروة إنتاج طماطم وفلفل البيوت المحمية.',
        },
      },
    },
    generalAdvisory: {
      en: 'Winter orchard sanitation, citrus harvesting, cereal emergence supervision, and drainage management.',
      fr: 'Traitement d’hiver des vergers, récolte des agrumes, contrôle de la levée et drainage des parcelles.',
      ar: 'المعالجة الشتوية للبساتين، جني الحمضيات، فحص حقول الحبوب المنبتة، وتصريف مياه الأمطار.',
    },
    criticalMilestones: [
      { en: 'Citrus harvesting campaign peak (Clémentine de Misserghin, Thompson Navel)', fr: 'Plein pic de récolte des agrumes (Clémentine, Navel)', ar: 'ذروة جني الحمضيات (كليمونتين ميسرغين، واشنطن نافيل)' },
      { en: 'Winter sanitation copper & paraffin oil sprays for fruit trees', fr: 'Traitements d’hiver cuivre et huile blanche vergers', ar: 'المعالجة الشتوية بالنحاس والزيت الأبيض للأشجار المثمرة' },
      { en: 'Late sowing completion & winter cereal tillering assessment', fr: 'Clôture des semis et diagnostic tallage céréales', ar: 'استكمال البذر المتأخر وتقييم مرحلة التفريع للحبوب' },
    ],
  },
};

export interface DecadalTask {
  decade: 1 | 2 | 3;
  decadeLabel: { en: string; fr: string; ar: string };
  dayRange: string;
  tasks: {
    cropContext: string;
    section: string;
    actionTypes: string[];
    description: string;
    source: string;
  }[];
}

export function getMonthClimate(month: number): AlgeriaMonthInsight {
  return ALGERIA_MONTH_CLIMATE[month] ?? ALGERIA_MONTH_CLIMATE[1];
}
