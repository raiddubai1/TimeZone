"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Clock, Calendar, Plane, Globe, ArrowRight } from "lucide-react";
import TimeDifferenceCalculator from "@/components/calculators/time-difference-calculator";
import WorkingHoursCalculator from "@/components/calculators/working-hours-calculator";
import TravelTimeCalculator from "@/components/calculators/travel-time-calculator";
import MeetingScheduler from "@/components/meeting-scheduler";

export default function CalculatorsPage() {
  const calculators = [
    {
      id: "time-difference",
      title: "Time Difference Calculator",
      description: "Calculate the time difference between two cities or time zones",
      icon: Clock,
      comingSoon: false
    },
    {
      id: "meeting-scheduler",
      title: "Meeting Time Calculator",
      description: "Find optimal meeting times across multiple time zones",
      icon: Calendar,
      comingSoon: false
    },
    {
      id: "travel-time",
      title: "Travel Time Calculator",
      description: "Calculate arrival times considering time zone changes during travel",
      icon: Plane,
      comingSoon: false
    },
    {
      id: "working-hours",
      title: "Working Hours Calculator",
      description: "Determine overlapping working hours across different time zones",
      icon: Calculator,
      comingSoon: false
    }
  ];

  return (
    <div className="container mx-auto px-4 pt-24 pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Time Zone Calculators
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Advanced calculators to help you solve complex time zone problems and make scheduling decisions.
          </p>
        </div>

        {/* Calculators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {calculators.map((calculator) => (
            <Card 
              key={calculator.id} 
              className="group hover:shadow-lg transition-all duration-300 hover:scale-105 border-border bg-card cursor-pointer"
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <calculator.icon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      {calculator.title}
                      {calculator.comingSoon && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className="text-base">
                  {calculator.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full group-hover:bg-foreground group-hover:text-background transition-colors duration-300"
                  disabled={calculator.comingSoon}
                >
                  {calculator.comingSoon ? "Coming Soon" : (
                    <>
                      Use Calculator
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Interactive Calculators Section */}
        <div className="bg-muted/30 rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-center mb-8">Interactive Calculators</h2>
          
          <Tabs defaultValue="time-difference" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8">
              {calculators.map((calculator) => (
                <TabsTrigger 
                  key={calculator.id} 
                  value={calculator.id}
                  className="flex items-center gap-2 text-xs sm:text-sm"
                  disabled={calculator.comingSoon}
                >
                  <calculator.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {calculator.title.split(' ')[0]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="time-difference" className="space-y-4">
              <TimeDifferenceCalculator />
            </TabsContent>
            
            <TabsContent value="meeting-scheduler" className="space-y-4">
              <MeetingScheduler />
            </TabsContent>
            
            <TabsContent value="travel-time" className="space-y-4">
              <TravelTimeCalculator />
            </TabsContent>
            
            <TabsContent value="working-hours" className="space-y-4">
              <WorkingHoursCalculator />
            </TabsContent>
          </Tabs>
        </div>

        {/* Features Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-center mb-8">Calculator Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Precise Calculations</h3>
              <p className="text-muted-foreground text-sm">Accurate time zone calculations with daylight saving time considerations</p>
            </div>
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Real-time Results</h3>
              <p className="text-muted-foreground text-sm">Instant calculations with current time and date information</p>
            </div>
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Global Coverage</h3>
              <p className="text-muted-foreground text-sm">Support for all time zones and major cities worldwide</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}