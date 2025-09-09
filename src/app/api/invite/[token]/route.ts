import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
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
        team: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            members: {
              select: {
                id: true,
                userId: true,
                role: true,
                createdAt: true,
              },
            },
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

    // Return team info
    return NextResponse.json({
      id: invite.id,
      token: invite.token,
      team: {
        id: invite.team.id,
        name: invite.team.name,
        description: invite.team.description,
        owner: invite.team.owner,
        memberCount: invite.team.members.length,
        createdAt: invite.team.createdAt,
      },
      createdBy: invite.creator,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
    });

  } catch (error) {
    console.error("Error fetching invite:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}