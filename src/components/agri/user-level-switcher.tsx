'use client';

import { useState } from 'react';
import { Check, ClipboardList, Microscope, Sprout, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from '@/lib/language-store';
import {
  USER_LEVEL_OPTIONS,
  localizedUserLevelCopy,
  useUserLevelStore,
  type UserLevel,
} from '@/lib/user-level';

const ICONS = { sprout: Sprout, clipboard: ClipboardList, microscope: Microscope } as const;

export function UserLevelSwitcher() {
  const [open, setOpen] = useState(false);
  const { language, isRTL } = useTranslation();
  const level = useUserLevelStore(state => state.level);
  const setLevel = useUserLevelStore(state => state.setLevel);
  const current = USER_LEVEL_OPTIONS.find(option => option.id === level) ?? USER_LEVEL_OPTIONS[0];
  const CurrentIcon = ICONS[current.icon];

  const selectLevel = (nextLevel: UserLevel) => {
    setLevel(nextLevel);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-9 gap-1.5 max-w-[190px]"
        aria-label={localizedUserLevelCopy(language, current.copy.name)}
      >
        <CurrentIcon className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
        <span className="hidden md:inline truncate">{localizedUserLevelCopy(language, current.copy.name)}</span>
        <SlidersHorizontal className="h-3 w-3 text-muted-foreground flex-shrink-0" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className={isRTL ? 'text-right' : undefined}>
            <DialogTitle>{language === 'ar' ? 'اختر طريقة استخدامك' : language === 'fr' ? 'Choisissez votre expérience' : 'Choose your FormulaAtlas experience'}</DialogTitle>
            <DialogDescription>
              {language === 'ar'
                ? 'يمكنك تغيير هذا الوضع في أي وقت. لا يتم حذف أي أداة أو بيانات.'
                : language === 'fr'
                  ? 'Vous pouvez changer de mode à tout moment. Aucun outil ni aucune donnée ne sera supprimé.'
                  : 'You can change this mode at any time. No tools or data will be removed.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-3" dir={isRTL ? 'rtl' : 'ltr'}>
            {USER_LEVEL_OPTIONS.map(option => {
              const Icon = ICONS[option.icon];
              const selected = option.id === level;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => selectLevel(option.id)}
                  className={`group relative flex min-h-[190px] flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md ${selected ? 'border-emerald-600 bg-emerald-50/70 shadow-sm dark:border-emerald-500 dark:bg-emerald-950/30' : 'border-border bg-card'}`}
                >
                  {selected && <Check className="absolute right-3 top-3 h-4 w-4 text-emerald-600" />}
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${selected ? 'bg-emerald-600 text-white' : 'bg-muted text-emerald-700 dark:text-emerald-300'}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="space-y-1">
                    <span className="block text-sm font-semibold text-foreground">{localizedUserLevelCopy(language, option.copy.name)}</span>
                    <span className="block text-xs leading-relaxed text-muted-foreground">{localizedUserLevelCopy(language, option.copy.description)}</span>
                  </span>
                  <Badge variant={selected ? 'default' : 'outline'} className="mt-auto text-[10px]">
                    {selected
                      ? (language === 'ar' ? 'الوضع الحالي' : language === 'fr' ? 'Mode actuel' : 'Current mode')
                      : (language === 'ar' ? 'اختيار' : language === 'fr' ? 'Choisir' : 'Select')}
                  </Badge>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
