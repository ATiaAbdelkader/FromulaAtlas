/**
 * Shared calendar-store: zustand store for the Algeria Agriculture Calendar.
 * Persists zone, fields, tasks, treatment history, trap catches, labor
 * bookings, equipment bookings, reminders and AI-generated plans.
 *
 * Stored under localStorage key `algeria-agri-calendar` so it survives
 * page reloads (offline-first behaviour).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AgroClimaticZone } from '@/lib/algeria-agri-calendar-data';

// ============================================================================
// Types
// ============================================================================

export interface CalField {
  id: string;
  name: string;
  cropId: string;
  cropLabel: string;
  area: number;                 // ha
  plantingDate: string;         // YYYY-MM-DD
  zone: AgroClimaticZone;
  wilaya?: string;
  irrigationSystem: 'drip' | 'sprinkler' | 'furrow' | 'rainfed';
  soil?: string;
  color: string;                // hex color for the field on the calendar
}

export interface CalTask {
  id: string;
  fieldId: string;
  /** ISO date string (YYYY-MM-DD) — the day the task is scheduled. */
  date: string;
  title: string;
  category:
    | 'soil' | 'pest_monitoring' | 'irrigation' | 'fertilization'
    | 'pruning' | 'harvest_prep' | 'equipment' | 'spray' | 'scout' | 'harvest'
    | 'other';
  status: 'planned' | 'in_progress' | 'done' | 'skipped';
  notes?: string;
  /** For spray tasks — the active matter applied (drives PHI countdown). */
  activeMatter?: string;
  /** Equipment booked for this task. */
  equipmentId?: string;
  /** Workers assigned (worker IDs). */
  workerIds?: string[];
}

export interface CalTrapCatch {
  id: string;
  fieldId: string;
  pestId: string;
  date: string;
  count: number;          // pests per trap per week
  threshold: number;     // threshold exceeded?
  note?: string;
}

export interface CalTreatment {
  id: string;
  fieldId: string;
  cropId: string;
  date: string;
  activeMatter: string;
  /** DAR days for the active matter (snapshot at time of spray). */
  darDays: number;
  /** Computed harvest-blocked-until date. */
  harvestUnblockedDate: string;
  dose?: string;
  area?: number;
  costDZD?: number;
  notes?: string;
}

export interface CalLaborBooking {
  id: string;
  taskId: string;
  fieldId: string;
  date: string;
  hours: number;
  workerCount: number;
  workerRole: string;
  totalCostDZD: number;
}

export interface CalEquipmentBooking {
  id: string;
  taskId: string;
  equipmentId: string;
  fieldId: string;
  date: string;
  hours: number;
}

export interface CalReminder {
  id: string;
  taskId: string;
  channel: 'telegram' | 'whatsapp' | 'in_app';
  /** minutes before task date/time. */
  leadMinutes: number;
  enabled: boolean;
}

export interface CalAiPlan {
  id: string;
  fieldId: string;
  createdAt: string;
  prompt: string;
  /** JSON-stringified plan summary returned by AI. */
  planSummary: string;
  taskIds: string[];
}

interface CalendarState {
  zone: AgroClimaticZone;
  fields: CalField[];
  tasks: CalTask[];
  trapCatches: CalTrapCatch[];
  treatments: CalTreatment[];
  laborBookings: CalLaborBooking[];
  equipmentBookings: CalEquipmentBooking[];
  reminders: CalReminder[];
  aiPlans: CalAiPlan[];
  showMoon: boolean;
  showRamadan: boolean;
  showSouk: boolean;
  showWeather: boolean;
  offlineMode: boolean;
  lastSyncedAt: string | null;
  pendingSync: number;

