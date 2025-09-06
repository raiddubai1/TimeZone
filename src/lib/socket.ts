import { Server } from 'socket.io';
import { db } from '@/lib/db';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle joining rooms for real-time updates
    socket.on('join-cities-updates', () => {
      socket.join('cities-updates');
      console.log('Client joined cities updates room:', socket.id);
    });

    socket.on('join-preferences-updates', () => {
      socket.join('preferences-updates');
      console.log('Client joined preferences updates room:', socket.id);
    });

    socket.on('join-time-updates', () => {
      socket.join('time-updates');
      console.log('Client joined time updates room:', socket.id);
    });

    // Handle city updates
    socket.on('city-updated', async (data: { cityId: number; updates: any }) => {
      try {
        const updatedCity = await db.city.update({
          where: { id: data.cityId },
          data: data.updates,
        });

        // Broadcast to all clients in cities updates room
        io.to('cities-updates').emit('cities-update', {
          cities: [updatedCity],
          timestamp: new Date().toISOString(),
        });

        console.log('City update broadcasted:', updatedCity.name);
      } catch (error) {
        console.error('Error updating city:', error);
        socket.emit('error', { message: 'Failed to update city' });
      }
    });

    // Handle preference updates
    socket.on('preference-updated', async (data: { preferenceId: number; updates: any }) => {
      try {
        const updatedPreference = await db.timeZonePreference.update({
          where: { id: data.preferenceId },
          data: data.updates,
          include: {
            city: true,
            user: true,
          },
        });

        // Broadcast to all clients in preferences updates room
        io.to('preferences-updates').emit('preferences-update', {
          preferences: [updatedPreference],
          timestamp: new Date().toISOString(),
        });

        console.log('Preference update broadcasted for user:', updatedPreference.userId);
      } catch (error) {
        console.error('Error updating preference:', error);
        socket.emit('error', { message: 'Failed to update preference' });
      }
    });

    // Handle preference creation
    socket.on('preference-created', async (data: { userId: number; cityId: number }) => {
      try {
        const newPreference = await db.timeZonePreference.create({
          data: {
            userId: data.userId,
            cityId: data.cityId,
          },
          include: {
            city: true,
            user: true,
          },
        });

        // Broadcast to all clients in preferences updates room
        io.to('preferences-updates').emit('preferences-update', {
          preferences: [newPreference],
          timestamp: new Date().toISOString(),
        });

        console.log('Preference creation broadcasted for user:', newPreference.userId);
      } catch (error) {
        console.error('Error creating preference:', error);
        socket.emit('error', { message: 'Failed to create preference' });
      }
    });

    // Handle preference deletion
    socket.on('preference-deleted', async (data: { preferenceId: number }) => {
      try {
        const deletedPreference = await db.timeZonePreference.delete({
          where: { id: data.preferenceId },
        });

        // Broadcast to all clients in preferences updates room
        io.to('preferences-updates').emit('preferences-update', {
          preferences: [],
          deletedPreferenceId: data.preferenceId,
          timestamp: new Date().toISOString(),
        });

        console.log('Preference deletion broadcasted:', data.preferenceId);
      } catch (error) {
        console.error('Error deleting preference:', error);
        socket.emit('error', { message: 'Failed to delete preference' });
      }
    });

    // Handle time updates (broadcast current time for all cities)
    socket.on('request-time-update', async () => {
      try {
        const cities = await db.city.findMany({
          orderBy: [
            { country: 'asc' },
            { name: 'asc' }
          ]
        });

        const currentTime = new Date();
        
        // Broadcast to all clients in time updates room
        io.to('time-updates').emit('time-update', {
          cities: cities.map(city => ({
            id: city.id,
            name: city.name,
            country: city.country,
            timezone: city.timezone,
            offset: city.offset,
            currentTime: currentTime.toISOString(),
          })),
          timestamp: currentTime.toISOString(),
        });

        console.log('Time update broadcasted to clients');
      } catch (error) {
        console.error('Error broadcasting time update:', error);
        socket.emit('error', { message: 'Failed to get time update' });
      }
    });

    // Set up periodic time updates (every minute)
    const timeUpdateInterval = setInterval(async () => {
      try {
        const cities = await db.city.findMany({
          orderBy: [
            { country: 'asc' },
            { name: 'asc' }
          ]
        });

        const currentTime = new Date();
        
        // Broadcast to all clients in time updates room
        io.to('time-updates').emit('time-update', {
          cities: cities.map(city => ({
            id: city.id,
            name: city.name,
            country: city.country,
            timezone: city.timezone,
            offset: city.offset,
            currentTime: currentTime.toISOString(),
          })),
          timestamp: currentTime.toISOString(),
        });
      } catch (error) {
        console.error('Error in periodic time update:', error);
      }
    }, 60000); // Update every minute

    // Handle messages (legacy support)
    socket.on('message', (msg: { text: string; senderId: string }) => {
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      clearInterval(timeUpdateInterval);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to TimeZone Real-time Server!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });

    // Initial data push
    socket.emit('connected', {
      message: 'Real-time connection established',
      timestamp: new Date().toISOString(),
    });
  });
};