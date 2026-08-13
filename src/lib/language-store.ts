// Language state: 'en' or 'ar'. Persisted to localStorage via Zustand.
//
// This is the single source of truth for UI strings in Formula Atlas.
// Components consume it via the `useTranslation()` hook and read from
// the `t` object returned. Every key MUST be present in both `en`
// and `ar` — TypeScript will not warn you if you forget a key, so add
// new keys to both languages at the same time.
//
// When adding a new string:
//   1. Pick a stable, descriptive camelCase key.
//   2. Add it to `en` first (source of truth, English copy).
//   3. Add the Arabic equivalent to `ar` — keep it concise and natural.
//   4. Use `t.yourKey` in the component.
//
// For dynamic / domain content (formula names, tool descriptions, crop
// data), translate via separate per-entity dictionaries — do not bloat
// this file with hundreds of entries.

import { create } from 'zustand';
import { FREE_TOOL_COUNT, FORMULA_COUNT } from './catalog-stats';
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
    { name: 'agri-atlas-language', version: 2 }
  )
);

// ---------------------------------------------------------------------------
// UI STRINGS DICTIONARY
// ---------------------------------------------------------------------------

export const uiStrings = {
  en: {
    // App identity
    appName: 'Formula Atlas',
    appSubtitle: 'Your AI-powered agronomy platform',
    appTagline: `${FORMULA_COUNT} formulas · ${FREE_TOOL_COUNT} free tools · 10 AI specialists · 1 free platform`,

    // Top-level navigation tabs
    tabHome: 'Home',
    tabFormulas: 'Formulas',
    tabTools: 'Tools',
    tabFarm: 'Farm',
    tabInsights: 'Insights',
    tabAbout: 'About',

    // Header actions
    takeTour: 'Take Tour',
    installApp: 'Install App',
    installed: 'Installed',
    openLanding: 'Landing Page',
    aboutLink: 'About',
    browse: 'Browse',

    // Command palette / search
    searchPlaceholder: 'Search by name, code, formula, keyword... (press / to focus)',
    searchTitle: 'Search',
    searchPrompt: 'Type a command or search...',
    searchNoResults: 'No results found',
    searchHint: 'Tip: press / to focus search, ⌘K for command palette',

    // Formulas tab
    allFormulas: 'All Formulas',
    sections: 'Sections',
    formulas: 'Formulas',
    interactiveCalculators: 'Interactive Calculators',
    ofFormulas: 'of',
    partLabel: 'Part',
    sectionLabel: 'Section',
    calculatorOnly: 'Calculator only',
    clear: 'Clear',
    clearFilters: 'Clear filters',
    noFormulasMatch: 'No formulas match',
    noFormulasMatchDesc: 'Try removing some filters or searching for something else.',
    bookmarkedFormulas: 'Bookmarked Formulas',

    // Farm tab
    farmManagement: 'Farm Management',
    farmManagementSubtitle: 'Fields · Crops · Soil · Livestock · Irrigation · Protection',
    fieldsAndCrops: 'Fields & Crops',
    plantProtection: 'Plant Protection',
    soilAndLivestock: 'Soil & Livestock',
    irrigation: 'Irrigation',

    // Insights tab
    intelligenceAndInsights: 'Intelligence & Insights',
    intelligenceAndInsightsSubtitle: 'Satellite · Weather · AI · Financial · Marketplace · Community',
    intelligenceAndAI: 'Intelligence & AI',
    businessAndMarketplace: 'Business & Marketplace',
    communityAndReports: 'Community & Reports',
    settingsAndIntegrations: 'Settings & Integrations',

    // Tools tab
    guidedWorkflows: 'Guided Workflows',
    guidedWorkflowsDesc: 'Step-by-step calculators that solve common farm tasks. Pick a goal and walk through it.',

    // Common actions / buttons
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    saved: 'Saved',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    remove: 'Remove',
    reset: 'Reset',
    export: 'Export',
    exportPDF: 'Export PDF',
    exportCSV: 'Export CSV',
    exportJSON: 'Export JSON',
    print: 'Print',
    copy: 'Copy',
    copied: 'Copied',
    share: 'Share',
    calculate: 'Calculate',
    result: 'Result',
    results: 'Results',
    loading: 'Loading...',
    retry: 'Retry',
    next: 'Next',
    previous: 'Previous',
    finish: 'Finish',
    skip: 'Skip',
    back: 'Back',
    confirm: 'Confirm',
    apply: 'Apply',
    select: 'Select',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    expand: 'Expand',
    collapse: 'Collapse',
    showMore: 'Show More',
    showLess: 'Show Less',

    // Stats / counters
    statsFormulas: 'Formulas',
    statsTools: 'Tools',
    statsAgents: 'AI Specialists',
    statsCrops: 'Crops',
    statsParts: 'Parts',
    statsSections: 'Sections',

    // Footer
    footerVersion: 'Version',
    footerFormulas: 'formulas',
    footerParts: 'parts',
    footerSections: 'sections',

    // Achievements / gamification
    achievements: 'Achievements & Leaderboard',
    achievementsDesc: 'Badges · Levels · Points · Global ranking · Progress tracking',

    // Onboarding / tour
    onboardingWelcome: 'Welcome to Formula Atlas',
    onboardingSkip: 'Skip tour',
    onboardingNext: 'Next',
    onboardingDone: 'Get started',

    // Units
    kgPerHa: 'kg/ha',
    tPerHa: 't/ha',
    m3PerHa: 'm³/ha',
    mmPerDay: 'mm/day',
    literPerHa: 'L/ha',
    days: 'days',
    weeks: 'weeks',
    months: 'months',
    hectares: 'hectares',
    acres: 'acres',

    // Theme toggle
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',

    // Language toggle tooltip
    switchToArabic: 'التبديل إلى العربية',
    switchToEnglish: 'Switch to English',

    // Empty states
    emptyStateTitle: 'Nothing here yet',
    emptyStateSubtitle: 'Start by adding data or running a calculation.',
    emptyStateAction: 'Get started',

    // Errors
    errorGeneric: 'Something went wrong',
    errorRetry: 'Please try again.',
    errorNetwork: 'Network error. Check your connection.',
    errorNotFound: 'Not found',

    // Bookmarks
    bookmarkAdded: 'Added to bookmarks',
    bookmarkRemoved: 'Removed from bookmarks',
    bookmarkEmpty: 'No bookmarks yet — tap the ⭐ on any formula to pin it here.',

    // Formula dialog
    formulaPurpose: 'Purpose',
    formulaVariables: 'Variables',
    formulaExample: 'Example',
    formulaPitfall: 'Common pitfall',
    formulaSource: 'Source',
    formulaReference: 'Reference',
    openCalculator: 'Open Calculator',
    addToBookmarks: 'Add to bookmarks',
    removeFromBookmarks: 'Remove from bookmarks',
    compare: 'Compare',
    relatedFormulas: 'Related formulas',
  },

  ar: {
    // App identity
    appName: 'أطلس المعادلات',
    appSubtitle: 'منصة زراعية مدعومة بالذكاء الاصطناعي',
    appTagline: `${FORMULA_COUNT} معادلة · ${FREE_TOOL_COUNT} أداة مجانية · 10 وكلاء ذكاء · منصة مجانية واحدة`,

    // Top-level navigation tabs
    tabHome: 'الرئيسية',
    tabFormulas: 'المعادلات',
    tabTools: 'الأدوات',
    tabFarm: 'المزرعة',
    tabInsights: 'التحليلات',
    tabAbout: 'حول',

    // Header actions
    takeTour: 'جولة تعريفية',
    installApp: 'تثبيت التطبيق',
    installed: 'مثبّت',
    openLanding: 'الصفحة الرئيسية',
    aboutLink: 'حول',
    browse: 'تصفّح',

    // Command palette / search
    searchPlaceholder: 'ابحث بالاسم أو الرمز أو المعادلة أو الكلمة المفتاحية... (اضغط / للتركيز)',
    searchTitle: 'بحث',
    searchPrompt: 'اكتب أمرًا أو ابحث...',
    searchNoResults: 'لا توجد نتائج',
    searchHint: 'نصيحة: اضغط / للتركيز على البحث، ⌘K لفتح لوحة الأوامر',

    // Formulas tab
    allFormulas: 'كل المعادلات',
    sections: 'الأقسام',
    formulas: 'المعادلات',
    interactiveCalculators: 'الحاسبات التفاعلية',
    ofFormulas: 'من',
    partLabel: 'الجزء',
    sectionLabel: 'القسم',
    calculatorOnly: 'ذات حاسبة فقط',
    clear: 'مسح',
    clearFilters: 'مسح المرشحات',
    noFormulasMatch: 'لا توجد معادلات مطابقة',
    noFormulasMatchDesc: 'حاول إزالة بعض المرشحات أو البحث عن شيء آخر.',
    bookmarkedFormulas: 'المعادلات المعلّمة',

    // Farm tab
    farmManagement: 'إدارة المزرعة',
    farmManagementSubtitle: 'الحقول · المحاصيل · التربة · الماشية · الري · الحماية',
    fieldsAndCrops: 'الحقول والمحاصيل',
    plantProtection: 'الحماية النباتية',
    soilAndLivestock: 'التربة والماشية',
    irrigation: 'الري',

    // Insights tab
    intelligenceAndInsights: 'الذكاء والتحليلات',
    intelligenceAndInsightsSubtitle: 'الأقمار الصناعية · الطقس · الذكاء الاصطناعي · المالية · السوق · المجتمع',
    intelligenceAndAI: 'الذكاء والذكاء الاصطناعي',
    businessAndMarketplace: 'الأعمال والسوق',
    communityAndReports: 'المجتمع والتقارير',
    settingsAndIntegrations: 'الإعدادات والتكاملات',

    // Tools tab
    guidedWorkflows: 'سير العمل الموجّه',
    guidedWorkflowsDesc: 'حاسبات خطوة بخطوة لحل مهام المزرعة الشائعة. اختر هدفًا وابدأ.',

    // Common actions / buttons
    close: 'إغلاق',
    cancel: 'إلغاء',
    save: 'حفظ',
    saved: 'تم الحفظ',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    remove: 'إزالة',
    reset: 'إعادة تعيين',
    export: 'تصدير',
    exportPDF: 'تصدير PDF',
    exportCSV: 'تصدير CSV',
    exportJSON: 'تصدير JSON',
    print: 'طباعة',
    copy: 'نسخ',
    copied: 'تم النسخ',
    share: 'مشاركة',
    calculate: 'احسب',
    result: 'النتيجة',
    results: 'النتائج',
    loading: 'جارٍ التحميل...',
    retry: 'إعادة المحاولة',
    next: 'التالي',
    previous: 'السابق',
    finish: 'إنهاء',
    skip: 'تخطّي',
    back: 'رجوع',
    confirm: 'تأكيد',
    apply: 'تطبيق',
    select: 'اختيار',
    selectAll: 'تحديد الكل',
    deselectAll: 'إلغاء تحديد الكل',
    expand: 'توسيع',
    collapse: 'طي',
    showMore: 'عرض المزيد',
    showLess: 'عرض أقل',

    // Stats / counters
    statsFormulas: 'معادلة',
    statsTools: 'أداة',
    statsAgents: 'وكلاء تخصصيون',
    statsCrops: 'محصول',
    statsParts: 'أجزاء',
    statsSections: 'أقسام',

    // Footer
    footerVersion: 'الإصدار',
    footerFormulas: 'معادلة',
    footerParts: 'أجزاء',
    footerSections: 'أقسام',

    // Achievements / gamification
    achievements: 'الإنجازات ولوحة المتصدرين',
    achievementsDesc: 'الأوسمة · المستويات · النقاط · الترتيب العالمي · تتبع التقدم',

    // Onboarding / tour
    onboardingWelcome: 'مرحبًا بك في أطلس المعادلات',
    onboardingSkip: 'تخطّي الجولة',
    onboardingNext: 'التالي',
    onboardingDone: 'ابدأ الآن',

    // Units
    kgPerHa: 'كغ/هكتار',
    tPerHa: 'طن/هكتار',
    m3PerHa: 'م³/هكتار',
    mmPerDay: 'مم/يوم',
    literPerHa: 'لتر/هكتار',
    days: 'أيام',
    weeks: 'أسابيع',
    months: 'أشهر',
    hectares: 'هكتار',
    acres: 'فدان',

    // Theme toggle
    themeLight: 'فاتح',
    themeDark: 'داكن',
    themeSystem: 'النظام',

    // Language toggle tooltip
    switchToArabic: 'التبديل إلى العربية',
    switchToEnglish: 'التبديل إلى الإنجليزية',

    // Empty states
    emptyStateTitle: 'لا يوجد شيء بعد',
    emptyStateSubtitle: 'ابدأ بإضافة بيانات أو تشغيل حساب.',
    emptyStateAction: 'ابدأ هنا',

    // Errors
    errorGeneric: 'حدث خطأ ما',
    errorRetry: 'يرجى المحاولة مرة أخرى.',
    errorNetwork: 'خطأ في الشبكة. تحقق من اتصالك.',
    errorNotFound: 'غير موجود',

    // Bookmarks
    bookmarkAdded: 'تمت الإضافة إلى المفضلة',
    bookmarkRemoved: 'تمت الإزالة من المفضلة',
    bookmarkEmpty: 'لا توجد إشارات مرجعية بعد — اضغط ⭐ على أي معادلة لتثبيتها هنا.',

    // Formula dialog
    formulaPurpose: 'الغرض',
    formulaVariables: 'المتغيرات',
    formulaExample: 'مثال',
    formulaPitfall: 'مزالق شائعة',
    formulaSource: 'المصدر',
    formulaReference: 'المرجع',
    openCalculator: 'افتح الحاسبة',
    addToBookmarks: 'أضف إلى المفضلة',
    removeFromBookmarks: 'أزل من المفضلة',
    compare: 'قارن',
    relatedFormulas: 'معادلات ذات صلة',
  },
} as const;

export type TranslationKey = keyof typeof uiStrings.en;
export type TranslationDict = typeof uiStrings.en;

/**
 * Returns the translation dictionary for the active language + the
 * language code and a boolean `isRTL` flag for direction switching.
 *
 * Usage:
 *   const { t, language, isRTL } = useTranslation();
 *   <h1>{t.appName}</h1>
 *   <div dir={isRTL ? 'rtl' : 'ltr'}>...</div>
 */
export function useTranslation() {
  const language = useLanguageStore(s => s.language);
  const strings = uiStrings[language];
  return { t: strings, language, isRTL: language === 'ar' };
}
