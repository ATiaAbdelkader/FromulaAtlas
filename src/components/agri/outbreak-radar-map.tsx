'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  AlertTriangle,
  ShieldAlert,
  MapPin,
  Clock,
  Filter,
  PlusCircle,
  CheckCircle2,
  Share2,
  Eye,
  Send,
  Sparkles,
  Info,
  Layers,
  ChevronRight,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useTranslation, copyFor } from '@/lib/language-store';
import { INITIAL_OUTBREAK_REPORTS, type OutbreakReport } from '@/lib/outbreak-radar-data';

interface OutbreakRadarMapProps {
  currentWilaya?: string;
  sunMode?: boolean;
}

export function OutbreakRadarMap({ currentWilaya = 'All', sunMode = false }: OutbreakRadarMapProps) {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  const [reports, setReports] = useState<OutbreakReport[]>(INITIAL_OUTBREAK_REPORTS);
  const [selectedWilaya, setSelectedWilaya] = useState<string>(currentWilaya === 'All' ? 'All' : currentWilaya);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedReport, setSelectedReport] = useState<OutbreakReport | null>(INITIAL_OUTBREAK_REPORTS[0]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // New report form state
  const [newCrop, setNewCrop] = useState('Tomato');
  const [newDisease, setNewDisease] = useState('Tuta Absoluta');
  const [newWilaya, setNewWilaya] = useState('Biskra');
  const [newCommune, setNewCommune] = useState('');
  const [newSeverity, setNewSeverity] = useState<'low' | 'moderate' | 'high' | 'critical'>('high');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const filteredReports = reports.filter((r) => {
    const matchWilaya = selectedWilaya === 'All' || r.wilaya.toLowerCase().includes(selectedWilaya.toLowerCase());
    const matchSeverity = selectedSeverity === 'All' || r.severity === selectedSeverity;
    return matchWilaya && matchSeverity;
  });

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      const newEntry: OutbreakReport = {
        id: `outbreak-custom-${Date.now()}`,
        crop: newCrop,
        crop_ar: newCrop,
        crop_fr: newCrop,
        diseaseOrPest: newDisease,
        diseaseOrPest_ar: newDisease,
        diseaseOrPest_fr: newDisease,
        category: 'pest',
        severity: newSeverity,
        wilaya: newWilaya,
        wilaya_ar: newWilaya,
        commune: newCommune || 'Local Parcel Hub',
        reportedDate: 'Just now',
        activeCasesCount: 1,
        radiusKm: 20,
        lat: 35.0,
        lng: 3.0,
        verifiedByAgronomist: false,
        weatherTrigger: 'Reported by local farmer scout',
        recommendedAction_fr: 'Signalement transmis à l\'INPV de wilaya pour vérification sous 24h.',
        recommendedAction_ar: 'تم إرسال البلاغ إلى مفتشية حماية النباتات (INPV) بالولاية للمتابعة.',
        inpvReferenceProduct: 'Standard INPV protocol',
        darDays: 3,
      };

      setReports([newEntry, ...reports]);
      setSelectedReport(newEntry);
      setIsSubmitting(false);
      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        setIsReportModalOpen(false);
      }, 1200);
    }, 600);
  };

  const getSeverityBadge = (sev: OutbreakReport['severity']) => {
    switch (sev) {
      case 'critical':
        return <Badge className="bg-rose-600 text-white font-bold text-[10px] animate-pulse">🔴 {tr('Critical Outbreak', 'بؤرة وبائية حرجة', 'Foyer Critique')}</Badge>;
      case 'high':
        return <Badge className="bg-amber-600 text-white font-bold text-[10px]">🟠 {tr('High Spread Risk', 'انتشار مرتفع', 'Risque Élevé')}</Badge>;
      case 'moderate':
        return <Badge className="bg-yellow-500 text-slate-900 font-bold text-[10px]">🟡 {tr('Moderate Alert', 'تنبيه متوسط', 'Alerte Modérée')}</Badge>;
      default:
        return <Badge className="bg-emerald-600 text-white font-bold text-[10px]">🟢 {tr('Low Risk', 'منخفض', 'Faible')}</Badge>;
    }
  };

  return (
    <Card className={`border shadow-md overflow-hidden ${sunMode ? 'border-foreground bg-background text-foreground' : 'border-border bg-card'}`}>
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 to-amber-600 text-white flex items-center justify-center shadow-md">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-extrabold tracking-tight">
                  {tr('Live Disease & Pest Outbreak Radar (Algeria)', 'رادار انتشار الأوبئة والآفات الزراعية الحية بالجزائر', 'Radar des Foyers Épidémiques & Ravageurs (Algérie)')}
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-bold bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  {reports.length} {tr('Active Alert Zones', 'منطقة إنذار نشطة', 'Zones d\'alerte')}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {tr(
                  'Real-time crowdsourced sightings from nearby farms, INPV regional phytosanitary alerts, and radius warnings.',
                  'بلاغات حية فورية من المزارعين المجاورين، إنذارات المفتشية الجهوية لحماية النباتات، ومحيط انتشار البؤرة.',
                  'Signalements en temps réel des exploitations voisines, alertes régionales INPV et rayon de propagation.'
                )}
              </CardDescription>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="h-9 px-3.5 gap-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{tr('Report Local Outbreak', 'أبلغ عن بؤرة إصابة بحقلك', 'Signaler un Foyer')}</span>
          </Button>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex items-center justify-between pt-3 gap-2 border-t mt-3 flex-wrap text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-muted-foreground font-semibold flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" />
              <span>{tr('Wilaya:', 'الولاية:', 'Wilaya :')}</span>
            </span>
            <select
              value={selectedWilaya}
              onChange={(e) => setSelectedWilaya(e.target.value)}
              className="h-8 px-2.5 rounded-xl border bg-background text-xs font-medium"
            >
              <option value="All">{tr('All Wilayas (National)', 'كل الولايات (الوطني)', 'Toutes les Wilayas')}</option>
              <option value="Biskra">Biskra (بسكرة)</option>
              <option value="El Oued">El Oued (الوادي)</option>
              <option value="Blida">Blida / Mitidja (البليدة)</option>
              <option value="Mostaganem">Mostaganem (مستغانم)</option>
              <option value="Mascara">Mascara (معسكر)</option>
              <option value="Sétif">Sétif (سطيف)</option>
              <option value="Tizi Ouzou">Tizi Ouzou (تيزي وزو)</option>
            </select>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="h-8 px-2.5 rounded-xl border bg-background text-xs font-medium"
            >
              <option value="All">{tr('All Severities', 'كل درجات الخطورة', 'Toutes les sévérités')}</option>
              <option value="critical">Critical (حرجة)</option>
              <option value="high">High (مرتفعة)</option>
              <option value="moderate">Moderate (متوسطة)</option>
            </select>
          </div>

          <span className="text-xs text-muted-foreground font-mono">
            {filteredReports.length} {tr('matches found', 'بؤرة مطابقة', 'foyers correspondants')}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Radar Map Representation */}
          <div className="lg:col-span-7 space-y-3">
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[16/10] flex items-center justify-center p-4 shadow-inner">
              {/* Radar Grid Circles Background */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="w-[85%] aspect-square rounded-full border border-emerald-400" />
                <div className="w-[60%] aspect-square rounded-full border border-emerald-400" />
                <div className="w-[35%] aspect-square rounded-full border border-emerald-400" />
                <div className="absolute w-full h-[1px] bg-emerald-400" />
                <div className="absolute h-full w-[1px] bg-emerald-400" />
              </div>

              {/* Radar Rotating Scan Beam */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                  className="w-full h-full origin-center bg-gradient-to-tr from-transparent via-transparent to-emerald-500/15 rounded-full"
                />
              </div>

              {/* Map Outline Overlay (Stylized Algeria Northern Agricultural Belt) */}
              <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none opacity-40">
                <div className="w-full h-full border border-dashed border-emerald-500/40 rounded-3xl flex items-center justify-center">
                  <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase">
                    ALGERIA PHYTOSANITARY RADAR GRID (35°N - 3°E)
                  </span>
                </div>
              </div>

              {/* Outbreak Pins on the Radar Canvas */}
              <div className="relative z-10 w-full h-full">
                {filteredReports.map((report, idx) => {
                  const isSelected = selectedReport?.id === report.id;
                  // Normalized positioning across map view
                  const leftPos = `${20 + ((idx * 16) % 65)}%`;
                  const topPos = `${25 + ((idx * 14) % 55)}%`;

                  return (
                    <motion.button
                      key={report.id}
                      type="button"
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedReport(report)}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer flex flex-col items-center group`}
                      style={{ left: leftPos, top: topPos }}
                    >
                      {/* Pulse Ring for High/Critical */}
                      {(report.severity === 'critical' || report.severity === 'high') && (
                        <span className="absolute -inset-2 rounded-full bg-rose-500/40 animate-ping" />
                      )}

                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg transition-all border-2 ${
                          isSelected
                            ? 'bg-white text-slate-900 border-rose-500 ring-4 ring-rose-500/30 scale-125'
                            : report.severity === 'critical'
                            ? 'bg-rose-600 text-white border-rose-300'
                            : report.severity === 'high'
                            ? 'bg-amber-600 text-white border-amber-300'
                            : 'bg-yellow-500 text-slate-900 border-yellow-300'
                        }`}
                      >
                        ⚠️
                      </div>

                      <div className="mt-1 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-white text-[9px] font-bold whitespace-nowrap shadow-md">
                        {report.wilaya}: {report.diseaseOrPest.split('(')[0].trim()}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Bottom Radar Status Pill */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md text-white text-xs border border-slate-800 z-20">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
                  <span>{tr('Live Radar Monitoring Active', 'المراقبة الرادارية الحية نشطة', 'Surveillance Radar Active')}</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  {tr('Radius Alert: ≤50 km', 'نطاق الإنذار: ≤ 50 كم', 'Rayon d\'alerte : ≤50 km')}
                </span>
              </div>
            </div>

            {/* List of Nearby Sightings */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {filteredReports.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    selectedReport?.id === r.id
                      ? 'bg-rose-500/10 border-rose-500/50 shadow-xs'
                      : 'bg-muted/30 border-border hover:bg-muted/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-card border flex items-center justify-center text-sm">
                      {r.category === 'pest' ? '🪲' : '🍂'}
                    </div>
                    <div>
                      <div className="font-bold text-foreground flex items-center gap-1.5">
                        <span>{language === 'ar' ? r.diseaseOrPest_ar : r.diseaseOrPest}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">({r.wilaya})</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {r.crop} · {r.commune} · <Clock className="inline h-3 w-3" /> {r.reportedDate}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getSeverityBadge(r.severity)}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Outbreak Detail Dossier & Prevention Action */}
          <div className="lg:col-span-5 space-y-4">
            {selectedReport ? (
              <div className="p-5 rounded-2xl border bg-card shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-2 border-b pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase">{selectedReport.wilaya} ({selectedReport.commune})</span>
                      {selectedReport.verifiedByAgronomist && (
                        <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-800 border-emerald-400">
                          ✓ {tr('INPV Verified', 'معتمد من INPV', 'Vérifié INPV')}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-foreground">
                      {language === 'ar' ? selectedReport.diseaseOrPest_ar : selectedReport.diseaseOrPest}
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium">{selectedReport.crop}</p>
                  </div>
                  {getSeverityBadge(selectedReport.severity)}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-muted/40 border">
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase">{tr('Active Cases in Sector', 'الحالات المسجلة بالقطاع', 'Cas Actifs')}</span>
                    <span className="text-sm font-extrabold font-mono text-rose-600">{selectedReport.activeCasesCount} {tr('farms', 'مستثمرة', 'exploitations')}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border">
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase">{tr('Warning Radius', 'نصف قطر التحذير', 'Rayon d\'Alerte')}</span>
                    <span className="text-sm font-extrabold font-mono text-foreground">±{selectedReport.radiusKm} km</span>
                  </div>
                </div>

                {/* Weather Trigger */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <span className="font-bold flex items-center gap-1 text-[11px]">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    <span>{tr('Climatic Infection Trigger:', 'العامل المناخي المحفز للوباء:', 'Facteur Climatique Déclenchant :')}</span>
                  </span>
                  <p className="text-[11px]">{selectedReport.weatherTrigger}</p>
                </div>

                {/* Recommended Field Protocol */}
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-950 dark:text-emerald-200 space-y-1.5">
                  <span className="font-bold text-[11px] uppercase text-emerald-800 dark:text-emerald-300 block">
                    🛡️ {tr('Immediate Containment Protocol:', 'البروتوكول العلاجي العاجل للحصار:', 'Protocole de Traitement Recommandé :')}
                  </span>
                  <p className="leading-relaxed">
                    {language === 'ar' ? selectedReport.recommendedAction_ar : selectedReport.recommendedAction_fr}
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 border-t border-emerald-500/20 mt-2">
                    <span>💊 {selectedReport.inpvReferenceProduct}</span>
                    <span className="font-mono text-rose-600 font-bold">DAR: {selectedReport.darDays}j</span>
                  </div>
                </div>

                {/* WhatsApp Share Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = `⚠️ *AgroVision Outbreak Alert (${selectedReport.wilaya})*\nPathology: ${selectedReport.diseaseOrPest}\nCrop: ${selectedReport.crop}\nSector: ${selectedReport.commune}\nCases: ${selectedReport.activeCasesCount} farms\nAction: ${selectedReport.recommendedAction_fr}`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="w-full h-9 text-xs font-bold gap-1.5 border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>{tr('Alert Neighboring Farmers on WhatsApp', 'تحذير مزارعي الجوار عبر واتساب', 'Alerter les Voisins sur WhatsApp')}</span>
                </Button>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-xs border rounded-2xl">
                {tr('Select an outbreak pin to view containment protocol', 'اختر بؤرة على الخريطة لعرض تفاصيل العلاج', 'Sélectionnez un foyer sur la carte')}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* ============================================================== */}
      {/* CROWDSOURCED OUTBREAK REPORTING MODAL */}
      {/* ============================================================== */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-rose-600" />
              <span>{tr('Report Field Disease or Pest Sighting', 'الإبلاغ عن ظهور وباء أو آفة حشرية بحقلك', 'Signaler une Apparition de Maladie ou Ravageur')}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {tr(
                'Help alert fellow farmers in your Wilaya. Verified reports are submitted to regional INPV scouts.',
                'ساعد في تنبيه مزارعي منطقتك. البلاغات الموثوقة ترسل فوراً لمفتشية حماية النباتات.',
                'Aidez les agriculteurs de votre région. Les alertes sont transmises aux inspecteurs INPV.'
              )}
            </DialogDescription>
          </DialogHeader>

          {submittedSuccess ? (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <h4 className="font-extrabold text-sm text-foreground">{tr('Outbreak Alert Logged Successfully!', 'تم تسجيل البلاغ ونشر التنبيه بنجاح!', 'Signalement Enregistré avec Succès !')}</h4>
              <p className="text-xs text-muted-foreground">{tr('Radar grid has been updated for your sector.', 'تم تحديث خريطة الرادار لقطاعك الفلاحي.', 'Le radar a été mis à jour pour votre secteur.')}</p>
            </div>
          ) : (
            <form onSubmit={handleCreateReport} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">{tr('Crop Type', 'المحصول', 'Culture')}</label>
                  <select
                    value={newCrop}
                    onChange={(e) => setNewCrop(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-xl border bg-background text-xs"
                  >
                    <option value="Tomato (Under Greenhouse)">Tomato / Greenhouse (طماطم محمية)</option>
                    <option value="Potato (Pivot / Field)">Potato (بطاطا)</option>
                    <option value="Wheat / Cereals">Durum Wheat (قمح صلب)</option>
                    <option value="Citrus / Oranges">Citrus (حمضيات)</option>
                    <option value="Olive Groves">Olive (زيتون)</option>
                    <option value="Grapevine">Grapevine (كرمة العنب)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">{tr('Disease / Pest Observed', 'المرض أو الآفة الملاحظة', 'Maladie / Ravageur')}</label>
                  <input
                    type="text"
                    required
                    value={newDisease}
                    onChange={(e) => setNewDisease(e.target.value)}
                    placeholder="e.g. Tuta, Mildiou, Oïdium..."
                    className="w-full h-9 px-2.5 rounded-xl border bg-background text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">{tr('Wilaya', 'الولاية', 'Wilaya')}</label>
                  <select
                    value={newWilaya}
                    onChange={(e) => setNewWilaya(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-xl border bg-background text-xs"
                  >
                    <option value="Biskra">Biskra (بسكرة)</option>
                    <option value="El Oued">El Oued (الوادي)</option>
                    <option value="Blida">Blida (البليدة)</option>
                    <option value="Mostaganem">Mostaganem (مستغانم)</option>
                    <option value="Mascara">Mascara (معسكر)</option>
                    <option value="Sétif">Sétif (سطيف)</option>
                    <option value="Aïn Defla">Aïn Defla (عين الدفلى)</option>
                    <option value="Tizi Ouzou">Tizi Ouzou (تيزي وزو)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">{tr('Commune / Sector', 'البلدية / المنطقة', 'Commune')}</label>
                  <input
                    type="text"
                    required
                    value={newCommune}
                    onChange={(e) => setNewCommune(e.target.value)}
                    placeholder="e.g. Sidi Okba, Boufarik..."
                    className="w-full h-9 px-2.5 rounded-xl border bg-background text-xs font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">{tr('Visual Severity Level', 'درجة انتشار الإصابة بالحقل', 'Niveau d\'Infestation')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'moderate', label: '🟡 Moderate', bg: 'bg-yellow-500/10' },
                    { id: 'high', label: '🟠 High', bg: 'bg-amber-500/10' },
                    { id: 'critical', label: '🔴 Critical Outbreak', bg: 'bg-rose-500/10' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setNewSeverity(lvl.id as any)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        newSeverity === lvl.id ? 'border-rose-600 bg-rose-500/20 text-rose-800 dark:text-rose-200' : 'border-border bg-card'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button type="button" variant="outline" onClick={() => setIsReportModalOpen(false)} className="text-xs">
                  {tr('Cancel', 'إلغاء', 'Annuler')}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5"
                >
                  {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  <span>{tr('Broadcast Outbreak Alert', 'نشر التنبيه الفوري', 'Diffuser l\'Alerte')}</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
