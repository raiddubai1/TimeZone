import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { preferencesApi, TimeZonePreference } from '@/services/api';
import { usePreferencesStore } from '@/stores';

// Query keys
export const preferencesKeys = {
  all: ['preferences'] as const,
  lists: () => [...preferencesKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...preferencesKeys.lists(), { filters }] as const,
  details: () => [...preferencesKeys.all, 'detail'] as const,
  detail: (id: number) => [...preferencesKeys.details(), id] as const,
  user: (userId: number) => [...preferencesKeys.all, 'user', userId] as const,
  city: (cityId: number) => [...preferencesKeys.all, 'city', cityId] as const,
};

// Hooks
export const usePreferencesQuery = (filters?: Record<string, any>) => {
  const setPreferences = usePreferencesStore((state) => state.setPreferences);
  const setLoading = usePreferencesStore((state) => state.setLoading);
  const setError = usePreferencesStore((state) => state.setError);

  return useQuery({
    queryKey: preferencesKeys.list(filters || {}),
    queryFn: async () => {
      setLoading(true);
      try {
        const preferences = await preferencesApi.getAll();
        setPreferences(preferences);
        setError(null);
        return preferences;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch preferences';
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const usePreferenceQuery = (id: number) => {
  return useQuery({
    queryKey: preferencesKeys.detail(id),
    queryFn: () => preferencesApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUserPreferencesQuery = (userId: number) => {
  const { data: allPreferences } = usePreferencesQuery();
  
  return useQuery({
    queryKey: preferencesKeys.user(userId),
    queryFn: () => {
      if (!allPreferences) return [];
      return allPreferences.filter(pref => pref.userId === userId);
    },
    enabled: !!allPreferences && !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCityPreferencesQuery = (cityId: number) => {
  const { data: allPreferences } = usePreferencesQuery();
  
  return useQuery({
    queryKey: preferencesKeys.city(cityId),
    queryFn: () => {
      if (!allPreferences) return [];
      return allPreferences.filter(pref => pref.cityId === cityId);
    },
    enabled: !!allPreferences && !!cityId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreatePreferenceMutation = () => {
  const queryClient = useQueryClient();
  const addPreference = usePreferencesStore((state) => state.addPreference);

  return useMutation({
    mutationFn: preferencesApi.create,
    onSuccess: (newPreference) => {
      // Update Zustand store
      addPreference(newPreference);
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: preferencesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: preferencesKeys.user(newPreference.userId) });
      queryClient.invalidateQueries({ queryKey: preferencesKeys.city(newPreference.cityId) });
    },
  });
};

export const useUpdatePreferenceMutation = () => {
  const queryClient = useQueryClient();
  const updatePreference = usePreferencesStore((state) => state.updatePreference);

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<TimeZonePreference, 'id' | 'user' | 'city'>> }) =>
      preferencesApi.update(id, data),
    onSuccess: (updatedPreference) => {
      // Update Zustand store
      updatePreference(updatedPreference.id, updatedPreference);
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: preferencesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: preferencesKeys.detail(updatedPreference.id) });
      queryClient.invalidateQueries({ queryKey: preferencesKeys.user(updatedPreference.userId) });
      queryClient.invalidateQueries({ queryKey: preferencesKeys.city(updatedPreference.cityId) });
    },
  });
};

export const useDeletePreferenceMutation = () => {
  const queryClient = useQueryClient();
  const removePreference = usePreferencesStore((state) => state.removePreference);

  return useMutation({
    mutationFn: preferencesApi.delete,
    onSuccess: (_, preferenceId) => {
      // Update Zustand store
      removePreference(preferenceId);
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: preferencesKeys.lists() });
    },
  });
};