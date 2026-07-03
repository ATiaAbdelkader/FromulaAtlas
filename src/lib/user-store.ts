// Persistent user state: favorites, recents, calc history, notes.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CalcHistoryEntry {
  id: string; timestamp: number; formulaCode: string; formulaName: string; formulaPart: string;
  inputs: Record<string, number>;
  inputLabels: { key: string; label: string; value: number; unit?: string }[];
  result: { value: string; label: string; interpretation?: string };
}

interface UserState {
  favorites: string[];
  toggleFavorite: (code: string) => void;
  isFavorite: (code: string) => boolean;
  recents: string[];
  addRecent: (code: string) => void;
  calcHistory: CalcHistoryEntry[];
  addCalcHistory: (entry: Omit<CalcHistoryEntry, 'id' | 'timestamp'>) => void;
  clearCalcHistory: () => void;
  removeCalcHistory: (id: string) => void;
  notes: Record<string, string>;
  setNote: (code: string, note: string) => void;
  removeNote: (code: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (code) => set(state => ({
        favorites: state.favorites.includes(code) ? state.favorites.filter(c => c !== code) : [...state.favorites, code],
      })),
      isFavorite: (code) => get().favorites.includes(code),
      recents: [],
      addRecent: (code) => set(state => ({ recents: [code, ...state.recents.filter(c => c !== code)].slice(0, 12) })),
      calcHistory: [],
      addCalcHistory: (entry) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        set(state => ({ calcHistory: [{ ...entry, id, timestamp: Date.now() }, ...state.calcHistory].slice(0, 50) }));
      },
      clearCalcHistory: () => set({ calcHistory: [] }),
      removeCalcHistory: (id) => set(state => ({ calcHistory: state.calcHistory.filter(e => e.id !== id) })),
      notes: {},
      setNote: (code, note) => set(state => {
        const next = { ...state.notes };
        const trimmed = note.trim();
        if (trimmed) next[code] = trimmed; else delete next[code];
        return { notes: next };
      }),
      removeNote: (code) => set(state => { const next = { ...state.notes }; delete next[code]; return { notes: next }; }),
    }),
    { name: 'agri-atlas-user-state', version: 1 }
  )
);
