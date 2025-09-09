import { create } from 'zustand';
import { City } from '@/services/api';

interface CitiesState {
  cities: City[];
  loading: boolean;
  error: string | null;
  setCities: (cities: City[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addCity: (city: City) => void;
  updateCity: (id: number, city: Partial<City>) => void;
  removeCity: (id: number) => void;
  clearCities: () => void;
}

export const useCitiesStore = create<CitiesState>((set, get) => ({
  cities: [],
  loading: false,
  error: null,
  
  setCities: (cities) => set({ cities, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  addCity: (city) => set((state) => ({
    cities: [...state.cities, city]
  })),
  
  updateCity: (id, updates) => set((state) => ({
    cities: state.cities.map(city => 
      city.id === id ? { ...city, ...updates } : city
    )
  })),
  
  removeCity: (id) => set((state) => ({
    cities: state.cities.filter(city => city.id !== id)
  })),
  
  clearCities: () => set({ cities: [], error: null })
}));