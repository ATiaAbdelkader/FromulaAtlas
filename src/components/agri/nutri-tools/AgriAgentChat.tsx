'use client';

/**
 * AI Specialists Panel — multi-agent chat with 10 specialized personas.
 *
 * Replaces the single-purpose Agronomist Assistant with a panel where the
 * user picks a specialist (Crop Scout, Irrigation Engineer, etc.) and chats
 * with the LLM using that agent's tailored system prompt.
 *
 * The agent catalog lives in @/lib/ai-agents. The backend endpoint
 * /api/agronomist-chat accepts an optional agentId and prepends the
 * agent's systemPrompt before calling the LLM.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles, Send, Loader2, Bot, User, X, MessageCircle, ChevronRight, RotateCcw,
} from 'lucide-react';
import {
  AI_AGENTS, getAgent, getLocalizedAgentDisplay,
} from '@/lib/ai-agents';
import { copyFor, useTranslation } from '@/lib/language-store';
import { useFarmStore } from '@/lib/farm-store';
import { useWeatherStore, weatherCodeToText } from '@/lib/weather-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

const TITLE: TrilingualString = {
  en: 'AI Agronomy Specialists',
  ar: 'متخصصو الذكاء الاصطناعي الزراعي',
  fr: 'Spécialistes IA en Agronomie',
};

const DESC: TrilingualString = {
  en: 'Chat with 10 specialized AI agents — crop scouting, irrigation, fertilization, pests, machinery, and more. Context-aware with your saved farm and weather data.',
  ar: 'تحدّث مع 10 وكلاء ذكاء اصطناعي تخصصيين — كشافة المحاصيل، الري، التسميد، الآفات، الميكنة، والمزيد. يستفيد من بيانات مزرعتك والطقس المحفوظة.',
  fr: 'Discutez avec 10 agents IA spécialisés — scouting, irrigation, fertilisation, ravageurs, machinisme et plus. Contextualisé avec votre ferme et la météo enregistrées.',
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  agentId?: string;  // which agent answered
}

interface Conversation {
  agentId: string;
  messages: Message[];
}

const STORAGE_KEY = 'ai_specialists_chats_v1';

export function AgriAgentChat() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agronomist');
  const [conversations, setConversations] = useState<Record<string, Conversation>>({});
  const [input, setInput] = useState('');
  const { isRTL, language } = useTranslation();
  const farms = useFarmStore(s => s.farms);
  const activeFarmId = useFarmStore(s => s.activeFarmId);
  const weather = useWeatherStore(s => s.weather);
  const weatherLocation = useWeatherStore(s => s.location);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  // Load conversations from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setConversations(JSON.parse(saved));
      }
    } catch { /* ignore */ }
  }, []);

  // Save conversations to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch { /* ignore quota errors */ }
  }, [conversations]);

  const selectedAgent = useMemo(
    () => getAgent(selectedAgentId) ?? AI_AGENTS[0],
    [selectedAgentId],
  );

  const selectedAgentDisplay = useMemo(
    () => getLocalizedAgentDisplay(selectedAgent, language),
    [selectedAgent, language],
  );
  const workspaceContext = useMemo(() => {
    const activeFarm = farms.find(farm => farm.id === activeFarmId) ?? farms[0];
    const weatherSummary = weather ? weatherCodeToText(weather.current.weatherCode).text : undefined;
    return {
      activeFarm: activeFarm ? {
        name: activeFarm.name,
        crop: activeFarm.crop,
        areaHa: activeFarm.area,
        soilType: activeFarm.soilType,
        irrigationType: activeFarm.irrigationType,
        plantingDate: activeFarm.plantingDate,
      } : undefined,
      portfolio: {
        fieldCount: farms.length,
        totalAreaHa: farms.reduce((total, farm) => total + (Number.isFinite(farm.area) ? farm.area : 0), 0),
      },
      weather: weather && weatherLocation ? {
        location: weatherLocation.name,
        temperatureC: weather.current.temperature,
        rainfallMm: weather.daily.precipitationSum,
        summary: weatherSummary,
      } : undefined,
      requestFocus: 'FormulaAtlas farm decision support',
    };
  }, [activeFarmId, farms, weather, weatherLocation]);
  const contextAvailable = Boolean(workspaceContext.activeFarm || workspaceContext.weather || workspaceContext.portfolio.fieldCount);
  const currentConversation = conversations[selectedAgentId]?.messages ?? [];

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentConversation.length, loading]);

  // Focus input when agent selected
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedAgentId]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: 'user', content, timestamp: Date.now() };
    const newMessages = [...currentConversation, userMsg];

    setConversations(prev => ({
      ...prev,
      [selectedAgentId]: {
        agentId: selectedAgentId,
        messages: newMessages,
      },
    }));
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/agronomist-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          language,
          workspaceContext,
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
        agentId: selectedAgentId,
      };
      setConversations(prev => ({
        ...prev,
        [selectedAgentId]: {
          agentId: selectedAgentId,
          messages: [...(prev[selectedAgentId]?.messages ?? []), assistantMsg],
        },
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to get response';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    setConversations(prev => {
      const next = { ...prev };
      delete next[selectedAgentId];
      return next;
    });
    setError(null);
  };

  return (
    <CalculatorShell
      icon={MessageCircle}
      title={TITLE}
      description={DESC}
      badge={`${AI_AGENTS.length} Specialists`}
      accent="violet"
      actions={currentConversation.length > 0 ? [{
        icon: RotateCcw,
        label: { en: 'Clear Chat', ar: 'مسح المحادثة', fr: 'Effacer' },
        onClick: () => {
          clearConversation();
          toast({ title: tr('Chat cleared', 'تم مسح المحادثة', 'Conversation effacée') });
        },
      }] : []}
    >
      <div className="lg:col-span-12 space-y-3">
      {/* Agent picker bar */}
      <div className="rounded-lg border bg-gradient-to-br from-indigo-50/60 to-violet-50/40 dark:from-indigo-950/20 dark:to-violet-950/10 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-indigo-600" />
          <span className="text-xs font-semibold">{copyFor(language, 'AI Specialists', 'وكلاء الذكاء التخصصيون')}</span>
          <Badge variant="outline" className="text-[9px] ml-auto">{AI_AGENTS.length} {copyFor(language, 'agents', 'وكلاء')}</Badge>
        </div>
        {/* Horizontal scroll of agent cards */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {AI_AGENTS.map(agent => {
            const active = agent.id === selectedAgentId;
            const localized = getLocalizedAgentDisplay(agent, language);
            const localizedName = localized.name;
            const localizedVibe = localized.vibe;
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all border ${
                  active
                    ? 'text-white shadow-sm'
                    : 'bg-background border-border hover:bg-muted/50 text-foreground'
                }`}
                style={active ? { backgroundColor: agent.color, borderColor: agent.color } : undefined}
                title={localizedVibe}
              >
                <span className="text-sm">{agent.emoji}</span>
                <span>{localizedName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected agent header */}
      <div
        className="rounded-lg border p-3 flex items-start gap-3"
        style={{
          borderColor: selectedAgent.color + '60',
          backgroundColor: selectedAgent.color + '10',
        }}
      >
        <div
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ backgroundColor: selectedAgent.color + '20' }}
        >
          {selectedAgent.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: selectedAgent.color }}>
              {selectedAgentDisplay.name}
            </span>
            <Badge variant="outline" className="text-[9px] uppercase">{selectedAgent.category}</Badge>
            {contextAvailable && <Badge variant="outline" className="text-[9px] text-emerald-700 dark:text-emerald-300">{copyFor(language, 'farm context', 'سياق المزرعة', 'contexte ferme')}</Badge>}
            {currentConversation.length > 0 && (
              <Badge variant="outline" className="text-[9px]">{currentConversation.length} {copyFor(language, 'msgs', 'رسائل', 'messages')}</Badge>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground italic mt-0.5">
            {selectedAgentDisplay.vibe}
          </div>
          <div className="text-[11px] text-foreground/80 mt-1">
            {selectedAgentDisplay.description}
          </div>
          {selectedAgent.suggestedTools.length > 0 && (
            <div className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1 flex-wrap">
              <span>{copyFor(language, 'Recommends:', 'يوصي بـ:')}</span>
              {selectedAgent.suggestedTools.map(t => (
                <Badge key={t} variant="secondary" className="text-[9px]">{t}</Badge>
              ))}
            </div>
          )}
        </div>
        {currentConversation.length > 0 && (
          <Button size="sm" variant="ghost" onClick={clearConversation} className="text-[10px] gap-1 h-7 shrink-0">
            <RotateCcw className="h-3 w-3" /> {copyFor(language, 'Clear', 'مسح')}
          </Button>
        )}
      </div>

      {/* Chat messages */}
      {currentConversation.length > 0 ? (
        <div
          ref={scrollRef}
          className="border rounded-lg bg-background max-h-[400px] overflow-y-auto p-3 space-y-3"
        >
          {currentConversation.map((m, i) => (
            <div
              key={i}
              className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs"
                style={{
                  backgroundColor: m.role === 'assistant' ? selectedAgent.color + '20' : '#e5e7eb',
                }}
              >
                {m.role === 'assistant' ? (
                  <span>{selectedAgent.emoji}</span>
                ) : (
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
              <div
                className={`flex-1 min-w-0 rounded-lg px-3 py-2 text-xs ${
                  m.role === 'user'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30'
                    : 'bg-muted/30'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{m.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: selectedAgent.color + '20' }}
              >
                <span>{selectedAgent.emoji}</span>
              </div>
              <div className="bg-muted/30 rounded-lg px-3 py-2 text-xs flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-muted-foreground">
                  {copyFor(language, `${selectedAgentDisplay.name} is thinking…`, `${selectedAgentDisplay.name} يفكّر…`, `${selectedAgentDisplay.name} réfléchit…`)}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border bg-background p-4 space-y-3">
          <div className="text-center text-xs text-muted-foreground">
            <span className="text-2xl block mb-2">{selectedAgent.emoji}</span>
            <strong className="text-foreground">
              {copyFor(language, `Start a conversation with ${selectedAgentDisplay.name}.`, `ابدأ محادثة مع ${selectedAgentDisplay.name}.`, `Commencez une conversation avec ${selectedAgentDisplay.name}.`)}
            </strong>
            <div className="text-[10px] mt-1">
              {copyFor(language, 'Ask any agriculture question, choose a starter, or type your own below.', 'اسأل أي سؤال زراعي، أو اختر سؤالًا نموذجيًا، أو اكتب سؤالك أدناه.', 'Posez toute question agricole, choisissez un exemple ou écrivez la vôtre ci-dessous.')}
            </div>
          </div>
          <div className="space-y-1.5">
            {selectedAgent.sampleQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => send(q)}
                disabled={loading}
                className="w-full text-left text-[11px] rounded-md border bg-muted/20 hover:bg-muted/40 px-3 py-2 transition-colors flex items-start gap-1.5 disabled:opacity-50"
              >
                <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                <span>{q}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 p-2 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
          <X className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span className="font-mono">{error}</span>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={copyFor(language, `Ask ${selectedAgentDisplay.name} anything about your farm…`, `اسأل ${selectedAgentDisplay.name} أي سؤال عن مزرعتك…`, `Posez à ${selectedAgentDisplay.name} toute question sur votre exploitation…`)}
          disabled={loading}
          className="flex-1 text-xs"
        />
        <Button size="sm" onClick={() => send()} disabled={loading || !input.trim()} className="gap-1.5">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          {copyFor(language, 'Send', 'إرسال')}
        </Button>
      </div>

      <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
        {copyFor(language, 'Ask in English, Arabic, or French. The agent uses your active FormulaAtlas language and may use your saved farm and weather context when available. Verify local labels, registrations, and professional advice before acting.', 'اسأل بالإنجليزية أو العربية أو الفرنسية. يستخدم الوكيل لغة FormulaAtlas الحالية ويمكنه الاستفادة من سياق المزرعة والطقس المحفوظ عند توفره. تحقّق من الملصقات والتسجيلات المحلية واستشر المختصين قبل التنفيذ.', 'Posez votre question en anglais, arabe ou français. L’agent utilise la langue active de FormulaAtlas et peut employer le contexte enregistré de votre ferme et de la météo lorsqu’il est disponible. Vérifiez les étiquettes, homologations locales et l’avis d’un professionnel avant d’agir.')}

      </div>
      </div>
    </CalculatorShell>
  );
}

// ============================================================================
// Floating button version — for users who prefer the chat as a popup.
// ============================================================================

export function AgriAgentChatFloating() {
  const [open, setOpen] = useState(false);
  const { language } = useTranslation();
  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          title={copyFor(language, 'Ask an AI Specialist', 'اسأل متخصصًا بالذكاء الاصطناعي')}
        >
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium hidden sm:inline">{copyFor(language, 'AI Specialists', 'متخصصو الذكاء الاصطناعي')}</span>
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="bg-background w-full sm:max-w-2xl sm:rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-background border-b px-4 py-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-semibold">{copyFor(language, 'AI Specialists', 'متخصصو الذكاء الاصطناعي')}</span>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)} className="ml-auto h-7 w-7 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <AgriAgentChat />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
