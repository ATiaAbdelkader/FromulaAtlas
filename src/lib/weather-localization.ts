import type { Language } from './language-store';

export interface LocalizedWeatherLabel {
  en: string;
  fr: string;
  ar: string;
}

const WEATHER_LABELS: Record<number, LocalizedWeatherLabel> = {
  0: { en: 'Clear sky', fr: 'Ciel dégagé', ar: 'سماء صافية' },
  1: { en: 'Mainly clear', fr: 'Ciel principalement dégagé', ar: 'سماء صافية غالباً' },
  2: { en: 'Partly cloudy', fr: 'Partiellement nuageux', ar: 'غائم جزئياً' },
  3: { en: 'Overcast', fr: 'Couvert', ar: 'غائم كلياً' },
  45: { en: 'Fog', fr: 'Brouillard', ar: 'ضباب' },
  48: { en: 'Rime fog', fr: 'Brouillard givrant', ar: 'ضباب متجمّد' },
  51: { en: 'Light drizzle', fr: 'Bruine légère', ar: 'رذاذ خفيف' },
  53: { en: 'Drizzle', fr: 'Bruine', ar: 'رذاذ' },
  55: { en: 'Heavy drizzle', fr: 'Bruine dense', ar: 'رذاذ كثيف' },
  61: { en: 'Light rain', fr: 'Pluie faible', ar: 'أمطار خفيفة' },
  63: { en: 'Rain', fr: 'Pluie', ar: 'أمطار' },
  65: { en: 'Heavy rain', fr: 'Forte pluie', ar: 'أمطار غزيرة' },
  71: { en: 'Light snow', fr: 'Neige faible', ar: 'ثلوج خفيفة' },
  73: { en: 'Snow', fr: 'Neige', ar: 'ثلوج' },
  75: { en: 'Heavy snow', fr: 'Forte neige', ar: 'ثلوج غزيرة' },
  80: { en: 'Rain showers', fr: 'Averses', ar: 'زخات مطر' },
  81: { en: 'Rain showers', fr: 'Averses', ar: 'زخات مطر' },
  82: { en: 'Violent rain showers', fr: 'Averses violentes', ar: 'زخات مطر عنيفة' },
  95: { en: 'Thunderstorm', fr: 'Orage', ar: 'عاصفة رعدية' },
  96: { en: 'Thunderstorm + hail', fr: 'Orage avec grêle', ar: 'عاصفة رعدية مع بَرَد' },
  99: { en: 'Severe thunderstorm', fr: 'Orage violent', ar: 'عاصفة رعدية شديدة' },
};

export function localizedWeatherLabel(code: number, language: Language): string {
  const labels = WEATHER_LABELS[code] ?? { en: 'Unknown', fr: 'Inconnu', ar: 'غير معروف' };
  return labels[language];
}

export function formatWeatherDate(
  isoDate: string,
  language: Language,
  options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' },
): string {
  const locale = language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-DZ';
  return new Date(`${isoDate}T00:00`).toLocaleDateString(locale, options);
}

export function localizedWeatherLabels(): Record<number, LocalizedWeatherLabel> {
  return WEATHER_LABELS;
}
