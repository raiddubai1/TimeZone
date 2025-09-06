import { useMutation, useQuery } from '@tanstack/react-query';
import { useUIStore } from '@/stores';

// Contact form interface
export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

// Contact submission interface
export interface ContactSubmission {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'pending' | 'read' | 'responded';
}

// Query keys
export const contactKeys = {
  all: ['contact'] as const,
  submissions: () => [...contactKeys.all, 'submissions'] as const,
  submission: (id: number) => [...contactKeys.all, 'submission', id] as const,
};

// Mock API functions (in real app, these would call actual backend endpoints)
const contactApi = {
  submit: async (data: ContactFormData): Promise<ContactSubmission> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response
    return {
      id: Date.now(),
      ...data,
      createdAt: new Date().toISOString(),
      status: 'pending' as const,
    };
  },
  
  getSubmissions: async (): Promise<ContactSubmission[]> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data - in real app, this would fetch from database
    return [];
  },
  
  getSubmission: async (id: number): Promise<ContactSubmission> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock response
    throw new Error('Submission not found');
  },
};

// Validation function
export const validateContactForm = (data: Partial<ContactFormData>): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  if (!data.firstName?.trim()) {
    errors.firstName = 'First name is required';
  }
  
  if (!data.lastName?.trim()) {
    errors.lastName = 'Last name is required';
  }
  
  if (!data.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!data.subject?.trim()) {
    errors.subject = 'Subject is required';
  }
  
  if (!data.message?.trim()) {
    errors.message = 'Message is required';
  } else if (data.message.length < 10) {
    errors.message = 'Message must be at least 10 characters long';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Hooks
export const useContactSubmissionMutation = () => {
  const addNotification = useUIStore((state) => state.addNotification);

  return useMutation({
    mutationFn: contactApi.submit,
    onMutate: () => {
      // Show loading notification
      addNotification({
        type: 'info',
        title: 'Sending message...',
        message: 'Please wait while we send your message.',
      });
    },
    onSuccess: (data) => {
      // Show success notification
      addNotification({
        type: 'success',
        title: 'Message sent successfully!',
        message: `We've received your message and will get back to you soon.`,
      });
    },
    onError: (error) => {
      // Show error notification
      addNotification({
        type: 'error',
        title: 'Failed to send message',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    },
  });
};

export const useContactSubmissionsQuery = () => {
  return useQuery({
    queryKey: contactKeys.submissions(),
    queryFn: contactApi.getSubmissions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useContactSubmissionQuery = (id: number) => {
  return useQuery({
    queryKey: contactKeys.submission(id),
    queryFn: () => contactApi.getSubmission(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};