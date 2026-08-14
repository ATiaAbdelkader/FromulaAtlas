import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserLevel = 'farmer' | 'manager' | 'professional';

export interface UserLevelCopy {
  en: string;
  fr: string;
  ar: string;
}

export interface UserLevelOption {
  id: UserLevel;
  icon: 'sprout' | 'clipboard' | 'microscope';
  copy: {
    name: UserLevelCopy;
    description: UserLevelCopy;
    promise: UserLevelCopy;
  };
}

export const USER_LEVEL_OPTIONS: UserLevelOption[] = [
  {
    id: 'farmer',
    icon: 'sprout',
    copy: {
      name: { en: 'Farmer Mode', fr: 'Mode agriculteur', ar: 'وضع المزارع' },
      description: {
        en: 'Simple daily actions for the field.',
        fr: 'Des actions quotidiennes simples pour la parcelle.',
        ar: 'إجراءات يومية بسيطة للحقل.',
      },
      promise: {
        en: 'See what to do today, record work, check a field, and plan one crop.',
        fr: 'Voyez quoi faire aujourd’hui, notez le travail, vérifiez une parcelle et planifiez une culture.',
        ar: 'اعرف ما يجب فعله اليوم، وسجّل العمل، وافحص الحقل، وخطّط لمحصول واحد.',
      },
    },
  },
  {
    id: 'manager',
    icon: 'clipboard',
    copy: {
      name: { en: 'Farm Manager Mode', fr: 'Mode gestionnaire de ferme', ar: 'وضع مدير المزرعة' },
      description: {
        en: 'Coordinate fields, money, people, and production.',
        fr: 'Coordonnez les parcelles, les coûts, les équipes et la production.',
        ar: 'نسّق الحقول والتكاليف والعمال والإنتاج.',
      },
      promise: {
        en: 'Run the farm with budgets, calendars, labor, irrigation, harvest, and risk views.',
        fr: 'Gérez la ferme avec les budgets, calendriers, équipes, irrigation, récolte et risques.',
        ar: 'أدر المزرعة بالميزانيات والتقويمات والعمالة والري والحصاد والمخاطر.',
      },
    },
  },
  {
    id: 'professional',
    icon: 'microscope',
    copy: {
      name: { en: 'Agronomist / Professional', fr: 'Agronome / professionnel', ar: 'المهندس الزراعي / المحترف' },
      description: {
        en: 'Full technical workspace with evidence and formulas.',
        fr: 'Espace technique complet avec preuves et formules.',
        ar: 'مساحة تقنية كاملة مع الأدلة والمعادلات.',
      },
      promise: {
        en: 'Access the complete library, diagnostics, source-backed plans, AI specialists, and reports.',
        fr: 'Accédez à toute la bibliothèque, aux diagnostics, aux plans sourcés, aux spécialistes IA et aux rapports.',
        ar: 'استخدم المكتبة الكاملة والتشخيصات والخطط الموثقة ومختصي الذكاء الاصطناعي والتقارير.',
      },
    },
  },
];

export const USER_LEVEL_LABELS: Record<UserLevel, UserLevelCopy> = Object.fromEntries(
  USER_LEVEL_OPTIONS.map(option => [option.id, option.copy.name])
) as Record<UserLevel, UserLevelCopy>;

interface UserLevelState {
  level: UserLevel;
  setLevel: (level: UserLevel) => void;
}

export const useUserLevelStore = create<UserLevelState>()(
  persist(
    (set) => ({
      level: 'farmer',
      setLevel: (level) => set({ level }),
    }),
    {
      name: 'formula-atlas-user-level',
      version: 1,
    },
  ),
);

export function getUserLevelTabs(level: UserLevel): Array<'home' | 'formulas' | 'tools' | 'farm' | 'simulator' | 'insights' | 'about'> {
  if (level === 'farmer') return ['home', 'farm', 'simulator', 'about'];
  if (level === 'manager') return ['home', 'farm', 'simulator', 'insights', 'tools', 'about'];
  return ['home', 'formulas', 'tools', 'farm', 'simulator', 'insights', 'about'];
}

export function getUserLevelOption(level: UserLevel): UserLevelOption {
  return USER_LEVEL_OPTIONS.find(option => option.id === level) ?? USER_LEVEL_OPTIONS[0];
}

export function localizedUserLevelCopy(language: 'en' | 'fr' | 'ar', copy: UserLevelCopy): string {
  return copy[language];
}
