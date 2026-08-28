'use client';

import React, { useState } from 'react';
import {
  HeartPulse,
  Compass,
  Bot,
  Sparkles,
  ShieldAlert,
  Sprout,
  Activity,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation, copyFor, type Language } from '@/lib/language-store';
import ChemicalHealthTracker from './ChemicalHealthTracker';
import CropSuitabilityForecaster from './CropSuitabilityForecaster';
import AutonomousRemediationPlanner from './AutonomousRemediationPlanner';

function tr(language: Language, english: string, arabic: string, french: string): string {
  return copyFor(language, english, arabic, french);
}

export type AgroAITab = 'chemical_health' | 'crop_suitability' | 'remediation_planner';

export function AgroAIHub() {
  const { language } = useTranslation();
  const [activeTab, setActiveTab] = useState<AgroAITab>('chemical_health');

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/80 via-slate-900 to-teal-950 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AgroAI Intelligence & Agronomic Automation Engine</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl text-white">
            {tr(
              language,
              'AgroAI Precision Agronomy & Operator Protection Suite',
              'منظومة AgroAI للزراعة الدقيقة وسلامة المزارع والمحاصيل',
              'Suite AgroAI : Agronomie de Précision & Protection de l’Applicateur'
            )}
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            {tr(
              language,
              'Integrates WHO toxicity classes, operator PPE matrix, Maas-Hoffman salinity curves, GDD thermal modeling, and multi-agent IPM remediation planning tailored for Algerian wilayas.',
              'تدمج تصنيفات منظمة الصحة العالمية للسمية، مصفوفة معدات الوقاية، منحنيات ماس-هوفمان للملوحة، النماذج الحرارية، والتخطيط الذكي متعدد الوكلاء لإدارة الآفات.',
              'Intègre les classes de toxicité OMS, la matrice EPI applicateur, les courbes de salinité Maas-Hoffman, les modèles thermiques GDD et la remédiation multi-agents.'
            )}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="relative z-10 mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab('chemical_health')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'chemical_health'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-[1.02]'
                : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            <HeartPulse className="h-4 w-4" />
            {tr(
              language,
              '1. Chemical & Health Impact',
              '١. الاستخدام الكيميائي وصحة الإنسان',
              '1. Impact Chimique & Santé'
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('crop_suitability')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'crop_suitability'
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30 scale-[1.02]'
                : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            <Compass className="h-4 w-4" />
            {tr(
              language,
              '2. Crop Suitability Forecaster',
              '٢. التنبؤ بملاءمة المحاصيل للتربة والمناخ',
              '2. Prévision d’Aptitude Cultures'
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('remediation_planner')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'remediation_planner'
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]'
                : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            <Bot className="h-4 w-4" />
            {tr(
              language,
              '3. Multi-Agent Remediation',
              '٣. مخطط العلاج متعدد الوكلاء',
              '3. Remédiation Multi-Agents'
            )}
          </button>
        </div>
      </div>

      {/* ACTIVE VIEW */}
      <div>
        {activeTab === 'chemical_health' && <ChemicalHealthTracker />}
        {activeTab === 'crop_suitability' && <CropSuitabilityForecaster />}
        {activeTab === 'remediation_planner' && <AutonomousRemediationPlanner />}
      </div>
    </div>
  );
}
