import { Server as socketServer, Socket } from 'socket.io';
import { RoomService } from './src/services/room.service';
import { Server } from 'http';
import { RoomHandler } from './src/socket/handlers/RoomHandler';
import { MessageHandler } from './src/socket/handlers/MessageHandler';
import { ConnectionHandler } from './src/socket/handlers/ConnectionHandler';

/**
 * Socket.IO server class that handles real-time communication.
 * Manages WebSocket connections, room operations, and message broadcasting.
 */
export class SocketServer {
  private roomService!: RoomService;
  private roomHandler!: RoomHandler;
  private messageHandler!: MessageHandler;
  private connectionHandler!: ConnectionHandler;
  private io: socketServer;

  /**
   * Initializes the Socket.IO server with HTTP server and room service.
   * Sets up all socket event handlers for real-time communication.
   * @param httpServer The HTTP server instance to attach Socket.IO to
   */
  constructor(httpServer: Server) {
    this.io = new socketServer(httpServer);
    this.roomService = new RoomService(this.io);

    // Initialize Handlers
    this.roomHandler = new RoomHandler(this.roomService);
    this.messageHandler = new MessageHandler(this.roomService);
    this.connectionHandler = new ConnectionHandler(this.roomService);

    this.setupSocketHandlers();
  }

  /**
   * Configures all socket event handlers for connection, room operations, and messaging.
   * Handles socket lifecycle events and error scenarios.
   */
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      // Handle room joining
      socket.on('room:join', (data: { roomId: string }) => {
        this.roomHandler.handleJoinRoom(socket, data);
      });

      // Handle room leaving
      socket.on('room:leave', (data: { roomId: string }) => {
        this.roomHandler.handleLeaveRoom(socket, data);
      });

      // Handle messages
      socket.on('message:send', (data: { message: string; roomId: string }) => {
        this.messageHandler.handleSendMessage(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.connectionHandler.handleDisconnect(socket);
      });
    });
  }
}
