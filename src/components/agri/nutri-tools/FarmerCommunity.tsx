'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Users, MessageCircle, Heart, Share2, Pin, Star, TrendingUp,
  Award, Plus, Send, ThumbsUp, Globe, MapPin, Search, X,
} from 'lucide-react';
import {
  getPosts, savePost, toggleLike, addReply, getProfile, saveProfile,
  getBenchmarks, addBenchmark, getBenchmarkForCrop,
  type Post, type Reply, type UserProfile, type PostType, type BenchmarkEntry,
} from '@/lib/community-store';
import { useTranslation, type Language } from '@/lib/language-store';

const POST_TYPE_CONFIG: Record<PostType, { label: string; label_fr: string; label_ar: string; color: string; icon: string }> = {
  question:      { label: 'Question',       label_fr: 'Question',       label_ar: 'سؤال',           color: '#3b82f6', icon: '❓' },
  experience:    { label: 'Experience',     label_fr: 'Expérience',     label_ar: 'تجربة',          color: '#16a34a', icon: '💡' },
  success_story: { label: 'Success Story',  label_fr: 'Réussite',       label_ar: 'قصة نجاح',      color: '#f59e0b', icon: '🏆' },
  tip:           { label: 'Tip',            label_fr: 'Conseil',         label_ar: 'نصيحة',          color: '#8b5cf6', icon: '⚡' },
  market_info:   { label: 'Market Info',    label_fr: 'Marché',          label_ar: 'معلومات السوق',  color: '#0891b2', icon: '📈' },
};

function copyFor(language: Language, en: string, fr: string, ar: string) {
  return language === 'ar' ? ar : language === 'fr' ? fr : en;
}

const BENCHMARK_CROPS = ['Tomato', 'Maize', 'Wheat', 'Potato', 'Rice', 'Soybean', 'Avocado'];

