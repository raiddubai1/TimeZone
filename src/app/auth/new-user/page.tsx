"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, User, Clock, Globe, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewUserPage() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const handleGetStarted = () => {
    setIsRedirecting(true);
    setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to sign in
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Welcome Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Welcome to TimeZone!
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Hi {session.user?.name || session.user?.email}! Your account has been created successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {session.user?.name || "New User"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {session.user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Features Overview */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 text-center">
                What can you do with TimeZone?
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900 mb-1">Time Zone Converter</h4>
                  <p className="text-sm text-gray-500">Convert times between different time zones instantly</p>
                </div>
                
                <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                  <Globe className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900 mb-1">World Clock</h4>
                  <p className="text-sm text-gray-500">Track multiple time zones with live updates</p>
                </div>
                
                <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                  <User className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900 mb-1">Meeting Scheduler</h4>
                  <p className="text-sm text-gray-500">Plan meetings across different time zones</p>
                </div>
              </div>
            </div>

            {/* Getting Started */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="font-medium text-blue-900 mb-3">Getting Started:</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <p>• Browse your dashboard to see current times in major cities</p>
                <p>• Set up your preferred cities for quick access</p>
                <p>• Use the meeting scheduler to plan cross-timezone meetings</p>
                <p>• Explore our calculators for time differences and working hours</p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center space-y-4">
              <Button
                onClick={handleGetStarted}
                disabled={isRedirecting}
                size="lg"
                className="w-full md:w-auto"
              >
                {isRedirecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting Started...
                  </>
                ) : (
                  <>
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
              
              <div className="text-sm text-gray-500">
                <p>
                  Need help? Check out our{" "}
                  <Link href="/help" className="text-blue-600 hover:text-blue-500">
                    Help Center
                  </Link>{" "}
                  or{" "}
                  <Link href="/contact" className="text-blue-600 hover:text-blue-500">
                    Contact Support
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <div className="text-center">
          <div className="text-2xl font-bold">
            <span className="text-gray-900">Time</span>
            <span className="text-orange-500">Zone</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Effortless time zone management
          </p>
        </div>
      </div>
    </div>
  );
}