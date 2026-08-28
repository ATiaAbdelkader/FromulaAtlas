"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Activity, AlertTriangle, CheckCircle2, ClipboardCheck, CloudOff, Droplets, FlaskConical, RefreshCw, ShieldCheck, Sparkles, Tractor, Wifi } from 'lucide-react';
import { ALGERIA_CROPS, PLANT_PROBLEMS } from '@/lib/algeria-phyto-data';
import { createDefaultSimulatorScenario, formatSimulatorDzd, getSimulatorCropProfiles, type SimulatorScenario } from '@/lib/crop-simulator';
import { appendManualFieldRecord, buildFieldRecordTimeline, getFieldRecordBookStats, type FieldRecord, type FieldRecordKind } from '@/lib/field-record-book';
import { useTranslation } from '@/lib/language-store';
import { SoilEvidenceWorkbench } from '@/components/agri/soil-evidence-workbench';
import type { TabId } from '@/lib/user-level';
import {
  buildIpmComplianceReview,
  calculateScenarioLab,
  calculateWaterSalinityDecision,
  getProfessionalToolLabel,
  type ProfessionalToolId,
} from '@/lib/professional-tools';

type Language = 'en' | 'fr' | 'ar';

const TOOL_IDS: ProfessionalToolId[] = ['water-salinity', 'ipm-compliance', 'scenario-lab', 'casebook', 'field-missions', 'soil-evidence'];
const inputClass = 'h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';
const panelClass = 'rounded-2xl border border-border/70 bg-card p-4 shadow-sm';

function copy(language: Language, en: string, fr: string, ar: string): string {
  return language === 'fr' ? fr : language === 'ar' ? ar : en;
}

function dateLabel(language: Language, timestamp: string | number): string {
  return new Date(timestamp).toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-DZ');
}

function statusLabel(language: Language, value: string): string {
  const labels: Record<string, [string, string, string]> = {
    low: ['Low', 'Faible', 'منخفض'],
    watch: ['Watch', 'Surveillance', 'مراقبة'],
    high: ['High', 'Élevé', 'مرتفع'],
    critical: ['Critical', 'Critique', 'حرج'],
    monitor: ['Monitor', 'Surveiller', 'مراقبة'],
    'review-treatment': ['Review treatment', 'Revoir le traitement', 'مراجعة المعالجة'],
    hold: ['Hold', 'Suspendre', 'إيقاف'],
    medium: ['Medium', 'Moyen', 'متوسط'],
    good: ['Good', 'Bon', 'جيد'],
    danger: ['High risk', 'Risque élevé', 'خطر مرتفع'],
    queued: ['Queued', 'En attente', 'قيد الانتظار'],
    done: ['Done', 'Terminé', 'مكتمل'],
    neutral: ['Neutral', 'Neutre', 'محايد'],
  };
  const valueSet = labels[value];
  return valueSet ? copy(language, valueSet[0], valueSet[1], valueSet[2]) : value;
}

function warningLabel(language: Language, warning: string): string {
  const translations: Array<[string, string, string, string]> = [
    ['positive field area', 'Enter a positive field area to estimate total volume and pumping cost.', 'Saisissez une superficie positive pour estimer le volume total et le coût de pompage.', 'أدخل مساحة حقل موجبة لتقدير الحجم الإجمالي وتكلفة الضخ.'],
    ['water EC exceeds', 'Irrigation-water EC exceeds the selected crop tolerance threshold; verify the laboratory test and source blend before increasing irrigation.', 'La CE de l’eau d’irrigation dépasse le seuil de tolérance choisi ; vérifiez l’analyse de laboratoire et le mélange d’eau avant d’augmenter l’irrigation.', 'تتجاوز ملوحة مياه الري عتبة تحمّل المحصول؛ تحقق من التحليل المخبري ومصدر المياه قبل زيادة الري.'],
    ['Root-zone salinity', 'Root-zone salinity is above the crop threshold; confirm ECe, drainage, and crop stage with a qualified agronomist before a leaching event.', 'La salinité de la zone racinaire dépasse le seuil de la culture ; confirmez l’ECe, le drainage et le stade avec un agronome qualifié avant tout lessivage.', 'ملوحة منطقة الجذور أعلى من عتبة المحصول؛ تحقق من ECe والصرف ومرحلة المحصول مع مهندس زراعي قبل عملية الغسل.'],
    ['Drainage efficiency', 'Drainage efficiency is limited; a larger irrigation dose may increase waterlogging and salinity movement into the root zone.', 'L’efficacité du drainage est limitée ; une dose d’irrigation plus élevée peut accroître l’engorgement et déplacer les sels vers la zone racinaire.', 'كفاءة الصرف محدودة؛ قد تؤدي جرعة ري أكبر إلى زيادة التغدق ونقل الأملاح إلى منطقة الجذور.'],
    ['Observed pressure', 'Observed pressure is below the action threshold; continue scouting and preserve beneficial organisms.', 'La pression observée est inférieure au seuil d’intervention ; poursuivez la surveillance et préservez les auxiliaires.', 'الضغط المرصود أقل من عتبة التدخل؛ واصل الرصد وحافظ على الكائنات النافعة.'],
    ['threshold is reached', 'The threshold is reached, but no treatment has been selected; review biological, cultural, and mechanical controls first.', 'Le seuil est atteint, mais aucun traitement n’est sélectionné ; examinez d’abord les moyens biologiques, culturaux et mécaniques.', 'تم بلوغ العتبة، لكن لم يتم اختيار معالجة؛ راجع أولاً الوسائل الحيوية والثقافية والميكانيكية.'],
    ['not confirmed as registered', 'This active matter is not confirmed as registered in the curated Algerian catalogue; verify current INPV authorization before use.', 'Cette substance active n’est pas confirmée comme homologuée dans le catalogue algérien ; vérifiez l’autorisation INPV actuelle avant usage.', 'لم يتم تأكيد تسجيل هذه المادة الفعالة في الفهرس الجزائري؛ تحقق من ترخيص INPV الحالي قبل الاستعمال.'],
    ['crop is not listed', 'The selected crop is not listed in the current product record; do not use this selection without label confirmation.', 'La culture sélectionnée ne figure pas dans la fiche actuelle du produit ; ne l’utilisez pas sans confirmation de l’étiquette.', 'المحصول المختار غير مدرج في سجل المنتج الحالي؛ لا تستخدم هذا الاختيار دون تأكيد الملصق.'],
    ['Label, dose', 'Label, dose, DAR/PHI, application count, and permitted crop must be verified before any spray decision.', 'L’étiquette, la dose, le DAR/PHI, le nombre d’applications et la culture autorisée doivent être vérifiés avant toute décision de traitement.', 'يجب التحقق من الملصق والجرعة وDAR/PHI وعدد التطبيقات والمحصول المسموح قبل أي قرار رش.'],
    ['Weather is not suitable', 'Weather is not suitable for spraying; postpone and reassess wind, temperature, and nearby sensitive areas.', 'Les conditions météo ne conviennent pas au traitement ; reportez et réévaluez le vent, la température et les zones sensibles voisines.', 'الطقس غير مناسب للرش؛ أَجّل العملية وأعد تقييم الرياح والحرارة والمناطق الحساسة المجاورة.'],
    ['same resistance group', 'The same resistance group was recently used; select a different mode of action and follow the label rotation rules.', 'Le même groupe de résistance a été utilisé récemment ; choisissez un autre mode d’action et suivez les règles de rotation de l’étiquette.', 'تم استخدام مجموعة المقاومة نفسها مؤخراً؛ اختر آلية تأثير مختلفة واتبع قواعد التناوب على الملصق.'],
    ['harvest interval', 'The current harvest interval is shorter than the selected product’s listed pre-harvest interval.', 'L’intervalle avant récolte actuel est plus court que le délai avant récolte indiqué pour le produit.', 'الفترة المتبقية قبل الحصاد أقصر من فترة ما قبل الحصاد المحددة للمنتج.'],
  ];
  const match = translations.find(([needle]) => warning.includes(needle));
  return match ? copy(language, match[1], match[2], match[3]) : warning;
}

