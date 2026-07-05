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

const POST_TYPE_CONFIG: Record<PostType, { label: string; color: string; icon: string }> = {
  question:      { label: 'Question',       color: '#3b82f6', icon: '❓' },
  experience:    { label: 'Experience',     color: '#16a34a', icon: '💡' },
  success_story: { label: 'Success Story',  color: '#f59e0b', icon: '🏆' },
  tip:           { label: 'Tip',            color: '#8b5cf6', icon: '⚡' },
  market_info:   { label: 'Market Info',    color: '#0891b2', icon: '📈' },
};

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
    if (d === 0) return 'today';
    if (d === 1) return 'yesterday';
    if (d < 7) return `${d} days ago`;
    if (d < 30) return `${Math.floor(d / 7)}w ago`;
    return `${Math.floor(d / 30)}mo ago`;
  };

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        <TabBtn active={tab === 'feed'} onClick={() => setTab('feed')} icon={MessageCircle} label="Community Feed" />
        <TabBtn active={tab === 'benchmark'} onClick={() => setTab('benchmark')} icon={TrendingUp} label="Benchmark" />
        <TabBtn active={tab === 'profile'} onClick={() => setTab('profile')} icon={Users} label="My Profile" />
      </div>

      {/* === FEED TAB === */}
      {tab === 'feed' && (
        <div className="space-y-3">
          {/* Search + New Post */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search posts..." className="h-9 pl-8 text-sm" />
            </div>
            <Button size="sm" onClick={() => setShowNewPost(!showNewPost)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Post
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
                    {POST_TYPE_CONFIG[t].icon} {POST_TYPE_CONFIG[t].label}
                  </button>
                ))}
              </div>
              <Input value={newPost.title} onChange={e => setNewPost({ ...newPost, title: e.target.value })} placeholder="Title..." className="h-8 text-sm" />
              <Textarea value={newPost.body} onChange={e => setNewPost({ ...newPost, body: e.target.value })} placeholder="Share your question, experience, or tip..." className="text-sm min-h-[80px]" />
              <div className="grid grid-cols-3 gap-2">
                <Input value={newPost.crop} onChange={e => setNewPost({ ...newPost, crop: e.target.value })} placeholder="Crop (optional)" className="h-8 text-xs" />
                <Input value={newPost.region} onChange={e => setNewPost({ ...newPost, region: e.target.value })} placeholder="Region (optional)" className="h-8 text-xs" />
                <Input value={newPost.tags} onChange={e => setNewPost({ ...newPost, tags: e.target.value })} placeholder="tags, comma, sep" className="h-8 text-xs" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setShowNewPost(false)}>Cancel</Button>
                <Button size="sm" onClick={handlePost} disabled={!newPost.title.trim() || !newPost.body.trim()} className="gap-1.5">
                  <Send className="h-3.5 w-3.5" /> Publish
                </Button>
              </div>
            </div>
          )}

          {/* Filter chips */}
          <div className="flex gap-1.5 flex-wrap">
            <Chip active={filterType === 'all'} onClick={() => setFilterType('all')} label="All" />
            {(Object.keys(POST_TYPE_CONFIG) as PostType[]).map(t => (
              <Chip key={t} active={filterType === t} onClick={() => setFilterType(t)} label={`${POST_TYPE_CONFIG[t].icon} ${POST_TYPE_CONFIG[t].label}`} />
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
                    {config.label}
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
                          {r.isExpert && <Badge variant="outline" className="text-[8px] text-emerald-600 border-emerald-300 px-1 py-0 gap-0.5"><Star className="h-2 w-2" fill="currentColor" /> Expert</Badge>}
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
                    <Input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply..." className="h-7 text-xs"
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
              No posts yet. Be the first to share!
            </div>
          )}
        </div>
      )}

      {/* === BENCHMARK TAB === */}
      {tab === 'benchmark' && (
        <div className="space-y-4">
          <div className="rounded-lg p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide mb-2">
              <TrendingUp className="h-3.5 w-3.5" /> Benchmark Your Farm
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <Label className="text-[10px]">Crop</Label>
                <select value={benchCrop} onChange={e => setBenchCrop(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5">
                  {BENCHMARK_CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-[10px]">Yield (t/ha)</Label>
                <Input value={benchYield} onChange={e => setBenchYield(e.target.value)} type="number" className="h-8 text-xs mt-0.5" />
              </div>
              <div>
                <Label className="text-[10px]">NUE (%)</Label>
                <Input value={benchNue} onChange={e => setBenchNue(e.target.value)} type="number" className="h-8 text-xs mt-0.5" />
              </div>
              <div>
                <Label className="text-[10px]">Water Prod (kg/m³)</Label>
                <Input value={benchWp} onChange={e => setBenchWp(e.target.value)} type="number" className="h-8 text-xs mt-0.5" />
              </div>
            </div>
            <Button onClick={submitBenchmark} size="sm" className="w-full mt-2 gap-1.5">
              <Award className="h-3.5 w-3.5" /> Submit My Numbers
            </Button>
          </div>

          {/* Comparison */}
          {benchmark.avg && benchmark.top && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{benchCrop} — How do you compare?</div>
              {[
                { label: 'Yield (t/ha)', avg: benchmark.avg.yield, top: benchmark.top.yield, user: userBench?.yield },
                { label: 'NUE (%)', avg: benchmark.avg.nUe, top: benchmark.top.nUe, user: userBench?.nUe },
                { label: 'Water Prod (kg/m³)', avg: benchmark.avg.waterProductivity, top: benchmark.top.waterProductivity, user: userBench?.waterProductivity },
              ].map(metric => {
                const maxVal = Math.max(metric.avg, metric.top, metric.user || 0, 0.1);
                return (
                  <div key={metric.label} className="rounded-lg border border-border p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium">{metric.label}</span>
                      {metric.user != null && (
                        <span className="text-[10px] font-mono">
                          You: <strong>{metric.user}</strong> · Avg: {metric.avg} · Top 25%: {metric.top}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <BenchBar label="Global avg" value={metric.avg} max={maxVal} color="#94a3b8" />
                      <BenchBar label="Top 25%" value={metric.top} max={maxVal} color="#16a34a" />
                      {metric.user != null && <BenchBar label="You" value={metric.user} max={maxVal} color="#6366f1" />}
                    </div>
                  </div>
                );
              })}

              {userBench && (
                <div className="rounded-lg p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
                  <div className="text-xs">
                    {userBench.yield >= benchmark.top.yield ? '🏆 You\'re in the top 25% for yield!' :
                     userBench.yield >= benchmark.avg.yield ? '✅ You\'re above the global average. Room to improve to reach top 25%.' :
                     '⚠️ You\'re below the global average. Check the Yield Gap Analysis tool for recommendations.'}
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
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Your Community Profile</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px]">Name</Label>
              <Input value={profile?.name || ''} onChange={e => { const p = { ...profile, name: e.target.value } as UserProfile; setProfile(p); saveProfile(p); }} className="h-8 text-xs mt-0.5" placeholder="Your name" />
            </div>
            <div>
              <Label className="text-[10px]">Role</Label>
              <select value={profile?.role || 'grower'} onChange={e => { const p = { ...profile, role: e.target.value as UserProfile['role'] } as UserProfile; setProfile(p); saveProfile(p); }} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5">
                <option value="grower">Grower</option>
                <option value="agronomist">Agronomist</option>
                <option value="consultant">Consultant</option>
                <option value="student">Student</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label className="text-[10px]">Farm name</Label>
              <Input value={profile?.farm || ''} onChange={e => { const p = { ...profile, farm: e.target.value } as UserProfile; setProfile(p); saveProfile(p); }} className="h-8 text-xs mt-0.5" placeholder="Farm name" />
            </div>
            <div>
              <Label className="text-[10px]">Region</Label>
              <Input value={profile?.region || ''} onChange={e => { const p = { ...profile, region: e.target.value } as UserProfile; setProfile(p); saveProfile(p); }} className="h-8 text-xs mt-0.5" placeholder="Your region" />
            </div>
          </div>
          <div>
            <Label className="text-[10px]">Crops you grow (comma-separated)</Label>
            <Input value={(profile?.crops || []).join(', ')} onChange={e => { const p = { ...profile, crops: e.target.value.split(',').map(c => c.trim()).filter(Boolean) } as UserProfile; setProfile(p); saveProfile(p); }} className="h-8 text-xs mt-0.5" placeholder="tomato, maize, avocado" />
          </div>
          <div className="text-[10px] text-muted-foreground text-center pt-2">Your profile is stored locally and attached to your community posts.</div>
        </div>
      )}
    </div>
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
