/**
 * Farmer Community store — localStorage-backed social platform.
 * Users can post questions, share experiences, benchmark their farm,
 * and read success stories. All data is local (demo mode).
 *
 * In production, replace localStorage with a real backend (Supabase/Firebase).
 */

const POSTS_KEY = 'nutriplant_community_posts_v1';
const PROFILE_KEY = 'nutriplant_community_profile_v1';

export type PostType = 'question' | 'experience' | 'success_story' | 'tip' | 'market_info';

export interface Post {
  id: string;
  type: PostType;
  author: string;
  authorRole: string;    // 'grower' | 'agronomist' | 'consultant' | 'student'
  crop?: string;
  region?: string;
  title: string;
  body: string;
  tags: string[];
  likes: number;
  likedByMe: boolean;
  replies: Reply[];
  createdAt: number;
  pinned?: boolean;
}

export interface Reply {
  id: string;
  author: string;
  authorRole: string;
  body: string;
  isExpert?: boolean;
  createdAt: number;
}

export interface UserProfile {
  name: string;
  role: 'grower' | 'agronomist' | 'consultant' | 'student' | 'other';
  farm: string;
  region: string;
  crops: string[];
}

// === Seed data (shown when no local posts exist) ===
const SEED_POSTS: Post[] = [
  {
    id: 'seed-1', type: 'success_story', author: 'Carlos M.', authorRole: 'grower',
    crop: 'Tomato', region: 'Sinaloa, Mexico',
    title: 'Closed 30% of my yield gap with VPD monitoring',
    body: 'After using the VPD Estimator tool daily, I realized my greenhouse was running at 0.3 kPa VPD (too low). I increased ventilation to hit 0.8-1.2 kPa during flowering. Result: blossom-end rot dropped from 15% to 2%, and overall yield increased from 62 to 81 t/ha. The VPD tool + Calcium Nitrate foliar saved my season.',
    tags: ['VPD', 'blossom-end-rot', 'greenhouse', 'tomato', 'calcium'],
    likes: 47, likedByMe: false, createdAt: Date.now() - 86400000 * 3,
    replies: [
      { id: 'r1', author: 'Dr. Elena R.', authorRole: 'agronomist', body: 'Excellent result Carlos. VPD 0.8-1.2 is the sweet spot for tomato flowering. The Ca transport improvement is the key mechanism — low VPD = low transpiration = Ca never reaches the fruit tip.', isExpert: true, createdAt: Date.now() - 86400000 * 2 },
      { id: 'r2', author: 'Ahmed K.', authorRole: 'grower', body: 'Same issue here in Egypt. Will try your approach. What Ca(NO3)2 rate did you use for foliar?', createdAt: Date.now() - 86400000 },
    ],
  },
  {
    id: 'seed-2', type: 'question', author: 'Priya S.', authorRole: 'grower',
    crop: 'Rice', region: 'Punjab, India',
    title: 'How much N can I cut if my soil OM is 3.5%?',
    body: 'My soil test shows 3.5% organic matter, CEC 18, and the Mineralizable N tool estimates 95 kg N/ha/year. My standard rice recommendation is 150 kg N/ha. Can I safely cut to 60 kg N/ha without yield loss?',
    tags: ['nitrogen', 'soil-organic-matter', 'rice', 'NUE', 'mineralization'],
    likes: 23, likedByMe: false, createdAt: Date.now() - 86400000 * 5,
    replies: [
      { id: 'r3', author: 'Dr. James T.', authorRole: 'agronomist', body: 'Yes, with 95 kg N/ha from mineralization, 60 kg applied N is reasonable for a 6 t/ha target. But split it: 20 basal + 20 at tillering + 20 at panicle initiation. Monitor leaf color chart weekly — if it drops below 3, add 10 kg N.', isExpert: true, createdAt: Date.now() - 86400000 * 4 },
    ],
  },
  {
    id: 'seed-3', type: 'tip', author: 'Maria F.', authorRole: 'consultant',
    crop: 'Avocado', region: 'Michoacán, Mexico',
    title: 'Gypsum + cover crop reduced my Phytophthora by 40%',
    body: 'On my client\'s avocado orchard (pH 7.8, high Na), we applied 1.2 t/ha gypsum in October and planted a vetch-oat cover crop. After 2 seasons: Ca saturation went from 55% to 68%, Na dropped from 4% to 1.5%, and Phytophthora incidence dropped from 12% of trees to 7%. The Amendment Balance tool was spot-on for the dose.',
    tags: ['avocado', 'phytophthora', 'gypsum', 'cover-crop', 'soil-health', 'calcium'],
    likes: 34, likedByMe: false, createdAt: Date.now() - 86400000 * 7,
    replies: [],
  },
  {
    id: 'seed-4', type: 'market_info', author: 'Tomas L.', authorRole: 'grower',
    crop: 'Maize', region: 'Córdoba, Argentina',
    title: 'Urea prices up 15% this month — consider split application',
    body: 'Local urea went from $365 to $420 per 50kg bag. With the Fertilizer Carbon Footprint tool, I calculated that switching 50% to ammonium sulfate (cheaper + S bonus) saves $58/ha and reduces N₂O emissions by 8%. Worth considering if your soil S is low.',
    tags: ['urea', 'price', 'ammonium-sulfate', 'cost-saving', 'maize'],
    likes: 18, likedByMe: false, createdAt: Date.now() - 86400000 * 10,
    replies: [
      { id: 'r4', author: 'Sophie B.', authorRole: 'agronomist', body: 'Good strategy. Ammonium sulfate also acidifies the rhizosphere slightly, which can improve P availability in high-pH soils. Just watch soil pH over time — it can drop 0.2-0.3 units per season with continuous AS use.', isExpert: true, createdAt: Date.now() - 86400000 * 9 },
    ],
  },
  {
    id: 'seed-5', type: 'experience', author: 'Kwame A.', authorRole: 'grower',
    crop: 'Cocoa', region: 'Western Region, Ghana',
    title: 'Drip irrigation + Season Plan = 35% yield increase',
    body: 'I installed drip irrigation on 2ha of cocoa and used the Season Plan Generator to schedule fertigation. Before: rain-fed, 0.8 t/ha. After (year 2): 1.08 t/ha. The 52-week plan told me exactly when to push K during pod fill. ROI: drip system paid for itself in 1.5 seasons.',
    tags: ['cocoa', 'drip-irrigation', 'season-plan', 'ROI', 'potassium'],
    likes: 52, likedByMe: false, createdAt: Date.now() - 86400000 * 14,
    replies: [],
  },
];

