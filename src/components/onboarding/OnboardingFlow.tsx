'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sparkles, ArrowRight, ArrowLeft, X, Check, Leaf, Calculator,
  Bot, Calendar, Zap, ChevronRight,
} from 'lucide-react';
import {
  isFirstVisit, completeOnboarding, skipOnboarding,
  ROLE_OPTIONS, CROP_OPTIONS, type UserRole,
} from '@/lib/onboarding-store';

type Step = 'welcome' | 'role' | 'crop' | 'features' | 'finish';

const FEATURE_HIGHLIGHTS = [
  {
    icon: Calculator,
    color: '#16a34a',
    title: '18 Free Agronomic Tools',
    description: 'Converters, hydro solution designer, VPD estimator, fertilizer compatibility matrix, soil texture triangle, and more — all native, no sign-up.',
    badge: 'Tools tab',
  },
  {
    icon: Bot,
    color: '#0891b2',
    title: 'AI Agronomist Assistant',
    description: 'A floating chat that knows all 18 tools. Describe a symptom or share lab values — it tells you exactly which tool to open and what to enter.',
    badge: 'Bottom-right',
  },
  {
    icon: Calendar,
    color: '#7c3aed',
    title: 'Season Plan Generator',
    description: 'Generate a 52-week NPK + irrigation + fertigation plan for any crop in under 5 seconds. Download as PDF. Includes soil/water quality warnings.',
    badge: 'Pro feature',
  },
];

/**
 * Cinematic onboarding flow — auto-shows on first visit.
 * Steps: welcome → role → crop → features → finish
 */
