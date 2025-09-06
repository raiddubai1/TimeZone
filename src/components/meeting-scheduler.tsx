"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, MapPin, Plus, X, Users, Check, AlertTriangle } from "lucide-react";
import { useCities } from "@/hooks/useCities";
import { getCitiesCurrentTime, convertTimeBetweenTimezones, formatTimeDifference } from "@/utils/timezone";
import { City } from "@/services/api";

interface MeetingCity {
  city: City;
  currentTime: Date;
  formattedTime: string;
  offsetString: string;
}

interface MeetingTimeSlot {
  hour: number;
  timeSlots: {
    time: string;
    cities: Array<{
      city: City;
      localTime: string;
      isReasonable: boolean;
    }>;
  }[];
}

const DEMO_USER_ID = 1;
const WORKING_HOURS = { start: 9, end: 17 }; // 9 AM to 5 PM

export default function MeetingScheduler() {
  const { cities, loading } = useCities();
  const [selectedCities, setSelectedCities] = useState<MeetingCity[]>([]);
  const [availableCities, setAvailableCities] = useState<City[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [meetingDuration, setMeetingDuration] = useState(60); // minutes
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Initialize with some default cities
  useEffect(() => {
    if (cities.length > 0 && selectedCities.length === 0) {
      const defaultCities = cities.filter(city => 
        ["New York", "London", "Tokyo"].includes(city.name)
      );
      
      if (defaultCities.length > 0) {
        const cityTimes = getCitiesCurrentTime(defaultCities);
        const meetingCities = cityTimes.map((time, index) => ({
          city: defaultCities[index],
          currentTime: time.currentTime,
          formattedTime: time.formattedTime,
          offsetString: time.offsetString
        }));
        setSelectedCities(meetingCities);
      }
    }
  }, [cities]);

  // Update available cities (exclude already selected)
  useEffect(() => {
    if (cities.length > 0) {
      const selectedCityIds = selectedCities.map(mc => mc.city.id);
      const available = cities.filter(city => !selectedCityIds.includes(city.id));
      setAvailableCities(available);
    }
  }, [cities, selectedCities]);

  // Update times every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedCities.length > 0) {
        const cityTimes = getCitiesCurrentTime(selectedCities.map(mc => mc.city));
        const updatedCities = selectedCities.map((mc, index) => ({
          ...mc,
          currentTime: cityTimes[index].currentTime,
          formattedTime: cityTimes[index].formattedTime,
          offsetString: cityTimes[index].offsetString
        }));
        setSelectedCities(updatedCities);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [selectedCities]);

  const addCity = (city: City) => {
    const cityTimes = getCitiesCurrentTime([city]);
    const newMeetingCity: MeetingCity = {
      city,
      currentTime: cityTimes[0].currentTime,
      formattedTime: cityTimes[0].formattedTime,
      offsetString: cityTimes[0].offsetString
    };
    setSelectedCities(prev => [...prev, newMeetingCity]);
  };

  const removeCity = (cityId: number) => {
    setSelectedCities(prev => prev.filter(mc => mc.city.id !== cityId));
  };

  const filteredCities = availableCities.filter(city => 
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateMeetingTimeSlots = (): MeetingTimeSlot[] => {
    if (selectedCities.length === 0) return [];

    const timeSlots: MeetingTimeSlot[] = [];
    
    // Generate time slots for 24 hours
    for (let hour = 0; hour < 24; hour++) {
      const slots: MeetingTimeSlot['timeSlots'][0][] = [];
      
      // Check every 30 minutes
      [0, 30].forEach(minute => {
        const baseTime = new Date();
        baseTime.setHours(hour, minute, 0, 0);
        
        const cityTimes = selectedCities.map(meetingCity => {
          const localTime = convertTimeBetweenTimezones(
            baseTime,
            "UTC", // Use UTC as base
            meetingCity.city.timezone
          );
          
          const localHour = localTime.targetTime.getHours();
          const isReasonable = localHour >= WORKING_HOURS.start && localHour < WORKING_HOURS.end;
          
          return {
            city: meetingCity.city,
            localTime: localTime.targetTime.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            }),
            isReasonable
          };
        });
        
        slots.push({
          time: baseTime.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          cities: cityTimes
        });
      });
      
      timeSlots.push({ hour, timeSlots: slots });
    }
    
    return timeSlots;
  };

  const findBestMeetingTimes = () => {
    const timeSlots = generateMeetingTimeSlots();
    const bestTimes: string[] = [];
    
    timeSlots.forEach(hourSlot => {
      hourSlot.timeSlots.forEach(slot => {
        const allReasonable = slot.cities.every(city => city.isReasonable);
        if (allReasonable) {
          bestTimes.push(slot.time);
        }
      });
    });
    
    return bestTimes.slice(0, 10); // Return top 10 best times
  };

  const handleFindMeetingTimes = () => {
    if (selectedCities.length < 2) {
      alert("Please select at least 2 cities for meeting scheduling.");
      return;
    }
    
    const bestTimes = findBestMeetingTimes();
    setSelectedTimeSlots(bestTimes);
    setShowResults(true);
  };

  const scheduleMeeting = (timeSlot: string) => {
    // In a real app, this would save to the database
    alert(`Meeting scheduled for ${timeSlot} across all selected cities!`);
  };

  if (loading) {
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
      {/* Selected Cities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Meeting Participants ({selectedCities.length})
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {selectedCities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4" />
              <p>Add cities to find the best meeting times</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedCities.map((meetingCity) => (
                  <Card key={meetingCity.city.id} className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => removeCity(meetingCity.city.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{meetingCity.city.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">
                        {meetingCity.city.country}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{meetingCity.formattedTime}</span>
                        <Badge variant="outline" className="text-xs">
                          {meetingCity.offsetString}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="flex items-center gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Duration:</label>
                  <Select value={meetingDuration.toString()} onValueChange={(value) => setMeetingDuration(parseInt(value))}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={handleFindMeetingTimes} disabled={selectedCities.length < 2}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Find Best Times
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Cities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Cities
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search cities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[200px] border rounded-lg">
            <div className="p-4 space-y-2">
              {filteredCities.slice(0, 20).map(city => (
                <div
                  key={city.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => addCity(city)}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{city.name}</div>
                      <div className="text-sm text-muted-foreground">{city.country}</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Meeting Results */}
      {showResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Best Meeting Times
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {selectedTimeSlots.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No optimal meeting times found</p>
                <p className="text-sm text-muted-foreground">
                  Try adding more cities or adjusting the working hours criteria
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground mb-4">
                  These times work well across all selected cities (during business hours):
                </div>
                
                {selectedTimeSlots.map((timeSlot, index) => (
                  <Card key={index} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{timeSlot}</div>
                          <div className="text-sm text-muted-foreground">
                            {selectedCities.map(city => city.city.name).join(", ")}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => scheduleMeeting(timeSlot)}
                          className="flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Schedule
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}