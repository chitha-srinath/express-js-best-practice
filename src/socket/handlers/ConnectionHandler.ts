import { Socket } from 'socket.io';
import { RoomService } from '../../services/room.service';
import { LoggerUtility } from '../../Utilities/LoggerUtility';
import { prismaConnection } from '../../utils/database';

export class ConnectionHandler {
  private readonly logger = LoggerUtility.getInstance(prismaConnection);

  constructor(private roomService: RoomService) {}

  public handleDisconnect(socket: Socket): void {
    try {
      // Leave all rooms
      if (socket.data.rooms) {
        socket.data.rooms.forEach((roomId: string) => {
          this.roomService.leaveRoom(socket, roomId);
        });
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
