import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { citiesApi, City } from '@/services/api';
import { useCitiesStore } from '@/stores';

// Query keys
export const citiesKeys = {
  all: ['cities'] as const,
  lists: () => [...citiesKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...citiesKeys.lists(), { filters }] as const,
  details: () => [...citiesKeys.all, 'detail'] as const,
  detail: (id: number) => [...citiesKeys.details(), id] as const,
};

// Hooks
export const useCitiesQuery = (filters?: Record<string, any>) => {
  const setCities = useCitiesStore((state) => state.setCities);
  const setLoading = useCitiesStore((state) => state.setLoading);
  const setError = useCitiesStore((state) => state.setError);

  return useQuery({
    queryKey: citiesKeys.list(filters || {}),
    queryFn: async () => {
      setLoading(true);
      try {
        const cities = await citiesApi.getAll();
        setCities(cities);
        setError(null);
        return cities;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch cities';
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

export const useCityQuery = (id: number) => {
  return useQuery({
    queryKey: citiesKeys.detail(id),
    queryFn: () => citiesApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateCityMutation = () => {
  const queryClient = useQueryClient();
  const addCity = useCitiesStore((state) => state.addCity);

  return useMutation({
    mutationFn: citiesApi.create,
    onSuccess: (newCity) => {
      // Update Zustand store
      addCity(newCity);
      
      // Invalidate and refetch cities list
      queryClient.invalidateQueries({ queryKey: citiesKeys.lists() });
    },
  });
};

export const useUpdateCityMutation = () => {
  const queryClient = useQueryClient();
  const updateCity = useCitiesStore((state) => state.updateCity);

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<City, 'id'>> }) =>
      citiesApi.update(id, data),
    onSuccess: (updatedCity) => {
      // Update Zustand store
      updateCity(updatedCity.id, updatedCity);
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: citiesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: citiesKeys.detail(updatedCity.id) });
    },
  });
};

export const useDeleteCityMutation = () => {
  const queryClient = useQueryClient();
  const removeCity = useCitiesStore((state) => state.removeCity);

  return useMutation({
    mutationFn: citiesApi.delete,
    onSuccess: (_, cityId) => {
      // Update Zustand store
      removeCity(cityId);
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: citiesKeys.lists() });
    },
  });
};