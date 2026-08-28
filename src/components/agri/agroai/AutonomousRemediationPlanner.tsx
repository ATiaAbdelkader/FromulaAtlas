'use client';

import React, { useState, useMemo } from 'react';
import {
  Bot,
  Brain,
  ShieldCheck,
  FlaskConical,
  Leaf,
  Bug,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Layers,
  Sparkles,
  ArrowRight,
  Droplets,
  Clock,
  Send,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation, copyFor, type Language } from '@/lib/language-store';
import {
  AGROAI_PEST_DATABASE,
  type PestProblemSpec,
} from '@/lib/agroai-engine';

function tr(language: Language, english: string, arabic: string, french: string): string {
  return copyFor(language, english, arabic, french);
}

export default function AutonomousRemediationPlanner() {
  const { language } = useTranslation();

  const [selectedPestId, setSelectedPestId] = useState<string>('tuta_absoluta');
  const [fieldAreaHa, setFieldAreaHa] = useState<number>(3.5);
  const [activeStrategy, setActiveStrategy] = useState<'both' | 'organic' | 'chemical'>('both');
  const [agentStep, setAgentStep] = useState<number>(4); // All 4 agents executed

  const currentPest = useMemo(() => {
    return (
      AGROAI_PEST_DATABASE.find((p) => p.id === selectedPestId) ||
      AGROAI_PEST_DATABASE[0]
    );
  }, [selectedPestId]);

  // Tank water and total cost scaling
  const fieldCalculations = useMemo(() => {
    const orgCostTotal = Math.round(currentPest.organicProtocol.costDzdPerHa * fieldAreaHa);
    const chemCostTotal = Math.round(currentPest.chemicalProtocol.costDzdPerHa * fieldAreaHa);
    const chemTotalWaterL = Math.round(currentPest.chemicalProtocol.waterVolumeLPerHa * fieldAreaHa);

    return {
      orgCostTotal,
      chemCostTotal,
      chemTotalWaterL,
    };
  }, [currentPest, fieldAreaHa]);

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-xs">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-700 dark:text-indigo-400">
                {tr(language, 'Autonomous Multi-Agent Pipeline', 'نظام الوكلاء المتعددين الذكي (AgroAI)', 'Pipeline Multi-Agents Autonome')}
              </span>
              <Badge variant="outline" className="text-[10px] font-semibold border-indigo-300 text-indigo-700">
                4 Specialized Agents
              </Badge>
            </div>
            <h3 className="text-lg font-bold text-foreground">
              {tr(
                language,
                'Autonomous Multi-Agent Crop Remediation Planner',
                'المخطط الذكي متعدد الوكلاء لعلاج وحماية المحاصيل',
                'Planificateur Multi-Agents de Remédiation des Cultures'
              )}
            </h3>
          </div>
        </div>

        {/* Pest Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground">
            {tr(language, 'Target Issue:', 'الآفة المستهدفة:', 'Problème ciblé :')}
          </label>
          <select
            value={selectedPestId}
            onChange={(e) => setSelectedPestId(e.target.value)}
            className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-bold text-foreground focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            {AGROAI_PEST_DATABASE.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name[language]} ({p.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MULTI-AGENT WORKFLOW ORCHESTRATION STATUS */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {/* Agent 1 */}
        <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 dark:border-indigo-900/60 dark:bg-indigo-950/30">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
            A1
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-indigo-800 dark:text-indigo-300 block">
              Diagnosis Agent
            </span>
            <span className="text-xs font-bold text-foreground line-clamp-1">
              {currentPest.scientificName}
            </span>
          </div>
        </div>

        {/* Agent 2 */}
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/30">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
            A2
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 block">
              Bio-Control Agent
            </span>
            <span className="text-xs font-bold text-foreground line-clamp-1">
              Bio-Rational Recipes
            </span>
          </div>
        </div>

        {/* Agent 3 */}
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/60 dark:bg-amber-950/30">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white font-bold text-xs">
            A3
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300 block">
              Chemical Prescriber
            </span>
            <span className="text-xs font-bold text-foreground line-clamp-1">
              IRAC/FRAC Rotation
            </span>
          </div>
        </div>

        {/* Agent 4 */}
        <div className="flex items-center gap-3 rounded-xl border border-purple-200 bg-purple-50/70 p-3 dark:border-purple-900/60 dark:bg-purple-950/30">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-white font-bold text-xs">
            A4
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-purple-800 dark:text-purple-300 block">
              Safety & Cost Auditor
            </span>
            <span className="text-xs font-bold text-foreground line-clamp-1">
              DAR & REI Approved
            </span>
          </div>
        </div>
      </div>

      {/* DIAGNOSTIC SUMMARY & THRESHOLD BANNER */}
      <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-indigo-600" />
            <h4 className="text-sm font-bold text-foreground">
              {tr(language, 'Agronomic Diagnostic Hallmarks & Thresholds', 'المؤشرات التشخيصية وعتبة الضرر الاقتصادي', 'Signes Diagnostiques & Seuil d’Intervention')}
            </h4>
          </div>
          <Badge variant="outline" className="text-xs font-semibold">
            {tr(language, 'Field Area:', 'مساحة الحقل:', 'Superficie :')} {fieldAreaHa} ha
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-xs">
          <div className="rounded-xl bg-card p-3 border border-border space-y-1.5">
            <span className="font-bold text-muted-foreground block">
              🔍 {tr(language, 'Key Visual Symptoms:', 'أبرز الأعراض الميدانية:', 'Symptômes Visuels Clés :')}
            </span>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-foreground">
              {currentPest.diagnosticHallmarks.map((hallmark, idx) => (
                <li key={idx}>{hallmark}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-card p-3 border border-border space-y-1.5">
            <span className="font-bold text-muted-foreground block">
              ⚖️ {tr(language, 'Economic Action Threshold:', 'عتبة التدخل الاقتصادي:', 'Seuil d’Intervention Économique :')}
            </span>
            <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
              {currentPest.economicThresholdDescription}
            </p>
            <div className="pt-1 flex items-center gap-2">
              <label className="text-[11px] text-muted-foreground">Modifier superficie (ha) :</label>
              <input
                type="number"
                min="0.5"
                max="50"
                step="0.5"
                value={fieldAreaHa}
                onChange={(e) => setFieldAreaHa(Number(e.target.value))}
                className="w-20 rounded-md border border-border bg-muted/30 px-2 py-0.5 text-xs font-bold text-foreground"
              />
            </div>
          </div>
        </div>
      </div>

      {/* DUAL REMEDIATION STRATEGIES (SIDE-BY-SIDE) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* OPTION A: INTEGRATED BIOLOGICAL & BIO-RATIONAL PROTOCOL */}
        <div className="flex flex-col justify-between rounded-2xl border border-emerald-300 bg-emerald-50/30 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/10 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <Leaf className="h-4 w-4" />
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Option A (Écologique & Résidus Zéro)
                  </span>
                  <h4 className="text-sm font-bold text-foreground">
                    {currentPest.organicProtocol.title}
                  </h4>
                </div>
              </div>
              <Badge className="bg-emerald-600 text-white">0j DAR / Bio</Badge>
            </div>

            {/* Active Bio Agents */}
            <div className="space-y-2 pt-2 text-xs">
              <div className="rounded-xl bg-card p-3 border border-border space-y-1">
                <span className="font-semibold text-muted-foreground block">
                  🧪 {tr(language, 'Bio-Control Agents & Formulations:', 'المواد البيولوجية والمستخلصات:', 'Agents de Bio-Contrôle :')}
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] font-semibold text-foreground">
                  {currentPest.organicProtocol.bioAgents.map((agent, idx) => (
                    <li key={idx}>{agent}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-card p-3 border border-border space-y-1">
                <span className="font-semibold text-muted-foreground block">
                  💧 {tr(language, 'Application Dose & Method:', 'طريقة التطبيق والجرعة:', 'Dose & Modalité d’Application :')}
                </span>
                <p className="text-[11px] text-foreground">
                  {currentPest.organicProtocol.dosage}
                </p>
                <p className="text-[10px] text-muted-foreground italic">
                  {currentPest.organicProtocol.applicationMethod}
                </p>
              </div>
            </div>
          </div>

          {/* Cost & Safety Footprint */}
          <div className="border-t border-emerald-200 dark:border-emerald-900 pt-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground block">
                {tr(language, 'Budget per Hectare', 'التكلفة بالهكتار', 'Coût / Hectare')}
              </span>
              <strong className="text-sm font-black text-emerald-800 dark:text-emerald-300">
                {currentPest.organicProtocol.costDzdPerHa.toLocaleString()} DZD/ha
              </strong>
              <span className="text-[10px] text-muted-foreground block">
                (Total {fieldAreaHa} ha: {fieldCalculations.orgCostTotal.toLocaleString()} DZD)
              </span>
            </div>
            <Badge variant="outline" className="border-emerald-400 text-emerald-700">
              Safe for Pollinators
            </Badge>
          </div>
        </div>

        {/* OPTION B: TARGETED CHEMICAL & IRAC/FRAC ROTATION PROTOCOL */}
        <div className="flex flex-col justify-between rounded-2xl border border-amber-300 bg-amber-50/30 p-5 dark:border-amber-900/60 dark:bg-amber-950/10 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  <FlaskConical className="h-4 w-4" />
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Option B (Chimique Ciblé Homologué)
                  </span>
                  <h4 className="text-sm font-bold text-foreground">
                    {currentPest.chemicalProtocol.title}
                  </h4>
                </div>
              </div>
              <Badge className="bg-amber-600 text-white">
                WHO {currentPest.chemicalProtocol.whoToxClass}
              </Badge>
            </div>

            {/* Chemical Prescription Specs */}
            <div className="space-y-2 pt-2 text-xs">
              <div className="rounded-xl bg-card p-3 border border-border space-y-1">
                <span className="font-semibold text-muted-foreground block">
                  🔬 {tr(language, 'Active Substance & Commercial Product:', 'المادة الفعالة والاسم التجاري:', 'Matière Active & Produit Commercial :')}
                </span>
                <strong className="text-xs text-foreground block">
                  {currentPest.chemicalProtocol.commercialProduct}
                </strong>
                <span className="text-[10px] text-muted-foreground block">
                  {currentPest.chemicalProtocol.iracFracGroup}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-card p-2 border border-border">
                  <span className="text-[10px] text-muted-foreground block">Dose / ha</span>
                  <strong className="text-xs text-foreground font-mono">
                    {currentPest.chemicalProtocol.dosagePerHa}
                  </strong>
                </div>
                <div className="rounded-xl bg-card p-2 border border-border">
                  <span className="text-[10px] text-muted-foreground block">Volume Bouillie</span>
                  <strong className="text-xs text-foreground font-mono">
                    {currentPest.chemicalProtocol.waterVolumeLPerHa} L/ha
                  </strong>
                </div>
                <div className="rounded-xl bg-card p-2 border border-border">
                  <span className="text-[10px] text-muted-foreground block">Délai DAR</span>
                  <strong className="text-xs text-amber-600 font-mono">
                    {currentPest.chemicalProtocol.phiDays} jours
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Cost & Tank Calculation */}
          <div className="border-t border-amber-200 dark:border-amber-900 pt-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground block">
                {tr(language, 'Budget per Hectare', 'التكلفة بالهكتار', 'Coût / Hectare')}
              </span>
              <strong className="text-sm font-black text-amber-800 dark:text-amber-300">
                {currentPest.chemicalProtocol.costDzdPerHa.toLocaleString()} DZD/ha
              </strong>
              <span className="text-[10px] text-muted-foreground block">
                (Total {fieldAreaHa} ha: {fieldCalculations.chemCostTotal.toLocaleString()} DZD)
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground block">Cuve totale eau</span>
              <strong className="text-xs font-mono font-bold text-foreground">
                {fieldCalculations.chemTotalWaterL} Litres
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
