import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
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

    const { teamId } = params;

    // Check if user has permission to create invites (OWNER or ADMIN)
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
        { error: "Forbidden - Only OWNER or ADMIN can create invites" },
        { status: 403 }
      );
    }

    // Generate unique invite token
    const token = uuidv4();

    // Set expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create the invite
    const invite = await prisma.teamInvite.create({
      data: {
        teamId,
        token,
        createdBy: session.user.id,
        expiresAt,
        status: "PENDING",
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Return the invite link
    const inviteLink = `/invite/${token}`;

    return NextResponse.json({
      id: invite.id,
      token: invite.token,
      inviteLink,
      team: invite.team,
      createdBy: invite.creator,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
      status: invite.status,
    });

  } catch (error) {
    console.error("Error creating team invite:", error);
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
    const session = await getServerSession(authOptions as any);
    
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
        { error: "Forbidden - Access denied" },
        { status: 403 }
      );
    }

    // Fetch all invites for this team
    const invites = await prisma.teamInvite.findMany({
      where: {
        teamId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        acceptedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        declinedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the response
    const transformedInvites = invites.map(invite => ({
      id: invite.id,
      token: invite.token,
      inviteLink: `/invite/${invite.token}`,
      createdBy: invite.creator,
      acceptedBy: invite.acceptedUser,
      declinedBy: invite.declinedUser,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
      acceptedAt: invite.acceptedAt,
      declinedAt: invite.declinedAt,
      status: invite.status,
    }));

    return NextResponse.json(transformedInvites);

  } catch (error) {
    console.error("Error fetching team invites:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}