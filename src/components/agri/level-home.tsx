'use client';

import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CloudSun,
  DollarSign,
  Droplets,
  FileText,
  FlaskConical,
  Microscope,
  Search,
  Sprout,
  Tractor,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FarmStats } from '@/components/agri/farm-stats';
import { HomeDashboard } from '@/components/agri/home-dashboard';
import { TodayTasks } from '@/components/agri/today-tasks';
import { useTranslation } from '@/lib/language-store';
import { getUserLevelOption, localizedUserLevelCopy, type UserLevel } from '@/lib/user-level';

type ExperienceTab = 'home' | 'formulas' | 'tools' | 'farm' | 'simulator' | 'insights' | 'about';

interface LevelHomeProps {
  level: UserLevel;
  onNavigate: (tab: ExperienceTab) => void;
  onOpenTool: (tab: ExperienceTab, storageKey?: string) => void;
  onOpenSearch: () => void;
}

function copy(language: 'en' | 'fr' | 'ar', en: string, fr: string, ar: string) {
  return language === 'ar' ? ar : language === 'fr' ? fr : en;
}

function ActionCard({ icon: Icon, title, description, color, onClick }: { icon: typeof Sprout; title: string; description: string; color: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group flex min-h-[116px] items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: `${color}18`, color }}><Icon className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{description}</span>
      </span>
      <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
    </button>
  );
}

