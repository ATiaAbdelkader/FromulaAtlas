'use client';

import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, Flame, Zap, Target, Crown,
  Lock, CheckCircle2, Sparkles, RotateCcw,
} from 'lucide-react';
import {
  getGamificationState, getLeaderboard, LEVELS,
  type Badge as GameBadge, type AchievementStats,
} from '@/lib/gamification-store';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell, type TrilingualString, type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

const CATEGORY_META: Record<string, { en: string; ar: string; fr: string; color: string; emoji: string }> = {
  tools:          { en: 'Tools',          ar: 'الأدوات',       fr: 'Outils',          color: '#16a34a', emoji: '🔧' },
  sustainability: { en: 'Sustainability', ar: 'الاستدامة',     fr: 'Durabilité',      color: '#0ea5e9', emoji: '🌿' },
  community:      { en: 'Community',      ar: 'المجتمع',        fr: 'Communauté',      color: '#3b82f6', emoji: '👥' },
  planning:       { en: 'Planning',       ar: 'التخطيط',        fr: 'Planification',   color: '#f59e0b', emoji: '📅' },
  milestone:      { en: 'Milestones',     ar: 'محطات',          fr: 'Étapes',          color: '#8b5cf6', emoji: '🏆' },
};

const TITLE: TrilingualString = {
  en: 'Gamification Panel',
  ar: 'لوحة التحصيل',
  fr: 'Panneau de Gamification',
};

const DESC: TrilingualString = {
  en: 'Earn badges, level up, and compete on the global leaderboard by using farm tools, posting in the community, and tracking your agronomy.',
  ar: 'اكسب الأوسمة، ارتقِ بالمستوى، وتنافس على لوحة المتصدّرين العالمية باستخدام أدوات المزرعة والنشر في المجتمع وتتبّع زراعتك.',
  fr: 'Gagnez des badges, montez en niveau et rivalisez sur le classement mondial en utilisant les outils, en publiant et en suivant votre agronomie.',
};

const PILL_LABEL: TrilingualString = { en: 'Filter badges:', ar: 'تصفية الأوسمة:', fr: 'Filtrer :' };

