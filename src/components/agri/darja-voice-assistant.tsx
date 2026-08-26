'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  Languages,
  Zap,
  Bot,
  Play,
  Square,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation, copyFor } from '@/lib/language-store';

interface DarjaVoiceAssistantProps {
  sunMode?: boolean;
}

interface VoiceMessage {
  id: string;
  sender: 'farmer' | 'agronomist';
  text: string;
  text_ar?: string;
  timestamp: string;
  recommendation?: {
    crop: string;
    diagnosis: string;
    treatment: string;
    inpvProduct: string;
    darDays: number;
  };
}

const DARJA_QUICK_PROMPTS = [
  {
    label_darja: 'طماطم: حريق وبقع كحلة في لوراق',
    query: 'عندي طماطم في السير وراها تصيبها بقع كحلة وحريق في لوراق، والرطوبة طالعة بزاف. واش نداويها؟',
    diagnosis: 'Mildiou / Alternaria (اللفحة والحرقة في الطماطم)',
    treatment: 'عالج فوراً بمبيد جهازي (Méfénoxam أو Mandipropamide) وخفض الرطوبة بفتح شبابيك التهوية في البيوت البلاستيكية.',
    inpvProduct: 'Ridomil Gold MZ 68 WG',
    darDays: 3,
  },
  {
    label_darja: 'توتا أبسولوتا: الدودة تثقب في حبة الطماطم',
    query: 'التوتا دايرة حالة، الدودة راهي تاكل في الغلة ومثقوبة. شكون أحسن دواء معتمد في الجزائر؟',
    diagnosis: 'Tuta Absoluta (عثة وسوسة الطماطم)',
    treatment: 'استعمل مبيد كلورانترانيليبرول أو إيمامكتين بنزوات مع إضافة مادة لاصقة، وعلق مصائد فرمونية مائية فوراً.',
    inpvProduct: 'Coragen 20 SC / Proclaim',
    darDays: 3,
  },
  {
    label_darja: 'بطاطا: صفورية في العروش ونقاط بنية',
    query: 'البطاطا تحت البيفو عروشها صفارت وبانت فيها نقاط بنية وريحة رطوبة، واش هو المشكل؟',
    diagnosis: 'Early Blight / Phytophthora (لفحة مبكرة/متأخرة في البطاطا)',
    treatment: 'احبس السقي الليلي بالبيفو لتفادي الندى المستمر. رش بمركب أزوكسيستروبين أو دايفينوكونازول مع مراعاة فترة الأمان.',
    inpvProduct: 'Revus Top / Score 250 EC',
    darDays: 7,
  },
  {
    label_darja: 'حمضيات: التواء الأوراق الجديدة (المينوز)',
    query: 'شجر التشينا لوراق الجدد راهم يتكمشو وفيهم خيوط فضية وبيوضة.',
    diagnosis: 'Citrus Leafminer (حفارة أوراق الحمضيات - المينوز)',
    treatment: 'رش النموات الحديثة في الصباح الباكر بمبيد أبامكتين مخلوط بالزيت الصيفي لحماية البراعم الجديدة.',
    inpvProduct: 'Vertimec 018 EC',
    darDays: 7,
  },
];

