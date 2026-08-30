'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle, Bug, CheckCircle2, ClipboardList, Copy, RotateCcw,
  Leaf, ShieldCheck, Target,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';
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

const TITLE: TrilingualString = {
  en: 'IPM Action Planner',
  ar: 'مخطّط عمل الإدارة المتكاملة للآفات',
  fr: 'Planificateur d’action de lutte intégrée',
};

const DESC: TrilingualString = {
  en: 'Scouting evidence → action thresholds → lower-risk controls → responsible treatment review',
  ar: 'أدلة الكشف ← عتبات التدخل ← وسائل المكافحة الأقل خطراً ← مراجعة المعالجة المسؤولة',
  fr: 'Observations → seuils d’action → moyens à moindre risque → revue du traitement responsable',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Safety: this planner supports monitoring and decision preparation. It does not select a pesticide, rate, or legal use. Always follow the product label, local registration, PPE, re-entry interval, pre-harvest interval, weather restrictions, and qualified local advice.',
  ar: 'ملاحظة السلامة: يدعم هذا المخطط المراقبة وإعداد القرار. لا يختار مبيداً أو جرعة أو استخداماً قانونياً. اتبع دائماً ملصق المنتج والتسجيل المحلي ومعدات الوقاية وفترة الدخول وفترة ما قبل الحصاد وقيود الطقس وإرشادات مختص محلي مؤهل.',
  fr: 'Note de sécurité : ce planificateur aide au suivi et à la préparation de la décision. Il ne choisit ni produit, ni dose, ni usage légal. Suivre l’étiquette, l’homologation locale, les EPI, les délais, la météo et les conseils locaux qualifiés.',
};

