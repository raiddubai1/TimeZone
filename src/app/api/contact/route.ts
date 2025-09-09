import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, subject, message } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters long" },
        { status: 400 }
      );
    }

    // Create contact submission in database
    const contactSubmission = await db.contactSubmission.create({
      data: {
        firstName,
        lastName,
        email,
        subject,
        message,
        status: 'pending', // pending, read, responded
      },
    });

    // In a real application, you would also:
    // 1. Send an email notification
    // 2. Create a ticket in a support system
    // 3. Send an auto-reply to the user

    return NextResponse.json({
      id: contactSubmission.id,
      message: "Contact form submitted successfully",
      timestamp: contactSubmission.createdAt,
    }, { status: 201 });

  } catch (error) {
    console.error("Error submitting contact form:", error);
    return NextResponse.json(
      { error: "Failed to submit contact form" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // In a real application, this would be protected by authentication
    const submissions = await db.contactSubmission.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to last 50 submissions
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error fetching contact submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact submissions" },
      { status: 500 }
    );
  }
}