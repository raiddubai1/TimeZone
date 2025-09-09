import { Server } from 'socket.io';
import { db } from '@/lib/db';

// Global socket.io server instance
let io: Server | null = null;

// Socket.IO server configuration
const socketConfig = {
  path: '/api/socketio',
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.ALLOWED_ORIGINS?.split(',') || []
      : ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ['websocket', 'polling'] as const,
};

/**
 * Initialize Socket.IO server instance
 * @param httpServer - HTTP server instance
 * @returns Socket.IO server instance
 */
export function initIO(httpServer: any): Server {
  if (io) {
    console.log('Socket.IO server already initialized');
    return io;
  }

  io = new Server(httpServer, socketConfig);
  
  setupSocketHandlers(io);
  
  console.log('Socket.IO server initialized with path:', socketConfig.path);
  return io;
}

/**
 * Get existing Socket.IO server instance
 * @returns Socket.IO server instance or null
 */
export function getIO(): Server | null {
  return io;
}

/**
 * Setup Socket.IO event handlers
 * @param io - Socket.IO server instance
 */
function setupSocketHandlers(io: Server) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Room management for team list updates
    socket.on('join-team-list', (userId: string) => {
      if (userId) {
        socket.join(`team-list:${userId}`);
        console.log(`Client ${socket.id} joined team list for user ${userId}`);
      }
    });

    socket.on('leave-team-list', (userId: string) => {
      if (userId) {
        socket.leave(`team-list:${userId}`);
        console.log(`Client ${socket.id} left team list for user ${userId}`);
      }
    });

    // Room management for team detail updates
    socket.on('join-team-detail', (teamId: string) => {
      if (teamId) {
        socket.join(`team-detail:${teamId}`);
        console.log(`Client ${socket.id} joined team detail for team ${teamId}`);
      }
    });

    socket.on('leave-team-detail', (teamId: string) => {
      if (teamId) {
        socket.leave(`team-detail:${teamId}`);
        console.log(`Client ${socket.id} left team detail for team ${teamId}`);
      }
    });

    // Team event handlers (these are emitted by API routes)
    socket.on('team:created', (data: {
      team: any;
      members: string[];
      createdBy: string;
    }) => {
      // Broadcast to all team members' team list rooms
      data.members.forEach((userId: string) => {
        io.to(`team-list:${userId}`).emit('team:created', {
          team: data.team,
          timestamp: new Date().toISOString(),
        });
      });
      
      console.log('Team creation broadcasted:', data.team.name);
    });

    socket.on('team:updated', (data: {
      teamId: string;
      updates: any;
      members: string[];
      updatedBy: string;
    }) => {
      // Broadcast to all team members' team list rooms
      data.members.forEach((userId: string) => {
        io.to(`team-list:${userId}`).emit('team:updated', {
          teamId: data.teamId,
          updates: data.updates,
          timestamp: new Date().toISOString(),
        });
      });
      
      // Also broadcast to team detail room
      io.to(`team-detail:${data.teamId}`).emit('team:updated', {
        teamId: data.teamId,
        updates: data.updates,
        timestamp: new Date().toISOString(),
      });
      
      console.log('Team update broadcasted:', data.teamId);
    });

    socket.on('team:deleted', (data: {
      teamId: string;
      members: string[];
      deletedBy: string;
    }) => {
      // Broadcast to all team members' team list rooms
      data.members.forEach((userId: string) => {
        io.to(`team-list:${userId}`).emit('team:deleted', {
          teamId: data.teamId,
          timestamp: new Date().toISOString(),
        });
      });
      
      console.log('Team deletion broadcasted:', data.teamId);
    });

    socket.on('member:added', (data: {
      teamId: string;
      member: any;
      addedBy: string;
      members: string[];
    }) => {
      // Broadcast to all team members' team list rooms
      data.members.forEach((userId: string) => {
        io.to(`team-list:${userId}`).emit('member:added', {
          teamId: data.teamId,
          member: data.member,
          timestamp: new Date().toISOString(),
        });
      });
      
      // Also broadcast to team detail room
      io.to(`team-detail:${data.teamId}`).emit('member:added', {
        teamId: data.teamId,
        member: data.member,
        timestamp: new Date().toISOString(),
      });
      
      console.log('Member addition broadcasted:', data.member.user.email);
    });

    socket.on('member:removed', (data: {
      teamId: string;
      memberId: string;
      removedBy: string;
      members: string[];
    }) => {
      // Broadcast to all remaining team members' team list rooms
      data.members.forEach((userId: string) => {
        io.to(`team-list:${userId}`).emit('member:removed', {
          teamId: data.teamId,
          memberId: data.memberId,
          timestamp: new Date().toISOString(),
        });
      });
      
      // Also broadcast to team detail room
      io.to(`team-detail:${data.teamId}`).emit('member:removed', {
        teamId: data.teamId,
        memberId: data.memberId,
        timestamp: new Date().toISOString(),
      });
      
      console.log('Member removal broadcasted:', data.memberId);
    });

    socket.on('member:roleUpdated', (data: {
      teamId: string;
      memberId: string;
      newRole: string;
      updatedBy: string;
      members: string[];
    }) => {
      // Broadcast to all team members' team list rooms
      data.members.forEach((userId: string) => {
        io.to(`team-list:${userId}`).emit('member:roleUpdated', {
          teamId: data.teamId,
          memberId: data.memberId,
          newRole: data.newRole,
          timestamp: new Date().toISOString(),
        });
      });
      
      // Also broadcast to team detail room
      io.to(`team-detail:${data.teamId}`).emit('member:roleUpdated', {
        teamId: data.teamId,
        memberId: data.memberId,
        newRole: data.newRole,
        timestamp: new Date().toISOString(),
      });
      
      console.log('Member role update broadcasted:', data.memberId, 'to', data.newRole);
    });

    // Legacy room support (for backward compatibility)
    socket.on('join-cities-updates', () => {
      socket.join('cities-updates');
      console.log('Client joined cities updates room:', socket.id);
    });

    socket.on('join-preferences-updates', () => {
      socket.join('preferences-updates');
      console.log('Client joined preferences updates room:', socket.id);
    });

    socket.on('join-time-updates', () => {
      socket.join('time-updates');
      console.log('Client joined time updates room:', socket.id);
    });

    socket.on('join-activity-logs', () => {
      socket.join('activity-logs');
      console.log('Client joined activity logs room:', socket.id);
    });

    socket.on('join-admin-notifications', () => {
      socket.join('admin-notifications');
      console.log('Client joined admin notifications room:', socket.id);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log('Client disconnected:', socket.id, 'Reason:', reason);
    });

    // Send connection confirmation
    socket.emit('connected', {
      socketId: socket.id,
      message: 'Real-time connection established',
      timestamp: new Date().toISOString(),
    });
  });
}

