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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { teamId: string; memberId: string } }
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

    const { teamId, memberId } = params;
    const body = await request.json();
    const { role } = body;

    // Validate role
    if (!role || !["OWNER", "ADMIN", "MEMBER"].includes(role.toUpperCase())) {
      return NextResponse.json(
        { error: "Invalid role. Must be OWNER, ADMIN, or MEMBER" },
        { status: 400 }
      );
    }

    // Check if user has permission to update member roles
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
        { error: "Forbidden - Only OWNER or ADMIN can update roles" },
        { status: 403 }
      );
    }

    // Find the member to update
    const memberToUpdate = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: {
        user: true,
      },
    });

    if (!memberToUpdate || memberToUpdate.teamId !== teamId) {
      return NextResponse.json(
        { error: "Member not found in this team" },
        { status: 404 }
      );
    }

    // Prevent users from changing their own role
    if (memberToUpdate.userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    // Cannot demote OWNER (only owners can change owner roles)
    if (memberToUpdate.role === "OWNER") {
      return NextResponse.json(
        { error: "Cannot demote OWNER" },
        { status: 403 }
      );
    }

    // Only owners can promote to OWNER
    if (role.toUpperCase() === "OWNER" && currentUserMembership.role !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden - Only OWNER can promote to OWNER" },
        { status: 403 }
      );
    }

    // Update the member's role
    const updatedMember = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role: role.toUpperCase() },
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
      io.emit('member:roleUpdated', {
        teamId,
        memberId,
        newRole: role.toUpperCase(),
        updatedBy: session.user.id,
        members: memberUserIds,
      });
    }

    return NextResponse.json(updatedMember);

  } catch (error) {
    console.error("Error updating team member role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string; memberId: string } }
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

    const { teamId, memberId } = params;

    // Find the member to remove
    const memberToRemove = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: {
        user: true,
      },
    });

    if (!memberToRemove || memberToRemove.teamId !== teamId) {
      return NextResponse.json(
        { error: "Member not found in this team" },
        { status: 404 }
      );
    }

    // Check if user has permission to remove members
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

    // Check permissions:
    // 1. Users can remove themselves (leave team)
    // 2. OWNER or ADMIN can remove other members
    // 3. Only OWNER can remove other OWNERS
    const isRemovingSelf = memberToRemove.userId === session.user.id;
    const hasAdminPermission = currentUserMembership.role === "OWNER" || currentUserMembership.role === "ADMIN";
    const isOwner = currentUserMembership.role === "OWNER";
    const isTargetOwner = memberToRemove.role === "OWNER";

    if (!isRemovingSelf && !hasAdminPermission) {
      return NextResponse.json(
        { error: "Forbidden - Only OWNER or ADMIN can remove other members" },
        { status: 403 }
      );
    }

    if (!isRemovingSelf && isTargetOwner && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden - Only OWNER can remove other OWNERS" },
        { status: 403 }
      );
    }

    // Prevent removing the last owner
    if (isTargetOwner) {
      const ownerCount = await prisma.teamMember.count({
        where: {
          teamId,
          role: "OWNER",
        },
      });

      if (ownerCount === 1) {
        return NextResponse.json(
          { error: "Cannot remove the last owner of the team" },
          { status: 400 }
        );
      }
    }

    // Get all team members before removal for broadcasting (excluding the one being removed)
    const allMembers = await prisma.teamMember.findMany({
      where: { teamId },
      select: { userId: true },
    });

    const remainingMemberUserIds = allMembers
      .filter(m => m.userId !== memberToRemove.userId)
      .map(m => m.userId);

    // Remove the member
    await prisma.teamMember.delete({
      where: { id: memberId },
    });

    // Get Socket.IO server and emit event
    const io = getSocketServer();
    if (io) {
      io.emit('member:removed', {
        teamId,
        memberId,
        removedBy: session.user.id,
        members: remainingMemberUserIds,
        isSelfRemoval: isRemovingSelf,
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}