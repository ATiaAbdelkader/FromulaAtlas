/**
 * Regional Disease & Pest Outbreak Radar Data for Algeria
 * Real-time farm sightings, severity levels, active warnings, and crowdsourced reporting.
 */

export interface OutbreakReport {
  id: string;
  crop: string;
  crop_ar: string;
  crop_fr: string;
  diseaseOrPest: string;
  diseaseOrPest_ar: string;
  diseaseOrPest_fr: string;
  category: 'fungal' | 'pest' | 'bacterial' | 'viral';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  wilaya: string;
  wilaya_ar: string;
  commune: string;
  reportedDate: string;
  activeCasesCount: number;
  radiusKm: number;
  lat: number;
  lng: number;
  verifiedByAgronomist: boolean;
  weatherTrigger: string;
  recommendedAction_fr: string;
  recommendedAction_ar: string;
  inpvReferenceProduct: string;
  darDays: number;
}

export const INITIAL_OUTBREAK_REPORTS: OutbreakReport[] = [
  {
    id: 'outbreak-biskra-01',
    crop: 'Tomato (Under Greenhouse)',
    crop_ar: 'طماطم تحت البيوت البلاستيكية',
    crop_fr: 'Tomate sous serre',
    diseaseOrPest: 'Tuta Absoluta (Moth Infestation)',
    diseaseOrPest_ar: 'عثة الطماطم (توتا أبسولوتا)',
    diseaseOrPest_fr: 'Mineuse de la tomate (Tuta absoluta)',
    category: 'pest',
    severity: 'critical',
    wilaya: 'Biskra',
    wilaya_ar: 'بسكرة',
    commune: 'Sidi Okba / El Ghrous',
    reportedDate: '2 hours ago',
    activeCasesCount: 28,
    radiusKm: 35,
    lat: 34.75,
    lng: 5.9,
    verifiedByAgronomist: true,
    weatherTrigger: 'High night temps (26°C) + low relative humidity',
    recommendedAction_fr: 'Déployer pièges à phéromones de masse + pulvérisation Émaméctine benzoate / Chlorantraniliprole sous 48h.',
    recommendedAction_ar: 'نشر مصائد فرمونية مكثفة والرش بمركب إيمامكتين بنزوات أو كلورانترانيليبرول خلال 48 ساعة.',
    inpvReferenceProduct: 'Coragen 20 SC / Proclaim',
    darDays: 3,
  },
  {
    id: 'outbreak-eloued-01',
    crop: 'Potato (Pivot Irrigation)',
    crop_ar: 'بطاطا تحت محاور السقي',
    crop_fr: 'Pomme de terre sous pivot',
    diseaseOrPest: 'Late Blight (Phytophthora infestans)',
    diseaseOrPest_ar: 'اللفحة المتأخرة (فيتوفثورا)',
    diseaseOrPest_fr: 'Mildiou de la pomme de terre',
    category: 'fungal',
    severity: 'high',
    wilaya: 'El Oued',
    wilaya_ar: 'الوادي',
    commune: 'Debila / Hassi Khelifa',
    reportedDate: 'Yesterday',
    activeCasesCount: 19,
    radiusKm: 40,
    lat: 33.52,
    lng: 6.95,
    verifiedByAgronomist: true,
    weatherTrigger: 'Overhead pivot moisture + nocturnal fog',
    recommendedAction_fr: 'Arrêter les irrigations nocturnes. Traiter d\'urgence avec Mandipropamide ou Méfénoxam.',
    recommendedAction_ar: 'توقف عن السقي الليلي فوراً. التدخل بمبيد جهازي مثل ميفينوكسام أو مانديبروباميد.',
    inpvReferenceProduct: 'Ridomil Gold MZ / Revus',
    darDays: 7,
  },
  {
    id: 'outbreak-blida-01',
    crop: 'Citrus / Orange Trees',
    crop_ar: 'حمضيات / برتقال',
    crop_fr: 'Agrumes / Orangers',
    diseaseOrPest: 'Citrus Leafminer (Phyllocnistis)',
    diseaseOrPest_ar: 'حفارة أوراق الحمضيات (المينوز)',
    diseaseOrPest_fr: 'Mineuse des agrumes',
    category: 'pest',
    severity: 'moderate',
    wilaya: 'Blida',
    wilaya_ar: 'البليدة',
    commune: 'Boufarik / Mouzaïa',
    reportedDate: '3 days ago',
    activeCasesCount: 14,
    radiusKm: 25,
    lat: 36.57,
    lng: 2.91,
    verifiedByAgronomist: true,
    weatherTrigger: 'New spring vegetative flush growth',
    recommendedAction_fr: 'Traiter les nouvelles pousses avec Abamectine + huile minérale blanche.',
    recommendedAction_ar: 'رش البراعم الحديثة بمركب أبامكتين مع الزيت المعدني الصيفي.',
    inpvReferenceProduct: 'Vertimec 018 EC',
    darDays: 7,
  },
  {
    id: 'outbreak-setif-01',
    crop: 'Durum Wheat',
    crop_ar: 'قمح صلب',
    crop_fr: 'Blé dur',
    diseaseOrPest: 'Stripe Yellow Rust (Puccinia striiformis)',
    diseaseOrPest_ar: 'الصدأ الأصفر المخطط',
    diseaseOrPest_fr: 'Rouille jaune striée',
    category: 'fungal',
    severity: 'high',
    wilaya: 'Sétif',
    wilaya_ar: 'سطيف',
    commune: 'El Eulma / Guellal',
    reportedDate: '4 days ago',
    activeCasesCount: 22,
    radiusKm: 50,
    lat: 36.15,
    lng: 5.69,
    verifiedByAgronomist: true,
    weatherTrigger: 'Prolonged dew and cool temperatures (10-15°C)',
    recommendedAction_fr: 'Traitement foliaire dès apparition des premières pustules sur feuille F3 avec Tébuconazole + Azoxystrobine.',
    recommendedAction_ar: 'رش ورقي عند ظهور أولى البثرات على الورقة F3 بمركب تيبوكونازول مع أزوكسيستروبين.',
    inpvReferenceProduct: 'Amistar Xtra / Prosaro',
    darDays: 35,
  },
  {
    id: 'outbreak-tizi-01',
    crop: 'Olive Groves',
    crop_ar: 'بساتين الزيتون',
    crop_fr: 'Oliveraies',
    diseaseOrPest: 'Olive Peacock Spot (Spilocaea oleagina)',
    diseaseOrPest_ar: 'عين الطاووس في الزيتون',
    diseaseOrPest_fr: 'Œil de paon de l\'olivier',
    category: 'fungal',
    severity: 'moderate',
    wilaya: 'Tizi Ouzou',
    wilaya_ar: 'تيزي وزو',
    commune: 'Draâ El Mizan / Boghni',
    reportedDate: '5 days ago',
    activeCasesCount: 11,
    radiusKm: 30,
    lat: 36.73,
    lng: 4.02,
    verifiedByAgronomist: true,
    weatherTrigger: 'High humidity in mountain valleys post-rainfall',
    recommendedAction_fr: 'Taille d\'aération + pulvérisation préventive de cuivre cuprique (Bouillie Bordelaise).',
    recommendedAction_ar: 'تقليم تهوية الأغصان والرش الوقائي بمركب النحاس (العجينة البوردية).',
    inpvReferenceProduct: 'Bouillie Bordelaise RSR',
    darDays: 14,
  },
  {
    id: 'outbreak-mostaganem-01',
    crop: 'Open Field Tomato & Pepper',
    crop_ar: 'طماطم وفلفل حقلي',
    crop_fr: 'Tomate & Piment plein champ',
    diseaseOrPest: 'Early Blight (Alternaria solani)',
    diseaseOrPest_ar: 'اللفحة المبكرة (ألترناريا)',
    diseaseOrPest_fr: 'Alternariose solanacées',
    category: 'fungal',
    severity: 'moderate',
    wilaya: 'Mostaganem',
    wilaya_ar: 'مستغانم',
    commune: 'Ain Nouissy / Fornaka',
    reportedDate: '6 days ago',
    activeCasesCount: 16,
    radiusKm: 30,
    lat: 35.98,
    lng: 0.3,
    verifiedByAgronomist: true,
    weatherTrigger: 'Alternating coastal fog and afternoon sunshine',
    recommendedAction_fr: 'Application de Difénoconazole ou Hydroxyde de Cuivre sur feuillage inférieur.',
    recommendedAction_ar: 'تطبيق ديفينوكونازول أو هيدروكسيد النحاس على الأوراق السفلية.',
    inpvReferenceProduct: 'Score 250 EC / Kocide',
    darDays: 3,
  },
];
