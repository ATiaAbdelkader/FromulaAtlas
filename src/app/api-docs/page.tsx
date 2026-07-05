'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Code, Copy, Check, Play, Terminal, Webhook, Zap, BookOpen,
  ArrowRight, ChevronRight,
} from 'lucide-react';

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/v1/formulas',
    desc: 'Browse 332 agronomic formulas with filtering and pagination',
    params: [
      { name: 'code', type: 'string', desc: 'Filter by formula code (e.g. 2.1)' },
      { name: 'part', type: 'string', desc: 'Filter by part name' },
      { name: 'calculator', type: 'boolean', desc: 'Only formulas with calculators' },
      { name: 'search', type: 'string', desc: 'Full-text search' },
      { name: 'limit', type: 'number', desc: 'Max results (default 50, max 200)' },
      { name: 'offset', type: 'number', desc: 'Pagination offset' },
    ],
    example: `curl "https://your-app.com/api/v1/formulas?search=irrigation&limit=5"`,
    response: `{
  "results": [
    {
      "code": "IRR-9.2",
      "name": "Net Irrigation Depth",
      "formula": "NIR = ETc - Pe",
      "purpose": "Compute net irrigation requirement...",
      "hasCalculator": true
    }
  ],
  "total": 12,
  "limit": 5,
  "offset": 0,
  "hasMore": true
}`,
  },
  {
    method: 'POST',
    path: '/api/v1/calculators',
    desc: 'Run a calculator with your input values and get the result',
    params: [],
    body: `{
  "code": "2.1",
  "values": {
    "area": 10000,
    "rowSpacing": 75,
    "plantSpacing": 25
  }
}`,
    example: `curl -X POST "https://your-app.com/api/v1/calculators" \\
  -H "Content-Type: application/json" \\
  -d '{"code":"2.1","values":{"area":10000,"rowSpacing":75,"plantSpacing":25}}'`,
    response: `{
  "code": "2.1",
  "input": { "area": 10000, "rowSpacing": 75, "plantSpacing": 25 },
  "result": {
    "value": "53,333",
    "label": "plants/ha",
    "interpretation": "Within optimal range for most cereal crops."
  }
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/calculators',
    desc: 'List all 218 available calculators with their input fields',
    params: [
      { name: 'code', type: 'string', desc: 'Get fields for a specific calculator' },
    ],
    example: `curl "https://your-app.com/api/v1/calculators?code=IRR-1.1"`,
    response: `{
  "code": "IRR-1.1",
  "fields": [
    { "key": "D", "label": "Pipe diameter", "unit": "mm", "defaultValue": 100 },
    { "key": "V", "label": "Flow velocity", "unit": "m/s", "defaultValue": 1.5 }
  ]
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/crops',
    desc: 'Browse 35 crops with irrigation requirements from BRL/COM memento',
    params: [
      { name: 'id', type: 'string', desc: 'Get specific crop (e.g. field_tomato)' },
      { name: 'category', type: 'string', desc: 'Filter: vegetable/fruit/cereal/industrial/forage' },
      { name: 'presets', type: 'boolean', desc: 'Get crop presets (hydro/irrigation)' },
    ],
    example: `curl "https://your-app.com/api/v1/crops?category=vegetable"`,
    response: `{
  "total": 13,
  "results": [
    {
      "id": "asparagus",
      "name_en": "Asparagus",
      "category": "vegetable",
      "annual_irrigation_mm": 364,
      "decadal_irrigation_mm": [0,0,0,5,5,9,9,9,9,7,7,7,5,5,5,0,0,0]
    }
  ]
}`,
  },
  {
    method: 'POST',
    path: '/api/v1/irrigation',
    desc: 'Compute a full irrigation program for a crop (10-day schedule + volumes)',
    params: [],
    body: `{
  "cropId": "field_tomato",
  "fieldAreaHa": 1,
  "efficiency": 85,
  "systemType": "drip"
}`,
    example: `curl -X POST "https://your-app.com/api/v1/irrigation" \\
  -H "Content-Type: application/json" \\
  -d '{"cropId":"field_tomato","fieldAreaHa":2,"efficiency":90}'`,
    response: `{
  "crop": "Field Tomato",
  "grossAnnualMm": 439,
  "grossAnnualM3": 8780,
  "peakDailyMm": 3.9,
  "monthly": [
    { "month": "Apr", "netMm": 5, "grossMm": 5.6, "grossM3": 112 }
  ],
  "decadal": [
    { "decade": "Apr D1", "netMm": 0, "grossMm": 0, "grossM3": 0 }
  ]
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/diseases',
    desc: 'Browse 39 plant diseases with descriptions, prevention, and treatment',
    params: [
      { name: 'crop', type: 'string', desc: 'Filter by crop (e.g. Tomato)' },
      { name: 'healthy', type: 'boolean', desc: 'Include/exclude healthy entries' },
      { name: 'search', type: 'string', desc: 'Search disease names' },
    ],
    example: `curl "https://your-app.com/api/v1/diseases?crop=Tomato&healthy=false"`,
    response: `{
  "total": 9,
  "results": [
    {
      "id": 29,
      "disease_name": "Tomato Bacterial Spot",
      "crop": "Tomato",
      "severity": "high",
      "description": "Bacterial disease (Xanthomonas spp.)...",
      "prevention": ["Use disease-free seed", "Avoid overhead irrigation"],
      "treatment": "Apply copper + mancozeb every 7 days."
    }
  ]
}`,
  },
  {
    method: 'POST',
    path: '/api/agronomist-chat',
    desc: 'Ask the AI Agronomist a question — get tool recommendations + input guidance',
    params: [],
    body: `{
  "messages": [
    { "role": "user", "content": "My tomato leaves are yellowing at the bottom" }
  ]
}`,
    example: `curl -X POST "https://your-app.com/api/agronomist-chat" \\
  -H "Content-Type: application/json" \\
  -d '{"messages":[{"role":"user","content":"What VPD should I target for tomatoes?"}]}'`,
    response: `{
  "response": "For tomatoes, target VPD 0.8-1.2 kPa during flowering...",
  "usage": { "total_tokens": 850 }
}`,
  },
];

export default function ApiDocsPage() {
  const [activeEndpoint, setActiveEndpoint] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const testEndpoint = async () => {
    const ep = ENDPOINTS[activeEndpoint];
    setTesting(true);
    setTestResult(null);
    try {
      const isPost = ep.method === 'POST';
      const url = ep.path;
      const res = await fetch(url, {
        method: isPost ? 'POST' : 'GET',
        headers: isPost ? { 'Content-Type': 'application/json' } : undefined,
        body: isPost ? ep.body : undefined,
      });
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2).slice(0, 2000));
    } catch (e) {
      setTestResult(`Error: ${e instanceof Error ? e.message : 'Failed'}`);
    } finally {
      setTesting(false);
    }
  };

  const ep = ENDPOINTS[activeEndpoint];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white mb-3">
            <Code className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">Formula Atlas API</h1>
          <p className="text-sm text-muted-foreground mt-1">REST API for 332 formulas, 218 calculators, 35 crops, 39 diseases, and AI agronomist</p>
          <div className="flex justify-center gap-2 mt-3">
            <Badge variant="outline" className="text-xs">v1.0</Badge>
            <Badge variant="outline" className="text-xs text-emerald-700 dark:text-emerald-400 border-emerald-300">No API key required</Badge>
            <Badge variant="outline" className="text-xs text-blue-700 dark:text-blue-400 border-blue-300">JSON</Badge>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Formulas', value: '332' },
            { label: 'Calculators', value: '218' },
            { label: 'Crops', value: '35' },
            { label: 'Diseases', value: '39' },
          ].map(s => (
            <div key={s.label} className="rounded-lg p-3 border border-border bg-card text-center">
              <div className="text-xl font-bold text-emerald-600">{s.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Integration cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-lg p-3 border border-border bg-card flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <div><div className="text-xs font-semibold">Zapier</div><div className="text-[10px] text-muted-foreground">Connect to 5000+ apps</div></div>
          </div>
          <div className="rounded-lg p-3 border border-border bg-card flex items-center gap-2">
            <Webhook className="h-5 w-5 text-blue-500" />
            <div><div className="text-xs font-semibold">Webhooks</div><div className="text-[10px] text-muted-foreground">Push results to your system</div></div>
          </div>
          <div className="rounded-lg p-3 border border-border bg-card flex items-center gap-2">
            <Terminal className="h-5 w-5 text-slate-500" />
            <div><div className="text-xs font-semibold">cURL / SDK</div><div className="text-[10px] text-muted-foreground">REST + JSON</div></div>
          </div>
        </div>

        {/* Endpoint selector */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {ENDPOINTS.map((e, i) => (
            <button
              key={i}
              onClick={() => { setActiveEndpoint(i); setTestResult(null); }}
              className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-md border transition-all ${activeEndpoint === i ? 'bg-slate-800 text-white border-slate-800' : 'bg-card border-border text-muted-foreground hover:border-slate-400'}`}
            >
              <span className={`font-mono font-bold ${e.method === 'GET' ? 'text-emerald-400' : 'text-amber-400'}`}>{e.method}</span>
              <span className="truncate max-w-[150px]">{e.path}</span>
            </button>
          ))}
        </div>

        {/* Active endpoint detail */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Badge className={ep.method === 'GET' ? 'bg-emerald-600' : 'bg-amber-600'}>{ep.method}</Badge>
              <code className="text-sm font-mono font-bold">{ep.path}</code>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{ep.desc}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Parameters */}
            {ep.params.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">Query Parameters</div>
                <div className="space-y-1">
                  {ep.params.map(p => (
                    <div key={p.name} className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-emerald-600 font-bold">{p.name}</span>
                      <span className="text-muted-foreground">({p.type})</span>
                      <span className="text-muted-foreground">— {p.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Request body */}
            {ep.body && (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">Request Body</div>
                <div className="relative rounded-lg bg-slate-900 p-3 overflow-x-auto">
                  <button onClick={() => copy(ep.body!, 'body')} className="absolute top-2 right-2 text-slate-400 hover:text-white">
                    {copied === 'body' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <pre className="text-xs text-slate-300 font-mono"><code>{ep.body}</code></pre>
                </div>
              </div>
            )}

            {/* cURL example */}
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">cURL Example</div>
              <div className="relative rounded-lg bg-slate-900 p-3 overflow-x-auto">
                <button onClick={() => copy(ep.example, 'curl')} className="absolute top-2 right-2 text-slate-400 hover:text-white">
                  {copied === 'curl' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <pre className="text-xs text-emerald-300 font-mono"><code>{ep.example}</code></pre>
              </div>
            </div>

            {/* Response example */}
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">Response Example</div>
              <div className="rounded-lg bg-slate-900 p-3 overflow-x-auto">
                <pre className="text-xs text-sky-300 font-mono"><code>{ep.response}</code></pre>
              </div>
            </div>

            {/* Try it */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button onClick={testEndpoint} disabled={testing} size="sm" className="gap-1.5 text-xs">
                {testing ? <span className="animate-pulse">Testing...</span> : <><Play className="h-3.5 w-3.5" /> Try it live</>}
              </Button>
              {testResult && (
                <div className="flex-1 rounded-lg bg-slate-900 p-2 overflow-x-auto max-h-48 overflow-y-auto">
                  <pre className="text-[10px] text-emerald-300 font-mono"><code>{testResult}</code></pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* JavaScript SDK example */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4" /> JavaScript SDK Example</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-lg bg-slate-900 p-3 overflow-x-auto">
              <button onClick={() => copy(JS_EXAMPLE, 'js')} className="absolute top-2 right-2 text-slate-400 hover:text-white">
                {copied === 'js' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <pre className="text-xs text-slate-300 font-mono"><code>{JS_EXAMPLE}</code></pre>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>← Back to app</Button>
        </div>
      </div>
    </div>
  );
}

const JS_EXAMPLE = `// Get all irrigation formulas
const res = await fetch('/api/v1/formulas?search=irrigation&limit=10');
const { results, total } = await res.json();
console.log(\`Found \${total} irrigation formulas\`);

// Run a calculator
const calc = await fetch('/api/v1/calculators', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'IRR-9.2',
    values: { ETc: 5, Pe: 1 }
  })
});
const { result } = await calc.json();
console.log(\`Net irrigation: \${result.value} \${result.label}\`);
// → "Net irrigation: 4 mm"

// Get crop irrigation data
const crops = await fetch('/api/v1/crops?category=vegetable');
const { results: veg } = await crops.json();

// Ask AI Agronomist
const ai = await fetch('/api/agronomist-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'What is the ideal pH for tomatoes?' }]
  })
});
const { response } = await ai.json();`;
