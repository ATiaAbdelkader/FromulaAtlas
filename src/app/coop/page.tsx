'use client';

/**
 * Cooperative dashboard — for coop admins, agronomists, and members.
 *
 * URL: /coop
 *
 * - If not logged in → redirect to /auth
 * - If logged in but no coops → show "Create or join a cooperative"
 * - If has coops → show list + selected coop's stats (aggregate for MEMBERS,
 *   per-member breakdown for ADMIN/AGRONOMIST)
 *
 * Admins can:
 *   - See the join code (share with members)
 *   - See per-member farm data (with consent)
 *   - View crop distribution + total area
 *
 * Members can:
 *   - See anonymized aggregate (total area, crop distribution, member count)
 *   - See their own farm (via existing farm profile)
 *   - Consent to share their data with agronomists
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sprout, Users, Plus, ArrowRight, ArrowLeft, Loader2, AlertCircle,
  CheckCircle2, XCircle, MapPin, Wheat, Copy, Check, Crown,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/lib/language-store';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CoopSummary {
  id: string;
  name: string;
  description: string | null;
  joinCode?: string;
  role: 'ADMIN' | 'AGRONOMIST' | 'MEMBER';
  consentShareData: boolean;
  joinedAt: string;
  memberCount: number;
  isAdmin: boolean;
}

interface CoopStats {
  cooperative: { id: string; name: string; description: string | null; adminFarmerId: string; createdAt: string };
  role: 'ADMIN' | 'AGRONOMIST' | 'MEMBER';
  stats: {
    totalMembers: number;
    consentingMembers: number;
    farmsWithData: number;
    totalAreaHa: number;
    cropDistribution: Record<string, number>;
  };
  members?: Array<{
    id: string;
    phone: string;
    name: string | null;
    role: string;
    consentShareData: boolean;
    joinedAt: string;
    hasFarm: boolean;
    farm: { name: string | null; crop: string | null; areaHa: number | null; plantingDate: string | null } | null;
  }>;
}

export default function CoopPage() {
  const { data: session, status } = useSession();
  const { isRTL, language } = useTranslation();
  const isArabic = language === 'ar';
  const isFrench = language === 'fr';
  const DirectionArrow = isRTL ? ArrowLeft : ArrowRight;
  const t = (en: string, ar: string, fr: string) => (isArabic ? ar : isFrench ? fr : en);

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [coops, setCoops] = useState<CoopSummary[]>([]);
  const [selectedCoopId, setSelectedCoopId] = useState<string | null>(null);
  const [stats, setStats] = useState<CoopStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Join form
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinConsent, setJoinConsent] = useState(false);
  const [joining, setJoining] = useState(false);

  // Copied code state
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?redirect=/coop');
      return;
    }
    if (status === 'authenticated') {
      loadCoops();
    }
  }, [status, router]);

  const loadCoops = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/coop');
      const data = await res.json();
      setCoops(data.cooperatives ?? []);
      if (data.cooperatives?.length > 0 && !selectedCoopId) {
        setSelectedCoopId(data.cooperatives[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [selectedCoopId]);

  useEffect(() => {
    if (!selectedCoopId) {
      setStats(null);
      return;
    }
    let cancelled = false;
    setStatsLoading(true);
    fetch(`/api/coop/stats?id=${selectedCoopId}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) setStats(data);
      })
      .catch(e => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load stats');
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedCoopId]);

  const handleCreate = useCallback(async () => {
    if (!createName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/coop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName, description: createDesc || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create');
        return;
      }
      setShowCreate(false);
      setCreateName('');
      setCreateDesc('');
      await loadCoops();
      setSelectedCoopId(data.cooperative.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setCreating(false);
    }
  }, [createName, createDesc, loadCoops]);

  const handleJoin = useCallback(async () => {
    if (joinCode.length !== 6) return;
    setJoining(true);
    setError(null);
    try {
      const res = await fetch('/api/coop/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode, consentShareData: joinConsent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to join');
        return;
      }
      setShowJoin(false);
      setJoinCode('');
      setJoinConsent(false);
      await loadCoops();
      setSelectedCoopId(data.cooperative.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setJoining(false);
    }
  }, [joinCode, joinConsent, loadCoops]);

  const copyJoinCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <Sprout className="h-4 w-4 text-emerald-600" />
            FormulaAtlas
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-emerald-600" />
              {t('Cooperatives', 'التعاونيات', 'Coopératives')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t(
                'Manage your farm groups and view aggregated stats.',
                'إدارة مجموعات المزارع وعرض الإحصائيات المجمّعة.',
                'Gérez vos groupes de fermes et consultez les statistiques agrégées.',
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowJoin(!showJoin); setShowCreate(false); }}>
              <Plus className="h-4 w-4" />
              {t('Join', 'انضمام', 'Rejoindre')}
            </Button>
            <Button size="sm" onClick={() => { setShowCreate(!showCreate); setShowJoin(false); }}>
              <Plus className="h-4 w-4" />
              {t('Create', 'إنشاء', 'Créer')}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Create form */}
        {showCreate && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-base">{t('Create a cooperative', 'إنشاء تعاونية', 'Créer une coopérative')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="coop-name">{t('Name', 'الاسم', 'Nom')}</Label>
                <Input id="coop-name" value={createName} onChange={e => setCreateName(e.target.value)} placeholder={t('El Oued Potato Coop', 'تعاونية البطاطا الوادي', 'Coop Pomme de terre El Oued')} />
              </div>
              <div>
                <Label htmlFor="coop-desc">{t('Description (optional)', 'الوصف (اختياري)', 'Description (optionnel)')}</Label>
                <Input id="coop-desc" value={createDesc} onChange={e => setCreateDesc(e.target.value)} />
              </div>
              <Button onClick={handleCreate} disabled={creating || createName.length < 3}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : t('Create', 'إنشاء', 'Créer')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Join form */}
        {showJoin && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-base">{t('Join a cooperative', 'انضمام لتعاونية', 'Rejoindre une coopérative')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="join-code">{t('Join code (6 characters)', 'رمز الانضمام (6 أحرف)', 'Code d\'adhésion (6 caractères)')}</Label>
                <Input
                  id="join-code"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="ABC123"
                  className="font-mono text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={joinConsent}
                  onChange={e => setJoinConsent(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-muted-foreground">
                  {t(
                    'I consent to share my farm data with the cooperative agronomists.',
                    'أوافق على مشاركة بيانات مزرعتي مع مهندسي التعاونية.',
                    "J'accepte de partager les données de ma ferme avec les agronomes de la coopérative.",
                  )}
                </span>
              </label>
              <Button onClick={handleJoin} disabled={joining || joinCode.length !== 6}>
                {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : t('Join', 'انضمام', 'Rejoindre')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No coops state */}
        {coops.length === 0 && !showCreate && !showJoin ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                {t(
                  'You are not a member of any cooperative yet. Create one or join with a code.',
                  'أنت لست عضواً في أي تعاونية بعد. أنشئ واحدة أو انضم برمز.',
                  "Vous n'êtes membre d'aucune coopérative. Créez-en une ou rejoignez avec un code.",
                )}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            {/* Coop list */}
            <div className="space-y-2">
              {coops.map(coop => (
                <button
                  key={coop.id}
                  onClick={() => setSelectedCoopId(coop.id)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    selectedCoopId === coop.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                      : 'border-border hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm truncate">{coop.name}</p>
                    {coop.role === 'ADMIN' && <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {coop.memberCount} {t('members', 'أعضاء', 'membres')}
                  </p>
                </button>
              ))}
            </div>

            {/* Selected coop detail */}
            <div>
              {statsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : stats ? (
                <div className="space-y-4">
                  {/* Header */}
                  <div>
                    <h2 className="text-xl font-bold">{stats.cooperative.name}</h2>
                    {stats.cooperative.description && (
                      <p className="text-sm text-muted-foreground mt-1">{stats.cooperative.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">
                        {t('Your role', 'دورك', 'Votre rôle')}: {stats.role}
                      </Badge>
                    </div>
                  </div>

                  {/* Join code (admin only) */}
                  {coops.find(c => c.id === selectedCoopId)?.joinCode && (
                    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/10">
                      <CardContent className="pt-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                            {t('Join code', 'رمز الانضمام', 'Code d\'adhésion')}
                          </p>
                          <p className="text-2xl font-mono font-bold tracking-widest mt-1">
                            {coops.find(c => c.id === selectedCoopId)?.joinCode}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('Share this code with members you want to invite.', 'شارك هذا الرمز مع الأعضاء الذين تريد دعوتهم.', 'Partagez ce code avec les membres à inviter.')}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyJoinCode(coops.find(c => c.id === selectedCoopId)?.joinCode ?? '')}
                        >
                          {copiedCode ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Aggregate stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label={t('Members', 'أعضاء', 'Membres')} value={stats.stats.totalMembers} />
                    <StatCard label={t('Sharing data', 'يشاركون البيانات', 'Partageant')} value={stats.stats.consentingMembers} />
                    <StatCard label={t('Farms', 'مزارع', 'Fermes')} value={stats.stats.farmsWithData} />
                    <StatCard label={t('Total area (ha)', 'المساحة (هكتار)', 'Surface (ha)')} value={stats.stats.totalAreaHa} />
                  </div>

                  {/* Crop distribution */}
                  {Object.keys(stats.stats.cropDistribution).length > 0 && (
                    <Card>
                      <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Wheat className="h-4 w-4 text-emerald-600" />{t('Crop distribution', 'توزيع المحاصيل', 'Distribution des cultures')}</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(stats.stats.cropDistribution)
                            .sort(([, a], [, b]) => b - a)
                            .map(([crop, count]) => {
                              const max = Math.max(...Object.values(stats.stats.cropDistribution));
                              const pct = (count / max) * 100;
                              return (
                                <div key={crop} className="flex items-center gap-3">
                                  <span className="text-sm w-24 capitalize">{crop}</span>
                                  <div className="flex-1 h-6 bg-muted rounded relative overflow-hidden">
                                    <div className="absolute inset-y-0 left-0 bg-emerald-500 rounded" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-sm font-medium w-8 text-right">{count}</span>
                                </div>
                              );
                            })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Members table (admin/agronomist only) */}
                  {stats.members && (
                    <Card>
                      <CardHeader><CardTitle className="text-sm">{t('Members', 'الأعضاء', 'Membres')}</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {stats.members.map(m => (
                            <div key={m.id} className="flex items-center gap-3 p-2 rounded-md border border-border">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{m.name ?? m.phone}</span>
                                  {m.role === 'ADMIN' && <Crown className="h-3 w-3 text-amber-500" />}
                                  {m.consentShareData ? (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                  ) : (
                                    <XCircle className="h-3 w-3 text-muted-foreground" />
                                  )}
                                </div>
                                {m.farm ? (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {m.farm.name && `${m.farm.name} · `}
                                    {m.farm.crop && <span className="capitalize">{m.farm.crop}</span>}
                                    {m.farm.areaHa != null && ` · ${m.farm.areaHa} ha`}
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {m.hasFarm ? t('Data not shared', 'البيانات غير مشتركة', 'Données non partagées') : t('No farm profile', 'لا يوجد ملف مزرعة', 'Aucun profil de ferme')}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