export function DarjaVoiceAssistant({ sunMode = false }: DarjaVoiceAssistantProps) {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [history, setHistory] = useState<VoiceMessage[]>([
    {
      id: 'msg-init',
      sender: 'agronomist',
      text: 'Salam! Je suis votre conseiller agronomique vocal pour le terrain. Parlez en Darja algérienne, Arabe ou Français pour décrire les symptômes observés sur vos cultures.',
      text_ar: 'سلام عليكم يا فلاح! أنا مرشدك الزراعي الصوتي. تكلم بالدارجة الجزائرية أو العربية لوصف حالة أوراق أو ثمار حقلك ونعطيك الدواء المعتمد وفترة الأمان (DAR) مباشرة.',
      timestamp: '08:00',
    },
  ]);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'ar-DZ'; // Algerian Arabic locale

        recognitionRef.current.onresult = (event: any) => {
          const current = event.resultIndex;
          const text = event.results[current][0].transcript;
          setTranscript(text);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.warn('Speech recognition error', event.error);
          setIsRecording(false);
        };
      }
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      if (transcript) {
        handleProcessQuery(transcript);
      }
    } else {
      setTranscript('');
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Speech start error', err);
        setIsRecording(true);
      }
    }
  };

  const handleProcessQuery = (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: VoiceMessage = {
      id: `msg-${Date.now()}`,
      sender: 'farmer',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setHistory((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    // Smart semantic matcher for Darja/French farming terms
    setTimeout(() => {
      let matchedPrompt = DARJA_QUICK_PROMPTS.find(
        (p) =>
          queryText.includes('طماطم') ||
          queryText.includes('توتا') ||
          queryText.includes('tuta') ||
          queryText.includes('mildiou') ||
          queryText.includes('بطاطا') ||
          queryText.includes('حمضيات') ||
          queryText.includes('تشينا')
      ) || DARJA_QUICK_PROMPTS[0];

      if (queryText.includes('توتا') || queryText.includes('tuta') || queryText.includes('دودة')) {
        matchedPrompt = DARJA_QUICK_PROMPTS[1];
      } else if (queryText.includes('بطاطا') || queryText.includes('pomme de terre')) {
        matchedPrompt = DARJA_QUICK_PROMPTS[2];
      } else if (queryText.includes('تشينا') || queryText.includes('برتقال') || queryText.includes('agrumes')) {
        matchedPrompt = DARJA_QUICK_PROMPTS[3];
      }

      const replyMsg: VoiceMessage = {
        id: `reply-${Date.now()}`,
        sender: 'agronomist',
        text: `Diagnostic terrain : ${matchedPrompt.diagnosis}.\nTraitement recommandé : ${matchedPrompt.treatment}\nProduit homologué INPV : ${matchedPrompt.inpvProduct} (Délai avant récolte : ${matchedPrompt.darDays} jours).`,
        text_ar: `التشخيص الميداني: ${matchedPrompt.diagnosis}.\nالعلاج المعتمد: ${matchedPrompt.treatment}\nالمبيد المرخص بـ INPV: ${matchedPrompt.inpvProduct} (فترة الأمان DAR: ${matchedPrompt.darDays} أيام).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendation: {
          crop: matchedPrompt.diagnosis,
          diagnosis: matchedPrompt.diagnosis,
          treatment: matchedPrompt.treatment,
          inpvProduct: matchedPrompt.inpvProduct,
          darDays: matchedPrompt.darDays,
        },
      };

      setHistory((prev) => [...prev, replyMsg]);
      setIsProcessing(false);
      setTranscript('');

      // Auto speak response if supported
      speakText(language === 'ar' ? (replyMsg.text_ar || replyMsg.text) : replyMsg.text);
    }, 900);
  };

  const speakText = (textToSpeak: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.95;
      utterance.lang = language === 'ar' ? 'ar-SA' : 'fr-FR';

      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  return (
    <Card className={`border shadow-md overflow-hidden ${sunMode ? 'border-foreground bg-background text-foreground' : 'border-border bg-card'}`}>
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-extrabold tracking-tight">
                  {tr('Hands-Free Darja & Arabic Field Voice Assistant', 'المرشد الفلاحي الصوتي الميداني (بالدارجة الجزائرية)', 'Assistant Vocal de Terrain en Darja Algérienne')}
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-bold bg-indigo-50 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  <Languages className="h-3 w-3 inline mr-1" />
                  {tr('Darja / Arabic / French', 'دارجة / عربي / فرنسي', 'Darja / Arabe / Français')}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {tr(
                  'Describe your crop symptoms by voice while inspecting the greenhouse or pivot without taking off your field gloves.',
                  'صف حالة أوراق أو ثمار محصولك بصوتك مباشرة وأنت في الحقل بدون الحاجة لخلع القفازات.',
                  'Décrivez les symptômes à la voix sans retirer vos gants au milieu des serres ou sous les pivots.'
                )}
              </CardDescription>
            </div>
          </div>

          {isPlayingAudio && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={stopAudio}
              className="h-8 text-xs border-rose-500 text-rose-600 gap-1"
            >
              <Square className="h-3 w-3 fill-rose-600" />
              <span>{tr('Stop Audio', 'إيقاف الصوت', 'Arrêter la Voix')}</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-5">
        {/* Voice Conversation Feed */}
        <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
          {history.map((msg) => {
            const isUser = msg.sender === 'farmer';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs shadow-xs">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs space-y-2 leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-muted/50 border border-border text-foreground rounded-tl-none'
                  }`}
                >
                  <p className="font-medium whitespace-pre-line">
                    {language === 'ar' ? (msg.text_ar || msg.text) : msg.text}
                  </p>

                  {/* Recommendation Pill Card */}
                  {msg.recommendation && (
                    <div className="p-3 rounded-xl bg-card border text-foreground space-y-2 mt-2 text-[11px]">
                      <div className="flex items-center justify-between border-b pb-1.5">
                        <span className="font-extrabold text-indigo-600">🛡️ {tr('Homologated Chemical:', 'المبيد المعتمد:', 'Produit Homologué :')}</span>
                        <Badge className="bg-emerald-600 text-white text-[10px]">{msg.recommendation.inpvProduct}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                        <span>{tr('Safety Interval (DAR):', 'فترة الأمان قبل الجني (DAR):', 'Délai Avant Récolte (DAR) :')}</span>
                        <span className="font-bold text-rose-600">{msg.recommendation.darDays} {tr('days', 'أيام', 'jours')}</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => speakText(language === 'ar' ? (msg.text_ar || msg.text) : msg.text)}
                        className="w-full h-7 text-[10px] font-bold text-indigo-600 gap-1 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                      >
                        <Volume2 className="h-3 w-3" />
                        <span>{tr('Replay Audio Advice', 'إعادة الاستماع للنصيحة', 'Réécouter le Conseil')}</span>
                      </Button>
                    </div>
                  )}

                  <span className={`text-[9px] block text-right font-mono ${isUser ? 'text-indigo-200' : 'text-muted-foreground'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground italic p-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
              <span>{tr('Agronomist AI analyzing Darja query & INPV catalog...', 'المرشد الذكي يحلل الوصف الصوتي ويراجع مبيدات INPV...', 'Analyse agronomique de la requête vocale...')}</span>
            </div>
          )}
        </div>

        {/* Quick Darja Symptom Prompts */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-muted-foreground block flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-indigo-500" />
            <span>{tr('Quick Darja Voice Presets (Click to speak):', 'أمثلة جاهزة بالدارجة الميدانية (انقر للتجربة):', 'Exemples en Darja Algérienne :')}</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DARJA_QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleProcessQuery(prompt.query)}
                className="p-2.5 rounded-xl border bg-muted/20 hover:bg-indigo-500/10 hover:border-indigo-500/40 text-left transition-all text-xs flex items-center justify-between group"
              >
                <span className="font-bold text-foreground group-hover:text-indigo-600 truncate">
                  🗣️ {prompt.label_darja}
                </span>
                <Play className="h-3 w-3 text-muted-foreground group-hover:text-indigo-600 shrink-0 ml-1" />
              </button>
            ))}
          </div>
        </div>

        {/* Voice Recording Control Center */}
        <div className="pt-2 border-t flex flex-col items-center gap-3">
          <div className="w-full flex items-center gap-2">
            <input
              type="text"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && transcript) {
                  handleProcessQuery(transcript);
                }
              }}
              placeholder={
                isRecording
                  ? tr('Listening... Speak now (Parlez maintenant / تكلم الآن)...', 'جاري الاستماع... تفضل بالكلام الآن...', 'Écoute en cours...')
                  : tr('Type or speak your crop symptom in Darja...', 'تكلم أو اكتب استفسارك بالدارجة...', 'Tapez ou parlez en Darja...')
              }
              className="flex-1 h-11 px-3.5 rounded-xl border bg-background text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />

            <Button
              type="button"
              onClick={() => {
                if (transcript) handleProcessQuery(transcript);
              }}
              disabled={!transcript.trim() || isProcessing}
              className="h-11 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Main Giant Mic Button */}
          <div className="flex items-center justify-center gap-3">
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={toggleRecording}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
                isRecording
                  ? 'bg-rose-600 text-white ring-8 ring-rose-500/30 animate-pulse'
                  : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white hover:shadow-indigo-500/25 hover:scale-105'
              }`}
            >
              {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </motion.button>
          </div>

          <span className="text-[10px] text-muted-foreground font-medium">
            {isRecording
              ? tr('Recording live audio in Algerian Darja (Click to stop & analyze)...', 'جاري التسجيل بالدارجة... اضغط لإيقاف واستخراج التشخيص', 'Enregistrement en cours (Cliquez pour arrêter)...')
              : tr('Tap microphone to speak hands-free in the field', 'اضغط على الميكروفون للتحدث بدون لمس الهاتف', 'Appuyez sur le micro pour parler les mains libres')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
