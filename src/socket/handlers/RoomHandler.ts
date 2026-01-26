import { Socket } from 'socket.io';
import { RoomService } from '../../services/room.service';
import { LoggerUtility } from '../../Utilities/LoggerUtility';
import { prismaConnection } from '../../utils/database';

export class RoomHandler {
  private readonly logger = LoggerUtility.getInstance(prismaConnection);

  constructor(private roomService: RoomService) {}

  public handleJoinRoom(socket: Socket, data: { roomId: string }): void {
    try {
      this.roomService.joinRoom(socket, data.roomId);
    } catch (error) {
      this.logger.error(
        `Failed to join room: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      socket.emit('error', {
        message: 'Failed to join room',
        code: 'ROOM_JOIN_ERROR',
      });
    }
  }

  public handleLeaveRoom(socket: Socket, data: { roomId: string }): void {
    try {
      this.roomService.leaveRoom(socket, data.roomId);
    } catch (error) {
      this.logger.error(
        `Failed to leave room: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      socket.emit('error', {
        message: 'Failed to leave room',
        code: 'ROOM_LEAVE_ERROR',
      });
    }
  }
}
