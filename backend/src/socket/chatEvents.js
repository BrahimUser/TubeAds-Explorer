import { getIo } from './index.js';
import { mapChatThread } from '../utils/mappers.js';

function participantRooms(thread) {
  return [thread.buyerId, thread.sellerId]
    .filter(Boolean)
    .map((uid) => `user:${uid}`);
}

export function emitNewMessage(message, thread) {
  const io = getIo();
  if (!io) return;

  io.to(`thread:${thread.id}`).emit('chat:message', message);

  const mappedThread = mapChatThread(thread);
  for (const room of participantRooms(thread)) {
    io.to(room).emit('chat:thread_updated', mappedThread);
  }
}

export function emitThreadCreated(thread) {
  const io = getIo();
  if (!io) return;

  const mappedThread = mapChatThread(thread);
  for (const room of participantRooms(thread)) {
    io.to(room).emit('chat:thread_updated', mappedThread);
  }
}
