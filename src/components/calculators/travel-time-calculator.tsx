"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Plane, Calendar, MapPin, ArrowRight } from "lucide-react";
import { useCitiesQuery } from "@/queries";
import { useSocket, useRealTimeTimeUpdates } from "@/hooks/useSocket";
import { convertTimeBetweenTimezones, formatTimeDifference, getCurrentTimeInTimezone } from "@/utils/timezone";
import { City } from "@/services/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const travelTimeSchema = z.object({
  departureCityId: z.string().min(1, "Please select departure city"),
  arrivalCityId: z.string().min(1, "Please select arrival city"),
  departureDate: z.string().min(1, "Please select departure date"),
  departureTime: z.string().min(1, "Please select departure time"),
  flightDuration: z.string().min(1, "Please enter flight duration"),
});

type TravelTimeFormData = z.infer<typeof travelTimeSchema>;

interface TravelTimeResult {
  departureCity: City;
  arrivalCity: City;
  departureTime: Date;
  arrivalTime: Date;
  departureLocal: string;
  arrivalLocal: string;
  flightDuration: number; // in minutes
  timeDifference: number; // in minutes
  formattedTimeDifference: string;
  jetLagImpact: 'minimal' | 'mild' | 'moderate' | 'severe';
  recommendations: string[];
}

