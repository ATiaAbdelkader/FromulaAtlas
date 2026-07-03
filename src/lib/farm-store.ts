// Farm management store: define farms, tag calculations, track seasons.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Farm {
  id: string; name: string; area: number; crop: string; soilType: string;
  irrigationType: string; plantingDate?: string; notes?: string; createdAt: number;
}
export interface FarmCalcEntry {
  id: string; farmId: string; timestamp: number; formulaCode: string; formulaName: string;
  inputs: Record<string, number>;
  result: { value: string; label: string; interpretation?: string };
  inputLabels: { key: string; label: string; value: number; unit?: string }[];
}

interface FarmState {
  farms: Farm[]; activeFarmId: string | null; farmCalcs: FarmCalcEntry[];
  addFarm: (farm: Omit<Farm, 'id' | 'createdAt'>) => void;
  updateFarm: (id: string, updates: Partial<Farm>) => void;
  deleteFarm: (id: string) => void;
  setActiveFarm: (id: string | null) => void;
  addFarmCalc: (entry: Omit<FarmCalcEntry, 'id' | 'timestamp'>) => void;
  removeFarmCalc: (id: string) => void;
  clearFarmCalcs: (farmId: string) => void;
}

export const useFarmStore = create<FarmState>()(
  persist(
    (set) => ({
      farms: [], activeFarmId: null, farmCalcs: [],
      addFarm: (farm) => {
        const id = `farm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        set(state => ({ farms: [...state.farms, { ...farm, id, createdAt: Date.now() }], activeFarmId: state.activeFarmId ?? id }));
      },
      updateFarm: (id, updates) => set(state => ({ farms: state.farms.map(f => f.id === id ? { ...f, ...updates } : f) })),
      deleteFarm: (id) => set(state => ({ farms: state.farms.filter(f => f.id !== id), farmCalcs: state.farmCalcs.filter(c => c.farmId !== id), activeFarmId: state.activeFarmId === id ? null : state.activeFarmId })),
      setActiveFarm: (id) => set({ activeFarmId: id }),
      addFarmCalc: (entry) => {
        const id = `calc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        set(state => ({ farmCalcs: [{ ...entry, id, timestamp: Date.now() }, ...state.farmCalcs] }));
      },
      removeFarmCalc: (id) => set(state => ({ farmCalcs: state.farmCalcs.filter(c => c.id !== id) })),
      clearFarmCalcs: (farmId) => set(state => ({ farmCalcs: state.farmCalcs.filter(c => c.farmId !== farmId) })),
    }),
    { name: 'agri-atlas-farms', version: 1 }
  )
);

export const cropOptions = ['Maize', 'Wheat', 'Rice', 'Soybean', 'Cotton', 'Sunflower', 'Tomato', 'Potato', 'Onion', 'Pepper', 'Sorghum', 'Millet', 'Barley', 'Cassava', 'Sugarcane', 'Alfalfa', 'Coffee', 'Banana', 'Mango', 'Other'];
export const soilTypeOptions = ['Sandy', 'Sandy Loam', 'Loam', 'Clay Loam', 'Clay', 'Silty Loam', 'Peat', 'Other'];
export const irrigationTypeOptions = ['Drip', 'Sprinkler', 'Surface (Furrow)', 'Center Pivot', 'Rainfed', 'Other'];
