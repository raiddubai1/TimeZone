"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MapPin, Calendar, Users, ArrowRight, Globe } from "lucide-react";
import Link from "next/link";
import WorldClock from "@/components/world-clock";
import MeetingScheduler from "@/components/meeting-scheduler";

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState("world-clock");

  const tools = [
    {
      title: "Time Zone Converter",
      description: "Convert time between different time zones instantly",
      icon: Clock,
      comingSoon: false,
      href: "/converter"
    },
    {
      title: "World Clock",
      description: "View current time in multiple cities around the world",
      icon: MapPin,
      comingSoon: false,
      href: "#",
      tab: "world-clock"
    },
    {
      title: "Meeting Scheduler",
      description: "Find the best time for meetings across different time zones",
      icon: Calendar,
      comingSoon: false,
      href: "#",
      tab: "meeting-scheduler"
    },
    {
      title: "Team Time Zone Overview",
      description: "Manage and view your team's time zones in one place",
      icon: Users,
      comingSoon: true,
      href: "#"
    }
  ];

  return (
    <div className="container mx-auto px-4 pt-24 pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Time Zone Tools
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Powerful tools to help you manage time zones, schedule meetings, and stay connected across the globe.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-12">
          {tools.map((tool, index) => (
            <Card 
              key={tool.title} 
              className={`group hover:shadow-lg transition-all duration-300 hover:scale-105 border-border bg-card cursor-pointer ${
                tool.tab === activeTab ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => tool.tab && setActiveTab(tool.tab)}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <tool.icon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      {tool.title}
                      {tool.comingSoon && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className="text-base">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tool.href === "#" ? (
                  <Button 
                    className="w-full group-hover:bg-foreground group-hover:text-background transition-colors duration-300"
                    disabled={tool.comingSoon}
                  >
                    {tool.comingSoon ? "Coming Soon" : (
                      <>
                        Use Tool
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Link href={tool.href}>
                    <Button 
                      className="w-full group-hover:bg-foreground group-hover:text-background transition-colors duration-300"
                    >
                      Use Tool
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Interactive Tools Section */}
        <div className="bg-muted/30 rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-center mb-8">Interactive Tools</h2>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="world-clock" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                World Clock
              </TabsTrigger>
              <TabsTrigger value="meeting-scheduler" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Meeting Scheduler
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="world-clock" className="space-y-4">
              <WorldClock />
            </TabsContent>
            
            <TabsContent value="meeting-scheduler" className="space-y-4">
              <MeetingScheduler />
            </TabsContent>
          </Tabs>
        </div>

        {/* Info Section */}
        <div className="mt-16 text-center">
          <div className="bg-muted/30 rounded-lg p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Need More Tools?</h2>
            <p className="text-muted-foreground mb-6">
              We're constantly adding new time zone management tools to help you work more efficiently across different time zones.
            </p>
            <Button variant="outline" className="hover:bg-foreground hover:text-background transition-colors duration-300">
              Suggest a Tool
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}