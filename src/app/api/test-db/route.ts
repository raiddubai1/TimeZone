import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Test database connectivity by fetching all data with relations
    const [cities, preferences, users] = await Promise.all([
      db.city.findMany({
        orderBy: [
          { country: 'asc' },
          { name: 'asc' }
        ]
      }),
      db.timeZonePreference.findMany({
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
      }),
      db.user.findMany({
        select: {
          id: true,
          email: true,
          name: true
        },
        orderBy: {
          id: 'asc'
        }
      })
    ]);

    // Calculate some statistics
    const stats = {
      totalCities: cities.length,
      totalUsers: users.length,
      totalPreferences: preferences.length,
      countriesRepresented: new Set(cities.map(city => city.country)).size,
      timezonesRepresented: new Set(cities.map(city => city.timezone)).size,
      usersWithPreferences: new Set(preferences.map(pref => pref.userId)).size
    };

    return NextResponse.json({
      message: "Database connection successful!",
      stats,
      data: {
        cities,
        users,
        preferences
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Database connection test failed:", error);
    return NextResponse.json(
      { 
        error: "Database connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}