// === Post management ===
export function getPosts(): Post[] {
  if (typeof window === 'undefined') return SEED_POSTS;
  try {
    const raw = localStorage.getItem(POSTS_KEY);
    if (!raw) {
      localStorage.setItem(POSTS_KEY, JSON.stringify(SEED_POSTS));
      return SEED_POSTS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_POSTS;
  }
}

export function savePost(post: Post): void {
  if (typeof window === 'undefined') return;
  const posts = getPosts();
  posts.unshift(post);
  try { localStorage.setItem(POSTS_KEY, JSON.stringify(posts)); } catch { /* ignore */ }
}

export function toggleLike(postId: string): Post[] {
  if (typeof window === 'undefined') return [];
  const posts = getPosts().map(p => {
    if (p.id === postId) {
      return {
        ...p,
        likedByMe: !p.likedByMe,
        likes: p.likedByMe ? p.likes - 1 : p.likes + 1,
      };
    }
    return p;
  });
  try { localStorage.setItem(POSTS_KEY, JSON.stringify(posts)); } catch { /* ignore */ }
  return posts;
}

export function addReply(postId: string, reply: Reply): Post[] {
  if (typeof window === 'undefined') return [];
  const posts = getPosts().map(p => {
    if (p.id === postId) {
      return { ...p, replies: [...p.replies, reply] };
    }
    return p;
  });
  try { localStorage.setItem(POSTS_KEY, JSON.stringify(posts)); } catch { /* ignore */ }
  return posts;
}

// === Profile ===
export function getProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch { /* ignore */ }
}

