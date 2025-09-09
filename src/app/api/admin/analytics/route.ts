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

    // Get user statistics
    const totalUsers = await db.user.count();
    const adminUsers = await db.user.count({ where: { role: "admin" } });
    const managerUsers = await db.user.count({ where: { role: "manager" } });
    const regularUsers = await db.user.count({ where: { role: "user" } });
    
    // Calculate active users (users with preferences or recent activity)
    const activeUsers = await db.user.count({
      where: {
        OR: [
          {
            preferences: {
              some: {}
            }
          },
          {
            // Consider users created in the last 30 days as active
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        ]
      }
    });

    // Get meeting statistics
    const totalMeetings = await db.meeting.count();
    
    // Get meetings per week for the last 8 weeks
    const eightWeeksAgo = new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000);
    const meetings = await db.meeting.findMany({
      where: {
        createdAt: {
          gte: eightWeeksAgo
        }
      },
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Group meetings by week
    const meetingsPerWeek: { [key: string]: number } = {};
    meetings.forEach(meeting => {
      const weekStart = new Date(meeting.createdAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];
      meetingsPerWeek[weekKey] = (meetingsPerWeek[weekKey] || 0) + 1;
    });

    // Generate week labels for the last 8 weeks
    const weeklyMeetingData = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      weeklyMeetingData.push({
        week: `Week ${8 - i}`,
        startDate: weekStart.toLocaleDateString(),
        endDate: weekEnd.toLocaleDateString(),
        meetings: meetingsPerWeek[weekKey] || 0
      });
    }

    // Get recent activity (last 10 actions)
    // Since we don't have an activity log table, we'll use recent user creations and meetings as activity
    const recentUsers = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    const recentMeetings = await db.meeting.findMany({
      select: {
        id: true,
        date: true,
        startTime: true,
        cities: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Combine and format recent activity
    const recentActivity = [
      ...recentUsers.map(user => ({
        id: `user-${user.id}`,
        type: 'user_created',
        description: `New ${user.role} user created: ${user.name || user.email}`,
        timestamp: user.createdAt,
        user: user.name || user.email
      })),
      ...recentMeetings.map(meeting => ({
        id: `meeting-${meeting.id}`,
        type: 'meeting_created',
        description: `Meeting scheduled for ${meeting.date.toLocaleDateString()}`,
        timestamp: meeting.createdAt,
        details: meeting.cities
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);

    // Format the response
    const analyticsData = {
      userStats: {
        totalUsers,
        activeUsers,
        adminUsers,
        managerUsers,
        regularUsers
      },
      meetingStats: {
        totalMeetings,
        weeklyMeetingData
      },
      recentActivity: recentActivity.map(activity => ({
        ...activity,
        timestamp: activity.timestamp.toISOString()
      }))
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}