function NumberInput({ label, value, onChange, min = 0, max, step = 1, suffix }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number; suffix?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}{suffix ? ` · ${suffix}` : ''}</span>
      <input className={inputClass} type="number" min={min} max={max} step={step} value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function Metric({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'good' | 'warn' | 'danger' }) {
  const toneClass = tone === 'good' ? 'text-emerald-700 dark:text-emerald-300' : tone === 'warn' ? 'text-amber-700 dark:text-amber-300' : tone === 'danger' ? 'text-red-700 dark:text-red-300' : 'text-foreground';
  return <div className="rounded-xl border border-border/70 bg-muted/20 p-3"><div className="text-[11px] text-muted-foreground">{label}</div><div className={`mt-1 text-lg font-bold ${toneClass}`}>{value}</div></div>;
}

function StatusPill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'danger' }) {
  const classes = tone === 'good' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200' : tone === 'warn' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200' : tone === 'danger' ? 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200' : 'bg-muted text-muted-foreground';
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${classes}`}>{children}</span>;
}

function WaterSalinityPanel({ language }: { language: Language }) {
  const [input, setInput] = useState({ areaHa: 1, dailyEt0Mm: [5, 5, 5, 5, 5, 5, 5], dailyRainMm: [0, 0, 0, 0, 0, 0, 0], kc: 0.9, irrigationAppliedGrossMm: 0, systemEfficiencyPct: 85, rootZoneAvailableWaterMm: 120, initialDepletionPct: 35, allowedDepletionPct: 45, effectiveRainPct: 80, waterEcDsM: 1.1, soilEcDsM: 2.2, cropSalinityThresholdDsM: 3, drainageEfficiencyPct: 80, pumpHeadM: 30, pumpEfficiencyPct: 70, electricityDzdPerKwh: 8 });
  const result = useMemo(() => calculateWaterSalinityDecision(input), [input]);
  const update = (key: keyof typeof input, value: number) => setInput((current) => ({ ...current, [key]: value }));
  const riskTone = result.soilSalinityRisk === 'low' ? 'good' : result.soilSalinityRisk === 'watch' ? 'warn' : 'danger';
  return <div className="space-y-4">
    <div className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4 text-sm text-cyan-950 dark:border-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-100"><div className="flex items-start gap-2"><Droplets className="mt-0.5 h-4 w-4 shrink-0" /><p>{copy(language, 'Connects water balance to salinity, drainage, and pumping energy so the recommendation is explainable rather than a blind irrigation dose.', 'Relie le bilan hydrique à la salinité, au drainage et à l’énergie pour produire une décision explicable plutôt qu’une dose d’irrigation aveugle.', 'يربط ميزان المياه بالملوحة والصرف والطاقة لإنتاج قرار قابل للتفسير، وليس جرعة ري عمياء.')}</p></div></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <NumberInput label={copy(language, 'Field area', 'Superficie', 'مساحة الحقل')} suffix="ha" value={input.areaHa} onChange={(value) => update('areaHa', value)} step={0.1} />
      <NumberInput label={copy(language, 'Crop coefficient Kc', 'Coefficient cultural Kc', 'معامل المحصول Kc')} value={input.kc} onChange={(value) => update('kc', value)} step={0.05} />
      <NumberInput label={copy(language, 'Water EC', 'CE de l’eau', 'ملوحة المياه')} suffix="dS/m" value={input.waterEcDsM} onChange={(value) => update('waterEcDsM', value)} step={0.1} />
      <NumberInput label={copy(language, 'Root-zone ECe', 'ECe de la zone racinaire', 'ECe منطقة الجذور')} suffix="dS/m" value={input.soilEcDsM} onChange={(value) => update('soilEcDsM', value)} step={0.1} />
      <NumberInput label={copy(language, 'Crop tolerance', 'Tolérance de la culture', 'تحمل المحصول')} suffix="dS/m" value={input.cropSalinityThresholdDsM} onChange={(value) => update('cropSalinityThresholdDsM', value)} step={0.1} />
      <NumberInput label={copy(language, 'System efficiency', 'Efficacité du système', 'كفاءة النظام')} suffix="%" value={input.systemEfficiencyPct} onChange={(value) => update('systemEfficiencyPct', value)} min={1} max={100} />
      <NumberInput label={copy(language, 'Drainage efficiency', 'Efficacité du drainage', 'كفاءة الصرف')} suffix="%" value={input.drainageEfficiencyPct} onChange={(value) => update('drainageEfficiencyPct', value)} min={20} max={100} />
      <NumberInput label={copy(language, 'Pump head', 'Hauteur manométrique', 'ارتفاع الضخ')} suffix="m" value={input.pumpHeadM} onChange={(value) => update('pumpHeadM', value)} />
      <NumberInput label={copy(language, 'Pump efficiency', 'Efficacité de la pompe', 'كفاءة المضخة')} suffix="%" value={input.pumpEfficiencyPct} onChange={(value) => update('pumpEfficiencyPct', value)} min={20} max={100} />
      <NumberInput label={copy(language, 'Electricity rate', 'Tarif électrique', 'تعرفة الكهرباء')} suffix="DZD/kWh" value={input.electricityDzdPerKwh} onChange={(value) => update('electricityDzdPerKwh', value)} />
      <NumberInput label={copy(language, 'Initial depletion', 'Déficit initial', 'الاستنزاف الأولي')} suffix="%" value={input.initialDepletionPct} onChange={(value) => update('initialDepletionPct', value)} min={0} max={100} />
      <NumberInput label={copy(language, 'Allowed depletion', 'Déficit autorisé', 'الاستنزاف المسموح')} suffix="%" value={input.allowedDepletionPct} onChange={(value) => update('allowedDepletionPct', value)} min={1} max={100} />
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Metric label={copy(language, 'Adjusted water need', 'Besoin en eau ajusté', 'الاحتياج المائي المعدل')} value={`${result.salinityAdjustedGrossMm} mm`} tone={riskTone} />
      <Metric label={copy(language, 'Field volume', 'Volume du champ', 'حجم الحقل')} value={`${result.salinityAdjustedVolumeM3} m³`} />
      <Metric label={copy(language, 'Leaching fraction', 'Fraction de lessivage', 'نسبة الغسل')} value={`${result.leachingFractionPct}%`} tone={result.leachingFractionPct > 20 ? 'warn' : 'default'} />
      <Metric label={copy(language, 'Pump energy', 'Énergie de pompage', 'طاقة الضخ')} value={`${result.pumpEnergyKwh} kWh`} />
      <Metric label={copy(language, 'Pump cost', 'Coût de pompage', 'تكلفة الضخ')} value={`${result.pumpCostDzd.toLocaleString()} DZD`} />
    </div>
    <div className="flex flex-wrap gap-2"><StatusPill tone={riskTone}>{copy(language, 'Root-zone salinity', 'Salinité racinaire', 'ملوحة منطقة الجذور')}: {statusLabel(language, result.soilSalinityRisk)}</StatusPill><StatusPill tone={result.drainageRisk === 'low' ? 'good' : result.drainageRisk === 'watch' ? 'warn' : 'danger'}>{copy(language, 'Drainage', 'Drainage', 'الصرف')}: {statusLabel(language, result.drainageRisk)}</StatusPill><StatusPill>{copy(language, 'Water balance', 'Bilan hydrique', 'ميزان المياه')}: {result.waterBudget.status}</StatusPill></div>
    {result.warnings.length > 0 && <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> {copy(language, 'Decision guardrails', 'Garde-fous de décision', 'ضوابط القرار')}</div>{result.warnings.slice(0, 5).map((warning) => <div key={warning}>• {warningLabel(language, warning)}</div>)}</div>}
  </div>;
}

function IpmCompliancePanel({ language }: { language: Language }) {
  const [cropId, setCropId] = useState('tomato');
  const [problemId, setProblemId] = useState('tuta');
  const [observed, setObserved] = useState(8);
  const [threshold, setThreshold] = useState(5);
  const [daysToHarvest, setDaysToHarvest] = useState(14);
  const [selectedActive, setSelectedActive] = useState('');
  const [windSafe, setWindSafe] = useState(true);
  const [labelVerified, setLabelVerified] = useState(false);
  const [lastMode, setLastMode] = useState('');
  const problem = PLANT_PROBLEMS.find((entry) => entry.id === problemId);
  const availableProblems = PLANT_PROBLEMS.filter((entry) => entry.crops.includes(cropId) || entry.type === 'weed').slice(0, 40);
  const review = useMemo(() => buildIpmComplianceReview({ cropId, problemType: problem?.type ?? 'pest', problemId, observedLevelPct: observed, actionThresholdPct: threshold, daysToHarvest, selectedActiveMatterId: selectedActive || undefined, windSafe, labelVerified, lastModeOfAction: lastMode || undefined }), [cropId, problem?.type, problemId, observed, threshold, daysToHarvest, selectedActive, windSafe, labelVerified, lastMode]);
  useEffect(() => { if (!availableProblems.some((entry) => entry.id === problemId)) { setProblemId(availableProblems[0]?.id ?? ''); setSelectedActive(''); } }, [availableProblems, problemId]);
  useEffect(() => { if (!selectedActive && review.matchedActives[0]) setSelectedActive(review.matchedActives[0].id); }, [review.matchedActives, selectedActive]);
  const statusTone = review.decision === 'hold' ? 'danger' : review.decision === 'review-treatment' ? 'warn' : 'good';
  const checkLabels: Record<string, string> = {
    registered: copy(language, 'Registered', 'Homologué', 'مسجل'),
    cropListed: copy(language, 'Crop listed', 'Culture autorisée', 'المحصول مدرج'),
    labelVerified: copy(language, 'Label verified', 'Étiquette vérifiée', 'الملصق متحقق منه'),
    windSafe: copy(language, 'Weather window', 'Fenêtre météo', 'نافذة الطقس'),
    resistanceRotationNeeded: copy(language, 'Resistance rotation clear', 'Rotation des modes', 'تناوب المقاومة سليم'),
    harvestWindowSafe: copy(language, 'Harvest interval safe', 'Délai avant récolte', 'فترة ما قبل الحصاد آمنة'),
  };
  return <div className="space-y-4">
    <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100"><div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><p>{copy(language, 'Compliance assistant, not a spray prescription. Verify current INPV authorization and the product label before use.', 'Assistant de conformité, pas une prescription. Vérifiez l’homologation INPV actuelle et l’étiquette avant usage.', 'مساعد امتثال وليس وصفة رش. تحقق من ترخيص INPV الحالي وملصق المنتج قبل الاستعمال.')}</p></div></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="space-y-1.5"><span className="text-xs font-medium text-muted-foreground">{copy(language, 'Crop', 'Culture', 'المحصول')}</span><select className={inputClass} value={cropId} onChange={(event) => { setCropId(event.target.value); setSelectedActive(''); }}>{ALGERIA_CROPS.slice(0, 20).map((crop) => <option key={crop.id} value={crop.id}>{crop.emoji} {crop.name}</option>)}</select></label>
      <label className="space-y-1.5"><span className="text-xs font-medium text-muted-foreground">{copy(language, 'Observed problem', 'Problème observé', 'المشكلة المرصودة')}</span><select className={inputClass} value={problemId} onChange={(event) => { setProblemId(event.target.value); setSelectedActive(''); }}>{availableProblems.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
      <NumberInput label={copy(language, 'Observed pressure', 'Pression observée', 'الضغط المرصود')} suffix="%" value={observed} onChange={setObserved} min={0} max={100} />
      <NumberInput label={copy(language, 'Action threshold', 'Seuil d’intervention', 'عتبة التدخل')} suffix="%" value={threshold} onChange={setThreshold} min={0} max={100} />
      <NumberInput label={copy(language, 'Days to harvest', 'Jours avant récolte', 'أيام قبل الحصاد')} suffix={copy(language, 'days', 'jours', 'يوم')} value={daysToHarvest} onChange={setDaysToHarvest} min={0} />
      <label className="space-y-1.5"><span className="text-xs font-medium text-muted-foreground">{copy(language, 'Candidate active matter', 'Substance active candidate', 'المادة الفعالة المرشحة')}</span><select className={inputClass} value={selectedActive} onChange={(event) => setSelectedActive(event.target.value)}><option value="">{copy(language, 'No treatment selected', 'Aucun traitement sélectionné', 'لم يتم اختيار معالجة')}</option>{review.matchedActives.map((active) => <option key={active.id} value={active.id}>{active.activeSubstance} · {active.name}</option>)}</select></label>
      <label className="space-y-1.5"><span className="text-xs font-medium text-muted-foreground">{copy(language, 'Last mode of action', 'Dernier mode d’action', 'آخر آلية تأثير')}</span><input className={inputClass} value={lastMode} onChange={(event) => setLastMode(event.target.value)} placeholder="e.g. IRAC 6" /></label>
      <div className="flex flex-col justify-end gap-2 text-xs"><label className="flex items-center gap-2"><input type="checkbox" checked={windSafe} onChange={(event) => setWindSafe(event.target.checked)} /> {copy(language, 'Weather window is acceptable', 'La fenêtre météo est acceptable', 'نافذة الطقس مناسبة')}</label><label className="flex items-center gap-2"><input type="checkbox" checked={labelVerified} onChange={(event) => setLabelVerified(event.target.checked)} /> {copy(language, 'Label and authorization verified', 'Étiquette et homologation vérifiées', 'تم التحقق من الملصق والترخيص')}</label></div>
    </div>
    <div className="flex flex-wrap items-center gap-2"><StatusPill tone={statusTone}>{copy(language, 'Decision', 'Décision', 'القرار')}: {statusLabel(language, review.decision)}</StatusPill><StatusPill tone={review.urgency === 'high' ? 'danger' : review.urgency === 'medium' ? 'warn' : 'good'}>{copy(language, 'Urgency', 'Urgence', 'الأولوية')}: {statusLabel(language, review.urgency)}</StatusPill><StatusPill>{copy(language, 'Problem', 'Problème', 'المشكلة')}: {review.problemName}</StatusPill></div>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(review.complianceChecks).map(([key, value]) => <div key={key} className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-xs"><span className="text-muted-foreground">{checkLabels[key] ?? key}</span>{value ? <CheckCircle2 aria-label={copy(language, 'Pass', 'Conforme', 'ناجح')} className="h-4 w-4 text-emerald-600" /> : <AlertTriangle aria-label={copy(language, 'Review', 'À vérifier', 'يحتاج مراجعة')} className="h-4 w-4 text-amber-600" />}</div>)}</div>
    {review.selectedActiveMatter && <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs"><div className="font-semibold">{review.selectedActiveMatter.activeSubstance} · {review.selectedActiveMatter.name}</div><div className="mt-1 text-muted-foreground">{review.selectedActiveMatter.applicationRate} · {copy(language, 'PHI/DAR', 'DAR/PHI', 'DAR/PHI')}: {review.selectedActiveMatter.preHarvestInterval} · {copy(language, 'Mode', 'Mode', 'الآلية')}: {review.selectedActiveMatter.resistanceCode ?? copy(language, 'verify on label', 'vérifier sur l’étiquette', 'تحقق من الملصق')} · {copy(language, 'Source', 'Source', 'المصدر')}: {review.selectedActiveMatter.source}</div></div>}
    {review.warnings.length > 0 && <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> {copy(language, 'Review queue', 'File de vérification', 'قائمة المراجعة')}</div>{review.warnings.map((warning) => <div key={warning}>• {warningLabel(language, warning)}</div>)}</div>}
  </div>;
}

function ScenarioLabPanel({ language }: { language: Language }) {
  const profiles = getSimulatorCropProfiles();
  const [scenario, setScenario] = useState<SimulatorScenario>(() => createDefaultSimulatorScenario('wheat'));
  const [drought, setDrought] = useState(25);
  const [salinity, setSalinity] = useState(15);
  const [market, setMarket] = useState(-20);
  const [inflation, setInflation] = useState(20);
  const lab = useMemo(() => calculateScenarioLab({ scenario, droughtPct: drought, salinityYieldLossPct: salinity, marketPriceChangePct: market, inputInflationPct: inflation }), [scenario, drought, salinity, market, inflation]);
  const updateScenario = (patch: Partial<SimulatorScenario>) => setScenario((current) => ({ ...current, ...patch }));
  const variantLabels: Record<string, string> = {
    baseline: copy(language, 'Baseline', 'Référence', 'خط الأساس'),
    drought: copy(language, 'Drought stress', 'Stress hydrique', 'إجهاد الجفاف'),
    salinity: copy(language, 'Salinity stress', 'Stress salin', 'إجهاد الملوحة'),
    market: copy(language, 'Market shock', 'Choc du marché', 'صدمة السوق'),
    compound: copy(language, 'Compound shock', 'Choc combiné', 'الصدمة المركبة'),
  };
  return <div className="space-y-4">
    <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 text-sm text-violet-950 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-100"><div className="flex items-start gap-2"><Sparkles className="mt-0.5 h-4 w-4 shrink-0" /><p>{copy(language, 'Transparent scenario lab: compare baseline with shocks and show the impact on yield, margin, and price.', 'Laboratoire transparent : compare le scénario de référence aux chocs et montre leur effet sur le rendement, la marge et le prix.', 'مختبر سيناريوهات شفاف: يقارن خط الأساس بالصدمات ويظهر أثرها على الإنتاج والهامش والسعر.')}</p></div></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="space-y-1.5"><span className="text-xs font-medium text-muted-foreground">{copy(language, 'Crop', 'Culture', 'المحصول')}</span><select className={inputClass} value={scenario.cropId} onChange={(event) => setScenario(createDefaultSimulatorScenario(event.target.value))}>{profiles.map((profile) => <option key={profile.cropId} value={profile.cropId}>{profile.emoji} {profile.cropName}</option>)}</select></label>
      <NumberInput label={copy(language, 'Area', 'Superficie', 'المساحة')} suffix="ha" value={scenario.areaHa} onChange={(value) => updateScenario({ areaHa: value })} step={0.1} />
      <NumberInput label={copy(language, 'Expected yield', 'Rendement attendu', 'المردود المتوقع')} suffix="t/ha" value={scenario.expectedYieldTPerHa} onChange={(value) => updateScenario({ expectedYieldTPerHa: value })} step={0.1} />
      <NumberInput label={copy(language, 'Expected price', 'Prix attendu', 'السعر المتوقع')} suffix="DZD/t" value={scenario.expectedPricePerT} onChange={(value) => updateScenario({ expectedPricePerT: value })} step={500} />
      <NumberInput label={copy(language, 'Drought loss', 'Perte liée à la sécheresse', 'خسارة الجفاف')} suffix="%" value={drought} onChange={setDrought} min={0} max={90} />
      <NumberInput label={copy(language, 'Salinity loss', 'Perte liée à la salinité', 'خسارة الملوحة')} suffix="%" value={salinity} onChange={setSalinity} min={0} max={90} />
      <NumberInput label={copy(language, 'Market price change', 'Variation du prix du marché', 'تغير سعر السوق')} suffix="%" value={market} onChange={setMarket} min={-90} max={200} />
      <NumberInput label={copy(language, 'Input inflation', 'Inflation des intrants', 'تضخم المدخلات')} suffix="%" value={inflation} onChange={setInflation} min={0} max={300} />
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label={copy(language, 'Resilience score', 'Score de résilience', 'درجة المرونة')} value={`${lab.resilienceScore}/100`} tone={lab.resilienceScore >= 70 ? 'good' : lab.resilienceScore >= 40 ? 'warn' : 'danger'} /><Metric label={copy(language, 'Baseline net margin', 'Marge nette de référence', 'الهامش الصافي الأساسي')} value={formatSimulatorDzd(lab.variants[0].result.netMargin)} /><Metric label={copy(language, 'Most exposed case', 'Cas le plus exposé', 'الحالة الأكثر تعرضاً')} value={variantLabels[lab.mostExposedVariant.id]} tone="danger" /><Metric label={copy(language, 'Worst margin delta', 'Pire variation de marge', 'أسوأ تغير في الهامش')} value={formatSimulatorDzd(lab.mostExposedVariant.deltaNetMarginDzd)} tone="danger" /></div>
    <div className="overflow-x-auto rounded-xl border border-border/70"><table className="min-w-[640px] w-full text-left text-xs"><caption className="sr-only">{copy(language, 'Scenario comparison', 'Comparaison des scénarios', 'مقارنة السيناريوهات')}</caption><thead className="bg-muted/50 text-muted-foreground"><tr><th scope="col" className="p-3">{copy(language, 'Scenario', 'Scénario', 'السيناريو')}</th><th scope="col" className="p-3">{copy(language, 'Yield', 'Rendement', 'المردود')}</th><th scope="col" className="p-3">{copy(language, 'Net margin', 'Marge nette', 'الهامش الصافي')}</th><th scope="col" className="p-3">{copy(language, 'Break-even price', 'Prix d’équilibre', 'سعر التعادل')}</th><th scope="col" className="p-3">{copy(language, 'Delta', 'Écart', 'الفارق')}</th></tr></thead><tbody>{lab.variants.map((variant) => <tr key={variant.id} className="border-t border-border/60"><td className="p-3 font-semibold">{variantLabels[variant.id]}</td><td className="p-3">{variant.result.totalYieldT.toFixed(2)} t</td><td className="p-3">{formatSimulatorDzd(variant.result.netMargin)}</td><td className="p-3">{formatSimulatorDzd(variant.result.breakEvenPricePerT)}/t</td><td className={`p-3 font-semibold ${variant.deltaNetMarginDzd < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatSimulatorDzd(variant.deltaNetMarginDzd)}</td></tr>)}</tbody></table></div>
    <div className="text-[11px] text-muted-foreground">{copy(language, 'All prices are editable DZD planning assumptions, not quotations. Validate market and input prices locally before making a financial decision.', 'Tous les prix sont des hypothèses modifiables en DZD, pas des cotations. Vérifiez localement les prix du marché et des intrants avant toute décision financière.', 'كل الأسعار افتراضات تخطيطية قابلة للتعديل بالدينار وليست عروض أسعار. تحقق من أسعار السوق والمدخلات محلياً قبل اتخاذ قرار مالي.')}</div>
  </div>;
}

