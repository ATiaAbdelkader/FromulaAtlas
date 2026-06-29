'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, Loader2, Bot, User, X, MessageCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const SUGGESTED_PROMPTS = [
  'My avocado leaves are yellowing at the top, soil pH is 7.8 — what should I do?',
  'My tomato fruits have black bottoms (blossom-end rot). How do I fix it?',
  'My drippers keep clogging. How do I diagnose the cause?',
  'I have a soil test: CEC 14, Ca 8, Mg 1.2, K 0.4 meq/100g. What amendments do I need?',
  'My greenhouse VPD is 0.3 kPa. Is that a problem?',
  'I want to compare urea vs ammonium nitrate by carbon footprint. How?',
];

/**
 * AI Agronomist Assistant — floating chat panel that recommends tools + inputs.
 * Calls /api/agronomist-chat (server-side z-ai-web-dev-sdk).
 */
export function AgronomistAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: 'user', content, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/agronomist-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to get response';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <>
      {/* Floating button — bottom-right */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-br from-emerald-600 to-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          title="Ask the AI Agronomist"
        >
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-semibold hidden sm:inline">AI Agronomist</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[min(440px,calc(100vw-3rem))] h-[min(600px,calc(100vh-3rem))] flex flex-col rounded-xl border border-border bg-background shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-gradient-to-br from-emerald-600 to-green-700 text-white">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/20 backdrop-blur">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">AI Agronomist</div>
                <div className="text-[10px] text-emerald-100/90 leading-tight">Recommends tools + inputs</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button onClick={clearChat} className="text-emerald-100 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors">
                  Clear
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-emerald-100 hover:text-white p-1 rounded hover:bg-white/10 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted/20">
            {messages.length === 0 && (
              <div className="text-center py-6 space-y-3">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 mx-auto">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Ask me anything about your crop</div>
                  <p className="text-xs text-muted-foreground mt-1 px-4">
                    Describe a symptom, share lab values, or ask which tool to use. I&apos;ll recommend the right calculator and the exact inputs to enter.
                  </p>
                </div>
                <div className="space-y-1.5 text-left">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold px-1">Try asking</div>
                  {SUGGESTED_PROMPTS.slice(0, 3).map(p => (
                    <button
                      key={p}
                      onClick={() => send(p)}
                      className="block w-full text-left text-xs px-3 py-2 rounded-lg border border-border bg-card hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center justify-center h-7 w-7 rounded-full flex-shrink-0 ${m.role === 'user' ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-600' : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600'}`}>
                  {m.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-card border border-border'}`}>
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex-shrink-0">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="bg-card border border-border rounded-lg px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Analyzing...
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 rounded-lg p-2 border border-destructive/30">
                ⚠ {error}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border bg-background">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Describe your problem..."
                disabled={loading}
                className="h-9 text-sm"
              />
              <Button onClick={() => send()} disabled={loading || !input.trim()} size="sm" className="h-9 px-3">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1.5 text-center">
              AI can make mistakes. Validate critical decisions with field tests.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
