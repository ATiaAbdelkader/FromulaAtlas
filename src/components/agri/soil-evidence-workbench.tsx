'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, CloudUpload, Droplets, FlaskConical, MapPin, RefreshCw, ShieldAlert, Target, TestTube2, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { copyFor, useTranslation, type Language } from '@/lib/language-store';
import { CROP_LIFECYCLES } from '@/lib/crop-lifecycle';
import { localizedCropName } from '@/lib/crop-localization';
import type { TabId } from '@/lib/user-level';
import {
  assessSoilEvidence,
  buildEvidenceFromCapture,
  buildSamplingMission,
  buildSoilQualityScorecard,
  createEvidenceCard,
  getEvidencePropertyLabel,
  getEvidenceSourceLabel,
  getSamplingMissionStatusLabel,
  getSamplingObjectiveLabel,
  getSamplingPatternLabel,
  getSamplingSampleStatusLabel,
  normalizeSamplingMission,
  reconcileCaptures,
  summarizeSoilEvidence,
  updateSamplingSample,
  type EvidenceConfidence,
  type SoilQualityIndicatorKey,
  type SoilQualitySignalStatus,
  type SoilQualityPosture,
  type SamplingMission,
  type SamplingMissionStatus,
  type SamplingObjective,
  type SamplingPattern,
  type SamplingSampleStatus,
  type SoilEvidenceCard,
  type OfflineCaptureRecord,
  type OfflineCaptureSyncStatus,
  type SoilEvidenceProperty,
  type SoilEvidenceSource,
} from '@/lib/soil-evidence-workbench';

type SoilEvidenceWorkbenchProps = {
  onOpenTool?: (tab: TabId, storageKey?: string) => void;
};

const EVIDENCE_KEY = 'soil_evidence_cards_v1';
const MISSIONS_KEY = 'soil_sampling_missions_v1';
const OFFLINE_CAPTURES_KEY = 'soil_offline_captures_v1';
const PROPERTIES: SoilEvidenceProperty[] = ['pH', 'EC', 'ECe', 'texture', 'CEC', 'SOC', 'organic-matter', 'total-N', 'available-P', 'available-K', 'SAR', 'bicarbonate'];
const SOURCES: SoilEvidenceSource[] = ['lab', 'field-test', 'observation', 'estimate', 'model'];
const OBJECTIVES: SamplingObjective[] = ['baseline', 'covariate-coverage', 'model-improvement', 'certification', 'management-comparison'];
const inputClass = 'h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';

type CaptureResultSource = 'lab' | 'field-test';

function offlineCaptureId(capture: OfflineCaptureRecord): string {
  return capture.id ?? `${capture.missionId}:${capture.sampleLabelId}:${capture.capturedAt}`;
}

function captureStatusLabel(language: Language, status: OfflineCaptureSyncStatus): string {
  const labels: Record<OfflineCaptureSyncStatus, [string, string, string]> = {
    pending: ['Pending import', 'في انتظار الاستيراد', 'Import en attente'],
    synced: ['Imported', 'تم الاستيراد', 'Importé'],
    conflict: ['Needs review', 'تحتاج إلى مراجعة', 'À vérifier'],
  };
  const label = labels[status];
  return language === 'ar' ? label[1] : language === 'fr' ? label[2] : label[0];
}

function copy(language: Language, en: string, ar: string, fr: string): string {
  return copyFor(language, en, ar, fr);
}

function confidenceLabel(language: Language, confidence: EvidenceConfidence): string {
  const labels: Record<EvidenceConfidence, [string, string, string]> = {
    high: ['High confidence', 'ثقة مرتفعة', 'Confiance élevée'],
    medium: ['Medium confidence', 'ثقة متوسطة', 'Confiance moyenne'],
    low: ['Low confidence', 'ثقة منخفضة', 'Confiance faible'],
  };
  const label = labels[confidence];
  return language === 'ar' ? label[1] : language === 'fr' ? label[2] : label[0];
}

function freshnessLabel(language: Language, freshness: string): string {
  const labels: Record<string, [string, string, string]> = {
    fresh: ['Fresh', 'حديث', 'Récent'],
    aging: ['Aging', 'يتقادم', 'Vieillissant'],
    stale: ['Stale', 'قديم', 'Périmé'],
    undated: ['Undated', 'بلا تاريخ', 'Sans date'],
  };
  const label = labels[freshness] ?? labels.undated;
  return language === 'ar' ? label[1] : language === 'fr' ? label[2] : label[0];
}

function toneForConfidence(confidence: EvidenceConfidence): 'default' | 'secondary' | 'destructive' {
  return confidence === 'high' ? 'default' : confidence === 'medium' ? 'secondary' : 'destructive';
}

function localizedMissionText(language: Language, text: string): string {
  if (text.startsWith('Confirm the target property')) return copy(language, text, 'أكد الخاصية المستهدفة والعمق والوحدة والقرار قبل الجمع الحقلي.', 'Confirmez la propriété cible, la profondeur, l’unité et la décision avant le prélèvement.');
  if (text.startsWith('Plan ')) {
    const match = text.match(/^Plan ([0-9]+) georeferenced samples across ([0-9.]+) ha/);
    if (match) return copy(language, text, `خطط لـ ${match[1]} عينة جغرافية عبر ${match[2]} هكتار؛ هذا هدف تخطيطي وليس ضماناً إحصائياً عاماً.`, `Planifiez ${match[1]} échantillons géoréférencés sur ${match[2]} ha ; il s’agit d’un objectif de planification, pas d’une garantie statistique universelle.`);
  }
  if (text.startsWith('Record coordinates')) return copy(language, text, 'سجل الإحداثيات وتاريخ العينة والعمق والمحصول ومصدر الري وتاريخ الإدارة لكل عينة.', 'Enregistrez les coordonnées, la date, la profondeur, la culture, la source d’irrigation et l’historique de gestion pour chaque échantillon.');
  if (text.startsWith('Cover the selected strata')) return copy(language, text, text.replace('Cover the selected strata:', 'غطِّ الطبقات المختارة:').replace('.', '.'), text.replace('Cover the selected strata:', 'Couvrez les strates sélectionnées :'));
  if (text.startsWith('Define strata')) return copy(language, text, 'حدد الطبقات قبل أخذ العينات حتى لا يتم إغفال اختلافات التربة والإدارة.', 'Définissez les strates avant le prélèvement afin de ne pas manquer les contrastes de sol et de gestion.');
  if (text.startsWith('Keep independent validation')) return copy(language, text, 'احتفظ بعينات تحقق مستقلة عن عينات تدريب النموذج عند رسم الخرائط أو اعتماد سطح.', 'Gardez les échantillons de validation indépendants des échantillons d’entraînement lors de la cartographie ou de la certification.');
  if (text.startsWith('Add root-zone')) return copy(language, text, 'أضف ECe/EC لمنطقة الجذور وملوحة مياه الري وحالة الصرف ومعرّفات البئر أو المصدر إلى السجل الحقلي.', 'Ajoutez l’ECe/EC de la zone racinaire, la CE de l’eau, l’état du drainage et les identifiants du puits ou de la source au registre terrain.');
  if (text.startsWith('Do not interpret')) return copy(language, text, 'لا تفسر قيمة نموذجية على أنها نتيجة مختبرية.', 'N’interprétez pas une valeur modélisée comme un résultat de laboratoire.');
  if (text.startsWith('Use measured values')) return copy(language, text, 'استخدم القيم المقاسة للمغذيات الحساسة للإدارة إلى أن يدعم التحقق المحلي الاستدلال الأوسع.', 'Utilisez des valeurs mesurées pour les nutriments sensibles à la gestion jusqu’à ce qu’une validation locale soutienne une inférence plus large.');
  if (text.startsWith('Document laboratory')) return copy(language, text, 'وثق طريقة المختبر وحدود الكشف والوحدات وأي توحيد للعمق.', 'Documentez la méthode du laboratoire, les limites de détection, les unités et toute harmonisation de profondeur.');
  if (text.startsWith('Use an independent')) return copy(language, text, 'استخدم تصميم تحقق احتمالي مستقل لادعاءات الاعتماد.', 'Utilisez un plan de validation probabiliste indépendant pour les affirmations de certification.');
  if (text.startsWith('Choose spatial')) return copy(language, text, 'اختر التحقق المكاني أو القائم على أقرب الجيران قبل تقديم ادعاءات الخريطة.', 'Choisissez une validation spatiale ou fondée sur les plus proches voisins avant toute affirmation cartographique.');
  return text;
}

function qualityIndicatorLabel(language: Language, key: SoilQualityIndicatorKey): string {
  const labels: Record<SoilQualityIndicatorKey, [string, string, string]> = {
    pH: ['pH', 'الأس الهيدروجيني', 'pH'],
    salinity: ['Salinity', 'الملوحة', 'Salinité'],
    CEC: ['CEC', 'السعة التبادلية الكاتيونية', 'CEC'],
    SOC: ['Soil organic carbon', 'الكربون العضوي في التربة', 'Carbone organique du sol'],
    'organic-matter': ['Organic matter', 'المادة العضوية', 'Matière organique'],
    'total-N': ['Total nitrogen', 'النيتروجين الكلي', 'Azote total'],
    'available-P': ['Available phosphorus', 'الفوسفور المتاح', 'Phosphore disponible'],
    'available-K': ['Available potassium', 'البوتاسيوم المتاح', 'Potassium disponible'],
    SAR: ['Sodicity (SAR)', 'الصودية (SAR)', 'Sodicité (SAR)'],
    texture: ['Texture', 'القوام', 'Texture'],
    drainage: ['Drainage', 'الصرف', 'Drainage'],
    compaction: ['Compaction', 'الانضغاط', 'Compaction'],
  };
  const label = labels[key];
  return language === 'ar' ? label[1] : language === 'fr' ? label[2] : label[0];
}

