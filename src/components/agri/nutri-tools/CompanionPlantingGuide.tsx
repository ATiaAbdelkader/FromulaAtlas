'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sprout, Search } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';

const PLANT_AR: Record<string, string> = {
  Tomato: 'طماطم', Basil: 'ريحان', Asparagus: 'هليون', Carrot: 'جزر', Parsley: 'بقدونس',
  Marigold: 'قطيفة', Nasturtium: 'أبو خنجر', Garlic: 'ثوم', Onion: 'بصل', Cabbage: 'ملفوف',
  Broccoli: 'بروكلي', Fennel: 'شمر', Corn: 'ذرة', Pepper: 'فلفل', Sage: 'مريمية', Lettuce: 'خس',
  Radish: 'فجل', Strawberry: 'فراولة', Cucumber: 'خيار', Beans: 'فاصوليا', Peas: 'بازلاء',
  Squash: 'قرع', Sunflower: 'دوار الشمس', Potato: 'بطاطا', Horseradish: 'فجل حار',
  Chamomile: 'بابونج', Roses: 'ورد', 'Fruit trees': 'أشجار فاكهة', Spinach: 'سبانخ', Thyme: 'زعتر',
  Borage: 'لسان الثور', Dill: 'شبت', Parsnip: 'جزر أبيض', Leek: 'كراث', 'Aromatic herbs': 'أعشاب عطرية',
  Hyssop: 'زوفا', Turnip: 'لفت', Mint: 'نعناع', Rosemary: 'إكليل الجبل', Pumpkin: 'يقطين',
};

function plantLabel(language: Parameters<typeof copyFor>[0], name: string): string {
  return copyFor(language, name, PLANT_AR[name] || name);
}

const COMPANIONS: { crop: string; emoji: string; helps: string[]; helpedBy: string[]; avoid: string[] }[] = [
  { crop: 'Tomato', emoji: '🍅', helps: ['Basil', 'Asparagus', 'Carrot', 'Parsley'], helpedBy: ['Basil', 'Marigold', 'Nasturtium', 'Garlic', 'Onion'], avoid: ['Cabbage', 'Broccoli', 'Fennel', 'Corn'] },
  { crop: 'Basil', emoji: '🌿', helps: ['Tomato', 'Pepper'], helpedBy: ['Tomato'], avoid: ['Sage'] },
  { crop: 'Carrot', emoji: '🥕', helps: ['Tomato', 'Lettuce', 'Onion', 'Rosemary'], helpedBy: ['Onion', 'Rosemary', 'Sage', 'Leek'], avoid: ['Dill', 'Parsnip'] },
  { crop: 'Lettuce', emoji: '🥬', helps: ['Carrot', 'Radish', 'Strawberry'], helpedBy: ['Carrot', 'Radish', 'Cucumber', 'Strawberry'], avoid: ['Broccoli', 'Cabbage'] },
  { crop: 'Cucumber', emoji: '🥒', helps: ['Beans', 'Corn', 'Radish', 'Sunflower'], helpedBy: ['Beans', 'Corn', 'Peas', 'Radish', 'Sunflower'], avoid: ['Sage', 'Potato', 'Aromatic herbs'] },
  { crop: 'Beans', emoji: '🫘', helps: ['Corn', 'Cucumber', 'Squash', 'Strawberry'], helpedBy: ['Corn', 'Cucumber', 'Squash', 'Carrot', 'Strawberry'], avoid: ['Onion', 'Garlic', 'Pepper'] },
  { crop: 'Corn', emoji: '🌽', helps: ['Beans', 'Cucumber', 'Squash', 'Pumpkin'], helpedBy: ['Beans', 'Cucumber', 'Squash', 'Sunflower'], avoid: ['Tomato'] },
  { crop: 'Potato', emoji: '🥔', helps: ['Beans', 'Corn', 'Cabbage'], helpedBy: ['Beans', 'Corn', 'Horseradish', 'Marigold'], avoid: ['Tomato', 'Cucumber', 'Squash', 'Sunflower'] },
  { crop: 'Pepper', emoji: '🫑', helps: ['Basil', 'Onion', 'Carrot'], helpedBy: ['Basil', 'Onion', 'Carrot'], avoid: ['Beans', 'Cabbage'] },
  { crop: 'Squash', emoji: '🎃', helps: ['Beans', 'Corn', 'Radish'], helpedBy: ['Beans', 'Corn', 'Nasturtium', 'Marigold'], avoid: ['Potato'] },
  { crop: 'Onion', emoji: '🧅', helps: ['Carrot', 'Tomato', 'Pepper', 'Lettuce'], helpedBy: ['Carrot', 'Tomato', 'Pepper', 'Chamomile'], avoid: ['Beans', 'Peas', 'Asparagus'] },
  { crop: 'Garlic', emoji: '🧄', helps: ['Tomato', 'Roses', 'Fruit trees', 'Strawberry'], helpedBy: ['Tomato', 'Carrot'], avoid: ['Beans', 'Peas'] },
  { crop: 'Strawberry', emoji: '🍓', helps: ['Borage', 'Lettuce', 'Spinach'], helpedBy: ['Beans', 'Onion', 'Garlic', 'Spinach', 'Thyme'], avoid: ['Cabbage', 'Broccoli'] },
  { crop: 'Marigold', emoji: '🌼', helps: ['Tomato', 'Potato', 'Beans', 'Squash', 'Cucumber'], helpedBy: [], avoid: [] },
  { crop: 'Radish', emoji: '🟠', helps: ['Cucumber', 'Lettuce', 'Squash'], helpedBy: ['Cucumber', 'Lettuce', 'Nasturtium'], avoid: ['Hyssop'] },
  { crop: 'Cabbage', emoji: '🥬', helps: ['Beans', 'Cucumber'], helpedBy: ['Dill', 'Onion', 'Garlic', 'Mint', 'Thyme', 'Sage'], avoid: ['Tomato', 'Pepper', 'Strawberry', 'Broccoli'] },
  { crop: 'Spinach', emoji: '🥗', helps: ['Strawberry', 'Beans', 'Peas'], helpedBy: ['Strawberry', 'Radish', 'Cabbage'], avoid: [] },
  { crop: 'Peas', emoji: '🫛', helps: ['Beans', 'Corn', 'Cucumber', 'Carrot'], helpedBy: ['Carrot', 'Turnip', 'Radish'], avoid: ['Onion', 'Garlic'] },
  { crop: 'Broccoli', emoji: '🥦', helps: ['Beans', 'Onion', 'Potato'], helpedBy: ['Dill', 'Garlic', 'Onion', 'Mint', 'Rosemary', 'Potato'], avoid: ['Tomato', 'Strawberry', 'Cabbage'] },
  { crop: 'Pumpkin', emoji: '🎃', helps: ['Corn', 'Beans'], helpedBy: ['Corn', 'Beans', 'Marigold', 'Nasturtium'], avoid: ['Potato'] },
];

