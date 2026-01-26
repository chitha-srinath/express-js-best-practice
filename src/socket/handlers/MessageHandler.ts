import { Socket } from 'socket.io';
import { RoomService } from '../../services/room.service';
import { LoggerUtility } from '../../Utilities/LoggerUtility';
import { prismaConnection } from '../../utils/database';
import { ISocketHandler } from '../interfaces/ISocketHandler';
import { SocketEvents } from '../constants/events';

export class MessageHandler implements ISocketHandler {
  private readonly logger = LoggerUtility.getInstance(prismaConnection);

  constructor(private roomService: RoomService) {}

  public handle(socket: Socket): void {
    socket.on(SocketEvents.MESSAGE.SEND, (data: { message: string; roomId: string }) => {
      this.handleSendMessage(socket, data);
    });
  }

  private handleSendMessage(socket: Socket, data: { message: string; roomId: string }): void {
    try {
      const messageData = {
        message: data.message,
        from: socket.data.userId,
        timestamp: Date.now(),
      };

      this.roomService.broadcastToRoom(data.roomId, SocketEvents.MESSAGE.RECEIVE, messageData);
    } catch (error) {
      this.logger.error(
        `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      socket.emit(SocketEvents.ERROR, {
        message: 'Failed to send message',
        code: 'MESSAGE_SEND_ERROR',
      });
    }
  }
}