/**
 * Broadcast team creation event
 * @param data - Team creation data
 */
export function broadcastTeamCreated(data: {
  team: any;
  members: string[];
  createdBy: string;
}) {
  if (io) {
    io.emit('team:created', data);
  }
}

/**
 * Broadcast team update event
 * @param data - Team update data
 */
export function broadcastTeamUpdated(data: {
  teamId: string;
  updates: any;
  members: string[];
  updatedBy: string;
}) {
  if (io) {
    io.emit('team:updated', data);
  }
}

/**
 * Broadcast team deletion event
 * @param data - Team deletion data
 */
export function broadcastTeamDeleted(data: {
  teamId: string;
  members: string[];
  deletedBy: string;
}) {
  if (io) {
    io.emit('team:deleted', data);
  }
}

/**
 * Broadcast member addition event
 * @param data - Member addition data
 */
export function broadcastMemberAdded(data: {
  teamId: string;
  member: any;
  addedBy: string;
  members: string[];
}) {
  if (io) {
    io.emit('member:added', data);
  }
}

/**
 * Broadcast member removal event
 * @param data - Member removal data
 */
export function broadcastMemberRemoved(data: {
  teamId: string;
  memberId: string;
  removedBy: string;
  members: string[];
}) {
  if (io) {
    io.emit('member:removed', data);
  }
}

/**
 * Broadcast member role update event
 * @param data - Member role update data
 */
export function broadcastMemberRoleUpdated(data: {
  teamId: string;
  memberId: string;
  newRole: string;
  updatedBy: string;
  members: string[];
}) {
  if (io) {
    io.emit('member:roleUpdated', data);
  }
}

// Legacy setup function for backward compatibility
export const setupSocket = setupSocketHandlers;