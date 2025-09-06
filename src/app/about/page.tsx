import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Globe, Users, Target, Award, Heart } from "lucide-react";

export default function AboutPage() {
  const mission = [
    {
      icon: Globe,
      title: "Global Connectivity",
      description: "Breaking down time zone barriers to connect people across the world"
    },
    {
      icon: Clock,
      title: "Time Efficiency",
      description: "Saving time and reducing confusion in global scheduling"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Enabling seamless collaboration for distributed teams"
    }
  ];

  const stats = [
    { number: "195+", label: "Countries Covered" },
    { number: "24/7", label: "Availability" },
    { number: "1M+", label: "Happy Users" },
    { number: "50+", label: "Time Zones" }
  ];

  return (
    <div className="container mx-auto px-4 pt-24 pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            About TimeZone
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're on a mission to make time zone management effortless for everyone, everywhere.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <Card className="bg-gradient-to-br from-muted/20 to-muted/5 border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-4">Our Mission</CardTitle>
              <CardDescription className="text-lg max-w-2xl mx-auto">
                TimeZone was born from the frustration of coordinating across different time zones. 
                We believe that geographical boundaries should not limit collaboration, and that 
                managing time should be simple, intuitive, and stress-free.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Mission Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {mission.map((item, index) => (
            <Card key={item.title} className="text-center hover:shadow-lg transition-all duration-300 hover:scale-105 border-border bg-card">
              <CardHeader>
                <div className="w-16 h-16 bg-foreground text-background rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8" />
                </div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
                <CardDescription className="text-base">
                  {item.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">By the Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={stat.label} className="text-center hover:shadow-lg transition-all duration-300 border-border bg-card">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-foreground mb-2">{stat.number}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                TimeZone started as a simple solution to a complex problem. Our founders, working across 
                three different continents, struggled daily with scheduling meetings and coordinating deadlines.
              </p>
              <p>
                What began as an internal tool quickly evolved into a comprehensive platform when we realized 
                how many others faced the same challenges. Today, TimeZone serves millions of users worldwide, 
                from freelancers to Fortune 500 companies.
              </p>
              <p>
                We're committed to continuous improvement, adding new features and leveraging AI technology 
                to make time zone management even more intuitive and powerful.
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-6">Our Values</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Target className="w-6 h-6 text-foreground mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Precision</h3>
                  <p className="text-muted-foreground text-sm">Accuracy in every time calculation and conversion</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Award className="w-6 h-6 text-foreground mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Excellence</h3>
                  <p className="text-muted-foreground text-sm">Delivering the best user experience possible</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Heart className="w-6 h-6 text-foreground mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Community</h3>
                  <p className="text-muted-foreground text-sm">Building tools that bring people together</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-muted/30 border-border">
            <CardContent className="pt-8 pb-8">
              <h2 className="text-2xl font-bold mb-4">Join Our Journey</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Be part of the revolution in time zone management. Whether you're a remote worker, 
                a global team, or an international business, TimeZone is here to help you thrive.
              </p>
              <Button className="hover:bg-foreground hover:text-background transition-colors duration-300">
                Get Started Today
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}