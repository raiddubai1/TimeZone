"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Role = "user" | "manager" | "admin";

interface RequireRoleProps {
  children: React.ReactNode;
  roles: Role[];
  redirectTo?: string;
}

export default function RequireRole({ children, roles, redirectTo = "/" }: RequireRoleProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true);
      return;
    }

    // If no session, redirect to sign in
    if (!session) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      setIsLoading(false);
      return;
    }

    // Check if user has required role
    const userRole = session?.user?.role as Role;
    if (userRole && roles.includes(userRole)) {
      setIsAuthorized(true);
    } else {
      // User doesn't have required role, redirect
      router.push(redirectTo);
    }

    setIsLoading(false);
  }, [session, status, roles, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have the required permissions to access this page.
            {session?.user?.role && (
              <span className="block mt-2 text-sm">
                Your role: <span className="font-medium">{session.user.role}</span>
              </span>
            )}
          </p>
          <Button onClick={() => router.push(redirectTo)}>
            Go Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}