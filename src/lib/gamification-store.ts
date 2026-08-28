/**
 * Gamification store — badges, achievements, progress tracking, and leaderboard.
 * All data persisted to localStorage. Anonymous benchmarking against seed data.
 */

const KEY = 'nutriplant_gamification_v1';

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: 'tools' | 'sustainability' | 'community' | 'planning' | 'milestone';
  earned: boolean;
  earnedDate?: string;
  progress?: number;   // 0-100 for partial progress
  target?: number;
  current?: number;
}

export interface AchievementStats {
  totalBadges: number;
  earnedBadges: number;
  totalPoints: number;
  level: number;
  levelTitle: string;
  nextLevelPoints: number;
  progressToNext: number;
  rank: string;
  streak: number;       // consecutive days using the app
  toolsUsed: number;
  calculationsRun: number;
  reportsGenerated: number;
  scoutingEntries: number;
  communityPosts: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  level: number;
  badgeCount: number;
  isYou: boolean;
  crop: string;
  region: string;
}

const LEVELS = [
  { level: 1, title: 'Seedling', minPoints: 0 },
  { level: 2, title: 'Sprout', minPoints: 50 },
  { level: 3, title: 'Sapling', minPoints: 150 },
  { level: 4, title: 'Young Plant', minPoints: 300 },
  { level: 5, title: 'Mature Plant', minPoints: 600 },
  { level: 6, title: 'Flowering', minPoints: 1000 },
  { level: 7, title: 'Fruiting', minPoints: 1500 },
  { level: 8, title: 'Master Farmer', minPoints: 2500 },
  { level: 9, title: 'Agronomy Legend', minPoints: 4000 },
];

export const ALL_BADGES: Badge[] = [
  // Tools badges
  { id: 'first_tool', name: 'First Steps', emoji: '👣', description: 'Open your first tool', category: 'tools', earned: false, target: 1, current: 0 },
  { id: 'tool_explorer', name: 'Tool Explorer', emoji: '🔧', description: 'Use 5 different tools', category: 'tools', earned: false, target: 5, current: 0 },
  { id: 'tool_master', name: 'Tool Master', emoji: '🏆', description: 'Use all 18 tools', category: 'tools', earned: false, target: 18, current: 0 },
  { id: 'calc_addict', name: 'Calculator Addict', emoji: '🧮', description: 'Run 50 calculations', category: 'tools', earned: false, target: 50, current: 0 },

  // Sustainability badges
  { id: 'water_saver', name: 'Water Saver', emoji: '💧', description: 'Achieve water productivity > 1.5 kg/m³', category: 'sustainability', earned: false },
  { id: 'n_optimizer', name: 'N Optimizer', emoji: '🧪', description: 'Achieve NUE > 70%', category: 'sustainability', earned: false },
  { id: 'soil_builder', name: 'Soil Builder', emoji: '🪱', description: 'Soil health score > 75/100', category: 'sustainability', earned: false },
  { id: 'carbon_conscious', name: 'Carbon Conscious', emoji: '🌍', description: 'Carbon footprint < 0.5 kg CO₂e/kg', category: 'sustainability', earned: false },
  { id: 'sustainability_a', name: 'Sustainability Champion', emoji: '🌿', description: 'Earn grade A on sustainability scorecard', category: 'sustainability', earned: false },

  // Community badges
  { id: 'first_post', name: 'Hello World', emoji: '👋', description: 'Make your first community post', category: 'community', earned: false, target: 1, current: 0 },
  { id: 'helpful_farmer', name: 'Helpful Farmer', emoji: '🤝', description: 'Reply to 5 community questions', category: 'community', earned: false, target: 5, current: 0 },
  { id: 'storyteller', name: 'Storyteller', emoji: '📖', description: 'Share a success story', category: 'community', earned: false },

  // Planning badges
  { id: 'planner', name: 'Strategic Planner', emoji: '📅', description: 'Generate a 52-week season plan', category: 'planning', earned: false },
  { id: 'rotation_pro', name: 'Rotation Pro', emoji: '🔄', description: 'Create a 5+ year crop rotation', category: 'planning', earned: false },
  { id: 'irrigation_designer', name: 'Irrigation Designer', emoji: '💦', description: 'Design a multi-zone irrigation system', category: 'planning', earned: false },
  { id: 'report_creator', name: 'Report Creator', emoji: '📄', description: 'Generate a comprehensive farm report', category: 'planning', earned: false },

  // Milestone badges
  { id: 'week_streak', name: 'Week Warrior', emoji: '🔥', description: 'Use the app 7 days in a row', category: 'milestone', earned: false, target: 7, current: 0 },
  { id: 'month_streak', name: 'Monthly Master', emoji: '💎', description: 'Use the app 30 days in a row', category: 'milestone', earned: false, target: 30, current: 0 },
  { id: 'scout_10', name: 'Field Scout', emoji: '🔍', description: 'Log 10 scouting entries', category: 'milestone', earned: false, target: 10, current: 0 },
  { id: 'soil_tracker', name: 'Soil Tracker', emoji: '📊', description: 'Log 3+ years of soil test data', category: 'milestone', earned: false, target: 3, current: 0 },
];

