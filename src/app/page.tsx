"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin } from "lucide-react";
import { useCitiesQuery } from "@/queries";
import { useSocket, useRealTimeCities } from "@/hooks/useSocket";
import { getCitiesCurrentTime } from "@/utils/timezone";

interface CityTime {
  name: string;
  country: string;
  timezone: string;
  offset: number;
  currentTime: Date;
  formattedTime: string;
  formattedDate: string;
  offsetString: string;
}

export default function Home() {
  const { data: cities, isLoading, error } = useCitiesQuery();
  const { isConnected: socketConnected } = useSocket();
  const { cities: realTimeCities } = useRealTimeCities();
  const [cityTimes, setCityTimes] = useState<CityTime[]>([]);
  const [displayCities, setDisplayCities] = useState<CityTime[]>([]);

  useEffect(() => {
    if (cities && cities.length > 0) {
      // Get the first 4 cities for display, or all if less than 4
      const citiesToShow = cities.slice(0, 4);
      const times = getCitiesCurrentTime(citiesToShow);
      setCityTimes(times);
      setDisplayCities(times);
    }
  }, [cities]);

  // Update times every minute (fallback if socket is not connected)
  useEffect(() => {
    if (!socketConnected) {
      const interval = setInterval(() => {
        if (cities && cities.length > 0) {
          const citiesToShow = cities.slice(0, 4);
          const times = getCitiesCurrentTime(citiesToShow);
          setCityTimes(times);
          setDisplayCities(times);
        }
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [cities, socketConnected]);

  // Update times when real-time data is received
  useEffect(() => {
    if (realTimeCities.length > 0 && cities) {
      const updatedTimes = realTimeCities
        .filter(realTimeCity => cities.some(city => city.id === realTimeCity.id))
        .slice(0, 4)
        .map(realTimeCity => {
          const city = cities.find(c => c.id === realTimeCity.id)!;
          const currentTime = new Date(realTimeCity.currentTime);
          
          return {
            name: city.name,
            country: city.country,
            timezone: city.timezone,
            offset: city.offset,
            currentTime,
            formattedTime: currentTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }),
            formattedDate: currentTime.toLocaleDateString([], {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }),
            offsetString: `UTC${city.offset >= 0 ? '+' : ''}${Math.floor(city.offset / 60)}:${(city.offset % 60).toString().padStart(2, '0')}`
          };
        });
      
      if (updatedTimes.length > 0) {
        setDisplayCities(updatedTimes);
      }
    }
  }, [realTimeCities, cities]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading cities: {error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gray-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gray-300 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gray-300 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 w-full">
          <div className="text-center mb-16 mt-20">
            {/* Hero Title */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              <span className="text-gray-900">Master Time</span> <span className="text-gray-600">Across Zon<span className="text-orange-500">o</span>es</span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              Convert time zones, calculate differences, plan meetings, and get AI-powered time insights - all in one place
            </p>
          </div>

          {/* City Time Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {displayCities.map((city, index) => (
              <Card 
                key={`${city.name}-${index}`} 
                className="bg-white border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-gray-400 py-4"
              >
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-800">{city.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {city.formattedTime}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center justify-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{city.formattedDate}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {city.offsetString}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feature Description */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center space-x-2 bg-gray-100 px-6 py-3 rounded-full border border-gray-200">
              <Clock className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">
                Live updates across {cities?.length || 0}+ cities worldwide
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}