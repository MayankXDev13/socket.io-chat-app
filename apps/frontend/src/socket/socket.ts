import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@repo/shared';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export function connectSocket(token: string): TypedSocket {
  if (socket?.connected) {
    socket.disconnect();
  }
  socket = io('http://localhost:3000', {
    auth: { token },
    transports: ['websocket'],
  }) as TypedSocket;
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): TypedSocket | null {
  return socket;
}