export function FarmerCommunity() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<'feed' | 'benchmark' | 'profile'>('feed');
  const [showNewPost, setShowNewPost] = useState(false);
  const [filterType, setFilterType] = useState<PostType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const { language } = useTranslation();
  const typeLabel = (t: PostType) => language === 'ar' ? POST_TYPE_CONFIG[t].label_ar : language === 'fr' ? POST_TYPE_CONFIG[t].label_fr : POST_TYPE_CONFIG[t].label;

  // New post form
  const [newPost, setNewPost] = useState({ type: 'question' as PostType, title: '', body: '', crop: '', region: '', tags: '' });

  // Benchmark form
  const [benchCrop, setBenchCrop] = useState('Tomato');
  const [benchYield, setBenchYield] = useState('');
  const [benchNue, setBenchNue] = useState('');
  const [benchWp, setBenchWp] = useState('');
  const [benchRegion, setBenchRegion] = useState('');

  useEffect(() => {
    setPosts(getPosts());
    setProfile(getProfile());
  }, []);

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (filterType !== 'all') result = result.filter(p => p.type === filterType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        p.tags.some(t => t.includes(q)) ||
        p.crop?.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt);
  }, [posts, filterType, searchQuery]);

  const handleLike = (id: string) => setPosts(toggleLike(id));

  const handlePost = () => {
    if (!newPost.title.trim() || !newPost.body.trim()) return;
    const post: Post = {
      id: `post-${Date.now()}`,
      type: newPost.type,
      author: profile?.name || 'Anonymous Farmer',
      authorRole: profile?.role || 'grower',
      crop: newPost.crop || undefined,
      region: newPost.region || profile?.region || undefined,
      title: newPost.title,
      body: newPost.body,
      tags: newPost.tags.split(',').map(t => t.trim()).filter(Boolean),
      likes: 0, likedByMe: false, replies: [],
      createdAt: Date.now(),
    };
    savePost(post);
    setPosts(getPosts());
    setNewPost({ type: 'question', title: '', body: '', crop: '', region: '', tags: '' });
    setShowNewPost(false);
  };

  const handleReply = (postId: string) => {
    if (!replyText.trim()) return;
    const reply: Reply = {
      id: `reply-${Date.now()}`,
      author: profile?.name || 'Anonymous Farmer',
      authorRole: profile?.role || 'grower',
      body: replyText,
      createdAt: Date.now(),
    };
    setPosts(addReply(postId, reply));
    setReplyText('');
    setReplyingTo(null);
  };

  const submitBenchmark = () => {
    if (!benchYield) return;
    addBenchmark({
      crop: benchCrop, region: benchRegion || 'My farm',
      yield: parseFloat(benchYield), nUe: parseFloat(benchNue) || 0,
      waterProductivity: parseFloat(benchWp) || 0, anonymous: true,
    });
    setBenchYield(''); setBenchNue(''); setBenchWp(''); setBenchRegion('');
  };

  const benchmark = getBenchmarkForCrop(benchCrop);
  const userBench = benchmark.user;
  const timeAgo = (ts: number) => {
    const d = Math.floor((Date.now() - ts) / 86400000);
    if (language === 'ar') {
      if (d === 0) return 'اليوم';
      if (d === 1) return 'أمس';
      if (d < 7) return `منذ ${d} أيام`;
      if (d < 30) return `منذ ${Math.floor(d / 7)} أسابيع`;
      return `منذ ${Math.floor(d / 30)} أشهر`;
    }
    if (language === 'fr') {
      if (d === 0) return 'aujourd’hui';
      if (d === 1) return 'hier';
      if (d < 7) return `il y a ${d} jours`;
      if (d < 30) return `il y a ${Math.floor(d / 7)} sem.`;
      return `il y a ${Math.floor(d / 30)} mois`;
    }
    if (d === 0) return 'today';
    if (d === 1) return 'yesterday';
    if (d < 7) return `${d} days ago`;
    if (d < 30) return `${Math.floor(d / 7)}w ago`;
    return `${Math.floor(d / 30)}mo ago`;
  };

  return (
    <Card>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        <TabBtn active={tab === 'feed'} onClick={() => setTab('feed')} icon={MessageCircle} label={copyFor(language, 'Community Feed', 'Fil de la communauté', 'المجتمع')} />
        <TabBtn active={tab === 'benchmark'} onClick={() => setTab('benchmark')} icon={TrendingUp} label={copyFor(language, 'Benchmark', 'Comparaison', 'المقارنة')} />
        <TabBtn active={tab === 'profile'} onClick={() => setTab('profile')} icon={Users} label={copyFor(language, 'My Profile', 'Mon profil', 'ملفي')} />
      </div>

      {/* === FEED TAB === */}
      {tab === 'feed' && (
        <div className="space-y-3">
          {/* Search + New Post */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={copyFor(language, 'Search posts...', 'Rechercher dans les publications…', 'ابحث في المنشورات...')} className="h-9 pl-8 text-sm" />
            </div>
            <Button size="sm" onClick={() => setShowNewPost(!showNewPost)} className="gap-1.5">
              <Plus className="h-4 w-4" /> {copyFor(language, 'Post', 'Publication', 'منشور')}
            </Button>
          </div>

          {/* New post form */}
          {showNewPost && (
            <div className="rounded-lg border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10 p-3 space-y-2">
              <div className="flex gap-1.5 flex-wrap">
                {(Object.keys(POST_TYPE_CONFIG) as PostType[]).map(t => (
                  <button key={t} onClick={() => setNewPost({ ...newPost, type: t })}
                    className={`text-[10px] px-2 py-1 rounded border ${newPost.type === t ? '' : 'border-border bg-background'}`}
                    style={newPost.type === t ? { background: `${POST_TYPE_CONFIG[t].color}20`, color: POST_TYPE_CONFIG[t].color, borderColor: `${POST_TYPE_CONFIG[t].color}60` } : {}}>
                    {POST_TYPE_CONFIG[t].icon} {typeLabel(t)}
                  </button>
                ))}
              </div>
              <Input value={newPost.title} onChange={e => setNewPost({ ...newPost, title: e.target.value })} placeholder={copyFor(language, 'Title...', 'Titre…', 'العنوان...')} className="h-8 text-sm" />
              <Textarea value={newPost.body} onChange={e => setNewPost({ ...newPost, body: e.target.value })} placeholder={copyFor(language, 'Share your question, experience, or tip...', 'Partagez votre question, votre expérience ou votre conseil…', 'شارك سؤالك أو تجربتك أو نصيحتك...')} className="text-sm min-h-[80px]" />
              <div className="grid grid-cols-3 gap-2">
                <Input value={newPost.crop} onChange={e => setNewPost({ ...newPost, crop: e.target.value })} placeholder={copyFor(language, 'Crop (optional)', 'Culture (facultatif)', 'المحصول (اختياري)')} className="h-8 text-xs" />
                <Input value={newPost.region} onChange={e => setNewPost({ ...newPost, region: e.target.value })} placeholder={copyFor(language, 'Region (optional)', 'Région (facultatif)', 'المنطقة (اختياري)')} className="h-8 text-xs" />
                <Input value={newPost.tags} onChange={e => setNewPost({ ...newPost, tags: e.target.value })} placeholder={copyFor(language, 'tags, comma, sep', 'étiquettes, séparées par des virgules', 'وسوم، بفاصلة')} className="h-8 text-xs" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setShowNewPost(false)}>{copyFor(language, 'Cancel', 'Annuler', 'إلغاء')}</Button>
                <Button size="sm" onClick={handlePost} disabled={!newPost.title.trim() || !newPost.body.trim()} className="gap-1.5">
                  <Send className="h-3.5 w-3.5" /> {copyFor(language, 'Publish', 'Publier', 'نشر')}
                </Button>
              </div>
            </div>
          )}

          {/* Filter chips */}
          <div className="flex gap-1.5 flex-wrap">
            <Chip active={filterType === 'all'} onClick={() => setFilterType('all')} label={copyFor(language, 'All', 'Tous', 'الكل')} />
            {(Object.keys(POST_TYPE_CONFIG) as PostType[]).map(t => (
              <Chip key={t} active={filterType === t} onClick={() => setFilterType(t)} label={`${POST_TYPE_CONFIG[t].icon} ${typeLabel(t)}`} />
            ))}
          </div>

          {/* Posts */}
          {filteredPosts.map(post => {
            const config = POST_TYPE_CONFIG[post.type];
            return (
              <div key={post.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-7 w-7 rounded-lg text-sm" style={{ background: `${config.color}20` }}>
                      {config.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold leading-tight">{post.title}</div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                        <span className="font-medium">{post.author}</span>
                        <Badge variant="outline" className="text-[8px] px-1 py-0 capitalize">{post.authorRole}</Badge>
                        {post.crop && <span>· {post.crop}</span>}
                        {post.region && <span>· <MapPin className="h-2 w-2 inline" /> {post.region}</span>}
                        <span>· {timeAgo(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px]" style={{ color: config.color, borderColor: `${config.color}60` }}>
                    {typeLabel(post.type)}
                  </Badge>
                </div>

                {/* Body */}
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{post.body}</p>

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {post.tags.map(tag => <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0">#{tag}</Badge>)}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-1 border-t border-border/40">
                  <button onClick={() => handleLike(post.id)} className={`flex items-center gap-1 text-xs transition-colors ${post.likedByMe ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'}`}>
                    <Heart className="h-3.5 w-3.5" fill={post.likedByMe ? 'currentColor' : 'none'} />
                    {post.likes}
                  </button>
                  <button onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {post.replies.length}
                  </button>
                </div>

                {/* Replies */}
                {post.replies.length > 0 && (
                  <div className="space-y-1.5 pl-4 border-l-2 border-border/40">
                    {post.replies.map(r => (
                      <div key={r.id} className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{r.author}</span>
                          {r.isExpert && <Badge variant="outline" className="text-[8px] text-emerald-600 border-emerald-300 px-1 py-0 gap-0.5"><Star className="h-2 w-2" fill="currentColor" /> {copyFor(language, 'Expert', 'Expert', 'خبير')}</Badge>}
                          <span className="text-[9px] text-muted-foreground">{timeAgo(r.createdAt)}</span>
                        </div>
                        <p className="text-muted-foreground mt-0.5">{r.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply input */}
                {replyingTo === post.id && (
                  <div className="flex gap-1.5 pl-4">
                    <Input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={copyFor(language, 'Write a reply...', 'Écrire une réponse…', 'اكتب ردّاً...')} className="h-7 text-xs"
                      onKeyDown={e => { if (e.key === 'Enter') handleReply(post.id); }} />
                    <Button size="sm" onClick={() => handleReply(post.id)} disabled={!replyText.trim()} className="h-7 px-2">
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {filteredPosts.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
              {copyFor(language, 'No posts yet. Be the first to share!', 'Aucune publication. Soyez le premier à partager !', 'لا منشورات بعد. كن أول من يشارك!')}
            </div>
          )}
        </div>
      )}

      {/* === BENCHMARK TAB === */}
      {tab === 'benchmark' && (
        <div className="space-y-4">
          <div className="rounded-lg p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide mb-2">
              <TrendingUp className="h-3.5 w-3.5" /> {copyFor(language, 'Benchmark Your Farm', 'Comparez votre ferme', 'قارن مزرعتك')}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <Label className="text-[10px]">{copyFor(language, 'Crop', 'Culture', 'المحصول')}</Label>
                <select value={benchCrop} onChange={e => setBenchCrop(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5">
                  {BENCHMARK_CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-[10px]">{copyFor(language, 'Yield (t/ha)', 'Rendement (t/ha)', 'الإنتاج (ط/هـ)')}</Label>
                <Input value={benchYield} onChange={e => setBenchYield(e.target.value)} type="number" className="h-8 text-xs mt-0.5" />
              </div>
              <div>
                <Label className="text-[10px]">{copyFor(language, 'NUE (%)', 'EUN (%)', 'كفاءة N (%)')}</Label>
                <Input value={benchNue} onChange={e => setBenchNue(e.target.value)} type="number" className="h-8 text-xs mt-0.5" />
              </div>
              <div>
                <Label className="text-[10px]">{copyFor(language, 'Water Prod (kg/m³)', 'Productivité de l’eau (kg/m³)', 'إنتاجية الماء (كغ/م³)')}</Label>
                <Input value={benchWp} onChange={e => setBenchWp(e.target.value)} type="number" className="h-8 text-xs mt-0.5" />
              </div>
            </div>
            <Button onClick={submitBenchmark} size="sm" className="w-full mt-2 gap-1.5">
              <Award className="h-3.5 w-3.5" /> {copyFor(language, 'Submit My Numbers', 'Envoyer mes chiffres', 'أرسل أرقامي')}
            </Button>
          </div>

          {/* Comparison */}
          {benchmark.avg && benchmark.top && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{benchCrop} — {copyFor(language, 'How do you compare?', 'Comment vous situez-vous ?', 'كيف تقارن؟')}</div>
              {[
                { label: copyFor(language, 'Yield (t/ha)', 'Rendement (t/ha)', 'الإنتاج (ط/هـ)'), avg: benchmark.avg.yield, top: benchmark.top.yield, user: userBench?.yield },
                { label: copyFor(language, 'NUE (%)', 'EUN (%)', 'كفاءة N (%)'), avg: benchmark.avg.nUe, top: benchmark.top.nUe, user: userBench?.nUe },
                { label: copyFor(language, 'Water Prod (kg/m³)', 'Productivité de l’eau (kg/m³)', 'إنتاجية الماء (كغ/م³)'), avg: benchmark.avg.waterProductivity, top: benchmark.top.waterProductivity, user: userBench?.waterProductivity },
              ].map(metric => {
                const maxVal = Math.max(metric.avg, metric.top, metric.user || 0, 0.1);
                return (
                  <div key={metric.label} className="rounded-lg border border-border p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium">{metric.label}</span>
                      {metric.user != null && (
                        <span className="text-[10px] font-mono">
                          {copyFor(language, 'You: ', 'Vous : ', 'أنت: ')}<strong>{metric.user}</strong> · {copyFor(language, 'Avg: ', 'Moy. : ', 'المتوسط: ')}{metric.avg} · {copyFor(language, 'Top 25%: ', 'Top 25 % : ', 'أعلى 25%: ')}{metric.top}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <BenchBar label={copyFor(language, 'Global avg', 'Moyenne mondiale', 'متوسط عالمي')} value={metric.avg} max={maxVal} color="#94a3b8" />
                      <BenchBar label={copyFor(language, 'Top 25%', 'Top 25 %', 'أعلى 25%')} value={metric.top} max={maxVal} color="#16a34a" />
                      {metric.user != null && <BenchBar label={copyFor(language, 'You', 'Vous', 'أنت')} value={metric.user} max={maxVal} color="#6366f1" />}
                    </div>
                  </div>
                );
              })}

              {userBench && (
                <div className="rounded-lg p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
                  <div className="text-xs">
                    {userBench.yield >= benchmark.top.yield ? (copyFor(language, '🏆 You\'re in the top 25% for yield!', '🏆 Vous êtes dans les 25 % supérieurs pour le rendement !', '🏆 أنت ضمن أعلى 25% في الإنتاج!')) :
                     userBench.yield >= benchmark.avg.yield ? (copyFor(language, '✅ You\'re above the global average. Room to improve to reach top 25%.', '✅ Vous êtes au-dessus de la moyenne mondiale. Il reste une marge pour atteindre le top 25 %.', '✅ أنت فوق المتوسط العالمي. لديك مساحة للوصول لأعلى 25%.')) :
                     (copyFor(language, '⚠️ You\'re below the global average. Check the Yield Gap Analysis tool for recommendations.', '⚠️ Vous êtes sous la moyenne mondiale. Consultez l’outil d’analyse de l’écart de rendement pour obtenir des recommandations.', '⚠️ أنت تحت المتوسط العالمي. تحقّق من أداة تحليل فجوة الإنتاج لتوصيات.'))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* === PROFILE TAB === */}
      {tab === 'profile' && (
        <div className="space-y-3 max-w-md">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{copyFor(language, 'Your Community Profile', 'Votre profil communautaire', 'ملفك في المجتمع')}</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px]">{copyFor(language, 'Name', 'Nom', 'الاسم')}</Label>
              <Input value={profile?.name || ''} onChange={e => { const p = { ...profile, name: e.target.value } as UserProfile; setProfile(p); saveProfile(p); }} className="h-8 text-xs mt-0.5" placeholder={copyFor(language, 'Your name', 'Votre nom', 'اسمك')} />
            </div>
            <div>
              <Label className="text-[10px]">{copyFor(language, 'Role', 'Rôle', 'الدور')}</Label>
              <select value={profile?.role || 'grower'} onChange={e => { const p = { ...profile, role: e.target.value as UserProfile['role'] } as UserProfile; setProfile(p); saveProfile(p); }} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5">
                <option value="grower">{copyFor(language, 'Grower', 'Producteur', 'مزارع')}</option>
                <option value="agronomist">{copyFor(language, 'Agronomist', 'Agronome', 'مهندس زراعي')}</option>
                <option value="consultant">{copyFor(language, 'Consultant', 'Conseiller', 'استشاري')}</option>
                <option value="student">{copyFor(language, 'Student', 'Étudiant', 'طالب')}</option>
                <option value="other">{copyFor(language, 'Other', 'Autre', 'أخرى')}</option>
              </select>
            </div>
            <div>
              <Label className="text-[10px]">{copyFor(language, 'Farm name', 'Nom de la ferme', 'اسم المزرعة')}</Label>
              <Input value={profile?.farm || ''} onChange={e => { const p = { ...profile, farm: e.target.value } as UserProfile; setProfile(p); saveProfile(p); }} className="h-8 text-xs mt-0.5" placeholder={copyFor(language, 'Farm name', 'Nom de la ferme', 'اسم المزرعة')} />
            </div>
            <div>
              <Label className="text-[10px]">{copyFor(language, 'Region', 'Région', 'المنطقة')}</Label>
              <Input value={profile?.region || ''} onChange={e => { const p = { ...profile, region: e.target.value } as UserProfile; setProfile(p); saveProfile(p); }} className="h-8 text-xs mt-0.5" placeholder={copyFor(language, 'Your region', 'Votre région', 'منطقتك')} />
            </div>
          </div>
          <div>
            <Label className="text-[10px]">{copyFor(language, 'Crops you grow (comma-separated)', 'Cultures cultivées (séparées par des virgules)', 'محاصيل تزرعها (بفاصلة)')}</Label>
            <Input value={(profile?.crops || []).join(', ')} onChange={e => { const p = { ...profile, crops: e.target.value.split(',').map(c => c.trim()).filter(Boolean) } as UserProfile; setProfile(p); saveProfile(p); }} className="h-8 text-xs mt-0.5" placeholder="tomato, maize, avocado" />
          </div>
          <div className="text-[10px] text-muted-foreground text-center pt-2">{copyFor(language, 'Your profile is stored locally and attached to your community posts.', 'Votre profil est stocké localement et associé à vos publications communautaires.', 'ملفك مخزّن محلياً ومرفق بمنشوراتك في المجتمع.')}</div>
        </div>
      )}
    </Card>
  );
}

function BenchBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.max(2, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-muted-foreground w-16 flex-shrink-0">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-muted/40 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[9px] font-mono w-10 text-right">{value}</span>
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof MessageCircle; label: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${active ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className={`text-[10px] px-2.5 py-1 rounded-md border transition-all ${active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-background border-border text-muted-foreground hover:border-emerald-300'}`}>
      {label}
    </button>
  );
}
