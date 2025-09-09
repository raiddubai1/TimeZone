import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Check if user is authenticated and has admin role
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Fetch last 50 activity logs with user information
    const activityLogs = await db.activityLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // Format the response
    const formattedLogs = activityLogs.map(log => ({
      id: log.id,
      action: log.action,
      description: log.description,
      timestamp: log.createdAt.toISOString(),
      user: log.user ? {
        id: log.user.id,
        name: log.user.name || log.user.email,
        email: log.user.email,
        role: log.user.role
      } : null,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent
    }));

    return NextResponse.json(formattedLogs);
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Check if user is authenticated and has admin role
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, description, userId, metadata, ipAddress, userAgent } = body;

    // Validate required fields
    if (!action || !description) {
      return NextResponse.json(
        { error: "Missing required fields: action, description" },
        { status: 400 }
      );
    }

    // Create new activity log
    const activityLog = await db.activityLog.create({
      data: {
        action,
        description,
        userId,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress,
        userAgent
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Format the response
    const formattedLog = {
      id: activityLog.id,
      action: activityLog.action,
      description: activityLog.description,
      timestamp: activityLog.createdAt.toISOString(),
      user: activityLog.user ? {
        id: activityLog.user.id,
        name: activityLog.user.name || activityLog.user.email,
        email: activityLog.user.email,
        role: activityLog.user.role
      } : null,
      metadata: activityLog.metadata ? JSON.parse(activityLog.metadata) : null,
      ipAddress: activityLog.ipAddress,
      userAgent: activityLog.userAgent
    };

    return NextResponse.json(formattedLog, { status: 201 });
  } catch (error) {
    console.error("Error creating activity log:", error);
    return NextResponse.json(
      { error: "Failed to create activity log" },
      { status: 500 }
    );
  }
}