function LevelBanner({ level }: { level: UserLevel }) {
  const { language, isRTL } = useTranslation();
  const option = getUserLevelOption(level);
  const Icon = level === 'farmer' ? Sprout : level === 'manager' ? ClipboardList : Microscope;
  return (
    <section className={`rounded-2xl p-5 text-white shadow-sm sm:p-6 ${level === 'farmer' ? 'bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800' : level === 'manager' ? 'bg-gradient-to-br from-slate-800 via-emerald-900 to-teal-900' : 'bg-gradient-to-br from-indigo-900 via-slate-900 to-emerald-950'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/15"><Icon className="h-5 w-5" /></span>
          <div>
            <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70"><span>{copy(language, 'Your workspace', 'Votre espace de travail', 'مساحة عملك')}</span><Badge className="border-white/20 bg-white/10 text-[9px] text-white hover:bg-white/10">{localizedUserLevelCopy(language, option.copy.name)}</Badge></div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{level === 'farmer' ? copy(language, 'Your farm, one clear next step.', 'Votre ferme, une prochaine étape claire.', 'مزرعتك، وخطوة واحدة واضحة.') : level === 'manager' ? copy(language, 'Run the farm with a clear operating view.', 'Pilotez la ferme avec une vue opérationnelle claire.', 'أدر المزرعة برؤية تشغيلية واضحة.') : copy(language, 'Evidence, tools, and decisions in one workspace.', 'Les preuves, les outils et les décisions dans un seul espace.', 'الأدلة والأدوات والقرارات في مساحة واحدة.')}</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/75">{localizedUserLevelCopy(language, option.copy.promise)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FarmerHome({ onOpenTool, onOpenSearch }: Pick<LevelHomeProps, 'onOpenTool' | 'onOpenSearch'>) {
  const { language, isRTL } = useTranslation();
  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <LevelBanner level="farmer" />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ActionCard icon={CheckCircle2} color="#16a34a" title={copy(language, 'What should I do today?', 'Que faire aujourd’hui ?', 'ماذا أفعل اليوم؟')} description={copy(language, 'See irrigation and crop tasks generated from your saved farm data.', 'Voir les tâches d’irrigation et de culture selon vos données.', 'اعرض مهام الري والمحصول حسب بيانات مزرعتك.')} onClick={() => onOpenTool('farm', 'collapse_field_records')} />
        <ActionCard icon={Search} color="#0891b2" title={copy(language, 'Check a field problem', 'Vérifier un problème au champ', 'افحص مشكلة في الحقل')} description={copy(language, 'Use a photo or observation to start a safer scouting workflow.', 'Commencer une prospection guidée avec une photo ou une observation.', 'ابدأ كشفاً موجهاً بصورة أو ملاحظة.')} onClick={() => onOpenTool('farm')} />
        <ActionCard icon={Droplets} color="#0284c7" title={copy(language, 'Plan irrigation', 'Planifier l’irrigation', 'خطّط للري')} description={copy(language, 'Open the practical irrigation program and water-planning tools.', 'Ouvrir les outils pratiques de programme et de planification.', 'افتح أدوات برنامج الري والتخطيط المائي.')} onClick={() => onOpenTool('farm', 'collapse_irrigation')} />
        <ActionCard icon={BookOpen} color="#047857" title={copy(language, 'Record an activity', 'Enregistrer une activité', 'سجّل نشاطاً')} description={copy(language, 'Keep one traceable record for inputs, irrigation, scouting, and harvest.', 'Conserver une trace des intrants, du pompage, de la prospection et de la récolte.', 'احتفظ بسجل للمدخلات والري والكشف والحصاد.')} onClick={() => onOpenTool('farm', 'collapse_field_records')} />
        <ActionCard icon={CalendarDays} color="#7c3aed" title={copy(language, 'Plan one crop', 'Planifier une culture', 'خطّط لمحصول')} description={copy(language, 'Generate a crop calendar with tasks, fertilization, irrigation, and labor.', 'Générer un calendrier avec tâches, fertilisation, irrigation et main-d’œuvre.', 'ولّد تقويماً للمحصول مع المهام والتسميد والري والعمالة.')} onClick={() => onOpenTool('farm', 'crop_calendar_gen')} />
        <ActionCard icon={FlaskConical} color="#f59e0b" title={copy(language, 'See cost and sale price', 'Voir le coût et le prix de vente', 'اعرف التكلفة وسعر البيع')} description={copy(language, 'Run a real-world crop scenario in DZD with costs, yield, price, and risks.', 'Simuler une culture en DZD avec coûts, rendement, prix et risques.', 'حاكِ محصولاً بالدينار مع التكاليف والإنتاج والسعر والمخاطر.')} onClick={() => onOpenTool('simulator')} />
      </section>
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{copy(language, 'Today on your farm', 'Aujourd’hui dans votre ferme', 'اليوم في مزرعتك')}</CardTitle></CardHeader>
          <CardContent><TodayTasks onOpenTool={onOpenTool} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><Tractor className="h-4 w-4 text-emerald-600" />{copy(language, 'Farm at a glance', 'Votre ferme en un coup d’œil', 'مزرعتك في لمحة')}</CardTitle></CardHeader>
          <CardContent><FarmStats /></CardContent>
        </Card>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 p-4 dark:bg-emerald-950/20">
        <div><p className="text-sm font-semibold">{copy(language, 'Need a different tool?', 'Besoin d’un autre outil ?', 'هل تحتاج أداة أخرى؟')}</p><p className="text-xs text-muted-foreground">{copy(language, 'Search the full library when you are ready. Advanced tools stay available.', 'Recherchez dans toute la bibliothèque quand vous êtes prêt. Les outils avancés restent disponibles.', 'ابحث في المكتبة الكاملة عندما تكون مستعداً. الأدوات المتقدمة ما زالت متاحة.')}</p></div>
        <Button variant="outline" size="sm" onClick={onOpenSearch} className="gap-1.5"><Wrench className="h-3.5 w-3.5" />{copy(language, 'Browse more tools', 'Parcourir plus d’outils', 'تصفح المزيد من الأدوات')}</Button>
      </div>
    </div>
  );
}

function ManagerHome({ onOpenTool, onOpenSearch }: Pick<LevelHomeProps, 'onOpenTool' | 'onOpenSearch'>) {
  const { language, isRTL } = useTranslation();
  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <LevelBanner level="manager" />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard icon={DollarSign} color="#f59e0b" title={copy(language, 'Costs and margin', 'Coûts et marge', 'التكاليف والهامش')} description={copy(language, 'Review spend, revenue, break-even, and what-if scenarios.', 'Suivre les dépenses, revenus, seuil de rentabilité et scénarios.', 'راجع التكاليف والإيرادات ونقطة التعادل والسيناريوهات.')} onClick={() => onOpenTool('insights', 'collapse_financial')} />
        <ActionCard icon={CalendarDays} color="#7c3aed" title={copy(language, 'Season and labor', 'Saison et main-d’œuvre', 'الموسم والعمالة')} description={copy(language, 'Coordinate crop milestones, labor demand, and harvest windows.', 'Coordonner les étapes, la main-d’œuvre et les fenêtres de récolte.', 'نسّق مراحل المحصول والعمالة ومواعيد الحصاد.')} onClick={() => onOpenTool('farm', 'crop_calendar_gen')} />
        <ActionCard icon={Droplets} color="#0284c7" title={copy(language, 'Water operations', 'Opérations hydriques', 'عمليات المياه')} description={copy(language, 'Open irrigation planning, ET, weather, and water-budget views.', 'Ouvrir les vues d’irrigation, ET, météo et budget hydrique.', 'افتح تخطيط الري والتبخر والطقس وميزانية المياه.')} onClick={() => onOpenTool('farm', 'collapse_irrigation')} />
        <ActionCard icon={FileText} color="#047857" title={copy(language, 'Farm records', 'Registres de ferme', 'سجلات المزرعة')} description={copy(language, 'Keep a traceable history of field decisions and operations.', 'Conserver l’historique traçable des décisions et opérations.', 'احتفظ بتاريخ قابل للتتبع لقرارات وعمليات الحقل.')} onClick={() => onOpenTool('farm', 'collapse_field_records')} />
      </section>
      <HomeDashboard onNavigate={(tab) => onOpenTool(tab)} onOpenTool={onOpenTool} onOpenSearch={onOpenSearch} />
    </div>
  );
}

function ProfessionalHome({ onOpenTool, onOpenSearch }: Pick<LevelHomeProps, 'onOpenTool' | 'onOpenSearch'>) {
  const { language, isRTL } = useTranslation();
  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <LevelBanner level="professional" />
      <div className="grid gap-3 sm:grid-cols-3">
        <ActionCard icon={Microscope} color="#4f46e5" title={copy(language, 'Diagnose with evidence', 'Diagnostiquer avec preuves', 'شخّص بالدليل')} description={copy(language, 'Combine scouting, disease references, crop context, and safety gates.', 'Combiner prospection, références maladies, contexte et sécurité.', 'اجمع الكشف ومراجع الأمراض وسياق المحصول وحواجز السلامة.')} onClick={() => onOpenTool('farm')} />
        <ActionCard icon={TrendingUp} color="#0891b2" title={copy(language, 'Analyze field signals', 'Analyser les signaux de parcelle', 'حلّل مؤشرات الحقل')} description={copy(language, 'Review satellite, weather, drought, and water-productivity signals.', 'Examiner satellite, météo, sécheresse et productivité de l’eau.', 'راجع الأقمار الصناعية والطقس والجفاف وإنتاجية المياه.')} onClick={() => onOpenTool('insights')} />
        <ActionCard icon={FileText} color="#7c3aed" title={copy(language, 'Prepare a professional report', 'Préparer un rapport professionnel', 'حضّر تقريراً مهنياً')} description={copy(language, 'Combine field, soil, financial, and crop-plan evidence into an exportable report.', 'Regrouper les données de parcelle, sol, finances et plan cultural.', 'اجمع بيانات الحقل والتربة والمال وخطة المحصول في تقرير قابل للتصدير.')} onClick={() => onOpenTool('insights', 'collapse_report')} />
      </div>
      <HomeDashboard onNavigate={(tab) => onOpenTool(tab)} onOpenTool={onOpenTool} onOpenSearch={onOpenSearch} />
    </div>
  );
}

export function LevelHome({ level, onNavigate, onOpenTool, onOpenSearch }: LevelHomeProps) {
  if (level === 'farmer') return <FarmerHome onOpenTool={onOpenTool} onOpenSearch={onOpenSearch} />;
  if (level === 'manager') return <ManagerHome onOpenTool={onOpenTool} onOpenSearch={onOpenSearch} />;
  return <ProfessionalHome onOpenTool={onOpenTool} onOpenSearch={onOpenSearch} />;
}
