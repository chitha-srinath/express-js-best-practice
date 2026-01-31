import { Server as socketServer, Socket } from 'socket.io';
import { RoomService } from './src/services/room.service';
import { Server } from 'http';
import { RoomHandler } from './src/socket/handlers/RoomHandler';
import { MessageHandler } from './src/socket/handlers/MessageHandler';
import { ConnectionHandler } from './src/socket/handlers/ConnectionHandler';
import { ISocketHandler } from './src/socket/interfaces/ISocketHandler';
import { SocketEvents } from './src/socket/constants/events';

/**
 * Socket.IO server class that handles real-time communication.
 * Manages WebSocket connections, room operations, and message broadcasting.
 */
export class SocketServer {
  private roomService!: RoomService;
  private handlers: ISocketHandler[] = [];
  private io: socketServer;

  /**
   * Initializes the Socket.IO server with HTTP server and room service.
   * Sets up all socket event handlers for real-time communication.
   * @param httpServer The HTTP server instance to attach Socket.IO to
   */
  constructor(httpServer: Server) {
    this.io = new socketServer(httpServer, { path: '/socket' });
    this.roomService = new RoomService(this.io);

    // Initialize Handlers
    this.handlers.push(new RoomHandler(this.roomService));
    this.handlers.push(new MessageHandler(this.roomService));
    this.handlers.push(new ConnectionHandler(this.roomService));

    this.setupSocketHandlers();
  }

  /**
   * Configures all socket event handlers for connection, room operations, and messaging.
   * Handles socket lifecycle events and error scenarios.
   */
  private setupSocketHandlers(): void {
    this.io.on(SocketEvents.CONNECTION, (socket: Socket) => {
      this.handlers.forEach((handler) => handler.handle(socket));
    });
  }
}
