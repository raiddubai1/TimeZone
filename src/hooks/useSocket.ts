"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";

// TypeScript interfaces for socket events
interface TeamCreatedData {
  team: any;
  timestamp: string;
}

interface TeamUpdatedData {
  teamId: string;
  updates: any;
  timestamp: string;
}

interface TeamDeletedData {
  teamId: string;
  timestamp: string;
}

interface MemberAddedData {
  teamId: string;
  member: any;
  timestamp: string;
}

interface MemberRemovedData {
  teamId: string;
  memberId: string;
  timestamp: string;
}

interface MemberRoleUpdatedData {
  teamId: string;
  memberId: string;
  newRole: string;
  timestamp: string;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  connectSocket: () => void;
  disconnectSocket: () => void;
  joinTeamList: (userId: string) => void;
  leaveTeamList: (userId: string) => void;
  joinTeamDetail: (teamId: string) => void;
  leaveTeamDetail: (teamId: string) => void;
  // Event handlers
  onTeamCreated: (callback: (data: TeamCreatedData) => void) => void;
  onTeamUpdated: (callback: (data: TeamUpdatedData) => void) => void;
  onTeamDeleted: (callback: (data: TeamDeletedData) => void) => void;
  onMemberAdded: (callback: (data: MemberAddedData) => void) => void;
  onMemberRemoved: (callback: (data: MemberRemovedData) => void) => void;
  onMemberRoleUpdated: (callback: (data: MemberRoleUpdatedData) => void) => void;
  // Event handler removers
  offTeamCreated: (callback: (data: TeamCreatedData) => void) => void;
  offTeamUpdated: (callback: (data: TeamUpdatedData) => void) => void;
  offTeamDeleted: (callback: (data: TeamDeletedData) => void) => void;
  offMemberAdded: (callback: (data: MemberAddedData) => void) => void;
  offMemberRemoved: (callback: (data: MemberRemovedData) => void) => void;
  offMemberRoleUpdated: (callback: (data: MemberRoleUpdatedData) => void) => void;
}

// Connection configuration
const SOCKET_CONFIG = {
  path: '/api/socketio',
  transports: ['websocket', 'polling'] as const,
  timeout: 5000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  maxReconnectionAttempts: 5,
};

/**
 * React hook for managing Socket.IO connection and real-time events
 * @returns UseSocketReturn - Socket connection state and methods
 */
