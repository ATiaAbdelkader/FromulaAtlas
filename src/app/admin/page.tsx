'use client';

/**
 * Admin dashboard — WhatsApp brief pipeline metrics.
 *
 * URL: /admin
 *
 * Auth: simple shared-secret. Enter ADMIN_SECRET in the prompt; it's sent
 * as x-admin-secret header on all API calls. Stored in sessionStorage only
 * (not localStorage — cleared when tab closes).
 *
 * Shows:
 *   - Summary: total farmers, active subs, unsubscribed
 *   - Today: sent / failed / skipped / delivered / read counts
 *   - 7-day trend: bar chart of sent/failed/skipped per day
 *   - Recent 20 brief logs: masked phone, status, preview, error
 *   - Current send mode (stub/live badge)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Sprout, ShieldAlert, Loader2, RefreshCw, Users, Bell, BellOff,
  Send, AlertCircle, CheckCircle2, XCircle, Eye, Activity,
} from 'lucide-react';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface AdminStats {
  sendMode: 'stub' | 'live';
  summary: {
    totalFarmers: number;
    activeSubs: number;
    unsubscribedSubs: number;
  };
  today: Record<string, number>;
  trend: Array<{ date: string; sent: number; failed: number; skipped: number }>;
  recentLogs: Array<{
    id: string;
    sentAt: string;
    status: string;
    sendMode: string;
    language: string;
    briefLength: number;
    weatherSource: string;
    errorMessage: string | null;
    briefPreview: string;
    farmerPhone: string;
    farmerName: string | null;
  }>;
}

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check sessionStorage for saved secret
  useEffect(() => {
    const saved = sessionStorage.getItem('admin_secret');
    if (saved) {
      setSecret(saved);
      setAuthed(true);
    }
  }, []);

  const fetchStats = useCallback(async (secretValue: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'x-admin-secret': secretValue },
      });
      if (res.status === 401) {
        setError('Invalid admin secret');
        setAuthed(false);
        sessionStorage.removeItem('admin_secret');
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to fetch stats');
        return;
      }
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed && secret) {
      fetchStats(secret);
    }
  }, [authed, secret, fetchStats]);

  const handleLogin = () => {
    if (!secret) return;
    sessionStorage.setItem('admin_secret', secret);
    setAuthed(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_secret');
    setAuthed(false);
    setSecret('');
    setStats(null);
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <ShieldAlert className="h-6 w-6 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold">Admin Access</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the admin secret to view pipeline metrics.
            </p>
          </div>
          <Input
            type="password"
            placeholder="Admin secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            autoFocus
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <Button onClick={handleLogin} disabled={!secret} className="w-full">
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/95 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sprout className="h-4 w-4 text-emerald-600" />
            FormulaAtlas Admin
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={stats?.sendMode === 'live' ? 'default' : 'secondary'}>
              {stats?.sendMode ?? '...'} mode
            </Badge>
            <Button variant="outline" size="sm" onClick={() => fetchStats(secret)} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 space-y-8">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {loading && !stats ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : stats ? (
          <>
            {/* Summary cards */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryCard icon={Users} label="Total Farmers" value={stats.summary.totalFarmers} color="text-blue-600" />
              <SummaryCard icon={Bell} label="Active Subscriptions" value={stats.summary.activeSubs} color="text-emerald-600" />
              <SummaryCard icon={BellOff} label="Unsubscribed" value={stats.summary.unsubscribedSubs} color="text-muted-foreground" />
            </section>

            {/* Today's stats */}
            <section>
              <h2 className="text-lg font-semibold mb-3">Today&apos;s Briefs</h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <StatTile icon={Send} label="Sent" value={stats.today.SENT ?? 0} color="text-blue-600" />
                <StatTile icon={CheckCircle2} label="Delivered" value={(stats.today.DELIVERED ?? 0) + (stats.today.READ ?? 0)} color="text-emerald-600" />
                <StatTile icon={Eye} label="Read" value={stats.today.READ ?? 0} color="text-purple-600" />
                <StatTile icon={XCircle} label="Failed" value={stats.today.FAILED ?? 0} color="text-red-600" />
                <StatTile icon={AlertCircle} label="Skipped" value={stats.today.SKIPPED ?? 0} color="text-amber-600" />
              </div>
            </section>

            {/* 7-day trend */}
            <section>
              <h2 className="text-lg font-semibold mb-3">Last 7 Days</h2>
              <div className="flex items-end gap-2 h-32 rounded-lg border border-border p-4 bg-card">
                {stats.trend.map((day) => {
                  const total = day.sent + day.failed + day.skipped;
                  const max = Math.max(...stats.trend.map(d => d.sent + d.failed + d.skipped), 1);
                  const sentH = (day.sent / max) * 100;
                  const failedH = (day.failed / max) * 100;
                  const skippedH = (day.skipped / max) * 100;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col-reverse h-24 gap-0.5">
                        {total === 0 ? (
                          <div className="w-full h-1 bg-muted rounded" />
                        ) : (
                          <>
                            <div className="w-full bg-blue-500 rounded" style={{ height: `${sentH}%` }} title={`Sent: ${day.sent}`} />
                            <div className="w-full bg-red-500 rounded" style={{ height: `${failedH}%` }} title={`Failed: ${day.failed}`} />
                            <div className="w-full bg-amber-500 rounded" style={{ height: `${skippedH}%` }} title={`Skipped: ${day.skipped}`} />
                          </>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Recent logs */}
            <section>
              <h2 className="text-lg font-semibold mb-3">Recent Brief Logs</h2>
              <div className="space-y-2">
                {stats.recentLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No briefs logged yet. The cron runs at 05:30 UTC daily.
                  </p>
                ) : (
                  stats.recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-lg border border-border p-3 bg-card flex items-start gap-3"
                    >
                      <StatusIcon status={log.status} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{log.farmerPhone}</span>
                          {log.farmerName && <span className="text-muted-foreground">· {log.farmerName}</span>}
                          <Badge variant="outline" className="text-[10px]">{log.status}</Badge>
                          <Badge variant="outline" className="text-[10px]">{log.language}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {log.briefPreview || <span className="italic">No preview</span>}
                        </p>
                        {log.errorMessage && (
                          <p className="text-xs text-red-600 mt-1">⚠ {log.errorMessage}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {new Date(log.sentAt).toLocaleString('en', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-center">
      <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  const className = "h-4 w-4 mt-0.5 flex-shrink-0";
  switch (status) {
    case 'SENT': return <Send className={`${className} text-blue-600`} />;
    case 'DELIVERED': return <CheckCircle2 className={`${className} text-emerald-600`} />;
    case 'READ': return <Eye className={`${className} text-purple-600`} />;
    case 'FAILED': return <XCircle className={`${className} text-red-600`} />;
    case 'SKIPPED': return <AlertCircle className={`${className} text-amber-600`} />;
    default: return <Activity className={`${className} text-muted-foreground`} />;
  }
}
