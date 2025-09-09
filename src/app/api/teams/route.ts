import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { emitTeamCreated, emitTeamUpdated, emitTeamDeleted } from "@/lib/socket-utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, description } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    // Create the team with the logged-in user as owner
    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        ownerId: session.user.id,
      },
    });

    // Add the logged-in user as a team member with OWNER role
    const teamMember = await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: session.user.id,
        role: "OWNER",
      },
    });

    // Broadcast team creation event via Socket.IO
    emitTeamCreated({
      team: {
        ...team,
        membership: {
          role: teamMember.role,
          joinedAt: teamMember.createdAt,
        },
        owner: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        },
        memberCount: 1,
      },
      members: [session.user.id],
      createdBy: session.user.id,
    });

    // Return the created team with membership info
    const responseTeam = {
      ...team,
      membership: {
        role: teamMember.role,
        joinedAt: teamMember.createdAt,
      },
    };

    return NextResponse.json(responseTeam, { status: 201 });

  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Fetch all teams where the user is a member
    const teams = await prisma.teamMember.findMany({
      where: {
        userId: session.user.id,
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
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the response to include membership info
    const responseTeams = teams.map((membership) => ({
      id: membership.team.id,
      name: membership.team.name,
      description: membership.team.description,
      createdAt: membership.team.createdAt,
      updatedAt: membership.team.updatedAt,
      owner: membership.team.owner,
      memberCount: membership.team.members.length,
      membership: {
        role: membership.role,
        joinedAt: membership.createdAt,
      },
    }));

    return NextResponse.json(responseTeams);

  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}