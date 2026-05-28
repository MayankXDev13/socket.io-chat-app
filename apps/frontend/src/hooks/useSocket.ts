import { useState, useEffect } from 'react';
import { getSocket } from '@/socket/socket';
import type { Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@repo/shared';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket() {
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkSocket = () => {
      const s = getSocket();
      if (!s) return;
      setSocket(s);
      setIsConnected(s.connected);
      const onConnect = () => setIsConnected(true);
      const onDisconnect = () => setIsConnected(false);
      s.on('connect', onConnect);
      s.on('disconnect', onDisconnect);
      return () => {
        s.off('connect', onConnect);
        s.off('disconnect', onDisconnect);
      };
    };
    const cleanup = checkSocket();
    return cleanup;
  }, []);

  return { socket, isConnected };
}
