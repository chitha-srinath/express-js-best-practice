import { createServer } from 'http';
import { App } from './app';
import { env } from './src/config/config';
import { SocketServer } from './socket-server';
import './src/subscribers/auth.subscriber';
/**
 * Creates and starts the HTTP server with Express application and Socket.IO.
 * Initializes the server on the configured port and sets up real-time communication.
 */
const expressServer = new App().app;

const httpServer = createServer(expressServer);

/**
 * Initialize Socket.IO server for real-time communication.
 * Handles WebSocket connections and room management.
 */
new SocketServer(httpServer);

/**
 * Start the HTTP server and listen on the configured port.
 * Logs server startup information using the application logger.
 */
httpServer.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port http://localhost:${env.PORT}`);
});

export default httpServer;
