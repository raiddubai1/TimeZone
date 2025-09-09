import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { requireRole } from '@/lib/auth-utils';

// Validation schema for meeting creation
const createMeetingSchema = z.object({
  date: z.string().datetime(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  cities: z.array(z.string()).min(2, 'At least 2 cities are required').max(5, 'Maximum 5 cities allowed'),
});

// Protected POST handler - requires user role
async function protectedPost(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = createMeetingSchema.parse(body);
    
    // Create meeting in database
    const meeting = await db.meeting.create({
      data: {
        date: new Date(validatedData.date),
        startTime: new Date(validatedData.startTime),
        endTime: new Date(validatedData.endTime),
        cities: JSON.stringify(validatedData.cities),
      },
    });
    
    return NextResponse.json({
      success: true,
      meeting: {
        ...meeting,
        cities: JSON.parse(meeting.cities), // Parse cities back to array for response
      },
    });
    
  } catch (error) {
    console.error('Error creating meeting:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create meeting' 
      },
      { status: 500 }
    );
  }
}

// Protected GET handler - requires user role
async function protectedGet() {
  try {
    // Get all meetings, ordered by creation date (newest first)
    const meetings = await db.meeting.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Parse cities from JSON string to array for each meeting
    const meetingsWithParsedCities = meetings.map(meeting => ({
      ...meeting,
      cities: JSON.parse(meeting.cities),
    }));
    
    return NextResponse.json({
      success: true,
      meetings: meetingsWithParsedCities,
    });
    
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch meetings' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Check if user has required role (user, manager, or admin)
  const authError = await requireRole(['user', 'manager', 'admin'], request);
  if (authError) {
    return authError;
  }
  
  return protectedPost(request);
}

export async function GET(request: NextRequest) {
  // Check if user has required role (user, manager, or admin)
  const authError = await requireRole(['user', 'manager', 'admin'], request);
  if (authError) {
    return authError;
  }
  
  return protectedGet();
}