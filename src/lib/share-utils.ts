// Share & export utilities: shareable links, CSV export, print cards.
import type { Formula } from './types';

export function generateShareLink(formulaCode: string, inputs: Record<string, number>): string {
  const params = new URLSearchParams();
  params.set('calc', formulaCode);
  for (const [key, value] of Object.entries(inputs)) params.set(`i_${key}`, String(value));
  return `${window.location.origin}/?${params.toString()}`;
}

export function parseShareLink(url: string): { formulaCode: string; inputs: Record<string, number> } | null {
  try {
    const u = new URL(url);
    const calc = u.searchParams.get('calc');
    if (!calc) return null;
    const inputs: Record<string, number> = {};
    for (const [key, value] of u.searchParams.entries()) {
      if (key.startsWith('i_')) { const num = parseFloat(value); if (!isNaN(num)) inputs[key.slice(2)] = num; }
    }
    return { formulaCode: calc, inputs };
  } catch { return null; }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); document.body.removeChild(ta); return true; } catch { document.body.removeChild(ta); return false; } }
}

export function exportToCSV(entries: any[], farmName: string): void {
  if (entries.length === 0) return;
  const headers = ['Date', 'Time', 'Formula Code', 'Formula Name', 'Result Value', 'Result Unit', 'Interpretation', ...entries[0].inputLabels.map((l: any) => `${l.label}${l.unit ? ` (${l.unit})` : ''}`)];
  const rows = entries.map(e => {
    const d = new Date(e.timestamp);
    return [d.toLocaleDateString(), d.toLocaleTimeString(), e.formulaCode, e.formulaName, e.result.value, e.result.label, (e.result.interpretation || '').replace(/,/g, ';').replace(/\n/g, ' '), ...e.inputLabels.map((l: any) => String(l.value))];
  });
  const csv = [headers.map(h => `"${h}"`).join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${farmName.replace(/\s+/g, '_')}_calculations_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

export function printFormulaCard(formula: Formula): void {
  const w = window.open('', '_blank', 'width=800,height=900'); if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>${formula.code} — ${formula.name}</title><style>
    *{box-sizing:border-box}body{font-family:Cairo,-apple-system,sans-serif;margin:0;padding:32px;color:#1c1917;background:white}
    .card{max-width:700px;margin:0 auto;border:2px solid #059669;border-radius:12px;overflow:hidden}
    .header{background:linear-gradient(135deg,#059669,#047857);color:white;padding:24px}
    .code-badge{display:inline-block;background:rgba(255,255,255,0.25);padding:4px 10px;border-radius:6px;font-family:monospace;font-weight:bold;font-size:14px;margin-bottom:8px}
    h1{margin:0 0 8px 0;font-size:24px} .part{font-size:12px;opacity:0.9}
    .body{padding:24px} .section{margin-bottom:20px}
    .section-title{font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#059669;font-weight:700;margin-bottom:6px}
    .formula-box{background:#f5f5f4;border:1px solid #e7e5e4;border-radius:8px;padding:14px;font-family:monospace;font-size:15px;line-height:1.5}
    .text{font-size:13px;line-height:1.6;color:#44403c}
    .pitfall{background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:10px 12px;font-size:12px;color:#92400e;margin-top:4px}
    .footer{padding:16px 24px;background:#f5f5f4;border-top:1px solid #e7e5e4;font-size:11px;color:#78716c}
    @media print{body{padding:0}.card{border:none;max-width:100%}}
  </style></head><body><div class="card"><div class="header"><div class="code-badge">${formula.code}</div><h1>${formula.name}</h1><div class="part">Part ${formula.part_roman} · ${formula.part} · Sec. ${formula.chapter_number}</div></div><div class="body">
  <div class="section"><div class="section-title">Formula</div><div class="formula-box">${formula.formula}</div></div>
  ${formula.variables ? `<div class="section"><div class="section-title">Variables &amp; Units</div><div class="text">${formula.variables.replace(/\n/g, '<br>')}</div></div>` : ''}
  ${formula.purpose ? `<div class="section"><div class="section-title">Purpose</div><div class="text">${formula.purpose}</div></div>` : ''}
  ${formula.example ? `<div class="section"><div class="section-title">Worked Example</div><div class="text">${formula.example}</div></div>` : ''}
  ${formula.pitfall ? `<div class="section"><div class="section-title">Common Pitfall</div><div class="pitfall">${formula.pitfall}</div></div>` : ''}
  </div><div class="footer">Atlas of Agri-Formulas &amp; Metrics · Field Reference Card · Printed ${new Date().toLocaleDateString()}</div></div>
  <script>window.onload=function(){window.print();setTimeout(function(){window.close()},500)}</script></body></html>`);
  w.document.close();
}

export async function shareCalculation(formulaCode: string, inputs: Record<string, number>): Promise<{ success: boolean; link?: string }> {
  const link = generateShareLink(formulaCode, inputs);
  const success = await copyToClipboard(link);
  return success ? { success: true, link } : { success: false };
}
