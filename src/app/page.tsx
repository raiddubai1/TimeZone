"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Globe, Users, Zap, Shield, ArrowRight, Calendar, Smartphone } from "lucide-react";
import AdSensePlaceholder from "@/components/AdSensePlaceholder";

interface CityTime {
  name: string;
  country: string;
  timezone: string;
  offset: number;
  currentTime: Date;
  formattedTime: string;
  formattedDate: string;
  period: string;
}

export default function Home() {
  const [cities, setCities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cityTimes, setCityTimes] = useState<CityTime[]>([]);
  const [displayCities, setDisplayCities] = useState<CityTime[]>([]);

  useEffect(() => {
    // Fetch cities directly
    const fetchCities = async () => {
      try {
        console.log('Starting to fetch cities...');
        setIsLoading(true);
        const response = await fetch('/api/cities');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch cities: ${response.status}`);
        }
        
        const citiesData = await response.json();
        console.log('Cities data received:', citiesData);
        setCities(citiesData);
        
        if (citiesData && citiesData.length > 0) {
          const citiesToShow = citiesData.slice(0, 4);
          console.log('Cities to show:', citiesToShow);
          const times = citiesToShow.map(city => {
            const now = new Date();
            
            // Simple time formatting without locale issues
            const hours = now.getHours();
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12; // Convert to 12-hour format
            
            return {
              name: city.name,
              country: city.country,
              timezone: city.timezone,
              offset: city.offset,
              currentTime: now,
              formattedTime: `${displayHours}:${minutes}`,
              formattedDate: now.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              }),
              period: period
            };
          });
          setCityTimes(times);
          setDisplayCities(times);
          console.log('Times set:', times);
        }
      } catch (err) {
        console.error('Error fetching cities:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        console.log('Finally block - setting isLoading to false');
        setIsLoading(false);
      }
    };

    fetchCities();
    
    // Fallback timeout to ensure loading state doesn't get stuck
    const timeout = setTimeout(() => {
      console.log('Fallback timeout - setting isLoading to false');
      setIsLoading(false);
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, []);

  // Update times every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (cities && cities.length > 0) {
        const citiesToShow = cities.slice(0, 4);
        const times = citiesToShow.map(city => {
          const now = new Date();
          
          // Simple time formatting without locale issues
          const hours = now.getHours();
          const minutes = now.getMinutes().toString().padStart(2, '0');
          const period = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours % 12 || 12; // Convert to 12-hour format
          
          return {
            name: city.name,
            country: city.country,
            timezone: city.timezone,
            offset: city.offset,
            currentTime: now,
            formattedTime: `${displayHours}:${minutes}`,
            formattedDate: now.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            }),
            period: period
          };
        });
        setCityTimes(times);
        setDisplayCities(times);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [cities]);

  // Temporary bypass loading state for testing
  if (isLoading && false) { // Set to false to bypass loading
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading cities: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Debug: Show cities count - if no cities, use sample data for testing
  if (!cities || cities.length === 0) {
    // Use sample data for testing
    const sampleCities = [
      {
        name: "New York",
        country: "United States",
        timezone: "America/New_York",
        offset: -300,
        currentTime: new Date(),
        formattedTime: "12:00",
        formattedDate: new Date().toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        period: "PM"
      },
      {
        name: "London",
        country: "United Kingdom",
        timezone: "Europe/London",
        offset: 0,
        currentTime: new Date(),
        formattedTime: "5:00",
        formattedDate: new Date().toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        period: "PM"
      },
      {
        name: "Tokyo",
        country: "Japan",
        timezone: "Asia/Tokyo",
        offset: 540,
        currentTime: new Date(),
        formattedTime: "1:00",
        formattedDate: new Date().toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        period: "AM"
      },
      {
        name: "Dubai",
        country: "United Arab Emirates",
        timezone: "Asia/Dubai",
        offset: 240,
        currentTime: new Date(),
        formattedTime: "8:00",
        formattedDate: new Date().toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        period: "PM"
      }
    ];
    
    // Update the display with sample data
    if (displayCities.length === 0) {
      setDisplayCities(sampleCities);
    }
    
    // Continue with rendering using sample data
    console.log('Using sample cities for display');
  }

  return (
    <div className="flex flex-col bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#f8f9fa]">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gray-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gray-300 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gray-300 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 w-full">
          <div className="text-center mb-16 mt-20">
            {/* Hero Title */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              <span className="text-gray-900">Master Time</span> <span className="text-gray-600">Across Zon<span className="text-orange-500">o</span>es</span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              Convert time zones, calculate differences, plan meetings, and get AI-powered time insights - all in one place
            </p>
          </div>

          {/* Hero CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button 
              size="lg"
              className="bg-black hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 text-lg border-2 border-transparent hover:border-orange-500"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-gray-300 hover:border-orange-400 text-gray-700 hover:text-orange-600 font-semibold px-8 py-3 rounded-xl transition-all duration-300 hover:shadow-lg text-lg"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Schedule Demo
            </Button>
          </div>

          {/* City Time Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {displayCities.map((city, index) => (
              <Card 
                key={`${city.name}-${index}`} 
                className="bg-white border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-gray-400 py-5 relative overflow-hidden group"
              >
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <CardHeader className="text-center pb-3 relative z-10">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-orange-600 font-medium">LIVE</span>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">{city.name}</CardTitle>
                  <div className="text-sm text-gray-500 font-medium">{city.country.replace(/[\u{1F1E6}-\u{1F1FF}]{2}|[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').replace(/\s+/g, ' ').trim()}</div>
                </CardHeader>
                <CardContent className="text-center pt-0 relative z-10">
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
                    {city.formattedTime}
                    <span className="text-lg md:text-xl text-gray-500 ml-1 font-normal">{city.period}</span>
                  </div>
                  <div className="text-sm text-gray-600 flex items-center justify-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{city.formattedDate}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feature Description */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-gray-100 px-6 py-3 rounded-full border border-gray-200">
              <Clock className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">
                Live updates across {cities?.length || 0}+ cities worldwide
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Powerful Features for Global Teams
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage time zones and collaborate effectively across the globe
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Globe,
                title: "Timezone Conversion",
                description: "Convert time between any cities instantly with automatic daylight saving adjustments"
              },
              {
                icon: Users,
                title: "Team Collaboration",
                description: "Create teams, invite members, and coordinate schedules across different time zones"
              },
              {
                icon: Zap,
                title: "Real-Time Updates",
                description: "Live time updates and instant synchronization across all your devices"
              },
              {
                icon: Shield,
                title: "Secure Access",
                description: "Enterprise-grade security with role-based access control and data encryption"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full bg-gradient-to-br from-gray-50 to-white border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AdSense Placeholder */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <AdSensePlaceholder size="banner" />
          </motion.div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              See TimeZone in Action
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our intuitive interface designed for seamless time zone management
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "World Clock Dashboard",
                description: "Monitor multiple time zones at a glance"
              },
              {
                title: "Meeting Scheduler",
                description: "Plan meetings across different time zones"
              },
              {
                title: "Team Management",
                description: "Collaborate with global team members"
              }
            ].map((screenshot, index) => (
              <motion.div
                key={screenshot.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <Card className="overflow-hidden bg-white border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="aspect-video bg-gradient-to-br from-orange-50 to-orange-100 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Smartphone className="w-16 h-16 text-orange-400 mx-auto mb-2" />
                        <div className="text-orange-600 font-medium">{screenshot.title}</div>
                        <div className="text-orange-500 text-sm mt-1">{screenshot.description}</div>
                      </div>
                    </div>
                    {/* Mock screenshot overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-5"></div>
                    <div className="absolute top-4 left-4 w-8 h-8 bg-white rounded-full shadow-sm"></div>
                    <div className="absolute top-4 right-4 w-16 h-1 bg-white rounded-full shadow-sm"></div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {screenshot.title}
                    </h3>
                    <p className="text-gray-600">
                      {screenshot.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Master Time Across Zones?
            </h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join thousands of teams who are already using TimeZone to collaborate seamlessly across the globe. Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="group">
                <Button 
                  size="lg" 
                  className="bg-white text-orange-600 hover:bg-orange-50 font-semibold px-8 py-4 text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-orange-200"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </div>
              <div className="group">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="bg-transparent border-white text-white hover:bg-white hover:text-orange-600 font-semibold px-8 py-4 text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm"
                >
                  <Calendar className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-12" />
                  Schedule Demo
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        {/* AdSense Placeholder */}
        <div className="border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <AdSensePlaceholder size="banner" />
            </motion.div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Branding Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="lg:col-span-1"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">TZ</span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Time<span className="text-orange-500">Zone</span>
                </h3>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                TimeZone helps teams and individuals master global scheduling with real-time updates and collaboration tools.
              </p>
            </motion.div>

            {/* Quick Links Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
              <nav className="space-y-3">
                {[
                  { name: 'Home', href: '#' },
                  { name: 'Features', href: '#features' },
                  { name: 'Teams', href: '/teams' },
                  { name: 'About', href: '/about' },
                  { name: 'Pricing', href: '#' },
                  { name: 'Contact', href: '/contact' }
                ].map((link, index) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="block text-gray-400 hover:text-orange-400 transition-colors duration-300 group flex items-center space-x-2"
                  >
                    <span className="transform transition-transform duration-300 group-hover:translate-x-1">→</span>
                    <span>{link.name}</span>
                  </a>
                ))}
              </nav>
            </motion.div>

            {/* Legal Links Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <h4 className="text-lg font-semibold text-white mb-4">Legal</h4>
              <nav className="space-y-3">
                {[
                  { name: 'Privacy Policy', href: '#' },
                  { name: 'Terms of Service', href: '#' }
                ].map((link, index) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="block text-sm text-gray-500 hover:text-orange-400 transition-colors duration-300 group flex items-center space-x-2"
                  >
                    <span className="transform transition-transform duration-300 group-hover:translate-x-1">→</span>
                    <span>{link.name}</span>
                  </a>
                ))}
              </nav>
            </motion.div>

            {/* Social Media Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <h4 className="text-lg font-semibold text-white mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                {[
                  { name: 'Twitter', icon: '𝕏', href: 'https://twitter.com/timezone', color: 'hover:text-blue-400' },
                  { name: 'LinkedIn', icon: 'in', href: 'https://linkedin.com/company/timezone', color: 'hover:text-blue-600' },
                  { name: 'GitHub', icon: '⚡', href: 'https://github.com/timezone', color: 'hover:text-gray-400' }
                ].map((social, index) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 ${social.color} transition-all duration-300 hover:bg-gray-700 hover:scale-110 group`}
                    title={social.name}
                  >
                    <span className="text-lg font-semibold transition-transform duration-300 group-hover:scale-110">
                      {social.icon}
                    </span>
                  </a>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0"
            >
              <div className="text-sm text-gray-500">
                © 2024 TimeZone. All rights reserved.
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Made with</span>
                <span className="text-orange-500">♥</span>
                <span>by TimeZone Team</span>
              </div>
            </motion.div>
          </div>
        </div>
      </footer>
    </div>
  );
}