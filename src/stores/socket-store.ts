import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  
  // Real-time data
  realTimeCities: Array<{
    id: number;
    name: string;
    country: string;
    timezone: string;
    currentTime: string;
    offset: string;
  }>;
  
  realTimePreferences: Array<{
    id: number;
    userId: number;
    cityId: number;
    city: {
      id: number;
      name: string;
      country: string;
      timezone: string;
    };
  }>;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  setConnectionError: (error: string | null) => void;
  updateRealTimeCities: (cities: SocketState['realTimeCities']) => void;
  updateRealTimePreferences: (preferences: SocketState['realTimePreferences']) => void;
  clearRealTimeData: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  connectionError: null,
  realTimeCities: [],
  realTimePreferences: [],
  
  connect: () => {
    try {
      const socketInstance = io({
        path: '/api/socketio',
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      
      socketInstance.on('connect', () => {
        set({ isConnected: true, connectionError: null });
      });
      
      socketInstance.on('disconnect', (reason) => {
        set({ isConnected: false });
      });
      
      socketInstance.on('connect_error', (error) => {
        set({ connectionError: error.message });
      });
      
      // Listen for real-time city updates
      socketInstance.on('cities-update', (data) => {
        get().updateRealTimeCities(data.cities);
      });
      
      // Listen for real-time preference updates
      socketInstance.on('preferences-update', (data) => {
        get().updateRealTimePreferences(data.preferences);
      });
      
      // Listen for time updates
      socketInstance.on('time-update', (data) => {
        get().updateRealTimeCities(data.cities);
      });
      
      set({ socket: socketInstance });
      
    } catch (error) {
      set({ 
        connectionError: error instanceof Error ? error.message : 'Failed to connect socket'
      });
    }
  },
  
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
  
  setConnectionError: (connectionError) => set({ connectionError }),
  
  updateRealTimeCities: (realTimeCities) => set({ realTimeCities }),
  
  updateRealTimePreferences: (realTimePreferences) => set({ realTimePreferences }),
  
  clearRealTimeData: () => set({ 
    realTimeCities: [], 
    realTimePreferences: [] 
  })
}));