export function useSocket(): UseSocketReturn {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate exponential backoff delay
  const getReconnectDelay = useCallback((attempt: number): number => {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    return delay + Math.random() * 1000; // Add jitter
  }, []);

  // Connect to Socket.IO server
  const connectSocket = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('Socket already connected');
      return;
    }

    try {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
                       (typeof window !== 'undefined' ? `${window.location.origin}` : 'http://localhost:3000');
      
      socketRef.current = io(socketUrl, SOCKET_CONFIG);
      const socket = socketRef.current;

      // Connection event handlers
      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Auto-join rooms based on user session
        if (session?.user?.id) {
          socket.emit('join-team-list', session.user.id);
          console.log('Auto-joined team list for user:', session.user.id);
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        
        // Handle reconnection for client-side disconnects
        if (reason === 'io client disconnect') {
          // Client initiated disconnect - don't reconnect
          console.log('Client initiated disconnect');
        } else {
          // Server or network issue - attempt reconnection
          attemptReconnect();
        }
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
        attemptReconnect();
      });

      // Handle connection confirmation
      socket.on('connected', (data) => {
        console.log('Connection confirmed:', data);
      });

    } catch (error) {
      console.error('Error creating socket connection:', error);
      attemptReconnect();
    }
  }, [session, getReconnectDelay]);

  // Attempt reconnection with exponential backoff
  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current >= SOCKET_CONFIG.maxReconnectionAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    reconnectAttempts.current++;
    const delay = getReconnectDelay(reconnectAttempts.current);
    
    console.log(`Attempting reconnection ${reconnectAttempts.current}/${SOCKET_CONFIG.maxReconnectionAttempts} in ${delay}ms`);
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('Reconnecting...');
      connectSocket();
    }, delay);
  }, [connectSocket, getReconnectDelay]);

  // Disconnect from Socket.IO server
  const disconnectSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      reconnectAttempts.current = 0;
      console.log('Socket disconnected manually');
    }
  }, []);

  // Join team list room
  const joinTeamList = useCallback((userId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-team-list', userId);
      console.log('Joined team list room for user:', userId);
    }
  }, []);

  // Leave team list room
  const leaveTeamList = useCallback((userId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-team-list', userId);
      console.log('Left team list room for user:', userId);
    }
  }, []);

  // Join team detail room
  const joinTeamDetail = useCallback((teamId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-team-detail', teamId);
      console.log('Joined team detail room for team:', teamId);
    }
  }, []);

  // Leave team detail room
  const leaveTeamDetail = useCallback((teamId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-team-detail', teamId);
      console.log('Left team detail room for team:', teamId);
    }
  }, []);

  // Event handlers for team events
  const onTeamCreated = useCallback((callback: (data: TeamCreatedData) => void) => {
    if (socketRef.current) {
      socketRef.current.on('team:created', callback);
    }
  }, []);

  const onTeamUpdated = useCallback((callback: (data: TeamUpdatedData) => void) => {
    if (socketRef.current) {
      socketRef.current.on('team:updated', callback);
    }
  }, []);

  const onTeamDeleted = useCallback((callback: (data: TeamDeletedData) => void) => {
    if (socketRef.current) {
      socketRef.current.on('team:deleted', callback);
    }
  }, []);

  const onMemberAdded = useCallback((callback: (data: MemberAddedData) => void) => {
    if (socketRef.current) {
      socketRef.current.on('member:added', callback);
    }
  }, []);

  const onMemberRemoved = useCallback((callback: (data: MemberRemovedData) => void) => {
    if (socketRef.current) {
      socketRef.current.on('member:removed', callback);
    }
  }, []);

  const onMemberRoleUpdated = useCallback((callback: (data: MemberRoleUpdatedData) => void) => {
    if (socketRef.current) {
      socketRef.current.on('member:roleUpdated', callback);
    }
  }, []);

  // Event handler removers
  const offTeamCreated = useCallback((callback: (data: TeamCreatedData) => void) => {
    if (socketRef.current) {
      socketRef.current.off('team:created', callback);
    }
  }, []);

  const offTeamUpdated = useCallback((callback: (data: TeamUpdatedData) => void) => {
    if (socketRef.current) {
      socketRef.current.off('team:updated', callback);
    }
  }, []);

  const offTeamDeleted = useCallback((callback: (data: TeamDeletedData) => void) => {
    if (socketRef.current) {
      socketRef.current.off('team:deleted', callback);
    }
  }, []);

  const offMemberAdded = useCallback((callback: (data: MemberAddedData) => void) => {
    if (socketRef.current) {
      socketRef.current.off('member:added', callback);
    }
  }, []);

  const offMemberRemoved = useCallback((callback: (data: MemberRemovedData) => void) => {
    if (socketRef.current) {
      socketRef.current.off('member:removed', callback);
    }
  }, []);

  const offMemberRoleUpdated = useCallback((callback: (data: MemberRoleUpdatedData) => void) => {
    if (socketRef.current) {
      socketRef.current.off('member:roleUpdated', callback);
    }
  }, []);

  // Auto-connect when session is available
  useEffect(() => {
    if (session?.user?.id && !socketRef.current) {
      connectSocket();
    }
  }, [session, connectSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, [disconnectSocket]);

  return {
    socket: socketRef.current,
    isConnected,
    connectSocket,
    disconnectSocket,
    joinTeamList,
    leaveTeamList,
    joinTeamDetail,
    leaveTeamDetail,
    onTeamCreated,
    onTeamUpdated,
    onTeamDeleted,
    onMemberAdded,
    onMemberRemoved,
    onMemberRoleUpdated,
    offTeamCreated,
    offTeamUpdated,
    offTeamDeleted,
    offMemberAdded,
    offMemberRemoved,
    offMemberRoleUpdated,
  };
}

/**
 * Hook for real-time time updates
 * @returns { currentTime: Date } - Current time that updates every minute
 */
export function useRealTimeTimeUpdates() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return { currentTime };
}

/**
 * Hook for real-time preferences updates
 * @returns { preferences: any[] } - Array of preferences (mock implementation)
 */
export function useRealTimePreferences() {
  const [preferences, setPreferences] = useState<any[]>([]);

  // This is a mock implementation - in a real app, this would listen to socket events
  // for preference updates from other users or systems
  useEffect(() => {
    // For now, return empty array as real-time preferences are not implemented
    // This can be enhanced later to listen to socket events for preference changes
    setPreferences([]);
  }, []);

  return { preferences };
}