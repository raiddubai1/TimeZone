import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const preferenceId = parseInt(params.id);

    if (isNaN(preferenceId)) {
      return NextResponse.json(
        { error: "Invalid preference ID" },
        { status: 400 }
      );
    }

    const preference = await db.timeZonePreference.findUnique({
      where: { id: preferenceId },
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

    if (!preference) {
      return NextResponse.json(
        { error: "Preference not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(preference);
  } catch (error) {
    console.error("Error fetching preference:", error);
    return NextResponse.json(
      { error: "Failed to fetch preference" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const preferenceId = parseInt(params.id);

    if (isNaN(preferenceId)) {
      return NextResponse.json(
        { error: "Invalid preference ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { userId, cityId } = body;

    // Check if preference exists
    const existingPreference = await db.timeZonePreference.findUnique({
      where: { id: preferenceId }
    });

    if (!existingPreference) {
      return NextResponse.json(
        { error: "Preference not found" },
        { status: 404 }
      );
    }

    // Validate new userId if provided
    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
    }

    // Validate new cityId if provided
    if (cityId) {
      const city = await db.city.findUnique({
        where: { id: cityId }
      });

      if (!city) {
        return NextResponse.json(
          { error: "City not found" },
          { status: 404 }
        );
      }
    }

    // Check if another preference with same userId and cityId already exists
    if (userId && cityId) {
      const duplicatePreference = await db.timeZonePreference.findFirst({
        where: {
          AND: [
            { userId: userId },
            { cityId: cityId },
            { id: { not: preferenceId } }
          ]
        }
      });

      if (duplicatePreference) {
        return NextResponse.json(
          { error: "Preference for this user and city already exists" },
          { status: 409 }
        );
      }
    }

    const updatedPreference = await db.timeZonePreference.update({
      where: { id: preferenceId },
      data: {
        ...(userId && { userId }),
        ...(cityId && { cityId })
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

    return NextResponse.json(updatedPreference);
  } catch (error) {
    console.error("Error updating preference:", error);
    return NextResponse.json(
      { error: "Failed to update preference" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const preferenceId = parseInt(params.id);

    if (isNaN(preferenceId)) {
      return NextResponse.json(
        { error: "Invalid preference ID" },
        { status: 400 }
      );
    }

    // Check if preference exists
    const existingPreference = await db.timeZonePreference.findUnique({
      where: { id: preferenceId }
    });

    if (!existingPreference) {
      return NextResponse.json(
        { error: "Preference not found" },
        { status: 404 }
      );
    }

    // Delete the preference
    await db.timeZonePreference.delete({
      where: { id: preferenceId }
    });

    return NextResponse.json({ 
      message: "Preference deleted successfully",
      deletedPreferenceId: preferenceId 
    });
  } catch (error) {
    console.error("Error deleting preference:", error);
    return NextResponse.json(
      { error: "Failed to delete preference" },
      { status: 500 }
    );
  }
}