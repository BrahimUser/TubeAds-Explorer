import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from '../api/client';
import { socketBaseUrl } from '../config/api';

let socket: Socket | null = null;
let socketToken: string | null = null;

export async function getSocket(): Promise<Socket | null> {
  const token = await getAccessToken();
  if (!token) return null;

  if (socket && socketToken !== token) {
    socket.disconnect();
    socket = null;
    socketToken = null;
  }

  if (!socket) {
    socketToken = token;
    socket = io(socketBaseUrl(), {
      auth: { token },
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });
  } else if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketToken = null;
  }
}
