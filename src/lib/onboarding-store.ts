/**
 * Onboarding store — localStorage-backed state for the first-visit onboarding flow.
 *
 * Keys:
 *   nutriplant_onboarding_v1  → { completed: boolean, role: string, crop: string, skippedAt: number }
 */

export type UserRole = 'grower' | 'agronomist' | 'student' | 'consultant' | 'other';

export interface OnboardingState {
  completed: boolean;       // has the user finished the onboarding?
  role: UserRole | null;
  crop: string | null;      // e.g. 'tomato'
  completedAt: number | null;
  skippedAt: number | null;
}

const KEY = 'nutriplant_onboarding_v1';

const DEFAULT_STATE: OnboardingState = {
  completed: false,
  role: null,
  crop: null,
  completedAt: null,
  skippedAt: null,
};

/** Returns true if this is the user's first visit (no onboarding record exists). */
export function isFirstVisit(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(KEY);
    return !raw;
  } catch {
    return false;
  }
}

/** Load the persisted onboarding state (or default). */
export function loadOnboarding(): OnboardingState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

/** Persist the onboarding state. */
export function saveOnboarding(state: OnboardingState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore quota / privacy mode errors
  }
}

/** Mark onboarding as completed with the given role + crop. */
export function completeOnboarding(role: UserRole, crop: string): void {
  saveOnboarding({
    completed: true,
    role,
    crop,
    completedAt: Date.now(),
    skippedAt: null,
  });
}

/** Mark onboarding as skipped (so it doesn't auto-show again). */
export function skipOnboarding(): void {
  const existing = loadOnboarding();
  saveOnboarding({
    ...existing,
    completed: true,  // treat skip as "don't auto-show again"
    skippedAt: Date.now(),
  });
}

/** Reset onboarding (so it auto-shows again on next page load). */
export function resetOnboarding(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export const ROLE_OPTIONS: { id: UserRole; label: string; emoji: string; description: string }[] = [
  { id: 'grower',      label: 'Grower',      emoji: '🌱', description: 'I manage a farm or crop' },
  { id: 'agronomist',  label: 'Agronomist',  emoji: '🔬', description: 'I advise growers on nutrition & agronomy' },
  { id: 'consultant',  label: 'Consultant',  emoji: '📋', description: 'I consult on crop planning & sustainability' },
  { id: 'student',     label: 'Student',     emoji: '🎓', description: 'I study agronomy or agriculture' },
  { id: 'other',       label: 'Other',       emoji: '✨', description: 'I just love plants' },
];

export const CROP_OPTIONS = [
  { id: 'tomato',     label: 'Tomato',     emoji: '🍅' },
  { id: 'strawberry', label: 'Strawberry', emoji: '🍓' },
  { id: 'avocado',    label: 'Avocado',    emoji: '🥑' },
  { id: 'blueberry',  label: 'Blueberry',  emoji: '🫐' },
  { id: 'lettuce',    label: 'Lettuce',    emoji: '🥬' },
  { id: 'pepper',     label: 'Bell pepper',emoji: '🫑' },
  { id: 'cucumber',   label: 'Cucumber',   emoji: '🥒' },
  { id: 'citrus',     label: 'Citrus',     emoji: '🍊' },
  { id: 'coffee',     label: 'Coffee',     emoji: '☕' },
  { id: 'maize',      label: 'Maize',      emoji: '🌽' },
];
