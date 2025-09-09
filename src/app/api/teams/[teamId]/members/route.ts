import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { Server } from "socket.io";

// Get Socket.IO server instance
const getSocketServer = (): Server | null => {
  if (typeof window !== 'undefined') return null;
  
  try {
    // @ts-ignore - Global socket.io server
    return global.io as Server;
  } catch {
    return null;
  }
};

export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const { teamId } = params;
    const body = await request.json();
    const { userId, role = "MEMBER" } = body;

    // Validate required fields
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["MEMBER", "ADMIN"].includes(role.toUpperCase())) {
      return NextResponse.json(
        { error: "Invalid role. Must be MEMBER or ADMIN" },
        { status: 400 }
      );
    }

    // Check if user has permission to add members
    const currentUserMembership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
        role: {
          in: ["OWNER", "ADMIN"],
        },
      },
    });

    if (!currentUserMembership) {
      return NextResponse.json(
        { error: "Forbidden - Only OWNER or ADMIN can add members" },
        { status: 403 }
      );
    }

    // Find the user by ID
    const userToAdd = await prisma.user.findUnique({
      where: { id: userId.trim() },
    });

    if (!userToAdd) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMembership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: userToAdd.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "User is already a member of this team" },
        { status: 400 }
      );
    }

    // Add the member to the team
    const teamMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId: userToAdd.id,
        role: role.toUpperCase(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Get all team members for broadcasting
    const allMembers = await prisma.teamMember.findMany({
      where: { teamId },
      select: { userId: true },
    });

    const memberUserIds = allMembers.map(m => m.userId);

    // Get Socket.IO server and emit event
    const io = getSocketServer();
    if (io) {
      io.emit('member:added', {
        teamId,
        member: teamMember,
        addedBy: session.user.id,
        members: memberUserIds,
      });
    }

    return NextResponse.json(teamMember, { status: 201 });

  } catch (error) {
    console.error("Error adding team member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const { teamId } = params;

    // Check if user is a member of the team
    const currentUserMembership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
      },
    });

    if (!currentUserMembership) {
      return NextResponse.json(
        { error: "You don't have access to this team" },
        { status: 403 }
      );
    }

    // Fetch all team members
    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(members);

  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}