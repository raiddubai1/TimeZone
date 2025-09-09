"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Clock, MapPin, Plus, Trash2, Settings, Globe, Wifi, WifiOff } from "lucide-react";
import { useCitiesQuery, useUserPreferencesQuery, useCreatePreferenceMutation, useDeletePreferenceMutation } from "@/queries";
import { useSocket, useRealTimePreferences } from "@/hooks/useSocket";
import { City, TimeZonePreference } from "@/services/api";
import { getCitiesCurrentTime } from "@/utils/timezone";

// Sortable Preference Card Component
const SortablePreferenceCard = ({ 
  preference, 
  timeInfo, 
  socketConnected, 
  onRemove 
}: { 
  preference: TimeZonePreference; 
  timeInfo: any; 
  socketConnected: boolean; 
  onRemove: (id: number) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: preference.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const city = preference.city;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="relative group hover:shadow-lg transition-all duration-300"
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 cursor-grab active:cursor-grabbing p-2 rounded hover:bg-gray-100 transition-colors duration-200"
      >
        <div className="w-1 h-4 bg-gray-400 rounded"></div>
        <div className="w-1 h-4 bg-gray-400 rounded mt-1"></div>
      </div>

      {/* Real-time indicator */}
      {socketConnected && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      )}
      
      <Card className="ml-8">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{city.country}</span>
              <div>
                <CardTitle className="text-lg">{city.name}</CardTitle>
                <p className="text-sm text-gray-500">{city.timezone}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(preference.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {timeInfo && (
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gray-900">
                {timeInfo.formattedTime}
              </div>
              <div className="text-sm text-gray-600 flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span>{timeInfo.formattedDate}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {timeInfo.offsetString}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Demo user ID - since we don't have authentication yet
const DEMO_USER_ID = 1;

export default function PreferencesPage() {
  const { data: cities, isLoading: citiesLoading } = useCitiesQuery();
  const { data: preferences, isLoading: preferencesLoading } = useUserPreferencesQuery(DEMO_USER_ID);
  const { isConnected: socketConnected } = useSocket();
  const { preferences: realTimePreferences } = useRealTimePreferences();
  
  const createPreferenceMutation = useCreatePreferenceMutation();
  const deletePreferenceMutation = useDeletePreferenceMutation();
  
  const [userPreferences, setUserPreferences] = useState<TimeZonePreference[]>([]);
  const [availableCities, setAvailableCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [preferenceTimes, setPreferenceTimes] = useState<any[]>([]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setUserPreferences((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Update user preferences when data changes
  useEffect(() => {
    if (preferences && preferences.length > 0) {
      setUserPreferences(preferences);
      
      // Get cities that are not already in user preferences
      const userCityIds = preferences.map(p => p.cityId);
      const available = cities?.filter(c => !userCityIds.includes(c.id)) || [];
      setAvailableCities(available);
    }
  }, [preferences, cities]);

  // Update real-time preferences when socket data changes
  useEffect(() => {
    if (realTimePreferences.length > 0) {
      const userRealTimePrefs = realTimePreferences.filter(p => p.userId === DEMO_USER_ID);
      if (userRealTimePrefs.length > 0) {
        setUserPreferences(prev => {
          // Merge with existing preferences, avoiding duplicates
          const existingIds = new Set(prev.map(p => p.id));
          const newPrefs = userRealTimePrefs.filter(p => !existingIds.has(p.id));
          return [...prev, ...newPrefs];
        });
      }
    }
  }, [realTimePreferences]);

  useEffect(() => {
    if (userPreferences.length > 0) {
      const prefCities = userPreferences.map(p => p.city);
      const times = getCitiesCurrentTime(prefCities);
      setPreferenceTimes(times);
    }
  }, [userPreferences]);

  // Update times every minute (fallback if socket is not connected)
  useEffect(() => {
    if (!socketConnected) {
      const interval = setInterval(() => {
        if (userPreferences.length > 0) {
          const prefCities = userPreferences.map(p => p.city);
          const times = getCitiesCurrentTime(prefCities);
          setPreferenceTimes(times);
        }
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [userPreferences, socketConnected]);

  const handleAddPreference = async () => {
    if (!selectedCity) {
      toast.error("Please select a city");
      return;
    }

    try {
      const cityId = parseInt(selectedCity);
      await createPreferenceMutation.mutateAsync({ userId: DEMO_USER_ID, cityId });
      toast.success("City added to your preferences!");
      setSelectedCity("");
      setIsAddDialogOpen(false);
    } catch (error) {
      toast.error("Failed to add city to preferences");
    }
  };

  const handleRemovePreference = async (preferenceId: number) => {
    try {
      await deletePreferenceMutation.mutateAsync(preferenceId);
      toast.success("City removed from your preferences");
    } catch (error) {
      toast.error("Failed to remove city from preferences");
    }
  };

  if (citiesLoading || preferencesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          {/* Connection Status */}
          <div className="flex justify-center mb-4">
            <Badge 
              variant={socketConnected ? "default" : "secondary"}
              className="flex items-center gap-2"
            >
              {socketConnected ? (
                <>
                  <Wifi className="w-4 h-4" />
                  Real-time Connected
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  Offline Mode
                </>
              )}
            </Badge>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Time Zone Preferences
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Manage your preferred cities and see their current times at a glance.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Cities</CardTitle>
              <Globe className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{cities?.length || 0}</div>
              <p className="text-xs text-blue-600">Available worldwide</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Your Preferences</CardTitle>
              <Settings className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{userPreferences.length}</div>
              <p className="text-xs text-green-600">Cities tracked</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Available</CardTitle>
              <Plus className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{availableCities.length}</div>
              <p className="text-xs text-purple-600">Cities to add</p>
            </CardContent>
          </Card>
        </div>

        {/* Add City Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your Preferred Cities</h2>
            <p className="text-gray-600">Cities you've selected for quick time reference</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={availableCities.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add City
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add City to Preferences</DialogTitle>
                <DialogDescription>
                  Select a city to add to your time zone preferences.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="city-select">City</Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a city" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCities.map((city) => (
                        <SelectItem key={city.id} value={city.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span>{city.country}</span>
                            <span>{city.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddPreference} 
                    disabled={!selectedCity || createPreferenceMutation.isPending}
                  >
                    {createPreferenceMutation.isPending ? "Adding..." : "Add City"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Preferred Cities Grid */}
        {userPreferences.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No preferred cities yet</h3>
              <p className="text-gray-600 mb-6">Add cities to your preferences to see their current times here.</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First City
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={userPreferences.map(p => p.id)} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userPreferences.map((preference, index) => {
                  const city = preference.city;
                  const timeInfo = preferenceTimes[index];
                  
                  return (
                    <SortablePreferenceCard
                      key={preference.id}
                      preference={preference}
                      timeInfo={timeInfo}
                      socketConnected={socketConnected}
                      onRemove={handleRemovePreference}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Available Cities Section */}
        {availableCities.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Available Cities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {availableCities.slice(0, 8).map((city) => (
                <Card key={city.id} className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{city.country}</span>
                          <span className="font-medium">{city.name}</span>
                        </div>
                        <p className="text-xs text-gray-500">{city.timezone}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCity(city.id.toString());
                          setIsAddDialogOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {availableCities.length > 8 && (
              <div className="text-center mt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                  View All {availableCities.length} Available Cities
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">About Time Zone Preferences</h3>
                  <p className="text-gray-600 mb-4">
                    Your time zone preferences allow you to quickly track the current time in cities that matter most to you. 
                    This feature will be enhanced with user authentication in the future, allowing you to save your preferences across devices.
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>🔄 {socketConnected ? "Real-time updates" : "Updates every minute"}</span>
                    <span>🌍 Covers {cities?.length || 0} cities worldwide</span>
                    <span>⚡ Instant calculations</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}