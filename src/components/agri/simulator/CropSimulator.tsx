'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, ChevronDown, CircleDollarSign, CloudRain, Droplets, FlaskConical, Leaf, Plus, Printer, RefreshCw, ShieldAlert, Trash2, TrendingDown, TrendingUp, Users, Wheat, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation, copyFor, type Language } from '@/lib/language-store';
import {
  createDefaultSimulatorScenario,
  calculateCropSimulator,
  formatSimulatorDzd,
  formatSimulatorNumber,
  getPhytoOptionsForCrop,
  getSimulatorCategoryLabel,
  getSimulatorCropProfiles,
  SIMULATOR_COST_CATEGORIES,
  SIMULATOR_REVENUE_CATEGORIES,
  type SimulatorCostCategory,
  type SimulatorCostLineItem,
  type SimulatorLineCategory,
  type SimulatorPhytoSelection,
  type SimulatorRiskScenario,
  type SimulatorScenario,
} from '@/lib/crop-simulator';
import { fetchPhytoIndex, productActiveName, type PhytoProduct } from '@/lib/phyto-index';

const STORAGE_KEY = 'formula-atlas-crop-simulator-v1';
const inputClass = 'h-10 rounded-lg border-input bg-background text-sm';
const selectClass = 'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm';

function tr(language: Language, english: string, arabic: string, french: string): string {
  return copyFor(language, english, arabic, french);
}

function cropLabel(language: Language, cropId: string, fallback: string): string {
  const labels: Record<string, [string, string, string]> = {
    wheat: ['Wheat', 'القمح', 'Blé'], barley: ['Barley', 'الشعير', 'Orge'], maize: ['Maize', 'الذرة', 'Maïs'], potato: ['Potato', 'البطاطا', 'Pomme de terre'], tomato: ['Tomato', 'الطماطم', 'Tomate'], onion: ['Onion', 'البصل', 'Oignon'], sunflower: ['Sunflower', 'عباد الشمس', 'Tournesol'], canola: ['Canola', 'اللفت الزيتي', 'Colza'], alfalfa: ['Alfalfa', 'الفصة', 'Luzerne'], sorghum: ['Sorghum', 'الذرة الرفيعة', 'Sorgho'], soybean: ['Soybean', 'فول الصويا', 'Soja'], grapes: ['Grapes', 'العنب', 'Raisin'], citrus: ['Citrus', 'الحمضيات', 'Agrumes'], apple: ['Apple', 'التفاح', 'Pomme'], lettuce: ['Lettuce', 'الخس', 'Laitue'], cucumber: ['Cucumber', 'الخيار', 'Concombre'], 'bell-pepper': ['Bell pepper', 'الفلفل', 'Poivron'],
  };
  const value = labels[cropId];
  return value ? tr(language, value[0], value[1], value[2]) : fallback;
}

function localizedCategory(language: Language, category: SimulatorLineCategory): string {
  const labels: Record<SimulatorLineCategory, [string, string, string]> = {
    seed: ['Seed / planting material', 'البذور / مواد الغرس', 'Semences / plants'],
    fertilizer: ['Fertilizer and amendments', 'الأسمدة ومحسنات التربة', 'Engrais et amendements'],
    crop_protection: ['Crop protection', 'حماية المحصول', 'Protection des cultures'],
    irrigation: ['Water and irrigation', 'الماء والري', 'Eau et irrigation'],
    fuel: ['Fuel and energy', 'الوقود والطاقة', 'Carburant et énergie'],
    labor: ['Labor', 'اليد العاملة', 'Main-d’œuvre'],
    rent: ['Land rent', 'إيجار الأرض', 'Location de la terre'],
    machinery: ['Machinery and equipment', 'الآلات والمعدات', 'Machines et équipements'],
    other_cost: ['Other field costs', 'تكاليف الحقل الأخرى', 'Autres coûts de parcelle'],
    household_overhead: ['Allocated household overhead', 'المصاريف المنزلية الموزعة', 'Frais généraux du ménage affectés'],
    subsidy: ['Subsidy', 'الدعم', 'Subvention'],
    other_revenue: ['Other revenue', 'إيرادات أخرى', 'Autres revenus'],
  };
  return tr(language, ...labels[category]);
}

function InputLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return <label className="block text-xs font-semibold text-foreground">{children}{hint && <span className="ml-1 font-normal text-muted-foreground">({hint})</span>}</label>;
}

