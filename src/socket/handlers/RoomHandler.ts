import { Socket } from 'socket.io';
import { RoomService } from '../../services/room.service';
import { LoggerUtility } from '../../Utilities/LoggerUtility';
import { prismaConnection } from '../../utils/database';
import { ISocketHandler } from '../interfaces/ISocketHandler';
import { SocketEvents } from '../constants/events';

export class RoomHandler implements ISocketHandler {
  private readonly logger = LoggerUtility.getInstance(prismaConnection);

  constructor(private roomService: RoomService) {}

  public handle(socket: Socket): void {
    socket.on(SocketEvents.ROOM.JOIN, (data: { roomId: string }) => {
      void this.handleJoinRoom(socket, data);
    });

    socket.on(SocketEvents.ROOM.LEAVE, (data: { roomId: string }) => {
      void this.handleLeaveRoom(socket, data);
    });
  }

  private async handleJoinRoom(socket: Socket, data: { roomId: string }): Promise<void> {
    try {
      await this.roomService.joinRoom(socket, data.roomId);
    } catch (error) {
      this.logger.error(
        `Failed to join room: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      socket.emit(SocketEvents.ERROR, {
        message: 'Failed to join room',
        code: 'ROOM_JOIN_ERROR',
      });
    }
  }

  private async handleLeaveRoom(socket: Socket, data: { roomId: string }): Promise<void> {
    try {
      await this.roomService.leaveRoom(socket, data.roomId);
    } catch (error) {
      this.logger.error(
        `Failed to leave room: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      socket.emit(SocketEvents.ERROR, {
        message: 'Failed to leave room',
        code: 'ROOM_LEAVE_ERROR',
      });
    }
  }
}
