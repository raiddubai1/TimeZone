"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Briefcase, AlertTriangle, Check } from "lucide-react";
import { useCitiesQuery } from "@/queries";
import { convertTimeBetweenTimezones, formatTimeDifference } from "@/utils/timezone";
import { City } from "@/services/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const workingHoursSchema = z.object({
  city1Id: z.string().min(1, "Please select first city"),
  city2Id: z.string().min(1, "Please select second city"),
  workingHoursStart: z.string().min(1, "Please select start time"),
  workingHoursEnd: z.string().min(1, "Please select end time"),
});

type WorkingHoursFormData = z.infer<typeof workingHoursSchema>;

interface WorkingHoursResult {
  city1: City;
  city2: City;
  city1WorkingHours: { start: string; end: string };
  city2WorkingHours: { start: string; end: string };
  overlappingHours: { start: string; end: string; duration: number };
  hasOverlap: boolean;
  recommendations: string[];
}

export default function WorkingHoursCalculator() {
  const { data: cities, isLoading: citiesLoading } = useCitiesQuery();
  const [result, setResult] = useState<WorkingHoursResult | null>(null);
  const [city1, setCity1] = useState<City | null>(null);
  const [city2, setCity2] = useState<City | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<WorkingHoursFormData>({
    resolver: zodResolver(workingHoursSchema),
    defaultValues: {
      workingHoursStart: "09:00",
      workingHoursEnd: "17:00",
    },
  });

  const watchedCity1Id = watch("city1Id");
  const watchedCity2Id = watch("city2Id");

  useEffect(() => {
    if (cities && watchedCity1Id) {
      const city = cities.find(c => c.id.toString() === watchedCity1Id);
      setCity1(city || null);
    }
  }, [watchedCity1Id, cities]);

  useEffect(() => {
    if (cities && watchedCity2Id) {
      const city = cities.find(c => c.id.toString() === watchedCity2Id);
      setCity2(city || null);
    }
  }, [watchedCity2Id, cities]);

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const calculateWorkingHoursOverlap = (
    city1: City,
    city2: City,
    workingStart: string,
    workingEnd: string
  ) => {
    // Convert working hours to both timezones
    const baseDate = new Date();
    const [startHours, startMinutes] = workingStart.split(':').map(Number);
    const [endHours, endMinutes] = workingEnd.split(':').map(Number);

    // Create base times in UTC
    const startUTC = new Date(baseDate);
    startUTC.setUTCHours(startHours, startMinutes, 0, 0);

    const endUTC = new Date(baseDate);
    endUTC.setUTCHours(endHours, endMinutes, 0, 0);

    // Convert to city timezones
    const city1Start = convertTimeBetweenTimezones(startUTC, "UTC", city1.timezone);
    const city1End = convertTimeBetweenTimezones(endUTC, "UTC", city1.timezone);
    const city2Start = convertTimeBetweenTimezones(startUTC, "UTC", city2.timezone);
    const city2End = convertTimeBetweenTimezones(endUTC, "UTC", city2.timezone);

    // Convert to minutes for easier calculation
    const city1StartMinutes = timeToMinutes(city1Start.targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    const city1EndMinutes = timeToMinutes(city1End.targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    const city2StartMinutes = timeToMinutes(city2Start.targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    const city2EndMinutes = timeToMinutes(city2End.targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));

    // Calculate overlap
    const overlapStart = Math.max(city1StartMinutes, city2StartMinutes);
    const overlapEnd = Math.min(city1EndMinutes, city2EndMinutes);
    const hasOverlap = overlapStart < overlapEnd;
    const overlapDuration = hasOverlap ? overlapEnd - overlapStart : 0;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (!hasOverlap) {
      recommendations.push("No overlapping working hours between these time zones.");
      
      if (city1EndMinutes <= city2StartMinutes) {
        const gap = city2StartMinutes - city1EndMinutes;
        recommendations.push(`City 1 ends ${minutesToTime(gap)} before City 2 starts.`);
      } else {
        const gap = city1StartMinutes - city2EndMinutes;
        recommendations.push(`City 2 ends ${minutesToTime(gap)} before City 1 starts.`);
      }
      
      recommendations.push("Consider flexible working hours or asynchronous communication.");
    } else {
      recommendations.push(`Found ${Math.floor(overlapDuration / 60)}h ${overlapDuration % 60}m of overlapping working hours.`);
      
      if (overlapDuration < 120) {
        recommendations.push("Limited overlap time. Consider scheduling important meetings during this window.");
      } else {
        recommendations.push("Good overlap for collaboration and meetings.");
      }
    }

    return {
      city1WorkingHours: {
        start: city1Start.targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        end: city1End.targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      },
      city2WorkingHours: {
        start: city2Start.targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        end: city2End.targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      },
      overlappingHours: hasOverlap ? {
        start: minutesToTime(overlapStart),
        end: minutesToTime(overlapEnd),
        duration: overlapDuration,
      } : { start: "", end: "", duration: 0 },
      hasOverlap,
      recommendations,
    };
  };

  const onSubmit = async (data: WorkingHoursFormData) => {
    if (!city1 || !city2) return;

    try {
      const workingHoursData = calculateWorkingHoursOverlap(
        city1,
        city2,
        data.workingHoursStart,
        data.workingHoursEnd
      );

      const result: WorkingHoursResult = {
        city1,
        city2,
        ...workingHoursData,
      };

      setResult(result);
    } catch (error) {
      console.error("Error calculating working hours:", error);
    }
  };

  const swapCities = () => {
    const city1Id = watch("city1Id");
    const city2Id = watch("city2Id");
    
    setValue("city1Id", city2Id);
    setValue("city2Id", city1Id);
    setResult(null);
  };

  const resetForm = () => {
    reset();
    setResult(null);
    setCity1(null);
    setCity2(null);
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
            <Briefcase className="w-5 h-5" />
            Working Hours Calculator
          </CardTitle>
          <CardDescription>
            Determine overlapping working hours across different time zones
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* City 1 */}
            <div className="space-y-2">
              <Label htmlFor="city1">First City</Label>
              <Select onValueChange={(value) => setValue("city1Id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select first city" />
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
              {errors.city1Id && (
                <p className="text-sm text-red-600">{errors.city1Id.message}</p>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={swapCities}
                disabled={!watch("city1Id") || !watch("city2Id")}
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Swap Cities
              </Button>
            </div>

            {/* City 2 */}
            <div className="space-y-2">
              <Label htmlFor="city2">Second City</Label>
              <Select onValueChange={(value) => setValue("city2Id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select second city" />
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
              {errors.city2Id && (
                <p className="text-sm text-red-600">{errors.city2Id.message}</p>
              )}
            </div>

            {/* Working Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workingHoursStart">Working Hours Start</Label>
                <Input
                  type="time"
                  {...register("workingHoursStart")}
                />
                {errors.workingHoursStart && (
                  <p className="text-sm text-red-600">{errors.workingHoursStart.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="workingHoursEnd">Working Hours End</Label>
                <Input
                  type="time"
                  {...register("workingHoursEnd")}
                />
                {errors.workingHoursEnd && (
                  <p className="text-sm text-red-600">{errors.workingHoursEnd.message}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmitting || !watch("city1Id") || !watch("city2Id")}
                className="flex-1"
              >
                {isSubmitting ? "Calculating..." : "Calculate Overlap"}
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
        <Card className={result.hasOverlap ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.hasOverlap ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              Working Hours Analysis
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* City 1 Working Hours */}
              <div className="space-y-2">
                <div className="font-medium">{result.city1.name}, {result.city1.country}</div>
                <div className="text-lg font-semibold">
                  {result.city1WorkingHours.start} - {result.city1WorkingHours.end}
                </div>
                <Badge variant="outline">
                  Local Time
                </Badge>
              </div>

              {/* City 2 Working Hours */}
              <div className="space-y-2">
                <div className="font-medium">{result.city2.name}, {result.city2.country}</div>
                <div className="text-lg font-semibold">
                  {result.city2WorkingHours.start} - {result.city2WorkingHours.end}
                </div>
                <Badge variant="outline">
                  Local Time
                </Badge>
              </div>
            </div>

            {/* Overlapping Hours */}
            {result.hasOverlap ? (
              <div className="mt-4 p-4 bg-white rounded-lg border border-green-300">
                <div className="text-center">
                  <div className="text-sm text-green-700 mb-1">Overlapping Hours</div>
                  <div className="text-lg font-semibold text-green-900">
                    {result.overlappingHours.start} - {result.overlappingHours.end}
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    Duration: {Math.floor(result.overlappingHours.duration / 60)}h {result.overlappingHours.duration % 60}m
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-white rounded-lg border border-red-300">
                <div className="text-center">
                  <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <div className="text-sm text-red-700 mb-1">No Overlapping Hours</div>
                  <div className="text-sm text-red-600">
                    Working hours do not overlap between these time zones
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="mt-4 p-4 bg-white rounded-lg border">
              <div className="text-sm font-medium mb-2">Recommendations:</div>
              <ul className="text-sm text-gray-700 space-y-1">
                {result.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}