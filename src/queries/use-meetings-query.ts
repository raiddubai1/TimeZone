import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingsApi, Meeting, CreateMeetingData } from '@/services/api';

// Query key for meetings
export const MEETINGS_QUERY_KEY = ['meetings'];

// Hook for fetching all meetings
export const useMeetingsQuery = () => {
  return useQuery({
    queryKey: MEETINGS_QUERY_KEY,
    queryFn: () => meetingsApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for creating a new meeting
export const useCreateMeetingMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (meetingData: CreateMeetingData) => meetingsApi.create(meetingData),
    onSuccess: () => {
      // Invalidate and refetch meetings query
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY });
    },
  });
};

// Hook for updating a meeting
export const useUpdateMeetingMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateMeetingData }) => 
      meetingsApi.update(id, data),
    onSuccess: () => {
      // Invalidate and refetch meetings query
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY });
    },
  });
};

// Hook for deleting a meeting
export const useDeleteMeetingMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => meetingsApi.delete(id),
    onSuccess: () => {
      // Invalidate and refetch meetings query
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY });
    },
  });
};