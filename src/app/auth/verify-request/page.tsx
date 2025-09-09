"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function VerifyRequestPage() {
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  
  const router = useRouter();
  const { data: session } = useSession();

  // Redirect if already authenticated
  useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  // Get email from localStorage (set during sign in)
  useEffect(() => {
    const storedEmail = localStorage.getItem("signin-email");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleResend = async () => {
    if (!email) return;
    
    setIsResending(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/signin/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage("Magic link resent successfully!");
        setMessageType("success");
      } else {
        setMessage("Failed to resend magic link. Please try again.");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
      setMessageType("error");
    } finally {
      setIsResending(false);
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

        {/* Verify Request Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Check your email
            </CardTitle>
            <CardDescription className="text-gray-600">
              We've sent you a magic link to sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Display */}
            {email && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Magic link sent to:</p>
                <p className="font-medium text-gray-900">{email}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-700 font-medium">Check your inbox</p>
                  <p className="text-sm text-gray-500">Look for an email from TimeZone</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-700 font-medium">Click the magic link</p>
                  <p className="text-sm text-gray-500">The link will sign you in automatically</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-700 font-medium">No password needed</p>
                  <p className="text-sm text-gray-500">Just click the link to access your account</p>
                </div>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                messageType === "success" 
                  ? "bg-green-50 text-green-700 border border-green-200" 
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {message}
              </div>
            )}

            {/* Resend Button */}
            <div className="space-y-3">
              <Button
                onClick={handleResend}
                disabled={isResending || !email}
                variant="outline"
                className="w-full"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resending...
                  </>
                ) : (
                  "Resend magic link"
                )}
              </Button>
              
              <p className="text-xs text-gray-500 text-center">
                Didn't receive the email? Check your spam folder or try resending.
              </p>
            </div>

            {/* Help */}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <strong>Having trouble?</strong> Make sure you're using the correct email address. 
                If you still don't receive the email, contact support.
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