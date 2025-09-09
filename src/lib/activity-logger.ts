import { db } from '@/lib/db';

export interface ActivityLogData {
  action: string;
  description: string;
  userId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class ActivityLogger {
  /**
   * Create an activity log entry
   */
  static async log(data: ActivityLogData) {
    try {
      const activityLog = await db.activityLog.create({
        data: {
          action: data.action,
          description: data.description,
          userId: data.userId,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });

      return activityLog;
    } catch (error) {
      console.error('Error creating activity log:', error);
      return null;
    }
  }

  /**
   * Log user login activity
   */
  static async logLogin(userId: string, ipAddress?: string, userAgent?: string) {
    return this.log({
      action: 'login',
      description: 'User logged in successfully',
      userId,
      ipAddress,
      userAgent,
      metadata: { loginMethod: 'web' }
    });
  }

  /**
   * Log user logout activity
   */
  static async logLogout(userId: string, ipAddress?: string, userAgent?: string) {
    return this.log({
      action: 'logout',
      description: 'User logged out',
      userId,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log meeting creation activity
   */
  static async logMeetingCreated(
    userId: string, 
    meetingId: string, 
    cities: string[], 
    ipAddress?: string, 
    userAgent?: string
  ) {
    return this.log({
      action: 'meeting_created',
      description: `Meeting scheduled for ${cities.join(', ')}`,
      userId,
      ipAddress,
      userAgent,
      metadata: { 
        meetingId,
        cities
      }
    });
  }

  /**
   * Log preference update activity
   */
  static async logPreferenceUpdated(
    userId: string,
    cityId: number,
    action: 'added' | 'removed' | 'updated',
    ipAddress?: string,
    userAgent?: string
  ) {
    const actionMap = {
      'added': 'preference_added',
      'removed': 'preference_removed',
      'updated': 'preference_updated'
    };

    return this.log({
      action: actionMap[action],
      description: `Time zone preference ${action}`,
      userId,
      ipAddress,
      userAgent,
      metadata: { 
        cityId,
        preferenceAction: action
      }
    });
  }

  /**
   * Log user management activities
   */
  static async logUserManagement(
    adminUserId: string,
    targetUserId: string,
    action: 'created' | 'updated' | 'deleted' | 'role_changed',
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    const actionMap = {
      'created': 'user_created',
      'updated': 'user_updated',
      'deleted': 'user_deleted',
      'role_changed': 'user_role_changed'
    };

    return this.log({
      action: actionMap[action],
      description: `User ${action}: ${targetUserId}`,
      userId: adminUserId,
      ipAddress,
      userAgent,
      metadata: { 
        targetUserId,
        userAction: action,
        details
      }
    });
  }

  /**
   * Log system configuration changes
   */
  static async logSystemChange(
    userId: string,
    section: string,
    action: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    return this.log({
      action: 'system_config_changed',
      description: `System ${section} ${action}`,
      userId,
      ipAddress,
      userAgent,
      metadata: { 
        section,
        configAction: action,
        details
      }
    });
  }

  /**
   * Log failed login attempts
   */
  static async logFailedLogin(
    email: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    return this.log({
      action: 'login_failed',
      description: `Failed login attempt for ${email}: ${reason}`,
      ipAddress,
      userAgent,
      metadata: { 
        email,
        failureReason: reason
      }
    });
  }

  /**
   * Get recent activity logs for a user
   */
  static async getUserActivity(userId: string, limit: number = 10) {
    try {
      const logs = await db.activityLog.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      return logs;
    } catch (error) {
      console.error('Error fetching user activity:', error);
      return [];
    }
  }

  /**
   * Get activity statistics
   */
  static async getActivityStats(days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [totalLogs, uniqueUsers, actionCounts] = await Promise.all([
        db.activityLog.count({
          where: {
            createdAt: {
              gte: startDate
            }
          }
        }),
        db.activityLog.groupBy({
          by: ['userId'],
          where: {
            createdAt: {
              gte: startDate
            },
            userId: {
              not: null
            }
          }
        }).then(result => result.length),
        
        db.activityLog.groupBy({
          by: ['action'],
          where: {
            createdAt: {
              gte: startDate
            }
          },
          _count: {
            action: true
          }
        })
      ]);

      const actionStats = actionCounts.reduce((acc, item) => {
        acc[item.action] = item._count.action;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalLogs,
        uniqueUsers,
        actionStats,
        dateRange: `${days} days`
      };
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      return {
        totalLogs: 0,
        uniqueUsers: 0,
        actionStats: {},
        dateRange: `${days} days`
      };
    }
  }
}