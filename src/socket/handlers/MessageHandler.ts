import { Socket } from 'socket.io';
import { RoomService } from '../../services/room.service';
import { LoggerUtility } from '../../Utilities/LoggerUtility';
import { prismaConnection } from '../../utils/database';

export class MessageHandler {
  private readonly logger = LoggerUtility.getInstance(prismaConnection);

  constructor(private roomService: RoomService) {}

  public handleSendMessage(socket: Socket, data: { message: string; roomId: string }): void {
    try {
      const messageData = {
        message: data.message,
        from: socket.data.userId,
        timestamp: Date.now(),
      };

      this.roomService.broadcastToRoom(data.roomId, 'message:receive', messageData);
    } catch (error) {
      this.logger.error(
        `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      socket.emit('error', {
        message: 'Failed to send message',
        code: 'MESSAGE_SEND_ERROR',
      });
    }
  }
}
