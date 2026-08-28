'use client';
import { GitBranch, Clock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { decisionTrees, type DecisionTree } from '@/lib/decision-trees';
import { cn } from '@/lib/utils';

interface Props {
  onLaunch: (tree: DecisionTree) => void;
  onSelectFormula?: (code: string) => void;
}

export function DecisionTreesSection({ onLaunch }: Props) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1"><GitBranch className="h-4 w-4 text-emerald-600" /><h2 className="text-lg font-semibold tracking-tight">Decision Trees</h2></div>
          <p className="text-sm text-muted-foreground">Walk through symptoms step-by-step to reach a recommended action.</p>
        </div>
        <Badge variant="outline" className="text-xs">{decisionTrees.length} trees</Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {decisionTrees.map(tree => {
          const nodeCount = Object.keys(tree.nodes).length;
          const leafCount = Object.values(tree.nodes).filter(n => n.action).length;
          return (
            <button key={tree.id} onClick={() => onLaunch(tree)} className="group relative text-left rounded-xl border-2 border-border bg-card hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-md hover:-translate-y-0.5 transition-all p-4">
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-50 dark:bg-emerald-950/40" />
              <div className="flex items-start justify-between gap-2 mb-3 mt-1">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600"><GitBranch className="h-5 w-5" /></div>
                <Badge variant="outline" className="text-[10px] gap-1"><Clock className="h-2.5 w-2.5" />~3 min</Badge>
              </div>
              <h3 className="text-base font-semibold leading-tight mb-2">{tree.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{tree.summary}</p>
              <div className="flex items-center gap-3 mb-3 text-[10px] text-muted-foreground"><span>{nodeCount} questions</span><span>{leafCount} outcomes</span></div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">Start decision tree<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
