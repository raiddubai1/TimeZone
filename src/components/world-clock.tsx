"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, MapPin, Plus, X, Search, Globe } from "lucide-react";
import { useCities } from "@/hooks/useCities";
import { getCitiesCurrentTime } from "@/utils/timezone";
import { City } from "@/services/api";

interface CityClock {
  city: City;
  currentTime: Date;
  formattedTime: string;
  formattedDate: string;
  offsetString: string;
}

const DEMO_USER_ID = 1;

export default function WorldClock() {
  const { cities, loading } = useCities();
  const [selectedCities, setSelectedCities] = useState<CityClock[]>([]);
  const [availableCities, setAvailableCities] = useState<City[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");

  // Initialize with some popular cities
  useEffect(() => {
    if (cities.length > 0 && selectedCities.length === 0) {
      const popularCities = cities.filter(city => 
        ["New York", "London", "Tokyo", "Sydney"].includes(city.name)
      );
      
      if (popularCities.length > 0) {
        const cityTimes = getCitiesCurrentTime(popularCities);
        const clocks = cityTimes.map((time, index) => ({
          city: popularCities[index],
          currentTime: time.currentTime,
          formattedTime: time.formattedTime,
          formattedDate: time.formattedDate,
          offsetString: time.offsetString
        }));
        setSelectedCities(clocks);
      }
    }
  }, [cities]);

  // Update available cities (exclude already selected)
  useEffect(() => {
    if (cities.length > 0) {
      const selectedCityIds = selectedCities.map(clock => clock.city.id);
      const available = cities.filter(city => !selectedCityIds.includes(city.id));
      setAvailableCities(available);
    }
  }, [cities, selectedCities]);

  // Update times every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedCities.length > 0) {
        const cityTimes = getCitiesCurrentTime(selectedCities.map(clock => clock.city));
        const updatedClocks = selectedCities.map((clock, index) => ({
          ...clock,
          currentTime: cityTimes[index].currentTime,
          formattedTime: cityTimes[index].formattedTime,
          formattedDate: cityTimes[index].formattedDate,
          offsetString: cityTimes[index].offsetString
        }));
        setSelectedCities(updatedClocks);
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [selectedCities]);

  const addCity = (city: City) => {
    const cityTimes = getCitiesCurrentTime([city]);
    const newClock: CityClock = {
      city,
      currentTime: cityTimes[0].currentTime,
      formattedTime: cityTimes[0].formattedTime,
      formattedDate: cityTimes[0].formattedDate,
      offsetString: cityTimes[0].offsetString
    };
    setSelectedCities(prev => [...prev, newClock]);
  };

  const removeCity = (cityId: number) => {
    setSelectedCities(prev => prev.filter(clock => clock.city.id !== cityId));
  };

  const filteredCities = availableCities.filter(city => {
    const matchesSearch = city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         city.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion === "all" || city.country === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  const regions = Array.from(new Set(cities.map(city => city.country))).sort();

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
      {/* Selected Cities Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5" />
            World Clock ({selectedCities.length})
          </h3>
          <Badge variant="secondary">
            Auto-updating
          </Badge>
        </div>
        
        {selectedCities.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No cities selected yet</p>
              <p className="text-sm text-muted-foreground">Add cities below to start tracking their time</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {selectedCities.map((clock) => (
              <Card key={clock.city.id} className="relative group">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeCity(clock.city.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    {clock.city.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{clock.city.country}</p>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold mb-1">
                    {clock.formattedTime}
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {clock.formattedDate}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {clock.offsetString}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Cities Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Cities
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search cities or countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {regions.map(region => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Available Cities List */}
          <ScrollArea className="h-[300px] border rounded-lg">
            <div className="p-4 space-y-2">
              {filteredCities.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No cities found matching your search
                </div>
              ) : (
                filteredCities.slice(0, 50).map(city => (
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
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}