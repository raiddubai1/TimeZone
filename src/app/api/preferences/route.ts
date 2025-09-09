import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-utils";

// Protected GET handler - requires user role
async function protectedGet() {
  try {
    const preferences = await db.timeZonePreference.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        city: {
          select: {
            id: true,
            name: true,
            country: true,
            timezone: true,
            offset: true
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

// Protected POST handler - requires user role
async function protectedPost(request: Request) {
  try {
    const body = await request.json();
    const { userId, cityId } = body;

    // Validate required fields
    if (!userId || !cityId) {
      return NextResponse.json(
        { error: "Missing required fields: userId, cityId" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if city exists
    const city = await db.city.findUnique({
      where: { id: cityId }
    });

    if (!city) {
      return NextResponse.json(
        { error: "City not found" },
        { status: 404 }
      );
    }

    // Check if preference already exists
    const existingPreference = await db.timeZonePreference.findFirst({
      where: {
        AND: [
          { userId: userId },
          { cityId: cityId }
        ]
      }
    });

    if (existingPreference) {
      return NextResponse.json(
        { error: "Preference for this user and city already exists" },
        { status: 409 }
      );
    }

    const preference = await db.timeZonePreference.create({
      data: {
        userId,
        cityId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        city: {
          select: {
            id: true,
            name: true,
            country: true,
            timezone: true,
            offset: true
          }
        }
      }
    });

    return NextResponse.json(preference, { status: 201 });
  } catch (error) {
    console.error("Error creating preference:", error);
    return NextResponse.json(
      { error: "Failed to create preference" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Check if user has required role (user, manager, or admin)
  const authError = await requireRole(['user', 'manager', 'admin'], request);
  if (authError) {
    return authError;
  }
  
  return protectedGet();
}

export async function POST(request: NextRequest) {
  // Check if user has required role (user, manager, or admin)
  const authError = await requireRole(['user', 'manager', 'admin'], request);
  if (authError) {
    return authError;
  }
  
  return protectedPost(request);
}