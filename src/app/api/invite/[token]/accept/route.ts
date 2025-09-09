import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions as any);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Find the invite by token
    const invite = await prisma.teamInvite.findFirst({
      where: {
        token,
        status: "PENDING",
      },
      include: {
        team: true,
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found or already used" },
        { status: 404 }
      );
    }

    // Check if invite has expired
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      // Mark as expired
      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      });

      return NextResponse.json(
        { error: "Invite has expired" },
        { status: 404 }
      );
    }

    // Check if user is already a member of the team
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        teamId: invite.teamId,
        userId: session.user.id,
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "You are already a member of this team" },
        { status: 409 }
      );
    }

    // Add user to team as MEMBER
    const teamMember = await prisma.teamMember.create({
      data: {
        teamId: invite.teamId,
        userId: session.user.id,
        role: "MEMBER",
      },
    });

    // Update invite status to ACCEPTED
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: {
        status: "ACCEPTED",
        acceptedBy: session.user.id,
        acceptedAt: new Date(),
      },
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Successfully joined the team",
      teamId: invite.teamId,
      teamName: invite.team.name,
      memberRole: teamMember.role,
      joinedAt: teamMember.createdAt,
    });

  } catch (error) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}