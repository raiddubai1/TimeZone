"use client";

import { useState, useEffect } from 'react';
import { City } from '@/services/api';
import { citiesApi } from '@/services/api';

export const useCities = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await citiesApi.getAll();
      setCities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cities');
    } finally {
      setLoading(false);
    }
  };

  const addCity = async (city: Omit<City, 'id'>) => {
    try {
      const newCity = await citiesApi.create(city);
      setCities(prev => [...prev, newCity]);
      return newCity;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add city');
      throw err;
    }
  };

  const updateCity = async (id: number, city: Partial<Omit<City, 'id'>>) => {
    try {
      const updatedCity = await citiesApi.update(id, city);
      setCities(prev => prev.map(c => c.id === id ? updatedCity : c));
      return updatedCity;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update city');
      throw err;
    }
  };

  const deleteCity = async (id: number) => {
    try {
      await citiesApi.delete(id);
      setCities(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete city');
      throw err;
    }
  };

  const refreshCities = () => {
    fetchCities();
  };

  useEffect(() => {
    fetchCities();
  }, []);

  return {
    cities,
    loading,
    error,
    addCity,
    updateCity,
    deleteCity,
    refreshCities,
  };
};