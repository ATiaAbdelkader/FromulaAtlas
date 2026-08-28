'use client';

/**
 * FarmerHelp — comprehensive help center for all user levels.
 *
 * 10 features:
 *   1. 15+ FAQ cards organized by 6 categories
 *   2. Quick Links section (Guide, Profile, Search, Language, Level)
 *   3. Troubleshooting card (weather, data, tools, spray, AI)
 *   4. 8 Algeria-specific AI chat suggestions
 *   5. Keyboard shortcuts reference
 *   6. What's New section (5 latest features)
 *   7. Works for all user levels (Farmer/Manager/Professional)
 *   8. Report a Problem button (GitHub issues)
 *   9. Contact section (Telegram, docs, API)
 *  10. Per-FAQ 👍/👎 feedback
 *
 * Trilingual (EN/FR/AR).
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search, Send, Loader2, Bot, User, Sparkles, Droplets, FlaskConical,
  Bug, DollarSign, Calendar, Sprout, ChevronRight, MessageCircle,
  Cloud, Beaker, Leaf, Tractor, Settings, Languages, Layers,
  Keyboard, AlertTriangle, CheckCircle2, ExternalLink, ThumbsUp,
  ThumbsDown, Github, Send as TelegramIcon, FileText, BookOpen,
  HelpCircle, Zap, TrendingUp, ShieldCheck, Activity, type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTranslation, copyFor } from '@/lib/language-store';
import type { TabId } from '@/lib/user-level';
import { cn } from '@/lib/utils';

type ExperienceTab = TabId;

interface FarmerHelpProps {
  onOpenTool: (tab: ExperienceTab, storageKey?: string) => void;
  onNavigate?: (tab: ExperienceTab) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// ============================================================================
// FAQ categories
// ============================================================================

interface FAQItem {
  icon: LucideIcon;
  color: string;
  category: string;
  q: { en: string; ar: string; fr: string };
  action: () => void;
  actionLabel?: { en: string; ar: string; fr: string };
}

export function FarmerHelp({ onOpenTool, onNavigate }: FarmerHelpProps) {
  const { language, isRTL } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<number, 'up' | 'down'>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  // 15+ FAQ items organized by category
  const faqs: FAQItem[] = useMemo(() => [
    // === GROWING ===
    { icon: Sprout, color: '#16a34a', category: tr('Growing', 'الزراعة', 'Culture'),
      q: { en: 'What crop should I plant next?', ar: 'ما المحصول التالي؟', fr: 'Quelle culture planter ensuite ?' },
      action: () => onOpenTool('farm', 'collapse_crop_recommender'),
      actionLabel: { en: 'Open Crop Recommender', ar: 'افتح محرّك التوصية', fr: 'Ouvrir le moteur de recommandation' } },
    { icon: Calendar, color: '#7c3aed', category: tr('Growing', 'الزراعة', 'Culture'),
      q: { en: 'When should I harvest?', ar: 'متى أحصد؟', fr: 'Quand dois-je récolter ?' },
      action: () => onOpenTool('farm', 'collapse_harvest_forecast') },
    { icon: Calendar, color: '#0f766e', category: tr('Growing', 'الزراعة', 'Culture'),
      q: { en: 'How do I plan my crop calendar?', ar: 'كيف أخطط تقويم محاصيلي؟', fr: 'Comment planifier mon calendrier cultural ?' },
      action: () => onOpenTool('calendar') },
    // === WATER ===
    { icon: Droplets, color: '#0284c7', category: tr('Water', 'الماء', 'Eau'),
      q: { en: 'Should I irrigate today?', ar: 'هل أسقي اليوم؟', fr: 'Dois-je irriguer aujourd\'hui ?' },
      action: () => onOpenTool('farm', 'collapse_water_budget') },
    { icon: Cloud, color: '#0ea5e9', category: tr('Water', 'الماء', 'Eau'),
      q: { en: 'Is it safe to spray tomorrow?', ar: 'هل من الآمن الرش غداً؟', fr: 'Est-il sûr de traiter demain ?' },
      action: () => onOpenTool('myfield') },
    { icon: Cloud, color: '#0891b2', category: tr('Water', 'الماء', 'Eau'),
      q: { en: 'How much water does my crop need?', ar: 'كم ماء يحتاج محصولي؟', fr: 'Combien d\'eau pour ma culture ?' },
      action: () => onOpenTool('farm', 'collapse_et_tracker') },
    // === PESTS & DISEASES ===
    { icon: Bug, color: '#e11d48', category: tr('Pests & Diseases', 'الآفات والأمراض', 'Ravageurs & Maladies'),
      q: { en: 'What pest is eating my plants?', ar: 'ما الآفة التي تأكل نباتاتي؟', fr: 'Quel ravageur mange mes plantes ?' },
      action: () => onOpenTool('farm', 'collapse_ai_scout') },
    { icon: Bug, color: '#dc2626', category: tr('Pests & Diseases', 'الآفات والأمراض', 'Ravageurs & Maladies'),
      q: { en: 'How do I identify a plant disease?', ar: 'كيف أحدد مرض النبات؟', fr: 'Comment identifier une maladie ?' },
      action: () => onOpenTool('farm', 'collapse_disease_encyclopedia') },
    { icon: ShieldCheck, color: '#65a30d', category: tr('Pests & Diseases', 'الآفات والأمراض', 'Ravageurs & Maladies'),
      q: { en: 'Which pesticide should I use?', ar: 'أي مبيد يجب أن أستخدم؟', fr: 'Quel pesticide utiliser ?' },
      action: () => onOpenTool('farm', 'collapse_active_matter') },
    { icon: Search, color: '#16a34a', category: tr('Pests & Diseases', 'الآفات والأمراض', 'Ravageurs & Maladies'),
      q: { en: 'Find registered products for my crop', ar: 'ابحث عن منتجات مسجلة لمحصولي', fr: 'Trouver des produits homologués' },
      action: () => onOpenTool('myfield', 'collapse_product_finder_myfield') },
    // === MONEY ===
    { icon: DollarSign, color: '#f59e0b', category: tr('Money', 'المال', 'Argent'),
      q: { en: 'Will I make money this season?', ar: 'هل سأربح هذا الموسم؟', fr: 'Serai-je rentable cette saison ?' },
      action: () => onOpenTool('simulator') },
    { icon: DollarSign, color: '#d97706', category: tr('Money', 'المال', 'Argent'),
      q: { en: 'What are my costs per hectare?', ar: 'ما هي تكاليفي لكل هكتار؟', fr: 'Quels sont mes coûts par hectare ?' },
      action: () => onOpenTool('farm', 'collapse_gross_margin') },
    // === CLIMATE ===
    { icon: Leaf, color: '#15803d', category: tr('Climate', 'المناخ', 'Climat'),
      q: { en: 'How can I reduce my farm carbon footprint?', ar: 'كيف أقلل من البصمة الكربونية لمزرعتي؟', fr: 'Comment réduire mon empreinte carbone ?' },
      action: () => onOpenTool('farm', 'collapse_climate_simulator') },
    { icon: Beaker, color: '#8b5cf6', category: tr('Climate', 'المناخ', 'Climat'),
      q: { en: 'How do I improve my soil health?', ar: 'كيف أحسّن صحة تربتي؟', fr: 'Comment améliorer la santé de mon sol ?' },
      action: () => onOpenTool('farm', 'collapse_soil_sensor') },
    // === TECHNICAL ===
    { icon: BookOpen, color: '#3b82f6', category: tr('Technical', 'تقني', 'Technique'),
      q: { en: 'How do I use the app?', ar: 'كيف أستخدم التطبيق؟', fr: 'Comment utiliser l\'application ?' },
      action: () => onNavigate?.('guide') },
    { icon: Settings, color: '#64748b', category: tr('Technical', 'تقني', 'Technique'),
      q: { en: 'How do I set up my farm profile?', ar: 'كيف أعدّ ملف مزرعتي؟', fr: 'Comment configurer mon profil de ferme ?' },
      action: () => onNavigate?.('home') },
  ], [language, tr, onOpenTool, onNavigate]);

  // Group FAQs by category
  const faqCategories = useMemo(() => {
    const groups: Record<string, FAQItem[]> = {};
    for (const faq of faqs) {
      if (!groups[faq.category]) groups[faq.category] = [];
      groups[faq.category].push(faq);
    }
    return Object.entries(groups);
  }, [faqs]);

  // 8 Algeria-specific AI suggestions
  const aiSuggestions = useMemo(() => [
    tr('My olive trees have spots on leaves', 'أشجار زيتوني بها بقع على الأوراق', 'Mes oliviers ont des taches sur les feuilles'),
    tr('When to spray for olive fly in Mitidja?', 'متى أرش لذبابة الزيتون في المتيجة؟', 'Quand traiter la mouche de l\'olive en Mitidja ?'),
    tr('How many 50kg bags of NPK for 2ha of wheat?', 'كم كيس 50كغ من NPK لـ2هكتار قمح؟', 'Combien de sacs de 50kg de NPK pour 2ha de blé ?'),
    tr('Is it safe to spray tomorrow?', 'هل من الآمن الرش غداً؟', 'Est-il sûr de traiter demain ?'),
    tr('What is the DAR for abamectin on citrus?', 'ما هي فترة ما قبل الحصاد للأباميكتين على الحمضيات؟', 'Quel est le DAR pour l\'abamectine sur agrumes ?'),
    tr('My tomato leaves are yellow', 'أوراق طماطمي صفراء', 'Mes feuilles de tomate sont jaunes'),
    tr('How much water for peppers?', 'كم ماء للفلفل؟', 'Combien d\'eau pour le poivron ?'),
    tr('Best time to plant wheat in Algeria?', 'أفضل وقت لزراعة القمح في الجزائر؟', 'Meilleur moment pour semer le blé en Algérie ?'),
  ], [language, tr]);

  // Keyboard shortcuts
  const shortcuts = [
    { keys: '⌘K / Ctrl+K', label: tr('Open global search', 'فتح البحث الشامل', 'Recherche globale') },
    { keys: '/', label: tr('Search farm tools', 'بحث أدوات المزرعة', 'Rechercher les outils') },
    { keys: 'Esc', label: tr('Close dialogs', 'إغلاق النوافذ', 'Fermer les dialogues') },
    { keys: 'Enter', label: tr('Send AI message', 'إرسال رسالة AI', 'Envoyer le message IA') },
  ];

  // What's New
  const whatsNew = [
    { icon: Cloud, color: '#0ea5e9', title: tr('Climate Scenario Simulator', 'محاكي سيناريو المناخ', 'Simulateur de scénario climatique'), desc: tr('See how your practices affect CO₂, carbon, water, and money', 'انظر تأثير ممارساتك على الكربون والماء والمال', 'Voir l\'impact de vos pratiques sur le CO₂') },
    { icon: Bug, color: '#dc2626', title: tr('Disease Encyclopedia', 'موسوعة الأمراض', 'Encyclopédie des maladies'), desc: tr('20+ diseases with treatments + INPV products', '20+ مرضاً مع علاجات ومنتجات INPV', '20+ maladies avec traitements') },
    { icon: Sparkles, color: '#7c3aed', title: tr('Crop Recommendation Engine', 'محرّك توصية المحاصيل', 'Moteur de recommandation'), desc: tr('Enter soil test → top-3 crops + "Can I grow X?"', 'أدخل تحليل التربة → أفضل 3 محاصيل', 'Analyse de sol → top 3 cultures') },
    { icon: BookOpen, color: '#3b82f6', title: tr('Your Guide tab', 'تبويب دليلك', 'Onglet Votre Guide'), desc: tr('Professional guide to every tool & feature', 'دليل احترافي لكل أداة وميزة', 'Guide professionnel de chaque outil') },
    { icon: Activity, color: '#0891b2', title: tr('Soil Sensor Dashboard', 'لوحة مستشعر التربة', 'Tableau des capteurs du sol'), desc: tr('Simulated soil readings + Modbus-ready', 'قراءات تربة محاكاة + جاهز لـ Modbus', 'Lectures simulées + prêt pour Modbus') },
  ];

  // Troubleshooting
  const troubleshooting = [
    { problem: tr('Weather not loading', 'الطقس لا يحمّل', 'La météo ne charge pas'), fix: tr('Check internet connection. Weather uses free Open-Meteo API — no key needed.', 'تحقق من اتصال الإنترنت. الطقس يستخدم Open-Meteo مجاناً.', 'Vérifiez votre connexion. La météo utilise Open-Meteo (gratuit).') },
    { problem: tr('My data seems lost', 'بياناتي ضاعت', 'Mes données semblent perdues'), fix: tr('Data is in localStorage. Try: Settings → Backup & Restore. Or check browser privacy settings.', 'البيانات في localStorage. جرّب: الإعدادات → نسخ احتياطي.', 'Données dans localStorage. Essayez: Paramètres → Sauvegarde.') },
    { problem: tr("Can't find a tool", 'لا أجد أداة', 'Je ne trouve pas un outil'), fix: tr('Press ⌘K or / to search all 80+ tools. Or browse the Guide tab.', 'اضغط ⌘K أو / للبحث في 80+ أداة.', 'Appuyez sur ⌘K ou / pour rechercher.') },
    { problem: tr('Spray window not showing', 'نافذة الرش لا تظهر', 'La fenêtre de pulvérisation n\'apparaît pas'), fix: tr('Set your farm profile with GPS location in Home tab. Weather auto-fetches for your area.', 'أعدّ ملف مزرعتك مع GPS في تبويب الرئيسية.', 'Configurez votre profil avec GPS.') },
    { problem: tr('AI chat not responding', 'محادثة AI لا تستجيب', 'Le chat IA ne répond pas'), fix: tr('The AI needs a server connection. If offline, tools still work — chat will resume when reconnected.', 'AI يحتاج اتصال خادم. الأدوات تعمل دون اتصال.', 'L\'IA nécessite une connexion serveur.') },
  ];

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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

  const giveFeedback = (faqIndex: number, type: 'up' | 'down') => {
    setFeedback(prev => ({ ...prev, [faqIndex]: type }));
  };

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <HelpCircle className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
              {tr('Help Center', 'مركز المساعدة', 'Centre d\'aide')}
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              {tr('How can I help you?', 'كيف أساعدك؟', 'Comment puis-je vous aider ?')}
            </h2>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            {tr('Quick Links', 'روابط سريعة', 'Liens rapides')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <QuickLink icon={BookOpen} color="#3b82f6" label={tr('Your Guide', 'دليلك', 'Votre Guide')} onClick={() => onNavigate?.('guide')} />
            <QuickLink icon={Sprout} color="#16a34a" label={tr('Farm Profile', 'ملف المزرعة', 'Profil de ferme')} onClick={() => onNavigate?.('home')} />
            <QuickLink icon={Search} color="#7c3aed" label={tr('Search (⌘K)', 'بحث (⌘K)', 'Recherche (⌘K)')} onClick={() => onOpenTool('home')} />
            <QuickLink icon={Languages} color="#0ea5e9" label={tr('Language', 'اللغة', 'Langue')} onClick={() => { /* LanguageToggle is in header */ }} />
            <QuickLink icon={Layers} color="#6366f1" label={tr('Switch Level', 'بدّل المستوى', 'Changer de niveau')} onClick={() => { /* UserLevelSwitcher is in header */ }} />
          </div>
        </CardContent>
      </Card>

      {/* FAQ by category */}
      {messages.length === 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-2">
              <HelpCircle className="h-3.5 w-3.5 text-cyan-600" />
              {tr('Common Questions', 'أسئلة شائعة', 'Questions courantes')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {faqCategories.map(([category, items]) => (
              <div key={category}>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                  {category}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {items.map((faq) => {
                    const faqIndex = faqs.indexOf(faq);
                    const Icon = faq.icon;
                    return (
                      <div key={faqIndex} className="rounded-lg border border-border bg-card p-3 transition-all hover:border-emerald-300 hover:shadow-sm">
                        <button
                          onClick={faq.action}
                          className="group flex items-center gap-2.5 w-full text-start"
                        >
                          <div className="flex items-center justify-center h-8 w-8 rounded-lg flex-shrink-0" style={{ background: `${faq.color}18`, color: faq.color }}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-medium flex-1">{language === 'ar' ? faq.q.ar : language === 'fr' ? faq.q.fr : faq.q.en}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                        </button>
                        {/* Feedback buttons */}
                        <div className="flex items-center gap-1 mt-1.5 ps-10">
                          <span className="text-[9px] text-muted-foreground me-1">{tr('Helpful?', 'مفيد؟', 'Utile ?')}</span>
                          <button
                            onClick={() => giveFeedback(faqIndex, 'up')}
                            className={cn('h-5 w-5 flex items-center justify-center rounded transition-colors',
                              feedback[faqIndex] === 'up' ? 'bg-emerald-100 text-emerald-600' : 'text-muted-foreground hover:text-emerald-600')}
                            aria-label={tr('Helpful', 'مفيد', 'Utile')}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => giveFeedback(faqIndex, 'down')}
                            className={cn('h-5 w-5 flex items-center justify-center rounded transition-colors',
                              feedback[faqIndex] === 'down' ? 'bg-red-100 text-red-600' : 'text-muted-foreground hover:text-red-600')}
                            aria-label={tr('Not helpful', 'غير مفيد', 'Pas utile')}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </button>
                          {feedback[faqIndex] && (
                            <span className="text-[9px] text-muted-foreground ms-1">
                              {tr('Thanks!', 'شكراً!', 'Merci !')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* AI Chat */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bot className="h-4 w-4 text-emerald-600" />
            {tr('Ask the AI Agronomist', 'اسأل المهندس الذكي', 'Demandez à l\'agronome IA')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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

          {error && (
            <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 rounded-lg p-2 border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}

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

          {/* 8 Algeria-specific suggestions */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {aiSuggestions.map((suggestion, i) => (
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

      {/* Keyboard shortcuts + What's New + Troubleshooting */}
      <div className="grid md:grid-cols-3 gap-3">
        {/* Shortcuts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-2">
              <Keyboard className="h-3.5 w-3.5 text-violet-600" />
              {tr('Shortcuts', 'اختصارات', 'Raccourcis')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {shortcuts.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">{s.label}</span>
                <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted font-mono text-[10px]">{s.keys}</kbd>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* What's New */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              {tr('What\'s New', 'ما الجديد', 'Nouveautés')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {whatsNew.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-start gap-2 text-[11px]">
                  <Icon className="h-3 w-3 shrink-0 mt-0.5" style={{ color: item.color }} />
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-muted-foreground">{item.desc}</div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              {tr('Troubleshooting', 'استكشاف الأخطاء', 'Dépannage')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {troubleshooting.map((t, i) => (
              <details key={i} className="text-[11px]">
                <summary className="cursor-pointer font-medium text-foreground hover:text-emerald-600 transition-colors">
                  {t.problem}
                </summary>
                <p className="text-muted-foreground mt-0.5 ps-3">{t.fix}</p>
              </details>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Contact + Report */}
      <Card>
        <CardContent className="p-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <a href="https://t.me/formulaatlas" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-cyan-600 hover:underline">
              <TelegramIcon className="h-3.5 w-3.5" />
              {tr('Telegram Bot', 'بوت تيليجرام', 'Bot Telegram')}
            </a>
            <a href="/api-docs" className="inline-flex items-center gap-1 text-[11px] text-violet-600 hover:underline">
              <FileText className="h-3.5 w-3.5" />
              {tr('API Docs', 'وثائق API', 'Docs API')}
            </a>
            <button onClick={() => onNavigate?.('guide')} className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline">
              <BookOpen className="h-3.5 w-3.5" />
              {tr('Full Guide', 'الدليل الكامل', 'Guide complet')}
            </button>
          </div>
          <a
            href="https://github.com/ATiaAbdelkader/FromulaAtlas/issues/new?title=Bug%20Report&body=%23%23%20Problem%20Description%0A%0A%23%23%20Steps%20to%20Reproduce%0A1.%20%0A2.%20%0A3.%20%0A%23%23%20Expected%20Behavior%0A%0A%23%23%20Actual%20Behavior%0A%0A%23%23%20User%20Level%0AFarmer%20%2F%20Manager%20%2F%20Professional%0A%23%23%20Language%0AEN%20%2F%20FR%20%2F%20AR"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 hover:bg-amber-100 transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            {tr('Report a Problem', 'أبلغ عن مشكلة', 'Signaler un problème')}
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickLink({ icon: Icon, color, label, onClick }: {
  icon: LucideIcon; color: string; label: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg border border-border bg-card hover:border-emerald-300 hover:shadow-sm transition-all"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${color}18`, color }}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-[10px] font-medium text-center">{label}</span>
    </button>
  );
}
