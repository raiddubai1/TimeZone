import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { emitTeamUpdated, emitTeamDeleted } from "@/lib/socket-utils";
import { NextRequest, NextResponse } from "next/server";

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

    // Fetch team details with members
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
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
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found or access denied" },
        { status: 404 }
      );
    }

    // Get the current user's role in this team
    const currentUserMembership = team.members.find(
      (member) => member.userId === session.user.id
    );

    // Transform the response to match requirements
    const responseTeam = {
      id: team.id,
      name: team.name,
      description: team.description,
      createdAt: team.createdAt,
      owner: team.owner,
      members: team.members.map(member => ({
        id: member.id,
        userId: member.user.id,
        user: member.user,
        role: member.role,
        joinedAt: member.createdAt,
      })),
      currentUserRole: currentUserMembership?.role,
    };

    return NextResponse.json(responseTeam);

  } catch (error) {
    console.error("Error fetching team details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const { name, description } = body;

    // Validate input
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return NextResponse.json(
        { error: "Team name must be a non-empty string" },
        { status: 400 }
      );
    }

    if (description !== undefined && typeof description !== 'string' && description !== null) {
      return NextResponse.json(
        { error: "Team description must be a string or null" },
        { status: 400 }
      );
    }

    // Check if user has permission to update the team
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
        { error: "Forbidden - Only OWNER or ADMIN can update team" },
        { status: 403 }
      );
    }

    // Update the team
    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
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
        },
      },
    });

    // Get all team members for broadcasting
    const allMembers = await prisma.teamMember.findMany({
      where: { teamId },
      select: { userId: true },
    });

    const memberUserIds = allMembers.map(m => m.userId);

    // Broadcast team update event via Socket.IO
    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description ? description.trim() : null;

    emitTeamUpdated({
      teamId,
      updates,
      members: memberUserIds,
      updatedBy: session.user.id,
    });

    // Transform the response to match requirements
    const responseTeam = {
      id: updatedTeam.id,
      name: updatedTeam.name,
      description: updatedTeam.description,
      createdAt: updatedTeam.createdAt,
      updatedAt: updatedTeam.updatedAt,
      owner: updatedTeam.owner,
      members: updatedTeam.members.map(member => ({
        id: member.id,
        userId: member.user.id,
        user: member.user,
        role: member.role,
        joinedAt: member.createdAt,
      })),
      currentUserRole: currentUserMembership.role,
    };

    return NextResponse.json(responseTeam);

  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check if user is the owner
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        ownerId: session.user.id,
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found or access denied" },
        { status: 404 }
      );
    }

    // Get all team members before deletion for broadcasting
    const allMembers = await prisma.teamMember.findMany({
      where: { teamId },
      select: { userId: true },
    });

    const memberUserIds = allMembers.map(m => m.userId);

    // Delete all team members first (due to foreign key constraint)
    await prisma.teamMember.deleteMany({
      where: { teamId: teamId },
    });

    // Delete the team
    await prisma.team.delete({
      where: { id: teamId },
    });

    // Broadcast team deletion event via Socket.IO
    emitTeamDeleted({
      teamId,
      members: memberUserIds,
      deletedBy: session.user.id,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}