export default function TravelTimeCalculator() {
  const { data: cities, isLoading: citiesLoading } = useCitiesQuery();
  const { isConnected: socketConnected } = useSocket();
  const { currentTime } = useRealTimeTimeUpdates();
  const [result, setResult] = useState<TravelTimeResult | null>(null);
  const [departureCity, setDepartureCity] = useState<City | null>(null);
  const [arrivalCity, setArrivalCity] = useState<City | null>(null);
  const [isUsingCurrentTime, setIsUsingCurrentTime] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<TravelTimeFormData>({
    resolver: zodResolver(travelTimeSchema),
  });

  const watchedDepartureCityId = watch("departureCityId");
  const watchedArrivalCityId = watch("arrivalCityId");
  const watchedDepartureDate = watch("departureDate");
  const watchedDepartureTime = watch("departureTime");

  useEffect(() => {
    if (cities && watchedDepartureCityId) {
      const city = cities.find(c => c.id.toString() === watchedDepartureCityId);
      setDepartureCity(city || null);
    }
  }, [watchedDepartureCityId, cities]);

  useEffect(() => {
    if (cities && watchedArrivalCityId) {
      const city = cities.find(c => c.id.toString() === watchedArrivalCityId);
      setArrivalCity(city || null);
    }
  }, [watchedArrivalCityId, cities]);

  // Auto-update calculation when using current time and real-time updates occur
  useEffect(() => {
    if (isUsingCurrentTime && departureCity && arrivalCity && result && watchedDepartureDate && watchedDepartureTime) {
      // Check if the input time is approximately "now" (within 1 minute)
      const [hours, minutes] = watchedDepartureTime.split(':');
      const inputDate = new Date(watchedDepartureDate);
      inputDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const now = new Date();
      const timeDiff = Math.abs(inputDate.getTime() - now.getTime());
      
      if (timeDiff < 60000) { // Within 1 minute
        onSubmit({
          departureCityId: watchedDepartureCityId,
          arrivalCityId: watchedArrivalCityId,
          departureDate: watchedDepartureDate,
          departureTime: watchedDepartureTime,
          flightDuration: watch("flightDuration"),
        });
      }
    }
  }, [currentTime]); // Trigger when real-time time updates

  const assessJetLagImpact = (timeDifference: number): 'minimal' | 'mild' | 'moderate' | 'severe' => {
    const absDifference = Math.abs(timeDifference);
    
    if (absDifference <= 180) return 'minimal'; // 3 hours or less
    if (absDifference <= 360) return 'mild'; // 3-6 hours
    if (absDifference <= 540) return 'moderate'; // 6-9 hours
    return 'severe'; // More than 9 hours
  };

  const generateTravelRecommendations = (
    timeDifference: number,
    departureTime: Date,
    arrivalTime: Date,
    flightDuration: number
  ): string[] => {
    const recommendations: string[] = [];
    const jetLagImpact = assessJetLagImpact(timeDifference);
    
    // Jet lag recommendations
    switch (jetLagImpact) {
      case 'minimal':
        recommendations.push("Minimal jet lag expected. You should adjust quickly.");
        break;
      case 'mild':
        recommendations.push("Mild jet lag expected. Consider adjusting your sleep schedule a few days before travel.");
        break;
      case 'moderate':
        recommendations.push("Moderate jet lag expected. Start adjusting your sleep schedule 3-4 days before travel.");
        recommendations.push("Stay hydrated and avoid alcohol during the flight.");
        break;
      case 'severe':
        recommendations.push("Severe jet lag expected. Start adjusting your sleep schedule a week before travel.");
        recommendations.push("Consider breaking up the journey if possible.");
        recommendations.push("Stay hydrated, avoid alcohol and caffeine, and get sunlight at appropriate times.");
        break;
    }

    // Timing recommendations
    const departureHour = departureTime.getHours();
    const arrivalHour = arrivalTime.getHours();
    
    if (departureHour >= 22 || departureHour <= 6) {
      recommendations.push("Red-eye flight detected. Try to sleep during the flight and adjust to local time immediately upon arrival.");
    }
    
    if (arrivalHour >= 22 || arrivalHour <= 6) {
      recommendations.push("Late night/early morning arrival. Consider booking accommodation for immediate rest.");
    }

    // Flight duration recommendations
    if (flightDuration > 360) { // More than 6 hours
      recommendations.push("Long flight detected. Move around periodically and do in-seat exercises.");
      recommendations.push("Bring entertainment and stay hydrated throughout the flight.");
    }

    // Time difference direction
    if (timeDifference > 0) {
      recommendations.push("Traveling eastward. Jet lag may be more severe - be extra diligent with sleep schedule adjustments.");
    } else if (timeDifference < 0) {
      recommendations.push("Traveling westward. Jet lag may be milder, but still maintain good sleep habits.");
    }

    return recommendations;
  };

  const onSubmit = async (data: TravelTimeFormData) => {
    if (!departureCity || !arrivalCity) return;

    try {
      // Parse flight duration (expecting format like "2h 30m" or "150" for minutes)
      let flightDurationMinutes: number;
      if (data.flightDuration.includes('h')) {
        const hours = parseInt(data.flightDuration) || 0;
        const minutes = parseInt(data.flightDuration.match(/(\d+)m/)?.[1] || '0');
        flightDurationMinutes = hours * 60 + minutes;
      } else {
        flightDurationMinutes = parseInt(data.flightDuration) || 0;
      }

      // Combine departure date and time
      const [hours, minutes] = data.departureTime.split(':');
      const departureDateTime = new Date(data.departureDate);
      departureDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // If using current time, get the actual current time in departure timezone
      let departureTime = departureDateTime;
      if (isUsingCurrentTime) {
        departureTime = getCurrentTimeInTimezone(departureCity.timezone);
      }

      // Calculate arrival time in departure timezone
      const arrivalDateTime = new Date(departureTime.getTime() + (flightDurationMinutes * 60 * 1000));

      // Convert both times to arrival timezone
      const departureInArrivalTZ = convertTimeBetweenTimezones(
        departureTime,
        departureCity.timezone,
        arrivalCity.timezone
      );

      const arrivalInArrivalTZ = convertTimeBetweenTimezones(
        arrivalDateTime,
        departureCity.timezone,
        arrivalCity.timezone
      );

      // Calculate time difference between cities
      const timeDifference = convertTimeBetweenTimezones(
        departureTime,
        departureCity.timezone,
        arrivalCity.timezone
      ).timeDifference;

      const result: TravelTimeResult = {
        departureCity,
        arrivalCity,
        departureTime: departureTime,
        arrivalTime: arrivalDateTime,
        departureLocal: departureInArrivalTZ.targetTime.toLocaleString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        arrivalLocal: arrivalInArrivalTZ.targetTime.toLocaleString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        flightDuration: flightDurationMinutes,
        timeDifference,
        formattedTimeDifference: formatTimeDifference(timeDifference),
        jetLagImpact: assessJetLagImpact(timeDifference),
        recommendations: generateTravelRecommendations(
          timeDifference,
          departureTime,
          arrivalDateTime,
          flightDurationMinutes
        ),
      };

      setResult(result);
    } catch (error) {
      console.error("Error calculating travel time:", error);
    }
  };

  const handleDateTimeChange = () => {
    if (watchedDepartureDate && watchedDepartureTime) {
      // Check if the user is selecting current time (within 1 minute)
      const [hours, minutes] = watchedDepartureTime.split(':');
      const inputDate = new Date(watchedDepartureDate);
      inputDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const now = new Date();
      const timeDiff = Math.abs(inputDate.getTime() - now.getTime());
      setIsUsingCurrentTime(timeDiff < 60000);
    }
  };

  const swapCities = () => {
    const departureId = watch("departureCityId");
    const arrivalId = watch("arrivalCityId");
    
    setValue("departureCityId", arrivalId);
    setValue("arrivalCityId", departureId);
    setResult(null);
  };

  const resetForm = () => {
    reset();
    setResult(null);
    setDepartureCity(null);
    setArrivalCity(null);
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
            <Plane className="w-5 h-5" />
            Travel Time Calculator
          </CardTitle>
          <CardDescription>
            Calculate arrival times considering time zone changes during travel
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Departure City */}
            <div className="space-y-2">
              <Label htmlFor="departureCity">From City</Label>
              <Select onValueChange={(value) => setValue("departureCityId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select departure city" />
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
              {errors.departureCityId && (
                <p className="text-sm text-red-600">{errors.departureCityId.message}</p>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={swapCities}
                disabled={!watch("departureCityId") || !watch("arrivalCityId")}
                className="flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4 rotate-90" />
                Swap
              </Button>
            </div>

            {/* Arrival City */}
            <div className="space-y-2">
              <Label htmlFor="arrivalCity">To City</Label>
              <Select onValueChange={(value) => setValue("arrivalCityId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select arrival city" />
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
              {errors.arrivalCityId && (
                <p className="text-sm text-red-600">{errors.arrivalCityId.message}</p>
              )}
            </div>

            {/* Departure Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departureDate">Departure Date</Label>
                <Input
                  type="date"
                  {...register("departureDate")}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.departureDate && (
                  <p className="text-sm text-red-600">{errors.departureDate.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="departureTime" className="flex items-center gap-2">
                  Departure Time
                  {isUsingCurrentTime && socketConnected && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Live
                    </span>
                  )}
                </Label>
                <Input
                  type="time"
                  {...register("departureTime")}
                  onChange={() => handleDateTimeChange()}
                />
                {errors.departureTime && (
                  <p className="text-sm text-red-600">{errors.departureTime.message}</p>
                )}
              </div>
            </div>

            {/* Flight Duration */}
            <div className="space-y-2">
              <Label htmlFor="flightDuration">Flight Duration</Label>
              <Input
                placeholder="e.g., 2h 30m or 150 (minutes)"
                {...register("flightDuration")}
              />
              <p className="text-xs text-gray-500">
                Enter duration in minutes (e.g., 150) or hours and minutes (e.g., 2h 30m)
              </p>
              {errors.flightDuration && (
                <p className="text-sm text-red-600">{errors.flightDuration.message}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmitting || !watch("departureCityId") || !watch("arrivalCityId")}
                className="flex-1"
              >
                {isSubmitting ? "Calculating..." : "Calculate Travel Time"}
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
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Plane className="w-5 h-5" />
              Travel Time Results
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Departure */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{result.departureCity.name}, {result.departureCity.country}</span>
                </div>
                <div className="text-lg font-bold text-blue-900">
                  Departure
                </div>
                <div className="text-sm text-blue-700">
                  {result.departureTime.toLocaleString([], { 
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true 
                  })}
                </div>
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  Local Time
                </Badge>
              </div>

              {/* Arrival */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="font-medium">{result.arrivalCity.name}, {result.arrivalCity.country}</span>
                </div>
                <div className="text-lg font-bold text-green-900">
                  Arrival
                </div>
                <div className="text-sm text-green-700">
                  {result.arrivalLocal}
                </div>
                <Badge variant="outline" className="text-green-700 border-green-300">
                  Local Time
                </Badge>
              </div>
            </div>

            {/* Flight Details */}
            <div className="mt-4 p-4 bg-white rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Flight Duration</div>
                  <div className="font-semibold">
                    {Math.floor(result.flightDuration / 60)}h {result.flightDuration % 60}m
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Time Difference</div>
                  <div className="font-semibold">
                    {result.formattedTimeDifference}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Jet Lag Impact</div>
                  <Badge 
                    variant={
                      result.jetLagImpact === 'minimal' ? 'default' :
                      result.jetLagImpact === 'mild' ? 'secondary' :
                      result.jetLagImpact === 'moderate' ? 'outline' : 'destructive'
                    }
                    className={
                      result.jetLagImpact === 'minimal' ? 'bg-green-100 text-green-800' :
                      result.jetLagImpact === 'mild' ? 'bg-yellow-100 text-yellow-800' :
                      result.jetLagImpact === 'moderate' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }
                  >
                    {result.jetLagImpact.charAt(0).toUpperCase() + result.jetLagImpact.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="mt-4 p-4 bg-white rounded-lg border">
              <div className="text-sm font-medium mb-2">Travel Recommendations:</div>
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