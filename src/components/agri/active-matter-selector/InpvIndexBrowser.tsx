'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, FileText, Hash, Loader2, Search, FlaskConical } from 'lucide-react';
import {
  fetchPhytoIndex, normPhyto, sectionEmoji, sectionLabel, productActiveName,
  type PhytoProduct,
} from '@/lib/phyto-index';
import { ActiveMatterMechanismModal } from './ActiveMatterExplainer';

const PAGE_SIZE = 40;

/** Normalise a homologation query: "1252001", "12 52 001", "12-52-001" → "1252001". */
const homNorm = (s: string) => (s ?? '').replace(/\D/g, '');

export function InpvIndexBrowser() {
  const [products, setProducts] = useState<PhytoProduct[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [section, setSection] = useState('all');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selectedSubstanceForModal, setSelectedSubstanceForModal] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchPhytoIndex()
      .then((list) => {
        if (alive) setProducts(list);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      alive = false;
    };
  }, []);

  const sections = useMemo(() => {
    const set = new Set<string>();
    for (const p of products ?? []) if (p.section) set.add(p.section);
    return [...set].sort();
  }, [products]);

  const filtered = useMemo(() => {
    if (!products) return [];
    const q = normPhyto(query.trim());
    const hq = homNorm(query);
    return products.filter((p) => {
      if (section !== 'all' && p.section !== section) return false;
      if (q) {
        const hay = normPhyto(
          `${p.brand} ${productActiveName(p)} ${p.active_raw} ${p.company}`,
        );
        if (!hay.includes(q) && !(hq.length >= 4 && hq === homNorm(p.homologation))) {
          return false;
        }
      }
      return true;
    });
  }, [products, query, section]);

  const shown = filtered.slice(0, visible);

  return (
    <Card className="overflow-hidden rounded-2xl border-emerald-200/60 shadow-sm dark:border-emerald-900/60">
      <CardHeader className="border-b bg-emerald-50/40 pb-4 dark:bg-emerald-950/20">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-emerald-600" />
          <span>Index INPV 2017 — produits phytosanitaires (Algérie)</span>
        </CardTitle>
        <CardDescription>
          {products
            ? `${products.length} spécialités extraites de l’index officiel (pages 21–232) — homologation, marque, substance active, concentration et formulation.`
            : 'Chargement de l’index officiel…'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-5">
        {error ? (
          <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Impossible de charger l’index INPV ({error}) — vérifiez que
            <code className="mx-1 rounded bg-muted px-1">/data/phyto-2017-index.json</code>
            est bien présent dans <code className="rounded bg-muted px-1">public/</code>.
          </p>
        ) : !products ? (
          <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> Lecture de l’index…
          </div>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-[1fr_220px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setVisible(PAGE_SIZE);
                  }}
                  placeholder="Rechercher : marque, substance active, société, n° d’homologation…"
                  className="h-10 pl-9 text-sm"
                />
              </div>
              <Select
                value={section}
                onValueChange={(v) => {
                  setSection(v);
                  setVisible(PAGE_SIZE);
                }}
              >
                <SelectTrigger className="min-h-10 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">Toutes les sections</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s} value={s}>
                      {sectionEmoji(s)} {sectionLabel(s)} ({products.filter((p) => p.section === s).length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 p-2">
              <Badge variant="secondary" className="text-xs">{filtered.length} spécialité{filtered.length > 1 ? 's' : ''}</Badge>
              {query && (
                <Badge variant="outline" className="text-[10px]">filtre : « {query} »</Badge>
              )}
            </div>

            {filtered.length === 0 ? (
              <p className="rounded-xl border border-dashed px-4 py-10 text-center text-xs text-muted-foreground">
                Aucune spécialité ne correspond — essayez la marque, la substance (ex : « abamectine »)
                ou un n° d’homologation (ex : « 10 50 001 »).
              </p>
            ) : (
              <div className="space-y-2">
                {shown.map((p) => (
                  <div
                    key={`${p.homologation}-${p.brand}-${p.page}`}
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border bg-card p-3 shadow-sm transition hover:border-emerald-400/60 hover:shadow-md"
                  >
                    <Badge className="shrink-0 bg-slate-800 font-mono text-[10px] text-white dark:bg-slate-200 dark:text-slate-900">
                      <Hash className="mr-1 h-3 w-3" />{p.homologation}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-xs font-semibold">{p.brand || '—'}</span>
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                          {sectionEmoji(p.section)} {sectionLabel(p.section)}
                        </Badge>
                        {p.formulation && (
                          <Badge variant="outline" className="px-1.5 py-0 text-[9px] font-mono">{p.formulation}</Badge>
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">{productActiveName(p)}</span>
                        {p.concentration && <span> · {p.concentration}</span>}
                        {p.company && <span> · {p.company}</span>}
                        {p.active !== p.active_raw && p.active_raw && p.active.length > 2 && (
                          <span className="text-[10px] text-slate-400"> (brut : {p.active_raw})</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[10px] font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 gap-1 rounded-md"
                        onClick={() => setSelectedSubstanceForModal(p.active || p.brand)}
                        title="Voir comment fonctionne cette matière active"
                      >
                        <FlaskConical className="h-3 w-3" /> Mode d'action
                      </Button>
                      <span className="text-[10px] text-slate-400">p. {p.page}</span>
                    </div>
                  </div>
                ))}

                {shown.length < filtered.length && (
                  <div className="flex justify-center pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-10"
                      onClick={() => setVisible((v) => v + PAGE_SIZE)}
                    >
                      Afficher {Math.min(PAGE_SIZE, filtered.length - shown.length)} autres spécialités
                    </Button>
                  </div>
                )}
              </div>
            )}

            <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Index officiel de 2017 : une homologation peut avoir été retirée, renouvelée ou modifiée depuis.
              Vérifiez toujours auprès de l’INPV la validité actuelle avant toute utilisation.
            </p>
          </>
        )}
      </CardContent>

      <ActiveMatterMechanismModal
        isOpen={!!selectedSubstanceForModal}
        substanceName={selectedSubstanceForModal ?? undefined}
        onClose={() => setSelectedSubstanceForModal(null)}
      />
    </Card>
  );
}
