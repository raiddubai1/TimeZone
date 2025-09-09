"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { isSameDay, isWithinInterval, format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Clock, Users, MapPin, AlertTriangle, Check, X, User, Mail, CalendarDays, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { citiesApi, Meeting } from "@/services/api";
import { useMeetingsQuery, useCreateMeetingMutation, useUpdateMeetingMutation, useDeleteMeetingMutation } from "@/queries";
import { City } from "@/services/api";
import { convertTimeBetweenTimezones, formatTimeInTimezone } from "@/utils/timezone";
import AdSensePlaceholder from "@/components/AdSensePlaceholder";

interface SelectedCity {
  city: City;
  localWorkingHours: { start: Date; end: Date };
}

interface OverlappingSlot {
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  cities: string[];
}

// Simplified - no form fields needed for new structure

const WORKING_HOURS = { start: 9, end: 18 }; // 9 AM to 6 PM

export default function SchedulerPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCities, setSelectedCities] = useState<SelectedCity[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("18:00");
  const [overlappingSlots, setOverlappingSlots] = useState<OverlappingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<OverlappingSlot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [bookingForm, setBookingForm] = useState<object>({});
  const [formErrors, setFormErrors] = useState<object>({});
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    cities: [] as string[]
  });
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(new Date());
  
  const { toast } = useToast();
  const { data: meetings, isLoading: isLoadingMeetings } = useMeetingsQuery();
  const createMeetingMutation = useCreateMeetingMutation();
  const updateMeetingMutation = useUpdateMeetingMutation();
  const deleteMeetingMutation = useDeleteMeetingMutation();

  // Get today's date in YYYY-MM-DD format
  function getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Get tomorrow's date in YYYY-MM-DD format
  function getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  // Get next week's date in YYYY-MM-DD format
  function getNextWeekDate(): string {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }

  // Load cities on component mount
  useEffect(() => {
    const loadCities = async () => {
      try {
        const citiesData = await citiesApi.getAll();
        setCities(citiesData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load cities. Please try again.",
          variant: "destructive",
        });
      }
    };
    loadCities();
  }, [toast]);

  // Add city to selection
  const addCity = (city: City) => {
    if (selectedCities.length >= 5) {
      toast({
        title: "Maximum Cities Reached",
        description: "You can select a maximum of 5 cities for meeting scheduling.",
        variant: "destructive",
      });
      return;
    }

    if (selectedCities.some(sc => sc.city.id === city.id)) {
      toast({
        title: "City Already Selected",
        description: `${city.name} is already in your selection.`,
        variant: "destructive",
      });
      return;
    }

    // Create working hours for the selected date
    const baseDate = new Date(selectedDate + 'T00:00:00');
    const startWorkingHour = new Date(baseDate);
    startWorkingHour.setHours(WORKING_HOURS.start, 0, 0, 0);
    
    const endWorkingHour = new Date(baseDate);
    endWorkingHour.setHours(WORKING_HOURS.end, 0, 0, 0);

    setSelectedCities(prev => [...prev, {
      city,
      localWorkingHours: { start: startWorkingHour, end: endWorkingHour }
    }]);

    // Show success feedback
    toast({
      title: "City Added",
      description: `${city.name} has been added to your selection.`,
    });
  };

  // Remove city from selection
  const removeCity = (cityId: number) => {
    const removedCity = selectedCities.find(sc => sc.city.id === cityId);
    setSelectedCities(prev => prev.filter(sc => sc.city.id !== cityId));
    
    if (removedCity) {
      toast({
        title: "City Removed",
        description: `${removedCity.city.name} has been removed from your selection.`,
      });
    }
  };

  // Calculate overlapping time slots
  const calculateOverlappingSlots = () => {
    if (selectedCities.length < 2) {
      toast({
        title: "Insufficient Cities",
        description: "Please select at least 2 cities to find overlapping time slots. Meeting scheduling requires multiple participants.",
        variant: "destructive",
      });
      return;
    }

    if (selectedCities.length > 5) {
      toast({
        title: "Too Many Cities",
        description: "Please select no more than 5 cities for optimal meeting scheduling.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Parse the selected time range
      const baseDate = new Date(selectedDate + 'T00:00:00');
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      const rangeStart = new Date(baseDate);
      rangeStart.setHours(startHour, startMinute, 0, 0);

      const rangeEnd = new Date(baseDate);
      rangeEnd.setHours(endHour, endMinute, 0, 0);

      // Validate time range
      if (rangeStart >= rangeEnd) {
        toast({
          title: "Invalid Time Range",
          description: "End time must be after start time. Please adjust your time preferences.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if time range is within reasonable bounds (at least 30 minutes)
      const timeDiffMinutes = (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60);
      if (timeDiffMinutes < 30) {
        toast({
          title: "Time Range Too Short",
          description: "Please select a time range of at least 30 minutes for meeting scheduling.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if time range is too long (more than 12 hours)
      if (timeDiffMinutes > 720) {
        toast({
          title: "Time Range Too Long",
          description: "Please select a time range of 12 hours or less for optimal scheduling.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Convert the time range to each city's local time
      const cityRanges = selectedCities.map(selectedCity => {
        const localStart = convertTimeBetweenTimezones(rangeStart, "UTC", selectedCity.city.timezone);
        const localEnd = convertTimeBetweenTimezones(rangeEnd, "UTC", selectedCity.city.timezone);
        
        return {
          city: selectedCity.city,
          localStart: localStart.targetTime,
          localEnd: localEnd.targetTime,
          workingStart: selectedCity.localWorkingHours.start,
          workingEnd: selectedCity.localWorkingHours.end
        };
      });

      // Find overlapping slots (30-minute intervals)
      const slots: OverlappingSlot[] = [];
      const intervalMinutes = 30;
      
      // Check each 30-minute slot in the range
      let currentSlotStart = new Date(rangeStart);
      while (currentSlotStart < rangeEnd) {
        const currentSlotEnd = new Date(currentSlotStart.getTime() + intervalMinutes * 60000);
        
        // Check if this slot works for all cities
        const slotWorksForAllCities = cityRanges.every(range => {
          // Convert slot times to city's local time
          const localSlotStart = convertTimeBetweenTimezones(currentSlotStart, "UTC", range.city.timezone);
          const localSlotEnd = convertTimeBetweenTimezones(currentSlotEnd, "UTC", range.city.timezone);
          
          // Check if slot is within working hours for this city
          const slotStart = new Date(localSlotStart.targetTime);
          const slotEnd = new Date(localSlotEnd.targetTime);
          const workingStart = new Date(range.workingStart);
          const workingEnd = new Date(range.workingEnd);
          
          return slotStart >= workingStart && slotEnd <= workingEnd;
        });

        if (slotWorksForAllCities) {
          slots.push({
            startTime: new Date(currentSlotStart),
            endTime: new Date(currentSlotEnd),
            duration: intervalMinutes,
            cities: cityRanges.map(r => r.city.name)
          });
        }

        currentSlotStart = currentSlotEnd;
      }

      setOverlappingSlots(slots);
      setShowResults(true);
      setSelectedSlot(null); // Reset selected slot
      
      if (slots.length === 0) {
        toast({
          title: "No Available Time Slots",
          description: "No common working hours found across all selected cities. Try expanding your time range or reducing the number of cities.",
          variant: "destructive",
        });
      } else {
        const availableSlots = slots.filter(slot => !checkForConflicts(slot));
        const conflictSlots = slots.filter(slot => checkForConflicts(slot));
        
        let description = `Found ${slots.length} available time slot${slots.length > 1 ? 's' : ''}!`;
        if (conflictSlots.length > 0) {
          description += ` (${conflictSlots.length} conflict${conflictSlots.length > 1 ? 's' : ''} with existing meetings)`;
        }
        
        toast({
          title: "Time Slots Found",
          description: description,
        });
      }
    } catch (error) {
      toast({
        title: "Scheduling Error",
        description: "An error occurred while calculating time slots. Please check your selections and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check for conflicts with existing meetings
  const checkForConflicts = (slot: OverlappingSlot): boolean => {
    if (!meetings || meetings.length === 0) return false;

    return meetings.some(meeting => {
      // Check if meeting is on the same date
      const meetingDate = new Date(meeting.date);
      const slotDate = new Date(slot.startTime);
      
      if (meetingDate.toDateString() !== slotDate.toDateString()) return false;

      // Check if there's any overlap in time
      const meetingStart = meeting.startTime;
      const meetingEnd = meeting.endTime;
      const slotStart = slot.startTime;
      const slotEnd = slot.endTime;

      // Check for time overlap
      return (
        (slotStart >= meetingStart && slotStart < meetingEnd) ||
        (slotEnd > meetingStart && slotEnd <= meetingEnd) ||
        (slotStart <= meetingStart && slotEnd >= meetingEnd)
      );
    });
  };

  // Get conflicting meetings count for display
  const getConflictingMeetingsCount = (): number => {
    if (!meetings || meetings.length === 0 || overlappingSlots.length === 0) return 0;
    
    return overlappingSlots.filter(slot => checkForConflicts(slot)).length;
  };

  // Get meetings for a specific date
  const getMeetingsForDate = (date: Date): Meeting[] => {
    if (!meetings) return [];
    
    return meetings.filter(meeting => 
      isSameDay(meeting.date, date)
    );
  };

  // Get available slots for a specific date
  const getAvailableSlotsForDate = (date: Date): OverlappingSlot[] => {
    if (overlappingSlots.length === 0) return [];
    
    return overlappingSlots.filter(slot => 
      isSameDay(slot.startTime, date)
    );
  };

  // Handle calendar date click
  const handleCalendarDateClick = (date: Date) => {
    setSelectedCalendarDate(date);
    
    // Update the selected date in the main scheduler
    const dateString = date.toISOString().split('T')[0];
    setSelectedDate(dateString);
    
    // Show available slots for this date if we have cities selected
    if (selectedCities.length >= 2) {
      calculateOverlappingSlots();
    }
  };

  // Handle calendar event click
  const handleCalendarEventClick = (meeting: Meeting, e: React.MouseEvent) => {
    e.stopPropagation();
    // Show meeting details or open edit modal
    handleEditMeeting(meeting);
  };

  // Custom day content renderer for calendar
  const renderDayContent = (day: Date) => {
    const dayMeetings = getMeetingsForDate(day);
    const dayAvailableSlots = getAvailableSlotsForDate(day);
    
    return (
      <div className="relative w-full h-full">
        <div className="text-sm font-medium">{day.getDate()}</div>
        
        {/* Event indicators */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-0.5">
          {dayMeetings.length > 0 && (
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full" title={`${dayMeetings.length} meeting${dayMeetings.length > 1 ? 's' : ''}`} />
          )}
          {dayAvailableSlots.length > 0 && (
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" title={`${dayAvailableSlots.length} available slot${dayAvailableSlots.length > 1 ? 's' : ''}`} />
          )}
        </div>
      </div>
    );
  };

  // Handle slot selection
  const handleSlotSelect = (slot: OverlappingSlot) => {
    const hasConflict = checkForConflicts(slot);
    
    if (hasConflict) {
      toast({
        title: "Time Slot Conflict",
        description: "This time slot conflicts with an existing meeting. Please choose another time.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedSlot(slot);
  };

  // Handle booking modal open
  const handleBookMeeting = () => {
    if (!selectedSlot) {
      toast({
        title: "No Slot Selected",
        description: "Please select an available time slot first.",
        variant: "destructive",
      });
      return;
    }
    setIsBookingModalOpen(true);
  };

  // Validate booking form
  const validateForm = (): boolean => {
    // Simplified validation - just check if slot is selected
    if (!selectedSlot) {
      return false;
    }
    
    setFormErrors({});
    return true;
  };

  // Handle form submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Error",
        description: "No time slot selected.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSlot) {
      toast({
        title: "Error",
        description: "No time slot selected.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createMeetingMutation.mutateAsync({
        date: selectedSlot.startTime,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        cities: selectedSlot.cities,
      });

      toast({
        title: "Meeting Booked Successfully",
        description: `Your meeting has been scheduled for ${formatDate(selectedSlot.startTime)} at ${formatTime(selectedSlot.startTime)}.`,
      });

      // Reset and close modal
      setBookingForm({});
      setFormErrors({});
      setIsBookingModalOpen(false);
      setSelectedSlot(null);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to book meeting";
      toast({
        title: "Booking Failed",
        description: `Unable to book meeting: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  // Handle edit meeting
  const handleEditMeeting = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setEditForm({
      date: meeting.date.toISOString().split('T')[0],
      startTime: meeting.startTime.toTimeString().slice(0, 5),
      endTime: meeting.endTime.toTimeString().slice(0, 5),
      cities: [...meeting.cities]
    });
    setIsEditModalOpen(true);
  };

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMeeting) return;

    try {
      await updateMeetingMutation.mutateAsync({
        id: editingMeeting.id,
        data: {
          date: new Date(editForm.date + 'T00:00:00'),
          startTime: new Date(editForm.date + 'T' + editForm.startTime + ':00'),
          endTime: new Date(editForm.date + 'T' + editForm.endTime + ':00'),
          cities: editForm.cities
        }
      });

      toast({
        title: "Meeting Updated Successfully",
        description: `Your meeting has been rescheduled for ${formatDate(new Date(editForm.date))} at ${editForm.startTime}.`,
      });

      setIsEditModalOpen(false);
      setEditingMeeting(null);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update meeting";
      toast({
        title: "Update Failed",
        description: `Unable to update meeting: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  // Handle delete meeting
  const handleDeleteMeeting = async (meetingId: string) => {
    try {
      await deleteMeetingMutation.mutateAsync(meetingId);

      toast({
        title: "Meeting Deleted Successfully",
        description: "The meeting has been removed from your schedule.",
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete meeting";
      toast({
        title: "Delete Failed",
        description: `Unable to delete meeting: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString([], {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get available cities (not selected)
  const availableCities = cities.filter(city => 
    !selectedCities.some(sc => sc.city.id === city.id)
  );

  return (
    <div className="container mx-auto px-4 pt-24 pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Meeting Scheduler
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Easily find the best meeting time across multiple cities and book your meetings.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Section - Calendar and Inputs */}
          <div className="space-y-6">
            {/* Calendar Component */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Meeting Calendar
                </CardTitle>
                <CardDescription>
                  Click on a date to view available time slots and book meetings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-full max-w-sm">
                    <Calendar
                      mode="single"
                      selected={selectedCalendarDate}
                      onSelect={(date) => {
                        if (date) {
                          handleCalendarDateClick(date);
                        }
                      }}
                      className="rounded-md border pointer-events-auto w-full"
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      modifiers={{
                        hasMeetings: (date) => getMeetingsForDate(date).length > 0,
                        hasAvailableSlots: (date) => getAvailableSlotsForDate(date).length > 0
                      }}
                      modifiersStyles={{
                        hasMeetings: { backgroundColor: '#fef2f2', borderColor: '#f87171' },
                        hasAvailableSlots: { backgroundColor: '#f0fdf4', borderColor: '#4ade80' }
                      }}
                    />
                  </div>
                  
                  {/* Calendar Legend */}
                  <div className="flex flex-wrap gap-4 text-xs justify-center">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Has Meetings</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Available Slots</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      <span>Past Dates</span>
                    </div>
                  </div>
                  
                  {/* Selected Date Info */}
                  {selectedCalendarDate && (
                    <div className="text-center p-3 bg-muted/50 rounded-lg w-full">
                      <p className="text-sm font-medium">
                        Selected: {selectedCalendarDate.toLocaleDateString()}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs justify-center">
                        <span>
                          🔴 {getMeetingsForDate(selectedCalendarDate).length} meetings
                        </span>
                        <span>
                          🟢 {getAvailableSlotsForDate(selectedCalendarDate).length} available slots
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Inputs Card - Now below calendar on desktop, side by side on mobile */}
            <Card className="h-fit lg:hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Quick Settings
                </CardTitle>
                <CardDescription>
                  Essential meeting configuration options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Simplified mobile controls */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Cities Selected</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedCities.slice(0, 3).map(selectedCity => (
                        <Badge key={selectedCity.city.id} variant="secondary" className="text-xs">
                          {selectedCity.city.name}
                        </Badge>
                      ))}
                      {selectedCities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{selectedCities.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="sm"
                    onClick={calculateOverlappingSlots}
                    disabled={isLoading || selectedCities.length < 2}
                  >
                    {isLoading ? "Calculating..." : "Check Availability"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Full Inputs Card - Visible on larger screens */}
            <Card className="h-fit hidden lg:block">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Select Participants & Times
                </CardTitle>
                <CardDescription>
                  Choose the cities and time preferences for your meeting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Multi-select dropdown for cities */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Select Cities ({selectedCities.length}/5)
                  </label>
                  <Select onValueChange={(value) => {
                    const city = cities.find(c => c.id.toString() === value);
                    if (city) addCity(city);
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose cities for the meeting" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCities.slice(0, 10).map(city => (
                        <SelectItem key={city.id} value={city.id.toString()}>
                          {city.name}, {city.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select 2-5 cities to compare time zones
                  </p>
                </div>

                {/* Selected cities display */}
                {selectedCities.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Selected Cities:</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedCities.map(selectedCity => (
                        <Badge key={selectedCity.city.id} variant="secondary" className="flex items-center gap-1">
                          {selectedCity.city.name}
                          <button
                            onClick={() => removeCity(selectedCity.city.id)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Date picker */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Meeting Date
                  </label>
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={getTodayDate()}>Today</SelectItem>
                      <SelectItem value={getTomorrowDate()}>Tomorrow</SelectItem>
                      <SelectItem value={getNextWeekDate()}>Next Week</SelectItem>
                      <SelectItem value="custom">Custom Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Time range input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Preferred Time Range
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={startTime} onValueChange={setStartTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 14 }, (_, i) => i + 8).map(hour => (
                          <SelectItem key={`${hour}:00`} value={`${hour.toString().padStart(2, '0')}:00`}>
                            {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={endTime} onValueChange={setEndTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="End time" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 14 }, (_, i) => i + 9).map(hour => (
                          <SelectItem key={`${hour}:00`} value={`${hour.toString().padStart(2, '0')}:00`}>
                            {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Specify your preferred meeting time window
                  </p>
                </div>

                {/* Check Availability Button */}
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={calculateOverlappingSlots}
                  disabled={isLoading || selectedCities.length < 2}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Clock className="w-4 h-4 mr-2" />
                  )}
                  {isLoading ? "Calculating..." : "Check Availability"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* AdSense Placeholder - Skyscraper size below form */}
          <div className="my-8 flex justify-center">
            <AdSensePlaceholder size="skyscraper" />
          </div>

          {/* Right Section - Results */}
          <div className="space-y-6">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Results
                </CardTitle>
                <CardDescription>
                  Meeting time suggestions and availability overview
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {showResults ? (
                  overlappingSlots.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-center py-4">
                        <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <p className="text-lg font-medium text-green-700">
                          Found {overlappingSlots.length} available slot{overlappingSlots.length > 1 ? 's' : ''}!
                        </p>
                      </div>

                      {/* Overlapping slots */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Available Time Slots:</h4>
                        {overlappingSlots.map((slot, index) => {
                          const hasConflict = checkForConflicts(slot);
                          
                          return (
                            <Card 
                              key={index} 
                              className={`transition-all duration-200 cursor-pointer ${
                                hasConflict 
                                  ? 'border-red-300 bg-red-50 opacity-60' 
                                  : selectedSlot?.startTime === slot.startTime 
                                    ? 'border-green-500 bg-green-50' 
                                    : 'border-green-200 bg-green-50 hover:border-green-400'
                              }`}
                              onClick={() => !hasConflict && handleSlotSelect(slot)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-green-800">
                                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                    </div>
                                    <div className="text-sm text-green-600">
                                      {slot.duration} minutes • Works for all cities
                                    </div>
                                    <div className="text-xs text-green-600 mt-1">
                                      {formatDate(slot.startTime)}
                                    </div>
                                    {hasConflict && (
                                      <div className="flex items-center gap-1 text-red-600 text-xs mt-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>Conflict with existing meeting</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {selectedSlot?.startTime === slot.startTime && (
                                      <Check className="w-4 h-4 text-green-600" />
                                    )}
                                    <Button 
                                      size="sm" 
                                      className={hasConflict ? "bg-gray-400 hover:bg-gray-500" : "bg-green-600 hover:bg-green-700"}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!hasConflict) handleBookMeeting();
                                      }}
                                      disabled={hasConflict}
                                    >
                                      {hasConflict ? "Unavailable" : "Book"}
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      {/* Book Selected Meeting Button */}
                      {selectedSlot && (
                        <Button 
                          className="w-full mt-4" 
                          onClick={handleBookMeeting}
                        >
                          <CalendarDays className="w-4 h-4 mr-2" />
                          Book Selected Meeting
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                      <p className="text-lg text-muted-foreground mb-2">
                        No common availability found
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Try adjusting the time range or reducing the number of cities
                      </p>
                      <div className="space-y-2 text-left bg-muted/30 rounded-lg p-4">
                        <h5 className="font-medium text-sm">Suggestions:</h5>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• Expand your time range (e.g., 8:00 AM - 7:00 PM)</li>
                          <li>• Reduce the number of cities</li>
                          <li>• Try a different date</li>
                          <li>• Consider cities in closer time zones</li>
                        </ul>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground mb-2">
                      Meeting results will appear here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Select participants and time preferences to see available meeting slots
                    </p>
                  </div>
                )}

                {/* Timeline visualization */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Timeline Preview</h4>
                  <div className="bg-muted/30 rounded-lg p-6 min-h-[200px] border-2 border-dashed border-muted-foreground/20">
                    {selectedCities.length > 0 ? (
                      <div className="space-y-3">
                        {selectedCities.map((selectedCity, index) => (
                          <div key={selectedCity.city.id} className="flex items-center gap-3">
                            <div className="w-20 text-xs font-medium">
                              {selectedCity.city.name}:
                            </div>
                            <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                              {/* Working hours background */}
                              <div 
                                className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
                                style={{ 
                                  left: '25%', 
                                  width: '50%' 
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center text-xs text-white">
                                9:00 AM - 6:00 PM
                              </div>
                              
                              {/* Booked meetings for this city */}
                              {meetings && meetings.length > 0 && (
                                <>
                                  {meetings
                                    .filter(meeting => 
                                      meeting.cities.includes(selectedCity.city.name) &&
                                      meeting.date.toDateString() === new Date(selectedDate).toDateString()
                                    )
                                    .map((meeting, meetingIndex) => {
                                      const startPercent = (meeting.startTime.getHours() - 9) / 9 * 100; // 9 AM to 6 PM = 9 hours
                                      const duration = (meeting.endTime.getTime() - meeting.startTime.getTime()) / (1000 * 60 * 60); // in hours
                                      const widthPercent = (duration / 9) * 100;
                                      
                                      return (
                                        <div
                                          key={meetingIndex}
                                          className="absolute top-0 h-full bg-red-500 rounded-full opacity-80"
                                          style={{
                                            left: `${Math.max(0, Math.min(100, startPercent))}%`,
                                            width: `${Math.max(2, Math.min(100 - startPercent, widthPercent))}%`,
                                            zIndex: 10
                                          }}
                                        />
                                      );
                                    })}
                                </>
                              )}
                              
                              {/* Available overlapping slots */}
                              {overlappingSlots.length > 0 && (
                                <div 
                                  className="absolute left-0 top-0 h-full bg-green-500 rounded-full opacity-60"
                                  style={{ 
                                    left: '30%', 
                                    width: '40%' 
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* Timeline legend */}
                        <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                            <span>Working Hours</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span>Available Slots</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded"></div>
                            <span>Booked Meetings</span>
                          </div>
                        </div>
                        
                        {/* Conflict indicators */}
                        {meetings && meetings.length > 0 && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 text-yellow-800 text-sm">
                              <AlertTriangle className="w-4 h-4" />
                              <span className="font-medium">Timeline Conflicts</span>
                            </div>
                            <p className="text-yellow-700 text-xs mt-1">
                              Red bars show booked meetings that may conflict with available time slots.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">Timeline visualization will appear here</p>
                          <p className="text-xs mt-1">Showing available time slots and booked meetings across cities</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-primary">
                      {showResults ? overlappingSlots.length : '--'}
                    </div>
                    <div className="text-xs text-muted-foreground">Available Slots</div>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-primary">
                      {selectedCities.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Cities Covered</div>
                  </div>
                  {showResults && overlappingSlots.length > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-4 text-center col-span-2">
                      <div className="text-lg font-bold text-yellow-700">
                        {getConflictingMeetingsCount()}
                      </div>
                      <div className="text-xs text-yellow-600">Conflicting Slots</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Your Bookings Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-center mb-8">Your Bookings</h2>
          <div className="max-w-4xl mx-auto">
            {isLoadingMeetings ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your bookings...</p>
              </div>
            ) : meetings && meetings.length > 0 ? (
              <div className="space-y-4">
                {meetings.map((meeting) => (
                  <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">Meeting</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                              <span>{formatDate(meeting.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>{formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}</span>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span>{meeting.cities.join(', ')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant="secondary">
                            Booked
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditMeeting(meeting)}
                            disabled={updateMeetingMutation.isPending}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                disabled={deleteMeetingMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this meeting? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteMeeting(meeting.id)}
                                  className="bg-destructive hover:bg-destructive"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <CalendarDays className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground mb-2">No meetings booked yet</p>
                <p className="text-sm text-muted-foreground">
                  Book your first meeting using the scheduler above
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-center mb-8">Meeting Scheduler Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Multi-City Support</h3>
              <p className="text-muted-foreground text-sm">Compare time zones across multiple cities simultaneously</p>
            </div>
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Smart Suggestions</h3>
              <p className="text-muted-foreground text-sm">AI-powered recommendations for optimal meeting times</p>
            </div>
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Instant Booking</h3>
              <p className="text-muted-foreground text-sm">Book meetings directly from available time slots</p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirm Meeting Booking</DialogTitle>
            <DialogDescription>
              Review the meeting details and confirm your booking.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSlot && (
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="w-4 h-4" />
                <span className="font-medium">Date & Time:</span>
                <span>
                  {formatDate(selectedSlot.startTime)} at {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm mt-1">
                <MapPin className="w-4 h-4" />
                <span>{selectedSlot.cities.join(', ')}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsBookingModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMeetingMutation.isPending}>
                {createMeetingMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                Confirm Booking
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Meeting Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Meeting</DialogTitle>
            <DialogDescription>
              Update the meeting details and save your changes.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editDate">Meeting Date</Label>
              <Input
                id="editDate"
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editStartTime">Start Time</Label>
              <Input
                id="editStartTime"
                type="time"
                value={editForm.startTime}
                onChange={(e) => setEditForm(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editEndTime">End Time</Label>
              <Input
                id="editEndTime"
                type="time"
                value={editForm.endTime}
                onChange={(e) => setEditForm(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Selected Cities</Label>
              <div className="flex flex-wrap gap-2">
                {editForm.cities.map((city, index) => (
                  <Badge key={index} variant="secondary">
                    {city}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Cities are automatically populated from the original booking
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMeetingMutation.isPending}>
                {updateMeetingMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}