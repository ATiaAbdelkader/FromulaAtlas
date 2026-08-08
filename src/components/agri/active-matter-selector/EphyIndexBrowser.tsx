'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, FlaskConical, Hash, Loader2, Search } from 'lucide-react';
import {
  fetchEphyMfscIndex, fetchEphyPppIndex, normEphy, ephyActiveSummary,
  type EphyMfscProduct, type EphyPppProduct,
} from '@/lib/ephy-index';

const PAGE_SIZE = 40;

function EtatBadge({ etat }: { etat: string }) {
  if (etat === 'AUTORISE') {
    return <Badge className="shrink-0 bg-emerald-600 px-1.5 py-0 text-[9px] text-white">Autorisé</Badge>;
  }
  if (etat === 'RETIRE') {
    return <Badge className="shrink-0 bg-red-600 px-1.5 py-0 text-[9px] text-white">Retiré</Badge>;
  }
  return <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[9px]">—</Badge>;
}

/** Normalise an AMM query: "8800006", "88 00 006", "88-00-006" → "8800006". */
const ammNorm = (s: string) => (s ?? '').replace(/\D/g, '');

export function EphyIndexBrowser() {
  const [kind, setKind] = useState<'ppp' | 'mfsc'>('ppp');
  const [ppp, setPpp] = useState<EphyPppProduct[] | null>(null);
  const [mfsc, setMfsc] = useState<EphyMfscProduct[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [fonction, setFonction] = useState('all');
  const [classe, setClasse] = useState('all');
  const [etat, setEtat] = useState('all');
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    if (kind !== 'ppp' || ppp || error) return;
    let alive = true;
    fetchEphyPppIndex()
      .then((l) => { if (alive) setPpp(l); })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : String(e)); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  useEffect(() => {
    if (kind !== 'mfsc' || mfsc || error) return;
    let alive = true;
    fetchEphyMfscIndex()
      .then((l) => { if (alive) setMfsc(l); })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : String(e)); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const fonctions = useMemo(() => {
    if (!ppp) return [];
    const s = new Set<string>();
    for (const p of ppp) for (const f of p.fonctions) s.add(f);
    return [...s].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [ppp]);

  const classes = useMemo(() => {
    if (!mfsc) return [];
    const s = new Set<string>();
    for (const p of mfsc) if (p.classe) s.add(p.classe);
    return [...s].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [mfsc]);

  const filteredPpp = useMemo(() => {
    if (!ppp) return [];
    const q = normEphy(query.trim());
    const aq = ammNorm(query);
    return ppp.filter((p) => {
      if (etat !== 'all' && p.etat !== etat) return false;
      if (fonction !== 'all' && !p.fonctions.includes(fonction)) return false;
      if (q) {
        const hay = normEphy(
          `${p.name} ${p.alt.join(' ')} ${p.titulaire} ${ephyActiveSummary(p)} ${p.formulations.join(' ')}`,
        );
        if (!hay.includes(q) && !(aq.length >= 4 && aq === ammNorm(p.amm))) return false;
      }
      return true;
    });
  }, [ppp, query, fonction, etat]);

  const filteredMfsc = useMemo(() => {
    if (!mfsc) return [];
    const q = normEphy(query.trim());
    const aq = ammNorm(query);
    return mfsc.filter((p) => {
      if (etat !== 'all' && p.etat !== etat) return false;
      if (classe !== 'all' && p.classe !== classe) return false;
      if (q) {
        const hay = normEphy(`${p.name} ${p.titulaire} ${p.composition} ${p.classe} ${p.revendication}`);
        if (!hay.includes(q) && !(aq.length >= 4 && aq === ammNorm(p.amm))) return false;
      }
      return true;
    });
  }, [mfsc, query, classe, etat]);

  const list = kind === 'ppp' ? ppp : mfsc;
  const filtered = kind === 'ppp' ? filteredPpp : filteredMfsc;
  const shown = filtered.slice(0, visible);

  const reset = () => { setVisible(PAGE_SIZE); };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical className="h-4 w-4 text-sky-600" />
          Catalogue E-Phy — France (Anses)
        </CardTitle>
        <CardDescription>
          Produits phytopharmaceutiques, adjuvants et mélanges homologués en France, et
          matières fertilisantes &amp; supports de culture (MFSC) — catalogue ouvert
          E-Phy, Licence Ouverte 2.0.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Tabs
          value={kind}
          onValueChange={(v) => {
            setKind(v as 'ppp' | 'mfsc');
            setError('');
            setVisible(PAGE_SIZE);
          }}
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="ppp">🧪 Produits phyto ({ppp ? ppp.length : '…'})</TabsTrigger>
            <TabsTrigger value="mfsc">🌱 Fertilisants ({mfsc ? mfsc.length : '…'})</TabsTrigger>
          </TabsList>

          <div className="mt-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); reset(); }}
                placeholder={
                  kind === 'ppp'
                    ? 'Rechercher : nom, substance active, titulaire, n° AMM…'
                    : 'Rechercher : nom, composition, classe, titulaire, n° AMM…'
                }
                className="pl-8 text-xs"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Select value={etat} onValueChange={(v) => { setEtat(v); reset(); }}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Autorisation : toutes</SelectItem>
                  <SelectItem value="AUTORISE">Autorisés</SelectItem>
                  <SelectItem value="RETIRE">Retirés</SelectItem>
                </SelectContent>
              </Select>
              {kind === 'ppp' ? (
                <Select value={fonction} onValueChange={(v) => { setFonction(v); reset(); }}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="all">Fonction : toutes</SelectItem>
                    {fonctions.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={classe} onValueChange={(v) => { setClasse(v); reset(); }}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="all">Classe : toutes</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="hidden sm:block" />
            </div>
          </div>
        </Tabs>

        {error ? (
          <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Impossible de charger le catalogue E-Phy ({error}) — vérifiez que
            <code className="mx-1 rounded bg-muted px-1">/data/ephy-ppp-index.json</code> et
            <code className="mx-1 rounded bg-muted px-1">/data/ephy-mfsc-index.json</code> sont bien présents dans{' '}
            <code className="rounded bg-muted px-1">public/</code>.
          </p>
        ) : !list ? (
          <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-sky-600" /> Lecture du catalogue…
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {filtered.length} produit{filtered.length > 1 ? 's' : ''}
              </Badge>
              {query && <Badge variant="outline" className="text-[10px]">filtre : « {query} »</Badge>}
            </div>

            {filtered.length === 0 ? (
              <p className="rounded-xl border border-dashed px-4 py-10 text-center text-xs text-muted-foreground">
                Aucun produit ne correspond — essayez le nom (ex : « ROGOR »), la substance
                (ex : « diméthoate ») ou un n° AMM (ex : « 8800006 »).
              </p>
            ) : (
              <div className="space-y-2">
                {shown.map((p) => (
                  kind === 'ppp' ? (
                    <PppRow key={(p as EphyPppProduct).amm} p={p as EphyPppProduct} />
                  ) : (
                    <MfscRow key={(p as EphyMfscProduct).amm} p={p as EphyMfscProduct} />
                  )
                ))}

                {shown.length < filtered.length && (
                  <div className="flex justify-center pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setVisible((v) => v + PAGE_SIZE)}
                    >
                      Afficher {Math.min(PAGE_SIZE, filtered.length - shown.length)} autres produits
                    </Button>
                  </div>
                )}
              </div>
            )}

            <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Catalogue E-Phy (France) : l’autorisation française ne vaut pas autorisation en Algérie.
              L’utilisation reste soumise à l’homologation INPV en vigueur et aux mentions de l’étiquette.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PppRow({ p }: { p: EphyPppProduct }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border bg-card px-3 py-2.5 transition hover:border-sky-400/60">
      <Badge className="shrink-0 bg-slate-800 font-mono text-[10px] text-white dark:bg-slate-200 dark:text-slate-900">
        <Hash className="mr-1 h-3 w-3" />{p.amm}
      </Badge>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-xs font-semibold">{p.name || '—'}</span>
          <EtatBadge etat={p.etat} />
          {p.fonctions.slice(0, 2).map((f) => (
            <Badge key={f} variant="secondary" className="px-1.5 py-0 text-[10px]">{f}</Badge>
          ))}
          {p.formulations[0] && (
            <Badge variant="outline" className="px-1.5 py-0 text-[9px]">{p.formulations[0]}</Badge>
          )}
        </div>
        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
          <span className="font-medium text-sky-700 dark:text-sky-400">{ephyActiveSummary(p) || '—'}</span>
          {p.titulaire && <span> · {p.titulaire}</span>}
          {p.premiereAutorisation && <span> · autorisé {p.premiereAutorisation}</span>}
        </div>
        {p.alt.length > 0 && (
          <div className="mt-0.5 text-[10px] text-slate-400">
            aussi : {p.alt.slice(0, 3).join(', ')}{p.alt.length > 3 ? ` +${p.alt.length - 3}` : ''}
          </div>
        )}
      </div>
    </div>
  );
}

function MfscRow({ p }: { p: EphyMfscProduct }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border bg-card px-3 py-2.5 transition hover:border-sky-400/60">
      <Badge className="shrink-0 bg-slate-800 font-mono text-[10px] text-white dark:bg-slate-200 dark:text-slate-900">
        <Hash className="mr-1 h-3 w-3" />{p.amm || '—'}
      </Badge>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-xs font-semibold">{p.name || '—'}</span>
          <EtatBadge etat={p.etat} />
          {p.classe && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{p.classe}</Badge>
          )}
        </div>
        <div className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
          {p.composition ? (
            <span>{p.composition}</span>
          ) : (
            <span className="italic text-slate-400">Composition non publiée dans le jeu de données</span>
          )}
          {p.titulaire && <span> · {p.titulaire}</span>}
        </div>
      </div>
    </div>
  );
}