// === Benchmarking ===
export interface BenchmarkEntry {
  crop: string;
  region: string;
  yield: number;       // t/ha
  nUe: number;         // %
  waterProductivity: number;  // kg/m³
  anonymous: boolean;
}

const BENCHMARK_KEY = 'nutriplant_benchmarks_v1';

const SEED_BENCHMARKS: BenchmarkEntry[] = [
  { crop: 'Tomato', region: 'Global average', yield: 35, nUe: 55, waterProductivity: 1.2, anonymous: true },
  { crop: 'Tomato', region: 'Top 25%', yield: 70, nUe: 75, waterProductivity: 1.8, anonymous: true },
  { crop: 'Maize', region: 'Global average', yield: 5.5, nUe: 50, waterProductivity: 1.0, anonymous: true },
  { crop: 'Maize', region: 'Top 25%', yield: 11, nUe: 70, waterProductivity: 1.6, anonymous: true },
  { crop: 'Wheat', region: 'Global average', yield: 3.5, nUe: 55, waterProductivity: 1.1, anonymous: true },
  { crop: 'Wheat', region: 'Top 25%', yield: 8, nUe: 75, waterProductivity: 1.5, anonymous: true },
  { crop: 'Potato', region: 'Global average', yield: 25, nUe: 50, waterProductivity: 0.9, anonymous: true },
  { crop: 'Potato', region: 'Top 25%', yield: 50, nUe: 70, waterProductivity: 1.4, anonymous: true },
  { crop: 'Rice', region: 'Global average', yield: 4.5, nUe: 45, waterProductivity: 0.8, anonymous: true },
  { crop: 'Rice', region: 'Top 25%', yield: 9, nUe: 65, waterProductivity: 1.2, anonymous: true },
  { crop: 'Soybean', region: 'Global average', yield: 2.5, nUe: 60, waterProductivity: 0.7, anonymous: true },
  { crop: 'Soybean', region: 'Top 25%', yield: 4, nUe: 80, waterProductivity: 1.1, anonymous: true },
  { crop: 'Avocado', region: 'Global average', yield: 10, nUe: 45, waterProductivity: 0.6, anonymous: true },
  { crop: 'Avocado', region: 'Top 25%', yield: 18, nUe: 65, waterProductivity: 1.0, anonymous: true },
];

export function getBenchmarks(): BenchmarkEntry[] {
  if (typeof window === 'undefined') return SEED_BENCHMARKS;
  try {
    const raw = localStorage.getItem(BENCHMARK_KEY);
    if (!raw) {
      localStorage.setItem(BENCHMARK_KEY, JSON.stringify(SEED_BENCHMARKS));
      return SEED_BENCHMARKS;
    }
    return [...SEED_BENCHMARKS, ...JSON.parse(raw)];
  } catch {
    return SEED_BENCHMARKS;
  }
}

export function addBenchmark(entry: BenchmarkEntry): void {
  if (typeof window === 'undefined') return;
  const existing = (() => { try { return JSON.parse(localStorage.getItem(BENCHMARK_KEY) || '[]'); } catch { return []; } })();
  existing.push(entry);
  try { localStorage.setItem(BENCHMARK_KEY, JSON.stringify(existing)); } catch { /* ignore */ }
}

export function getBenchmarkForCrop(crop: string): { avg?: BenchmarkEntry; top?: BenchmarkEntry; user?: BenchmarkEntry } {
  const all = getBenchmarks();
  const cropEntries = all.filter(b => b.crop.toLowerCase() === crop.toLowerCase());
  const avg = cropEntries.find(b => b.region === 'Global average');
  const top = cropEntries.find(b => b.region === 'Top 25%');
  const user = cropEntries.find(b => b.region !== 'Global average' && b.region !== 'Top 25%');
  return { avg, top, user };
}
