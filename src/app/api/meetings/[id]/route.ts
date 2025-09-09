import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for meeting update
const updateMeetingSchema = z.object({
  date: z.string().datetime(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  cities: z.array(z.string()).min(2, 'At least 2 cities are required').max(5, 'Maximum 5 cities allowed'),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = updateMeetingSchema.parse(body);
    
    // Check if meeting exists
    const existingMeeting = await db.meeting.findUnique({
      where: { id: params.id },
    });
    
    if (!existingMeeting) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Meeting not found' 
        },
        { status: 404 }
      );
    }
    
    // Update meeting in database
    const meeting = await db.meeting.update({
      where: { id: params.id },
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
    console.error('Error updating meeting:', error);
    
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
        error: 'Failed to update meeting' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if meeting exists
    const existingMeeting = await db.meeting.findUnique({
      where: { id: params.id },
    });
    
    if (!existingMeeting) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Meeting not found' 
        },
        { status: 404 }
      );
    }
    
    // Delete meeting from database
    await db.meeting.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Meeting deleted successfully',
    });
    
  } catch (error) {
    console.error('Error deleting meeting:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete meeting' 
      },
      { status: 500 }
    );
  }
}