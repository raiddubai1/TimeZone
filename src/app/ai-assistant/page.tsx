"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, Calendar, Users, Brain, ArrowRight } from "lucide-react";
import AIChat from "@/components/ai-chat";

export default function AIAssistantPage() {
  const features = [
    {
      title: "Smart Time Zone Suggestions",
      description: "Get AI-powered recommendations for the best meeting times across time zones",
      icon: Clock,
      available: true
    },
    {
      title: "Natural Language Queries",
      description: "Ask questions in plain language like \"What time is it in Tokyo when it's 3 PM in New York?\"",
      icon: MessageSquare,
      available: true
    },
    {
      title: "Travel Planning Assistant",
      description: "Plan your trips with AI assistance for time zone changes and jet lag management",
      icon: Calendar,
      available: false
    },
    {
      title: "Team Coordination Helper",
      description: "AI-powered suggestions for coordinating with team members across different time zones",
      icon: Users,
      available: false
    }
  ];

  return (
    <div className="container mx-auto px-4 pt-24 pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            AI Time Zone Assistant
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Harness the power of artificial intelligence to simplify time zone management and scheduling.
          </p>
        </div>

        {/* AI Assistant Chat Interface */}
        <div className="mb-12">
          <AIChat />
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className="group hover:shadow-lg transition-all duration-300 hover:scale-105 border-border bg-card"
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <feature.icon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      {feature.title}
                      {!feature.available && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline"
                  className="w-full group-hover:bg-foreground group-hover:text-background transition-colors duration-300"
                  disabled={!feature.available}
                >
                  {feature.available ? (
                    <>
                      Try Feature
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  ) : "Coming Soon"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Capabilities Section */}
        <div className="bg-muted/30 rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-center mb-8">AI Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-2">24/7</div>
              <p className="text-muted-foreground">Always available assistance</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-2">195+</div>
              <p className="text-muted-foreground">Countries supported</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-2">Instant</div>
              <p className="text-muted-foreground">Real-time responses</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}