function CasebookPanel({ language }: { language: Language }) {
  const [records, setRecords] = useState<FieldRecord[]>([]);
  const [fieldName, setFieldName] = useState('');
  const [crop, setCrop] = useState('');
  const [kind, setKind] = useState<FieldRecordKind>('decision');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [amount, setAmount] = useState(0);
  useEffect(() => { setRecords(buildFieldRecordTimeline()); }, []);
  const stats = useMemo(() => getFieldRecordBookStats(records), [records]);
  const refresh = () => setRecords(buildFieldRecordTimeline());
  const save = (event: FormEvent) => { event.preventDefault(); if (!fieldName.trim() || !title.trim() || !summary.trim()) return; appendManualFieldRecord({ fieldName, crop, date: new Date().toISOString().slice(0, 10), kind, title, summary, amountDzd: amount > 0 ? amount : undefined }); setFieldName(''); setTitle(''); setSummary(''); setAmount(0); refresh(); };
  return <div className="space-y-4">
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"><div className="flex items-start gap-2"><ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0" /><p>{copy(language, 'Replayable evidence record: observations, decisions, tests, satellite checks, and actions in one timeline.', 'Dossier rejouable : observations, décisions, analyses, contrôles satellite et actions dans une seule chronologie.', 'سجل أدلة قابل لإعادة التشغيل: يجمع الملاحظات والقرارات والتحاليل والاستشعار والأعمال في خط زمني واحد.')}</p></div></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Metric label={copy(language, 'Records', 'Enregistrements', 'السجلات')} value={String(stats.total)} /><Metric label={copy(language, 'Fields', 'Parcelles', 'الحقول')} value={String(stats.fields)} /><Metric label={copy(language, 'Observations', 'Observations', 'الملاحظات')} value={String(stats.observations)} /><Metric label={copy(language, 'Linked sources', 'Sources liées', 'المصادر المرتبطة')} value={String(stats.linkedSources)} /><Metric label={copy(language, 'Tracked DZD', 'DZD suivis', 'الدينار المتتبع')} value={stats.totalAmountDzd.toLocaleString()} /></div>
    <form onSubmit={save} className={`${panelClass} grid gap-3 sm:grid-cols-2 lg:grid-cols-3`}><div className="sm:col-span-2 lg:col-span-3 flex items-center justify-between"><div className="text-sm font-semibold">{copy(language, 'Add a professional record', 'Ajouter un enregistrement professionnel', 'أضف سجلاً احترافياً')}</div><button type="button" onClick={refresh} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted"><RefreshCw className="h-3.5 w-3.5" /> {copy(language, 'Refresh', 'Actualiser', 'تحديث')}</button></div><label className="space-y-1.5"><span className="text-xs text-muted-foreground">{copy(language, 'Field', 'Parcelle', 'الحقل')}</span><input className={inputClass} value={fieldName} onChange={(event) => setFieldName(event.target.value)} placeholder={copy(language, 'El Oued block A', 'Bloc A à El Oued', 'القطعة A في الوادي')} /></label><label className="space-y-1.5"><span className="text-xs text-muted-foreground">{copy(language, 'Crop', 'Culture', 'المحصول')}</span><input className={inputClass} value={crop} onChange={(event) => setCrop(event.target.value)} placeholder={copy(language, 'Date palm', 'Palmier dattier', 'نخيل التمر')} /></label><label className="space-y-1.5"><span className="text-xs text-muted-foreground">{copy(language, 'Record type', 'Type d’enregistrement', 'نوع السجل')}</span><select className={inputClass} value={kind} onChange={(event) => setKind(event.target.value as FieldRecordKind)}><option value="observation">{copy(language, 'Observation', 'Observation', 'ملاحظة')}</option><option value="decision">{copy(language, 'Decision', 'Décision', 'قرار')}</option><option value="input">{copy(language, 'Input', 'Intrant', 'مدخل')}</option><option value="irrigation">{copy(language, 'Irrigation', 'Irrigation', 'ري')}</option><option value="harvest">{copy(language, 'Harvest', 'Récolte', 'حصاد')}</option><option value="note">{copy(language, 'Note', 'Note', 'مذكرة')}</option></select></label><label className="space-y-1.5"><span className="text-xs text-muted-foreground">{copy(language, 'Title', 'Titre', 'العنوان')}</span><input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={copy(language, 'Salinity check', 'Contrôle de salinité', 'فحص الملوحة')} /></label><label className="space-y-1.5"><span className="text-xs text-muted-foreground">{copy(language, 'DZD amount', 'Montant en DZD', 'المبلغ بالدينار')}</span><input className={inputClass} type="number" min={0} value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></label><label className="space-y-1.5 sm:col-span-2"><span className="text-xs text-muted-foreground">{copy(language, 'Evidence summary', 'Résumé des preuves', 'ملخص الأدلة')}</span><textarea className="min-h-10 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder={copy(language, 'What was observed, decided, or applied?', 'Qu’avez-vous observé, décidé ou appliqué ?', 'ما الذي تمت ملاحظته أو اتخاذ قرار بشأنه أو تطبيقه؟')} /></label><div className="sm:col-span-2 lg:col-span-3"><button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700" type="submit">{copy(language, 'Save evidence record', 'Enregistrer la preuve', 'حفظ سجل الدليل')}</button></div></form>
    <div className="space-y-2">{records.slice(0, 12).map((record) => <div key={record.id} className="flex gap-3 rounded-xl border border-border/70 p-3"><div className="mt-0.5 rounded-lg bg-muted p-2"><Activity className="h-4 w-4 text-emerald-600" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold">{record.title}</span><StatusPill>{record.source}</StatusPill><StatusPill>{statusLabel(language, record.kind)}</StatusPill></div><div className="mt-1 text-xs text-muted-foreground">{record.fieldName}{record.crop ? ` · ${record.crop}` : ''} · {dateLabel(language, record.timestamp)}</div><div className="mt-1 text-sm">{record.summary}</div></div></div>)}{records.length === 0 && <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{copy(language, 'No evidence records yet. Add the first field decision above.', 'Aucune preuve pour le moment. Ajoutez la première décision de parcelle ci-dessus.', 'لا توجد سجلات أدلة بعد. أضف أول قرار حقلي أعلاه.')}</div>}</div>
  </div>;
}

type Mission = { id: string; field: string; task: string; priority: 'low' | 'medium' | 'high'; status: 'queued' | 'done'; note: string; updatedAt: number };
const MISSIONS_KEY = 'formula-atlas-professional-missions-v1';

function FieldMissionsPanel({ language }: { language: Language }) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [field, setField] = useState('');
  const [task, setTask] = useState('');
  const [priority, setPriority] = useState<Mission['priority']>('medium');
  const [note, setNote] = useState('');
  const [online, setOnline] = useState(true);
  useEffect(() => { try { const raw = localStorage.getItem(MISSIONS_KEY); if (raw) setMissions(JSON.parse(raw) as Mission[]); } catch { /* local-first fallback */ } setOnline(navigator.onLine); const onChange = () => setOnline(navigator.onLine); window.addEventListener('online', onChange); window.addEventListener('offline', onChange); return () => { window.removeEventListener('online', onChange); window.removeEventListener('offline', onChange); }; }, []);
  const persist = (next: Mission[]) => { setMissions(next); try { localStorage.setItem(MISSIONS_KEY, JSON.stringify(next)); } catch { /* keep in memory */ } };
  const add = (event: FormEvent) => { event.preventDefault(); if (!field.trim() || !task.trim()) return; persist([{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, field: field.trim(), task: task.trim(), priority, status: 'queued', note: note.trim(), updatedAt: Date.now() }, ...missions]); setTask(''); setNote(''); };
  const pending = missions.filter((mission) => mission.status === 'queued').length;
  return <div className="space-y-4">
    <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100"><div className="flex items-start gap-2">{online ? <Wifi className="mt-0.5 h-4 w-4 shrink-0" /> : <CloudOff className="mt-0.5 h-4 w-4 shrink-0" />}<p>{copy(language, 'Local-first mission queue: create work offline, execute it in the field, and keep notes until a synchronization connector is configured.', 'File de missions locale : créez le travail hors ligne, exécutez-le sur le terrain et conservez les notes jusqu’à la configuration d’un connecteur de synchronisation.', 'قائمة مهام محلية أولاً: أنشئ المهمة دون اتصال، نفذها في الحقل، واحتفظ بالملاحظات حتى يتم إعداد موصل المزامنة.')}</p></div></div>
    <div className="grid gap-3 sm:grid-cols-3"><Metric label={copy(language, 'Connection', 'Connexion', 'الاتصال')} value={online ? copy(language, 'Online', 'En ligne', 'متصل') : copy(language, 'Offline', 'Hors ligne', 'غير متصل')} tone={online ? 'good' : 'warn'} /><Metric label={copy(language, 'Queued missions', 'Missions en attente', 'المهام المنتظرة')} value={String(pending)} tone={pending > 0 ? 'warn' : 'good'} /><Metric label={copy(language, 'Completed', 'Terminées', 'المكتملة')} value={String(missions.filter((mission) => mission.status === 'done').length)} /></div>
    <form onSubmit={add} className={`${panelClass} grid gap-3 sm:grid-cols-2 lg:grid-cols-4`}><label className="space-y-1.5"><span className="text-xs text-muted-foreground">{copy(language, 'Field / farmer', 'Parcelle / agriculteur', 'الحقل / الفلاح')}</span><input className={inputClass} value={field} onChange={(event) => setField(event.target.value)} placeholder={copy(language, 'El Oued block A', 'Bloc A à El Oued', 'القطعة A في الوادي')} /></label><label className="space-y-1.5"><span className="text-xs text-muted-foreground">{copy(language, 'Task', 'Tâche', 'المهمة')}</span><input className={inputClass} value={task} onChange={(event) => setTask(event.target.value)} placeholder={copy(language, 'Check irrigation line 3', 'Vérifier la ligne d’irrigation 3', 'افحص خط الري 3')} /></label><label className="space-y-1.5"><span className="text-xs text-muted-foreground">{copy(language, 'Priority', 'Priorité', 'الأولوية')}</span><select className={inputClass} value={priority} onChange={(event) => setPriority(event.target.value as Mission['priority'])}><option value="low">{statusLabel(language, 'low')}</option><option value="medium">{statusLabel(language, 'medium')}</option><option value="high">{statusLabel(language, 'high')}</option></select></label><label className="space-y-1.5"><span className="text-xs text-muted-foreground">{copy(language, 'Evidence note', 'Note de preuve', 'ملاحظة الدليل')}</span><input className={inputClass} value={note} onChange={(event) => setNote(event.target.value)} placeholder={copy(language, 'Voice/photo note summary', 'Résumé d’une note vocale/photo', 'ملخص ملاحظة صوتية/صورة')} /></label><div className="sm:col-span-2 lg:col-span-4"><button type="submit" className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">{copy(language, 'Queue field mission', 'Mettre en file la mission', 'إضافة مهمة حقلية')}</button></div></form>
    <div className="space-y-2">{missions.map((mission) => <div key={mission.id} className="flex items-start gap-3 rounded-xl border border-border/70 p-3"><button type="button" onClick={() => persist(missions.map((entry) => entry.id === mission.id ? { ...entry, status: entry.status === 'done' ? 'queued' : 'done', updatedAt: Date.now() } : entry))} className="mt-0.5 rounded-lg p-1 hover:bg-muted" aria-label={mission.status === 'done' ? copy(language, 'Reopen mission', 'Rouvrir la mission', 'إعادة فتح المهمة') : copy(language, 'Complete mission', 'Terminer la mission', 'إكمال المهمة')}>{mission.status === 'done' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <span aria-hidden="true" className="block h-5 w-5 rounded-full border-2 border-sky-500" />}</button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`text-sm font-semibold ${mission.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{mission.task}</span><StatusPill tone={mission.priority === 'high' ? 'danger' : mission.priority === 'medium' ? 'warn' : 'neutral'}>{statusLabel(language, mission.priority)}</StatusPill><StatusPill>{statusLabel(language, mission.status)}</StatusPill></div><div className="mt-1 text-xs text-muted-foreground">{mission.field}{mission.note ? ` · ${mission.note}` : ''}</div></div></div>)}{missions.length === 0 && <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{copy(language, 'No field missions queued yet.', 'Aucune mission terrain en attente.', 'لا توجد مهام حقلية منتظرة بعد.')}</div>}</div>
  </div>;
}

export function ProfessionalToolsHub({ onOpenTool }: { onOpenTool?: (tab: TabId, storageKey?: string) => void } = {}) {
  const { language, isRTL } = useTranslation();
  const [activeTool, setActiveTool] = useState<ProfessionalToolId>('water-salinity');
  const panel = activeTool === 'water-salinity' ? <WaterSalinityPanel language={language} /> : activeTool === 'ipm-compliance' ? <IpmCompliancePanel language={language} /> : activeTool === 'scenario-lab' ? <ScenarioLabPanel language={language} /> : activeTool === 'casebook' ? <CasebookPanel language={language} /> : activeTool === 'field-missions' ? <FieldMissionsPanel language={language} /> : <SoilEvidenceWorkbench onOpenTool={onOpenTool} />;
  return <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-4" data-professional-tools-hub>
    <div className="grid gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-sky-50 p-4 dark:border-emerald-900 dark:from-emerald-950/40 dark:to-sky-950/30 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex items-center gap-2 text-sm font-bold"><Tractor className="h-4 w-4 text-emerald-600" /> {copy(language, 'Professional operating system', 'Système d’exploitation professionnel', 'نظام التشغيل الاحترافي')}</div><p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">{copy(language, 'Six connected workspaces for decisions, compliance, scenarios, soil evidence, and field execution. Outputs are local-first, explainable, and designed for Algerian DZD and phytosanitary workflows.', 'Six espaces connectés pour les décisions, la conformité, les scénarios, les preuves sol et l’exécution terrain. Les résultats sont locaux, explicables et conçus pour les workflows algériens en DZD et phytosanitaires.', 'ست مساحات مترابطة للقرارات والامتثال والسيناريوهات وأدلة التربة والتنفيذ الحقلي. النتائج محلية وقابلة للتفسير ومصممة لسير العمل الجزائري بالدينار والصحة النباتية.')}</p></div><StatusPill tone="good">{copy(language, 'Professional mode', 'Mode professionnel', 'الوضع الاحترافي')}</StatusPill></div>
    <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={copy(language, 'Professional tools', 'Outils professionnels', 'الأدوات الاحترافية')}>{TOOL_IDS.map((id) => <button key={id} type="button" role="tab" aria-selected={activeTool === id} aria-controls={`professional-panel-${id}`} onClick={() => setActiveTool(id)} className={`flex min-w-[170px] items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${activeTool === id ? 'border-emerald-500 bg-emerald-600 text-white shadow-sm' : 'border-border/70 bg-card hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30'}`}><span className="rounded-lg bg-white/15 p-1.5" aria-hidden="true">{id === 'water-salinity' ? <Droplets className="h-4 w-4" /> : id === 'ipm-compliance' ? <ShieldCheck className="h-4 w-4" /> : id === 'scenario-lab' ? <Sparkles className="h-4 w-4" /> : id === 'casebook' ? <ClipboardCheck className="h-4 w-4" /> : id === 'field-missions' ? <CloudOff className="h-4 w-4" /> : <FlaskConical className="h-4 w-4" />}</span>{getProfessionalToolLabel(id, language)}</button>)}</div>
    <div id={`professional-panel-${activeTool}`} role="tabpanel" aria-live="polite" className="min-w-0">{panel}</div>
  </div>;
}
