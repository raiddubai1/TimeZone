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
        { error: "Invite not found or already processed" },
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

    // Update invite status to DECLINED
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: {
        status: "DECLINED",
        declinedBy: session.user.id,
        declinedAt: new Date(),
      },
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Invite declined successfully",
      teamId: invite.teamId,
      teamName: invite.team.name,
      declinedAt: new Date(),
    });

  } catch (error) {
    console.error("Error declining invite:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}