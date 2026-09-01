import type { Language } from './language-store';

interface CropLabel {
  en: string;
  fr: string;
  ar: string;
}

const CROP_LABELS: Record<string, CropLabel> = {
  maize: { en: 'Maize (Field Corn)', fr: 'Maïs (maïs-grain)', ar: 'الذرة (ذرة الحبوب)' },
  wheat: { en: 'Wheat (Bread)', fr: 'Blé (panifiable)', ar: 'القمح (قمح الخبز)' },
  rice: { en: 'Rice (Lowland Irrigated)', fr: 'Riz (irrigué de plaine)', ar: 'الأرز (مروي في الأراضي المنخفضة)' },
  soybean: { en: 'Soybean', fr: 'Soja', ar: 'فول الصويا' },
  cotton: { en: 'Cotton', fr: 'Coton', ar: 'القطن' },
  tomato: { en: 'Tomato (Fresh Market)', fr: 'Tomate (marché du frais)', ar: 'الطماطم (السوق الطازجة)' },
  potato: { en: 'Potato', fr: 'Pomme de terre', ar: 'البطاطا' },
  lettuce: { en: 'Lettuce', fr: 'Laitue', ar: 'الخس' },
  onion: { en: 'Onion (Dry Bulb)', fr: 'Oignon (bulbe sec)', ar: 'البصل (بصلة جافة)' },
  alfalfa: { en: 'Alfalfa (Lucerne)', fr: 'Luzerne', ar: 'الفصة (البرسيم الحجازي)' },
  coffee: { en: 'Coffee (Arabica)', fr: 'Café (Arabica)', ar: 'القهوة (أرابيكا)' },
  apple: { en: 'Apple', fr: 'Pomme', ar: 'التفاح' },
  sunflower: { en: 'Sunflower', fr: 'Tournesol', ar: 'دوار الشمس' },
  citrus: { en: 'Citrus (Orange)', fr: 'Agrumes (orange)', ar: 'الحمضيات (البرتقال)' },
  sorghum: { en: 'Sorghum (Grain)', fr: 'Sorgho (grain)', ar: 'الذرة الرفيعة (حبوب)' },
  barley: { en: 'Barley', fr: 'Orge', ar: 'الشعير' },
  canola: { en: 'Canola (Rapeseed)', fr: 'Colza', ar: 'الكانولا (اللفت الزيتي)' },
  'bell-pepper': { en: 'Bell Pepper', fr: 'Poivron', ar: 'الفلفل الحلو' },
  cucumber: { en: 'Cucumber (Fresh Market)', fr: 'Concombre (marché du frais)', ar: 'الخيار (السوق الطازجة)' },
  grapes: { en: 'Grapes (Wine)', fr: 'Raisin (vin)', ar: 'العنب (النبيذ)' },
  // === CCMT / Makerere dataset crops ===
  cassava: { en: 'Cassava', fr: 'Manioc', ar: 'الكاسافا' },
  cashew: { en: 'Cashew', fr: 'Anacardier', ar: 'الكاجو' },
};

export function localizedCropName(language: Language, cropId: string, fallback: string): string {
  const labels = CROP_LABELS[cropId];
  if (!labels) return fallback;
  return labels[language];
}

export function localizedCropLabels(): Record<string, CropLabel> {
  return CROP_LABELS;
}
