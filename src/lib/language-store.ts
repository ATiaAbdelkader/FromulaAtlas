// Language state: 'en' or 'ar'. Persisted to localStorage via Zustand.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'ar';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
      toggleLanguage: () => set({ language: get().language === 'en' ? 'ar' : 'en' }),
    }),
    { name: 'agri-atlas-language', version: 1 }
  )
);

export const uiStrings: Record<Language, Record<string, string>> = {
  en: {
    appName: 'Atlas of Agri-Formulas & Metrics',
    appSubtitle: 'A Practical Reference for Crop & Animal Production',
    searchPlaceholder: 'Search by name, code, formula, keyword... (press / to focus)',
    allFormulas: 'All Formulas',
    sections: 'Sections',
    formulas: 'Formulas',
    interactiveCalculators: 'Interactive Calculators',
    close: 'Close',
    result: 'Result',
  },
  ar: {
    appName: 'أطلس المعادلات الزراعية والمقاييس',
    appSubtitle: 'مرجع عملي لإنتاج المحاصيل والحيوان',
    searchPlaceholder: 'ابحث بالاسم أو الرمز أو المعادلة... (اضغط / للتركيز)',
    allFormulas: 'كل المعادلات',
    sections: 'الأقسام',
    formulas: 'المعادلات',
    interactiveCalculators: 'الحاسبات التفاعلية',
    close: 'إغلاق',
    result: 'النتيجة',
  },
};

export function useTranslation() {
  const language = useLanguageStore(s => s.language);
  const strings = uiStrings[language];
  return { t: strings, language, isRTL: language === 'ar' };
}
