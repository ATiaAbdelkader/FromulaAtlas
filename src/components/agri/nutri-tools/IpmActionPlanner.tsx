'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Bug, CheckCircle2, ClipboardList, Leaf, Printer, ShieldCheck, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { copyFor, useTranslation } from '@/lib/language-store';
import {
  calculateIpmPlan,
  type IpmControlMethod,
  type IpmPlannerInput,
  type IpmTargetType,
} from '@/lib/ipm-action-planner';

const TARGET_TYPE_AR: Record<IpmTargetType, string> = {
  insect: 'حشرة',
  disease: 'مرض',
  weed: 'عشبة ضارة',
};

const TARGET_TYPE_FR: Record<IpmTargetType, string> = {
  insect: 'Insecte',
  disease: 'Maladie',
  weed: 'Adventice',
};

const METHOD_COPY: Record<IpmControlMethod, { en: string; ar: string; fr: string }> = {
  cultural: { en: 'Cultural', ar: 'زراعية', fr: 'Culturale' },
  mechanical: { en: 'Mechanical', ar: 'ميكانيكية', fr: 'Mécanique' },
  biological: { en: 'Biological', ar: 'حيوية', fr: 'Biologique' },
  chemical: { en: 'Chemical', ar: 'كيميائية', fr: 'Chimique' },
};

const CONTROL_ICONS: Record<IpmControlMethod, typeof Leaf> = {
  cultural: Leaf,
  mechanical: Target,
  biological: ShieldCheck,
  chemical: Bug,
};

const CONTROL_COLORS: Record<IpmControlMethod, string> = {
  cultural: 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20',
  mechanical: 'border-sky-200 bg-sky-50/50 dark:border-sky-900 dark:bg-sky-950/20',
  biological: 'border-violet-200 bg-violet-50/50 dark:border-violet-900 dark:bg-violet-950/20',
  chemical: 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20',
};

