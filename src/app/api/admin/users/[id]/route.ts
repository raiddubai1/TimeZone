import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-utils";
import { z } from "zod";
import { UserRole, UpdateUserPayload, UpdateUserResponse, UserManagementError } from "@/types/admin";

// Validation schema for user updates
const updateUserSchema = z.object({
  role: z.enum(["user", "manager", "admin"]).optional(),
  isActive: z.boolean().optional(),
});

// Helper function to serialize user data
function serializeUser(user: any) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    emailVerified: user.emailVerified,
    image: user.image,
  };
}

async function handlePatch(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user has admin role
    const authError = await requireRole(["admin"], request);
    if (authError) {
      return authError;
    }

    const userId = params.id;
    const body = await request.json();

    // Validate input
    const validatedData = updateUserSchema.parse(body);

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      const error: UserManagementError = {
        success: false,
        error: "User not found",
        details: `No user found with ID: ${userId}`,
      };
      return NextResponse.json(error, { status: 404 });
    }

    // Prevent admin from deactivating themselves
    if (validatedData.isActive === false && existingUser.email === "admin@timezone.com") {
      const error: UserManagementError = {
        success: false,
        error: "Cannot deactivate admin user",
        details: "Admin users cannot deactivate their own account",
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        ...(validatedData.role && { role: validatedData.role }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        updatedAt: new Date(),
      },
    });

    const response: UpdateUserResponse = {
      success: true,
      user: serializeUser(updatedUser),
      message: "User updated successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating user:", error);

    if (error instanceof z.ZodError) {
      const errorResponse: UserManagementError = {
        success: false,
        error: "Validation failed",
        details: error.errors.map((e) => e.message).join(", "),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const errorResponse: UserManagementError = {
      success: false,
      error: "Failed to update user",
      details: error instanceof Error ? error.message : "Unknown error",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

async function handleDelete(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user has admin role
    const authError = await requireRole(["admin"], request);
    if (authError) {
      return authError;
    }

    const userId = params.id;

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      const error: UserManagementError = {
        success: false,
        error: "User not found",
        details: `No user found with ID: ${userId}`,
      };
      return NextResponse.json(error, { status: 404 });
    }

    // Prevent admin from deleting themselves
    if (existingUser.email === "admin@timezone.com") {
      const error: UserManagementError = {
        success: false,
        error: "Cannot delete admin user",
        details: "Admin users cannot delete their own account",
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Delete user preferences first (due to foreign key constraint)
    await db.timeZonePreference.deleteMany({
      where: { userId: userId },
    });

    // Delete user
    await db.user.delete({
      where: { id: userId },
    });

    const response = {
      success: true,
      message: "User deleted successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error deleting user:", error);

    const errorResponse: UserManagementError = {
      success: false,
      error: "Failed to delete user",
      details: error instanceof Error ? error.message : "Unknown error",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export { handlePatch as PATCH, handleDelete as DELETE };