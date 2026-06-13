import { io } from 'socket.io-client';
import { getAccessToken } from '../api/client';

function socketBaseUrl() {
  if (process.env.REACT_APP_SOCKET_URL) {
    return process.env.REACT_APP_SOCKET_URL;
  }
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
  return apiUrl.replace(/\/api\/?$/, '');
}

/** @type {import('socket.io-client').Socket | null} */
let socket = null;
let socketToken = null;

export function getSocket() {
  const token = getAccessToken();
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

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketToken = null;
  }
}
