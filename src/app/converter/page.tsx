"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, ArrowRight, Calendar, MapPin } from "lucide-react";
import { useCities } from "@/hooks/useCities";
import { useSocket, useRealTimeTimeUpdates } from "@/hooks/useSocket";
import { City } from "@/services/api";
import { convertTimeBetweenTimezones, formatDateTimeInTimezone, formatTimeDifference, getCurrentTimeInTimezone } from "@/utils/timezone";

interface ConversionResult {
  sourceTime: Date;
  targetTime: Date;
  sourceOffset: string;
  targetOffset: string;
  timeDifference: number;
}

export default function ConverterPage() {
  const { cities, loading, error } = useCities();
  const { isConnected } = useSocket();
  const { currentTime } = useRealTimeTimeUpdates();
  const [sourceCity, setSourceCity] = useState<City | null>(null);
  const [targetCity, setTargetCity] = useState<City | null>(null);
  const [inputDateTime, setInputDateTime] = useState<string>("");
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [isUsingCurrentTime, setIsUsingCurrentTime] = useState<boolean>(false);

  useEffect(() => {
    // Set default input datetime to current time
    const now = new Date();
    const localDateTime = now.toISOString().slice(0, 16);
    setInputDateTime(localDateTime);
    setIsUsingCurrentTime(true);
  }, []);

  // Auto-update conversion when using current time and real-time updates occur
  useEffect(() => {
    if (isUsingCurrentTime && sourceCity && targetCity && conversionResult) {
      // Check if the input time is approximately "now" (within 1 minute)
      const inputDate = new Date(inputDateTime);
      const now = new Date();
      const timeDiff = Math.abs(inputDate.getTime() - now.getTime());
      
      if (timeDiff < 60000) { // Within 1 minute
        convertTime();
      }
    }
  }, [currentTime]); // Trigger when real-time time updates

  useEffect(() => {
    // Set default cities when data is loaded
    if (cities.length > 0 && !sourceCity && !targetCity) {
      setSourceCity(cities[0]);
      setTargetCity(cities[4] || cities[1]);
    }
  }, [cities, sourceCity, targetCity]);

  const convertTime = () => {
    if (!inputDateTime || !sourceCity || !targetCity) return;

    setIsConverting(true);
    
    try {
      const inputDate = new Date(inputDateTime);
      
      // If using current time, get the actual current time in source timezone
      let sourceTime = inputDate;
      if (isUsingCurrentTime) {
        sourceTime = getCurrentTimeInTimezone(sourceCity.timezone);
      }
      
      // Use the utility function to convert between timezones
      const result = convertTimeBetweenTimezones(sourceTime, sourceCity.timezone, targetCity.timezone);
      
      // Add a small delay to show loading state for better UX
      setTimeout(() => {
        setConversionResult(result);
        setIsConverting(false);
      }, 300); // Reduced delay for better real-time experience
      
    } catch (error) {
      console.error("Conversion error:", error);
      setIsConverting(false);
    }
  };

  const handleDateTimeChange = (value: string) => {
    setInputDateTime(value);
    
    // Check if the user is selecting current time (within 1 minute)
    const inputDate = new Date(value);
    const now = new Date();
    const timeDiff = Math.abs(inputDate.getTime() - now.getTime());
    setIsUsingCurrentTime(timeDiff < 60000);
  };

  const handleSwap = () => {
    if (sourceCity && targetCity) {
      setSourceCity(targetCity);
      setTargetCity(sourceCity);
      if (conversionResult) {
        convertTime();
      }
    }
  };

  if (loading) {
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
          <p className="text-red-600 mb-4">Error loading cities: {error}</p>
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
    <div className="container mx-auto px-4 pt-24 pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Time Zone Converter
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Convert time between different time zones instantly with accurate daylight saving time adjustments.
          </p>
        </div>

        {/* Converter Card */}
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Convert Time Between Cities
            </CardTitle>
            <CardDescription>
              Select source and target cities, then enter the date and time to convert.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* City Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Source City */}
              <div className="space-y-2">
                <Label htmlFor="source-city" className="text-sm font-medium">
                  From City
                </Label>
                <Select
                  value={sourceCity?.id?.toString() || ""}
                  onValueChange={(value) => {
                    const city = cities.find(c => c.id.toString() === value);
                    if (city) setSourceCity(city);
                  }}
                >
                  <SelectTrigger className="hover:border-gray-900 transition-colors duration-300">
                    <SelectValue placeholder="Select source city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={`source-${city.id}`} value={city.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{city.country}</span>
                          <span>{city.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target City */}
              <div className="space-y-2">
                <Label htmlFor="target-city" className="text-sm font-medium">
                  To City
                </Label>
                <Select
                  value={targetCity?.id?.toString() || ""}
                  onValueChange={(value) => {
                    const city = cities.find(c => c.id.toString() === value);
                    if (city) setTargetCity(city);
                  }}
                >
                  <SelectTrigger className="hover:border-gray-900 transition-colors duration-300">
                    <SelectValue placeholder="Select target city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={`target-${city.id}`} value={city.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{city.country}</span>
                          <span>{city.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwap}
                className="hover:bg-gray-900 hover:text-white transition-colors duration-300"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Swap Cities
              </Button>
            </div>

            {/* Date Time Input */}
            <div className="space-y-2">
              <Label htmlFor="datetime" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date & Time
                {isUsingCurrentTime && isConnected && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Live
                  </span>
                )}
              </Label>
              <Input
                id="datetime"
                type="datetime-local"
                value={inputDateTime}
                onChange={(e) => handleDateTimeChange(e.target.value)}
                className="hover:border-gray-900 transition-colors duration-300"
              />
            </div>

            {/* Convert Button */}
            <Button
              onClick={convertTime}
              disabled={!inputDateTime || !sourceCity || !targetCity || isConverting}
              className={`w-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                isConverting 
                  ? "bg-blue-600 text-white" 
                  : "hover:bg-gray-900 hover:text-white"
              }`}
            >
              {isConverting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Converting...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  Convert Time
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {conversionResult && sourceCity && targetCity && (
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 animate-fade-in-up shadow-lg">
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                Conversion Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Source Time */}
                <div className="text-center p-6 bg-white rounded-lg border border-gray-200 transform transition-all duration-500 hover:scale-105 hover:shadow-lg">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold">{sourceCity.name}</h3>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {formatDateTimeInTimezone(conversionResult.sourceTime, sourceCity.timezone)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {conversionResult.sourceOffset}
                  </div>
                </div>

                {/* Target Time */}
                <div className="text-center p-6 bg-white rounded-lg border border-gray-200 transform transition-all duration-500 hover:scale-105 hover:shadow-lg">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold">{targetCity.name}</h3>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {formatDateTimeInTimezone(conversionResult.targetTime, targetCity.timezone)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {conversionResult.targetOffset}
                  </div>
                </div>
              </div>

              {/* Time Difference */}
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full animate-pulse-once">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Time difference: {formatTimeDifference(conversionResult.timeDifference)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-center mb-8">Converter Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-100 rounded-lg">
              <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Real-time Conversion</h3>
              <p className="text-gray-600 text-sm">Instant timezone conversion with current time support</p>
            </div>
            <div className="text-center p-6 bg-gray-100 rounded-lg">
              <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Daylight Saving</h3>
              <p className="text-gray-600 text-sm">Automatic DST adjustments for accurate conversions</p>
            </div>
            <div className="text-center p-6 bg-gray-100 rounded-lg">
              <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Global Coverage</h3>
              <p className="text-gray-600 text-sm">Support for all {cities.length} cities in our database</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}