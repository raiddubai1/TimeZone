import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cityId = parseInt(params.id);

    if (isNaN(cityId)) {
      return NextResponse.json(
        { error: "Invalid city ID" },
        { status: 400 }
      );
    }

    const city = await db.city.findUnique({
      where: { id: cityId },
      include: {
        users: {
          include: {
            user: true
          }
        }
      }
    });

    if (!city) {
      return NextResponse.json(
        { error: "City not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(city);
  } catch (error) {
    console.error("Error fetching city:", error);
    return NextResponse.json(
      { error: "Failed to fetch city" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cityId = parseInt(params.id);

    if (isNaN(cityId)) {
      return NextResponse.json(
        { error: "Invalid city ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, country, timezone, offset } = body;

    // Check if city exists
    const existingCity = await db.city.findUnique({
      where: { id: cityId }
    });

    if (!existingCity) {
      return NextResponse.json(
        { error: "City not found" },
        { status: 404 }
      );
    }

    // Check if another city with same name and timezone already exists
    if (name && timezone) {
      const duplicateCity = await db.city.findFirst({
        where: {
          AND: [
            { name: name },
            { timezone: timezone },
            { id: { not: cityId } }
          ]
        }
      });

      if (duplicateCity) {
        return NextResponse.json(
          { error: "City with this name and timezone already exists" },
          { status: 409 }
        );
      }
    }

    const updatedCity = await db.city.update({
      where: { id: cityId },
      data: {
        ...(name && { name }),
        ...(country && { country }),
        ...(timezone && { timezone }),
        ...(offset !== undefined && { offset })
      }
    });

    return NextResponse.json(updatedCity);
  } catch (error) {
    console.error("Error updating city:", error);
    return NextResponse.json(
      { error: "Failed to update city" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cityId = parseInt(params.id);

    if (isNaN(cityId)) {
      return NextResponse.json(
        { error: "Invalid city ID" },
        { status: 400 }
      );
    }

    // Check if city exists
    const existingCity = await db.city.findUnique({
      where: { id: cityId }
    });

    if (!existingCity) {
      return NextResponse.json(
        { error: "City not found" },
        { status: 404 }
      );
    }

    // Delete associated preferences first
    await db.timeZonePreference.deleteMany({
      where: { cityId: cityId }
    });

    // Delete the city
    await db.city.delete({
      where: { id: cityId }
    });

    return NextResponse.json({ 
      message: "City deleted successfully",
      deletedCityId: cityId 
    });
  } catch (error) {
    console.error("Error deleting city:", error);
    return NextResponse.json(
      { error: "Failed to delete city" },
      { status: 500 }
    );
  }
}