export function GamificationPanel() {
  const [badges, setBadges] = useState<GameBadge[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  useEffect(() => {
    // Load state + auto-detect achievements from other stores
    let { badges: loadedBadges, stats: loadedStats } = getGamificationState();

    // Auto-check: tools used (from recently used)
    try {
      const recent = JSON.parse(localStorage.getItem('nutriplant_tools_recent_v1') || '[]');
      const favs = JSON.parse(localStorage.getItem('nutriplant_tools_favorites_v1') || '[]');
      const uniqueTools = new Set([...recent, ...favs]);
      if (uniqueTools.size > 0) loadedBadges = updateBadge(loadedBadges, 'first_tool', uniqueTools.size, 1);
      if (uniqueTools.size >= 5) loadedBadges = updateBadge(loadedBadges, 'tool_explorer', uniqueTools.size, 5);
      if (uniqueTools.size >= 18) loadedBadges = updateBadge(loadedBadges, 'tool_master', uniqueTools.size, 18);
      loadedStats = { ...loadedStats, toolsUsed: uniqueTools.size };
    } catch { /* ignore */ }

    // Auto-check: scouting entries
    try {
      const scouting = JSON.parse(localStorage.getItem('nutriplant_scout_log_v1') || '[]');
      if (scouting.length >= 1) loadedBadges = updateBadge(loadedBadges, 'scout_10', scouting.length, 10);
      loadedStats = { ...loadedStats, scoutingEntries: scouting.length };
    } catch { /* ignore */ }

    // Auto-check: community posts
    try {
      const posts = JSON.parse(localStorage.getItem('nutriplant_community_posts_v1') || '[]');
      const userPosts = posts.filter((p: any) => p.author === 'You' || p.author === (JSON.parse(localStorage.getItem('nutriplant_community_profile_v1') || '{}').name));
      if (userPosts.length >= 1) loadedBadges = updateBadge(loadedBadges, 'first_post', userPosts.length, 1);
      loadedStats = { ...loadedStats, communityPosts: userPosts.length };
    } catch { /* ignore */ }

    // Auto-check: soil test history
    try {
      const soil = JSON.parse(localStorage.getItem('nutriplant_soil_history_v1') || '[]');
      if (soil.length >= 3) loadedBadges = updateBadge(loadedBadges, 'soil_tracker', soil.length, 3);
    } catch { /* ignore */ }

    // Recalculate stats
    const earnedBadges = loadedBadges.filter(b => b.earned).length;
    const totalPoints = loadedBadges.filter(b => b.earned).reduce((sum, b) => sum + getPoints(b.id), 0);
    const level = LEVELS.filter(l => totalPoints >= l.minPoints).pop() || LEVELS[0];
    const nextLevel = LEVELS.find(l => l.level === level.level + 1);
    loadedStats = {
      ...loadedStats, earnedBadges, totalPoints,
      level: level.level, levelTitle: level.title,
      nextLevelPoints: nextLevel ? nextLevel.minPoints : totalPoints,
      progressToNext: nextLevel ? Math.round(((totalPoints - level.minPoints) / (nextLevel.minPoints - level.minPoints)) * 100) : 100,
    };

    setBadges(loadedBadges);
    setStats(loadedStats);
  }, []);

  const leaderboard = useMemo(() => {
    if (!stats) return [];
    const profile = (() => { try { return JSON.parse(localStorage.getItem('nutriplant_community_profile_v1') || '{}'); } catch { return {}; } })();
    return getLeaderboard(stats.totalPoints, stats.earnedBadges, stats.level, profile.crops?.[0] || '', profile.region || '');
  }, [stats]);

  const filteredBadges = activeCategory === 'all' ? badges : badges.filter(b => b.category === activeCategory);
  const earnedCount = badges.filter(b => b.earned).length;

  const pills: CalculatorPill[] = [
    { key: 'all', emoji: '🏆', label: tr('All Badges', 'كل الأوسمة', 'Tous') },
    ...Object.entries(CATEGORY_META).map(([k, m]) => ({
      key: k,
      emoji: m.emoji,
      label: tr(m.en, m.ar, m.fr),
    })),
  ];

  const handleReset = () => {
    setActiveCategory('all');
    toast({ title: tr('Filter reset', 'تمت إعادة التعيين', 'Filtre réinitialisé') });
  };

  if (!stats) return null;

  const userRank = leaderboard.find(e => e.isYou)?.rank || '—';

  return (
    <CalculatorShell
      icon={Trophy}
      title={TITLE}
      description={DESC}
      badge={`${earnedCount}/${stats.totalBadges} ${tr('badges', 'أوسمة', 'badges')}`}
      accent="amber"
      actions={[
        {
          icon: RotateCcw,
          label: { en: 'Reset Filter', ar: 'إعادة التعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      pills={pills}
      activePill={activeCategory}
      onPillClick={setActiveCategory}
      pillLabel={PILL_LABEL}
    >
      <div className="lg:col-span-12 space-y-4">
        {/* Level + Points header */}
        <div className="rounded-xl p-4 bg-gradient-to-br from-amber-600 via-orange-600 to-rose-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-white/20 backdrop-blur text-2xl font-bold">
                {stats.level}
              </div>
              <div>
                <div className="text-lg font-bold">{stats.levelTitle}</div>
                <div className="text-xs text-amber-100">{tr(`Level ${stats.level} · ${stats.totalPoints} points`, `المستوى ${stats.level} · ${stats.totalPoints} نقطة`, `Niveau ${stats.level} · ${stats.totalPoints} pts`)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{earnedCount}<span className="text-sm font-normal text-amber-200">/{stats.totalBadges}</span></div>
              <div className="text-xs text-amber-100">{tr('Badges earned', 'أوسمة مكتسبة', 'Badges obtenus')}</div>
            </div>
          </div>
          {/* Level progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-amber-100 mb-1">
              <span>{tr(`Lvl ${stats.level}`, `مستوى ${stats.level}`, `Niv. ${stats.level}`)}</span>
              <span>{tr(`${stats.progressToNext}% to Lvl ${stats.level + 1}`, `${stats.progressToNext}% للمستوى ${stats.level + 1}`, `${stats.progressToNext}% → Niv. ${stats.level + 1}`)}</span>
              <span>{stats.nextLevelPoints} {tr('pts', 'نقطة', 'pts')}</span>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-white" style={{ width: `${stats.progressToNext}%` }} />
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <QuickStat icon={Trophy} label={tr('Rank', 'الترتيب', 'Rang')} value={`#${userRank}`} color="#f59e0b" />
          <QuickStat icon={Flame} label={tr('Streak', 'السلسلة', 'Série')} value={`${stats.streak}${isRTL ? 'ي' : tr('d', 'ي', 'j')}`} color="#dc2626" />
          <QuickStat icon={Zap} label={tr('Tools used', 'أدوات مستخدمة', 'Outils utilisés')} value={String(stats.toolsUsed)} color="#16a34a" />
          <QuickStat icon={Target} label={tr('Points', 'نقاط', 'Points')} value={String(stats.totalPoints)} color="#7c3aed" />
        </div>

        {/* Badge grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {filteredBadges.map(badge => {
            const catMeta = CATEGORY_META[badge.category];
            return (
              <div
                key={badge.id}
                className={`rounded-lg p-3 border-2 text-center transition-all ${badge.earned ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20' : 'border-border bg-muted/20 opacity-60'}`}
              >
                <div className={`text-3xl mb-1 ${badge.earned ? '' : 'grayscale'}`}>
                  {badge.earned ? badge.emoji : '🔒'}
                </div>
                <div className="text-xs font-semibold leading-tight">{badge.name}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{badge.description}</div>
                {badge.earned ? (
                  <Badge variant="outline" className="text-[8px] mt-1 text-amber-600 border-amber-300 gap-0.5">
                    <CheckCircle2 className="h-2 w-2" /> {tr('Earned', 'مكتسبة', 'Obtenu')}
                  </Badge>
                ) : badge.progress != null && badge.progress > 0 ? (
                  <div className="mt-1">
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${badge.progress}%`, background: catMeta.color }} />
                    </div>
                    <div className="text-[8px] text-muted-foreground mt-0.5">{badge.current}/{badge.target}</div>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-[8px] mt-1 text-muted-foreground gap-0.5">
                    <Lock className="h-2 w-2" /> {getPoints(badge.id)} {tr('pts', 'نقطة', 'pts')}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Leaderboard */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5 text-amber-500" /> {tr('Global Leaderboard', 'لوحة المتصدّرين العالمية', 'Classement mondial')}
          </div>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {leaderboard.slice(0, 10).map(entry => (
              <div
                key={entry.rank}
                className={`flex items-center gap-2 rounded-lg p-2 border ${entry.isYou ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20' : 'border-border bg-card'}`}
              >
                <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold flex-shrink-0 ${
                  entry.rank === 1 ? 'bg-amber-100 text-amber-700' :
                  entry.rank === 2 ? 'bg-slate-100 text-slate-700' :
                  entry.rank === 3 ? 'bg-orange-100 text-orange-700' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {entry.rank <= 3 ? <Trophy className="h-3.5 w-3.5" /> : entry.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold flex items-center gap-1">
                    {entry.name}
                    {entry.isYou && <Badge variant="outline" className="text-[8px] px-1 py-0 text-amber-600 border-amber-300">{tr('You', 'أنت', 'Vous')}</Badge>}
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    {tr(`Lvl ${entry.level} · ${entry.badgeCount} badges`, `مستوى ${entry.level} · ${entry.badgeCount} أوسمة`, `Niv. ${entry.level} · ${entry.badgeCount} badges`)}{entry.crop && ` · ${entry.crop}`}{entry.region && ` · ${entry.region}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-amber-600">{entry.points}</div>
                  <div className="text-[8px] text-muted-foreground">{tr('pts', 'نقطة', 'pts')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How to earn points */}
        <div className="rounded-lg p-3 border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> {tr('How to Earn Points', 'كيف تكسب النقاط', 'Comment gagner des points')}
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] text-muted-foreground">
            <div>• {tr('Open tools → +10 pts', 'فتح أدوات → +10 نقاط', 'Ouvrir outils → +10 pts')}</div>
            <div>• {tr('Run calculations → +50 pts', 'تشغيل الحسابات → +50 نقطة', 'Calculs → +50 pts')}</div>
            <div>• {tr('Generate reports → +40 pts', 'إنشاء تقارير → +40 نقطة', 'Rapports → +40 pts')}</div>
            <div>• {tr('Post in community → +20 pts', 'النشر في المجتمع → +20 نقطة', 'Publier → +20 pts')}</div>
            <div>• {tr('Log scouting → +30 pts', 'تسجيل الكشف → +30 نقطة', 'Scout → +30 pts')}</div>
            <div>• {tr('Track soil tests → +40 pts', 'تتبع تحاليل التربة → +40 نقطة', 'Analyses sol → +40 pts')}</div>
            <div>• {tr('Achieve NUE > 70% → +50 pts', 'تحقيق كفاءة استخدام نيتروجين > 70% → +50 نقطة', 'NUE > 70% → +50 pts')}</div>
            <div>• {tr('7-day streak → +30 pts', 'سلسلة 7 أيام → +30 نقطة', 'Série 7 jours → +30 pts')}</div>
          </div>
          <div className="text-[10px] text-muted-foreground mt-2 italic">{tr(
            'Badges auto-award when you use the corresponding features. Keep farming to level up! 🌱',
            'تُمنح الأوسمة تلقائياً عند استخدامك الميزات المقابلة. واصل الزراعة لترتقي! 🌱',
            'Les badges sont attribués automatiquement quand vous utilisez les fonctionnalités correspondantes. Continuez à cultiver pour monter en niveau ! 🌱',
          )}</div>
        </div>
      </div>
    </CalculatorShell>
  );
}

function updateBadge(badges: GameBadge[], id: string, current: number, target: number): GameBadge[] {
  return badges.map(b => {
    if (b.id !== id) return b;
    if (b.earned) return b;
    const progress = Math.min(100, (current / target) * 100);
    const earned = current >= target;
    return { ...b, current, progress, earned: earned ? true : b.earned, earnedDate: earned ? new Date().toISOString().slice(0, 10) : b.earnedDate };
  });
}

function getPoints(badgeId: string): number {
  const points: Record<string, number> = {
    first_tool: 10, tool_explorer: 30, tool_master: 100, calc_addict: 50,
    water_saver: 50, n_optimizer: 50, soil_builder: 50, carbon_conscious: 50, sustainability_a: 100,
    first_post: 20, helpful_farmer: 40, storyteller: 30,
    planner: 40, rotation_pro: 40, irrigation_designer: 40, report_creator: 40,
    week_streak: 30, month_streak: 100, scout_10: 30, soil_tracker: 40,
  };
  return points[badgeId] || 10;
}

function QuickStat({ icon: Icon, label, value, color }: { icon: typeof Trophy; label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg p-2 border bg-card text-center">
      <Icon className="h-3.5 w-3.5 mx-auto mb-0.5" style={{ color }} />
      <div className="text-sm font-bold">{value}</div>
      <div className="text-[8px] text-muted-foreground uppercase">{label}</div>
    </div>
  );
}