function qualityStatusLabel(language: Language, status: SoilQualitySignalStatus): string {
  const labels: Record<SoilQualitySignalStatus, [string, string, string]> = {
    favorable: ['Favorable', 'ملائم', 'Favorable'],
    watch: ['Watch', 'مراقبة', 'À surveiller'],
    limiting: ['Limiting factor', 'عامل مقيّد', 'Facteur limitant'],
    missing: ['Evidence missing', 'الدليل مفقود', 'Donnée manquante'],
  };
  const label = labels[status];
  return language === 'ar' ? label[1] : language === 'fr' ? label[2] : label[0];
}

function qualityPostureLabel(language: Language, posture: SoilQualityPosture): string {
  const labels: Record<SoilQualityPosture, [string, string, string]> = {
    'screening-only': ['Screening only', 'فحص أولي فقط', 'Dépistage uniquement'],
    'limiting-factor': ['Limiting factor found', 'تم العثور على عامل مقيّد', 'Facteur limitant détecté'],
    'evidence-gap': ['Evidence gap', 'فجوة في الأدلة', 'Lacune de données'],
    'management-caution': ['Management caution', 'حذر في الإدارة', 'Prudence de gestion'],
    'insufficient-evidence': ['Insufficient evidence', 'أدلة غير كافية', 'Données insuffisantes'],
  };
  const label = labels[posture];
  return language === 'ar' ? label[1] : language === 'fr' ? label[2] : label[0];
}

function qualityStatusTone(status: SoilQualitySignalStatus): 'default' | 'secondary' | 'destructive' {
  return status === 'favorable' ? 'default' : status === 'watch' || status === 'missing' ? 'secondary' : 'destructive';
}

function qualityRecommendationText(language: Language, key: string): string {
  const labels: Record<string, [string, string, string]> = {
    'review-salinity': ['Review irrigation water, drainage, and leaching before changing the crop plan.', 'راجع مياه الري والصرف والغسل قبل تغيير خطة المحصول.', 'Examinez l’eau d’irrigation, le drainage et le lessivage avant de modifier le plan cultural.'],
    'review-pH': ['Confirm crop-specific pH targets before applying an amendment.', 'أكد أهداف الأس الهيدروجيني الخاصة بالمحصول قبل إضافة أي مُحسّن.', 'Confirmez les cibles de pH de la culture avant tout amendement.'],
    'soil-test-nutrients': ['Use a laboratory nutrient interpretation before applying N, P, or K.', 'استخدم تفسيراً مخبرياً للمغذيات قبل إضافة N أو P أو K.', 'Utilisez une interprétation de laboratoire avant toute application de N, P ou K.'],
    'collect-texture-CEC': ['Collect texture and CEC evidence before interpreting nutrient holding or infiltration.', 'اجمع دليلاً عن القوام وCEC قبل تفسير احتفاظ المغذيات أو تسرب الماء.', 'Mesurez la texture et la CEC avant d’interpréter la rétention des nutriments ou l’infiltration.'],
    'confirm-drainage': ['Record root-zone drainage or waterlogging observations before a salinity decision.', 'سجل حالة صرف منطقة الجذور أو الغمر بالماء قبل قرار الملوحة.', 'Documentez le drainage de la zone racinaire ou l’engorgement avant une décision de salinité.'],
    'verify-compaction': ['Add a compaction or bulk-density observation before changing tillage or traffic plans.', 'أضف ملاحظة عن الانضغاط أو الكثافة الظاهرية قبل تغيير خطة الحراثة أو المرور.', 'Ajoutez une observation de compaction ou de densité apparente avant de modifier le travail du sol ou le trafic.'],
    'expand-soil-evidence': ['Expand measured evidence across depth, crop, irrigation source, and salinity-risk strata.', 'وسع الأدلة المقاسة عبر العمق والمحصول ومصدر الري وطبقات خطر الملوحة.', 'Étendez les données mesurées selon la profondeur, la culture, la source d’irrigation et les strates de risque salin.'],
  };
  const label = labels[key] ?? [key, key, key];
  return language === 'ar' ? label[1] : language === 'fr' ? label[2] : label[0];
}

function qualitySignalDetailText(language: Language, key: SoilQualityIndicatorKey, status: SoilQualitySignalStatus): string {
  const generic: Record<SoilQualitySignalStatus, [string, string, string]> = {
    favorable: ['The current evidence is within the screening band.', 'الدليل الحالي ضمن نطاق الفحص.', 'La donnée actuelle se situe dans la bande de dépistage.'],
    watch: ['The current evidence is near a watch threshold; verify crop and soil context.', 'الدليل الحالي قريب من حد المراقبة؛ تحقق من سياق المحصول والتربة.', 'La donnée actuelle est proche d’un seuil de surveillance ; vérifiez le contexte de la culture et du sol.'],
    limiting: ['The current evidence is outside the screening band and may limit decisions.', 'الدليل الحالي خارج نطاق الفحص وقد يقيّد القرارات.', 'La donnée actuelle est hors de la bande de dépistage et peut limiter les décisions.'],
    missing: ['No structured evidence is recorded for this indicator.', 'لا يوجد دليل منظم مسجل لهذا المؤشر.', 'Aucune donnée structurée n’est enregistrée pour cet indicateur.'],
  };
  const prefix: Record<SoilQualityIndicatorKey, [string, string, string]> = {
    pH: ['pH', 'الأس الهيدروجيني', 'pH'], salinity: ['Salinity', 'الملوحة', 'Salinité'], CEC: ['CEC', 'CEC', 'CEC'], SOC: ['Soil organic carbon', 'الكربون العضوي في التربة', 'Carbone organique du sol'], 'organic-matter': ['Organic matter', 'المادة العضوية', 'Matière organique'], 'total-N': ['Total nitrogen', 'النيتروجين الكلي', 'Azote total'], 'available-P': ['Available phosphorus', 'الفوسفور المتاح', 'Phosphore disponible'], 'available-K': ['Available potassium', 'البوتاسيوم المتاح', 'Potassium disponible'], SAR: ['Sodicity', 'الصودية', 'Sodicité'], texture: ['Texture', 'القوام', 'Texture'], drainage: ['Drainage', 'الصرف', 'Drainage'], compaction: ['Compaction', 'الانضغاط', 'Compaction'],
  };
  const label = prefix[key][language === 'ar' ? 1 : language === 'fr' ? 2 : 0];
  const detail = generic[status][language === 'ar' ? 1 : language === 'fr' ? 2 : 0];
  return `${label}: ${detail}`;
}

function qualitySignalActionText(language: Language, key: SoilQualityIndicatorKey, status: SoilQualitySignalStatus): string {
  const actions: Record<SoilQualityIndicatorKey, [string, string, string]> = {
    pH: ['Confirm crop-specific pH targets before any amendment.', 'أكد أهداف الأس الهيدروجيني الخاصة بالمحصول قبل أي مُحسّن.', 'Confirmez les cibles de pH de la culture avant tout amendement.'],
    salinity: ['Review irrigation water, drainage, and leaching before changing the crop plan.', 'راجع مياه الري والصرف والغسل قبل تغيير خطة المحصول.', 'Examinez l’eau d’irrigation, le drainage et le lessivage avant de modifier le plan cultural.'],
    CEC: ['Collect a laboratory CEC result before interpreting nutrient holding.', 'اجمع نتيجة CEC مخبرية قبل تفسير احتفاظ المغذيات.', 'Obtenez une mesure de CEC en laboratoire avant d’interpréter la rétention des nutriments.'],
    SOC: ['Keep organic-carbon evidence tied to depth and sampling date.', 'أبقِ دليل الكربون العضوي مرتبطاً بالعمق وتاريخ أخذ العينة.', 'Conservez la profondeur et la date associées à la donnée de carbone organique.'],
    'organic-matter': ['Confirm the method and depth before comparing organic-matter values.', 'أكد الطريقة والعمق قبل مقارنة قيم المادة العضوية.', 'Confirmez la méthode et la profondeur avant de comparer les valeurs de matière organique.'],
    'total-N': ['Use laboratory interpretation before applying nitrogen.', 'استخدم تفسيراً مخبرياً قبل إضافة النيتروجين.', 'Utilisez une interprétation de laboratoire avant toute application d’azote.'],
    'available-P': ['Use laboratory interpretation before applying phosphorus.', 'استخدم تفسيراً مخبرياً قبل إضافة الفوسفور.', 'Utilisez une interprétation de laboratoire avant toute application de phosphore.'],
    'available-K': ['Use laboratory interpretation before applying potassium.', 'استخدم تفسيراً مخبرياً قبل إضافة البوتاسيوم.', 'Utilisez une interprétation de laboratoire avant toute application de potassium.'],
    SAR: ['Review water quality, calcium balance, and drainage before a sodicity action.', 'راجع جودة الماء وتوازن الكالسيوم والصرف قبل إجراء متعلق بالصودية.', 'Examinez la qualité de l’eau, l’équilibre calcique et le drainage avant une action sur la sodicité.'],
    texture: ['Collect texture evidence before interpreting infiltration or nutrient holding.', 'اجمع دليلاً عن القوام قبل تفسير تسرب الماء أو احتفاظ المغذيات.', 'Mesurez la texture avant d’interpréter l’infiltration ou la rétention des nutriments.'],
    drainage: ['Record root-zone drainage or waterlogging observations before a salinity decision.', 'سجل صرف منطقة الجذور أو ملاحظات الغمر قبل قرار الملوحة.', 'Documentez le drainage de la zone racinaire ou l’engorgement avant une décision de salinité.'],
    compaction: ['Add a compaction or bulk-density observation before changing tillage or traffic plans.', 'أضف ملاحظة عن الانضغاط أو الكثافة الظاهرية قبل تغيير خطة الحراثة أو المرور.', 'Ajoutez une observation de compaction ou de densité apparente avant de modifier le travail du sol ou le trafic.'],
  };
  const action = actions[key][language === 'ar' ? 1 : language === 'fr' ? 2 : 0];
  return status === 'favorable' ? (language === 'ar' ? 'احتفظ بالدليل والنطاق والتاريخ المرتبطين به.' : language === 'fr' ? 'Conservez la donnée avec son périmètre et sa date.' : 'Keep the evidence with its scope and date attached.') : action;
}

