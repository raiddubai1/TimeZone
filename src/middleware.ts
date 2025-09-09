import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Define protected routes and their required roles
  const protectedRoutes = {
    "/admin-dashboard": ["admin"],
    "/manager-dashboard": ["manager", "admin"],
    "/preferences": ["user", "manager", "admin"],
    "/scheduler": ["user", "manager", "admin"],
    "/ai-assistant": ["user", "manager", "admin"],
  };

  // Check if the current path is a protected route
  const protectedPath = Object.keys(protectedRoutes).find((route) =>
    pathname.startsWith(route)
  );

  if (protectedPath) {
    const requiredRoles = protectedRoutes[protectedPath as keyof typeof protectedRoutes];

    // If no token, redirect to sign in
    if (!token) {
      const url = new URL("/auth/signin", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    // Check if user has required role
    const userRole = token.role as string;
    if (!requiredRoles.includes(userRole)) {
      // User doesn't have required role, redirect to home
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Handle auth routes for authenticated users
  if (pathname.startsWith("/auth/") && token) {
    // If user is already authenticated, redirect to appropriate dashboard
    const userRole = token.role as string;
    let redirectUrl = "/";
    
    if (userRole === "admin") {
      redirectUrl = "/admin-dashboard";
    } else if (userRole === "manager") {
      redirectUrl = "/manager-dashboard";
    }

    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};