export function OnboardingFlow() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>('welcome');
  const [role, setRole] = useState<UserRole | null>(null);
  const [crop, setCrop] = useState<string | null>(null);

  // Auto-show on first visit (client-side check)
  useEffect(() => {
    if (isFirstVisit()) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const close = useCallback(() => setVisible(false), []);

  const handleSkip = useCallback(() => {
    skipOnboarding();
    close();
  }, [close]);

  const handleFinish = useCallback(() => {
    if (role && crop) completeOnboarding(role, crop);
    else skipOnboarding();
    close();
  }, [role, crop, close]);

  const next = useCallback(() => {
    setStep(s => {
      if (s === 'welcome') return 'role';
      if (s === 'role') return 'crop';
      if (s === 'crop') return 'features';
      if (s === 'features') return 'finish';
      return s;
    });
  }, []);

  const back = useCallback(() => {
    setStep(s => {
      if (s === 'finish') return 'features';
      if (s === 'features') return 'crop';
      if (s === 'crop') return 'role';
      if (s === 'role') return 'welcome';
      return s;
    });
  }, []);

  if (!visible) return null;

  const stepIndex = ['welcome', 'role', 'crop', 'features', 'finish'].indexOf(step);
  const stepCount = 5;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-green-900 to-teal-950" style={{ animation: 'ob-fade-in 0.4s ease-out' }} />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl" style={{ animation: 'ob-float 8s ease-in-out infinite' }} />
        <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-teal-500/20 blur-3xl" style={{ animation: 'ob-float 10s ease-in-out infinite 1s' }} />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl" style={{ animation: 'ob-float 9s ease-in-out infinite 2s' }} />
      </div>

      <div className="relative w-full max-w-2xl bg-card/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden" style={{ animation: 'ob-slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        {step !== 'welcome' && step !== 'finish' && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted/40 z-10">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 ease-out" style={{ width: `${(stepIndex / (stepCount - 2)) * 100}%` }} />
          </div>
        )}

        {step !== 'finish' && (
          <button onClick={handleSkip} className="absolute top-4 right-4 z-20 text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/50 transition-colors" title="Skip tour">
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="p-6 sm:p-10 min-h-[440px] flex flex-col">
          {step === 'welcome' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5" style={{ animation: 'ob-fade-in 0.6s ease-out 0.2s both' }}>
              <div className="relative">
                <div className="flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 shadow-lg shadow-emerald-500/30">
                  <Leaf className="h-10 w-10 text-white" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-amber-400" style={{ animation: 'ob-pulse 2s ease-in-out infinite' }} />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                  Welcome to <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Formula Atlas</span>
                </h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
                  Your all-in-one agronomy platform — 18 precision calculators, an AI agronomist, and a 52-week season plan generator. Let&apos;s take a 60-second tour.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 w-full max-w-md mt-2">
                {[
                  { icon: Calculator, label: '18 Tools', color: '#16a34a' },
                  { icon: Bot, label: 'AI Assistant', color: '#0891b2' },
                  { icon: Calendar, label: 'Season Plan', color: '#7c3aed' },
                ].map((f, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted/40 border border-border/60">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg" style={{ background: `${f.color}20`, color: f.color }}>
                      <f.icon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">{f.label}</span>
                  </div>
                ))}
              </div>
              <Button onClick={next} size="lg" className="mt-4 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
              <button onClick={handleSkip} className="text-xs text-muted-foreground hover:text-foreground underline mt-1">Skip the tour</button>
            </div>
          )}

          {step === 'role' && (
            <div className="flex-1 flex flex-col space-y-4" style={{ animation: 'ob-fade-in 0.4s ease-out' }}>
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold text-foreground">Who are you?</h2>
                <p className="text-xs text-muted-foreground">We&apos;ll tailor examples and recommendations to your role.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
                {ROLE_OPTIONS.map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setRole(r.id); setTimeout(next, 200); }}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${role === r.id ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30' : 'border-border hover:border-emerald-300 hover:bg-muted/40'}`}
                  >
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted/60 text-xl flex-shrink-0">{r.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground">{r.label}</div>
                      <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{r.description}</div>
                    </div>
                    {role === r.id && <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2">
                <Button variant="ghost" size="sm" onClick={back} className="gap-1.5 text-muted-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back</Button>
                <Button onClick={next} disabled={!role} size="sm" className="gap-1.5">Continue <ArrowRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          )}

          {step === 'crop' && (
            <div className="flex-1 flex flex-col space-y-4" style={{ animation: 'ob-fade-in 0.4s ease-out' }}>
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold text-foreground">What do you grow?</h2>
                <p className="text-xs text-muted-foreground">We&apos;ll pre-load crop-specific presets in the calculators.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 flex-1">
                {CROP_OPTIONS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setCrop(c.id); setTimeout(next, 200); }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${crop === c.id ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 scale-105' : 'border-border hover:border-emerald-300 hover:bg-muted/40'}`}
                  >
                    <span className="text-3xl">{c.emoji}</span>
                    <span className="text-xs font-medium text-foreground">{c.label}</span>
                    {crop === c.id && <Check className="h-3 w-3 text-emerald-600" />}
                  </button>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2">
                <Button variant="ghost" size="sm" onClick={back} className="gap-1.5 text-muted-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back</Button>
                <Button onClick={next} disabled={!crop} size="sm" className="gap-1.5">Continue <ArrowRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          )}

          {step === 'features' && (
            <div className="flex-1 flex flex-col space-y-3" style={{ animation: 'ob-fade-in 0.4s ease-out' }}>
              <div className="text-center space-y-1 mb-2">
                <h2 className="text-xl font-bold text-foreground">Your 3 power features</h2>
                <p className="text-xs text-muted-foreground">Everything you need to replace 5 tools you use daily.</p>
              </div>
              <div className="space-y-2.5 flex-1">
                {FEATURE_HIGHLIGHTS.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-muted/30" style={{ animation: `ob-slide-in 0.4s ease-out ${i * 0.15}s both` }}>
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg flex-shrink-0" style={{ background: `${f.color}20`, color: f.color }}>
                      <f.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${f.color}20`, color: f.color }}>{f.badge}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{f.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2">
                <Button variant="ghost" size="sm" onClick={back} className="gap-1.5 text-muted-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back</Button>
                <Button onClick={next} size="sm" className="gap-1.5">Almost there <ArrowRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          )}

          {step === 'finish' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5" style={{ animation: 'ob-fade-in 0.5s ease-out' }}>
              <div className="relative">
                <div className="flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
                  <Check className="h-10 w-10 text-white" strokeWidth={3} />
                </div>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full" style={{ background: ['#10b981', '#14b8a6', '#06b6d4', '#fbbf24', '#f59e0b', '#84cc16'][i], animation: `ob-confetti-${i} 1.2s ease-out infinite` }} />
                ))}
              </div>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold text-foreground">You&apos;re all set!</h2>
                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                  {role && crop ? (
                    <>
                      As a <strong className="text-foreground">{ROLE_OPTIONS.find(r => r.id === role)?.label}</strong> working with{' '}
                      <strong className="text-foreground">{CROP_OPTIONS.find(c => c.id === crop)?.label}</strong>, your presets are ready.
                      Open the <strong className="text-foreground">Tools tab</strong> to start, or click the{' '}
                      <strong className="text-foreground">AI Agronomist</strong> button anytime you need guidance.
                    </>
                  ) : (
                    <>Open the Tools tab to explore all 18 calculators, or click the AI Agronomist button for instant guidance.</>
                  )}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
                <div className="rounded-lg p-2.5 bg-muted/40 border border-border">
                  <div className="text-lg font-bold text-emerald-600">18</div>
                  <div className="text-[10px] text-muted-foreground">Tools</div>
                </div>
                <div className="rounded-lg p-2.5 bg-muted/40 border border-border">
                  <div className="text-lg font-bold text-cyan-600">AI</div>
                  <div className="text-[10px] text-muted-foreground">Agronomist</div>
                </div>
                <div className="rounded-lg p-2.5 bg-muted/40 border border-border">
                  <div className="text-lg font-bold text-violet-600">52</div>
                  <div className="text-[10px] text-muted-foreground">Week plans</div>
                </div>
              </div>
              <Button onClick={handleFinish} size="lg" className="mt-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 gap-2">
                <Zap className="h-4 w-4" /> Start using Formula Atlas
              </Button>
            </div>
          )}
        </div>

        {step !== 'welcome' && step !== 'finish' && (
          <div className="px-6 sm:px-10 py-2.5 border-t border-border/60 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Step {stepIndex} of {stepCount - 2}</span>
            <span className="flex items-center gap-1">Takes ~60 seconds <ChevronRight className="h-3 w-3" /></span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes ob-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ob-slide-up { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes ob-slide-in { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes ob-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.15); opacity: 0.8; } }
        @keyframes ob-float { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(20px, -30px); } }
        @keyframes ob-confetti-0 { 0% { transform: translate(-50%, -50%) translate(0, 0); opacity: 1; } 100% { transform: translate(-50%, -50%) translate(-40px, -60px); opacity: 0; } }
        @keyframes ob-confetti-1 { 0% { transform: translate(-50%, -50%) translate(0, 0); opacity: 1; } 100% { transform: translate(-50%, -50%) translate(40px, -60px); opacity: 0; } }
        @keyframes ob-confetti-2 { 0% { transform: translate(-50%, -50%) translate(0, 0); opacity: 1; } 100% { transform: translate(-50%, -50%) translate(-60px, 20px); opacity: 0; } }
        @keyframes ob-confetti-3 { 0% { transform: translate(-50%, -50%) translate(0, 0); opacity: 1; } 100% { transform: translate(-50%, -50%) translate(60px, 20px); opacity: 0; } }
        @keyframes ob-confetti-4 { 0% { transform: translate(-50%, -50%) translate(0, 0); opacity: 1; } 100% { transform: translate(-50%, -50%) translate(0, -70px); opacity: 0; } }
        @keyframes ob-confetti-5 { 0% { transform: translate(-50%, -50%) translate(0, 0); opacity: 1; } 100% { transform: translate(-50%, -50%) translate(0, 70px); opacity: 0; } }
      `}</style>
    </div>
  );
}
