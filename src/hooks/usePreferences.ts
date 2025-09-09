"use client";

import { useState, useEffect } from 'react';
import { TimeZonePreference } from '@/services/api';
import { preferencesApi } from '@/services/api';

export const usePreferences = () => {
  const [preferences, setPreferences] = useState<TimeZonePreference[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await preferencesApi.getAll();
      setPreferences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences');
    } finally {
      setLoading(false);
    }
  };

  const addPreference = async (preference: Omit<TimeZonePreference, 'id' | 'user' | 'city'>) => {
    try {
      const newPreference = await preferencesApi.create(preference);
      setPreferences(prev => [...prev, newPreference]);
      return newPreference;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add preference');
      throw err;
    }
  };

  const updatePreference = async (id: number, preference: Partial<Omit<TimeZonePreference, 'id' | 'user' | 'city'>>) => {
    try {
      const updatedPreference = await preferencesApi.update(id, preference);
      setPreferences(prev => prev.map(p => p.id === id ? updatedPreference : p));
      return updatedPreference;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preference');
      throw err;
    }
  };

  const deletePreference = async (id: number) => {
    try {
      await preferencesApi.delete(id);
      setPreferences(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete preference');
      throw err;
    }
  };

  const getPreferencesByUserId = (userId: number) => {
    return preferences.filter(p => p.userId === userId);
  };

  const getPreferencesByCityId = (cityId: number) => {
    return preferences.filter(p => p.cityId === cityId);
  };

  const refreshPreferences = () => {
    fetchPreferences();
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  return {
    preferences,
    loading,
    error,
    addPreference,
    updatePreference,
    deletePreference,
    getPreferencesByUserId,
    getPreferencesByCityId,
    refreshPreferences,
  };
};