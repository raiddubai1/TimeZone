import { create } from 'zustand';
import { TimeZonePreference } from '@/services/api';

interface PreferencesState {
  preferences: TimeZonePreference[];
  loading: boolean;
  error: string | null;
  setPreferences: (preferences: TimeZonePreference[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addPreference: (preference: TimeZonePreference) => void;
  updatePreference: (id: number, preference: Partial<TimeZonePreference>) => void;
  removePreference: (id: number) => void;
  clearPreferences: () => void;
  getPreferencesByUserId: (userId: number) => TimeZonePreference[];
  getPreferencesByCityId: (cityId: number) => TimeZonePreference[];
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  preferences: [],
  loading: false,
  error: null,
  
  setPreferences: (preferences) => set({ preferences, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  addPreference: (preference) => set((state) => ({
    preferences: [...state.preferences, preference]
  })),
  
  updatePreference: (id, updates) => set((state) => ({
    preferences: state.preferences.map(pref => 
      pref.id === id ? { ...pref, ...updates } : pref
    )
  })),
  
  removePreference: (id) => set((state) => ({
    preferences: state.preferences.filter(pref => pref.id !== id)
  })),
  
  clearPreferences: () => set({ preferences: [], error: null }),
  
  getPreferencesByUserId: (userId) => {
    const { preferences } = get();
    return preferences.filter(pref => pref.userId === userId);
  },
  
  getPreferencesByCityId: (cityId) => {
    const { preferences } = get();
    return preferences.filter(pref => pref.cityId === cityId);
  }
}));