function Metric({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'good' | 'warn' | 'danger' }) {
  const toneClass = tone === 'good' ? 'text-emerald-700 dark:text-emerald-300' : tone === 'warn' ? 'text-amber-700 dark:text-amber-300' : tone === 'danger' ? 'text-red-700 dark:text-red-300' : 'text-foreground';
  return <div className="rounded-xl border border-border/70 bg-muted/20 p-3"><div className="text-[10px] text-muted-foreground">{label}</div><div className={`mt-1 text-lg font-bold ${toneClass}`}>{value}</div></div>;
}

export function SoilEvidenceWorkbench({ onOpenTool }: SoilEvidenceWorkbenchProps) {
  const { language, isRTL } = useTranslation();
  const [cards, setCards] = useState<SoilEvidenceCard[]>([]);
  const [missions, setMissions] = useState<SamplingMission[]>([]);
  const [captures, setCaptures] = useState<OfflineCaptureRecord[]>([]);
  const [property, setProperty] = useState<SoilEvidenceProperty>('pH');
  const [value, setValue] = useState('7.5');
  const [unit, setUnit] = useState('pH');
  const [sampleDate, setSampleDate] = useState('');
  const [depthCm, setDepthCm] = useState('30');
  const [source, setSource] = useState<SoilEvidenceSource>('lab');
  const [location, setLocation] = useState('');
  const [cropId, setCropId] = useState('wheat');
  const [irrigationSource, setIrrigationSource] = useState('well');
  const [notes, setNotes] = useState('');
  const [objective, setObjective] = useState<SamplingObjective>('baseline');
  const [targetSamples, setTargetSamples] = useState('12');
  const [studyAreaHa, setStudyAreaHa] = useState('5');
  const [strata, setStrata] = useState('crop, irrigation source, salinity risk');
  const [salinityConcern, setSalinityConcern] = useState(true);
  const [missionNotes, setMissionNotes] = useState('');
  const [samplingPattern, setSamplingPattern] = useState<SamplingPattern>('stratified-random');
  const [primaryDepthCm, setPrimaryDepthCm] = useState('30');
  const [includeSubsoilDepth, setIncludeSubsoilDepth] = useState(true);
  const [collector, setCollector] = useState('');
  const [handoffTo, setHandoffTo] = useState('');
  const [laboratory, setLaboratory] = useState('');
  const [handoffDate, setHandoffDate] = useState('');
  const [custodyNotes, setCustodyNotes] = useState('');
  const [notice, setNotice] = useState('');
  const [captureMissionId, setCaptureMissionId] = useState('');
  const [captureSampleId, setCaptureSampleId] = useState('');
  const [captureLatitude, setCaptureLatitude] = useState('33.3682');
  const [captureLongitude, setCaptureLongitude] = useState('6.8674');
  const [captureProperty, setCaptureProperty] = useState<SoilEvidenceProperty>('pH');
  const [captureValue, setCaptureValue] = useState('');
  const [captureUnit, setCaptureUnit] = useState('pH');
  const [captureResultSource, setCaptureResultSource] = useState<CaptureResultSource>('lab');
  const [captureObservationNotes, setCaptureObservationNotes] = useState('');
  const [capturePhotoRefs, setCapturePhotoRefs] = useState('');
  const [captureBy, setCaptureBy] = useState('');

  useEffect(() => {
    try {
      const storedCards = localStorage.getItem(EVIDENCE_KEY);
      const storedMissions = localStorage.getItem(MISSIONS_KEY);
      const storedCaptures = localStorage.getItem(OFFLINE_CAPTURES_KEY);
      if (storedCards) setCards(JSON.parse(storedCards) as SoilEvidenceCard[]);
      if (storedMissions) setMissions((JSON.parse(storedMissions) as SamplingMission[]).map(normalizeSamplingMission));
      if (storedCaptures) setCaptures(JSON.parse(storedCaptures) as OfflineCaptureRecord[]);
    } catch {
      setNotice(copy(language, 'Saved evidence could not be read; the workbench remains usable in memory.', 'تعذر قراءة الأدلة المحفوظة؛ تبقى مساحة العمل قابلة للاستخدام في الذاكرة.', 'Les données enregistrées n’ont pas pu être lues ; l’espace reste utilisable en mémoire.'));
    }
  }, [language]);

  const summary = useMemo(() => summarizeSoilEvidence(cards), [cards]);
  const scorecard = useMemo(() => buildSoilQualityScorecard(cards), [cards]);
  const pendingCaptures = useMemo(() => captures.filter(capture => capture.syncStatus !== 'synced'), [captures]);
  const reconciliation = useMemo(() => reconcileCaptures(pendingCaptures, cards, missions), [pendingCaptures, cards, missions]);
  const selectedCaptureMission = missions.find(item => item.id === captureMissionId) ?? missions[0];
  const captureSamples = selectedCaptureMission?.sampleLabels ?? [];

  const persistCards = (next: SoilEvidenceCard[]) => {
    setCards(next);
    try { localStorage.setItem(EVIDENCE_KEY, JSON.stringify(next)); } catch { /* local-first fallback */ }
  };

  const persistMissions = (next: SamplingMission[]) => {
    setMissions(next);
    try { localStorage.setItem(MISSIONS_KEY, JSON.stringify(next)); } catch { /* local-first fallback */ }
  };

  const persistCaptures = (next: OfflineCaptureRecord[]) => {
    setCaptures(next);
    try { localStorage.setItem(OFFLINE_CAPTURES_KEY, JSON.stringify(next)); } catch { /* local-first fallback */ }
  };

  const addEvidence = () => {
    const numericValue = Number(value);
    const numericDepth = Number(depthCm);
    if (!Number.isFinite(numericValue) || !Number.isFinite(numericDepth) || numericDepth <= 0 || !location.trim() || !sampleDate) {
      setNotice(copy(language, 'Enter a value, positive depth, sample date, and field/location before saving evidence.', 'أدخل قيمة وعمقاً موجباً وتاريخ العينة والحقل أو الموقع قبل حفظ الدليل.', 'Saisissez une valeur, une profondeur positive, une date et un champ ou lieu avant d’enregistrer la donnée.'));
      return;
    }
    const card = createEvidenceCard({ property, value: numericValue, unit: unit.trim() || property, sampleDate, depthCm: numericDepth, source, location: location.trim(), cropId, irrigationSource: irrigationSource.trim() || 'unknown', notes: notes.trim() });
    persistCards([card, ...cards]);
    setNotice(copy(language, 'Evidence saved locally with provenance and confidence checks.', 'تم حفظ الدليل محلياً مع فحوص المصدر والثقة.', 'Donnée enregistrée localement avec contrôles de provenance et de confiance.'));
    setNotes('');
  };

  const createMission = () => {
    const mission = buildSamplingMission({ objective, targetProperty: property, studyAreaHa: Number(studyAreaHa), targetSamples: Number(targetSamples), strata: strata.split(',').map(item => item.trim()).filter(Boolean), cropId, irrigationSource: irrigationSource.trim() || 'unknown', salinityConcern, notes: missionNotes.trim(), scorecardGaps: scorecard.missingIndicators, samplingPattern, primaryDepthCm: Number(primaryDepthCm), includeSubsoilDepth, chainOfCustody: { collector: collector.trim(), handoffTo: handoffTo.trim(), laboratory: laboratory.trim(), handoffDate, notes: custodyNotes.trim() } });
    const withCustody = { ...mission, chainOfCustody: { ...mission.chainOfCustody, collector: collector.trim(), handoffTo: handoffTo.trim(), laboratory: laboratory.trim(), handoffDate, notes: custodyNotes.trim() } };
    persistMissions([withCustody, ...missions]);
    setNotice(copy(language, 'Sampling mission created locally. Review every quality gate before field collection.', 'تم إنشاء مهمة أخذ العينات محلياً. راجع كل بوابة جودة قبل الجمع الحقلي.', 'Mission de prélèvement créée localement. Vérifiez chaque garde-fou avant le terrain.'));
    setMissionNotes('');
    setCustodyNotes('');
  };

  const updateMission = (missionId: string, patch: Partial<SamplingMission>) => {
    persistMissions(missions.map(item => item.id === missionId ? normalizeSamplingMission({ ...item, ...patch }) : item));
  };

  const toggleSample = (mission: SamplingMission, sampleId: string) => {
    const sample = mission.sampleLabels.find(item => item.id === sampleId);
    if (!sample) return;
    const nextStatus: SamplingSampleStatus = sample.status === 'collected' ? 'planned' : 'collected';
    const nextMission = updateSamplingSample(mission, sampleId, nextStatus, { locationNote: sample.locationNote, collector: sample.collector ?? '' });
    updateMission(mission.id, nextMission);
    setNotice(nextStatus === 'collected' ? copy(language, 'Sample marked collected and saved on this device.', 'تم وضع علامة جمع العينة وحفظها على هذا الجهاز.', 'Échantillon marqué comme prélevé et enregistré sur cet appareil.') : copy(language, 'Sample returned to planned status.', 'أعيدت العينة إلى حالة مخططة.', 'Échantillon remis au statut planifié.'));
  };

  const completeMission = (mission: SamplingMission) => {
    if (mission.offlineCompletedCount < mission.sampleLabels.length) {
      setNotice(copy(language, `Collect all ${mission.sampleLabels.length} planned samples before completing this mission.`, `اجمع العينات المخططة وعددها ${mission.sampleLabels.length} قبل إكمال المهمة.`, `Collectez les ${mission.sampleLabels.length} échantillons prévus avant de terminer cette mission.`));
      return;
    }
    const completedAt = new Date().toISOString();
    updateMission(mission.id, { status: 'completed', lastSyncedAt: completedAt });
    setNotice(copy(language, 'Sampling mission completed locally with a traceable timestamp.', 'اكتملت مهمة أخذ العينات محلياً مع وقت قابل للتتبع.', 'Mission de prélèvement terminée localement avec un horodatage traçable.'));
  };

  const syncMission = (mission: SamplingMission) => {
    const syncedAt = new Date().toISOString();
    updateMission(mission.id, { lastSyncedAt: syncedAt });
    setNotice(copy(language, 'Mission record marked ready for later sync; no server upload was attempted.', 'تم وضع علامة على سجل المهمة ليكون جاهزاً للمزامنة لاحقاً؛ لم تتم محاولة رفع إلى خادم.', 'Le dossier de mission est marqué pour une synchronisation ultérieure ; aucun envoi serveur n’a été tenté.'));
  };

  const saveOfflineCapture = () => {
    const mission = missions.find(item => item.id === captureMissionId) ?? missions[0];
    const sample = mission?.sampleLabels.find(item => item.id === captureSampleId) ?? mission?.sampleLabels.find(item => item.status !== 'collected');
    const latitude = Number(captureLatitude);
    const longitude = Number(captureLongitude);
    const numericValue = captureValue.trim() ? Number(captureValue) : NaN;
    if (!mission || !sample || !captureBy.trim() || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setNotice(copy(language, 'Select a mission and sample, enter valid GPS coordinates, and identify the collector.', 'اختر مهمة وعينة وأدخل إحداثيات GPS صحيحة وحدد اسم الجامع.', 'Sélectionnez une mission et un échantillon, saisissez des coordonnées GPS valides et indiquez le préleveur.'));
      return;
    }
    if (captureValue.trim() && !Number.isFinite(numericValue)) {
      setNotice(copy(language, 'The result must be numeric when provided.', 'يجب أن تكون النتيجة رقمية عند إدخالها.', 'La valeur doit être numérique lorsqu’elle est renseignée.'));
      return;
    }
    const capturedAt = new Date().toISOString();
    const capture: OfflineCaptureRecord = {
      id: `capture-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sampleLabelId: sample.id,
      sampleCode: sample.code,
      missionId: mission.id,
      coordinates: { latitude, longitude },
      observationNotes: captureObservationNotes.trim(),
      photoRefs: capturePhotoRefs.split(',').map(item => item.trim()).filter(Boolean),
      labResultFields: captureResultSource === 'lab' && Number.isFinite(numericValue) ? { [captureProperty]: { value: numericValue, unit: captureUnit.trim() || captureProperty } } : {},
      fieldTestResult: captureResultSource === 'field-test' && Number.isFinite(numericValue) ? { property: captureProperty, value: numericValue, unit: captureUnit.trim() || captureProperty } : undefined,
      depthCm: sample.depthCm,
      cropId: mission.cropId,
      irrigationSource: mission.irrigationSource,
      capturedAt,
      capturedBy: captureBy.trim(),
      syncStatus: 'pending',
    };
    persistCaptures([capture, ...captures]);
    const nextMission = updateSamplingSample(mission, sample.id, 'collected', { locationNote: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, collector: captureBy.trim() }, capturedAt);
    persistMissions(missions.map(item => item.id === mission.id ? nextMission : item));
    setCaptureSampleId('');
    setCaptureValue('');
    setCaptureObservationNotes('');
    setCapturePhotoRefs('');
    setNotice(copy(language, `${sample.code} saved offline and marked collected.`, `تم حفظ ${sample.code} دون اتصال ووضع علامة تم الجمع.`, `${sample.code} enregistré hors ligne et marqué comme prélevé.`));
  };

  const importVerifiedCaptures = () => {
    if (reconciliation.toImport.length === 0) {
      setNotice(reconciliation.conflicts.length > 0
        ? copy(language, 'No new capture was imported. Resolve the flagged conflicts before importing them.', 'لم يتم استيراد عينة جديدة. عالج التعارضات المحددة قبل استيرادها.', 'Aucun nouveau prélèvement importé. Résolvez les conflits signalés avant l’import.')
        : copy(language, 'There are no new verified captures to import.', 'لا توجد عينات موثقة جديدة للاستيراد.', 'Aucun prélèvement vérifié à importer.'));
      return;
    }
    const importedById = new Map(reconciliation.toImport.map(card => [card.id, card]));
    const nextCaptures = captures.map(capture => {
      const id = offlineCaptureId(capture);
      const mission = missions.find(item => item.id === capture.missionId);
      const candidate = mission ? buildEvidenceFromCapture(capture, mission, capture.capturedAt) : undefined;
      if (candidate && importedById.has(candidate.id)) return { ...capture, syncStatus: 'synced' as const, importedEvidenceId: candidate.id };
      if (reconciliation.duplicates.includes(id)) return { ...capture, syncStatus: 'synced' as const, importedEvidenceId: capture.importedEvidenceId ?? candidate?.id };
      if (reconciliation.conflicts.includes(id)) return { ...capture, syncStatus: 'conflict' as const };
      return capture;
    });
    persistCards([...reconciliation.toImport, ...cards]);
    persistCaptures(nextCaptures);
    setNotice(copy(language, `${reconciliation.toImport.length} verified capture(s) imported; duplicates were skipped.`, `تم استيراد ${reconciliation.toImport.length} عينة موثقة وتجاوز التكرارات.`, `${reconciliation.toImport.length} prélèvement(s) vérifié(s) importé(s) ; les doublons ont été ignorés.`));
  };

  const removeCard = (id: string) => persistCards(cards.filter(card => card.id !== id));

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="overflow-hidden border-emerald-200/70 shadow-sm dark:border-emerald-900/70">
        <CardHeader className="border-b bg-gradient-to-r from-emerald-50 via-background to-teal-50/60 pb-4 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/20">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><TestTube2 className="h-4 w-4 text-emerald-600" />{copy(language, 'Soil Evidence & Mapping Workbench', 'مساحة أدلة ورسم خرائط التربة', 'Espace preuves et cartographie des sols')}</CardTitle>
              <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">{copy(language, 'Capture measured evidence first. Formula Atlas will show provenance, freshness, confidence, and the safest next action instead of inventing a soil map.', 'سجل الأدلة المقاسة أولاً. سيعرض Formula Atlas المصدر والحداثة والثقة والإجراء الآمن التالي بدلاً من اختراع خريطة للتربة.', 'Commencez par les données mesurées. Formula Atlas affiche la provenance, la fraîcheur, la confiance et l’action sûre suivante au lieu d’inventer une carte des sols.')}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px]"><Badge variant="outline" className="gap-1 border-emerald-300 text-emerald-800 dark:border-emerald-800 dark:text-emerald-200"><MapPin className="h-3 w-3" />{copy(language, 'El Oued ready', 'جاهز للوادي', 'Prêt pour El Oued')}</Badge><Badge variant="secondary">{copy(language, 'Local-first', 'محلي أولاً', 'Local d’abord')}</Badge></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div><Label htmlFor="soil-property" className="text-xs font-semibold">{copy(language, 'Property', 'الخاصية', 'Propriété')}</Label><select id="soil-property" className={`${inputClass} mt-1`} value={property} onChange={event => { const next = event.target.value as SoilEvidenceProperty; setProperty(next); setUnit(next); }}>{PROPERTIES.map(item => <option key={item} value={item}>{getEvidencePropertyLabel(item, language)}</option>)}</select></div>
            <div><Label htmlFor="soil-value" className="text-xs font-semibold">{copy(language, 'Measured value', 'القيمة المقاسة', 'Valeur mesurée')}</Label><Input id="soil-value" className="mt-1 h-9 text-xs" type="number" step="0.01" value={value} onChange={event => setValue(event.target.value)} /></div>
            <div><Label htmlFor="soil-unit" className="text-xs font-semibold">{copy(language, 'Unit', 'الوحدة', 'Unité')}</Label><Input id="soil-unit" className="mt-1 h-9 text-xs" value={unit} onChange={event => setUnit(event.target.value)} /></div>
            <div><Label htmlFor="soil-date" className="text-xs font-semibold">{copy(language, 'Sample date', 'تاريخ العينة', 'Date de prélèvement')}</Label><Input id="soil-date" className="mt-1 h-9 text-xs" type="date" value={sampleDate} onChange={event => setSampleDate(event.target.value)} /></div>
            <div><Label htmlFor="soil-depth" className="text-xs font-semibold">{copy(language, 'Depth (cm)', 'العمق (سم)', 'Profondeur (cm)')}</Label><Input id="soil-depth" className="mt-1 h-9 text-xs" type="number" min="1" value={depthCm} onChange={event => setDepthCm(event.target.value)} /></div>
            <div><Label htmlFor="soil-source" className="text-xs font-semibold">{copy(language, 'Evidence source', 'مصدر الدليل', 'Source de la donnée')}</Label><select id="soil-source" className={`${inputClass} mt-1`} value={source} onChange={event => setSource(event.target.value as SoilEvidenceSource)}>{SOURCES.map(item => <option key={item} value={item}>{getEvidenceSourceLabel(item, language)}</option>)}</select></div>
            <div><Label htmlFor="soil-location" className="text-xs font-semibold">{copy(language, 'Field / location', 'الحقل / الموقع', 'Champ / lieu')}</Label><Input id="soil-location" className="mt-1 h-9 text-xs" placeholder={copy(language, 'e.g. El Oued oasis A3', 'مثال: واحة الوادي A3', 'ex. oasis d’El Oued A3')} value={location} onChange={event => setLocation(event.target.value)} /></div>
            <div><Label htmlFor="soil-crop" className="text-xs font-semibold">{copy(language, 'Crop context', 'سياق المحصول', 'Contexte cultural')}</Label><select id="soil-crop" className={`${inputClass} mt-1`} value={cropId} onChange={event => setCropId(event.target.value)}>{CROP_LIFECYCLES.map(crop => <option key={crop.id} value={crop.id}>{localizedCropName(language, crop.id, crop.name)}</option>)}</select></div>
            <div><Label htmlFor="soil-irrigation-source" className="text-xs font-semibold">{copy(language, 'Irrigation source', 'مصدر الري', 'Source d’irrigation')}</Label><Input id="soil-irrigation-source" className="mt-1 h-9 text-xs" value={irrigationSource} onChange={event => setIrrigationSource(event.target.value)} /></div>
            <div><Label htmlFor="soil-notes" className="text-xs font-semibold">{copy(language, 'Notes', 'ملاحظات', 'Notes')}</Label><Input id="soil-notes" className="mt-1 h-9 text-xs" value={notes} onChange={event => setNotes(event.target.value)} /></div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950/15"><span className="text-[11px] text-emerald-900 dark:text-emerald-100">{copy(language, 'Measured, dated, depth-specific evidence is safer than a confident estimate.', 'الدليل المقاس والمؤرخ والمحدد العمق أكثر أماناً من تقدير واثق.', 'Une donnée mesurée, datée et liée à une profondeur est plus sûre qu’une estimation confiante.')}</span><Button type="button" size="sm" onClick={addEvidence} className="h-8 gap-1.5 bg-emerald-600 text-xs hover:bg-emerald-700"><FlaskConical className="h-3.5 w-3.5" />{copy(language, 'Save evidence', 'احفظ الدليل', 'Enregistrer')}</Button></div>
          {notice && <p role="status" className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{notice}</p>}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6"><Metric label={copy(language, 'Evidence cards', 'بطاقات الأدلة', 'Cartes de preuve')} value={String(summary.total)} /><Metric label={copy(language, 'Lab results', 'نتائج المختبر', 'Résultats labo')} value={String(summary.labCount)} tone={summary.labCount > 0 ? 'good' : 'warn'} /><Metric label={copy(language, 'Fresh', 'حديث', 'Récent')} value={String(summary.freshCount)} tone="good" /><Metric label={copy(language, 'Stale / undated', 'قديم / بلا تاريخ', 'Périmé / sans date')} value={String(summary.staleCount)} tone={summary.staleCount > 0 ? 'warn' : 'good'} /><Metric label={copy(language, 'Low confidence', 'ثقة منخفضة', 'Confiance faible')} value={String(summary.lowConfidenceCount)} tone={summary.lowConfidenceCount > 0 ? 'warn' : 'good'} /><Metric label={copy(language, 'Decision-ready', 'جاهز للقرار', 'Prêt à décider')} value={String(summary.decisionReadyCount)} tone={summary.decisionReadyCount > 0 ? 'good' : 'warn'} /></div>

      <Card className="border-sky-200/70 dark:border-sky-900/70"><CardHeader className="pb-3"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2 text-sm"><ShieldAlert className="h-4 w-4 text-sky-600" />{copy(language, 'Soil Quality & Limiting-Factor Scorecard', 'بطاقة جودة التربة والعوامل المقيّدة', 'Scorecard qualité des sols et facteurs limitants')}</CardTitle><p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">{copy(language, 'A measured-evidence screening view. Missing properties remain visible, and management-sensitive nutrients never become automatic fertilizer prescriptions.', 'عرض فحص مبني على الأدلة المقاسة. تبقى الخصائص المفقودة ظاهرة ولا تتحول المغذيات الحساسة للإدارة إلى وصفات تسميد آلية.', 'Une lecture de dépistage fondée sur les mesures. Les propriétés manquantes restent visibles et les nutriments sensibles à la gestion ne deviennent jamais des prescriptions automatiques.')}</p></div><div className="flex flex-wrap gap-1.5"><Badge variant={scorecard.posture === 'limiting-factor' ? 'destructive' : 'secondary'}>{qualityPostureLabel(language, scorecard.posture)}</Badge><Badge variant="outline">{confidenceLabel(language, scorecard.confidence)}</Badge></div></div></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><Metric label={copy(language, 'Screening score', 'نتيجة الفحص', 'Score de dépistage')} value={scorecard.score === null ? '—' : `${scorecard.score}/100`} tone={scorecard.score !== null && scorecard.score >= 70 ? 'good' : scorecard.score !== null && scorecard.score < 45 ? 'danger' : 'warn'} /><Metric label={copy(language, 'Evidence coverage', 'تغطية الأدلة', 'Couverture des preuves')} value={`${scorecard.coverage}%`} tone={scorecard.coverage >= 65 ? 'good' : 'warn'} /><Metric label={copy(language, 'Limiting factors', 'العوامل المقيّدة', 'Facteurs limitants')} value={String(scorecard.limitingCount)} tone={scorecard.limitingCount > 0 ? 'danger' : 'good'} /></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{scorecard.signals.map(signal => <div key={signal.key} className="rounded-xl border border-border/70 bg-muted/10 p-3"><div className="flex items-start justify-between gap-2"><div className="text-xs font-semibold">{qualityIndicatorLabel(language, signal.key)}</div><Badge variant={qualityStatusTone(signal.status)}>{qualityStatusLabel(language, signal.status)}</Badge></div><div className="mt-2 text-sm font-bold">{signal.value === null ? '—' : `${signal.value.toFixed(2)} ${signal.unit}`}</div><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{qualitySignalDetailText(language, signal.key, signal.status)}</p><p className="mt-2 text-[10px] font-medium leading-relaxed text-foreground/80">{qualitySignalActionText(language, signal.key, signal.status)}</p></div>)}</div><div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start"><div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[11px] leading-relaxed text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100"><div className="font-semibold">{copy(language, 'Recommended next actions', 'الإجراءات التالية الموصى بها', 'Actions suivantes recommandées')}</div>{scorecard.recommendations.length === 0 ? <p className="mt-1">{copy(language, 'No additional action was generated from the current evidence; keep the scope and references attached.', 'لم يتم إنشاء إجراء إضافي من الأدلة الحالية؛ أبقِ النطاق والمراجع مرتبطين.', 'Aucune action supplémentaire ne découle des données actuelles ; conservez le périmètre et les références.')}</p> : <ul className="mt-1 space-y-1">{scorecard.recommendations.map(recommendation => <li key={recommendation} className="flex gap-1.5"><span className="text-amber-700">•</span><span>{qualityRecommendationText(language, recommendation)}</span></li>)}</ul>}</div><div className="flex flex-wrap gap-2 lg:max-w-xs"><Button type="button" variant="outline" className="h-8 text-[11px]" onClick={() => onOpenTool?.('farm', 'collapse_irr_sched')}><Droplets className="mr-1.5 h-3.5 w-3.5" />{copy(language, 'Water / salinity', 'الماء والملوحة', 'Eau / salinité')}</Button><Button type="button" variant="outline" className="h-8 text-[11px]" onClick={() => onOpenTool?.('farm', 'collapse_fertilization')}><FlaskConical className="mr-1.5 h-3.5 w-3.5" />{copy(language, 'Nutrition', 'التغذية', 'Nutrition')}</Button><Button type="button" variant="outline" className="h-8 text-[11px]" onClick={() => onOpenTool?.('farm', 'crop_mission_planner')}><Target className="mr-1.5 h-3.5 w-3.5" />{copy(language, 'Crop mission', 'مهمة المحصول', 'Mission culturale')}</Button></div></div><p className="text-[10px] leading-relaxed text-muted-foreground">{scorecard.referenceNote}</p></CardContent></Card>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><ClipboardList className="h-4 w-4 text-emerald-600" />{copy(language, 'Evidence register', 'سجل الأدلة', 'Registre des preuves')}</CardTitle></CardHeader><CardContent className="space-y-3">
          {cards.length === 0 ? <div className="rounded-xl border border-dashed p-5 text-center text-xs text-muted-foreground">{copy(language, 'No evidence yet. Add a soil or water result above to begin a traceable record.', 'لا توجد أدلة بعد. أضف نتيجة تربة أو ماء أعلاه لبدء سجل قابل للتتبع.', 'Aucune donnée pour l’instant. Ajoutez un résultat de sol ou d’eau pour commencer un registre traçable.')}</div> : cards.slice(0, 8).map(card => { const assessment = assessSoilEvidence(card); return <div key={card.id} className="rounded-xl border border-border/70 bg-muted/10 p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="text-sm font-semibold">{getEvidencePropertyLabel(card.property, language)} · {card.value} {card.unit}</div><div className="mt-1 text-[11px] text-muted-foreground"><MapPin className="mr-1 inline h-3 w-3" />{card.location} · {card.depthCm} cm · {card.sampleDate}</div></div><Button type="button" variant="ghost" size="sm" className="h-7 text-[11px] text-muted-foreground" onClick={() => removeCard(card.id)}>{copy(language, 'Remove', 'حذف', 'Supprimer')}</Button></div><div className="mt-2 flex flex-wrap gap-1.5"><Badge variant={toneForConfidence(assessment.confidence)}>{confidenceLabel(language, assessment.confidence)}</Badge><Badge variant="outline">{freshnessLabel(language, assessment.freshness)}</Badge><Badge variant="outline">{getEvidenceSourceLabel(card.source, language)}</Badge><Badge variant="outline">{card.cropId}</Badge></div><p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{assessment.nextAction === 'use-within-scope' ? copy(language, 'Use within the declared scope; keep the depth and date attached to the decision.', 'استخدمه ضمن النطاق المعلن مع إبقاء العمق والتاريخ مرتبطين بالقرار.', 'Utilisez-la dans le périmètre déclaré en gardant la profondeur et la date liées à la décision.') : assessment.nextAction === 'retest-root-zone' ? copy(language, 'Retest the root zone before a high-impact irrigation, leaching, or fertilizer decision.', 'أعد اختبار منطقة الجذور قبل قرار ري أو غسل أو تسميد عالي التأثير.', 'Refaites un test de la zone racinaire avant une décision importante d’irrigation, de lessivage ou de fertilisation.') : assessment.nextAction === 'collect-lab-sample' ? copy(language, 'Collect a laboratory sample before treating this observation as a numeric soil result.', 'خذ عينة مخبرية قبل اعتبار هذه الملاحظة نتيجة تربة رقمية.', 'Prélevez un échantillon de laboratoire avant de traiter cette observation comme une valeur numérique.') : copy(language, 'Keep this as a documented reference, not as a measured field result.', 'احتفظ به كمرجع موثق وليس كنتيجة حقلية مقاسة.', 'Conservez-la comme référence documentée, pas comme résultat mesuré.')}</p></div>; })}
        </CardContent></Card>

        <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><Target className="h-4 w-4 text-amber-600" />{copy(language, 'Next decision', 'القرار التالي', 'Prochaine décision')}</CardTitle></CardHeader><CardContent className="space-y-3"><div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100"><div className="flex items-start gap-2"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /><p>{summary.total === 0 ? copy(language, 'Start with a dated laboratory result for pH, EC/ECe, texture, or CEC. Do not create a soil map from assumptions.', 'ابدأ بنتيجة مخبرية مؤرخة للأس الهيدروجيني أو EC/ECe أو القوام أو CEC. لا تنشئ خريطة تربة من الافتراضات.', 'Commencez par un résultat de laboratoire daté pour le pH, l’EC/ECe, la texture ou la CEC. Ne créez pas de carte à partir d’hypothèses.') : summary.staleCount > 0 ? copy(language, 'Some evidence is stale or undated. Retest before a high-impact salinity or fertilizer decision.', 'بعض الأدلة قديمة أو بلا تاريخ. أعد الاختبار قبل قرار ملوحة أو تسميد عالي التأثير.', 'Certaines données sont anciennes ou sans date. Refaites un test avant une décision importante de salinité ou de fertilisation.') : copy(language, 'Evidence is organized. Use the action links below and keep model outputs separate from laboratory results.', 'تم تنظيم الأدلة. استخدم روابط الإجراءات أدناه وافصل مخرجات النماذج عن نتائج المختبر.', 'Les données sont organisées. Utilisez les actions ci-dessous et séparez les sorties de modèle des résultats de laboratoire.')}</p></div><div className="grid gap-2 sm:grid-cols-2"><Button type="button" variant="outline" className="h-9 justify-start gap-2 text-xs" onClick={() => onOpenTool?.('farm', 'crop_mission_planner')}><Target className="h-3.5 w-3.5" />{copy(language, 'Open Crop Mission Planner', 'افتح مخطط مهمة المحصول', 'Ouvrir le planificateur')}</Button><Button type="button" variant="outline" className="h-9 justify-start gap-2 text-xs" onClick={() => onOpenTool?.('farm', 'collapse_irr_sched')}><Droplets className="h-3.5 w-3.5" />{copy(language, 'Open water / salinity action', 'افتح إجراء الماء والملوحة', 'Ouvrir l’action eau / salinité')}</Button><Button type="button" variant="outline" className="h-9 justify-start gap-2 text-xs" onClick={() => onOpenTool?.('farm', 'collapse_fertilization')}><FlaskConical className="h-3.5 w-3.5" />{copy(language, 'Open nutrition action', 'افتح إجراء التغذية', 'Ouvrir l’action nutrition')}</Button><Button type="button" variant="outline" className="h-9 justify-start gap-2 text-xs" onClick={() => onOpenTool?.('farm', 'collapse_field_records')}><CheckCircle2 className="h-3.5 w-3.5" />{copy(language, 'Record in Field Book', 'سجل في دفتر الحقل', 'Enregistrer dans le carnet')}</Button></div></div></CardContent></Card>
      </div>

      <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><ClipboardList className="h-4 w-4 text-emerald-600" />{copy(language, 'Sampling mission designer', 'مصمم مهمة أخذ العينات', 'Concepteur de mission de prélèvement')}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-xs leading-relaxed text-muted-foreground">{copy(language, 'Choose the purpose before choosing the sample count. A planning target is not a universal statistical guarantee.', 'اختر الهدف قبل عدد العينات. الهدف التخطيطي ليس ضماناً إحصائياً عاماً.', 'Choisissez l’objectif avant le nombre d’échantillons. Une cible de planification n’est pas une garantie statistique universelle.')}</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div><Label htmlFor="sampling-objective" className="text-xs font-semibold">{copy(language, 'Objective', 'الهدف', 'Objectif')}</Label><select id="sampling-objective" className={`${inputClass} mt-1`} value={objective} onChange={event => setObjective(event.target.value as SamplingObjective)}>{OBJECTIVES.map(item => <option key={item} value={item}>{getSamplingObjectiveLabel(item, language)}</option>)}</select></div><div><Label htmlFor="sampling-count" className="text-xs font-semibold">{copy(language, 'Target samples', 'العينات المستهدفة', 'Échantillons cibles')}</Label><Input id="sampling-count" className="mt-1 h-9 text-xs" type="number" min="1" value={targetSamples} onChange={event => setTargetSamples(event.target.value)} /></div><div><Label htmlFor="sampling-area" className="text-xs font-semibold">{copy(language, 'Study area (ha)', 'مساحة الدراسة (هكتار)', 'Surface étudiée (ha)')}</Label><Input id="sampling-area" className="mt-1 h-9 text-xs" type="number" min="0" step="0.1" value={studyAreaHa} onChange={event => setStudyAreaHa(event.target.value)} /></div><div><Label htmlFor="sampling-strata" className="text-xs font-semibold">{copy(language, 'Strata, comma-separated', 'الطبقات مفصولة بفواصل', 'Strates séparées par virgules')}</Label><Input id="sampling-strata" className="mt-1 h-9 text-xs" value={strata} onChange={event => setStrata(event.target.value)} /></div></div><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={salinityConcern} onChange={event => setSalinityConcern(event.target.checked)} />{copy(language, 'Include salinity and drainage fields', 'أدرج حقول الملوحة والصرف', 'Inclure les champs salinité et drainage')}</label><div className="flex flex-wrap items-center justify-between gap-2"><Input aria-label={copy(language, 'Mission notes', 'ملاحظات المهمة', 'Notes de mission')} className="h-9 max-w-xl text-xs" placeholder={copy(language, 'Mission note or field context', 'ملاحظة المهمة أو سياق الحقل', 'Note ou contexte terrain')} value={missionNotes} onChange={event => setMissionNotes(event.target.value)} /><Button type="button" size="sm" onClick={createMission} className="h-8 gap-1.5 bg-emerald-600 text-xs hover:bg-emerald-700"><ClipboardList className="h-3.5 w-3.5" />{copy(language, 'Create mission', 'أنشئ المهمة', 'Créer la mission')}</Button></div>{missions.length > 0 && <><Separator />{missions.slice(0, 3).map(mission => <div key={mission.id} className="rounded-xl border border-border/70 p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="text-sm font-semibold">{getSamplingObjectiveLabel(mission.objective, language)} · {getEvidencePropertyLabel(mission.targetProperty, language)}</div><div className="mt-1 text-[11px] text-muted-foreground">{mission.studyAreaHa.toFixed(2)} ha · {mission.targetSamples} {copy(language, 'samples', 'عينات', 'échantillons')} · {mission.cropId} · {mission.irrigationSource}</div></div><Badge variant={mission.salinityConcern ? 'secondary' : 'outline'}>{mission.salinityConcern ? copy(language, 'Salinity fields included', 'حقول الملوحة مدرجة', 'Champs salinité inclus') : copy(language, 'Core soil only', 'تربة أساسية فقط', 'Sol de base seulement')}</Badge></div><div className="mt-3 grid gap-2 md:grid-cols-2"><div><div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{copy(language, 'Field tasks', 'مهام الحقل', 'Tâches terrain')}</div><ul className="space-y-1 text-[11px] text-muted-foreground">{mission.tasks.map(task => <li key={task} className="flex gap-1.5"><span className="text-emerald-600">•</span><span>{localizedMissionText(language, task)}</span></li>)}</ul></div><div><div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{copy(language, 'Quality gates', 'بوابات الجودة', 'Garde-fous qualité')}</div><ul className="space-y-1 text-[11px] text-muted-foreground">{mission.qualityGates.map(gate => <li key={gate} className="flex gap-1.5"><span className="text-amber-600">•</span><span>{localizedMissionText(language, gate)}</span></li>)}</ul></div></div><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Metric label={copy(language, 'Pattern', 'النمط', 'Schéma')} value={getSamplingPatternLabel(mission.samplingPattern, language)} /><Metric label={copy(language, 'Samples collected', 'العينات المجموعة', 'Échantillons prélevés')} value={`${mission.offlineCompletedCount}/${mission.targetSamples}`} tone={mission.offlineCompletedCount === mission.targetSamples ? 'good' : 'warn'} /><Metric label={copy(language, 'Mission status', 'حالة المهمة', 'Statut mission')} value={getSamplingMissionStatusLabel(mission.status, language)} /><Metric label={copy(language, 'Scorecard gaps', 'فجوات البطاقة', 'Lacunes du scorecard')} value={String(mission.scorecardGaps.length)} tone={mission.scorecardGaps.length > 0 ? 'warn' : 'good'} /></div><div className="grid gap-3 lg:grid-cols-2"><div className="rounded-xl border border-sky-200/70 bg-sky-50/40 p-3 dark:border-sky-900/70 dark:bg-sky-950/10"><div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{copy(language, 'Depth protocol', 'بروتوكول العمق', 'Protocole de profondeur')}</div><ul className="space-y-1 text-[11px] text-muted-foreground">{mission.depthRules.map(rule => <li key={`${mission.id}-${rule.topCm}-${rule.bottomCm}`}><span className="font-semibold text-foreground">{rule.topCm}–{rule.bottomCm} cm</span> · {localizedMissionText(language, rule.purpose)}</li>)}</ul></div><div className="rounded-xl border border-violet-200/70 bg-violet-50/40 p-3 dark:border-violet-900/70 dark:bg-violet-950/10"><div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{copy(language, 'Chain of custody', 'سلسلة الحيازة', 'Chaîne de traçabilité')}</div><div className="grid gap-1 text-[11px] text-muted-foreground"><div><span className="font-semibold text-foreground">{copy(language, 'Set', 'المجموعة', 'Lot')}:</span> {mission.chainOfCustody.sampleSetId}</div><div><span className="font-semibold text-foreground">{copy(language, 'Collector', 'الجامع', 'Préleveur')}:</span> {mission.chainOfCustody.collector || '—'}</div><div><span className="font-semibold text-foreground">{copy(language, 'Laboratory', 'المختبر', 'Laboratoire')}:</span> {mission.chainOfCustody.laboratory || '—'}</div><div><span className="font-semibold text-foreground">{copy(language, 'Handoff', 'التسليم', 'Remise')}:</span> {mission.chainOfCustody.handoffDate || '—'} · {mission.chainOfCustody.handoffTo || '—'}</div><div><span className="font-semibold text-foreground">{copy(language, 'Storage', 'التخزين', 'Stockage')}:</span> {mission.chainOfCustody.storage}</div></div></div></div><div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-3 dark:border-emerald-900/70 dark:bg-emerald-950/10"><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{copy(language, 'Sample labels and offline completion', 'ملصقات العينات والإكمال دون اتصال', 'Étiquettes et réalisation hors ligne')}</div><Badge variant="outline">{mission.sampleLabels.length} {copy(language, 'labels', 'ملصقات', 'étiquettes')}</Badge></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{mission.sampleLabels.map(sample => <div key={sample.id} className="rounded-lg border border-border/70 bg-background/70 p-2"><div className="flex items-start justify-between gap-2"><div><div className="text-xs font-semibold">{sample.code}</div><div className="text-[10px] text-muted-foreground">{sample.stratum} · {sample.depthCm} cm</div></div><Badge variant={sample.status === 'collected' ? 'default' : sample.status === 'skipped' ? 'secondary' : 'outline'}>{getSamplingSampleStatusLabel(sample.status, language)}</Badge></div><div className="mt-2 flex items-center justify-between gap-2"><span className="text-[10px] text-muted-foreground">{sample.locationNote || copy(language, 'Coordinate note pending', 'ملاحظة الإحداثيات معلقة', 'Note de coordonnées en attente')}</span><Button type="button" size="sm" variant="outline" className="h-7 shrink-0 text-[10px]" onClick={() => toggleSample(mission, sample.id)}>{sample.status === 'collected' ? copy(language, 'Undo', 'تراجع', 'Annuler') : copy(language, 'Collected', 'تم الجمع', 'Prélevé')}</Button></div></div>)}</div></div><div className="flex flex-wrap items-center justify-between gap-2"><div className="text-[10px] text-muted-foreground">{mission.lastSyncedAt ? copy(language, `Last local sync mark: ${mission.lastSyncedAt}`, `آخر علامة مزامنة محلية: ${mission.lastSyncedAt}`, `Dernière marque de synchronisation locale : ${mission.lastSyncedAt}`) : copy(language, 'No sync mark yet; records remain on this device.', 'لا توجد علامة مزامنة بعد؛ تبقى السجلات على هذا الجهاز.', 'Aucune marque de synchronisation ; les dossiers restent sur cet appareil.')}</div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" className="h-8 text-[11px]" onClick={() => updateMission(mission.id, { status: mission.status === 'in-field' ? 'planned' : 'in-field' })}>{mission.status === 'in-field' ? copy(language, 'Return to planned', 'أعد إلى مخطط', 'Remettre en planifiée') : copy(language, 'Start field visit', 'ابدأ الزيارة الحقلية', 'Démarrer la visite')}</Button><Button type="button" className="h-8 bg-emerald-600 text-[11px] hover:bg-emerald-700" disabled={mission.offlineCompletedCount < mission.targetSamples} onClick={() => completeMission(mission)}><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />{copy(language, 'Complete mission', 'أكمل المهمة', 'Terminer la mission')}</Button><Button type="button" variant="outline" className="h-8 text-[11px]" onClick={() => syncMission(mission)}>{copy(language, 'Mark ready to sync', 'جاهز للمزامنة', 'Prêt à synchroniser')}</Button></div></div></div>)}</>}</CardContent></Card>
      <Card className="border-violet-200/70 dark:border-violet-900/70"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><WifiOff className="h-4 w-4 text-violet-600" />{copy(language, 'Offline sample capture', 'التقاط العينات دون اتصال', 'Capture d’échantillons hors ligne')}</CardTitle><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{copy(language, 'Record GPS, observations, photos, and optional results while offline. Saving a capture also marks the selected sample as collected.', 'سجل GPS والملاحظات والصور والنتائج الاختيارية أثناء عدم الاتصال. يحوّل حفظ الالتقاط العينة المختارة إلى حالة تم الجمع.', 'Enregistrez le GPS, les observations, les photos et les résultats facultatifs hors ligne. L’enregistrement marque aussi l’échantillon sélectionné comme prélevé.')}</p></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div><Label htmlFor="capture-mission" className="text-xs font-semibold">{copy(language, 'Sampling mission', 'مهمة أخذ العينات', 'Mission de prélèvement')}</Label><select id="capture-mission" className={`${inputClass} mt-1`} value={captureMissionId} onChange={event => { setCaptureMissionId(event.target.value); setCaptureSampleId(''); }}>{missions.length === 0 ? <option value="">{copy(language, 'Create a mission first', 'أنشئ مهمة أولاً', 'Créez d’abord une mission')}</option> : <><option value="">{copy(language, 'Select a mission', 'اختر مهمة', 'Choisir une mission')}</option>{missions.map(item => <option key={item.id} value={item.id}>{getSamplingObjectiveLabel(item.objective, language)} · {item.id.slice(-8)}</option>)}</>}</select></div><div><Label htmlFor="capture-sample" className="text-xs font-semibold">{copy(language, 'Sample label', 'ملصق العينة', 'Étiquette d’échantillon')}</Label><select id="capture-sample" className={`${inputClass} mt-1`} value={captureSampleId} onChange={event => setCaptureSampleId(event.target.value)}><option value="">{captureSamples.length === 0 ? copy(language, 'Select a mission first', 'اختر مهمة أولاً', 'Choisissez d’abord une mission') : copy(language, 'Select a sample', 'اختر عينة', 'Choisir un échantillon')}</option>{captureSamples.map(sample => <option key={sample.id} value={sample.id}>{sample.code} · {sample.depthCm} cm · {getSamplingSampleStatusLabel(sample.status, language)}</option>)}</select></div><div><Label htmlFor="capture-latitude" className="text-xs font-semibold">{copy(language, 'Latitude', 'خط العرض', 'Latitude')}</Label><Input id="capture-latitude" className="mt-1 h-9 text-xs" type="number" step="0.000001" value={captureLatitude} onChange={event => setCaptureLatitude(event.target.value)} /></div><div><Label htmlFor="capture-longitude" className="text-xs font-semibold">{copy(language, 'Longitude', 'خط الطول', 'Longitude')}</Label><Input id="capture-longitude" className="mt-1 h-9 text-xs" type="number" step="0.000001" value={captureLongitude} onChange={event => setCaptureLongitude(event.target.value)} /></div><div><Label htmlFor="capture-source" className="text-xs font-semibold">{copy(language, 'Result provenance', 'مصدر النتيجة', 'Provenance du résultat')}</Label><select id="capture-source" className={`${inputClass} mt-1`} value={captureResultSource} onChange={event => setCaptureResultSource(event.target.value as CaptureResultSource)}><option value="lab">{getEvidenceSourceLabel('lab', language)}</option><option value="field-test">{getEvidenceSourceLabel('field-test', language)}</option></select></div><div><Label htmlFor="capture-property" className="text-xs font-semibold">{copy(language, 'Result property', 'خاصية النتيجة', 'Propriété du résultat')}</Label><select id="capture-property" className={`${inputClass} mt-1`} value={captureProperty} onChange={event => { const next = event.target.value as SoilEvidenceProperty; setCaptureProperty(next); setCaptureUnit(next); }}>{PROPERTIES.map(item => <option key={item} value={item}>{getEvidencePropertyLabel(item, language)}</option>)}</select></div><div><Label htmlFor="capture-value" className="text-xs font-semibold">{copy(language, 'Result value (optional)', 'قيمة النتيجة (اختياري)', 'Valeur (facultative)')}</Label><Input id="capture-value" className="mt-1 h-9 text-xs" type="number" step="0.01" value={captureValue} onChange={event => setCaptureValue(event.target.value)} /></div><div><Label htmlFor="capture-unit" className="text-xs font-semibold">{copy(language, 'Result unit', 'وحدة النتيجة', 'Unité')}</Label><Input id="capture-unit" className="mt-1 h-9 text-xs" value={captureUnit} onChange={event => setCaptureUnit(event.target.value)} /></div><div><Label htmlFor="capture-by" className="text-xs font-semibold">{copy(language, 'Captured by', 'تم الالتقاط بواسطة', 'Prélevé par')}</Label><Input id="capture-by" className="mt-1 h-9 text-xs" placeholder={copy(language, 'Field technician', 'الفني الحقلي', 'Technicien terrain')} value={captureBy} onChange={event => setCaptureBy(event.target.value)} /></div><div className="sm:col-span-2"><Label htmlFor="capture-photos" className="text-xs font-semibold">{copy(language, 'Photo references (comma-separated)', 'مراجع الصور (مفصولة بفواصل)', 'Références photo (séparées par virgules)')}</Label><Input id="capture-photos" className="mt-1 h-9 text-xs" placeholder="IMG-001, IMG-002" value={capturePhotoRefs} onChange={event => setCapturePhotoRefs(event.target.value)} /></div><div className="sm:col-span-2"><Label htmlFor="capture-notes" className="text-xs font-semibold">{copy(language, 'Observation notes', 'ملاحظات المراقبة', 'Notes d’observation')}</Label><Input id="capture-notes" className="mt-1 h-9 text-xs" placeholder={copy(language, 'Waterlogging, crust, roots, or field context', 'الغمر أو القشرة أو الجذور أو سياق الحقل', 'Engorgement, croûte, racines ou contexte terrain')} value={captureObservationNotes} onChange={event => setCaptureObservationNotes(event.target.value)} /></div></div><div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-violet-300 bg-violet-50/60 px-3 py-2 dark:border-violet-800 dark:bg-violet-950/15"><span className="text-[11px] text-violet-900 dark:text-violet-100">{copy(language, 'No upload is attempted. The record stays on this device until you verify and import it.', 'لا تتم محاولة رفع. يبقى السجل على هذا الجهاز حتى تتحقق منه وتستورده.', 'Aucun envoi n’est tenté. Le dossier reste sur cet appareil jusqu’à vérification et import.')}</span><Button type="button" size="sm" onClick={saveOfflineCapture} className="h-8 gap-1.5 bg-violet-600 text-xs hover:bg-violet-700"><WifiOff className="h-3.5 w-3.5" />{copy(language, 'Save capture offline', 'احفظ الالتقاط دون اتصال', 'Enregistrer hors ligne')}</Button></div>{captures.length > 0 && <div className="space-y-2"><div className="flex items-center justify-between gap-2"><div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{copy(language, 'Capture queue', 'قائمة الالتقاط', 'File des captures')}</div><Badge variant="outline">{pendingCaptures.length} {copy(language, 'pending', 'معلقة', 'en attente')}</Badge></div><div className="grid gap-2 md:grid-cols-2">{captures.slice(0, 8).map(capture => <div key={offlineCaptureId(capture)} className="rounded-xl border border-border/70 bg-muted/10 p-3"><div className="flex items-start justify-between gap-2"><div><div className="text-xs font-semibold">{capture.sampleCode ?? capture.sampleLabelId}</div><div className="mt-1 text-[10px] text-muted-foreground">{capture.coordinates.latitude.toFixed(5)}, {capture.coordinates.longitude.toFixed(5)} · {capture.capturedAt.slice(0, 16).replace('T', ' ')}</div></div><Badge variant={capture.syncStatus === 'conflict' ? 'destructive' : capture.syncStatus === 'synced' ? 'default' : 'secondary'}>{captureStatusLabel(language, capture.syncStatus)}</Badge></div><p className="mt-2 line-clamp-2 text-[10px] text-muted-foreground">{capture.observationNotes || copy(language, 'No observation note.', 'لا توجد ملاحظة مراقبة.', 'Aucune note d’observation.')}</p></div>)}</div></div>}</CardContent></Card>

      <Card className="border-cyan-200/70 dark:border-cyan-900/70"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><CloudUpload className="h-4 w-4 text-cyan-600" />{copy(language, 'Import to Evidence Register', 'استيراد إلى سجل الأدلة', 'Importer dans le registre des preuves')}</CardTitle><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{copy(language, 'Review the local reconciliation preview before adding field collections to the evidence register. Matching property, location, date, and depth are skipped; differing results are held as conflicts.', 'راجع معاينة المطابقة المحلية قبل إضافة العينات الحقلية إلى سجل الأدلة. يتم تجاوز التطابق في الخاصية والموقع والتاريخ والعمق؛ أما النتائج المختلفة فتُحجز كتعارضات.', 'Vérifiez l’aperçu de rapprochement local avant d’ajouter les prélèvements au registre. Les correspondances propriété, lieu, date et profondeur sont ignorées ; les valeurs différentes sont retenues comme conflits.')}</p></CardHeader><CardContent className="space-y-3"><div className="grid gap-2 sm:grid-cols-3"><Metric label={copy(language, 'New entries', 'إدخالات جديدة', 'Nouvelles entrées')} value={String(reconciliation.toImport.length)} tone={reconciliation.toImport.length > 0 ? 'good' : 'warn'} /><Metric label={copy(language, 'Duplicates skipped', 'التكرارات المتجاوزة', 'Doublons ignorés')} value={String(reconciliation.duplicates.length)} /><Metric label={copy(language, 'Conflicts', 'التعارضات', 'Conflits')} value={String(reconciliation.conflicts.length)} tone={reconciliation.conflicts.length > 0 ? 'danger' : 'good'} /></div>{reconciliation.conflicts.length > 0 && <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50/70 p-3 text-[11px] text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{copy(language, `${reconciliation.conflicts.length} capture(s) match an existing sample identity but have a different result. They are not imported automatically.`, `هناك ${reconciliation.conflicts.length} التقاط يطابق هوية عينة موجودة لكن نتيجته مختلفة. لن يتم استيراده تلقائياً.`, `${reconciliation.conflicts.length} capture(s) correspondent à une identité existante mais portent une valeur différente. Elles ne sont pas importées automatiquement.`)}</span></div>}{reconciliation.toImport.length > 0 && <div className="rounded-xl border border-cyan-200 bg-cyan-50/60 p-3 text-[11px] text-cyan-950 dark:border-cyan-900 dark:bg-cyan-950/20 dark:text-cyan-100">{copy(language, 'Verified captures will keep their GPS, collector, timestamp, sample depth, and lab or field-test provenance in the evidence notes.', 'ستحتفظ العينات الموثقة بإحداثيات GPS والجامع والوقت وعمق العينة ومصدر المختبر أو الاختبار الحقلي في ملاحظات الدليل.', 'Les prélèvements vérifiés conservent le GPS, le préleveur, l’horodatage, la profondeur et la provenance laboratoire ou terrain dans les notes.')}</div>}<div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] text-muted-foreground">{captures.length === 0 ? copy(language, 'Capture a sample first to create an import preview.', 'التقط عينة أولاً لإنشاء معاينة استيراد.', 'Capturez d’abord un échantillon pour créer un aperçu.') : copy(language, 'Import is local-first and idempotent: the same capture cannot create a second evidence card.', 'الاستيراد محلي أولاً ومتكرر آمن: لا يمكن للالتقاط نفسه إنشاء بطاقة دليل ثانية.', 'L’import est local d’abord et idempotent : le même prélèvement ne crée pas une seconde carte.')}</span><Button type="button" size="sm" onClick={importVerifiedCaptures} disabled={reconciliation.toImport.length === 0} className="h-8 gap-1.5 bg-cyan-600 text-xs hover:bg-cyan-700"><RefreshCw className="h-3.5 w-3.5" />{copy(language, 'Import verified captures', 'استورد العينات الموثقة', 'Importer les captures vérifiées')}</Button></div></CardContent></Card>
    </div>
  );
}
