"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  RefreshCw, 
  ArrowLeft, 
  Mail, 
  Shield, 
  Settings, 
  Lock,
  Wifi,
  Clock
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorInfo = (errorCode: string) => {
    switch (errorCode) {
      case "Configuration":
        return {
          icon: Settings,
          title: "Configuration Error",
          description: "There is a problem with the server configuration.",
          details: "The authentication service is not properly configured. Please contact the administrator.",
          action: "Try again later",
          color: "red"
        };

      case "AccessDenied":
        return {
          icon: Shield,
          title: "Access Denied",
          description: "You do not have permission to access this resource.",
          details: "Your account may not have the required permissions, or the resource may be restricted.",
          action: "Contact administrator",
          color: "red"
        };

      case "Verification":
        return {
          icon: Clock,
          title: "Verification Error",
          description: "The verification link has expired or is invalid.",
          details: "Magic links expire after a certain time for security reasons. Please request a new one.",
          action: "Request new link",
          color: "yellow"
        };

      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
        return {
          icon: Shield,
          title: "OAuth Authentication Error",
          description: "There was a problem with the OAuth authentication process.",
          details: "The third-party authentication service may be experiencing issues, or the connection may have been interrupted.",
          action: "Try again",
          color: "yellow"
        };

      case "EmailCreateAccount":
        return {
          icon: Mail,
          title: "Account Creation Error",
          description: "Could not create your email account.",
          details: "There may be an issue with your email address or the account creation process.",
          action: "Try with different email",
          color: "yellow"
        };

      case "Callback":
        return {
          icon: RefreshCw,
          title: "Callback Error",
          description: "There was an error during the authentication callback.",
          details: "The authentication process was interrupted. Please try signing in again.",
          action: "Try signing in again",
          color: "yellow"
        };

      case "OAuthAccountNotLinked":
        return {
          icon: AlertTriangle,
          title: "Account Not Linked",
          description: "This email is already associated with another account.",
          details: "The email address you're trying to use is already linked to a different authentication method.",
          action: "Sign in with existing method",
          color: "yellow"
        };

      case "SessionRequired":
        return {
          icon: Lock,
          title: "Authentication Required",
          description: "You must be signed in to access this resource.",
          details: "This page or action requires you to be authenticated. Please sign in to continue.",
          action: "Sign in",
          color: "blue"
        };

      case "Default":
      default:
        return {
          icon: AlertTriangle,
          title: "Authentication Error",
          description: "An unknown error occurred during authentication.",
          details: "Something went wrong while trying to authenticate you. Please try again.",
          action: "Try again",
          color: "red"
        };
    }
  };

  const errorInfo = error ? getErrorInfo(error) : null;

  const getIconColor = (color: string) => {
    switch (color) {
      case "red": return "text-red-600";
      case "yellow": return "text-yellow-600";
      case "blue": return "text-blue-600";
      default: return "text-gray-600";
    }
  };

  const getAlertColor = (color: string) => {
    switch (color) {
      case "red": return "destructive";
      case "yellow": return "default";
      case "blue": return "default";
      default: return "default";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Back to Sign In Link */}
        <div className="text-center">
          <Link 
            href="/auth/signin" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Link>
        </div>

        {/* Error Card */}
        <Card>
          <CardHeader className="text-center">
            {errorInfo ? (
              <>
                <div className={`mx-auto w-16 h-16 bg-${errorInfo.color === "red" ? "red" : errorInfo.color === "yellow" ? "yellow" : "blue"}-100 rounded-full flex items-center justify-center mb-4`}>
                  <errorInfo.icon className={`w-8 h-8 ${getIconColor(errorInfo.color)}`} />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {errorInfo.title}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {errorInfo.description}
                </CardDescription>
              </>
            ) : (
              <>
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-gray-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Unknown Error
                </CardTitle>
                <CardDescription className="text-gray-600">
                  An unknown error occurred during authentication
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Details */}
            {errorInfo && (
              <Alert variant={getAlertColor(errorInfo.color)}>
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">{errorInfo.details}</p>
                    {error && (
                      <p className="text-xs opacity-75">Error code: {error}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Technical Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Troubleshooting Steps:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Check your internet connection</li>
                <li>• Clear your browser cache and cookies</li>
                <li>• Make sure you're using the correct email address</li>
                <li>• Try signing in with an incognito/private window</li>
                <li>• If the problem persists, contact support</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/auth/signin">
                  {errorInfo?.action || "Try Again"}
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  Return to Home
                </Link>
              </Button>
            </div>

            {/* Help */}
            <div className="text-center text-sm text-gray-500">
              <p>
                Still having trouble?{" "}
                <Link href="/contact" className="text-blue-600 hover:text-blue-500">
                  Contact Support
                </Link>
              </p>
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

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}