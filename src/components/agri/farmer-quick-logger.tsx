'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Droplets,
  Sprout,
  ShieldAlert,
  Bug,
  Sparkles,
  CheckCircle2,
  Plus,
  Flame,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { appendManualFieldRecord, type FieldRecordKind } from '@/lib/field-record-book';
import { useTranslation, copyFor } from '@/lib/language-store';

interface FarmerQuickLoggerProps {
  fieldName?: string;
  cropName?: string;
  onRecordAdded?: () => void;
  sunMode?: boolean;
}

type QuickLogType = 'irrigation' | 'fertilizer' | 'spray' | 'scout' | 'harvest';

export function FarmerQuickLogger({ fieldName = 'Field 1', cropName = 'Potato', onRecordAdded, sunMode = false }: FarmerQuickLoggerProps) {
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  const [activeModal, setActiveModal] = useState<QuickLogType | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form states for active modal
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [irrigationDurationHours, setIrrigationDurationHours] = useState<number>(2.5);
  const [irrigationWaterMm, setIrrigationWaterMm] = useState<number>(4.0);
  const [fertilizerProduct, setFertilizerProduct] = useState<string>('Urea 46%');
  const [fertilizerBags, setFertilizerBags] = useState<number>(2);
  const [sprayProduct, setSprayProduct] = useState<string>('Copper Hydroxide / Bouillie Bordelaise');
  const [sprayTanks, setSprayTanks] = useState<number>(4);
  const [scoutPest, setScoutPest] = useState<string>('Aphids / Pucerons');
  const [scoutNotes, setScoutNotes] = useState<string>('Observed on 5% of leaf undersides');
  const [harvestQuantity, setHarvestQuantity] = useState<number>(25);
  const [harvestUnit, setHarvestUnit] = useState<string>('Quintaux (Qx)');
  const [amountDzd, setAmountDzd] = useState<number | undefined>(undefined);

  const handleSave = (type: QuickLogType) => {
    let title = '';
    let summary = '';
    let kind: FieldRecordKind = 'decision';
    let defaultDzd = amountDzd;

    const todayDate = date || new Date().toISOString().slice(0, 10);

    if (type === 'irrigation') {
      kind = 'irrigation';
      title = tr('Irrigation applied', 'تم تنفيذ السقي', 'Irrigation réalisée');
      summary = `${irrigationDurationHours}h ${tr('run time', 'مدة التشغيل', 'de pompage')} · ~${irrigationWaterMm} mm · ${fieldName}`;
    } else if (type === 'fertilizer') {
      kind = 'input';
      title = tr('Fertilizer application', 'تطبيق التسميد', 'Apport d\'engrais');
      summary = `${fertilizerProduct} (${fertilizerBags} ${tr('bags 50kg', 'أكياس 50كغ', 'sacs de 50kg')}) · ${cropName} · ${fieldName}`;
    } else if (type === 'spray') {
      kind = 'input';
      title = tr('Phytosanitary treatment', 'رش وقائي / علاجي', 'Traitement phytosanitaire');
      summary = `${sprayProduct} (${sprayTanks} ${tr('backpack tanks', 'خزانات بخاخ', 'dosées pulvérisateur')}) · ${fieldName}`;
    } else if (type === 'scout') {
      kind = 'observation';
      title = tr('Pest & plant observation', 'معاينة حقلية للآفات', 'Observation ravageur / maladie');
      summary = `${scoutPest}: ${scoutNotes} · ${fieldName}`;
    } else if (type === 'harvest') {
      kind = 'harvest';
      title = tr('Crop harvest recorded', 'تسجيل الحصاد وجني المحصول', 'Récolte enregistrée');
      summary = `${harvestQuantity} ${harvestUnit} · ${cropName} · ${fieldName}`;
    }

    appendManualFieldRecord({
      fieldName,
      crop: cropName,
      date: todayDate,
      kind,
      title,
      summary,
      amountDzd: defaultDzd,
    });

    setActiveModal(null);
    setSuccessToast(title);
    setTimeout(() => setSuccessToast(null), 3500);
    onRecordAdded?.();
  };

  return (
    <div className="space-y-3">
      {/* Toast Feedback */}
      {successToast && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-600 text-white font-medium text-xs shadow-lg animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-200" />
          <span>{tr('Recorded into your Field Book:', 'تم الحفظ في دفتر سجل الحقل:', 'Enregistré dans votre carnet de parcelle :')} <strong>{successToast}</strong></span>
        </div>
      )}

      {/* Quick Action Large Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {/* 1. Irrigation */}
        <button
          type="button"
          onClick={() => setActiveModal('irrigation')}
          className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all text-center min-h-[90px] ${
            sunMode
              ? 'border-foreground bg-cyan-950 text-white font-bold'
              : 'border-cyan-200 bg-cyan-50/60 hover:bg-cyan-100 hover:border-cyan-400 dark:bg-cyan-950/30 dark:border-cyan-800'
          }`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-600 text-white mb-1.5 shadow-sm">
            <Droplets className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-cyan-950 dark:text-cyan-200">
            {tr('+ Log Water', '+ سجّل سقية', '+ Arrosage')}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {tr('Pump run time', 'مدة المضخة', 'Durée pompe')}
          </span>
        </button>

        {/* 2. Fertilizer */}
        <button
          type="button"
          onClick={() => setActiveModal('fertilizer')}
          className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all text-center min-h-[90px] ${
            sunMode
              ? 'border-foreground bg-amber-950 text-white font-bold'
              : 'border-amber-200 bg-amber-50/60 hover:bg-amber-100 hover:border-amber-400 dark:bg-amber-950/30 dark:border-amber-800'
          }`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 text-white mb-1.5 shadow-sm">
            <Sprout className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
            {tr('+ Log Fertilizer', '+ سجّل سماد', '+ Engrais')}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {tr('Urea, DAP, NPK', 'يوريا، داب، NPK', 'Urée, DAP, NPK')}
          </span>
        </button>

        {/* 3. Spray */}
        <button
          type="button"
          onClick={() => setActiveModal('spray')}
          className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all text-center min-h-[90px] ${
            sunMode
              ? 'border-foreground bg-emerald-950 text-white font-bold'
              : 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 hover:border-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-800'
          }`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white mb-1.5 shadow-sm">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
            {tr('+ Log Spray', '+ سجّل معالجة', '+ Traitement')}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {tr('Pesticide / tanks', 'مبيد / بخاخات', 'Produit / dosées')}
          </span>
        </button>

        {/* 4. Pest Scout */}
        <button
          type="button"
          onClick={() => setActiveModal('scout')}
          className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all text-center min-h-[90px] ${
            sunMode
              ? 'border-foreground bg-rose-950 text-white font-bold'
              : 'border-rose-200 bg-rose-50/60 hover:bg-rose-100 hover:border-rose-400 dark:bg-rose-950/30 dark:border-rose-800'
          }`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-600 text-white mb-1.5 shadow-sm">
            <Bug className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-rose-950 dark:text-rose-200">
            {tr('+ Log Pest / Sickness', '+ سجّل آفة / مرض', '+ Ravageur')}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {tr('Quick symptom check', 'معاينة سريعة', 'Constat au champ')}
          </span>
        </button>

        {/* 5. Harvest */}
        <button
          type="button"
          onClick={() => setActiveModal('harvest')}
          className={`col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all text-center min-h-[90px] ${
            sunMode
              ? 'border-foreground bg-purple-950 text-white font-bold'
              : 'border-purple-200 bg-purple-50/60 hover:bg-purple-100 hover:border-purple-400 dark:bg-purple-950/30 dark:border-purple-800'
          }`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600 text-white mb-1.5 shadow-sm">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-purple-950 dark:text-purple-200">
            {tr('+ Log Harvest', '+ سجّل جني / حصاد', '+ Récolte')}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {tr('Yield & crates', 'كمية الإنتاج', 'Quantité récoltée')}
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* MODALS */}
      {/* ============================================================== */}

      {/* 1. IRRIGATION MODAL */}
      <Dialog open={activeModal === 'irrigation'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Droplets className="h-5 w-5 text-cyan-600" />
              {tr('Log Irrigation Event', 'تسجيل عملية سقي', 'Enregistrer un arrosage')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">{tr('Date', 'التاريخ', 'Date')}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">{tr('Pump Duration (Hours)', 'مدة تشغيل المضخة (ساعات)', 'Durée (Heures)')}</Label>
                <Input type="number" step="0.5" value={irrigationDurationHours} onChange={(e) => setIrrigationDurationHours(parseFloat(e.target.value) || 1)} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{tr('Approx Water (mm)', 'كمية الماء المقدرة (ملم)', 'Lame d\'eau (mm)')}</Label>
                <Input type="number" step="0.5" value={irrigationWaterMm} onChange={(e) => setIrrigationWaterMm(parseFloat(e.target.value) || 1)} className="h-9" />
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-800">
              💧 {fieldName} ({cropName}): {irrigationDurationHours} {tr('hours of drip watering', 'ساعات من السقي بالتقطير', 'heures d\'arrosage')}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>{tr('Cancel', 'إلغاء', 'Annuler')}</Button>
            <Button size="sm" onClick={() => handleSave('irrigation')} className="bg-cyan-600 hover:bg-cyan-700 text-white gap-1">
              <CheckCircle2 className="h-4 w-4" /> {tr('Save to Field Book', 'حفظ في السجل', 'Enregistrer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. FERTILIZER MODAL */}
      <Dialog open={activeModal === 'fertilizer'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sprout className="h-5 w-5 text-amber-600" />
              {tr('Log Fertilizer Application', 'تسجيل نثر أو تسميد', 'Enregistrer un apport d\'engrais')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">{tr('Fertilizer Product', 'نوع السماد', 'Type d\'engrais')}</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {['Urea 46%', 'DAP 18-46-0', 'Potassium Sulfate 50%', 'NPK 15-15-15', 'Ammonium Nitrate', 'Manure (Fumier)'].map((prod) => (
                  <Button
                    key={prod}
                    type="button"
                    variant={fertilizerProduct === prod ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-[11px] justify-start"
                    onClick={() => setFertilizerProduct(prod)}
                  >
                    {prod}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">{tr('Number of 50kg Bags', 'عدد أكياس 50 كغ', 'Nombre de sacs (50kg)')}</Label>
                <Input type="number" step="0.5" value={fertilizerBags} onChange={(e) => setFertilizerBags(parseFloat(e.target.value) || 1)} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{tr('Cost in DZD (Optional)', 'التكلفة بالدينار (اختياري)', 'Coût en DZD (Optionnel)')}</Label>
                <Input type="number" step="500" placeholder="e.g. 12000" value={amountDzd || ''} onChange={(e) => setAmountDzd(parseFloat(e.target.value) || undefined)} className="h-9" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>{tr('Cancel', 'إلغاء', 'Annuler')}</Button>
            <Button size="sm" onClick={() => handleSave('fertilizer')} className="bg-amber-600 hover:bg-amber-700 text-white gap-1">
              <CheckCircle2 className="h-4 w-4" /> {tr('Save to Field Book', 'حفظ في السجل', 'Enregistrer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. SPRAY MODAL */}
      <Dialog open={activeModal === 'spray'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-5 w-5 text-emerald-600" />
              {tr('Log Treatment / Spray', 'تسجيل معالجة وقائية / علاجية', 'Enregistrer un traitement')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">{tr('Product Name / Active Matter', 'اسم المبيد أو المادة الفعالة', 'Nom du produit / Matière active')}</Label>
              <Input value={sprayProduct} onChange={(e) => setSprayProduct(e.target.value)} className="h-9" placeholder="e.g. Cuivre, Abamectine, Deltamethrine" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">{tr('Backpack Tanks sprayed', 'عدد خزانات الرش المفرغة', 'Nombre de pulvérisateurs')}</Label>
                <Input type="number" min="1" value={sprayTanks} onChange={(e) => setSprayTanks(parseInt(e.target.value, 10) || 1)} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{tr('Total Cost (DZD)', 'التكلفة بالدينار', 'Coût total (DZD)')}</Label>
                <Input type="number" step="500" placeholder="e.g. 4500" value={amountDzd || ''} onChange={(e) => setAmountDzd(parseFloat(e.target.value) || undefined)} className="h-9" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>{tr('Cancel', 'إلغاء', 'Annuler')}</Button>
            <Button size="sm" onClick={() => handleSave('spray')} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
              <CheckCircle2 className="h-4 w-4" /> {tr('Save to Field Book', 'حفظ في السجل', 'Enregistrer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. SCOUT / PEST OBSERVATION MODAL */}
      <Dialog open={activeModal === 'scout'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Bug className="h-5 w-5 text-rose-600" />
              {tr('Log Pest or Disease Observation', 'تسجيل معاينة آفة أو مرض', 'Enregistrer un constat au champ')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">{tr('Observed Symptom or Pest', 'الآفة أو العرض المشاهد', 'Ravageur ou symptôme constaté')}</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {['Aphids / Pucerons (منّ)', 'Mildew / Mildiou (بياض زغبي)', 'Mites / Acariens (عث)', 'Tuta Absoluta (حفارة طماطم)', 'Leaf spots (تبقع أوراق)', 'Weeds (أعشاب ضارة)'].map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={scoutPest === p ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-[11px] justify-start"
                    onClick={() => setScoutPest(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{tr('Notes & Location in parcel', 'ملاحظات وتحديد المكان في القطعة', 'Notes et localisation')}</Label>
              <Input value={scoutNotes} onChange={(e) => setScoutNotes(e.target.value)} className="h-9" placeholder="e.g. Borders of field, lower leaves" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>{tr('Cancel', 'إلغاء', 'Annuler')}</Button>
            <Button size="sm" onClick={() => handleSave('scout')} className="bg-rose-600 hover:bg-rose-700 text-white gap-1">
              <CheckCircle2 className="h-4 w-4" /> {tr('Save to Field Book', 'حفظ في السجل', 'Enregistrer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. HARVEST MODAL */}
      <Dialog open={activeModal === 'harvest'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              {tr('Log Harvest Batch', 'تسجيل دفعة جني أو حصاد', 'Enregistrer un lot récolté')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">{tr('Harvested Quantity', 'الكمية المحصودة', 'Quantité récoltée')}</Label>
                <Input type="number" value={harvestQuantity} onChange={(e) => setHarvestQuantity(parseFloat(e.target.value) || 0)} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{tr('Unit', 'الوحدة', 'Unité')}</Label>
                <div className="grid grid-cols-2 gap-1">
                  {['Quintaux (Qx)', 'Crates (Caisses)', 'Kg', 'Tons (Tonnes)'].map((u) => (
                    <Button
                      key={u}
                      type="button"
                      variant={harvestUnit === u ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 text-[10px]"
                      onClick={() => setHarvestUnit(u)}
                    >
                      {u}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{tr('Estimated Revenue in DZD (Optional)', 'الإيراد المقدر بالدينار (اختياري)', 'Revenu estimé en DZD (Optionnel)')}</Label>
              <Input type="number" step="1000" placeholder="e.g. 150000" value={amountDzd || ''} onChange={(e) => setAmountDzd(parseFloat(e.target.value) || undefined)} className="h-9" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>{tr('Cancel', 'إلغاء', 'Annuler')}</Button>
            <Button size="sm" onClick={() => handleSave('harvest')} className="bg-purple-600 hover:bg-purple-700 text-white gap-1">
              <CheckCircle2 className="h-4 w-4" /> {tr('Save to Field Book', 'حفظ في السجل', 'Enregistrer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
