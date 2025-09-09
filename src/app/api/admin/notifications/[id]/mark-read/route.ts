import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-utils';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const notificationId = params.id;

    // Find the notification
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Mark as read
    const updatedNotification = await db.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    // Format for response
    const formattedNotification = {
      id: updatedNotification.id,
      type: updatedNotification.type,
      title: updatedNotification.title,
      message: updatedNotification.message,
      isRead: updatedNotification.isRead,
      priority: updatedNotification.priority,
      metadata: updatedNotification.metadata ? JSON.parse(updatedNotification.metadata) : null,
      userId: updatedNotification.userId,
      createdAt: updatedNotification.createdAt.toISOString(),
      updatedAt: updatedNotification.updatedAt.toISOString(),
    };

    return NextResponse.json({
      notification: formattedNotification,
      message: 'Notification marked as read',
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}