function MetricCard({ label, value, detail, tone = 'emerald', icon: Icon }: { label: string; value: string; detail?: string; tone?: 'emerald' | 'amber' | 'blue' | 'rose'; icon: typeof CircleDollarSign }) {
  const tones = { emerald: 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30', amber: 'border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30', blue: 'border-blue-200 bg-blue-50/80 dark:border-blue-900 dark:bg-blue-950/30', rose: 'border-rose-200 bg-rose-50/80 dark:border-rose-900 dark:bg-rose-950/30' };
  const iconTones = { emerald: 'text-emerald-700 dark:text-emerald-300', amber: 'text-amber-700 dark:text-amber-300', blue: 'text-blue-700 dark:text-blue-300', rose: 'text-rose-700 dark:text-rose-300' };
  return <div className={`rounded-xl border p-4 ${tones[tone]}`}><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-muted-foreground">{label}</span><Icon className={`h-4 w-4 ${iconTones[tone]}`} /></div><div className="mt-2 text-xl font-black tracking-tight">{value}</div>{detail && <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>}</div>;
}

function SectionHeading({ step, icon: Icon, title, description }: { step: string; icon: typeof Leaf; title: string; description: string }) {
  return <div className="flex items-start gap-3 border-b border-border pb-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><Icon className="h-4 w-4" /></div><div><div className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">{step}</div><h3 className="font-bold">{title}</h3><p className="mt-0.5 text-xs text-muted-foreground">{description}</p></div></div>;
}

function ProgressBar({ value, max = 100, tone = 'emerald' }: { value: number; max?: number; tone?: 'emerald' | 'amber' | 'rose' }) {
  const color = tone === 'rose' ? 'bg-rose-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-emerald-600';
  return <div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0))}%` }} /></div>;
}

export function CropSimulator() {
  const { language, isRTL } = useTranslation();
  const [scenario, setScenario] = useState<SimulatorScenario>(() => createDefaultSimulatorScenario());
  const [phytoIndex, setPhytoIndex] = useState<PhytoProduct[]>([]);
  const [phytoSearch, setPhytoSearch] = useState('');
  const [phytoLoading, setPhytoLoading] = useState(false);
  const [showAllWeeks, setShowAllWeeks] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const profiles = useMemo(() => getSimulatorCropProfiles(), []);
  const result = useMemo(() => calculateCropSimulator(scenario), [scenario]);
  const phytoRecommendations = useMemo(() => getPhytoOptionsForCrop(scenario.cropId), [scenario.cropId]);
  const chosenProductIds = useMemo(() => new Set(scenario.phytoProducts.map((item) => item.productId)), [scenario.phytoProducts]);
  const selectedProfile = profiles.find((profile) => profile.cropId === scenario.cropId) ?? profiles[0];
  const selectedActiveIds = useMemo(() => new Set(phytoRecommendations.map((item) => item.activeMatter.activeSubstance.toLowerCase())), [phytoRecommendations]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setScenario(JSON.parse(saved) as SimulatorScenario);
    } catch {
      // Use the deterministic defaults when local storage is unavailable or invalid.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPhytoLoading(true);
    fetchPhytoIndex().then((products) => {
      if (!cancelled) setPhytoIndex(products);
    }).catch(() => {
      if (!cancelled) setPhytoIndex([]);
    }).finally(() => {
      if (!cancelled) setPhytoLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const filteredPhytoProducts = useMemo(() => {
    const query = phytoSearch.trim().toLowerCase();
    const cropTerms = [scenario.cropId, selectedProfile?.cropName ?? ''].map((value) => value.toLowerCase());
    const matches = phytoIndex.filter((product) => {
      const haystack = `${product.brand} ${product.active} ${product.active_raw} ${product.homologation} ${product.usage.join(' ')}`.toLowerCase();
      const textMatch = !query || haystack.includes(query);
      const cropMatch = !cropTerms.length || product.usage.length === 0 || cropTerms.some((term) => term && product.usage.some((usage) => usage.toLowerCase().includes(term)));
      return textMatch && cropMatch;
    });
    return (query ? matches : matches.filter((product) => selectedActiveIds.has(productActiveName(product).toLowerCase()) || product.usage.length > 0)).slice(0, 40);
  }, [phytoIndex, phytoSearch, scenario.cropId, selectedProfile?.cropName, selectedActiveIds]);

  const updateScenario = (patch: Partial<SimulatorScenario>) => setScenario((current) => ({ ...current, ...patch }));

  const handleCropChange = (cropId: string) => {
    const next = createDefaultSimulatorScenario(cropId, scenario.plantingDate, scenario.areaHa);
    updateScenario({ ...next, id: scenario.id, overheadAllocationPct: scenario.overheadAllocationPct });
  };

  const updateCost = (id: string, patch: Partial<SimulatorCostLineItem>) => {
    updateScenario({ costs: scenario.costs.map((item) => item.id === id ? { ...item, ...patch } : item) });
  };

  const addCost = (category: SimulatorLineCategory = 'other_cost') => {
    const isHousehold = category === 'household_overhead';
    const item: SimulatorCostLineItem = {
      id: `user-${category}-${Date.now()}`,
      category,
      label: isHousehold ? tr(language, 'Household expense', 'مصروف منزلي', 'Dépense du ménage') : tr(language, 'New field cost', 'تكلفة حقل جديدة', 'Nouveau coût de parcelle'),
      amount: 0,
      basis: isHousehold ? 'field_total' : 'per_ha',
      isHouseholdOverhead: isHousehold,
      source: 'user',
    };
    updateScenario({ costs: [...scenario.costs, item] });
  };

  const removeCost = (id: string) => updateScenario({ costs: scenario.costs.filter((item) => item.id !== id) });

  const addPhytoProduct = (product: PhytoProduct) => {
    if (chosenProductIds.has(product.homologation)) return;
    const item: SimulatorPhytoSelection = {
      id: `phyto-${product.homologation}-${Date.now()}`,
      productId: product.homologation,
      productName: product.brand || product.homologation,
      activeSubstance: productActiveName(product),
      applications: 1,
      pricePerApplication: 0,
      basis: 'per_ha',
      source: 'inpv-2017',
    };
    updateScenario({ phytoProducts: [...scenario.phytoProducts, item] });
    setPhytoSearch('');
  };

  const updatePhyto = (id: string, patch: Partial<SimulatorPhytoSelection>) => updateScenario({ phytoProducts: scenario.phytoProducts.map((item) => item.id === id ? { ...item, ...patch } : item) });
  const removePhyto = (id: string) => updateScenario({ phytoProducts: scenario.phytoProducts.filter((item) => item.id !== id) });
  const updateRisk = (id: string, patch: Partial<SimulatorRiskScenario>) => updateScenario({ risks: scenario.risks.map((risk) => risk.id === id ? { ...risk, ...patch } : risk) });

  const saveScenario = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scenario));
      setSavedNotice(true);
      window.setTimeout(() => setSavedNotice(false), 2400);
    } catch {
      setSavedNotice(false);
    }
  };

  const resetScenario = () => setScenario(createDefaultSimulatorScenario('wheat', scenario.plantingDate, scenario.areaHa));
  const visibleWeeks = showAllWeeks ? result.laborCalendar : result.laborCalendar.slice(0, 8);
  const maxCost = Math.max(...result.costBreakdown.filter((item) => item.category !== 'subsidy' && item.category !== 'other_revenue').map((item) => item.amount), 1);
  const baseMarket = result.marketPoints.find((point) => point.id === 'base');

  return <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6 pb-12 print:space-y-3">
    <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 p-5 text-white shadow-lg sm:p-7 print:bg-white print:text-black print:shadow-none">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-3xl"><div className="mb-3 flex flex-wrap items-center gap-2"><Badge className="border-white/20 bg-white/15 text-white">{tr(language, 'Algeria-aware · DZD', 'مهيّأ للجزائر · دج', 'Adapté à l’Algérie · DZD')}</Badge><Badge className="border-white/20 bg-white/15 text-white">{tr(language, 'Scenario planning', 'تخطيط السيناريوهات', 'Planification par scénarios')}</Badge></div><h2 className="text-2xl font-black tracking-tight sm:text-3xl">{tr(language, 'Crop Business Simulator', 'محاكي أعمال المحاصيل', 'Simulateur économique des cultures')}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/90">{tr(language, 'Turn a crop idea into a transparent field budget: calendar-driven labor, water, INPV protection choices, household overhead, yield uncertainty, and the selling price you need.', 'حوّل فكرة المحصول إلى ميزانية حقل شفافة: يد عاملة وماء حسب التقويم، خيارات حماية من فهرس INPV، مصاريف منزلية، عدم يقين المردود، وسعر البيع المطلوب.', 'Transformez une idée de culture en budget de parcelle transparent : main-d’œuvre et eau calées sur le calendrier, produits INPV, frais du ménage, incertitude du rendement et prix de vente nécessaire.')}</p></div>
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4"><div className="rounded-xl bg-white/10 p-3"><div className="text-emerald-100">{tr(language, 'Area', 'المساحة', 'Surface')}</div><div className="mt-1 font-bold">{formatSimulatorNumber(scenario.areaHa, 2)} ha</div></div><div className="rounded-xl bg-white/10 p-3"><div className="text-emerald-100">{tr(language, 'Crop', 'المحصول', 'Culture')}</div><div className="mt-1 font-bold">{selectedProfile?.emoji} {cropLabel(language, scenario.cropId, selectedProfile?.cropName ?? scenario.cropId)}</div></div><div className="rounded-xl bg-white/10 p-3"><div className="text-emerald-100">{tr(language, 'Field cost', 'تكلفة الحقل', 'Coût parcelle')}</div><div className="mt-1 font-bold">{formatSimulatorDzd(result.totalCost)}</div></div><div className="rounded-xl bg-white/10 p-3"><div className="text-emerald-100">{tr(language, 'Break-even', 'نقطة التعادل', 'Seuil de rentabilité')}</div><div className="mt-1 font-bold">{formatSimulatorDzd(result.breakEvenPricePerT)}/t</div></div></div>
      </div>
    </div>

    <div className="grid gap-3 rounded-xl border border-border bg-card p-3 sm:grid-cols-5 print:hidden">{[
      [tr(language, '1. Setup', '١. الإعداد', '1. Réglages'), tr(language, 'Crop, area, date', 'المحصول والمساحة والتاريخ', 'Culture, surface, date')],
      [tr(language, '2. Calendar', '٢. التقويم', '2. Calendrier'), tr(language, 'Labor and water', 'اليد العاملة والماء', 'Main-d’œuvre et eau')],
      [tr(language, '3. Costs', '٣. التكاليف', '3. Coûts'), tr(language, 'Field + home', 'الحقل والمنزل', 'Parcelle + ménage')],
      [tr(language, '4. Market', '٤. السوق', '4. Marché'), tr(language, 'Yield and price', 'المردود والسعر', 'Rendement et prix')],
      [tr(language, '5. Decision', '٥. القرار', '5. Décision'), tr(language, 'Profit and risk', 'الربح والمخاطر', 'Profit et risque')],
    ].map(([title, detail], index) => <div key={title} className={`rounded-lg px-3 py-2 ${index === 4 ? 'bg-emerald-100 dark:bg-emerald-950/50' : 'bg-muted/50'}`}><div className="text-xs font-bold">{title}</div><div className="mt-0.5 text-[11px] text-muted-foreground">{detail}</div></div>)}</div>

    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <SectionHeading step={tr(language, 'Step 1', 'الخطوة ١', 'Étape 1')} icon={Wheat} title={tr(language, 'Define the field and crop', 'حدّد الحقل والمحصول', 'Définir la parcelle et la culture')} description={tr(language, 'Choose a crop to regenerate the labor and irrigation budget from FormulaAtlas lifecycle data.', 'اختر محصولًا لإعادة توليد ميزانية اليد العاملة والري من بيانات دورة المحصول في FormulaAtlas.', 'Choisissez une culture pour régénérer la main-d’œuvre et l’irrigation à partir des données de cycle FormulaAtlas.')} />
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div><InputLabel>{tr(language, 'Crop', 'المحصول', 'Culture')}</InputLabel><select className={`${selectClass} mt-1`} value={scenario.cropId} onChange={(event) => handleCropChange(event.target.value)}>{profiles.map((profile) => <option key={profile.cropId} value={profile.cropId}>{profile.emoji} {cropLabel(language, profile.cropId, profile.cropName)}</option>)}</select></div>
        <div><InputLabel hint="ha">{tr(language, 'Field area', 'مساحة الحقل', 'Surface de la parcelle')}</InputLabel><Input className={`${inputClass} mt-1`} type="number" min="0.01" step="0.1" value={scenario.areaHa} onChange={(event) => updateScenario({ areaHa: Number(event.target.value) })} /></div>
        <div><InputLabel>{tr(language, 'Planting date', 'تاريخ الزراعة', 'Date de semis')}</InputLabel><Input className={`${inputClass} mt-1`} type="date" value={scenario.plantingDate} onChange={(event) => updateScenario({ plantingDate: event.target.value })} /></div>
        <div><InputLabel>{tr(language, 'Irrigation mode', 'نمط الري', 'Mode d’irrigation')}</InputLabel><select className={`${selectClass} mt-1`} value={scenario.irrigationSystem} onChange={(event) => updateScenario({ irrigationSystem: event.target.value as SimulatorScenario['irrigationSystem'] })}><option value="rainfed">{tr(language, 'Rainfed + supplemental', 'مطري + تكميلي', 'Pluvial + complément')}</option><option value="drip">{tr(language, 'Drip', 'تنقيط', 'Goutte-à-goutte')}</option><option value="sprinkler">{tr(language, 'Sprinkler', 'رشاش', 'Aspersion')}</option><option value="furrow">{tr(language, 'Furrow / surface', 'ري سطحي', 'Raie / gravitaire')}</option></select></div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3"><div><InputLabel hint="mm/day">{tr(language, 'Average ET₀', 'المتبخر-نتح المرجعي', 'ET₀ moyen')}</InputLabel><Input className={`${inputClass} mt-1`} type="number" min="0" step="0.1" value={scenario.avgET0} onChange={(event) => updateScenario({ avgET0: Number(event.target.value) })} /></div><div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs dark:border-amber-900 dark:bg-amber-950/20 md:col-span-2"><div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-200"><CloudRain className="h-4 w-4" />{tr(language, 'Algeria planning note', 'ملاحظة تخطيط للجزائر', 'Note de planification Algérie')}</div><p className="mt-1 leading-5 text-amber-900/80 dark:text-amber-100/80">{tr(language, 'The default crop price is an editable planning reference. Rainfed fields should be tested against drought; subsidized inputs and energy are not assumed to be free.', 'السعر الافتراضي للمحصول مرجع قابل للتعديل. يجب اختبار الحقول المطرية ضد الجفاف؛ ولا نفترض أن المدخلات والطاقة المدعومة مجانية.', 'Le prix par défaut est une référence modifiable. Les parcelles pluviales doivent être testées contre la sécheresse ; les intrants et l’énergie subventionnés ne sont pas supposés gratuits.')}</p></div></div>
    </div>

    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <SectionHeading step={tr(language, 'Step 2', 'الخطوة ٢', 'Étape 2')} icon={CalendarDays} title={tr(language, 'Review the generated season budget', 'راجع ميزانية الموسم المولدة', 'Vérifier le budget de saison généré')} description={tr(language, 'Labor dates and irrigation volume come from the selected crop lifecycle. The DZD rates remain fully editable.', 'تواريخ اليد العاملة وحجم الري مستمدة من دورة المحصول. تبقى معدلات الدينار قابلة للتعديل بالكامل.', 'Les dates de main-d’œuvre et le volume d’eau viennent du cycle de la culture. Les tarifs en DZD restent entièrement modifiables.')} />
      <div className="mt-5 grid gap-3 sm:grid-cols-3"><MetricCard label={tr(language, 'Season labor', 'يد عاملة الموسم', 'Main-d’œuvre saison')} value={`${formatSimulatorNumber(result.totalSeasonLaborDays, 1)} ${tr(language, 'days', 'يوم', 'jours')}`} detail={tr(language, 'Calendar operations × field area', 'عمليات التقويم × مساحة الحقل', 'Opérations du calendrier × surface')} tone="blue" icon={Users} /><MetricCard label={tr(language, 'Season irrigation', 'ري الموسم', 'Irrigation saison')} value={`${formatSimulatorNumber(result.totalSeasonIrrigationM3, 0)} m³`} detail={tr(language, 'ETc × efficiency × area', 'البخر-نتح × الكفاءة × المساحة', 'ETc × efficacité × surface')} tone="blue" icon={Droplets} /><MetricCard label={tr(language, 'Crop reference', 'مرجع المحصول', 'Référence culture')} value={formatSimulatorDzd(selectedProfile?.referencePricePerT ?? 0)} detail={selectedProfile?.note} tone="amber" icon={CircleDollarSign} /></div>
      <div className="mt-5 overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[680px] text-left text-xs"><thead className="bg-muted/60 text-muted-foreground"><tr><th className="p-3">{tr(language, 'Week', 'الأسبوع', 'Semaine')}</th><th className="p-3">{tr(language, 'Date / stage', 'التاريخ / المرحلة', 'Date / stade')}</th><th className="p-3">{tr(language, 'Labor operations', 'عمليات اليد العاملة', 'Opérations de main-d’œuvre')}</th><th className="p-3">{tr(language, 'Water', 'الماء', 'Eau')}</th><th className="p-3">{tr(language, 'Risks', 'المخاطر', 'Risques')}</th></tr></thead><tbody>{visibleWeeks.map((week) => <tr key={week.week} className="border-t border-border align-top"><td className="p-3 font-bold">{week.week}</td><td className="p-3"><div className="font-semibold">{week.stageEmoji} {week.stage}</div><div className="mt-1 text-muted-foreground">{week.date}</div></td><td className="p-3">{week.labor.length ? week.labor.map((labor) => labor.task).join(' · ') : <span className="text-muted-foreground">{tr(language, 'Monitor / routine work', 'متابعة / عمل روتيني', 'Suivi / travail courant')}</span>}</td><td className="p-3"><div>{formatSimulatorNumber(week.irrigation.etc, 0)} mm</div><div className="mt-1 text-muted-foreground">{week.irrigation.note}</div></td><td className="p-3">{week.risks.length ? <Badge variant="outline" className="border-amber-300 text-amber-700">{week.risks.length} {tr(language, 'watch', 'للمراقبة', 'à surveiller')}</Badge> : <span className="text-muted-foreground">—</span>}</td></tr>)}</tbody></table></div>
      {result.laborCalendar.length > 8 && <Button variant="ghost" className="mt-3 w-full gap-2 text-xs" onClick={() => setShowAllWeeks((current) => !current)}>{showAllWeeks ? tr(language, 'Show fewer weeks', 'عرض أسابيع أقل', 'Afficher moins de semaines') : tr(language, `Show all ${result.laborCalendar.length} weeks`, `عرض كل الأسابيع (${result.laborCalendar.length})`, `Afficher les ${result.laborCalendar.length} semaines`)}<ChevronDown className={`h-4 w-4 transition-transform ${showAllWeeks ? 'rotate-180' : ''}`} /></Button>}
    </div>

    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <SectionHeading step={tr(language, 'Step 3', 'الخطوة ٣', 'Étape 3')} icon={CircleDollarSign} title={tr(language, 'Edit every cost — including the household share', 'عدّل كل تكلفة — بما فيها حصة المنزل', 'Modifier chaque coût — y compris la part du ménage')} description={tr(language, 'Add, remove, rename, and price any line. Household expenses are allocated to the field transparently.', 'أضف واحذف وأعد تسمية وتسعير أي بند. تُوزّع مصاريف المنزل على الحقل بشفافية.', 'Ajoutez, supprimez, renommez et chiffrez chaque ligne. Les dépenses du ménage sont affectées à la parcelle en toute transparence.')} />
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="text-xs text-muted-foreground">{tr(language, 'Rates marked per ha scale with the field. Household totals use the allocation percentage below.', 'المعدلات المحددة لكل هكتار تتناسب مع المساحة. تستخدم إجماليات المنزل نسبة التوزيع أدناه.', 'Les montants par hectare évoluent avec la surface. Les totaux du ménage utilisent le taux d’affectation ci-dessous.')}</div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" className="gap-1.5" onClick={() => addCost('other_cost')}><Plus className="h-3.5 w-3.5" />{tr(language, 'Add cost', 'إضافة تكلفة', 'Ajouter un coût')}</Button><Button variant="outline" size="sm" className="gap-1.5" onClick={() => addCost('household_overhead')}><Users className="h-3.5 w-3.5" />{tr(language, 'Add home expense', 'إضافة مصروف منزلي', 'Ajouter une dépense ménage')}</Button></div></div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-muted/60 text-muted-foreground"><tr><th className="p-3">{tr(language, 'Line item', 'البند', 'Poste')}</th><th className="p-3">{tr(language, 'Category', 'الفئة', 'Catégorie')}</th><th className="p-3">{tr(language, 'Amount', 'المبلغ', 'Montant')}</th><th className="p-3">{tr(language, 'Basis', 'الأساس', 'Base')}</th><th className="p-3">{tr(language, 'Field impact', 'أثر الحقل', 'Impact parcelle')}</th><th className="p-3" /></tr></thead><tbody>{scenario.costs.map((item) => { const isRevenue = item.category === 'subsidy' || item.category === 'other_revenue'; const amount = isRevenue ? item.amount * (item.basis === 'per_ha' ? scenario.areaHa : 1) : item.category === 'household_overhead' || item.isHouseholdOverhead ? item.amount * (item.basis === 'per_ha' ? scenario.areaHa : 1) * Math.min(100, Math.max(0, scenario.overheadAllocationPct)) / 100 : item.amount * (item.basis === 'per_ha' ? scenario.areaHa : 1); return <tr key={item.id} className="border-t border-border align-middle"><td className="p-2"><Input className="h-9 min-w-[190px]" value={item.label} onChange={(event) => updateCost(item.id, { label: event.target.value })} /></td><td className="p-2"><select className="h-9 min-w-[165px] rounded-md border border-input bg-background px-2" value={item.category} onChange={(event) => updateCost(item.id, { category: event.target.value as SimulatorLineCategory, isHouseholdOverhead: event.target.value === 'household_overhead' })}>{SIMULATOR_COST_CATEGORIES.map((category) => <option key={category} value={category}>{localizedCategory(language, category)}</option>)}<option disabled>────────</option>{SIMULATOR_REVENUE_CATEGORIES.map((category) => <option key={category} value={category}>{localizedCategory(language, category)}</option>)}</select></td><td className="p-2"><Input className="h-9 w-32" type="number" min="0" step="100" value={item.amount} onChange={(event) => updateCost(item.id, { amount: Number(event.target.value) })} /></td><td className="p-2"><select className="h-9 rounded-md border border-input bg-background px-2" value={item.basis} onChange={(event) => updateCost(item.id, { basis: event.target.value as SimulatorCostLineItem['basis'] })}><option value="per_ha">{tr(language, 'DZD / ha', 'دج / هكتار', 'DZD / ha')}</option><option value="field_total">{tr(language, 'Field total', 'إجمالي الحقل', 'Total parcelle')}</option></select></td><td className={`p-2 font-bold ${isRevenue ? 'text-emerald-700' : item.category === 'household_overhead' || item.isHouseholdOverhead ? 'text-amber-700' : 'text-foreground'}`}>{formatSimulatorDzd(amount)}</td><td className="p-2 text-right"><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-rose-600" aria-label={tr(language, 'Remove line', 'حذف البند', 'Supprimer la ligne')} onClick={() => removeCost(item.id)}><Trash2 className="h-4 w-4" /></Button></td></tr>; })}</tbody></table></div>
      <div className="mt-4 grid gap-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/20 md:grid-cols-[1fr_180px]"><div><div className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-100"><Users className="h-4 w-4" />{tr(language, 'Household overhead allocation', 'توزيع المصاريف المنزلية', 'Affectation des frais du ménage')}</div><p className="mt-1 text-xs leading-5 text-amber-900/80 dark:text-amber-100/80">{tr(language, 'Allocate only the field’s fair share of electricity, car, doctor, phone, food, or other shared household costs. The total household amount stays visible; only the chosen percentage enters the field budget.', 'وزّع فقط الحصة العادلة للحقل من الكهرباء والسيارة والطبيب والهاتف والغذاء أو المصاريف المنزلية المشتركة. يبقى إجمالي المنزل ظاهرًا؛ وتدخل النسبة المختارة فقط في ميزانية الحقل.', 'Affectez seulement la part équitable de la parcelle dans l’électricité, la voiture, le médecin, le téléphone, l’alimentation ou les autres dépenses partagées. Le total du ménage reste visible ; seul le pourcentage choisi entre dans le budget.')}</p></div><div><InputLabel hint="%">{tr(language, 'Allocated to this field', 'المخصص لهذا الحقل', 'Affecté à cette parcelle')}</InputLabel><Input className={`${inputClass} mt-1 bg-background`} type="number" min="0" max="100" step="1" value={scenario.overheadAllocationPct} onChange={(event) => updateScenario({ overheadAllocationPct: Number(event.target.value) })} /></div></div>
    </div>

    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <SectionHeading step={tr(language, 'Step 3b', 'الخطوة ٣ ب', 'Étape 3b')} icon={FlaskConical} title={tr(language, 'Choose INPV phytosanitary products', 'اختر منتجات الصحة النباتية من INPV', 'Choisir les produits phytosanitaires INPV')} description={tr(language, 'Search the loaded Algerian index, select a product, then enter the real price per application you pay.', 'ابحث في الفهرس الجزائري المحمّل، اختر منتجًا، ثم أدخل السعر الحقيقي لكل معاملة.', 'Recherchez dans l’index algérien chargé, sélectionnez un produit, puis saisissez le prix réel par application.')} />
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div><div className="flex items-center justify-between gap-2"><InputLabel>{tr(language, 'Product search', 'بحث المنتجات', 'Recherche produit')}</InputLabel>{phytoLoading && <span className="text-[11px] text-muted-foreground">{tr(language, 'Loading INPV index…', 'جار تحميل فهرس INPV…', 'Chargement de l’index INPV…')}</span>}</div><div className="relative mt-1"><Input className={`${inputClass} pr-9`} placeholder={tr(language, 'Brand, active matter, homologation…', 'العلامة، المادة الفعالة، رقم الاعتماد…', 'Marque, matière active, homologation…')} value={phytoSearch} onChange={(event) => setPhytoSearch(event.target.value)} /><FlaskConical className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /></div><div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-border">{filteredPhytoProducts.length ? filteredPhytoProducts.map((product) => <button type="button" key={`${product.homologation}-${product.brand}`} disabled={chosenProductIds.has(product.homologation)} onClick={() => addPhytoProduct(product)} className="flex w-full items-start justify-between gap-3 border-b border-border p-3 text-left text-xs last:border-b-0 hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50"><div><div className="font-bold">{product.brand || product.homologation}</div><div className="mt-1 text-muted-foreground">{productActiveName(product)} · {product.formulation || tr(language, 'formulation not listed', 'الصيغة غير مذكورة', 'formulation non indiquée')}</div><div className="mt-1 text-[10px] text-muted-foreground">{product.homologation} · {product.usage.slice(0, 3).join(', ')}</div></div><Plus className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /></button>) : <div className="p-4 text-xs text-muted-foreground">{phytoLoading ? tr(language, 'Loading products…', 'جار تحميل المنتجات…', 'Chargement des produits…') : tr(language, 'No products found. Try a broader search.', 'لم يتم العثور على منتجات. جرّب بحثًا أوسع.', 'Aucun produit trouvé. Élargissez la recherche.')}</div>}</div><div className="mt-3 rounded-lg bg-muted/50 p-3 text-[11px] leading-5 text-muted-foreground"><strong>{tr(language, 'Suggested active matters:', 'المواد الفعالة المقترحة:', 'Matières actives suggérées :')}</strong> {phytoRecommendations.slice(0, 5).map((option) => option.activeMatter.activeSubstance).join(' · ') || tr(language, 'No crop-specific recommendation loaded.', 'لا توجد توصية خاصة بالمحصول.', 'Aucune recommandation liée à la culture.')}</div></div>
        <div><div className="flex items-center justify-between"><InputLabel>{tr(language, 'Selected applications', 'المعاملات المختارة', 'Applications sélectionnées')}</InputLabel><Badge variant="outline">{scenario.phytoProducts.length}</Badge></div><div className="mt-1 space-y-2">{scenario.phytoProducts.length ? scenario.phytoProducts.map((product) => <div key={product.id} className="rounded-xl border border-border p-3"><div className="flex items-start justify-between gap-2"><div><div className="text-sm font-bold">{product.productName}</div><div className="text-[11px] text-muted-foreground">{product.activeSubstance} · {product.productId}</div></div><Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-rose-600" onClick={() => removePhyto(product.id)}><X className="h-4 w-4" /></Button></div><div className="mt-3 grid grid-cols-3 gap-2"><div><InputLabel>{tr(language, 'Apps', 'المعاملات', 'Applications')}</InputLabel><Input className="mt-1 h-8" type="number" min="1" step="1" value={product.applications} onChange={(event) => updatePhyto(product.id, { applications: Number(event.target.value) })} /></div><div><InputLabel>{tr(language, 'DZD/app', 'دج/معاملة', 'DZD/app')}</InputLabel><Input className="mt-1 h-8" type="number" min="0" step="100" value={product.pricePerApplication} onChange={(event) => updatePhyto(product.id, { pricePerApplication: Number(event.target.value) })} /></div><div><InputLabel>{tr(language, 'Basis', 'الأساس', 'Base')}</InputLabel><select className="mt-1 h-8 w-full rounded-md border border-input bg-background px-1 text-xs" value={product.basis} onChange={(event) => updatePhyto(product.id, { basis: event.target.value as SimulatorPhytoSelection['basis'] })}><option value="per_ha">{tr(language, 'per ha', 'لكل هكتار', 'par ha')}</option><option value="field_total">{tr(language, 'field total', 'إجمالي الحقل', 'total parcelle')}</option></select></div></div></div>) : <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">{tr(language, 'No protection product added yet. Search the INPV index on the left.', 'لم تتم إضافة منتج حماية بعد. ابحث في فهرس INPV على اليسار.', 'Aucun produit ajouté. Recherchez dans l’index INPV à gauche.')}</div>}</div></div>
      </div>
    </div>

    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <SectionHeading step={tr(language, 'Step 4', 'الخطوة ٤', 'Étape 4')} icon={TrendingUp} title={tr(language, 'Set yield and market assumptions', 'حدّد المردود وافتراضات السوق', 'Définir le rendement et le marché')} description={tr(language, 'Use the reference as a starting point, then replace it with your buyer, cooperative, or local market expectation.', 'استخدم المرجع كنقطة بداية ثم استبدله بتوقع المشتري أو التعاونية أو السوق المحلي.', 'Utilisez la référence comme point de départ, puis remplacez-la par l’attente de l’acheteur, de la coopérative ou du marché local.')} />
      <div className="mt-5 grid gap-4 md:grid-cols-2"><div><InputLabel hint="t/ha">{tr(language, 'Expected saleable yield', 'المردود القابل للبيع المتوقع', 'Rendement vendable attendu')}</InputLabel><Input className={`${inputClass} mt-1`} type="number" min="0" step="0.1" value={scenario.expectedYieldTPerHa} onChange={(event) => updateScenario({ expectedYieldTPerHa: Number(event.target.value) })} /></div><div><InputLabel hint="DZD/t">{tr(language, 'Expected selling price', 'سعر البيع المتوقع', 'Prix de vente attendu')}</InputLabel><Input className={`${inputClass} mt-1`} type="number" min="0" step="1000" value={scenario.expectedPricePerT} onChange={(event) => updateScenario({ expectedPricePerT: Number(event.target.value) })} /></div></div><div className="mt-4 rounded-xl bg-muted/50 p-4 text-xs"><div className="flex items-center justify-between gap-3"><span className="font-semibold">{tr(language, 'Base revenue', 'الإيراد الأساسي', 'Revenu de base')}</span><span className="font-black">{formatSimulatorDzd(result.cropRevenue)}</span></div><div className="mt-2"><ProgressBar value={result.cropRevenue} max={Math.max(result.cropRevenue, result.totalCost, 1)} /></div><p className="mt-2 text-muted-foreground">{formatSimulatorNumber(result.totalYieldT, 1)} t × {formatSimulatorDzd(scenario.expectedPricePerT)}/t</p></div>
    </div>

    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <SectionHeading step={tr(language, 'Step 5', 'الخطوة ٥', 'Étape 5')} icon={CircleDollarSign} title={tr(language, 'Read the decision dashboard', 'اقرأ لوحة القرار', 'Lire le tableau de décision')} description={tr(language, 'The simulator separates operating gross margin from the net margin after household overhead.', 'يفصل المحاكي بين الهامش التشغيلي والهامش الصافي بعد المصاريف المنزلية.', 'Le simulateur sépare la marge opérationnelle de la marge nette après frais du ménage.')} />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label={tr(language, 'Total field cost', 'إجمالي تكلفة الحقل', 'Coût total parcelle')} value={formatSimulatorDzd(result.totalCost)} detail={`${formatSimulatorDzd(result.totalCostPerHa)}/ha`} tone="rose" icon={CircleDollarSign} /><MetricCard label={tr(language, 'Required selling price', 'سعر البيع المطلوب', 'Prix de vente nécessaire')} value={`${formatSimulatorDzd(result.breakEvenPricePerT)}/t`} detail={tr(language, 'Includes allocated household overhead', 'يشمل المصاريف المنزلية الموزعة', 'Inclut les frais généraux affectés')} tone="amber" icon={TrendingUp} /><MetricCard label={tr(language, 'Net margin', 'الهامش الصافي', 'Marge nette')} value={formatSimulatorDzd(result.netMargin)} detail={`${formatSimulatorNumber(result.marginPct, 1)}% ${tr(language, 'of revenue', 'من الإيراد', 'du revenu')}`} tone={result.netMargin >= 0 ? 'emerald' : 'rose'} icon={result.netMargin >= 0 ? CheckCircle2 : AlertTriangle} /><MetricCard label={tr(language, 'ROI', 'العائد على التكلفة', 'ROI')} value={`${formatSimulatorNumber(result.roiPct, 1)}%`} detail={tr(language, 'Net margin ÷ field cost', 'الهامش الصافي ÷ تكلفة الحقل', 'Marge nette ÷ coût parcelle')} tone={result.roiPct >= 0 ? 'blue' : 'rose'} icon={TrendingUp} /></div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]"><div><div className="mb-3 flex items-center justify-between"><h4 className="font-bold">{tr(language, 'Cost structure', 'هيكل التكاليف', 'Structure des coûts')}</h4><span className="text-xs text-muted-foreground">{formatSimulatorDzd(result.totalCost)}</span></div><div className="space-y-3">{result.costBreakdown.filter((item) => item.category !== 'subsidy' && item.category !== 'other_revenue').map((item) => <div key={`${item.category}-${item.label}`}><div className="mb-1 flex justify-between gap-3 text-xs"><span>{item.label || getSimulatorCategoryLabel(item.category)}</span><strong>{formatSimulatorDzd(item.amount)}</strong></div><ProgressBar value={item.amount} max={maxCost} tone={item.category === 'household_overhead' ? 'amber' : 'emerald'} /></div>)}{result.householdOverheadCost > 0 && <p className="mt-3 text-[11px] text-amber-700 dark:text-amber-300">{tr(language, 'Household share included:', 'حصة المنزل المشمولة:', 'Part du ménage incluse :')} {formatSimulatorDzd(result.householdOverheadCost)} ({scenario.overheadAllocationPct}%).</p>}</div></div><div className="rounded-xl border border-border p-4"><h4 className="font-bold">{tr(language, 'What price protects the field?', 'ما السعر الذي يحمي الحقل؟', 'Quel prix protège la parcelle ?')}</h4><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><span className="text-muted-foreground">{tr(language, 'Break-even yield', 'مردود التعادل', 'Rendement seuil')}</span><strong>{formatSimulatorNumber(result.breakEvenYieldTPerHa, 2)} t/ha</strong></div><div className="flex justify-between gap-3"><span className="text-muted-foreground">{tr(language, 'Cost per tonne', 'تكلفة الطن', 'Coût par tonne')}</span><strong>{formatSimulatorDzd(result.costPerTonne)}/t</strong></div><div className="flex justify-between gap-3"><span className="text-muted-foreground">{tr(language, 'Operating gross margin', 'الهامش التشغيلي', 'Marge brute opérationnelle')}</span><strong>{formatSimulatorDzd(result.grossMargin)}</strong></div><div className="flex justify-between gap-3"><span className="text-muted-foreground">{tr(language, 'Base-case status', 'حالة السيناريو الأساسي', 'Statut du scénario de base')}</span><Badge className={result.netMargin >= 0 ? 'bg-emerald-600' : 'bg-rose-600'}>{result.netMargin >= 0 ? tr(language, 'Profitable', 'مربح', 'Rentable') : tr(language, 'Loss', 'خسارة', 'Perte')}</Badge></div></div></div></div>
    </div>

    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><TrendingDown className="h-4 w-4" /></div><div><div className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">{tr(language, 'Market scenarios', 'سيناريوهات السوق', 'Scénarios de marché')}</div><h3 className="font-bold">{tr(language, 'How much price volatility can the field absorb?', 'كم تقلبًا في السعر يستطيع الحقل تحمّلَه؟', 'Quelle volatilité le champ peut-il absorber ?')}</h3><p className="mt-0.5 text-xs text-muted-foreground">{tr(language, 'These cases change only the market price, so the cost base stays visible.', 'تغيّر هذه الحالات سعر السوق فقط، لذلك تبقى قاعدة التكلفة واضحة.', 'Ces cas modifient uniquement le prix du marché ; la base de coûts reste visible.')}</p></div></div><div className="mt-5 grid gap-3 md:grid-cols-5">{result.marketPoints.map((point) => <div key={point.id} className={`rounded-xl border p-3 ${point.id === 'base' ? 'border-emerald-300 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-border bg-muted/30'}`}><div className="text-xs font-bold">{point.id === 'pessimistic' ? tr(language, 'Pessimistic', 'متشائم', 'Pessimiste') : point.id === 'downside' ? tr(language, '−15% price', '−١٥٪ سعر', 'Prix −15 %') : point.id === 'base' ? tr(language, 'Base', 'أساسي', 'Base') : point.id === 'upside' ? tr(language, '+15% price', '+١٥٪ سعر', 'Prix +15 %') : tr(language, 'Optimistic', 'متفائل', 'Optimiste')}</div><div className="mt-2 text-sm font-black">{formatSimulatorDzd(point.pricePerT)}/t</div><div className={`mt-2 text-sm font-bold ${point.netMargin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatSimulatorDzd(point.netMargin)}</div><div className="mt-1 text-[11px] text-muted-foreground">ROI {formatSimulatorNumber(point.roiPct, 1)}%</div><Badge variant="outline" className="mt-2 text-[10px]">{point.profitable ? tr(language, 'Profit', 'ربح', 'Profit') : tr(language, 'Loss', 'خسارة', 'Perte')}</Badge></div>)}</div></div>

    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"><ShieldAlert className="h-4 w-4" /></div><div><div className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose-700 dark:text-rose-300">{tr(language, 'Risk laboratory', 'مختبر المخاطر', 'Laboratoire des risques')}</div><h3 className="font-bold">{tr(language, 'Stress-test the season before spending', 'اختبر الموسم قبل الإنفاق', 'Tester la saison avant de dépenser')}</h3><p className="mt-0.5 text-xs text-muted-foreground">{tr(language, 'Toggle assumptions and edit their size. Each result explains what changed.', 'فعّل الافتراضات وعدّل حجمها. يشرح كل ناتج ما الذي تغيّر.', 'Activez les hypothèses et modifiez leur intensité. Chaque résultat explique ce qui a changé.')}</p></div></div><div className="mt-5 grid gap-3 md:grid-cols-2">{scenario.risks.map((risk) => { const riskResult = result.riskResults.find((item) => item.id === risk.id); return <div key={risk.id} className={`rounded-xl border p-4 ${risk.enabled ? 'border-rose-200 bg-rose-50/60 dark:border-rose-900 dark:bg-rose-950/20' : 'border-border bg-muted/20'}`}><div className="flex items-start justify-between gap-3"><div><div className="font-bold">{risk.label}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{risk.explanation}</p></div><input aria-label={`${risk.label} enabled`} type="checkbox" checked={risk.enabled} onChange={(event) => updateRisk(risk.id, { enabled: event.target.checked })} className="mt-1 h-4 w-4 accent-rose-600" /></div><div className="mt-3 grid grid-cols-3 gap-2"><div><InputLabel hint="%">{tr(language, 'Price', 'السعر', 'Prix')}</InputLabel><Input className="mt-1 h-8" type="number" value={risk.priceDeltaPct} onChange={(event) => updateRisk(risk.id, { priceDeltaPct: Number(event.target.value) })} /></div><div><InputLabel hint="%">{tr(language, 'Yield', 'المردود', 'Rendement')}</InputLabel><Input className="mt-1 h-8" type="number" value={risk.yieldDeltaPct} onChange={(event) => updateRisk(risk.id, { yieldDeltaPct: Number(event.target.value) })} /></div><div><InputLabel hint="%">{tr(language, 'Costs', 'التكاليف', 'Coûts')}</InputLabel><Input className="mt-1 h-8" type="number" value={risk.costDeltaPct} onChange={(event) => updateRisk(risk.id, { costDeltaPct: Number(event.target.value) })} /></div></div>{riskResult && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-rose-200/70 pt-3 text-xs dark:border-rose-900/70"><span>{formatSimulatorDzd(riskResult.netMargin)} · {tr(language, 'break-even', 'تعادل', 'seuil')} {formatSimulatorDzd(riskResult.breakEvenPricePerT)}/t</span><Badge variant="outline" className={riskResult.profitable ? 'border-emerald-300 text-emerald-700' : 'border-rose-300 text-rose-700'}>{riskResult.profitable ? tr(language, 'Still profitable', 'ما زال مربحًا', 'Encore rentable') : tr(language, 'Needs action', 'يتطلب تدخّلًا', 'Action requise')}</Badge></div>}</div>; })}</div></div>

    {(result.warnings.length > 0 || baseMarket) && <div className="grid gap-3 md:grid-cols-2">{result.warnings.length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs dark:border-amber-900 dark:bg-amber-950/20"><div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-200"><AlertTriangle className="h-4 w-4" />{tr(language, 'Decision notes', 'ملاحظات القرار', 'Notes de décision')}</div><div className="mt-2 space-y-2 text-amber-900/80 dark:text-amber-100/80">{result.warnings.map((warning) => <p key={warning}>• {warning}</p>)}</div></div>}<div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs dark:border-emerald-900 dark:bg-emerald-950/20"><div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-200"><CheckCircle2 className="h-4 w-4" />{tr(language, 'Base-case readout', 'قراءة السيناريو الأساسي', 'Lecture du scénario de base')}</div><p className="mt-2 leading-5 text-emerald-900/80 dark:text-emerald-100/80">{baseMarket && baseMarket.profitable ? tr(language, 'At the entered price, the field clears its full cost including allocated household overhead. Compare this with the downside and drought cases before committing.', 'بالسعر المدخل، يغطي الحقل كامل تكلفته بما فيها حصة المصاريف المنزلية. قارن ذلك بحالات الانخفاض والجفاف قبل الالتزام.', 'Au prix saisi, la parcelle couvre son coût complet, frais du ménage inclus. Comparez avec les cas de baisse et de sécheresse avant de vous engager.') : tr(language, 'At the entered price, the field does not clear full cost after overhead. The required selling price is the negotiation target, not a guaranteed market quote.', 'بالسعر المدخل، لا يغطي الحقل التكلفة الكاملة بعد المصاريف. سعر البيع المطلوب هو هدف للتفاوض وليس عرضًا مضمونًا من السوق.', 'Au prix saisi, la parcelle ne couvre pas son coût complet après frais généraux. Le prix nécessaire est un objectif de négociation, pas une cotation garantie.')}</p></div></div>}

    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between print:hidden"><div className="flex flex-wrap gap-2"><Button variant="outline" className="gap-2" onClick={saveScenario}><CheckCircle2 className="h-4 w-4" />{savedNotice ? tr(language, 'Saved', 'تم الحفظ', 'Enregistré') : tr(language, 'Save scenario', 'حفظ السيناريو', 'Enregistrer le scénario')}</Button><Button variant="outline" className="gap-2" onClick={resetScenario}><RefreshCw className="h-4 w-4" />{tr(language, 'Reset', 'إعادة تعيين', 'Réinitialiser')}</Button></div><Button className="gap-2 bg-emerald-700 hover:bg-emerald-800" onClick={() => window.print()}><Printer className="h-4 w-4" />{tr(language, 'Print decision brief', 'طباعة ملخص القرار', 'Imprimer le brief de décision')}</Button></div>
    <p className="text-center text-[11px] text-muted-foreground print:hidden">{tr(language, 'Planning support only. Verify current OAIC prices, supplier quotes, INPV registrations, labels, labor rates, and water/energy tariffs before making a commitment.', 'أداة دعم للتخطيط فقط. تحقّق من أسعار OAIC الحالية وعروض الموردين وتسجيلات INPV والملصقات ومعدلات العمل وتعريفات الماء والطاقة قبل الالتزام.', 'Outil d’aide à la planification. Vérifiez les prix OAIC actuels, les devis fournisseurs, les homologations INPV, les étiquettes, les salaires et les tarifs d’eau/énergie avant tout engagement.')}</p>
  </div>;
}
