'use client';

/**
 * Farm Profile Setup — one-time wizard that collects:
 *   - Farm name
 *   - Location (lat/lng, with "use my location" button)
 *   - Main crop (from the crop-lifecycle database)
 *   - Planting date
 *   - Total area (ha)
 *
 * Saves to localStorage (farm_profile_v1). The data pre-fills:
 *   - ET Tracker location
 *   - WeatherRadar location
 *   - Labor Calendar crop + planting date
 *   - Fertilization Generator crop
 *   - Home Dashboard greeting
 *
 * Shows automatically on first visit (when no profile exists). Can be
 * re-opened from the Home Dashboard's "Edit farm profile" button.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sprout, MapPin, Crosshair, Check, ArrowRight, ArrowLeft, Tractor,
  Calendar, Sparkles,
} from 'lucide-react';
import { CROP_LIFECYCLES } from '@/lib/crop-lifecycle';
import { localizedCropName } from '@/lib/crop-localization';
import { useTranslation, type Language } from '@/lib/language-store';
import { pushFarmProfileToServer } from '@/lib/farm-profile-sync';
import { FieldBoundaryMap, computePolygonAreaHa } from '@/components/agri/field-boundary-map';

const FARM_PROFILE_KEY = 'farm_profile_v1';
const ET_TRACKER_LOC_KEY = 'et_tracker_last_loc_v1';

export interface FarmProfile {
  name?: string;
  lat?: string;
  lng?: string;
  crop?: string;
  plantingDate?: string;
  area?: number;
  setupCompleted?: boolean;
}

interface FarmProfileWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when the profile is saved. Parent can refresh state. */
  onSaved?: () => void;
}

const STEPS = ['Name', 'Location', 'Crop', 'Details'] as const;
type Step = typeof STEPS[number];

function copyFor(language: Language, en: string, fr: string, ar: string) {
  return language === 'ar' ? ar : language === 'fr' ? fr : en;
}

