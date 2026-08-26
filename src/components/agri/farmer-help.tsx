'use client';

/**
 * FarmerHelp — a simple, touch-friendly help and advice page for
 * Farmer-level users. Replaces the overwhelming "Insights" tab.
 *
 * Features:
 *   1. Big search bar: "Ask anything about your farm"
 *   2. FAQ cards: common questions farmers ask (trilingual)
 *   3. AI Agronomist chat with a simplified, larger UI
 *
 * The AI chat reuses the existing /api/agronomist-chat endpoint.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search, Send, Loader2, Bot, User, Sparkles, Droplets, FlaskConical,
  Bug, DollarSign, Calendar, Sprout, ChevronRight, MessageCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTranslation, copyFor } from '@/lib/language-store';
import type { TabId } from '@/lib/user-level';

type ExperienceTab = TabId;

interface FarmerHelpProps {
  onOpenTool: (tab: ExperienceTab, storageKey?: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export function FarmerHelp({ onOpenTool }: FarmerHelpProps) {
  const { language, isRTL } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  const faqs = useMemo(() => [
    { icon: FlaskConical, color: '#059669', q: tr('How much fertilizer for my crop?', 'كم سماد لمحصولي؟', 'Combien d\'engrais pour ma culture ?'), action: () => onOpenTool('farm', 'collapse_nutrient_budget') },
    { icon: Droplets, color: '#0284c7', q: tr('Should I irrigate today?', 'هل أسقي اليوم؟', 'Dois-je irriguer aujourd\'hui ?'), action: () => onOpenTool('farm', 'collapse_water_budget') },
    { icon: Bug, color: '#e11d48', q: tr('What pest is eating my plants?', 'ما الآفة التي تأكل نباتاتي؟', 'Quel ravageur mange mes plantes ?'), action: () => onOpenTool('farm', 'collapse_ai_scout') },
    { icon: DollarSign, color: '#f59e0b', q: tr('Will I make money this season?', 'هل سأربح هذا الموسم؟', 'Serai-je rentable cette saison ?'), action: () => onOpenTool('simulator') },
    { icon: Calendar, color: '#7c3aed', q: tr('When should I harvest?', 'متى أحصد؟', 'Quand dois-je récolter ?'), action: () => onOpenTool('farm', 'collapse_harvest_forecast') },
    { icon: Sprout, color: '#16a34a', q: tr('What crop should I plant next?', 'ما المحصول التالي؟', 'Quelle culture planter ensuite ?'), action: () => onOpenTool('calendar') },
  ], [language]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: 'user', content, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/agronomist-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          agentId: 'agronomist',
          language,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const assistantContent = data.response || data.message || data.content || tr('I couldn\'t process that. Please try again.', 'تعذّرت المعالجة. حاول مرة أخرى.', 'Impossible de traiter. Réessayez.');
      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent, timestamp: Date.now() }]);
    } catch (e: any) {
      setError(e?.message || tr('Connection failed', 'فشل الاتصال', 'Échec de connexion'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header banner */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <MessageCircle className="h-5 w-5" />
          </span>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">{tr('Ask the Agronomist', 'اسأل المهندس', 'Demandez à l\'agronome')}</div>
            <h2 className="text-xl font-bold tracking-tight">{tr('How can I help you today?', 'كيف أساعدك اليوم؟', 'Comment puis-je vous aider ?')}</h2>
          </div>
        </div>
      </div>

      {/* FAQ cards */}
      {messages.length === 0 && (
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {tr('Common Questions', 'أسئلة شائعة', 'Questions courantes')}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {faqs.map((faq, i) => {
              const Icon = faq.icon;
              return (
                <button
                  key={i}
                  onClick={faq.action}
                  className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg flex-shrink-0" style={{ background: `${faq.color}18`, color: faq.color }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium flex-1">{faq.q}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Chat area */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bot className="h-4 w-4 text-emerald-600" />
            {tr('Ask Anything', 'اسأل أي شيء', 'Posez votre question')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Messages */}
          {messages.length > 0 && (
            <div ref={scrollRef} className="space-y-3 max-h-[400px] overflow-y-auto p-1">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center justify-center h-8 w-8 rounded-full flex-shrink-0 ${msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400'}`}>
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`rounded-lg px-3 py-2 max-w-[80%] ${msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-muted'}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2.5">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 flex-shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-lg px-3 py-2 bg-muted flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-xs text-muted-foreground">{tr('Thinking...', 'يفكّر...', 'Réflexion...')}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 rounded-lg p-2 border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={tr('Type your question...', 'اكتب سؤالك...', 'Tapez votre question...')}
              disabled={loading}
              className="h-12 text-base"
            />
            <Button onClick={() => send()} disabled={loading || !input.trim()} className="h-12 px-4 gap-1.5 bg-emerald-600 hover:bg-emerald-700">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>

          {/* Suggested follow-ups when chat is empty */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                tr('My tomato leaves are yellow', 'أوراق طماطمي صفراء', 'Mes feuilles de tomate sont jaunes'),
                tr('How much water for peppers?', 'كم ماء للفلفل؟', 'Combien d\'eau pour le poivron ?'),
                tr('Best time to plant wheat?', 'أفضل وقت لزراعة القمح؟', 'Meilleur moment pour le blé ?'),
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => send(suggestion)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted/50 hover:border-emerald-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
