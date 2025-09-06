"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Clock, MapPin, Calendar } from "lucide-react";
import { useCities } from "@/hooks/useCities";
import { getCitiesCurrentTime, convertTimeBetweenTimezones, formatTimeDifference } from "@/utils/timezone";
import { City } from "@/services/api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  onCitySelect?: (city: City) => void;
}

const DEMO_USER_ID = 1;

export default function AIChat({ onCitySelect }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI Time Zone Assistant. I can help you with:\n\n• Time zone conversions\n• Finding the best meeting times\n• Current time in any city\n• Travel planning across time zones\n\nTry asking: \"What time is it in Tokyo when it's 3 PM in New York?\"",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { cities } = useCities();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const parseTimezoneQuery = (query: string) => {
    // Common patterns for time zone queries
    const patterns = [
      /what time is it in ([\w\s]+) when it's (\d+)(?::(\d+))?\s*(am|pm)? in ([\w\s]+)/i,
      /convert (\d+)(?::(\d+))?\s*(am|pm)? from ([\w\s]+) to ([\w\s]+)/i,
      /time difference between ([\w\s]+) and ([\w\s]+)/i,
      /current time in ([\w\s]+)/i,
      /best meeting time between ([\w\s]+) and ([\w\s]+)/i
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        return match;
      }
    }
    return null;
  };

  const findCityByName = (name: string): City | undefined => {
    return cities.find(city => 
      city.name.toLowerCase().includes(name.toLowerCase()) ||
      city.country.toLowerCase().includes(name.toLowerCase())
    );
  };

  const handleTimezoneQuery = async (query: string): Promise<string> => {
    const match = parseTimezoneQuery(query);
    
    if (!match) {
      return "I can help you with time zone questions! Try asking:\n• \"What time is it in Tokyo when it's 3 PM in New York?\"\n• \"Current time in London\"\n• \"Time difference between Paris and Sydney\"";
    }

    const [, ...groups] = match;

    // Handle "current time in city" queries
    if (query.toLowerCase().includes("current time in")) {
      const cityName = groups[0];
      const city = findCityByName(cityName);
      
      if (!city) {
        return `I couldn't find a city named "${cityName}". Available cities include: ${cities.slice(0, 5).map(c => c.name).join(", ")}...`;
      }

      const cityTime = getCitiesCurrentTime([city])[0];
      return `The current time in ${city.name}, ${city.country} is ${cityTime.formattedTime} on ${cityTime.formattedDate} (${cityTime.offsetString}).`;
    }

    // Handle time conversion queries
    if (query.toLowerCase().includes("when it's") || query.toLowerCase().includes("convert")) {
      const targetCityName = groups[0];
      const hour = parseInt(groups[1]);
      const minute = groups[2] ? parseInt(groups[2]) : 0;
      const ampm = groups[3];
      const sourceCityName = groups[4];

      const targetCity = findCityByName(targetCityName);
      const sourceCity = findCityByName(sourceCityName);

      if (!targetCity || !sourceCity) {
        const missingCity = !targetCity ? targetCityName : sourceCityName;
        return `I couldn't find a city named "${missingCity}". Please check the city name and try again.`;
      }

      // Create source time
      const sourceDate = new Date();
      let sourceHour = hour;
      if (ampm?.toLowerCase() === 'pm' && hour !== 12) {
        sourceHour += 12;
      } else if (ampm?.toLowerCase() === 'am' && hour === 12) {
        sourceHour = 0;
      }
      
      sourceDate.setHours(sourceHour, minute, 0, 0);

      const conversion = convertTimeBetweenTimezones(sourceDate, sourceCity.timezone, targetCity.timezone);
      
      return `When it's ${sourceDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} in ${sourceCity.name}, it will be ${conversion.targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} in ${targetCity.name} on the same day.\n\nTime difference: ${formatTimeDifference(conversion.timeDifference)}`;
    }

    // Handle time difference queries
    if (query.toLowerCase().includes("time difference")) {
      const city1Name = groups[0];
      const city2Name = groups[1];

      const city1 = findCityByName(city1Name);
      const city2 = findCityByName(city2Name);

      if (!city1 || !city2) {
        const missingCity = !city1 ? city1Name : city2Name;
        return `I couldn't find a city named "${missingCity}". Please check the city name and try again.`;
      }

      const times = getCitiesCurrentTime([city1, city2]);
      const timeDiff = times[1].offset - times[0].offset;
      
      return `Time difference between ${city1.name} and ${city2.name}:\n\n${city1.name}: ${times[0].formattedTime} (${times[0].offsetString})\n${city2.name}: ${times[1].formattedTime} (${times[1].offsetString})\n\nDifference: ${formatTimeDifference(timeDiff)}`;
    }

    return "I'm still learning to handle that type of question. Try asking about current times or time conversions between cities.";
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // First try to handle as a timezone query
      const response = await handleTimezoneQuery(input.trim());
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error while processing your request. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { text: "Current time in London", icon: Clock },
    { text: "NY to Tokyo time", icon: MapPin },
    { text: "Best meeting time EU-US", icon: Calendar }
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          AI Time Zone Assistant
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4 pb-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </div>
                  <div
                    className={`text-xs mt-2 ${
                      message.role === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
                
                {message.role === "user" && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                </div>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <div className="text-sm text-muted-foreground">
                    Thinking...
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {messages.length === 1 && (
          <div className="px-4 pb-4">
            <div className="text-sm text-muted-foreground mb-3">Quick actions:</div>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => setInput(action.text)}
                >
                  <action.icon className="w-3 h-3 mr-1" />
                  {action.text}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about time zones, conversions, or meeting times..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}