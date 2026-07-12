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

export function FarmProfileWizard({ open, onOpenChange, onSaved }: FarmProfileWizardProps) {
  const [step, setStep] = useState<Step>('Name');
  const [profile, setProfile] = useState<FarmProfile>({});
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

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
      setLocError('Geolocation not available in this browser');
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
        setLocError(err.message || 'Could not get location');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

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
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tractor className="h-5 w-5 text-emerald-600" />
            {step === 'Name' && 'Welcome to Formula Atlas'}
            {step === 'Location' && 'Where is your farm?'}
            {step === 'Crop' && 'What are you growing?'}
            {step === 'Details' && 'Planting details'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Farm profile setup — step {stepIndex + 1} of {STEPS.length}
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
                Let's set up your farm profile. This takes 30 seconds and pre-fills your location, crop, and planting date across all tools. You can edit it later.
              </p>
              <div>
                <Label className="text-xs">Farm name (optional)</Label>
                <Input
                  value={profile.name ?? ''}
                  onChange={e => update({ name: e.target.value })}
                  placeholder="e.g. Green Valley Farm"
                  className="mt-1"
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 'Location' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Used for weather forecasts, ET₀ calculations, and sunrise/sunset times. We won't share this — it's stored only in your browser.
              </p>
              <Button
                onClick={useMyLocation}
                disabled={locating}
                variant="outline"
                className="w-full gap-2"
              >
                <Crosshair className={`h-4 w-4 ${locating ? 'animate-pulse' : ''}`} />
                {locating ? 'Detecting…' : 'Use my current location'}
              </Button>
              {locError && (
                <p className="text-[10px] text-rose-600">{locError}</p>
              )}
              <div className="text-center text-[10px] text-muted-foreground">— or enter manually —</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px]">Latitude</Label>
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
                  <Label className="text-[10px]">Longitude</Label>
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
                  <Check className="h-3 w-3" /> Location set: {profile.lat}, {profile.lng}
                </div>
              )}
            </div>
          )}

          {step === 'Crop' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Pick your main crop. This pre-fills the Labor Calendar, Fertilization Generator, and ET Tracker with the right Kc values and growth stages.
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
                    <span className="text-[11px] font-medium leading-tight">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'Details' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                When did you plant (or plan to plant)? This anchors the Labor Calendar to the right growth stage.
              </p>
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Planting date
                </Label>
                <Input
                  type="date"
                  value={profile.plantingDate ?? ''}
                  onChange={e => update({ plantingDate: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Sprout className="h-3 w-3" /> Total area (hectares)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={profile.area ?? ''}
                  onChange={e => update({ area: parseFloat(e.target.value) || undefined })}
                  placeholder="e.g. 5.0"
                  className="mt-1"
                />
              </div>
              <div className="rounded-md border bg-muted/20 p-2 text-[10px] text-muted-foreground">
                💡 You can change any of this later from the Home tab → "Edit farm profile".
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
            {stepIndex === 0 ? 'Skip for now' : 'Back'}
          </Button>
          {stepIndex < STEPS.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setStep(STEPS[stepIndex + 1])}
              disabled={!canProceed}
              className="gap-1 text-xs"
            >
              Next <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={save}
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
            >
              <Check className="h-3.5 w-3.5" /> Save farm profile
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
