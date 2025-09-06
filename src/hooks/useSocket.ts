"use client";

import { useEffect, useState } from "react";
import { useSocketStore } from "@/stores";

export const useSocket = () => {
  const {
    socket,
    isConnected,
    connectionError,
    connect,
    disconnect,
    realTimeCities,
    realTimePreferences,
    updateRealTimeCities,
    updateRealTimePreferences,
  } = useSocketStore();

  useEffect(() => {
    // Connect to socket when component mounts
    if (!socket && !isConnected) {
      connect();
    }

    // Join rooms for real-time updates
    if (isConnected && socket) {
      socket.emit('join-cities-updates');
      socket.emit('join-preferences-updates');
      socket.emit('join-time-updates');
      
      // Request initial time update
      socket.emit('request-time-update');
    }

    // Cleanup on unmount
    return () => {
      if (socket) {
        disconnect();
      }
    };
  }, [socket, isConnected, connect, disconnect]);

  return {
    socket,
    isConnected,
    connectionError,
    realTimeCities,
    realTimePreferences,
    connect,
    disconnect,
  };
};

export const useRealTimeCities = () => {
  const { realTimeCities, isConnected } = useSocketStore();
  
  return {
    cities: realTimeCities,
    isConnected,
    isLoading: !isConnected,
  };
};

export const useRealTimePreferences = () => {
  const { realTimePreferences, isConnected } = useSocketStore();
  
  return {
    preferences: realTimePreferences,
    isConnected,
    isLoading: !isConnected,
  };
};

export const useRealTimeTimeUpdates = () => {
  const { socket, isConnected } = useSocketStore();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    if (isConnected && socket) {
      const handleTimeUpdate = (data: { cities: any[]; timestamp: string }) => {
        setCurrentTime(new Date(data.timestamp));
      };

      socket.on('time-update', handleTimeUpdate);

      return () => {
        socket.off('time-update', handleTimeUpdate);
      };
    }
  }, [socket, isConnected]);

  return {
    currentTime,
    isConnected,
  };
};