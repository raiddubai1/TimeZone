// Time zone utility functions

export interface CityTime {
  name: string;
  country: string;
  timezone: string;
  offset: number;
  currentTime: Date;
  formattedTime: string;
  formattedDate: string;
  offsetString: string;
}

export interface ConversionResult {
  sourceTime: Date;
  targetTime: Date;
  sourceOffset: string;
  targetOffset: string;
  timeDifference: number; // in minutes
}

/**
 * Get current time for a specific timezone
 */
export const getCurrentTimeInTimezone = (timezone: string): Date => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
};

/**
 * Get timezone offset in minutes for a specific timezone
 */
export const getTimezoneOffsetMinutes = (timezone: string): number => {
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const tzTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  const tzUtcTime = tzTime.getTime() + (tzTime.getTimezoneOffset() * 60000);
  return (tzUtcTime - utcTime) / (1000 * 60);
};

/**
 * Format offset minutes to UTC string (e.g., "UTC+5:30", "UTC-8")
 */
export const formatOffset = (offsetMinutes: number): string => {
  const hours = Math.floor(Math.abs(offsetMinutes) / 60);
  const minutes = Math.abs(offsetMinutes) % 60;
  const sign = offsetMinutes >= 0 ? '+' : '-';
  return minutes > 0 ? `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}` : `UTC${sign}${hours}`;
};

/**
 * Format date and time in a specific timezone
 */
export const formatDateTimeInTimezone = (date: Date, timezone: string): string => {
  return date.toLocaleString("en-US", {
    timeZone: timezone,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
};

/**
 * Format time only in a specific timezone
 */
export const formatTimeInTimezone = (date: Date, timezone: string): string => {
  return date.toLocaleString("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
};

/**
 * Format date only in a specific timezone
 */
export const formatDateInTimezone = (date: Date, timezone: string): string => {
  return date.toLocaleString("en-US", {
    timeZone: timezone,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

/**
 * Convert time from source timezone to target timezone
 */
export const convertTimeBetweenTimezones = (
  sourceTime: Date,
  sourceTimezone: string,
  targetTimezone: string
): ConversionResult => {
  const sourceOffset = getTimezoneOffsetMinutes(sourceTimezone);
  const targetOffset = getTimezoneOffsetMinutes(targetTimezone);
  const offsetDifference = targetOffset - sourceOffset;
  
  // Create target time by applying the offset difference
  const targetTime = new Date(sourceTime.getTime() + (offsetDifference * 60 * 1000));
  
  return {
    sourceTime,
    targetTime,
    sourceOffset: formatOffset(sourceOffset),
    targetOffset: formatOffset(targetOffset),
    timeDifference: offsetDifference
  };
};

/**
 * Get current time information for multiple cities
 */
export const getCitiesCurrentTime = (cities: Array<{ name: string; country: string; timezone: string; offset: number }>): CityTime[] => {
  const now = new Date();
  
  return cities.map(city => {
    const currentTime = getCurrentTimeInTimezone(city.timezone);
    const offset = getTimezoneOffsetMinutes(city.timezone);
    
    return {
      name: city.name,
      country: city.country,
      timezone: city.timezone,
      offset,
      currentTime,
      formattedTime: formatTimeInTimezone(currentTime, city.timezone),
      formattedDate: formatDateInTimezone(currentTime, city.timezone),
      offsetString: formatOffset(offset)
    };
  });
};

/**
 * Format time difference in human readable format
 */
export const formatTimeDifference = (differenceMinutes: number): string => {
  const hours = Math.floor(Math.abs(differenceMinutes) / 60);
  const minutes = Math.abs(differenceMinutes) % 60;
  const sign = differenceMinutes >= 0 ? 'ahead' : 'behind';
  
  if (hours === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ${sign}`;
  } else if (minutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${sign}`;
  } else {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''} ${sign}`;
  }
};

/**
 * Check if a timezone is currently in DST
 */
export const isInDaylightSavingTime = (timezone: string): boolean => {
  const now = new Date();
  const jan = new Date(now.getFullYear(), 0, 1);
  const jul = new Date(now.getFullYear(), 6, 1);
  
  const janOffset = getTimezoneOffsetMinutes(timezone);
  const julOffset = getTimezoneOffsetMinutes(timezone);
  
  return janOffset !== julOffset;
};

/**
 * Get popular timezones for quick selection
 */
export const getPopularTimezones = (): Array<{ name: string; timezone: string; country: string }> => {
  return [
    { name: "New York", timezone: "America/New_York", country: "🇺🇸" },
    { name: "Los Angeles", timezone: "America/Los_Angeles", country: "🇺🇸" },
    { name: "Chicago", timezone: "America/Chicago", country: "🇺🇸" },
    { name: "London", timezone: "Europe/London", country: "🇬🇧" },
    { name: "Paris", timezone: "Europe/Paris", country: "🇫🇷" },
    { name: "Berlin", timezone: "Europe/Berlin", country: "🇩🇪" },
    { name: "Dubai", timezone: "Asia/Dubai", country: "🇦🇪" },
    { name: "Tokyo", timezone: "Asia/Tokyo", country: "🇯🇵" },
    { name: "Sydney", timezone: "Australia/Sydney", country: "🇦🇺" },
    { name: "Singapore", timezone: "Asia/Singapore", country: "🇸🇬" },
  ];
};