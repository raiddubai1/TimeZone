import { create } from 'zustand';

interface UIState {
  // Loading states
  globalLoading: boolean;
  apiLoading: boolean;
  
  // Modal states
  isAddCityModalOpen: boolean;
  isContactModalOpen: boolean;
  
  // Toast notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
  }>;
  
  // Theme
  theme: 'light' | 'dark';
  
  // Actions
  setGlobalLoading: (loading: boolean) => void;
  setApiLoading: (loading: boolean) => void;
  setAddCityModalOpen: (open: boolean) => void;
  setContactModalOpen: (open: boolean) => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  globalLoading: false,
  apiLoading: false,
  isAddCityModalOpen: false,
  isContactModalOpen: false,
  notifications: [],
  theme: 'light',
  
  setGlobalLoading: (globalLoading) => set({ globalLoading }),
  setApiLoading: (apiLoading) => set({ apiLoading }),
  setAddCityModalOpen: (isAddCityModalOpen) => set({ isAddCityModalOpen }),
  setContactModalOpen: (isContactModalOpen) => set({ isContactModalOpen }),
  
  addNotification: (notification) => set((state) => ({
    notifications: [
      ...state.notifications,
      {
        ...notification,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      }
    ]
  })),
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(notif => notif.id !== id)
  })),
  
  clearNotifications: () => set({ notifications: [] }),
  
  setTheme: (theme) => set({ theme })
}));