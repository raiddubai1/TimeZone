import { getIO } from './socket';

/**
 * Helper function for API routes to broadcast socket events
 * This ensures that socket events are only emitted if the server is running
 */

/**
 * Broadcast team creation event from API routes
 */
export function emitTeamCreated(data: {
  team: any;
  members: string[];
  createdBy: string;
}) {
  const io = getIO();
  if (io) {
    io.emit('team:created', data);
    console.log('Team creation event broadcasted via API route');
  }
}

/**
 * Broadcast team update event from API routes
 */
export function emitTeamUpdated(data: {
  teamId: string;
  updates: any;
  members: string[];
  updatedBy: string;
}) {
  const io = getIO();
  if (io) {
    io.emit('team:updated', data);
    console.log('Team update event broadcasted via API route');
  }
}

/**
 * Broadcast team deletion event from API routes
 */
export function emitTeamDeleted(data: {
  teamId: string;
  members: string[];
  deletedBy: string;
}) {
  const io = getIO();
  if (io) {
    io.emit('team:deleted', data);
    console.log('Team deletion event broadcasted via API route');
  }
}

/**
 * Broadcast member addition event from API routes
 */
export function emitMemberAdded(data: {
  teamId: string;
  member: any;
  addedBy: string;
  members: string[];
}) {
  const io = getIO();
  if (io) {
    io.emit('member:added', data);
    console.log('Member addition event broadcasted via API route');
  }
}

/**
 * Broadcast member removal event from API routes
 */
export function emitMemberRemoved(data: {
  teamId: string;
  memberId: string;
  removedBy: string;
  members: string[];
}) {
  const io = getIO();
  if (io) {
    io.emit('member:removed', data);
    console.log('Member removal event broadcasted via API route');
  }
}

/**
 * Broadcast member role update event from API routes
 */
export function emitMemberRoleUpdated(data: {
  teamId: string;
  memberId: string;
  newRole: string;
  updatedBy: string;
  members: string[];
}) {
  const io = getIO();
  if (io) {
    io.emit('member:roleUpdated', data);
    console.log('Member role update event broadcasted via API route');
  }
}