export function FarmProfileWizard({ open, onOpenChange, onSaved }: FarmProfileWizardProps) {
  const [step, setStep] = useState<Step>('Name');
  const [profile, setProfile] = useState<FarmProfile>({});
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [useMapForArea, setUseMapForArea] = useState(false);
  const [boundaryPoints, setBoundaryPoints] = useState<[number, number][]>([]);
  const { language } = useTranslation();

  // Load existing profile on open
  useEffect(() => {
    if (open) {
      try {
        const saved = localStorage.getItem(FARM_PROFILE_KEY);
        if (saved) setProfile(JSON.parse(saved));
      } catch { /* ignore */ }
      setStep('Name');
    }
  }, [open]);

  const update = (patch: Partial<FarmProfile>) => {
    setProfile(prev => ({ ...prev, ...patch }));
  };

  const useMyLocation = useCallback(() => {
    setLocating(true);
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError(copyFor(language, 'Geolocation not available in this browser', 'La géolocalisation n’est pas disponible dans ce navigateur', 'التحديد الجغرافي غير متاح في هذا المتصفح'));
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update({
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        });
        setLocating(false);
      },
      (err) => {
        setLocError(err.message || copyFor(language, 'Could not get location', 'Impossible d’obtenir la localisation', 'تعذّر الحصول على الموقع'));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [language]);

  const save = () => {
    const finalProfile = { ...profile, setupCompleted: true };
    try {
      localStorage.setItem(FARM_PROFILE_KEY, JSON.stringify(finalProfile));
      // Also sync the ET Tracker location so it auto-uses the farm's location
      if (profile.lat && profile.lng) {
        localStorage.setItem(ET_TRACKER_LOC_KEY, JSON.stringify({
          lat: profile.lat, lng: profile.lng,
        }));
      }
    } catch { /* ignore */ }
    // Sync to Postgres (for the WhatsApp cron — no-op if not logged in)
    pushFarmProfileToServer().catch(() => { /* silent — localStorage is source of truth */ });
    onSaved?.();
    onOpenChange(false);
  };

  const stepIndex = STEPS.indexOf(step);
  const canProceed = step === 'Name' ? true
    : step === 'Location' ? Boolean(profile.lat && profile.lng)
    : step === 'Crop' ? Boolean(profile.crop)
    : true;  // Details step is optional

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={useMapForArea ? 'max-w-2xl' : 'max-w-md'} aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tractor className="h-5 w-5 text-emerald-600" />
            {step === 'Name' && copyFor(language, 'Welcome to Formula Atlas', 'Bienvenue dans Formula Atlas', 'مرحبًا بك في أطلس المعادلات')}
            {step === 'Location' && copyFor(language, 'Where is your farm?', 'Où se trouve votre ferme ?', 'أين مزرعتك؟')}
            {step === 'Crop' && copyFor(language, 'What are you growing?', 'Que cultivez-vous ?', 'ماذا تزرع؟')}
            {step === 'Details' && copyFor(language, 'Planting details', 'Détails de la plantation', 'تفاصيل الزراعة')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {copyFor(language, `Farm profile setup — step ${stepIndex + 1} of ${STEPS.length}`, `Configuration du profil de ferme — étape ${stepIndex + 1} sur ${STEPS.length}`, `إعداد ملف المزرعة — الخطوة ${stepIndex + 1} من ${STEPS.length}`)}
          </DialogDescription>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-2">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? 'bg-emerald-600' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="space-y-4 min-h-[180px]">
          {step === 'Name' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {copyFor(language, 'Let\'s set up your farm profile. This takes 30 seconds and pre-fills your location, crop, and planting date across all tools. You can edit it later.', 'Configurons votre profil de ferme. Cela prend 30 secondes et préremplit votre localisation, votre culture et votre date de plantation dans tous les outils. Vous pourrez le modifier plus tard.', 'لنُعدّ ملف مزرعتك. يستغرق هذا 30 ثانية ويملأ مسبقاً موقعك ومحصولك وتاريخ زراعتك عبر كل الأدوات. يمكنك تعديله لاحقاً.')}
              </p>
              <div>
                <Label className="text-xs">{copyFor(language, 'Farm name (optional)', 'Nom de la ferme (facultatif)', 'اسم المزرعة (اختياري)')}</Label>
                <Input
                  value={profile.name ?? ''}
                  onChange={e => update({ name: e.target.value })}
                  placeholder={copyFor(language, 'e.g. Green Valley Farm', 'ex. Ferme de la Vallée Verte', 'مثال: مزرعة الوادي الأخضر')}
                  className="mt-1"
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 'Location' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {copyFor(language, 'Used for weather forecasts, ET₀ calculations, and sunrise/sunset times. We won\'t share this — it\'s stored only in your browser.', 'Utilisé pour les prévisions météo, les calculs d’ET₀ et les heures de lever et coucher du soleil. Nous ne le partagerons pas : il reste dans votre navigateur.', 'يُستخدم لتوقعات الطقس وحسابات ET₀ وأوقات الشروق/الغروب. لن نشاركه — يُخزَّن فقط في متصفحك.')}
              </p>
              <Button
                onClick={useMyLocation}
                disabled={locating}
                variant="outline"
                className="w-full gap-2"
              >
                <Crosshair className={`h-4 w-4 ${locating ? 'animate-pulse' : ''}`} />
                {locating ? copyFor(language, 'Detecting…', 'Détection…', 'جارٍ التحديد…') : copyFor(language, 'Use my current location', 'Utiliser ma localisation actuelle', 'استخدم موقعي الحالي')}
              </Button>
              {locError && (
                <p className="text-[10px] text-rose-600">{locError}</p>
              )}
              <div className="text-center text-[10px] text-muted-foreground">{copyFor(language, '— or enter manually —', '— ou saisissez-la manuellement —', '— أو أدخل يدوياً —')}</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px]">{copyFor(language, 'Latitude', 'Latitude', 'خط العرض')}</Label>
                  <Input
                    value={profile.lat ?? ''}
                    onChange={e => update({ lat: e.target.value })}
                    type="number"
                    step="0.000001"
                    placeholder="37.77"
                    className="text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">{copyFor(language, 'Longitude', 'Longitude', 'خط الطول')}</Label>
                  <Input
                    value={profile.lng ?? ''}
                    onChange={e => update({ lng: e.target.value })}
                    type="number"
                    step="0.000001"
                    placeholder="-122.42"
                    className="text-xs font-mono"
                  />
                </div>
              </div>
              {profile.lat && profile.lng && (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600">
                  <Check className="h-3 w-3" /> {copyFor(language, 'Location set:', 'Localisation définie :', 'تم تعيين الموقع:')} {profile.lat}, {profile.lng}
                </div>
              )}
            </div>
          )}

          {step === 'Crop' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {copyFor(language, 'Pick your main crop. This pre-fills the Labor Calendar, Fertilization Generator, and ET Tracker with the right Kc values and growth stages.', 'Choisissez votre culture principale. Cela préremplit le calendrier de main-d’œuvre, le générateur de fertilisation et le suivi de l’ET avec les bons coefficients Kc et stades de croissance.', 'اختر محصولك الرئيسي. هذا يملأ مسبقاً تقويم العمالة، مولّد التسميد، ومتعقّب ET بقيم Kc ومراحل النمو الصحيحة.')}
              </p>
              <div className="grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto">
                {CROP_LIFECYCLES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => update({ crop: c.id })}
                    className={`flex items-center gap-2 p-2 rounded-md border text-left transition-colors ${
                      profile.crop === c.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-lg">{c.emoji}</span>
                    <span className="text-[11px] font-medium leading-tight">{localizedCropName(language, c.id, c.name)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'Details' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {copyFor(language, 'When did you plant (or plan to plant)? This anchors the Labor Calendar to the right growth stage.', 'Quand avez-vous planté (ou prévoyez-vous de planter) ? Cette date positionne le calendrier de main-d’œuvre sur le bon stade de croissance.', 'متى زرعت (أو تخطط للزراعة)؟ هذا يثبّت تقويم العمالة على مرحلة النمو الصحيحة.')}
              </p>
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {copyFor(language, 'Planting date', 'Date de plantation', 'تاريخ الزراعة')}
                </Label>
                <Input
                  type="date"
                  value={profile.plantingDate ?? ''}
                  onChange={e => update({ plantingDate: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Sprout className="h-3 w-3" /> {copyFor(language, 'Total area (hectares)', 'Surface totale (hectares)', 'المساحة الإجمالية (هكتار)')}
                  </Label>
                  {profile.lat && profile.lng && (
                    <button
                      type="button"
                      onClick={() => setUseMapForArea(!useMapForArea)}
                      className="text-[10px] text-emerald-600 hover:underline"
                    >
                      {useMapForArea
                        ? copyFor(language, 'Enter manually', 'Saisir manuellement', 'إدخال يدوي')
                        : copyFor(language, 'Draw on map', 'Dessiner sur la carte', 'ارسم على الخريطة')}
                    </button>
                  )}
                </div>

                {useMapForArea && profile.lat && profile.lng ? (
                  <div className="mt-1">
                    <FieldBoundaryMap
                      center={[parseFloat(profile.lat), parseFloat(profile.lng)]}
                      onChange={(points, areaHa) => {
                        setBoundaryPoints(points);
                        if (areaHa > 0) {
                          update({ area: areaHa });
                        }
                      }}
                    />
                  </div>
                ) : (
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={profile.area ?? ''}
                    onChange={e => update({ area: parseFloat(e.target.value) || undefined })}
                    placeholder={copyFor(language, 'e.g. 5.0', 'ex. 5,0', 'مثال: 5.0')}
                    className="mt-1"
                  />
                )}

                {boundaryPoints.length > 0 && useMapForArea && (
                  <p className="text-[10px] text-emerald-600 mt-1">
                    {copyFor(
                      language,
                      `${boundaryPoints.length} boundary points · ${profile.area ?? 0} ha`,
                      `${boundaryPoints.length} points de limite · ${profile.area ?? 0} ha`,
                      `${boundaryPoints.length} نقاط حدود · ${profile.area ?? 0} هكتار`,
                    )}
                  </p>
                )}
              </div>
              <div className="rounded-md border bg-muted/20 p-2 text-[10px] text-muted-foreground">
                {copyFor(language, '💡 You can change any of this later from the Home tab → "Edit farm profile".', '💡 Vous pourrez modifier ces informations plus tard depuis l’onglet Accueil → « Modifier le profil de ferme ».', '💡 يمكنك تغيير كل هذا لاحقاً من التبويب الرئيسي ← «تعديل ملف المزرعة».')}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => stepIndex > 0 ? setStep(STEPS[stepIndex - 1]) : onOpenChange(false)}
            className="gap-1 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {stepIndex === 0 ? copyFor(language, 'Skip for now', 'Passer pour le moment', 'تخطّي الآن') : copyFor(language, 'Back', 'Retour', 'رجوع')}
          </Button>
          {stepIndex < STEPS.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setStep(STEPS[stepIndex + 1])}
              disabled={!canProceed}
              className="gap-1 text-xs"
            >
              {copyFor(language, 'Next', 'Suivant', 'التالي')} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={save}
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
            >
              <Check className="h-3.5 w-3.5" /> {copyFor(language, 'Save farm profile', 'Enregistrer le profil de ferme', 'حفظ ملف المزرعة')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Hook: useFarmProfile — read the profile from localStorage
// ============================================================================

export function useFarmProfile(): FarmProfile | null {
  const [profile, setProfile] = useState<FarmProfile | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(FARM_PROFILE_KEY);
      if (saved) setProfile(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  return profile;
}

// ============================================================================
// Helper: check if setup is needed
// ============================================================================

export function needsFarmProfileSetup(): boolean {
  try {
    const saved = localStorage.getItem(FARM_PROFILE_KEY);
    if (!saved) return true;
    const profile = JSON.parse(saved);
    return !profile.setupCompleted;
  } catch {
    return true;
  }
}
