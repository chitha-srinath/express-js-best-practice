import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../socket/constants/events';

type SocketEvent = string;
type SocketData = unknown;

/**
 * Service for managing socket.io rooms and broadcasting events.
 * Handles joining, leaving, and broadcasting to rooms.
 */
export class RoomService {
  private rooms: Map<string, Set<string>> = new Map();

  /**
   * Initializes the RoomService with a socket.io server instance.
   * @param io The socket.io server instance
   */
  constructor(private io: Server) {}

  /**
   * Adds a socket to a room and notifies all users in the room.
   * @param socket The socket to join the room
   * @param roomId The room ID to join
   */
  async joinRoom(socket: Socket, roomId: string): Promise<void> {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }

    const room = this.rooms.get(roomId);
    if (!room) return;

    room.add(socket.data.userId);
    socket.data.rooms.add(roomId);

    await socket.join(roomId);

    this.io.to(roomId).emit(SocketEvents.ROOM.JOINED, {
      roomId,
      users: Array.from(room),
    });
  }

  /**
   * Removes a socket from a room and notifies all users in the room.
   * @param socket The socket to leave the room
   * @param roomId The room ID to leave
   */
  async leaveRoom(socket: Socket, roomId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.delete(socket.data.userId);
    socket.data.rooms.delete(roomId);

    if (room.size === 0) {
      this.rooms.delete(roomId);
    }

    await socket.leave(roomId);

    this.io.to(roomId).emit(SocketEvents.ROOM.LEFT, {
      roomId,
      users: Array.from(room),
    });
  }

  /**
   * Gets the list of user IDs in a room.
   * @param roomId The room ID
   * @returns Array of user IDs in the room
   */
  getRoomUsers(roomId: string): string[] {
    return Array.from(this.rooms.get(roomId) || new Set());
  }

  /**
   * Broadcasts an event with data to all users in a room.
   * @param roomId The room ID
   * @param event The event name
   * @param data The data to broadcast
   */
  broadcastToRoom(roomId: string, event: SocketEvent, data: SocketData): void {
    this.io.to(roomId).emit(event, data);
  }
}