export function CompanionPlantingGuide() {
  const { language } = useTranslation();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return COMPANIONS;
    const q = search.toLowerCase();
    return COMPANIONS.filter(c => c.crop.toLowerCase().includes(q) || c.helps.some(h => h.toLowerCase().includes(q)) || c.helpedBy.some(h => h.toLowerCase().includes(q)) || c.avoid.some(a => a.toLowerCase().includes(q)));
  }, [search]);

  return (
    <Card className="overflow-hidden border-lime-200/60 shadow-sm dark:border-lime-900/60">
      <CardHeader className="border-b bg-gradient-to-r from-lime-50 via-background to-emerald-50/50 pb-4 dark:from-lime-950/30 dark:via-background dark:to-emerald-950/20">
        <CardTitle className="text-base flex items-center gap-2">
          <Sprout className="h-4 w-4 text-emerald-600" /> {copyFor(language, 'Companion Planting Guide', 'دليل الزراعة المصاحبة')}
        </CardTitle>
        <p className="text-xs leading-relaxed text-muted-foreground">{copyFor(language, '20 crops · 100+ pairings · synergy (✓) · antagonism (✗) · search any crop', '20 محصولاً · أكثر من 100 علاقة · توافق (✓) · تعارض (✗) · ابحث عن أي محصول')}</p>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label={copyFor(language, 'Search crop or companion', 'ابحث عن محصول أو نبات مصاحب')} value={search} onChange={e => setSearch(e.target.value)} placeholder={copyFor(language, 'Search crop or companion…', 'ابحث عن محصول أو نبات مصاحب…')} className="h-10 pl-9 text-sm" />
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{search ? copyFor(language, `Showing matches for “${search}”`, `نتائج البحث عن “${search}”`) : copyFor(language, 'Browse all crop relationships', 'تصفح جميع علاقات المحاصيل')}</span>
            <Badge variant="secondary" className="shrink-0">{filtered.length} {copyFor(language, 'of', 'من')} {COMPANIONS.length}</Badge>
          </div>
        </div>
        <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
          {filtered.length === 0 && (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              {copyFor(language, 'No crop or companion matches. Try a different name.', 'لا توجد نتائج لمحصول أو نبات مصاحب. جرّب اسماً مختلفاً.')}
            </div>
          )}
          {filtered.map(c => (
            <div key={c.crop} className="rounded-xl border bg-background p-3 shadow-sm transition-colors hover:border-lime-300 dark:hover:border-lime-800">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-50 text-lg dark:bg-lime-950/30">{c.emoji}</span>
                <div>
                  <div className="text-sm font-semibold">{plantLabel(language, c.crop)}</div>
                  <div className="text-[10px] text-muted-foreground">{copyFor(language, 'Companion relationships', 'علاقات النباتات المصاحبة')}</div>
                </div>
              </div>
              {c.helps.length > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] mb-1">
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[9px] border-0">{copyFor(language, 'Helps ✓', 'يفيد ✓')}</Badge>
                  <span className="leading-relaxed text-muted-foreground">{c.helps.map(name => plantLabel(language, name)).join(', ')}</span>
                </div>
              )}
              {c.helpedBy.length > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] mb-1">
                  <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 text-[9px] border-0">{copyFor(language, 'Helped by ↑', 'يفيده ↑')}</Badge>
                  <span className="leading-relaxed text-muted-foreground">{c.helpedBy.map(name => plantLabel(language, name)).join(', ')}</span>
                </div>
              )}
              {c.avoid.length > 0 && (
                <div className="flex items-center gap-1.5 text-[10px]">
                  <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-[9px] border-0">{copyFor(language, 'Avoid ✗', 'تجنّب ✗')}</Badge>
                  <span className="leading-relaxed text-muted-foreground">{c.avoid.map(name => plantLabel(language, name)).join(', ')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="rounded-xl border bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
          💡 {copyFor(language, 'Companion planting uses plant synergies (pest repulsion, N fixation, pollinator attraction) + avoids antagonisms (allelopathy, shared pests, nutrient competition).', 'تستفيد الزراعة المصاحبة من تكامل النباتات (طرد الآفات وتثبيت النيتروجين وجذب الملقحات) وتتجنب التعارضات (الأليلوباثي والآفات المشتركة والتنافس على العناصر الغذائية).')}
        </div>
      </CardContent>
    </Card>
  );
}
