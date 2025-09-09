// API service functions for TimeZone application

export interface City {
  id: number;
  name: string;
  country: string;
  timezone: string;
  offset: number;
}

export interface User {
  id: number;
  email: string;
  name?: string;
}

export interface TimeZonePreference {
  id: number;
  userId: number;
  cityId: number;
  user: User;
  city: City;
}

export interface Meeting {
  id: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  cities: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMeetingData {
  date: Date;
  startTime: Date;
  endTime: Date;
  cities: string[];
}

// Cities API
export const citiesApi = {
  getAll: async (): Promise<City[]> => {
    const response = await fetch('/api/cities');
    if (!response.ok) {
      throw new Error('Failed to fetch cities');
    }
    return response.json();
  },

  getById: async (id: number): Promise<City> => {
    const response = await fetch(`/api/cities/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch city');
    }
    return response.json();
  },

  create: async (city: Omit<City, 'id'>): Promise<City> => {
    const response = await fetch('/api/cities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(city),
    });
    if (!response.ok) {
      throw new Error('Failed to create city');
    }
    return response.json();
  },

  update: async (id: number, city: Partial<Omit<City, 'id'>>): Promise<City> => {
    const response = await fetch(`/api/cities/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(city),
    });
    if (!response.ok) {
      throw new Error('Failed to update city');
    }
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`/api/cities/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete city');
    }
  },
};

// Preferences API
export const preferencesApi = {
  getAll: async (): Promise<TimeZonePreference[]> => {
    const response = await fetch('/api/preferences');
    if (!response.ok) {
      throw new Error('Failed to fetch preferences');
    }
    return response.json();
  },

  getById: async (id: number): Promise<TimeZonePreference> => {
    const response = await fetch(`/api/preferences/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch preference');
    }
    return response.json();
  },

  create: async (preference: Omit<TimeZonePreference, 'id' | 'user' | 'city'>): Promise<TimeZonePreference> => {
    const response = await fetch('/api/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });
    if (!response.ok) {
      throw new Error('Failed to create preference');
    }
    return response.json();
  },

  update: async (id: number, preference: Partial<Omit<TimeZonePreference, 'id' | 'user' | 'city'>>): Promise<TimeZonePreference> => {
    const response = await fetch(`/api/preferences/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });
    if (!response.ok) {
      throw new Error('Failed to update preference');
    }
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`/api/preferences/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete preference');
    }
  },
};

// Health check
export const healthApi = {
  check: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await fetch('/api/health');
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  },
};

// Meetings API
export const meetingsApi = {
  getAll: async (): Promise<Meeting[]> => {
    const response = await fetch('/api/meetings');
    if (!response.ok) {
      throw new Error('Failed to fetch meetings');
    }
    const data = await response.json();
    return data.meetings;
  },

  create: async (meeting: CreateMeetingData): Promise<Meeting> => {
    const response = await fetch('/api/meetings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...meeting,
        date: meeting.date.toISOString(),
        startTime: meeting.startTime.toISOString(),
        endTime: meeting.endTime.toISOString(),
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create meeting');
    }
    const data = await response.json();
    return data.meeting;
  },

  update: async (id: string, meeting: CreateMeetingData): Promise<Meeting> => {
    const response = await fetch(`/api/meetings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...meeting,
        date: meeting.date.toISOString(),
        startTime: meeting.startTime.toISOString(),
        endTime: meeting.endTime.toISOString(),
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update meeting');
    }
    const data = await response.json();
    return data.meeting;
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`/api/meetings/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete meeting');
    }
  },
};