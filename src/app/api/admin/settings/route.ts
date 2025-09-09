import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for validating settings updates
const settingsUpdateSchema = z.object({
  defaultTimezone: z.string().optional(),
  enableNotifications: z.boolean().optional(),
  enableEmailNotifications: z.boolean().optional(),
  enableRealTimeUpdates: z.boolean().optional(),
  maxCitiesPerUser: z.number().min(1).max(50).optional(),
  meetingDurationMinutes: z.number().min(15).max(480).optional(),
  enableAIAssistant: z.boolean().optional(),
  enableAnalytics: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  customBranding: z.string().optional(),
});

// GET /api/admin/settings - Fetch current settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and has admin role
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Get the current settings (there should only be one record)
    let settings = await db.systemSettings.findFirst();
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = await db.systemSettings.create({
        data: {
          defaultTimezone: "UTC",
          enableNotifications: true,
          enableEmailNotifications: true,
          enableRealTimeUpdates: true,
          maxCitiesPerUser: 10,
          meetingDurationMinutes: 60,
          enableAIAssistant: true,
          enableAnalytics: true,
          maintenanceMode: false,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching admin settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/settings - Update settings
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and has admin role
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate the input
    const validatedData = settingsUpdateSchema.parse(body);

    // Get current settings
    let settings = await db.systemSettings.findFirst();
    
    if (!settings) {
      // If no settings exist, create new ones with the provided data
      settings = await db.systemSettings.create({
        data: {
          defaultTimezone: validatedData.defaultTimezone || "UTC",
          enableNotifications: validatedData.enableNotifications ?? true,
          enableEmailNotifications: validatedData.enableEmailNotifications ?? true,
          enableRealTimeUpdates: validatedData.enableRealTimeUpdates ?? true,
          maxCitiesPerUser: validatedData.maxCitiesPerUser ?? 10,
          meetingDurationMinutes: validatedData.meetingDurationMinutes ?? 60,
          enableAIAssistant: validatedData.enableAIAssistant ?? true,
          enableAnalytics: validatedData.enableAnalytics ?? true,
          maintenanceMode: validatedData.maintenanceMode ?? false,
          customBranding: validatedData.customBranding,
        },
      });
    } else {
      // Update existing settings
      settings = await db.systemSettings.update({
        where: { id: settings.id },
        data: validatedData,
      });
    }

    // Log the activity
    await db.activityLog.create({
      data: {
        action: "settings_updated",
        description: "System settings updated by admin",
        userId: session.user.id,
        metadata: JSON.stringify({
          updatedFields: Object.keys(validatedData),
          settings: validatedData,
        }),
      },
    });

    return NextResponse.json({
      message: "Settings updated successfully",
      settings,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating admin settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}