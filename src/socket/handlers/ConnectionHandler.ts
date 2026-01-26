import { Socket } from 'socket.io';
import { RoomService } from '../../services/room.service';
import { LoggerUtility } from '../../Utilities/LoggerUtility';
import { prismaConnection } from '../../utils/database';
import { ISocketHandler } from '../interfaces/ISocketHandler';
import { SocketEvents } from '../constants/events';

export class ConnectionHandler implements ISocketHandler {
  private readonly logger = LoggerUtility.getInstance(prismaConnection);

  constructor(private roomService: RoomService) {}

  public handle(socket: Socket): void {
    socket.on(SocketEvents.DISCONNECT, () => {
      void this.handleDisconnect(socket);
    });
  }

  private async handleDisconnect(socket: Socket): Promise<void> {
    try {
      // Leave all rooms
      if (socket.data.rooms) {
        const leavePromises = Array.from(socket.data.rooms).map((roomId) =>
          this.roomService.leaveRoom(socket, roomId as string),
        );
        await Promise.all(leavePromises);
      }
    } catch (error) {
      this.logger.error(
        `Error during socket disconnect: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