function numberValue(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function IpmActionPlanner() {
  const { language, isRTL } = useTranslation();
  const tr = (english: string, arabic: string, french?: string) => copyFor(language, english, arabic, french);

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
  const [copied, setCopied] = useState(false);

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

  const langKey = language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en';

  const handleReset = () => {
    setFieldName('North Field'); setCrop('Tomato'); setTargetName('Aphids');
    setTargetType('insect'); setObservedCount('18'); setSampleCount('10');
    setActionThreshold('2'); setUnit('aphids/plant'); setCropValuePerHa('2400');
    setControlCostPerHa('120'); setDaysSinceScouting('3'); setRecentSeverity('warning');
    setPreviousModesOfAction('4A, 4A');
    toast({ title: tr('Reset', 'إعادة', 'Réinitialiser') });
  };

  const handleCopy = () => {
    const lines = [
      '=== IPM ACTION PLAN ===',
      `Field: ${fieldName} · Crop: ${crop} · Target: ${targetName} (${targetType})`,
      `Density: ${result.averageDensity.toFixed(1)} ${unit} · Threshold: ${numberValue(actionThreshold).toFixed(1)} · Ratio: ${(result.thresholdRatio * 100).toFixed(0)}%`,
      `Status: ${statusCopy.en} · Priority: ${priorityCopy.en}`,
      `Economic exposure: $${result.economicExposurePerHa.toFixed(0)}/ha`,
      '',
      '-- Control ladder --',
      ...result.controls.map(c => `${METHOD_COPY[c.method].en}: ${c.recommended ? 'Review' : 'Hold'}`),
      '',
      '-- Next actions --',
      ...result.nextActions,
      '',
      '-- Guardrails --',
      ...result.warnings,
    ];
    navigator.clipboard?.writeText(lines.join('\n'));
    setCopied(true);
    toast({ title: tr('Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  const renderMethodRationale = (m: IpmControlMethod) => {
    if (m === 'cultural') return tr(
      'Use sanitation, crop rotation, resistant varieties, weed or habitat management to reduce pressure before treatment.',
      'استخدم النظافة والدورة الزراعية والأصناف المقاومة وإدارة الأعشاب أو الموائل لتقليل الضغط قبل المعالجة.',
      'Utiliser l’assainissement, la rotation, les variétés résistantes, la gestion des adventices ou des habitats.',
    );
    if (m === 'mechanical') return tr(
      'Use removal, trapping, exclusion, or targeted physical actions where practical.',
      'استخدم الإزالة أو المصائد أو العزل أو الإجراءات الفيزيائية المستهدفة حيثما كان ذلك عملياً.',
      'Utiliser l’enlèvement, le piégeage, l’exclusion ou des actions physiques ciblées lorsque possible.',
    );
    if (m === 'biological') return tr(
      'Protect natural enemies and consider biological or microbial agents suited to the target.',
      'احمِ الأعداء الطبيعية وفكّر في وسائل حيوية أو ميكروبية مستهدفة مناسبة للهدف المحدد.',
      'Protéger les auxiliaires et envisager des moyens biologiques ou microbiens adaptés à la cible.',
    );
    return tr(
      'Review local label, crop stage, re-entry interval, pre-harvest interval, weather, and mode-of-action rotation before any application.',
      'راجع الملصق المحلي ومرحلة المحصول وفترة الدخول وفترة ما قبل الحصاد والطقس وتناوب نمط التأثير قبل أي تطبيق.',
      'Vérifier l’étiquette locale, le stade, les délais, la météo et la rotation des modes d’action avant toute application.',
    );
  };

  const renderAction = (action: string) => {
    if (action.includes('positive sample')) return tr(
      action,
      'أدخل عدداً موجباً للعينات وعتبة تدخل من دليل محلي لإدارة المحصول.',
      'Saisir un nombre d’échantillons positif et un seuil d’action issu d’un guide local.',
    );
    if (action.includes('Scout again')) return tr(
      action,
      'نفّذ كشفاً جديداً قريباً باستخدام طريقة أخذ العينات نفسها وسجّل الهدف والطور ومستوى الضرر.',
      'Effectuer bientôt un nouveau suivi avec la même méthode et noter la cible, le stade et les dégâts.',
    );
    if (action.includes('routine scouting')) return tr(
      action,
      'واصل الكشف الروتيني وسجّل الملاحظات بانتظام لبناء سجل عتبات خاص بالحقل.',
      'Poursuivre le suivi régulier et conserver les observations pour établir un seuil propre à la parcelle.',
    );
    if (action.includes('Prepare low-risk')) return tr(
      action,
      'جهّز وسائل المكافحة منخفضة المخاطر وتحقق من الهوية قبل تجاوز العتبة.',
      'Préparer les moyens à faible risque et confirmer l’identification avant le dépassement du seuil.',
    );
    if (action.includes('Confirm the action')) return tr(
      action,
      'أكد عتبة التدخل واستخدم وسيلة فعالة منخفضة المخاطر قبل التفكير في مبيد مستهدف.',
      'Confirmer le seuil et utiliser un moyen efficace à moindre risque avant d’envisager un pesticide ciblé.',
    );
    if (action.includes('Rotate away')) return tr(
      action,
      'تجنب نمط التأثير الأخير؛ لا تستخدم تطبيقاً ثالثاً متتالياً من المجموعة نفسها.',
      'Écarter le dernier mode d’action et éviter une troisième application consécutive du même groupe.',
    );
    return tr(
      action,
      'أعد فحص الجدوى الاقتصادية: التعرّض المقدّر حالياً أقل من تكلفة المكافحة لكل هكتار.',
      'Revoir l’économie : l’exposition estimée est actuellement inférieure au coût de lutte par hectare.',
    );
  };

  const renderWarning = (warning: string) => {
    if (warning.includes('threshold signal')) return tr(
      warning,
      'إشارة العتبة ليست وصفة مبيد: تحقق من الهوية والملصق والطقس ومعدات الوقاية وفترة ما قبل الحصاد وفترة الدخول والمتطلبات المحلية.',
      'Un signal de seuil n’est pas une prescription : vérifier l’identification, l’étiquette, la météo, les EPI, les délais et les exigences locales.',
    );
    if (warning.includes('same mode')) return tr(
      warning,
      'تم تكرار نمط التأثير الأخير مرتين متتاليتين على الأقل؛ استخدم مجموعة مختلفة عند تبرير المعالجة.',
      'Le dernier mode d’action a été répété au moins deux fois : alterner de groupe lorsqu’un traitement est justifié.',
    );
    if (warning.includes('field name')) return tr(
      warning,
      'أضف اسم الحقل حتى يمكن إسناد سجل الإجراء إلى الحقل الصحيح.',
      'Ajouter un nom de parcelle pour attribuer correctement l’action.',
    );
    if (warning.includes('Identify')) return tr(
      warning,
      'حدد الآفة أو المرض أو العشبة الضارة قبل اختيار وسيلة المكافحة.',
      'Identifier l’insecte, la maladie ou l’adventice avant de choisir un moyen de lutte.',
    );
    if (warning.includes('Sample count')) return tr(
      warning,
      'يجب أن يكون عدد العينات أكبر من صفر.',
      'Le nombre d’échantillons doit être supérieur à zéro.',
    );
    return tr(
      warning,
      'استخدم عتبة تدخل موجبة من الإرشادات المحلية أو الإرشاد الزراعي.',
      'Utiliser un seuil d’action positif issu des recommandations locales.',
    );
  };

  return (
    <CalculatorShell
      icon={Bug}
      title={TITLE}
      description={DESC}
      accent="rose"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
          onClick: handleCopy,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      protocolNote={PROTOCOL_NOTE}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <Bug className="h-4 w-4 text-rose-600" />
              {tr('Scouting Inputs', 'مدخلات الكشف', 'Données d’observation')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <CalculatorShell.InputField
              label={tr('Field', 'الحقل', 'Parcelle')}
              value={fieldName}
              onChange={setFieldName}
              type="text"
            />
            <CalculatorShell.InputField
              label={tr('Crop', 'المحصول', 'Culture')}
              value={crop}
              onChange={setCrop}
              type="text"
            />
            <CalculatorShell.InputField
              label={tr('Target', 'الهدف', 'Cible')}
              value={targetName}
              onChange={setTargetName}
              type="text"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border bg-card space-y-1">
              <span className="text-xs font-bold text-foreground">{tr('Target type', 'نوع الهدف', 'Type de cible')}</span>
              <select value={targetType} onChange={e => setTargetType(e.target.value as IpmTargetType)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm font-mono font-bold">
                <option value="insect">{tr('Insect', 'حشرة', 'Insecte')}</option>
                <option value="disease">{tr('Disease', 'مرض', 'Maladie')}</option>
                <option value="weed">{tr('Weed', 'عشبة ضارة', 'Adventice')}</option>
              </select>
            </div>
            <CalculatorShell.InputField
              label={tr('Observed count', 'العدد المرصود', 'Nombre observé')}
              value={observedCount}
              onChange={setObservedCount}
              helper={tr('Across all samples', 'عبر كل العينات', 'Sur tous les échantillons')}
            />
            <CalculatorShell.InputField
              label={tr('Samples', 'العينات', 'Échantillons')}
              value={sampleCount}
              onChange={setSampleCount}
              helper={tr('Sample size', 'حجم العينة', 'Taille d’échantillon')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <CalculatorShell.InputField
              label={tr('Action threshold', 'عتبة التدخل', 'Seuil d’action')}
              value={actionThreshold}
              onChange={setActionThreshold}
              step="0.1"
            />
            <CalculatorShell.InputField
              label={tr('Unit', 'الوحدة', 'Unité')}
              value={unit}
              onChange={setUnit}
              type="text"
            />
            <CalculatorShell.InputField
              label={tr('Days since scouting', 'أيام منذ الكشف', 'Jours depuis le suivi')}
              value={daysSinceScouting}
              onChange={setDaysSinceScouting}
            />
            <div className="p-3 rounded-xl border bg-card space-y-1">
              <span className="text-xs font-bold text-foreground">{tr('Recent severity', 'الخطورة الأخيرة', 'Gravité récente')}</span>
              <select value={recentSeverity} onChange={e => setRecentSeverity(e.target.value as typeof recentSeverity)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm font-mono font-bold">
                <option value="info">{tr('Info', 'معلومة', 'Info')}</option>
                <option value="warning">{tr('Warning', 'تحذير', 'Alerte')}</option>
                <option value="critical">{tr('Critical', 'حرج', 'Critique')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <CalculatorShell.InputField
              label={tr('Crop value ($/ha)', 'قيمة المحصول ($/هكتار)', 'Valeur de la culture ($/ha)')}
              value={cropValuePerHa}
              onChange={setCropValuePerHa}
              step="50"
            />
            <CalculatorShell.InputField
              label={tr('Control cost ($/ha)', 'تكلفة المكافحة ($/هكتار)', 'Coût de lutte ($/ha)')}
              value={controlCostPerHa}
              onChange={setControlCostPerHa}
              step="10"
            />
            <CalculatorShell.InputField
              label={tr('Previous modes of action', 'أنماط التأثير السابقة', 'Modes d’action précédents')}
              value={previousModesOfAction}
              onChange={setPreviousModesOfAction}
              type="text"
              helper={tr('Comma-separated, newest last', 'افصل بينها بفواصل، والأحدث أخيراً', 'Séparés par des virgules, le plus récent en dernier')}
            />
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              ✨ {tr('Decision & Recommendations', 'القرار والتوصيات', 'Décision & recommandations')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border p-4 text-center" style={{ borderColor: `${statusCopy.color}60`, backgroundColor: `${statusCopy.color}10` }}>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{tr('Decision status', 'حالة القرار', 'Statut')}</div>
              <div className="mt-1 text-lg font-bold" style={{ color: statusCopy.color }}>{statusCopy[langKey]}</div>
              <div className="mt-1 text-xs text-muted-foreground">{result.averageDensity.toFixed(1)} / {numberValue(actionThreshold).toFixed(1)} {unit}</div>
            </div>
            <CalculatorShell.MetricTile
              label={tr('Priority', 'الأولوية', 'Priorité')}
              value={priorityCopy[langKey]}
              helper={`${tr('Threshold ratio', 'نسبة العتبة', 'Ratio du seuil')}: ${(result.thresholdRatio * 100).toFixed(0)}%`}
              color="rose"
            />
            <CalculatorShell.MetricTile
              label={tr('Economic exposure', 'التعرّض الاقتصادي', 'Exposition économique')}
              value={`$${result.economicExposurePerHa.toFixed(0)}`}
              unit={tr('/ha', '/هكتار', '/ha')}
              helper={result.scoutingDue ? tr('Scout soon', 'نفّذ الكشف قريباً', 'Suivi prochain') : tr('Routine interval', 'فاصل روتيني', 'Intervalle de routine')}
              color="amber"
            />
          </div>

          <div className="rounded-xl border border-dashed bg-muted/20 p-3 text-sm leading-relaxed">
            <div className="flex items-start gap-2">
              <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                <strong>{tr('Evidence summary:', 'ملخص الأدلة:', 'Résumé des éléments :')}</strong>{' '}
                {tr(
                  `Average ${targetType} density is ${result.averageDensity.toFixed(1)} ${unit} against a threshold of ${numberValue(actionThreshold).toFixed(1)}.`,
                  `متوسط كثافة ${targetTypeLabel} هو ${result.averageDensity.toFixed(1)} ${unit} مقابل عتبة قدرها ${numberValue(actionThreshold).toFixed(1)}.`,
                  `La densité moyenne de ${targetTypeLabel.toLowerCase()} est de ${result.averageDensity.toFixed(1)} ${unit}, pour un seuil de ${numberValue(actionThreshold).toFixed(1)}.`,
                )}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{tr('Control ladder', 'سُلّم المكافحة', 'Échelle de lutte')}</h3>
              <Badge variant="outline">{tr('Least-risk first', 'الأقل خطراً أولاً', 'Moins risqué d’abord')}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {result.controls.map(control => {
                const Icon = CONTROL_ICONS[control.method];
                const copy = METHOD_COPY[control.method];
                return (
                  <div key={control.method} className={`rounded-xl border p-3 ${CONTROL_COLORS[control.method]}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Icon className="h-4 w-4" /> {copyFor(language, copy.en, copy.ar, copy.fr)}
                      </div>
                      <Badge variant={control.recommended ? 'default' : 'secondary'}>
                        {control.recommended ? tr('Review', 'مراجعة', 'À examiner') : tr('Hold', 'انتظار', 'Attendre')}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{renderMethodRationale(control.method)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{tr('Next actions', 'الإجراءات التالية', 'Prochaines actions')}</h3>
            <div className="space-y-2">
              {result.nextActions.map((action, index) => (
                <div key={`${action}-${index}`} className="flex items-start gap-2 rounded-lg border bg-background p-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{renderAction(action)}</span>
                </div>
              ))}
            </div>
          </div>

          {result.warnings.length > 0 && (
            <div className="space-y-2">
              {result.warnings.map((warning, index) => (
                <div key={`${warning}-${index}`} className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{renderWarning(warning)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