function numberValue(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function IpmActionPlanner() {
  const { language, isRTL } = useTranslation();
  const [fieldName, setFieldName] = useState('North Field');
  const [crop, setCrop] = useState('Tomato');
  const [targetName, setTargetName] = useState('Aphids');
  const [targetType, setTargetType] = useState<IpmTargetType>('insect');
  const [observedCount, setObservedCount] = useState('18');
  const [sampleCount, setSampleCount] = useState('10');
  const [actionThreshold, setActionThreshold] = useState('2');
  const [unit, setUnit] = useState('aphids/plant');
  const [cropValuePerHa, setCropValuePerHa] = useState('2400');
  const [controlCostPerHa, setControlCostPerHa] = useState('120');
  const [daysSinceScouting, setDaysSinceScouting] = useState('3');
  const [recentSeverity, setRecentSeverity] = useState<'info' | 'warning' | 'critical'>('warning');
  const [previousModesOfAction, setPreviousModesOfAction] = useState('4A, 4A');

  const input = useMemo<IpmPlannerInput>(() => ({
    fieldName,
    crop,
    targetName,
    targetType,
    observedCount: numberValue(observedCount),
    sampleCount: numberValue(sampleCount),
    actionThreshold: numberValue(actionThreshold),
    unit,
    cropValuePerHa: numberValue(cropValuePerHa),
    controlCostPerHa: numberValue(controlCostPerHa),
    daysSinceScouting: numberValue(daysSinceScouting),
    recentSeverity,
    previousModesOfAction: previousModesOfAction.split(',').map(mode => mode.trim()).filter(Boolean),
  }), [actionThreshold, controlCostPerHa, crop, cropValuePerHa, daysSinceScouting, fieldName, observedCount, previousModesOfAction, recentSeverity, sampleCount, targetName, targetType, unit]);

  const result = useMemo(() => calculateIpmPlan(input), [input]);

  const tr = (english: string, arabic: string, french?: string) => copyFor(language, english, arabic, french);
  const targetTypeLabel = language === 'ar' ? TARGET_TYPE_AR[targetType] : language === 'fr' ? TARGET_TYPE_FR[targetType] : targetType;
  const statusCopy = {
    monitor: { en: 'Monitor', ar: 'مراقبة', fr: 'Surveiller', color: '#10b981' },
    prepare: { en: 'Prepare controls', ar: 'استعد للمكافحة', fr: 'Préparer la lutte', color: '#f59e0b' },
    act: { en: 'Action threshold reached', ar: 'تم بلوغ عتبة التدخل', fr: 'Seuil d’action atteint', color: '#dc2626' },
  }[result.thresholdStatus];
  const priorityCopy = {
    routine: { en: 'Routine', ar: 'روتيني', fr: 'Routine' },
    watch: { en: 'Watch', ar: 'مراقبة مكثفة', fr: 'Surveillance' },
    urgent: { en: 'Urgent', ar: 'عاجل', fr: 'Urgent' },
  }[result.priority];

  function printPlan() {
    const title = tr('IPM Action Plan', 'خطة عمل الإدارة المتكاملة للآفات', 'Plan d’action de lutte intégrée');
    const html = `<!doctype html><html dir="${isRTL ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;max-width:850px;margin:40px auto;padding:0 24px;color:#17202a;line-height:1.6}h1{color:#166534}h2{border-bottom:1px solid #d1d5db;padding-bottom:6px}.meta,.item{border:1px solid #d1d5db;border-radius:10px;padding:12px;margin:10px 0}.label{color:#64748b;font-size:12px;text-transform:uppercase}.warning{background:#fff7ed;border:1px solid #fed7aa;padding:12px;border-radius:10px}ul{padding-inline-start:24px}</style></head><body><h1>${title}</h1><div class="meta"><strong>${fieldName}</strong> · ${crop} · ${targetName} (${targetTypeLabel})<br>${tr('Average density', 'الكثافة المتوسطة', 'Densité moyenne')}: ${result.averageDensity.toFixed(1)} ${unit}<br>${tr('Status', 'الحالة', 'Statut')}: ${statusCopy[language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en']}</div><h2>${tr('Next actions', 'الإجراءات التالية', 'Prochaines actions')}</h2><ul>${result.nextActions.map(action => `<li>${action}</li>`).join('')}</ul><h2>${tr('Control ladder', 'سُلّم المكافحة', 'Échelle de lutte')}</h2><ul>${result.controls.map(control => `<li><strong>${METHOD_COPY[control.method][language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en']}</strong>: ${control.recommended ? tr('Recommended for review', 'يوصى بمراجعته', 'À examiner') : tr('Not indicated yet', 'غير محدد بعد', 'Pas encore indiqué')}</li>`).join('')}</ul>${result.warnings.length ? `<div class="warning"><strong>${tr('Guardrails', 'ضوابط السلامة', 'Garde-fous')}</strong><ul>${result.warnings.map(warning => `<li>${warning}</li>`).join('')}</ul></div>` : ''}</body></html>`;
    const popup = window.open('', '_blank', 'noopener,noreferrer');
    if (!popup) return;
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'} className="overflow-hidden border-rose-200/70 shadow-sm dark:border-rose-900/60">
      <CardHeader className="border-b bg-gradient-to-r from-rose-50 via-background to-emerald-50/50 pb-4 dark:from-rose-950/30 dark:via-background dark:to-emerald-950/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><Bug className="h-4 w-4 text-rose-600" /> {tr('IPM Action Planner', 'مخطّط عمل الإدارة المتكاملة للآفات', 'Planificateur d’action de lutte intégrée')}</CardTitle>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{tr('Scouting evidence → action thresholds → lower-risk controls → responsible treatment review', 'أدلة الكشف ← عتبات التدخل ← وسائل المكافحة الأقل خطراً ← مراجعة المعالجة المسؤولة', 'Observations → seuils d’action → moyens à moindre risque → revue du traitement responsable')}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={printPlan} aria-label={tr('Print IPM action plan', 'طباعة خطة عمل الآفات', 'Imprimer le plan d’action')}><Printer className="me-1.5 h-3.5 w-3.5" />{tr('Print', 'طباعة', 'Imprimer')}</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-3">
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{tr('Field', 'الحقل', 'Parcelle')}</Label><Input value={fieldName} onChange={e => setFieldName(e.target.value)} className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{tr('Crop', 'المحصول', 'Culture')}</Label><Input value={crop} onChange={e => setCrop(e.target.value)} className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{tr('Target', 'الهدف', 'Cible')}</Label><Input value={targetName} onChange={e => setTargetName(e.target.value)} className="mt-1 h-10 text-sm" /></div>
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-3">
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{tr('Target type', 'نوع الهدف', 'Type de cible')}</Label><select value={targetType} onChange={e => setTargetType(e.target.value as IpmTargetType)} aria-label={tr('Target type', 'نوع الهدف', 'Type de cible')} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="insect">{tr('Insect', 'حشرة', 'Insecte')}</option><option value="disease">{tr('Disease', 'مرض', 'Maladie')}</option><option value="weed">{tr('Weed', 'عشبة ضارة', 'Adventice')}</option></select></div>
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{tr('Observed count', 'العدد المرصود', 'Nombre observé')}</Label><Input value={observedCount} onChange={e => setObservedCount(e.target.value)} type="number" min="0" step="1" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{tr('Samples', 'العينات', 'Échantillons')}</Label><Input value={sampleCount} onChange={e => setSampleCount(e.target.value)} type="number" min="1" step="1" className="mt-1 h-10 text-sm" /></div>
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{tr('Action threshold', 'عتبة التدخل', 'Seuil d’action')}</Label><Input value={actionThreshold} onChange={e => setActionThreshold(e.target.value)} type="number" min="0" step="0.1" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{tr('Unit', 'الوحدة', 'Unité')}</Label><Input value={unit} onChange={e => setUnit(e.target.value)} className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{tr('Days since scouting', 'أيام منذ الكشف', 'Jours depuis le suivi')}</Label><Input value={daysSinceScouting} onChange={e => setDaysSinceScouting(e.target.value)} type="number" min="0" step="1" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{tr('Recent severity', 'الخطورة الأخيرة', 'Gravité récente')}</Label><select value={recentSeverity} onChange={e => setRecentSeverity(e.target.value as typeof recentSeverity)} aria-label={tr('Recent severity', 'الخطورة الأخيرة', 'Gravité récente')} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="info">{tr('Info', 'معلومة', 'Info')}</option><option value="warning">{tr('Warning', 'تحذير', 'Alerte')}</option><option value="critical">{tr('Critical', 'حرج', 'Critique')}</option></select></div>
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-3">
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{tr('Crop value ($/ha)', 'قيمة المحصول ($/هكتار)', 'Valeur de la culture ($/ha)')}</Label><Input value={cropValuePerHa} onChange={e => setCropValuePerHa(e.target.value)} type="number" min="0" step="50" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{tr('Control cost ($/ha)', 'تكلفة المكافحة ($/هكتار)', 'Coût de lutte ($/ha)')}</Label><Input value={controlCostPerHa} onChange={e => setControlCostPerHa(e.target.value)} type="number" min="0" step="10" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{tr('Previous modes of action', 'أنماط التأثير السابقة', 'Modes d’action précédents')}</Label><Input value={previousModesOfAction} onChange={e => setPreviousModesOfAction(e.target.value)} placeholder="4A, 3A" className="mt-1 h-10 text-sm" /><p className="mt-1 text-[11px] text-muted-foreground">{tr('Comma-separated, newest last', 'افصل بينها بفواصل، والأحدث أخيراً', 'Séparés par des virgules, le plus récent en dernier')}</p></div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border p-4 text-center" style={{ borderColor: `${statusCopy.color}60`, backgroundColor: `${statusCopy.color}10` }}><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{tr('Decision status', 'حالة القرار', 'Statut de décision')}</div><div className="mt-1 text-lg font-bold" style={{ color: statusCopy.color }}>{statusCopy[language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en']}</div><div className="mt-1 text-xs text-muted-foreground">{result.averageDensity.toFixed(1)} / {numberValue(actionThreshold).toFixed(1)} {unit}</div></div>
          <div className="rounded-xl border bg-background p-4 text-center"><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{tr('Priority', 'الأولوية', 'Priorité')}</div><div className="mt-1 text-lg font-bold">{priorityCopy[language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en']}</div><div className="mt-1 text-xs text-muted-foreground">{tr('Threshold ratio', 'نسبة العتبة', 'Ratio du seuil')}: {(result.thresholdRatio * 100).toFixed(0)}%</div></div>
          <div className="rounded-xl border bg-background p-4 text-center"><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{tr('Economic exposure', 'التعرّض الاقتصادي', 'Exposition économique')}</div><div className="mt-1 text-lg font-bold">${result.economicExposurePerHa.toFixed(0)}/{tr('ha', 'هكتار', 'ha')}</div><div className="mt-1 text-xs text-muted-foreground">{result.scoutingDue ? tr('Scout soon', 'نفّذ الكشف قريباً', 'Suivi prochain') : tr('Routine interval', 'فاصل روتيني', 'Intervalle de routine')}</div></div>
        </div>

        <div className="rounded-xl border border-dashed bg-muted/20 p-3 text-sm leading-relaxed"><div className="flex items-start gap-2"><ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span><strong>{tr('Evidence summary:', 'ملخص الأدلة:', 'Résumé des éléments :')}</strong> {tr(`Average ${targetType} density is ${result.averageDensity.toFixed(1)} ${unit} against a threshold of ${numberValue(actionThreshold).toFixed(1)}.`, `متوسط كثافة ${targetTypeLabel} هو ${result.averageDensity.toFixed(1)} ${unit} مقابل عتبة قدرها ${numberValue(actionThreshold).toFixed(1)}.`, `La densité moyenne de ${targetTypeLabel.toLowerCase()} est de ${result.averageDensity.toFixed(1)} ${unit}, pour un seuil de ${numberValue(actionThreshold).toFixed(1)}.`)}</span></div></div>

        <div className="space-y-3"><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">{tr('Control ladder', 'سُلّم المكافحة', 'Échelle de lutte')}</h3><Badge variant="outline">{tr('Least-risk first', 'الأقل خطراً أولاً', 'Moins risqué d’abord')}</Badge></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{result.controls.map(control => { const Icon = CONTROL_ICONS[control.method]; const copy = METHOD_COPY[control.method]; return <div key={control.method} className={`rounded-xl border p-3 ${CONTROL_COLORS[control.method]}`}><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4" /> {copyFor(language, copy.en, copy.ar, copy.fr)}</div><Badge variant={control.recommended ? 'default' : 'secondary'}>{control.recommended ? tr('Review', 'مراجعة', 'À examiner') : tr('Hold', 'انتظار', 'Attendre')}</Badge></div><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{copyFor(language, control.rationale, control.method === 'cultural' ? 'استخدم النظافة والدورة الزراعية والأصناف المقاومة وإدارة الأعشاب أو الموائل لتقليل الضغط قبل المعالجة.' : control.method === 'mechanical' ? 'استخدم الإزالة أو المصائد أو العزل أو الإجراءات الفيزيائية المستهدفة حيثما كان ذلك عملياً.' : control.method === 'biological' ? 'احمِ الأعداء الطبيعية وفكّر في وسائل حيوية أو ميكروبية مستهدفة مناسبة للهدف المحدد.' : 'راجع الملصق المحلي ومرحلة المحصول وفترة الدخول وفترة ما قبل الحصاد والطقس وتناوب نمط التأثير قبل أي تطبيق.', control.method === 'cultural' ? 'Utiliser l’assainissement, la rotation, les variétés résistantes, la gestion des adventices ou des habitats.' : control.method === 'mechanical' ? 'Utiliser l’enlèvement, le piégeage, l’exclusion ou des actions physiques ciblées lorsque possible.' : control.method === 'biological' ? 'Protéger les auxiliaires et envisager des moyens biologiques ou microbiens adaptés à la cible.' : 'Vérifier l’étiquette locale, le stade, les délais, la météo et la rotation des modes d’action avant toute application.')}</p></div>; })}</div></div>

        <div className="space-y-3"><h3 className="text-sm font-semibold">{tr('Next actions', 'الإجراءات التالية', 'Prochaines actions')}</h3><div className="space-y-2">{result.nextActions.map((action, index) => <div key={`${action}-${index}`} className="flex items-start gap-2 rounded-lg border bg-background p-3 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>{copyFor(language, action, action.includes('positive sample') ? 'أدخل عدداً موجباً للعينات وعتبة تدخل من دليل محلي لإدارة المحصول.' : action.includes('Scout again') ? 'نفّذ كشفاً جديداً قريباً باستخدام طريقة أخذ العينات نفسها وسجّل الهدف والطور ومستوى الضرر.' : action.includes('routine scouting') ? 'واصل الكشف الروتيني وسجّل الملاحظات بانتظام لبناء سجل عتبات خاص بالحقل.' : action.includes('Prepare low-risk') ? 'جهّز وسائل المكافحة منخفضة المخاطر وتحقق من الهوية قبل تجاوز العتبة.' : action.includes('Confirm the action') ? 'أكد عتبة التدخل واستخدم وسيلة فعالة منخفضة المخاطر قبل التفكير في مبيد مستهدف.' : action.includes('Rotate away') ? 'تجنب نمط التأثير الأخير؛ لا تستخدم تطبيقاً ثالثاً متتالياً من المجموعة نفسها.' : 'أعد فحص الجدوى الاقتصادية: التعرّض المقدّر حالياً أقل من تكلفة المكافحة لكل هكتار.', action.includes('positive sample') ? 'Saisir un nombre d’échantillons positif et un seuil d’action issu d’un guide local.' : action.includes('Scout again') ? 'Effectuer bientôt un nouveau suivi avec la même méthode et noter la cible, le stade et les dégâts.' : action.includes('routine scouting') ? 'Poursuivre le suivi régulier et conserver les observations pour établir un seuil propre à la parcelle.' : action.includes('Prepare low-risk') ? 'Préparer les moyens à faible risque et confirmer l’identification avant le dépassement du seuil.' : action.includes('Confirm the action') ? 'Confirmer le seuil et utiliser un moyen efficace à moindre risque avant d’envisager un pesticide ciblé.' : action.includes('Rotate away') ? 'Écarter le dernier mode d’action et éviter une troisième application consécutive du même groupe.' : 'Revoir l’économie : l’exposition estimée est actuellement inférieure au coût de lutte par hectare.')}</span></div>)}</div></div>

        {result.warnings.length > 0 && <div className="space-y-2">{result.warnings.map((warning, index) => <div key={`${warning}-${index}`} className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{copyFor(language, warning, warning.includes('threshold signal') ? 'إشارة العتبة ليست وصفة مبيد: تحقق من الهوية والملصق والطقس ومعدات الوقاية وفترة ما قبل الحصاد وفترة الدخول والمتطلبات المحلية.' : warning.includes('same mode') ? 'تم تكرار نمط التأثير الأخير مرتين متتاليتين على الأقل؛ استخدم مجموعة مختلفة عند تبرير المعالجة.' : warning.includes('field name') ? 'أضف اسم الحقل حتى يمكن إسناد سجل الإجراء إلى الحقل الصحيح.' : warning.includes('Identify') ? 'حدد الآفة أو المرض أو العشبة الضارة قبل اختيار وسيلة المكافحة.' : warning.includes('Sample count') ? 'يجب أن يكون عدد العينات أكبر من صفر.' : 'استخدم عتبة تدخل موجبة من الإرشادات المحلية أو الإرشاد الزراعي.', warning.includes('threshold signal') ? 'Un signal de seuil n’est pas une prescription : vérifier l’identification, l’étiquette, la météo, les EPI, les délais et les exigences locales.' : warning.includes('same mode') ? 'Le dernier mode d’action a été répété au moins deux fois : alterner de groupe lorsqu’un traitement est justifié.' : warning.includes('field name') ? 'Ajouter un nom de parcelle pour attribuer correctement l’action.' : warning.includes('Identify') ? 'Identifier l’insecte, la maladie ou l’adventice avant de choisir un moyen de lutte.' : warning.includes('Sample count') ? 'Le nombre d’échantillons doit être supérieur à zéro.' : 'Utiliser un seuil d’action positif issu des recommandations locales.')}</span></div>)}</div>}

        <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50/60 p-3 text-xs leading-relaxed text-sky-800 dark:border-sky-900 dark:bg-sky-950/20 dark:text-sky-200"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><span>{tr('Safety note: this planner supports monitoring and decision preparation. It does not select a pesticide, rate, or legal use. Always follow the product label, local registration, PPE, re-entry interval, pre-harvest interval, weather restrictions, and qualified local advice.', 'ملاحظة السلامة: يدعم هذا المخطط المراقبة وإعداد القرار. لا يختار مبيداً أو جرعة أو استخداماً قانونياً. اتبع دائماً ملصق المنتج والتسجيل المحلي ومعدات الوقاية وفترة الدخول وفترة ما قبل الحصاد وقيود الطقس وإرشادات مختص محلي مؤهل.', 'Note de sécurité : ce planificateur aide au suivi et à la préparation de la décision. Il ne choisit ni produit, ni dose, ni usage légal. Suivre l’étiquette, l’homologation locale, les EPI, les délais, la météo et les conseils locaux qualifiés.')}</span></div>
      </CardContent>
    </Card>
  );
}
