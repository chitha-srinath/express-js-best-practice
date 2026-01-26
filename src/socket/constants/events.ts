export const SocketEvents = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  ROOM: {
    JOIN: 'room:join',
    JOINED: 'room:joined',
    LEAVE: 'room:leave',
    LEFT: 'room:left',
  },
  MESSAGE: {
    SEND: 'message:send',
    RECEIVE: 'message:receive',
  },
  ERROR: 'error',
} as const;
