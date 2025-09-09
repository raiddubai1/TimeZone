import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const cities = await db.city.findMany({
      orderBy: [
        { country: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json(cities);
  } catch (error) {
    console.error("Error fetching cities:", error);
    return NextResponse.json(
      { error: "Failed to fetch cities" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, country, timezone, offset } = body;

    // Validate required fields
    if (!name || !country || !timezone || offset === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: name, country, timezone, offset" },
        { status: 400 }
      );
    }

    // Check if city with same name and timezone already exists
    const existingCity = await db.city.findFirst({
      where: {
        AND: [
          { name: name },
          { timezone: timezone }
        ]
      }
    });

    if (existingCity) {
      return NextResponse.json(
        { error: "City with this name and timezone already exists" },
        { status: 409 }
      );
    }

    const city = await db.city.create({
      data: {
        name,
        country,
        timezone,
        offset
      }
    });

    return NextResponse.json(city, { status: 201 });
  } catch (error) {
    console.error("Error creating city:", error);
    return NextResponse.json(
      { error: "Failed to create city" },
      { status: 500 }
    );
  }
}