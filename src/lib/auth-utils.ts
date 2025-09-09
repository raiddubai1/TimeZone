import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Re-export authOptions for easy import
export { authOptions };

/**
 * Check if the current user has the required role
 * @param requiredRoles Array of roles that are allowed access
 * @param request The NextRequest object
 * @returns NextResponse with error if unauthorized, null if authorized
 */
export async function requireRole(
  requiredRoles: string[],
  request: NextRequest
): Promise<NextResponse | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userRole = session.user.role;
    
    if (!userRole || !requiredRoles.includes(userRole)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    return null; // Authorized
  } catch (error) {
    console.error("Role check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Middleware to protect API routes with role-based access
 * @param handler The original route handler
 * @param requiredRoles Array of roles that are allowed access
 */
export function withRoleProtection(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  requiredRoles: string[]
) {
  return async (request: NextRequest, context?: any) => {
    const authError = await requireRole(requiredRoles, request);
    if (authError) {
      return authError;
    }
    return handler(request, context);
  };
}

/**
 * Get current user role from session
 */
export async function getCurrentUserRole(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    return session?.user?.role || null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
}

/**
 * Check if current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === "admin";
}

/**
 * Check if current user is a manager or admin
 */
export async function isManagerOrAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === "manager" || role === "admin";
}