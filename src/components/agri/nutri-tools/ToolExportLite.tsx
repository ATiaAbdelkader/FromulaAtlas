'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ClipboardCopy, FileText, FileSpreadsheet, Share2, Check, RotateCcw,
} from 'lucide-react';

/**
 * Lightweight export bar for CollapsibleSection tools — doesn't require
 * a ToolMeta object. Works with any tool by extracting its visible text
 * content from the DOM.
 *
 * Usage:
 *   <CollapsibleSection title="..." ...>
 *     <div className="p-4">
 *       <ToolExportLite title="Seed Rate Calculator" description="..." />
 *       <SeedRateCalculator />
 *     </div>
 *   </CollapsibleSection>
 */

export interface ToolExportLiteProps {
  /** Tool display name (for PDF title + filename) */
  title: string;
  /** Optional short description */
  description?: string;
  /** Optional: ID for the container whose text content should be
   *  extracted for copy/CSV. If omitted, extracts from the nearest
   *  parent CollapsibleSection body. */
  contentSelector?: string;
}

const pad2 = (n: number) => n.toString().padStart(2, '0');

function nowStamp() {
  const d = new Date();
  return {
    display: d.toLocaleString(),
    file: `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}`,
  };
}

/** Extract visible text from the tool's container — walks up to find
 *  the nearest .collapsible-body div and grabs its textContent. */
function extractToolContent(): string {
  // Try to find the collapsible body (the parent of the export bar)
  const exportBar = document.activeElement?.closest('[data-export-bar]');
  const body = exportBar?.closest('.collapsible-body') ?? exportBar?.parentElement;
  if (body) {
    // Clone, remove the export bar itself from the clone, then extract text
    const clone = body.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('[data-export-bar]').forEach(el => el.remove());
    return clone.textContent?.trim().replace(/\n{3,}/g, '\n\n') || '';
  }
  return '';
}

function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

export function ToolExportLite({ title, description }: ToolExportLiteProps) {
  const [copied, setCopied] = useState<'copy' | 'share' | null>(null);
  const flash = (k: 'copy' | 'share') => {
    setCopied(k);
    setTimeout(() => setCopied(prev => (prev === k ? null : prev)), 2000);
  };

  const onCopy = async () => {
    const content = extractToolContent();
    const summary = [
      `Formula Atlas — ${title}`,
      description ? `Description: ${description}` : '',
      '',
      content,
      '',
      `Generated: ${nowStamp().display}`,
    ].filter(Boolean).join('\n');
    try { await navigator.clipboard.writeText(summary); flash('copy'); } catch { /* clipboard blocked */ }
  };

  const onCsv = () => {
    const content = extractToolContent();
    const lines = content.split('\n').filter(l => l.trim());
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = lines.map(line => {
      // Try to split on first colon (label: value pattern)
      const idx = line.indexOf(':');
      if (idx > 0 && idx < 40) {
        return `${esc(line.slice(0, idx).trim())},${esc(line.slice(idx + 1).trim())}`;
      }
      return `${esc('')},${esc(line.trim())}`;
    });
    const csv = ['Field,Value', ...rows, `"Generated","${nowStamp().display}"`].join('\r\n');
    downloadBlob(`formula-atlas-${slugify(title)}-${nowStamp().file}.csv`, csv, 'text/csv;charset=utf-8');
  };

  const onPdf = () => {
    const content = extractToolContent();
    const ts = nowStamp().display;
    const slug = slugify(title);
    const w = window.open('', '_blank', 'width=900,height=1200');
    if (!w) return;
    // Convert plain text to HTML (preserve line breaks, basic formatting)
    const htmlContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>\n');
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title} — Report</title>
<style>
body{font:14px/1.6 -apple-system,'Segoe UI',Roboto,sans-serif;color:#111;padding:32px;max-width:780px;margin:auto}
h1{font-size:22px;color:#15803d;margin:0 0 6px}
.desc{color:#666;font-size:13px;margin:0 0 16px}
.body{border:1px solid #eee;border-radius:8px;padding:16px;margin:16px 0}
.foot{margin-top:24px;font-size:11px;color:#888;border-top:1px solid #eee;padding-top:8px}
</style></head><body>
<h1>${title}</h1>
${description ? `<p class="desc">${description}</p>` : ''}
<div class="body">${htmlContent}</div>
<div class="foot">Generated by Formula Atlas · ${ts}</div>
<script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script>
</body></html>`);
    w.document.close();
  };

  const onShare = async () => {
    const slug = slugify(title);
    const url = `${window.location.origin}/app#tool=${slug}`;
    try { await navigator.clipboard.writeText(url); flash('share'); } catch { /* clipboard blocked */ }
  };

  return (
    <div data-export-bar className="flex flex-wrap items-center gap-1.5 mb-3 pb-2 border-b border-border/40">
      <Button size="sm" variant="ghost" onClick={onCopy} className="h-7 gap-1 text-[11px] text-muted-foreground hover:text-foreground">
        {copied === 'copy' ? <Check className="h-3 w-3 text-emerald-600" /> : <ClipboardCopy className="h-3 w-3" />}
        {copied === 'copy' ? 'Copied' : 'Copy'}
      </Button>
      <Button size="sm" variant="ghost" onClick={onCsv} className="h-7 gap-1 text-[11px] text-muted-foreground hover:text-foreground">
        <FileSpreadsheet className="h-3 w-3" /> CSV
      </Button>
      <Button size="sm" variant="ghost" onClick={onPdf} className="h-7 gap-1 text-[11px] text-muted-foreground hover:text-foreground">
        <FileText className="h-3 w-3" /> PDF
      </Button>
      <Button size="sm" variant="ghost" onClick={onShare} className="h-7 gap-1 text-[11px] text-muted-foreground hover:text-foreground">
        {copied === 'share' ? <Check className="h-3 w-3 text-emerald-600" /> : <Share2 className="h-3 w-3" />}
        {copied === 'share' ? 'Link copied' : 'Share'}
      </Button>
    </div>
  );
}
