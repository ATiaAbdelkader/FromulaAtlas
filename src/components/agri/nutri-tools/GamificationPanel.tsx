'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, Flame, Star, Award, TrendingUp, Zap, Target, Crown,
  Lock, CheckCircle2, Sparkles,
} from 'lucide-react';
import {
  getGamificationState, getLeaderboard, ALL_BADGES, LEVELS,
  type Badge as GameBadge, type AchievementStats, type LeaderboardEntry,
} from '@/lib/gamification-store';

const CATEGORY_META: Record<string, { label: string; color: string; emoji: string }> = {
  tools:         { label: 'Tools',         color: '#16a34a', emoji: '🔧' },
  sustainability:{ label: 'Sustainability', color: '#0ea5e9', emoji: '🌿' },
  community:     { label: 'Community',     color: '#3b82f6', emoji: '👥' },
  planning:      { label: 'Planning',      color: '#f59e0b', emoji: '📅' },
  milestone:     { label: 'Milestones',    color: '#8b5cf6', emoji: '🏆' },
};

export function GamificationPanel() {
  const [badges, setBadges] = useState<GameBadge[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

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
  const categories = ['all', ...Object.keys(CATEGORY_META)];

  if (!stats) return null;

  const userRank = leaderboard.find(e => e.isYou)?.rank || '—';

  return (
    <div className="space-y-4">
      {/* Level + Points header */}
      <div className="rounded-xl p-4 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-white/20 backdrop-blur text-2xl font-bold">
              {stats.level}
            </div>
            <div>
              <div className="text-lg font-bold">{stats.levelTitle}</div>
              <div className="text-xs text-violet-100">Level {stats.level} · {stats.totalPoints} points</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{earnedCount}<span className="text-sm font-normal text-violet-200">/{stats.totalBadges}</span></div>
            <div className="text-xs text-violet-100">Badges earned</div>
          </div>
        </div>
        {/* Level progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-violet-100 mb-1">
            <span>Lvl {stats.level}</span>
            <span>{stats.progressToNext}% to Lvl {stats.level + 1}</span>
            <span>{stats.nextLevelPoints} pts</span>
          </div>
          <div className="h-2 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full bg-white" style={{ width: `${stats.progressToNext}%` }} />
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-2">
        <QuickStat icon={Trophy} label="Rank" value={`#${userRank}`} color="#f59e0b" />
        <QuickStat icon={Flame} label="Streak" value={`${stats.streak}d`} color="#dc2626" />
        <QuickStat icon={Zap} label="Tools used" value={String(stats.toolsUsed)} color="#16a34a" />
        <QuickStat icon={Target} label="Points" value={String(stats.totalPoints)} color="#7c3aed" />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-[10px] px-2.5 py-1 rounded-md border transition-all ${activeCategory === cat ? 'bg-violet-600 text-white border-violet-600' : 'bg-background border-border text-muted-foreground hover:border-violet-300'}`}
          >
            {cat === 'all' ? '🏆 All Badges' : `${CATEGORY_META[cat].emoji} ${CATEGORY_META[cat].label}`}
          </button>
        ))}
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
                  <CheckCircle2 className="h-2 w-2" /> Earned
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
                  <Lock className="h-2 w-2" /> {getPoints(badge.id)} pts
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      {/* Leaderboard */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Crown className="h-3.5 w-3.5 text-amber-500" /> Global Leaderboard
        </div>
        <div className="space-y-1">
          {leaderboard.slice(0, 10).map(entry => (
            <div
              key={entry.rank}
              className={`flex items-center gap-2 rounded-lg p-2 border ${entry.isYou ? 'border-violet-300 bg-violet-50/50 dark:bg-violet-950/20' : 'border-border bg-card'}`}
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
                  {entry.isYou && <Badge variant="outline" className="text-[8px] px-1 py-0 text-violet-600 border-violet-300">You</Badge>}
                </div>
                <div className="text-[9px] text-muted-foreground">
                  Lvl {entry.level} · {entry.badgeCount} badges{entry.crop && ` · ${entry.crop}`}{entry.region && ` · ${entry.region}`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-violet-600">{entry.points}</div>
                <div className="text-[8px] text-muted-foreground">pts</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to earn points */}
      <div className="rounded-lg p-3 border border-violet-200 dark:border-violet-900 bg-violet-50/50 dark:bg-violet-950/20">
        <div className="text-xs font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> How to Earn Points
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[10px] text-muted-foreground">
          <div>• Open tools → +10 pts</div>
          <div>• Run calculations → +50 pts</div>
          <div>• Generate reports → +40 pts</div>
          <div>• Post in community → +20 pts</div>
          <div>• Log scouting entries → +30 pts</div>
          <div>• Track soil tests → +40 pts</div>
          <div>• Achieve NUE &gt; 70% → +50 pts</div>
          <div>• 7-day streak → +30 pts</div>
        </div>
        <div className="text-[10px] text-muted-foreground mt-2 italic">Badges auto-award when you use the corresponding features. Keep farming to level up! 🌱</div>
      </div>
    </div>
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