  setZone: (z: AgroClimaticZone) => void;
  addField: (f: CalField) => void;
  updateField: (id: string, patch: Partial<CalField>) => void;
  removeField: (id: string) => void;
  addTask: (t: CalTask) => void;
  updateTask: (id: string, patch: Partial<CalTask>) => void;
  removeTask: (id: string) => void;
  addTrapCatch: (c: CalTrapCatch) => void;
  removeTrapCatch: (id: string) => void;
  addTreatment: (t: CalTreatment) => void;
  removeTreatment: (id: string) => void;
  addLaborBooking: (b: CalLaborBooking) => void;
  removeLaborBooking: (id: string) => void;
  addEquipmentBooking: (b: CalEquipmentBooking) => void;
  removeEquipmentBooking: (id: string) => void;
  addReminder: (r: CalReminder) => void;
  toggleReminder: (id: string) => void;
  removeReminder: (id: string) => void;
  addAiPlan: (p: CalAiPlan) => void;
  removeAiPlan: (id: string) => void;
  setShowMoon: (b: boolean) => void;
  setShowRamadan: (b: boolean) => void;
  setShowSouk: (b: boolean) => void;
  setShowWeather: (b: boolean) => void;
  setOfflineMode: (b: boolean) => void;
  markSynced: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

const FIELD_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'];
let colorIdx = 0;
export function pickFieldColor(): string {
  return FIELD_COLORS[colorIdx++ % FIELD_COLORS.length];
}

export function genId(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ============================================================================
// Store
// ============================================================================

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      zone: 'tell',
      fields: [],
      tasks: [],
      trapCatches: [],
      treatments: [],
      laborBookings: [],
      equipmentBookings: [],
      reminders: [],
      aiPlans: [],
      showMoon: false,
      showRamadan: true,
      showSouk: true,
      showWeather: true,
      offlineMode: false,
      lastSyncedAt: null,
      pendingSync: 0,

      setZone: (zone) => set({ zone }),

      addField: (f) => set((s) => ({ fields: [...s.fields, f] })),
      updateField: (id, patch) => set((s) => ({
        fields: s.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      })),
      removeField: (id) => set((s) => ({
        fields: s.fields.filter((f) => f.id !== id),
        tasks: s.tasks.filter((t) => t.fieldId !== id),
      })),

      addTask: (t) => set((s) => ({ tasks: [...s.tasks, t] })),
      updateTask: (id, patch) => set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      })),
      removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      addTrapCatch: (c) => set((s) => ({ trapCatches: [...s.trapCatches, c] })),
      removeTrapCatch: (id) => set((s) => ({ trapCatches: s.trapCatches.filter((c) => c.id !== id) })),

      addTreatment: (t) => set((s) => ({ treatments: [...s.treatments, t] })),
      removeTreatment: (id) => set((s) => ({ treatments: s.treatments.filter((t) => t.id !== id) })),

      addLaborBooking: (b) => set((s) => ({ laborBookings: [...s.laborBookings, b] })),
      removeLaborBooking: (id) => set((s) => ({ laborBookings: s.laborBookings.filter((b) => b.id !== id) })),

      addEquipmentBooking: (b) => set((s) => ({ equipmentBookings: [...s.equipmentBookings, b] })),
      removeEquipmentBooking: (id) => set((s) => ({ equipmentBookings: s.equipmentBookings.filter((b) => b.id !== id) })),

      addReminder: (r) => set((s) => ({ reminders: [...s.reminders, r] })),
      toggleReminder: (id) => set((s) => ({
        reminders: s.reminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
      })),
      removeReminder: (id) => set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) })),

      addAiPlan: (p) => set((s) => ({ aiPlans: [...s.aiPlans, p] })),
      removeAiPlan: (id) => set((s) => ({ aiPlans: s.aiPlans.filter((p) => p.id !== id) })),

      setShowMoon: (b) => set({ showMoon: b }),
      setShowRamadan: (b) => set({ showRamadan: b }),
      setShowSouk: (b) => set({ showSouk: b }),
      setShowWeather: (b) => set({ showWeather: b }),
      setOfflineMode: (b) => set({ offlineMode: b }),
      markSynced: () => set({ lastSyncedAt: new Date().toISOString(), pendingSync: 0 }),
    }),
    { name: 'algeria-agri-calendar' }
  )
);
