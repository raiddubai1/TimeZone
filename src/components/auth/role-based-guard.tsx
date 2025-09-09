"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Role = "user" | "manager" | "admin";

interface RoleBasedGuardProps {
  children: React.ReactNode;
  requiredRoles?: Role[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function RoleBasedGuard({
  children,
  requiredRoles = [],
  fallback,
  redirectTo = "/",
}: RoleBasedGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true);
      return;
    }

    // If no session and roles are required, redirect to sign in
    if (!session && requiredRoles.length > 0) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      setIsLoading(false);
      return;
    }

    // If no required roles, user is authorized
    if (requiredRoles.length === 0) {
      setIsAuthorized(true);
      setIsLoading(false);
      return;
    }

    // Check if user has required role
    const userRole = session?.user?.role as Role;
    if (userRole && requiredRoles.includes(userRole)) {
      setIsAuthorized(true);
    } else {
      // User doesn't have required role
      setIsAuthorized(false);
    }

    setIsLoading(false);
  }, [session, status, requiredRoles, redirectTo, router]);

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
    if (fallback) {
      return <>{fallback}</>;
    }

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

// Higher-order component for class components or additional protection
export function withRoleBasedAccess<P extends object>(
  Component: React.ComponentType<P>,
  options: { requiredRoles?: Role[]; redirectTo?: string } = {}
) {
  return function ProtectedComponent(props: P) {
    return (
      <RoleBasedGuard
        requiredRoles={options.requiredRoles}
        redirectTo={options.redirectTo}
      >
        <Component {...props} />
      </RoleBasedGuard>
    );
  };
}