const SEED_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Carlos M.', points: 3850, level: 9, badgeCount: 18, isYou: false, crop: 'Tomato', region: 'Mexico' },
  { rank: 2, name: 'Maria F.', points: 2940, level: 8, badgeCount: 16, isYou: false, crop: 'Avocado', region: 'Mexico' },
  { rank: 3, name: 'Priya S.', points: 2100, level: 7, badgeCount: 14, isYou: false, crop: 'Rice', region: 'India' },
  { rank: 4, name: 'Kwame A.', points: 1750, level: 7, badgeCount: 13, isYou: false, crop: 'Cocoa', region: 'Ghana' },
  { rank: 5, name: 'Tomas L.', points: 1420, level: 6, badgeCount: 12, isYou: false, crop: 'Maize', region: 'Argentina' },
  { rank: 6, name: 'Sophie B.', points: 980, level: 5, badgeCount: 10, isYou: false, crop: 'Wheat', region: 'France' },
  { rank: 7, name: 'Ahmed K.', points: 720, level: 4, badgeCount: 8, isYou: false, crop: 'Tomato', region: 'Egypt' },
  { rank: 8, name: 'You', points: 0, level: 1, badgeCount: 0, isYou: true, crop: '', region: '' },
];

export function getGamificationState(): { badges: Badge[]; stats: AchievementStats } {
  if (typeof window === 'undefined') {
    return { badges: ALL_BADGES, stats: getDefaultStats() };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      return { badges: saved.badges || ALL_BADGES, stats: { ...getDefaultStats(), ...saved.stats } };
    }
  } catch { /* ignore */ }
  return { badges: ALL_BADGES, stats: getDefaultStats() };
}

export function saveGamificationState(badges: Badge[], stats: AchievementStats): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(KEY, JSON.stringify({ badges, stats })); } catch { /* ignore */ }
}

export function getDefaultStats(): AchievementStats {
  return {
    totalBadges: ALL_BADGES.length,
    earnedBadges: 0,
    totalPoints: 0,
    level: 1,
    levelTitle: 'Seedling',
    nextLevelPoints: 50,
    progressToNext: 0,
    rank: '—',
    streak: 0,
    toolsUsed: 0,
    calculationsRun: 0,
    reportsGenerated: 0,
    scoutingEntries: 0,
    communityPosts: 0,
  };
}

/** Award a badge by ID. Returns updated badges + stats. */
export function awardBadge(badgeId: string): { badges: Badge[]; stats: AchievementStats; newlyEarned: Badge | null } {
  const { badges, stats } = getGamificationState();
  const badge = badges.find(b => b.id === badgeId);
  if (!badge || badge.earned) return { badges, stats, newlyEarned: null };

  const updatedBadges = badges.map(b => b.id === badgeId ? { ...b, earned: true, earnedDate: new Date().toISOString().slice(0, 10) } : b);
  const points = getBadgePoints(badgeId);
  const newStats = recalculateStats(updatedBadges, { ...stats, totalPoints: stats.totalPoints + points });
  saveGamificationState(updatedBadges, newStats);
  return { badges: updatedBadges, stats: newStats, newlyEarned: { ...badge, earned: true } };
}

/** Update progress toward a badge (without earning it). */
export function updateBadgeProgress(badgeId: string, current: number): { badges: Badge[]; stats: AchievementStats; newlyEarned: Badge | null } {
  const { badges, stats } = getGamificationState();
  const badge = badges.find(b => b.id === badgeId);
  if (!badge || badge.earned) return { badges, stats, newlyEarned: null };

  const progress = badge.target ? Math.min(100, (current / badge.target) * 100) : 0;
  const updatedBadges = badges.map(b => b.id === badgeId ? { ...b, current, progress } : b);

  if (badge.target && current >= badge.target) {
    return awardBadge(badgeId);
  }

  saveGamificationState(updatedBadges, stats);
  return { badges: updatedBadges, stats, newlyEarned: null };
}

function getBadgePoints(badgeId: string): number {
  const points: Record<string, number> = {
    first_tool: 10, tool_explorer: 30, tool_master: 100, calc_addict: 50,
    water_saver: 50, n_optimizer: 50, soil_builder: 50, carbon_conscious: 50, sustainability_a: 100,
    first_post: 20, helpful_farmer: 40, storyteller: 30,
    planner: 40, rotation_pro: 40, irrigation_designer: 40, report_creator: 40,
    week_streak: 30, month_streak: 100, scout_10: 30, soil_tracker: 40,
  };
  return points[badgeId] || 10;
}

function recalculateStats(badges: Badge[], baseStats: AchievementStats): AchievementStats {
  const earnedBadges = badges.filter(b => b.earned).length;
  const totalPoints = badges.filter(b => b.earned).reduce((sum, b) => sum + getBadgePoints(b.id), 0);
  const level = LEVELS.filter(l => totalPoints >= l.minPoints).pop() || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.level === level.level + 1);
  const progressToNext = nextLevel
    ? Math.round(((totalPoints - level.minPoints) / (nextLevel.minPoints - level.minPoints)) * 100)
    : 100;

  return {
    ...baseStats,
    earnedBadges,
    totalPoints,
    level: level.level,
    levelTitle: level.title,
    nextLevelPoints: nextLevel ? nextLevel.minPoints : totalPoints,
    progressToNext,
  };
}

/** Get leaderboard with the user inserted. */
export function getLeaderboard(userPoints: number, userBadges: number, userLevel: number, crop = '', region = ''): LeaderboardEntry[] {
  const user: LeaderboardEntry = {
    rank: 0, name: 'You', points: userPoints, level: userLevel, badgeCount: userBadges,
    isYou: true, crop, region,
  };
  const all = [...SEED_LEADERBOARD.filter(e => !e.isYou), user];
  all.sort((a, b) => b.points - a.points);
  return all.map((e, i) => ({ ...e, rank: i + 1 }));
}

export { LEVELS };
