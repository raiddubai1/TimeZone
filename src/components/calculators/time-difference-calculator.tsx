"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight, Calendar, MapPin } from "lucide-react";
import { useCitiesQuery } from "@/queries";
import { useSocket, useRealTimeTimeUpdates } from "@/hooks/useSocket";
import { convertTimeBetweenTimezones, formatTimeDifference, getCurrentTimeInTimezone } from "@/utils/timezone";
import { City } from "@/services/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const timeDifferenceSchema = z.object({
  sourceCityId: z.string().min(1, "Please select a source city"),
  targetCityId: z.string().min(1, "Please select a target city"),
  sourceDate: z.string().min(1, "Please select a date"),
  sourceTime: z.string().min(1, "Please select a time"),
});

type TimeDifferenceFormData = z.infer<typeof timeDifferenceSchema>;

interface TimeDifferenceResult {
  sourceTime: Date;
  targetTime: Date;
  sourceOffset: string;
  targetOffset: string;
  timeDifference: number;
  formattedDifference: string;
}

export default function TimeDifferenceCalculator() {
  const { data: cities, isLoading: citiesLoading } = useCitiesQuery();
  const { isConnected: socketConnected } = useSocket();
  const { currentTime } = useRealTimeTimeUpdates();
  const [result, setResult] = useState<TimeDifferenceResult | null>(null);
  const [sourceCity, setSourceCity] = useState<City | null>(null);
  const [targetCity, setTargetCity] = useState<City | null>(null);
  const [isUsingCurrentTime, setIsUsingCurrentTime] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<TimeDifferenceFormData>({
    resolver: zodResolver(timeDifferenceSchema),
  });

  const watchedSourceCityId = watch("sourceCityId");
  const watchedTargetCityId = watch("targetCityId");
  const watchedSourceDate = watch("sourceDate");
  const watchedSourceTime = watch("sourceTime");

  useEffect(() => {
    if (cities && watchedSourceCityId) {
      const city = cities.find(c => c.id.toString() === watchedSourceCityId);
      setSourceCity(city || null);
    }
  }, [watchedSourceCityId, cities]);

  useEffect(() => {
    if (cities && watchedTargetCityId) {
      const city = cities.find(c => c.id.toString() === watchedTargetCityId);
      setTargetCity(city || null);
    }
  }, [watchedTargetCityId, cities]);

  // Auto-update calculation when using current time and real-time updates occur
  useEffect(() => {
    if (isUsingCurrentTime && sourceCity && targetCity && result && watchedSourceDate && watchedSourceTime) {
      // Check if the input time is approximately "now" (within 1 minute)
      const [hours, minutes] = watchedSourceTime.split(':');
      const inputDate = new Date(watchedSourceDate);
      inputDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const now = new Date();
      const timeDiff = Math.abs(inputDate.getTime() - now.getTime());
      
      if (timeDiff < 60000) { // Within 1 minute
        onSubmit({
          sourceCityId: watchedSourceCityId,
          targetCityId: watchedTargetCityId,
          sourceDate: watchedSourceDate,
          sourceTime: watchedSourceTime,
        });
      }
    }
  }, [currentTime]); // Trigger when real-time time updates

  const onSubmit = async (data: TimeDifferenceFormData) => {
    if (!sourceCity || !targetCity) return;

    try {
      // Combine date and time
      const [hours, minutes] = data.sourceTime.split(':');
      const sourceDateTime = new Date(data.sourceDate);
      sourceDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // If using current time, get the actual current time in source timezone
      let sourceTime = sourceDateTime;
      if (isUsingCurrentTime) {
        sourceTime = getCurrentTimeInTimezone(sourceCity.timezone);
      }

      // Convert time between timezones
      const conversion = convertTimeBetweenTimezones(
        sourceTime,
        sourceCity.timezone,
        targetCity.timezone
      );

      const result: TimeDifferenceResult = {
        sourceTime: conversion.sourceTime,
        targetTime: conversion.targetTime,
        sourceOffset: conversion.sourceOffset,
        targetOffset: conversion.targetOffset,
        timeDifference: conversion.timeDifference,
        formattedDifference: formatTimeDifference(conversion.timeDifference),
      };

      setResult(result);
    } catch (error) {
      console.error("Error calculating time difference:", error);
    }
  };

  const handleDateTimeChange = () => {
    if (watchedSourceDate && watchedSourceTime) {
      // Check if the user is selecting current time (within 1 minute)
      const [hours, minutes] = watchedSourceTime.split(':');
      const inputDate = new Date(watchedSourceDate);
      inputDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const now = new Date();
      const timeDiff = Math.abs(inputDate.getTime() - now.getTime());
      setIsUsingCurrentTime(timeDiff < 60000);
    }
  };

  const swapCities = () => {
    const sourceId = watch("sourceCityId");
    const targetId = watch("targetCityId");
    
    setValue("sourceCityId", targetId);
    setValue("targetCityId", sourceId);
    setResult(null);
  };

  const resetForm = () => {
    reset();
    setResult(null);
    setSourceCity(null);
    setTargetCity(null);
  };

  if (citiesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading cities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Time Difference Calculator
          </CardTitle>
          <CardDescription>
            Calculate the time difference between two cities or time zones
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Source City */}
            <div className="space-y-2">
              <Label htmlFor="sourceCity">From City</Label>
              <Select onValueChange={(value) => setValue("sourceCityId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source city" />
                </SelectTrigger>
                <SelectContent>
                  {cities?.map((city) => (
                    <SelectItem key={city.id} value={city.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{city.country}</span>
                        <span>{city.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sourceCityId && (
                <p className="text-sm text-red-600">{errors.sourceCityId.message}</p>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={swapCities}
                disabled={!watch("sourceCityId") || !watch("targetCityId")}
                className="flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4 rotate-90" />
                Swap
              </Button>
            </div>

            {/* Target City */}
            <div className="space-y-2">
              <Label htmlFor="targetCity">To City</Label>
              <Select onValueChange={(value) => setValue("targetCityId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target city" />
                </SelectTrigger>
                <SelectContent>
                  {cities?.map((city) => (
                    <SelectItem key={city.id} value={city.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{city.country}</span>
                        <span>{city.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.targetCityId && (
                <p className="text-sm text-red-600">{errors.targetCityId.message}</p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sourceDate">Date</Label>
                <Input
                  type="date"
                  {...register("sourceDate")}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={() => handleDateTimeChange()}
                />
                {errors.sourceDate && (
                  <p className="text-sm text-red-600">{errors.sourceDate.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sourceTime" className="flex items-center gap-2">
                  Time
                  {isUsingCurrentTime && socketConnected && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Live
                    </span>
                  )}
                </Label>
                <Input
                  type="time"
                  {...register("sourceTime")}
                  onChange={() => handleDateTimeChange()}
                />
                {errors.sourceTime && (
                  <p className="text-sm text-red-600">{errors.sourceTime.message}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmitting || !watch("sourceCityId") || !watch("targetCityId")}
                className="flex-1"
              >
                {isSubmitting ? "Calculating..." : "Calculate Difference"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
              >
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Clock className="w-5 h-5" />
              Time Difference Result
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Source Time */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{sourceCity?.name}, {sourceCity?.country}</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {result.sourceTime.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </div>
                <div className="text-sm text-blue-700">
                  {result.sourceTime.toLocaleDateString([], { 
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  {result.sourceOffset}
                </Badge>
              </div>

              {/* Target Time */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="font-medium">{targetCity?.name}, {targetCity?.country}</span>
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {result.targetTime.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </div>
                <div className="text-sm text-green-700">
                  {result.targetTime.toLocaleDateString([], { 
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <Badge variant="outline" className="text-green-700 border-green-300">
                  {result.targetOffset}
                </Badge>
              </div>
            </div>

            {/* Time Difference */}
            <div className="mt-4 p-4 bg-white rounded-lg border">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Time Difference</div>
                <div className="text-lg font-semibold text-gray-900">
                  {result.formattedDifference}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}