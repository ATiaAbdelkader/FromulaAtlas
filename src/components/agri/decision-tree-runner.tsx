'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, ChevronRight, ChevronLeft, X, RotateCcw, AlertTriangle, AlertCircle, Info, ArrowRight, BookOpen } from 'lucide-react';
import type { DecisionTree, DecisionNode } from '@/lib/decision-trees';
import { allFormulas } from '@/lib/formulas-data';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

interface Props { tree: DecisionTree | null; open: boolean; onOpenChange: (open: boolean) => void; onSelectFormula?: (code: string) => void; }

export function DecisionTreeRunner({ tree, open, onOpenChange, onSelectFormula }: Props) {
  const [currentNodeId, setCurrentNodeId] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  if (tree && currentNodeId === '') setCurrentNodeId(tree.rootNodeId);
  if (!tree) return null;
  const currentNode: DecisionNode | undefined = tree.nodes[currentNodeId];
  if (!currentNode) return null;

  const isLeaf = !!currentNode.action;
  const severity = currentNode.action?.severity;
  const SeverityIcon = severity === 'critical' ? AlertCircle : severity === 'warning' ? AlertTriangle : Info;

  const handleBranch = (label: string, next: string) => { setHistory([...history, currentNodeId]); setCurrentNodeId(next); };
  const handleBack = () => { if (history.length > 0) { const prev = history[history.length - 1]; setHistory(history.slice(0, -1)); setCurrentNodeId(prev); } };
  const handleRestart = () => { setCurrentNodeId(tree.rootNodeId); setHistory([]); };
  const handleClose = () => { onOpenChange(false); setTimeout(() => { setCurrentNodeId(''); setHistory([]); }, 300); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-gradient-to-r from-emerald-50 via-background to-background dark:from-emerald-950/40">
          <div className="flex items-start justify-between gap-3">
            <div><Badge variant="outline" className="text-[10px] mb-2">Decision Tree</Badge><DialogTitle className="text-xl font-bold">{tree.title}</DialogTitle><DialogDescription className="text-sm mt-1">{tree.summary}</DialogDescription></div>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8"><X className="h-4 w-4" /></Button>
          </div>
        </DialogHeader>
        {history.length > 0 && (
          <div className="px-6 py-2 border-b border-border bg-muted/30">
            <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-muted-foreground">
              <span className="font-semibold uppercase">Path:</span>
              {history.map((id, idx) => <span key={idx} className="px-1.5 py-0.5 rounded bg-background border">{tree.nodes[id].question.slice(0, 20)}...</span>)}
              <ChevronRight className="h-2.5 w-2.5" /><span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 font-medium">Current</span>
            </div>
          </div>
        )}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <div className="flex items-start gap-2"><div className="flex items-center justify-center h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 font-bold text-sm flex-shrink-0 mt-0.5">?</div><h3 className="text-lg font-semibold leading-tight pt-0.5">{currentNode.question}</h3></div>
              {currentNode.hint && <div className="ml-9 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3 text-xs text-blue-800 dark:text-blue-300">{currentNode.hint}</div>}
            </div>
            {!isLeaf && currentNode.branches && (
              <div className="space-y-2 ml-9">
                {currentNode.branches.map((branch, idx) => (
                  <button key={idx} onClick={() => handleBranch(branch.label, branch.next)} className="group w-full text-left flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-sm transition-all">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-bold group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950 group-hover:text-emerald-700">{String.fromCharCode(65 + idx)}</span>
                    <span className="flex-1 text-sm font-medium">{branch.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
              </div>
            )}
            {isLeaf && currentNode.action && (
              <div className={cn('ml-9 rounded-lg border-2 p-4 space-y-3', severity === 'critical' ? 'border-red-300 bg-red-50 dark:bg-red-950/30' : severity === 'warning' ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/30' : 'border-blue-300 bg-blue-50 dark:bg-blue-950/30')}>
                <div className="flex items-center gap-2"><SeverityIcon className="h-5 w-5" /><Badge variant="outline" className="text-[10px] uppercase">{severity}</Badge></div>
                <h4 className="text-lg font-bold">{currentNode.action.title}</h4>
                <p className="text-sm leading-relaxed">{currentNode.action.details}</p>
                {currentNode.action.relatedFormulas && currentNode.action.relatedFormulas.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase"><BookOpen className="h-3.5 w-3.5" />Consult these formulas</div>
                    <div className="flex flex-wrap gap-1.5">
                      {currentNode.action.relatedFormulas.map(code => {
                        const formula = allFormulas.find(f => f.code === code); if (!formula) return null;
                        return <button key={code} onClick={() => { if (onSelectFormula) { handleClose(); setTimeout(() => onSelectFormula(code), 400); } }} className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-background hover:border-emerald-300 text-xs"><Badge variant="outline" className="font-mono text-[10px] p-0 h-auto">{code}</Badge><span className="font-medium">{formula.name}</span><ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100" /></button>;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {history.length > 0 && <Button variant="outline" size="sm" onClick={handleBack} className="gap-1.5"><ChevronLeft className="h-4 w-4" />Back</Button>}
            {history.length > 0 && <Button variant="ghost" size="sm" onClick={handleRestart} className="gap-1.5 text-xs"><RotateCcw className="h-3.5 w-3.5" />Restart</Button>}
          </div>
          {isLeaf && <Button onClick={handleRestart} size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"><Check className="h-4 w-4" />Done</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
